import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { clamp, zoomAround, useControllable, type Point, type Rect, type ViewState } from './geometry';
import s from './CanvasViewport.module.css';

export type { Point, Rect, ViewState } from './geometry';
export { fitBounds, zoomAround, unionRects, rectsIntersect, formatZoom, clamp } from './geometry';
export { ZoomControls, type ZoomControlsProps } from './ZoomControls';
export { PanControl, type PanControlProps } from './PanControl';

export type CanvasViewportProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> &
  WithForcedState & {
    /** Zoom factor (1 = 100%). Controlled when set. */
    zoom?: number;
    defaultZoom?: number;
    onZoomChange?: (zoom: number) => void;
    /** Screen-space offset of the world origin. Controlled when set. */
    pan?: Point;
    defaultPan?: Point;
    onPanChange?: (pan: Point) => void;
    minZoom?: number;
    maxZoom?: number;
    /** Dotted grid background (scales with zoom). */
    showGrid?: boolean;
    /** What a primary-button drag on empty canvas does. Space+drag and middle-drag always pan. */
    dragMode?: 'select' | 'pan';
    /** Live selection rectangle in world units while dragging; `null` when the drag ends. */
    onSelectionChange?: (rect: Rect | null) => void;
    /** Final selection rectangle in world units. */
    onSelectionEnd?: (rect: Rect) => void;
    /** Primary click on empty canvas (world coordinates). */
    onBackgroundClick?: (point: Point) => void;
    /** Screen-space layer above the world (zoom controls, minimap). Place items with `CanvasOverlay`. */
    overlay?: ReactNode;
    /** Accessible name of the canvas region. */
    label?: string;
    /** Screen units moved per arrow key press (×4 with Shift). */
    keyboardStep?: number;
    /** Content in world coordinates. Position items with `CanvasItem`. */
    children?: ReactNode;
  };

export type CanvasViewportHandle = {
  element: HTMLDivElement | null;
  /** Converts client (event) coordinates to world coordinates. */
  toWorld: (clientX: number, clientY: number) => Point;
  /** Current viewport size in screen units. */
  size: () => { width: number; height: number };
};

type Drag =
  | { kind: 'pan'; id: number; startX: number; startY: number; pan: Point }
  | { kind: 'select'; id: number; startX: number; startY: number; x: number; y: number; moved: boolean };

const isEditable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

/**
 * Infinite pannable/zoomable surface: dotted token grid, wheel zoom around the cursor, space+drag or middle-drag pan,
 * marquee selection, keyboard pan (arrows) and zoom (+ / − / 0).
 */
export const CanvasViewport = forwardRef<CanvasViewportHandle, CanvasViewportProps>(function CanvasViewport(
  {
    zoom: zoomProp,
    defaultZoom = 1,
    onZoomChange,
    pan: panProp,
    defaultPan = { x: 0, y: 0 },
    onPanChange,
    minZoom = 0.1,
    maxZoom = 4,
    showGrid = true,
    dragMode = 'select',
    onSelectionChange,
    onSelectionEnd,
    onBackgroundClick,
    overlay,
    label = 'Canvas',
    keyboardStep = 48,
    children,
    className,
    style,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const [zoom, setZoom, zoomRef] = useControllable(zoomProp, defaultZoom, onZoomChange);
  const [pan, setPan, panRef] = useControllable(panProp, defaultPan, onPanChange);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const hovered = useRef(false);

  const setView = useCallback(
    (v: ViewState) => {
      if (v.zoom !== zoomRef.current) setZoom(v.zoom);
      if (v.pan.x !== panRef.current.x || v.pan.y !== panRef.current.y) setPan(v.pan);
    },
    [setZoom, setPan, zoomRef, panRef],
  );

  const local = useCallback((clientX: number, clientY: number): Point => {
    const r = rootRef.current?.getBoundingClientRect();
    return { x: clientX - (r?.left ?? 0), y: clientY - (r?.top ?? 0) };
  }, []);

  const toWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const p = local(clientX, clientY);
      return { x: (p.x - panRef.current.x) / zoomRef.current, y: (p.y - panRef.current.y) / zoomRef.current };
    },
    [local, panRef, zoomRef],
  );

  useImperativeHandle(
    ref,
    () => ({
      element: rootRef.current,
      toWorld,
      size: () => ({ width: rootRef.current?.clientWidth ?? 0, height: rootRef.current?.clientHeight ?? 0 }),
    }),
    [toWorld],
  );

  const zoomBy = useCallback(
    (factor: number, anchor?: Point) => {
      const el = rootRef.current;
      const a = anchor ?? { x: (el?.clientWidth ?? 0) / 2, y: (el?.clientHeight ?? 0) / 2 };
      const next = clamp(zoomRef.current * factor, minZoom, maxZoom);
      if (next === zoomRef.current) return;
      setView(zoomAround({ zoom: zoomRef.current, pan: panRef.current }, next, a));
    },
    [minZoom, maxZoom, setView, zoomRef, panRef],
  );

  // Wheel zoom around the cursor. Native listener so preventDefault works (React wheel listeners are passive).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const factor = Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.01 : 0.0015));
      zoomBy(factor, local(e.clientX, e.clientY));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomBy, local]);

  // Space-to-pan while the pointer is over (or focus is inside) the canvas.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || isEditable(e.target)) return;
      const inside = hovered.current || rootRef.current?.contains(document.activeElement);
      if (!inside) return;
      e.preventDefault();
      setSpaceHeld(true);
    };
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpaceHeld(false);
    const blur = () => setSpaceHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const startPan = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    rootRef.current?.setPointerCapture(e.pointerId);
    setDrag({ kind: 'pan', id: e.pointerId, startX: e.clientX, startY: e.clientY, pan: panRef.current });
  };

  const onPointerDownCapture = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && spaceHeld)) startPan(e);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || drag) return;
    // Only empty canvas starts a marquee/pan; interactive children keep their own clicks.
    if ((e.target as Element).closest('[data-canvas-overlay], button, a, input, textarea, select, [role="button"], [data-canvas-nodrag]')) return;
    rootRef.current?.focus({ preventScroll: true });
    if (dragMode === 'pan') return startPan(e);
    rootRef.current?.setPointerCapture(e.pointerId);
    const p = local(e.clientX, e.clientY);
    setDrag({ kind: 'select', id: e.pointerId, startX: p.x, startY: p.y, x: p.x, y: p.y, moved: false });
  };

  const selectionWorld = (d: Extract<Drag, { kind: 'select' }>): Rect => {
    const z = zoomRef.current;
    const pn = panRef.current;
    const x0 = Math.min(d.startX, d.x);
    const y0 = Math.min(d.startY, d.y);
    return { x: (x0 - pn.x) / z, y: (y0 - pn.y) / z, width: Math.abs(d.x - d.startX) / z, height: Math.abs(d.y - d.startY) / z };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.kind === 'pan') {
      setPan({ x: drag.pan.x + e.clientX - drag.startX, y: drag.pan.y + e.clientY - drag.startY });
      return;
    }
    const p = local(e.clientX, e.clientY);
    const moved = drag.moved || Math.hypot(p.x - drag.startX, p.y - drag.startY) > 3;
    const next = { ...drag, x: p.x, y: p.y, moved };
    setDrag(next);
    if (moved) onSelectionChange?.(selectionWorld(next));
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.id) return;
    rootRef.current?.releasePointerCapture?.(e.pointerId);
    if (drag.kind === 'select') {
      if (drag.moved) {
        onSelectionEnd?.(selectionWorld(drag));
        onSelectionChange?.(null);
      } else if (e.type === 'pointerup') {
        onBackgroundClick?.(toWorld(e.clientX, e.clientY));
      }
    }
    setDrag(null);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || isEditable(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === '+' || k === '=') {
      e.preventDefault();
      zoomBy(1.25);
    } else if (k === '-' || k === '_') {
      e.preventDefault();
      zoomBy(1 / 1.25);
    } else if (k === '0') {
      e.preventDefault();
      setView({ zoom: clamp(1, minZoom, maxZoom), pan: { x: 0, y: 0 } });
    } else if (e.target === e.currentTarget && k.startsWith('Arrow')) {
      e.preventDefault();
      const step = keyboardStep * (e.shiftKey ? 4 : 1);
      const d = { ArrowUp: [0, step], ArrowDown: [0, -step], ArrowLeft: [step, 0], ArrowRight: [-step, 0] }[k];
      if (d) setPan({ x: panRef.current.x + d[0], y: panRef.current.y + d[1] });
    }
  };

  const sel = drag?.kind === 'select' && drag.moved ? drag : null;
  // Very dense dots read as noise: widen the grid step when zoomed far out.
  const gridMult = zoom < 0.5 ? 4 : 1;

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="canvas"
      aria-label={label}
      aria-describedby={hintId}
      tabIndex={0}
      className={cx(s.root, showGrid && s.grid, spaceHeld && s.grab, drag?.kind === 'pan' && s.panning, className)}
      style={{ ...style, '--cv-zoom': zoom, '--cv-x': pan.x, '--cv-y': pan.y, '--cv-grid-mult': gridMult } as CSSProperties}
      onPointerDownCapture={onPointerDownCapture}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerEnter={() => (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <span id={hintId} className={s.srOnly}>
        Arrow keys pan, plus and minus zoom, 0 resets the view. Hold Space and drag, or drag with the middle button, to pan.
      </span>
      <div className={s.world}>{children}</div>
      {sel && (
        <div
          className={s.selection}
          aria-hidden
          style={{ left: Math.min(sel.startX, sel.x), top: Math.min(sel.startY, sel.y), width: Math.abs(sel.x - sel.startX), height: Math.abs(sel.y - sel.startY) }}
        />
      )}
      {overlay && (
        <div className={s.overlay} data-canvas-overlay>
          {overlay}
        </div>
      )}
    </div>
  );
});

export type CanvasItemProps = HTMLAttributes<HTMLDivElement> & {
  /** World x (left edge). */
  x: number;
  /** World y (top edge). */
  y: number;
};

/** Absolutely positions its content at world coordinates inside a CanvasViewport. */
export const CanvasItem = forwardRef<HTMLDivElement, CanvasItemProps>(function CanvasItem({ x, y, className, style, ...rest }, ref) {
  return <div ref={ref} className={cx(s.item, className)} style={{ ...style, '--ci-x': x, '--ci-y': y } as CSSProperties} {...rest} />;
});

export type CanvasOverlayProps = HTMLAttributes<HTMLDivElement> & {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center' | 'top-center';
};

/** Pins floating controls (zoom pill, pan pad, minimap) to a corner of the canvas, in screen space. */
export function CanvasOverlay({ position = 'bottom-right', className, ...rest }: CanvasOverlayProps) {
  const pos = { 'top-left': s.topLeft, 'top-right': s.topRight, 'bottom-left': s.bottomLeft, 'bottom-right': s.bottomRight, 'bottom-center': s.bottomCenter, 'top-center': s.topCenter }[position];
  return <div className={cx(s.pin, pos, className)} {...rest} />;
}
