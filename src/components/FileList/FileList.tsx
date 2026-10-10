import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { CircleAlertIcon, CircleCheckIcon, DownloadIcon, FileBoxIcon, FolderOpenIcon, PencilIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import { Menu, type MenuItem } from '../Menu/Menu';
import { Spinner } from '../Spinner/Spinner';
import s from './FileList.module.css';

export type FileType = 'stl' | 'obj' | '3mf' | 'form';
export type FileStatus = 'uploaded' | 'uploading' | 'failed';

export type FileListFile = {
  id: string;
  name: string;
  /** Derived from the extension when omitted. */
  type?: FileType;
  /** Bytes. */
  size: number;
  /** A Date is formatted with Intl; a string is shown as is ("2m ago"). */
  modified: Date | string;
  status?: FileStatus;
  /** 0–100 while uploading. */
  progress?: number;
  /** Failure reason, shown under the name. */
  error?: string;
};

export type FileAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
};

export type FileListProps = WithForcedState &
  Omit<HTMLAttributes<HTMLUListElement>, 'children'> & {
    files: FileListFile[];
    /** Called with the action id ("open", "download", "rename", "retry", "delete"…) and the file. */
    onAction?: (action: string, file: FileListFile) => void;
    /** Clicking a file name. Disabled while the file is uploading. */
    onOpen?: (file: FileListFile) => void;
    /** Override the row menu; receives the file so failed uploads can offer "Retry". */
    actions?: FileAction[] | ((file: FileListFile) => FileAction[]);
    density?: 'compact' | 'comfortable';
  };

const TYPE_LABEL: Record<FileType, string> = {
  stl: 'STL',
  obj: 'OBJ',
  '3mf': '3MF',
  form: 'FORM',
};

const typeOf = (f: FileListFile): FileType => {
  if (f.type) return f.type;
  const ext = f.name.split('.').pop()?.toLowerCase();
  return ext === 'obj' || ext === '3mf' || ext === 'form' ? ext : 'stl';
};

/** Human-readable byte size: 842 KB, 12.4 MB. */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  return `${u === 0 || v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[u]}`;
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const formatDate = (d: Date | string) => (typeof d === 'string' ? d : dateFormat.format(d));

const defaultActions = (file: FileListFile): FileAction[] =>
  file.status === 'failed'
    ? [
        {
          id: 'retry',
          label: 'Retry upload',
          icon: <RefreshCwIcon strokeWidth={2.2} />,
        },
        {
          id: 'delete',
          label: 'Remove',
          icon: <Trash2Icon strokeWidth={2.2} />,
          danger: true,
        },
      ]
    : [
        {
          id: 'open',
          label: 'Open in PreForm',
          icon: <FolderOpenIcon strokeWidth={2.2} />,
        },
        {
          id: 'download',
          label: 'Download',
          icon: <DownloadIcon strokeWidth={2.2} />,
        },
        {
          id: 'rename',
          label: 'Rename',
          icon: <PencilIcon strokeWidth={2.2} />,
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: <Trash2Icon strokeWidth={2.2} />,
          danger: true,
        },
      ];

/** Model files in a project or upload queue: type tile, name, size, modified date, upload status and a ⋮ menu. */
export function FileList({ files, onAction, onOpen, actions, density = 'comfortable', className, ...rest }: FileListProps) {
  return (
    <ul className={cx(s.list, s[density], className)} {...rest}>
      {files.map((file) => {
        const type = typeOf(file);
        const status = file.status ?? 'uploaded';
        const progress = Math.min(100, Math.max(0, file.progress ?? 0));
        const list = typeof actions === 'function' ? actions(file) : (actions ?? defaultActions(file));
        const items: MenuItem[] = list.map((a) => ({
          label: a.label,
          icon: a.icon,
          danger: a.danger,
          onSelect: () => onAction?.(a.id, file),
        }));
        const size = formatFileSize(file.size);
        const date = formatDate(file.modified);
        const meta =
          status === 'failed' ? (
            <span className={s.error}>{file.error ?? 'Upload failed'}</span>
          ) : status === 'uploading' ? (
            <span>
              Uploading · {progress}% of {size}
            </span>
          ) : (
            <span>
              {TYPE_LABEL[type]} · {size} · {date}
            </span>
          );
        return (
          <li key={file.id} className={cx(s.row, s[status])}>
            <span className={s.tile} data-type={type} aria-hidden="true">
              <FileBoxIcon strokeWidth={2} />
              {density === 'comfortable' && <span className={s.tileLabel}>{TYPE_LABEL[type]}</span>}
            </span>
            <div className={s.main}>
              <button type="button" className={s.name} disabled={status === 'uploading'} onClick={() => onOpen?.(file)} title={file.name}>
                {file.name}
              </button>
              {density === 'comfortable' && <span className={s.meta}>{meta}</span>}
              {status === 'uploading' && (
                <span
                  className={s.progress}
                  role="progressbar"
                  aria-label={`Uploading ${file.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  style={{ '--file-progress': progress / 100 } as CSSProperties}
                >
                  <span className={s.progressFill} />
                </span>
              )}
              {density === 'compact' && status === 'failed' && <span className={s.meta}>{meta}</span>}
            </div>
            {density === 'compact' && (
              <>
                <span className={s.col}>{TYPE_LABEL[type]}</span>
                <span className={cx(s.col, s.colSize)}>{status === 'uploading' ? `${progress}%` : size}</span>
                <span className={cx(s.col, s.colDate)}>{date}</span>
              </>
            )}
            <span className={s.status}>
              {status === 'uploaded' && <CircleCheckIcon className={s.ok} strokeWidth={2.2} aria-label="Uploaded" role="img" />}
              {status === 'uploading' && <Spinner size="xs" tone="accent" label={`Uploading ${file.name}`} />}
              {status === 'failed' && <CircleAlertIcon className={s.fail} strokeWidth={2.2} aria-label="Upload failed" role="img" />}
            </span>
            {items.length > 0 && <Menu label={`Actions for ${file.name}`} items={items} className={s.menu} />}
          </li>
        );
      })}
    </ul>
  );
}
