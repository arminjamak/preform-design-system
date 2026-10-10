import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { ApiKeyField } from '../components/ApiKeyField/ApiKeyField';
import { StateMatrix } from './helpers/StateMatrix';

const frame = { width: 'var(--component-modal-width-md)' };
const cell = { width: 'var(--size-layout-sidebar)' };
const newKey = (prefix: string) => `${prefix}${Array.from({ length: 32 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`;

const meta = {
  title: 'Components/Specialized/ApiKeyField',
  component: ApiKeyField,
  tags: ['expanded'],
  args: {
    label: 'Print farm scheduler',
    value: 'pf_live_7c21e9b04d6a4f1e8b35c90d2a7e3f9a',
    createdAt: '2026-03-12T09:14:00Z',
    lastUsedAt: '2026-10-09T16:42:00Z',
    scopes: ['printers:read', 'jobs:read', 'jobs:write', 'materials:read'],
    revealable: true,
    copyable: true,
    variant: 'card',
    busy: false,
    onRegenerate: fn(),
    onRevoke: fn(),
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['card', 'plain'] },
    lastUsedAt: { control: 'text' },
    createdAt: { control: 'text' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state (key row)' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A PreForm Local API key or Dashboard secret shown masked in `--typography-mono` (`pf_live_••••••••3f9a`), with an eye IconButton to reveal it, CopyButton, created / last-used metadata, scope Badges and Regenerate / Revoke behind an inline confirmation (warning and danger status tokens). `variant="plain"` drops the card chrome for use inside forms such as WebhookForm.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return (
      <div style={frame}>
        <ApiKeyField
          {...args}
          value={value}
          onRegenerate={
            args.onRegenerate &&
            (() => {
            args.onRegenerate?.();
            update({ busy: true });
            window.setTimeout(() => update({ busy: false, value: newKey(value.slice(0, value.lastIndexOf('_') + 1)), lastUsedAt: null, createdAt: new Date().toISOString() }), 900);
          })
          }
        />
      </div>
    );
  },
} satisfies Meta<typeof ApiKeyField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const TestKey: Story = {
  name: 'Test key, never used',
  args: { label: 'Local API sandbox', value: 'pf_test_0b8d6c2a91f34e7da5c18e2f4b6d81c0', lastUsedAt: null, scopes: ['printers:read'] },
};

export const ReadOnly: Story = { name: 'Read-only (no reveal, no actions)', args: { revealable: false, onRegenerate: undefined, onRevoke: undefined } };

export const Regenerating: Story = {
  name: 'Loading (regenerating)',
  args: { busy: true },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Regenerate' }));
  },
};

export const Plain: Story = {
  name: 'Plain (webhook signing secret)',
  args: { variant: 'plain', label: 'Signing secret', value: 'whsec_5f0e2d9c71b84a63e0c2d7b19a4fab12', onRevoke: undefined },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'live', render: (p) => <div style={cell}><ApiKeyField {...args} variant="plain" onRevoke={undefined} onRegenerate={undefined} data-state={p['data-state']} /></div> },
        { label: 'secret', render: (p) => <div style={cell}><ApiKeyField {...args} variant="plain" label="Signing secret" value="whsec_5f0e2d9c71b84a63e0c2d7b19a4fab12" onRevoke={undefined} onRegenerate={undefined} copyable={!p.disabled} revealable={!p.disabled} data-state={p['data-state']} /></div> },
      ]}
    />
  ),
};
