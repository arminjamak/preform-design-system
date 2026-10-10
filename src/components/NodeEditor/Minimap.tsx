import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { cx } from '../../lib/cx';
import { unionRects, type Point, type Rect } from '../CanvasViewport/CanvasViewport';
import s from './NodeEditor.module.css';

export type MinimapProps = {
  nodes: Array<{ id: string; rect: Rect; color?: string; selected?: boolean }>;
  /** Visible world rectangle. */
  view: Rect;
  /** Called with the world point to centre on (click or drag). */
  onNavigate: (center: Point) => void;
  label?: string;
  className?: string;
};

/** Overview of every node with the visible area outlined; click or drag to move the view. */
export function Minimap({ nodes, view, onNavigate, label = 'Minimap', className }: MinimapProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);
  const content = unionRects(nodes.map((n) => n.rect)) ?? view;
  const b = unionRects([content, view.width > 0 ? view : content])!;
  const pad = Math.max(b.width, b.height) * 0.06;
  const box = { x: b.x - pad, y: b.y - pad, w: b.width + pad * 2, h: b.height + pad * 2 };

  const toWorld = (e: PointerEvent<SVGSVGElement>): Point | null => {
    const svg = ref.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  const go = (e: PointerEvent<SVGSVGElement>) => {
    const p = toWorld(e);
    if (p) onNavigate(p);
  };

  return (
    <svg
      ref={ref}
      role="img"
      aria-label={`${label}: ${nodes.length} steps`}
      className={cx(s.minimap, className)}
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        go(e);
      }}
      onPointerMove={(e) => dragging && go(e)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      {nodes.map((n) => (
        <rect
          key={n.id}
          x={n.rect.x}
          y={n.rect.y}
          width={n.rect.width}
          height={n.rect.height}
          rx={Math.min(n.rect.width, n.rect.height) * 0.08}
          className={cx(s.miniNode, n.selected && s.miniNodeSelected)}
          style={{ '--node-color': n.color ?? 'var(--color-chart-series-1)' } as CSSProperties}
        />
      ))}
      <rect x={view.x} y={view.y} width={Math.max(0, view.width)} height={Math.max(0, view.height)} className={s.miniView} />
    </svg>
  );
}
