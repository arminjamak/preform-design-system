import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { CommentThread, type CommentThreadData, type ThreadComment } from '../components/CommentThread/CommentThread';
import type { MentionPerson } from '../components/MentionInput/MentionInput';

const PEOPLE: MentionPerson[] = [
  { id: 'armin', name: 'Armin Jamak', role: 'Print lab lead' },
  { id: 'priya', name: 'Priya Natarajan', role: 'Applications engineer' },
  { id: 'diego', name: 'Diego Alvarez', role: 'Support technician' },
  { id: 'mei', name: 'Mei Chen', role: 'Materials specialist' },
];
const [ARMIN, PRIYA, DIEGO, MEI] = PEOPLE;

const SUPPORTS: CommentThreadData = {
  id: 't-supports',
  resolved: false,
  context: 'Support point 14 · Mini Chassis Kit',
  comments: [
    {
      id: 'c1',
      author: PRIYA,
      time: 'Oct 8, 09:35',
      dateTime: '2026-10-08T09:35',
      text: 'This overhang under the left clip only has three touchpoints. @Armin Jamak can we add a support ridge here before the re-run?',
    },
    { id: 'c2', author: ARMIN, time: 'Oct 8, 09:40', dateTime: '2026-10-08T09:40', text: 'Yes. Bumping density to 1.10 and touchpoints to 0.40 mm across the whole part.', edited: true },
    { id: 'c3', author: DIEGO, time: 'Oct 8, 10:02', dateTime: '2026-10-08T10:02', text: 'Re-sliced. Print time went from 3 h 48 min to 4 h 12 min, still fits the overnight slot.', unread: true },
    { id: 'c4', author: MEI, time: 'Oct 8, 10:06', dateTime: '2026-10-08T10:06', text: '@Diego Alvarez use Tough 2000 for this one, Grey V5 cracked on the press-fit.', unread: true },
  ],
};

const FAILED_PRINT: CommentThreadData = {
  id: 't-failed',
  resolved: true,
  context: 'Job #4821 · Form 4 #2 · failed at layer 212',
  comments: [
    { id: 'f1', author: DIEGO, time: 'Oct 7, 18:20', dateTime: '2026-10-07T18:20', text: 'Print peeled off the build platform at layer 212. Tank has a cured flake in the corner.' },
    { id: 'f2', author: ARMIN, time: 'Oct 7, 18:31', dateTime: '2026-10-07T18:31', text: 'Swapped the tank and filtered the resin. @Diego Alvarez please re-queue it.' },
    { id: 'f3', author: DIEGO, time: 'Oct 8, 07:55', dateTime: '2026-10-08T07:55', text: 'Re-run finished clean. Closing this.' },
  ],
};

const RESIN: CommentThreadData = {
  id: 't-resin',
  resolved: false,
  context: 'Material · Mini Chassis Kit brackets',
  comments: [
    { id: 'r1', author: MEI, time: 'Oct 8, 11:10', dateTime: '2026-10-08T11:10', text: 'Proposing Tough 2000 for the brackets and Clear V4 for the cover so the LEDs show through.' },
    { id: 'r2', author: PRIYA, time: 'Oct 8, 11:18', dateTime: '2026-10-08T11:18', text: 'Clear V4 needs the polish step, adds a day. Fine if @Armin Jamak is ok with the schedule.' },
  ],
};

let seq = 0;

const meta = {
  title: 'Components/Collaboration/CommentThread',
  component: CommentThread,
  tags: ['expanded'],
  args: {
    thread: SUPPORTS,
    currentUser: ARMIN,
    people: PEOPLE,
    onReply: fn(),
    onResolve: fn(),
    onEdit: fn(),
    onDelete: fn(),
    onCopyLink: fn(),
    defaultExpanded: false,
    replyPlaceholder: 'Reply… type @ to mention',
  },
  argTypes: {
    thread: { control: 'object' },
    currentUser: { control: 'object' },
    people: { control: 'object' },
    getCommentLink: { control: false },
  },
  decorators: [(Story) => <div style={{ width: 'var(--size-layout-dialog-md)', paddingBottom: 'var(--space-16)' }}><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Comment thread pinned to a support point, job or material choice. Root comment and replies with avatar, name, time and highlighted @mentions; unread comments get an `--color-bg-accent-subtle` wash and accent bar. Resolve collapses the thread to a one-line summary; Reopen brings it back. Own comments get Edit and Delete in the ⋮ menu; everyone gets Copy link.',
      },
    },
  },
  render: function Render(args) {
    const [{ thread }, update] = useArgs();
    const t = thread as CommentThreadData;
    const set = (next: Partial<CommentThreadData>) => update({ thread: { ...t, ...next } });
    return (
      <CommentThread
        {...args}
        thread={t}
        onReply={(text) => {
          const comment: ThreadComment = { id: `new-${++seq}`, author: args.currentUser, time: 'Oct 8, 14:32', dateTime: '2026-10-08T14:32', text };
          set({ comments: [...t.comments.map((c) => ({ ...c, unread: false })), comment] });
          args.onReply(text);
        }}
        onResolve={(resolved) => {
          set({ resolved });
          args.onResolve(resolved);
        }}
        onEdit={(id, text) => {
          set({ comments: t.comments.map((c) => (c.id === id ? { ...c, text, edited: true } : c)) });
          args.onEdit(id, text);
        }}
        onDelete={(id) => {
          set({ comments: t.comments.filter((c) => c.id !== id) });
          args.onDelete(id);
        }}
      />
    );
  },
} satisfies Meta<typeof CommentThread>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Resolved: Story = {
  args: { thread: FAILED_PRINT },
  parameters: { docs: { description: { story: 'Resolved threads collapse to the root comment and a reply count. Click the summary or the chevron to expand.' } } },
};

export const ResolvedExpanded: Story = {
  args: { thread: FAILED_PRINT, defaultExpanded: true },
};

export const AllRead: Story = {
  args: { thread: { ...SUPPORTS, comments: SUPPORTS.comments.map((c) => ({ ...c, unread: false })) } },
};

export const SomeoneElsesView: Story = {
  args: { currentUser: MEI },
  parameters: { docs: { description: { story: 'Signed in as Mei: Edit and Delete appear only on her own comment; others offer Copy link.' } } },
};

export const ThreadList: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="sb-stack" style={{ alignItems: 'stretch' }}>
      {[SUPPORTS, RESIN, FAILED_PRINT].map((t) => (
        <CommentThread key={t.id} {...args} thread={t} />
      ))}
    </div>
  ),
};
