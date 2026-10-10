import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { TwoFactorPrompt } from '../components/TwoFactorPrompt/TwoFactorPrompt';

const meta = {
  title: 'Components/Collaboration/TwoFactorPrompt',
  component: TwoFactorPrompt,
  tags: ['expanded'],
  args: {
    onVerify: fn(),
    onResend: fn(),
    onBack: fn(),
    method: 'app',
    destination: '',
    error: '',
    loading: false,
    resendCooldown: 30,
    length: 6,
    backupLength: 8,
    allowBackup: true,
    variant: 'card',
    autoFocus: false,
  },
  argTypes: {
    method: { control: 'inline-radio', options: ['app', 'sms', 'email'] },
    variant: { control: 'inline-radio', options: ['card', 'plain'] },
    error: { control: 'text' },
    resendCooldown: { control: { type: 'number', min: 0, max: 120 } },
    length: { control: { type: 'number', min: 4, max: 8 } },
    backupLength: { control: { type: 'number', min: 6, max: 10 } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Second sign-in step for a Formlabs account with two-step verification. CodeInput auto-submits once all six digits are in; SMS and email codes get a “Resend code” link with a countdown, and “Use a backup code” swaps to an 8-character alphanumeric CodeInput. A wrong code clears the boxes, refocuses the first one and shows a ValidationMessage. Try 246810 in the Playground.',
      },
    },
  },
  render: function Render(args) {
    const [, update] = useArgs();
    return (
      <TwoFactorPrompt
        {...args}
        onVerify={(code, kind) => {
          args.onVerify(code, kind);
          update({ loading: true, error: '' });
          window.setTimeout(
            () => update({ loading: false, error: code === '246810' || kind === 'backup' ? '' : 'That code didn’t work. Codes from your authenticator app expire after 30 seconds.' }),
            900,
          );
        }}
      />
    );
  },
} satisfies Meta<typeof TwoFactorPrompt>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sms: Story = { name: 'SMS with resend countdown', args: { method: 'sms', destination: '+1 (•••) •••-0142' } };

export const Email: Story = { args: { method: 'email', destination: 'g•••@harbor-orthodontics.com', resendCooldown: 0 } };

export const Loading: Story = { name: 'Loading (verifying)', args: { loading: true } };

export const WrongCode: Story = { name: 'Error (wrong code)', args: { error: 'That code didn’t work. Codes from your authenticator app expire after 30 seconds.' } };

export const Plain: Story = { name: 'Plain (inside a dialog)', args: { variant: 'plain', method: 'email', destination: 'g•••@harbor-orthodontics.com' } };
