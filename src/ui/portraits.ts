// Character portraits for Buck Ducks: bird busts (head + neck + shoulders) drawn as
// self-contained SVG strings in the same engraved-print language as the face cards
// (src/ui/suits.ts): a warm key-ink line, flat colour plates, form shading cut with
// hatch and halftone screens, and crisp cream "gouge" highlights.
//
// Line weight: every silhouette shape is also pushed onto a key-ink underlay that is
// stroked fat, so the outer contour reads heavier than the interior lines. Feature
// strokes (brows, lids, creases, feather scallops) are filled lens shapes that taper
// to points instead of uniform round-capped strokes.
//
// Layering (back to front): key underlay -> species backdrop (fans, plumes) -> shoulders/neck
// -> occlusion under the head -> neckwear -> head + markings -> brim shadow -> bandit mask / scar
// -> eyes -> bill (mustache, toothpick ride on it) -> wattles -> face accessories -> brows -> hat -> fx.
// Expressions only swap the eyes / brows / bill-opening layer, so a character stays on-model.
// Every pattern / clipPath id carries a per-render prefix, so many portraits can share a page.

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
const WHITE = '#fbf5e6';
const GOUGE = '#f6ead0';
const BRASS = '#e3a93b';
const LW = 2.4; // interior line weight; the silhouette underlay adds weight outside
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
/** Open line. */
const L = (path: string, w = LW, col = INK): string =>
  `<path fill="none" d="${path}"${w !== LW ? ` stroke-width="${f(w)}"` : ''}${col !== INK ? ` stroke="${col}"` : ''}/>`;
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
const dk = (c: string, t = 0.22): string => mix(c, INK, t);
const lt = (c: string, t = 0.35): string => mix(c, '#fff8e8', t);
const lum = (c: string): number => {
  const [r, g, b] = rgb(c);
  return (0.3 * r + 0.59 * g + 0.11 * b) / 255;
};
/** Engraving colour for fine detail on a plate: key-toned on light plates, pale cuts on dark ones. */
const eng = (c: string): string => (lum(c) < 0.3 ? lt(c, 0.4) : dk(c, 0.62));

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
const tube = (q: number[], w0: number, w1: number, n = 10): string => {
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
/** Ellipse clipped to the half-plane where side(x,y) <= 0, plus the two cut points. */
const clipEll = (cx: number, cy: number, rx: number, ry: number, side: (x: number, y: number) => number): { d: string; cut: Pt[] } => {
  const pts: Pt[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  const out: Pt[] = [], cut: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const sp = side(p[0], p[1]), sq = side(q[0], q[1]);
    if (sp <= 0) out.push(p);
    if ((sp <= 0) !== (sq <= 0)) {
      const t = sp / (sp - sq), c: Pt = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      out.push(c);
      cut.push(c);
    }
  }
  return { d: out.length < 3 ? '' : 'M' + out.map(p => f(p[0]) + ',' + f(p[1])).join('L') + 'Z', cut };
};
const star = (cx: number, cy: number, ro: number, ri: number, n: number): string => {
  let s = '';
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? ri : ro;
    s += (i ? 'L' : 'M') + f(cx + Math.cos(a) * r) + ',' + f(cy + Math.sin(a) * r);
  }
  return s + 'Z';
};
/** Everything: used with evenodd to cut a "lit" shape out of a shading screen. */
const OUT = 'M-300-300H540V540H-300Z';
/** Ellipse as an absolute cubic path (so it can be shifted / clipped like any other path). */
const ellD = (cx: number, cy: number, rx: number, ry: number): string =>
  d`M${cx - rx},${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
/** Closed Catmull-Rom spline through points. */
const smooth = (pts: Pt[]): string => {
  const n = pts.length;
  let s = d`M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    s += d`C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return s + 'Z';
};
/** A tapered stroke: a lens through (x0,y0) -> ctrl -> (x1,y1), `w` wide in the middle, pointed at both ends. */
const lensD = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number): string => {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * w, ny = (dx / l) * w;
  return d`M${x0},${y0}q${cx + nx - x0} ${cy + ny - y0} ${dx} ${dy}q${cx - nx - x1} ${cy - ny - y1} ${-dx} ${-dy}z`;
};
const lens = (col: string, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number): string =>
  P(col, lensD(x0, y0, cx, cy, x1, y1, w), NS);
/** Rows of engraved feather scallops (little tapered U cuts). */
const scallopD = (x0: number, y0: number, cols: number, rows: number, s = 14, slope = 0, w = 1.7): string => {
  let p = '';
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x = x0 + i * s + (j % 2 ? s / 2 : 0), y = y0 + j * s * 0.72 + i * s * slope;
      p += lensD(x - s * 0.4, y, x, y + s * 0.6, x + s * 0.4, y, w);
    }
  return p;
};
const scallops = (col: string, x0: number, y0: number, cols: number, rows: number, s = 14, slope = 0, w = 1.7): string =>
  P(col, scallopD(x0, y0, cols, rows, s, slope, w), NS);

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
  /** id prefix for this render's patterns and clip paths */
  id: string;
  n: number;
  /** key-ink silhouette underlay collected while drawing */
  sil: string;
  /** clipPath definitions */
  defs: string;
  forms: Record<string, string>;
  /** head outline (face space) and neck/chest outline (body space), for occlusion */
  headD: string;
  neckD: string;
}
interface Sp {
  main: string;
  hat: Hat;
  /** head ellipse centre/radii (used for fx placement) */
  h: [number, number, number, number];
  /** head outline bumps: [angleDeg, amount, spreadDeg]* (0deg = towards the bill) */
  hb?: number[];
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

// ------------------------------------------------------------------ print machinery
let UID = 0;
const patterns = (id: string): string =>
  `<pattern id="${id}h" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M1,-1V6" stroke="${INK}" stroke-width="1.35"/></pattern>` +
  `<pattern id="${id}c" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M1,-1V6" stroke="${GOUGE}" stroke-width="1.4"/></pattern>` +
  `<pattern id="${id}d" width="5" height="8.6" patternUnits="userSpaceOnUse"><path fill="${INK}" d="M.2,1.2a1 1 0 1 0 2 0a1 1 0 1 0-2 0M2.7,5.5a1 1 0 1 0 2 0a1 1 0 1 0-2 0"/></pattern>` +
  `<pattern id="${id}r" width="5.4" height="9.2" patternUnits="userSpaceOnUse"><path fill="#d0473e" d="M0,1.4a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M2.7,6a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0"/></pattern>`;

/** Define a path once per render; everything else references it with <use>. */
const form = (k: K, path: string): string => {
  let id = k.forms[path];
  if (!id) {
    id = `${k.id}f${k.n++}`;
    k.forms[path] = id;
    k.defs += `<path id="${id}" d="${path}"/>`;
  }
  return id;
};
const U = (k: K, path: string, a = ''): string => `<use href="#${form(k, path)}"${a ? ' ' + a : ''}/>`;
/** Silhouette shape: drawn as a plate and pushed onto the fat key underlay. */
const S = (k: K, fill: string, path: string, a = ''): string => {
  k.sil += U(k, path);
  return U(k, path, `fill="${fill}"${a ? ' ' + a : ''}`);
};
/** Transformed group whose silhouette contributions get the same transform in the underlay. */
const GS = (k: K, tr: string, fn: () => string, a = ''): string => {
  const i = k.sil.length;
  const body = fn();
  const inner = k.sil.slice(i);
  k.sil = k.sil.slice(0, i) + (inner ? `<g transform="${tr}">${inner}</g>` : '');
  return G(tr, body, a);
};
const clipId = (k: K, path: string): string => {
  const key = 'c' + path;
  let id = k.forms[key];
  if (!id) {
    id = `${k.id}k${k.n++}`;
    k.forms[key] = id;
    k.defs += `<clipPath id="${id}">${U(k, path)}</clipPath>`;
  }
  return id;
};
const clip = (k: K, path: string, body: string): string => (body ? `<g clip-path="url(#${clipId(k, path)})">${body}</g>` : '');
/** A shape filled with one of the print screens: h hatch, d halftone, c cream cut, r blush dots. */
const scr = (k: K, p: string, path: string, a = ''): string => `<path fill="url(#${k.id}${p})" ${NS} d="${path}"${a ? ' ' + a : ''}/>`;
/** The same, reusing a defined form. */
const scrU = (k: K, p: string, path: string, a = ''): string => U(k, path, `fill="url(#${k.id}${p})" ${NS}${a ? ' ' + a : ''}`);
/** Screen the part of `path` not covered by itself shifted (-dx,-dy): light from the upper left. */
const shade = (k: K, path: string, dx: number, dy: number, p = 'h', a = ''): string => {
  const f0 = form(k, path), key = `m${f0}|${f(dx)}|${f(dy)}`;
  let id = k.forms[key];
  if (!id) {
    id = `${k.id}m${k.n++}`;
    k.forms[key] = id;
    k.defs += `<mask id="${id}"><use href="#${f0}" fill="#fff"/><use href="#${f0}" fill="#000" transform="translate(${f(-dx)} ${f(-dy)})"/></mask>`;
  }
  return `<path fill="url(#${k.id}${p})" mask="url(#${id})" ${NS} d="${OUT}"${a ? ' ' + a : ''}/>`;
};

/** Flat colour plate with key line plus form shading (ink hatch, or a cream-cut sheen on dark plates). */
const plate = (k: K, col: string, form: string, box: number[], sil = true, depth = 0.26): string => {
  const [x, y, rx, ry] = box;
  let s = sil ? S(k, col, form) : U(k, form, `fill="${col}"`);
  if (lum(col) < 0.3) s += clip(k, form, scr(k, 'c', ellD(x - rx * 0.36, y - ry * 0.42, rx * 0.5, ry * 0.34), 'opacity=".5"'));
  else s += shade(k, form, rx * depth, ry * depth * 0.8);
  return s;
};

/** Head outline: an ellipse with soft bumps (crown, cheek, forehead slope). */
const HB = [-25, -0.04, 22, 35, 0.05, 28, -128, 0.05, 30, 150, -0.03, 26];
const headD = (x: number, y: number, rx: number, ry: number, bump: number[]): string => {
  const pts: Pt[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * 360 - 90;
    let m = 1;
    for (let j = 0; j < bump.length; j += 3) {
      const da = Math.abs(((a - bump[j] + 540) % 360) - 180);
      m += bump[j + 1] * Math.exp(-(da * da) / (2 * bump[j + 2] * bump[j + 2]));
    }
    const r = (a * Math.PI) / 180;
    pts.push([x + Math.cos(r) * rx * m, y + Math.sin(r) * ry * m]);
  }
  return smooth(pts);
};
/** Shaded head: plate, terminator hatch, a cream gouge along the lit rim and a few engraved cheek feathers. */
const headForm = (k: K, col: string, h: number[], bump?: number[]): string => {
  const [x, y, rx, ry] = h;
  const D = headD(x, y, rx, ry, bump ?? k.sp.hb ?? HB);
  k.headD = D;
  const p = (a: number, r: number): Pt => [x + Math.cos((a * Math.PI) / 180) * rx * r, y + Math.sin((a * Math.PI) / 180) * ry * r];
  const [a0, a1] = [p(-170, 0.8), p(-104, 0.84)], c = p(-137, 1.02);
  let s = plate(k, col, D, h);
  if (lum(col) < 0.82 && lum(col) >= 0.3) s += lens(GOUGE, a0[0], a0[1], c[0], c[1], a1[0], a1[1], 4.4);
  const ch = p(150, 0.62);
  s += scallops(eng(col), ch[0] - 6, ch[1] - 6, 2, 2, 11, -0.2, 1.5);
  return s;
};

// --------------------------------------------------------------- shared body parts
/** Wide sloping feathered shoulders filling the bottom of the frame. */
const mantle = (k: K, col: string, top = 184, cx = 112): string => {
  const D = d`M-8,248L-8,${top + 34}C8,${top + 8} ${cx - 70},${top - 2} ${cx - 34},${top - 6}L${cx + 34},${top - 6}C${cx + 70},${top - 2} 232,${top + 8} 248,${top + 34}L248,248Z`;
  const dark = lum(col) < 0.3, e = eng(col);
  return S(k, col, D) +
    clip(k, D, dark
      ? scr(k, 'c', d`M-8,${top + 32}C10,${top + 8} ${cx - 70},${top} ${cx - 40},${top - 2}C${cx - 64},${top + 14} 20,${top + 26} -8,${top + 54}Z`, 'opacity=".45"')
      : scr(k, 'h', d`M${cx + 60},${top - 20}C${cx + 50},${top + 22} ${cx + 70},226 ${cx + 62},260L260,260L260,${top - 20}Z`) +
        scr(k, 'd', ellD(cx + 4, top - 2, 60, 14))) +
    P(e, lensD(cx - 64, top + 10, cx - 77, top + 36, cx - 70, 254, 4.2) + lensD(cx + 64, top + 10, cx + 77, top + 36, cx + 70, 254, 4.2), NS);
};
/** Engraved covert feathers on both shoulders. */
const coverts = (col: string, top = 184, cx = 112): string => {
  const e = eng(col);
  return P(e, scallopD(4, top + 34, 3, 2, 14, -0.26) + scallopD(cx + 76, top + 22, 3, 2, 14, 0.26), NS);
};
/** Front of neck flowing into the chest. */
const bib = (k: K, col: string, y0: number, w0: number, cx = 112, w1 = 70): string => {
  const D = d`M${cx - w0},${y0}C${cx - w0},${y0 + 40} ${cx - w1},200 ${cx - w1 - 4},248L${cx + w1 + 4},248C${cx + w1},200 ${cx + w0},${y0 + 40} ${cx + w0},${y0}Z`;
  k.neckD = D;
  return S(k, col, D) + (lum(col) < 0.3 ? '' : shade(k, D, 16, 0));
};
/** Long neck as a tube. */
const neckTube = (k: K, col: string, q: number[], w0: number, w1: number, n = 10): string => {
  const D = tube(q, w0, w1, n);
  k.neckD = D;
  return plate(k, col, D, [0, 0, w0 * 1.3, 0], true);
};
/** A few cowlick feathers sticking up from the head top. */
const tuft = (k: K, x: number, y: number, col: string, n = 3, h = 16): string => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const dx = (i - (n - 1) / 2) * 8 + (k.r() - 0.5) * 4, hh = h * (0.7 + k.r() * 0.5), lean = -6 + k.r() * 12;
    s += S(k, col, d`M${x + dx - 5},${y + 4}Q${x + dx - 4 + lean * 0.3},${y - hh * 0.6} ${x + dx + lean},${y - hh}Q${x + dx + 4 + lean * 0.2},${y - hh * 0.4} ${x + dx + 5},${y + 4}Z`);
  }
  return s;
};
/** Six-point tin star (the Stars suit), drawn the way the deck draws it. */
const tinStar = (k: K, x: number, y: number, R: number, col = BRASS): string => {
  let shp = star(x, y, R, R * 0.47, 6);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    shp += ellD(x + Math.cos(a) * R * 1.04, y + Math.sin(a) * R * 1.04, R * 0.2, R * 0.2);
  }
  let ridge = '';
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    ridge += d`M${x},${y}L${x + Math.cos(a) * R * 0.86},${y + Math.sin(a) * R * 0.86}`;
  }
  return U(k, shp, `fill="${INK}" ${sw(R * 0.26)}`) + U(k, shp, `fill="${col}" ${NS}`) + (R > 15 ? L(ridge, R * 0.07, dk(col, 0.45)) : '') +
    C(WHITE, x, y, R * 0.34, sw(R * 0.1)) + C(INK, x, y, R * 0.11, NS);
};

// ------------------------------------------------------------------ bills
interface BillShapes { u: string; uc: string; l: string; lc: string; ux?: string; lx?: string; back?: string }
/** Crisp specular notch along the ridge of a bill: a cream sliver broken by a small tick. */
const notch = (x0: number, y0: number, x1: number, y1: number, w = 3.6): string =>
  P('#fffaf0', lensD(x0, y0, (x0 + x1) / 2, Math.min(y0, y1) - 2, x1, y1, w) + lensD(x1 + 3, y1 + 0.6, x1 + 5.5, y1 + 0.4, x1 + 9, y1 + 2, w * 0.7), NS);
const nostril = (x: number, y: number, l = 10): string => lens(INK, x, y, x + l * 0.5, y - 1.6, x + l, y + 0.4, 2.6);
const billShapes = (b: Bill): BillShapes => {
  const { L: l, hu, hl, c } = b;
  const c2 = b.c2 ?? dk(c, 0.25);
  switch (b.t) {
    case 'duck':
      return {
        u: d`M-8,${-hu}C${l * 0.3},${-hu * 1.2} ${l * 0.78},${-hu * 1.05} ${l},${-hu * 0.4}Q${l * 1.06},${hu * 0.1} ${l * 0.88},${3}L-4,3Z`, uc: c,
        ux: P(dk(c, 0.2), d`M${l * 0.9},${-hu * 0.66}Q${l * 1.05},${-hu * 0.2} ${l * 0.88},3Q${l * 0.95},${-hu * 0.3} ${l * 0.9},${-hu * 0.66}Z`, sw(1.4)) +
          notch(l * 0.12, -hu * 0.9, l * 0.56, -hu * 0.96) + nostril(l * 0.22, -hu * 0.42, l * 0.13),
        l: d`M-4,0L${l * 0.86},0Q${l * 0.94},${hl * 0.7} ${l * 0.76},${hl}Q${l * 0.4},${hl * 1.3} -6,${hl * 0.9}Z`, lc: c2,
      };
    case 'goose':
      return {
        back: b.c2 ? P(b.c2, ellD(14, -hu - 1, hu * 0.46, hu * 0.42)) + (lum(b.c2) < 0.3 ? '' : lens(GOUGE, 8, -hu - 2, 10, -hu * 1.3, 16, -hu * 1.36, 1.8)) : '',
        u: d`M-8,${-hu}C${l * 0.35},${-hu * 1.05} ${l * 0.8},${-hu * 0.6} ${l},${-hu * 0.2}Q${l * 1.04},${2} ${l * 0.9},3L-4,3Z`, uc: c,
        ux: P(WHITE, d`M${l * 0.86},${-hu * 0.33}Q${l * 1.05},${-hu * 0.2} ${l * 0.97},3L${l * 0.86},3Z`, sw(1.6)) +
          notch(l * 0.1, -hu * 0.84, l * 0.5, -hu * 0.72) + nostril(l * 0.24, -hu * 0.38, l * 0.13),
        l: d`M-4,0L${l * 0.88},0Q${l * 0.9},${hl * 0.8} ${l * 0.74},${hl}Q${l * 0.4},${hl * 1.2} -6,${hl * 0.9}Z`, lc: dk(c, 0.18),
        // serrated "grin patch" along the cutting edge
        lx: P(WHITE, d`M2,1.5L${l * 0.6},1.5L${l * 0.56},${hl * 0.42}L${l * 0.48},2.5L${l * 0.42},${hl * 0.45}L${l * 0.34},2.5L${l * 0.28},${hl * 0.48}L${l * 0.2},2.5L${l * 0.14},${hl * 0.5}L4,${hl * 0.5}Z`, sw(1.2)),
      };
    case 'point':
      return {
        u: d`M-6,${-hu}C${l * 0.3},${-hu * 1.05} ${l * 0.7},${-hu * 0.5} ${l},${1}L-4,3Z`, uc: c,
        ux: notch(l * 0.08, -hu * 0.8, l * 0.5, -hu * 0.62, Math.min(3, hu * 0.24)) + nostril(l * 0.14, -hu * 0.42, Math.min(12, l * 0.14)),
        l: d`M-4,0L${l * 0.94},0Q${l * 0.6},${hl * 0.8} -6,${hl}Z`, lc: c2,
      };
    case 'hook':
      return {
        u: d`M-6,${-hu}C${l * 0.45},${-hu * 1.45} ${l * 1.08},${-hu * 0.9} ${l},${hu * 0.62}Q${l * 0.94},${hu * 0.85} ${l * 0.86},${hu * 0.35}Q${l * 0.8},3 ${l * 0.68},3L-4,3Z`, uc: c,
        ux: (b.c2 ? P(b.c2, d`M${l * 0.7},${-hu * 0.9}C${l * 0.95},${-hu * 0.7} ${l * 1.06},${-hu * 0.2} ${l},${hu * 0.62}Q${l * 0.94},${hu * 0.85} ${l * 0.86},${hu * 0.35}Q${l * 0.82},${hu * 0.1} ${l * 0.76},3Q${l * 0.82},${-hu * 0.4} ${l * 0.7},${-hu * 0.9}Z`, sw(1.4)) : '') +
          notch(l * 0.12, -hu * 0.96, l * 0.52, -hu * 1.06, Math.min(3.4, hu * 0.2)) + nostril(l * 0.2, -hu * 0.4, Math.min(12, l * 0.16)),
        l: d`M-4,0L${l * 0.74},0Q${l * 0.55},${hl} -6,${hl}Z`, lc: dk(c, 0.15),
      };
    case 'pelican':
      return {
        u: d`M-8,${-hu}C${l * 0.3},${-hu * 1.1} ${l * 0.8},${-hu * 0.9} ${l * 0.98},${-hu * 0.45}Q${l * 1.05},${hu * 0.2} ${l * 0.96},${hu * 0.75}Q${l * 0.92},3 ${l * 0.86},3L-4,3Z`, uc: c,
        ux: P('#d8503a', d`M${l * 0.9},${-hu * 0.72}Q${l * 1.05},${-hu * 0.3} ${l * 0.96},${hu * 0.75}Q${l * 0.92},3 ${l * 0.88},3Z`, sw(1.4)) +
          lens(dk(c, 0.5), l * 0.04, -hu * 0.42, l * 0.5, -hu * 0.62, l * 0.88, -hu * 0.42, 2) + notch(l * 0.12, -hu * 0.84, l * 0.48, -hu * 0.92, 2.6),
        l: d`M-6,0L${l * 0.88},0Q${l * 0.78},${hl * 2.6} ${l * 0.45},${hl * 4.6}Q${l * 0.1},${hl * 5.4} -10,${hl * 2.6}Q-12,${hl} -6,0Z`, lc: c2,
        lx: P(dk(c2, 0.45), lensD(l * 0.06, hl * 3.4, l * 0.3, hl * 3.0, l * 0.4, hl * 4.4, 2.2) + lensD(l * 0.4, hl * 2.4, l * 0.6, hl * 2.4, l * 0.66, hl * 3.4, 1.8) + lensD(l * 0.2, hl * 1.4, l * 0.5, hl * 1.2, l * 0.76, hl * 1.4, 1.6), NS),
      };
    case 'toucan':
      return {
        u: d`M-8,${-hu}C${l * 0.3},${-hu * 1.5} ${l * 0.92},${-hu * 1.2} ${l},${-hu * 0.05}Q${l * 1.01},${hu * 0.4} ${l * 0.93},${hu * 0.42}Q${l * 0.6},3 -4,3Z`, uc: c,
        ux: P('#2a2026', d`M${l * 0.8},${-hu * 0.98}C${l * 0.95},${-hu * 0.75} ${l * 1.01},${-hu * 0.3} ${l},${-hu * 0.05}Q${l * 1.01},${hu * 0.4} ${l * 0.93},${hu * 0.42}Q${l * 0.88},${hu * 0.1} ${l * 0.82},2Q${l * 0.86},${-hu * 0.5} ${l * 0.8},${-hu * 0.98}Z`, NS) +
          P('#d8402a', d`M-6,${-hu * 1.02}C${l * 0.3},${-hu * 1.5} ${l * 0.7},${-hu * 1.32} ${l * 0.82},${-hu * 1.0}L${l * 0.8},${-hu * 0.88}C${l * 0.6},${-hu * 1.12} ${l * 0.3},${-hu * 1.22} -4,${-hu * 0.78}Z`, NS) +
          notch(l * 0.14, -hu * 0.72, l * 0.6, -hu * 0.76, 3.6) +
          P('none', d`M-6,${-hu}C${l * 0.3},${-hu * 1.5} ${l * 0.92},${-hu * 1.2} ${l},${-hu * 0.05}Q${l * 1.01},${hu * 0.4} ${l * 0.93},${hu * 0.42}`),
        l: d`M-4,0L${l * 0.9},0Q${l * 0.6},${hl * 1.2} -6,${hl}Z`, lc: c2,
        lx: P('#2a2026', d`M${l * 0.78},0L${l * 0.9},0Q${l * 0.84},${hl * 0.5} ${l * 0.74},${hl * 0.62}Z`, NS),
      };
    case 'flamingo':
      // bent bill: straight then kinks down at ~55%, black tip
      return {
        u: d`M-6,${-hu}L${l * 0.5},${-hu * 0.9}Q${l * 0.7},${-hu * 0.85} ${l * 0.78},${hu * 0.6}L${l * 0.86},${hu * 2.6}Q${l * 0.84},${hu * 3.3} ${l * 0.76},${hu * 2.7}L${l * 0.58},${hu * 0.9}Q${l * 0.52},3 ${l * 0.4},3L-4,3Z`, uc: c,
        ux: P('#2a2026', d`M${l * 0.66},${-hu * 0.85}Q${l * 0.74},${-hu * 0.7} ${l * 0.78},${hu * 0.6}L${l * 0.86},${hu * 2.6}Q${l * 0.84},${hu * 3.3} ${l * 0.76},${hu * 2.7}L${l * 0.6},${hu * 1}Q${l * 0.62},${-hu * 0.2} ${l * 0.66},${-hu * 0.85}Z`, sw(1.4)) +
          notch(l * 0.06, -hu * 0.78, l * 0.4, -hu * 0.76, 2.6) + nostril(l * 0.14, -hu * 0.4, 8),
        l: d`M-4,0L${l * 0.42},0Q${l * 0.55},${hl * 0.3} ${l * 0.62},${hl * 1.6}Q${l * 0.4},${hl * 1.5} -6,${hl}Z`, lc: c2,
      };
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

/** Halftone occlusion on the face where the bill joins it. */
const billAO = (k: K): string => {
  const b = k.sp.bill(k);
  if (!k.headD) return '';
  const r = (b.a * Math.PI) / 180;
  return clip(k, k.headD, scr(k, 'd', ellD(b.x - Math.sin(r) * b.hu * 0.1, b.y - Math.cos(r) * b.hu * 0.3, b.hu * 0.95 + 3, b.hu * 1.15 + 4)));
};

const drawBill = (k: K): string => {
  const b = k.sp.bill(k);
  const sh = billShapes(b);
  const [a1, a2, teeth] = MOUTH[k.ex];
  const l = b.L, Lm = l * (b.t === 'flamingo' ? 0.45 : b.t === 'hook' ? 0.62 : 0.78);
  const r1 = (-a1 * Math.PI) / 180, r2 = (a2 * Math.PI) / 180;
  return GS(k, `translate(${f(b.x)} ${f(b.y)}) rotate(${f(b.a)})`, () => {
    let s = sh.back ?? '';
    if (a1 + a2 > 0) {
      const ux = Lm * Math.cos(r1), uy = Lm * Math.sin(r1), lx = Lm * Math.cos(r2), ly = Lm * Math.sin(r2);
      s += P('#5a1612', d`M-2,0L${ux},${uy}Q${Lm * 1.08},${(uy + ly) / 2} ${lx},${ly}Z`);
    }
    // lower mandible (+ tongue / teeth / toothpick)
    s += GS(k, `rotate(${f(a2)})`, () => {
      let lo = S(k, sh.lc, sh.l) + scrU(k, 'h', sh.l, 'opacity=".4"') + (sh.lx ?? '');
      if (a2 >= 20) lo += P('#d8606a', d`M${Lm * 0.15},0Q${Lm * 0.45},${-Math.min(14, Lm * 0.2)} ${Lm * 0.8},-2Z`, sw(1.8)) + lens(GOUGE, Lm * 0.3, -3, Lm * 0.42, -6, Lm * 0.56, -4, 1.6);
      if (teeth) lo += P(WHITE, d`M4,0L${Lm * 0.8},0L${Lm * 0.75},-5L6,-5Z`, sw(1.6)) + L(d`M${Lm * 0.3},0V-5M${Lm * 0.55},0V-5`, 1.4);
      if (k.acc.has('toothpick'))
        lo += P('#e9c98a', lensD(l * 0.26, -2.5, l * 0.26 + 17, 7.5, l * 0.26 + 36, 18.5, 4.6), sw(1.8)) + lens(GOUGE, l * 0.28 + 4, -1, l * 0.28 + 14, 4, l * 0.28 + 24, 10.4, 1.2);
      return lo;
    });
    s += GS(k, `rotate(${f(-a1)})`, () => {
      let up = S(k, sh.uc, sh.u) + shade(k, sh.u, 0, b.hu * 0.3) + (sh.ux ?? '');
      if (teeth) up += P(WHITE, d`M4,0L${Lm * 0.8},0L${Lm * 0.75},5L6,5Z`, sw(1.6)) + L(d`M${Lm * 0.3},0V5M${Lm * 0.55},0V5`, 1.4);
      if (k.acc.has('mustache')) {
        const mx = Math.min(l * 0.16, 14), sc = Math.max(0.95, Math.min(1.25, b.hu / 17));
        const half = 'M0,-3C6,-9 14,-9 20,-4C25,0 31,0 35,-5Q37,-10 33,-13Q41,-12 40,-4Q37,6 24,7C14,8 6,7 0,6Z';
        const both = half + half.replace(/(-?[\d.]+),/g, (_m, a: string) => f(-a) + ',');
        const mc = k.o.plumage && lum(k.o.plumage) > 0.75 ? '#7a4a2a' : '#4a2a16';
        const hair = lensD(4, 0, 12, -4, 22, 0, 1.6) + lensD(-4, 0, -12, -4, -22, 0, 1.6) + lensD(8, 4, 16, 2, 26, 4, 1.2) + lensD(-8, 4, -16, 2, -26, 4, 1.2);
        up += GS(k, `translate(${f(mx)} ${f(b.hu * 0.05)}) rotate(${f(-b.a)}) scale(${f(sc)})`,
          () => S(k, mc, both) + clip(k, both, scr(k, 'h', 'M-50,1L50,1L50,12L-50,12Z')) + P(lt(mc, 0.4), hair, NS), sw(LW / sc));
      }
      return up;
    });
    const c = CURL[k.ex];
    if (c) s += lens(INK, 1, 1, -7, c * 1.5, -13, -c * 8, 3.2);
    return s;
  });
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
  neutral: { lid: [0.13, 0], pup: [2, 1], pr: 0.48, brow: [0, 0, 4] },
  smug: { lid: [0.52, -0.2], bot: 0.14, pup: [6, 1], pr: 0.45, brow: [-8, -14, 8], brow2: [4, 3, 1] },
  angry: { lid: [0.34, 0.85], pup: [0, 3], pr: 0.42, brow: [12, -6, -1] },
  shocked: { pup: [0, 0], pr: 0.17, brow: [-15, -13, 8], scale: 1.18 },
  sweating: { lid: [0.1, -0.4], pup: [-6, 0], pr: 0.32, brow: [-11, 4, 2] },
  laughing: { closed: true, pup: [0, 0], pr: 0, brow: [-14, -12, 6] },
  sad: { lid: [0.32, -0.7], pup: [-2, 6], pr: 0.44, brow: [-10, 7, 3] },
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
  const darkLid = lum(lidCol) < 0.3;
  const iris = k.sp.iris ?? (darkLid ? '#b8823a' : '#74431f');
  const lidInk = darkLid ? '#efe4d0' : INK;
  let s = '';
  for (const g of eyeGeo(k.sp)) {
    const sc = F.scale ?? 1, rx = g.rx * sc, ry = g.ry * sc;
    if (F.closed) {
      const ld = lensD(g.x - rx * 0.95, g.y + 3, g.x, g.y - ry * 1.5, g.x + rx * 0.95, g.y + 3, 7.5);
      s += darkLid ? P('#efe4d0', ld, sw(2)) : P(INK, ld, NS);
      continue;
    }
    const eD = ellD(g.x, g.y, rx, ry);
    const px = g.x + F.pup[0] * (rx / 15), py = g.y + F.pup[1] * (ry / 19) + ry * 0.08;
    const tiny = F.pr < 0.25, ir = tiny ? rx * 0.4 : rx * 0.66, pr = tiny ? ir * 0.52 : ir * 0.56 * (F.pr / 0.46);
    s += U(k, eD, `fill="${WHITE}" ${NS}`) +
      clip(k, eD,
        C(iris, px, py, ir, sw(1.3)) + lens(lt(iris, 0.35), px - ir * 0.5, py + ir * 0.5, px, py + ir * 1.05, px + ir * 0.62, py + ir * 0.4, ir * 0.36) +
        C(INK, px, py, pr, NS) +
        C(WHITE, px - ir * 0.3, py - ir * 0.36, Math.max(1.4, ir * 0.27), NS) + C(WHITE, px + ir * 0.32, py + ir * 0.3, Math.max(0.8, ir * 0.11), NS)) +
      U(k, eD, `fill="none" ${sw(2.2)}`);
    let lidY = g.y - ry * 0.95;
    if (F.lid) {
      const [cov, tilt] = F.lid, y0 = g.y - ry + 2 * ry * cov;
      const c = clipEll(g.x, g.y, rx, ry, (x, y) => y - (y0 + (tilt * ry * 0.5 * g.inner * (x - g.x)) / rx));
      if (c.d) s += P(lidCol, c.d, sw(1.6));
      if (c.cut.length === 2) {
        const [a, b] = c.cut;
        s += lens(lidInk, a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 1.5, b[0], b[1], 4.2);
      }
      lidY = y0;
    } else {
      s += lens(lidInk, g.x - rx * 0.92, g.y - ry * 0.38, g.x, g.y - ry * 1.62, g.x + rx * 0.92, g.y - ry * 0.38, 3.4);
    }
    if (F.bot) {
      const y1 = g.y + ry - 2 * ry * F.bot;
      const c = clipEll(g.x, g.y, rx, ry, (_x, y) => y1 - y);
      if (c.d) s += P(lidCol, c.d, sw(1.6));
      if (c.cut.length === 2) s += lens(lidInk, c.cut[0][0], c.cut[0][1], g.x, y1 - 1, c.cut[1][0], c.cut[1][1], 2.6);
    }
    if (k.sp.lashes || k.acc.has('pearls')) {
      const o = -g.inner, ox = g.x + o * rx * 0.78, oy = Math.max(lidY, g.y - ry * 0.75) + 1;
      s += P(lidInk, lensD(ox, oy, ox + o * 5, oy - 3, ox + o * 11, oy - 7, 2.6) + lensD(ox - o * 4, oy - 2, ox - o * 1, oy - 8, ox + o * 3, oy - 12, 2.4), NS);
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
    const ix = g.x + g.inner * g.rx * 0.55, ox = g.x - g.inner * g.rx * 1.05;
    s += lensD(ox, base + bo, g.x, base + Math.min(bi, bo) - arch * 2, ix, base + bi, g.inner === 1 ? 7.5 : 6.5);
  }
  // dark faces get pale brows with an ink rim so expressions still read
  return lum(k.sp.lid ? k.sp.lid(k) : k.M) < 0.3 ? P('#efe4d0', s, sw(2)) : P(INK, s, NS);
};

const drop = (x: number, y: number, s = 1, col = '#8fcbe6'): string =>
  P(col, d`M${x},${y - 11 * s}Q${x + 8 * s},${y} ${x + 5 * s},${y + 4 * s}Q${x},${y + 9 * s} ${x - 5 * s},${y + 4 * s}Q${x - 8 * s},${y} ${x},${y - 11 * s}Z`, sw(1.8)) +
  lens(WHITE, x - 3 * s, y - 2 * s, x - 3.6 * s, y + 2 * s, x - 1.6 * s, y + 5 * s, 1.8 * s);

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
      return P('#c8302a', lensD(x - 10, y - 3, x - 3, y - 3, x - 3, y - 10, 3.4) + lensD(x + 3, y - 10, x + 3, y - 3, x + 10, y - 3, 3.4) +
        lensD(x - 10, y + 3, x - 3, y + 3, x - 3, y + 10, 3.4) + lensD(x + 3, y + 10, x + 3, y + 3, x + 10, y + 3, 3.4), sw(1.2));
    }
    case 'shocked': {
      const x = hx - rx - 10, y = hy - ry * 0.3, X = hx + rx * 0.85, Y = hy - ry * 0.95;
      return P(INK, lensD(x, y, x - 7, y - 4, x - 16, y - 9, 3.6) + lensD(x - 2, y + 14, x - 10, y + 14, x - 19, y + 14, 3.6) +
        lensD(x, y + 28, x - 7, y + 32, x - 16, y + 37, 3.6) + lensD(X, Y, X + 5, Y - 5, X + 11, Y - 11, 3.6), NS);
    }
    case 'laughing':
      return scr(k, 'r', ellD(g.x - 4, g.y + g.ry + 7, 12, 7)) + scr(k, 'r', ellD(g.x + 34, g.y + g.ry + 4, 7, 5));
  }
  return '';
};

// ------------------------------------------------------------------ hats
const HATC: Partial<Record<Hat, string>> = {
  cowboy: '#8a5a2b', sheriff: '#c9a46a', tophat: '#2e2834', bowler: '#3b2c26', derby: '#3a4a6a',
  feathered: '#7a3a6e', crown: '#f2c230', visor: '#3f9a5a', bandit: '#2a2430',
};
/** Crown sheen: a cream gouge on light felt, a cream-cut screen on dark silk. */
const sheen = (k: K, col: string, form: string, strip: string, gouge: number[]): string =>
  lum(col) < 0.3 ? clip(k, form, scr(k, 'c', strip, 'opacity=".55"')) : lens(GOUGE, gouge[0], gouge[1], gouge[2], gouge[3], gouge[4], gouge[5], 3.4);
/** Brim: plate, darker underside strip with hatch, cream gouge on the lit edge. */
const brim = (k: K, col: string, D: string, under: string, g: number[]): string =>
  S(k, col, D) + P(dk(col, 0.3), under, NS) + scr(k, 'h', under) + shade(k, D, 22, 0) + lens(GOUGE, g[0], g[1], g[2], g[3], g[4], g[5], 2.8);
const cowboyHat = (k: K, col: string, sheriff = false): string => {
  const dn = (k.r() - 0.5) * 8, bd = dk(col, 0.5), e = eng(col);
  const crown = d`M-40,8Q-46,-26 -36,-50Q-22,-62 ${dn - 6},-52Q${dn},-46 ${dn + 6},-52Q22,-62 36,-50Q46,-26 40,8Z`;
  return S(k, col, crown) + shade(k, crown, 18, 4) +
    P(e, lensD(dn, -47, dn + 4, -34, dn - 2, -20, 3.4) + lensD(-24, -50, -32, -32, -29, -14, 2.2) + lensD(24, -50, 32, -32, 29, -14, 2.2), NS) +
    sheen(k, col, crown, 'M-40,-50L-26,-56L-24,8L-42,8Z', [-34, -42, -39, -24, -34, -8]) +
    P(bd, 'M-42,-10Q0,-2 42,-10L42,2Q0,10 -42,2Z') + L('M-40,-4Q0,4 40,-4', 1, lt(bd, 0.3)) +
    (sheriff ? tinStar(k, 0, -28, 12) : C(BRASS, -24, -3, 4.2, sw(1.4)) + C(INK, -24, -3, 1.2, NS)) +
    brim(k, col, 'M-84,-16Q-78,4 -40,4Q0,8 40,4Q78,4 84,-16Q88,-2 76,8Q50,22 0,22Q-50,22 -76,8Q-88,-2 -84,-16Z',
      'M-77,7Q-50,19 0,19Q50,19 77,7Q74,10 72,11Q50,22 0,22Q-50,22 -72,11Q-74,10 -77,7Z', [-82, -12, -70, 3, -46, 4]);
};
const BRIM: Partial<Record<Hat, number>> = { cowboy: 21, 'sombrero-free': 21, sheriff: 21, tophat: 15, bowler: 14, derby: 20, feathered: 18, crown: 8, visor: 14 };
const HAT_H: Partial<Record<Hat, number>> = { cowboy: 60, 'sombrero-free': 60, sheriff: 60, tophat: 70, bowler: 58, derby: 44, feathered: 62, crown: 50, visor: 30 };
/** Cast shadow of each hat on the head below it, in hat space: cx, cy, rx, ry. */
const HAT_SHADOW: Partial<Record<Hat, number[]>> = {
  cowboy: [10, 27, 62, 13], sheriff: [10, 27, 62, 13], tophat: [8, 20, 48, 10], bowler: [8, 19, 50, 10],
  derby: [12, 22, 54, 12], feathered: [10, 18, 62, 12], visor: [10, 14, 58, 13], crown: [4, 8, 40, 7],
};
/** y of the hat's highest point (for framing). */
const hatTop = (k: K): number => {
  const h = HAT_H[k.hat];
  if (h === undefined) return 99;
  const [, dy, s] = k.sp.hatA;
  return k.sp.e[1] - k.sp.e[2] * 1.25 - 11 - (BRIM[k.hat] ?? 20) * s + dy - h * s;
};
/** Returns [hat, its shadow on the head]. */
const drawHat = (k: K): [string, string] => {
  const hat = k.hat;
  if (hat === 'none' || hat === 'bandit') return ['', ''];
  const col = k.o.accent ?? HATC[hat] ?? '#8a5a2b';
  const [x, dy, s0, t0] = k.sp.hatA;
  // sit the brim just above the brows: eye top - brow room - brim depth
  const [, ey, er] = k.sp.e;
  const y = ey - er * 1.25 - 11 - (BRIM[hat] ?? 20) * s0 + dy;
  let s = s0, t = t0 + (k.r() - 0.5) * 6, oy = 0;
  if (k.ex === 'shocked') { oy -= 12; t += 5; }
  if (hat === 'crown') s = s0 * 0.8;
  const tr = `translate(${f(x)} ${f(y + oy)}) rotate(${f(t)}) scale(${f(s)})`;
  const art = GS(k, tr, () => {
    switch (hat) {
      case 'cowboy':
      case 'sombrero-free':
        return cowboyHat(k, col);
      case 'sheriff':
        return cowboyHat(k, col, true);
      case 'tophat': {
        const crown = 'M-32,4L-36,-62Q0,-70 36,-62L32,4Z';
        return S(k, col, crown) + shade(k, crown, 16, 0) + sheen(k, col, crown, 'M-36,-62L-20,-64L-18,4L-34,4Z', [-27, -54, -30, -30, -25, -8]) +
          S(k, dk(col, 0.3), ellD(0, -63, 36, 7)) + lens(lt(col, 0.25), -28, -64, -6, -69, 20, -67, 2) +
          P(k.o.accent ? dk(col, 0.5) : '#7a2622', 'M-34,-16Q0,-10 34,-16L33,-2Q0,4 -33,-2Z') + L('M-33,-12Q0,-6 33,-12', 1, lt(k.o.accent ? dk(col, 0.5) : '#7a2622', 0.35)) +
          brim(k, col, 'M-54,-8Q-50,4 0,4Q50,4 54,-8Q58,4 46,10Q30,16 0,16Q-30,16 -46,10Q-58,4 -54,-8Z',
            'M-50,7Q-30,13 0,13Q30,13 50,7Q46,11 44,12Q30,16 0,16Q-30,16 -44,12Q-48,10 -50,7Z', [-52, -5, -44, 6, -26, 7]);
      }
      case 'bowler': {
        const dome = 'M-38,4Q-42,-54 0,-56Q42,-54 38,4Z';
        return S(k, col, dome) + shade(k, dome, 18, 6) + sheen(k, col, dome, 'M-40,-30Q-30,-52 -10,-56L-14,-40Q-30,-26 -32,4L-42,4Z', [-28, -12, -30, -36, -14, -47]) +
          P(dk(col, 0.45), 'M-39,-10Q0,-4 39,-10L38,2Q0,8 -38,2Z') +
          brim(k, col, 'M-58,-6Q-50,4 0,4Q50,4 58,-6Q62,4 48,10Q30,15 0,15Q-30,15 -48,10Q-62,4 -58,-6Z',
            'M-54,6Q-30,12 0,12Q30,12 54,6Q50,10 48,10Q30,15 0,15Q-30,15 -48,10Q-52,8 -54,6Z', [-56, -4, -48, 6, -28, 6]);
      }
      case 'derby': { // flat-topped conductor/porkpie cap
        const crown = 'M-38,4L-40,-36Q0,-44 40,-36L38,4Z';
        return S(k, col, crown) + shade(k, crown, 16, 0) + sheen(k, col, crown, 'M-40,-38L-26,-40L-24,4L-38,4Z', [-31, -30, -33, -16, -30, -4]) +
          S(k, dk(col, 0.25), ellD(0, -37, 40, 7)) +
          P(BRASS, 'M-39,-12Q0,-6 39,-12L38,-2Q0,4 -38,-2Z', sw(1.8)) + L('M-38,-7Q0,-1 38,-7', 1, dk(BRASS, 0.4)) +
          S(k, dk(col, 0.35), 'M-50,0Q0,10 56,-2Q66,10 40,18Q0,24 -40,16Q-58,10 -50,0Z') + scr(k, 'h', 'M-46,8Q0,18 58,4Q60,12 40,18Q0,24 -40,16Q-50,12 -46,8Z') +
          lens(lt(col, 0.2), -44, 4, -10, 12, 30, 8, 2.2);
      }
      case 'feathered': {
        const plume = mix(col, '#ffffff', 0.55);
        const pd = 'M22,-34C36,-66 84,-74 108,-44C88,-52 66,-46 52,-32Z';
        const crown = 'M-40,-6Q-42,-52 0,-54Q42,-52 40,-6Z';
        return S(k, plume, pd) + shade(k, pd, 0, -8) +
          P(dk(plume, 0.55), lensD(30, -36, 60, -66, 104, -47, 2.4) + lensD(52, -50, 52, -56, 50, -61, 1.4) + lensD(66, -55, 66, -61, 66, -66, 1.4) + lensD(80, -56, 82, -62, 84, -66, 1.4) + lensD(92, -53, 95, -58, 98, -61, 1.4) + lensD(56, -44, 60, -42, 64, -40, 1.4) + lensD(72, -48, 76, -46, 80, -44, 1.4), NS) +
          S(k, col, crown) + shade(k, crown, 18, 6) + sheen(k, col, crown, 'M-42,-30Q-30,-52 -10,-54L-14,-40Q-28,-26 -30,-6L-42,-6Z', [-29, -14, -30, -36, -14, -46]) +
          P(dk(col, 0.4), 'M-41,-20Q0,-12 41,-20L40,-6Q0,2 -40,-6Z') +
          C('#e0708f', 30, -14, 9.5) + P(dk('#e0708f', 0.35), lensD(23, -18, 30, -10, 37, -18, 1.6) + lensD(26, -6, 30, -13, 34, -6, 1.6), NS) + C('#f7c8d4', 30, -14, 3.6, sw(1.6)) +
          brim(k, col, 'M-82,-8Q-60,-20 0,-10Q60,-20 86,-12Q96,2 72,8Q0,20 -70,12Q-94,6 -82,-8Z',
            'M-84,0Q-60,8 0,8Q60,6 90,-4Q90,4 72,8Q0,20 -70,12Q-84,8 -84,0Z', [-80, -6, -60, -14, -30, -12]);
      }
      case 'crown': {
        const pts = 'M-38,2L-46,-48L-22,-24L0,-58L22,-24L46,-48L38,2Q0,8 -38,2Z';
        return S(k, col, pts) + shade(k, pts, 14, 0) + lens(GOUGE, -36, -6, -41, -26, -42, -40, 2.6) + lens(GOUGE, -4, -40, -3, -48, -1, -53, 2) +
          P(dk(col, 0.25), 'M-39,-12Q0,-6 39,-12L38,2Q0,8 -38,2Z') + L('M-38,-8Q0,-2 38,-8', 1, dk(col, 0.55)) +
          C('#c8302a', 0, -4, 6, sw(1.8)) + C('#3a7ac8', -22, -5, 4.5, sw(1.8)) + C('#3a7ac8', 22, -5, 4.5, sw(1.8)) +
          C(WHITE, -2, -6.4, 1.6, NS) + C(WHITE, -23.6, -6.6, 1.2, NS) + C(WHITE, 20.4, -6.6, 1.2, NS) +
          S(k, col, ellD(-46, -50, 5, 5)) + S(k, col, ellD(0, -60, 5, 5)) + S(k, col, ellD(46, -50, 5, 5));
      }
      case 'visor': {
        const vis = 'M-58,-10Q0,-26 58,-10L70,12Q0,-4 -70,12Z';
        return P(dk(col, 0.4), 'M-52,-18Q0,-34 52,-18L52,-6Q0,-22 -52,-6Z') +
          S(k, col, vis, 'fill-opacity=".86"') + clip(k, vis, scr(k, 'h', 'M20,-30L80,-30L80,20L30,20Z', 'opacity=".7"')) +
          lens(lt(col, 0.6), -50, 1, 0, -18, 50, 1, 2.4) + L('M-64,6Q0,-10 64,6', 1, dk(col, 0.4));
      }
    }
    return '';
  }, sw(LW / s));
  const hs = HAT_SHADOW[hat];
  const shadow = hs && k.headD ? clip(k, k.headD, G(tr, scr(k, 'd', ellD(hs[0], hs[1], hs[2], hs[3])))) : '';
  return [art, shadow];
};

// ------------------------------------------------------------------ accessories
const neckwear = (k: K): string => {
  const [x, y, w] = k.sp.neck;
  const red = k.o.accent2 ?? (k.hat === 'none' || k.hat === 'bandit' || k.hat === 'crown' ? k.o.accent : undefined) ?? '#c8302a';
  let s = '';
  if (k.acc.has('pearls')) {
    let pearls = '', glints = '';
    for (let i = 0; i <= 10; i++) {
      const t = i / 5 - 1, px = x + t * w * 1.02, py = y + 6 + 12 * (1 - t * t);
      pearls += ellD(px, py, 5.4, 5.4);
      glints += ellD(px - 1.6, py - 1.8, 1.5, 1.5);
    }
    s += U(k, pearls, `fill="${INK}" ${sw(3.6)}`) + U(k, pearls, `fill="#f3ead8" ${NS}`) + shade(k, pearls, 2.6, 2.6, 'h', 'opacity=".7"') + P(WHITE, glints, NS);
  }
  if (k.acc.has('bandana')) {
    const tail = d`M${x - w * 0.8},${y + 6}Q${x},${y + 20} ${x + w * 0.8},${y + 6}L${x + 8},${y + 54}Q${x},${y + 58} ${x - 6},${y + 50}Z`;
    const band = d`M${x - w - 2},${y - 6}Q${x},${y + 10} ${x + w + 2},${y - 6}L${x + w + 4},${y + 6}Q${x},${y + 24} ${x - w - 4},${y + 6}Z`;
    const dots = [[-14, 16], [12, 18], [0, 31], [-26, 8], [24, 8], [2, 44]].map(([a, b]) => ellD(x + a, y + b, 2.4, 2.4)).join('');
    s += P(red, tail) + shade(k, tail, 9, 0) + P(lt(red, 0.75), dots, NS) +
      P(dk(red, 0.5), lensD(x - w * 0.5, y + 14, x - 8, y + 30, x - 2, y + 48, 2.4) + lensD(x + w * 0.45, y + 14, x + 8, y + 30, x + 4, y + 50, 2), NS) +
      P(red, band) + shade(k, band, 0, -5) + P(dk(red, 0.5), lensD(x - w + 4, y + 2, x - w * 0.4, y + 12, x - 6, y + 12, 1.8) + lensD(x + 8, y + 12, x + w * 0.5, y + 10, x + w - 2, y + 1, 1.8), NS) +
      P(red, d`M${x + w},${y}L${x + w + 18},${y + 10}L${x + w + 12},${y + 14}L${x + w + 22},${y + 24}L${x + w + 6},${y + 18}Z`, sw(1.8));
  }
  if (k.acc.has('bowtie')) {
    const bc = k.o.accent2 ?? '#b8282a';
    const wl = d`M${x},${y + 10}L${x - 26},${y - 2}Q${x - 32},${y + 12} ${x - 26},${y + 24}Z`;
    const wr = d`M${x},${y + 10}L${x + 26},${y - 2}Q${x + 32},${y + 12} ${x + 26},${y + 24}Z`;
    s += P(WHITE, d`M${x - 30},${y - 4}L${x - 2},${y + 8}L${x - 20},${y + 22}Z`) +
      P(WHITE, d`M${x + 30},${y - 4}L${x + 2},${y + 8}L${x + 20},${y + 22}Z`) + scr(k, 'h', d`M${x + 30},${y - 4}L${x + 2},${y + 8}L${x + 20},${y + 22}Z`, 'opacity=".5"') +
      P(bc, wl) + P(bc, wr) + scr(k, 'h', wr) +
      P(dk(bc, 0.55), lensD(x - 6, y + 9, x - 16, y + 4, x - 24, y + 2, 2) + lensD(x - 6, y + 12, x - 16, y + 16, x - 24, y + 20, 2) + lensD(x + 6, y + 12, x + 16, y + 16, x + 24, y + 20, 2), NS) +
      lens(lt(bc, 0.5), x - 22, y + 3, x - 26, y + 10, x - 23, y + 17, 2) +
      E(dk(bc, 0.25), x, y + 10, 6.5, 8);
  }
  if (k.acc.has('badge')) {
    const [bx, by] = k.sp.chest;
    s += tinStar(k, bx, by, 18) + lens(WHITE, bx - 11, by - 4, bx - 9, by - 12, bx - 2, by - 15, 2.2);
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
      st += d`M${sx - 5},${sy - 2.5}L${sx + 5},${sy + 1.5}`;
    }
    s += P('#e2948a', lensD(x0, y0, (x0 + x1) / 2 - 2, (y0 + y1) / 2, x1, y1, 7), sw(1.8)) + lens(dk('#e2948a', 0.3), x0 + 1, y0 + 6, (x0 + x1) / 2 + 1, (y0 + y1) / 2, x1 + 2, y1 - 6, 1.6) + L(st, 1.8);
  }
  if (k.hat === 'bandit') {
    const col = k.o.accent ?? HATC.bandit!;
    const x1 = near.x - near.rx * 1.6, x2 = far.x + far.rx * 1.45, y = near.y, h = near.ry * 1.25, m = (near.x + far.x) / 2;
    const mask = d`M${x1},${y - h * 0.65}C${x1 + 20},${y - h * 1.25} ${x2 - 14},${y - h * 1.3} ${x2 + 4},${y - h * 0.8}Q${x2 + 10},${y + h * 0.1} ${x2 - 2},${y + h * 0.75}Q${(m + x2) / 2},${y + h * 0.95} ${m},${y + h * 0.45}Q${(x1 + m) / 2},${y + h * 1.05} ${x1 + 2},${y + h * 0.6}Q${x1 - 8},${y} ${x1},${y - h * 0.65}Z`;
    s +=
      S(k, col, d`M${x1 + 2},${y - h * 0.3}L${x1 - 28},${y - h * 0.3 - 14}Q${x1 - 22},${y - h * 0.3} ${x1 - 26},${y - h * 0.3 + 8}Q${x1 - 14},${y - h * 0.3 + 6} ${x1 + 2},${y - h * 0.3 + 10}Z`) +
      S(k, col, d`M${x1 + 2},${y + h * 0.2}L${x1 - 24},${y + h * 0.2 + 16}Q${x1 - 14},${y + h * 0.2 + 20} ${x1 - 14},${y + h * 0.2 + 32}Q${x1 - 4},${y + h * 0.2 + 18} ${x1 + 6},${y + h * 0.2 + 16}Z`) +
      S(k, col, mask) + clip(k, mask, scr(k, 'c', ellD(x1 + 18, y - h * 0.6, 26, 10), 'opacity=".55"')) +
      lens(lt(col, 0.3), x1 + 6, y - h * 0.5, x1 + 24, y - h * 1.0, x1 + 40, y - h * 0.9, 2.2);
  }
  return s;
};

const faceOver = (k: K): string => {
  const [far, near] = eyeGeo(k.sp);
  let s = '';
  if (k.acc.has('glasses')) {
    const r1 = near.ry * 1.02, r2 = far.ry * 1.02;
    s +=
      C('#dff1f4', near.x, near.y, r1, `fill-opacity=".22" ${sw(3.4)}`) +
      C('#dff1f4', far.x + 2, far.y, r2, `fill-opacity=".22" ${sw(3.4)}`) +
      L(d`M${near.x + r1 * 0.8},${near.y - r1 * 0.5}Q${(near.x + far.x) / 2 + 1},${near.y - r1 * 0.85} ${far.x + 2 - r2 * 0.8},${far.y - r2 * 0.5}M${near.x - r1},${near.y - 2}L${k.sp.h[0] - k.sp.h[2] * 0.92},${near.y - 8}`, 3.4) +
      P(WHITE, lensD(near.x - r1 * 0.62, near.y - r1 * 0.05, near.x - r1 * 0.45, near.y - r1 * 0.5, near.x - r1 * 0.1, near.y - r1 * 0.7, 2.6) +
        lensD(far.x - r2 * 0.5, far.y - r2 * 0.05, far.x - r2 * 0.35, far.y - r2 * 0.5, far.x, far.y - r2 * 0.7, 2.2), NS);
  }
  if (k.acc.has('monocle')) {
    const r = near.ry * 1.08;
    s += C('#dff1f4', near.x, near.y, r, `fill-opacity=".2" ${sw(5.6)}`) + C('none', near.x, near.y, r, `stroke="#e8b830" ${sw(2.4)}`) +
      L(d`M${near.x - r * 0.4},${near.y + r * 0.95}C${near.x - r},${near.y + r * 2.5} ${near.x + 10},${near.y + r * 3} ${near.x - 4},${near.y + r * 4.2}`, 2, '#b88a1a') +
      lens(WHITE, near.x - r * 0.66, near.y - r * 0.05, near.x - r * 0.5, near.y - r * 0.5, near.x - r * 0.1, near.y - r * 0.72, 2.6);
  }
  if (k.acc.has('eyepatch')) {
    const [hx, hy, rx, ry] = k.sp.h;
    s += L(d`M${hx - rx * 0.96},${hy - ry * 0.05}L${near.x},${near.y}L${hx + rx * 0.2},${hy - ry * 0.98}`, 3.6, '#1e1a1e') +
      E('#24202a', near.x, near.y + 2, near.rx * 1.25, near.ry * 1.12) +
      clip(k, ellD(near.x, near.y + 2, near.rx * 1.25, near.ry * 1.12), scr(k, 'c', ellD(near.x - 6, near.y - 6, near.rx * 0.8, near.ry * 0.5), 'opacity=".5"'));
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
  const comb = 'M-24,8Q-30,-10 -16,-12Q-14,-26 -2,-22Q4,-36 16,-26Q28,-28 26,-12Q36,-6 28,8Z';
  return G(`translate(${f(x - 4)} ${f(t + 6)}) scale(.7)`, P(INK, comb, sw(8)) + P('#d0322a', comb, NS) + shade(k, comb, 8, 4) + lens(GOUGE, -18, -6, -12, -18, -2, -18, 3));
};
const STD = { h: [108, 114, 62, 58] as [number, number, number, number], e: [112, 108, 20, 36] as [number, number, number, number] };
/** Red fleshy bits (wattles, combs). */
const flesh = (k: K, D: string, sil = false): string => (sil ? S(k, '#d0382e', D) : P('#d0382e', D)) + shade(k, D, 6, 2) ;

const SPECIES: Record<Species, Sp> = {
  duck: {
    main: '#3f8a4c', hat: 'cowboy',
    h: [108, 114, 64, 60], e: [112, 108, 20, 36],
    hb: [-30, -0.05, 22, 30, 0.06, 26, -130, 0.06, 30, 155, -0.03, 24],
    bill: () => ({ t: 'duck', x: 134, y: 145, a: 8, L: 82, hu: 21, hl: 12, c: '#f0b432', c2: '#d8962a' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 180, 44], chest: [60, 216],
    body: k => {
      const white = lum(k.M) > 0.75, wing = white ? dk(k.M, 0.1) : '#b3a38c';
      let s = mantle(k, wing, 188) + coverts(wing, 188) + bib(k, k.M, 150, 42);
      if (!white) {
        const br = 'M64,198Q112,212 160,198C166,212 176,228 180,248L44,248C48,228 58,212 64,198Z';
        s += P('#8c4a2c', br) + shade(k, br, 18, 0) + scallops(eng('#8c4a2c'), 80, 218, 5, 2, 14) +
          P(WHITE, 'M70,182Q112,196 154,182L158,194Q112,210 66,194Z', sw(1.8));
      } else s += scallops(eng(k.M), 86, 214, 4, 2);
      return s;
    },
    head: k => headForm(k, k.M, k.sp.h) + tuft(k, 100, 58, k.M, 3, 14),
  },
  goose: {
    hs: [1.12, 112, 128],
    main: '#9a8a76', hat: 'none',
    h: [116, 90, 50, 46], e: [118, 84, 17, 30],
    hb: [-70, -0.06, 30, 20, 0.08, 30, -150, 0.04, 30, 120, -0.04, 30],
    bill: k => ({ t: 'goose', x: 144, y: 110, a: 12, L: 74, hu: 17, hl: 9, c: '#ec862a', c2: lum(k.M) > 0.8 ? '#e0742a' : undefined }),
    hatA: [118, 0, 0.76, -6], neck: [100, 198, 36], chest: [182, 222],
    body: k => {
      const pale = lum(k.M) > 0.8, chest = lt(k.M, pale ? 0.3 : 0.45), back = dk(k.M, 0.12);
      const q = [104, 254, 86, 200, 88, 150, 112, 120];
      let s = mantle(k, back, 204) + (pale ? coverts(back, 204) : P(lt(back, 0.45), scallopD(4, 238, 3, 1, 15, -0.26, 2.4) + scallopD(188, 226, 3, 1, 15, 0.26, 2.4), NS)) +
        bib(k, chest, 204, 46, 108, 66) + scallops(eng(chest), 76, 224, 5, 2, 13) + neckTube(k, k.M, q, 31, 26);
      // engraved furrows down the neck (greylag goose)
      if (!pale) s += P(dk(k.M, 0.5), lensD(80, 236, 70, 190, 84, 146, 2.6) + lensD(96, 240, 84, 196, 94, 150, 2) + lensD(112, 236, 102, 196, 106, 158, 1.8), NS);
      return s;
    },
    head: k => {
      const pale = lum(k.M) > 0.8 || lum(k.M) < 0.3;
      return headForm(k, k.M, k.sp.h) + (pale ? '' : lens(WHITE, 141, 90, 136, 104, 141, 120, 5)) + tuft(k, 110, 48, k.M, 2, 10);
    },
  },
  swan: {
    hs: [1.12, 118, 110],
    main: '#f7f3ea', hat: 'none', lashes: true,
    h: [122, 84, 44, 38], e: [124, 80, 16, 28],
    hb: [-40, -0.06, 30, 30, 0.06, 26, -150, 0.04, 26],
    bill: k => ({ t: 'goose', x: 148, y: 98, a: 14, L: 62, hu: 14, hl: 8, c: lum(k.M) < 0.35 ? '#d02e2a' : '#e8762a', c2: '#2a2026' }),
    hatA: [122, 0, 0.72, -8], neck: [88, 202, 28], chest: [184, 224],
    body: k => {
      const back = dk(k.M, 0.06);
      return mantle(k, back, 206) + coverts(back, 206) +
        neckTube(k, k.M, [104, 256, 30, 196, 168, 150, 120, 104], 24, 18, 16) +
        P(eng(k.M), lensD(76, 240, 56, 210, 70, 180, 2) + lensD(116, 150, 130, 130, 124, 112, 1.6), NS);
    },
    head: k => headForm(k, k.M, k.sp.h) + P(lum(k.M) < 0.35 ? '#5a5060' : '#2a2026', 'M138,90Q150,74 160,90Q160,104 146,106Z', NS),
  },
  turkey: {
    main: '#7a5232', hat: 'cowboy',
    h: [110, 106, 54, 52], e: [110, 100, 18, 32],
    lid: () => '#9ec3d6',
    bill: () => ({ t: 'point', x: 138, y: 124, a: 20, L: 42, hu: 12, hl: 8, c: '#e8cc94' }),
    hatA: [114, 0, 0.86, -6], neck: [112, 178, 40], chest: [60, 218],
    body: k => {
      // one engraved tail feather, defined once and fanned out
      const fd = `${k.id}t`;
      k.defs += `<g id="${fd}">` + scr(k, 'h', 'M112,196L130,196Q138,96 112,40Z', 'opacity=".55"') +
        P('#efe2c4', 'M97,88Q112,58 127,88Q112,78 97,88Z', NS) + P(INK, 'M102,62Q112,42 122,62Q112,54 102,62Z', NS) + lens(dk(k.M, 0.55), 112, 186, 109, 140, 112, 92, 2.2) + '</g>';
      let fan = '';
      for (let i = -3; i <= 3; i++)
        fan += GS(k, `rotate(${i * 26} 112 200)`, () => S(k, i % 2 ? dk(k.M, 0.12) : lt(k.M, 0.18), 'M94,196Q86,96 112,40Q138,96 130,196Z') + `<use href="#${fd}"/>`);
      return fan + mantle(k, k.M, 190) + coverts(k.M, 190) + bib(k, dk(k.M, 0.15), 166, 30, 112, 66) +
        scallops(eng(dk(k.M, 0.15)), 74, 206, 6, 2, 13) +
        neckTube(k, '#9ec3d6', [112, 198, 108, 178, 106, 160, 110, 146], 22, 26) +
        flesh(k, ellD(94, 178, 5, 5)) + flesh(k, ellD(126, 182, 5, 5)) + flesh(k, ellD(108, 190, 5, 5));
    },
    head: k => headForm(k, '#9ec3d6', k.sp.h) + P('#7aa2b8', lensD(80, 74, 84, 64, 94, 66, 2.4) + lensD(122, 62, 128, 59, 134, 66, 2.4), NS),
    over: k => flesh(k, 'M134,134Q120,150 124,166Q130,180 140,172Q146,160 140,146Q142,138 140,132Z', true) +
      flesh(k, 'M132,112Q146,100 153,112Q158,126 153,140Q148,146 145,139Q147,126 139,119Z', true) +
      lens(GOUGE, 128, 150, 126, 158, 130, 166, 2),
  },
  vulture: {
    main: '#3d3030', hat: 'tophat',
    h: [108, 100, 52, 50], e: [108, 94, 18, 32],
    hb: [-90, -0.05, 30, 30, 0.06, 30],
    lid: () => '#d98a78',
    bill: () => ({ t: 'hook', x: 134, y: 118, a: 16, L: 58, hu: 20, hl: 10, c: '#e9dcc0', c2: '#5a4a44' }),
    hatA: [110, 0, 0.78, -8], neck: [110, 172, 36], chest: [60, 218],
    body: k => {
      // a fluffy down ruff: a collar whose edges are runs of little scallops
      const edge = (pts: Pt[]): string => pts.slice(1).map((p, i) => {
        const r = Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]) * 0.56;
        return d`A${r},${r} 0 0 1 ${p[0]},${p[1]}`;
      }).join('');
      const arcPts = (y0: number, ym: number, n: number, rev: boolean): Pt[] => {
        const out: Pt[] = [];
        for (let i = 0; i <= n; i++) {
          const t = i / n, x = 50 + 124 * t;
          out.push([x, y0 + (ym - y0) * 4 * t * (1 - t)]);
        }
        return rev ? out.reverse() : out;
      };
      const top = arcPts(190, 170, 6, false), bot = arcPts(190, 214, 8, true);
      const ruff = d`M${top[0][0]},${top[0][1]}` + edge(top) + d`L${bot[0][0]},${bot[0][1]}` + edge(bot) + 'Z';
      return mantle(k, k.M, 190) + coverts(k.M, 190) + bib(k, dk(k.M, 0.1), 184, 40) +
        neckTube(k, '#d98a78', [110, 190, 106, 166, 104, 146, 108, 130], 22, 24) +
        P('#a8604e', lensD(96, 154, 105, 158, 114, 154, 1.8) + lensD(98, 164, 107, 168, 116, 164, 1.8), NS) +
        S(k, '#efe6d6', ruff) + shade(k, ruff, 12, 6) + P(dk('#efe6d6', 0.45), scallopD(64, 190, 6, 2, 17, 0, 1.5), NS);
    },
    head: k => headForm(k, '#d98a78', k.sp.h) + P('#a8604e', lensD(70, 112, 76, 116, 82, 112, 2) + lensD(68, 124, 75, 128, 82, 124, 2) + lensD(80, 66, 86, 62, 92, 66, 2) + lensD(98, 58, 104, 55, 110, 59, 2), NS) +
      tuft(k, 98, 52, '#efe6d6', 3, 10),
  },
  pelican: {
    hs: [1.08, 100, 128],
    main: '#f2ede2', hat: 'none',
    h: [104, 90, 50, 46], e: [110, 86, 17, 30],
    bill: () => ({ t: 'pelican', x: 128, y: 108, a: 12, L: 112, hu: 13, hl: 10, c: '#eeb040', c2: '#ec7a4a' }),
    hatA: [106, 0, 0.8, -6], neck: [92, 200, 34], chest: [190, 224],
    body: k => mantle(k, '#c9c3b6', 202) + coverts('#c9c3b6', 202) +
      neckTube(k, k.M, [96, 256, 90, 200, 80, 160, 98, 124], 30, 28) + P(eng(k.M), lensD(72, 236, 60, 196, 72, 160, 2), NS),
    head: k => headForm(k, k.M, k.sp.h) + P('#f3dc8a', 'M56,88Q60,48 100,44Q130,44 144,66Q118,56 94,60Q70,66 56,88Z', NS) + tuft(k, 90, 46, '#f3dc8a', 3, 12),
  },
  owl: {
    main: '#9a6a40', hat: 'none', iris: '#f2c230',
    h: [112, 108, 76, 64], e: [88, 112, 23, 48, 0.95],
    hb: [-90, -0.04, 30, 90, 0.03, 30],
    lid: k => dk(k.M, 0.1),
    bill: () => ({ t: 'hook', x: 112, y: 122, a: 68, L: 28, hu: 10, hl: 5, c: '#e9c56a' }),
    hatA: [112, 0, 1, -4], neck: [112, 176, 46], chest: [64, 216],
    body: k => {
      const front = lt(k.M, 0.45);
      let chev = '';
      for (const [x, y] of [[96, 198], [120, 194], [106, 216], [132, 214], [86, 224], [118, 234], [146, 230], [72, 240]])
        chev += lensD(x, y, x + 2, y + 5, x + 5, y + 7, 2) + lensD(x + 5, y + 7, x + 7, y + 5, x + 10, y, 2);
      return mantle(k, k.M, 182) + coverts(k.M, 182) + bib(k, front, 162, 50, 112, 64) + P(dk(k.M, 0.25), chev, NS);
    },
    head: k => {
      const disc = '#ecd8b0';
      const dD = 'M112,86Q96,62 76,70Q48,80 48,112Q50,144 80,148Q102,150 112,136Q122,150 144,148Q172,144 172,112Q172,80 148,70Q128,62 112,86Z';
      return S(k, k.M, 'M48,64L38,20L82,50Z') + S(k, k.M, 'M176,64L188,20L144,50Z') +
        P(dk(k.M, 0.3), 'M50,58L44,32L70,50Z', NS) + P(dk(k.M, 0.3), 'M174,58L180,32L156,50Z', NS) +
        headForm(k, k.M, k.sp.h) +
        P(disc, dD) + shade(k, dD, 14, 8) +
        P(dk(disc, 0.35), lensD(60, 140, 54, 132, 52, 122, 2) + lensD(164, 140, 170, 132, 172, 122, 2) + scallopD(64, 76, 2, 1, 12, 0.1, 1.4) + scallopD(138, 78, 2, 1, 12, -0.1, 1.4), NS);
    },
  },
  crow: {
    main: '#2e3040', hat: 'cowboy', ...STD,
    lid: k => lt(k.M, 0.12),
    bill: () => ({ t: 'point', x: 134, y: 143, a: 10, L: 80, hu: 18, hl: 11, c: '#3a3a44', c2: '#2a2a32' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 178, 42], chest: [60, 216],
    body: k => mantle(k, k.M, 188) + coverts(k.M, 188) + bib(k, lt(k.M, 0.06), 150, 40) + scallops('#56658a', 82, 208, 5, 3, 14, 0, 2),
    head: k => headForm(k, k.M, k.sp.h) + tuft(k, 104, 60, k.M, 4, 18),
  },
  penguin: {
    main: '#2b2d38', hat: 'bowler',
    h: [110, 112, 64, 60], e: [114, 104, 19, 34],
    lid: k => lt(k.M, 0.1),
    bill: () => ({ t: 'point', x: 140, y: 138, a: 12, L: 54, hu: 15, hl: 9, c: '#2e2e36', c2: '#eea830' }),
    hatA: [114, 0, 0.9, -6], neck: [112, 178, 40], chest: [60, 216],
    body: k => mantle(k, k.M, 186) + bib(k, '#fbf7ee', 156, 36, 112, 54) +
      L('M112,204V244', 1.6, '#c8bfb0') + C('#2a2430', 112, 218, 3, NS) + C('#2a2430', 112, 234, 3, NS),
    head: k => {
      const face = 'M76,112Q74,76 106,78Q120,66 138,76Q168,80 164,116Q162,152 120,158Q78,156 76,112Z';
      return headForm(k, k.M, k.sp.h) + P('#fbf7ee', face, sw(1.8)) + shade(k, face, 12, 10) +
        P('#eea830', 'M56,130Q54,112 66,106Q72,124 68,142Z', NS);
    },
  },
  chicken: {
    main: '#f7f0e2', hat: 'none',
    h: [110, 114, 58, 56], e: [114, 106, 18, 34],
    bill: () => ({ t: 'point', x: 140, y: 136, a: 14, L: 44, hu: 13, hl: 9, c: '#f0b432' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 180, 40], chest: [60, 216],
    body: k => mantle(k, dk(k.M, 0.08), 188) + coverts(dk(k.M, 0.08), 188) + bib(k, k.M, 150, 38) + scallops(eng(k.M), 80, 202, 5, 3),
    head: k => {
      const comb = k.hat === 'none' || k.hat === 'bandit' || k.hat === 'visor'
        ? flesh(k, 'M84,68Q76,48 90,46Q92,32 106,36Q112,22 124,32Q138,30 136,46Q146,50 140,64Z', true) + lens(GOUGE, 92, 50, 98, 40, 108, 38, 3) : '';
      return comb + headForm(k, k.M, k.sp.h) + tuft(k, 82, 74, k.M, 2, 10);
    },
    top: crown,
    over: k => flesh(k, 'M136,146Q128,160 134,172Q142,178 146,166Q148,154 142,144Z', true) + flesh(k, ellD(78, 128, 6, 6)),
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
        GS(k, `rotate(${a} ${x} ${y})`, () => S(k, '#fbf7ee', d`M${x},${y}Q${x - 14},${y - 30} ${x},${y - 46}Q${x + 14},${y - 30} ${x},${y}Z`) +
          P('#c9c0b0', lensD(x, y - 4, x - 1, y - 22, x, y - 40, 2) + scallopD(x - 4, y - 34, 2, 3, 8, 0, 1.1), NS));
      return plume(24, 230, -30) + plume(204, 230, 30) + plume(44, 218, -12) + plume(186, 218, 14) +
        mantle(k, k.M, 202) + P(lt(k.M, 0.2), [30, 56, 82, 142, 168, 194].map(x => lensD(x - 12, 212 + Math.abs(x - 112) * 0.1, x, 224 + Math.abs(x - 112) * 0.1, x + 12, 212 + Math.abs(x - 112) * 0.1, 3)).join(''), NS) +
        neckTube(k, '#e3b5a0', [110, 256, 112, 196, 108, 150, 118, 118], 16, 14) + P('#c08870', lensD(104, 176, 110, 180, 116, 176, 1.8) + lensD(104, 196, 110, 200, 116, 196, 1.8), NS);
    },
    head: k => headForm(k, '#e3b5a0', k.sp.h) + L('M110,46Q104,32 112,26M120,44Q122,30 130,28M100,50Q90,42 92,32', 1.8),
  },
  heron: {
    hs: [1.1, 116, 118],
    main: '#9aabbd', hat: 'none', iris: '#f2c230',
    h: [118, 88, 46, 40], e: [122, 86, 16, 28],
    hb: [-40, -0.06, 30, 25, 0.04, 26, 150, -0.04, 26],
    lid: () => '#f7f3ea',
    bill: () => ({ t: 'point', x: 148, y: 104, a: 18, L: 92, hu: 11, hl: 7, c: '#eebe2a', c2: '#d8a020' }),
    hatA: [122, 0, 0.74, -6], neck: [98, 202, 24], chest: [184, 226],
    body: k => mantle(k, k.M, 204) + coverts(k.M, 204) +
      P(lt(k.M, 0.5), lensD(40, 244, 52, 224, 70, 208, 2.2) + lensD(190, 244, 178, 224, 160, 208, 2.2), NS) +
      neckTube(k, '#f2eee6', [104, 256, 76, 196, 146, 160, 116, 118], 20, 16, 14) +
      P('#3a3a4a', lensD(98, 222, 99, 226, 102, 232, 3) + lensD(92, 204, 93, 208, 96, 214, 3) + lensD(98, 186, 99, 190, 102, 196, 3) + lensD(110, 170, 111, 174, 114, 180, 3), NS),
    head: k => S(k, '#2a2a35', 'M92,70Q60,50 22,66Q52,64 70,74Q40,78 28,96Q60,82 92,88Z') +
      headForm(k, '#f7f3ea', k.sp.h) + P('#2a2a35', 'M74,78Q100,64 134,72L134,78Q104,72 78,86Z', NS),
  },
  toucan: {
    main: '#24242c', hat: 'visor',
    h: [92, 112, 60, 58], e: [92, 98, 19, 32],
    lid: () => '#5aa0d8',
    bill: () => ({ t: 'toucan', x: 108, y: 146, a: 8, L: 126, hu: 34, hl: 18, c: '#f08a1e', c2: '#f0b030' }),
    hatA: [94, 0, 0.92, -6], neck: [104, 178, 42], chest: [52, 216],
    body: k => mantle(k, k.M, 188) + coverts(k.M, 188) + bib(k, '#f5dc76', 156, 40, 104, 64) +
      P('#c8302a', 'M64,236Q104,248 144,236L148,248L60,248Z', NS),
    head: k => {
      const cheek = 'M46,140Q66,170 112,168Q100,158 104,148Q76,154 46,140Z';
      return headForm(k, k.M, k.sp.h) + P('#f5dc76', cheek, sw(1.8)) + shade(k, cheek, 8, 6) + P('#5aa0d8', ellD(96, 98, 30, 34), sw(1.8)) + shade(k, ellD(96, 98, 30, 34), 8, 8);
    },
  },
  eagle: {
    main: '#5a3a24', hat: 'sheriff', iris: '#f2c230',
    h: [108, 112, 62, 58], e: [112, 104, 18, 32],
    hb: [-30, -0.06, 26, 30, 0.04, 26, 160, 0.03, 20],
    lid: () => '#f2ede2',
    bill: () => ({ t: 'hook', x: 134, y: 130, a: 16, L: 66, hu: 25, hl: 13, c: '#f0be2a', c2: '#dc9e20' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 182, 42], chest: [60, 218],
    body: k => mantle(k, k.M, 188) + coverts(k.M, 188) + P(eng(k.M), scallopD(16, 218, 3, 2, 14) + scallopD(172, 218, 3, 2, 14), NS) +
      bib(k, dk(k.M, 0.1), 166, 44, 112, 70) +
      S(k, '#f4efe4', 'M52,146Q54,176 70,186L78,174L88,192L98,176L108,196L118,176L128,192L138,174L148,186Q166,172 166,146Z') +
      clip(k, 'M52,146Q54,176 70,186L78,174L88,192L98,176L108,196L118,176L128,192L138,174L148,186Q166,172 166,146Z', scr(k, 'h', 'M120,140L180,140L180,200L120,200Z')),
    head: k => {
      const w = '#f4efe4';
      return S(k, w, 'M50,102L34,108L48,116L32,126L50,128Z') + headForm(k, w, k.sp.h) +
        // heavy brow ridge: the eagle's permanent scowl shelf
        P(dk(w, 0.12), 'M70,82Q100,68 144,80Q142,90 130,92Q100,82 76,96Z', NS) + scr(k, 'h', 'M70,82Q100,68 144,80Q142,90 130,92Q100,82 76,96Z', 'opacity=".5"');
    },
  },
  pigeon: {
    main: '#8f99a8', hat: 'derby', iris: '#e8742a',
    h: [110, 114, 58, 56], e: [114, 106, 18, 34],
    bill: () => ({ t: 'point', x: 142, y: 134, a: 14, L: 40, hu: 10, hl: 7, c: '#3a3430' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 178, 40], chest: [60, 218],
    body: k => {
      const ir = 'M68,156Q112,182 156,156Q164,176 154,192Q112,210 70,192Q60,176 68,156Z';
      return mantle(k, dk(k.M, 0.06), 188) + coverts(dk(k.M, 0.06), 188) +
        P(dk(k.M, 0.45), lensD(20, 226, 42, 216, 64, 230, 6) + lensD(220, 226, 198, 216, 176, 230, 6), NS) +
        bib(k, lt(k.M, 0.15), 150, 42, 112, 72) +
        P('#4f9a84', ir, sw(1.8)) + P('#86589e', 'M74,182Q112,202 150,182Q150,192 146,196Q112,212 78,196Q74,192 74,182Z', NS) +
        clip(k, ir, scr(k, 'c', 'M60,150L104,150L96,210L60,210Z', 'opacity=".5"') + scr(k, 'h', 'M130,150L170,150L170,210L124,210Z'));
    },
    head: k => headForm(k, k.M, k.sp.h),
    over: () => P('#f2ede2', 'M140,124Q148,116 156,124Q154,130 144,130Z', sw(1.8)),
  },
  roadrunner: {
    main: '#9a7a52', hat: 'none', iris: '#e8c890',
    h: [106, 114, 58, 56], e: [112, 106, 18, 34],
    bill: () => ({ t: 'point', x: 136, y: 134, a: 8, L: 90, hu: 14, hl: 9, c: '#3a3430' }),
    hatA: [112, 0, 0.9, -6], neck: [108, 178, 38], chest: [58, 218],
    body: k => mantle(k, k.M, 188) + coverts(k.M, 188) + P(dk(k.M, 0.45), scallopD(14, 218, 4, 2, 14) + scallopD(160, 218, 4, 2, 14), NS) +
      bib(k, '#ede0c4', 150, 38, 108, 62) +
      P('#5a4030', [[86, 200], [104, 204], [122, 200], [96, 226], [116, 228], [136, 218]].map(([x, y]) => lensD(x, y, x + 1.5, y + 5, x + 3, y + 11, 3)).join(''), NS),
    head: k => {
      const crest = 'M132,72L112,10L118,58L80,14L98,62L52,34L84,78Z';
      return S(k, '#3a2a20', crest) + scr(k, 'c', crest, 'opacity=".4"') +
        headForm(k, k.M, k.sp.h) + P(dk(k.M, 0.5), [[64, 106, 72, 108], [60, 122, 68, 122], [70, 136, 78, 134], [92, 68, 94, 76], [78, 80, 84, 84]].map(([a, b, c, e]) => lensD(a, b, (a + c) / 2, (b + e) / 2, c, e, 2.6)).join(''), NS) +
        P('#5ab0d8', 'M88,104Q80,114 88,126Q96,122 96,110Z', NS) + P('#e8742a', 'M80,110Q72,120 80,132Q86,128 88,120Z', NS);
    },
  },
  loon: {
    main: '#23302c', hat: 'none', iris: '#d8302a', ...STD,
    lid: k => lt(k.M, 0.12),
    bill: () => ({ t: 'point', x: 134, y: 143, a: 10, L: 84, hu: 14, hl: 9, c: '#2a2e32', c2: '#22262a' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 180, 40], chest: [60, 218],
    body: k => {
      let dots = '';
      for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) dots += ellD(14 + i * 9 + j * 3, 218 + j * 10, 2.2, 2.2) + ellD(226 - i * 9 - j * 3, 218 + j * 10, 2.2, 2.2);
      // the loon's striped collar: a band cut with fine cream lines
      return mantle(k, k.M, 188) + P(WHITE, dots, NS) + bib(k, k.M, 150, 40) + P('#fbf7ee', 'M68,248C72,224 92,206 112,206C132,206 152,224 156,248Z', sw(1.8)) +
        clip(k, k.neckD, scr(k, 'c', 'M60,182Q112,194 164,182L164,194Q112,206 60,194Z'));
    },
    head: k => headForm(k, k.M, k.sp.h),
  },
  dodo: {
    main: '#8e9aa6', hat: 'none',
    h: [104, 118, 62, 58], e: [106, 106, 19, 32],
    lid: () => '#e2d8bc',
    bill: () => ({ t: 'hook', x: 124, y: 138, a: 14, L: 96, hu: 34, hl: 18, c: '#e8dca0', c2: '#c9a24a' }),
    hatA: [108, 0, 0.9, -6], neck: [108, 182, 44], chest: [58, 218],
    body: k => mantle(k, k.M, 188) + coverts(k.M, 188) + bib(k, lt(k.M, 0.15), 156, 44, 108, 72) + scallops(eng(lt(k.M, 0.15)), 74, 206, 6, 3),
    head: k => headForm(k, k.M, k.sp.h) + P('#e2d8bc', ellD(116, 106, 38, 32), NS) + shade(k, ellD(116, 106, 38, 32), 8, 8) + S(k, k.M, 'M98,62Q90,48 102,44Q100,54 108,58Z'),
  },
  flamingo: {
    hs: [1.12, 120, 110],
    main: '#f08aa6', hat: 'feathered', iris: '#f2d040', lashes: true,
    h: [122, 84, 44, 38], e: [124, 80, 16, 28],
    hb: [-40, -0.06, 30, 30, 0.06, 26, -150, 0.04, 26],
    bill: () => ({ t: 'flamingo', x: 146, y: 96, a: 6, L: 80, hu: 14, hl: 9, c: '#f7eadf', c2: '#ecd8cc' }),
    hatA: [122, 0, 0.7, -8], neck: [88, 202, 24], chest: [184, 226],
    body: k => mantle(k, k.M, 206) + coverts(k.M, 206) +
      neckTube(k, k.M, [104, 256, 30, 196, 168, 150, 120, 104], 20, 15, 16) + P(eng(k.M), lensD(76, 240, 56, 210, 70, 180, 1.8), NS),
    head: k => headForm(k, k.M, k.sp.h),
  },
  magpie: {
    main: '#22232c', hat: 'bowler', ...STD,
    lid: k => lt(k.M, 0.12),
    bill: () => ({ t: 'point', x: 134, y: 143, a: 10, L: 70, hu: 15, hl: 10, c: '#2e2e36', c2: '#24242c' }),
    hatA: [114, 0, 0.9, -6], neck: [110, 178, 40], chest: [60, 218],
    body: k => {
      const wl = 'M-8,224C6,200 34,192 64,192Q76,216 64,248L-8,248Z', wr = 'M248,224C234,200 206,192 176,192Q164,216 176,248L248,248Z';
      const belly = 'M74,198Q112,214 150,198Q162,222 160,248L64,248Q62,222 74,198Z';
      return mantle(k, k.M, 188) + P('#fbf7ee', wl) + P('#fbf7ee', wr) + shade(k, wr, 14, 0) +
        P('#3a72b0', 'M64,192Q78,206 80,248L64,248Q76,216 64,192Z', NS) + P('#3a72b0', 'M176,192Q162,206 160,248L176,248Q164,216 176,192Z', NS) +
        bib(k, k.M, 150, 40) + P('#fbf7ee', belly) + shade(k, belly, 14, 0);
    },
    head: k => headForm(k, k.M, k.sp.h),
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
  const id = `p${(UID = (UID + 1) % 1e6)}-`;
  const k: K = {
    o, sp, M: o.plumage ?? sp.main, ex: o.expression ?? 'neutral', hat, acc, r: rng((o.seed ?? 7) + 1),
    id, n: 0, sil: '', defs: '', forms: {}, headD: '', neckD: '',
  };
  // body/head first consume rng in a fixed order so hats/tufts are stable across expressions
  const body = sp.body(k);
  const bodySil = k.sil;
  k.sil = '';
  const nw = neckwear(k);
  const head = sp.head(k);
  const [hatS, hatShadow] = drawHat(k);
  const [hsc, px, py] = sp.hs ?? [1, 0, 0];
  const shift = Math.min(16, 5 - (py + (hatTop(k) - py) * hsc));
  // occlusion: the head's shadow falling on the neck / collar
  const [hx, hy, hrx, hry] = sp.h;
  const ax = hsc !== 1 ? px + (hx - px) * hsc : hx, ay = hsc !== 1 ? py + (hy - py) * hsc : hy;
  const ao = k.neckD ? clip(k, k.neckD, scr(k, 'd', ellD(ax + hrx * 0.12, ay + hry * hsc * 0.9, hrx * hsc * 0.82, hry * hsc * 0.36))) : '';
  const face = head + hatShadow + faceUnder(k) + billAO(k) + drawEyes(k) + drawBill(k) + (sp.over?.(k) ?? '') + faceOver(k) + drawBrows(k) + hatS + (sp.top?.(k) ?? '') + drawFx(k);
  const hT = hsc !== 1 ? `translate(${f(px * (1 - hsc))} ${f(py * (1 - hsc))}) scale(${hsc})` : '';
  const wrap = (s: string): string => (hT ? G(hT, s) : s);
  return (
    `<svg class="portrait" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"><defs>${patterns(id)}${k.defs}</defs>` +
    `<g stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round" stroke-linecap="round"${shift > 0 ? ` transform="translate(0 ${f(shift)})"` : ''}>` +
    `<g fill="${INK}" stroke-width="7">${bodySil}${wrap(k.sil)}</g>` +
    body + ao + nw + wrap(face) +
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
  carl: { name: 'Card Shark Carl', species: 'crow', hat: 'derby', accent: '#3a3a4a', accessory: 'bowtie', extras: ['toothpick'], seed: 51 },
  stu: { name: 'Stingy Stu', species: 'dodo', hat: 'bowler', accent: '#4a3a2a', accessory: 'glasses', seed: 52 },
  tess: { name: 'Tax Collector Tess', species: 'pelican', hat: 'visor', accent: '#2f6a3a', accessory: 'pearls', seed: 53 },
  flo: { name: 'Fancy Flo', species: 'flamingo', hat: 'feathered', accent: '#c02a6a', accessory: 'pearls', seed: 54 },
  pierre: { name: 'Pierre the Penguin', species: 'penguin', hat: 'tophat', accent: '#2a2a3a', accessory: 'monocle', seed: 55 },
  earl: { name: 'Bald Eagle Earl', species: 'eagle', hat: 'sheriff', accent: '#6a5a3a', accessory: 'mustache', seed: 56 },
  tango: { name: 'Tango the Toucan', species: 'toucan', hat: 'cowboy', accent: '#c8642a', accessory: 'bandana', accent2: '#2a8a5a', seed: 57 },
  dot: { name: 'Dot the Dodo', species: 'dodo', plumage: '#c9a47a', hat: 'feathered', accent: '#6a3d6e', accessory: 'scar', seed: 58 },

  woodgas: { name: 'Woodgas', species: 'dodo', plumage: '#a89a7a', hat: 'derby', accent: '#7a8a3a', accessory: 'toothpick', extras: ['glasses'], seed: 77 },

  // --- the Outlaw's gang (henchmen, no curse of their own)
  goon_sid: { name: 'Snake-Eye Sid', species: 'crow', hat: 'bandit', accent: '#2a2430', accessory: 'bandana', accent2: '#8a2a1e', seed: 71 },
  goon_clem: { name: 'Crooked Clem', species: 'vulture', hat: 'cowboy', accent: '#5a4030', accessory: 'eyepatch', seed: 72 },
  goon_ted: { name: 'Two-Bit Ted', species: 'pigeon', hat: 'derby', accent: '#3a3a3a', accessory: 'toothpick', seed: 73 },
  goon_mabel: { name: 'Mean Mabel', species: 'goose', plumage: '#8a7a6a', hat: 'bandit', accessory: 'bandana', accent2: '#3a5a2a', seed: 74 },
  goon_dusty: { name: 'Dusty Dan', species: 'roadrunner', hat: 'cowboy', accent: '#7a5a3a', accessory: 'scar', seed: 75 },
  goon_ike: { name: 'Ironbill Ike', species: 'turkey', plumage: '#6a5040', hat: 'bowler', accessory: 'bandana', accent2: '#2a2a3a', seed: 76 },

  // Playable gunslingers (the player's portrait is whichever one the run uses)
  hero_kid: { name: 'The Kid', species: 'duck', hat: 'cowboy', accessory: 'bandana', accent2: '#c8302a', extras: ['toothpick'], seed: 42 },
  hero_belle: { name: 'Belle Starling', species: 'swan', hat: 'cowboy', accent: '#7a2a4a', accessory: 'bandana', accent2: '#2a5a9a', seed: 61 },
  hero_doc: { name: 'Doc Hollandaise', species: 'goose', hat: 'derby', accent: '#3a3a4a', accessory: 'mustache', extras: ['bowtie'], seed: 62 },
  hero_hen: { name: 'Calamity Hen', species: 'chicken', plumage: '#d8b878', hat: 'sheriff', accent: '#8a5a2a', accessory: 'badge', seed: 63 },

  orochi: { name: 'The Flock', species: 'goose', plumage: '#5a4e48', hat: 'cowboy', accent: '#3a2a2a', accessory: 'bandana', extras: ['scar'], seed: 46 },
};
