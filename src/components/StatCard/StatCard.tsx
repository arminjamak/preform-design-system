import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Badge } from '../Badge/Badge';
import { Card } from '../Card/Card';
import s from './StatCard.module.css';

export type StatCardDeltaTone = 'positive' | 'negative' | 'neutral';

export type StatCardProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Metric name, e.g. "Prints this week". */
  label: string;
  /** The headline number. Pre-format it (e.g. `1,284`) so locale stays the caller's choice. */
  value: ReactNode;
  /** Unit after the value: "prints", "mL", "h". */
  unit?: string;
  /** Change versus the previous period, e.g. "12%". Hidden when omitted. */
  delta?: string;
  /** Whether the change is good or bad. Independent of direction: fewer failed prints is positive. */
  deltaTone?: StatCardDeltaTone;
  /** Arrow on the delta chip. Defaults to up for positive, down for negative. */
  deltaDirection?: 'up' | 'down' | 'flat';
  /** Screen-reader phrase for the delta; defaults to "Up 12% from last period". */
  deltaLabel?: string;
  /** Leading icon tile next to the label. */
  icon?: ReactNode;
  /** Small muted line under the value: comparison period, data source. */
  footnote?: ReactNode;
  /** Sparkline or mini chart, right of the value. */
  trend?: ReactNode;
  variant?: 'outline' | 'elevated' | 'subtle';
};

const TONE_TO_BADGE = {
  positive: 'success',
  negative: 'danger',
  neutral: 'neutral',
} as const;

/** Metric tile for dashboards: fleet usage, resin consumption, print success rate. */
export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(function StatCard(
  { label, value, unit, delta, deltaTone = 'positive', deltaDirection, deltaLabel, icon, footnote, trend, variant = 'outline', className, ...rest },
  ref,
) {
  const direction = deltaDirection ?? (deltaTone === 'negative' ? 'down' : deltaTone === 'positive' ? 'up' : 'flat');
  const ArrowIcon = direction === 'up' ? ArrowUpIcon : direction === 'down' ? ArrowDownIcon : MinusIcon;
  const spoken = deltaLabel ?? `${direction === 'up' ? 'Up' : direction === 'down' ? 'Down' : 'Unchanged at'} ${delta} from last period`;
  return (
    <Card ref={ref} variant={variant} padding="md" className={cx(s.card, className)} {...rest}>
      <div className={s.stack}>
        <div className={s.header}>
          {icon && (
            <span className={s.icon} aria-hidden="true">
              {icon}
            </span>
          )}
          <span className={s.label}>{label}</span>
        </div>
        <div className={s.body}>
          <div className={s.figure}>
            <span className={s.value}>{value}</span>
            {unit && <span className={s.unit}>{unit}</span>}
            {delta && (
              <span className={s.delta}>
                <Badge tone={TONE_TO_BADGE[deltaTone]} variant="soft" size="md" icon={<ArrowIcon strokeWidth={2.6} aria-hidden="true" />}>
                  <span aria-hidden="true">{delta}</span>
                </Badge>
                <span className={s.srOnly}>{spoken}</span>
              </span>
            )}
          </div>
          {trend && <div className={s.trend}>{trend}</div>}
        </div>
        {footnote && <p className={s.footnote}>{footnote}</p>}
      </div>
    </Card>
  );
});
