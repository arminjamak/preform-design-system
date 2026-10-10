import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { BoxIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Tone } from '../../lib/types';
import { Badge } from '../Badge/Badge';
import {
  CanvasItem,
  CanvasOverlay,
  CanvasViewport,
  ZoomControls,
  fitBounds,
  rectsIntersect,
  unionRects,
  type CanvasViewportHandle,
  type Point,
  type Rect,
} from '../CanvasViewport/CanvasViewport';
import { Minimap } from './Minimap';
import s from './NodeEditor.module.css';

export type NodeEditorPort = {
  id: string;
  label: string;
  /** Data type. Only ports of the same type connect (`any` or no type connects to everything). */
  type?: string;
};

export type NodeEditorNode = {
  id: string;
  /** Palette type; supplies the header icon and colour. */
  type: string;
  title: string;
  /** World position of the top-left corner. */
  x: number;
  y: number;
  inputs: NodeEditorPort[];
  outputs: NodeEditorPort[];
  /** Secondary line under the title (device, setting). */
  subtitle?: string;
  /** Small status pill in the header. */
  badge?: { label: string; tone?: Tone };
};

export type NodeEditorEdge = {
  id: string;
  from: { node: string; port: string };
  to: { node: string; port: string };
};

export type NodeEditorPaletteItem = {
  type: string;
  title: string;
  icon: ReactNode;
  description?: string;
  /** Chart series colour index (1–6) for the node header. */
  color?: number;
  /** Heading the item is listed under in the sidebar. */
  group?: string;
  /** Ports a new node of this type starts with. */
  inputs?: NodeEditorPort[];
  outputs?: NodeEditorPort[];
};

export type NodeEditorValue = { nodes: NodeEditorNode[]; edges: NodeEditorEdge[] };

export type NodeEditorProps = {
  nodes: NodeEditorNode[];
  edges: NodeEditorEdge[];
  onChange: (value: NodeEditorValue) => void;
  /** Node types offered in the sidebar (click or drag onto the canvas to add). */
  palette?: NodeEditorPaletteItem[];
  showPalette?: boolean;
  showMinimap?: boolean;
  showGrid?: boolean;
  /** Port data type → chart series index (1–6). Unlisted types get a stable colour from their name. */
  portTypes?: Record<string, number>;
  /** Disables editing; panning, zooming and selection still work. */
  readOnly?: boolean;
  /** Frames all nodes when first shown. */
  fitOnMount?: boolean;
  minZoom?: number;
  maxZoom?: number;
  onSelectionChange?: (selection: { nodes: string[]; edge: string | null }) => void;
  /** Accessible name of the canvas. */
  label?: string;
  paletteTitle?: string;
  className?: string;
};

type Layout = Record<string, { w: number; h: number; ports: Record<string, Point> }>;
type NodeDrag = { pointer: number; startX: number; startY: number; ids: string[]; dx: number; dy: number; moved: boolean };
type Connect = { pointer: number; from: { node: string; port: string; type?: string }; start: Point; at: Point; moved: boolean; detached?: string };

const MIME = 'application/x-preform-node';
const portKey = (node: string, dir: 'in' | 'out', port: string) => `${node}|${dir}|${port}`;
const compatible = (a?: string, b?: string) => !a || !b || a === 'any' || b === 'any' || a === b;

function hashIndex(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return (h % 6) + 1;
}

/** Offset of `el` inside `ancestor` in layout (untransformed = world) units. */
function offsetWithin(el: HTMLElement, ancestor: HTMLElement): Point {
  let x = 0;
  let y = 0;
  let cur: HTMLElement | null = el;
  while (cur && cur !== ancestor) {
    x += cur.offsetLeft;
    y += cur.offsetTop;
    cur = cur.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

export function edgePath(a: Point, b: Point) {
  const dx = Math.max(40, Math.abs(b.x - a.x) * 0.5);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

/**
 * Node-graph editor for PreForm workflows: pannable/zoomable canvas, nodes with typed ports, bezier edges,
 * drag to move or connect, marquee select, Delete to remove, palette sidebar and optional minimap.
 */
export function NodeEditor({
  nodes,
  edges,
  onChange,
  palette = [],
  showPalette = true,
  showMinimap = true,
  showGrid = true,
  portTypes,
  readOnly,
  fitOnMount = true,
  minZoom = 0.2,
  maxZoom = 2.5,
  onSelectionChange,
  label = 'Workflow canvas',
  paletteTitle = 'Add step',
  className,
}: NodeEditorProps) {
  const canvasRef = useRef<CanvasViewportHandle>(null);
  const pointerFocus = useRef(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [layout, setLayout] = useState<Layout>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [drag, setDrag] = useState<NodeDrag | null>(null);
  const [connect, setConnect] = useState<Connect | null>(null);
  const [pending, setPending] = useState<Connect['from'] | null>(null);
  const [announce, setAnnounce] = useState('');
  const fitted = useRef(false);

  const paletteByType = useMemo(() => Object.fromEntries(palette.map((p) => [p.type, p])), [palette]);
  const colorOf = useCallback((type?: string) => `var(--color-chart-series-${type ? (portTypes?.[type] ?? hashIndex(type)) : 6})`, [portTypes]);

  const select = useCallback(
    (ids: string[], edge: string | null = null) => {
      setSelected(ids);
      setSelectedEdge(edge);
      onSelectionChange?.({ nodes: ids, edge });
    },
    [onSelectionChange],
  );

  // Measure node sizes and port anchors in world units whenever the node structure changes.
  const structure = nodes.map((n) => `${n.id}:${n.title}:${n.subtitle ?? ''}:${n.badge?.label ?? ''}:${n.inputs.map((p) => p.id).join(',')}:${n.outputs.map((p) => p.id).join(',')}`).join(';');
  const measure = useCallback(() => {
    const world = canvasRef.current?.element;
    if (!world) return;
    const next: Layout = {};
    world.querySelectorAll<HTMLElement>('[data-node-id]').forEach((el) => {
      const id = el.dataset.nodeId!;
      const ports: Record<string, Point> = {};
      el.querySelectorAll<HTMLElement>('[data-port-key]').forEach((p) => {
        const o = offsetWithin(p, el);
        ports[p.dataset.portKey!] = { x: el.clientLeft + o.x + p.offsetWidth / 2, y: el.clientTop + o.y + p.offsetHeight / 2 };
      });
      next[id] = { w: el.offsetWidth, h: el.offsetHeight, ports };
    });
    setLayout(next);
  }, []);
  useLayoutEffect(measure, [structure, measure]);
  useEffect(() => {
    document.fonts?.ready.then(measure).catch(() => undefined);
  }, [measure]);

  // Track canvas size for fit-to-view and the minimap viewport rectangle.
  useEffect(() => {
    const el = canvasRef.current?.element;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ width: el.clientWidth, height: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pos = useCallback(
    (n: NodeEditorNode): Point => (drag && drag.ids.includes(n.id) ? { x: n.x + drag.dx, y: n.y + drag.dy } : { x: n.x, y: n.y }),
    [drag],
  );
  const nodeRect = useCallback(
    (n: NodeEditorNode): Rect => {
      const p = pos(n);
      const l = layout[n.id];
      return { x: p.x, y: p.y, width: l?.w ?? 180, height: l?.h ?? 80 };
    },
    [layout, pos],
  );
  const anchor = useCallback(
    (nodeId: string, dir: 'in' | 'out', port: string): Point | null => {
      const n = nodes.find((x) => x.id === nodeId);
      const off = layout[nodeId]?.ports[portKey(nodeId, dir, port)];
      if (!n || !off) return null;
      const p = pos(n);
      return { x: p.x + off.x, y: p.y + off.y };
    },
    [nodes, layout, pos],
  );

  const fit = useCallback(() => {
    const b = unionRects(nodes.map(nodeRect));
    if (!b || !size.width) return;
    const v = fitBounds(b, size, { padding: 48, minZoom, maxZoom: Math.min(maxZoom, 1) });
    setZoom(v.zoom);
    setPan(v.pan);
  }, [nodes, nodeRect, size, minZoom, maxZoom]);

  useEffect(() => {
    if (!fitOnMount || fitted.current || !size.width || !Object.keys(layout).length) return;
    fitted.current = true;
    fit();
  }, [fitOnMount, size, layout, fit]);

  const typeOfPort = (nodeId: string, dir: 'in' | 'out', port: string) => {
    const n = nodes.find((x) => x.id === nodeId);
    return (dir === 'in' ? n?.inputs : n?.outputs)?.find((p) => p.id === port)?.type;
  };
  const titleOf = (id: string) => nodes.find((n) => n.id === id)?.title ?? id;
  const portLabel = (nodeId: string, dir: 'in' | 'out', port: string) => {
    const n = nodes.find((x) => x.id === nodeId);
    return (dir === 'in' ? n?.inputs : n?.outputs)?.find((p) => p.id === port)?.label ?? port;
  };

  /** Adds (or re-routes) an edge into an input. Inputs take a single connection. */
  const connectTo = (from: Connect['from'], to: { node: string; port: string }, base: NodeEditorEdge[] = edges) => {
    if (from.node === to.node || !compatible(from.type, typeOfPort(to.node, 'in', to.port))) return false;
    const rest = base.filter((e) => !(e.to.node === to.node && e.to.port === to.port));
    const edge: NodeEditorEdge = { id: `e-${from.node}-${from.port}-${to.node}-${to.port}`, from: { node: from.node, port: from.port }, to };
    onChange({ nodes, edges: [...rest, edge] });
    setAnnounce(`Connected ${titleOf(from.node)} ${portLabel(from.node, 'out', from.port)} to ${titleOf(to.node)} ${portLabel(to.node, 'in', to.port)}`);
    return true;
  };

  const deleteSelection = () => {
    if (readOnly) return;
    if (!selected.length && !selectedEdge) return;
    const gone = new Set(selected);
    onChange({
      nodes: nodes.filter((n) => !gone.has(n.id)),
      edges: edges.filter((e) => e.id !== selectedEdge && !gone.has(e.from.node) && !gone.has(e.to.node)),
    });
    setAnnounce(selected.length ? `Deleted ${selected.length === 1 ? titleOf(selected[0]) : `${selected.length} steps`}` : 'Deleted connection');
    select([]);
    canvasRef.current?.element?.focus({ preventScroll: true });
  };

  const moveNodes = (ids: string[], dx: number, dy: number) => {
    if (readOnly || (!dx && !dy)) return;
    onChange({ nodes: nodes.map((n) => (ids.includes(n.id) ? { ...n, x: Math.round(n.x + dx), y: Math.round(n.y + dy) } : n)), edges });
  };

  /* ---------- node pointer + keyboard ---------- */
  const onNodePointerDown = (e: PointerEvent<HTMLDivElement>, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    pointerFocus.current = true;
    let ids = selected;
    if (e.shiftKey || e.metaKey) {
      ids = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
      select(ids);
    } else if (!selected.includes(id)) {
      ids = [id];
      select(ids);
    }
    if (readOnly || !ids.includes(id)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ pointer: e.pointerId, startX: e.clientX, startY: e.clientY, ids, dx: 0, dy: 0, moved: false });
  };
  const onNodePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag || drag.pointer !== e.pointerId) return;
    const dx = (e.clientX - drag.startX) / zoom;
    const dy = (e.clientY - drag.startY) / zoom;
    setDrag({ ...drag, dx, dy, moved: drag.moved || Math.hypot(dx, dy) * zoom > 3 });
  };
  const onNodePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    pointerFocus.current = false;
    if (!drag || drag.pointer !== e.pointerId) return;
    if (drag.moved && e.type === 'pointerup') moveNodes(drag.ids, drag.dx, drag.dy);
    setDrag(null);
  };
  const onNodeKeyDown = (e: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (e.target !== e.currentTarget) return;
    const step = e.shiftKey ? 40 : 8;
    const d = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }[e.key];
    if (!d) return;
    e.preventDefault();
    const ids = selected.includes(id) ? selected : [id];
    if (!selected.includes(id)) select(ids);
    moveNodes(ids, d[0], d[1]);
  };

  /* ---------- port pointer (drag to connect) + click (keyboard connect) ---------- */
  const onPortPointerDown = (e: PointerEvent<HTMLButtonElement>, node: string, dir: 'in' | 'out', port: string) => {
    if (e.button !== 0 || readOnly) return;
    e.stopPropagation();
    let from: Connect['from'] | null = null;
    let detached: string | undefined;
    if (dir === 'out') from = { node, port, type: typeOfPort(node, 'out', port) };
    else {
      const existing = edges.find((x) => x.to.node === node && x.to.port === port);
      if (!existing) return;
      from = { ...existing.from, type: typeOfPort(existing.from.node, 'out', existing.from.port) };
      detached = existing.id;
    }
    const start = anchor(from.node, 'out', from.port);
    if (!start) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setConnect({ pointer: e.pointerId, from, start, at: canvasRef.current?.toWorld(e.clientX, e.clientY) ?? start, moved: false, detached });
  };
  const onPortPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!connect || connect.pointer !== e.pointerId) return;
    const at = canvasRef.current?.toWorld(e.clientX, e.clientY) ?? connect.at;
    setConnect({ ...connect, at, moved: connect.moved || Math.hypot(at.x - connect.start.x, at.y - connect.start.y) * zoom > 6 });
  };
  const onPortPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!connect || connect.pointer !== e.pointerId) return;
    const c = connect;
    setConnect(null);
    if (!c.moved || e.type !== 'pointerup') return; // a click: handled by onPortClick
    const base = c.detached ? edges.filter((x) => x.id !== c.detached) : edges;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-port-dir="in"]');
    const ok = target && connectTo(c.from, { node: target.dataset.node!, port: target.dataset.port! }, base);
    if (!ok && c.detached) {
      onChange({ nodes, edges: base });
      setAnnounce('Disconnected');
    }
    setPending(null);
  };
  const onPortClick = (node: string, dir: 'in' | 'out', port: string) => {
    if (readOnly) return;
    if (dir === 'out') {
      const same = pending && pending.node === node && pending.port === port;
      setPending(same ? null : { node, port, type: typeOfPort(node, 'out', port) });
      if (!same) setAnnounce(`Connecting from ${titleOf(node)} ${portLabel(node, 'out', port)}. Choose an input port, or press Escape.`);
    } else if (pending) {
      if (connectTo(pending, { node, port })) setPending(null);
      else setAnnounce('Those ports cannot be connected');
    }
  };

  /* ---------- canvas ---------- */
  const onCanvasKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.isContentEditable || ['INPUT', 'TEXTAREA'].includes(t.tagName)) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteSelection();
    } else if (e.key === 'Escape') {
      setPending(null);
      setConnect(null);
      select([]);
    } else if ((e.key === 'a' || e.key === 'A') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      select(nodes.map((n) => n.id));
    }
  };
  const onMarquee = (r: Rect | null) => r && select(nodes.filter((n) => rectsIntersect(nodeRect(n), r)).map((n) => n.id));

  /* ---------- palette ---------- */
  const addNode = (type: string, at?: Point) => {
    const item = paletteByType[type];
    if (!item || readOnly) return;
    let k = nodes.length + 1;
    while (nodes.some((n) => n.id === `${type}-${k}`)) k++;
    const center = at ?? { x: (size.width / 2 - pan.x) / zoom - 90, y: (size.height / 2 - pan.y) / zoom - 40 };
    const p = { x: Math.round(center.x), y: Math.round(center.y) };
    while (!at && nodes.some((n) => Math.abs(n.x - p.x) < 8 && Math.abs(n.y - p.y) < 8)) {
      p.x += 24;
      p.y += 24;
    }
    const node: NodeEditorNode = { id: `${type}-${k}`, type, title: item.title, ...p, inputs: item.inputs ?? [], outputs: item.outputs ?? [] };
    onChange({ nodes: [...nodes, node], edges });
    select([node.id]);
    setAnnounce(`Added ${item.title}`);
  };
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes(MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    const type = e.dataTransfer.getData(MIME);
    if (!type) return;
    e.preventDefault();
    const w = canvasRef.current?.toWorld(e.clientX, e.clientY);
    if (w) addNode(type, { x: w.x - 90, y: w.y - 14 });
  };

  const groups = useMemo(() => {
    const m = new Map<string, NodeEditorPaletteItem[]>();
    palette.forEach((p) => m.set(p.group ?? '', [...(m.get(p.group ?? '') ?? []), p]));
    return [...m.entries()];
  }, [palette]);

  const connectedIn = new Set(edges.map((e) => portKey(e.to.node, 'in', e.to.port)));
  const connectedOut = new Set(edges.map((e) => portKey(e.from.node, 'out', e.from.port)));
  const linking = connect?.moved ? connect.from : pending;

  return (
    <div className={cx(s.root, className)}>
      {showPalette && palette.length > 0 && (
        <aside className={s.palette} aria-label={paletteTitle}>
          <h3 className={s.paletteTitle}>{paletteTitle}</h3>
          {groups.map(([group, items]) => (
            <div key={group || 'all'} className={s.paletteGroup} role="group" aria-label={group || paletteTitle}>
              {group && <div className={s.paletteGroupLabel}>{group}</div>}
              {items.map((p) => (
                <button
                  key={p.type}
                  type="button"
                  draggable={!readOnly}
                  disabled={readOnly}
                  className={s.paletteItem}
                  style={{ '--node-color': `var(--color-chart-series-${p.color ?? 1})` } as CSSProperties}
                  onClick={() => addNode(p.type)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(MIME, p.type);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  aria-label={`Add ${p.title}${p.description ? `: ${p.description}` : ''}`}
                >
                  <span className={s.icon} aria-hidden>
                    {p.icon}
                  </span>
                  <span className={s.paletteText}>
                    <span className={s.paletteName}>{p.title}</span>
                    {p.description && <span className={s.paletteDesc}>{p.description}</span>}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </aside>
      )}

      <div className={s.canvasWrap} onDragOver={onDragOver} onDrop={onDrop}>
        <CanvasViewport
          ref={canvasRef}
          label={label}
          zoom={zoom}
          onZoomChange={setZoom}
          pan={pan}
          onPanChange={setPan}
          minZoom={minZoom}
          maxZoom={maxZoom}
          showGrid={showGrid}
          onSelectionChange={onMarquee}
          onBackgroundClick={() => {
            select([]);
            setPending(null);
          }}
          onKeyDown={onCanvasKeyDown}
          className={cx(s.canvas, linking && s.linking)}
          overlay={
            <>
              <CanvasOverlay position="bottom-left">
                <ZoomControls zoom={zoom} onZoomChange={(z) => {
                  const c = { x: size.width / 2, y: size.height / 2 };
                  setPan({ x: c.x - (c.x - pan.x) * (z / zoom), y: c.y - (c.y - pan.y) * (z / zoom) });
                  setZoom(z);
                }} minZoom={minZoom} maxZoom={maxZoom} onFit={fit} onReset={fit} />
              </CanvasOverlay>
              {showMinimap && nodes.length > 0 && (
                <CanvasOverlay position="bottom-right">
                  <Minimap
                    nodes={nodes.map((n) => ({ id: n.id, rect: nodeRect(n), color: `var(--color-chart-series-${paletteByType[n.type]?.color ?? 1})`, selected: selected.includes(n.id) }))}
                    view={{ x: -pan.x / zoom, y: -pan.y / zoom, width: size.width / zoom, height: size.height / zoom }}
                    onNavigate={(p) => setPan({ x: size.width / 2 - p.x * zoom, y: size.height / 2 - p.y * zoom })}
                  />
                </CanvasOverlay>
              )}
            </>
          }
        >
          <svg className={s.edges} aria-hidden={false} role="group" aria-label="Connections">
            {edges.map((e) => {
              if (connect?.moved && connect.detached === e.id) return null;
              const a = anchor(e.from.node, 'out', e.from.port);
              const b = anchor(e.to.node, 'in', e.to.port);
              if (!a || !b) return null;
              const d = edgePath(a, b);
              const isSel = selectedEdge === e.id;
              const name = `Connection from ${titleOf(e.from.node)} ${portLabel(e.from.node, 'out', e.from.port)} to ${titleOf(e.to.node)} ${portLabel(e.to.node, 'in', e.to.port)}`;
              return (
                <g key={e.id} className={cx(s.edge, isSel && s.edgeSelected)} style={{ '--edge-color': colorOf(typeOfPort(e.from.node, 'out', e.from.port)) } as CSSProperties}>
                  <path
                    d={d}
                    className={s.edgeHit}
                    tabIndex={0}
                    role="button"
                    aria-label={name}
                    aria-pressed={isSel}
                    onPointerDown={(ev) => {
                      ev.stopPropagation();
                      select([], e.id);
                    }}
                    onFocus={() => selectedEdge !== e.id && select([], e.id)}
                  >
                    <title>{name}</title>
                  </path>
                  <path d={d} className={s.edgeLine} />
                </g>
              );
            })}
            {linking && connect?.moved && (
              <path d={edgePath(connect.start, connect.at)} className={s.draft} style={{ '--edge-color': colorOf(connect.from.type) } as CSSProperties} />
            )}
          </svg>

          {nodes.map((n) => {
            const p = pos(n);
            const item = paletteByType[n.type];
            const isSel = selected.includes(n.id);
            return (
              <CanvasItem
                key={n.id}
                x={p.x}
                y={p.y}
                data-node-id={n.id}
                tabIndex={0}
                role="group"
                aria-roledescription="step"
                aria-label={`${n.title}${n.subtitle ? `, ${n.subtitle}` : ''}${isSel ? ', selected' : ''}`}
                className={cx(s.node, isSel && s.nodeSelected, drag?.moved && drag.ids.includes(n.id) && s.nodeDragging)}
                style={{ '--node-color': `var(--color-chart-series-${item?.color ?? 1})` } as CSSProperties}
                onPointerDown={(e) => onNodePointerDown(e, n.id)}
                onPointerMove={onNodePointerMove}
                onPointerUp={onNodePointerUp}
                onPointerCancel={onNodePointerUp}
                onKeyDown={(e) => onNodeKeyDown(e, n.id)}
                onFocus={(e) => {
                  // Keyboard focus selects the step; pointer focus already handled selection (incl. Shift+click).
                  if (e.target !== e.currentTarget || pointerFocus.current) return;
                  if (!isSel) select([n.id]);
                }}
              >
                <div className={s.header}>
                  <span className={s.icon} aria-hidden>
                    {item?.icon ?? <BoxIcon />}
                  </span>
                  <span className={s.titles}>
                    <span className={s.title}>{n.title}</span>
                    {n.subtitle && <span className={s.subtitle}>{n.subtitle}</span>}
                  </span>
                  {n.badge && (
                    <Badge tone={n.badge.tone ?? 'neutral'} size="sm">
                      {n.badge.label}
                    </Badge>
                  )}
                </div>
                {(n.inputs.length > 0 || n.outputs.length > 0) && (
                  <div className={s.body}>
                    <ul className={s.ports} aria-label="Inputs">
                      {n.inputs.map((port) => {
                        const key = portKey(n.id, 'in', port.id);
                        const canDrop = linking && linking.node !== n.id && compatible(linking.type, port.type);
                        return (
                          <li key={port.id} className={s.port}>
                            <button
                              type="button"
                              data-port-key={key}
                              data-port-dir="in"
                              data-node={n.id}
                              data-port={port.id}
                              className={cx(s.dot, s.dotIn, connectedIn.has(key) && s.dotConnected, canDrop && s.dotTarget, linking && !canDrop && s.dotMuted)}
                              style={{ '--port-color': colorOf(port.type) } as CSSProperties}
                              aria-label={`Input ${port.label}${port.type ? ` (${port.type})` : ''}${connectedIn.has(key) ? ', connected' : ''}`}
                              onPointerDown={(e) => onPortPointerDown(e, n.id, 'in', port.id)}
                              onPointerMove={onPortPointerMove}
                              onPointerUp={onPortPointerUp}
                              onPointerCancel={onPortPointerUp}
                              onClick={() => onPortClick(n.id, 'in', port.id)}
                            />
                            <span className={s.portLabel}>{port.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <ul className={cx(s.ports, s.portsOut)} aria-label="Outputs">
                      {n.outputs.map((port) => {
                        const key = portKey(n.id, 'out', port.id);
                        const active = pending?.node === n.id && pending.port === port.id;
                        return (
                          <li key={port.id} className={s.port}>
                            <span className={s.portLabel}>{port.label}</span>
                            <button
                              type="button"
                              data-port-key={key}
                              data-port-dir="out"
                              className={cx(s.dot, s.dotOut, connectedOut.has(key) && s.dotConnected, active && s.dotActive, linking && !active && s.dotMuted)}
                              style={{ '--port-color': colorOf(port.type) } as CSSProperties}
                              aria-label={`Output ${port.label}${port.type ? ` (${port.type})` : ''}`}
                              aria-pressed={active}
                              onPointerDown={(e) => onPortPointerDown(e, n.id, 'out', port.id)}
                              onPointerMove={onPortPointerMove}
                              onPointerUp={onPortPointerUp}
                              onPointerCancel={onPortPointerUp}
                              onClick={() => onPortClick(n.id, 'out', port.id)}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </CanvasItem>
            );
          })}
        </CanvasViewport>
        <div className={s.srOnly} aria-live="polite">
          {announce}
        </div>
      </div>
    </div>
  );
}
