/** Pure viewport maths shared by CanvasViewport, ZoomControls, PanControl and NodeEditor. Plain numbers: this is pointer/world geometry. */
import { useCallback, useRef, useState } from 'react';

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type ViewState = { zoom: number; pan: Point };

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Zoom to `nextZoom` keeping the screen point `anchor` fixed over the same world point. */
export function zoomAround(view: ViewState, nextZoom: number, anchor: Point): ViewState {
  const k = nextZoom / view.zoom;
  return { zoom: nextZoom, pan: { x: anchor.x - (anchor.x - view.pan.x) * k, y: anchor.y - (anchor.y - view.pan.y) * k } };
}

/** Zoom + pan that frames `bounds` (world units) inside a viewport of `size` (screen units). */
export function fitBounds(
  bounds: Rect,
  size: { width: number; height: number },
  { padding = 48, minZoom = 0.1, maxZoom = 4 }: { padding?: number; minZoom?: number; maxZoom?: number } = {},
): ViewState {
  if (bounds.width <= 0 || bounds.height <= 0 || size.width <= 0 || size.height <= 0) return { zoom: 1, pan: { x: 0, y: 0 } };
  const zoom = clamp(Math.min((size.width - padding * 2) / bounds.width, (size.height - padding * 2) / bounds.height), minZoom, maxZoom);
  return {
    zoom,
    pan: { x: size.width / 2 - (bounds.x + bounds.width / 2) * zoom, y: size.height / 2 - (bounds.y + bounds.height / 2) * zoom },
  };
}

/** Bounding box of a list of rects (null when empty). */
export function unionRects(rects: Rect[]): Rect | null {
  if (!rects.length) return null;
  const x0 = Math.min(...rects.map((r) => r.x));
  const y0 = Math.min(...rects.map((r) => r.y));
  const x1 = Math.max(...rects.map((r) => r.x + r.width));
  const y1 = Math.max(...rects.map((r) => r.y + r.height));
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

export const rectsIntersect = (a: Rect, b: Rect) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

export const formatZoom = (zoom: number) => `${Math.round(zoom * 100)}%`;

/** Controlled-with-fallback state. The setter also updates a ref synchronously so rapid events (wheel) never read stale values. */
export function useControllable<T>(value: T | undefined, initial: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState<T>(initial);
  const current = value !== undefined ? value : inner;
  const ref = useRef(current);
  ref.current = current;
  const set = useCallback(
    (v: T) => {
      ref.current = v;
      if (value === undefined) setInner(v);
      onChange?.(v);
    },
    [value, onChange],
  );
  return [current, set, ref] as const;
}
