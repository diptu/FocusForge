import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";

export interface PlanGenerationInput {
  description: string;
  durationWeeks: number;
  currentScores: { label: string; score: string }[];
  /** Every Skill name currently in the system — lets the model recognize
   * what's already a real category instead of guessing from a static list. */
  existingSkillNames: string[];
  /** Existing Skill names the learner explicitly picked to target — the
   * model must use these verbatim rather than a paraphrase, so
   * goals.service.ts's case-insensitive name match reliably finds the
   * existing Skill instead of creating a near-duplicate. */
  targetSkillNames: string[];
}

const WEEKLY_HOURS_TIERS = [40, 30, 20] as const;

/**
 * Constrains the model's response so the caller can JSON.parse it directly.
 * Business-invariant validation (exactly these three hour tiers, positive
 * minutes, etc.) still happens afterward in goal-plan.rules.ts — a schema
 * guarantees shape, not correctness.
 */
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    options: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          weeklyHours: { type: "integer", enum: [...WEEKLY_HOURS_TIERS] },
          summary: { type: "string" },
          skills: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                isNewCategory: { type: "boolean" },
                subSkills: { type: "array", items: { type: "string" } },
                weeklyMinutes: { type: "integer" },
              },
              required: ["name", "isNewCategory", "subSkills", "weeklyMinutes"],
              additionalProperties: false,
            },
          },
          tentativeScores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                current: { type: "string" },
                projected: { type: "string" },
                note: { type: "string" },
              },
              required: ["label", "current", "projected", "note"],
              additionalProperties: false,
            },
          },
        },
        required: ["weeklyHours", "summary", "skills", "tentativeScores"],
        additionalProperties: false,
      },
    },
  },
  required: ["options"],
  additionalProperties: false,
} as const;

@Injectable()
export class AnthropicPlanGeneratorService {
  private client?: Anthropic;

  constructor(private readonly config: ConfigService) {}

  // Lazy on purpose: goal planning is one optional feature among several in
  // this API. Constructing the Anthropic client eagerly would mean a
  // missing ANTHROPIC_API_KEY fails Nest's dependency injection at boot and
  // takes down every other endpoint (skills, sessions, planned targets)
  // with it — so the missing-key error only surfaces when this feature is
  // actually used.
  private getClient(): Anthropic {
    if (!this.client) {
      const apiKey = this.config.get<string>("ANTHROPIC_API_KEY");
      if (!apiKey) {
        throw new InternalServerErrorException(
          "ANTHROPIC_API_KEY is not configured — set it in apps/api/.env to use goal planning",
        );
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  /** Returns the raw parsed JSON — caller runs it through validateGeneratedOptions. */
  async generate(input: PlanGenerationInput): Promise<unknown> {
    let response: Anthropic.Message;
    try {
      response = await this.getClient().messages.create({
        model: "claude-opus-4-8",
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: {
          effort: "high",
          format: { type: "json_schema", schema: RESPONSE_SCHEMA },
        },
        messages: [{ role: "user", content: this.buildPrompt(input) }],
      });
    } catch (error) {
      // Surface the real reason (bad key, rate limit, low credit balance,
      // etc.) instead of letting it collapse into a bare 500 — this is the
      // one call in the app that depends on a third-party account being in
      // good standing, so the failure mode is genuinely different from an
      // internal bug.
      if (error instanceof Anthropic.APIError) {
        throw new ServiceUnavailableException(`Claude API error: ${error.message}`);
      }
      throw error;
    }

    if (response.stop_reason === "refusal") {
      throw new InternalServerErrorException(
        "The planning request was declined by the model — try rephrasing the goal.",
      );
    }

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );
    if (!textBlock) {
      throw new InternalServerErrorException("No plan text returned by the model");
    }

    try {
      return JSON.parse(textBlock.text);
    } catch {
      throw new InternalServerErrorException("Model response was not valid JSON");
    }
  }

  private buildPrompt(input: PlanGenerationInput): string {
    const scoresText =
      input.currentScores.length > 0
        ? input.currentScores.map((s) => `- ${s.label}: ${s.score}`).join("\n")
        : "(none provided)";

    const existingText =
      input.existingSkillNames.length > 0 ? input.existingSkillNames.join(", ") : "(none yet)";

    const targetText =
      input.targetSkillNames.length > 0
        ? `The learner explicitly wants this plan to cover these existing categories: ${input.targetSkillNames.join(", ")}. Use these exact names (verbatim, same spelling/capitalization) in the skills array, and set isNewCategory to false for each of them. You may still add other categories the goal implies beyond this list.`
        : "The learner did not pin any specific existing categories — infer the relevant ones entirely from the goal description below.";

    return `A learner has this goal: "${input.description}"
They want to achieve it in ${input.durationWeeks} week(s).

Categories that already exist in the system: ${existingText}

${targetText}

Current mock-test / baseline scores:
${scoresText}

Generate exactly 3 candidate weekly study plans for this goal, at 40, 30, and 20 hours per week each. For each plan:
- Identify the exam(s) or subject(s) implied by the goal as skill names (e.g. "GRE", "IELTS"), and break the weekly hours down across them. If a skill name exactly matches one of the existing categories listed above, use that exact name and set isNewCategory to false. Otherwise mark it isNewCategory true and propose 3-6 sub-skills it should be broken into (e.g. GRE -> Verbal Reasoning, Quantitative Reasoning, Analytical Writing, Vocabulary).
- weeklyMinutes per skill should sum to approximately weeklyHours * 60.
- Write a short (1-2 sentence) summary of the plan's approach and pacing.
- If a current score was provided for a relevant exam, project a tentative improved score for that plan's commitment level and timeframe, with a brief note explaining the reasoning. Be conservative and realistic — this is a rough estimate, not a guarantee, and should be labeled as such in the note. If no baseline score was given for an exam, omit it from tentativeScores entirely rather than guessing a starting point.
- Higher weekly-hour plans should show a larger (but still realistic) projected improvement than lower-commitment plans, and the summaries should make the pacing tradeoff between the three plans clear.`;
  }
}
