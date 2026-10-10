import { forwardRef, type ElementType, type HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { space, type SpaceValue, type StyleWithVars } from '../Stack/space';
import s from './Container.module.css';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'full';

export type ContainerProps = HTMLAttributes<HTMLElement> & {
  /** Max width: sm = 2 × panel (600), md = 3 × panel (900), lg = 4 × panel (1200), full = no cap. Default `md`. */
  size?: ContainerSize;
  /** Horizontal padding as a `--space-*` step. Default `4`. */
  paddingX?: SpaceValue;
  /** Vertical padding as a `--space-*` step. Default `0`. */
  paddingY?: SpaceValue;
  /** Centre the column (default) or pin it to the start edge. */
  align?: 'center' | 'start';
  /** Element to render. Default `div`. */
  as?: 'div' | 'main' | 'section' | 'article' | 'header' | 'footer';
};

/** Max-width page column with token side padding: settings pages, job history, account screens. */
export const Container = forwardRef<HTMLElement, ContainerProps>(function Container(
  { size = 'md', paddingX, paddingY, align = 'center', as = 'div', className, style, ...rest },
  ref,
) {
  const Comp = as as ElementType;
  const vars: StyleWithVars = { '--container-padding-x': space(paddingX), '--container-padding-y': space(paddingY), ...style };
  return <Comp ref={ref} className={cx(s.container, s[size], align === 'start' && s.start, className)} style={vars} {...rest} />;
});
