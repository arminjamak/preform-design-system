import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { CaptionsIcon, CaptionsOffIcon, GaugeIcon, MaximizeIcon, MinimizeIcon, PauseIcon, PlayIcon, RotateCcwIcon, Volume1Icon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { IconButton } from '../IconButton/IconButton';
import { Menu } from '../Menu/Menu';
import { Slider } from '../Slider/Slider';
import { Spinner } from '../Spinner/Spinner';
import { MediaScrubber } from './MediaScrubber';
import { formatTime, handleMediaKey, MEDIA_KEYSHORTCUTS, useMediaActions, useMediaState } from './media';
import s from './VideoPlayer.module.css';

export type VideoTextTrack = {
  /** WebVTT file URL (same-origin or CORS-enabled). */
  src: string;
  /** BCP 47 language, e.g. `en`. */
  srclang: string;
  /** Menu label, e.g. "English". */
  label: string;
  kind?: 'captions' | 'subtitles';
  /** Show this track on load. */
  default?: boolean;
};

export type VideoPlayerProps = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onTimeUpdate'> &
  WithForcedState & {
    src: string;
    /** Frame shown before playback. */
    poster?: string;
    /** Shown in the top scrim and used as the region's accessible name. */
    title: string;
    /** Caption/subtitle tracks; adds a captions control when present. */
    tracks?: VideoTextTrack[];
    autoPlay?: boolean;
    loop?: boolean;
    muted?: boolean;
    /** Playback speeds offered in the speed menu. */
    rates?: number[];
    /** Fires on every `timeupdate`; use it to sync a TranscriptViewer. */
    onTimeUpdate?: (time: number) => void;
  };

const DEFAULT_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
/** Idle time before controls hide during playback (behaviour, not styling). */
const IDLE_MS = 2500;
const NOTICE_MS = 3000;

/**
 * Video with PreForm chrome: play/pause, scrubber, time, volume, speed menu, captions and fullscreen.
 * The forwarded ref is the underlying <video> element so callers can seek it.
 */
export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(function VideoPlayer(
  { src, poster, title, tracks = [], autoPlay, loop, muted, rates = DEFAULT_RATES, onTimeUpdate, className, 'data-state': forced, onKeyDown, ...rest },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);

  const media = useMediaState(videoRef, src);
  const actions = useMediaActions(videoRef);

  const [idle, setIdle] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState(() => tracks.findIndex((t) => t.default));
  const [cue, setCue] = useState('');
  const idleTimer = useRef<number>();
  const noticeTimer = useRef<number>();

  // Keep `muted` prop in sync after mount (React only applies it as an attribute on first render).
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = Boolean(muted);
  }, [muted]);

  useEffect(() => {
    onTimeUpdate?.(media.currentTime);
  }, [media.currentTime, onTimeUpdate]);

  const wake = useCallback(() => {
    setIdle(false);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MS);
  }, []);
  useEffect(() => () => {
    window.clearTimeout(idleTimer.current);
    window.clearTimeout(noticeTimer.current);
  }, []);
  useEffect(() => {
    if (media.playing) wake();
  }, [media.playing, wake]);

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  // Fullscreen: track changes from Esc / browser UI, and surface rejections (iframes without allow="fullscreen", iOS).
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (rootRef.current?.requestFullscreen && document.fullscreenEnabled !== false) await rootRef.current.requestFullscreen();
      else throw new Error('unsupported');
    } catch {
      flash('Fullscreen is not available here');
    }
  }, [flash]);

  // Captions: the chosen track runs in `hidden` mode and its active cues are rendered by us, above the controls.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const list = Array.from(v.textTracks);
    list.forEach((t, i) => (t.mode = i === activeTrack ? 'hidden' : 'disabled'));
    const track = list[activeTrack];
    if (!track) {
      setCue('');
      return;
    }
    const read = () => {
      const cues = Array.from(track.activeCues ?? []) as VTTCue[];
      setCue(cues.map((c) => c.text.replace(/<[^>]+>/g, '')).join('\n'));
    };
    read();
    track.addEventListener('cuechange', read);
    return () => track.removeEventListener('cuechange', read);
  }, [activeTrack, tracks, src]);

  const toggleCaptions = useCallback(() => {
    if (!tracks.length) return;
    setActiveTrack((a) => (a >= 0 ? -1 : Math.max(tracks.findIndex((t) => t.default), 0)));
  }, [tracks]);

  const chromeVisible = !media.playing || !idle || hovering || focusInside || forced === 'hover' || forced === 'focus';
  const VolumeGlyph = media.muted || media.volume === 0 ? VolumeXIcon : media.volume < 0.5 ? Volume1Icon : Volume2Icon;
  const ended = !media.playing && media.duration > 0 && media.currentTime >= media.duration;
  const captionsOn = activeTrack >= 0;

  const onPointerMove = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'touch') wake();
  };

  return (
    <div
      ref={rootRef}
      role="region"
      aria-label={`Video: ${title}`}
      aria-keyshortcuts={`${MEDIA_KEYSHORTCUTS} F${tracks.length ? ' C' : ''}`}
      tabIndex={0}
      data-state={forced}
      data-idle={chromeVisible ? undefined : ''}
      className={cx(s.player, fullscreen && s.fullscreen, className)}
      onPointerMove={onPointerMove}
      onPointerLeave={() => media.playing && setIdle(true)}
      onFocus={() => {
        setFocusInside(true);
        wake();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusInside(false);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        const handled = handleMediaKey(e, videoRef.current, actions, {
          f: () => void toggleFullscreen(),
          ...(tracks.length ? { c: toggleCaptions } : {}),
        });
        if (handled) wake();
      }}
      {...rest}
    >
      <video
        ref={videoRef}
        className={s.video}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        preload="metadata"
        onClick={actions.toggle}
        onDoubleClick={() => void toggleFullscreen()}
      >
        {tracks.map((t) => (
          <track key={t.src} src={t.src} srcLang={t.srclang} label={t.label} kind={t.kind ?? 'captions'} />
        ))}
      </video>

      {/* Centre state: big play / replay or buffering spinner (pointer affordance; the bar holds the accessible controls). */}
      <div className={s.center} aria-hidden>
        {media.waiting && !media.error ? (
          <Spinner size="lg" label="Buffering" className={s.spinner} />
        ) : !media.playing && !media.error ? (
          <IconButton
            label={ended ? 'Replay' : 'Play'}
            icon={ended ? <RotateCcwIcon strokeWidth={2.2} /> : <PlayIcon strokeWidth={2.2} fill="currentColor" />}
            variant="filled"
            shape="circle"
            className={s.bigPlay}
            tabIndex={-1}
            onClick={actions.toggle}
          />
        ) : null}
      </div>
      {media.error && (
        <p className={s.error} role="alert">
          Couldn’t load this video.
        </p>
      )}

      {cue && (
        <div className={cx(s.captions, chromeVisible && s.captionsRaised)} aria-hidden>
          {cue.split('\n').map((line, i) => (
            <span key={i} className={s.cueLine}>
              {line}
            </span>
          ))}
        </div>
      )}

      {notice && (
        <p className={s.notice} role="status">
          {notice}
        </p>
      )}

      <div className={cx(s.chrome, s.top)} aria-hidden>
        <span className={s.title}>{title}</span>
      </div>

      <div className={cx(s.chrome, s.bottom)} onPointerEnter={() => setHovering(true)} onPointerLeave={() => setHovering(false)}>
        <MediaScrubber label="Seek" tone="media" current={media.currentTime} duration={media.duration} buffered={media.buffered} onSeek={actions.seek} />
        <div className={s.bar}>
          <IconButton
            label={media.playing ? 'Pause' : 'Play'}
            icon={media.playing ? <PauseIcon strokeWidth={2.2} fill="currentColor" /> : <PlayIcon strokeWidth={2.2} fill="currentColor" />}
            variant="inverse"
            onClick={actions.toggle}
          />
          <span className={s.volume}>
            <IconButton label={media.muted ? 'Unmute' : 'Mute'} icon={<VolumeGlyph strokeWidth={2.2} />} variant="inverse" onClick={actions.toggleMute} />
            <Slider label="Volume" value={Math.round((media.muted ? 0 : media.volume) * 100)} onChange={(v) => actions.setVolume(v / 100)} className={s.volumeSlider} />
          </span>
          <span className={s.time}>
            <span>{formatTime(media.currentTime)}</span>
            <span className={s.timeSep}>/</span>
            <span className={s.timeTotal}>{formatTime(media.duration)}</span>
          </span>
          <span className={s.spacer} />
          {tracks.length === 1 && (
            <IconButton
              label={captionsOn ? 'Turn captions off' : 'Turn captions on'}
              icon={captionsOn ? <CaptionsIcon strokeWidth={2.2} /> : <CaptionsOffIcon strokeWidth={2.2} />}
              variant="inverse"
              pressed={captionsOn}
              onClick={toggleCaptions}
            />
          )}
          {tracks.length > 1 && (
            <Menu
              label={`Captions: ${captionsOn ? tracks[activeTrack].label : 'Off'}`}
              icon={captionsOn ? <CaptionsIcon strokeWidth={2.2} /> : <CaptionsOffIcon strokeWidth={2.2} />}
              placement="top"
              align="end"
              buttonVariant="inverse"
              items={[
                { label: 'Off', onSelect: () => setActiveTrack(-1), selected: !captionsOn },
                ...tracks.map((t, i) => ({ label: t.label, onSelect: () => setActiveTrack(i), selected: i === activeTrack })),
              ]}
            />
          )}
          <Menu
            label={`Playback speed: ${media.rate}×`}
            icon={<GaugeIcon strokeWidth={2.2} />}
            placement="top"
            align="end"
            buttonVariant="inverse"
            items={rates.map((r) => ({ label: r === 1 ? 'Normal' : `${r}×`, onSelect: () => actions.setRate(r), selected: media.rate === r }))}
          />
          <IconButton
            label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            icon={fullscreen ? <MinimizeIcon strokeWidth={2.2} /> : <MaximizeIcon strokeWidth={2.2} />}
            variant="inverse"
            onClick={() => void toggleFullscreen()}
          />
        </div>
      </div>
    </div>
  );
});
