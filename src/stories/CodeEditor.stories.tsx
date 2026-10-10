import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CodeEditor, type CodeEditorProps } from '../components/CodeEditor/CodeEditor';
import { StateMatrix } from './helpers/StateMatrix';

const JSON_SETTINGS = `{
  "printer": "Form 4",
  "material": "Grey V5",
  "layer_height_mm": 0.05,
  "supports": {
    "density": 1.0,
    "touchpoint_size_mm": 0.45
  }
}`;

const PYTHON = `import requests

PREFORM = "http://localhost:44388"


def auto_support(scene_id: str, density: float = 1.0) -> dict:
    """Generate supports for every model in the scene."""
    res = requests.post(f"{PREFORM}/scene/{scene_id}/auto-support/", json={
        "models": "ALL",
        "density": density,
    })
    res.raise_for_status()
    return res.json()`;

const GCODE = `; Tank warm-up macro, Form 3+
M140 S35         ; heat resin tank to 35 C
M190 S35         ; wait for tank temperature
G28 Z            ; home build platform
G1 Z0.050 F300   ; first layer height`;

/** Local state keeps the caret stable while typing; the action still logs every change. */
function Controlled(args: CodeEditorProps) {
  const [value, setValue] = useState(args.value);
  useEffect(() => setValue(args.value), [args.value]);
  return (
    <CodeEditor
      {...args}
      value={value}
      onChange={(v) => {
        setValue(v);
        args.onChange(v);
      }}
    />
  );
}

const meta = {
  title: 'Components/Media/CodeEditor',
  component: CodeEditor,
  tags: ['expanded'],
  args: {
    label: 'Custom print settings (JSON)',
    value: JSON_SETTINGS,
    onChange: fn(),
    language: 'json',
    readOnly: false,
    disabled: false,
    invalid: false,
    minLines: 6,
    maxHeight: undefined,
    showLineNumbers: true,
    placeholder: '{ "layer_height_mm": 0.05 }',
  },
  argTypes: {
    language: { control: 'select', options: ['typescript', 'javascript', 'json', 'python', 'bash', 'gcode', 'css', 'text'] },
    minLines: { control: { type: 'number', min: 1, max: 30 } },
    tabSize: { control: { type: 'number', min: 1, max: 8 } },
    maxHeight: { control: 'select', options: [undefined, 'calc(var(--space-24) * 2)', 'calc(var(--space-24) * 3)', 'var(--size-layout-panel)'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Editable code with live highlighting: a transparent textarea over the CodeBlock tokenizer output. Tab inserts spaces (Shift+Tab outdents, Escape then Tab leaves), Enter keeps indentation and indents after `{`, `[`, `(` or a Python `:`. Used for custom print-setting overrides and automation scripts. Frame follows the TextField field tokens.',
      },
    },
  },
  render: (args) => <Controlled {...args} />,
  decorators: [(Story) => <div style={{ width: 'var(--size-layout-dialog-lg)', maxWidth: '100%' }}><Story /></div>],
} satisfies Meta<typeof CodeEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const PythonScript: Story = {
  args: { label: 'Automation script', value: PYTHON, language: 'python', minLines: 10 },
};

export const ReadOnlyGcode: Story = {
  name: 'Read-only G-code',
  args: { label: 'Warm-up macro', value: GCODE, language: 'gcode', readOnly: true, minLines: 3 },
};

export const Empty: Story = {
  args: { value: '', minLines: 4 },
};

export const ScrollsAtMaxHeight: Story = {
  args: { label: 'Automation script', value: PYTHON, language: 'python', minLines: 4, maxHeight: 'calc(var(--space-24) * 2)' },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'default', render: (p) => <div style={{ width: 'var(--size-field-lg)' }}><CodeEditor {...args} label="Layer height (mm)" language="json" value="0.05" minLines={1} showLineNumbers={false} onChange={() => {}} {...p} /></div> },
        { label: 'invalid', render: (p) => <div style={{ width: 'var(--size-field-lg)' }}><CodeEditor {...args} label="Layer height (mm)" language="json" value="0.05 mm" minLines={1} showLineNumbers={false} invalid onChange={() => {}} {...p} /></div> },
      ]}
    />
  ),
};
