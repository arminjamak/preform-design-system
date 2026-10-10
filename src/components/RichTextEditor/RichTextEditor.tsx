import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  BoldIcon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  RemoveFormattingIcon,
  TextQuoteIcon,
  UnderlineIcon,
} from 'lucide-react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { TextField } from '../TextField/TextField';
import { Prose } from '../Prose/Prose';
import { EditorToolbar, isShortcut, type EditorToolbarAction } from '../MarkdownEditor/EditorToolbar';
import { safeHref } from '../MarkdownEditor/markdown';
import { sanitizeHtml } from './sanitize';
import s from './RichTextEditor.module.css';

export type RichTextCommand = 'bold' | 'italic' | 'underline' | 'h2' | 'h3' | 'bulletList' | 'numberedList' | 'link' | 'quote' | 'clear';

export const DEFAULT_RICH_TEXT_TOOLBAR: RichTextCommand[] = ['bold', 'italic', 'underline', 'h2', 'h3', 'bulletList', 'numberedList', 'link', 'quote', 'clear'];

export type RichTextEditorProps = {
  /** Visible label; also names the editable region. */
  label: string;
  /** HTML content. Sanitised before it is placed in the editor. */
  value: string;
  /** Receives the editor's HTML after every edit (empty string when cleared). */
  onChange: (html: string) => void;
  placeholder?: string;
  /** Which toolbar buttons to show, in order. */
  toolbar?: RichTextCommand[];
  disabled?: boolean;
  /** Token expression for the minimum editing height, e.g. `calc(var(--space-24) * 2)`. */
  minHeight?: string;
  className?: string;
};

type ActiveState = Partial<Record<RichTextCommand, boolean>>;

const META: Record<RichTextCommand, { label: string; icon: ReactNode; shortcutKey?: string; groupStart?: boolean; toggle: boolean }> = {
  bold: { label: 'Bold', icon: <BoldIcon strokeWidth={2.2} />, shortcutKey: 'B', toggle: true },
  italic: { label: 'Italic', icon: <ItalicIcon strokeWidth={2.2} />, shortcutKey: 'I', toggle: true },
  underline: { label: 'Underline', icon: <UnderlineIcon strokeWidth={2.2} />, shortcutKey: 'U', toggle: true },
  h2: { label: 'Heading 2', icon: <Heading2Icon strokeWidth={2} />, groupStart: true, toggle: true },
  h3: { label: 'Heading 3', icon: <Heading3Icon strokeWidth={2} />, toggle: true },
  bulletList: { label: 'Bulleted list', icon: <ListIcon strokeWidth={2} />, groupStart: true, toggle: true },
  numberedList: { label: 'Numbered list', icon: <ListOrderedIcon strokeWidth={2} />, toggle: true },
  link: { label: 'Link', icon: <LinkIcon strokeWidth={2} />, shortcutKey: 'K', groupStart: true, toggle: true },
  quote: { label: 'Quote', icon: <TextQuoteIcon strokeWidth={2} />, toggle: true },
  clear: { label: 'Clear formatting', icon: <RemoveFormattingIcon strokeWidth={2} />, groupStart: true, toggle: false },
};

/** Empty editor → '', and Chrome's <b>/<i> → <strong>/<em> so output matches the sanitiser. */
const normalize = (html: string) =>
  /^(?:<p>)?(?:<br\s*\/?>)?(?:<\/p>)?$/i.test(html.trim()) ? '' : html.replace(/<(\/?)b>/gi, '<$1strong>').replace(/<(\/?)i>/gi, '<$1em>');

const run = (command: string, arg?: string) => {
  try {
    return document.execCommand(command, false, arg);
  } catch {
    return false;
  }
};

/** WYSIWYG editor on contentEditable + execCommand, with toolbar state from queryCommandState. Emits HTML. */
export function RichTextEditor({ label, value, onChange, placeholder, toolbar = DEFAULT_RICH_TEXT_TOOLBAR, disabled, minHeight, className }: RichTextEditorProps) {
  const id = useId();
  const editor = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string | null>(null);
  const savedRange = useRef<Range | null>(null);
  const linkTarget = useRef<HTMLAnchorElement | null>(null);
  const [active, setActive] = useState<ActiveState>({});
  const [empty, setEmpty] = useState(!value);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [focused, setFocused] = useState(false);

  // Push external value changes into the DOM (skip our own echoes so the caret is not reset).
  useLayoutEffect(() => {
    const el = editor.current;
    if (!el || value === lastEmitted.current) return;
    const clean = sanitizeHtml(value);
    if (el.innerHTML !== clean) el.innerHTML = clean;
    lastEmitted.current = value;
    setEmpty(!el.textContent?.trim() && !el.querySelector('li, hr'));
  }, [value]);

  const selectionInEditor = useCallback(() => {
    const sel = window.getSelection();
    const el = editor.current;
    if (!sel || !sel.rangeCount || !el) return null;
    const range = sel.getRangeAt(0);
    return el.contains(range.commonAncestorContainer) ? range : null;
  }, []);

  const closest = useCallback((selector: string) => {
    const range = selectionInEditor();
    const el = editor.current;
    if (!range || !el) return null;
    const node = range.startContainer;
    const start = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    const found = start?.closest(selector);
    return found && el.contains(found) && found !== el ? found : null;
  }, [selectionInEditor]);

  const refreshState = useCallback(() => {
    if (!selectionInEditor()) return;
    const q = (cmd: string) => {
      try {
        return document.queryCommandState(cmd);
      } catch {
        return false;
      }
    };
    const block = closest('h2, h3, h4, blockquote, p, li');
    setActive({
      bold: q('bold'),
      italic: q('italic'),
      underline: !!closest('u') || (q('underline') && !closest('a')),
      bulletList: q('insertUnorderedList') || !!closest('ul'),
      numberedList: q('insertOrderedList') || !!closest('ol'),
      h2: block?.tagName === 'H2',
      h3: block?.tagName === 'H3',
      quote: !!closest('blockquote'),
      link: !!closest('a'),
    });
  }, [closest, selectionInEditor]);

  useEffect(() => {
    document.addEventListener('selectionchange', refreshState);
    return () => document.removeEventListener('selectionchange', refreshState);
  }, [refreshState]);

  const emit = () => {
    const el = editor.current;
    if (!el) return;
    const html = normalize(el.innerHTML);
    setEmpty(!el.textContent?.trim() && !el.querySelector('li, hr'));
    if (html === lastEmitted.current) return;
    lastEmitted.current = html;
    onChange(html);
  };

  const restoreRange = () => {
    const range = savedRange.current;
    const sel = window.getSelection();
    editor.current?.focus();
    if (range && sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  const openLink = () => {
    const range = selectionInEditor();
    if (!range) {
      editor.current?.focus();
    }
    savedRange.current = selectionInEditor()?.cloneRange() ?? null;
    const anchor = closest('a') as HTMLAnchorElement | null;
    linkTarget.current = anchor;
    setLinkUrl(anchor?.getAttribute('href') ?? '');
    setLinkOpen(true);
  };

  const closeLink = () => {
    setLinkOpen(false);
    restoreRange();
  };

  const applyLink = () => {
    const href = safeHref(linkUrl);
    if (!href) return;
    restoreRange();
    const external = /^https?:/i.test(href);
    if (linkTarget.current && editor.current?.contains(linkTarget.current)) {
      linkTarget.current.setAttribute('href', href);
    } else {
      const range = savedRange.current;
      if (range && !range.collapsed) {
        run('createLink', href);
      } else {
        run('insertHTML', `<a href="${href.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}">${href.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</a>&nbsp;`);
      }
    }
    if (external) {
      editor.current?.querySelectorAll(`a[href]`).forEach((a) => {
        if (/^https?:/i.test(a.getAttribute('href') ?? '')) {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        }
      });
    }
    setLinkOpen(false);
    emit();
    refreshState();
  };

  const removeLink = () => {
    restoreRange();
    const anchor = linkTarget.current;
    if (anchor && editor.current?.contains(anchor)) {
      const range = document.createRange();
      range.selectNodeContents(anchor);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    run('unlink');
    setLinkOpen(false);
    emit();
    refreshState();
  };

  const command = (cmd: RichTextCommand) => {
    if (disabled) return;
    if (cmd === 'link') {
      if (linkOpen) closeLink();
      else openLink();
      return;
    }
    const el = editor.current;
    if (!el) return;
    if (!selectionInEditor()) el.focus();
    run('styleWithCSS', 'false');
    switch (cmd) {
      case 'bold':
      case 'italic':
      case 'underline':
        run(cmd);
        break;
      case 'h2':
      case 'h3':
        run('formatBlock', active[cmd] ? '<p>' : `<${cmd}>`);
        break;
      case 'quote':
        run('formatBlock', active.quote ? '<p>' : '<blockquote>');
        break;
      case 'bulletList':
        run('insertUnorderedList');
        break;
      case 'numberedList':
        run('insertOrderedList');
        break;
      case 'clear':
        run('removeFormat');
        run('unlink');
        if (!closest('li')) run('formatBlock', '<p>');
        break;
    }
    emit();
    refreshState();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, RichTextCommand> = { b: 'bold', i: 'italic', u: 'underline', k: 'link' };
    const hit = Object.keys(map).find((k) => isShortcut(e, k));
    if (hit && toolbar.includes(map[hit])) {
      e.preventDefault();
      command(map[hit]);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    if (html) run('insertHTML', sanitizeHtml(html));
    else run('insertText', e.clipboardData.getData('text/plain'));
    emit();
  };

  const actions: EditorToolbarAction[] = toolbar.map((cmd) => ({
    id: cmd,
    label: META[cmd].label,
    icon: META[cmd].icon,
    shortcutKey: META[cmd].shortcutKey,
    groupStart: META[cmd].groupStart,
    pressed: META[cmd].toggle ? (cmd === 'link' ? linkOpen || !!active.link : !!active[cmd]) : undefined,
    onAction: () => command(cmd),
  }));

  const labelId = `${id}-label`;
  const linkInvalid = linkUrl.trim() !== '' && !safeHref(linkUrl);
  const style = minHeight ? ({ '--rte-min-h': minHeight } as CSSProperties) : undefined;

  return (
    <div className={cx(s.root, disabled && s.disabled, className)} style={style}>
      <span id={labelId} className={s.label} onClick={() => editor.current?.focus()}>
        {label}
      </span>
      <div className={cx(s.frame, focused && s.focused)}>
        <div className={s.bar}>
          <EditorToolbar label={`${label} formatting`} actions={actions} disabled={disabled} />
        </div>
        {linkOpen && (
          <div className={s.linkRow} role="group" aria-label="Edit link">
            <TextField
              label="Link URL"
              value={linkUrl}
              onChange={setLinkUrl}
              placeholder="https://support.formlabs.com/…"
              invalid={linkInvalid}
              fullWidth
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  closeLink();
                }
              }}
            />
            <Button variant="primary" onClick={applyLink} disabled={!linkUrl.trim() || linkInvalid}>
              Apply
            </Button>
            {linkTarget.current && (
              <Button variant="ghost" onClick={removeLink}>
                Remove
              </Button>
            )}
            <Button variant="ghost" onClick={closeLink}>
              Cancel
            </Button>
          </div>
        )}
        <div className={s.editArea}>
          {empty && placeholder && (
            <span className={s.placeholder} aria-hidden>
              {placeholder}
            </span>
          )}
          <Prose
            ref={editor}
            size="sm"
            className={s.editable}
            role="textbox"
            aria-multiline
            aria-labelledby={labelId}
            aria-placeholder={placeholder}
            aria-disabled={disabled || undefined}
            contentEditable={!disabled}
            suppressContentEditableWarning
            spellCheck
            tabIndex={disabled ? -1 : 0}
            onInput={emit}
            onKeyDown={onKeyDown}
            onKeyUp={refreshState}
            onMouseUp={refreshState}
            onPaste={onPaste}
            onFocus={() => {
              setFocused(true);
              run('defaultParagraphSeparator', 'p');
            }}
            onBlur={() => setFocused(false)}
          />
        </div>
      </div>
    </div>
  );
}
