import { useCallback, useEffect, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './LiveRegion.module.css';

export type Politeness = 'polite' | 'assertive';

export type LiveRegionProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** `polite` waits for the screen reader to finish; `assertive` interrupts (use for errors only). `off` silences it. */
  politeness?: Politeness | 'off';
  /** Read the whole region on every change rather than just the changed node. */
  atomic?: boolean;
  children?: ReactNode;
  /** Show the region's contents for debugging and docs. Production regions stay visually hidden. */
  visible?: boolean;
};

/** Visually hidden aria-live region. Changing its children is announced by screen readers. */
export function LiveRegion({ politeness = 'polite', atomic = true, children, visible = false, className, ...rest }: LiveRegionProps) {
  const role = politeness === 'assertive' ? 'alert' : politeness === 'polite' ? 'status' : undefined;
  return (
    <div role={role} aria-live={politeness} aria-atomic={atomic} className={cx(visible ? s.visible : s.srOnly, className)} {...rest}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* useAnnounce: shared, lazily created regions on document.body.        */
/* ------------------------------------------------------------------ */

const regions: Partial<Record<Politeness, HTMLDivElement>> = {};
let users = 0;

function ensureRegions() {
  (['polite', 'assertive'] as const).forEach((p) => {
    if (regions[p]?.isConnected) return;
    const el = document.createElement('div');
    el.setAttribute('role', p === 'assertive' ? 'alert' : 'status');
    el.setAttribute('aria-live', p);
    el.setAttribute('aria-atomic', 'true');
    el.setAttribute('data-pf-announcer', p);
    el.className = s.srOnly;
    document.body.appendChild(el);
    regions[p] = el;
  });
}

function removeRegions() {
  (['polite', 'assertive'] as const).forEach((p) => {
    regions[p]?.remove();
    delete regions[p];
  });
}

/** Delay between clearing and writing, so an identical message is re-announced. */
const ANNOUNCE_DELAY_MS = 50;

/**
 * Returns `announce(message, politeness?)`. The hidden regions are mounted with the first component
 * that uses the hook (so they exist before the first message) and removed with the last.
 */
export function useAnnounce() {
  useEffect(() => {
    users += 1;
    ensureRegions();
    return () => {
      users -= 1;
      if (users === 0) removeRegions();
    };
  }, []);

  return useCallback((message: string, politeness: Politeness = 'polite') => {
    if (typeof document === 'undefined') return;
    ensureRegions();
    const el = regions[politeness];
    if (!el) return;
    el.textContent = '';
    window.setTimeout(() => {
      el.textContent = message;
    }, ANNOUNCE_DELAY_MS);
  }, []);
}
