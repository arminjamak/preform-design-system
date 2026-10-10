import type { CSSProperties } from 'react';

/** Steps of the spacing scale (`--space-*`). */
export const SPACE_STEPS = [0, 'half', 'px', 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 20, 24] as const;

export type SpaceStep = (typeof SPACE_STEPS)[number];
/** A spacing token step, as a number (`3`) or a string (`"3"`). Resolves to `var(--space-3)`. */
export type SpaceValue = SpaceStep | `${SpaceStep}`;

/** A length that is already a token expression, e.g. `var(--size-layout-panel)` or `calc(var(--size-layout-panel) * 2)`. */
export type TokenLength = `var(--${string})` | `calc(${string})`;

/** Inline style object that also accepts CSS custom properties. */
export type StyleWithVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

/** Resolves a spacing step to its token, e.g. `space(3)` → `var(--space-3)`. */
export function space(step: SpaceValue | undefined): string | undefined {
  return step === undefined ? undefined : `var(--space-${step})`;
}
