import { useEffect, useId, useRef, useState, type FormEvent, type HTMLAttributes } from 'react';
import { ShieldCheckIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { CodeInput } from '../CodeInput/CodeInput';
import { ValidationMessage } from '../ValidationMessage/ValidationMessage';
import s from './TwoFactorPrompt.module.css';

export type TwoFactorMethod = 'app' | 'sms' | 'email';
export type TwoFactorCodeKind = 'otp' | 'backup';

export type TwoFactorPromptProps = Omit<HTMLAttributes<HTMLDivElement>, 'onSubmit'> & {
  /** Called when every box is filled (auto-submit) or on Verify. `kind` says which code was entered. */
  onVerify: (code: string, kind: TwoFactorCodeKind) => void;
  /** Sends a new code (SMS / email only). The link is hidden when omitted or for authenticator apps. */
  onResend?: () => void;
  method?: TwoFactorMethod;
  /** Masked phone number or email the code was sent to, e.g. "+1 (•••) •••-0142". */
  destination?: string;
  /** Wrong / expired code message. Clears the boxes and refocuses the first one. */
  error?: string;
  /** Verifying: boxes lock and the button shows a spinner. */
  loading?: boolean;
  /** Seconds before "Resend code" becomes available again. */
  resendCooldown?: number;
  /** Code length for one-time codes. */
  length?: number;
  /** Backup-code length (alphanumeric). */
  backupLength?: number;
  /** Offer the "Use a backup code" switch. */
  allowBackup?: boolean;
  /** "Back to sign in" link. Hidden when omitted. */
  onBack?: () => void;
  /** Framed card (standalone page) or plain (inside a Modal). */
  variant?: 'card' | 'plain';
  /** Focus the first box on mount (inside dialogs). */
  autoFocus?: boolean;
};

const formatClock = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/** Second sign-in step: one-time code from an authenticator app, SMS or email, with backup-code fallback. */
export function TwoFactorPrompt({
  onVerify,
  onResend,
  method = 'app',
  destination,
  error,
  loading,
  resendCooldown = 30,
  length = 6,
  backupLength = 8,
  allowBackup = true,
  onBack,
  variant = 'card',
  autoFocus,
  className,
  ...rest
}: TwoFactorPromptProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const msgId = `${id}-msg`;
  const [backup, setBackup] = useState(false);
  const [code, setCode] = useState('');
  const canResend = !!onResend && method !== 'app';
  const [cooldown, setCooldown] = useState(canResend ? resendCooldown : 0);
  const boxesRef = useRef<HTMLDivElement>(null);

  const focusFirst = () => boxesRef.current?.querySelector<HTMLInputElement>('input')?.focus();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  // A failed code clears the boxes so the next attempt starts from the first one.
  useEffect(() => {
    if (!error) return;
    setCode('');
    focusFirst();
  }, [error]);

  const kind: TwoFactorCodeKind = backup ? 'backup' : 'otp';
  const needed = backup ? backupLength : length;

  const switchMode = () => {
    setBackup((b) => !b);
    setCode('');
    window.requestAnimationFrame(() => focusFirst());
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    if (code.length < needed) {
      focusFirst();
      return;
    }
    onVerify(code, kind);
  };

  const explanation = backup
    ? `Enter one of the ${backupLength}-character backup codes you saved when you turned on two-step verification.`
    : method === 'sms'
      ? <>Enter the {length}-digit code we texted to <span className={s.destination}>{destination || 'your phone'}</span>.</>
      : method === 'email'
        ? <>Enter the {length}-digit code we emailed to <span className={s.destination}>{destination || 'your inbox'}</span>.</>
        : `Enter the ${length}-digit code from your authenticator app.`;

  const body = (
    <form noValidate aria-labelledby={titleId} className={s.form} onSubmit={handleSubmit}>
      <div className={s.head}>
        <span className={s.badge} aria-hidden="true">
          <ShieldCheckIcon strokeWidth={2} />
        </span>
        <h2 id={titleId} className={s.title}>
          {backup ? 'Use a backup code' : 'Two-step verification'}
        </h2>
        <p className={s.text}>{explanation}</p>
      </div>

      <div ref={boxesRef} className={s.code}>
        <CodeInput
          key={kind}
          label={backup ? 'Backup code' : 'Verification code'}
          hideLabel
          length={needed}
          mode={backup ? 'alphanumeric' : 'numeric'}
          size={backup ? 'sm' : 'md'}
          value={code}
          onChange={setCode}
          onComplete={(v) => !loading && onVerify(v, kind)}
          invalid={!!error}
          disabled={loading}
          aria-describedby={msgId}
          autoFocus={autoFocus}
        />
        <ValidationMessage id={msgId} tone="error" className={s.message}>
          {error}
        </ValidationMessage>
      </div>

      <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
        {loading ? 'Verifying…' : 'Verify'}
      </Button>

      <div className={s.links}>
        {canResend && !backup && (
          <Button
            variant="link"
            size="sm"
            disabled={cooldown > 0 || loading}
            onClick={() => {
              onResend?.();
              setCooldown(resendCooldown);
            }}
          >
            {cooldown > 0 ? (
              <>
                Resend code in <span className={s.clock}>{formatClock(cooldown)}</span>
              </>
            ) : (
              'Resend code'
            )}
          </Button>
        )}
        {allowBackup && (
          <Button variant="link" size="sm" onClick={switchMode} disabled={loading}>
            {backup ? (method === 'app' ? 'Use authenticator app' : 'Use a one-time code') : 'Use a backup code'}
          </Button>
        )}
        {onBack && (
          <Button variant="link" size="sm" onClick={onBack} disabled={loading}>
            Back to sign in
          </Button>
        )}
      </div>
    </form>
  );

  return variant === 'card' ? (
    <Card variant="elevated" padding="lg" className={cx(s.root, className)} {...rest}>
      {body}
    </Card>
  ) : (
    <div className={cx(s.root, className)} {...rest}>
      {body}
    </div>
  );
}
