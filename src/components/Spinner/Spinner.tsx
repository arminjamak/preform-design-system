import { cx } from '../../lib/cx';
import s from './Spinner.module.css';

export type SpinnerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tone?: 'current' | 'accent' | 'muted';
  label?: string;
  className?: string;
};

export function Spinner({ size = 'sm', tone = 'current', label = 'Loading', className }: SpinnerProps) {
  return <span role="status" aria-label={label} className={cx(s.spinner, s[size], s[tone], className)} />;
}
