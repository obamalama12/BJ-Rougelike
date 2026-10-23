// Character portraits for Buck Ducks: big cartoon bird busts (head + neck + shoulders)
// drawn as self-contained SVG strings. Wanted-poster-meets-Looney-Tunes style: chunky
// dark-brown ink outlines, flat fills with one soft shade/highlight tone.
//
// Layering (back to front): species backdrop (fans, plumes) -> shoulders/neck -> neckwear
// -> head + markings -> bandit mask / scar -> eyes -> bill (mustache, toothpick ride on it)
// -> wattles -> face accessories -> hat -> brows -> expression effects (sweat, tears).
// Expressions only swap the eyes / brows / bill-opening layer, so a character stays
// on-model across moods.

export type Species =
  | 'duck' | 'goose' | 'swan' | 'turkey' | 'vulture' | 'pelican' | 'owl' | 'crow' | 'penguin' | 'chicken'
  | 'ostrich' | 'heron' | 'toucan' | 'eagle' | 'pigeon' | 'roadrunner' | 'loon' | 'dodo' | 'flamingo' | 'magpie';
export type Expression = 'neutral' | 'smug' | 'angry' | 'shocked' | 'sweating' | 'laughing' | 'sad';
export type Hat =
  | 'none' | 'cowboy' | 'tophat' | 'sheriff' | 'bowler'
  | 'sombrero-free' /* do NOT draw a sombrero; treat as 'cowboy' */
  | 'bandit' | 'derby' | 'feathered' | 'crown' | 'visor';
export type Accessory =
  | 'none' | 'bandana' | 'monocle' | 'mustache' | 'eyepatch'
  | 'cigar-free' /* never draw smoking; treat as 'toothpick' */
  | 'toothpick' | 'bowtie' | 'pearls' | 'badge' | 'scar' | 'glasses';
export interface PortraitOpts {
  species: Species;
  expression?: Expression; // default 'neutral'
  hat?: Hat; // default depends on species
  accessory?: Accessory; // default 'none'
  plumage?: string; // main body/head colour (hex); sensible species default
  accent?: string; // hat colour (and bandana colour when the hat isn't cloth)
  seed?: number; // small random variation (feather tufts, hat dents)
  /** Optional extra accessories layered with `accessory` (e.g. bowtie + mustache). */
  extras?: Accessory[];
  /** Optional neckwear (bandana / bowtie) colour; defaults to red. */
  accent2?: string;
}

// ------------------------------------------------------------------ primitives
const INK = '#2a1408';
const WHITE = '#fffaf0';
const NS = 'stroke="none"';
const f = (n: number): string => String(Math.round(n * 10) / 10);
/** Tagged template: rounds every interpolated number to 0.1. */
const d = (s: TemplateStringsArray, ...v: number[]): string =>
  s.reduce((a, str, i) => a + str + (i < v.length ? f(v[i]) : ''), '');
const P = (fill: string, path: string, a = ''): string => `<path fill="${fill}" d="${path}"${a ? ' ' + a : ''}/>`;
const E = (fill: string, cx: number, cy: number, rx: number, ry: number, a = ''): string =>
  `<ellipse fill="${fill}" cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}"${a ? ' ' + a : ''}/>`;
const C = (fill: string, cx: number, cy: number, r: number, a = ''): string =>
  `<circle fill="${fill}" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"${a ? ' ' + a : ''}/>`;
/** Open ink line. */
const L = (path: string, w = 4, col = INK): string =>
  `<path fill="none" d="${path}"${w !== 4 ? ` stroke-width="${f(w)}"` : ''}${col !== INK ? ` stroke="${col}"` : ''}/>`;
const G = (tr: string, body: string, a = ''): string => `<g transform="${tr}"${a ? ' ' + a : ''}>${body}</g>`;
const sw = (w: number): string => `stroke-width="${f(w)}"`;

// colour helpers
const rgb = (h: string): number[] => {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map(ch => ch + ch).join('');
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: string, b: string, t: number): string => {
  const x = rgb(a), y = rgb(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
const dk = (c: string, t = 0.22): string => mix(c, '#2a1408', t);
const lt = (c: string, t = 0.35): string => mix(c, '#fff8e8', t);
const lum = (c: string): number => {
  const [r, g, b] = rgb(c);
  return (0.3 * r + 0.59 * g + 0.11 * b) / 255;
};

const rng = (seed: number): (() => number) => {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type Pt = [number, number];
/** Filled tube along a cubic bezier (half-widths w0 -> w1). */
const tube = (q: number[], w0: number, w1: number, n = 12): string => {
  const A: string[] = [], B: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const x = u * u * u * q[0] + 3 * u * u * t * q[2] + 3 * u * t * t * q[4] + t * t * t * q[6];
    const y = u * u * u * q[1] + 3 * u * u * t * q[3] + 3 * u * t * t * q[5] + t * t * t * q[7];
    const dx = 3 * u * u * (q[2] - q[0]) + 6 * u * t * (q[4] - q[2]) + 3 * t * t * (q[6] - q[4]);
    const dy = 3 * u * u * (q[3] - q[1]) + 6 * u * t * (q[5] - q[3]) + 3 * t * t * (q[7] - q[5]);
    const l = Math.hypot(dx, dy) || 1, w = w0 + (w1 - w0) * t;
    A.push(f(x - (dy / l) * w) + ',' + f(y + (dx / l) * w));
    B.unshift(f(x + (dy / l) * w) + ',' + f(y - (dx / l) * w));
  }
  return 'M' + A.join('L') + 'L' + B.join('L') + 'Z';
};
/** Ellipse clipped to the half-plane where side(x,y) <= 0 (convex polygon). */
const clipEll = (cx: number, cy: number, rx: number, ry: number, side: (x: number, y: number) => number): string => {
  const pts: Pt[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const sp = side(p[0], p[1]), sq = side(q[0], q[1]);
    if (sp <= 0) out.push(p);
    if ((sp <= 0) !== (sq <= 0)) {
      const t = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out.length < 3 ? '' : 'M' + out.map(p => f(p[0]) + ',' + f(p[1])).join('L') + 'Z';
};
const star = (cx: number, cy: number, ro: number, ri: number, n: number): string => {
  let s = '';
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? ri : ro;
    s += (i ? 'L' : 'M') + f(cx + Math.cos(a) * r) + ',' + f(cy + Math.sin(a) * r);
  }
  return s + 'Z';
};

// ------------------------------------------------------------------ species model
type BillType = 'duck' | 'goose' | 'point' | 'hook' | 'pelican' | 'toucan' | 'flamingo';
interface Bill { t: BillType; x: number; y: number; a: number; L: number; hu: number; hl: number; c: string; c2?: string }
interface K {
  o: PortraitOpts;
  sp: Sp;
  M: string; // main plumage
  ex: Expression;
  hat: Hat;
  acc: Set<Accessory>;
  r: () => number;
}
interface Sp {
  main: string;
  hat: Hat;
  /** head ellipse centre/radii (used for fx placement) */
  h: [number, number, number, number];
  /** near eye centre x,y, radius, far-eye x offset, far-eye scale */
  e: [number, number, number, number, number?];
  iris?: string;
  lashes?: boolean;
  /** colour of eyelids (defaults to plumage) */
  lid?: (k: K) => string;
  bill: (k: K) => Bill;
  /** hat: x, y-nudge (y is derived from the eyes), scale, tilt */
  hatA: [number, number, number, number];
  /** neckwear anchor: x, y, half width */
  neck: [number, number, number];
  /** chest point for badge */
  chest: Pt;
  body: (k: K) => string;
  head: (k: K) => string;
  over?: (k: K) => string;
  /** optional head-group scale about a pivot (neck joint): [scale, px, py] */
  hs?: [number, number, number];
  /** drawn after the hat (things poking out of it) */
  top?: (k: K) => string;
}

// --------------------------------------------------------------- shared body parts
/** Wide sloping shoulders filling the bottom of the frame. */
const shoulders = (col: string, top = 184, cx = 112): string =>
  P(col, d`M-8,248L-8,${top + 34}C8,${top + 8} ${cx - 70},${top - 2} ${cx - 34},${top - 6}L${cx + 34},${top - 6}C${cx + 70},${top - 2} 232,${top + 8} 248,${top + 34}L248,248Z`) +
  L(d`M${cx - 66},${top + 14}Q${cx - 74},${top + 34} ${cx - 70},248M${cx + 66},${top + 14}Q${cx + 74},${top + 34} ${cx + 70},248`, 3.5);
/** Wing feather hints on shoulders. */
const wingLines = (col: string, top = 184, cx = 112): string =>
  L(d`M18,${top + 34}Q30,${top + 30} 38,${top + 40}M${cx - 96},${top + 46}Q${cx - 82},${top + 40} ${cx - 76},${top + 52}M222,${top + 34}Q210,${top + 30} 202,${top + 40}M${cx + 96},${top + 46}Q${cx + 82},${top + 40} ${cx + 76},${top + 52}`, 3, col);
/** Front of neck flowing into the chest. */
const bib = (col: string, y0: number, w0: number, cx = 112, w1 = 70): string =>
  P(col, d`M${cx - w0},${y0}C${cx - w0},${y0 + 40} ${cx - w1},${200} ${cx - w1 - 4},248L${cx + w1 + 4},248C${cx + w1},200 ${cx + w0},${y0 + 40} ${cx + w0},${y0}Z`);
/** Scalloped feather texture rows. */
const scallops = (col: string, x0: number, y0: number, cols: number, rows: number, s = 14): string => {
  let p = '';
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x = x0 + i * s + (j % 2 ? s / 2 : 0), y = y0 + j * s * 0.8;
      p += d`M${x - s * 0.4},${y}Q${x},${y + s * 0.45} ${x + s * 0.4},${y}`;
    }
  return L(p, 2.5, col);
};
/** A few cowlick feathers sticking up from the head top. */
const tuft = (k: K, x: number, y: number, col: string, n = 3, h = 16): string => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const dx = (i - (n - 1) / 2) * 8 + (k.r() - 0.5) * 4, hh = h * (0.7 + k.r() * 0.5), lean = -6 + k.r() * 12;
    s += P(col, d`M${x + dx - 5},${y + 4}Q${x + dx - 4 + lean * 0.3},${y - hh * 0.6} ${x + dx + lean},${y - hh}Q${x + dx + 4 + lean * 0.2},${y - hh * 0.4} ${x + dx + 5},${y + 4}Z`, sw(3));
  }
  return s;
};
const highlight = (col: string, x: number, y: number, rx: number, ry: number, deg = -25): string =>
  E(col, x, y, rx, ry, `${NS} transform="rotate(${deg} ${f(x)} ${f(y)})"`);

/** Standard round head: ellipse + soft highlight + under-shade. */
const roundHead = (M: string, [x, y, rx, ry]: number[]): string =>
  E(M, x, y, rx, ry) +
  P(dk(M, 0.14), d`M${x - rx * 0.92},${y + ry * 0.25}Q${x - rx * 0.6},${y + ry * 0.95} ${x + rx * 0.1},${y + ry * 0.97}Q${x - rx * 0.5},${y + ry * 0.7} ${x - rx * 0.92},${y + ry * 0.25}Z`, NS) +
  highlight(lt(M, 0.3), x - rx * 0.45, y - ry * 0.5, rx * 0.28, ry * 0.16);

// ------------------------------------------------------------------ bills
interface BillShapes { u: string; l: string; ux?: string; lx?: string; back?: string }
const billShapes = (b: Bill, k: K): BillShapes => {
  const { L: l, hu, hl, c } = b;
  const c2 = b.c2 ?? dk(c, 0.25);
  const hiU = lt(c, 0.4);
  switch (b.t) {
    case 'duck':
      return {
        u: P(c, d`M-8,${-hu}C${l * 0.3},${-hu * 1.2} ${l * 0.78},${-hu * 1.05} ${l},${-hu * 0.4}Q${l * 1.06},${hu * 0.1} ${l * 0.88},${3}L-4,3Z`),
        ux: P(hiU, d`M${l * 0.1},${-hu * 0.85}Q${l * 0.5},${-hu * 1.05} ${l * 0.85},${-hu * 0.7}Q${l * 0.5},${-hu * 0.75} ${l * 0.1},${-hu * 0.6}Z`, NS) +
          E(INK, l * 0.3, -hu * 0.45, 4, 2, NS),
        l: P(c2, d`M-4,0L${l * 0.86},0Q${l * 0.94},${hl * 0.7} ${l * 0.76},${hl}Q${l * 0.4},${hl * 1.3} -6,${hl * 0.9}Z`),
      };
    case 'goose':
      return {
        back: C(b.c2 ?? c, 16, -hu - 1, hu * 0.42),
        u: P(c, d`M-8,${-hu}C${l * 0.35},${-hu * 1.05} ${l * 0.8},${-hu * 0.6} ${l},${-hu * 0.2}Q${l * 1.04},${2} ${l * 0.9},3L-4,3Z`),
        ux: P(hiU, d`M${l * 0.12},${-hu * 0.85}Q${l * 0.5},${-hu * 0.85} ${l * 0.8},${-hu * 0.5}Q${l * 0.5},${-hu * 0.62} ${l * 0.12},${-hu * 0.6}Z`, NS) +
          P('#f6eedd', d`M${l * 0.86},${-hu * 0.33}Q${l * 1.05},${-hu * 0.2} ${l * 0.97},3L${l * 0.86},3Z`, sw(3)) +
          E(INK, l * 0.3, -hu * 0.42, 3.5, 1.8, NS),
        l: P(dk(c, 0.18), d`M-4,0L${l * 0.88},0Q${l * 0.9},${hl * 0.8} ${l * 0.74},${hl}Q${l * 0.4},${hl * 1.2} -6,${hl * 0.9}Z`) +
          L(d`M0,${hl * 0.45}L${l * 0.55},${hl * 0.3}`, 2.5, INK),
      };
    case 'point':
      return {
        u: P(c, d`M-6,${-hu}C${l * 0.3},${-hu * 1.05} ${l * 0.7},${-hu * 0.5} ${l},${1}L-4,3Z`),
        ux: P(hiU, d`M${l * 0.08},${-hu * 0.78}Q${l * 0.4},${-hu * 0.8} ${l * 0.7},${-hu * 0.32}Q${l * 0.4},${-hu * 0.55} ${l * 0.08},${-hu * 0.5}Z`, NS) +
          E(INK, l * 0.18, -hu * 0.5, 3, 1.6, NS),
        l: P(c2, d`M-4,0L${l * 0.94},0Q${l * 0.6},${hl * 0.8} -6,${hl}Z`),
      };
    case 'hook':
      return {
        u: P(c, d`M-6,${-hu}C${l * 0.45},${-hu * 1.45} ${l * 1.08},${-hu * 0.9} ${l},${hu * 0.62}Q${l * 0.94},${hu * 0.85} ${l * 0.86},${hu * 0.35}Q${l * 0.8},3 ${l * 0.68},3L-4,3Z`),
        ux: (b.c2 ? P(b.c2, d`M${l * 0.7},${-hu * 0.9}C${l * 0.95},${-hu * 0.7} ${l * 1.06},${-hu * 0.2} ${l},${hu * 0.62}Q${l * 0.94},${hu * 0.85} ${l * 0.86},${hu * 0.35}Q${l * 0.82},${hu * 0.1} ${l * 0.76},3Q${l * 0.82},${-hu * 0.4} ${l * 0.7},${-hu * 0.9}Z`) : '') +
          P(hiU, d`M${l * 0.12},${-hu * 0.9}Q${l * 0.45},${-hu * 1.1} ${l * 0.72},${-hu * 0.75}Q${l * 0.45},${-hu * 0.8} ${l * 0.12},${-hu * 0.62}Z`, NS) +
          E(INK, l * 0.24, -hu * 0.42, 3.5, 2, NS),
        l: P(dk(c, 0.15), d`M-4,0L${l * 0.74},0Q${l * 0.55},${hl} -6,${hl}Z`),
      };
    case 'pelican':
      return {
        u: P(c, d`M-8,${-hu}C${l * 0.3},${-hu * 1.1} ${l * 0.8},${-hu * 0.9} ${l * 0.98},${-hu * 0.45}Q${l * 1.05},${hu * 0.2} ${l * 0.96},${hu * 0.75}Q${l * 0.92},3 ${l * 0.86},3L-4,3Z`) +
          P('#e0503a', d`M${l * 0.9},${-hu * 0.72}Q${l * 1.05},${-hu * 0.3} ${l * 0.96},${hu * 0.75}Q${l * 0.92},3 ${l * 0.88},3Z`, sw(3)),
        ux: L(d`M${l * 0.05},${-hu * 0.45}Q${l * 0.5},${-hu * 0.6} ${l * 0.86},${-hu * 0.45}`, 2.5, dk(c, 0.4)),
        l: P(c2, d`M-6,0L${l * 0.88},0Q${l * 0.78},${hl * 2.6} ${l * 0.45},${hl * 4.6}Q${l * 0.1},${hl * 5.4} -10,${hl * 2.6}Q-12,${hl} -6,0Z`) +
          P(lt(c2, 0.3), d`M${l * 0.25},${hl * 1.2}Q${l * 0.55},${hl * 1.6} ${l * 0.7},${hl * 1.2}Q${l * 0.55},${hl * 2.6} ${l * 0.3},${hl * 3}Z`, NS) +
          L(d`M${l * 0.1},${hl * 3.6}Q${l * 0.3},${hl * 3.2} ${l * 0.36},${hl * 4.2}M${l * 0.5},${hl * 3}Q${l * 0.62},${hl * 2.8} ${l * 0.62},${hl * 3.4}`, 2.5, dk(c2, 0.35)),
      };
    case 'toucan':
      return {
        u: P(c, d`M-8,${-hu}C${l * 0.3},${-hu * 1.5} ${l * 0.92},${-hu * 1.2} ${l},${-hu * 0.05}Q${l * 1.01},${hu * 0.4} ${l * 0.93},${hu * 0.42}Q${l * 0.6},3 -4,3Z`),
        ux: P('#2a2026', d`M${l * 0.8},${-hu * 0.98}C${l * 0.95},${-hu * 0.75} ${l * 1.01},${-hu * 0.3} ${l},${-hu * 0.05}Q${l * 1.01},${hu * 0.4} ${l * 0.93},${hu * 0.42}Q${l * 0.88},${hu * 0.1} ${l * 0.82},2Q${l * 0.86},${-hu * 0.5} ${l * 0.8},${-hu * 0.98}Z`, NS) +
          P('#e0402a', d`M-6,${-hu * 1.02}C${l * 0.3},${-hu * 1.5} ${l * 0.7},${-hu * 1.32} ${l * 0.82},${-hu * 1.0}L${l * 0.8},${-hu * 0.88}C${l * 0.6},${-hu * 1.12} ${l * 0.3},${-hu * 1.22} -4,${-hu * 0.78}Z`, NS) +
          P(lt(c, 0.45), d`M${l * 0.15},${-hu * 0.6}Q${l * 0.45},${-hu * 0.95} ${l * 0.68},${-hu * 0.72}Q${l * 0.45},${-hu * 0.62} ${l * 0.15},${-hu * 0.35}Z`, NS) +
          P('none', d`M-6,${-hu}C${l * 0.3},${-hu * 1.5} ${l * 0.92},${-hu * 1.2} ${l},${-hu * 0.05}Q${l * 1.01},${hu * 0.4} ${l * 0.93},${hu * 0.42}`),
        l: P(c2, d`M-4,0L${l * 0.9},0Q${l * 0.6},${hl * 1.2} -6,${hl}Z`) +
          P('#2a2026', d`M${l * 0.78},0L${l * 0.9},0Q${l * 0.84},${hl * 0.5} ${l * 0.74},${hl * 0.62}Z`, NS),
      };
    case 'flamingo': {
      // bent bill: straight then kinks down at ~55%, black tip
      const up = d`M-6,${-hu}L${l * 0.5},${-hu * 0.9}Q${l * 0.7},${-hu * 0.85} ${l * 0.78},${hu * 0.6}L${l * 0.86},${hu * 2.6}Q${l * 0.84},${hu * 3.3} ${l * 0.76},${hu * 2.7}L${l * 0.58},${hu * 0.9}Q${l * 0.52},3 ${l * 0.4},3L-4,3Z`;
      return {
        u: P(c, up),
        ux: P('#2a2026', d`M${l * 0.66},${-hu * 0.85}Q${l * 0.74},${-hu * 0.7} ${l * 0.78},${hu * 0.6}L${l * 0.86},${hu * 2.6}Q${l * 0.84},${hu * 3.3} ${l * 0.76},${hu * 2.7}L${l * 0.6},${hu * 1}Q${l * 0.62},${-hu * 0.2} ${l * 0.66},${-hu * 0.85}Z`, sw(3)) +
          E(INK, l * 0.2, -hu * 0.45, 3, 1.5, NS),
        l: P(c2, d`M-4,0L${l * 0.42},0Q${l * 0.55},${hl * 0.3} ${l * 0.62},${hl * 1.6}Q${l * 0.4},${hl * 1.5} -6,${hl}Z`),
      };
    }
  }
};

/** [upper gape deg, lower gape deg, teeth] per expression. */
const MOUTH: Record<Expression, [number, number, boolean]> = {
  neutral: [0, 0, false],
  smug: [0, 0, false],
  angry: [5, 9, true],
  shocked: [6, 30, false],
  sweating: [3, 8, true],
  laughing: [14, 30, false],
  sad: [0, 3, false],
};
const CURL: Record<Expression, number> = { neutral: 0.3, smug: 1, angry: -1, shocked: 0, sweating: -0.6, laughing: 1, sad: -1 };

const drawBill = (k: K): string => {
  const b = k.sp.bill(k);
  const sh = billShapes(b, k);
  const [a1, a2, teeth] = MOUTH[k.ex];
  const l = b.L, Lm = l * (b.t === 'flamingo' ? 0.45 : b.t === 'hook' ? 0.62 : 0.78);
  const r1 = (-a1 * Math.PI) / 180, r2 = (a2 * Math.PI) / 180;
  let s = sh.back ?? '';
  if (a1 + a2 > 0) {
    const ux = Lm * Math.cos(r1), uy = Lm * Math.sin(r1), lx = Lm * Math.cos(r2), ly = Lm * Math.sin(r2);
    s += P('#6a1c1c', d`M-2,0L${ux},${uy}Q${Lm * 1.08},${(uy + ly) / 2} ${lx},${ly}Z`);
  }
  // lower mandible (+ tongue / teeth / toothpick)
  let lo = sh.l + (sh.lx ?? '');
  if (a2 >= 20) lo += P('#e46a72', d`M${Lm * 0.15},0Q${Lm * 0.45},${-Math.min(14, Lm * 0.2)} ${Lm * 0.8},-2Z`, sw(3));
  if (teeth) lo += P(WHITE, d`M4,0L${Lm * 0.8},0L${Lm * 0.75},-5L6,-5Z`, sw(2.5)) + L(d`M${Lm * 0.3},0V-5M${Lm * 0.55},0V-5`, 2);
  if (k.acc.has('toothpick'))
    lo += L(d`M${l * 0.28},-2L${l * 0.28 + 34},${18}`, 7) + L(d`M${l * 0.28},-2L${l * 0.28 + 33},${17.5}`, 3, '#e9c98a');
  s += G(`rotate(${f(a2)})`, lo);
  let up = sh.u + (sh.ux ?? '');
  if (teeth) up += P(WHITE, d`M4,0L${Lm * 0.8},0L${Lm * 0.75},5L6,5Z`, sw(2.5)) + L(d`M${Lm * 0.3},0V5M${Lm * 0.55},0V5`, 2);
  if (k.acc.has('mustache')) {
    const mx = Math.min(l * 0.16, 14), sc = Math.max(0.95, Math.min(1.25, b.hu / 17));
    const half = 'M0,-3C6,-9 14,-9 20,-4C25,0 31,0 35,-5Q37,-10 33,-13Q41,-12 40,-4Q37,6 24,7C14,8 6,7 0,6Z';
    const mc = k.o.plumage && lum(k.o.plumage) > 0.75 ? '#7a4a2a' : '#4a2a16';
    const hair = L('M4,1Q12,-3 20,1M-4,1Q-12,-3 -20,1', 2, lt(mc, 0.35));
    up += G(`translate(${f(mx)} ${f(b.hu * 0.05)}) rotate(${f(-b.a)}) scale(${f(sc)})`, P(mc, half) + P(mc, half, 'transform="scale(-1 1)"') + hair, sw(4 / sc));
  }
  s += G(`rotate(${f(-a1)})`, up);
  const c = CURL[k.ex];
  if (c) s += L(d`M0,1Q-8,${c * 1} -13,${-c * 8}`, 3.5);
  return G(`translate(${f(b.x)} ${f(b.y)}) rotate(${f(b.a)})`, s);
};

// ------------------------------------------------------------------ eyes & brows
interface Face {
  lid?: [number, number]; // cover fraction, tilt (+ = inner corner lower)
  bot?: number;
  pup: Pt;
  pr: number;
  brow: [number, number, number]; // innerDy, outerDy, arch (near eye)
  brow2?: [number, number, number]; // far eye (defaults to brow)
  scale?: number;
  closed?: boolean;
}
const FACES: Record<Expression, Face> = {
  neutral: { lid: [0.2, 0], pup: [2, 1], pr: 0.48, brow: [0, 0, 4] },
  smug: { lid: [0.52, -0.2], bot: 0.12, pup: [6, 1], pr: 0.45, brow: [-8, -14, 8], brow2: [4, 3, 1] },
  angry: { lid: [0.32, 0.8], pup: [0, 3], pr: 0.42, brow: [12, -6, -1] },
  shocked: { pup: [0, 0], pr: 0.17, brow: [-15, -13, 8], scale: 1.18 },
  sweating: { lid: [0.08, -0.4], pup: [-6, 0], pr: 0.32, brow: [-11, 4, 2] },
  laughing: { closed: true, pup: [0, 0], pr: 0, brow: [-14, -12, 6] },
  sad: { lid: [0.3, -0.7], pup: [-2, 6], pr: 0.44, brow: [-10, 7, 3] },
};

interface EyeGeo { x: number; y: number; rx: number; ry: number; inner: number }
const eyeGeo = (sp: Sp): EyeGeo[] => {
  const [x, y, r, dx, es = 0.86] = sp.e;
  return [
    { x: x + dx, y: y - 1, rx: r * es * 0.92, ry: r * 1.25 * es, inner: -1 },
    { x, y, rx: r, ry: r * 1.25, inner: 1 },
  ];
};

const drawEyes = (k: K): string => {
  const F = FACES[k.ex];
  const lidCol = k.sp.lid ? k.sp.lid(k) : k.M;
  let s = '';
  for (const g of eyeGeo(k.sp)) {
    const sc = F.scale ?? 1, rx = g.rx * sc, ry = g.ry * sc;
    if (F.closed) {
      const cp = d`M${g.x - rx * 0.95},${g.y + 3}Q${g.x},${g.y - ry * 0.95} ${g.x + rx * 0.95},${g.y + 3}`;
      s += lum(lidCol) < 0.3 ? L(cp, 9) + L(cp, 4, '#efe4d0') : L(cp, 6);
      continue;
    }
    s += E(WHITE, g.x, g.y, rx, ry);
    const px = g.x + F.pup[0] * (rx / 15), py = g.y + F.pup[1] * (ry / 19) + ry * 0.08, pr = rx * F.pr;
    if (k.sp.iris) {
      const ir = F.pr < 0.25 ? rx * 0.4 : rx * 0.72;
      s += C(k.sp.iris, px, py, ir, sw(2.5));
    }
    s += C(INK, px, py, k.sp.iris && F.pr >= 0.25 ? pr * 0.75 : pr, NS);
    s += C(WHITE, px + pr * 0.35, py - pr * 0.4, Math.max(1.6, pr * 0.32), NS);
    if (F.lid) {
      const [cov, tilt] = F.lid, y0 = g.y - ry + 2 * ry * cov;
      const dpath = clipEll(g.x, g.y, rx, ry, (x, y) => y - (y0 + tilt * ry * 0.5 * g.inner * (x - g.x) / rx));
      if (dpath) s += P(lidCol, dpath);
    }
    if (F.bot) {
      const y1 = g.y + ry - 2 * ry * F.bot;
      const dpath = clipEll(g.x, g.y, rx, ry, (_x, y) => y1 - y);
      if (dpath) s += P(lidCol, dpath);
    }
    if (k.sp.lashes || k.acc.has('pearls')) {
      const ox = g.x - g.inner * rx * 0.75, oy = g.y - ry * 0.7 + (F.lid ? ry * F.lid[0] : 0);
      s += L(d`M${ox},${oy}l${-g.inner * 8},-6M${ox + g.inner * 5},${oy - 4}l${-g.inner * 5},-8`, 3.5);
    }
  }
  return s;
};

const drawBrows = (k: K): string => {
  const F = FACES[k.ex];
  let s = '';
  for (const g of eyeGeo(k.sp)) {
    const [bi, bo, arch] = g.inner === 1 ? F.brow : F.brow2 ?? F.brow;
    const sc = F.scale ?? 1;
    const base = g.y - g.ry * sc - 8;
    const ix = g.x + g.inner * g.rx * 0.5, ox = g.x - g.inner * g.rx * 1.05;
    s += d`M${ox},${base + bo}Q${g.x},${base + Math.min(bi, bo) - arch} ${ix},${base + bi}`;
  }
  // dark faces get pale brows with an ink rim so expressions still read
  return lum(k.sp.lid ? k.sp.lid(k) : k.M) < 0.3 ? L(s, 10) + L(s, 4.5, '#efe4d0') : L(s, 7);
};

const drop = (x: number, y: number, s = 1, col = '#8fd3f0'): string =>
  P(col, d`M${x},${y - 11 * s}Q${x + 8 * s},${y} ${x + 5 * s},${y + 4 * s}Q${x},${y + 9 * s} ${x - 5 * s},${y + 4 * s}Q${x - 8 * s},${y} ${x},${y - 11 * s}Z`, sw(3)) +
  E(WHITE, x - 2 * s, y + 1 * s, 1.6 * s, 2.6 * s, NS);

const drawFx = (k: K): string => {
  const [hx, hy, rx, ry] = k.sp.h;
  const g = eyeGeo(k.sp)[1];
  switch (k.ex) {
    case 'sweating':
      return drop(hx - rx * 0.92, hy - ry * 0.35, 1.2) + drop(hx - rx * 1.05, hy + ry * 0.2, 0.9) + drop(hx + rx * 0.9, hy - ry * 0.6, 1);
    case 'sad':
      return drop(g.x - g.rx * 0.3, g.y + g.ry + 12, 0.9);
    case 'angry': {
      const x = hx - rx * 0.62, y = hy - ry * 0.35;
      return L(d`M${x - 9},${y - 3}Q${x - 3},${y - 3} ${x - 3},${y - 9}M${x + 3},${y - 9}Q${x + 3},${y - 3} ${x + 9},${y - 3}M${x - 9},${y + 3}Q${x - 3},${y + 3} ${x - 3},${y + 9}M${x + 3},${y + 9}Q${x + 3},${y + 3} ${x + 9},${y + 3}`, 4, '#c8302a');
    }
    case 'shocked': {
      const x = hx - rx - 10, y = hy - ry * 0.3;
      return L(d`M${x},${y}l-14,-8M${x - 2},${y + 14}l-16,0M${x},${y + 28}l-14,8M${hx + rx * 0.85},${hy - ry * 0.95}l10,-10`, 4);
    }
    case 'laughing':
      return E('#f08a8a', g.x - 6, g.y + g.ry + 6, 10, 6, `${NS} opacity=".55"`);
  }
  return '';
};

// ------------------------------------------------------------------ hats
const HATC: Partial<Record<Hat, string>> = {
  cowboy: '#8a5a2b', sheriff: '#c9a46a', tophat: '#2e2834', bowler: '#3b2c26', derby: '#3a4a6a',
  feathered: '#7a3a6e', crown: '#f2c230', visor: '#3f9a5a', bandit: '#2a2430',
};
const cowboyHat = (col: string, k: K, sheriff = false): string => {
  const dn = (k.r() - 0.5) * 8, bd = dk(col, 0.45);
  return (
    P(col, d`M-40,8Q-46,-26 -36,-50Q-22,-62 ${dn - 6},-52Q${dn},-46 ${dn + 6},-52Q22,-62 36,-50Q46,-26 40,8Z`) +
    P(lt(col, 0.25), d`M-32,-6Q-36,-30 -28,-46Q-24,-30 -24,-6Z`, NS) +
    L(d`M${dn},-46Q${dn + 3},-36 ${dn - 2},-24`, 3) +
    P(bd, d`M-42,-10Q0,-2 42,-10L42,2Q0,10 -42,2Z`) +
    (sheriff ? P('#f2c230', star(0, -28, 13, 6, 5), sw(3)) + C(WHITE, -2, -32, 2, NS) : '') +
    P(col, d`M-84,-16Q-78,4 -40,4Q0,8 40,4Q78,4 84,-16Q88,-2 76,8Q50,22 0,22Q-50,22 -76,8Q-88,-2 -84,-16Z`) +
    P(dk(col, 0.25), d`M-70,10Q-40,18 0,18Q40,18 70,10Q50,20 0,20Q-50,20 -70,10Z`, NS)
  );
};
const BRIM: Partial<Record<Hat, number>> = { cowboy: 21, 'sombrero-free': 21, sheriff: 21, tophat: 15, bowler: 14, derby: 20, feathered: 18, crown: 8, visor: 14 };
const HAT_H: Partial<Record<Hat, number>> = { cowboy: 60, 'sombrero-free': 60, sheriff: 60, tophat: 70, bowler: 58, derby: 44, feathered: 62, crown: 50, visor: 30 };
/** y of the hat's highest point (for framing). */
const hatTop = (k: K): number => {
  const h = HAT_H[k.hat];
  if (h === undefined) return 99;
  const [, dy, s] = k.sp.hatA;
  return k.sp.e[1] - k.sp.e[2] * 1.25 - 11 - (BRIM[k.hat] ?? 20) * s + dy - h * s;
};
const drawHat = (k: K): string => {
  const hat = k.hat;
  if (hat === 'none' || hat === 'bandit') return '';
  const col = k.o.accent ?? HATC[hat] ?? '#8a5a2b';
  const [x, dy, s0, t0] = k.sp.hatA;
  // sit the brim just above the brows: eye top - brow room - brim depth
  const [, ey, er] = k.sp.e;
  const y = ey - er * 1.25 - 11 - (BRIM[hat] ?? 20) * s0 + dy;
  let s = s0, t = t0 + (k.r() - 0.5) * 6, oy = 0, body = '';
  if (k.ex === 'shocked') { oy -= 12; t += 5; }
  switch (hat) {
    case 'cowboy':
    case 'sombrero-free':
      body = cowboyHat(col, k);
      break;
    case 'sheriff':
      body = cowboyHat(col, k, true);
      break;
    case 'tophat':
      body =
        P(col, d`M-32,4L-36,-62Q0,-70 36,-62L32,4Z`) +
        P(lt(col, 0.2), d`M-26,-6L-28,-56Q-22,-58 -18,-58L-17,-6Z`, NS) +
        E(dk(col, 0.3), 0, -63, 36, 7) +
        P(k.o.accent ? dk(col, 0.45) : '#8a2a2a', d`M-34,-16Q0,-10 34,-16L33,-2Q0,4 -33,-2Z`) +
        P(col, d`M-54,-8Q-50,4 0,4Q50,4 54,-8Q58,4 46,10Q30,16 0,16Q-30,16 -46,10Q-58,4 -54,-8Z`);
      break;
    case 'bowler':
      body =
        P(col, d`M-38,4Q-42,-54 0,-56Q42,-54 38,4Z`) +
        P(lt(col, 0.2), d`M-28,-8Q-30,-40 -12,-48Q-22,-34 -20,-8Z`, NS) +
        P(dk(col, 0.4), d`M-39,-10Q0,-4 39,-10L38,2Q0,8 -38,2Z`) +
        P(col, d`M-58,-6Q-50,4 0,4Q50,4 58,-6Q62,4 48,10Q30,15 0,15Q-30,15 -48,10Q-62,4 -58,-6Z`);
      break;
    case 'derby': // flat-topped conductor/porkpie cap
      body =
        P(col, d`M-38,4L-40,-36Q0,-44 40,-36L38,4Z`) +
        E(dk(col, 0.25), 0, -37, 40, 7) +
        P(lt(col, 0.2), d`M-30,-4L-32,-30L-24,-31L-23,-4Z`, NS) +
        P('#f2c230', d`M-39,-12Q0,-6 39,-12L38,-2Q0,4 -38,-2Z`, sw(3)) +
        P(dk(col, 0.35), d`M-50,0Q0,10 56,-2Q66,10 40,18Q0,24 -40,16Q-58,10 -50,0Z`);
      break;
    case 'feathered': {
      const plume = mix(col, '#ffffff', 0.55);
      body =
        P(plume, d`M22,-34C36,-66 84,-74 108,-44C88,-52 66,-46 52,-32Z`) +
        L(d`M32,-38C48,-60 76,-64 102,-48M58,-50l-4,-9M72,-56l-1,-9M86,-56l2,-9`, 3) +
        P(col, d`M-40,-6Q-42,-52 0,-54Q42,-52 40,-6Z`) +
        P(lt(col, 0.2), d`M-30,-12Q-30,-38 -14,-46Q-22,-30 -20,-12Z`, NS) +
        P(dk(col, 0.35), d`M-41,-20Q0,-12 41,-20L40,-6Q0,2 -40,-6Z`) +
        C('#f07aa0', 30, -14, 9) + C('#f7c0d4', 30, -14, 4, sw(2.5)) +
        P(col, d`M-82,-8Q-60,-20 0,-10Q60,-20 86,-12Q96,2 72,8Q0,20 -70,12Q-94,6 -82,-8Z`);
      break;
    }
    case 'crown':
      s = s0 * 0.8;
      body =
        P(col, d`M-38,2L-46,-48L-22,-24L0,-58L22,-24L46,-48L38,2Q0,8 -38,2Z`) +
        P(lt(col, 0.4), d`M-30,-6L-36,-32L-22,-16Z`, NS) +
        P(dk(col, 0.2), d`M-39,-12Q0,-6 39,-12L38,2Q0,8 -38,2Z`) +
        C('#d8302a', 0, -4, 6, sw(3)) + C('#3a8ad8', -22, -5, 4.5, sw(3)) + C('#3a8ad8', 22, -5, 4.5, sw(3)) +
        C(col, -46, -50, 5, sw(3)) + C(col, 0, -60, 5, sw(3)) + C(col, 46, -50, 5, sw(3));
      break;
    case 'visor':
      body =
        P(dk(col, 0.35), d`M-52,-18Q0,-34 52,-18L52,-6Q0,-22 -52,-6Z`) +
        P(col, d`M-58,-10Q0,-26 58,-10L70,12Q0,-4 -70,12Z`, 'fill-opacity=".85"') +
        L(d`M-50,0Q0,-14 50,0`, 2.5, lt(col, 0.5));
      break;
  }
  return G(`translate(${f(x)} ${f(y + oy)}) rotate(${f(t)}) scale(${f(s)})`, body, sw(4 / s));
};

// ------------------------------------------------------------------ accessories
const neckwear = (k: K): string => {
  const [x, y, w] = k.sp.neck;
  const red = k.o.accent2 ?? (k.hat === 'none' || k.hat === 'bandit' || k.hat === 'crown' ? k.o.accent : undefined) ?? '#c8302a';
  let s = '';
  if (k.acc.has('pearls'))
    for (let i = 0; i <= 10; i++) {
      const t = i / 5 - 1;
      s += C('#fbf3e4', x + t * w * 1.02, y + 6 + 12 * (1 - t * t), 5.5, sw(2.5)) + C(WHITE, x + t * w * 1.02 - 1.5, y + 4.5 + 12 * (1 - t * t), 1.6, NS);
    }
  if (k.acc.has('bandana')) {
    const dots = [[-14, 16], [12, 18], [0, 30], [-26, 6], [24, 6]].map(([a, b]) => C(lt(red, 0.7), x + a, y + b, 2.6, NS)).join('');
    s +=
      P(red, d`M${x - w * 0.8},${y + 6}Q${x},${y + 20} ${x + w * 0.8},${y + 6}L${x + 8},${y + 54}Q${x},${y + 58} ${x - 6},${y + 50}Z`) +
      P(red, d`M${x - w - 2},${y - 6}Q${x},${y + 10} ${x + w + 2},${y - 6}L${x + w + 4},${y + 6}Q${x},${y + 24} ${x - w - 4},${y + 6}Z`) +
      P(dk(red, 0.25), d`M${x - 4},${y + 22}L${x + 6},${y + 50}L${x + 2},${y + 22}Z`, NS) + dots +
      P(red, d`M${x + w},${y}l18,10l-6,4l10,10l-16,-6Z`, sw(3));
  }
  if (k.acc.has('bowtie')) {
    const bc = k.o.accent2 ?? '#b8282a';
    s +=
      P(WHITE, d`M${x - 30},${y - 4}L${x - 2},${y + 8}L${x - 20},${y + 22}Z`) +
      P(WHITE, d`M${x + 30},${y - 4}L${x + 2},${y + 8}L${x + 20},${y + 22}Z`) +
      P(bc, d`M${x},${y + 10}L${x - 26},${y - 2}Q${x - 32},${y + 12} ${x - 26},${y + 24}Z`) +
      P(bc, d`M${x},${y + 10}L${x + 26},${y - 2}Q${x + 32},${y + 12} ${x + 26},${y + 24}Z`) +
      E(dk(bc, 0.2), x, y + 10, 7, 8);
  }
  if (k.acc.has('badge')) {
    const [bx, by] = k.sp.chest;
    let tips = '';
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 3;
      tips += C('#f2c230', bx + Math.cos(a) * 19, by + Math.sin(a) * 19, 3.5, sw(2.5));
    }
    s += P('#f2c230', star(bx, by, 18, 10, 6)) + tips + C('#d9a21a', bx, by, 7, sw(2.5)) + highlight('#fff2b0', bx - 5, by - 6, 4, 2.5);
  }
  return s;
};

const faceUnder = (k: K): string => {
  const [far, near] = eyeGeo(k.sp);
  let s = '';
  if (k.acc.has('scar')) {
    const x = near.x - near.rx * 0.3, y = near.y;
    const x0 = x + 4, y0 = y - near.ry * 2, x1 = x - near.rx * 1.1, y1 = y + near.ry * 1.8;
    let st = '';
    for (const t of [0.12, 0.3, 0.72, 0.9]) {
      const sx = x0 + (x1 - x0) * t, sy = y0 + (y1 - y0) * t;
      st += d`M${sx - 6},${sy - 3}l12,4`;
    }
    s += L(d`M${x0},${y0}L${x1},${y1}`, 9, INK) + L(d`M${x0},${y0}L${x1},${y1}`, 4.5, '#e8968a') + L(st, 3);
  }
  if (k.hat === 'bandit') {
    const col = k.o.accent ?? HATC.bandit!;
    const x1 = near.x - near.rx * 1.6, x2 = far.x + far.rx * 1.45, y = near.y, h = near.ry * 1.25, m = (near.x + far.x) / 2;
    s +=
      P(col, d`M${x1 + 2},${y - h * 0.3}l-30,-14q4,14 -2,22q12,-2 26,2Z`) +
      P(col, d`M${x1 + 2},${y + h * 0.2}l-26,16q10,4 10,16q10,-14 20,-16Z`) +
      P(col, d`M${x1},${y - h * 0.65}C${x1 + 20},${y - h * 1.25} ${x2 - 14},${y - h * 1.3} ${x2 + 4},${y - h * 0.8}Q${x2 + 10},${y + h * 0.1} ${x2 - 2},${y + h * 0.75}Q${(m + x2) / 2},${y + h * 0.95} ${m},${y + h * 0.45}Q${(x1 + m) / 2},${y + h * 1.05} ${x1 + 2},${y + h * 0.6}Q${x1 - 8},${y} ${x1},${y - h * 0.65}Z`) +
      highlight(lt(col, 0.25), x1 + 14, y - h * 0.62, 12, 3, -12);
  }
  return s;
};

const faceOver = (k: K): string => {
  const [far, near] = eyeGeo(k.sp);
  let s = '';
  if (k.acc.has('glasses')) {
    const r1 = near.ry * 1.02, r2 = far.ry * 1.02;
    s +=
      C('#dff1f4', near.x, near.y, r1, `fill-opacity=".3" ${sw(4.5)}`) +
      C('#dff1f4', far.x + 2, far.y, r2, `fill-opacity=".3" ${sw(4.5)}`) +
      L(d`M${near.x + r1 * 0.8},${near.y - r1 * 0.5}Q${(near.x + far.x) / 2 + 1},${near.y - r1 * 0.85} ${far.x + 2 - r2 * 0.8},${far.y - r2 * 0.5}M${near.x - r1},${near.y - 2}L${k.sp.h[0] - k.sp.h[2] * 0.92},${near.y - 8}`, 4.5) +
      L(d`M${near.x - r1 * 0.5},${near.y - r1 * 0.35}l8,-8M${far.x - r2 * 0.4},${far.y - r2 * 0.35}l7,-7`, 3, WHITE);
  }
  if (k.acc.has('monocle')) {
    const r = near.ry * 1.08;
    s += C('#dff1f4', near.x, near.y, r, `fill-opacity=".25" ${sw(7)}`) + C('none', near.x, near.y, r, `stroke="#e8b830" ${sw(3)}`) +
      L(d`M${near.x - r * 0.4},${near.y + r * 0.95}C${near.x - r},${near.y + r * 2.5} ${near.x + 10},${near.y + r * 3} ${near.x - 4},${near.y + r * 4.2}`, 2.5, '#c89a20') +
      L(d`M${near.x - r * 0.5},${near.y - r * 0.4}l8,-8`, 3, WHITE);
  }
  if (k.acc.has('eyepatch')) {
    const [hx, hy, rx, ry] = k.sp.h;
    s += L(d`M${hx - rx * 0.96},${hy - ry * 0.05}L${near.x},${near.y}L${hx + rx * 0.2},${hy - ry * 0.98}`, 4.5, '#1e1a1e') +
      E('#24202a', near.x, near.y + 2, near.rx * 1.25, near.ry * 1.12) +
      highlight('#4a4450', near.x - 4, near.y - 6, 6, 3);
  }
  return s;
};

// ------------------------------------------------------------------ species
const crown = (k: K): string => {
  // chicken comb poking out through the top of whatever hat it wears
  const H: Partial<Record<Hat, number>> = { cowboy: 50, 'sombrero-free': 50, sheriff: 50, tophat: 66, bowler: 54, derby: 40, feathered: 52, crown: 46 };
  const h = H[k.hat];
  if (h === undefined) return '';
  const [x, dy, s] = k.sp.hatA;
  const y = k.sp.e[1] - k.sp.e[2] * 1.25 - 11 - (BRIM[k.hat] ?? 20) * s + dy + (k.ex === 'shocked' ? -12 : 0);
  const t = y - h * s * (k.hat === 'crown' ? 0.8 : 1);
  return G(`translate(${f(x - 4)} ${f(t + 6)}) scale(.7)`, P('#d8322a', 'M-24,8Q-30,-10 -16,-12Q-14,-26 -2,-22Q4,-36 16,-26Q28,-28 26,-12Q36,-6 28,8Z') + highlight('#f07a6a', -4, -16, 6, 3), sw(5.5));
};
const STD = { h: [108, 114, 62, 58] as [number, number, number, number], e: [112, 108, 20, 36] as [number, number, number, number] };

const SPECIES: Record<Species, Sp> = {
  duck: {
    main: '#3f8a4c', hat: 'cowboy',
    h: [108, 114, 64, 60], e: [112, 108, 20, 36],
    bill: () => ({ t: 'duck', x: 134, y: 145, a: 8, L: 82, hu: 21, hl: 12, c: '#f2b630', c2: '#e09a24' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 180, 44], chest: [60, 216],
    body: k => {
      const white = lum(k.M) > 0.75, wing = white ? dk(k.M, 0.1) : '#b3a38c';
      return shoulders(wing, 188) + wingLines(dk(wing, 0.3), 188) + bib(k.M, 150, 42) +
        (white ? '' : P('#8c4a2c', d`M64,198Q112,212 160,198C166,212 176,228 180,248L44,248C48,228 58,212 64,198Z`) +
          P(WHITE, d`M70,182Q112,196 154,182L158,194Q112,210 66,194Z`, sw(3))) +
        scallops(dk(white ? k.M : '#8c4a2c', 0.25), 86, 220, 4, 2);
    },
    head: k => roundHead(k.M, k.sp.h) + tuft(k, 100, 58, k.M, 3, 14),
  },
  goose: {
    hs: [1.12, 112, 128],
    main: '#9a8a76', hat: 'none',
    h: [116, 90, 50, 46], e: [118, 84, 17, 30],
    bill: () => ({ t: 'goose', x: 144, y: 110, a: 12, L: 74, hu: 17, hl: 9, c: '#f08a2a', c2: '#e07a22' }),
    hatA: [118, 0, 0.76, -6], neck: [100, 198, 36], chest: [182, 222],
    body: k => {
      const chest = lum(k.M) > 0.8 ? lt(k.M, 0.3) : '#efe6d6';
      return shoulders(dk(k.M, 0.12), 204) + wingLines(dk(k.M, 0.35), 204) + scallops(dk(k.M, 0.35), 18, 234, 3, 1) + scallops(dk(k.M, 0.35), 174, 234, 3, 1) +
        bib(chest, 204, 46, 108, 66) +
        P(k.M, tube([104, 254, 86, 200, 88, 150, 112, 120], 32, 27)) +
        P(dk(k.M, 0.2), tube([84, 254, 68, 200, 72, 150, 96, 122], 8, 6), NS) +
        P(lt(k.M, 0.25), tube([122, 250, 104, 202, 106, 156, 128, 128], 8, 5), NS);
    },
    head: k => roundHead(k.M, k.sp.h) + P(dk(k.M, 0.2), d`M72,94Q76,52 114,46Q88,58 82,100Z`, NS) + tuft(k, 110, 48, k.M, 2, 10),
  },
  swan: {
    hs: [1.12, 118, 110],
    main: '#f7f3ea', hat: 'none', lashes: true,
    h: [122, 84, 46, 40], e: [124, 80, 16, 28],
    bill: k => ({ t: 'goose', x: 148, y: 98, a: 14, L: 62, hu: 14, hl: 8, c: lum(k.M) < 0.35 ? '#d8302a' : '#e8762a', c2: '#2a2026' }),
    hatA: [122, 0, 0.72, -8], neck: [88, 202, 28], chest: [184, 224],
    body: k => shoulders(dk(k.M, 0.06), 206) + wingLines(dk(k.M, 0.25), 206) + scallops(dk(k.M, 0.2), 16, 234, 3, 1) + scallops(dk(k.M, 0.2), 176, 234, 3, 1) +
      P(k.M, tube([104, 256, 30, 196, 168, 150, 120, 104], 28, 22, 18)) +
      P(dk(k.M, 0.1), tube([92, 256, 18, 196, 156, 150, 108, 104], 12, 8, 18), NS),
    head: k => roundHead(k.M, k.sp.h) + P(lum(k.M) < 0.35 ? '#5a5060' : '#2a2026', d`M138,90Q150,74 160,90Q160,104 146,106Z`, NS),
  },
  turkey: {
    main: '#7a5232', hat: 'cowboy',
    h: [110, 106, 54, 52], e: [110, 100, 18, 32],
    lid: () => '#9ec3d6',
    bill: () => ({ t: 'point', x: 138, y: 124, a: 20, L: 42, hu: 12, hl: 8, c: '#ecd29a' }),
    hatA: [114, 0, 0.86, -6], neck: [112, 178, 40], chest: [60, 218],
    body: k => {
      let fan = '';
      for (let i = -3; i <= 3; i++) {
        const c1 = i % 2 ? dk(k.M, 0.12) : lt(k.M, 0.18);
        fan += G(`rotate(${i * 26} 112 200)`, P(c1, d`M94,196Q86,96 112,40Q138,96 130,196Z`) + P('#efe2c4', d`M97,88Q112,58 127,88Q112,78 97,88Z`, NS) + P(INK, d`M102,62Q112,42 122,62Q112,54 102,62Z`, NS));
      }
      return fan + shoulders(k.M, 190) + wingLines(dk(k.M, 0.35), 190) + bib(dk(k.M, 0.15), 166, 30, 112, 66) +
        scallops(dk(k.M, 0.45), 74, 204, 6, 3, 13) +
        P('#9ec3d6', tube([112, 198, 108, 178, 106, 160, 110, 146], 22, 26)) +
        C('#d0382e', 94, 178, 5, sw(3)) + C('#d0382e', 126, 182, 5, sw(3)) + C('#d0382e', 108, 190, 5, sw(3));
    },
    head: k => roundHead('#9ec3d6', k.sp.h) + L(d`M80,74Q86,64 94,66M122,62Q128,60 134,66`, 3, '#7aa2b8'),
    over: () => P('#d0382e', d`M134,134Q120,150 124,166Q130,180 140,172Q146,160 140,146Q142,138 140,132Z`) +
      P('#d0382e', d`M132,112Q146,100 153,112Q158,126 153,140Q148,146 145,139Q147,126 139,119Z`) +
      E(lt('#d0382e', 0.4), 130, 160, 3, 5, NS),
  },
  vulture: {
    main: '#3d3030', hat: 'tophat',
    h: [108, 100, 52, 50], e: [108, 94, 18, 32],
    lid: () => '#d98a78',
    bill: () => ({ t: 'hook', x: 134, y: 118, a: 16, L: 58, hu: 20, hl: 10, c: '#e9dcc0', c2: '#5a4a44' }),
    hatA: [110, 0, 0.78, -8], neck: [110, 172, 36], chest: [60, 218],
    body: k => shoulders(k.M, 190) + wingLines(lt(k.M, 0.25), 190) + bib(dk(k.M, 0.1), 184, 40) +
      P('#d98a78', tube([110, 190, 106, 166, 104, 146, 108, 130], 22, 24)) +
      L(d`M96,154q8,4 18,0M98,164q8,4 18,0`, 2.5, '#a8604e') +
      [66, 84, 102, 120, 138, 156].map((x, i) => C('#efe6d6', x, 184 + (i % 2) * 4, 15, sw(3.5))).join('') +
      [76, 94, 112, 130, 148].map(x => C('#efe6d6', x, 196, 13, sw(3.5))).join(''),
    head: k => roundHead('#d98a78', k.sp.h) + L(d`M70,112q6,4 12,0M68,124q8,4 14,0M80,66q6,-4 12,0M98,58q6,-3 12,1`, 3, '#a8604e') + tuft(k, 98, 52, '#efe6d6', 3, 10),
  },
  pelican: {
    hs: [1.08, 100, 128],
    main: '#f2ede2', hat: 'none',
    h: [104, 90, 50, 46], e: [110, 86, 17, 30],
    bill: () => ({ t: 'pelican', x: 128, y: 108, a: 12, L: 112, hu: 13, hl: 10, c: '#f0b040', c2: '#f07a4a' }),
    hatA: [106, 0, 0.8, -6], neck: [92, 200, 34], chest: [190, 224],
    body: k => shoulders('#c9c3b6', 202) + wingLines('#8a8478', 202) + scallops('#8a8478', 14, 232, 3, 1) + scallops('#8a8478', 176, 232, 3, 1) +
      P(k.M, tube([96, 256, 90, 200, 80, 160, 98, 124], 32, 30)) + P(dk(k.M, 0.1), tube([80, 256, 74, 200, 64, 160, 82, 126], 10, 8), NS),
    head: k => roundHead(k.M, k.sp.h) + P('#f3dc8a', d`M56,88Q60,48 100,44Q130,44 144,66Q118,56 94,60Q70,66 56,88Z`, NS) + tuft(k, 90, 46, '#f3dc8a', 3, 12),
  },
  owl: {
    main: '#9a6a40', hat: 'none', iris: '#f2c230',
    h: [112, 108, 76, 64], e: [88, 112, 23, 48, 0.95],
    lid: k => dk(k.M, 0.1),
    bill: () => ({ t: 'hook', x: 112, y: 122, a: 68, L: 28, hu: 10, hl: 5, c: '#e9c56a' }),
    hatA: [112, 0, 1, -4], neck: [112, 176, 46], chest: [64, 216],
    body: k => shoulders(k.M, 182) + wingLines(dk(k.M, 0.35), 182) + bib(lt(k.M, 0.45), 162, 50, 112, 64) +
      L(d`M96,198l4,6l4,-6M120,194l4,6l4,-6M106,216l4,6l4,-6M132,214l4,6l4,-6M86,224l4,6l4,-6M118,234l4,6l4,-6`, 3, dk(k.M, 0.2)),
    head: k => {
      const disc = '#ecd8b0';
      return P(k.M, d`M48,64L38,20L82,50Z`) + P(k.M, d`M176,64L188,20L144,50Z`) +
        P(dk(k.M, 0.25), d`M50,58L44,32L70,50Z`, NS) + P(dk(k.M, 0.25), d`M174,58L180,32L156,50Z`, NS) +
        roundHead(k.M, k.sp.h) +
        P(disc, d`M112,86Q96,62 76,70Q48,80 48,112Q50,144 80,148Q102,150 112,136Q122,150 144,148Q172,144 172,112Q172,80 148,70Q128,62 112,86Z`) +
        L(d`M64,138q-6,-6 -8,-14M160,138q6,-6 8,-14`, 2.5, dk(disc, 0.3));
    },
  },
  crow: {
    main: '#2e3040', hat: 'cowboy', ...STD,
    lid: k => lt(k.M, 0.12),
    bill: () => ({ t: 'point', x: 134, y: 143, a: 10, L: 80, hu: 18, hl: 11, c: '#3a3a44', c2: '#2a2a32' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 178, 42], chest: [60, 216],
    body: k => shoulders(k.M, 188) + wingLines('#56658a', 188) + bib(lt(k.M, 0.06), 150, 40) + scallops('#56658a', 82, 208, 5, 3),
    head: k => roundHead(k.M, k.sp.h) + highlight('#56658a', 80, 86, 16, 7) + tuft(k, 104, 60, k.M, 4, 18),
  },
  penguin: {
    main: '#2b2d38', hat: 'bowler',
    h: [110, 112, 64, 60], e: [114, 104, 19, 34],
    lid: k => lt(k.M, 0.1),
    bill: () => ({ t: 'point', x: 140, y: 138, a: 12, L: 54, hu: 15, hl: 9, c: '#2e2e36', c2: '#f2a830' }),
    hatA: [114, 0, 0.9, -6], neck: [112, 178, 40], chest: [60, 216],
    body: k => shoulders(k.M, 186) + wingLines(lt(k.M, 0.2), 186) + bib('#fbf7ee', 156, 36, 112, 54) +
      L(d`M112,204v40`, 2.5, '#d8cfc0') + C('#2a2430', 112, 218, 3, NS) + C('#2a2430', 112, 234, 3, NS),
    head: k => roundHead(k.M, k.sp.h) +
      P('#fbf7ee', d`M76,112Q74,76 106,78Q120,66 138,76Q168,80 164,116Q162,152 120,158Q78,156 76,112Z`, sw(3)) +
      P('#f2a830', d`M56,130Q54,112 66,106Q72,124 68,142Z`, NS) + highlight(lt(k.M, 0.25), 80, 70, 14, 6),
  },
  chicken: {
    main: '#f7f0e2', hat: 'none',
    h: [110, 114, 58, 56], e: [114, 106, 18, 34],
    bill: () => ({ t: 'point', x: 140, y: 136, a: 14, L: 44, hu: 13, hl: 9, c: '#f2b630' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 180, 40], chest: [60, 216],
    body: k => shoulders(dk(k.M, 0.08), 188) + wingLines(dk(k.M, 0.3), 188) + bib(k.M, 150, 38) + scallops(dk(k.M, 0.22), 80, 202, 5, 3),
    head: k => {
      const comb = P('#d8322a', d`M84,68Q76,48 90,46Q92,32 106,36Q112,22 124,32Q138,30 136,46Q146,50 140,64Z`) + highlight('#f07a6a', 104, 42, 6, 3);
      return (k.hat === 'none' || k.hat === 'bandit' || k.hat === 'visor' ? comb : '') + roundHead(k.M, k.sp.h) + tuft(k, 82, 74, k.M, 2, 10);
    },
    top: crown,
    over: k => P('#d8322a', d`M136,146Q128,160 134,172Q142,178 146,166Q148,154 142,144Z`) + C('#d8322a', 78, 128, 6, sw(3)),
  },
  ostrich: {
    hs: [1.1, 118, 120],
    main: '#2e2a2a', hat: 'none', lashes: true,
    h: [120, 86, 48, 42], e: [122, 84, 19, 32, 0.88],
    lid: () => '#e3b5a0',
    bill: () => ({ t: 'duck', x: 148, y: 106, a: 12, L: 56, hu: 12, hl: 8, c: '#e8b49a', c2: '#d89a80' }),
    hatA: [122, 0, 0.74, -6], neck: [110, 202, 20], chest: [182, 226],
    body: k => {
      const plume = (x: number, y: number, a: number): string =>
        G(`rotate(${a} ${x} ${y})`, P('#fbf7ee', d`M${x},${y}Q${x - 14},${y - 30} ${x},${y - 46}Q${x + 14},${y - 30} ${x},${y}Z`, sw(3)) + L(d`M${x},${y - 4}V${y - 40}`, 2, '#c9c0b0'));
      return plume(24, 230, -30) + plume(204, 230, 30) + plume(44, 218, -12) + plume(186, 218, 14) +
        shoulders(k.M, 202) + [30, 56, 82, 142, 168, 194].map(x => P(lt(k.M, 0.15), d`M${x - 12},${212 + Math.abs(x - 112) * 0.1}q12,14 24,0`, NS)).join('') +
        P('#e3b5a0', tube([110, 256, 112, 196, 108, 150, 118, 118], 16, 14)) + L(d`M104,176q6,4 12,0M104,196q6,4 12,0`, 2.5, '#c08870');
    },
    head: k => roundHead('#e3b5a0', k.sp.h) + L(d`M110,46q-6,-14 2,-20M120,44q2,-14 10,-16M100,50q-10,-8 -8,-18`, 3) + highlight(WHITE, 96, 64, 8, 4),
  },
  heron: {
    hs: [1.1, 116, 118],
    main: '#9aabbd', hat: 'none', iris: '#f2c230',
    h: [118, 88, 46, 40], e: [122, 86, 16, 28],
    lid: () => '#f7f3ea',
    bill: () => ({ t: 'point', x: 148, y: 104, a: 18, L: 92, hu: 11, hl: 7, c: '#f0c02a', c2: '#d8a020' }),
    hatA: [122, 0, 0.74, -6], neck: [98, 202, 24], chest: [184, 226],
    body: k => shoulders(k.M, 204) + wingLines(dk(k.M, 0.35), 204) +
      L(d`M40,240q20,-20 30,-30M190,240q-20,-20 -30,-30`, 3, lt(k.M, 0.5)) +
      P('#f2eee6', tube([104, 256, 76, 196, 146, 160, 116, 118], 22, 18, 16)) +
      L(d`M98,222l4,8M92,204l4,8M98,186l4,8M110,170l4,8`, 3.5, '#3a3a4a'),
    head: k => P(k.M, d`M92,70Q60,54 34,72Q58,66 76,78Q52,80 40,100Q64,84 92,88Z`) +
      roundHead('#f7f3ea', k.sp.h) + P('#2a2a35', d`M74,78Q100,64 134,72L134,78Q104,72 78,86Z`, NS),
  },
  toucan: {
    main: '#24242c', hat: 'visor',
    h: [92, 112, 60, 58], e: [92, 98, 19, 32],
    lid: () => '#5aa0d8',
    bill: () => ({ t: 'toucan', x: 108, y: 146, a: 8, L: 126, hu: 34, hl: 18, c: '#f28a1e', c2: '#f2b030' }),
    hatA: [94, 0, 0.92, -6], neck: [104, 178, 42], chest: [52, 216],
    body: k => shoulders(k.M, 188) + wingLines(lt(k.M, 0.25), 188) + bib('#f7e07a', 156, 40, 104, 64) +
      P('#d8302a', d`M64,236Q104,248 144,236L148,248L60,248Z`, NS),
    head: k => roundHead(k.M, k.sp.h) + highlight(lt(k.M, 0.2), 66, 80, 14, 6) +
      P('#f7e07a', d`M46,140Q66,170 112,168Q100,158 104,148Q76,154 46,140Z`, sw(3)) +
      E('#5aa0d8', 96, 98, 30, 34, sw(3)),
  },
  eagle: {
    main: '#5a3a24', hat: 'sheriff', iris: '#f2c230',
    h: [108, 112, 62, 58], e: [112, 104, 18, 32],
    lid: () => '#f2ede2',
    bill: () => ({ t: 'hook', x: 134, y: 130, a: 16, L: 66, hu: 25, hl: 13, c: '#f2c02a', c2: '#e0a020' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 182, 42], chest: [60, 218],
    body: k => shoulders(k.M, 188) + wingLines(lt(k.M, 0.2), 188) + scallops(lt(k.M, 0.18), 16, 218, 3, 2) + scallops(lt(k.M, 0.18), 172, 218, 3, 2) +
      bib(dk(k.M, 0.1), 166, 44, 112, 70) +
      P('#f7f3ea', d`M52,146Q54,176 70,186L78,174L88,192L98,176L108,196L118,176L128,192L138,174L148,186Q166,172 166,146Z`),
    head: k => {
      const w = '#f7f3ea';
      return roundHead(w, k.sp.h) + P(w, d`M50,102L34,108L48,116L32,126L50,128Z`) + P(dk(w, 0.08), d`M70,82Q100,68 144,80Q142,90 130,92Q100,82 76,96Z`, NS);
    },
  },
  pigeon: {
    main: '#8f99a8', hat: 'derby', iris: '#e8742a',
    h: [110, 114, 58, 56], e: [114, 106, 18, 34],
    bill: () => ({ t: 'point', x: 142, y: 134, a: 14, L: 40, hu: 10, hl: 7, c: '#3a3430' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 178, 40], chest: [60, 218],
    body: k => shoulders(dk(k.M, 0.06), 188) + wingLines(dk(k.M, 0.35), 188) +
      L(d`M24,226q20,-6 40,4M200,226q-20,-6 -40,4`, 7, dk(k.M, 0.45)) +
      bib(lt(k.M, 0.15), 150, 42, 112, 72) +
      P('#4fa58a', d`M68,156Q112,182 156,156Q164,176 154,192Q112,210 70,192Q60,176 68,156Z`, sw(3)) +
      P('#8a5aa8', d`M74,182Q112,202 150,182Q150,192 146,196Q112,212 78,196Q74,192 74,182Z`, NS),
    head: k => roundHead(k.M, k.sp.h),
    over: () => P('#f2ede2', d`M140,124Q148,116 156,124Q154,130 144,130Z`, sw(3)),
  },
  roadrunner: {
    main: '#9a7a52', hat: 'none', iris: '#e8c890',
    h: [106, 114, 58, 56], e: [112, 106, 18, 34],
    bill: () => ({ t: 'point', x: 136, y: 134, a: 8, L: 90, hu: 14, hl: 9, c: '#3a3430' }),
    hatA: [112, 0, 0.9, -6], neck: [108, 178, 38], chest: [58, 218],
    body: k => shoulders(k.M, 188) + wingLines(dk(k.M, 0.45), 188) + scallops(dk(k.M, 0.45), 14, 218, 4, 2) + scallops(dk(k.M, 0.45), 160, 218, 4, 2) +
      bib('#ede0c4', 150, 38, 108, 62) + L(d`M86,200l4,10M104,204l2,10M122,200l2,10M96,226l4,10M116,228l2,10M136,218l2,10`, 3.5, '#5a4030'),
    head: k => P('#3a2a20', d`M132,72L112,10L118,58L80,14L98,62L52,34L84,78Z`) +
      roundHead(k.M, k.sp.h) + L(d`M64,106l8,2M60,122l8,0M70,136l8,-2M92,68l2,8M78,80l6,4`, 3, dk(k.M, 0.5)) +
      P('#5ab0d8', d`M88,104Q80,114 88,126Q96,122 96,110Z`, NS) + P('#e8742a', d`M80,110Q72,120 80,132Q86,128 88,120Z`, NS),
  },
  loon: {
    main: '#23302c', hat: 'none', iris: '#d8302a', ...STD,
    lid: k => lt(k.M, 0.12),
    bill: () => ({ t: 'point', x: 134, y: 143, a: 10, L: 84, hu: 14, hl: 9, c: '#2a2e32', c2: '#22262a' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 180, 40], chest: [60, 218],
    body: k => {
      let dots = '';
      for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) {
        dots += C(WHITE, 14 + i * 9 + j * 3, 218 + j * 10, 2.4, NS) + C(WHITE, 226 - i * 9 - j * 3, 218 + j * 10, 2.4, NS);
      }
      return shoulders(k.M, 188) + dots + bib(k.M, 150, 40) + bib('#fbf7ee', 200, 30, 112, 56) +
        [0, 1, 2, 3, 4, 5, 6].map(i => L(d`M${82 + i * 10},168l2,14`, 3, WHITE)).join('');
    },
    head: k => roundHead(k.M, k.sp.h) + highlight('#3e6a58', 82, 86, 14, 6),
  },
  dodo: {
    main: '#8e9aa6', hat: 'none',
    h: [104, 118, 62, 58], e: [106, 106, 19, 32],
    lid: () => '#e2d8bc',
    bill: () => ({ t: 'hook', x: 124, y: 138, a: 14, L: 96, hu: 34, hl: 18, c: '#e8dca0', c2: '#c9a24a' }),
    hatA: [108, 0, 0.9, -6], neck: [108, 182, 44], chest: [58, 218],
    body: k => shoulders(k.M, 188) + wingLines(dk(k.M, 0.35), 188) + bib(lt(k.M, 0.15), 156, 44, 108, 72) + scallops(dk(k.M, 0.2), 74, 206, 6, 3),
    head: k => roundHead(k.M, k.sp.h) + E('#e2d8bc', 116, 106, 38, 32, NS) + P(k.M, d`M98,62q-8,-14 4,-18q-2,10 6,14Z`, sw(3)),
  },
  flamingo: {
    hs: [1.12, 120, 110],
    main: '#f28aa6', hat: 'feathered', iris: '#f2d040', lashes: true,
    h: [122, 84, 44, 40], e: [124, 80, 16, 28],
    bill: () => ({ t: 'flamingo', x: 146, y: 96, a: 6, L: 80, hu: 14, hl: 9, c: '#f7eadf', c2: '#ecd8cc' }),
    hatA: [122, 0, 0.7, -8], neck: [88, 202, 24], chest: [184, 226],
    body: k => shoulders(k.M, 206) + wingLines(dk(k.M, 0.3), 206) + scallops(dk(k.M, 0.2), 16, 234, 3, 1) + scallops(dk(k.M, 0.2), 176, 234, 3, 1) +
      P(k.M, tube([104, 256, 30, 196, 168, 150, 120, 104], 22, 17, 18)) +
      P(lt(k.M, 0.25), tube([112, 256, 40, 196, 178, 150, 128, 104], 5, 4, 18), NS),
    head: k => roundHead(k.M, k.sp.h),
  },
  magpie: {
    main: '#22232c', hat: 'bowler', ...STD,
    lid: k => lt(k.M, 0.12),
    bill: () => ({ t: 'point', x: 134, y: 143, a: 10, L: 70, hu: 15, hl: 10, c: '#2e2e36', c2: '#24242c' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 178, 40], chest: [60, 218],
    body: k => shoulders(k.M, 188) +
      P('#fbf7ee', d`M-8,224C6,200 34,192 64,192Q76,216 64,248L-8,248Z`) + P('#fbf7ee', d`M248,224C234,200 206,192 176,192Q164,216 176,248L248,248Z`) +
      P('#3a7ab8', d`M64,192Q78,206 80,248L64,248Q76,216 64,192Z`, NS) + P('#3a7ab8', d`M176,192Q162,206 160,248L176,248Q164,216 176,192Z`, NS) +
      bib(k.M, 150, 40) + P('#fbf7ee', d`M74,198Q112,214 150,198Q162,222 160,248L64,248Q62,222 74,198Z`),
    head: k => roundHead(k.M, k.sp.h) + highlight('#4a5a8a', 82, 86, 14, 6),
  },
};

// ------------------------------------------------------------------ public API
/** Returns a complete `<svg class="portrait" viewBox="0 0 240 240">…</svg>` bust portrait. */
export function portrait(o: PortraitOpts): string {
  const sp = SPECIES[o.species] ?? SPECIES.duck;
  let hat: Hat = o.hat ?? sp.hat;
  if (hat === 'sombrero-free') hat = 'cowboy';
  const acc = new Set<Accessory>();
  for (const a of [o.accessory ?? 'none', ...(o.extras ?? [])]) acc.add(a === 'cigar-free' ? 'toothpick' : a);
  acc.delete('none');
  const k: K = { o, sp, M: o.plumage ?? sp.main, ex: o.expression ?? 'neutral', hat, acc, r: rng((o.seed ?? 7) + 1) };
  // body/head first consume rng in a fixed order so hats/tufts are stable across expressions
  const body = sp.body(k);
  const nw = neckwear(k);
  const head = sp.head(k);
  const hatS = drawHat(k);
  const [hsc, px, py] = sp.hs ?? [1, 0, 0];
  const shift = Math.min(16, 5 - (py + (hatTop(k) - py) * hsc));
  const face = head + faceUnder(k) + drawEyes(k) + drawBill(k) + (sp.over?.(k) ?? '') + faceOver(k) + drawBrows(k) + hatS + (sp.top?.(k) ?? '') + drawFx(k);
  return (
    `<svg class="portrait" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">` +
    `<g stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"${shift > 0 ? ` transform="translate(0 ${f(shift)})"` : ''}>` +
    body + nw + (hsc !== 1 ? G(`translate(${f(px * (1 - hsc))} ${f(py * (1 - hsc))}) scale(${hsc})`, face) : face) +
    `</g></svg>`
  );
}

/** Preset looks for the game's characters, keyed by id. */
export const CHARACTERS: Record<string, PortraitOpts & { name: string }> = {
  // --- house staff
  dealer_bart: { name: 'Bart', species: 'duck', plumage: '#f6f0e2', hat: 'visor', accessory: 'bowtie', extras: ['mustache'], seed: 3 },
  dealer_lola: { name: 'Lola', species: 'swan', hat: 'feathered', accent: '#b0306a', accessory: 'pearls', seed: 5 },
  banker: { name: 'The Banker', species: 'pelican', hat: 'tophat', accessory: 'monocle', seed: 11 },
  shopkeeper: { name: 'Old Mort', species: 'duck', plumage: '#5d7f56', hat: 'cowboy', accent: '#6b4a2e', accessory: 'glasses', extras: ['mustache'], seed: 21 },
  doc: { name: 'Doc Hoo', species: 'owl', hat: 'none', accessory: 'glasses', extras: ['bowtie'], accent2: '#2a5a8a', seed: 4 },
  player: { name: 'The Kid', species: 'duck', hat: 'cowboy', accessory: 'bandana', accent2: '#c8302a', extras: ['toothpick'], seed: 42 },
  // --- outlaws
  kappa: { name: 'Grumpy Gus', species: 'goose', hat: 'bowler', accessory: 'scar', seed: 12 },
  tsuchinoko: { name: 'Toll Booth Tom', species: 'turkey', hat: 'visor', accent: '#3a6aa8', accessory: 'badge', seed: 13 },
  ubume: { name: 'Mother Goose', species: 'goose', plumage: '#f4eee2', hat: 'feathered', accent: '#c06a9a', accessory: 'pearls', seed: 14 },
  enenra: { name: 'Smokey Vulture', species: 'vulture', hat: 'tophat', accent: '#3a3440', accessory: 'toothpick', seed: 15 },
  ittan: { name: 'Judge Heron', species: 'heron', hat: 'bowler', accessory: 'monocle', seed: 16 },
  rokurokubi: { name: 'Long-Neck Lou', species: 'swan', hat: 'cowboy', accent: '#4a4a5a', accessory: 'bowtie', seed: 17 },
  jorogumo: { name: 'Roadrunner Rick', species: 'roadrunner', hat: 'none', accessory: 'bandana', accent2: '#e0a020', seed: 18 },
  bake_danuki: { name: 'Pickpocket Pigeon', species: 'pigeon', hat: 'bandit', accessory: 'toothpick', seed: 19 },
  mokumokuren: { name: 'Banker Pelican', species: 'pelican', hat: 'bowler', accent: '#4a3a2a', accessory: 'bowtie', extras: ['glasses'], seed: 20 },
  aosagibi: { name: 'Magpie Maggie', species: 'magpie', hat: 'feathered', accent: '#2a6a8a', accessory: 'pearls', seed: 22 },
  hinoenma: { name: 'Sheriff Owl', species: 'owl', hat: 'sheriff', accessory: 'badge', seed: 23 },
  jubokko: { name: 'Cactus Wren Willie', species: 'chicken', plumage: '#b08858', hat: 'cowboy', accent: '#5a7a3a', accessory: 'toothpick', seed: 24 },
  kanedama: { name: 'Deputy Dodo', species: 'dodo', hat: 'sheriff', accent: '#b0905a', accessory: 'badge', seed: 25 },
  noppera: { name: 'The Masked Mallard', species: 'duck', hat: 'bandit', accessory: 'bandana', accent2: '#2a2a3a', seed: 26 },
  bakeneko: { name: 'Ostrich Ollie', species: 'ostrich', hat: 'derby', accent: '#8a4a2a', accessory: 'bowtie', seed: 27 },
  nue: { name: 'Chickenhawk Charlie', species: 'chicken', plumage: '#c8642a', hat: 'cowboy', accent: '#3a2a20', accessory: 'scar', seed: 28 },
  gashadokuro: { name: 'Big Bertha', species: 'ostrich', hat: 'feathered', accent: '#c0306a', accessory: 'pearls', seed: 29 },
  baku: { name: 'Taxman Toucan', species: 'toucan', hat: 'visor', accent: '#2a8a5a', accessory: 'glasses', seed: 30 },
  yuki_onna: { name: 'Snow Goose Sue', species: 'goose', plumage: '#f8f6f0', hat: 'cowboy', accent: '#7fb6d6', accessory: 'pearls', seed: 31 },
  kamaitachi: { name: 'One-Trick Loon', species: 'loon', hat: 'tophat', accessory: 'bowtie', seed: 32 },
  akaname: { name: 'Grumpy Gander', species: 'goose', plumage: '#7a6a5a', hat: 'derby', accent: '#5a3a2a', accessory: 'mustache', seed: 33 },
  kitsunebi: { name: 'Poker-Faced Penguin', species: 'penguin', hat: 'bowler', accessory: 'bowtie', seed: 34 },
  hyakume: { name: 'Peeping Pheasant', species: 'turkey', plumage: '#b0502a', hat: 'none', accessory: 'glasses', seed: 35 },
  oboroguruma: { name: 'Conductor Crane', species: 'heron', plumage: '#b8c4ce', hat: 'derby', accent: '#2a3a6a', accessory: 'badge', seed: 36 },
  umibozu: { name: 'Lazy Pelican Pete', species: 'pelican', hat: 'cowboy', accent: '#b8955a', accessory: 'toothpick', seed: 37 },
  nurarihyon: { name: 'Mayor Mallard', species: 'duck', hat: 'tophat', accessory: 'mustache', extras: ['bowtie'], seed: 38 },
  shokera: { name: 'Rustler Raven', species: 'crow', hat: 'cowboy', accent: '#2a2026', accessory: 'bandana', accent2: '#2a5a9a', seed: 39 },
  tsukuyomi: { name: 'The Golden Goose', species: 'goose', plumage: '#f2c230', hat: 'crown', accessory: 'pearls', seed: 40 },
  chochin_o: { name: 'Boss Honk', species: 'goose', plumage: '#6a5a4a', hat: 'cowboy', accent: '#2a2026', accessory: 'toothpick', seed: 41 },
  tamamo: { name: 'The Black Swan', species: 'swan', plumage: '#2a2830', hat: 'feathered', accent: '#5a1a3a', accessory: 'pearls', seed: 43 },
  otakemaru: { name: 'Ma Gobbler', species: 'turkey', hat: 'cowboy', accent: '#6a4a2a', accessory: 'bandana', extras: ['scar'], seed: 44 },
  daitengu: { name: 'The Condor', species: 'eagle', plumage: '#24202a', hat: 'cowboy', accent: '#1e1a1e', accessory: 'eyepatch', seed: 45 },
  orochi: { name: 'The Flock', species: 'goose', plumage: '#5a4e48', hat: 'cowboy', accent: '#3a2a2a', accessory: 'bandana', extras: ['scar'], seed: 46 },
};
