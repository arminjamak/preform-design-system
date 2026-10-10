import { useId, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FieldRow } from '../components/FieldRow/FieldRow';
import { TextField } from '../components/TextField/TextField';
import { ValidationMessage, type ValidationTone } from '../components/ValidationMessage/ValidationMessage';

const TONES: ValidationTone[] = ['error', 'warning', 'success', 'info'];

const meta = {
  title: 'Components/Feedback/ValidationMessage',
  component: ValidationMessage,
  tags: ['expanded'],
  args: { tone: 'error', children: 'Layer height must be between 0.025 and 0.300 mm.' },
  argTypes: {
    tone: { control: 'inline-radio', options: TONES },
    children: { control: 'text' },
    icon: { control: false },
  },
  decorators: [(S) => <div className="sb-panel-demo"><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Inline validation text with a tone icon, placed under a field and linked with `aria-describedby`. It is a polite `aria-live` region: keep it mounted and change its children so screen readers hear the new message. Errors and warnings get a hidden "Error:"/"Warning:" prefix. Colours come from `--color-status-*-strong`.',
      },
    },
  },
} satisfies Meta<typeof ValidationMessage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack">
      <ValidationMessage tone="error">Model extends 4 mm beyond the build platform.</ValidationMessage>
      <ValidationMessage tone="warning">Unsupported minima detected on 2 models.</ValidationMessage>
      <ValidationMessage tone="success">Printer name is available.</ValidationMessage>
      <ValidationMessage tone="info">Thinner layers increase print time by about 40%.</ValidationMessage>
    </div>
  ),
};

const QUEUED = ['bracket_v3', 'gear_housing'];

function validate(name: string): { tone: ValidationTone; message: string } | null {
  const v = name.trim();
  if (!v) return { tone: 'error', message: 'Job name is required.' };
  if (/[\\/:*?"<>|]/.test(v)) return { tone: 'error', message: 'Job name cannot contain \\ / : * ? " < > |' };
  if (QUEUED.includes(v.toLowerCase())) return { tone: 'warning', message: `A job named "${v}" is already in the Form 4 queue.` };
  if (v.length > 40) return { tone: 'warning', message: 'Long names are truncated on the printer screen.' };
  return { tone: 'success', message: 'Ready to upload to queue.' };
}

/** Type in the field: empty, `Bracket_v3` (duplicate) and `a/b` (invalid) each produce a different message. */
export const UnderAField: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [name, setName] = useState('Bracket_v3');
    const id = useId();
    const result = validate(name);
    return (
      <FieldRow label="Job name" layout="stacked">
        <TextField
          label="Job name"
          value={name}
          onChange={setName}
          invalid={result?.tone === 'error'}
          aria-describedby={id}
          fullWidth
        />
        <ValidationMessage id={id} tone={result?.tone}>
          {result?.message}
        </ValidationMessage>
      </FieldRow>
    );
  },
};
