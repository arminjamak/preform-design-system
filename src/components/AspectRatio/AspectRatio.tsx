import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import type { StyleWithVars } from '../Stack/space';
import s from './AspectRatio.module.css';

export type AspectRatioFit = 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';

export type AspectRatioProps = HTMLAttributes<HTMLDivElement> & {
  /** Width ÷ height, e.g. `16 / 9`, `4 / 3`, `1`. Default `16 / 9`. */
  ratio?: number;
  /** `object-fit` for an img, video, canvas or iframe child. Default `cover`. */
  fit?: AspectRatioFit;
  /** Corner radius token. Default `md`. */
  radius?: 'none' | 'sm' | 'md' | 'lg';
  /** Draw a subtle inner hairline (thumbnails on white surfaces). */
  bordered?: boolean;
};

/** Box that keeps a fixed width-to-height ratio and fills it with its child: model thumbnails, print previews, camera feeds. */
export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
  { ratio = 16 / 9, fit = 'cover', radius = 'md', bordered, className, style, ...rest },
  ref,
) {
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  const vars: StyleWithVars = { '--aspect-ratio': safeRatio, '--aspect-fit': fit, ...style };
  return <div ref={ref} className={cx(s.root, s[radius], bordered && s.bordered, className)} style={vars} {...rest} />;
});
