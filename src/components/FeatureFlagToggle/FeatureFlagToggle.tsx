import type { CSSProperties, HTMLAttributes } from 'react';
import { FlagIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Tone, WithForcedState } from '../../lib/types';
import { Toggle } from '../Toggle/Toggle';
import s from './FeatureFlagToggle.module.css';

export type FlagEnvironment = {
  id: string;
  label: string;
  enabled: boolean;
  /** Percentage of users (0–100) who get the flag while enabled. Omit for an all-or-nothing environment. */
  rollout?: number;
};

export type FeatureFlag = {
  /** Machine key, shown in mono (`supports.ai_protect`). */
  key: string;
  name: string;
  description?: string;
  environments: FlagEnvironment[];
  /** Who made the last change ("Mara Lindqvist"). */
  updatedBy?: string;
  /** When, already formatted ("Today, 14:32"). */
  updatedAt?: string;
};

export type FeatureFlagToggleProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> &
  WithForcedState & {
    flag: FeatureFlag;
    /** Receives the whole flag with the edited environment applied. */
    onChange: (flag: FeatureFlag) => void;
    /** Rollout slider granularity in percent. */
    rolloutStep?: number;
    disabled?: boolean;
    /** `card` is a standalone bordered surface; `row` drops the frame for stacking in a list. */
    variant?: 'card' | 'row';
  };

export type FlagStatus = { label: string; tone: Tone };

const TONE_CLASS: Record<Tone, string> = {
  neutral: s.toneNeutral,
  accent: s.toneAccent,
  success: s.toneSuccess,
  warning: s.toneWarning,
  danger: s.toneDanger,
  info: s.toneInfo,
};

/** Summarises the environments into one badge: Off, Rolling out, On in n of m, Live. */
export function getFlagStatus(envs: FlagEnvironment[]): FlagStatus {
  const on = envs.filter((e) => e.enabled);
  if (on.length === 0) return { label: 'Off', tone: 'neutral' };
  if (on.some((e) => e.rollout !== undefined && e.rollout < 100)) return { label: 'Rolling out', tone: 'info' };
  if (on.length === envs.length) return { label: 'Live', tone: 'success' };
  return { label: `On in ${on.length} of ${envs.length}`, tone: 'warning' };
}

/** Feature flag row for the PreForm admin console: key, description, a switch and rollout slider per environment, status and audit line. */
export function FeatureFlagToggle({ flag, onChange, rolloutStep = 5, disabled, variant = 'card', className, 'data-state': forcedState, ...rest }: FeatureFlagToggleProps) {
  const status = getFlagStatus(flag.environments);

  const patchEnv = (id: string, patch: Partial<FlagEnvironment>) => onChange({ ...flag, environments: flag.environments.map((e) => (e.id === id ? { ...e, ...patch } : e)) });

  return (
    <div className={cx(s.root, s[variant], className)} {...rest}>
      <div className={s.header}>
        <span className={s.icon} aria-hidden="true">
          <FlagIcon />
        </span>
        <div className={s.titles}>
          <span className={s.name}>{flag.name}</span>
          <code className={s.key}>{flag.key}</code>
        </div>
        <span className={cx(s.status, TONE_CLASS[status.tone])}>
          <span className={s.statusDot} aria-hidden="true" />
          {status.label}
        </span>
      </div>
      {flag.description && <p className={s.description}>{flag.description}</p>}

      <ul className={s.envs} aria-label={`${flag.name} environments`}>
        {flag.environments.map((env, i) => {
          const pct = env.rollout ?? 100;
          const envDisabled = disabled || !env.enabled;
          return (
            <li key={env.id} className={cx(s.env, env.enabled && s.envOn)}>
              <label className={s.envHead}>
                <span className={cx(s.dot, env.enabled && s.dotOn)} aria-hidden="true" />
                <span className={s.envLabel}>{env.label}</span>
                <Toggle
                  label={`${flag.name} in ${env.label}`}
                  checked={env.enabled}
                  disabled={disabled}
                  onChange={(v) => patchEnv(env.id, { enabled: v })}
                  data-state={i === 0 ? forcedState : undefined}
                />
              </label>
              {env.rollout !== undefined && (
                <div className={cx(s.rollout, envDisabled && s.rolloutOff)}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={rolloutStep}
                    value={pct}
                    disabled={envDisabled}
                    onChange={(e) => patchEnv(env.id, { rollout: Number(e.target.value) })}
                    aria-label={`${env.label} rollout`}
                    aria-valuetext={`${pct}% of users`}
                    className={s.range}
                    style={{ '--ff-pct': `${pct}%` } as CSSProperties}
                  />
                  <span className={s.pct} aria-hidden="true">
                    {pct}%
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {(flag.updatedBy || flag.updatedAt) && (
        <p className={s.meta}>
          Last changed
          {flag.updatedBy && (
            <>
              {' by '}
              <span className={s.metaStrong}>{flag.updatedBy}</span>
            </>
          )}
          {flag.updatedAt && <> · {flag.updatedAt}</>}
        </p>
      )}
    </div>
  );
}
