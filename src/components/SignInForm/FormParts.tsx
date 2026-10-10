import { forwardRef, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { cx } from '../../lib/cx';
import { Callout } from '../Callout/Callout';
import { ValidationMessage } from '../ValidationMessage/ValidationMessage';
import s from './FormParts.module.css';

export type FormFieldError = {
  /** DOM id of the control (or a wrapper around it) to focus from the summary. */
  target: string;
  message: string;
};

/** Focuses `ref` whenever `trigger` changes to a truthy value after the first render (server errors, failed submits). */
export function useFocusOnChange(ref: RefObject<HTMLElement>, trigger: unknown) {
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (trigger) ref.current?.focus();
  }, [trigger, ref]);
}

/** Focuses the element with `id`, or the first focusable control inside it. */
export function focusById(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const focusable = el.matches('input, select, textarea, button') ? el : el.querySelector<HTMLElement>('input:not([tabindex="-1"]), select, textarea, button');
  (focusable ?? el).focus();
}

export type ErrorSummaryProps = {
  title?: string;
  errors: FormFieldError[];
  className?: string;
};

/**
 * Danger Callout listing every invalid field as a link that moves focus to it.
 * Focusable (tabIndex -1) so a failed submit can move focus here and the list is read out.
 */
export const ErrorSummary = forwardRef<HTMLDivElement, ErrorSummaryProps>(function ErrorSummary({ title, errors, className }, ref) {
  const heading = title ?? (errors.length === 1 ? 'Fix 1 field to continue' : `Fix ${errors.length} fields to continue`);
  return (
    <div ref={ref} tabIndex={-1} className={cx(s.summary, className)} aria-label={heading}>
      <Callout tone="danger" title={heading}>
        <ul className={s.list}>
          {errors.map((e) => (
            <li key={e.target}>
              <a
                href={`#${e.target}`}
                className={s.link}
                onClick={(ev) => {
                  ev.preventDefault();
                  focusById(e.target);
                }}
              >
                {e.message}
              </a>
            </li>
          ))}
        </ul>
      </Callout>
    </div>
  );
});

export type ServerErrorProps = { title?: string; children: ReactNode; className?: string };

/** Focusable danger Callout for errors returned by the server ("Incorrect email or password"). */
export const ServerError = forwardRef<HTMLDivElement, ServerErrorProps>(function ServerError({ title, children, className }, ref) {
  return (
    <div ref={ref} tabIndex={-1} role="alert" className={cx(s.summary, className)}>
      <Callout tone="danger" title={title}>
        {children}
      </Callout>
    </div>
  );
});

export type FieldShellProps = {
  /** Id of the control; the visible label points at it. */
  htmlFor: string;
  label: string;
  /** Adds the red required marker after the label. */
  required?: boolean;
  /** Rendered after the label, e.g. "Optional". */
  aside?: ReactNode;
  /** Id for the message; give it to the control's `aria-describedby`. */
  messageId?: string;
  error?: string;
  /** Positive confirmation shown when there is no error (e.g. "Passwords match."). */
  success?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

/** Visible label above a control plus an error / hint line wired as a polite live region. */
export function FieldShell({ htmlFor, label, required, aside, messageId, error, success, hint, children, className }: FieldShellProps) {
  return (
    <div className={cx(s.field, className)}>
      <div className={s.labelRow}>
        <label htmlFor={htmlFor} className={s.label}>
          {label}
          {required && (
            <span className={s.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
        {aside && <span className={s.aside}>{aside}</span>}
      </div>
      {children}
      {error ? (
        <ValidationMessage id={messageId} tone="error">
          {error}
        </ValidationMessage>
      ) : success ? (
        <ValidationMessage id={messageId} tone="success">
          {success}
        </ValidationMessage>
      ) : hint ? (
        <p id={messageId} className={s.hint}>
          {hint}
        </p>
      ) : (
        <ValidationMessage id={messageId} tone="error" />
      )}
    </div>
  );
}
