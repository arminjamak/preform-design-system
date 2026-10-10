import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { BellIcon, CloudIcon, ShoppingCartIcon, ThumbsUpIcon } from 'lucide-react';
import { AccountChip, ProjectTitle, TopNav } from '../components/TopNav/TopNav';
import { IconButton } from '../components/IconButton/IconButton';
import { StateMatrix } from './helpers/StateMatrix';

/** Formlabs-style mark drawn with currentColor so it follows --color-fg-on-inverse. */
const Logo = () => (
  <svg viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden="true">
    <path d="M2 4 L16 13 L30 4 L24 20 L16 13 L8 20 Z" />
    <path d="M16 13 L13 21 M16 13 L19 21" />
  </svg>
);

const PreFormGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.5 L20.5 6.5 V17 L12 21.5 L3.5 17 V6.5 Z" />
    <path d="M3.5 6.5 L12 10.8 L20.5 6.5 M12 10.8 V21.5 M8 4.5 V19.5 M16 4.5 V19.5" />
  </svg>
);

const sections = [
  { value: 'preform', label: 'PreForm', icon: <PreFormGlyph /> },
  { value: 'dashboard', label: 'Dashboard', icon: <CloudIcon strokeWidth={1.6} /> },
];

const actions = (
  <>
    <IconButton variant="inverse" label="Print notifications" icon={<BellIcon strokeWidth={2} />} />
    <IconButton variant="inverse" label="Send feedback" icon={<ThumbsUpIcon strokeWidth={2} />} />
    <IconButton variant="inverse" label="Formlabs store" icon={<ShoppingCartIcon strokeWidth={2} />} />
  </>
);

const user = { name: 'Maya Chen', email: 'maya.chen@example.com' };

const meta = {
  title: 'Components/Navigation/TopNav',
  component: TopNav,
  tags: ['expanded'],
  args: {
    logo: <Logo />,
    logoLabel: 'Formlabs',
    sections,
    value: 'preform',
    onChange: fn(),
    title: 'Mini Chassis Kit',
    onTitleClick: fn(),
    onTitleChange: fn(),
    actions,
    user,
    onAccountClick: fn(),
  },
  argTypes: {
    logo: { control: false },
    actions: { control: false },
    value: { control: 'inline-radio', options: ['preform', 'dashboard'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state (tab 2, title, account)' },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The dark PreForm application bar: logo cell, app section tabs (Tabs `inverse`), a centred project title that renames inline, right-side icon actions and the account chip. Height is `--size-layout-nav`, the surface is `--color-bg-inverse`, and the account chip is separated by `--color-border-inverse`. `AccountChip` and `ProjectTitle` are exported for reuse.',
      },
    },
  },
  decorators: [(Story) => <div style={{ width: '100%' }}><Story /></div>],
  render: function Render(args) {
    const [{ value, title }, update] = useArgs();
    return (
      <TopNav
        {...args}
        value={value}
        title={title}
        onChange={(v) => {
          args.onChange(v);
          update({ value: v });
        }}
        onTitleChange={(t) => {
          args.onTitleChange?.(t);
          update({ title: t });
        }}
      />
    );
  },
} satisfies Meta<typeof TopNav>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Dashboard: Story = {
  name: 'Dashboard section',
  args: { value: 'dashboard', title: undefined },
};

export const LongProjectName: Story = {
  args: { title: 'Dental Arch Set – Surgical Guides, Batch 14 (Form 4B, 50 µm, Surgical Guide Resin)' },
};

export const Minimal: Story = {
  name: 'Without actions or account',
  args: { actions: undefined, user: undefined },
};

export const States: Story = {
  globals: { surface: 'inverse' },
  parameters: { layout: 'centered', controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'Project title', render: (p) => <ProjectTitle title="Mini Chassis Kit" {...p} /> },
        { label: 'Account chip', render: (p) => <AccountChip user={user} {...p} /> },
      ]}
    />
  ),
};
