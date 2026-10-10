import { useId, useRef, useState, type FormEvent, type FormHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { Callout } from '../Callout/Callout';
import { Checkbox } from '../Checkbox/Checkbox';
import { EmailField, validateEmail } from '../FormattedField/FormattedField';
import { PasswordField } from '../PasswordField/PasswordField';
import { scorePassword } from '../PasswordField/PasswordStrengthMeter';
import { Select, type SelectOption } from '../Select/Select';
import { TextField } from '../TextField/TextField';
import { ValidationMessage } from '../ValidationMessage/ValidationMessage';
import { ErrorSummary, FieldShell, ServerError, useFocusOnChange, type FormFieldError } from '../SignInForm/FormParts';
import s from './RegistrationForm.module.css';

export type RegistrationValues = {
  name: string;
  email: string;
  organisation: string;
  password: string;
  confirmPassword: string;
  country: string;
  acceptTerms: boolean;
};

type Field = keyof RegistrationValues;
type Errors = Partial<Record<Field, string>>;

export const DEFAULT_COUNTRIES: SelectOption[] = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'IE', label: 'Ireland' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'HU', label: 'Hungary' },
  { value: 'JP', label: 'Japan' },
  { value: 'AU', label: 'Australia' },
];

const EMPTY: RegistrationValues = { name: '', email: '', organisation: '', password: '', confirmPassword: '', country: '', acceptTerms: false };

export type RegistrationFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  /** Called with valid values only. */
  onSubmit: (values: RegistrationValues) => void;
  /** Creating the account: the button shows a spinner and the fields lock. */
  loading?: boolean;
  /** Server error ("An account with this email already exists") shown and focused above the fields. */
  error?: string;
  /** Country list for the Select. */
  countries?: SelectOption[];
  defaultValues?: Partial<RegistrationValues>;
  termsHref?: string;
  privacyHref?: string;
  /** Account created: replaces the fields with a confirmation (e.g. "We sent a verification link to …"). */
  success?: string;
  /** "Already have an account? Sign in" link. Hidden when omitted. */
  onSignIn?: () => void;
  autoFocus?: boolean;
};

const MIN_LENGTH = 8;

function validate(v: RegistrationValues): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = 'Enter your full name.';
  if (!v.email.trim()) e.email = 'Enter an email address for your Formlabs account.';
  else {
    const m = validateEmail(v.email);
    if (m) e.email = m;
  }
  if (!v.password) e.password = 'Choose a password.';
  else if (v.password.length < MIN_LENGTH) e.password = `Use at least ${MIN_LENGTH} characters.`;
  else if (scorePassword(v.password) < 2) e.password = 'Add capitals, numbers or symbols to make the password stronger.';
  if (!v.confirmPassword) e.confirmPassword = 'Re-enter your password.';
  else if (v.confirmPassword !== v.password) e.confirmPassword = 'Passwords don’t match.';
  if (!v.country) e.country = 'Select your country or region.';
  if (!v.acceptTerms) e.acceptTerms = 'Accept the Terms of Service to create an account.';
  return e;
}

const ORDER: Field[] = ['name', 'email', 'organisation', 'password', 'confirmPassword', 'country', 'acceptTerms'];

/** New Formlabs account form used from PreForm's sign-in dialog. */
export function RegistrationForm({
  onSubmit,
  loading,
  error,
  countries = DEFAULT_COUNTRIES,
  defaultValues,
  termsHref = 'https://formlabs.com/terms-of-service/',
  privacyHref = 'https://formlabs.com/privacy-policy/',
  onSignIn,
  success,
  autoFocus,
  className,
  ...rest
}: RegistrationFormProps) {
  const id = useId();
  const fid = (f: Field) => `${id}-${f}`;
  const mid = (f: Field) => `${id}-${f}-msg`;
  const [values, setValues] = useState<RegistrationValues>({ ...EMPTY, ...defaultValues });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [attempt, setAttempt] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const serverRef = useRef<HTMLDivElement>(null);

  useFocusOnChange(summaryRef, attempt);
  useFocusOnChange(serverRef, error);

  /** Errors are shown for touched fields (on blur) and for every field after a submit attempt. */
  const shown = (f: Field) => (attempt > 0 || touched[f] ? errors[f] : undefined);

  const set = <K extends Field>(f: K, v: RegistrationValues[K]) => {
    const next = { ...values, [f]: v };
    setValues(next);
    // Only clear or update errors already on screen; new ones wait for blur or submit.
    const all = validate(next);
    setErrors((prev) => {
      const out: Errors = {};
      for (const k of ORDER) if (prev[k] || (k === 'confirmPassword' && touched.confirmPassword)) out[k] = all[k];
      return out;
    });
  };

  const blur = (f: Field) => {
    setTouched((t) => ({ ...t, [f]: true }));
    setErrors((prev) => ({ ...prev, [f]: validate(values)[f] }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setAttempt((n) => n + 1);
      return;
    }
    onSubmit({ ...values, name: values.name.trim(), email: values.email.trim(), organisation: values.organisation.trim() });
  };

  const summary: FormFieldError[] = attempt > 0 ? ORDER.filter((f) => errors[f]).map((f) => ({ target: fid(f), message: errors[f] as string })) : [];
  const describe = (f: Field) => mid(f);

  if (success) {
    return (
      <div role="status" className={cx(s.form, className)}>
        <Callout tone="success" title="Account created">
          {success}
        </Callout>
        {onSignIn && (
          <Button variant="primary" size="md" fullWidth onClick={onSignIn}>
            Continue to sign in
          </Button>
        )}
      </div>
    );
  }

  return (
    <form noValidate aria-label="Create a Formlabs account" className={cx(s.form, className)} onSubmit={handleSubmit} {...rest}>
      {error && (
        <ServerError ref={serverRef} title="Couldn’t create your account">
          {error}
        </ServerError>
      )}
      {summary.length > 0 && <ErrorSummary ref={summaryRef} errors={summary} />}

      <FieldShell htmlFor={fid('name')} label="Full name" required messageId={mid('name')} error={shown('name')}>
        <TextField
          id={fid('name')}
          label="Full name"
          value={values.name}
          onChange={(v) => set('name', v)}
          onBlur={() => blur('name')}
          invalid={!!shown('name')}
          aria-describedby={describe('name')}
          autoComplete="name"
          placeholder="Ada Lovelace"
          required
          size="md"
          fullWidth
          disabled={loading}
          autoFocus={autoFocus}
        />
      </FieldShell>

      <EmailField
        id={fid('email')}
        label="Work email"
        value={values.email}
        onChange={(v) => set('email', v)}
        onBlur={() => blur('email')}
        error={shown('email')}
        required
        size="md"
        fullWidth
        disabled={loading}
        placeholder="you@company.com"
      />

      <FieldShell htmlFor={fid('organisation')} label="Organisation" aside="Optional" messageId={mid('organisation')} hint="Shown to teammates when you share printers in Dashboard.">
        <TextField
          id={fid('organisation')}
          label="Organisation"
          value={values.organisation}
          onChange={(v) => set('organisation', v)}
          aria-describedby={describe('organisation')}
          autoComplete="organization"
          placeholder="Acme Dental Lab"
          size="md"
          fullWidth
          disabled={loading}
        />
      </FieldShell>

      <FieldShell htmlFor={fid('password')} label="Password" required messageId={mid('password')} error={shown('password')}>
        <PasswordField
          hideLabel
          id={fid('password')}
          label="Password"
          value={values.password}
          onChange={(v) => set('password', v)}
          onBlur={() => blur('password')}
          invalid={!!shown('password')}
          aria-describedby={describe('password')}
          showStrength
          required
          size="md"
          fullWidth
          disabled={loading}
          placeholder={`At least ${MIN_LENGTH} characters`}
        />
      </FieldShell>

      <FieldShell
        htmlFor={fid('confirmPassword')}
        label="Confirm password"
        required
        messageId={mid('confirmPassword')}
        error={shown('confirmPassword')}
        success={values.confirmPassword && values.confirmPassword === values.password ? 'Passwords match.' : undefined}
      >
        <PasswordField
          hideLabel
          id={fid('confirmPassword')}
          label="Confirm password"
          value={values.confirmPassword}
          onChange={(v) => set('confirmPassword', v)}
          onBlur={() => blur('confirmPassword')}
          invalid={!!shown('confirmPassword')}
          aria-describedby={describe('confirmPassword')}
          autoComplete="new-password"
          required
          size="md"
          fullWidth
          disabled={loading}
        />
      </FieldShell>

      <FieldShell htmlFor={fid('country')} label="Country or region" required messageId={mid('country')} error={shown('country')}>
        <Select
          id={fid('country')}
          label="Country or region"
          value={values.country}
          options={[{ value: '', label: 'Select a country…', disabled: true }, ...countries]}
          onChange={(v) => set('country', v)}
          onBlur={() => blur('country')}
          invalid={!!shown('country')}
          aria-describedby={describe('country')}
          autoComplete="country"
          required
          size="md"
          fullWidth
          disabled={loading}
        />
      </FieldShell>

      <div className={s.stack}>
        <div id={fid('acceptTerms')} className={cx(s.terms, shown('acceptTerms') && s.termsInvalid)}>
          <label className={s.termsLabel}>
            <Checkbox
              label="I agree to the Formlabs Terms of Service and Privacy Policy"
              checked={values.acceptTerms}
              onChange={(v) => {
                set('acceptTerms', v);
                setTouched((t) => ({ ...t, acceptTerms: true }));
              }}
              disabled={loading}
              tone={shown('acceptTerms') ? 'red' : 'blue'}
              className={s.termsBox}
            />
            <span>
              I agree to the Formlabs{' '}
              <a href={termsHref} target="_blank" rel="noreferrer" className={s.link}>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href={privacyHref} target="_blank" rel="noreferrer" className={s.link}>
                Privacy Policy
              </a>
              .
            </span>
          </label>
        </div>
        <ValidationMessage id={mid('acceptTerms')} tone="error">
          {shown('acceptTerms')}
        </ValidationMessage>
      </div>

      <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
        {loading ? 'Creating account…' : 'Create account'}
      </Button>

      {onSignIn && (
        <p className={s.footnote}>
          Already have an account?{' '}
          <Button variant="link" size="sm" onClick={onSignIn} disabled={loading}>
            Sign in
          </Button>
        </p>
      )}
    </form>
  );
}
