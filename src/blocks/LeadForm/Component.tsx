'use client'

import { CircleCheck, Clock, ShieldCheck, Sparkles } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import type { LeadFormBlock as LeadFormBlockProps } from '@/payload-types'
import { leadInputSchema } from '@/lib/schemas'
import { getUtm } from '@/lib/utm'

type Status = 'idle' | 'submitting' | 'done' | 'error'

/**
 * Form lead publik (api-contract §2):
 * - honeypot tersembunyi (bot mengisi → 422 bentuk-sukses, UI tetap "terkirim")
 * - elapsedMs: manusia butuh >3 detik mengisi form; di bawah itu → 422 bentuk-sukses
 * - UTM sesi (last-touch) ikut payload
 */
export const LeadFormBlock: React.FC<LeadFormBlockProps> = ({ title, submitLabel, note }) => {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const mountedAt = useRef<number>(0)

  useEffect(() => {
    mountedAt.current = Date.now()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'submitting') return

    const payload = {
      name: name.trim(),
      contact: contact.trim(),
      landingPath:
        typeof window !== 'undefined' ? window.location.pathname : '/',
      honeypot,
      elapsedMs: mountedAt.current ? Date.now() - mountedAt.current : 0,
      utm: getUtm() ?? undefined,
    }
    const parsed = leadInputSchema.safeParse(payload)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      setFieldError(
        first?.path[0] === 'name'
          ? 'Nama minimal 2 huruf.'
          : 'Isi email atau nomor WhatsApp yang valid (cth. 0812…).',
      )
      return
    }
    setFieldError(null)
    setStatus('submitting')
    try {
      const r = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      // 201 = lead sungguhan; 422 = bentuk-sukses (anti-spam) — UI memperlakukan sama
      if (r.status === 201 || r.status === 422) {
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="container">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 items-center">
        {/* Left Column: Value Proposition & Guarantees */}
        <div className="flex flex-col gap-5 lg:col-span-6">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
              Konsultasi Sistem 1-on-1
            </span>
            <h2 className="font-display text-[26px] sm:text-[32px] md:text-[38px] font-bold tracking-[-0.025em] text-forest leading-[1.1] [text-wrap:balance]">
              Bantu usahamu lebih rapi & minim kebocoran kas
            </h2>
            <p className="text-[14px] text-pine/90 leading-relaxed [text-wrap:pretty]">
              Diskusikan alur kasir, inventori stok, dan penggajian karyawan tokomu bersama spesialis kami. Kami siapkan rekomendasi modul yang paling tepat.
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-1">
            <div className="flex items-start gap-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tint text-brand shadow-2xs">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              <div className="flex flex-col">
                <h4 className="text-[13.5px] font-bold text-forest">Demo Disesuaikan Jenis Usaha</h4>
                <p className="text-[12px] text-pine/80 leading-relaxed">
                  Simulasi langsung alur kasir toko F&B, ritel, atau butik sesuai cara kerjamu.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tint text-brand shadow-2xs">
                <ShieldCheck className="h-4.5 w-4.5" />
              </span>
              <div className="flex flex-col">
                <h4 className="text-[13.5px] font-bold text-forest">Garansi 14 Hari Uang Kembali</h4>
                <p className="text-[12px] text-pine/80 leading-relaxed">
                  Coba tanpa beban. Jika sistem kami tidak cocok untuk tokomu, refund 100% tanpa syarat.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tint text-brand shadow-2xs">
                <Clock className="h-4.5 w-4.5" />
              </span>
              <div className="flex flex-col">
                <h4 className="text-[13.5px] font-bold text-forest">Respon Cepat Maksimal 1×24 Jam</h4>
                <p className="text-[12px] text-pine/80 leading-relaxed">
                  Tim kami akan menyapamu ramah via WhatsApp atau email pada jam operasional.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form Card or Success State */}
        <div className="lg:col-span-6">
          {status === 'done' ? (
            <div className="flex flex-col items-center gap-3.5 rounded-[24px] bg-white p-8 sm:p-12 text-center border border-line/80 shadow-pop">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tint-2 text-brand ring-8 ring-tint shadow-xs">
                <CircleCheck className="h-7 w-7" />
              </span>
              <h3 className="font-display text-[22px] font-bold text-forest">Permintaan Terkirim!</h3>
              <p className="max-w-[340px] text-[13.5px] leading-relaxed text-pine/90 [text-wrap:pretty]">
                Terima kasih! Spesialis sistem kami akan menghubungimu maksimal 1×24 jam untuk jadwal konsultasi.
              </p>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="relative flex flex-col gap-4 overflow-hidden rounded-[24px] bg-white p-6 sm:p-8 border border-line/80 shadow-pop transition-all duration-200"
            >
              {/* Decorative top accent gradient */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand via-tint-3 to-brand" />

              <div className="flex flex-col gap-1 pb-1">
                <h3 className="font-display text-[20px] sm:text-[22px] font-bold tracking-tight text-forest">
                  {title || 'Konsultasi Gratis'}
                </h3>
                <p className="text-[12.5px] text-pine/80">
                  Isi data singkat berikut agar tim kami bisa menghubungi tokomu.
                </p>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-forest">Nama lengkap</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="cth. Ratna Sari"
                  autoComplete="name"
                  className="h-11 min-h-[44px] rounded-[12px] bg-white px-3.5 text-[14px] text-forest border border-line placeholder:text-sage/80 transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-forest">Email atau Nomor WhatsApp</span>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="cth. 0812xxxxxxx atau ratna@usaha.id"
                  autoComplete="email"
                  className="h-11 min-h-[44px] rounded-[12px] bg-white px-3.5 text-[14px] text-forest border border-line placeholder:text-sage/80 transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                />
              </label>

              {/* honeypot — disembunyikan dari manusia, terlihat oleh bot */}
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="pointer-events-none absolute h-0 w-0 opacity-0"
              />

              {fieldError ? (
                <div className="rounded-lg bg-danger-bg/60 border border-danger/20 px-3 py-2 text-[12px] text-danger">
                  {fieldError}
                </div>
              ) : null}
              {status === 'error' ? (
                <div className="rounded-lg bg-danger-bg/60 border border-danger/20 px-3 py-2 text-[12px] text-danger">
                  Gagal mengirim — coba lagi sebentar.
                </div>
              ) : null}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="mt-1 inline-flex min-h-[46px] items-center justify-center rounded-full bg-brand px-6 py-3.5 text-[14px] font-medium text-white shadow-card transition-all duration-200 hover:bg-forest hover:shadow-pop hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                {status === 'submitting' ? 'Mengirim…' : submitLabel || 'Kirim Permintaan Konsultasi'}
              </button>

              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-sage">
                <span>🔒</span>
                <span>{note || 'Data usahamu aman & tidak akan pernah dispam.'}</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
