import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import s from './TextArea.module.css';

export type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> &
  WithForcedState & {
    /** Visible label above the field; also the accessible name. */
    label: string;
    /** Keep the label for assistive tech only (e.g. when a FieldRow already labels it). */
    hideLabel?: boolean;
    value: string;
    onChange: (value: string) => void;
    /** Visible lines before scrolling. */
    rows?: number;
    resize?: 'none' | 'vertical';
    maxLength?: number;
    /** Show a `12 / 280` counter under the field. Needs `maxLength`. */
    showCount?: boolean;
    /** Helper text under the field. */
    hint?: string;
    size?: Size;
    invalid?: boolean;
    fullWidth?: boolean;
  };

/** Multi-line text input for job notes and print descriptions, styled like TextField. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    label,
    hideLabel,
    value,
    onChange,
    rows = 3,
    resize = 'vertical',
    maxLength,
    showCount,
    hint,
    size = 'sm',
    invalid,
    fullWidth,
    disabled,
    className,
    id,
    'data-state': state,
    'aria-describedby': describedBy,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const hintId = `${autoId}-hint`;
  const countId = `${autoId}-count`;
  const counting = showCount && maxLength !== undefined;
  const ratio = counting ? value.length / maxLength : 0;
  const describers = [describedBy, hint && hintId, counting && countId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(s.field, s[size], fullWidth && s.fullWidth, className)}>
      {!hideLabel && (
        <label htmlFor={inputId} className={s.label}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        aria-label={hideLabel ? label : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describers}
        rows={rows}
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        data-state={state}
        onChange={(e) => onChange(e.target.value)}
        className={cx(s.textarea, resize === 'none' ? s.resizeNone : s.resizeVertical, invalid && s.invalid)}
        {...rest}
      />
      {(hint || counting) && (
        <div className={s.footer}>
          {hint && (
            <p id={hintId} className={s.hint}>
              {hint}
            </p>
          )}
          {counting && (
            <span id={countId} className={cx(s.count, ratio >= 1 ? s.countFull : ratio >= 0.9 && s.countNear)}>
              <span aria-hidden="true">
                {value.length} / {maxLength}
              </span>
              <span className={s.srOnly}>
                {value.length} of {maxLength} characters used
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
});
