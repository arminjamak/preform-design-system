import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { PlusIcon } from 'lucide-react';
import { CalendarView, type CalendarEvent, type CalendarViewProps } from '../components/CalendarView/CalendarView';
import { Button } from '../components/Button/Button';

/* Print schedule for the week of 2026-10-12, coloured per printer (series 1–6) and by status tone for maintenance. */
const events: CalendarEvent[] = [
  // Monday 12
  { id: 'p1', title: 'Upper/lower arch models', detail: 'Form 4 · Bay 1', start: '2026-10-12T08:00', end: '2026-10-12T12:30', color: 1 },
  { id: 'p2', title: 'Night guards ×8', detail: 'Form 4B · Bay 2', start: '2026-10-12T09:00', end: '2026-10-12T14:00', color: 2 },
  { id: 'w1', title: 'Wash · Form Wash', detail: 'Arch models · IPA 10 min', start: '2026-10-12T12:45', end: '2026-10-12T13:15', color: 6 },
  { id: 'c1', title: 'Cure · Form Cure', detail: 'Arch models · 60 °C 30 min', start: '2026-10-12T13:30', end: '2026-10-12T14:15', color: 3 },
  // Tuesday 13
  { id: 'p3', title: 'Bracket v3 batch', detail: 'Form 3L · Tough 2000', start: '2026-10-13T07:30', end: '2026-10-13T16:00', color: 4 },
  { id: 'q1', title: 'QA · arch model fit check', detail: 'Lab bench 2', start: '2026-10-13T10:00', end: '2026-10-13T11:00', color: 'success' },
  { id: 'sr1', title: 'Support removal · night guards', detail: 'Post-processing', start: '2026-10-13T13:00', end: '2026-10-13T14:30', color: 5 },
  // Wednesday 14 (today, busy)
  { id: 'm1', title: 'Resin tank swap', detail: 'Form 4 · Bay 1', start: '2026-10-14T08:00', end: '2026-10-14T08:45', color: 'warning' },
  { id: 'p4', title: 'Surgical guides #A-17–A-24', detail: 'Form 4 · Bay 1 · Surgical Guide', start: '2026-10-14T09:00', end: '2026-10-14T11:30', color: 1 },
  { id: 'p5', title: 'Draft V2 jigs', detail: 'Form 4B · Bay 2', start: '2026-10-14T09:30', end: '2026-10-14T10:30', color: 2 },
  { id: 'w2', title: 'Wash · Form Wash', detail: 'Surgical guides · IPA', start: '2026-10-14T11:45', end: '2026-10-14T12:15', color: 6 },
  { id: 'c2', title: 'Cure · Form Cure', detail: 'Surgical guides · 60 °C 30 min', start: '2026-10-14T12:30', end: '2026-10-14T13:30', color: 3 },
  { id: 'q2', title: 'QA · guide sleeve gauge', detail: 'Lab bench 1', start: '2026-10-14T14:00', end: '2026-10-14T15:00', color: 'success' },
  // Thursday 15
  { id: 'p6', title: 'Housing prototypes', detail: 'Form 3L · Grey V5', start: '2026-10-15T08:00', end: '2026-10-15T17:30', color: 4 },
  { id: 'err', title: 'Failed print review', detail: 'Form 4B · layer shift', start: '2026-10-15T11:00', end: '2026-10-15T11:30', color: 'danger' },
  { id: 'night', title: 'Overnight · Draft V2 jigs', detail: 'Form 4B · Bay 2', start: '2026-10-15T20:00', end: '2026-10-16T06:00', color: 2 },
  // Friday 16
  { id: 'q3', title: 'QA · housing tolerances', detail: 'CMM room', start: '2026-10-16T09:00', end: '2026-10-16T10:30', color: 'success' },
  { id: 'ship', title: 'Clinic shipment pickup', detail: 'Courier', start: '2026-10-16T15:00', end: '2026-10-16T15:30', color: 'info' },
  // All-day / multi-day
  { id: 'fuse', title: 'Fuse 1+ sinter run · Nylon 12 brackets', start: '2026-10-13', end: '2026-10-15', allDay: true, color: 5 },
  { id: 'pm', title: 'Preventive maintenance · Form 3L', start: '2026-10-14', end: '2026-10-14', allDay: true, color: 'warning' },
  { id: 'delivery', title: 'Material delivery · Grey V5 ×12', start: '2026-10-16', end: '2026-10-16', allDay: true, color: 'info' },
  // Rest of October (month view)
  { id: 'o1', title: 'Fuse Sift powder recovery', start: '2026-10-05', end: '2026-10-05', allDay: true, color: 5 },
  { id: 'o2', title: 'Dental batch · 40 models', detail: 'Form 4 · Bay 1', start: '2026-10-06T08:00', end: '2026-10-06T15:00', color: 1 },
  { id: 'o3', title: 'Firmware update · all printers', start: '2026-10-08', end: '2026-10-08', allDay: true, color: 'neutral' },
  { id: 'o4', title: 'Trade show demo prints', start: '2026-10-20', end: '2026-10-22', allDay: true, color: 4 },
  { id: 'o5', title: 'Night guards ×12', detail: 'Form 4B · Bay 2', start: '2026-10-21T09:00', end: '2026-10-21T14:00', color: 2 },
  { id: 'o6', title: 'Optical window cleaning', detail: 'Form 4 · Bay 1', start: '2026-10-27T08:00', end: '2026-10-27T08:30', color: 'warning' },
  { id: 'o7', title: 'Quarterly calibration', start: '2026-10-30', end: '2026-11-02', allDay: true, color: 'neutral' },
];

const meta = {
  title: 'Components/Interaction/CalendarView',
  component: CalendarView,
  tags: ['expanded'],
  args: {
    events,
    view: 'week',
    date: new Date(2026, 9, 14).getTime(),
    today: new Date(2026, 9, 14, 10, 30).getTime(),
    weekStartsOn: 1,
    dayStartHour: 7,
    dayEndHour: 19,
    maxEventsPerDay: 3,
    locale: 'en-US',
    onDateChange: fn(),
    onViewChange: fn(),
    onEventClick: fn(),
    onSlotClick: fn(),
  },
  argTypes: {
    view: { control: 'inline-radio', options: ['month', 'week'] },
    date: { control: 'date' },
    today: { control: 'date' },
    weekStartsOn: { control: 'inline-radio', options: [0, 1] },
    dayStartHour: { control: { type: 'number', min: 0, max: 23 } },
    dayEndHour: { control: { type: 'number', min: 1, max: 24 } },
    maxEventsPerDay: { control: { type: 'number', min: 1, max: 6 } },
    locale: { control: 'select', options: ['en-US', 'en-GB', 'de-DE', 'ja-JP'] },
    events: { control: 'object' },
    actions: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Month and week calendar for the print schedule: printer jobs, Form Wash / Form Cure post-processing, maintenance and QA. Events use `--color-chart-series-*` or status tones; overflowing days collapse into "+N more". It is an ARIA grid with roving focus (arrows, Home/End, PageUp/PageDown, Enter on an empty slot).',
      },
    },
  },
  decorators: [
    (S) => (
      <div style={{ width: '100%' }}>
        <S />
      </div>
    ),
  ],
  render: function Render(args) {
    const [, update] = useArgs<CalendarViewProps>();
    return (
      <CalendarView
        {...args}
        onDateChange={(d) => {
          update({ date: d.getTime() });
          args.onDateChange(d);
        }}
        onViewChange={(v) => {
          update({ view: v });
          args.onViewChange(v);
        }}
      />
    );
  },
} satisfies Meta<typeof CalendarView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WeekView: Story = {
  args: { view: 'week' },
  parameters: { docs: { description: { story: 'All-day row (maintenance, Fuse sinter runs, overnight prints) above a timed grid with overlapping jobs side by side and the red "now" line.' } } },
};

export const MonthView: Story = {
  args: { view: 'month' },
  parameters: { docs: { description: { story: 'Multi-day bars span cells; timed jobs show as dot chips. Wednesday 14 overflows into "+N more". Click a date number to open its week.' } } },
};

export const BusyMonth: Story = {
  args: { view: 'month', maxEventsPerDay: 2 },
  parameters: { docs: { description: { story: 'Two rows per day before collapsing.' } } },
};

export const SundayStart: Story = { args: { weekStartsOn: 0, locale: 'en-US' } };

export const WithActions: Story = {
  args: {
    actions: (
      <Button variant="primary" size="sm" iconStart={<PlusIcon />}>
        Schedule print
      </Button>
    ),
  },
};

export const Empty: Story = { args: { events: [], view: 'week' } };
