import type { Meta, StoryObj } from '@storybook/react-vite';
import { VideoPlayer } from '../components/VideoPlayer/VideoPlayer';
import { captionTracks, DEMO_VIDEO, videoPosterSvg } from './demo/media-demo';

const poster = videoPosterSvg();
const tracks = captionTracks();
const english = { src: tracks.en, srclang: 'en', label: 'English', default: true };
const german = { src: tracks.de, srclang: 'de', label: 'Deutsch' };

const meta = {
  title: 'Components/Media/VideoPlayer',
  component: VideoPlayer,
  tags: ['expanded'],
  args: {
    src: DEMO_VIDEO,
    poster,
    title: 'Preparing a print for the Form 4',
    tracks: [english],
    autoPlay: false,
    loop: false,
    muted: false,
    rates: [0.5, 0.75, 1, 1.25, 1.5, 2],
  },
  argTypes: {
    src: { control: 'text' },
    poster: { control: 'text' },
    tracks: { control: 'object' },
    rates: { control: 'object' },
    onTimeUpdate: { control: false },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  decorators: [
    (S) => (
      <div style={{ width: 'calc(var(--size-layout-dialog-lg) + var(--size-layout-sidebar))', maxWidth: '100%' }}>
        <S />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Video with PreForm chrome for tutorials and print time-lapses: scrubber (Slider fill styling), time, volume, playback-speed Menu, captions and fullscreen. Controls fade while playing. Keyboard on the focused player: Space/K play-pause, ←/→ seek 5 s, ↑/↓ volume, M mute, F fullscreen, C captions. Chrome uses `--color-fg-on-inverse` over a scrim mixed from `--color-neutral-1000`; the fill is `--color-control-slider-fill`.',
      },
    },
  },
} satisfies Meta<typeof VideoPlayer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const MultipleCaptionTracks: Story = {
  name: 'Captions menu (2 languages)',
  args: { tracks: [english, german] },
};

export const WithoutCaptions: Story = {
  args: { tracks: [], title: 'Form 4 time-lapse · Bracket_v3_batch' },
};

export const AmbientLoop: Story = {
  name: 'Autoplay, muted, loop',
  args: { autoPlay: true, muted: true, loop: true, tracks: [], title: 'Resin tank close-up · Clear V4' },
};

export const ControlsPinned: Story = {
  name: 'Forced focus (controls pinned)',
  args: { 'data-state': 'focus' },
};

export const LoadError: Story = {
  args: { src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/missing-print.mp4', poster: undefined, tracks: [], title: 'Missing recording · Studio-04' },
};

export const Compact: Story = {
  name: 'Narrow (panel width)',
  decorators: [
    (S) => (
      <div className="sb-panel-demo">
        <S />
      </div>
    ),
  ],
  args: { title: 'Orienting parts' },
};
