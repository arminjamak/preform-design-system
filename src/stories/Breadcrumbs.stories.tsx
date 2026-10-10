import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CloudIcon, FolderIcon } from 'lucide-react';
import { Breadcrumbs, type BreadcrumbItem } from '../components/Breadcrumbs/Breadcrumbs';
import { StateMatrix } from './helpers/StateMatrix';

const path: BreadcrumbItem[] = [
  { label: 'Projects', href: '#projects', onClick: fn(), icon: <FolderIcon strokeWidth={2.2} /> },
  { label: 'Mini Chassis Kit', href: '#mini-chassis-kit', onClick: fn() },
  { label: 'Supports' },
];

const deepPath: BreadcrumbItem[] = [
  { label: 'Formlabs Cloud', href: '#cloud', onClick: fn(), icon: <CloudIcon strokeWidth={2.2} /> },
  { label: 'Projects', href: '#projects', onClick: fn() },
  { label: 'Automotive', href: '#automotive', onClick: fn() },
  { label: 'Mini Chassis Kit', href: '#mini-chassis-kit', onClick: fn() },
  { label: 'Bracket_v3.form', href: '#bracket', onClick: fn() },
  { label: 'Supports' },
];

const meta = {
  title: 'Components/Navigation/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['expanded'],
  args: { items: path, size: 'md', maxItems: undefined, label: 'Breadcrumb' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    maxItems: { control: { type: 'number', min: 2, max: 8, step: 1 } },
    items: { control: 'object' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Location trail for nested PreForm views (project → print file → step). The last crumb is the current page (`aria-current="page"`); `maxItems` folds the middle crumbs into a "…" Menu. Driven by `--color-fg-muted`, `--color-bg-hover` and the label typography tokens.',
      },
    },
  },
} satisfies Meta<typeof Breadcrumbs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      <Breadcrumbs {...args} size="sm" />
      <Breadcrumbs {...args} size="md" />
    </div>
  ),
};

export const Collapsed: Story = {
  name: 'Collapsed (maxItems)',
  args: { items: deepPath, maxItems: 3 },
  decorators: [(S) => <div style={{ paddingBottom: 'var(--space-24)' }}><S /></div>],
};

export const ButtonItems: Story = {
  name: 'Button items',
  args: {
    items: [
      { label: 'Print queue', onClick: fn() },
      { label: 'Form 4 · Studio', onClick: fn() },
      { label: 'Job 1287' },
    ],
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={(p) =>
        p.disabled ? (
          <span className="pf-text-caption" style={{ color: 'var(--color-fg-faint)' }}>n/a</span>
        ) : (
          <Breadcrumbs items={path.slice(1)} data-state={p['data-state']} />
        )
      }
    />
  ),
};
