import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { AspectRatio, type AspectRatioFit } from '../components/AspectRatio/AspectRatio';
import { Card } from '../components/Card/Card';

const RATIOS = { '16:9': 16 / 9, '4:3': 4 / 3, '3:2': 3 / 2, '1:1': 1, '9:16': 9 / 16 };

/**
 * A 4:3 print-preview bitmap painted from theme tokens (repainted when the theme flips), so `object-fit`
 * has a real replaced element to act on. The bitmap resolution is the only literal geometry here.
 */
function PrintPreview({ label = 'Form 4 · Grey V5 · 0.100 mm' }: { label?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const paint = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const css = getComputedStyle(canvas);
      const token = (name: string) => css.getPropertyValue(name).trim();
      const { width: w, height: h } = canvas;
      ctx.fillStyle = token('--color-bg-canvas');
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = token('--color-chart-grid');
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += w / 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y <= h; y += h / 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const tone = token('--color-accent-tone-blue');
      const face = (pts: number[][], alpha: number) => {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = tone;
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
        ctx.closePath();
        ctx.fill();
      };
      face([[0.5, 0.22], [0.72, 0.38], [0.5, 0.54], [0.28, 0.38]], 0.55);
      face([[0.28, 0.38], [0.5, 0.54], [0.5, 0.8], [0.28, 0.64]], 1);
      face([[0.72, 0.38], [0.5, 0.54], [0.5, 0.8], [0.72, 0.64]], 0.8);
      ctx.globalAlpha = 1;
      ctx.fillStyle = token('--color-fg-muted');
      ctx.font = `${token('--font-weight-semibold')} ${token('--font-size-xl')} ${token('--font-family-sans')}`;
      ctx.fillText(label, w / 32, h - h / 24);
    };
    paint();
    const mo = new MutationObserver(paint);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, [label]);
  return <canvas ref={ref} width={480} height={360} role="img" aria-label={`Print preview: ${label}`} />;
}

const meta = {
  title: 'Components/Layout/AspectRatio',
  component: AspectRatio,
  tags: ['expanded'],
  args: { ratio: 16 / 9, fit: 'cover', radius: 'md', bordered: true },
  argTypes: {
    ratio: { control: 'select', options: Object.keys(RATIOS), mapping: RATIOS },
    fit: { control: 'inline-radio', options: ['cover', 'contain', 'fill', 'scale-down', 'none'] },
    radius: { control: 'inline-radio', options: ['none', 'sm', 'md', 'lg'] },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Keeps a width÷height ratio with CSS `aspect-ratio` and fills it with its child; img, video, canvas and iframe children take `object-fit`. Used for model thumbnails, print previews and printer camera feeds. Empty space shows `--color-bg-sunken`.',
      },
    },
  },
  render: (args) => (
    <div style={{ width: 'var(--size-layout-dialog-md)' }}>
      <AspectRatio {...args}>
        <PrintPreview />
      </AspectRatio>
    </div>
  ),
} satisfies Meta<typeof AspectRatio>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const FitModes: Story = {
  name: 'Fit modes (4:3 preview in 16:9 box)',
  parameters: { layout: 'padded', controls: { disable: true } },
  render: () => (
    <div className="sb-row" style={{ alignItems: 'flex-start', width: '100%' }}>
      {(['cover', 'contain', 'fill'] as AspectRatioFit[]).map((fit) => (
        <div key={fit} className="sb-stack" style={{ width: 'var(--size-layout-sidebar)', alignItems: 'stretch', gap: 'var(--space-1)' }}>
          <span className="pf-text-caption" style={{ color: 'var(--color-fg-muted)', textTransform: 'uppercase' }}>{fit}</span>
          <AspectRatio ratio={16 / 9} fit={fit} bordered>
            <PrintPreview />
          </AspectRatio>
        </div>
      ))}
    </div>
  ),
};

export const Ratios: Story = {
  parameters: { layout: 'padded', controls: { disable: true } },
  render: () => (
    <div className="sb-row" style={{ alignItems: 'flex-start', width: '100%' }}>
      {Object.entries(RATIOS).map(([name, ratio]) => (
        <div key={name} className="sb-stack" style={{ width: 'var(--size-field-lg)', alignItems: 'stretch', gap: 'var(--space-1)' }}>
          <span className="pf-text-caption" style={{ color: 'var(--color-fg-muted)' }}>{name}</span>
          <AspectRatio ratio={ratio} bordered>
            <PrintPreview />
          </AspectRatio>
        </div>
      ))}
    </div>
  ),
};

export const ThumbnailCard: Story = {
  name: 'In a model card',
  parameters: { controls: { disable: true } },
  render: () => (
    <Card padding="none" style={{ width: 'var(--size-layout-sidebar)', overflow: 'hidden' }}>
      <AspectRatio ratio={4 / 3} radius="none">
        <PrintPreview label="Turbine_Blade" />
      </AspectRatio>
      <div style={{ padding: 'var(--space-2)' }}>
        <div className="pf-text-body-strong">Turbine_Blade.obj</div>
        <div className="pf-text-label-sm" style={{ color: 'var(--color-fg-muted)' }}>9.7 × 3.3 × 1.1 cm · Grey V5</div>
      </div>
    </Card>
  ),
};
