import type { ReactNode } from 'react';
import { CodeBlock } from '../CodeBlock/CodeBlock';
import { Prose, type ProseProps } from '../Prose/Prose';

/**
 * A small, safe Markdown renderer. It builds React elements (never HTML strings), so any HTML
 * in the source is shown as literal text. Supports headings, paragraphs, emphasis, strong,
 * strikethrough, inline code, fenced code (rendered with CodeBlock), ordered/unordered lists
 * with nesting, blockquotes, links, horizontal rules and pipe tables.
 */

type Align = 'left' | 'center' | 'right' | undefined;
type Block =
  | { t: 'heading'; level: number; text: string }
  | { t: 'paragraph'; text: string }
  | { t: 'code'; lang: string; filename?: string; code: string }
  | { t: 'quote'; children: Block[] }
  | { t: 'list'; ordered: boolean; start: number; tight: boolean; items: Block[][] }
  | { t: 'hr' }
  | { t: 'table'; align: Align[]; head: string[]; rows: string[][] };

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([\w+#-]*)\s*(\S*)?.*$/;
const HEADING = /^ {0,3}(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/;
const HR = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const QUOTE = /^ {0,3}>\s?/;
const LIST_ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;

const indentOf = (line: string) => (line.match(/^\s*/)?.[0] ?? '').replace(/\t/g, '    ').length;
const isBlank = (line: string) => line.trim() === '';

function splitRow(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  const body = line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '');
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '\\' && body[i + 1] === '|') {
      cur += '|';
      i++;
    } else if (ch === '|') {
      cells.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function startsBlock(line: string, next: string | undefined): boolean {
  return FENCE.test(line) || HEADING.test(line) || HR.test(line) || QUOTE.test(line) || LIST_ITEM.test(line) || (line.includes('|') && next !== undefined && TABLE_SEP.test(next));
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) {
      i++;
      continue;
    }

    const fence = line.match(FENCE);
    if (fence) {
      const marker = fence[1];
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(marker)) body.push(lines[i++]);
      i++; // closing fence (or end of input)
      blocks.push({ t: 'code', lang: fence[2] || 'text', filename: fence[3] || undefined, code: body.join('\n') });
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      blocks.push({ t: 'heading', level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }

    if (HR.test(line)) {
      blocks.push({ t: 'hr' });
      i++;
      continue;
    }

    if (QUOTE.test(line)) {
      const inner: string[] = [];
      while (i < lines.length && !isBlank(lines[i]) && (QUOTE.test(lines[i]) || !startsBlock(lines[i], lines[i + 1]))) {
        inner.push(lines[i].replace(QUOTE, ''));
        i++;
      }
      blocks.push({ t: 'quote', children: parseBlocks(inner) });
      continue;
    }

    const item = line.match(LIST_ITEM);
    if (item) {
      const base = indentOf(line);
      const ordered = /\d/.test(item[2]);
      const items: string[][] = [];
      let tight = true;
      let sawBlank = false;
      while (i < lines.length) {
        const cur = lines[i];
        const m = cur.match(LIST_ITEM);
        const ind = indentOf(cur);
        if (m && ind <= base + 1 && /\d/.test(m[2]) === ordered) {
          if (sawBlank && items.length) tight = false;
          items.push([m[3]]);
          sawBlank = false;
          i++;
        } else if (isBlank(cur)) {
          const nextLine = lines.slice(i + 1).find((l) => !isBlank(l));
          if (nextLine === undefined) break;
          const nm = nextLine.match(LIST_ITEM);
          const continues = indentOf(nextLine) > base + 1 || (nm && indentOf(nextLine) <= base + 1 && /\d/.test(nm[2]) === ordered);
          if (!continues) break;
          sawBlank = true;
          items[items.length - 1].push('');
          i++;
        } else if (ind > base + 1) {
          if (sawBlank) tight = false;
          items[items.length - 1].push(cur.slice(Math.min(ind, base + 2)));
          i++;
        } else if (!sawBlank && !startsBlock(cur, lines[i + 1])) {
          items[items.length - 1].push(cur.trim()); // lazy continuation
          i++;
        } else break;
      }
      blocks.push({
        t: 'list',
        ordered,
        start: ordered ? parseInt(item[2], 10) : 1,
        tight,
        items: items.map((body) => parseBlocks(body)),
      });
      continue;
    }

    if (line.includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      const head = splitRow(line);
      const align: Align[] = splitRow(lines[i + 1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : c.startsWith(':') ? 'left' : undefined));
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && !isBlank(lines[i]) && lines[i].includes('|')) rows.push(splitRow(lines[i++]));
      blocks.push({ t: 'table', align, head, rows });
      continue;
    }

    const para: string[] = [line.trim()];
    i++;
    while (i < lines.length && !isBlank(lines[i]) && !startsBlock(lines[i], lines[i + 1])) para.push(lines[i++].trim());
    blocks.push({ t: 'paragraph', text: para.join('\n') });
  }
  return blocks;
}

/** Returns a safe href, or undefined for script-capable schemes (javascript:, data:, vbscript:…). */
export function safeHref(raw: string): string | undefined {
  const compact = raw.replace(/[\u0000- \u007f]+/g, '');
  if (!compact) return undefined;
  if (/^(?:https?:|mailto:|tel:)/i.test(compact)) return raw.trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(compact)) return undefined;
  return raw.trim(); // relative path or #anchor
}

const INLINE =
  /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)|\*\*(?=\S)([\s\S]*?\S)\*\*|__(?=\S)([\s\S]*?\S)__(?!\w)|\*(?=[^\s*])([\s\S]*?[^\s*])\*(?!\*)|(?<![\w\\])_(?=\S)([\s\S]*?\S)_(?!\w)|~~(?=\S)([\s\S]*?\S)~~|(!?)\[([^\]\n]*)\]\(\s*<?([^)\s>]*)>?(?:\s+"([^"]*)")?\s*\)|<((?:https?:\/\/|mailto:)[^>\s]+)>|\\([\\`*_{}[\]()#+\-.!~|>])|( {2,}|\\)\n/g;

function renderInline(text: string, key = 'i'): ReactNode[] {
  const out: ReactNode[] = [];
  const re = new RegExp(INLINE.source, 'g');
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}.${n++}`;
    if (m[1]) out.push(<code key={k}>{m[2].replace(/^ (.+) $/, '$1')}</code>);
    else if (m[3] ?? m[4]) out.push(<strong key={k}>{renderInline((m[3] ?? m[4]) as string, k)}</strong>);
    else if (m[5] ?? m[6]) out.push(<em key={k}>{renderInline((m[5] ?? m[6]) as string, k)}</em>);
    else if (m[7]) out.push(<del key={k}>{renderInline(m[7], k)}</del>);
    else if (m[9] !== undefined) {
      const href = safeHref(m[10] ?? '');
      const label = m[9];
      if (m[8] === '!') {
        out.push(href ? <img key={k} src={href} alt={label} title={m[11]} loading="lazy" /> : label);
      } else if (href) {
        const external = /^https?:/i.test(href);
        out.push(
          <a key={k} href={href} title={m[11]} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null)}>
            {renderInline(label, k)}
          </a>,
        );
      } else out.push(...renderInline(label, k));
    } else if (m[12]) {
      const href = safeHref(m[12]);
      out.push(
        href ? (
          <a key={k} href={href} target="_blank" rel="noopener noreferrer">
            {m[12]}
          </a>
        ) : (
          m[12]
        ),
      );
    } else if (m[13]) out.push(m[13]);
    else if (m[14]) out.push(<br key={k} />);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderBlocks(blocks: Block[], key = 'b', tight = false): ReactNode[] {
  return blocks.map((b, i) => {
    const k = `${key}.${i}`;
    switch (b.t) {
      case 'heading': {
        const Tag = (['h1', 'h2', 'h3', 'h4'] as const)[Math.min(b.level, 4) - 1];
        return <Tag key={k}>{renderInline(b.text, k)}</Tag>;
      }
      case 'paragraph':
        return tight ? <span key={k}>{renderInline(b.text, k)}</span> : <p key={k}>{renderInline(b.text, k)}</p>;
      case 'code':
        return <CodeBlock key={k} code={b.code} language={b.lang} filename={b.filename} showLineNumbers={false} />;
      case 'quote':
        return <blockquote key={k}>{renderBlocks(b.children, k)}</blockquote>;
      case 'hr':
        return <hr key={k} />;
      case 'list': {
        const items = b.items.map((item, j) => <li key={j}>{renderBlocks(item, `${k}.${j}`, b.tight)}</li>);
        return b.ordered ? (
          <ol key={k} start={b.start !== 1 ? b.start : undefined}>
            {items}
          </ol>
        ) : (
          <ul key={k}>{items}</ul>
        );
      }
      case 'table':
        return (
          <table key={k}>
            <thead>
              <tr>
                {b.head.map((c, j) => (
                  <th key={j} scope="col" style={b.align[j] ? { textAlign: b.align[j] } : undefined}>
                    {renderInline(c, `${k}.h${j}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r}>
                  {b.head.map((_, j) => (
                    <td key={j} style={b.align[j] ? { textAlign: b.align[j] } : undefined}>
                      {renderInline(row[j] ?? '', `${k}.${r}.${j}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
    }
  });
}

/** Renders Markdown source to React elements. HTML in the source is escaped, unsafe link schemes are dropped. */
export function renderMarkdown(source: string): ReactNode[] {
  return renderBlocks(parseBlocks(source.replace(/\r\n?/g, '\n').split('\n')));
}

export type MarkdownPreviewProps = Omit<ProseProps, 'children'> & {
  source: string;
  /** Shown when the source is empty. */
  emptyText?: string;
};

/** Markdown rendered inside Prose. */
export function MarkdownPreview({ source, emptyText = 'Nothing to preview yet.', ...rest }: MarkdownPreviewProps) {
  const nodes = renderMarkdown(source);
  return <Prose {...rest}>{nodes.length ? nodes : <p data-empty="">{emptyText}</p>}</Prose>;
}
