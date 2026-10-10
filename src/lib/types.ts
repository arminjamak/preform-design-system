/**
 * Forced interaction states. Components spread `data-state` onto their root so
 * the sandbox (and visual tests) can render hover/focus/active without input.
 */
export type ForcedState = 'hover' | 'focus' | 'active';

export type WithForcedState = { 'data-state'?: ForcedState | string };

export type Size = 'sm' | 'md' | 'lg';
export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
