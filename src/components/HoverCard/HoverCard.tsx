import { cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState, type FocusEvent, type PointerEvent, type ReactElement, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './HoverCard.module.css';

export type HoverCardProps = {
  /** The hovered element: a printer name, a model chip, an avatar. Should be focusable for keyboard users. */
  trigger: ReactNode;
  /** Rich preview content. */
  children: ReactNode;
  /** Milliseconds of hover or focus before the card opens. */
  openDelay?: number;
  /** Milliseconds after the pointer leaves before the card closes; moving onto the card keeps it open. */
  closeDelay?: number;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  width?: 'sm' | 'md' | 'lg';
  /** Controlled / forced open state (docs and tests). Leave undefined for hover behaviour. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
};

const ALIGN = { start: 'alignStart', center: 'alignCenter', end: 'alignEnd' } as const;

/** Rich preview on hover or focus with open/close delays: printer status, model details, collaborator cards. */
export function HoverCard({
  trigger,
  children,
  openDelay = 500,
  closeDelay = 200,
  placement = 'bottom',
  align = 'start',
  width = 'md',
  open: openProp,
  onOpenChange,
  disabled,
  className,
}: HoverCardProps) {
  const id = useId();
  const [ownOpen, setOwnOpen] = useState(false);
  const open = !disabled && (openProp ?? ownOpen);
  const timer = useRef<number>();
  const wrapRef = useRef<HTMLSpanElement>(null);

  const set = useCallback(
    (next: boolean) => {
      setOwnOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );
  const schedule = useCallback(
    (next: boolean, delay: number) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => set(next), delay);
    },
    [set],
  );
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      window.clearTimeout(timer.current);
      set(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, set]);

  const onEnter = (e: PointerEvent) => e.pointerType !== 'touch' && !disabled && schedule(true, open ? 0 : openDelay);
  const onLeave = (e: PointerEvent) => e.pointerType !== 'touch' && schedule(false, closeDelay);
  const onFocus = () => !disabled && schedule(true, openDelay);
  const onBlur = (e: FocusEvent) => {
    if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) schedule(false, 0);
  };

  const triggerNode = isValidElement(trigger) ? cloneElement(trigger as ReactElement<{ 'aria-describedby'?: string }>, { 'aria-describedby': open ? id : undefined }) : trigger;

  return (
    <span ref={wrapRef} className={cx(s.anchor, className)} onPointerEnter={onEnter} onPointerLeave={onLeave} onFocus={onFocus} onBlur={onBlur}>
      {triggerNode}
      {open && (
        <div id={id} className={cx(s.card, s[placement], s[ALIGN[align]], s[width])}>
          {children}
        </div>
      )}
    </span>
  );
}
