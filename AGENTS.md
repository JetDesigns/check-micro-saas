<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Check

Micro-SaaS that turns finished design work into a single-page **portfolio case study** — the kind a designer publishes to get hired. Users are designers presenting their work to reviewers and hiring teams.

> **GENRE CHANGED — Aug 25, 2026.** Check was previously built as *sales
> collateral*: a business-framed case study aimed at winning the next client,
> explicitly "not job seekers". That is no longer true. The revision spec
> (`check-revision-prompt.md`) reverses it, and the reversal is deliberate and
> approved.
>
> This matters when reading anything else in this repo. Prose written before
> this date — the compile prompt's voice rules, the landing copy, the
> early-access survey questions — was written for the sales genre and is being
> migrated phase by phase. **If a piece of copy argues for hiring the designer
> as a consultant, it predates this change and is not the target.**

Reference competitor: `casestudydesigner.app` (CSD). Same genre now; we differ on **structure** (a guaranteed finding→requirement→move spine rather than freeform prose) and **price**.

## The spine — the core structural idea

A case study reads as senior when one idea is restated at three levels of resolution, mapped 1:1:

| Finding (what you learned) | Requirement (what it demanded) | Move (what you designed) |
|---|---|---|

Generic case studies fail because those are three unrelated lists. Check guarantees the mapping **structurally**, in `lib/case-study-blocks.ts`, not by hoping the model complies.

The wizard never asks for three lists. It asks for a repeated **decision unit** — what did you decide · what made you decide it · what did you reject — and derives all three levels from it. People can recall decisions; they cannot recall "requirements".

Supabase project ref: `barsrclvvnuwjaqwecay` (ap-southeast-2).

## Locked product decisions — do not change without asking

`check-revision-prompt.md` (repo root) is the spec the current build follows,
and where a row below says a decision is Phase 2/4/6's to make, that file is
where it gets made. **A row that points there is not an invitation to decide it
yourself** — this table was actively misleading for a day because it kept
describing a product that had already been deleted, which is exactly the failure
being avoided here.

| Aspect | Decision |
|---|---|
| Input | **Two-step card** with a Next / Back control. Step 1 = attachments (top) + Project Type (3 cards) + Tone (5 chips) + 2 short inputs (`title`, `client_type`). Step 2 = the 6 long-form fields **plus `voice_sample`** (optional). Both steps live in one `<form>` in `components/intake/IntakeForm.tsx`; state is preserved when the user goes Back. **Phase 2 of `check-revision-prompt.md` replaces this with five steps plus a review screen** — the shape above is what exists today, not what to defend. The "no in-step scrolling" goal is already unmet on step 2 (1289px against a 900px viewport, measured *before* `voice_sample` was added); five steps is partly a fix for that. |
| Output | **A block document, not prose sections.** `CaseStudy = { spine, blocks }` in `lib/case-study-blocks.ts` is the contract between the synthesis agent and the renderer — the agent emits typed blocks, never markdown. `components/case-study/CaseStudyDocument.tsx` assembles seven parts: Opening · Context · What we found · What it needed · The approach · Where it landed · Learnings. Inside The approach there is exactly one `move_section` per spine entry, and **its heading is the designer's own decision phrased as an imperative** ("Freeze the note at shift change"). The old decorative arc — Vision · Discovery · Signal · Design · Testing · Launch · Growth · Reflection — is deliberately dead: those names could sit on any case study and signal nothing. Sticky nav is built from the spine, so its labels are the move titles. `/fixture` (dev-only) is currently the only route that renders it; the public read route is Phase 6's to build. |
| Block rules | Eight validation rules, **enforced in code** in `lib/case-study-blocks.ts` and covered by a test each: spine 2–4 entries · one `move_section` per spine entry in spine order · every eyebrow and requirement card traces to a spine id · move titles imperative, not noun phrases · prose ≤3 paragraphs × ≤60 words (move bodies ≤2 paragraphs) · `stat_headline` must contain a digit or the block is omitted · every uploaded image placed exactly once with a non-empty caption · `cycle_diagram` only when the spine is 3–4 entries *and* the decisions describe a loop. `validateCaseStudy` returns **every** issue rather than throwing on the first, because the pipeline feeds the whole list back as retry notes — one round trip instead of one fault at a time. |
| Attachments | Uploaded screenshots become `annotated_visual` blocks — image plus a caption in smaller, lower-contrast type directly beneath. **A caption names a decision, never describes the UI**: "Filters stay pinned because users compared four options before choosing", not "Dashboard with filters on the left". Captions are grounded rather than guessed because wizard Step 4 asks the designer what someone should notice in each image (Phase 2). Suggested budget against a 3-decision spine: 1 hero, 3 moves, 2 supporting, within the 6-upload max. |
| Free preview | **Undecided — do not invent one.** The old rule (`FREE_SECTION = 'vision'`) went with the 8-section document. Phase 6 of the spec says only that the preview becomes a *subset of blocks* rather than truncated text; which subset is an open decision. |
| Owner actions | Deleted with `/c/[id]`; Phase 6 decides the new bar. One durable rule survives: **any share or edit control is disabled while the study is locked** — a preview is not the deliverable, so there is nothing to send and nothing real to edit. |
| Editing | **Per block, not one text area.** This is the payoff for structured output — preserve it. Regenerating a single `move_section` must **not** re-run the vision pass. Do not cap regenerations tightly: compute is cheap next to the price of the output, so retry limits put friction in exactly the wrong place. Details in `check-revision-prompt.md` § Phase 6. (The old contentEditable editor and `/api/edit` are gone; don't port them.) |
| Price | **$9 for 5 credits** ($1.80/study), single pack, no per-unit option. **Locked — do not revisit until there is real customer data.** |
| Credits | 1 credit = 1 case study. Simple balance, not granular tokens. |
| Model | `claude-opus-5` for synthesis — the artifact people pay for. AI is ~3% of revenue; never downgrade to save cost. The spec names `claude-opus-4-8` for that call, which **does not exist** in the current generation; `claude-opus-5` overrides it. The spec's other three agents (interviewer, vision extraction, QA) are `claude-sonnet-5`. |
| Writer's voice | **`intake.voice_sample` beats the tone preset.** An optional field where the designer writes 3–4 sentences the way they'd actually say them. The prompt uses it as a style anchor — register, sentence rhythm, vocabulary — and it explicitly overrides the tone brief on conflict. It is quarantined from the facts: the prompt forbids treating anything in it as a project fact. Without it the tone preset still applies. Measured effect on one fixture: 17.3 → 15.7 words per sentence from the identical intake. Known leak: a 5-word phrase from the sample was reused verbatim once, so the "no verbatim reuse" rule is not airtight. The field survives in `lib/intake-fields.ts`; the prompt that honoured it does not, so **Phase 4 has to re-implement both the override and the quarantine** — same source as the copy-craft rules above. |
| Voice | **First person, written for a reviewer or hiring team.** The designer accounts for their own decisions — what they saw, what they chose, what they turned down. The previous rule here said "prospect-facing… consultant explaining value, not candidate showing process"; that is the sales genre and is **no longer the target**. What carries over unchanged: `I` = decisions the designer owned, `we` = work done with the client's team, and never `we` as a corporate plural for one person. The full voice instructions for the new genre are Phase 4's to write, against the spec's § Copy rules and QA list — don't reconstruct them from the deleted prompt's framing. |
| Tone + project type | Five tones and three project types exist in `lib/intake-fields.ts` today; **Phase 2 collapses tone to three — Direct / Warm / Analytical** — because five options is decision cost with no payoff. The durable rule, and it cost real time to learn: **never pass these to a model as bare enum tokens.** Each value needs a spelled-out brief with a DO list, an AVOID list, and a sample sentence in that register. Before those briefs existed the model got the token `data_driven` and all five tones produced near-identical prose. Tone changes sentence-level register **only** — never the facts, never permission to invent. `TONE_BRIEFS` and `PROJECT_TYPE_BRIEFS` were deleted with the compile route; **recover them from `git show 3fcd036:app/api/compile/route.ts`** rather than rewriting from scratch. |
| Copy craft | **Do not rebuild this from scratch — it is in git.** `git show 3fcd036:app/api/compile/route.ts` holds an eight-move senior-copywriter section derived from the CSD reference PDFs (open on a fact not a thesis · vary sentence length deliberately · the "not X, it was Y" reframe rationed to twice per document · name the central idea and reuse it · specifics live in the prose · name what was rejected · admit the limits · every paragraph advances the argument), plus an explicit banned list (vocabulary: delve/leverage/robust/seamless/unlock/elevate/"testament to"…; constructions: "not only…but also", default triadic lists, participial openers, rhetorical-question transitions, restating closers, hedge filler). It was tuned against real output and verified across all five tones: 0 banned terms, sentence-length stdev ~10 where uniform machine prose sits near 5–6. Phase 4 should lift it and re-aim it at the portfolio genre; the block prose caps (≤60 words per paragraph) make some of the moves matter more, not less. |
| Auth | Anonymous by default (Supabase anon sign-in on first form submit). Copy link + view stay free. Signup bonus: 1 credit granted on first `/auth/callback` completion, idempotent per user_id via `grant_signup_bonus()` RPC. **Both identity paths must preserve `user_id`** — an anonymous session already owns case studies and credits, so anything that mints a new user orphans them. Email → `supabase.auth.updateUser({email})`, never `signInWithOtp`. Google → `linkIdentity()` when `user.is_anonymous`, `signInWithOAuth()` only when there is no session to lose. `linkIdentity` needs "Manual linking" enabled in Supabase Auth settings; without it the anon-preservation path fails silently at link time, not at login time. |
| Google sign-in | Behind `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`. The button and its "or" divider render as one unit or not at all, so an unconfigured provider shows nothing rather than a button that errors. Setup is three dashboard steps (Google Cloud OAuth client → Supabase provider → Manual linking) documented in `.env.local.example`. There is no way to skip the Google Cloud step — an OAuth Client ID is Google's requirement for any "Sign in with Google" button anywhere. |
| Where credits are sold | Landing top bar (`components/landing/TopBar.tsx`) — Sign up + Buy credits, always reachable without writing a case study first. Buying needs an **email** session, not just any session: credits bought against a throwaway anon identity are unrecoverable once cookies clear. Clicking Buy while signed out opens the auth modal with `returnTo='/?checkout=1'`; `IntakeFlow` sees that flag on the way back and resumes into Stripe automatically, so the user presses Buy once, not twice. The **output page carries no signup offer** — that pitch lives on the landing only; when Phase 6 rebuilds the read route, its only CTA is Unlock / Buy 5 credits. (Under `EARLY_ACCESS_MODE` the Buy button is not rendered at all — see `lib/launch-mode.ts`.) |
| Out of scope | PDF export, Lovable/Gamma integrations, a second price tier, OAuth providers beyond Google, password login. From the spec, three things that look like obvious additions and are not: **no "Going further / future features" section** (speculative unbuilt work is the weakest thing a reviewer reads), **no competitor teardown section** (it needs 6–9 external screenshots against a 6-image budget), and **no general-purpose diagram generator** — one cycle-diagram template, or none. |

The old blanket rule here — *"all copy uses business language (cost, value,
risk, decision impact), never UX metrics as the primary lens"* — was written for
the sales genre and **is not the standing rule any more.** What replaces it is
Phase 4's to settle against the spec; the spine already carries most of the
weight, since a decision, what prompted it, and what it cost to choose are
neither business jargon nor UX metrics. Still true: adopt CSD's *flow*, never
its *text*.

**Never fabricate credibility.** No invented testimonials, no made-up user counts, no logos of companies that don't use this. Real testimonials from real users are fine once they exist.

**Never fabricate case-study facts.** The model may *interpret* what the intake says — reframe stated facts, draw inferences, add analytical framing about implications — but never *add* facts: client names, numbers, quotes, benchmarks not stated. Interpretation of what's stated ≠ invention. Thin input means short and honest output, not padding with invented specifics. The schema enforces one corner of this already: `stat_headline` must contain a digit, and if the user supplied no number the block is omitted rather than filled in.

## Architecture

The write side is **not built** — `/api/compile` and the routes that fed it were
deleted with the sales-genre product. What exists today is the front half
(wizard, still gated) and the back half (schema + renderer, proven on a
fixture), with the pipeline between them still to build in Phase 4.

```
IntakeForm  →  createCaseStudy()  →  [ Phase 4: interviewer · vision ·
(Phase 2 makes it 5 steps)            synthesis · QA ]  →  CaseStudy
                                                      { spine, blocks }
                                                              ↓
                                            validateCaseStudy() must pass
                                            (lib/case-study-blocks.ts)
                                                              ↓
                            CaseStudyDocument — proven now at /fixture,
                            wired to a real read route in Phase 6
                                                              ↓
                            /api/unlock → spend_credit() RPC → status 'paid'
                            (returns {ok, newBalance}; no document content)
```

- **Credits are server-authoritative.** `spend_credit(uuid)` and `add_credits(uuid,int,text)` are `security definer` Postgres functions. `spend_credit` is atomic (row locks) so two tabs can't unlock two studies on one credit. `add_credits` is idempotent on `stripe_payment_id` so a webhook retry can't double-credit.
- **`credit_balance` is not user-writable.** RLS decides *which row*; a column-level grant decides *which columns* — `authenticated` may only UPDATE `email` on `public.users`. If you ever add a user-writable column, extend that grant explicitly; do not re-grant the whole table.
- **The paywall must be enforced server-side.** Sending the whole document and hiding part of it with CSS is not a paywall — devtools reads straight through it. The rule the deleted build got right and the new one must keep: the compile route persists everything and returns **no document body at all**, and a single server-side read boundary decides which blocks an unpaid reader receives. `/api/unlock` already holds that line — it spends the credit and returns `{ok, newBalance}`, nothing else.
- **`headline` and `meta` are pre-paywall, document content is not.** Migrations 0007 and 0008 extend the `authenticated` SELECT grant to `headline` and `meta` because both are anonymized page furniture; `compiled_narrative` stays revoked. Whatever column Phase 4 writes the block document into inherits that revoked side — decide which side of the line any new AI-written column falls on before granting anything.
- **`case_studies.compiled_narrative` is dead but not dropped.** It holds documents in the deleted 8-section shape, nothing reads it, and it is typed `unknown` in `types/database.ts`. Kept because `DROP` cannot be undone and deferring costs nothing. A useful side effect: five `paid` rows that used to be publicly openable in an empty state are unreachable now that the read route is gone.

## Environment gotchas

Each of these has already cost real time:

- **Node is not on the default PATH.** Every Bash command needs:
  `export PATH="$HOME/.local/share/fnm/node-versions/v24.19.0/installation/bin:$PATH"`
- **Next 16 uses `proxy.ts`, not `middleware.ts`.** Having both fails the build outright.
- **`max_tokens` counts reasoning tokens too, not just the JSON.** *(No live call makes this bite today — it bites again the moment Phase 4 exists.)* A budget sized to the expected output gets eaten from the front and the response arrives truncated mid-string, which surfaces as `SyntaxError: Unterminated string in JSON`, never as an obvious length error. The deleted compile call sat at 16000. Billing is per token *generated*, so a high ceiling is free when the model finishes early — do not tune it down to "save cost".
- **Intake labels are part of the prompt, not just UI.** The deleted `buildPrompt` rendered each field as `` `[${f.key}] ${f.label}` `` + the answer, so editing a label in `lib/intake-fields.ts` silently rewrote what the model was told the field meant. Renaming `business_impact` to "Why did you choose this approach?" put the prompt at odds with its own section instruction with no code change at all. Phase 2 rewrites these labels and Phase 4 rebuilds the prompt, so **whatever the new pipeline does, decide deliberately whether labels feed it** — the trap is a prompt that reads labels without anyone remembering it does.
- **`position: sticky` creates a stacking context.** The landing's left column is sticky, so anything rendered inside it — including a `fixed inset-0 z-50` modal — has its z-index confined there and gets painted over by the wizard column, a later sibling. `AuthGateModal` is portalled to `document.body` for exactly this reason; keep it that way. Note the symptom is invisible to `getBoundingClientRect` (the rect was correct); `document.elementFromPoint` is what exposes it.
- **A dev stub may only fire when there is no `ANTHROPIC_API_KEY` at all.** The deleted one started out catching every failure in dev, and its plausible-looking prose masked the truncation bug above for a whole eval run. If a key is present and the call fails, that is a real error — 502 in every environment. Rebuild it that way in Phase 4 or not at all.
- **Every table entry in `types/database.ts` needs `Relationships: []`** — without it `.insert()` types as `never` and every write errors.
- Stripe `apiVersion` must be `'2026-07-29.dahlia'` (matches SDK 22.5.0).
- **Supabase Auth → URL Configuration → Redirect URLs** must include `http://localhost:3000/auth/callback` (dev) and the production origin's `/auth/callback`. Without the whitelist entry, magic-link `emailRedirectTo` silently degrades to Site URL and drops our `?next=…` query — the user lands on `/` instead of the page they were headed to. Landing IntakeFlow has a localStorage-based recovery for this, but the whitelist is the clean fix.
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

- **Anthropic API — status unproven either way.** It was blocked on Aug 20 (credit exhausted, card hit an "already used" lock), and a later note in HANDOFF's deploy pre-flight records billing as active. Nothing in this repo has called the API since `/api/compile` was deleted, so neither line is evidence. **Check the console before Phase 4** instead of trusting either.
- **Stripe lists Indonesia as Preview**, not fully supported — rates unpublished, live activation not guaranteed. Verify activation before building further on Stripe. If it's refused, move to a Merchant of Record (Paddle or Polar), which also handles the global VAT obligations Stripe leaves to the seller. Fee difference is ~0.6% of revenue, so the decision is about availability and tax, not rate.

## Env vars

Names only — values live in `.env.local`, which is gitignored.

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PACK` (the $9/5-credit product), `STRIPE_PRICE_ID_SINGLE` (intentionally unused).

## Working style

Work **one phase at a time**. Finish a phase, report its verification results, stop, and wait for approval before starting the next. Don't stack phases unless one genuinely forces another.
