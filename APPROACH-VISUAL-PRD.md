# Check — Approach Visual System (Focused Fix)

Version 1.7 · Scope: the `focused fix` project category only.

Technical appendix to §9 of `prompts/focused-fix-output.md`, which holds the structural
decision — that the block exists, when it appears, and what happens when it does not. This
file holds encoding, tokens, coordinates and worked examples. Where the two disagree about
structure, §9 wins; where they disagree about pixels, this file does.

**Changed in 1.1**, both from decisions taken against the spec it appends to:
`set-exception` is drawn as a **grid, not a ring** (§5.1, §8.1), and the type face is
**Inter, not Helvetica Neue** (§4).

**Changed in 1.2**, all from building `order-overlay` as a second live template:
§2's "no new wizard fields" is **superseded** — step 4 gained a fork and two page
answers, which is §7's own stated remedy; §5.3's categories are **fixed as Added / Cut /
Kept** and its `finding` now **comes from a wizard field**; §6's selection **gates every
contract before choosing among the survivors** rather than gating only the winner; and
new open item 5 records that `order-overlay` **has no legal encoding**, which blocks its
renderer alongside item 3.

**Changed in 1.7**, on the owner's instruction and against a decision recorded the other way:
**every page now carries a visual**. §5.4 adds a floor form over the decisions themselves, last in
§6's order, and §9 is amended in the operative prompt to match — the writer still produces no
diagram and still writes Approach to stand alone, but the specification no longer claims the system
has no fallback. The argument against the guarantee is kept at §5.4 rather than removed.

**Changed in 1.6**, from building `sequence-collapse`: it is **no longer deferred** — it has
a contract, gates, a wizard branch and a renderer, so all three templates are live. §5.2's
columns are **responsive**, with 129 falling out of the 342 cap rather than being fixed, and
its connectors are **SVG**, the only part of the system drawn that way.

**Changed in 1.5**, from building `order-overlay`'s renderer: §5.3's encoding is
**rewritten against §9** — two fill states on present-against-absent, the category word in
a gutter beside its mark, and **no legend**. Rule 7's three-fill exemption is superseded.
Open item 5 is **closed**, and with it the last blocker on either renderer.

**Changed in 1.4**, from building `set-exception`'s renderer: the medium is **HTML and CSS
where the geometry is boxes in a grid**, and SVG is held for geometry that needs drawing;
the mark is **120 wide**, because the frame's own border is inside its width; and the label
limit is **a 96px box rather than a character count**, which nothing enforces any more.

**Changed in 1.3**, from measuring Inter in the running app: the frame is **568 wide with
a computed height**, not 509 × 421, and renders as **inline SVG** rather than a PNG export;
the mark label limit is **14 characters**, not 18, because four per row never had room for
18 under either face; mark height 24 and pitch 36 are **re-verified unchanged**. Open items
3 and 4 are **closed**.

---

## 1. What this system is for

Every Check output contains an Approach section. This system gives that
section one diagram that maps the user's **own product**, so a reader
scanning for three seconds learns something that is only true of this
project.

### The thing this exists to prevent

An earlier shipped version rendered Approach as an ordered decision list
and produced a near-identical diagram for two unrelated projects. Any
diagram that describes the designer's process — discovery, iteration,
handoff — fails the same way, because every designer's process is the
same. The approach is proved by showing what changed in the product; the
reader draws the conclusion about the designer themselves.

### Baseline

- The diagram is scanned, not read.
- All explanation lives in the caption, below the canvas.
- Every word on the canvas is a noun that exists in the user's product.
- One diagram per Approach section. Never two.
- ~~No diagram is better than a weak diagram.~~ **Reversed in 1.7, by the
  owner, knowing this line was the argument against it.** A floor form now
  catches whatever the three templates drop, so every page carries a visual.
  What that costs is written out at §5.4 and in the banner above
  `gateDecisionSet`. Approach still renders either way, and still reads the
  same either way: the writer is never told which happened.

---

## 2. Division of labour

The agent **never draws**. It extracts facts from the user's existing
wizard answers and fills a data contract. A deterministic renderer turns
that contract into SVG and rasterises it to PNG at 2x.

This is not a style preference. If the agent generates the visual
directly, it can silently depart from the design system on any single
run and there is no way to detect it.

~~**No new wizard fields.** The agent works from the fields that already
exist. Templates that cannot be filled from those fields simply do not
fire.~~

**Superseded.** This held for as long as one template was built. §7's own
remedy then came due: `order-overlay` could not be filled from any
existing field, so it never fired, and §7 says in terms that this is
evidence for adding a wizard field rather than for relaxing a gate. Step 4
now asks which shape the work had — a product with separate parts, or a
single page, or one flow — and each branch asks its own question: the page
branch wants the sections in order and what the designer noticed about where
they sat, the flow branch wants the steps start to finish and which are gone.
No gate was loosened.

What has NOT changed is the division of labour above: the agent still
never draws, still never writes either contract, and is still told nothing
about the diagram. Both contracts are derived in code from answers the
designer typed.

---

## 3. Why three geometries

Geometries are indexed by **shape of data**, not by rhetorical intent.
Intent ("transformation", "contrast", "relationship") can be read several
ways from the same project, which makes selection a matter of taste.
Shape of data cannot.

| id | Shape of data | Meaningful axis |
|---|---|---|
| `set-exception` | a set, some members marked | grouping in a grid |
| `sequence-collapse` | an ordered list, shortened | vertical length |
| `order-overlay` | an ordered list, categorised | vertical order |

Three covers roughly 85% of focused-fix projects. The remaining 15% used to
render as text, and §5.4's floor form now catches them instead — so the number
that matters is no longer coverage but **how often the floor is what fires**.
It is the one form that cannot distinguish two unrelated projects, so every
point of real coverage the three templates win is a point it does not have to
cover badly.

---

## 4. Shared visual grammar

Binds to the Check Figma library. Token names are authoritative; hex
values are shown for reference only.

### Frame
| Property | Value |
|---|---|
| Width | **568** — the read page's prose column, measured |
| Height | per template; it is content, not a fixed artboard |
| Background | `Background/Primary` |
| Border | 1px `Border/Default` (#ededed) |
| Radius | `Medium 2` (12) |
| Narrow | the column is **343** at 375px viewport; the geometry reflows, it does not scale |

> **Was 509 × 421 with a PNG @2x export, and both were wrong.** 509 was an
> artboard width that corresponds to nothing in the product — the column the
> diagram actually sits in measures **568** on the read page, and stays 568 at a
> 1600px viewport because it is capped. The fixed height went with it: the number
> of rows is data, so the height is computed and the frame has no business
> declaring one.
>
> The PNG export is dropped too. The diagram renders as **inline SVG**, which
> removes the rasterisation step entirely and buys three things a PNG cannot: it
> stays sharp at any density, it inherits the page's own theme tokens instead of
> baking one in, and its `text_equivalent` can live in `<title>`/`<desc>` where a
> screen reader reaches it. Scaling a 12px-text PNG down to the 343 column would
> render text at ~7px; reflowing instead keeps it at 12.

### Mark (shared by all three)
| Property | Value |
|---|---|
| Height | 24 |
| Padding | 12 horizontal, 4 vertical |
| Radius | `Small` (4) |
| Type | `Body small` — Inter Regular 12 / 1.2, tracking −0.12 |

Height 24 **re-verified against Inter** and unchanged: 12px at 1.2 leading is
14.4, plus 4 vertical padding each side, is 22.4 — inside 24 with room. Vertical
pitch 36 is therefore unchanged too, leaving the same 12px gap between rows.

| State | Fill | Border | Text |
|---|---|---|---|
| default | `Background/Primary` | `Border/Default` | `Text/Primary` |
| exception | `Brand/Primary` (#171717) | none | `Background/Primary` |
| receded | `Background/Primary` | `Border/Default` | `Text/Secondary` |
| emphasised | `Background/Primary` | `Border/Strong` | `Text/Primary` |

`receded` marks something that is gone. It must always be lighter than
the marks around it — a solid grey fill gives absence more visual mass
than presence and inverts the reading.

### Caption
Width 340, centred, top 357, `Text/Secondary`, `Body small`, leading 1.3.
Two lines maximum. The only sentence in the frame.

### Rules that hold across all three
1. One layer of ink. Exactly one element class is at full weight.
2. Canvas text is product nouns only — no counts, no headings beyond the
   two fixed axis labels in B, no explanatory phrases.
3. Separation by distance, not by boxes or dividers.
4. Exactly one meaningful axis per geometry.
5. Never promise a relationship the project does not have.
6. Mark size is uniform. Nothing scales by importance or effort.
7. ~~Only `order-overlay` may use more than one fill, capped at three.~~
   **Superseded in 1.5.** No template uses three. C uses two — present
   against absent — which §9.3 gate 4 allows for every template, so this is
   not an exemption any more and C does not need one.

### Measured Inter metrics

Measured in the running app at `/studio/read/...`, against the live font stack
rather than a redrawn Figma component, so these are what actually renders.
Reproduce by measuring a `<span>` at `400 12px/1.2 Inter` with
`letter-spacing: -0.12px` over the label corpus below.

| Quantity | Value |
|---|---|
| Mean character advance | **5.93px** |
| 95th-percentile character advance | **6.64px** — size against this, not the mean |
| Inter against Helvetica Neue | **+5.42%** over 15 real product labels |

Sized on the p95 figure, because a limit that holds for average text and fails
for "Comparison table" is not a limit.

### Text limits
| Slot | Max | Overflow |
|---|---|---|
| Mark label (A) | **a 96px box**, about 14 chars | renderer trims to the box |
| Caption | 120 chars | reject, regenerate shorter |
| Legend entry (C) | 10 chars | truncate |
| `finding` (C) | 120 chars | it becomes the caption, so it carries the caption's limit |

> **The label limit belongs to a geometry, not to the system, and nothing
> enforces a character count.** 14 is what four marks per row leaves room for,
> and it is the figure to design against — what actually trims is CSS, to the
> 96px the mark holds. C draws one mark per row against roughly four times that
> budget, so trimming a page section to 14 would cut a label with room to spare.
>
> The first real render settled it: "Medication chart" is 16 characters and fits
> the 96px box with room, so a 14-character rule would have cut a label that had
> none of the problem it was guarding against. The helper that applied one has
> been removed.
>
> Labels are therefore carried **whole** into the contract and trimmed only when
> drawn, which also fixes an accessibility defect: `text_equivalent` used to carry
> the truncated string, so a screen reader was handed "Campaign performa…" — the
> sighted reader's layout constraint leaking into the one channel that has no
> layout.

---

## 5. Templates

### 5.1 `set-exception`

**Unit** area, screen, or component
**Proves** how wide the work reached, and where the existing system
failed to absorb it

**Fires when** the user names several discrete parts of a product they
worked across, and separates some of those parts from the rest — harder,
rebuilt, unlike the others, no precedent existed.

**Typical projects** multi-area redesign · audit-then-fix · consistency
pass · design-system alignment

**Refuses when**
- the parts are sequential steps of one flow → `sequence-collapse`
- the parts are sections of one page in fixed order → `order-overlay`
- no part is separated from the others — uniform data is not a finding
- the labels are process phases rather than product nouns

**Data contract**
```
items[]      label   string   as the user named it
             status  enum     reused | new
total        int
new_count    int
reason       string  optional
```

**Extraction** Labels keep the user's wording. `status: new` only where
the user explicitly set that part apart. `reason` only if stated; never
inferred. If the user named parts but drew no distinction, the contract
is incomplete — stop.

**Gates**
```
4 <= total <= 8
1 <= new_count <= total / 2
every label is a product noun
```
The upper bound on `new_count` is deliberate: when half the set is
exceptional, the set has no rule to break and the diagram claims nothing.

**Encoding**
- A grid, four marks per row, centred, first row top 96, pitch 36 vertical
  and 12 horizontal. Mark width **120**, uniform: the 568 frame holds its own
  1px border inside that width, so the content box is 568 − 2 − 48 = 518;
  less three 12px gaps is 482, over four is 120.5. Text budget per mark is
  120 − 24 padding = **96px**, which is where the 14-character limit comes
  from (96 ÷ 6.64). At the 343 column it reflows to two per row, not four
  scaled down.

  Round down rather than to the exact fit. 121 against a notional 520 is
  arithmetically right and wrapped 3 + 1 the first time it rendered: an exact
  equality leaves no tolerance for the sub-pixel rounding underneath it.
- Marks are laid out in reading order — left to right, top to bottom — in
  the user's order.
- **Exception marks are placed contiguously.** Emit every `reused` item
  first, then every `new` item, so the exceptions form one unbroken run.
  Scattered exceptions have to be counted; an unbroken run is read as one
  mass.
- Exceptions use the `exception` state. Everything else is `default`.

> **Four per row and an 18-character label never co-existed.** This is
> arithmetic, and it predates the type face: four 18-character marks need
> 4 × (121.7 + 24) + 36 = 619px of row, against a 509 frame then and a 568
> column now. Under Helvetica Neue the real figure at four-wide was 13
> characters; under Inter it is 14 in the wider frame. So open item 4 was
> pointing at a real problem and naming the wrong cause — the limit was not
> too loose for real product labels, it was never reachable at this row
> count. **Four per row is what gives, last.** Eight items in two clean rows
> is the form's whole argument — a set seen at once, exceptions as one mass
> — and three per row turns eight into a ragged 3 + 3 + 2 that reads as a
> list. The label limit moved instead.

> **Why not a ring.** Version 1.0 specified one, and the reference this
> template was derived from draws one. A ring asserts that each item leads
> to the next and returns, which is a claim almost no project makes —
> `focused-fix-analysis.md` records the reference's ring as a defect for
> that reason, and §9.2 of the output specification excludes the form
> outright. The grid keeps everything the ring was doing: a set seen at
> once, with the exceptions as one mass.

**Caption**
```
with reason:    {total} areas, {total-new} followed existing patterns,
                {new} needed new ones — {reason}.
without reason: {total} areas, {total-new} followed existing patterns,
                {new} needed new ones from scratch.
```
Never add framing clauses the diagram does not show.

---

### 5.2 `sequence-collapse`

**Unit** step in one user-facing flow
**Proves** how much the user cut out of a path people actually walk

**Fires when** the user describes one continuous flow by its steps and
indicates the flow got shorter.

**Typical projects** checkout · onboarding · signup · booking ·
application form · approval path

**Refuses when**
- the parts are not sequential → `set-exception`
- the flow was reordered but not shortened
- the steps are phases of the designer's process

**Data contract**
```
before[]   label  string   step name, in flow order
           fate   enum     kept | removed
           note   string   optional, max 3 words, removed steps only
after[]    label  string   derived from before[] where fate = kept
reason     string optional
```

**Extraction** `fate: removed` only where the user said a step was
dropped or merged. A merged step counts as removed. `note` uses the
user's own word, shortened — never infer "merged" from the fact that a
step disappeared.

**Gates**
```
4 <= before.length <= 8
after.length >= 2
after.length <= before.length - 2
```
A single-step reduction does not read as a reduction.

**Encoding**
- Two columns, 129 wide, at centre − 110.5 and centre + 111.
- First row top 82. Pitch 36 in both columns, identical. This number is
  load-bearing: connectors land on mark centres and any drift is visible
  immediately.
- Axis labels `Before` and `After` at top 52, `Text/Secondary`. Fixed
  strings, never generated.
- Left column holds every step in original order. Kept steps use
  `default`; removed steps use `receded`.
- Right column holds surviving steps only, `emphasised`. It is the only
  full-weight element in the frame.
- Connectors: one per surviving step, from its left-column centre to its
  right-column centre, in the 84px channel. 1px, dotted, `Border/Strong`,
  round caps, behind the marks. No curves, no arrowheads, no endpoint dots.
- The space below the shorter right column stays empty. Never centre the
  columns against each other — the slant of the connectors is the
  compression.

> **The columns are responsive; 129 is what the cap produces, not a fixed
> width.** The strip is capped at 342 and the channel is 84, so at the 568
> column each side gets (342 − 84) ÷ 2 = **129**, which is the figure above
> exactly. At the 343 column they give way to 104.5 and the longer step names
> truncate. The x coordinates 212 and 296 are dropped: they described one
> frame width and there is now more than one.
>
> Each column has to be declared `minmax(0, 1fr)` rather than `1fr`. A bare
> `1fr` carries an automatic min-content floor, so a long step name pushes its
> column past its share and the pair overflows the frame — which is what
> happened at 343 before the floor was stated as 0.
>
> **The connectors are the one thing in this system drawn as SVG**, because a
> line between two points is what HTML cannot do. Everything else stays HTML,
> so labels still truncate to their measured box. The SVG stretches
> horizontally only — `preserveAspectRatio="none"` against a viewBox 100 units
> wide — so the channel can be any width the layout leaves it while the row
> centres stay in exact pixel step with the marks beside them. §5.2 calls the
> pitch load-bearing because "any drift is visible immediately", so both the
> marks and the connectors read their y from one function. Measured in the
> browser at both column widths: **drift 0px**.

**Caption**
```
{n} steps became {m} — {removed, listed} were removed entirely.
```
Pluralise correctly. With a reason: `… were removed because {reason}.`

---

### 5.4 `decision-set` — the floor form

**Unit** one decision the designer made
**Proves** nothing the prose does not already say. It exists to satisfy a
guarantee, not to carry a claim.

**Fires when** none of the three above did. Never otherwise: it is last in §6's
order, and a test pins that each of the three still wins when it fires.

**Data contract**
```
decisions[]  label  string  the decision, in the designer's own words
             kind   enum    change | new
new_count    number         how many built something that was not there
```
`kind` is `new` where the designer ticked "this didn't exist before" on that
decision, and `change` otherwise. Nothing else is read.

**Gates** 2 to 4 decisions, which `compileBlockers` already guarantees before a
page is written at all. It cannot fail on a page that exists.

**Encoding** A column, not a grid: these labels are the designer's own decision
sentences and a 120px grid mark would show four words of one. Two fills, with
the exceptions in `exception` and the word "New" beside them. No legend.

**Caption** With exceptions: `{n} decisions, {m} of them building something
that was not there before.` Without any: `{n} decisions, each a change to
something that already existed.` — a set with no exception has no rule to
break, so the caption says so rather than implying one.

> **This was deleted once, and is back on an explicit instruction.** A
> guaranteed visual existed for four days and was withdrawn because the floor
> form that met it drew a near-identical picture for two unrelated projects.
> Every project has two to four decisions and the same handful of fields about
> them, so anything derived from that set is the same shape every time and only
> the words inside change. That is what §9.1's "There is no fallback form" was
> protecting.
>
> It is reinstated anyway, by the owner, knowing the above. Two mitigations,
> which are the most the data allows. It **fires rarely now**: when the
> guarantee was first withdrawn one template existed, three do now, and this
> only catches a project whose chosen branch failed its gates. And it **claims
> only what is there**: the relationship is §9.2's peer set with exceptions
> over decisions rather than parts, which is a row of the vocabulary rather
> than a new form, and where no decision built something new it says so.
>
> What it still cannot do is differ between two projects that made the same
> number of decisions of the same kinds. Nothing in the intake would make it
> so, and inventing a difference is the one thing this system exists to
> prevent. Recorded, not designed around.

---

### 5.3 `order-overlay`

**Unit** section of one page
**Proves** that the order of the page was matched against the order of
questions in the reader's head

**Fires when** the user lists the sections of a single page in order and
sorts them into 2–3 named groups.

**Typical projects** landing page · pricing page · long-form product
page · homepage rewrite

**Refuses when**
- the parts are not fixed in one visible order → `set-exception`
- the parts are steps a user walks → `sequence-collapse`
- no grouping was drawn — an ordered list with no overlay is a table of
  contents
- the grouping is predictable from the labels alone (FAQ → questions),
  which means the overlay carries no judgement

**Data contract**
```
sections[]    label     string  in real page order
              category  string  optional, one of categories[]
categories[]  string    2 to 3, max 10 chars; FIXED, see below
finding       string    the pattern: a repeat or a gap
```

**The categories are fixed: Added, Cut, Kept.** This narrows "the user's
own words", which is what the row said until the template was built. Three
reasons, in order of weight. §8.3's own worked example already uses exactly
these three, so the document was specifying one thing and illustrating
another. A free-text field for them is a fourth answer on a step that now
has two, and the gate refuses 4 or more with no way to say so in the form.
And fixing them makes the per-section question a true exclusive choice —
one tap, one fate — which is the interaction the parts question on the
other side of the fork already uses.

`categories[]` is therefore DERIVED: it holds the fates a section actually
carries, in the order above. A page where nothing was cut has two
categories, not three with one empty — an empty one would promise a key
the strip never uses, which §8.3's wrong-render table forbids.

**`finding` comes from a wizard field and is never inferred.** It is
`page_pattern` — "What did you notice about where they sat?" — capped at
the input to the caption's 120 characters. There is no deriving it: a
sentence composed from the grouping would state the composition, which is
the example the caption rule below names as the bad one, and composing it
at all is the inference this whole document exists to prevent. A page with
no answer there gets no diagram.

**Extraction** Order is the page's real order, never a ranking. Assign a
category only where the user placed that section in a group. Never invent
a category to fill an empty section — empty is data.

Note the two text limits pull in opposite directions and both are
deliberate: a category over 10 characters TRUNCATES, and a `finding` over
120 is REJECTED, because §4 gives it the caption's limit. Nothing in this
system regenerates a sentence a designer typed, so rejecting means the
diagram is dropped — which is why the cap sits on the input instead.

**Gates**
```
5 <= sections.length <= 8
2 <= categories.length <= 3
at least one category repeats across 2+ sections, OR at least one
  section has no category
```

**Encoding**
- One column. The mark is 332 wide at the 568 frame and the strip plus its
  gutter is 400, centred — but 400 is a MAX, not a fixed width: at the 343
  column the mark gives way to 225. A fixed 332 ran off the left edge there,
  and did it silently, because content overflowing to the left of the
  viewport never produces a scrollbar to notice it by.
- The mark and the gutter are both constrained, so the strip's left and right
  edges run straight all the way down. Centring each row's pair instead lets
  every row shift by the width of its own category word, and a strip whose
  edges wander cannot be read for where anything falls — which is the only
  thing it is for.
- **Two fill states**: `default` where the section is still on the page,
  `receded` where it was cut. Nothing else carries a fill.
- **The category word sits in a gutter beside its mark**, at
  `Text/Secondary`, so one thing per row is at full ink (rule 1). A section
  the designer left unsorted has an empty gutter — that gap is data, and the
  extraction rule above forbids inventing a category to fill it.
- **No legend.**
- Never sort or group rows. Rearranging the order destroys the finding.

> **This replaces the encoding 1.1 specified, which could not legally be
> drawn.** That one wanted a legend, three slot fills and a keyed 11 x 11
> strip in place of direct labels. `prompts/focused-fix-output.md` forbids all
> three — §9.3 gate 1 ("There are no legends"), gate 3 ("Direct labelling over
> keyed fills"), gate 4 ("Two fill states maximum") — and §12 items 24 and 25
> repeat two of them as hard gates. This file's own header says §9 wins where
> the two disagree about structure, so §9 is what the renderer follows.
>
> Each replacement part is legal on §9's own terms. Two fills rather than
> three, on the one split gate 4 names as self-evident without being named —
> "present against absent" — and §4 already defines `receded` as marking
> something that is gone. The category word sits on the row it describes,
> which is gate 3's requirement and is what removes the need for the key gate
> 1 forbids.
>
> **The fill is not made redundant by the word.** The word says what one row
> is; the fill is what lets the eye see WHERE the absent rows fall without
> reading anything, and where they fall is the whole of what the caption
> claims. Drop the fill and this becomes the table of contents the refusals
> above warn about.
>
> One consequence, accepted: with two fills the strip reads for *cut against
> kept*, so a finding about where the ADDED sections fell is carried by the
> gutter rather than by the strip. The alternative was a third fill, which
> needs a legend, which is forbidden.

**Caption** States the pattern, never the composition.
```
good: Everything cut sat in the middle of the page, where readers were
      already deciding.
bad:  Eight sections across three categories.
```

---

## 6. Selection

The agent does not choose which diagram is nicest. It attempts to fill
all three contracts from the same answers and applies a fixed rule.

```
1  extract   pull facts from the wizard answers; every field must trace
             to something the user wrote
2  fill      attempt all three data contracts
3  gate      run EVERY filled contract's own gates
             a contract that fails any gate is out
4  select    exactly one survives   -> that one
             more than one survives -> B, then A, then C
             none survives          -> the floor form (§5.4)
5  render    renderer draws the contract; the medium follows the geometry
             (HTML/CSS for boxes in a grid, SVG where lines are drawn)
6  verify    swap test on the caption
             fails                 -> text only, discard the image
```

Priority order is fixed in `SKILL.md`, not decided per project, so two
projects with similar data always resolve the same way. There is no
"try another template" branch — that is taste re-entering through the
back door.

> **Steps 3 and 4 were the other way round in 1.1**, and the order was
> wrong. Selecting on completeness and gating only the winner costs real
> coverage: a project that names four product areas and marks none of them
> as having no precedent has exactly one COMPLETE contract, so A is
> selected, and only then does A's gate drop it — with the overlay the
> project could have had never attempted. Gating every candidate and then
> choosing among the survivors is the same fixed priority applied at the
> only point where it can be applied honestly. **The priority itself has
> not moved**, and this is still not a "try another template" branch:
> every contract is attempted every time, in one pass, with no branch and
> nothing decided per project.
>
> `lib/approach-diagram.ts` implements A then C, because B does not exist
> — not because the order changed.

### Swap test
Replace every label in the contract with labels from an unrelated
project. If the caption is still true, the diagram carries no finding.
Discard it.

A caption that restates how many items there are is describing the
picture, not naming a finding. Rewrite or discard.

### Fallback
The Approach section always renders. When no diagram is produced, it
renders as structured text with no placeholder, no empty frame, and no
apology. A missing diagram is invisible to the reader; a fabricated one
is not.

---

## 7. Expected distribution

`sequence-collapse` and `set-exception` will carry nearly all traffic.
`order-overlay` requires the user to have drawn a distinction between
sections, which the current wizard does not ask for, so it will fire
rarely.

Do not loosen C's gates to raise its fire rate. An overlay the agent
guessed is fabrication, which is the one thing this system exists to
prevent. If C never fires across real projects, that is evidence for
adding a wizard field — not for relaxing the gate.

---

## 8. Worked examples

These are the reference outputs. An agent filling a contract should be
able to predict the render exactly, with nothing left to judgement.

---

### 8.1 `set-exception`

**Contract**
```json
{
  "template": "set-exception",
  "items": [
    { "label": "Reports",    "status": "reused" },
    { "label": "Projects",   "status": "reused" },
    { "label": "Lists",      "status": "reused" },
    { "label": "Team",       "status": "reused" },
    { "label": "Settings",   "status": "reused" },
    { "label": "Canvassing", "status": "new" },
    { "label": "Messages",   "status": "new" },
    { "label": "Data",       "status": "new" }
  ],
  "total": 8,
  "new_count": 3,
  "reason": null
}
```

**Gates** `4 ≤ 8 ≤ 8` ✓ · `1 ≤ 3 ≤ 4` ✓ · all labels are product nouns ✓

**Caption** (77 chars)
> Eight areas, five followed existing patterns, three needed new ones from scratch.

**Placement rule** — deterministic, no judgement. Emit every `reused`
item in the user's order, then every `new` item in the user's order. This
guarantees the exceptions occupy one unbroken run without the renderer
having to reason about it.

| Row | Position | Label | State |
|---|---|---|---|
| 1 | 1 | Reports | default |
| 1 | 2 | Projects | default |
| 1 | 3 | Lists | default |
| 1 | 4 | Team | default |
| 2 | 1 | Settings | default |
| 2 | 2 | Canvassing | exception |
| 2 | 3 | Messages | exception |
| 2 | 4 | Data | exception |

Four per row, first row top 96. The three dark marks close the second row
as one unbroken run. Caption at top 357.

**Wrong renders**

| Symptom | Why it fails |
|---|---|
| Exceptions scattered through the grid | The reader has to count them one by one. An unbroken run is read as a single mass. |
| All eight marks identical | The contract is not rendered at all. The caption claims three exceptions the picture cannot show. |
| Caption reads "Eight areas, one system to keep consistent, most followed existing patterns…" | "One system to keep consistent" is a claim the diagram does not contain, and "most" should be a number. |

---

### 8.2 `sequence-collapse`

**Contract**
```json
{
  "template": "sequence-collapse",
  "before": [
    { "label": "Select plan",     "fate": "kept" },
    { "label": "Billing address", "fate": "kept" },
    { "label": "Card details",    "fate": "kept" },
    { "label": "Review order",    "fate": "removed", "note": null },
    { "label": "Confirm email",   "fate": "removed", "note": null },
    { "label": "Place order",     "fate": "kept" }
  ],
  "reason": null
}
```

`after[]` is derived, never supplied: `Select plan · Billing address ·
Card details · Place order`.

**Gates** `4 ≤ 6 ≤ 8` ✓ · `after 4 ≥ 2` ✓ · `4 ≤ 6 − 2` ✓

**Caption** (76 chars)
> Six steps became four — review order and confirm email were removed entirely.

**Render**

| Row | Left column (top) | State | Right column | State |
|---|---|---|---|---|
| 1 | Select plan (82) | default | Select plan (82) | emphasised |
| 2 | Billing address (118) | default | Billing address (118) | emphasised |
| 3 | Card details (154) | default | Card details (154) | emphasised |
| 4 | Review order (190) | receded | — | — |
| 5 | Confirm email (226) | receded | — | — |
| 6 | Place order (262) | default | Place order (190) | emphasised |

Connectors, 1px dotted `Border/Strong`, x 212 → 296:
three horizontal at y 94 / 130 / 166, one slanting from y 274 up to
y 202. The slant is the compression. Rows below y 202 on the right stay
empty.

Axis labels `Before` / `After` at top 52.

**Wrong renders**

| Symptom | Why it fails |
|---|---|
| Removed steps filled solid grey | Absence gets more visual mass than presence. The removed steps become the heaviest objects in the frame. |
| Right column vertically centred against the left | The empty space at the bottom is the finding. Centring deletes it. |
| Curved or arrowed connectors | A curve adds visual length that is not data; an arrow adds direction that is not claimed. |
| Caption reads "Six step became four" | Pluralise. |

---

### 8.3 `order-overlay`

**Contract**
```json
{
  "template": "order-overlay",
  "sections": [
    { "label": "Nav",              "category": "Kept"  },
    { "label": "Hero",             "category": "Added" },
    { "label": "Social proof",     "category": "Added" },
    { "label": "Comparison table", "category": "Cut"   },
    { "label": "Testimonials",     "category": "Cut"   },
    { "label": "FAQ",              "category": "Kept"  },
    { "label": "Closing CTA",      "category": "Added" }
  ],
  "categories": ["Added", "Cut", "Kept"],
  "finding": "everything cut sat in the middle of the page"
}
```

**Gates** `5 ≤ 7 ≤ 8` ✓ · `2 ≤ 3 ≤ 3` ✓ · "Added" repeats across 3
sections ✓

**Caption** (81 chars)
> Everything cut sat in the middle of the page, where readers were already deciding.

**Render** — every row carries a slot. The mark itself is always
`default`; the slot alone carries category.

| Row | Label | Slot fill |
|---|---|---|
| 1 | Nav | hairline outline (Kept) |
| 2 | Hero | `Brand/Primary` (Added) |
| 3 | Social proof | `Brand/Primary` (Added) |
| 4 | Comparison table | `Background/Secondary` (Cut) |
| 5 | Testimonials | `Background/Secondary` (Cut) |
| 6 | FAQ | hairline outline (Kept) |
| 7 | Closing CTA | `Brand/Primary` (Added) |

Marks 332 wide at x 97, first row top 46, pitch 36. Slots 11 × 11 at
x 79, centred on their row. Legend below with three 12 × 12 swatches
matching the three slot fills exactly.

The finding is visible in the strip alone: two adjacent grey slots sit
between dark ones, with the page's order untouched.

**Wrong renders**

| Symptom | Why it fails |
|---|---|
| One category shown by a slot, another by filling the mark, a third by nothing | Three categories across two channels. The strip then represents only one category and cannot be read as a pattern — which was its only job. |
| Legend swatches that do not appear on the canvas | The legend promises a key the diagram does not use. |
| Rows sorted or grouped by category | The page's real order is the fixed reality the overlay is laid over. Sorting destroys the finding. |
| Category word repeated inside each mark | The legend already names it. Saying it twice adds text without adding information. |

---

## 9. Open items

1. `set-exception` upper bound `new_count <= total / 2` is a judgement
   call. Validate against real projects before freezing.
2. `sequence-collapse` requires a reduction of at least 2. Validate
   whether 1 is ever legible.
3. ~~Every dimension in §4 and §5 is unverified under Inter.~~ **Closed in
   1.3:** measured in the running app against the live font stack rather than
   redrawn in Figma, which measures what renders instead of what was drawn.
   Inter is 5.42% wider than Helvetica Neue over 15 real labels; mean
   character advance 5.93px, p95 6.64px. Mark height 24 and pitch 36 survive
   unchanged. The frame does not: 509 × 421 became a 568 width with a
   computed height, because 568 is the column the diagram sits in and the row
   count is data. The 18-character label limit became 14 — see the note under
   §5.1, which is the more important finding. **This no longer blocks the
   renderer.** The original wording is kept below for history.

   ~~Helvetica Neue must be embeddable by the renderer.~~ **Closed in 1.1:**
   the face is Inter, which is OFL licensed and already loaded by the app.
   It leaves a consequence in its place — **every dimension in §4 and §5
   was measured against Helvetica Neue and is now unverified.** Inter sets
   wider at the same size. The mark height, the frame, the pitch and the
   18-character label limit all have to be re-measured, and the Figma
   components redrawn in Inter, **before** any renderer work rather than
   after.
4. ~~Mark labels over 18 characters are common in real products.~~
   **Closed in 1.3**, and it was the wrong diagnosis: the limit was never
   reachable at four marks per row under either face, so the problem was the
   row count's budget rather than real labels being long. It is 14 now, and
   tested against the labels both fixtures actually carry — `Ward Board`,
   `Patient Notes`, `Handover list`, `Escalations` all fit; the page
   fixture's sections run against a far wider budget and are not close to it.
   Truncation stays ellipsis-with-measurement: the renderer trims to the
   97px box, so a string of wide characters cannot overrun a box that
   counted characters.
5. ~~`order-overlay` has no legal encoding.~~ **Closed in 1.5.** §9 won, as
   this file's header says it must: two fill states on present-against-absent,
   the category word in a gutter beside its mark, no legend. §5.3's encoding
   is rewritten to match and carries the full argument.

   The consequence feared below did not arrive in the shape it was written.
   `categories` keeps its 2-3 gate, because the gutter names all three and
   only the FILL is capped at two. What it costs instead is narrower, and is
   recorded at §5.3: the strip reads for cut against kept, so a finding about
   where the ADDED sections fell is carried by the word rather than by the
   fill. **This no longer blocks the renderer.** Original text follows.

   ~~**`order-overlay` has no legal encoding, and NO RENDERER MAY BE BUILT
   FOR IT until this resolves.**~~ §5.3 and §8.3 require a legend, three slot
   fills, and a keyed strip in place of direct labels. The output
   specification forbids all three: §9.3 gate 1 ("There are no legends"),
   gate 3 ("Direct labelling over keyed fills"), gate 4 ("Two fill states
   maximum"), and §12 items 24 and 25 repeat two of them as hard gates.
   This document's own header says §9 wins where the two disagree about
   structure, so as specified the template cannot be drawn at all.

   The contract, the gates, the wizard input and the selection rule ship
   without a renderer. That is deliberate and it is the whole of the round
   that added them: coverage was the problem, and a page project now gets a
   validated contract in its envelope where before it got nothing.

   Resolving it is an amendment to §9 or a re-encoding of C, and the
   re-encoding is not free: two fill states and a label beside each row
   caps the template at two distinguished groups, which would narrow §5.3's
   `2 <= categories.length <= 3` to exactly 2 and drop one of Added / Cut /
   Kept. The 2-3 gate ships as §5.3 states it, which means a passing
   three-category contract may turn out to be undrawable under whatever §9
   decides. **That consequence is accepted, by decision, and recorded here
   rather than designed around.**

   Blocks the renderer jointly with item 3.
