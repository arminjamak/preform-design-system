import { forwardRef, useCallback, useLayoutEffect, useRef, type HTMLAttributes, type UIEvent } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import type { StyleWithVars, TokenLength } from '../Stack/space';
import s from './ScrollArea.module.css';

export type ScrollAreaProps = HTMLAttributes<HTMLDivElement> &
  WithForcedState & {
    /** Scroll axis. Default `vertical`. */
    direction?: 'vertical' | 'horizontal' | 'both';
    /** Max height of the scrolling viewport as a token, e.g. `var(--size-layout-panel)`. Omit to fill the parent's height. */
    maxHeight?: TokenLength;
    /** Fade content out at each edge that has more to scroll to. Default `true`. */
    fade?: boolean;
    /** Accessible name; makes the viewport a labelled region. Recommended because the viewport is keyboard-focusable. */
    label?: string;
  };

/**
 * Scroll container with thin token-coloured scrollbars and edge fades that appear only where more content is hidden.
 * `ref` and `onScroll` attach to the scrolling viewport; `className` and other attributes go on the outer wrapper.
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { direction = 'vertical', maxHeight, fade = true, label, className, style, children, onScroll, tabIndex = 0, 'data-state': dataState, ...rest },
  ref,
) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const setViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  /** Writes data-fade-* straight to the DOM so scrolling never re-renders React. */
  const updateEdges = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const slack = 1;
    el.toggleAttribute('data-fade-top', el.scrollTop > slack);
    el.toggleAttribute('data-fade-bottom', el.scrollTop + el.clientHeight < el.scrollHeight - slack);
    el.toggleAttribute('data-fade-left', Math.abs(el.scrollLeft) > slack);
    el.toggleAttribute('data-fade-right', Math.abs(el.scrollLeft) + el.clientWidth < el.scrollWidth - slack);
  }, []);

  useLayoutEffect(() => {
    if (!fade) return;
    updateEdges();
    const ro = new ResizeObserver(updateEdges);
    if (viewportRef.current) ro.observe(viewportRef.current);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [fade, direction, updateEdges]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (fade) updateEdges();
    onScroll?.(e);
  };

  const vars: StyleWithVars = { '--scroll-max-height': maxHeight };

  return (
    <div className={cx(s.root, className)} style={style} data-state={dataState} {...rest}>
      <div
        ref={setViewportRef}
        className={cx(s.viewport, s[direction], fade && s.fade)}
        style={vars}
        tabIndex={tabIndex}
        role={label ? 'region' : undefined}
        aria-label={label}
        onScroll={handleScroll}
      >
        <div ref={contentRef} className={s.content}>
          {children}
        </div>
      </div>
    </div>
  );
});
