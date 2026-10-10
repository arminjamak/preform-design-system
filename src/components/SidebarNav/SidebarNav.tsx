import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronRightIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Badge } from '../Badge/Badge';
import { IconButton } from '../IconButton/IconButton';
import { Tooltip } from '../Tooltip/Tooltip';
import s from './SidebarNav.module.css';

export type SidebarNavItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Small count badge (jobs in queue, unread alerts). */
  count?: number;
  /** Nested destinations, shown in a collapsible group. */
  children?: SidebarNavItem[];
  disabled?: boolean;
};

export type SidebarNavSection = { title?: string; items: SidebarNavItem[] };

/* ------------------------------------------------------------------------ */

export type SidebarNavButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> &
  WithForcedState & {
    label: string;
    icon?: ReactNode;
    count?: number;
    selected?: boolean;
    /** A descendant is the current page (parent rows get an accent icon and bold label). */
    childSelected?: boolean;
    /** `true`/`false` renders a disclosure chevron; leave undefined for leaf rows. */
    expanded?: boolean;
    /** Nesting level; each level indents by one icon width. */
    depth?: number;
    /** Icon-only row with the label in a tooltip. */
    collapsed?: boolean;
  };

/** One row of the sidebar: icon, label, optional count and disclosure chevron. */
export const SidebarNavButton = forwardRef<HTMLButtonElement, SidebarNavButtonProps>(function SidebarNavButton(
  { label, icon, count, selected, childSelected, expanded, depth = 0, collapsed, className, style, type = 'button', ...rest },
  ref,
) {
  const tip = count !== undefined ? `${label} · ${count}` : label;
  const button = (
    <button
      ref={ref}
      type={type}
      aria-current={selected ? 'page' : undefined}
      aria-expanded={collapsed ? undefined : expanded}
      aria-label={collapsed ? tip : undefined}
      className={cx(s.item, selected && s.selected, childSelected && s.childSelected, collapsed && s.iconOnly, className)}
      style={{ '--depth': depth, ...style } as CSSProperties}
      {...rest}
    >
      <span className={s.icon} aria-hidden="true">
        {icon ?? (collapsed ? <span className={s.initial}>{label.charAt(0)}</span> : null)}
      </span>
      {!collapsed && <span className={s.label}>{label}</span>}
      {!collapsed && count !== undefined && (
        <Badge size="sm" tone={selected ? 'accent' : 'neutral'} variant="soft" className={s.count}>
          {count}
        </Badge>
      )}
      {!collapsed && expanded !== undefined && <ChevronRightIcon className={s.chevron} strokeWidth={2.4} aria-hidden="true" />}
      {collapsed && count !== undefined && count > 0 && <span className={s.dot} aria-hidden="true" />}
    </button>
  );
  return collapsed ? (
    <Tooltip content={tip} className={s.tip}>
      {button}
    </Tooltip>
  ) : (
    button
  );
});

/* ------------------------------------------------------------------------ */

const contains = (item: SidebarNavItem, id: string | null): boolean => !!id && !!item.children?.some((c) => c.id === id || contains(c, id));

const ancestorsOf = (sections: SidebarNavSection[], id: string | null): string[] => {
  const out: string[] = [];
  const visit = (items: SidebarNavItem[]) =>
    items.forEach((item) => {
      if (contains(item, id)) out.push(item.id);
      if (item.children) visit(item.children);
    });
  sections.forEach((sec) => visit(sec.items));
  return out;
};

const firstLeaf = (item: SidebarNavItem): SidebarNavItem | undefined => {
  if (!item.children?.length) return item.disabled ? undefined : item;
  for (const c of item.children) {
    const leaf = firstLeaf(c);
    if (leaf) return leaf;
  }
  return undefined;
};

const FOCUSABLE = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export type SidebarNavProps = Omit<HTMLAttributes<HTMLElement>, 'onChange'> & {
  sections: SidebarNavSection[];
  /** Id of the current destination. */
  value: string | null;
  onChange: (id: string) => void;
  /** Icon-only rail with tooltips (inline variant only). */
  collapsed?: boolean;
  /** `inline` sits in the layout; `drawer` is a modal left slide-in with a scrim. */
  variant?: 'inline' | 'drawer';
  /** Drawer visibility. */
  open?: boolean;
  /** Called on Escape, scrim click, the close button and (in the drawer) after a selection. */
  onClose?: () => void;
  /** Accessible name of the navigation landmark. */
  label?: string;
  /** Content above the list (project name, New Build button). */
  header?: ReactNode;
  /** Content pinned below the list (account, settings). */
  footer?: ReactNode;
  /** Group ids expanded on first render (ancestors of `value` always open). */
  defaultExpanded?: string[];
  /** Drawer only: portal to `document.body` (default) or render inside the nearest positioned ancestor. */
  portal?: boolean;
};

/** Sectioned sidebar navigation with nested groups, counts and a collapsed icon mode; doubles as the modal navigation drawer. */
export function SidebarNav({
  sections,
  value,
  onChange,
  collapsed = false,
  variant = 'inline',
  open = false,
  onClose,
  label = 'Main navigation',
  header,
  footer,
  defaultExpanded,
  portal = true,
  className,
  ...rest
}: SidebarNavProps) {
  const baseId = useId();
  const isDrawer = variant === 'drawer';
  const iconOnly = collapsed && !isDrawer;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([...(defaultExpanded ?? []), ...ancestorsOf(sections, value)]));
  const drawerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Keep the current page visible when it changes from outside.
  useEffect(() => {
    const need = ancestorsOf(sections, value);
    if (need.length) setExpanded((prev) => (need.every((id) => prev.has(id)) ? prev : new Set([...prev, ...need])));
  }, [sections, value]);

  const setGroup = useCallback((id: string, next: boolean) => {
    setExpanded((prev) => {
      if (prev.has(id) === next) return prev;
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }, []);

  // Drawer: move focus inside, close on Escape, restore focus on close.
  useEffect(() => {
    if (!isDrawer || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = drawerRef.current;
    const target = root?.querySelector<HTMLElement>('[aria-current="page"]') ?? root?.querySelector<HTMLElement>('[data-nav-item]:not(:disabled)') ?? root;
    target?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onCloseRef.current?.();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [isDrawer, open]);

  const select = (id: string) => {
    onChange(id);
    if (isDrawer) onClose?.();
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[data-nav-item]:not(:disabled)'));
    const current = document.activeElement as HTMLButtonElement | null;
    const index = current ? items.indexOf(current) : -1;
    if (index < 0) return;
    const focusAt = (i: number) => {
      e.preventDefault();
      items[(i + items.length) % items.length]?.focus();
    };
    const id = current?.dataset.navId;
    const parent = current?.dataset.navParent;
    switch (e.key) {
      case 'ArrowDown':
        return focusAt(index + 1);
      case 'ArrowUp':
        return focusAt(index - 1);
      case 'Home':
        return focusAt(0);
      case 'End':
        return focusAt(items.length - 1);
      case 'ArrowRight':
        if (id && current?.getAttribute('aria-expanded') === 'false') {
          e.preventDefault();
          setGroup(id, true);
        }
        return;
      case 'ArrowLeft':
        if (id && current?.getAttribute('aria-expanded') === 'true') {
          e.preventDefault();
          setGroup(id, false);
        } else if (parent) {
          const p = items.find((el) => el.dataset.navId === parent);
          if (p) focusAt(items.indexOf(p));
        }
        return;
    }
  };

  const renderItems = (items: SidebarNavItem[], depth: number, parentId?: string, labelledBy?: string, listId?: string) => (
    <ul className={s.list} aria-labelledby={labelledBy} id={listId}>
      {items.map((item) => {
        const hasChildren = !!item.children?.length;
        const isOpen = hasChildren && expanded.has(item.id);
        const childSelected = contains(item, value);
        const childListId = `${baseId}-${item.id}`;
        return (
          <li key={item.id}>
            <SidebarNavButton
              data-nav-item=""
              data-nav-id={item.id}
              data-nav-parent={parentId}
              label={item.label}
              icon={item.icon}
              count={item.count}
              depth={depth}
              collapsed={iconOnly}
              disabled={item.disabled}
              selected={value === item.id || (iconOnly && childSelected)}
              childSelected={!iconOnly && childSelected}
              expanded={hasChildren ? isOpen : undefined}
              aria-controls={hasChildren && !iconOnly && isOpen ? childListId : undefined}
              onClick={() => {
                if (!hasChildren) return select(item.id);
                if (iconOnly) {
                  const leaf = firstLeaf(item);
                  if (leaf) select(leaf.id);
                  return;
                }
                setGroup(item.id, !isOpen);
              }}
            />
            {hasChildren && isOpen && !iconOnly && renderItems(item.children!, depth + 1, item.id, undefined, childListId)}
          </li>
        );
      })}
    </ul>
  );

  const nav = (
    <nav
      aria-label={label}
      className={cx(s.root, iconOnly && s.collapsed, isDrawer && s.inDrawer, !isDrawer && className)}
      {...(isDrawer ? {} : rest)}
    >
      {header && !isDrawer && <div className={s.header}>{header}</div>}
      <div className={s.body} onKeyDown={onListKeyDown}>
        {sections.map((section, i) => {
          const headingId = section.title ? `${baseId}-section-${i}` : undefined;
          return (
            <div key={section.title ?? i} className={s.section}>
              {section.title && (
                <div id={headingId} className={cx(s.heading, iconOnly && s.srOnly)}>
                  {section.title}
                </div>
              )}
              {renderItems(section.items, 0, undefined, headingId)}
            </div>
          );
        })}
      </div>
      {footer && <div className={s.footer}>{footer}</div>}
    </nav>
  );

  if (!isDrawer) return nav;
  if (!open) return null;

  const trapTab = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !drawerRef.current) return;
    const nodes = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const drawer = (
    <div className={cx(s.scrim, !portal && s.contained)} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={drawerRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={cx(s.drawer, className)} onKeyDown={trapTab} {...rest}>
        <div className={s.drawerHeader}>
          <div className={s.drawerHeaderContent}>{header}</div>
          <IconButton label="Close navigation" icon={<XIcon strokeWidth={2.6} />} size="sm" onClick={onClose} />
        </div>
        {nav}
      </div>
    </div>
  );
  return portal ? createPortal(drawer, document.body) : drawer;
}
