/** Small, dependency-free scale helpers shared by every chart. Geometry is data-derived, so plain numbers are fine here. */

export type LinearScale = ((v: number) => number) & { domain: [number, number]; range: [number, number]; ticks: (count?: number) => number[] };

/** "Nice" tick values covering [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min];
  const span = max - min;
  const step0 = Math.pow(10, Math.floor(Math.log10(span / count)));
  const err = (count / span) * step0;
  const step = err <= 0.15 ? step0 * 10 : err <= 0.35 ? step0 * 5 : err <= 0.75 ? step0 * 2 : step0;
  const start = Math.ceil(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step * 1e-9; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

/** Extends [min, max] outward to round tick boundaries. */
export function niceDomain(min: number, max: number, count = 5): [number, number] {
  if (min === max) return [min - 1, max + 1];
  const t = niceTicks(min, max, count);
  const step = t.length > 1 ? t[1] - t[0] : 1;
  return [Math.floor(min / step) * step, Math.ceil(max / step) * step];
}

export function linearScale(domain: [number, number], range: [number, number]): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const f = ((v: number) => (d1 === d0 ? (r0 + r1) / 2 : r0 + ((v - d0) / (d1 - d0)) * (r1 - r0))) as LinearScale;
  f.domain = domain;
  f.range = range;
  f.ticks = (count = 5) => niceTicks(d0, d1, count);
  return f;
}

export type BandScale = ((key: string) => number) & { bandwidth: number; step: number; domain: string[] };

export function bandScale(domain: string[], range: [number, number], paddingInner = 0.2, paddingOuter = 0.1): BandScale {
  const [r0, r1] = range;
  const n = domain.length || 1;
  const step = (r1 - r0) / Math.max(1, n - paddingInner + paddingOuter * 2);
  const bandwidth = step * (1 - paddingInner);
  const start = r0 + step * paddingOuter;
  const f = ((key: string) => start + domain.indexOf(key) * step) as BandScale;
  f.bandwidth = bandwidth;
  f.step = step;
  f.domain = domain;
  return f;
}

/** Categorical series colours, as CSS variable references (theme-aware). */
export const SERIES_COLORS = [
  'var(--color-chart-series-1)',
  'var(--color-chart-series-2)',
  'var(--color-chart-series-3)',
  'var(--color-chart-series-4)',
  'var(--color-chart-series-5)',
  'var(--color-chart-series-6)',
] as const;

export const seriesColor = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length];

/** Sequential colour for heatmaps: mixes the low and high tokens by t ∈ [0,1]. */
export const sequentialColor = (t: number) =>
  `color-mix(in oklab, var(--color-chart-sequential-high) ${Math.round(Math.max(0, Math.min(1, t)) * 100)}%, var(--color-chart-sequential-low))`;

export const formatNumber = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1)}k` : Number.isInteger(v) ? String(v) : v.toFixed(1);
