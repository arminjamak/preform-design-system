# Contributing a component

Read this before adding anything. Every rule here is enforced by `npm run check` or by review.

## Where things go

```
src/components/<Name>/<Name>.tsx          component (named export, no default export)
src/components/<Name>/<Name>.module.css   styles (CSS Modules, camelCase class access)
src/stories/<Name>.stories.tsx            Storybook stories (CSF3)
```

`src/components/index.ts` is the barrel. Do not edit it from a parallel task; the integrator adds exports.

## Styling rules (enforced by `npm run lint:tokens`)

- **Only tokens.** Every colour, length, radius, shadow, font, duration and z-index is a `var(--…)` from `src/tokens/tokens.css`. No hex, rgb, px, rem, ms, em anywhere in component CSS or TSX, except `0` and unitless numbers (`flex: 1`, `line-height: 1`, `opacity` via `var(--opacity-*)`).
- Need a value that has no token? Use `calc()` on existing tokens (`calc(var(--space-2) * 3)`). Do **not** add tokens from a parallel task; note the need in your report.
- Status text on a tinted wash or surface: `--color-status-{success,warning,danger,info}-fg` (readable in both themes). Code colouring: `--color-syntax-{keyword,string,number,comment,function,type,property,punctuation}`. Visually hidden text: the global `.pf-sr-only` class.
- Prefer **semantic** tokens (`--color-bg-*`, `--color-fg-*`, `--color-border-*`, `--color-status-*`, `--color-chart-*`, `--elevation-*`, `--typography-*`) over primitives (`--color-blue-600`). Primitives are allowed only for an intentional accent (e.g. `--color-blue-800` for a pressed primary).
- Text: use the composite font shorthand, e.g.
  `font: var(--typography-body-sm-weight) var(--typography-body-sm-size) / var(--typography-body-sm-line-height) var(--typography-body-sm-family);`
  Styles: display, heading, title, title-sm, body-strong, body, body-sm, label, label-sm, caption, mono.
- Interaction states use the forced-state pattern so the sandbox can render them without a pointer:
  `.x:is(:hover, [data-state~='hover'])`, `.x:is(:focus-visible, [data-state~='focus'])`, `.x:is(:active, [data-state~='active'])`.
  Focus ring: `outline: var(--component-focus-ring-width) solid var(--color-focus-ring); outline-offset: var(--component-focus-ring-offset);`
- Motion: `transition: <prop> var(--motion-duration-fast) var(--motion-easing-standard)`. Overlays enter with `var(--motion-duration-base)`.
- Sizes on the 4pt grid: control heights `--size-control-xs|sm|md|lg|xl` (20/24/28/32/40), icons `--size-icon-xs|sm|md|lg` (12/16/20/24), spacing `--space-1…--space-24`, hairlines `--space-px`, `--space-half`.
- Layers: `--z-index-dropdown|modal|popover|toast`. Overlay scrim: `--color-bg-overlay`.
- Both themes must work. Never pick a colour that only reads on light; use semantic tokens and check with the Theme toolbar set to dark.

## Component rules

- TypeScript, React 18, function components, named export `export function Name(props: NameProps)` (or `forwardRef` when a DOM ref is useful). Export the props type.
- Props: `className?: string` on the root; spread `...rest` DOM attributes on the root where sensible; accept `data-state` via `WithForcedState` from `src/lib/types.ts` for interactive roots.
- Use `cx` from `src/lib/cx.ts` to join classes. Icons come from `lucide-react` (already a dependency). No other new dependencies.
- Accessibility: proper roles, `aria-*`, keyboard support (Escape closes overlays, arrow keys in lists/menus/radios), visible focus, labels for icon-only controls.
- Controlled by default (`value` + `onChange`); provide an uncontrolled fallback only where the app pattern needs it.
- Reuse existing components instead of re-implementing: `Button`, `IconButton`, `Popover`, `Menu/MenuList`, `Tooltip`, `Badge`, `Avatar`, `Spinner`, `TextField`, `Select`, `Checkbox`, `Toggle`, `Card`, `Divider`. Import them by relative path (`../Button/Button`), not from the barrel.
- Match the PreForm look: compact (24px default control height, 12px/13px text), white surfaces on a grey panel, pill primary buttons, blue accent, 4–8px radii, soft ink shadows. Study `Button`, `Card`, `PanelShell`, `Menu` and `TextField` before writing.

## Story rules

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Name } from '../components/Name/Name';

const meta = {
  title: 'Components/<Category>/<Name>',   // Actions · Inputs · Navigation · Feedback · Layout · Data Display · Overlays · Media · Charts · Collaboration · Interaction · Specialized
  component: Name,
  tags: ['expanded'],                       // REQUIRED for every new component (the sidebar switcher filters on it)
  args: { /* realistic PreForm content, callbacks as fn() */ },
  argTypes: { /* select/inline-radio controls for every enum prop; 'data-state' forced-state control for interactive roots */ },
  parameters: { docs: { description: { component: 'One or two sentences: what it is, where PreForm uses it, which tokens drive it.' } } },
} satisfies Meta<typeof Name>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};          // first story, every prop controllable
export const Variants: Story = { … };         // one story per meaningful axis (variants, sizes, tones)
export const States: Story = { … };           // use StateMatrix from './helpers/StateMatrix' for interactive components
```

- Controlled components: use `useArgs` from `storybook/preview-api` in `render` so the Playground is interactive (see `Toggle.stories.tsx`).
- Content must be real PreForm 3D-printing content (models, supports, materials, printers, layer heights, job queue), never lorem ipsum.
- Helper classes available in stories: `sb-row`, `sb-stack`, `sb-panel-demo`, `sb-matrix`, and the `pf-text-*` text styles.

## Before you hand off

```
npm run tokens        # only if you were told to touch tokens
npm run lint:tokens   # must pass: no raw values
npx tsc --noEmit -p tsconfig.json   # no errors in YOUR files (others may be mid-work)
```
Report: files created, props summary per component, anything you could not do and why, and any token you wished existed.
