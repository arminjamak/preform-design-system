import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { RangeSlider, type RangeValue } from '../components/RangeSlider/RangeSlider';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Inputs/RangeSlider',
  component: RangeSlider,
  tags: ['expanded'],
  args: {
    label: 'Visible layers',
    value: [12, 240],
    min: 1,
    max: 412,
    step: 1,
    minDistance: 1,
    showValues: true,
    disabled: false,
    onChange: fn(),
  },
  argTypes: {
    value: { control: 'object' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
    formatValue: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Two-thumb slider for a [min, max] band, such as the visible layer range in the slicer preview. Shares the `Slider` fill track (`--color-control-slider-rail` / `--color-control-slider-fill`); each thumb is a native range input, so arrow, Page and Home/End keys work per thumb, and `minDistance` keeps them apart.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs<{ value: RangeValue }>();
    return (
      <div className="sb-panel-demo">
        <RangeSlider
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
} satisfies Meta<typeof RangeSlider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const LayerHeight: Story = {
  name: 'Formatted values',
  args: { label: 'Support height band', value: [2, 18.5], min: 0, max: 42, step: 0.5, minDistance: 2, formatValue: (v: number) => `${v.toFixed(1)} mm` },
};

export const WithoutValues: Story = { args: { showValues: false } };

export const Disabled: Story = { args: { disabled: true } };

export const InPanel: Story = {
  name: 'Layer preview panel',
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [layers, setLayers] = useState<RangeValue>([12, 240]);
    const [angle, setAngle] = useState<RangeValue>([30, 60]);
    return (
      <div className="sb-stack sb-panel-demo">
        <span className="pf-text-label">Visible layers</span>
        <RangeSlider label="Visible layers" value={layers} onChange={setLayers} min={1} max={412} showValues />
        <span className="pf-text-label">Overhang angle</span>
        <RangeSlider label="Overhang angle" value={angle} onChange={setAngle} min={0} max={90} step={5} minDistance={10} showValues formatValue={(v) => `${v}°`} />
      </div>
    );
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={(p) => (
        <div style={{ width: 'var(--size-field-lg)' }}>
          <RangeSlider {...args} value={[12, 240]} onChange={() => {}} {...p} />
        </div>
      )}
    />
  ),
};
