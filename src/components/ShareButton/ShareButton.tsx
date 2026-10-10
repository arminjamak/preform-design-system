import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { DownloadIcon, LinkIcon, MailIcon, Share2Icon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import { Button } from '../Button/Button';
import { CopyButton, copyText } from '../CopyButton/CopyButton';
import { MenuList, type MenuItem } from '../Menu/Menu';
import { Popover } from '../Popover/Popover';
import { handleMenuKeyDown } from '../SplitButton/menuKeyboard';
import { TextField } from '../TextField/TextField';
import s from './ShareButton.module.css';

export type ShareTarget = {
  /** Stable id passed back through `onShare`. `copy-link` also copies `url` to the clipboard. */
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export const DEFAULT_SHARE_TARGETS: ShareTarget[] = [
  { id: 'copy-link', label: 'Copy link', icon: <LinkIcon strokeWidth={2.2} /> },
  { id: 'email', label: 'Email', icon: <MailIcon strokeWidth={2.2} /> },
  { id: 'export-form', label: 'Export .form file', icon: <DownloadIcon strokeWidth={2.2} /> },
];

export type ShareButtonVariant = 'primary' | 'outline' | 'muted' | 'ghost';

export type ShareButtonProps = WithForcedState & {
  /** Link shown in the read-only field and copied by "Copy link". */
  url: string;
  /** What is being shared (job or model name); heads the popover. */
  title: string;
  targets?: ShareTarget[];
  /** Called when a share target is chosen, or when the link is copied (`copy-link`). */
  onShare?: (target: ShareTarget) => void;
  /** Trigger text. */
  label?: string;
  size?: Size;
  variant?: ShareButtonVariant;
  align?: 'start' | 'end';
  placement?: 'top' | 'bottom';
  disabled?: boolean;
  className?: string;
};

const noop = () => {};

/** Share trigger that opens a small dialog: read-only link + copy, then share targets (Copy link, Email, Export .form file). */
export function ShareButton({
  url,
  title,
  targets: targetsProp,
  onShare,
  label = 'Share',
  size = 'sm',
  variant = 'outline',
  align = 'start',
  placement = 'bottom',
  disabled,
  className,
  'data-state': state,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const dialogId = useId();

  const close = useCallback(() => setOpen(false), []);
  const dismiss = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Resolved here rather than as a parameter default: Storybook's docgen tries to print the default's
  // array literal and cannot serialise the JSX icons inside it.
  const targets = targetsProp ?? DEFAULT_SHARE_TARGETS;
  const copyTarget = targets.find((t) => t.id === 'copy-link');

  const items: MenuItem[] = targets.map((t) => ({
    label: t.label,
    icon: t.icon,
    disabled: t.disabled,
    onSelect: () => {
      if (t.id === 'copy-link') void copyText(url);
      onShare?.(t);
    },
  }));

  const onDialogKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      dismiss();
    }
  };

  return (
    <Popover
      open={open}
      onClose={close}
      placement={placement}
      align={align}
      padded={false}
      className={cx(s.anchor, className)}
      trigger={
        <Button
          ref={triggerRef}
          variant={variant}
          size={size}
          disabled={disabled}
          data-state={state}
          iconStart={<Share2Icon strokeWidth={2.2} />}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          onClick={() => setOpen((o) => !o)}
        >
          {label}
        </Button>
      }
    >
      <div id={dialogId} role="dialog" aria-labelledby={headingId} className={s.dialog} onKeyDown={onDialogKeyDown}>
        <div className={s.body}>
          <p id={headingId} className={s.title}>
            Share “{title}”
          </p>
          <div className={s.linkRow}>
            <TextField
              ref={inputRef}
              label={`Link to ${title}`}
              value={url}
              onChange={noop}
              readOnly
              fullWidth
              size="sm"
              onFocus={(e) => e.currentTarget.select()}
              className={s.field}
            />
            <CopyButton value={url} label="Copy link" size="sm" tooltipPlacement="bottom" onCopied={() => copyTarget && onShare?.(copyTarget)} />
          </div>
        </div>
        {items.length > 0 && (
          <div className={s.menu} onKeyDown={(e) => handleMenuKeyDown(e)}>
            <MenuList items={items} onSelect={dismiss} />
          </div>
        )}
      </div>
    </Popover>
  );
}
