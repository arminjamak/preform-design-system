import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { BoxIcon, ComponentIcon, CopyIcon, EyeIcon, EyeOffIcon, GroupIcon, LayersIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { TreeView, type TreeNode } from '../components/TreeView/TreeView';
import { IconButton } from '../components/IconButton/IconButton';
import { Menu } from '../components/Menu/Menu';
import { StateMatrix } from './helpers/StateMatrix';

const model = <BoxIcon strokeWidth={2.2} />;
const part = <ComponentIcon strokeWidth={2.2} />;

const project: TreeNode[] = [
  {
    id: 'platform',
    label: 'Build platform',
    meta: 'Form 4',
    icon: <LayersIcon strokeWidth={2.2} />,
    children: [
      {
        id: 'group-chassis',
        label: 'Chassis assembly',
        meta: '2 models',
        icon: <GroupIcon strokeWidth={2.2} />,
        children: [
          {
            id: 'mini-chassis',
            label: 'Mini Chassis Kit',
            meta: '3 parts',
            icon: model,
            children: [
              { id: 'chassis-base', label: 'Chassis base', icon: part },
              { id: 'motor-mount', label: 'Motor mount', icon: part },
              { id: 'wheel-hub', label: 'Wheel hub ×4', icon: part },
            ],
          },
          { id: 'bracket', label: 'Bracket_v2', icon: model },
        ],
      },
      {
        id: 'dental',
        label: 'Dental arch (upper)',
        icon: model,
        children: [
          { id: 'arch', label: 'Arch body', icon: part },
          { id: 'base-tag', label: 'Base tag', icon: part },
        ],
      },
      {
        id: 'cube',
        label: 'Calibration cube',
        meta: 'Hidden',
        icon: model,
        muted: true,
      },
      {
        id: 'locked',
        label: 'Reference scan (read-only)',
        icon: model,
        disabled: true,
      },
    ],
  },
];

const rowActions = (node: TreeNode) =>
  node.id === 'platform' ? null : (
    <>
      <IconButton size="xs" label={node.muted ? `Show ${node.label}` : `Hide ${node.label}`} icon={node.muted ? <EyeOffIcon strokeWidth={2.2} /> : <EyeIcon strokeWidth={2.2} />} />
      <Menu
        label={`Actions for ${node.label}`}
        buttonSize="xs"
        items={[
          {
            label: 'Rename',
            onSelect: fn(),
            icon: <PencilIcon strokeWidth={2.2} />,
          },
          {
            label: 'Duplicate',
            onSelect: fn(),
            icon: <CopyIcon strokeWidth={2.2} />,
            shortcut: '⌘D',
          },
          { type: 'separator' },
          {
            label: 'Delete',
            onSelect: fn(),
            icon: <Trash2Icon strokeWidth={2.2} />,
            danger: true,
          },
        ]}
      />
    </>
  );

const meta = {
  title: 'Components/Data Display/TreeView',
  component: TreeView,
  tags: ['expanded'],
  args: {
    label: 'Project',
    nodes: project,
    expanded: ['platform', 'group-chassis', 'mini-chassis'],
    selectedId: 'motor-mount',
    checkable: false,
    checked: ['chassis-base', 'motor-mount', 'wheel-hub', 'bracket'],
    onExpandedChange: fn(),
    onSelect: fn(),
    onCheckedChange: fn(),
  },
  argTypes: {
    nodes: { control: 'object' },
    expanded: { control: 'object' },
    checked: { control: 'object' },
    selectedId: { control: 'text' },
    renderActions: { control: false },
    'data-state': {
      control: 'inline-radio',
      options: [undefined, 'hover', 'focus', 'active'],
      name: 'forced state',
    },
  },
  decorators: [
    (S) => (
      <div
        className="sb-panel-demo"
        style={{
          background: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-1)',
        }}
      >
        <S />
      </div>
    ),
  ],
  render: function Render(args) {
    const [{ expanded, selectedId, checked }, update] = useArgs();
    return (
      <TreeView
        {...args}
        expanded={expanded}
        selectedId={selectedId}
        checked={checked}
        onExpandedChange={(v) => {
          update({ expanded: v });
          args.onExpandedChange?.(v);
        }}
        onSelect={(id, node) => {
          update({ selectedId: id });
          args.onSelect?.(id, node);
        }}
        onCheckedChange={(v) => {
          update({ checked: v });
          args.onCheckedChange?.(v);
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'Project tree for the PreForm scene: Build platform → groups → models → parts. WAI-ARIA `tree` with `treeitem`, `aria-expanded`, `aria-level` and roving focus: Up/Down move, Right expands or enters, Left collapses or goes to the parent, Home/End jump, Enter selects, Space selects or (in checkbox mode) toggles. Indentation is `--space-4` per level; the selected row uses `--color-bg-accent-selected` like `ListItem`. Expanded, selected and checked are controlled, with uncontrolled fallbacks.',
      },
    },
  },
} satisfies Meta<typeof TreeView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithActions: Story = {
  name: 'Trailing actions',
  args: { renderActions: rowActions },
};

export const Checkboxes: Story = {
  name: 'Checkbox mode',
  args: { checkable: true, label: 'Models to export' },
};

export const Uncontrolled: Story = {
  parameters: { controls: { disable: true } },
  render: () => <TreeView label="Project" nodes={project} defaultExpanded={['platform']} />,
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  decorators: [],
  render: () => (
    <StateMatrix
      render={(p) => (
        <div
          style={{
            width: 'var(--size-field-lg)',
            background: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <TreeView
            label="Models"
            nodes={[
              {
                id: 'm',
                label: 'Mini Chassis Kit',
                icon: model,
                disabled: p.disabled,
                children: [{ id: 'p', label: 'Motor mount', icon: part }],
              },
            ]}
            expanded={[]}
            data-state={p['data-state']}
          />
        </div>
      )}
    />
  ),
};
