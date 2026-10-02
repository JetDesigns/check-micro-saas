# Focused Fix — Input Contract

Every piece of information `prompts/focused-fix-output.md` requires from the user, with what
consumes it, what happens without it, and whether a field exists to supply it.

Extraction only. No wizard design, no field labels, no step assignment, no ordering — row order in
the manifest carries no meaning and is not a proposed sequence.

---

## A. Live bug — the branch gate contradicts the branch

**This is a defect in running code, not a manifest finding. It needs fixing regardless of what
happens to the wizard.**

`evidenceType()` in `lib/wizard-steps.ts` routes a project to the metric branch when the metrics
answer contains a digit anywhere in it. Nothing else is checked.

§7.3 then requires six things of that branch: the measure, its baseline value, the window the
baseline covers, its source, the after value, and the limit of attribution. The metrics field
collects one free-text answer and none of those components. §7.3 also states that a number whose
source and window cannot be named does not appear on the page at all.

**Trigger:** any digit in the metrics answer, including one that is not a measurement.

**Effect:** the project is routed into a branch on the strength of a number the branch then has to
suppress. Problem is required to carry a baseline it does not have, Outcome is required to carry a
measure, delta, window and attribution limit it does not have, and the number that caused the
routing cannot be printed. The page ends up in the stricter branch with none of the material that
branch exists to handle — and §10.2 forbids narrating the absence, so the failure is silent.

**Direction of fix:** branch on the presence of the components, not on the presence of a digit.
Rows I41–I45 below are those components. A project supplying all of them is on the metric branch;
a project supplying some is the mixed case §7.3 already specifies, which is the contribution
branch with one stated figure.

---

## B. Manifest

Status values: **exists** (a field supplies it), **partial** (a field supplies it weakly or fused
with something else), **none** (no field supplies it).

Answer cost is judged as the user experiences it: **low** is a toggle or a selection, **medium** is
a phrase or one sentence, **high** is prose or anything repeated per decision or per screen. A
one-word answer asked four times is high.

Consolidation names either another row in this manifest, the per-item collection the input
attaches to, or **none** where the input stands alone. An input attaching to `decisions[]` or
`image_notes[]` is a new column on that collection, not a new question.

| ID | Input | Plain language | Consumed by | Spec | Strength | Conditional on | When absent | Status | Cost | Consolidation |
|---|---|---|---|---|---|---|---|---|---|---|
| I1 | Product identity | What the thing is, in one sentence | Overview | §4.1 | Required | — | Overview cannot orient; no omission path defined | partial — the engagement title and the client descriptor both circle it without stating it | medium | one question with I2, I3 |
| I2 | User population | Who uses it, by occupation or role | Overview; the mass-noun ban | §4.1, §8.8 | Required | — | Sentence must be rewritten around the gap; the banned generic noun may not substitute | none | medium | one question with I1, I3 |
| I3 | Engagement scope | Which surfaces or products were in scope | Overview | §4.1 | Required | — | Scope omitted from Overview | partial — inferable from the engagement title | medium | one question with I1, I2 |
| I4 | Designer role | What the designer was called on the project | Overview, Credits, metadata strip | §4.1, §4.6, §3.2 | Required | — | Credits cannot be built; §4.6 required content missing | exists | low | none — note the strength mismatch: the spec requires it, the field is marked optional |
| I5 | Client sector and scale | The client's industry and rough size | Overview, metadata strip | §4.1, §3.2 | Optional | — | Silent omission | exists | low | shares a field with I6 |
| I6 | Naming permission | Whether the client may be named, and the name if so | Credits, page-wide anonymisation | §4.6, Appendix Q8 | Required | — | Default to not naming; the choice is never surfaced to the user | none | low | reshape of I5's field |
| I7 | Reported symptom | What the client said was wrong, in their framing | Problem opening, the reframe | §4.2, §5.3, §5.1 | Required | — | Substitution ladder §10.3 | partial — fused with I8 in one answer | medium | split into two questions with I8; the existing answer becomes one half |
| I8 | Diagnosis | What the symptom actually pointed at | The reframe, load-bearing link | §4.2, §5.2, §5.3 | Required | — | Load-bearing link missing; §12 item 10 fails | partial — fused with I7 | medium | split with I7; absorbs I9 |
| I9 | Prior-state evidence | Named screens, controls, columns that showed the problem | Problem exhibit | §4.2, §5.4, §12 item 11 | Required | — | §12 item 11 fails; no omission path | partial — one answer asks for a specific example | medium | absorbed into I8's answer |
| I10 | Evidence repetition | Whether the same failure appeared in several places or once | Exhibit form selection | §5.4 | Conditional | I9 naming more than one instance | Single-instance prose treatment; no structured exhibit | none | low | derived from I9 when it enumerates |
| I11 | Stakes | What the problem cost the client | Problem close | §4.2, §5.5, §12 item 12 | Required | — | §12 item 12 fails | exists | medium | none |
| I12 | Diagnosis provenance | How the finding was reached — audit, research, analytics, testing, or told | Problem provenance line | §4.2, §10.5 | Optional | — | Silent omission §10.2 | none — partially recoverable from I51 | low | standalone selector; I51 is its only other source |
| I13 | Named model | An overall approach or model tying the decisions together | Problem, Approach | §4.2, §4.3 | Optional | — | Prose stays plain reasoning; never generated | exists | medium | none |
| I14 | Constraints | What changed the shape of the solution | Approach | §4.3 | Optional | — | Silent omission | exists | medium | absorbs I15 |
| I15 | What shaped the work | Basis of decisions or what was left alone, where the work had no multi-part structure | Approach fallback | §4.3 | Conditional | No structural relationship exists | Approach thin or padded | partial — the constraints answer reaches part of it | medium | into I14 |
| I16 | Structural relationship | How the work items relate — tracks, sequence, branching, peers with exceptions, before and after, scope boundary | Approach diagram | §4.3, §9.1, §9.5 | Conditional | A relationship carrying a distinction exists | Diagram omission §9.7 after the §9.4 preview fails to resolve it | none | low | zero new questions — §9.4's confirmation preview owns it, informed by I27, I28, I29 |
| I17 | Authority split | Whether decision authority was genuinely divided, and how | Approach ownership move | §4.3 | Optional | The split shaped the design work | Omit the move entirely; never invent a collaborator | partial — collaborators are named without their authority | low | into I54 |
| I18 | Duration | How long the engagement ran | Approach, Credits, metadata strip | §4.3, §4.6, §3.2 | Optional | — | Drop the field; never guess | partial — fused with I19 in one string | low | split from I19 |
| I19 | Year | When the work happened | Metadata strip | §3.2 | Optional | — | Drop the field | partial — fused with I18 | low | split from I18 |
| I20 | Per fix: what was decided | The decision itself | Fix block, justification moves 1 and 3 | §4.4, §6.1 | Required | — | Blocking — fewer than two decisions cannot generate | exists | high | `decisions[]` |
| I21 | Per fix: why | What made the designer decide it | Fix block, reason tests | §4.4, §6.1 | Required | — | §12 item 14 fails | exists | high | `decisions[]` |
| I22 | Per fix: rejected alternative | The option considered instead | Cost test | §6.1 | Optional | — | Silent omission; the reason must still pass another test | exists | high | `decisions[]` |
| I23 | Per fix: prior behaviour | What that specific thing did before, in behavioural terms | Justification move 2 | §4.4, §6.1 | Required | — | Fix block degrades to a changelog entry; §12 item 13 fails | none | high | its own prose column on `decisions[]`, carrying I26 as a derivation and I30 as a conditional continuation — not merged with I24 |
| I24 | Per fix: consequence | What someone no longer has to do | Justification move 4 | §6.1, §12 item 13 | Required | — | The block has described an edit, not a decision | none | high | its own column on `decisions[]`, separate from I23 |
| I25 | Per fix: pain point answered | Which problem from Problem this fix addresses | Traceability | §4.4, §6.3, §12 item 13 | Required | — | Per-block traceability fails; a section-level statement does not satisfy it | none | low | picker column on `decisions[]`, referencing the items in I8 and I9 |
| I26 | Per fix: no prior version | Whether this thing did not exist before | §6.2 selection rule 1 | §6.2 | Conditional | — | Ordered-mechanic shape unreachable; block defaults to prose-led | none | low | derived from I23 answering that there was no before; no column of its own |
| I27 | Per fix: breaks a rule | Whether this decision deviates from what the other fixes follow, and from what | §6.2 selection rule 2, exception argument, diagram exceptions | §5.6, §6.2, §9.5 | Conditional | — | Exception shape unreachable; diagram exceptions unmarkable, pushing §9.7 omission | none | low | one multi-select column on `decisions[]` with I28, I29 |
| I28 | Per fix: repeated treatment | Whether this is one treatment applied across many places | §6.2 selection rule 3 | §6.2 | Conditional | — | Image-led shape unreachable | none | low | same multi-select as I27 |
| I29 | Fix ordering and dependency | Whether a fix must be understood before another | Fix ordering, diagram sequencing | §4.4, §9.5 | Conditional | — | Preserve the order given; no dependency claimed | partial — the collection is ordered, dependency is not captured | low | same multi-select as I27 |
| I30 | Per fix: ordered beats | The steps of the interaction, where there is no prior version to compare | Ordered-mechanic shape | §6.2 | Conditional | I26 | Shape falls back to prose-led | none | high | conditional continuation of I23's column, which covers sequence when there is no before |
| I31 | Client wording, brief | Anything the client wrote or said about what was wrong | Problem opening, page opening options | §8.5, §6.4c, §10.3 | Conditional | — | Ladder §10.3; two of five page-opening options become unreachable | none | medium | one question with I32, I36, I37 |
| I32 | Client wording, request | A client request that prompted a specific fix | Fix block opening | §4.4, §6.2, §10.3 | Conditional | — | The block opens on the rule it breaks instead | none | medium | same question as I31, with an attach point to `decisions[]` |
| I33 | Per screen: which decision | Which fix this image belongs to | Caption, placement | §8.6, §8.7 | Required | An asset exists | Caption cannot point at a decision | exists | high | `image_notes[]` |
| I34 | Per screen: what to notice | The decision the image shows | Caption | §8.6 | Required | An asset exists | Caption falls back to description, which §8.6 prohibits | exists | high | `image_notes[]` |
| I35 | Per screen: state | Whether the image shows the prior or the new state | Pairing, after-only captions, §6.2 selection rule 5 | §4.4, §6.2, §8.6 | Required | An asset exists | No pairs; after-only captioning rule cannot fire; shape selection loses its asset veto input | none | low | toggle column on `image_notes[]` |
| I36 | Client response | What the client said or confirmed after delivery | Outcome | §4.5, §7.2, §7.4 | Conditional | — | Ladder §10.3, ending in omission and a short Outcome | none | medium | same question as I31 |
| I37 | Client stated intent | What the client says they will carry forward | Outcome | §4.5, §7.2 | Optional | — | Silent omission | none | medium | same question as I31 |
| I38 | Stated goal | What the work set out to achieve, as stated at the time | Outcome opening | §4.5 | Required | — | Outcome has nothing to measure the result against | none | low | derived from I7 — the reported symptom restated as the goal is not an invention |
| I39 | Operational change | What the team can now do, or no longer has to do | Outcome core | §4.5, §7.2 | Required | — | Outcome loses its required claim | exists | medium | none — but see I36: the field does not separate reported from observed, which §7.4 rule 3 requires |
| I40 | Shipping status | Whether it shipped, was handed off, or stayed a proof of concept | Metadata strip only | §3.2, §10.5 | Optional | — | Drop the field | exists | low | none — explicitly barred from becoming Outcome's claim |
| I41 | Measure name | What was measured | Problem baseline, Outcome | §7.3 | Required | Metric branch | The number does not appear; project is the mixed case | partial — one free-text answer covers all of I41 to I45 | medium | one conditional block with I42 to I45 |
| I42 | Baseline value and window | The value before the work, and the period it covers | Problem baseline | §7.3 | Required | Metric branch | As I41 | partial | medium | same block |
| I43 | Baseline source | Where the number came from | Problem baseline | §7.3 | Required | Metric branch | The number does not appear — provenance is required, not optional | none | medium | same block |
| I44 | After value and window | The value after, and the period it covers | Outcome | §7.3 | Required | Metric branch | As I41 | partial | medium | same block; delta is derived |
| I45 | Attribution limit | What else changed in the same window | Outcome | §7.3 | Required | Metric branch | Borrowed causality, the branch's named failure mode | none | medium | same block |
| I46 | Evidence branch | Which branch this project is on | Problem and Outcome shape | §7.1 | Required | — | No branch, no page | exists but defective — see section A | none, derived | derive from I41 to I45 rather than from digit detection |
| I47 | Project type | Which case study type applies | Routing | §2.1, §2.2 | Required | — | Wrong type generated | exists | low | none |
| I48 | Screen contents | What is on each screen, for alt text | Alt text | §8.6 | Required | An asset exists | Alt text missing; §12 item 20 fails | none | low if asked | derive from the image; do not ask |
| I49 | Register sample | How the designer would explain the project out loud | Nothing in §8 — see the open decision | §8.1 excludes it, §9.5 reads it | Optional | — | Diagram inference loses one weak source | exists | high | see the open decision below |
| I50 | Tone preference | Which register the output should take | Nothing — the register is fixed | §8.1 | Optional | — | No effect either way | exists | low | none — orphan |
| I51 | What would be done differently | The designer's own critique of the work | Never rendered; a method fact may reach I12 | §10.5 | Optional | — | Nothing — it is excluded from the page in all cases | exists | high | feeds I12 only |
| I52 | Engagement one-liner | What was worked on, in one line | Subtitle | §3.2 | Required | — | Subtitle cannot be built | partial — it doubles as product identity, which I1 also needs | medium | distinct from I1 once I1 exists |
| I53 | Agency | An agency between the designer and the client | Credits | §4.6 | Optional | — | Credits shrinks | none | low | reshape of I54's field |
| I54 | Collaborator roles | Who else worked on it and what they did | Credits, authority split | §4.3, §4.6 | Optional | — | Credits shrinks; never pad | partial — names without roles | low | reshape that also closes I17 and I53 |

**Coverage.** Every field currently collected is accounted for above, by data key rather than by
label: title in I52; client type in I5 with I1 and I6; year and duration in I18 and I19; role in I4;
team credit in I54 with I17 and I53; voice sample in I49; problem in I7, I8 and I9; why it mattered
in I11; constraints in I14 with I15; approach framework in I13; metrics in I41, I42 and I44; what
changed in I39; do differently in I51; the three decision fields in I20, I21 and I22; the two screen
fields in I33 and I34; project type in I47; tone in I50; outcome status in I40. Nothing collected
today is missing from this manifest.

---

## 1. GAPS — required or usable inputs no current field supplies

Twenty-two rows carry status **none**. What breaks in each case:

| ID | What breaks |
|---|---|
| I2 | Overview must describe a user population it has no name for, and the substitute §8.8 bans is the obvious one |
| I6 | The anonymisation choice the spec resolves as an explicit user decision is never put to the user |
| I10 | The exhibit form cannot be chosen; a repetition that is the finding may be rendered as prose that asserts it |
| I12 | The provenance line is unavailable, which is the cheapest credibility the page can buy |
| I16 | No relationship reaches the diagram flow except through the confirmation preview |
| I23 | Justification move 2 is impossible. Every fix block describes an edit rather than a change. This is the largest single gap |
| I24 | Justification move 4 is impossible. §12 item 13 cannot pass for any block |
| I25 | Per-block traceability cannot be built, and §6.3 explicitly refuses the section-level substitute |
| I26 | The ordered-mechanic shape is unreachable, so new capabilities are written as if they had a before |
| I27 | The exception argument is unreachable, and diagram exceptions cannot be marked — which is the distinction the peer-set form exists to encode |
| I28 | The image-led shape is unreachable |
| I30 | Sequence claims fall back to prose that cannot carry them |
| I31 | Two of the five page-opening options are unavailable, narrowing §6.4c's variance source |
| I32 | One fix-block opening move is unavailable |
| I35 | Before and after pairing cannot be built, the after-only caption rule cannot fire, and shape selection loses its asset veto |
| I36 | Outcome's third required element falls to the bottom of its ladder on every project |
| I37 | An optional Outcome element is never available |
| I38 | Outcome has nothing to restate, so the result is measured against nothing |
| I43 | Under the metric branch, provenance is required — without it the number cannot be printed at all |
| I45 | The metric branch's named failure mode has no guard |
| I48 | Alt text has no source, and §12 item 20 fails on every page with an image |
| I53 | Credits cannot represent a three-party engagement |

Three of these — I23, I24, I25 — are required inputs for a required rule, and they repeat per
decision. They are the gap with the highest output cost and the highest answer cost simultaneously.

---

## 2. ORPHANS — fields no rule consumes

| Field | Finding |
|---|---|
| Tone preference (I50) | §8.1 fixes one flat declarative register for every output. No rule reads tone. The selector cannot change what is produced |
| What would be done differently (I51) | §10.5 forbids rendering it anywhere on the page. Its only permitted use is extracting a method fact for the provenance line, which I12 would supply directly and more cheaply. High answer cost, near-zero output value |
| Register sample (I49) | Consumed by no rule in §8. Its one weak consumer is §9.5, which reads it hoping for an incidental process narrative — and that consumer becomes redundant once the per-decision relationship multi-select exists. Collected for voice, used for diagram inference, and about to be used for nothing. **Not a routine orphan — see the open decision below** |

---

## 3. PARTIALS — fields that supply an input weakly

| Field | What it supplies | What the spec would rather ask |
|---|---|---|
| The prior-state answer (I7, I8, I9) | Report, diagnosis and evidence fused into one answer | Two separate questions. The separation is the page's load-bearing move, and one field cannot produce two halves of a distinction |
| Metrics (I41, I42, I44) | One free-text answer | Six named components. See section A — this partial is also the bug's cause |
| What changed (I39) | Operational change | Which part the client reported and which part was observed, since §7.4 rule 3 treats them differently |
| Team credit (I54, I17, I53) | Names, in prose | Roles, so Credits can be built and an authority split can be stated without inventing one |
| Client descriptor (I5, I1, I6) | Industry and size | What the product is, who uses it, and whether the client may be named — three different facts behind one answer |
| Engagement title (I52, I1, I3) | One line doing double duty as subtitle and product identity | A subtitle is a claim about the work; product identity is a fact about the product |
| Year and duration (I18, I19) | Two facts in one string | Two values, so §3.2's rule that only fields with real values appear can apply to each |
| Per-decision why (I21) | Rationale | Rationale is one of four moves; the field is read as though it were all four |
| Per-screen notice (I34) | A caption seed | The same, plus which state the screen shows |
| Named model (I13) | A model, where one exists | Nothing more — but note it is read in §9.5 as though it might name the structural relationship, which is a different question |

---

## 4. CONSOLIDATION — what actually has to be added

**Missing inputs: 22.** **Minimum new user-facing questions: 5.**

Those are different numbers because most of the gaps attach to collections the user already fills
in per item, or are derivable from an input already on the list.

The forms below describe **what a field would have to cover**. They are not proposed wording,
labels, or step placement — those are design decisions that follow this document.

| Closes | Form | Gaps closed |
|---|---|---|
| I23, plus I26 and I30 riding on it | One prose column on `decisions[]` — what the thing did before. Answering that there was no before supplies I26, and the sequence continuation for I30 | 3 |
| I24 | One column on `decisions[]` — what someone no longer has to do | 1 |
| I27, I28, plus I29's partial | One **multi-select** column on `decisions[]` — a fix can deviate from the pattern, repeat across places, and depend on another at the same time. No standalone option: that is the absence of the others | 2 |
| I25 | One picker column on `decisions[]` — which problem this answers | 1 |
| I35 | One toggle column on `image_notes[]` — prior or new state | 1 |
| I31, I32, I36, I37 | **One question** — anything the client wrote or said, with an optional attach point to a decision or to the outcome | 4 |
| I43, I45, plus the I41, I42, I44 partials | **One conditional question** — the metric block, shown only when a measurement exists. It lets the corrected gate in section A read complete data | 2 |
| I12 | **One question** — how the diagnosis was reached | 1 |
| I2, plus the I1 and I3 partials | **One question** — what the product is and who uses it | 1 |
| I7 and I8's partial | **One question** — what they reported, separated from what was found. The existing answer becomes one of the two halves | 0 |
| I6, I53 | Reshapes of existing fields, not additions — naming permission into the client field, roles into team credit | 2 |
| I18, I19 | Reshape — split the fused year and duration | 0 |
| I10, I16, I38, I48 | Derived, no question at all — repetition from whether the evidence enumerates, relationship from the §9.4 preview, stated goal from the reported symptom, alt text from the image | 4 |

**Why prior behaviour and consequence are two inputs, not one.** Merging them into a single prose
column would repeat exactly the fusion this manifest criticises in the problem field, where the
report, the diagnosis and the evidence share one answer and the answer supplies whichever the user
thought of first. A field that asks for two facts gets one. The split costs one more column and is
the difference between justification move 4 being collected and being hoped for.

**Arithmetic:** 3 closed by the prior-behaviour column, 1 by the consequence column, 2 by the
relation multi-select, 1 by the pain-point picker, 1 by the `image_notes[]` toggle, 4 by the
client-language question, 2 by the metric block, 1 by the provenance selector, 1 by the product
question, 2 by reshapes, 4 by derivation. **7 + 1 + 8 + 2 + 4 = 22.**

**Totals: 5 new questions, 5 new columns on existing collections — four on `decisions[]`, one on
`image_notes[]` — 3 reshapes of existing fields, 4 derivations, 0 new questions for the diagram.**

Two of the five new questions replace or extend existing answers rather than adding to the count of
things the user faces cold. Set against that, three existing fields have no consumer at all
(section 2), and removing them would return more of the user's effort than the two genuinely new
questions cost.

### Answer events — what this actually costs the user

Questions and answers are different units. **Five questions** is how many new places the user is
asked something. **Answer events** is how many times they have to answer. A per-item column is one
question and as many answers as there are items, and it is counted here as answers.

Figure below is for a project the size of the reference: **three decisions, six screens**,
contribution branch.

| New input | Events | Tier per event |
|---|---|---|
| Prior behaviour, per decision | 3 | high — prose |
| Consequence, per decision | 3 | medium — a phrase |
| Relation multi-select, per decision | 3 | low |
| Pain point answered, per decision | 3 | low |
| Prior or new state, per screen | 6 | low |
| Reported symptom, split from the diagnosis | 1 | medium |
| Client language, with its attach point | 1 | medium |
| What the product is and who uses it | 1 | medium |
| How the diagnosis was reached | 1 | low |
| Naming permission | 1 | low |

**3 + 3 + 3 + 3 + 6 + 1 + 1 + 1 + 1 + 1 = 23 new answer events.**

By tier: **high 3**, medium 6, low 14. **The high-cost count is 3** — one prose answer per decision.
It is the only tier that scales with writing rather than with clicking, and it is the tier that
decides whether the wizard feels like work.

Two conditionals do not fire for this project. The ordered-beats continuation rides inside the
prior-behaviour answer and only lengthens it where there was no before. The metric block adds **5
medium events** under the metric branch, taking the total to 28.

**What the wizard asks today, same project.** Sixteen flat answers — six setup fields, two
selectors, three problem fields, the framework field, the outcome selector and three closing
fields — plus 3 decision fields across 3 decisions, plus 2 screen fields across 6 screens.
**16 + 9 + 12 = 37.**

**Growth: 37 + 23 = 60 answer events, a ratio of 1.62×.** Under the metric branch, 60 + 5 = 65,
or 1.76×.

Dropping the two fields with no consumer at all takes the base to 35 and the total to 58; dropping
the register sample as well takes it to 57. Note what that does to the ratio: removals shrink the
base, so the ratio *rises* while the absolute burden falls. The absolute number is the honest one to
judge this by.

---

## 5. OPEN DECISION — the register sample

**Not a routine orphan. This needs an owner's decision, and it is not resolved here.**

§8.1 fixes a single flat declarative register for every output, and no rule anywhere in §8 consumes
the register sample. Its one weak consumer is §9.5, which reads it hoping for an incidental process
narrative — and that consumer **becomes redundant the moment the per-decision relationship
multi-select in section 4 exists**, because the multi-select supplies the same structure directly
and reliably. Ship these changes and the field has no consumer at all.

The implication is larger than a wasted field: **every case study Check produces will sound
identical.**

Two readings, both coherent:

**(a) The uniform register is house style, and a feature.** Consistency is what makes the output
read as a considered product rather than as whatever the model felt like that day, and the flat
declarative voice is doing real work — it is what keeps the writing from drifting into the
persuasion register the genre cannot afford. Under this reading the register sample should be
dropped and the user's effort returned. The specification needs no change.

**(b) The uniform register is itself the generic-AI problem the product exists to solve.** A page
that reads like every other page on the platform fails for the same reason a templated portfolio
fails, and §8.1 has removed the only input capable of differentiating one designer's page from
another's. Under this reading the specification is incomplete: §8 would need a rule that consumes
the register sample — deciding what it may influence, such as sentence rhythm, vocabulary or how
technical detail is pitched, and what it may never influence, such as the honesty rules or the
banned list. **No such rule currently exists.**

**Interaction to note either way.** §6.4 makes page-level variance mandatory, but it operates on
structure only — which section dominates, how the page opens, the sequence of fix-block shapes.
Under reading (b), those structural rules are carrying weight that register was meant to share, and
they are being asked to prevent sameness single-handedly.
