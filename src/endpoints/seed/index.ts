import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'
import sharp from 'sharp'

// Seed konten Kodeva — angka FINAL dari docs/sprint-0/resources/data-design.md §2.
// Testimoni & FAQ defer ke Phase 2 (mereka data block, bukan collection).
// Jalankan via tombol "Seed demo data" di dashboard admin (POST /next/seed).

/* ---------- helper richtext (lexical) ---------- */
type LexicalNode = { type: any; version: number; [k: string]: unknown }
const textNode = (text: string): LexicalNode => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  version: 1,
})
const paragraph = (text: string): LexicalNode => ({
  type: 'paragraph',
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})
const heading = (text: string): LexicalNode => ({
  type: 'heading',
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  tag: 'h2',
  version: 1,
})
const root = (...children: LexicalNode[]) => ({
  root: {
    type: 'root',
    children,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

/* ---------- helper gambar placeholder (SVG → PNG via sharp) ---------- */
const PALETTE: Record<string, [string, string]> = {
  kasir: ['#1e3a8a', '#3b82f6'], // biru
  hr: ['#5b21b6', '#8b5cf6'], // ungu
  addon: ['#0f766e', '#14b8a6'], // teal
}

async function placeholderImage(label: string, category: string, subtitle: string): Promise<File> {
  const [c1, c2] = PALETTE[category] ?? PALETTE.addon
  // SVG = XML: escape semua teks yang diinterpolasi (mis. "&" di "HR & Payroll")
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const safeLabel = esc(label)
  const safeSubtitle = esc(subtitle)
  const initials = label
    .replace('Kodeva ', '')
    .split(/[ &]+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="800" height="500" fill="url(#g)"/>
  <circle cx="680" cy="80" r="180" fill="#ffffff" opacity="0.08"/>
  <circle cx="90" cy="440" r="120" fill="#ffffff" opacity="0.08"/>
  <text x="60" y="240" font-family="Helvetica,Arial,sans-serif" font-size="120" font-weight="700" fill="#ffffff" opacity="0.92">${initials}</text>
  <text x="60" y="310" font-family="Helvetica,Arial,sans-serif" font-size="34" font-weight="600" fill="#ffffff">${safeLabel}</text>
  <text x="60" y="356" font-family="Helvetica,Arial,sans-serif" font-size="22" fill="#ffffff" opacity="0.75">${safeSubtitle}</text>
  <text x="60" y="460" font-family="Helvetica,Arial,sans-serif" font-size="18" fill="#ffffff" opacity="0.55">Kodeva — Software UMKM</text>
</svg>`
  const data = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer()
  return {
    name: `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`,
    data,
    mimetype: 'image/png',
    size: data.byteLength,
  }
}

/* ---------- data produk (data-design §2 — JANGAN kira-kira) ---------- */
const PRODUCT_SEED = [
  {
    name: 'Kodeva Kasir',
    slug: 'kodeva-kasir',
    tagline: 'Aplikasi kasir lengkap untuk warung, kafe, dan retail',
    category: 'kasir' as const,
    featured: true,
    basic: { priceMonthly: 149000, originalPriceMonthly: 199000, priceYearly: 1490000 },
    pro: { priceMonthly: 299000 },
    business: { priceMonthly: 549000 },
    quota: { total: 100, remaining: 50 },
    features: [
      ['Kasir & pembayaran', 'Terima tunai, QRIS, dan kartu debit dengan struk digital otomatis.'],
      ['Manajemen stok', 'Stok berkurang otomatis tiap transaksi; peringatan saat stok menipis.'],
      ['Laporan harian', 'Ringkasan penjualan, laba kotor, dan produk terlaris dikirim setiap tutup toko.'],
      ['Multi outlet', 'Pantau semua cabang dari satu dasbor dengan akun pemilik.'],
    ],
    description:
      'Kodeva Kasir adalah aplikasi kasir (POS) untuk UMKM Indonesia. Satu lisensi mencakup satu outlet dengan pengguna tak terbatas per perangkat, laporan penjualan otomatis, dan pencatatan stok real-time. Cocok untuk warung makan, kafe, toko kelontong, hingga retail fashion — tanpa perlu hardware khusus, cukup HP atau tablet.',
  },
  {
    name: 'Kodeva HR & Payroll',
    slug: 'kodeva-hr-payroll',
    tagline: 'Kelola karyawan dan penggajian tanpa spreadsheet',
    category: 'hr' as const,
    featured: true,
    basic: { priceMonthly: 199000, originalPriceMonthly: 259000, priceYearly: 1990000 },
    pro: { priceMonthly: 349000 },
    business: { priceMonthly: 599000 },
    quota: { total: 80, remaining: 30 },
    features: [
      ['Absensi digital', 'Check-in via HP dengan lokasi, terintegrasi lembur dan shift.'],
      ['Payroll otomatis', 'Hitung gaji, potongan BPJS, dan PPh 21 sekali klik; slip dikirim via email.'],
      ['Database karyawan', 'Kontrak, dokumen, dan riwayat jabatan tersimpan rapi dan aman.'],
      ['Cuti & izin', 'Pengajuan cuti dengan approval berjenjang dan kalender tim.'],
    ],
    description:
      'Kodeva HR & Payroll memudahkan bisnis 5–200 karyawan mengelola absensi, cuti, dan penggajian dalam satu tempat. Slip gaji dibuat otomatis mengikuti komponen tunjangan dan potongan yang Anda tentukan, termasuk kalkulasi lembur sesuai ketentuan. Satu lisensi berlaku untuk satu perusahaan.',
  },
  {
    name: 'Kodeva Invoice Pro',
    slug: 'kodeva-invoice-pro',
    tagline: 'Buat dan kirim invoice profesional dalam 30 detik',
    category: 'addon' as const,
    featured: false,
    basic: { priceMonthly: 49000, originalPriceMonthly: 69000, priceYearly: 490000 },
    pro: { priceMonthly: 89000 },
    business: { priceMonthly: 149000 },
    quota: { total: 200, remaining: 120 },
    features: [
      ['Template invoice', 'Puluhan template siap pakai dengan logo dan brand warna Anda.'],
      ['Pengingat jatuh tempo', 'Reminder otomatis via WhatsApp dan email sebelum dan saat jatuh tempo.'],
      ['Rekap piutang', 'Lacak siapa yang belum bayar dan sudah berapa hari lewat tempo.'],
    ],
    description:
      'Add-on pembuatan invoice untuk pengguna Kodeva Kasir dan HR. Kirim invoice berlogo via WhatsApp dalam satu klik, pantau status dibaca, dan terima pembayaran lewat tautan pembayaran. Cocok untuk bisnis jasa dan B2B.',
  },
  {
    name: 'Kodeva Backup Cloud',
    slug: 'kodeva-backup-cloud',
    tagline: 'Cadangkan data bisnis otomatis ke cloud tiap hari',
    category: 'addon' as const,
    featured: false,
    basic: { priceMonthly: 39000, originalPriceMonthly: 59000, priceYearly: 390000 },
    pro: { priceMonthly: 75000 },
    business: { priceMonthly: 129000 },
    quota: { total: 200, remaining: 150 },
    features: [
      ['Backup otomatis harian', 'Semua data transaksi dan master disimpan ke cloud saat toko tutup.'],
      ['Pemulihan 1 klik', 'Kembalikan data ke kondisi mana pun maksimal 90 hari ke belakang.'],
      ['Enkripsi', 'Data dienkripsi saat dikirim dan disimpan (AES-256).'],
    ],
    description:
      'Add-on pencadangan otomatis untuk semua produk Kodeva. Tidak perlu lagi takut kehilangan data karena HP hilang atau laptop rusak — pemulihan cukup satu klik dari dasbor.',
  },
  {
    name: 'Kodeva WA Notifier',
    slug: 'kodeva-wa-notifier',
    tagline: 'Kirim struk, invoice, dan promo via WhatsApp otomatis',
    category: 'addon' as const,
    featured: false,
    basic: { priceMonthly: 59000, originalPriceMonthly: 79000, priceYearly: 590000 },
    pro: { priceMonthly: 99000 },
    business: { priceMonthly: 169000 },
    quota: { total: 150, remaining: 90 },
    features: [
      ['Struk via WhatsApp', 'Pelanggan menerima struk digital langsung di WhatsApp mereka.'],
      ['Blast promo', 'Kirim promo ke daftar pelanggan dengan personalisasi nama.'],
      ['Notifikasi stok', 'Beri tahu pelanggan favorit saat produk langka kembali tersedia.'],
    ],
    description:
      'Add-on notifikasi WhatsApp untuk produk Kodeva. Otomatisasi struk, invoice, ucapan terima kasih, hingga campaign promo — tanpa copy-paste manual.',
  },
  {
    name: 'Kodeva E-Faktur',
    slug: 'kodeva-e-faktur',
    tagline: 'Buat faktur pajak elektronik sesuai format DJP',
    category: 'addon' as const,
    featured: false,
    basic: { priceMonthly: 89000, originalPriceMonthly: 119000, priceYearly: 890000 },
    pro: { priceMonthly: 149000 },
    business: { priceMonthly: 249000 },
    quota: { total: 120, remaining: 60 },
    features: [
      ['Faktur pajak format DJP', 'Sesuai format e-Faktur 3.0, siap unggah ke aplikasi DJP.'],
      ['Auto NPWP lookup', 'Validasi NPWP pembeli otomatis sebelum faktur diterbitkan.'],
      ['Rekap per masa pajak', 'Ekspor daftar faktur per bulan untuk pelaporan SPT.'],
    ],
    description:
      'Add-on faktur pajak elektronik untuk bisnis PKP pengguna Kodeva. Terbitkan faktur sesuai format DJP langsung dari transaksi penjualan — tanpa input ulang dan tanpa takut salah format.',
  },
]

/* ---------- data artikel ---------- */
const CATEGORY_SEED = [
  ['Tips Usaha', 'tips-usaha'],
  ['Panduan', 'panduan'],
  ['Promo', 'promo'],
  ['Studi Kasus', 'studi-kasus'],
] as const

const POST_SEED = [
  {
    slug: 'cara-aplikasi-kasir-hemat-waktu-umkm',
    title: '5 Cara Aplikasi Kasir Menghemat Waktu UMKM Setiap Hari',
    category: 'tips-usaha',
    related: ['kodeva-kasir'],
    blocks: [
      heading('1. Tanpa hitung kembalian manual'),
      paragraph(
        'Kasir digital menghitung total dan kembalian otomatis, termasuk diskon member dan promo bundling. Yang tadinya satu-dua menit per antrean kini selesai dalam hitungan detik.',
      ),
      heading('2. Stok tercatat sendiri'),
      paragraph(
        'Setiap transaksi mengurangi stok secara otomatis. Anda berhenti kehabisan barang best-seller karena lupa mencatat di buku.',
      ),
      heading('3. Laporan siap sebelum toko tutup'),
      paragraph(
        'Rekap penjualan, laba kotor, dan produk terlaris tersusun otomatis. Pemilik tidak perlu lembur menggabungkan nota.',
      ),
      heading('4. Struk digital via WhatsApp'),
      paragraph('Struk dikirim langsung ke WhatsApp pelanggan — hemat kertas dan jadi kanal promo berikutnya.'),
      heading('5. Semua cabang dalam satu layar'),
      paragraph('Pemilik multi-outlet memantau penjualan tiap cabang real-time dari HP, di mana pun berada.'),
      paragraph(
        'Kelima penghematan ini sudah menjadi standar di Kodeva Kasir. Mulai Rp149 ribu per lisensi per bulan, Anda bisa mencobanya untuk satu outlet penuh.',
      ),
    ],
  },
  {
    slug: 'panduan-memilih-software-hr-bisnis-kecil',
    title: 'Panduan Memilih Software HR untuk Bisnis Kecil',
    category: 'panduan',
    related: ['kodeva-hr-payroll'],
    blocks: [
      heading('Mulai dari masalah paling menyita waktu'),
      paragraph(
        'Survei internal kami menemukan absensi dan payroll adalah dua aktivitas yang paling banyak menyita waktu admin di bisnis 10–50 karyawan. Pilih software yang menyelesaikan keduanya lebih dulu.',
      ),
      heading('Pastikan payroll mengikuti aturan Indonesia'),
      paragraph(
        'Kalkulasi lembur, potongan BPJS, dan PPh 21 berbeda perlakuannya. Software yang tidak menghitung otomatis justru menambah pekerjaan pengecekan.',
      ),
      heading('Hitung biaya per karyawan, bukan per fitur'),
      paragraph(
        'Bandingkan total biaya tahunan terhadap jam kerja yang dihemat. Kodeva HR & Payroll misalnya mulai Rp199 ribu per bulan untuk satu perusahaan — sering kali lebih murah dari satu hari gaji admin yang dipakai mengurus payroll manual.'),
      heading('Uji dulu dengan data nyata'),
      paragraph('Gunakan masa trial untuk memasukkan data karyawan sesungguhnya. Migrasi yang baik seharusnya selesai dalam hitungan jam, bukan minggu.'),
    ],
  },
  {
    slug: 'promo-akhir-tahun-lisensi-kasir',
    title: 'Promo Akhir Tahun: Lisensi Kasir Mulai Rp149 Ribu per Bulan',
    category: 'promo',
    related: ['kodeva-kasir', 'kodeva-invoice-pro'],
    blocks: [
      paragraph(
        'Hingga akhir tahun, Kodeva membuka kuota promo untuk paket kasir dan add-on. Harga lisensi turun hingga 25% dibanding harga normal, dengan kuota terbatas per produk.',
      ),
      heading('Cara mengambil promo'),
      paragraph(
        'Pilih produk di halaman katalog, tentukan paket (Basic, Pro, atau Business) dan jumlah lisensi yang dibutuhkan, lalu selesaikan checkout. Sisa kuota promo tampil langsung di halaman produk.',
      ),
      heading('Pertanyaan yang sering muncul'),
      paragraph(
        'Promo berlaku untuk lisensi baru maupun penambahan lisensi. Harga promo terkunci saat Anda menambahkannya ke keranjang, dan tetap berlaku untuk perpanjangan tahun pertama.',
      ),
    ],
  },
  {
    slug: 'studi-kasus-kafe-kopi-pagi',
    title: 'Studi Kasus: Kafe Kopi Pagi Naik Omzet 30% dengan Kodeva Kasir',
    category: 'studi-kasus',
    related: ['kodeva-kasir', 'kodeva-wa-notifier'],
    blocks: [
      paragraph(
        'Kafe Kopi Pagi adalah kopi shop dengan 2 outlet di Bandung. Sebelum memakai Kodeva, semua pencatatan penjualan dan stok bahan baku dilakukan manual di buku dan spreadsheet.',
      ),
      heading('Masalahnya'),
      paragraph(
        'Selisih kas hampir setiap minggu, stok susu sering habis mendadak, dan pemilik baru tahu omzet harian esok hari karena menunggu rekap manual.',
      ),
      heading('Setelah 3 bulan memakai Kodeva'),
      paragraph(
        'Selisih kas turun ke hampir nol karena semua transaksi tercatat. Pemilik memantau omzet dua outlet dari HP secara real-time, dan blast promo via WhatsApp Notifier membawa pelanggan lama kembali di jam sepi — omzet naik 30% dibanding kuartal sebelumnya.',
      ),
      paragraph('Baca bagaimana setup mereka hanya butuh satu sore di halaman produk Kodeva Kasir.'),
    ],
  },
] as const

/* ---------- seed utama ---------- */
const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'posts',
  'products',
  'vouchers',
]

const globals: GlobalSlug[] = ['header', 'footer']

export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding konten Kodeva...')

  payload.logger.info(`— Membersihkan collections & globals...`)
  await Promise.all(
    globals.map((global) =>
      payload.updateGlobal({
        slug: global,
        data: { navItems: [] },
        depth: 0,
        context: { disableRevalidate: true },
      }),
    ),
  )
  await Promise.all(
    collections.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )
  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection].config.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  )

  payload.logger.info(`— Membuat author demo...`)
  // Idempoten: hapus author percobaan sebelumnya (seed tidak menyentuh user lain)
  await payload.delete({
    collection: 'users',
    depth: 0,
    where: { email: { equals: 'author@kodeva.test' } },
  })
  const demoAuthor = await payload.create({
    collection: 'users',
    data: {
      name: 'Tim Kodeva',
      email: 'author@kodeva.test',
      password: 'kodeva12345',
      roles: ['admin'],
    },
  })

  payload.logger.info(`— Menghasilkan & mengunggah gambar placeholder...`)
  const productMedia = await Promise.all(
    PRODUCT_SEED.map(async (p) => {
      const m = await payload.create({
        collection: 'media',
        data: { alt: `Tampilan produk ${p.name}` },
        file: await placeholderImage(p.name, p.category, p.tagline),
      })
      return [p.slug, m] as const
    }),
  )
  const postMedia = await Promise.all(
    POST_SEED.map(async (post, i) => {
      const m = await payload.create({
        collection: 'media',
        data: { alt: `Ilustrasi artikel: ${post.title}` },
        file: await placeholderImage(
          `Artikel ${i + 1}`,
          i % 2 === 0 ? 'kasir' : 'hr',
          CATEGORY_SEED.find(([, slug]) => slug === post.category)?.[0] ?? 'Kodeva',
        ),
      })
      return [post.slug, m] as const
    }),
  )
  const mediaBySlug = new Map([...productMedia, ...postMedia])

  payload.logger.info(`— Kategori blog...`)
  const categoryDocs = await Promise.all(
    CATEGORY_SEED.map(([title, slug]) =>
      payload.create({
        collection: 'categories',
        data: { title, slug },
      }),
    ),
  )
  const categoryIdBySlug = new Map(categoryDocs.map((c) => [c.slug, c.id]))

  payload.logger.info(`— Produk (${PRODUCT_SEED.length})...`)
  const productDocs = await Promise.all(
    PRODUCT_SEED.map((p) => {
      const image = mediaBySlug.get(p.slug)
      return payload.create({
        collection: 'products',
        context: { disableRevalidate: true },
        data: {
          name: p.name,
          slug: p.slug,
          tagline: p.tagline,
          category: p.category,
          description: root(paragraph(p.description)),
          features: p.features.map(([title, description]) => ({
            title,
            description,
            image: image?.id,
          })),
          packages: {
            basic: p.basic,
            pro: p.pro,
            business: p.business,
          },
          promoQuota: {
            total: p.quota.total,
            remaining: p.quota.remaining,
            active: true,
            endsAt: new Date('2026-12-31T23:59:59+07:00').toISOString(),
          },
          featured: p.featured,
        },
      })
    }),
  )
  const productIdBySlug = new Map(productDocs.map((d) => [d.slug, d.id]))

  payload.logger.info(`— Artikel (${POST_SEED.length})...`)
  for (const post of POST_SEED) {
    // Catatan: id Category ditipis sebagai string oleh payload-types template
    // (runtime = number); null-check dipakai agar lolos typecheck & benar saat runtime.
    const categoryIds = [categoryIdBySlug.get(post.category)].filter((id) => id != null)
    const relatedProductIds = post.related
      .map((slug) => productIdBySlug.get(slug))
      .filter((id) => id != null)

    await payload.create({
      collection: 'posts',
      context: { disableRevalidate: true },
      data: {
        title: post.title,
        slug: post.slug,
        _status: 'published',
        authors: [demoAuthor.id],
        categories: categoryIds,
        heroImage: mediaBySlug.get(post.slug)?.id,
        relatedProducts: relatedProductIds,
        content: root(...post.blocks),
        publishedAt: new Date().toISOString(),
      },
    })
  }

  payload.logger.info(`— Voucher...`)
  await Promise.all([
    payload.create({
      collection: 'vouchers',
      data: {
        code: 'KODEVA50',
        discountType: 'nominal',
        discountValue: 50000,
        minSpend: 500000,
        active: true,
      },
    }),
    payload.create({
      collection: 'vouchers',
      data: {
        code: 'HEMAT10',
        discountType: 'percent',
        discountValue: 10,
        minSpend: 300000,
        active: true,
      },
    }),
  ])

  payload.logger.info(`— Halaman home (blocks)...`)
  const featuredIds = productDocs.filter((p) => p.featured).map((p) => p.id)
  const heroImage = mediaBySlug.get('kodeva-kasir')
  await payload.create({
    collection: 'pages',
    draft: false,
    context: { disableRevalidate: true },
    data: {
      title: 'Kodeva — Software UMKM',
      slug: 'home',
      _status: 'published',
      hero: { type: 'none' },
      layout: [
        {
          blockType: 'banner',
          style: 'info',
          publishAt: new Date('2026-10-01T00:00:00+07:00').toISOString(),
          content: root(
            paragraph('Promo akhir tahun: lisensi mulai Rp149 ribu/bln — kuota terbatas per produk.'),
          ),
        },
        {
          blockType: 'hero',
          kicker: 'Promo Akhir Tahun',
          title: 'Software bisnis yang jalan dalam sehari',
          subtitle:
            'Aplikasi kasir, HR & payroll, dan add-on untuk UMKM Indonesia. Tanpa hardware khusus, tanpa kontrak panjang — bayar per lisensi per bulan.',
          image: heroImage!.id,
          primaryCta: { label: 'Lihat Produk', href: '/produk' },
          secondaryCta: { label: 'Baca Blog', href: '/posts' },
        },
        {
          blockType: 'featured-products',
          title: 'Produk Unggulan',
          products: featuredIds.length ? featuredIds : productDocs.slice(0, 2).map((p) => p.id),
          showPrices: true,
        },
        {
          blockType: 'testimonials',
          title: 'Kata Mereka',
          items: [
            {
              quote:
                'Dulu tutup toko harus ngitung ulang sampai malam. Sekarang laporan sudah menunggu di HP sebelum saya pulang.',
              name: 'Bu Sari',
              role: 'Pemilik Warung Sari Rasa, Bandung',
            },
            {
              quote:
                'Stok kain tidak pernah bohong lagi. Notifikasi stok menipis menyelamatkan penjualan ramai akhir pekan.',
              name: 'Dewi Lestari',
              role: 'Pemilik Butik Ampik, Yogyakarta',
            },
            {
              quote:
                'Empat kasir, satu dasbor. Owner seperti saya akhirnya bisa libur tanpa takut omzet bocor.',
              name: 'Rangga Pratama',
              role: 'Pemilik Kafe Kopi Pagi, Bandung',
            },
          ],
        },
        {
          blockType: 'faq',
          title: 'Pertanyaan Umum',
          items: [
            {
              question: 'Apa itu "lisensi" di Kodeva?',
              answer:
                'Satu lisensi berlaku untuk satu outlet (produk kasir) atau satu perusahaan (HR & Payroll), dipakai siapa pun di unit itu. Jumlah lisensi menentukan berapa unit paralel yang aktif.',
            },
            {
              question: 'Bisakah upgrade paket Basic ke Pro kapan saja?',
              answer:
                'Bisa. Selisih harga dihitung proporsional dari sisa masa aktif; data dan konfigurasi tidak berubah sama sekali saat upgrade.',
            },
            {
              question: 'Bagaimana kebijakan refund?',
              answer:
                'Garansi 14 hari uang kembali penuh untuk lisensi baru, tanpa perlu alasan. Cukup hubungi tim support dari menu bantuan.',
            },
            {
              question: 'Kalau berhenti berlangganan, apa data saya hilang?',
              answer:
                'Tidak. Anda dapat mengunduh seluruh data (transaksi, karyawan, pelanggan) dalam format CSV/Excel kapan saja, bahkan setelah langganan berakhir.',
            },
            {
              question: 'Apakah ada dukungan kalau kendala?',
              answer:
                'Semua paket mendapat dukungan via WhatsApp dan email pada jam kerja. Paket Business mendapat prioritas respons di bawah 2 jam.',
            },
          ],
        },
      ],
      publishedAt: new Date().toISOString(),
      meta: {
        title: 'Kodeva — Aplikasi Kasir & HR untuk UMKM Indonesia',
        description:
          'Software UMKM: aplikasi kasir, HR & payroll, dan add-on. Mulai Rp149 ribu per lisensi per bulan. Promo akhir tahun — kuota terbatas.',
        image: heroImage?.id,
      },
    },
  })

  payload.logger.info(`— Header & footer...`)
  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          { link: { type: 'custom', label: 'Katalog', url: '/produk' } },
          { link: { type: 'custom', label: 'Blog', url: '/posts' } },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          { link: { type: 'custom', label: 'Katalog', url: '/produk' } },
          { link: { type: 'custom', label: 'Blog', url: '/posts' } },
          { link: { type: 'custom', label: 'Admin', url: '/admin' } },
        ],
      },
    }),
  ])

  payload.logger.info('Seed konten Kodeva selesai!')
}
