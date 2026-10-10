import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ArrowDownIcon, ArrowDownToLineIcon, ListOrderedIcon, SearchIcon, WrapTextIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { TextField } from '../TextField/TextField';
import s from './LogViewer.module.css';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEntry = {
  id: string | number;
  /** ISO string, epoch milliseconds or Date; shown as HH:MM:SS.mmm. Other strings are shown as-is. */
  time: string | number | Date;
  level: LogLevel;
  source?: string;
  message: string;
};

/** Preset heights or any token expression such as `var(--size-layout-panel)`. */
export type LogViewerHeight = 'sm' | 'md' | 'lg' | `var(--${string})` | `calc(${string})`;

export type LogViewerProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  entries: LogEntry[];
  /** Keep the newest line in view as entries arrive. Scrolling up pauses it. */
  follow?: boolean;
  /** Called when following turns on or off (scrolling up, the toggle, Jump to latest). */
  onFollowChange?: (follow: boolean) => void;
  /** Height of the log area. */
  height?: LogViewerHeight;
  /** Soft-wrap long messages instead of scrolling horizontally. */
  wrap?: boolean;
  /** Show line numbers in the gutter. */
  showLineNumbers?: boolean;
  /** Accessible name of the log region. */
  label?: string;
};

const LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];
const LEVEL_LABEL: Record<LogLevel, string> = { debug: 'Debug', info: 'Info', warn: 'Warn', error: 'Error' };
const HEIGHTS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'calc(var(--space-24) * 2)',
  md: 'calc(var(--space-24) * 3)',
  lg: 'calc(var(--space-24) * 5)',
};
const OVERSCAN = 20;

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

function formatTime(t: LogEntry['time']): string {
  const d = t instanceof Date ? t : typeof t === 'number' ? new Date(t) : /^\d{4}-\d{2}-\d{2}T/.test(t) ? new Date(t) : null;
  if (!d || Number.isNaN(d.getTime())) return String(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

function highlight(text: string, query: string, markClass: string): ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const out: ReactNode[] = [];
  let i = 0;
  let j = lower.indexOf(q);
  while (j !== -1) {
    if (j > i) out.push(text.slice(i, j));
    out.push(
      <mark key={j} className={markClass}>
        {text.slice(j, j + q.length)}
      </mark>,
    );
    i = j + q.length;
    j = lower.indexOf(q, i);
  }
  if (i < text.length) out.push(text.slice(i));
  return out;
}

function onToolbarKeyDown(e: KeyboardEvent<HTMLDivElement>) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  if (!(e.target instanceof HTMLButtonElement)) return;
  const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
  const i = buttons.indexOf(e.target);
  buttons[(i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
  e.preventDefault();
}

/**
 * Device log console (Form 4 printer logs, PreForm service logs). Unwrapped lines are windowed so
 * thousands of entries stay smooth; level chips filter, search highlights, follow keeps the tail in view.
 */
export function LogViewer({
  entries,
  follow: followProp = true,
  onFollowChange,
  height = 'md',
  wrap: wrapProp = false,
  showLineNumbers: lineNumbersProp = true,
  label = 'Device log',
  className,
  style,
  ...rest
}: LogViewerProps) {
  const [follow, setFollowState] = useState(followProp);
  const [wrap, setWrap] = useState(wrapProp);
  const [lineNumbers, setLineNumbers] = useState(lineNumbersProp);
  const [levels, setLevels] = useState<Set<LogLevel>>(() => new Set(LEVELS));
  const [query, setQuery] = useState('');
  const [rowHeight, setRowHeight] = useState(0);
  const [viewport, setViewport] = useState({ top: 0, height: 0 });
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);

  useEffect(() => setFollowState(followProp), [followProp]);
  useEffect(() => setWrap(wrapProp), [wrapProp]);
  useEffect(() => setLineNumbers(lineNumbersProp), [lineNumbersProp]);

  const setFollow = useCallback(
    (v: boolean) => {
      if (v !== follow) onFollowChange?.(v);
      setFollowState(v);
    },
    [follow, onFollowChange],
  );

  // Row height comes from CSS tokens; measure it once (and when fonts load) for the windowing maths.
  useLayoutEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    const measure = () => setRowHeight(probe.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(probe);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewport({ top: el.scrollTop, height: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const counts = useMemo(() => {
    const c: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 };
    for (const e of entries) c[e.level]++;
    return c;
  }, [entries]);

  const q = query.trim();
  const visible = useMemo(() => {
    const needle = q.toLowerCase();
    const out: Array<{ entry: LogEntry; line: number }> = [];
    entries.forEach((entry, i) => {
      if (!levels.has(entry.level)) return;
      if (needle && !entry.message.toLowerCase().includes(needle) && !(entry.source ?? '').toLowerCase().includes(needle)) return;
      out.push({ entry, line: i + 1 });
    });
    return out;
  }, [entries, levels, q]);

  const scrollToEnd = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setViewport({ top: el.scrollTop, height: el.clientHeight });
    setAtBottom(true);
  }, []);

  useLayoutEffect(() => {
    if (follow) scrollToEnd();
  }, [follow, visible, wrap, rowHeight, scrollToEnd]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setViewport({ top: el.scrollTop, height: el.clientHeight });
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight <= Math.max(rowHeight, 1);
    setAtBottom(bottom);
    // Programmatic scrolls always land at the bottom, so only a user scrolling up pauses following.
    if (!bottom && follow) setFollow(false);
    else if (bottom && !follow) setFollow(true);
  };

  const toggleLevel = (level: LogLevel) =>
    setLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });

  // Windowing applies to unwrapped rows, which all share the token row height.
  const windowed = !wrap && rowHeight > 0;
  let start = 0;
  let end = visible.length;
  if (windowed) {
    start = Math.max(0, Math.floor(viewport.top / rowHeight) - OVERSCAN);
    end = Math.min(visible.length, Math.ceil((viewport.top + viewport.height) / rowHeight) + OVERSCAN);
  }
  const slice = visible.slice(start, end);
  const rootStyle = {
    ...style,
    '--lv-h': height in HEIGHTS ? HEIGHTS[height as keyof typeof HEIGHTS] : height,
  } as CSSProperties;
  const listStyle = windowed ? ({ '--lv-total': visible.length, '--lv-offset': start } as CSSProperties) : undefined;

  return (
    <div className={cx(s.viewer, wrap && s.wrap, !lineNumbers && s.noLineNumbers, className)} style={rootStyle} {...rest}>
      <div role="toolbar" aria-label={`${label} controls`} className={s.toolbar} onKeyDown={onToolbarKeyDown}>
        <div role="group" aria-label="Filter by level" className={s.chips}>
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={levels.has(level)}
              className={cx(s.chip, s[`chip_${level}`])}
              onClick={() => toggleLevel(level)}
            >
              <span className={s.chipDot} aria-hidden="true" />
              {LEVEL_LABEL[level]}
              <span className={s.chipCount}>{counts[level].toLocaleString()}</span>
            </button>
          ))}
        </div>
        <TextField
          label="Search log messages"
          placeholder="Search messages"
          type="search"
          value={query}
          onChange={setQuery}
          iconStart={<SearchIcon strokeWidth={2.2} />}
          className={s.search}
        />
        <div className={s.toggles}>
          <IconButton label="Line numbers" pressed={lineNumbers} icon={<ListOrderedIcon strokeWidth={2.2} />} onClick={() => setLineNumbers((v) => !v)} />
          <IconButton label="Wrap lines" pressed={wrap} icon={<WrapTextIcon strokeWidth={2.2} />} onClick={() => setWrap((v) => !v)} />
          <IconButton label="Follow latest" pressed={follow} icon={<ArrowDownToLineIcon strokeWidth={2.2} />} onClick={() => setFollow(!follow)} />
        </div>
      </div>

      <div className={s.body}>
        <div
          ref={scrollRef}
          role="log"
          aria-label={label}
          aria-live={follow ? 'polite' : 'off'}
          tabIndex={0}
          className={s.scroller}
          onScroll={onScroll}
          onKeyDown={(e) => {
            if (e.key === 'End' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              setFollow(true);
              scrollToEnd();
            }
          }}
        >
          <div className={cx(s.rows, windowed && s.windowed)} style={listStyle}>
            <div className={cx(windowed && s.windowInner)}>
              {slice.map(({ entry, line }) => (
                <div key={entry.id} className={cx(s.row, s[`row_${entry.level}`])}>
                  <span className={s.lineNo} aria-hidden="true">
                    {line}
                  </span>
                  <span className={s.time}>{formatTime(entry.time)}</span>
                  <span className={cx(s.level, s[`level_${entry.level}`])}>{entry.level}</span>
                  <span className={s.source}>{entry.source ? highlight(entry.source, q, s.mark) : ''}</span>
                  <span className={s.message}>{highlight(entry.message, q, s.mark)}</span>
                </div>
              ))}
            </div>
          </div>
          {visible.length === 0 && <div className={s.empty}>{entries.length ? 'No lines match the current filters' : 'No log lines yet'}</div>}
        </div>
        {!atBottom && visible.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            className={s.jump}
            iconStart={<ArrowDownIcon strokeWidth={2.4} />}
            onClick={() => {
              setFollow(true);
              scrollToEnd();
            }}
          >
            Jump to latest
          </Button>
        )}
        <div ref={probeRef} className={cx(s.row, s.probe)} aria-hidden="true">
          <span className={s.message}>0</span>
        </div>
      </div>

      <div className={s.footer}>
        {visible.length === entries.length
          ? `${entries.length.toLocaleString()} lines`
          : `Showing ${visible.length.toLocaleString()} of ${entries.length.toLocaleString()} lines`}
        {q && ` · ${visible.length.toLocaleString()} ${visible.length === 1 ? 'match' : 'matches'}`}
        {!follow && <span className={s.paused}> · Follow paused</span>}
      </div>
    </div>
  );
}
