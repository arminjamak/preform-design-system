import { forwardRef, type HTMLAttributes, type MouseEvent } from 'react';
import { CheckIcon, LayersIcon, Maximize2Icon, PlayIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { Tone, WithForcedState } from '../../lib/types';
import { Badge } from '../Badge/Badge';
import { Image, type ImageRatio } from '../Image/Image';
import s from './MediaThumbnail.module.css';

export type MediaType = 'STL' | 'MP4' | 'PDF' | 'PNG';

export type MediaThumbnailProps = Omit<HTMLAttributes<HTMLElement>, 'children'> &
  WithForcedState & {
    src: string;
    alt: string;
    /** File type badge. Omit for plain images. */
    type?: MediaType;
    /** Layer count for models, duration for video, page count for documents. */
    meta?: string;
    /** File name shown under the tile. */
    name?: string;
    selected?: boolean;
    /** Makes the tile a button with a hover open/play overlay. */
    onOpen?: (event: MouseEvent<HTMLElement>) => void;
    /** Fixed tile (64/96/128) or `fluid` to fill a grid cell. */
    size?: 'sm' | 'md' | 'lg' | 'fluid';
    ratio?: ImageRatio;
    disabled?: boolean;
  };

const TYPE_TONE: Record<MediaType, Tone> = { STL: 'accent', MP4: 'neutral', PDF: 'danger', PNG: 'success' };

/**
 * Preview tile for a model or media file: thumbnail, type badge, meta overlay, selected ring and hover open/play affordance.
 * `ref`, `data-state` and DOM attributes go to the tile; `className` goes to the outer wrapper.
 */
export const MediaThumbnail = forwardRef<HTMLElement, MediaThumbnailProps>(function MediaThumbnail(
  { src, alt, type, meta, name, selected, onOpen, size = 'md', ratio = '1/1', disabled, className, ...rest },
  ref,
) {
  const interactive = !!onOpen;
  const OpenIcon = type === 'MP4' ? PlayIcon : Maximize2Icon;
  const label = [name ?? alt, type, meta].filter(Boolean).join(', ');

  const content = (
    <>
      <Image src={src} alt={interactive ? '' : alt} ratio={size === 'fluid' ? ratio : '1/1'} radius="none" compactFallback={size !== 'fluid' && size !== 'lg'} className={s.image} />
      {type && (
        <Badge tone={TYPE_TONE[type]} variant="solid" size="sm" className={s.type}>
          {type}
        </Badge>
      )}
      {meta && (
        <span className={s.meta}>
          {type === 'STL' && <LayersIcon strokeWidth={2.4} aria-hidden="true" />}
          {meta}
        </span>
      )}
      {interactive && (
        <span className={s.overlay} aria-hidden="true">
          <span className={s.openDisc}>
            <OpenIcon strokeWidth={2.4} />
          </span>
        </span>
      )}
      {selected && (
        <span className={s.check} aria-hidden="true">
          <CheckIcon strokeWidth={3.5} />
        </span>
      )}
    </>
  );

  const tileClass = cx(s.tile, interactive && s.interactive, selected && s.selected, disabled && s.disabled);

  return (
    <div className={cx(s.root, s[size], className)}>
      {interactive ? (
        <button
          ref={ref as never}
          type="button"
          className={tileClass}
          aria-label={label}
          aria-current={selected || undefined}
          disabled={disabled}
          onClick={onOpen}
          {...rest}
        >
          {content}
        </button>
      ) : (
        <div ref={ref as never} className={tileClass} aria-current={selected || undefined} {...rest}>
          {content}
        </div>
      )}
      {name && (
        <span className={s.name} title={name} aria-hidden={interactive || undefined}>
          {name}
        </span>
      )}
    </div>
  );
});
