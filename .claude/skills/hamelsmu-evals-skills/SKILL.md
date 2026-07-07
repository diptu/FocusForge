---
name: llm-eval-error-analysis
description: Build or audit an evaluation pipeline for an LLM-powered feature by starting from error analysis on real transcripts rather than generic metrics — use when a user needs to measure whether an AI feature actually works or wants to design pass/fail tests for it.
---

# LLM Evaluation via Error Analysis

This skill helps design evaluation systems for LLM-powered applications (chatbots, RAG pipelines, agents, extractors, classifiers) that catch real failures instead of producing a reassuring but meaningless score. It is grounded in the practice taught in evals-focused engineering courses: look at your data before you build metrics, and separate what code can check from what only human or LLM judgment can check.

## When to apply this skill

- A user is shipping or already running an LLM-powered feature and asks "how do I know if this works" or "how do I test this."
- A user has an eval suite already, but it isn't catching the failures users actually report, or nobody on the team trusts its scores.
- A user wants to build an LLM-as-judge grader and needs confidence that the judge's verdicts are trustworthy rather than arbitrary.
- A user has a pile of transcripts, logs, or user complaints and needs a systematic way to turn them into a test suite.

## Step-by-step workflow

1. **Pull real examples first.** Before writing any metric or test, gather actual inputs/outputs from the system — production traces, support tickets, or realistic manual runs. Aim for at least 20-30 examples. Only fall back to synthetic examples if no real usage exists yet, and say so explicitly since synthetic data misses failure modes real usage surfaces.

2. **Do open-ended error analysis, not scoring.** Read through the examples one at a time and write a short free-text note on anything wrong with each — wrong facts, ignored instructions, bad formatting, missing citations, wrong tone, hallucinated details. Resist the urge to force these into categories yet; the point is to see what's actually there.

3. **Cluster notes into a named failure taxonomy.** Group the free-text notes into a small number of concrete, specific failure modes (e.g. "cites a source not present in context," "ignores a stated user constraint," "returns invalid JSON"). A good failure mode is specific enough that two people reading the same output would agree whether it occurred — vague labels like "not helpful" are a sign the taxonomy needs to be split further.

4. **Route each failure mode to code or to an LLM judge.** For every failure mode in the taxonomy, ask whether it can be checked deterministically (schema validity, forbidden words, broken links, length limits) — if so, write it as a plain code assertion, not an LLM call. Reserve LLM-as-judge only for failure modes that genuinely require semantic understanding.

5. **Write binary judge prompts, not scales.** For each failure mode needing an LLM judge, write a narrow prompt asking a single yes/no question with the pass/fail criteria spelled out concretely, and ask the judge to give a short rationale before its verdict — reasoning-before-verdict measurably improves judge consistency. Avoid 1-5 or 1-10 scales; they invite inconsistent grading and hide what a given score actually means.

6. **Validate every LLM judge against human labels before trusting it.** Hand-label a held-out set of examples pass/fail for the specific failure mode. Run the judge prompt on the same set and compute agreement, looking separately at false positives (judge fails something a human passed) and false negatives (judge passes something a human failed) — these usually point to different prompt fixes. Never ship a judge that hasn't been checked this way.

7. **Assemble a suite that reports per-failure-mode, not one overall score.** Combine the code assertions and validated judges into a suite that runs against any batch of outputs and reports pass/fail broken down by failure mode, plus an aggregate. A single blended score hides which specific thing is broken.

8. **Re-run error analysis as the system evolves.** Treat the taxonomy and suite as living artifacts. When the underlying prompt, model, or feature changes, sample fresh transcripts and check whether new failure modes have appeared that the current suite doesn't cover.

## Pitfalls to flag for the user

- Picking off-the-shelf metrics (BLEU, ROUGE, generic "helpfulness" scores) before doing any error analysis — these rarely align with the failure modes specific to the feature being built.
- Building an LLM judge and never validating it against human-labeled examples — this produces evals that look rigorous but don't actually measure anything.
- Using a single overall quality score instead of a per-failure-mode breakdown, which makes it impossible to tell a reviewer what to actually fix.
- Treating eval as a one-time deliverable instead of re-running error analysis whenever the feature changes meaningfully.
- Writing an LLM judge for something code could check deterministically, which adds cost and flakiness for no benefit.
