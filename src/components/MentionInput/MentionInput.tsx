import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Avatar } from '../Avatar/Avatar';
import s from './MentionInput.module.css';

export type MentionPerson = {
  id: string;
  name: string;
  /** Shown muted beside the name in suggestions, e.g. "Print lab lead". */
  role?: string;
  /** Avatar image URL; initials are used when absent. */
  avatar?: string;
};

export type MentionSegment = { text: string; person?: MentionPerson };

const escapeRe = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Splits text into plain runs and `@Full Name` mentions of known people (longest names win). */
export function splitMentions(text: string, people: MentionPerson[]): MentionSegment[] {
  if (!text || people.length === 0) return [{ text }];
  const byName = new Map(people.map((p) => [p.name.toLowerCase(), p]));
  const names = [...people].sort((a, b) => b.name.length - a.name.length).map((p) => escapeRe(p.name));
  const re = new RegExp(`(?<![\\p{L}\\p{N}_])@(${names.join('|')})(?![\\p{L}\\p{N}_])`, 'giu');
  const out: MentionSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: text.slice(last, at) });
    out.push({ text: m[0], person: byName.get(m[1].toLowerCase()) });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/**
 * Renders message text with `@Full Name` mentions highlighted. Wrap the result in an element with
 * `white-space: pre-wrap` to keep line breaks. Colours follow `--mention-fg` / `--mention-bg` when a
 * parent sets them (ChatBubble does on accent bubbles).
 */
export function renderMentions(text: string, people: MentionPerson[]): ReactNode[] {
  return splitMentions(text, people).map((seg, i) =>
    seg.person ? (
      <span key={i} className={s.mention} data-person-id={seg.person.id}>
        {seg.text}
      </span>
    ) : (
      seg.text
    ),
  );
}

type Trigger = { start: number; query: string };

/** The `@query` the caret is currently inside, if any. */
function findTrigger(value: string, caret: number | null): Trigger | null {
  if (caret == null) return null;
  const before = value.slice(0, caret);
  const at = before.lastIndexOf('@');
  if (at < 0) return null;
  if (at > 0 && /[\p{L}\p{N}_]/u.test(before[at - 1])) return null; // e-mail addresses
  const query = before.slice(at + 1);
  if (query.length > 40 || /[\n@]/.test(query) || query.startsWith(' ')) return null;
  return { start: at, query };
}

function filterPeople(people: MentionPerson[], query: string, max: number) {
  const q = query.toLowerCase();
  return people
    .filter((p) => {
      const name = p.name.toLowerCase();
      return name.startsWith(q) || (!q.includes(' ') && name.split(/\s+/).some((w) => w.startsWith(q)));
    })
    .slice(0, max);
}

function highlightMatch(name: string, query: string) {
  if (!query) return name;
  const i = name.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return name;
  return (
    <>
      {name.slice(0, i)}
      <span className={s.match}>{name.slice(i, i + query.length)}</span>
      {name.slice(i + query.length)}
    </>
  );
}

function setRef<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T }).current = value;
}

export type MentionInputProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value' | 'rows'> &
  WithForcedState & {
    value: string;
    onChange: (value: string) => void;
    /** People that can be mentioned with `@`. */
    people: MentionPerson[];
    /** Visible label above the field; also the accessible name. */
    label: string;
    hideLabel?: boolean;
    placeholder?: string;
    /** Visible lines (minimum lines when `autoGrow`). */
    rows?: number;
    /** Grow with the content up to `maxRows`, then scroll. */
    autoGrow?: boolean;
    maxRows?: number;
    size?: 'sm' | 'md';
    /** `bare` drops border and background, for embedding inside a composer. */
    variant?: 'field' | 'bare';
    /** Where the suggestion list opens relative to the `@`. */
    suggestionPlacement?: 'bottom' | 'top';
    maxSuggestions?: number;
    /** Show the rendered text with highlighted mentions under the field. */
    showPreview?: boolean;
    invalid?: boolean;
    fullWidth?: boolean;
    onMention?: (person: MentionPerson) => void;
  };

/** Textarea with `@` mention autocomplete: a listbox of teammates filtered by name, and highlighted mentions behind the text. */
export const MentionInput = forwardRef<HTMLTextAreaElement, MentionInputProps>(function MentionInput(
  {
    value,
    onChange,
    people,
    label,
    hideLabel,
    placeholder,
    rows = 3,
    autoGrow = false,
    maxRows = 6,
    size = 'sm',
    variant = 'field',
    suggestionPlacement = 'bottom',
    maxSuggestions = 6,
    showPreview,
    invalid,
    fullWidth,
    disabled,
    onMention,
    className,
    style,
    id,
    'data-state': state,
    onKeyDown,
    onBlur,
    onFocus,
    onScroll,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const listId = `${autoId}-list`;
  const optionId = (i: number) => `${autoId}-opt-${i}`;

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const pendingCaret = useRef<number | null>(null);

  const [caret, setCaret] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0, h: 0 });

  const trigger = findTrigger(value, caret);
  const matches = trigger ? filterPeople(people, trigger.query, maxSuggestions) : [];
  const open = focused && !disabled && !!trigger && trigger.start !== dismissedAt && matches.length > 0;
  const activeIndex = Math.min(active, matches.length - 1);

  useEffect(() => setActive(0), [trigger?.query, trigger?.start]);
  useEffect(() => {
    if (!trigger) setDismissedAt(null);
  }, [trigger?.start]);

  // Restore the caret after inserting a mention (value round-trips through the parent).
  useLayoutEffect(() => {
    const ta = taRef.current;
    if (ta && pendingCaret.current != null) {
      ta.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  }, [value]);

  // Measure where the `@` sits so the list opens next to it.
  useLayoutEffect(() => {
    if (!open) return;
    const a = anchorRef.current;
    const m = mirrorRef.current;
    if (!a || !m) return;
    const h = a.offsetHeight;
    const y = Math.max(0, Math.min(a.offsetTop - m.scrollTop, m.clientHeight - h));
    setCoords((c) => (c.x === a.offsetLeft && c.y === y && c.h === h ? c : { x: a.offsetLeft, y, h }));
  }, [open, value, trigger?.start]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const select = (person: MentionPerson) => {
    if (!trigger || caret == null) return;
    const after = value.slice(caret);
    const inserted = `@${person.name}${after.startsWith(' ') ? '' : ' '}`;
    const next = value.slice(0, trigger.start) + inserted + after;
    const pos = trigger.start + inserted.length + (after.startsWith(' ') ? 1 : 0);
    pendingCaret.current = pos;
    setCaret(pos);
    onChange(next);
    onMention?.(person);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && !e.nativeEvent.isComposing) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const step = e.key === 'ArrowDown' ? 1 : -1;
        setActive((activeIndex + step + matches.length) % matches.length);
        return;
      }
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
        e.preventDefault();
        select(matches[activeIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setDismissedAt(trigger!.start);
        return;
      }
    }
    onKeyDown?.(e);
  };

  const mark = (text: string) =>
    splitMentions(text, people).map((seg, i) =>
      seg.person ? (
        <span key={i} className={s.mark}>
          {seg.text}
        </span>
      ) : (
        seg.text
      ),
    );
  const tail = value.endsWith('\n') || (value === '' && !placeholder) ? '\u200b' : '';

  const vars = {
    '--mi-rows': rows,
    '--mi-max-rows': Math.max(rows, maxRows),
    '--caret-x': coords.x,
    '--caret-y': coords.y,
    '--caret-h': coords.h,
    ...style,
  } as CSSProperties;

  return (
    <div className={cx(s.root, s[size], fullWidth && s.fullWidth, className)}>
      {!hideLabel && (
        <label htmlFor={inputId} className={s.label}>
          {label}
        </label>
      )}
      <div
        className={cx(s.box, s[variant], autoGrow && s.autoGrow, invalid && s.invalid, disabled && s.disabled)}
        data-state={state}
        style={vars}
      >
        <div ref={mirrorRef} className={s.mirror} aria-hidden="true">
          {open && trigger ? (
            <>
              {mark(value.slice(0, trigger.start))}
              <span ref={anchorRef}>{'\u2060'}</span>
              {mark(value.slice(trigger.start))}
            </>
          ) : (
            value ? mark(value) : placeholder
          )}
          {tail}
        </div>
        <textarea
          ref={(el) => {
            taRef.current = el;
            setRef(ref, el);
          }}
          id={inputId}
          aria-label={hideLabel ? label : undefined}
          aria-invalid={invalid || undefined}
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? optionId(activeIndex) : undefined}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={s.textarea}
          onChange={(e) => {
            setCaret(e.target.selectionStart);
            onChange(e.target.value);
          }}
          onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            setFocused(true);
            setCaret(e.currentTarget.selectionStart);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onScroll={(e) => {
            if (mirrorRef.current) mirrorRef.current.scrollTop = e.currentTarget.scrollTop;
            onScroll?.(e);
          }}
          {...rest}
        />
        {open && (
          <ul id={listId} role="listbox" aria-label="Mention a teammate" className={cx(s.list, suggestionPlacement === 'top' ? s.above : s.below)}>
            {matches.map((p, i) => (
              <li
                key={p.id}
                id={optionId(i)}
                role="option"
                aria-selected={i === activeIndex}
                className={s.option}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => select(p)}
              >
                <Avatar name={p.name} src={p.avatar} size="xs" />
                <span className={s.optionName}>{highlightMatch(p.name, trigger?.query ?? '')}</span>
                {p.role && <span className={s.optionRole}>{p.role}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <span className={s.srOnly} aria-live="polite">
        {open ? `${matches.length} ${matches.length === 1 ? 'person' : 'people'} found. Use up and down arrows to choose, Enter to insert.` : ''}
      </span>
      {showPreview && (
        <div className={s.preview}>
          <span className={s.previewLabel}>Preview</span>
          <p className={s.previewText}>{value ? renderMentions(value, people) : <span className={s.previewEmpty}>Nothing to preview yet</span>}</p>
        </div>
      )}
    </div>
  );
});
