import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './Popover.module.css';

export type PopoverProps = {
  open: boolean;
  onClose: () => void;
  /** The element the popover is anchored to. */
  trigger: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
  width?: number;
  padded?: boolean;
  className?: string;
};

/** Floating surface anchored to a trigger; closes on outside click and Escape. Icon pickers, profile menus. */
export function Popover({ open, onClose, trigger, children, placement = 'bottom', align = 'start', width, padded = true, className }: PopoverProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <span ref={ref} className={cx(s.anchor, className)}>
      {trigger}
      {open && (
        <div className={cx(s.layer, s[placement], s[align], padded && s.padded)} style={width ? ({ '--pop-w': `${width}px` } as CSSProperties) : undefined}>
          {children}
        </div>
      )}
    </span>
  );
}
