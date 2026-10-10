import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react';
import { CheckIcon, CopyIcon, EraserIcon, TerminalIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import s from './Terminal.module.css';

export type TerminalLineKind = 'stdout' | 'stderr' | 'info' | 'command';
export type TerminalLine = { kind: TerminalLineKind; text: string };
/** A plain string is treated as stdout. */
export type TerminalOutput = string | TerminalLine;

/** Preset heights or any token expression such as `var(--size-layout-panel)` or `calc(var(--space-24) * 2)`. */
export type TerminalHeight = 'sm' | 'md' | 'lg' | `var(--${string})` | `calc(${string})`;

export type TerminalProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> & {
  /** Prompt shown before every command. */
  prompt?: string;
  /** Initial scrollback (e.g. a recorded session). Resets the scrollback when it changes. */
  lines?: TerminalOutput[];
  /** Runs a command and returns output lines, synchronously or as a Promise. `clear` is built in. */
  onCommand?: (command: string) => TerminalOutput[] | Promise<TerminalOutput[]>;
  /** Info lines printed above the scrollback. */
  welcome?: string | string[];
  /** Window title in the header bar. */
  title?: string;
  /** Height of the scrollback area. */
  height?: TerminalHeight;
};

const HEIGHTS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'calc(var(--space-24) * 2)',
  md: 'calc(var(--space-24) * 3)',
  lg: 'calc(var(--space-24) * 4)',
};

type Entry = TerminalLine & { id: number; prompt?: string };

function durationToken(name: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return 0;
  return raw.endsWith('ms') ? n : n * 1000;
}

const toLine = (o: TerminalOutput): TerminalLine => (typeof o === 'string' ? { kind: 'stdout', text: o } : o);

/**
 * Inverse-themed console for the `preformserver` CLI and printer shells. Up/Down walk the
 * command history, Ctrl+C cancels, Ctrl+L or `clear` wipes the scrollback.
 */
export function Terminal({
  prompt = 'preform@form4:~$',
  lines,
  onCommand,
  welcome,
  title = 'Terminal',
  height = 'md',
  className,
  style,
  ...rest
}: TerminalProps) {
  const nextId = useRef(0);
  const build = (items: TerminalOutput[], promptText?: string): Entry[] =>
    items.map((o) => {
      const line = toLine(o);
      return { ...line, id: nextId.current++, prompt: line.kind === 'command' ? promptText : undefined };
    });
  const seed = () => {
    const intro = welcome === undefined ? [] : (Array.isArray(welcome) ? welcome : [welcome]).map<TerminalLine>((text) => ({ kind: 'info', text }));
    return build([...intro, ...(lines ?? [])], prompt);
  };

  const [entries, setEntries] = useState<Entry[]>(seed);
  const [input, setInput] = useState('');
  const [caret, setCaret] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const [copied, setCopied] = useState(false);
  const runId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Reset the scrollback only when the seed content changes, not on every new array identity.
  const seedKey = JSON.stringify([welcome ?? null, lines ?? null]);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setEntries(seed());
  }, [seedKey]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, busy]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), durationToken('--motion-duration-slow') * 5);
    return () => window.clearTimeout(t);
  }, [copied]);

  const append = (items: TerminalOutput[], promptText?: string) => setEntries((prev) => [...prev, ...build(items, promptText)]);

  const setValue = (v: string) => {
    setInput(v);
    setCaret(v.length);
    requestAnimationFrame(() => inputRef.current?.setSelectionRange(v.length, v.length));
  };

  const run = async (command: string) => {
    append([{ kind: 'command', text: command }], prompt);
    const trimmed = command.trim();
    if (!trimmed) return;
    setHistory((h) => (h[h.length - 1] === trimmed ? h : [...h, trimmed]));
    if (trimmed === 'clear') {
      setEntries([]);
      return;
    }
    if (!onCommand) {
      append([{ kind: 'stderr', text: `${trimmed.split(/\s+/)[0]}: command not found` }]);
      return;
    }
    const id = ++runId.current;
    try {
      const result = onCommand(trimmed);
      if (result instanceof Promise) {
        setBusy(true);
        const out = await result;
        if (id === runId.current) append(out);
      } else {
        append(result);
      }
    } catch (err) {
      if (id === runId.current) append([{ kind: 'stderr', text: err instanceof Error ? err.message : String(err) }]);
    } finally {
      if (id === runId.current) {
        setBusy(false);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      const selection = window.getSelection()?.toString();
      if (selection) return; // let the browser copy selected output
      e.preventDefault();
      runId.current++;
      setBusy(false);
      append([{ kind: 'command', text: `${input}^C` }], prompt);
      setValue('');
      setHistoryIndex(null);
      return;
    }
    if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      setEntries([]);
      return;
    }
    if (busy) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = input;
      setValue('');
      setHistoryIndex(null);
      void run(cmd);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const idx = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      if (historyIndex === null) setDraft(input);
      setHistoryIndex(idx);
      setValue(history[idx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;
      const idx = historyIndex + 1;
      if (idx >= history.length) {
        setHistoryIndex(null);
        setValue(draft);
      } else {
        setHistoryIndex(idx);
        setValue(history[idx]);
      }
    }
  };

  const copyOutput = async () => {
    const text = entries.map((e) => (e.kind === 'command' ? `${e.prompt ?? prompt} ${e.text}` : e.text)).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const focusInput = () => {
    if (window.getSelection()?.toString()) return;
    inputRef.current?.focus();
  };

  const rootStyle = { ...style, '--terminal-h': height in HEIGHTS ? HEIGHTS[height as keyof typeof HEIGHTS] : height } as CSSProperties;
  const before = input.slice(0, caret);
  const at = input.slice(caret, caret + 1);
  const after = input.slice(caret + 1);

  return (
    <div className={cx(s.terminal, focused && s.focused, className)} style={rootStyle} {...rest}>
      <div className={s.header}>
        <TerminalIcon className={s.headerIcon} strokeWidth={2.2} aria-hidden="true" />
        <span className={s.title}>{title}</span>
        <div role="toolbar" aria-label="Terminal actions" className={s.actions}>
          <IconButton
            variant="inverse"
            size="xs"
            label={copied ? 'Output copied' : 'Copy output'}
            icon={copied ? <CheckIcon strokeWidth={2.4} /> : <CopyIcon strokeWidth={2.2} />}
            onClick={copyOutput}
          />
          <IconButton variant="inverse" size="xs" label="Clear scrollback" icon={<EraserIcon strokeWidth={2.2} />} onClick={() => setEntries([])} />
        </div>
      </div>
      <div ref={scrollRef} className={s.screen} onMouseUp={focusInput}>
        <div role="log" aria-live="polite" aria-label={`${title} output`} aria-busy={busy || undefined} className={s.log}>
          {entries.map((e) =>
            e.kind === 'command' ? (
              <div key={e.id} className={s.line}>
                <span className={s.prompt}>{e.prompt ?? prompt}</span> <span className={s.command}>{e.text}</span>
              </div>
            ) : (
              <div key={e.id} className={cx(s.line, s[e.kind])}>
                {e.text || ' '}
              </div>
            ),
          )}
        </div>
        <div className={cx(s.line, s.inputLine, busy && s.busy)}>
          {!busy && (
            <span className={s.prompt} aria-hidden="true">
              {prompt}{' '}
            </span>
          )}
          <span className={s.field}>
            <span className={s.mirror} aria-hidden="true">
              {busy ? null : (
                <>
                  {before}
                  <span className={s.caret}>{at || '\u00a0'}</span>
                  {after}
                </>
              )}
            </span>
            <input
              ref={inputRef}
              className={s.input}
              value={input}
              aria-label={`Command input, prompt ${prompt}`}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => {
                setInput(e.target.value);
                setCaret(e.target.selectionStart ?? e.target.value.length);
                setHistoryIndex(null);
              }}
              onSelect={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
