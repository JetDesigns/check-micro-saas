# Check

Turns a finished design project into a **business-framed case study** aimed at
winning the *next* client. Users are freelance and small-agency designers
selling directly to B2B clients — not job seekers.

The designer answers eight conversational questions; Check writes an eight-
section case-study document and publishes it at a shareable link. That link is
the deliverable.

---

## ⚠️ Current state: PRE-LAUNCH

The product is built and works, but **it is deliberately closed**. Read this
before you conclude something is broken:

- The landing page has exactly **one live action**: the "Get early access"
  modal, which collects two survey answers and an email into `public.waitlist`.
- The intake wizard renders and fills in, but **"Next: write the story" is
  disabled on purpose**. Nobody can start a case study.
- The **"Buy credit" control is not rendered at all**.

All three are governed by one switch, `NEXT_PUBLIC_EARLY_ACCESS_MODE`
(`lib/launch-mode.ts`). It defaults to **on**, so a missing or misspelled env
var leaves the page closed rather than quietly selling something unready. Set
it to `false` to open the product — that single change re-enables the wizard
and the buy control together.

**Nothing is deployed yet.** There is no Vercel project and no production
environment; localhost is the only place this runs.

---

## Read these two files first

| File | What it holds |
|---|---|
| **`AGENTS.md`** | Architecture, **locked product decisions**, and environment gotchas that have each already cost real time. The single source of truth. Read before changing anything. |
| **`HANDOFF.md`** | Current state, what is **verified** versus what only looks verified, and the remaining work in order. Its "BELUM terverifikasi" section is deliberately placed **before** the shipped list — read it in that order. |

`HANDOFF.md` is written in Indonesian; `AGENTS.md` and all code comments are in
English.

---

## Running it locally

Node 24 (this machine uses fnm, and node is **not** on the default PATH — see
`AGENTS.md` § Environment gotchas for the export line).

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev
```

`.env.local.example` lists every variable the app needs, with a comment
explaining what each one does and when to change it. Values live only in
`.env.local`, which is gitignored.

You need credentials for **Supabase** (database, auth, storage) and **Stripe**
(test mode is fine) before the app does anything useful. An `ANTHROPIC_API_KEY`
buys you nothing yet — there is no route that calls the model; see *Shape of the
code* below.

---

## Stack

- **Next.js 16** (App Router). Note it uses `proxy.ts`, **not** `middleware.ts`
  — having both fails the build outright.
- **Supabase** — Postgres, Auth (anonymous → email/Google), Storage, and the
  transactional email sender. Migrations in `supabase/migrations/`, all applied
  to the live project.
- **Anthropic** `claude-opus-5` — locked as the model for the writing pass, but
  **nothing calls it right now**; the old compile route was deleted and the
  replacement pipeline is unbuilt.
- **Stripe** for the $9 / 5-credit pack. Test mode.
- **Tailwind v4**.

## Shape of the code

```
app/api/waitlist/           early-access signups
app/api/checkout/           Stripe session
app/api/stripe/webhook      credits the buyer
app/api/unlock/             spends a credit, flips the row to 'paid'
app/fixture/                dev-only: renders the document from a fixture
components/landing/         hero, top bar, early-access modal
components/intake/          the two-step wizard (disabled — see above)
components/case-study/      the renderer: document assembly + one component
                            per block type
lib/case-study-blocks.ts    the content contract — block types and the eight
                            validation rules, unit-tested
lib/                        intake fields, waitlist options, launch-mode flags
```

**The writing path is missing on purpose.** `/api/compile`, `/api/edit`,
`/c/[id]`, `/writing/[id]` and `lib/narrative.ts` were deleted along with the
sales-genre product they served. What replaces them is specified in
`check-revision-prompt.md`; `HANDOFF.md` says which phase is next.

Two rules that survive the rebuild:

1. **Intake labels can end up inside the prompt.** The deleted `buildPrompt`
   rendered each field as `` `[key] label` ``, so editing a label in
   `lib/intake-fields.ts` silently changed what the model was told the field
   meant. Whether the new pipeline does the same is a decision to make on
   purpose, not to inherit by accident.
2. **The paywall is enforced server-side.** The compile route returns no
   document body at all, and exactly one server-side read boundary decides what
   crosses to the client. `/api/unlock` keeps that shape today: it spends the
   credit and returns `{ok, newBalance}`, nothing more.
