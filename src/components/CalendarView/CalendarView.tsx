import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Tone } from '../../lib/types';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Popover } from '../Popover/Popover';
import { Segmented } from '../Segmented/Segmented';
import {
  addDays,
  addMinutes,
  addMonths,
  dayDiff,
  fmt,
  isoDay,
  minutesOfDay,
  sameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDate,
  type DateInput,
} from './dates';
import s from './CalendarView.module.css';

export type { DateInput } from './dates';

/** Chart series index (1–6) or a status tone. */
export type CalendarEventColor = number | Tone;

export type CalendarEvent = {
  id: string;
  title: string;
  start: DateInput;
  /** Exclusive end for timed events; for all-day events the last day included. */
  end: DateInput;
  allDay?: boolean;
  color?: CalendarEventColor;
  /** Extra line for the accessible label and overflow list (printer, location). */
  detail?: string;
};

export type CalendarViewMode = 'month' | 'week';

export type CalendarSlot = { start: Date; end: Date; allDay: boolean };

export type CalendarViewProps = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onChange'> & {
  events: CalendarEvent[];
  view: CalendarViewMode;
  /** Any date inside the visible month/week. */
  date: DateInput;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarViewMode) => void;
  onEventClick?: (event: CalendarEvent) => void;
  /** Click or Enter on an empty day (month, all-day row) or time slot (week). */
  onSlotClick?: (slot: CalendarSlot) => void;
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** "Now" for the today marker; defaults to the current time. */
  today?: DateInput;
  /** First and last (exclusive) hour of the week time grid. */
  dayStartHour?: number;
  dayEndHour?: number;
  /** Rows of events per day before collapsing into "+N more". */
  maxEventsPerDay?: number;
  locale?: string;
  /** Extra toolbar content (filters, "New job" button) placed before the view switch. */
  actions?: ReactNode;
};

type Item = { ev: CalendarEvent; start: Date; end: Date; allDay: boolean; firstDay: Date; lastDay: Date; multi: boolean };
type Seg = { item: Item; startCol: number; endCol: number; lane: number; contBefore: boolean; contAfter: boolean; visible: boolean };

const TONE_VAR: Record<Tone, string> = {
  neutral: 'var(--color-chart-series-6)',
  accent: 'var(--color-bg-accent)',
  success: 'var(--color-status-success)',
  warning: 'var(--color-status-warning)',
  danger: 'var(--color-status-danger)',
  info: 'var(--color-status-info)',
};
export const eventColor = (c?: CalendarEventColor) => (typeof c === 'number' ? `var(--color-chart-series-${((c - 1) % 6 + 6) % 6 + 1})` : TONE_VAR[c ?? 'accent']);

function normalize(ev: CalendarEvent): Item {
  const start = toDate(ev.start);
  let end = toDate(ev.end);
  if (end < start) end = start;
  const allDay = !!ev.allDay;
  const firstDay = startOfDay(start);
  const lastDay = allDay ? startOfDay(end) : startOfDay(end > start ? new Date(end.getTime() - 1) : end);
  return { ev, start, end, allDay, firstDay, lastDay, multi: dayDiff(firstDay, lastDay) > 0 };
}

const byStart = (a: Item, b: Item) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime();

/** Packs day-spanning segments of one row (a week) into lanes; lanes ≥ max collapse into "+N more". */
function layoutRow(rowStart: Date, days: number, items: Item[], max: number) {
  const rowEnd = addDays(rowStart, days - 1);
  const segs: Seg[] = items
    .filter((i) => i.lastDay >= rowStart && i.firstDay <= rowEnd)
    .map((i) => ({
      item: i,
      startCol: Math.max(0, dayDiff(rowStart, i.firstDay)),
      endCol: Math.min(days - 1, dayDiff(rowStart, i.lastDay)),
      lane: 0,
      contBefore: i.firstDay < rowStart,
      contAfter: i.lastDay > rowEnd,
      visible: true,
    }))
    .sort((a, b) => a.startCol - b.startCol || b.endCol - b.startCol - (a.endCol - a.startCol) || Number(b.item.allDay) - Number(a.item.allDay) || byStart(a.item, b.item));
  const laneEnds: number[] = [];
  for (const sg of segs) {
    let lane = laneEnds.findIndex((end) => end < sg.startCol);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = sg.endCol;
    sg.lane = lane;
  }
  const overflowCols = new Set<number>();
  segs.forEach((sg) => {
    if (sg.lane >= max) for (let c = sg.startCol; c <= sg.endCol; c++) overflowCols.add(c);
  });
  const hidden = Array.from({ length: days }, () => 0);
  for (const sg of segs) {
    const covers = Array.from({ length: sg.endCol - sg.startCol + 1 }, (_, k) => sg.startCol + k);
    sg.visible = sg.lane < max - 1 || (sg.lane === max - 1 && !covers.some((c) => overflowCols.has(c)));
    if (!sg.visible) covers.forEach((c) => hidden[c]++);
  }
  const lanes = Math.min(laneEnds.length, max);
  return { segs, hidden, lanes };
}

/** Side-by-side columns for overlapping timed events in one day. */
function layoutDay(items: Item[]) {
  const sorted = [...items].sort(byStart);
  const out: Array<{ item: Item; col: number; cols: number }> = [];
  let cluster: Array<{ item: Item; col: number; cols: number }> = [];
  let colEnds: number[] = [];
  let clusterEnd = -Infinity;
  const flush = () => {
    cluster.forEach((c) => (c.cols = colEnds.length));
    out.push(...cluster);
    cluster = [];
    colEnds = [];
  };
  for (const item of sorted) {
    if (item.start.getTime() >= clusterEnd) flush();
    let col = colEnds.findIndex((end) => end <= item.start.getTime());
    if (col < 0) col = colEnds.length;
    colEnds[col] = item.end.getTime();
    clusterEnd = Math.max(clusterEnd, item.end.getTime());
    cluster.push({ item, col, cols: 1 });
  }
  flush();
  return out;
}

type Focus = { day: Date; hour: number | null };

/** Month and week calendar for print schedules, maintenance and post-processing. Grid semantics with roving focus. */
export function CalendarView({
  events,
  view,
  date,
  onDateChange,
  onViewChange,
  onEventClick,
  onSlotClick,
  weekStartsOn = 1,
  today: todayProp,
  dayStartHour = 7,
  dayEndHour = 21,
  maxEventsPerDay = 3,
  locale = 'en-US',
  actions,
  className,
  ...rest
}: CalendarViewProps) {
  const anchor = startOfDay(toDate(date));
  const now = todayProp !== undefined ? toDate(todayProp) : new Date();
  const max = Math.max(1, maxEventsPerDay);
  const gridRef = useRef<HTMLDivElement>(null);
  const wantFocus = useRef(false);
  const [focus, setFocus] = useState<Focus>({ day: anchor, hour: null });
  const [moreOpen, setMoreOpen] = useState<string | null>(null);

  const f = useMemo(
    () => ({
      month: fmt(locale, { month: 'long', year: 'numeric' }),
      weekdayShort: fmt(locale, { weekday: 'short' }),
      weekdayLong: fmt(locale, { weekday: 'long' }),
      dayLong: fmt(locale, { weekday: 'long', month: 'long', day: 'numeric' }),
      time: fmt(locale, { hour: 'numeric', minute: '2-digit' }),
      hour: fmt(locale, { hour: 'numeric' }),
      range: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }),
    }),
    [locale],
  );
  const items = useMemo(() => events.map(normalize), [events]);

  // Visible range
  const rangeStart = view === 'month' ? startOfWeek(startOfMonth(anchor), weekStartsOn) : startOfWeek(anchor, weekStartsOn);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const weeks = view === 'month' ? Math.ceil((dayDiff(rangeStart, monthEnd) + 1) / 7) : 1;
  const rangeEnd = addDays(rangeStart, weeks * 7 - 1);
  const inRange = (d: Date) => d >= rangeStart && d <= rangeEnd;
  const days = (start: Date) => Array.from({ length: 7 }, (_, i) => addDays(start, i));

  // Keep the roving focus inside the visible range when the range changes.
  const focusDay = inRange(focus.day) ? focus.day : inRange(anchor) ? anchor : rangeStart;
  const focusHour = view === 'week' ? focus.hour : null;
  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    const key = `${isoDay(focusDay)}|${focusHour ?? 'all'}`;
    gridRef.current?.querySelector<HTMLElement>(`[data-cell="${key}"]`)?.focus();
  });

  const title =
    view === 'month' ? f.month(anchor) : f.range.formatRange(rangeStart, rangeEnd);
  const shift = (dir: number) => onDateChange(view === 'month' ? addMonths(anchor, dir) : addDays(anchor, dir * 7));

  const timeRange = (i: Item) => (i.allDay ? 'All day' : `${f.time(i.start)} – ${f.time(i.end)}`);
  const eventLabel = (i: Item) => {
    const when = i.allDay
      ? i.multi
        ? `${f.dayLong(i.firstDay)} to ${f.dayLong(i.lastDay)}, all day`
        : `${f.dayLong(i.firstDay)}, all day`
      : i.multi
        ? `${f.dayLong(i.start)} ${f.time(i.start)} to ${f.dayLong(i.end)} ${f.time(i.end)}`
        : `${f.dayLong(i.start)}, ${f.time(i.start)} to ${f.time(i.end)}`;
    return [i.ev.title, i.ev.detail, when].filter(Boolean).join(', ');
  };
  const evStyle = (i: Item, extra: Record<string, string | number> = {}) => ({ '--ev-color': eventColor(i.ev.color), ...extra }) as CSSProperties;

  const clickEvent = (e: MouseEvent, i: Item) => {
    e.stopPropagation();
    setMoreOpen(null);
    onEventClick?.(i.ev);
  };

  const moveFocus = (next: Focus) => {
    wantFocus.current = true;
    setFocus(next);
    if (!inRange(next.day)) onDateChange(next.day);
  };

  const onCellKeyDown = (e: KeyboardEvent<HTMLDivElement>, day: Date, hour: number | null) => {
    if (e.target !== e.currentTarget) return;
    const lastHour = dayEndHour - 1;
    let next: Focus | null = null;
    switch (e.key) {
      case 'ArrowLeft':
        next = { day: addDays(day, -1), hour };
        break;
      case 'ArrowRight':
        next = { day: addDays(day, 1), hour };
        break;
      case 'ArrowUp':
        next = view === 'month' ? { day: addDays(day, -7), hour } : { day, hour: hour === null ? null : hour === dayStartHour ? null : hour - 1 };
        break;
      case 'ArrowDown':
        next = view === 'month' ? { day: addDays(day, 7), hour } : { day, hour: hour === null ? dayStartHour : Math.min(lastHour, hour + 1) };
        break;
      case 'Home':
        next = { day: startOfWeek(day, weekStartsOn), hour };
        break;
      case 'End':
        next = { day: addDays(startOfWeek(day, weekStartsOn), 6), hour };
        break;
      case 'PageUp':
        next = { day: view === 'month' ? addMonths(day, -1) : addDays(day, -7), hour };
        break;
      case 'PageDown':
        next = { day: view === 'month' ? addMonths(day, 1) : addDays(day, 7), hour };
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        slot(day, hour, 0);
        return;
    }
    if (next) {
      e.preventDefault();
      moveFocus(next);
    }
  };

  const slot = (day: Date, hour: number | null, minute: number) => {
    if (!onSlotClick) return;
    if (hour === null) onSlotClick({ start: day, end: addDays(day, 1), allDay: true });
    else {
      const start = addMinutes(day, hour * 60 + minute);
      onSlotClick({ start, end: addMinutes(start, 60), allDay: false });
    }
  };

  const cellProps = (day: Date, hour: number | null) => {
    const active = sameDay(day, focusDay) && hour === focusHour;
    return {
      role: 'gridcell',
      tabIndex: active ? 0 : -1,
      'data-cell': `${isoDay(day)}|${hour ?? 'all'}`,
      'aria-current': hour === null && sameDay(day, now) ? ('date' as const) : undefined,
      onFocus: (e: FocusEvent<HTMLDivElement>) => e.target === e.currentTarget && !active && setFocus({ day, hour }),
      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => onCellKeyDown(e, day, hour),
    };
  };

  /** Bars for all-day / multi-day events (month rows and the week all-day row), anchored in their first visible cell. */
  const renderBars = (segs: Seg[], col: number, hidden: number, day: Date) => (
    <>
      {segs
        .filter((sg) => sg.visible && sg.startCol === col)
        .map((sg) => {
          const i = sg.item;
          const timedChip = !i.allDay && !i.multi;
          return (
            <button
              key={i.ev.id}
              type="button"
              className={cx(s.bar, timedChip ? s.chip : s.block, sg.contBefore && s.contBefore, sg.contAfter && s.contAfter)}
              style={evStyle(i, { '--span': sg.endCol - sg.startCol + 1, '--lane': sg.lane })}
              aria-label={eventLabel(i)}
              title={eventLabel(i)}
              onClick={(e) => clickEvent(e, i)}
            >
              {timedChip && <span className={s.dot} aria-hidden />}
              {timedChip && <span className={s.chipTime}>{f.time(i.start)}</span>}
              <span className={s.barTitle}>{i.ev.title}</span>
            </button>
          );
        })}
      {hidden > 0 && (
        <div className={s.moreSlot} style={{ '--lane': max - 1 } as CSSProperties}>
          <Popover
            open={moreOpen === isoDay(day)}
            onClose={() => setMoreOpen(null)}
            placement="bottom"
            align="start"
            trigger={
              <button
                type="button"
                className={s.more}
                aria-haspopup="dialog"
                aria-expanded={moreOpen === isoDay(day)}
                aria-label={`${hidden} more events on ${f.dayLong(day)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setMoreOpen((o) => (o === isoDay(day) ? null : isoDay(day)));
                }}
              >
                +{hidden} more
              </button>
            }
          >
            <div className={s.moreList} role="dialog" aria-label={f.dayLong(day)}>
              <div className={s.moreHead}>{f.dayLong(day)}</div>
              {items
                .filter((i) => i.firstDay <= day && i.lastDay >= day)
                .sort(byStart)
                .map((i) => (
                  <button key={i.ev.id} type="button" className={cx(s.bar, s.block, s.listItem)} style={evStyle(i)} aria-label={eventLabel(i)} onClick={(e) => clickEvent(e, i)}>
                    <span className={s.barTitle}>{i.ev.title}</span>
                    <span className={s.listTime}>{timeRange(i)}</span>
                  </button>
                ))}
            </div>
          </Popover>
        </div>
      )}
    </>
  );

  const header = (
    <div className={s.toolbar}>
      <Button size="sm" onClick={() => onDateChange(startOfDay(now))}>
        Today
      </Button>
      <div className={s.nav}>
        <IconButton label={view === 'month' ? 'Previous month' : 'Previous week'} icon={<ChevronLeftIcon strokeWidth={2.2} />} onClick={() => shift(-1)} />
        <IconButton label={view === 'month' ? 'Next month' : 'Next week'} icon={<ChevronRightIcon strokeWidth={2.2} />} onClick={() => shift(1)} />
      </div>
      <h2 className={s.title} aria-live="polite">
        {title}
      </h2>
      <div className={s.spacer} />
      {actions}
      <Segmented
        label="Calendar view"
        size="md"
        value={view}
        onChange={onViewChange}
        options={[
          { value: 'month', label: 'Month' },
          { value: 'week', label: 'Week' },
        ]}
      />
    </div>
  );

  /* ---------------- month ---------------- */
  const month = () => {
    const allSpan = items; // every event shows as a bar or chip in month view
    return (
      <div ref={gridRef} role="grid" aria-label={title} className={s.month} style={{ '--cal-max': max } as CSSProperties}>
        <div role="row" className={s.monthHead}>
          {days(rangeStart).map((d) => (
            <div key={d.getDay()} role="columnheader" className={s.colHead} aria-label={f.weekdayLong(d)}>
              {f.weekdayShort(d)}
            </div>
          ))}
        </div>
        {Array.from({ length: weeks }, (_, w) => {
          const ws = addDays(rangeStart, w * 7);
          const { segs, hidden } = layoutRow(ws, 7, allSpan, max);
          return (
            <div key={w} role="row" className={s.monthRow}>
              {days(ws).map((d, col) => {
                const out = d.getMonth() !== anchor.getMonth();
                const isToday = sameDay(d, now);
                return (
                  <div
                    key={col}
                    {...cellProps(d, null)}
                    aria-label={`${f.dayLong(d)}${isToday ? ', today' : ''}`}
                    className={cx(s.cell, out && s.outside)}
                    onClick={(e) => e.target === e.currentTarget && slot(d, null, 0)}
                  >
                    <div className={s.dayHead}>
                      <button
                        type="button"
                        tabIndex={-1}
                        className={cx(s.dayNum, isToday && s.today)}
                        aria-label={`Show week of ${f.dayLong(d)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDateChange(d);
                          onViewChange('week');
                        }}
                      >
                        {d.getDate()}
                      </button>
                    </div>
                    {renderBars(segs, col, hidden[col], d)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  /* ---------------- week ---------------- */
  const week = () => {
    const wd = days(rangeStart);
    const allDayItems = items.filter((i) => i.allDay || i.multi);
    const timed = items.filter((i) => !i.allDay && !i.multi);
    const { segs, hidden, lanes } = layoutRow(rangeStart, 7, allDayItems, max);
    const hours = Array.from({ length: Math.max(1, dayEndHour - dayStartHour) }, (_, k) => dayStartHour + k);
    const perDay = wd.map((d) => layoutDay(timed.filter((i) => sameDay(i.firstDay, d))));
    const nowMin = minutesOfDay(now);
    return (
      <div
        ref={gridRef}
        role="grid"
        aria-label={`Week of ${title}`}
        className={s.week}
        style={{ '--cal-max': max, '--cal-lanes': Math.max(1, lanes) } as CSSProperties}
      >
        <div role="rowgroup" className={s.weekTop}>
          <div role="row" className={s.weekRow}>
            <div role="columnheader" className={s.gutter} aria-label="Time" />
            {wd.map((d) => {
              const isToday = sameDay(d, now);
              return (
                <div key={d.getTime()} role="columnheader" className={cx(s.weekColHead, isToday && s.weekColToday)} aria-label={`${f.dayLong(d)}${isToday ? ', today' : ''}`}>
                  <span className={s.weekday}>{f.weekdayShort(d)}</span>
                  <span className={cx(s.dayNum, s.dayNumStatic, isToday && s.today)}>{d.getDate()}</span>
                </div>
              );
            })}
          </div>
          <div role="row" className={cx(s.weekRow, s.allDayRow)}>
            <div role="rowheader" className={s.gutterLabel}>
              All day
            </div>
            {wd.map((d, col) => (
              <div key={col} {...cellProps(d, null)} aria-label={`${f.dayLong(d)}, all day`} className={cx(s.cell, s.allDayCell)} onClick={(e) => e.target === e.currentTarget && slot(d, null, 0)}>
                {renderBars(segs, col, hidden[col], d)}
              </div>
            ))}
          </div>
        </div>
        <div role="rowgroup" className={s.hours}>
          {hours.map((h) => (
            <div key={h} role="row" className={s.weekRow}>
              <div role="rowheader" className={s.hourLabel}>
                <span>{f.hour(new Date(2000, 0, 1, h))}</span>
              </div>
              {wd.map((d, col) => {
                const isToday = sameDay(d, now);
                const showNow = isToday && Math.floor(nowMin / 60) === h && nowMin >= dayStartHour * 60 && nowMin < dayEndHour * 60;
                return (
                  <div
                    key={col}
                    {...cellProps(d, h)}
                    aria-label={`${f.dayLong(d)}, ${f.time(new Date(2000, 0, 1, h))}`}
                    className={cx(s.cell, s.slot, isToday && s.slotToday)}
                    onClick={(e) => {
                      if (e.target !== e.currentTarget) return;
                      const half = e.nativeEvent.offsetY >= e.currentTarget.clientHeight / 2 ? 30 : 0;
                      slot(d, h, half);
                    }}
                  >
                    {perDay[col]
                      .filter(({ item }) => Math.min(dayEndHour - 1, Math.max(dayStartHour, Math.floor(minutesOfDay(item.start) / 60))) === h)
                      .map(({ item, col: c, cols }) => {
                        const startMin = Math.max(minutesOfDay(item.start), dayStartHour * 60);
                        const endMin = Math.min(sameDay(item.end, item.start) ? minutesOfDay(item.end) : 24 * 60, dayEndHour * 60);
                        const top = Math.max(0, startMin / 60 - h);
                        const dur = Math.max(0.5, (endMin - startMin) / 60);
                        return (
                          <button
                            key={item.ev.id}
                            type="button"
                            className={cx(s.timed, dur < 1 && s.timedShort)}
                            style={evStyle(item, { '--top': top, '--dur': dur, '--col': c, '--cols': cols })}
                            aria-label={eventLabel(item)}
                            title={eventLabel(item)}
                            onClick={(e) => clickEvent(e, item)}
                          >
                            <span className={s.barTitle}>{item.ev.title}</span>
                            <span className={s.timedTime}>{timeRange(item)}</span>
                          </button>
                        );
                      })}
                    {showNow && <div className={s.now} style={{ '--top': (nowMin % 60) / 60 } as CSSProperties} aria-hidden />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cx(s.root, className)} {...rest}>
      {header}
      {view === 'month' ? month() : week()}
    </div>
  );
}
