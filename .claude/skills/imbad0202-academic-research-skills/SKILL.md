---
name: academic-research-writer
description: Guides Claude through a structured academic research workflow — research, write, review, revise, finalize — for producing papers, literature reviews, and scholarly reports; use whenever a user asks for help researching a topic or producing/polishing academic or research-style writing.
---

# Academic Research Writer

This skill helps Claude produce rigorous, well-structured academic writing —
research papers, literature reviews, theses sections, scholarly reports, or
any document that needs to read as careful, evidence-based scholarship rather
than casual prose. Apply it whenever a user asks to research a topic, draft
or outline an academic document, write a literature review, or review/revise
an existing piece of academic writing.

## When to apply this skill

- The user asks to research a topic and produce a written summary, report, or paper.
- The user asks for a literature review or synthesis of existing work on a subject.
- The user asks Claude to draft, review, or revise academic or scholarly writing (including thesis chapters, abstracts, or research proposals).
- The user asks for feedback on the rigor, structure, or clarity of research writing.

Do not apply this skill to casual writing, marketing copy, or short informal
summaries — use it only when the task is explicitly academic or research-oriented.

## Workflow

Work through five phases in order. Do not skip a phase, but adapt its depth
to the scope of the request — a short summary needs a lighter pass than a
full paper.

### 1. Research

- Clarify the research question or claim the document needs to support before writing anything. If the user's request is vague, ask a single focused clarifying question rather than guessing at scope.
- Gather and organize the relevant evidence, arguments, and sources available (from the conversation, provided documents, or the user's own knowledge). Note explicitly where evidence is thin or contested.
- Identify the structure the field expects (e.g., IMRaD for empirical work, thematic synthesis for a literature review) and decide which structure fits this document.
- Keep a running list of open questions or gaps that still need the user's input — surface these rather than silently filling them in with invented facts.

### 2. Write

- Draft section by section, following the structure chosen in the research phase.
- Every claim of fact or characterization of prior work must be traceable to a specific source or piece of evidence provided by the user or conversation — never fabricate citations, data, or study results. If a citation is needed but not available, mark it clearly (e.g., "[citation needed]") instead of inventing one.
- Write in formal academic register: precise terminology, hedged claims where evidence is limited ("suggests," "is consistent with," rather than overclaiming), and consistent tense (typically past tense for prior findings, present tense for the document's own argument).
- Maintain a clear thesis or research question that every section visibly supports.

### 3. Review

- Re-read the draft as a skeptical reviewer, not the author. Check for:
  - Logical gaps: does each claim follow from the evidence presented?
  - Structural coherence: does each section do one job and connect to the next?
  - Overclaiming: any statement stronger than the evidence supports?
  - Missing counterarguments or limitations that a reviewer would flag.
- Summarize the review findings as a short list of concrete issues, ranked by severity, before revising.

### 4. Revise

- Address the review findings directly, prioritizing correctness and logical soundness over stylistic polish.
- Tighten prose: remove redundancy, replace vague hedges with precise ones, ensure paragraph-level topic sentences match their content.
- Re-check that every citation, number, and quoted claim still matches its source after edits.

### 5. Finalize

- Do a final consistency pass: terminology used the same way throughout, heading structure consistent, citation style consistent (whatever style the user specified or the field's convention implies).
- Confirm the document answers the original research question or supports the original thesis, and flag to the user any remaining open gaps (missing citations, unverified claims, sections needing more evidence) rather than silently smoothing over them.
- Present the finalized document along with a short list of any unresolved gaps that need the user's attention.

## Principles throughout

- Never fabricate sources, data, statistics, or quotes. When evidence is missing, say so explicitly rather than inventing something plausible.
- Prefer precise, falsifiable claims over vague, sweeping ones.
- Keep the user in the loop on judgment calls about scope, structure, and interpretation of ambiguous evidence — these are not Claude's to decide silently.
