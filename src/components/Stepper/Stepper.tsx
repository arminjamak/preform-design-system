import { CheckIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Spinner } from '../Spinner/Spinner';
import s from './Stepper.module.css';

export type StepStatus = 'pending' | 'active' | 'done' | 'error';
export type Step = { id: string; label: string; status: StepStatus };

export type StepperProps = {
  steps: Step[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
};

/** Progress list from the 1-Click Print panel: done ✓, active spinner, pending outline. */
export function Stepper({ steps, orientation = 'vertical', className }: StepperProps) {
  return (
    <ol className={cx(s.list, orientation === 'horizontal' && s.horizontal, className)}>
      {steps.map((step, i) => (
        <li key={step.id} className={cx(s.step, s[step.status])} aria-current={step.status === 'active' ? 'step' : undefined}>
          <span className={s.marker} aria-hidden="true">
            {step.status === 'done' && <CheckIcon strokeWidth={3} />}
            {step.status === 'active' && <Spinner size="xs" label="" />}
            {step.status === 'error' && <XIcon strokeWidth={3} />}
            {step.status === 'pending' && <span className={s.index}>{i + 1}</span>}
          </span>
          {step.label}
        </li>
      ))}
    </ol>
  );
}
