import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../lib/cx';
import { MenuList, type MenuItem } from '../Menu/Menu';
import s from './ContextMenu.module.css';

export type ContextMenuProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  items: MenuItem[];
  /** The region that owns the menu. Give it a focusable element so keyboard users can open the menu. */
  children: ReactNode;
  /** Falls back to the browser's native context menu. */
  disabled?: boolean;
  /** Accessible name of the menu. */
  label?: string;
  onOpenChange?: (open: boolean) => void;
};

type Point = { x: number; y: number };

/** Reads a length token (e.g. --space-2) as pixels so viewport clamping stays on the token scale. */
function tokenPx(name: string): number {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(v) ? v : 0;
}

const ITEM_SELECTOR = '[role="menuitem"]:not(:disabled)';

/**
 * Right-click menu for viewport models, tray rows and file lists. Opens a MenuList at the pointer
 * (or at the focused element on Shift+F10 / the ContextMenu key), clamped inside the viewport.
 */
export function ContextMenu({ items, children, disabled, label = 'Context menu', onOpenChange, className, onContextMenu, onKeyDown, ...rest }: ContextMenuProps) {
  const [point, setPoint] = useState<Point | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; maxHeight: number } | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const open = point !== null;

  const openAt = useCallback(
    (p: Point) => {
      const active = document.activeElement;
      returnFocus.current = active instanceof HTMLElement && active !== document.body ? active : null;
      setPos(null);
      setPoint(p);
      onOpenChange?.(true);
    },
    [onOpenChange],
  );

  const close = useCallback(
    (restore: boolean) => {
      setPoint(null);
      setPos(null);
      onOpenChange?.(false);
      if (restore) returnFocus.current?.focus();
    },
    [onOpenChange],
  );

  const openFromElement = (el: Element) => {
    const r = el.getBoundingClientRect();
    openAt({ x: r.left + Math.min(r.width / 2, tokenPx('--space-6')), y: r.top + Math.min(r.height / 2, tokenPx('--space-6')) });
  };

  const handleContextMenu = (e: ReactMouseEvent<HTMLDivElement>) => {
    onContextMenu?.(e);
    if (disabled || e.defaultPrevented) return;
    e.preventDefault();
    // Keyboard-originated contextmenu events report 0,0: anchor to the focused element instead.
    if (e.clientX === 0 && e.clientY === 0) openFromElement(e.target as Element);
    else openAt({ x: e.clientX, y: e.clientY });
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (disabled || e.defaultPrevented) return;
    if ((e.key === 'F10' && e.shiftKey) || e.key === 'ContextMenu') {
      e.preventDefault();
      openFromElement(e.target as Element);
    }
  };

  // Measure once rendered (hidden), then clamp inside the viewport.
  useLayoutEffect(() => {
    if (!point || !layerRef.current) return;
    const margin = tokenPx('--space-2');
    const { width, height } = layerRef.current.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const maxHeight = vh - margin * 2;
    const h = Math.min(height, maxHeight);
    let left = point.x;
    let top = point.y;
    if (left + width > vw - margin) left = Math.max(margin, point.x - width);
    if (top + h > vh - margin) top = Math.max(margin, vh - margin - h);
    left = Math.max(margin, Math.min(left, vw - margin - width));
    setPos({ left, top, maxHeight });
  }, [point]);

  // Focus the first item and name the menu once positioned.
  useEffect(() => {
    if (!pos || !layerRef.current) return;
    layerRef.current.querySelector('[role="menu"]')?.setAttribute('aria-label', label);
    layerRef.current.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus();
  }, [pos, label]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!layerRef.current?.contains(e.target as Node)) close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
      }
    };
    const onScroll = (e: Event) => {
      if (!layerRef.current?.contains(e.target as Node)) close(false);
    };
    const onResize = () => close(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    window.addEventListener('blur', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('blur', onResize);
    };
  }, [open, close]);

  const onMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const list = Array.from(layerRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
    if (!list.length) return;
    const i = list.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;
    if (e.key === 'ArrowDown') next = list[(i + 1) % list.length];
    else if (e.key === 'ArrowUp') next = list[(i - 1 + list.length) % list.length];
    else if (e.key === 'Home') next = list[0];
    else if (e.key === 'End') next = list[list.length - 1];
    else if (e.key === 'Tab') {
      e.preventDefault();
      close(true);
      return;
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const ch = e.key.toLowerCase();
      const ordered = [...list.slice(i + 1), ...list.slice(0, i + 1)];
      next = ordered.find((el) => el.textContent?.trim().toLowerCase().startsWith(ch));
    }
    if (next) {
      e.preventDefault();
      next.focus();
    }
  };

  return (
    <div className={cx(s.trigger, className)} onContextMenu={handleContextMenu} onKeyDown={handleKeyDown} {...rest}>
      {children}
      {open &&
        createPortal(
          <div
            ref={layerRef}
            className={cx(s.layer, !pos && s.measuring)}
            style={pos ? { left: pos.left, top: pos.top, maxHeight: pos.maxHeight } : { left: 0, top: 0 }}
            onKeyDown={onMenuKeyDown}
            onContextMenu={(e) => e.preventDefault()}
          >
            <MenuList items={items} onSelect={() => close(true)} />
          </div>,
          document.body,
        )}
    </div>
  );
}
