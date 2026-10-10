import { useId, useRef, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import s from './CodeInput.module.css';

export type CodeInputProps = WithForcedState & {
  /** Group label, e.g. "Verification code" or "Printer PIN". */
  label: string;
  /** Keep the label for assistive tech only. */
  hideLabel?: boolean;
  /** Number of boxes. */
  length?: number;
  /** The entered characters, contiguous from the first box. */
  value: string;
  onChange: (value: string) => void;
  /** Called once every box is filled. */
  onComplete?: (value: string) => void;
  /** Show dots instead of characters (PIN entry). */
  mask?: boolean;
  /** `numeric` accepts 0–9; `alphanumeric` accepts A–Z and 0–9 (upper-cased). */
  mode?: 'numeric' | 'alphanumeric';
  size?: Size;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Id of an element describing the group (e.g. an error message). */
  'aria-describedby'?: string;
  className?: string;
};

/** One-time-code / PIN entry: N single-character boxes with auto-advance, backspace-back and paste-to-fill. */
export function CodeInput({
  label,
  hideLabel,
  length = 6,
  value,
  onChange,
  onComplete,
  mask,
  mode = 'numeric',
  size = 'md',
  invalid,
  disabled,
  autoFocus,
  'aria-describedby': describedBy,
  className,
  'data-state': state,
}: CodeInputProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  // Latest committed value, so focus redirects see a change before React re-renders.
  const latest = useRef(value);
  latest.current = value.slice(0, length);

  const sanitize = (raw: string) => (mode === 'numeric' ? raw.replace(/\D/g, '') : raw.replace(/[^a-z0-9]/gi, '').toUpperCase());
  const chars = latest.current;
  const unit = mode === 'numeric' ? 'Digit' : 'Character';

  const focusBox = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(i, length - 1))];
    el?.focus();
    el?.select();
  };

  const commit = (next: string) => {
    const v = next.slice(0, length);
    if (v === latest.current) return;
    latest.current = v;
    onChange(v);
    if (v.length === length) onComplete?.(v);
  };

  const handleChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const old = chars[i] ?? '';
    if (raw === '') {
      commit(chars.slice(0, i) + chars.slice(i + 1));
      return;
    }
    // Caret landed beside the existing character: keep only what was typed.
    const typed = old && raw.length > 1 && raw.includes(old) ? raw.replace(old, '') : raw;
    const clean = sanitize(typed);
    if (!clean) return;
    commit(chars.slice(0, i) + clean + chars.slice(i + clean.length));
    focusBox(i + clean.length);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Backspace':
        e.preventDefault();
        if (chars[i]) commit(chars.slice(0, i) + chars.slice(i + 1));
        else if (i > 0) {
          commit(chars.slice(0, i - 1) + chars.slice(i));
          focusBox(i - 1);
        }
        return;
      case 'Delete':
        e.preventDefault();
        if (chars[i]) commit(chars.slice(0, i) + chars.slice(i + 1));
        return;
      case 'ArrowLeft':
        e.preventDefault();
        focusBox(i - 1);
        return;
      case 'ArrowRight':
        e.preventDefault();
        focusBox(Math.min(i + 1, chars.length));
        return;
      case 'Home':
        e.preventDefault();
        focusBox(0);
        return;
      case 'End':
        e.preventDefault();
        focusBox(chars.length);
        return;
      default:
        // Retyping the same character fires no change event; still advance.
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && chars[i] && sanitize(e.key) === chars[i]) {
          e.preventDefault();
          focusBox(i + 1);
        }
    }
  };

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = sanitize(e.clipboardData.getData('text'));
    if (!text) return;
    const next = (text.length >= length ? text : chars.slice(0, i) + text).slice(0, length);
    commit(next);
    focusBox(next.length);
  };

  const handleFocus = (i: number, el: HTMLInputElement) => {
    // Boxes fill left to right: clicking past the first empty box lands on it.
    if (i > latest.current.length) focusBox(latest.current.length);
    else el.select();
  };

  return (
    <div className={cx(s.field, s[size], invalid && s.invalid, className)}>
      <span id={labelId} className={cx(s.label, hideLabel && s.srOnly)}>
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} aria-describedby={describedBy} className={s.boxes}>
        {Array.from({ length }, (_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type={mask ? 'password' : 'text'}
            inputMode={mode === 'numeric' ? 'numeric' : 'text'}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            autoCapitalize={mode === 'alphanumeric' ? 'characters' : 'off'}
            autoCorrect="off"
            spellCheck={false}
            autoFocus={autoFocus && i === 0}
            aria-label={`${unit} ${i + 1} of ${length}`}
            aria-invalid={invalid || undefined}
            value={chars[i] ?? ''}
            disabled={disabled}
            tabIndex={i <= chars.length ? 0 : -1}
            data-state={i === 0 ? state : undefined}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            onFocus={(e) => handleFocus(i, e.currentTarget)}
            className={s.box}
          />
        ))}
      </div>
    </div>
  );
}
