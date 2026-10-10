import { cx } from '../../lib/cx';
import s from './Divider.module.css';

export type DividerProps = {
  orientation?: 'horizontal' | 'vertical';
  tone?: 'default' | 'subtle' | 'inverse';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
};

export function Divider({ orientation = 'horizontal', tone = 'default', spacing = 'md', className }: DividerProps) {
  return <hr role="separator" aria-orientation={orientation} className={cx(s.divider, s[orientation], tone !== 'default' && s[tone], s[spacing], className)} />;
}
