import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { TimePicker } from '../components/TimePicker/TimePicker';
import { StateMatrix } from './helpers/StateMatrix';

const Room = (Story: () => JSX.Element) => (
  <div style={{ minHeight: 'calc(var(--size-control-md) * 10)', paddingTop: 'var(--space-2)' }}>
    <Story />
  </div>
);

const meta = {
  title: 'Components/Inputs/TimePicker',
  component: TimePicker,
  tags: ['expanded'],
  args: {
    label: 'Print start time',
    value: '14:30',
    onChange: fn(),
    hourCycle: '24',
    step: 1,
    withSeconds: false,
    withList: false,
    size: 'sm',
    disabled: false,
    invalid: false,
    defaultOpen: false,
  },
  argTypes: {
    hourCycle: { control: 'inline-radio', options: ['24', '12'] },
    step: { control: 'select', options: [1, 5, 10, 15, 30] },
    listStep: { control: 'select', options: [undefined, 15, 30, 60] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  decorators: [Room],
  parameters: {
    docs: {
      description: {
        component:
          'Segmented time field for print start times and maintenance slots. Each segment is a spinbutton: Arrow Up/Down step (minutes by `step`), digits type, Arrow Left/Right move, Backspace clears. Value is always 24-hour `HH:mm` (or `HH:mm:ss`); `hourCycle` only changes display. `withList` adds a scrollable listbox of times.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return (
      <TimePicker
        {...args}
        value={value}
        onChange={(v) => {
          args.onChange(v);
          update({ value: v });
        }}
      />
    );
  },
} satisfies Meta<typeof TimePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const TwelveHour: Story = { args: { hourCycle: '12', label: 'Resin heater warm-up' } };

export const WithSeconds: Story = { args: { withSeconds: true, value: '06:45:30', label: 'Exposure log timestamp' } };

/** Minutes step by 15; the list shows quarter-hour slots for scheduling a queued job. */
export const WithList: Story = { args: { withList: true, step: 15, value: '09:15', defaultOpen: true, label: 'Queue start' } };

export const WithList12h: Story = { args: { withList: true, hourCycle: '12', step: 30, value: '17:30', defaultOpen: true, label: 'Pickup time' } };

export const Empty: Story = { args: { value: '', label: 'Maintenance slot' } };

export const Sizes: Story = {
  decorators: [],
  render: function Render(args) {
    const [value, setValue] = useState('14:30');
    return (
      <div className="sb-row">
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <TimePicker key={size} label={args.label} size={size} value={value} onChange={setValue} withList />
        ))}
      </div>
    );
  },
};

export const Invalid: Story = { args: { invalid: true } };

export const Disabled: Story = { args: { disabled: true } };

export const States: Story = {
  decorators: [],
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      rows={[
        { label: '24h', render: (p) => <TimePicker label={args.label} value="14:30" onChange={() => {}} {...p} /> },
        { label: '12h + list', render: (p) => <TimePicker label={args.label} value="14:30" hourCycle="12" withList onChange={() => {}} {...p} /> },
      ]}
      render={() => null}
    />
  ),
};
