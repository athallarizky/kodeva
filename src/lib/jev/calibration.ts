// Matematika kalibrasi — schema.md §5. Pure functions, tanpa dependensi.
import { logit, mulberry32, sigmoid } from './generator'

export interface ReliabilityPoint {
  lo: number
  hi: number
  n: number
  meanP: number
  observedRate: number | null // null bila bin kosong
}

/** diagram reliability — bin decile */
export function reliability(ps: number[], ys: Array<number | boolean>, bins = 10): ReliabilityPoint[] {
  const points: ReliabilityPoint[] = []
  for (let i = 0; i < bins; i++) {
    const lo = i / bins
    const hi = (i + 1) / bins
    const idx = ps.map((p, j) => ({ p, y: ys[j] ? 1 : 0 })).filter(({ p }) => p >= lo && (p < hi || (i === bins - 1 && p <= hi)))
    const n = idx.length
    points.push({
      lo,
      hi,
      n,
      meanP: n ? idx.reduce((s, { p }) => s + p, 0) / n : 0,
      observedRate: n ? idx.reduce((s, { y }) => s + (y ? 1 : 0), 0) / n : null,
    })
  }
  return points
}

/** ECE klasik: Σ (n_b/N)·|meanP_b − observedRate_b| (terhadap outcome) */
export function ece(ps: number[], ys: Array<number | boolean>): number {
  return reliability(ps, ys)
    .filter((b) => b.n > 0 && b.observedRate !== null)
    .reduce((s, b) => s + (b.n / ps.length) * Math.abs(b.meanP - (b.observedRate as number)), 0)
}

/** ECE-true: terhadap pTrue (proses sejati) — bebas noise Bernoulli */
export function eceVsTrue(ps: number[], pTrues: number[]): number {
  if (ps.length !== pTrues.length || ps.length === 0) return NaN
  return ps.reduce((s, p, i) => s + Math.abs(p - pTrues[i]), 0) / ps.length
}

/** Brier score: mean (p − y)² */
export function brier(ps: number[], ys: Array<number | boolean>): number {
  if (!ps.length) return NaN
  return ps.reduce((s, p, i) => s + (p - (ys[i] ? 1 : 0)) ** 2, 0) / ps.length
}

export interface PlattParams {
  a: number
  b: number
}

/** Platt scaling: logit(q) = a·logit(p) + b — gradient descent 1D + L2 kecil */
export function plattFit(ps: number[], ys: Array<number | boolean>, opts?: { epochs?: number; lr?: number; l2?: number }): PlattParams {
  const epochs = opts?.epochs ?? 800
  const lr = opts?.lr ?? 0.1
  const l2 = opts?.l2 ?? 1e-3
  const xs = ps.map((p) => logit(p))
  const t = ys.map((y) => (y ? 1 : 0))

  let a = 1
  let b = 0
  for (let e = 0; e < epochs; e++) {
    let ga = 0
    let gb = 0
    for (let i = 0; i < xs.length; i++) {
      const q = sigmoid(a * xs[i] + b)
      const err = q - t[i]
      ga += err * xs[i]
      gb += err
    }
    ga = ga / xs.length + l2 * a
    gb = gb / xs.length + l2 * b
    a -= lr * ga
    b -= lr * gb
  }
  return { a, b }
}

export function plattApply(p: number, params: PlattParams): number {
  return sigmoid(params.a * logit(p) + params.b)
}

export interface LearningCurvePoint {
  n: number
  eceBefore: number // ECE test tanpa Platt
  eceAfter: number // ECE test dengan Platt yang dilatih pada n sampel
}

/** learning curve Platt (RQ2): train n pertama (shuffle seeded), test di sisanya */
export function learningCurve(
  ps: number[],
  ys: Array<number | boolean>,
  trainSizes: number[],
  seed = 42,
): LearningCurvePoint[] {
  const rng = mulberry32(seed)
  const order = ps.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const shuffled = {
    ps: order.map((i) => ps[i]),
    ys: order.map((i) => (ys[i] ? 1 : 0)),
  }

  return trainSizes.map((n) => {
    const trainP = shuffled.ps.slice(0, n)
    const trainY = shuffled.ys.slice(0, n)
    const testP = shuffled.ps.slice(n)
    const testY = shuffled.ys.slice(n)
    if (!testP.length) return { n, eceBefore: NaN, eceAfter: NaN }
    const params = plattFit(trainP, trainY)
    return {
      n,
      eceBefore: ece(testP, testY),
      eceAfter: ece(testP.map((p) => plattApply(p, params)), testY),
    }
  })
}

/** Spearman rank correlation — prob-vs-margin (RQ3) */
export function spearman(xs: number[], ys2: number[]): number {
  if (xs.length !== ys2.length || xs.length < 2) return NaN
  const rank = (arr: number[]): number[] => {
    const idx = arr.map((v, i) => ({ v, i })).sort((x, y) => x.v - y.v)
    const r = new Array<number>(arr.length)
    let i = 0
    while (i < idx.length) {
      let j = i
      while (j + 1 < idx.length && idx[j + 1].v === idx[i].v) j++
      const avg = (i + j) / 2 + 1 // rata-rata rank untuk tie
      for (let k = i; k <= j; k++) r[idx[k].i] = avg
      i = j + 1
    }
    return r
  }
  const rx = rank(xs)
  const ry = rank(ys2)
  const n = xs.length
  const d2 = rx.reduce((s, v, i) => s + (v - ry[i]) ** 2, 0)
  return 1 - (6 * d2) / (n * (n * n - 1))
}

export interface MarginQuartile {
  n: number
  meanMargin: number
  meanAbsErrOutcome: number // mean |p − outcome|
  meanAbsErrTrue: number | null // mean |p − pTrue| — null bila kuartil tanpa pTrue
}

export interface MarginAnalysis {
  n: number
  /** Spearman(margin, |p − outcome|) — negatif = margin tinggi ↔ prediksi lebih tepat */
  spearmanVsAbsErrOutcome: number
  /** Spearman(margin, |p − pTrue|) — hanya lead sintetis; null bila terlalu sedikit */
  spearmanVsAbsErrTrue: number | null
  quartiles: MarginQuartile[] // Q1 (margin terendah) → Q4 (tertinggi)
}

/** analisis margin (RQ3): apakah confidence pertanyaan choice membantu menilai ketepatan noul? */
export function marginAnalysis(
  rows: Array<{ p: number; margin?: number | null; converted: boolean | null; pTrue: number | null }>,
): MarginAnalysis | null {
  const usable = rows.filter((r) => Number.isFinite(r.p) && typeof r.margin === 'number')
  if (usable.length < 8) return null

  const knownOutcome = usable.filter((r) => r.converted !== null)
  const withTrue = usable.filter((r) => typeof r.pTrue === 'number')
  const spearmanOutcome =
    knownOutcome.length >= 8
      ? spearman(
          knownOutcome.map((r) => r.margin as number),
          knownOutcome.map((r) => Math.abs(r.p - (r.converted ? 1 : 0))),
        )
      : NaN
  const spearmanTrue =
    withTrue.length >= 8
      ? spearman(
          withTrue.map((r) => r.margin as number),
          withTrue.map((r) => Math.abs(r.p - (r.pTrue as number))),
        )
      : null

  // kuartil berdasarkan margin terurut naik
  const sortedIdx = usable
    .map((_, i) => i)
    .sort((a, b) => (usable[a].margin as number) - (usable[b].margin as number))
  const q = Math.floor(sortedIdx.length / 4)
  const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length
  const quartiles: MarginQuartile[] = []
  for (let k = 0; k < 4; k++) {
    const slice = k < 3 ? sortedIdx.slice(k * q, (k + 1) * q) : sortedIdx.slice(3 * q)
    if (!slice.length) continue
    const errsOutcome = slice
      .map((i) => (usable[i].converted !== null ? Math.abs(usable[i].p - (usable[i].converted ? 1 : 0)) : null))
      .filter((v): v is number => v !== null)
    const errsTrue = slice
      .map((i) => (typeof usable[i].pTrue === 'number' ? Math.abs(usable[i].p - (usable[i].pTrue as number)) : null))
      .filter((v): v is number => v !== null)
    quartiles.push({
      n: slice.length,
      meanMargin: mean(slice.map((i) => usable[i].margin as number)),
      meanAbsErrOutcome: errsOutcome.length ? mean(errsOutcome) : NaN,
      meanAbsErrTrue: errsTrue.length ? mean(errsTrue) : null,
    })
  }

  return {
    n: usable.length,
    spearmanVsAbsErrOutcome: spearmanOutcome,
    spearmanVsAbsErrTrue: spearmanTrue,
    quartiles,
  }
}
