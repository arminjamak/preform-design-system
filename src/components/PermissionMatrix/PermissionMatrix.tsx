import { useMemo, type HTMLAttributes, type KeyboardEvent } from 'react';
import { CheckIcon, LockIcon, MinusIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Badge } from '../Badge/Badge';
import { Checkbox } from '../Checkbox/Checkbox';
import { Tooltip } from '../Tooltip/Tooltip';
import s from './PermissionMatrix.module.css';

export type PermissionRole = { id: string; label: string; description?: string };
export type Permission = { id: string; label: string; description?: string };
export type PermissionGroup = { id: string; label: string; permissions: Permission[] };
/** roleId → permission ids granted to that role. */
export type PermissionValue = Record<string, string[]>;
/** roleId → permissionId → reason the cell is locked (inherited or enforced). */
export type PermissionLocks = Record<string, Record<string, string>>;

export type PermissionMatrixProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> &
  WithForcedState & {
    roles: PermissionRole[];
    groups: PermissionGroup[];
    value: PermissionValue;
    onChange?: (value: PermissionValue) => void;
    /** Cells that cannot be changed; the reason shows in a tooltip on the lock icon. */
    locked?: PermissionLocks;
    /** Last saved state. Cells that differ from it are highlighted as unsaved. */
    savedValue?: PermissionValue;
    /** Render grants as static marks; no editing. */
    readOnly?: boolean;
    /** Visible title above the grid and the table's accessible name. */
    label?: string;
    /** Hide the per-role "select all" checkboxes in the header. */
    hideSelectAll?: boolean;
  };

const has = (v: PermissionValue | undefined, role: string, perm: string) => !!v?.[role]?.includes(perm);

/** Roles × permissions grid for workspace access control: Owner/Admin/Operator/Viewer across Printers, Materials, Print queue and Billing. */
export function PermissionMatrix({
  roles,
  groups,
  value,
  onChange,
  locked,
  savedValue,
  readOnly,
  label = 'Role permissions',
  hideSelectAll,
  className,
  'data-state': forcedState,
  ...rest
}: PermissionMatrixProps) {
  const allPerms = useMemo(() => groups.flatMap((g) => g.permissions), [groups]);
  const lockReason = (role: string, perm: string) => locked?.[role]?.[perm];

  const changes = useMemo(() => {
    if (!savedValue) return 0;
    let n = 0;
    for (const r of roles) for (const p of allPerms) if (has(value, r.id, p.id) !== has(savedValue, r.id, p.id)) n++;
    return n;
  }, [roles, allPerms, value, savedValue]);

  const setCell = (role: string, perm: string, on: boolean) => {
    const cur = value[role] ?? [];
    const next = on ? [...cur.filter((x) => x !== perm), perm] : cur.filter((x) => x !== perm);
    onChange?.({ ...value, [role]: next });
  };

  const setColumn = (role: string, on: boolean) => {
    const editable = allPerms.filter((p) => !lockReason(role, p.id)).map((p) => p.id);
    const cur = value[role] ?? [];
    const kept = cur.filter((x) => !editable.includes(x));
    onChange?.({ ...value, [role]: on ? [...kept, ...editable] : kept });
  };

  /** Arrow keys move focus between cells like a spreadsheet. */
  const onKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    const deltas: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const d = deltas[e.key];
    if (!d) return;
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-pm-cell]');
    if (!cell) return;
    const [r, c] = cell.dataset.pmCell!.split(':').map(Number);
    const nr = r + d[0];
    const nc = c + d[1];
    const target = e.currentTarget.querySelector<HTMLElement>(`[data-pm-cell="${nr}:${nc}"]`);
    const focusable = target?.querySelector<HTMLElement>('button:not(:disabled)');
    if (focusable) {
      e.preventDefault();
      focusable.focus();
    }
  };

  /** The first editable cell receives the forced interaction state (sandbox only). */
  const forcedCell = (() => {
    if (!forcedState) return null;
    for (const [r, p] of allPerms.entries()) for (const [c, role] of roles.entries()) if (!lockReason(role.id, p.id)) return `${r}:${c}`;
    return null;
  })();

  let rowIndex = -1;

  return (
    <div className={cx(s.root, readOnly && s.readOnly, className)} {...rest}>
      <div className={s.toolbar}>
        <span className={s.title}>{label}</span>
        {readOnly && (
          <Badge tone="neutral" icon={<LockIcon />}>
            Read only
          </Badge>
        )}
        {changes > 0 && !readOnly && (
          <span className={cx(s.status, s.toneWarning)} role="status">
            <span className={s.statusDot} aria-hidden="true" />
            {changes} unsaved {changes === 1 ? 'change' : 'changes'}
          </span>
        )}
      </div>
      <div className={s.scroller}>
        <table className={s.table} aria-label={label} onKeyDown={onKeyDown}>
          <thead>
            <tr>
              <th scope="col" className={cx(s.headCell, s.corner)}>
                Permission
              </th>
              {roles.map((role) => {
                const editable = allPerms.filter((p) => !lockReason(role.id, p.id));
                const onCount = editable.filter((p) => has(value, role.id, p.id)).length;
                // A fully locked column still reports its real state (e.g. Owner: everything granted).
                const all = editable.length > 0 ? onCount === editable.length : allPerms.every((p) => has(value, role.id, p.id));
                const some = onCount > 0 && !all;
                return (
                  <th key={role.id} scope="col" className={cx(s.headCell, s.roleHead)} title={role.description}>
                    <span className={s.roleLabel}>{role.label}</span>
                    {!hideSelectAll && !readOnly && (
                      <Checkbox
                        label={`Grant every editable permission to ${role.label}`}
                        checked={all}
                        indeterminate={some}
                        disabled={editable.length === 0}
                        onChange={() => setColumn(role.id, !all)}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.id}>
              <tr className={s.groupRow}>
                <th scope="rowgroup" className={cx(s.groupHead, s.sticky)}>
                  {group.label}
                </th>
                <td colSpan={roles.length} className={s.groupFill} />
              </tr>
              {group.permissions.map((perm) => {
                rowIndex += 1;
                const r = rowIndex;
                return (
                  <tr key={perm.id} className={s.row}>
                    <th scope="row" className={cx(s.rowHead, s.sticky)}>
                      <span className={s.permLabel}>{perm.label}</span>
                      {perm.description && <span className={s.permDescription}>{perm.description}</span>}
                    </th>
                    {roles.map((role, c) => {
                      const on = has(value, role.id, perm.id);
                      const reason = lockReason(role.id, perm.id);
                      const changed = !!savedValue && on !== has(savedValue, role.id, perm.id);
                      const name = `${role.label}: ${perm.label}${changed ? ' (unsaved change)' : ''}`;
                      return (
                        <td key={role.id} data-pm-cell={`${r}:${c}`} className={cx(s.cell, changed && s.changed, reason && s.lockedCell)}>
                          {readOnly ? (
                            <span role="checkbox" aria-checked={on} aria-readonly="true" aria-label={name} className={cx(s.mark, on && s.markOn)}>
                              {on ? <CheckIcon strokeWidth={3} /> : <MinusIcon strokeWidth={2} />}
                            </span>
                          ) : (
                            <span className={s.cellInner}>
                              <Checkbox
                                label={name}
                                checked={on}
                                disabled={!!reason}
                                onChange={(v) => setCell(role.id, perm.id, v)}
                                data-state={forcedCell === `${r}:${c}` ? forcedState : undefined}
                              />
                              {reason && (
                                <Tooltip content={reason} className={s.lockTip}>
                                  <button type="button" className={s.lock} aria-label={`${role.label}: ${perm.label} is locked. ${reason}`}>
                                    <LockIcon strokeWidth={2.2} />
                                  </button>
                                </Tooltip>
                              )}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
