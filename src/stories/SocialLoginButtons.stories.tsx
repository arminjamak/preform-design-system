import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { OrDivider, SocialLoginButtons, type SocialProvider } from '../components/SocialLoginButtons/SocialLoginButtons';
import { Button } from '../components/Button/Button';
import { StateMatrix } from './helpers/StateMatrix';

const PROVIDERS: SocialProvider[] = ['google', 'apple', 'microsoft', 'sso'];
const width = { width: 'var(--size-layout-dialog-sm)' };

const meta = {
  title: 'Components/Collaboration/SocialLoginButtons',
  component: SocialLoginButtons,
  tags: ['expanded'],
  args: {
    providers: PROVIDERS,
    onSelect: fn(),
    loadingProvider: null,
    layout: 'stack',
    verb: 'Continue with',
    size: 'md',
    disabled: false,
  },
  argTypes: {
    providers: { control: 'check', options: PROVIDERS },
    loadingProvider: { control: 'select', options: [null, ...PROVIDERS] },
    layout: { control: 'inline-radio', options: ['stack', 'row'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state (1st button)' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Full-width outline Buttons that hand Formlabs account sign-in in PreForm off to Google, Apple, Microsoft or company SSO. Glyphs are monochrome `currentColor` paths, so they follow `--color-fg-default` in both themes; the provider being redirected to shows a Spinner and the others lock. `OrDivider` separates them from the email form.',
      },
    },
  },
  render: function Render(args) {
    const [, update] = useArgs();
    return (
      <div style={width}>
        <SocialLoginButtons
          {...args}
          onSelect={(p) => {
            args.onSelect(p);
            update({ loadingProvider: p });
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof SocialLoginButtons>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Row: Story = { args: { layout: 'row', providers: ['google', 'apple', 'microsoft'] } };

export const Loading: Story = { name: 'Loading (redirecting to Google)', args: { loadingProvider: 'google' } };

export const SsoOnly: Story = { name: 'SSO only (enterprise fleet)', args: { providers: ['sso'], verb: 'Sign in with' } };

export const WithOrDivider: Story = {
  name: 'With “or” divider',
  render: (args) => (
    <div className="sb-stack" style={{ ...width, alignItems: 'stretch' }}>
      <SocialLoginButtons {...args} />
      <OrDivider label="or sign in with email" />
      <Button variant="primary" size="md" fullWidth>
        Sign in with email
      </Button>
    </div>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'google', render: (p) => <SocialLoginButtons {...args} providers={['google']} {...p} /> },
        { label: 'sso', render: (p) => <SocialLoginButtons {...args} providers={['sso']} {...p} /> },
        { label: 'row', render: (p) => <SocialLoginButtons {...args} layout="row" providers={['apple']} {...p} /> },
      ]}
    />
  ),
};
