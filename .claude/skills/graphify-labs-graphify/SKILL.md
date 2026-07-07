---
name: code-knowledge-graph
description: Build a lightweight knowledge graph linking application code, database/SQL schemas, infrastructure config, and docs into one connected model, then use it to answer cross-cutting questions about a codebase; use when a task requires tracing how a change in one artifact (a column, function, endpoint, or config value) ripples through the rest of the system.
---

# Code Knowledge Graph

## What this helps with

Real systems are rarely just application code. A single change — renaming a
database column, changing an API response shape, editing a Terraform
resource — can ripple through SQL schemas, ORM models, shell scripts, CI
config, and docs that were never in the same file or even the same
language. Grepping one artifact type at a time misses these connections.
This skill gives Claude a repeatable way to assemble a small, explicit graph
of entities (functions, tables, endpoints, config keys, infra resources,
docs) and the edges between them (calls, reads, writes, defines,
depends_on, configures, documents) so that cross-artifact questions get
answered by tracing real connections instead of guessing from naming
similarity.

## When to apply it

Use this skill when a question is relational, not local:

- Impact analysis: "what breaks if I change/rename/drop this column,
  function, or config value?"
- Dependency tracing: "what calls this endpoint?", "what services read from
  this table or queue?", "what infra depends on this resource?"
- Onboarding-style questions: "how does data flow from the API into the
  database and out to the reporting job?"
- Cross-artifact consistency checks: does the SQL schema match the ORM
  models? Does the infra config expose a port the app actually listens on?
  Do the docs describe endpoints or scripts that no longer exist?

Skip this skill for single-file edits, isolated bug fixes, or anything
answerable by reading one file — building even a small graph is overhead
that only pays off once a question spans multiple artifacts.

## Step-by-step guidance

1. **Pin down the starting entity and the question.** Before reading
   anything, state which specific entity the question starts from (a
   table, function, endpoint, config key, or infra resource) and what
   direction matters — forward ("what does this affect?") or backward
   ("what does this depend on?"). This keeps the graph bounded to what the
   question actually needs.

2. **Classify the artifact types in play.** Decide up front which of these
   are plausibly relevant: application code, SQL/schema definitions and
   migrations, infrastructure-as-code (Terraform, Kubernetes, Docker,
   CI/CD config), shell/utility scripts, and documentation. Don't scan
   artifact types that couldn't plausibly connect to the starting entity.

3. **Extract entities with stable identifiers as you read.** For each file
   opened while investigating, record entities in a consistent form, e.g.:
   - `table:orders` — Postgres table, defined in `db/migrations/012_orders.sql`
   - `func:create_order` — in `src/api/orders.py`, inserts into `orders`
   - `endpoint:POST /orders` — routes to `create_order`
   - `resource:orders-worker` — ECS task in `infra/orders.tf`, consumes the
     queue this endpoint publishes to

4. **Record edges explicitly, not from naming alone.** For every
   relationship noticed, write a directed edge with a kind — `calls`,
   `reads`, `writes`, `defines`, `depends_on`, `configures`, `documents`.
   Prefer edges backed by a specific line of code or config over ones
   inferred from similar names; label inferred edges as "likely,
   unconfirmed" rather than asserting them as fact.

5. **Keep the graph as scratch reasoning, not a deliverable.** Hold the
   entity/edge list inline in reasoning (or a scratch note for a large
   task) only for as long as the task needs it — it's a working structure,
   not documentation to persist unless the user explicitly asked for one.

6. **Traverse before answering.** Once enough entities and edges are
   collected, walk the graph from the starting entity to the depth the
   question requires, and state the path taken so the answer is
   verifiable, e.g. "`table:orders` → `func:create_order` (writes) →
   `endpoint:POST /orders` (defines) → `resource:orders-worker`
   (depends_on)."

7. **Separate confirmed edges from guesses in the final answer.** When
   reporting impact or dependencies, explicitly flag which links were
   confirmed by reading code/config versus which are plausible but
   unverified — this avoids overstating the blast radius of a change.

8. **Re-scope if the trace grows unbounded.** If tracing pulls in dozens of
   unrelated entities, stop and revisit step 1: either the starting entity
   is too central (a shared utility, a widely-used config key) and the
   question needs narrowing, or the system genuinely has that much fan-out
   and the answer should say so rather than silently truncating the trace.
