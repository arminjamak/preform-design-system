import { Children, createContext, isValidElement, useContext, useRef, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { CheckIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Tone, WithForcedState } from '../../lib/types';
import { Avatar } from '../Avatar/Avatar';
import s from './Chip.module.css';

export type ChipVariant = 'tag' | 'filter' | 'input';

export type ChipProps = WithForcedState & {
  label: string;
  /** `tag` is a static label, `filter` toggles with a check, `input` is removable with ×. */
  variant?: ChipVariant;
  /** Colour of a `tag`. Filter and input chips use the accent when selected. */
  tone?: Tone;
  /** Defaults to the ChipGroup size, else `md`. */
  size?: 'sm' | 'md';
  /** Leading icon (material swatch, status glyph). */
  icon?: ReactNode;
  /** Leading avatar, e.g. a collaborator filter. Takes precedence over `icon`. */
  avatar?: { name: string; src?: string };
  /** Filter chips: pressed state. Ignored inside a ChipGroup, which owns selection. */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  /** Input chips: called by the × button and by Backspace/Delete on it. */
  onRemove?: () => void;
  /** Accessible name of the × button; defaults to "Remove <label>". */
  removeLabel?: string;
  /** Identifies the chip inside a ChipGroup. Defaults to `label`. */
  value?: string;
  disabled?: boolean;
  className?: string;
};

type GroupContext = {
  mode: 'single' | 'multiple';
  isSelected: (value: string) => boolean;
  toggle: (value: string) => void;
  tabStop: string | undefined;
  size: 'sm' | 'md';
};
const ChipGroupContext = createContext<GroupContext | null>(null);

/** Tag, filter and input chips: material tags, print-status filters, applied search terms. */
export function Chip({
  label,
  variant = 'tag',
  tone = 'neutral',
  size: sizeProp,
  icon,
  avatar,
  selected,
  onSelectedChange,
  onRemove,
  removeLabel,
  value,
  disabled,
  className,
  ...rest
}: ChipProps) {
  const group = useContext(ChipGroupContext);
  const key = value ?? label;
  const size = sizeProp ?? group?.size ?? 'md';
  const leading = avatar ? (
    <Avatar name={avatar.name} src={avatar.src} size="xs" className={s.avatar} />
  ) : icon ? (
    <span className={s.icon} aria-hidden="true">
      {icon}
    </span>
  ) : null;

  if (variant === 'filter') {
    const isOn = group ? group.isSelected(key) : !!selected;
    const radio = group?.mode === 'single';
    return (
      <button
        type="button"
        role={radio ? 'radio' : undefined}
        aria-checked={radio ? isOn : undefined}
        aria-pressed={radio ? undefined : isOn}
        tabIndex={radio ? (group?.tabStop === key ? 0 : -1) : undefined}
        data-chip-value={key}
        disabled={disabled}
        onClick={() => (group ? group.toggle(key) : onSelectedChange?.(!isOn))}
        className={cx(s.chip, s.filter, s[size], isOn && s.selected, className)}
        {...rest}
      >
        {isOn ? (
          <span className={s.icon} aria-hidden="true">
            <CheckIcon strokeWidth={3} />
          </span>
        ) : (
          leading
        )}
        <span className={s.label}>{label}</span>
      </button>
    );
  }

  if (variant === 'input') {
    return (
      <span className={cx(s.chip, s.input, s[size], disabled && s.disabled, className)} {...rest}>
        {leading}
        <span className={s.label}>{label}</span>
        <button
          type="button"
          className={s.remove}
          aria-label={removeLabel ?? `Remove ${label}`}
          disabled={disabled}
          onClick={onRemove}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
              e.preventDefault();
              onRemove?.();
            }
          }}
        >
          <XIcon strokeWidth={2.6} aria-hidden="true" />
        </button>
      </span>
    );
  }

  return (
    <span className={cx(s.chip, s.tag, s[tone], s[size], disabled && s.disabled, className)} {...rest}>
      {leading}
      <span className={s.label}>{label}</span>
    </span>
  );
}

export type ChipGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> & {
  /** Accessible name of the group, e.g. "Filter by print status". */
  label: string;
  /** Selected chip values (filter chips). With `single`, at most one entry. */
  value?: string[];
  onChange?: (value: string[]) => void;
  /** `single` behaves as a radio group (arrow keys move and select); `multiple` as toggle buttons. */
  selectionMode?: 'single' | 'multiple';
  /** Size applied to every chip that does not set its own. */
  size?: 'sm' | 'md';
  children: ReactNode;
};

/** Wrapping row of chips that owns filter selection. */
export function ChipGroup({ label, value = [], onChange, selectionMode = 'multiple', size = 'md', className, children, ...rest }: ChipGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const values: string[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement<ChipProps>(child) && child.props.variant === 'filter' && !child.props.disabled) values.push(child.props.value ?? child.props.label);
  });
  const ctx: GroupContext = {
    mode: selectionMode,
    isSelected: (v) => value.includes(v),
    toggle: (v) => {
      if (selectionMode === 'single') onChange?.([v]);
      else onChange?.(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    },
    tabStop: values.find((v) => value.includes(v)) ?? values[0],
    size,
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (selectionMode !== 'single') return;
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    const radios = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)') ?? []);
    const i = radios.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const next = radios[(i + step + radios.length) % radios.length];
    next.focus();
    const v = next.dataset.chipValue;
    if (v) onChange?.([v]);
  };

  return (
    <ChipGroupContext.Provider value={ctx}>
      <div
        ref={ref}
        role={selectionMode === 'single' ? 'radiogroup' : 'group'}
        aria-label={label}
        onKeyDown={onKeyDown}
        className={cx(s.group, size === 'sm' ? s.groupSm : s.groupMd, className)}
        {...rest}
      >
        {children}
      </div>
    </ChipGroupContext.Provider>
  );
}
