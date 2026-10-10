import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { Rating } from '../components/Rating/Rating';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Data Display/Rating',
  component: Rating,
  tags: ['expanded'],
  args: {
    label: 'Print quality',
    value: 4,
    max: 5,
    size: 'md',
    readOnly: false,
    disabled: false,
    showValue: false,
    onChange: fn(),
  },
  argTypes: {
    value: { control: { type: 'number', min: 0, max: 5, step: 0.5 } },
    max: { control: { type: 'number', min: 3, max: 10, step: 1 } },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    'data-state': {
      control: 'inline-radio',
      options: [undefined, 'hover', 'focus', 'active'],
      name: 'forced state',
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return (
      <Rating
        {...args}
        value={value}
        onChange={(v) => {
          update({ value: v });
          args.onChange?.(v);
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'Star rating for print-quality feedback and material reviews (lucide `Star`). Filled stars use `--color-status-warning`; empty stars `--color-border-strong`. Interactive ratings are a `slider` (Left/Right or Up/Down by one star, Home = 1, End = max, Backspace clears; click the current star to clear). Display ratings are a labelled image and show half stars.',
      },
    },
  },
} satisfies Meta<typeof Rating>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Display: Story = {
  name: 'Display with half stars',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack">
      <Rating label="Grey V5 surface finish" value={4.5} readOnly showValue />
      <Rating label="Tough 2000 dimensional accuracy" value={3.5} readOnly showValue />
      <Rating label="Clear V5 clarity after post-cure" value={2.3} readOnly showValue />
    </div>
  ),
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Rating key={size} label={`Print quality (${size})`} value={3.5} size={size} readOnly showValue />
      ))}
    </div>
  ),
};

export const ReadOnly: Story = {
  args: { readOnly: true, value: 4.5, showValue: true },
};
export const Disabled: Story = { args: { disabled: true } };

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateMatrix render={(p) => <Rating label="Print quality" value={3} onChange={() => {}} {...p} />} />,
};
