import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { TextArea } from '../components/TextArea/TextArea';
import { StateMatrix } from './helpers/StateMatrix';

const NOTE = 'Print overnight on the Form 4. Grey V5 resin, 50 µm layers. Check the tank for cured flakes before starting.';

const meta = {
  title: 'Components/Inputs/TextArea',
  component: TextArea,
  tags: ['expanded'],
  args: {
    label: 'Job notes',
    hideLabel: false,
    value: NOTE,
    onChange: fn(),
    placeholder: 'Add a note for whoever unloads this print',
    rows: 3,
    resize: 'vertical',
    maxLength: 280,
    showCount: true,
    hint: 'Shown in the print queue and on the printer screen.',
    size: 'sm',
    invalid: false,
    disabled: false,
    fullWidth: false,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    resize: { control: 'inline-radio', options: ['vertical', 'none'] },
    rows: { control: { type: 'number', min: 1, max: 12 } },
    maxLength: { control: { type: 'number', min: 1 } },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Multi-line text input for job notes and print descriptions. Shares TextField’s border, `--color-border-focus` focus border and `--color-focus-ring-soft` halo; optional character counter turns `--color-status-danger` at the limit.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <TextArea {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
} satisfies Meta<typeof TextArea>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <TextArea key={size} {...args} size={size} label={`Job notes (${size})`} onChange={() => {}} />
      ))}
    </div>
  ),
};

export const Resize: Story = {
  render: (args) => (
    <div className="sb-row">
      <TextArea {...args} resize="vertical" label="Resizable (vertical)" onChange={() => {}} />
      <TextArea {...args} resize="none" label="Fixed height" onChange={() => {}} />
    </div>
  ),
};

export const CharacterCount: Story = {
  args: {
    label: 'Material description',
    value: 'Tough 2000 for snap fits and rugged prototypes. Stiff, strong, low creep.',
    maxLength: 80,
    showCount: true,
    hint: undefined,
  },
};

export const Invalid: Story = {
  args: { label: 'Reason for cancelling', value: '', invalid: true, hint: 'Add a reason so the queue history stays useful.', showCount: false },
};

export const InPanel: Story = {
  render: (args) => (
    <div className="sb-panel-demo">
      <TextArea {...args} fullWidth label="Job notes" onChange={() => {}} />
    </div>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'filled', render: (p) => <TextArea {...args} hint={undefined} showCount={false} rows={2} hideLabel onChange={() => {}} {...p} /> },
        { label: 'empty', render: (p) => <TextArea {...args} value="" hint={undefined} showCount={false} rows={2} hideLabel onChange={() => {}} {...p} /> },
        { label: 'invalid', render: (p) => <TextArea {...args} invalid hint={undefined} showCount={false} rows={2} hideLabel onChange={() => {}} {...p} /> },
      ]}
    />
  ),
};
