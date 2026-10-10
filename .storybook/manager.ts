import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

/*
 * Storybook manager chrome. This runs in the manager document, which cannot load the design
 * tokens, so the few colours below mirror the token values (blue.600, neutral.*) by hand.
 */
const C = {
  accent: '#0a63c9',
  accentSoft: '#dbe8f8',
  ink: '#30343a',
  muted: '#767b82',
  line: '#d6d9dd',
  panel: '#f3f4f6',
  surface: '#ffffff',
};

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'PreForm Design System',
    brandUrl: 'https://github.com/arminjamak/preform-design-system',
    colorPrimary: C.accent,
    colorSecondary: C.accent,
    appBg: C.panel,
    appContentBg: C.surface,
    appBorderColor: C.line,
    appBorderRadius: 6,
    fontBase: '"Figtree", system-ui, sans-serif',
    fontCode: '"JetBrains Mono", ui-monospace, monospace',
    textColor: C.ink,
    textMutedColor: C.muted,
    barTextColor: C.muted,
    barSelectedColor: C.accent,
    barBg: C.surface,
    inputBg: C.surface,
    inputBorder: C.line,
    inputTextColor: C.ink,
    inputBorderRadius: 4,
  }),
});

/* ------------------------------------------------------------------ */
/* Version switcher: "PreForm Design System ▾" in the sidebar header. */
/* v1.0 hides every entry tagged 'expanded'; v2.0 shows everything.    */
/* ------------------------------------------------------------------ */

type Mode = 'current' | 'expanded';
const STORAGE_KEY = 'preform-ds:version';
const VERSIONS: Record<Mode, { name: string; detail: string }> = {
  current: { name: 'v1.0 · Current', detail: 'The 28 components distilled from the PreForm app' },
  expanded: { name: 'v2.0 · Expanded', detail: 'Full library covering all 200 UI patterns' },
};

const readMode = (): Mode => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'current' ? 'current' : 'expanded';
  } catch {
    return 'expanded';
  }
};

const STYLE = `
.pf-version { position: relative; flex: 1; min-width: 0; }
.pf-version__trigger { display: flex; width: 100%; align-items: center; gap: 8px; padding: 6px 8px; margin-left: -8px; border: 0; border-radius: 6px; background: transparent; color: ${C.ink}; text-align: left; cursor: pointer; font: inherit; }
.pf-version__trigger:hover { background: rgba(27,33,41,0.05); }
.pf-version__trigger:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 1px; }
.pf-version__mark { flex: none; width: 24px; height: 24px; border-radius: 6px; background: ${C.accent}; color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 11px; letter-spacing: 0.02em; }
.pf-version__text { display: flex; flex-direction: column; min-width: 0; line-height: 1.2; }
.pf-version__title { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pf-version__sub { font-size: 11px; color: ${C.muted}; }
.pf-version__chev { margin-left: auto; flex: none; width: 10px; height: 10px; color: ${C.muted}; transition: transform 150ms cubic-bezier(0.23,1,0.32,1); }
.pf-version[data-open='true'] .pf-version__chev { transform: rotate(180deg); }
.pf-version__menu { position: absolute; z-index: 100; top: calc(100% + 4px); left: -8px; right: -40px; margin: 0; padding: 4px; list-style: none; border-radius: 8px; background: ${C.surface}; box-shadow: 0 6px 20px rgba(20,28,38,0.18), 0 0 0 1px rgba(20,28,38,0.06); }
.pf-version__opt { display: flex; gap: 8px; align-items: flex-start; padding: 8px; border-radius: 6px; cursor: pointer; outline: none; }
.pf-version__opt:hover, .pf-version__opt:focus-visible { background: ${C.panel}; }
.pf-version__opt[aria-selected='true'] { background: ${C.accentSoft}; }
.pf-version__radio { flex: none; margin-top: 2px; width: 12px; height: 12px; border-radius: 50%; border: 1px solid ${C.line}; background: ${C.surface}; }
.pf-version__opt[aria-selected='true'] .pf-version__radio { border: 4px solid ${C.accent}; }
.pf-version__optName { display: block; font-weight: 600; font-size: 13px; color: ${C.ink}; }
.pf-version__optDetail { display: block; font-size: 11px; color: ${C.muted}; margin-top: 2px; }
.sidebar-header[data-pf-version] > .pf-version + * { display: none !important; }
`;

addons.register('preform/version-switcher', (api) => {
  let mode: Mode = readMode();

  const isVisible = (tags: string[] | undefined) => mode === 'expanded' || !(tags ?? []).includes('expanded');

  const applyFilter = () => {
    api.experimental_setFilter('preform/version', (item: { tags?: string[] }) => isVisible(item.tags));
    // If the open story belongs to the other version, go to the introduction.
    const current = api.getCurrentStoryData() as { tags?: string[] } | undefined;
    if (current && !isVisible(current.tags)) api.selectStory('introduction--docs');
  };

  const setMode = (next: Mode) => {
    mode = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked: the choice lasts for this page view */
    }
    applyFilter();
    render();
  };

  let root: HTMLDivElement | null = null;

  function render() {
    if (!root) return;
    const sub = root.querySelector('.pf-version__sub');
    if (sub) sub.textContent = VERSIONS[mode].name;
    root.querySelectorAll<HTMLLIElement>('.pf-version__opt').forEach((li) => li.setAttribute('aria-selected', String(li.dataset.mode === mode)));
  }

  function build(header: Element) {
    if (!document.getElementById('pf-version-style')) {
      const style = document.createElement('style');
      style.id = 'pf-version-style';
      style.textContent = STYLE;
      document.head.appendChild(style);
    }
    root = document.createElement('div');
    root.className = 'pf-version';
    root.innerHTML = `
      <button type="button" class="pf-version__trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="Switch design system version">
        <span class="pf-version__mark" aria-hidden="true">PF</span>
        <span class="pf-version__text"><span class="pf-version__title">PreForm Design System</span><span class="pf-version__sub"></span></span>
        <svg class="pf-version__chev" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3.5 5 7.5 9 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <ul class="pf-version__menu" role="listbox" aria-label="Design system version" hidden>
        ${(Object.keys(VERSIONS) as Mode[])
          .map(
            (m) =>
              `<li class="pf-version__opt" role="option" tabindex="-1" data-mode="${m}"><span class="pf-version__radio" aria-hidden="true"></span><span><span class="pf-version__optName">${VERSIONS[m].name}</span><span class="pf-version__optDetail">${VERSIONS[m].detail}</span></span></li>`,
          )
          .join('')}
      </ul>`;

    const trigger = root.querySelector<HTMLButtonElement>('.pf-version__trigger')!;
    const menu = root.querySelector<HTMLUListElement>('.pf-version__menu')!;
    const options = Array.from(root.querySelectorAll<HTMLLIElement>('.pf-version__opt'));

    const open = (value: boolean) => {
      menu.hidden = !value;
      root!.dataset.open = String(value);
      trigger.setAttribute('aria-expanded', String(value));
      if (value) (options.find((o) => o.dataset.mode === mode) ?? options[0]).focus();
    };

    trigger.addEventListener('click', () => open(menu.hidden));
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        open(true);
      }
    });
    options.forEach((opt, i) => {
      const choose = () => {
        setMode(opt.dataset.mode as Mode);
        open(false);
        trigger.focus();
      };
      opt.addEventListener('click', choose);
      opt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          choose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          options[(i + 1) % options.length].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          options[(i - 1 + options.length) % options.length].focus();
        } else if (e.key === 'Escape' || e.key === 'Tab') {
          open(false);
          trigger.focus();
        }
      });
    });
    document.addEventListener('mousedown', (e) => {
      if (!menu.hidden && root && !root.contains(e.target as Node)) open(false);
    });

    header.setAttribute('data-pf-version', '');
    header.insertBefore(root, header.firstChild);
    render();
  }

  const mount = () => {
    const header = document.querySelector('.sidebar-header');
    if (header && !header.querySelector('.pf-version')) build(header);
  };

  applyFilter();
  new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });
  mount();
});
