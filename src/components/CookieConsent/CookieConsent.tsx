import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CookieIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Toggle } from '../Toggle/Toggle';
import { useOverlayBehavior, usePresence } from '../Sheet/overlay';
import s from './CookieConsent.module.css';

export type ConsentCategory = {
  id: string;
  label: string;
  description: string;
  /** Always on and not switchable (strictly necessary cookies). */
  required?: boolean;
};

/** Category id → granted. Required categories are always true. */
export type ConsentPreferences = Record<string, boolean>;
export type ConsentSource = 'accept-all' | 'reject-all' | 'custom';

export const DEFAULT_CONSENT_CATEGORIES: ConsentCategory[] = [
  {
    id: 'necessary',
    label: 'Strictly necessary',
    description: 'Keep you signed in to Dashboard, remember your printer fleet and secure file uploads. These cannot be turned off.',
    required: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Anonymous usage data such as which tools you use and how long slicing takes, so we can make PreForm faster.',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Personalised material and printer recommendations on formlabs.com and in partner channels.',
  },
];

const allTo = (categories: ConsentCategory[], value: boolean): ConsentPreferences =>
  Object.fromEntries(categories.map((c) => [c.id, c.required ? true : value]));

const normalise = (categories: ConsentCategory[], value?: ConsentPreferences): ConsentPreferences =>
  Object.fromEntries(categories.map((c) => [c.id, c.required ? true : !!value?.[c.id]]));

/* ───────────────────────── Preferences dialog ───────────────────────── */

export type ConsentPreferencesDialogProps = {
  open: boolean;
  onRequestClose: () => void;
  onSave: (preferences: ConsentPreferences, source: ConsentSource) => void;
  categories?: ConsentCategory[];
  /** Preferences shown when the dialog opens. */
  value?: ConsentPreferences;
  title?: string;
  description?: string;
  /** Render in place instead of portalling to <body> (docs and tests). */
  inline?: boolean;
  className?: string;
};

/** Modal listing consent categories with switches; Necessary is locked on. */
export function ConsentPreferencesDialog({
  open,
  onRequestClose,
  onSave,
  categories = DEFAULT_CONSENT_CATEGORIES,
  value,
  title = 'Cookie preferences',
  description = 'Choose which cookies PreForm and Dashboard may use. You can change this any time in Settings › Privacy.',
  inline,
  className,
}: ConsentPreferencesDialogProps) {
  const titleId = useId();
  const descId = useId();
  const [draft, setDraft] = useState<ConsentPreferences>(() => normalise(categories, value));
  const { mounted, state } = usePresence(open);
  const { ref, onKeyDown } = useOverlayBehavior<HTMLDivElement>({ open, onClose: onRequestClose, inline });

  useEffect(() => {
    if (open) setDraft(normalise(categories, value));
  }, [open, categories, value]);

  if (!mounted) return null;

  const node = (
    <div className={cx(s.scrim, inline && s.scrimInline)} data-presence={state} onMouseDown={(e) => e.target === e.currentTarget && onRequestClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} tabIndex={-1} onKeyDown={onKeyDown} className={cx(s.dialog, className)}>
        <header className={s.header}>
          <div className={s.titles}>
            <h2 id={titleId} className={s.title}>
              {title}
            </h2>
            <p id={descId} className={s.description}>
              {description}
            </p>
          </div>
          <IconButton label="Close" icon={<XIcon strokeWidth={2.6} />} size="sm" onClick={onRequestClose} />
        </header>
        <ul className={s.categories}>
          {categories.map((c) => (
            <li key={c.id} className={s.category}>
              <div className={s.categoryHead}>
                <span className={s.categoryLabel}>{c.label}</span>
                {c.required && <Badge tone="neutral">Always on</Badge>}
                <Toggle
                  className={s.categoryToggle}
                  label={c.label}
                  checked={c.required ? true : !!draft[c.id]}
                  disabled={c.required}
                  onChange={(v) => setDraft((d) => ({ ...d, [c.id]: v }))}
                />
              </div>
              <p className={s.categoryDescription}>{c.description}</p>
            </li>
          ))}
        </ul>
        <footer className={s.footer}>
          <Button variant="link" className={s.footerStart} onClick={() => onSave(allTo(categories, false), 'reject-all')}>
            Reject all
          </Button>
          <Button variant="outline" onClick={() => onSave(allTo(categories, true), 'accept-all')}>
            Accept all
          </Button>
          <Button variant="primary" onClick={() => onSave(normalise(categories, draft), 'custom')}>
            Save preferences
          </Button>
        </footer>
      </div>
    </div>
  );
  return inline ? node : createPortal(node, document.body);
}

/* ───────────────────────── Banner ───────────────────────── */

export type CookieConsentProps = {
  /** Show the banner (false once the user has chosen). */
  open: boolean;
  /** Called for every choice: Accept all, Reject all, or Save preferences from the dialog. */
  onSave: (preferences: ConsentPreferences, source: ConsentSource) => void;
  categories?: ConsentCategory[];
  /** Current preferences, pre-filled in the Customize dialog. */
  value?: ConsentPreferences;
  title?: string;
  message?: ReactNode;
  /** Link to the cookie policy, shown after the message. */
  policyHref?: string;
  policyLabel?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  customizeLabel?: string;
  /** Open the preferences dialog straight away (docs and tests). */
  defaultCustomizing?: boolean;
  /** Render in place instead of fixed to the bottom of the viewport (docs and tests). */
  inline?: boolean;
  className?: string;
};

/** Bottom consent banner with Accept all / Reject all / Customize; Customize opens ConsentPreferencesDialog. */
export function CookieConsent({
  open,
  onSave,
  categories = DEFAULT_CONSENT_CATEGORIES,
  value,
  title = 'Cookies on Formlabs Dashboard',
  message = 'We use necessary cookies to keep your printers and print jobs in sync. With your permission we also use analytics to improve PreForm and marketing cookies to tailor material recommendations.',
  policyHref,
  policyLabel = 'Cookie policy',
  acceptLabel = 'Accept all',
  rejectLabel = 'Reject all',
  customizeLabel = 'Customize',
  defaultCustomizing = false,
  inline,
  className,
}: CookieConsentProps) {
  const titleId = useId();
  const msgId = useId();
  const [customizing, setCustomizing] = useState(defaultCustomizing);
  const { mounted, state } = usePresence(open);

  if (!mounted) return null;

  const save = (prefs: ConsentPreferences, source: ConsentSource) => {
    setCustomizing(false);
    onSave(prefs, source);
  };

  const banner = (
    <div className={cx(s.bannerLayer, inline && s.bannerInline)} data-presence={state}>
      <section role="dialog" aria-modal="false" aria-labelledby={titleId} aria-describedby={msgId} className={cx(s.banner, className)}>
        <span className={s.bannerIcon} aria-hidden="true">
          <CookieIcon strokeWidth={2} />
        </span>
        <div className={s.bannerText}>
          <h2 id={titleId} className={s.bannerTitle}>
            {title}
          </h2>
          <p id={msgId} className={s.bannerMessage}>
            {message}
            {policyHref && (
              <>
                {' '}
                <a className={s.link} href={policyHref}>
                  {policyLabel}
                </a>
              </>
            )}
          </p>
        </div>
        <div className={s.bannerActions}>
          <Button variant="ghost" onClick={() => setCustomizing(true)} aria-haspopup="dialog">
            {customizeLabel}
          </Button>
          <Button variant="outline" onClick={() => save(allTo(categories, false), 'reject-all')}>
            {rejectLabel}
          </Button>
          <Button variant="primary" onClick={() => save(allTo(categories, true), 'accept-all')}>
            {acceptLabel}
          </Button>
        </div>
      </section>
    </div>
  );

  const dialog = <ConsentPreferencesDialog open={open && customizing} onRequestClose={() => setCustomizing(false)} onSave={save} categories={categories} value={value} inline={inline} />;

  if (inline) {
    return (
      <div className={s.inlineFrame}>
        {dialog}
        {!customizing && banner}
      </div>
    );
  }
  return createPortal(
    <>
      {banner}
      {dialog}
    </>,
    document.body,
  );
}
