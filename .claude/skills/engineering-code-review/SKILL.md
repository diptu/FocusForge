---
name: engineering-code-review
description: Production-grade code review practice — PR review process (who / when / how many), author + reviewer discipline, language-aware review checklists (Python / Go / TypeScript / Java / Rust / Ruby / PHP / C++ / Elixir / Scala), substantive review dimensions (correctness / concurrency / error handling / resource leaks / security / performance / observability / compatibility / migration / tests / configuration / feature flags / rollback / docs / dependencies / customer impact), AI-assisted review (Copilot + CodeReviewBot + custom), bot enforcement (CODEOWNERS, branch protection, required checks, signed commits), PR size budget (< 400 LOC, escalation over), time-to-first-review budget (< 4h business), review metrics (cycle time, depth, ratio, comments/PR), review anti-patterns, hotspots + ownership, audit-of-review-practice. The default review skill in the engineering cluster. Pairs with `engineering-audit` (code health + review metrics in scorecards), `devops-ci` (review gates in pipelines), `devops-terraform` (infra code review), `devops-documentation` (doc review), `devops-sre` (review of reliability changes), `devops-docker` (image / Dockerfile review), `security-appsec` (deep security review), and every stack-specific skill (language idioms inform checklist).
---

- **Execution**: Run `/review <action> [args]`. Actions: `process`, `principles`, `checklist`, `author`, `reviewer`, `tone`, `style`, `python`, `go`, `typescript`, `java`, `rust`, `ruby`, `php`, `cpp`, `elixir`, `scala`, `kotlin`, `swift`, `arch`, `security`, `performance`, `test`, `api`, `data`, `sql`, `infra`, `dockerfile`, `kubernetes`, `frontend`, `ml`, `feature-flag`, `migration`, `rollback`, `breaking-change`, `pr`, `approve`, `fast-track`, `ai`, `bot`, `hotspot`, `ownership`, `label`, `template`, `anti-pattern`, `metrics`, `cycle-time`, `depth`, `audit`.

# Engineering Code Review Protocol

## 1. Mission
Build a code review practice that is **small, fast, substantive, learning, bot-augmented, ownership-aware, and metric-tracked**. The skill owns the conventions a team standardizes on — so 12 engineers don't end up with 12 opinions on PR size, 12 different ways of writing tests, 12 contradictions about whether AI review "counts", and 12 different PR templates.

> **Core principle:** Code review is the cheapest defect-prevention tool we have, and the most powerful teaching mechanism we have for distributed teams. It must be small (PR size budgets), fast (time-to-first-review budgets), substantive (humans focus on correctness / tradeoffs / safety; bots enforce style), and tracked (cycle time / depth / closure trends). A PR is a question to the team; the team's response (review) is an answer to the question. The answer must come back fast enough that the answer matters. The answer's substance must be substantial enough that the team trusts it.

## 2. Standards
Every PR review MUST follow these rules:

- **PR size budget**: target < 400 LOC changed. Patches 100-400 LOC get 2 reviewers. < 100 LOC gets 1 reviewer. > 400 LOC requires explicit justification; default behavior is to ask author to split. > 800 LOC gets a process violation flag.
- **Time-to-first-review budget**: target < 4 business hours for routine PRs. Pager / rotation for review coverage. PR review SLA is a metric.
- **Time-to-merge budget**: routine < 24h, hotfix < 1h. Aging PRs flagged daily.
- **Linters enforce style, humans enforce substance**: formatting / lint / spelling / type-check / imports / imports order / dead code — all linter gates. Reviewers do NOT comment on these. They use the substantive checklist only.
- **Review depth scales with PR size + risk**:
  - < 100 LOC: 1 reviewer, default depth.
  - 100-400 LOC: 1-2 reviewers, +1 reviewer for security/cross-service.
  - 400-800 LOC: 2 reviewers + CODEOWNERS satisfied.
  - 800+ LOC: 2 reviewers + security + arch review + extra-leadership approval.
  - Hotfix: 1 reviewer (or 2 if humanly possible), focused on correctness + rollback.
- **CODEOWNERS explicit**: cross-team paths have a named owner (`@team/<handle>` or `@<handle>`). Approvals from CODEOWNERS gate merge.
- **Bot enforcement is durable**: branch protection, required checks, signed commits, conventional commit, CODEOWNERS required. Bots enforce 24/7; humans enforce during business hours.
- **AI review is augmentation**: bots (Copilot, CodeReviewBot, custom) catch style + obvious bugs + security smells + doc-string drift; humans catch substance + tradeoffs + context + disagreements with rubric.
- **PR template gates authorship**: every PR has a description (what / why / how / test plan / migration / rollback / customer impact / risk). Linter fails the PR if any field is empty.
- **Description discipline**: PR title is imperative ("Add rate limiter to login"). PR body references an issue / ticket. Test plan is concrete ("covers empty input, single item, large input, error path").
- **Reviewer tone is for learning**: descriptive comments, questions over demands, "what do you think about X?" over "this is wrong", "consider Y" over "don't do Z". Code review is a teaching tool; tone matters.
- **Author addresses feedback explicitly**: every review comment has one of (👍 fixed / discussed-and-disagree). No silent close-out.
- **Conflict resolved in PR or sync**: blocking comments drive iteration; non-blocking items go to follow-up issues. The author decides; the reviewer can re-request review.
- **Tracked metrics**:
  - Cycle time (first commit → merge).
  - Time-to-first-review.
  - Review depth (median reviewer-comment count per 100 LOC).
  - Comments-to-LOC ratio (substance vs noise).
  - First-pass approval rate.
  - Rollback rate (deploys that caused incidents).
  - Hotspot concentration (top 5 files by review-churn).
- **Anti-pattern rejection**: PRs with squashed history failure (lost context), PR with no description, PR with failing CI, PR with no reviewers, PR that touches CODEOWNER file without updating CODEOWNERS — all blocked at gate.
- **Reviews leave a trail**: every comment is timestamped; review status changes logged; decisions captured (accept / reject / discuss); bikeshedded comments retracted.
- **Cross-functional reviewers**: arch / security / data / sre review per file class (cross-cuts with other cluster skills).
- **No silent approvals**: reviewers must leave at least one substantive comment OR explicitly write "LGTM" with a list of checks (security / test / contract). Approvals alone without comments are anti-patterns.

## 3. Workflow Actions

### `/review process [scope]`
Define / amend code review process.
- Inputs: org size, team topology, tooling (GitHub / GitLab / Bitbucket / Phabricator / Gerrit), risk appetite.
- Outputs:
  ```markdown
  # Code Review Process: <org>

  ## Outcome
  Faster + smaller + safer changes; higher bus factor; shared context.

  ## PR size budgets
  | LOC | Reviewers | Approvals |
  |---|---|---|
  | 0-100 | 1 | 1 |
  | 100-400 | 1-2 | 1-2 |
  | 400-800 | 2 + CODEOWNERS | 2 |
  | 800+ | 2 + arch / security | 3 |

  ## SLA
  - First review: < 4h business
  - Merge: < 24h routine, < 1h hotfix
  - Aging alert: > 48h unmerged

  ## Required checks (CI)
  - [ ] Lint passes
  - [ ] Type-check passes
  - [ ] Tests pass
  - [ ] Coverage gate
  - [ ] SAST (CodeQL)
  - [ ] Dependency scan
  - [ ] Review approvals from CODEOWNERS
  - [ ] PR description complete

  ## Roles
  - **Author**: writes PR; addresses feedback; final say on code.
  - **Reviewer**: comments on substance; asks questions; approves.
  - **CODEOWNERS**: gate on cross-team surface.
  - **Security reviewer**: gate on security-sensitive files.
  - **Arch reviewer**: gate on architecture-changing surface.

  ## Tone rules
  - Comments descriptive, not prescriptive when possible.
  - Questions over demands.
  - Distinguish blocking vs non-blocking.
  - Approve only after addressing or discussing each blocking comment.

  ## Tools
  - GitHub PR + CODEOWNERS + branch protection.
  - Copilot / CodeReviewBot for first-pass.
  - CodeQL in CI for security.
  - SonarQube for code health metrics.
  - Conventional-commits check.
  - Linear / Jira / GitHub issues linked.
  ```

### `/review principles`
Reference canon for the review practice.
- Outputs the org's review principles doc:
  1. **Review is small** — small PRs get reviewed; big PRs get split.
  2. **Review is fast** — time-to-first-review < 4h; merge < 24h.
  3. **Review is substantive** — humans cover substance; bots cover style.
  4. **Review is learning** — tone is generous; questions over commands.
  5. **Review is risky-aware** — high-risk changes get high-effort review.
  6. **Review is tracked** — metrics surface trends; anti-patterns get enforced.
  7. **Review is owned** — CODEOWNERS for every cross-team surface.
  8. **Review is exception-handled** — emergencies have a fast-track with safety.

### `/review checklist`
Canonical reviewer checklist (used in PR template + reviewer skill).
- Outputs: 5-section checklist covering the 19 dimensions in § 4 below.

### `/review author [pr_id_or_kit]`
Author guide: how to write a great PR.
- Outputs:
  ```markdown
  # Author Guide

  ## Before opening
  - Branch off main.
  - Rebase / merge main if conflict.
  - Run lint / tests / format locally.

  ## PR title
  Imperative: "Add rate limiter to login", not "WIP", not "fix", not "misc".

  ## PR body (template)
  - What changed (1-3 sentences).
  - Why (link to issue / design doc).
  - How tested (test plan).
  - Migration plan / data impact.
  - Rollback plan.
  - Customer / user impact.
  - Risk class (low / normal / high / emergency).
  - Screenshots / recording (UI).

  ## PR size
  Aim < 400 LOC. Split if larger. Use stacked PRs / feature flags.

  ## Description hygiene
  - Self-review: re-read your diff once.
  - Don't describe the diff; describe the change.
  - Highlight what reviewers should focus on.

  ## Local CI parity
  Run the same checks as CI before pushing.

  ## After opening
  - Watch for review within 4h.
  - Ping reviewers if stuck.
  - Address feedback: fix + comment "fixed in <sha>" or explain push-back.
  ```

### `/review reviewer [pr_id_or_kit]`
Reviewer guide: how to review well.
- Outputs:
  ```markdown
  # Reviewer Guide

  ## First response < 4h
  Either a substantive review, or "I'll review by <time>".
  Don't leave PRs orphaned.

  ## First read (5-10 min)
  Understand the intent before touching the diff.
  - Read the description + linked issue.
  - Skim the structure (top-level files; numbers; shapes).
  - Identify the riskiest part of the change.

  ## Then the checklist (5 dimensions, in this order)
  1. Correctness / edge cases / errors.
  2. Security / authn / input validation.
  3. Performance / N+1 / hot path.
  4. Tests (substance, not coverage).
  5. Rollback / migration / compat.

  ## Comment hygiene
  - Mark each comment "blocking" or "non-blocking".
  - Distinguish "must change" from "consider" from "nit".
  - Question first: "What happens if X?" beats "Don't do X".
  - One concern per comment (so author can address atomically).

  ## Approval rules
  - Don't approve without addressing blocking comments.
  - Don't approve a PR you don't understand.
  - Approve explicitly; not silently.
  - "LGTM" requires a check list (security / tests / contract) — at minimum.

  ## Tone
  - Generous by default.
  - Disagreement on substance: state position, ask author to defend or defer.
  - If deadlocked: escalate to a third party (lead / mutual reviewer).

  ## After approval
  - Author handles merge (or auto-merge when squash rebase policy).
  - Watch the deployment (especially for prod).
  - Don't leave the PR silently merging; lend a hand.
  ```

### `/review tone [conflict]`
Tone guidance for high-conflict reviews.
- Inputs: tone question (e.g., "how to push back on an engineer who disagrees with the team's choice").
- Outputs:
  - **Tone ladder**:
    | Level | Example |
    |---|---|
    | Questioning | "What happens if input is empty here?" |
    | Suggesting | "Consider handling empty input explicitly." |
    | Proposing | "What about this alternative?" |
    | Pushing back | "I'd prefer Y over X here, because ... What do you think?" |
    | Rejecting | "I'd block the PR on this; can we discuss a path that resolves?" |
  - **Escalation**: when tone fails, escalate via lead — explain the question, not the person.
  - **Rules**: comments on systems; never on people. Critique the work. Be ready to defer.

### `/review style [target]`
Style for review comments.
- Outputs style guide:
  - One concern per comment.
  - Blocking vs non-blocking prefix: `[blocking]` / `[consider]` / `[nit]`.
  - Reference / link to guidance (don't re-explain conventions).
  - Suggest + accept alternative (in the same comment when possible).
  - Emoji status: 👍 (fixed) / 👀 (looking) / 😕 (need more info) / 🚫 (blocker).

### `/review python [pr]`
Python-specific review checklist.
- Outputs:
  | Concern | Look for |
  |---|---|
  | Type annotations | All public APIs; `Optional` for nullable; `Sequence` vs `list` for input |
  | Pydantic | Models for inputs; `Field(...)` for validation |
  | Async | `async def` only where I/O; `await` all coroutines; no blocking I/O in event loop |
  | Resource mgmt | `with` for files / connections / locks; context managers custom |
  | Imports | isort; stdlib first; `from x import y` style consistent |
  | Error handling | catch narrow exceptions; re-raise with chain; log with context |
  | Tests | pytest; `tmp_path` / `monkeypatch` / `caplog`; coverage gate |
  | Type-check | `mypy --strict` or `pyright` clean |
  | Lint | ruff + black + isort clean |
  | Common pitfalls | Mutable default args; `is None` vs `== None`; truthy ambiguity with int 0 |
  | Pythonic | comprehensions where readable; `enumerate` over `range(len(...))`; `pathlib.Path` over `os.path` |

### `/review go [pr]`
Go-specific review checklist.
- Outputs:
  | Concern | Look for |
  |---|
  | Errors | Always handle `err != nil`; never `_ =`; wrap with `fmt.Errorf("...: %w", err)` |
  | Context | First arg of every public I/O function: `ctx context.Context` |
  | Goroutine leaks | `defer cancel()`; channels properly closed; `errgroup` for fan-out |
  | Mutex hygiene | Don't hold lock over I/O; don't copy after lock; `sync.RWMutex` where reads-heavy |
  | Logging | `slog` (or structured logger); no `fmt.Println` in prod; don't log secrets |
  | Naming | `MixedCaps`; no stuttering (`pkg.PkgFunc`); concise |
  | Tests | Table-driven; `t.Run` per case; `testify` for assertions; race detector enabled |
  | Race detector | `go test -race` in CI |
  | Common pitfalls | `for i := range items` capture bug; channel direction in signatures; nil slice vs empty slice |
  | Build tags | `//go:build integration` for integration tests |
  | Module hygiene | `go.mod` tidy; replace directives not in main |

### `/review typescript [pr]`
TypeScript-specific review checklist.
- Outputs:
  | Concern | Look for |
  |---|
  | Type strictness | `strict: true`; no `any`; `unknown` for unknown shape; `as` only when narrowed |
  | Null checks | Optional chaining + nullish coalescing; `??` over `||` for default |
  | Promises | `async/await`; `Promise.all` for parallel; never float promise (`void` only at boundaries) |
  | React | Hooks rule (deps array); `useMemo`/`useCallback` not defaulted; effects cleaned up |
  | State | Avoid `useEffect` for state derivation; lift state when shared; reducer for complex state |
  | Types | Discriminated unions over enums; `as const`; readonly arrays for inputs |
  | Imports | Barrel-free imports in hot paths; tree-shaking preserved |
  | Tests | vitest / jest; RTL for component tests; MSW for API mocks |
  | Async errors | Top-level error boundary; try/catch in async; typed errors (`as Error`) |
  | Bundle size | Code-splitting; dynamic imports for heavy libs |
  | Linting | `eslint` + `@typescript-eslint`; `tsc --noEmit`; Prettier clean |

### `/review java [pr]`
Java-specific review checklist.
- Outputs:
  | Concern | Look for |
  |---|
  | Null safety | `@Nullable` / `@NonNull`; `Optional` for return types; null-object pattern where applicable |
  | Exceptions | Catch specific; never catch `Throwable` in app code; try-with-resources for I/O |
  | Concurrency | `CompletableFuture`; thread pool sizing; never `Thread.sleep` in prod |
  | Collections | `List.of` over `Collections.unmodifiableList`; fail-fast iterators |
  | Build | Maven / Gradle hygiene; BOM versions; no `latest` |
  | Logging | SLF4J + Logback; parameterized messages; no `+` concatenation |
  | Tests | JUnit 5; `@ParameterizedTest`; Mockito for mocks; Testcontainers for integration |
  | Records | Use records for DTOs; sealed classes for ADTs |
  | Stream API | `Optional.stream()` for safe traversal; never side-effect in `map` |
  | Common pitfalls | `equals` without `hashCode`; mutable static state; `==` on boxed primitives |

### `/review rust [pr]`
Rust-specific review checklist.
- Outputs:
  | Concern | Look for |
  |---|
  | Ownership | Borrows vs moves; lifetimes inferred; no unnecessary `clone()` |
  | Error handling | `Result<T, E>` over panic; `?` operator; `thiserror` for error types |
  | Async | `tokio` runtime consistent; `Send` bounds where needed; no blocking in async |
  | Panics | `unwrap` / `expect` only in tests + clearly-justified code |
  | Unsafe | Every `unsafe` block commented with safety argument; bounded scope |
  | Trait design | Sealed traits where applicable; `From` / `TryFrom` for conversions |
  | Macro hygiene | Macro expansion visible; no abuse of syntax |
  | Tests | `cargo test`; `proptest` for fuzz; `criterion` for benchmarks |
  | Lint | `cargo clippy` clean; `cargo fmt` clean |
  | Common pitfalls | `String` vs `&str`; `Vec::new()` vs `vec![]`; `as` casts only when safe |

### `/review ruby [pr]`
Ruby-specific review checklist.
- Outputs:
  | Concern | Look for |
  |---|
  | Naming | `snake_case`; predicates end `?`; mutators end `!`; constants `UPPER` |
  | ActiveRecord | N+1 queries (`includes`); scopes over class methods; `find_each` for batches |
  | Blocks | `do...end` for multi-line; `{...}` for single-line; `map`/`select` over each-loops |
  | Errors | `rescue` narrow class; never `rescue Exception`; `raise` over `fail` |
  | Tests | RSpec; `let_it_be` for immutable; `aggregate_failures`; shared examples |
  | Performance | `pluck` over `map(&:x)` for fields; `find_in_batches` for memory |
  | Metaprogramming | `define_method` over `class_eval("...")` where possible |
  | Security | Brakeman in CI; strong parameters; CSRF tokens; SQL parameterized |
  | Idioms | `each_with_object` vs `inject`; `dig` for nested; Symbol vs String keys consistent |

### `/review php [pr]`
PHP-specific review checklist.
- Outputs:
  | Concern | Look for |
  |---|
  | Types | Declared return types; `declare(strict_types=1)`; nullable types `?Type` |
  | Laravel/Symfony | Form Request validation; Eloquent eager load; `firstOrCreate` vs `updateOrCreate` |
  | Errors | Try/catch narrow; never swallow silently; log with context |
  | Security | `htmlspecialchars` for output; CSRF; parameterized SQL; never `eval` / `unserialize` user input |
  | Tests | PHPUnit / Pest; `RefreshDatabase`; `actingAs` for auth |
  | Static analysis | PHPStan / Psalm clean at level 5+ |
  | Logging | Monolog with context; no `print_r` / `var_dump` in prod |
  | Common pitfalls | `$this` in closures; array vs `ArrayAccess`; string interpolation vs concatenation |

### `/review cpp [pr]`
C++-specific review checklist.
- Outputs:
  | Concern | Look for |
  |---|
  | Memory | RAII everywhere; smart pointers; no naked `new`/`delete`; rule of 5/0 |
  | Const correctness | `const` on inputs; `const` methods; `constexpr` where applicable |
  | Errors | Exceptions or `expected<T,E>`; never error codes silently |
  | Concurrency | Mutex `lock_guard` / `unique_lock`; no data race; thread sanitizer clean |
  | Templates | Type traits; SFINAE; concepts (C++20) preferred |
  | Build | CMake hygiene; no in-source build; sanitizer-enabled CI build |
  | Tests | GoogleTest / Catch2; coverage with gcov / llvm-cov |
  | Static analysis | clang-tidy; clang-analyzer; `-Wall -Wextra -Wpedantic` clean |
  | Common pitfalls | Object slicing; implicit conversion; signed / unsigned comparison; `this` capture in lambdas |

### `/review elixir [pr]`
Elixir-specific review checklist.
- Outputs:
  | Concern | Look for |
  |---|
  | Processes | `start_link`; linked to supervisor; child spec |
  | Errors | Let it crash philosophy; `with` for chains; `:ok | {:error, reason}` |
  | Pattern matching | Function head clauses; no `case`-golf |
  | GenServer | `handle_call` / `handle_cast` separation; `terminate/2` for cleanup |
  | Ecto | `preload` to avoid N+1; changesets validate; `Repo.transaction` for atomicity |
  | Tests | ExUnit; `describe` blocks; `async: true` where safe; ExMachina for factories |
  | OTP | Supervisors tree; release configuration; hot code reload considered |
  | Common pitfalls | String vs charlist; `nil` collision; `Enum.at` O(n) over indexing |

### `/review scala [pr]`
Scala-specific review checklist.
- Outputs:
  | Concern | Look for |
  |---|
  | Types | `case class` / `enum` over inheritance; `Option` over null; `Either` / `Try` for errors |
  | FP | Purity where possible; referential transparency; effect types (cats-effect / ZIO) |
  | Collections | `LazyList` for big streams; `Vector` for indexed reads; never `var` |
  | Concurrency | `Future` for blocking I/O; effect systems for non-blocking |
  | Tests | ScalaTest; property-based with ScalaCheck; MUnit for Scala 3 |
  | Build | sbt hygiene; Scala 3 where applicable; scalafix + scalafmt clean |
  | Common pitfalls | `null` leaks; reflection abuse; type erasure in pattern matching |

### `/review kotlin [pr]`
Kotlin-specific review checklist.
- Outputs:
  | Concern | Look for |
  |---|
  | Null safety | `?` for nullable; `!!` only at boundaries; `let`/`also`/`apply`/`run` for scoping |
  | Coroutines | `viewModelScope` / `lifecycleScope`; structured concurrency; `Flow` over `RxJava` |
  | Collections | `List` / `Map` / `Set`; `listOf` vs `mutableListOf`; sequences for big pipelines |
  | Extensions | Extension functions where natural; no extension on platform types |
  | Tests | JUnit 5 + MockK + Turbine (Flow testing); Kotlinx-Coroutines-Test |
  | Static analysis | ktlint / detekt; KSP for codegen |
  | Common pitfalls | Platform types from Java; data class with mutable fields; SAM conversion |

### `/review swift [pr]`
Swift-specific review checklist.
- Outputs:
  | Concern | Look for |
  |---|
  | Optionals | `if let` / `guard let`; `?` chains; no force-unwrap (except invariants) |
  | Errors | `do/try/catch`; typed throws (Swift 6); `Result` for boundaries |
  | Concurrency | `async` / `await`; `@MainActor` for UI; `Sendable` conformance |
  | Memory | ARC; weak/unowned cycles caught; `[weak self]` in closures |
  | Tests | XCTest; async test functions; snapshot tests |
  | Frameworks | Combine / SwiftUI / UIKit patterns consistent |
  | Build | SwiftPM (SPM); no `latest` for SPM deps |

### `/review arch`
Architecture review sub-checklist.
- Outputs:
  - **Coupling**: new dependencies are explicit + minimal.
  - **Cohesion**: change belongs in one module; not scattered across files.
  - **Boundaries**: API surface stable; modules don't leak impl.
  - **State management**: state ownership clear; no shared mutable global.
  - **Concurrency model**: appropriate for the surface (single writer, queue, actor).
  - **Failure isolation**: failure in this service doesn't cascade.
  - **Backpressure**: queue depth bounded; saturated → drop / shed / reject.
  - **Observability**: traces / metrics / logs from day one.
  - **Migration story**: rollout + rollback documented; staged if possible.

### `/review security`
Security review sub-checklist. Pairs with `security-appsec`.
- Outputs:
  - **Authn / Authz**: every request authenticated; every action authorized.
  - **Input validation**: typed schemas; reject unknown; whitelisting > blacklisting.
  - **Output encoding**: HTML / JSON / SQL parameterized.
  - **Secrets**: no literals in code / logs; secrets via Vault / Secrets Manager.
  - **Cryptography**: TLS 1.2+; vetted primitives; key rotation story.
  - **Audit log**: state-changing actions logged; PII access logged.
  - **SSRF / CSRF / XSS / SQLi**: input targeted at internal endpoints; tokens on state-changing requests; output escaped; queries parameterized.
  - **Rate limiting / quotas**: per-user / IP / token.
  - **Dependencies**: Snyk / Dependabot clean on HIGH/CRITICAL.
  - **Threat model**: new surface documented in threat model.
  - **PII / data classification**: data tag consistent with policy.

### `/review performance`
Performance review sub-checklist.
- Outputs:
  - **Algorithmic complexity**: O(n) vs O(n²) by inspection.
  - **N+1 queries**: ORM loop replaced with eager load / batch.
  - **Hot path**: caching where allowed; cached key correctness (invalidation).
  - **Memory**: no unbounded collections; allocations in inner loop flagged.
  - **I/O**: sync I/O replaced with async; pool sized correctly.
  - **Serialization**: binary vs JSON; Schema registered; no `runtime` reflection in hot path.
  - **Latency budget**: p99 acceptable for the surface; degraded path faster than fail.
  - **Load test**: hot paths load-tested (k6 / Locust / wrk).
  - **Continuous profiling**: Pyroscope / Phlare / Datadog APM wire for hot path.

### `/review test`
Test review sub-checklist.
- Outputs:
  - **Tests test behavior, not implementation**: mock at the seam; not the unit.
  - **Coverage pyramid**: many unit, fewer integration, fewer e2e.
  - **Edge cases**: empty / null / boundary / large / malformed.
  - **Failure paths**: error returns tested; not just happy path.
  - **Deterministic**: no `sleep`; no time-dependent; no random-without-seed.
  - **Fast**: unit < 100ms; integration < 5s; e2e < 30s.
  - **Isolated**: no shared mutable state; no network in unit; test data factory.
  - **Names**: `describe` / `it` / `class` names describe behavior.
  - **Brittle avoidance**: don't test private impl; don't test framework.
  - **Mutation score**: mutated code caught by tests.

### `/review api`
API contract review sub-checklist.
- Outputs:
  - **Backwards compat**: existing clients still work; new clients get new behavior.
  - **Versioning**: explicit (URL path or header); deprecation path defined.
  - **Idempotency**: state-changing endpoints accept idempotency key; replay-safe.
  - **Pagination**: cursor over offset; stable order.
  - **Errors**: typed error envelope; documented status codes; trace ID in error.
  - **Auth**: every endpoint authenticated (except explicit public).
  - **Rate limiting**: per-user / per-API key.
  - **Schema**: OpenAPI from source; change is breaking-diff-aware.
  - **Documentation**: updated, with example.
  - **Tests**: contract tests for downstream consumers; unit tests for handlers.
  - **Backwards-incompatible change**: explicit ADR; migration path; communication.

### `/review data`
Data layer / migration review sub-checklist.
- Outputs:
  - **Schema change**: reversible; backward-compatible; data migration scripted.
  - **Backfill**: idempotent; staged; observable; rollback-ready.
  - **Index change**: impact on writes vs reads; online vs offline.
  - **PII handling**: classified; encrypted; retention policy.
  - **Migration testing**: on production-shape data; rehearsals recorded.
  - **Read / write split**: read replica correctly used; write routed to primary.
  - **Transaction boundary**: match business invariant; avoid long-running tx.
  - **Audit trail**: state-changing data → audit log + retention.
  - **Soft delete / hard delete**: policy explicit.

### `/review sql`
SQL / query review sub-checklist.
- Outputs:
  - **Parameterized**: no string concatenation / `f"..."` in queries.
  - **Index used**: `EXPLAIN` shows plan; no table scan on hot path.
  - **N+1 batched**: `WHERE id IN (...)` over loop.
  - **Lock scope**: minimum row lock; `FOR UPDATE` only where needed.
  - **Migration**: reversible; online (no extended lock); production-rehearsed.
  - **Naming**: snake_case; table plural; column singular.
  - **Types**: NOT NULL explicit; defaults safe; arrays/JSON used deliberately.
  - **Cost**: rows-examined / latency on production-shape data.

### `/review infra`
Infrastructure / Terraform review. Pairs with `devops-terraform`.
- Outputs: state remote / module published / variable validated / provider pinned / plan reviewed / secrets via Vault / tags applied / OPA policy passing / cost delta acknowledged / drift reconciled.

### `/review dockerfile`
Dockerfile review.
- Outputs:
  - **Base image**: distroless / alpine / minimal; pinned digest; supported.
  - **Multi-stage**: builder + runtime separate.
  - **Non-root user**: explicit `USER` directive; UID > 1000.
  - **Layers**: COPY minimal; `.dockerignore` set; `apt-get clean` after install.
  - **Caching**: stable `apt-get update` + install in one layer.
  - **Secrets**: none in image; `BuildKit` `--secret` mounts where needed.
  - **Healthcheck**: `HEALTHCHECK` directive present.
  - **Sigstore**: image signed; SBOM attached.
  - **Labels**: `org.opencontainers.image.*` metadata.
  - **Trivy clean**: HIGH/CRITICAL = 0.

### `/review kubernetes`
Kubernetes manifest review.
- Outputs:
  - **Resources**: requests + limits set; QoS class appropriate.
  - **Probes**: liveness + readiness + startup defined.
  - **Security context**: `runAsNonRoot: true`; `readOnlyRootFilesystem: true`; `seccompProfile`.
  - **Service account**: dedicated; minimal RBAC.
  - **NetworkPolicy**: default-deny + explicit allow.
  - **PodDisruptionBudget**: set for stateful.
  - **Anti-affinity**: where appropriate.
  - **HPA / VPA**: tuned thresholds; min replicas for stateful.

### `/review frontend`
Frontend (React / Vue / Svelte) review.
- Outputs:
  - **Bundle size**: dynamic imports for heavy; tree-shaking preserved.
  - **A11y**: ARIA where needed; keyboard nav; contrast.
  - **Performance**: image formats / sizes; lazy below-fold; memo where measured.
  - **State**: avoid global; lift when shared; reducer for complex.
  - **Data fetching**: SWR / TanStack Query; cache invalidation; stale-while-revalidate.
  - **Error boundary**: catches UI errors; graceful fallback.
  - **Tests**: RTL/Vue Test Utils; coverage threshold.
  - **Lint**: ESLint + Stylelint clean.

### `/review ml`
ML model / pipeline review.
- Outputs:
  - **Data**: leakage check; train/val/test split; PII handling.
  - **Features**: versions stored; pipeline deterministic.
  - **Training**: seeded; tracked; reproducible.
  - **Eval**: offline metrics; online A/B; fairness / bias check.
  - **Inference**: latency p99; cost-per-inference; monitoring drift.
  - **Model card**: dataset, intended use, limitations, owner.
  - **Rollback**: model version pinned; previous model reachable.

### `/review feature-flag [pr]`
Feature flag review.
- Outputs:
  - **Default off** in prod; percentage rollout declared.
  - **Kill switch** wired.
  - **Owner** declared.
  - **Stale flag** policy: kill-by date; reaper process for aged flags.
  - **Telemetry** for both states (A/B observations).

### `/review migration [pr]`
Migration review (data / schema / API).
- Outputs:
  - **Reversible**: rollback plan documented + rehearsed.
  - **Backward compatible**: dual-write / shadow / canary.
  - **Observability**: tracking migration step; alerts on stalled.
  - **Backfill**: idempotent + staged + bounded.
  - **Lock-safe**: no extended blocking locks.

### `/review rollback [pr]`
Rollback plan review.
- Outputs:
  - **Plan documented**: explicit steps to undo.
  - **Trigger criteria**: when to rollback (SLO burn > X / error rate > Y).
  - **Rehearsed**: rollback tested in staging or game day.
  - **Safe under load**: rollback doesn't itself break (mid-rollback backouts).

### `/review breaking-change`
Breaking-change review.
- Outputs:
  - **ADR captured**.
  - **Deprecation notice** sent to consumers (RFC + grace period).
  - **Dual support period** defined (typically N-1 versions).
  - **Communication**: changelog, docs, customer email if user-facing.
  - **Migration guide** for consumers.
  - **Rollout**: percentage rollout + opt-in flag.

### `/review pr <pr_id>`
Per-PR guided review.
- Inputs: PR ID / URL.
- Outputs:
  - Pull PR metadata (title, body, files, diff, CI status).
  - **First-pass summary**:
    - Risk class (low / normal / high / emergency) inferred from touched files.
    - Reviewer set inferred from CODEOWNERS.
    - Substance checklist applied.
    - Style checklist deferred to bot.
  - **Substantive items** (blocking):
    - Correctness / edge cases / errors / leaks.
    - Security (per checklist).
    - Performance / N+1 / hot path.
    - Migration / rollback / compat.
  - **Consider items** (non-blocking):
    - Style / naming / refactor opportunities.
  - **Approval criteria**: every blocking comment addressed or discussed.
  - **Optional**:
    ```markdown
    ## Review (auto-draft)
    PR: #<id> <title>
    Author: @<handle>  | Risk: <class>  | +<N>/-<N> LOC across <K> files
    Files touched: <list> by category: src, test, config, infra, docs
    Required reviewers: @<list>
    CI: <status>
    
    ### Substance review
    - [ ] Correctness: <notes>
    - [ ] Edge cases: <notes>
    - [ ] Errors: <notes>
    - [ ] Security: <notes>
    - [ ] Performance: <notes>
    - [ ] Tests: <notes>
    - [ ] Migration / rollback: <notes>
    - [ ] Docs: <notes>
    - [ ] Customer impact: <notes>
    
    ### Auto-checks (bots)
    - [ ] Lint, type-check, tests, coverage, SAST, dep-scan, signing
    - [ ] PR description complete
    - [ ] CODEOWNERS satisfied
    
    ### Decision
    - [ ] APPROVED
    - [ ] CHANGES_REQUESTED (<list>)
    - [ ] NEEDS_MORE_REVIEW
    ```

### `/review approve`
Configure approval flow.
- Outputs:
  - GitHub / GitLab branch protection rule.
  - Required status checks.
  - Required reviewers (CODEOWNERS).
  - Dismiss stale approvals on push.
  - Required signature (signed commits).
  - Required linear history (rebase / merge squash).
  - Forbid direct push to main.
  - Forbid force-push to main.

### `/review fast-track [pr]`
Low-risk fast-track.
- Inputs: PR (typically: docs, lint, test-only, dependency patch, hotfix).
- Outputs:
  - Single reviewer (or CODEOWNERS only).
  - 1-hour SLA.
  - All CI checks still required.
  - Post-merge verification per service.

### `/review ai [setup]`
AI-assisted review configuration.
- Inputs: tooling (Copilot Chat / CodeReviewBot / Graphite Reviewer / Bito / custom LLM).
- Outputs:
  - **AI tools used**:
    - First-pass style + obvious bug catch.
    - Security smell sniff (with human escalation for hits).
    - Test smell detection.
    - Doc string generation suggestion.
    - Diff summary for author and reviewer.
  - **AI tools NOT used** for:
    - Final architecture decisions.
    - Security-sensitive code (human in the loop).
    - User-facing tone or copy.
    - Anything requiring business context.
  - **Setup**:
    - Bot account in GitHub org.
    - Bot comments in < 60 sec.
    - Bot only opens non-blocking "consider" comments.
    - Bot escalates to human-required reviewer for SECURITY / DATA / BREAKING tags.

### `/review bot [repo]`
Bot reviewer config (bots for enforcement).
- Outputs:
  - **Enforcement bots**:
    - `gitleaks` / `trufflehog` — secrets on every PR.
    - `danger-js` — PR conventions.
    - `mergify` / `bors` — merge queue + auto-merge.
    - `semantic-pull-request` — title lint.
    - `conventional-commits` — commit message lint.
    - `size` labeler (PR size category).
    - `CODEOWNERS` — required approvals.
    - `stale` — close abandoned PRs after N days.
    - `dependabot` / `renovate` — dep upgrades.
  - **Quality bots**:
    - CodeQL — SAST.
    - SonarQube / Codacy — code health + coverage.
    - Codecov / Coveralls — coverage.
    - Snyk / Dependabot — vulnerability.
    - imgbot — image optimization.
    - hadolint — Dockerfile.
    - kube-linter — Kubernetes manifest.

### `/review hotspot <repo>`
Identify review / change hotspots.
- Inputs: repo, time window.
- Outputs:
  - Top 10 files by change frequency (last 90 days).
  - Top 10 files by review-comment density.
  - Top 10 files by bug-introduction rate (bug-fix commit history).
  - Top 10 files by lines deleted-then-re-added (refactor churn).
  - Recommendations: refactor + tests + ownership reassignment for hotspots.

### `/review ownership [paths]`
Set CODEOWNERS for paths.
- Inputs: paths, owners.
- Outputs:
  - `.github/CODEOWNERS`:
    ```
    # Default
    *                           @team-platform
    
    # Service ownership
    /services/payments/         @payments-eng
    /services/auth/             @auth-eng
    /platform/observability/    @sre-platform
    
    # Sensitive paths
    /terraform/prod/            @platform-sre @security-appsec
    /db/migrations/             @data-eng @platform-sre
    /docs/runbooks/             @sre-platform
    
    # Hot spots (extra review)
    *.sql                       @data-eng
    /secrets/                   @security-appsec
    /compliance/                @compliance-team
    ```
  - Branch protection requires CODEOWNERS approval on any change to matching path.

### `/review label [policy]`
PR label policy.
- Inputs: label scheme.
- Outputs (recommended set):
  | Label | Meaning | Auto / Manual |
  |---|---|---|
  | `risk: low / normal / high / emergency` | Risk class | auto by file classifier |
  | `size: XS / S / M / L / XL` | LOC bucket | auto |
  | `area: payments / auth / ...` | Subsystem | auto by CODEOWNERS + manual |
  | `kind: feature / fix / refactor / chore / docs / test / infra` | Change type | auto by conventional commit |
  | `breaking-change` | API / schema break | manual + ADR link required |
  | `needs: security / data / arch / sre review` | Required reviewers | auto |
  | `stale` | Unmerged > 14 days | auto |
  | `ready-for-review` | Author signals done | manual |
  | `do-not-merge` | Block | manual |
  | `dependency: patch / minor / major` | Dep bump | auto |

### `/review template [org]`
PR / MR template.
- Outputs:
  ```markdown
  <!-- .github/PULL_REQUEST_TEMPLATE.md -->
  
  ## What
  <1-3 sentences: what the change does.>
  
  ## Why
  <Link to issue / design doc / ADR.>
  
  ## How tested
  <Test plan + screenshots / recordings for UI.>
  
  ## Migration plan
  <Data / schema / API migration. N/A if none.>
  
  ## Rollback plan
  <Documented + rehearsed.>
  
  ## Customer impact
  <User-facing change? What does the user see?>
  
  ## Risk class
  - [ ] Low (docs / lint / tests / isolated)
  - [ ] Normal (default)
  - [ ] High (cross-service / schema / auth / prod)
  - [ ] Emergency (hotfix; IC approved)
  
  ## Checklist
  - [ ] PR title is imperative + concise
  - [ ] PR < 400 LOC (split if not)
  - [ ] Tests added / updated
  - [ ] Docs updated (if user-facing)
  - [ ] ADR linked (if significant)
  - [ ] No secrets in code / logs
  - [ ] Backwards compatible (or deprecation path)
  - [ ] Observability adequate (metrics / logs / traces)
  - [ ] Rollback rehearsed
  
  ## Reviewers
  <!-- auto-populated from CODEOWNERS -->
  ```
- Bots enforced via `danger.js` or `mergify` for missing fields.

### `/review anti-pattern`
Recognize + avoid PR anti-patterns.
- Outputs:
  | Anti-pattern | Signal | Fix |
  |---|---|---|
  | Big PR (> 800 LOC) | diff size; many files; multiple concerns | Split via stacked PRs / feature flags |
  | Squashed-history PR | no commit context for review | Rebase / merge; preserve history |
  | PR with no description | empty / "TODO" body | Enforce template |
  | WIP PR merged | "WIP" in title; "do not merge" not respected | Branch protection |
  | Bot-only-approve | no human comments | Reviewer must leave comments |
  | Drive-by refactor | unrelated cleanup in feature PR | Split |
  | Long-lived branch | > 7 days unmerged | Trunk-based; merge or close |
  | Conflict at merge | many conflicts; rebased mid-review | Rebase regularly |
  | Silent close-out of feedback | comments ignored | Address or re-discuss; never ignore |
  | Re-approval required after push | push invalidates approvals | Use linear history + re-trigger |
  | Approvals without test plan | author + reviewer blind | Template required |
  | Sync-merge to main | not on trunk | Enforce rebase / squash |
  | "Approving my own PR" | author = approver | Branch protection forbids |
  | Bot cannot review the substance | AI commenting only | Substance always human |
  | Style review from humans | linter handles it | Reviewers redirect to linter |
  | Reviewer not on team | outside contributor; no context | CODEOWNERS |
  | Force-push after review | commit shas invalidated | Forbid force-push to protected branches |
  | Resolved without action | "fixed in next PR" | Same PR or follow-up ticket |

### `/review metrics [period]`
Code review metrics.
- Outputs (per team / repo / period):
  | Metric | Target | Actual | Trend |
  |---|---|---|---|
  | Median cycle time (first commit → merge) | < 24h | ... | ... |
  | Median time-to-first-review | < 4h business | ... | ... |
  | Median time-to-merge after approval | < 1h | ... | ... |
  | Median PR size (LOC changed) | < 400 | ... | ... |
  | Review depth (median comments / PR) | 5-15 | ... | ... |
  | Comment-to-LOC ratio | > 0.03 | ... | ... |
  | First-pass approval rate | ≥ 50% | ... | ... |
  | Re-review rate | < 30% | ... | ... |
  | Bot-only PR rate (no human comments) | < 10% | ... | ... |
  | Stale PR rate (> 14d unmerged) | < 5% | ... | ... |
  | Hotspot concentration (top 5 files) | < 30% of changes | ... | ... |
  | Approval-without-comment rate | < 5% | ... | ... |
  - Pair: `/audit process` for the org-wide view.

### `/review cycle-time [scope]`
Cycle time deep-dive.
- Inputs: scope, time window.
- Outputs:
  - **Histogram** of cycle times.
  - **Cumulative flow**: how PRs move from open → review → merge → deploy.
  - **Bottlenecks**: where do PRs stall (review vs CI vs author)?
  - **Bimodal distribution**: "fast lane" (small fixes) vs "slow lane" (larger features)?
  - Action items.

### `/review depth [pr]`
Review depth assessment for a single PR.
- Inputs: PR ID.
- Outputs:
  - Comment count by section (correctness / security / perf / test / docs).
  - Comment severity breakdown.
  - Time spent per comment (if tracked).
  - Comparison to org median for similar size.

### `/review audit`
Audit the review practice. See §6.

---

## 4. Review Dimensions (canonical checklist)

The 5-stage canonical review checklist (use in PR template / review tooling):

### A. Substance (humans)
1. **Correctness**: does the change do what the description claims? Are there off-by-one errors? Are invariants upheld?
2. **Edge cases**: empty input / boundary values / null / large / malformed. Reader should be able to enumerate the cases handled.
3. **Error handling**: are errors propagated with context? Are they logged? Are user-facing errors meaningful? Are partial-failure paths handled?
4. **Concurrency**: race conditions? thread safety? lock ordering correct?
5. **Resource leaks**: files / connections / goroutines / locks / timers cleaned up on every path (including error paths)?
6. **Security**: input validation; authn/authz; secrets; output encoding; rate limiting; audit log. (Per `/review security`.)
7. **Performance**: algorithmic complexity; N+1; hot path memory; serialization cost; cache invalidation. (Per `/review performance`.)
8. **Observability**: metrics for SLI; structured logs with context; traces for critical path.
9. **Backwards compatibility**: existing clients / data formats respected; deprecation path on breaking.
10. **Migration / rollback**: explicit plan; rehearsed; reversible.
11. **Tests**: substance, not coverage; behavior, not implementation.
12. **Configuration**: defaults sane; type-validated; documented; secret-safe.
13. **Feature flag**: risky code behind a flag; kill switch; owner.
14. **Documentation**: README / runbook / design doc updated; ADR linked.
15. **Dependencies**: justified; vetted; license-compatible.
16. **Customer impact**: what does the user see?

### B. Style (linter, not human)
- Formatter (`prettier`, `black`, `gofmt`, `rustfmt`, `ktlint`, `scalafmt`).
- Linter (`eslint`, `ruff`, `golangci-lint`, `clippy`).
- Type-check (`tsc`, `mypy`, `pyright`, `cargo check`).
- Spelling (`codespell`).
- Imports (`isort`, `goimports`).
- Naming consistent with `style.md`.

### C. Cross-functional reviewers (per file class)
- **Security**: `/review security` checklist; security reviewer.
- **Arch**: `/review arch` checklist; arch reviewer.
- **SRE**: SLO impact; runbook; alerts.
- **Data**: migrations, schema changes.
- **API**: contract changes.
- **Compliance**: PII / regulated data.

### D. Bot enforcement (CI)
- Lint, format, type-check, tests, coverage gate.
- SAST, dep-scan, secrets scan.
- CODEOWNERS satisfied.
- PR description complete (per template).
- PR size budget enforced (warning at 400, block at 800).
- Signed commits.
- Conventional commit title.

### E. Soft skills (human-tone)
- Tone: descriptive; question-first; non-blocking prefix.
- Substance: blocking vs non-blocking distinguished.
- Acknowledgment: address every comment or explain deferral.

---

## 5. Output Location
- `CODEOWNERS` at repo root.
- `.github/PULL_REQUEST_TEMPLATE.md` (or `.gitlab/merge_request_templates/`).
- `docs/eng-process/code-review.md` (process doc).
- `docs/eng-process/checklists/<area>.md` (per-area checklists).
- `.github/labeler.yml` (label mappings).
- `danger.js`, `dangerfile.ts` (PR bot rules).
- `.mergify.yml` (merge automation).
- `renovate.json` (dep automation).
- `.github/workflows/` (CI).

---

## 6. Audit Workflow
When asked to audit the code review practice:

1. **PR size discipline**: median LOC distribution; % PRs > 400 LOC; % over 800.
2. **Time-to-first-review**: median; long tail; aging PRs.
3. **Reviewer coverage**: every PR has a reviewer within 4h.
4. **Review depth**: comment density per PR; substance vs style ratio.
5. **Bot enforcement**: linter, type-check, SAST, deps, secrets, signing — coverage in CI.
6. **AI review**: where it's used; where it's not; effectiveness measured.
7. **Ownership coverage**: CODEOWNERS exhaustive; known gaps.
8. **Style discipline**: humans vs bots for style.
9. **Cross-functional review coverage**: arch / security / data / sre — coverage of relevant files.
10. **First-pass approval rate**: trending down suggests clearer PRs + better rubric.
11. **Re-review rate**: trending down suggests less pushback.
12. **Hotspot concentration**: top 5 files; bus factor for these.
13. **Stale PR rate**: aging; reasons (author on vacation / CI broken / disagreement).
14. **Merge conflict rate**: trunk-hygiene signal.
15. **Squashed history / WIP merged**: hygiene violations.
16. **Approval-without-comment rate**: trust vs blindness.
17. **Tone audit**: sample comments reviewed for tone (every Q).
18. **Tied to incident trends**: PRs that caused incidents → review process improvements.
19. **Tied to DORA + SRE metrics**: review metrics in scorecard.
20. **Feedback loop**: review friction surfaces in retros + plans.

Output: report with `Aligned` per dimension + `Violation` per P0/P1/P2 finding; rubric; effort estimate per fix; scored maturity.

---

## 7. Hard Rules
- **Never** merge a PR without a description (template-enforced).
- **Never** merge a PR > 800 LOC without an explicit justification + 3 reviewers.
- **Never** merge a PR without review approvals matching CODEOWNERS.
- **Never** merge a PR with failing CI.
- **Never** merge a PR with secrets in the diff.
- **Never** merge a breaking-change PR without an ADR + deprecation path + comms.
- **Never** merge a migration PR without a documented + rehearsed rollback.
- **Never** let AI reviewers be the only reviewer on security-sensitive code.
- **Never** approve a PR without at least one substantive comment (or "LGTM" with checks listed).
- **Never** let reviewers spend time on style issues a linter catches.
- **Never** ship a PR with `TODO`s in code (use follow-up issues instead).
- **Never** use force-push on protected branches (loses review context).
- **Never** approve your own PR (CODEOWNERS + branch protection).
- **Never** sync-merge to main (use squash + linear history).
- **Never** ship an unsigned commit on protected branches.
- **Never** squash a PR review out of existence mid-review (reviewers lose context).
- **Always** link the PR to an issue / ticket.
- **Always** describe a test plan in the PR.
- **Always** distinguish blocking vs non-blocking comments.
- **Always** explicit migration plan for data / schema / API changes.
- **Always** explicit rollback plan with criteria + rehearsal.
- **Always** update the appropriate docs (runbook / ADR / README).
- **Always** add a feature flag for risky code paths.
- **Always** set CODEOWNERS on new files.
- **Always** follow conventional commits for title + body.
- **Always** tag PRs with risk class + size + area.
- **Always** cross-link PR ↔ ADR ↔ design doc when applicable.
- **Always** track cycle time + depth + first-pass rate (per period).
- **Always** log AI-generated comments as `ai-generated` for audit trail.

---

# Reference — PR Description Templates

## Generic PR template (applied via .github/PULL_REQUEST_TEMPLATE.md)

```markdown
## What
<1-3 sentences.>

## Why
- Closes / Refs: <issue, ticket>
- ADR / Design doc: <link>

## How tested
- Unit: <cases>
- Integration: <cases>
- Manual: <cases>
- Test plan for the reviewer: <steps>

## Screenshots / recordings
<For UI changes.>

## Migration plan
<Data, schema, API. N/A if none.>

## Rollback plan
<Concrete steps + trigger criteria.>

## Customer impact
<None / Slight / Notable.>

## Risk class
- [ ] Low (docs / lint / test-only / isolated)
- [ ] Normal (default)
- [ ] High (cross-service / schema / auth / prod)
- [ ] Emergency (IC-approved hotfix)

## Checklist
- [ ] PR title imperative + concise
- [ ] PR < 400 LOC
- [ ] Tests added / updated
- [ ] Docs updated
- [ ] No secrets in code or logs
- [ ] Backwards compatible (or deprecation path)
- [ ] Observability adequate
- [ ] ADR linked (if significant)
- [ ] Rollback rehearsed
```

## Hotfix template

```markdown
## Hotfix
- IC: @<handle>
- Started: <time>
- Severity: S<n>

## What's broken
<1-2 sentences.>

## Why
<Root cause or working theory.>

## Fix
<1-2 sentences.>

## Test plan
<How we verified in prod / staging.>

## Rollback
<Concrete steps.>
```

---

# Reference — Review Comment Style

## Comment prefixes

| Prefix | Meaning |
|---|---|
| `[blocking]` | Must change before approval |
| `[consider]` | Suggestion; non-blocking |
| `[nit]` | Trivial style nits; non-blocking |
| `[question]` | Asking for clarification |
| `[praise]` | Acknowledging a good decision |

## Comment patterns

```markdown
# Question pattern (preferred)
"Have you considered edge case X? What happens if Y?"

# Suggestion pattern
"Consider using `with` here — the file may not close cleanly on the error path."

# Reference pattern
"This is similar to issue #1234 (from last quarter) — the root cause was Z."

# Praise pattern
"Nice refactor — keeps the API surface stable. 👏"

# Escalation pattern
"I'd block on this; could we discuss before merging? Happy to sync."
```

## Anti-patterns

- "Don't do this" / "this is wrong" → "Have you considered X? I'm not sure the trade-off here works because..."
- "Just fix this" → "Address or defer (follow-up ticket)"
- "Why are you doing it this way?" (demand) → "What was the reasoning behind ... choice?"

---

# Reference — CODEOWNERS Patterns

## Standard structure

```
# Default team
*                               @org/platform

# Service ownership
/services/<service>/            @org/<service>-team
/services/<service>/db/         @org/<service>-team @org/data-eng

# Cross-team / sensitive
/infra/                         @org/sre
/db/migrations/                 @org/data-eng @org/sre
/secrets/                       @org/security
/compliance/                    @org/security @org/compliance

# Per-file-type defaults
*.tf                            @org/sre
*.sql                           @org/data-eng
Dockerfile                      @org/sre

# CI / tooling
/.github/                       @org/devx
/tools/                         @org/devx

# Documentation
/docs/runbooks/                 @org/sre
/docs/architecture/             @org/arch
/docs/adr/                      @org/arch

# Hot spots (require extra review)
/legacy/                        @org/arch @org/<service>-team
```

---

# Reference — Branch Protection Templates

## GitHub branch protection (recommended)

```
Branch: main
- Require pull request reviews before merging: ✅
  - Required approving reviews: 2
  - Dismiss stale pull request approvals when new commits are pushed: ✅
  - Require review from Code Owners: ✅
  - Restrict who can dismiss pull request reviews: @org/leads
- Require status checks to pass before merging: ✅
  - lint, type-check, tests, coverage, SAST, dep-scan, secrets-scan
- Require branches to be up to date before merging: ✅
- Require signed commits: ✅
- Require linear history: ✅
- Include administrators: ✅
- Restrict who can push to this branch: @org/release-engineers
- Allow force pushes: ❌
- Allow deletions: ❌
```

---

# Reference — AI Review Setup

## GitHub Copilot for Pull Requests

```yaml
# GitHub org setting → Copilot for PRs enabled.
# Additional rules via custom instructions:
- Always leave non-blocking comments only.
- Always prefix AI-generated comments with [ai].
- Always defer security-final-decisions to human-required reviewer.
```

## Custom LLM (CodeReviewBot / Bito)

- Bot posts first-pass summary within 60 seconds.
- Comments categorized: blocking (escalate) / consider (don't block) / nit (style; defer to linter).
- Bot tags humans on security smells.
- Bot never approves; only humans approve.

## Bot runtime guardrails

- Bot comments on PR opens + on each push.
- Bot does not re-comment on every file (avoid noise).
- Bot escalates high-severity findings by tagging `@security-reviewer-required`.

---

# Reference — Review Tooling Comparison

| Tool | Type | Strengths |
|---|---|---|
| GitHub PR + CODEOWNERS | Hosting + access control | Default for GH-first orgs |
| GitLab MR + approval rules | Hosting + access control | Default for GL-first orgs |
| Phabricator / Differential | Review-first | Codebase-aware review; arcunit integration |
| Gerrit | Git-native review | Fine-grained access; large monorepos |
| Graphite | Stacked PRs + merge queue | Enables small PRs by composition |
| Reviewable | Side-by-side + history | Code review deep tool |
| Crucible | Atlassian-integrated | In-context review inside Jira |
| Mend (WhiteSource) | Code + dep + AI | SBOM + license + AI review |

---

# Reference — Metrics + Benchmarks (DORA-based)

## DORA + review metrics

| Metric | Elite | High | Medium | Low |
|---|---|---|---|---|
| Lead time for change (median) | < 1h | 1h-1d | 1d-1w | > 1w |
| Deploy frequency | on-demand | weekly+ | monthly+ | > monthly |
| Change failure rate | ≤ 5% | ≤ 10% | ≤ 15% | > 15% |
| MTTR (S1) | ≤ 1h | ≤ 1d | ≤ 1w | > 1w |

## Review-specific targets (org-default)

| Metric | Target |
|---|---|
| Time-to-first-review | < 4h business |
| Median PR size | < 400 LOC |
| Stale PR rate (> 14d) | < 5% |
| First-pass approval rate | ≥ 50% |
| Bot-only PR rate | < 10% |
| Approval-without-comment rate | < 5% |

---

# Reference — Common Anti-Patterns

| Anti-pattern | Why bad | Fix |
|---|---|---|
| Reviewer as gatekeeper, not partner | Adversarial tone; learning lost | "Partner review" framing |
| "LGTM" with no context | Rubber-stamp | Require check list or substantive comment |
| Squash-all + lose history | Reviewer loses commit context | Rebase / squash-merge at end only |
| WIP merged | WIP = unfinished | Branch protection forbids |
| Long-lived branches (> 7d) | Drift; merge hell | Trunk-based; merge or close |
| Big PR (> 800 LOC) | Unreviewable | Split + flag → re-review |
| Drive-by refactor | Mixing concerns | One concern per PR |
| Approve my own PR | Conflict of interest | Branch protection |
| Bot-only reviews | Substance missed | AI augments; humans decide |
| Style review from humans | Slows things down | Linter only |
| Silent close-out | Feedback ignored | Address or discuss every comment |
| "Just fix this" tone | Demoralizing | Question-first pattern |
| "Drive by" reviews on old PRs | Late-comer; demotivates | Time-box review |
| Pair-of-eyes as rubber-stamp | Token review | Substantive checklist |
| PRs without description | Reviewers guess | Template-enforced |
| Force-push after review | Reviewers lose shas | Forbid; rebases pinned to base |
| PR author = approver | Branch protection | Forbid |
| Re-review skipped | Push invalidates approvals | Re-trigger on new push |
| Review metrics gamed | Approve-without-comment | Audit substantive comments |
| "Single reviewer" for high-risk | Single point of failure | CODEOWNERS + 2+ for high-risk |
| Cross-service change w/o reviewers | Hidden coupling | Multi-team review |
| Tests passing ≠ tests testing | Coverage ≠ correctness | Test-review checklist |
| Migration in feature PR | Mixing concerns | Split migration |
| Documentation merged in feature PR | Half-doc / no-doc | Docs-first or follow-up |

---

# Reference — Emergency / Hotfix Path

When a hotfix is needed:

1. **Author opens a PR** (even short-lived).
2. **Tag `emergency`** + risk class `emergency`.
3. **Reviewer**: same person (or another) reviews fast-track (< 30 min).
   - 1 reviewer minimum (2 if humanly possible).
   - Focus on correctness + rollback + blast radius.
   - Skip style (linter still runs).
4. **Branch protection waived**: mergify / auto-merge fast-lane.
5. **Deploy + verify**: SRE / on-call acknowledges.
6. **Post-incident review**:
   - Was the hotfix correct? (track for 7 days)
   - Was the rollback rehearsed?
   - Did it actually fix it?
7. **Follow-up PR**: clean up the hotfix (lint / format / tests / docs).
8. **Postmortem** captures the lesson.

Pair: `/sre incident-postmortem` for the broader lesson + action items.
