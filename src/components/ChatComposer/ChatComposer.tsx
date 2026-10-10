import { forwardRef, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { BoxIcon, FileTextIcon, ImageIcon, PaperclipIcon, SendHorizontalIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { IconButton } from '../IconButton/IconButton';
import { MentionInput, type MentionPerson } from '../MentionInput/MentionInput';
import s from './ChatComposer.module.css';

export type ComposerAttachment = {
  id: string;
  name: string;
  /** Human-readable size, e.g. "18.4 MB". */
  size?: string;
  kind?: 'file' | 'image' | 'model';
};

export type ChatComposerSendPayload = { text: string; files: ComposerAttachment[] };

export type ChatComposerProps = WithForcedState & {
  value: string;
  onChange: (value: string) => void;
  /** Enter or the send button. Receives trimmed text and the current attachments. */
  onSend: (payload: ChatComposerSendPayload) => void;
  attachments?: ComposerAttachment[];
  /** Files picked with the attach button or dropped on the composer. Omit to hide the attach button. */
  onAttach?: (files: File[]) => void;
  onRemoveAttachment?: (id: string) => void;
  /** `accept` for the file picker, e.g. ".form,.stl,.3mf,image/*". */
  accept?: string;
  /** Enables `@` mentions in the input. */
  people?: MentionPerson[];
  placeholder?: string;
  disabled?: boolean;
  /** Names of people currently typing; renders "Priya is typing…". */
  typing?: string[];
  /** Emoji / reaction picker slot, rendered beside the attach button. */
  emoji?: ReactNode;
  /** Accessible name for the text input. */
  label?: string;
  /** `stacked`: input above a toolbar (chat panel). `inline`: single row (comment replies). */
  layout?: 'stacked' | 'inline';
  /** Lines the input grows to before scrolling. */
  maxRows?: number;
  className?: string;
};

const KIND_ICON = { file: FileTextIcon, image: ImageIcon, model: BoxIcon } as const;

const firstName = (name: string) => name.split(/\s+/)[0];

/** "Priya is typing…", "Priya and Diego are typing…", "Priya, Diego and Mei are typing…", "4 people are typing…". */
export function formatTyping(names: string[]): string {
  const n = names.map(firstName);
  if (n.length === 0) return '';
  if (n.length === 1) return `${n[0]} is typing…`;
  if (n.length === 2) return `${n[0]} and ${n[1]} are typing…`;
  if (n.length === 3) return `${n[0]}, ${n[1]} and ${n[2]} are typing…`;
  return `${n.length} people are typing…`;
}

/** Message composer: auto-growing input with `@` mentions, file chips, emoji slot and a send button. Enter sends, Shift+Enter adds a line. */
export const ChatComposer = forwardRef<HTMLTextAreaElement, ChatComposerProps>(function ChatComposer(
  {
    value,
    onChange,
    onSend,
    attachments = [],
    onAttach,
    onRemoveAttachment,
    accept,
    people = [],
    placeholder = 'Write a message…',
    disabled,
    typing = [],
    emoji,
    label = 'Message',
    layout = 'stacked',
    maxRows = 6,
    className,
    'data-state': state,
  },
  ref,
) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const canSend = !disabled && (value.trim().length > 0 || attachments.length > 0);
  const inline = layout === 'inline';

  const send = () => {
    if (!canSend) return;
    onSend({ text: value.trim(), files: attachments });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const dropProps = onAttach && !disabled
    ? {
        onDragOver: (e: DragEvent) => {
          if (!e.dataTransfer.types.includes('Files')) return;
          e.preventDefault();
          setDragging(true);
        },
        onDragLeave: (e: DragEvent) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
        },
        onDrop: (e: DragEvent) => {
          e.preventDefault();
          setDragging(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length) onAttach(files);
        },
      }
    : {};

  const attachButton = onAttach && (
    <>
      <IconButton label="Attach files" icon={<PaperclipIcon strokeWidth={2.2} />} size="sm" disabled={disabled} onClick={() => fileRef.current?.click()} />
      <input
        ref={fileRef}
        type="file"
        multiple
        accept={accept}
        hidden
        tabIndex={-1}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onAttach(files);
          e.target.value = '';
        }}
      />
    </>
  );

  const sendButton = (
    <IconButton
      label="Send message"
      icon={<SendHorizontalIcon strokeWidth={2.2} />}
      variant="filled"
      shape="circle"
      size="sm"
      disabled={!canSend}
      onClick={send}
      className={s.send}
    />
  );

  const typingText = formatTyping(typing);

  return (
    <div className={cx(s.root, className)}>
      <div
        className={cx(s.box, inline ? s.inline : s.stacked, disabled && s.disabled, dragging && s.dragging)}
        data-state={state}
        {...dropProps}
      >
        {attachments.length > 0 && (
          <ul className={s.chips} aria-label="Attachments">
            {attachments.map((a) => {
              const Icon = KIND_ICON[a.kind ?? 'file'];
              return (
                <li key={a.id} className={s.chip}>
                  <Icon strokeWidth={2.2} aria-hidden className={s.chipIcon} />
                  <span className={s.chipName} title={a.name}>
                    {a.name}
                  </span>
                  {a.size && <span className={s.chipSize}>{a.size}</span>}
                  {onRemoveAttachment && (
                    <IconButton
                      label={`Remove ${a.name}`}
                      icon={<XIcon strokeWidth={2.4} />}
                      size="xs"
                      disabled={disabled}
                      onClick={() => onRemoveAttachment(a.id)}
                      className={s.chipRemove}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className={s.row}>
          {inline && attachButton}
          <MentionInput
            ref={ref}
            className={s.input}
            label={label}
            hideLabel
            variant="bare"
            size="md"
            fullWidth
            autoGrow
            rows={1}
            maxRows={maxRows}
            suggestionPlacement="top"
            people={people}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            enterKeyHint="send"
          />
          {inline && (
            <span className={s.actions}>
              {emoji}
              {sendButton}
            </span>
          )}
        </div>
        {!inline && (
          <div className={s.toolbar}>
            {attachButton}
            {emoji}
            <span className={s.hint} aria-hidden="true">
              Shift + Enter for a new line
            </span>
            {sendButton}
          </div>
        )}
      </div>
      <div className={s.typing} aria-live="polite">
        {typingText && (
          <>
            <span className={s.dots} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            {typingText}
          </>
        )}
      </div>
    </div>
  );
});
