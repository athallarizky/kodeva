// Test generator — determinisme + properti statistik skenario (schema.md §7.1).
import { describe, expect, it } from 'vitest'

import { generateBatch, generateSyntheticLead, mulberry32, pTrueOf, sigmoid } from '@/lib/jev/generator'
import { SCENARIOS } from '@/lib/jev/scenarios'

describe('mulberry32 — PRNG deterministik', () => {
  it('seed sama ⇒ urutan identik', () => {
    const a = mulberry32(1234)
    const b = mulberry32(1234)
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('seed beda ⇒ urutan beda; output ∈ [0,1)', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    const sa = Array.from({ length: 10 }, () => a())
    const sb = Array.from({ length: 10 }, () => b())
    expect(sa).not.toEqual(sb)
    for (const v of [...sa, ...sb]) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('generateSyntheticLead — deterministik per seed', () => {
  it('seed sama ⇒ lead identik penuh (features, pTrue, converted)', () => {
    const l1 = generateSyntheticLead(SCENARIOS.baseline, 777)
    const l2 = generateSyntheticLead(SCENARIOS.baseline, 777)
    expect(l1).toEqual(l2)
  })

  it('pTrue ∈ (0,1) dan konsisten dengan pTrueOf(features)', () => {
    const l = generateSyntheticLead(SCENARIOS.baseline, 42)
    expect(l.pTrue).toBeGreaterThan(0)
    expect(l.pTrue).toBeLessThan(1)
    expect(l.pTrue).toBeCloseTo(pTrueOf(l.features, SCENARIOS.baseline), 12)
  })

  it('features valid: jam 0..23, elapsed di atas anti-spam 3s', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { features } = generateSyntheticLead(SCENARIOS.baseline, seed)
      expect(features.hourLocal).toBeGreaterThanOrEqual(0)
      expect(features.hourLocal).toBeLessThanOrEqual(23)
      expect(features.formElapsedMs).toBeGreaterThanOrEqual(3000)
    }
  })
})

describe('properti statistik skenario (sanity, bukan klaim)', () => {
  const rate = (data: { converted: boolean }[]) => data.filter((d) => d.converted).length / data.length

  it('baseline: konversi empiris ~10–20% (target desain 13–16%)', () => {
    const batch = generateBatch(SCENARIOS.baseline, 2000, 10_000)
    expect(rate(batch)).toBeGreaterThan(0.1)
    expect(rate(batch)).toBeLessThan(0.2)
  })

  it('drift-price: konversi jatuh di bawah baseline (promo berakhir)', () => {
    const base = generateBatch(SCENARIOS.baseline, 2000, 10_000)
    const drift = generateBatch(SCENARIOS['drift-price'], 2000, 20_000)
    expect(rate(drift)).toBeLessThan(rate(base))
    expect(rate(drift)).toBeLessThan(0.1)
  })

  it('drift-source: WA memberi pTrue lebih tinggi (β>0 bekerja)', () => {
    const batch = generateBatch(SCENARIOS.baseline, 2000, 10_000)
    const waMean = batch.filter((l) => l.features.contactType === 'wa').reduce((s, l) => s + l.pTrue, 0) / batch.filter((l) => l.features.contactType === 'wa').length
    const emailMean = batch.filter((l) => l.features.contactType === 'email').reduce((s, l) => s + l.pTrue, 0) / batch.filter((l) => l.features.contactType === 'email').length
    expect(waMean).toBeGreaterThan(emailMean)
  })

  it('sigmoid sanity: 0→0.5, besar→1', () => {
    expect(sigmoid(0)).toBeCloseTo(0.5)
    expect(sigmoid(10)).toBeGreaterThan(0.9999)
  })
})
