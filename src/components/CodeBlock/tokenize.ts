/**
 * A deliberately tiny, dependency-free syntax tokenizer.
 *
 * Each language is an ordered list of sticky regular expressions. The scanner tries every
 * rule at the current position, emits the first match and falls back to a one-character
 * `plain` token. Identifiers are classified afterwards (keyword, builtin, type, function).
 * Good enough for documentation snippets and small editors; not a parser.
 */

export type CodeLanguage = 'typescript' | 'javascript' | 'json' | 'python' | 'bash' | 'gcode' | 'css' | 'text';

export type TokenType =
  | 'plain'
  | 'keyword'
  | 'string'
  | 'number'
  | 'comment'
  | 'punctuation'
  | 'operator'
  | 'function'
  | 'type'
  | 'property'
  | 'variable';

export type Token = { type: TokenType; text: string };

/** Human label shown in code block headers. */
export const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  json: 'JSON',
  python: 'Python',
  bash: 'Bash',
  gcode: 'G-code',
  css: 'CSS',
  text: 'Plain text',
};

const ALIASES: Record<string, CodeLanguage> = {
  ts: 'typescript',
  tsx: 'typescript',
  typescript: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  javascript: 'javascript',
  json: 'json',
  py: 'python',
  python: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  bash: 'bash',
  console: 'bash',
  gcode: 'gcode',
  'g-code': 'gcode',
  nc: 'gcode',
  css: 'css',
  text: 'text',
  txt: 'text',
  plain: 'text',
};

/** Maps a fence info string or file extension (`ts`, `py`, `sh`, `gcode`) to a supported language. */
export function resolveLanguage(name: string | undefined): CodeLanguage {
  if (!name) return 'text';
  return ALIASES[name.trim().toLowerCase()] ?? 'text';
}

type Rule = [TokenType | 'ident', RegExp];

const words = (list: string) => new Set(list.split(' '));

const JS_KEYWORDS = words(
  'abstract as async await break case catch class const continue debugger declare default delete do else enum export extends finally for from function get if implements import in infer instanceof interface keyof let new of private protected public readonly return satisfies set static super switch this throw try type typeof var void while with yield',
);
const JS_LITERALS = words('true false null undefined NaN Infinity');
const JS_TYPES = words('string number boolean unknown any never object symbol bigint void Promise Record Array Map Set');

const PY_KEYWORDS = words(
  'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case',
);
const PY_LITERALS = words('True False None self cls');
const PY_BUILTINS = words('print len range open int float str list dict set tuple enumerate zip sorted min max sum abs isinstance round any all map filter super');

const SH_KEYWORDS = words('if then else elif fi for while until do done case esac function in return local export readonly declare set unset shift exit source');
const SH_BUILTINS = words('echo cd ls cat grep sed awk curl wget pip pip3 python python3 npm npx node git sudo chmod mkdir rm cp mv tar ssh scp');

const CSS_KEYWORDS = words('important inherit initial unset revert none auto');

const LINE_COMMENT_SLASH: Rule = ['comment', /\/\/[^\n]*/y];
const BLOCK_COMMENT: Rule = ['comment', /\/\*[\s\S]*?(?:\*\/|$)/y];
const DQ: Rule = ['string', /"(?:\\.|[^"\\\n])*"?/y];
const SQ: Rule = ['string', /'(?:\\.|[^'\\\n])*'?/y];
const NUMBER: Rule = ['number', /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|(?:\d[\d_]*\.?\d*|\.\d+)(?:[eE][+-]?\d+)?n?)/y];
const IDENT: Rule = ['ident', /[A-Za-z_$][\w$]*/y];
const WS: Rule = ['plain', /\s+/y];

const RULES: Record<Exclude<CodeLanguage, 'text'>, Rule[]> = {
  typescript: [
    WS,
    LINE_COMMENT_SLASH,
    BLOCK_COMMENT,
    DQ,
    SQ,
    ['string', /`(?:\\[\s\S]|[^`\\])*`?/y],
    ['function', /@[A-Za-z_][\w.]*/y],
    NUMBER,
    IDENT,
    ['operator', /=>|[=+\-*/%<>!&|^~?:]+/y],
    ['punctuation', /[{}()[\];,.]/y],
  ],
  javascript: [],
  json: [
    WS,
    ['property', /"(?:\\.|[^"\\\n])*"(?=\s*:)/y],
    DQ,
    ['number', /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y],
    IDENT,
    ['punctuation', /[{}[\],:]/y],
  ],
  python: [
    WS,
    ['comment', /#[^\n]*/y],
    ['string', /[rRbBfFuU]{0,2}(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$))/y],
    ['string', /[rRbBfFuU]{0,2}(?:"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)/y],
    ['function', /@[A-Za-z_][\w.]*/y],
    NUMBER,
    IDENT,
    ['operator', /->|[=+\-*/%<>!&|^~@:]+/y],
    ['punctuation', /[{}()[\];,.]/y],
  ],
  bash: [
    WS,
    ['comment', /(?<![^\s])#[^\n]*/y],
    DQ,
    ['string', /'[^']*'?/y],
    ['variable', /\$(?:\{[^}\n]*\}?|\(|[A-Za-z_]\w*|[@*#?$!0-9-])/y],
    ['property', /(?<![^\s])--?[A-Za-z][\w-]*/y],
    ['number', /\b\d+(?:\.\d+)*\b/y],
    ['ident', /[A-Za-z_][\w.-]*/y],
    ['operator', /&&|\|\||[|&;<>=]+/y],
    ['punctuation', /[{}()[\],]/y],
  ],
  gcode: [
    WS,
    ['comment', /;[^\n]*/y],
    ['comment', /\([^)\n]*\)?/y],
    ['keyword', /[gG]\d+(?:\.\d+)?(?![\d.])/y],
    ['function', /[mM]\d+(?![\d.])/y],
    ['type', /[tTnNoO]\d+(?![\d.])/y],
    ['operator', /[A-Za-z](?=[-+]?[\d.])/y],
    ['number', /[-+]?(?:\d+\.?\d*|\.\d+)/y],
    ['punctuation', /[*%=:]/y],
  ],
  css: [
    WS,
    BLOCK_COMMENT,
    DQ,
    SQ,
    ['keyword', /@[\w-]+/y],
    ['variable', /--[\w-]+/y],
    ['property', /[a-zA-Z-][\w-]*(?=\s*:[^{;]*[;}])/y],
    ['number', /#[\da-fA-F]{3,8}(?![\w-])/y],
    ['number', /-?(?:\d+\.?\d*|\.\d+)(?:%|[a-zA-Z]+)?/y],
    ['function', /[a-zA-Z-][\w-]*(?=\()/y],
    ['type', /[.#][a-zA-Z_-][\w-]*/y],
    ['keyword', /!important/y],
    ['ident', /[a-zA-Z_-][\w-]*/y],
    ['punctuation', /[{}()[\];,:>+~*=]/y],
  ],
};
RULES.javascript = RULES.typescript;

function classifyIdent(lang: CodeLanguage, word: string, next: string): TokenType {
  switch (lang) {
    case 'typescript':
    case 'javascript':
      if (JS_KEYWORDS.has(word)) return 'keyword';
      if (JS_LITERALS.has(word)) return 'number';
      if (next === '(') return 'function';
      if (JS_TYPES.has(word) || /^[A-Z][a-z]/.test(word)) return 'type';
      return 'plain';
    case 'python':
      if (PY_KEYWORDS.has(word)) return 'keyword';
      if (PY_LITERALS.has(word)) return 'number';
      if (PY_BUILTINS.has(word)) return 'type';
      if (next === '(') return 'function';
      if (/^[A-Z][a-z]/.test(word)) return 'type';
      return 'plain';
    case 'json':
      return word === 'true' || word === 'false' || word === 'null' ? 'keyword' : 'plain';
    case 'bash':
      if (SH_KEYWORDS.has(word)) return 'keyword';
      if (SH_BUILTINS.has(word)) return 'function';
      return 'plain';
    case 'css':
      return CSS_KEYWORDS.has(word) ? 'keyword' : 'plain';
    default:
      return 'plain';
  }
}

const NEXT_CHAR = /[ \t]*(\S)?/y;

/** Tokenizes `code` and splits the result into lines. Always returns at least one (possibly empty) line. */
export function tokenize(code: string, language: CodeLanguage | string = 'text'): Token[][] {
  const lang = resolveLanguage(language);
  const flat: Token[] = [];
  const push = (type: TokenType, text: string) => {
    const last = flat[flat.length - 1];
    if (last && last.type === type && type === 'plain') last.text += text;
    else flat.push({ type, text });
  };

  if (lang === 'text') {
    push('plain', code);
  } else {
    const rules = RULES[lang];
    let pos = 0;
    while (pos < code.length) {
      let matched = false;
      for (const [type, re] of rules) {
        re.lastIndex = pos;
        const m = re.exec(code);
        if (!m || m[0].length === 0) continue;
        const text = m[0];
        if (type === 'ident') {
          NEXT_CHAR.lastIndex = pos + text.length;
          const after = NEXT_CHAR.exec(code);
          push(classifyIdent(lang, text, after?.[1] ?? ''), text);
        } else {
          push(type, text);
        }
        pos += text.length;
        matched = true;
        break;
      }
      if (!matched) {
        push('plain', code[pos]);
        pos += 1;
      }
    }
  }

  // Split multi-line tokens (block comments, template strings) at line breaks.
  const lines: Token[][] = [[]];
  for (const token of flat) {
    const parts = token.text.split('\n');
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ type: token.type, text: part });
    });
  }
  return lines;
}
