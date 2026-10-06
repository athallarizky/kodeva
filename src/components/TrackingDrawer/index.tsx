'use client'

import { Copy } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { getStoredUtm } from '@/lib/utm'

const MAX_EVENTS = 50

/**
 * Debug drawer tracking (api-contract §4) — aktif hanya saat ?debug=tracking.
 * Membungkus dataLayer.push: menyalin tiap entry, menampilkan ≤50 event terakhir,
 * tombol copy JSON — bukti event tanpa akun GA.
 */
export const TrackingDrawer: React.FC = () => {
  const params = useSearchParams()
  const enabled = params.get('debug') === 'tracking'
  const [events, setEvents] = useState<Record<string, unknown>[]>([])
  const [copied, setCopied] = useState(false)
  const patched = useRef(false)

  useEffect(() => {
    if (!enabled || patched.current) return
    patched.current = true

    window.dataLayer = window.dataLayer || []
    const layer = window.dataLayer
    const origPush = layer.push.bind(layer)
    layer.push = (...items: Record<string, unknown>[]) => {
      setEvents((prev) => [...prev, ...items].slice(-MAX_EVENTS))
      return origPush(...items)
    }
    setEvents([...layer].slice(-MAX_EVENTS))
  }, [enabled])

  if (!enabled) return null

  const copy = async () => {
    const dump = JSON.stringify({ utm: getStoredUtm(), events }, null, 2)
    try {
      await navigator.clipboard.writeText(dump)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <aside
      aria-label="Debug tracking"
      className="fixed inset-x-0 bottom-0 z-50 max-h-[42vh] overflow-y-auto border-t-2 border-brand bg-forest/95 px-4 py-3 text-left backdrop-blur"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center justify-between">
          <strong className="text-[12px] uppercase tracking-wide text-white">
            dataLayer — {events.length} event
          </strong>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-[6px] rounded-full bg-white/15 px-3 py-[5px] text-[11px] text-white hover:bg-white/25"
          >
            <Copy className="h-[12px] w-[12px]" />
            {copied ? 'Tersalin!' : 'Copy JSON'}
          </button>
        </div>
        <ol className="flex flex-col gap-[3px] font-mono text-[10.5px] leading-snug text-tint-3">
          {events.map((e, i) => (
            <li key={i} className="truncate">
              {String(e.event ?? JSON.stringify(e).slice(0, 90))}
            </li>
          ))}
          {events.length === 0 ? <li className="text-white/60">Belum ada event…</li> : null}
        </ol>
      </div>
    </aside>
  )
}
