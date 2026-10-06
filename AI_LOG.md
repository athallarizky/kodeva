# AI_LOG — Kodeva (DSG Fullstack Skill Test)

> Log penggunaan AI tools selama pengerjaan. **Di-update live saat kejadian, bukan direkonstruksi di akhir.**
> Riwayat sesi: **Sesi 1 (2026-10-05 → 06)** — planning sprint-0, scaffold, RCA loader. **Sesi 2 (2026-10-06)** — sprint-2 JEV audit (generator, real client, Decision Lab, iterasi UX marketing). Sesi berikutnya **menambah** entri baru; jangan menimpa yang lama.

## 1. Tools & pemakaiannya
| Tool | Dipakai untuk |
|------|---------------|
| Claude Code (agent CLI) | Decoding brief & rubrik penilaian, brainstorm arsitektur & trade-off, penulisan dokumen perencanaan, pair-programming implementasi |
| context7 (MCP docs) | Verifikasi API Real Jev dari docs.typesafe.ai (endpoint `/v1/systemone`, format `state`/`questions`, blok noul+choice) sebelum menulis client — bukan dari ingatan training |
| Playbook `real-world-analogy` | Penjelasan konsep riset ke pemilik produk (apa itu lead scoring, payload JEV, Platt scaling) tanpa jargon |

## 2. Prompt yang paling membantu
1. *"Decode rubrik ini — apa yang sebenarnya dinilai?"* → menemukan docs+AI log (20) + validasi (20) ≥ fitur (25); mengubah prioritas total: polish & dokumentasi sebelum fitur baru.
2. *"Bandingkan Payload embedded vs standalone dengan pattern portfolio saya sendiri"* → keputusan satu-app monolith; pengecekan langsung ke `portfolio/backend` (SQLite + `payload.db`) membuktikan kenapa serverless butuh DB eksternal.
3. *"Bagaimana dengan portfolio?"* (bersama *"why we need neon?"*) → pertanyaan pendek yang memaksa verifikasi ke codebase nyata: inspeksi `portfolio/backend` menemukan `@payloadcms/db-sqlite` + `payload.db` + 17 file backup manual + komentar "for production Postgres" — menutup debat arsitektur DB dengan bukti, bukan opini, dalam satu langkah.
4. *"cek using context7: docs.typesafe.ai"* (Sesi 2) → kontrak API Real Jev diambil dari docs resmi sebelum koding, bukan direka — field `state.lead_form_submission`, dua pertanyaan (noul `will_buy` + choice `product_of_interest`), dan jawaban `noul`/`confidence` terpetakan langsung ke `p`/`margin`.
5. *"jelaskan dengan playbook:real-world-analogy"* (Sesi 2) → memaksa penjelasan lewat analogi dunia nyata (mapping table dulu, tanpa kode) — alur form → DB → JEV → skor → tim marketing jelas tanpa istilah statistik.
6. *"marketing tidak tau apa itu JEV"* (Sesi 2, feedback iteratif) → satu kalimat feedback yang memaksa pemisahan tampilan total: kolom marketing hanya "Potensi Konversi" (0.27 / 27%), semua data riset dipindah ke grup "Data Riset (internal)" — tiga iterasi label sampai benar-benar tanpa jargon.

## 3. AI salah / kurang tepat (min. 2 — diisi SAAT KEJADIAN)
Format per entry: apa yang AI hasilkan → bagaimana ketahuan → cara perbaiki → verifikasi akhir.

### 3.1 — Tiga hipotesis AI yang salah tentang crash scaffold (2026-10-06, Phase 0)
**Apa yang AI hasilkan:** Saat `payload generate:importmap` crash `TypeError: Illegal constructor`, AI mengajukan rangkaian hipotesis: (a) "undici 7 terlalu tua, upgrade ke 8", (b) "Node 24.15 terlalu baru untuk toolchain, jalankan di 24.13.1", (c) "undici 7 polyfill `caches` bermasalah, mundur ke undici 6".
**Bagaimana ketahuan:** Ketiganya diuji satu per satu — override `undici@^8.11.2`: crash identik; `nvm use 24.13.1`: crash identik; override `undici@6.29.0`: crash di webidl guard *berbeda* (`fetch/webidl.js` vs `web/webidl/index.js`) — justru membuktikan mekanisme sebenarnya: loader tsx yang mentransformasi undici, bukan versinya.
**Cara perbaiki:** Baca issue upstream ([payload#13290](https://github.com/payloadcms/payload/issues/13290)) + grep rantai import (`payload/dist/index.js → uploads/safeFetch.js → undici`, eager) → root cause: tsx CJS transform merusak webidl brand-check undici.
**Verifikasi akhir:** `next dev` dijalankan → *Ready in 426ms* tanpa crash → kerusakan terkonfirmasi hanya di CLI standalone Payload; build script diganti `next build`, CLI dibypass. RCA lengkap: `docs/sprint-1/rca/` (handbook). Dua hipotesis pertama murni red herring yang tercatat di timeline RCA.

### 3.2 — Interpretasi salah error pertama (2026-10-06)
**Apa yang AI hasilkan:** Error `get-tsconfig … null` saat `npx payload generate:importmap` diinterpretasikan sebagai masalah tsconfig project; siap men-debug tsconfig.
**Bagaimana ketahuan:** Stack trace menunjuk `~/.npm/_npx/...` — perintah berjalan dari cache npx di cwd yang salah, bukan dari project.
**Cara perbaiki:** Selalu panggil binary lokal `./node_modules/.bin/payload` dari root project.
**Verifikasi akhir:** Error berubah (module Categories) → terbukti interpreternya yang salah, bukan tsconfig.

### 3.3 — Asumsi scaffold bisa jalan headless (2026-10-06)
**Apa yang AI hasilkan:** Rencana `create-payload-app -t website --use-npm --no-agent` dengan asumsi flag lengkap = non-interaktif. Asumsi tidak diverifikasi sebelum dijalankan.
**Bagaimana ketahuan:** TUI clack crash `uv_tty_init returned EINVAL` — scaffolder memang butuh TTY, tidak ada fallback headless.
**Cara perbaiki:** Jalur manual deterministik: `create-next-app --yes` (full flag) + salin `templates/website` dari repo resmi payload (sparse-clone) + swap adapter mongo→postgres + instal dep template dengan versi rilis (bukan `workspace:*`).
**Verifikasi akhir:** struktur file identik dengan template; `next dev` boot bersih.

### 3.4 — npm override menabrak direct dependency (2026-10-06)
**Apa yang AI hasilkan:** `"overrides": { "tsx": "4.23.15" }` untuk dedupe tsx milik payload.
**Bagaimana ketahuan:** `npm error: Override for tsx@^4.23.15 conflicts with direct dependency` — override punya aturan komposisi dengan dep langsung yang tidak diperiksa dulu.
**Cara perbaiki:** Pola terdokumentasi npm: `"tsx": "$tsx"` (mewarisi spec dependency langsung).
**Verifikasi akhir:** nested `payload/node_modules/tsx` hilang + error resolusi module pada `generate:importmap` berganti error berikutnya (progres, bukan regresi).

### 3.5 — Scaffold dari branch main + verifikasi berhenti di "Ready" (2026-10-06)
**Apa yang AI hasilkan:** Scaffold sprint-0 menyalin `templates/website` dari branch default (main) repo payload — bukan tag v3.90.2 yang cocok dengan paket npm — dan mempertahankan `tsconfig.json` hasil create-next-app tanpa meng-merge `paths` template. Laporan "next dev sehat" dibuat hanya dari "Ready in 426ms".
**Bagaimana ketahuan:** Setelah `DATABASE_URL` Neon terisi, curl pertama ke `/` dan `/admin` → 500 semua: `Can't resolve '@payload-config'` (alias tsconfig tidak ada) + `HierarchyButton`/`generatePayloadViewport` tidak ada di `@payloadcms/*@3.90.2` (API main yang belum dirilis; `npm view` membuktikan `latest` = 3.90.2 sehingga tidak ada jalur upgrade stabil).
**Cara perbaiki:** Sparse-clone ulang di **tag v3.90.2** → `diff -rq` (±50 file drift → replace-wholesale, bukan tambal per-file) → ganti `src/` (keep favicon) → pasang ulang adapter postgres + 3 path tsconfig + `next.config.ts` template.
**Verifikasi akhir:** `GET /` 200 + `GET /admin` 200, log `Pulling schema from database ✓` (push schema ke Neon sukses), title kedua halaman render benar. RCA: `docs/sprint-1/rca/2026-10-06-scaffold-template-main-vs-tag-mismatch.md` (handbook).

### 3.6 — Dev dijalankan background saat drizzle push bertanya interaktif (2026-10-06, Phase 1.1)
**Apa yang AI hasilkan:** Setelah drop 3 plugin + tambah 3 collections, AI menjalankan `npm run dev` sebagai background process dan meninggalkannya — padahal mode `push` drizzle-kit mengeluarkan prompt interaktif ("create or rename enum/table?") yang menunggu jawaban. Beberapa siklus restart brutal di tengah prompt meninggalkan state schema setengah-teraplikasi.
**Bagaimana ketahuan:** Request hang 90–117 detik lalu `payloadInitError: constraint "payload_locked_documents_rels_forms_fk" does not exist` — run berikutnya berasumsi constraint lama masih ada. Inspeksi `information_schema` via node+pg membuktikan diff tersisa: kolom `forms_id/form_submissions_id/search_id` masih ada, `products_id/leads_id/vouchers_id` belum.
**Cara perbaiki:** (1) prompt bisa dijawab di PTY palsu: `script -q /dev/null` + kirim `\r` berkala; (2) sisa diff diselesaikan manual via SQL idempoten (ADD/DROP COLUMN + DROP TYPE) — lengkap di RCA §6.
**Verifikasi akhir:** boot berikutnya `Pulling schema ✓` tanpa prompt; `/admin`, `/api/products`, `/api/vouchers` 200; `/api/leads` 403 untuk anonim (access control bekerja); `tsc --noEmit` + `next build` lulus. RCA: `docs/sprint-1/rca/2026-10-06-drizzle-push-interactive-prompt.md` (handbook). Bonus temuan: ID postgres Payload = **integer** — desain cart (`productId: number`) ternyata tepat.

### 3.7 — Validasi honeypot ditaruh di layer yang salah (2026-10-06, Phase 4.2)
**Apa yang AI hasilkan:** `leadInputSchema` memakai `honeypot: z.string().max(0)` — menolak honeypot non-kosong langsung di zod (layer 1).
**Bagaimana ketahuan:** Uji curl cabang anti-spam: honeypot terisi balas **400** dengan pesan validasi, bukan **422 berbentuk sukses** sesuai kontrak — respons 400 justru memberi tahu bot bahwa ia terdeteksi (kontrak api-contract §2 langkah 2 eksplisit soal ini).
**Cara perbaiki:** Schema menerima string hingga 500 char; kekosongan diperiksa HANYA di route sebagai langkah anti-spam (422 `{"ok":true,"leadId":null}` + log). Test schemas menulis regresi ini secara eksplisit ("honeypot non-kosong tetap lolos zod").
**Verifikasi akhir:** curl ulang → `{"ok":true,"leadId":null}` status 422; 7 cabang API leads/orders hijau semua.

### 3.8 — Ambang prioritas dipilih dari sebaran skor mentah, tak memperhitungkan kompresi Platt (2026-10-06, sprint-2 P3)
**Apa yang AI hasilkan:** `priorityTier` memakai ambang 0.35/0.20 yang dipilih dari sebaran `p` mentah noul (0.23–0.48) — tanpa mengecek dampak Platt scaling yang akan memampatkan skor.
**Bagaimana ketahuan:** Setelah tombol Platt diterapkan, pPlatt maksimum hanya 0.269 → ambang 0.35 tak akan pernah tercapai; tier 🔴 Tinggi tidak akan pernah muncul lagi untuk data historis.
**Cara perbaiki:** Kalibrasi ulang ambang ke 0.25/0.15 berdasarkan sebaran pPlatt aktual (dan `applyPlatt` me-retier ulang setiap lead saat menulis pPlatt).
**Verifikasi akhir:** Lead dengan pPlatt ≥ 0.25 kini tampil 🔴 Tinggi; kolom prioritas konsisten dengan skor tampilan.

### 3.9 — Asumsi `label: false` menyembunyikan field bertingkat di admin UI (2026-10-06, sprint-2 P3)
**Apa yang AI hasilkan:** Memindahkan kolom skor ke dalam group `jev` dengan variasi `label:false`/label custom, berasumsi tampilan mengikuti label field seperti di top-level.
**Bagaimana ketahuan:** Admin UI merender path bertingkat — muncul "jev > Potensi Konversi"; `label:false` justru fallback ke path nested, bukan menyembunyikannya.
**Cara perbaiki:** Field `potensiKonversi` top-level readOnly (nilai efektif = `pPlatt ?? p`, dibulatkan `roundScore` 2 desimal — desimal mentah `0.2689672942506036` juga dikeluhkan user), group riset dinamai ulang "Data Riset (internal)".
**Verifikasi akhir:** Kolom marketing bersih "Potensi Konversi 0.27"; 8 field riset terisolasi di grup internal.

### 3.10 — Platt scaling difit dari campuran engine mock+real (2026-10-06, sprint-2 P3)
**Apa yang AI hasilkan:** `applyPlatt` default tanpa filter — tombol Platt di Decision Lab meng-fit kurva dari SEMUA lead terskor (mock + real tercampur dalam satu regresi), padahal bias kedua engine berbeda karakter.
**Bagaimana ketahuan:** Review pasca-implementasi: parameter A/B hasil campuran tidak valid untuk engine mana pun; endpoint metrics sudah mengelompokkan per skenario×model, tapi tombol tidak memakai filter itu.
**Cara perbaiki:** (masuk P4, tercatat di handbook) pisahkan fit per-engine — `applyPlatt` dipanggil dengan filter `model`, UI satu tombol per engine.
**Verifikasi akhir:** Belum diverifikasi — sengaja dicatat terbuka di sini dan di daftar kerja P4, bukan didiamkan.

### 3.11 — Runner background memakai $RANDOM zsh yang mengevaluasi konstan (2026-10-06, sprint-2 P4)
**Apa yang AI hasilkan:** Script runner matrix (`zsh` + curl loop) men-generate salt per batch dengan `$((RANDOM % 10000))` di dalam command substitution, berasumsi tiap iterasi menghasilkan angka baru.
**Bagaimana ketahuan:** Script cek matrix menunjukkan semua 11 batch tercatat salt=7940 — semua panggilan memakai salt identik. Konsekuensi: tiap skenario me-regenerasi lead yang SAMA berkali-kali (generator deterministik dari seed) — 1.590 baris ternyata hanya 770 lead unik. Terdeteksi dari anomali tabel batch, bukan dari output runner (runner melaporkan "scoredOk:100" seolah sehat — pseudo-replikasi tak terlihat dari metrik per-run).
**Cara perbaiki:** (1) dedup DB: sisakan id terkecil per (skenario, seed) — 820 baris duplikat dihapus; (2) runner ulang dengan salt EKSPLISIT berurutan (8001, 8002, …) yang mustahil tabrakan; (3) tambah script `check-dupes` sebagai gerbang verifikasi sebelum analisis.
**Verifikasi akhir:** setelah top-up, `check-dupes` = nol duplikat dan hitungan unik ≥500/skenario; kesimpulan riset hanya diambil dari data terverifikasi unik.

### 3.12 — Optimasi Lighthouse lolos build lokal, gagal build Vercel (2026-10-06, sprint-3)
**Apa yang AI hasilkan:** Lazy-load `AdminBar` via `next/dynamic(..., { ssr: false })` langsung di `layout.tsx` (Server Component) untuk menurunkan Lighthouse 79→96. Verifikasi: `next build` lokal **lolos** → langsung acp + deploy.
**Bagaimana ketahuan:** Build Vercel gagal — `ssr: false is not allowed with next/dynamic in Server Components`. Build lokal (Turbopack) ternyata lebih longgar daripada pipeline build Vercel; "build lokal hijau" bukan bukti build produksi hijau.
**Cara perbaiki:** Bungkus di Client Component kecil (`AdminBar/Lazy.tsx` ber-'use client' + dynamic ssr:false), layout tinggal import. Verifikasi ulang: clean build lokal (`rm -rf .next`) + deploy → Ready.
**Verifikasi akhir:** production semua route 200 (deploy `nf5mci430`); Lighthouse tetap 95–98. Proses baru: setelah acp yang menyentuh build config/komponen server, deploy CLI dilakukan SEBELUM menganggap selesai (bukan setelahnya), karena git integration sedang mati.

## 4. Implementasi yang banyak dibantu AI + edge case yang diuji
- **Scaffold & wiring (sprint-1 Phase 0.1, 2026-10-06):** merge template resmi + swap adapter postgres + resolusi dependency (dedupe tsx). Edge yang diuji: boot `next dev` (lulus), perintah CLI payload standalone (gagal → RCA + bypass strategis), 3 varian undici × 2 versi Node (gagal konsisten — memuluskan isolasi penyebab ke loader, bukan versi).
- **Collections + access + seed (Phase 1, 2026-10-06):** schema products/leads/vouchers, roles admin/editor, seed konten dengan gambar digenerate SVG→PNG (edge: `&` harus di-escape di XML SVG — "HR & Payroll" membatalkan sharp). Akses diverifikasi via API anonim (leads/users 403, vouchers 200).
- **Invariant kuota + API (Phase 4.2/5.3/7.1, 2026-10-06):** pure functions + 41 unit test — edge yang diuji: agregat lintas paket & durasi, stale kuota (melanggar = block, bukan auto-clamp), voucher nominal di-cap subtotal, percent di-floor, minSpend, harga float ditolak zod. Uji manual 7 cabang API termasuk 409 kuota dengan `violations` detail.
- **JEV audit foundation (sprint-2 P1–P3, 2026-10-06):** generator ground-truth (mulberry32, koefisien β, outcome Bernoulli), MockJevClient sebagai positive control (eceTrue 0.0079 membuktikan instrumen ukur benar sebelum menyentuh API berbayar), RealJevClient, pipeline live scoring di `/api/leads`, Decision Lab, calibration math (ECE/Brier/Platt/learning-curve/Spearman). Edge yang diuji: konstruksi fixture ECE=0 (conversion rate per bin harus persis == mean p), positive-control bias nol menuntut penyebaran ke-10 bin (bin atas jarang terisi oleh sampel kecil), guard PAYG n≤200/route + n≤1000/runner, lead live end-to-end di production (p=0.43, 199ms, 🔴 panas), dan 403 `/api/jev/run` untuk akun editor (access control bekerja — bukan bug).

## 5. Bagian yang sengaja ditulis sendiri tanpa AI + alasan
- **Keputusan bisnis & scope** — reframe "research vehicle, bukan lamaran" + pelepasan deadline, arah riset JEV (lead scoring · Real Jev API), Neon go-ahead, repo public, "jangan commit /docs" (→ handbook-workflow), kapan diskusi vs eksekusi. AI menyiapkan opsi + konsekuensi; pemutusan tetap manusia.
- **Keputusan riset sprint-2** — top-up balance PAYG + kapan pakai engine real (mulai kecil n=20/50, baru bicara run besar), prinsip advisory-only (skor Jev tidak pernah memicu aksi otomatis; Jev tidak pernah melihat pTrue/outcome), dan copy final tampilan marketing (user yang menentukan teks persis: "Prioritas Dihubungi", "Potensi Konversi", format "0.27 (27%)"). AI mengusulkan struktur; bahasa akhir milik manusia.
- *(target: pure functions `quota.ts` + test-nya ditulis manual dulu, AI hanya review — alasan & hasil dicatat di sini; sprint-1 lewat tanpa sempat, kebiasaan ini dibawa ke sprint slicing)*
