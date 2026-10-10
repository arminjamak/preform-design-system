import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { UserRoundIcon } from 'lucide-react';
import { Button } from '../components/Button/Button';
import { LoginModal, type LoginStep } from '../components/LoginModal/LoginModal';
import type { SocialProvider } from '../components/SocialLoginButtons/SocialLoginButtons';

const PROVIDERS: SocialProvider[] = ['google', 'apple', 'microsoft', 'sso'];
const STEPS: LoginStep[] = ['signIn', 'twoFactor', 'register', 'success'];
const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

const meta = {
  title: 'Components/Collaboration/LoginModal',
  component: LoginModal,
  tags: ['expanded'],
  args: {
    open: true,
    inline: true,
    onClose: fn(),
    onSignIn: fn(),
    onVerify: fn(),
    onRegister: fn(),
    onStepChange: fn(),
    onForgot: fn(),
    onSocial: fn(),
    onResend: fn(),
    step: undefined,
    providers: PROVIDERS,
    twoFactorMethod: 'app',
    twoFactorDestination: '',
  },
  argTypes: {
    step: { control: 'select', options: [undefined, ...STEPS] },
    providers: { control: 'check', options: PROVIDERS },
    twoFactorMethod: { control: 'inline-radio', options: ['app', 'sms', 'email'] },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'PreForm’s account dialog. Modal wraps SignInForm → TwoFactorPrompt → a success screen, and “Create an account” in the footer swaps to RegistrationForm in the same dialog. `onSignIn` / `onVerify` / `onRegister` may return promises: the modal shows loading while they run and turns a rejection into the form’s danger Callout. Playground: any password except “wrong” continues to two-step; code 246810 verifies.',
      },
    },
  },
  render: function Render(args) {
    const [{ open, step }, update] = useArgs();
    return (
      <div style={{ minHeight: 'calc(var(--space-24) * 7)', display: 'grid', placeItems: 'center', padding: 'var(--space-4)' }}>
        {!open && (
          <Button variant="primary" iconStart={<UserRoundIcon strokeWidth={2.2} />} onClick={() => update({ open: true })}>
            Sign in
          </Button>
        )}
        <LoginModal
          {...args}
          open={open}
          step={step}
          onClose={() => {
            args.onClose();
            update({ open: false });
          }}
          onStepChange={(next) => {
            args.onStepChange?.(next);
            if (step !== undefined) update({ step: next });
          }}
          onSignIn={async (values) => {
            args.onSignIn(values);
            await wait(900);
            if (values.password === 'wrong') throw new Error('Incorrect email or password. 4 attempts left before sign-in is paused for 15 minutes.');
            return 'twoFactor' as const;
          }}
          onVerify={async (code, kind) => {
            args.onVerify(code, kind);
            await wait(700);
            return code === '246810' || kind === 'backup';
          }}
          onRegister={async (values) => {
            args.onRegister(values);
            await wait(1100);
            if (values.email.endsWith('@formlabs.com')) throw new Error('An account with this email already exists. Sign in instead, or reset your password.');
            return 'success' as const;
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof LoginModal>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const TwoFactor: Story = { name: 'Step: two-step verification', args: { step: 'twoFactor' } };

export const TwoFactorSms: Story = { name: 'Step: two-step (SMS)', args: { step: 'twoFactor', twoFactorMethod: 'sms', twoFactorDestination: '+1 (•••) •••-0142' } };

export const Register: Story = { name: 'Step: create account', args: { step: 'register' } };

export const Success: Story = { name: 'Step: success', args: { step: 'success' } };

export const SsoOnly: Story = { name: 'SSO only (enterprise)', args: { providers: ['sso'] } };
