import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { ColorPicker } from '../components/ColorPicker/ColorPicker';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Inputs/ColorPicker',
  component: ColorPicker,
  tags: ['expanded'],
  args: {
    label: 'Touchpoint colour',
    value: '#16a316',
    size: 'sm',
    disabled: false,
    onChange: fn(),
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    value: { control: 'color' },
    presets: { control: 'object' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Swatch trigger that opens a `Popover` with preset swatches rendered from the `--color-accent-tone-*` tokens, a hex `TextField`, and the native colour input behind the "Custom" hue swatch. The value is a `#rrggbb` string because it is user data; picking a preset stores the token\'s resolved colour for the current theme.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs<{ value: string }>();
    return (
      <div style={{ minHeight: 'calc(var(--size-control-xl) * 4)' }}>
        <ColorPicker
          {...args}
          value={value}
          onChange={(v) => {
            update({ value: v });
            args.onChange(v);
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof ColorPicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const CustomValue: Story = { name: 'Custom colour', args: { value: '#7a4fd6', label: 'Label colour' } };

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="sb-row">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <ColorPicker key={size} {...args} size={size} onChange={() => {}} />
      ))}
    </div>
  ),
};

const CATEGORIES = [
  { id: 'touchpoints', name: 'Touchpoints', count: 1248, color: '#0a63c9' },
  { id: 'mini-rafts', name: 'Mini rafts', count: 6, color: '#22b922' },
  { id: 'internal', name: 'Internal supports', count: 214, color: '#f5a623' },
  { id: 'bracing', name: 'Bracing', count: 87, color: '#ec2fc0' },
];

export const SupportCategories: Story = {
  name: 'Colour-coding support categories',
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [rows, setRows] = useState(CATEGORIES);
    return (
      <div className="sb-panel-demo sb-stack" style={{ minHeight: 'calc(var(--size-control-xl) * 6)' }}>
        <span className="pf-text-label">Support categories</span>
        {rows.map((r) => (
          <div key={r.id} className="sb-row" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span className="pf-text-body-sm">
              {r.name} <span style={{ color: 'var(--color-fg-muted)' }}>· {r.count}</span>
            </span>
            <ColorPicker label={`${r.name} colour`} value={r.color} onChange={(c) => setRows((all) => all.map((x) => (x.id === r.id ? { ...x, color: c } : x)))} />
          </div>
        ))}
      </div>
    );
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => <StateMatrix render={(p) => <ColorPicker {...args} onChange={() => {}} {...p} />} />,
};
