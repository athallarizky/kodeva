import { Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { BrandLogo } from '@/components/kit/BrandLogo'

const COLUMNS: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: 'Produk',
    items: [
      { label: 'Kasir', href: '/produk?kategori=kasir' },
      { label: 'HR & Payroll', href: '/produk?kategori=hr' },
      { label: 'Semua Add-on', href: '/produk?kategori=addon' },
    ],
  },
  {
    title: 'Perusahaan',
    items: [
      { label: 'Tentang', href: '/' },
      { label: 'Blog', href: '/blog' },
      { label: 'Karier', href: '/' },
    ],
  },
  {
    title: 'Bantuan',
    items: [
      { label: 'Pusat Bantuan', href: '/' },
      { label: 'Kontak', href: '/' },
      { label: 'Status', href: '/' },
    ],
  },
]

const SOCIALS = [
  { label: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
  { label: 'YouTube', icon: Youtube, href: 'https://youtube.com' },
  { label: 'X', icon: Twitter, href: 'https://x.com' },
]

/** Footer kodeva — forest, 3 kolom + social (desain kodeva-ui). */
export const Footer: React.FC = () => (
  <footer className="mt-auto w-full bg-forest px-5 pb-6 pt-7">
    <div className="container flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[16px] md:flex-row md:justify-between">
        <div className="flex max-w-[300px] flex-col gap-[10px]">
          <BrandLogo variant="footer" />
          <p className="text-[12px] leading-relaxed text-tint-3">
            Software operasional untuk UMKM Indonesia — kasir, HR &amp; payroll, dan add-on yang
            saling terhubung.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-[10px]">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-tint-3">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-[8px]">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-[12.5px] text-white/85 hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/15 pt-4">
        <p className="text-[11px] text-white/60">
          © 2026 Kodeva. Seluruh hak cipta dilindungi.
        </p>
        <div className="flex items-center gap-[14px]">
          {SOCIALS.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              target="_blank"
              rel="noreferrer"
              className="text-white/70 hover:text-white"
            >
              <Icon className="h-[15px] w-[15px]" />
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
)
