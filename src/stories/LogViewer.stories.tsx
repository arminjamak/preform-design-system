import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { LogViewer, type LogEntry, type LogLevel } from '../components/LogViewer/LogViewer';

/** Deterministic PRNG so the generated Form 4 log is identical on every render. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Template = { level: LogLevel; source: string; message: (n: number, r: () => number) => string; weight: number };

const LAYERS = 1650;
const TEMPLATES: Template[] = [
  { level: 'info', source: 'print', weight: 30, message: (n, r) => `Layer ${Math.min(LAYERS, 1 + Math.floor(n / 3))}/${LAYERS} exposed in ${(1.6 + r() * 0.5).toFixed(2)} s` },
  { level: 'debug', source: 'lpu', weight: 18, message: (_, r) => `LPU frame uploaded, ${(410 + r() * 40).toFixed(0)} kB, panel temp ${(38 + r() * 2).toFixed(1)} °C` },
  { level: 'debug', source: 'motion', weight: 14, message: (_, r) => `Peel complete, force ${(14 + r() * 8).toFixed(1)} N, z = ${(r() * 80).toFixed(3)} mm` },
  { level: 'info', source: 'heater', weight: 10, message: (_, r) => `Resin temperature ${(34.6 + r() * 0.8).toFixed(1)} °C (target 35.0 °C)` },
  { level: 'debug', source: 'tank', weight: 8, message: (_, r) => `Wiper pass ${Math.floor(r() * 3) + 1}/3 complete` },
  { level: 'info', source: 'cartridge', weight: 6, message: (_, r) => `Cartridge FLGPGR05 dispensed ${(r() * 1.5).toFixed(2)} mL, ${Math.floor(600 - r() * 200)} mL remaining` },
  { level: 'debug', source: 'network', weight: 5, message: (_, r) => `Dashboard heartbeat ok (${Math.floor(40 + r() * 60)} ms), Wi-Fi RSSI −${Math.floor(50 + r() * 15)} dBm` },
  { level: 'warn', source: 'tank', weight: 3, message: (_, r) => `Resin level low in tank (fill ${Math.floor(30 + r() * 10)} %), refilling from cartridge` },
  { level: 'warn', source: 'heater', weight: 2, message: (_, r) => `Resin temperature drift ${(1 + r()).toFixed(1)} °C below target, extending pre-heat` },
  { level: 'error', source: 'cartridge', weight: 1, message: (_, r) => `Cartridge valve did not open (E0301), retrying ${Math.floor(r() * 3) + 1}/3` },
  { level: 'error', source: 'lpu', weight: 1, message: () => 'LPU panel checksum mismatch on frame upload, re-sending layer' },
];
const TOTAL_WEIGHT = TEMPLATES.reduce((sum, t) => sum + t.weight, 0);
const START = Date.parse('2026-10-10T08:12:04.000');

function makeEntry(i: number, r: () => number): LogEntry {
  let pick = r() * TOTAL_WEIGHT;
  const tpl = TEMPLATES.find((t) => (pick -= t.weight) < 0) ?? TEMPLATES[0];
  return { id: i, time: START + i * 1450 + Math.floor(r() * 400), level: tpl.level, source: tpl.source, message: tpl.message(i, r) };
}

function makeLog(count: number, seed = 4): LogEntry[] {
  const r = mulberry32(seed);
  const out: LogEntry[] = [
    { id: 'boot-1', time: START - 4200, level: 'info', source: 'system', message: 'Form 4 (Form4-SmoothPeacock) firmware 1.9.2 booted' },
    { id: 'boot-2', time: START - 2100, level: 'info', source: 'print', message: 'Job job_7f3c2a91 "Dental arch batch — 12 models" started, Grey V5, 50 µm' },
  ];
  for (let i = 0; i < count - 2; i++) out.push(makeEntry(i, r));
  return out;
}

const bigLog = makeLog(5000);
const shortLog = makeLog(40, 9);

const meta = {
  title: 'Components/Specialized/LogViewer',
  component: LogViewer,
  tags: ['expanded'],
  args: { entries: bigLog, follow: true, onFollowChange: fn(), height: 'md', wrap: false, showLineNumbers: true, label: 'Form 4 device log' },
  argTypes: {
    entries: { control: false },
    height: { control: 'select', options: ['sm', 'md', 'lg', 'var(--size-layout-panel)'] },
    follow: { control: 'boolean' },
    wrap: { control: 'boolean' },
    showLineNumbers: { control: 'boolean' },
    label: { control: 'text' },
  },
  decorators: [(Story) => <div style={{ width: 'calc(var(--size-layout-dialog-lg) + var(--size-layout-panel))' }}><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'Windowed log console for Form 4 device logs and PreForm service logs: level filter chips, search highlight, follow-tail, wrap and line-number toggles, jump to latest. Levels map to --color-fg-muted, --color-status-info-strong, --color-status-warning-strong and --color-status-danger.',
      },
    },
  },
} satisfies Meta<typeof LogViewer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ShortLogWrapped: Story = {
  name: 'Short log, wrapped',
  args: { entries: shortLog, wrap: true, height: 'sm' },
};

export const WithoutLineNumbers: Story = { args: { entries: shortLog, showLineNumbers: false, height: 'sm' } };

export const NotFollowing: Story = {
  name: 'Follow off (starts at top)',
  args: { follow: false },
};

export const Empty: Story = { args: { entries: [], height: 'sm' } };

/** Appends a line every few motion-token steps to show follow-tail and "Jump to latest". */
export const LiveTail: Story = {
  args: { height: 'md' },
  render: function Render(args) {
    const [entries, setEntries] = useState(() => makeLog(200, 21));
    useEffect(() => {
      const r = mulberry32(77);
      const step = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--motion-duration-slow')) || 0;
      if (!step) return;
      const id = window.setInterval(() => {
        setEntries((prev) => [...prev, { ...makeEntry(prev.length, r), id: `live-${prev.length}`, time: Date.now() }]);
      }, step * 3);
      return () => window.clearInterval(id);
    }, []);
    return <LogViewer {...args} entries={entries} />;
  },
};
