import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { OnboardingChecklist, type OnboardingStep } from '../components/OnboardingChecklist/OnboardingChecklist';
import { StateMatrix } from './helpers/StateMatrix';

const steps: OnboardingStep[] = [
  { id: 'account', title: 'Create your Formlabs account', done: true },
  {
    id: 'connect',
    title: 'Connect a printer',
    description: 'Find your Form 4 on the local network or plug it in over USB. PreForm pairs it with your Dashboard.',
    actionLabel: 'Find printers',
    meta: '2 min',
    done: true,
  },
  {
    id: 'tank',
    title: 'Install a resin tank',
    description: 'Seat the resin tank, insert a Grey V5 cartridge and close the cover so the printer can read the tank’s tag.',
    actionLabel: 'Show me how',
    meta: '3 min',
    done: false,
  },
  {
    id: 'prepare',
    title: 'Prepare your first model',
    description: 'Open the sample calibration part, then auto-orient and generate supports in one click.',
    actionLabel: 'Open sample part',
    meta: '1 min',
    done: false,
  },
  {
    id: 'print',
    title: 'Run your first print',
    description: 'Send the job to your printer and follow its progress from the Dashboard or the Formlabs app.',
    actionLabel: 'Send to printer',
    meta: '≈ 1 h 40 min',
    done: false,
  },
];

const meta = {
  title: 'Components/Specialized/OnboardingChecklist',
  component: OnboardingChecklist,
  tags: ['expanded'],
  args: {
    title: 'Get printing with PreForm',
    description: 'Five steps from unboxing to your first part.',
    steps,
    collapsible: true,
    disabled: false,
    completeTitle: 'You’re ready to print',
    completeDescription: 'Your printer is connected and your first part is on the build platform. Nice work.',
    onDismiss: fn(),
    onMinimizedChange: fn(),
    onExpandedStepChange: fn(),
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    steps: { control: 'object' },
    collapsible: { control: 'boolean' },
    minimized: { control: 'boolean' },
    disabled: { control: 'boolean' },
    expandedStepId: { control: 'select', options: [undefined, null, ...steps.map((s) => s.id)] },
    completeTitle: { control: 'text' },
    completeDescription: { control: 'text' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state (next step)' },
  },
  render: function Render(args) {
    const [{ steps: current, minimized }, update] = useArgs<{ steps: OnboardingStep[]; minimized?: boolean }>();
    return (
      <OnboardingChecklist
        {...args}
        minimized={minimized}
        onMinimizedChange={(m) => {
          args.onMinimizedChange?.(m);
          if (minimized !== undefined) update({ minimized: m });
        }}
        // Each step's action marks it done so the Playground walks through to completion.
        steps={current.map((st) => ({ ...st, onAction: () => update({ steps: current.map((x) => (x.id === st.id ? { ...x, done: true } : x)) }) }))}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'Getting-started card for a new PreForm workspace: "2 of 5 complete" with a ProgressBar, steps with check circles (done uses `--color-status-success`, the next step an accent ring), one expandable step at a time with its action Button, minimise and dismiss. When every step is done it switches to a completion message.',
      },
    },
  },
} satisfies Meta<typeof OnboardingChecklist>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const JustStarted: Story = {
  name: 'Just started (0 of 5)',
  args: { steps: steps.map((s) => ({ ...s, done: false })) },
};

export const Minimized: Story = { args: { minimized: true } };

export const Complete: Story = {
  args: { steps: steps.map((s) => ({ ...s, done: true })) },
};

export const NotDismissible: Story = {
  name: 'Fixed (no minimise or dismiss)',
  args: { collapsible: false, onDismiss: undefined, description: undefined },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateMatrix render={(p) => <OnboardingChecklist title="First print" steps={steps.slice(1, 3)} expandedStepId={null} data-state={p['data-state']} disabled={p.disabled} />} />,
};
