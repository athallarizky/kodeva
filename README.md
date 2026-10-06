# Kodeva — Software UMKM (Apparatus Riset)

> Take-home test **PT Digital Solusi Grup (DSG)** — Fullstack Developer — yang di-reframe menjadi **research vehicle**: implementasi hidup di production sebagai wadah pengukuran riset kalibrasi lead-scoring (JEV). Brand **"Kodeva"** fiktif: aplikasi kasir, HR & payroll, dan add-on dengan lisensi berlangganan.

**Production:** https://kodeva-ochre.vercel.app · **Admin:** `/admin` · **Repo:** public, commit history tanpa squash.

## Status & scope

Sprint ini (**sprint-1**) fokus **CMS + backend non-UI**. Slicing `app/(frontend)` (blog UI, katalog/keranjang/checkout UI, form lead, tracking drawer, Lighthouse) dikerjakan di sprint berikutnya — komponen render yang ada hari ini hanya bukti wiring CMS↔halaman, bukan hasil desain final.

| Area | Status |
|---|---|
| Collections CMS (products/posts/leads/vouchers) + label Bahasa | ✅ |
| Landing via Pages+blocks (hero, produk unggulan, testimoni, FAQ, banner terjadwal) | ✅ data & renderer minimal |
| Access control (admin/editor) + media di Vercel Blob | ✅ |
| Revalidation on-demand (`revalidateTag`) + fallback waktu | ✅ |
| `POST /api/leads` (zod + honeypot/elapsed) · `POST /api/orders` (mock) | ✅ |
| Pure functions kuota/totals + cart store + **41 unit test** | ✅ |
| UI publik (katalog, cart, checkout, blog) | ⏳ sprint slicing |
| Tracking dataLayer + debug drawer · Lighthouse ≥80 | ⏳ sprint slicing |

## Cara run lokal

```bash
npm install
cp .env.example .env   # isi DATABASE_URL (Neon POOLED: host -pooler, port 6543), PAYLOAD_SECRET
npm run dev            # http://localhost:3000 · admin /admin (first-run: buat user)
npm run test           # vitest (pure functions)
npm run build          # verifikasi pra-deploy
```

Seed konten (6 produk, 4 artikel, voucher, home page): login `/admin` → tombol **Seed your database** (idempoten; tidak menyentuh users).

⚠️ **Jangan jalankan CLI Payload standalone** (`payload generate:*`, `build`, `migrate`) — crash di Node 24 (bug loader tsx↔undici, upstream [payload#13290](https://github.com/payloadcms/payload/issues/13290)). Penggantinya: importMap/types dikelola manual, schema tersinkron otomatis saat `next dev` (mode push), build = `next build`.

## Arsitektur & alasan

| Keputusan | Alasan singkat |
|---|---|
| **Next.js 16 (App Router) + Payload 3 embedded — satu app** | Local API tanpa HTTP hop; draft/preview, revalidation, dan admin dalam satu deploy; Metadata API untuk SEO/OG |
| **Neon Postgres (pooled) + Vercel** | Serverless tidak bisa SQLite (FS ephemeral); adapter postgres first-class Payload; pooler wajib untuk function concurrency |
| **Konten produk di CMS, bukan JSON statis** | Marketing mengubah harga promo/kuota mingguan tanpa developer — deviasi sadar dari "frontend only" (mock API = Local API) |
| **Harga per-lisensi × qty; kuota 1 pool/produk lintas paket; pure function + test** | Satu-satunya model konsisten dengan brief; invariant agregat diuji 41 test |
| **Media di Vercel Blob** (`@payloadcms/storage-vercel-blob`) | FS serverless ephemeral; upload admin persisten + CDN |
| **`leads.jev` dibangun sejak awal** | Antarmuka riset sprint-2 dikunci di desain — tanpa migrasi schema belakangan |
| Plugin template: keep seo+redirects, drop search/form-builder/nested-docs | Lead form = custom + zod; pencarian katalog = filter client-side; lebih sedikit moving parts |

## Asumsi & deviasi (jujur)

1. **Kuota promo tidak di-decrement** checkout (tidak ada transaksi nyata) — `remaining` angka statis yang diedit marketing.
2. **Order tidak dipersist server** — `/api/orders` simulasi (delay deterministik 1,5–3 detik per orderId; `simulate: success|failure` eksplisit).
3. **Harga di-snapshot saat add-to-cart** — sistem nyata akan re-price server-side saat invoicing.
4. Testimoni/studi kasus = konten fiksi untuk funnel riset (brand fiktif); semua editable via CMS.
5. ID postgres Payload = integer auto-increment (bukan uuid) — desain cart mengikuti.
6. Testimoni & FAQ hidup sebagai block di dokumen home (bukan collection terpisah) — urutan section bisa diatur drag-drop di admin.

## Integration plan (naik ke produksi nyata)

| Kebutuhan | Rencana |
|---|---|
| **Payment** | Tambahkan payment gateway (Misabayi/Midtrans/Xendit): `/api/orders` memanggil API gateway, simpan order collection + webhook status → update status; `simulate` dihapus |
| **Kuota promo nyata** | Decrement `promoQuota.remaining` dalam transaksi DB saat invoice `paid` (bukan saat checkout submit); concurrence via `SELECT ... FOR UPDATE` |
| **Pengiriman lisensi** | Job queue (Payload jobs sudah aktif) mengirim email/WA berisi activation key saat pembayaran sukses; email adapter perlu dipasang (saat ini null → console) |
| **Re-pricing** | Validasi server harga snapshot vs harga terkini saat invoicing; selisih → konfirmasi ulang pembeli |
| **Stok media** | Sudah production-ready (Vercel Blob); tambah image optimization pipeline bila trafik naik |

## Verifikasi

- Unit: `npm run test` → 41 test (kuota agregat lintas paket — termasuk contoh kerja dokumentasi, totals/voucher, skema zod)
- API manual: lead valid `201` / kontak salah `400` / honeypot & submit cepat `422` berbentuk sukses; order `201` paid / `402` gagal / `409` kuota dengan detail violations
- Lighthouse ≥80 mobile → dibuktikan di sprint slicing (screenshot akan ditambahkan)

## Dokumentasi proses

Sprint planning, design docs final, dan RCA hidup di handbook terpisah (zero-leakage). Jejak keputusan harian: `AI_LOG.md` (termasuk 6+ entri "AI salah + verifikasi").
