import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { Button, ConfirmDialog } from '../components';

const meta = {
  title: 'Components/Overlays/ConfirmDialog',
  component: ConfirmDialog,
  args: { open: true, onConfirm: fn(), onCancel: fn(), title: 'Unsaved changes', message: 'Your edits to this profile will be lost unless you save them.', confirmLabel: 'Save', secondaryLabel: 'Discard', cancelLabel: 'Keep Editing', tone: 'default', inline: true },
  argTypes: { tone: { control: 'inline-radio', options: ['default', 'danger'] } },
  parameters: { layout: 'fullscreen' },
  render: function Render(args) {
    const [{ open }, update] = useArgs();
    const close = () => update({ open: false });
    return (
      <div style={{ minHeight: 'var(--size-layout-panel)', display: 'grid', placeItems: 'center' }}>
        {!open && <Button variant="primary" onClick={() => update({ open: true })}>Open dialog</Button>}
        <ConfirmDialog {...args} open={open} onConfirm={close} onCancel={close} onSecondary={close} />
      </div>
    );
  },
} satisfies Meta<typeof ConfirmDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Danger: Story = { args: { tone: 'danger', title: 'Delete profile?', message: 'This removes "Fine detail" permanently.', confirmLabel: 'Delete', secondaryLabel: undefined, cancelLabel: 'Cancel' } };
