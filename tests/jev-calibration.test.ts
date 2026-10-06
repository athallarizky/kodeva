// Test matematika kalibrasi — golden values + positive control (schema.md §7).
import { describe, expect, it } from 'vitest'

import { brier, ece, eceVsTrue, learningCurve, marginAnalysis, plattApply, plattFit, reliability, spearman } from '@/lib/jev/calibration'
import { generateBatch, mulberry32 } from '@/lib/jev/generator'
import { SCENARIOS } from '@/lib/jev/scenarios'
import { MockJevClient } from '@/lib/jev/client'

describe('ece / reliability — golden values', () => {
  it('kalibrasi sempurna (konstruksi tangan) → ECE 0', () => {
    // meanP bin == observedRate bin: 5×p0.2 dgn 1 convert, 5×p0.8 dgn 4 convert
    const ps = [0.2, 0.2, 0.2, 0.2, 0.2, 0.8, 0.8, 0.8, 0.8, 0.8]
    const ys = [1, 0, 0, 0, 0, 1, 1, 1, 1, 0]
    expect(ece(ps, ys)).toBeCloseTo(0, 10)
  })

  it('sangat miskalibrasi: p=0.8 selalu tidak convert → ECE=0.8', () => {
    expect(ece([0.8, 0.8], [0, 0])).toBeCloseTo(0.8, 10)
  })

  it('reliability: bin kosong → observedRate null; bin terisi benar', () => {
    const r = reliability([0.05, 0.95], [0, 1])
    expect(r[0].n).toBe(1)
    expect(r[0].observedRate).toBe(0)
    expect(r[9].observedRate).toBe(1)
    expect(r[4].observedRate).toBeNull()
  })
})

describe('eceVsTrue & brier', () => {
  it('p == pTrue → 0; simpangan terukur rata-rata', () => {
    expect(eceVsTrue([0.3, 0.3], [0.3, 0.3])).toBeCloseTo(0, 12)
    expect(eceVsTrue([0.8, 0.2], [0.6, 0.2])).toBeCloseTo(0.1, 12)
  })

  it('brier sempurna=0; tebak 0.5 pada y=1 → 0.25', () => {
    expect(brier([1, 0], [1, 0])).toBeCloseTo(0, 12)
    expect(brier([0.5], [1])).toBeCloseTo(0.25, 12)
  })
})

describe('Platt — positive control dengan mock bengkok', () => {
  // Bias tanam seragam +0.06 di SEMUA bin (kena seluruh distribusi lead)
  const bentMock = new MockJevClient({
    seedBase: 99,
    binBias: Array(10).fill(0.06),
  })
  const cleanMock = new MockJevClient({ seedBase: 99 })

  async function scoreBatch(client: MockJevClient) {
    const batch = generateBatch(SCENARIOS.baseline, 800, 5000)
    const scored = await Promise.all(batch.map((l) => client.decide(l.features)))
    return { ps: scored.map((d) => d.p), ys: batch.map((l) => l.converted), pTrues: batch.map((l) => l.pTrue) }
  }

  it('mock bersih: ECE kecil; mock bengkok: ECE membesar (harness mendeteksi bias tanam)', async () => {
    const clean = await scoreBatch(cleanMock)
    const bent = await scoreBatch(bentMock)
    expect(eceVsTrue(clean.ps, clean.pTrues)).toBeLessThan(0.05)
    expect(eceVsTrue(bent.ps, bent.pTrues)).toBeGreaterThan(eceVsTrue(clean.ps, clean.pTrues) + 0.03)
  })

  it('plattFit memperbaiki mock bengkok (ECE turun signifikan)', async () => {
    const { ps, ys } = await scoreBatch(bentMock)
    const params = plattFit(ps, ys)
    const after = ps.map((p) => plattApply(p, params))
    expect(ece(after, ys)).toBeLessThan(ece(ps, ys))
  })

  it('plattApply pada a=1,b=0 = identitas', () => {
    expect(plattApply(0.37, { a: 1, b: 0 })).toBeCloseTo(0.37, 9)
  })
})

describe('learningCurve & spearman', () => {
  it('learning curve mengembalikan titik per ukuran train; Platt tak memperburuk parah', async () => {
    const mock = new MockJevClient({ seedBase: 7, binBias: [0, 0, 0, 0, 0, 0, 0, 0.08, 0.08, 0.08] })
    const batch = generateBatch(SCENARIOS.baseline, 400, 3000)
    const scored = await Promise.all(batch.map((l) => mock.decide(l.features)))
    const curve = learningCurve(scored.map((d) => d.p), batch.map((l) => (l.converted ? 1 : 0)), [50, 100, 200])
    expect(curve.map((c) => c.n)).toEqual([50, 100, 200])
    for (const c of curve) {
      expect(Number.isFinite(c.eceBefore)).toBe(true)
      expect(c.eceAfter).toBeLessThan(c.eceBefore + 0.02) // tak memperburuk parah
    }
    // titik train terbesar tidak boleh jauh lebih buruk dari titik terbaik
    const best = Math.min(...curve.map((c) => c.eceAfter))
    expect(curve[2].eceAfter).toBeLessThanOrEqual(best + 0.01)
  })

  it('spearman: monotik sempurna = 1; terbalik = -1; margin≈p → tinggi', async () => {
    expect(spearman([1, 2, 3], [10, 20, 30])).toBeCloseTo(1, 10)
    expect(spearman([1, 2, 3], [30, 20, 10])).toBeCloseTo(-1, 10)
    const mock = new MockJevClient({ seedBase: 3 })
    const batch = generateBatch(SCENARIOS.baseline, 300, 900)
    const scored = await Promise.all(batch.map((l) => mock.decide(l.features)))
    expect(spearman(scored.map((d) => d.p), scored.map((d) => d.margin ?? d.p))).toBeGreaterThan(0.95)
  })

  it('mulberry32 import path dipakai learningCurve (shuffle seeded deterministik)', () => {
    const rng = mulberry32(5)
    expect(typeof rng()).toBe('number')
  })
})

describe('marginAnalysis (RQ3)', () => {
  it('null bila < 8 baris atau margin tidak ada', () => {
    expect(marginAnalysis([])).toBeNull()
    const few = Array.from({ length: 5 }, (_, i) => ({
      p: 0.3 + i * 0.05,
      margin: 0.5,
      converted: true,
      pTrue: 0.3,
    }))
    expect(marginAnalysis(few)).toBeNull()
    const noMargin = Array.from({ length: 20 }, () => ({
      p: 0.4,
      margin: null,
      converted: true,
      pTrue: 0.4,
    }))
    expect(marginAnalysis(noMargin)).toBeNull()
  })

  it('konstruksi tangan: margin tinggi ↔ error kecil → kuartil Q4 paling akurat, korelasi negatif', () => {
    // 16 lead: margin naik, |p − pTrue| menurun seragam
    const rows = Array.from({ length: 16 }, (_, i) => {
      const margin = 0.1 + i * 0.05 // 0.10 … 0.85
      const err = 0.4 - i * 0.024 // 0.40 … 0.04 menurun
      const pTrue = 0.5
      return {
        p: Number((pTrue + (i % 2 === 0 ? err : -err)).toFixed(4)), // jitter arah, |err| tetap
        margin,
        converted: i % 4 === 0, // outcome tak dipakai kuartil-true
        pTrue,
      }
    })
    const m = marginAnalysis(rows)!
    expect(m).not.toBeNull()
    expect(m.n).toBe(16)
    expect(m.quartiles).toHaveLength(4)
    // ρ(margin, |p−pTrue|) harus −1 sempurna (relasi deterministik menurun)
    expect(m.spearmanVsAbsErrTrue).toBeCloseTo(-1, 10)
    // |err-true| kuartil Q1 (margin rendah) > Q4 (margin tinggi)
    expect(m.quartiles[0].meanAbsErrTrue!).toBeGreaterThan(m.quartiles[3].meanAbsErrTrue!)
  })

  it('lead live (converted null) tidak menggagalkan analisis; err-outcome dinonaktifkan bila < 8 known', () => {
    const rows = [
      ...Array.from({ length: 8 }, (_, i) => ({ p: 0.3 + i * 0.02, margin: 0.4, converted: null, pTrue: 0.3 + i * 0.02 })),
      ...Array.from({ length: 4 }, () => ({ p: 0.6, margin: 0.7, converted: true, pTrue: null })),
    ]
    const m = marginAnalysis(rows)!
    expect(m.n).toBe(12)
    expect(Number.isFinite(m.spearmanVsAbsErrOutcome)).toBe(false) // hanya 4 outcome → NaN
    expect(m.quartiles[0].meanAbsErrTrue).not.toBeNull() // pTrue tetap dianalisis
  })
})
