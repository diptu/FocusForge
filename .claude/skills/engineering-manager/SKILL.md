---
name: engineering-manager
description: Production-grade engineering management practice — team charter + mission, org topology + Conway-aware team design, quarterly + annual planning, OKR setting + tracking, roadmap + prioritization + capacity planning, 1:1 framework, feedback delivery (SBI / COIN / Radical Candor), performance review + calibration + leveling, growth plans (IDP) + mentorship + sponsorship, onboarding + offboarding + knowledge transfer, hiring plan + structured interview loops + offer process + candidate experience, retention + stay interviews + recognition, rituals (standup / retro / kickoff / all-hands / demo), decision logs + RFC process + escalation paths, status updates + executive comms + incident comms, risk register + dependency management, engineering strategy + vision, stakeholder management, culture health + psychological safety + DEI, remote / async / distributed teams, meeting hygiene + maker-vs-manager schedule, delegation + trust, conflict resolution + difficult conversations + PIP, budget + vendor management, audit of management practice. The management default in the engineering cluster. Pairs with `engineering-code-review` (technical decisions + review culture), `engineering-audit` (management metrics in scorecard), `devops-sre` (reliability as a management value), `devops-documentation` (decision logs + RFCs + runbooks owned by team), `devops-ci` (tooling investment + capacity), every other engineering skill (each surface has a team owning it).
---

- **Execution**: Run `/em <action> [args]`. Actions: `charter`, `mission`, `topology`, `team-design`, `conway`, `plan-quarter`, `plan-annual`, `okr`, `roadmap`, `prioritize`, `capacity`, `headcount`, `1-1`, `feedback`, `radar`, `review`, `self-review`, `calibration`, `promotion`, `leveling`, `idp`, `mentorship`, `sponsorship`, `onboarding`, `offboarding`, `knowledge-transfer`, `hiring-plan`, `interview-loop`, `interview-bias`, `interview-calibration`, `offer`, `candidate-experience`, `retention`, `stay-interview`, `recognition`, `standup`, `retro`, `kickoff`, `demo`, `all-hands`, `decision-log`, `rfc`, `escalation`, `status`, `exec-update`, `incident-comms`, `risk-register`, `dependencies`, `strategy`, `vision`, `stakeholder`, `culture`, `safety`, `dei`, `remote`, `meeting`, `maker-time`, `delegate`, `trust`, `conflict`, `difficult`, `pip`, `exit`, `budget`, `vendor`, `audit`, `metric`, `health`, `transition`.

# Engineering Manager Protocol

## 1. Mission
Build an engineering management practice that is **chartered, planned, people-first, feedback-rich, decision-disciplined, ritual-cadenced, communication-regular, risk-aware, culture-healthy, and outcome-tracked**. The skill owns the conventions a team standardizes on — so 12 teams don't end up with 12 different cadences, 12 different ways of writing OKRs, 12 contradictory feedback models, and 12 different rituals that drain everyone.

> **Core principle:** Engineering management is the discipline of converting strategy into outcomes through people. People are the unit: hire well, develop them, retain them, give them clarity. Plan so priorities are explicit; capacity so commitments are realistic; rituals so cadence is predictable; decisions so paths are explainable. Communicate so leadership, peer teams, and customers are aligned. Surface risk early. Hold a culture where feedback flows freely, blameless postmortems are the norm, and growth is part of every 1:1. A great engineering manager makes the team look great; a bad one makes themselves look great at the team's expense. The job is the former.

## 2. Standards
Every team / manager / process MUST follow these rules:

- **Team has a charter**: mission (one sentence) + scope (what we own) + non-scope (what we don't) + customers (internal/external) + success metrics. Charter is short, public, reviewed quarterly.
- **OKRs / goals explicit**: 3-5 objectives + measurable key results. Set quarterly. Reviewed weekly. Outcomes not outputs.
- **Roadmap visible**: 1-quarter (now) + 3-quarter (next) + 1-year (later) buckets. Reviewed monthly. Owners explicit.
- **Capacity planned**: known engineering hours vs allocated hours. Allocate ≤ 70% to planned work; reserve 30% for ops + on-call + unplanned + learning.
- **1:1s are weekly + private**: 30 minutes, recurring, no agenda substitution, no "status update" slot. Manager's primary signal channel.
- **Feedback is continuous + specific + in private**: never the first time in a review; never the first time in a retro; never the first time in public. Frameworks (SBI / COIN / Radical Candor) standardize delivery.
- **Performance reviews are fair + calibrated + written**: written self-review + peer review + manager review + calibration meeting + written outcome. Calibration mitigates bias.
- **Leveling is explicit + documented**: ladder per level; expectations written; promotion requires evidence at the next level.
- **Hiring is plan-driven, not reactive**: yearly plan aligned to roadmap; structured loops; calibrated debriefs; offer committee; candidate experience measured.
- **Onboarding is structured**: 30/60/90 plan; buddy assigned; first-shipped PR / first-deployed service / first-archived knowledge as milestones.
- **Offboarding is documented**: knowledge transfer + access revocation + exit interview + 30/60/90 follow-up.
- **Decisions are logged**: decision logs (ADR-style) for non-trivial choices; RFCs for significant; retrospectives for past decisions.
- **Rituals are predictable**: standup / weekly team sync / monthly demo / monthly retro / quarterly planning / annual offsite. Cadence explicit. Calendar sacred.
- **Communication is multi-modal**: written async-first; weekly team newsletter; monthly exec update; quarterly business review. No surprise messages.
- **Risk is surfaced early**: top 5 risks in weekly status; escalation in cadence not after-the-fact.
- **Dependencies are tracked**: cross-team dependencies named + owner + due + escalation.
- **Culture is intentional**: psychological safety measured; blameless tone; conflict healthy; recognition frequent; learning explicit.
- **Remote / async friendly**: written-first; meetings have agendas + notes + decisions; "live" sessions are opt-in additions.
- **Meetings earn their existence**: every meeting has agenda + outcome + decision-maker + end-time. Default 25/50 minutes. Maker-time protected.
- **Manager time split**: ~30% people + 30% delivery + 20% strategy + 20% communication / coordination. Audit quarterly.
- **Metrics tracked + transparent**: DORA / SPACE / team health / engagement / attrition / cycle time / first-pass review rate. Reviewed monthly.
- **Recognition frequent + specific**: weekly shoutouts; quarterly awards; tied to behaviors + outcomes.
- **Conflict is healthy**: surfaced; addressed; resolved. Mediator (manager) avoids siding without hearing all sides.
- **Difficult conversations are prepared**: framework used; private; specific; outcome-driven; follow-up scheduled.
- **PIP is fair + rare + documented**: clear expectations + timeline + support + check-ins. Last resort, not first tool.
- **Decentralized decisions preferred**: team's scope expands as trust builds. Manager's role shifts from controller to coach as team matures.

## 3. Workflow Actions

### `/em charter [team]`
Author a team charter.
- Inputs: team, mission area, customer set, current scope.
- Outputs:
  ```markdown
  # Team Charter: <Team Name>

  ## Mission
  <One sentence: what this team exists to do.>

  ## Customers
  - Internal: <teams we serve>
  - External: <user personas>

  ## Scope (we own)
  - <service / domain>
  - <service / domain>

  ## Non-scope (we don't own)
  - <out of scope>
  - <handoff or partner team>

  ## Success metrics
  | Metric | Target |
  |---|
  | SLO compliance (tier-0) | ≥ 99.95% |
  | Deploy frequency | weekly+ |
  | MTTR (S1) | ≤ 1h |
  | Customer satisfaction (NPS / survey) | ≥ +30 |

  ## How we work
  - 1:1s weekly, 30 min, no-rolling
  - Standup daily, 15 min, written-first
  - Retro monthly, structured
  - Demo monthly, external invites
  - Planning quarterly, OKR + capacity

  ## Who we are
  - Manager: @<handle>
  - Engineers: @<list>
  - On-call rotation: <rotation>

  ## Last reviewed
  <YYYY-MM-DD>
  ```

### `/em mission [org_or_team]`
Mission / vision / values statement.
- Inputs: org or team, audience (internal / public).
- Outputs:
  - Mission (what we do, for whom, why now).
  - Vision (what success looks like in 2-3 years).
  - Values (3-5 principles that guide tradeoffs).

### `/em topology [org]`
Org topology / team boundaries.
- Inputs: org size, product surface, customer segments.
- Outputs:
  - Org shapes compared:
    | Shape | Strength | Weakness |
    |---|---|---|
    | Functional (eng / product / design) | Deep expertise; clear career paths | Cross-functional projects hard |
    | Cross-functional (squad / pod / tribe) | Outcome ownership; speed | Specialist depth diluted |
    | Matrix | Flexible | Two-boss conflicts |
    | Stream-aligned (Spotify model) | Customer-focused | Bus factor if small |
    | Platform + product | Reusability + velocity | Platform-product tension |
  - Conway-aware: design org to match desired system boundaries (inverse Conway maneuver).
  - Recommendation + tradeoffs.
  - Pair: `/doc arch` for the technical counterpart.

### `/em team-design [team]`
Design a team.
- Inputs: team mission, scope, surface to own, customer set, expected velocity.
- Outputs:
  - Team size (3-9 engineers typical; pair-programmed = 6-12; 2-pizza rule).
  - Composition (FE / BE / SRE / ML / Data).
  - Dependencies (cross-team).
  - Mission + charter (links to `/em charter`).
  - Bus factor for the surface (alert if 1).
  - On-call rotation coverage.

### `/em conway [situation]`
Conway's law applied to design.
- Outputs:
  - Map: existing org ↔ existing system shape.
  - Recommendation: re-shape org to drive desired system shape (inverse Conway).
  - Caveats: org change is slow; system change is slow; align both.

### `/em plan-quarter [team]`
Quarterly planning.
- Inputs: team, prior OKRs, roadmap, capacity.
- Outputs:
  ```markdown
  # Quarterly Plan: <team> — Q<N> <year>

  ## Headlines
  - Top 3 outcomes this quarter
  - Top 3 risks
  - Top 3 dependencies

  ## OKRs
  | Objective | Key Result | Owner |
  |---|---|---|
  | O1: Reliability | KR1: SLO 99.95% achieved | @<handle> |
  |  | KR2: MTTR ≤ 1h P50 | @<handle> |
  | O2: Velocity | KR1: Deploy freq weekly+ | @<handle> |
  |  | KR2: First-pass review 60%+ | @<handle> |
  | O3: Capacity | KR1: Headroom 2× on hot path | @<handle> |

  ## Capacity (in engineer-weeks)
  - Total: 13 × N engineers × 12 weeks = <available>
  - Allocated: <sum>
  - Reserve (30%): <ops / on-call / unplanned>
  - Headroom for stretch: <unallocated>

  ## Roadmap
  - Now (this Q): <items>
  - Next (Q+1): <items>
  - Later (Q+2..4): <items>

  ## Top 5 risks
  1. <risk> (likelihood × impact; mitigation)
  ...

  ## Dependencies
  | To | Item | Owner | Due |
  |---|---|---|---|
  | @platform | New API spec | @<handle> | <date> |
  ```
- Cadence: end of previous quarter (2 weeks ahead).
- Pair: `/em capacity`, `/em okr`.

### `/em plan-annual [org]`
Annual planning.
- Inputs: org, prior year recap, market context, leadership direction.
- Outputs:
  - Year-ahead themes (3-5).
  - Tech investments.
  - Hiring plan (per quarter, per role, per level).
  - Capacity envelope (headcount × ramp).
  - Top 5 risks.
  - OKR cascade (org → team → individual).
  - Major changes (org shape, processes, tooling).
  - Pair: `/em strategy`.

### `/em okr [team_or_org]`
OKR setting + tracking.
- Outputs:
  - **Setting**:
    - 3-5 objectives (qualitative, ambitious, time-bounded).
    - 2-4 KRs per O (measurable, 0.0-1.0 score, leading indicator).
    - 70% confidence on hitting all = right ambition level.
    - Cascade: org → team → individual.
  - **Tracking**:
    - Weekly check-in: traffic-light (green/yellow/red).
    - Biweekly review: KR scores + narrative.
    - End-of-quarter: retrospective; archive OKRs; lessons.
  - **Common mistakes**: vanity OKRs, sandbagged OKRs, output-not-outcome, no cascade, too many.

### `/em roadmap [surface]`
Build a roadmap.
- Inputs: surface (org / team / product), time horizon.
- Outputs:
  - Now (this Q) — committed.
  - Next (Q+1) — planned.
  - Later (Q+2..4) — directional.
  - "Not now" — explicit non-goals.
  - Owners per item.
  - Dependencies on other teams (named + due).
  - Pair: `/em capacity`, `/em plan-quarter`.

### `/em prioritize [list]`
Prioritization framework.
- Inputs: backlog / list of items.
- Outputs:
  - Frameworks (apply as fits):
    | Framework | Use |
    |---|---|
    | RICE (Reach × Impact × Confidence ÷ Effort) | Quantitative rank |
    | MoSCoW (Must / Should / Could / Won't) | Stakeholder alignment |
    | WSJF (Weighted Shortest Job First) | SAFe; cost of delay |
    | ICE (Impact × Confidence × Ease) | Lightweight ranking |
    | Eisenhower (Urgent × Important) | Personal triage |
    | Opportunity cost | "What's the next-best thing we wouldn't do?" |
  - Recommendation + tradeoffs.

### `/em capacity [team]`
Capacity planning.
- Inputs: team size, time window, on-call burden, planned work, unplanned reserve.
- Outputs:
  - **Formula**:
    ```
    Available = headcount × weeks × hours-per-week
    Reserve = 30% (ops + on-call + unplanned + learning)
    Allocated = sum(planned items in hours)
    Headroom = Available × 0.7 - Allocated
    ```
  - Allocation per item with owner.
  - Stretch room (white space).
  - Overcommit warning.
  - Pair: `/em plan-quarter`.

### `/em headcount [org]`
Headcount planning.
- Inputs: org, growth targets, roadmap, hiring market.
- Outputs:
  - Yearly plan: per role, per level, per quarter.
  - Quarterly ramp-up (new hire productivity curve).
  - Hiring cost (back-loaded: recruiter, panel, sign-on, ramp).
  - Open req tracking.
  - Diversity targets (where applicable).

### `/em 1-1 [cadence_or_topic]`
1:1 framework.
- Outputs:
  ```markdown
  # 1:1 Guide

  ## Cadence
  - 30 min, weekly, recurring.
  - Same time (minimize rescheduling).
  - 1:1 belongs to the report; manager is guest.

  ## Agenda (owned by report)
  - What's going well?
  - What's in your way?
  - Where do you want to grow?
  - Anything you're stuck on / worried about?

  ## Manager's contributions
  - Listen more than talk (target 30/70).
  - Feedback (give + ask for).
  - Unblock (organizational, technical).
  - Career (growth, opportunities, next-level readiness).
  - Personal (wellbeing, energy).

  ## Anti-patterns
  - 1:1 as status meeting (status belongs async).
  - Skipping when "no agenda" (always have one).
  - Cancelling when busy (sacrificing trust).
  - Always running late (cuts conversation short).
  - Talking more than the report.
  - Solving before listening.

  ## Notes
  - 1:1 notes are confidential (manager shares selectively with HR only).
  - Themes across 1:1s inform review + calibration.
  ```

### `/em feedback [situation]`
Feedback delivery.
- Outputs:
  - Frameworks:
    - **SBI**: Situation → Behavior → Impact.
    - **COIN**: Context → Observation → Impact → Next.
    - **Radical Candor**: Care Personally + Challenge Directly.
    - **Direct + Empathetic**: state clearly; check impact; invite response.
  - **When**:
    | Moment | Channel |
    |---|---|
    | Right after observation | 1:1, immediate |
    | Pattern emerges | 1:1, within 1-2 weeks |
    | Major issue | 1:1, within 1 day |
    | Past issue, continuing | 1:1 with explicit framing |
    | Recognition | Public or 1:1, immediate |
  - **Anti-patterns**:
    - Feedback sandwich (positive → negative → positive) — feels manipulative.
    - "Always" / "Never" — overgeneralization.
    - Public callout — humiliation.
    - Feedback first time in review — no time to course-correct.
    - Feedback first time in retro — public; not actionable for the individual.
    - Vague feedback ("you need to be more proactive") — not actionable.
    - Trait-based ("you're careless") — labels a person. Behavior-based ("this commit left a debug print") — actionable.

### `/em radar`
360-degree feedback (Radical / "Skip-Level").
- Outputs:
  - Survey instrument: open-ended + Likert.
  - Rater set: self + manager + peers × 3 + cross-functional × 2.
  - Confidentiality: ≥ 3 raters per category; aggregated, not attributed.
  - Cadence: twice a year (H1 + H2).
  - Use: calibration input + development plan.

### `/em review [engineer]`
Performance review.
- Inputs: engineer, period, peer reviewers.
- Outputs:
  ```markdown
  # Performance Review: @<handle> — <period>

  ## Self-assessment
  <manager asks; engineer writes; "your words first">

  ## Strengths (specific examples)
  - <behavior with outcome>
  - <behavior with outcome>

  ## Areas to develop
  - <behavior with concrete next step>
  - <behavior with concrete next step>

  ## Goals vs outcomes
  - OKR / goal 1: <achievement>
  - OKR / goal 2: <achievement>

  ## Competencies
  | Competency | Level | Note |
  |---|---|---|
  | Technical | <level> | <note> |
  | Execution | <level> | <note> |
  | Collaboration | <level> | <note> |
  | Communication | <level> | <note> |
  | Leadership (if applicable) | <level> | <note> |

  ## Calibration bucket
  - <Far exceeds / Exceeds / Meets / Developing / Below>

  ## Next-level readiness
  - <Promotable now / Promotable in 1-2 cycles / Solid in current level / Not yet>

  ## Growth plan (next 6 months)
  - <area> → <specific actions>
  - <area> → <specific actions>

  ## Manager commitments
  - <what I'll do to support>
  ```

### `/em self-review [engineer]`
Self-review template.
- Outputs: prompts for the engineer's own review:
  - What did I accomplish this period? (Outcomes, not just outputs.)
  - What did I learn?
  - What was hard? What did I get stuck on?
  - What would I do differently?
  - Where do I want to grow next?
  - What support do I need?

### `/em calibration`
Calibration meeting framework.
- Outputs:
  - Pre-work: every manager submits ratings with evidence.
  - Session: managers distribute an agreed-upon distribution (e.g., 10/20/40/20/10 across exceeds→below).
  - Anti-bias: rotate who presents; question outliers.
  - Outputs: calibrated ratings + leveling decisions + promotion candidates.
  - Confidentiality: outcomes (calibrated ratings) returned to report; deliberation private.

### `/em promotion [engineer]`
Promotion case.
- Inputs: engineer, target level, evidence.
- Outputs:
  ```markdown
  # Promotion Case: @<handle> → <next level>

  ## Why now
  - <narrative: why this engineer is ready for the next level>

  ## Evidence (per next-level expectation)
  | Expectation | Evidence | Strength |
  |---|---|---|
  | <expectation> | <PR / project / outcome> | strong / clear / weak |
  | ... | ... | ... |

  ## Sustained over time
  - <how long at this performance level>
  - <examples across quarters>

  ## Calibration context
  - Compared to peers at same level
  - Compared to recent promotees

  ## Recommendation
  - Promote / Defer / Not yet
  - Conditions if defer

  ## Sponsors
  - Manager: @<handle>
  - Skip-level: @<handle>
  - Peer sponsors: @<handle>
  ```

### `/em leveling [org]`
Leveling guide / career ladder.
- Outputs (per level):
  - Title.
  - **Outcomes** (what the level owns).
  - **Behaviors** (how the level operates).
  - **Scope** (blast radius of decisions).
  - **Example signals** (PRs, projects, leadership moments).
  - **Common confusion** with adjacent levels.
  - Pair: `/doc onboarding` (level explained to new hire).

### `/em idp [engineer]`
Individual development plan.
- Inputs: engineer, current level, target level, period.
- Outputs:
  ```markdown
  # IDP: @<handle> — <period>

  ## Current
  - Level: <level>
  - Strengths (top 3): ...
  - Growth areas (top 2): ...

  ## Target
  - Next-level or stretch: <level>
  - Time horizon: <period>

  ## Goals
  | Goal | Actions | Support needed | Check-in |
  |---|---|---|---|
  | 1. <goal> | <specific actions> | <mentor, training> | <date> |
  | 2. <goal> | <...> | <...> | <date> |

  ## Stretch opportunities
  - <project / leadership moment / cross-team>
  ```

### `/em mentorship [pair]`
Mentorship (vs sponsorship).
- Outputs:
  - **Mentorship**: advice + perspective + skill-building; low-stakes; bidirectional.
  - **Sponsorship**: advocacy + visibility + opportunity; high-stakes; org owes mentor.
  - Pairing criteria (mentor: 1+ level above; matched in area of growth).
  - Cadence (biweekly 30 min for 6 months; rotate).
  - Outcomes (skills gained, projects, network).

### `/em sponsorship [engineer]`
Sponsorship.
- Outputs: sponsor identifies high-potential; advocates for visibility + opportunity + promotion; signals to leadership. Sponsor is a senior leader with budget + influence.

### `/em onboarding [new_hire]`
Onboarding (30/60/90).
- Outputs:
  ```markdown
  # Onboarding: @<new hire> — Start <date>

  ## Week 1 (Days 1-5)
  - Day 1: laptop, accounts, buddy intro, team intro
  - Day 2-3: read docs; observe standup; shadow
  - Day 4-5: first small task (lint fix, doc edit, test)

  ## First 30 days
  - First PR (or equivalent) shipped
  - Pair with each teammate (1+ hour)
  - Read team charter + ADRs + runbooks
  - First on-call shadow
  - 30-min retro with manager

  ## First 60 days
  - First owned feature / fix (small)
  - Cross-functional intros (PM, design, SRE)
  - First demo contribution
  - IDP drafted with manager

  ## First 90 days
  - First independent deliverable (medium)
  - First incident participation
  - First peer review from non-buddy
  - 90-min retro with manager (calibration)

  ## Buddy
  - @<handle> (same level, peer)
  - 30 min daily check-in (week 1), then weekly.

  ## Manager commitments
  - Weekly 1:1 throughout.
  - IDP draft at 60 days.
  - Calibrated review at 90 days.
  ```

### `/em offboarding [engineer]`
Offboarding + knowledge transfer.
- Outputs:
  - **KT plan** (knowledge transfer):
    - List of owned surfaces (services / projects / decisions).
    - Documents + runbooks updated.
    - Pair sessions scheduled.
    - Successor assigned.
  - **Access revocation**:
    - Code access (committer, deployer).
    - Cloud accounts.
    - Customer data.
    - Internal tools.
    - Calendar (handoff).
  - **Communication**:
    - Internal announcement.
    - Customer / partner comms (if customer-facing).
    - Vendor / contract handoff.
  - **Exit interview** (HR-led).
  - **30/60/90 follow-up** (manager checks in; surfacing gaps in KT).

### `/em knowledge-transfer [engineer]`
KT session facilitation.
- Outputs:
  - Pre-reads (current state docs).
  - Agenda (run the system in front of successor).
  - Recorded walkthrough (video).
  - Shadow week (successor runs with engineer backup).
  - Solo week (engineer backup available; successor drives).
  - Sign-off + handover doc.

### `/em hiring-plan [org]`
Hiring plan.
- Inputs: org, growth targets, time horizon.
- Outputs:
  - Yearly plan: role, level, count, quarter, target start date.
  - Capacity / cost.
  - Diverse sourcing strategy.
  - Pipeline tracking (sourced / screened / interviewed / offered / accepted).
  - Pair: `/em headcount`, `/em interview-loop`.

### `/em interview-loop [role]`
Structured interview loop design.
- Inputs: role, level, competencies.
- Outputs:
  - **Competencies** (4-5 per loop):
    - Technical depth.
    - System design / architecture.
    - Coding (algorithmic / language-specific).
    - Collaboration / values.
    - Growth / learning agility.
  - **Stages** (typically 4-5):
    1. Recruiter screen.
    2. Technical phone screen.
    3. Onsite (3-5 sessions).
    4. Debrief.
    5. Offer / decline.
  - **Structured rubric** (each session):
    - Question / scenario.
    - What "strong" looks like.
    - What "weak" looks like.
    - Bias flags (mitigations).
  - **Scorecard**:
    - 1-4 per competency (insufficient hire / hire / strong hire / exceptional).
    - Comments required per score.
  - **Pair**: `/em interview-bias`, `/em interview-calibration`.

### `/em interview-bias`
Bias mitigation in interviews.
- Outputs:
  - **Bias types**: halo, horn, similarity, recency, contrast, expectation, stereotyping.
  - **Mitigations**:
    - Structured rubric (not gut).
    - Independent scoring pre-debrief.
    - Diverse panel.
    - Standardized questions.
    - Calibration across interviewers.
    - Affinity-blind reviews (where feasible).
    - Decision rules (e.g., must have ≥ 3 "hire" votes across panel).

### `/em interview-calibration [loop]`
Calibrate the loop.
- Outputs: review scores across recent loops; identify harsh / lenient interviewers; re-train.

### `/em offer [candidate]`
Offer process.
- Outputs:
  - Recruiter presents calibrated outcome.
  - Compensation leveling (cross-referenced with comp band).
  - Equity / bonus structure.
  - Start date negotiation.
  - Closing conversations (sell the team + role).
  - Onboarding prep (per `/em onboarding`).

### `/em candidate-experience`
Candidate experience.
- Outputs:
  - Pre-loop: clear JD, prep doc, expectations.
  - During: respect time; friendly interviewers; reasonable pace.
  - Decision: prompt response (within 5 business days).
  - Feedback: respectful decline + option for future.
  - Survey: NPS from candidates; tracked.

### `/em retention [team_or_engineer]`
Retention playbook.
- Outputs:
  - **Stay interviews** (quarterly): "What keeps you here? What would make you leave? What's missing?"
  - **Comp reviews** (annual + spot): competitive vs market; equity refresh.
  - **Growth** (continuous): IDP + leveling + stretch opportunities.
  - **Recognition** (continuous): shoutouts, awards, promotion.
  - **Workload** (continuous): on-call burden, overtime signals, burnout signals.
  - **Connection** (continuous): community, mentorship, social.

### `/em stay-interview [engineer]`
Stay interview.
- Outputs:
  - Questions (manager-led):
    - What about your work makes you excited?
    - What would make you leave?
    - What's the most meaningful thing you've done here?
    - What's missing?
    - How is your relationship with the team? With me?
    - What would make the next 6 months even better?
  - Listen + take notes; thank; act on signal.

### `/em recognition [engineer_or_team]`
Recognition.
- Outputs:
  - **Cadence**: weekly shoutouts (team meeting); quarterly peer awards; annual company awards.
  - **Behaviors recognized**: technical excellence, mentorship, customer empathy, blameless learning, cross-team contribution, process improvement.
  - **Specificity**: tied to outcomes + behaviors.
  - **Public**: visible to peer teams; documented in newsletter.
  - **Bimodal**: peer-to-peer (low-friction); manager-led (deeper).

### `/em standup`
Standup format.
- Outputs:
  - **Daily**: 15 min, same time, async-friendly.
  - **Format** (if sync):
    - Each person: 1) Yesterday 2) Today 3) Blockers.
    - Optional: ROY (risk / opportunity / yay).
  - **Async alternative** (recommended for remote / multi-timezone):
    - Slack thread; written updates by 9am local; manager scans; one daily sync for unresolved blockers.
  - **Anti-patterns**: status-by-manager (defeats purpose); > 15 min; catch-all for announcements.

### `/em retro`
Retrospective.
- Outputs:
  - **Cadence**: monthly (or per major project).
  - **Format**: 4Ls (Liked / Learned / Lacked / Longed-for) or Start / Stop / Continue / More / Less.
  - **Facilitation**: rotating facilitator; safe space; no blame.
  - **Output**: action items with owner + due (track to closure).
  - **Anti-patterns**: complaining without action; same items recurring (escalate); manager dominates; airtime skewed.

### `/em kickoff [project]`
Project kickoff.
- Outputs:
  ```markdown
  # Kickoff: <project>

  ## Problem
  <One paragraph.>

  ## Goals
  - <goal>
  - <goal>

  ## Non-goals
  - <non-goal>

  ## Stakeholders
  - Sponsor: @<handle>
  - DRI: @<handle>
  - Engineering lead: @<handle>
  - PM: @<handle>
  - Design: @<handle>
  - SRE: @<handle>

  ## Approach
  <High-level.>

  ## Risks
  - <risk> (mitigation)

  ## Milestones
  | Milestone | Date | Owner |
  |---|---|---|
  | M1: Design | <date> | @<handle> |
  | M2: Spike | <date> | @<handle> |
  | M3: Build | <date> | @<handle> |
  | M4: GA | <date> | @<handle> |

  ## Comms
  - Status updates: weekly to <list>
  - Decision log: <link>
  - Risks surfaced: weekly
  ```

### `/em demo`
Demo / showcase.
- Outputs:
  - Monthly, optional external (cross-team).
  - 60-min slot; 3-4 demos; 5-10 min each.
  - Engineering-led (or PM-led); user-focused.
  - Recorded for async.
  - Action items captured (Q&A → tickets).

### `/em all-hands [team_or_org]`
All-hands agenda.
- Outputs:
  - Quarterly (or monthly for larger orgs).
  - Agenda:
    - Wins (recent).
    - Roadmap status.
    - Risks + dependencies.
    - Q&A (anonymous question collection).
    - Customer story.
    - Shoutouts.
  - Slides archived + linked.
  - Decisions surfaced in chat.

### `/em decision-log [team]`
Decision log.
- Outputs:
  - **Format**: ADR / decision record.
  - **When to log**:
    - Architecture decision.
    - Vendor / tool choice.
    - Process change.
    - Headcount / org change.
    - Cross-team agreement.
  - **Fields**:
    - Title.
    - Date + deciders.
    - Context.
    - Options considered.
    - Decision + reasoning.
    - Consequences.
    - Revisit condition.
  - **Tool**: repo `/decisions/<NNNN>-<slug>.md`; or Log4brains / ADR-tools / Notion.

### `/em rfc [proposal]`
RFC process.
- Outputs:
  - **Inputs**: title, author, problem, proposal, alternatives.
  - **States**: Draft → In review → Accepted / Rejected / Withdrawn / Superseded.
  - **Reviewers**: cross-functional (eng + product + SRE + design + security as fits).
  - **Window**: 5-10 business days (depending on impact).
  - **Outcome**: documented decision + ADR + comms.

### `/em escalation [issue]`
Escalation path.
- Outputs:
  - **When**: blocker beyond team's reach; cross-org; legal/HR; safety.
  - **Channels**:
    - Tech escalation: peer team → manager → skip-level → EM director.
    - Cross-org: program manager → cross-functional sync.
    - Legal/HR: HRBP.
    - Safety/security: security on-call.
  - **Cadence**: synchronous call for urgent; written escalation doc for non-urgent.
  - **Documentation**: decision captured; trace.

### `/em status [team]`
Status update framework.
- Outputs:
  ```markdown
  # Status: <team> — <week ending>

  ## Top 3 outcomes this week
  - <outcome with owner>

  ## Top 5 risks (with mitigation)
  1. <risk> | owner | mitigation | trend
  ...

  ## Top 3 dependencies
  - <dependency on other team> | owner | due

  ## OKR progress (light)
  - O1 KR1: <traffic-light> + delta
  - O2 KR1: <traffic-light> + delta

  ## Wins
  - <celebration>

  ## Asks (what I need from leadership)
  - <ask>
  ```

### `/em exec-update`
Executive update.
- Outputs:
  - Monthly to leadership.
  - Format:
    - Scorecard (5-7 metrics).
    - Top wins.
    - Top risks.
    - Top decisions needed (with recommendation).
    - Top asks.
  - 5-10 minutes to read.
  - Pair: `/audit scorecard` for the metric inputs.

### `/em incident-comms`
Incident communication.
- Outputs:
  - **Channels**: incident channel; status page; customer comms.
  - **Cadence**:
    | Severity | Internal | External |
    |---|---|---|
    | S1 | Every 30 min | Every 30 min |
    | S2 | Every 60 min | Every 60 min |
    | S3 | At declare + resolve | At resolve |
    | S4 | None | None |
  - **Tone**: factual; empathetic; no blame; commitment to update.
  - Pair: `/sre incident-declare`, `/sre incident-respond`.

### `/em risk-register [team_or_org]`
Risk register.
- Outputs:
  ```markdown
  # Risk Register: <scope> — <period>

  | # | Risk | Likelihood (1-5) | Impact (1-5) | Score | Mitigation | Owner | Status |
  |---|---|---|---|---|---|---|---|
  | 1 | <risk> | <L> | <I> | <LxI> | <mitigation> | @<handle> | <in progress / done> |
  ```
  - Review weekly (top 5) / monthly (full).
  - New risks from incidents / retros feed in.
  - Closure verified.

### `/em dependencies [team]`
Dependency management.
- Outputs:
  - List of cross-team dependencies: owner, due, escalation path.
  - Tracked in shared roadmap (cross-team view).
  - Weekly cross-team sync as needed.
  - Bottleneck escalation when stuck > 1 cycle.

### `/em strategy [org]`
Engineering strategy.
- Outputs:
  - 1-year direction.
  - 3-5 strategic themes (e.g., "reliability", "platform consolidation", "ML-first").
  - Investments (people + tooling + infra).
  - Bets (where we place big bets).
  - Tradeoffs (what we deprioritize).
  - Pair: `/doc design` for technical deep-dives.

### `/em vision [org]`
Vision.
- Outputs: 2-3 year vision; where the org/team is heading; why this matters.

### `/em stakeholder [list]`
Stakeholder management.
- Outputs:
  - Stakeholder map: who cares, why, what they need, channel, cadence.
  - Influence / interest matrix.
  - Engagement plan.

### `/em culture [team]`
Culture health.
- Outputs:
  - **Signals measured**:
    - Psychological safety (survey).
    - Engagement (eNPS).
    - Inclusion (qualitative + survey).
    - Recognition (frequency).
    - Learning time (allocated).
    - Conflict (healthy surface).
    - Trust (autonomy given).
  - Actions per signal (down → fix).
  - Pair: `/audit culture`.

### `/em safety`
Psychological safety.
- Outputs:
  - Define (Edmondson): safe to take interpersonal risk; safe to speak up; safe to fail.
  - Practices:
    - Leader models vulnerability.
    - Surface mistakes as learning.
    - No retaliation.
    - Diverse voices heard.
    - "Dumb questions" welcomed.
  - Measurement: pulse survey quarterly.
  - Action: visible follow-through on signals.

### `/em dei`
DEI.
- Outputs:
  - Hiring targets (representation at level).
  - Sourcing strategy (diverse channels).
  - Inclusive interview training.
  - Pay equity audits.
  - Promotion equity audits.
  - ERGs (employee resource groups) support.
  - Inclusive practices (e.g., meeting etiquette, all-hands accessibility).
  - Pair: `/audit retention` for signal integration.

### `/em remote`
Remote / async / distributed.
- Outputs:
  - **Default async**; meetings opt-in.
  - **Written-first**: decisions + status + updates in writing.
  - **Overlap hours**: defined for cross-timezone teams.
  - **Rituals**: standup async + 1 sync; retro async + 1 sync.
  - **Onboarding**: structured (per `/em onboarding`); explicit async norms.
  - **Documentation**: docs are the system's source of truth.
  - **Connection**: socials (intentional, not constant).
  - **Tooling**: chat (written); video for high-context; project tools (visible).

### `/em meeting`
Meeting hygiene.
- Outputs:
  - **Pre-meeting**: agenda + outcome + decision-maker + end-time in calendar.
  - **In-meeting**: start on time; capture decisions; end on time.
  - **Post-meeting**: notes + action items + decisions within 24h.
  - **Default 25/50 minutes** (5 min buffer).
  - **No-meeting Wednesdays** (or team-chosen focus day).
  - **Cancel if agenda isn't set** (manager enforces).
  - **Audit**: meeting-load report (hours / engineer / week); reduce.

### `/em maker-time`
Maker-vs-manager schedule.
- Outputs:
  - **Maker**: long uninterrupted blocks for deep work; calendar holds.
  - **Manager**: many small blocks; context-switching; meetings.
  - **Conflict**: makers need 4+ hour blocks; managers fragment them.
  - **Mitigations**:
    - No-meeting days for makers.
    - Manager handles meetings.
    - Async-first comms.
    - Default 25/50-minute meetings (5 min buffer).
    - Quarterly "maker weeks" (limited meetings).

### `/em delegate [task]`
Delegation.
- Outputs:
  - **When**: task is reversible + below your scope ceiling; you want to develop someone.
  - **Levels**:
    | Level | Description |
    |---|---|
    | 1 | Do (full ownership) |
    | 2 | Recommend (you decide after input) |
    | 3 | Discuss (input gathered; you decide) |
    | 4 | Defer (full decision to report) |
  - **Always**: clear outcome; clear constraint; clear escalation.
  - **Anti-patterns**: dump-and-run; micromanage; delegate-only-the-junk.

### `/em trust`
Trust.
- Outputs:
  - **Trust = competence + intent + follow-through**.
  - Trust grows with autonomy + support + accountability.
  - Manager's role: build trust through clarity + remove blockers + celebrate wins + own failures.
  - Pair: `/em delegate`, `/em autonomy`.

### `/em conflict [situation]`
Conflict resolution.
- Outputs:
  - **Healthy conflict** (about ideas / decisions / priorities) → welcome.
  - **Unhealthy conflict** (about people / ego / turf) → intervene.
  - **Steps**:
    1. Acknowledge: "I see there's friction."
    2. Listen: each side.
    3. Reframe on interests, not positions.
    4. Find common ground.
    5. Decide + document.
  - **Mediator role**: state position; ask for response; don't pick sides prematurely.
  - **Pair**: `/em difficult`.

### `/em difficult [topic]`
Difficult conversation framework.
- Outputs:
  - **Frame**: clear + kind + concrete + actionable.
  - **Pre-work**: gather evidence; anticipate response; choose private setting.
  - **Structure**:
    1. Frame: "I want to talk about X."
    2. Specific behavior: "I observed Y on Z date."
    3. Impact: "This affects W."
    4. Listen: "What's your view?"
    5. Path forward: "I'd like us to do V."
    6. Support: "Here's what I'll do."
    7. Follow-up: scheduled check-in.
  - **Anti-patterns**: vague; public; sandwiching; labeling.

### `/em pip [engineer]`
Performance improvement plan.
- Outputs:
  ```markdown
  # PIP: @<engineer> — Start <date>

  ## Context
  - Documented performance concerns since <date>.
  - Prior feedback given on <dates> (private 1:1, in review, etc.).
  - This is a last-resort formal step.

  ## Expectations (specific, measurable, time-bounded)
  | Goal | Measurable success | Timeline |
  |---|---|---|
  | 1. <goal> | <measurable> | <date> |
  | 2. <goal> | <measurable> | <date> |
  | 3. <goal> | <measurable> | <date> |

  ## Support
  - Manager 1:1 weekly.
  - Mentor assigned: @<handle>.
  - Training / resources: <list>.
  - Removal of blockers: <list>.

  ## Check-ins
  - Biweekly with manager + HR.
  - Written feedback captured.

  ## Outcomes
  - Meet all goals → continue at level.
  - Partial → extend + re-evaluate.
  - Not met → role change / separation.

  ## Acknowledgments
  - Engineer: <signature>
  - Manager: <signature>
  - HRBP: <signature>
  ```
- Rule: PIP is rare, fair, last resort, documented, supported. Always with HR.

### `/em exit [engineer]`
Exit interview (HR-led).
- Outputs:
  - Confidential conversation.
  - Topics: experience, manager, team, role, growth, compensation, culture.
  - Themes aggregated anonymously for org learning.
  - 30/60/90 follow-up (manager check-in).

### `/em budget [org]`
Budget planning.
- Outputs:
  - **Categories**: headcount, tooling, cloud, office, training, conferences, recruiting.
  - Yearly envelope per category.
  - Quarterly tracking vs plan.
  - Tradeoffs documented.
  - Pair: `/audit cost`, `/finops` (cost).

### `/em vendor [vendor]`
Vendor management.
- Outputs:
  - Use case + alternatives evaluated.
  - Procurement process (security + legal review).
  - Contract review (auto-renew, lock-in, data residency).
  - Renewal cadence (annual).
  - Exit plan (data export, contract wind-down).

### `/em audit`
Audit management practice. See §6.

### `/em metric [scope]`
Management metrics dashboard.
- Outputs:
  - **Team health** (quarterly):
    | Metric | Target | Trend |
    |---|---|---|
    | Engagement (eNPS) | ≥ +30 | ... |
    | Psychological safety | ≥ 4/5 | ... |
    | Attrition (regrettable) | ≤ 10% / yr | ... |
    | Inclusion (qualitative) | trending up | ... |
  - **Delivery** (continuous):
    | Metric | Target | Trend |
    |---|---|---|
    | DORA: lead time | < 1d | ... |
    | DORA: deploy freq | weekly+ | ... |
    | DORA: change fail rate | ≤ 10% | ... |
    | DORA: MTTR | ≤ 1d | ... |
    | First-pass review rate | ≥ 50% | ... |
    | Stale PR rate | ≤ 5% | ... |
  - **People** (continuous):
    | Metric | Target | Trend |
    |---|---|---|
    | 1:1 cadence adherence | 100% | ... |
    | IDP completion | 100% | ... |
    | Promotion readiness (per level) | tracked | ... |
    | Diversity at level | trending up | ... |
    | Open req → fill time | ≤ 60d | ... |
  - **Quality** (quarterly):
    | Metric | Target | Trend |
    |---|---|---|
    | Coverage (critical path) | ≥ 80% | ... |
    | PRR completion (tier-0) | 100% | ... |
    | SLO compliance | ≥ target | ... |
    | On-call burden (h / engineer / week) | ≤ 6 | ... |
  - **Strategy** (quarterly):
    | Metric | Target | Trend |
    |---|---|---|
    | OKR achievement | ≥ 70% | ... |
    | Roadmap shipped on time | ≥ 80% | ... |
    | Bus factor (tier-0) | ≥ 2 | ... |
    | Talent density (eng / $M ARR) | trending up | ... |

### `/em health [team]`
Team health check.
- Inputs: team, period.
- Outputs:
  - Survey (1:1 + eNPS + safety + workload).
  - 1:1 themes (aggregated).
  - Engagement signals (recognition, conflict, growth).
  - Delivery signals (cycle time, OKR, roadmap).
  - Quality signals (coverage, SLO, review depth).
  - Action items + owner.

### `/em transition [change]`
Manager transition (new manager / team handover / org change).
- Outputs:
  - **Outgoing manager**:
    - Documentation (charter, decisions, risks, ownership).
    - 1:1 sweep (each report heard).
    - Handover doc.
  - **Incoming manager**:
    - Read all docs; meet all reports (no skip).
    - 30/60/90 plan (per `/em onboarding`).
  - **Org change**:
    - Communication (rationale + plan + impact + support).
    - Town hall.
    - 1:1 sweep.
    - Stabilization period (no major changes for 60-90 days).

---

## 4. Execution Order (Full Engagement)

For a new manager / team / org entering management practice:

1. `/em charter` — team mission + scope + non-scope + success metrics.
2. `/em topology` — org shape.
3. `/em team-design` — team boundaries.
4. `/em mission` + `/em vision` — narrative.
5. `/em plan-quarter` + `/em okr` — first quarter plan.
6. `/em capacity` — capacity envelope.
7. `/em roadmap` — roadmap.
8. `/em onboarding` — onboarding template (for new hires from now on).
9. `/em 1-1` — 1:1 cadence (immediate).
10. `/em standup` + `/em retro` + `/em demo` + `/em all-hands` — rituals.
11. `/em feedback` — feedback norms.
12. `/em review` + `/em calibration` + `/em leveling` — performance practice.
13. `/em idp` — growth plans.
14. `/em mentorship` + `/em sponsorship` — development support.
15. `/em hiring-plan` + `/em interview-loop` + `/em interview-bias` — hiring.
16. `/em offer` + `/em candidate-experience` — closing + experience.
17. `/em retention` + `/em stay-interview` + `/em recognition` — retention loop.
18. `/em decision-log` + `/em rfc` + `/em escalation` — decision discipline.
19. `/em status` + `/em exec-update` + `/em all-hands` + `/em incident-comms` — communication.
20. `/em risk-register` + `/em dependencies` — risk surface.
21. `/em strategy` + `/em vision` — long-range.
22. `/em stakeholder` + `/em culture` + `/em safety` + `/em dei` + `/em remote` — culture + people.
23. `/em meeting` + `/em maker-time` + `/em delegate` + `/em trust` — operating system.
24. `/em conflict` + `/em difficult` + `/em pip` + `/em exit` — hard conversations.
25. `/em budget` + `/em vendor` — money + contracts.
26. `/em metric` + `/em health` + `/em audit` — measurement + audit.

> 🛑 **No team ships to production without:** charter, OKRs set for the quarter, on-call rotation, SLOs, retros scheduled, decision log path.

## 5. Output Location
- `team/charter.md` — team charter.
- `team/okrs/<YYYY>-Q<N>.md` — quarterly OKRs.
- `team/roadmap.md` — roadmap.
- `team/retro/<YYYY-MM>.md` — retros.
- `team/decisions/<NNNN>-<slug>.md` — decision log.
- `team/people/<handle>/idp.md` — IDPs.
- `team/people/<handle>/reviews/<period>.md` — reviews.
- `team/onboarding.md` — onboarding template.
- `docs/management/` — process docs.
- `.status/<YYYY-WW>.md` — weekly status.
- `exec-update/<YYYY-MM>.md` — exec updates.

## 6. Audit Workflow
When asked to audit an engineering management practice:

1. **Charter coverage**: every team has a charter with mission, scope, customers, success metrics.
2. **OKR cadence**: every team has current OKRs; weekly check-in documented.
3. **1:1 cadence**: every engineer has weekly 1:1; 0% skipped in last 4 weeks.
4. **Feedback frequency**: every engineer has feedback in last 90 days.
5. **Review cycle**: every engineer reviewed in last 6 months; calibrated; written.
6. **Leveling clarity**: ladder documented; expectations written per level; promotion cases have evidence.
7. **Hiring pipeline**: open reqs tracked; time-to-fill; offer-accept rate; candidate NPS.
8. **Retention signals**: stay interviews quarterly; regrettable attrition ≤ 10%; recognition frequency.
9. **Onboarding quality**: 30/60/90 plans; first-shipped-by-30-days; 90-day survey.
10. **Decision discipline**: ADRs for significant decisions; retros track action items; escalations tracked.
11. **Ritual cadence**: standup daily; retro monthly; demo monthly; planning quarterly; all-hands quarterly.
12. **Communication health**: weekly status; monthly exec update; quarterly business review; no surprise messages.
13. **Risk discipline**: top 5 risks logged weekly; mitigations owned; closure verified.
14. **Dependency management**: cross-team deps tracked; escalation paths named.
15. **Strategy clarity**: 1-year strategy; cascading OKRs; tradeoffs documented.
16. **Culture health**: psychological safety ≥ 4/5; engagement ≥ +30; inclusion trending up.
17. **DEI**: diverse slate; pay equity; promotion equity.
18. **Remote / async hygiene**: written-first; meetings have agendas; no-meeting day enforced.
19. **Meeting hygiene**: meeting load ≤ 10h / eng / week; no-meeting day; agendas set.
20. **Maker time**: uninterrupted blocks protected; no-meeting day; quarterly maker weeks.
21. **Trust + autonomy**: delegation level increasing; decisions documented.
22. **Conflict health**: friction surfaced + resolved; no silent conflicts.
23. **Difficult conversations**: feedback-before-review; private; specific.
24. **PIP discipline**: rare, documented, supported, HR-involved.
25. **Budget tracking**: yearly envelope; quarterly tracking; over/under documented.
26. **Vendor management**: contract review on renewals; exit plans documented.

Output: report with `Aligned` / `At Risk` / `Critical` per dimension; P0-P3 severity per gap; effort estimates; roadmap items.

## 7. Hard Rules
- **Never** surprise an engineer in a performance review with feedback they've never heard.
- **Never** give difficult feedback publicly.
- **Never** skip a 1:1.
- **Never** run a meeting without an agenda.
- **Never** approve a hire without a structured loop + calibration + offer committee.
- **Never** promote without evidence + calibration + manager case.
- **Never** PIP without HR + documented expectations + support.
- **Never** let one person own tier-0 work alone (bus factor).
- **Never** let a decision be made in DM without a log.
- **Never** ship a roadmap without capacity plan.
- **Never** run a team without charter / OKRs / retros / decision log.
- **Never** manage without metrics (delivery + people + quality + culture).
- **Never** exit-interview skip a departing employee.
- **Never** skip the offboarding KT plan.
- **Never** let retros end without action items + owners + due.
- **Never** let onboarding be unstructured.
- **Never** let standups become status-by-manager.
- **Never** let meetings eat maker time.
- **Never** let culture signals (engagement, safety) trend down without acting.
- **Always** give feedback close to observation.
- **Always** make decisions explicit + documented.
- **Always** celebrate wins publicly + specifically.
- **Always** run retros with action items + ownership.
- **Always** hold weekly 1:1s (private, no-rolling agenda).
- **Always** calibrate reviews before delivery.
- **Always** write a charter before shipping a team.
- **Always** set OKRs at the start of the quarter; track weekly.
- **Always** protect maker time (no-meeting day, 25/50-min meetings).
- **Always** make decisions reversible when possible (low cost of reversal = just do it).
- **Always** follow through on commitments from retros + 1:1s.
- **Always** treat retention as proactive, not reactive.
- **Always** communicate in writing first, sync second.
- **Always** run calibration before promoting.
- **Always** include HR in PIP / difficult conversations.
- **Always** exit-interview with HR, not just manager.

---

# Reference — 1:1 Mastery

## Structure
- 30 min, weekly, recurring.
- Owned by the report.
- Manager is guest.
- No status-update slot.
- Listen more than talk (target 30/70).

## First-time 1:1 (new report)
- Get to know: motivation, career goals, what they enjoy, working style.
- Set cadence + expectations.
- Acknowledge you don't know them yet.
- Pair: `/em onboarding`.

## Different situations

| Situation | Manager move |
|---|---|
| Engineer thriving | Ask: "What's working? Where can I help amplify?" |
| Engineer struggling | Ask: "What would help? Where do you want my help?" |
| Career conversation | Ask: "Where do you see yourself in 2 years?" |
| Conflict | Listen; don't pick sides prematurely; reframe |
| Feedback needed | Frame privately; specific; behavioral; with care |
| Promotion conversation | Calibration first; case-built; shared after |

## Notes + privacy
- 1:1 notes are private (manager only).
- Themes across 1:1s inform review.
- Confidentiality critical for trust.

---

# Reference — Feedback Frameworks

## SBI (Situation / Behavior / Impact)

```
"When we were in <SITUATION>,
you did <BEHAVIOR>,
which had <IMPACT>."
```

## COIN (Context / Observation / Impact / Next)

```
"In <CONTEXT>,
I observed <OBSERVATION>,
which <IMPACT>.
Next, I'd like to see <NEXT>."
```

## Radical Candor

- Care Personally + Challenge Directly.
- Care = empathy + investment + humanity.
- Challenge = directness + honesty + accountability.
- Quadrants:
  | Care / Challenge | Low challenge | High challenge |
  |---|---|---|
  | High care | Ruinous empathy | Radical candor |
  | Low care | Manipulative | Obnoxious aggression |

## Direct + Empathetic

- State observation directly.
- Acknowledge impact on person.
- Ask for response.
- Path forward together.

## Anti-patterns

- Sandwich (positive-negative-positive) — manipulative.
- "Always" / "Never" — overgeneralization.
- Trait-based ("you are X") — labels a person.
- Behavior-based ("the Y in this commit") — actionable.

---

# Reference — Performance Review Frameworks

## Inputs
- Self-review.
- Peer reviews (3-5).
- Manager review.
- Cross-functional feedback (2-3).
- Skip-level (for senior+).
- 360 (radar) — calibrated.

## Calibration
- Distribution agreed before.
- Anti-bias rotation.
- Compare apples-to-apples.
- Outliers questioned.

## Outputs
- Strengths (specific).
- Areas to develop.
- Goal achievement.
- Calibrated rating.
- Next-level readiness.
- IDP.

## Pair: `/em calibration`, `/em promotion`.

---

# Reference — Career Ladder Example

## IC Track (Engineering)

| Level | Title | Outcomes | Scope | Examples |
|---|---|---|---|---|
| 2 | Engineer | Owns features; asks for help; shipping | Feature | Ships 1-2 features / quarter |
| 3 | Senior | Owns modules; mentors; designs; cross-functional | Module | Owns service X; mentors 2-3 |
| 4 | Staff | Owns systems; cross-team; technical direction | System | Owns payments platform; leads cross-team |
| 5 | Senior Staff | Owns strategy; influences org-wide | Multiple systems | Defines payments strategy; coaches staff |
| 6 | Principal | Org-wide technical leadership | Org | Defines technical direction across org |
| 7 | Distinguished | Industry-wide leadership | Industry | External influence; paradigm shifts |

## Management Track

| Level | Title | Outcomes | Scope |
|---|---|---|---|
| M2 | EM | Owns team; delivers; develops | Team (5-9) |
| M3 | Senior EM | Owns multiple teams; strategy | Multi-team (15-30) |
| M4 | Director | Owns org; people + strategy | Org (30-100) |
| M5 | Senior Director | Owns function; cross-org | Function |
| M6 | VP | Owns org-wide function | Org-wide |
| M7 | SVP / CTO | Owns engineering org | Company |

---

# Reference — Common Management Anti-Patterns

| Anti-pattern | Why bad | Fix |
|---|---|---|
| Manager as bottleneck | Decisions wait for manager | Delegate (decision levels 1-4) |
| Manager in every meeting | Blocks team; trust gap | Be selective; async-first |
| Feedback first time in review | No time to course-correct | Continuous feedback |
| Public callout | Humiliation; trust loss | Private; specific |
| Standup as status meeting | Manager-driven; defeats purpose | Async or peer-driven |
| Standup = "what's blocking you" | Negative; suppresses signal | ROY (risk/opportunity/yay) |
| Retro with no action items | No change | Always action + owner + due |
| 1:1 as status update | Wrong forum; loses trust | Owned by report; manager guest |
| Promotion without calibration | Bias; inconsistency | Calibrate first |
| Hire without structured loop | Bias; quality variance | Structured rubric + calibration |
| Hiring freeze without explanation | Trust loss | Communicate + rationale |
| Onboarding unstructured | Ramp slow; bad first impression | 30/60/90 |
| Offboarding skipped | Knowledge loss; bus factor surprise | Structured KT |
| Culture assumed, not measured | Drift unnoticed | Quarterly pulse |
| Conflict ignored | Compounds | Address early |
| Meeting sprawl | Maker time lost | Agenda + audit + cancel |
| "Always" / "Never" feedback | Overgeneralization | Specific behavior |
| Trait feedback ("you're careless") | Labels a person | Behavior feedback |
| Decision in DM without log | Lost context | Decision log |
| Roadmap without capacity | Overcommit; trust loss | Capacity + roadmap together |
| OKR sandbag | No stretch | 70% confidence bar |
| OKR vanity | Not measurable | Measurable KRs |
| "I'll get back to you" with no date | Trust loss | Set date + follow-up |
| Cancel 1:1 when busy | Sacrificing trust | Never cancel; reschedule |
| Hire same profile as yourself | Diversity loss | Diverse panel |
| All-hands one-way | Disconnected; trust loss | Q&A + anonymous questions |

---

# Reference — Meeting Templates

## Standup (async)

```markdown
## Today (by 9am local)
- @alice: <today> | blocker: <none / yes: ...>
- @bob: <today> | blocker: <none / yes: ...>
```

## 1:1 (engineer-owned)

```markdown
## This week
- What's going well?
- What's in your way?
- Where do you want to grow?
- Anything I should know?

## Discussion topics
- ...

## Action items
- ...
```

## Weekly team sync

```markdown
## Agenda
1. Customer / user update (5 min)
2. Status against OKRs (10 min)
3. Risks + dependencies (10 min)
4. Demo (10 min)
5. Open discussion (10 min)

## Decisions
- ...

## Action items
- ...
```

## Retro (4Ls)

```markdown
## Liked
- ...

## Learned
- ...

## Lacked
- ...

## Longed for
- ...

## Action items
- # | Action | Owner | Due
- 1 | ... | ... | ...
```

## Decision review (quarterly)

```markdown
## Decisions made this quarter
- ...

## Quality of decisions
- <good outcomes>
- <mixed outcomes>
- <bad outcomes>

## Patterns
- ...

## Adjustments
- ...
```

## Kickoff

(Per `/em kickoff`.)

## Status update

(Per `/em status`.)

---

# Reference — Risk + Dependency Tracking

## Risk register template

| # | Risk | L (1-5) | I (1-5) | Score | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|---|
| 1 | <risk> | <L> | <I> | <L*I> | <mitigation> | @<handle> | <open / in progress / done> |

## Dependency template

| # | Dependency | To team | Owner on their side | Due | Status | Escalation |
|---|---|---|---|---|---|---|
| 1 | <dep> | @<team> | @<handle> | <date> | <on track / at risk / blocked> | @<lead> |

---

# Reference — Strategy Templates

## Engineering strategy (1-year)

```markdown
# Engineering Strategy: <period>

## Headline (1 sentence)
<What we're betting on.>

## Themes (3-5)
1. <theme>
2. <theme>
3. <theme>

## Bets (where we place big bets)
- <bet>: <why now, expected outcome>

## Investments (sustaining)
- <investment>: <why now, expected outcome>

## Tradeoffs (what we deprioritize)
- <deprioritize>: <why>

## OKRs (cascade to teams)
- Org OKR 1: ...
- Org OKR 2: ...
- ...

## Top risks
1. ...

## Metrics
- Org health: ...
- Delivery: ...
- Quality: ...
- People: ...
```

## Vision (2-3 year)

```markdown
# Engineering Vision: <period>

## Where we are
<Current state.>

## Where we're going
<2-3 year destination.>

## What this enables
<For users / customers / company.>

## Top 3 bets
1. ...
```

---

# Reference — Compensation Philosophy

## Philosophy
- Pay competitively vs market (per level).
- Pay equitably (pay equity audits; same level = same band).
- Pay transparently (band per level communicated).
- Performance + impact + scope.
- Refresh annually + on promotion + off-cycle for retention.

## Bands
- Per level, per role family (eng / PM / design / etc.).
- Min / mid / max per band.
- Equity / bonus / base mix.

## Promotion
- Calibrated + evidence-based.
- Compa-ratio adjusted.

## Retention
- Stay interviews.
- Compensation review on signal.
- Counter-offers: only with retention plan beyond comp.

---

# Reference — Remote / Async Norms

## Default async
- Written-first.
- Decisions in writing.
- Status updates in writing.

## Meetings
- Opt-in; have agendas; capture notes + decisions.

## Overlap hours
- Defined per cross-timezone team.
- Used for high-context sync.

## Rituals
- Async standup + 1 sync.
- Async retro + 1 sync.

## Onboarding
- Structured (per `/em onboarding`).
- Buddy + manager + team introductions (video).

## Documentation
- Docs = source of truth.
- Decision logs in repo.

## Connection
- Socials (intentional).
- ERGs.
- Optional in-person (offsite).

## Pairing
- Across timezones for code.
- Async code review (clear PRs; recorded walkthroughs).

---

# Reference — Retention Signals + Interventions

## Warning signals
- Quiet in meetings.
- Missing 1:1s (or asking to cancel).
- Reduced output / engagement.
- Pulling back from stretch.
- Interviewing (passive).

## Stay interview (proactive)
- "What keeps you here?"
- "What would make you leave?"
- "What's missing?"
- "What's the most meaningful thing you've done here?"

## Interventions
- Compensation review.
- Promotion path.
- New stretch assignment.
- Title change.
- Mentor / coach.
- Role change.
- Sabbatical (where applicable).
- Honest conversation about whether this is the right place.

---

# Reference — Conflict Resolution Toolkit

## Healthy conflict
- About ideas / decisions / priorities.
- Welcome + facilitated.

## Unhealthy conflict
- About people / ego / turf.
- Intervene.

## Steps (manager as mediator)
1. Acknowledge: "I see there's friction."
2. Listen: each side, separately first if needed.
3. Reframe: interests, not positions.
4. Find common ground.
5. Decide + document.

## When escalation
- HRBP involved.
- Documentation.
- Plan (mediation / coaching / separation).

---

# Reference — Decision-Making Patterns

## Decisions in teams

| Decision class | Method |
|---|---|
| Trivial / reversible | Do it (just decide) |
| One-person domain | Owner decides (after input) |
| Cross-team impact | RFC + decision log |
| Significant / hard to reverse | ADR + multiple reviewers + sign-off |

## Decision log (ADR)

Per `/em decision-log` and `/doc adr`.

## Consensus vs consent

| Method | When |
|---|---|
| Consensus | Strategic; long-lived; few stakeholders |
| Consent (no objections) | Operational; time-bound; medium stakeholders |
| Owner decides | Tactical; reversible; clear owner |
| Vote | Tie-breaker; large group |
| Dictate | Emergency; IC-style |

## Avoiding analysis paralysis
- Time-box the decision.
- Reversibility heuristic (cheap-to-reverse = decide fast).
- Decision log captures the path (why not what).