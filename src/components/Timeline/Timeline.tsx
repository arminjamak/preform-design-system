import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Badge/Badge';
import s from './Timeline.module.css';

export type TimelineTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export type TimelineItem = {
  id: string;
  /** Headline. In the feed variant, put the actor in <strong>: "<strong>Armin</strong> generated supports on Mini Chassis Kit". */
  title: ReactNode;
  description?: ReactNode;
  /** Display time: "14:32", "Oct 9", "2m ago". */
  timestamp?: string;
  /** Machine-readable time for the <time> element. */
  dateTime?: string;
  /** Icon inside the marker. Without it the marker is a small dot, as in the history list. */
  icon?: ReactNode;
  /** Marker colour. */
  tone?: TimelineTone;
  /** Feed variant: the actor. Replaces the dot/icon marker. */
  avatar?: { name: string; src?: string };
  /** Trailing controls, e.g. a ⋮ Menu with "Restore to this step…". */
  actions?: ReactNode;
  /** Highlights the row and adds the "Current" badge. */
  current?: boolean;
};

export type TimelineProps = Omit<HTMLAttributes<HTMLOListElement>, 'children'> & {
  items: TimelineItem[];
  /** `timeline`: timestamps in a left column. `feed`: avatar markers and inline "· 2m ago". */
  variant?: 'timeline' | 'feed';
  /** Text of the badge on the current item. */
  currentLabel?: string;
};

/** Vertical history: model edit history, print-job events and the collaboration activity feed. */
export function Timeline({ items, variant = 'timeline', currentLabel = 'Current', className, ...rest }: TimelineProps) {
  return (
    <ol className={cx(s.timeline, s[variant], className)} {...rest}>
      {items.map((item) => {
        const time = item.timestamp ? (
          <time className={s.time} dateTime={item.dateTime}>
            {item.timestamp}
          </time>
        ) : null;
        const marker =
          variant === 'feed' && item.avatar ? (
            <span className={s.avatarMarker}>
              <Avatar name={item.avatar.name} src={item.avatar.src} size="sm" />
            </span>
          ) : item.icon ? (
            <span className={cx(s.iconMarker, s[item.tone ?? 'neutral'])} aria-hidden="true">
              {item.icon}
            </span>
          ) : (
            <span className={cx(s.dot, s[item.tone ?? (item.current ? 'accent' : 'neutral')])} aria-hidden="true" />
          );
        const markerKind = variant === 'feed' && item.avatar ? s.kindAvatar : item.icon ? s.kindIcon : s.kindDot;
        return (
          <li key={item.id} className={cx(s.item, markerKind, item.current && s.current)} aria-current={item.current ? 'step' : undefined}>
            {variant === 'timeline' && <span className={s.timeCol}>{time}</span>}
            <span className={s.rail}>{marker}</span>
            <div className={s.content}>
              <div className={s.titleRow}>
                <span className={s.title}>
                  {item.title}
                  {variant === 'feed' && time && (
                    <>
                      <span className={s.sep} aria-hidden="true">
                        {' · '}
                      </span>
                      {time}
                    </>
                  )}
                </span>
                {item.current && (
                  <Badge tone="accent" variant="solid" size="sm" className={s.badge}>
                    {currentLabel}
                  </Badge>
                )}
              </div>
              {item.description && <div className={s.description}>{item.description}</div>}
            </div>
            {item.actions && <div className={s.actions}>{item.actions}</div>}
          </li>
        );
      })}
    </ol>
  );
}
