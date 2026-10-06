# Check — Approach Visual System (Focused Fix)

Version 1.1 · Scope: the `focused fix` project category only.

Technical appendix to §9 of `prompts/focused-fix-output.md`, which holds the structural
decision — that the block exists, when it appears, and what happens when it does not. This
file holds encoding, tokens, coordinates and worked examples. Where the two disagree about
structure, §9 wins; where they disagree about pixels, this file does.

**Changed in 1.1**, both from decisions taken against the spec it appends to:
`set-exception` is drawn as a **grid, not a ring** (§5.1, §8.1), and the type face is
**Inter, not Helvetica Neue** (§4).

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
- No diagram is better than a weak diagram. Approach always renders, with
  or without one.

---

## 2. Division of labour

The agent **never draws**. It extracts facts from the user's existing
wizard answers and fills a data contract. A deterministic renderer turns
that contract into SVG and rasterises it to PNG at 2x.

This is not a style preference. If the agent generates the visual
directly, it can silently depart from the design system on any single
run and there is no way to detect it.

**No new wizard fields.** The agent works from the fields that already
exist. Templates that cannot be filled from those fields simply do not
fire.

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

Three covers roughly 85% of focused-fix projects. The remaining 15%
render as text. That is the designed outcome, not a gap to close.

---

## 4. Shared visual grammar

Binds to the Check Figma library. Token names are authoritative; hex
values are shown for reference only.

### Frame
| Property | Value |
|---|---|
| Size | 509 × 421 |
| Background | `Background/Primary` |
| Border | 1px `Border/Default` (#ededed) |
| Radius | `Medium 2` (12) |
| Export | PNG @2x → 1018 × 842 |

### Mark (shared by all three)
| Property | Value |
|---|---|
| Height | 24 |
| Padding | 12 horizontal, 4 vertical |
| Radius | `Small` (4) |
| Type | `Body small` — Inter Regular 12 / 1.2, tracking −0.12 |

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
7. Only `order-overlay` may use more than one fill, capped at three.

### Text limits
| Slot | Max | Overflow |
|---|---|---|
| Mark label | 18 chars | truncate with ellipsis |
| Caption | 120 chars | reject, regenerate shorter |
| Legend entry (C) | 10 chars | truncate |
| `finding` (C) | 120 chars | it becomes the caption, so it carries the caption's limit |

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
  and 12 horizontal.
- Marks are laid out in reading order — left to right, top to bottom — in
  the user's order.
- **Exception marks are placed contiguously.** Emit every `reused` item
  first, then every `new` item, so the exceptions form one unbroken run.
  Scattered exceptions have to be counted; an unbroken run is read as one
  mass.
- Exceptions use the `exception` state. Everything else is `default`.

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
  right-column centre, in the 84px channel from x 212 to x 296. 1px,
  dotted, `Border/Strong`, round caps, behind the marks. No curves, no
  arrowheads, no endpoint dots.
- The space below the shorter right column stays empty. Never centre the
  columns against each other — the slant of the connectors is the
  compression.

**Caption**
```
{n} steps became {m} — {removed, listed} were removed entirely.
```
Pluralise correctly. With a reason: `… were removed because {reason}.`

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
categories[]  string    2 to 3, user's own words, max 10 chars
finding       string    the pattern: a repeat or a gap
```

**Extraction** Order is the page's real order, never a ranking. Assign a
category only where the user placed that section in a group. Never invent
a category to fill an empty section — empty is data.

**Gates**
```
5 <= sections.length <= 8
2 <= categories.length <= 3
at least one category repeats across 2+ sections, OR at least one
  section has no category
```

**Encoding**
- One column, marks 332 wide at x 97, first row top 46, pitch 36.
- Category slot sits outside the mark, 11 × 11, radius 3, at x 79,
  vertically centred on its mark. Slots form one tight vertical strip
  that must be readable before any label is read.
- Slot fills: `Brand/Primary`, `Background/Secondary`, `Border/Strong`.
  One chromatic fill at most. Sections with no category get a hairline
  outline slot and no legend association.
- Legend below the column, max 3 entries, 12 × 12 swatch + label,
  `Text/Secondary`.
- Because the legend names the categories, the category word is **not**
  repeated inside the mark.
- Never sort or group rows. Rearranging the order destroys the finding.

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
3  select    exactly one complete  -> that one
             more than one complete -> B, then A, then C
             none complete          -> text only, stop
4  gate      run the selected template's gates on the data
             any gate fails        -> text only, stop
5  render    renderer produces SVG from the contract
6  verify    swap test on the caption
             fails                 -> text only, discard the image
```

Priority order is fixed in `SKILL.md`, not decided per project, so two
projects with similar data always resolve the same way. There is no
"try another template" branch — that is taste re-entering through the
back door.

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
3. ~~Helvetica Neue must be embeddable by the renderer.~~ **Closed in 1.1:**
   the face is Inter, which is OFL licensed and already loaded by the app.
   It leaves a consequence in its place — **every dimension in §4 and §5
   was measured against Helvetica Neue and is now unverified.** Inter sets
   wider at the same size. The mark height, the frame, the pitch and the
   18-character label limit all have to be re-measured, and the Figma
   components redrawn in Inter, **before** any renderer work rather than
   after.
4. Mark labels over 18 characters are common in real products
   ("Campaign performance", "Billing & invoices"). Test truncation
   against real data before launch — and re-derive the limit itself, per
   item 3.
