import type { Meta, StoryObj } from '@storybook/react-vite';
import { BoxIcon, CopyIcon, Trash2Icon } from 'lucide-react';
import { Spacer, Stack } from '../components/Stack/Stack';
import { SPACE_STEPS } from '../components/Stack/space';
import { Badge } from '../components/Badge/Badge';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';
import { IconButton } from '../components/IconButton/IconButton';

const iconStyle = { width: 'var(--size-icon-sm)', height: 'var(--size-icon-sm)' };

const models = [
  { name: 'Dental_Arch_Upper.stl', detail: '12.4 × 8.1 × 2.2 cm · 41,882 tris' },
  { name: 'Bracket_v3.form', detail: '4.0 × 2.5 × 1.8 cm · 6,120 tris' },
  { name: 'Turbine_Blade.obj', detail: '9.7 × 3.3 × 1.1 cm · 118,560 tris' },
];

const meta = {
  title: 'Components/Layout/Stack',
  component: Stack,
  tags: ['expanded'],
  args: { direction: 'column', gap: 2, align: 'stretch', justify: 'start', wrap: false, inline: false, as: 'div' },
  argTypes: {
    direction: { control: 'inline-radio', options: ['row', 'column', 'row-reverse', 'column-reverse'] },
    gap: { control: 'select', options: SPACE_STEPS },
    align: { control: 'inline-radio', options: ['start', 'center', 'end', 'stretch', 'baseline'] },
    justify: { control: 'select', options: ['start', 'center', 'end', 'between', 'around', 'evenly'] },
    as: { control: 'select', options: ['div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav', 'form', 'fieldset', 'ul', 'ol', 'li', 'span'] },
    children: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Flex layout primitive. `gap` takes a `--space-*` step (`gap={3}` → `var(--space-3)`), never pixels. `Spacer` grows to push siblings apart or reserves a fixed token gap.',
      },
    },
  },
  render: (args) => (
    <div style={{ width: 'var(--size-layout-dialog-lg)' }}>
      <Stack {...args}>
        {models.map((m) => (
          <Card key={m.name} padding="sm">
            <Stack direction="row" gap={2} align="center">
              <BoxIcon strokeWidth={2} style={iconStyle} />
              <Stack gap="half" style={{ minWidth: 0 }}>
                <span className="pf-text-body-strong">{m.name}</span>
                <span className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>{m.detail}</span>
              </Stack>
            </Stack>
          </Card>
        ))}
      </Stack>
    </div>
  ),
} satisfies Meta<typeof Stack>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Row: Story = { args: { direction: 'row', gap: 3, align: 'start', wrap: true } };

export const ToolbarWithSpacer: Story = {
  name: 'Spacer: toolbar',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ width: 'var(--size-layout-dialog-lg)', padding: 'var(--space-2)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--elevation-card)' }}>
      <Stack direction="row" align="center" gap={2}>
        <span className="pf-text-body-strong">3 models selected</span>
        <Badge tone="accent" variant="soft">Grey V5</Badge>
        <Spacer />
        <IconButton label="Duplicate" icon={<CopyIcon strokeWidth={2.2} />} size="sm" />
        <IconButton label="Delete" icon={<Trash2Icon strokeWidth={2.2} />} size="sm" />
        <Spacer size={2} />
        <Button variant="primary">Arrange</Button>
      </Stack>
    </div>
  ),
};

export const GapScale: Story = {
  name: 'Gap steps',
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={4}>
      {([1, 2, 3, 4, 6] as const).map((gap) => (
        <Stack key={gap} direction="row" align="center" gap={3}>
          <span className="pf-text-mono" style={{ width: 'var(--size-field-sm)', color: 'var(--color-fg-muted)' }}>gap={gap}</span>
          <Stack direction="row" gap={gap}>
            {['Form 4', 'Form 4B', 'Form 3+'].map((p) => (
              <Badge key={p} variant="outline">{p}</Badge>
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  ),
};

export const Justify: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={3} style={{ width: 'var(--size-layout-dialog-md)' }}>
      {(['start', 'center', 'end', 'between', 'around', 'evenly'] as const).map((justify) => (
        <Stack key={justify} gap={1}>
          <span className="pf-text-caption" style={{ color: 'var(--color-fg-muted)', textTransform: 'uppercase' }}>{justify}</span>
          <Stack direction="row" justify={justify} gap={1} style={{ padding: 'var(--space-1)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-sm)' }}>
            <Button size="sm">Clear</Button>
            <Button size="sm" variant="primary">Generate Supports</Button>
          </Stack>
        </Stack>
      ))}
    </Stack>
  ),
};
