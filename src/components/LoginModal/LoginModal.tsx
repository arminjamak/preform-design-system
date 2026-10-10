import { useEffect, useState } from 'react';
import { CircleCheckBigIcon } from 'lucide-react';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import { RegistrationForm, type RegistrationValues } from '../RegistrationForm/RegistrationForm';
import { SignInForm, type SignInValues } from '../SignInForm/SignInForm';
import { SOCIAL_PROVIDERS, type SocialProvider } from '../SocialLoginButtons/SocialLoginButtons';
import { TwoFactorPrompt, type TwoFactorCodeKind, type TwoFactorMethod } from '../TwoFactorPrompt/TwoFactorPrompt';
import s from './LoginModal.module.css';

export type LoginStep = 'signIn' | 'twoFactor' | 'register' | 'success';

/** What a sign-in attempt resolved to: `twoFactor` asks for a code, `success` (or nothing) finishes. */
export type SignInOutcome = 'twoFactor' | 'success' | void;

type MaybePromise<T> = T | Promise<T>;

export type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  /** Resolve `'twoFactor'` to continue to the code step; resolve anything else for success; reject (Error) to show its message. */
  onSignIn: (values: SignInValues) => MaybePromise<SignInOutcome>;
  /** Resolve to finish; resolve `false` or reject (Error) to show "That code didn’t work". */
  onVerify: (code: string, kind: TwoFactorCodeKind) => MaybePromise<boolean | void>;
  /** Resolve to finish (or continue to two-step if it resolves `'twoFactor'`); reject (Error) to show its message. */
  onRegister: (values: RegistrationValues) => MaybePromise<SignInOutcome>;
  /** Controlled step. Leave undefined to let the modal move through the flow itself. */
  step?: LoginStep;
  onStepChange?: (step: LoginStep) => void;
  onForgot?: (email: string) => void;
  onSocial?: (provider: SocialProvider) => void;
  onResend?: () => void;
  providers?: SocialProvider[];
  twoFactorMethod?: TwoFactorMethod;
  twoFactorDestination?: string;
  /** Render in place instead of portalling to <body> (docs and tests). */
  inline?: boolean;
};

const TITLES: Record<LoginStep, { title: string; description?: string }> = {
  signIn: { title: 'Sign in to PreForm', description: 'Use your Formlabs account to send prints, sync materials and see your printers in Dashboard.' },
  twoFactor: { title: 'Verify it’s you' },
  register: { title: 'Create a Formlabs account', description: 'One account for PreForm, Dashboard and the Formlabs Store.' },
  success: { title: 'Signed in' },
};

const message = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : typeof e === 'string' ? e : fallback);

/** PreForm's account dialog: sign in → two-step verification → done, with "Create account" switching to registration in place. */
export function LoginModal({
  open,
  onClose,
  onSignIn,
  onVerify,
  onRegister,
  step: stepProp,
  onStepChange,
  onForgot,
  onSocial,
  onResend,
  providers = SOCIAL_PROVIDERS,
  twoFactorMethod = 'app',
  twoFactorDestination,
  inline,
}: LoginModalProps) {
  const [ownStep, setOwnStep] = useState<LoginStep>('signIn');
  const step = stepProp ?? ownStep;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [account, setAccount] = useState('');

  // Start over each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setOwnStep('signIn');
    setError(undefined);
    setBusy(false);
  }, [open]);

  const go = (next: LoginStep) => {
    setError(undefined);
    setOwnStep(next);
    onStepChange?.(next);
  };

  const run = async <T,>(task: () => MaybePromise<T>, fallback: string, done: (result: T) => void) => {
    setBusy(true);
    setError(undefined);
    try {
      const result = await task();
      done(result);
    } catch (e) {
      setError(message(e, fallback));
    } finally {
      setBusy(false);
    }
  };

  const { title, description } = TITLES[step];

  const footer =
    step === 'signIn' ? (
      <p className={s.switch}>
        New to Formlabs?{' '}
        <Button variant="link" size="sm" onClick={() => go('register')} disabled={busy}>
          Create an account
        </Button>
      </p>
    ) : step === 'register' ? (
      <p className={s.switch}>
        Already have an account?{' '}
        <Button variant="link" size="sm" onClick={() => go('signIn')} disabled={busy}>
          Sign in
        </Button>
      </p>
    ) : undefined;

  return (
    <Modal open={open} title={title} description={description} onRequestClose={onClose} footer={footer} size="md" inline={inline}>
      <div className={s.body}>
        {step === 'signIn' && (
          <SignInForm
            autoFocus={!inline}
            loading={busy}
            error={error}
            providers={providers}
            onSocial={onSocial}
            onForgot={onForgot}
            className={s.form}
            onSubmit={(values) =>
              run(() => onSignIn(values), 'Something went wrong. Check your connection and try again.', (outcome) => {
                setAccount(values.email);
                go(outcome === 'twoFactor' ? 'twoFactor' : 'success');
              })
            }
          />
        )}

        {step === 'twoFactor' && (
          <TwoFactorPrompt
            variant="plain"
            autoFocus={!inline}
            method={twoFactorMethod}
            destination={twoFactorDestination}
            loading={busy}
            error={error}
            onResend={onResend}
            onBack={() => go('signIn')}
            className={s.form}
            onVerify={(code, kind) =>
              run(() => onVerify(code, kind), 'That code didn’t work. Check it and try again.', (ok) => {
                if (ok === false) setError(kind === 'backup' ? 'That backup code isn’t valid or has already been used.' : 'That code didn’t work. Codes expire after 30 seconds.');
                else go('success');
              })
            }
          />
        )}

        {step === 'register' && (
          <RegistrationForm
            autoFocus={!inline}
            loading={busy}
            error={error}
            className={s.form}
            onSubmit={(values) =>
              run(() => onRegister(values), 'We couldn’t create your account. Try again in a moment.', (outcome) => {
                setAccount(values.email);
                go(outcome === 'twoFactor' ? 'twoFactor' : 'success');
              })
            }
          />
        )}

        {step === 'success' && (
          <div className={s.success} role="status">
            <span className={s.successIcon} aria-hidden="true">
              <CircleCheckBigIcon strokeWidth={2} />
            </span>
            <p className={s.successTitle}>You’re signed in to PreForm</p>
            <p className={s.successText}>
              {account ? (
                <>
                  Signed in as <strong className={s.account}>{account}</strong>. Your printers and material settings will sync in a moment.
                </>
              ) : (
                'Your printers and material settings will sync in a moment.'
              )}
            </p>
            <Button variant="primary" size="md" onClick={onClose} autoFocus={!inline}>
              Continue to PreForm
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
