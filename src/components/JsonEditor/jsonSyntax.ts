/** Minimal JSON validator and line tokenizer for the editor (no dependencies). */

export type JsonIssue = { line: number; column: number; offset: number; message: string };

class ParseError extends Error {
  constructor(
    message: string,
    public offset: number,
  ) {
    super(message);
  }
}

function describe(ch: string | undefined): string {
  if (ch === undefined) return 'end of input';
  if (ch === '\n') return 'line break';
  return `'${ch}'`;
}

/** Recursive-descent check that reports the first problem with a 1-based line and column. */
export function validateJson(text: string): JsonIssue | null {
  let i = 0;
  const n = text.length;
  const fail = (message: string, at = i): never => {
    throw new ParseError(message, at);
  };
  const ws = () => {
    while (i < n && (text[i] === ' ' || text[i] === '\t' || text[i] === '\n' || text[i] === '\r')) i++;
  };
  const literal = (word: string) => {
    if (text.startsWith(word, i)) i += word.length;
    else fail(`Unexpected ${describe(text[i])}; expected a value`);
  };
  const string = () => {
    const start = i;
    i++; // opening quote
    while (i < n) {
      const ch = text[i];
      if (ch === '"') {
        i++;
        return;
      }
      if (ch === '\n') fail('Unterminated string', start);
      if (ch === '\\') {
        const esc = text[i + 1];
        if (esc === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) fail('Invalid \\u escape in string');
          i += 6;
          continue;
        }
        if (esc === undefined || !'"\\/bfnrt'.includes(esc)) fail(`Invalid escape \\${esc ?? ''} in string`);
        i += 2;
        continue;
      }
      if (ch.charCodeAt(0) < 0x20) fail('Control character in string');
      i++;
    }
    fail('Unterminated string', start);
  };
  const number = () => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m || m[0] === '-' || m[0] === '') fail('Invalid number');
    i += (m as RegExpExecArray)[0].length;
    if (i < n && /[\w.]/.test(text[i])) fail(`Invalid number near ${describe(text[i])}`);
  };
  const value = (): void => {
    ws();
    const ch = text[i];
    if (ch === '{') return object();
    if (ch === '[') return array();
    if (ch === '"') return string();
    if (ch === '-' || (ch !== undefined && ch >= '0' && ch <= '9')) return number();
    if (ch === 't') return literal('true');
    if (ch === 'f') return literal('false');
    if (ch === 'n') return literal('null');
    if (ch === "'") fail('Strings must use double quotes');
    fail(ch === undefined ? 'Unexpected end of input; expected a value' : `Unexpected ${describe(ch)}; expected a value`);
  };
  const object = () => {
    i++;
    ws();
    if (text[i] === '}') {
      i++;
      return;
    }
    for (;;) {
      ws();
      if (text[i] === '}') fail('Trailing comma before }');
      if (text[i] !== '"') fail(text[i] === "'" ? 'Property names must use double quotes' : 'Expected property name in double quotes');
      string();
      ws();
      if (text[i] !== ':') fail(`Expected ':' after property name, found ${describe(text[i])}`);
      i++;
      value();
      const end = i;
      ws();
      if (text[i] === ',') {
        i++;
        continue;
      }
      if (text[i] === '}') {
        i++;
        return;
      }
      fail(`Expected ',' or '}' after property value, found ${describe(text[i])}`, end);
    }
  };
  const array = () => {
    i++;
    ws();
    if (text[i] === ']') {
      i++;
      return;
    }
    for (;;) {
      ws();
      if (text[i] === ']') fail('Trailing comma before ]');
      value();
      const end = i;
      ws();
      if (text[i] === ',') {
        i++;
        continue;
      }
      if (text[i] === ']') {
        i++;
        return;
      }
      fail(`Expected ',' or ']' after array item, found ${describe(text[i])}`, end);
    }
  };

  try {
    value();
    ws();
    if (i < n) fail(`Unexpected ${describe(text[i])} after the JSON value`);
    return null;
  } catch (err) {
    if (!(err instanceof ParseError)) throw err;
    const before = text.slice(0, err.offset);
    const line = before.split('\n').length;
    const column = err.offset - (before.lastIndexOf('\n') + 1) + 1;
    return { line, column, offset: err.offset, message: err.message };
  }
}

export type JsonTokenKind = 'key' | 'string' | 'number' | 'literal' | 'punct' | 'space' | 'other';
export type JsonToken = { kind: JsonTokenKind; text: string };

const TOKEN = /("(?:\\.|[^"\\])*"?)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b|\bnull\b)|([{}[\],:])|(\s+)|([^\s"{}[\],:]+)/g;

/** Tokenises one line for colouring. Strings followed by a colon are keys. */
export function tokenizeLine(line: string): JsonToken[] {
  const out: JsonToken[] = [];
  TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN.exec(line))) {
    const [text, str, num, lit, punct, space] = m;
    let kind: JsonTokenKind = 'other';
    if (str !== undefined) kind = /^\s*:/.test(line.slice(TOKEN.lastIndex)) ? 'key' : 'string';
    else if (num !== undefined) kind = 'number';
    else if (lit !== undefined) kind = 'literal';
    else if (punct !== undefined) kind = 'punct';
    else if (space !== undefined) kind = 'space';
    out.push({ kind, text });
  }
  return out;
}
