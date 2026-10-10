import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { DiffViewer } from '../components/DiffViewer/DiffViewer';

const standard = `# PreForm support profile
profile = "Standard — Grey V5"
printer = "Form 4"
material = "FLGPGR05"
layer_height_mm = 0.100
orientation = "auto"

[supports]
type = "auto"
density = 1.00
touchpoint_size_mm = 0.50
internal_supports = true
slope_multiplier = 1.00
height_above_raft_mm = 5.0
mini_rafts = true
mini_rafts_on_build_platform = false

[raft]
type = "full"
thickness_mm = 2.00
label = true
label_text = "STD-GRV5"
breakaway_tabs = true
z_compression_correction = "default"

[validation]
minima_check = true
cup_detection = true
min_wall_thickness_mm = 0.40
warn_on_thin_features = true

[post_processing]
wash_minutes = 10
wash_solvent = "IPA"
cure_minutes = 15
cure_temperature_c = 60
remove_supports_before_cure = false
notes = "Standard dental models and general prototypes"
`;

const lightTouch = `# PreForm support profile
profile = "Light-touch — Grey V5"
printer = "Form 4"
material = "FLGPGR05"
layer_height_mm = 0.050
orientation = "auto"

[supports]
type = "auto"
density = 0.85
touchpoint_size_mm = 0.35
internal_supports = true
slope_multiplier = 1.00
height_above_raft_mm = 5.0
mini_rafts = true
mini_rafts_on_build_platform = true

[raft]
type = "mini"
thickness_mm = 2.00
label = true
label_text = "LT-GRV5"
breakaway_tabs = true
z_compression_correction = "default"

[validation]
minima_check = true
cup_detection = true
min_wall_thickness_mm = 0.40
warn_on_thin_features = true

[post_processing]
wash_minutes = 10
wash_solvent = "IPA"
cure_minutes = 15
cure_temperature_c = 60
remove_supports_before_cure = true
notes = "Small parts where surface finish matters; snap supports off before curing"
`;

const meta = {
  title: 'Components/Specialized/DiffViewer',
  component: DiffViewer,
  tags: ['expanded'],
  args: {
    oldText: standard,
    newText: lightTouch,
    oldLabel: 'standard_grey_v5.formprofile',
    newLabel: 'light_touch_grey_v5.formprofile',
    view: 'unified',
    onViewChange: fn(),
    context: 3,
    wordDiff: true,
  },
  argTypes: {
    oldText: { control: 'text' },
    newText: { control: 'text' },
    view: { control: 'inline-radio', options: ['unified', 'split'] },
    context: { control: { type: 'range', min: 0, max: 10, step: 1 } },
    wordDiff: { control: 'boolean' },
  },
  render: function Render(args) {
    const [{ view }, update] = useArgs();
    return <DiffViewer {...args} view={view} onViewChange={(v) => update({ view: v })} />;
  },
  decorators: [(Story) => <div style={{ width: 'calc(var(--size-layout-dialog-lg) + var(--size-layout-panel))' }}><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Line diff between two texts, used to compare support profiles and print settings. Unified and split layouts, line numbers on both sides, folded unchanged runs and word-level marks. Additions and deletions use --color-status-success-soft / --color-status-danger-soft.',
      },
    },
  },
} satisfies Meta<typeof DiffViewer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Split: Story = { args: { view: 'split' } };

export const NoWordHighlight: Story = { args: { wordDiff: false } };

export const MoreContext: Story = { args: { context: 6 } };

export const Identical: Story = { args: { newText: standard, newLabel: 'standard_grey_v5 (copy).formprofile' } };
