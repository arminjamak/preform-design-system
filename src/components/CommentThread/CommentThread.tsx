import { useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CircleCheckIcon, LinkIcon, MessageSquareIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { ChatComposer } from '../ChatComposer/ChatComposer';
import { copyText } from '../CopyButton/CopyButton';
import { IconButton } from '../IconButton/IconButton';
import { Menu, type MenuItem } from '../Menu/Menu';
import { MentionInput, renderMentions, type MentionPerson } from '../MentionInput/MentionInput';
import s from './CommentThread.module.css';

export type ThreadComment = {
  id: string;
  author: MentionPerson;
  text: string;
  /** Display time, e.g. "Oct 8, 14:05". */
  time: string;
  /** Machine-readable timestamp for the `<time>` element. */
  dateTime?: string;
  edited?: boolean;
  /** Not yet seen by the current user. */
  unread?: boolean;
};

export type CommentThreadData = {
  id: string;
  resolved: boolean;
  /** First comment is the root; the rest are replies. */
  comments: ThreadComment[];
  /** What the thread is pinned to, e.g. "Support point 14 · Mini Chassis Kit". */
  context?: string;
};

export type CommentThreadProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  thread: CommentThreadData;
  /** Edit and Delete are offered only on this person's comments. */
  currentUser: MentionPerson;
  /** People for `@` mentions in replies and highlighting. Defaults to the thread's authors. */
  people?: MentionPerson[];
  onReply: (text: string) => void;
  /** Called with the new resolved state (true = Resolve, false = Reopen). */
  onResolve: (resolved: boolean) => void;
  onEdit: (commentId: string, text: string) => void;
  onDelete: (commentId: string) => void;
  /** Called after "Copy link" puts the link on the clipboard. */
  onCopyLink?: (commentId: string, link: string) => void;
  /** Builds the link copied by "Copy link". Defaults to `#comment-<id>`. */
  getCommentLink?: (comment: ThreadComment) => string;
  /** Start a resolved thread expanded instead of collapsed. */
  defaultExpanded?: boolean;
  replyPlaceholder?: string;
};

/** Comment thread pinned to a model or support: root comment, replies, resolve/reopen, per-comment actions and a reply composer. */
export function CommentThread({
  thread,
  currentUser,
  people,
  onReply,
  onResolve,
  onEdit,
  onDelete,
  onCopyLink,
  getCommentLink = (c) => `#comment-${c.id}`,
  defaultExpanded = false,
  replyPlaceholder = 'Reply… type @ to mention',
  className,
  ...rest
}: CommentThreadProps) {
  const uid = useId();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [reply, setReply] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const editRef = useRef<HTMLTextAreaElement>(null);

  // Focus the edit field with the caret at the end of the existing text.
  useEffect(() => {
    const el = editRef.current;
    if (!editingId || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [editingId]);

  const { comments, resolved, context } = thread;
  const known = people ?? Array.from(new Map(comments.map((c) => [c.author.id, c.author])).values());
  const [root, ...replies] = comments;
  const unreadCount = comments.filter((c) => c.unread).length;
  const collapsed = resolved && !expanded;

  const startEdit = (c: ThreadComment) => {
    setEditingId(c.id);
    setDraft(c.text);
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = (c: ThreadComment) => {
    const text = draft.trim();
    if (text && text !== c.text) onEdit(c.id, text);
    setEditingId(null);
  };

  const menuItems = (c: ThreadComment): MenuItem[] => {
    const mine = c.author.id === currentUser.id;
    const copy: MenuItem = {
      label: 'Copy link',
      icon: <LinkIcon strokeWidth={2.2} />,
      onSelect: () => {
        const link = getCommentLink(c);
        void copyText(link).then((ok) => {
          setAnnouncement(ok ? 'Link copied' : 'Could not copy the link');
          if (ok) onCopyLink?.(c.id, link);
        });
      },
    };
    if (!mine) return [copy];
    return [
      { label: 'Edit', icon: <PencilIcon strokeWidth={2.2} />, onSelect: () => startEdit(c), disabled: resolved },
      copy,
      { type: 'separator' },
      { label: 'Delete', icon: <Trash2Icon strokeWidth={2.2} />, onSelect: () => onDelete(c.id), danger: true },
    ];
  };

  const renderComment = (c: ThreadComment, index: number) => {
    const nameId = `${uid}-name-${c.id}`;
    const editing = editingId === c.id;
    const onEditKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        saveEdit(c);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    };
    return (
      <article
        key={c.id}
        id={`comment-${c.id}`}
        className={cx(s.comment, c.unread && s.unread)}
        aria-labelledby={nameId}
        aria-posinset={index + 1}
        aria-setsize={comments.length}
      >
        <Avatar name={c.author.name} src={c.author.avatar} size="sm" tone={c.author.id === currentUser.id ? 'accent' : 'neutral'} />
        <div className={s.body}>
          <div className={s.head}>
            <span id={nameId} className={s.name}>
              {c.author.name}
            </span>
            {c.unread && (
              <span className={s.dot}>
                <span className={s.srOnly}>Unread</span>
              </span>
            )}
            <time className={s.time} dateTime={c.dateTime}>
              {c.time}
            </time>
            {c.edited && <span className={s.time}>(edited)</span>}
            <Menu label={`Actions for ${c.author.name}’s comment`} items={menuItems(c)} buttonSize="xs" className={s.menu} />
          </div>
          {editing ? (
            <div className={s.edit}>
              <MentionInput
                ref={editRef}
                label="Edit comment"
                hideLabel
                value={draft}
                onChange={setDraft}
                people={known}
                rows={2}
                autoGrow
                fullWidth
                onKeyDown={onEditKey}
              />
              <div className={s.editActions}>
                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" disabled={!draft.trim() || draft.trim() === c.text} onClick={() => saveEdit(c)}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className={s.text}>{renderMentions(c.text, known)}</p>
          )}
        </div>
      </article>
    );
  };

  return (
    <section
      aria-label={context ? `Comment thread on ${context}` : 'Comment thread'}
      className={cx(s.root, resolved && s.resolved, className)}
      {...rest}
    >
      <header className={s.header}>
        {resolved ? (
          <Badge tone="success" variant="soft" icon={<CircleCheckIcon strokeWidth={2.4} />}>
            Resolved
          </Badge>
        ) : (
          <MessageSquareIcon className={s.headerIcon} strokeWidth={2.2} aria-hidden />
        )}
        <span className={s.context} title={context}>
          {context ?? 'Comments'}
        </span>
        {unreadCount > 0 && (
          <Badge tone="accent" variant="solid">
            {unreadCount} new
          </Badge>
        )}
        <Button
          size="sm"
          variant={resolved ? 'outline' : 'outlineAccent'}
          iconStart={resolved ? <RotateCcwIcon strokeWidth={2.4} /> : <CheckIcon strokeWidth={2.6} />}
          onClick={() => {
            onResolve(!resolved);
            setExpanded(false);
          }}
        >
          {resolved ? 'Reopen' : 'Resolve'}
        </Button>
        {resolved && (
          <IconButton
            label={expanded ? 'Collapse thread' : 'Expand thread'}
            icon={expanded ? <ChevronUpIcon strokeWidth={2.4} /> : <ChevronDownIcon strokeWidth={2.4} />}
            size="sm"
            aria-expanded={expanded}
            aria-controls={`${uid}-feed`}
            onClick={() => setExpanded((v) => !v)}
          />
        )}
      </header>

      {collapsed && root ? (
        <button type="button" className={s.summary} aria-expanded={false} aria-controls={`${uid}-feed`} onClick={() => setExpanded(true)}>
          <Avatar name={root.author.name} src={root.author.avatar} size="xs" tone="neutral" />
          <span className={s.summaryText}>
            <span className={s.name}>{root.author.name}</span> {root.text}
          </span>
          <span className={s.summaryCount}>
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </span>
        </button>
      ) : (
        <>
          <div id={`${uid}-feed`} role="feed" aria-label="Comments" className={s.feed}>
            {root && renderComment(root, 0)}
            {replies.length > 0 && (
              <div className={s.divider} aria-hidden="true">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </div>
            )}
            {replies.map((c, i) => renderComment(c, i + 1))}
          </div>
          {!resolved && (
            <div className={s.reply}>
              <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
              <ChatComposer
                layout="inline"
                label={`Reply to ${root?.author.name ?? 'thread'}`}
                placeholder={replyPlaceholder}
                value={reply}
                onChange={setReply}
                people={known}
                onSend={({ text }) => {
                  onReply(text);
                  setReply('');
                }}
                maxRows={4}
                className={s.composer}
              />
            </div>
          )}
        </>
      )}
      <span className={s.srOnly} aria-live="polite">
        {announcement}
      </span>
    </section>
  );
}
