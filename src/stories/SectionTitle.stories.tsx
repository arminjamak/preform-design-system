import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, SectionTitle } from '../components';

const meta = {
  title: 'Components/Layout/SectionTitle',
  component: SectionTitle,
  args: { children: 'Touchpoints', info: 'Where supports meet the model', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] }, action: { control: 'boolean', mapping: { true: <Button variant="link">Reset</Button>, false: undefined } } },
  decorators: [(S) => <div className="sb-panel-demo"><S /></div>],
} satisfies Meta<typeof SectionTitle>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WithAction: Story = { args: { action: <Button variant="link">Reset</Button> } };
