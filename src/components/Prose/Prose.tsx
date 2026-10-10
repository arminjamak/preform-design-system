import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import s from './Prose.module.css';

export type ProseProps = HTMLAttributes<HTMLDivElement> & {
  /** `sm` (12px body) for panels and side sheets, `md` (13px body) for full pages. */
  size?: 'sm' | 'md';
  /** Element to render. `article` for standalone documents such as release notes. */
  as?: 'div' | 'article' | 'section';
};

/**
 * Typography wrapper for long-form HTML or rendered Markdown: headings, paragraphs, lists,
 * inline code, preformatted blocks, blockquotes, tables, rules and links. Styles are applied
 * with zero specificity so nested components (CodeBlock, Blockquote) keep their own look.
 */
export const Prose = forwardRef<HTMLDivElement, ProseProps>(function Prose({ size = 'md', as: Tag = 'div', className, ...rest }, ref) {
  return <Tag ref={ref} className={cx(s.prose, s[size], className)} {...rest} />;
});
