import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Badge, Button, FieldRow, NumberField, PanelShell, SectionTitle, Segmented, Toggle } from '../components';

const meta = {
  title: 'Components/Layout/PanelShell',
  component: PanelShell,
  args: { title: 'Supports', onClose: fn(), children: null },
  argTypes: { children: { control: false }, footer: { control: false }, badge: { control: 'boolean', mapping: { true: <Badge tone="accent" variant="soft">Beta</Badge>, false: undefined } } },
  render: (args) => (
    <PanelShell
      {...args}
      footer={
        <>
          <Button variant="outline" fullWidth>Clear</Button>
          <Button variant="primary" fullWidth>Generate Supports</Button>
        </>
      }
    >
      <SectionTitle info="Choose how supports are placed">Placement</SectionTitle>
      <Segmented label="Placement" value="auto" options={[{ value: 'auto', label: 'Auto' }, { value: 'manual', label: 'Manual' }]} onChange={() => {}} fullWidth />
      <SectionTitle>Touchpoints</SectionTitle>
      <FieldRow label="Size" info="Diameter where a support meets the model"><NumberField label="Size" value={0.6} unit="mm" onChange={() => {}} /></FieldRow>
      <FieldRow label="Density"><NumberField label="Density" value={1} decimals={2} step={0.1} onChange={() => {}} /></FieldRow>
      <FieldRow label="Internal supports"><Toggle label="Internal supports" checked onChange={() => {}} /></FieldRow>
    </PanelShell>
  ),
} satisfies Meta<typeof PanelShell>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WithBadge: Story = { args: { badge: <Badge tone="accent" variant="soft">Beta</Badge>, title: 'Protect' } };
