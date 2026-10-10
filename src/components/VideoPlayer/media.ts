import { useCallback, useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react';

/** Formats seconds as `m:ss` (or `h:mm:ss` past an hour). */
export function formatTime(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Spoken form for aria-valuetext, e.g. "12 seconds of 1 minute 4 seconds". */
export function speakTime(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const m = Math.floor(total / 60);
  const s = total % 60;
  const parts = [m ? `${m} minute${m === 1 ? '' : 's'}` : '', `${s} second${s === 1 ? '' : 's'}`].filter(Boolean);
  return parts.join(' ');
}

export type MediaState = {
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  rate: number;
  waiting: boolean;
  error: boolean;
};

const INITIAL: MediaState = { playing: false, currentTime: 0, duration: 0, buffered: 0, volume: 1, muted: false, rate: 1, waiting: false, error: false };

const EVENTS = ['play', 'pause', 'ended', 'timeupdate', 'durationchange', 'loadedmetadata', 'progress', 'volumechange', 'ratechange', 'waiting', 'playing', 'canplay', 'seeked', 'error', 'emptied'] as const;

/** Mirrors an <audio>/<video> element's state into React. */
export function useMediaState(ref: RefObject<HTMLMediaElement>, src: string): MediaState {
  const [state, setState] = useState<MediaState>(INITIAL);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    let waiting = false;
    const read = (e?: Event) => {
      if (e?.type === 'waiting') waiting = true;
      if (e && ['playing', 'canplay', 'pause', 'seeked', 'error', 'emptied'].includes(e.type)) waiting = false;
      setState({
        playing: !m.paused && !m.ended,
        currentTime: m.currentTime,
        duration: Number.isFinite(m.duration) ? m.duration : 0,
        buffered: m.buffered.length ? m.buffered.end(m.buffered.length - 1) : 0,
        volume: m.volume,
        muted: m.muted,
        rate: m.playbackRate,
        waiting,
        error: Boolean(m.error),
      });
    };
    read();
    EVENTS.forEach((t) => m.addEventListener(t, read));
    return () => EVENTS.forEach((t) => m.removeEventListener(t, read));
  }, [ref, src]);
  return state;
}

export type MediaActions = {
  toggle: () => void;
  seek: (t: number) => void;
  seekBy: (delta: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setRate: (r: number) => void;
};

/** Imperative helpers over the media element. Play rejections (autoplay policy) are swallowed. */
export function useMediaActions(ref: RefObject<HTMLMediaElement>): MediaActions {
  const toggle = useCallback(() => {
    const m = ref.current;
    if (!m) return;
    if (m.paused || m.ended) m.play()?.catch(() => undefined);
    else m.pause();
  }, [ref]);
  const seek = useCallback(
    (t: number) => {
      const m = ref.current;
      if (!m) return;
      const max = Number.isFinite(m.duration) ? m.duration : t;
      m.currentTime = Math.min(Math.max(t, 0), max);
    },
    [ref],
  );
  const seekBy = useCallback((d: number) => seek((ref.current?.currentTime ?? 0) + d), [ref, seek]);
  const setVolume = useCallback(
    (v: number) => {
      const m = ref.current;
      if (!m) return;
      m.volume = Math.min(Math.max(v, 0), 1);
      m.muted = m.volume === 0;
    },
    [ref],
  );
  const toggleMute = useCallback(() => {
    const m = ref.current;
    if (!m) return;
    if (m.muted && m.volume === 0) m.volume = 1;
    m.muted = !m.muted;
  }, [ref]);
  const setRate = useCallback(
    (r: number) => {
      if (ref.current) ref.current.playbackRate = r;
    },
    [ref],
  );
  return useMemo(() => ({ toggle, seek, seekBy, setVolume, toggleMute, setRate }), [toggle, seek, seekBy, setVolume, toggleMute, setRate]);
}

export const SEEK_STEP = 5;

/**
 * Shared player keyboard map: Space/K play-pause, ←/→ (J/L) seek, ↑/↓ volume, M mute, Home/End.
 * `extra` adds player-specific keys (F fullscreen, C captions). Returns true when handled.
 */
export function handleMediaKey(
  e: ReactKeyboardEvent<HTMLElement>,
  media: HTMLMediaElement | null,
  actions: MediaActions,
  extra: Record<string, () => void> = {},
): boolean {
  if (!media || e.metaKey || e.ctrlKey || e.altKey) return false;
  const target = e.target as HTMLElement;
  const tag = target.tagName;
  const isRange = tag === 'INPUT' && (target as HTMLInputElement).type === 'range';
  const isText = (tag === 'INPUT' && !isRange) || tag === 'TEXTAREA' || target.isContentEditable;
  const isButton = tag === 'BUTTON' || target.getAttribute('role') === 'menuitem';
  if (isText) return false;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  // Let buttons and sliders keep their native activation/arrow behaviour.
  if ((key === ' ' || key === 'Enter') && isButton) return false;
  if (isRange && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(key)) return false;
  const map: Record<string, () => void> = {
    ' ': actions.toggle,
    k: actions.toggle,
    ArrowLeft: () => actions.seekBy(-SEEK_STEP),
    j: () => actions.seekBy(-SEEK_STEP),
    ArrowRight: () => actions.seekBy(SEEK_STEP),
    l: () => actions.seekBy(SEEK_STEP),
    ArrowUp: () => actions.setVolume(media.volume + 0.1),
    ArrowDown: () => actions.setVolume(media.volume - 0.1),
    m: actions.toggleMute,
    Home: () => actions.seek(0),
    End: () => actions.seek(media.duration),
    ...extra,
  };
  const fn = map[key];
  if (!fn) return false;
  e.preventDefault();
  fn();
  return true;
}

export const MEDIA_KEYSHORTCUTS = 'Space K ArrowLeft ArrowRight ArrowUp ArrowDown M Home End';
