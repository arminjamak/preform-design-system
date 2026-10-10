import type { Meta, StoryObj } from '@storybook/react-vite';
import { Clock3Icon, DropletsIcon, LayersIcon } from 'lucide-react';
import { Button, KeyValueList } from '../components';

const meta = {
  title: 'Components/Data Display/KeyValueList',
  component: KeyValueList,
  args: {
    size: 'sm',
    divided: false,
    rows: [
      { key: 'Material', value: 'Alumina 4N V1' },
      { key: 'Layer Thickness', value: '0.050 mm' },
      { key: 'Print Settings', value: 'Default' },
    ],
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
  decorators: [(S) => <div className="sb-panel-demo"><S /></div>],
} satisfies Meta<typeof KeyValueList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Summary: Story = {
  args: {
    size: 'md',
    rows: [
      { key: 'Time Estimate', value: '1 hr 12 min', icon: <Clock3Icon strokeWidth={2.4} /> },
      { key: 'Volume', value: '0.14 mL', icon: <DropletsIcon strokeWidth={2.4} /> },
      { key: 'Model(s)', value: '< 0.10 mL', indent: true },
      { key: 'Supports', value: '0.03 mL', indent: true },
      { key: 'Total Print Cost', value: <Button variant="link">Enter Info</Button> },
      { key: 'Layers', value: '129', icon: <LayersIcon strokeWidth={2.4} /> },
    ],
  },
};
