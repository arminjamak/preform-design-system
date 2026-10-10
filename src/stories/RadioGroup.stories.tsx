import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { RadioGroup, type RadioOption } from '../components/RadioGroup/RadioGroup';
import { StateMatrix } from './helpers/StateMatrix';

const LAYER_HEIGHTS: RadioOption[] = [
  { value: '25', label: '25 µm', description: 'Finest detail for dental and jewellery. Slowest.' },
  { value: '50', label: '50 µm', description: 'Balanced detail and speed. Recommended for most parts.' },
  { value: '100', label: '100 µm', description: 'Fast drafts and large prototypes.' },
  { value: '160', label: '160 µm', description: 'Not available for Grey V5 resin.', disabled: true },
];

const ORIENTATION: RadioOption[] = [
  { value: 'auto', label: 'Auto-orient' },
  { value: 'flat', label: 'Flat on build plate' },
  { value: 'keep', label: 'Keep current' },
];

const meta = {
  title: 'Components/Inputs/RadioGroup',
  component: RadioGroup,
  tags: ['expanded'],
  args: {
    label: 'Layer height',
    hideLabel: false,
    value: '50',
    onChange: fn(),
    options: LAYER_HEIGHTS,
    orientation: 'vertical',
    size: 'sm',
    disabled: false,
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    value: { control: 'select', options: ['25', '50', '100', '160', 'auto', 'flat', 'keep'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state (1st option)' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Single-choice list with circular markers that match Checkbox (`--component-checkbox-size`, `--color-accent-tone-blue`). One tab stop with roving tabindex; arrow keys move and select, Home/End jump, disabled options are skipped. Used for print settings such as layer height.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <RadioGroup {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Horizontal: Story = {
  args: { label: 'Orientation', options: ORIENTATION, value: 'auto', orientation: 'horizontal' },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-row">
      {(['sm', 'md'] as const).map((size) => (
        <RadioGroup key={size} {...args} size={size} label={`Layer height (${size})`} onChange={() => {}} />
      ))}
    </div>
  ),
};

export const WithoutDescriptions: Story = {
  args: {
    label: 'Support density',
    value: 'medium',
    options: [
      { value: 'light', label: 'Light' },
      { value: 'medium', label: 'Medium' },
      { value: 'heavy', label: 'Heavy' },
    ],
  },
};

export const Disabled: Story = { args: { disabled: true } };

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        {
          label: 'unselected',
          render: (p) => <RadioGroup {...args} hideLabel options={ORIENTATION.slice(0, 1)} value={undefined} onChange={() => {}} {...p} />,
        },
        {
          label: 'selected',
          render: (p) => <RadioGroup {...args} hideLabel options={ORIENTATION.slice(0, 1)} value="auto" onChange={() => {}} {...p} />,
        },
      ]}
    />
  ),
};
