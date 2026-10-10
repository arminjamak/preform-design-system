import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './Tabs.module.css';

export type TabItem<T extends string> = { value: T; label: ReactNode; icon?: ReactNode; disabled?: boolean };

export type TabsProps<T extends string> = WithForcedState & {
  label: string;
  value: T;
  items: TabItem<T>[];
  onChange: (value: T) => void;
  /** `inverse` is the dark app navigation (PreForm / Dashboard). */
  variant?: 'default' | 'inverse';
  className?: string;
};

export function Tabs<T extends string>({ label, value, items, onChange, variant = 'default', className, 'data-state': state }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cx(s.list, s[variant], className)}>
      {items.map((item, i) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          disabled={item.disabled}
          data-state={i === 1 ? state : undefined}
          onClick={() => onChange(item.value)}
          className={s.tab}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
