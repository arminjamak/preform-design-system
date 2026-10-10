import { safeHref } from '../MarkdownEditor/markdown';

const KEEP: Record<string, string> = {
  P: 'p',
  BR: 'br',
  STRONG: 'strong',
  B: 'strong',
  EM: 'em',
  I: 'em',
  U: 'u',
  S: 's',
  DEL: 's',
  H1: 'h2',
  H2: 'h2',
  H3: 'h3',
  H4: 'h4',
  UL: 'ul',
  OL: 'ol',
  LI: 'li',
  A: 'a',
  BLOCKQUOTE: 'blockquote',
  CODE: 'code',
  PRE: 'pre',
  DIV: 'p',
  HR: 'hr',
};
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'NOSCRIPT', 'SVG', 'MATH', 'LINK', 'META', 'TITLE', 'HEAD', 'FORM', 'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA']);

function copyChildren(from: Node, to: Node, doc: Document) {
  from.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      to.appendChild(doc.createTextNode(child.textContent ?? ''));
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as Element;
    if (DROP.has(el.tagName)) return;
    const tag = KEEP[el.tagName];
    if (!tag) {
      copyChildren(el, to, doc); // unwrap unknown elements (span, font, section…)
      return;
    }
    const clean = doc.createElement(tag);
    if (tag === 'a') {
      const href = safeHref(el.getAttribute('href') ?? '');
      if (!href) {
        copyChildren(el, to, doc);
        return;
      }
      clean.setAttribute('href', href);
      if (/^https?:/i.test(href)) {
        clean.setAttribute('target', '_blank');
        clean.setAttribute('rel', 'noopener noreferrer');
      }
    }
    copyChildren(el, clean, doc);
    to.appendChild(clean);
  });
}

/** Whitelist sanitizer for editor HTML: keeps basic formatting tags, drops every attribute except safe link hrefs. */
export function sanitizeHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return '';
  const parsed = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const out = document.createElement('div');
  copyChildren(parsed.body, out, document);
  return out.innerHTML;
}
