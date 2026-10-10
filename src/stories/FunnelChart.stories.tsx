import type { Meta, StoryObj } from '@storybook/react-vite';
import { FunnelChart, type FunnelStage } from '../components/FunnelChart/FunnelChart';

const printFunnel: FunnelStage[] = [
  { label: 'Uploaded', value: 1284 },
  { label: 'Prepared', value: 1102 },
  { label: 'Queued', value: 968 },
  { label: 'Printed', value: 874 },
  { label: 'Post-processed', value: 812 },
];

const count = (v: number) => v.toLocaleString('en-US');

const meta = {
  title: 'Components/Charts/FunnelChart',
  component: FunnelChart,
  tags: ['expanded'],
  args: {
    title: 'Print funnel',
    subtitle: 'Jobs in September · Somerville print farm',
    stages: printFunnel,
    orientation: 'vertical',
    showConversion: true,
    showDropOff: true,
    valueFormat: count,
  },
  argTypes: {
    stages: { control: 'object' },
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    size: { control: { type: 'range', min: 16, max: 200, step: 4 } },
    valueFormat: { control: false },
  },
  decorators: [
    (S) => (
      <div style={{ width: 'calc(var(--size-layout-dialog-lg) * 1.2)', maxWidth: '100%' }}>
        <S />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Stage-to-stage conversion chart, e.g. the PreForm job funnel Uploaded → Prepared → Queued → Printed → Post-processed. Bars are proportional to value in `--color-chart-series-1`, joined by `--color-chart-track` connectors that carry the conversion % and the drop-off count. Arrow keys step through stages; the tooltip shows conversion from the previous and the first stage.',
      },
    },
  },
} satisfies Meta<typeof FunnelChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
};

export const BarsOnly: Story = {
  args: { showConversion: false, showDropOff: false },
};

export const ConversionOnly: Story = {
  args: { orientation: 'horizontal', showDropOff: false, size: 120 },
};

export const Empty: Story = {
  args: { stages: [], subtitle: 'No jobs uploaded yet' },
};
