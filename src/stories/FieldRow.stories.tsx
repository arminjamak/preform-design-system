import type { Meta, StoryObj } from '@storybook/react-vite';
import { FieldRow, NumberField, Select, TextField, Toggle } from '../components';

const meta = {
  title: 'Components/FieldRow',
  component: FieldRow,
  args: { label: 'Layer thickness', info: 'Height of each printed layer', layout: 'inline', children: <NumberField label="Layer thickness" value={0.05} decimals={3} step={0.025} unit="mm" onChange={() => {}} /> },
  argTypes: { layout: { control: 'inline-radio', options: ['inline', 'stacked'] }, children: { control: false } },
  decorators: [(S) => <div className="sb-panel-demo"><S /></div>],
} satisfies Meta<typeof FieldRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Form: Story = {
  render: () => (
    <div className="sb-stack" style={{ alignItems: 'stretch', gap: 0 }}>
      <FieldRow label="Material"><Select label="Material" value="Clear V4" options={['Clear V4', 'Tough 2000']} onChange={() => {}} /></FieldRow>
      <FieldRow label="Density" info="Supports per area"><NumberField label="Density" value={1} onChange={() => {}} /></FieldRow>
      <FieldRow label="Raft"><Toggle label="Raft" checked onChange={() => {}} /></FieldRow>
      <FieldRow label="Label text" layout="stacked" hint="Printed on the raft"><TextField label="Label text" value="MCK-01" onChange={() => {}} fullWidth /></FieldRow>
    </div>
  ),
};
export const WithError: Story = { args: { layout: 'stacked', error: 'Must be between 0.025 and 0.3 mm' } };
