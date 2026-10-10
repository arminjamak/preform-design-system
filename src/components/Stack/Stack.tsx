import { forwardRef, type ElementType, type HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { space, type SpaceValue, type StyleWithVars } from './space';
import s from './Stack.module.css';

export type StackDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type StackElement = 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav' | 'form' | 'fieldset' | 'ul' | 'ol' | 'li' | 'span';

export type StackProps = HTMLAttributes<HTMLElement> & {
  /** Main axis. Default `column`. */
  direction?: StackDirection;
  /** Space between children as a `--space-*` step (`3` → `var(--space-3)`). */
  gap?: SpaceValue;
  /** Cross-axis alignment. Default `stretch`. */
  align?: StackAlign;
  /** Main-axis distribution. Default `start`. */
  justify?: StackJustify;
  /** Let children wrap onto new lines. */
  wrap?: boolean;
  /** Render as `inline-flex` instead of `flex`. */
  inline?: boolean;
  /** Element to render. Default `div`. */
  as?: StackElement;
};

const ALIGN: Record<StackAlign, string> = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', baseline: 'baseline' };
const JUSTIFY: Record<StackJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

/** Flex layout primitive: stacks children in a row or column with a token gap. */
export const Stack = forwardRef<HTMLElement, StackProps>(function Stack(
  { direction = 'column', gap, align, justify, wrap, inline, as = 'div', className, style, ...rest },
  ref,
) {
  const Comp = as as ElementType;
  const vars: StyleWithVars = {
    '--stack-direction': direction,
    '--stack-gap': space(gap),
    '--stack-align': align && ALIGN[align],
    '--stack-justify': justify && JUSTIFY[justify],
    '--stack-wrap': wrap ? 'wrap' : undefined,
    ...style,
  };
  return <Comp ref={ref} className={cx(s.stack, inline && s.inline, className)} style={vars} {...rest} />;
});

export type SpacerProps = HTMLAttributes<HTMLDivElement> & {
  /** Fixed length along the parent's main axis as a `--space-*` step. Omit to grow and fill the free space. */
  size?: SpaceValue;
};

/** Empty flex child: grows to push siblings apart, or reserves a fixed token-sized gap. Use inside a flex parent such as `Stack`. */
export function Spacer({ size, className, style, ...rest }: SpacerProps) {
  const vars: StyleWithVars = { '--spacer-size': space(size), ...style };
  return <div aria-hidden="true" className={cx(s.spacer, size !== undefined && s.fixed, className)} style={vars} {...rest} />;
}
