import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import s from './Modal.module.css';

export type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onRequestClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Disables Escape while a nested confirmation is open. */
  suspendEscape?: boolean;
  /** Render in place instead of portalling to <body> (docs and tests). */
  inline?: boolean;
  className?: string;
};

/** Centered dialog with header, scrolling body and optional footer. Save/Manage Profiles, Export Mesh. */
export function Modal({ open, title, description, onRequestClose, children, footer, size = 'md', suspendEscape, inline, className }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open || suspendEscape) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onRequestClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onRequestClose, suspendEscape]);

  if (!open) return null;

  const node = (
    <div className={cx(s.scrim, inline && s.inline)} onMouseDown={(e) => e.target === e.currentTarget && onRequestClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={cx(s.dialog, s[size], className)}>
        <header className={s.header}>
          <div className={s.titles}>
            <h2 id={titleId} className={s.title}>
              {title}
            </h2>
            {description && <p className={s.description}>{description}</p>}
          </div>
          <IconButton label="Close" icon={<XIcon strokeWidth={2.6} />} size="sm" onClick={onRequestClose} />
        </header>
        <div className={s.body}>{children}</div>
        {footer && <footer className={s.footer}>{footer}</footer>}
      </div>
    </div>
  );
  return inline ? node : createPortal(node, document.body);
}
