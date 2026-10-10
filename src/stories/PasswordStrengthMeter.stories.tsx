import type { Meta, StoryObj } from '@storybook/react-vite';
import { PasswordStrengthMeter, scorePassword } from '../components/PasswordField/PasswordStrengthMeter';

const meta = {
  title: 'Components/Inputs/PasswordStrengthMeter',
  component: PasswordStrengthMeter,
  tags: ['expanded'],
  args: { value: 'Form4-Lab', label: 'Password strength' },
  argTypes: {
    score: { control: 'inline-radio', options: [undefined, 0, 1, 2, 3, 4] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Four-segment strength bar with a text label. Scores 0–4 from length (8+, 12+), mixed case, digits and symbols; segments use `--color-status-danger`, `-warning`, `-info` and `-success`. Rendered by PasswordField when `showStrength` is set.',
      },
    },
  },
} satisfies Meta<typeof PasswordStrengthMeter>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="sb-panel-demo">
      <PasswordStrengthMeter {...args} />
    </div>
  ),
};

const SAMPLES = ['', 'resin', 'printer1', 'Printer12', 'Printer12!', 'Grey-V5-resin-tank!'];

export const Scores: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="sb-matrix">
      <thead>
        <tr>
          <th className="pf-text-caption">Password</th>
          <th className="pf-text-caption">Score</th>
          <th className="pf-text-caption">Meter</th>
        </tr>
      </thead>
      <tbody>
        {SAMPLES.map((pw) => (
          <tr key={pw || 'empty'}>
            <td className="pf-text-mono">{pw || '(empty)'}</td>
            <td className="pf-text-body-sm">{scorePassword(pw)}</td>
            <td className="sb-panel-demo">
              <PasswordStrengthMeter value={pw} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
