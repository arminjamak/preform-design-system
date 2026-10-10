import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Card } from '../components/Card/Card';
import { Carousel } from '../components/Carousel/Carousel';
import { Image } from '../components/Image/Image';
import { MediaThumbnail } from '../components/MediaThumbnail/MediaThumbnail';
import { demoParts, renderPart, resins } from './demo/partImages';

const slides = demoParts.slice(0, 6).map((p) => <Image key={p.name} src={p.src} alt={p.alt} caption={p.caption} ratio="16/9" radius="lg" />);

const meta = {
  title: 'Components/Media/Carousel',
  component: Carousel,
  tags: ['expanded'],
  args: {
    items: slides,
    slidesPerView: 1,
    gap: 'md',
    autoplay: false,
    interval: 5000,
    loop: false,
    showDots: true,
    showArrows: true,
    label: 'Recent prints',
    onIndexChange: fn(),
  },
  argTypes: {
    items: { control: false },
    children: { control: false },
    slidesPerView: { control: { type: 'number', min: 1, max: 4, step: 0.5 } },
    gap: { control: 'inline-radio', options: ['none', 'sm', 'md', 'lg'] },
    interval: { control: { type: 'number', min: 1000, step: 500 } },
  },
  decorators: [(Story) => <div style={{ width: 'var(--size-layout-dialog-lg)', maxWidth: '100%' }}><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Horizontal scroll-snap carousel for print showcases and material spotlights. Prev/next use floating `IconButton`s, dots mark snap positions in `--color-bg-accent`, and autoplay pauses on hover, focus, hidden tabs and reduced motion (with a visible pause control). ←/→ keys page when focus is inside.',
      },
    },
  },
} satisfies Meta<typeof Carousel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SlidesPerView: Story = {
  name: 'Three per view',
  args: {
    slidesPerView: 3,
    gap: 'sm',
    label: 'Job files',
    items: demoParts.map((p) => <MediaThumbnail key={p.name} src={p.src} alt={p.alt} type={p.type} meta={p.meta} name={p.name} size="fluid" onOpen={() => {}} />),
  },
};

export const Peek: Story = { args: { slidesPerView: 1.5, gap: 'md', loop: true } };

export const Autoplay: Story = { args: { autoplay: true, loop: true, interval: 4000, label: 'Featured prints' } };

const spotlight = [
  { resin: resins.tough, part: 'gear' as const, title: 'Tough 2000', body: 'Stiff, strong prototypes. Gears, jigs and snap fits at 100 µm.' },
  { resin: resins.castable, part: 'gear' as const, title: 'Castable Wax 40', body: 'Burns out cleanly for investment casting of fine jewellery.' },
  { resin: resins.model, part: 'dental' as const, title: 'Model Resin V3', body: 'Accurate dental models with crisp margins at 25 µm.' },
  { resin: resins.rigid, part: 'lattice' as const, title: 'Rigid 10K', body: 'Glass-filled, high-modulus parts for tooling and lattices.' },
];

export const WithChildren: Story = {
  name: 'Children (material spotlight)',
  args: { items: undefined, slidesPerView: 2, gap: 'md', label: 'Material spotlight' },
  render: (args) => (
    <Carousel {...args}>
      {spotlight.map((m) => (
        <Card key={m.title} padding="sm" variant="outline">
          <Image src={renderPart(m.part, m.resin)} alt={`${m.title} ${m.part} sample`} ratio="4/3" radius="sm" />
          <div className="pf-text-body-strong" style={{ marginTop: 'var(--space-2)' }}>{m.title}</div>
          <div className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)', marginTop: 'var(--space-half)' }}>{m.body}</div>
        </Card>
      ))}
    </Carousel>
  ),
};
