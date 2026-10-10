import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { JsonEditor } from '../components/JsonEditor/JsonEditor';
import { StateMatrix } from './helpers/StateMatrix';

const profile = `{
  "profile": "Fine detail — Grey V5",
  "printer": "Form 4",
  "material": "FLGPGR05",
  "layer_height_mm": 0.025,
  "supports": {
    "density": 1.0,
    "touchpoint_size_mm": 0.4,
    "internal_supports": true,
    "raft_type": "mini"
  },
  "post_processing": { "wash_min": 10, "cure_min": 15, "cure_temp_c": 60 },
  "notes": null
}`;

const broken = `{
  "profile": "Fine detail — Grey V5",
  "printer": "Form 4"
  "layer_height_mm": 0.025,
  "supports": { "density": 1.0, "touchpoint_size_mm": 0.4, }
}`;

const minified = '{"serial":"Form4-SmoothPeacock","status":"PRINTING","layer":412,"layer_count":1650,"resin_temperature_c":35.1,"tank":{"material_code":"FLGPGR05","layers_printed":48622}}';

const meta = {
  title: 'Components/Specialized/JsonEditor',
  component: JsonEditor,
  tags: ['expanded'],
  args: { label: 'Custom print profile', value: profile, onChange: fn(), readOnly: false, minLines: 6, maxLines: 24 },
  argTypes: {
    value: { control: 'text' },
    minLines: { control: { type: 'range', min: 1, max: 30, step: 1 } },
    maxLines: { control: { type: 'range', min: 4, max: 40, step: 1 } },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <JsonEditor {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
  decorators: [(Story) => <div style={{ width: 'var(--size-layout-dialog-lg)' }}><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Textarea-based JSON editor for custom print profiles and API payloads: line numbers, token colouring, live validation that marks the failing line with --color-status-danger tokens, and Format / Minify actions.',
      },
    },
  },
} satisfies Meta<typeof JsonEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const InvalidJson: Story = { args: { label: 'Profile override', value: broken } };

export const Minified: Story = { args: { label: 'Printer status payload', value: minified, minLines: 3 } };

export const ReadOnly: Story = { args: { label: 'Applied profile (locked by admin)', readOnly: true } };

export const Empty: Story = { args: { label: 'Request body', value: '', minLines: 4 } };

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={(p) => (
        <div style={{ width: 'var(--size-layout-sidebar)' }}>
          <JsonEditor {...args} value={'{ "layer_height_mm": 0.05 }'} minLines={2} readOnly={p.disabled} data-state={p['data-state']} />
        </div>
      )}
    />
  ),
};
