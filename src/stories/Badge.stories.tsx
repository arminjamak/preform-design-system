import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckIcon } from 'lucide-react';
import { Badge, PassBadge } from '../components';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Current', tone: 'accent', variant: 'solid', size: 'sm' },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'accent', 'success', 'warning', 'danger', 'info'] },
    variant: { control: 'inline-radio', options: ['solid', 'soft', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    icon: { control: 'boolean', mapping: { true: <CheckIcon strokeWidth={3} />, false: undefined } },
  },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="sb-matrix">
      <tbody>
        {(['solid', 'soft', 'outline'] as const).map((v) => (
          <tr key={v}>
            <th className="pf-text-caption">{v}</th>
            {(['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const).map((t) => (
              <td key={t}>
                <Badge tone={t} variant={v}>
                  {t}
                </Badge>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
export const Pass: Story = { name: 'PassBadge', render: () => <div className="sb-row"><PassBadge /><PassBadge size="md" /></div> };
