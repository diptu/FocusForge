# FocusForge — Technical Vision

**Version:** 1.0 · **Date:** 2026-07-07 · **Owner:** dip (solo founder/dev)

## Context
FocusForge is a solo-built personal learning analytics system: log study sessions across Quant, IELTS, JS, Stats, and Deep Learning, then turn that log into a feedback loop that tells you what's weak and what to do next. One user (you), one deployment, no external customers. The CTO lens here is scaled accordingly — no org design, no hiring, no vendor DPAs. What still applies: pick bets deliberately, keep irreversible calls few and deliberate, don't build what the mission doesn't need.

## What we're building toward (12–24 months)
A closed-loop mastery system: **log → analyze → detect weakness → replan → re-measure**. Not a static dashboard — a system that changes what you study tomorrow based on what you logged today. Success looks like: you open FocusForge once a week, it tells you exactly which skill is regressing and what to drill, and you trust the number enough to act on it without re-deriving it yourself.

## What we're explicitly NOT building
- **Not a multi-tenant SaaS.** No auth-for-others, no billing, no team accounts. If this ever becomes a product for other people, that's a distinct future decision with its own vision doc — don't let multi-user creep into the schema or API shape now.
- **Not a content platform.** FocusForge tracks *your* study of Quant/IELTS/JS/Stats/DL; it does not host courses, videos, or become a generic LMS.
- **Not mobile-native.** Web-first (Next.js), responsive is enough; no React Native/Swift/Kotlin investment.
- **Not microservices.** One backend (NestJS), one database (Postgres). Splitting services is a solved-a-problem-you-don't-have move at this scale.
- **Not real-time/collab.** No websockets, no live sync between devices beyond normal request/response. Solo user, sequential usage.

## The bets that compound
1. **Get the skill/session data model right early (irreversible-ish).** Every downstream feature — analytics, weakness detection, planned-vs-actual — reads from the same study-session schema. A wrong shape here (e.g., skills as free-text instead of a taxonomy) compounds into rewrite cost across every feature. Spend the extra day on this now.
2. **Prisma + Postgres as the single source of truth (reversible, but expensive to reverse).** Typed migrations over 5 study domains keep schema drift from becoming silent bugs. Bet: schema discipline now is cheaper than data-cleanup later.
3. **NestJS as a modular monolith, not services.** Modules per domain (study-log, analytics, weakness-engine, reporting) inside one deployable. Compounds by staying cheap to run and easy to reason about solo, while leaving a clean seam to split later *if* ever needed — but that's a `/cto pivot` decision, not a default.
4. **End-to-end type safety between Next.js and NestJS.** Solo dev has no QA team to catch integration drift; shared/generated types between frontend and backend are the substitute. Worth the setup cost once.
5. **The weekly report is the actual product, not the logger.** The logger is just data entry. The compounding bet is the weakness-detection + planned-vs-actual engine — that's the part that gets more valuable the longer you log, and the part worth protecting from scope cuts.

## Metrics that prove we're right
- **Logging friction:** time to log one study session stays under ~15s — if logging gets tedious, the data feed dies and everything downstream is starved.
- **Weekly report actually opened and acted on** (self-reported/tracked) — the loop only works if the output changes behavior.
- **Weakness-detection accuracy:** flagged weak skills match what you already suspect are weak, validated periodically by you, not just by the metric it was trained to optimize.
- **Planned-vs-actual adherence trending up over time** — the system is working if the gap between plan and reality shrinks.
- **Zero schema drift incidents:** Prisma migrations stay the only path to schema change; no hand-edited prod schema.

## Revision log
- 2026-07-07 — v1.0 initial vision, written pre-code (repo currently has only README + LICENSE).
