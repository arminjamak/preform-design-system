import { useEffect, useState, type RefObject } from 'react';
import { ArrowUpIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { IconButton } from '../IconButton/IconButton';
import s from './BackToTop.module.css';

export type BackToTopProps = WithForcedState & {
  /** Scroll distance in pixels after which the button fades in. */
  threshold?: number;
  /**
   * Scroll container to watch. When set, render BackToTop as the last child of that container:
   * it sticks to the container's bottom edge. Without it the button is fixed to the viewport.
   */
  scrollContainerRef?: RefObject<HTMLElement>;
  label?: string;
  position?: 'bottom-right' | 'bottom-center';
  /** Overrides the scroll-derived visibility (sandbox, docs). */
  visible?: boolean;
  onClick?: () => void;
  className?: string;
};

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Floating circular "back to top" control for long job histories and material libraries. Fades in past `threshold`. */
export function BackToTop({ threshold = 400, scrollContainerRef, label = 'Back to top', position = 'bottom-right', visible, onClick, className, 'data-state': state }: BackToTopProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef?.current;
    const target: HTMLElement | Window = el ?? window;
    const read = () => setScrolled((el ? el.scrollTop : window.scrollY) > threshold);
    read();
    target.addEventListener('scroll', read, { passive: true });
    return () => target.removeEventListener('scroll', read);
  }, [scrollContainerRef, threshold]);

  const shown = visible ?? scrolled;

  const toTop = () => {
    const el = scrollContainerRef?.current;
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    (el ?? window).scrollTo({ top: 0, behavior });
    // The button hides once at the top; keep focus inside the scrolled region.
    if (el) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }
    onClick?.();
  };

  const posClass = position === 'bottom-center' ? s.bottomCenter : s.bottomRight;
  const button = (
    <IconButton
      label={label}
      icon={<ArrowUpIcon strokeWidth={2.2} />}
      variant="floating"
      shape="circle"
      size="lg"
      onClick={toTop}
      aria-hidden={!shown || undefined}
      tabIndex={shown ? undefined : -1}
      data-state={state}
      className={cx(s.button, !shown && s.hidden, !scrollContainerRef && s.fixed, !scrollContainerRef && posClass, !scrollContainerRef && className)}
    />
  );

  if (!scrollContainerRef) return button;
  return <div className={cx(s.sticky, posClass, className)}>{button}</div>;
}
