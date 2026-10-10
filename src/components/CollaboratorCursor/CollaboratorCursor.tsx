import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { collaboratorColorIndex } from './collaboratorColor';
import s from './CollaboratorCursor.module.css';

export type CollaboratorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CollaboratorCursorProps = {
  /** Stable user id; hashed to pick one of the six chart-series colours. */
  userId: string;
  name: string;
  /** Pointer position in the layer's coordinate space (CSS pixels). */
  x: number;
  y: number;
  /** Optional selection rectangle in the same coordinate space. */
  selection?: CollaboratorRect;
  /** Short activity shown after the name, e.g. "Adding supports". */
  activity?: string;
  /** Fades the cursor and collapses the pill when the user has stopped moving. */
  idle?: boolean;
  /** Hide the name pill (arrow only). */
  hideName?: boolean;
  /** Force a colour slot (1–6) instead of hashing `userId`. */
  colorIndex?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Put the name pill on the left of the arrow (used near the right edge). */
  flip?: boolean;
  className?: string;
};

type CursorVars = CSSProperties & Record<'--cc-x' | '--cc-y' | '--cc-color', string | number>;
type RectVars = CSSProperties & Record<'--cc-x' | '--cc-y' | '--cc-w' | '--cc-h' | '--cc-color', string | number>;

/**
 * A remote collaborator's pointer: arrow + name pill in their colour, with an optional selection box.
 * Moves with a transform transition (motion tokens) so position updates glide instead of jump.
 * Render inside a positioned container, usually via `CollaboratorLayer`.
 */
export function CollaboratorCursor({ userId, name, x, y, selection, activity, idle, hideName, colorIndex, flip, className }: CollaboratorCursorProps) {
  const slot = colorIndex ?? collaboratorColorIndex(userId);
  const color = `var(--color-chart-series-${slot})`;
  return (
    <>
      {selection && (
        <span
          aria-hidden="true"
          data-color={slot}
          className={cx(s.selection, idle && s.idle)}
          style={
            {
              '--cc-x': selection.x,
              '--cc-y': selection.y,
              '--cc-w': selection.width,
              '--cc-h': selection.height,
              '--cc-color': color,
            } as RectVars
          }
        />
      )}
      <span
        aria-hidden="true"
        data-color={slot}
        className={cx(s.cursor, idle && s.idle, flip && s.flip, className)}
        style={{ '--cc-x': x, '--cc-y': y, '--cc-color': color } as CursorVars}
      >
        <svg className={s.arrow} viewBox="0 0 16 16" focusable="false">
          <path d="M2 1.5 L2 13.2 L5.3 10.1 L7.6 15 L9.8 14 L7.6 9.2 L12.2 8.9 Z" strokeLinejoin="round" />
        </svg>
        {!hideName && (
          <span className={s.pill}>
            <span className={s.name}>{name}</span>
            {activity && <span className={s.activity}>{activity}</span>}
          </span>
        )}
      </span>
    </>
  );
}

export type Collaborator = Omit<CollaboratorCursorProps, 'className'>;

export type CollaboratorLayerProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  collaborators: Collaborator[];
  /** The surface the cursors float over (viewport, build platform, canvas). */
  children: ReactNode;
  /** Accessible name for the list of people present. */
  label?: string;
};

/** Share of the layer width after which name pills flip to the left of the arrow. */
const FLIP_AT = 0.7;

/** Positions many collaborator cursors over its children. Pointer events pass through to the content. */
export function CollaboratorLayer({ collaborators, children, label = 'People in this project', className, ...rest }: CollaboratorLayerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = overlayRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return (
    <div className={cx(s.layer, className)} {...rest}>
      {children}
      <div ref={overlayRef} className={s.overlay}>
        {collaborators.map((c) => (
          <CollaboratorCursor key={c.userId} {...c} flip={c.flip ?? (width > 0 && c.x > width * FLIP_AT)} />
        ))}
      </div>
      <ul className={s.srOnly} aria-label={label}>
        {collaborators.map((c) => (
          <li key={c.userId}>
            {c.name}
            {c.activity ? `, ${c.activity}` : ''}
            {c.idle ? ', idle' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
