---
name: aeo-geo-optimizer
description: Audits and improves how well a website is understood and cited by AI answer engines and generative search (ChatGPT, Perplexity, Google AI Overviews, Copilot); use when asked to improve AEO/GEO, "AI SEO," or why a site isn't being surfaced or quoted by AI assistants.
---

# AEO/GEO Optimizer

This skill helps audit and improve a website's visibility to AI answer engines and generative search systems — distinct from traditional SEO, which optimizes for ranking in a list of blue links. AEO (Answer Engine Optimization) and GEO (Generative Engine Optimization) optimize for a different outcome: being the source an LLM pulls from, paraphrases, or cites directly in a synthesized answer.

## When to apply this skill

Apply this skill when the user:
- Asks to improve AEO, GEO, "AI SEO," or visibility in ChatGPT/Perplexity/Gemini/Copilot answers
- Asks why AI assistants aren't citing or mentioning their site
- Asks for a content or technical audit aimed at LLM crawlers/retrieval rather than human readers or classic search engines
- Wants to restructure existing pages (docs, blog posts, product pages) to be more "quotable" or extractable by an LLM

Do not apply this skill for pure keyword-ranking SEO work with no AI-answer angle — that is a different, narrower goal (ranking position in traditional search results).

## Step 1: Run the foundational technical checks

Work through these categories, checking the site (or the pages/files the user provides) against each. Report pass/fail plus a specific fix for anything failing — don't just name the category.

**Crawlability & access**
1. `robots.txt` does not block AI crawlers (e.g. `GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, `CCBot`) unless that's an intentional choice — flag it either way so it's a deliberate decision, not an accident.
2. Pages are server-rendered or pre-rendered (not client-side-only JS) so an LLM crawler that doesn't execute JavaScript can read the content.
3. No paywall or login gate in front of the content the user wants cited.
4. Sitemap.xml exists, is current, and is referenced from robots.txt.

**Structured data & metadata**
5. Schema.org structured data present (Article, FAQPage, HowTo, Product, Organization as relevant) and valid.
6. Title tags and meta descriptions accurately summarize the page's actual answer, not just a marketing tagline.
7. Canonical URLs are set correctly to avoid duplicate-content ambiguity.
8. Open Graph / meta tags are complete (helps LLM tools that fetch link previews).

**Content structure for extraction**
9. Each page answers one clear question or topic near the top, in plain declarative sentences — not buried after paragraphs of preamble.
10. Headings (H1–H3) map to real sub-questions a user might ask, phrased close to natural language ("How does X work" rather than "Overview").
11. Key facts (numbers, dates, definitions, comparisons) are stated as standalone sentences that make sense out of context — LLMs often quote a single sentence, not a paragraph.
12. Lists and tables are used for enumerable facts (pricing, steps, comparisons) since these are easier for models to extract cleanly than prose.

**Authority & citation signals**
13. Author/organization identity and credentials are visible on the page (bylines, "About" links) — LLMs weight perceived authority.
14. Outbound citations to primary sources exist where the page makes factual claims — pages that behave like reliable sources are treated as reliable sources.
15. Freshness signals present (visible last-updated date) since LLM retrieval and answer engines favor recently verified content for time-sensitive topics.
16. The site is mentioned/linked from other reputable sources (docs, forums, review sites) — LLM training and retrieval corpora both weight cross-site corroboration.

## Step 2: Assess the six intelligence dimensions

Beyond the mechanical checks, evaluate content quality along these dimensions, and give the user a specific example of a passage that does or doesn't meet the bar:

1. **Directness** — does the page state the answer plainly, or does the user have to infer it from marketing language?
2. **Completeness** — does the page cover the sub-questions a real user (or an LLM on their behalf) would naturally ask next?
3. **Specificity** — concrete numbers, names, and steps instead of vague claims ("reduces latency by 40%" vs. "faster performance").
4. **Comparability** — for competitive topics, does the content give the honest comparison points an LLM would need to mention the site accurately alongside alternatives, instead of one-sided claims that get discounted?
5. **Structural parsability** — clean HTML semantics (real `<h1>`–`<h3>`, `<table>`, `<ul>`) rather than everything wrapped in generic `<div>`s with no semantic meaning.
6. **Consistency across pages** — the same facts (pricing, specs, positioning) stated the same way sitewide; contradictions between pages reduce an LLM's confidence in citing any single one.

## Step 3: Give framework-specific fixes

If the user names their stack, tailor the fix to it instead of giving generic advice:
- **Static site generators** (Next.js, Hugo, Jekyll, Astro): confirm static/SSR export is used for the pages that need to be crawled, not client-only rendering.
- **SPA frameworks** (React/Vue without SSR): recommend pre-rendering or SSR specifically for content pages (blog, docs, pricing), even if the app shell stays client-rendered.
- **CMS-based sites** (WordPress, Webflow, Contentful-backed): point to the specific plugin/settings surface for schema markup, robots.txt, and sitemap control rather than assuming hand-edited HTML.
- **Docs platforms** (Docusaurus, Mintlify, GitBook, ReadMe): check that the built output is static HTML per page (not a JS-only single-page app) since these are prime AEO targets for how-to and API questions.

## Step 4: Prioritize and report

Don't just dump 16+ findings unordered. Group results into:
1. **Blocking issues** — anything that prevents crawling/indexing at all (robots.txt blocks, no SSR, paywalls). Fix these first; nothing else matters if the content can't be read.
2. **High-impact content fixes** — restructuring for directness/extractability on the pages the user most wants cited.
3. **Polish** — schema markup completeness, freshness dates, cross-linking.

For each finding, give the specific fix, not just the diagnosis — e.g. not "add structured data" but "add `FAQPage` schema wrapping the Q&A block in `/pricing`."
