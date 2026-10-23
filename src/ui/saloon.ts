// The saloon behind the card table: plank wall, two windows onto the sunset, a mirrored
// back bar with bottles, hanging lamps and the floor. One SVG on the 1600x900 stage.

const WINDOWS = [
  { x: 326, y: 106, w: 150, h: 128 },
  { x: 1124, y: 106, w: 150, h: 128 },
];

/** Deterministic jitter so the room looks the same every time. */
function noise(i: number) {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function bottles(x0: number, x1: number, base: number, seed: number): string {
  const glass = ['#7a3e12', '#2f5a34', '#5a2a10', '#9a6a2a', '#3a2a40', '#b08a4a'];
  let x = x0;
  let i = seed;
  let out = '';
  while (x < x1 - 14) {
    const kind = Math.floor(noise(i) * 4);
    const col = glass[Math.floor(noise(i + 9) * glass.length)];
    const w = kind === 1 ? 26 : kind === 3 ? 22 : 16 + noise(i + 3) * 6;
    const hgt = kind === 1 ? 30 : 46 + noise(i + 5) * 26;
    const cx = x + w / 2;
    let body: string;
    if (kind === 1) {
      // A round jug with a little handle.
      body = `<ellipse cx="${cx}" cy="${base - 14}" rx="${w / 2}" ry="14" fill="${col}"/><rect x="${cx - 4}" y="${base - 34}" width="8" height="9" rx="2" fill="${col}"/>
        <path d="M${cx + w / 2 - 2},${base - 22} q8,2 2,12" fill="none" stroke="#1a0b04" stroke-width="2"/>`;
    } else {
      const neck = kind === 3 ? 6 : 5;
      const shoulder = base - hgt * 0.62;
      body = `<path d="M${x},${base} V${shoulder + 6} Q${x},${shoulder} ${cx - neck},${shoulder - 6} V${base - hgt} H${cx + neck} V${shoulder - 6} Q${x + w},${shoulder} ${x + w},${shoulder + 6} V${base} Z" fill="${col}"/>
        <rect x="${cx - neck - 1}" y="${base - hgt - 4}" width="${neck * 2 + 2}" height="5" rx="1.5" fill="#c9a46a"/>
        ${kind !== 3 ? `<rect x="${x + 2}" y="${shoulder + 12}" width="${w - 4}" height="${Math.min(18, hgt * 0.28)}" fill="#ead2a8" opacity="0.85"/>` : ''}`;
    }
    out += `<g class="bottle">${body}<path d="M${x + 3.5},${base - 4} V${base - hgt * 0.55}" stroke="rgba(255,240,210,0.45)" stroke-width="2" stroke-linecap="round"/></g>`;
    x += w + 6 + noise(i + 7) * 8;
    i++;
  }
  return out;
}

function lamp(cx: number) {
  return `<g class="lamp">
    <line x1="${cx}" y1="80" x2="${cx}" y2="104" stroke="#1a0b04" stroke-width="2"/>
    <path d="M${cx - 6},104 h12 l2,6 h-16 z" fill="#c99a3a" stroke="#1a0b04" stroke-width="1.2"/>
    <path d="M${cx - 30},132 L${cx - 10},110 H${cx + 10} L${cx + 30},132 Z" fill="#2f5a34" stroke="#1a0b04" stroke-width="1.5"/>
    <path d="M${cx - 30},132 H${cx + 30}" stroke="#c99a3a" stroke-width="2.5"/>
    <ellipse cx="${cx}" cy="135" rx="11" ry="5" fill="#fff3c0"/>
  </g>`;
}

export function saloonBackdrop(): string {
  const wallHoles = WINDOWS.map((w) => `M${w.x},${w.y} h${w.w} v${w.h} h-${w.w} Z`).join(' ');
  const frames = WINDOWS.map(
    (w) => `<g class="window">
      <rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" fill="url(#dusk)"/>
      <circle cx="${w.x + w.w * 0.62}" cy="${w.y + w.h * 0.7}" r="22" fill="#ffe1a0"/>
      <path d="M${w.x},${w.y + w.h * 0.78} l18,-16 h22 l8,-10 h20 l10,14 h26 l12,-8 h20 l14,12 V${w.y + w.h} H${w.x} Z" fill="#6a2a2a"/>
      <path d="M${w.x},${w.y + w.h * 0.9} h${w.w} V${w.y + w.h} H${w.x} Z" fill="#3a1414"/>
      <rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" fill="url(#glass)"/>
      <path d="M${w.x + w.w / 2},${w.y} V${w.y + w.h} M${w.x},${w.y + w.h / 2} H${w.x + w.w}" stroke="#3a1b09" stroke-width="6"/>
      <rect x="${w.x - 6}" y="${w.y - 6}" width="${w.w + 12}" height="${w.h + 12}" fill="none" stroke="#3a1b09" stroke-width="10"/>
      <rect x="${w.x - 11}" y="${w.y - 11}" width="${w.w + 22}" height="${w.h + 22}" fill="none" stroke="#1a0b04" stroke-width="1.5"/>
      <rect x="${w.x - 14}" y="${w.y + w.h + 6}" width="${w.w + 28}" height="9" fill="#5e2e12" stroke="#1a0b04" stroke-width="1.5"/>
      <path d="M${w.x + 10},${w.y + 50} l26,-30 M${w.x + 16},${w.y + 60} l34,-40" stroke="rgba(255,240,210,0.18)" stroke-width="4" stroke-linecap="round"/>
    </g>`,
  ).join('');
  return `<svg class="saloon-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <pattern id="planks" width="44" height="900" patternUnits="userSpaceOnUse">
      <rect width="44" height="900" fill="#4a240f"/>
      <rect x="0" width="22" height="900" fill="#52280f" opacity="0.6"/>
      <path d="M0,0 V900" stroke="#1e0d04" stroke-width="2"/>
      <path d="M22,0 V900" stroke="#2a1206" stroke-width="1" opacity="0.6"/>
      <circle cx="6" cy="140" r="1.6" fill="#1a0b04"/><circle cx="6" cy="460" r="1.6" fill="#1a0b04"/>
      <circle cx="28" cy="300" r="1.6" fill="#1a0b04"/><circle cx="28" cy="620" r="1.6" fill="#1a0b04"/>
    </pattern>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd9a0" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#ffb070" stop-opacity="0.14"/>
    </linearGradient>
 <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a2a5a"/>
      <stop offset="0.45" stop-color="#b0506a"/>
      <stop offset="0.8" stop-color="#f09a5a"/>
    </linearGradient>
    <linearGradient id="mirror" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3a3430"/>
      <stop offset="0.45" stop-color="#5a5048"/>
      <stop offset="0.55" stop-color="#2e2824"/>
      <stop offset="1" stop-color="#1e1a18"/>
    </linearGradient>
    <radialGradient id="lampGlow" cx="0.5" cy="0.12" r="0.5">
      <stop offset="0" stop-color="#ffcf7a" stop-opacity="0.55"/>
      <stop offset="0.35" stop-color="#ff9a4a" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="wallShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0d0502" stop-opacity="0.55"/>
      <stop offset="0.35" stop-color="#0d0502" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#0d0502" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <!-- The wall, with the windows cut out so the live sunset shows through -->
  <path d="M0,0 H1600 V900 H0 Z ${wallHoles}" fill="url(#planks)" fill-rule="evenodd"/>
  <path d="M0,0 H1600 V900 H0 Z ${wallHoles}" fill="url(#wallShade)" fill-rule="evenodd"/>
  ${frames}
  <!-- Back bar: a framed mirror over a shelf of bottles -->
  <rect x="548" y="92" width="504" height="118" fill="url(#mirror)" stroke="#1a0b04" stroke-width="1.5"/>
  <rect x="540" y="84" width="520" height="134" fill="none" stroke="#6a3a1a" stroke-width="9"/>
  <rect x="535" y="79" width="530" height="144" fill="none" stroke="#1a0b04" stroke-width="1.5"/>
  <path d="M600,100 l60,100 M640,100 l40,70 M960,100 l50,90" stroke="rgba(255,240,210,0.07)" stroke-width="10"/>
  ${bottles(556, 700, 206, 3)}
  ${bottles(900, 1046, 206, 21)}
  <rect x="526" y="206" width="548" height="12" fill="#6a3a1a" stroke="#1a0b04" stroke-width="1.5"/>
  <rect x="526" y="206" width="548" height="3" fill="rgba(255,220,170,0.25)"/>
  <!-- Chair rail along the wall just above the table -->
  <rect x="0" y="236" width="1600" height="10" fill="#5e2e12" stroke="#1a0b04" stroke-width="1.5"/>
  <rect x="0" y="246" width="1600" height="654" fill="#2a1206" opacity="0.55"/>
  <!-- Floorboards -->
  <path d="M0,780 H1600 V900 H0 Z" fill="#2a1408"/>
  <path d="M0,780 H1600 M0,812 H1600 M0,846 H1600 M0,882 H1600" stroke="#140802" stroke-width="2"/>
  <!-- Lamps and their light -->
  <ellipse cx="520" cy="300" rx="320" ry="300" fill="url(#lampGlow)"/>
  <ellipse cx="1080" cy="300" rx="320" ry="300" fill="url(#lampGlow)"/>
  ${lamp(520)}
  ${lamp(1080)}
</svg>`;
}
