import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import { Popover } from '../Popover/Popover';
import { TextField } from '../TextField/TextField';
import s from './MultiSelect.module.css';

export type MultiSelectOption = { value: string; label: string; disabled?: boolean };

export type MultiSelectProps = WithForcedState & {
  label: string;
  value: string[];
  options: MultiSelectOption[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  /** Show a filter field at the top of the list. */
  searchable?: boolean;
  /** Past this many selections the chips collapse into "N selected". */
  collapseAfter?: number;
  size?: Size;
  disabled?: boolean;
  invalid?: boolean;
  fullWidth?: boolean;
  className?: string;
};

/** Select-styled trigger with removable chips and a checkbox listbox (materials, printers, support categories). */
export function MultiSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  searchable,
  collapseAfter = 2,
  size = 'sm',
  disabled,
  invalid,
  fullWidth,
  className,
  'data-state': state,
}: MultiSelectProps) {
  const id = useId();
  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);

  const selected = useMemo(() => new Set(value), [value]);
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  const selectedOptions = value.map((v) => byValue.get(v)).filter((o): o is MultiSelectOption => !!o);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);
  const enabledFiltered = filtered.filter((o) => !o.disabled);
  const allFilteredSelected = enabledFiltered.length > 0 && enabledFiltered.every((o) => selected.has(o.value));

  const close = useCallback(() => setOpen(false), []);

  const openList = () => {
    if (disabled) return;
    const first = options.findIndex((o) => !o.disabled && selected.has(o.value));
    setActive(first >= 0 ? first : options.findIndex((o) => !o.disabled));
    setOpen(true);
  };

  // Reset the filter when the list closes, so it reopens on the full list with the first selection active.
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // Move focus into the list once it has rendered.
  useEffect(() => {
    if (!open) return;
    (searchable ? searchRef.current : listRef.current)?.focus();
  }, [open, searchable]);

  // Keep the active option in view while arrowing through a long list.
  useEffect(() => {
    if (!open || active < 0) return;
    document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, id]);

  // Typing in the filter re-targets the first enabled match.
  useEffect(() => {
    setActive(filtered.findIndex((o) => !o.disabled));
  }, [filtered]);

  const toggle = (o: MultiSelectOption) => {
    if (o.disabled) return;
    onChange(selected.has(o.value) ? value.filter((v) => v !== o.value) : [...value, o.value]);
  };

  const selectAll = () => {
    const add = enabledFiltered.map((o) => o.value).filter((v) => !selected.has(v));
    onChange([...value, ...add]);
  };
  // Clear keeps any locked (disabled) selections, since the user cannot change those.
  const clear = () => onChange(value.filter((v) => byValue.get(v)?.disabled));

  const move = (from: number, dir: 1 | -1) => {
    if (enabledFiltered.length === 0) return -1;
    let i = from;
    for (let n = 0; n < filtered.length; n++) {
      i = (i + dir + filtered.length) % filtered.length;
      if (!filtered[i].disabled) return i;
    }
    return from;
  };

  const onListKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    // Arrow/Enter/Space drive the list only from the filter or the list itself, not from Select all / Clear.
    if (e.target !== searchRef.current && e.target !== listRef.current) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((a) => move(a, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((a) => move(a < 0 ? 0 : a, -1));
        break;
      case 'Home':
        if (searchable) break;
        e.preventDefault();
        setActive(move(filtered.length - 1, 1));
        break;
      case 'End':
        if (searchable) break;
        e.preventDefault();
        setActive(move(0, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[active]) toggle(filtered[active]);
        break;
      case ' ':
        if (searchable) break; // Space types into the filter.
        e.preventDefault();
        if (filtered[active]) toggle(filtered[active]);
        break;
    }
  };

  const onTriggerKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !open) {
      e.preventDefault();
      openList();
    }
  };

  const onFieldClick = () => (open ? setOpen(false) : openList());

  const removeChip = (e: MouseEvent, v: string) => {
    e.stopPropagation();
    onChange(value.filter((x) => x !== v));
    triggerRef.current?.focus();
  };

  const collapsed = selectedOptions.length > collapseAfter;
  const summary = selectedOptions.length === 0 ? placeholder : selectedOptions.map((o) => o.label).join(', ');

  const field = (
    <div
      className={cx(s.field, s[size], invalid && s.invalid, disabled && s.disabled)}
      data-state={state}
      onClick={onFieldClick}
      onMouseDown={(e) => {
        // Clicking the bare field (not a button) must not steal focus from the open list.
        if (!(e.target as Element).closest('button')) e.preventDefault();
      }}
    >
      {!collapsed &&
        selectedOptions.map((o) => (
          <span key={o.value} className={s.chip}>
            <span className={s.chipLabel}>{o.label}</span>
            {!o.disabled && (
              <button
                type="button"
                className={s.chipRemove}
                aria-label={`Remove ${o.label}`}
                title={`Remove ${o.label}`}
                disabled={disabled}
                onClick={(e) => removeChip(e, o.value)}
              >
                <XIcon strokeWidth={2.5} aria-hidden="true" />
              </button>
            )}
          </span>
        ))}
      <button
        ref={triggerRef}
        type="button"
        className={s.trigger}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${summary}`}
        aria-invalid={invalid || undefined}
        onKeyDown={onTriggerKeyDown}
      >
        {collapsed ? (
          <span className={s.count}>{selectedOptions.length} selected</span>
        ) : selectedOptions.length === 0 ? (
          <span className={s.placeholder}>{placeholder}</span>
        ) : null}
      </button>
      <svg viewBox="0 0 8 5" className={s.caret} fill="currentColor" aria-hidden="true">
        <path d="M0 0 H8 L4 5 Z" />
      </svg>
    </div>
  );

  return (
    <div
      className={cx(s.root, fullWidth && s.fullWidth, className)}
      onBlur={(e) => {
        // Close once focus leaves the whole control (trigger, chips and list).
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Popover open={open} onClose={close} trigger={field} padded={false} className={s.anchor}>
        <div className={s.panel} onKeyDown={onListKeyDown}>
          {searchable && (
            <div className={s.search}>
              <TextField
                ref={searchRef}
                label={`Filter ${label.toLowerCase()}`}
                placeholder="Search…"
                value={query}
                onChange={setQuery}
                fullWidth
                iconStart={<SearchIcon aria-hidden="true" />}
                role="combobox"
                aria-expanded
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={filtered[active] ? optId(active) : undefined}
              />
            </div>
          )}
          <div className={s.actions}>
            <span className={s.tally}>
              {selectedOptions.length} of {options.length}
            </span>
            <button type="button" className={s.action} onClick={selectAll} disabled={allFilteredSelected}>
              Select all
            </button>
            <button type="button" className={s.action} onClick={clear} disabled={value.length === 0}>
              Clear
            </button>
          </div>
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            aria-label={label}
            tabIndex={searchable ? -1 : 0}
            aria-activedescendant={!searchable && filtered[active] ? optId(active) : undefined}
            className={s.list}
          >
            {filtered.map((o, i) => {
              const isSel = selected.has(o.value);
              return (
                <li
                  key={o.value}
                  id={optId(i)}
                  role="option"
                  aria-selected={isSel}
                  aria-disabled={o.disabled || undefined}
                  className={cx(s.option, i === active && s.active, o.disabled && s.optionDisabled)}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => !o.disabled && setActive(i)}
                  onClick={() => toggle(o)}
                >
                  <span className={cx(s.box, isSel && s.boxChecked)} aria-hidden="true">
                    {isSel && (
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 6.3 L5 8.6 L9.5 3.6" />
                      </svg>
                    )}
                  </span>
                  <span className={s.optionLabel}>{o.label}</span>
                </li>
              );
            })}
          </ul>
          {filtered.length === 0 && (
            <p className={s.empty} role="status">
              No matches for “{query}”
            </p>
          )}
        </div>
      </Popover>
    </div>
  );
}
