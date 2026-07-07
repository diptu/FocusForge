---
name: marketing-cro-copywriting
description: Guides Claude through conversion rate optimization, copywriting, SEO, and growth analytics work — use when asked to improve a landing page, audit funnel conversion, write or rewrite marketing copy, plan an SEO content strategy, or diagnose a growth/analytics problem.
---

# Marketing: CRO, Copywriting, SEO & Growth Analytics

This skill helps with marketing engineering tasks that mix persuasion writing
with data-driven optimization: improving how a page or funnel converts,
writing copy that matches audience intent, planning organic search growth,
and reading analytics to find what's actually broken.

## When to apply this skill

Apply this skill when the user asks Claude to:

- Review or rewrite landing page, email, ad, or product copy
- Diagnose why a page, signup flow, or checkout isn't converting
- Plan or audit an SEO content strategy (keywords, structure, internal linking)
- Interpret analytics data (funnel drop-off, traffic sources, cohort retention)
  to recommend a growth action
- Design or evaluate an A/B test for a marketing page or flow

Do not apply this skill for pure brand/creative direction (logos, visual
identity) or for paid media buying strategy — those are adjacent but distinct
disciplines this skill does not cover.

## Step-by-step guidance

### 1. Establish the funnel stage and goal first

Before touching copy or design, identify which stage of the funnel is in
scope: awareness (SEO/content), acquisition (ads/landing page), activation
(signup/onboarding), or retention (email/lifecycle). CRO and copy fixes that
work at one stage often hurt another — e.g., aggressive urgency copy helps
acquisition conversion but can raise refund/churn rates if it overpromises.
State the goal metric explicitly (signup rate, checkout completion, organic
sessions) before recommending changes.

### 2. Copywriting reviews and rewrites

When asked to write or improve copy:

- Identify the single primary action the copy should drive (one CTA, not
  several competing ones).
- Match the copy's certainty and specificity to the buyer's stage: cold
  traffic needs problem-first framing, warm/returning traffic can go
  feature/benefit-first.
- Lead with the concrete outcome the reader gets, not the mechanism — cut
  vague adjectives ("powerful", "seamless", "next-generation") in favor of
  specific claims and numbers where they exist.
- Keep sentence and paragraph length short for scannability; use subheads
  that each carry a complete claim on their own (a skimmer reading only
  headlines should still get the pitch).
- Preserve any legally load-bearing claims (pricing, guarantees, compliance
  language) exactly — flag them for the user's confirmation rather than
  paraphrasing.
- Provide 2-3 variants when the ask is open-ended, each testing a distinct
  angle (e.g., pain-led vs. outcome-led vs. social-proof-led), rather than
  minor wording tweaks of the same angle.

### 3. Conversion rate optimization (CRO)

When asked to improve conversion on a page or flow:

- Ask for or infer the current funnel numbers (traffic, conversion rate,
  drop-off points) before prescribing fixes — don't guess at what's broken
  without data if data is available.
- Work top-down through friction points: does the page match the traffic
  source's intent (message match)? Is the value proposition clear above the
  fold? Is there one clear next action? Are trust signals (reviews, security
  badges, guarantees) present near the decision point? Is the form/checkout
  asking for more than the minimum needed at this stage?
- Prioritize fixes by estimated impact × ease, and say so explicitly — don't
  hand back an undifferentiated checklist.
- Frame every recommendation as a testable hypothesis: "if we do X, we expect
  metric Y to move because Z" — this makes the suggestion falsifiable and
  sets up the next step (a test) rather than a one-off opinion.

### 4. SEO strategy

When asked to plan or audit SEO:

- Start from search intent, not keyword volume: group target queries by
  informational vs. transactional intent, and match content type to intent
  (a comparison page for "X vs Y", a how-to for "how to do X").
- Check for one clear primary keyword/topic per page — competing pages
  targeting the same intent cannot both rank and will cannibalize each other.
- Recommend internal linking from high-authority existing pages to new or
  weaker pages targeting related terms.
- For technical SEO questions (indexing, crawl budget, canonicalization),
  be explicit about what's a content problem vs. a technical/crawlability
  problem — they require different fixes.
- Treat SEO as a lagging-indicator channel: set expectations that changes
  take weeks to months to show in rankings/traffic, unlike CRO changes which
  can be measured in days.

### 5. Analytics and growth diagnosis

When asked to interpret data or diagnose a growth problem:

- Locate the largest drop-off or anomaly first (biggest percentage-point
  loss between adjacent funnel steps, biggest week-over-week change) rather
  than reviewing every metric with equal weight.
- Distinguish volume problems (not enough traffic/leads) from conversion
  problems (enough traffic, but it doesn't convert) — the fixes for each are
  different (acquisition/SEO vs. CRO/copy) and shouldn't be conflated.
- Check for segment effects before concluding a metric moved overall — a
  blended conversion rate can move because traffic mix shifted (e.g., more
  low-intent paid traffic), not because the page got worse.
- When proposing an A/B test to validate a fix, specify: the hypothesis, the
  primary metric, a rough sample-size/duration expectation, and what would
  count as a clear enough result to ship — avoid recommending tests that
  can't realistically reach significance given the traffic described.

### 6. General output discipline

- Always tie a recommendation back to the stated goal metric — if the user
  hasn't stated one, ask or state the assumption explicitly rather than
  silently picking one.
- Keep recommendations concrete and actionable (specific copy, specific page
  section, specific metric) rather than generic marketing advice ("build
  trust", "optimize for conversions").
- When trade-offs exist between funnel stages (e.g., urgency copy boosts
  short-term conversion but may hurt retention), state the trade-off rather
  than optimizing one stage silently at the expense of another.
