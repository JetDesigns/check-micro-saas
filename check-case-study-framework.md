# Check — Case Study Output Framework (v1)

**Core principle:** struktur output bukan template statis. Struktur adalah *hasil dari satu keputusan gate* yang diambil di awal interview, lalu section fixed vs optional ditentukan berdasarkan bukti yang benar-benar berhasil diekstrak dari user — bukan dipaksa untuk mengisi slot yang kosong.

---

## GATE 0 — Evidence Type (ditanya paling awal di interview flow)

Satu pertanyaan yang menentukan seluruh struktur di bawahnya:

> "Apakah project ini punya angka bisnis keras (revenue, funding, adoption, retention, conversion), atau dampaknya lebih ke kontribusi proses/framework/organisasi?"

- **Type A — Hard Metrics**: ada angka bisnis yang kuat dan bisa diverifikasi dari jawaban user.
- **Type B — Soft/Contribution Impact**: tidak ada angka keras (project belum ship, POC, internal tooling, dsb) — dampaknya berupa reusable asset, pergeseran cara tim/stakeholder berpikir, atau validasi arah.

Jawaban ini menentukan **posisi section Results** (lihat Placement Logic di bawah). Ini bukan preferensi user yang di-toggle manual — ini logic otomatis berdasarkan bukti yang berhasil di-extract oleh interview agent.

---

## FIXED CORE — wajib tampil, tidak bisa di-skip

### 1. Problem
- Ekstraksi: masalah bisnis, siapa yang kena dampak, kenapa penting secara bisnis (bukan cuma "UX kurang bagus").
- Overview/intro boleh digabung di sini SELAMA isinya konteks nyata (role, stakes, siapa klien/perusahaan) — bukan sekadar mengulang judul. Overview yang cuma echo judul = gagal, harus ditolak oleh structuring agent.

### 2. Approach
- Ekstraksi reasoning: trade-off yang dipertimbangkan, constraint yang ada, kenapa milih arah ini.
- **Wajib ada prompt eksplisit**: "Apakah ada framework/model/mental model yang kamu beri nama sendiri untuk masalah ini?" Ini bukan opsional — ini pertanyaan wajib di interview flow karena ini sinyal senior paling konsisten muncul di semua referensi proven (bukan sekadar describe proses, tapi mengabstraksi jadi model yang reusable).
- Kalau user tidak punya named framework, jangan dipaksa mengarang satu — cukup rapikan reasoning sebagai narasi biasa.

### 3. Solution
- Ekstraksi: apa yang dibangun, mapped balik ke Problem/Approach.
- **Wajib traceability tagging**: setiap keputusan desain yang di-input harus di-tag balik ke pain point/insight spesifik yang ia jawab (pola "Pain point addressed: X"). Ini dilakukan inline per keputusan, bukan cuma sekali di pembuka section.

### 4. Results & Reflection
- Isi: bukti dampak (angka jika Type A, kontribusi/reusable asset jika Type B) + refleksi jujur.
- **Default split**: jika evidence cukup kaya → pisahkan jadi dua beat berbeda ("Impact" lalu "Learnings/Reflection"), jangan digabung jadi satu paragraf generik. Jika evidence tipis → boleh digabung jadi satu section pendek, jangan dipaksa panjang.
- Reflection harus genuinely self-critical (apa yang akan dilakukan beda), bukan cuma "senang mengerjakan ini." Kalimat penutup yang cuma sentimental tanpa substansi = anti-pattern, harus ditolak structuring agent.

---

## OPTIONAL MODULES — muncul hanya jika evidence-nya ada

| Module | Kapan muncul | Format default |
|---|---|---|
| **Research & Insight** | Jika riset/benchmark eksternal adalah bagian dari cara user sampai ke keputusan (bukan sekadar proses standar) | Section sendiri, sebelum Approach |
| **Demo** | Jika ada prototype interaktif/live product yang worth ditunjukin | **Embed inline** di dalam Solution — JANGAN jadi nav item terpisah |
| **Credits / From the team** | Selalu boleh muncul jika ada kolaborator | Default: baris metadata singkat (Client / Team / Role) di footer — BUKAN section naratif penuh, kecuali kolaborasi itu sendiri jadi cerita central |
| **Beyond the Brief** | Jika user melakukan sesuatu di luar scope awal yang menunjukkan inisiatif | Section pendek setelah Solution, sebelum Results |

---

## PLACEMENT LOGIC — posisi section Results

| Evidence Type | Posisi Results | Alasan |
|---|---|---|
| **Type A (hard metrics)** | Segera setelah Problem/intro, SEBELUM Approach detail | Reader skeptis (recruiter, klien, investor) butuh proof-of-credibility duluan sebelum invest waktu baca proses |
| **Type B (soft/contribution)** | Di akhir, setelah Approach + Solution | Argumen "ini impact-nya" baru masuk akal setelah reader paham framework/proses yang dibangun |

---

## APPROACH — satu diagram, kalau materinya ada

Section Approach boleh membawa **satu** diagram, tidak pernah dua, dan tidak pernah di section
lain. Isinya adalah **peta produk user sendiri**: bagian-bagian produk yang mereka sebut, mana
yang mereka kerjakan, dan mana dari yang dikerjakan itu yang tidak punya preseden sama sekali.

**Kapan muncul.** Hanya kalau tiga jawaban itu ada dan cukup: minimal empat bagian yang
dikerjakan, maksimal delapan, dan minimal satu — tapi tidak lebih dari separuhnya — yang tanpa
preseden. Di bawah itu, tidak ada diagram.

**Kalau tidak muncul.** Approach tetap tampil penuh, sebagai prosa, tanpa placeholder, tanpa
frame kosong, dan tanpa kalimat yang menjelaskan ketiadaannya. Pembaca tidak boleh tahu bahwa
ada sesuatu yang tidak jadi dibuat. Tidak ada diagram lebih baik daripada diagram lemah.

**Yang tidak boleh.** Diagram yang menggambarkan proses desainer — discovery, iterasi, testing,
handoff — ditolak. Proses setiap desainer sama, jadi gambarnya akan sama di setiap project;
yang membuktikan pendekatan adalah apa yang berubah di produknya. Label juga tidak boleh
dikarang: setiap nama bagian harus nama yang user sendiri ketik.

**Catatan genre.** Dokumen teknisnya ditulis sebelum pivot 25 Agustus dan masih memakai
kerangka "business-framed". Pembacanya sekarang adalah tim hiring dan reviewer, bukan klien —
yang berubah hanya untuk siapa halaman ini ditulis, bukan satu pun angka, gate, token, atau
koordinat di dalamnya.

Spesifikasi lengkap — contract, gate, encoding, token, contoh — ada di
`APPROACH-VISUAL-PRD.md`, yang menjadi lampiran teknis dari §9
`prompts/focused-fix-output.md`.

---

## ANTI-PATTERNS — harus ditolak oleh structuring agent

- Label section vague seperti "Closing" tanpa kata yang menjanjikan hasil/refleksi eksplisit.
- "Overview" yang isinya cuma mengulang judul/tagline tanpa konteks baru.
- "Demo" sebagai nav item top-level terpisah.
- "From the team" dipaksa jadi section naratif panjang padahal cuma ada 1-2 kolaborator.
- Results & Reflection yang cuma berisi klaim sukses tanpa reflection genuine, atau sebaliknya reflection tanpa bukti dampak sama sekali.
- Section Results dipaksa ke posisi akhir untuk semua kasus tanpa mempertimbangkan Evidence Type.

---

## Catatan validasi (referensi struktur nyata yang dipakai untuk menyusun ini)

- Cove (frilo.io) — Results ditaruh segera setelah Overview, sebelum Problem dijelaskan; Credits sebagai footer metadata minimal, bukan section penuh.
- OZONE (dizramahendra.space) — Research sebagai section berdiri sendiri sebelum Approach; Outcome dipecah eksplisit jadi Impact vs Learnings; tidak ada hard KPI tapi impact tetap valid lewat reusable asset & organizational shift.
- Uniqlo case study (muhraufan.com) — Framework section named model ("Context/Visual/Action Confidence") jadi bagian terkuat; Solution section pakai traceability tag eksplisit; Closing section lemah karena hanya kalimat sentimental tanpa Results/Reflection substantif — bukti langsung dari anti-pattern di atas.

