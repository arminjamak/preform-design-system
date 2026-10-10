import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { ClipboardCheckIcon, DropletsIcon, FileBoxIcon, FlaskConicalIcon, PackageIcon, PrinterIcon, ScissorsIcon, SunIcon } from 'lucide-react';
import {
  NodeEditor,
  type NodeEditorEdge,
  type NodeEditorNode,
  type NodeEditorPaletteItem,
  type NodeEditorProps,
  type NodeEditorValue,
} from '../components/NodeEditor/NodeEditor';

const parts = (id = 'parts', label = 'Parts') => ({ id, label, type: 'parts' });

const palette: NodeEditorPaletteItem[] = [
  { type: 'import', title: 'Import model', description: 'STL, OBJ or .form file', icon: <FileBoxIcon />, color: 1, group: 'Source', outputs: [{ id: 'model', label: 'Model', type: 'model' }] },
  { type: 'resin', title: 'Resin cartridge', description: 'Material and lot', icon: <FlaskConicalIcon />, color: 3, group: 'Source', outputs: [{ id: 'resin', label: 'Resin', type: 'material' }] },
  {
    type: 'print',
    title: 'Print',
    description: 'Form 4 / Form 3L job',
    icon: <PrinterIcon />,
    color: 1,
    group: 'Process',
    inputs: [{ id: 'model', label: 'Model', type: 'model' }, { id: 'resin', label: 'Resin', type: 'material' }],
    outputs: [parts('parts', 'Green parts')],
  },
  { type: 'wash', title: 'Wash', description: 'Form Wash · IPA', icon: <DropletsIcon />, color: 2, group: 'Post-process', inputs: [parts()], outputs: [parts('washed', 'Washed')] },
  { type: 'cure', title: 'Cure', description: 'Form Cure · heat + UV', icon: <SunIcon />, color: 3, group: 'Post-process', inputs: [parts()], outputs: [parts('cured', 'Cured')] },
  { type: 'supports', title: 'Support removal', description: 'Cut and sand touchpoints', icon: <ScissorsIcon />, color: 5, group: 'Post-process', inputs: [parts()], outputs: [parts('clean', 'Finished')] },
  {
    type: 'qa',
    title: 'QA inspection',
    description: 'Fit check and measurements',
    icon: <ClipboardCheckIcon />,
    color: 4,
    group: 'Finish',
    inputs: [parts()],
    outputs: [parts('passed', 'Passed'), { id: 'report', label: 'Report', type: 'report' }],
  },
  { type: 'ship', title: 'Pack & ship', description: 'Label and dispatch', icon: <PackageIcon />, color: 6, group: 'Finish', inputs: [parts(), { id: 'report', label: 'QA report', type: 'report' }] },
];

const p = (type: string) => palette.find((x) => x.type === type)!;
const node = (id: string, type: string, x: number, y: number, extra: Partial<NodeEditorNode> = {}): NodeEditorNode => ({
  id,
  type,
  title: p(type).title,
  x,
  y,
  inputs: p(type).inputs ?? [],
  outputs: p(type).outputs ?? [],
  ...extra,
});

const nodes: NodeEditorNode[] = [
  node('import', 'import', 0, 0, { title: 'Upper arch model', subtitle: 'upper_arch_v4.stl' }),
  node('resin', 'resin', 0, 132, { subtitle: 'Grey V5 · Lot 0812' }),
  node('print', 'print', 240, 40, { title: 'Print · Form 4', subtitle: '100 µm · 412 layers', badge: { label: 'Printing', tone: 'info' } }),
  node('wash', 'wash', 480, 40, { title: 'Wash · Form Wash', subtitle: 'IPA · 10 min' }),
  node('cure', 'cure', 720, 40, { title: 'Cure · Form Cure', subtitle: '60 °C · 30 min' }),
  node('supports', 'supports', 960, 40, { subtitle: 'Flush cutters' }),
  node('qa', 'qa', 1200, 40, { subtitle: 'Fit check on model', badge: { label: 'Pending', tone: 'warning' } }),
];

const link = (from: string, fp: string, to: string, tp: string): NodeEditorEdge => ({ id: `e-${from}-${fp}-${to}-${tp}`, from: { node: from, port: fp }, to: { node: to, port: tp } });
const edges: NodeEditorEdge[] = [
  link('import', 'model', 'print', 'model'),
  link('resin', 'resin', 'print', 'resin'),
  link('print', 'parts', 'wash', 'parts'),
  link('wash', 'washed', 'cure', 'parts'),
  link('cure', 'cured', 'supports', 'parts'),
  link('supports', 'clean', 'qa', 'parts'),
];

const portTypes = { model: 1, parts: 2, material: 3, report: 4 };

const meta = {
  title: 'Components/Interaction/NodeEditor',
  component: NodeEditor,
  tags: ['expanded'],
  args: {
    nodes,
    edges,
    palette,
    portTypes,
    showPalette: true,
    showMinimap: true,
    showGrid: true,
    readOnly: false,
    fitOnMount: true,
    minZoom: 0.2,
    maxZoom: 2.5,
    label: 'Post-processing workflow',
    paletteTitle: 'Add step',
    onChange: fn(),
    onSelectionChange: fn(),
  },
  argTypes: {
    nodes: { control: 'object' },
    edges: { control: 'object' },
    palette: { control: false },
    portTypes: { control: 'object' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Workflow builder / node editor on top of `CanvasViewport`. Drag nodes to move, drag from an output port to a compatible input to connect (or click an output then an input; Escape cancels), drag an input away to disconnect, marquee or Shift+click to multi-select, Delete to remove, arrow keys nudge the focused node. The palette adds steps by click or drag. Node and port colours come from `--color-chart-series-*`.',
      },
    },
  },
  decorators: [
    (S, ctx) => (
      <div style={{ width: '100%', height: ctx.parameters.frameHeight ?? 'calc(var(--space-24) * 6)' }}>
        <S />
      </div>
    ),
  ],
  render: function Render(args) {
    const [{ nodes: n, edges: e }, update] = useArgs<NodeEditorProps>();
    return (
      <NodeEditor
        {...args}
        nodes={n}
        edges={e}
        onChange={(v: NodeEditorValue) => {
          update({ nodes: v.nodes, edges: v.edges });
          args.onChange(v);
        }}
      />
    );
  },
} satisfies Meta<typeof NodeEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A branching workflow: QA failures loop back to support removal while passed parts go to shipping. */
export const WorkflowBuilder: Story = {
  args: {
    label: 'Clinic order workflow',
    nodes: [
      ...nodes.map((x) => (x.id === 'print' ? { ...x, badge: { label: 'Done', tone: 'success' as const } } : x)),
      node('ship', 'ship', 1440, 0, { subtitle: 'Clinic · next-day' }),
    ],
    edges: [...edges, link('qa', 'passed', 'ship', 'parts'), link('qa', 'report', 'ship', 'report')],
  },
};

export const CanvasOnly: Story = {
  args: { showPalette: false, showMinimap: false },
  parameters: { docs: { description: { story: 'Without the palette sidebar and minimap, e.g. embedded in a job detail panel.' } } },
};

export const ReadOnly: Story = {
  args: { readOnly: true, showPalette: false },
  parameters: { docs: { description: { story: 'Viewing a saved workflow: pan, zoom and select still work; moving, connecting and deleting are disabled.' } } },
};

export const Empty: Story = {
  args: { nodes: [], edges: [] },
  parameters: { docs: { description: { story: 'Start from the palette: click a step to drop it in the middle of the view, or drag it to a spot.' } } },
};

export const Fullscreen: Story = {
  parameters: { layout: 'fullscreen', frameHeight: 'calc(var(--space-24) * 7)' },
  args: { ...WorkflowBuilder.args },
};
