import { useId, type HTMLAttributes } from 'react';
import { ClockIcon, MapPinIcon, MessageSquareIcon, UserRoundIcon, UsersIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { IconButton } from '../IconButton/IconButton';
import { AvatarWithPresence, PresenceIndicator, type PresenceStatus } from '../PresenceIndicator/PresenceIndicator';
import s from './ProfileCard.module.css';

export type ProfilePerson = {
  name: string;
  role: string;
  team?: string;
  location?: string;
  /** IANA zone, e.g. "Europe/Sarajevo"; used to show the person's local time. */
  timeZone?: string;
  avatar?: string;
};

export type ProfileStats = { prints: number; projects: number };

export type ProfileCardProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  person: ProfilePerson;
  status: PresenceStatus;
  /** Relative last activity, e.g. "5m ago". */
  lastActive?: string;
  stats?: ProfileStats;
  /** `vertical` is the full card; `horizontal` is the compact row for lists and hover cards. */
  layout?: 'vertical' | 'horizontal';
  /** Draw the card frame. Turn off when the card is the content of a HoverCard or Popover. */
  framed?: boolean;
  onMessage?: () => void;
  onViewProfile?: () => void;
  /** Override the computed local time (e.g. "9:41 AM"), handy for snapshots. */
  localTime?: string;
};

const formatLocalTime = (timeZone: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    }).format(new Date());
  } catch {
    return undefined;
  }
};

const zoneAbbrev = (timeZone: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value;
  } catch {
    return undefined;
  }
};

const fmt = new Intl.NumberFormat();

/** Teammate card: avatar with presence, role and team, location and local time, print stats and quick actions. */
export function ProfileCard({
  person,
  status,
  lastActive,
  stats,
  layout = 'vertical',
  framed = true,
  onMessage,
  onViewProfile,
  localTime,
  className,
  ...rest
}: ProfileCardProps) {
  const nameId = useId();
  const firstName = person.name.split(' ')[0];
  const time = localTime ?? (person.timeZone ? formatLocalTime(person.timeZone) : undefined);
  const zone = person.timeZone ? zoneAbbrev(person.timeZone) : undefined;
  const horizontal = layout === 'horizontal';

  const meta = (person.location || time) && (
    <p className={s.meta}>
      {person.location && (
        <span className={s.metaItem}>
          <MapPinIcon aria-hidden="true" strokeWidth={2.2} />
          {person.location}
        </span>
      )}
      {time && (
        <span className={s.metaItem}>
          <ClockIcon aria-hidden="true" strokeWidth={2.2} />
          <span>
            {time}
            {zone && ` ${zone}`} <span className={s.faint}>local</span>
          </span>
        </span>
      )}
    </p>
  );

  const statList = stats && (
    <dl className={s.stats}>
      <div className={s.stat}>
        <dt>Prints</dt>
        <dd>{fmt.format(stats.prints)}</dd>
      </div>
      <div className={s.stat}>
        <dt>Projects</dt>
        <dd>{fmt.format(stats.projects)}</dd>
      </div>
    </dl>
  );

  const actions =
    (onMessage || onViewProfile) &&
    (horizontal ? (
      <div className={s.iconActions}>
        {onMessage && (
          <IconButton label={`Message ${firstName}`} icon={<MessageSquareIcon strokeWidth={2.2} />} variant="outline" shape="circle" onClick={onMessage} />
        )}
        {onViewProfile && (
          <IconButton
            label={`View ${firstName}'s profile`}
            icon={<UserRoundIcon strokeWidth={2.2} />}
            variant="outline"
            shape="circle"
            onClick={onViewProfile}
          />
        )}
      </div>
    ) : (
      <div className={s.actions}>
        {onMessage && (
          <Button variant="primary" iconStart={<MessageSquareIcon strokeWidth={2.2} />} onClick={onMessage} aria-label={`Message ${firstName}`} fullWidth>
            Message
          </Button>
        )}
        {onViewProfile && (
          <Button variant="outline" onClick={onViewProfile} aria-label={`View ${firstName}'s profile`} fullWidth>
            View profile
          </Button>
        )}
      </div>
    ));

  return (
    <Card
      role="group"
      aria-labelledby={nameId}
      variant="outline"
      padding={framed ? 'md' : 'none'}
      className={cx(s.card, horizontal ? s.horizontal : s.vertical, !framed && s.frameless, className)}
      {...rest}
    >
      <AvatarWithPresence name={person.name} src={person.avatar} status={status} lastActive={lastActive} size={horizontal ? 'md' : 'lg'} decorative />
      <div className={s.body}>
        <div className={s.titleRow}>
          <span id={nameId} className={s.name}>
            {person.name}
          </span>
        </div>
        <span className={s.role}>
          {person.role}
          {person.team && (
            <span className={s.team}>
              <span aria-hidden="true">·</span>
              <UsersIcon aria-hidden="true" strokeWidth={2.2} />
              <span className={s.srOnly}>, team </span>
              {person.team}
            </span>
          )}
        </span>
        <PresenceIndicator status={status} lastActive={lastActive} size="sm" ring="none" showLabel className={s.presence} />
        {meta}
        {horizontal && stats && (
          <span className={s.inlineStats}>
            {fmt.format(stats.prints)} prints · {fmt.format(stats.projects)} projects
          </span>
        )}
      </div>
      {!horizontal && statList}
      {actions}
    </Card>
  );
}
