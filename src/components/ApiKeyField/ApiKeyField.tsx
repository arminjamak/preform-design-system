import { useEffect, useId, useRef, useState, type HTMLAttributes } from 'react';
import { EyeIcon, EyeOffIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { CopyButton } from '../CopyButton/CopyButton';
import { IconButton } from '../IconButton/IconButton';
import s from './ApiKeyField.module.css';

const MASK = '••••••••';

/** `pf_live_8c1d…3f9a` → `pf_live_••••••••3f9a`: keeps the prefix up to the last underscore and the last four characters. */
export function maskApiKey(key: string, visible = 4): string {
  const cut = key.lastIndexOf('_') + 1;
  const prefix = key.slice(0, cut);
  const secret = key.slice(cut);
  if (secret.length <= visible) return prefix + MASK;
  return prefix + MASK + secret.slice(-visible);
}

const toDate = (d: Date | string) => (d instanceof Date ? d : new Date(d));
const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

type Pending = 'regenerate' | 'revoke' | null;

export type ApiKeyFieldProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> &
  WithForcedState & {
    /** The full secret. Masked unless revealed. */
    value: string;
    /** Name of the key, e.g. "Print farm script". */
    label: string;
    createdAt?: Date | string;
    /** `null` shows "Never used". */
    lastUsedAt?: Date | string | null;
    /** Permission scopes shown as badges; `*:write` scopes use the accent tone. */
    scopes?: string[];
    /** Rolls the secret. Shown behind an inline confirmation. Hidden when omitted. */
    onRegenerate?: () => void;
    /** Revokes the key. Shown behind an inline danger confirmation. Hidden when omitted. */
    onRevoke?: () => void;
    /** Show the eye toggle that reveals the full key. */
    revealable?: boolean;
    /** Show the copy button. */
    copyable?: boolean;
    /** Card with header and metadata, or a bare field row (e.g. a webhook signing secret inside a form). */
    variant?: 'card' | 'plain';
    /** Explain what breaks when the key is regenerated. */
    regenerateMessage?: string;
    /** Spinner on the confirm button while the server rolls or revokes the key. */
    busy?: boolean;
  };

/** Masked API key / signing secret with reveal, copy, regenerate and revoke. PreForm Local API keys, Dashboard webhook secrets. */
export function ApiKeyField({
  value,
  label,
  createdAt,
  lastUsedAt,
  scopes,
  onRegenerate,
  onRevoke,
  revealable = true,
  copyable = true,
  variant = 'card',
  regenerateMessage = 'Scripts and integrations using the current key stop working immediately.',
  busy,
  className,
  'data-state': state,
  ...rest
}: ApiKeyFieldProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const regenRef = useRef<HTMLButtonElement>(null);
  const revokeRef = useRef<HTMLButtonElement>(null);
  const wasBusy = useRef(false);

  const tail = value.slice(-4);
  const env = value.includes('_live_') ? 'live' : value.includes('_test_') ? 'test' : null;

  useEffect(() => {
    if (pending) confirmRef.current?.focus();
  }, [pending]);

  // Close the confirmation once the parent finishes the request.
  useEffect(() => {
    if (wasBusy.current && !busy) setPending(null);
    wasBusy.current = !!busy;
  }, [busy]);

  // Hide the new secret again when it changes, so a regenerated key is not left on screen.
  useEffect(() => setRevealed(false), [value]);

  const open = (p: Exclude<Pending, null>) => {
    triggerRef.current = p === 'regenerate' ? regenRef.current : revokeRef.current;
    setPending(p);
  };
  const cancel = () => {
    setPending(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const confirm = () => {
    if (pending === 'regenerate') onRegenerate?.();
    if (pending === 'revoke') onRevoke?.();
    if (busy === undefined) setPending(null);
  };

  const keyRow = (
    <div className={s.keyRow} data-state={state}>
      <code className={s.key}>
        {revealed ? (
          value
        ) : (
          <>
            <span aria-hidden="true">{maskApiKey(value)}</span>
            <span className={s.srOnly}>Hidden key ending in {tail}</span>
          </>
        )}
      </code>
      <span className={s.tools}>
        {revealable && (
          <IconButton
            label={revealed ? 'Hide key' : 'Reveal key'}
            icon={revealed ? <EyeOffIcon strokeWidth={2.2} /> : <EyeIcon strokeWidth={2.2} />}
            pressed={revealed}
            size="sm"
            onClick={() => setRevealed((r) => !r)}
          />
        )}
        {copyable && <CopyButton value={value} label={`Copy ${label}`} copiedLabel="Copied" />}
      </span>
    </div>
  );

  const actions = (onRegenerate || onRevoke) && !pending && (
    <div className={s.actions}>
      {onRegenerate && (
        <Button ref={regenRef} variant="outline" size="sm" iconStart={<RefreshCwIcon strokeWidth={2.2} />} onClick={() => open('regenerate')}>
          Regenerate
        </Button>
      )}
      {onRevoke && (
        <Button ref={revokeRef} variant="ghost" size="sm" iconStart={<Trash2Icon strokeWidth={2.2} />} className={s.revoke} onClick={() => open('revoke')}>
          Revoke
        </Button>
      )}
    </div>
  );

  const confirmation = pending && (
    <div
      role="alertdialog"
      aria-labelledby={`${id}-confirm-title`}
      aria-describedby={`${id}-confirm-text`}
      className={cx(s.confirm, pending === 'revoke' && s.confirmDanger)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          cancel();
        }
      }}
    >
      <p id={`${id}-confirm-title`} className={s.confirmTitle}>
        {pending === 'regenerate' ? `Regenerate “${label}”?` : `Revoke “${label}”?`}
      </p>
      <p id={`${id}-confirm-text`} className={s.confirmText}>
        {pending === 'regenerate' ? regenerateMessage : 'The key is deleted for good. Anything using it loses access to your printers.'}
      </p>
      <div className={s.confirmActions}>
        <Button variant="link" size="sm" onClick={cancel} disabled={busy}>
          Cancel
        </Button>
        <Button ref={confirmRef} variant={pending === 'revoke' ? 'danger' : 'primary'} size="sm" loading={busy} onClick={confirm}>
          {pending === 'regenerate' ? 'Regenerate key' : 'Revoke key'}
        </Button>
      </div>
    </div>
  );

  if (variant === 'plain') {
    return (
      <div role="group" aria-label={label} className={cx(s.plain, className)} {...rest}>
        {keyRow}
        {actions}
        {confirmation}
      </div>
    );
  }

  const meta = [
    createdAt && `Created ${dateFmt.format(toDate(createdAt))}`,
    lastUsedAt === null ? 'Never used' : lastUsedAt ? `Last used ${dateTimeFmt.format(toDate(lastUsedAt))}` : null,
  ].filter(Boolean);

  return (
    <section aria-labelledby={labelId} className={cx(s.card, className)} {...rest}>
      <header className={s.header}>
        <h3 id={labelId} className={s.title}>
          {label}
        </h3>
        {env && (
          <Badge tone={env === 'live' ? 'success' : 'warning'} variant="soft" className={env === 'live' ? s.envLive : s.envTest}>
            {env === 'live' ? 'Live' : 'Test'}
          </Badge>
        )}
      </header>
      {keyRow}
      {meta.length > 0 && <p className={s.meta}>{meta.join(' · ')}</p>}
      {scopes && scopes.length > 0 && (
        <ul className={s.scopes} aria-label="Scopes">
          {scopes.map((scope) => (
            <li key={scope}>
              <Badge tone={scope.endsWith(':write') || scope.endsWith(':admin') ? 'accent' : 'neutral'} variant="soft" className={s.scope}>
                {scope}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {actions}
      {confirmation}
    </section>
  );
}
