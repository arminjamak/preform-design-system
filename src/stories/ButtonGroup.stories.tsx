import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { HomeIcon, Redo2Icon, RulerIcon, Undo2Icon, ZoomInIcon, ZoomOutIcon } from 'lucide-react';
import { Button } from '../components/Button/Button';
import { ButtonGroup } from '../components/ButtonGroup/ButtonGroup';
import { IconButton } from '../components/IconButton/IconButton';

const meta = {
  title: 'Components/Actions/ButtonGroup',
  component: ButtonGroup,
  tags: ['expanded'],
  args: { attached: true, orientation: 'horizontal', size: 'sm', ariaLabel: 'Camera view', children: null },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    size: { control: 'inline-radio', options: [undefined, 'sm', 'md', 'lg'] },
    children: { control: false },
  },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline" onClick={fn()}>Top</Button>
      <Button variant="outline" onClick={fn()}>Front</Button>
      <Button variant="outline" onClick={fn()}>Side</Button>
      <Button variant="outline" onClick={fn()}>Isometric</Button>
    </ButtonGroup>
  ),
  parameters: {
    docs: {
      description: {
        component:
          'Clusters related Buttons or IconButtons into one control: camera views, undo/redo, zoom. Attached groups overlap borders by `border-width.1` and keep only the outer corners rounded; detached groups space children by `space.1`. `size` is passed to every child that does not set its own.\n\n' +
          '**Button coverage:** Primary = `Button variant="primary"`, Secondary = `variant="outline"`, Tertiary = `variant="ghost"`, Destructive = `variant="danger"`, Text = `variant="link"`, Loading = `Button loading`, Overflow = `Menu`. Put any of them inside a ButtonGroup; outline children read best when attached.',
      },
    },
  },
} satisfies Meta<typeof ButtonGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const IconButtons: Story = {
  args: { ariaLabel: 'History' },
  render: (args) => (
    <div className="sb-row">
      <ButtonGroup {...args} ariaLabel="History">
        <IconButton variant="outline" label="Undo" icon={<Undo2Icon strokeWidth={2.2} />} onClick={fn()} />
        <IconButton variant="outline" label="Redo" icon={<Redo2Icon strokeWidth={2.2} />} onClick={fn()} />
      </ButtonGroup>
      <ButtonGroup {...args} ariaLabel="Zoom">
        <IconButton variant="outline" label="Zoom out" icon={<ZoomOutIcon strokeWidth={2.2} />} onClick={fn()} />
        <Button variant="outline" onClick={fn()}>100%</Button>
        <IconButton variant="outline" label="Zoom in" icon={<ZoomInIcon strokeWidth={2.2} />} onClick={fn()} />
      </ButtonGroup>
    </div>
  ),
};

export const Detached: Story = {
  args: { attached: false, ariaLabel: 'Dialog actions' },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="ghost" onClick={fn()}>Cancel</Button>
      <Button variant="outline" onClick={fn()}>Save as Draft</Button>
      <Button variant="primary" onClick={fn()}>Upload to Queue</Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  args: { orientation: 'vertical', ariaLabel: 'Viewport tools' },
  render: (args) => (
    <ButtonGroup {...args}>
      <IconButton variant="outline" label="Reset camera" icon={<HomeIcon strokeWidth={2.2} />} onClick={fn()} />
      <IconButton variant="outline" label="Measure" icon={<RulerIcon strokeWidth={2.2} />} onClick={fn()} />
      <IconButton variant="outline" label="Zoom in" icon={<ZoomInIcon strokeWidth={2.2} />} onClick={fn()} />
      <IconButton variant="outline" label="Zoom out" icon={<ZoomOutIcon strokeWidth={2.2} />} onClick={fn()} />
    </ButtonGroup>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <ButtonGroup key={size} {...args} size={size} ariaLabel={`Camera view ${size}`}>
          <Button variant="outline">Top</Button>
          <Button variant="outline">Front</Button>
          <IconButton variant="outline" label="Reset camera" icon={<HomeIcon strokeWidth={2.2} />} />
        </ButtonGroup>
      ))}
    </div>
  ),
};
