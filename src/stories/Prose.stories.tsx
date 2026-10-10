import type { Meta, StoryObj } from '@storybook/react-vite';
import { Prose } from '../components/Prose/Prose';

const ARTICLE = (
  <>
    <h1>PreForm 3.44</h1>
    <p>
      PreForm 3.44 adds <strong>Form 4L</strong> support, faster support generation and a cleaner job queue. Read the{' '}
      <a href="https://support.formlabs.com">full changelog</a> for firmware requirements.
    </p>
    <h2>Printing</h2>
    <p>
      Auto-orient now respects the minimum angle set in <code>Print Settings</code>, and hollowing preview shows drain holes in the cross-section
      view.
    </p>
    <h3>Supported materials</h3>
    <ul>
      <li>Grey V5 at 25, 50 and 100 µm</li>
      <li>
        Clear V5 at 50 and 100 µm
        <ul>
          <li>Requires the Form 4 resin tank</li>
        </ul>
      </li>
      <li>Tough 2000 at 100 µm</li>
    </ul>
    <h4>Upgrade order</h4>
    <ol>
      <li>Update PreForm on every workstation.</li>
      <li>Update printer firmware to 1.9.2.</li>
      <li>Re-slice queued jobs.</li>
    </ol>
    <blockquote>
      <p>Jobs prepared in 3.43 still print, but cannot use the new support tips.</p>
    </blockquote>
    <pre>
      <code>{`PreFormServer --port 44388 --log-level info`}</code>
    </pre>
    <table>
      <thead>
        <tr>
          <th>Printer</th>
          <th>Minimum firmware</th>
          <th>Max build volume</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Form 4</td>
          <td>1.9.2</td>
          <td>200 × 125 × 210 mm</td>
        </tr>
        <tr>
          <td>Form 4L</td>
          <td>1.9.2</td>
          <td>353 × 196 × 350 mm</td>
        </tr>
      </tbody>
    </table>
    <hr />
    <p>
      Questions? Contact <a href="mailto:support@formlabs.com">support@formlabs.com</a>.
    </p>
  </>
);

const meta = {
  title: 'Components/Media/Prose',
  component: Prose,
  tags: ['expanded'],
  args: { size: 'md', as: 'article', children: ARTICLE },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    as: { control: 'inline-radio', options: ['div', 'article', 'section'] },
    children: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Typography wrapper for long-form HTML or rendered Markdown (release notes, job notes, help articles). Element styles use `--typography-*` tokens at zero specificity so nested components keep their own look. Used by the MarkdownEditor preview and the RichTextEditor surface.',
      },
    },
  },
  decorators: [(Story) => <div style={{ width: 'var(--size-layout-dialog-lg)', maxWidth: '100%' }}><Story /></div>],
} satisfies Meta<typeof Prose>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-row" style={{ alignItems: 'flex-start', gap: 'var(--space-8)' }}>
      {(['sm', 'md'] as const).map((size) => (
        <div key={size} style={{ width: 'var(--size-layout-panel)' }}>
          <p className="pf-text-caption" style={{ color: 'var(--color-fg-muted)', marginBottom: 'var(--space-2)' }}>
            size = {size}
          </p>
          <Prose size={size}>
            <h2>Supports</h2>
            <p>
              Density <strong>1.0</strong> with <code>0.45 mm</code> touchpoints suits most dental models.
            </p>
            <ul>
              <li>Internal supports off</li>
              <li>Raft: full</li>
            </ul>
          </Prose>
        </div>
      ))}
    </div>
  ),
};
