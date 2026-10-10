import { useCallback, useState, type ReactNode } from 'react';
import { MoreVerticalIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton, type IconButtonProps } from '../IconButton/IconButton';
import { Popover } from '../Popover/Popover';
import s from './Menu.module.css';

export type MenuItem =
  | { type: 'separator' }
  | {
      label: string;
      onSelect: () => void;
      icon?: ReactNode;
      shortcut?: string;
      disabled?: boolean;
      danger?: boolean;
      selected?: boolean;
    };

export type MenuListProps = { items: MenuItem[]; onSelect?: () => void; className?: string };

/** Just the list; use inside a Popover or any surface. */
export function MenuList({ items, onSelect, className }: MenuListProps) {
  return (
    <ul role="menu" className={cx(s.list, className)}>
      {items.map((item, i) =>
        'type' in item ? (
          <li key={`sep-${i}`} role="separator" className={s.separator} />
        ) : (
          <li key={item.label} role="none">
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              aria-checked={item.selected}
              onClick={() => {
                item.onSelect();
                onSelect?.();
              }}
              className={cx(s.item, item.danger && s.danger, item.selected && s.selected)}
            >
              {item.icon}
              {item.label}
              {item.shortcut && <span className={s.shortcut}>{item.shortcut}</span>}
            </button>
          </li>
        ),
      )}
    </ul>
  );
}

export type MenuProps = {
  label: string;
  items: MenuItem[];
  icon?: ReactNode;
  placement?: 'top' | 'bottom';
  align?: 'start' | 'end';
  buttonVariant?: IconButtonProps['variant'];
  buttonSize?: IconButtonProps['size'];
  className?: string;
};

/** Icon button that opens a menu (the ⋮ actions menu on history rows and model rows). */
export function Menu({ label, items, icon, placement = 'bottom', align = 'end', buttonVariant = 'ghost', buttonSize = 'sm', className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <Popover
      open={open}
      onClose={close}
      placement={placement}
      align={align}
      padded={false}
      className={className}
      trigger={
        <IconButton
          label={label}
          icon={icon ?? <MoreVerticalIcon strokeWidth={2.4} />}
          variant={buttonVariant}
          size={buttonSize}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        />
      }
    >
      <MenuList items={items} onSelect={close} />
    </Popover>
  );
}
