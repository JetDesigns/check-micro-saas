<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Check

Micro-SaaS that turns a finished client project into a **business-framed case study** aimed at winning the *next* client. Users are freelance / small-agency designers selling directly to B2B clients — **not** job seekers.

Reference competitor: `casestudydesigner.app` (CSD). We mirror its flow; we differ on **framing** (business outcomes, not portfolio-reviewer metrics) and **price**.

Supabase project ref: `barsrclvvnuwjaqwecay` (ap-southeast-2).

## Locked product decisions — do not change without asking

| Aspect | Decision |
|---|---|
| Input | **Two-step card** with a Next / Back control. Step 1 = attachments (top) + Project Type (3 cards) + Tone (5 chips) + 2 short inputs (`title`, `client_type`). Step 2 = the 6 long-form fields **plus `voice_sample`** (optional). Note the "no in-step scrolling" goal is already not met on step 2 — the form measured 1289px against a 900px viewport *before* `voice_sample` was added, so treat it as an aspiration the layout has outgrown, not a property you can rely on. Both steps live in one `<form>` in `components/intake/IntakeForm.tsx`; state is preserved when the user goes Back. |
| Output | **One rich 8-section case-study document** — single column, magazine-style, at `/c/[id]` (link-based, no auth required for readers). Sections in order: Vision · Discovery · Signal · Design · Testing · Launch · Growth · Reflection. Section NAMES are process/story-oriented (CSD arc); section CONTENT stays prospect-facing business writing, never portfolio brag. Each section = `{subtitle, body, callout}`: a fixed number + name (`01 · The Vision`), an AI-written 2–5 word angle subtitle rendered as a serif H2, 2–3 paragraphs of prose (**~180–280 words** — lowered from 250–400 on Aug 20 because the output read long and general; measured 2,209 → ~1,600 words per document), and at most one callout. Page furniture: serif hero H1 + 4-col meta grid (Role · Client · Audience · Platform, from `case_studies.meta`) + sticky ToC with 8 anchors (paid state only, IntersectionObserver highlight). Preview state: Vision live, sections 02–08 render heading + skeleton body. **The 3-format side-by-side (one-pager + meeting bullets) was removed** — `lib/case-study-formats.ts` is deleted, do not reintroduce. |
| Callouts | Exactly **three kinds**, allowlisted per section in `CALLOUT_ALLOWLIST` (`app/api/compile/route.ts`) and validated server-side: `insight` (label + ≤180-char highlight), `stat` (1–2 big-number tiles, values must come from `intake.metrics`), `process` (3–4 numbered mini-steps). Allowed map: vision→insight · discovery→insight\|process · signal→process · design→insight · testing→stat · launch→insight · growth→stat · reflection→insight. A callout whose kind isn't allowed for its section is **dropped, not thrown** — losing a callout beats failing a compile. Persona sidebars, before/after comparisons, and pull quotes were considered and **deliberately excluded** (intake doesn't collect the data; fabricating it violates the anti-fabrication rule). |
| Attachments | Uploaded screenshots render **inline between sections** with an AI-written caption (≤80 chars, stored in `meta.image_captions` keyed by attachment id). Slot assignment is **deterministic in the renderer** (round-robin into the 7 inter-section slots), never model-decided. Paid state only. |
| Free preview | Only **`vision`** is visible before payment. This is the main differentiator — CSD has nothing like it. |
| Owner actions | Two buttons: **"Edit case study"** (secondary) and **"Copy link case study"** (primary). The `/c/[id]` URL is the deliverable — the user publishes it directly; copy-text export and Start-new were removed from the action bar. **Both buttons are disabled while the study is locked** — seven of eight sections are skeletons then, so there is nothing to share and nothing real to edit. |
| Editing | **In-place (contentEditable), not a form.** Clicking Edit turns the headline, every section subtitle and body, and every callout string into editable text in the live layout; the bar swaps to Cancel + "Save edit". Editable regions carry `data-edit="<path>"` and the save path reads them back out of the DOM — body paragraphs come from the *direct children* of the body container, so whichever block element the browser produced on Enter maps to one paragraph. Callout **kind and item/step counts are never editable**; only the strings are, and the structure is re-read from the stored narrative on save. Cancel remounts the editable subtrees (via a bumped `key`) because React will not revert text the user typed into contentEditable. `POST /api/edit` re-validates with the *same* `lib/narrative.ts` validator that `/api/compile` uses and rejects a locked study with 403 — the UI disable is convenience, the server check is the rule. |
| Price | **$9 for 5 credits** ($1.80/study), single pack, no per-unit option. **Locked — do not revisit until there is real customer data.** |
| Credits | 1 credit = 1 case study. Simple balance, not granular tokens. |
| Model | `claude-opus-5` for compile. AI is ~3% of revenue — never downgrade the model to save cost. |
| Writer's voice | **`intake.voice_sample` beats the tone preset.** An optional field where the designer writes 3–4 sentences the way they'd actually say them. The prompt uses it as a style anchor — register, sentence rhythm, vocabulary — and it explicitly overrides `TONE_BRIEFS` on conflict. It is quarantined from the facts: the prompt forbids treating anything in it as a project fact. Without it the tone preset still applies. Measured effect on one fixture: 17.3 → 15.7 words per sentence from the identical intake. Known leak: a 5-word phrase from the sample was reused verbatim once, so the "no verbatim reuse" rule is not airtight. |
| Voice | **First-person, prospect-facing.** The designer speaks directly to the next prospect ("The team came to me knowing…", "What I saw underneath was…"). This is NOT CSD-style portfolio brag ("As a Lead Product Designer at [Company], I set out to rethink…"). Consultant explaining value, not candidate showing process. `I` = decisions the designer owned; `we` = work with the client's team; never `we` as a corporate plural for one person. |
| Tone + project type | **Both pills are spelled out in the prompt, never passed as raw enum strings.** `TONE_BRIEFS` and `PROJECT_TYPE_BRIEFS` in `app/api/compile/route.ts` give each value a DO list, an AVOID list, and a sample sentence in that register. This is not decoration: before the briefs existed the model received the bare token `data_driven` and all five tones produced near-identical prose. Tone changes sentence-level register **only** — never the facts, never permission to invent. Project type changes which beats the arc emphasises (focused_fix → scoping discipline and what was refused; zero_to_one → decisions without precedent; advisory → the decision the client could then make). If you add a tone or project type, write its brief in the same shape or it will do nothing. |
| Copy craft | The prompt carries an **eight-move senior-copywriter section** derived from the CSD reference PDFs (senjoy, grant-mavic): open on a fact not a thesis · vary sentence length deliberately · the "not X, it was Y" reframe **rationed to at most twice per document** · name the central idea and reuse it · specifics live in the prose not only in callouts · name what was rejected · admit the limits · every paragraph advances the argument. Paired with an explicit **banned list** (vocabulary: delve/leverage/robust/seamless/unlock/elevate/"testament to"…; constructions: "not only…but also", default triadic lists, participial sentence openers, rhetorical-question transitions, restating closers, hedge filler). Verified across all five tones: 0 banned terms, sentence-length stdev ~10 (uniform machine prose sits near 5–6). |
| Auth | Anonymous by default (Supabase anon sign-in on first form submit). Copy link + view stay free. Signup bonus: 1 credit granted on first `/auth/callback` completion, idempotent per user_id via `grant_signup_bonus()` RPC. **Both identity paths must preserve `user_id`** — an anonymous session already owns case studies and credits, so anything that mints a new user orphans them. Email → `supabase.auth.updateUser({email})`, never `signInWithOtp`. Google → `linkIdentity()` when `user.is_anonymous`, `signInWithOAuth()` only when there is no session to lose. `linkIdentity` needs "Manual linking" enabled in Supabase Auth settings; without it the anon-preservation path fails silently at link time, not at login time. |
| Google sign-in | Behind `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`. The button and its "or" divider render as one unit or not at all, so an unconfigured provider shows nothing rather than a button that errors. Setup is three dashboard steps (Google Cloud OAuth client → Supabase provider → Manual linking) documented in `.env.local.example`. There is no way to skip the Google Cloud step — an OAuth Client ID is Google's requirement for any "Sign in with Google" button anywhere. |
| Where credits are sold | Landing top bar (`components/landing/TopBar.tsx`) — Sign up + Buy credits, always reachable without writing a case study first. Buying needs an **email** session, not just any session: credits bought against a throwaway anon identity are unrecoverable once cookies clear. Clicking Buy while signed out opens the auth modal with `returnTo='/?checkout=1'`; `IntakeFlow` sees that flag on the way back and resumes into Stripe automatically, so the user presses Buy once, not twice. The **output page carries no signup offer** — that pitch lives on the landing only. `/c/[id]`'s sticky CTA is Unlock / Buy 5 credits and nothing else. |
| Out of scope | Inline per-section editing, PDF export, Lovable/Gamma integrations, a second price tier, OAuth providers, password login |

All copy — UI and generated output — uses business language (cost, value, risk, decision impact), never UX metrics as the primary lens. Adopt CSD's *flow*, never its *text*.

**Never fabricate credibility.** No invented testimonials, no made-up user counts, no logos of companies that don't use this. Real testimonials from real users are fine once they exist.

**Never fabricate case-study facts.** The compile prompt allows the model to *interpret* what the intake says (reframe stated facts, draw inferences, add analytical framing about implications) but forbids *adding* facts (client names, numbers, quotes, benchmarks not stated). Interpretation of what's stated ≠ invention. If a section has thin data, the model must stay short and honest — not pad with invented specifics.

## Architecture

```
IntakeForm (two steps)  →  createCaseStudy()  →  /api/compile
                                                      ↓
                            writes 3 columns: headline · meta · compiled_narrative
                            (8 rich sections), returns only {ok: true}
                                                      ↓
                            /c/[id] server component re-reads via service role;
                            unpaid → passes `vision` section only to the client
                                                      ↓
                            /api/unlock → spend_credit() RPC → status 'paid' → full narrative
```

- **Credits are server-authoritative.** `spend_credit(uuid)` and `add_credits(uuid,int,text)` are `security definer` Postgres functions. `spend_credit` is atomic (row locks) so two tabs can't unlock two studies on one credit. `add_credits` is idempotent on `stripe_payment_id` so a webhook retry can't double-credit.
- **`credit_balance` is not user-writable.** RLS decides *which row*; a column-level grant decides *which columns* — `authenticated` may only UPDATE `email` on `public.users`. If you ever add a user-writable column, extend that grant explicitly; do not re-grant the whole table.
- **The paywall must be enforced server-side.** Sending all 8 sections and blurring 7 with CSS is not a paywall — devtools reads straight through it. `/api/compile` writes all 8 to the database and returns **no narrative body at all** (`{ok: true}`); `/c/[id]`'s server component is the single read-side boundary and hands the client only `vision` when unpaid.
- **`headline` and `meta` are pre-paywall, `compiled_narrative` is not.** Migrations 0007 and 0008 extend the `authenticated` SELECT grant to `headline` and `meta` because both are anonymized page furniture. `compiled_narrative` stays revoked. If you add another AI-written column, decide which side of that line it falls on before granting anything.

## Environment gotchas

Each of these has already cost real time:

- **Node is not on the default PATH.** Every Bash command needs:
  `export PATH="$HOME/.local/share/fnm/node-versions/v24.19.0/installation/bin:$PATH"`
- **Next 16 uses `proxy.ts`, not `middleware.ts`.** Having both fails the build outright.
- **`max_tokens` on the compile call counts reasoning tokens too, not just the JSON.** A budget sized to the expected output gets eaten from the front and the response arrives truncated mid-string — which surfaces as `SyntaxError: Unterminated string in JSON`, never as an obvious length error. It is currently 16000. Billing is per token *generated*, so a high ceiling is free when the model finishes early — do not tune it down to "save cost".
- **Intake labels are part of the prompt, not just UI.** `buildPrompt` renders each field as `` `[${f.key}] ${f.label}` `` + the answer, so editing a label in `lib/intake-fields.ts` silently rewrites what the model is told the field means. Renaming `business_impact` to "Why did you choose this approach?" put the prompt at odds with its own Vision instruction (*"sets the stakes… draws on intake.business_impact"*) with no code change at all. Reword labels freely; changing what a label *asks for* means auditing the section instructions too.
- **`position: sticky` creates a stacking context.** The landing's left column is sticky, so anything rendered inside it — including a `fixed inset-0 z-50` modal — has its z-index confined there and gets painted over by the wizard column, a later sibling. `AuthGateModal` is portalled to `document.body` for exactly this reason; keep it that way. Note the symptom is invisible to `getBoundingClientRect` (the rect was correct); `document.elementFromPoint` is what exposes it.
- **The dev stub only fires when there is no `ANTHROPIC_API_KEY`.** It used to catch every failure in dev, and its plausible-looking prose masked the truncation bug above for a whole eval run. If a key is present and the call fails, that is a real error and it returns 502 in every environment. Keep it that way.
- **Every table entry in `types/database.ts` needs `Relationships: []`** — without it `.insert()` types as `never` and every write errors.
- Stripe `apiVersion` must be `'2026-07-29.dahlia'` (matches SDK 22.5.0).
- **Supabase Auth → URL Configuration → Redirect URLs** must include `http://localhost:3000/auth/callback` (dev) and the production origin's `/auth/callback`. Without the whitelist entry, magic-link `emailRedirectTo` silently degrades to Site URL and drops our `?next=…` query — user lands on `/` instead of `/c/[id]`. Landing IntakeFlow has a localStorage-based recovery for this, but the whitelist is the clean fix.
- **Supabase's built-in auth email sender is capped at 2 messages per hour**,
  for the whole project, and Supabase documents it as non-production only
  ("exploring", "toy projects"). Magic-link login is the default sign-in path,
  so on the built-in sender the third person to sign up in any hour simply
  never receives their link — no error surfaces anywhere. Custom SMTP is
  required before real users arrive; it also raises the cap to 30/hour, which
  is then adjustable under Auth → Rate Limits. Email is configured entirely in
  Supabase, which is why there is no email provider key in `.env.local`.
- `NEXT_PUBLIC_SUPABASE_URL` takes **no** `/rest/v1/` suffix.
- `.claude/launch.json` is read from the **session cwd**, not the project directory.
- Webhook testing needs the Stripe CLI in a separate terminal:
  `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Known blockers

- **Anthropic API is blocked** — credit balance exhausted, card hit an "already used" lock. `/api/compile` has a dev-only fallback (gated on `NODE_ENV !== 'production'`) that echoes raw intake back. It exercises the pipeline; it is **not** a measure of output quality and must never be shown to a prospective user.
- **Stripe lists Indonesia as Preview**, not fully supported — rates unpublished, live activation not guaranteed. Verify activation before building further on Stripe. If it's refused, move to a Merchant of Record (Paddle or Polar), which also handles the global VAT obligations Stripe leaves to the seller. Fee difference is ~0.6% of revenue, so the decision is about availability and tax, not rate.

## Env vars

Names only — values live in `.env.local`, which is gitignored.

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PACK` (the $9/5-credit product), `STRIPE_PRICE_ID_SINGLE` (intentionally unused).

## Working style

Work **one phase at a time**. Finish a phase, report its verification results, stop, and wait for approval before starting the next. Don't stack phases unless one genuinely forces another.
