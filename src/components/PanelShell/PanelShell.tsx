import type { ReactNode } from 'react';
import { XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import s from './PanelShell.module.css';

export type PanelShellProps = {
  title: string;
  badge?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** The 300px tool panel: white header, grey scrolling body, footer for primary actions. */
export function PanelShell({ title, badge, onClose, footer, children, className }: PanelShellProps) {
  return (
    <section aria-label={`${title} panel`} className={cx(s.panel, className)}>
      <header className={s.header}>
        <div className={s.titleRow}>
          <h2 className={s.title}>{title}</h2>
          {badge}
        </div>
        <IconButton label={`Close ${title}`} icon={<XIcon strokeWidth={2.6} />} size="xs" onClick={onClose} />
      </header>
      <div className={s.body}>{children}</div>
      {footer && <footer className={s.footer}>{footer}</footer>}
    </section>
  );
}
