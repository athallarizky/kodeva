'use client'

import { CircleCheck } from 'lucide-react'
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

  if (status === 'done') {
    return (
      <div className="container">
        <div className="flex flex-col items-center gap-[10px] rounded-[16px] bg-white px-6 py-10 text-center shadow-card outline outline-1 outline-line outline-offset-[-0.5px]">
          <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-tint-2 text-brand">
            <CircleCheck className="h-[22px] w-[22px]" />
          </span>
          <h2 className="font-display text-[17px] font-bold text-forest">Terkirim!</h2>
          <p className="max-w-[300px] text-[12.5px] text-sage">
            Terima kasih — tim kami akan menghubungmu maksimal 1×24 jam.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <form
        onSubmit={submit}
        className="flex flex-col gap-[10px] rounded-[16px] bg-white p-[16px] shadow-card outline outline-1 outline-line outline-offset-[-0.5px]"
      >
        {title ? (
          <h2 className="font-display text-[17px] font-bold text-forest">{title}</h2>
        ) : null}
        <label className="flex flex-col gap-[4px]">
          <span className="text-[11.5px] text-forest">Nama lengkap</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth. Ratna Sari"
            autoComplete="name"
            className="rounded-[10px] bg-white px-[12px] py-[10px] text-[13px] text-forest outline outline-1 outline-line outline-offset-[-0.5px] placeholder:text-sage focus:outline-brand"
          />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[11.5px] text-forest">Email / nomor WhatsApp</span>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="cth. 0812xxxxxxx atau nama@usaha.id"
            autoComplete="email"
            className="rounded-[10px] bg-white px-[12px] py-[10px] text-[13px] text-forest outline outline-1 outline-line outline-offset-[-0.5px] placeholder:text-sage focus:outline-brand"
          />
        </label>

        {/* honeypot — disembunyikan dari manusia, terlihat oleh banyak bot */}
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

        {fieldError ? <p className="text-[10.5px] text-danger">{fieldError}</p> : null}
        {status === 'error' ? (
          <p className="text-[10.5px] text-danger">Gagal mengirim — coba lagi sebentar.</p>
        ) : null}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="mt-[2px] rounded-full bg-brand px-[22px] py-[13px] text-[14px] text-white transition-colors hover:bg-forest disabled:opacity-60"
        >
          {status === 'submitting' ? 'Mengirim…' : submitLabel || 'Kirim'}
        </button>
        {note ? <p className="text-center text-[10.5px] text-sage">{note}</p> : null}
      </form>
    </div>
  )
}
