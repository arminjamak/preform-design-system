import {
  forwardRef,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { AlertCircleIcon, CheckIcon, LinkIcon, MailIcon, PhoneIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { TextField, type TextFieldProps } from '../TextField/TextField';
import s from './FormattedField.module.css';

export type FormattedFieldProps = Omit<TextFieldProps, 'type' | 'inputMode' | 'iconEnd' | 'invalid'> & {
  /** Keep the label for assistive tech only. */
  hideLabel?: boolean;
  /** Force the invalid styling on or off. When omitted, the field's own blur validation decides. */
  invalid?: boolean;
  /** Empty values fail validation and the label shows a required marker. */
  required?: boolean;
  /** Helper text shown under the field while there is no error. */
  hint?: string;
  /** External error message (e.g. from the server). Shown instead of the built-in validation message. */
  error?: string;
};

type Config = {
  type: 'email' | 'url' | 'tel';
  inputMode: HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete: string;
  placeholder: string;
  icon: ReactNode;
  /** Returns an error message, or null when the (non-empty) value is valid. */
  validate: (value: string) => string | null;
  /** Reformat on every keystroke (caret is preserved by digit count). */
  format?: (value: string) => string;
  /** Tidy the value on blur before validating. */
  normalize?: (value: string) => string;
};

/* ---------- Email ---------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function validateEmail(value: string): string | null {
  return EMAIL.test(value.trim()) ? null : 'Enter an email address like name@example.com.';
}

/* ---------- URL ---------- */

const hasScheme = (v: string) => /^[a-z][a-z\d+.-]*:\/\//i.test(v);
export function normalizeUrl(value: string): string {
  const v = value.trim();
  return v && !hasScheme(v) ? `https://${v}` : v;
}
export function validateUrl(value: string): string | null {
  try {
    const url = new URL(normalizeUrl(value));
    const okHost = url.hostname.includes('.') || url.hostname === 'localhost';
    return (url.protocol === 'http:' || url.protocol === 'https:') && okHost ? null : 'Enter a web address like https://example.com.';
  } catch {
    return 'Enter a web address like https://example.com.';
  }
}

/* ---------- Phone ---------- */

/**
 * Formats as the user types. North American numbers (no `+`, or `+1`) group as
 * `(617) 555-0142` / `+1 (617) 555-0142`; other `+` country codes keep their digits ungrouped.
 */
export function formatPhone(input: string): string {
  const hasPlus = input.trimStart().startsWith('+');
  let digits = input.replace(/\D/g, '');
  if (hasPlus && !digits.startsWith('1')) return `+${digits.slice(0, 15)}`;
  const withCountry = hasPlus || digits.startsWith('1');
  if (withCountry) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  const [a, b, c] = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)];
  const national = digits.length > 6 ? `(${a}) ${b}-${c}` : digits.length > 3 ? `(${a}) ${b}` : digits.length > 0 ? `(${a}` : '';
  if (!withCountry) return national;
  return national ? `+1 ${national}` : '+1';
}
export function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  const international = value.trimStart().startsWith('+') && !digits.startsWith('1');
  if (international) return digits.length >= 8 && digits.length <= 15 ? null : 'Enter 8–15 digits including the country code.';
  const national = digits.startsWith('1') ? digits.slice(1) : digits;
  return national.length === 10 ? null : 'Enter a 10-digit number, e.g. +1 (617) 555-0142.';
}

/** Puts the caret after the `count`-th digit of `text`. */
function caretAfterDigits(text: string, count: number): number {
  if (count === 0) return text.startsWith('+') ? 1 : 0;
  let seen = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (/\d/.test(text.charAt(i))) seen += 1;
    if (seen === count) return i + 1;
  }
  return text.length;
}

/* ---------- Shared field ---------- */

const FormattedField = forwardRef<HTMLInputElement, FormattedFieldProps & { config: Config }>(function FormattedField(
  {
    config,
    label,
    hideLabel,
    value,
    onChange,
    invalid: invalidProp,
    required,
    hint,
    error: errorProp,
    fullWidth,
    size = 'sm',
    disabled,
    className,
    id,
    placeholder,
    iconStart,
    autoComplete,
    onBlur,
    'aria-describedby': describedBy,
    ...rest
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const messageId = `${autoId}-message`;

  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const pendingCaret = useRef<number | null>(null);

  const check = (v: string) => (v.trim() === '' ? (required ? `${label} is required.` : null) : config.validate(v));

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (pendingCaret.current === null || !el || document.activeElement !== el) return;
    el.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  }, [value]);

  const handleChange = (raw: string) => {
    let next = raw;
    if (config.format) {
      next = config.format(raw);
      const el = inputRef.current;
      const caret = el?.selectionStart ?? raw.length;
      const digitsBefore = raw.slice(0, caret).replace(/\D/g, '').length;
      pendingCaret.current = caret >= raw.length ? next.length : caretAfterDigits(next, digitsBefore);
    }
    onChange(next);
    // Errors appear on blur, but clear as soon as the value is fixed.
    if (error && check(next) === null) setError(null);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const normalized = config.normalize ? config.normalize(value) : value;
    if (normalized !== value) onChange(normalized);
    setError(check(normalized));
    setTouched(true);
    onBlur?.(e);
  };

  const shownError = errorProp ?? error;
  const invalid = invalidProp ?? shownError != null;
  const showValid = touched && shownError == null && invalidProp !== true && value.trim() !== '' && check(value) === null;
  const message = shownError ?? hint;
  const describers = [describedBy, message && messageId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(s.field, fullWidth && s.fullWidth, className)}>
      {!hideLabel && (
        <label htmlFor={inputId} className={s.label}>
          {label}
          {required && (
            <span className={s.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <TextField
        ref={inputRef}
        id={inputId}
        type={config.type}
        inputMode={config.inputMode}
        autoComplete={autoComplete ?? config.autoComplete}
        spellCheck={false}
        label={label}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder ?? config.placeholder}
        size={size}
        disabled={disabled}
        required={required}
        invalid={invalid}
        aria-describedby={describers}
        iconStart={iconStart === undefined ? config.icon : iconStart}
        iconEnd={showValid ? <CheckIcon strokeWidth={2.4} className={s.valid} aria-label="Valid" role="img" /> : undefined}
        className={s.control}
        {...rest}
      />
      {shownError != null ? (
        <p id={messageId} role="alert" className={cx(s.message, s.error)}>
          <AlertCircleIcon strokeWidth={2.2} aria-hidden="true" />
          <span>{shownError}</span>
        </p>
      ) : (
        hint && (
          <p id={messageId} className={s.message}>
            {hint}
          </p>
        )
      )}
    </div>
  );
});

/* ---------- Public fields ---------- */

const EMAIL_CONFIG: Config = {
  type: 'email',
  inputMode: 'email',
  autoComplete: 'email',
  placeholder: 'name@example.com',
  icon: <MailIcon strokeWidth={2.2} aria-hidden="true" />,
  validate: validateEmail,
  normalize: (v) => v.trim(),
};
const URL_CONFIG: Config = {
  type: 'url',
  inputMode: 'url',
  autoComplete: 'url',
  placeholder: 'https://',
  icon: <LinkIcon strokeWidth={2.2} aria-hidden="true" />,
  validate: validateUrl,
  normalize: normalizeUrl,
};
const PHONE_CONFIG: Config = {
  type: 'tel',
  inputMode: 'tel',
  autoComplete: 'tel',
  placeholder: '+1 (617) 555-0142',
  icon: <PhoneIcon strokeWidth={2.2} aria-hidden="true" />,
  validate: validatePhone,
  format: formatPhone,
};

export type EmailFieldProps = FormattedFieldProps;
export type UrlFieldProps = FormattedFieldProps;
export type PhoneFieldProps = FormattedFieldProps;

/** Email input (`type=email`, `autocomplete=email`) that validates on blur. */
export const EmailField = forwardRef<HTMLInputElement, EmailFieldProps>(function EmailField(props, ref) {
  return <FormattedField ref={ref} config={EMAIL_CONFIG} {...props} />;
});

/** Web address input; adds `https://` on blur when the scheme is missing, then validates. */
export const UrlField = forwardRef<HTMLInputElement, UrlFieldProps>(function UrlField(props, ref) {
  return <FormattedField ref={ref} config={URL_CONFIG} {...props} />;
});

/** Phone input that formats as you type (`+1 (617) 555-0142`) and validates on blur. */
export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(function PhoneField(props, ref) {
  return <FormattedField ref={ref} config={PHONE_CONFIG} {...props} />;
});
