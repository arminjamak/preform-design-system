import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { useState } from 'react';
import { FeatureFlagToggle, type FeatureFlag } from '../components/FeatureFlagToggle/FeatureFlagToggle';
import { StateMatrix } from './helpers/StateMatrix';

const aiProtect: FeatureFlag = {
  key: 'supports.ai_protect',
  name: 'AI support protection',
  description: 'Adds supports under thin overhangs that the print-failure model flags as at risk, before slicing.',
  environments: [
    { id: 'dev', label: 'Development', enabled: true, rollout: 100 },
    { id: 'staging', label: 'Staging', enabled: true, rollout: 50 },
    { id: 'prod', label: 'Production', enabled: false, rollout: 0 },
  ],
  updatedBy: 'Mara Lindqvist',
  updatedAt: 'Today, 14:32',
};

const smartQueue: FeatureFlag = {
  key: 'queue.smart_reorder',
  name: 'Smart queue reordering',
  description: 'Groups queued jobs by resin so operators swap tanks less often.',
  environments: [
    { id: 'dev', label: 'Development', enabled: true },
    { id: 'staging', label: 'Staging', enabled: true },
    { id: 'prod', label: 'Production', enabled: true, rollout: 100 },
  ],
  updatedBy: 'Jonas Okafor',
  updatedAt: 'Mon 6 Oct, 09:15',
};

const resinAutofill: FeatureFlag = {
  key: 'materials.resin_autofill',
  name: 'Automatic resin refill orders',
  description: 'Orders a new cartridge when the forecast says a printer runs dry within five days.',
  environments: [
    { id: 'dev', label: 'Development', enabled: false, rollout: 0 },
    { id: 'staging', label: 'Staging', enabled: false, rollout: 0 },
    { id: 'prod', label: 'Production', enabled: false, rollout: 0 },
  ],
  updatedBy: 'Priya Raman',
  updatedAt: 'Thu 2 Oct, 16:48',
};

const layoutBeta: FeatureFlag = {
  key: 'layout.dense_packing_v2',
  name: 'Dense packing v2',
  description: 'New nesting algorithm for Form 4L build platforms.',
  environments: [
    { id: 'dev', label: 'Development', enabled: true },
    { id: 'staging', label: 'Staging', enabled: true },
    { id: 'prod', label: 'Production', enabled: false },
  ],
  updatedBy: 'Mara Lindqvist',
  updatedAt: 'Yesterday, 11:02',
};

const meta = {
  title: 'Components/Specialized/FeatureFlagToggle',
  component: FeatureFlagToggle,
  tags: ['expanded'],
  args: { flag: aiProtect, onChange: fn(), rolloutStep: 5, disabled: false, variant: 'card' },
  argTypes: {
    flag: { control: 'object' },
    rolloutStep: { control: { type: 'inline-radio' }, options: [1, 5, 10, 25] },
    variant: { control: 'inline-radio', options: ['card', 'row'] },
    disabled: { control: 'boolean' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state (first switch)' },
  },
  decorators: [
    (Story, ctx) =>
      ctx.name === 'States' ? (
        <Story />
      ) : (
        <div style={{ width: '100%', maxWidth: 'var(--size-layout-dialog-lg)' }}>
          <Story />
        </div>
      ),
  ],
  render: function Render(args) {
    const [{ flag }, update] = useArgs<{ flag: FeatureFlag }>();
    return (
      <FeatureFlagToggle
        {...args}
        flag={flag}
        onChange={(f) => {
          args.onChange(f);
          update({ flag: f });
        }}
      />
    );
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'One feature flag in the PreForm admin console: mono key, name and description, an environment chip per stage (Development / Staging / Production) with its own Toggle and an optional rollout slider (`--color-control-slider-*`), a status badge derived from the environments, and the last-changed audit line.',
      },
    },
  },
} satisfies Meta<typeof FeatureFlagToggle>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Live: Story = { name: 'Live everywhere', args: { flag: smartQueue } };
export const Off: Story = { args: { flag: resinAutofill } };
export const PartiallyOn: Story = { name: 'On in some environments', args: { flag: layoutBeta } };
export const Disabled: Story = { name: 'Disabled (no permission)', args: { disabled: true } };

export const FlagList: Story = {
  name: 'List of flags (row variant)',
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [flags, setFlags] = useState([aiProtect, smartQueue, layoutBeta, resinAutofill]);
    return (
      <div
        className="sb-stack"
        style={{ gap: 0, alignItems: 'stretch', padding: '0 var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-surface)', boxShadow: 'var(--elevation-card)' }}
      >
        {flags.map((f) => (
          <FeatureFlagToggle key={f.key} flag={f} variant="row" onChange={(next) => setFlags((all) => all.map((x) => (x.key === next.key ? next : x)))} />
        ))}
      </div>
    );
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={() => null}
      rows={[
        {
          label: 'off',
          render: (p) => (
            <div style={{ width: 'var(--size-layout-sidebar)' }}>
              <FeatureFlagToggle flag={{ ...resinAutofill, environments: resinAutofill.environments.slice(0, 1), updatedBy: undefined, updatedAt: undefined }} onChange={() => {}} {...p} />
            </div>
          ),
        },
        {
          label: 'on',
          render: (p) => (
            <div style={{ width: 'var(--size-layout-sidebar)' }}>
              <FeatureFlagToggle flag={{ ...aiProtect, environments: aiProtect.environments.slice(1, 2), updatedBy: undefined, updatedAt: undefined }} onChange={() => {}} {...p} />
            </div>
          ),
        },
      ]}
    />
  ),
};
