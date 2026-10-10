import { forwardRef, useEffect, useMemo, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { CheckIcon, CopyIcon, FileCode2Icon, WrapTextIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import { copyText, readDurationToken } from './clipboard';
import { HighlightedLine } from './HighlightedLine';
import { LANGUAGE_LABELS, resolveLanguage, tokenize, type CodeLanguage } from './tokenize';
import s from './CodeBlock.module.css';

export type { CodeLanguage } from './tokenize';

export type CodeBlockProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Source text to display. Trailing newline is ignored. */
  code: string;
  /** `typescript`, `javascript`, `json`, `python`, `bash`, `gcode`, `css` or `text`. Aliases such as `ts`, `py`, `sh` work too. */
  language?: CodeLanguage | string;
  /** File name shown in the header (e.g. `calibration.gcode`). */
  filename?: string;
  showLineNumbers?: boolean;
  /** 1-based line numbers to emphasise. */
  highlightLines?: number[];
  /** Initial soft-wrap state; the header toggle flips it. */
  wrap?: boolean;
  /** Token expression capping the height before scrolling, e.g. `calc(var(--space-24) * 3)`. */
  maxHeight?: string;
  showCopy?: boolean;
  showWrapToggle?: boolean;
  /** Hide the header bar entirely (copy moves to a floating button). */
  showHeader?: boolean;
  /** Accessible name of the region. Defaults to the file name or language. */
  label?: string;
};

/** Read-only syntax-highlighted code with line numbers, highlighted lines, copy and wrap controls. */
export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
  {
    code,
    language = 'text',
    filename,
    showLineNumbers = true,
    highlightLines,
    wrap: wrapProp = false,
    maxHeight,
    showCopy = true,
    showWrapToggle = true,
    showHeader = true,
    label,
    className,
    style,
    ...rest
  },
  ref,
) {
  const lang = resolveLanguage(language);
  const source = code.replace(/\n$/, '');
  const lines = useMemo(() => tokenize(source, lang), [source, lang]);
  const highlighted = useMemo(() => new Set(highlightLines ?? []), [highlightLines]);
  const [wrap, setWrap] = useState(wrapProp);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();

  useEffect(() => setWrap(wrapProp), [wrapProp]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => setCopied(false), [source]);

  const onCopy = async () => {
    const ok = await copyText(source);
    if (!ok) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), readDurationToken('--motion-duration-slow') * 6);
  };

  const langLabel = LANGUAGE_LABELS[lang];
  const regionLabel = label ?? (filename ? `${filename} (${langLabel})` : `${langLabel} code`);

  const copyButton = showCopy && (
    <IconButton
      label={copied ? 'Copied' : 'Copy code'}
      icon={copied ? <CheckIcon strokeWidth={2.2} /> : <CopyIcon strokeWidth={1.8} />}
      size="sm"
      variant={showHeader ? 'ghost' : 'outline'}
      onClick={onCopy}
      className={cx(copied && s.copied, !showHeader && s.floatingCopy)}
    />
  );

  return (
    <div
      ref={ref}
      role="region"
      aria-label={regionLabel}
      className={cx(s.root, className)}
      style={{ ...style, ...(maxHeight ? ({ '--cb-max-h': maxHeight } as CSSProperties) : null) }}
      {...rest}
    >
      {showHeader && (
        <div className={s.header}>
          {filename ? (
            <span className={s.filename}>
              <FileCode2Icon strokeWidth={1.8} aria-hidden />
              <span className={s.filenameText}>{filename}</span>
            </span>
          ) : null}
          <span className={s.lang}>{langLabel}</span>
          <span className={s.spacer} />
          {showWrapToggle && (
            <IconButton
              label="Wrap long lines"
              icon={<WrapTextIcon strokeWidth={1.8} />}
              size="sm"
              pressed={wrap}
              onClick={() => setWrap((w) => !w)}
            />
          )}
          {copyButton}
        </div>
      )}
      <div className={s.body}>
        {!showHeader && copyButton}
        <div className={cx(s.scroller, maxHeight && s.capped)} tabIndex={0} aria-label={`${regionLabel}, ${lines.length} ${lines.length === 1 ? 'line' : 'lines'}`}>
          <pre className={cx(s.pre, wrap && s.wrap, showLineNumbers && s.numbered)}>
            <code className={s.code}>
              {lines.map((tokens, i) => (
                <span key={i} className={cx(s.line, highlighted.has(i + 1) && s.highlighted)} data-line={i + 1}>
                  {showLineNumbers && (
                    <span className={s.number} aria-hidden>
                      {i + 1}
                    </span>
                  )}
                  <span className={s.content}>
                    <HighlightedLine tokens={tokens} />
                    {i < lines.length - 1 ? '\n' : null}
                  </span>
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
      <span className={s.srOnly} role="status" aria-live="polite">
        {copied ? 'Code copied to clipboard' : ''}
      </span>
    </div>
  );
});
