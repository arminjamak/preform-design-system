import light from '../../tokens/tokens.meta.json';
import dark from '../../tokens/tokens.dark.meta.json';

export type TokenMeta = {
  name: string;
  path: string[];
  type: string;
  value: unknown;
  ref: string | null;
  description: string | null;
  tier: 'primitive' | 'semantic' | 'component';
  theme: 'light' | 'dark';
};

export const lightTokens = light as TokenMeta[];
export const darkTokens = dark as TokenMeta[];

export const byPrefix = (prefix: string, list: TokenMeta[] = lightTokens) => list.filter((t) => t.path.join('.').startsWith(prefix));

/** "color.bg.canvas → color.neutral.200 → #e5e8eb" */
export const aliasChain = (token: TokenMeta, list: TokenMeta[] = lightTokens): string[] => {
  const chain = [token.path.join('.')];
  let current: TokenMeta | undefined = token;
  while (current?.ref) {
    const next = list.find((t) => t.path.join('.') === current!.ref) ?? lightTokens.find((t) => t.path.join('.') === current!.ref);
    if (!next) break;
    chain.push(next.path.join('.'));
    current = next;
  }
  return chain;
};

export const resolve = (token: TokenMeta): string => {
  const v = token.value;
  if (typeof v === 'object' && v !== null) return JSON.stringify(v);
  return String(v);
};
