import type { HTMLAttributes, ReactNode } from 'react';
import { BoxIcon, CheckCheckIcon, CheckIcon, CircleAlertIcon, ClockIcon, FileTextIcon, ImageIcon, RotateCcwIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Avatar } from '../Avatar/Avatar';
import { renderMentions, type MentionPerson } from '../MentionInput/MentionInput';
import s from './ChatBubble.module.css';

export type ChatAuthor = { id: string; name: string; avatar?: string };

export type ChatAttachment = {
  id: string;
  name: string;
  /** Human-readable size, e.g. "4.2 MB". */
  size?: string;
  /** Picks the chip icon. `model` covers .form / .stl / .3mf files. */
  kind?: 'file' | 'image' | 'model';
};

export type ChatMessageStatus = 'sending' | 'sent' | 'read' | 'failed';

export type ChatMessage = {
  id: string;
  author: ChatAuthor;
  text: string;
  /** Display time, e.g. "09:42". */
  time: string;
  /** Machine-readable timestamp for the `<time>` element. */
  dateTime?: string;
  status?: ChatMessageStatus;
  attachments?: ChatAttachment[];
  /** Quoted message this one replies to. */
  replyTo?: { author: string; text: string };
};

export type ChatBubbleProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  message: ChatMessage;
  /** The current user's message: accent bubble on the right. */
  own?: boolean;
  /** First message in a group: show avatar and name, and add group spacing above. */
  showAuthor?: boolean;
  /** Show the time / status line under the bubble. */
  showMeta?: boolean;
  /** Reaction chips rendered under the bubble (e.g. a ReactionPicker summary). */
  reactions?: ReactNode;
  /** Known people, so `@Full Name` mentions are highlighted. */
  people?: MentionPerson[];
  onRetry?: (message: ChatMessage) => void;
  onAttachmentClick?: (attachment: ChatAttachment) => void;
};

const KIND_ICON = { file: FileTextIcon, image: ImageIcon, model: BoxIcon } as const;

const STATUS_LABEL: Record<ChatMessageStatus, string> = { sending: 'Sending', sent: 'Sent', read: 'Read', failed: 'Not delivered' };

function StatusIcon({ status }: { status: ChatMessageStatus }) {
  const props = { strokeWidth: 2.4, 'aria-hidden': true, className: cx(s.statusIcon, s[status]) };
  if (status === 'sending') return <ClockIcon {...props} />;
  if (status === 'sent') return <CheckIcon {...props} />;
  if (status === 'read') return <CheckCheckIcon {...props} />;
  return <CircleAlertIcon {...props} />;
}

/** One chat message: accent bubble on the right for your own, surface bubble on the left for others. */
export function ChatBubble({
  message,
  own = false,
  showAuthor = true,
  showMeta = true,
  reactions,
  people = [],
  onRetry,
  onAttachmentClick,
  className,
  ...rest
}: ChatBubbleProps) {
  const { author, text, time, dateTime, status, attachments, replyTo } = message;
  const failed = status === 'failed';

  return (
    <article
      aria-label={`${own ? 'You' : author.name}, ${time}`}
      className={cx(s.root, own ? s.own : s.other, showAuthor && s.first, className)}
      {...rest}
    >
      {!own && <span className={s.avatarSlot}>{showAuthor && <Avatar name={author.name} src={author.avatar} size="sm" tone="neutral" />}</span>}
      <div className={s.column}>
        {showAuthor && !own && <span className={s.author}>{author.name}</span>}
        <div className={cx(s.bubble, failed && s.bubbleFailed)}>
          {replyTo && (
            <blockquote className={s.quote}>
              <span className={s.quoteAuthor}>{replyTo.author}</span>
              <span className={s.quoteText}>{replyTo.text}</span>
            </blockquote>
          )}
          {text && <p className={s.text}>{renderMentions(text, people)}</p>}
          {attachments && attachments.length > 0 && (
            <ul className={s.attachments} aria-label="Attachments">
              {attachments.map((a) => {
                const Icon = KIND_ICON[a.kind ?? 'file'];
                const body = (
                  <>
                    <Icon strokeWidth={2.2} aria-hidden />
                    <span className={s.chipName}>{a.name}</span>
                    {a.size && <span className={s.chipSize}>{a.size}</span>}
                  </>
                );
                return (
                  <li key={a.id}>
                    {onAttachmentClick ? (
                      <button type="button" className={cx(s.chip, s.chipButton)} onClick={() => onAttachmentClick(a)}>
                        {body}
                      </button>
                    ) : (
                      <span className={s.chip}>{body}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {reactions && <div className={s.reactions}>{reactions}</div>}
        {(showMeta || failed) && (
          <div className={s.meta}>
            <time dateTime={dateTime}>{time}</time>
            {own && status && (
              <span className={cx(s.status, s[status])}>
                <StatusIcon status={status} />
                <span className={failed ? undefined : s.srOnly}>{STATUS_LABEL[status]}</span>
              </span>
            )}
            {failed && onRetry && (
              <button type="button" className={s.retry} onClick={() => onRetry(message)}>
                <RotateCcwIcon strokeWidth={2.4} aria-hidden />
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
