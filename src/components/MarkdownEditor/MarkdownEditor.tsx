import { useCallback, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { BoldIcon, CodeIcon, Heading2Icon, ItalicIcon, LinkIcon, ListIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Tabs } from '../Tabs/Tabs';
import { EditorToolbar, isShortcut, type EditorToolbarAction } from './EditorToolbar';
import { MarkdownPreview } from './markdown';
import s from './MarkdownEditor.module.css';

export { MarkdownPreview, renderMarkdown, type MarkdownPreviewProps } from './markdown';

export type MarkdownEditorMode = 'split' | 'tabs';

export type MarkdownEditorProps = {
  /** Visible label; also names the textarea. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** `split`: source and preview side by side (stacks when narrow). `tabs`: Write / Preview tabs. */
  mode?: MarkdownEditorMode;
  placeholder?: string;
  /** Token expression for the editing area height, e.g. `calc(var(--space-24) * 3)`. */
  height?: string;
  disabled?: boolean;
  /** Initial tab in `tabs` mode. */
  defaultTab?: 'write' | 'preview';
  className?: string;
};

type Format = 'bold' | 'italic' | 'code';
const SPAN_RE: Record<Format, RegExp> = {
  bold: /\*\*(?=\S)(.*?\S)\*\*|__(?=\S)(.*?\S)__/g,
  italic: /(?<![\w*])_(?=\S)(.*?\S)_(?!\w)|(?<!\*)\*(?=[^\s*])(.*?[^\s*])\*(?!\*)/g,
  code: /`([^`\n]+)`/g,
};
const MARKER: Record<Format, string> = { bold: '**', italic: '_', code: '`' };
const PLACEHOLDER: Record<Format, string> = { bold: 'bold text', italic: 'emphasis', code: 'code' };
const HEADING_RE = /^#{1,6}\s+/;
const LIST_RE = /^(\s*)[-*+]\s+/;

/** Finds the formatted span (in absolute offsets) that contains the selection on its line. */
function findSpan(value: string, start: number, end: number, format: Format) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEndIdx = value.indexOf('\n', start);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
  if (end > lineEnd) return null;
  const line = value.slice(lineStart, lineEnd);
  const re = new RegExp(SPAN_RE[format].source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const from = lineStart + m.index;
    const to = from + m[0].length;
    if (start >= from && end <= to) {
      const inner = m[1] ?? m[2] ?? '';
      const markerLen = (m[0].length - inner.length) / 2;
      return { from, to, inner, markerLen };
    }
  }
  return null;
}

function lineBounds(value: string, start: number, end: number) {
  const from = value.lastIndexOf('\n', start - 1) + 1;
  const endIdx = value.indexOf('\n', Math.max(end - (end > start && value[end - 1] === '\n' ? 1 : 0), start));
  return { from, to: endIdx === -1 ? value.length : endIdx };
}

/** Markdown source editor with a formatting toolbar and a safe live preview (split or tabbed). */
export function MarkdownEditor({
  label,
  value,
  onChange,
  mode = 'split',
  placeholder,
  height,
  disabled,
  defaultTab = 'write',
  className,
}: MarkdownEditorProps) {
  const id = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'write' | 'preview'>(defaultTab);
  const [sel, setSel] = useState<[number, number]>([0, 0]);
  const pending = useRef<[number, number] | null>(null);
  const showWrite = mode === 'split' || tab === 'write';
  const showPreview = mode === 'split' || tab === 'preview';

  const syncSel = useCallback(() => {
    const el = area.current;
    if (el) setSel([el.selectionStart, el.selectionEnd]);
  }, []);

  useLayoutEffect(() => {
    const el = area.current;
    if (el && pending.current) {
      el.focus();
      el.setSelectionRange(pending.current[0], pending.current[1]);
      pending.current = null;
      syncSel();
    }
  }, [value, syncSel]);

  /** Replaces [from, to) and selects [selStart, selEnd); uses insertText so Ctrl+Z works. */
  const edit = (from: number, to: number, text: string, selStart: number, selEnd = selStart) => {
    const el = area.current;
    if (!el || disabled) return;
    el.focus();
    el.setSelectionRange(from, to);
    const expected = value.slice(0, from) + text + value.slice(to);
    let native = false;
    try {
      native = document.execCommand('insertText', false, text);
    } catch {
      native = false;
    }
    if (native && el.value === expected) {
      el.setSelectionRange(selStart, selEnd);
      syncSel();
    } else {
      pending.current = [selStart, selEnd];
      onChange(expected);
    }
  };

  const toggleInline = (format: Format) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const marker = MARKER[format];
    const selected = value.slice(start, end);
    if (format === 'code' && selected.includes('\n')) {
      const { from, to } = lineBounds(value, start, end);
      const block = value.slice(from, to);
      const fenced = `\`\`\`\n${block}\n\`\`\``;
      edit(from, to, fenced, from + 4, from + 4 + block.length);
      return;
    }
    const span = findSpan(value, start, end, format);
    if (span) {
      const offset = start - span.from - span.markerLen;
      const newStart = span.from + Math.max(0, Math.min(offset, span.inner.length));
      edit(span.from, span.to, span.inner, newStart, newStart + Math.min(end - start, span.inner.length));
      return;
    }
    const text = selected || PLACEHOLDER[format];
    edit(start, end, `${marker}${text}${marker}`, start + marker.length, start + marker.length + text.length);
  };

  const toggleLinePrefix = (kind: 'heading' | 'list') => {
    const el = area.current;
    if (!el) return;
    const { from, to } = lineBounds(value, el.selectionStart, el.selectionEnd);
    const lines = value.slice(from, to).split('\n');
    const re = kind === 'heading' ? HEADING_RE : LIST_RE;
    const allOn = lines.every((l) => (kind === 'heading' ? /^##\s/.test(l) : re.test(l)) || l.trim() === '');
    const next = lines
      .map((l) => {
        if (l.trim() === '' && lines.length > 1) return l;
        if (allOn) return l.replace(re, kind === 'list' ? '$1' : '');
        return kind === 'heading' ? `## ${l.replace(HEADING_RE, '')}` : re.test(l) ? l : `- ${l}`;
      })
      .join('\n');
    edit(from, to, next, lines.length > 1 ? from : from + next.length, from + next.length);
  };

  const insertLink = () => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end);
    const isUrl = /^https?:\/\/\S+$/.test(selected);
    if (isUrl) {
      const text = `[link text](${selected})`;
      edit(start, end, text, start + 1, start + 10);
      return;
    }
    const label = selected || 'link text';
    const url = 'https://';
    const text = `[${label}](${url})`;
    const urlStart = start + label.length + 3;
    edit(start, end, text, selected ? urlStart : start + 1, selected ? urlStart + url.length : start + 1 + label.length);
  };

  const [selStart, selEnd] = sel;
  const lineOf = (() => {
    const from = value.lastIndexOf('\n', selStart - 1) + 1;
    const idx = value.indexOf('\n', selStart);
    return value.slice(from, idx === -1 ? value.length : idx);
  })();
  const writeDisabled = disabled || !showWrite;

  const actions: EditorToolbarAction[] = [
    { id: 'bold', label: 'Bold', icon: <BoldIcon strokeWidth={2.2} />, shortcutKey: 'B', pressed: !!findSpan(value, selStart, selEnd, 'bold'), onAction: () => toggleInline('bold') },
    { id: 'italic', label: 'Italic', icon: <ItalicIcon strokeWidth={2.2} />, shortcutKey: 'I', pressed: !!findSpan(value, selStart, selEnd, 'italic'), onAction: () => toggleInline('italic') },
    { id: 'heading', label: 'Heading', icon: <Heading2Icon strokeWidth={2} />, pressed: /^##\s/.test(lineOf), groupStart: true, onAction: () => toggleLinePrefix('heading') },
    { id: 'list', label: 'Bulleted list', icon: <ListIcon strokeWidth={2} />, pressed: LIST_RE.test(lineOf), onAction: () => toggleLinePrefix('list') },
    { id: 'link', label: 'Insert link', icon: <LinkIcon strokeWidth={2} />, shortcutKey: 'K', groupStart: true, onAction: insertLink },
    { id: 'code', label: 'Code', icon: <CodeIcon strokeWidth={2} />, pressed: !!findSpan(value, selStart, selEnd, 'code'), onAction: () => toggleInline('code') },
  ];

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isShortcut(e, 'b')) toggleInline('bold');
    else if (isShortcut(e, 'i')) toggleInline('italic');
    else if (isShortcut(e, 'k')) insertLink();
    else return;
    e.preventDefault();
  };

  const onTabsKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const next = e.key === 'Home' ? 'write' : e.key === 'End' ? 'preview' : tab === 'write' ? 'preview' : 'write';
    setTab(next);
    requestAnimationFrame(() => tabsRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus());
  };

  const style = height ? ({ '--me-h': height } as CSSProperties) : undefined;
  const labelId = `${id}-label`;

  return (
    <div className={cx(s.root, disabled && s.disabled, className)} style={style}>
      <label id={labelId} htmlFor={`${id}-input`} className={s.label}>
        {label}
      </label>
      <div className={s.frame}>
        <div className={s.bar}>
          {mode === 'tabs' ? (
            <div ref={tabsRef} onKeyDown={onTabsKeyDown} className={s.tabsWrap}>
              <Tabs
                label={`${label} view`}
                value={tab}
                onChange={setTab}
                className={s.tabs}
                items={[
                  { value: 'write', label: 'Write' },
                  { value: 'preview', label: 'Preview' },
                ]}
              />
            </div>
          ) : (
            <span className={s.barCaption} aria-hidden>
              Markdown
            </span>
          )}
          <span className={s.spacer} />
          <EditorToolbar label={`${label} formatting`} actions={actions} disabled={writeDisabled} />
        </div>
        <div className={cx(s.body, mode === 'split' ? s.split : s.tabbed)}>
          <div className={s.writePane} hidden={!showWrite} role={mode === 'tabs' ? 'tabpanel' : undefined} aria-label={mode === 'tabs' ? 'Write' : undefined}>
            <textarea
              ref={area}
              id={`${id}-input`}
              className={s.input}
              value={value}
              placeholder={placeholder}
              disabled={disabled}
              spellCheck
              onChange={(e) => {
                onChange(e.target.value);
                syncSel();
              }}
              onSelect={syncSel}
              onKeyUp={syncSel}
              onClick={syncSel}
              onKeyDown={onKeyDown}
            />
          </div>
          <div
            className={s.previewPane}
            hidden={!showPreview}
            role={mode === 'tabs' ? 'tabpanel' : 'region'}
            aria-label={`${label} preview`}
            tabIndex={0}
          >
            <MarkdownPreview source={value} size="sm" className={s.preview} />
          </div>
        </div>
      </div>
    </div>
  );
}
