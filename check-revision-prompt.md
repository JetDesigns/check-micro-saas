# Check — Wizard & Output Revision Spec

You are revising an existing product called **Check**. It turns finished design work into a
single-page **portfolio case study** (the kind a designer publishes to get hired), not sales
collateral for winning clients. That genre decision is fixed — do not reinterpret it.

Current state: a 2-step wizard (setup + one long story form) that feeds an AI pipeline, which
outputs a long-form prose case study page.

Two problems to fix:

1. The wizard asks sales-genre questions and cannot elicit the structure the output needs.
2. The output is ~90% prose with decorative section names and uncaptioned images.

Work through the phases in order. Do not skip ahead — Phase 1 defines the contract everything
else depends on.

---

## Core concept: the spine

The thing that makes a case study read as senior is **one idea restated at three levels of
resolution**, with a 1:1 mapping between them:

| Finding (what you learned) | Requirement (what it demanded) | Move (what you designed) |
|---|---|---|
| Insight 1 | Requirement 1 | Design move 1 |
| Insight 2 | Requirement 2 | Design move 2 |
| Insight 3 | Requirement 3 | Design move 3 |

Generic case studies fail because these are three unrelated lists. Check must guarantee the
mapping **structurally**, not by hoping the model does it.

The key design decision: **do not ask the user for three separate lists.** Ask for a repeated
*decision unit*, from which all three levels are derived:

- What did you decide? → becomes the **move**
- What made you decide it? → becomes the **finding**
- What did you reject instead? → becomes the **trade-off** that justifies the **requirement**

Users can recall decisions. They cannot recall "requirements." This phrasing gets the same
structure with far less cognitive load, and makes the 1:1 mapping true by construction.

---

## Phase 1 — Content schema

Define a typed schema. The synthesis agent must emit **structured blocks**, never markdown or
freeform prose. The renderer maps block types to components.

### Block types

```ts
type Block =
  | { type: 'metadata_grid'; items: { label: string; value: string }[] }   // 4–6 items
  | { type: 'stat_headline'; text: string }                                // must contain a number
  | { type: 'prose'; paragraphs: string[] }                                // see prose caps
  | { type: 'pullquote'; text: string; attribution?: string }
  | { type: 'requirement_cards'; cards: { index: number; title: string; body: string }[] }
  | { type: 'move_section';
      eyebrow: string;          // e.g. "MOVE 1 — DEFAULTS"
      title: string;            // imperative verb phrase
      body: string[];           // max 2 paragraphs
      tradeoff?: { chose: string; rejected: string; because: string };
      visuals: AnnotatedVisual[] }
  | { type: 'annotated_visual'; imageId: string; caption: string; pins?: { x: number; y: number; text: string }[] }
  | { type: 'cycle_diagram'; nodes: { label: string; sublabel: string }[]; caption: string }  // 3–5 nodes
  | { type: 'impact_list'; items: { title: string; body: string }[] }
  | { type: 'outcome_status'; status: 'shipped' | 'proof_of_concept' | 'not_launched' | 'handed_off'; note: string }
  | { type: 'learnings'; paragraphs: string[] };
```

### Document shape

```ts
type CaseStudy = {
  spine: { id: string; finding: string; requirement: string; move: string }[];  // 2–4 entries
  blocks: Block[];
};
```

### Validation rules — enforce in code, reject and regenerate on failure

1. `spine.length` between 2 and 4.
2. Exactly one `move_section` per spine entry, in spine order.
3. Every `move_section.eyebrow` and `requirement_cards.cards[]` traces to a spine entry id.
4. `move_section.title` must start with a verb (imperative). Reject noun phrases and feature
   names — "Surface the better default" passes, "The New Dashboard" does not.
5. **Prose caps**: any `prose` block max 3 paragraphs, each max 60 words. `move_section.body`
   max 2 paragraphs. Reject and regenerate anything over.
6. `stat_headline` must contain a digit. If the user supplied no number, omit the block —
   never invent one.
7. Every uploaded image appears in exactly one `annotated_visual`, each with a non-empty caption.
8. `cycle_diagram` is emitted **only** when spine length is 3 or 4 **and** the user's decisions
   describe a loop or sequence. Otherwise omit — a forced diagram looks worse than none.

---

## Phase 2 — Wizard restructure

Replace the current 2-step wizard with 5 steps. Show a step indicator. **Never block "next"** —
users can always advance with fields empty.

### Step 1 — Setup

Keep from current build: file upload (6 max), project-kind selector, "What did you work on?",
"Who was it for?".

Changes:
- Collapse tone from 5 chips to 3: **Direct / Warm / Analytical**. Five options is decision cost
  with no payoff.
- Add four short metadata fields (feed `metadata_grid`, high credibility for low effort):
  - Year & duration — e.g. "2024 · 6 weeks"
  - Your role — e.g. "Product Designer"
  - Client or company
  - Team / credit (optional)

### Step 2 — The problem

- **What was wrong before?** (keep as-is, it works)
- **Why did it matter?** — replaces "What was it costing them?". Reframe for portfolio genre:
  the stakes of the problem, not the client's invoice.
  Helper: *"What was at risk if it stayed broken."*
- **What constrained you?** — NEW, and important. Constraints that shaped the design are one of
  the strongest seniority signals a reviewer looks for.
  Helper: *"A deadline, a system you couldn't touch, data you didn't have. Anything that
  changed the shape of the solution."*

### Step 3 — The decisions (the spine — this is the core of the product)

A repeatable block. Starts with 2 blocks visible, "Add another decision" up to 4. Each block:

- **What did you decide?**
  Helper: *"One decision. e.g. 'Put the filters in a persistent sidebar.'"*
- **What made you decide it?**
  Helper: *"What you saw, heard, or tested that pointed here."*
- **What did you consider instead?** (optional)
  Helper: *"The option you rejected — and why. This is usually the most interesting part."*

Copy at the top of the step: *"Two or three decisions is enough. Depth beats coverage here."*

### Step 4 — Your screens

Only shown if images were uploaded. For each image, side by side with a thumbnail:

- **Which decision does this show?** — dropdown populated with the decision titles from Step 3,
  plus "Overview / hero" and "Supporting".
- **What should someone notice here?** — one line.
  Helper: *"Point at the choice, not the layout."*

This is what makes generated captions grounded instead of guessed.

### Step 5 — Where it landed

- **Did it ship?** — single select: Shipped / Proof of concept / Not launched / Handed off.
- **Numbers that moved?** (optional) — Helper: *"Real numbers only. Blank is better than a guess."*
- **What changed for the team or client?** (optional)
- **What would you do differently?** (optional) — feeds `learnings`. This section is genre-
  specific: it belongs in a portfolio case study and would not in sales collateral.

### Review screen (before compile)

Summary list of the five steps. Sections with thin or empty answers get a neutral marker and a
jump link.

Copy: *"Your case study is ready to write. These parts are still short — fill them in now, or
go ahead and generate."*

Never use the words "kurang", "belum cukup", "dangkal", "incomplete", or "weak" anywhere in
this screen. Two buttons, equal weight: "Fill these in" and "Write the case study".

---

## Phase 3 — Adaptive probing

The interviewer agent probes for specificity, but gently and with a hard limit.

Rules:
- **Max 2 probes per question**, then move on. Never a third.
- Probe by **example**, never by demand. Do not write "Can you be more specific?" — that asks
  for more work without direction. Write: *"A lot of people put 'tight timeline' here. In your
  case, was there a constraint that actually changed the design? Like a legacy system you
  couldn't touch, or data that wasn't there."*
- Probes appear inline, below the field, as a soft suggestion. Not a modal, not a blocker.
- Never display a score, meter, or percentage of "depth" to the user. Keep specificity scoring
  as an internal signal for the agents only — a visible score makes people game the number and
  write long empty answers.

Trigger a probe when an answer is under ~15 words, contains no concrete noun, or matches a
generic-phrase list ("improve UX", "modern look", "user-friendly", "better experience",
"streamline the flow").

---

## Phase 4 — Agent pipeline

Four agents, separate calls. Do not merge into one mega-call — visual grounding and business
writing are different jobs, and merging them is what produces invented claims.

1. **Interviewer** — `claude-sonnet-5`. Drives adaptive probes during the wizard.
2. **Extraction (vision)** — `claude-sonnet-5`. All uploaded images in **one batched call**,
   returning a structured description per image (screen type, key UI elements, hierarchy
   signals). Cache the result: re-running synthesis after a text edit must not re-run vision.
3. **Synthesis** — `claude-opus-4-8`. Wizard answers + extraction → the `CaseStudy` object.
   This is the artifact people pay for; don't downgrade the model to save cents.
4. **QA / critique** — `claude-sonnet-5`. Runs against the synthesis output. Flags:
   - vague claims with no evidence in the user's answers
   - any metric not supplied by the user
   - captions that describe UI instead of naming a decision
   - move titles that aren't imperative verbs
   - prose blocks over the caps

   On failure, re-run synthesis with the QA notes appended. Max 2 retries, then ship with the
   flagged items marked in the editor.

Log token usage per compile per agent from day one. Estimated cost is ~$0.10–0.15 per
successful compile; verify against real traffic rather than trusting the estimate.

---

## Phase 5 — Output renderer

Replace the current prose-heavy page.

### Page structure

1. **Opening** — title, one-paragraph intro, `metadata_grid`.
2. **Context** — `stat_headline` (if a number exists), short `prose`, `pullquote` of the brief.
3. **What we found** — short `prose`, 2–3 findings, text only. Do **not** build a competitor
   teardown section: it needs 6–9 external screenshots, which is outside the 6-image budget.
4. **What it needed to be** — `requirement_cards`, numbered.
5. **The approach** — optional `cycle_diagram`, then one `move_section` per spine entry.
6. **Where it landed** — `outcome_status`, `impact_list`.
7. **Learnings** — `learnings`.

Explicitly **not** in scope: a "Going further" / "Future features" section. Speculative
unbuilt features are the weakest section in any reviewer's eyes. If you build it at all, make
it off by default.

### Rendering rules

- Section names come from the spine, not from a fixed decorative list. Kill "The Vision",
  "The Signal", "The Discovery" — those could sit on any case study and signal nothing.
  Section headings must be the user's own decisions, phrased as imperatives.
- Images render as `annotated_visual` with the caption directly beneath, in a smaller,
  lower-contrast type style than body text.
- Caption rule, enforced by QA: **a caption names a decision, never describes the UI.**
  Rejected: "Dashboard with filters on the left."
  Accepted: "Filters stay pinned because users compared four options before choosing."
- Suggested image budget, matching a 3-decision spine: 1 hero, 3 (one per move), 2 supporting.
- Keep from the current build: the metadata row, the callout/insight box style, the large
  metric block, the sticky section nav, and the helper-text tone under form fields. Those are
  already right.

### Cycle diagram

Template-driven SVG, generated from `cycle_diagram` data — 3–5 nodes arranged in a ring,
each with a label and sublabel, curved arrows, a caption below. One template only. Do not
build a general-purpose diagram generator; it will scope-creep and the output will look worse
than none.

---

## Phase 6 — Editor and paywall

- The generated case study is editable **per block**, not as one text area. This is the payoff
  for structured output — preserve it.
- Regenerating a single `move_section` must not re-run the vision pass.
- Keep the existing partial-preview-then-pay flow. With structured blocks, the preview is
  simply a subset of blocks rather than truncated text.
- Do not cap regenerations tightly. Compute is cheap relative to the price of the output;
  limiting retries to save cents moves friction to exactly the wrong place.

---

## Copy rules (apply everywhere in the wizard)

- Plain language, second person, short sentences. Match the tone already used in the current
  helper text — it's the right register.
- Every question has a one-line helper below it that gives a **concrete example**, not an
  instruction.
- Never tell users output quality depends on their effort. That's a disclaimer, not guidance:
  it raises anxiety without changing behaviour, because it doesn't tell them what "deep" means.
  Show the standard through examples instead.
- No progress-shaming, no red states, no "required" asterisks beyond the genuinely required.
- Opening line of the wizard: *"I'll ask a few things about your project. Answer what you can —
  you can always come back."*

---

## Build order

1. Phase 1 schema + validators (with unit tests for every validation rule).
2. Phase 5 renderer against hand-written fixture data. Confirm the layout competes visually
   **before** wiring any agent.
3. Phase 2 wizard restructure.
4. Phase 4 pipeline.
5. Phases 3 and 6.

Rationale for the order: the schema is the contract, and a renderer proven on fixtures tells
you whether the output is good enough before a single token is spent. If the fixture-rendered
page doesn't hold up next to a hand-made case study, no amount of prompt work will fix it.
