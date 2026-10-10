import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { RotateCcwIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { IconButton } from '../IconButton/IconButton';
import { Segmented } from '../Segmented/Segmented';
import { Slider } from '../Slider/Slider';
import { Spinner } from '../Spinner/Spinner';
import { centeredCrop, moveCrop, resizeCrop, roundCrop, type CropHandle, type CropRect } from './cropMath';
import s from './ImageCropper.module.css';

export type { CropRect } from './cropMath';
export type CropAspect = 'free' | '1:1' | '4:3' | '16:9';

export const CROP_ASPECTS: Record<CropAspect, number | null> = { free: null, '1:1': 1, '4:3': 4 / 3, '16:9': 16 / 9 };
const ASPECT_OPTIONS: { value: CropAspect; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '16:9', label: '16:9' },
];
const HANDLES: CropHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export type ImageCropperProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> &
  WithForcedState & {
    src: string;
    alt?: string;
    /** Aspect preset. Changing it re-centres the crop; the toolbar updates it and calls `onAspectChange`. */
    aspect?: CropAspect;
    onAspectChange?: (aspect: CropAspect) => void;
    /** Crop in natural image pixels, rounded. Fires on load and on every change. */
    onChange?: (rect: CropRect) => void;
    /** Initial crop in image pixels; defaults to a centred 80% box. */
    defaultCrop?: CropRect;
    /** Smallest crop edge in image pixels. */
    minSize?: number;
    /** Maximum zoom, in percent. */
    maxZoom?: number;
    showGrid?: boolean;
    /** Hide the aspect / zoom toolbar (for embedding in a custom dialog). */
    hideToolbar?: boolean;
  };

type Drag = { mode: 'move' | CropHandle; x: number; y: number; start: CropRect; scale: number; pointerId: number };

/** Crop box over an image: drag to move, 8 handles to resize, aspect presets, zoom and a rule-of-thirds grid. */
export function ImageCropper({
  src,
  alt = '',
  aspect: aspectProp = 'free',
  onAspectChange,
  onChange,
  defaultCrop,
  minSize = 32,
  maxZoom = 400,
  showGrid = true,
  hideToolbar,
  className,
  'data-state': forced,
  ...rest
}: ImageCropperProps) {
  const [aspect, setAspect] = useState<CropAspect>(aspectProp);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [zoom, setZoom] = useState(100);
  const [dragging, setDragging] = useState<Drag['mode'] | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const readoutId = useId();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const ratio = CROP_ASPECTS[aspect];
  const W = natural?.w ?? 0;
  const H = natural?.h ?? 0;

  useEffect(() => setAspect(aspectProp), [aspectProp]);
  useEffect(() => {
    setNatural(null);
    setCrop(null);
    setFailed(false);
    setZoom(100);
  }, [src]);

  // Re-centre whenever the image loads or the aspect preset changes.
  const initialised = useRef(false);
  useEffect(() => {
    if (!natural) return;
    if (!initialised.current && defaultCrop) setCrop(defaultCrop);
    else setCrop(centeredCrop(natural.w, natural.h, ratio));
    initialised.current = true;
  }, [natural, ratio]);

  useEffect(() => {
    if (crop) onChangeRef.current?.(roundCrop(crop));
  }, [crop]);

  // Keep the crop centred in view when zooming.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas || !crop || !W) return;
    stage.scrollLeft = ((crop.x + crop.width / 2) / W) * canvas.offsetWidth - stage.clientWidth / 2;
    stage.scrollTop = ((crop.y + crop.height / 2) / H) * canvas.offsetHeight - stage.clientHeight / 2;
  }, [zoom]);

  const changeAspect = (a: CropAspect) => {
    setAspect(a);
    onAspectChange?.(a);
  };

  const toImage = (clientX: number, clientY: number) => {
    const box = canvasRef.current!.getBoundingClientRect();
    const scale = W / box.width;
    return { x: (clientX - box.left) * scale, y: (clientY - box.top) * scale, scale };
  };

  const begin = (e: ReactPointerEvent<HTMLElement>, mode: Drag['mode'], start: CropRect) => {
    if (e.button !== 0 || !natural) return;
    e.preventDefault();
    e.stopPropagation();
    const { scale } = toImage(e.clientX, e.clientY);
    canvasRef.current?.setPointerCapture(e.pointerId);
    drag.current = { mode, x: e.clientX, y: e.clientY, start, scale, pointerId: e.pointerId };
    setDragging(mode);
  };

  const onCanvasDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!natural || !crop) return;
    // Draw a fresh crop from the pressed point.
    const min = Math.min(minSize, W, H);
    const p = toImage(e.clientX, e.clientY);
    const start = { x: Math.min(Math.max(p.x, 0), W - min), y: Math.min(Math.max(p.y, 0), H - min), width: 0, height: 0 };
    begin(e, 'se', start);
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = (e.clientX - d.x) * d.scale;
    const dy = (e.clientY - d.y) * d.scale;
    setCrop(d.mode === 'move' ? moveCrop(d.start, dx, dy, W, H) : resizeCrop(d.start, d.mode, dx, dy, W, H, ratio, minSize));
  };

  const end = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== e.pointerId) return;
    drag.current = null;
    setDragging(null);
  };

  const onCropKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!crop) return;
    const step = Math.max(1, Math.round(W / (e.altKey ? 400 : 100)));
    const delta: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    setCrop(e.shiftKey ? resizeCrop(crop, 'se', d[0], d[1], W, H, ratio, minSize) : moveCrop(crop, d[0], d[1], W, H));
  };

  const reset = useCallback(() => {
    if (!natural) return;
    setZoom(100);
    setCrop(centeredCrop(natural.w, natural.h, ratio));
  }, [natural, ratio]);

  const rounded = crop && roundCrop(crop);
  const ratioVar = W && H ? W / H : 4 / 3;

  return (
    <div className={cx(s.root, className)} data-state={forced} {...rest}>
      {!hideToolbar && (
        <div className={s.toolbar}>
          <Segmented label="Aspect ratio" size="sm" value={aspect} options={ASPECT_OPTIONS} onChange={changeAspect} disabled={!natural} />
          <Slider label="Zoom" min={100} max={maxZoom} step={10} value={zoom} onChange={setZoom} showValue formatValue={(v) => `${v}%`} disabled={!natural} className={s.zoom} />
          <IconButton label="Reset crop" icon={<RotateCcwIcon strokeWidth={2.2} />} onClick={reset} disabled={!natural} />
        </div>
      )}

      <div ref={stageRef} className={s.stage} style={{ '--crop-ratio': ratioVar } as CSSProperties}>
        <div
          ref={canvasRef}
          className={cx(s.canvas, dragging && s.isDragging)}
          style={{ '--crop-zoom': zoom / 100, aspectRatio: `${W || 4} / ${H || 3}` } as CSSProperties}
          onPointerDown={onCanvasDown}
          onPointerMove={onMove}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className={s.image}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth || 1, h: e.currentTarget.naturalHeight || 1 })}
            onError={() => setFailed(true)}
          />
          {crop && natural && (
            <div
              role="group"
              tabIndex={0}
              aria-label={`Crop area ${rounded!.width} × ${rounded!.height} pixels at ${rounded!.x}, ${rounded!.y}. Arrow keys move, Shift + arrows resize.`}
              aria-describedby={readoutId}
              data-state={forced}
              className={cx(s.crop, dragging && s.active)}
              style={{ '--cx': crop.x / W, '--cy': crop.y / H, '--cw': crop.width / W, '--ch': crop.height / H } as CSSProperties}
              onPointerDown={(e) => begin(e, 'move', crop)}
              onKeyDown={onCropKey}
            >
              {showGrid && <span className={s.grid} aria-hidden />}
              {HANDLES.map((h) => (
                <span key={h} aria-hidden className={cx(s.handle, s[h], h.length === 2 ? s.corner : s.edge)} onPointerDown={(e) => begin(e, h, crop)} />
              ))}
            </div>
          )}
          {!natural && !failed && (
            <span className={s.placeholder}>
              <Spinner size="md" tone="muted" label="Loading image" />
            </span>
          )}
          {failed && (
            <span className={s.placeholder} role="alert">
              Couldn’t load image
            </span>
          )}
        </div>
      </div>

      <div id={readoutId} className={s.readout}>
        {rounded ? (
          <>
            <span>
              <span className={s.key}>X</span> {rounded.x}
            </span>
            <span>
              <span className={s.key}>Y</span> {rounded.y}
            </span>
            <span className={s.size}>
              {rounded.width} × {rounded.height} px
            </span>
          </>
        ) : (
          <span className={s.key}>No image</span>
        )}
      </div>
    </div>
  );
}
