import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stepper } from '../components';

const meta = {
  title: 'Components/Navigation/Stepper',
  component: Stepper,
  args: {
    orientation: 'vertical',
    steps: [
      { id: 'orient', label: 'Auto-orient models', status: 'done' },
      { id: 'support', label: 'Generate supports', status: 'active' },
      { id: 'layout', label: 'Lay out on build platform', status: 'pending' },
    ],
  },
  argTypes: { orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] } },
} satisfies Meta<typeof Stepper>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WithError: Story = { args: { steps: [{ id: 'a', label: 'Auto-orient models', status: 'done' }, { id: 'b', label: 'Generate supports', status: 'error' }, { id: 'c', label: 'Lay out on build platform', status: 'pending' }] } };
