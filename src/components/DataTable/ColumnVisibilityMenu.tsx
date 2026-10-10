import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Columns3Icon } from 'lucide-react';
import type { WithForcedState } from '../../lib/types';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { Popover } from '../Popover/Popover';
import s from './DataTable.module.css';

export type ColumnVisibilityItem = { id: string; header: string; hideable?: boolean };

export type ColumnVisibilityMenuProps = WithForcedState & {
  /** All columns; only those with `hideable !== false` get a checkbox. */
  columns: ColumnVisibilityItem[];
  /** Ids of the currently hidden columns. */
  hidden: string[];
  onChange: (hidden: string[]) => void;
  /** Trigger text. */
  label?: string;
  align?: 'start' | 'end';
  className?: string;
};

/** "Columns" button with a popover of checkboxes for every hideable column. The last visible column cannot be hidden. */
export function ColumnVisibilityMenu({ columns, hidden, onChange, label = 'Columns', align = 'end', className, 'data-state': state }: ColumnVisibilityMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);
  const headingId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const hideable = columns.filter((c) => c.hideable !== false);
  const visibleCount = columns.filter((c) => !hidden.includes(c.id)).length;
  const hiddenCount = hideable.filter((c) => hidden.includes(c.id)).length;

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>('[role="checkbox"]:not(:disabled)')?.focus();
  }, [open]);

  const toggle = (id: string, show: boolean) => onChange(show ? hidden.filter((h) => h !== id) : [...hidden, id]);

  return (
    <Popover
      open={open}
      onClose={close}
      align={align}
      padded={false}
      className={className}
      trigger={
        <Button
          ref={triggerRef}
          variant="outline"
          size="sm"
          iconStart={<Columns3Icon strokeWidth={2.2} />}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          data-state={state}
        >
          {label}
          {hiddenCount > 0 && <span className={s.columnsCount}>{` · ${hiddenCount} hidden`}</span>}
        </Button>
      }
    >
      <div ref={panelRef} role="dialog" aria-labelledby={headingId} className={s.columnsPanel}>
        <p id={headingId} className={s.filterHeading}>
          Show columns
        </p>
        <div role="group" aria-labelledby={headingId} className={s.columnsList}>
          {hideable.map((c) => {
            const visible = !hidden.includes(c.id);
            return (
              <Checkbox
                key={c.id}
                label={c.header}
                showLabel
                checked={visible}
                disabled={visible && visibleCount <= 1}
                onChange={(next) => toggle(c.id, next)}
                className={s.columnsItem}
              />
            );
          })}
        </div>
        <div className={s.filterFooter}>
          <Button variant="link" size="sm" disabled={hiddenCount === 0} onClick={() => onChange(hidden.filter((h) => !hideable.some((c) => c.id === h)))}>
            Show all
          </Button>
        </div>
      </div>
    </Popover>
  );
}
