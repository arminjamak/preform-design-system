import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { FileUpload, type UploadFile } from '../components/FileUpload/FileUpload';
import { StateMatrix } from './helpers/StateMatrix';

const MB = 1024 * 1024;

const SAMPLE: UploadFile[] = [
  { id: 'a', name: 'turbine-housing_v3.stl', size: 18.4 * MB, progress: 100 },
  { id: 'b', name: 'dental-arch-upper.3mf', size: 6.2 * MB, progress: 64 },
  { id: 'c', name: 'bracket-left.obj', size: 2.1 * MB, progress: 12 },
  { id: 'd', name: 'gear-set-assembly.stl', size: 41.7 * MB, error: 'Mesh has 3 open edges. Repair it before printing.' },
];

let nextId = 0;
const toUploads = (files: File[], progress?: number): UploadFile[] => files.map((f) => ({ id: `${f.name}-${nextId++}`, name: f.name, size: f.size, progress }));

const meta = {
  title: 'Components/Inputs/FileUpload',
  component: FileUpload,
  tags: ['expanded'],
  args: {
    variant: 'dropzone',
    label: 'Models',
    hint: 'Files open in the current scene. Large meshes may take a moment to repair.',
    accept: '.stl,.obj,.3mf',
    multiple: true,
    maxSize: 200 * MB,
    disabled: false,
    files: SAMPLE.slice(0, 2),
    onAdd: fn(),
    onRemove: fn(),
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['button', 'dropzone'] },
    files: { control: 'object' },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus', 'active', 'dragover'], name: 'forced state' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Model import as a picker button or a drag-and-drop area. Drag-over swaps the dashed `--color-border-default` frame for `--color-border-focus` on `--color-bg-accent-subtle`. Files that fail `accept` or `maxSize` are reported with the danger status tokens; each accepted file row shows its size, progress and a remove button.',
      },
    },
  },
  render: function Render(args) {
    const [{ files }, update] = useArgs<{ files: UploadFile[] }>();
    return (
      <div className="sb-panel-demo">
        <FileUpload
          {...args}
          files={files}
          onAdd={(added) => {
            update({ files: [...files, ...toUploads(added)] });
            args.onAdd(added);
          }}
          onRemove={(id) => {
            update({ files: files.filter((f) => f.id !== id) });
            args.onRemove(id);
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof FileUpload>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Dropzone: Story = { args: { variant: 'dropzone', files: [] } };

export const DragOver: Story = { name: 'Dropzone · drag over', args: { variant: 'dropzone', files: [], 'data-state': 'dragover' } };

export const ButtonVariant: Story = {
  name: 'Button',
  args: { variant: 'button', label: 'Reference image', hint: 'Shown behind the model while you place supports.', accept: '.png,.jpg', multiple: false, maxSize: 10 * MB, files: [] },
};

export const FileStates: Story = {
  name: 'File rows: progress, done, error',
  args: { files: SAMPLE },
};

export const Disabled: Story = { args: { disabled: true, files: SAMPLE.slice(0, 1) } };

export const SimulatedUpload: Story = {
  name: 'Simulated upload',
  parameters: { controls: { disable: true } },
  render: function Render(args) {
    const [files, setFiles] = useState<UploadFile[]>([]);
    useEffect(() => {
      if (!files.some((f) => f.progress !== undefined && f.progress < 100)) return;
      const t = window.setInterval(() => {
        setFiles((list) => list.map((f) => (f.progress !== undefined && f.progress < 100 ? { ...f, progress: Math.min(100, f.progress + 7) } : f)));
      }, 250);
      return () => window.clearInterval(t);
    }, [files]);
    return (
      <div className="sb-panel-demo">
        <FileUpload {...args} files={files} onAdd={(added) => setFiles((l) => [...l, ...toUploads(added, 0)])} onRemove={(id) => setFiles((l) => l.filter((f) => f.id !== id))} />
      </div>
    );
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <StateMatrix
      render={() => null}
      rows={[
        { label: 'dropzone', render: (p) => <div style={{ width: 'var(--size-layout-sidebar)' }}><FileUpload {...args} variant="dropzone" files={[]} hint={undefined} {...p} /></div> },
        { label: 'button', render: (p) => <FileUpload {...args} variant="button" files={[]} hint={undefined} {...p} /> },
      ]}
    />
  ),
};
