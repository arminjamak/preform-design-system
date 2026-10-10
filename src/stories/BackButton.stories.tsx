import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BackButton } from '../components/BackButton/BackButton';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Navigation/BackButton',
  component: BackButton,
  tags: ['expanded'],
  args: { label: 'Back to Projects', onClick: fn(), href: undefined, size: 'sm', disabled: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    href: { control: 'text' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Compact ghost pill with a left arrow for drill-in views ("Back to Projects", "Back to Print Settings"). Renders a link when `href` is set; the tooltip hints the browser Alt+Left shortcut. Uses `--component-button-radius` and `--color-bg-hover`.',
      },
    },
  },
} satisfies Meta<typeof BackButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AsLink: Story = { name: 'As link', args: { href: '#projects', label: 'Back to Projects' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-row">
      <BackButton {...args} size="sm" />
      <BackButton {...args} size="md" />
    </div>
  ),
};

export const InPanelHeader: Story = {
  name: 'In a panel header',
  render: (args) => (
    <div className="sb-panel-demo" style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--component-panel-radius)', boxShadow: 'var(--elevation-panel)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', height: 'var(--component-panel-header-height)', paddingInline: 'var(--space-1)', borderBottom: 'var(--border-width-1) solid var(--color-border-subtle)' }}>
        <BackButton {...args} label="Print Settings" />
      </div>
      <div style={{ padding: 'var(--space-3)' }}>
        <p className="pf-text-body-strong">Material · Grey Resin V5</p>
        <p className="pf-text-body-sm" style={{ color: 'var(--color-fg-muted)' }}>Layer height 0.05 mm · Form 4</p>
      </div>
    </div>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'button', render: (p) => <BackButton {...args} {...p} /> },
        { label: 'link', render: (p) => <BackButton {...args} href="#projects" {...p} /> },
      ]}
    />
  ),
};
