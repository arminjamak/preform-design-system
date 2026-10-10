import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FolderOpenIcon, PlusIcon, UploadIcon } from 'lucide-react';
import { Button } from '../components/Button/Button';
import { EmptyState } from '../components/EmptyState/EmptyState';

const meta = {
  title: 'Components/Feedback/EmptyState',
  component: EmptyState,
  tags: ['expanded'],
  args: {
    tone: 'empty',
    size: 'md',
    title: 'No models on the build platform',
    description: 'Open a file or drag an STL, OBJ or 3MF into the scene to start preparing a print.',
    primaryAction: true as unknown as ReactNode,
    secondaryAction: true as unknown as ReactNode,
    titleAs: 'h3',
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['empty', 'error', 'success'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    titleAs: { control: 'inline-radio', options: ['h2', 'h3', 'h4', 'p'] },
    title: { control: 'text' },
    description: { control: 'text' },
    primaryAction: {
      control: 'boolean',
      mapping: { true: <Button variant="primary" iconStart={<FolderOpenIcon strokeWidth={2} />}>Open file</Button>, false: undefined },
    },
    secondaryAction: { control: 'boolean', mapping: { true: <Button variant="outline">Browse sample parts</Button>, false: undefined } },
    icon: { control: false },
  },
  decorators: [(S) => <div style={{ width: 'var(--size-layout-dialog-md)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--elevation-card)' }}><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Placeholder for empty, failed and completed views (scene, print queue, upload results). `tone` sets the soft disc (`--color-bg-muted`, `--color-status-danger-soft`, `--color-status-success-soft`) and its default icon; `size` sm fits inside a 300px panel.',
      },
    },
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const EmptyStateStory: Story = { name: 'Empty' };

export const ErrorState: Story = {
  name: 'Error',
  args: {
    tone: 'error',
    title: 'Upload failed',
    description: 'Bracket_v3.form could not be sent to the queue. Check your connection and try again.',
    primaryAction: <Button variant="primary" iconStart={<UploadIcon strokeWidth={2} />}>Retry upload</Button>,
    secondaryAction: <Button variant="outline">Save locally</Button>,
  },
  argTypes: { primaryAction: { control: false }, secondaryAction: { control: false } },
};

export const SuccessState: Story = {
  name: 'Success',
  args: {
    tone: 'success',
    title: 'Job sent to Form 4',
    description: 'Bracket_v3 is first in the queue on Form 4 · Studio. Estimated print time 2 h 38 min.',
    primaryAction: <Button variant="primary">View queue</Button>,
    secondaryAction: <Button variant="outline">Prepare another job</Button>,
  },
  argTypes: { primaryAction: { control: false }, secondaryAction: { control: false } },
};

/** `sm` inside a 300px side panel, e.g. an empty print queue. */
export const SmallInPanel: Story = {
  args: {
    size: 'sm',
    title: 'Queue is empty',
    description: 'Jobs you upload to Form 4 · Studio will appear here.',
    primaryAction: <Button variant="primary" iconStart={<PlusIcon strokeWidth={2} />}>Add job</Button>,
    secondaryAction: undefined,
  },
  argTypes: { primaryAction: { control: false }, secondaryAction: { control: false } },
  decorators: [(S) => <div className="sb-panel-demo" style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)' }}><S /></div>],
};

export const Tones: Story = {
  parameters: { controls: { include: ['size'] } },
  decorators: [(S) => <S />],
  render: (args) => (
    <div className="sb-row" style={{ alignItems: 'stretch' }}>
      {[
        { tone: 'empty' as const, title: 'No models on the build platform', description: 'Open a file to get started.' },
        { tone: 'error' as const, title: 'Upload failed', description: 'The printer did not accept the job.' },
        { tone: 'success' as const, title: 'Job sent to Form 4', description: 'It is first in the queue.' },
      ].map((c) => (
        <div key={c.tone} style={{ width: 'var(--size-layout-panel)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--elevation-card)' }}>
          <EmptyState size={args.size} tone={c.tone} title={c.title} description={c.description} />
        </div>
      ))}
    </div>
  ),
};
