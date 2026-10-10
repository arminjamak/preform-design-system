import { forwardRef, useId, useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import { TextField, type TextFieldProps } from '../TextField/TextField';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import s from './PasswordField.module.css';

export type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'iconStart' | 'iconEnd'> & {
  /** Keep the label for assistive tech only. */
  hideLabel?: boolean;
  /** Render a PasswordStrengthMeter under the field (for new passwords). */
  showStrength?: boolean;
  /** Start with the password revealed. */
  defaultVisible?: boolean;
};

/** Password input with a show/hide toggle; optional strength meter for account and printer-network setup. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { label, hideLabel, value, onChange, showStrength, defaultVisible = false, size = 'sm', disabled, fullWidth, className, id, autoComplete, 'aria-describedby': describedBy, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(defaultVisible);
  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const meterId = `${autoId}-meter`;
  const describers = [describedBy, showStrength && meterId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(s.field, fullWidth && s.fullWidth, className)}>
      {!hideLabel && (
        <label htmlFor={inputId} className={s.label}>
          {label}
        </label>
      )}
      <TextField
        ref={ref}
        id={inputId}
        type={visible ? 'text' : 'password'}
        label={label}
        value={value}
        onChange={onChange}
        size={size}
        disabled={disabled}
        autoComplete={autoComplete ?? (showStrength ? 'new-password' : 'current-password')}
        autoCapitalize="off"
        spellCheck={false}
        aria-describedby={describers}
        className={s.control}
        iconEnd={
          <IconButton
            label="Show password"
            icon={visible ? <EyeOffIcon strokeWidth={2.2} /> : <EyeIcon strokeWidth={2.2} />}
            pressed={visible}
            size={size === 'lg' ? 'sm' : 'xs'}
            disabled={disabled}
            className={s.toggle}
            onClick={() => setVisible((v) => !v)}
          />
        }
        {...rest}
      />
      {showStrength && <PasswordStrengthMeter id={meterId} value={value} className={s.meter} />}
    </div>
  );
});
