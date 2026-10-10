import { useEffect, useId, useMemo, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileCode2Icon,
  FileImageIcon,
  FileTextIcon,
  FileXIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react';
import { cx } from '../../lib/cx';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Spinner } from '../Spinner/Spinner';
import s from './DocumentPreview.module.css';

export type DocumentKind = 'pdf' | 'image' | 'text';

export type DocumentPreviewProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  fileName: string;
  /** How the body renders: PDF in an iframe, image page set, or a mono text excerpt. */
  kind: DocumentKind;
  /** Human type label for the meta line, e.g. "Print report", "G-code". Defaults from `kind`. */
  typeLabel?: string;
  /** File size in bytes. */
  size?: number;
  /** Page count shown in the meta line (defaults to `pages.length`). */
  pageCount?: number;
  /** PDF URL (iframe is only rendered when set) or a single image URL. */
  src?: string;
  /** Multi-page image set (rendered layer slices, report pages). Enables page navigation. */
  pages?: string[];
  /** Raw text for `kind="text"`; only the first `maxLines` lines are rendered. */
  text?: string;
  maxLines?: number;
  /** Total line count when `text` is already an excerpt. */
  totalLines?: number;
  /** Controlled page (0-based). */
  page?: number;
  onPageChange?: (page: number) => void;
  onDownload?: () => void;
  onOpen?: () => void;
  /** `card` is a bordered surface; `pane` fills its container with no outer border. */
  layout?: 'card' | 'pane';
  /** Body height. */
  height?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

const ZOOMS = [50, 75, 100, 125, 150, 200, 300];
const KIND_LABEL: Record<DocumentKind, string> = { pdf: 'PDF', image: 'Image', text: 'Text' };
const KIND_ICON = { pdf: FileTextIcon, image: FileImageIcon, text: FileCode2Icon } as const;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${i === 0 ? v : v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

/** File preview card: header with name, type, size, pages and actions; body previews PDF, images or text. */
export function DocumentPreview({
  fileName,
  kind,
  typeLabel,
  size,
  pageCount,
  src,
  pages,
  text,
  maxLines = 40,
  totalLines,
  page: pageProp,
  onPageChange,
  onDownload,
  onOpen,
  layout = 'card',
  height = 'md',
  loading,
  className,
  ...rest
}: DocumentPreviewProps) {
  const titleId = useId();
  const imageSet = useMemo(() => (kind === 'image' ? (pages?.length ? pages : src ? [src] : []) : []), [kind, pages, src]);
  const [pageState, setPageState] = useState(0);
  const page = Math.min(Math.max(pageProp ?? pageState, 0), Math.max(imageSet.length - 1, 0));
  const [zoomIndex, setZoomIndex] = useState(ZOOMS.indexOf(100));
  const zoom = ZOOMS[zoomIndex];

  useEffect(() => setZoomIndex(ZOOMS.indexOf(100)), [imageSet[0], imageSet.length]);

  const goTo = (p: number) => {
    const next = Math.min(Math.max(p, 0), imageSet.length - 1);
    if (next === page) return;
    setPageState(next);
    onPageChange?.(next);
  };
  const zoomBy = (d: number) => setZoomIndex((i) => Math.min(Math.max(i + d, 0), ZOOMS.length - 1));

  const lines = useMemo(() => (kind === 'text' && text != null ? text.replace(/\r\n/g, '\n').split('\n') : []), [kind, text]);
  const shown = lines.slice(0, maxLines);
  const lineTotal = totalLines ?? lines.length;
  const pagesTotal = pageCount ?? (kind === 'image' && imageSet.length > 1 ? imageSet.length : undefined);

  const meta = [
    typeLabel ?? KIND_LABEL[kind],
    size != null ? formatBytes(size) : null,
    pagesTotal ? `${pagesTotal} page${pagesTotal === 1 ? '' : 's'}` : null,
    kind === 'text' && lineTotal ? `${lineTotal.toLocaleString()} lines` : null,
  ].filter(Boolean);

  const Icon = KIND_ICON[kind];
  const multi = imageSet.length > 1;

  const onViewportKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, () => void> = {
      PageDown: () => goTo(page + 1),
      PageUp: () => goTo(page - 1),
      '+': () => zoomBy(1),
      '=': () => zoomBy(1),
      '-': () => zoomBy(-1),
      '0': () => setZoomIndex(ZOOMS.indexOf(100)),
    };
    if (multi && zoom === 100) {
      map.ArrowRight = () => goTo(page + 1);
      map.ArrowLeft = () => goTo(page - 1);
    }
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  const empty = (message: string, hint: string) => (
    <div className={s.empty}>
      <FileXIcon strokeWidth={1.6} className={s.emptyIcon} aria-hidden />
      <p className={s.emptyTitle}>{message}</p>
      <p className={s.emptyHint}>{hint}</p>
    </div>
  );

  let body;
  if (loading) {
    body = (
      <div className={s.empty}>
        <Spinner size="md" tone="muted" label={`Loading ${fileName}`} />
      </div>
    );
  } else if (kind === 'pdf') {
    body = src ? <iframe className={s.frame} src={src} title={`${fileName} preview`} /> : empty('Preview not available', onDownload ? 'Download the file to view it.' : 'This PDF has no preview source.');
  } else if (kind === 'image') {
    body = imageSet.length ? (
      <div
        className={s.viewport}
        tabIndex={0}
        role="group"
        aria-label={`${fileName}${multi ? `, page ${page + 1} of ${imageSet.length}` : ''}, ${zoom}%. ${multi ? 'Page Up / Page Down change page, ' : ''}+ and − zoom.`}
        onKeyDown={onViewportKey}
      >
        <img
          key={imageSet[page]}
          className={s.image}
          src={imageSet[page]}
          alt={multi ? `${fileName}, page ${page + 1}` : fileName}
          style={{ '--doc-zoom': zoom / 100 } as CSSProperties}
          draggable={false}
        />
      </div>
    ) : (
      empty('No pages to preview', 'This file has no rendered pages yet.')
    );
  } else {
    body = lines.length ? (
      <div className={s.textWrap} tabIndex={0} role="group" aria-label={`${fileName}, first ${shown.length} lines`}>
        <pre className={s.code}>
          <code>
            {shown.map((line, i) => (
              <span key={i} className={cx(s.line, /^\s*;/.test(line) && s.comment)}>
                <span className={s.ln} aria-hidden>
                  {i + 1}
                </span>
                <span className={s.lineText}>{line || ' '}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    ) : (
      empty('Empty file', 'There is no text to preview.')
    );
  }

  const showImageTools = kind === 'image' && imageSet.length > 0 && !loading;
  const truncated = kind === 'text' && !loading && lineTotal > shown.length;

  return (
    <section aria-labelledby={titleId} className={cx(s.root, s[layout], s[height], className)} {...rest}>
      <header className={s.header}>
        <span className={cx(s.fileIcon, kind === 'pdf' ? s.iconPdf : kind === 'text' ? s.iconText : undefined)} aria-hidden>
          <Icon strokeWidth={2} />
        </span>
        <div className={s.heading}>
          <h3 id={titleId} className={s.name} title={fileName}>
            {fileName}
          </h3>
          <p className={s.meta}>
            {meta.map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </p>
        </div>
        {(onDownload || onOpen) && (
          <div className={s.actions}>
            {onDownload && (
              <Button variant="outline" iconStart={<DownloadIcon strokeWidth={2.2} />} onClick={onDownload}>
                Download
              </Button>
            )}
            {onOpen && (
              <Button variant="primary" iconStart={<ExternalLinkIcon strokeWidth={2.2} />} onClick={onOpen}>
                Open
              </Button>
            )}
          </div>
        )}
      </header>

      {showImageTools && (
        <div className={s.toolbar} role="toolbar" aria-label="Preview controls">
          {multi ? (
            <span className={s.group}>
              <IconButton label="Previous page" icon={<ChevronLeftIcon strokeWidth={2.2} />} disabled={page === 0} onClick={() => goTo(page - 1)} />
              <span className={s.pageLabel} aria-live="polite">
                Page {page + 1} of {imageSet.length}
              </span>
              <IconButton label="Next page" icon={<ChevronRightIcon strokeWidth={2.2} />} disabled={page >= imageSet.length - 1} onClick={() => goTo(page + 1)} />
            </span>
          ) : (
            <span />
          )}
          <span className={s.group}>
            <IconButton label="Zoom out" icon={<ZoomOutIcon strokeWidth={2.2} />} disabled={zoomIndex === 0} onClick={() => zoomBy(-1)} />
            <button type="button" className={s.zoomValue} onClick={() => setZoomIndex(ZOOMS.indexOf(100))} aria-label={`Zoom ${zoom}%, reset to fit`} title="Reset to fit">
              {zoom}%
            </button>
            <IconButton label="Zoom in" icon={<ZoomInIcon strokeWidth={2.2} />} disabled={zoomIndex === ZOOMS.length - 1} onClick={() => zoomBy(1)} />
          </span>
        </div>
      )}

      <div className={s.body}>{body}</div>

      {truncated && (
        <footer className={s.footer}>
          Showing first {shown.length.toLocaleString()} of {lineTotal.toLocaleString()} lines
        </footer>
      )}
    </section>
  );
}
