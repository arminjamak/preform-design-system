import { useId, useMemo, useRef, type CSSProperties, type HTMLAttributes, type KeyboardEvent } from 'react';
import { AlignLeftIcon, CircleAlertIcon, CircleCheckIcon, LockIcon, Minimize2Icon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { tokenizeLine, validateJson, type JsonIssue } from './jsonSyntax';
import s from './JsonEditor.module.css';

export type JsonEditorProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> &
  WithForcedState & {
    /** JSON source text (controlled). */
    value: string;
    /** Called with the new text on typing, Format and Minify. Optional in read-only mode. */
    onChange?: (value: string) => void;
    /** Visible label, also the textarea's accessible name. */
    label: string;
    /** Locks editing and hides Format/Minify; the text stays selectable. */
    readOnly?: boolean;
    /** Minimum visible lines; the editor grows with content up to `maxLines`. */
    minLines?: number;
    /** Lines shown before the editor scrolls. */
    maxLines?: number;
  };

const TOKEN_CLASS: Record<string, string | undefined> = {
  key: s.key,
  string: s.string,
  number: s.number,
  literal: s.literal,
  punct: s.punct,
  other: s.other,
};

/** Left/Right arrow navigation between toolbar buttons. */
function onToolbarKeyDown(e: KeyboardEvent<HTMLDivElement>) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  if (!(e.target instanceof HTMLButtonElement)) return;
  const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
  const i = buttons.indexOf(e.target);
  buttons[(i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
  e.preventDefault();
}

/**
 * Monospaced JSON editor (custom print profiles, printer API payloads): a plain textarea over a
 * syntax-coloured layer, line numbers, live validation with the failing line, Format and Minify.
 */
export function JsonEditor({
  value,
  onChange,
  label,
  readOnly = false,
  minLines = 6,
  maxLines = 24,
  className,
  'data-state': forcedState,
  ...rest
}: JsonEditorProps) {
  const id = useId();
  const statusId = `${id}-status`;
  const gutterRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLPreElement>(null);

  const lines = useMemo(() => value.split('\n'), [value]);
  const empty = value.trim() === '';
  const issue: JsonIssue | null = useMemo(() => (empty ? null : validateJson(value)), [value, empty]);
  const valid = !empty && !issue;
  const rows = Math.max(minLines, Math.min(maxLines, lines.length));

  const syncScroll = (el: HTMLTextAreaElement) => {
    if (gutterRef.current) gutterRef.current.scrollTop = el.scrollTop;
    if (layerRef.current) {
      layerRef.current.scrollTop = el.scrollTop;
      layerRef.current.scrollLeft = el.scrollLeft;
    }
  };

  const rewrite = (indent?: number) => {
    if (!valid || readOnly || !onChange) return;
    onChange(JSON.stringify(JSON.parse(value), null, indent));
  };

  const frameStyle = { '--je-rows': rows, ...(issue ? { '--je-error-line': issue.line - 1 } : null) } as CSSProperties;

  return (
    <div className={cx(s.editor, className)} {...rest}>
      <div className={s.header}>
        <label htmlFor={id} className={s.label}>
          {label}
        </label>
        {readOnly && (
          <Badge size="sm" icon={<LockIcon strokeWidth={2.4} />}>
            Read only
          </Badge>
        )}
        {!readOnly && (
          <div role="toolbar" aria-label={`${label} actions`} className={s.toolbar} onKeyDown={onToolbarKeyDown}>
            <Button size="sm" variant="ghost" iconStart={<AlignLeftIcon strokeWidth={2.2} />} disabled={!valid} onClick={() => rewrite(2)}>
              Format
            </Button>
            <Button size="sm" variant="ghost" iconStart={<Minimize2Icon strokeWidth={2.2} />} disabled={!valid} onClick={() => rewrite()}>
              Minify
            </Button>
          </div>
        )}
      </div>

      <div className={cx(s.frame, issue && s.invalid, readOnly && s.readOnly)} style={frameStyle} data-state={forcedState}>
        <div ref={gutterRef} className={s.gutter} aria-hidden="true">
          {lines.map((_, i) => (
            <div key={i} className={cx(s.lineNo, issue?.line === i + 1 && s.lineNoError)}>
              {i + 1}
            </div>
          ))}
        </div>
        <div className={s.code}>
          <pre ref={layerRef} className={s.layer} aria-hidden="true">
            {issue && <span className={s.errorBand} />}
            {lines.map((line, i) => (
              <span key={i}>
                {tokenizeLine(line).map((t, j) =>
                  t.kind === 'space' ? t.text : (
                    <span key={j} className={TOKEN_CLASS[t.kind]}>
                      {t.text}
                    </span>
                  ),
                )}
                {'\n'}
              </span>
            ))}
            {' '}
          </pre>
          <textarea
            id={id}
            className={s.textarea}
            value={value}
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            aria-invalid={issue ? true : undefined}
            aria-describedby={statusId}
            onChange={(e) => onChange?.(e.target.value)}
            onScroll={(e) => syncScroll(e.currentTarget)}
          />
        </div>
      </div>

      <div id={statusId} role="status" className={cx(s.status, issue ? s.statusError : valid ? s.statusOk : s.statusIdle)}>
        {issue ? (
          <>
            <CircleAlertIcon strokeWidth={2.2} aria-hidden="true" />
            <span>
              <strong>
                Line {issue.line}, column {issue.column}:
              </strong>{' '}
              {issue.message}
            </span>
          </>
        ) : valid ? (
          <>
            <CircleCheckIcon strokeWidth={2.2} aria-hidden="true" />
            <span>
              Valid JSON · {lines.length} {lines.length === 1 ? 'line' : 'lines'}
            </span>
          </>
        ) : (
          <span>Empty document</span>
        )}
      </div>
    </div>
  );
}
