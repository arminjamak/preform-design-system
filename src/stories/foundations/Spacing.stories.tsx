import type { Meta, StoryObj } from '@storybook/react-vite';
import { byPrefix, resolve } from './tokens';
import s from './Foundations.module.css';

const meta = { title: 'Foundations/Spacing & Sizing', parameters: { layout: 'padded', controls: { disable: true } } } satisfies Meta;
export default meta;

export const Spacing: StoryObj = {
  render: () => (
    <div className={s.page}>
      <div className={s.section}>
        <h2 className={`${s.h} pf-text-heading`}>Spacing</h2>
        <p className={`${s.p} pf-text-body`}>A 4pt scale. <code>space.px</code> and <code>space.half</code> exist for hairlines and the 2px insets inside toggles and segmented controls; everything else is a multiple of 4.</p>
      </div>
      <div>
        {byPrefix('space.').map((t) => (
          <div key={t.name} className={s.spaceRow}>
            <span className={s.mono}>{t.name}</span>
            <span className={`${s.mono} ${s.p}`}>{resolve(t)}</span>
            <span className={s.bar} style={{ width: `var(${t.name})` }} />
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Sizes: StoryObj = {
  render: () => (
    <div className={s.page}>
      <div className={s.section}>
        <h2 className={`${s.h} pf-text-heading`}>Sizes</h2>
        <p className={`${s.p} pf-text-body`}>Control heights, icon sizes, field widths and layout dimensions, all on the 4pt grid (the app's 38px rail and nav become 40px).</p>
      </div>
      {['size.control', 'size.icon', 'size.field', 'size.layout'].map((group) => (
        <section key={group} className={s.section}>
          <h3 className={`${s.h} pf-text-title-sm`}>{group}</h3>
          {byPrefix(`${group}.`).map((t) => (
            <div key={t.name} className={s.spaceRow}>
              <span className={s.mono}>{t.path.at(-1)}</span>
              <span className={`${s.mono} ${s.p}`}>{resolve(t)}</span>
              <span className={s.bar} style={{ width: `min(100%, var(${t.name}))`, height: group === 'size.control' || group === 'size.icon' ? `var(${t.name})` : undefined }} />
            </div>
          ))}
        </section>
      ))}
    </div>
  ),
};

export const ComponentTokens: StoryObj = {
  name: 'Component tokens',
  render: () => (
    <div className={s.page}>
      <div className={s.section}>
        <h2 className={`${s.h} pf-text-heading`}>Component tokens</h2>
        <p className={`${s.p} pf-text-body`}>Component-scoped aliases. Re-skin a component by re-pointing these without editing its CSS.</p>
      </div>
      <table className={s.table}>
        <thead><tr><th>Token</th><th>Aliases</th><th>Resolved</th></tr></thead>
        <tbody>
          {byPrefix('component.').map((t) => (
            <tr key={t.name}>
              <td className={s.mono}>{t.name}</td>
              <td className={`${s.mono} ${s.chain}`}>{t.ref}</td>
              <td className={s.mono}>{resolve(byPrefix(t.ref ?? '')[0] ?? t)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};
