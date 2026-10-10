import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { Button, FieldRow, Modal, Select, TextField } from '../components';

const meta = {
  title: 'Components/Overlays/Modal',
  component: Modal,
  args: { open: true, onRequestClose: fn(), title: 'Save Profile', description: 'Store the current auto support settings as a reusable profile.', size: 'md', inline: true, children: null },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, children: { control: false }, footer: { control: false } },
  parameters: { layout: 'fullscreen' },
  render: function Render(args) {
    const [{ open }, update] = useArgs();
    return (
      <div style={{ minHeight: 'var(--size-layout-panel)', display: 'grid', placeItems: 'center' }}>
        {!open && <Button variant="primary" onClick={() => update({ open: true })}>Open modal</Button>}
        <Modal
          {...args}
          open={open}
          onRequestClose={() => update({ open: false })}
          footer={
            <>
              <Button variant="link" style={{ marginRight: 'auto' }} onClick={() => update({ open: false })}>Cancel</Button>
              <Button variant="primary" onClick={() => update({ open: false })}>Save Profile</Button>
            </>
          }
        >
          <div className="sb-stack" style={{ alignItems: 'stretch' }}>
            <FieldRow label="Name" layout="stacked"><TextField label="Name" value="Fine detail" onChange={() => {}} fullWidth /></FieldRow>
            <FieldRow label="Icon"><Select label="Icon" value="Gear" options={['Gear', 'Dental', 'Jewelry']} onChange={() => {}} /></FieldRow>
          </div>
        </Modal>
      </div>
    );
  },
} satisfies Meta<typeof Modal>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Large: Story = { args: { size: 'lg', title: 'Manage Profiles', description: undefined } };
