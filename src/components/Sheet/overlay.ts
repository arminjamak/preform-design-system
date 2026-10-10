import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react';

/**
 * Shared overlay behaviour for the Overlays family (Sheet, FullScreenDialog, CommandPalette,
 * TourPopover, CookieConsent, HelpWidget): focus trap + restore, Escape, scroll lock, presence
 * (keep mounted while the exit animation plays) and token reads for JS geometry.
 */

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.hasAttribute('inert') && el.getClientRects().length > 0);
}

/** Reads a length or duration token (e.g. `--space-3`, `--motion-duration-base`) as a number of px / ms. */
export function readToken(name: string, el: Element | null = typeof document === 'undefined' ? null : document.documentElement): number {
  if (!el) return 0;
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return 0;
  return raw.endsWith('ms') ? n : raw.endsWith('s') ? n * 1000 : n;
}

/* ── Stack: only the top-most modal overlay traps focus and answers document-level Escape. ── */
const stack: symbol[] = [];
const isTop = (id: symbol) => stack[stack.length - 1] === id;

/* ── Scroll lock with a counter so nested overlays restore correctly. ── */
let lockCount = 0;
let savedOverflow = '';
function lockScroll() {
  if (lockCount++ === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
}
function unlockScroll() {
  if (--lockCount === 0) document.body.style.overflow = savedOverflow;
}

export type OverlayBehaviorOptions = {
  open: boolean;
  onClose?: () => void;
  /** Rendered in place (docs): no scroll lock, no document listeners, no focus steal on first mount. */
  inline?: boolean;
  /** Trap Tab inside the container and keep focus from leaving it. Default true. */
  trapFocus?: boolean;
  lockScroll?: boolean;
  closeOnEscape?: boolean;
  restoreFocus?: boolean;
  /** Element to focus on open. Falls back to `[data-autofocus]`, then the container itself. */
  initialFocusRef?: RefObject<HTMLElement>;
};

/**
 * Wires a dialog container: returns a ref and an onKeyDown to spread on it (give it tabIndex={-1}).
 */
export function useOverlayBehavior<T extends HTMLElement = HTMLDivElement>({
  open,
  onClose,
  inline,
  trapFocus = true,
  lockScroll: shouldLock = true,
  closeOnEscape = true,
  restoreFocus = true,
  initialFocusRef,
}: OverlayBehaviorOptions) {
  const ref = useRef<T>(null);
  const idRef = useRef(Symbol('overlay'));
  const openAtMount = useRef(open);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Focus in on open, restore on close.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const skipFocus = inline && openAtMount.current;
    openAtMount.current = false;
    if (!skipFocus) {
      const frame = requestAnimationFrame(() => {
        const root = ref.current;
        if (!root) return;
        const target = initialFocusRef?.current ?? root.querySelector<HTMLElement>('[data-autofocus]') ?? root;
        target.focus({ preventScroll: true });
      });
      return () => {
        cancelAnimationFrame(frame);
        if (restoreFocus && previous && previous.isConnected && previous !== document.body) previous.focus({ preventScroll: true });
      };
    }
    return undefined;
  }, [open, inline, initialFocusRef, restoreFocus]);

  // Stack membership, scroll lock and document-level guards (portal mode only).
  useEffect(() => {
    if (!open || inline) return;
    const id = idRef.current;
    stack.push(id);
    if (shouldLock) lockScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || !isTop(id)) return;
      if (e.key === 'Escape' && closeOnEscape) {
        e.preventDefault();
        closeRef.current?.();
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      const root = ref.current;
      if (!trapFocus || !root || !isTop(id)) return;
      const t = e.target as Node | null;
      if (t && !root.contains(t)) (getFocusable(root)[0] ?? root).focus({ preventScroll: true });
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', onFocusIn);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
      if (shouldLock) unlockScroll();
    };
  }, [open, inline, shouldLock, trapFocus, closeOnEscape]);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.isDefaultPrevented()) return;
      if (e.key === 'Escape' && closeOnEscape) {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current?.();
        return;
      }
      if (e.key !== 'Tab' || !trapFocus) return;
      const root = ref.current;
      if (!root) return;
      const items = getFocusable(root);
      if (items.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === root)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [closeOnEscape, trapFocus],
  );

  return { ref, onKeyDown };
}

/**
 * Keeps an overlay mounted for the exit animation. `state` is 'open' | 'closing';
 * `mounted` turns false once the `--motion-duration-base` token has elapsed after close.
 */
export function usePresence(open: boolean, durationToken = '--motion-duration-base') {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  useLayoutEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, reduce ? 0 : readToken(durationToken));
    return () => window.clearTimeout(t);
  }, [open]);
  return { mounted: open || mounted, state: (open ? 'open' : closing ? 'closing' : 'open') as 'open' | 'closing' };
}
