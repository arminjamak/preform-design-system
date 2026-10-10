import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { Maximize2Icon } from 'lucide-react';
import { Button } from '../components/Button/Button';
import { Lightbox } from '../components/Lightbox/Lightbox';
import { brokenImageSrc, demoParts } from './demo/partImages';

const images = demoParts.map(({ src, alt, caption }) => ({ src, alt, caption }));

const meta = {
  title: 'Components/Media/Lightbox',
  component: Lightbox,
  tags: ['expanded'],
  args: { images, index: 2, open: true, onClose: fn(), onIndexChange: fn(), label: 'Print renders', loop: true, showThumbnails: true, inline: true },
  argTypes: {
    images: { control: false },
    index: { control: { type: 'number', min: 0, max: images.length - 1, step: 1 } },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Image viewer overlay: `--color-bg-overlay` layered on `--color-bg-inverse` so it stays dark in both themes. Prev/next (←/→, swipe), counter, zoom with wheel, buttons, +/−/0 and double-click, drag or arrow keys to pan when zoomed, thumbnail strip and caption. Escape or the backdrop closes; focus is trapped and restored.',
      },
    },
  },
  render: function Render(args) {
    const [{ open, index }, update] = useArgs();
    return (
      <div style={{ position: 'relative', width: '100%', minWidth: 'var(--size-layout-dialog-lg)', height: 'calc(var(--space-24) * 5)', display: 'grid', placeItems: 'center' }}>
        <Button variant="primary" iconStart={<Maximize2Icon strokeWidth={2.2} />} onClick={() => update({ open: true })}>
          Open viewer
        </Button>
        <Lightbox
          {...args}
          open={open}
          index={index}
          onClose={() => {
            args.onClose();
            update({ open: false });
          }}
          onIndexChange={(i) => {
            args.onIndexChange(i);
            update({ index: i });
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof Lightbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const FullScreen: Story = {
  name: 'Full screen (portal)',
  args: { inline: false, open: false, index: 0 },
};

export const NoThumbnails: Story = { args: { showThumbnails: false, loop: false, index: 0 } };

export const SingleImage: Story = { args: { images: [images[3]], index: 0 } };

export const Unavailable: Story = {
  name: 'Image unavailable',
  args: {
    index: 1,
    images: [images[0], { src: brokenImageSrc, alt: 'Turbine housing render', caption: 'turbine_housing_v7.stl could not be rendered. Re-export the mesh and try again.' }, images[2]],
  },
};
