import type { ReactNode } from 'react';
import type { ForcedState } from '../../lib/types';

const STATES: Array<{ key: string; state?: ForcedState; disabled?: boolean }> = [
  { key: 'Default' },
  { key: 'Hover', state: 'hover' },
  { key: 'Focus', state: 'focus' },
  { key: 'Active', state: 'active' },
  { key: 'Disabled', disabled: true },
];

type Props = {
  /** Render the component for a forced state. */
  render: (props: { 'data-state'?: ForcedState; disabled?: boolean }) => ReactNode;
  /** Row labels; each row is rendered across all states. */
  rows?: Array<{ label: string; render: (props: { 'data-state'?: ForcedState; disabled?: boolean }) => ReactNode }>;
};

/** Grid of every interaction state, driven by the `data-state` hook every component exposes. */
export function StateMatrix({ render, rows }: Props) {
  const list = rows ?? [{ label: '', render }];
  return (
    <table className="sb-matrix">
      <thead>
        <tr>
          {rows && <th />}
          {STATES.map((s) => (
            <th key={s.key} className="pf-text-caption">
              {s.key}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {list.map((row) => (
          <tr key={row.label}>
            {rows && <th className="pf-text-caption">{row.label}</th>}
            {STATES.map((s) => (
              <td key={s.key}>{row.render({ 'data-state': s.state, disabled: s.disabled })}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
