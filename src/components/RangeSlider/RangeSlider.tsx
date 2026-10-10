import { useRef, type CSSProperties, type PointerEvent } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './RangeSlider.module.css';

export type RangeValue = [number, number];

export type RangeSliderProps = WithForcedState & {
  /** Accessible name; each thumb is announced as "<label> minimum" / "<label> maximum". */
  label: string;
  value: RangeValue;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: RangeValue) => void;
  disabled?: boolean;
  /** Show the low and high values on either side of the track. */
  showValues?: boolean;
  formatValue?: (value: number) => string;
  /** Smallest allowed gap between the two thumbs. */
  minDistance?: number;
  className?: string;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Two-thumb range slider (visible layer range, support height band). Same track and thumb as `Slider` fill. */
export function RangeSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled,
  showValues,
  formatValue,
  minDistance = 0,
  className,
  'data-state': state,
}: RangeSliderProps) {
  const loRef = useRef<HTMLInputElement>(null);
  const hiRef = useRef<HTMLInputElement>(null);
  const span = max - min;
  const lo = clamp(Math.min(value[0], value[1]), min, max);
  const hi = clamp(Math.max(value[0], value[1]), min, max);
  const pct = (v: number) => (span === 0 ? 0 : (v - min) / span);
  const fmt = (v: number) => (formatValue ? formatValue(v) : String(v));

  const setLo = (v: number) => onChange([clamp(v, min, hi - minDistance), hi]);
  const setHi = (v: number) => onChange([lo, clamp(v, lo + minDistance, max)]);

  // Clicking the bare track moves the nearest thumb there.
  const onTrackPointerDown = (e: PointerEvent<HTMLSpanElement>) => {
    if (disabled || e.target instanceof HTMLInputElement) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const raw = min + ((e.clientX - rect.left) / rect.width) * span;
    const snapped = clamp(Math.round((raw - min) / step) * step + min, min, max);
    if (Math.abs(snapped - lo) <= Math.abs(snapped - hi)) {
      setLo(snapped);
      loRef.current?.focus();
    } else {
      setHi(snapped);
      hiRef.current?.focus();
    }
  };

  // When both thumbs sit together near the top, the low thumb must be on top so it can be dragged back down.
  const loOnTop = pct(lo) > 0.5;

  const track = (
    <span
      role="group"
      aria-label={label}
      className={cx(s.wrap, disabled && s.disabled, !showValues && className)}
      style={{ '--range-lo': pct(lo), '--range-hi': pct(hi) } as CSSProperties}
      data-state={state}
      onPointerDown={onTrackPointerDown}
    >
      <span className={s.rail} />
      <span className={s.fill} />
      <input
        ref={loRef}
        type="range"
        aria-label={`${label} minimum`}
        aria-valuetext={fmt(lo)}
        min={min}
        max={max}
        step={step}
        value={lo}
        disabled={disabled}
        onChange={(e) => setLo(Number(e.target.value))}
        className={cx(s.input, loOnTop && s.top)}
        data-state={state}
      />
      <input
        ref={hiRef}
        type="range"
        aria-label={`${label} maximum`}
        aria-valuetext={fmt(hi)}
        min={min}
        max={max}
        step={step}
        value={hi}
        disabled={disabled}
        onChange={(e) => setHi(Number(e.target.value))}
        className={cx(s.input, !loOnTop && s.top)}
      />
    </span>
  );

  if (!showValues) return track;
  return (
    <span className={cx(s.row, className)}>
      <span className={cx(s.value, s.valueLo)} aria-hidden="true">
        {fmt(lo)}
      </span>
      {track}
      <span className={cx(s.value, s.valueHi)} aria-hidden="true">
        {fmt(hi)}
      </span>
    </span>
  );
}
