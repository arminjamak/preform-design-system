import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { useState } from 'react';
import { BoxIcon, EyeIcon, Grid3x3Icon, LayersIcon } from 'lucide-react';
import { ToggleButton } from '../components/ToggleButton/ToggleButton';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Actions/ToggleButton',
  component: ToggleButton,
  tags: ['expanded'],
  args: { label: 'Show supports', pressed: true, onChange: fn(), size: 'sm', variant: 'outline', iconOnly: false, disabled: false, icon: <LayersIcon strokeWidth={2.2} /> },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'inline-radio', options: ['outline', 'ghost'] },
    icon: { control: 'boolean', mapping: { true: <LayersIcon strokeWidth={2.2} />, false: undefined } },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  render: function Render(args) {
    const [{ pressed }, update] = useArgs();
    return (
      <ToggleButton
        {...args}
        pressed={pressed}
        onChange={(v) => {
          update({ pressed: v });
          args.onChange(v);
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'Two-state button exposing `aria-pressed`, for viewport overlays such as Show supports or Wireframe. Off uses the outline/ghost button surfaces; on uses `bg.accent-soft` with `fg.accent` (and `border.accent` on outline). Group several with ToggleButtonGroup.\n\n' +
          '**Button coverage:** Primary = `Button variant="primary"`, Secondary = `variant="outline"`, Tertiary = `variant="ghost"`, Destructive = `variant="danger"`, Text = `variant="link"`, Loading = `Button loading`, Overflow = `Menu`. Use ToggleButton only when the button holds on/off state.',
      },
    },
  },
} satisfies Meta<typeof ToggleButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: function Render(args) {
    const [on, setOn] = useState({ supports: true, wireframe: false, ghostSupports: true, ghostWire: false });
    return (
      <div className="sb-stack">
        <div className="sb-row">
          <ToggleButton {...args} variant="outline" label="Show supports" icon={<LayersIcon strokeWidth={2.2} />} pressed={on.supports} onChange={(v) => setOn({ ...on, supports: v })} />
          <ToggleButton {...args} variant="outline" label="Wireframe" icon={<Grid3x3Icon strokeWidth={2.2} />} pressed={on.wireframe} onChange={(v) => setOn({ ...on, wireframe: v })} />
        </div>
        <div className="sb-row">
          <ToggleButton {...args} variant="ghost" label="Show supports" icon={<LayersIcon strokeWidth={2.2} />} pressed={on.ghostSupports} onChange={(v) => setOn({ ...on, ghostSupports: v })} />
          <ToggleButton {...args} variant="ghost" label="Wireframe" icon={<Grid3x3Icon strokeWidth={2.2} />} pressed={on.ghostWire} onChange={(v) => setOn({ ...on, ghostWire: v })} />
        </div>
      </div>
    );
  },
};

export const IconOnly: Story = {
  render: function Render(args) {
    const [on, setOn] = useState<Record<string, boolean>>({ supports: true, wireframe: false, xray: false, build: true });
    const items = [
      { key: 'supports', label: 'Show supports', icon: <LayersIcon strokeWidth={2.2} /> },
      { key: 'wireframe', label: 'Wireframe', icon: <Grid3x3Icon strokeWidth={2.2} /> },
      { key: 'xray', label: 'X-ray view', icon: <EyeIcon strokeWidth={2.2} /> },
      { key: 'build', label: 'Show build volume', icon: <BoxIcon strokeWidth={2.2} /> },
    ];
    return (
      <div className="sb-row">
        {items.map((it) => (
          <ToggleButton key={it.key} {...args} iconOnly label={it.label} icon={it.icon} pressed={on[it.key]} onChange={(v) => setOn({ ...on, [it.key]: v })} />
        ))}
      </div>
    );
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-row">
      <ToggleButton {...args} size="sm" pressed onChange={() => {}} />
      <ToggleButton {...args} size="md" pressed onChange={() => {}} />
      <ToggleButton {...args} size="lg" pressed onChange={() => {}} />
      <ToggleButton {...args} size="sm" iconOnly pressed onChange={() => {}} />
      <ToggleButton {...args} size="md" iconOnly pressed onChange={() => {}} />
      <ToggleButton {...args} size="lg" iconOnly pressed onChange={() => {}} />
    </div>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'outline off', render: (p) => <ToggleButton {...args} variant="outline" pressed={false} onChange={() => {}} {...p} /> },
        { label: 'outline on', render: (p) => <ToggleButton {...args} variant="outline" pressed onChange={() => {}} {...p} /> },
        { label: 'ghost off', render: (p) => <ToggleButton {...args} variant="ghost" pressed={false} onChange={() => {}} {...p} /> },
        { label: 'ghost on', render: (p) => <ToggleButton {...args} variant="ghost" pressed onChange={() => {}} {...p} /> },
      ]}
    />
  ),
};
