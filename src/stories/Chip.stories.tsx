import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { CircleAlertIcon, CircleCheckIcon, ClockIcon, DropletIcon, LoaderIcon, SearchIcon } from 'lucide-react';
import { Chip, ChipGroup } from '../components/Chip/Chip';
import { StateMatrix } from './helpers/StateMatrix';

const icons = {
  none: undefined,
  droplet: <DropletIcon strokeWidth={2.2} />,
  clock: <ClockIcon strokeWidth={2.2} />,
  check: <CircleCheckIcon strokeWidth={2.2} />,
  search: <SearchIcon strokeWidth={2.2} />,
};

const meta = {
  title: 'Components/Data Display/Chip',
  component: Chip,
  tags: ['expanded'],
  args: {
    label: 'Tough 2000',
    variant: 'filter',
    tone: 'neutral',
    size: 'md',
    selected: true,
    disabled: false,
    icon: undefined,
    onSelectedChange: fn(),
    onRemove: fn(),
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['tag', 'filter', 'input'] },
    tone: {
      control: 'select',
      options: ['neutral', 'accent', 'success', 'warning', 'danger', 'info'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    icon: { control: 'select', options: Object.keys(icons), mapping: icons },
    avatar: { control: 'object' },
    'data-state': {
      control: 'inline-radio',
      options: [undefined, 'hover', 'focus', 'active'],
      name: 'forced state',
    },
  },
  render: function Render(args) {
    const [{ selected }, update] = useArgs();
    return (
      <Chip
        {...args}
        selected={selected}
        onSelectedChange={(v) => {
          update({ selected: v });
          args.onSelectedChange?.(v);
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'One component for tags and chips. `tag` is a static, tone-coloured label (material, status) on soft status tokens; `filter` is an outline pill that toggles with a check and fills with `--color-bg-accent-soft`; `input` is a removable value with an × button (Backspace/Delete also remove). `ChipGroup` wraps chips and owns selection: `multiple` renders toggle buttons (`aria-pressed`), `single` a radiogroup with arrow-key navigation.',
      },
    },
  },
} satisfies Meta<typeof Chip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tags: Story = {
  name: 'Tag tones',
  parameters: { controls: { include: ['size'] } },
  render: (args) => (
    <div className="sb-row">
      <Chip variant="tag" size={args.size} label="Grey V5" icon={<DropletIcon strokeWidth={2.2} />} />
      <Chip variant="tag" size={args.size} tone="accent" label="Form 4" />
      <Chip variant="tag" size={args.size} tone="info" label="Clear V5" icon={<DropletIcon strokeWidth={2.2} />} />
      <Chip variant="tag" size={args.size} tone="success" label="Biocompatible" />
      <Chip variant="tag" size={args.size} tone="warning" label="Tank near end of life" />
      <Chip variant="tag" size={args.size} tone="danger" label="Incompatible printer" />
    </div>
  ),
};

export const StatusFilters: Story = {
  name: 'Filter group (multiple)',
  parameters: { controls: { include: ['size'] } },
  render: function Render(args) {
    const [value, setValue] = useState<string[]>(['printing', 'queued']);
    return (
      <ChipGroup label="Filter jobs by print status" value={value} onChange={setValue} size={args.size}>
        <Chip variant="filter" value="printing" label="Printing" icon={<LoaderIcon strokeWidth={2.2} />} />
        <Chip variant="filter" value="queued" label="Queued" icon={<ClockIcon strokeWidth={2.2} />} />
        <Chip variant="filter" value="finished" label="Finished" icon={<CircleCheckIcon strokeWidth={2.2} />} />
        <Chip variant="filter" value="failed" label="Failed" icon={<CircleAlertIcon strokeWidth={2.2} />} />
        <Chip variant="filter" value="archived" label="Archived" disabled />
      </ChipGroup>
    );
  },
};

export const LayerHeight: Story = {
  name: 'Filter group (single)',
  parameters: { controls: { include: ['size'] } },
  render: function Render(args) {
    const [value, setValue] = useState<string[]>(['50']);
    return (
      <ChipGroup label="Layer height" selectionMode="single" value={value} onChange={setValue} size={args.size}>
        <Chip variant="filter" value="25" label="25 µm" />
        <Chip variant="filter" value="50" label="50 µm" />
        <Chip variant="filter" value="100" label="100 µm" />
        <Chip variant="filter" value="adaptive" label="Adaptive" />
      </ChipGroup>
    );
  },
};

export const InputChips: Story = {
  name: 'Input (removable)',
  parameters: { controls: { include: ['size'] } },
  render: function Render(args) {
    const [terms, setTerms] = useState(['Mini Chassis Kit', 'Grey V5', 'Form 4', 'Supports: Fine detail']);
    return (
      <ChipGroup label="Applied filters" size={args.size}>
        {terms.map((t) => (
          <Chip key={t} variant="input" label={t} onRemove={() => setTerms((list) => list.filter((x) => x !== t))} />
        ))}
        <Chip variant="input" label="Armin Jamak" avatar={{ name: 'Armin Jamak' }} onRemove={fn()} />
      </ChipGroup>
    );
  },
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack">
      {(['sm', 'md'] as const).map((size) => (
        <div key={size} className="sb-row">
          <Chip size={size} variant="tag" tone="info" label="Clear V5" />
          <Chip size={size} variant="filter" label="Failed" selected onSelectedChange={fn()} />
          <Chip size={size} variant="filter" label="Queued" onSelectedChange={fn()} />
          <Chip size={size} variant="input" label="Form 4" onRemove={fn()} />
          <Chip size={size} variant="filter" label="Lena Fischer" avatar={{ name: 'Lena Fischer' }} onSelectedChange={fn()} />
        </div>
      ))}
    </div>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={() => null}
      rows={[
        {
          label: 'filter off',
          render: (p) => <Chip variant="filter" label="Queued" onSelectedChange={() => {}} {...p} />,
        },
        {
          label: 'filter on',
          render: (p) => <Chip variant="filter" label="Printing" selected onSelectedChange={() => {}} {...p} />,
        },
        {
          label: 'input',
          render: (p) => <Chip variant="input" label="Grey V5" onRemove={() => {}} {...p} />,
        },
        {
          label: 'tag',
          render: (p) => <Chip variant="tag" tone="accent" label="Form 4" {...p} />,
        },
      ]}
    />
  ),
};
