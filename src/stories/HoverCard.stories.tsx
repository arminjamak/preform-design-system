import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { DropletIcon, LayersIcon, MapPinIcon, PrinterIcon } from 'lucide-react';
import { HoverCard } from '../components/HoverCard/HoverCard';
import { Button } from '../components/Button/Button';
import { Badge } from '../components/Badge/Badge';
import { KeyValueList } from '../components/KeyValueList/KeyValueList';
import { Divider } from '../components/Divider/Divider';
import { Avatar } from '../components/Avatar/Avatar';

function PrinterPreview() {
  return (
    <div className="sb-stack" style={{ alignItems: 'stretch', gap: 'var(--space-2)' }}>
      <div className="sb-row" style={{ gap: 'var(--space-2)', flexWrap: 'nowrap' }}>
        <PrinterIcon style={{ width: 'var(--size-icon-md)', height: 'var(--size-icon-md)', color: 'var(--color-fg-accent)' }} aria-hidden="true" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="pf-text-body-strong">Ostrich-Fierce</p>
          <p className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>
            Form 4 · Firmware 1.9.2
          </p>
        </div>
        <Badge tone="success">Printing</Badge>
      </div>
      <p className="pf-text-body-sm">
        Bracket_v3 × 6 · <strong>62%</strong> · 1 h 14 min left
      </p>
      <Divider spacing="none" tone="subtle" />
      <KeyValueList
        rows={[
          { key: 'Material', value: 'Grey V5 · 640 mL left', icon: <DropletIcon /> },
          { key: 'Resin tank', value: 'LT V2 · 2,340 layers', icon: <LayersIcon /> },
          { key: 'Location', value: 'Lab bench 2', icon: <MapPinIcon /> },
        ]}
      />
    </div>
  );
}

const meta = {
  title: 'Components/Overlays/HoverCard',
  component: HoverCard,
  tags: ['expanded'],
  args: {
    trigger: null,
    children: null,
    openDelay: 500,
    closeDelay: 200,
    placement: 'bottom',
    align: 'start',
    width: 'md',
    open: undefined,
    onOpenChange: fn(),
    disabled: false,
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    width: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    open: { control: 'select', options: [undefined, true, false] },
    openDelay: { control: { type: 'number', step: 100 } },
    closeDelay: { control: { type: 'number', step: 100 } },
    trigger: { control: false },
    children: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Rich preview shown on hover or keyboard focus after `openDelay`, kept open while the pointer moves onto it and closed after `closeDelay` or on Escape. Hover a printer name for status, material and tank; a model chip for its size; a collaborator for their role. Uses `--elevation-popover`, `--component-menu-radius` and widths from `--size-layout-*`.',
      },
    },
  },
  decorators: [(S) => <div style={{ padding: 'var(--space-24)', minHeight: 'calc(var(--size-layout-dialog-md) + var(--space-8))' }}><S /></div>],
  render: function Render(args) {
    const [, update] = useArgs();
    return (
      <p className="pf-text-body">
        Job sent to{' '}
        <HoverCard
          {...args}
          onOpenChange={(o) => {
            args.onOpenChange?.(o);
            if (args.open !== undefined) update({ open: o });
          }}
          trigger={<Button variant="link">Ostrich-Fierce</Button>}
        >
          <PrinterPreview />
        </HoverCard>{' '}
        at 14:02.
      </p>
    );
  },
} satisfies Meta<typeof HoverCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Open: Story = { args: { open: true } };

export const Placements: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, max-content)', gap: 'var(--space-24)', justifyContent: 'center', padding: 'var(--space-12) calc(var(--space-24) * 3)' }}>
      {(['left', 'right', 'top', 'bottom'] as const).map((placement) => (
        <HoverCard key={placement} placement={placement} align="center" width="sm" open trigger={<Button variant="outline">{placement}</Button>}>
          <p className="pf-text-body-strong">Grey V5</p>
          <p className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>
            640 mL left · expires Mar 2027
          </p>
        </HoverCard>
      ))}
    </div>
  ),
};

export const Collaborator: Story = {
  args: { width: 'sm', placement: 'right', align: 'center' },
  render: (args) => (
    <HoverCard {...args} trigger={<button type="button" style={{ borderRadius: 'var(--radius-full)' }}><Avatar name="Maya Okafor" size="sm" /></button>}>
      <div className="sb-row" style={{ flexWrap: 'nowrap' }}>
        <Avatar name="Maya Okafor" size="md" />
        <div>
          <p className="pf-text-body-strong">Maya Okafor</p>
          <p className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>
            Print lab manager · editing supports
          </p>
        </div>
      </div>
    </HoverCard>
  ),
};
