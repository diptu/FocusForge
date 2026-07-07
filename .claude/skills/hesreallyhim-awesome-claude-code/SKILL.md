---
name: claude-code-resource-curator
description: Curates and vets third-party Claude Code ecosystem resources (skills, subagents, slash commands, hooks, status lines, and plugins) before adopting them into a project, and organizes them so they stay discoverable and non-redundant; use whenever a user wants to find, evaluate, or integrate a community-built Claude Code extension.
---

# Claude Code Resource Curator

This skill helps evaluate and integrate third-party Claude Code ecosystem
resources — skills, subagents, custom slash commands, hooks, status lines,
and plugins — into a project in a way that is safe, non-duplicative, and
easy for future contributors to find. Apply it whenever a user asks to add,
compare, or clean up any of these resource types, or asks "is there already
something for X?" before writing a new one from scratch.

## When to apply this skill

- The user wants to add a community skill, subagent, slash command, hook,
  status line, or plugin to a project.
- The user asks whether an existing resource already covers a need before
  building something new.
- The user wants to audit a project's `.claude/` directory for stale,
  duplicate, or risky resources.
- The user references an "awesome list" style collection of Claude Code
  resources and wants help deciding what's worth adopting.

## Step 1: Classify the resource

Before evaluating anything, identify which category it falls into, since
each has a different risk profile and integration point:

- **Skill** (`SKILL.md`) — reusable guidance/knowledge Claude reads on demand.
  Lowest risk: it's prose, not code that runs automatically.
- **Subagent** — a specialized agent definition with its own tools/model.
  Risk scales with the tool permissions it requests.
- **Slash command** — a shortcut that expands to a fixed prompt or workflow.
  Check what it actually instructs Claude to do before trusting the name.
- **Hook** — a shell command that runs automatically on events (tool calls,
  session start/stop). Highest risk category: it executes without a human
  in the loop, so it deserves the most scrutiny.
- **Status line** — cosmetic, runs a small script to render terminal state.
  Low risk functionally, but still executes arbitrary shell on each render.
- **Plugin** — a bundle of any of the above, distributed as a unit. Inherits
  the combined risk of everything it contains.

## Step 2: Check for existing coverage first

Before recommending adoption of something new, search the project for
resources that already solve the same problem:

- Look in `.claude/skills/`, `.claude/agents/`, `.claude/commands/`, and any
  project-specific skill/library directories for overlapping names or
  descriptions.
- If something similar already exists, prefer extending or renaming it over
  adding a near-duplicate — a project with three slightly different skills
  for "code review" is worse than one skill that covers the cases well.
- If nothing exists, proceed to evaluation.

## Step 3: Evaluate before integrating

Apply these checks proportional to the resource's risk category from Step 1:

1. **Read the whole thing.** Never wire in a hook, slash command, or plugin
   without reading every command/script it runs. For skills, read the full
   body, not just the frontmatter description.
2. **Look for automatic execution.** Anything that runs on a hook trigger or
   inside a slash command should be treated with the same scrutiny as code
   you'd merge into the main branch — check for destructive commands,
   network calls, credential access, or anything that bypasses confirmation.
3. **Check scope match.** Is the resource generic (applies to any project)
   or does it assume a specific stack, file layout, or tool that this
   project doesn't have? Note any assumptions that will need adjusting.
4. **Check for staleness.** Resources that reference old CLI flags, deprecated
   APIs, or old model names are a sign the resource needs updating before
   use, not blind adoption.
5. **Prefer the narrowest version.** If a plugin bundles five things and the
   user only needs one, extract just that piece rather than installing the
   whole bundle — smaller surface area is easier to audit and maintain.

## Step 4: Integrate cleanly

- Place the resource in the correct directory for its type
  (`.claude/skills/`, `.claude/agents/`, `.claude/commands/`, hooks in
  `settings.json`), matching the project's existing conventions rather than
  inventing a new layout.
- Give it a name and description specific enough that it won't collide with
  or shadow an existing resource, and specific enough that future search
  (by name or keyword) will surface it for the right task.
- If the resource came with example prompts, external links, or setup docs,
  don't copy those verbatim into the integrated version — keep only what's
  needed for Claude to use it correctly, since stale external references rot
  faster than the resource itself.
- Note any manual setup the user still needs to do (credentials, environment
  variables, permissions) explicitly rather than assuming it's already done.

## Step 5: Keep the collection healthy over time

- When auditing an existing `.claude/` directory, flag: resources with no
  clear trigger condition (vague descriptions that never get invoked),
  resources that duplicate another one closely enough to cause ambiguity in
  which gets picked, and hooks/commands referencing tools or files that no
  longer exist in the project.
- Recommend removing or merging rather than accumulating — a smaller,
  well-curated set of resources is more useful than a large one where
  Claude (or the user) can't tell which one applies.
