import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { Badge } from '../../components/Badge/Badge';
import { Segmented } from '../../components/Segmented/Segmented';
import { coverage, docsId, type CoverageKind } from './coverage';
import s from './Coverage.module.css';

const meta = {
  title: 'Coverage',
  tags: ['expanded', '!autodocs'],
  parameters: { layout: 'padded', controls: { disable: true }, docs: { disable: true } },
} satisfies Meta;
export default meta;

const KIND: Record<CoverageKind, { label: string; tone: 'neutral' | 'accent' | 'success' | 'info' }> = {
  existing: { label: 'v1.0 component', tone: 'neutral' },
  variant: { label: 'v1.0 variant', tone: 'neutral' },
  new: { label: 'New in v2.0', tone: 'success' },
  'new-variant': { label: 'v2.0 variant', tone: 'info' },
};

type Filter = 'all' | 'v1' | 'v2';

export const ComponentCoverage: StoryObj = {
  name: 'Component coverage',
  render: function Render() {
    const [filter, setFilter] = useState<Filter>('all');
    const all = coverage.flatMap((g) => g.rows);
    const counts = useMemo(
      () => ({
        total: all.length,
        v1: all.filter((r) => r.kind === 'existing' || r.kind === 'variant').length,
        v2: all.filter((r) => r.kind === 'new' || r.kind === 'new-variant').length,
        components: new Set(all.map((r) => r.provider)).size,
      }),
      [all],
    );
    const keep = (k: CoverageKind) => filter === 'all' || (filter === 'v1' ? k === 'existing' || k === 'variant' : k === 'new' || k === 'new-variant');

    return (
      <div className={s.page}>
        <div className={s.intro}>
          <h2 className={`${s.h} pf-text-heading`}>Component coverage</h2>
          <p className={`${s.p} pf-text-body`}>
            Every item in the 200-pattern UI inventory, mapped to the PreForm component that provides it. Related patterns are grouped into one component with a variant or prop, so the
            library stays small. Follow a link to open that component's docs.
          </p>
        </div>
        <div className={s.summary}>
          <div className={s.tile}><span className={s.tileValue}>{counts.total}</span><span className={s.tileLabel}>Inventory items covered</span></div>
          <div className={s.tile}><span className={s.tileValue}>{counts.components}</span><span className={s.tileLabel}>Components providing them</span></div>
          <div className={s.tile}><span className={s.tileValue}>{counts.v1}</span><span className={s.tileLabel}>Covered by v1.0</span></div>
          <div className={s.tile}><span className={s.tileValue}>{counts.v2}</span><span className={s.tileLabel}>Added in v2.0</span></div>
        </div>
        <div className={s.filters}>
          <Segmented
            label="Show items"
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'v1', label: 'v1.0 only' },
              { value: 'v2', label: 'Added in v2.0' },
            ]}
          />
        </div>
        {coverage.map((group) => {
          const rows = group.rows.filter((r) => keep(r.kind));
          if (!rows.length) return null;
          return (
            <section key={group.title} className={s.group}>
              <div className={s.groupHead}>
                <h3 className={`${s.h} pf-text-title-sm`}>{group.title}</h3>
                <span className={s.count}>{rows.length} items</span>
              </div>
              <div className={s.scroll}>
                <table className={s.table}>
                  <thead>
                    <tr><th>#</th><th>Pattern</th><th>Provided by</th><th>Status</th><th>How</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.n}>
                        <td className={s.num}>{r.n}</td>
                        <td>{r.item}</td>
                        <td>
                          <a className={s.link} href={`./?path=/docs/${docsId(r.story)}`} target="_top">
                            {r.provider}
                          </a>
                        </td>
                        <td><Badge tone={KIND[r.kind].tone} variant="soft">{KIND[r.kind].label}</Badge></td>
                        <td className={`${s.note} ${s.mono}`}>{r.note ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    );
  },
};
