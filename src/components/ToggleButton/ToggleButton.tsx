import { forwardRef, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import { ButtonGroup } from '../ButtonGroup/ButtonGroup';
import s from './ToggleButton.module.css';

export type ToggleButtonVariant = 'outline' | 'ghost';

export type ToggleButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'children'> &
  WithForcedState & {
    pressed: boolean;
    onChange: (pressed: boolean) => void;
    /** Visible text, or the accessible name when `iconOnly`. */
    label: string;
    icon?: ReactNode;
    /** Hide the text and show only the icon (label becomes aria-label and title). */
    iconOnly?: boolean;
    size?: Size;
    variant?: ToggleButtonVariant;
  };

/** Two-state button with `aria-pressed` (Show supports, Wireframe, X-ray). */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton(
  { pressed, onChange, label, icon, iconOnly, size = 'sm', variant = 'outline', className, type = 'button', onClick, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={pressed}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onChange(!pressed);
      }}
      className={cx(s.button, s[variant], s[size], iconOnly && s.iconOnly, className)}
      {...rest}
    >
      {icon && (
        <span className={s.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {!iconOnly && <span>{label}</span>}
    </button>
  );
});

export type ToggleButtonOption<T extends string> = { value: T; label: string; icon?: ReactNode; disabled?: boolean };

type ToggleButtonGroupBase<T extends string> = WithForcedState & {
  /** Accessible name of the group. */
  label: string;
  options: ToggleButtonOption<T>[];
  size?: Size;
  variant?: ToggleButtonVariant;
  iconOnly?: boolean;
  /** Join the buttons into one cluster (default) or space them apart. */
  attached?: boolean;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  className?: string;
};

export type ToggleButtonGroupSingleProps<T extends string> = ToggleButtonGroupBase<T> & {
  selectionMode?: 'single';
  value: T | null;
  onChange: (value: T | null) => void;
  /** Allow clicking the pressed button to clear the selection. Default false. */
  allowEmpty?: boolean;
};

export type ToggleButtonGroupMultipleProps<T extends string> = ToggleButtonGroupBase<T> & {
  selectionMode: 'multiple';
  value: T[];
  onChange: (value: T[]) => void;
  /** Allow un-pressing the last pressed button. Default true. */
  allowEmpty?: boolean;
};

export type ToggleButtonGroupProps<T extends string> = ToggleButtonGroupSingleProps<T> | ToggleButtonGroupMultipleProps<T>;

const NEXT_KEYS = { horizontal: 'ArrowRight', vertical: 'ArrowDown' } as const;
const PREV_KEYS = { horizontal: 'ArrowLeft', vertical: 'ArrowUp' } as const;

/**
 * A set of ToggleButtons with single (one view mode at a time) or multiple
 * (any combination of overlays) selection. Arrow keys move between buttons.
 */
export function ToggleButtonGroup<T extends string>(props: ToggleButtonGroupProps<T>) {
  const { label, options, size = 'sm', variant = 'outline', iconOnly, attached = true, orientation = 'horizontal', disabled, className, 'data-state': state } = props;

  const isPressed = (v: T) => (props.selectionMode === 'multiple' ? props.value.includes(v) : props.value === v);

  const allowEmpty = props.allowEmpty ?? props.selectionMode === 'multiple';

  const toggle = (v: T) => {
    if (props.selectionMode === 'multiple') {
      const has = props.value.includes(v);
      if (has && !allowEmpty && props.value.length === 1) return;
      props.onChange(has ? props.value.filter((x) => x !== v) : options.filter((o) => o.value === v || props.value.includes(o.value)).map((o) => o.value));
    } else if (props.value === v) {
      if (allowEmpty) props.onChange(null);
    } else {
      props.onChange(v);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    let next: HTMLButtonElement | undefined;
    if (e.key === NEXT_KEYS[orientation]) next = buttons[(index + 1) % buttons.length];
    else if (e.key === PREV_KEYS[orientation]) next = buttons[(index - 1 + buttons.length) % buttons.length];
    else if (e.key === 'Home') next = buttons[0];
    else if (e.key === 'End') next = buttons[buttons.length - 1];
    if (!next) return;
    e.preventDefault();
    next.focus();
  };

  return (
    <ButtonGroup ariaLabel={label} attached={attached} orientation={orientation} onKeyDown={onKeyDown} className={className}>
      {options.map((o, i) => (
        <ToggleButton
          key={o.value}
          pressed={isPressed(o.value)}
          onChange={() => toggle(o.value)}
          label={o.label}
          icon={o.icon}
          iconOnly={iconOnly}
          size={size}
          variant={variant}
          disabled={disabled || o.disabled}
          data-state={i === 0 ? state : undefined}
        />
      ))}
    </ButtonGroup>
  );
}
