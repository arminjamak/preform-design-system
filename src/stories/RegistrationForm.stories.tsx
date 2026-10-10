import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { Card } from '../components/Card/Card';
import { RegistrationForm } from '../components/RegistrationForm/RegistrationForm';

const frame = { width: 'var(--component-modal-width-md)' };

const meta = {
  title: 'Components/Collaboration/RegistrationForm',
  component: RegistrationForm,
  tags: ['expanded'],
  args: {
    onSubmit: fn(),
    onSignIn: fn(),
    loading: false,
    error: '',
    success: '',
    autoFocus: false,
    termsHref: 'https://formlabs.com/terms-of-service/',
    privacyHref: 'https://formlabs.com/privacy-policy/',
  },
  argTypes: {
    error: { control: 'text' },
    success: { control: 'text' },
    countries: { control: 'object' },
    defaultValues: { control: 'object' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'New Formlabs account form opened from PreForm’s sign-in dialog: name, email, optional organisation, password with PasswordStrengthMeter, confirm password (live “Passwords don’t match” / “Passwords match”), country Select and a terms Checkbox with links. Fields validate on blur; a failed submit focuses an error summary that links to each invalid field.',
      },
    },
  },
  render: function Render(args) {
    const [, update] = useArgs();
    return (
      <Card variant="elevated" padding="lg" style={frame}>
        <RegistrationForm
          key={JSON.stringify(args.defaultValues ?? {})}
          {...args}
          onSubmit={(values) => {
            args.onSubmit(values);
            update({ loading: true, error: '' });
            window.setTimeout(
              () =>
                values.email.endsWith('@formlabs.com')
                  ? update({ loading: false, error: 'An account with this email already exists. Sign in instead, or reset your password.' })
                  : update({ loading: false, success: `We sent a verification link to ${values.email}. Open it to start sending prints from PreForm.` }),
              1200,
            );
          }}
          onSignIn={() => {
            args.onSignIn?.();
            update({ success: '' });
          }}
        />
      </Card>
    );
  },
} satisfies Meta<typeof RegistrationForm>;
export default meta;
type Story = StoryObj<typeof meta>;

const filled = {
  name: 'Grace Hopper',
  email: 'grace@harbor-orthodontics.com',
  organisation: 'Harbor Orthodontics',
  password: 'Dental-SG-2026!',
  confirmPassword: 'Dental-SG-2026!',
  country: 'US',
  acceptTerms: true,
};

export const Playground: Story = {};

export const Filled: Story = { args: { defaultValues: filled } };

export const PasswordMismatch: Story = {
  name: 'Error (passwords don’t match)',
  args: { defaultValues: { ...filled, confirmPassword: 'Dental-SG-2025!' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Create account' }));
  },
};

export const ValidationErrors: Story = {
  name: 'Error (empty submit)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Create account' }));
  },
};

export const Loading: Story = { args: { defaultValues: filled, loading: true } };

export const ServerError: Story = {
  name: 'Error (server)',
  args: { defaultValues: { ...filled, email: 'grace@formlabs.com' }, error: 'An account with this email already exists. Sign in instead, or reset your password.' },
};

export const Success: Story = {
  name: 'Success (account created)',
  args: { success: 'We sent a verification link to grace@harbor-orthodontics.com. Open it to start sending prints from PreForm.' },
};
