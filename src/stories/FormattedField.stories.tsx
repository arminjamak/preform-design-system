import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { EmailField, PhoneField, UrlField } from '../components/FormattedField/FormattedField';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Inputs/FormattedField',
  component: EmailField,
  tags: ['expanded'],
  args: {
    label: 'Notification email',
    hideLabel: false,
    value: 'print-lab@example.com',
    onChange: fn(),
    hint: 'We send print-complete and resin-low alerts here.',
    size: 'sm',
    required: false,
    fullWidth: false,
    disabled: false,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    invalid: { control: 'inline-radio', options: [undefined, true, false], name: 'invalid (override)' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'EmailField, UrlField and PhoneField: TextField-styled inputs with the right `type`, `inputMode` and `autocomplete`. Each validates on blur and shows an inline `--color-status-danger` message (clearing as soon as the value is fixed) or a `--color-status-success` check. PhoneField formats as you type: `+1 (617) 555-0142`.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <EmailField {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
} satisfies Meta<typeof EmailField>;
export default meta;
type Story = StoryObj<typeof meta>;

/** EmailField with every prop controllable. Clear the value and tab away to see validation. */
export const Playground: Story = {};

export const Email: Story = {
  args: { label: 'Work email', value: 'operator@', required: true, hint: 'Tab away to validate.' },
};

export const ServerError: Story = {
  args: { label: 'Invite teammate', value: 'print-lab@example.com', hint: undefined, error: 'This person is already in your Fleet.' },
};

export const Url: Story = {
  args: { label: 'Fleet dashboard URL', value: 'dashboard.example.com/fleet', hint: 'Tab away: https:// is added if missing.' },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <UrlField {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
};

export const Phone: Story = {
  args: { label: 'On-call phone', value: '+1 (617) 555-0142', hint: 'Texted when a print fails overnight.', required: true },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <PhoneField {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <EmailField key={size} {...args} size={size} label={`Email (${size})`} hint={undefined} onChange={() => {}} />
      ))}
    </div>
  ),
};

export const ContactForm: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [site, setSite] = useState('');
    return (
      <div className="sb-panel-demo sb-stack">
        <EmailField label="Lab contact email" value={email} onChange={setEmail} required fullWidth />
        <PhoneField label="Lab phone" value={phone} onChange={setPhone} fullWidth hint="US numbers format automatically." />
        <UrlField label="Order portal" value={site} onChange={setSite} fullWidth />
      </div>
    );
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'email', render: (p) => <EmailField {...args} hideLabel hint={undefined} onChange={() => {}} {...p} /> },
        { label: 'phone', render: (p) => <PhoneField {...args} label="Phone" value="+1 (617) 555-0142" hideLabel hint={undefined} onChange={() => {}} {...p} /> },
        { label: 'invalid', render: (p) => <UrlField {...args} label="URL" value="not a url" invalid hideLabel hint={undefined} onChange={() => {}} {...p} /> },
      ]}
    />
  ),
};
