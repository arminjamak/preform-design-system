import { useId, useRef, useState, type FormEvent, type FormHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { Callout } from '../Callout/Callout';
import { Checkbox } from '../Checkbox/Checkbox';
import { EmailField, validateEmail } from '../FormattedField/FormattedField';
import { PasswordField } from '../PasswordField/PasswordField';
import { OrDivider, SOCIAL_PROVIDERS, SocialLoginButtons, type SocialProvider } from '../SocialLoginButtons/SocialLoginButtons';
import { ErrorSummary, FieldShell, ServerError, useFocusOnChange, type FormFieldError } from './FormParts';
import s from './SignInForm.module.css';

export type SignInValues = { email: string; password: string; remember: boolean };

export type SignInFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  /** Called with valid values. Field validation runs first; nothing is sent while a field is invalid. */
  onSubmit: (values: SignInValues) => void;
  /** "Forgot password?" link; receives the email typed so far. Hidden when omitted. */
  onForgot?: (email: string) => void;
  /** Social / SSO sign-in. The provider buttons are hidden when omitted or `providers` is empty. */
  onSocial?: (provider: SocialProvider) => void;
  /** Provider whose redirect is in flight. */
  socialLoading?: SocialProvider | null;
  providers?: SocialProvider[];
  /** Submitting: the primary button shows a spinner and the fields lock. */
  loading?: boolean;
  /** Server error shown in a danger Callout above the fields (and focused when it appears). */
  error?: string;
  /** Success notice above the fields, e.g. after a password-reset email was sent. */
  success?: string;
  /** "New to Formlabs? Create account" link under the form. Hidden when omitted. */
  onCreateAccount?: () => void;
  /** Prefill the email (e.g. the last account used on this computer). */
  defaultEmail?: string;
  /** Primary button text. */
  submitLabel?: string;
  /** Focus the email field on mount (inside dialogs). */
  autoFocus?: boolean;
};

type Errors = Partial<Record<'email' | 'password', string>>;

function validate(v: { email: string; password: string }): Errors {
  const errors: Errors = {};
  if (!v.email.trim()) errors.email = 'Enter the email address of your Formlabs account.';
  else {
    const e = validateEmail(v.email);
    if (e) errors.email = e;
  }
  if (!v.password) errors.password = 'Enter your password.';
  return errors;
}

/** Formlabs account sign-in for PreForm: social providers, email + password, remember me, forgot password. */
export function SignInForm({
  onSubmit,
  onForgot,
  onSocial,
  socialLoading,
  providers = SOCIAL_PROVIDERS,
  loading,
  error,
  success,
  onCreateAccount,
  defaultEmail = '',
  submitLabel = 'Sign in',
  autoFocus,
  className,
  ...rest
}: SignInFormProps) {
  const id = useId();
  const ids = { email: `${id}-email`, password: `${id}-password`, passwordMsg: `${id}-password-msg` };
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [attempt, setAttempt] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const serverRef = useRef<HTMLDivElement>(null);

  const list: FormFieldError[] = [
    errors.email && { target: ids.email, message: errors.email },
    errors.password && { target: ids.password, message: errors.password },
  ].filter(Boolean) as FormFieldError[];

  useFocusOnChange(summaryRef, attempt);
  useFocusOnChange(serverRef, error);

  /** After a failed submit, re-check as the user types so errors clear once fixed. */
  const revalidate = (next: { email: string; password: string }) => {
    if (list.length) setErrors(validate(next));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    const found = validate({ email, password });
    setErrors(found);
    if (Object.keys(found).length) {
      setAttempt((n) => n + 1);
      return;
    }
    onSubmit({ email: email.trim(), password, remember });
  };

  const showSocial = !!onSocial && providers.length > 0;

  return (
    <form noValidate aria-label="Sign in to your Formlabs account" className={cx(s.form, className)} onSubmit={handleSubmit} {...rest}>
      {showSocial && (
        <>
          <SocialLoginButtons providers={providers} onSelect={onSocial} loadingProvider={socialLoading} disabled={loading} />
          <OrDivider label="or sign in with email" />
        </>
      )}

      {error && (
        <ServerError ref={serverRef} title="Couldn’t sign in">
          {error}
        </ServerError>
      )}
      {success && !error && (
        <Callout tone="success" title="Check your inbox">
          {success}
        </Callout>
      )}
      {list.length > 0 && attempt > 0 && <ErrorSummary ref={summaryRef} errors={list} />}

      <EmailField
        id={ids.email}
        label="Email"
        value={email}
        onChange={(v) => {
          setEmail(v);
          revalidate({ email: v, password });
        }}
        error={errors.email}
        required
        fullWidth
        size="md"
        disabled={loading}
        autoFocus={autoFocus}
        placeholder="you@company.com"
      />

      <FieldShell htmlFor={ids.password} label="Password" required messageId={ids.passwordMsg} error={errors.password}>
        <PasswordField
          hideLabel
          id={ids.password}
          label="Password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            revalidate({ email, password: v });
          }}
          invalid={!!errors.password}
          aria-describedby={ids.passwordMsg}
          required
          fullWidth
          size="md"
          disabled={loading}
          autoComplete="current-password"
        />
      </FieldShell>

      <div className={s.options}>
        <Checkbox label="Keep me signed in" showLabel checked={remember} onChange={setRemember} disabled={loading} />
        {onForgot && (
          <Button variant="link" size="sm" disabled={loading} onClick={() => onForgot(email.trim())}>
            Forgot password?
          </Button>
        )}
      </div>

      <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
        {loading ? 'Signing in…' : submitLabel}
      </Button>

      {onCreateAccount && (
        <p className={s.footnote}>
          New to Formlabs?{' '}
          <Button variant="link" size="sm" onClick={onCreateAccount} disabled={loading}>
            Create an account
          </Button>
        </p>
      )}
    </form>
  );
}
