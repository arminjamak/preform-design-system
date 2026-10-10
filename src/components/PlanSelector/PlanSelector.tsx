import { useId, useState, type HTMLAttributes } from 'react';
import { CheckIcon, ChevronDownIcon, MinusIcon, SparklesIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Segmented } from '../Segmented/Segmented';
import s from './PlanSelector.module.css';

export type BillingPeriod = 'monthly' | 'yearly';

export type Plan = {
  id: string;
  name: string;
  /** One line under the name ("For a single Form 4 on your desk"). */
  tagline?: string;
  /** Price per month when billed monthly. `0` reads "Free"; `null` reads "Custom". */
  priceMonthly: number | null;
  /** Total price per year when billed yearly. Shown as a per-month equivalent. Defaults to 12 × monthly. */
  priceYearly?: number | null;
  /** Price unit suffix ("per printer"). */
  unit?: string;
  features: string[];
  recommended?: boolean;
  /** Overrides the computed call to action ("Upgrade to Pro", "Contact sales"…). */
  ctaLabel?: string;
};

export type PlanComparisonRow = {
  id: string;
  label: string;
  /** planId → value. `true` renders a check, `false`/missing a dash, strings as text. */
  values: Record<string, string | boolean>;
};

export type PlanSelectorProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> &
  WithForcedState & {
    plans: Plan[];
    /** Selected plan id. */
    value: string;
    onChange: (planId: string) => void;
    period: BillingPeriod;
    onPeriodChange: (period: BillingPeriod) => void;
    /** The workspace's plan today: gets a "Current plan" badge and a disabled CTA. */
    currentPlanId?: string;
    /** Called by each card's call-to-action button. */
    onPlanAction?: (planId: string, period: BillingPeriod) => void;
    /** Rows for the comparison table; the toggle is hidden when empty. */
    comparison?: PlanComparisonRow[];
    /** Controlled comparison visibility; uncontrolled when omitted. */
    comparisonOpen?: boolean;
    onComparisonOpenChange?: (open: boolean) => void;
    /** Badge beside the billing switch. Empty string hides it. */
    yearlySavingsLabel?: string;
    /** ISO 4217 currency for price formatting. */
    currency?: string;
    /** Hide the built-in monthly/yearly switch when the page renders its own. */
    hidePeriodSwitch?: boolean;
    /** Accessible name of the plan radiogroup. */
    label?: string;
    disabled?: boolean;
  };

const formatPrice = (amount: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: amount % 1 === 0 ? 0 : 2 }).format(amount);

type PriceInfo = { main: string; suffix?: string; note?: string };

function priceInfo(plan: Plan, period: BillingPeriod, currency: string): PriceInfo {
  if (plan.priceMonthly === null) return { main: 'Custom', note: 'Volume pricing for fleets' };
  if (plan.priceMonthly === 0) return { main: 'Free', note: 'No card required' };
  const unit = plan.unit ? ` ${plan.unit}` : '';
  if (period === 'monthly') return { main: formatPrice(plan.priceMonthly, currency), suffix: `/month${unit}`, note: 'Billed monthly' };
  const yearly = plan.priceYearly ?? plan.priceMonthly * 12;
  if (yearly === null) return { main: 'Custom', note: 'Volume pricing for fleets' };
  return { main: formatPrice(Math.round((yearly / 12) * 100) / 100, currency), suffix: `/month${unit}`, note: `${formatPrice(yearly, currency)} billed yearly` };
}

/** Billing plan picker for PreForm cloud (Free / Pro / Business / Enterprise): radiogroup of plan cards, monthly/yearly switch and an optional comparison table. */
export function PlanSelector({
  plans,
  value,
  onChange,
  period,
  onPeriodChange,
  currentPlanId,
  onPlanAction,
  comparison,
  comparisonOpen,
  onComparisonOpenChange,
  yearlySavingsLabel = 'Save 20%',
  currency = 'USD',
  label = 'Choose a plan',
  hidePeriodSwitch,
  disabled,
  className,
  'data-state': forcedState,
  ...rest
}: PlanSelectorProps) {
  const name = useId();
  const tableId = useId();
  const [openInner, setOpenInner] = useState(false);
  const open = comparisonOpen ?? openInner;
  const setOpen = (o: boolean) => {
    if (comparisonOpen === undefined) setOpenInner(o);
    onComparisonOpenChange?.(o);
  };
  const currentIndex = plans.findIndex((p) => p.id === currentPlanId);

  const ctaFor = (plan: Plan, i: number): string => {
    if (plan.ctaLabel) return plan.ctaLabel;
    if (plan.id === currentPlanId) return 'Current plan';
    if (plan.priceMonthly === null) return 'Contact sales';
    if (currentIndex >= 0) return i > currentIndex ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`;
    return `Choose ${plan.name}`;
  };

  return (
    <div className={cx(s.root, className)} {...rest}>
      {!hidePeriodSwitch && (
        <div className={s.periodRow}>
          <Segmented<BillingPeriod>
            label="Billing period"
            value={period}
            onChange={onPeriodChange}
            disabled={disabled}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
          {yearlySavingsLabel && (
            <span className={cx(s.status, period === 'yearly' ? s.toneSuccess : s.toneNeutral)}>
              <span className={s.statusDot} aria-hidden="true" />
              {yearlySavingsLabel}
            </span>
          )}
        </div>
      )}

      <div role="radiogroup" aria-label={label} aria-disabled={disabled || undefined} className={s.grid}>
        {plans.map((plan, i) => {
          const selected = plan.id === value;
          const current = plan.id === currentPlanId;
          const price = priceInfo(plan, period, currency);
          const nameId = `${name}-${plan.id}-name`;
          const priceId = `${name}-${plan.id}-price`;
          return (
            <div key={plan.id} className={cx(s.card, selected && s.selected, plan.recommended && s.recommended, disabled && s.disabled)} data-state={i === 0 ? forcedState : undefined}>
              {plan.recommended && (
                <span className={s.ribbon}>
                  <SparklesIcon aria-hidden="true" />
                  Recommended
                </span>
              )}
              <label className={s.head}>
                <input
                  type="radio"
                  name={name}
                  value={plan.id}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => onChange(plan.id)}
                  aria-labelledby={nameId}
                  aria-describedby={priceId}
                  className={s.input}
                />
                <span className={s.radioDot} aria-hidden="true" />
                <span id={nameId} className={s.name}>
                  {plan.name}
                </span>
                {current && (
                  <Badge tone="accent" variant="solid" className={s.currentBadge}>
                    Current plan
                  </Badge>
                )}
              </label>
              {/* The whole card is a pointer target; keyboard users choose with the radio (arrow keys). */}
              <div className={s.body} onClick={() => !disabled && onChange(plan.id)}>
                {plan.tagline && <p className={s.tagline}>{plan.tagline}</p>}
                <p id={priceId} className={s.priceBlock}>
                  <span className={s.price}>{price.main}</span>
                  {price.suffix && <span className={s.priceSuffix}>{price.suffix}</span>}
                  {price.note && <span className={s.priceNote}>{price.note}</span>}
                </p>
                <ul className={s.features} aria-label={`${plan.name} includes`}>
                  {plan.features.map((f) => (
                    <li key={f} className={s.feature}>
                      <CheckIcon aria-hidden="true" strokeWidth={2.6} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={s.cta}>
                <Button
                  variant={selected && !current ? 'primary' : 'outline'}
                  fullWidth
                  disabled={disabled || current}
                  onClick={() => {
                    onChange(plan.id);
                    onPlanAction?.(plan.id, period);
                  }}
                  aria-label={`${ctaFor(plan, i)}${current ? '' : `, ${price.main}${price.suffix ?? ''}`}`}
                >
                  {ctaFor(plan, i)}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {comparison && comparison.length > 0 && (
        <div className={s.compare}>
          <Button variant="ghost" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={tableId} iconEnd={<ChevronDownIcon className={cx(s.chevron, open && s.chevronOpen)} />}>
            {open ? 'Hide plan comparison' : 'Compare all features'}
          </Button>
          <div id={tableId} hidden={!open} className={s.tableWrap}>
            <table className={s.table}>
              <caption className={s.srOnly}>Plan comparison</caption>
              <thead>
                <tr>
                  <th scope="col" className={s.featureHead}>
                    Feature
                  </th>
                  {plans.map((p) => (
                    <th key={p.id} scope="col" className={cx(s.planHead, p.id === value && s.colSelected)}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className={s.rowHead}>
                      {row.label}
                    </th>
                    {plans.map((p) => (
                      <td key={p.id} className={cx(s.valueCell, p.id === value && s.colSelected)}>
                        <ComparisonValue value={row.values[p.id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonValue({ value }: { value: string | boolean | undefined }) {
  if (value === true)
    return (
      <span className={s.yes} role="img" aria-label="Included">
        <CheckIcon strokeWidth={2.6} />
      </span>
    );
  if (value === false || value === undefined || value === '')
    return (
      <span className={s.no} role="img" aria-label="Not included">
        <MinusIcon strokeWidth={2} />
      </span>
    );
  return <span>{value}</span>;
}
