import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { useState } from 'react';
import { BoxIcon, EyeIcon, Grid3x3Icon, LayersIcon } from 'lucide-react';
import { ToggleButtonGroup, type ToggleButtonOption } from '../components/ToggleButton/ToggleButton';
import { StateMatrix } from './helpers/StateMatrix';

type RenderMode = 'solid' | 'shaded' | 'wireframe';
type Overlay = 'supports' | 'xray' | 'build';

const renderModes: ToggleButtonOption<RenderMode>[] = [
  { value: 'solid', label: 'Solid', icon: <BoxIcon strokeWidth={2.2} /> },
  { value: 'shaded', label: 'Shaded', icon: <LayersIcon strokeWidth={2.2} /> },
  { value: 'wireframe', label: 'Wireframe', icon: <Grid3x3Icon strokeWidth={2.2} /> },
];

const overlays: ToggleButtonOption<Overlay>[] = [
  { value: 'supports', label: 'Show supports', icon: <LayersIcon strokeWidth={2.2} /> },
  { value: 'xray', label: 'X-ray view', icon: <EyeIcon strokeWidth={2.2} /> },
  { value: 'build', label: 'Build volume', icon: <BoxIcon strokeWidth={2.2} /> },
];

const meta = {
  title: 'Components/Actions/ToggleButtonGroup',
  component: ToggleButtonGroup<RenderMode>,
  tags: ['expanded'],
  args: {
    label: 'Render mode',
    options: renderModes,
    selectionMode: 'single',
    value: 'solid',
    onChange: fn(),
    allowEmpty: false,
    size: 'sm',
    variant: 'outline',
    iconOnly: false,
    attached: true,
    orientation: 'horizontal',
    disabled: false,
  },
  argTypes: {
    selectionMode: { control: false },
    value: { control: 'inline-radio', options: [null, 'solid', 'shaded', 'wireframe'] },
    options: { control: false },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'inline-radio', options: ['outline', 'ghost'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs<{ value: RenderMode | null }>();
    return (
      <ToggleButtonGroup<RenderMode>
        {...args}
        selectionMode="single"
        value={value}
        onChange={(v) => {
          update({ value: v });
          (args.onChange as (next: RenderMode | null) => void)(v);
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'A set of ToggleButtons (each with `aria-pressed`) with single selection (render mode: Solid / Shaded / Wireframe) or multiple selection (viewport overlays). Built on ButtonGroup, so buttons attach with shared borders; arrow keys, Home and End move focus between buttons. Pressed buttons use `bg.accent-soft` and `fg.accent`.',
      },
    },
  },
} satisfies Meta<typeof ToggleButtonGroup<RenderMode>>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const IconOnly: Story = { args: { iconOnly: true } };

export const Multiple: Story = {
  parameters: { controls: { include: ['size', 'variant', 'iconOnly', 'attached', 'orientation', 'disabled'] } },
  render: function Render(args) {
    const [value, setValue] = useState<Overlay[]>(['supports', 'build']);
    return (
      <div className="sb-stack">
        <ToggleButtonGroup<Overlay>
          label="Viewport overlays"
          options={overlays}
          selectionMode="multiple"
          value={value}
          onChange={setValue}
          size={args.size}
          variant={args.variant}
          iconOnly={args.iconOnly}
          attached={args.attached}
          orientation={args.orientation}
          disabled={args.disabled}
        />
        <span className="pf-text-caption">Showing: {value.length ? value.join(', ') : 'none'}</span>
      </div>
    );
  },
};

export const Detached: Story = { args: { attached: false, variant: 'ghost' } };

export const Vertical: Story = { args: { orientation: 'vertical', iconOnly: true } };

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <ToggleButtonGroup<RenderMode> key={size} {...args} selectionMode="single" value="shaded" onChange={() => {}} size={size} />
      ))}
    </div>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={(p) => <ToggleButtonGroup<RenderMode> {...args} selectionMode="single" value="shaded" onChange={() => {}} {...p} />}
    />
  ),
};
