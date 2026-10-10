import type { Meta, StoryObj } from '@storybook/react-vite';
import { byPrefix, resolve } from './tokens';
import s from './Foundations.module.css';

const meta = { title: 'Foundations/Radius & Borders', parameters: { layout: 'padded', controls: { disable: true } } } satisfies Meta;
export default meta;

export const Radius: StoryObj = {
  render: () => (
    <div className={s.page}>
      <div className={s.section}>
        <h2 className={`${s.h} pf-text-heading`}>Radius</h2>
        <p className={`${s.p} pf-text-body`}>Pills use <code>radius.full</code>; fields 4px, panels 8px, dialogs 12px.</p>
      </div>
      <div className={s.row}>
        {byPrefix('radius.').map((t) => (
          <div key={t.name} className={s.cell}>
            <div className={s.radiusBox} style={{ borderRadius: `var(${t.name})` }} />
            <span className={s.mono}>{t.path.at(-1)}</span>
            <span className={`${s.mono} ${s.p}`}>{resolve(t)}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Borders: StoryObj = {
  render: () => (
    <div className={s.page}>
      <div className={s.section}><h2 className={`${s.h} pf-text-heading`}>Border widths</h2></div>
      <div className={s.row}>
        {byPrefix('border-width.').map((t) => (
          <div key={t.name} className={s.cell}>
            <div className={s.radiusBox} style={{ borderRadius: 'var(--radius-md)', borderWidth: `var(${t.name})`, borderColor: 'var(--color-border-focus)' }} />
            <span className={s.mono}>{t.name}</span>
            <span className={`${s.mono} ${s.p}`}>{resolve(t)}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};
