# Check — Handoff (Aug 27, 2026)

## Buka chat baru — copy-paste ini di message pertama

```
Lanjut Check di ~/dev/check-microsaas.

Wajib baca dulu, urut:
1. check-revision-prompt.md (root project) — spec revisi. INI sumber
   kebenaran untuk semua pekerjaan sekarang.
2. AGENTS.md — arsitektur, keputusan terkunci, environment gotchas.
3. HANDOFF.md — bagian "BELUM terverifikasi" DULU, baru "Sudah terbukti",
   supaya tidak salah mengira sesuatu aman padahal belum pernah diuji.

PENTING: produknya baru saja GANTI GENRE. Dulu sales collateral (case
study untuk menang klien), sekarang portfolio case study (untuk dapat
kerja). Prosa apa pun yang berargumen "sewa saya sebagai konsultan"
adalah sisa genre lama.

Jalur produk lama SUDAH DIHAPUS — /api/compile, /api/edit, /c/[id],
/writing/[id], lib/narrative.ts. Itu disengaja, bukan hilang.

Build order spec: Phase 1 (schema), Phase 5 (renderer), Phase 2 (wizard
5 langkah), dan Phase 4 (pipeline) SELESAI. Berikutnya PHASE 6 (editor
per-blok + route baca berbayar) lalu Phase 3 (adaptive probing).

PENTING: kredit Anthropic HABIS di tengah run terakhir. Pipeline
terbukti jalan sebelum itu, tapi tidak ada panggilan model yang bisa
dijalankan sampai akunnya diisi ulang.

Approval per-langkah: setelah satu langkah selesai + terverifikasi,
berhenti, laporkan, tunggu approval. Jangan menumpuk beberapa langkah.

Supabase project ref: barsrclvvnuwjaqwecay. MCP Supabase tersedia.
Preview: mcp__Claude_Browser__preview_start {name: "check-dev"}.
Node butuh PATH export — lihat AGENTS.md § Environment gotchas.
```

---

## Kondisi saat ini (Aug 27, 2026)

### ⚠️ Genre berubah — ini yang paling penting dipahami

Check dulu **sales collateral**: case study berbahasa bisnis untuk memenangkan
klien berikutnya, dan AGENTS.md secara eksplisit menyebut "**not** job
seekers". Itu **dibalik** pada 25 Agustus 2026 mengikuti
`check-revision-prompt.md`. Sekarang Check membuat **portfolio case study** —
yang dipublikasikan desainer untuk **dapat kerja**.

Pembalikan ini disengaja dan sudah disetujui setelah konfliknya diangkat
secara eksplisit.

Konsekuensinya saat membaca repo ini: **prosa apa pun yang berargumen "sewa
saya sebagai konsultan" berasal dari genre lama.** Sebagian sudah dimigrasi
(headline landing, metadata halaman, survei waitlist), sebagian ikut terhapus
bersama jalur lama.

### ⚠️ Produknya belum dijual, tapi wizard-nya TERBUKA

Landing tidak menawarkan pembelian: tombol "Buy credit" **tidak dirender sama
sekali** selama `NEXT_PUBLIC_EARLY_ACCESS_MODE` menyala (default: menyala).
Modal "Get early access" adalah ajakan yang menggantikannya.

**Wizard-nya sendiri tidak lagi digembok.** Sampai 27 Agustus sakelar yang
sama mematikan tombol "Write the case study"; sekarang tidak. Alasannya:
menghasilkan case study membelanjakan kredit Anthropic *kita*, bukan uang
pengunjung — itu pertanyaan yang berbeda dari "sudah boleh berjualan?", dan
menjalankan produk sendiri tanpa harus menyunting env var lebih berharga
sekarang.

**Sebelum deploy, putuskan ulang.** Auth anonim berarti setiap pengunjung
adalah user, dan `rate_limit_compile` memberi masing-masing 10 compile per
hari — itu satu-satunya penahan yang tersisa di URL publik. Catatannya ada di
`IntakeForm.handleSubmit`.

`NEXT_PUBLIC_DEMO_URL` flag **terpisah** untuk video intro YouTube. Kosong →
tombol "Watch demo" tetap ada tapi mati. Diisi → jadi tautan asli ke tab baru.

**Belum ada deploy sama sekali.** Tidak ada Vercel. Domain sudah ada
(`jet.studio`, DNS di Porkbun).

### Jalur lama sudah dihapus — disengaja

Dihapus pada 27 Agustus, atas keputusan eksplisit: `app/api/compile/`,
`app/api/edit/`, `app/c/[id]/`, `app/writing/[id]/`, `lib/narrative.ts`, dan
seluruh tipe narrative 8-section di `types/database.ts`.

Yang tersisa di `app/`: landing, `/features`, `/fixture`, `/api/checkout`,
`/api/compile`, `/api/stripe/webhook`, `/api/unlock`, `/api/waitlist`,
`/auth/callback`. (`/api/compile` dibangun ulang di Phase 4; `/features`
ditambahkan setelahnya.)

`/api/unlock` **dipertahankan tapi dipangkas**: ia masih memotong kredit lewat
`spend_credit` (bagian yang bisa merugikan orang kalau salah), tapi tidak lagi
mengembalikan dokumen. Sisi baca akan memutuskan preview vs paid di Phase 5/6.

**Database sengaja tidak disentuh.** Kolom `compiled_narrative` dan 25 baris
lama dibiarkan — `DROP` tidak bisa dibatalkan dan menundanya tidak berbiaya.
Efek samping yang menguntungkan: 5 baris `paid` yang selama ini bisa dibuka
publik dalam keadaan kosong kini tidak terjangkau karena `/c/[id]` hilang.
Masalah itu selesai tanpa menghapus apa pun. Kolomnya kini bertipe `unknown`
dengan catatan di `types/database.ts`.

---

## Konsep inti: the spine

Ini yang membuat sebuah case study terbaca senior — satu gagasan dinyatakan di
tiga tingkat resolusi, dipetakan **1:1**:

| Finding (apa yang kamu pelajari) | Requirement (apa yang dituntutnya) | Move (apa yang kamu rancang) |
|---|---|---|

Case study generik gagal karena ketiganya jadi tiga daftar yang tidak
berhubungan. Check menjamin pemetaannya **secara struktural** di
`lib/case-study-blocks.ts`, bukan dengan berharap model menurut.

Wizard **tidak pernah** meminta tiga daftar. Ia meminta **decision unit** yang
berulang — apa yang kamu putuskan · apa yang membuatmu memutuskannya · apa yang
kamu tolak — lalu menurunkan ketiga tingkat itu darinya. Orang bisa mengingat
keputusan; mereka tidak bisa mengingat "requirement".

---

## BELUM terverifikasi — jangan diklaim aman

Baca ini **sebelum** daftar "Sudah terbukti" di bawah.

1. **Renderer baru belum pernah dilihat manusia dengan gambar sungguhan.**
   `/fixture` memakai bingkai berlabel karena fixture tidak punya file. Layout
   dengan screenshot asli belum teruji.
2. **Sorotan nav di renderer baru belum terverifikasi di browser sungguhan.**
   Logikanya diuji lewat unit test (`components/case-study/active-section.test.ts`)
   karena browser pane menekan event scroll — lihat gotcha di bawah. Perlu
   dicek manusia dengan scroll asli.
3. **Metadata Stripe belum terbukti pada transaksi sungguhan.** Rantai
   `webhook → add_credits → saldo` sudah terbukti lewat event bertanda tangan
   asli, tapi bahwa `user_id` + `credit_amount` dari `/api/checkout` benar-benar
   sampai di event Stripe nyata — belum.
4. **Custom SMTP belum dipasang.** Sender bawaan Supabase = 2 email/jam untuk
   seluruh project. Magic link akan gagal diam-diam. Lihat Deploy → Pre-flight.
5. **Badge saldo saat login belum pernah dilihat** setelah logikanya jadi
   `balance > 0`.
6. **Race auth pada request bersamaan — terlihat DUA kali** (401 sekali, 404
   sekali), keduanya konsisten dengan `auth.uid()` kosong sesaat saat token
   di-refresh. Belum direproduksi dengan sengaja.
7. **`/api/waitlist` tanpa rate limit.** Endpoint publik tanpa sesi.
8. **Vision pass belum pernah dijalankan.** Compile yang terbukti tidak punya
   gambar, jadi agent extraction, penempatan `annotated_visual`, dan aturan
   caption **belum teruji sama sekali**. Butuh compile dengan upload — dan
   kredit.
9. **Anggaran waktu belum muat di Vercel.** ~4 menit terukur lawan plafon 300
   detik, sebelum vision pass ditambahkan. Lihat Phase 4 § temuan.

---

## Sudah terbukti (dengan bukti, bukan asumsi)

**Phase 1 — schema + validator** (`b8d80f9`). `lib/case-study-blocks.ts`:
8 aturan validasi, semuanya ditegakkan di kode. **43 unit test**, tiap test
memutasi satu field dari fixture yang lolos, jadi kegagalan menunjuk ke
aturannya. Vitest dipasang dari nol — project ini sebelumnya tidak punya test
runner sama sekali.

Satu penyimpangan sadar dari spec: `move_section` diberi `spineId` eksplisit.
Spec melacak pemetaan lewat string eyebrow (`"MOVE 1 — DEFAULTS"`), tapi
memulihkan id dengan regex dari copy tampilan justru "berharap model benar" —
persis yang schema ini ada untuk menghilangkannya.

**Phase 5 — renderer diuji fixture** (`62c4dac`). `CaseStudyDocument` +
`/fixture`. Dibuktikan pada dokumen buatan tangan yang **lolos seluruh
validator** — layout yang hanya bagus di dokumen ilegal tidak membuktikan apa
pun. Judul section adalah keputusan si desainer sebagai kalimat perintah
("Freeze the note at shift change"), bukan label dekoratif.

**Phase 2 — wizard 5 langkah + review**. `lib/wizard-steps.ts` memegang semua
keputusannya sebagai fungsi murni, dengan **25 unit test** (total jadi 68) —
satu-satunya cara menguji apa pun di sini, karena project ini tidak punya
environment DOM sama sekali. Dijalani penuh di browser: maju dari tiap langkah
dengan semua field kosong, step 4 hilang dari urutan saat tidak ada gambar (di
kedua arah), tautan "Edit" melompat ke langkah tujuan **dan** memfokuskan
field-nya, submit menulis baris dengan bentuk `intake` baru, dan segel
early-access menahan tombol maupun submit langsung. Baris ujinya dihapus.

Satu bug sungguhan ditemukan lewat verifikasi ini, bukan lewat penalaran:
tiba di layar review **mengirim form sendiri** dan membuat satu baris tanpa
ada yang menekan apa pun. Lihat Rechecks di bawah — penyebabnya React memakai
ulang node DOM tombolnya.

**Halaman `/features`.** Tautan nav pertama yang akhirnya punya tujuan.
Keunggulan produk dijelaskan berpasangan dengan manfaatnya, dan **setiap klaim
dicocokkan dengan daftar "Sudah terbukti"** — tidak ada tautan publik, harga,
testimoni, atau angka pengguna, karena tidak satu pun dari itu benar hari ini.
Harga sengaja absen: tombol beli disembunyikan `EARLY_ACCESS_MODE`, dan harga
di halaman tanpa yang bisa dibeli mengulang inkonsistensi yang sama.

`SiteFooter` dirender `sm:hidden` di landing. Bukan selera: layout landing
terkunci `lg:h-screen` dan dua komentar panjang di `app/page.tsx` menjaga
tingginya — footer di sana mengembalikan scroll ~130px yang "reads as a bug".
Di bawah `sm` tautan nav memang hilang, jadi footer duduk persis di tempat
yang membutuhkannya. Terukur sebelum dan sesudah: `scrollHeight` 800 di
viewport 800, tidak berubah.

**Phase 4 — pipeline agent, terbukti pada compile sungguhan.** Tiga agent
(extraction · synthesis · QA), `/api/compile`, migration 0014. Dijalankan
end-to-end pada intake asli tiga keputusan: rate limit lolos, `claim_compile`
mengunci, synthesis menghasilkan dokumen yang **lolos seluruh validator**, QA
mengembalikan catatan, synthesis mengulang, dan hasil akhirnya tersimpan di
`case_studies.document` dengan status `preview`. Dilihat manusia di renderer
lewat `/fixture?id=` — bukan cuma "JSON-nya lolos validator". Setiap panggilan
tercatat di `agent_runs`.

Jalur gagalnya juga terbukti, dua kali dan tanpa direncanakan: satu compile
mati karena bug validator dan `compile_claimed_at` **dilepas dengan benar**
sehingga retry langsung bisa; dan QA terakhir gagal karena kredit habis, yang
ditangani sesuai desain — dokumen tetap tersimpan tanpa flag, bukan compile
yang hangus.

**Jalur uang — separuh terbukti** (`5493949`). Bug urutan diperbaiki: baris
`payments` dulu ditulis sebelum kredit diberikan, jadi kegagalan di antaranya
membuat retry balas `already_processed` dan pembeli tidak pernah dapat kredit.
Diuji dengan event bertanda tangan asli: saldo naik tepat 5, satu baris
`payments`, tiga kali kirim ulang tidak menambah apa pun.

**Compile idempoten** (`57f5170`) — *catatan: route-nya kini terhapus, tapi
migration `claim_compile` (0012) masih ada dan pola kerjanya layak ditiru
Phase 4.* Compile terukur **~150 detik**. Guard lama berlubang selebar itu; dua
compile berjalan dan yang kedua menimpa yang pertama (terbukti: 2 baris
`compile_attempts`, narasi berubah di antara dua kueri).

**Early access** (`1bc3617`, `0b44ecf`, `37e8741`). Tabel `waitlist`
(migration 0011) dengan RLS nol policy — anon key membaca `[]` dan insert
ditolak `42501`, keduanya diuji. Modal di-portal ke `document.body` karena
kolom kiri sticky membuat stacking context.

**Survei waitlist dipindah ke genre baru** (`bfbda20`). Migration 0013 memberi
penanda `survey_version`: baris lama = 1 (genre penjualan), baru = 2
(portfolio). Slug jawabannya identik antar versi, jadi tanpa penanda ini
keduanya terlihat bisa dibandingkan padahal menjawab pertanyaan berbeda.

**Layout landing** (`2258a8b`). Pita kosong 356px di kolom hero dan scroll
133px yang berhenti mendadak — keduanya diperbaiki; desktop tidak scroll lagi.

---

## Rechecks — cara-cara yang pernah menipu

Semuanya sudah menghasilkan kesimpulan salah, sebagian di sesi ini juga.

- **`PIPESTATUS` tidak jalan di zsh.** Dan `grep` di ujung pipe mengembalikan
  exit code miliknya sendiri — `tsc | grep` yang "exit 1" ternyata tsc sukses
  dan grep tidak menemukan apa-apa. **Selalu cek exit code tanpa pipe.**
- **Vitest hijau bukan bukti cukup.** Ia tidak melakukan typecheck; `tsc`
  menangkap error yang lolos dari test.
- **Vitest tidak membaca `paths` dari tsconfig.** Alias `@/` harus dideklarasi
  ulang di `vitest.config.mts`, dan gagalnya terbaca seperti test rusak.
- **Browser pane melaporkan `visibilityState: "hidden"`.** Di kondisi itu event
  `scroll` **tidak pernah terkirim** (0 terdengar padahal `scrollY` berubah) dan
  `requestAnimationFrame` **tidak berjalan**. Apa pun yang bergantung pada
  keduanya tidak bisa diverifikasi lewat pane — pisahkan logikanya jadi fungsi
  murni dan uji lewat test.
- **Screenshot pada posisi ter-scroll balik kosong**, sebab yang sama. Akali
  dengan meninggikan viewport supaya target berada di scroll 0.
- **Bug stacking, bukan posisi.** `getBoundingClientRect` bisa benar sementara
  elemennya tertimpa. Pakai `document.elementFromPoint`.
- **`git show HEAD:file` yang gagal + redirect** menghasilkan file kosong, dan
  eslint atas file kosong melaporkan "0 problems".
- **StrictMode di dev** menjalankan mount → unmount → remount. `AbortController`
  di cleanup membatalkan fetch di klien tapi **tidak menghentikan function di
  server**.
- **Output model adalah data tak tepercaya, dan validator-lah yang membuatnya
  aman — jadi validator sendiri tidak boleh memercayainya.** `validateCaseStudy`
  membaca `block.visuals` karena tipenya bilang field itu wajib. Tipe itu
  permintaan kepada model, bukan jaminan: move section tanpa gambar datang
  tanpa key `visuals`, spread-nya melempar TypeError, dan compile sungguhan
  mati dengan 502 alih-alih melaporkan kegagalan validasi. Sekarang semua
  akses lewat accessor aman, dengan test yang menyuapinya dokumen sampah.
- **Opus mengembalikan blok `thinking` lebih dulu**, jadi `content[0]` bukan
  teks. Terverifikasi lewat API sungguhan, bukan dugaan.
- **Prop berupa fungsi tidak bisa menyeberang dari Server ke Client Component.**
  `imageSrc: (id) => string` aman dari parent client, dan melempar dari server.
  Sekarang `imageUrls` berupa objek biasa.
- **`type="submit"` yang muncul lewat render kondisional menembak sendiri.**
  React memakai ulang satu node DOM untuk kedua cabang dan hanya menambal
  atribut `type`; tambalan itu mendarat di tengah klik yang memajukan langkah,
  lalu browser membaca type **terbaru** untuk memilih aksi bawaannya — dan
  mengirim form tanpa ada yang menekannya. Penjaga `step !== 'review'` tidak
  bisa menangkapnya, karena saat itu langkahnya memang sudah 'review'.
  Terbukti: satu baris `case_studies` tercipta hanya karena tiba di layar
  review. Sekarang kedua tombol `type="button"` dengan `key` berbeda.
- **`requestAnimationFrame` tidak pernah jalan di browser pane** (pane
  melaporkan `visibilityState: "hidden"`). Fokus setelah lompat dulu memakai
  rAF dan diam-diam tidak melakukan apa pun di pane — DOM-nya terlihat benar.
  Dipindah ke `useEffect`, yang jalan setelah commit apa pun keadaannya.
- **Ref-click di browser pane meleset kalau viewport di-resize lebih besar
  dari pane.** Pane menskalakan frame (mis. 1280×1800 → 800×450) dan koordinat
  hasil resolusi ref jatuh di luar frame. Terbaca seperti "tombolnya rusak".
  Pakai ukuran default, atau gulir kontainer lewat JS lalu klik.

---

## Peta file — orientasi cepat

| Jalur | Isi |
|---|---|
| `check-revision-prompt.md` | **Spec revisi. Sumber kebenaran untuk semua fase.** |
| `lib/case-study-blocks.ts` | Schema blok + 8 aturan validasi. Kontrak antara agent dan renderer |
| `lib/fixtures/case-study-fixture.ts` | Case study buatan tangan untuk menguji renderer tanpa agent |
| `components/case-study/CaseStudyDocument.tsx` | Perakitan halaman 7 bagian + sticky nav dari spine |
| `components/case-study/blocks.tsx` | Satu komponen per tipe blok, termasuk cycle diagram SVG |
| `app/fixture/page.tsx` | Route dev-only untuk melihat renderer |
| `lib/intake-fields.ts` | Field wizard. **Label di sini ikut masuk ke prompt** |
| `lib/launch-mode.ts` | `EARLY_ACCESS_MODE` + `DEMO_URL` — satu-satunya sakelar pra-rilis |
| `lib/waitlist.ts` | Opsi + validasi survei, dipakai bersama form dan `/api/waitlist` |
| `lib/agents/prompts.ts` | **Prompt.** Tone brief, delapan gerakan copywriter, daftar terlarang, kontrak blok. Lever terbesar atas kualitas output |
| `lib/agents/pipeline.ts` | Orkestrasi: extraction → synthesis → validate → QA → retry |
| `lib/agents/parse.ts` | Ambil JSON dari respons model + deteksi truncation. Murni, diuji |
| `lib/agents/client.ts` | Panggilan Anthropic + pencatatan `agent_runs` |
| `app/api/compile/route.ts` | Rate limit · claim · pipeline · tulis dokumen |
| `app/fixture/page.tsx` | Fixture, **dan `?id=` untuk melihat dokumen sungguhan** (dev-only) |
| `lib/wizard-steps.ts` | **Semua logika murni wizard**: urutan langkah, `buildIntake()`, aturan "thin", agregasi review, dan seluruh copy yang dikunci spec |
| `components/intake/IntakeForm.tsx` | Wizard 5 langkah + review. Pemilik seluruh state; langkahnya presentational |
| `components/intake/steps/` | Satu berkas per langkah, plus `ReviewScreen.tsx` |
| `components/intake/FieldRow.tsx` · `ChoiceField.tsx` | Kontrol bersama; `ChoiceField` juga dipakai modal early access |
| `components/landing/EarlyAccessModal.tsx` | Modal waitlist, di-portal ke `document.body` |
| `supabase/migrations/0001–0013` | Semuanya applied di project live |

---

## SISA PEKERJAAN — build order dari spec

Urutannya sengaja: schema adalah kontrak, dan renderer yang terbukti di fixture
memberi tahu apakah outputnya cukup bagus **sebelum satu token pun dibelanjakan**.

### 1. ~~Phase 1 — schema + validator~~ SELESAI (`b8d80f9`)
### 2. ~~Phase 5 — renderer diuji fixture~~ SELESAI (`62c4dac`)

### 3. ~~Phase 2 — restrukturisasi wizard~~ SELESAI

Wizard 2 langkah jadi **5 langkah + layar review**. Yang perlu diketahui
sebelum menyentuhnya lagi:

- **Bentuk `Intake` berubah total** dan setiap field teks kini **opsional** —
  spec melarang memblokir "next", jadi apa pun boleh kosong saat submit. Cast
  `as unknown as Intake` yang lama diganti `buildIntake()` di
  `lib/wizard-steps.ts`, satu-satunya penulis kolom `intake`.
- **Step 3 adalah decision unit**, sumber spine. `decisions[]` membawa `id`
  yang akan jadi `SpineEntry.id` di Phase 4.
- **Step 4 dilewati** kalau tidak ada gambar, di kedua arah. Catatan gambar
  dibawa per-id attachment di dalam wizard dan baru diratakan jadi
  `orderIndex` saat submit, supaya menghapus satu layar tidak menggeser
  catatan ke gambar yang salah.
- **Tone tetap 5 chip.** Pemangkasan spec jadi Direct/Warm/Analytical ditunda
  — `analytical` butuh migration untuk CHECK constraint `tone` di 0003, dan
  constraint-nya harus **dilebarkan**, bukan disempitkan (baris lama memakai
  nilai lama). Lihat AGENTS.md § Tone + project type.
- **Segel `EARLY_ACCESS_MODE` pindah.** Dulu satu tombol Next; sekarang tiga
  lapis di `handleSubmit` + tombol tulis. Orang kini bisa berjalan sampai
  layar review saat mode tertutup — disengaja, sesuai niat "wizard tetap bisa
  diisi supaya pengunjung melihat apa yang diminta produk".
- `handleCreated` di `IntakeFlow.tsx` **masih dead end**. Submit sekarang
  benar-benar menulis baris, lalu tombolnya berhenti di "Working…" selamanya
  karena tidak ada tujuan. Phase 4 yang menyambungkannya.

### 4. ~~Phase 4 — pipeline agent~~ SELESAI (dengan tiga catatan)

Tiga agent, bukan empat. **Interviewer sengaja tidak dibangun** — tugasnya
menggerakkan probe adaptif di dalam wizard, dan UI itu baru ada di Phase 3.
Membangunnya sekarang berarti membuat sesuatu tanpa konsumen.

Yang ada: `lib/agents/` (client · prompts · parse · pipeline),
`/api/compile`, migration 0014 (`case_studies.document` + tabel `agent_runs`),
dan `/fixture?id=` untuk melihat dokumen sungguhan.

**Tiga temuan dari run sungguhan — baca sebelum menyentuh pipeline:**

1. **Anggaran waktu nyaris habis.** Compile pertama yang berhasil memakai
   **ketiga attempt** dan berjalan **~4 menit** (synthesis 48–58 detik per
   attempt, QA ~20 detik). Plafon Vercel Hobby **300 detik**. Itu belum
   termasuk vision pass. Pilihannya: turunkan `MAX_SYNTHESIS_ATTEMPTS` jadi 2,
   longgarkan QA supaya tidak selalu menemukan sesuatu, atau pindahkan compile
   ke background job. **Harus diputuskan sebelum deploy.**
2. **QA menemukan masalah di setiap attempt.** Tidak pernah lolos bersih, jadi
   setiap compile membayar harga maksimum. Prompt QA sudah menyuruh jangan
   mengarang temuan; jelas belum cukup. Belum sempat dituning — kredit habis.
3. **Kredit Anthropic habis di tengah run.** QA terakhir balas
   `credit balance is too low`. Pipeline menangani itu dengan benar (dokumen
   tetap tersimpan tanpa flag, sesuai desain), tapi tidak ada yang bisa
   dijalankan lagi sampai diisi.

**Biaya terukur** untuk satu compile berhasil (3 keputusan, tanpa gambar):
opus 15.391 token masuk / 12.081 keluar, sonnet 8.718 masuk / 3.494 keluar.
Semuanya tercatat per panggilan di `agent_runs` — itu tabelnya ada.

**Artefak yang sengaja ditinggal**: case study `47bb55c8-eee8-47c6-9214-573c57c34ab9`
berstatus `preview` dengan dokumen asli hasil pipeline. Bukan sampah uji —
Phase 6 butuh sesuatu yang nyata untuk dirender. Lihat lewat
`/fixture?id=47bb55c8-eee8-47c6-9214-573c57c34ab9`.

### 5. Phase 6 — editor per-blok + route baca  ⟵ MULAI DARI SINI

Detail di spec § Phase 6. Keputusan yang masih terbuka dan **harus diambil di
sana, bukan dikarang**: blok mana yang tampil sebelum bayar (AGENTS.md baris
"Free preview" sengaja kosong).

### 6. Phase 3 — adaptive probing

Detail di spec § Phase 3. Ringkasnya: interviewer agent memancing jawaban yang
lebih spesifik **lewat contoh, bukan lewat tuntutan**, maksimum dua probe per
pertanyaan, inline di bawah field, dan **tidak pernah menampilkan skor**.

Ini satu-satunya bagian Phase 4 yang sengaja tidak dibangun — agent
Interviewer tidak punya konsumen sampai UI ini ada.

`isThin()` di `lib/wizard-steps.ts` sengaja bodoh (kosong atau di bawah ambang
kata) dan cuma dipakai layar review. Daftar frasa generik yang diminta spec
("improve UX", "modern look", "user-friendly") belum ada di mana pun.


### 7. Sisa yang tidak terikat fase

- Rate limit `/api/waitlist` — endpoint publik tanpa penahan
- **Satu** tautan nav mati: `#examples`. `Features` sudah punya halaman asli
  (`/features`). Halaman contoh butuh case study publik, yang belum bisa ada
  sampai Phase 6 membangun route bacanya
- Top bar di HP tinggal wordmark
- Race auth pada request bersamaan (terlihat dua kali)
- Metadata Stripe pada transaksi sungguhan

---

## ⚠️ Bagian di bawah ini USANG — ditulis untuk produk genre lama

Fase F / G / H di bawah dirancang untuk produk **sales collateral** dengan
narrative 8-section yang sudah dihapus. **Jangan dikerjakan apa adanya.**

Sebagian niatnya masih berlaku dan layak diangkat ke fase baru:
- **Halaman contoh publik** (Fase H) — produk ini masih belum punya bukti
  publik sama sekali, dan `Real examples` di nav masih menunjuk ke ketiadaan.
- **Pernyataan privasi + byline** (Fase H) — masih relevan.
- **Prompt regression fixtures** (Fase H) — idenya sudah sebagian terwujud di
  `lib/fixtures/`, tinggal diperluas saat Phase 4 ada.

Sisanya (review agent Fase F, loop verifikasi Fase G) mengasumsikan alur yang
sudah tidak ada. Dibiarkan sebagai catatan sejarah, bukan sebagai rencana.

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
4. **Email / custom SMTP** — WAJIB sebelum user sungguhan. Sender bawaan
   Supabase dibatasi **2 email per jam untuk seluruh project**, dan Supabase
   sendiri menyatakan itu bukan untuk produksi. Magic link adalah jalur login
   default, jadi tanpa ini orang ketiga yang mendaftar dalam satu jam tidak
   menerima apa pun — dan tidak ada error yang muncul di mana pun.

   Provider yang dipilih: **Resend** (free tier 3.000/bulan, 100/hari).
   Langkahnya, semuanya di dashboard — tidak ada perubahan kode:

   1. resend.com → Domains → Add Domain → pasang record DNS yang ditampilkan
      (DKIM + SPF), tunggu verified.
   2. API Keys → buat satu key.
   3. Supabase → Authentication → SMTP Settings → Enable Custom SMTP:
      - Host `smtp.resend.com`
      - Port `465` (SMTPS) atau `587` (STARTTLS)
      - Username `resend`
      - Password = API key dari langkah 2
      - Sender email harus di domain yang sudah terverifikasi
   4. Supabase → Authentication → Rate Limits → naikkan dari default 30/jam
      sesuai kebutuhan.

   Verifikasi: kirim magic link ke alamat di luar domain sendiri (Gmail),
   pastikan masuk **inbox** bukan spam, lalu cek header `DKIM=pass` dan
   `SPF=pass`. Mendarat di spam sama buruknya dengan tidak terkirim.

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

- Login toast ("Signed in. 1 free credit added") kadang tidak visible di
  screenshot — hydration timing / z-index. Logic benar (state + timer OK).
- ~~Progress bar `/writing/[id]`~~ dan ~~sticky CTA truncate~~ — keduanya ikut
  terhapus bersama jalur lama. Tidak relevan lagi.
- `#examples` masih mati. `Features` sudah dibereskan — lihat di bawah.
- Top bar di HP tinggal wordmark: tautan nav tersembunyi di bawah `sm` dan Buy
  credit juga hilang. **`SiteFooter` sekarang menutupi sebagian**: ia render
  `sm:hidden` di landing, jadi `/features` tetap terjangkau di HP. Top bar-nya
  sendiri belum disentuh dan masih tidak punya menu hamburger.

## Reference files (di project root)

- `check-revision-prompt.md` — **spec revisi. Sumber kebenaran untuk semua
  pekerjaan sekarang.** Semua fase merujuk ke sini.
- `AGENTS.md` — arsitektur, keputusan terkunci, environment gotchas.
- `README.md` — pintu depan repo; memimpin dengan status pra-rilis, karena
  "tombol wizard tidak melakukan apa-apa" adalah hal pertama yang akan dikira
  bug oleh orang baru.
- `supabase/migrations/0001-0013.sql` — semua applied di project live.
- `.env.local.example` — nama env var (nilainya di `.env.local`, gitignored).
- `HANDOFF.md` — file ini (status + sisa pekerjaan).

## Session log

Session Aug 20–27, 2026 — perbaikan jalur uang, lalu PIVOT GENRE:
- **Jalur uang.** Bug urutan di webhook diperbaiki (kredit dulu, catat
  kemudian). Migration 0010 menutup celah double-credit.
- **Compile.** Diukur pertama kali: ~150 detik. Guard idempotensi berlubang
  selebar itu; migration 0012 `claim_compile` + `maxDuration` + retry sadar
  anggaran waktu.
- **Kualitas output.** Tiga keluhan direproduksi pada output asli. Akarnya:
  prompt Reflection secara harfiah meminta nasihat umum. Ditulis ulang +
  field `voice_sample`. Terukur 2.209 → 1.657 kata.
- **Early access.** Tabel `waitlist`, modal, `lib/launch-mode.ts` sebagai satu
  sakelar pra-rilis. Landing dirapikan jadi satu ajakan.
- **Repo dipindah** ke organization `JetDesigns`.
- **PIVOT GENRE** (25 Agt) mengikuti `check-revision-prompt.md`. Phase 1
  (schema, 43 test, vitest dari nol) dan Phase 5 (renderer + fixture) selesai.
  Survei waitlist dipindah ke genre baru dengan penanda `survey_version`.
- **Jalur lama dihapus** (27 Agt): `/api/compile`, `/api/edit`, `/c/[id]`,
  `/writing/[id]`, `lib/narrative.ts`, tipe narrative 8-section.

