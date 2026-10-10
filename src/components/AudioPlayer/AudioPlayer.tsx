import { forwardRef, useEffect, useImperativeHandle, useRef, type HTMLAttributes } from 'react';
import { PauseIcon, PlayIcon, Volume1Icon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { IconButton } from '../IconButton/IconButton';
import { Slider } from '../Slider/Slider';
import { Spinner } from '../Spinner/Spinner';
import { MediaScrubber } from '../VideoPlayer/MediaScrubber';
import { formatTime, handleMediaKey, MEDIA_KEYSHORTCUTS, useMediaActions, useMediaState } from '../VideoPlayer/media';
import s from './AudioPlayer.module.css';

export type AudioPlayerProps = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onTimeUpdate'> &
  WithForcedState & {
    src: string;
    title: string;
    /** Secondary line: artist, source or context ("Print log · Form 4"). */
    meta?: string;
    /** Static waveform amplitudes (any positive scale). Drawn as bars that double as the scrubber. */
    waveform?: number[];
    autoPlay?: boolean;
    loop?: boolean;
    /** Hide the volume slider (mute button stays). */
    compact?: boolean;
    variant?: 'outline' | 'elevated';
    disabled?: boolean;
    onTimeUpdate?: (time: number) => void;
  };

/** Compact audio bar: play/pause, title + meta, scrubber or waveform, time and volume. */
export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(function AudioPlayer(
  { src, title, meta, waveform, autoPlay, loop, compact, variant = 'outline', disabled, onTimeUpdate, className, 'data-state': forced, onKeyDown, ...rest },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useImperativeHandle(ref, () => audioRef.current as HTMLAudioElement);
  const media = useMediaState(audioRef, src);
  const actions = useMediaActions(audioRef);

  useEffect(() => {
    onTimeUpdate?.(media.currentTime);
  }, [media.currentTime, onTimeUpdate]);

  const VolumeGlyph = media.muted || media.volume === 0 ? VolumeXIcon : media.volume < 0.5 ? Volume1Icon : Volume2Icon;

  return (
    <div
      role="region"
      aria-label={`Audio: ${title}`}
      aria-keyshortcuts={MEDIA_KEYSHORTCUTS}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      data-state={forced}
      className={cx(s.bar, s[variant], disabled && s.disabled, className)}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (!e.defaultPrevented && !disabled) handleMediaKey(e, audioRef.current, actions);
      }}
      {...rest}
    >
      <audio ref={audioRef} src={src} autoPlay={autoPlay} loop={loop} preload="metadata" />
      <IconButton
        label={media.playing ? `Pause ${title}` : `Play ${title}`}
        icon={
          media.waiting ? (
            <Spinner size="xs" label="Buffering" />
          ) : media.playing ? (
            <PauseIcon strokeWidth={2.2} fill="currentColor" />
          ) : (
            <PlayIcon strokeWidth={2.2} fill="currentColor" className={s.playGlyph} />
          )
        }
        variant="filled"
        shape="circle"
        size="lg"
        disabled={disabled || media.error}
        onClick={actions.toggle}
      />
      <span className={s.info}>
        <span className={s.title} title={title}>
          {title}
        </span>
        {media.error ? (
          <span className={cx(s.meta, s.error)} role="alert">
            Couldn’t load audio
          </span>
        ) : (
          meta && <span className={s.meta}>{meta}</span>
        )}
      </span>
      <MediaScrubber label="Seek" current={media.currentTime} duration={media.duration} buffered={media.buffered} waveform={waveform} disabled={disabled} onSeek={actions.seek} className={s.scrubber} />
      <span className={s.time}>
        {formatTime(media.currentTime)}
        <span className={s.total}> / {formatTime(media.duration)}</span>
      </span>
      <span className={s.volume}>
        <IconButton label={media.muted ? 'Unmute' : 'Mute'} icon={<VolumeGlyph strokeWidth={2.2} />} disabled={disabled} onClick={actions.toggleMute} />
        {!compact && <Slider label="Volume" value={Math.round((media.muted ? 0 : media.volume) * 100)} onChange={(v) => actions.setVolume(v / 100)} disabled={disabled} className={s.volumeSlider} />}
      </span>
    </div>
  );
});
