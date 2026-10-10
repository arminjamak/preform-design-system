import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeftIcon, ChevronRightIcon, ImageOffIcon, RotateCcwIcon, XIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import { Spinner } from '../Spinner/Spinner';
import { Image } from '../Image/Image';
import s from './Lightbox.module.css';

export type LightboxImage = { src: string; alt: string; caption?: ReactNode };

export type LightboxProps = {
  images: LightboxImage[];
  /** Index of the image on screen. */
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  /** Accessible name of the viewer dialog. */
  label?: string;
  /** Wrap from the last image to the first. */
  loop?: boolean;
  showThumbnails?: boolean;
  /** Fill the nearest positioned ancestor instead of portalling a full-screen overlay to <body> (docs and tests). */
  inline?: boolean;
  className?: string;
};

type View = { z: number; x: number; y: number };

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.5;
const SWIPE_THRESHOLD = 48;
const RESET: View = { z: 1, x: 0, y: 0 };
const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Full-screen image viewer: prev/next, counter, wheel/button zoom with pan, thumbnail strip and caption. Escape closes. */
export function Lightbox({ images, index, open, onClose, onIndexChange, label = 'Image viewer', loop = true, showThumbnails = true, inline, className }: LightboxProps) {
  const count = images.length;
  const current = Math.min(Math.max(index, 0), Math.max(count - 1, 0));
  const image = images[current];

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; startX: number; startY: number; origin: View; moved: boolean; onBackdrop: boolean } | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const [view, setView] = useState<View>(RESET);
  const [dragging, setDragging] = useState(false);
  const [load, setLoad] = useState<{ src: string; state: 'loaded' | 'error' } | null>(null);
  const status = load && load.src === image?.src ? load.state : 'loading';
  const captionId = useId();

  /* ---------------------------------------------------------- navigation */

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      const next = loop ? (current + delta + count) % count : Math.min(Math.max(current + delta, 0), count - 1);
      if (next !== current) onIndexChange(next);
    },
    [count, current, loop, onIndexChange],
  );
  const canPrev = loop ? count > 1 : current > 0;
  const canNext = loop ? count > 1 : current < count - 1;

  /* --------------------------------------------------------- zoom & pan */

  const clamp = useCallback((v: View): View => {
    const z = Math.min(Math.max(v.z, MIN_ZOOM), MAX_ZOOM);
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img || z === 1) return { z, x: 0, y: 0 };
    const maxX = Math.max(0, (img.offsetWidth * z - stage.clientWidth) / 2);
    const maxY = Math.max(0, (img.offsetHeight * z - stage.clientHeight) / 2);
    return { z, x: Math.min(Math.max(v.x, -maxX), maxX), y: Math.min(Math.max(v.y, -maxY), maxY) };
  }, []);

  /** Zoom to `z`, keeping the point at (px, py) (relative to the stage centre) under the pointer. */
  const zoomTo = useCallback(
    (z: number, px = 0, py = 0) =>
      setView((v) => {
        const nz = Math.min(Math.max(z, MIN_ZOOM), MAX_ZOOM);
        const k = nz / v.z;
        return clamp({ z: nz, x: px - k * (px - v.x), y: py - k * (py - v.y) });
      }),
    [clamp],
  );

  const pointFromEvent = (clientX: number, clientY: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return [clientX - (r.left + r.width / 2), clientY - (r.top + r.height / 2)] as const;
  };

  // Wheel needs a non-passive listener so the page does not scroll underneath.
  useEffect(() => {
    const stage = stageRef.current;
    if (!open || !stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      const px = e.clientX - (r.left + r.width / 2);
      const py = e.clientY - (r.top + r.height / 2);
      setView((v) => {
        const nz = Math.min(Math.max(v.z * Math.exp(-e.deltaY * 0.0015), MIN_ZOOM), MAX_ZOOM);
        const k = nz / v.z;
        return clamp({ z: nz, x: px - k * (px - v.x), y: py - k * (py - v.y) });
      });
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [open, clamp]);

  // New image: reset zoom.
  useEffect(() => setView(RESET), [image?.src]);

  // Re-clamp when the viewport resizes.
  useEffect(() => {
    if (!open) return;
    const onResize = () => setView((v) => clamp(v));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, clamp]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, origin: view, moved: false, onBackdrop: e.target === e.currentTarget };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > 3) {
      d.moved = true;
      setDragging(true);
    }
    if (d.moved && d.origin.z > 1) setView(clamp({ z: d.origin.z, x: d.origin.x + dx, y: d.origin.y + dy }));
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    const dx = e.clientX - d.startX;
    if (d.origin.z === 1 && d.moved && Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
    else if (!d.moved && d.onBackdrop && e.type === 'pointerup') onClose(); // click on the backdrop, not the image
  };
  const onDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    const [px, py] = pointFromEvent(e.clientX, e.clientY);
    zoomTo(view.z > 1 ? 1 : 2, px, py);
  };

  /* ------------------------------------------------------ focus & keys */

  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement as HTMLElement | null;
    if (!inline) rootRef.current?.focus({ preventScroll: true });
    let previousOverflow = '';
    if (!inline) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (!inline) document.body.style.overflow = previousOverflow;
      restoreFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, inline]);

  // Keep the active thumbnail visible, and move focus with it when the strip has focus.
  useEffect(() => {
    const strip = stripRef.current;
    if (!open || !strip) return;
    const thumb = strip.querySelector<HTMLElement>(`[data-index="${current}"]`);
    // Scroll only the strip (scrollIntoView would also scroll the page around an inline viewer).
    if (thumb) strip.scrollTo({ left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    if (thumb && strip.contains(document.activeElement)) thumb.focus({ preventScroll: true });
  }, [current, open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const zoomed = view.z > 1;
    const panStep = (stageRef.current?.clientWidth ?? 0) / 10;
    switch (e.key) {
      case 'Escape':
        e.stopPropagation();
        onClose();
        break;
      case 'ArrowLeft':
        if (zoomed) setView((v) => clamp({ ...v, x: v.x + panStep }));
        else go(-1);
        break;
      case 'ArrowRight':
        if (zoomed) setView((v) => clamp({ ...v, x: v.x - panStep }));
        else go(1);
        break;
      case 'ArrowUp':
        if (!zoomed) return;
        setView((v) => clamp({ ...v, y: v.y + panStep }));
        break;
      case 'ArrowDown':
        if (!zoomed) return;
        setView((v) => clamp({ ...v, y: v.y - panStep }));
        break;
      case 'Home':
        onIndexChange(0);
        break;
      case 'End':
        onIndexChange(count - 1);
        break;
      case '+':
      case '=':
        zoomTo(view.z * ZOOM_STEP);
        break;
      case '-':
      case '_':
        zoomTo(view.z / ZOOM_STEP);
        break;
      case '0':
        setView(RESET);
        break;
      case 'Tab': {
        const nodes = Array.from(rootRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((n) => n.tabIndex >= 0);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === rootRef.current)) {
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
        } else return;
        break;
      }
      default:
        return;
    }
    e.preventDefault();
  };

  if (!open || !image) return null;

  const imgStyle = { '--lb-x': view.x, '--lb-y': view.y, '--lb-zoom': view.z } as CSSProperties;

  const node = (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal={inline ? undefined : true}
      aria-label={label}
      aria-describedby={image.caption ? captionId : undefined}
      tabIndex={-1}
      className={cx(s.root, inline && s.inline, className)}
      onKeyDown={onKeyDown}
    >
      <div className={s.toolbar}>
        <span className={s.counter} aria-hidden="true">
          {current + 1} / {count}
        </span>
        <span className={s.srOnly} aria-live="polite">
          {`Image ${current + 1} of ${count}: ${image.alt}`}
        </span>
        <span className={s.spacer} />
        <IconButton label="Zoom out" icon={<ZoomOutIcon strokeWidth={2.2} />} variant="inverse" size="md" onClick={() => zoomTo(view.z / ZOOM_STEP)} disabled={view.z <= MIN_ZOOM} />
        <output className={s.zoomValue} aria-label="Zoom level">
          {Math.round(view.z * 100)}%
        </output>
        <IconButton label="Zoom in" icon={<ZoomInIcon strokeWidth={2.2} />} variant="inverse" size="md" onClick={() => zoomTo(view.z * ZOOM_STEP)} disabled={view.z >= MAX_ZOOM} />
        <IconButton label="Reset zoom" icon={<RotateCcwIcon strokeWidth={2.2} />} variant="inverse" size="md" onClick={() => setView(RESET)} disabled={view.z === 1} />
        <span className={s.divider} aria-hidden="true" />
        <IconButton label="Close viewer" icon={<XIcon strokeWidth={2.6} />} variant="inverse" size="md" onClick={onClose} />
      </div>

      <div
        ref={stageRef}
        className={cx(s.stage, view.z > 1 && s.zoomed, dragging && s.dragging)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        {status !== 'error' && (
          <img
            key={image.src}
            ref={imgRef}
            src={image.src}
            alt={image.alt}
            draggable={false}
            className={cx(s.image, status !== 'loaded' && s.imageLoading)}
            style={imgStyle}
            onLoad={() => setLoad({ src: image.src, state: 'loaded' })}
            onError={() => setLoad({ src: image.src, state: 'error' })}
          />
        )}
        {status === 'loading' && (
          <span className={s.stageStatus}>
            <Spinner size="lg" label="Loading image" />
          </span>
        )}
        {status === 'error' && (
          <span className={s.stageStatus} role="img" aria-label={`${image.alt} (preview unavailable)`}>
            <ImageOffIcon strokeWidth={2} aria-hidden="true" />
            <span>Preview unavailable</span>
          </span>
        )}
        {count > 1 && (
          <>
            <IconButton label="Previous image" icon={<ChevronLeftIcon strokeWidth={2.4} />} variant="inverse" size="lg" shape="circle" className={cx(s.nav, s.prev)} onClick={() => go(-1)} onPointerDown={(e) => e.stopPropagation()} disabled={!canPrev} />
            <IconButton label="Next image" icon={<ChevronRightIcon strokeWidth={2.4} />} variant="inverse" size="lg" shape="circle" className={cx(s.nav, s.next)} onClick={() => go(1)} onPointerDown={(e) => e.stopPropagation()} disabled={!canNext} />
          </>
        )}
      </div>

      <div className={s.caption} id={captionId}>
        {image.caption}
      </div>

      {showThumbnails && count > 1 && (
        <div ref={stripRef} className={s.strip} role="group" aria-label="Thumbnails">
          {images.map((img, i) => (
            <button
              key={`${img.src}-${i}`}
              type="button"
              data-index={i}
              className={cx(s.thumb, i === current && s.thumbCurrent)}
              aria-label={`Show image ${i + 1}: ${img.alt}`}
              aria-current={i === current || undefined}
              tabIndex={i === current ? 0 : -1}
              onClick={() => onIndexChange(i)}
            >
              <Image src={img.src} alt="" ratio="1/1" radius="sm" compactFallback loading="eager" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return inline ? node : createPortal(node, document.body);
}
