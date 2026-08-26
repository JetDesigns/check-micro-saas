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

You need credentials for **Supabase** (database, auth, storage), **Anthropic**
(the compile call), and **Stripe** (test mode is fine) before the app does
anything useful.

---

## Stack

- **Next.js 16** (App Router). Note it uses `proxy.ts`, **not** `middleware.ts`
  — having both fails the build outright.
- **Supabase** — Postgres, Auth (anonymous → email/Google), Storage, and the
  transactional email sender. Migrations in `supabase/migrations/`, all applied
  to the live project.
- **Anthropic** `claude-opus-5` for the compile. One call, ~2.5 minutes,
  ~$0.08 each.
- **Stripe** for the $9 / 5-credit pack. Test mode.
- **Tailwind v4**.

## Shape of the code

```
app/api/compile/       the prompt — the single biggest lever on output quality
app/api/waitlist/      early-access signups
app/api/checkout/      Stripe session
app/api/stripe/webhook credits the buyer
app/c/[id]/            the published case study; also the paywall read boundary
app/writing/[id]/      the ~2.5 minute loader
components/landing/    hero, top bar, early-access modal
components/intake/     the two-step wizard
lib/                   shared contracts: narrative validation, intake fields,
                       waitlist options, launch-mode flags
```

Two rules worth knowing before you touch the compile path:

1. **Intake labels are part of the prompt.** `buildPrompt` renders each field
   as `` `[key] label` ``, so editing a label in `lib/intake-fields.ts`
   silently changes what the model is told the field means.
2. **The paywall is enforced server-side.** `/api/compile` returns no narrative
   body at all; `app/c/[id]/page.tsx` is the only place that decides what
   crosses to the client.
