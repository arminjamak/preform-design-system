import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import {
  CanvasItem,
  CanvasOverlay,
  CanvasViewport,
  PanControl,
  ZoomControls,
  fitBounds,
  rectsIntersect,
  type CanvasViewportHandle,
  type CanvasViewportProps,
  type Point,
  type Rect,
} from '../components/CanvasViewport/CanvasViewport';
import { Card } from '../components/Card/Card';
import { Badge } from '../components/Badge/Badge';

/* Parts laid out on a Form 4 build plate (world units). Card size matches the tokens below: 144 × 96. */
const ITEM_W = 144;
const ITEM_H = 96;
const PARTS = [
  { id: 'upper', name: 'Upper arch model', meta: 'Grey V5 · 100 µm', time: '2h 14m', x: 0, y: 0 },
  { id: 'lower', name: 'Lower arch model', meta: 'Grey V5 · 100 µm', time: '2h 02m', x: 176, y: 0 },
  { id: 'guide', name: 'Surgical guide #A-17', meta: 'Surgical Guide · 50 µm', time: '1h 38m', x: 352, y: 0 },
  { id: 'night', name: 'Night guard', meta: 'Flexible 80A · 100 µm', time: '3h 05m', x: 0, y: 128 },
  { id: 'bracket', name: 'Bracket v3', meta: 'Tough 2000 · 100 µm', time: '4h 21m', x: 176, y: 128, warn: 'Islands' },
  { id: 'jig', name: 'Assembly jig', meta: 'Draft V2 · 200 µm', time: '0h 47m', x: 352, y: 128 },
];
const BOUNDS: Rect = { x: 0, y: 0, width: 352 + ITEM_W, height: 128 + ITEM_H };

function Parts({ selected }: { selected: string[] }) {
  return (
    <>
      {PARTS.map((p) => (
        <CanvasItem key={p.id} x={p.x} y={p.y}>
          <Card
            variant="elevated"
            padding="sm"
            selected={selected.includes(p.id)}
            style={{ width: 'calc(var(--space-24) * 1.5)', height: 'var(--space-24)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}
          >
            <span className="pf-text-label">{p.name}</span>
            <span className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>
              {p.meta}
            </span>
            <span style={{ marginTop: 'auto', display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
              <Badge tone="accent">{p.time}</Badge>
              {p.warn && <Badge tone="warning">{p.warn}</Badge>}
            </span>
          </Card>
        </CanvasItem>
      ))}
    </>
  );
}

const meta = {
  title: 'Components/Interaction/CanvasViewport',
  component: CanvasViewport,
  tags: ['expanded'],
  args: {
    zoom: 1,
    pan: { x: 48, y: 48 },
    minZoom: 0.25,
    maxZoom: 4,
    showGrid: true,
    dragMode: 'select',
    label: 'Build plate canvas',
    keyboardStep: 48,
    onZoomChange: fn(),
    onPanChange: fn(),
    onSelectionEnd: fn(),
    onBackgroundClick: fn(),
  },
  argTypes: {
    zoom: { control: { type: 'range', min: 0.25, max: 4, step: 0.05 } },
    pan: { control: 'object' },
    minZoom: { control: { type: 'number', step: 0.05 } },
    maxZoom: { control: { type: 'number', step: 0.5 } },
    dragMode: { control: 'inline-radio', options: ['select', 'pan'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'focus'], name: 'forced state' },
    children: { control: false },
    overlay: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Infinite canvas behind the workflow builder and build-plate layouts. Wheel zooms around the cursor, Space+drag or middle-drag pans, primary drag draws a selection rectangle; arrow keys pan, + / − zoom and 0 resets when focused. The dotted grid is a radial-gradient of `--color-border-strong` on `--color-bg-canvas`, spaced by `--space-5` × zoom. Ships with the floating `ZoomControls` pill and `PanControl` pad.',
      },
    },
  },
  decorators: [
    (S, ctx) => (
      <div style={{ width: '100%', height: ctx.parameters.frameHeight ?? 'calc(var(--space-24) * 5)' }}>
        <S />
      </div>
    ),
  ],
  render: function Render(args) {
    const [{ zoom, pan }, update] = useArgs<CanvasViewportProps>();
    const [selected, setSelected] = useState<string[]>([]);
    const canvas = useRef<CanvasViewportHandle>(null);
    const z = zoom ?? 1;
    const p = pan ?? { x: 0, y: 0 };
    const setZoom = (v: number) => {
      update({ zoom: v });
      args.onZoomChange?.(v);
    };
    const setPan = (v: Point) => {
      update({ pan: v });
      args.onPanChange?.(v);
    };
    const fit = () => {
      const v = fitBounds(BOUNDS, canvas.current?.size() ?? { width: 0, height: 0 }, { maxZoom: 1.5 });
      setZoom(v.zoom);
      setPan(v.pan);
    };
    const pick = (r: Rect | null) => r && setSelected(PARTS.filter((x) => rectsIntersect({ x: x.x, y: x.y, width: ITEM_W, height: ITEM_H }, r)).map((x) => x.id));
    return (
      <CanvasViewport
        {...args}
        ref={canvas}
        zoom={z}
        pan={p}
        onZoomChange={setZoom}
        onPanChange={setPan}
        onSelectionChange={pick}
        onBackgroundClick={(pt) => {
          setSelected([]);
          args.onBackgroundClick?.(pt);
        }}
        overlay={
          <>
            <CanvasOverlay position="top-left">
              <Badge tone="neutral" variant="outline" size="md">
                {selected.length ? `${selected.length} of ${PARTS.length} parts selected` : 'Form 4 · Build plate 1'}
              </Badge>
            </CanvasOverlay>
            <CanvasOverlay position="bottom-right">
              <PanControl pan={p} onPanChange={setPan} onFit={fit} />
              <ZoomControls
                zoom={z}
                onZoomChange={setZoom}
                minZoom={args.minZoom}
                maxZoom={args.maxZoom}
                onFit={fit}
                onReset={() => {
                  setZoom(1);
                  setPan({ x: 48, y: 48 });
                }}
              />
            </CanvasOverlay>
          </>
        }
      >
        <Parts selected={selected} />
      </CanvasViewport>
    );
  },
} satisfies Meta<typeof CanvasViewport>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ZoomedOut: Story = { args: { zoom: 0.5, pan: { x: 160, y: 120 } } };

export const DragToPan: Story = {
  args: { dragMode: 'pan' },
  parameters: { docs: { description: { story: 'Hand-tool mode: a primary drag on empty canvas pans instead of drawing a selection.' } } },
};

export const WithoutGrid: Story = { args: { showGrid: false } };

export const ZoomControlsPill: Story = {
  name: 'Zoom controls',
  parameters: { frameHeight: 'auto', docs: { description: { story: '`ZoomControls`: −, percentage readout (opens 50 / 100 / 200 % and Fit to view), +, reset. Buttons disable at the zoom limits.' } } },
  render: function Render() {
    const [zoom, setZoom] = useState(1);
    return (
      <div className="sb-stack">
        <ZoomControls zoom={zoom} onZoomChange={setZoom} onFit={() => setZoom(0.8)} menuPlacement="bottom" />
        <ZoomControls zoom={0.25} onZoomChange={() => {}} minZoom={0.25} menuPlacement="bottom" />
        <ZoomControls zoom={4} onZoomChange={() => {}} maxZoom={4} hideReset menuPlacement="bottom" />
      </div>
    );
  },
};

export const PanControlPad: Story = {
  name: 'Pan control',
  parameters: { frameHeight: 'auto', docs: { description: { story: '`PanControl`: directional pad with a centre Fit to view button. Arrow keys pan while it has focus (Shift = 4× step).' } } },
  render: function Render() {
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
    return (
      <div className="sb-row">
        <PanControl pan={pan} onPanChange={setPan} onFit={() => setPan({ x: 0, y: 0 })} />
        <PanControl pan={pan} onPanChange={setPan} data-state="focus" />
        <span className="pf-text-mono">
          pan {Math.round(pan.x)}, {Math.round(pan.y)}
        </span>
      </div>
    );
  },
};

export const Fullscreen: Story = {
  parameters: { layout: 'fullscreen', frameHeight: 'calc(var(--space-24) * 7)' },
};
