import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MarkdownEditor, MarkdownPreview, type MarkdownEditorProps } from '../components/MarkdownEditor/MarkdownEditor';

const RELEASE_NOTES = `## PreForm 3.44 release notes

PreForm 3.44 adds **Form 4L** support and makes support generation up to _40% faster_ on dense dental arches.

### New
- Auto-orient respects the **minimum angle** set in \`Print Settings\`
- Hollowing preview shows drain holes in the cross-section view
- New [Grey V5 settings](https://support.formlabs.com) for 25 µm layers

### Fixed
1. The job queue no longer duplicates jobs after a network reconnect
2. Supports on overhanging margins are placed on the outer edge

> Update printer firmware to **1.9.2** before sending jobs from PreForm 3.44.

\`\`\`json print_settings.json
{ "layer_height_mm": 0.025, "material": "Grey V5", "supports": { "density": 1.0 } }
\`\`\`

| Printer | Minimum firmware |
| :-- | --: |
| Form 4 | 1.9.2 |
| Form 3+ | 1.12.4 |
`;

const JOB_NOTE = `### Case 2026-118 · upper arch

Print on **Form4-CapableGecko** with Grey V5 at 50 µm.

- Orient 15° from the platform
- Touchpoints \`0.45 mm\`
`;

function Controlled(args: MarkdownEditorProps) {
  const [value, setValue] = useState(args.value);
  useEffect(() => setValue(args.value), [args.value]);
  return (
    <MarkdownEditor
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
  title: 'Components/Media/MarkdownEditor',
  component: MarkdownEditor,
  tags: ['expanded'],
  args: {
    label: 'Release notes',
    value: RELEASE_NOTES,
    onChange: fn(),
    mode: 'split',
    placeholder: 'Describe what changed in this PreForm release…',
    height: 'calc(var(--space-24) * 4)',
    disabled: false,
    defaultTab: 'write',
  },
  argTypes: {
    mode: { control: 'inline-radio', options: ['split', 'tabs'] },
    defaultTab: { control: 'inline-radio', options: ['write', 'preview'] },
    height: { control: 'select', options: [undefined, 'calc(var(--space-24) * 2)', 'calc(var(--space-24) * 3)', 'calc(var(--space-24) * 4)'] },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Markdown source with a formatting toolbar (Ctrl/⌘+B, I, K; aria-pressed reflects the format at the caret) and a safe preview rendered to React elements, so HTML is escaped and `javascript:` links are dropped. Fenced code renders with CodeBlock, the preview with Prose. Used for release notes and job notes.',
      },
    },
  },
  render: (args) => <Controlled {...args} />,
  decorators: [(Story) => <div style={{ width: 'calc(var(--size-layout-dialog-lg) * 2)', maxWidth: '100%' }}><Story /></div>],
} satisfies Meta<typeof MarkdownEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tabbed: Story = {
  args: { mode: 'tabs', label: 'Job note', value: JOB_NOTE, height: 'calc(var(--space-24) * 2)' },
  decorators: [(Story) => <div style={{ width: 'var(--size-layout-dialog-lg)', maxWidth: '100%' }}><Story /></div>],
};

export const Empty: Story = {
  args: { value: '', mode: 'tabs', label: 'Job note', placeholder: 'Add notes for the print technician…', height: 'calc(var(--space-24) * 2)' },
  decorators: [(Story) => <div style={{ width: 'var(--size-layout-dialog-lg)', maxWidth: '100%' }}><Story /></div>],
};

export const Disabled: Story = {
  args: { disabled: true, value: JOB_NOTE, label: 'Job note (locked while printing)', height: 'calc(var(--space-24) * 2)' },
};

export const PreviewOnly: Story = {
  name: 'MarkdownPreview',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ width: 'var(--size-layout-dialog-lg)', maxWidth: '100%' }}>
      <MarkdownPreview source={RELEASE_NOTES} />
    </div>
  ),
};
