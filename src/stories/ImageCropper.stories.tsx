import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { ImageCropper, type CropRect } from '../components/ImageCropper/ImageCropper';
import { buildPlatformSvg, reportPages } from './demo/media-demo';

const platform = buildPlatformSvg();

const meta = {
  title: 'Components/Media/ImageCropper',
  component: ImageCropper,
  tags: ['expanded'],
  args: {
    src: platform,
    alt: 'Form 4 build platform with a bracket, lattice cube and dental arch on supports',
    aspect: 'free',
    minSize: 64,
    maxZoom: 400,
    showGrid: true,
    hideToolbar: false,
    onChange: fn(),
    onAspectChange: fn(),
  },
  argTypes: {
    aspect: { control: 'inline-radio', options: ['free', '1:1', '4:3', '16:9'] },
    minSize: { control: { type: 'number', min: 1, step: 8 } },
    maxZoom: { control: { type: 'number', min: 100, step: 50 } },
    src: { control: 'text' },
    defaultCrop: { control: 'object' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  decorators: [
    (S) => (
      <div style={{ width: 'var(--size-layout-dialog-lg)', maxWidth: '100%' }}>
        <S />
      </div>
    ),
  ],
  render: function Render(args) {
    const [, update] = useArgs();
    return (
      <ImageCropper
        {...args}
        onAspectChange={(a) => {
          args.onAspectChange?.(a);
          update({ aspect: a });
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'Crop a part thumbnail or job snapshot: drag the box to move, drag any of the 8 handles to resize, drag on the image to draw a new box. Aspect presets use Segmented, zoom uses Slider, and the crop is reported in natural image pixels via `onChange`. Keyboard: focus the crop box, arrows move, Shift + arrows resize. The outside scrim is two layers of `--color-bg-overlay`; the frame and handles use `--color-bg-accent` and `--color-control-thumb`.',
      },
    },
  },
} satisfies Meta<typeof ImageCropper>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Square: Story = { name: 'Aspect 1:1 (part thumbnail)', args: { aspect: '1:1' } };

export const Widescreen: Story = { name: 'Aspect 16:9 (job cover)', args: { aspect: '16:9' } };

export const PortraitImage: Story = {
  name: 'Portrait source (report page)',
  args: { src: reportPages(1)[0], alt: 'Print report, job summary page', aspect: '4:3' },
};

export const WithOutput: Story = {
  name: 'Live output rect',
  render: function Render(args) {
    const [rect, setRect] = useState<CropRect | null>(null);
    return (
      <div className="sb-stack" style={{ alignItems: 'stretch' }}>
        <ImageCropper
          {...args}
          defaultCrop={{ x: 440, y: 360, width: 520, height: 320 }}
          onChange={(r) => {
            setRect(r);
            args.onChange?.(r);
          }}
        />
        <pre className="pf-text-mono" style={{ margin: 0, padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-panel)', color: 'var(--color-fg-secondary)' }}>
          onChange({rect ? JSON.stringify(rect) : '…'})
        </pre>
      </div>
    );
  },
};

export const Embedded: Story = {
  name: 'No toolbar, no grid',
  args: { hideToolbar: true, showGrid: false, aspect: '4:3' },
};
