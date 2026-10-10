import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { MoreVerticalIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton, type IconButtonProps } from '../IconButton/IconButton';
import { MenuList, type MenuItem } from '../Menu/Menu';
import s from './DataTable.module.css';

export type RowActionsMenuProps = {
  /** Accessible name of the trigger, e.g. "Actions for Bracket_v3". */
  label: string;
  items: MenuItem[];
  buttonVariant?: IconButtonProps['variant'];
  buttonSize?: IconButtonProps['size'];
  className?: string;
};

type Anchor = { x: number; top: number; bottom: number; up: boolean };

const ITEM_SELECTOR = '[role="menuitem"]:not(:disabled)';
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * The ⋮ row actions menu. Same items and styling as `Menu`, but the list is portalled to the body and
 * positioned against the trigger so it is never clipped by a scrolling table body.
 * Arrow keys, Home and End move between items; Escape and Tab close and return focus to the trigger.
 */
export function RowActionsMenu({ label, items, buttonVariant = 'ghost', buttonSize = 'sm', className }: RowActionsMenuProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const open = anchor !== null;

  const close = useCallback((restoreFocus = true) => {
    setAnchor(null);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const toggle = () => {
    if (open) return close(false);
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setAnchor({ x: r.right, top: r.top, bottom: r.bottom, up: false });
  };

  // Flip above the trigger when there is no room below, then focus the first item.
  useIsoLayoutEffect(() => {
    const layer = layerRef.current;
    if (!anchor || !layer) return;
    const h = layer.getBoundingClientRect().height;
    if (!anchor.up && anchor.bottom + h > window.innerHeight && anchor.top > h) setAnchor({ ...anchor, up: true });
    layer.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus();
  }, [anchor]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!layerRef.current?.contains(t) && !triggerRef.current?.contains(t)) close(false);
    };
    const onMove = (e: Event) => {
      if (!layerRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, close]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Portal events still bubble through the React tree; keep them away from row handlers.
    e.stopPropagation();
    const list = Array.from(layerRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
    const i = list.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => list[(n + list.length) % list.length]?.focus();
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); go(i + 1); break;
      case 'ArrowUp': e.preventDefault(); go(i - 1); break;
      case 'Home': e.preventDefault(); go(0); break;
      case 'End': e.preventDefault(); go(list.length - 1); break;
      case 'Escape': e.preventDefault(); close(); break;
      case 'Tab': e.preventDefault(); close(); break;
    }
  };

  // Viewport coordinates are passed as unitless numbers and scaled by the 1px hairline token in CSS.
  const style = anchor ? ({ '--ra-x': anchor.x, '--ra-y': anchor.up ? anchor.top : anchor.bottom } as CSSProperties) : undefined;

  return (
    <>
      <IconButton
        ref={triggerRef}
        label={label}
        icon={<MoreVerticalIcon strokeWidth={2.4} />}
        variant={buttonVariant}
        size={buttonSize}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className={className}
      />
      {anchor &&
        createPortal(
          <div ref={layerRef} className={cx(s.actionsLayer, anchor.up && s.actionsLayerUp)} style={style} onKeyDown={onKeyDown} onClick={(e) => e.stopPropagation()}>
            <MenuList items={items} onSelect={() => close()} />
          </div>,
          document.body,
        )}
    </>
  );
}
