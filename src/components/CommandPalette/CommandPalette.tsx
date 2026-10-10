import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ClockIcon, CornerDownLeftIcon, SearchIcon, SearchXIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { useOverlayBehavior } from '../Sheet/overlay';
import s from './CommandPalette.module.css';

export type Command = {
  id: string;
  label: string;
  /** Group heading, e.g. "Actions", "Models", "Settings". */
  group: string;
  icon?: ReactNode;
  /** Shortcut hint, either one string ("⌘D") or one key per cap (["⌘", "D"]). */
  shortcut?: string | string[];
  /** Extra search terms that are not shown ("resin", "tank" for a material command). */
  keywords?: string[];
  /** Muted secondary text after the label (file size, current value). */
  hint?: string;
  disabled?: boolean;
  onRun: () => void;
};

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  placeholder?: string;
  /** Query pre-filled each time the palette opens (e.g. from a search box). */
  defaultQuery?: string;
  /** Ids shown under "Recent" while the query is empty. When omitted, the palette remembers the last commands run. */
  recentIds?: string[];
  /** Number of recent commands kept when uncontrolled. */
  maxRecent?: number;
  /** Group order; groups not listed follow in order of first appearance. */
  groupOrder?: string[];
  /** Accessible name of the dialog. */
  label?: string;
  /** Render in place instead of portalling to <body> (docs and tests). */
  inline?: boolean;
  className?: string;
};

const FOOTER_HINTS = [
  { keys: ['↑', '↓'], text: 'Navigate' },
  { keys: ['↵'], text: 'Run' },
  { keys: ['Esc'], text: 'Close' },
];

type Row = { key: string; command: Command; group: string };

const norm = (v: string) => v.toLowerCase();

function score(cmd: Command, terms: string[], query: string): number {
  if (!terms.length) return 0;
  const label = norm(cmd.label);
  const hay = [label, norm(cmd.group), ...(cmd.keywords ?? []).map(norm), norm(cmd.hint ?? '')].join(' ');
  if (!terms.every((t) => hay.includes(t))) return -1;
  if (label.startsWith(query)) return 3;
  if (label.split(/\s+/).some((w) => w.startsWith(terms[0]))) return 2;
  return label.includes(terms[0]) ? 1 : 0.5;
}

function Highlight({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const i = norm(text).indexOf(term);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className={s.match}>{text.slice(i, i + term.length)}</mark>
      {text.slice(i + term.length)}
    </>
  );
}

/** Key caps for a shortcut hint. */
export function ShortcutKeys({ shortcut, className }: { shortcut: string | string[]; className?: string }) {
  const keys = Array.isArray(shortcut) ? shortcut : [shortcut];
  return (
    <span className={cx(s.keys, className)}>
      {keys.map((k, i) => (
        <kbd key={`${k}-${i}`} className={s.kbd}>
          {k}
        </kbd>
      ))}
    </span>
  );
}

/** ⌘K / Ctrl+K command search over actions, models and settings, with recent items, arrow navigation and Enter to run. */
export function CommandPalette({
  open,
  onOpenChange,
  commands,
  placeholder = 'Search actions, models and settings…',
  defaultQuery = '',
  recentIds,
  maxRecent = 5,
  groupOrder,
  label = 'Command palette',
  inline,
  className,
}: CommandPaletteProps) {
  const listId = useId();
  const optionPrefix = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(defaultQuery);
  const [active, setActive] = useState(0);
  const [ownRecent, setOwnRecent] = useState<string[]>([]);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const { ref, onKeyDown: trapKeys } = useOverlayBehavior<HTMLDivElement>({ open, onClose: close, inline, initialFocusRef: inputRef });

  useEffect(() => {
    if (open) {
      setQuery(defaultQuery);
      setActive(0);
    }
  }, [open, defaultQuery]);

  const q = norm(query.trim());
  const terms = q ? q.split(/\s+/) : [];
  const recent = recentIds ?? ownRecent;

  const sections = useMemo(() => {
    const terms = q ? q.split(/\s+/) : [];
    const order: string[] = [...(groupOrder ?? [])];
    for (const c of commands) if (!order.includes(c.group)) order.push(c.group);
    const out: Array<{ group: string; rows: Row[] }> = [];
    if (!q && recent.length) {
      const rows = recent
        .map((id) => commands.find((c) => c.id === id))
        .filter((c): c is Command => !!c)
        .map((c) => ({ key: `recent-${c.id}`, command: c, group: 'Recent' }));
      if (rows.length) out.push({ group: 'Recent', rows });
    }
    for (const group of order) {
      const rows = commands
        .filter((c) => c.group === group)
        .map((c) => ({ c, sc: score(c, terms, q) }))
        .filter((x) => x.sc >= 0)
        .sort((a, b) => b.sc - a.sc)
        .map(({ c }) => ({ key: `${group}-${c.id}`, command: c, group }));
      if (rows.length) out.push({ group, rows });
    }
    return out;
  }, [commands, q, recent, groupOrder]);

  const flat = useMemo(() => sections.flatMap((sec) => sec.rows), [sections]);
  const enabled = flat.map((r, i) => (r.command.disabled ? -1 : i)).filter((i) => i >= 0);
  const activeIndex = flat.length ? Math.min(active, flat.length - 1) : -1;
  const activeRow = activeIndex >= 0 ? flat[activeIndex] : undefined;
  const optionId = (key: string) => `${optionPrefix}-${key}`;

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    if (!activeRow) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(activeRow.key)}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeRow]);

  const run = (row: Row | undefined) => {
    if (!row || row.command.disabled) return;
    if (!recentIds) setOwnRecent((r) => [row.command.id, ...r.filter((id) => id !== row.command.id)].slice(0, maxRecent));
    onOpenChange(false);
    row.command.onRun();
  };

  const move = (dir: 1 | -1 | 'first' | 'last') => {
    if (!enabled.length) return;
    if (dir === 'first') return setActive(enabled[0]);
    if (dir === 'last') return setActive(enabled[enabled.length - 1]);
    const pos = enabled.indexOf(activeIndex);
    const next = pos < 0 ? 0 : (pos + dir + enabled.length) % enabled.length;
    setActive(enabled[next]);
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Home' && e.ctrlKey) {
      e.preventDefault();
      move('first');
    } else if (e.key === 'End' && e.ctrlKey) {
      e.preventDefault();
      move('last');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(activeRow);
    } else if (e.key === 'Escape' && query) {
      e.preventDefault();
      setQuery('');
    }
  };

  if (!open) return null;

  const node = (
    <div className={cx(s.scrim, inline && s.inline)} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} onKeyDown={trapKeys} className={cx(s.dialog, className)}>
        <div className={s.search}>
          <SearchIcon className={s.searchIcon} strokeWidth={2.2} aria-hidden="true" />
          <input
            ref={inputRef}
            className={s.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder={placeholder}
            role="combobox"
            aria-label={placeholder}
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeRow ? optionId(activeRow.key) : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <ShortcutKeys shortcut="Esc" />
        </div>

        <div ref={listRef} id={listId} role="listbox" aria-label="Results" className={s.list}>
          {flat.length === 0 ? (
            <div className={s.empty} role="presentation">
              <SearchXIcon className={s.emptyIcon} strokeWidth={1.8} aria-hidden="true" />
              <p className={s.emptyTitle}>No results for “{query.trim()}”</p>
              <p className={s.emptyHint}>Try a model name, a setting, or an action like “Auto-generate supports”.</p>
            </div>
          ) : (
            sections.map((sec) => (
              <div key={sec.group} role="group" aria-labelledby={`${listId}-${sec.group}`} className={s.group}>
                <div id={`${listId}-${sec.group}`} className={s.groupLabel} role="presentation">
                  {sec.group}
                </div>
                {sec.rows.map((row) => {
                  const i = flat.indexOf(row);
                  const isActive = i === activeIndex;
                  const c = row.command;
                  return (
                    <div
                      key={row.key}
                      id={optionId(row.key)}
                      data-key={row.key}
                      role="option"
                      aria-selected={isActive}
                      aria-disabled={c.disabled || undefined}
                      className={cx(s.option, isActive && s.active, c.disabled && s.disabled)}
                      onMouseMove={() => !c.disabled && i !== activeIndex && setActive(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => run(row)}
                    >
                      <span className={s.icon} aria-hidden="true">
                        {row.group === 'Recent' ? <ClockIcon strokeWidth={2} /> : c.icon}
                      </span>
                      <span className={s.label}>
                        <Highlight text={c.label} term={terms[0] ?? ''} />
                        {c.hint && <span className={s.hint}>{c.hint}</span>}
                      </span>
                      {c.shortcut && <ShortcutKeys shortcut={c.shortcut} />}
                      {isActive && !c.shortcut && <CornerDownLeftIcon className={s.enter} strokeWidth={2} aria-hidden="true" />}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className={s.footer} aria-hidden="true">
          {FOOTER_HINTS.map(({ keys, text }) => (
            <span key={text} className={s.footerHint}>
              <ShortcutKeys shortcut={keys} />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
  return inline ? node : createPortal(node, document.body);
}

export type UseCommandPaletteOptions = {
  /** Letter pressed with ⌘ (macOS) or Ctrl. Default "k". */
  hotkey?: string;
  defaultOpen?: boolean;
  /** Turn the global shortcut off (e.g. while a modal is open). */
  enabled?: boolean;
};

/** Open state for a CommandPalette plus the global ⌘K / Ctrl+K toggle. */
export function useCommandPalette({ hotkey = 'k', defaultOpen = false, enabled = true }: UseCommandPaletteOptions = {}) {
  const [open, setOpen] = useState(defaultOpen);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === hotkey.toLowerCase()) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hotkey, enabled]);

  return {
    open,
    setOpen,
    onOpenChange: setOpen,
    toggle: () => setOpen((o) => !o),
    /** Key caps to show in a "Search" button: ["⌘", "K"] or ["Ctrl", "K"]. */
    shortcut: [isMac ? '⌘' : 'Ctrl', hotkey.toUpperCase()],
  };
}
