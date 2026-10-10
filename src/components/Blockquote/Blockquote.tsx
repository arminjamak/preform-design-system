import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { QuoteIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import s from './Blockquote.module.css';

export type BlockquoteProps = Omit<HTMLAttributes<HTMLElement>, 'cite'> & {
  children: ReactNode;
  /** Who said it, e.g. "Dana Whitfield, Dental lab manager". */
  citation?: ReactNode;
  /** Where it was said: a document or article title. Rendered in <cite>. */
  source?: ReactNode;
  /** URL of the source. Becomes the blockquote's `cite` attribute and links the source label. */
  sourceHref?: string;
  /** `default`: accent left rule, body text. `pull`: larger, centred pull quote. */
  variant?: 'default' | 'pull';
};

/** Quotation with an accent rule and an optional attribution line (person, source title, link). */
export const Blockquote = forwardRef<HTMLElement, BlockquoteProps>(function Blockquote(
  { children, citation, source, sourceHref, variant = 'default', className, ...rest },
  ref,
) {
  const hasCaption = citation != null || source != null || sourceHref != null;
  const sourceNode =
    source != null || sourceHref ? (
      <cite className={s.source}>
        {sourceHref ? (
          <a href={sourceHref} className={s.link} target="_blank" rel="noopener noreferrer">
            {source ?? sourceHref}
          </a>
        ) : (
          source
        )}
      </cite>
    ) : null;

  return (
    <figure ref={ref} className={cx(s.figure, s[variant], className)} {...rest}>
      {variant === 'pull' && <QuoteIcon className={s.mark} strokeWidth={1.6} aria-hidden />}
      <blockquote className={s.quote} cite={sourceHref}>
        {children}
      </blockquote>
      {hasCaption && (
        <figcaption className={s.caption}>
          {citation != null && <span className={s.citation}>{citation}</span>}
          {citation != null && sourceNode && <span aria-hidden>, </span>}
          {sourceNode}
        </figcaption>
      )}
    </figure>
  );
});
