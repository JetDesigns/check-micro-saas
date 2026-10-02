# Focused Fix — Output Specification

**Runtime asset.** Loaded during the structuring step of the generation pipeline only. Not
persistent agent context; never auto-loaded into a coding session. Completeness outranks brevity
here — do not compress these rules.

**Evidence base.** Derived entirely from `prompts/focused-fix-analysis.md`. Where that document
marks a rule INFERRED or UNKNOWN, the treatment here is stated explicitly. Pipeline integration
facts (wizard fields, block schema) are quarantined into blocks labelled **Pipeline dependency**
and are not case study rules.

---

## 1. Purpose

Generate a customer-facing portfolio case study for a project where an existing product was
diagnosed and repaired.

The reader is deciding whether to hire or commission the designer. The page's job is to demonstrate
that the designer **diagnoses correctly** — that they can be handed a vague complaint and return
the real problem, then make decisions that follow from it. Craft is demonstrated in service of
that; where a choice would show craft at the cost of showing judgment, judgment wins.

Three consequences that govern everything below:

1. **Specificity is the only source of confidence.** The page never persuades. It states what was
   wrong, what was decided, and why, at a level of detail a reader could check.
2. **Nothing is invented.** Every fact originates in user input. The generator may choose structure,
   order, emphasis and phrasing; it may not supply content the user did not provide.
3. **No two generated pages may read as the same template.** Page-level sameness is a failure of
   the same severity as factual invention. See §6.4 and §11.2.

---

## 2. When this case study type applies

### 2.1 Applies when

The project is an engagement where a product already existed, someone stated a dissatisfaction with
it, and the work was bounded to repairing what was there plus a small number of additions the
client decided on. The designer's contribution was diagnostic and formal: working out what the
complaint pointed at, and deciding what form the product decisions took in the interface.

### 2.2 Does not apply when

- Nothing existed before the work began. Route to the build-from-nothing type.
- The deliverable was advice, strategy or a decision rather than an interface. Route to the
  advisory type.
- The engagement was open-ended discovery with no stated complaint to diagnose.

### 2.3 Preconditions

| Precondition | Status | If missing |
|---|---|---|
| A prior state of the product exists and can be described | **Required.** The entire argument runs on the difference between an old behaviour and a new one | Not this type. Route elsewhere rather than writing around the gap |
| At least two decisions the designer can name, each with a reason | **Required and blocking** | Do not generate. Return the user to the decisions step |
| A stated complaint or reported symptom | Required in substance, not in form | Use the substitution ladder in §10.3 |
| Visual assets | Optional | Slot count follows supplied assets. A text-only page is valid |

---

## 3. Required output structure

### 3.1 The six sections

Fixed baseline, in this order, all mandatory:

| # | Section | Job |
|---|---|---|
| 1 | Overview | Orient a stranger: what the product is, who uses it, what the engagement covered |
| 2 | Problem | Separate the reported symptom from the diagnosis, show evidence, state the stakes |
| 3 | Approach | How the work was shaped, who decided what, and the structural diagram or its considered absence |
| 4 | Solution | The fixes, each justified and tied back |
| 5 | Outcome | What changed for the client |
| 6 | Credits | Attribution as metadata |

**Sections are mandatory. The content inside them is conditional.** A mandatory section held open
with no evidence behind it is the most reliable cause of invention in this genre. Where a section's
optional content is unavailable, the section gets shorter — it does not get filled.

Do not add sections. Do not rename them. Do not nest sub-sections into the page navigation.

### 3.2 Pre-section furniture

| Element | Rule |
|---|---|
| Project title | The client or product name. Never a slogan |
| One-line subtitle | Required. Must name what was worked on and the shape of the work. A subtitle that would fit any redesign of anything has failed and must be rewritten. Under the metric branch it may also carry the headline figure (§7.3) |
| Metadata strip | Include only fields that have a real user-supplied value. Never carry a field that would have to be guessed. There is no canonical field set |
| Hero image | Optional, and subordinate to the fix blocks: if assets are scarce, a screen may not be spent on a hero when a fix block that needs it would then have none. Hero treatment matches the evidence branch — no figure-led hero under the contribution branch (§7.2) |
| Publication date, reading time | Omit |

### 3.3 Excluded from the structure

| Excluded | Reason |
|---|---|
| **Reflection, self-critique, lessons learned, what I'd do differently** | Prohibited. This genre exists to build confidence; self-critique undermines it. Not as a section, not as a paragraph, not as a closing sentence. This holds even when the user supplies such material — see §10.5 |
| Process or timeline walkthrough | The shape of the work belongs in Approach, compressed |
| A separate research section | Where research genuinely drove the diagnosis, it appears inside Problem as provenance |
| A separate demo section | Interactive work embeds inside the fix block it belongs to |
| Completion or handoff status as a headline | Prohibited. See §4.5 |

### 3.4 Solution has no fixed internal shape

Solution contains 2–4 fix blocks. Each block performs the same **role** — one decision, one
argument, one tie-back — and the blocks do **not** share a shape. Shape is selected per block by
§6.2. Identical block shapes repeated down the section is a failure condition (§11.2).

---

## 4. Section content requirements

Each section specifies: required, optional, useful evidence, specificity, never invent. The
never-invent list is operative: it is what the generator must refuse to produce even when the
section looks thin without it.

### 4.1 Overview

**Required**
- What the product is, in one sentence a stranger can hold.
- Who uses it, named by occupation or role rather than as an undifferentiated mass.
- What the engagement covered — which surfaces or products were in scope.
- The designer's role.

**Optional** — the client's sector or scale; the collaboration shape; whether more than one product
was in scope; a note on naming permission.

**Useful evidence** — the user's own description of the client and the scope.

**Specificity** — a named occupation, not a generic user. If the user did not say who uses the
product, write around it rather than filling it with a generic noun.

**Never invent** — company descriptions, market claims, user counts, funding, the client's business
model, or a scope broader than what was worked on.

**Reject and rewrite** — an Overview that restates the title and subtitle at greater length. If it
adds no context the furniture did not already carry, it has failed.

### 4.2 Problem

**Required**
- The reported symptom, attributed to whoever reported it. Where no report exists in any form, use
  the ladder in §10.3 — the requirement is that the page states what appeared to be wrong before
  the diagnosis corrects it, not that a client said it.
- The diagnosis — what the symptom was actually pointing at, stated as a correction of the frame
  the symptom arrived in.
- At least one concrete piece of evidence from the prior state of the product.
- The stakes, expressed in something the client already spends or risks.

**Optional**
- A provenance line stating where the diagnosis came from. This is method disclosure, not
  self-critique, and it is permitted and encouraged. It states how the finding was reached; it never
  states what the designer failed to do.
- A named model or approach, only where the user supplied one.
- Under the metric branch, the baseline becomes **required** — see §7.3.

**Useful evidence** — artifacts of the prior product; repeated patterns across it; whatever the
client wrote down while complaining; constraints that were already in force.

**Specificity** — name the screens, controls, columns and labels involved. A diagnosis written in
abstractions is indistinguishable from a guess.

**Never invent** — research that was not run, analytics that were not read, testing that did not
happen, user quotes, abandonment or drop-off figures, the client's internal reasoning, or a cause
the designer did not identify. Where the designer's diagnosis is a proposal rather than a finding,
the provenance line says so; it is never upgraded into a finding.

**Coupling constraint** — every fix in Solution must have a corresponding pain point stated here.
Write Problem knowing what Solution will contain. A fix with no antecedent in Problem is either
missing a pain point or does not belong in the page.

### 4.3 Approach

**Required**
- The structural shape of the work: what ran alongside what, what depended on what, what was a set
  of comparable items with exceptions in it.
- The diagram, or — when §9 resolves to omission — the same structural shape carried in prose.

**Where the work had no multi-part structure** — one person, one track, one thing after another —
the first requirement is satisfied instead by what *shaped* the work: the constraints in force, the
basis on which decisions were taken, or what the designer decided to leave alone. Approach is never
padded with an invented structure, and never reduced to a restatement of the fixes that follow.

**Optional**
- Decision ownership, **only** where authority was genuinely split and the split shaped the design
  work. Otherwise state the real constraint on authority, or omit the move entirely.
- Constraints that changed the shape of the solution.
- Duration.
- A second product or surface carried in the same engagement.

**Useful evidence** — the work breakdown itself: which areas were touched, which were new, which
followed an existing convention, which broke one.

**Specificity** — where there is more than one track, name what distinguishes them. Distinguish by
*kind* — volume against difficulty, precedent against no precedent — not by count alone.

**Never invent** — a named framework or methodology the user did not supply, a process that was not
run, phases, collaborators, or a decision-ownership split that did not exist. A named model is the
strongest seniority signal when real and the fastest tell when fabricated; if the user left it
blank, the prose stays plain reasoning.

### 4.4 Solution

**Required, per fix block**
- What the prior version did, in behavioural terms — what the user had to know, find, or open.
- What the new version does, at the same level of concreteness.
- Why: a reason that could have gone the other way (§6.1).
- A tie-back to a specific pain point named in Problem. Per block, never once for the section.

**Optional** — a quoted client request that prompted the fix; an exception argument; ordered
interaction beats; paired prior/new imagery; motion or interactive assets.

**Useful evidence** — prior screens, new screens, recordings where the point is a sequence or a
live state, the client's written request, the rejected alternative the user described.

**Specificity** — name the controls and what they were labelled. Behaviour, not adjectives.

**Never invent** — interactions not present in the supplied material, rationale the designer does
not hold, a pain point Problem did not raise, claims about what users can now do that the work does
not support, or an exception argument for what was actually an oversight.

**Ordering** — preserve the order the user gave their decisions in, unless a later fix cannot be
understood without an earlier one, in which case move the dependency first. Do not re-sort by
theme, scale or novelty; the user's order is their own account of the work and re-ordering it
asserts something they did not say.

### 4.5 Outcome

Outcome describes **what changed for the client**. It does not describe the deliverable.

**Required — contribution branch**
- The goal as it was stated at the outset, restated so the result is measured against something the
  reader has already seen.
- What changed operationally: what the client's team can now do, or no longer has to do.
- The client-reported response, attributed to the client and marked as their report — subject to the
  substitution ladder in §10.3 when no client language exists.

**Required — metric branch** — all of the above, plus measure, delta, window, and the limit of
attribution (§7.3).

**Optional** — what the client intends to carry forward, written as intent and never as a result;
facts countable from the artifact itself (§7.2).

**Forbidden**
- Any statement whose subject is the deliverable: that the work was delivered, handed over,
  completed, or shipped, as the section's claim. Shipping status may appear as metadata; it is
  never the result.
- A completion badge or status headline.
- Unattributed satisfaction.
- Self-critique of any kind.
- Any effect claim the evidence cannot carry (§7.4).

**Specificity** — the operational change should be verifiable by looking at the product or at what
people now do. A change in the artifact stated plainly is honest without a metric.

**Never invent** — metrics, adoption, revenue, satisfaction, client quotes, or any result that had
not occurred at the time of writing.

**Length** — a short Outcome is a correct Outcome when the evidence is short. Do not pad it.

### 4.6 Credits

**Required** — the client, named or anonymised as the user directed; the designer's role.

**Optional** — collaborators and their roles, agency, duration, status.

**Format** — label and value pairs. Never a narrative. A small collaboration does not earn a
written team section.

**Never invent** — collaborator names, titles, agency relationships, or duration. A credits line
that has to be guessed is a fabricated claim about real people.

---

## 5. Narrative reasoning rules

### 5.1 The engine

The page is one argument delivered as a chain of obligations. Each link exists because the previous
one created a debt the reader expects to see settled. It is a chain, **not a section template** —
links do not map one-to-one onto paragraphs, and several may be carried by a single sentence.

| Link | What it does | Lands in |
|---|---|---|
| Symptom | Puts the reported problem on the record, attributed | Problem |
| Reframe | Names the category error in that report | Problem |
| Exhibit | Shows the evidence instead of asserting it | Problem |
| Interpretation | Converts the exhibit into a principle | Problem |
| Stakes | Translates the principle into what it costs the client | Problem |
| Ownership | Establishes who decided what | Approach |
| Shape | Makes the structure of the work scannable | Approach |
| Fixes | Prior behaviour, new behaviour, consequence, tie-back — once per fix | Solution |
| Result | What changed for the client | Outcome |

### 5.2 Which links are load-bearing

**Load-bearing — may never be merged away, shortened to nothing, or skipped:**

- **Reframe.** Without the separation of symptom from diagnosis there is no case study, only a
  changelog with a preamble.
- **At least one exhibit.** One concrete piece of evidence from the prior state. Assertion alone
  fails.
- **Per-fix justification and tie-back.** Every block, every time.
- **Result as change.** Outcome states what changed for the client, however briefly.

**May merge, shorten, or disappear entirely:**

- **Symptom** may be absent as a quotation and arrive by the substitution ladder (§10.3).
- **Exhibit and interpretation** may merge into a single sentence when there is only one piece of
  evidence and its meaning is self-evident.
- **Interpretation and stakes** may merge when the mechanism and its cost are the same thought.
- **Stakes** may compress to a clause when the cost is obvious from the evidence.
- **Ownership** disappears entirely when authority was not split.
- **Shape** may be carried in prose when §9 resolves to omission.

A merged link is still a link. Collapsing two links into one sentence is legitimate; dropping a
load-bearing link because the material is thin is not — thin material changes the *length* of the
page, not its argument.

### 5.3 Symptom against diagnosis

1. Keep the reported symptom in the reporter's register, including the parts of it that are wrong.
   Do not translate it into the designer's vocabulary before presenting it; the translation is the
   move the section exists to perform, and performing it early destroys the gap.
2. State the correction as a correction of the **frame**, not of the person: the report pointed at
   one category of cause, the evidence points at another.
3. Cash the new frame out immediately in named specifics. A reframe that stays abstract reads as
   rhetoric.
4. Never make the reporter look foolish. Treat the report as an accurate account of an experience
   and an inaccurate account of its cause. The designer looks useful this way and superior the
   other way.

### 5.4 Show evidence, do not assert it

When the evidence is a **repetition** — the same failure appearing across several places — present
the repetition so the reader perceives it at once, rather than listing the instances in a sentence.
A list asks for agreement; a set produces it.

When the evidence is a **single instance**, state it in prose with its specifics. Do not inflate one
instance into a display; a structured exhibit built from one item reads as decoration.

This is the only place in the page where content is rendered as a structured exhibit rather than
prose, and it is earned only when the pattern itself is the finding.

### 5.5 Interpretation and stakes

**Interpretation** converts the exhibit into a principle: the observed repetition or instance is
evidence of a specific structural failure. State it once, without hedging, and do not restate it
later in the page.

**Stakes** translate that principle into something the client already spends or risks: build cost,
roadmap direction, support load, staff time, revenue, or risk carried. Stakes stated only as user
frustration have not left the symptom and must be rewritten.

### 5.6 Justifying an exception

When a decision breaks a rule the rest of the work follows:

1. State the rule the work otherwise follows.
2. State the deviation plainly, as a decision rather than an accident.
3. State what following the rule would have cost — concretely, as a capability or an answer the
   product would have lost.

Never apologise for an exception and never present it as a compromise. An exception that cannot
name what consistency would have cost is not an exception; it is an inconsistency, and it should not
be argued at all.

### 5.7 Momentum — stated as a prohibition

**No section ends on a summary of itself.**

That is the whole rule. It forbids one thing. It does **not** require every section to end on a
forward-pointing sentence, and it must not be read as a mandate to build a hook into every section
boundary — a page where all six sections end the same way has recreated uniformity at the level the
rule was meant to prevent.

---

## 6. Decision-making logic

### 6.1 The justification unit

Every fix is argued with the same four moves, regardless of the block shape that carries them:

1. **Name the thing** — the control, page or pattern, by its label in the product.
2. **State what it did** — behaviour, not appearance; what the user had to know, find or open.
3. **State what it does now** — same level of concreteness.
4. **State the consequence** — what is now true that was not before, phrased as a fact about what
   the user no longer has to do.

Move 4 is what separates a case study from a changelog. A block without it has described an edit.

**What counts as a reason.** A reason is only a reason if it could have gone the other way. Apply
three tests and discard any justification that fails all three:

- **Disagreement** — could a competent designer have chosen differently and defended it?
- **Cost** — what would the alternative have cost, concretely?
- **Falsifiability** — is the reason tied to this product, or would it apply to any product?

**Banned as reasons:** preference; trend; best practice with no consequence attached; consistency
for its own sake where consistency was not the goal; and the client's request used as the whole
justification — a request explains why the work happened, not why the design took this form.

### 6.2 Fix-block shape selection

A block's shape is selected **per block, from its own material**. It is never inherited from the
block above it. Decide only after establishing what kind of decision this is and what material
exists to show it.

**Shapes**

| Shape | Composition |
|---|---|
| Image-led | One framing sentence, then a run of imagery carrying the argument |
| Prose-led prior/new | Prior behaviour described, new behaviour described, consequence stated, imagery supporting |
| Exception argument | The rule named, the deviation named, the cost of consistency stated, motion or interactive asset where available |
| Ordered mechanic | Numbered beats naming each step of the interaction, with a recording where available |

**Selection order**

1. Is there no prior version of this specific thing? → ordered mechanic.
2. Does this decision break a rule the rest of the work follows? → exception argument.
3. Is this one treatment repeated across many places? → image-led.
4. Otherwise → prose-led prior/new.
5. **Then intersect with assets. Asset scarcity vetoes a shape.** A sequence claim with no recording
   becomes ordered prose beats. Work spanning many places, evidenced by one or two stills, is argued
   in prose around a single representative image — it is not image-led.
6. **Then check the sequence.** If the selection has produced the same shape for every block, revisit
   the blocks whose second-choice shape is defensible on its own material and take it. Never force a
   shape the material does not support in order to create variety — if every fix genuinely has the
   same shape, the variance obligation moves to the page level (§6.4).

**Shape is a label for the argument the block actually makes.** Two blocks whose realised sequence of
moves is the same are the same shape whatever they are called — same opening move, same place for the
tie-back, same closing move, with the nouns changed. §6.4e is recorded against the page, not against
the label, and a register naming three shapes over three identically built blocks has recorded a
choice that was never made.

**Opening move within a block.** A quoted client request is one of several openings, available only
when such a request exists. The others: the rule the decision breaks; the prior behaviour; the
consequence stated first and then earned. Do not default to the same opening for every block.

### 6.3 Traceability

Every fix block ties back to a pain point named in Problem. The tie-back may be an explicit
labelled line or carried inside the prose — both are valid, and the choice may vary between pages
but not within one.

The tie-back is **per block**. A single statement covering all fixes does not satisfy it.

### 6.4 Page-level variance

Block-level variance (§6.2) is not sufficient. Two case studies generated from this specification
must not read as the same document with different nouns. The following are **required to be decided
per project, from the material** — not defaulted.

**(a) Which section carries the most weight.** Exactly one section should dominate the page, and
which one is determined by where the evidence actually is:

| Weight lands on | When |
|---|---|
| Problem | The diagnosis is the contribution — the complaint was misdirected and the reframe is the story |
| Approach | The structure of the work is the contribution — parallel tracks, hard sequencing, a named model |
| Solution | The decisions are the contribution — several fixes each carrying real reasoning |
| Outcome | The result is the contribution — a measured change, or an operational change with reach |

Dominance is expressed in length and in detail density, not by announcing it. If Solution dominates
on every generated page by default, the rule is being ignored.

**(b) Section length ratio.** There is no target ratio. Section lengths follow evidence density: a
section with two facts is shorter than a section with seven, and the page is allowed to be
lopsided. Do not equalise sections. Do not pad a short section to match a long one.

**(c) The opening move of the page.** Problem may open on any of these, chosen from what exists:

| Opening | Available when |
|---|---|
| The reported symptom, quoted | The user supplied client language |
| The reported symptom, attributed but not quoted | A report exists without quotable wording |
| A cold exhibit — the evidence first, the complaint after | The evidence is strong enough to raise the question by itself |
| The diagnosis stated as a correction, with the report following | The gap between report and cause is the sharpest thing in the material |
| The stakes first | The cost is the most concrete fact available |

**A quote is not the default and not mandatory.** Choosing the quoted opening because one is
available, on every page, is a variance failure.

**(d) Whether Problem opens on the report or on shown evidence.** Decided by which is stronger in
this project's material, not by habit. When the report is vague and the evidence is specific, open
on the evidence.

**(e) The fix-block shape sequence.** Recorded as a sequence and compared: two pages whose blocks
run in the same shape order, with the same opening moves, are the same template.

**(f) Diagram form, or its absence.** One of six forms, or none (§9).

**Variance register.** Before finalising, record the choices made for (a) through (f), and **record
alongside each one the specific fact in this project's material that drove it**. A choice that
cannot cite a driver was taken by default, and must be re-derived from the material or changed.

This check is self-contained: it does not require comparing against previously generated pages,
which are not available at generation time. The driver citation is what does the work — a page
whose six choices all trace to stated facts cannot be a template, and a page whose choices trace to
nothing is one regardless of how it reads.

**Genuine similarity is not a failure.** Two projects that really do have the same dominant
section and the same opening move should get them. What is forbidden is arriving at those choices
without deriving them. Never introduce a difference the material does not support in order to look
varied — that is invention wearing a different hat. This check is mandatory (§12).

---

## 7. Evidence rules

### 7.1 The branch gate

Evidence type is a primary branch decided once, early, and it changes the shape of Problem and
Outcome. It is determined by what the user can actually produce, never by preference.

| Branch | Condition |
|---|---|
| **Contribution branch** | No hard numbers. The impact is an operational change, a way of deciding, a reusable system |
| **Metric branch** | A real business or behavioural number exists, with a measure, a baseline, a window and a source |

A user who claims numbers but cannot name the measure, the baseline, the window and the source is
on the contribution branch. Route them there without argument and without comment on the page.

> **Pipeline dependency — naming collision.** The analysis document calls contribution evidence
> "Branch A" and hard metrics "Branch B". The existing codebase inverts this: `evidenceType()`
> returns `'A'` for hard metrics and `'B'` for contribution. Use the words **contribution branch**
> and **metric branch** in prompts and prose. Any code touching this must be read for which
> convention it is using; do not assume the letters agree.

### 7.2 Contribution branch

**Problem** — symptom, diagnosis, shown evidence, stakes. The stakes are argued from mechanism
rather than measurement: what the structural failure costs a business that paid to build the thing.
A cost the user stated themselves may be carried verbatim as stakes, including figures in it; it is
never restated as a result, never placed in the subtitle or metadata strip, and no number is derived
from it. No other numbers appear and none are implied.

**Outcome** — restated goal, operational change, client-reported response. Nothing else.

**Admissible evidence**

| Kind | Rule |
|---|---|
| Facts countable from the artifact | Things a reader could verify by looking at the work — how many places now share one treatment, that a class of explanatory patch is gone, that a capability that required opening something is now in view. These are counts of the artifact |
| Operational change | What the client's team can now do, or no longer has to do |
| Client-reported response | Attributed, marked as their report, never converted into a result |
| Stated intent | Marked as intent, never phrased as something that has happened |

**The line that must hold: facts countable from the artifact are not metrics.** Stating that a class
of element was removed is a fact about the design. Stating that its removal reduced confusion is a
claim about effect, and this branch cannot make it. Holding this line is what makes a case study
without numbers credible instead of evasive.

### 7.3 Metric branch

> **Provisional.** This branch has not been validated against a real hard-metrics case study. It is
> derived, not demonstrated. Review and revise it after the first metric-branch page is generated,
> before treating any of it as settled.

**How Problem differs**

| | Contribution | Metric |
|---|---|---|
| Opening | The report | The report, plus the measurement that corroborates or contradicts it |
| Evidence | Artifacts of the prior state | Artifacts **plus a baseline**: the measure, its value before the work, the window it covers, and its source |
| Stakes | Argued from mechanism | Argued from the number — what the baseline costs per unit time |
| Principal risk | Vagueness | A number with no provenance |

**How Outcome differs**

| | Contribution | Metric |
|---|---|---|
| Core | Operational change | Measure, delta, window — the same measure as the baseline, over a stated period after the change |
| Support | Client-reported response | Client-reported response, still attributed |
| Required addition | — | **The limit of attribution**: what else changed in the same window, and what the number can and cannot be credited to. Stated once, plainly, as a fact about the measurement — never as apology and never as self-critique |
| Principal failure | Deliverable narration | Borrowed causality — a number that moved during the engagement presented as a number the design moved |

**Baseline provenance is required, not optional.** In the contribution branch a provenance line is a
credibility bonus. In the metric branch, a number whose source and window cannot be named is a
liability: it invites a reader to check something that cannot be checked. If provenance is missing,
the number does not appear.

**Keep counts away from measurements.** Facts countable from the artifact (§7.2) remain admissible
here, but a count placed beside a measurement reads as though it had also been measured. Do not
state them in the same breath, and never format a count the way a metric is formatted.

**Placement.** The section order does not change between branches. A headline figure belongs in the
subtitle and the metadata strip; the baseline belongs inside Problem, where it also does
argumentative work. Outcome stays in position five in both branches.

**Mixed case.** One weak or partial number is handled as the contribution branch with a single
stated figure carrying its source inline — never as a headline, never in the metadata strip. One
unreliable number in a prominent position discredits everything around it.

### 7.4 Honesty rules, both branches

1. **No metric without a baseline.** An improvement with nothing to improve from is not evidence.
2. **No causal claim the evidence cannot carry.** The design changed; what people then did is a
   separate question with a separate burden of proof.
3. **Client feedback is quoted or attributed, never rendered as a result.** A report of what the
   client confirmed is admissible. The same sentence restated as an achievement is not.
4. **Missing evidence is handled by omission, not by hedging.** Do not write paragraphs of
   qualification in place of evidence, and do not narrate the absence.
5. **Intent is marked as intent.**
6. **Unverified reasoning is flagged, not asserted.** Where the generator has reasoned its way to a
   rationale the user never stated, mark that passage for confirmation rather than asserting it.

### 7.5 Evidence failure modes

| Failure | What it looks like |
|---|---|
| Metric laundering | Counting deliverables as results — screens designed, components built, surfaces covered, presented as impact |
| Borrowed causality | A business number that moved during the engagement, attributed to the design |
| Anonymous praise | Positive client sentiment with no speaker |
| Deliverable narration | Outcome describing what was shipped instead of what changed |
| Hedge padding | Qualification standing in for evidence |

---

## 8. Writing style

### 8.1 Tone

Flat and declarative. Make assertions without hedging where evidence supports them, and omit them
where it does not. The register never shifts into persuasion. No enthusiasm, no scene-setting, no
suspense. Confidence comes from specificity, never from adjectives.

### 8.2 Sentences

- A short main clause carrying the claim, sometimes followed by a qualifying clause carrying the
  nuance.
- Use the em-dash for corrective work — the turn from what was assumed to what is the case — not as
  a general connector.
- Lists inside prose are concrete nouns, not abstractions.
- Paragraphs run one to four sentences. A fix block rarely runs past two paragraphs before imagery
  or a beat interrupts it.
- Vary sentence openings within a section. Three consecutive sentences beginning with the same
  construction is a rewrite trigger.

### 8.3 Headings

Sentence case. Noun phrases. Section headings are the six fixed labels and nothing else.

Fix block titles name the artifact worked on, not the achievement and not the benefit — a block
titled with its outcome pre-empts the argument it exists to make. No questions as headings. No
marketing gerunds.

### 8.4 Person

The default subject is the product or the work, not the designer. First person appears for
decisions the designer personally made or declined to make, and for the limits of what they know.
It does not appear for the client's decisions, for other people's work, or as a device to add
warmth.

Where one person made every decision, first person expands to cover what would otherwise be
attributed to a team. The expansion is in attribution, not in prominence.

### 8.5 Client language

Where the user supplied client wording, quote it verbatim and set it apart, clearly marked as the
client's. Never clean it up, never compress it into a claim the page then relies on.

Where no client wording exists, do not reconstruct it. Use the ladder in §10.3.

### 8.6 Captions and alt text

**These are two different jobs and must not be collapsed into one string.**

**Caption** — points at a design decision. It answers which decision this shows and what the reader
should notice. It never narrates what is visually present.

Three tests, applied to every caption:
1. Does it name a decision, or only a thing?
2. Could it sit unchanged under a different image? If yes, it is a label and must be rewritten.
3. Does it tell the reader what to look for, rather than what they are looking at?

Failing caption forms, all prohibited: position labels; the artifact name repeated from the heading;
the section name; a description of the layout.

Where only the new state exists and the reader cannot see the contrast, the caption names what
changed rather than relying on juxtaposition.

**Alt text** — describes what is on the screen for a reader who cannot see it. Specific, and never
phrased as a description of the file.

**No two captions on one page may share the same syntactic frame.** Captions built from one mould
read as generated even when each one is individually correct.

### 8.7 Imagery placement

Figures sit inline, immediately after the sentence that makes them necessary. Never batched at the
end of a block, never gathered into a gallery.

An asset with no decision to point at is dropped, not captioned generically. A block with one
purposeful image is stronger than a block with one purposeful image and one decorative one.

**A fix block with no asset is written without one.** Do not duplicate an image across blocks to
even them out, and do not reorder the blocks to put the illustrated ones first — ordering is
governed by §4.4 and is not an asset decision.

### 8.8 Banned

| Banned | Why |
|---|---|
| Praise adjectives of the seamless/intuitive/beautiful/delightful family | Unfalsifiable; wrong register |
| Sentimental closers | Replace evidence with feeling |
| Metadata strings joined by middle dots | Register clash, and a template tell |
| Tracked-out uppercase eyebrow labels | Wrong register for a work record |
| Alt text phrased as a description of a file rather than a screen | Fails its only job |
| Process verbs with no consequence attached | Narrates activity instead of decisions |
| An undifferentiated mass noun for people whose role is known | Discards the one specific the user gave |
| Restating the brief as if it were a finding | Skips the reframe, which is the whole argument |
| A status badge announcing completion | Deliverable narration |
| Section-closing summaries | §5.7 |

---

## 9. Structural diagram

The Approach section carries a generated diagram whose job is to make **the shape of the work**
scannable without reading prose. It is not decoration, not a summary of the page, and not a picture
of the product. It answers one question: how was this work structured?

### 9.1 The decision rule

**Identify the structural relationship first. Select a form second. Never the reverse.**

1. Determine the relationship the work actually has (§9.4–9.5).
2. Check that the relationship carries a distinction worth seeing.
3. Select the form that represents that relationship.
4. If no relationship survives step 2 after inference and confirmation, generate nothing (§9.7).

Reaching for a shape because it looks like a diagram, then fitting the work into it, produces a
graphic that misrepresents the work. This is the single most common way this feature fails.

### 9.2 Vocabulary of forms

Six forms. Each carries one relationship and each has a condition. There is no seventh.

| Relationship | Form | Applies when | Must be encoded visually |
|---|---|---|---|
| Parallel tracks | Lanes running side by side | Distinct bodies of work ran at the same time and differed in kind | Which track carried more volume and which carried more difficulty — as weight, size or density, never as a label |
| Sequence with dependency | Directed chain | Each stage could not begin until the previous one produced something | Direction, and where the dependency is hard rather than loose |
| One-to-many branching | Root with branches | One decision or system propagated into many applications | That the root is singular and the branches are instances of it, not peers of it |
| Peer set with exceptions | Cluster or grid with exceptions marked | Several comparable items where a few behave differently | Which items are the exceptions — by fill, outline or position. This is the entire point of the form |
| Before/after system | The same item set in two states | The work changed the relationships between existing parts without adding parts | The difference between the states, usually in the connections, since the items are constant |
| Scope boundary | Nested containment | What was inside the engagement against what was adjacent to it | The boundary, and what sits on each side |

A relationship that fits none of these is a candidate for omission, not for inventing a form.

**A ring or cycle is not in this vocabulary.** A ring asserts that each item leads to the next and
returns, which is a claim about the work. Do not use one for a set of peers, a set of tracks, or a
sequence that does not return to its start.

### 9.3 Self-containment, density, accessibility

**Self-containment.** The diagram carries its own point. If the reader needs the caption to
understand what they are looking at, the diagram has failed. Distinctions that matter — which items
are exceptions, which track was harder, which way a dependency runs — are encoded visually and
never written underneath.

*Test:* cover the caption. If the point disappears, the graphic is decoration with an explanation
attached. Redo it or omit it.

**Density.** The diagram must be more scannable than the prose it replaces. If it occupies more
vertical space while carrying less information, it has not earned its place. It should carry fewer
labels than the paragraph has nouns, and take less height than the paragraph takes lines.

**Accessibility.** Every diagram ships with a text equivalent that states the same relationship the
graphic encodes — not a list of its labels. A diagram with no text equivalent is incomplete.

### 9.4 Flow: infer, propose, confirm

The relationship is **inferred by the pipeline**, then **confirmed by the user**, before generation.
The user is never asked to classify their own work into a named relationship.

| Stage | Behaviour |
|---|---|
| **1. Infer** | Read the input contract (§9.5). Produce at most one candidate relationship, its form, its exception markings, and a confidence level of high or low |
| **2. Propose** | Render a preview of the candidate together with a plain-language reading of what it claims about the work. Provide affordances to change the form, to mark and unmark exceptions, and to skip the diagram entirely. A low-confidence candidate opens in the no-diagram state with the same affordances available — it is never presented as a finished diagram |
| **3. Confirm** | Confirmation may be active or passive. Passive acceptance is valid confirmation; the user is not required to act. An explicit skip resolves to omission |
| **4. Render or omit** | Generate the confirmed form with its text equivalent, or omit per §9.7 |

**This confirmation step is load-bearing, not an enhancement.** Without it the page publishes a
structural claim about someone's work that they never verified. Specify it as a required step in
the diagram flow. If confirmation cannot be shown, the diagram is not generated.

### 9.5 Input contract

**What the inference reads** — material the user has already supplied elsewhere in the wizard:

| Source | What it can yield |
|---|---|
| The decisions list (each: what was decided, what made you decide it, what was considered instead) | The work items and their labels, in the user's own words. Always present — two to four entries |
| The overall approach or model field | Where filled, may name the relationship outright. Usually blank |
| The constraints field | May reveal a dependency or a forced sequence |
| The voice sample | May contain a process narrative stating what ran alongside what |
| The per-screen notes, which map each screen to a decision | Evidence distribution across items — not a relationship in itself |

**Labels come from the user's own words.** Never invent a category name to tidy a diagram; invented
labels are the fastest way to make a generated graphic look generated.

**Thin or absent material.** When the decisions carry no statement of ordering, exception or
parallelism, the inference resolves to low confidence. Low confidence does not license a guess: the
preview opens in the no-diagram state, and the user may supply the missing distinction through the
affordances or accept the omission.

**Item floor.** With fewer than three items, only parallel tracks and before/after system remain
meaningful. Every other form degenerates. Below three items and outside those two relationships,
resolve to omission.

**Expected distribution.** With the fields as they currently stand, low confidence is the common
outcome, not the edge case: most projects will supply items without stating how they relate. The
preview is therefore the **primary path** to a diagram rather than a fallback, and a low-confidence
inference is a normal result rather than an error state. A pipeline that treats low confidence as a
failure will ship a feature that never fires; one that treats it as licence to guess will ship
§9.6's failure instead.

> **Pipeline dependency — the contract is only partially satisfiable by current fields.**
> Work items and labels are fully available from the decisions list. The relationship itself is
> available only weakly, from free text that may not mention it. **Ordering and dependency,
> exception membership and what each exception deviates from, and relative difficulty or weight are
> captured by no current field.**
>
> This gap is closed by the confirmation step in §9.4, not by inference — which is the concrete
> reason that step is required rather than optional. **If the confirmation step is cut or deferred,
> a new wizard field becomes mandatory**: one that captures ordering and exception membership
> explicitly. Without either the confirmation step or that field, the only defensible output is
> omission on every project.
>
> **Second dependency:** the current block schema implements exactly one diagram primitive, a cycle
> of three to five nodes. That form is not in the vocabulary above and must not be used as a
> substitute for the form the relationship actually calls for. Shipping the form vocabulary requires
> schema work.

### 9.6 Never guess

A confident wrong diagram is worse than no diagram. It asserts a structure the user never claimed,
in a section whose purpose is to demonstrate that the designer understands structure. Where
inference is uncertain and confirmation does not resolve it, omit.

The self-containment test governs both cases: a diagram that needs explaining has failed, and a
diagram that explains something untrue has failed worse.

### 9.7 Omission

Omission is a **last resort, not a first gate**. It fires only after inference and confirmation have
both failed to produce a relationship carrying a distinction worth seeing.

It fires when:
- the work was linear and undifferentiated — one track, one thing after another;
- the only available relationship is "these are the things that were done";
- the item floor is not met (§9.5);
- the user explicitly skipped;
- the distinction that would make a form meaningful does not exist in the material.

**How Approach reads with no diagram.** The section is never omitted and never shortened to
compensate. It carries the same structural content in prose: the items named, what distinguishes
them, and any ordering or exception stated plainly. There is no placeholder, no empty frame, no
caption without a graphic, and **no sentence acknowledging that a diagram was not generated**. The
reader must not be able to tell that a diagram was ever considered.

---

## 10. Behaviour when information is missing

### 10.1 The governing rule

**Never manufacture evidence of success.** Facts — numbers, client wording, what shipped, who was
involved, how long it took — come from user input only. The generator chooses structure, order,
emphasis and phrasing. It does not supply content.

### 10.2 Silent omission

When a conditional element is absent, **omit it and say nothing about the omission**. Do not write
that metrics were unavailable, that the client gave no feedback, or that the prior state was not
captured. Do not leave a labelled empty slot, a placeholder, or a heading with nothing under it.
Absence is handled by removal.

The one exception is method disclosure (§4.2), which states how a finding was reached. That is a
positive statement about provenance, not a narration of absence.

### 10.3 Substitution ladders

Where the analysis specifies a ladder rather than plain omission, work down it in order and stop at
the first rung the material supports.

**No client wording for the reported symptom:**
1. An attributed report, clearly marked as the client's account rather than the designer's words.
2. The designer's own account of the symptom as it was reported to them, carrying a provenance line.
3. The presenting symptom stated as what the product's own behaviour indicated, with the reframe
   then working against that reading rather than against a report.

**Never reconstruct a quotation**, including one the client plausibly would have said.

**A diagnosis too thin to support a reframe** — *provisional: written against a case that has not yet
been generated, and reviewed after the first thin-answer run.*
1. State the symptom as reported, and what the product's own behaviour indicated, and let the reframe
   work against that reading rather than against a fuller diagnosis the answers do not hold.
2. Where even that is unavailable, Problem carries the symptom and whatever single piece of evidence
   exists, and is short.

The reframe is load-bearing (§5.2) and is never dropped — and it is never manufactured either. A
reframe the answers cannot support is an invention, and §10.1 outranks the obligation to produce one.
The page gets shorter; it does not get filled.

**No client wording for a fix block that would otherwise open on a request:** the exception argument
opens on the rule the decision breaks. The shape survives; only its opening move changes.

**No client-reported response in Outcome:**
1. An attributed confirmation that is not a quotation — a report of what the client's team confirmed
   requires no quoted wording.
2. Observable adoption: what the client's team has since done with the work.
3. Nothing. Outcome then carries the restated goal and the operational change, and is short.

### 10.4 When measurable outcomes are unavailable

Describe the change that was delivered. Describe observed or reported feedback, attributed.
Distinguish fact from interpretation in the wording itself: what is known, and what it appears to
indicate, must not be phrased identically.

### 10.5 When the user supplies self-critical material

The wizard collects what the designer would do differently. **That material is never rendered.** It
does not become a section, a paragraph, a closing line, or a hedge inside Outcome.

It may be read for one purpose only: where it states a *method fact* — how the diagnosis was
reached, what was and was not examined — that fact may inform the provenance line in Problem,
stripped of the regret framing. Nothing that reads as a shortfall, a limitation of the designer, or
a lesson learned reaches the page.

> **Pipeline dependency.** The wizard's outcome status is metadata about shipping. It may appear in
> the metadata strip. It never becomes the Outcome section's claim, and a status of handed off, not
> launched or proof of concept never causes Outcome to narrate the deliverable.

### 10.6 Thin answers

A short user answer is used as given, and the page around it gets shorter. Do not expand a thin
answer into invented detail, and do not compensate for it by lengthening a neighbouring section.

Where the generator has reasoned its way to a rationale the user never stated, mark that passage for
confirmation rather than asserting it.

---

## 11. Anti-patterns and failure modes

### 11.1 Content-level

| Failure | Detection |
|---|---|
| Deliverable narration in Outcome | The subject of the section's claim is the work product rather than the client |
| A reflection or self-critical passage anywhere | Any sentence about what was missing, unprovable, or would be done differently |
| A fix block with no consequence stated | Move 4 of the justification unit absent — the block describes an edit |
| A tie-back stated once for the whole section | Traceability is per block |
| A fix with no antecedent pain point in Problem | Either Problem is incomplete or the fix does not belong |
| A justification that fails all three reason tests | Preference, trend or platitude dressed as rationale |
| Stakes expressed only as user frustration | The section never left the symptom |
| An exhibit built from a single instance | A structured display used for one item reads as decoration |
| An invented collaborator, duration, framework or number | Any fact not traceable to user input |
| A caption that labels rather than decides | Fails the three caption tests |
| A generic caption attached to an asset included because it was available | Drop the asset instead |
| An Overview restating the title at greater length | No new context |

### 11.2 Page-level sameness — treat as severely as invention

| Failure | Detection |
|---|---|
| The page's opening move cannot cite the material fact that selected it | Defaulted rather than chosen (§6.4c) |
| Solution dominates although the material's density sits elsewhere | Weight not decided from evidence (§6.4a) |
| Sections equalised in length against uneven evidence | Length targeted rather than following density (§6.4b) |
| The fix-block shape sequence cannot be justified from each block's own material | Shape inherited rather than selected (§6.2, §6.4e) |
| Every section ends on a forward-pointing hook | The momentum prohibition read as a mandate (§5.7) |
| Captions built from one syntactic mould | §8.6 |
| The same diagram form on every project | Form selected before relationship (§9.1) |
| Any register entry has no driver recorded against it | The choice was taken by default (§6.4) |

### 11.3 Diagram-level

| Failure | Detection |
|---|---|
| A form chosen before the relationship was identified | The form does not match any relationship in §9.2 |
| The key distinction written in the caption instead of drawn | Fails the cover-the-caption test |
| A graphic rendered from a low-confidence inference | Confidence gate bypassed |
| A diagram published without user confirmation | Required step skipped |
| An empty frame, placeholder or note where a diagram was not generated | §9.7 |
| Invented labels | Labels not traceable to the user's own words |
| No text equivalent | §9.3 |

---

## 12. Final validation checklist

Run before returning the structured output. Every item is a hard gate.

**Structure**
1. All six sections present, in order, correctly named, with no additions.
2. Solution contains between two and four fix blocks.
3. No reflection, self-critique or lessons-learned content anywhere in the page.
4. No section contains a placeholder, an empty labelled slot, or a sentence narrating an absence.

**Evidence**
5. Every fact in the page traces to user input. No number, name, duration, collaborator, quotation
   or research claim was generated.
6. Branch correctly determined; Problem and Outcome match the branch's required shape.
7. Under the metric branch: measure, baseline, window, source, delta and the limit of attribution
   are all present, and no count is formatted as a measurement.
8. Outcome's claim is what changed for the client. Nothing in it makes the deliverable the subject.
9. Client feedback appears as quotation or attribution, never converted into a result.

**Argument**
10. The reframe is present: the reported symptom and the diagnosis are distinct, and the diagnosis is
    cashed out in named specifics.
11. At least one concrete exhibit from the prior state is present.
12. Stakes are expressed in something the client spends or risks.
13. Every fix block carries all four justification moves and its own tie-back to a named pain point.
14. Every fix's reason passes at least one of the three reason tests.

**Variance**
15. The variance register is recorded — dominant section, length pattern, page opening move, Problem
    opening, fix-block shape sequence, diagram form or omission — and **every entry cites the fact in
    this project's material that drove it**.
16. The fix blocks do not all share one shape, unless the material genuinely forces it and the page
    compensates at the register level.
17. No section ends on a summary of itself, and the sections do not all end the same way.
18. No two captions share a syntactic frame.

**Visuals**
19. Every caption names a decision and survives the three caption tests.
20. Alt text is present, describes the screen, and is distinct from the caption.
21. No asset appears that has no decision to point at.

**Diagram**
22. Either a diagram is present, confirmed by the user, matching one of the six forms, passing the
    cover-the-caption test, with a text equivalent — or no diagram is present and Approach carries
    the structure in prose with no trace of the omission.
23. No ring or cycle form was used.

---

## Appendix — resolution of the analysis's open questions

The analysis left eight items UNKNOWN. None passes into this specification unresolved. Each is
resolved below as exactly one of: a **decided default**, an **explicit user choice**, or a
**documented non-constraint** the generator may vary freely.

| # | Open question | Resolution | Reasoning |
|---|---|---|---|
| 1 | How many fix blocks | **Decided default:** two to four | Below two there is no argument to compare, above four the section becomes a changelog. Matches the existing block schema's spine range, so the specification and the validator cannot drift apart |
| 2 | Fix ordering | **Decided default:** preserve the user's own order, moving a fix only when a later one cannot be understood without it | The user's order is their account of the work; re-sorting it by theme or scale asserts something they did not say. Broad-to-specific is explicitly not required |
| 3 | Whether a hero image is required | **Decided default:** not required, and subordinate to the fix blocks when assets are scarce | Slots follow supplied assets. A hero that starves a fix block costs more than it earns |
| 4 | Target length | **Documented non-constraint:** no word or length target at any level | A target length is the most direct cause of padding, and padding is the failure this genre cannot survive. Length follows evidence density (§6.4b) |
| 5 | Whether Overview may carry outcome claims | **Decided default:** no. Overview stays orienting in both branches. Under the metric branch a headline figure may appear in the subtitle and metadata strip only | Keeps Overview's job single, and gives the metric branch its early proof without moving a section |
| 6 | How the metric branch reads in practice | **Decided default, marked provisional:** written in full at §7.3 with an explicit review trigger after the first metric-branch page is generated | Writing it is necessary; treating it as settled is not warranted by a single contribution-branch reference |
| 7 | Whether six sections suffice for larger engagements | **Decided default:** yes. The fix-block cap keeps Solution navigable without adding sub-sections to the page navigation | The cap and the nav decision resolve each other; a longer Solution is prevented rather than accommodated |
| 8 | Anonymisation behaviour | **Explicit user choice** surfaced in the interview: whether the client may be named | Permission is a fact only the user holds. Default to not naming, apply the choice consistently across page, captions and credits, and never imply clearance that was not given |
