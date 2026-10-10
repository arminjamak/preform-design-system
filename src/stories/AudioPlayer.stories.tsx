import type { Meta, StoryObj } from '@storybook/react-vite';
import { AudioPlayer } from '../components/AudioPlayer/AudioPlayer';
import { DEMO_AUDIO, demoWaveform } from './demo/media-demo';
import { StateMatrix } from './helpers/StateMatrix';

const waveform = demoWaveform(96);

const meta = {
  title: 'Components/Media/AudioPlayer',
  component: AudioPlayer,
  tags: ['expanded'],
  args: {
    src: DEMO_AUDIO,
    title: 'Print failure alert',
    meta: 'Form 4 · Studio-04 · Notification sounds',
    waveform: undefined,
    autoPlay: false,
    loop: false,
    compact: false,
    disabled: false,
    variant: 'outline',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['outline', 'elevated'] },
    waveform: { control: 'object' },
    onTimeUpdate: { control: false },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  decorators: [
    (S, ctx) =>
      ctx.name === 'States' ? (
        <S />
      ) : (
        <div style={{ width: 'var(--size-layout-dialog-lg)', maxWidth: '100%' }}>
          <S />
        </div>
      ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Compact audio bar for printer alert tones and voice notes on print jobs: play/pause, title + meta, scrubber or static waveform, time and volume. Same keyboard map as VideoPlayer (Space, ←/→, ↑/↓, M). Waveform bars use `--color-control-slider-fill` for played and `--color-control-slider-rail` for unplayed.',
      },
    },
  },
} satisfies Meta<typeof AudioPlayer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithWaveform: Story = {
  args: { waveform, title: 'Voice note: support review', meta: 'Leo Martins · Bracket_v3_batch.form' },
};

export const Compact: Story = {
  args: { compact: true, waveform, title: 'Resin low warning', meta: 'Grey V5 cartridge · 42 mL left' },
  decorators: [
    (S) => (
      <div className="sb-panel-demo">
        <S />
      </div>
    ),
  ],
};

export const Elevated: Story = {
  args: { variant: 'elevated', title: 'Print complete chime', meta: 'Form 4 · Notification sounds' },
  decorators: [
    (S) => (
      <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-panel)', borderRadius: 'var(--radius-lg)' }}>
        <S />
      </div>
    ),
  ],
};

export const Playlist: Story = {
  name: 'Job notes list',
  render: (args) => (
    <div className="sb-stack" style={{ alignItems: 'stretch' }}>
      <AudioPlayer {...args} title="Voice note: orientation" meta="Maya · 12 Oct, 09:14" waveform={demoWaveform(64)} />
      <AudioPlayer {...args} title="Voice note: supports on cosmetic face" meta="Leo · 12 Oct, 09:31" waveform={waveform} />
      <AudioPlayer {...args} title="Print failure alert" meta="Studio-04 · Layer 412 of 1,204" />
    </div>
  ),
};

export const LoadError: Story = {
  args: { src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/missing-note.mp3', title: 'Voice note: wash settings' },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'bar', render: (p) => <AudioPlayer {...args} compact data-state={p['data-state']} disabled={p.disabled} style={{ width: 'var(--size-layout-dialog-sm)' }} /> },
        { label: 'waveform', render: (p) => <AudioPlayer {...args} compact waveform={waveform} data-state={p['data-state']} disabled={p.disabled} style={{ width: 'var(--size-layout-dialog-sm)' }} /> },
      ]}
    />
  ),
};
