import type { Meta, StoryObj } from '@storybook/react-vite';
import { byPrefix, resolve } from './tokens';
import s from './Foundations.module.css';

const meta = { title: 'Foundations/Motion', parameters: { layout: 'padded', controls: { disable: true } } } satisfies Meta;
export default meta;

export const Durations: StoryObj = {
  render: () => (
    <div className={s.page}>
      <div className={s.section}>
        <h2 className={`${s.h} pf-text-heading`}>Motion</h2>
        <p className={`${s.p} pf-text-body`}>Hover each tile. Colour changes use <code>duration.fast</code>; overlays enter with <code>duration.base</code> and the <code>easing.standard</code> ease-out quint. Reduced-motion users get instant transitions.</p>
      </div>
      <div className={s.row}>
        {byPrefix('motion.duration.').map((d) =>
          byPrefix('motion.easing.').map((e) => (
            <div key={d.name + e.name} className={`${s.cell} ${s.motionCell}`} style={{ width: 'calc(var(--size-control-xl) * 2.5)' }}>
              <div className={s.motionBox} style={{ transitionDuration: `var(${d.name})`, transitionTimingFunction: `var(${e.name})` }} />
              <span className={s.mono}>{d.path.at(-1)} · {e.path.at(-1)}</span>
              <span className={`${s.mono} ${s.p}`}>{resolve(d)}</span>
            </div>
          )),
        )}
      </div>
      <section className={s.section}>
        <h3 className={`${s.h} pf-text-title-sm`}>opacity.*</h3>
        <table className={s.table}>
          <tbody>
            {byPrefix('opacity.').map((t) => (
              <tr key={t.name}><td className={s.mono}>{t.name}</td><td className={s.mono}>{String(t.value)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  ),
};
