import type { KeyboardEvent } from 'react';

/** Enabled menu items inside a container, in DOM order. */
const ITEM_SELECTOR = '[role="menuitem"]:not(:disabled), [role="menuitemcheckbox"]:not(:disabled), [role="menuitemradio"]:not(:disabled)';

const itemsIn = (container: Element | null) => (container ? Array.from(container.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : []);

/** Moves focus to the first or last enabled menu item inside `container`. */
export function focusMenuItem(container: Element | null, which: 'first' | 'last' = 'first') {
  const items = itemsIn(container);
  (which === 'first' ? items[0] : items[items.length - 1])?.focus();
}

export type MenuKeyOptions = {
  /** Escape pressed: close and return focus to the trigger. */
  onEscape?: () => void;
  /** Tab pressed: menus close on Tab (focus goes back to the trigger). Omit inside dialogs. */
  onTab?: () => void;
};

/**
 * Arrow-key roving for a `role="menu"` list (ArrowUp/Down wrap, Home/End jump).
 * Attach to an element that wraps the MenuList.
 */
export function handleMenuKeyDown(e: KeyboardEvent<HTMLElement>, { onEscape, onTab }: MenuKeyOptions = {}) {
  const items = itemsIn(e.currentTarget);
  const index = items.indexOf(document.activeElement as HTMLElement);
  const last = items.length - 1;
  let next: HTMLElement | undefined;
  switch (e.key) {
    case 'ArrowDown':
      next = items[index < 0 || index === last ? 0 : index + 1];
      break;
    case 'ArrowUp':
      next = items[index <= 0 ? last : index - 1];
      break;
    case 'Home':
      next = items[0];
      break;
    case 'End':
      next = items[last];
      break;
    case 'Escape':
      if (!onEscape) return;
      e.preventDefault();
      onEscape();
      return;
    case 'Tab':
      if (!onTab) return;
      e.preventDefault();
      onTab();
      return;
    default:
      return;
  }
  e.preventDefault();
  next?.focus();
}
