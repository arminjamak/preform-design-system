import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './ToolRail.module.css';

export type ToolButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> &
  WithForcedState & {
    icon: ReactNode;
    label: string;
    active?: boolean;
    /** Render with its own card background when used outside a ToolRail. */
    standalone?: boolean;
  };

/** Icon-over-label button from the left tool rail. */
export function ToolButton({ icon, label, active, standalone, className, type = 'button', ...rest }: ToolButtonProps) {
  return (
    <button type={type} aria-pressed={active} className={cx(s.tool, standalone && s.standalone, className)} {...rest}>
      {icon}
      <span className={s.label}>{label}</span>
    </button>
  );
}

export type ToolRailGroup = Array<{ id: string; icon: ReactNode; label: string; disabled?: boolean }>;

export type ToolRailProps = {
  groups: ToolRailGroup[];
  active: string | null;
  onSelect: (id: string) => void;
  /** Dim the rail while a modal workflow owns the screen. */
  dimmed?: boolean;
  className?: string;
};

/** Vertical stack of tool groups; each group is a white card. */
export function ToolRail({ groups, active, onSelect, dimmed, className }: ToolRailProps) {
  return (
    <nav aria-label="Tools" className={cx(s.rail, dimmed && s.dimmed, className)}>
      {groups.map((group, i) => (
        <div key={i} className={s.group}>
          {group.map((tool) => (
            <ToolButton key={tool.id} icon={tool.icon} label={tool.label} active={active === tool.id} disabled={tool.disabled} onClick={() => onSelect(tool.id)} />
          ))}
        </div>
      ))}
    </nav>
  );
}
