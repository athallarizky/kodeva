# Kodeva — Software UMKM (Apparatus Riset)

> Take-home test **PT Digital Solusi Grup (DSG)** — Fullstack Developer — yang di-reframe menjadi **research vehicle**: implementasi hidup di production sebagai wadah pengukuran riset kalibrasi lead-scoring (JEV). Brand **"Kodeva"** fiktif: aplikasi kasir, HR & payroll, dan add-on dengan lisensi berlangganan.

**Production:** https://kodeva.athallarizky.com · **Admin CMS:** `/admin` · **Repo:** public, commit history tanpa squash (per-sprint, conventional, signed).

## Status — 5 sprint, semua CLOSED

| Sprint | Fokus | Hasil kunci |
|---|---|---|
| 1 | CMS + backend (collections, access, API, invariant kuota) | API leads/orders + unit test logika murni |
| 2 | Riset kalibrasi JEV (audit black-box) | 1.570 lead sintetis × 3 skenario; temuan di bawah |
| 3 | Frontend slicing (desain `kodeva-ui` → Next.js) | 7 route publik; Lighthouse perf 95–98 |
| 4 | UI/UX refinement (agent + design guidelines) | CLS 0.000 semua halaman; BP/SEO 100; a11y 93–96 |
| 5 | Gap closure — audit brief A/B/C poin-per-point | Semua poin brief terpenuhi (A 7/7 · B 11/11 · C 2.9/3¹) |

¹ Re-measure Lighthouse saat mesin idle tertunda — baseline sprint-4 87–93 (≥80) + indikator objektif sehat (TTFB 0.21s, 485KB, TBT ≈0, CLS 0).

UI publik lengkap: landing (hero, produk unggulan, testimoni, FAQ, form lead), katalog + filter URL, detail produk (paket/durasi/kuota), keranjang (stale-kuota lock), checkout (voucher + simulasi sukses/gagal), blog (list + detail + produk terkait).

## Alasan pemilihan CMS: Payload 3 (embedded)

Kebutuhan: konten landing/blog/produk editable non-teknis, draft/publish, relasi artikel↔produk, dan **satu deploy serverless**. Perbandingan yang saya lakukan:

| Opsi | Pertimbangan |
|---|---|
| **Payload 3 embedded** ✅ | Satu app Next.js — Local API tanpa HTTP hop; admin dikustom (roles admin/editor, panel riset internal); adapter Postgres first-class; draft/live-preview/revalidation native; open-source self-host (cocok Vercel). |
| Strapi | Headless terpisah → dua deploy + cold-start ganda; kustomisasi admin untuk panel riset lebih berat. |
| Sanity | Content lake hosted — bagus, tapi vendor-lock dataset; relasi produk + roles granular lebih cepat dicapai di schema Payload. |
| WordPress | Runtime PHP tidak sejalan arsitektur Next/serverless; REST plugin noise untuk kebutuhan ini. |
| Directus | Kuat untuk data-first; overhead untuk content-first berbasis blocks. |

**Trade-off yang diterima (jujur):** (1) CLI standalone Payload crash di Node 24 (bug loader tsx↔undici, [payload#13290](https://github.com/payloadcms/payload/issues/13290)) → semua lewat `next dev`/`next build`, `payload-types.ts` dikelola manual; (2) types tidak auto-generate → disiplin sinkron manual saat schema berubah.

## Strategi caching & revalidation (tanpa deploy manual)

Perubahan konten yang di-publish di CMS **tidak butuh deploy**. Strategi dua lapis:

1. **On-demand (lapis utama)** — collection memasang hook `revalidateTag('pages'|'products'|'posts', 'max')` yang menyalakannya saat **publish/update/delete di admin**. Halaman publik membaca data lewat cache bertag → cache segmen terkait langsung dibuang; request berikutnya merender konten baru. **Konsekuensi: perubahan tampil dalam hitungan detik setelah tombol Publish.**
2. **ISR fallback waktu (lapis pengaman)** — tiap route punya jendela `revalidate` (mis. katalog/produk ±5–10 menit) sehingga perubahan yang terlewat hook (mis. edit langsung via DB) tetap ter-tarik maksimal dalam jendela itu.

Draft tidak pernah tampil publik — hanya via **live preview** admin. Konsekuensi desain yang disadari: harga/kuota promo yang diedit marketing muncul seketika, tapi snapshot harga di keranjang user lama **tidak berubah** (by design — lihat Asumsi #3).

## Cara uji (panduan reviewer)

Tanpa login: jelajahi landing → katalog (filter/urut terlihat di URL) → detail produk → tambah keranjang (mentok kuota promo = dipangkas + peringatan) → checkout (voucher `KODEVA50`; radio **Sukses/Gagal** untuk melihat kedua akhir) → halaman sukses (`KDV-XXXX`). Blog: filter kategori, pagination, dan artikel menautkan **kartu modul terkait**. Tambahkan `?debug=tracking` di URL mana pun → drawer bawah menampilkan event analytics (`view_item`, `add_to_cart`, `begin_checkout`…) + tombol copy JSON.

Dengan login admin (`/admin`, akun dimiliki maintainer): edit konten landing/produk/artikel → publish → refresh halaman publik (verifikasi §revalidation). Lead yang masuk terlihat di collection **Leads** — kolom *Prioritas Dihubungi* & *Potensi Konversi* untuk tim marketing; data riset JEV terisolasi di grup internal.

## Cara run lokal

```bash
npm install
cp .env.example .env   # DATABASE_URL (Neon POOLED: host -pooler, port 6543), PAYLOAD_SECRET
npm run dev            # http://localhost:3000 · admin /admin (first-run: buat user)
npm run test           # vitest — 64 test (kuota agregat, totals/voucher, zod, math riset)
npm run build          # verifikasi pra-deploy
```

Seed konten (6 produk, 4 artikel + relasi produk, voucher, home page): login `/admin` → tombol **Seed your database** (idempoten; tidak menyentuh users).

⚠️ **Jangan jalankan CLI Payload standalone** (`payload generate:*`, `build`, `migrate`) — crash di Node 24 (RCA di atas). Penggantinya: schema tersinkron otomatis saat `next dev` (mode push), build = `next build`.

## Arsitektur & alasan

| Keputusan | Alasan singkat |
|---|---|
| **Next.js 16 (App Router) + Payload 3 embedded — satu app** | Local API tanpa HTTP hop; draft/preview, revalidation, admin dalam satu deploy |
| **Neon Postgres (pooled) + Vercel** | Serverless tidak bisa SQLite (FS ephemeral); pooler wajib untuk function concurrency |
| **Konten produk di CMS, bukan JSON statis** | Marketing mengubah harga promo/kuota tanpa developer |
| **Harga per-lisensi × qty; kuota 1 pool/produk lintas paket; pure function + test** | Satu-satunya model konsisten dengan brief; invariant agregat teruji 64 test |
| **Media di Vercel Blob** | FS serverless ephemeral; upload admin persisten + CDN |
| **UI kit + design guidelines tertulis** | Kontrak visual untuk manusia & agent (zona beku, token, CLS 0) |

## Riset JEV (sprint-2) — ringkasan temuan

Audit kalibrasi skor lead **jev-1.13.0** terhadap ground truth generator (1.570 lead unik × 3 "dunia"):

- Skor JEV **tidak terkalibrasi** — konstan ±0.42 sementara konversi nyata 6.5–20.4% (ECE 0.21–0.35), dan **buta pergeseran dunia** (bias terbesar justru di skenario harga naik).
- Koreksi **Platt 2-parameter** menurunkan ECE ke <0.02 — cukup **50 outcome berlabel** (kurva belajar mendatar setelah itu).
- **Margin** (confidence internal JEV) terbukti jujur: ρ −0.43…−0.55 terhadap error — sinyal kepercayaan yang bisa ditampilkan tanpa koreksi.

Implikasi produk: skor bersifat **advisory-only** — kolom *Potensi Konversi* menampilkan skor **terkoreksi**, tim marketing memakai urutan prioritas (🔴🟡🟢), bukan angka mentah. Panel riset: **Decision Lab** (`/admin/decision-lab`, admin-only).

## Asumsi & deviasi (jujur)

1. **Kuota promo tidak di-decrement** checkout (tidak ada transaksi nyata) — `remaining` diedit marketing.
2. **Order tidak dipersist** — `/api/orders` simulasi (delay deterministik; `simulate: success|failure` eksplisit untuk reviewer).
3. **Harga di-snapshot saat add-to-cart** — sistem nyata re-price server-side saat invoicing.
4. Anti-spam lead berlapis: zod → honeypot + minimum waktu mengisi (`elapsedMs`) → bot menerima **422 berbentuk sukses** (tidak membocorkan deteksi).
5. ID postgres Payload = integer; testimoni/FAQ = block di dokumen home (urutan drag-drop di admin).
6. Angka sosial proof (rating, "2.400+ UMKM") konten fiksi editable — bagian brand fiktif riset.

## Integration plan (naik ke produksi nyata)

| Kebutuhan | Rencana |
|---|---|
| **Payment** | Gateway (Midtrans/Xendit) di `/api/orders` + order collection + webhook status; `simulate` dihapus |
| **Kuota promo nyata** | Decrement `remaining` dalam transaksi DB saat invoice `paid` (`SELECT … FOR UPDATE`) |
| **Pengiriman lisensi** | Job queue (Payload jobs aktif) kirim email/WA activation key; email adapter terpasang |
| **Re-pricing** | Validasi snapshot vs harga terkini saat invoicing; selisih → konfirmasi ulang pembeli |
| **Atribusi lanjutan** | UTM last-touch sudah terekam per-lead; tinggal ekspor ke BI/GA4 |

## Verifikasi

- Unit: `npm run test` → **64 test** hijau (kuota agregat lintas paket — termasuk contoh kerja dokumentasi data-design, totals/voucher, zod, math riset: generator deterministik + kalibrasi)
- API manual: lead `201` valid / `400` salah format / `422` honeypot & submit cepat (berbentuk sukses); order `201` paid / `402` gagal / `409` kuota + detail `violations`
- Lighthouse mobile (post-sprint-4): perf **87–93**, CLS **0.000**, Best Practices & SEO **100**, Aksesibilitas **93–96**
- Checklist matriks state (loading/kosong/error/gagal-bayar) terpenuhi di semua layar

## Dokumentasi proses

Sprint planning, design docs final, dan RCA hidup di handbook terpisah (zero-leakage). Jejak keputusan harian: `AI_LOG.md` — termasuk **14 entri "AI salah + verifikasi"** (hipotesis salah, bug runner, build lokal ≠ Vercel, aset visual tanpa audit visual, ukur performa di mesin sibuk, dst).
