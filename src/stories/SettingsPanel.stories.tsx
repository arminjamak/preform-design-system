import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { BellIcon, CpuIcon, PrinterIcon, RulerIcon, Settings2Icon, ShieldIcon } from 'lucide-react';
import { SettingsPanel, type SettingsSection, type SettingsValues } from '../components/SettingsPanel/SettingsPanel';

const icon = { strokeWidth: 2 };

const SECTIONS: SettingsSection[] = [
  {
    id: 'general',
    label: 'General',
    icon: <Settings2Icon {...icon} />,
    groups: [
      {
        title: 'Updates',
        settings: [
          { id: 'autoUpdate', label: 'Install updates automatically', description: 'Download PreForm updates in the background and install them on the next launch.', type: 'toggle', default: true },
          {
            id: 'updateChannel',
            label: 'Release channel',
            type: 'radio',
            default: 'stable',
            options: [
              { value: 'stable', label: 'Stable', description: 'Recommended. Releases tested with every printer firmware.' },
              { value: 'beta', label: 'Beta', description: 'Early access to new support and orientation features.' },
            ],
          },
        ],
      },
      {
        title: 'Startup',
        settings: [
          {
            id: 'language',
            label: 'Language',
            type: 'select',
            default: 'en',
            options: [
              { value: 'en', label: 'English' },
              { value: 'de', label: 'Deutsch' },
              { value: 'fr', label: 'Français' },
              { value: 'ja', label: '日本語' },
              { value: 'hu', label: 'Magyar' },
            ],
          },
          { id: 'reopenScene', label: 'Reopen last scene on launch', type: 'toggle', default: false },
        ],
      },
    ],
  },
  {
    id: 'printing',
    label: 'Printing',
    icon: <PrinterIcon {...icon} />,
    groups: [
      {
        title: 'New jobs',
        settings: [
          {
            id: 'defaultMaterial',
            label: 'Default material',
            description: 'Used when a new scene has no printer selected yet.',
            type: 'select',
            default: 'grey-v5',
            keywords: ['resin'],
            options: [
              { value: 'grey-v5', label: 'Grey V5' },
              { value: 'clear-v5', label: 'Clear V5' },
              { value: 'black-v5', label: 'Black V5' },
              { value: 'tough-2000', label: 'Tough 2000' },
              { value: 'draft-v2', label: 'Draft V2' },
            ],
          },
          {
            id: 'layerHeight',
            label: 'Default layer height',
            type: 'segmented',
            default: '0.05',
            options: [
              { value: '0.025', label: '25 µm' },
              { value: '0.05', label: '50 µm' },
              { value: '0.1', label: '100 µm' },
            ],
          },
          { id: 'autoOrient', label: 'Auto-orient on import', description: 'Run orientation as soon as a model is added to the scene.', type: 'toggle', default: true },
        ],
      },
      {
        title: 'Supports',
        settings: [
          { id: 'touchpoint', label: 'Touchpoint size', type: 'number', unit: 'mm', min: 0.3, max: 0.8, step: 0.05, default: 0.5 },
          { id: 'supportDensity', label: 'Support density', type: 'number', min: 0.5, max: 1.5, step: 0.05, default: 1 },
        ],
      },
    ],
  },
  {
    id: 'units',
    label: 'Units',
    icon: <RulerIcon {...icon} />,
    groups: [
      {
        title: 'Measurement',
        settings: [
          {
            id: 'lengthUnit',
            label: 'Length',
            description: 'Applies to dimensions, the scale tool and exported reports.',
            type: 'segmented',
            default: 'mm',
            options: [
              { value: 'mm', label: 'mm' },
              { value: 'in', label: 'in' },
            ],
          },
          {
            id: 'tempUnit',
            label: 'Temperature',
            type: 'segmented',
            default: 'c',
            options: [
              { value: 'c', label: '°C' },
              { value: 'f', label: '°F' },
            ],
          },
          {
            id: 'volumeUnit',
            label: 'Resin volume',
            type: 'select',
            default: 'ml',
            options: [
              { value: 'ml', label: 'Millilitres (mL)' },
              { value: 'l', label: 'Litres (L)' },
              { value: 'floz', label: 'Fluid ounces (fl oz)' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <BellIcon {...icon} />,
    groups: [
      {
        title: 'Desktop alerts',
        settings: [
          { id: 'notifyFinished', label: 'Print finished', type: 'toggle', default: true },
          { id: 'notifyFailed', label: 'Print failed or paused', description: 'Includes resin tank and cartridge errors reported by the printer.', type: 'toggle', default: true },
          { id: 'tankThreshold', label: 'Low resin warning', description: 'Warn when the cartridge drops below this level.', type: 'number', unit: '%', min: 5, max: 50, step: 5, default: 10 },
        ],
      },
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: <ShieldIcon {...icon} />,
    groups: [
      {
        title: 'Data sharing',
        settings: [
          {
            id: 'telemetry',
            label: 'Share anonymous usage data',
            description: 'Helps Formlabs improve PreForm. Never includes model geometry or file names.',
            type: 'toggle',
            default: true,
            keywords: ['telemetry', 'analytics'],
          },
          { id: 'crashReports', label: 'Send crash reports', type: 'toggle', default: true },
          { id: 'uploadThumbnails', label: 'Show print thumbnails in Dashboard', type: 'toggle', default: false },
        ],
      },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: <CpuIcon {...icon} />,
    groups: [
      {
        title: 'Local API',
        settings: [
          { id: 'localApi', label: 'Enable PreForm Local API', description: 'Lets scripts on this computer prepare and send jobs over HTTP.', type: 'toggle', default: false, keywords: ['server', 'automation'] },
          { id: 'apiPort', label: 'Port', type: 'number', min: 1024, max: 65535, step: 1, default: 44388 },
        ],
      },
      {
        title: 'Performance',
        settings: [
          {
            id: 'renderer',
            label: 'Renderer',
            type: 'radio',
            default: 'gpu',
            options: [
              { value: 'gpu', label: 'Hardware accelerated', description: 'Uses the graphics card. Fastest for large scenes.' },
              { value: 'cpu', label: 'Software', description: 'Use if the 3D view flickers or shows artefacts.' },
            ],
          },
          { id: 'undoSteps', label: 'Undo history', type: 'number', unit: 'steps', min: 10, max: 200, step: 10, default: 50 },
        ],
      },
    ],
  },
];

const defaults = (): SettingsValues => {
  const out: SettingsValues = {};
  for (const sec of SECTIONS) for (const g of sec.groups) for (const st of g.settings) if (st.default !== undefined) out[st.id] = st.default;
  return out;
};

const SAVED: SettingsValues = { ...defaults(), defaultMaterial: 'tough-2000', lengthUnit: 'in', telemetry: false, localApi: true };

const meta = {
  title: 'Components/Specialized/SettingsPanel',
  component: SettingsPanel,
  tags: ['expanded'],
  args: {
    sections: SECTIONS,
    value: SAVED,
    onChange: fn(),
    onSave: fn(),
    onReset: fn(),
    onSectionChange: fn(),
    activeSection: undefined,
    saving: false,
  },
  argTypes: {
    sections: { control: 'object' },
    value: { control: 'object' },
    activeSection: { control: 'select', options: [undefined, ...SECTIONS.map((s) => s.id)] },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'PreForm preferences window driven by a schema of sections → groups → settings (toggle, select, segmented, number, radio). The left list filters to matching settings as you search; each group is a SectionTitle over FieldRows with descriptions. Edits are held as a draft: changed rows get an accent edge and a Save bar (`--color-bg-subtle`) appears only while there are unsaved changes. “Reset to defaults” restores the visible section.',
      },
    },
  },
  render: function Render(args) {
    const [, update] = useArgs();
    return (
      <SettingsPanel
        {...args}
        onSave={(draft) => {
          args.onSave(draft);
          update({ saving: true });
          window.setTimeout(() => update({ saving: false, value: draft }), 800);
        }}
        onSectionChange={(sectionId) => {
          args.onSectionChange?.(sectionId);
          if (args.activeSection !== undefined) update({ activeSection: sectionId });
        }}
      />
    );
  },
} satisfies Meta<typeof SettingsPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Printing: Story = { name: 'Printing section', args: { activeSection: 'printing' } };

export const Advanced: Story = { name: 'Advanced (radio + number)', args: { activeSection: 'advanced' } };

export const UnsavedChanges: Story = {
  name: 'Dirty (unsaved changes)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('switch', { name: 'Install updates automatically' }));
    await userEvent.click(canvas.getByRole('radio', { name: 'Beta' }));
  },
};

export const Saving: Story = {
  name: 'Loading (saving)',
  render: function Render(args) {
    const [, update] = useArgs();
    return <SettingsPanel {...args} onSave={(draft) => (args.onSave(draft), update({ saving: true }))} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('switch', { name: 'Reopen last scene on launch' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save changes' }));
  },
};

export const Search: Story = {
  name: 'Search (“resin”)',
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('searchbox', { name: 'Search settings' }), 'resin');
  },
};

export const Defaults: Story = { name: 'All defaults (reset disabled)', args: { value: defaults() } };
