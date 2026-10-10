import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { BoxIcon, CircleDotIcon, Grid2x2Icon, LayersIcon, PaintbrushIcon, RotateCcwIcon, ScalingIcon, ShieldIcon, TagIcon, ZapIcon } from 'lucide-react';
import { ToolButton, ToolRail } from '../components';
import { StateMatrix } from './helpers/StateMatrix';

const groups = [
  [{ id: 'oneclick', icon: <ZapIcon strokeWidth={2} />, label: '1-Click' }],
  [
    { id: 'size', icon: <ScalingIcon strokeWidth={2} />, label: 'Size' },
    { id: 'protect', icon: <ShieldIcon strokeWidth={2} />, label: 'Protect' },
    { id: 'orient', icon: <RotateCcwIcon strokeWidth={2} />, label: 'Orient' },
    { id: 'support', icon: <LayersIcon strokeWidth={2} />, label: 'Support' },
    { id: 'layout', icon: <Grid2x2Icon strokeWidth={2} />, label: 'Layout' },
  ],
  [
    { id: 'hollow', icon: <BoxIcon strokeWidth={2} />, label: 'Hollow' },
    { id: 'texture', icon: <PaintbrushIcon strokeWidth={2} />, label: 'Texture' },
    { id: 'label', icon: <TagIcon strokeWidth={2} />, label: 'Label' },
    { id: 'hole', icon: <CircleDotIcon strokeWidth={2} />, label: 'Hole', disabled: true },
  ],
];

const meta = {
  title: 'Components/Navigation/ToolRail',
  component: ToolRail,
  args: { groups, active: 'support', dimmed: false, onSelect: fn() },
  globals: { surface: 'canvas' },
  render: function Render(args) {
    const [{ active }, update] = useArgs();
    return <ToolRail {...args} active={active} onSelect={(id) => update({ active: id })} />;
  },
} satisfies Meta<typeof ToolRail>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Dimmed: Story = { args: { dimmed: true } };
export const ButtonStates: Story = {
  name: 'ToolButton states',
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'idle', render: (p) => <ToolButton standalone icon={<LayersIcon strokeWidth={2} />} label="Support" {...p} /> },
        { label: 'active', render: (p) => <ToolButton standalone active icon={<LayersIcon strokeWidth={2} />} label="Support" {...p} /> },
      ]}
    />
  ),
};
