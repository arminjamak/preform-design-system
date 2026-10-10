import { useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton/IconButton';
import s from './DescriptionList.module.css';

export type DescriptionItem = {
  label: string;
  value: ReactNode;
  /** Text placed on the clipboard. Defaults to `value` when it is a string or number. */
  copyValue?: string;
  /** Per-item override of the list-level `copyable`. */
  copyable?: boolean;
  /** Leading icon beside the label. */
  icon?: ReactNode;
};

export type DescriptionListProps = Omit<HTMLAttributes<HTMLDListElement>, 'children'> & {
  items: DescriptionItem[];
  /** `inline`: label and value side by side. `stacked`: label above value, optionally in columns. */
  layout?: 'inline' | 'stacked';
  /** Hairline between rows. */
  divided?: boolean;
  /** Adds a copy button to every item with copyable text (serial numbers, job IDs, file paths). */
  copyable?: boolean;
  /** Stacked layout only: number of grid columns. */
  columns?: 1 | 2 | 3;
  /** Called after a value is copied. */
  onCopy?: (label: string, text: string) => void;
};

const textOf = (item: DescriptionItem) => item.copyValue ?? (typeof item.value === 'string' || typeof item.value === 'number' ? String(item.value) : undefined);

/**
 * Readable label/value pairs for detail pages and dialogs: printer info, job summary, material lot.
 * For the dense 20px rows inside side panels use `KeyValueList`.
 */
export function DescriptionList({ items, layout = 'inline', divided, copyable, columns = 1, onCopy, className, style, ...rest }: DescriptionListProps) {
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (i: number, item: DescriptionItem, text: string) => {
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* clipboard unavailable (insecure context); still confirm visually so the UI is predictable */
    }
    setCopied(i);
    onCopy?.(item.label, text);
  };

  return (
    <dl
      className={cx(s.list, s[layout], divided && s.divided, className)}
      style={layout === 'stacked' ? ({ '--dl-columns': columns, ...style } as CSSProperties) : style}
      {...rest}
    >
      {items.map((item, i) => {
        const text = textOf(item);
        const canCopy = (item.copyable ?? copyable) && text !== undefined;
        return (
          <div key={`${item.label}-${i}`} className={s.row} onMouseLeave={copied === i ? () => setCopied(null) : undefined}>
            <dt className={s.label}>
              {item.icon && (
                <span className={s.icon} aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </dt>
            <dd className={s.value}>
              <span className={s.valueText}>{item.value}</span>
              {canCopy && (
                <IconButton
                  size="xs"
                  variant="ghost"
                  className={cx(s.copy, copied === i && s.copied)}
                  label={copied === i ? `${item.label} copied` : `Copy ${item.label}`}
                  icon={copied === i ? <CheckIcon strokeWidth={2.6} /> : <CopyIcon strokeWidth={2.2} />}
                  onClick={() => copy(i, item, text)}
                  onBlur={() => setCopied((c) => (c === i ? null : c))}
                />
              )}
              {canCopy && (
                <span className={s.srOnly} aria-live="polite">
                  {copied === i ? `${item.label} copied to clipboard` : ''}
                </span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
