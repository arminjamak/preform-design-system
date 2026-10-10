import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { FilterBuilder, type FilterBuilderField, type FilterBuilderGroup } from '../components/FilterBuilder/FilterBuilder';
import { StateMatrix } from './helpers/StateMatrix';

const fields: FilterBuilderField[] = [
  { id: 'material', label: 'Material', type: 'enum', options: ['Grey V5', 'Clear V5', 'Tough 2000', 'Rigid 10K', 'Dental LT Clear V2', 'Castable Wax 40', 'Elastic 50A'] },
  { id: 'printer', label: 'Printer', type: 'enum', options: ['Form 4 · Bench 1', 'Form 4 · Bench 2', 'Form 4B · Dental lab', 'Form 4L · Bay 3'] },
  { id: 'layer', label: 'Layer height', type: 'number', unit: 'mm', placeholder: '0.050' },
  {
    id: 'status',
    label: 'Status',
    type: 'enum',
    options: [
      { value: 'prepare', label: 'Prepare' },
      { value: 'queued', label: 'Queued' },
      { value: 'printing', label: 'Printing' },
      { value: 'wash', label: 'Wash & Cure' },
      { value: 'done', label: 'Done' },
    ],
  },
  { id: 'submitted', label: 'Submitted date', type: 'date' },
  { id: 'name', label: 'Job name', type: 'text', placeholder: 'e.g. Bracket' },
];

const value: FilterBuilderGroup = {
  type: 'group',
  id: 'root',
  combinator: 'and',
  children: [
    { type: 'condition', id: 'c1', field: 'material', operator: 'is', value: 'Grey V5' },
    { type: 'condition', id: 'c2', field: 'layer', operator: 'lte', value: '0.05' },
    {
      type: 'group',
      id: 'g1',
      combinator: 'or',
      children: [
        { type: 'condition', id: 'c3', field: 'status', operator: 'is', value: 'printing' },
        { type: 'condition', id: 'c4', field: 'status', operator: 'is', value: 'queued' },
      ],
    },
    { type: 'condition', id: 'c5', field: 'submitted', operator: 'after', value: '2026-10-01' },
  ],
};

const meta = {
  title: 'Components/Interaction/FilterBuilder',
  component: FilterBuilder,
  tags: ['expanded'],
  args: {
    label: 'Print job filters',
    fields,
    value,
    onChange: fn(),
    allowGroups: true,
    showSummary: true,
    summaryEmptyLabel: 'Showing all 48 print jobs',
    emptyLabel: 'No conditions yet. Add one to narrow the job queue.',
    disabled: false,
  },
  argTypes: {
    fields: { control: 'object' },
    value: { control: 'object' },
    emptyLabel: { control: 'text' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Condition builder for the job queue and dashboard: field → operator → value rows, where operators and the value input follow the field type (text, number with unit, enum, date). Each group combines with an AND/OR toggle, the root allows one level of nested groups, and a chip summarises the result in plain words. Built from `Select`, `TextField`, `Segmented` and ghost `Button`s.',
      },
    },
  },
  decorators: [(S) => <div style={{ width: 'calc(var(--size-layout-dialog-lg) + var(--space-16))', maxWidth: '100%' }}><S /></div>],
  render: function Render(args) {
    const [{ value: current }, update] = useArgs<{ value: FilterBuilderGroup }>();
    return (
      <FilterBuilder
        {...args}
        value={current}
        onChange={(v) => {
          args.onChange(v);
          update({ value: v });
        }}
      />
    );
  },
} satisfies Meta<typeof FilterBuilder>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Empty: Story = { args: { value: { type: 'group', id: 'root', combinator: 'and', children: [] } } };

/** Flat list, no nested groups: Status and Material only. */
export const FlatAnyOf: Story = {
  args: {
    allowGroups: false,
    value: {
      type: 'group',
      id: 'root',
      combinator: 'or',
      children: [
        { type: 'condition', id: 'f1', field: 'printer', operator: 'is', value: 'Form 4B · Dental lab' },
        { type: 'condition', id: 'f2', field: 'material', operator: 'is', value: 'Dental LT Clear V2' },
        { type: 'condition', id: 'f3', field: 'name', operator: 'contains', value: 'crown' },
      ],
    },
  },
};

/** One row per field type, showing the operator set and value input each one gets. */
export const FieldTypes: Story = {
  args: {
    value: {
      type: 'group',
      id: 'root',
      combinator: 'and',
      children: [
        { type: 'condition', id: 't1', field: 'name', operator: 'startsWith', value: 'Bracket' },
        { type: 'condition', id: 't2', field: 'layer', operator: 'gte', value: '0.1' },
        { type: 'condition', id: 't3', field: 'printer', operator: 'isNot', value: 'Form 4L · Bay 3' },
        { type: 'condition', id: 't4', field: 'submitted', operator: 'before', value: '2026-10-08' },
        { type: 'condition', id: 't5', field: 'name', operator: 'isEmpty', value: '' },
      ],
    },
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  decorators: [],
  render: (args) => (
    <StateMatrix
      render={({ disabled, ...p }) => (
        <div style={{ width: 'var(--size-layout-dialog-sm)' }}>
          <FilterBuilder
            {...args}
            showSummary={false}
            allowGroups={false}
            value={{ type: 'group', id: 'root', combinator: 'and', children: [{ type: 'condition', id: 's1', field: 'material', operator: 'is', value: 'Tough 2000' }] }}
            onChange={() => {}}
            disabled={disabled}
            {...p}
          />
        </div>
      )}
    />
  ),
};
