import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDownIcon, PencilIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Avatar } from '../Avatar/Avatar';
import { Tabs } from '../Tabs/Tabs';
import s from './TopNav.module.css';

export type TopNavUser = { name: string; email: string; avatarSrc?: string };

export type AccountChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> &
  WithForcedState & {
    user: TopNavUser;
  };

/** Avatar + name + email + chevron: the account button at the right edge of the dark app bar. */
export const AccountChip = forwardRef<HTMLButtonElement, AccountChipProps>(function AccountChip({ user, className, type = 'button', ...rest }, ref) {
  return (
    <button ref={ref} type={type} aria-haspopup="menu" aria-label={`Account: ${user.name}, ${user.email}`} className={cx(s.account, className)} {...rest}>
      <Avatar name={user.name} src={user.avatarSrc} size="xs" tone="accent" />
      <span className={s.accountText} aria-hidden="true">
        <span className={s.accountName}>{user.name}</span>
        <span className={s.accountEmail}>{user.email}</span>
      </span>
      <ChevronDownIcon className={s.accountChevron} strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
});

export type ProjectTitleProps = WithForcedState & {
  title: string;
  /** Called when the title is clicked (e.g. to open a rename dialog). */
  onClick?: () => void;
  /** When set, clicking turns the title into an inline field; Enter commits, Escape cancels. */
  onTitleChange?: (title: string) => void;
  disabled?: boolean;
  className?: string;
};

/** Centred project name with a pencil affordance. */
export function ProjectTitle({ title, onClick, onTitleChange, disabled, className, 'data-state': state }: ProjectTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const finish = (commit: boolean) => {
    // Blur can fire after Enter/Escape unmounts the field; only settle once.
    if (doneRef.current) return;
    doneRef.current = true;
    const next = draft.trim();
    if (commit && next && next !== title) onTitleChange?.(next);
    setEditing(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={cx(s.titleInput, className)}
        aria-label="Project name"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') finish(true);
          if (e.key === 'Escape') {
            e.stopPropagation();
            finish(false);
          }
        }}
      />
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={disabled}
      data-state={state}
      aria-label={`Project name: ${title}. ${onTitleChange ? 'Rename' : 'Edit'}`}
      className={cx(s.title, className)}
      onClick={() => {
        onClick?.();
        if (onTitleChange) {
          setDraft(title);
          doneRef.current = false;
          setEditing(true);
        }
      }}
    >
      <span className={s.titleText}>{title}</span>
      <PencilIcon className={s.titleIcon} strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
}

export type TopNavSection<T extends string = string> = { value: T; label: string; icon?: ReactNode; disabled?: boolean };

export type TopNavProps<T extends string = string> = Omit<HTMLAttributes<HTMLElement>, 'title' | 'onChange'> &
  WithForcedState & {
    /** Brand mark, rendered in a square cell at the far left. */
    logo?: ReactNode;
    /** Accessible name for the logo (omit when the logo is decorative or already labelled). */
    logoLabel?: string;
    sections: TopNavSection<T>[];
    value: T;
    onChange: (value: T) => void;
    /** Project name shown centred in the bar. */
    title?: string;
    onTitleClick?: () => void;
    /** Enables inline renaming of the title. */
    onTitleChange?: (title: string) => void;
    /** Right-aligned icon actions (use `IconButton variant="inverse"`). */
    actions?: ReactNode;
    user?: TopNavUser;
    onAccountClick?: () => void;
  };

/** The dark PreForm application bar: logo, app section tabs, centred project title, actions and the account chip. */
export function TopNav<T extends string>({
  logo,
  logoLabel,
  sections,
  value,
  onChange,
  title,
  onTitleClick,
  onTitleChange,
  actions,
  user,
  onAccountClick,
  className,
  'data-state': state,
  ...rest
}: TopNavProps<T>) {
  return (
    <header className={cx(s.bar, className)} {...rest}>
      {logo && (
        <div className={s.logo} role={logoLabel ? 'img' : undefined} aria-label={logoLabel}>
          {logo}
        </div>
      )}
      <Tabs label="App sections" variant="inverse" items={sections} value={value} onChange={onChange} data-state={state} className={s.tabs} />
      <div className={s.center}>{title && <ProjectTitle title={title} onClick={onTitleClick} onTitleChange={onTitleChange} data-state={state} />}</div>
      {actions && <div className={s.actions}>{actions}</div>}
      {user && <AccountChip user={user} onClick={onAccountClick} data-state={state} />}
    </header>
  );
}
