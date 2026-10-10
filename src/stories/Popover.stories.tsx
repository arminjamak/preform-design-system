import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { ChevronDownIcon } from 'lucide-react';
import { Button, Popover } from '../components';

const meta = {
  title: 'Components/Overlays/Popover',
  component: Popover,
  args: { open: true, onClose: fn(), placement: 'bottom', align: 'start', padded: true, width: 240, trigger: null, children: null },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'bottom'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    trigger: { control: false },
    children: { control: false },
  },
  decorators: [(S) => <div style={{ padding: 'var(--space-24) var(--space-24)' }}><S /></div>],
  render: function Render(args) {
    const [{ open }, update] = useArgs();
    return (
      <Popover
        {...args}
        open={open}
        onClose={() => update({ open: false })}
        trigger={
          <Button variant="outline" iconEnd={<ChevronDownIcon strokeWidth={2.4} />} onClick={() => update({ open: !open })} aria-expanded={open}>
            Support profile
          </Button>
        }
      >
        <p className="pf-text-body-sm" style={{ color: 'var(--color-fg-muted)' }}>
          Any content: an icon picker, a profile list, a small form.
        </p>
      </Popover>
    );
  },
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Above: Story = { args: { placement: 'top', align: 'end' } };
