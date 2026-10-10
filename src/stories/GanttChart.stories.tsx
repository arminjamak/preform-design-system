import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { GanttChart, type GanttTask } from '../components/GanttChart/GanttChart';

/* Two weeks of production from 2026-10-12, grouped per printer. Today = Wed 14 Oct, 10:30. */
const tasks: GanttTask[] = [
  // Form 4 · Bay 1 — Batch A, 48 surgical guides
  { id: 'a-print', group: 'Form 4 · Bay 1', name: 'Print · Surgical guides (Batch A)', detail: 'Surgical Guide · 50 µm', start: '2026-10-12T08:00', end: '2026-10-13T02:00', progress: 100 },
  { id: 'a-wash', group: 'Form 4 · Bay 1', name: 'Wash · Form Wash', detail: 'IPA · 2 cycles', start: '2026-10-13T08:00', end: '2026-10-13T11:00', progress: 100, dependsOn: ['a-print'] },
  { id: 'a-cure', group: 'Form 4 · Bay 1', name: 'Cure · Form Cure', detail: '60 °C · 30 min per tray', start: '2026-10-13T11:00', end: '2026-10-13T17:00', progress: 100, dependsOn: ['a-wash'] },
  { id: 'a-supp', group: 'Form 4 · Bay 1', name: 'Support removal', detail: 'Flush cutters + sanding', start: '2026-10-14T08:00', end: '2026-10-14T16:00', progress: 40, dependsOn: ['a-cure'] },
  { id: 'a-qa', group: 'Form 4 · Bay 1', name: 'QA · sleeve gauge', detail: 'Lab bench 1', start: '2026-10-15T08:00', end: '2026-10-15T14:00', progress: 0, dependsOn: ['a-supp'], tone: 'success' },
  { id: 'a-ship', group: 'Form 4 · Bay 1', name: 'Clinic shipment', start: '2026-10-16T15:00', end: '2026-10-16T15:00', milestone: true, dependsOn: ['a-qa'], tone: 'info' },

  // Form 4B · Bay 2 — night guards
  { id: 'b-print', group: 'Form 4B · Bay 2', name: 'Print · Night guards ×24', detail: 'Flexible 80A · 100 µm', start: '2026-10-13T09:00', end: '2026-10-14T13:00', progress: 70 },
  { id: 'b-wash', group: 'Form 4B · Bay 2', name: 'Wash · Form Wash', start: '2026-10-14T14:00', end: '2026-10-14T17:00', progress: 0, dependsOn: ['b-print'] },
  { id: 'b-cure', group: 'Form 4B · Bay 2', name: 'Cure · Form Cure', start: '2026-10-15T08:00', end: '2026-10-15T12:00', progress: 0, dependsOn: ['b-wash'] },
  { id: 'b-qa', group: 'Form 4B · Bay 2', name: 'QA · fit on models', start: '2026-10-15T13:00', end: '2026-10-16T12:00', progress: 0, dependsOn: ['b-cure', 'a-qa'], tone: 'success' },

  // Form 3L — maintenance then large housings
  { id: 'l-pm', group: 'Form 3L', name: 'Preventive maintenance', detail: 'Tank + optical window', start: '2026-10-12T08:00', end: '2026-10-12T17:00', progress: 100, tone: 'warning' },
  { id: 'l-print', group: 'Form 3L', name: 'Print · Housing prototypes', detail: 'Grey V5 · 100 µm', start: '2026-10-13T08:00', end: '2026-10-15T20:00', progress: 55, dependsOn: ['l-pm'] },
  { id: 'l-wash', group: 'Form 3L', name: 'Wash · Form Wash L', start: '2026-10-16T08:00', end: '2026-10-16T12:00', progress: 0, dependsOn: ['l-print'] },
  { id: 'l-cure', group: 'Form 3L', name: 'Cure · Form Cure L', start: '2026-10-16T12:00', end: '2026-10-16T18:00', progress: 0, dependsOn: ['l-wash'] },
  { id: 'l-review', group: 'Form 3L', name: 'Design review', start: '2026-10-19T10:00', end: '2026-10-19T10:00', milestone: true, dependsOn: ['l-cure'], tone: 'accent' },

  // Fuse 1+ 30W — SLS
  { id: 'f-sinter', group: 'Fuse 1+ 30W', name: 'Sinter · Nylon 12 brackets', detail: '172 parts · 61% packing', start: '2026-10-13T06:00', end: '2026-10-14T06:00', progress: 100 },
  { id: 'f-cool', group: 'Fuse 1+ 30W', name: 'Cool down', start: '2026-10-14T06:00', end: '2026-10-15T00:00', progress: 75, dependsOn: ['f-sinter'], tone: 'neutral' },
  { id: 'f-sift', group: 'Fuse 1+ 30W', name: 'Powder recovery · Fuse Sift', start: '2026-10-15T08:00', end: '2026-10-15T12:00', progress: 0, dependsOn: ['f-cool'] },
  { id: 'f-blast', group: 'Fuse 1+ 30W', name: 'Media blasting', start: '2026-10-15T13:00', end: '2026-10-16T11:00', progress: 0, dependsOn: ['f-sift'] },
];

/* Six weeks of larger orders for the week scale. */
const quarter: GanttTask[] = [
  { id: 'q-dental', group: 'Form 4 · Bay 1', name: 'Dental lab contract · 600 models', start: '2026-10-05', end: '2026-10-30', progress: 45 },
  { id: 'q-guides', group: 'Form 4 · Bay 1', name: 'Surgical guide pilot', start: '2026-11-02', end: '2026-11-13', progress: 0, dependsOn: ['q-dental'] },
  { id: 'q-ng', group: 'Form 4B · Bay 2', name: 'Night guard subscription run', start: '2026-10-12', end: '2026-11-06', progress: 20 },
  { id: 'q-validate', group: 'Form 4B · Bay 2', name: 'Biocompatibility validation', start: '2026-10-26', end: '2026-10-26', milestone: true, tone: 'success' },
  { id: 'q-housings', group: 'Form 3L', name: 'Housing EVT builds', start: '2026-10-07', end: '2026-10-21', progress: 60 },
  { id: 'q-dvt', group: 'Form 3L', name: 'Housing DVT builds', start: '2026-10-22', end: '2026-11-11', progress: 0, dependsOn: ['q-housings'] },
  { id: 'q-gate', group: 'Form 3L', name: 'DVT gate review', start: '2026-11-12', end: '2026-11-12', milestone: true, dependsOn: ['q-dvt'], tone: 'accent' },
  { id: 'q-service', group: 'Fuse 1+ 30W', name: 'Laser service & recalibration', start: '2026-10-19', end: '2026-10-21', progress: 0, tone: 'warning' },
  { id: 'q-brackets', group: 'Fuse 1+ 30W', name: 'Nylon 12 bracket production', start: '2026-10-22', end: '2026-11-20', progress: 0, dependsOn: ['q-service'] },
];

const meta = {
  title: 'Components/Interaction/GanttChart',
  component: GanttChart,
  tags: ['expanded'],
  args: {
    tasks,
    scale: 'day',
    startDate: new Date(2026, 9, 12).getTime(),
    endDate: new Date(2026, 9, 23).getTime(),
    today: new Date(2026, 9, 14, 10, 30).getTime(),
    showDependencies: true,
    defaultCollapsed: [],
    nameLabel: 'Job',
    label: 'Production schedule',
    locale: 'en-US',
    onTaskClick: fn(),
  },
  argTypes: {
    scale: { control: 'inline-radio', options: ['day', 'week'] },
    startDate: { control: 'date' },
    endDate: { control: 'date' },
    today: { control: 'date' },
    tasks: { control: 'object' },
    defaultCollapsed: { control: 'object' },
    locale: { control: 'select', options: ['en-US', 'en-GB', 'de-DE'] },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Production timeline per printer: Print → Wash (Form Wash) → Cure (Form Cure) → Support removal → QA, with progress fills, milestones (diamonds), dependency arrows and a red today line. Day or week scale; groups collapse. Bars take the group\'s `--color-chart-series-*` colour unless a tone is set. Up/Down arrows move between bars.',
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
} satisfies Meta<typeof GanttChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const DayScale: Story = {
  args: { scale: 'day' },
  parameters: { docs: { description: { story: 'Two-tier header: ISO week over day columns; weekends shaded.' } } },
};

export const WeekScale: Story = {
  args: { scale: 'week', tasks: quarter, startDate: new Date(2026, 9, 5).getTime(), endDate: new Date(2026, 10, 22).getTime() },
  parameters: { docs: { description: { story: 'Month over week columns for longer contracts.' } } },
};

export const CollapsedGroups: Story = { args: { defaultCollapsed: ['Form 4B · Bay 2', 'Fuse 1+ 30W'] } };

export const WithoutDependencies: Story = { args: { showDependencies: false } };

export const Ungrouped: Story = {
  args: {
    tasks: tasks.filter((t) => t.group === 'Form 4 · Bay 1').map(({ group: _g, ...t }) => t),
    endDate: new Date(2026, 9, 18).getTime(),
    nameLabel: 'Batch A · 48 surgical guides',
  },
};

export const ScrollingBody: Story = {
  args: { style: { maxHeight: 'calc(var(--space-24) * 3)' } },
  parameters: { docs: { description: { story: 'Constrain the height: the scale header and job column stay sticky while the timeline scrolls.' } } },
};
