import { useCallback, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { readToken, useOverlayBehavior } from '../Sheet/overlay';
import s from './TourPopover.module.css';

/** A ref to the element, or a CSS selector (scoped to the inline container when `inline`). */
export type TourTarget = RefObject<HTMLElement | null> | string | null;
export type TourPlacement = 'auto' | 'top' | 'bottom' | 'left' | 'right';
type Side = Exclude<TourPlacement, 'auto'>;

export type TourPopoverProps = {
  open: boolean;
  /** Element to point at. When missing or not found, the popover centres over a full scrim. */
  target?: TourTarget;
  title: string;
  children: ReactNode;
  /** Zero-based index of this step. */
  step: number;
  total: number;
  onNext: () => void;
  onBack?: () => void;
  /** Skip / close the tour (also Escape). */
  onSkip: () => void;
  placement?: TourPlacement;
  /** Cut a hole in the scrim around the target. Default true. */
  spotlight?: boolean;
  nextLabel?: string;
  finishLabel?: string;
  backLabel?: string;
  skipLabel?: string;
  /** Render in place (absolute over the nearest positioned ancestor) instead of portalling to <body>. */
  inline?: boolean;
  className?: string;
};

type Box = { x: number; y: number; w: number; h: number };
type Layout = { spot: Box | null; left: number; top: number; side: Side | null; arrow: number };

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

function resolveTarget(target: TourTarget | undefined, scope: ParentNode, root: HTMLElement): HTMLElement | null {
  if (!target) return null;
  const el = typeof target === 'string' ? scope.querySelector<HTMLElement>(target) : target.current;
  if (!el || root.contains(el)) return null;
  return el;
}

function same(a: Layout | null, b: Layout) {
  if (!a || a.side !== b.side || !!a.spot !== !!b.spot) return false;
  const d = (x: number, y: number) => Math.abs(x - y) < 0.5;
  const spotSame = !a.spot || !b.spot || (d(a.spot.x, b.spot.x) && d(a.spot.y, b.spot.y) && d(a.spot.w, b.spot.w) && d(a.spot.h, b.spot.h));
  return spotSame && d(a.left, b.left) && d(a.top, b.top) && d(a.arrow, b.arrow);
}

/** Coach-mark popover anchored to a target with a spotlight cut out of the scrim, a step counter and Back / Next / Skip. */
export function TourPopover({
  open,
  target,
  title,
  children,
  step,
  total,
  onNext,
  onBack,
  onSkip,
  placement = 'auto',
  spotlight = true,
  nextLabel = 'Next',
  finishLabel = 'Finish',
  backLabel = 'Back',
  skipLabel = 'Skip tour',
  inline,
  className,
}: TourPopoverProps) {
  const titleId = useId();
  const bodyId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const { ref: cardRef, onKeyDown: trapKeys } = useOverlayBehavior<HTMLDivElement>({ open, onClose: onSkip, inline, initialFocusRef: nextRef });
  const last = step >= total - 1;

  // Track the target every frame: panels animate and layouts shift between steps.
  useLayoutEffect(() => {
    if (!open) return;
    let frame = 0;
    let scrolledFor: Element | null = null;
    const measure = () => {
      frame = requestAnimationFrame(measure);
      const root = rootRef.current;
      const card = cardRef.current;
      if (!root || !card) return;
      const rr = root.getBoundingClientRect();
      const W = rr.width;
      const H = rr.height;
      const cw = card.offsetWidth;
      const ch = card.offsetHeight;
      const pad = readToken('--space-1', root);
      const gap = readToken('--space-3', root);
      const margin = readToken('--space-2', root);
      const arrowInset = readToken('--space-5', root);
      const el = resolveTarget(target, inline ? root.parentElement ?? document : document, root);
      const r = el?.getBoundingClientRect();

      let next: Layout;
      if (!el || !r || (r.width === 0 && r.height === 0)) {
        next = { spot: null, side: null, arrow: 0, left: (W - cw) / 2, top: clamp((H - ch) / 2, margin, H - ch - margin) };
      } else {
        if (!inline && el !== scrolledFor && (r.top < 0 || r.bottom > window.innerHeight)) {
          scrolledFor = el;
          el.scrollIntoView({ block: 'center' });
        }
        const spot = { x: r.left - rr.left - pad, y: r.top - rr.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
        const room: Record<Side, number> = {
          right: W - (spot.x + spot.w) - gap - margin - cw,
          left: spot.x - gap - margin - cw,
          bottom: H - (spot.y + spot.h) - gap - margin - ch,
          top: spot.y - gap - margin - ch,
        };
        let side: Side;
        if (placement === 'auto') {
          const order: Side[] = ['right', 'bottom', 'left', 'top'];
          side = order.find((o) => room[o] >= 0) ?? order.reduce((a, b) => (room[b] > room[a] ? b : a));
        } else {
          side = room[placement] >= 0 || room[OPPOSITE[placement]] < 0 ? placement : OPPOSITE[placement];
        }
        const midX = spot.x + spot.w / 2;
        const midY = spot.y + spot.h / 2;
        let left: number;
        let top: number;
        let arrow: number;
        if (side === 'left' || side === 'right') {
          left = side === 'right' ? spot.x + spot.w + gap : spot.x - gap - cw;
          top = clamp(midY - ch / 2, margin, H - ch - margin);
          arrow = clamp(midY - top, arrowInset, ch - arrowInset);
        } else {
          top = side === 'bottom' ? spot.y + spot.h + gap : spot.y - gap - ch;
          left = clamp(midX - cw / 2, margin, W - cw - margin);
          arrow = clamp(midX - left, arrowInset, cw - arrowInset);
        }
        next = { spot: spotlight ? spot : null, side, left, top, arrow };
      }
      setLayout((p) => (same(p, next) ? p : next));
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [open, target, placement, spotlight, inline, step, cardRef]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const typing = (e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]');
      if (!typing && e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (!typing && e.key === 'ArrowLeft' && step > 0 && onBack) {
        e.preventDefault();
        onBack();
      } else trapKeys(e);
    },
    [onNext, onBack, step, trapKeys],
  );

  if (!open) return null;
  const spot = layout?.spot;

  const node = (
    <div ref={rootRef} className={cx(s.root, inline && s.inline)}>
      <div className={cx(s.blocker, !spot && s.dim)} aria-hidden="true" />
      {spot && <div className={s.spotlight} aria-hidden="true" style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h }} />}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        data-side={layout?.side ?? 'center'}
        data-ready={layout ? 'true' : 'false'}
        className={cx(s.card, className)}
        style={{ left: layout?.left ?? 0, top: layout?.top ?? 0 }}
      >
        {layout?.side && <span className={s.arrow} aria-hidden="true" style={layout.side === 'left' || layout.side === 'right' ? { top: layout.arrow } : { left: layout.arrow }} />}
        <div className={s.meta}>
          <span className={s.counter} aria-live="polite">
            {step + 1} of {total}
          </span>
          <div className={s.dots} aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={cx(s.dot, i === step && s.dotActive, i < step && s.dotDone)} />
            ))}
          </div>
        </div>
        <div key={step} className={s.content}>
          <h2 id={titleId} className={s.title}>
            {title}
          </h2>
          <div id={bodyId} className={s.body}>
            {children}
          </div>
        </div>
        <div className={s.footer}>
          {!last && (
            <Button variant="link" className={s.skip} onClick={onSkip}>
              {skipLabel}
            </Button>
          )}
          <div className={s.actions}>
            {step > 0 && onBack && (
              <Button variant="outlineAccent" onClick={onBack}>
                {backLabel}
              </Button>
            )}
            <Button ref={nextRef} variant="primary" onClick={onNext}>
              {last ? finishLabel : nextLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
  return inline ? node : createPortal(node, document.body);
}

/* ───────────────────────── Tour controller ───────────────────────── */

export type TourStep = {
  id: string;
  target?: TourTarget;
  title: string;
  content: ReactNode;
  placement?: TourPlacement;
};

export type TourProps = Pick<TourPopoverProps, 'spotlight' | 'inline' | 'nextLabel' | 'finishLabel' | 'backLabel' | 'skipLabel' | 'className'> & {
  steps: TourStep[];
  open: boolean;
  /** Zero-based current step. */
  index: number;
  /** Advance; on the last step this should finish the tour. */
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

/** Renders the TourPopover for the current step of a steps array. Pair with `useTour`. */
export function Tour({ steps, open, index, onNext, onBack, onSkip, ...rest }: TourProps) {
  const step = steps[Math.min(Math.max(index, 0), steps.length - 1)];
  if (!step) return null;
  return (
    <TourPopover {...rest} open={open} target={step.target ?? null} placement={step.placement} title={step.title} step={index} total={steps.length} onNext={onNext} onBack={onBack} onSkip={onSkip}>
      {step.content}
    </TourPopover>
  );
}

export type UseTourOptions = {
  /** Start open (e.g. first launch after an update). */
  defaultOpen?: boolean;
  initialIndex?: number;
  /** Called when Next is pressed on the last step. */
  onFinish?: () => void;
  /** Called with the step index when the user skips or presses Escape. */
  onSkip?: (index: number) => void;
};

/** Walks a steps array: returns state, navigation and `tourProps` to spread on `<Tour />`. */
export function useTour(steps: TourStep[], { defaultOpen = false, initialIndex = 0, onFinish, onSkip }: UseTourOptions = {}) {
  const [open, setOpen] = useState(defaultOpen);
  const [index, setIndex] = useState(initialIndex);
  const isLast = index >= steps.length - 1;

  const start = useCallback((at = 0) => {
    setIndex(at);
    setOpen(true);
  }, []);
  const finish = useCallback(() => {
    setOpen(false);
    onFinish?.();
  }, [onFinish]);
  const next = useCallback(() => (isLast ? finish() : setIndex((i) => i + 1)), [isLast, finish]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const skip = useCallback(() => {
    setOpen(false);
    onSkip?.(index);
  }, [onSkip, index]);
  const goTo = useCallback((i: number) => setIndex(Math.min(Math.max(i, 0), steps.length - 1)), [steps.length]);

  return {
    open,
    index,
    step: steps[index],
    isFirst: index === 0,
    isLast,
    start,
    next,
    back,
    skip,
    finish,
    goTo,
    tourProps: { steps, open, index, onNext: next, onBack: back, onSkip: skip },
  };
}
