import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './KeyValueList.module.css';

export type KeyValueRow = { key: string; value: ReactNode; icon?: ReactNode; indent?: boolean };

export type KeyValueListProps = {
  rows: KeyValueRow[];
  size?: 'sm' | 'md';
  divided?: boolean;
  className?: string;
};

/** Label/value rows: job settings, summary volumes and costs. */
export function KeyValueList({ rows, size = 'sm', divided, className }: KeyValueListProps) {
  return (
    <dl className={cx(s.list, s[size], divided && s.divided, className)}>
      {rows.map((r) => (
        <div key={r.key} className={cx(s.row, r.indent && s.indent)}>
          <dt className={s.key}>
            {r.icon}
            {r.key}
          </dt>
          <dd className={s.value}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
