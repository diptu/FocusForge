import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SkillsService } from "../skills/skills.service";
import { PlannedTargetsService } from "../planned-targets/planned-targets.service";
import { AnthropicPlanGeneratorService } from "../llm/anthropic-plan-generator.service";
import {
  validateGoalInput,
  validateGeneratedOptions,
  ValidGeneratedSkillAllocation,
} from "../domain/goal-plan.rules";
import { weekStartMonday, addDaysUTC } from "../domain/date-utils";
import { CreateGoalDto } from "./dto/create-goal.dto";

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
    private readonly plannedTargets: PlannedTargetsService,
    private readonly planGenerator: AnthropicPlanGeneratorService,
  ) {}

  async create(dto: CreateGoalDto) {
    const validated = validateGoalInput(dto);
    if (!validated.ok) {
      throw new BadRequestException(validated.error);
    }
    return this.prisma.goal.create({
      data: {
        description: validated.value.description,
        durationWeeks: validated.value.durationWeeks,
        currentScores: validated.value.currentScores as unknown as Prisma.InputJsonValue,
        targetSkillIds: validated.value.targetSkillIds,
      },
    });
  }

  findAll() {
    return this.prisma.goal.findMany({
      orderBy: { id: "desc" },
      include: { planOptions: true, selectedPlanOption: true },
    });
  }

  async findOne(id: number) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
      include: { planOptions: { orderBy: { weeklyHours: "desc" } }, selectedPlanOption: true },
    });
    if (!goal) {
      throw new NotFoundException(`Goal ${id} not found`);
    }
    return goal;
  }

  // FF-goal-plan: ask the LLM for 3 candidate weekly plans (40/30/20h),
  // replacing any not-yet-selected candidates from a prior call.
  async generatePlans(id: number) {
    const goal = await this.findOne(id);
    if (goal.selectedPlanOptionId) {
      throw new BadRequestException({
        code: "GOAL_ALREADY_APPLIED",
        message: "This goal already has an applied plan — start a new goal to plan again.",
      });
    }

    const [allSkills, targetSkills] = await Promise.all([
      this.prisma.skill.findMany(),
      goal.targetSkillIds.length > 0
        ? this.prisma.skill.findMany({ where: { id: { in: goal.targetSkillIds } } })
        : Promise.resolve([]),
    ]);

    const raw = await this.planGenerator.generate({
      description: goal.description,
      durationWeeks: goal.durationWeeks,
      currentScores: (goal.currentScores as { label: string; score: string }[] | null) ?? [],
      existingSkillNames: allSkills.map((s) => s.name),
      targetSkillNames: targetSkills.map((s) => s.name),
    });

    const validated = validateGeneratedOptions(raw);
    if (!validated.ok) {
      throw new BadRequestException(validated.error);
    }

    await this.prisma.goalPlanOption.deleteMany({ where: { goalId: id } });
    await this.prisma.goalPlanOption.createMany({
      data: validated.value.map((option) => ({
        goalId: id,
        weeklyHours: option.weeklyHours,
        plan: { summary: option.summary, skills: option.skills } as unknown as Prisma.InputJsonValue,
        tentativeScores: option.tentativeScores as unknown as Prisma.InputJsonValue,
      })),
    });

    return this.findOne(id);
  }

  // Materializes the chosen candidate as real PlannedTarget rows across the
  // goal's timeframe — this is the point where a plan stops being LLM
  // output and starts being the same weekly-target data FF-16 already tracks.
  async selectPlanOption(goalId: number, optionId: number) {
    const goal = await this.findOne(goalId);
    if (goal.selectedPlanOptionId) {
      throw new BadRequestException({
        code: "GOAL_ALREADY_APPLIED",
        message: "This goal already has an applied plan.",
      });
    }
    const option = goal.planOptions.find((o) => o.id === optionId);
    if (!option) {
      throw new NotFoundException(`Plan option ${optionId} not found for goal ${goalId}`);
    }

    const plan = option.plan as unknown as {
      summary: string;
      skills: ValidGeneratedSkillAllocation[];
    };
    const weekStarts = this.weekStartsFor(goal.durationWeeks);

    for (const allocation of plan.skills) {
      const skill = await this.resolveOrCreateSkill(allocation);
      for (const weekStart of weekStarts) {
        await this.plannedTargets.setTarget({
          skillId: skill.id,
          weekStartDate: isoDate(weekStart),
          targetMinutes: allocation.weeklyMinutes,
        });
      }
    }

    await this.prisma.goal.update({
      where: { id: goalId },
      data: { selectedPlanOptionId: optionId, appliedAt: new Date() },
    });

    return this.findOne(goalId);
  }

  private weekStartsFor(durationWeeks: number): Date[] {
    const currentWeekStart = weekStartMonday(new Date());
    return Array.from({ length: durationWeeks }, (_, i) => addDaysUTC(currentWeekStart, 7 * i));
  }

  private async resolveOrCreateSkill(allocation: ValidGeneratedSkillAllocation) {
    const existing = await this.prisma.skill.findFirst({
      where: { name: { equals: allocation.name, mode: "insensitive" } },
    });
    if (existing) {
      return existing;
    }

    const created = await this.skills.create({ name: allocation.name });
    const uniqueSubSkillNames = [...new Set(allocation.subSkills)];
    for (const subSkillName of uniqueSubSkillNames) {
      await this.skills.createSubSkill(created.id, { name: subSkillName });
    }
    return created;
  }
}
