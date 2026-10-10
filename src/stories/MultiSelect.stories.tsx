import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { MultiSelect, type MultiSelectOption } from '../components/MultiSelect/MultiSelect';
import { StateMatrix } from './helpers/StateMatrix';

const MATERIALS: MultiSelectOption[] = [
  { value: 'grey-v5', label: 'Grey V5' },
  { value: 'clear-v5', label: 'Clear V5' },
  { value: 'tough-2000', label: 'Tough 2000' },
  { value: 'rigid-10k', label: 'Rigid 10K' },
  { value: 'flexible-80a', label: 'Flexible 80A' },
  { value: 'high-temp', label: 'High Temp' },
  { value: 'alumina-4n', label: 'Alumina 4N V1' },
  { value: 'castable-wax', label: 'Castable Wax 40', disabled: true },
];

const PRINTERS: MultiSelectOption[] = [
  { value: 'form-4', label: 'Form 4' },
  { value: 'form-4l', label: 'Form 4L' },
  { value: 'form-3b', label: 'Form 3B+' },
  { value: 'fuse-1', label: 'Fuse 1+ 30W', disabled: true },
];

const meta = {
  title: 'Components/Inputs/MultiSelect',
  component: MultiSelect,
  tags: ['expanded'],
  args: {
    label: 'Materials',
    value: ['grey-v5', 'tough-2000'],
    options: MATERIALS,
    placeholder: 'Any material',
    searchable: true,
    collapseAfter: 2,
    size: 'sm',
    disabled: false,
    invalid: false,
    fullWidth: false,
    onChange: fn(),
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    value: { control: 'object' },
    options: { control: 'object' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Select-styled trigger for picking several options, shown as removable accent chips until `collapseAfter`, then as "N selected". Opens a `Popover` listbox with checkboxes, an optional filter, and Select all / Clear. Uses the field tokens (`--component-field-*`, `--color-border-*`) and `--color-bg-accent-soft` for chips.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs<{ value: string[] }>();
    return (
      <div style={{ minHeight: 'calc(var(--size-control-md) * 12)' }}>
        <MultiSelect
          {...args}
          value={value}
          onChange={(v) => {
            update({ value: v });
            args.onChange(v);
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof MultiSelect>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Empty: Story = { args: { value: [] } };

export const Collapsed: Story = {
  name: 'Collapsed count',
  args: { value: ['grey-v5', 'clear-v5', 'rigid-10k', 'high-temp'] },
};

export const NotSearchable: Story = {
  name: 'Without search',
  args: { label: 'Printers', options: PRINTERS, value: ['form-4'], placeholder: 'All printers', searchable: false },
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="sb-stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <MultiSelect key={size} {...args} size={size} value={['grey-v5', 'tough-2000']} onChange={() => {}} />
      ))}
    </div>
  ),
};

export const Invalid: Story = { args: { invalid: true, value: [], placeholder: 'Choose at least one material' } };

export const FullWidth: Story = {
  name: 'Full width in panel',
  args: { fullWidth: true },
  decorators: [
    (S) => (
      <div className="sb-panel-demo">
        <S />
      </div>
    ),
  ],
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'empty', render: (p) => <MultiSelect {...args} value={[]} onChange={() => {}} {...p} /> },
        { label: 'chips', render: (p) => <MultiSelect {...args} value={['grey-v5', 'tough-2000']} onChange={() => {}} {...p} /> },
        { label: 'collapsed', render: (p) => <MultiSelect {...args} value={['grey-v5', 'clear-v5', 'rigid-10k']} onChange={() => {}} {...p} /> },
      ]}
    />
  ),
};
