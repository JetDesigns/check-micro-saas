# Focused Fix — Reference Analysis

Analysis of the canonical reference output for the **Focused Fix** case study type, performed to
extract the reusable rules behind it. This document is **not** the generation specification. It is
the evidence and reasoning the specification will be written from.

Reference analysed: `https://check-case-build.vercel.app/standalone` (the shipping artifact), the
reference implementation at `~/dev/numinar-case-study/app/work/numinar/**`, and the prior
framework at `~/dev/check-microsaas/check-case-study-framework.md`.

---

## 0. How to read this

### 0.1 Tagging

Every rule carries a confidence tag and a source tag.

| Tag | Meaning |
|---|---|
| **OBSERVED** | Directly evident in the reference. Present in **one sample** — this is not a claim that it is correct. An element can be OBSERVED and still be a defect, or an accident of this one project. Where that applies it is said inline. |
| **INFERRED** | A reusable rule derived from the reference rather than shown by it. |
| **UNKNOWN** | Cannot be reliably determined from a single sample. Listed in part 11 rather than guessed at. |

| Source | Meaning |
|---|---|
| `[deployed]` | The shipping page |
| `[repo]` | The reference implementation |
| `[both]` | Present and consistent in both |
| `[given]` | A product decision supplied as an external constraint — not derived from the reference and not open to validation against it |

### 0.2 External constraints (given, not inferred)

1. The output page keeps a fixed six-section side nav as the minimum baseline: **Overview,
   Problem, Approach, Solution, Outcome, Credits.**
2. Image and video slots follow the assets the user actually provides. There is **no fixed number
   of visual slots.**
3. Every screen caption must point at a design decision, not describe the layout. A caption
   answers *which decision does this show* and *what should someone notice here*. It never
   narrates what is visually present.

These outrank anything observed. Where the reference contradicts them, the reference is wrong.

### 0.3 Known defects in the reference — anti-patterns, not structure

**Defect 1 — Outcome narrates the deliverable.** The reference's Outcome opens on a handoff status
and reports that a redesigned product was delivered. That is the shape of the deliverable, not the
shape of a result. Outcome must describe what changed *for the client* — operational change,
stated goals met, client-reported response. Flagged again at the point it would otherwise be
extracted (§4.5).

**Defect 2 — the Reflection block.** The reference implementation carries a self-critical block
(what was missing, what cannot be proven, what would be done differently). It must **not** appear
in the target structure. This genre is a customer-facing portfolio case study; self-critique
undermines the confidence it exists to build. Excluded entirely. Flagged again at §2.7 and §7.4.

Note the boundary this exclusion does *not* cross: **method disclosure is not self-critique.**
Saying where a diagnosis came from ("this came from auditing the product against the reported
symptoms") is a provenance fact and stays. Saying the designer should have asked for a baseline
and regrets not doing so is reflection and goes.

### 0.4 Source hierarchy

The two builds diverge. Where they do, **the better-executed instance wins and the divergence is
recorded as a finding** — never averaged, never silently resolved.

| # | Divergence | Verdict |
|---|---|---|
| 1 | **Captions.** Deployed labels its figures by position and artifact name. Repo writes captions that state the decision, and carries description separately in `alt`. | **repo wins** — deployed violates constraint 3 outright |
| 2 | **Approach diagram.** Deployed ships a flat graphic: eight identical chips on a ring, empty `alt`, and the distinction that matters stated only in the caption below. Repo marks the exceptional nodes visually, and swaps an unconnected state for a connected one to show what the system did. | **repo wins** on self-containment. Both fail a separate test: a ring implies a cycle the content does not have |
| 3 | **Outcome.** Deployed uses a handoff status eyebrow. Repo merges results with a reflection block. | **neither wins** — deployed's shape is closer but carries defect 1; repo's reflection is excluded by constraint |
| 4 | **Provenance.** Repo states that the diagnosis came from auditing rather than research, analytics or testing. Deployed drops it. | **repo wins** — this is method disclosure, and the Reflection exclusion does not remove it |
| 5 | **Traceability.** Repo tags each fix with an explicit pain-point line. Deployed carries the tie-back inside prose. | **both valid** — the requirement is the tie-back; the tag is one implementation of it |
| 6 | **Subtitle.** Deployed is generic (clearer, easier to use). Repo names the surfaces and the new capabilities. | **repo wins** on specificity |
| 7 | **Meta strip fields.** Deployed: type, role, year, duration. Repo: status, type, year, role — with duration moved into credits. | **no winner** — the field set is conditional, not canonical |
| 8 | **Byline furniture.** Deployed prints a publication date and read time joined by a middle dot — a separator the repo's own rules forbid. | **repo wins**; the date/read-time pair is optional at best |

### 0.5 Specimen rule

Reference sentences appear in this document only as **specimens** — short, marked, and always
paired with the abstract pattern they demonstrate. A specimen shows what a rule looks like when
satisfied. It is never copy to reuse, and no specimen in this document should survive into a
generated case study for a different project.

---

## 1. Type definition and preconditions

### 1.1 What a Focused Fix is

**INFERRED [both].** A Focused Fix is an engagement where **a product already exists**, a client
arrives with a stated dissatisfaction, and the work is bounded to repairing what is there plus a
small number of additions the client decided to make. The designer's contribution is diagnostic
and formal: working out what the complaint is actually pointing at, and deciding what form the
client's product decisions take in the interface.

It is not a zero-to-one build, not a brand exercise, and not an open-ended discovery engagement.
Those need different narrative engines and should not be forced through this one.

### 1.2 Preconditions — what must exist for this type to work

| Precondition | Why it is load-bearing | If missing |
|---|---|---|
| **A before state** | The entire engine runs on the difference between an old behaviour and a new one. Every fix block, every justification, and the Outcome all reference it. **OBSERVED [both]** and **INFERRED** as structural, not decorative. | Not a Focused Fix. Route to a different type rather than writing around the gap |
| **A stated complaint** | Problem opens by separating what the client said from what was actually wrong. Without an original statement there is nothing to reframe | Substitute permitted — see §4.2 and §12(d) |
| **Nameable decisions** | Solution is a series of decisions with reasons. A user who can only supply screens has supplied an image gallery, not a case study | Blocking. The interview must produce decisions or the type cannot be generated |
| **Assets** | Slot count follows assets **[given]** | Degrades gracefully — see §8.6 |

### 1.3 Who the page is for

**INFERRED.** The reader is evaluating judgment before hiring or commissioning: a prospective
client, a hiring reviewer, a founder deciding who to trust with a product. The page's job is to
demonstrate that the designer **diagnoses correctly** — that they can be handed a vague complaint
and return the real problem. Every structural choice below serves that, and where a choice would
demonstrate craft at the cost of demonstrating judgment, judgment wins.

---

## 2. Information architecture

### 2.1 The six sections

**[given]** — fixed, minimum baseline, in this order.

| # | Section | Purpose in one line | Mandatory? |
|---|---|---|---|
| 1 | **Overview** | Orient a stranger: what the product is, who uses it, what the engagement covered | Yes **[given]** |
| 2 | **Problem** | Separate the reported symptom from the actual diagnosis, show evidence, state the business stakes | Yes **[given]** |
| 3 | **Approach** | How the work was shaped and who decided what — plus the structural diagram | Yes **[given]** |
| 4 | **Solution** | The fixes themselves, each justified and tied back | Yes **[given]** |
| 5 | **Outcome** | What changed for the client | Yes **[given]** |
| 6 | **Credits** | Attribution as metadata | Yes **[given]** |

Sections are mandatory; **the content inside them is conditional**. The distinction matters: a
mandatory section with no evidence behind it is the single most reliable driver of invention. Part
4 specifies, per section, what is required, what is optional, and what must never be manufactured
to fill the shape.

### 2.2 Pre-section furniture

Everything above Overview. **OBSERVED [deployed]** unless noted.

| Element | Status | Rule |
|---|---|---|
| Breadcrumb | Conditional | Depends on where the page is hosted. A standalone page has nothing to point back to |
| Project title | Required | The client or product name alone. Not a slogan |
| One-line subtitle | Required | Must name what was worked on and the shape of the work. Divergence 6: the deployed generic phrasing is the weaker instance. A subtitle that would fit any redesign has failed |
| Date / read time | Optional at best | **OBSERVED-but-suspect [deployed]**. Divergence 8; the separator used also violates the project's own banned list |
| Meta strip | Conditional field set | Deployed and repo disagree on fields (divergence 7). Treat as: include only fields with a real value. Never carry a field that would need inventing — see §10.3 |
| Hero image | Conditional on assets **[given]** | The repo is explicit that a metrics-style hero would be a lie in visual form when there are no verified numbers. **INFERRED rule, stated in both directions:** hero treatment matches the evidence branch — no oversized figures under Branch A, and a headline figure is legitimate under Branch B (§7.3). **Asset-scarcity rule (§12c):** a screen may not be spent on a hero if the fix block that needs it would then be left without one; with very few assets, no hero |

### 2.3 Section anatomy

**OBSERVED [both].** A section is a rule, a heading, and prose — no background fills, no cards, no
boxed callouts. The reference implementation's own reasoning is that a flat ground makes the
screenshots read as product UI rather than as pictures arranged on a surface.

**OBSERVED [repo], formatting instance only:** prose is set to a narrower measure than the figure
column, so images break wider than the text without the text following them. Recorded as the
mechanism behind a general rule — **figures may exceed the text measure; text should not stretch
to match figures** — not as a specific pair of numbers to reproduce.

**OBSERVED [both], conditional:** sections are numbered in the margin. This is a house treatment,
not a requirement of the type.

### 2.4 Navigation

**OBSERVED [both].** A persistent side rail with the six labels and an active-state that tracks
scroll position. Sub-sections inside Solution are deliberately **not** in the rail — nesting makes
the active state noisy.

**Artifact, not a pattern:** in the deployed build the Outcome nav label points at a section whose
id is still `results`, left over from an earlier naming. Do not reproduce the mismatch.

### 2.5 Solution is a repeating role, not a repeating shape

This is the most consequential IA finding. The Solution section repeats a **role** — one fix, one
argument, one tie-back — but the reference does **not** repeat a shape. It demonstrates four
distinct block shapes. **OBSERVED [both].**

| Shape | What it looks like | What drives it |
|---|---|---|
| **Image-led, minimal prose** | One framing sentence, then a run of images | The decision is a single treatment applied across many surfaces. The evidence is *volume* — the images are the argument, and prose would only restate them |
| **Prose-led old/new explanation** | Old behaviour described, new behaviour described, consequence stated, images support | The decision is a behavioural change inside one surface that a still image cannot show. What moved from hidden to visible is a claim about interaction, so it has to be written |
| **Quote-led exception argument** | Client request quoted, the deviation named, the cost of *not* deviating stated, motion asset | The decision deliberately breaks the system's own pattern. An exception has to be argued, and opening on the client's own request establishes that the exception was demanded, not indulged |
| **Ordered mechanic walkthrough** | Numbered beats naming each step of the interaction, plus a recording | A new capability with no precedent in the product. The reader needs the *sequence*; there is no prior version to compare against, so old/new prose has nothing to work with |

**Conditional (§12d).** The quote-led shape requires a client request that actually exists in
writing. Without one the shape survives and only its opening move changes: it opens on the rule the
decision breaks instead of on the request.

**Rule (INFERRED).** A fix block's shape is selected **per fix, from its own material** — the kind
of decision being shown, and the assets available to show it. It is never inherited from the block
above it. The generator decides shape only after it knows (a) what kind of decision this is and
(b) what it has to show it with.

Selection inputs, in order:

1. **Is there a prior version of this specific thing?** No → ordered mechanic walkthrough.
2. **Does this decision break a rule the rest of the work follows?** Yes → exception argument.
3. **Is this one treatment repeated across many surfaces?** Yes → image-led.
4. **Otherwise** → prose-led old/new.
5. **Then** intersect with assets — **asset scarcity vetoes a shape** (§12c). A sequence claim with
   no recording falls back to ordered prose beats. System-level work with one or two stills is
   argued in prose around a single representative image, not as an image-led block.

**Anti-pattern (INFERRED).** Four identically-shaped blocks in a row. Uniformity reads as a
template being filled, which is precisely the impression this genre cannot afford.

### 2.6 Credits

**OBSERVED [both].** A metadata footer — label/value pairs, no narrative. The prior framework is
explicit that a two-person collaboration does not earn a written team section, and the reference
follows it. Field set is conditional (see §10.3(a)).

### 2.7 What the structure deliberately does not contain

| Absent | Status |
|---|---|
| **Reflection / self-critique** | **Excluded by constraint.** Defect 2. Not a section, not a paragraph, not a closing sentence |
| **Process or timeline section** | Absent **[both]**. The shape of the work is compressed into Approach; a phase-by-phase walkthrough is not part of this type |
| **Research section** | Absent **[both]** — because none was done. Conditional: if real research drove the diagnosis it belongs inside Problem as provenance, not as a new nav item, since the nav is fixed **[given]** |
| **Demo as a nav item** | Prohibited by prior art; interactive work embeds inside Solution |
| **Prev/next project links** | Absent **[deployed, repo]**. Host-dependent, not part of the type |

---

## 3. Narrative logic

### 3.1 The engine

**INFERRED [both].** The page is a single argument delivered in links. Each link exists because the
one before it created an obligation.

| # | Link | Job | Lands in |
|---|---|---|---|
| 1 | **Complaint** | Put the client's words on the record, attributed and unedited — substitutes at §12(d) | Problem |
| 2 | **Reframe** | Name the category error in the complaint | Problem |
| 3 | **Exhibit** | Show the evidence rather than assert it | Problem |
| 4 | **Interpretation** | Convert the exhibit into a principle in one sentence | Problem |
| 5 | **Stakes** | Translate the principle into the client's economics | Problem |
| 6 | **Ownership** | Establish who decided what | Approach |
| 7 | **Shape** | Make the structure of the work scannable | Approach + diagram |
| 8..n | **Fixes** | Old behaviour → new behaviour → consequence → tie-back | Solution |
| last | **Result** | What changed for the client | Outcome |

### 3.2 Symptom versus diagnosis

The separation is the type's signature move. Mechanics, **OBSERVED [both]**:

1. **The complaint is quoted, not paraphrased.** Left in the client's register, including the parts
   that are wrong. Paraphrasing it into the designer's vocabulary destroys the gap the section
   exists to open.
2. **The correction names the category, not the person.** The move is *the diagnosis was X; what it
   was pointing at was Y* — where X is the client's frame (aesthetic, visual quality) and Y is the
   real one (structural). Specimen, not template: a two-sentence turn from "the diagnosis was
   aesthetic" to "what it pointed at was structural."
3. **The new frame is immediately cashed out in specifics.** Not "structural problems" but named
   observations: metrics at identical weight with none primary; tables built from record metadata
   with no status or outcome in them; empty states written as bare text. The specificity is what
   makes the reframe credible rather than rhetorical.
4. **The client is never made to look foolish.** The complaint is treated as an accurate report of
   an experience and an inaccurate diagnosis of a cause. That framing is what makes the designer
   look useful instead of superior. **INFERRED** — the reference sustains it, and the inverse is a
   known failure mode of the genre.

### 3.3 Shown evidence rather than asserted evidence

**OBSERVED [both].** The reference's strongest Problem move is an exhibit: four of the product's
main sections each carried a standing explainer, and the four are displayed as a set of section
name and explainer text, side by side.

**INFERRED rule.** When the evidence is a *repetition*, show the repetition as a set. A sentence
listing four instances asks the reader to accept a pattern; four instances shown together let the
reader see it in one glance, which is the argument. The rendering does not need to be a grid — it
needs to make the repetition perceptible at once.

This is the only place in the type where content is rendered as a structured exhibit rather than
prose, and it earns it because the pattern *is* the finding.

### 3.4 Interpretation and stakes

**Interpretation (OBSERVED [both]).** One sentence converts the exhibit into a principle. Specimen,
not template: a product that needs a standing explanation on most of its main pages is describing
in text what its structure fails to convey. The pattern is *[observed repetition] is evidence of
[structural failure]* — stated once, without hedging, and not repeated later.

**Stakes (OBSERVED [both]; INFERRED as a rule).** The section closes by translating the principle
into the client's economics, not the user's feelings. The reference's move, in abstract: an
unreachable capability wastes what was spent building it *and* corrupts the signal the client uses
to decide what to build next — so the damage compounds into the roadmap rather than stopping at the
interface. Specimen, not template: a two-clause sentence pairing sunk build cost with a
misread demand signal.

Rule: **stakes must be expressed in something the client already spends or risks** — build cost,
roadmap direction, support load, staff time, revenue. A stakes paragraph that only says users were
frustrated has not left the symptom.

### 3.5 Justifying an exception

**OBSERVED [both].** When a decision breaks the system's own rule, the argument runs: state the
rule → state the deviation → state what following the rule would have cost. The cost is concrete
and irreversible-sounding, not a preference.

**INFERRED.** This is the general form of design justification in the type: a reason that could
have gone the other way. A justification nobody would disagree with is filler. See §5.

### 3.6 Momentum

**INFERRED [both].** Sections end on a sentence that makes the next section necessary: Problem ends
on stakes, which demand a response; Approach ends on the shape of the work, which demands the work
itself; each fix ends on a consequence, which is what the next fix is measured against. No section
ends on a summary of itself.

---

## 4. Content requirements, section by section

Each section below lists: **required**, **optional**, **useful evidence**, **specificity**, and
**never invent**. The never-invent lists are the operative part — they are where a mandatory
section meets thin material, which is where generated case studies fail.

### 4.1 Overview

**Required (OBSERVED [both]):**
- What the product is, in one sentence a stranger can hold.
- Who uses it, named by their job rather than as "users".
- What the engagement covered — which surfaces, which products.
- The designer's role.

**Optional:** the client's positioning or market; a clearance note where the client's name is
usable publicly; the collaboration shape; whether a second product (an app, an admin tool) was in
scope.

**Useful evidence:** the client's own description of themselves; the engagement's scope as agreed.

**Specificity:** name the user population concretely (campaign staff, warehouse supervisors, clinic
schedulers). "Users" in Overview is a signal the interview did not capture who they are.

**Never invent:** company descriptions, market size or positioning claims, user counts, funding,
the client's business model, or a scope broader than what was worked on.

**Anti-pattern (prior art, confirmed here):** an Overview that restates the title and subtitle in
longer words. If it adds no context a reader did not already have from the hero, it has failed and
should be rewritten, not padded.

### 4.2 Problem

**Required:**
- The complaint, attributed to its source **(OBSERVED [both])**.
- The diagnosis — what the complaint was actually pointing at.
- At least one piece of shown or named evidence from the existing product.
- The stakes, in the client's economics.

**Optional:**
- A provenance note stating where the diagnosis came from **(OBSERVED [repo]; divergence 4 — repo
  wins)**. Specimen, not template: a line stating the finding came from auditing the product
  against the reported symptoms, and not from research, analytics or testing. This is method
  disclosure. It costs nothing in confidence and buys the whole page its credibility.
- A named pattern, where the designer actually named one.
- **Branch B only:** the measured baseline (see §7.3), which becomes required in that branch.

**Useful evidence:** artifacts of the old product (screens, tables, empty states, modals); repeated
UI patterns; the brief itself; anything the client wrote down while complaining.

**Specificity:** name actual screens, columns, controls and their labels. The reference's evidence
is credible because it says which columns a table was built from, not that "tables were poor".

**Never invent:** research that was not run, analytics that were not read, usability testing that
did not happen, user quotes, drop-off or abandonment figures, the client's internal reasoning, or
a cause the designer did not actually identify. Where the designer's diagnosis is genuinely a
proposal rather than a finding, say so in the provenance line — do not upgrade it.

### 4.3 Approach

**Required:**
- The structural shape of the work: what ran in parallel, what depended on what, what was a peer
  set with exceptions.
- The diagram, **or** its deliberate omission under §9.5.

**Optional (each conditional, see §10.3):**
- **Decision ownership.** **OBSERVED [both]** — the reference opens Approach by stating that the
  client owned the product decisions and the design work was to decide what form those decisions
  took. This is one of the strongest lines in the reference *and* one of the most dangerous to
  generalise: it is only available because a PM and a client held those decisions. See §10.3(a).
  **Conditional (§12a):** include only where decision authority was genuinely split and the split
  shaped the design work. Otherwise state the real constraint on authority, or omit the move. Never
  invent a PM, and never credit one.
- Constraints that shaped the work.
- Duration.
- A second product or surface carried in the same engagement.

**Useful evidence:** the work breakdown itself — which areas were touched, which were new, which
followed an existing convention.

**Specificity:** name the tracks and what distinguishes them. The reference distinguishes its two
tracks by *kind of difficulty* — one carried the larger volume, the other carried the harder
decisions because there was no precedent to defer to. That distinction is reusable; the count of
two is not.

**Never invent:** a named framework or methodology the designer did not use, a process they did not
run, phases, collaborators, or a decision-ownership split that did not exist. The prior framework
is explicit that a named model must never be manufactured when the user does not have one, and
that holds here.

### 4.4 Solution

**Required, per fix:**
- What the old version did, in behavioural terms.
- What the new version does.
- Why — a reason that could have gone the other way (§5.2).
- A tie-back to a specific pain point named in Problem **(OBSERVED [both]; divergence 5 — the
  requirement is the tie-back, the explicit tag is one implementation)**.

**Optional:** a quoted client request that prompted the fix; an exception argument; ordered
interaction beats; before/after pairs; motion or interactive assets.

**Useful evidence:** the old screens; the new screens; a recording where the point is a sequence or
a live state; the client's written request.

**Specificity:** name the controls. The reference is credible because it says what sat behind a
disclosure toggle, what the toggle was labelled, and what the new inline control offers — not that
"the builder was simplified".

**Never invent:** interactions not present in the assets, rationale the designer does not actually
hold, a pain point that Problem did not raise, claims about what users can now do that the work
does not support, or an exception argument for a deviation that was in fact an oversight.

**Ordering (UNKNOWN as a rule; OBSERVED as an instance).** The reference orders its fixes
system-wide first, then individual surfaces, then new capabilities — broad to specific, familiar
to novel. Plausible and readable, but a single sample cannot establish it as the ordering rule.
Recorded in §11.

### 4.5 Outcome

**This section is where defect 1 lives. Read §0.3 before writing it.**

**Required — Branch A (contribution evidence):**
- Restatement of the goal that was stated at the outset, so the result is measured against
  something the reader already saw.
- **What changed operationally** — what the client's team can now do, or no longer has to do.
- The client-reported response, attributed to the client, and clearly marked as *their* report.
  **Conditional (§12d):** where no client language exists at all, follow the substitution ladder —
  attributed non-quote confirmation, then observable adoption, then omission. A short Outcome is
  correct when the evidence is short.

**Required — Branch B (hard metrics):** the above, plus measure, delta, window, and the limit of
attribution (§7.3).

**Optional:** what the client intends to carry forward, marked as intent rather than result;
artifact-countable facts (§7.2).

**Forbidden:**
- **Deliverable narration.** A status line announcing handoff, "the design was delivered", "the
  work was handed over", or a completion badge. **OBSERVED-but-defect [deployed]** — this is the
  reference's own failure and must not be extracted as structure.
- Unattributed satisfaction ("the client was delighted").
- Self-critique of any kind (defect 2).
- Any effect claim the evidence cannot carry (§7.4).

**Specificity:** the operational change should be something a reader could verify by looking at the
product: surfaces that now share one system, explanatory banners that are gone because the
capability no longer needs explaining. That is a change in the artifact, and it is honest to state
without a metric.

**Never invent:** metrics, adoption, revenue, satisfaction scores, client quotes, or a result that
had not occurred by the time of writing.

### 4.6 Credits

**Required:** the client (or an anonymised stand-in), and the designer's role.

**Optional:** agency, collaborators and their roles, duration, status.

**Useful evidence:** nothing beyond what the user supplies. Credits is the one section with no
inference in it at all.

**Never invent:** collaborator names, titles, agency relationships, or a duration. A credits line
that has to be guessed at is a fabricated claim about real people.

---

## 5. Design reasoning

### 5.1 The justification unit

**OBSERVED [both], INFERRED as the unit.** Every fix is argued with the same four moves, regardless
of which block shape carries them:

1. **Name the thing.** The actual control, page, or pattern, by its label in the product.
2. **State what it did.** Behaviour, not appearance. What the user had to know, find, or open.
3. **State what it does now.** The new behaviour, at the same level of concreteness.
4. **State the consequence.** What is now true that was not before — phrased as a fact about what
   the user no longer has to do. Specimen, not template: a one-line closer stating that nobody has
   to discover a capability exists before they can use it.

Move 4 is what separates this from a changelog. A fix block without it has described an edit.

### 5.2 What counts as a reason

**INFERRED.** A reason is only a reason if it could have gone the other way. Three tests:

- **The disagreement test.** Could a competent designer have chosen differently and defended it? If
  no one would disagree, the sentence is filler.
- **The cost test.** For exceptions and trade-offs: what would the alternative have cost? The
  reference's strongest justification names the specific capability that following its own
  consistency rule would have destroyed. Specimen, not template: a single clause naming the one
  question the deviating screen answers and no other screen can.
- **The falsifiability test.** Is the reason tied to something about *this* product, or would it
  apply to any product? The latter is a platitude.

**Banned as reasons:** preference, trend, "best practice" with no consequence attached, consistency
for its own sake where consistency was not the goal, and "the client asked for it" used as the
whole justification — the client's request explains *why the work happened*, not *why the design
took this form*.

### 5.3 Traceability

**OBSERVED [both].** Every fix ties back to a pain point raised in Problem. Two implementations
exist and both are valid (divergence 5): an explicit tag line under each fix, or the tie-back
carried inside the prose.

**INFERRED, non-negotiable:** the tie-back is **per fix**, never once at the top of Solution. A
single "this addressed the problems above" covering four fixes is the failure this rule exists to
prevent. Its practical effect is a constraint on Problem: **every fix in Solution must have a
corresponding pain point in Problem**, which means Problem must be written knowing what Solution
will contain.

### 5.4 Explaining product and technical detail

**OBSERVED [both].** Detail is explained by naming the control, saying what it did, and saying what
the user had to know to use it. No jargon is defined in the abstract; it is defined by showing the
thing behaving.

Level: enough that a reader who has never seen the product can picture the control and the
interaction. Not enough to specify it. If a sentence would appear in a handoff document, it is too
deep.

**Prohibited:** process narration — exploring directions, iterating, aligning stakeholders,
ideating — unless the exploration itself changed the decision, in which case the *change* is the
content and the process is incidental.

---

## 6. Writing behaviour

### 6.1 Tone

**OBSERVED [both].** Flat and declarative. Assertions are made without hedging where evidence
supports them and omitted where it does not — the register never shifts into persuasion. No
enthusiasm, no scene-setting, no narrative suspense. The confidence comes from specificity, not
from adjectives.

### 6.2 Sentence style

**OBSERVED [both].**
- Short main clause carrying the claim, sometimes followed by a qualifying clause carrying the
  nuance.
- The em-dash does corrective work: it marks the turn from what was assumed to what is the case.
- Lists inside prose are concrete nouns, not abstractions.
- Paragraphs are one to four sentences. A fix block's prose rarely exceeds two paragraphs before a
  figure interrupts it.

### 6.3 Headings

**OBSERVED [both].** Sentence case. Noun phrases. Section headings are the six fixed labels
**[given]**. Fix block titles name the artifact worked on — the builder, the dashboard, the
picker — not the achievement and not the benefit. A fix titled with its outcome pre-empts the
argument the block exists to make.

No questions as headings. No marketing gerunds.

### 6.4 First person

**OBSERVED [both], INFERRED as a rule.** The default subject is the product or the work, not the
designer. First person appears for:
- decisions the designer personally made or declined to make;
- the limits of what the designer knows.

It does not appear for the client's decisions, for the team's work, or as a device to add warmth.
In the reference the designer is nearly invisible in Solution and named only where ownership is at
stake — which is what makes the ownership statement in Approach land.

**Solo engagements (§12a).** Where one person made every decision, first person expands to cover
what would otherwise be attributed to a team. The expansion is in attribution, not in prominence —
the default subject is still the product.

### 6.5 Client language

**OBSERVED [both].** Quoted verbatim, set apart, and clearly the client's. Never cleaned up, never
compressed into a claim the designer then relies on. Two placements appear: the brief, at the head
of Problem; and a specific request, at the head of the fix it prompted.

Both are **conditional on quotes existing** — see §12(d) for the substitutes when they do not.

### 6.6 Banned list

Assembled from the reference implementation's own rules plus what the deployed page violates.

| Banned | Why |
|---|---|
| Praise adjectives — seamless, intuitive, beautiful, delightful | Unfalsifiable; they are the register this genre must avoid |
| Sentimental closers — "I loved working on this" | Prior art marks this an anti-pattern; it replaces evidence with feeling |
| Meta strings joined by middle dots | **[repo]** banned list; the deployed page violates it (divergence 8) |
| Tracked-out uppercase eyebrows | **[repo]** banned list — wrong register for a work record |
| "Screenshot of X" alt text | **[repo]** — alt describes the screen's content, not the file's nature |
| Process verbs with no consequence | §5.4 |
| "Users" as a mass noun when the role is known | §4.1 |
| "We redesigned X to be more Y" | Restates the brief as if it were a finding |
| A status badge announcing completion | Defect 1 |

---

## 7. Evidence and honesty — two primary branches

**Evidence type is a primary branch, not a fallback.** It is decided once, early, and it changes
the shape of two sections. The reference represents one branch only.

### 7.1 The gate

**INFERRED, carried forward from prior art.** A single question, asked early in the interview and
answered from what the user can actually produce rather than from what they would prefer:

> Does this project have hard business or behavioural numbers attached to it — conversion, revenue,
> task completion time, support volume, adoption — or is the impact a contribution: an operational
> change, a way of deciding, a reusable system?

The answer is determined by evidence the interview can extract, not by user preference. A user who
claims numbers but cannot name the measure, the baseline, the window and the source has **Branch
A**, and should be routed there without argument.

### 7.2 Branch A — contribution evidence (OBSERVED; what the reference is)

**Problem shape:** symptom, diagnosis, shown evidence, stakes. The stakes are argued from
*mechanism* rather than measurement: what an undiscovered capability costs, structurally, to a
business that paid to build it. No numbers appear, and none are implied.

**Outcome shape:** restated goal → operational change → client-reported response. Nothing else.

**What counts as evidence in this branch:**

| Admissible | Why |
|---|---|
| **Artifact-countable facts** | Things a reader could verify by looking at the work: how many surfaces now share one system, that four standing explainers are gone, that a capability that required opening a panel is now on screen. These are counts of the *artifact*, not claims about *effects* |
| **Operational change** | What the client's team can now do or no longer has to do |
| **Client-reported response**, attributed | What the client said, marked as their report, not converted into a result |
| **Stated intent**, marked as intent | What the client says they will carry forward — never phrased as something that has happened |

**The critical distinction (INFERRED):** *artifact-countable facts are not metrics.* Saying four
explainers were removed is a fact about the design. Saying their removal reduced confusion is a
claim about effect, and Branch A cannot make it. The reference holds this line, and holding it is
what makes a case study without numbers credible rather than evasive.

### 7.3 Branch B — hard metrics (INFERRED throughout; the reference does not demonstrate it)

Everything in this sub-section is INFERRED. The reference contains no hard metrics, so none of
these rules have been validated against a real instance.

**How Problem differs:**

| | Branch A | Branch B |
|---|---|---|
| Opening | Complaint, quoted | Complaint, quoted — **plus the measurement that corroborates or contradicts it** |
| Evidence | Artifacts of the old product | Artifacts **plus a baseline**: the measure, its value before the work, the window it was taken over, and its source (analytics, support tickets, a timed task, a sales figure) |
| Stakes | Argued from mechanism | Argued from the number: what the baseline costs the business per unit time |
| Risk | Vagueness | **A number with no provenance.** A baseline whose source cannot be named is worse than no baseline, because it invites a reader to check it |

**How Outcome differs:**

| | Branch A | Branch B |
|---|---|---|
| Core | Operational change | **Measure, delta, window** — the same measure as the baseline, over a stated period after the change |
| Support | Client-reported response | Client-reported response, still attributed |
| Required addition | — | **The limit of attribution**: what else changed in the same window, and what the number can and cannot be credited to. Stated once, plainly, as a fact about the measurement — not as an apology and not as self-critique |
| Failure mode | Deliverable narration (defect 1) | **Borrowed causality** — a number that moved during the engagement presented as a number the design moved |

**Baseline provenance is required, not optional (§12b).** Under Branch A a provenance note is a
credibility bonus (§4.2). Under Branch B a number whose source and window cannot be named is a
liability: it invites a reader to check something that cannot be checked.

**Artifact counts stay separate from measured outcomes (§12b).** Counting what the work contains
(§7.2) is admissible in either branch, but in Branch B a count sitting beside a measurement reads
as though it had also been measured. They are not stated in the same breath, and a count is never
formatted the way a metric is formatted.

**Placement under a fixed nav.** The prior framework put hard metrics early, ahead of process, on
the reasoning that a sceptical reader needs proof before investing attention. The six-section order
is fixed **[given]**, so that requirement is met *without moving a section*: the headline figure
goes in the subtitle and the meta strip, and the baseline appears inside Problem where it also does
argumentative work. The Outcome section stays in position five in both branches.

**Mixed case (INFERRED).** Some projects have one weak or partial number. Treat these as Branch A
with a single stated figure carrying its source inline — never as a headline, never in the meta
strip. One unreliable number promoted to hero position discredits everything around it.

### 7.4 Honesty rules shared by both branches

1. **No metric without a baseline.** A percentage improvement with nothing to improve *from* is not
   evidence.
2. **No causal claim the evidence cannot carry.** The design changed; what users then did is a
   separate question with a separate burden of proof.
3. **Client feedback is quoted or attributed, never rendered as a result.** "The client confirmed
   X" is admissible. "X was achieved" on the strength of the same sentence is not.
4. **Missing evidence is handled by omission, not by hedging.** A shorter Outcome is stronger than
   a padded one. This is also how the Reflection exclusion (defect 2) is honoured without
   dishonesty: the page does not claim what it cannot support, and it does not narrate its own
   shortfall either. **It simply does not say it.**
5. **Intent is marked as intent.** What the client expects to do next is written as expectation.
6. **Unverified passages are flagged, not resolved.** **OBSERVED [repo]:** the reference
   implementation marks passages drafted from artifacts rather than from the designer's own
   account, so they can be corrected before publication rather than silently shipped. **INFERRED
   rule:** where the generator has reasoned its way to a rationale the user never stated, it must
   surface that passage for confirmation instead of asserting it.

### 7.5 Failure modes to detect

| Failure | What it looks like |
|---|---|
| **Metric laundering** | Counting deliverables as results: screens designed, components built, surfaces covered, presented as impact |
| **Borrowed causality** | A business number that moved during the engagement attributed to the design |
| **Anonymous praise** | Positive client sentiment with no speaker |
| **Deliverable narration** | Defect 1 — the Outcome describing what was shipped |
| **Hedge padding** | Paragraphs of qualification standing in for evidence — the thing rule 4 above forbids |

---

## 8. Visual and content relationship

### 8.1 Slots follow assets

**[given].** There is no fixed number of visual slots. The narrative does not have image-shaped
holes in it that must be filled; assets attach to the arguments they support, and an argument with
no asset is written without one.

**OBSERVED [repo], useful mechanism:** the implementation declares each slot with an id, an aspect
ratio, and a description of what belongs there, and renders a labelled placeholder until a real
file exists. The relevant finding for the spec is not the mechanism but its consequence — **the
page's rhythm is designed before the images arrive**, so a missing asset degrades a figure rather
than collapsing a section.

### 8.2 The caption rule

**[given].** A caption points at a design decision. It answers *which decision does this show* and
*what should someone notice here*. It never narrates what is visually present.

**Divergence 1 — the reference contradicts itself here, and the repo wins.**

| Failing captions **OBSERVED-but-defect [deployed]** | Why they fail |
|---|---|
| Position labels ("old design" / "new design") | Tells the reader what they can already see |
| Artifact names repeated from the heading | Adds nothing the block has not said |
| Section names as captions | Pure labelling |

Satisfying captions **OBSERVED [repo]** — specimens, not templates: a caption stating that branching
is now a visible property of every answer; a caption stating that browse chrome was removed because
the surface is a place to make something rather than find something; a caption stating that a
filter space was made browsable rather than recalled. Each names a decision and tells the reader
what to notice.

**Three tests for a caption:**
1. Does it name a decision, or a thing?
2. Could it sit unchanged under a different screenshot? (If yes, it is a label.)
3. Does it tell the reader what to look for, or what they are looking at?

### 8.3 Caption and alt text are different jobs

**OBSERVED [repo]; INFERRED as a rule.** The implementation keeps them separate and the separation
should be carried into the spec:

- **Caption** — the decision. Visible. Argumentative.
- **Alt** — what is on the screen, for a reader who cannot see it. Descriptive, specific, and never
  "screenshot of X".

Collapsing them loses one job or the other. The deployed page's label-captions are a symptom of
exactly that collapse: description migrated into the caption slot and the decision fell out.

### 8.4 Placement

**OBSERVED [both].** Figures sit inline, immediately after the sentence that makes them necessary —
not batched at the end of a block and not gathered into a gallery. In the prose-led shape this
produces an alternation: old behaviour described, old screen shown, new behaviour described, new
screen shown.

**Conditional (§12c).** The alternation assumes both states were captured. It is a rhythm, not a
requirement — with an after-only asset the block describes the old state in prose and shows the new
one once.

### 8.5 What each asset kind earns

| Kind | Earns its place when |
|---|---|
| **Single still** | One state carries the decision |
| **Before/after pair** | The decision is a change *and* both states exist. Conditional — see §10.3(d). **After only:** carry the old state in prose and let the caption name what changed, since the reader cannot see the contrast (§12c) |
| **Video / recording** | The point is a sequence or a live state that no still can hold |
| **Interactive embed** | The reader benefits from triggering the behaviour themselves; replaces both the still and the recording of the same interaction rather than adding to them **(OBSERVED [repo])** |

### 8.6 Omission

**INFERRED, consistent with §8.2.** An asset with no decision to point at is dropped, not captioned
generically. The generic caption is the tell of an image included because it was available. A fix
block with one good image and one decorative one is stronger with one image.

### 8.7 Accessibility

**OBSERVED-but-defect [deployed]:** the Approach diagram ships with empty alt text, so the section's
structural argument is unavailable to a screen reader. Any generated diagram needs a text
equivalent stating the same relationship the graphic encodes (§9.7).

---

## 9. Structural diagram

**Everything in part 9 is INFERRED.** This is a product requirement, not an extraction. The
reference demonstrates a single form and does not validate any of the rules below.

### 9.1 What the diagram is for

The Approach section carries a generated diagram whose job is to make **the shape of the work**
scannable without reading prose. It is not decoration, not a summary of the page, and not a
picture of the product. It answers one question: *how was this work structured?*

### 9.2 The decision rule

**Identify the structural relationship first. Select a form second. Never the reverse.**

1. Determine the relationship the work actually has (from the interview — §9.6).
2. Check that the relationship carries a distinction worth seeing.
3. Select the form that represents *that* relationship.
4. If no relationship survives step 2, generate nothing (§9.5).

Selecting a form first — reaching for a ring, a grid, a timeline because it looks like a diagram —
produces a graphic that misrepresents the work, which is how the reference's own diagram failed.

### 9.3 Vocabulary of forms

Small on purpose. Each form exists to carry one relationship, and each has a condition.

| Relationship | Form | Applies when | Must be encoded visually |
|---|---|---|---|
| **Parallel tracks** | Two or more lanes running side by side | Distinct bodies of work ran at the same time and differed in kind | Which track carried more volume and which carried more difficulty — as weight, size, or density, not as a label |
| **Sequence with dependency** | Directed chain | Each stage could not start until the one before it produced something | Direction, and where the dependency is hard versus loose |
| **One-to-many branching** | Root with branches | One decision or system propagated into many applications | The root's singularity, and that the branches are instances of it rather than peers of it |
| **Peer set with exceptions** | Cluster or grid, exceptions marked | Many comparable items where a few behave differently | **Which items are the exceptions** — by fill, outline, or position. This is the whole point of the form |
| **Before/after system** | The same item set in two states | The work changed the relationships between existing parts without adding parts | The difference between the states — usually the connections, since the nodes are constant |
| **Scope boundary** | Nested containment | What was inside the engagement versus adjacent to it | The boundary itself, and what sits on each side |

No other forms. A relationship that fits none of these is a candidate for omission, not for
inventing a seventh form.

### 9.4 Self-containment

**The diagram must carry its own point.** If the reader needs the caption to understand what they
are looking at, the diagram has failed.

Distinctions that matter — which items are exceptions, which track was harder, which direction the
dependency runs — are encoded **visually**. They are never written underneath.

**Test:** cover the caption. If the point disappears, the diagram is a decorative graphic with an
explanation attached, and must be redone or omitted.

The reference fails this test (§9.8). The reference implementation passes it, which is evidence the
rule is achievable — not evidence for its form.

### 9.5 Omission

**When the work has no structural relationship worth showing, generate no diagram.**

The omission rule fires when:
- the work was linear and solo — one person, one track, one thing after another;
- there is a single undifferentiated body of work;
- the only "relationship" available is a list of what was done;
- the interview did not return a relationship (§9.6) — **the generator does not guess one**;
- the distinction that would make the form meaningful does not exist in the material.

An empty decorative graphic is worse than no graphic. It reads as machine-generated filler, and in
a genre whose entire job is demonstrating judgment, filler is expensive.

### 9.6 Input dependency — what the interview must return

**This is a downstream dependency on the interview step. None of it is derivable from submitted
assets, filenames, or the prose the generator has already written.** The decision rule in §9.2
cannot run until the interview returns the following, in these forms:

| Input | Form required | Why it cannot be inferred |
|---|---|---|
| **The work items** | A list of 2–10 labelled items, in the user's own words | Assets show screens, not work structure. Three files may be one item or three |
| **The relationship between them** | One named relation from §9.3's vocabulary, chosen by the user from plain-language descriptions — not free text the generator then classifies | A list of items has no inherent relationship. Guessing one invents a claim about how the work was organised |
| **Exceptions** | Per-item flag, **plus what each exception is an exception to** | "This one was different" is meaningless without the rule it broke. The rule is what the diagram encodes |
| **Ordering or dependency** | Explicit yes/no, and if yes, which item depends on which | Sequence in a list is not sequence in the work |
| **Difficulty or weight** | Which item or track carried the harder decisions, and why | This is the distinction most forms must encode visually, and it exists only in the user's head |
| **Labels** | The items' real names, from the product's own vocabulary or the client's | Invented category names are the fastest way to make a diagram look generated |

**Interview question shapes (INFERRED):** ask whether the work ran as one thing after another or
several things at once; ask which parts were unlike the others and what made them unlike; ask which
part was hardest to decide and why. Ask for the relationship as a choice among described options,
not as an open question — an open answer has to be classified, and classification is where
invention enters.

**Fallback:** if any of the first three rows is missing, the omission rule fires. A partially
specified relationship is not drawn "as best we can".

### 9.7 Density and accessibility

**Density.** The diagram must be more scannable than the paragraph it replaces. If it occupies more
vertical space than the prose while carrying less information, it is not earning its place. Test:
compare it against the paragraph a reader would otherwise read. Fewer labels than the paragraph has
nouns, and less height than the paragraph has lines.

**Accessibility.** A text equivalent must state the same relationship the graphic encodes — not a
list of the labels. The deployed reference ships an empty alt attribute, which removes the
structural argument entirely for screen reader users (§8.7).

### 9.8 The reference's diagram — one instance, explicitly not the template

The reference arranges eight labels evenly around a ring.

| Problem | Detail |
|---|---|
| **The form asserts a relationship the content does not have** | A ring reads as a cycle: A leads to B leads to C and back. The eight items are a peer set. Nothing flows, nothing returns, and no order exists between them |
| **The key distinction is carried by the caption, not the diagram** | The point — that most areas followed existing patterns while a few needed new ones — is written underneath. On the graphic, all eight items are identical. Cover the caption and the diagram says only "there were eight of these" |
| **The prose's actual structure is absent** | The section argues two parallel tracks that differed in kind. The diagram shows neither the tracks nor the difference |
| **No text equivalent** | §9.7 |

**The better instance, for contrast only.** The reference implementation's version of the same
diagram marks the exceptional nodes visually and switches between an unconnected state and a
connected one, so the system's arrival is the visible change and the exceptions are visible without
reading. It still uses a ring, so it still asserts a cycle — but it satisfies self-containment.

**Do not reproduce the ring.** It is one instance, chosen for one project, and its selection
appears to have been form-first. Both builds are evidence about the rules in §9.2–9.5, not
examples to copy.

---

## 10. Generalization

### 10.1 Reusable rules — survive any project of this type

- The six-section order and the role of each section **[given]**.
- The narrative engine: complaint → reframe → exhibit → interpretation → stakes → shape → fixes →
  result (§3.1).
- Symptom and diagnosis are separated, and the complaint is never paraphrased into the designer's
  frame (§3.2).
- Evidence is shown rather than asserted, and a repetition is displayed as a repetition (§3.3).
- Stakes are stated in the client's economics (§3.4).
- The four-move justification unit, and the requirement that a reason could have gone the other
  way (§5.1–5.2).
- Per-fix tie-back to a pain point named in Problem (§5.3).
- Fix-block shape is selected per fix from its own material (§2.5).
- Captions point at decisions; alt text describes (§8.2–8.3).
- Figures sit where the argument needs them (§8.4).
- The honesty rules and the artifact-count/measured-outcome distinction (§7.2, §7.4).
- Outcome describes what changed for the client, never the deliverable (§4.5).
- No reflection or self-critique (§0.3).
- Diagram: relationship first, self-contained, omitted when there is nothing structural to show
  (§9.2–9.5).
- The banned list (§6.6).

### 10.2 Project-specific content — never carried across

Everything factual in the reference: the client and agency names, the political-campaign domain and
its vocabulary, the count of surfaces, the number of standing explainers, the two-track split, the
number of new capabilities, the specific controls named, every quoted sentence, the engagement
length, the roles credited, and every caption. All of it is evidence *about* the rules and none of
it is content to reuse. If a phrase from the reference appears in a generated case study for a
different project, the generator has failed.

### 10.3 Observed once — must not become hard requirements

Each of these is true of this one project and would force invention elsewhere. All are
**conditional**.

| Element | In the reference | Why it is conditional | When absent |
|---|---|---|---|
| **(a) Decision-ownership split / collaborating PM** | Approach opens by stating the client owned the product decisions and the designer decided their form | Only available because a client and a PM held those decisions. A solo engagement with direct client contact has no such split, and manufacturing one invents a working relationship | Omit the ownership statement entirely, or state the real constraint on authority. Never invent a PM, and never credit one |
| **(b) A pattern found across the product** | Four main sections each carrying a standing explainer | An exceptionally clean exhibit. Most products do not hand the designer a repeated flaw across four named surfaces | Problem uses whatever evidence exists — one screen, one table, one flow. The requirement is *shown* evidence, not a *pattern* |
| **(c) Engagement duration** | Stated in the meta strip and again in the closing | Only meaningful where the duration is a real fact the user can state, and only interesting where it is short relative to the scope | Drop the field. A guessed duration is a fabricated claim |
| **(d) Before/after screen pairs** | Multiple paired old/new figures | Depends entirely on the old product having been captured before it was replaced. Frequently it was not | Carry the old state in prose, and make the lone new image's caption name what changed (§12c) |
| **(e) Eight surfaces / a large peer set** | The consistency track covered eight areas | Scale is a property of this engagement. A three-surface fix has no peer set worth diagramming | Diagram omission rule (§9.5) |
| **(f) Agency-in-the-middle credit chain** | Client, agency, designer, PM | Many projects are direct, in-house, or freelance | Credits shrinks. It does not get padded |
| **(g) Client name cleared for public use** | Stated explicitly | Clearance is a fact about permission, not a section | If not cleared, anonymise consistently and say so once. Never imply clearance |
| **(h) Video and interactive prototype assets** | Three recordings and one interactive embed | Asset-dependent **[given]** | Ordered prose beats replace a recording of a sequence |
| **(i) Numbered sections / margin indices** | Sections numbered 01–06 | House formatting | Cosmetic. Carries no meaning |
| **(j) Publication date and read time** | Printed under the title | Divergence 8; the deployed treatment also violates the project's own banned list | Omit |
| **(k) A quoted client brief, and a quoted client request** | One at the head of Problem, one opening a fix | Depends on the client having written something quotable, and on the user still having it | Substitution ladder — §12(d) |
| **(l) A second product in scope** | A volunteer field app alongside the web product | Scope accident | Nothing to say |
| **(m) "Handoff complete" status** | Meta strip and Outcome | **Defect 1.** Not conditional — prohibited | — |

---

## 11. Open questions (UNKNOWN)

A single sample cannot settle these. They are flagged so the specification either decides them
deliberately or leaves them to the user.

1. **How many fix blocks is right.** The reference runs four to six depending on the build. Whether
   there is a floor (below which the page is an image gallery) or a ceiling (above which it is a
   changelog) is not determinable here.
2. **Fix ordering.** Broad-to-specific, familiar-to-novel is what the reference does (§4.4). Whether
   it is *the* rule, or one readable choice among several, is unknown.
3. **Whether a hero image is required.** Present in both builds, but both had assets to spare.
4. **Target length.** The two builds disagree on their own estimate of reading time. No evidence for
   a target.
5. **Whether Overview may carry outcome claims.** Both builds keep Overview purely orienting. Under
   Branch B there is an argument for a headline figure appearing earlier (§7.3); untested.
6. **How Branch B actually reads.** All of §7.3 is inferred. Until a metrics project runs through
   this type, the interaction between a fixed section order and an early-proof requirement is
   theoretical.
7. **Whether the six sections are sufficient for larger engagements**, or whether a long Solution
   needs internal navigation that the fixed rail deliberately excludes (§2.4).
8. **Anonymisation behaviour.** How the type reads when the client, the product, and the screens all
   have to be obscured is untested.

---

## 12. Stress-case record

**Everything in this part is INFERRED.** These are four constructed cases, not observed projects;
the reference validates none of them. They exist to find the rules that only hold because of this
one project's circumstances.

The rule set above was walked end to end against four separate cases — not one composite — and the
rules that broke, forced an empty section, or pushed toward invention were rewritten as conditional.
This section records what changed.

### (a) Solo designer, no PM, no collaborators

**Broke:** the Approach ownership statement (§4.3) has no analogue — there is no split to describe,
and the reference's strongest Approach line would have to be manufactured. Credits collapses to two
rows. The near-invisible first person of §6.4 becomes unnatural when one person made every
decision.

**Changed:**
- §4.3 ownership downgraded from "optional" to explicitly conditional, with its substitutes stated:
  either state the real constraint on authority, or omit. Never invent a PM, and never credit one.
- §4.6 and §10.3(f) reinforced: Credits shrinks rather than pads.
- §6.4 gains the solo case: first person expands to cover decisions that would otherwise be
  attributed to a team, but the default subject remains the product, not the designer.

### (b) Hard conversion metrics available

**Broke:** nothing structurally — the fixed order absorbs Branch B as designed (§7.3). Two rules
were under-specified. The hero rule in §2.2 was written only as a prohibition (no metric-style hero
without metrics) and said nothing about the case where the metrics exist. And §7.2's
artifact-countable facts, placed next to real measurements in an Outcome, would read as though they
had also been measured.

**Changed:**
- §2.2 hero rule restated in both directions: treatment matches branch, in either direction.
- §7.3 gains the requirement that a baseline's **source and window are required, not optional** —
  in Branch A provenance is a credibility bonus; in Branch B a number without provenance is a
  liability.
- §7.3 gains a separation rule: artifact counts and measured outcomes are not stated in the same
  breath, and a count is never formatted like a metric.

### (c) Only two screens submitted, no before/after pairs

**Broke:** the image-led fix shape (§2.5) depends on volume and is simply unavailable. The
alternating figure rhythm of §8.4 — describe old, show old, describe new, show new — assumes both
states exist. A lone "after" image inherits the caption problem: the reader cannot see what
changed, so a caption that names a decision has to also carry the contrast.

**Changed:**
- §2.5 selection step 5 strengthened: asset scarcity vetoes a shape. With one or two stills,
  system-level work is argued in prose with a single representative image, not as an image-led
  block.
- §8.4 alternation downgraded from pattern to conditional.
- §8.5 gains the after-only substitute: the old state is carried in prose, and the caption names
  what changed rather than relying on juxtaposition.
- §2.2 gains an asset-scarcity rule for the hero: a screen may not be spent on a hero if the block
  that needs it would then be left without one.

### (d) No client quote or feedback of any kind

The most destructive case. The reference opens Problem with a quoted brief, opens one fix with a
quoted client request, and closes Outcome on a client-reported response. **All three collapse.**

**Broke:** §3.1 link 1; the quote-led fix shape in §2.5; §4.5's required client-reported response;
§6.5 entirely.

**Changed — a substitution ladder, applied in order, with fabrication excluded at every rung:**

| Collapsed element | Substitute, in order of preference |
|---|---|
| **Quoted brief** (Problem) | 1. An attributed paraphrase, clearly marked as the client's report rather than the designer's words. 2. The designer's own account of the symptom as it was reported to them, carrying a provenance line. 3. The presenting symptom stated plainly as what the product's own behaviour suggested, with the reframe then working against that reading rather than against a client's words. **Never a reconstructed quote** — not even one the client "would have said" |
| **Quoted client request** (fix block) | The exception argument opens on the rule it breaks instead of on the request. The shape survives; only its opening move changes |
| **Client-reported response** (Outcome) | 1. An attributed non-quote confirmation — a report of what the client's team confirmed is not a quote and does not require one. 2. Observable adoption: what the client's team has since done with the work. 3. Nothing. Outcome then carries the restated goal and the operational change only, and is short |

**And the rule that makes the ladder safe:** a short Outcome is a correct Outcome when the evidence
is short (§7.4 rule 4). The failure mode this case invites is padding the gap with sentiment, which
is both a fabrication and a violation of the banned list.

**Secondary finding:** because three separate elements depend on the same input, the interview
should establish early whether any client language exists at all — the answer changes Problem's
opening, one fix block's shape, and Outcome's closing move simultaneously.

### Summary of what changed

Nine rules were downgraded to conditional or given substitutes: the ownership statement, the
Credits field set, first-person usage, the hero treatment (twice — branch-matching and asset
scarcity), the image-led fix shape, the alternating figure rhythm, before/after captioning, the
quoted brief, the quote-led fix shape, and the client-reported response. Two rules were tightened
rather than loosened: baseline provenance became required under Branch B, and artifact counts were
separated from measured outcomes.

No rule survived the four passes unchanged that had been derived from the presence of a
collaborator, a quote, or a surplus of assets — which is the expected result, and the reason the
conditional list in §10.3 is as long as it is.
