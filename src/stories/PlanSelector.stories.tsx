import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { PlanSelector, type BillingPeriod, type Plan, type PlanComparisonRow } from '../components/PlanSelector/PlanSelector';
import { StateMatrix } from './helpers/StateMatrix';

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'One desktop printer and personal projects.',
    priceMonthly: 0,
    features: ['1 printer in Dashboard', '2 GB cloud storage', 'Remote print monitoring', 'Community forum support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Small studios running a few printers.',
    priceMonthly: 25,
    priceYearly: 240,
    features: ['Up to 5 printers', '50 GB cloud storage', 'Remote print queue', 'Print failure alerts', 'Email support'],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Production teams and print farms.',
    priceMonthly: 79,
    priceYearly: 756,
    recommended: true,
    features: ['Unlimited printers', '500 GB cloud storage', 'Roles and permissions', 'Fleet analytics and resin forecasts', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Large fleets with security reviews.',
    priceMonthly: null,
    features: ['SSO and SCIM provisioning', 'On-premises print server', 'Dedicated success manager', '99.9% uptime SLA'],
  },
];

const comparison: PlanComparisonRow[] = [
  { id: 'printers', label: 'Printers', values: { free: '1', pro: 'Up to 5', business: 'Unlimited', enterprise: 'Unlimited' } },
  { id: 'storage', label: 'Cloud storage', values: { free: '2 GB', pro: '50 GB', business: '500 GB', enterprise: 'Custom' } },
  { id: 'queue', label: 'Remote print queue', values: { free: false, pro: true, business: true, enterprise: true } },
  { id: 'alerts', label: 'Print failure alerts', values: { free: false, pro: true, business: true, enterprise: true } },
  { id: 'roles', label: 'Roles and permissions', values: { free: false, pro: false, business: true, enterprise: true } },
  { id: 'analytics', label: 'Fleet analytics', values: { free: false, pro: false, business: true, enterprise: true } },
  { id: 'sso', label: 'SSO and SCIM', values: { free: false, pro: false, business: false, enterprise: true } },
  { id: 'support', label: 'Support', values: { free: 'Community', pro: 'Email', business: 'Priority', enterprise: 'Dedicated' } },
];

const meta = {
  title: 'Components/Specialized/PlanSelector',
  component: PlanSelector,
  tags: ['expanded'],
  args: {
    plans,
    value: 'business',
    period: 'yearly',
    currentPlanId: 'pro',
    comparison,
    yearlySavingsLabel: 'Save 20%',
    currency: 'USD',
    label: 'PreForm cloud plan',
    disabled: false,
    hidePeriodSwitch: false,
    onChange: fn(),
    onPeriodChange: fn(),
    onPlanAction: fn(),
    onComparisonOpenChange: fn(),
  },
  argTypes: {
    value: { control: 'inline-radio', options: plans.map((p) => p.id) },
    currentPlanId: { control: 'inline-radio', options: [undefined, ...plans.map((p) => p.id)] },
    period: { control: 'inline-radio', options: ['monthly', 'yearly'] },
    currency: { control: 'inline-radio', options: ['USD', 'EUR', 'GBP'] },
    comparisonOpen: { control: 'boolean' },
    yearlySavingsLabel: { control: 'text' },
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    hidePeriodSwitch: { control: 'boolean' },
    plans: { control: 'object' },
    comparison: { control: 'object' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state (first card)' },
  },
  decorators: [
    (Story, ctx) =>
      ctx.name === 'States' ? (
        <Story />
      ) : (
        <div style={{ width: '100%', maxWidth: 'calc(var(--size-layout-dialog-lg) * 2)' }}>
          <Story />
        </div>
      ),
  ],
  render: function Render(args) {
    const [{ value, period, comparisonOpen }, update] = useArgs<{ value: string; period: BillingPeriod; comparisonOpen?: boolean }>();
    return (
      <PlanSelector
        {...args}
        value={value}
        period={period}
        comparisonOpen={comparisonOpen}
        onChange={(v) => {
          args.onChange(v);
          update({ value: v });
        }}
        onPeriodChange={(p) => {
          args.onPeriodChange(p);
          update({ period: p });
        }}
        onComparisonOpenChange={(o) => {
          args.onComparisonOpenChange?.(o);
          if (comparisonOpen !== undefined) update({ comparisonOpen: o });
        }}
      />
    );
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Billing plan picker for PreForm cloud. Plan cards form a native radiogroup (arrow keys move the selection); the selected card takes the Card `selected` treatment (`--color-fg-accent` border, `--color-bg-accent-subtle` wash) and the recommended plan an accent border and ribbon. A Segmented switch flips monthly/yearly pricing, and a disclosure reveals the feature comparison table.',
      },
    },
  },
} satisfies Meta<typeof PlanSelector>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Monthly: Story = { args: { period: 'monthly' } };

export const NewWorkspace: Story = {
  name: 'New workspace (no current plan)',
  args: { currentPlanId: undefined, value: 'pro' },
};

export const ComparisonOpen: Story = {
  name: 'Comparison table open',
  args: { comparisonOpen: true },
};

export const ThreePlans: Story = {
  name: 'Three plans, no comparison',
  args: { plans: plans.slice(0, 3), comparison: undefined, currentPlanId: 'free', value: 'pro' },
};

export const Disabled: Story = { args: { disabled: true } };

const StateCard = ({ selected, ...p }: { selected: boolean; 'data-state'?: string; disabled?: boolean }) => (
  <div style={{ width: 'var(--size-layout-menu-min)' }}>
    <PlanSelector plans={[plans[1]]} value={selected ? 'pro' : 'business'} period="yearly" onChange={() => {}} onPeriodChange={() => {}} hidePeriodSwitch label="Pro plan state" {...p} />
  </div>
);

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'unselected', render: (p) => <StateCard selected={false} {...p} /> },
        { label: 'selected', render: (p) => <StateCard selected {...p} /> },
      ]}
    />
  ),
};
