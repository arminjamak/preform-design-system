/** Index (1–6) into `--color-chart-series-*`, stable per user id (FNV-1a hash). */
export function collaboratorColorIndex(id: string): 1 | 2 | 3 | 4 | 5 | 6 {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (((h >>> 0) % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
}

/** `var(--color-chart-series-N)` for a user id. */
export function collaboratorColor(id: string) {
  return `var(--color-chart-series-${collaboratorColorIndex(id)})`;
}
