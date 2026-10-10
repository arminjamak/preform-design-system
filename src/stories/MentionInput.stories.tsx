import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { MentionInput, renderMentions, type MentionPerson } from '../components/MentionInput/MentionInput';
import { StateMatrix } from './helpers/StateMatrix';

/**
 * Keeps a local copy of a text arg so fast typing never waits on the Storybook args
 * round-trip, while edits made in the Controls panel still flow in.
 */
function BufferedText({ external, onCommit, children }: { external: string; onCommit: (v: string) => void; children: (value: string, set: (v: string) => void) => ReactNode }) {
  const [local, setLocal] = useState(external);
  const sent = useRef<string[]>([]);
  useEffect(() => {
    const i = sent.current.indexOf(external);
    if (i >= 0) sent.current.splice(0, i + 1);
    else setLocal(external);
  }, [external]);
  return (
    <>
      {children(local, (v) => {
        setLocal(v);
        sent.current.push(v);
        onCommit(v);
      })}
    </>
  );
}

const PEOPLE: MentionPerson[] = [
  { id: 'armin', name: 'Armin Jamak', role: 'Print lab lead' },
  { id: 'priya', name: 'Priya Natarajan', role: 'Applications engineer' },
  { id: 'diego', name: 'Diego Alvarez', role: 'Support technician' },
  { id: 'mei', name: 'Mei Chen', role: 'Materials specialist' },
];

const NOTE = 'Supports on the Mini Chassis Kit underside look too dense. @Priya Natarajan can you drop the touchpoint size to 0.40 mm before the next run?';

const meta = {
  title: 'Components/Collaboration/MentionInput',
  component: MentionInput,
  tags: ['expanded'],
  args: {
    label: 'Note for the print lab',
    hideLabel: false,
    value: NOTE,
    onChange: fn(),
    onMention: fn(),
    people: PEOPLE,
    placeholder: 'Type @ to mention a teammate',
    rows: 3,
    autoGrow: false,
    maxRows: 6,
    size: 'sm',
    variant: 'field',
    suggestionPlacement: 'bottom',
    maxSuggestions: 6,
    showPreview: false,
    invalid: false,
    disabled: false,
    fullWidth: false,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    variant: { control: 'inline-radio', options: ['field', 'bare'] },
    suggestionPlacement: { control: 'inline-radio', options: ['bottom', 'top'] },
    rows: { control: { type: 'number', min: 1, max: 12 } },
    maxRows: { control: { type: 'number', min: 1, max: 20 } },
    maxSuggestions: { control: { type: 'number', min: 1, max: 10 } },
    people: { control: 'object' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  decorators: [(Story) => <div style={{ paddingBottom: 'var(--space-24)' }}><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Textarea with `@` mention autocomplete for job notes, comments and chat. Typing `@` opens a listbox of teammates (avatar, name, role) next to the `@`; ↑/↓ move, Enter or Tab inserts `@Full Name`, Escape dismisses. Inserted mentions are tinted with `--color-bg-accent-soft` behind the text, and `renderMentions(text, people)` renders the same highlight in read-only text.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return (
      <BufferedText external={value ?? ''} onCommit={(v) => update({ value: v })}>
        {(text, setText) => (
          <MentionInput
            {...args}
            value={text}
            onChange={(v) => {
              setText(v);
              args.onChange(v);
            }}
          />
        )}
      </BufferedText>
    );
  },
} satisfies Meta<typeof MentionInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Types `@di` so the suggestion list is open and filtered to Diego. */
export const SuggestionsOpen: Story = {
  args: { value: 'The failed Mini Chassis Kit print peeled off at layer 212. ' },
  play: async ({ canvasElement }) => {
    const textbox = within(canvasElement).getByRole('textbox');
    await userEvent.type(textbox, '@di');
  },
};

export const OpensAbove: Story = {
  args: { suggestionPlacement: 'top', value: 'Which resin should we use for the chassis clips? ' },
  decorators: [(Story) => <div style={{ paddingTop: 'var(--space-24)' }}><Story /></div>],
  play: async ({ canvasElement }) => {
    const textbox = within(canvasElement).getByRole('textbox');
    await userEvent.type(textbox, '@');
  },
};

export const WithPreview: Story = {
  args: {
    showPreview: true,
    value: '@Mei Chen Tough 2000 or Grey Pro for the chassis clips?\n@Diego Alvarez please re-run the failed tray once we decide.',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      <MentionInput {...args} size="sm" label="Small (12px)" rows={2} onChange={() => {}} />
      <MentionInput {...args} size="md" label="Medium (13px)" rows={2} onChange={() => {}} />
    </div>
  ),
};

export const AutoGrow: Story = {
  args: { autoGrow: true, rows: 1, maxRows: 5, label: 'Reply', value: '', placeholder: 'Grows up to 5 lines, then scrolls' },
};

export const Bare: Story = {
  args: { variant: 'bare', hideLabel: true, rows: 2 },
  parameters: { docs: { description: { story: 'Borderless input for embedding in a composer that draws its own frame (ChatComposer uses this).' } } },
};

export const RenderMentionsHelper: Story = {
  name: 'renderMentions()',
  parameters: { controls: { disable: true } },
  render: () => (
    <p className="pf-text-body" style={{ maxWidth: 'var(--size-layout-dialog-md)', whiteSpace: 'pre-wrap' }}>
      {renderMentions('@Priya Natarajan bumped the support density to 1.10 on the Mini Chassis Kit. @Mei Chen confirmed Grey V5 is fine for the brackets.', PEOPLE)}
    </p>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'filled', render: (p) => <MentionInput {...args} hideLabel rows={2} onChange={() => {}} {...p} /> },
        { label: 'empty', render: (p) => <MentionInput {...args} value="" hideLabel rows={2} onChange={() => {}} {...p} /> },
        { label: 'invalid', render: (p) => <MentionInput {...args} invalid hideLabel rows={2} onChange={() => {}} {...p} /> },
      ]}
    />
  ),
};
