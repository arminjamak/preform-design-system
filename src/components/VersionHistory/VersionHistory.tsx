import { useId, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import {
  BookmarkIcon,
  BoxIcon,
  ChevronLeftIcon,
  DropletIcon,
  HistoryIcon,
  LayoutGridIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  MoveIcon,
  NetworkIcon,
  Rotate3dIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Menu } from '../Menu/Menu';
import s from './VersionHistory.module.css';

export type VersionHistoryKind = 'import' | 'orient' | 'supports' | 'manual' | 'clear' | 'protect' | 'move' | 'restore' | 'layout' | 'material';

export type VersionHistoryEntry = {
  id: string;
  kind: VersionHistoryKind;
  title: string;
  description?: string;
  /** Display time, already formatted ("14:32"). */
  time: string;
  /** Day group heading ("Today", "Yesterday", "Mon 6 Oct"). Consecutive entries with the same day are grouped. */
  day: string;
  /** Preview of the model after this step: an <img>, canvas snapshot or SVG. A sunken placeholder is drawn when omitted. */
  thumbnail?: ReactNode;
  /** Overrides the icon derived from `kind`. */
  icon?: ReactNode;
};

export type SavedVersion = {
  id: string;
  name: string;
  /** Title of the history step the version was saved from. */
  sourceTitle: string;
  sourceTime: string;
  /** When it was saved, formatted ("Today, 15:05"). */
  savedAt: string;
  thumbnail?: ReactNode;
};

export type VersionHistoryTab = 'timeline' | 'versions';

export type VersionHistoryProps = Omit<HTMLAttributes<HTMLElement>, 'onSelect' | 'title'> &
  WithForcedState & {
    /** Newest first. */
    entries: VersionHistoryEntry[];
    /** The step the model is at now. Defaults to the newest entry. */
    currentId?: string;
    savedVersions?: SavedVersion[];
    /** Highlighted step; drives the footer restore button. Defaults to `currentId`. */
    selectedId?: string;
    onSelect?: (id: string) => void;
    onRestore?: (entry: VersionHistoryEntry) => void;
    onSaveVersion?: (entry: VersionHistoryEntry) => void;
    onRestoreVersion?: (version: SavedVersion) => void;
    /** Shows the back chevron in the header. */
    onClose?: () => void;
    /** Controlled tab; uncontrolled when omitted. */
    tab?: VersionHistoryTab;
    onTabChange?: (tab: VersionHistoryTab) => void;
    title?: string;
    subtitle?: ReactNode;
    /** Day groups with this heading get the accent timeline. */
    todayLabel?: string;
  };

const KIND_ICON: Record<VersionHistoryKind, ReactNode> = {
  import: <BoxIcon strokeWidth={2.2} />,
  orient: <Rotate3dIcon strokeWidth={2.2} />,
  supports: <NetworkIcon strokeWidth={2.2} />,
  manual: <NetworkIcon strokeWidth={2.2} />,
  clear: <Trash2Icon strokeWidth={2.2} />,
  protect: <ShieldCheckIcon strokeWidth={2.2} />,
  move: <MoveIcon strokeWidth={2.2} />,
  restore: <HistoryIcon strokeWidth={2.2} />,
  layout: <LayoutGridIcon strokeWidth={2.2} />,
  material: <DropletIcon strokeWidth={2.2} />,
};

function groupByDay(entries: VersionHistoryEntry[]) {
  const groups: Array<{ day: string; items: VersionHistoryEntry[] }> = [];
  for (const e of entries) {
    const last = groups[groups.length - 1];
    if (last && last.day === e.day) last.items.push(e);
    else groups.push({ day: e.day, items: [e] });
  }
  return groups;
}

/** Arrow keys walk the focusable rows of a list. */
function moveFocus(e: KeyboardEvent<HTMLElement>, selector: string) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(selector));
  const i = items.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  items[Math.min(Math.max(i + (e.key === 'ArrowDown' ? 1 : -1), 0), items.length - 1)]?.focus();
}

/** The PreForm history panel: a day-grouped timeline of model edits with restore and save-as-version, plus the saved versions list. */
export function VersionHistory({
  entries,
  currentId: currentIdProp,
  savedVersions = [],
  selectedId: selectedIdProp,
  onSelect,
  onRestore,
  onSaveVersion,
  onRestoreVersion,
  onClose,
  tab: tabProp,
  onTabChange,
  title = 'History',
  subtitle,
  todayLabel = 'Today',
  className,
  'data-state': forcedState,
  ...rest
}: VersionHistoryProps) {
  const uid = useId();
  const [tabInner, setTabInner] = useState<VersionHistoryTab>('timeline');
  const tab = tabProp ?? tabInner;
  const setTab = (t: VersionHistoryTab) => {
    if (tabProp === undefined) setTabInner(t);
    onTabChange?.(t);
  };

  const currentId = currentIdProp ?? entries[0]?.id;
  const selectedId = selectedIdProp ?? currentId;
  const selected = entries.find((e) => e.id === selectedId);
  const current = entries.find((e) => e.id === currentId);
  const groups = groupByDay(entries);

  const tabs: Array<{ id: VersionHistoryTab; label: string }> = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'versions', label: `Saved versions${savedVersions.length ? ` (${savedVersions.length})` : ''}` },
  ];

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const next: VersionHistoryTab = e.key === 'Home' ? 'timeline' : e.key === 'End' ? 'versions' : tab === 'timeline' ? 'versions' : 'timeline';
    setTab(next);
    e.currentTarget.querySelector<HTMLElement>(`#${CSS.escape(`${uid}-tab-${next}`)}`)?.focus();
  };

  return (
    <section className={cx(s.root, className)} aria-label={title} {...rest}>
      <header className={s.header}>
        <div className={s.headRow}>
          {onClose && <IconButton label={`Close ${title.toLowerCase()}`} icon={<ChevronLeftIcon strokeWidth={2.4} />} variant="outline" size="sm" onClick={onClose} className={s.back} />}
          <div className={s.titles}>
            <h2 className={s.title}>{title}</h2>
            {subtitle && <p className={s.subtitle}>{subtitle}</p>}
          </div>
          <Menu
            label={`${title} options`}
            icon={<MoreVerticalIcon strokeWidth={2.4} />}
            items={[
              { label: 'Save current state as version', icon: <BookmarkIcon />, onSelect: () => current && onSaveVersion?.(current), disabled: !current },
              ...(onClose ? [{ label: `Close ${title.toLowerCase()}`, onSelect: onClose }] : []),
            ]}
          />
        </div>
        <div role="tablist" aria-label={`${title} view`} className={s.tabs} onKeyDown={onTabKey}>
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`${uid}-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`${uid}-panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={s.tab}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className={s.body}>
        <div role="tabpanel" id={`${uid}-panel-timeline`} aria-labelledby={`${uid}-tab-timeline`} hidden={tab !== 'timeline'} className={s.panel}>
          {entries.length === 0 ? (
            <Empty icon={<HistoryIcon strokeWidth={1.8} />} title="No changes yet" text="Orienting, supporting, protecting and moving the model will appear here." />
          ) : (
            groups.map((g) => {
              const today = g.day === todayLabel;
              return (
                <section key={g.day} aria-label={g.day} className={s.group}>
                  <h3 className={s.day}>{g.day}</h3>
                  <ul className={s.list} onKeyDown={(e) => moveFocus(e, '[data-vh-row]')}>
                    {g.items.map((entry, i) => {
                      const isCurrent = entry.id === currentId;
                      const isSelected = entry.id === selectedId;
                      const isFirst = i === 0;
                      const isLast = i === g.items.length - 1;
                      return (
                        <li key={entry.id} className={cx(s.entry, today && s.today, isFirst && s.first, isLast && s.last)} aria-current={isCurrent ? 'step' : undefined}>
                          <span className={s.line} aria-hidden="true" />
                          <span className={s.dot} aria-hidden="true" />
                          <div className={cx(s.entryInner, isSelected && s.selected)}>
                            <button
                              type="button"
                              data-vh-row
                              aria-pressed={isSelected}
                              onClick={() => onSelect?.(entry.id)}
                              className={s.entryButton}
                              data-state={entry.id === entries[0]?.id ? forcedState : undefined}
                            >
                              <span className={s.meta}>
                                <span className={s.time}>{entry.time}</span>
                                <span className={s.kind} aria-hidden="true">
                                  {entry.icon ?? KIND_ICON[entry.kind]}
                                </span>
                              </span>
                              <span className={s.text}>
                                <span className={s.titleRow}>
                                  <span className={s.entryTitle}>{entry.title}</span>
                                  {isCurrent && (
                                    <Badge tone="accent" variant="solid" className={s.currentBadge}>
                                      Current
                                    </Badge>
                                  )}
                                </span>
                                {entry.description && <span className={s.description}>{entry.description}</span>}
                              </span>
                              <span className={cx(s.thumb, !entry.thumbnail && s.thumbEmpty)}>{entry.thumbnail}</span>
                            </button>
                            <Menu
                              label={`Actions for ${entry.title}`}
                              icon={<MoreVerticalIcon strokeWidth={2.4} />}
                              buttonSize="xs"
                              items={[
                                { label: 'Restore to this step…', icon: <HistoryIcon />, onSelect: () => onRestore?.(entry), disabled: isCurrent },
                                { label: 'Save as version', icon: <BookmarkIcon />, onSelect: () => onSaveVersion?.(entry) },
                              ]}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
          )}
        </div>

        <div role="tabpanel" id={`${uid}-panel-versions`} aria-labelledby={`${uid}-tab-versions`} hidden={tab !== 'versions'} className={s.panel}>
          {savedVersions.length === 0 ? (
            <Empty icon={<BookmarkIcon strokeWidth={1.8} />} title="No saved versions yet" text="Choose “Save as version” from any step’s menu to keep a snapshot you can return to." />
          ) : (
            <ul className={s.versions}>
              {savedVersions.map((v) => (
                <li key={v.id} className={s.version}>
                  <span className={cx(s.thumb, s.thumbLg, !v.thumbnail && s.thumbEmpty)}>{v.thumbnail}</span>
                  <div className={s.versionText}>
                    <p className={s.entryTitle}>{v.name}</p>
                    <p className={s.versionSource}>
                      {v.sourceTitle} · {v.sourceTime}
                    </p>
                    <p className={s.versionSaved}>Saved {v.savedAt}</p>
                  </div>
                  <Button variant="outlineAccent" onClick={() => onRestoreVersion?.(v)} aria-label={`Restore ${v.name}`}>
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {tab === 'timeline' && entries.length > 0 && (
        <footer className={s.footer}>
          <Button variant="outlineAccent" size="md" disabled={!selected || selected.id === currentId} onClick={() => selected && onRestore?.(selected)} className={s.restore}>
            {selected && selected.id === currentId ? 'This is the current version' : 'Restore to this version'}
          </Button>
          <Menu
            label="More version actions"
            placement="top"
            buttonVariant="outline"
            buttonSize="md"
            icon={<MoreHorizontalIcon strokeWidth={2.4} />}
            items={[
              { label: 'Save selected as version', icon: <BookmarkIcon />, onSelect: () => selected && onSaveVersion?.(selected), disabled: !selected },
              { label: 'View saved versions', onSelect: () => setTab('versions') },
            ]}
          />
        </footer>
      )}
    </section>
  );
}

function Empty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon} aria-hidden="true">
        {icon}
      </span>
      <p className={s.emptyTitle}>{title}</p>
      <p className={s.emptyText}>{text}</p>
    </div>
  );
}
