# Check — Handoff (Aug 13, 2026)

## Buka chat baru — copy-paste ini di message pertama

```
Lanjut Check di ~/dev/check-microsaas.

Wajib baca dulu (dua file):
1. AGENTS.md (root project) — architecture, locked decisions, gotchas
2. HANDOFF.md (root project) — status shipped, sisa fase, detail eksekusi

Setelah baca dua file itu, mulai dari <isi salah satu di bawah>:
  - "Fase F — review agent"
  - "Fase G — verifikasi menyeluruh"
  - "Fase H — fixtures + credibility + polish"
  - "Deploy"

Feedback memory: approval per-fase. Setelah fase selesai + verified, stop
+ laporkan + tunggu approval sebelum lanjut fase berikutnya. Jangan
menumpuk beberapa fase sekaligus.

Kredensial + gotcha env sudah di AGENTS.md. Supabase project ref:
barsrclvvnuwjaqwecay. MCP Supabase available. Preview server via
mcp__Claude_Browser__preview_start {name: "check-dev"}.
```

---

## Status shipped (verified end-to-end)

**Fase A** (sebelum session ini) — DB pivot: migrations 0001-0003, 8-section
narrative, credits, review_messages, case_study_attachments.

**Fase B** — build red → green, 2-step intake form, RPC anon lock
(migration 0004).

**Fase D** — kredit flow, unlock in-place, Stripe checkout + webhook,
purchase-return redirect ke /c/[id]?purchased=1, migration 0005 (paywall
column + rate limit).

**Fase E** — halaman publikasi `/c/[id]`, serif Fraunces H1, meta row,
owner action bar (waktu itu Copy link · Copy text · Start new — sekarang satu
tombol saja, lihat CSD-exact rewrite di bawah), sticky CTA in-place
(Unlock atau Buy 5 credits).

**Loader page** `/writing/[id]` — full-page animasi 8-phase, gradient
progress bar warna Check accent, "Step X of 8", copy rotating, redirect
otomatis ke /c/[id] setelah compile.

**Prompt overhaul** — first-person prospect-facing (bukan CSD portfolio
brag), 4-8 kalimat per section dengan narrative arc, synthesis directive,
anti-restatement few-shot, framing check, max_tokens 4000.

**Login-gated export + signup bonus** — migration 0006 `grant_signup_bonus`
RPC (idempotent per user_id via credit_transactions.reason='signup_bonus'),
AuthGateModal.tsx, /auth/callback extended, ?login=1 flash toast di
CaseStudyView. **Login recovery** via localStorage — landing IntakeFlow
handles fallback kalau Supabase redirect drop `?next=…`.

**Headline column** — migration 0007 `case_studies.headline`, prompt output
9 kunci (headline + 8 sections), 6-10 word compact AI-generated title,
rendered as serif H1 dengan fallback ke raw `title` untuk old rows.

**~~3-format side-by-side~~** — SUPERSEDED. Dulu `/c/[id]` render Full case
study + Proposal one-pager + Meeting bullets berdampingan, derived
client-side. Semua dihapus di CSD-exact rewrite di bawah;
`lib/case-study-formats.ts` sudah dihapus dari repo.

**CSD-exact rich case study** — output Check sekarang meniru struktur PDF
referensi `casestudydesigner.app/examples/senjoy` (dibedah dari PDF asli di
Vercel blob, 9 halaman).

- **Migration 0008** `case_studies.meta` jsonb + grant SELECT ke
  authenticated (pola sama dengan headline 0007 — anonymized, pre-paywall).
  Isi: `{role, client, audience, platform, image_captions}`.
- **Shape narrative berubah** dari `Record<key,string>` jadi
  `Record<key, NarrativeSection>` di `types/database.ts`.
  `NarrativeSection = {subtitle, body, callout}`. Section keys ganti ke arc
  CSD: vision · discovery · signal · design · testing · launch · growth ·
  reflection. `FREE_SECTION` = `vision`.
- **`NarrativeCallout`** discriminated union — 3 kind: `insight`
  (label + ≤180 char), `stat` (1-2 big-number tiles dari intake.metrics),
  `process` (3-4 numbered mini-steps). Allowlist per section di
  `CALLOUT_ALLOWLIST`. Kind yang tidak diizinkan → di-drop diam-diam, bukan
  throw. Persona sidebar / before-after / pull quote sengaja TIDAK
  disupport (intake tidak punya datanya — anti-fabrikasi).
- **Prompt rewrite total** di `/api/compile` — output 3 top-level key
  (`headline`, `meta`, `sections`), per-section instruction (nama tetap +
  subtitle 2-5 kata + body 250-400 kata + callout allowlist), callout JSON
  contract, meta-grid inference rules, image-caption instruction per
  attachment id, anti-repeat between sections. `max_tokens` 4000 → 8000.
  `validateNarrative` / `validateCallout` / `validateMeta` semua baru.
  Response body sekarang cuma `{ok: true}` — nol narrative crossing the wire.
- **Attachments inline** — `/c/[id]` server component query
  `case_study_attachments` + batch `createSignedUrls` (TTL 1 jam), lalu
  distribusi deterministic round-robin ke 7 slot antar section. Caption dari
  `meta.image_captions[attachmentId]`. Paid state only.
- **`CaseStudyView` full rewrite** — single column magazine: serif hero H1,
  4-col meta grid, sticky ToC 8 anchor dengan IntersectionObserver highlight
  (paid only, horizontal-scroll + auto-center di mobile), section bernomor
  (`01 · The Vision` + serif H2 subtitle + prose + callout), `<Callout>`
  renderer per kind, `<InlineImage>` figure+caption. Preview state: Vision
  live, 02-08 heading + skeleton.
- **Owner action bar disederhanakan** jadi satu tombol **"Copy link case
  study"**. Copy-text export + Start-new dihapus (URL-nya sendiri yang jadi
  deliverable — user publish langsung). `buildPlainText` ikut terhapus.
  `AuthGateModal` masih dipakai untuk signup nudge di sticky CTA.
- **Edit in-place di `/c/[id]`** — tombol "Edit case study" di samping "Copy
  link case study". Keduanya disabled saat locked (server juga menolak:
  `POST /api/edit` balas 403 kalau status belum paid). Edit mode bikin
  headline, subtitle, body, dan semua string callout jadi contentEditable di
  layout aslinya; bar berubah jadi Cancel + "Save edit". Callout kind dan
  jumlah item/step tidak bisa diubah — hanya teksnya. Validator dipindah ke
  `lib/narrative.ts` supaya `/api/compile` dan `/api/edit` pakai kontrak yang
  sama persis.
- **Top bar landing + Google sign-in** — `components/landing/TopBar.tsx`:
  Sign up + Buy credits, selalu terjangkau tanpa harus menulis case study dulu.
  Sudah login → badge saldo (Sign up hilang) dan Buy langsung ke Stripe. Belum
  login → modal auth dengan `returnTo='/?checkout=1'`, lalu `IntakeFlow`
  melanjutkan ke Stripe otomatis (user menekan Buy sekali, bukan dua kali).
  Google di balik `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` — **sudah dikonfigurasi dan
  terverifikasi** (Google Cloud OAuth client + Supabase provider + Manual
  linking aktif). Tawaran "1 free credit" **dihapus dari halaman output**;
  pitch itu sekarang hanya di landing.

  Uji preservasi sesi anon lulus: user anon dengan 4 case study login Google →
  `user_id` **tidak berubah**, keempat case study tetap miliknya, email
  terpasang, bonus 1 credit masuk sekali. Itu bukti `linkIdentity` dipakai,
  bukan `signInWithOAuth`.
- **Intake copy rewrite** — 8 label/helper jadi designer-conversational
  ("What sucked before?", "Numbers that moved (or didn't)?"). Field KEYS
  tidak berubah → row lama tetap kebaca. Step heading: "Quick setup" /
  "The story of the project". Submit: "Write the case study".

**Old rows** (compiled sebelum shape ini) render sebagai 8 heading +
skeleton karena `narrative.vision` undefined. Acceptable — semua test row.
Kalau mau bersih, set `compiled_narrative = null` untuk row lama supaya
statusnya jelas "belum compile".

---

## Yang belum

- **Fase F** — Review agent
- **Fase G** — Verifikasi menyeluruh end-to-end
- **Fase H** — Fixtures + credibility + polish
- **Deploy**

---

## Fase F — Review agent

**Goal**: setelah unlock, owner bisa chat dengan AI review agent yang tunjuk
kelemahan konkret di case study (angle lemah, CTA tumpul, klaim lemah).
Tabel `review_messages` sudah ada (migration 0003).

### Yang sudah ada
- Tabel `public.review_messages(case_study_id, role enum user/agent, content, created_at)`, RLS "select/insert own" untuk authenticated.
- Type `ReviewRole = 'user' | 'agent'` di `types/database.ts`.

### Yang perlu dibangun

1. **`app/api/review/route.ts`** (POST)
   - Body: `{caseStudyId, userMessage}`
   - Auth: session cookie. RLS verifies ownership.
   - Server: fetch narrative + intake + prior review_messages via admin. Insert user message. Call Anthropic dengan system prompt review-agent + context + history. Insert agent response. Return agent message.
   - Model: `claude-opus-5` (untuk kedalaman feedback) atau Haiku (kalau usage projection tinggi). Bisa mulai Opus, downgrade kalau perlu.
   - Rate limit: pattern mirip `rate_limit_compile` RPC — tambah `rate_limit_review(user_id, max)` kalau perlu. Cap 20 messages/hari per user.

2. **`components/review/ReviewAgent.tsx`** — chat panel
   - Scrollable message list (user right-aligned, agent left).
   - Input textarea + Send button di bottom.
   - Auto-scroll ke bottom on new message.
   - Optimistic user message + await agent completion (MVP; streaming bisa iterasi kemudian).

3. **Wire ke `app/c/[id]/CaseStudyView.tsx`** — render `<ReviewAgent>` setelah section terakhir (Reflection), di atas byline. Hanya kalau `isPaid && isOwner`. Non-owner (prospek) tidak lihat panel (feedback owner-privat).

4. **System prompt review agent** — draft di /api/review/route.ts. Contoh angle:
   > *"You are a senior copywriter reviewing this designer's case study for their next paying client. Your job: point out specific weak spots — angle strength, claim credibility, CTA sharpness. Ask questions that force better writing. Not compliment mode. 2-4 sentences per turn. Reference specific sentences from the narrative."*

### Verifikasi
- Owner unlock → scroll ke review panel → send "make the CTA sharper" → agent respond dengan saran spesifik + kutip kalimat.
- DB: `review_messages` bertambah 2 baris (user + agent).
- Refresh page → history tetap ada (loaded from DB).
- Incognito (non-owner) → panel tidak muncul.
- Rate limit: 21st message → 429.

### Estimasi: **~40-50k token**.

---

## Fase G — Verifikasi menyeluruh end-to-end

**Goal**: satu full loop through the product sebagai user asli. Catat setiap
friction, edge case, dead-end. Fix P0 bugs. Bukan build fase — quality gate.

### Loop yang harus dijalankan

1. **Fresh incognito** (nol cookies + localStorage).
2. Landing → click "Start a case study".
3. Fill 2-step form + submit — **upload 2-3 screenshot** biar jalur attachment
   ikut kepakai.
4. `/writing/[id]` loader — verify animasi lengkap, ~15-20s (sekarang lebih
   lama: max_tokens 8000).
5. `/c/[id]` preview — hero serif + meta grid 4-kolom terisi, section 01
   Vision live (subtitle + body + callout kalau ada), 02-08 heading +
   skeleton, sticky nudge + Buy CTA.
6. Klik "Log in for 1 free credit" di nudge → AuthGateModal muncul.
7. Enter email → check inbox → klik magic link.
8. Verify: redirect ke `/c/[id]?login=1` (langsung ATAU via IntakeFlow recovery), toast muncul, sticky CTA switch ke Unlock (balance = 1).
9. Klik Unlock → paid state: 8 section penuh, sticky ToC muncul, callout
   render sesuai kind, gambar inline + caption di antara section.
10. Klik "Copy link case study" → paste ke incognito lain → prospect view
    (no owner button, no CTA, sticky ToC tetap jalan).
11. **Baca hasilnya keras-keras** — terasa dokumen case study, bukan wall of
    text atau bullet pendek? Bandingkan side-by-side dengan PDF Senjoy.

### Full purchase (Stripe CLI wajib jalan)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
- New anon → compile → /c/[id] → Buy 5 credits → test card `4242 4242 4242 4242` → return.
- Verify balance +5 in DB dan UI, sticky CTA switch ke Unlock, klik, verify paid.

### Edge cases
- **Rate limit compile**: 5 compile hari itu → 6th balas 429.
- **Insufficient credits**: force balance = 0 in DB, klik Unlock → 402 (or UI shouldn't offer Unlock — verify).
- **Non-owner unpaid**: incognito buka /c/[id] yang statusnya masih preview → 404 (tidak leak keberadaan draft).
- **Refresh mid-compile**: buka /writing/[id] sebelum compile selesai → refresh → seharusnya idempotent (skip Anthropic, langsung redirect ke /c/[id]).
- **Callout kosong**: intake tanpa `metrics` → section testing + growth harus
  `callout: null` (bukan angka karangan). Cek langsung di DB.
- **Zero attachment**: case study tanpa upload → tidak ada slot gambar, layout
  tetap rapi tanpa gap aneh.
- **Mobile 375px**: sticky ToC horizontal-scroll + auto-center ke section
  aktif, meta grid stack 2 kolom, callout stat stack, no horizontal overflow.

### Deliverable
Bug list P0/P1/P2 + fixes untuk P0-P1. P2 feed ke Fase H atau backlog.

### Estimasi: **~20-30k token** (mostly running + minor fixes).

---

## Fase H — Fixtures + credibility + polish

**Goal**: raise quality bar dengan regression tests + public credibility +
copy polish. Preparing for real customers.

### 1. Prompt regression fixtures

- Buat `fixtures/intake-*.json`, 3-5 intake dengan bentuk berbeda:
  - `focused-fix.json` — pricing page rewrite (compact, angka tinggi)
  - `zero-to-one.json` — build from scratch (Chrome extension example)
  - `advisory.json` — strategy work, no deliverable
  - `thin.json` — banyak optional kosong (test model's honesty rule)
  - `rich.json` — semua field terisi, verbose
- `scripts/eval-compile.ts` — untuk tiap fixture, POST ke /api/compile via internal call OR direct Anthropic call. Save output ke `fixtures/output-<name>-<timestamp>.json`. Manual read judgment.
- Any prompt change → rerun script → diff previous vs new outputs. Deteksi regresi kualitas.

### 2. Public credibility

- **`app/contoh/page.tsx`** — 1 full unlocked case study public read, no auth. Reuse `CaseStudyView` dengan hard-coded fixture data + `isOwner=false, isPaid=true`.
- Landing "See sample" button (currently disabled) — wire ke `/contoh`.
- **Byline / About** — small block di landing footer: "Made by [nama + wajah], designer in [tempat]". Real identity = trust. User (kamu) yang decide isinya.
- **Privacy statement** — 1 paragraf footer: "Your intake is used only to write your case study. Not used for model training. Delete anytime." Bahasa legal-safe.

### 3. Landing copy polish
- Current subtitle: *"One page of plain answers. One case study written for the client you want next — business framing, not portfolio metrics."*
- Iterate: tambah value strip yang tunjuk 8 section names (Vision · Discovery
  · Signal · Design · Testing · Launch · Growth · Reflection) — sekarang cuma
  satu format, jadi framing-nya "dokumen lengkap", bukan "3 format".
- Test mobile hierarchy: H1, subtitle, CTA, badge order.

### 4. Onboarding hint
- Setelah first-time unlock, small tooltip di /c/[id]: *"This is what your prospect sees. Copy the link and send it."*

### Estimasi: **~40-60k token** (fixtures paling makan effort).

---

## Deploy

**Goal**: production launch di Vercel + Supabase live.

### Pre-flight checks
1. **Supabase billing** — project sudah live (bukan paused). Cek tier limits (DB size, edge function invocations). Upgrade ke Pro kalau ada indikasi limit dekat.
2. **Anthropic billing** — sudah aktif (verified session ini). Set spend limit di console. Estimasi cost ~$0.04/compile.
3. **Stripe** — currently test mode. Untuk prod: activate live mode di dashboard, create live product $9/5 credits (Name: "Check — 5 credits pack", one-time payment, USD), salin live `price_id`. Live webhook secret akan berbeda dari test.

### Vercel setup
1. `vercel` CLI atau dashboard link project ke repo.
2. Env vars di Production scope:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ANTHROPIC_API_KEY
   STRIPE_SECRET_KEY           (live sk_live_…)
   STRIPE_WEBHOOK_SECRET       (live whsec_…)
   STRIPE_PRICE_ID_PACK        (live price_…)
   ```
3. Domain: `check.<yourdomain>` atau subdomain. TLS auto.
4. **Supabase Auth → Redirect URLs**: tambah `https://<production-domain>/auth/callback` ke whitelist. Tanpa ini magic link fallback ke Site URL (per AGENTS.md gotcha).
5. **Stripe webhook endpoint**: register `https://<production>/api/stripe/webhook` di Stripe dashboard, salin new signing secret ke env `STRIPE_WEBHOOK_SECRET`.

### Post-deploy smoke test
- Landing loads di production URL.
- Compile 1 test case study → /c/[id] rendered: hero + meta grid + 8 section.
- Buy 5 credits dengan real card (charge $9, refund via Stripe dashboard sesudah).
- Unlock case study → paid state, full content.
- Magic link login → bonus credit granted → correct redirect.
- Copy link → open di HP → prospect view works.
- Cek Vercel logs — nol 5xx errors.
- Cek Supabase logs (via MCP `query_logs`) — nol RLS errors.

### Estimasi: **~15-25k token** (mostly config + smoke test).

---

## Environment reminder

- **Cwd**: `~/dev/check-microsaas` (jangan folder iCloud — merusak node_modules).
- **Node PATH**: `export PATH="$HOME/.local/share/fnm/node-versions/v24.19.0/installation/bin:$PATH"` sebelum tiap `npm` command.
- **Supabase project ref**: `barsrclvvnuwjaqwecay` (ap-southeast-2). MCP Supabase available untuk query_logs, apply_migration, execute_sql, get_advisors.
- **Preview server**: `mcp__Claude_Browser__preview_start {name: "check-dev"}` — reads `.claude/launch.json` dari session cwd.
- **Stripe test cards**: `4242 4242 4242 4242` (any future expiry, any CVC).
- **Stripe CLI** (untuk webhook local): `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Print `whsec_…` yang harus match `STRIPE_WEBHOOK_SECRET` di `.env.local`.

## Bugs kecil / polish yang tercatat tapi belum di-fix

- Login toast ("Signed in. 1 free credit added") kadang tidak visible di screenshot — hydration timing / z-index. Logic benar (state + timer OK). Iterate kalau perlu.
- Progress bar di `/writing/[id]` warna hijau kelihatan dark (ink) di screenshot, bukan orange accent seperti design. Ganti gradient class kalau mau: `from-orange-500 via-amber-500 to-orange-400`.
- Sticky CTA text kadang truncate di mobile — cek responsive kalau di verifikasi Fase G ketemu.

## Reference files (di project root)

- `AGENTS.md` — architecture, locked decisions, gotchas (SATU-satunya source of truth arsitektur).
- `supabase/migrations/0001-0008.sql` — semua applied di project live.
- `.env.local.example` — env var names (values di `.env.local`, gitignored).
- `HANDOFF.md` — file ini (status + sisa fase).

## Session log

Session Aug 12-13, 2026 execute:
- Fase B verify + fix Wizard.tsx delete + migration 0004 (revoke RPC anon).
- Fase D full: kredit flow, unlock, Stripe integration, migration 0005.
- Parser hardening (retry + tolerant JSON cleanup + prompt rules).
- Fase E: dedicated /c/[id] + serif polish.
- Prompt overhaul first-person prospect-facing.
- Login-gated export + signup bonus (migration 0006) + AuthGateModal + callback extension.
- Login recovery via localStorage.
- Headline column (migration 0007) + 9-key prompt output.
- 3-format side-by-side layout + signup nudge.
- `/writing/[id]` full-page loader + IntakeFlow simplification + idempotency guard.

Session Aug 14, 2026 — CSD-exact rewrite:
- Bedah PDF referensi Senjoy (via iframe → Vercel blob → Swift PDFKit extract).
- Migration 0008 `case_studies.meta` jsonb + grant.
- `CompiledNarrative` jadi rich shape (`NarrativeSection` + `NarrativeCallout`
  union 3 kind). `FREE_SECTION` → `vision`.
- Prompt rewrite total (per-section + callout contract + meta + image
  captions), max_tokens 8000, response `{ok:true}`.
- Intake copy designer-conversational; keys tetap.
- `lib/case-study-formats.ts` + `components/preview/PartialPreview.tsx`
  dihapus (yang kedua sudah orphaned sejak lama).
- `CaseStudyView` full rewrite jadi single-column magazine + sticky ToC +
  callout renderer + inline attachment images. Owner action bar → satu tombol
  "Copy link case study".
- `npx tsc --noEmit` clean, `npx next build` hijau.

Migrations applied on `barsrclvvnuwjaqwecay`: 0001, 0002, 0003, 0004, 0005, 0006, 0007.
