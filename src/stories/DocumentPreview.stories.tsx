import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { DocumentPreview } from '../components/DocumentPreview/DocumentPreview';
import { buildPlatformSvg, DEMO_GCODE, demoPdfUrl, reportPages } from './demo/media-demo';

const pages = reportPages(4);

const meta = {
  title: 'Components/Media/DocumentPreview',
  component: DocumentPreview,
  tags: ['expanded'],
  args: {
    fileName: 'Bracket_v3_batch – print report.pdf',
    kind: 'image',
    typeLabel: 'Print report',
    size: 2_480_000,
    pages,
    page: 0,
    layout: 'card',
    height: 'lg',
    maxLines: 40,
    loading: false,
    onDownload: fn(),
    onOpen: fn(),
    onPageChange: fn(),
  },
  argTypes: {
    kind: { control: 'inline-radio', options: ['pdf', 'image', 'text'] },
    layout: { control: 'inline-radio', options: ['card', 'pane'] },
    height: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    size: { control: 'number' },
    pageCount: { control: 'number' },
    page: { control: { type: 'number', min: 0 } },
    src: { control: 'text' },
    text: { control: 'text' },
    pages: { control: 'object' },
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
      <DocumentPreview
        {...args}
        onPageChange={(p) => {
          args.onPageChange?.(p);
          update({ page: p });
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'Preview card for job files: print reports (image page sets with page nav and zoom), PDFs (iframe only when `src` is set) and text such as G-code (first N lines in mono). Header carries the name, type, size, page count and Download / Open actions. Built on `--color-bg-surface` with a `--color-bg-panel` body.',
      },
    },
  },
} satisfies Meta<typeof DocumentPreview>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const PdfEmbedded: Story = {
  name: 'PDF with src (iframe)',
  args: { kind: 'pdf', fileName: 'Bracket_v3_batch – print report.pdf', typeLabel: 'PDF', pageCount: 1, size: 1_420, pages: undefined, src: demoPdfUrl() },
};

export const PdfWithoutSource: Story = {
  name: 'PDF without src',
  args: { kind: 'pdf', fileName: 'Form 4 – Safety data sheet.pdf', typeLabel: 'PDF', pageCount: 12, size: 3_870_000, pages: undefined, height: 'md' },
};

export const Gcode: Story = {
  name: 'G-code (text excerpt)',
  args: { kind: 'text', fileName: 'Bracket_v3_batch.gcode', typeLabel: 'G-code', size: 18_620_000, pages: undefined, text: DEMO_GCODE, totalLines: 7224, onOpen: undefined, height: 'md' },
};

export const SingleImage: Story = {
  name: 'Image (single)',
  args: { kind: 'image', fileName: 'Build platform snapshot.svg', typeLabel: 'Snapshot', size: 412_000, pages: undefined, src: buildPlatformSvg(), height: 'md', onOpen: undefined },
};

export const Pane: Story = {
  name: 'Pane layout',
  decorators: [
    (S) => (
      <div style={{ height: 'var(--size-layout-dialog-lg)', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--elevation-panel)' }}>
        <S />
      </div>
    ),
  ],
  args: { layout: 'pane' },
};

export const Loading: Story = { args: { loading: true, height: 'sm' } };

export const NoActions: Story = {
  name: 'Read-only (no actions)',
  args: { onDownload: undefined, onOpen: undefined, kind: 'text', text: DEMO_GCODE.split('\n').slice(0, 12).join('\n'), pages: undefined, fileName: 'Layer_0-2.gcode', typeLabel: 'G-code', size: 640, height: 'sm' },
};
