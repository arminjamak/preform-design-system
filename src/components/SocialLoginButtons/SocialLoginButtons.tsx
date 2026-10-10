import type { HTMLAttributes, ReactNode } from 'react';
import { Building2Icon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import { Button } from '../Button/Button';
import { Divider } from '../Divider/Divider';
import s from './SocialLoginButtons.module.css';

export type SocialProvider = 'google' | 'apple' | 'microsoft' | 'sso';

export const SOCIAL_PROVIDERS: SocialProvider[] = ['google', 'apple', 'microsoft', 'sso'];

/* Monochrome glyphs drawn with currentColor so they follow the button's text token in both themes. */
const GoogleGlyph = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.19-1.79 4.13-1.15 1.15-2.93 2.4-6.05 2.4-4.83 0-8.6-3.89-8.6-8.72s3.77-8.72 8.6-8.72c2.6 0 4.51 1.03 5.91 2.35l2.31-2.31C18.75 1.44 16.13 0 12.48 0 5.87 0 .31 5.39.31 12s5.56 12 12.17 12c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.47-.17-2.05H12.48z" />
  </svg>
);
const AppleGlyph = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.21 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.16-1.69 1.64-3.33 1.66-3.42-.04-.01-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.62-2.32-4.39-2.38-2-.16-3.68 1.09-4.61 1.09zm3.38-3.07c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.45 2.34-1.27 3.71 1.34.1 2.72-.69 3.56-1.7" />
  </svg>
);
const MicrosoftGlyph = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="1" y="1" width="10" height="10" />
    <rect x="13" y="1" width="10" height="10" />
    <rect x="1" y="13" width="10" height="10" />
    <rect x="13" y="13" width="10" height="10" />
  </svg>
);

const META: Record<SocialProvider, { name: string; icon: ReactNode }> = {
  google: { name: 'Google', icon: <GoogleGlyph /> },
  apple: { name: 'Apple', icon: <AppleGlyph /> },
  microsoft: { name: 'Microsoft', icon: <MicrosoftGlyph /> },
  sso: { name: 'SSO', icon: <Building2Icon strokeWidth={2.2} aria-hidden="true" /> },
};

/** Display name of a provider ("Google", "SSO"). */
export const socialProviderName = (p: SocialProvider) => META[p].name;

export type SocialLoginButtonsProps = Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> &
  WithForcedState & {
    /** Providers to offer, in order. Defaults to Google, Apple, Microsoft and SSO. */
    providers?: SocialProvider[];
    onSelect: (provider: SocialProvider) => void;
    /** Provider whose redirect is in flight: shows a spinner on it and disables the rest. */
    loadingProvider?: SocialProvider | null;
    /** Full-width stack (default) or an equal-width row of icon + short name. */
    layout?: 'stack' | 'row';
    /** Verb before the provider name in the stack layout. */
    verb?: string;
    size?: Size;
    disabled?: boolean;
  };

/** Outline buttons that hand sign-in off to Google, Apple, Microsoft or a company SSO provider. */
export function SocialLoginButtons({
  providers = SOCIAL_PROVIDERS,
  onSelect,
  loadingProvider,
  layout = 'stack',
  verb = 'Continue with',
  size = 'md',
  disabled,
  className,
  'data-state': state,
  ...rest
}: SocialLoginButtonsProps) {
  const busy = loadingProvider != null;
  return (
    <div role="group" aria-label="Sign in with another account" className={cx(s.root, s[layout], className)} {...rest}>
      {providers.map((p, i) => {
        const { name, icon } = META[p];
        const loading = loadingProvider === p;
        const full = `${verb} ${name}`;
        return (
          <Button
            key={p}
            variant="outline"
            size={size}
            fullWidth
            loading={loading}
            disabled={disabled || (busy && !loading)}
            iconStart={icon}
            aria-label={layout === 'row' ? full : undefined}
            title={layout === 'row' ? full : undefined}
            data-state={i === 0 ? state : undefined}
            className={s.button}
            onClick={() => onSelect(p)}
          >
            {layout === 'row' ? name : loading ? `Connecting to ${name}…` : full}
          </Button>
        );
      })}
    </div>
  );
}

export type OrDividerProps = { label?: string; className?: string };

/** Hairline with a centred "or" between social sign-in and the email form. */
export function OrDivider({ label = 'or', className }: OrDividerProps) {
  return (
    <div className={cx(s.or, className)}>
      <Divider spacing="none" className={s.orLine} />
      <span className={s.orLabel}>{label}</span>
      <Divider spacing="none" className={s.orLine} />
    </div>
  );
}
