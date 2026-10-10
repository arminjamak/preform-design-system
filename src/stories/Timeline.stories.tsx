import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BoxIcon, CircleAlertIcon, CircleCheckIcon, HistoryIcon, LayersIcon, PlayIcon, RotateCwIcon, SaveIcon } from 'lucide-react';
import { Timeline, type TimelineItem } from '../components/Timeline/Timeline';
import { Menu } from '../components/Menu/Menu';

const historyActions = (title: string, current?: boolean) => (
  <Menu
    label={`Actions for ${title}`}
    items={[
      {
        label: 'Restore to this step…',
        onSelect: fn(),
        icon: <HistoryIcon strokeWidth={2.2} />,
        disabled: current,
      },
      {
        label: 'Save as version',
        onSelect: fn(),
        icon: <SaveIcon strokeWidth={2.2} />,
      },
    ]}
  />
);

const history: TimelineItem[] = [
  {
    id: 'h6',
    timestamp: '14:32',
    dateTime: '2026-10-10T14:32',
    title: 'Generated supports',
    description: 'Fine detail · 0.40 mm touchpoints · 1,284 points',
    current: true,
    actions: historyActions('Generated supports', true),
  },
  {
    id: 'h5',
    timestamp: '14:28',
    dateTime: '2026-10-10T14:28',
    title: 'Added protect region',
    description: 'Bearing face kept support-free on Motor mount',
    actions: historyActions('Added protect region'),
  },
  {
    id: 'h4',
    timestamp: '14:21',
    dateTime: '2026-10-10T14:21',
    title: 'Auto-oriented',
    description: 'Minimised peel forces · 32° tilt',
    actions: historyActions('Auto-oriented'),
  },
  {
    id: 'h3',
    timestamp: '14:20',
    dateTime: '2026-10-10T14:20',
    title: 'Moved to platform centre',
    description: 'X 72.0 mm · Y 64.5 mm',
    actions: historyActions('Moved to platform centre'),
  },
  {
    id: 'h2',
    timestamp: '14:18',
    dateTime: '2026-10-10T14:18',
    title: 'Imported Mini Chassis Kit',
    description: 'mini-chassis-kit.stl · 3 parts · 12.4 MB',
    actions: historyActions('Imported Mini Chassis Kit'),
  },
];

const withIcons: TimelineItem[] = [
  {
    id: 'j5',
    timestamp: 'Oct 10',
    title: 'Print finished',
    description: 'Form 4 #2 · 2,650 layers · 3 h 48 min',
    icon: <CircleCheckIcon strokeWidth={2.2} />,
    tone: 'success',
  },
  {
    id: 'j4',
    timestamp: '11:02',
    title: 'Layer 1,240 of 2,650',
    description: 'Resin tank at 38%, 112 mL remaining',
    icon: <LayersIcon strokeWidth={2.2} />,
    tone: 'accent',
    current: true,
  },
  {
    id: 'j3',
    timestamp: '09:41',
    title: 'Low resin warning',
    description: 'Grey V5 cartridge below 150 mL',
    icon: <CircleAlertIcon strokeWidth={2.2} />,
    tone: 'warning',
  },
  {
    id: 'j2',
    timestamp: '09:14',
    title: 'Print started',
    description: 'Job “Chassis batch 3” sent from PreForm',
    icon: <PlayIcon strokeWidth={2.2} />,
    tone: 'neutral',
  },
  {
    id: 'j1',
    timestamp: 'Oct 9',
    title: 'Previous attempt failed',
    description: 'Tank detected debris at layer 412',
    icon: <CircleAlertIcon strokeWidth={2.2} />,
    tone: 'danger',
  },
];

const feed: TimelineItem[] = [
  {
    id: 'f1',
    avatar: { name: 'Armin Jamak' },
    title: (
      <>
        <strong>Armin</strong> generated supports on <strong>Mini Chassis Kit</strong>
      </>
    ),
    timestamp: '2m ago',
    current: true,
  },
  {
    id: 'f2',
    avatar: { name: 'Lena Fischer' },
    title: (
      <>
        <strong>Lena</strong> commented on <strong>Motor mount</strong>
      </>
    ),
    timestamp: '18m ago',
    description: '“Can we drop the touchpoints to 0.35 mm on the bearing face? The last batch needed a lot of sanding.”',
  },
  {
    id: 'f3',
    icon: <RotateCwIcon strokeWidth={2.2} />,
    tone: 'accent',
    title: (
      <>
        <strong>PreForm</strong> auto-oriented 3 models
      </>
    ),
    timestamp: '25m ago',
  },
  {
    id: 'f4',
    avatar: { name: 'Diego Morales' },
    title: (
      <>
        <strong>Diego</strong> sent <strong>Chassis batch 3</strong> to Form 4 #2
      </>
    ),
    timestamp: '1h ago',
    actions: (
      <Menu
        label="Actions for Chassis batch 3"
        items={[
          { label: 'View job', onSelect: fn() },
          { label: 'Duplicate job', onSelect: fn() },
        ]}
      />
    ),
  },
  {
    id: 'f5',
    icon: <BoxIcon strokeWidth={2.2} />,
    title: (
      <>
        <strong>Priya</strong> imported <strong>Bracket_v2.stl</strong>
      </>
    ),
    timestamp: 'Yesterday',
  },
];

const meta = {
  title: 'Components/Data Display/Timeline',
  component: Timeline,
  tags: ['expanded'],
  args: {
    items: history,
    variant: 'timeline',
    currentLabel: 'Current',
    'aria-label': 'Model history',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['timeline', 'feed'] },
    items: { control: 'object' },
  },
  decorators: [
    (S) => (
      <div style={{ width: 'calc(var(--size-layout-panel) + var(--space-16))' }}>
        <S />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Vertical history list modelled on the PreForm history panel: dot or icon markers joined by a `--color-border-default` line, timestamps, title, two-line description and trailing actions. `timeline` puts times in a left column; `feed` is the activity feed with avatar markers and an inline "· 2m ago". The current item gets a `--color-bg-accent-subtle` wash, an accent dot with a focus-ring halo and a "Current" badge, and is marked `aria-current="step"`.',
      },
    },
  },
} satisfies Meta<typeof Timeline>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ModelHistory: Story = { name: 'Timeline: model history' };

export const JobEvents: Story = {
  name: 'Timeline: icon markers and tones',
  args: { items: withIcons, 'aria-label': 'Print job events' },
};

export const ActivityFeed: Story = {
  name: 'Feed',
  args: { items: feed, variant: 'feed', 'aria-label': 'Project activity' },
};

export const Compact: Story = {
  name: 'Without descriptions or actions',
  args: {
    items: history.map(({ actions: _a, description: _d, ...rest }) => rest),
  },
};
