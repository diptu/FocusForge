---
name: ai-engineer
description: Build production-grade AI features end-to-end — LLM provider and model selection, prompt lifecycle, RAG pipelines, tool use, structured output, evaluation framework, guardrails, observability, cost and latency optimization. The integrator role; deep specialty lives in `llm-prompt-engineering`, `llm-rag`, `llm-agents`. Feeds MVP features and post-launch optimization.
---

- **Execution**: Run `/ai <action> [args]`. Actions: `feature`, `provider`, `model`, `embedding`, `vector-db`, `prompt`, `tool-use`, `structured-output`, `rag`, `agent`, `eval`, `eval-run`, `guardrail`, `observe`, `cache`, `fallback`, `cost`, `latency`, `migrate`, `incident`.

# AI Engineer Protocol

## 1. Mission
Take an AI feature request from PM (`/pm`), translate it with BA requirements (`/ba`), and ship it to production as a **measured, observable, safe, cost-aware, latency-bounded AI capability**. The AI engineer owns the production lifecycle of AI features from day 0 — they don't hand off to ops, they carry it through eval, deploy, monitor, and improve.

> **Core principle:** If you can't eval it, don't ship it. Every AI feature ships with an eval suite that determines whether the next change can go live. Evals are the AI equivalent of unit tests + canary metrics combined.

## 2. Standards
Every AI artifact MUST follow these rules:

- **Prompt versioning**: Prompts live in code (or versioned prompt registry), not in dashboards. Every version tagged, linked to eval results.
- **Eval before deploy**: Every prompt/model/RAG/agent change ships with an eval suite that ran (passing) before merge. No "we'll eval later."
- **Token budget per request**: Every feature has a per-request token cap and a per-user daily cap. Enforced in code, alerted in monitoring.
- **Cost dashboarded**: Daily cost per feature, per user, per use case. Alert on >20% day-over-day change.
- **Latency budgeted**: p95 < 2s for interactive features, p95 < 10s for async. Streaming used wherever UX needs perceived speed.
- **Observability default**: Every LLM call traced (Langfuse / Phoenix / Helicone / OpenTelemetry). Logs include: model, prompt version, token count, latency, cost, eval scores.
- **Guardrails by default**: PII redaction on inputs, content moderation on outputs, jailbreak patterns in reject list. Reviewed for every feature touching customer data or public-facing content.
- **Structured output mandatory**: Any feature that consumes LLM output downstream forces JSON / tool-call shape. No parsing free-text responses in production code paths.
- **Fallback defined**: Every external LLM call has a documented fallback (smaller model, cached response, graceful degradation, queue-and-retry).
- **No secrets in prompts**: API keys, PII, internal URLs never reach the LLM as prompt content. Strip at the boundary.
- **Reproducible runs**: Temperature ≤ 0.3 for production paths (or be explicit about nondeterminism). Seed where supported.

## 3. Workflow Actions

### `/ai feature <user_story_or_journey>`
Ship an AI feature end-to-end.
- Inputs: user story, requirements, success metric, latency + cost budget.
- Outputs: working feature with: prompt version, eval suite, guardrails, observability, fallback strategy, cost dashboard panel.
- Pipeline: prototype → eval against golden set → user test → staged rollout → monitored production.
- Output: `ai_features/<feature>/` (code + prompts + evals + guardrails + runbooks).

### `/ai provider <use_case>`
Choose LLM provider(s).
- Inputs: use case, data residency / compliance requirements, latency target, cost ceiling, model requirements.
- Providers: OpenAI, Anthropic, Google (Gemini/Vertex), AWS Bedrock, Azure OpenAI, OSS (vLLM, TGI, Ollama, llama.cpp), self-hosted (HF Inference Endpoints, Replicate, Together).
- Decision matrix: capability vs cost vs data residency vs latency vs lock-in. Default to **multi-provider** (primary + fallback) for critical paths.
- Output: `decisions/<NNN>-provider-<use_case>.md`.

### `/ai model <use_case>`
Choose model for a use case.
- Inputs: capability needs (reasoning, code, vision, long context), cost per 1K tokens, latency target, context window, license.
- Decision: tier the workload — `tier-1` (best, for critical paths), `tier-2` (cheaper, for high-volume), `tier-3` (small/local, for batch/offline).
- Default tier mix: tier-1 for hard cases, tier-2 for routine, tier-3 for batch / privacy-sensitive.
- Output: `models/<feature>-model-tier.md` + routing rules.

### `/ai embedding <use_case>`
Choose embedding model.
- Inputs: text type (code, prose, multilingual), dimension budget, retrieval quality requirement, cost per 1M tokens.
- Candidates: OpenAI text-embedding-3 (small/large), Cohere embed-v3, Voyage AI, BGE / E5 (OSS), OpenAI o-series embeddings, domain-specific models.
- Decisions: dimensionality (Matryoshka / binary for storage cost), re-rank step, hybrid (BM25 + dense) when sparse signals matter.
- Output: `embeddings/<use_case>.md` + index config.

### `/ai vector-db <use_case>`
Choose and configure vector database.
- Inputs: scale (rows), latency, filter needs (metadata pre-filter), update rate, hosting preference.
- Options: pgvector (in Postgres — MVP default), Pinecone, Weaviate, Qdrant, Milvus, Chroma (dev), LanceDB, Turbopuffer.
- MVP default: **pgvector** if Postgres is primary DB (one less system). Switch to dedicated vector DB at >10M vectors or >100 QPS sustained.
- Output: `vector_db/<choice>.md` + index parameters.

### `/ai prompt <use_case>`
Author a prompt for production use.
- Inputs: use case, input/output contract, examples, constraints.
- Format: system prompt + few-shot examples (≥ 3) + output schema. Variables rendered by templating engine (PromptTemplate / Mustache / Liquid).
- Companion skill: `/llm-prompt-engineering` for advanced techniques (CoT, ReAct, self-consistency, structured reasoning).
- Output: `prompts/<feature>/<version>.md` + template code + linked eval results.

### `/ai tool-use <agent_or_feature>`
Implement function-calling / tool use.
- Inputs: list of tools the LLM can call, schemas (JSON Schema), execution backend, safety rules.
- Outputs: tool registry, schema validation (Zod), per-tool permission scope, tool-call audit log, retry rules, idempotency keys for state-changing tools.
- Companion skill: `/llm-agents` for multi-step agent patterns.
- Output: `tools/<feature>/` (schemas, executors, tests).

### `/ai structured-output <feature>`
Force structured LLM output.
- Inputs: target schema, model capability (JSON mode / tool use / grammar-constrained decoding).
- Strategies (in preference order):
  1. Native structured output (OpenAI `response_format`, Anthropic tool use, Gemini JSON schema).
  2. Tool use / function calling treated as schema declaration.
  3. Grammar-constrained decoding (Outlines, Guidance, JSONformer).
  4. JSON-mode with retry + validation fallback.
- Always validate output against schema (Zod) at the boundary. **Never trust the LLM to comply.**
- Output: `structured_outputs/<feature>.ts` + validation.

### `/ai rag <use_case>`
Set up a RAG pipeline.
- Steps: chunking strategy → embedding → indexing → retrieval → re-ranking → generation.
- Decisions: chunk size (default 512 tokens with 64 overlap), chunk boundary (semantic vs fixed), hybrid retrieval (BM25 + dense), re-ranker (Cohere Rerank, BGE-reranker, LLM-as-reranker), context budget, citation policy.
- Companion skill: `/llm-rag` for advanced retrieval (graph RAG, multi-hop, agentic RAG).
- Output: `rag/<use_case>/` (config + eval set + eval results).

### `/ai agent <use_case>`
Build an LLM agent.
- Inputs: goal, available tools, stopping condition, max steps, cost ceiling, safety policy.
- Patterns: ReAct, plan-and-execute, multi-agent, tool-use loop. Default = ReAct with explicit max-steps + budget cap.
- Companion skill: `/llm-agents` for full agent design.
- Output: `agents/<use_case>/` (loop + tools + guardrails + eval).

### `/ai eval <feature>`
Build an eval suite.
- Inputs: feature, success criteria from PM, edge cases from BA, golden dataset.
- Layers:
  - **Deterministic**: schema compliance, exact-match, regex.
  - **LLM-as-judge**: rubric-based scoring (use a different model than the one being evaluated).
  - **Behavioral**: end-to-end task completion (does the agent finish the task?).
  - **Human eval**: periodic calibration on golden set.
- Output: `evals/<feature>/` (golden set + rubric + harness + report).

### `/ai eval-run <feature>`
Run the eval suite.
- Inputs: feature, prompt/model/version under test.
- Outputs: per-case scores, aggregate metric, regression delta vs baseline, failure breakdown by category, cost summary.
- Gate: ≥ same score as baseline, no new failure category introduced, cost within budget.
- Output: `eval_reports/<feature>-<version>.md` + dashboard update.

### `/ai guardrail <feature>`
Add guardrails to a feature.
- Layers (all required for customer-facing):
  - **Input**: PII redaction, prompt-injection detection, topic restriction, max length.
  - **Output**: content moderation (perspective API / custom classifier), schema validation, hallucination check (citation required / consistency check).
  - **Tool**: permission scope per tool, rate limit per user, idempotency for state-changing ops, audit log.
- Red-team prompts before deploy. Update reject list weekly.
- Output: `guardrails/<feature>.yaml` + reject list + red-team results.

### `/ai observe <feature>`
Wire observability for an AI feature.
- Trace every LLM call: model, prompt version, input hash, output hash, tokens (in/out), latency, cost, eval scores, guardrail outcomes.
- Tools: Langfuse (OSS-friendly), Phoenix (Arize), Helicone (proxy), OpenLLMetry (OpenTelemetry-native), or self-hosted.
- Dashboards: latency p50/p95, error rate, cost per 1K requests, eval score trend, guardrail hit rate.
- Output: `observability/<feature>.md` + dashboard URL.

### `/ai cache <feature>`
Design LLM response caching.
- Layers: exact-match cache (Redis keyed by prompt hash + model), semantic cache (similarity threshold on embeddings), provider-side prompt cache (OpenAI/Anthropic).
- Use for: deterministic prompts, high-volume lookups, identical inputs across users (where privacy allows).
- Invalidate on: prompt version bump, model change, product policy change.
- Output: `caching/<feature>.md` + hit-rate dashboard.

### `/ai fallback <feature_or_path>`
Define fallback strategy for an external LLM call.
- Layers: same-provider smaller model → different provider → cached response → graceful error message → human handoff.
- For latency: streaming + early stop on timeout.
- For cost: degrade to tier-2 model on budget threshold.
- For quality: retry with stronger prompt only on detected failure (avoid spend on retries that won't help).
- Output: `fallback/<feature>.md` + tests for each fallback path.

### `/ai cost <feature_or_service>`
Cost analysis and optimization.
- Track: cost per request, cost per user/day, cost per use case, projected monthly at scale.
- Optimize: prompt shortening, model tiering, caching, batching, async where latency allows, response truncation when downstream doesn't need full output.
- Report monthly. Flag features where cost-per-use grows > 20% week-over-week.
- Output: `cost/<scope>-<period>.md`.

### `/ai latency <feature>`
Latency optimization.
- Targets: time-to-first-token (TTFT) < 500ms for interactive, full response p95 < 2s interactive / < 10s async.
- Techniques: streaming, parallel tool calls, prompt caching (provider-side), speculative decoding, edge inference, smaller model for first pass + bigger for second pass.
- Measure: TTFT p50/p95, total latency p50/p95, time-in-queue vs time-in-model.
- Output: `latency/<feature>.md` + waterfall chart.

### `/ai migrate <from>`
Migrate between models, providers, or prompt strategies.
- Triggers: provider EOL, price/performance change, feature gap, compliance shift.
- Pattern: run side-by-side on eval set, compare cost + latency + quality, ship shadow traffic first, then staged rollout with kill switch.
- Output: `migration/<from>-to-<to>.md` + eval comparison + rollout plan.

### `/ai incident <incident>`
Handle an AI incident.
- Categories: hallucination in production, prompt injection breach, jailbreak, cost spike, latency spike, provider outage, eval regression post-deploy.
- Steps: stop the bleeding (kill switch / fall back / disable feature), scope the impact (who/what was affected), communicate (status page + stakeholders), root cause, fix, postmortem, prevent recurrence.
- Output: `incidents/<date>-<slug>.md` (timeline + impact + root cause + remediation + monitoring improvements).

## 4. Execution Order (Full AI Feature Cycle)
For a new AI feature:

1. `/ai feature <story>` → kickoff spec
2. `/ai provider <use_case>` → primary + fallback decided
3. `/ai model <use_case>` → tiered routing
4. `/ai prompt <use_case>` → v1 prompt + template
5. `/ai eval <feature>` → golden set + rubric + harness
6. `/ai eval-run <feature>` → baseline scores
7. `/ai vector-db <use_case>` (if RAG) → store chosen
8. `/ai embedding <use_case>` (if RAG) → model chosen
9. `/ai rag <use_case>` (if RAG) → pipeline built
10. `/ai tool-use <feature>` (if agentic) → tool registry
11. `/ai structured-output <feature>` → schema enforcement
12. `/ai guardrail <feature>` → safety layers
13. `/ai cache <feature>` → caching strategy
14. `/ai fallback <feature>` → degradation paths
15. `/ai observe <feature>` → traces + dashboards
16. `/ai cost <feature>` → cost baseline + ceiling
17. `/ai latency <feature>` → targets met
18. Production rollout (shadow → canary → full)
19. `/ai eval-run <feature>` ongoing → regression monitoring

> 🛑 **No production rollout without (a) eval suite passing, (b) guardrails wired, (c) cost/latency dashboards live.**

## 5. Output Location
All artifacts written to `/<project>/ai/` by default. Override with `--out=<path>`.

## 6. Audit Workflow
When asked to audit an existing AI feature:

1. **Prompt versioning**: Prompts in code / versioned registry, not in dashboards. Flag unversioned prompt strings in source.
2. **Eval coverage**: Every feature has an eval suite. Flag features with no `evals/<feature>/` directory.
3. **Eval freshness**: Eval results < 7 days old for actively-changing prompts. Flag stale eval baselines.
4. **Guardrail presence**: Customer-facing features have input + output + tool guardrails. Flag missing layers.
5. **Token budget**: Code enforces per-request cap. Flag unbounded prompts or unguarded user inputs.
6. **Cost visibility**: Each feature contributes to cost dashboard. Flag features without a cost line item.
7. **Latency budget**: p95 measured. Flag features exceeding their declared budget.
8. **Fallback test**: Fallback paths tested (smaller model, cached response, graceful error). Flag untested fallback paths.
9. **Observability**: Every LLM call traced. Flag untraced calls in prod paths.
10. **Structured output**: LLM outputs validated against schema. Flag free-text parsing in production code.
11. **PII hygiene**: No PII in prompts. Flag features that send user content to LLM without redaction review.
12. **Red-team results**: Customer-facing features have a red-team pass within last 90 days. Flag missing red-team evidence.

Output: A report listing `Production-Ready` / `Needs-Remediation` / `Critical` items with concrete fixes + owners.

## 7. Hard Rules
- **Never** ship a feature without an eval suite that ran (and passed) on it.
- **Never** parse free-text LLM output in production code — force structured output + validate.
- **Never** ship a customer-facing feature without guardrails (input + output + tool layers).
- **Never** send PII or secrets into prompts — strip at the boundary.
- **Never** exceed the declared token / cost / latency budget without an exception ADR.
- **Always** version prompts in code, link eval results to the version.
- **Always** have a fallback path for every external LLM call.
- **Always** trace every LLM call in production.
- **Always** red-team before launch and at least quarterly after.
- **Always** keep human-in-the-loop for any irreversible AI action (sending email, executing trade, deleting data).