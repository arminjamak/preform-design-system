import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import {
  BookOpenIcon,
  BoxIcon,
  DropletIcon,
  FolderIcon,
  HistoryIcon,
  HomeIcon,
  LifeBuoyIcon,
  ListOrderedIcon,
  MenuIcon,
  PrinterIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from 'lucide-react';
import { SidebarNav, SidebarNavButton, type SidebarNavSection } from '../components/SidebarNav/SidebarNav';
import { Avatar } from '../components/Avatar/Avatar';
import { Button } from '../components/Button/Button';
import { IconButton } from '../components/IconButton/IconButton';
import { StateMatrix } from './helpers/StateMatrix';

const sections: SidebarNavSection[] = [
  {
    items: [
      { id: 'overview', label: 'Overview', icon: <HomeIcon strokeWidth={2} /> },
      { id: 'queue', label: 'Print queue', icon: <ListOrderedIcon strokeWidth={2} />, count: 3 },
    ],
  },
  {
    title: 'Fleet',
    items: [
      {
        id: 'printers',
        label: 'Printers',
        icon: <PrinterIcon strokeWidth={2} />,
        children: [
          { id: 'printer-form4-studio', label: 'Form 4 · Studio A' },
          { id: 'printer-form4l-lab', label: 'Form 4L · Lab', count: 1 },
          { id: 'printer-fuse', label: 'Fuse 1+ 30W', disabled: true },
        ],
      },
      { id: 'tanks', label: 'Resin tanks', icon: <BoxIcon strokeWidth={2} />, count: 2 },
      { id: 'materials', label: 'Materials', icon: <DropletIcon strokeWidth={2} /> },
    ],
  },
  {
    title: 'Library',
    items: [
      {
        id: 'projects',
        label: 'Projects',
        icon: <FolderIcon strokeWidth={2} />,
        children: [
          { id: 'project-chassis', label: 'Mini Chassis Kit' },
          { id: 'project-dental', label: 'Dental Arch Set' },
          { id: 'project-brackets', label: 'Bracket Variants' },
        ],
      },
      { id: 'history', label: 'Print history', icon: <HistoryIcon strokeWidth={2} /> },
      { id: 'profiles', label: 'Support profiles', icon: <SlidersHorizontalIcon strokeWidth={2} /> },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { id: 'team', label: 'Team members', icon: <UsersIcon strokeWidth={2} /> },
      { id: 'settings', label: 'Settings', icon: <SettingsIcon strokeWidth={2} /> },
      { id: 'help', label: 'Help Center', icon: <LifeBuoyIcon strokeWidth={2} /> },
    ],
  },
];

const ProjectHeader = () => (
  <div className="sb-stack" style={{ alignItems: 'stretch', gap: 'var(--space-2)' }}>
    <span className="pf-text-title-sm">Untitled Project</span>
    <Button variant="outlineAccent" fullWidth>
      New Build
    </Button>
  </div>
);

const AccountFooter = ({ compact }: { compact?: boolean }) => (
  <div className="sb-row" style={{ gap: 'var(--space-2)', flexWrap: 'nowrap', justifyContent: compact ? 'center' : undefined }}>
    <Avatar name="Maya Chen" size="xs" />
    {!compact && <span className="pf-text-label">Maya Chen</span>}
  </div>
);

/** Fixed-height frame so the sidebar has a column to fill; positioned so the drawer can render inside it. */
const Frame = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      position: 'relative',
      display: 'flex',
      width: '100%',
      height: 'calc(var(--size-layout-panel) * 2)',
      overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--color-bg-canvas)',
      boxShadow: 'var(--elevation-card)',
    }}
  >
    {children}
  </div>
);

const meta = {
  title: 'Components/Navigation/SidebarNav',
  component: SidebarNav,
  tags: ['expanded'],
  args: {
    sections,
    value: 'printer-form4l-lab',
    onChange: fn(),
    collapsed: false,
    variant: 'inline',
    open: false,
    onClose: fn(),
    label: 'Dashboard navigation',
    portal: false,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['inline', 'drawer'] },
    value: { control: 'text' },
    header: { control: false },
    footer: { control: false },
    defaultExpanded: { control: 'object' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Sectioned sidebar navigation (Dashboard, printer fleet, project library) with headed sections, count badges, nested collapsible groups and a collapsed icon-only mode with tooltips. `variant="drawer"` turns the same content into the modal Navigation Drawer: a left slide-in over a `--color-bg-overlay` scrim that takes focus, traps Tab, and closes on Escape, scrim click or selection. Rows use the ListItem selected treatment (`--color-bg-accent-selected`) on `--color-bg-surface`. Arrow keys move between rows; Right/Left expand and collapse groups. For a Navigation Rail (icon-over-label tool column), use the existing **ToolRail** component.',
      },
    },
  },
  render: function Render(args) {
    const [{ value, collapsed, open }, update] = useArgs();
    const isDrawer = args.variant === 'drawer';
    return (
      <Frame>
        <SidebarNav
          {...args}
          value={value}
          collapsed={collapsed}
          open={open}
          onChange={(id) => {
            args.onChange(id);
            update({ value: id });
          }}
          onClose={() => {
            args.onClose?.();
            update({ open: false });
          }}
          header={collapsed && !isDrawer ? undefined : <ProjectHeader />}
          footer={<AccountFooter compact={collapsed && !isDrawer} />}
        />
        <div style={{ flex: 1, padding: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          {isDrawer ? (
            <IconButton label="Open navigation" icon={<MenuIcon strokeWidth={2.2} />} variant="floating" size="md" onClick={() => update({ open: true })} />
          ) : (
            <Button variant="outline" onClick={() => update({ collapsed: !collapsed })}>
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </Button>
          )}
          <span className="pf-text-body-sm" style={{ color: 'var(--color-fg-muted)', paddingTop: 'var(--space-1)' }}>
            Current page: {String(value)}
          </span>
        </div>
      </Frame>
    );
  },
} satisfies Meta<typeof SidebarNav>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Collapsed: Story = {
  name: 'Collapsed (icons + tooltips)',
  args: { collapsed: true, value: 'queue' },
};

export const Drawer: Story = {
  name: 'Navigation drawer',
  args: { variant: 'drawer', open: true, value: 'history' },
};

export const WithoutHeadings: Story = {
  args: {
    value: 'support',
    sections: [
      {
        items: [
          { id: 'prepare', label: 'Prepare', icon: <BoxIcon strokeWidth={2} /> },
          { id: 'support', label: 'Supports', icon: <SlidersHorizontalIcon strokeWidth={2} /> },
          { id: 'queue', label: 'Print queue', icon: <ListOrderedIcon strokeWidth={2} />, count: 12 },
          { id: 'guides', label: 'Print settings guide', icon: <BookOpenIcon strokeWidth={2} /> },
        ],
      },
    ],
  },
};

const rowBox = (node: ReactNode) => <div style={{ width: 'var(--size-layout-menu-min)', background: 'var(--color-bg-surface)' }}>{node}</div>;

export const States: Story = {
  parameters: { layout: 'centered', controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'Idle', render: (p) => rowBox(<SidebarNavButton label="Print queue" icon={<ListOrderedIcon strokeWidth={2} />} count={3} {...p} />) },
        { label: 'Selected', render: (p) => rowBox(<SidebarNavButton selected label="Print history" icon={<HistoryIcon strokeWidth={2} />} {...p} />) },
        { label: 'Group', render: (p) => rowBox(<SidebarNavButton expanded={false} childSelected label="Printers" icon={<PrinterIcon strokeWidth={2} />} {...p} />) },
        { label: 'Nested', render: (p) => rowBox(<SidebarNavButton depth={1} label="Form 4 · Studio A" {...p} />) },
        { label: 'Collapsed', render: (p) => <SidebarNavButton collapsed label="Print queue" count={3} icon={<ListOrderedIcon strokeWidth={2} />} {...p} /> },
      ]}
    />
  ),
};
