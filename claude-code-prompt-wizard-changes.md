# Prompt Addendum untuk Claude Code — Wizard-Specific Changes

Ini addendum dari claude-code-prompt-check-revamp.md, spesifik untuk perubahan yang
menyentuh wizard UI dan field mapping. Baca ini SETELAH audit step 1 dari prompt
utama selesai — gunakan temuan audit itu untuk konfirmasi nama file/field yang
sebenarnya sebelum mengeksekusi ini.

---

```
Context: I reviewed the actual current wizard UI (5 steps: Quick Setup, What
You Walked Into, The Decisions You Made, Your Screens, Where It Landed) against
the case study output framework spec. Most of the wizard already aligns well
with the spec. Only the following specific changes are needed — do NOT
restructure the wizard steps or add unnecessary fields beyond what's listed.

DO NOT CHANGE:
- The 5-step order and grouping.
- The "Team / credit" field in Step 1 (Quick Setup) — already matches the
  spec's minimal-credits requirement as-is.
- The "Which decision does this show?" dropdown in Step 4 (Your Screens) —
  already correctly implements Screen→Decision traceability. Leave it alone.
- Step 2's single free-text problem field — do NOT itemize it into a
  numbered pain-point list. The current copy ("Depth beats coverage here")
  reflects an intentional low-friction design; do not undermine it.

CHANGE 1 — Add one new optional field to Step 3 (The Decisions You Made).
- Position: above the first Decision block, so it applies to the whole step
  rather than per-decision.
- Label: something like "Is there an overall approach or model that ties
  these decisions together? Name it if you have one." (optional)
- Placeholder/helper copy in the same tone as existing fields, e.g.
  "Optional — most projects don't have one. If yours does, it's usually
  the strongest part of the story."
- Store this as a distinct field (e.g. `approach_framework_name` or similar —
  check existing naming conventions in the schema during your audit) that
  the structuring agent can surface prominently in the Approach section if
  present, and simply omit if empty. Never auto-generate a name for this
  field if the user leaves it blank.

CHANGE 2 — Implement Evidence Type as DERIVED logic, not a new question.
- Do NOT add a new wizard question for this.
- In the structuring/generation step, compute Evidence Type from two
  existing Step 5 fields:
  - "Did it ship?" (Shipped / Not launched / Proof of concept / Handed off)
  - "Numbers that moved?" (optional free text)
- Logic: Type A (hard metrics) if "Numbers that moved?" is non-empty and
  contains what looks like a real figure/comparison. Type B (soft/
  contribution impact) if that field is empty, regardless of ship status.
  "Shipped" alone without a filled numbers field is still Type B — don't
  assume shipped = has metrics.
- This computed value drives Results & Reflection placement per the spec's
  Placement Logic table (Type A → position 2, right after Problem; Type B →
  end, after Solution). This is purely a rendering-order decision in the
  structuring/output stage — it does not change wizard step order or what
  gets collected in Step 5.

CHANGE 3 — Decision→Problem traceability: implement at the structuring
layer via semantic inference, NOT as a new wizard field.
- The structuring agent should, at generation time, semantically match each
  Decision's "What made you decide it?" text against Step 2's problem
  narrative and render an inline reference (e.g. "This addresses: [short
  paraphrase of the relevant part of the problem]") next to each decision
  in the Solution section.
- If confidence in the match is low, omit the tag for that decision rather
  than forcing a weak or incorrect link. A missing tag is better than a
  wrong one.
- Do not add any new required or optional input field for this — it must
  be inferred, not collected.

CHANGE 4 — Confirm output section ordering is decoupled from wizard
collection order.
- Audit the current generation/structuring code to confirm the case study
  renderer does NOT simply mirror the wizard's step order (Setup → Problem
  → Decisions → Screens → Outcome) when producing the final case study.
- If it currently does mirror that order 1:1, this needs to change so the
  Placement Logic (Change 2) can actually take effect — Results content
  collected in Step 5 must be able to render in position 2 of the output
  for Type A cases.

TESTING:
- Confirm a Type A test case (Numbers that moved filled in) renders Results
  early, right after the Problem section.
- Confirm a Type B test case (Numbers that moved left blank) renders
  Results at the end, after Solution.
- Confirm the new optional framework-name field, when filled, surfaces
  clearly in the Approach section, and when left blank, does not produce
  any placeholder or fabricated framework name in the output.
- Confirm at least one Decision→Problem inline tag renders correctly on a
  sample transcript with an obvious semantic match, and confirm no tag
  renders when the match is weak/unclear.

Report back which files you touched, and flag if Step 3 or Step 5's current
field names differ from what I assumed here — use the real names from your
audit, not these placeholder labels.
```
