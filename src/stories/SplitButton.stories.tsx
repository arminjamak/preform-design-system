import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ListPlusIcon, PrinterIcon, RefreshCwIcon, SparklesIcon, SquareDashedMousePointerIcon, Trash2Icon, UploadIcon } from 'lucide-react';
import type { MenuItem } from '../components/Menu/Menu';
import { SplitButton } from '../components/SplitButton/SplitButton';
import { StateMatrix } from './helpers/StateMatrix';

const supportItems: MenuItem[] = [
  { label: 'Generate for selected', onSelect: fn(), icon: <SquareDashedMousePointerIcon strokeWidth={2.2} /> },
  { label: 'Regenerate all', onSelect: fn(), icon: <RefreshCwIcon strokeWidth={2.2} /> },
  { type: 'separator' },
  { label: 'Remove all supports', onSelect: fn(), icon: <Trash2Icon strokeWidth={2.2} />, danger: true },
];

const queueItems: MenuItem[] = [
  { label: 'Upload to Form 4 · Studio', onSelect: fn(), icon: <PrinterIcon strokeWidth={2.2} /> },
  { label: 'Add to print queue', onSelect: fn(), icon: <ListPlusIcon strokeWidth={2.2} /> },
  { label: 'Upload to Form 3+ · Lab', onSelect: fn(), disabled: true },
];

const meta = {
  title: 'Components/Actions/SplitButton',
  component: SplitButton,
  tags: ['expanded'],
  args: {
    label: 'Generate Supports',
    items: supportItems,
    variant: 'primary',
    size: 'sm',
    disabled: false,
    loading: false,
    placement: 'bottom',
    menuLabel: 'More support options',
    onClick: fn(),
  },
  argTypes: {
    items: { control: 'select', options: ['supports', 'queue'], mapping: { supports: supportItems, queue: queueItems } },
    variant: { control: 'inline-radio', options: ['primary', 'outline', 'muted'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    placement: { control: 'inline-radio', options: ['top', 'bottom'] },
    iconStart: { control: 'boolean', mapping: { true: <SparklesIcon strokeWidth={2.2} />, false: undefined } },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  decorators: [(S) => <div style={{ padding: 'var(--space-6) var(--space-24) var(--space-24)' }}><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Main action plus an attached chevron that opens a `MenuList` in a `Popover`. Used for Generate Supports ▾ and Upload to Queue ▾ in the PreForm panels. Both halves are `Button`s sharing one pill; the divider is `fg.on-accent` at `opacity.dimmed` on primary and `border.default` / `border.strong` on outline / muted. ArrowDown/ArrowUp on the chevron open the menu, Escape closes it and returns focus.\n\n' +
          '**Button coverage:** Primary = `Button variant="primary"`, Secondary = `variant="outline"`, Tertiary = `variant="ghost"`, Destructive = `variant="danger"`, Text = `variant="link"`, Loading = `Button loading`, Overflow = `Menu` (⋮ IconButton + MenuList). SplitButton covers primary-plus-overflow.',
      },
    },
  },
} satisfies Meta<typeof SplitButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      <SplitButton {...args} variant="primary" />
      <SplitButton {...args} variant="outline" label="Upload to Queue" items={queueItems} iconStart={<UploadIcon strokeWidth={2.2} />} menuLabel="Choose printer" />
      <SplitButton {...args} variant="muted" label="Regenerate" items={supportItems} />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-row">
      <SplitButton {...args} size="sm" />
      <SplitButton {...args} size="md" />
      <SplitButton {...args} size="lg" />
    </div>
  ),
};

export const WithIcon: Story = { args: { iconStart: <SparklesIcon strokeWidth={2.2} /> } };

export const Loading: Story = { args: { loading: true, label: 'Generating…' } };

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={(['primary', 'outline', 'muted'] as const).map((v) => ({
        label: v,
        render: (p) => <SplitButton {...args} variant={v} {...p} />,
      }))}
    />
  ),
};
