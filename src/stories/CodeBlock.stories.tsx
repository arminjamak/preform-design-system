import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeBlock } from '../components/CodeBlock/CodeBlock';

const GCODE = `; PreForm 3.44.1 | Form 3+ | Grey V5 | 0.050 mm
; Job: dental_arch_upper.form   Layers: 1284   Est. 4 h 12 min
G21              ; units: millimetres
G90              ; absolute positioning
M140 S35         ; heat resin tank to 35 C
M190 S35         ; wait for tank temperature
G28 Z            ; home build platform
G1 Z0.050 F300   ; lower to first layer
T0               ; select laser 0
G1 X12.400 Y48.150 F6000
G1 X58.920 Y48.150 E0.0415
G1 X58.920 Y91.780 E0.0388
M400             ; wait for moves to finish
M117 Layer 1/1284`;

const PYTHON = `"""Batch-prepare dental models with the PreForm Local API."""
import pathlib
import requests

PREFORM = "http://localhost:44388"
CASES = pathlib.Path("~/cases/2026-10-10").expanduser()


def prepare(stl: pathlib.Path, layer_height: float = 0.05) -> str:
    scene = requests.post(f"{PREFORM}/scene/", json={
        "machine_type": "FORM-4-0",
        "material_code": "FLGPGR05",
        "layer_thickness_mm": layer_height,
    }).json()
    requests.post(f"{PREFORM}/scene/import-model/", json={"file": str(stl)})
    requests.post(f"{PREFORM}/scene/auto-orient/", json={"models": "ALL"})
    requests.post(f"{PREFORM}/scene/auto-support/", json={"models": "ALL", "density": 1.0})
    return scene["id"]


for stl in sorted(CASES.glob("*.stl")):
    print(f"Prepared {stl.name} -> {prepare(stl)}")  # one scene per arch`;

const JSON_SETTINGS = `{
  "printer": "Form 4",
  "material": "Grey V5",
  "layer_height_mm": 0.05,
  "supports": {
    "density": 1.0,
    "touchpoint_size_mm": 0.45,
    "internal_supports": false
  },
  "orientation": { "auto": true, "min_angle_deg": 15 },
  "estimated_print_time_min": 252,
  "resin_ml": 38.6,
  "notes": null
}`;

const TYPESCRIPT = `import type { PrintJob } from './types';

const PREFORM_URL = 'http://localhost:44388';

/** Sends a prepared scene to a printer queue and returns the job id. */
export async function queuePrint(job: PrintJob, printer = 'Form4-CapableGecko'): Promise<string> {
  const res = await fetch(\`\${PREFORM_URL}/scene/\${job.sceneId}/print/\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ printer, job_name: job.name }),
  });
  if (!res.ok) throw new Error(\`Queue failed: \${res.status}\`);
  const { job_id } = await res.json();
  return job_id;
}`;

const BASH = `#!/usr/bin/env bash
# Start PreForm Server headless and print its version
set -euo pipefail
PORT=\${PREFORM_PORT:-44388}
./PreFormServer --port "$PORT" &
sleep 5
curl -s "http://localhost:$PORT/" | jq '.version'`;

const CSS = `/* Print report: flag layers with failed exposures */
.layer-row--failed {
  background: var(--color-status-danger-soft);
  border-left: 3px solid #e02424;
}
@media print {
  .viewport { display: none !important; }
}`;

const LONG_LINE = `{"job_id":"7f3a9c2e-form4-capablegecko","scene":"dental_arch_upper.form","printer":"Form4-CapableGecko","material":"FLGPGR05","layer_height_mm":0.05,"status":"PRINTING","progress":{"layer":412,"total_layers":1284,"eta_min":171}}`;

const MAX_HEIGHTS = [undefined, 'calc(var(--space-24) * 2)', 'calc(var(--space-24) * 3)', 'var(--size-layout-panel)'];

const meta = {
  title: 'Components/Media/CodeBlock',
  component: CodeBlock,
  tags: ['expanded'],
  args: {
    code: GCODE,
    language: 'gcode',
    filename: 'dental_arch_upper.gcode',
    showLineNumbers: true,
    highlightLines: [7, 8],
    wrap: false,
    maxHeight: undefined,
    showCopy: true,
    showWrapToggle: true,
    showHeader: true,
  },
  argTypes: {
    code: { control: 'text' },
    language: { control: 'select', options: ['typescript', 'javascript', 'json', 'python', 'bash', 'gcode', 'css', 'text'] },
    highlightLines: { control: 'object' },
    maxHeight: { control: 'select', options: MAX_HEIGHTS, description: 'Token expression; content scrolls beyond it.' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Read-only, syntax-highlighted code for API docs, job logs and settings exports. A built-in tokenizer covers TypeScript/JavaScript, JSON, Python, Bash, G-code and CSS; syntax colours map to semantic tokens (accent keywords, success-strong strings, warning-strong numbers, muted comments) so both themes read. Mono text uses `--typography-mono-*`; highlighted lines use `--color-bg-accent-subtle`.',
      },
    },
  },
  decorators: [(Story) => <div style={{ width: 'calc(var(--size-layout-dialog-lg) + var(--space-24))', maxWidth: '100%' }}><Story /></div>],
} satisfies Meta<typeof CodeBlock>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const PythonApi: Story = {
  name: 'Python (PreForm Local API)',
  args: { code: PYTHON, language: 'python', filename: 'prepare_cases.py', highlightLines: [11, 12, 13] },
};

export const Languages: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="sb-stack" style={{ alignItems: 'stretch' }}>
      <CodeBlock code={JSON_SETTINGS} language="json" filename="print_settings.json" />
      <CodeBlock code={TYPESCRIPT} language="ts" filename="queuePrint.ts" />
      <CodeBlock code={BASH} language="bash" filename="start-preform-server.sh" />
      <CodeBlock code={CSS} language="css" filename="print-report.css" />
    </div>
  ),
};

export const HighlightedLines: Story = {
  args: { code: JSON_SETTINGS, language: 'json', filename: 'print_settings.json', highlightLines: [4, 5, 6, 7, 8] },
};

export const WrapLongLines: Story = {
  args: { code: LONG_LINE, language: 'json', filename: 'job_status.json', wrap: true, highlightLines: [] },
};

export const MaxHeightScroll: Story = {
  name: 'Max height (scrolls)',
  args: { code: PYTHON, language: 'python', filename: 'prepare_cases.py', maxHeight: 'calc(var(--space-24) * 2)', highlightLines: [] },
};

export const Minimal: Story = {
  name: 'No header, no line numbers',
  args: { code: 'pip install formlabs-local-api==0.9.1', language: 'bash', filename: undefined, showHeader: false, showLineNumbers: false, highlightLines: [] },
};
