import { useEffect, useId, useMemo, useState, type FormEvent, type FormHTMLAttributes, type ReactNode } from 'react';
import { RotateCcwIcon, SearchIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { FieldRow } from '../FieldRow/FieldRow';
import { IconButton } from '../IconButton/IconButton';
import { NumberField } from '../NumberField/NumberField';
import { RadioGroup } from '../RadioGroup/RadioGroup';
import { SectionTitle } from '../SectionTitle/SectionTitle';
import { Segmented } from '../Segmented/Segmented';
import { Select } from '../Select/Select';
import { TextField } from '../TextField/TextField';
import { Toggle } from '../Toggle/Toggle';
import s from './SettingsPanel.module.css';

export type SettingValue = boolean | string | number;
export type SettingsValues = Record<string, SettingValue>;
export type SettingType = 'toggle' | 'select' | 'segmented' | 'number' | 'radio';
export type SettingOption = { value: string; label: string; description?: string; disabled?: boolean };

export type SettingDef = {
  id: string;
  label: string;
  description?: string;
  type: SettingType;
  /** Choices for select, segmented and radio. */
  options?: SettingOption[];
  /** Number fields: unit suffix ("mm", "%"), bounds, step and decimals (inferred from `step`). */
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  /** Value restored by "Reset to defaults". */
  default?: SettingValue;
  /** Extra words the search should match ("telemetry", "analytics"). */
  keywords?: string[];
};

export type SettingsGroup = { title: string; settings: SettingDef[] };
export type SettingsSection = { id: string; label: string; icon?: ReactNode; groups: SettingsGroup[] };

export type SettingsPanelProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'onChange' | 'onSubmit' | 'onReset'> & {
  /** Data-driven schema: sections → groups → settings. */
  sections: SettingsSection[];
  /** Saved values. Edits are held as a draft until Save; the footer appears while the draft differs. */
  value: SettingsValues;
  /** Fires with the whole draft on every edit. */
  onChange?: (draft: SettingsValues) => void;
  /** Save changes. Update `value` to the saved draft to clear the dirty state. */
  onSave: (draft: SettingsValues) => void;
  /** "Reset to defaults" for the visible section; receives the section id and the draft after the reset. */
  onReset?: (sectionId: string, draft: SettingsValues) => void;
  /** Controlled active section. */
  activeSection?: string;
  onSectionChange?: (id: string) => void;
  saving?: boolean;
};

const decimalsOf = (step = 1) => (String(step).split('.')[1] ?? '').length;

function matches(setting: SettingDef, group: SettingsGroup, section: SettingsSection, q: string) {
  const hay = [setting.label, setting.description, group.title, section.label, ...(setting.options ?? []).map((o) => o.label), ...(setting.keywords ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

/** Preferences window: section list, searchable groups of FieldRows, reset to defaults and a Save bar that appears when there are unsaved changes. */
export function SettingsPanel({
  sections,
  value,
  onChange,
  onSave,
  onReset,
  activeSection,
  onSectionChange,
  saving,
  className,
  ...rest
}: SettingsPanelProps) {
  const id = useId();
  const [draft, setDraft] = useState<SettingsValues>(value);
  const [ownSection, setOwnSection] = useState(sections[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const current = activeSection ?? ownSection;

  // A new saved value (after Save, or from outside) replaces the draft. Compared by content so inline objects don't reset edits.
  const valueKey = JSON.stringify(value);
  useEffect(() => setDraft(value), [valueKey]);

  const changed = useMemo(() => Object.keys({ ...value, ...draft }).filter((k) => draft[k] !== value[k]), [draft, value]);
  const dirty = changed.length > 0;

  const update = (next: SettingsValues) => {
    setDraft(next);
    onChange?.(next);
  };
  const set = (key: string, v: SettingValue) => update({ ...draft, [key]: v });

  const selectSection = (sid: string) => {
    setOwnSection(sid);
    onSectionChange?.(sid);
    setQuery('');
  };

  const q = query.trim();
  const visible = q
    ? sections
        .map((sec) => ({ ...sec, groups: sec.groups.map((g) => ({ ...g, settings: g.settings.filter((st) => matches(st, g, sec, q)) })).filter((g) => g.settings.length) }))
        .filter((sec) => sec.groups.length)
    : sections.filter((sec) => sec.id === current);
  const countFor = (sid: string) => visible.find((v) => v.id === sid)?.groups.reduce((n, g) => n + g.settings.length, 0) ?? 0;

  const section = sections.find((sec) => sec.id === current);
  const sectionDefaults = (sec: SettingsSection) => {
    const out: SettingsValues = {};
    for (const g of sec.groups) for (const st of g.settings) if (st.default !== undefined) out[st.id] = st.default;
    return out;
  };
  const atDefaults = section ? Object.entries(sectionDefaults(section)).every(([k, v]) => draft[k] === v) : true;

  const resetSection = () => {
    if (!section) return;
    const next = { ...draft, ...sectionDefaults(section) };
    update(next);
    onReset?.(section.id, next);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (dirty && !saving) onSave(draft);
  };

  const renderControl = (st: SettingDef) => {
    const v = draft[st.id] ?? st.default;
    switch (st.type) {
      case 'toggle':
        return <Toggle label={st.label} checked={Boolean(v)} onChange={(c) => set(st.id, c)} disabled={saving} />;
      case 'select':
        return <Select label={st.label} value={String(v ?? '')} options={st.options ?? []} onChange={(o) => set(st.id, o)} disabled={saving} className={s.select} />;
      case 'segmented':
        return <Segmented label={st.label} value={String(v ?? '')} options={st.options ?? []} onChange={(o) => set(st.id, o)} size="sm" disabled={saving} />;
      case 'number':
        return (
          <NumberField
            label={st.label}
            value={Number(v ?? 0)}
            onChange={(n) => set(st.id, n)}
            unit={st.unit}
            min={st.min}
            max={st.max}
            step={st.step ?? 1}
            decimals={st.decimals ?? decimalsOf(st.step)}
            disabled={saving}
          />
        );
      case 'radio':
        return <RadioGroup label={st.label} hideLabel value={String(v ?? '')} options={st.options ?? []} onChange={(o) => set(st.id, o)} disabled={saving} />;
    }
  };

  return (
    <form noValidate aria-label="Settings" className={cx(s.root, className)} onSubmit={handleSubmit} {...rest}>
      <aside className={s.sidebar}>
        <TextField
          type="search"
          label="Search settings"
          placeholder="Search settings"
          value={query}
          onChange={setQuery}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
            if (e.key === 'Escape' && query) {
              e.preventDefault();
              e.stopPropagation();
              setQuery('');
            }
          }}
          iconStart={<SearchIcon strokeWidth={2.2} aria-hidden="true" />}
          iconEnd={query ? <IconButton label="Clear search" icon={<XIcon strokeWidth={2.4} />} size="xs" onClick={() => setQuery('')} /> : undefined}
          fullWidth
          className={s.search}
        />
        <nav aria-label="Settings sections">
          <ul className={s.nav}>
            {sections.map((sec) => {
              const count = q ? countFor(sec.id) : null;
              const active = !q && sec.id === current;
              const sectionDirty = sec.groups.some((g) => g.settings.some((st) => changed.includes(st.id)));
              return (
                <li key={sec.id}>
                  <button
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    className={cx(s.navItem, active && s.navActive, count === 0 && s.navEmpty)}
                    onClick={() => selectSection(sec.id)}
                  >
                    {sec.icon && (
                      <span className={s.navIcon} aria-hidden="true">
                        {sec.icon}
                      </span>
                    )}
                    <span className={s.navLabel}>{sec.label}</span>
                    {count !== null ? (
                      <span className={s.navCount} aria-label={`${count} matching`}>
                        {count}
                      </span>
                    ) : (
                      sectionDirty && <span className={s.navDot} role="img" aria-label="Unsaved changes" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className={s.main}>
        <div className={s.scroll}>
          {!q && section && (
            <header className={s.header}>
              <h2 id={`${id}-${section.id}`} className={s.heading}>
                {section.label}
              </h2>
              <Button variant="ghost" size="sm" iconStart={<RotateCcwIcon strokeWidth={2.2} />} onClick={resetSection} disabled={atDefaults || saving}>
                Reset to defaults
              </Button>
            </header>
          )}
          {q && (
            <p className={s.results} role="status">
              {visible.length === 0 ? `No settings match “${q}”.` : `Settings matching “${q}”`}
            </p>
          )}

          {visible.map((sec) => (
            <section key={sec.id} aria-labelledby={`${id}-${sec.id}`} className={s.section}>
              {q && (
                <h2 id={`${id}-${sec.id}`} className={s.searchHeading}>
                  {sec.label}
                </h2>
              )}
              {sec.groups.map((g) => (
                <div key={g.title} className={s.group}>
                  <SectionTitle size="sm">{g.title}</SectionTitle>
                  <div className={s.rows}>
                    {g.settings.map((st) => (
                      <FieldRow
                        key={st.id}
                        label={st.label}
                        hint={st.description}
                        layout={st.type === 'radio' ? 'stacked' : 'inline'}
                        className={cx(s.setting, st.type === 'radio' && s.stacked, changed.includes(st.id) && s.changed)}
                      >
                        {renderControl(st)}
                      </FieldRow>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>

        {dirty && (
          <footer className={s.footer}>
            <span className={s.footerText} role="status">
              {changed.length === 1 ? '1 unsaved change' : `${changed.length} unsaved changes`}
            </span>
            <Button variant="outline" size="md" onClick={() => update(value)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </footer>
        )}
      </div>
    </form>
  );
}
