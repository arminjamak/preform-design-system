import { Fragment, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './Kbd.module.css';

export type KbdPlatform = 'mac' | 'pc';

type KeyDef = { mac: string; pc: string; macSpoken: string; pcSpoken: string; rank?: { mac: number; pc: number } };

/** Named keys. `mod` is the primary modifier: ⌘ on macOS, Ctrl elsewhere. */
const KEYS: Record<string, KeyDef> = {
  mod: { mac: '⌘', pc: 'Ctrl', macSpoken: 'Command', pcSpoken: 'Control', rank: { mac: 4, pc: 1 } },
  cmd: { mac: '⌘', pc: 'Win', macSpoken: 'Command', pcSpoken: 'Windows', rank: { mac: 4, pc: 4 } },
  meta: { mac: '⌘', pc: 'Win', macSpoken: 'Command', pcSpoken: 'Windows', rank: { mac: 4, pc: 4 } },
  ctrl: { mac: '⌃', pc: 'Ctrl', macSpoken: 'Control', pcSpoken: 'Control', rank: { mac: 1, pc: 1 } },
  control: { mac: '⌃', pc: 'Ctrl', macSpoken: 'Control', pcSpoken: 'Control', rank: { mac: 1, pc: 1 } },
  alt: { mac: '⌥', pc: 'Alt', macSpoken: 'Option', pcSpoken: 'Alt', rank: { mac: 2, pc: 2 } },
  option: { mac: '⌥', pc: 'Alt', macSpoken: 'Option', pcSpoken: 'Alt', rank: { mac: 2, pc: 2 } },
  shift: { mac: '⇧', pc: 'Shift', macSpoken: 'Shift', pcSpoken: 'Shift', rank: { mac: 3, pc: 3 } },
  enter: { mac: '↩', pc: 'Enter', macSpoken: 'Return', pcSpoken: 'Enter' },
  return: { mac: '↩', pc: 'Enter', macSpoken: 'Return', pcSpoken: 'Enter' },
  esc: { mac: 'Esc', pc: 'Esc', macSpoken: 'Escape', pcSpoken: 'Escape' },
  escape: { mac: 'Esc', pc: 'Esc', macSpoken: 'Escape', pcSpoken: 'Escape' },
  backspace: { mac: '⌫', pc: 'Backspace', macSpoken: 'Delete', pcSpoken: 'Backspace' },
  delete: { mac: '⌫', pc: 'Del', macSpoken: 'Delete', pcSpoken: 'Delete' },
  del: { mac: '⌫', pc: 'Del', macSpoken: 'Delete', pcSpoken: 'Delete' },
  tab: { mac: '⇥', pc: 'Tab', macSpoken: 'Tab', pcSpoken: 'Tab' },
  space: { mac: 'Space', pc: 'Space', macSpoken: 'Space', pcSpoken: 'Space' },
  up: { mac: '↑', pc: '↑', macSpoken: 'Up arrow', pcSpoken: 'Up arrow' },
  down: { mac: '↓', pc: '↓', macSpoken: 'Down arrow', pcSpoken: 'Down arrow' },
  left: { mac: '←', pc: '←', macSpoken: 'Left arrow', pcSpoken: 'Left arrow' },
  right: { mac: '→', pc: '→', macSpoken: 'Right arrow', pcSpoken: 'Right arrow' },
  arrowup: { mac: '↑', pc: '↑', macSpoken: 'Up arrow', pcSpoken: 'Up arrow' },
  arrowdown: { mac: '↓', pc: '↓', macSpoken: 'Down arrow', pcSpoken: 'Down arrow' },
  arrowleft: { mac: '←', pc: '←', macSpoken: 'Left arrow', pcSpoken: 'Left arrow' },
  arrowright: { mac: '→', pc: '→', macSpoken: 'Right arrow', pcSpoken: 'Right arrow' },
};

/** Best guess at the viewer's platform; falls back to `pc` outside the browser. */
export function detectKbdPlatform(): KbdPlatform {
  if (typeof navigator === 'undefined') return 'pc';
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const hint = nav.userAgentData?.platform || nav.platform || nav.userAgent;
  return /mac|iphone|ipad|ipod/i.test(hint) ? 'mac' : 'pc';
}

const resolvePlatform = (p: KbdPlatform | 'auto' | undefined): KbdPlatform => (p && p !== 'auto' ? p : detectKbdPlatform());

type ResolvedKey = { glyph: string; spoken: string; rank: number };

/** Splits "mod+shift+z" (or ['mod','shift','z']) into display caps, ordered the way each platform prints modifiers. */
function resolveKeys(keys: string | string[], platform: KbdPlatform): ResolvedKey[] {
  const tokens = (Array.isArray(keys) ? keys : keys.split(/\s*\+\s*(?=.)/)).map((k) => k.trim()).filter(Boolean);
  return tokens
    .map((token, i): ResolvedKey & { i: number } => {
      const def = KEYS[token.toLowerCase()];
      if (def) return { glyph: def[platform], spoken: platform === 'mac' ? def.macSpoken : def.pcSpoken, rank: def.rank ? def.rank[platform] : 10, i };
      const glyph = token.length === 1 ? token.toUpperCase() : token[0].toUpperCase() + token.slice(1);
      return { glyph, spoken: glyph, rank: 10, i };
    })
    .sort((a, b) => a.rank - b.rank || a.i - b.i);
}

/** Plain-text shortcut for places that only take a string (Menu `shortcut`, `title`): "⇧⌘Z" on macOS, "Ctrl+Shift+Z" elsewhere. */
export function formatShortcut(keys: string | string[], platform: KbdPlatform | 'auto' = 'auto'): string {
  const p = resolvePlatform(platform);
  return resolveKeys(keys, p)
    .map((k) => k.glyph)
    .join(p === 'mac' ? '' : '+');
}

/** Spoken form for `aria-label`s and announcements: "Command Shift Z". */
export function speakShortcut(keys: string | string[], platform: KbdPlatform | 'auto' = 'auto'): string {
  return resolveKeys(keys, resolvePlatform(platform))
    .map((k) => k.spoken)
    .join(' ');
}

/** Value for `aria-keyshortcuts` ("Meta+Shift+Z" / "Control+Shift+Z"). */
export function ariaKeyshortcuts(keys: string | string[], platform: KbdPlatform | 'auto' = 'auto'): string {
  const p = resolvePlatform(platform);
  const tokens = (Array.isArray(keys) ? keys : keys.split('+')).map((k) => k.trim().toLowerCase());
  const map: Record<string, string> = { mod: p === 'mac' ? 'Meta' : 'Control', cmd: 'Meta', meta: 'Meta', ctrl: 'Control', control: 'Control', alt: 'Alt', option: 'Alt', shift: 'Shift', enter: 'Enter', esc: 'Escape', escape: 'Escape', del: 'Delete', delete: 'Delete', space: 'Space' };
  return tokens.map((t) => map[t] ?? (t.length === 1 ? t.toUpperCase() : t)).join('+');
}

export type KbdProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  /** One combo: "mod+shift+z" or ['mod', 'shift', 'z']. `mod` is ⌘ on macOS and Ctrl elsewhere. */
  keys: string | string[];
  /** `auto` reads the viewer's platform. */
  platform?: KbdPlatform | 'auto';
  size?: 'xs' | 'sm' | 'md';
  /** `outline` for body text and panels, `subtle` inside menus, `inverse` on tooltips and the dark nav. */
  variant?: 'outline' | 'subtle' | 'inverse';
  /** Print "+" between caps. Defaults to on for Windows/Linux and off for macOS. */
  separator?: boolean;
};

/** Keyboard shortcut rendered as key caps, with platform-aware modifier names and a spoken label for screen readers. */
export function Kbd({ keys, platform = 'auto', size = 'sm', variant = 'outline', separator, className, ...rest }: KbdProps) {
  const p = resolvePlatform(platform);
  const caps = useMemo(() => resolveKeys(keys, p), [keys, p]);
  const showPlus = separator ?? p === 'pc';
  return (
    <kbd className={cx(s.kbd, s[size], s[variant], className)} {...rest}>
      <span className={s.srOnly}>{caps.map((c) => c.spoken).join(' ')}</span>
      {caps.map((c, i) => (
        <Fragment key={`${c.glyph}-${i}`}>
          {i > 0 && showPlus && (
            <span className={s.plus} aria-hidden="true">
              +
            </span>
          )}
          <kbd className={s.cap} aria-hidden="true">
            {c.glyph}
          </kbd>
        </Fragment>
      ))}
    </kbd>
  );
}

export type ShortcutListItem = {
  /** What the shortcut does: "Generate supports". */
  action: ReactNode;
  /** One combo, or several alternatives rendered with "or" between them. */
  shortcut: string | string[];
  description?: ReactNode;
  /** Optional section heading; consecutive items with the same group share it. */
  group?: string;
};

export type ShortcutListProps = {
  items: ShortcutListItem[];
  title?: ReactNode;
  platform?: KbdPlatform | 'auto';
  size?: KbdProps['size'];
  variant?: KbdProps['variant'];
  className?: string;
};

/** Two-column list of action → keys, used in the Keyboard Shortcuts dialog and help popovers. */
export function ShortcutList({ items, title, platform = 'auto', size = 'sm', variant = 'outline', className }: ShortcutListProps) {
  const sections: Array<{ group?: string; items: ShortcutListItem[] }> = [];
  for (const item of items) {
    const last = sections[sections.length - 1];
    if (last && last.group === item.group) last.items.push(item);
    else sections.push({ group: item.group, items: [item] });
  }
  return (
    <div className={cx(s.list, className)}>
      {title && <p className={s.title}>{title}</p>}
      {sections.map((sec, si) => (
        <section key={`${sec.group ?? 'all'}-${si}`} className={s.section} aria-label={sec.group}>
          {sec.group && <p className={s.groupTitle} aria-hidden="true">{sec.group}</p>}
          <dl className={s.rows}>
            {sec.items.map((item, i) => {
              const combos = Array.isArray(item.shortcut) ? item.shortcut : [item.shortcut];
              return (
                <div key={i} className={s.row}>
                  <dt className={s.action}>
                    {item.action}
                    {item.description && <span className={s.description}>{item.description}</span>}
                  </dt>
                  <dd className={s.keys}>
                    {combos.map((combo, ci) => (
                      <Fragment key={combo}>
                        {ci > 0 && <span className={s.or}>or</span>}
                        <Kbd keys={combo} platform={platform} size={size} variant={variant} />
                      </Fragment>
                    ))}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
