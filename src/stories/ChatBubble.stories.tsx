import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ChatBubble, type ChatMessage } from '../components/ChatBubble/ChatBubble';
import type { MentionPerson } from '../components/MentionInput/MentionInput';

const ARMIN = { id: 'armin', name: 'Armin Jamak' };
const PRIYA = { id: 'priya', name: 'Priya Natarajan' };
const DIEGO = { id: 'diego', name: 'Diego Alvarez' };
const MEI = { id: 'mei', name: 'Mei Chen' };
const PEOPLE: MentionPerson[] = [ARMIN, PRIYA, DIEGO, MEI];

const PRIYA_MSG: ChatMessage = {
  id: 'm1',
  author: PRIYA,
  text: 'Touchpoints on the Mini Chassis Kit are at 0.50 mm. I think that’s why the clips came off scarred. @Armin Jamak ok to drop to 0.40 mm?',
  time: '09:41',
  dateTime: '2026-10-08T09:41',
};

const OWN_MSG: ChatMessage = {
  id: 'm2',
  author: ARMIN,
  text: 'Yes, go to 0.40 mm and bump density to 1.10 so the overhangs still hold.',
  time: '09:43',
  dateTime: '2026-10-08T09:43',
  status: 'read',
};

/** Story-only reaction chips (ReactionPicker is a separate component). */
function ReactionChips({ items }: { items: Array<{ emoji: string; label: string; count: number; mine?: boolean }> }) {
  const chip = (mine?: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    height: 'var(--size-control-xs)',
    padding: '0 var(--space-2)',
    borderRadius: 'var(--radius-full)',
    border: 'var(--border-width-1) solid',
    borderColor: mine ? 'var(--color-border-accent)' : 'var(--color-border-subtle)',
    background: mine ? 'var(--color-bg-accent-soft)' : 'var(--color-bg-surface)',
    color: mine ? 'var(--color-fg-accent)' : 'var(--color-fg-secondary)',
    font: 'var(--typography-label-weight) var(--typography-label-sm-size) / var(--font-line-height-none) var(--typography-label-family)',
  });
  return (
    <>
      {items.map((r) => (
        <button key={r.label} type="button" aria-pressed={!!r.mine} aria-label={`${r.label}: ${r.count}`} style={chip(r.mine)}>
          <span aria-hidden="true">{r.emoji}</span>
          {r.count}
        </button>
      ))}
    </>
  );
}

const REACTIONS = <ReactionChips items={[{ emoji: '👍', label: 'Thumbs up', count: 2, mine: true }, { emoji: '🎯', label: 'Direct hit', count: 1 }]} />;

const meta = {
  title: 'Components/Collaboration/ChatBubble',
  component: ChatBubble,
  tags: ['expanded'],
  args: {
    message: PRIYA_MSG,
    own: false,
    showAuthor: true,
    showMeta: true,
    people: PEOPLE,
    reactions: undefined,
    onRetry: fn(),
    onAttachmentClick: fn(),
  },
  argTypes: {
    message: { control: 'object' },
    people: { control: 'object' },
    reactions: { control: 'inline-radio', options: ['none', 'two'], mapping: { none: undefined, two: REACTIONS } },
  },
  decorators: [(Story) => <div style={{ width: 'var(--size-layout-dialog-md)' }}><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'A single chat message. Your own messages sit on the right in `--color-bg-accent`; others on the left in `--color-bg-surface` with `--elevation-raised`. The first bubble in a group shows avatar and name and gets a tail corner (`--radius-xs`); following bubbles stack with `--space-half`. Delivery status, attachment chips, reply quotes and a reactions slot are built in.',
      },
    },
  },
} satisfies Meta<typeof ChatBubble>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OwnAndOthers: Story = {
  render: (args) => (
    <div role="log" aria-label="Print lab chat">
      <ChatBubble {...args} message={PRIYA_MSG} />
      <ChatBubble {...args} message={OWN_MSG} own />
    </div>
  ),
};

export const DeliveryStatus: Story = {
  render: (args) => (
    <div role="log" aria-label="Delivery states">
      {(['sending', 'sent', 'read', 'failed'] as const).map((status, i) => (
        <ChatBubble
          key={status}
          {...args}
          own
          showAuthor={i === 0}
          message={{
            id: status,
            author: ARMIN,
            time: `09:5${i}`,
            status,
            text:
              status === 'failed'
                ? 'Re-queued the Mini Chassis Kit on Form 4 #2.'
                : status === 'read'
                  ? 'Tank on Form 4 #2 is swapped, ready for the next run.'
                  : status === 'sent'
                    ? 'Grey V5 cartridge is at 18%, ordering two more.'
                    : 'Uploading the new .form with 0.40 mm touchpoints…',
          }}
        />
      ))}
    </div>
  ),
};

export const AttachmentsAndReply: Story = {
  render: (args) => (
    <div role="log" aria-label="Attachments and replies">
      <ChatBubble
        {...args}
        message={{
          id: 'a1',
          author: DIEGO,
          time: '10:02',
          text: 'Here’s the failed tray. Layer 212 is where it let go, you can see the peel lines on the left clip.',
          attachments: [
            { id: 'f1', name: 'failed-tray-layer212.jpg', size: '2.4 MB', kind: 'image' },
            { id: 'f2', name: 'print-log-form4-2.txt', size: '18 KB', kind: 'file' },
          ],
        }}
      />
      <ChatBubble
        {...args}
        own
        message={{
          id: 'a2',
          author: ARMIN,
          time: '10:05',
          status: 'sent',
          text: 'Updated supports attached. @Diego Alvarez can you re-run it this afternoon?',
          replyTo: { author: 'Diego Alvarez', text: 'Here’s the failed tray. Layer 212 is where it let go, you can see the peel lines on the left clip.' },
          attachments: [{ id: 'f3', name: 'Mini Chassis Kit v3.form', size: '18.4 MB', kind: 'model' }],
        }}
      />
    </div>
  ),
};

export const WithReactions: Story = {
  args: { reactions: REACTIONS },
};

export const GroupedConversation: Story = {
  render: (args) => {
    const msgs: Array<ChatMessage & { own?: boolean }> = [
      { id: 'g1', author: MEI, time: '11:10', text: 'For the chassis clips I’d go Tough 2000 over Grey V5.' },
      { id: 'g2', author: MEI, time: '11:10', text: 'It flexes instead of snapping when you press-fit the brackets.' },
      { id: 'g3', author: MEI, time: '11:11', text: 'Needs a 30 min post-cure at 70 °C though.' },
      { id: 'g4', author: ARMIN, time: '11:14', text: 'Works for me. Do we have enough cartridge for 3 trays?', own: true, status: 'read' },
      { id: 'g5', author: ARMIN, time: '11:14', text: '@Priya Natarajan can you re-slice at 100 µm?', own: true, status: 'sent' },
    ];
    return (
      <div role="log" aria-label="Print lab chat">
        {msgs.map((m, i) => {
          const prev = msgs[i - 1];
          const next = msgs[i + 1];
          return (
            <ChatBubble
              key={m.id}
              {...args}
              message={m}
              own={m.own}
              showAuthor={!prev || prev.author.id !== m.author.id}
              showMeta={!next || next.author.id !== m.author.id}
            />
          );
        })}
      </div>
    );
  },
};
