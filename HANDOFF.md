# Check — Handoff: step 4 tagging

Replaces the Aug 27 2026 handoff, which described the pre-rebuild architecture.
That document is still in history: `git show d6fdc91:HANDOFF.md`.

## LOCKED (do not reopen without new evidence)

- The diagram is skipped, and Approach renders as prose only, when any of these
  is true: fewer than 4 chips; zero chips marked; every chip marked; zero
  decisions attached to any marked chip.
- Every chip has its own stable id. Marked state and attachments hang off the
  id, never off array position.
- The agent never draws a part the user did not name.
- The one-flow option is disabled as "Coming soon". Its chip variant exists
  behind the flag.
- Two template geometries ship first. The flow-steps template is deferred.

## STOP CONDITION

Fill in Numinar (several-areas) and Tirra (one-page), generate both, and compare
them side by side.

- If the two diagrams read as clearly different, step 4 is **DONE** and gets
  locked.
- If they still look alike, the problem is the wizard input, not the template.
  Do not add more templates or more fields to fix that.

## STILL OPEN

- What happens to a step-3 decision attached to no chip. Currently a
  non-blocking warning only.
- What the caption falls back to when "Is there one idea behind all of them?" is
  empty.
- Whether validation should block Next or only warn. Currently warn.
