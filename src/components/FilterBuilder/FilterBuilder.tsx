import { useEffect, useRef, type ReactNode } from 'react';
import { FilterIcon, ListPlusIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Segmented } from '../Segmented/Segmented';
import { Select } from '../Select/Select';
import { TextField } from '../TextField/TextField';
import s from './FilterBuilder.module.css';

/* ------------------------------------------------------------------------ Types */

export type FilterBuilderFieldType = 'text' | 'number' | 'enum' | 'date';

export type FilterBuilderField = {
  id: string;
  label: string;
  type: FilterBuilderFieldType;
  /** Choices for `enum` fields. */
  options?: Array<string | { value: string; label: string }>;
  /** Unit suffix for `number` fields ("mm"). */
  unit?: string;
  placeholder?: string;
};

export type FilterBuilderOperator =
  | 'contains'
  | 'notContains'
  | 'is'
  | 'isNot'
  | 'startsWith'
  | 'isEmpty'
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'on'
  | 'before'
  | 'after';

export type FilterBuilderCondition = {
  type: 'condition';
  id: string;
  /** Field id. */
  field: string;
  operator: FilterBuilderOperator;
  /** Always a string: numbers as typed, dates as YYYY-MM-DD, enums as the option value. */
  value: string;
};

export type FilterBuilderGroup = {
  type: 'group';
  id: string;
  combinator: 'and' | 'or';
  /** The root group may hold conditions and one level of nested groups; nested groups hold conditions only. */
  children: Array<FilterBuilderCondition | FilterBuilderGroup>;
};

type Node = FilterBuilderCondition | FilterBuilderGroup;
type OperatorDef = { value: FilterBuilderOperator; label: string; summary: string; noValue?: boolean };

const OPERATORS: Record<FilterBuilderFieldType, OperatorDef[]> = {
  text: [
    { value: 'contains', label: 'contains', summary: 'contains' },
    { value: 'notContains', label: 'does not contain', summary: 'does not contain' },
    { value: 'is', label: 'is', summary: 'is' },
    { value: 'isNot', label: 'is not', summary: 'is not' },
    { value: 'startsWith', label: 'starts with', summary: 'starts with' },
    { value: 'isEmpty', label: 'is empty', summary: 'is empty', noValue: true },
  ],
  number: [
    { value: 'eq', label: '= equals', summary: '=' },
    { value: 'neq', label: '≠ not equal', summary: '≠' },
    { value: 'gt', label: '> greater than', summary: '>' },
    { value: 'gte', label: '≥ at least', summary: '≥' },
    { value: 'lt', label: '< less than', summary: '<' },
    { value: 'lte', label: '≤ at most', summary: '≤' },
  ],
  enum: [
    { value: 'is', label: 'is', summary: 'is' },
    { value: 'isNot', label: 'is not', summary: 'is not' },
  ],
  date: [
    { value: 'on', label: 'is on', summary: 'on' },
    { value: 'before', label: 'is before', summary: 'before' },
    { value: 'after', label: 'is after', summary: 'after' },
  ],
};

/** Operators offered for a field type (exported for custom editors and server-side mapping). */
export const filterBuilderOperators = (type: FilterBuilderFieldType): ReadonlyArray<OperatorDef> => OPERATORS[type];

/* ---------------------------------------------------------------------- Helpers */

let seq = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const optionList = (f: FilterBuilderField) => (f.options ?? []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
const defaultValue = (f: FilterBuilderField) => (f.type === 'enum' ? optionList(f)[0]?.value ?? '' : '');
const opDef = (f: FilterBuilderField | undefined, op: FilterBuilderOperator) => (f ? OPERATORS[f.type].find((o) => o.value === op) : undefined);

/** New condition for a field, with the field's first operator and default value. */
export function createFilterBuilderCondition(field: FilterBuilderField): FilterBuilderCondition {
  return { type: 'condition', id: uid('cond'), field: field.id, operator: OPERATORS[field.type][0].value, value: defaultValue(field) };
}

/** New (empty by default) group. */
export function createFilterBuilderGroup(combinator: 'and' | 'or' = 'and', children: FilterBuilderGroup['children'] = []): FilterBuilderGroup {
  return { type: 'group', id: uid('group'), combinator, children };
}

const isComplete = (c: FilterBuilderCondition, fields: FilterBuilderField[]) => {
  const f = fields.find((x) => x.id === c.field);
  const op = opDef(f, c.operator);
  if (!f || !op) return false;
  if (op.noValue) return true;
  if (!c.value.trim()) return false;
  return f.type !== 'number' || Number.isFinite(Number(c.value));
};

const formatValue = (f: FilterBuilderField, v: string) => {
  if (f.type === 'enum') return optionList(f).find((o) => o.value === v)?.label ?? v;
  if (f.type === 'number') return f.unit ? `${v} ${f.unit}` : v;
  if (f.type === 'date') {
    const d = new Date(`${v}T00:00:00`);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return `“${v}”`;
};

const summarizeCondition = (c: FilterBuilderCondition, fields: FilterBuilderField[]) => {
  if (!isComplete(c, fields)) return '';
  const f = fields.find((x) => x.id === c.field) as FilterBuilderField;
  const op = opDef(f, c.operator) as OperatorDef;
  return op.noValue ? `${f.label} ${op.summary}` : `${f.label} ${op.summary} ${formatValue(f, c.value)}`;
};

const summaryParts = (g: FilterBuilderGroup, fields: FilterBuilderField[]): string[] =>
  g.children
    .map((n) => {
      if (n.type === 'condition') return summarizeCondition(n, fields);
      const inner = summaryParts(n, fields);
      return inner.length > 1 ? `(${inner.join(` ${n.combinator} `)})` : inner[0] ?? '';
    })
    .filter(Boolean);

/** Readable one-line summary: "Material is Grey V5 and (Status is Printing or Status is Queued)". Incomplete rows are skipped. */
export function summarizeFilter(group: FilterBuilderGroup, fields: FilterBuilderField[]): string {
  return summaryParts(group, fields).join(` ${group.combinator} `);
}

/** Number of complete conditions in the tree. */
export function countFilterConditions(group: FilterBuilderGroup, fields: FilterBuilderField[]): number {
  return group.children.reduce((n, c) => n + (c.type === 'group' ? countFilterConditions(c, fields) : isComplete(c, fields) ? 1 : 0), 0);
}

const mapNode = (g: FilterBuilderGroup, id: string, fn: (n: Node) => Node | null): FilterBuilderGroup => ({
  ...g,
  children: g.children.flatMap((c): Node[] => {
    if (c.id === id) {
      const next = fn(c);
      return next ? [next] : [];
    }
    return c.type === 'group' ? [mapNode(c, id, fn)] : [c];
  }),
});

/* -------------------------------------------------------------------- Component */

export type FilterBuilderProps = WithForcedState & {
  fields: FilterBuilderField[];
  value: FilterBuilderGroup;
  onChange: (value: FilterBuilderGroup) => void;
  /** Accessible name. */
  label?: string;
  /** Offer "Add group" for one level of nested groups. */
  allowGroups?: boolean;
  /** Show the summary chip under the rows. */
  showSummary?: boolean;
  /** Text in the chip when nothing filters, e.g. "Showing all 48 print jobs". */
  summaryEmptyLabel?: string;
  /** Hint shown when there are no rows yet. */
  emptyLabel?: ReactNode;
  disabled?: boolean;
  className?: string;
};

type Ctx = {
  fields: FilterBuilderField[];
  disabled?: boolean;
  forcedState?: string;
  allowGroups: boolean;
  change: (id: string, fn: (n: Node) => Node | null) => void;
  setCombinator: (groupId: string, c: 'and' | 'or') => void;
  add: (groupId: string, kind: 'condition' | 'group') => void;
  remove: (id: string, parentId: string) => void;
};

/**
 * Compose job-queue filters: rows of field → operator → value, AND/OR per group, one level of nested groups
 * and a readable summary chip. Operators and the value input follow the field type (text, number, enum, date).
 */
export function FilterBuilder({
  fields,
  value,
  onChange,
  label = 'Filters',
  allowGroups = true,
  showSummary = true,
  summaryEmptyLabel = 'No filters applied',
  emptyLabel = 'No conditions yet. Add one to narrow the list.',
  disabled,
  className,
  'data-state': forcedState,
}: FilterBuilderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    const key = pendingFocus.current;
    if (!key) return;
    pendingFocus.current = null;
    const root = rootRef.current;
    (root?.querySelector<HTMLElement>(`[data-focus-key="${key}"] select`) ?? root?.querySelector<HTMLElement>(`[data-focus-key="${key}"]`))?.focus();
  }, [value]);

  const ctx: Ctx = {
    fields,
    disabled,
    forcedState,
    allowGroups,
    change: (id, fn) => onChange(mapNode(value, id, fn)),
    setCombinator: (groupId, combinator) =>
      onChange(groupId === value.id ? { ...value, combinator } : mapNode(value, groupId, (n) => (n.type === 'group' ? { ...n, combinator } : n))),
    add: (groupId, kind) => {
      const first = fields[0];
      if (!first) return;
      const node: Node = kind === 'condition' ? createFilterBuilderCondition(first) : createFilterBuilderGroup('or', [createFilterBuilderCondition(first)]);
      const target = node.type === 'group' ? node.children[0].id : node.id;
      pendingFocus.current = target;
      const append = (g: FilterBuilderGroup): FilterBuilderGroup => ({ ...g, children: [...g.children, node] });
      onChange(groupId === value.id ? append(value) : mapNode(value, groupId, (n) => (n.type === 'group' ? append(n) : n)));
    },
    remove: (id, parentId) => {
      pendingFocus.current = `add-${parentId}`;
      onChange(mapNode(value, id, () => null));
    },
  };

  const count = countFilterConditions(value, fields);
  const summary = summarizeFilter(value, fields);

  return (
    <div ref={rootRef} role="group" aria-label={label} className={cx(s.root, className)}>
      {value.children.length === 0 ? <p className={s.emptyHint}>{emptyLabel}</p> : <GroupRows group={value} ctx={ctx} depth={0} />}
      <div className={s.footer}>
        <Button variant="ghost" shape="rounded" iconStart={<PlusIcon strokeWidth={2.4} />} onClick={() => ctx.add(value.id, 'condition')} disabled={disabled || !fields.length} data-focus-key={`add-${value.id}`}>
          Add condition
        </Button>
        {allowGroups && (
          <Button variant="ghost" shape="rounded" iconStart={<ListPlusIcon strokeWidth={2.2} />} onClick={() => ctx.add(value.id, 'group')} disabled={disabled || !fields.length}>
            Add group
          </Button>
        )}
        {value.children.length > 0 && (
          <Button
            variant="ghost"
            shape="rounded"
            className={s.clear}
            onClick={() => {
              pendingFocus.current = `add-${value.id}`;
              onChange({ ...value, children: [] });
            }}
            disabled={disabled}
          >
            Clear all
          </Button>
        )}
      </div>
      {showSummary && (
        <p className={cx(s.summary, !summary && s.summaryEmpty)} title={summary || summaryEmptyLabel}>
          <FilterIcon strokeWidth={2.2} aria-hidden="true" />
          <span className={s.summaryText}>
            {summary ? (
              <>
                <span className={s.srOnly}>{`${count} ${count === 1 ? 'filter' : 'filters'}: `}</span>
                {summary}
              </>
            ) : (
              summaryEmptyLabel
            )}
          </span>
        </p>
      )}
    </div>
  );
}

function GroupRows({ group, ctx, depth }: { group: FilterBuilderGroup; ctx: Ctx; depth: number }) {
  return (
    <div className={s.group}>
      {group.children.map((node, i) => (
        <div key={node.id} className={s.row}>
          <span className={s.connector}>
            {i === 0 ? (
              'Where'
            ) : i === 1 ? (
              <Segmented
                label={depth === 0 ? 'Combine conditions with' : 'Combine conditions in group with'}
                size="sm"
                value={group.combinator}
                onChange={(c) => ctx.setCombinator(group.id, c)}
                options={[
                  { value: 'and', label: 'AND' },
                  { value: 'or', label: 'OR' },
                ]}
                disabled={ctx.disabled}
              />
            ) : (
              <span className={s.combinator}>{group.combinator}</span>
            )}
          </span>
          {node.type === 'condition' ? (
            <ConditionRow cond={node} index={i} parentId={group.id} ctx={ctx} forced={depth === 0 && i === 0} />
          ) : (
            <NestedGroup group={node} parentId={group.id} ctx={ctx} />
          )}
        </div>
      ))}
    </div>
  );
}

function NestedGroup({ group, parentId, ctx }: { group: FilterBuilderGroup; parentId: string; ctx: Ctx }) {
  return (
    <div className={cx(s.groupBody, s.nested, s.group)} role="group" aria-label={`Condition group, ${group.combinator === 'and' ? 'all' : 'any'} of`}>
      <div className={s.groupHeader}>
        <span>{group.combinator === 'and' ? 'All of the following are true' : 'Any of the following are true'}</span>
        <IconButton label="Remove group" icon={<Trash2Icon strokeWidth={2.2} />} size="sm" onClick={() => ctx.remove(group.id, parentId)} disabled={ctx.disabled} />
      </div>
      {group.children.length > 0 && <GroupRows group={group} ctx={ctx} depth={1} />}
      <div className={s.footer}>
        <Button variant="ghost" shape="rounded" iconStart={<PlusIcon strokeWidth={2.4} />} onClick={() => ctx.add(group.id, 'condition')} disabled={ctx.disabled} data-focus-key={`add-${group.id}`}>
          Add condition
        </Button>
      </div>
    </div>
  );
}

function ConditionRow({ cond, index, parentId, ctx, forced }: { cond: FilterBuilderCondition; index: number; parentId: string; ctx: Ctx; forced: boolean }) {
  const { fields, disabled } = ctx;
  const field = fields.find((f) => f.id === cond.field) ?? fields[0];
  const ops = field ? OPERATORS[field.type] : [];
  const op = ops.find((o) => o.value === cond.operator) ?? ops[0];
  const summary = summarizeCondition(cond, fields);
  const update = (patch: Partial<FilterBuilderCondition>) => ctx.change(cond.id, (n) => ({ ...(n as FilterBuilderCondition), ...patch }));

  const setField = (id: string) => {
    const f = fields.find((x) => x.id === id);
    if (!f) return;
    update({ field: f.id, operator: OPERATORS[f.type][0].value, value: defaultValue(f) });
  };
  const setOperator = (v: string) => {
    const next = ops.find((o) => o.value === v);
    if (next) update({ operator: next.value, value: next.noValue ? '' : cond.value });
  };

  let valueInput: ReactNode = <span className={s.valueSpacer} />;
  if (field && op && !op.noValue) {
    const valueLabel = `Value for ${field.label}`;
    if (field.type === 'enum') {
      valueInput = <Select label={valueLabel} value={cond.value} options={optionList(field)} onChange={(v) => update({ value: v })} fullWidth disabled={disabled} />;
    } else if (field.type === 'number') {
      const invalid = cond.value.trim() !== '' && !Number.isFinite(Number(cond.value));
      valueInput = (
        <TextField
          label={valueLabel}
          value={cond.value}
          onChange={(v) => update({ value: v })}
          inputMode="decimal"
          placeholder={field.placeholder ?? '0'}
          invalid={invalid}
          fullWidth
          disabled={disabled}
          iconEnd={field.unit ? <span className={s.unit}>{field.unit}</span> : undefined}
        />
      );
    } else if (field.type === 'date') {
      valueInput = <TextField label={valueLabel} type="date" value={cond.value} onChange={(v) => update({ value: v })} fullWidth disabled={disabled} />;
    } else {
      valueInput = <TextField label={valueLabel} value={cond.value} onChange={(v) => update({ value: v })} placeholder={field.placeholder ?? 'Value'} fullWidth disabled={disabled} />;
    }
  }

  return (
    <div className={s.conditionBody} role="group" aria-label={`Condition ${index + 1}`} data-focus-key={cond.id}>
      <Select
        label="Field"
        className={s.field}
        value={field?.id ?? ''}
        options={fields.map((f) => ({ value: f.id, label: f.label }))}
        onChange={setField}
        disabled={disabled}
        data-state={forced ? ctx.forcedState : undefined}
      />
      <Select label="Operator" className={s.operator} value={op?.value ?? ''} options={ops.map((o) => ({ value: o.value, label: o.label }))} onChange={setOperator} disabled={disabled} />
      <span className={s.value}>{valueInput}</span>
      <IconButton label={summary ? `Remove condition: ${summary}` : `Remove condition ${index + 1}`} icon={<XIcon strokeWidth={2.4} />} onClick={() => ctx.remove(cond.id, parentId)} disabled={disabled} />
    </div>
  );
}
