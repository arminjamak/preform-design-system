import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { SmileIcon } from 'lucide-react';
import { ChatComposer, type ComposerAttachment } from '../components/ChatComposer/ChatComposer';
import { ChatBubble, type ChatMessage } from '../components/ChatBubble/ChatBubble';
import type { MentionPerson } from '../components/MentionInput/MentionInput';
import { Avatar } from '../components/Avatar/Avatar';
import { IconButton } from '../components/IconButton/IconButton';
import { Popover } from '../components/Popover/Popover';
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
const [ARMIN, PRIYA, DIEGO, MEI] = PEOPLE;

const FILES: ComposerAttachment[] = [
  { id: 'f1', name: 'Mini Chassis Kit v3.form', size: '18.4 MB', kind: 'model' },
  { id: 'f2', name: 'failed-tray-layer212.jpg', size: '2.4 MB', kind: 'image' },
];

const kindOf = (file: File): ComposerAttachment['kind'] =>
  file.type.startsWith('image/') ? 'image' : /\.(form|stl|3mf|obj)$/i.test(file.name) ? 'model' : 'file';
const sizeOf = (bytes: number) => (bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`);
const toAttachments = (files: File[]): ComposerAttachment[] =>
  files.map((f) => ({ id: `${f.name}-${f.size}-${f.lastModified}`, name: f.name, size: sizeOf(f.size), kind: kindOf(f) }));

const EMOJI = [
  { char: '👍', label: 'Thumbs up' },
  { char: '✅', label: 'Done' },
  { char: '🎯', label: 'Direct hit' },
  { char: '🔥', label: 'Fire' },
  { char: '🤔', label: 'Thinking' },
  { char: '🙏', label: 'Thanks' },
  { char: '⚠️', label: 'Warning' },
  { char: '🧪', label: 'Resin test' },
];

/** Story-only emoji picker for the composer's `emoji` slot. */
function EmojiPicker({ onPick, disabled }: { onPick: (emoji: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      placement="top"
      align="start"
      padded={false}
      trigger={
        <IconButton label="Insert emoji" icon={<SmileIcon strokeWidth={2.2} />} size="sm" disabled={disabled} aria-expanded={open} onClick={() => setOpen((o) => !o)} />
      }
    >
      <div role="group" aria-label="Emoji" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, var(--size-control-md))', gap: 'var(--space-1)', padding: 'var(--space-2)' }}>
        {EMOJI.map((e) => (
          <button
            key={e.label}
            type="button"
            aria-label={e.label}
            title={e.label}
            onClick={() => {
              onPick(e.char);
              setOpen(false);
            }}
            style={{ width: 'var(--size-control-md)', height: 'var(--size-control-md)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xl)' }}
          >
            {e.char}
          </button>
        ))}
      </div>
    </Popover>
  );
}

const meta = {
  title: 'Components/Collaboration/ChatComposer',
  component: ChatComposer,
  tags: ['expanded'],
  args: {
    value: '',
    onChange: fn(),
    onSend: fn(),
    attachments: [FILES[0]],
    onAttach: fn(),
    onRemoveAttachment: fn(),
    accept: '.form,.stl,.3mf,image/*,.txt',
    people: PEOPLE,
    placeholder: 'Message #mini-chassis-kit… type @ to mention',
    disabled: false,
    typing: ['Priya Natarajan'],
    emoji: 'picker',
    label: 'Message',
    layout: 'stacked',
    maxRows: 6,
  },
  argTypes: {
    layout: { control: 'inline-radio', options: ['stacked', 'inline'] },
    maxRows: { control: { type: 'number', min: 1, max: 12 } },
    attachments: { control: 'object' },
    people: { control: 'object' },
    typing: { control: 'object' },
    emoji: { control: 'inline-radio', options: ['none', 'picker'], mapping: { none: undefined, picker: 'picker' } },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Chat and comment composer. Auto-growing MentionInput (type `@` to mention), attach button and drag-and-drop with removable file chips, an emoji slot and a circular `--color-bg-accent` send button that stays disabled until there is text or a file. Enter sends, Shift+Enter adds a line; a "Priya is typing…" line sits underneath.',
      },
    },
  },
  render: function Render(args) {
    const [{ value, attachments = [] }, update] = useArgs();
    return (
      <div style={{ width: 'var(--size-layout-dialog-md)', paddingTop: 'var(--space-20)' }}>
        <BufferedText external={value ?? ''} onCommit={(v) => update({ value: v })}>
          {(text, setText) => (
            <ChatComposer
              {...args}
              value={text}
              attachments={attachments}
              emoji={args.emoji ? <EmojiPicker disabled={args.disabled} onPick={(e) => setText(`${text}${e}`)} /> : undefined}
              onChange={(v) => {
                setText(v);
                args.onChange(v);
              }}
              onAttach={(files) => {
                update({ attachments: [...attachments, ...toAttachments(files)] });
                args.onAttach?.(files);
              }}
              onRemoveAttachment={(id) => {
                update({ attachments: attachments.filter((a: ComposerAttachment) => a.id !== id) });
                args.onRemoveAttachment?.(id);
              }}
              onSend={(payload) => {
                setText('');
                update({ attachments: [] });
                args.onSend(payload);
              }}
            />
          )}
        </BufferedText>
      </div>
    );
  },
} satisfies Meta<typeof ChatComposer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Inline: Story = {
  args: { layout: 'inline', attachments: [], typing: [], placeholder: 'Reply… type @ to mention' },
};

export const WithAttachments: Story = {
  args: { attachments: FILES, typing: [], value: 'Failed tray photo and the re-sliced file.' },
};

export const Typing: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="sb-stack" style={{ alignItems: 'stretch', width: 'var(--size-layout-dialog-md)' }}>
      {[['Priya Natarajan'], ['Priya Natarajan', 'Diego Alvarez'], ['Priya Natarajan', 'Diego Alvarez', 'Mei Chen']].map((names) => (
        <ChatComposer key={names.length} {...args} emoji={undefined} attachments={[]} typing={names} value="" onChange={() => {}} />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, typing: [], attachments: [], placeholder: 'You’re offline. Reconnect to send messages.' },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        {
          label: 'empty',
          render: (p) => (
            <div style={{ width: 'var(--size-field-lg)' }}>
              <ChatComposer {...args} layout="inline" placeholder="Reply…" emoji={undefined} typing={[]} attachments={[]} onChange={() => {}} {...p} />
            </div>
          ),
        },
        {
          label: 'with text',
          render: (p) => (
            <div style={{ width: 'var(--size-field-lg)' }}>
              <ChatComposer {...args} layout="inline" placeholder="Reply…" emoji={undefined} typing={[]} attachments={[]} value="Re-run at 100 µm?" onChange={() => {}} {...p} />
            </div>
          ),
        },
      ]}
    />
  ),
};

/* ---------------------------------------------------------------- Chat */

type Msg = ChatMessage & { own?: boolean };

const SEED: Msg[] = [
  {
    id: 'c1',
    author: DIEGO,
    time: '09:32',
    text: 'Mini Chassis Kit failed on Form 4 #2 overnight. Left clip peeled off at layer 212.',
    attachments: [{ id: 'p1', name: 'failed-tray-layer212.jpg', size: '2.4 MB', kind: 'image' }],
  },
  { id: 'c2', author: PRIYA, time: '09:35', text: 'Touchpoints are 0.50 mm and density 0.90. That’s too sparse under the clip overhang.' },
  { id: 'c3', author: PRIYA, time: '09:35', text: 'I’d go 0.40 mm touchpoints at 1.10 density.' },
  {
    id: 'c4',
    author: ARMIN,
    own: true,
    time: '09:38',
    status: 'read',
    text: 'Agreed. @Mei Chen Tough 2000 or Grey V5 for the re-run?',
    replyTo: { author: 'Priya Natarajan', text: 'I’d go 0.40 mm touchpoints at 1.10 density.' },
  },
  { id: 'c5', author: MEI, time: '09:41', text: 'Tough 2000. The clips need to flex on press-fit, Grey V5 will crack.' },
  { id: 'c6', author: ARMIN, own: true, time: '09:42', status: 'failed', text: 'Ordering a Tough 2000 cartridge now.' },
];

const REPLIES = [
  'Re-sliced with 0.40 mm touchpoints, uploading the .form now.',
  'Queued on Form 4 #2, est. 4 h 12 min at 100 µm.',
  'I’ll check the tank for cured flakes before it starts.',
];

const pad = (n: number) => String(n).padStart(2, '0');

function ChatPanel({ people, typingDelay = 1400 }: { people: MentionPerson[]; typingDelay?: number }) {
  const [messages, setMessages] = useState<Msg[]>(SEED);
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<ComposerAttachment[]>([]);
  const [typing, setTyping] = useState<string[]>([]);
  const clock = useRef(42); // minutes past 09:00, so new timestamps stay deterministic
  const replyIndex = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, typing]);

  const later = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  const nextTime = () => `${pad(9 + Math.floor(++clock.current / 60))}:${pad(clock.current % 60)}`;
  const setStatus = (id: string, status: ChatMessage['status']) => setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, status } : m)));

  const deliver = (id: string) => {
    setStatus(id, 'sending');
    later(600, () => setStatus(id, 'sent'));
    later(typingDelay + 1200, () => setStatus(id, 'read'));
  };

  const send = ({ text, files: attached }: { text: string; files: ComposerAttachment[] }) => {
    const id = `own-${Date.now()}`;
    setMessages((ms) => [...ms, { id, author: ARMIN, own: true, time: nextTime(), text, attachments: attached.length ? attached : undefined, status: 'sending' }]);
    setValue('');
    setFiles([]);
    deliver(id);
    later(800, () => setTyping([PRIYA.name]));
    later(800 + typingDelay, () => {
      setTyping([]);
      const reply = REPLIES[replyIndex.current++ % REPLIES.length];
      setMessages((ms) => [...ms, { id: `priya-${Date.now()}`, author: PRIYA, time: nextTime(), text: reply }]);
    });
  };

  return (
    <section
      aria-label="Mini Chassis Kit chat"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 'var(--size-layout-dialog-md)',
        height: 'calc(var(--size-layout-dialog-lg) + var(--space-16))',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-panel)',
        boxShadow: 'var(--elevation-panel)',
        border: 'var(--border-width-1) solid var(--color-border-subtle)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          minHeight: 'var(--component-panel-header-height)',
          padding: 'var(--space-1) var(--space-3)',
          borderBottom: 'var(--border-width-1) solid var(--color-border-subtle)',
          background: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}
      >
        <span className="pf-text-body-strong" style={{ flex: 1 }}>
          # mini-chassis-kit
        </span>
        <span style={{ display: 'inline-flex', gap: 'var(--space-half)' }}>
          {people.map((p) => (
            <Avatar key={p.id} name={p.name} size="xs" tone={p.id === ARMIN.id ? 'accent' : 'neutral'} />
          ))}
        </span>
      </header>
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Messages"
        tabIndex={0}
        style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column' }}
      >
        <p className="pf-text-caption" style={{ alignSelf: 'center', color: 'var(--color-fg-muted)', margin: '0 0 var(--space-2)' }}>
          THURSDAY, OCT 8
        </p>
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          return (
            <ChatBubble
              key={m.id}
              message={m}
              own={m.own}
              people={people}
              showAuthor={!prev || prev.author.id !== m.author.id}
              showMeta={!next || next.author.id !== m.author.id || m.status === 'failed'}
              onRetry={(msg) => deliver(msg.id)}
            />
          );
        })}
      </div>
      <div style={{ padding: 'var(--space-2) var(--space-3) var(--space-1)', borderTop: 'var(--border-width-1) solid var(--color-border-subtle)' }}>
        <ChatComposer
          value={value}
          onChange={setValue}
          onSend={send}
          attachments={files}
          onAttach={(fs) => setFiles((cur) => [...cur, ...toAttachments(fs)])}
          onRemoveAttachment={(id) => setFiles((cur) => cur.filter((f) => f.id !== id))}
          people={people.filter((p) => p.id !== ARMIN.id)}
          typing={typing}
          placeholder="Message #mini-chassis-kit"
          emoji={<EmojiPicker onPick={(e) => setValue((v) => `${v}${e}`)} />}
        />
      </div>
    </section>
  );
}

/** A working conversation panel: send a message (Enter), watch it go sending → sent → read, see Priya type and reply. Retry the failed message. */
export const Chat: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ChatPanel people={PEOPLE} />,
};
