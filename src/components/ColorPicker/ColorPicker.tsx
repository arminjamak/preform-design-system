import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { CheckIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import { Popover } from '../Popover/Popover';
import { TextField } from '../TextField/TextField';
import s from './ColorPicker.module.css';

export type ColorPreset = {
  label: string;
  /** CSS custom property the swatch renders from, e.g. `--color-accent-tone-blue`. */
  token: `--${string}`;
};

export const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  { label: 'Blue', token: '--color-accent-tone-blue' },
  { label: 'Green', token: '--color-accent-tone-green' },
  { label: 'Amber', token: '--color-accent-tone-amber' },
  { label: 'Red', token: '--color-accent-tone-red' },
  { label: 'Orange', token: '--color-accent-tone-orange' },
  { label: 'Magenta', token: '--color-accent-tone-magenta' },
];

export type ColorPickerProps = WithForcedState & {
  /** Hex colour, `#rrggbb`. This is user data, so it is stored as a literal. */
  value: string;
  onChange: (hex: string) => void;
  presets?: ColorPreset[];
  label: string;
  size?: Size;
  disabled?: boolean;
  className?: string;
};

/** Normalises `abc`, `#abc`, `aabbcc` or `#AABBCC` to `#aabbcc`; returns null when it is not a hex colour. */
function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(raw)) return `#${raw.split('').map((c) => c + c).join('')}`;
  if (/^[0-9a-f]{6}$/.test(raw)) return `#${raw}`;
  return null;
}

/** Reads an element's computed background colour back as `#rrggbb`, so token presets resolve per theme. */
function computedHex(el: Element | null): string | null {
  if (!el) return null;
  const parts = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return null;
  return `#${parts
    .slice(0, 3)
    .map((n) => Math.round(Number(n)).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Swatch trigger with token presets, a hex field and the native colour picker (support categories, label colours). */
export function ColorPicker({ value, onChange, presets = DEFAULT_COLOR_PRESETS, label, size = 'sm', disabled, className, 'data-state': state }: ColorPickerProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const swatchRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [resolved, setResolved] = useState<Array<string | null>>([]);
  const hex = normalizeHex(value);
  const [draft, setDraft] = useState((hex ?? value).replace(/^#/, ''));

  useEffect(() => {
    setDraft((hex ?? value).replace(/^#/, ''));
  }, [hex, value]);

  // On open: resolve each token preset to hex (to know which is selected in this theme) and focus the checked one.
  // Later selection changes keep focus where the user put it, so `hex` is deliberately not a dependency.
  useLayoutEffect(() => {
    if (!open) return;
    const r = presets.map((_, i) => computedHex(swatchRefs.current[i]));
    setResolved(r);
    swatchRefs.current[Math.max(0, hex ? r.indexOf(hex) : -1)]?.focus();
  }, [open, presets]);

  const checked = hex ? resolved.findIndex((r) => r === hex) : -1;
  const isCustom = !!hex && resolved.length > 0 && checked < 0;

  const close = useCallback(() => setOpen(false), []);

  const pick = (i: number) => {
    const next = computedHex(swatchRefs.current[i]);
    if (next && next !== hex) onChange(next);
  };

  const onRadioKey = (e: KeyboardEvent, i: number) => {
    const n = presets.length;
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    swatchRefs.current[next]?.focus();
    pick(next);
  };

  const onPanelKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    triggerRef.current?.focus();
  };

  const swatchStyle = (c: string) => ({ '--swatch': c }) as CSSProperties;
  const draftValid = normalizeHex(draft) !== null;

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      className={cx(s.trigger, s[size])}
      disabled={disabled}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={`${label}: ${hex ?? 'no colour'}`}
      data-state={state}
      onClick={() => setOpen((o) => !o)}
    >
      <span className={cx(s.swatch, s.triggerSwatch, !hex && s.empty)} style={hex ? swatchStyle(hex) : undefined} aria-hidden="true" />
      <span className={s.hex}>{hex ? hex.toUpperCase() : '—'}</span>
      <svg viewBox="0 0 8 5" className={s.caret} fill="currentColor" aria-hidden="true">
        <path d="M0 0 H8 L4 5 Z" />
      </svg>
    </button>
  );

  return (
    <Popover open={open} onClose={close} trigger={trigger} className={cx(s.root, className)}>
      <div role="dialog" aria-label={label} className={s.panel} onKeyDown={onPanelKey}>
        <span className={s.heading} id={`${id}-presets`}>
          Presets
        </span>
        <div className={s.swatches}>
          <div role="radiogroup" aria-labelledby={`${id}-presets`} className={s.group}>
            {presets.map((p, i) => {
              const on = i === checked;
              return (
                <button
                  key={p.token}
                  ref={(el) => {
                    swatchRefs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={p.label}
                  title={p.label}
                  tabIndex={on || (checked < 0 && i === 0) ? 0 : -1}
                  className={cx(s.swatch, s.preset, on && s.selected)}
                  style={swatchStyle(`var(${p.token})`)}
                  onClick={() => {
                    pick(i);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  onKeyDown={(e) => onRadioKey(e, i)}
                >
                  {on && <CheckIcon className={s.check} strokeWidth={3} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <label className={cx(s.swatch, s.preset, s.custom, isCustom && s.selected)} title="Custom colour">
            <input type="color" className={s.native} value={hex ?? ''} aria-label="Custom colour" onChange={(e) => onChange(e.target.value.toLowerCase())} />
            {isCustom && <span className={s.customFill} style={swatchStyle(hex)} aria-hidden="true" />}
          </label>
          <span className={s.customLabel} aria-hidden="true">
            Custom
          </span>
        </div>
        <TextField
          label={`${label} hex value`}
          value={draft}
          onChange={(t) => {
            const clean = t.replace(/^#/, '').slice(0, 6);
            setDraft(clean);
            const next = normalizeHex(clean);
            if (next && clean.length === 6 && next !== hex) onChange(next);
          }}
          onBlur={() => {
            const next = normalizeHex(draft);
            if (next && next !== hex) onChange(next);
            else if (!next) setDraft((hex ?? '').replace(/^#/, ''));
          }}
          invalid={!draftValid}
          fullWidth
          spellCheck={false}
          autoComplete="off"
          maxLength={7}
          iconStart={<span className={s.hash}>#</span>}
          className={s.hexField}
        />
      </div>
    </Popover>
  );
}
