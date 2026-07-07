---
name: autonomous-sprint-orchestrator
description: Run the continuous sprint cycle — backlog triage, sprint planning, daily standup, execution tracking, blocker surfacing, demos, retrospectives, and velocity measurement. Coordinates all other skills through the sprint. Feeds the continuous evolution loop (Phase 12) with retrospective insights.
---

- **Execution**: Run `/sprint <action> [args]`. Actions: `plan`, `triage`, `standup`, `status`, `blocker`, `track`, `goal`, `demo`, `retro`, `velocity`, `capacity`, `scope-cut`, `dependency`, `escalate`, `improve`, `release-train`.

# Autonomous Sprint Orchestrator Protocol

## 1. Mission
Run the **continuous sprint cycle** end-to-end with minimal human babysitting — plan, track, surface blockers, drive demos, run retros, and feed improvement insights back into the product and engineering flywheels. The orchestrator does **not** build product — it removes friction so the people who build product can stay in flow.

> **Core principle:** Make the next action obvious. Every standup summary, every burndown, every retro output should answer "what do I do next?" for the people involved — not for managers.

## 2. Standards
Every sprint artifact MUST follow these rules:

- **Sprint length**: 1–2 weeks. Never longer. If you need more time, you're not slicing work small enough.
- **Sprint goal**: ONE clear, measurable goal per sprint. Not a list. If the team can't restate it in one sentence, the sprint is mis-scoped.
- **Capacity buffer**: Plan to 70–80% of theoretical capacity. 100% is a lie; 60% is over-buffered.
- **WIP limits**: Enforced per person (1–2 active items) and per team (sprint_goal_count / team_size + 2). WIP above the limit triggers a flag.
- **Standup default**: Async-first, max 15 minutes, focused on **blockers and risks**, not status reports. Status is visible from PRs/tickets.
- **Daily standup fields**: yesterday, today, blockers, risks. Anything else is cut.
- **Blocker SLA**: Surface in < 24h, escalate in < 72h, re-route or de-scope in < 1 week.
- **Demo every sprint**: Live or recorded. No "we'll demo next sprint because we're not done." Not done = not demoable = sprint goal missed.
- **Retrospective every sprint**: Action items have owner + deadline. Re-cycle old actions once max, then drop or escalate.
- **Velocity measured but not gamed**: Use story points OR cycle time, not both. Don't change the metric to look better mid-year.
- **Scope cuts are visible**: If a ticket is cut mid-sprint, log it with reason. Silent scope drift is worse than visible cuts.
- **Dependencies tracked from day 1**: Any cross-team or external dependency declared in the sprint plan, not at standup.
- **Inputs from skills, outputs to skills**: Pull from `/pm` (backlog), `/ea` (architecture decisions), `/ba` (requirements), `/cto` (capacity). Push status to `/cto` (velocity, DORA inputs) and `/pm` (scope signals).

## 3. Workflow Actions

### `/sprint plan <sprint_window>`
Plan a new sprint.
- Inputs: sprint window, team capacity, candidate stories, dependencies.
- Outputs: `sprint_plan.md` with: sprint goal, committed stories, capacity allocation per person, dependency map, risk register, definition of done.
- Rules: capacity = sum of available days × focus factor (0.6–0.7). Stretch items tagged separately and expected to be cut.
- Output: `sprints/<sprint_id>/sprint_plan.md` + linear/jira/equivalent.

### `/sprint triage <incoming_items>`
Triage incoming backlog items.
- Inputs: list of unprioritized items.
- Decision per item: **ready** (in scope, sized, has ACs from BA), **needs-design** (architectural input needed), **needs-clarification** (PM/BA must respond), **parking-lot** (defer with reason).
- Output: triaged items with `ready` items slotted into next sprint plan candidates.
- SLA: items in `needs-clarification` < 7 days or auto-escalate to PM.

### `/sprint standup <sprint_id>`
Generate the daily standup summary.
- Inputs: PR activity, ticket moves, CI status, last 24h.
- Outputs: standup summary grouped by person / team: yesterday (auto-collected), today (planned from board), blockers (synthesized), risks (flagged).
- Format: one-screen readable. Action items bolded. Posted to channel at fixed time.
- If the same blocker appears 2 days running → auto-escalate.
- Output: `sprints/<sprint_id>/standups/<date>.md`.

### `/sprint status <sprint_id>`
Current sprint status snapshot.
- Inputs: ticket board, burndown data, blocker log.
- Outputs: burndown chart, % completion, days remaining, scope-at-risk count, sprint goal confidence (on-track / at-risk / off-track).
- Refreshed automatically every 4h. Posted to channel daily + on-demand via `/sprint status`.
- Output: `sprints/<sprint_id>/status/<timestamp>.md` + dashboard URL.

### `/sprint blocker <description>`
Surface a blocker.
- Inputs: description, affected tickets, blocking party.
- Outputs: blocker entry with severity (P0/P1/P2), owner, due date, escalation path.
- Auto-routes: P0 to engineering manager + CTO, P1 to team lead, P2 to ticket owner.
- SLA: P0 < 4h, P1 < 24h, P2 < 72h.
- Output: `blocker_log.md` (append-only).

### `/sprint track <ticket_id>`
Track a ticket through its lifecycle.
- Inputs: ticket ID.
- Outputs: current state, age in current state, days remaining in sprint, dependencies, risk flag.
- Auto-warns on: ticket stalled > 2 days, ticket in review > 1 day, blocked dependency > 3 days.
- Output: ticket-level view (no artifact file — on-demand query).

### `/sprint goal <sprint_id>`
Check sprint goal progress.
- Inputs: sprint goal, current ticket status, story points / scope done.
- Outputs: confidence % (weighted by remaining work + risks), list of items endangering the goal, suggested cut list to save the goal.
- Triggered: daily, plus on-demand `/sprint goal`.
- If confidence < 60% with > 2 days remaining → flag for `/sprint scope-cut`.

### `/sprint demo <sprint_id>`
Prepare the sprint review demo.
- Inputs: completed stories in sprint, ticket completion list.
- Outputs: demo script (3–5 items, max 30 min), feature owner per item, talking points, "what's next" hook.
- Pre-flight: env up, accounts provisioned, demo data ready, rollback tested.
- Output: `sprints/<sprint_id>/demo/script.md` + recording links.

### `/sprint retro <sprint_id>`
Run a retrospective.
- Inputs: sprint outcome (goal hit/miss), standup summaries, blocker log, velocity delta, demo feedback.
- Format: 4Ls (Liked / Learned / Lacked / Longed-for) OR Start/Stop/Continue OR Sailboat. Pick one, stick to it for a quarter.
- Outputs: retro notes + action items (owner + deadline). Max 3 action items per retro. Old actions > 2 cycles old get escalated or dropped.
- Output: `sprints/<sprint_id>/retro.md`.

### `/sprint velocity <team_or_sprint>`
Measure team velocity.
- Inputs: completed story points (or cycle time) over N sprints.
- Outputs: rolling velocity (3-sprint average), trend, predictability ratio (actual / committed), per-person throughput.
- Use for: capacity planning next sprint, flagging teams with high variance (need scope discipline or stability work).
- Output: `metrics/velocity_<team>.md`.

### `/sprint capacity <team>`
Calculate team capacity for next sprint.
- Inputs: team size, available days (subtract PTO, holidays, on-call load, interview load), focus factor.
- Outputs: capacity in story points (or days) with confidence interval. Surfaces risks (e.g. "3 engineers on PTO + 1 on on-call = ~60% capacity").
- Output: `capacity_<team>_<sprint>.md`.

### `/sprint scope-cut <sprint_id> <item>`
Cut an item from the current sprint.
- Inputs: item ID, reason, who decided.
- Outputs: cut log entry + impact on sprint goal + auto-suggestion for what to add (if sprint goal is still achievable) OR what to descope (if at risk).
- Rule: requires PM or tech lead sign-off; logged publicly in the sprint channel.
- Output: append to `sprints/<sprint_id>/scope_cuts.md`.

### `/sprint dependency <description>`
Track a cross-team or external dependency.
- Inputs: dependent team, owner on their side, due date, impact if missed.
- Outputs: dependency entry in shared log, auto-reminder at 50% / 75% / 100% of lead time.
- Blocked dependencies trigger auto-escalation to engineering manager.
- Output: `dependencies.md` (cross-team shared).

### `/sprint escalate <blocker_or_risk>`
Escalate a blocker or risk to leadership.
- Inputs: item, current owner, time-blocked, impact.
- Outputs: escalation entry routed to: engineering manager (default), CTO (if > 1 team impact or > 3 days blocked), CEO (if MVP-launch-blocking).
- Each escalation includes: what's blocked, who's trying, what's needed, deadline.
- Output: `escalations.md` + channel post.

### `/sprint improve <theme>`
Propose a process improvement based on retro data.
- Inputs: theme (e.g. "code review delays", "unclear ACs"), observed data, proposed change.
- Outputs: improvement proposal with: problem statement, data, hypothesis, change to try, measurement, review date.
- Bound to ≤ 2 active improvement experiments at any time (process changes are work too).
- Output: `improvements/<theme>.md`.

### `/sprint release-train <release_id>`
Coordinate a release across multiple teams.
- Inputs: participating teams, feature freeze date, release date, integration dependencies, rollback plan.
- Outputs: release timeline with per-team cutoffs, integration milestones, go/no-go gates, comms plan, on-call rotation for release window.
- Run regular release-train meetings (weekly) until release.
- Output: `releases/<release_id>/release_plan.md` + status updates.

## 4. Execution Order (Sprint Cycle)

For a continuous sprint rhythm:

1. **End of last sprint**: `/sprint retro` + `/sprint demo`
2. **Before next sprint**: `/sprint velocity` + `/sprint capacity` + `/sprint plan`
3. **Daily during sprint**: `/sprint standup` (auto) + `/sprint status` (auto) + `/sprint goal` (daily check)
4. **On demand**: `/sprint track`, `/sprint blocker`, `/sprint scope-cut`, `/sprint escalate`
5. **Cross-sprint**: `/sprint dependency` (continuous), `/sprint release-train` (per release), `/sprint improve` (per quarter)

> 🎯 **Default automation**: standup, status, blocker detection, dependency reminders all run without human prompting. The orchestrator wakes up and posts.

## 5. Output Location
All sprint artifacts written to `/<project>/sprints/<sprint_id>/` by default. Cross-sprint artifacts (dependencies, escalations, improvements) written to `/<project>/sprints/_shared/`. Override with `--out=<path>`.

## 6. Audit Workflow
When asked to audit a team's sprint health:

1. **Sprint Goal Clarity**: Each sprint has ONE goal, not a list. Flag multi-goal sprints.
2. **Capacity Realism**: Planned ≤ 80% of theoretical capacity. Flag overcommit.
3. **WIP Discipline**: Active items per person ≤ 2. Flag context-switching loads.
4. **Blocker Resolution Time**: Median time from surface to unblock < 72h. Flag chronic blockers.
5. **Standup Quality**: Average standup < 15 min, blocker-focused. Flag status-report standups.
6. **Demo Frequency**: Every sprint has a demo. Flag "no demo" sprints.
7. **Retro Action Carryover**: < 25% of retro actions carry over to next retro. Flag stale actions.
8. **Velocity Trend**: Rolling 3-sprint velocity stable or improving. Flag sudden drops (could be tech debt, scope, or team change).
9. **Scope Cuts Visibility**: Cuts logged with reason. Flag hidden drift.
10. **Dependency Health**: Dependencies resolved before due date in > 80% of cases. Flag chronic cross-team blockers.
11. **Process Improvement Cadence**: ≤ 2 active experiments at a time. Flag process-overload.
12. **Engineering Health Input**: Velocity, blocker types, retro themes feed `/cto audit` for org-level health.

Output: A report listing `Healthy` / `Watch` / `Critical` items with concrete actions + owners.

## 7. Hard Rules
- **Never** start a sprint without a single, written sprint goal.
- **Never** run a sprint longer than 2 weeks.
- **Never** skip a demo, even if the sprint goal wasn't fully met — partial work deserves partial demo.
- **Never** carry a retro action more than 2 sprints without escalation or deletion.
- **Never** game velocity (changing definitions mid-year to look better).
- **Never** allow scope cuts to be silent — every cut is logged with reason.
- **Always** time-box standup to 15 min.
- **Always** surface blockers in < 24h, escalate in < 72h.
- **Always** feed retro insights back to `/pm` (product signals) and `/cto` (engineering health).
- **Always** treat process changes as work — cap active improvement experiments at 2.

## 8. Integration With Other Skills

The orchestrator is the **hub**, not a silo. It pulls from and pushes to:

| Pulls from | Purpose |
|---|---|
| `/pm` | Backlog, priorities, MVP scope signals |
| `/ba` | Story readiness, ACs, traceability |
| `/ea` + `/sa` | Architecture decisions, technical debt signals |
| `/cto` | Capacity, headcount, DORA inputs |
| `/sa` | Code-level quality signals from reviews |

| Pushes to | Purpose |
|---|---|
| `/pm` | Scope signals, missed-acceptance data, customer feedback |
| `/ba` | Story defects, missing ACs, requirement gaps |
| `/cto` | Velocity, blocker types, team health |
| `/ea` + `/sa` | Tech debt signals, recurring architectural pain |
| `/qa` | Defect rates, escape rates, flaky test patterns |
| Phase 12 | Continuous evolution inputs |
