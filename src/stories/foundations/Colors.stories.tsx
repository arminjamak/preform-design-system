import type { Meta, StoryObj } from '@storybook/react-vite';
import { aliasChain, byPrefix, darkTokens, lightTokens, resolve, type TokenMeta } from './tokens';
import s from './Foundations.module.css';

const meta = { title: 'Foundations/Colors', parameters: { layout: 'padded', controls: { disable: true } } } satisfies Meta;
export default meta;

const PALETTES = ['neutral', 'blue', 'green', 'amber', 'red', 'orange', 'magenta', 'alpha', 'shadow'];

function Palette({ name }: { name: string }) {
  const tokens = byPrefix(`color.${name}.`);
  return (
    <section className={s.section}>
      <h3 className={`${s.h} pf-text-title-sm`}>color.{name}</h3>
      <div className={s.scale}>
        {tokens.map((t) => (
          <div key={t.name} className={s.swatch}>
            <div className={s.chip} style={{ background: `var(${t.name})` }} />
            <span className={`${s.chipLabel} ${s.mono}`}>{t.path.at(-1)}</span>
            <span className={`${s.chipValue} ${s.mono}`}>{resolve(t)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export const Primitives: StoryObj = {
  render: () => (
    <div className={s.page}>
      <div className={s.section}>
        <h2 className={`${s.h} pf-text-heading`}>Primitive palette</h2>
        <p className={`${s.p} pf-text-body`}>
          Raw colour scales anchored on the values used in the PreForm interface (brand blue #0a63c9, nav #2e3640, canvas #e5e8eb…). Components never reference these directly; they go through the semantic
          aliases on the next page.
        </p>
      </div>
      {PALETTES.map((p) => <Palette key={p} name={p} />)}
    </div>
  ),
};

function SemanticTable({ group, list }: { group: string; list: TokenMeta[] }) {
  const tokens = byPrefix(`color.${group}.`, list);
  return (
    <section className={s.section}>
      <h3 className={`${s.h} pf-text-title-sm`}>color.{group}</h3>
      <table className={s.table}>
        <thead>
          <tr><th /><th>Token</th><th>Alias chain</th><th>Resolved</th><th>Use</th></tr>
        </thead>
        <tbody>
          {tokens.map((t) => {
            const chain = aliasChain(t, list);
            return (
              <tr key={t.name}>
                <td><span className={s.dot} style={{ background: `var(${t.name})` }} /></td>
                <td className={s.mono}>{t.name}</td>
                <td className={`${s.mono} ${s.chain}`}>{chain.slice(1).map((c, i) => <span key={c}>{i > 0 && ' → '}<b>{c}</b></span>)}</td>
                <td className={s.mono}>{resolve(lightTokens.find((x) => x.path.join('.') === chain.at(-1)) ?? t)}</td>
                <td className={s.p}>{t.description}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

const SEMANTIC_GROUPS = ['bg', 'fg', 'border', 'focus', 'status', 'control', 'accent-tone'];

export const Semantic: StoryObj = {
  render: () => (
    <div className={s.page}>
      <div className={s.section}>
        <h2 className={`${s.h} pf-text-heading`}>Semantic colours (light)</h2>
        <p className={`${s.p} pf-text-body`}>Purpose-named tokens that alias primitives. Swatches render live, so switch the Theme toolbar to dark to see the same names resolve differently.</p>
      </div>
      {SEMANTIC_GROUPS.map((g) => <SemanticTable key={g} group={g} list={lightTokens} />)}
    </div>
  ),
};

export const SemanticDark: StoryObj = {
  name: 'Semantic (dark overrides)',
  globals: { theme: 'dark' },
  render: () => (
    <div className={s.page}>
      <div className={s.section}>
        <h2 className={`${s.h} pf-text-heading`}>Semantic colours (dark)</h2>
        <p className={`${s.p} pf-text-body`}>Only semantic tokens change between themes; primitives and component tokens are shared.</p>
      </div>
      {SEMANTIC_GROUPS.map((g) => <SemanticTable key={g} group={g} list={darkTokens} />)}
    </div>
  ),
};
