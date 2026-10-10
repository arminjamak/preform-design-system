import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { BreadcrumbEditor } from '../components/BreadcrumbEditor/BreadcrumbEditor';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Specialized/BreadcrumbEditor',
  component: BreadcrumbEditor,
  tags: ['expanded'],
  args: {
    value: ['Dental', 'Crowns', '2026-10 Batch A'],
    rootLabel: 'Print jobs',
    maxDepth: 5,
    placeholder: 'New folder',
    label: 'Save print job to',
    disabled: false,
    onChange: fn(),
  },
  argTypes: {
    value: { control: 'object' },
    maxDepth: { control: { type: 'number', min: 1, max: 10 } },
    placeholder: { control: 'text' },
    label: { control: 'text' },
    rootLabel: { control: 'text' },
    disabled: { control: 'boolean' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state (first folder)' },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs<{ value: string[] }>();
    return (
      <div style={{ width: 'calc(var(--size-layout-dialog-lg) + var(--space-16))', maxWidth: '100%' }}>
        <BreadcrumbEditor
          {...args}
          value={value}
          onChange={(v) => {
            args.onChange(v);
            update({ value: v });
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'Editable folder path for where PreForm saves print jobs and models. Each folder is a chip: click (or Enter/F2) to rename inline, Enter commits and Escape cancels, chevrons or Alt+Arrow reorder, × or Delete removes. Names cannot be empty or contain "/"; the add button stops at `maxDepth`. A mono preview shows the resulting path.',
      },
    },
  },
} satisfies Meta<typeof BreadcrumbEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Empty: Story = {
  name: 'Empty path',
  args: { value: [], rootLabel: 'Model library' },
};

export const AtMaxDepth: Story = {
  name: 'At maximum depth',
  args: { value: ['Production', 'Form 4L', 'Tough 2000', 'Jigs', 'Week 41'], maxDepth: 5 },
};

export const WithoutRoot: Story = {
  name: 'Without root label',
  args: { rootLabel: undefined, value: ['Engineering', 'Fixtures', 'Drill guides'] },
};

export const Disabled: Story = { args: { disabled: true } };

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateMatrix render={(p) => <BreadcrumbEditor value={['Dental', 'Crowns']} onChange={() => {}} label="Folder path" data-state={p['data-state']} disabled={p.disabled} />} />,
};
