/**
 * Token build: DTCG JSON → CSS custom properties, TypeScript references and
 * runtime metadata for the sandbox. Run with `npm run tokens`.
 *
 * Tiering:
 *   primitives.json      raw palette, scales and physics (the only place raw values live)
 *   semantic.light.json  purpose-named aliases of primitives (light theme)
 *   semantic.dark.json   overrides of the same semantic names for dark theme
 *   component.json       component-scoped aliases of semantic/primitive tokens
 */
import StyleDictionary from 'style-dictionary';
import { fileHeader, formattedVariables } from 'style-dictionary/utils';

const SRC = 'tokens/src/';
const OUT = 'src/tokens/';

const refOf = (token) => {
  const v = token.original?.$value ?? token.original?.value;
  if (typeof v === 'string') {
    const m = v.match(/^\{([^}]+)\}$/);
    return m ? m[1] : null;
  }
  return null;
};

/** Flat metadata the sandbox renders in the Foundations pages. */
StyleDictionary.registerFormat({
  name: 'json/meta',
  format: ({ dictionary, options }) => {
    const rows = dictionary.allTokens.map((t) => ({
      name: `--${t.name}`,
      path: t.path,
      type: t.$type ?? t.type,
      value: t.$value ?? t.value,
      ref: refOf(t),
      description: t.$description ?? t.comment ?? null,
      tier: t.filePath.includes('primitives') ? 'primitive' : t.filePath.includes('component') ? 'component' : 'semantic',
      theme: options.theme,
    }));
    return JSON.stringify(rows, null, 2) + '\n';
  },
});

/** Nested object of `var(--token)` strings so TS code never hard-codes a variable name. */
StyleDictionary.registerFormat({
  name: 'typescript/css-vars',
  format: async ({ dictionary, file }) => {
    const tree = {};
    for (const t of dictionary.allTokens) {
      let node = tree;
      t.path.forEach((seg, i) => {
        const key = /^[a-zA-Z_$][\w$]*$/.test(seg) ? seg : `'${seg}'`;
        if (i === t.path.length - 1) node[key] = `var(--${t.name})`;
        else node = node[key] ??= {};
      });
    }
    const print = (node, depth) => {
      const pad = '  '.repeat(depth);
      return (
        '{\n' +
        Object.entries(node)
          .map(([k, v]) => `${pad}  ${k}: ${typeof v === 'string' ? `'${v}'` : print(v, depth + 1)},`)
          .join('\n') +
        `\n${pad}}`
      );
    };
    const header = await fileHeader({ file });
    return `${header}export const tokens = ${print(tree, 0)} as const;\n\nexport type Tokens = typeof tokens;\n`;
  },
});

/** CSS variables scoped to a selector. Semantic tokens keep their alias chain via var() references. */
StyleDictionary.registerFormat({
  name: 'css/themed-variables',
  format: async ({ dictionary, file, options }) => {
    const header = await fileHeader({ file });
    const body = formattedVariables({ format: 'css', dictionary, outputReferences: options.outputReferences, usesDtcg: true });
    return `${header}${options.selector} {\n${body}\n}\n`;
  },
});

const common = {
  usesDtcg: true,
  log: { verbosity: 'default', warnings: 'warn' },
  platforms: {},
};

const light = new StyleDictionary({
  ...common,
  source: [`${SRC}primitives.json`, `${SRC}semantic.light.json`, `${SRC}component.json`],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: OUT,
      files: [
        {
          destination: 'tokens.css',
          format: 'css/themed-variables',
          options: { selector: ':root,\n[data-theme="light"]', outputReferences: true },
        },
      ],
    },
    ts: {
      transformGroup: 'js',
      transforms: ['name/kebab'],
      buildPath: OUT,
      files: [{ destination: 'tokens.ts', format: 'typescript/css-vars' }],
    },
    meta: {
      transformGroup: 'css',
      buildPath: OUT,
      files: [{ destination: 'tokens.meta.json', format: 'json/meta', options: { theme: 'light' } }],
    },
  },
});

const dark = new StyleDictionary({
  ...common,
  source: [`${SRC}primitives.json`, `${SRC}semantic.dark.json`],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: OUT,
      files: [
        {
          destination: 'tokens.dark.css',
          format: 'css/themed-variables',
          filter: (t) => t.filePath.includes('semantic.dark'),
          options: { selector: '[data-theme="dark"]', outputReferences: true },
        },
      ],
    },
    meta: {
      transformGroup: 'css',
      buildPath: OUT,
      files: [
        {
          destination: 'tokens.dark.meta.json',
          format: 'json/meta',
          filter: (t) => t.filePath.includes('semantic.dark'),
          options: { theme: 'dark' },
        },
      ],
    },
  },
});

await light.buildAllPlatforms();
await dark.buildAllPlatforms();
console.log('tokens built →', OUT);
