import { Fragment, useEffect, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react';
import { ChevronsUpDownIcon, Columns2Icon, FileDiffIcon, Rows2Icon, UnfoldVerticalIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import { Segmented } from '../Segmented/Segmented';
import { diffSequences, diffWords, type Segment } from './diff';
import s from './DiffViewer.module.css';

export type DiffView = 'unified' | 'split';

export type DiffViewerProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  oldText: string;
  newText: string;
  /** Name of the original file/profile. */
  oldLabel?: string;
  /** Name of the changed file/profile. */
  newLabel?: string;
  /** Unified (one column) or split (side by side). Switchable from the header. */
  view?: DiffView;
  onViewChange?: (view: DiffView) => void;
  /** Unchanged lines kept around each change; longer unchanged runs fold into "Show N unchanged lines". */
  context?: number;
  /** Mark the changed words inside modified lines. */
  wordDiff?: boolean;
};

type Line = { type: 'equal' | 'del' | 'add'; oldNo?: number; newNo?: number; text: string; segs?: Segment[] };
type Block = { kind: 'equal'; lines: Line[] } | { kind: 'change'; dels: Line[]; adds: Line[] };
type Item = { kind: 'line'; line: Line } | { kind: 'pair'; left?: Line; right?: Line } | { kind: 'fold'; block: number; count: number };

function splitLines(text: string): string[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function buildBlocks(oldText: string, newText: string, wordDiff: boolean): Block[] {
  const a = splitLines(oldText);
  const b = splitLines(newText);
  const ops = diffSequences(a, b);
  const blocks: Block[] = [];
  for (const op of ops) {
    const last = blocks[blocks.length - 1];
    if (op.type === 'equal') {
      const line: Line = { type: 'equal', oldNo: op.a + 1, newNo: op.b + 1, text: a[op.a] };
      if (last?.kind === 'equal') last.lines.push(line);
      else blocks.push({ kind: 'equal', lines: [line] });
    } else {
      const block = last?.kind === 'change' ? last : (blocks[blocks.push({ kind: 'change', dels: [], adds: [] }) - 1] as Extract<Block, { kind: 'change' }>);
      if (op.type === 'del') block.dels.push({ type: 'del', oldNo: op.a + 1, text: a[op.a] });
      else block.adds.push({ type: 'add', newNo: op.b + 1, text: b[op.b] });
    }
  }
  if (wordDiff) {
    for (const block of blocks) {
      if (block.kind !== 'change') continue;
      const pairs = Math.min(block.dels.length, block.adds.length);
      for (let i = 0; i < pairs; i++) {
        const words = diffWords(block.dels[i].text, block.adds[i].text);
        if (!words) continue;
        block.dels[i].segs = words.old;
        block.adds[i].segs = words.new;
      }
    }
  }
  return blocks;
}

function buildItems(blocks: Block[], context: number, open: Set<number>, view: DiffView): Item[] {
  const items: Item[] = [];
  blocks.forEach((block, bi) => {
    if (block.kind === 'change') {
      if (view === 'unified') {
        block.dels.forEach((line) => items.push({ kind: 'line', line }));
        block.adds.forEach((line) => items.push({ kind: 'line', line }));
      } else {
        const n = Math.max(block.dels.length, block.adds.length);
        for (let i = 0; i < n; i++) items.push({ kind: 'pair', left: block.dels[i], right: block.adds[i] });
      }
      return;
    }
    const lines = block.lines;
    const head = bi === 0 ? 0 : context;
    const tail = bi === blocks.length - 1 ? 0 : context;
    const hidden = lines.length - head - tail;
    const push = (line: Line) => items.push(view === 'unified' ? { kind: 'line', line } : { kind: 'pair', left: line, right: line });
    if (open.has(bi) || hidden < 2) {
      lines.forEach(push);
      return;
    }
    lines.slice(0, head).forEach(push);
    items.push({ kind: 'fold', block: bi, count: hidden });
    lines.slice(lines.length - tail).forEach(push);
  });
  return items;
}

function LineText({ line }: { line: Line }) {
  if (!line.segs) return <>{line.text || ' '}</>;
  return (
    <>
      {line.segs.map((seg, i) =>
        seg.changed ? (
          <span key={i} className={s.word}>
            {seg.text}
          </span>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        ),
      )}
    </>
  );
}

const SIGN: Record<Line['type'], string> = { equal: ' ', del: '−', add: '+' };
const SIGN_LABEL: Record<Line['type'], string> = { equal: '', del: 'Removed: ', add: 'Added: ' };

/**
 * Line diff between two texts (support profiles, print settings, firmware configs) with unified
 * and split layouts, word-level marks and folded unchanged runs.
 */
export function DiffViewer({
  oldText,
  newText,
  oldLabel = 'Original',
  newLabel = 'Modified',
  view: viewProp = 'unified',
  onViewChange,
  context = 3,
  wordDiff = true,
  className,
  ...rest
}: DiffViewerProps) {
  const [view, setViewState] = useState<DiffView>(viewProp);
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  useEffect(() => setViewState(viewProp), [viewProp]);

  const blocks = useMemo(() => buildBlocks(oldText, newText, wordDiff), [oldText, newText, wordDiff]);
  useEffect(() => setOpen(new Set()), [blocks, context]);
  const items = useMemo(() => buildItems(blocks, Math.max(0, context), open, view), [blocks, context, open, view]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const b of blocks)
      if (b.kind === 'change') {
        added += b.adds.length;
        removed += b.dels.length;
      }
    return { added, removed };
  }, [blocks]);
  const identical = stats.added === 0 && stats.removed === 0;
  const hasFolds = items.some((i) => i.kind === 'fold');

  const setView = (v: DiffView) => {
    setViewState(v);
    onViewChange?.(v);
  };
  const expand = (bi: number) => setOpen((prev) => new Set(prev).add(bi));
  const expandAll = () => setOpen(new Set(blocks.map((_, i) => i)));

  const cols = view === 'unified' ? 4 : 6;
  const fold = (item: Extract<Item, { kind: 'fold' }>) => (
    <tr key={`fold-${item.block}`} className={s.foldRow}>
      <td colSpan={cols}>
        <button type="button" className={s.fold} onClick={() => expand(item.block)}>
          <ChevronsUpDownIcon strokeWidth={2.2} aria-hidden="true" />
          Show {item.count} unchanged {item.count === 1 ? 'line' : 'lines'}
        </button>
      </td>
    </tr>
  );

  const side = (line: Line | undefined, which: 'old' | 'new'): ReactNode => {
    if (!line)
      return (
        <>
          <td className={cx(s.num, s.empty)} />
          <td className={cx(s.sign, s.empty)} />
          <td className={cx(s.code, s.empty)} />
        </>
      );
    const tone = line.type === 'equal' ? undefined : s[line.type];
    return (
      <>
        <td className={cx(s.num, tone)}>{which === 'old' ? line.oldNo : line.newNo}</td>
        <td className={cx(s.sign, tone)}>
          <span aria-hidden="true">{SIGN[line.type]}</span>
        </td>
        <td className={cx(s.code, tone)}>
          {SIGN_LABEL[line.type] && <span className={s.srOnly}>{SIGN_LABEL[line.type]}</span>}
          <LineText line={line} />
        </td>
      </>
    );
  };

  return (
    <div className={cx(s.viewer, className)} {...rest}>
      <div className={s.header}>
        <FileDiffIcon className={s.fileIcon} strokeWidth={2.2} aria-hidden="true" />
        <span className={s.files}>
          <span className={s.oldLabel}>{oldLabel}</span>
          <span className={s.arrow} aria-hidden="true">
            →
          </span>
          <span className={s.srOnly}> to </span>
          <span className={s.newLabel}>{newLabel}</span>
        </span>
        <span className={s.stats}>
          <span className={s.statAdd}>+{stats.added}</span>
          <span className={s.statDel}>−{stats.removed}</span>
          <span className={s.srOnly}>
            {stats.added} added, {stats.removed} removed lines
          </span>
        </span>
        {hasFolds && <IconButton label="Expand all unchanged lines" icon={<UnfoldVerticalIcon strokeWidth={2.2} />} onClick={expandAll} />}
        <Segmented<DiffView>
          label="Diff layout"
          size="md"
          value={view}
          onChange={setView}
          options={[
            { value: 'unified', label: <><Rows2Icon strokeWidth={2.2} aria-hidden="true" />Unified</> },
            { value: 'split', label: <><Columns2Icon strokeWidth={2.2} aria-hidden="true" />Split</> },
          ]}
        />
      </div>
      {identical && <div className={s.identical}>No differences between {oldLabel} and {newLabel}</div>}
      <div className={s.scroll}>
        <table className={cx(s.table, s[view])} aria-label={`Changes from ${oldLabel} to ${newLabel}`}>
          {view === 'unified' ? (
            <colgroup>
              <col className={s.colNum} />
              <col className={s.colNum} />
              <col className={s.colSign} />
              <col />
            </colgroup>
          ) : (
            <colgroup>
              <col className={s.colNum} />
              <col className={s.colSign} />
              <col />
              <col className={s.colNum} />
              <col className={s.colSign} />
              <col />
            </colgroup>
          )}
          <thead>
            {view === 'unified' ? (
              <tr>
                <th scope="col" className={s.srOnly}>{oldLabel} line</th>
                <th scope="col" className={s.srOnly}>{newLabel} line</th>
                <th scope="col" className={s.srOnly}>Change</th>
                <th scope="col" className={s.srOnly}>Content</th>
              </tr>
            ) : (
              <tr className={s.splitHead}>
                <th scope="col" colSpan={3}>
                  {oldLabel}
                </th>
                <th scope="col" colSpan={3}>
                  {newLabel}
                </th>
              </tr>
            )}
          </thead>
          <tbody>
            {items.map((item, i) => {
              if (item.kind === 'fold') return fold(item);
              if (item.kind === 'line') {
                const { line } = item;
                const tone = line.type === 'equal' ? undefined : s[line.type];
                return (
                  <tr key={i}>
                    <td className={cx(s.num, tone)}>{line.oldNo}</td>
                    <td className={cx(s.num, tone)}>{line.newNo}</td>
                    <td className={cx(s.sign, tone)}>
                      <span aria-hidden="true">{SIGN[line.type]}</span>
                    </td>
                    <td className={cx(s.code, tone)}>
                      {SIGN_LABEL[line.type] && <span className={s.srOnly}>{SIGN_LABEL[line.type]}</span>}
                      <LineText line={line} />
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={i}>
                  {side(item.left, 'old')}
                  {side(item.right, 'new')}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
