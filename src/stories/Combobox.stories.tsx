import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { Combobox, type ComboboxOption } from '../components/Combobox/Combobox';
import { StateMatrix } from './helpers/StateMatrix';

const MATERIALS: ComboboxOption[] = [
  { value: 'grey-v5', label: 'Grey V5', description: 'Standard · 50 µm default layer height' },
  { value: 'clear-v5', label: 'Clear V5', description: 'Standard · polish for optical clarity' },
  { value: 'white-v5', label: 'White V5', description: 'Standard · matte, paintable' },
  { value: 'tough-2000', label: 'Tough 2000', description: 'Engineering · stiff, ABS-like' },
  { value: 'tough-1500', label: 'Tough 1500', description: 'Engineering · resilient, PP-like' },
  { value: 'rigid-10k', label: 'Rigid 10K', description: 'Engineering · glass-filled, 10 GPa' },
  { value: 'flexible-80a', label: 'Flexible 80A', description: 'Engineering · rubber-like, 80A shore' },
  { value: 'high-temp', label: 'High Temp', description: 'Engineering · 238 °C HDT' },
  { value: 'castable-wax', label: 'Castable Wax 40', description: 'Jewelry · direct investment casting' },
  { value: 'dental-model', label: 'Precision Model', description: 'Dental · ±35 µm accuracy' },
];

const PRINTERS: ComboboxOption[] = [
  { value: 'Form 4 · LivelyOtter', label: 'Form 4 · LivelyOtter' },
  { value: 'Form 4 · BrightHeron', label: 'Form 4 · BrightHeron' },
  { value: 'Form 4L · QuietMoose', label: 'Form 4L · QuietMoose' },
  { value: 'Form 3B+ · SunnyFalcon', label: 'Form 3B+ · SunnyFalcon' },
];

const meta = {
  title: 'Components/Inputs/Combobox',
  component: Combobox,
  tags: ['expanded'],
  args: {
    label: 'Material',
    value: 'tough-2000',
    options: MATERIALS,
    placeholder: 'Search materials…',
    allowCustom: false,
    loading: false,
    emptyMessage: 'No materials match',
    size: 'sm',
    disabled: false,
    invalid: false,
    fullWidth: false,
    onChange: fn(),
    onInputChange: fn(),
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    options: { control: 'object' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Text input with a filtered suggestion listbox, covering both Combobox (pick one option) and Autocomplete (`allowCustom` keeps free text). Arrow keys move through suggestions, Enter selects, Escape reverts; the matched text is marked with `--color-fg-accent`. Built on `TextField` and `Popover`.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs<{ value: string }>();
    return (
      <div style={{ minHeight: 'calc(var(--size-control-md) * 12)' }}>
        <Combobox
          {...args}
          value={value}
          onChange={(v) => {
            update({ value: v });
            args.onChange(v);
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Autocomplete: Story = {
  name: 'Autocomplete (allowCustom)',
  args: { label: 'Printer', value: '', options: PRINTERS, allowCustom: true, placeholder: 'Printer name or serial', emptyMessage: 'No printers on this network' },
};

export const Loading: Story = { args: { value: '', options: [], loading: true } };

export const Empty: Story = { args: { value: '', options: [], emptyMessage: 'No materials installed for this printer' } };

export const RemoteSearch: Story = {
  name: 'Remote search',
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [value, setValue] = useState('');
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<ComboboxOption[]>([]);
    useEffect(() => {
      if (!text.trim()) return setOptions([]);
      setLoading(true);
      const t = window.setTimeout(() => {
        setOptions(MATERIALS.filter((m) => m.label.toLowerCase().includes(text.trim().toLowerCase())));
        setLoading(false);
      }, 600);
      return () => window.clearTimeout(t);
    }, [text]);
    return (
      <div style={{ minHeight: 'calc(var(--size-control-md) * 12)' }}>
        <Combobox label="Material" value={value} onChange={setValue} onInputChange={setText} options={options} loading={loading} placeholder="Type to search the material library" emptyMessage="No materials match" />
      </div>
    );
  },
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="sb-stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Combobox key={size} {...args} size={size} onChange={() => {}} />
      ))}
    </div>
  ),
};

export const Invalid: Story = { args: { invalid: true, value: '', placeholder: 'Material is required' } };

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => <StateMatrix render={(p) => <Combobox {...args} onChange={() => {}} {...p} />} />,
};
