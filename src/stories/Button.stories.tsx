import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ListIcon, SaveIcon } from 'lucide-react';
import { Button } from '../components';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Actions/Button',
  component: Button,
  args: { children: 'Generate Supports', variant: 'primary', size: 'sm', shape: 'pill', onClick: fn() },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'outline', 'outlineAccent', 'muted', 'ghost', 'danger', 'link'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    shape: { control: 'inline-radio', options: ['pill', 'rounded'] },
    iconStart: { control: 'boolean', mapping: { true: <SaveIcon strokeWidth={2.2} />, false: undefined } },
    iconEnd: { control: 'boolean', mapping: { true: <ListIcon strokeWidth={2.2} />, false: undefined } },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: { docs: { description: { component: 'The pill button used everywhere in PreForm: panel footers, dialogs, the Upload to Queue action. Heights come from `component.button.height-*`, colours from semantic `bg.accent` / `border.*` tokens.' } } },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {(['primary', 'outline', 'outlineAccent', 'muted', 'ghost', 'danger', 'link'] as const).map((v) => (
        <Button key={v} {...args} variant={v}>
          {v}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-row">
      <Button {...args} size="sm">Small · 24</Button>
      <Button {...args} size="md">Medium · 28</Button>
      <Button {...args} size="lg">Large · 32</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  args: { iconStart: <ListIcon strokeWidth={2} />, children: 'Upload to Queue' },
};

export const Loading: Story = { args: { loading: true, children: 'Preparing…' } };

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={(['primary', 'outline', 'outlineAccent', 'muted', 'ghost', 'danger'] as const).map((v) => ({
        label: v,
        render: (p) => (
          <Button {...args} variant={v} {...p}>
            Label
          </Button>
        ),
      }))}
    />
  ),
};
