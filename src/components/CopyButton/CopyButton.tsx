import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Size, WithForcedState } from '../../lib/types';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Tooltip } from '../Tooltip/Tooltip';
import s from './CopyButton.module.css';

/** How long the "Copied" confirmation stays up (behaviour timing, not a style value). */
const CONFIRM_MS = 1600;

/** Hidden-textarea fallback for browsers or frames where the async Clipboard API is unavailable or denied. */
function legacyCopy(text: string): boolean {
  const previous = document.activeElement as HTMLElement | null;
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.setAttribute('aria-hidden', 'true');
  area.style.position = 'fixed';
  area.style.top = '0';
  area.style.left = '0';
  area.style.opacity = '0';
  area.style.pointerEvents = 'none';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  previous?.focus();
  return ok;
}

/**
 * Copies text to the clipboard. Call it directly inside a click handler so the
 * Clipboard API sees the user gesture; falls back to `execCommand('copy')` on rejection.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return legacyCopy(text);
  }
}

export type CopyButtonProps = WithForcedState & {
  /** Text placed on the clipboard. */
  value: string;
  /** Accessible name (icon) or visible text (text). */
  label?: string;
  /** Confirmation shown after a successful copy. */
  copiedLabel?: string;
  /** Icon-only ghost button with a tooltip, or an outline pill with text. */
  variant?: 'icon' | 'text';
  size?: Size;
  disabled?: boolean;
  onCopied?: (value: string) => void;
  tooltipPlacement?: 'top' | 'bottom';
  className?: string;
};

/** Copies a value (share link, job ID, serial number) and briefly confirms with a check icon and "Copied". */
export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  variant = 'icon',
  size = 'sm',
  disabled,
  onCopied,
  tooltipPlacement = 'top',
  className,
  'data-state': state,
}: CopyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const ok = await copyText(value);
    setStatus(ok ? 'copied' : 'failed');
    if (ok) onCopied?.(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus('idle'), CONFIRM_MS);
  };

  const copied = status === 'copied';
  const message = copied ? copiedLabel : status === 'failed' ? 'Copy failed. Select the text and press Ctrl+C.' : '';
  const glyph = copied ? <CheckIcon strokeWidth={2.6} className={s.check} /> : <CopyIcon strokeWidth={2.2} />;

  return (
    <span className={cx(s.root, className)}>
      {variant === 'icon' ? (
        <Tooltip content={message || label} open={status !== 'idle' || undefined} placement={tooltipPlacement}>
          <IconButton label={label} title={undefined} icon={glyph} size={size} disabled={disabled} data-state={state} onClick={handleClick} />
        </Tooltip>
      ) : (
        <Button variant="outline" size={size} iconStart={glyph} disabled={disabled} data-state={state} onClick={handleClick}>
          {copied ? copiedLabel : label}
        </Button>
      )}
      <span className={s.srOnly} aria-live="polite">
        {message}
      </span>
    </span>
  );
}
