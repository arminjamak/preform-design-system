import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { SearchField } from '../components/SearchField/SearchField';
import { StateMatrix } from './helpers/StateMatrix';

const meta = {
  title: 'Components/Inputs/SearchField',
  component: SearchField,
  tags: ['expanded'],
  args: {
    label: 'Search models',
    value: 'bracket',
    onChange: fn(),
    onSearch: fn(),
    placeholder: 'Search models…',
    size: 'sm',
    loading: false,
    fullWidth: false,
    disabled: false,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    'data-state': { control: 'inline-radio', options: [undefined, 'hover', 'focus'], name: 'forced state' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Search box for the model list, material library and print queue. Built on TextField with a leading search icon, a clear IconButton once there is text, Escape to clear and Enter to call `onSearch`; `loading` shows a muted Spinner.',
      },
    },
  },
  render: function Render(args) {
    const [{ value }, update] = useArgs();
    return <SearchField {...args} value={value} onChange={(v) => update({ value: v })} />;
  },
} satisfies Meta<typeof SearchField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Empty: Story = { args: { value: '', label: 'Search materials', placeholder: 'Search materials…' } };

export const Loading: Story = { args: { value: 'Grey V5', label: 'Search materials', loading: true } };

export const Sizes: Story = {
  render: (args) => (
    <div className="sb-stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <SearchField key={size} {...args} size={size} onChange={() => {}} />
      ))}
    </div>
  ),
};

const MODELS = ['Bracket_v3.stl', 'Hinge bracket.form', 'Dental arch (upper).stl', 'Gear housing.obj', 'Phone stand.3mf'];

export const FilteringAList: Story = {
  name: 'Filtering a list',
  render: function Render(args) {
    const [query, setQuery] = useState('');
    const hits = MODELS.filter((m) => m.toLowerCase().includes(query.toLowerCase()));
    return (
      <div className="sb-panel-demo sb-stack">
        <SearchField {...args} fullWidth value={query} onChange={setQuery} />
        <ul className="pf-text-body-sm" aria-live="polite">
          {hits.length ? hits.map((m) => <li key={m}>{m}</li>) : <li>No models match “{query}”</li>}
        </ul>
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
        { label: 'empty', render: (p) => <SearchField {...args} value="" onChange={() => {}} {...p} /> },
        { label: 'with query', render: (p) => <SearchField {...args} onChange={() => {}} {...p} /> },
        { label: 'loading', render: (p) => <SearchField {...args} loading onChange={() => {}} {...p} /> },
      ]}
    />
  ),
};
