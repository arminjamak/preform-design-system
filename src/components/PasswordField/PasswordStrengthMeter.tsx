import { cx } from '../../lib/cx';
import s from './PasswordStrengthMeter.module.css';

export type PasswordScore = 0 | 1 | 2 | 3 | 4;

const LABELS: Record<PasswordScore, string> = { 0: 'Too weak', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' };
const TONES: Record<PasswordScore, string> = { 0: s.danger, 1: s.danger, 2: s.warning, 3: s.info, 4: s.success };

/**
 * Scores a password 0–4. One point each for 8+ characters, 12+ characters, mixed case,
 * a digit and a symbol (capped at 4); anything shorter than 8 characters scores at most 1.
 */
export function scorePassword(password: string): PasswordScore {
  if (!password) return 0;
  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;
  if (password.length < 8) points = Math.min(points, 1);
  return Math.min(points, 4) as PasswordScore;
}

export type PasswordStrengthMeterProps = {
  /** The password to score. */
  value: string;
  /** Override the computed score (e.g. from a server-side check). */
  score?: PasswordScore;
  /** Accessible name of the meter. */
  label?: string;
  id?: string;
  className?: string;
};

/** Four-segment strength bar (danger → warning → info → success) with a text label. */
export function PasswordStrengthMeter({ value, score: scoreProp, label = 'Password strength', id, className }: PasswordStrengthMeterProps) {
  const empty = value.length === 0;
  const score = scoreProp ?? scorePassword(value);
  // A non-empty password always lights the first segment so "Too weak" is visible.
  const filled = empty ? 0 : Math.max(score, 1);
  const text = empty ? 'Enter a password' : LABELS[score];

  return (
    <div
      id={id}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuenow={empty ? 0 : score}
      aria-valuetext={text}
      className={cx(s.meter, !empty && TONES[score], className)}
    >
      <div className={s.track} aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cx(s.segment, i <= filled && s.on)} />
        ))}
      </div>
      <span className={cx(s.text, empty && s.textEmpty)} aria-live="polite">
        {text}
      </span>
    </div>
  );
}
