import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRightIcon, BookOpenIcon, CircleHelpIcon, KeyboardIcon, MessageCircleIcon, SearchIcon, SparklesIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { TextField } from '../TextField/TextField';
import { useOverlayBehavior } from '../Sheet/overlay';
import s from './HelpWidget.module.css';

export type HelpArticle = {
  id: string;
  title: string;
  /** One-line summary under the title. */
  description?: string;
  /** Opens in a new tab when set; otherwise `onSelect` is called. */
  href?: string;
  onSelect?: () => void;
  /** Extra search terms. */
  keywords?: string[];
};

export type HelpWhatsNew = {
  title: string;
  description?: string;
  /** Unread release notes, shown as a badge and a dot on the launcher. */
  count?: number;
  onSelect?: () => void;
};

export type HelpWidgetProps = WithForcedState & {
  /** Controlled open state. Leave undefined to let the widget manage it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  title?: string;
  articles: HelpArticle[];
  /** Called with the query on Enter or "Search Help Center". */
  onSearch?: (query: string) => void;
  onContactSupport?: () => void;
  onShowShortcuts?: () => void;
  /** Key caps shown next to "Keyboard shortcuts". */
  shortcutsHint?: string[];
  whatsNew?: HelpWhatsNew;
  /** Positioned inside the nearest positioned ancestor instead of the viewport (docs and tests). */
  inline?: boolean;
  className?: string;
};

/** Floating help launcher (bottom-right) with search, suggested articles, What's new, shortcuts and Contact support. */
export function HelpWidget({
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  title = 'Help & resources',
  articles,
  onSearch,
  onContactSupport,
  onShowShortcuts,
  shortcutsHint = ['?'],
  whatsNew,
  inline,
  className,
  'data-state': forcedState,
}: HelpWidgetProps) {
  const titleId = useId();
  const panelId = useId();
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const open = openProp ?? ownOpen;
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };
  const closeAndReturn = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  const { ref: panelRef, onKeyDown } = useOverlayBehavior<HTMLDivElement>({
    open,
    onClose: closeAndReturn,
    inline,
    trapFocus: false,
    lockScroll: false,
    restoreFocus: false,
    initialFocusRef: searchRef,
  });

  // Non-modal: a click outside the widget closes it without moving focus.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOwnOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = q ? articles.filter((a) => [a.title, a.description ?? '', ...(a.keywords ?? [])].join(' ').toLowerCase().includes(q)) : articles;
  const unread = whatsNew?.count ?? 0;

  return (
    <div ref={rootRef} className={cx(s.root, inline && s.inline, className)}>
      {open && (
        <div ref={panelRef} id={panelId} role="dialog" aria-modal="false" aria-labelledby={titleId} tabIndex={-1} onKeyDown={onKeyDown} className={s.panel}>
          <header className={s.header}>
            <h2 id={titleId} className={s.title}>
              {title}
            </h2>
            <IconButton label="Close help" icon={<XIcon strokeWidth={2.6} />} size="sm" onClick={closeAndReturn} />
          </header>
          <div className={s.search}>
            <TextField
              ref={searchRef}
              label="Search help articles"
              placeholder="Search help articles"
              value={query}
              onChange={setQuery}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && q && onSearch) onSearch(query.trim());
              }}
              iconStart={<SearchIcon strokeWidth={2.2} />}
              size="md"
              fullWidth
            />
          </div>

          <div className={s.scroll}>
            {whatsNew && !q && (
              <button type="button" className={s.whatsNew} onClick={whatsNew.onSelect}>
                <span className={s.whatsNewIcon} aria-hidden="true">
                  <SparklesIcon strokeWidth={2} />
                </span>
                <span className={s.itemText}>
                  <span className={s.itemTitle}>
                    What's new: {whatsNew.title}
                  </span>
                  {whatsNew.description && <span className={s.itemDescription}>{whatsNew.description}</span>}
                </span>
                {unread > 0 && (
                  <Badge tone="accent" variant="solid">
                    {unread} new
                  </Badge>
                )}
              </button>
            )}

            <h3 className={s.sectionLabel}>{q ? 'Results' : 'Suggested articles'}</h3>
            {results.length ? (
              <ul className={s.articles}>
                {results.map((a) => {
                  const inner = (
                    <>
                      <BookOpenIcon className={s.articleIcon} strokeWidth={2} aria-hidden="true" />
                      <span className={s.itemText}>
                        <span className={s.itemTitle}>{a.title}</span>
                        {a.description && <span className={s.itemDescription}>{a.description}</span>}
                      </span>
                      {a.href && (
                        <>
                          <ArrowUpRightIcon className={s.external} strokeWidth={2} aria-hidden="true" />
                          <span className={s.srOnly}>(opens in a new tab)</span>
                        </>
                      )}
                    </>
                  );
                  return (
                    <li key={a.id}>
                      {a.href ? (
                        <a className={s.article} href={a.href} target="_blank" rel="noreferrer" onClick={a.onSelect}>
                          {inner}
                        </a>
                      ) : (
                        <button type="button" className={s.article} onClick={a.onSelect}>
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className={s.empty}>
                <p className={s.emptyText}>No articles match “{query.trim()}”.</p>
                {onSearch && (
                  <Button variant="link" onClick={() => onSearch(query.trim())}>
                    Search the Help Center
                  </Button>
                )}
              </div>
            )}
          </div>

          <footer className={s.footer}>
            {onShowShortcuts && (
              <button type="button" className={s.footerLink} onClick={onShowShortcuts}>
                <KeyboardIcon strokeWidth={2} aria-hidden="true" />
                Keyboard shortcuts
                <span className={s.keys} aria-hidden="true">
                  {shortcutsHint.map((k) => (
                    <kbd key={k} className={s.kbd}>
                      {k}
                    </kbd>
                  ))}
                </span>
              </button>
            )}
            {onContactSupport && (
              <Button variant="primary" className={s.contact} iconStart={<MessageCircleIcon strokeWidth={2.2} />} onClick={onContactSupport}>
                Contact support
              </Button>
            )}
          </footer>
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        className={s.launcher}
        aria-label={open ? 'Close help' : unread ? `Help, ${unread} new updates` : 'Help'}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        data-open={open || undefined}
        data-state={forcedState}
        onClick={() => setOpen(!open)}
      >
        <span className={s.launcherIcon} aria-hidden="true">
          {open ? <XIcon strokeWidth={2.6} /> : <CircleHelpIcon strokeWidth={2.2} />}
        </span>
        {!open && unread > 0 && <span className={s.dot} aria-hidden="true" />}
      </button>
    </div>
  );
}

