import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Terminal, type TerminalOutput, type TerminalProps } from '../components/Terminal/Terminal';

/** Simulated network latency, expressed in multiples of the slow motion token. */
const latency = (steps: number) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--motion-duration-slow').trim();
  return (parseFloat(raw) || 0) * steps;
};
const wait = (steps: number) => new Promise<void>((resolve) => setTimeout(resolve, latency(steps)));

const HELP: TerminalOutput[] = [
  'Usage: preformserver <command> [options]',
  '',
  '  --version                    Print the PreFormServer version',
  '  list-printers                Discover printers on the local network',
  '  status <serial>              Show the state of one printer',
  '  upload <file.form> --printer <serial>',
  '                               Upload a prepared job to a printer',
  '  clear                        Clear the scrollback',
];

const PRINTERS = ['Form4-SmoothPeacock', 'Form4B-CleverHeron', 'Form3L-AgileOtter'];

/** Story-only command handler that mimics the preformserver CLI. */
async function preformserver(command: string): Promise<TerminalOutput[]> {
  const [bin, sub, ...args] = command.split(/\s+/);
  if (bin === 'help') return HELP;
  if (bin !== 'preformserver') return [{ kind: 'stderr', text: `${bin}: command not found. Try "help".` }];
  switch (sub) {
    case '--version':
      return ['PreFormServer 3.44.1 (build 2026.09.18, linux-x64)'];
    case 'list-printers':
      await wait(3);
      return [
        { kind: 'info', text: 'Discovering printers on 192.168.1.0/24…' },
        'SERIAL                 MODEL     STATUS     IP',
        'Form4-SmoothPeacock    Form 4    PRINTING   192.168.1.42',
        'Form4B-CleverHeron     Form 4B   IDLE       192.168.1.57',
        'Form3L-AgileOtter      Form 3L   ERROR      192.168.1.63',
        { kind: 'info', text: '3 printers found' },
      ];
    case 'status': {
      const serial = args[0];
      if (!serial) return [{ kind: 'stderr', text: 'error: missing <serial>. Usage: preformserver status <serial>' }];
      if (!PRINTERS.includes(serial)) return [{ kind: 'stderr', text: `error: printer "${serial}" not found on this network` }];
      await wait(2);
      if (serial === 'Form3L-AgileOtter') return [{ kind: 'stderr', text: 'Form3L-AgileOtter  ERROR  E0301 Cartridge valve did not open' }];
      return [`${serial}  PRINTING  layer 412/1650  Grey V5  resin 35.1 °C  ETA 1 h 30 min`];
    }
    case 'upload': {
      const file = args[0];
      const printerFlag = args.indexOf('--printer');
      const serial = printerFlag >= 0 ? args[printerFlag + 1] : undefined;
      if (!file || !serial) return [{ kind: 'stderr', text: 'error: usage: preformserver upload <file.form> --printer <serial>' }];
      await wait(4);
      return [
        { kind: 'info', text: `Uploading ${file} to ${serial}…` },
        'Validating scene: 12 models, supports generated, no unsupported minima',
        'Uploaded 18.4 MB in 2.1 s',
        `Job queued on ${serial} (position 2)`,
      ];
    }
    default:
      return [{ kind: 'stderr', text: `error: unknown command "${sub ?? ''}". Run "preformserver --help".` }];
  }
}

const session: TerminalOutput[] = [
  { kind: 'command', text: 'preformserver --version' },
  'PreFormServer 3.44.1 (build 2026.09.18, linux-x64)',
  { kind: 'command', text: 'preformserver status Form4-SmoothPeacock' },
  'Form4-SmoothPeacock  PRINTING  layer 412/1650  Grey V5  resin 35.1 °C  ETA 1 h 30 min',
  { kind: 'command', text: 'preformserver upload dental_arches.form --printer Form4-Unknown' },
  { kind: 'stderr', text: 'error: printer "Form4-Unknown" not found on this network' },
];

const meta = {
  title: 'Components/Specialized/Terminal',
  component: Terminal,
  tags: ['expanded'],
  args: {
    prompt: 'preform@form4:~$',
    title: 'preformserver — Form4-SmoothPeacock',
    welcome: ['PreFormServer 3.44.1 — connected to Form4-SmoothPeacock', 'Type "help" for available commands.'],
    lines: session,
    onCommand: fn(preformserver) as NonNullable<TerminalProps['onCommand']>,
    height: 'md',
  },
  argTypes: {
    prompt: { control: 'text' },
    title: { control: 'text' },
    welcome: { control: 'object' },
    lines: { control: 'object' },
    height: { control: 'select', options: ['sm', 'md', 'lg', 'var(--size-layout-panel)'] },
  },
  decorators: [(Story) => <div style={{ width: 'var(--size-layout-dialog-lg)' }}><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Inverse-themed console for the preformserver CLI and printer shells: command history on Up/Down, Ctrl+C / Ctrl+L, async command handler, copy output. Uses --color-bg-inverse and --color-fg-on-inverse in both themes; the caret blink stops under reduced motion.',
      },
    },
  },
} satisfies Meta<typeof Terminal>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const FreshSession: Story = {
  args: { lines: [], height: 'sm' },
};

export const SynchronousHandler: Story = {
  args: {
    title: 'Printer shell — Form4B-CleverHeron',
    prompt: 'root@form4b:/#',
    welcome: 'Formlabs service shell. Commands echo back synchronously.',
    lines: [],
    onCommand: (cmd: string) => (cmd === 'uptime' ? ['up 12 days, 4:03, load average: 0.21, 0.18, 0.12'] : [`echo: ${cmd}`]),
    height: 'sm',
  },
};

export const Tall: Story = { args: { height: 'lg' } };
