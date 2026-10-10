import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { CheckIcon, ChevronRightIcon, ChevronsDownUpIcon, ChevronsUpDownIcon, CopyIcon, RouteIcon, SearchIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { IconButton } from '../IconButton/IconButton';
import { TextField } from '../TextField/TextField';
import s from './JsonViewer.module.css';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type JsonViewerProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> &
  WithForcedState & {
    /** Any JSON-serialisable value: objects and arrays become collapsible tree nodes. */
    data: JsonValue;
    /** Containers shallower than this depth start expanded (0 = everything collapsed, root included). */
    defaultExpandDepth?: number;
    /** Label of the root node; also the first segment of copied paths. */
    rootName?: string;
    /** Shows the search field that highlights matching keys and values and expands their ancestors. */
    searchable?: boolean;
    /** Maximum height of the tree before it scrolls, as a token expression (e.g. `calc(var(--space-24) * 3)`). */
    maxHeight?: string;
  };

type JsonContainer = JsonValue[] | { [key: string]: JsonValue };
type NodeInfo = { path: string; parent: string | null; key: string | number | null; value: JsonValue; depth: number; size: number };

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

function isContainer(v: JsonValue): v is JsonContainer {
  return v !== null && typeof v === 'object';
}

function entriesOf(v: JsonContainer): Array<[string | number, JsonValue]> {
  return Array.isArray(v) ? v.map((c, i) => [i, c] as [number, JsonValue]) : Object.entries(v);
}

function childPath(parent: string, key: string | number): string {
  if (typeof key === 'number') return `${parent}[${key}]`;
  return IDENTIFIER.test(key) ? `${parent}.${key}` : `${parent}[${JSON.stringify(key)}]`;
}

function buildIndex(data: JsonValue, rootPath: string): Map<string, NodeInfo> {
  const index = new Map<string, NodeInfo>();
  const stack: NodeInfo[] = [{ path: rootPath, parent: null, key: null, value: data, depth: 0, size: 0 }];
  while (stack.length) {
    const node = stack.pop() as NodeInfo;
    if (isContainer(node.value)) {
      const entries = entriesOf(node.value);
      node.size = entries.length;
      for (const [k, v] of entries) stack.push({ path: childPath(node.path, k), parent: node.path, key: k, value: v, depth: node.depth + 1, size: 0 });
    }
    index.set(node.path, node);
  }
  return index;
}

function initialExpanded(index: Map<string, NodeInfo>, depth: number): Set<string> {
  const set = new Set<string>();
  index.forEach((n) => {
    if (n.size > 0 && n.depth < depth) set.add(n.path);
  });
  return set;
}

function countLabel(value: JsonContainer, size: number): string {
  if (Array.isArray(value)) return `${size} ${size === 1 ? 'item' : 'items'}`;
  return `${size} ${size === 1 ? 'key' : 'keys'}`;
}

function primitiveText(v: JsonPrimitive): string {
  return typeof v === 'string' ? JSON.stringify(v) : String(v);
}

function highlight(text: string, query: string, markClass: string): ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const out: ReactNode[] = [];
  let i = 0;
  let j = lower.indexOf(q, i);
  while (j !== -1) {
    if (j > i) out.push(text.slice(i, j));
    out.push(
      <mark key={j} className={markClass}>
        {text.slice(j, j + q.length)}
      </mark>,
    );
    i = j + q.length;
    j = lower.indexOf(q, i);
  }
  if (i < text.length) out.push(text.slice(i));
  return out;
}

/** Reads a duration token (e.g. `--motion-duration-slow`) in milliseconds so timers follow the motion scale. */
function durationToken(name: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return 0;
  return raw.endsWith('ms') ? n : n * 1000;
}

/** Left/Right arrow navigation between toolbar buttons (text inputs keep their arrows). */
function onToolbarKeyDown(e: KeyboardEvent<HTMLDivElement>) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  if (!(e.target instanceof HTMLButtonElement)) return;
  const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
  const i = buttons.indexOf(e.target);
  const next = buttons[(i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
  next?.focus();
  e.preventDefault();
}

type Ctx = {
  index: Map<string, NodeInfo>;
  expanded: Set<string>;
  tabbable: string;
  query: string;
  matches: Set<string>;
  copied: string | null;
  forcedState?: string;
  rootPath: string;
  toggle: (path: string) => void;
  copy: (kind: 'path' | 'value', node: NodeInfo) => void;
};

function TreeNode({ node, ctx, posinset, setsize }: { node: NodeInfo; ctx: Ctx; posinset: number; setsize: number }) {
  const { value, key, depth, path, size } = node;
  const container = isContainer(value);
  const expandable = container && size > 0;
  const open = expandable && ctx.expanded.has(path);
  const isArray = Array.isArray(value);
  const keyText = key === null ? null : String(key);

  const summary = container ? (size === 0 ? (isArray ? '[]' : '{}') : countLabel(value, size)) : primitiveText(value as JsonPrimitive);
  const label = `${keyText ?? path}: ${container ? `${isArray ? 'array' : 'object'}, ${summary}` : summary}`;
  const stop = (e: MouseEvent) => e.stopPropagation();

  let valueNode: ReactNode;
  if (container) {
    if (size === 0) valueNode = <span className={s.punct}>{isArray ? '[ ]' : '{ }'}</span>;
    else if (open) valueNode = <span className={s.punct}>{isArray ? '[' : '{'}</span>;
    else
      valueNode = (
        <span className={s.summary}>
          <span className={s.punct}>{isArray ? '[' : '{'}</span> {countLabel(value, size)} <span className={s.punct}>{isArray ? ']' : '}'}</span>
        </span>
      );
  } else {
    const cls = typeof value === 'string' ? s.string : typeof value === 'number' ? s.number : s.literal;
    valueNode = <span className={cx(s.value, cls)}>{highlight(primitiveText(value as JsonPrimitive), ctx.query, s.mark)}</span>;
  }

  const children = open ? entriesOf(value as JsonContainer) : [];
  const depthStyle = { '--jv-depth': depth } as CSSProperties;

  return (
    <li
      role="treeitem"
      aria-level={depth + 1}
      aria-posinset={posinset}
      aria-setsize={setsize}
      aria-expanded={expandable ? open : undefined}
      aria-label={label}
      aria-keyshortcuts="C P"
      tabIndex={ctx.tabbable === path ? 0 : -1}
      data-path={path}
      data-state={path === ctx.rootPath ? ctx.forcedState : undefined}
      className={s.item}
    >
      <div className={cx(s.row, ctx.matches.has(path) && s.matched)} style={depthStyle} onClick={() => expandable && ctx.toggle(path)}>
        <span className={cx(s.twisty, open && s.twistyOpen)} aria-hidden="true">
          {expandable && <ChevronRightIcon strokeWidth={2.2} />}
        </span>
        {keyText !== null && (
          <>
            <span className={typeof key === 'number' ? s.index : s.key}>{highlight(keyText, ctx.query, s.mark)}</span>
            <span className={s.punct}>:&nbsp;</span>
          </>
        )}
        {keyText === null && <span className={cx(s.key, s.rootKey)}>{path}&nbsp;</span>}
        {valueNode}
        <span className={s.actions} onClick={stop}>
          <IconButton
            size="xs"
            tabIndex={-1}
            label={`Copy path ${path}`}
            icon={ctx.copied === `path:${path}` ? <CheckIcon strokeWidth={2.4} /> : <RouteIcon strokeWidth={2.2} />}
            onClick={() => ctx.copy('path', node)}
          />
          <IconButton
            size="xs"
            tabIndex={-1}
            label={`Copy value of ${path}`}
            icon={ctx.copied === `value:${path}` ? <CheckIcon strokeWidth={2.4} /> : <CopyIcon strokeWidth={2.2} />}
            onClick={() => ctx.copy('value', node)}
          />
        </span>
      </div>
      {open && (
        <>
          <ul role="group" className={s.group}>
            {children.map(([k], i) => {
              const child = ctx.index.get(childPath(path, k));
              return child ? <TreeNode key={child.path} node={child} ctx={ctx} posinset={i + 1} setsize={children.length} /> : null;
            })}
          </ul>
          <div className={cx(s.row, s.closing)} style={depthStyle} aria-hidden="true">
            <span className={s.twisty} />
            <span className={s.punct}>{isArray ? ']' : '}'}</span>
          </div>
        </>
      )}
    </li>
  );
}

/**
 * Collapsible JSON tree (print settings, printer API responses). Arrow keys move through rows,
 * Right/Left expand and collapse, Enter toggles, C copies the focused value and P its path.
 */
export function JsonViewer({
  data,
  defaultExpandDepth = 2,
  rootName = 'root',
  searchable = true,
  maxHeight,
  className,
  style,
  'data-state': forcedState,
  ...rest
}: JsonViewerProps) {
  // Keyed on content so a parent re-creating an equal object does not reset expansion.
  const signature = useMemo(() => JSON.stringify(data), [data]);
  const index = useMemo(() => buildIndex(JSON.parse(signature ?? 'null') as JsonValue, rootName), [signature, rootName]);
  const [expanded, setExpanded] = useState<Set<string>>(() => initialExpanded(index, defaultExpandDepth));
  const [focused, setFocused] = useState(rootName);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const treeRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setExpanded(initialExpanded(index, defaultExpandDepth));
  }, [index, defaultExpandDepth]);

  const q = query.trim();
  const matches = useMemo(() => {
    const set = new Set<string>();
    if (!q) return set;
    const needle = q.toLowerCase();
    index.forEach((n) => {
      const keyHit = n.key !== null && String(n.key).toLowerCase().includes(needle);
      const valueHit = !isContainer(n.value) && primitiveText(n.value).toLowerCase().includes(needle);
      if (keyHit || valueHit) set.add(n.path);
    });
    return set;
  }, [index, q]);

  // Reveal every match by expanding its ancestors.
  useEffect(() => {
    if (!matches.size) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      matches.forEach((path) => {
        let p = index.get(path)?.parent ?? null;
        while (p) {
          next.add(p);
          p = index.get(p)?.parent ?? null;
        }
      });
      return next;
    });
  }, [matches, index]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(null), durationToken('--motion-duration-slow') * 5);
    return () => window.clearTimeout(t);
  }, [copied]);

  const isVisible = (path: string) => {
    let p = index.get(path)?.parent ?? null;
    if (!index.has(path)) return false;
    while (p) {
      if (!expanded.has(p)) return false;
      p = index.get(p)?.parent ?? null;
    }
    return true;
  };
  const tabbable = isVisible(focused) ? focused : rootName;

  const toggle = (path: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const copy = async (kind: 'path' | 'value', node: NodeInfo) => {
    const text = kind === 'path' ? node.path : JSON.stringify(node.value, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`${kind}:${node.path}`);
      setAnnouncement(kind === 'path' ? `Copied path ${node.path}` : `Copied value of ${node.path}`);
    } catch {
      setAnnouncement('Clipboard is not available');
    }
  };

  const expandAll = () => {
    const all = new Set<string>();
    index.forEach((n) => n.size > 0 && all.add(n.path));
    setExpanded(all);
  };
  const collapseAll = () => setExpanded(new Set(index.get(rootName)?.size ? [rootName] : []));

  const onTreeFocus = (e: FocusEvent<HTMLUListElement>) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('[role="treeitem"]');
    if (item?.dataset.path) setFocused(item.dataset.path);
  };

  const onTreeKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const target = e.target as HTMLElement;
    if (target.getAttribute('role') !== 'treeitem' || !treeRef.current) return;
    const path = target.dataset.path ?? '';
    const node = index.get(path);
    if (!node) return;
    const items = Array.from(treeRef.current.querySelectorAll<HTMLElement>('[role="treeitem"]'));
    const i = items.indexOf(target);
    const focusAt = (j: number) => items[Math.max(0, Math.min(items.length - 1, j))]?.focus();
    const expandable = node.size > 0;
    const open = expandable && expanded.has(path);
    let handled = true;
    switch (e.key) {
      case 'ArrowDown':
        focusAt(i + 1);
        break;
      case 'ArrowUp':
        focusAt(i - 1);
        break;
      case 'Home':
        focusAt(0);
        break;
      case 'End':
        focusAt(items.length - 1);
        break;
      case 'ArrowRight':
        if (expandable && !open) toggle(path);
        else if (open) focusAt(i + 1);
        break;
      case 'ArrowLeft':
        if (open) toggle(path);
        else if (node.parent) items.find((el) => el.dataset.path === node.parent)?.focus();
        break;
      case 'Enter':
      case ' ':
        if (expandable) toggle(path);
        break;
      case 'c':
      case 'C':
        if (e.metaKey || e.ctrlKey || e.altKey) handled = false;
        else void copy('value', node);
        break;
      case 'p':
      case 'P':
        if (e.metaKey || e.ctrlKey || e.altKey) handled = false;
        else void copy('path', node);
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  };

  const root = index.get(rootName);
  const ctx: Ctx = { index, expanded, tabbable, query: q, matches, copied, forcedState, rootPath: rootName, toggle, copy };
  const rootStyle = { ...style, ...(maxHeight ? { '--jv-max-h': maxHeight } : null) } as CSSProperties;

  return (
    <div className={cx(s.viewer, className)} style={rootStyle} {...rest}>
      <div role="toolbar" aria-label="JSON viewer actions" className={s.toolbar} onKeyDown={onToolbarKeyDown}>
        <IconButton label="Expand all" icon={<ChevronsUpDownIcon strokeWidth={2.2} />} onClick={expandAll} />
        <IconButton label="Collapse all" icon={<ChevronsDownUpIcon strokeWidth={2.2} />} onClick={collapseAll} />
        <IconButton
          label="Copy JSON"
          icon={copied === `value:${rootName}` ? <CheckIcon strokeWidth={2.4} /> : <CopyIcon strokeWidth={2.2} />}
          onClick={() => root && void copy('value', root)}
        />
        {searchable && (
          <>
            <TextField
              label="Search keys and values"
              placeholder="Search keys and values"
              value={query}
              onChange={setQuery}
              iconStart={<SearchIcon strokeWidth={2.2} />}
              className={s.search}
              type="search"
            />
            <span className={s.count} aria-live="polite">
              {q ? (matches.size ? `${matches.size} ${matches.size === 1 ? 'match' : 'matches'}` : 'No matches') : ''}
            </span>
          </>
        )}
      </div>
      <ul ref={treeRef} role="tree" aria-label={`${rootName} JSON`} className={s.tree} onKeyDown={onTreeKeyDown} onFocus={onTreeFocus}>
        {root && <TreeNode node={root} ctx={ctx} posinset={1} setsize={1} />}
      </ul>
      <span className={s.srOnly} role="status">
        {announcement}
      </span>
    </div>
  );
}
