import { useId, useRef, useState, type CSSProperties, type HTMLAttributes, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import { useOverlayBehavior, usePresence } from './overlay';
import s from './Sheet.module.css';

export type SheetSide = 'right' | 'left' | 'bottom';
export type SheetSize = 'sm' | 'md' | 'lg';

export type SheetProps = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> & {
  open: boolean;
  onRequestClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Sticky action row under the body (Cancel / Apply). */
  footer?: ReactNode;
  /** Edge the sheet slides in from. */
  side?: SheetSide;
  /** Width for side sheets (300 / 380 / 520), height for bottom sheets (320 / 520 / near full). */
  size?: SheetSize;
  /** Extra controls in the header, left of the close button (reset, overflow menu). */
  headerActions?: ReactNode;
  /** Grab bar on bottom sheets; dragging it down past a third of the sheet dismisses. Defaults to true for `bottom`. */
  showHandle?: boolean;
  /** Clicking the scrim requests close. Default true. */
  closeOnScrimClick?: boolean;
  /** Element focused on open. Defaults to the sheet itself. */
  initialFocusRef?: RefObject<HTMLElement>;
  /** Render in place instead of portalling to <body> (docs and tests). */
  inline?: boolean;
  className?: string;
};

/** Side or bottom sheet: Print settings, job details, material picker on narrow layouts. Slides in over a `--color-bg-overlay` scrim. */
export function Sheet({
  open,
  onRequestClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  size = 'md',
  headerActions,
  showHandle,
  closeOnScrimClick = true,
  initialFocusRef,
  inline,
  className,
  style,
  ...rest
}: SheetProps) {
  const titleId = useId();
  const descId = useId();
  const { mounted, state } = usePresence(open);
  const { ref, onKeyDown } = useOverlayBehavior<HTMLDivElement>({ open, onClose: onRequestClose, inline, initialFocusRef });
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<number | null>(null);
  const handle = showHandle ?? side === 'bottom';

  if (!mounted) return null;

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStart.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    setDragY(Math.max(0, e.clientY - dragStart.current));
  };
  const onPointerUp = () => {
    if (dragStart.current === null) return;
    const height = ref.current?.offsetHeight ?? 0;
    dragStart.current = null;
    setDragging(false);
    if (height && dragY > height / 3) onRequestClose();
    else setDragY(0);
  };

  const node = (
    <div className={cx(s.root, s[side], inline && s.inline)} data-presence={state}>
      <div className={s.scrim} aria-hidden="true" onMouseDown={() => closeOnScrimClick && onRequestClose()} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cx(s.panel, s[size], dragging && s.dragging, className)}
        style={{ ...style, ...(dragY ? ({ '--sheet-drag': dragY } as CSSProperties) : null) }}
        {...rest}
      >
        {handle && side === 'bottom' && (
          <div className={s.handleZone} aria-hidden="true" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
            <span className={s.handle} />
          </div>
        )}
        <header className={cx(s.header, handle && side === 'bottom' && s.headerWithHandle)}>
          <div className={s.titles}>
            <h2 id={titleId} className={s.title}>
              {title}
            </h2>
            {description && (
              <p id={descId} className={s.description}>
                {description}
              </p>
            )}
          </div>
          {headerActions && <div className={s.headerActions}>{headerActions}</div>}
          <IconButton label="Close" icon={<XIcon strokeWidth={2.6} />} size="sm" onClick={onRequestClose} />
        </header>
        <div className={s.body}>{children}</div>
        {footer && <footer className={s.footer}>{footer}</footer>}
      </div>
    </div>
  );
  return inline ? node : createPortal(node, document.body);
}
