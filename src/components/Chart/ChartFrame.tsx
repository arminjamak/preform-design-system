import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './Chart.module.css';

export type ChartFrameProps = {
  title?: string;
  subtitle?: string;
  legend?: ReactNode;
  /** Top-right slot (e.g. a Segmented range switch). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Standard wrapper for every chart: title row, plot, legend. */
export function ChartFrame({ title, subtitle, legend, actions, children, className }: ChartFrameProps) {
  return (
    <figure className={cx(s.frame, className)} >
      {(title || actions) && (
        <figcaption className={s.header}>
          <span>
            {title && <p className={s.title}>{title}</p>}
            {subtitle && <p className={s.subtitle}>{subtitle}</p>}
          </span>
          {actions}
        </figcaption>
      )}
      {children}
      {legend}
    </figure>
  );
}
