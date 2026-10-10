import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { RichTextEditor, type RichTextEditorProps } from '../components/RichTextEditor/RichTextEditor';

const JOB_NOTES = `<h2>Print job notes</h2><p>Upper arch models for <strong>Case 2026-118</strong>. Print on Grey V5 at <em>50 µm</em> layers.</p><ul><li>Orient 15° from the build platform</li><li>Touchpoint size 0.45 mm, density 1.0</li></ul><blockquote><p>Wash 10 min in IPA, then cure 30 min at 60 °C in Form Cure.</p></blockquote><p>See the <a href="https://support.formlabs.com" target="_blank" rel="noopener noreferrer">post-processing guide</a>.</p>`;

function Controlled(args: RichTextEditorProps) {
  const [value, setValue] = useState(args.value);
  useEffect(() => setValue(args.value), [args.value]);
  return (
    <RichTextEditor
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
  title: 'Components/Media/RichTextEditor',
  component: RichTextEditor,
  tags: ['expanded'],
  args: {
    label: 'Job notes',
    value: JOB_NOTES,
    onChange: fn(),
    placeholder: 'Add notes for whoever picks up this print…',
    disabled: false,
    minHeight: 'calc(var(--space-24) * 2)',
  },
  argTypes: {
    value: { control: 'text' },
    toolbar: { control: 'check', options: ['bold', 'italic', 'underline', 'h2', 'h3', 'bulletList', 'numberedList', 'link', 'quote', 'clear'] },
    minHeight: { control: 'select', options: [undefined, 'var(--space-24)', 'calc(var(--space-24) * 2)', 'calc(var(--space-24) * 3)'] },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'WYSIWYG notes editor on contentEditable. Toolbar buttons expose aria-pressed from `queryCommandState` and the caret position; Ctrl/⌘+B, I, U and K work in the editor. Incoming and pasted HTML is whitelisted (formatting tags and safe link hrefs only). Content is styled by Prose; the frame mirrors the field tokens.',
      },
    },
  },
  render: (args) => <Controlled {...args} />,
  decorators: [(Story) => <div style={{ width: 'var(--size-layout-dialog-lg)', maxWidth: '100%' }}><Story /></div>],
} satisfies Meta<typeof RichTextEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Empty: Story = {
  args: { value: '' },
};

export const CompactToolbar: Story = {
  args: {
    label: 'Material comment',
    value: '<p>Grey V5 tank <strong>#3</strong> is at 2 140 layers; replace after this job.</p>',
    toolbar: ['bold', 'italic', 'bulletList', 'link'],
    minHeight: 'var(--space-24)',
  },
};

export const Disabled: Story = {
  args: { disabled: true, label: 'Job notes (locked while printing)' },
};
