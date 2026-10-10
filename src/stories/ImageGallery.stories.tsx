import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ImageGallery } from '../components/ImageGallery/ImageGallery';
import { demoParts } from './demo/partImages';

const images = demoParts.map(({ src, alt, caption }) => ({ src, alt, caption }));

const meta = {
  title: 'Components/Media/ImageGallery',
  component: ImageGallery,
  tags: ['expanded'],
  args: { images, columns: 'auto', gap: 'md', ratio: '1/1', label: 'Build plate renders', onOpenImage: fn() },
  argTypes: {
    images: { control: false },
    columns: { control: 'select', options: ['auto', 2, 3, 4, 5] },
    gap: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    ratio: { control: 'select', options: ['1/1', '4/3', '16/9'] },
  },
  decorators: [(Story) => <div style={{ width: 'var(--size-layout-dialog-lg)', maxWidth: '100%' }}><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Responsive grid of `MediaThumbnail` tiles. Arrow keys move between tiles (roving tab stop), Enter or click opens the `Lightbox` at that image, and focus returns to the last viewed tile on close. Gap uses `--space-*`; auto columns fit 96px-minimum tiles.',
      },
    },
  },
} satisfies Meta<typeof ImageGallery>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const FixedColumns: Story = { args: { columns: 4, gap: 'sm' } };

export const Widescreen: Story = { args: { columns: 2, ratio: '16/9', gap: 'lg', images: images.slice(0, 4) } };

export const InPanel: Story = {
  name: 'In a 300px panel',
  args: { columns: 3, gap: 'sm', images: images.slice(0, 6), label: 'Print photos' },
  decorators: [(Story) => <div className="sb-panel-demo"><Story /></div>],
};
