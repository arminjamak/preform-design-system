import { useId, useRef, useState, type FormEvent, type FormHTMLAttributes } from 'react';
import { SendIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { ApiKeyField } from '../ApiKeyField/ApiKeyField';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Callout } from '../Callout/Callout';
import { Checkbox } from '../Checkbox/Checkbox';
import { UrlField, validateUrl } from '../FormattedField/FormattedField';
import { SectionTitle } from '../SectionTitle/SectionTitle';
import { Select } from '../Select/Select';
import { TextArea } from '../TextArea/TextArea';
import { Toggle } from '../Toggle/Toggle';
import { ValidationMessage } from '../ValidationMessage/ValidationMessage';
import { ErrorSummary, ServerError, useFocusOnChange, type FormFieldError } from '../SignInForm/FormParts';
import s from './WebhookForm.module.css';

export type WebhookEvent = 'print.started' | 'print.finished' | 'print.failed' | 'printer.offline' | 'printer.online' | 'tank.low' | 'cartridge.low';

export type WebhookContentType = 'application/json' | 'application/x-www-form-urlencoded';

export type WebhookValue = {
  url: string;
  description: string;
  events: WebhookEvent[];
  /** Signing secret used for the `X-Formlabs-Signature` header. */
  secret: string;
  contentType: WebhookContentType;
  active: boolean;
};

export type WebhookTestResult = {
  ok: boolean;
  /** HTTP status returned by the endpoint; omit when the request never connected. */
  status?: number;
  statusText?: string;
  durationMs?: number;
  /** Extra detail, e.g. "Connection timed out after 10 s". */
  message?: string;
};

export type WebhookDelivery = {
  id: string;
  event: WebhookEvent | 'ping';
  status: number;
  timestamp: Date | string;
  durationMs?: number;
};

export const WEBHOOK_EVENT_GROUPS: Array<{ title: string; events: Array<{ id: WebhookEvent; description: string }> }> = [
  {
    title: 'Print',
    events: [
      { id: 'print.started', description: 'A job starts printing' },
      { id: 'print.finished', description: 'A job completes successfully' },
      { id: 'print.failed', description: 'A job is aborted or fails' },
    ],
  },
  {
    title: 'Printer',
    events: [
      { id: 'printer.offline', description: 'A printer stops reporting to Dashboard' },
      { id: 'printer.online', description: 'A printer reconnects' },
    ],
  },
  {
    title: 'Materials',
    events: [
      { id: 'tank.low', description: 'Resin in the tank drops below the fill line' },
      { id: 'cartridge.low', description: 'A cartridge has less than 10% remaining' },
    ],
  },
];

export type WebhookFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'onChange'> & {
  value: WebhookValue;
  onChange: (value: WebhookValue) => void;
  /** Called with a valid value (endpoint URL and at least one event). */
  onSubmit: (value: WebhookValue) => void;
  /** Sends a `ping` delivery to the endpoint. The button is hidden when omitted. */
  onTest?: (value: WebhookValue) => void;
  /** Result of the last test delivery, shown in a Callout. */
  testResult?: WebhookTestResult | null;
  /** Test delivery in flight. */
  testing?: boolean;
  /** Recent deliveries, newest first. */
  deliveries?: WebhookDelivery[];
  /** Rolls the signing secret. */
  onRegenerateSecret?: () => void;
  onCancel?: () => void;
  saving?: boolean;
  /** Server error shown and focused above the form. */
  error?: string;
  submitLabel?: string;
};

const CONTENT_TYPES = [
  { value: 'application/json', label: 'application/json' },
  { value: 'application/x-www-form-urlencoded', label: 'application/x-www-form-urlencoded' },
];

const timeFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' });

/** Dashboard webhook editor: endpoint, print / printer / material events, signing secret, test delivery and recent log. */
export function WebhookForm({
  value,
  onChange,
  onSubmit,
  onTest,
  testResult,
  testing,
  deliveries,
  onRegenerateSecret,
  onCancel,
  saving,
  error,
  submitLabel = 'Save webhook',
  className,
  ...rest
}: WebhookFormProps) {
  const id = useId();
  const ids = { url: `${id}-url`, events: `${id}-events`, eventsMsg: `${id}-events-msg`, content: `${id}-content` };
  const [attempt, setAttempt] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const serverRef = useRef<HTMLDivElement>(null);

  const check = (v: WebhookValue) => {
    const e: Partial<Record<'url' | 'events', string>> = {};
    if (!v.url.trim()) e.url = 'Enter the endpoint URL that should receive events.';
    else {
      const m = validateUrl(v.url);
      if (m) e.url = m;
    }
    if (v.events.length === 0) e.events = 'Select at least one event to send.';
    return e;
  };
  const errors = attempt > 0 ? check(value) : {};
  const summary: FormFieldError[] = [
    errors.url && { target: ids.url, message: errors.url },
    errors.events && { target: ids.events, message: errors.events },
  ].filter(Boolean) as FormFieldError[];

  useFocusOnChange(summaryRef, attempt);
  useFocusOnChange(serverRef, error);

  const patch = (p: Partial<WebhookValue>) => onChange({ ...value, ...p });
  const toggleEvent = (ev: WebhookEvent, on: boolean) => patch({ events: on ? [...value.events.filter((x) => x !== ev), ev] : value.events.filter((x) => x !== ev) });
  const toggleGroup = (events: WebhookEvent[], on: boolean) =>
    patch({ events: on ? Array.from(new Set([...value.events, ...events])) : value.events.filter((x) => !events.includes(x)) });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    if (Object.keys(check(value)).length) {
      setAttempt((n) => n + 1);
      return;
    }
    onSubmit(value);
  };

  return (
    <form noValidate aria-label="Webhook" className={cx(s.form, className)} onSubmit={handleSubmit} {...rest}>
      {error && (
        <ServerError ref={serverRef} title="Couldn’t save the webhook">
          {error}
        </ServerError>
      )}
      {summary.length > 0 && <ErrorSummary ref={summaryRef} errors={summary} />}

      <section className={s.section}>
        <SectionTitle size="sm">Endpoint</SectionTitle>
        <UrlField
          id={ids.url}
          label="Payload URL"
          value={value.url}
          onChange={(url) => patch({ url })}
          error={errors.url}
          required
          fullWidth
          size="md"
          placeholder="https://hooks.example.com/formlabs"
          hint="Formlabs sends a POST request here for every selected event."
          disabled={saving}
        />
        <TextArea
          label="Description"
          value={value.description}
          onChange={(description) => patch({ description })}
          rows={2}
          maxLength={140}
          showCount
          fullWidth
          placeholder="Post failed prints to the #print-farm Slack channel"
          disabled={saving}
        />
      </section>

      <fieldset id={ids.events} className={cx(s.section, s.fieldset)} aria-describedby={ids.eventsMsg}>
        <legend className={s.legend}>
          <SectionTitle size="sm">Events</SectionTitle>
        </legend>
        <div className={cx(s.groups, errors.events && s.groupsInvalid)}>
          {WEBHOOK_EVENT_GROUPS.map((group) => {
            const groupIds = group.events.map((e) => e.id);
            const on = groupIds.filter((e) => value.events.includes(e)).length;
            return (
              <div key={group.title} role="group" aria-label={`${group.title} events`} className={s.group}>
                <Checkbox
                  label={`All ${group.title.toLowerCase()} events`}
                  showLabel
                  checked={on === groupIds.length}
                  indeterminate={on > 0 && on < groupIds.length}
                  onChange={() => toggleGroup(groupIds, on < groupIds.length)}
                  disabled={saving}
                  className={s.groupHead}
                />
                <ul className={s.eventList}>
                  {group.events.map((ev) => (
                    <li key={ev.id}>
                      <label className={s.event}>
                        <Checkbox label={`${ev.id}: ${ev.description}`} checked={value.events.includes(ev.id)} onChange={(c) => toggleEvent(ev.id, c)} disabled={saving} className={s.eventBox} />
                        <span className={s.eventText}>
                          <code className={s.eventName}>{ev.id}</code>
                          <span className={s.eventDesc}>{ev.description}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <ValidationMessage id={ids.eventsMsg} tone="error">
          {errors.events}
        </ValidationMessage>
      </fieldset>

      <section className={s.section}>
        <SectionTitle size="sm">Delivery</SectionTitle>
        <div className={s.field}>
          <span className={s.label}>Signing secret</span>
          <p className={s.hint}>Verify the X-Formlabs-Signature header with this secret to confirm requests come from Formlabs.</p>
          <ApiKeyField
            variant="plain"
            label="Signing secret"
            value={value.secret}
            onRegenerate={onRegenerateSecret}
            regenerateMessage="Deliveries are signed with the new secret right away. Update your endpoint’s verification before the next print event."
          />
        </div>
        <div className={s.inlineRow}>
          <label htmlFor={ids.content} className={s.label}>
            Content type
          </label>
          <Select
            id={ids.content}
            label="Content type"
            value={value.contentType}
            options={CONTENT_TYPES}
            onChange={(v) => patch({ contentType: v as WebhookContentType })}
            disabled={saving}
            className={s.contentType}
          />
        </div>
        <div className={s.inlineRow}>
          <span className={s.toggleText}>
            <span className={s.label}>Active</span>
            <span className={s.hint}>{value.active ? 'Events are delivered as they happen.' : 'Paused. Events are not delivered or queued.'}</span>
          </span>
          <Toggle label="Active" checked={value.active} onChange={(active) => patch({ active })} disabled={saving} />
        </div>
      </section>

      {onTest && (
        <section className={s.section} aria-label="Test delivery">
          <SectionTitle
            size="sm"
            action={
              <Button variant="outline" size="sm" iconStart={<SendIcon strokeWidth={2.2} />} loading={testing} disabled={saving || !value.url.trim()} onClick={() => onTest(value)}>
                {testing ? 'Sending…' : 'Send test event'}
              </Button>
            }
          >
            Test
          </SectionTitle>
          <div aria-live="polite">
            {testResult && (
              <Callout tone={testResult.ok ? 'success' : 'danger'} title={testResult.ok ? 'Test event delivered' : 'Test event failed'}>
                {testResult.status !== undefined ? (
                  <>
                    Your endpoint responded{' '}
                    <code className={s.inlineCode}>
                      {testResult.status}
                      {testResult.statusText ? ` ${testResult.statusText}` : ''}
                    </code>
                    {testResult.durationMs !== undefined ? ` in ${testResult.durationMs} ms` : ''}.
                  </>
                ) : (
                  'No response from your endpoint.'
                )}
                {testResult.message ? ` ${testResult.message}` : ''}
              </Callout>
            )}
          </div>
        </section>
      )}

      {deliveries && (
        <section className={s.section} aria-labelledby={`${id}-log`}>
          <div id={`${id}-log`}>
            <SectionTitle size="sm">Recent deliveries</SectionTitle>
          </div>
          {deliveries.length === 0 ? (
            <p className={s.hint}>No deliveries yet. Events appear here once a printer reports one.</p>
          ) : (
            <ul className={s.log}>
              {deliveries.map((d) => {
                const ok = d.status >= 200 && d.status < 300;
                return (
                  <li key={d.id} className={s.logRow}>
                    <Badge tone={ok ? 'success' : 'danger'} variant="soft" className={cx(s.status, ok ? s.ok : s.fail)}>
                      {d.status === 0 ? 'ERR' : d.status}
                    </Badge>
                    <code className={s.logEvent}>{d.event}</code>
                    <span className={s.logMeta}>
                      {d.durationMs !== undefined && <span>{d.durationMs} ms</span>}
                      <time dateTime={new Date(d.timestamp).toISOString()}>{timeFmt.format(new Date(d.timestamp))}</time>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <footer className={s.footer}>
        {onCancel && (
          <Button variant="outline" size="md" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" size="md" loading={saving} className={s.submit}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </footer>
    </form>
  );
}
