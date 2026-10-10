import type { Meta, StoryObj } from '@storybook/react-vite';
import { Blockquote } from '../components/Blockquote/Blockquote';

const QUOTE =
  'We moved the whole night shift onto two Form 4 printers. Supports snap off clean, and the upper arches fit the articulator first time.';

const meta = {
  title: 'Components/Media/Blockquote',
  component: Blockquote,
  tags: ['expanded'],
  args: {
    children: QUOTE,
    citation: 'Dana Whitfield, Lab manager at Northshore Dental',
    source: 'Formlabs customer story',
    sourceHref: 'https://formlabs.com/blog/',
    variant: 'default',
  },
  argTypes: {
    children: { control: 'text' },
    citation: { control: 'text' },
    source: { control: 'text' },
    variant: { control: 'inline-radio', options: ['default', 'pull'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Quotation with an accent rule (`--color-fg-accent`) and an optional attribution: person, source title and link. `pull` is a larger centred pull quote for release pages and customer stories.',
      },
    },
  },
  decorators: [(Story) => <div style={{ width: 'var(--size-layout-dialog-lg)', maxWidth: '100%' }}><Story /></div>],
} satisfies Meta<typeof Blockquote>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack" style={{ alignItems: 'stretch', gap: 'var(--space-8)' }}>
      <Blockquote citation="PreForm 3.44 release notes">
        Update printer firmware to 1.9.2 before sending jobs from PreForm 3.44. Older firmware rejects the new support format.
      </Blockquote>
      <Blockquote variant="pull" citation="Dana Whitfield" source="Formlabs customer story" sourceHref="https://formlabs.com/blog/">
        {QUOTE}
      </Blockquote>
    </div>
  ),
};

export const WithoutAttribution: Story = {
  args: { citation: undefined, source: undefined, sourceHref: undefined, children: 'Leave the build platform in the printer for 10 minutes after the job finishes so resin can drip back into the tank.' },
};

export const MultipleParagraphs: Story = {
  args: {
    citation: 'Formlabs Support',
    source: 'Cleaning the resin tank',
    children: (
      <>
        <p>Never use metal tools on the tank film. Use the plastic scraper included with the Finish Kit.</p>
        <p>If cured resin is stuck to the film, run the tank cleaning routine from the printer menu before scraping.</p>
      </>
    ),
  },
};
