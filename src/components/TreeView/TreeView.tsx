import { useCallback, useMemo, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './TreeView.module.css';

export type TreeNode = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Muted trailing text: part count, volume, "Hidden". */
  meta?: string;
  children?: TreeNode[];
  disabled?: boolean;
  /** Faint label, e.g. a hidden model. */
  muted?: boolean;
};

export type TreeViewProps = WithForcedState &
  Omit<HTMLAttributes<HTMLUListElement>, 'onSelect' | 'children'> & {
    /** Accessible name, e.g. "Project". */
    label: string;
    nodes: TreeNode[];
    /** Expanded node ids (controlled). */
    expanded?: string[];
    /** Initial expanded ids when `expanded` is not controlled. */
    defaultExpanded?: string[];
    onExpandedChange?: (expanded: string[]) => void;
    /** Selected node id (controlled, single selection). */
    selectedId?: string | null;
    onSelect?: (id: string, node: TreeNode) => void;
    /** Shows a checkbox per row. Parents reflect their descendants (checked / mixed). */
    checkable?: boolean;
    /** Checked leaf ids (controlled). */
    checked?: string[];
    onCheckedChange?: (checked: string[]) => void;
    /** Trailing actions per row (visibility toggle, ⋮ menu). Shown on hover, focus and selection. */
    renderActions?: (node: TreeNode) => ReactNode;
  };

type Flat = { node: TreeNode; level: number; parentId: string | null };

const leafIds = (node: TreeNode): string[] => (node.children?.length ? node.children.flatMap(leafIds) : [node.id]);

function useControllable<T>(controlled: T | undefined, initial: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = useState(initial);
  const value = controlled !== undefined ? controlled : inner;
  const set = useCallback(
    (v: T) => {
      if (controlled === undefined) setInner(v);
      onChange?.(v);
    },
    [controlled, onChange],
  );
  return [value, set];
}

/**
 * Hierarchical project tree: Build platform → groups → models → parts. Implements the WAI-ARIA tree pattern
 * (Up/Down, Left/Right to collapse/expand or move to parent/child, Home/End, Enter/Space to select or check).
 */
export function TreeView({
  label,
  nodes,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selectedId: selectedProp,
  onSelect,
  checkable,
  checked: checkedProp,
  onCheckedChange,
  renderActions,
  className,
  ...rest
}: TreeViewProps) {
  const [expanded, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
  const [selectedId, setSelectedId] = useControllable<string | null>(selectedProp, null);
  const [checked, setChecked] = useControllable(checkedProp, [] as string[], onCheckedChange);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLLIElement>());

  const expandedSet = useMemo(() => new Set(expanded), [expanded]);
  const checkedSet = useMemo(() => new Set(checked), [checked]);

  const visible = useMemo(() => {
    const out: Flat[] = [];
    const walk = (list: TreeNode[], level: number, parentId: string | null) => {
      for (const node of list) {
        out.push({ node, level, parentId });
        if (node.children?.length && expandedSet.has(node.id)) walk(node.children, level + 1, node.id);
      }
    };
    walk(nodes, 1, null);
    return out;
  }, [nodes, expandedSet]);

  const tabStop =
    (focusedId && visible.some((v) => v.node.id === focusedId) && focusedId) ||
    (selectedId && visible.some((v) => v.node.id === selectedId) && selectedId) ||
    visible.find((v) => !v.node.disabled)?.node.id;

  const focus = (id: string) => {
    setFocusedId(id);
    refs.current.get(id)?.focus();
  };
  const toggleExpanded = (id: string, open?: boolean) => {
    const isOpen = expandedSet.has(id);
    const next = open ?? !isOpen;
    if (next === isOpen) return;
    setExpanded(next ? [...expanded, id] : expanded.filter((x) => x !== id));
  };
  const select = (node: TreeNode) => {
    if (node.disabled) return;
    setSelectedId(node.id);
    onSelect?.(node.id, node);
  };
  const checkState = (node: TreeNode): boolean | 'mixed' => {
    const leaves = leafIds(node);
    const n = leaves.filter((id) => checkedSet.has(id)).length;
    return n === 0 ? false : n === leaves.length ? true : 'mixed';
  };
  const toggleChecked = (node: TreeNode) => {
    if (node.disabled) return;
    const leaves = leafIds(node);
    const on = checkState(node) !== true;
    const next = new Set(checked);
    leaves.forEach((id) => (on ? next.add(id) : next.delete(id)));
    setChecked(Array.from(next));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const index = visible.findIndex((v) => v.node.id === tabStop);
    if (index < 0) return;
    const { node, parentId } = visible[index];
    const hasChildren = !!node.children?.length;
    const enabled = visible.filter((v) => !v.node.disabled);
    const move = (dir: 1 | -1) => {
      for (let i = index + dir; i >= 0 && i < visible.length; i += dir) {
        if (!visible[i].node.disabled) return focus(visible[i].node.id);
      }
    };
    switch (e.key) {
      case 'ArrowDown':
        move(1);
        break;
      case 'ArrowUp':
        move(-1);
        break;
      case 'ArrowRight':
        if (hasChildren && !expandedSet.has(node.id)) toggleExpanded(node.id, true);
        else if (hasChildren) move(1);
        break;
      case 'ArrowLeft':
        if (hasChildren && expandedSet.has(node.id)) toggleExpanded(node.id, false);
        else if (parentId) focus(parentId);
        break;
      case 'Home':
        if (enabled[0]) focus(enabled[0].node.id);
        break;
      case 'End':
        if (enabled.length) focus(enabled[enabled.length - 1].node.id);
        break;
      case 'Enter':
        select(node);
        break;
      case ' ':
        if (checkable) toggleChecked(node);
        else select(node);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const renderNodes = (list: TreeNode[], level: number): ReactNode =>
    list.map((node, i) => {
      const hasChildren = !!node.children?.length;
      const isOpen = hasChildren && expandedSet.has(node.id);
      const isSelected = selectedId === node.id;
      const state = checkable ? checkState(node) : undefined;
      const actions = renderActions?.(node);
      return (
        <li
          key={node.id}
          ref={(el) => {
            if (el) refs.current.set(node.id, el);
            else refs.current.delete(node.id);
          }}
          role="treeitem"
          aria-level={level}
          aria-setsize={list.length}
          aria-posinset={i + 1}
          aria-expanded={hasChildren ? isOpen : undefined}
          aria-selected={isSelected}
          aria-checked={state}
          aria-disabled={node.disabled || undefined}
          tabIndex={tabStop === node.id ? 0 : -1}
          onFocus={(e) => {
            if (e.target === e.currentTarget) setFocusedId(node.id);
          }}
          className={cx(s.item, tabStop === node.id && s.tabStop)}
        >
          <div
            className={cx(s.row, isSelected && s.selected, node.muted && s.muted, node.disabled && s.disabled)}
            style={{ '--tree-level': level - 1 } as CSSProperties}
            onClick={() => {
              if (node.disabled) return;
              focus(node.id);
              select(node);
            }}
          >
            <span
              className={cx(s.caret, isOpen && s.open)}
              aria-hidden="true"
              onClick={(e: MouseEvent) => {
                if (!hasChildren || node.disabled) return;
                e.stopPropagation();
                focus(node.id);
                toggleExpanded(node.id);
              }}
            >
              {hasChildren && <ChevronRightIcon strokeWidth={2.4} />}
            </span>
            {checkable && (
              <span
                className={cx(s.check, state !== false && s.checkOn)}
                aria-hidden="true"
                onClick={(e: MouseEvent) => {
                  e.stopPropagation();
                  if (node.disabled) return;
                  focus(node.id);
                  toggleChecked(node);
                }}
              >
                {state === 'mixed' ? (
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M2.5 6 H9.5" />
                  </svg>
                ) : state ? (
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 6.3 L5 8.6 L9.5 3.6" />
                  </svg>
                ) : null}
              </span>
            )}
            {node.icon && (
              <span className={s.icon} aria-hidden="true">
                {node.icon}
              </span>
            )}
            <span className={s.label}>{node.label}</span>
            {node.meta && <span className={s.meta}>{node.meta}</span>}
            {actions && (
              <span className={s.actions} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                {actions}
              </span>
            )}
          </div>
          {isOpen && (
            <ul role="group" className={s.group}>
              {renderNodes(node.children!, level + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <ul role="tree" aria-label={label} aria-multiselectable={checkable || undefined} onKeyDown={onKeyDown} className={cx(s.tree, className)} {...rest}>
      {renderNodes(nodes, 1)}
    </ul>
  );
}
