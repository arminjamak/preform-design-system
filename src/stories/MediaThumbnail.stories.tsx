import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MediaThumbnail } from '../components/MediaThumbnail/MediaThumbnail';
import { StateMatrix } from './helpers/StateMatrix';
import { brokenImageSrc, demoParts } from './demo/partImages';

const srcOptions = Object.fromEntries([...demoParts.map((p) => [p.name, p.src]), ['broken image', brokenImageSrc]]);
const [bracket] = demoParts;

const meta = {
  title: 'Components/Media/MediaThumbnail',
  component: MediaThumbnail,
  tags: ['expanded'],
  args: {
    src: bracket.src,
    alt: bracket.alt,
    type: 'STL',
    meta: bracket.meta,
    name: bracket.name,
    selected: false,
    size: 'lg',
    ratio: '1/1',
    disabled: false,
    onOpen: fn(),
  },
  argTypes: {
    src: { options: Object.values(srcOptions), control: { type: 'select', labels: Object.fromEntries(Object.entries(srcOptions).map(([k, v]) => [v, k])) } },
    type: { control: 'inline-radio', options: [undefined, 'STL', 'MP4', 'PDF', 'PNG'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'fluid'] },
    ratio: { control: 'select', options: ['1/1', '4/3', '16/9'], description: 'Only applies to `size="fluid"`.' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Preview tile for a model, timelapse or report in the job file list. Type badge reuses `Badge`, the meta pill sits on `--color-bg-inverse`, the selected ring uses `--color-fg-accent`, and hover/focus reveal an open (or play) disc over `--color-bg-overlay`.',
      },
    },
  },
} satisfies Meta<typeof MediaThumbnail>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Types: Story = {
  render: (args) => (
    <div className="sb-row" style={{ alignItems: 'flex-start' }}>
      {[demoParts[1], demoParts[5], demoParts[7]].map((p) => (
        <MediaThumbnail key={p.name} {...args} src={p.src} alt={p.alt} type={p.type} meta={p.meta} name={p.name} />
      ))}
      <MediaThumbnail {...args} src={demoParts[3].src} alt="Photo of the printed dental arch after post-cure" type="PNG" meta={undefined} name="arch_postcure.png" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      <div className="sb-row" style={{ alignItems: 'flex-start' }}>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <MediaThumbnail key={size} {...args} size={size} name={`${size} · ${bracket.name}`} />
        ))}
      </div>
      <div className="sb-panel-demo">
        <MediaThumbnail {...args} size="fluid" ratio="16/9" name="fluid · 16/9 in a 300px panel" />
      </div>
    </div>
  ),
};

export const SelectableStrip: Story = {
  name: 'Selectable strip',
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [selected, setSelected] = useState(0);
    return (
      <div className="sb-row" role="group" aria-label="Job files" style={{ alignItems: 'flex-start' }}>
        {demoParts.slice(0, 6).map((p, i) => (
          <MediaThumbnail key={p.name} src={p.src} alt={p.alt} type={p.type} meta={p.meta} name={p.name} size="md" selected={selected === i} onOpen={() => setSelected(i)} />
        ))}
      </div>
    );
  },
};

export const NonInteractive: Story = { args: { onOpen: undefined, selected: true } };

export const Unavailable: Story = { args: { src: brokenImageSrc, alt: 'Mounting bracket', name: 'mounting_bracket_v2.stl', meta: undefined } };

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'STL', render: (p) => <MediaThumbnail {...args} size="md" name={undefined} {...p} /> },
        { label: 'MP4', render: (p) => <MediaThumbnail {...args} size="md" name={undefined} src={demoParts[5].src} type="MP4" meta="0:42" {...p} /> },
        { label: 'selected', render: (p) => <MediaThumbnail {...args} size="md" name={undefined} selected {...p} /> },
      ]}
    />
  ),
};
