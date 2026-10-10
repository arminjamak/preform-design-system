import { useId, useRef, useState, type CSSProperties, type DragEvent, type KeyboardEvent } from 'react';
import { CircleAlertIcon, CircleCheckIcon, CloudUploadIcon, FileBoxIcon, UploadIcon, XIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import s from './FileUpload.module.css';

export type UploadFile = {
  id: string;
  name: string;
  /** Size in bytes. */
  size: number;
  /** Upload progress 0–100; omit when the file is local only. */
  progress?: number;
  /** Per-file error, e.g. "Mesh has 3 open edges". */
  error?: string;
};

export type FileUploadProps = WithForcedState & {
  /** `button`: picker button with the file list. `dropzone`: dashed drop area. */
  variant?: 'button' | 'dropzone';
  /** Same syntax as the native `accept` attribute: `.stl,.obj,.3mf` or `model/*`. */
  accept?: string;
  multiple?: boolean;
  files: UploadFile[];
  /** Receives only files that passed `accept` and `maxSize`. */
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  /** Largest allowed file in bytes. */
  maxSize?: number;
  disabled?: boolean;
  label: string;
  hint?: string;
  /** Main line inside the dropzone. */
  dropLabel?: string;
  className?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let n = bytes / 1024;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u++;
  }
  return `${n >= 100 ? Math.round(n) : n.toFixed(1)} ${units[u]}`;
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .some((a) => (a.startsWith('.') ? name.endsWith(a) : a.endsWith('/*') ? type.startsWith(a.slice(0, -1)) : type === a));
}

/** Model import: a picker button or a drag-and-drop area, with a list of files and their upload progress. */
export function FileUpload({
  variant = 'dropzone',
  accept,
  multiple = true,
  files,
  onAdd,
  onRemove,
  maxSize,
  disabled,
  label,
  hint,
  dropLabel = 'Drop STL, OBJ or 3MF files',
  className,
  'data-state': state,
}: FileUploadProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);

  const take = (list: FileList | null) => {
    if (!list || disabled) return;
    const incoming = Array.from(list).slice(0, multiple ? undefined : 1);
    const ok: File[] = [];
    const problems: string[] = [];
    for (const f of incoming) {
      if (!matchesAccept(f, accept)) problems.push(`${f.name} is not a supported file type.`);
      else if (maxSize !== undefined && f.size > maxSize) problems.push(`${f.name} is ${formatBytes(f.size)}; the limit is ${formatBytes(maxSize)}.`);
      else ok.push(f);
    }
    if (!multiple && list.length > 1) problems.push('Only one file can be added at a time.');
    setRejected(problems);
    if (ok.length) onAdd(ok);
  };

  const browse = () => !disabled && inputRef.current?.click();

  const dragHandlers = {
    onDragEnter: (e: DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      depth.current++;
      setDragging(true);
    },
    onDragOver: (e: DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: () => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      take(e.dataTransfer.files);
    },
  };

  const onZoneKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      browse();
    }
  };

  const hintId = hint ? `${id}-hint` : undefined;
  const fileLimit = [accept && accept.split(',').map((a) => a.trim().replace(/^\./, '').toUpperCase()).join(', '), maxSize !== undefined && `up to ${formatBytes(maxSize)}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={cx(s.root, disabled && s.disabled, className)}>
      <input
        ref={inputRef}
        type="file"
        className={s.native}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          take(e.target.files);
          e.target.value = '';
        }}
      />

      <span className={s.label} id={`${id}-label`}>
        {label}
      </span>

      {variant === 'dropzone' ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          aria-label={`${label}: ${dropLabel}, or press Enter to browse`}
          aria-describedby={hintId}
          className={cx(s.zone, dragging && s.dragging)}
          data-state={state}
          onClick={browse}
          onKeyDown={onZoneKey}
          {...dragHandlers}
        >
          <CloudUploadIcon className={s.zoneIcon} aria-hidden="true" />
          <span className={s.zoneTitle}>{dragging ? 'Release to add' : dropLabel}</span>
          <span className={s.zoneSub}>
            or <span className={s.browse}>browse your computer</span>
          </span>
          {fileLimit && <span className={s.zoneLimit}>{fileLimit}</span>}
        </div>
      ) : (
        <div className={s.buttonRow} {...dragHandlers}>
          <Button
            variant="outline"
            iconStart={<UploadIcon />}
            onClick={browse}
            disabled={disabled}
            aria-labelledby={`${id}-label ${id}-btn`}
            id={`${id}-btn`}
            aria-describedby={hintId}
            data-state={state}
          >
            {multiple ? 'Choose files' : 'Choose file'}
          </Button>
          {fileLimit && <span className={s.zoneLimit}>{fileLimit}</span>}
        </div>
      )}

      {hint && (
        <p id={hintId} className={s.hint}>
          {hint}
        </p>
      )}

      {rejected.length > 0 && (
        <div className={s.rejected} role="alert">
          {rejected.map((r) => (
            <p key={r} className={s.rejectedLine}>
              <CircleAlertIcon aria-hidden="true" />
              {r}
            </p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className={s.list} aria-label={`${label}: ${files.length} ${files.length === 1 ? 'file' : 'files'}`}>
          {files.map((f) => {
            const pct = f.progress === undefined ? undefined : Math.max(0, Math.min(100, f.progress));
            const uploading = pct !== undefined && pct < 100 && !f.error;
            const done = pct === 100 && !f.error;
            return (
              <li key={f.id} className={cx(s.file, f.error && s.fileError)}>
                <FileBoxIcon className={s.fileIcon} aria-hidden="true" />
                <span className={s.fileBody}>
                  <span className={s.fileTop}>
                    <span className={s.fileName} title={f.name}>
                      {f.name}
                    </span>
                    <span className={s.fileMeta}>{uploading ? `${Math.round(pct)}% · ${formatBytes(f.size)}` : formatBytes(f.size)}</span>
                  </span>
                  {uploading && (
                    <span
                      className={s.progress}
                      role="progressbar"
                      aria-label={`Uploading ${f.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(pct)}
                      style={{ '--progress': pct / 100 } as CSSProperties}
                    >
                      <span className={s.progressFill} />
                    </span>
                  )}
                  {f.error && <span className={s.fileErrorText}>{f.error}</span>}
                </span>
                {done && <CircleCheckIcon className={s.doneIcon} aria-label="Uploaded" role="img" />}
                {f.error && <CircleAlertIcon className={s.errorIcon} aria-hidden="true" />}
                <IconButton label={`Remove ${f.name}`} icon={<XIcon />} size="xs" onClick={() => onRemove(f.id)} disabled={disabled} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
