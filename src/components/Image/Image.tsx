import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { ImageOffIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import s from './Image.module.css';

export type ImageRatio = 'auto' | '1/1' | '4/3' | '3/2' | '16/9' | '3/4' | number;
export type ImageStatus = 'loading' | 'loaded' | 'error';

export type ImageProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'onLoad' | 'onError'> & {
  src: string;
  /** Describe the part or scene. Pass an empty string only for purely decorative images. */
  alt: string;
  /** Frame aspect ratio. `auto` uses the image's intrinsic ratio. */
  ratio?: ImageRatio;
  fit?: 'cover' | 'contain';
  radius?: 'none' | 'sm' | 'md' | 'lg';
  caption?: ReactNode;
  /** Icon-only error fallback for small tiles. */
  compactFallback?: boolean;
  /** Pin the load state (docs and visual tests). */
  forceStatus?: ImageStatus;
  loading?: 'lazy' | 'eager';
  onStatusChange?: (status: ImageStatus) => void;
};

const toAspect = (ratio: ImageRatio): string | undefined => (ratio === 'auto' ? undefined : typeof ratio === 'number' ? String(ratio) : ratio.replace('/', ' / '));

/** Framed image with aspect ratio, shimmer while loading, a "Preview unavailable" fallback and an optional caption. */
export const Image = forwardRef<HTMLElement, ImageProps>(function Image(
  { src, alt, ratio = '4/3', fit = 'cover', radius = 'md', caption, compactFallback, forceStatus, loading = 'lazy', onStatusChange, className, style, ...rest },
  ref,
) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loadStatus, setLoadStatus] = useState<ImageStatus>(src ? 'loading' : 'error');
  const status = forceStatus ?? loadStatus;

  useEffect(() => {
    if (!src) return setLoadStatus('error');
    const img = imgRef.current;
    // Cached images can finish before React attaches handlers.
    setLoadStatus(img?.complete && img.naturalWidth > 0 ? 'loaded' : 'loading');
  }, [src]);

  const onStatusRef = useRef(onStatusChange);
  onStatusRef.current = onStatusChange;
  useEffect(() => {
    onStatusRef.current?.(status);
  }, [status]);

  const Root = caption ? 'figure' : 'div';
  const frameStyle: CSSProperties = { aspectRatio: toAspect(ratio) };

  return (
    <Root ref={ref as never} className={cx(s.root, s[radius], className)} style={style} {...rest}>
      <div className={cx(s.frame, ratio === 'auto' && s.autoRatio, status !== 'loaded' && s.placeholder)} style={frameStyle} aria-busy={status === 'loading' || undefined}>
        {src && status !== 'error' && (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            loading={loading}
            decoding="async"
            className={cx(s.img, s[fit], status !== 'loaded' && s.hidden)}
            onLoad={() => setLoadStatus('loaded')}
            onError={() => setLoadStatus('error')}
          />
        )}
        {status === 'loading' && <span className={s.shimmer} aria-hidden="true" />}
        {status === 'error' && (
          <span className={cx(s.fallback, compactFallback && s.compact)} role="img" aria-label={alt ? `${alt} (preview unavailable)` : 'Preview unavailable'}>
            <ImageOffIcon strokeWidth={2} aria-hidden="true" />
            {!compactFallback && <span className={s.fallbackText}>Preview unavailable</span>}
          </span>
        )}
      </div>
      {caption && <figcaption className={s.caption}>{caption}</figcaption>}
    </Root>
  );
});
