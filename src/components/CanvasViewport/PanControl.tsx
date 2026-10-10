import type { KeyboardEvent } from 'react';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ScanIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { IconButton } from '../IconButton/IconButton';
import type { Point } from './geometry';
import s from './CanvasControls.module.css';

export type PanControlProps = WithForcedState & {
  pan: Point;
  onPanChange: (pan: Point) => void;
  /** Screen units moved per press (×4 with Shift). */
  step?: number;
  /** Centre button. Without it the centre button recentres the world origin. */
  onFit?: () => void;
  label?: string;
  className?: string;
};

const DIRS = {
  up: { dx: 0, dy: 1, label: 'Pan up', Icon: ChevronUpIcon },
  left: { dx: 1, dy: 0, label: 'Pan left', Icon: ChevronLeftIcon },
  right: { dx: -1, dy: 0, label: 'Pan right', Icon: ChevronRightIcon },
  down: { dx: 0, dy: -1, label: 'Pan down', Icon: ChevronDownIcon },
} as const;

const KEY_DIR: Record<string, keyof typeof DIRS> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

/** Directional pad with a centre "Fit to view" button; a floating disc like the PreForm view cube controls. Arrow keys pan while it has focus. */
export function PanControl({ pan, onPanChange, step = 64, onFit, label = 'Pan view', className, 'data-state': state }: PanControlProps) {
  const move = (dir: keyof typeof DIRS, mult = 1) => onPanChange({ x: pan.x + DIRS[dir].dx * step * mult, y: pan.y + DIRS[dir].dy * step * mult });
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = KEY_DIR[e.key];
    if (!dir) return;
    e.preventDefault();
    move(dir, e.shiftKey ? 4 : 1);
  };
  return (
    <div role="group" aria-label={label} className={cx(s.pad, className)} onKeyDown={onKeyDown}>
      {(Object.keys(DIRS) as Array<keyof typeof DIRS>).map((d) => {
        const { label: l, Icon } = DIRS[d];
        return (
          <IconButton
            key={d}
            label={l}
            icon={<Icon strokeWidth={2.4} />}
            size="xs"
            shape="circle"
            className={s[d]}
            onClick={(e) => move(d, e.shiftKey ? 4 : 1)}
            data-state={d === 'up' ? state : undefined}
          />
        );
      })}
      <IconButton
        label={onFit ? 'Fit to view' : 'Recentre'}
        icon={<ScanIcon strokeWidth={2.2} />}
        size="xs"
        shape="circle"
        variant="outline"
        className={s.center}
        onClick={() => (onFit ? onFit() : onPanChange({ x: 0, y: 0 }))}
      />
    </div>
  );
}
