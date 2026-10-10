import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Clock3Icon, DropletIcon, HashIcon, LayersIcon, PrinterIcon } from 'lucide-react';
import { DescriptionList, type DescriptionItem } from '../components/DescriptionList/DescriptionList';
import { Badge } from '../components/Badge/Badge';

const job: DescriptionItem[] = [
  { label: 'Job name', value: 'Chassis batch 3' },
  { label: 'Job ID', value: 'JOB-2026-10-0418', copyValue: 'JOB-2026-10-0418' },
  {
    label: 'Printer',
    value: 'Form 4 · Sunny Wombat',
    copyValue: 'SunnyWombat',
  },
  { label: 'Serial number', value: 'F4-0281-3317' },
  { label: 'Material', value: 'Grey V5 (FLGPGR05)' },
  { label: 'Layer thickness', value: '0.050 mm' },
  {
    label: 'Status',
    value: (
      <Badge tone="success" variant="soft" size="md">
        Printing
      </Badge>
    ),
  },
];

const meta = {
  title: 'Components/Data Display/DescriptionList',
  component: DescriptionList,
  tags: ['expanded'],
  args: {
    items: job,
    layout: 'inline',
    divided: true,
    copyable: true,
    columns: 1,
    onCopy: fn(),
  },
  argTypes: {
    layout: { control: 'inline-radio', options: ['inline', 'stacked'] },
    columns: {
      control: 'inline-radio',
      options: [1, 2, 3],
      if: { arg: 'layout', eq: 'stacked' },
    },
    items: { control: 'object' },
  },
  decorators: [
    (S) => (
      <div style={{ width: 'var(--size-layout-dialog-md)' }}>
        <S />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Readable label/value pairs for detail views: printer info, job summary, material lot. `inline` aligns labels in a 2:3 column split; `stacked` puts the label above a 13px value and can flow into 2–3 columns. Optional hairline dividers (`--color-border-subtle`) and per-value copy buttons (copies `copyValue` or the string value, confirms with a check and a polite live region). **`KeyValueList` remains the dense panel variant**: use it for 20–24px rows inside side panels, and DescriptionList for dialogs, cards and pages.',
      },
    },
  },
} satisfies Meta<typeof DescriptionList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Inline: Story = { args: { divided: false, copyable: false } };

export const Stacked: Story = {
  args: {
    layout: 'stacked',
    columns: 2,
    divided: false,
    copyable: false,
    items: [
      {
        label: 'Printer',
        value: 'Form 4',
        icon: <PrinterIcon strokeWidth={2.2} />,
      },
      {
        label: 'Material',
        value: 'Tough 2000',
        icon: <DropletIcon strokeWidth={2.2} />,
      },
      {
        label: 'Layers',
        value: '2,650 × 0.050 mm',
        icon: <LayersIcon strokeWidth={2.2} />,
      },
      {
        label: 'Print time',
        value: '3 h 48 min',
        icon: <Clock3Icon strokeWidth={2.2} />,
      },
      { label: 'Volume', value: '142.6 mL' },
      { label: 'Estimated cost', value: '$29.94' },
    ],
  },
};

export const StackedDivided: Story = {
  name: 'Stacked, divided, single column',
  args: {
    layout: 'stacked',
    columns: 1,
    items: [
      {
        label: 'Resin tank',
        value: 'Form 4 Resin Tank V1 · 18,400 layers used',
        copyable: false,
      },
      {
        label: 'Cartridge lot',
        value: 'GPGR05-2611-A',
        icon: <HashIcon strokeWidth={2.2} />,
      },
      {
        label: 'Project path',
        value: '/Projects/Robotics/Chassis batch 3.form',
      },
    ],
  },
};

export const Copyable: Story = {
  name: 'Copyable values',
  args: { items: job.slice(1, 4) },
};
