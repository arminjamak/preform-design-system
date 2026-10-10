/**
 * Story-only demo media for VideoPlayer, AudioPlayer, ImageCropper, DocumentPreview and TranscriptViewer.
 * Colour literals here are image content (SVG artwork), not UI styling.
 */
import type { TranscriptLine } from '../../components/TranscriptViewer/TranscriptViewer';

/** CC0 samples from MDN interactive examples. */
export const DEMO_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
export const DEMO_AUDIO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';

const svgUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/* ------------------------------------------------------------------ */
/* Artwork                                                              */
/* ------------------------------------------------------------------ */

const RESIN = { grey: '#8d9298', clear: '#bcd9f2', tough: '#3c4551', castable: '#e2a24b' };

/** Support tree: a thin column with a touchpoint cone, from the platform up to `top`. */
const support = (x: number, base: number, top: number, w = 3) =>
  `<path d="M${x - w * 2} ${base} L${x + w * 2} ${base} L${x + w / 2} ${base - 10} L${x + w / 2} ${top + 8} L${x + 1} ${top} L${x - 1} ${top} L${x - w / 2} ${top + 8} L${x - w / 2} ${base - 10} Z" fill="#c9ced4"/>`;

/** Isometric build platform with a bracket, a lattice cube and a dental arch on support trees. */
export function buildPlatformSvg(width = 1600, height = 1200) {
  const supports = [
    ...[520, 580, 640, 700, 760, 820].map((x, i) => support(x, 905, 640 + (i % 2) * 14)),
    ...[1010, 1060, 1110, 1160].map((x) => support(x, 880, 610)),
    ...[300, 350, 400].map((x) => support(x, 930, 700)),
  ].join('');
  const lattice = Array.from({ length: 5 }, (_, i) =>
    `<line x1="${990 + i * 45}" y1="400" x2="${990 + i * 45}" y2="600" stroke="${RESIN.clear}" stroke-width="8"/><line x1="990" y1="${400 + i * 50}" x2="1170" y2="${400 + i * 50}" stroke="${RESIN.clear}" stroke-width="8"/>`,
  ).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1600 1200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f4"/><stop offset="1" stop-color="#d6d9dd"/></linearGradient>
    <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b2b6bc"/><stop offset="1" stop-color="#767b82"/></linearGradient>
    <linearGradient id="part" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a6abb2"/><stop offset="1" stop-color="#5d636b"/></linearGradient>
    <linearGradient id="arch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3c98a"/><stop offset="1" stop-color="${RESIN.castable}"/></linearGradient>
  </defs>
  <rect width="1600" height="1200" fill="url(#bg)"/>
  <g stroke="#c4c8cd" stroke-width="1">${Array.from({ length: 16 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="1200"/>`).join('')}${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${i * 100}" x2="1600" y2="${i * 100}"/>`).join('')}</g>
  <path d="M180 920 L800 1080 L1420 900 L800 760 Z" fill="url(#plate)"/>
  <path d="M180 920 L800 1080 L800 1110 L180 950 Z" fill="#4b5056"/>
  <path d="M800 1080 L1420 900 L1420 930 L800 1110 Z" fill="#30343a"/>
  ${supports}
  <path d="M470 640 L860 600 L900 520 L900 470 L780 470 L780 540 L500 570 Z" fill="url(#part)"/>
  <circle cx="840" cy="505" r="18" fill="#3c4551"/>
  <rect x="980" y="390" width="200" height="220" rx="6" fill="none" stroke="${RESIN.clear}" stroke-width="10" opacity="0.9"/>
  ${lattice}
  <path d="M260 700 C 260 560, 440 560, 440 700 L 410 700 C 410 600, 290 600, 290 700 Z" fill="url(#arch)"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${270 + i * 26}" y="${612 - Math.sin((i / 5) * Math.PI) * 28}" width="20" height="26" rx="8" fill="#f7dcb0"/>`).join('')}
  <text x="60" y="90" font-family="Figtree, sans-serif" font-size="40" font-weight="700" fill="#30343a">Form 4 · Build platform</text>
  <text x="60" y="140" font-family="Figtree, sans-serif" font-size="28" fill="#4b5056">Grey V5 · 0.05 mm · 1,204 layers</text>
</svg>`;
  return svgUri(svg);
}

/** 16:9 poster for the tutorial video. */
export function videoPosterSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2129"/><stop offset="1" stop-color="#0b2f55"/></linearGradient>
  <linearGradient id="hood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7c466" stop-opacity="0.85"/><stop offset="1" stop-color="#dd8c10" stop-opacity="0.6"/></linearGradient></defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <rect x="760" y="140" width="320" height="480" rx="18" fill="#30343a"/>
  <rect x="780" y="160" width="280" height="300" rx="10" fill="url(#hood)"/>
  <rect x="820" y="230" width="200" height="16" rx="4" fill="#b2b6bc"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${850 + i * 40}" y="246" width="18" height="${70 + (i % 2) * 30}" rx="4" fill="#8d9298"/>`).join('')}
  <rect x="780" y="480" width="280" height="120" rx="10" fill="#3c4551"/>
  <circle cx="1020" cy="540" r="10" fill="#22b922"/>
  <text x="96" y="300" font-family="Figtree, sans-serif" font-size="30" font-weight="600" fill="#9cc0ea">PreForm tutorial</text>
  <text x="96" y="372" font-family="Figtree, sans-serif" font-size="56" font-weight="800" fill="#ffffff">Preparing a print</text>
  <text x="96" y="440" font-family="Figtree, sans-serif" font-size="56" font-weight="800" fill="#ffffff">for the Form 4</text>
  <text x="96" y="500" font-family="Figtree, sans-serif" font-size="26" fill="#d6d9dd">Orient · Support · Layout · Validate · Send</text>
</svg>`;
  return svgUri(svg);
}

/** One portrait page of a print job report. */
function reportPageSvg(page: number, total: number) {
  const rows = [
    ['Printer', 'Form 4 · Studio-04'],
    ['Material', 'Grey V5'],
    ['Layer height', '0.05 mm'],
    ['Layers', '1,204'],
    ['Print time', '2 h 18 min'],
    ['Resin volume', '86.4 mL'],
    ['Parts', '6 · all supported'],
  ];
  const heading = ['Job summary', 'Part list', 'Layer preview', 'Validation'][page - 1] ?? 'Notes';
  const body =
    page === 1
      ? rows
          .map(
            ([k, v], i) =>
              `<text x="80" y="${330 + i * 54}" font-size="24" fill="#767b82">${k}</text><text x="770" y="${330 + i * 54}" font-size="24" text-anchor="end" fill="#30343a" font-weight="600">${v}</text><line x1="80" x2="770" y1="${346 + i * 54}" y2="${346 + i * 54}" stroke="#eceef0"/>`,
          )
          .join('')
      : page === 3
        ? Array.from({ length: 6 }, (_, i) => `<rect x="${80 + (i % 3) * 235}" y="${300 + Math.floor(i / 3) * 250}" width="215" height="215" rx="10" fill="#f3f4f6"/><circle cx="${187 + (i % 3) * 235}" cy="${407 + Math.floor(i / 3) * 250}" r="${40 + i * 9}" fill="none" stroke="#0a63c9" stroke-width="6"/><text x="${187 + (i % 3) * 235}" y="${500 + Math.floor(i / 3) * 250}" font-size="18" text-anchor="middle" fill="#767b82">Layer ${(i + 1) * 200}</text>`).join('')
        : Array.from({ length: 9 }, (_, i) => `<rect x="80" y="${300 + i * 58}" width="${280 + ((i * 97) % 380)}" height="22" rx="6" fill="${i % 3 === 0 ? '#dbe8f8' : '#eceef0'}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="1100" viewBox="0 0 850 1100" font-family="Figtree, sans-serif">
  <rect width="850" height="1100" fill="#ffffff"/>
  <rect width="850" height="12" fill="#0a63c9"/>
  <text x="80" y="120" font-size="22" font-weight="600" fill="#0a63c9">PreForm print report</text>
  <text x="80" y="180" font-size="44" font-weight="800" fill="#1b2129">${heading}</text>
  <text x="80" y="225" font-size="22" fill="#767b82">Bracket_v3_batch.form · 12 Oct 2026</text>
  ${body}
  <text x="425" y="1050" font-size="18" text-anchor="middle" fill="#b2b6bc">Page ${page} of ${total}</text>
</svg>`;
  return svgUri(svg);
}

export const reportPages = (n = 4) => Array.from({ length: n }, (_, i) => reportPageSvg(i + 1, n));

/* ------------------------------------------------------------------ */
/* Text, captions, transcript                                          */
/* ------------------------------------------------------------------ */

export const DEMO_GCODE = [
  '; PreForm export · Bracket_v3_batch',
  '; printer: Form 4  material: Grey V5  layer: 0.050 mm',
  '; layers: 1204  est. time: 2h18m  resin: 86.4 mL',
  '; supports: auto, density 1.00, touchpoint 0.45 mm',
  'G21 ; units: mm',
  'G90 ; absolute positioning',
  'M140 S35 ; resin tank to 35 °C',
  'M190 S35',
  'G28 Z ; home build platform',
  'G1 Z0.050 F120',
  ';LAYER:0',
  'M106 P1 S255 ; light engine on',
  'G4 P2600 ; expose 2.6 s',
  'M107 P1',
  'G1 Z6.000 F300 ; peel',
  'G1 Z0.100 F150',
  ';LAYER:1',
  'M106 P1 S255',
  'G4 P2600',
  'M107 P1',
  'G1 Z6.050 F300',
  'G1 Z0.150 F150',
  ';LAYER:2',
  'M106 P1 S255',
  'G4 P1800',
  'M107 P1',
  'G1 Z6.100 F300',
  'G1 Z0.200 F150',
  ...Array.from({ length: 60 }, (_, i) => {
    const l = i + 3;
    return [`;LAYER:${l}`, 'M106 P1 S255', 'G4 P1800', 'M107 P1', `G1 Z${(6 + l * 0.05).toFixed(3)} F300`, `G1 Z${(0.05 * (l + 1)).toFixed(3)} F150`];
  }).flat(),
].join('\n');

/** Captions for the 5-second demo clip. */
const CAPTION_CUES: Array<[number, number, string]> = [
  [0, 1.55, 'Start by opening your part in PreForm.'],
  [1.6, 3.15, 'Choose Form 4 and Grey V5 at 0.05 mm.'],
  [3.2, 6, 'Then press One-Click Print.'],
];
const CAPTION_CUES_DE: Array<[number, number, string]> = [
  [0, 1.55, 'Öffnen Sie zuerst Ihr Bauteil in PreForm.'],
  [1.6, 3.15, 'Wählen Sie Form 4 und Grey V5 mit 0,05 mm.'],
  [3.2, 6, 'Drücken Sie dann One-Click Print.'],
];

const vttStamp = (t: number) => `00:${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(3).padStart(6, '0')}`;
const toVtt = (cues: Array<[number, number, string]>) => `WEBVTT\n\n${cues.map(([a, b, text], i) => `${i + 1}\n${vttStamp(a)} --> ${vttStamp(b)}\n${text}`).join('\n\n')}\n`;
const vttUrl = (cues: Array<[number, number, string]>) =>
  typeof URL !== 'undefined' && typeof Blob !== 'undefined' ? URL.createObjectURL(new Blob([toVtt(cues)], { type: 'text/vtt' })) : '';

let cachedTracks: { en: string; de: string } | null = null;
/** Same-origin blob URLs for the English and German caption tracks. */
export function captionTracks() {
  cachedTracks ??= { en: vttUrl(CAPTION_CUES), de: vttUrl(CAPTION_CUES_DE) };
  return cachedTracks;
}

/** The demo clip's captions as transcript lines (for the linked VideoPlayer + TranscriptViewer story). */
export const CLIP_TRANSCRIPT: TranscriptLine[] = CAPTION_CUES.map(([start, end, text]) => ({ start, end, speaker: 'Narrator', text }));

/** "Preparing a print for the Form 4" tutorial transcript (~3 min). */
export const FORM4_TRANSCRIPT: TranscriptLine[] = [
  { start: 0, speaker: 'Maya (Formlabs)', text: 'Hi, I’m Maya from the Formlabs applications team. Today we’re preparing a print for the Form 4 in PreForm.' },
  { start: 7, speaker: 'Maya (Formlabs)', text: 'Start by importing your model. Drag the STL or OBJ onto the build platform, or use File, Open.' },
  { start: 15, speaker: 'Maya (Formlabs)', text: 'In the Job Setup panel, pick Form 4 as the printer and choose your resin. I’m using Grey V5 at a 0.05 millimetre layer height.' },
  { start: 26, speaker: 'Leo (Engineer)', text: 'Quick question: when would you choose 0.1 millimetre instead?' },
  { start: 30, speaker: 'Maya (Formlabs)', text: 'For draft parts and large enclosures. Thicker layers cut print time roughly in half, with slightly more visible layer lines.' },
  { start: 39, speaker: 'Maya (Formlabs)', text: 'Next, orientation. Click Orient and let PreForm angle the part so large flat areas don’t face the tank directly.' },
  { start: 49, speaker: 'Maya (Formlabs)', text: 'Tilting the bracket around thirty degrees reduces peel forces and keeps cosmetic faces free of support marks.' },
  { start: 58, speaker: 'Leo (Engineer)', text: 'And the red areas on the model are the unsupported regions?' },
  { start: 62, speaker: 'Maya (Formlabs)', text: 'Exactly. Red marks minima and overhangs that need supports. Now open Supports and click Auto-Generate.' },
  { start: 71, speaker: 'Maya (Formlabs)', text: 'The default density of 1.00 and a touchpoint size of 0.45 millimetres work for most engineering parts.' },
  { start: 80, speaker: 'Maya (Formlabs)', text: 'If you need easier removal on a cosmetic surface, lower the touchpoint size and add a few manual supports.' },
  { start: 91, speaker: 'Maya (Formlabs)', text: 'With several parts, use Layout, Auto Layout to pack them on the platform with the minimum spacing.' },
  { start: 100, speaker: 'Leo (Engineer)', text: 'Does packing more parts change print time much?' },
  { start: 104, speaker: 'Maya (Formlabs)', text: 'On the Form 4, time depends mostly on part height, so filling the platform is almost free.' },
  { start: 113, speaker: 'Maya (Formlabs)', text: 'Before sending, check the Print Validation panel. Green checks mean the job is printable; warnings link to the problem area.' },
  { start: 124, speaker: 'Maya (Formlabs)', text: 'Scrub the layer slider to inspect cross-sections and confirm there are no islands or thin walls under 0.3 millimetres.' },
  { start: 135, speaker: 'Maya (Formlabs)', text: 'Finally, click Start a Print, choose your printer on the network, and it joins the queue.' },
  { start: 144, speaker: 'Maya (Formlabs)', text: 'You can watch progress from the Dashboard. Once it’s done, wash in Form Wash and cure in Form Cure. Happy printing!' },
];
export const FORM4_TRANSCRIPT_DURATION = 156;

/** Deterministic waveform amplitudes (roar-like envelope). */
export function demoWaveform(n = 96) {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const env = Math.exp(-((t - 0.32) ** 2) / 0.03) + 0.55 * Math.exp(-((t - 0.7) ** 2) / 0.02) + 0.08;
    return env * (0.55 + 0.45 * rand());
  });
}

/* ------------------------------------------------------------------ */
/* Minimal PDF (built in-memory so the iframe preview has a same-origin source) */
/* ------------------------------------------------------------------ */

function buildPdf(lines: string[]): string {
  const esc = (s: string) => s.replace(/[\\()]/g, (m) => `\\${m}`);
  const content = [
    'BT /F2 22 Tf 56 760 Td (PreForm print report) Tj ET',
    'BT /F1 11 Tf 56 736 Td (Bracket_v3_batch.form  -  Form 4  -  Grey V5) Tj ET',
    ...lines.map((l, i) => `BT /F1 12 Tf 56 ${690 - i * 22} Td (${esc(l)}) Tj ET`),
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return out;
}

let cachedPdf: string | null = null;
/** Blob URL of a one-page print report PDF. */
export function demoPdfUrl() {
  if (cachedPdf == null) {
    const pdf = buildPdf([
      'Printer: Form 4 (Studio-04)',
      'Material: Grey V5, 0.05 mm layers',
      'Layers: 1,204   Print time: 2 h 18 min',
      'Resin volume: 86.4 mL   Parts: 6',
      'Validation: passed (0 warnings)',
    ]);
    cachedPdf = typeof Blob !== 'undefined' ? URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' })) : '';
  }
  return cachedPdf;
}
