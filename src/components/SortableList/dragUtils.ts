import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * FLIP: after every render, any element marked `data-flip-id` that moved inside `root`
 * is translated back to where it was and released, so the CSS transition on the element
 * (driven by `--motion-duration-base`) animates it into its new slot.
 * The translate amounts are measured pixels, which is the only place raw numbers are used.
 */
export function useFlip(root: RefObject<HTMLElement>, skipId: string | null) {
  const prev = useRef(new Map<string, { x: number; y: number }>());
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const next = new Map<string, { x: number; y: number }>();
    el.querySelectorAll<HTMLElement>('[data-flip-id]').forEach((node) => {
      const id = node.dataset.flipId as string;
      const pos = layoutPosition(node, el);
      next.set(id, pos);
      const before = prev.current.get(id);
      if (id === skipId || !before) return;
      const dx = before.x - pos.x;
      const dy = before.y - pos.y;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      node.style.transition = 'none';
      node.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      void node.offsetWidth;
      node.style.transition = '';
      node.style.transform = '';
    });
    prev.current = next;
  });
}

/** Layout position (ignores transforms and scrolling) of `node` inside `root`. */
function layoutPosition(node: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = node;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

/** Scale and shadow ease in while the transform tracks the pointer 1:1. */
const LIFT_TRANSITION = 'scale var(--motion-duration-fast) var(--motion-easing-standard), box-shadow var(--motion-duration-fast) var(--motion-easing-standard)';

/** Moves the lifted element so it sits under the pointer, relative to its (untransformed) slot. */
export function positionLift(slot: HTMLElement | undefined, lift: HTMLElement | undefined, pointer: { x: number; y: number }, grab: { x: number; y: number }, lockX = false) {
  if (!slot || !lift) return;
  const r = slot.getBoundingClientRect();
  const x = lockX ? 0 : pointer.x - grab.x - r.left;
  const y = pointer.y - grab.y - r.top;
  lift.style.transition = LIFT_TRANSITION;
  lift.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

/** Releases a lifted element back into its slot with the standard easing. */
export function settleLift(lift: HTMLElement | undefined) {
  if (!lift) return;
  lift.style.transition = 'transform var(--motion-duration-base) var(--motion-easing-standard), scale var(--motion-duration-base) var(--motion-easing-standard), box-shadow var(--motion-duration-base) var(--motion-easing-standard)';
  lift.style.transform = '';
  const done = () => {
    lift.style.transition = '';
    lift.removeEventListener('transitionend', done);
  };
  lift.addEventListener('transitionend', done);
}

/** Locks text selection and shows the grabbing cursor while a pointer drag is in progress. */
export function lockBody(locked: boolean) {
  if (typeof document === 'undefined') return;
  document.body.style.userSelect = locked ? 'none' : '';
  document.body.style.cursor = locked ? 'grabbing' : '';
}

export const KEYBOARD_INSTRUCTIONS = 'Press Space or Enter to pick up. While holding, use the arrow keys to move, Space or Enter to drop, and Escape to cancel.';
