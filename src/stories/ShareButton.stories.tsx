import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FileDownIcon, LinkIcon, MailIcon, PrinterIcon } from 'lucide-react';
import { DEFAULT_SHARE_TARGETS, ShareButton, type ShareTarget } from '../components/ShareButton/ShareButton';
import { StateMatrix } from './helpers/StateMatrix';

const teamTargets: ShareTarget[] = [
  { id: 'copy-link', label: 'Copy link', icon: <LinkIcon strokeWidth={2.2} /> },
  { id: 'email', label: 'Email to team', icon: <MailIcon strokeWidth={2.2} /> },
  { id: 'send-printer', label: 'Send to Form 4 · Studio', icon: <PrinterIcon strokeWidth={2.2} /> },
  { id: 'export-form', label: 'Export .form file', icon: <FileDownIcon strokeWidth={2.2} /> },
  { id: 'export-stl', label: 'Export .stl (requires sign-in)', disabled: true },
];

const meta = {
  title: 'Components/Actions/ShareButton',
  component: ShareButton,
  tags: ['expanded'],
  args: {
    url: 'https://form.example/share/mini-chassis-kit-7f3a2c',
    title: 'Mini Chassis Kit',
    targets: DEFAULT_SHARE_TARGETS,
    label: 'Share',
    size: 'sm',
    variant: 'outline',
    align: 'start',
    placement: 'bottom',
    disabled: false,
    onShare: fn(),
  },
  argTypes: {
    targets: { control: 'select', options: ['default', 'team'], mapping: { default: DEFAULT_SHARE_TARGETS, team: teamTargets } },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'inline-radio', options: ['primary', 'outline', 'muted', 'ghost'] },
    align: { control: 'inline-radio', options: ['start', 'end'] },
    placement: { control: 'inline-radio', options: ['top', 'bottom'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  decorators: [(S) => <div style={{ padding: 'var(--space-6) var(--space-24) calc(var(--space-24) * 2.5) var(--space-6)' }}><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Share trigger for a print job or model. Opens a `Popover` dialog (`size.layout.dialog-sm` wide) with a read-only link `TextField` plus `CopyButton`, then share targets as a `MenuList`. Choosing a target calls `onShare(target)`; `copy-link` also copies the URL. Focus moves to the link field on open and Escape returns it to the trigger.',
      },
    },
  },
} satisfies Meta<typeof ShareButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {(['primary', 'outline', 'muted', 'ghost'] as const).map((v) => (
        <ShareButton key={v} {...args} variant={v} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-row">
      <ShareButton {...args} size="sm" />
      <ShareButton {...args} size="md" />
      <ShareButton {...args} size="lg" />
    </div>
  ),
};

export const CustomTargets: Story = { args: { targets: teamTargets, title: 'Print queue · Form 4 · Tough 2000' } };

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={(['primary', 'outline', 'ghost'] as const).map((v) => ({
        label: v,
        render: (p) => <ShareButton {...args} variant={v} {...p} />,
      }))}
    />
  ),
};
