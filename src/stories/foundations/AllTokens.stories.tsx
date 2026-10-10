import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TextField } from '../../components';
import { lightTokens, resolve } from './tokens';
import s from './Foundations.module.css';

const meta = { title: 'Foundations/Tokens', parameters: { layout: 'padded', controls: { disable: true } } } satisfies Meta;
export default meta;

export const Reference: StoryObj = {
  name: 'All tokens',
  render: function Render() {
    const [q, setQ] = useState('');
    const rows = lightTokens.filter((t) => !q || t.name.includes(q) || (t.description ?? '').toLowerCase().includes(q.toLowerCase()));
    return (
      <div className={s.page}>
        <div className={s.section}>
          <h2 className={`${s.h} pf-text-heading`}>Token reference</h2>
          <p className={`${s.p} pf-text-body`}>Every CSS custom property emitted by <code>npm run tokens</code> from <code>tokens/src/*.json</code> (W3C DTCG format), with its tier and alias.</p>
          <div className={s.toolbar}>
            <TextField label="Filter tokens" value={q} onChange={setQ} placeholder="Filter, e.g. --color-bg" size="md" fullWidth />
            <span className={`${s.p} pf-text-label-sm`}>{rows.length} tokens</span>
          </div>
        </div>
        <table className={s.table}>
          <thead><tr><th>Tier</th><th>Variable</th><th>Type</th><th>Alias</th><th>Value</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.name}>
                <td className={s.p}>{t.tier}</td>
                <td className={s.mono}>{t.name}</td>
                <td className={s.p}>{t.type}</td>
                <td className={`${s.mono} ${s.chain}`}>{t.ref ?? ''}</td>
                <td className={s.mono}>{t.type === 'color' && <span className={s.dot} style={{ background: `var(${t.name})`, marginRight: 'var(--space-2)' }} />}{resolve(t)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};
