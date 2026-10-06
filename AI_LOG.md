# AI_LOG — Kodeva (DSG Fullstack Skill Test)

> Log penggunaan AI tools selama pengerjaan. **Di-update live saat kejadian, bukan direkonstruksi di akhir.**
> Riwayat sesi: **Sesi 1 (2026-10-05 → 06)** — planning sprint-0, scaffold, RCA loader. Sesi berikutnya **menambah** entri baru; jangan menimpa yang lama.

## 1. Tools & pemakaiannya
| Tool | Dipakai untuk |
|------|---------------|
| Claude Code (agent CLI) | Decoding brief & rubrik penilaian, brainstorm arsitektur & trade-off, penulisan dokumen perencanaan, pair-programming implementasi |
| (update saat ada tool lain) | |

## 2. Prompt yang paling membantu
1. *"Decode rubrik ini — apa yang sebenarnya dinilai?"* → menemukan docs+AI log (20) + validasi (20) ≥ fitur (25); mengubah prioritas total: polish & dokumentasi sebelum fitur baru.
2. *"Bandingkan Payload embedded vs standalone dengan pattern portfolio saya sendiri"* → keputusan satu-app monolith; pengecekan langsung ke `portfolio/backend` (SQLite + `payload.db`) membuktikan kenapa serverless butuh DB eksternal.
3. *"Bagaimana dengan portfolio?"* (bersama *"why we need neon?"*) → pertanyaan pendek yang memaksa verifikasi ke codebase nyata: inspeksi `portfolio/backend` menemukan `@payloadcms/db-sqlite` + `payload.db` + 17 file backup manual + komentar "for production Postgres" — menutup debat arsitektur DB dengan bukti, bukan opini, dalam satu langkah.

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

## 4. Implementasi yang banyak dibantu AI + edge case yang diuji
- **Scaffold & wiring (sprint-1 Phase 0.1, 2026-10-06):** merge template resmi + swap adapter postgres + resolusi dependency (dedupe tsx). Edge yang diuji: boot `next dev` (lulus), perintah CLI payload standalone (gagal → RCA + bypass strategis), 3 varian undici × 2 versi Node (gagal konsisten — memuluskan isolasi penyebab ke loader, bukan versi).
- *(target berikutnya — sprint-1: validasi kuota agregat lintas paket + hydration keranjang persist; diisi setelah Phase 5 & 7)*

## 5. Bagian yang sengaja ditulis sendiri tanpa AI + alasan
- **Keputusan bisnis & scope** — reframe "research vehicle, bukan lamaran" + pelepasan deadline, arah riset JEV (lead scoring · Real Jev API), Neon go-ahead, repo public, "jangan commit /docs" (→ handbook-workflow), kapan diskusi vs eksekusi. AI menyiapkan opsi + konsekuensi; pemutusan tetap manusia.
- *(target: pure functions `quota.ts` + test-nya ditulis manual dulu, AI hanya review — alasan & hasil dicatat di sini)*
