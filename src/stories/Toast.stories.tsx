import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from '../components/Button/Button';
import {
  ToastItem,
  ToastProvider,
  Toaster,
  useToast,
  type ToastOptions,
  type ToastPlacement,
  type ToastItemProps,
  type ToastTone,
} from '../components/Toast/Toast';
import { StateMatrix } from './helpers/StateMatrix';

type ToastStoryArgs = Pick<ToastItemProps, 'tone' | 'title' | 'description'> & {
  /** Text of the optional action; empty hides it. */
  actionLabel?: string;
  dismissible?: boolean;
  placement?: ToastPlacement;
  max?: number;
  duration?: number;
  onAction?: () => void;
  onDismiss?: () => void;
};

const TONES: ToastTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

const meta = {
  title: 'Components/Feedback/Toast',
  component: ToastItem,
  tags: ['expanded'],
  args: {
    tone: 'success',
    title: 'Supports generated',
    description: '1,284 touchpoints added to 3 models on the build platform.',
    actionLabel: 'Undo',
    dismissible: true,
    placement: 'bottom-right',
    max: 3,
    duration: 5000,
    onAction: fn(),
    onDismiss: fn(),
  },
  argTypes: {
    tone: { control: 'select', options: TONES },
    placement: { control: 'inline-radio', options: ['bottom-right', 'bottom-center', 'top-center'], table: { category: 'Toaster' } },
    max: { control: { type: 'number', min: 1, max: 6 }, table: { category: 'ToastProvider' } },
    duration: { control: { type: 'number', min: 1000, step: 1000 }, description: 'Auto-dismiss in ms', table: { category: 'ToastProvider' } },
    title: { control: 'text' },
    description: { control: 'text' },
    actionLabel: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Transient notifications (toasts and snackbars). Wrap the app in `ToastProvider`, place one `Toaster` (a polite `aria-live` region on `--z-index-toast`) and call `useToast().toast({...})`. Toasts auto-dismiss after `duration`, pause while hovered or focused, close on Escape, and enter/exit with `--motion-duration-base`/`--motion-duration-fast`. Tone colours come from `--color-status-*`. `ToastItem` is the static card for docs.',
      },
    },
  },
} satisfies Meta<ToastStoryArgs>;
export default meta;
type Story = StoryObj<ToastStoryArgs>;

function FireButton({ options, children }: { options: ToastOptions; children: string }) {
  const { toast } = useToast();
  return (
    <Button variant="outline" onClick={() => toast(options)}>
      {children}
    </Button>
  );
}

export const Playground: Story = {
  render: function Render({ placement, max, duration, actionLabel, dismissible, onAction, onDismiss, tone, title, description }) {
    const action = actionLabel ? { label: actionLabel, onClick: onAction ?? (() => {}) } : undefined;
    return (
      <ToastProvider max={max} duration={duration}>
        <div className="sb-stack" style={{ width: 'var(--size-layout-dialog-md)' }}>
          <ToastItem tone={tone} title={title} description={description || undefined} action={action} onDismiss={dismissible ? onDismiss : undefined} />
          <FireButton options={{ tone, title, description: description || undefined, action, dismissible }}>Show this toast</FireButton>
        </div>
        <Toaster placement={placement} />
      </ToastProvider>
    );
  },
};

const examples: Record<ToastTone, ToastOptions> = {
  neutral: { tone: 'neutral', title: '2 models removed from the build platform', action: { label: 'Undo', onClick: () => {} } },
  info: { tone: 'info', title: 'Uploading to queue', description: 'Bracket_v3.form (12.4 MB) to Form 4 · Studio' },
  success: { tone: 'success', title: 'Supports generated', description: '1,284 touchpoints on 3 models.' },
  warning: { tone: 'warning', title: 'Firmware update available', description: 'Form 4 can be updated to 1.9.2.', action: { label: 'Update', onClick: () => {} } },
  danger: { tone: 'danger', title: 'Printer connection lost', description: 'Form 4 · Studio stopped responding.', action: { label: 'Retry', onClick: () => {} } },
};

export const Tones: Story = {
  parameters: { controls: { include: [] } },
  render: () => (
    <div className="sb-stack" style={{ width: 'var(--size-layout-dialog-md)', alignItems: 'stretch' }}>
      {TONES.map((t) => {
        const { tone, title, description, action } = examples[t];
        return <ToastItem key={t} tone={tone} title={title} description={description} action={action} onDismiss={() => {}} />;
      })}
    </div>
  ),
};

function FireEachToneDemo() {
  const { toast, dismissAll } = useToast();
  return (
    <div className="sb-stack">
      <div className="sb-row">
        <Button variant="outline" onClick={() => toast({ ...examples.success, action: undefined })}>
          Generate supports
        </Button>
        <Button variant="outline" onClick={() => toast(examples.info)}>
          Upload to queue
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const id = toast({ tone: 'info', title: 'Slicing Bracket_v3…', description: '0.050 mm layers · Grey V5', duration: null, dismissible: false });
            window.setTimeout(() => toast({ id, tone: 'success', title: 'Slicing complete', description: '1,412 layers · 2 h 38 min estimated', duration: 5000, dismissible: true }), 2000);
          }}
        >
          Slice (updates in place)
        </Button>
      </div>
      <div className="sb-row">
        <Button variant="outline" onClick={() => toast(examples.warning)}>
          Firmware update
        </Button>
        <Button variant="outline" onClick={() => toast({ ...examples.danger, duration: null })}>
          Printer connection lost
        </Button>
        <Button variant="outline" onClick={() => toast(examples.neutral)}>
          Remove models
        </Button>
      </div>
      <Button variant="ghost" onClick={dismissAll}>
        Dismiss all
      </Button>
    </div>
  );
}

/** Fires each tone through `useToast()`. Hover the stack to pause the timers; Escape closes the focused toast. */
export const FireEachTone: Story = {
  parameters: { controls: { include: ['placement', 'max', 'duration'] } },
  render: ({ placement, max, duration }) => (
    <ToastProvider max={max} duration={duration}>
      <FireEachToneDemo />
      <Toaster placement={placement} />
    </ToastProvider>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <StateMatrix
      render={(p) => (
        <ToastItem
          style={{ width: 'var(--size-layout-dialog-sm)' }}
          tone="neutral"
          title="2 models removed"
          action={{ label: 'Undo', onClick: () => {} }}
          onDismiss={() => {}}
          data-state={p['data-state']}
        />
      )}
    />
  ),
};
