import type { Meta, StoryObj } from '@storybook/react-vite';
import { byPrefix } from './tokens';
import s from './Foundations.module.css';

const meta = { title: 'Foundations/Elevation', parameters: { layout: 'padded', controls: { disable: true } } } satisfies Meta;
export default meta;

export const Shadows: StoryObj = {
  render: () => (
    <div className={s.page}>
      <div className={s.section}>
        <h2 className={`${s.h} pf-text-heading`}>Elevation</h2>
        <p className={`${s.p} pf-text-body`}>Semantic elevation names what is floating (raised control, card, panel, popover, modal) and aliases the primitive shadow scale. Shadow colour is the app's ink #141c26 at increasing alpha.</p>
      </div>
      <section className={s.section}>
        <h3 className={`${s.h} pf-text-title-sm`}>elevation.*</h3>
        <div className={s.row}>
          {byPrefix('elevation.').map((t) => (
            <div key={t.name} className={s.cell}>
              <div className={s.shadowBox} style={{ boxShadow: `var(${t.name})` }} />
              <span className={s.mono}>{t.path.at(-1)}</span>
              <span className={`${s.mono} ${s.p}`}>→ {t.ref}</span>
            </div>
          ))}
        </div>
      </section>
      <section className={s.section}>
        <h3 className={`${s.h} pf-text-title-sm`}>shadow.*</h3>
        <div className={s.row}>
          {byPrefix('shadow.').map((t) => (
            <div key={t.name} className={s.cell}>
              <div className={s.shadowBox} style={{ boxShadow: `var(${t.name})` }} />
              <span className={s.mono}>{t.path.at(-1)}</span>
            </div>
          ))}
        </div>
      </section>
      <section className={s.section}>
        <h3 className={`${s.h} pf-text-title-sm`}>z-index.*</h3>
        <table className={s.table}>
          <tbody>
            {byPrefix('z-index.').map((t) => (
              <tr key={t.name}><td className={s.mono}>{t.name}</td><td className={s.mono}>{String(t.value)}</td><td className={s.p}>{t.description}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  ),
};
