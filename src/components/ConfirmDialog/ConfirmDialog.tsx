import { useEffect, useRef } from 'react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import s from './ConfirmDialog.module.css';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  cancelLabel?: string;
  /** Optional third action, e.g. "Discard" alongside "Save". */
  secondaryLabel?: string;
  onSecondary?: () => void;
  tone?: 'default' | 'danger';
  inline?: boolean;
};

/** Compact alert dialog with a text cancel on the left and pill actions on the right. */
export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, cancelLabel = 'Keep Editing', secondaryLabel, onSecondary, tone = 'default', inline }: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className={cx(s.scrim, inline && s.inline)} onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message" className={s.dialog}>
        <h2 id="confirm-title" className={s.title}>
          {title}
        </h2>
        <p id="confirm-message" className={s.message}>
          {message}
        </p>
        <div className={s.actions}>
          <Button variant="link" className={s.cancel} onClick={onCancel}>
            {cancelLabel}
          </Button>
          {secondaryLabel && (
            <Button variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
          <Button ref={confirmRef} variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
