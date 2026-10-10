import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { Calendar, type CalendarProps, type DateRange } from '../components/Calendar/Calendar';
import { StateMatrix } from './helpers/StateMatrix';

/** Fixed "today" so screenshots are stable. */
const TODAY = new Date(2026, 9, 10);
const toDate = (v: unknown) => (v === null || v === undefined || v === '' ? null : new Date(v as number | Date));
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/** White card the calendar sits on, as it does inside a popover. */
const Surface = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'inline-flex', padding: 'var(--space-3)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--elevation-card)' }}>
    {children}
  </div>
);

type Common = Omit<CalendarProps, 'mode' | 'value' | 'onChange'>;

const meta = {
  title: 'Components/Inputs/Calendar',
  component: Calendar,
  tags: ['expanded'],
  args: {
    mode: 'single',
    value: new Date(2026, 9, 14),
    onChange: fn(),
    label: 'Print date',
    weekStartsOn: 0,
    today: TODAY,
    locale: 'en-US',
    min: null,
    max: null,
    disabled: false,
    autoFocus: false,
  },
  argTypes: {
    mode: { control: 'inline-radio', options: ['single', 'range'] },
    value: { control: false },
    weekStartsOn: { control: 'select', options: [0, 1, 6], labels: { 0: 'Sunday', 1: 'Monday', 6: 'Saturday' } },
    min: { control: 'date' },
    max: { control: 'date' },
    today: { control: 'date' },
    locale: { control: 'select', options: ['en-US', 'en-GB', 'de-DE', 'ja-JP'] },
    isDateDisabled: { control: false },
    defaultMonth: { control: false },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Month grid for choosing a print date or a range (resin tank replacement, maintenance windows). 28px day cells (`--size-control-md`), today ring `--color-border-accent`, selected days `--color-bg-accent`, range shading `--color-bg-accent-soft`. Full ARIA grid: arrows move, Enter selects, PageUp/PageDown change month (Shift for year), Home/End jump to week edges.',
      },
    },
  },
  render: function Render(args) {
    const [{ value, mode }, update] = useArgs();
    const common: Common = {
      label: args.label,
      weekStartsOn: args.weekStartsOn,
      today: toDate(args.today) ?? undefined,
      locale: args.locale,
      min: toDate(args.min),
      max: toDate(args.max),
      disabled: args.disabled,
      autoFocus: args.autoFocus,
      isDateDisabled: args.isDateDisabled,
      defaultMonth: args.defaultMonth,
      'data-state': args['data-state'],
    };
    if (mode === 'range') {
      const range: DateRange = value && 'start' in value ? value : { start: null, end: null };
      return (
        <Surface>
          <Calendar {...common} mode="range" value={range} onChange={(v) => { args.onChange(v as never); update({ value: v }); }} />
        </Surface>
      );
    }
    const single = value instanceof Date ? value : null;
    return (
      <Surface>
        <Calendar {...common} mode="single" value={single} onChange={(v) => { args.onChange(v as never); update({ value: v }); }} />
      </Surface>
    );
  },
} satisfies Meta<typeof Calendar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Scheduling a print run across several days: start and end filled, days between shaded. */
export const Range: Story = {
  args: { mode: 'range', label: 'Print run', value: { start: new Date(2026, 9, 12), end: new Date(2026, 9, 21) } },
};

/** First click sets the start; hover previews the span until the second click. */
export const RangeInProgress: Story = {
  args: { mode: 'range', label: 'Maintenance window', value: { start: new Date(2026, 9, 14), end: null } },
};

export const WeekStartsMonday: Story = { args: { weekStartsOn: 1 } };

/** Resin tank replacement must be booked within the next 30 days, and the print lab is closed on weekends. */
export const Constraints: Story = {
  args: {
    label: 'Tank replacement date',
    value: new Date(2026, 9, 14),
    min: TODAY,
    max: new Date(2026, 10, 9),
    isDateDisabled: isWeekend,
  },
};

export const Disabled: Story = { args: { disabled: true } };

/** Forced states apply to the focusable day (the 14th). */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={(p) => (
        <Surface>
          <Calendar label="Print date" value={null} defaultMonth={new Date(2026, 9, 14)} onChange={() => {}} today={TODAY} {...p} />
        </Surface>
      )}
    />
  ),
};
