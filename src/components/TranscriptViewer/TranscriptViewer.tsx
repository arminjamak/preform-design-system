import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import { TextField } from '../TextField/TextField';
import s from './TranscriptViewer.module.css';

export type TranscriptLine = {
  /** Start time in seconds. */
  start: number;
  /** End time in seconds; defaults to the next line's start. */
  end?: number;
  speaker?: string;
  text: string;
};

export type TranscriptViewerProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  lines: TranscriptLine[];
  /** Playback position in seconds; the matching line is highlighted and scrolled into view. */
  currentTime?: number;
  /** Called with a line's start time when it is clicked. */
  onSeek?: (time: number) => void;
  title?: string;
  /** Controlled search query; omit for internal state. */
  query?: string;
  onQueryChange?: (query: string) => void;
  showSearch?: boolean;
  /** Keep the active line in view while playing (paused briefly when the reader scrolls). */
  autoScroll?: boolean;
  /** List height. */
  height?: 'sm' | 'md' | 'lg' | 'auto';
};

/** Text-safe categorical colours for speaker labels (readable in both themes). */
const SPEAKER_COLORS = [
  'var(--color-fg-accent)',
  'var(--color-status-success-strong)',
  'var(--color-accent-tone-magenta)',
  'var(--color-status-danger-strong)',
  'var(--color-status-warning-strong)',
  'var(--color-fg-secondary)',
];
/** Pause auto-scroll after the reader scrolls manually (behaviour, not styling). */
const MANUAL_SCROLL_GRACE_MS = 4000;

const escapeRe = (q: string) => q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function formatStamp(seconds: number) {
  const t = Math.max(0, Math.floor(seconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** Time-stamped transcript with speakers, search highlighting, a synced active line and click-to-seek. */
export function TranscriptViewer({
  lines,
  currentTime,
  onSeek,
  title = 'Transcript',
  query: queryProp,
  onQueryChange,
  showSearch = true,
  autoScroll = true,
  height = 'md',
  className,
  ...rest
}: TranscriptViewerProps) {
  const titleId = useId();
  const [queryState, setQueryState] = useState('');
  const query = queryProp ?? queryState;
  const setQuery = (q: string) => {
    setQueryState(q);
    onQueryChange?.(q);
  };
  const [matchCursor, setMatchCursor] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const lastManualScroll = useRef(0);

  const speakers = useMemo(() => {
    const map = new Map<string, number>();
    lines.forEach((l) => l.speaker && !map.has(l.speaker) && map.set(l.speaker, map.size % SPEAKER_COLORS.length));
    return map;
  }, [lines]);

  const active = useMemo(() => {
    if (currentTime == null) return -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      const end = lines[i].end ?? lines[i + 1]?.start ?? Infinity;
      if (currentTime >= lines[i].start && currentTime < end) return i;
      if (currentTime >= lines[i].start) return -1;
    }
    return -1;
  }, [currentTime, lines]);

  const trimmed = query.trim();
  const re = useMemo(() => (trimmed ? new RegExp(`(${escapeRe(trimmed)})`, 'gi') : null), [trimmed]);
  const matches = useMemo(() => {
    if (!re) return [] as number[];
    return lines.flatMap((l, i) => (l.text.match(re) || (l.speaker && l.speaker.match(re)) ? [i] : []));
  }, [lines, re]);
  const matchSet = useMemo(() => new Set(matches), [matches]);
  const totalHits = useMemo(() => (re ? lines.reduce((n, l) => n + (l.text.match(re)?.length ?? 0), 0) : 0), [lines, re]);

  useEffect(() => setMatchCursor(0), [trimmed]);

  const scrollToLine = (index: number, behavior: ScrollBehavior) => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-index="${index}"]`);
    if (!list || !el) return;
    const offset = el.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    const top = offset - list.clientHeight / 2 + el.offsetHeight / 2;
    list.scrollTo({ top: Math.max(0, top), behavior });
  };

  // Follow the active line inside the list only (never scrolls the page).
  useEffect(() => {
    if (!autoScroll || active < 0 || trimmed) return;
    if (Date.now() - lastManualScroll.current < MANUAL_SCROLL_GRACE_MS) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    scrollToLine(active, reduce ? 'auto' : 'smooth');
  }, [active, autoScroll, trimmed]);

  useEffect(() => {
    if (matches.length) scrollToLine(matches[matchCursor % matches.length], 'auto');
  }, [matches, matchCursor]);

  const highlight = (text: string): ReactNode => {
    if (!re) return text;
    return text.split(re).map((part, i) => (i % 2 === 1 ? <mark key={i} className={s.mark}>{part}</mark> : part));
  };

  const focusedMatch = matches.length ? matches[matchCursor % matches.length] : -1;
  const step = (d: number) => matches.length && setMatchCursor((c) => (c + d + matches.length) % matches.length);

  return (
    <section aria-labelledby={titleId} className={cx(s.root, s[height], className)} {...rest}>
      <header className={s.header}>
        <h3 id={titleId} className={s.title}>
          {title}
        </h3>
        {showSearch && (
          <div className={s.search}>
            <TextField
              label={`Search ${title.toLowerCase()}`}
              type="search"
              placeholder="Search"
              value={query}
              onChange={setQuery}
              fullWidth
              className={s.searchField}
              iconStart={<SearchIcon strokeWidth={2.2} />}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  step(e.shiftKey ? -1 : 1);
                } else if (e.key === 'Escape' && query) {
                  e.preventDefault();
                  setQuery('');
                }
              }}
            />
            {trimmed && (
              <>
                <span className={s.count} aria-live="polite">
                  {matches.length ? `${(matchCursor % matches.length) + 1}/${matches.length}` : 'No matches'}
                  <span className={s.srOnly}>{matches.length ? ` lines, ${totalHits} matches` : ''}</span>
                </span>
                <IconButton label="Previous match" icon={<ChevronUpIcon strokeWidth={2.2} />} size="xs" disabled={!matches.length} onClick={() => step(-1)} />
                <IconButton label="Next match" icon={<ChevronDownIcon strokeWidth={2.2} />} size="xs" disabled={!matches.length} onClick={() => step(1)} />
                <IconButton label="Clear search" icon={<XIcon strokeWidth={2.2} />} size="xs" onClick={() => setQuery('')} />
              </>
            )}
          </div>
        )}
      </header>

      <ol
        ref={listRef}
        className={s.list}
        onWheel={() => (lastManualScroll.current = Date.now())}
        onTouchMove={() => (lastManualScroll.current = Date.now())}
      >
        {lines.map((line, i) => {
          const tone = line.speaker ? speakers.get(line.speaker) : undefined;
          const dimmed = re && !matchSet.has(i);
          const content = (
            <>
              <span className={s.stamp}>{formatStamp(line.start)}</span>
              <span className={s.content}>
                {line.speaker && (
                  <span className={s.speaker} style={{ '--speaker': SPEAKER_COLORS[tone ?? 0] } as CSSProperties}>
                    {highlight(line.speaker)}
                  </span>
                )}
                <span className={s.text}>{highlight(line.text)}</span>
              </span>
            </>
          );
          return (
            <li key={`${line.start}-${i}`} data-index={i} className={cx(s.item, dimmed && s.dimmed)}>
              {onSeek ? (
                <button
                  type="button"
                  className={cx(s.line, s.clickable, i === active && s.active, i === focusedMatch && s.focusedMatch)}
                  aria-current={i === active ? 'true' : undefined}
                  title={`Jump to ${formatStamp(line.start)}`}
                  onClick={() => onSeek(line.start)}
                >
                  {content}
                </button>
              ) : (
                <div className={cx(s.line, i === active && s.active, i === focusedMatch && s.focusedMatch)} aria-current={i === active ? 'true' : undefined}>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
