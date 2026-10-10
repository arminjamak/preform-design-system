import { useCallback, useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Popover } from '../Popover/Popover';
import s from './MegaMenu.module.css';

export type MegaMenuLink = {
  label: string;
  description?: string;
  /** Renders the entry as a link. */
  href?: string;
  onSelect?: () => void;
  icon?: ReactNode;
};

export type MegaMenuColumn = { title: string; items: MegaMenuLink[] };

export type MegaMenuProps = WithForcedState & {
  /** Trigger text. */
  label: string;
  columns: MegaMenuColumn[];
  /** Optional promo cell on the right (see `MegaMenuFeatured`). */
  featured?: ReactNode;
  /** Panel alignment relative to the trigger. */
  align?: 'start' | 'center' | 'end';
  /** `inverse` matches the dark top navigation bar. */
  variant?: 'default' | 'inverse';
  /** Controlled open state; omit for uncontrolled. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/** Top-level trigger that opens a wide panel of categorised link columns, with an optional featured card. */
export function MegaMenu({
  label,
  columns,
  featured,
  align = 'start',
  variant = 'default',
  open: openProp,
  onOpenChange,
  disabled,
  className,
  'data-state': state,
}: MegaMenuProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusFirst = useRef(false);

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInnerOpen(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  const close = useCallback(() => {
    const hadFocus = panelRef.current?.contains(document.activeElement);
    setOpen(false);
    if (hadFocus) triggerRef.current?.focus();
  }, [setOpen]);

  useEffect(() => {
    if (open && focusFirst.current) {
      focusFirst.current = false;
      panelRef.current?.querySelector<HTMLElement>('[data-mega-item]')?.focus();
    }
  }, [open]);

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (open) panelRef.current?.querySelector<HTMLElement>('[data-mega-item]')?.focus();
      else {
        focusFirst.current = true;
        setOpen(true);
      }
    }
  };

  // Arrow keys: up/down within a column, left/right between columns (keeping the row).
  const onPanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const cols = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-mega-col]')).map((col) => Array.from(col.querySelectorAll<HTMLElement>('[data-mega-item]')));
    const c = cols.findIndex((col) => col.includes(document.activeElement as HTMLElement));
    if (c < 0) return;
    const r = cols[c].indexOf(document.activeElement as HTMLElement);
    const go = (ci: number, ri: number) => {
      e.preventDefault();
      const col = cols[(ci + cols.length) % cols.length];
      col[Math.max(0, Math.min(ri, col.length - 1))]?.focus();
    };
    switch (e.key) {
      case 'ArrowDown':
        return go(c, (r + 1) % cols[c].length);
      case 'ArrowUp':
        return go(c, (r - 1 + cols[c].length) % cols[c].length);
      case 'ArrowRight':
        return go(c + 1, r);
      case 'ArrowLeft':
        return go(c - 1, r);
      case 'Home':
        return go(c, 0);
      case 'End':
        return go(c, cols[c].length - 1);
    }
  };

  // Close when keyboard focus leaves the trigger and panel.
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (open && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
  };

  const select = (item: MegaMenuLink) => {
    item.onSelect?.();
    close();
  };

  return (
    <div className={cx(s.root, className)} onBlur={onBlur}>
      <Popover
        open={open}
        onClose={close}
        placement="bottom"
        align={align}
        padded={false}
        trigger={
          <button
            ref={triggerRef}
            type="button"
            disabled={disabled}
            data-state={state}
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            className={cx(s.trigger, s[variant])}
            onClick={() => setOpen(!open)}
            onKeyDown={onTriggerKeyDown}
          >
            {label}
            <ChevronDownIcon className={s.chevron} strokeWidth={2.4} aria-hidden="true" />
          </button>
        }
      >
        <div
          ref={panelRef}
          id={panelId}
          role="region"
          aria-label={label}
          className={s.panel}
          onKeyDown={onPanelKeyDown}
        >
          {columns.map((col, ci) => {
            const headingId = `${panelId}-col-${ci}`;
            return (
              <div key={col.title} className={s.column} data-mega-col="">
                <div id={headingId} className={s.heading}>
                  {col.title}
                </div>
                <ul className={s.list} aria-labelledby={headingId}>
                  {col.items.map((item) => {
                    const content = (
                      <>
                        {item.icon && (
                          <span className={s.icon} aria-hidden="true">
                            {item.icon}
                          </span>
                        )}
                        <span className={s.text}>
                          <span className={s.label}>{item.label}</span>
                          {item.description && <span className={s.description}>{item.description}</span>}
                        </span>
                      </>
                    );
                    return (
                      <li key={item.label}>
                        {item.href ? (
                          <a href={item.href} data-mega-item="" className={s.item} onClick={() => select(item)}>
                            {content}
                          </a>
                        ) : (
                          <button type="button" data-mega-item="" className={s.item} onClick={() => select(item)}>
                            {content}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          {featured && <div className={s.featured}>{featured}</div>}
        </div>
      </Popover>
    </div>
  );
}

export type MegaMenuFeaturedProps = {
  /** Small uppercase kicker ("New", "Webinar"). */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Visual above the text (image, icon tile). */
  media?: ReactNode;
  /** Call to action, usually a `Button`. */
  action?: ReactNode;
  className?: string;
};

/** Promo card content for the MegaMenu `featured` slot. */
export function MegaMenuFeatured({ eyebrow, title, description, media, action, className }: MegaMenuFeaturedProps) {
  return (
    <div className={cx(s.feature, className)}>
      {media && <div className={s.featureMedia}>{media}</div>}
      {eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}
      <span className={s.featureTitle}>{title}</span>
      {description && <span className={s.featureDescription}>{description}</span>}
      {action && <div className={s.featureAction}>{action}</div>}
    </div>
  );
}
