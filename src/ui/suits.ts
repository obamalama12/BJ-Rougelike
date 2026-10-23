// Suit glyphs and face-card portraits, drawn as inline SVG in a "frontier
// woodcut" print style: flat colour plate + dark key-ink outline + a few
// cream gouge highlights. Suit glyphs live in a 0 0 100 100 box; the colour
// plate uses currentColor so the caller decides the suit ink.
// Internal suit ids: moon = Horseshoes, flame = Dynamite, leaf = Cacti, bell = Stars.

import type { Suit } from '../core/types';

/** Key (outline) ink, card stock and a few fixed "spot colours" shared by the deck. */
export const PRINT = {
  key: '#2a1408',
  paper: '#f6ead0',
  white: '#fbf5e6',
  ochre: '#e3a93b',
  orange: '#e2792c',
  brown: '#5a3418',
  hat: '#7a4a26',
  hatLight: '#a86c30',
  drake: '#3f7d55',
  duckling: '#f3cd52',
};
const K = PRINT.key;
const P = PRINT.paper;

const r2 = (n: number) => Math.round(n * 100) / 100;
function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [r2(cx + r * Math.cos(a)), r2(cy + r * Math.sin(a))];
}
function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0} ${y0}A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}
function burst(cx: number, cy: number, n: number, ro: number, ri: number, rot = -90): string {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const [x, y] = polar(cx, cy, i % 2 ? ri : ro, rot + (i * 180) / n);
    d += `${i ? 'L' : 'M'}${x} ${y}`;
  }
  return d + 'Z';
}

// ---------------------------------------------------------------------------
// Suit silhouettes. Each suit is { shape, cut, ink, hatch }:
//  shape: the silhouette (drawn twice: fat key-ink stroke underneath, colour on top)
//  cut:   cream gouge highlights, ink: key-ink details, hatch: fine shading for big sizes
// ---------------------------------------------------------------------------

interface Glyph { shape: string; cut: string; ink: string; hatch: string }

function horseshoe(): Glyph {
  const cx = 50, cy = 53, R = 41, r = 24.5, gap = 37;
  const aR = -90 + gap, aL = -90 - gap;
  const [oRx, oRy] = polar(cx, cy, R, aR);
  const [oLx, oLy] = polar(cx, cy, R, aL);
  const [iLx, iLy] = polar(cx, cy, r, aL);
  const [iRx, iRy] = polar(cx, cy, r, aR);
  const mid = (R + r) / 2;
  // flared heel caulks: blocks straddling each open end, wider than the band
  const heel = (a: number, dir: number) => {
    const [hx, hy] = polar(cx, cy, mid, a + dir * 5);
    return `<rect x="${-(R - r) / 2 - 1}" y="-5.5" width="${R - r + 6}" height="11" rx="2" transform="translate(${hx} ${hy}) rotate(${a})"/>`;
  };
  const shape =
    `<path d="M${oRx} ${oRy}A${R} ${R} 0 1 1 ${oLx} ${oLy}L${iLx} ${iLy}A${r} ${r} 0 1 0 ${iRx} ${iRy}Z"/>` +
    heel(aR, 1) + heel(aL + 360, -1);
  let holes = '';
  for (const a of [-22, 12, 46, 134, 168, 202]) {
    const [x, y] = polar(cx, cy, mid, a);
    holes += `<rect x="-4.2" y="-2.6" width="8.4" height="5.2" rx="1" transform="translate(${x} ${y}) rotate(${a + 90})"/>`;
  }
  let hatch = '';
  for (let a = 30; a <= 120; a += 9) {
    const [x0, y0] = polar(cx, cy, r + 1, a);
    const [x1, y1] = polar(cx, cy, r + 6.5, a);
    hatch += `M${x0} ${y0}L${x1} ${y1}`;
  }
  return {
    shape,
    cut: `<path d="${arc(cx, cy, R - 4.5, 140, 200)}" fill="none" stroke="${P}" stroke-width="3.4" stroke-linecap="round"/>`,
    ink: `<path d="${arc(cx, cy, mid, -50, 62)}${arc(cx, cy, mid, 118, 230)}" fill="none" stroke="${K}" stroke-width="1.8"/><g fill="${K}">${holes}</g>`,
    hatch: `<path d="${hatch}" stroke="${K}" stroke-width="1.6" fill="none"/>`,
  };
}

function dynamite(): Glyph {
  const sticks: [number, number, number][] = [[16, 40, 56], [40, 31, 65], [64, 40, 56]];
  const shape = sticks.map(([x, y, h]) => `<rect x="${x}" y="${y}" width="20" height="${h}" rx="5"/>`).join('') +
    `<path d="${burst(70, 13.5, 8, 11, 4.6, -78)}"/>`;
  const caps = sticks.map(([x, y]) => `M${x + 3} ${y + 5.5}Q${x + 10.5} ${y + 10} ${x + 18} ${y + 5.5}`).join('');
  const glints = sticks.map(([x, y]) => `M${x + 5.5} ${y + 12}V62`).join('');
  return {
    shape,
    cut: `<path d="${glints}" stroke="${P}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
          <circle cx="70" cy="13.5" r="3.4" fill="${P}"/>`,
    ink: `<path d="${caps}" stroke="${K}" stroke-width="1.9" fill="none"/>
          <path d="M50 31C50 23 57 24 61 19" stroke="${K}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
          <rect x="12" y="68" width="76" height="9" rx="2" fill="${P}" stroke="${K}" stroke-width="3.2"/>`,
    hatch: `<path d="M${sticks.map(([x, y, h]) => `${x + 15.5} ${y + 12}V64M${x + 15.5} 81V${y + h - 5}`).join('M')}" stroke="${K}" stroke-width="1.6" fill="none"/>`,
  };
}

function cactus(): Glyph {
  const shape =
    `<path d="M39 92V22a11 11 0 0 1 22 0V92Z"/>` +
    `<path d="M39.5 70H28a12 12 0 0 1-12-12V39a7.5 7.5 0 0 1 15 0V55H39.5Z"/>` +
    `<path d="M60.5 58H72a12 12 0 0 0 12-12V27a7.5 7.5 0 0 0-15 0V43H60.5Z"/>`;
  return {
    shape,
    cut: `<path d="M43.5 24V86M20.5 41V56M73.5 28V42" stroke="${P}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,
    ink: `<path d="M50 18V90M56 22V90M23.5 37V60M76.5 25V48" stroke="${K}" stroke-width="1.7" fill="none"/>
          <path d="M20 96C28 88 72 88 80 96Z" fill="${K}"/>`,
    hatch: `<path d="M35 30l-4-2M35 46l-4-2M35 80l-4-2M65 66l4-2M65 82l4-2M12 50l-4-1M88 36l4-1M65 34l4-2" stroke="${K}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
  };
}

function star(): Glyph {
  const cx = 50, cy = 51;
  let balls = '';
  let ridges = '';
  let shade = '';
  for (let i = 0; i < 6; i++) {
    const a = -90 + i * 60;
    const [bx, by] = polar(cx, cy, 39.5, a);
    balls += `<circle cx="${bx}" cy="${by}" r="6.3"/>`;
    const [tx, ty] = polar(cx, cy, 35, a);
    ridges += `M${cx} ${cy}L${tx} ${ty}`;
    const [ix, iy] = polar(cx, cy, 16.5, a + 30);
    shade += `M${tx} ${ty}L${ix} ${iy}L${cx} ${cy}Z`;
  }
  return {
    shape: `<path d="${burst(cx, cy, 6, 38, 16.5)}"/>${balls}`,
    cut: `<circle cx="${cx}" cy="${cy}" r="10" fill="${P}" stroke="${K}" stroke-width="2.6"/>`,
    ink: `<circle cx="${cx}" cy="${cy}" r="4.2" fill="currentColor" stroke="${K}" stroke-width="1.8"/>`,
    hatch: `<path d="${shade}" fill="${K}" opacity=".16"/><path d="${ridges}" stroke="${K}" stroke-width="1.3" fill="none"/>`,
  };
}

const GLYPH: Record<Suit, Glyph> = { moon: horseshoe(), flame: dynamite(), leaf: cactus(), bell: star() };

/** Inner SVG markup for a suit glyph. `mis` shifts the colour plate (misregistration). */
export function suitInner(s: Suit, mis = 0): string {
  const g = GLYPH[s];
  const shift = mis ? ` transform="translate(${mis} ${mis * 0.7})"` : '';
  return `<g class="s-key" fill="${K}" stroke="${K}" stroke-width="9" stroke-linejoin="round">${g.shape}</g>` +
    `<g class="s-col" fill="currentColor"${shift}>${g.shape}</g>` +
    `<g class="s-cut">${g.cut}</g><g class="s-hatch">${g.hatch}</g><g class="s-ink">${g.ink}</g>`;
}

export const SUIT_PATH: Record<Suit, string> = {
  moon: suitInner('moon'),
  flame: suitInner('flame'),
  leaf: suitInner('leaf'),
  bell: suitInner('bell'),
};

export function suitSvg(s: Suit, cls = ''): string {
  return `<svg class="suit suit-${s} ${cls}" viewBox="0 0 100 100" aria-hidden="true">${SUIT_PATH[s]}</svg>`;
}

// ---------------------------------------------------------------------------
// Print helpers shared with art.ts
// ---------------------------------------------------------------------------

/** Mix two #rrggbb colours (t = share of b). */
export function mixHex(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** A halftone dot screen as a single path; rad(x,y) gives each dot's radius (0 = no dot). */
export function halftone(x0: number, y0: number, x1: number, y1: number, step: number, rad: (x: number, y: number) => number): string {
  let d = '';
  let row = 0;
  for (let y = y0; y <= y1; y += step * 0.866, row++) {
    for (let x = x0 + (row % 2 ? step / 2 : 0); x <= x1; x += step) {
      const r = rad(x, y);
      if (r < 0.25) continue;
      const rr = r2(r);
      d += `M${r2(x - rr)} ${r2(y)}a${rr} ${rr} 0 1 0 ${r2(rr * 2)} 0a${rr} ${rr} 0 1 0 ${r2(-rr * 2)} 0`;
    }
  }
  return d;
}

/** Parallel diagonal hatch lines covering a box. */
export function hatchLines(x0: number, y0: number, x1: number, y1: number, gap: number, slope = 1): string {
  let d = '';
  const h = y1 - y0;
  for (let x = x0 - h; x <= x1; x += gap) d += `M${r2(x)} ${y1}L${r2(x + h * slope)} ${y0}`;
  return d;
}

// ---------------------------------------------------------------------------
// Duck portraits: J = Duckling Deputy, Q = Saloon Swan, K = Sheriff Drake.
// Engraved-portrait framing: an arched window of halftone in the suit colour,
// the bird breaking out of the frame, and a name plate along the bottom.
// viewBox 0 0 100 144 (fills the card inside its printed border).
// ---------------------------------------------------------------------------

let uid = 0;
const ARCH = 'M8 128V46A42 42 0 0 1 92 46V128Z';
const portraitCache = new Map<string, string>();

function archScreen(color: string): string {
  const key = `arch|${color}`;
  const hit = portraitCache.get(key);
  if (hit) return hit;
  const d = halftone(9, 5, 91, 127, 4.4, (x, y) => {
    if (y < 46 && Math.hypot(x - 50, y - 46) > 40.5) return 0;
    if (x < 9.5 || x > 90.5) return 0;
    const t = Math.min(1, Math.hypot((x - 50) / 44, (y - 62) / 70));
    return 0.45 + t * t * 1.75;
  });
  const out = `<path d="${d}" fill="${color}"/>`;
  portraitCache.set(key, out);
  return out;
}

function plate(text: string): string {
  return `<path d="M3 127H77V141H3Z" fill="${P}" stroke="${K}" stroke-width="1.8"/>
    <path d="M6 130H74" stroke="${K}" stroke-width=".7"/>
    <text x="40" y="138.6" text-anchor="middle" textLength="${Math.min(64, text.length * 7.4)}" lengthAdjust="spacingAndGlyphs"
      font-family="Rye, Georgia, serif" font-size="9.4" fill="${K}">${text}</text>`;
}

/** Small sheriff star badge built from the Stars suit silhouette. */
function badge(x: number, y: number, size: number, fill: string): string {
  const s = size / 100;
  const g = GLYPH.bell;
  return `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${s})">
    <g fill="${K}" stroke="${K}" stroke-width="10" stroke-linejoin="round">${g.shape}</g><g fill="${fill}">${g.shape}</g>
    <circle cx="50" cy="51" r="11" fill="${P}" stroke="${K}" stroke-width="4"/></g>`;
}

function clipped(id: string, clip: string, body: string): string {
  return `<clipPath id="${id}"><path d="${clip}"/></clipPath><g clip-path="url(#${id})">${body}</g>`;
}

export function faceArt(rank: 11 | 12 | 13, color: string, ink: string): string {
  const id = `fa${++uid}`;
  const sw = 'stroke="' + K + '" stroke-width="2.2" stroke-linejoin="round"';
  const frame = `${archScreen(color)}
    <path d="${ARCH}" fill="none" stroke="${K}" stroke-width="2.2"/>
    <path d="M11.5 128V46A38.5 38.5 0 0 1 88.5 46V128" fill="none" stroke="${K}" stroke-width=".8"/>`;
  const hatch = (x0: number, y0: number, x1: number, y1: number, gap = 3.2, w = 0.8) =>
    `<path d="${hatchLines(x0, y0, x1, y1, gap)}" stroke="${K}" stroke-width="${w}" fill="none"/>`;
  const eye = (x: number, y: number, r: number, look = 0.8) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${PRINT.white}" stroke="${K}" stroke-width="1.8"/>
     <circle cx="${x + look}" cy="${y + 0.6}" r="${r * 0.55}" fill="${K}"/>
     <circle cx="${x + look - r * 0.22}" cy="${y - r * 0.2}" r="${r * 0.18}" fill="${PRINT.white}"/>`;

  if (rank === 11) {
    // Duckling Deputy: fuzzy yellow, too-big hat, polka-dot bandana, tin star on the vest
    const body = 'M12 144C14 118 30 104 50 104C70 104 86 118 88 144Z';
    return `<svg class="face-art" viewBox="0 0 100 144" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${frame}
      <path d="${body}" fill="${PRINT.duckling}" ${sw}/>
      <path d="M14 144C16 124 26 111 39 107L44 144Z" fill="${color}" ${sw}/>
      <path d="M86 144C84 124 74 111 61 107L56 144Z" fill="${color}" ${sw}/>
      ${clipped(id + 'v', 'M56 144L61 107C74 111 84 124 86 144Z', hatch(56, 104, 90, 144))}
      <circle cx="41" cy="122" r="1.6" fill="${K}"/><circle cx="41.8" cy="133" r="1.6" fill="${K}"/>
      ${badge(28, 124, 17, PRINT.white)}
      <path d="M27 95C38 102 62 102 73 95L67 104L50 121L33 104Z" fill="${color}" ${sw}/>
      <g fill="${P}"><circle cx="42" cy="104" r="1.7"/><circle cx="55" cy="105" r="1.7"/><circle cx="49" cy="112" r="1.7"/><circle cx="62" cy="99.5" r="1.5"/><circle cx="36" cy="99" r="1.5"/></g>
      <path d="M22 70C22 52 34 42 50 42C66 42 78 52 78 70C78 88 66 98 50 98C34 98 22 88 22 70Z" fill="${PRINT.duckling}" ${sw}/>
      ${clipped(id + 'h', 'M50 42C66 42 78 52 78 70C78 88 66 98 50 98Z', hatch(56, 42, 80, 98, 3.4, 0.7))}
      <path d="M22.5 64l-5 2.5 5 2M22.5 72l-5 2.5 5 2M77.5 64l5 2.5-5 2M77.5 72l5 2.5-5 2" fill="none" stroke="${K}" stroke-width="1.8" stroke-linejoin="round"/>
      ${eye(40, 70, 6.6, 0.6)}${eye(60, 70, 6.6, -0.2)}
      <path d="M41 82C41 78 59 78 59 82C59 88 55 91.5 50 91.5C45 91.5 41 88 41 82Z" fill="${PRINT.orange}" ${sw}/>
      <path d="M43.5 84Q50 87.5 56.5 84" fill="none" stroke="${K}" stroke-width="1.5"/>
      <g transform="rotate(-7 50 40)">
        <path d="M27 43C26 22 36 7 50 7C64 7 74 22 73 43Z" fill="${PRINT.hatLight}" ${sw}/>
        ${clipped(id + 'c', 'M50 7C64 7 74 22 73 43H56Z', hatch(50, 6, 76, 44, 3, 0.8))}
        <path d="M27.4 35C41 39 59 39 72.6 35L73 42C59 46 41 46 27 42Z" fill="${color}" ${sw}/>
        <path d="M1 48C-1 38 16 40 26 42.5C38 45.5 62 45.5 74 42.5C84 40 101 38 99 48C93 55 74 53 50 53C26 53 7 55 1 48Z" fill="${PRINT.hatLight}" ${sw}/>
        <path d="M8 47C24 50 76 50 92 47" fill="none" stroke="${K}" stroke-width=".9"/>
      </g>
      ${plate('DEPUTY')}
    </svg>`;
  }
  if (rank === 12) {
    // Saloon Swan: long neck, feather boa, pearls, plumed hat, beauty mark
    let boa = '';
    for (const [x, y] of [[10, 131], [17, 125], [25, 121], [33, 118.5], [41, 117.5], [59, 117.5], [67, 118.5], [75, 121], [83, 125], [90, 131]]) {
      boa += `<circle cx="${x}" cy="${y}" r="6.2"/>`;
    }
    let pearls = '';
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = 43.4 + t * 13.4;
      const y = 99 + Math.sin(t * Math.PI) * 4.6;
      pearls += `<circle cx="${r2(x)}" cy="${r2(y)}" r="1.9"/>`;
    }
    return `<svg class="face-art" viewBox="0 0 100 144" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${frame}
      <path d="M6 144C8 128 22 120 50 120C78 120 92 128 94 144Z" fill="${color}" ${sw}/>
      ${clipped(id + 'd', 'M50 120C78 120 92 128 94 144H50Z', hatch(50, 118, 96, 144, 3, 0.8))}
      <path d="M50 124V144M44 128L41 144M56 128L59 144" stroke="${K}" stroke-width="1" fill="none"/>
      <path d="M42 121C40 104 44 92 46 82C47 76 46 71 44 66L58 64C61 72 60 80 58 88C56 98 56 108 58 121Z" fill="${PRINT.white}" ${sw}/>
      ${clipped(id + 'n', 'M52 64L58 64C61 72 60 80 58 88C56 98 56 108 58 121H53Z', hatch(52, 62, 62, 122, 3, 0.7))}
      <g fill="${PRINT.white}" stroke="${K}" stroke-width="1.1">${pearls}</g>
      <g fill="${PRINT.white}" stroke="${K}" stroke-width="1.8">${boa}</g>
      <g fill="none" stroke="${K}" stroke-width=".8">${[[10, 131], [25, 121], [41, 117.5], [67, 118.5], [83, 125]].map(([x, y]) => `<path d="M${x - 3} ${y + 1}q3 -3 6 0"/>`).join('')}</g>
      <ellipse cx="51" cy="53" rx="17" ry="15" fill="${PRINT.white}" ${sw}/>
      ${clipped(id + 'f', 'M51 38A17 15 0 0 1 51 68Z', hatch(54, 38, 70, 68, 3.2, 0.7))}
      <path d="M39.2 51Q44.5 44 49.6 51Z" fill="${color}" stroke="${K}" stroke-width="1.3"/>
      <path d="M52.4 51Q57.5 44 62.8 51Z" fill="${color}" stroke="${K}" stroke-width="1.3"/>
      ${eye(44.5, 52.5, 3.6, 1.2)}${eye(57.5, 52.5, 3.6, 1.2)}
      <path d="M40 49l-3-2.5M41.5 47.2l-1.6-3M61 49l3-2.5M59.5 47.2l1.6-3" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M45 60C45 56.5 57 56.5 57 60C58 68 54.5 74 51 74C47.5 74 44 68 45 60Z" fill="${PRINT.orange}" ${sw}/>
      <path d="M46.5 59.5C47 56 55 56 55.5 59.5C53 58 49 58 46.5 59.5Z" fill="${K}"/>
      <circle cx="61.5" cy="61.5" r="1.1" fill="${K}"/>
      <path d="M62 31C70 15 84 7 95 9C90 13 87 19 82 25C77 30 70 33 62 33Z" fill="${color}" ${sw}/>
      <path d="M63 32C72 23 84 13 94 9.5M70 26l-1-5M76 20l-1-5M82 15l-1-4.5M72 28.5l5 0M78 23l5 .5M84 17.5l4.5 .5" fill="none" stroke="${K}" stroke-width="1.1" stroke-linecap="round"/>
      <g transform="rotate(-10 52 36)">
        <path d="M41 36C41 27 45 23 52 23C59 23 63 27 63 36Z" fill="${K}"/>
        <path d="M41 31.5H63V36H41Z" fill="${color}" stroke="${K}" stroke-width="1.4"/>
        <ellipse cx="52" cy="37" rx="20" ry="4.4" fill="${K}"/>
        <circle cx="62.5" cy="33" r="2.6" fill="${PRINT.white}" stroke="${K}" stroke-width="1.2"/>
      </g>
      ${plate('SALOON SWAN')}
    </svg>`;
  }
  // Sheriff Drake: green mallard head, white collar ring, big hat, star, handlebar mustache
  return `<svg class="face-art" viewBox="0 0 100 144" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${frame}
    <path d="M6 144C8 116 26 100 50 100C74 100 92 116 94 144Z" fill="${color}" ${sw}/>
    ${clipped(id + 'b', 'M50 100C74 100 92 116 94 144H50Z', hatch(50, 98, 96, 144, 3, 0.8))}
    <path d="M40 101L50 128L60 101Z" fill="${P}" ${sw}/>
    <path d="M40 101L33 119L43 117L50 128M60 101L67 119L57 117L50 128" fill="none" ${sw}/>
    <path d="M50 106L46.5 121M50 106L53.5 121" stroke="${K}" stroke-width="1.5"/>
    <circle cx="50" cy="106" r="2.8" fill="${PRINT.ochre}" stroke="${K}" stroke-width="1.4"/>
    ${badge(73, 121, 21, PRINT.ochre)}
    <path d="M28 92C38 99 62 99 72 92L73 99C62 106 38 106 27 99Z" fill="${PRINT.white}" ${sw}/>
    <ellipse cx="50" cy="66" rx="25.5" ry="25.5" fill="${PRINT.drake}" ${sw}/>
    ${clipped(id + 'h', 'M50 40.5A25.5 25.5 0 0 1 50 91.5Z', hatch(52, 40, 78, 92, 3, 0.8))}
    <path d="M30 60C31 53 35 48 40 46" fill="none" stroke="${PRINT.white}" stroke-width="2.4" stroke-linecap="round"/>
    ${eye(40, 63, 4.6, 0.5)}${eye(60, 63, 4.6, -0.5)}
    <path d="M35.2 63A4.8 4.8 0 0 1 44.8 63Z" fill="${PRINT.drake}" stroke="${K}" stroke-width="1.5"/>
    <path d="M55.2 63A4.8 4.8 0 0 1 64.8 63Z" fill="${PRINT.drake}" stroke="${K}" stroke-width="1.5"/>
    <path d="M32.5 55.5L46 59M67.5 55.5L54 59" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M36 75C36 70 64 70 64 75C66 85 58 91 50 91C42 91 34 85 36 75Z" fill="${PRINT.ochre}" ${sw}/>
    <path d="M50 73.5C43 69.5 33 70.5 28 76.5C26 79.5 22.5 79.5 21 76.5C21.5 82.5 30 83.5 36 80C42 76.5 46 77 50 78C54 77 58 76.5 64 80C70 83.5 78.5 82.5 79 76.5C77.5 79.5 74 79.5 72 76.5C67 70.5 57 69.5 50 73.5Z" fill="${PRINT.brown}" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M30 40C29 24 34 12 42 11C46 11 48 15 50 15C52 15 54 11 58 11C66 12 71 24 70 40Z" fill="${PRINT.hat}" ${sw}/>
    ${clipped(id + 'c', 'M50 15C52 15 54 11 58 11C66 12 71 24 70 40H50Z', hatch(50, 10, 72, 41, 2.8, 0.8))}
    <path d="M50 15.5V27" stroke="${K}" stroke-width="1.4"/>
    <path d="M30.4 33.5C42 37 58 37 69.6 33.5L70 40C58 43.5 42 43.5 30 40Z" fill="${color}" ${sw}/>
    <path d="M3 45C1 36 14 37 22 39C34 42 66 42 78 39C86 37 99 36 97 45C93 51 74 49 50 49C26 49 7 51 3 45Z" fill="${PRINT.hat}" ${sw}/>
    <path d="M9 44.5C24 47.5 76 47.5 91 44.5" fill="none" stroke="${K}" stroke-width=".9"/>
    ${plate('SHERIFF')}
  </svg>`;
}

/**
 * Pip layouts for number cards: [x%, y%, upside-down] measured on the whole card.
 * Columns at 32 / 50 / 68 %, rows at 17 / 39 / 61 / 83 % like a real deck.
 */
const L = 33, C = 50, R = 67;
export const PIPS: Record<number, [number, number, boolean?][]> = {
  2: [[C, 17], [C, 83, true]],
  3: [[C, 17], [C, 50], [C, 83, true]],
  4: [[L, 17], [R, 17], [L, 83, true], [R, 83, true]],
  5: [[L, 17], [R, 17], [C, 50], [L, 83, true], [R, 83, true]],
  6: [[L, 17], [R, 17], [L, 50], [R, 50], [L, 83, true], [R, 83, true]],
  7: [[L, 17], [R, 17], [C, 33.5], [L, 50], [R, 50], [L, 83, true], [R, 83, true]],
  8: [[L, 17], [R, 17], [C, 33.5], [L, 50], [R, 50], [C, 66.5, true], [L, 83, true], [R, 83, true]],
  9: [[L, 17], [R, 17], [L, 39], [R, 39], [C, 50], [L, 61, true], [R, 61, true], [L, 83, true], [R, 83, true]],
  10: [[L, 17], [R, 17], [C, 28], [L, 39], [R, 39], [L, 61, true], [R, 61, true], [C, 72, true], [L, 83, true], [R, 83, true]],
};
