import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { Avatar, type AvatarProps } from '../Avatar/Avatar';
import s from './PresenceIndicator.module.css';

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

/** Human-readable status names, used for screen-reader text and visible labels. */
export const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
  offline: 'Offline',
};

/** "Away, active 5m ago" — the sentence announced for a status. */
export function presenceText(status: PresenceStatus, lastActive?: string) {
  return lastActive ? `${PRESENCE_LABELS[status]}, active ${lastActive}` : PRESENCE_LABELS[status];
}

const RING: Record<NonNullable<PresenceIndicatorProps['ring']>, string | undefined> = {
  surface: s.ringSurface,
  panel: s.ringPanel,
  inverse: s.ringInverse,
  none: undefined,
};

export type PresenceIndicatorProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  status: PresenceStatus;
  /** Dot diameter: sm 8, md 10, lg 12. */
  size?: 'sm' | 'md' | 'lg';
  /** Colour of the separating ring; match the surface the dot sits on. `none` drops the ring. */
  ring?: 'surface' | 'panel' | 'inverse' | 'none';
  /** Relative time of last activity, e.g. "5m ago". Shown when `showLabel`, always announced. */
  lastActive?: string;
  /** Render the status name (and last activity) as visible text next to the dot. */
  showLabel?: boolean;
  /** Override the accessible label (defaults to the status name plus last activity). */
  label?: string;
  /** Hide from assistive tech when adjacent text already states the status. */
  decorative?: boolean;
};

/**
 * Status dot driven by the status tokens. Shape varies with status too (busy has a bar,
 * offline is hollow) so presence never relies on colour alone.
 */
export function PresenceIndicator({
  status,
  size = 'md',
  ring = 'surface',
  lastActive,
  showLabel,
  label,
  decorative,
  className,
  ...rest
}: PresenceIndicatorProps) {
  const text = label ?? presenceText(status, lastActive);
  if (decorative && !showLabel) {
    return (
      <span aria-hidden="true" className={cx(s.standalone, className)} {...rest}>
        <span className={cx(s.dot, s[status], s[size], ring !== 'none' && s.ringed, RING[ring])} />
      </span>
    );
  }
  const dot = <span className={cx(s.dot, s[status], s[size], ring !== 'none' && s.ringed, RING[ring])} aria-hidden={showLabel || undefined} />;
  if (!showLabel) {
    return (
      <span role="img" aria-label={text} title={text} className={cx(s.standalone, className)} {...rest}>
        {dot}
      </span>
    );
  }
  return (
    <span className={cx(s.withLabel, className)} {...rest}>
      {dot}
      <span className={s.label}>
        {label ?? PRESENCE_LABELS[status]}
        {!label && lastActive && <span className={s.lastActive}> · Active {lastActive}</span>}
      </span>
    </span>
  );
}

export type AvatarWithPresenceProps = Pick<AvatarProps, 'name' | 'src' | 'tone'> & {
  status: PresenceStatus;
  size?: AvatarProps['size'];
  /** Surface behind the avatar, used for the dot's ring. */
  ring?: PresenceIndicatorProps['ring'];
  lastActive?: string;
  /** Hide from assistive tech when the name and status are already written out nearby. */
  decorative?: boolean;
  className?: string;
};

const DOT_SIZE: Record<NonNullable<AvatarProps['size']>, NonNullable<PresenceIndicatorProps['size']>> = { xs: 'sm', sm: 'sm', md: 'md', lg: 'lg' };

/** Avatar with the presence dot overlaid on its bottom-right edge. Announced as "Name, Online". */
export function AvatarWithPresence({ name, src, tone, status, size = 'sm', ring = 'surface', lastActive, decorative, className }: AvatarWithPresenceProps) {
  const text = `${name}, ${presenceText(status, lastActive)}`;
  const a11y = decorative ? { 'aria-hidden': true as const } : { role: 'img', 'aria-label': text };
  return (
    <span {...a11y} title={text} className={cx(s.avatarWrap, className)}>
      <Avatar name={name} src={src} tone={tone} size={size} />
      <span className={s.overlay} aria-hidden="true">
        <span className={cx(s.dot, s[status], s[DOT_SIZE[size]], ring !== 'none' && s.ringed, RING[ring])} />
      </span>
    </span>
  );
}
