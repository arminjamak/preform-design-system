import { useCallback, useState } from 'react';
import { ChevronDownIcon, MinusIcon, PlusIcon, RotateCcwIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { IconButton } from '../IconButton/IconButton';
import { MenuList, type MenuItem } from '../Menu/Menu';
import { Popover } from '../Popover/Popover';
import { clamp, formatZoom } from './geometry';
import s from './CanvasControls.module.css';

export type ZoomControlsProps = WithForcedState & {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
  /** Multiplier applied by the − / + buttons. */
  step?: number;
  /** Zoom levels offered in the percentage menu. */
  presets?: number[];
  /** Adds "Fit to view" to the menu. */
  onFit?: () => void;
  /** Reset button handler; defaults to zoom 100%. */
  onReset?: () => void;
  /** Hide the reset button. */
  hideReset?: boolean;
  /** Which side the percentage menu opens on. */
  menuPlacement?: 'top' | 'bottom';
  label?: string;
  className?: string;
};

/** Floating zoom pill: −, percentage readout with presets menu, +, reset. Mirrors the PreForm viewport controls. */
export function ZoomControls({
  zoom,
  onZoomChange,
  minZoom = 0.1,
  maxZoom = 4,
  step = 1.25,
  presets = [0.5, 1, 2],
  onFit,
  onReset,
  hideReset,
  menuPlacement = 'top',
  label = 'Zoom',
  className,
  'data-state': state,
}: ZoomControlsProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const set = (z: number) => onZoomChange(clamp(z, minZoom, maxZoom));
  const items: MenuItem[] = presets.map((p) => ({ label: formatZoom(p), onSelect: () => set(p), selected: Math.abs(zoom - p) < 0.005 }));
  if (onFit) items.push({ type: 'separator' }, { label: 'Fit to view', onSelect: onFit });

  return (
    <div role="toolbar" aria-label={label} className={cx(s.pill, className)}>
      <IconButton label="Zoom out" icon={<MinusIcon strokeWidth={2.2} />} size="sm" shape="circle" disabled={zoom <= minZoom} onClick={() => set(zoom / step)} data-state={state} />
      <Popover
        open={open}
        onClose={close}
        placement={menuPlacement}
        align="center"
        padded={false}
        trigger={
          <button type="button" className={s.readout} aria-haspopup="menu" aria-expanded={open} aria-label={`Zoom level ${formatZoom(zoom)}`} onClick={() => setOpen((o) => !o)}>
            {formatZoom(zoom)}
            <ChevronDownIcon aria-hidden />
          </button>
        }
      >
        <MenuList items={items} onSelect={close} className={s.menu} />
      </Popover>
      <IconButton label="Zoom in" icon={<PlusIcon strokeWidth={2.2} />} size="sm" shape="circle" disabled={zoom >= maxZoom} onClick={() => set(zoom * step)} />
      {!hideReset && (
        <>
          <span className={s.sep} aria-hidden />
          <IconButton label="Reset zoom" icon={<RotateCcwIcon strokeWidth={2.2} />} size="sm" shape="circle" onClick={() => (onReset ? onReset() : set(1))} />
        </>
      )}
    </div>
  );
}
