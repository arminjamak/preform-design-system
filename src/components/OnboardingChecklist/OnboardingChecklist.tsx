import { useId, useState, type HTMLAttributes, type ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, PartyPopperIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { IconButton } from '../IconButton/IconButton';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import s from './OnboardingChecklist.module.css';

export type OnboardingStep = {
  id: string;
  title: string;
  description?: ReactNode;
  done: boolean;
  /** Short hint after the title ("2 min"). */
  meta?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export type OnboardingChecklistProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> &
  WithForcedState & {
    title: string;
    /** One line under the title. */
    description?: string;
    steps: OnboardingStep[];
    /** Shows the close button (and the dismiss action once complete). */
    onDismiss?: () => void;
    /** Shows the minimise chevron in the header. */
    collapsible?: boolean;
    /** Controlled minimised state; uncontrolled when omitted. */
    minimized?: boolean;
    onMinimizedChange?: (minimized: boolean) => void;
    /** Controlled expanded step; uncontrolled (defaults to the first open step) when omitted. `null` collapses all. */
    expandedStepId?: string | null;
    onExpandedStepChange?: (id: string | null) => void;
    completeTitle?: string;
    completeDescription?: string;
    /** Freezes the checklist: steps and actions cannot be used. */
    disabled?: boolean;
  };

/** Getting-started card for a new PreForm workspace: progress, check-circle steps that expand to a single action, minimise and dismiss. */
export function OnboardingChecklist({
  title,
  description,
  steps,
  onDismiss,
  collapsible,
  minimized: minimizedProp,
  onMinimizedChange,
  expandedStepId,
  onExpandedStepChange,
  completeTitle = 'You’re ready to print',
  completeDescription = 'Your printer is connected and your first part is on the build platform. Nice work.',
  disabled,
  className,
  'data-state': forcedState,
  ...rest
}: OnboardingChecklistProps) {
  const uid = useId();
  const doneCount = steps.filter((st) => st.done).length;
  const complete = steps.length > 0 && doneCount === steps.length;
  const activeId = steps.find((st) => !st.done)?.id;

  const [minInner, setMinInner] = useState(false);
  const minimized = minimizedProp ?? minInner;
  const setMinimized = (m: boolean) => {
    if (minimizedProp === undefined) setMinInner(m);
    onMinimizedChange?.(m);
  };

  const [expInner, setExpInner] = useState<string | null | undefined>(undefined);
  const expanded = expandedStepId !== undefined ? expandedStepId : expInner !== undefined ? expInner : (activeId ?? null);
  const setExpanded = (id: string | null) => {
    if (expandedStepId === undefined) setExpInner(id);
    onExpandedStepChange?.(id);
  };

  const bodyId = `${uid}-body`;

  return (
    <Card variant="elevated" padding="none" className={cx(s.root, className)} {...rest}>
      <div className={s.header}>
        <div className={s.headRow}>
          <h2 className={s.title} id={`${uid}-title`}>
            {title}
          </h2>
          {collapsible && (
            <IconButton
              label={minimized ? `Expand ${title}` : `Minimise ${title}`}
              icon={minimized ? <ChevronDownIcon strokeWidth={2.4} /> : <ChevronUpIcon strokeWidth={2.4} />}
              size="xs"
              aria-expanded={!minimized}
              aria-controls={bodyId}
              onClick={() => setMinimized(!minimized)}
            />
          )}
          {onDismiss && <IconButton label={`Dismiss ${title}`} icon={<XIcon strokeWidth={2.4} />} size="xs" disabled={disabled} onClick={onDismiss} />}
        </div>
        {description && !minimized && <p className={s.description}>{description}</p>}
        <ProgressBar
          value={doneCount}
          max={steps.length || 1}
          tone={complete ? 'success' : 'accent'}
          label={`${doneCount} of ${steps.length} complete`}
          formatValue={(v, m) => `${v} of ${m} steps complete`}
          className={s.progress}
        />
      </div>

      <div id={bodyId} hidden={minimized} className={s.body}>
        {complete ? (
          <div className={s.finished} role="status">
            <span className={s.doneIcon} aria-hidden="true">
              <PartyPopperIcon />
            </span>
            <p className={s.doneTitle}>{completeTitle}</p>
            <p className={s.doneText}>{completeDescription}</p>
            {onDismiss && (
              <Button variant="primary" disabled={disabled} onClick={onDismiss}>
                Hide checklist
              </Button>
            )}
          </div>
        ) : (
          <ol className={s.steps} aria-labelledby={`${uid}-title`}>
            {steps.map((step) => {
              const status = step.done ? 'done' : step.id === activeId ? 'active' : 'pending';
              const expandable = !!(step.description || step.actionLabel);
              const open = expandable && expanded === step.id;
              const panelId = `${uid}-${step.id}-panel`;
              const statusText = status === 'done' ? 'Completed' : status === 'active' ? 'Next step' : 'Not started';
              const head = (
                <>
                  <span className={s.circle} aria-hidden="true">
                    {step.done && <CheckIcon strokeWidth={3} />}
                  </span>
                  <span className={s.stepTitle}>{step.title}</span>
                  <span className={s.srOnly}>, {statusText}</span>
                  {step.meta && <span className={s.meta}>{step.meta}</span>}
                </>
              );
              return (
                <li key={step.id} className={cx(s.step, s[status], open && s.open)} aria-current={status === 'active' ? 'step' : undefined}>
                  {expandable ? (
                    <button
                      type="button"
                      className={s.stepHead}
                      aria-expanded={open}
                      aria-controls={panelId}
                      disabled={disabled}
                      data-state={status === 'active' ? forcedState : undefined}
                      onClick={() => setExpanded(open ? null : step.id)}
                    >
                      {head}
                      <ChevronDownIcon className={s.chevron} aria-hidden="true" strokeWidth={2.4} />
                    </button>
                  ) : (
                    <div className={s.stepHead}>{head}</div>
                  )}
                  {expandable && (
                    <div id={panelId} hidden={!open} className={s.panel}>
                      {step.description && <p className={s.stepDescription}>{step.description}</p>}
                      {step.actionLabel && (
                        <Button variant={status === 'active' ? 'primary' : 'outline'} disabled={disabled} onClick={step.onAction}>
                          {step.actionLabel}
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Card>
  );
}
