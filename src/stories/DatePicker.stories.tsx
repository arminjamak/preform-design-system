import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { StateMatrix } from './helpers/StateMatrix';

const TODAY = new Date(2026, 9, 10);
const toDate = (v: unknown) => (v === null || v === undefined || v === '' ? null : new Date(v as number | Date));
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/** Leaves room below the field so the open calendar is not clipped. */
const Room = (Story: () => JSX.Element) => (
  <div style={{ minHeight: 'calc(var(--size-control-md) * 12)', paddingTop: 'var(--space-2)' }}>
    <Story />
  </div>
);

const meta = {
  title: 'Components/Inputs/DatePicker',
  component: DatePicker,
  tags: ['expanded'],
  args: {
    label: 'Scheduled print date',
    value: new Date(2026, 9, 14),
    onChange: fn(),
    placeholder: 'yyyy-mm-dd',
    min: null,
    max: null,
    size: 'sm',
    disabled: false,
    invalid: false,
    fullWidth: false,
    clearable: true,
    defaultOpen: false,
    weekStartsOn: 0,
    today: TODAY,
    locale: 'en-US',
  },
  argTypes: {
    value: { control: 'date' },
    min: { control: 'date' },
    max: { control: 'date' },
    today: { control: 'date' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    weekStartsOn: { control: 'select', options: [0, 1, 6], labels: { 0: 'Sunday', 1: 'Monday', 6: 'Saturday' } },
    locale: { control: 'select', options: ['en-US', 'en-GB', 'de-DE', 'ja-JP'] },
    isDateDisabled: { control: false },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  decorators: [Room],
  parameters: {
    docs: {
      description: {
        component:
          'Date field for scheduling prints and logging resin tank swaps. Type `yyyy-mm-dd` or open the Calendar popover with the calendar button (or Arrow Down). Escape closes and returns focus to the field. Shell matches TextField; popover uses `--elevation-popover`.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return (
      <DatePicker
        {...args}
        value={toDate(value)}
        min={toDate(args.min)}
        max={toDate(args.max)}
        today={toDate(args.today) ?? undefined}
        onChange={(d) => {
          args.onChange(d);
          update({ value: d ?? null });
        }}
      />
    );
  },
} satisfies Meta<typeof DatePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Open: Story = { args: { defaultOpen: true } };

export const Empty: Story = { args: { value: null, label: 'Next resin tank replacement' } };

export const Sizes: Story = {
  decorators: [],
  render: function Render(args) {
    const [value, setValue] = useState<Date | null>(new Date(2026, 9, 14));
    return (
      <div className="sb-row">
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <DatePicker key={size} {...args} size={size} value={value} onChange={setValue} min={null} max={null} today={TODAY} />
        ))}
      </div>
    );
  },
};

/** Maintenance can be booked within the next 30 days on weekdays only; weekends are struck through. */
export const Constraints: Story = {
  args: {
    label: 'Maintenance visit',
    value: new Date(2026, 9, 14),
    min: TODAY,
    max: new Date(2026, 10, 9),
    isDateDisabled: isWeekend,
    defaultOpen: true,
  },
};

export const Invalid: Story = { args: { invalid: true, value: null, label: 'Print deadline' } };

export const Disabled: Story = { args: { disabled: true } };

export const FullWidth: Story = {
  args: { fullWidth: true },
  decorators: [(Story) => <div className="sb-panel-demo"><Story /></div>],
};

export const States: Story = {
  decorators: [],
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={(p) => <DatePicker label={args.label} value={new Date(2026, 9, 14)} onChange={() => {}} today={TODAY} {...p} />}
    />
  ),
};
