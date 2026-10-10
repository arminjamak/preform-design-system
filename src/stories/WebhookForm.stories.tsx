import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { WebhookForm, type WebhookDelivery, type WebhookValue } from '../components/WebhookForm/WebhookForm';

const VALUE: WebhookValue = {
  url: 'https://hooks.harbor-ortho.com/formlabs/print-events',
  description: 'Post failed prints and low resin alerts to #print-farm in Slack',
  events: ['print.finished', 'print.failed', 'tank.low', 'cartridge.low'],
  secret: 'whsec_5f0e2d9c71b84a63e0c2d7b19a4fab12',
  contentType: 'application/json',
  active: true,
};

const DELIVERIES: WebhookDelivery[] = [
  { id: 'dlv_9f31', event: 'print.finished', status: 200, timestamp: '2026-10-10T08:12:44Z', durationMs: 143 },
  { id: 'dlv_9f30', event: 'tank.low', status: 200, timestamp: '2026-10-10T07:58:02Z', durationMs: 171 },
  { id: 'dlv_9f2c', event: 'print.failed', status: 500, timestamp: '2026-10-09T23:41:19Z', durationMs: 2034 },
  { id: 'dlv_9f2a', event: 'print.finished', status: 200, timestamp: '2026-10-09T21:06:51Z', durationMs: 128 },
  { id: 'dlv_9f27', event: 'ping', status: 204, timestamp: '2026-10-09T15:30:00Z', durationMs: 96 },
];

const EMPTY: WebhookValue = { url: '', description: '', events: [], secret: 'whsec_c2a91f34e7da5c18e2f4b6d81c00b8d6', contentType: 'application/json', active: true };

const meta = {
  title: 'Components/Specialized/WebhookForm',
  component: WebhookForm,
  tags: ['expanded'],
  args: {
    value: VALUE,
    onChange: fn(),
    onSubmit: fn(),
    onTest: fn(),
    onCancel: fn(),
    onRegenerateSecret: fn(),
    testResult: null,
    testing: false,
    deliveries: DELIVERIES,
    saving: false,
    error: '',
    submitLabel: 'Save webhook',
  },
  argTypes: {
    value: { control: 'object' },
    testResult: { control: 'object' },
    deliveries: { control: 'object' },
    error: { control: 'text' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Formlabs Dashboard webhook editor: UrlField endpoint, description, grouped event Checkboxes (print, printer, materials) with select-all per group, an ApiKeyField signing secret, content-type Select, Active Toggle, “Send test event” with a success / failure Callout carrying the status code, and a recent-deliveries log with status Badges. Controlled via `value` / `onChange`; a failed submit focuses an error summary.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return (
      <WebhookForm
        {...args}
        value={value}
        onChange={(v) => {
          args.onChange(v);
          update({ value: v });
        }}
        onSubmit={(v) => {
          args.onSubmit(v);
          update({ saving: true });
          window.setTimeout(() => update({ saving: false }), 900);
        }}
        onTest={args.onTest && ((v) => {
          args.onTest?.(v);
          update({ testing: true, testResult: null });
          const ok = v.url.includes('harbor-ortho');
          window.setTimeout(
            () =>
              update({
                testing: false,
                testResult: ok ? { ok, status: 200, statusText: 'OK', durationMs: 182 } : { ok, status: 404, statusText: 'Not Found', durationMs: 311, message: 'Check the path and that the endpoint accepts POST requests.' },
              }),
            900,
          );
        })}
        onRegenerateSecret={() => {
          args.onRegenerateSecret?.();
          update({ value: { ...value, secret: `whsec_${Math.random().toString(16).slice(2, 10)}e7da5c18e2f4b6d81c00b8d6` } });
        }}
      />
    );
  },
} satisfies Meta<typeof WebhookForm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const NewWebhook: Story = { name: 'New webhook (empty)', args: { value: EMPTY, deliveries: [], submitLabel: 'Create webhook' } };

export const TestSucceeded: Story = { name: 'Success (test delivered)', args: { testResult: { ok: true, status: 200, statusText: 'OK', durationMs: 182 } } };

export const TestFailed: Story = {
  name: 'Error (test failed)',
  args: { testResult: { ok: false, status: 500, statusText: 'Internal Server Error', durationMs: 2034, message: 'Formlabs retries failed deliveries up to 5 times over 24 hours.' } },
};

export const Testing: Story = { name: 'Loading (sending test)', args: { testing: true } };

export const Saving: Story = { name: 'Loading (saving)', args: { saving: true } };

export const ValidationErrors: Story = {
  name: 'Error (field validation)',
  args: { value: EMPTY, deliveries: undefined, onTest: undefined },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Save webhook' }));
  },
};

export const ServerError: Story = { name: 'Error (server)', args: { error: 'Dashboard allows 10 webhooks per organisation. Delete an unused webhook to add another.' } };

export const Paused: Story = { args: { value: { ...VALUE, active: false } } };
