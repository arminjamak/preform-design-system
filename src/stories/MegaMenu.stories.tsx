import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { BookOpenIcon, CpuIcon, DropletIcon, FlameIcon, GraduationCapIcon, LifeBuoyIcon, PrinterIcon, ShieldCheckIcon, SmileIcon, SparklesIcon, ZapIcon } from 'lucide-react';
import { MegaMenu, MegaMenuFeatured, type MegaMenuColumn } from '../components/MegaMenu/MegaMenu';
import { Button } from '../components/Button/Button';
import { StateMatrix } from './helpers/StateMatrix';

const columns: MegaMenuColumn[] = [
  {
    title: 'Materials',
    items: [
      { label: 'Standard', description: 'Grey, White, Clear and Black for everyday prototyping.', icon: <DropletIcon strokeWidth={2} />, onSelect: fn() },
      { label: 'Engineering', description: 'Tough 2000, Rigid 10K and Flexible 80A for functional parts.', icon: <ShieldCheckIcon strokeWidth={2} />, onSelect: fn() },
      { label: 'Dental', description: 'Model, Surgical Guide and Denture Base resins.', icon: <SmileIcon strokeWidth={2} />, onSelect: fn() },
    ],
  },
  {
    title: 'Printers',
    items: [
      { label: 'Form 4', description: 'Fast, accurate MSLA resin printing.', icon: <PrinterIcon strokeWidth={2} />, onSelect: fn() },
      { label: 'Form 4L', description: 'Large format: 353 × 196 × 350 mm build volume.', icon: <ZapIcon strokeWidth={2} />, onSelect: fn() },
      { label: 'Fuse 1+ 30W', description: 'SLS nylon parts with no supports.', icon: <CpuIcon strokeWidth={2} />, onSelect: fn() },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Print settings guide', description: 'Layer heights, supports and orientation.', icon: <BookOpenIcon strokeWidth={2} />, href: '#print-settings' },
      { label: 'Support Center', description: 'Troubleshooting and maintenance.', icon: <LifeBuoyIcon strokeWidth={2} />, href: '#support' },
      { label: 'Webinars', description: 'Live sessions with application engineers.', icon: <GraduationCapIcon strokeWidth={2} />, href: '#webinars' },
    ],
  },
];

const featured = (
  <MegaMenuFeatured
    eyebrow="New material"
    title="Alumina 4N Resin"
    description="Technical ceramic at 99.99% purity for parts that run above 1,500 °C."
    media={<FlameIcon strokeWidth={1.6} />}
    action={
      <Button variant="outlineAccent" iconEnd={<SparklesIcon strokeWidth={2} />}>
        Explore Alumina 4N
      </Button>
    }
  />
);

const justify = { start: 'flex-start', center: 'center', end: 'flex-end' } as const;

const meta = {
  title: 'Components/Navigation/MegaMenu',
  component: MegaMenu,
  tags: ['expanded'],
  args: { label: 'Products', columns, featured, align: 'start', variant: 'default', open: true, onOpenChange: fn(), disabled: false },
  argTypes: {
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    variant: { control: 'inline-radio', options: ['default', 'inverse'] },
    featured: { control: false },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state (trigger)' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A top-level trigger that opens a wide panel of categorised link columns (materials, printers, resources) with an optional featured card. Built on Popover (`--elevation-popover`, `--component-menu-radius`); columns are divided by `--color-border-subtle` and the featured cell sits on `--color-bg-subtle`. Arrow Down opens and enters the panel, arrows move within and across columns, Escape closes and returns focus to the trigger.',
      },
    },
  },
  render: function Render(args) {
    const [{ open }, update] = useArgs();
    const inverse = args.variant === 'inverse';
    return (
      <div style={{ width: '100%', minHeight: 'calc(var(--size-layout-panel) + var(--space-16))' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: justify[args.align ?? 'start'],
            background: inverse ? 'var(--color-bg-inverse)' : undefined,
            borderRadius: inverse ? 'var(--radius-md)' : undefined,
          }}
        >
          <MegaMenu
            {...args}
            open={open}
            onOpenChange={(o) => {
              args.onOpenChange?.(o);
              update({ open: o });
            }}
          />
        </div>
      </div>
    );
  },
} satisfies Meta<typeof MegaMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Inverse: Story = {
  name: 'Inverse (in the top bar)',
  args: { variant: 'inverse', label: 'Materials' },
};

export const WithoutFeatured: Story = {
  args: { featured: undefined, label: 'Resources' },
};

export const AlignEnd: Story = {
  args: { align: 'end', featured: undefined, columns: columns.slice(0, 2), label: 'Shop' },
};

export const Closed: Story = {
  args: { open: false },
};

export const States: Story = {
  parameters: { layout: 'centered', controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'Default', render: (p) => <MegaMenu label="Products" columns={columns} open={false} {...p} /> },
        {
          label: 'Inverse',
          render: (p) => (
            <div style={{ display: 'inline-flex', background: 'var(--color-bg-inverse)' }}>
              <MegaMenu variant="inverse" label="Products" columns={columns} open={false} {...p} />
            </div>
          ),
        },
      ]}
    />
  ),
};
