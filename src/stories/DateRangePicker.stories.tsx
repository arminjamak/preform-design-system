import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { DateRangePicker, DEFAULT_DATE_RANGE_PRESETS, type DateRange } from '../components/DateRangePicker/DateRangePicker';
import { StateMatrix } from './helpers/StateMatrix';

const TODAY = new Date(2026, 9, 14);
const toDate = (v: unknown) => (v === null || v === undefined || v === '' ? null : new Date(v as number | Date));

const Room = (Story: () => JSX.Element) => (
  <div style={{ minHeight: 'calc(var(--size-control-md) * 12)', paddingTop: 'var(--space-2)' }}>
    <Story />
  </div>
);

const meta = {
  title: 'Components/Inputs/DateRangePicker',
  component: DateRangePicker,
  tags: ['expanded'],
  args: {
    label: 'Print history',
    value: { start: new Date(2026, 9, 1), end: new Date(2026, 9, 14) },
    onChange: fn(),
    presets: DEFAULT_DATE_RANGE_PRESETS,
    placeholder: 'Select dates',
    size: 'sm',
    disabled: false,
    invalid: false,
    fullWidth: false,
    defaultOpen: false,
    weekStartsOn: 0,
    today: TODAY,
    locale: 'en-US',
  },
  argTypes: {
    value: { control: false },
    presets: { control: 'boolean', mapping: { true: DEFAULT_DATE_RANGE_PRESETS, false: [] } },
    min: { control: 'date' },
    max: { control: 'date' },
    today: { control: 'date' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    weekStartsOn: { control: 'select', options: [0, 1, 6], labels: { 0: 'Sunday', 1: 'Monday', 6: 'Saturday' } },
    locale: { control: 'select', options: ['en-US', 'en-GB', 'de-DE'] },
    isDateDisabled: { control: false },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  decorators: [Room],
  parameters: {
    docs: {
      description: {
        component:
          'Range field for print history, material usage and maintenance reports. The trigger shows "start → end" and opens a range Calendar with a presets column. Shell matches TextField; active preset uses `--color-bg-accent-soft`.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return (
      <DateRangePicker
        {...args}
        value={value as DateRange}
        min={toDate(args.min)}
        max={toDate(args.max)}
        today={toDate(args.today) ?? undefined}
        onChange={(r) => {
          args.onChange(r);
          update({ value: r });
        }}
      />
    );
  },
} satisfies Meta<typeof DateRangePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Open: Story = { args: { defaultOpen: true } };

export const WithoutPresets: Story = { args: { presets: [], defaultOpen: true, label: 'Maintenance window', value: { start: new Date(2026, 9, 19), end: new Date(2026, 9, 23) } } };

export const Empty: Story = { args: { value: { start: null, end: null }, label: 'Resin usage report' } };

export const Sizes: Story = {
  decorators: [],
  render: function Render(args) {
    const [value, setValue] = useState<DateRange>({ start: new Date(2026, 9, 1), end: new Date(2026, 9, 14) });
    return (
      <div className="sb-row">
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <DateRangePicker key={size} label={args.label} size={size} value={value} onChange={setValue} today={TODAY} />
        ))}
      </div>
    );
  },
};

export const Invalid: Story = { args: { invalid: true, value: { start: null, end: null } } };

export const Disabled: Story = { args: { disabled: true } };

export const States: Story = {
  decorators: [],
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={(p) => (
        <DateRangePicker label={args.label} value={{ start: new Date(2026, 9, 1), end: new Date(2026, 9, 14) }} onChange={() => {}} today={TODAY} {...p} />
      )}
    />
  ),
};
