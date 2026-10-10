import { useEffect, useId, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { PauseIcon, PlayIcon } from 'lucide-react';
import { Button } from '../components/Button/Button';
import { TranscriptViewer } from '../components/TranscriptViewer/TranscriptViewer';
import { VideoPlayer } from '../components/VideoPlayer/VideoPlayer';
import { captionTracks, CLIP_TRANSCRIPT, DEMO_VIDEO, FORM4_TRANSCRIPT, FORM4_TRANSCRIPT_DURATION, videoPosterSvg } from './demo/media-demo';

const meta = {
  title: 'Components/Media/TranscriptViewer',
  component: TranscriptViewer,
  tags: ['expanded'],
  args: {
    title: 'Preparing a print for the Form 4',
    lines: FORM4_TRANSCRIPT,
    currentTime: 52,
    showSearch: true,
    autoScroll: true,
    height: 'md',
    onSeek: fn(),
  },
  argTypes: {
    currentTime: { control: { type: 'range', min: 0, max: FORM4_TRANSCRIPT_DURATION, step: 1 } },
    height: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'auto'] },
    query: { control: 'text' },
    lines: { control: 'object' },
  },
  decorators: [
    (S) => (
      <div style={{ width: 'var(--size-layout-dialog-lg)', maxWidth: '100%' }}>
        <S />
      </div>
    ),
  ],
  render: function Render(args) {
    const [, update] = useArgs();
    return (
      <TranscriptViewer
        {...args}
        onSeek={(t) => {
          args.onSeek?.(t);
          update({ currentTime: t });
        }}
        onQueryChange={args.query === undefined ? undefined : (q) => update({ query: q })}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'Time-stamped tutorial transcript with speaker labels (text-safe categorical colours from `--color-fg-accent` and the `--color-status-*-strong` tokens), search highlighting, an active line synced to `currentTime` that auto-scrolls inside the list, and click-to-seek via `onSeek`. Active line uses `--color-bg-accent-subtle` with an accent rule.',
      },
    },
  },
} satisfies Meta<typeof TranscriptViewer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SimulatedPlayback: Story = {
  name: 'Following playback',
  render: function Render(args) {
    const [time, setTime] = useState(0);
    const [playing, setPlaying] = useState(true);
    useEffect(() => {
      if (!playing) return;
      const id = window.setInterval(() => setTime((t) => (t + 1) % FORM4_TRANSCRIPT_DURATION), 250);
      return () => window.clearInterval(id);
    }, [playing]);
    return (
      <div className="sb-stack" style={{ alignItems: 'stretch' }}>
        <div className="sb-row">
          <Button variant="primary" iconStart={playing ? <PauseIcon /> : <PlayIcon />} onClick={() => setPlaying((p) => !p)}>
            {playing ? 'Pause' : 'Play'} (4× speed)
          </Button>
          <span className="pf-text-label">
            {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}
          </span>
        </div>
        <TranscriptViewer
          {...args}
          currentTime={time}
          onSeek={(t) => {
            args.onSeek?.(t);
            setTime(t);
          }}
        />
      </div>
    );
  },
};

export const Search: Story = { args: { query: 'support', currentTime: undefined } };

export const ReadOnly: Story = {
  name: 'No seek, no search',
  args: { onSeek: undefined, showSearch: false, height: 'sm', currentTime: 30 },
  render: (args) => <TranscriptViewer {...args} />,
};

export const LinkedToVideo: Story = {
  name: 'Linked to VideoPlayer',
  render: function Render() {
    const video = useRef<HTMLVideoElement>(null);
    const [time, setTime] = useState(0);
    const transcriptId = useId();
    const tracks = captionTracks();
    return (
      <div className="sb-stack" style={{ alignItems: 'stretch' }}>
        <VideoPlayer
          ref={video}
          src={DEMO_VIDEO}
          poster={videoPosterSvg()}
          title="One-Click Print in 5 seconds"
          tracks={[{ src: tracks.en, srclang: 'en', label: 'English', default: true }]}
          aria-describedby={transcriptId}
          onTimeUpdate={setTime}
        />
        <TranscriptViewer
          id={transcriptId}
          title="Transcript"
          lines={CLIP_TRANSCRIPT}
          currentTime={time}
          height="auto"
          showSearch={false}
          onSeek={(t) => {
            if (video.current) video.current.currentTime = t;
          }}
        />
      </div>
    );
  },
};
