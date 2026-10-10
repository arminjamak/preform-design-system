import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { HighlightedLine } from '../CodeBlock/HighlightedLine';
import { LANGUAGE_LABELS, resolveLanguage, tokenize, type CodeLanguage } from '../CodeBlock/tokenize';
import s from './CodeEditor.module.css';

export type CodeEditorProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'children' | 'wrap'> &
  WithForcedState & {
    /** Visible label above the editor; also the textarea's accessible name. */
    label: string;
    value: string;
    onChange: (value: string) => void;
    /** `typescript`, `javascript`, `json`, `python`, `bash`, `gcode`, `css` or `text` (aliases accepted). */
    language?: CodeLanguage | string;
    readOnly?: boolean;
    /** Minimum visible height in lines. */
    minLines?: number;
    /** Token expression capping the height before scrolling, e.g. `calc(var(--space-24) * 3)`. */
    maxHeight?: string;
    showLineNumbers?: boolean;
    /** Spaces inserted by Tab. Defaults to 4 for Python, 2 otherwise. */
    tabSize?: number;
    invalid?: boolean;
  };

const OPENERS = /[{[(]$/;

/** Lightweight code editor: a transparent textarea over a highlighted `pre`, with gutter, Tab indent and auto-indent. */
export const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(function CodeEditor(
  {
    label,
    value,
    onChange,
    language = 'text',
    readOnly,
    minLines = 6,
    maxHeight,
    showLineNumbers = true,
    tabSize,
    invalid,
    disabled,
    className,
    style,
    id,
    onKeyDown,
    onFocus,
    onBlur,
    onSelect,
    'data-state': state,
    'aria-describedby': describedBy,
    ...rest
  },
  ref,
) {
  const lang = resolveLanguage(language);
  const indentUnit = ' '.repeat(tabSize ?? (lang === 'python' ? 4 : 2));
  const lines = useMemo(() => tokenize(value, lang), [value, lang]);
  const area = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => area.current as HTMLTextAreaElement);

  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const hintId = `${autoId}-hint`;
  const [focused, setFocused] = useState(false);
  const [caretLine, setCaretLine] = useState(0);
  const tabEscapes = useRef(false);
  const pendingSelection = useRef<[number, number] | null>(null);

  const syncCaret = useCallback(() => {
    const el = area.current;
    if (!el) return;
    let n = 0;
    for (let i = 0; i < el.selectionStart; i++) if (el.value.charCodeAt(i) === 10) n++;
    setCaretLine(n);
  }, []);

  useLayoutEffect(() => {
    const el = area.current;
    const sel = pendingSelection.current;
    if (el && sel) {
      el.setSelectionRange(sel[0], sel[1]);
      pendingSelection.current = null;
      syncCaret();
    }
  }, [value, syncCaret]);

  /** Replaces [start, end) with `text`, keeping native undo where the browser allows it. */
  const replaceRange = (start: number, end: number, text: string, selStart: number, selEnd = selStart) => {
    const el = area.current;
    if (!el) return;
    el.setSelectionRange(start, end);
    let native = false;
    try {
      native = document.execCommand('insertText', false, text);
    } catch {
      native = false;
    }
    if (native && el.value === value.slice(0, start) + text + value.slice(end)) {
      el.setSelectionRange(selStart, selEnd);
      syncCaret();
      return;
    }
    pendingSelection.current = [selStart, selEnd];
    onChange(value.slice(0, start) + text + value.slice(end));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || readOnly || disabled) return;
    const el = e.currentTarget;
    const { selectionStart: start, selectionEnd: end } = el;

    if (e.key === 'Escape') {
      tabEscapes.current = true;
      return;
    }
    if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (tabEscapes.current) {
        tabEscapes.current = false;
        return; // let focus move on
      }
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const multi = value.slice(start, end).includes('\n');
      if (!e.shiftKey && !multi) {
        replaceRange(start, end, indentUnit, start + indentUnit.length);
        return;
      }
      // Indent / outdent every selected line.
      const block = value.slice(lineStart, end);
      const blockLines = block.split('\n');
      let firstDelta = 0;
      const next = blockLines.map((line, i) => {
        if (!e.shiftKey) {
          if (i === 0) firstDelta = indentUnit.length;
          return indentUnit + line;
        }
        const strip = line.match(new RegExp(`^ {1,${indentUnit.length}}|^\\t`))?.[0].length ?? 0;
        if (i === 0) firstDelta = -strip;
        return line.slice(strip);
      });
      const replaced = next.join('\n');
      const newStart = Math.max(lineStart, start + firstDelta);
      replaceRange(lineStart, end, replaced, multi ? lineStart : newStart, multi ? lineStart + replaced.length : newStart);
      return;
    }
    tabEscapes.current = false;

    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const before = value.slice(lineStart, start);
      const indent = before.match(/^[ \t]*/)?.[0] ?? '';
      const trimmed = before.trimEnd();
      const opens = OPENERS.test(trimmed) || (lang === 'python' && trimmed.endsWith(':'));
      const closer = value.charAt(end);
      const closes = opens && /[}\])]/.test(closer) && lang !== 'python';
      const insert = opens ? `\n${indent}${indentUnit}${closes ? `\n${indent}` : ''}` : `\n${indent}`;
      const caret = start + 1 + indent.length + (opens ? indentUnit.length : 0);
      replaceRange(start, end, insert, caret);
    }
  };

  const rootStyle = {
    ...style,
    '--ce-min-lines': minLines,
    ...(maxHeight ? { '--ce-max-h': maxHeight } : null),
  } as CSSProperties;

  return (
    <div className={cx(s.root, className)} style={rootStyle}>
      <div className={s.labelRow}>
        <label htmlFor={inputId} className={s.label}>
          {label}
        </label>
        <span className={s.lang} aria-hidden>
          {LANGUAGE_LABELS[lang]}
          {readOnly ? ' · read-only' : ''}
        </span>
      </div>
      <div
        className={cx(s.frame, focused && s.focused, invalid && s.invalid, disabled && s.disabled, readOnly && s.readOnly, maxHeight && s.capped)}
        data-state={state}
      >
        <div className={cx(s.grid, showLineNumbers && s.numbered)}>
          {showLineNumbers && (
            <div className={s.gutter} aria-hidden>
              {lines.map((_, i) => (
                <div key={i} className={cx(s.gutterLine, focused && i === caretLine && s.gutterCurrent)}>
                  {i + 1}
                </div>
              ))}
            </div>
          )}
          <div className={s.stack}>
            <pre className={s.highlight} aria-hidden>
              {lines.map((tokens, i) => (
                <div key={i} className={cx(s.line, focused && !readOnly && i === caretLine && s.current)}>
                  <HighlightedLine tokens={tokens} />
                </div>
              ))}
            </pre>
            <textarea
              ref={area}
              id={inputId}
              className={s.input}
              value={value}
              readOnly={readOnly}
              disabled={disabled}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              wrap="off"
              rows={1}
              cols={1}
              aria-invalid={invalid || undefined}
              aria-describedby={cx(readOnly ? undefined : hintId, describedBy) || undefined}
              onChange={(e) => {
                onChange(e.target.value);
                syncCaret();
              }}
              onKeyDown={handleKeyDown}
              onKeyUp={syncCaret}
              onClick={syncCaret}
              onSelect={(e) => {
                syncCaret();
                onSelect?.(e);
              }}
              onFocus={(e) => {
                setFocused(true);
                syncCaret();
                onFocus?.(e);
              }}
              onBlur={(e) => {
                setFocused(false);
                tabEscapes.current = false;
                onBlur?.(e);
              }}
              {...rest}
            />
          </div>
        </div>
      </div>
      {!readOnly && (
        <span id={hintId} className={s.srOnly}>
          Tab inserts {indentUnit.length} spaces, Shift+Tab outdents. Press Escape, then Tab, to leave the editor.
        </span>
      )}
    </div>
  );
});
