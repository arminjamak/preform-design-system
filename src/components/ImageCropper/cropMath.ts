/** Pure crop geometry in image-pixel space. */

export type CropRect = { x: number; y: number; width: number; height: number };
export type CropHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Largest box of `ratio` (or free) covering `fill` of the image, centred. */
export function centeredCrop(W: number, H: number, ratio: number | null, fill = 0.8): CropRect {
  let w = W * fill;
  let h = H * fill;
  if (ratio) {
    if (w / h > ratio) w = h * ratio;
    else h = w / ratio;
  }
  return { x: (W - w) / 2, y: (H - h) / 2, width: w, height: h };
}

export function moveCrop(r: CropRect, dx: number, dy: number, W: number, H: number): CropRect {
  return { ...r, x: clamp(r.x + dx, 0, W - r.width), y: clamp(r.y + dy, 0, H - r.height) };
}

/**
 * Resize from a handle by a pointer delta. Free mode moves the grabbed edges; locked mode anchors the
 * opposite corner (corners) or the opposite edge + centre line (edges) and keeps the ratio.
 */
export function resizeCrop(r: CropRect, handle: CropHandle, dx: number, dy: number, W: number, H: number, ratio: number | null, minSize: number): CropRect {
  const min = Math.max(1, Math.min(minSize, W, H));
  const minW = ratio ? Math.max(min, min * ratio) : min;
  const minH = ratio ? minW / ratio : min;
  const L = r.x;
  const T = r.y;
  const R = r.x + r.width;
  const B = r.y + r.height;
  const hasW = handle.includes('w');
  const hasE = handle.includes('e');
  const hasN = handle.includes('n');
  const hasS = handle.includes('s');

  if (!ratio) {
    const nl = hasW ? clamp(L + dx, 0, R - minW) : L;
    const nr = hasE ? clamp(R + dx, L + minW, W) : R;
    const nt = hasN ? clamp(T + dy, 0, B - minH) : T;
    const nb = hasS ? clamp(B + dy, T + minH, H) : B;
    return { x: nl, y: nt, width: nr - nl, height: nb - nt };
  }

  if ((hasW || hasE) && (hasN || hasS)) {
    const ax = hasW ? R : L;
    const ay = hasN ? B : T;
    const pw = hasW ? r.width - dx : r.width + dx;
    const ph = hasN ? r.height - dy : r.height + dy;
    const maxW = Math.min(hasW ? ax : W - ax, (hasN ? ay : H - ay) * ratio);
    const w = clamp(Math.max(pw, ph * ratio), minW, maxW);
    const h = w / ratio;
    return { x: hasW ? ax - w : ax, y: hasN ? ay - h : ay, width: w, height: h };
  }

  if (hasW || hasE) {
    const ax = hasW ? R : L;
    const cy = T + r.height / 2;
    const maxW = Math.min(hasW ? ax : W - ax, 2 * Math.min(cy, H - cy) * ratio);
    const w = clamp(hasW ? r.width - dx : r.width + dx, minW, maxW);
    const h = w / ratio;
    return { x: hasW ? ax - w : ax, y: cy - h / 2, width: w, height: h };
  }

  const ay = hasN ? B : T;
  const cx = L + r.width / 2;
  const maxH = Math.min(hasN ? ay : H - ay, (2 * Math.min(cx, W - cx)) / ratio);
  const h = clamp(hasN ? r.height - dy : r.height + dy, minH, maxH);
  const w = h * ratio;
  return { x: cx - w / 2, y: hasN ? ay - h : ay, width: w, height: h };
}

export function roundCrop(r: CropRect): CropRect {
  return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
}
