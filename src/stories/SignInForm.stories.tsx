import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { Card } from '../components/Card/Card';
import { SignInForm } from '../components/SignInForm/SignInForm';
import type { SocialProvider } from '../components/SocialLoginButtons/SocialLoginButtons';

const PROVIDERS: SocialProvider[] = ['google', 'apple', 'microsoft', 'sso'];
const frame = { width: 'var(--component-modal-width-md)' };

const meta = {
  title: 'Components/Collaboration/SignInForm',
  component: SignInForm,
  tags: ['expanded'],
  args: {
    onSubmit: fn(),
    onForgot: fn(),
    onSocial: fn(),
    onCreateAccount: fn(),
    providers: PROVIDERS,
    socialLoading: null,
    loading: false,
    error: '',
    success: '',
    defaultEmail: '',
    submitLabel: 'Sign in',
    autoFocus: false,
  },
  argTypes: {
    providers: { control: 'check', options: PROVIDERS },
    socialLoading: { control: 'select', options: [null, ...PROVIDERS] },
    error: { control: 'text' },
    success: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Formlabs account sign-in for PreForm: SocialLoginButtons above an “or” divider, EmailField, PasswordField, “Keep me signed in” Checkbox, “Forgot password?” link and a pill primary submit. A real `<form>`: a failed submit marks fields `aria-invalid` and moves focus to an error summary whose links jump to each field; a server `error` renders a focused danger Callout.',
      },
    },
  },
  render: function Render(args) {
    const [, update] = useArgs();
    return (
      <Card variant="elevated" padding="lg" style={frame}>
        <SignInForm
          key={args.defaultEmail}
          {...args}
          onSubmit={(values) => {
            args.onSubmit(values);
            update({ loading: true, error: '' });
            window.setTimeout(() => update({ loading: false, error: values.password === 'Form4-Grey!' ? '' : 'Incorrect email or password. 4 attempts left before sign-in is paused for 15 minutes.' }), 1200);
          }}
          onForgot={(email) => {
            args.onForgot?.(email);
            update({ success: `If ${email || 'that email'} has a Formlabs account, a reset link is on its way.`, error: '' });
          }}
          onSocial={(p) => {
            args.onSocial?.(p);
            update({ socialLoading: p });
          }}
        />
      </Card>
    );
  },
} satisfies Meta<typeof SignInForm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Loading: Story = { args: { loading: true, defaultEmail: 'ada@lovelace-dental.com' } };

export const ServerError: Story = {
  name: 'Error (server)',
  args: { defaultEmail: 'ada@lovelace-dental.com', error: 'Incorrect email or password. 4 attempts left before sign-in is paused for 15 minutes.' },
};

export const ValidationErrors: Story = {
  name: 'Error (field validation)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
  },
};

export const Success: Story = {
  name: 'Success (reset email sent)',
  args: { defaultEmail: 'ada@lovelace-dental.com', success: 'If ada@lovelace-dental.com has a Formlabs account, a reset link is on its way.' },
};

export const RedirectingToSso: Story = { name: 'Loading (SSO redirect)', args: { socialLoading: 'sso', defaultEmail: 'print-lab@acme-aero.com' } };

export const EmailOnly: Story = { name: 'Email only (no social providers)', args: { providers: [] } };

export const States: Story = {
  parameters: { controls: { disable: true }, layout: 'padded' },
  render: (args) => (
    <div className="sb-row" style={{ alignItems: 'flex-start' }}>
      {[
        { label: 'Default', props: {} },
        { label: 'Loading', props: { loading: true, defaultEmail: 'ada@lovelace-dental.com' } },
        { label: 'Server error', props: { defaultEmail: 'ada@lovelace-dental.com', error: 'Your Formlabs account is locked. Reset your password to unlock it.' } },
      ].map(({ label, props }) => (
        <div key={label} className="sb-stack">
          <span className="pf-text-caption">{label}</span>
          <Card variant="elevated" padding="lg" style={frame}>
            <SignInForm {...args} providers={['google', 'sso']} {...props} />
          </Card>
        </div>
      ))}
    </div>
  ),
};
