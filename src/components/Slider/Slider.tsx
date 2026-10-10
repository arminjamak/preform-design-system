import type { CSSProperties } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './Slider.module.css';

export type SliderProps = WithForcedState & {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  /** `fill` is the brush-size slider with a filled track; `soft` is the thin blue texture/label slider. */
  variant?: 'fill' | 'soft';
  disabled?: boolean;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
};

export function Slider({ label, value, min = 0, max = 100, step = 1, onChange, variant = 'fill', disabled, showValue, formatValue, className, 'data-state': state }: SliderProps) {
  const pct = max === min ? 0 : (value - min) / (max - min);
  const slider = (
    <span className={cx(s.wrap, variant === 'fill' ? s.fillVariant : s.soft, disabled && s.disabled, !showValue && className)} style={{ '--slider-pct': pct } as CSSProperties} data-state={state}>
      <span className={s.rail} />
      <span className={s.fill} />
      <input aria-label={label} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className={s.input} data-state={state} />
    </span>
  );
  if (!showValue) return slider;
  return (
    <span className={cx(s.row, className)}>
      {slider}
      <span className={s.value}>{formatValue ? formatValue(value) : value}</span>
    </span>
  );
}
