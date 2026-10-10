import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Menu, type MenuItem } from '../Menu/Menu';
import s from './Breadcrumbs.module.css';

export type BreadcrumbItem = {
  label: string;
  /** Renders the crumb as a link. */
  href?: string;
  /** Renders the crumb as a button (or runs alongside `href`). */
  onClick?: () => void;
  icon?: ReactNode;
};

export type BreadcrumbsProps = Omit<HTMLAttributes<HTMLElement>, 'children'> &
  WithForcedState & {
    items: BreadcrumbItem[];
    /** Collapse the middle crumbs into a "…" menu when there are more than this many items (minimum 2). */
    maxItems?: number;
    size?: 'sm' | 'md';
    /** Accessible name of the landmark. */
    label?: string;
  };

type Entry = { kind: 'item'; item: BreadcrumbItem; index: number } | { kind: 'collapsed'; items: BreadcrumbItem[] };

function collapse(items: BreadcrumbItem[], maxItems?: number): Entry[] {
  const all: Entry[] = items.map((item, index) => ({ kind: 'item', item, index }));
  if (!maxItems || items.length <= maxItems) return all;
  const tail = Math.max(1, maxItems - 1);
  return [all[0], { kind: 'collapsed', items: items.slice(1, items.length - tail) }, ...all.slice(items.length - tail)];
}

function follow(item: BreadcrumbItem) {
  if (item.onClick) item.onClick();
  else if (item.href) window.location.assign(item.href);
}

/** Path trail for nested locations: Projects / Mini Chassis Kit / Supports. The last crumb is the current page. */
export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
  { items, maxItems, size = 'md', label = 'Breadcrumb', className, 'data-state': state, ...rest },
  ref,
) {
  const entries = collapse(items, maxItems);
  const lastIndex = items.length - 1;

  return (
    <nav ref={ref} aria-label={label} className={cx(s.nav, s[size], className)} {...rest}>
      <ol className={s.list}>
        {entries.map((entry, i) => (
          <li key={entry.kind === 'item' ? `${entry.index}-${entry.item.label}` : 'collapsed'} className={s.item}>
            {i > 0 && (
              <span className={s.separator} aria-hidden="true">
                <ChevronRightIcon strokeWidth={2.2} />
              </span>
            )}
            {entry.kind === 'collapsed' ? (
              <Menu
                label={`Show ${entry.items.length} more location${entry.items.length === 1 ? '' : 's'}`}
                icon={<MoreHorizontalIcon strokeWidth={2.4} />}
                buttonSize={size === 'sm' ? 'xs' : 'sm'}
                align="start"
                items={entry.items.map<MenuItem>((it) => ({ label: it.label, icon: it.icon, onSelect: () => follow(it) }))}
              />
            ) : (
              <Crumb item={entry.item} current={entry.index === lastIndex} state={state} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
});

function Crumb({ item, current, state }: { item: BreadcrumbItem; current: boolean; state?: string }) {
  const content = (
    <>
      {item.icon && <span className={s.icon}>{item.icon}</span>}
      <span className={s.text}>{item.label}</span>
    </>
  );
  if (current) {
    return (
      <span aria-current="page" className={cx(s.crumb, s.current)} title={item.label}>
        {content}
      </span>
    );
  }
  if (item.href) {
    return (
      <a href={item.href} onClick={item.onClick} className={cx(s.crumb, s.interactive)} data-state={state} title={item.label}>
        {content}
      </a>
    );
  }
  if (item.onClick) {
    return (
      <button type="button" onClick={item.onClick} className={cx(s.crumb, s.interactive)} data-state={state} title={item.label}>
        {content}
      </button>
    );
  }
  return (
    <span className={s.crumb} title={item.label}>
      {content}
    </span>
  );
}
