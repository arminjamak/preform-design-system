import type { Meta, StoryObj } from '@storybook/react-vite';
import { byPrefix, resolve } from './tokens';
import s from './Foundations.module.css';

const meta = { title: 'Foundations/Typography', parameters: { layout: 'padded', controls: { disable: true } } } satisfies Meta;
export default meta;

const STYLES = ['display', 'heading', 'title', 'title-sm', 'body-strong', 'body', 'body-sm', 'label', 'label-sm', 'caption', 'mono'];
const SAMPLE: Record<string, string> = {
  display: 'What changed in PreForm',
  heading: 'Supports',
  title: 'Save Profile',
  'title-sm': 'Print Validation',
  'body-strong': 'Mini Chassis Kit',
  body: 'Orients the model with its detailed side facing the platform, then generates supports and a raft.',
  'body-sm': 'Profiles store every auto support setting so you can switch between them.',
  label: 'Generate Supports',
  'label-sm': 'Layer Thickness',
  caption: 'CURRENT',
  mono: '0.050 mm · 129 layers',
};

const lookup = (style: string, prop: string) => {
  const token = byPrefix(`typography.${style}.${prop}`)[0];
  const primitive = token?.ref ? byPrefix(token.ref)[0] : undefined;
  return primitive ? resolve(primitive) : token ? resolve(token) : '';
};

export const TextStyles: StoryObj = {
  render: () => (
    <div className={s.page}>
      <div className={s.section}>
        <h2 className={`${s.h} pf-text-heading`}>Text styles</h2>
        <p className={`${s.p} pf-text-body`}>
          Figtree for UI, JetBrains Mono for values. Each style is a group of four tokens (size, line-height, weight, family) exposed as a <code>.pf-text-*</code> class and as CSS variables.
        </p>
      </div>
      <div>
        {STYLES.map((st) => (
          <div key={st} className={s.typeRow}>
            <div>
              <div className={s.mono}>pf-text-{st}</div>
              <div className={`${s.typeMeta} ${s.mono}`}>
                {lookup(st, 'size')} / {lookup(st, 'line-height')} · {lookup(st, 'weight')}
              </div>
            </div>
            <div className={`pf-text-${st}`}>{SAMPLE[st]}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Scale: StoryObj = {
  name: 'Primitive scale',
  render: () => (
    <div className={s.page}>
      <div className={s.section}>
        <h2 className={`${s.h} pf-text-heading`}>Font primitives</h2>
      </div>
      {['font.family', 'font.size', 'font.weight', 'font.line-height', 'font.letter-spacing'].map((group) => (
        <section key={group} className={s.section}>
          <h3 className={`${s.h} pf-text-title-sm`}>{group}</h3>
          <table className={s.table}>
            <tbody>
              {byPrefix(`${group}.`).map((t) => (
                <tr key={t.name}>
                  <td className={s.mono}>{t.name}</td>
                  <td className={s.mono}>{resolve(t)}</td>
                  <td>
                    <span
                      style={{
                        fontFamily: group === 'font.family' ? `var(${t.name})` : undefined,
                        fontSize: group === 'font.size' ? `var(${t.name})` : undefined,
                        fontWeight: group === 'font.weight' ? `var(${t.name})` as never : undefined,
                        lineHeight: group === 'font.line-height' ? `var(${t.name})` : undefined,
                        letterSpacing: group === 'font.letter-spacing' ? `var(${t.name})` : undefined,
                        display: 'inline-block',
                      }}
                    >
                      Form 3 · Alumina 4N V1
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  ),
};
