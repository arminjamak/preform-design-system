import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { Avatar, type AvatarProps } from '../Avatar/Avatar';
import { Tooltip } from '../Tooltip/Tooltip';
import s from './AvatarGroup.module.css';

export type AvatarGroupPerson = {
  name: string;
  src?: string;
  tone?: AvatarProps['tone'];
};

export type AvatarGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  people: AvatarGroupPerson[];
  /** Avatars shown before the "+N" overflow chip. The chip replaces the last slot. */
  max?: number;
  size?: NonNullable<AvatarProps['size']>;
  /** Accessible name for the group; defaults to "N collaborators". */
  label?: string;
};

/** Overlapping avatars with a surface-coloured ring: who is viewing or editing a print job. */
export function AvatarGroup({ people, max = 4, size = 'sm', label, className, ...rest }: AvatarGroupProps) {
  const limit = Math.max(1, max);
  const overflowing = people.length > limit;
  const visible = overflowing ? people.slice(0, limit - 1) : people;
  const hidden = overflowing ? people.slice(limit - 1) : [];
  const groupLabel = label ?? `${people.length} collaborator${people.length === 1 ? '' : 's'}`;
  return (
    <div role="group" aria-label={groupLabel} className={cx(s.group, s[size], className)} {...rest}>
      {visible.map((p, i) => (
        <span key={`${p.name}-${i}`} className={s.slot}>
          <Avatar name={p.name} src={p.src} tone={p.tone} size={size} />
        </span>
      ))}
      {hidden.length > 0 && (
        <span className={s.slot}>
          <Tooltip
            placement="top"
            content={
              <ul className={s.names}>
                {hidden.map((p, i) => (
                  <li key={`${p.name}-${i}`}>{p.name}</li>
                ))}
              </ul>
            }
          >
            <span tabIndex={0} role="img" aria-label={`${hidden.length} more: ${hidden.map((p) => p.name).join(', ')}`} className={s.overflow}>
              +{hidden.length}
            </span>
          </Tooltip>
        </span>
      )}
    </div>
  );
}
