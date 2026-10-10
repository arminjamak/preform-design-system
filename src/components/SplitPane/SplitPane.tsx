import {
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ForwardedRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MutableRefObject,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import type { StyleWithVars, TokenLength } from '../Stack/space';
import s from './SplitPane.module.css';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Merges a forwarded ref with a local one. */
function useMergedRef<T>(local: MutableRefObject<T | null>, forwarded: ForwardedRef<T>) {
  return useCallback(
    (node: T | null) => {
      local.current = node;
      if (typeof forwarded === 'function') forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [local, forwarded],
  );
}

/* ------------------------------------------------------------------ */
/* SplitPane                                                           */
/* ------------------------------------------------------------------ */

export type SplitPaneProps = Omit<HTMLAttributes<HTMLDivElement>, 'onResize' | 'defaultValue'> &
  WithForcedState & {
    /** Leading pane (left, or top when vertical). */
    first: ReactNode;
    /** Trailing pane (right, or bottom when vertical). */
    second: ReactNode;
    /** `horizontal` puts panes side by side; `vertical` stacks them. Default `horizontal`. */
    direction?: 'horizontal' | 'vertical';
    /** Size of the first pane as a fraction 0–1 (controlled). */
    value?: number;
    /** Initial fraction (uncontrolled). Default `0.5`. */
    defaultValue?: number;
    /** Called with the new fraction while dragging or on keyboard resize. */
    onResize?: (ratio: number) => void;
    /** Smallest fraction for the first pane. Default `0.15`. */
    min?: number;
    /** Largest fraction for the first pane. Default `0.85`. */
    max?: number;
    /** Arrow-key step as a fraction. Default `0.05`. */
    step?: number;
    /** Pane that may collapse to zero: dragging past half its minimum snaps it shut, Enter toggles it. */
    collapsible?: 'first' | 'second';
    /** Accessible name of the separator. Default `Resize panes`. */
    separatorLabel?: string;
    /** Accessible names of the panes; each pane becomes a labelled region when set. */
    firstLabel?: string;
    secondLabel?: string;
    /** Lock the separator. */
    disabled?: boolean;
  };

/** Two panes divided by a draggable hairline separator (pointer, arrow keys, Home/End, Enter to collapse). */
export const SplitPane = forwardRef<HTMLDivElement, SplitPaneProps>(function SplitPane(
  {
    first,
    second,
    direction = 'horizontal',
    value,
    defaultValue = 0.5,
    onResize,
    min = 0.15,
    max = 0.85,
    step = 0.05,
    collapsible,
    separatorLabel = 'Resize panes',
    firstLabel,
    secondLabel,
    disabled,
    className,
    style,
    'data-state': dataState,
    ...rest
  },
  ref,
) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRootRef = useMergedRef(rootRef, ref);
  const [inner, setInner] = useState(defaultValue);
  const [dragging, setDragging] = useState(false);
  const ratio = clamp(value ?? inner, 0, 1);
  const restore = useRef(ratio > 0 && ratio < 1 ? ratio : 0.5);
  const horizontal = direction === 'horizontal';

  const lo = collapsible === 'first' ? 0 : min;
  const hi = collapsible === 'second' ? 1 : max;
  const firstCollapsed = collapsible === 'first' && ratio === 0;
  const secondCollapsed = collapsible === 'second' && ratio === 1;

  const commit = (next: number) => {
    if (next === ratio) return;
    if (next > 0 && next < 1) restore.current = next;
    if (value === undefined) setInner(next);
    onResize?.(next);
  };

  /** Pointer positions snap collapsible panes shut past half their minimum. */
  const fromPointer = (raw: number) => {
    if (collapsible === 'first' && raw < min / 2) return 0;
    if (collapsible === 'second' && raw > 1 - (1 - max) / 2) return 1;
    return clamp(raw, min, max);
  };

  /** Keyboard steps jump between collapsed and the min/max bound. */
  const fromKey = (raw: number, decreasing: boolean) => {
    if (collapsible === 'first' && raw < min) return decreasing ? 0 : min;
    if (collapsible === 'second' && raw > max) return decreasing ? max : 1;
    return clamp(raw, min, max);
  };

  const ratioAt = (e: PointerEvent) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return ratio;
    return horizontal ? (e.clientX - rect.left) / rect.width : (e.clientY - rect.top) / rect.height;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) commit(fromPointer(ratioAt(e)));
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const dec = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const inc = horizontal ? 'ArrowRight' : 'ArrowDown';
    const big = e.shiftKey ? 2 : 1;
    let next: number;
    switch (e.key) {
      case dec: next = fromKey(ratio - step * big, true); break;
      case inc: next = fromKey(ratio + step * big, false); break;
      case 'Home': next = lo; break;
      case 'End': next = hi; break;
      case 'Enter':
        if (!collapsible) return;
        next = firstCollapsed || secondCollapsed ? restore.current : collapsible === 'first' ? 0 : 1;
        break;
      default: return;
    }
    e.preventDefault();
    commit(Math.round(next * 1000) / 1000);
  };

  const vars: StyleWithVars = { '--split-ratio': ratio, ...style };
  const firstId = `${id}-first`;
  const pct = Math.round(ratio * 100);

  return (
    <div
      ref={setRootRef}
      className={cx(s.split, s[direction], dragging ? s.dragging : s.animate, className)}
      style={vars}
      {...rest}
    >
      <div
        id={firstId}
        className={cx(s.pane, s.first)}
        role={firstLabel ? 'region' : undefined}
        aria-label={firstLabel}
        data-collapsed={firstCollapsed || undefined}
      >
        {first}
      </div>
      <div
        role="separator"
        tabIndex={disabled ? -1 : 0}
        aria-label={separatorLabel}
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        aria-controls={firstId}
        aria-valuenow={pct}
        aria-valuemin={Math.round(lo * 100)}
        aria-valuemax={Math.round(hi * 100)}
        aria-valuetext={firstCollapsed ? 'First pane collapsed' : secondCollapsed ? 'Second pane collapsed' : `${pct}%`}
        aria-disabled={disabled || undefined}
        className={s.handle}
        data-state={dataState}
        data-dragging={dragging || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        <span className={s.grip} />
      </div>
      <div className={cx(s.pane, s.second)} role={secondLabel ? 'region' : undefined} aria-label={secondLabel} data-collapsed={secondCollapsed || undefined}>
        {second}
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* ResizablePanel                                                      */
/* ------------------------------------------------------------------ */

export type ResizablePanelEdge = 'right' | 'left' | 'bottom' | 'top';

export type ResizablePanelProps = Omit<HTMLAttributes<HTMLDivElement>, 'onResize'> &
  WithForcedState & {
    /** Edge that carries the resize handle. Default `right`. */
    edge?: ResizablePanelEdge;
    /** Current size along the resize axis, in CSS pixels as measured by the drag (controlled). */
    size?: number;
    /** Starting size before the first drag (uncontrolled). Default `var(--size-layout-panel)`. */
    defaultSize?: TokenLength;
    /** Default `var(--size-layout-sidebar)`. */
    minSize?: TokenLength;
    /** Default `calc(var(--size-layout-panel) * 2)`. */
    maxSize?: TokenLength;
    /** Called with the new size in CSS pixels. */
    onResize?: (size: number) => void;
    /** Accessible name of the handle. Default `Resize panel`. */
    handleLabel?: string;
    children?: ReactNode;
  };

/** A single panel with a resize handle on one edge, e.g. the job queue sidebar or the model list drawer. */
export const ResizablePanel = forwardRef<HTMLDivElement, ResizablePanelProps>(function ResizablePanel(
  {
    edge = 'right',
    size,
    defaultSize = 'var(--size-layout-panel)',
    minSize = 'var(--size-layout-sidebar)',
    maxSize = 'calc(var(--size-layout-panel) * 2)',
    onResize,
    handleLabel = 'Resize panel',
    className,
    style,
    children,
    'data-state': dataState,
    ...rest
  },
  ref,
) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRootRef = useMergedRef(rootRef, ref);
  const [inner, setInner] = useState<number | null>(null);
  const [measured, setMeasured] = useState({ now: 0, min: 0, max: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ start: 0, size: 0 });
  const xAxis = edge === 'left' || edge === 'right';
  const sign = edge === 'right' || edge === 'bottom' ? 1 : -1;
  const current = size ?? inner;

  const bounds = () => {
    const el = rootRef.current;
    if (!el) return { min: 0, max: Infinity };
    const cs = getComputedStyle(el);
    const minV = parseFloat(xAxis ? cs.minWidth : cs.minHeight);
    const maxV = parseFloat(xAxis ? cs.maxWidth : cs.maxHeight);
    return { min: Number.isFinite(minV) ? minV : 0, max: Number.isFinite(maxV) ? maxV : Infinity };
  };

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const b = bounds();
      setMeasured({ now: xAxis ? rect.width : rect.height, min: b.min, max: Number.isFinite(b.max) ? b.max : xAxis ? rect.width : rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [xAxis, minSize, maxSize]);

  const commit = (next: number) => {
    const b = bounds();
    const v = Math.round(clamp(next, b.min, b.max));
    if (size === undefined) setInner(v);
    onResize?.(v);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !rootRef.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    const rect = rootRef.current.getBoundingClientRect();
    drag.current = { start: xAxis ? e.clientX : e.clientY, size: xAxis ? rect.width : rect.height };
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const delta = ((xAxis ? e.clientX : e.clientY) - drag.current.start) * sign;
    commit(drag.current.size + delta);
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const tokenStep = parseFloat(getComputedStyle(el).getPropertyValue('--space-4'));
    const unit = (Number.isFinite(tokenStep) ? tokenStep : measured.now / 20) * (e.shiftKey ? 4 : 1);
    const grow = { right: 'ArrowRight', left: 'ArrowLeft', bottom: 'ArrowDown', top: 'ArrowUp' }[edge];
    const shrink = { right: 'ArrowLeft', left: 'ArrowRight', bottom: 'ArrowUp', top: 'ArrowDown' }[edge];
    const now = xAxis ? el.getBoundingClientRect().width : el.getBoundingClientRect().height;
    const b = bounds();
    let next: number;
    if (e.key === grow) next = now + unit;
    else if (e.key === shrink) next = now - unit;
    else if (e.key === 'Home') next = b.min;
    else if (e.key === 'End' && Number.isFinite(b.max)) next = b.max;
    else return;
    e.preventDefault();
    commit(next);
  };

  const vars: StyleWithVars = {
    '--resizable-size': current === null ? defaultSize : `calc(var(--space-px) * ${current})`,
    '--resizable-min': minSize,
    '--resizable-max': maxSize,
    ...style,
  };
  const edgeClass = { right: s.edgeRight, left: s.edgeLeft, bottom: s.edgeBottom, top: s.edgeTop }[edge];

  return (
    <div ref={setRootRef} className={cx(s.resizable, xAxis ? s.sizeX : s.sizeY, dragging && s.dragging, className)} style={vars} {...rest}>
      <div id={`${id}-body`} className={s.resizableBody}>
        {children}
      </div>
      <div
        role="separator"
        tabIndex={0}
        aria-label={handleLabel}
        aria-orientation={xAxis ? 'vertical' : 'horizontal'}
        aria-controls={`${id}-body`}
        aria-valuenow={Math.round(measured.now)}
        aria-valuemin={Math.round(measured.min)}
        aria-valuemax={Math.round(measured.max)}
        className={cx(s.handle, s.edge, xAxis ? s.edgeX : s.edgeY, edgeClass)}
        data-state={dataState}
        data-dragging={dragging || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        <span className={s.grip} />
      </div>
    </div>
  );
});
