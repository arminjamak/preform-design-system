import { cx } from '../../lib/cx';
import s from './Avatar.module.css';

export type AvatarProps = {
  /** Full name; initials are derived from it. */
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tone?: 'accent' | 'neutral' | 'inverse';
  className?: string;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('');

/** Account chip in the top navigation. */
export function Avatar({ name, src, size = 'xs', tone = 'accent', className }: AvatarProps) {
  return (
    <span className={cx(s.avatar, s[size], s[tone], className)} role="img" aria-label={name} title={name}>
      {src ? <img src={src} alt="" /> : initials(name)}
    </span>
  );
}
