/**
 * Guard: component styles may only use design tokens.
 * Fails on hex/rgb/hsl colours and on px/rem/em/ms lengths that are not inside var() in
 * src/components/**.css and src/styles/base.css, and on hex colours in component TSX.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const targets = [join(ROOT, 'src/components'), join(ROOT, 'src/styles')];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/g;
const LENGTH = /(?<![\w-])-?\d*\.?\d+(?:px|rem|em|ms|s|vh|vw)\b/g;
const ALLOWED_LENGTH = new Set(['0px', '0rem', '0em', '0ms', '0s']);

const problems = [];
for (const file of targets.flatMap(walk)) {
  const rel = relative(ROOT, file);
  const src = readFileSync(file, 'utf8');
  src.split('\n').forEach((line, i) => {
    const code = line.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '');
    if (!code.trim()) return;
    // strip var(--x) references and @keyframes percentages
    const stripped = code.replace(/var\(--[\w-]+\)/g, 'VAR');
    for (const m of stripped.match(COLOR) ?? []) problems.push(`${rel}:${i + 1}  raw colour  ${m}`);
    if (file.endsWith('.css')) {
      for (const m of stripped.match(LENGTH) ?? []) if (!ALLOWED_LENGTH.has(m)) problems.push(`${rel}:${i + 1}  raw length  ${m}`);
    }
  });
}

if (problems.length) {
  console.error(`✖ ${problems.length} raw value(s) found outside tokens:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('✔ components reference tokens only (no raw colours or lengths)');
