import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon, OctagonAlertIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import s from './Toast.module.css';

export type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ToastPlacement = 'bottom-right' | 'bottom-center' | 'top-center';
export type ToastAction = { label: string; onClick: () => void };

const defaultIcon: Record<ToastTone, ReactNode> = {
  neutral: null,
  info: <InfoIcon strokeWidth={2} />,
  success: <CheckCircle2Icon strokeWidth={2} />,
  warning: <AlertTriangleIcon strokeWidth={2} />,
  danger: <OctagonAlertIcon strokeWidth={2} />,
};

/* ------------------------------------------------------------------ */
/* ToastItem: the static visual, usable on its own in docs.             */
/* ------------------------------------------------------------------ */

export type ToastItemProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> &
  WithForcedState & {
    tone?: ToastTone;
    title: ReactNode;
    description?: ReactNode;
    /** Single text action such as "Undo" or "Retry". */
    action?: ToastAction;
    /** Shows the close button; called when it is pressed. */
    onDismiss?: () => void;
    /** Accessible label for the close button. */
    dismissLabel?: string;
    /** Override the tone icon, or `false` to hide it. Neutral has no icon by default. */
    icon?: ReactNode | false;
  };

/** One toast card: tone stripe and icon, title, description, optional action and close button. */
export const ToastItem = forwardRef<HTMLDivElement, ToastItemProps>(function ToastItem(
  { tone = 'neutral', title, description, action, onDismiss, dismissLabel = 'Dismiss notification', icon, className, 'data-state': state, ...rest },
  ref,
) {
  const glyph = icon === false ? null : icon ?? defaultIcon[tone];
  return (
    <div ref={ref} className={cx(s.toast, s[tone], className)} {...rest}>
      {glyph && (
        <span className={s.icon} aria-hidden="true">
          {glyph}
        </span>
      )}
      <div className={s.content}>
        <p className={s.title}>{title}</p>
        {description && <p className={s.description}>{description}</p>}
      </div>
      {(action || onDismiss) && (
        <div className={s.actions}>
          {action && (
            <Button size="sm" variant="outlineAccent" onClick={action.onClick} data-state={state}>
              {action.label}
            </Button>
          )}
          {onDismiss && <IconButton size="xs" label={dismissLabel} icon={<XIcon strokeWidth={2} />} onClick={onDismiss} data-state={state} />}
        </div>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Provider + hook                                                      */
/* ------------------------------------------------------------------ */

export type ToastOptions = {
  /** Reuse an id to replace an existing toast (e.g. "Uploading…" → "Uploaded"). */
  id?: string;
  tone?: ToastTone;
  title: ReactNode;
  description?: ReactNode;
  action?: ToastAction;
  /** Auto-dismiss delay in ms. `null` keeps the toast until dismissed. Defaults to the provider duration. */
  duration?: number | null;
  /** Show the close button. Default true. */
  dismissible?: boolean;
  icon?: ReactNode | false;
};

type ToastRecord = ToastOptions & { id: string; closing: boolean; createdAt: number };

type ToastContextValue = {
  toasts: ToastRecord[];
  max: number;
  duration: number | null;
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export type ToastProviderProps = {
  children?: ReactNode;
  /** Maximum toasts on screen; the oldest is dismissed when a new one would exceed it. */
  max?: number;
  /** Default auto-dismiss delay in ms (`null` = never). */
  duration?: number | null;
};

let counter = 0;

/** Holds the toast queue. Render a `<Toaster />` anywhere inside it to show the stack. */
export function ToastProvider({ children, max = 3, duration = 5000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, closing: true } : t)));
  }, []);
  const dismissAll = useCallback(() => {
    setToasts((list) => list.map((t) => ({ ...t, closing: true })));
  }, []);
  const remove = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = options.id ?? `pf-toast-${++counter}`;
      setToasts((list) => {
        const existing = list.find((t) => t.id === id);
        if (existing) return list.map((t) => (t.id === id ? { ...t, ...options, id, closing: false, createdAt: Date.now() } : t));
        const next = [...list, { ...options, id, closing: false, createdAt: Date.now() }];
        // Enforce the stack limit by closing the oldest open toasts.
        let open = next.filter((t) => !t.closing).length;
        return next.map((t) => {
          if (open > max && !t.closing) {
            open -= 1;
            return { ...t, closing: true };
          }
          return t;
        });
      });
      return id;
    },
    [max],
  );

  const value = useMemo(() => ({ toasts, max, duration, toast, dismiss, dismissAll, remove }), [toasts, max, duration, toast, dismiss, dismissAll, remove]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export type UseToastResult = Pick<ToastContextValue, 'toast' | 'dismiss' | 'dismissAll'>;

/** `const { toast } = useToast(); toast({ tone: 'success', title: 'Supports generated' })`. */
export function useToast(): UseToastResult {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
  const { toast, dismiss, dismissAll } = ctx;
  return useMemo(() => ({ toast, dismiss, dismissAll }), [toast, dismiss, dismissAll]);
}

/* ------------------------------------------------------------------ */
/* Toaster region                                                       */
/* ------------------------------------------------------------------ */

export type ToasterProps = {
  placement?: ToastPlacement;
  /** Accessible name of the notification region. */
  label?: string;
  /** Render into `document.body` (default) or in place. */
  portal?: boolean;
  className?: string;
};

const placementClass: Record<ToastPlacement, string> = {
  'bottom-right': s.bottomRight,
  'bottom-center': s.bottomCenter,
  'top-center': s.topCenter,
};

/** The fixed, polite live region that renders the provider's toasts. Pauses auto-dismiss while hovered or focused. */
export function Toaster({ placement = 'bottom-right', label = 'Notifications', portal = true, className }: ToasterProps) {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('<Toaster> must be rendered inside <ToastProvider>.');
  const { toasts, duration, dismiss, remove } = ctx;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;

  // An emptied list never fires mouseleave/blur, so clear the pause when the last toast goes.
  useEffect(() => {
    if (toasts.length === 0) {
      setHovered(false);
      setFocused(false);
    }
  }, [toasts.length]);

  const region = (
    <section aria-label={label} className={cx(s.toaster, placementClass[placement], className)}>
      <ol
        className={s.list}
        aria-live="polite"
        aria-relevant="additions text"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        {toasts.map((t) => (
          <ToastEntry key={t.id} record={t} paused={paused} fallbackDuration={duration} onDismiss={() => dismiss(t.id)} onRemove={() => remove(t.id)} />
        ))}
      </ol>
    </section>
  );

  if (!portal || typeof document === 'undefined') return region;
  return createPortal(region, document.body);
}

type ToastEntryProps = {
  record: ToastRecord;
  paused: boolean;
  fallbackDuration: number | null;
  onDismiss: () => void;
  onRemove: () => void;
};

/** Safety net in case `animationend` never fires (element hidden, animations disabled). */
const EXIT_FALLBACK_MS = 1000;

function ToastEntry({ record, paused, fallbackDuration, onDismiss, onRemove }: ToastEntryProps) {
  const { id, tone, title, description, action, dismissible = true, icon, closing, createdAt } = record;
  const duration = record.duration === undefined ? fallbackDuration : record.duration;
  const remaining = useRef(duration ?? 0);

  // Reset the countdown when the toast is replaced via the same id.
  useEffect(() => {
    remaining.current = duration ?? 0;
  }, [createdAt, duration]);

  useEffect(() => {
    if (closing || paused || duration == null || !Number.isFinite(duration)) return;
    const start = Date.now();
    const timer = window.setTimeout(onDismiss, Math.max(remaining.current, 0));
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - start;
    };
    // onDismiss is stable per id; re-running on its identity would reset the countdown.
  }, [closing, paused, duration, createdAt]);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(onRemove, EXIT_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  const onKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onDismiss();
    }
  };

  return (
    <li
      className={s.entry}
      data-closing={closing || undefined}
      data-toast-id={id}
      onKeyDown={onKeyDown}
      onAnimationEnd={(e) => {
        if (closing && e.target === e.currentTarget) onRemove();
      }}
    >
      <ToastItem
        tone={tone}
        title={title}
        description={description}
        icon={icon}
        action={
          action && {
            label: action.label,
            onClick: () => {
              action.onClick();
              onDismiss();
            },
          }
        }
        onDismiss={dismissible ? onDismiss : undefined}
      />
    </li>
  );
}
