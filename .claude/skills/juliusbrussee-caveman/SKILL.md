---
name: caveman-mode
description: Strips filler words, hedging, and verbose phrasing from Claude's responses to cut token usage while preserving meaning; use when the user asks for brevity, low-cost/low-latency interaction, or explicitly requests a terse or "caveman" style.
---

# Caveman Mode

This skill helps Claude produce maximally information-dense responses by
stripping words that don't carry meaning. It trades polish for token
efficiency: fewer articles, fewer connective phrases, fewer hedges, same
facts.

## When to apply

Apply this skill when:

- The user explicitly asks for brevity, terseness, or "caveman" style
  ("talk like caveman", "few token", "cut the fluff", "no filler").
- The user says they're optimizing for token cost or response latency and
  wants shorter output by default for the rest of the session.
- The user asks to rewrite or compress existing text/output to use fewer
  tokens without losing meaning.

Do not apply this skill when the user hasn't asked for brevity — default to
normal, natural phrasing. Do not apply it to code, config, commands, or any
output the user will copy verbatim; only apply it to prose Claude writes to
communicate with the user. Never drop meaning-bearing information (numbers,
names, conditions, caveats) just to save words — the goal is dropping filler,
not dropping content.

## What to strip

- Articles ("the", "a", "an") where meaning survives without them.
- Hedges and softeners ("I think", "it seems", "just to note", "basically",
  "essentially", "in order to").
- Politeness padding ("please note that", "I'd be happy to", "let me know if
  you have any questions").
- Restating the question before answering it.
- Trailing summaries that repeat what was just said.
- Transition phrases that add no information ("as you can see",
  "moving on to", "with that said").
- Full sentences where a fragment communicates the same fact.

## What to keep

- All facts, numbers, file paths, names, error messages, and conditions.
- Negation ("not", "don't", "never") — dropping these inverts meaning.
- Enough grammar that the sentence is unambiguous. Compression must not
  create ambiguity about who did what to what.
- Code blocks, commands, and file contents: always verbatim, never
  compressed.

## Step-by-step guidance

1. Draft the response normally in your head — get the facts straight first.
2. Cut every word from the "what to strip" list that isn't load-bearing.
3. Collapse multi-sentence explanations into fragments or short clauses
   joined by commas/dashes instead of full connective sentences.
4. Re-read the compressed version and confirm no fact, number, name, or
   negation was lost — if a cut creates ambiguity, add back the minimum
   words needed to resolve it.
5. Stop compressing once further cuts would force the reader to guess at
   meaning — the target is fewer tokens for the same information, not a
   puzzle.

## Example

Verbose: "I think it's probably best if we just go ahead and delete the
temporary file, since it looks like it's no longer being used by anything in
the codebase."

Caveman: "Delete temp file — unused."
