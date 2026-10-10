import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import { Popover } from '../Popover/Popover';
import { Spinner } from '../Spinner/Spinner';
import { TextField } from '../TextField/TextField';
import s from './Combobox.module.css';

export type ComboboxOption = { value: string; label: string; description?: string };

export type ComboboxProps = WithForcedState & {
  label: string;
  /** Selected option value, or the free text when `allowCustom` is set. */
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  /** Keep typed text that matches no option (autocomplete). Otherwise the field reverts to the last selection. */
  allowCustom?: boolean;
  /** Show a spinner while suggestions are being fetched. */
  loading?: boolean;
  emptyMessage?: string;
  size?: Size;
  disabled?: boolean;
  invalid?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  /** Called on every keystroke, e.g. to fetch remote suggestions. */
  onInputChange?: (text: string) => void;
  className?: string;
};

/** Wraps the first case-insensitive match of `query` in `label` with an accent mark. */
function highlight(label: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return label;
  const at = label.toLowerCase().indexOf(q.toLowerCase());
  if (at < 0) return label;
  return (
    <>
      {label.slice(0, at)}
      <mark className={s.match}>{label.slice(at, at + q.length)}</mark>
      {label.slice(at + q.length)}
    </>
  );
}

type Row = { kind: 'option'; option: ComboboxOption } | { kind: 'custom'; text: string };

/** Text input with a filtered suggestion list (material search, printer serials, resin lot autocomplete). */
export function Combobox({
  label,
  value,
  onChange,
  options,
  allowCustom,
  loading,
  emptyMessage = 'No matches',
  size = 'sm',
  disabled,
  invalid,
  fullWidth,
  placeholder,
  onInputChange,
  className,
  'data-state': state,
}: ComboboxProps) {
  const id = useId();
  const listId = `${id}-list`;
  const rowId = (i: number) => `${id}-row-${i}`;
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? (allowCustom ? value : '');
  const [text, setText] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  /** True once the user has typed since opening; until then the full list is shown. */
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(-1);

  // Follow external value changes while the user is not editing.
  useEffect(() => {
    if (!open) setText(selectedLabel);
  }, [selectedLabel, open]);

  const query = typed ? text : '';
  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    const matches = q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : options;
    const out: Row[] = matches.map((option) => ({ kind: 'option', option }));
    if (allowCustom && q && !options.some((o) => o.label.toLowerCase() === q)) out.push({ kind: 'custom', text: query.trim() });
    return out;
  }, [options, query, allowCustom]);

  useEffect(() => {
    if (!open || active < 0) return;
    document.getElementById(`${id}-row-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, id]);

  const openList = (initial?: number) => {
    if (disabled || open) return;
    setTyped(false);
    const sel = options.findIndex((o) => o.value === value);
    setActive(initial ?? sel);
    setOpen(true);
  };

  const commit = (row: Row) => {
    const next = row.kind === 'option' ? row.option : { value: row.text, label: row.text };
    setText(next.label);
    setOpen(false);
    setTyped(false);
    if (next.value !== value) onChange(next.value);
  };

  /** Leaving the field: keep free text when allowed, otherwise snap back to the last selection. */
  const settle = useCallback(() => {
    setOpen(false);
    setTyped(false);
    if (!allowCustom) return setText(selectedLabel);
    const trimmed = text.trim();
    const exact = options.find((o) => o.label.toLowerCase() === trimmed.toLowerCase());
    const next = exact ? exact.value : trimmed;
    if (exact) setText(exact.label);
    if (next !== value) onChange(next);
  }, [allowCustom, selectedLabel, text, options, value, onChange]);

  // An outside click blurs the input right after; let the blur settle it so it only runs once.
  const onOutside = () => {
    if (document.activeElement !== inputRef.current) settle();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) return openList(Math.max(0, options.findIndex((o) => o.value === value)));
        setActive((a) => (rows.length ? (a + 1) % rows.length : -1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) return openList(rows.length - 1);
        setActive((a) => (rows.length ? (a <= 0 ? rows.length - 1 : a - 1) : -1));
        break;
      case 'Enter':
        if (!open) return;
        e.preventDefault();
        if (rows[active]) commit(rows[active]);
        else settle();
        break;
      case 'Escape':
        if (!open) {
          if (allowCustom && text) {
            setText('');
            onChange('');
          }
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        setTyped(false);
        setText(selectedLabel);
        break;
      case 'Tab':
        if (open) settle();
        break;
    }
  };

  const activeRow = open && rows[active] ? rowId(active) : undefined;

  const field = (
    <TextField
      ref={inputRef}
      label={label}
      value={text}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      invalid={invalid}
      fullWidth
      data-state={state}
      className={s.field}
      role="combobox"
      aria-expanded={open}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={activeRow}
      autoComplete="off"
      spellCheck={false}
      onChange={(t) => {
        setText(t);
        setTyped(true);
        setActive(t.trim() ? 0 : -1);
        if (!open && !disabled) setOpen(true);
        onInputChange?.(t);
      }}
      onClick={() => openList()}
      onKeyDown={onKeyDown}
      onBlur={() => open && settle()}
      iconEnd={loading ? <Spinner size="xs" tone="muted" label="Loading suggestions" /> : <ChevronDownIcon aria-hidden="true" className={cx(s.chevron, open && s.chevronOpen)} />}
    />
  );

  return (
    <div className={cx(s.root, fullWidth && s.fullWidth, className)}>
      <Popover open={open} onClose={onOutside} trigger={field} padded={false} className={s.anchor}>
        <ul id={listId} role="listbox" aria-label={label} className={s.list} aria-busy={loading || undefined}>
          {rows.map((row, i) => (
            <li
              key={row.kind === 'option' ? row.option.value : '__custom'}
              id={rowId(i)}
              role="option"
              aria-selected={i === active}
              className={cx(s.option, i === active && s.active, row.kind === 'option' && row.option.value === value && s.current)}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => commit(row)}
            >
              {row.kind === 'option' ? (
                <>
                  <span className={s.optionLabel}>{highlight(row.option.label, query)}</span>
                  {row.option.description && <span className={s.description}>{highlight(row.option.description, query)}</span>}
                </>
              ) : (
                <span className={s.optionLabel}>
                  Use “<span className={s.customText}>{row.text}</span>”
                </span>
              )}
            </li>
          ))}
        </ul>
        {loading && rows.length === 0 && (
          <p className={s.status} role="status">
            Searching…
          </p>
        )}
        {!loading && rows.length === 0 && (
          <p className={s.status} role="status">
            {emptyMessage}
          </p>
        )}
      </Popover>
    </div>
  );
}
