import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FileList, type FileListFile } from '../components/FileList/FileList';
import { StateMatrix } from './helpers/StateMatrix';

const files: FileListFile[] = [
  {
    id: 'f1',
    name: 'mini-chassis-kit.stl',
    size: 12_998_451,
    modified: new Date('2026-10-10T14:18:00'),
    status: 'uploaded',
  },
  {
    id: 'f2',
    name: 'Chassis batch 3.form',
    size: 48_211_002,
    modified: new Date('2026-10-10T09:14:00'),
    status: 'uploaded',
  },
  {
    id: 'f3',
    name: 'dental-arch-upper.3mf',
    size: 6_204_118,
    modified: '2m ago',
    status: 'uploading',
    progress: 64,
  },
  {
    id: 'f4',
    name: 'bracket_v2.obj',
    size: 861_224,
    modified: new Date('2026-10-09T17:02:00'),
    status: 'uploaded',
  },
  {
    id: 'f5',
    name: 'turbine-housing-full-res.stl',
    size: 214_558_090,
    modified: 'Just now',
    status: 'failed',
    error: 'Upload failed · file exceeds 200 MB limit',
  },
];

const meta = {
  title: 'Components/Data Display/FileList',
  component: FileList,
  tags: ['expanded'],
  args: {
    files,
    density: 'comfortable',
    onAction: fn(),
    onOpen: fn(),
    'aria-label': 'Project files',
  },
  argTypes: {
    density: { control: 'inline-radio', options: ['compact', 'comfortable'] },
    files: { control: 'object' },
    actions: { control: false },
    'data-state': {
      control: 'inline-radio',
      options: [undefined, 'hover', 'focus', 'active'],
      name: 'forced state',
    },
  },
  decorators: [
    (S) => (
      <div
        style={{
          width: 'var(--size-layout-dialog-lg)',
          background: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-1)',
        }}
      >
        <S />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Model files in a project, dashboard or upload queue. Each row has a type tile (STL / OBJ / 3MF / FORM, coloured by `--color-chart-series-*` so types stay distinct in both themes), a name button that calls `onOpen`, size and modified date, upload status (check, progress bar on the slider tokens, or a danger row with the reason) and a ⋮ `Menu` whose choices reach `onAction(id, file)`. Failed uploads offer Retry and Remove. `compact` puts type, size and date in columns; `comfortable` stacks them under the name.',
      },
    },
  },
} satisfies Meta<typeof FileList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Compact: Story = { args: { density: 'compact' } };

export const UploadStates: Story = {
  name: 'Upload states',
  args: {
    files: [
      {
        id: 'u1',
        name: 'wheel-hub.stl',
        size: 2_304_112,
        modified: 'Just now',
        status: 'uploading',
        progress: 12,
      },
      {
        id: 'u2',
        name: 'motor-mount.stl',
        size: 3_908_551,
        modified: 'Just now',
        status: 'uploading',
        progress: 87,
      },
      {
        id: 'u3',
        name: 'chassis-base.stl',
        size: 6_785_788,
        modified: '1m ago',
        status: 'uploaded',
      },
      {
        id: 'u4',
        name: 'scan-raw.obj',
        size: 98_221_400,
        modified: '1m ago',
        status: 'failed',
        error: 'Mesh has 412 non-manifold edges. Repair and retry.',
      },
    ],
  },
};

export const CustomActions: Story = {
  name: 'Custom actions',
  args: {
    files: files.slice(0, 2),
    actions: [
      { id: 'add', label: 'Add to build platform' },
      { id: 'reveal', label: 'Show in folder' },
    ],
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  decorators: [],
  render: () => (
    <StateMatrix
      render={(p) => (
        <div
          style={{
            width: 'var(--size-layout-sidebar)',
            background: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <FileList
            files={[
              {
                id: 's',
                name: 'bracket_v2.obj',
                size: 861_224,
                modified: 'Oct 9',
                status: p.disabled ? 'uploading' : 'uploaded',
                progress: 40,
              },
            ]}
            data-state={p['data-state']}
            onOpen={() => {}}
          />
        </div>
      )}
    />
  ),
};
