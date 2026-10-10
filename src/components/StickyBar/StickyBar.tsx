import { forwardRef, useEffect, useRef, useState, type ElementType, type HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { space, type SpaceValue, type StyleWithVars } from '../Stack/space';
import s from './StickyBar.module.css';

export type StickyBarProps = HTMLAttributes<HTMLElement> & {
  /** Edge the bar sticks to. Default `top`. */
  position?: 'top' | 'bottom';
  /** What appears once content scrolls underneath: a hairline only, or hairline plus soft shadow. Default `shadow`. */
  elevation?: 'border' | 'shadow';
  /** Distance from the edge while stuck, as a `--space-*` step. Default `0`. */
  offset?: SpaceValue;
  /** Pad by the device safe-area insets (notch, home indicator). Default `true`. */
  safeArea?: boolean;
  /** Called when the bar starts or stops covering scrolled content. */
  onStuckChange?: (stuck: boolean) => void;
  /** Element to render. Default `header` for top, `footer` for bottom. */
  as?: 'div' | 'header' | 'footer' | 'nav';
};

/** Nearest ancestor that scrolls, used as the IntersectionObserver root; null means the viewport. */
function scrollParent(node: HTMLElement | null): HTMLElement | null {
  let el = node?.parentElement ?? null;
  while (el && el !== document.body && el !== document.documentElement) {
    const { overflowY, overflowX } = getComputedStyle(el);
    if (/(auto|scroll|overlay)/.test(overflowY + overflowX)) return el;
    el = el.parentElement;
  }
  return null;
}

/**
 * Sticky header or footer for long panels and settings pages. A 1px sentinel next to the bar is watched with an
 * IntersectionObserver; when it scrolls out of view the bar is "stuck" and gains its border or shadow.
 * Renders the sentinel as a sibling, so place the bar directly inside the scrolling column.
 */
export const StickyBar = forwardRef<HTMLElement, StickyBarProps>(function StickyBar(
  { position = 'top', elevation = 'shadow', offset, safeArea = true, onStuckChange, as, className, style, children, ...rest },
  ref,
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);
  const onStuckRef = useRef(onStuckChange);
  onStuckRef.current = onStuckChange;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setStuck(!entry.isIntersecting);
      },
      { root: scrollParent(sentinel), threshold: [0, 1] },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [position]);

  const reported = useRef(false);
  useEffect(() => {
    if (!reported.current && !stuck) return;
    reported.current = true;
    onStuckRef.current?.(stuck);
  }, [stuck]);

  const Comp = (as ?? (position === 'top' ? 'header' : 'footer')) as ElementType;
  const vars: StyleWithVars = { '--sticky-offset': space(offset), ...style };
  const sentinel = <div ref={sentinelRef} aria-hidden="true" className={cx(s.sentinel, position === 'top' ? s.sentinelTop : s.sentinelBottom)} />;

  return (
    <>
      {position === 'top' && sentinel}
      <Comp
        ref={ref}
        className={cx(s.bar, s[position], elevation === 'shadow' && s.shadow, safeArea && s.safeArea, className)}
        style={vars}
        data-stuck={stuck || undefined}
        {...rest}
      >
        {children}
      </Comp>
      {position === 'bottom' && sentinel}
    </>
  );
});
