/**
 * Demo renders of 3D-printed parts for Media stories.
 *
 * Builds isometric SVG "viewport renders" (bracket, gear, chassis plate, dental model,
 * lattice cube, print report page) as data URIs so stories never touch the network.
 * Colour literals live here on purpose: they are image content, not UI styling, and
 * src/stories is not scanned by the raw-value guard. UI chrome must keep using tokens.
 *
 * Import by relative path from any story: `import { demoParts } from './demo/partImages';`
 */

type Pt = [number, number];
type Vec3 = [number, number, number];
type View = { cx: number; cy: number; s: number };

export type PartKind = 'bracket' | 'supportedBracket' | 'gear' | 'chassis' | 'dental' | 'lattice' | 'report';

export type Resin = { name: string; base: string };

/** Formlabs-style resin swatches used to tint the renders. */
export const resins = {
  grey: { name: 'Grey Resin V5', base: '#8f979f' },
  tough: { name: 'Tough 2000', base: '#7d8a93' },
  black: { name: 'Black Resin V4', base: '#3d4248' },
  model: { name: 'Model Resin V3', base: '#c9b49a' },
  rigid: { name: 'Rigid 10K', base: '#e2e4e1' },
  castable: { name: 'Castable Wax 40', base: '#4f9c86' },
  clear: { name: 'Clear Resin V4', base: '#9cc4dd' },
  white: { name: 'White Resin V5', base: '#dfe2e5' },
} satisfies Record<string, Resin>;

/* ------------------------------------------------------------------ colour */

const hex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
const parse = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return `#${hex(r1 + (r2 - r1) * t)}${hex(g1 + (g2 - g1) * t)}${hex(b1 + (b2 - b1) * t)}`;
}
const lighten = (c: string, t: number) => mix(c, '#ffffff', t);
const darken = (c: string, t: number) => mix(c, '#000000', t);

/* --------------------------------------------------------------- geometry */

const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
const project = ([x, y, z]: Vec3, v: View): Pt => [v.cx + (x - y) * COS * v.s, v.cy + (x + y) * SIN * v.s - z * v.s];
const f = (n: number) => n.toFixed(1);
const pts = (list: Pt[]) => list.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
const poly = (list: Pt[], fill: string, extra = '') => `<polygon points="${pts(list)}" fill="${fill}"${extra}/>`;

/** Shading ids defined once per scene in <defs>. */
const TOP = 'url(#top)';
const LEFT = 'url(#left)';
const RIGHT = 'url(#right)';

function box(v: View, [x, y, z]: Vec3, [w, d, h]: Vec3): string {
  const P = (a: number, b: number, c: number) => project([a, b, c], v);
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const right = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
  const edge = ' stroke="url(#edge)" stroke-width="0.6" stroke-linejoin="round"';
  return poly(left, LEFT, edge) + poly(right, RIGHT, edge) + poly(top, TOP, edge);
}

/** Circle radius r in the xy plane projects to an ellipse with these semi-axes. */
const isoEllipse = (r: number, v: View) => ({ rx: r * v.s * Math.SQRT2 * COS, ry: r * v.s * Math.SQRT2 * SIN });

function hole(v: View, c: Vec3, r: number, base: string): string {
  const [x, y] = project(c, v);
  const { rx, ry } = isoEllipse(r, v);
  return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${darken(base, 0.55)}"/>` +
    `<ellipse cx="${f(x + rx * 0.12)}" cy="${f(y + ry * 0.25)}" rx="${f(rx * 0.82)}" ry="${f(ry * 0.7)}" fill="${darken(base, 0.35)}"/>`;
}

function cylinder(v: View, [x, y, z0]: Vec3, r: number, h: number, base: string, id: string): string {
  const [bx, by] = project([x, y, z0], v);
  const [tx, ty] = project([x, y, z0 + h], v);
  const { rx, ry } = isoEllipse(r, v);
  return `<linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${lighten(base, 0.12)}"/><stop offset="0.45" stop-color="${base}"/><stop offset="1" stop-color="${darken(base, 0.35)}"/></linearGradient>` +
    `<path d="M${f(tx - rx)},${f(ty)} L${f(bx - rx)},${f(by)} A${f(rx)},${f(ry)} 0 0 0 ${f(bx + rx)},${f(by)} L${f(tx + rx)},${f(ty)} Z" fill="url(#${id})"/>` +
    `<ellipse cx="${f(tx)}" cy="${f(ty)}" rx="${f(rx)}" ry="${f(ry)}" fill="${lighten(base, 0.3)}" stroke="${darken(base, 0.2)}" stroke-width="0.5"/>`;
}

/** Extrudes a closed xy outline from z0 by h with per-facet Lambert-ish shading. */
function extrude(v: View, outline: Pt[], z0: number, h: number, base: string, topFill = TOP): string {
  let ring = outline;
  const area = ring.reduce((a, [x1, y1], i) => {
    const [x2, y2] = ring[(i + 1) % ring.length];
    return a + x1 * y2 - x2 * y1;
  }, 0);
  if (area < 0) ring = [...ring].reverse();
  const sides: Array<{ depth: number; svg: string }> = [];
  ring.forEach(([x1, y1], i) => {
    const [x2, y2] = ring[(i + 1) % ring.length];
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = (y2 - y1) / len;
    const ny = -(x2 - x1) / len;
    if (nx + ny <= 0) return;
    const k = (ny - nx + 1.42) / 2.84; // 0 = facing x+ (dark), 1 = facing y+ (lit)
    const fill = mix(darken(base, 0.32), lighten(base, 0.04), k);
    const quad = [project([x1, y1, z0], v), project([x2, y2, z0], v), project([x2, y2, z0 + h], v), project([x1, y1, z0 + h], v)];
    sides.push({ depth: (x1 + x2 + y1 + y2) / 2, svg: poly(quad, fill, ` stroke="${fill}" stroke-width="0.5"`) });
  });
  sides.sort((a, b) => a.depth - b.depth);
  const top = ring.map(([x, y]) => project([x, y, z0 + h], v));
  return sides.map((s) => s.svg).join('') + poly(top, topFill, ' stroke="url(#edge)" stroke-width="0.6" stroke-linejoin="round"');
}

const circle = (cx: number, cy: number, r: number, n = 20): Pt[] =>
  Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * Math.PI * 2), cy + r * Math.sin((i / n) * Math.PI * 2)]);

/* ------------------------------------------------------------------ scene */

const W = 400;
const H = 300;

function scene(body: string, base: string, shadow: { rx: number; ry: number; dy?: number } = { rx: 120, ry: 34 }, shift = 0): string {
  const v: View = { cx: W / 2, cy: H / 2 + 40, s: 14 };
  const floor = [-8, 8];
  const grid: string[] = [];
  for (let i = floor[0]; i <= floor[1]; i += 2) {
    const a = project([i, floor[0], 0], v);
    const b = project([i, floor[1], 0], v);
    const c = project([floor[0], i, 0], v);
    const d = project([floor[1], i, 0], v);
    grid.push(`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/><line x1="${f(c[0])}" y1="${f(c[1])}" x2="${f(d[0])}" y2="${f(d[1])}"/>`);
  }
  const plate = [project([floor[0], floor[0], 0], v), project([floor[1], floor[0], 0], v), project([floor[1], floor[1], 0], v), project([floor[0], floor[1], 0], v)];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3f5f8"/><stop offset="1" stop-color="#d7dde4"/></linearGradient>
<radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75"><stop offset="0.6" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#6b7785" stop-opacity="0.18"/></radialGradient>
<linearGradient id="top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(base, 0.42)}"/><stop offset="1" stop-color="${lighten(base, 0.2)}"/></linearGradient>
<linearGradient id="left" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(base, 0.08)}"/><stop offset="1" stop-color="${darken(base, 0.08)}"/></linearGradient>
<linearGradient id="right" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${darken(base, 0.2)}"/><stop offset="1" stop-color="${darken(base, 0.36)}"/></linearGradient>
<linearGradient id="edge"><stop offset="0" stop-color="${darken(base, 0.4)}" stop-opacity="0.35"/><stop offset="1" stop-color="${darken(base, 0.4)}" stop-opacity="0.35"/></linearGradient>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${poly(plate, '#e6eaee', ' stroke="#c9d0d8" stroke-width="1"')}
<g stroke="#d3d9e0" stroke-width="0.6">${grid.join('')}</g>
<g transform="translate(0 ${shift})">
<ellipse cx="${W / 2}" cy="${v.cy + (shadow.dy ?? 0)}" rx="${shadow.rx}" ry="${shadow.ry}" fill="#1b2129" opacity="0.22" filter="url(#soft)"/>
${body}
</g>
<rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;
}

const VIEW: View = { cx: W / 2, cy: H / 2 + 40, s: 14 };

/* ------------------------------------------------------------------ parts */

function bracket(base: string, lift = 0): string {
  const v = VIEW;
  const z = lift;
  let out = '';
  out += box(v, [-5, -3, z], [10, 6, 1.1]);
  out += hole(v, [-2.6, 1, z + 1.1], 0.7, base) + hole(v, [2.6, 1, z + 1.1], 0.7, base);
  // gussets (drawn as extruded triangles in the xz plane approximated by thin boxes)
  out += extrude(v, [[-4.6, -3], [-3.8, -3], [-3.8, -2.4], [-4.6, -2.4]], z + 1.1, 3.2, base);
  out += box(v, [-5, -3, z + 1.1], [10, 1.1, 5]);
  out += hole(v, [-2.6, -2.45, z + 6.1], 0.55, base) + hole(v, [2.6, -2.45, z + 6.1], 0.55, base);
  out += extrude(v, [[-0.4, -1.9], [0.4, -1.9], [0.4, 1.8], [-0.4, -0.6]], z + 1.1, 3.2, base);
  return out;
}

function supportedBracket(base: string): string {
  const v = VIEW;
  const support = darken(base, 0.05);
  let out = box(v, [-5.6, -3.6, 0], [11.2, 7.2, 0.35]); // raft
  const posts: Vec3[] = [];
  for (let x = -4.4; x <= 4.5; x += 2.2) for (let y = -2.2; y <= 2.3; y += 2.2) posts.push([x, y, 0.35]);
  posts.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  posts.forEach((p, i) => (out += cylinder(v, p, 0.16, 1.9, support, `post${i}`)));
  return out + bracket(base, 2.25);
}

function gear(base: string): string {
  const v = VIEW;
  const teeth = 16;
  const R = 5.2;
  const r = 4.3;
  const outline: Pt[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const step = (Math.PI * 2) / teeth;
    for (const [da, rad] of [[0, r], [0.22, R], [0.5, R], [0.72, r]] as const) {
      outline.push([Math.cos(a + da * step) * rad, Math.sin(a + da * step) * rad]);
    }
  }
  let out = extrude(v, outline, 0, 1.6, base);
  // hub
  out += extrude(v, circle(0, 0, 1.9, 28), 1.6, 0.8, base);
  out += hole(v, [0, 0, 2.4], 0.9, base);
  // lightening holes
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    out += hole(v, [Math.cos(a) * 3.1, Math.sin(a) * 3.1, 1.6], 0.62, base);
  }
  return out;
}

function chassis(base: string): string {
  const v = VIEW;
  let out = box(v, [-6, -4, 0], [12, 8, 0.6]);
  const cut = darken(base, 0.5);
  const slot = (x: number, y: number, w: number, d: number) =>
    poly([project([x, y, 0.6], v), project([x + w, y, 0.6], v), project([x + w, y + d, 0.6], v), project([x, y + d, 0.6], v)], cut);
  out += slot(-4.2, -2.4, 3.2, 1.8) + slot(-4.2, 0.6, 3.2, 1.8) + slot(1, -2.4, 3.4, 4.8);
  for (let i = 0; i < 5; i++) out += slot(-0.4, -2.6 + i * 1.1, 0.8, 0.5);
  // ribs along the back edges, then standoffs front to back
  out += box(v, [-6, -4, 0.6], [12, 0.5, 0.9]) + box(v, [-6, -3.5, 0.6], [0.5, 7.5, 0.9]);
  const standoffs: Vec3[] = [[-5, -3, 0.6], [5, -3, 0.6], [-5, 3, 0.6], [5, 3, 0.6], [0, 0, 0.6]];
  standoffs.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  standoffs.forEach((p, i) => {
    out += cylinder(v, p, 0.55, 1.6, base, `standoff${i}`);
    out += hole(v, [p[0], p[1], 2.2], 0.25, base);
  });
  return out;
}

function dental(base: string): string {
  const v = VIEW;
  const rot = (Math.PI * 3) / 4; // opening faces the camera
  const rotate = ([x, y]: Pt): Pt => [x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)];
  const arch: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI;
    arch.push(rotate([Math.cos(t) * 5.6, Math.sin(t) * 5.2 - 1.6]));
  }
  for (let i = 24; i >= 0; i--) {
    const t = (i / 24) * Math.PI;
    arch.push(rotate([Math.cos(t) * 3, Math.sin(t) * 2.7 - 1.6]));
  }
  let out = extrude(v, arch, 0, 1.4, darken(base, 0.04));
  // gum ridge
  const ridge: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI;
    ridge.push(rotate([Math.cos(t) * 5, Math.sin(t) * 4.6 - 1.6]));
  }
  for (let i = 24; i >= 0; i--) {
    const t = (i / 24) * Math.PI;
    ridge.push(rotate([Math.cos(t) * 3.5, Math.sin(t) * 3.2 - 1.6]));
  }
  out += extrude(v, ridge, 1.4, 0.6, base);
  const tooth = lighten(base, 0.35);
  const teeth: Array<{ c: Pt; r: number; h: number }> = [];
  const count = 14;
  for (let i = 0; i < count; i++) {
    const t = ((i + 0.5) / count) * Math.PI;
    const fromCenter = Math.abs(i + 0.5 - count / 2) / (count / 2);
    const r = 0.42 + fromCenter * 0.32;
    teeth.push({ c: rotate([Math.cos(t) * 4.25, Math.sin(t) * 3.9 - 1.6]), r, h: 1.1 - fromCenter * 0.35 });
  }
  teeth.sort((a, b) => a.c[0] + a.c[1] - (b.c[0] + b.c[1]));
  teeth.forEach(({ c, r, h }, i) => {
    out += extrude(v, circle(c[0], c[1], r, 14), 2, h, tooth, `url(#tooth${i})`);
    const [x, y] = project([c[0], c[1], 2 + h], v);
    const { rx, ry } = isoEllipse(r, v);
    out = `<radialGradient id="tooth${i}" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fffaf2"/><stop offset="1" stop-color="${tooth}"/></radialGradient>` + out;
    out += `<ellipse cx="${f(x - rx * 0.2)}" cy="${f(y - ry * 0.2)}" rx="${f(rx * 0.4)}" ry="${f(ry * 0.35)}" fill="#ffffff" opacity="0.45"/>`;
  });
  return out;
}

function lattice(): string {
  const v = VIEW;
  const n = 4;
  const c = 2.6;
  const t = 0.34;
  const o = -((n - 1) * c) / 2;
  const beams: Array<{ depth: number; svg: string }> = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < n; k++) {
        const x = o + i * c;
        const y = o + j * c;
        const z = 0.4 + k * c;
        const push = (p: Vec3, s: Vec3) => beams.push({ depth: p[0] + s[0] / 2 + p[1] + s[1] / 2 + p[2] + s[2] / 2, svg: box(v, p, s) });
        if (i < n - 1) push([x, y - t / 2, z - t / 2], [c, t, t]);
        if (j < n - 1) push([x - t / 2, y, z - t / 2], [t, c, t]);
        if (k < n - 1) push([x - t / 2, y - t / 2, z], [t, t, c]);
        push([x - t * 0.7, y - t * 0.7, z - t * 0.7], [t * 1.4, t * 1.4, t * 1.4]);
      }
  beams.sort((a, b) => a.depth - b.depth);
  return beams.map((b) => b.svg).join('');
}

function report(base: string): string {
  const lines = (x: number, y: number, widths: number[], gap = 9) =>
    widths.map((w, i) => `<rect x="${x}" y="${y + i * gap}" width="${w}" height="4" rx="2" fill="#c3cad2"/>`).join('');
  const thumb = `<g transform="translate(116 24) scale(0.42)">${gear(base)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}">
<defs>
<linearGradient id="top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(base, 0.42)}"/><stop offset="1" stop-color="${lighten(base, 0.2)}"/></linearGradient>
<linearGradient id="edge"><stop offset="0" stop-color="${darken(base, 0.4)}" stop-opacity="0.35"/><stop offset="1" stop-color="${darken(base, 0.4)}" stop-opacity="0.35"/></linearGradient>
<filter id="paper" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#141c26" flood-opacity="0.18"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="#d9dee4"/>
<g filter="url(#paper)"><rect x="104" y="14" width="192" height="272" rx="3" fill="#ffffff"/></g>
<rect x="104" y="14" width="192" height="26" rx="3" fill="#0a63c9"/><rect x="104" y="30" width="192" height="10" fill="#0a63c9"/>
<text x="116" y="31" font-family="Figtree, system-ui, sans-serif" font-size="10" font-weight="700" fill="#ffffff">Print report</text>
<rect x="116" y="52" width="168" height="96" rx="2" fill="#eef1f4"/>
${thumb}
<text x="116" y="164" font-family="Figtree, system-ui, sans-serif" font-size="8" font-weight="700" fill="#30343a">spur_gear_16T.form</text>
${lines(116, 172, [150, 120, 138])}
<line x1="116" y1="206" x2="284" y2="206" stroke="#e5e8eb"/>
${[0, 1, 2, 3].map((i) => `<rect x="116" y="${214 + i * 14}" width="60" height="4" rx="2" fill="#b2b6bc"/><rect x="${224 - (i % 2) * 12}" y="${214 + i * 14}" width="${60 + (i % 2) * 12}" height="4" rx="2" fill="#8d9298"/>`).join('')}
</svg>`;
}

/* ------------------------------------------------------------------ public */

const svgUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\n/g, ''))}`;

/** Renders one part in one resin as an SVG data URI (4:3, 800×600 intrinsic). */
export function renderPart(kind: PartKind, resin: Resin = resins.grey): string {
  const base = resin.base;
  switch (kind) {
    case 'bracket':
      return svgUri(scene(bracket(base), base, { rx: 110, ry: 30 }, -6));
    case 'supportedBracket':
      return svgUri(scene(supportedBracket(base), base, { rx: 120, ry: 34 }));
    case 'gear':
      return svgUri(scene(gear(base), base, { rx: 100, ry: 40 }, -34));
    case 'chassis':
      return svgUri(scene(chassis(base), base, { rx: 130, ry: 38 }, -30));
    case 'dental':
      return svgUri(scene(dental(base), base, { rx: 100, ry: 34 }, -28));
    case 'lattice':
      return svgUri(scene(lattice(), base, { rx: 90, ry: 32 }));
    case 'report':
      return svgUri(report(base));
  }
}

export type DemoPart = {
  src: string;
  alt: string;
  caption: string;
  /** File name as it appears in the PreForm job list. */
  name: string;
  type: 'STL' | 'MP4' | 'PDF';
  /** Layer count for models, duration for timelapses, page count for reports. */
  meta: string;
};

/** Eight renders for galleries, lightboxes and carousels. */
export const demoParts: DemoPart[] = [
  { src: renderPart('bracket', resins.grey), name: 'mounting_bracket_v3.stl', type: 'STL', meta: '1,284 layers', alt: 'Grey resin L-shaped mounting bracket with two bolt holes and a centre gusset', caption: 'Mounting bracket · Grey Resin V5 · 50 µm · 1,284 layers' },
  { src: renderPart('gear', resins.tough), name: 'spur_gear_16T.stl', type: 'STL', meta: '412 layers', alt: 'Sixteen-tooth spur gear with raised hub and five lightening holes in Tough 2000', caption: 'Spur gear, 16 teeth · Tough 2000 · 100 µm · 412 layers' },
  { src: renderPart('chassis', resins.black), name: 'drone_chassis_plate.stl', type: 'STL', meta: '638 layers', alt: 'Black chassis plate with rectangular cutouts, edge ribs and five threaded standoffs', caption: 'Drone chassis plate · Black Resin V4 · 50 µm · 638 layers' },
  { src: renderPart('dental', resins.model), name: 'upper_arch_model.stl', type: 'STL', meta: '956 layers', alt: 'Beige dental model of an upper arch with fourteen teeth on a horseshoe base', caption: 'Upper arch dental model · Model Resin V3 · 25 µm · 956 layers' },
  { src: renderPart('lattice', resins.rigid), name: 'lattice_cube_20mm.stl', type: 'STL', meta: '1,560 layers', alt: 'White cubic lattice of three by three cells with node joints', caption: 'Lattice test cube 20 mm · Rigid 10K · 50 µm · 1,560 layers' },
  { src: renderPart('supportedBracket', resins.grey), name: 'bracket_supports_timelapse.mp4', type: 'MP4', meta: '0:42', alt: 'Mounting bracket raised on a raft with a grid of auto-generated support pillars', caption: 'Print timelapse · Bracket on auto supports · 0:42' },
  { src: renderPart('gear', resins.castable), name: 'gear_castable_wax.stl', type: 'STL', meta: '388 layers', alt: 'Green castable wax spur gear for investment casting', caption: 'Spur gear for casting · Castable Wax 40 · 50 µm · 388 layers' },
  { src: renderPart('report', resins.tough), name: 'print_report_job_1182.pdf', type: 'PDF', meta: '3 pages', alt: 'First page of a PDF print report showing the spur gear and job statistics', caption: 'Print report, job #1182 · Form 4 · 3 pages' },
];

/** A data URI that fails to decode, for error-state demos (no network involved). */
export const brokenImageSrc = 'data:image/svg+xml;charset=utf-8,%3Csvg';
