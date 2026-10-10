# PreForm Design System

Token-first component library and Storybook sandbox distilled from the UI of
[arminjamak/PreForm-3D-Printing-Interface](https://github.com/arminjamak/PreForm-3D-Printing-Interface).

```
preform-design-system/
├── tokens/
│   ├── src/primitives.json       # raw palette, 4pt spacing, sizes, radii, shadows, motion (DTCG format)
│   ├── src/semantic.light.json   # purpose-named aliases → primitives
│   ├── src/semantic.dark.json    # dark-theme overrides of the same names
│   ├── src/component.json        # component-scoped aliases
│   └── build.mjs                 # Style Dictionary 4 → CSS vars, TS refs, metadata
├── src/
│   ├── tokens/                   # generated: tokens.css, tokens.dark.css, tokens.ts, *.meta.json
│   ├── styles/base.css           # reset + .pf-text-* text-style classes
│   ├── components/<Name>/        # <Name>.tsx + <Name>.module.css (var(--…) only)
│   ├── stories/                  # Storybook stories, foundations pages, intro
│   └── index.ts                  # library entry
├── scripts/check-no-raw-values.mjs
└── .storybook/                   # theme + surface toolbar, docs, a11y
```

## Getting started

```
git clone https://github.com/arminjamak/preform-design-system.git
cd preform-design-system
npm install
npm run dev        # Storybook at http://localhost:6006
```

Requires Node 20 or newer (`.nvmrc` pins 22). Every push to `main` also publishes the Storybook to GitHub Pages once Pages is set to deploy from GitHub Actions.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Storybook sandbox at http://localhost:6006 |
| `npm run tokens` | Rebuild `src/tokens/*` from `tokens/src/*.json` |
| `npm run lint:tokens` | Fail if a component stylesheet uses a raw colour or length |
| `npm run barrel` | Regenerate `src/components/index.ts` and fail on duplicate export names |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` | tokens + lint + typecheck |
| `npm run build` | Static Storybook → `dist/storybook` |
| `npm run build:lib` | ES module + `.d.ts` → `dist/lib` |

## Token architecture

1. **Primitives** are the only place raw values live. Colour scales (`neutral`, `blue`, `green`, `amber`, `red`, `orange`, `magenta`, `alpha`, `shadow`) are anchored on the hex values used in the app. Spacing is a 4pt scale (`space.1 = 4px` … `space.24 = 96px`) with `space.px` and `space.half` for hairlines. Sizes (`size.control.*`, `size.icon.*`, `size.layout.*`) are all multiples of 4.
2. **Semantic** tokens alias primitives by purpose: `color.bg.*`, `color.fg.*`, `color.border.*`, `color.status.*`, `color.control.*`, `typography.*`, `elevation.*`. The dark file overrides only these.
3. **Component** tokens alias semantic/primitive tokens: `component.button.height-sm → {size.control.sm}`.
4. **Components** use CSS Modules that reference `var(--…)` exclusively. `npm run lint:tokens` enforces it.

Generated output, with references preserved:

```css
:root, [data-theme="light"] {
  --color-blue-600: #0a63c9;
  --color-bg-accent: var(--color-blue-600);
  --component-button-height-sm: var(--size-control-sm);
}
[data-theme="dark"] {
  --color-bg-accent: var(--color-blue-500);
}
```

## Components

Storybook has a version switcher at the top left of the sidebar.

- **v1.0 · Current**: the 28 components distilled from the PreForm app.
- **v2.0 · Expanded**: 162 component folders covering all 200 patterns of a full UI inventory. The **Coverage** page maps each pattern to its component.

| Category | Components |
| --- | --- |
| Actions | Button, IconButton, Segmented, SplitButton, ButtonGroup, ToggleButton, Fab, CopyButton, ShareButton |
| Inputs | TextField, TextArea, SearchField, PasswordField, Email/Url/PhoneField, NumberField, Select, MultiSelect, Combobox, Checkbox, RadioGroup, Toggle, Slider, RangeSlider, CodeInput, DatePicker, DateRangePicker, TimePicker, Calendar, FileUpload, ColorPicker, FieldRow |
| Navigation | TopNav, SidebarNav, BottomNav, Tabs, Breadcrumbs, Pagination, Stepper, MegaMenu, ContextMenu, AnchorNav, BackButton, BackToTop, ToolRail |
| Feedback | Toast, Banner, Callout, Tooltip, ProgressBar, CircularProgress, Spinner, Skeleton, EmptyState, StatusBadge, NotificationBadge, Badge, ValidationMessage, ConnectionStatus, LiveRegion |
| Layout | Card, PanelShell, SectionTitle, Accordion, Stack, Grid, Container, SplitPane, ScrollArea, AspectRatio, StickyBar, Divider |
| Data display | DataTable, KeyValueList, DescriptionList, StatCard, KpiIndicator, Avatar, AvatarGroup, Chip, Rating, Timeline, TreeView, FileList, ListItem |
| Overlays | Modal, ConfirmDialog, Popover, Menu, Sheet, FullScreenDialog, CommandPalette, HoverCard, TourPopover, CookieConsent, HelpWidget |
| Media | Image, MediaThumbnail, ImageGallery, Lightbox, Carousel, VideoPlayer, AudioPlayer, ImageCropper, DocumentPreview, TranscriptViewer, CodeBlock, CodeEditor, MarkdownEditor, RichTextEditor, Blockquote, Prose |
| Charts | BarChart, LineChart, AreaChart, PieChart, ScatterChart, Heatmap, FunnelChart, WaterfallChart, GaugeChart, Sparkline, MapChart, Legend, ChartTooltip |
| Collaboration | ProfileMenu, ProfileCard, PresenceIndicator, SignInForm, RegistrationForm, SocialLoginButtons, TwoFactorPrompt, LoginModal, MentionInput, CommentThread, ReactionPicker, ChatBubble, ChatComposer, CollaboratorCursor |
| Interaction | SortableList, KanbanBoard, CalendarView, GanttChart, NodeEditor, CanvasViewport, ZoomControls, PanControl, BulkActionBar, UndoRedo, Kbd, FilterBuilder |
| Specialized | JsonViewer, JsonEditor, Terminal, LogViewer, DiffViewer, VersionHistory, SettingsPanel, PermissionMatrix, ApiKeyField, WebhookForm, PlanSelector, UsageMeter, OnboardingChecklist, FeatureFlagToggle, BreadcrumbEditor |

Every interactive component accepts `data-state="hover" | "focus" | "active"` so its states can be rendered without a pointer (see each component's **States** story). Contributor rules live in [CONTRIBUTING.md](CONTRIBUTING.md).

## Using it in an app

```tsx
import '@preform/design-system/src/styles/base.css';
import { Button, PanelShell, tokens } from '@preform/design-system';

<html data-theme="dark"> // optional; omit for light
<Button variant="primary" size="sm">Generate Supports</Button>
tokens.color.bg.accent // 'var(--color-bg-accent)'
```
