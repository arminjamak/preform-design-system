import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import s from './Carousel.module.css';

export type CarouselProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  /** Each child is one slide. Ignored when `items` is set. */
  children?: ReactNode;
  /** Slides as an array (alternative to children). */
  items?: ReactNode[];
  /** Visible slides at once; fractions (e.g. 1.5) let the next slide peek in. */
  slidesPerView?: number;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  /** Advance automatically. Pauses while the slides are hovered or focused and when the tab is hidden; starts paused under reduced motion. */
  autoplay?: boolean;
  /** Autoplay interval in milliseconds. */
  interval?: number;
  /** Wrap from the last position to the first with the arrow buttons and keys. */
  loop?: boolean;
  showDots?: boolean;
  showArrows?: boolean;
  /** Accessible name of the carousel region. */
  label?: string;
  /** Called when the leading visible slide changes. */
  onIndexChange?: (index: number) => void;
};

function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Horizontal scroll-snap carousel with prev/next buttons, dot indicators and optional autoplay. */
export function Carousel({
  children,
  items,
  slidesPerView = 1,
  gap = 'md',
  autoplay = false,
  interval = 5000,
  loop = false,
  showDots = true,
  showArrows = true,
  label = 'Carousel',
  onIndexChange,
  className,
  style,
  onKeyDown,
  ...rest
}: CarouselProps) {
  const slides = items ?? Children.toArray(children);
  const count = slides.length;
  const perView = Math.max(1, slidesPerView);
  const positions = Math.max(1, Math.ceil(count - perView) + 1);

  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  /** null until the user presses pause/play; reduced motion starts paused. */
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [hidden, setHidden] = useState(false);
  const reducedMotion = useReducedMotion();

  const scrollToIndex = useCallback(
    (i: number) => {
      const track = trackRef.current;
      const slide = track?.children[i] as HTMLElement | undefined;
      if (!track || !slide) return;
      track.scrollTo({ left: slide.offsetLeft, behavior: reducedMotion ? 'auto' : 'smooth' });
    },
    [reducedMotion],
  );

  const go = useCallback(
    (delta: number, wrap = loop) => {
      let next = index + delta;
      if (wrap) next = (next + positions) % positions;
      next = Math.min(Math.max(next, 0), positions - 1);
      if (next !== index) scrollToIndex(next);
    },
    [index, loop, positions, scrollToIndex],
  );

  // Derive the leading slide from the scroll position so swipes, wheel and keyboard scrolling all stay in sync.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = track.scrollWidth - track.clientWidth;
      let next = 0;
      if (track.scrollLeft >= max - 1) next = positions - 1;
      else {
        let best = Infinity;
        Array.from(track.children).forEach((el, i) => {
          const d = Math.abs((el as HTMLElement).offsetLeft - track.scrollLeft);
          if (d < best) {
            best = d;
            next = i;
          }
        });
      }
      setIndex(Math.min(next, positions - 1));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      track.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [positions]);

  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;
  useEffect(() => onIndexChangeRef.current?.(index), [index]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const paused = userPaused ?? reducedMotion;
  const playing = autoplay && !paused && !hovered && !focused && !hidden && positions > 1;
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => go(1, true), Math.max(interval, 1000));
    return () => window.clearInterval(id);
  }, [playing, interval, go]);

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Home') scrollToIndex(0);
    else if (e.key === 'End') scrollToIndex(positions - 1);
    else return;
    e.preventDefault();
  };

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
  };

  const canPrev = loop ? positions > 1 : index > 0;
  const canNext = loop ? positions > 1 : index < positions - 1;
  const trackStyle = { '--carousel-per-view': perView } as CSSProperties;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className={cx(s.root, s[gap], className)}
      style={style}
      onKeyDown={handleKeyDown}
      onFocus={(e) => setFocused(!(e.target as HTMLElement).closest('[data-autoplay-toggle]'))}
      onBlur={onBlur}
      {...rest}
    >
      <div className={s.viewport} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
        <div ref={trackRef} className={s.track} style={trackStyle} role="group" tabIndex={0} aria-live={playing ? 'off' : 'polite'} aria-label={`${label} slides`}>
          {slides.map((slide, i) => (
            <div key={i} className={s.slide} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}>
              {slide}
            </div>
          ))}
        </div>
        {showArrows && positions > 1 && (
          <>
            <IconButton label="Previous slide" icon={<ChevronLeftIcon strokeWidth={2.4} />} variant="floating" shape="circle" size="md" className={cx(s.arrow, s.prev)} onClick={() => go(-1)} disabled={!canPrev} />
            <IconButton label="Next slide" icon={<ChevronRightIcon strokeWidth={2.4} />} variant="floating" shape="circle" size="md" className={cx(s.arrow, s.next)} onClick={() => go(1)} disabled={!canNext} />
          </>
        )}
      </div>
      {((showDots && positions > 1) || autoplay) && (
        <div className={s.controls}>
          {autoplay && (
            <IconButton
              data-autoplay-toggle=""
              label={paused ? 'Start autoplay' : 'Pause autoplay'}
              icon={paused ? <PlayIcon strokeWidth={2.4} /> : <PauseIcon strokeWidth={2.4} />}
              size="xs"
              shape="circle"
              onClick={() => setUserPaused(!paused)}
            />
          )}
          {showDots && positions > 1 && (
            <div className={s.dots} role="group" aria-label="Choose slide">
              {Array.from({ length: positions }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={cx(s.dot, i === index && s.dotCurrent)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index || undefined}
                  onClick={() => scrollToIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
