import { useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react';
import { AlertCircleIcon, ChevronLeftIcon, ChevronRightIcon, FolderIcon, PlusIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import s from './BreadcrumbEditor.module.css';

export type BreadcrumbEditorProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> &
  WithForcedState & {
    /** Folder names from the root down. */
    value: string[];
    onChange: (value: string[]) => void;
    /** Maximum number of folders; the add button disables at the limit. */
    maxDepth?: number;
    /** Placeholder for a new folder's name field. */
    placeholder?: string;
    /** Accessible name of the editor and the visible caption. */
    label?: string;
    /** Fixed, non-editable root shown before the first folder ("Formlabs Dashboard"). */
    rootLabel?: string;
    disabled?: boolean;
  };

type Editing = { index: number | 'new'; draft: string };

/** Returns an error message for an invalid folder name, or null. */
export function validateFolderName(name: string): string | null {
  if (!name.trim()) return 'Folder name can’t be empty.';
  if (name.includes('/')) return 'Folder names can’t contain “/”.';
  return null;
}

/** Editable folder path for print job and model library destinations: rename inline, add, remove and reorder segments. */
export function BreadcrumbEditor({
  value,
  onChange,
  maxDepth = 6,
  placeholder = 'New folder',
  label = 'Folder path',
  rootLabel,
  disabled,
  className,
  'data-state': forcedState,
  ...rest
}: BreadcrumbEditorProps) {
  const uid = useId();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Focus to restore once the change lands: `expect` is the value we asked the parent for (null = no value change). */
  const pendingFocus = useRef<{ target: string; expect: string[] | null } | null>(null);
  const [, forceRender] = useState(0);
  const setFocusNext = (target: string, expect: string[] | null = null) => {
    pendingFocus.current = { target, expect };
    forceRender((n) => n + 1);
  };
  const rootRef = useRef<HTMLDivElement>(null);
  /** Set when Enter/Escape closes the field so the unmount blur does not commit twice. */
  const closing = useRef(false);
  const atLimit = value.length >= maxDepth;

  useEffect(() => {
    const p = pendingFocus.current;
    if (!p) return;
    if (p.expect && (p.expect.length !== value.length || p.expect.some((v, i) => v !== value[i]))) return;
    pendingFocus.current = null;
    rootRef.current?.querySelector<HTMLElement>(`[data-be-focus="${p.target}"]`)?.focus();
  });

  const startEdit = (index: number | 'new') => {
    if (disabled) return;
    closing.current = false;
    pendingFocus.current = null;
    setError(null);
    setEditing({ index, draft: index === 'new' ? '' : value[index] });
  };

  const cancel = (refocus = true) => {
    const idx = editing?.index;
    closing.current = true;
    setEditing(null);
    setError(null);
    if (refocus) setFocusNext(idx === 'new' || idx === undefined ? 'add' : `name-${idx}`);
  };

  const commit = (refocus = true) => {
    if (!editing) return;
    if (editing.index === 'new' && !editing.draft.trim()) return cancel(refocus);
    const err = validateFolderName(editing.draft);
    if (err) {
      setError(err);
      return;
    }
    const name = editing.draft.trim();
    const next = editing.index === 'new' ? [...value, name] : value.map((v, i) => (i === editing.index ? name : v));
    onChange(next);
    if (refocus) setFocusNext(editing.index === 'new' ? (next.length >= maxDepth ? `name-${value.length}` : 'add') : `name-${editing.index}`, next);
    closing.current = true;
    setEditing(null);
    setError(null);
  };

  const remove = (i: number) => {
    const next = value.filter((_, j) => j !== i);
    onChange(next);
    setFocusNext(next.length > 0 ? `name-${Math.max(0, i - 1)}` : 'add', next);
  };

  const move = (i: number, dir: -1 | 1, focusPart: 'left' | 'right' | 'name') => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    const edge = (focusPart === 'left' && j === 0) || (focusPart === 'right' && j === value.length - 1);
    setFocusNext(edge ? `name-${j}` : `${focusPart}-${j}`, next);
  };

  const onNameKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === 'F2') {
      e.preventDefault();
      startEdit(i);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      remove(i);
    } else if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      move(i, e.key === 'ArrowLeft' ? -1 : 1, 'name');
    }
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };

  const errorId = `${uid}-error`;
  const hintId = `${uid}-hint`;
  const preview = `/${[rootLabel, ...value].filter(Boolean).join('/')}`;

  const renderInput = (index: number | 'new') =>
    editing && editing.index === index ? (
      <input
        autoFocus
        className={cx(s.input, error && s.inputInvalid)}
        value={editing.draft}
        placeholder={placeholder}
        size={Math.max(editing.draft.length, placeholder.length, 4)}
        aria-label={index === 'new' ? 'New folder name' : `Rename folder ${value[index as number]}`}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => {
          const draft = e.target.value;
          setEditing({ index, draft });
          setError(draft.includes('/') ? validateFolderName(draft) : null);
        }}
        onKeyDown={onInputKey}
        onBlur={() => {
          if (closing.current) closing.current = false;
          else commit(false);
        }}
      />
    ) : null;

  return (
    <div ref={rootRef} role="group" aria-label={label} className={cx(s.root, disabled && s.disabled, className)} {...rest}>
      <span id={hintId} className={s.srOnly}>
        Press Enter or F2 to rename, Delete to remove, Alt plus Left or Right arrow to move.
      </span>
      <ol className={s.path}>
        <li className={s.rootItem}>
          <FolderIcon aria-hidden="true" className={s.folderIcon} />
          {rootLabel && <span className={s.rootLabel}>{rootLabel}</span>}
        </li>
        {value.map((seg, i) => (
          // Index keys keep the chip's DOM (and focus) stable while it is renamed or swapped.
          <li key={i} className={s.item}>
            {(i > 0 || rootLabel) && (
              <span className={s.sep} aria-hidden="true">
                /
              </span>
            )}
            {editing?.index === i ? (
              renderInput(i)
            ) : (
              <span className={s.chip}>
                <IconButton
                  label={`Move ${seg} left`}
                  icon={<ChevronLeftIcon strokeWidth={2.4} />}
                  size="xs"
                  disabled={disabled || i === 0}
                  data-be-focus={`left-${i}`}
                  onClick={() => move(i, -1, 'left')}
                  className={s.chipBtn}
                />
                <button
                  type="button"
                  className={s.name}
                  disabled={disabled}
                  data-be-focus={`name-${i}`}
                  data-state={i === 0 ? forcedState : undefined}
                  aria-label={`${seg}, folder ${i + 1} of ${value.length}. Rename`}
                  aria-describedby={hintId}
                  onClick={() => startEdit(i)}
                  onKeyDown={(e) => onNameKey(e, i)}
                >
                  {seg}
                </button>
                <IconButton
                  label={`Move ${seg} right`}
                  icon={<ChevronRightIcon strokeWidth={2.4} />}
                  size="xs"
                  disabled={disabled || i === value.length - 1}
                  data-be-focus={`right-${i}`}
                  onClick={() => move(i, 1, 'right')}
                  className={s.chipBtn}
                />
                <IconButton label={`Remove ${seg}`} icon={<XIcon strokeWidth={2.4} />} size="xs" disabled={disabled} onClick={() => remove(i)} className={cx(s.chipBtn, s.removeBtn)} />
              </span>
            )}
          </li>
        ))}
        {editing?.index === 'new' && (
          <li className={s.item}>
            {(value.length > 0 || rootLabel) && (
              <span className={s.sep} aria-hidden="true">
                /
              </span>
            )}
            {renderInput('new')}
          </li>
        )}
        <li className={s.addItem}>
          <Button
            variant="ghost"
            iconStart={<PlusIcon strokeWidth={2.4} />}
            disabled={disabled || atLimit || editing?.index === 'new'}
            data-be-focus="add"
            onClick={() => startEdit('new')}
            title={atLimit ? `Paths can be at most ${maxDepth} folders deep` : undefined}
          >
            Add folder
          </Button>
        </li>
      </ol>

      <div className={s.footer}>
        {error ? (
          <p id={errorId} className={s.error} role="alert">
            <AlertCircleIcon aria-hidden="true" />
            {error}
          </p>
        ) : atLimit ? (
          <p className={s.hint}>Maximum depth of {maxDepth} folders reached.</p>
        ) : null}
        <p className={s.preview} aria-live="polite">
          <span className={s.previewLabel}>Path preview</span>
          <code className={s.previewPath}>{preview}</code>
        </p>
      </div>
    </div>
  );
}
