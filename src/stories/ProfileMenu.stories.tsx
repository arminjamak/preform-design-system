import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { BoxIcon, FolderIcon, PrinterIcon } from 'lucide-react';
import { ProfileMenu, type ProfileMenuProps } from '../components/ProfileMenu/ProfileMenu';
import type { PresenceStatus } from '../components/PresenceIndicator/PresenceIndicator';
import { StateMatrix } from './helpers/StateMatrix';

const armin = {
  name: 'Armin Jamak',
  email: 'jamakarmin@gmail.com',
  org: 'Print Lab · Mini Chassis Kit',
};

const appBar = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 'var(--space-3)',
  width: 'var(--size-layout-dialog-lg)',
  height: 'var(--size-layout-nav)',
  paddingLeft: 'var(--space-3)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-bg-inverse)',
  color: 'var(--color-fg-on-inverse)',
} as const;

const meta = {
  title: 'Components/Collaboration/ProfileMenu',
  component: ProfileMenu,
  tags: ['expanded'],
  args: {
    user: armin,
    status: 'online',
    onStatusChange: fn(),
    onItemSelect: fn(),
    onSignOut: fn(),
    onThemeChange: fn(),
    onOpenChange: fn(),
    theme: 'light',
    variant: 'light',
    compact: false,
    align: 'end',
    disabled: false,
  },
  argTypes: {
    status: {
      control: 'inline-radio',
      options: ['online', 'away', 'busy', 'offline'],
    },
    variant: { control: 'inline-radio', options: ['light', 'inverse'] },
    theme: { control: 'inline-radio', options: ['light', 'dark'] },
    align: { control: 'inline-radio', options: ['start', 'end'] },
    open: { control: 'boolean' },
    'data-state': {
      control: 'inline-radio',
      options: [undefined, 'hover', 'focus', 'active'],
      name: 'forced state',
    },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Account chip from the PreForm top bar that opens the profile menu: identity header, presence status (menuitemradio), account links, a dark-theme switch (menuitemcheckbox) and Sign out. Arrow keys, Home/End and Escape work inside the menu. Built on `Popover` and `AvatarWithPresence`; colours come from the inverse and surface tokens.',
      },
    },
  },
  decorators: [
    (S, ctx) =>
      ctx.parameters.bare ? (
        <S />
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            minHeight: 'calc(var(--space-24) * 5)',
            width: 'var(--size-layout-dialog-lg)',
          }}
        >
          <S />
        </div>
      ),
  ],
  render: function Render(args) {
    const [{ status, theme, open }, update] = useArgs<ProfileMenuProps>();
    return (
      <ProfileMenu
        {...args}
        status={status}
        theme={theme}
        open={open}
        onStatusChange={(v: PresenceStatus) => {
          args.onStatusChange(v);
          update({ status: v });
        }}
        onThemeChange={(v) => {
          args.onThemeChange?.(v);
          update({ theme: v });
        }}
        onOpenChange={(v) => {
          args.onOpenChange?.(v);
          if (open !== undefined) update({ open: v });
        }}
      />
    );
  },
} satisfies Meta<typeof ProfileMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Open: Story = { args: { open: true, status: 'away' } };

export const InAppBar: Story = {
  name: 'Inverse, in the app bar',
  args: { variant: 'inverse' },
  decorators: [
    (S) => (
      <div style={appBar}>
        <S />
      </div>
    ),
  ],
};

export const Compact: Story = {
  args: { compact: true },
};

export const CompactInverse: Story = {
  args: { compact: true, variant: 'inverse', status: 'busy' },
  decorators: [
    (S) => (
      <div style={{ ...appBar, width: 'auto', paddingInline: 'var(--space-2)' }}>
        <S />
      </div>
    ),
  ],
};

export const CustomItems: Story = {
  args: {
    open: true,
    user: {
      name: 'Mei Chen',
      email: 'mei.chen@printlab.example',
      org: 'Print Lab · Resin R&D',
    },
    items: [
      {
        label: 'My print jobs',
        onSelect: fn(),
        icon: <BoxIcon strokeWidth={2.2} aria-hidden />,
      },
      {
        label: 'Form 4 · Bay 2',
        onSelect: fn(),
        icon: <PrinterIcon strokeWidth={2.2} aria-hidden />,
      },
      {
        label: 'Shared projects',
        onSelect: fn(),
        icon: <FolderIcon strokeWidth={2.2} aria-hidden />,
        shortcut: '⌘P',
      },
    ],
  },
};

export const WithoutThemeRow: Story = {
  args: { open: true, onThemeChange: undefined },
};

export const States: Story = {
  parameters: { controls: { disable: true }, bare: true },
  render: (args) => (
    <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
      <StateMatrix
        render={() => null}
        rows={[
          {
            label: 'Full · light',
            render: (p) => <ProfileMenu {...args} {...p} variant="light" />,
          },
          {
            label: 'Compact · light',
            render: (p) => <ProfileMenu {...args} {...p} variant="light" compact />,
          },
          {
            label: 'Full · inverse',
            render: (p) => (
              <div
                style={{
                  ...appBar,
                  width: 'auto',
                  paddingInline: 'var(--space-1)',
                }}
              >
                <ProfileMenu {...args} {...p} variant="inverse" />
              </div>
            ),
          },
        ]}
      />
    </div>
  ),
};
