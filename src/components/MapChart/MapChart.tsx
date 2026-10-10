import { useMemo, useState, type KeyboardEvent } from 'react';
import { cx } from '../../lib/cx';
import { ChartFrame } from '../Chart/ChartFrame';
import { ChartTooltip } from '../Chart/ChartTooltip';
import { Legend } from '../Chart/Legend';
import { formatNumber, seriesColor } from '../Chart/scales';
import { useChartSize } from '../Chart/useChartSize';
import cs from '../Chart/Chart.module.css';
import { isLand } from './landmass';
import s from './MapChart.module.css';

export type MapPoint = {
  id: string;
  label: string;
  /** Latitude in degrees, −90 (south) to 90 (north). */
  lat: number;
  /** Longitude in degrees, −180 (west) to 180 (east). */
  lon: number;
  value: number;
  /** Categorical group (e.g. "Form 4", "Fuse 1+"); each distinct series gets the next chart series colour. */
  series?: string;
};

export type MapChartProps = {
  points: MapPoint[];
  /** Lines every 30° of latitude and longitude. */
  showGraticule?: boolean;
  /** Ranked list of locations beside the map (wraps below on narrow containers). */
  showList?: boolean;
  listTitle?: string;
  /** Name of the measured value in tooltips and the data table (e.g. "Printers"). */
  valueLabel?: string;
  valueFormat?: (v: number) => string;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
};

// Equirectangular window: Antarctica and the far Arctic are cropped.
const LAT_MAX = 84;
const LAT_MIN = -58;
const DOT_PX = 6;

const fmtCoord = (lat: number, lon: number) =>
  `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`;

/**
 * Schematic location map: an equirectangular projection with a 30° graticule and a procedurally dotted,
 * deliberately coarse landmass. It shows roughly *where* things are, not accurate geography.
 */
export function MapChart({
  points,
  showGraticule = true,
  showList = false,
  listTitle = 'Locations',
  valueLabel = 'Value',
  valueFormat = formatNumber,
  title,
  subtitle,
  emptyMessage = 'No locations to display',
  className,
}: MapChartProps) {
  const { ref, width } = useChartSize<HTMLDivElement>();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);

  const seriesNames = useMemo(() => {
    const out: string[] = [];
    for (const p of points) if (p.series && !out.includes(p.series)) out.push(p.series);
    return out;
  }, [points]);
  const colorOf = (p: MapPoint) => seriesColor(p.series ? seriesNames.indexOf(p.series) : 0);

  const W = Math.max(120, width);
  const H = (W * (LAT_MAX - LAT_MIN)) / 360;
  const X = (lon: number) => ((lon + 180) / 360) * W;
  const Y = (lat: number) => ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;

  // Dot spacing snaps to whole columns so the pattern is stable while resizing.
  const cols = Math.max(24, Math.round(W / DOT_PX));
  const dots = useMemo(() => {
    const step = 360 / cols;
    const out: Array<[number, number]> = [];
    for (let lat = LAT_MAX - step / 2; lat > LAT_MIN; lat -= step)
      for (let lon = -180 + step / 2; lon < 180; lon += step) if (isLand(lon, lat)) out.push([lon, lat]);
    return { step, out };
  }, [cols]);
  const dotR = Math.max(0.6, ((dots.step / 360) * W) * 0.3);

  const visible = points
    .filter((p) => !(p.series && hidden.includes(p.series)) && Number.isFinite(p.lat) && Number.isFinite(p.lon))
    .sort((a, b) => a.lon - b.lon);
  const maxV = Math.max(0, ...visible.map((p) => p.value));
  const rMax = Math.max(8, Math.min(18, W / 40));
  const rMin = 3;
  const radius = (v: number) => (maxV > 0 ? rMin + (rMax - rMin) * Math.sqrt(Math.max(0, v) / maxV) : rMin);
  // Draw large circles first so small ones stay hoverable on top.
  const drawOrder = [...visible].sort((a, b) => b.value - a.value);
  const ranked = [...visible].sort((a, b) => b.value - a.value);

  const activeIdx = visible.findIndex((p) => p.id === activeId);
  const act = activeIdx >= 0 ? visible[activeIdx] : undefined;

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const n = visible.length;
    if (!n) return;
    const i = activeIdx;
    let next: number | null = i;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = i < 0 ? 0 : (i + 1) % n;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = i < 0 ? n - 1 : (i - 1 + n) % n;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = n - 1;
        break;
      case 'Escape':
        next = null;
        break;
      default:
        return;
    }
    e.preventDefault();
    setActiveId(next === null || next < 0 ? null : visible[next].id);
  };

  const toggle = (id: string) => {
    setActiveId(null);
    setHidden((hs) => (hs.includes(id) ? hs.filter((x) => x !== id) : hs.length + 1 < seriesNames.length ? [...hs, id] : hs));
  };

  const legend =
    seriesNames.length > 1 ? (
      <Legend
        marker="dot"
        items={seriesNames.map((name, i) => ({ id: name, label: name, color: seriesColor(i) }))}
        hidden={hidden}
        onToggle={toggle}
      />
    ) : undefined;

  const describe = (p: MapPoint) =>
    `${p.label}${p.series ? ` (${p.series})` : ''}: ${valueLabel} ${valueFormat(p.value)}, ${fmtCoord(p.lat, p.lon)}`;
  const summary = `${title ?? 'Location map'} (schematic, not to scale): ${visible.length} locations${
    seriesNames.length > 1 ? ` in ${seriesNames.length} groups` : ''
  }. ${ranked
    .slice(0, 3)
    .map((p) => `${p.label} ${valueFormat(p.value)}`)
    .join(', ')}${ranked.length > 3 ? ', …' : ''}.`;

  const meridians = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
  const parallels = [-30, 0, 30, 60];

  return (
    <ChartFrame title={title} subtitle={subtitle} legend={legend} className={className}>
      <div className={s.layout}>
        <div ref={ref} className={s.plot} onPointerLeave={() => setActiveId(null)}>
          <svg
            className={s.svg}
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={summary}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onFocus={() => setActiveId((a) => a ?? visible[0]?.id ?? null)}
            onBlur={() => setActiveId(null)}
          >
            {showGraticule && (
              <g aria-hidden="true">
                {meridians.map((lon) => (
                  <line key={`m${lon}`} x1={X(lon)} x2={X(lon)} y1={0} y2={H} className={cs.grid} />
                ))}
                {parallels.map((lat) => (
                  <line key={`p${lat}`} x1={0} x2={W} y1={Y(lat)} y2={Y(lat)} className={cs.grid} />
                ))}
                <rect x={0.5} y={0.5} width={W - 1} height={H - 1} className={cx(cs.grid, s.frameRect)} />
              </g>
            )}
            <g aria-hidden="true">
              {dots.out.map(([lon, lat]) => (
                <circle key={`${lon}:${lat}`} cx={X(lon)} cy={Y(lat)} r={dotR} className={s.land} />
              ))}
            </g>
            {drawOrder.map((p) => {
              const on = p.id === activeId;
              return (
                <circle
                  key={p.id}
                  cx={X(p.lon)}
                  cy={Y(Math.max(LAT_MIN, Math.min(LAT_MAX, p.lat)))}
                  r={radius(p.value)}
                  className={cx(cs.mark, s.point, on && s.pointActive, activeId !== null && !on && cs.dimmed)}
                  style={{ fill: colorOf(p) }}
                  onPointerEnter={() => setActiveId(p.id)}
                />
              );
            })}
          </svg>
          {!visible.length && (
            <div className={s.emptyOverlay} role="status">
              {emptyMessage}
            </div>
          )}
          {act && (
            <ChartTooltip
              x={X(act.lon)}
              y={Y(act.lat) - radius(act.value)}
              title={act.label}
              rows={[
                { label: act.series ?? valueLabel, value: valueFormat(act.value), color: colorOf(act) },
                { label: 'Location', value: fmtCoord(act.lat, act.lon), color: 'var(--color-chart-track)' },
              ]}
            />
          )}
          <div className={s.srOnly} aria-live="polite">
            {act ? describe(act) : ''}
          </div>
        </div>

        {showList && ranked.length > 0 && (
          <div className={s.listWrap}>
            <p className={s.listTitle} aria-hidden="true">
              {listTitle}
            </p>
            <ul className={s.list} aria-label={listTitle}>
              {ranked.map((p) => (
                <li
                  key={p.id}
                  className={cx(s.listItem, p.id === activeId && s.listItemActive)}
                  onPointerEnter={() => setActiveId(p.id)}
                  onPointerLeave={() => setActiveId(null)}
                >
                  <span aria-hidden="true" className={s.listDot} style={{ background: colorOf(p) }} />
                  <span className={s.listText}>
                    <span className={s.listRow}>
                      <span className={s.listLabel}>{p.label}</span>
                      <span className={s.listValue}>{valueFormat(p.value)}</span>
                    </span>
                    <span aria-hidden="true" className={s.listBar}>
                      <span
                        className={s.listBarFill}
                        style={{ width: `${maxV > 0 ? (Math.max(0, p.value) / maxV) * 100 : 0}%`, background: colorOf(p) }}
                      />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <table className={s.srOnly}>
          <caption>{title ?? 'Location data'}</caption>
          <thead>
            <tr>
              <th scope="col">Location</th>
              {seriesNames.length > 0 && <th scope="col">Group</th>}
              <th scope="col">{valueLabel}</th>
              <th scope="col">Coordinates</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.id}>
                <th scope="row">{p.label}</th>
                {seriesNames.length > 0 && <td>{p.series ?? '–'}</td>}
                <td>{valueFormat(p.value)}</td>
                <td>{fmtCoord(p.lat, p.lon)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}
