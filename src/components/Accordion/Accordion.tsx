import { createContext, forwardRef, useContext, useId, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { WithForcedState } from '../../lib/types';
import s from './Accordion.module.css';

export type AccordionVariant = 'plain' | 'bordered' | 'panel';
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

const FRAME: Record<AccordionVariant, string | undefined> = { plain: undefined, bordered: s.frameBordered, panel: s.framePanel };

type AccordionContextValue = {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
  variant: AccordionVariant;
  headingLevel: AccordionHeadingLevel;
};
const AccordionContext = createContext<AccordionContextValue | null>(null);

/* ------------------------------------------------------------------ */
/* Shared section: header button + animated region                     */
/* ------------------------------------------------------------------ */

type SectionOwnProps = WithForcedState & {
  /** Header label. */
  title: ReactNode;
  /** Trailing summary shown before the caret, e.g. `0.14 mL` or a Badge. */
  meta?: ReactNode;
  /** Leading 12px icon. */
  icon?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
};

type SectionProps = SectionOwnProps & {
  open: boolean;
  onToggle: () => void;
  variant: AccordionVariant;
  headingLevel: AccordionHeadingLevel;
  inGroup: boolean;
  rest: Omit<HTMLAttributes<HTMLDivElement>, 'title'>;
};

function Caret({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 8 5" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M0 0 H8 L4 5 Z" />
    </svg>
  );
}

function Section({ title, meta, icon, disabled, children, className, open, onToggle, variant, headingLevel, inGroup, rest, 'data-state': dataState }: SectionProps) {
  const id = useId();
  const triggerId = `${id}-trigger`;
  const regionId = `${id}-region`;
  const Heading = `h${headingLevel}` as const;
  return (
    <div className={cx(s.item, s[variant], open && s.open, className)} data-open={open || undefined} {...rest}>
      <Heading className={s.heading}>
        <button
          type="button"
          id={triggerId}
          className={s.trigger}
          aria-expanded={open}
          aria-controls={regionId}
          disabled={disabled}
          data-state={dataState}
          data-accordion-trigger={inGroup ? '' : undefined}
          onClick={onToggle}
        >
          {icon && <span className={s.icon}>{icon}</span>}
          <span className={s.title}>{title}</span>
          {meta !== undefined && meta !== null && <span className={s.meta}>{meta}</span>}
          <Caret className={s.caret} />
        </button>
      </Heading>
      <div id={regionId} role="region" aria-labelledby={triggerId} className={s.region}>
        <div className={s.clip}>
          <div className={s.content}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Accordion                                                           */
/* ------------------------------------------------------------------ */

export type AccordionProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> & {
  /** `single` keeps at most one item open; `multiple` lets any number open. Default `multiple`. */
  type?: 'single' | 'multiple';
  /** Open item values (controlled). */
  value?: string[];
  /** Initially open item values (uncontrolled). */
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** In `single` mode, allow closing the open item so none are open. Default `true`. */
  collapsible?: boolean;
  /** plain = bare rows; bordered = framed list; panel = PreForm sidebar sections with 28px bold headers. Default `panel`. */
  variant?: AccordionVariant;
  /** Heading element wrapping each header button. Default `3`. */
  headingLevel?: AccordionHeadingLevel;
  children: ReactNode;
};

/**
 * Stack of collapsible sections. Headers are buttons inside headings; ↑/↓ move between headers, Home/End jump to
 * the first/last. Height animates with `--motion-duration-base` and `--motion-easing-standard`.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  { type = 'multiple', value, defaultValue, onValueChange, collapsible = true, variant = 'panel', headingLevel = 3, className, onKeyDown, children, ...rest },
  ref,
) {
  const [inner, setInner] = useState<string[]>(defaultValue ?? []);
  const open = value ?? inner;

  const toggle = (item: string) => {
    const isOpen = open.includes(item);
    let next: string[];
    if (type === 'single') next = isOpen ? (collapsible ? [] : open) : [item];
    else next = isOpen ? open.filter((v) => v !== item) : [...open, item];
    if (next === open) return;
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const target = e.target as HTMLElement;
    const root = e.currentTarget;
    if (!target.hasAttribute('data-accordion-trigger') || target.closest('[data-accordion-root]') !== root) return;
    const triggers = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-accordion-trigger]')).filter(
      (b) => !b.disabled && b.closest('[data-accordion-root]') === root,
    );
    const i = triggers.indexOf(target as HTMLButtonElement);
    const n = triggers.length;
    let next: number;
    switch (e.key) {
      case 'ArrowDown': next = (i + 1) % n; break;
      case 'ArrowUp': next = (i - 1 + n) % n; break;
      case 'Home': next = 0; break;
      case 'End': next = n - 1; break;
      default: return;
    }
    e.preventDefault();
    triggers[next]?.focus();
  };

  return (
    <AccordionContext.Provider value={{ isOpen: (v) => open.includes(v), toggle, variant, headingLevel }}>
      <div ref={ref} data-accordion-root="" className={cx(s.accordion, FRAME[variant], className)} onKeyDown={handleKeyDown} {...rest}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
});

export type AccordionItemProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> &
  SectionOwnProps & {
    /** Unique key within the Accordion; listed in its `value` when open. */
    value: string;
  };

/** One section of an `Accordion`. */
export function AccordionItem({ value, title, meta, icon, disabled, children, className, 'data-state': dataState, ...rest }: AccordionItemProps) {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('AccordionItem must be rendered inside an Accordion');
  return (
    <Section
      title={title}
      meta={meta}
      icon={icon}
      disabled={disabled}
      className={className}
      data-state={dataState}
      open={ctx.isOpen(value)}
      onToggle={() => ctx.toggle(value)}
      variant={ctx.variant}
      headingLevel={ctx.headingLevel}
      inGroup
      rest={rest}
    >
      {children}
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Collapsible                                                         */
/* ------------------------------------------------------------------ */

export type CollapsibleProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> &
  SectionOwnProps & {
    /** Open state (controlled). */
    open?: boolean;
    /** Initial open state (uncontrolled). Default `false`. */
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Default `panel`. */
    variant?: AccordionVariant;
    /** Heading element wrapping the header button. Default `3`. */
    headingLevel?: AccordionHeadingLevel;
  };

/** A single standalone collapsible section (collapsible panel), styled like an Accordion item. */
export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
  { open, defaultOpen = false, onOpenChange, variant = 'panel', headingLevel = 3, title, meta, icon, disabled, children, className, 'data-state': dataState, ...rest },
  ref,
) {
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  const toggle = () => {
    if (open === undefined) setInner(!isOpen);
    onOpenChange?.(!isOpen);
  };
  return (
    <div ref={ref} className={cx(s.accordion, FRAME[variant], className)}>
      <Section
        title={title}
        meta={meta}
        icon={icon}
        disabled={disabled}
        data-state={dataState}
        open={isOpen}
        onToggle={toggle}
        variant={variant}
        headingLevel={headingLevel}
        inGroup={false}
        rest={rest}
      >
        {children}
      </Section>
    </div>
  );
});
