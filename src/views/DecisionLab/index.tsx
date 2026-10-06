'use client'

// Decision Lab — panel riset JEV (sprint-2 schema.md §6).
// Advisory-only: panel ini TIDAK memicu aksi apa pun berdasarkan p — hanya tampil & jalankan eksperimen.
import React, { useCallback, useEffect, useState } from 'react'

interface ReliabilityPoint {
  lo: number
  hi: number
  n: number
  meanP: number
  observedRate: number | null
}

interface LearningCurvePoint {
  n: number
  eceBefore: number
  eceAfter: number
}

interface MarginQuartile {
  n: number
  meanMargin: number
  meanAbsErrOutcome: number
  meanAbsErrTrue: number | null
}

interface MarginAnalysis {
  n: number
  spearmanVsAbsErrOutcome: number
  spearmanVsAbsErrTrue: number | null
  quartiles: MarginQuartile[]
}

interface ScenarioMetrics {
  scenario: string
  model: string
  n: number
  nOutcome?: number
  ece: number | null
  eceTrue: number | null
  brier: number | null
  reliability: ReliabilityPoint[]
  latencyP50Ms: number
  latencyP95Ms: number
  platt: { n: number; params: { a: number; b: number }; eceBefore: number; eceAfter: number } | null
  learningCurve?: LearningCurvePoint[]
  margin?: MarginAnalysis | null
}

interface ModelSummary {
  model: string
  n: number
  platt: { n: number; params: { a: number; b: number }; eceBefore: number; eceAfter: number } | null
}

interface QueueRow {
  id: number
  name: string
  contact: string
  p: number | null
  pPlatt: number | null
  pTrue: number | null
  scenario: string | null
  model: string | null
  converted: boolean | null
  synthetic: boolean
}

const fmt = (v: number | null | undefined, digits = 3) =>
  typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '—'

function ReliabilityChart({ points }: { points: ReliabilityPoint[] }) {
  const w = 260
  const h = 200
  const pad = 28
  const filled = points.filter((p) => p.n > 0 && p.observedRate !== null)
  const px = (v: number) => pad + v * (w - 2 * pad)
  const py = (v: number) => h - pad - v * (h - 2 * pad)
  return (
    <svg width={w} height={h} style={{ background: 'var(--theme-elevation-50, #f6f6f6)', borderRadius: 8 }}>
      <line x1={pad} y1={h - pad} x2={w - pad} y2={pad} stroke="#999" strokeDasharray="4 3" />
      {filled.map((p, i) => (
        <g key={i}>
          <circle cx={px(p.meanP)} cy={py(p.observedRate as number)} r={Math.max(3, Math.min(8, Math.sqrt(p.n)))} fill="rgba(59,130,246,0.55)" stroke="#1e3a8a" />
        </g>
      ))}
      <text x={w / 2} y={h - 6} fontSize="10" textAnchor="middle" fill="#666">mean p (prediksi)</text>
      <text x={10} y={h / 2} fontSize="10" transform={`rotate(-90 10 ${h / 2})`} textAnchor="middle" fill="#666">tingkat konversi nyata</text>
    </svg>
  )
}

export const DecisionLabView: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioMetrics[]>([])
  const [models, setModels] = useState<ModelSummary[]>([])
  const [queue, setQueue] = useState<QueueRow[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [batchN, setBatchN] = useState(100) // ukuran batch real per klik (pagar route: ≤200)

  const refresh = useCallback(async () => {
    const r = await fetch('/api/jev/metrics', { cache: 'no-store' })
    const j = await r.json()
    if (j.ok) {
      setScenarios(j.scenarios)
      setModels(j.models ?? [])
      setQueue(j.queue)
    } else {
      setMessage(`Gagal memuat metrik: ${j.reason}`)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const runExperiment = async (scenario: string, engine: 'mock' | 'real', n: number, salt?: number) => {
    setBusy(`${engine}:${scenario}`)
    setMessage(`Menjalankan ${engine} ${scenario} n=${n}… (n besar = tunggu lama)`)
    try {
      const r = await fetch('/api/jev/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salt !== undefined ? { scenario, n, engine, salt } : { scenario, n, engine }),
      })
      const j = await r.json()
      if (j.ok) {
        const m = j.result.metrics
        setMessage(
          `Run ${scenario} (${engine}) selesai — n=${j.result.n}, ECE=${fmt(m.ece)}, ECE-true=${fmt(m.eceTrue)}, Brier=${fmt(m.brier)}`,
        )
        await refresh()
      } else {
        setMessage(`Run gagal: ${j.reason}`)
      }
    } finally {
      setBusy(null)
    }
  }

  // Platt PER ENGINE — engine mock & real punya bias berbeda, tidak boleh dicampur (fix 3.10)
  const applyPlattFor = async (model: string) => {
    setBusy(`platt:${model}`)
    setMessage(`Memasang Platt wrapper untuk ${model} (fit + tulis pPlatt)…`)
    try {
      const r = await fetch('/api/jev/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      })
      const j = await r.json()
      setMessage(
        j.ok
          ? `Platt [${model}]: n=${j.summary.n}, a=${fmt(j.summary.params.a)}, b=${fmt(j.summary.params.b)} — ECE ${fmt(j.summary.eceBefore)} → ${fmt(j.summary.eceAfter)}`
          : `Platt [${model}] gagal: ${j.reason} (butuh ≥10 lead ter-skor dengan outcome)`,
      )
      await refresh()
    } finally {
      setBusy(null)
    }
  }

  const cardStyle: React.CSSProperties = {
    border: '1px solid var(--theme-elevation-150, #ddd)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Decision Lab — Audit Kalibrasi JEV</h1>
      <p style={{ color: '#666', marginBottom: 20, fontSize: 13 }}>
        Riset sprint-2 · advisory-only — skor tidak pernah memicu aksi otomatis. pTrue hanya milik lead sintetis.
      </p>

      <div style={cardStyle}>
        <strong>Jalankan eksperimen</strong>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button disabled={busy !== null} onClick={() => runExperiment('baseline', 'mock', 100)}>Mock baseline n=100 (gratis)</button>
          <button disabled={busy !== null} onClick={() => runExperiment('drift-source', 'mock', 100)}>Mock drift-source n=100</button>
          <button disabled={busy !== null} onClick={() => runExperiment('drift-price', 'mock', 100)}>Mock drift-price n=100</button>
          <button disabled={busy !== null} onClick={() => runExperiment('baseline', 'real', batchN, Math.floor(Math.random() * 1000))}>Real baseline n={batchN} (PAYG)</button>
          <button disabled={busy !== null} onClick={() => runExperiment('drift-source', 'real', batchN, Math.floor(Math.random() * 1000))}>Real drift-source n={batchN} (PAYG)</button>
          <button disabled={busy !== null} onClick={() => runExperiment('drift-price', 'real', batchN, Math.floor(Math.random() * 1000))}>Real drift-price n={batchN} (PAYG)</button>
          <label style={{ fontSize: 12, alignSelf: 'center' }}>
            n/klik (≤200):{' '}
            <input
              type="number"
              min={1}
              max={200}
              value={batchN}
              onChange={(e) => setBatchN(Math.max(1, Math.min(200, Math.floor(Number(e.target.value) || 1))))}
              style={{ width: 56 }}
            />
          </label>
        </div>
        <p style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
          Tiap klik real memakai salt acak → lead selalu segar (klik ulang ≠ duplikat). Target matriks penuh 3×500 = 15 klik n=100.
        </p>
        {models.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {models.map((m) => (
              <button key={m.model} disabled={busy !== null} onClick={() => applyPlattFor(m.model)}>
                ⚡ Platt → {m.model} (fit n={m.platt?.n ?? 0})
              </button>
            ))}
          </div>
        )}
        {message && <p style={{ marginTop: 10, fontSize: 13, color: '#333' }}>{message}</p>}
      </div>

      {scenarios.map((s) => (
        <div key={`${s.scenario}|${s.model}`} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <strong>
              {s.scenario} · {s.model}
            </strong>
            <span style={{ fontSize: 12, color: '#666' }}>
              n={s.n}{typeof s.nOutcome === 'number' ? ` (outcome diketahui: ${s.nOutcome})` : ''} · latency p50/p95: {s.latencyP50Ms}/{s.latencyP95Ms} ms
            </span>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 10, flexWrap: 'wrap' }}>
            <div>
              <div>ECE (vs outcome): <strong>{fmt(s.ece)}</strong></div>
              <div>ECE-true (vs pTrue): <strong>{fmt(s.eceTrue)}</strong></div>
              <div>Brier: <strong>{fmt(s.brier)}</strong></div>
              {s.platt && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#333' }}>
                  Platt (n={s.platt.n}): ECE {fmt(s.platt.eceBefore)} → <strong>{fmt(s.platt.eceAfter)}</strong>{' '}
                  (a={fmt(s.platt.params.a)}, b={fmt(s.platt.params.b)})
                </div>
              )}
              {s.learningCurve && s.learningCurve.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#333' }}>
                  RQ2 learning curve (train n → ECE test sebelum→sesudah):{' '}
                  {s.learningCurve.map((c) => `${c.n}: ${fmt(c.eceBefore)}→${fmt(c.eceAfter)}`).join(' · ')}
                </div>
              )}
              {s.margin && (
                <div style={{ marginTop: 4, fontSize: 12, color: '#333' }}>
                  RQ3 margin (n={s.margin.n}): ρ(err-outcome)={fmt(s.margin.spearmanVsAbsErrOutcome)} · ρ(err-true)={fmt(s.margin.spearmanVsAbsErrTrue)} · |err-true| per kuartil margin Q1→Q4:{' '}
                  {s.margin.quartiles.map((q) => fmt(q.meanAbsErrTrue)).join(' / ')}
                </div>
              )}
            </div>
            <ReliabilityChart points={s.reliability} />
          </div>
        </div>
      ))}

      <div style={cardStyle}>
        <strong>Antrian prioritas (top 20 by p)</strong> — <span style={{ fontSize: 12, color: '#666' }}>gunakan <em>pPlatt</em> untuk keputusan; p mentah bukan probabilitas (temuan #0)</span>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: 6 }}>Nama</th>
              <th>p</th><th>pPlatt</th><th>pTrue*</th><th>Skenario</th><th>Konversi*</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 6 }}>
                  {row.name} {row.synthetic ? <span style={{ color: '#999', fontSize: 11 }}>[sintetis]</span> : null}
                </td>
                <td>{fmt(row.p, 2)}</td>
                <td>{fmt(row.pPlatt, 2)}</td>
                <td>{fmt(row.pTrue, 2)}</td>
                <td>{row.scenario}</td>
                <td>{row.converted === null ? '—' : row.converted ? 'ya' : 'tidak'}</td>
              </tr>
            ))}
            {queue.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 10, color: '#999' }}>Belum ada lead ter-skor.</td></tr>
            )}
          </tbody>
        </table>
        <p style={{ fontSize: 11, color: '#999', marginTop: 6 }}>*pTrue & konversi hanya untuk lead sintetis (ground truth generator)</p>
      </div>
    </div>
  )
}

export default DecisionLabView
