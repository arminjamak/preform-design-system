import { useId, useRef, type KeyboardEvent } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './RadioGroup.module.css';

export type RadioOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type RadioGroupProps<T extends string = string> = WithForcedState & {
  /** Group label, rendered above the options and used as the radiogroup's name. */
  label: string;
  /** Keep the label for assistive tech only. */
  hideLabel?: boolean;
  value: T | undefined;
  onChange: (value: T) => void;
  options: RadioOption<T>[];
  orientation?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md';
  /** Disables every option. */
  disabled?: boolean;
  className?: string;
};

/**
 * Single-choice list with circular markers matching Checkbox. Implements the ARIA radio-group
 * pattern: one tab stop (roving tabindex), arrow keys move and select, Home/End jump.
 */
export function RadioGroup<T extends string = string>({
  label,
  hideLabel,
  value,
  onChange,
  options,
  orientation = 'vertical',
  size = 'sm',
  disabled,
  className,
  'data-state': state,
}: RadioGroupProps<T>) {
  const id = useId();
  const labelId = `${id}-label`;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const enabled = (i: number) => !disabled && !options[i]?.disabled;
  const selectedIndex = options.findIndex((o) => o.value === value);
  const tabStop = selectedIndex >= 0 && enabled(selectedIndex) ? selectedIndex : options.findIndex((_, i) => enabled(i));

  const select = (i: number) => {
    const option = options[i];
    if (!option || !enabled(i)) return;
    refs.current[i]?.focus();
    if (option.value !== value) onChange(option.value);
  };

  /** Next enabled index from `from` in `dir`, wrapping around. */
  const step = (from: number, dir: 1 | -1) => {
    for (let n = 1; n <= options.length; n += 1) {
      const i = (from + dir * n + options.length) % options.length;
      if (enabled(i)) return i;
    }
    return from;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next: number | undefined;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = step(i, 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = step(i, -1);
        break;
      case 'Home':
        next = step(-1, 1);
        break;
      case 'End':
        next = step(options.length, -1);
        break;
      case ' ':
        next = i;
        break;
      default:
        return;
    }
    e.preventDefault();
    select(next);
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-orientation={orientation}
      aria-disabled={disabled || undefined}
      className={cx(s.group, s[size], orientation === 'horizontal' && s.horizontal, className)}
    >
      <span id={labelId} className={cx(s.legend, hideLabel && s.srOnly)}>
        {label}
      </span>
      <div className={s.options}>
        {options.map((o, i) => {
          const checked = o.value === value;
          const optLabelId = `${id}-opt-${i}`;
          const descId = o.description ? `${id}-desc-${i}` : undefined;
          return (
            <button
              key={o.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-labelledby={optLabelId}
              aria-describedby={descId}
              disabled={!enabled(i)}
              tabIndex={i === tabStop ? 0 : -1}
              data-state={i === 0 ? state : undefined}
              onClick={() => select(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={s.option}
            >
              <span className={s.markerSlot} aria-hidden="true">
                <span className={s.marker} />
              </span>
              <span className={s.text}>
                <span id={optLabelId} className={s.label}>
                  {o.label}
                </span>
                {o.description && (
                  <span id={descId} className={s.description}>
                    {o.description}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
