import { useMemo, type CSSProperties, type KeyboardEvent } from 'react';
import { cx } from '../../lib/cx';
import { formatTime, SEEK_STEP, speakTime } from './media';
import s from './MediaScrubber.module.css';

export type MediaScrubberProps = {
  /** Accessible name, e.g. "Seek". */
  label: string;
  current: number;
  duration: number;
  /** Seconds buffered ahead (drawn as a lighter rail). */
  buffered?: number;
  onSeek: (time: number) => void;
  /** `media` sits on a dark video scrim; `default` sits on a surface. */
  tone?: 'default' | 'media';
  /** Optional static waveform (any positive numbers, normalised to the max). Replaces the rail. */
  waveform?: number[];
  disabled?: boolean;
  className?: string;
};

/** Seek bar shared by VideoPlayer and AudioPlayer: Slider-style fill, optional buffer rail or waveform bars. */
export function MediaScrubber({ label, current, duration, buffered = 0, onSeek, tone = 'default', waveform, disabled, className }: MediaScrubberProps) {
  const pct = duration > 0 ? Math.min(current / duration, 1) : 0;
  const buf = duration > 0 ? Math.min(buffered / duration, 1) : 0;
  const bars = useMemo(() => {
    if (!waveform?.length) return null;
    const max = Math.max(...waveform.map((v) => Math.abs(v)), 1e-6);
    return waveform.map((v) => Math.max(Math.abs(v) / max, 0.08));
  }, [waveform]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const step = e.key.startsWith('Page') ? SEEK_STEP * 2 : SEEK_STEP;
    const moves: Record<string, number> = { ArrowLeft: -step, ArrowDown: -step, PageDown: -step, ArrowRight: step, ArrowUp: step, PageUp: step };
    if (e.key in moves) {
      e.preventDefault();
      onSeek(Math.min(Math.max(current + moves[e.key], 0), duration));
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      onSeek(e.key === 'Home' ? 0 : duration);
    }
  };

  return (
    <span
      className={cx(s.wrap, s[tone], bars && s.wave, disabled && s.disabled, className)}
      style={{ '--scrub-pct': pct, '--scrub-buf': buf } as CSSProperties}
    >
      {bars ? (
        <span className={s.bars} aria-hidden>
          <svg className={s.barsSvg} viewBox={`0 0 ${bars.length} 1`} preserveAspectRatio="none" focusable="false">
            {bars.map((h, i) => (
              <rect key={i} x={i + 0.18} width={0.64} y={(1 - h) / 2} height={h} className={cx(s.bar, (i + 0.5) / bars.length <= pct && s.played)} />
            ))}
          </svg>
          <span className={s.playhead} />
        </span>
      ) : (
        <>
          <span className={s.rail} />
          <span className={s.buffer} />
          <span className={s.fill} />
        </>
      )}
      <input
        type="range"
        aria-label={label}
        min={0}
        max={duration || 0}
        step="any"
        value={Math.min(current, duration || 0)}
        aria-valuetext={`${speakTime(current)} of ${speakTime(duration)} (${formatTime(current)} / ${formatTime(duration)})`}
        disabled={disabled || duration <= 0}
        onChange={(e) => onSeek(Number(e.target.value))}
        onKeyDown={onKeyDown}
        className={s.input}
      />
    </span>
  );
}
