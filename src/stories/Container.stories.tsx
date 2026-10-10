import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container } from '../components/Container/Container';
import { SPACE_STEPS } from '../components/Stack/space';
import { Card } from '../components/Card/Card';
import { KeyValueList } from '../components/KeyValueList/KeyValueList';

function JobHistory() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div>
        <h1 className="pf-text-heading">Print history</h1>
        <p className="pf-text-body-sm" style={{ color: 'var(--color-fg-muted)', margin: 'var(--space-1) 0 0' }}>Jobs sent from this workstation to Form 4 · Office over the last 30 days.</p>
      </div>
      {[
        { job: 'Dental_Arch_Upper ×6', rows: [{ key: 'Material', value: 'Model V3' }, { key: 'Layer height', value: '0.100 mm' }, { key: 'Duration', value: '2 h 14 min' }, { key: 'Result', value: 'Completed' }] },
        { job: 'Bracket_v3 ×12', rows: [{ key: 'Material', value: 'Tough 2000' }, { key: 'Layer height', value: '0.050 mm' }, { key: 'Duration', value: '5 h 02 min' }, { key: 'Result', value: 'Completed' }] },
      ].map((j) => (
        <Card key={j.job} padding="md">
          <h2 className="pf-text-body-strong" style={{ marginBottom: 'var(--space-2)' }}>{j.job}</h2>
          <KeyValueList rows={j.rows} divided />
        </Card>
      ))}
    </div>
  );
}

const meta = {
  title: 'Components/Layout/Container',
  component: Container,
  tags: ['expanded'],
  args: { size: 'md', paddingX: 4, paddingY: 6, align: 'center', as: 'main' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'full'] },
    paddingX: { control: 'select', options: SPACE_STEPS },
    paddingY: { control: 'select', options: SPACE_STEPS },
    align: { control: 'inline-radio', options: ['center', 'start'] },
    as: { control: 'select', options: ['div', 'main', 'section', 'article', 'header', 'footer'] },
    children: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Centred max-width column with token side padding for full-page screens (print history, account, printer settings). Sizes are multiples of `--size-layout-panel`: sm 2×, md 3×, lg 4×, full uncapped.',
      },
    },
  },
  render: (args) => (
    <div style={{ width: '100%', background: 'var(--color-bg-canvas)' }}>
      <Container {...args} style={{ background: 'var(--color-bg-panel)' }}>
        <JobHistory />
      </Container>
    </div>
  ),
} satisfies Meta<typeof Container>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingBlock: 'var(--space-4)' }}>
      {(['sm', 'md', 'lg', 'full'] as const).map((size) => (
        <Container key={size} size={size}>
          <div style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-accent-subtle)', border: 'var(--border-width-1) solid var(--color-border-accent)' }}>
            <span className="pf-text-label">size="{size}"</span>
          </div>
        </Container>
      ))}
    </div>
  ),
};

export const Narrow: Story = { args: { size: 'sm' } };
