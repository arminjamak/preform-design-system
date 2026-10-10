import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Image } from '../components/Image/Image';
import { brokenImageSrc, demoParts } from './demo/partImages';

const [bracket, gear, chassis, dental, lattice] = demoParts;

const srcOptions = { bracket: bracket.src, gear: gear.src, chassis: chassis.src, dental: dental.src, lattice: lattice.src, broken: brokenImageSrc };

const meta = {
  title: 'Components/Media/Image',
  component: Image,
  tags: ['expanded'],
  args: {
    src: bracket.src,
    alt: bracket.alt,
    ratio: '4/3',
    fit: 'cover',
    radius: 'md',
    caption: bracket.caption,
    compactFallback: false,
    loading: 'lazy',
    forceStatus: undefined,
    onStatusChange: fn(),
  },
  argTypes: {
    src: { options: Object.values(srcOptions), control: { type: 'select', labels: Object.fromEntries(Object.entries(srcOptions).map(([k, v]) => [v, k])) } },
    ratio: { control: 'select', options: ['auto', '1/1', '4/3', '3/2', '16/9', '3/4'] },
    fit: { control: 'inline-radio', options: ['cover', 'contain'] },
    radius: { control: 'inline-radio', options: ['none', 'sm', 'md', 'lg'] },
    loading: { control: 'inline-radio', options: ['lazy', 'eager'] },
    forceStatus: { control: 'inline-radio', options: [undefined, 'loading', 'loaded', 'error'] },
    caption: { control: 'text' },
  },
  decorators: [(Story) => <div className="sb-panel-demo"><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Framed image for part previews, print photos and report thumbnails. Holds its aspect ratio while loading (shimmer on `--color-bg-sunken`), falls back to an icon and "Preview unavailable" on error, and rounds with `--radius-*`.',
      },
    },
  },
} satisfies Meta<typeof Image>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Ratios: Story = {
  decorators: [],
  args: { caption: undefined },
  render: (args) => (
    <div className="sb-row" style={{ alignItems: 'flex-start' }}>
      {(['1/1', '4/3', '16/9', '3/4'] as const).map((ratio) => (
        <div key={ratio} style={{ width: 'calc(var(--space-24) + var(--space-16))' }}>
          <Image {...args} ratio={ratio} caption={ratio} />
        </div>
      ))}
    </div>
  ),
};

export const Fit: Story = {
  decorators: [],
  args: { src: gear.src, alt: gear.alt, ratio: '1/1', caption: undefined },
  render: (args) => (
    <div className="sb-row" style={{ alignItems: 'flex-start' }}>
      <div style={{ width: 'calc(var(--space-24) + var(--space-16))' }}>
        <Image {...args} fit="cover" caption="cover — fills the frame" />
      </div>
      <div style={{ width: 'calc(var(--space-24) + var(--space-16))' }}>
        <Image {...args} fit="contain" caption="contain — whole render, letterboxed" />
      </div>
    </div>
  ),
};

export const Radius: Story = {
  decorators: [],
  args: { src: chassis.src, alt: chassis.alt, ratio: '4/3', caption: undefined },
  render: (args) => (
    <div className="sb-row" style={{ alignItems: 'flex-start' }}>
      {(['none', 'sm', 'md', 'lg'] as const).map((radius) => (
        <div key={radius} style={{ width: 'var(--space-24)' }}>
          <Image {...args} radius={radius} caption={radius} />
        </div>
      ))}
    </div>
  ),
};

export const LoadStates: Story = {
  decorators: [],
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-row" style={{ alignItems: 'flex-start' }}>
      <div style={{ width: 'calc(var(--space-24) + var(--space-16))' }}>
        <Image src={dental.src} alt={dental.alt} forceStatus="loading" caption="Loading — shimmer" />
      </div>
      <div style={{ width: 'calc(var(--space-24) + var(--space-16))' }}>
        <Image src={dental.src} alt={dental.alt} caption={dental.caption} />
      </div>
      <div style={{ width: 'calc(var(--space-24) + var(--space-16))' }}>
        <Image src={brokenImageSrc} alt="Upper arch dental model" caption="Error — file could not be rendered" />
      </div>
      <div style={{ width: 'var(--space-16)' }}>
        <Image src={brokenImageSrc} alt="Lattice cube" ratio="1/1" compactFallback caption="Compact" />
      </div>
    </div>
  ),
};

export const IntrinsicRatio: Story = {
  args: { ratio: 'auto', src: lattice.src, alt: lattice.alt, caption: lattice.caption, radius: 'lg' },
};
