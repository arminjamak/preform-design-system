import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { PermissionMatrix, type PermissionGroup, type PermissionLocks, type PermissionRole, type PermissionValue } from '../components/PermissionMatrix/PermissionMatrix';
import { StateMatrix } from './helpers/StateMatrix';

const roles: PermissionRole[] = [
  { id: 'owner', label: 'Owner', description: 'Full control of the workspace' },
  { id: 'admin', label: 'Admin', description: 'Manages printers, materials and people' },
  { id: 'operator', label: 'Operator', description: 'Runs prints and swaps tanks' },
  { id: 'viewer', label: 'Viewer', description: 'Read-only access to fleet status' },
];

const groups: PermissionGroup[] = [
  {
    id: 'printers',
    label: 'Printers',
    permissions: [
      { id: 'printers.view', label: 'View printers and status' },
      { id: 'printers.print', label: 'Start and cancel prints' },
      { id: 'printers.settings', label: 'Change printer settings', description: 'Network, calibration offsets, tank heater' },
      { id: 'printers.firmware', label: 'Install firmware updates' },
    ],
  },
  {
    id: 'materials',
    label: 'Materials',
    permissions: [
      { id: 'materials.view', label: 'View resin and tank inventory' },
      { id: 'materials.edit', label: 'Edit materials and tanks', description: 'Assign cartridges and log tank swaps' },
      { id: 'materials.order', label: 'Order resin' },
    ],
  },
  {
    id: 'queue',
    label: 'Print queue',
    permissions: [
      { id: 'queue.view', label: 'View the print queue' },
      { id: 'queue.add', label: 'Add jobs to the queue' },
      { id: 'queue.manage', label: 'Reorder and cancel others’ jobs' },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    permissions: [
      { id: 'billing.view', label: 'View invoices' },
      { id: 'billing.manage', label: 'Change plan and payment method' },
    ],
  },
];

const allIds = groups.flatMap((g) => g.permissions.map((p) => p.id));

const saved: PermissionValue = {
  owner: allIds,
  admin: allIds.filter((id) => id !== 'billing.manage'),
  operator: ['printers.view', 'printers.print', 'materials.view', 'materials.edit', 'queue.view', 'queue.add'],
  viewer: ['printers.view', 'materials.view', 'queue.view'],
};

const edited: PermissionValue = {
  ...saved,
  operator: [...saved.operator, 'queue.manage', 'printers.settings'],
  viewer: [...saved.viewer, 'billing.view'],
};

const inherited = 'Inherited from Viewer. Change it on the Viewer role.';
const locked: PermissionLocks = {
  owner: Object.fromEntries(allIds.map((id) => [id, 'Owners always have full access.'])),
  admin: { 'billing.manage': 'Only the workspace owner can change the plan.' },
  operator: { 'printers.view': inherited, 'materials.view': inherited, 'queue.view': inherited },
  viewer: { 'billing.manage': 'Viewers can never change billing.' },
};

const meta = {
  title: 'Components/Specialized/PermissionMatrix',
  component: PermissionMatrix,
  tags: ['expanded'],
  args: {
    roles,
    groups,
    value: edited,
    savedValue: saved,
    locked,
    readOnly: false,
    hideSelectAll: false,
    label: 'Workspace roles · Formlabs Dental Lab',
    onChange: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    readOnly: { control: 'boolean' },
    hideSelectAll: { control: 'boolean' },
    value: { control: 'object' },
    savedValue: { control: 'object' },
    locked: { control: 'object' },
    roles: { control: 'object' },
    groups: { control: 'object' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs<{ value: PermissionValue }>();
    return (
      <PermissionMatrix
        {...args}
        value={value}
        onChange={(v) => {
          args.onChange?.(v);
          update({ value: v });
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'Roles × permissions grid for PreForm cloud workspaces. Group header rows split Printers, Materials, Print queue and Billing; the header row and first column are sticky. Locked or inherited cells are disabled with a lock and tooltip, cells that differ from `savedValue` get a `--color-status-warning-soft` wash and left rule. Arrow keys move between cells; each checkbox is labelled "Role: Permission".',
      },
    },
  },
} satisfies Meta<typeof PermissionMatrix>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Saved: Story = {
  name: 'No unsaved changes',
  args: { value: saved },
};

export const ReadOnly: Story = {
  args: { readOnly: true, value: saved, label: 'Your access · Operator' },
};

export const WithoutLocks: Story = {
  name: 'Without locks or select-all',
  args: { locked: undefined, hideSelectAll: true, savedValue: undefined, value: saved },
};

export const SingleGroup: Story = {
  name: 'Single resource (Print queue)',
  args: { groups: groups.filter((g) => g.id === 'queue'), label: 'Print queue access' },
};

const mini: PermissionGroup[] = [groups[2]];
const miniRoles = roles.slice(2);

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={() => null}
      rows={[
        {
          label: 'editable',
          render: (p) => <PermissionMatrix roles={miniRoles} groups={mini} value={saved} onChange={() => {}} hideSelectAll readOnly={p.disabled} label="Print queue" data-state={p['data-state']} />,
        },
        {
          label: 'unsaved',
          render: (p) => (
            <PermissionMatrix
              roles={miniRoles}
              groups={mini}
              value={edited}
              savedValue={saved}
              onChange={() => {}}
              hideSelectAll
              readOnly={p.disabled}
              label="Print queue"
              data-state={p['data-state']}
            />
          ),
        },
      ]}
    />
  ),
};
