import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { ImageRatio } from '../Image/Image';
import { MediaThumbnail } from '../MediaThumbnail/MediaThumbnail';
import { Lightbox } from '../Lightbox/Lightbox';
import s from './ImageGallery.module.css';

export type GalleryImage = { src: string; alt: string; caption?: ReactNode };

export type ImageGalleryProps = Omit<HTMLAttributes<HTMLUListElement>, 'children'> & {
  images: GalleryImage[];
  /** Fixed column count, or `auto` to fit as many 96px-min tiles as the width allows. */
  columns?: number | 'auto';
  gap?: 'sm' | 'md' | 'lg';
  /** Tile aspect ratio. */
  ratio?: ImageRatio;
  /** Accessible name for the grid. */
  label?: string;
  /** Called when a tile opens the lightbox. */
  onOpenImage?: (index: number) => void;
};

/** Responsive thumbnail grid; arrow keys move between tiles and Enter opens the Lightbox at that image. */
export function ImageGallery({ images, columns = 'auto', gap = 'md', ratio = '1/1', label = 'Image gallery', onOpenImage, className, style, ...rest }: ImageGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const tiles = useRef<Array<HTMLElement | null>>([]);
  const active = Math.min(focusIndex, Math.max(images.length - 1, 0));

  // After the viewer closes, return focus to the tile of the image that was last on screen.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (openIndex !== null) wasOpen.current = true;
    else if (wasOpen.current) {
      wasOpen.current = false;
      tiles.current[active]?.focus({ preventScroll: true });
    }
  }, [openIndex, active]);

  const columnCount = () => {
    if (typeof columns === 'number') return columns;
    const first = tiles.current[0];
    if (!first) return 1;
    const top = first.getBoundingClientRect().top;
    return Math.max(1, tiles.current.filter((t) => t && Math.abs(t.getBoundingClientRect().top - top) < 1).length);
  };

  const moveFocus = (i: number) => {
    const next = Math.min(Math.max(i, 0), images.length - 1);
    setFocusIndex(next);
    tiles.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const cols = columnCount();
    const map: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, ArrowDown: active + cols, ArrowUp: active - cols, Home: 0, End: images.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    moveFocus(map[e.key]);
  };

  const open = (i: number) => {
    setFocusIndex(i);
    setOpenIndex(i);
    onOpenImage?.(i);
  };

  const gridStyle: CSSProperties = typeof columns === 'number' ? { ...style, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : style ?? {};

  return (
    <>
      <ul className={cx(s.grid, s[gap], className)} style={gridStyle} aria-label={label} onKeyDown={onKeyDown} {...rest}>
        {images.map((img, i) => (
          <li key={`${img.src}-${i}`} className={s.item}>
            <MediaThumbnail
              ref={(el) => {
                tiles.current[i] = el;
              }}
              src={img.src}
              alt={img.alt}
              size="fluid"
              ratio={ratio}
              tabIndex={i === active ? 0 : -1}
              onFocus={() => setFocusIndex(i)}
              onOpen={() => open(i)}
            />
          </li>
        ))}
      </ul>
      <Lightbox
        images={images}
        index={openIndex ?? 0}
        open={openIndex !== null}
        onClose={() => setOpenIndex(null)}
        onIndexChange={(i) => {
          setOpenIndex(i);
          setFocusIndex(i);
        }}
      />
    </>
  );
}
