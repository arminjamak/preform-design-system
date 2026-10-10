/** Myers O((N+M)·D) sequence diff, used for both lines and words. No dependencies. */

export type DiffOp = { type: 'equal' | 'del' | 'add'; a: number; b: number };

function myers<T>(a: T[], b: T[], aOff: number, bOff: number, out: DiffOp[]) {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  if (max === 0) return;
  const offset = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace: Int32Array[] = [];
  let found = false;
  for (let d = 0; d <= max && !found; d++) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]) ? v[offset + k + 1] : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) {
        found = true;
        break;
      }
    }
  }
  const ops: DiffOp[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const vd = trace[d];
    const k = x - y;
    const prevK = k === -d || (k !== d && vd[offset + k - 1] < vd[offset + k + 1]) ? k + 1 : k - 1;
    const prevX = vd[offset + prevK];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      ops.push({ type: 'equal', a: aOff + x - 1, b: bOff + y - 1 });
      x--;
      y--;
    }
    if (d > 0) {
      if (x === prevX) ops.push({ type: 'add', a: aOff + x, b: bOff + y - 1 });
      else ops.push({ type: 'del', a: aOff + x - 1, b: bOff + y });
    }
    x = prevX;
    y = prevY;
  }
  for (let i = ops.length - 1; i >= 0; i--) out.push(ops[i]);
}

/** Returns edit operations turning `a` into `b`; `a`/`b` fields index into the inputs. */
export function diffSequences<T>(a: T[], b: T[]): DiffOp[] {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const out: DiffOp[] = [];
  for (let i = 0; i < start; i++) out.push({ type: 'equal', a: i, b: i });
  myers(a.slice(start, endA), b.slice(start, endB), start, start, out);
  for (let i = 0; i < a.length - endA; i++) out.push({ type: 'equal', a: endA + i, b: endB + i });
  return out;
}

export type Segment = { text: string; changed: boolean };

const WORD = /\s+|\d+(?:\.\d+)?|[A-Za-z0-9_]+|[^\sA-Za-z0-9_]/g;

/** Word-level diff of two lines. Returns null when the lines share too little to be worth marking. */
export function diffWords(oldLine: string, newLine: string): { old: Segment[]; new: Segment[] } | null {
  const a = oldLine.match(WORD) ?? [];
  const b = newLine.match(WORD) ?? [];
  const ops = diffSequences(a, b);
  let same = 0;
  for (const op of ops) if (op.type === 'equal' && a[op.a].trim()) same += a[op.a].length;
  const longest = Math.max(oldLine.trim().length, newLine.trim().length);
  if (!longest || same / longest < 0.4) return null;
  const oldSegs: Segment[] = [];
  const newSegs: Segment[] = [];
  const push = (list: Segment[], text: string, changed: boolean) => {
    const last = list[list.length - 1];
    if (last && last.changed === changed) last.text += text;
    else list.push({ text, changed });
  };
  for (const op of ops) {
    if (op.type === 'equal') {
      push(oldSegs, a[op.a], false);
      push(newSegs, b[op.b], false);
    } else if (op.type === 'del') push(oldSegs, a[op.a], true);
    else push(newSegs, b[op.b], true);
  }
  return { old: oldSegs, new: newSegs };
}
