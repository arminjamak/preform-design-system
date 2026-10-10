import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { VersionHistory, type SavedVersion, type VersionHistoryEntry, type VersionHistoryTab } from '../components/VersionHistory/VersionHistory';
import { StateMatrix } from './helpers/StateMatrix';

/** Line-art preview of a dental crown on the build platform; geometry is data, colour follows the thumbnail's currentColor. */
function CrownThumb({ supports = false, tilt = 0 }: { supports?: boolean; tilt?: number }) {
  return (
    <svg viewBox="0 0 64 47" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round" aria-hidden="true">
      <path d="M8 41 H56" strokeWidth={1.6} />
      <g transform={`rotate(${tilt} 32 20)`}>
        <path d="M20 22 C18 12 24 7 28 10 C30 6 34 6 36 10 C40 7 46 12 44 22 C43 28 38 31 32 31 C26 31 21 28 20 22 Z" />
        <path d="M26 15 C29 18 35 18 38 15" opacity={0.6} />
      </g>
      {supports && <path d="M24 31 V41 M28 32 V41 M32 32 V41 M36 32 V41 M40 31 V41" strokeWidth={0.8} opacity={0.7} />}
    </svg>
  );
}

const entries: VersionHistoryEntry[] = [
  {
    id: 'e8',
    day: 'Today',
    time: '14:32',
    kind: 'supports',
    title: 'Generated supports',
    description: 'Auto-generated 412 supports at density 1.00 and 0.50 mm touchpoints.',
    thumbnail: <CrownThumb supports tilt={-32} />,
  },
  {
    id: 'e7',
    day: 'Today',
    time: '14:28',
    kind: 'orient',
    title: 'Auto-oriented',
    description: 'Rotated 32° on X to minimise peel forces on the occlusal surface.',
    thumbnail: <CrownThumb tilt={-32} />,
  },
  { id: 'e6', day: 'Today', time: '14:21', kind: 'protect', title: 'Painted protected region', description: 'Kept supports off the margin line and occlusal surface.', thumbnail: <CrownThumb /> },
  { id: 'e5', day: 'Today', time: '14:15', kind: 'move', title: 'Moved model', description: 'Moved 18 mm toward the front of the build platform.', thumbnail: <CrownThumb /> },
  {
    id: 'e4',
    day: 'Yesterday',
    time: '17:02',
    kind: 'restore',
    title: 'Restored to “Changed material”',
    description: 'Rolled back two steps from the Saved versions list.',
    thumbnail: <CrownThumb />,
  },
  { id: 'e3', day: 'Yesterday', time: '16:50', kind: 'clear', title: 'Cleared supports', description: 'Removed all 386 supports and the raft.' },
  { id: 'e2', day: 'Yesterday', time: '16:44', kind: 'material', title: 'Changed material', description: 'Grey V5 → Tough 2000 at 0.1 mm layer height.' },
  { id: 'e1', day: 'Yesterday', time: '16:40', kind: 'import', title: 'Imported Molar_crown_A3.stl', description: '12.4 MB · 284,112 triangles · scaled to millimetres.' },
];

const savedVersions: SavedVersion[] = [
  { id: 'v2', name: 'Ready to print', sourceTitle: 'Generated supports', sourceTime: '14:32', savedAt: 'Today, 14:35', thumbnail: <CrownThumb supports tilt={-32} /> },
  { id: 'v1', name: 'Before reorient', sourceTitle: 'Moved model', sourceTime: '14:15', savedAt: 'Today, 14:16', thumbnail: <CrownThumb /> },
  { id: 'v0', name: 'Original import', sourceTitle: 'Imported Molar_crown_A3.stl', sourceTime: 'Yesterday 16:40', savedAt: 'Yesterday, 16:41' },
];

const subtitle = (
  <>
    Changes to <strong>Molar_crown_A3</strong> · select another model to switch
  </>
);

const meta = {
  title: 'Components/Specialized/VersionHistory',
  component: VersionHistory,
  tags: ['expanded'],
  args: {
    entries,
    savedVersions,
    currentId: 'e8',
    selectedId: 'e6',
    title: 'History',
    subtitle,
    todayLabel: 'Today',
    onSelect: fn(),
    onRestore: fn(),
    onSaveVersion: fn(),
    onRestoreVersion: fn(),
    onClose: fn(),
    onTabChange: fn(),
  },
  argTypes: {
    currentId: { control: 'select', options: entries.map((e) => e.id) },
    selectedId: { control: 'select', options: [undefined, ...entries.map((e) => e.id)] },
    tab: { control: 'inline-radio', options: [undefined, 'timeline', 'versions'] },
    title: { control: 'text' },
    subtitle: { control: false },
    todayLabel: { control: 'text' },
    entries: { control: 'object' },
    savedVersions: { control: 'object' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state (newest row)' },
  },
  render: function Render(args) {
    const [{ selectedId, tab }, update] = useArgs<{ selectedId?: string; tab?: VersionHistoryTab }>();
    return (
      <VersionHistory
        {...args}
        selectedId={selectedId}
        tab={tab}
        onSelect={(id) => {
          args.onSelect?.(id);
          update({ selectedId: id });
        }}
        onTabChange={(t) => {
          args.onTabChange?.(t);
          if (tab !== undefined) update({ tab: t });
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'The PreForm history panel as a reusable component. Entries are grouped by day on a timeline (today’s group uses the `--color-fg-accent` dot and `--color-border-accent` rail), each with time, kind icon, title, description, thumbnail slot, "Current" badge and a ⋮ menu (Restore to this step…, Save as version). A tablist switches to Saved versions; the footer restores the selected step. Up/Down arrows move between rows.',
      },
    },
  },
} satisfies Meta<typeof VersionHistory>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const CurrentSelected: Story = {
  name: 'Current step selected',
  args: { selectedId: 'e8' },
};

export const SavedVersions: Story = {
  name: 'Saved versions tab',
  args: { tab: 'versions' },
};

export const WithoutThumbnails: Story = {
  args: { entries: entries.map((e) => ({ ...e, thumbnail: undefined })), savedVersions: savedVersions.map((v) => ({ ...v, thumbnail: undefined })) },
};

export const Empty: Story = {
  name: 'Empty (new model)',
  args: {
    entries: [],
    savedVersions: [],
    currentId: undefined,
    selectedId: undefined,
    subtitle: (
      <>
        Changes to <strong>Bracket_v2</strong>
      </>
    ),
  },
};

export const NoSavedVersions: Story = {
  name: 'Saved versions tab, empty',
  args: { tab: 'versions', savedVersions: [] },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={(p) =>
        p.disabled ? (
          <span className="pf-text-caption">No disabled state</span>
        ) : (
          <VersionHistory entries={entries.slice(0, 2)} currentId="e8" selectedId="e8" title="History" data-state={p['data-state']} />
        )
      }
    />
  ),
};
