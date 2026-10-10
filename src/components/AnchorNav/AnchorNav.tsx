import { forwardRef, useCallback, useEffect, useId, useRef, useState, type HTMLAttributes, type MouseEvent, type RefObject } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './AnchorNav.module.css';

export type AnchorNavItem = {
  /** Id of the target element in the document. */
  id: string;
  label: string;
  /** Nesting level: 1 for sections, 2–3 for sub-sections. */
  level?: 1 | 2 | 3;
};

export type AnchorNavProps = Omit<HTMLAttributes<HTMLElement>, 'title'> &
  WithForcedState & {
    items: AnchorNavItem[];
    /** Scroll container holding the sections. Defaults to the window. */
    scrollContainerRef?: RefObject<HTMLElement>;
    /** Pixels reserved at the top of the scroller (e.g. a sticky header): sections settle below it and count as active from there. */
    offset?: number;
    title?: string;
    /** Called whenever the tracked section changes. */
    onActiveChange?: (id: string) => void;
  };

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** "On this page" table of contents. Tracks the visible section with IntersectionObserver and scrolls to sections on click. */
export const AnchorNav = forwardRef<HTMLElement, AnchorNavProps>(function AnchorNav(
  { items, scrollContainerRef, offset = 0, title = 'On this page', onActiveChange, className, 'data-state': state, ...rest },
  ref,
) {
  const titleId = useId();
  const [active, setActive] = useState<string | undefined>(items[0]?.id);
  const visible = useRef(new Set<string>());
  // While a click-initiated smooth scroll runs, keep the clicked item active.
  const locked = useRef(false);
  const onActiveRef = useRef(onActiveChange);
  onActiveRef.current = onActiveChange;

  const activate = useCallback((id: string) => {
    setActive((prev) => {
      if (prev !== id) onActiveRef.current?.(id);
      return id;
    });
  }, []);

  const ids = items.map((i) => i.id).join('|');

  useEffect(() => {
    const root = scrollContainerRef?.current ?? null;
    const order = ids.split('|');
    const targets = order.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!targets.length || typeof IntersectionObserver === 'undefined') return;
    visible.current.clear();

    const atBottom = () => {
      if (root) return root.scrollTop + root.clientHeight >= root.scrollHeight - 1;
      return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.current.add(e.target.id);
          else visible.current.delete(e.target.id);
        }
        if (locked.current) return;
        if (atBottom()) return activate(order[order.length - 1]);
        const first = order.find((id) => visible.current.has(id));
        if (first) activate(first);
      },
      // The active band is the top third of the scroller, below the offset.
      { root, rootMargin: `-${offset}px 0px -66% 0px`, threshold: 0 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [ids, offset, scrollContainerRef, activate]);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const container = scrollContainerRef?.current;
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    const current = container ? container.scrollTop : window.scrollY;
    const raw = container
      ? el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - offset
      : el.getBoundingClientRect().top + window.scrollY - offset;
    const max = container ? container.scrollHeight - container.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
    const top = Math.max(0, Math.min(raw, max));
    const scroller: HTMLElement | Window = container ?? window;
    if (behavior === 'smooth' && 'onscrollend' in window && Math.abs(top - current) > 1) {
      locked.current = true;
      scroller.addEventListener('scrollend', () => (locked.current = false), { once: true });
    }
    scroller.scrollTo({ top, behavior });
    activate(id);
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };

  return (
    <nav ref={ref} aria-labelledby={titleId} className={cx(s.nav, className)} {...rest}>
      <p id={titleId} className={s.title}>
        {title}
      </p>
      <ul className={s.list}>
        {items.map((item) => (
          <li key={item.id} className={s.item}>
            <a
              href={`#${item.id}`}
              className={cx(s.link, s[`l${item.level ?? 1}`])}
              aria-current={item.id === active ? 'location' : undefined}
              onClick={(e) => handleClick(e, item.id)}
              data-state={state}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
});
