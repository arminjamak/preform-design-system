import { useLayoutEffect, useRef, useState } from 'react';

/** Measures the chart container so SVGs render at real pixel size (crisp 1px gridlines, readable text). */
export function useChartSize<T extends HTMLElement>(fallbackWidth = 480) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallbackWidth);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth || fallbackWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallbackWidth]);
  return { ref, width };
}
