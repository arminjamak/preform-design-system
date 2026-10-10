import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Tone } from '../../lib/types';
import s from './GanttChart.module.css';

export type GanttDateInput = Date | string | number;

export type GanttTask = {
  id: string;
  name: string;
  start: GanttDateInput;
  /** Exclusive end. Milestones use `start` only. */
  end: GanttDateInput;
  /** 0–100. */
  progress?: number;
  /** Rows with the same group are listed under one collapsible header (e.g. per printer). */
  group?: string;
  /** Ids of tasks that must finish first; drawn as arrows. */
  dependsOn?: string[];
  milestone?: boolean;
  /** Status tone or chart series index (1–6). Defaults to the group's series colour. */
  tone?: Tone | number;
  /** Secondary text under the name (material, operator). */
  detail?: string;
};

export type GanttChartProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  tasks: GanttTask[];
  scale: 'day' | 'week';
  startDate: GanttDateInput;
  /** Last day shown (inclusive). */
  endDate: GanttDateInput;
  /** "Now" for the today line; defaults to the current time. */
  today?: GanttDateInput;
  onTaskClick?: (task: GanttTask) => void;
  showDependencies?: boolean;
  /** Groups collapsed initially. */
  defaultCollapsed?: string[];
  /** Header of the name column. */
  nameLabel?: string;
  /** Accessible name of the chart. */
  label?: string;
  locale?: string;
};

/* ---- tiny local date helpers ---- */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
function toDate(v: GanttDateInput): Date {
  if (typeof v === 'string') {
    const m = DATE_ONLY.exec(v);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date(v instanceof Date ? v.getTime() : v);
}
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayDiff = (a: Date, b: Date) => Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
}

const TONE_VAR: Record<Tone, string> = {
  neutral: 'var(--color-chart-series-6)',
  accent: 'var(--color-bg-accent)',
  success: 'var(--color-status-success)',
  warning: 'var(--color-status-warning)',
  danger: 'var(--color-status-danger)',
  info: 'var(--color-status-info)',
};
const seriesVar = (n: number) => `var(--color-chart-series-${((n - 1) % 6 + 6) % 6 + 1})`;
const toneVar = (t: Tone | number | undefined, fallback: string) => (t === undefined ? fallback : typeof t === 'number' ? seriesVar(t) : TONE_VAR[t]);

type Row = { kind: 'group'; key: string; label: string; count: number; from: number; to: number } | { kind: 'task'; key: string; task: GanttTask; color: string; from: number; to: number };

/** Print-schedule timeline: task rows with progress bars, milestones, dependency arrows, day/week scale and a today line, grouped per printer. */
export function GanttChart({
  tasks,
  scale,
  startDate,
  endDate,
  today: todayProp,
  onTaskClick,
  showDependencies = true,
  defaultCollapsed = [],
  nameLabel = 'Task',
  label = 'Schedule',
  locale = 'en-US',
  className,
  style,
  ...rest
}: GanttChartProps) {
  const markerId = `gantt-arrow-${useId().replace(/:/g, '')}`;
  const rangeStart = startOfDay(toDate(startDate));
  const rangeEndDay = startOfDay(toDate(endDate));
  const totalDays = Math.max(1, dayDiff(rangeStart, rangeEndDay) + 1);
  const now = todayProp !== undefined ? toDate(todayProp) : new Date();
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(defaultCollapsed));
  const [active, setActive] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<{ width: number; rows: Record<string, { y: number; h: number }> }>({ width: 0, rows: {} });

  /** Fractional day offset from the range start (DST-safe). */
  const pos = (d: Date) => dayDiff(rangeStart, d) + (d.getHours() * 60 + d.getMinutes()) / 1440;

  const f = useMemo(
    () => ({
      dt: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      day: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }),
      weekdayNarrow: new Intl.DateTimeFormat(locale, { weekday: 'narrow' }),
      monthYear: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
      long: new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }),
    }),
    [locale],
  );

  const groupOrder = useMemo(() => {
    const order: string[] = [];
    tasks.forEach((t) => t.group !== undefined && !order.includes(t.group) && order.push(t.group));
    return order;
  }, [tasks]);

  const rows: Row[] = (() => {
    const out: Row[] = [];
    const taskRow = (t: GanttTask): Row => {
      const a = pos(toDate(t.start));
      const b = t.milestone ? a : Math.max(a, pos(toDate(t.end)));
      const gi = t.group !== undefined ? groupOrder.indexOf(t.group) : -1;
      return { kind: 'task', key: t.id, task: t, color: toneVar(t.tone, gi >= 0 ? seriesVar(gi + 1) : TONE_VAR.accent), from: a, to: b };
    };
    tasks.filter((t) => t.group === undefined).forEach((t) => out.push(taskRow(t)));
    groupOrder.forEach((g) => {
      const members = tasks.filter((t) => t.group === g).map(taskRow);
      out.push({ kind: 'group', key: `group:${g}`, label: g, count: members.length, from: Math.min(...members.map((m) => m.from)), to: Math.max(...members.map((m) => m.to)) });
      if (!collapsed.has(g)) out.push(...members);
    });
    return out;
  })();

  const taskRows = rows.filter((r): r is Extract<Row, { kind: 'task' }> => r.kind === 'task');
  const focusId = active && taskRows.some((r) => r.key === active) ? active : taskRows[0]?.key;

  // Measure timeline width and row centres for dependency arrows.
  const structure = `${rows.map((r) => r.key).join('|')}:${scale}:${totalDays}`;
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const measure = () => {
      const tl = body.querySelector<HTMLElement>('[data-timeline]');
      const out: Record<string, { y: number; h: number }> = {};
      body.querySelectorAll<HTMLElement>('[data-row]').forEach((el) => (out[el.dataset.row!] = { y: el.offsetTop + el.offsetHeight / 2, h: el.offsetHeight }));
      setGeo({ width: tl?.offsetWidth ?? 0, rows: out });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(body);
    return () => ro.disconnect();
  }, [structure]);

  const frac = (v: number) => Math.min(1, Math.max(0, v / totalDays));

  /* ---- scale header segments ---- */
  const dayList = Array.from({ length: totalDays }, (_, i) => addDays(rangeStart, i));
  const segments = (keyOf: (d: Date) => string, labelOf: (first: Date, last: Date) => string) => {
    const segs: Array<{ start: number; len: number; label: string; key: string }> = [];
    dayList.forEach((d, i) => {
      const k = keyOf(d);
      const last = segs[segs.length - 1];
      if (last && last.key === k) last.len++;
      else segs.push({ start: i, len: 1, label: '', key: k });
    });
    segs.forEach((sg) => (sg.label = labelOf(dayList[sg.start], dayList[sg.start + sg.len - 1])));
    return segs;
  };
  const weekKey = (d: Date) => `${d.getFullYear()}-${isoWeek(d)}`;
  const top =
    scale === 'day'
      ? segments(weekKey, (a, b) => `Week ${isoWeek(a)} · ${f.day.formatRange(a, b)}`)
      : segments((d) => `${d.getFullYear()}-${d.getMonth()}`, (a) => f.monthYear.format(a));
  const bottom = scale === 'day' ? dayList.map((d, i) => ({ start: i, len: 1, key: String(i), label: `${f.weekdayNarrow.format(d)} ${d.getDate()}` })) : segments(weekKey, (a) => f.day.format(a));

  const nowPos = pos(now);
  const showToday = nowPos >= 0 && nowPos <= totalDays;

  const describe = (t: GanttTask) => {
    const a = toDate(t.start);
    const parts = [t.name, t.group, t.detail, t.milestone ? `milestone ${f.dt.format(a)}` : `${f.dt.format(a)} to ${f.dt.format(toDate(t.end))}`];
    if (!t.milestone && t.progress !== undefined) parts.push(`${Math.round(t.progress)}% complete`);
    if (t.dependsOn?.length) parts.push(`after ${t.dependsOn.map((id) => tasks.find((x) => x.id === id)?.name ?? id).join(' and ')}`);
    return parts.filter(Boolean).join(', ');
  };

  const onBarKeyDown = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const i = taskRows.findIndex((r) => r.key === id);
    const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: taskRows.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const target = taskRows[Math.max(0, Math.min(taskRows.length - 1, next))];
    if (!target) return;
    setActive(target.key);
    bodyRef.current?.querySelector<HTMLElement>(`[data-bar="${CSS.escape(target.key)}"]`)?.focus();
  };

  /* ---- dependency paths (px geometry from measured rows) ---- */
  const deps: Array<{ key: string; d: string }> = [];
  if (showDependencies && geo.width) {
    const px = (v: number) => frac(v) * geo.width;
    const byId = Object.fromEntries(taskRows.map((r) => [r.key, r]));
    for (const r of taskRows) {
      for (const depId of r.task.dependsOn ?? []) {
        const p = byId[depId];
        const ga = geo.rows[depId];
        const gb = geo.rows[r.key];
        if (!p || !ga || !gb) continue;
        // Leave from the bottom (or top) edge near the end of the predecessor, so the progress label stays clear.
        const dir = gb.y >= ga.y ? 1 : -1;
        const barHalf = p.task.milestone ? 7 : Math.max(2, ga.h / 2 - 8);
        const endX = px(p.to);
        const x1 = p.task.milestone ? endX : Math.max(px(p.from) + 1, endX - 6);
        const y1 = ga.y + dir * barHalf;
        const x2 = px(r.from) - (r.task.milestone ? 7 : 0);
        const y2 = gb.y;
        const g = 6;
        const d =
          x2 - x1 >= g
            ? `M ${x1} ${y1} V ${y2} H ${x2}`
            : `M ${x1} ${y1} V ${y2 - dir * (gb.h / 2)} H ${x2 - g} V ${y2} H ${x2}`;
        deps.push({ key: `${depId}->${r.key}`, d });
      }
    }
  }

  return (
    <div className={cx(s.root, s[scale], className)} style={{ ...style, '--g-days': totalDays } as CSSProperties} {...rest}>
      <div role="grid" aria-label={label} aria-rowcount={rows.length + 1} className={s.scroller}>
        <div role="presentation" className={s.content}>
        <div role="row" className={cx(s.row, s.headRow)} aria-rowindex={1}>
          <div role="columnheader" className={cx(s.name, s.nameHead)}>
            {nameLabel}
          </div>
          <div role="columnheader" className={s.scaleHead} aria-label={`Timeline, ${f.long.format(rangeStart)} to ${f.long.format(rangeEndDay)}`}>
            <div className={s.tier} aria-hidden>
              {top.map((sg) => (
                <span key={sg.key} className={s.tierCell} style={{ left: `${frac(sg.start) * 100}%`, width: `${frac(sg.len) * 100}%` }}>
                  <span className={s.tierLabel}>{sg.label}</span>
                </span>
              ))}
            </div>
            {showToday && (
              <span className={s.todayTag} style={{ '--x': frac(nowPos) } as CSSProperties} aria-hidden>
                Today
              </span>
            )}
            <div className={cx(s.tier, s.tierBottom)} aria-hidden>
              {bottom.map((sg) => {
                const d = dayList[sg.start];
                const weekend = scale === 'day' && (d.getDay() === 0 || d.getDay() === 6);
                const isToday = scale === 'day' && dayDiff(d, now) === 0;
                return (
                  <span key={sg.key} className={cx(s.tierCell, weekend && s.weekendHead, isToday && s.todayHead)} style={{ left: `${frac(sg.start) * 100}%`, width: `${frac(sg.len) * 100}%` }}>
                    {(scale === 'day' || sg.len >= 3) && <span className={s.tierLabel}>{sg.label}</span>}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div ref={bodyRef} role="rowgroup" className={s.body}>
          {rows.map((r, ri) => {
            if (r.kind === 'group') {
              const g = r.label;
              const open = !collapsed.has(g);
              return (
                <div key={r.key} role="row" aria-rowindex={ri + 2} className={cx(s.row, s.groupRow)} data-row={r.key}>
                  <div role="rowheader" className={s.name}>
                    <button
                      type="button"
                      className={s.groupToggle}
                      aria-expanded={open}
                      aria-label={`${g}, ${r.count} ${r.count === 1 ? 'task' : 'tasks'}`}
                      onClick={() =>
                        setCollapsed((c) => {
                          const n = new Set(c);
                          if (n.has(g)) n.delete(g);
                          else n.add(g);
                          return n;
                        })
                      }
                    >
                      {open ? <ChevronDownIcon aria-hidden /> : <ChevronRightIcon aria-hidden />}
                      <span className={s.groupLabel}>{g}</span>
                      <span className={s.count}>{r.count}</span>
                    </button>
                  </div>
                  <div role="gridcell" className={s.timeline} data-timeline>
                    <span className={s.summary} style={{ left: `${frac(r.from) * 100}%`, width: `${(frac(r.to) - frac(r.from)) * 100}%` }} aria-hidden />
                  </div>
                </div>
              );
            }
            const t = r.task;
            const progress = Math.max(0, Math.min(100, t.progress ?? 0));
            const common = {
              type: 'button' as const,
              'data-bar': t.id,
              tabIndex: focusId === t.id ? 0 : -1,
              'aria-label': describe(t),
              title: describe(t),
              onClick: () => onTaskClick?.(t),
              onFocus: () => setActive(t.id),
              onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => onBarKeyDown(e, t.id),
            };
            return (
              <div key={r.key} role="row" aria-rowindex={ri + 2} className={cx(s.row, t.group !== undefined && s.inGroup)} data-row={r.key}>
                <div role="rowheader" className={s.name}>
                  <span className={s.taskName}>{t.name}</span>
                  {t.detail && <span className={s.detail}>{t.detail}</span>}
                </div>
                <div role="gridcell" className={s.timeline} data-timeline style={{ '--bar-color': r.color } as CSSProperties}>
                  {t.milestone ? (
                    <button {...common} className={s.milestone} style={{ left: `${frac(r.from) * 100}%` }}>
                      <span className={s.diamond} aria-hidden />
                      <span className={s.barLabel}>{t.name}</span>
                    </button>
                  ) : (
                    <button {...common} className={s.bar} style={{ left: `${frac(r.from) * 100}%`, width: `${(frac(r.to) - frac(r.from)) * 100}%` }}>
                      <span className={s.fill} style={{ width: `${progress}%` }} aria-hidden />
                      {t.progress !== undefined && <span className={s.barLabel}>{Math.round(progress)}%</span>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {dayList.map((d, i) =>
            i > 0 && (scale === 'day' || d.getDay() === 1) ? <span key={`l${i}`} className={s.vline} style={{ '--x': frac(i) } as CSSProperties} aria-hidden /> : null,
          )}
          {scale === 'day' &&
            dayList.map((d, i) =>
              d.getDay() === 0 || d.getDay() === 6 ? <span key={i} className={s.weekend} style={{ '--x': frac(i), '--w': frac(1) } as CSSProperties} aria-hidden /> : null,
            )}

          {deps.length > 0 && (
            <svg className={s.deps} aria-hidden width={geo.width} height="100%">
              <defs>
                <marker id={markerId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
                  <path d="M 0 0 L 8 4 L 0 8 z" className={s.arrowHead} />
                </marker>
              </defs>
              {deps.map((d) => (
                <path key={d.key} d={d.d} className={s.dep} markerEnd={`url(#${markerId})`} />
              ))}
            </svg>
          )}

          {showToday && (
            <div className={s.todayLine} style={{ '--x': frac(nowPos) } as CSSProperties} aria-hidden />
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
