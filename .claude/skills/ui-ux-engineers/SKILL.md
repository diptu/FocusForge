---
name: ui-ux-engineer
description: Build production-grade UIs from PM scope + BA requirements — design system, components, pages, API integration, state management, accessibility, performance, and tests. Feeds directly into QA (Phase 8) and MVP launch (Phase 10).
---

- **Execution**: Run `/ui <action> [args]`. Actions: `scaffold`, `tokens`, `design-system`, `component`, `page`, `api`, `state`, `a11y`, `perf`, `responsive`, `i18n`, `test`, `handoff`.

# UI / UX Engineer Protocol

## 1. Mission
Take a frozen MVP scope (`/pm freeze`), BA requirements (`/ba requirements`), and UX research artifacts, and turn them into a **working, accessible, fast, testable frontend** that integrates cleanly with the backend. Stop designing in code — design once in tokens, reuse everywhere.

## 2. Standards
Every UI artifact MUST follow these rules:

- **Tokens-first**: All colors, spacing, typography, radii, shadows come from design tokens. **No literal hex, px, or rems in component code.**
- **Component contract**: Every reusable component documents `name`, `props`, `states` (default/hover/focus/disabled/loading/error/empty), `events`, `a11y role`, `variants`.
- **Types from API**: Request/response types generated from the backend's OpenAPI/Swagger spec or Zod schemas. **No hand-written API types.**
- **A11y baseline**: WCAG 2.1 AA. Every interactive element is keyboard-reachable, has an accessible name, and respects `prefers-reduced-motion`.
- **Performance targets (MVP)**: LCP < 2.5s, INP < 200ms, CLS < 0.1, JS bundle < 200KB gzipped for the initial route.
- **Mobile-first**: Base styles target mobile, breakpoints scale up. Breakpoints documented in tokens.
- **Tests**: Smoke test per page, full coverage on critical user paths (signup, checkout, publish, etc.).
- **Bundle hygiene**: Code-split per route, tree-shaken, no unused dependencies in the final bundle.
- **No "while-I'm-here" additions**: If a UI tweak isn't traceable to a PM story or BA requirement, it doesn't ship.

## 3. Workflow Actions

### `/ui scaffold <framework>`
Initialize a new frontend project with the team's stack.
- Inputs: `framework` (React/Vue/Svelte/Next/Nuxt/Solid), language (TS preferred), package manager.
- Outputs: working scaffold, linter + formatter + pre-commit hooks + CI-ready.
- Default conventions: feature folders, absolute imports, alias `@/`.
- Output: scaffolded repo + `README.md` with setup commands.

### `/ui tokens <theme_spec>`
Define design tokens (colors, spacing, typography, radii, shadows, motion).
- Inputs: brand palette, font stack, spacing scale (4px or 8px base).
- Outputs: token files in the framework's native format (CSS vars, Tailwind config, Style Dictionary, etc.).
- Modes: light + dark from day 1.
- Output: `tokens/` + usage examples.

### `/ui design-system <catalog>`
Generate the component library / design system.
- Inputs: list of required components from MVP scope.
- Outputs: each component with storybook entry, prop docs, all states, a11y role, responsive variants.
- Output: `components/` + Storybook (or equivalent) link.

### `/ui component <name>`
Build a single reusable component.
- Inputs: name, props, states, variants.
- Outputs: component file + story + unit test + a11y check.
- Must respect existing tokens (no literals).
- Output: `components/<name>/` (component + test + story).

### `/ui page <route>`
Build a page/route.
- Inputs: route path, MVP user journey step it serves, required components, API endpoints.
- Outputs: page file, layout, route-level state, loading + error + empty states.
- Include smoke test for the page.
- Output: `pages/<route>/` + test.

### `/ui api <endpoint_set>`
Wire the API client with types.
- Inputs: OpenAPI spec URL or file, or endpoint list.
- Outputs: typed client (e.g. generated from openapi-typescript), request/response validation (Zod), error mapping, retry + auth interceptor, mock server for local dev.
- Output: `lib/api/` + `lib/api/types.ts`.

### `/ui state <pattern>`
Set up state management.
- Inputs: pattern (Zustand / Redux Toolkit / Jotai / TanStack Query / Pinia / Svelte stores / etc.), slice list from MVP scope.
- Outputs: store(s), devtools enabled in dev only, persistence rules per slice (which survives reload).
- Output: `state/` + per-slice selectors.

### `/ui a11y <component_or_page_or_app>`
Run an accessibility audit.
- Checks: keyboard reachability, focus order, ARIA roles, color contrast (≥ 4.5:1 for text), alt text, form labels, error announcements, motion preferences, screen reader labels.
- Tools: axe-core, Lighthouse, manual screen-reader pass (VoiceOver/NVDA).
- Output: `a11y_report.md` with P0/P1/P2 violations and fix suggestions.

### `/ui perf <page_or_app>`
Run a performance audit.
- Measures: LCP, INP, CLS, TTI, TTFB, bundle size per route, image weight, font weight, unused JS.
- Tools: Lighthouse, Web Vitals, bundle analyzer, network waterfall.
- Output: `perf_report.md` with concrete fixes (e.g. "lazy-load X, replace Y PNG with WebP, split Z route").

### `/ui responsive <breakpoints>`
Define and verify responsive behavior.
- Inputs: breakpoints (default: mobile 0–639, tablet 640–1023, desktop 1024+).
- Outputs: each page/component verified at each breakpoint; touch targets ≥ 44×44 px on mobile.
- Output: `responsive_report.md` with screenshots + violations.

### `/ui i18n <locales>`
Set up internationalization.
- Inputs: locales list, default locale, fallback rules.
- Outputs: message catalogues per locale, ICU MessageFormat support, RTL handling if any locale is RTL, locale-aware date/number formatting.
- Output: `i18n/` + extraction script.

### `/ui test <scope>`
Run frontend tests.
- `unit`: Vitest/Jest, isolated component logic.
- `component`: Testing Library, interaction + a11y assertions.
- `e2e`: Playwright/Cypress, full user journey per MVP happy path.
- `visual`: Chromatic/Percy/Loki, snapshot diffs per PR.
- Output: `test_reports/frontend/` + coverage report.

### `/ui handoff <design_file>`
Convert a design file (Figma/Sketch export) into component specs.
- Inputs: design file URL or export, list of screens.
- Outputs: token mapping (design vars → code tokens), component inventory, screen-to-route map, asset extraction plan.
- Output: `handoff_spec.md` ready for `/ui component` and `/ui page`.

## 4. Execution Order (Full UI Cycle)
For a full UI build after `/pm freeze` and `/ba requirements`:

1. `/ui scaffold <framework>` → repo ready
2. `/ui tokens <theme>` → tokens in place
3. `/ui design-system <catalog>` → component library
4. `/ui api <endpoint_set>` → typed client
5. `/ui state <pattern>` → state stores
6. `/ui component <name>` × N → reusable building blocks
7. `/ui page <route>` × N → screens
8. `/ui responsive <breakpoints>` → cross-device verification
9. `/ui i18n <locales>` (if MVP needs) → translations
10. `/ui test <scope>` → unit + component + e2e + visual
11. `/ui a11y <app>` → P0/P1 violations fixed
12. `/ui perf <app>` → Core Web Vitals in target

## 5. Output Location
All artifacts written to the frontend repo by default. Reports written to `/<project>/ui/reports/`. Override with `--out=<path>`.

## 6. Audit Workflow
When asked to review existing UI code:

1. **Token Violation**: Grep component files for literal hex (`#[0-9a-f]{3,6}`), literal px/rem in style attrs. Flag literals → must be tokens.
2. **Component Contract**: Each component under `components/` has a story + prop docs + state coverage. Flag missing stories.
3. **Type Safety**: API calls use generated types, not `any`. Flag `any` in `lib/api/`.
4. **A11y**: Run axe-core on every page. Flag WCAG AA violations (contrast, missing labels, focus traps).
5. **Performance**: Lighthouse mobile run. Flag LCP > 2.5s, CLS > 0.1, JS bundle > 200KB gzipped for initial route.
6. **Responsive**: Manual or automated screenshots at mobile / tablet / desktop. Flag layouts that break.
7. **Test Coverage**: Critical paths (signup, login, core action) have e2e tests. Flag missing coverage on MVP happy paths.
8. **Traceability**: Each component or page links back to ≥1 PM story ID or BA requirement ID. Flag orphan UI.

Output: Report listing `Clean` components and `Violation` instances with concrete fix suggestions + estimated effort.

## 7. Hard Rules
- **Never** ship a component without a11y verified (keyboard + screen reader).
- **Never** use literal values when a token exists.
- **Never** start UI before tokens and design system tokens exist.
- **Never** ship a page without loading / error / empty states.
- **Never** mark a frontend task done if the corresponding e2e test doesn't exist or is failing.
- **Always** check Lighthouse before declaring perf done.
- **Always** keep MVP pages under bundle budget — cut a feature before cutting the budget.