import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { Pagination } from '../components/Pagination/Pagination';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Navigation/Pagination',
  component: Pagination,
  tags: ['expanded'],
  args: {
    page: 3,
    pageCount: 7,
    onChange: fn(),
    siblingCount: 1,
    pageSize: 20,
    pageSizeOptions: [10, 20, 50],
    onPageSizeChange: fn(),
    total: 134,
    size: 'sm',
    compact: false,
    disabled: false,
    label: 'Print history pages',
  },
  argTypes: {
    page: { control: { type: 'number', min: 1 } },
    pageCount: { control: { type: 'number', min: 1 } },
    siblingCount: { control: { type: 'number', min: 0, max: 3 } },
    pageSize: { control: { type: 'number', min: 1 } },
    pageSizeOptions: { control: 'object' },
    total: { control: { type: 'number', min: 0 } },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Pages through print history, the job queue and material libraries. Numbered pages collapse around `siblingCount` with ellipses; prev/next are IconButtons and the current page uses `--color-bg-accent-soft`. Compact mode shows "3 / 12" for narrow panels.',
      },
    },
  },
  render: function Render(args) {
    const [{ page, pageSize, total }, update] = useArgs<typeof args>();
    return (
      <Pagination
        {...args}
        page={page}
        pageSize={pageSize}
        onChange={(p) => {
          args.onChange(p);
          update({ page: p });
        }}
        onPageSizeChange={(n) => {
          args.onPageSizeChange?.(n);
          update({ pageSize: n, page: 1, ...(total !== undefined ? { pageCount: Math.max(1, Math.ceil(total / n)) } : {}) });
        }}
      />
    );
  },
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const PagesOnly: Story = {
  name: 'Pages only',
  args: { page: 6, pageCount: 12, total: undefined, pageSizeOptions: undefined, pageSize: undefined },
};

export const ManyPages: Story = {
  name: 'Many pages (siblingCount 2)',
  args: { page: 24, pageCount: 48, siblingCount: 2, total: undefined, pageSizeOptions: undefined, pageSize: undefined },
};

export const Compact: Story = {
  args: { compact: true, page: 3, pageCount: 12, total: undefined, pageSize: undefined },
  decorators: [(S) => <div className="sb-panel-demo" style={{ display: 'flex', justifyContent: 'flex-end' }}><S /></div>],
};

export const CompactWithSummary: Story = {
  name: 'Compact with summary',
  args: { compact: true, page: 2, pageCount: 9, total: 172, pageSize: 20 },
  decorators: [(S) => <div className="sb-panel-demo"><S /></div>],
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      <Pagination {...args} size="sm" />
      <Pagination {...args} size="md" />
    </div>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'pages', render: (p) => <Pagination page={2} pageCount={3} onChange={() => {}} {...p} /> },
        { label: 'compact', render: (p) => <Pagination compact page={2} pageCount={3} onChange={() => {}} {...p} /> },
      ]}
    />
  ),
};
