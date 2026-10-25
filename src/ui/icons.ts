// Cartoon-western icon set for Buck Ducks.
// Every icon is inner SVG markup for a 0 0 64 64 viewBox. Outlines are drawn in
// `currentColor` (ink); fills use only the theme classes:
//   f1 = main accent, f2 = cream highlight, f3 = dark shadow, f4 = gold accent.

const n2 = (v: number): string => (Math.round(v * 100) / 100).toString();
const INK = 'stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';

/** Wrap an icon body in the shared ink-outline group. */
const g = (body: string, extra = ''): string => `<g ${INK}${extra ? ' ' + extra : ''}>${body}</g>`;
/** Path: empty class = pure line stroke. */
const p = (c: string, d: string, a = ''): string =>
  `<path ${c ? `class="${c}"` : 'fill="none"'} d="${d}"${a ? ' ' + a : ''}/>`;
const c = (cl: string, cx: number, cy: number, r: number, a = ''): string =>
  `<circle ${cl ? `class="${cl}"` : 'fill="none"'} cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(r)}"${a ? ' ' + a : ''}/>`;
const e = (cl: string, cx: number, cy: number, rx: number, ry: number, a = ''): string =>
  `<ellipse ${cl ? `class="${cl}"` : 'fill="none"'} cx="${n2(cx)}" cy="${n2(cy)}" rx="${n2(rx)}" ry="${n2(ry)}"${a ? ' ' + a : ''}/>`;
const r = (cl: string, x: number, y: number, w: number, h: number, rr = 0, a = ''): string =>
  `<rect ${cl ? `class="${cl}"` : 'fill="none"'} x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}"${rr ? ` rx="${n2(rr)}"` : ''}${a ? ' ' + a : ''}/>`;
/** Small ink dot (eyes, pips). */
const dot = (x: number, y: number, rad = 1.2): string =>
  `<circle class="f3" stroke="none" cx="${n2(x)}" cy="${n2(y)}" r="${n2(rad + 1.3)}"/>`;
/** Soft cream highlight (no outline). */
const hl = (x: number, y: number, rx: number, ry: number, deg = 0): string =>
  `<ellipse class="f2" stroke="none" cx="${n2(x)}" cy="${n2(y)}" rx="${n2(rx)}" ry="${n2(ry)}"${deg ? ` transform="rotate(${deg} ${n2(x)} ${n2(y)})"` : ''}/>`;
/** Rotate a fragment around a point (default: icon centre). */
const rot = (deg: number, body: string, cx = 32, cy = 32): string =>
  `<g transform="rotate(${deg} ${n2(cx)} ${n2(cy)})">${body}</g>`;
const sw = (w: number): string => `stroke-width="${w}"`;
const NS = 'stroke="none"';

const polar = (cx: number, cy: number, rad: number, deg: number): string => {
  const a = (deg * Math.PI) / 180;
  return `${n2(cx + rad * Math.cos(a))} ${n2(cy + rad * Math.sin(a))}`;
};
/** Star polygon with n points. */
const starD = (cx: number, cy: number, ro: number, ri: number, n: number, start = -90): string => {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    d += (i ? 'L' : 'M') + polar(cx, cy, i % 2 ? ri : ro, start + (i * 180) / n);
  }
  return d + 'Z';
};
/** n copies of a fragment rotated evenly around a point. */
const ring = (n: number, body: string, cx = 32, cy = 32, offset = 0): string => {
  let s = '';
  for (let i = 0; i < n; i++) s += rot(offset + (i * 360) / n, body, cx, cy);
  return s;
};
/** Archimedean spiral polyline from radius r0 to r1 over `turns`. */
const spiralD = (cx: number, cy: number, r0: number, r1: number, turns: number, start = 0): string => {
  const steps = Math.round(turns * 24);
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    d += (i ? 'L' : 'M') + polar(cx, cy, r0 + (r1 - r0) * t, start + t * turns * 360);
  }
  return d;
};
/** Annulus (ring) path for even-odd fill. */
const annulusD = (cx: number, cy: number, ro: number, ri: number): string =>
  `M${cx - ro} ${cy}a${ro} ${ro} 0 1 0 ${ro * 2} 0a${ro} ${ro} 0 1 0 ${-ro * 2} 0Z` +
  `M${cx - ri} ${cy}a${ri} ${ri} 0 1 0 ${ri * 2} 0a${ri} ${ri} 0 1 0 ${-ri * 2} 0Z`;
/** Elliptical ring path for even-odd fill. */
const ellRingD = (cx: number, cy: number, rx: number, ry: number, t: number): string =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z` +
  `M${cx - rx + t} ${cy}a${rx - t} ${ry - t} 0 1 0 ${(rx - t) * 2} 0a${rx - t} ${ry - t} 0 1 0 ${-(rx - t) * 2} 0Z`;
const heartD = (cx: number, cy: number, s: number): string => {
  const f = (x: number, y: number): string => `${n2(cx + x * s)} ${n2(cy + y * s)}`;
  return `M${f(0, 1)}C${f(-0.55, 0.62)} ${f(-1, 0.25)} ${f(-1, -0.25)}C${f(-1, -0.62)} ${f(-0.72, -0.85)} ${f(-0.45, -0.85)}C${f(-0.22, -0.85)} ${f(-0.06, -0.72)} ${f(0, -0.52)}C${f(0.06, -0.72)} ${f(0.22, -0.85)} ${f(0.45, -0.85)}C${f(0.72, -0.85)} ${f(1, -0.62)} ${f(1, -0.25)}C${f(1, 0.25)} ${f(0.55, 0.62)} ${f(0, 1)}Z`;
};

/** Transform a path that only uses coordinate-pair commands (M L Q C T S Z): scale, rotate, then move. */
const tp = (d: string, x: number, y: number, s = 1, deg = 0): string => {
  const a = (deg * Math.PI) / 180;
  const co = Math.cos(a);
  const si = Math.sin(a);
  return d.replace(/(-?\d*\.?\d+)[ ,]+(-?\d*\.?\d+)/g, (_m, u: string, v: string) => {
    const px = +u * s;
    const py = +v * s;
    return `${n2(x + px * co - py * si)} ${n2(y + px * si + py * co)}`;
  });
};

type Pt = [number, number];
/** Cubic bezier as a function of t. */
const bez =
  (a: Pt, b: Pt, cc: Pt, d: Pt) =>
  (t: number): Pt => {
    const u = 1 - t;
    return [
      u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * cc[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * cc[1] + t * t * t * d[1],
    ];
  };
/** A filled tube (worm, neck, rope) along a centre-line; `w` gives the half-width at t. */
const tubeD = (f: (t: number) => Pt, w: (t: number) => number, n = 40, closed = false): string => {
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [x, y] = f(t);
    const [x2, y2] = f(Math.min(1, t + 0.002));
    const [x1, y1] = f(Math.max(0, t - 0.002));
    let dx = x2 - x1;
    let dy = y2 - y1;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    const ww = w(t);
    L.push([x - dy * ww, y + dx * ww]);
    R.push([x + dy * ww, y - dx * ww]);
  }
  const pts = (a: Pt[]): string => a.map(q => `${n2(q[0])} ${n2(q[1])}`).join('L');
  return closed ? `M${pts(L)}ZM${pts(R)}Z` : `M${pts(L)}L${pts(R.reverse())}Z`;
};

/** Cartoon eye: cream ball, pupil offset by (dx, dy), and a glint. */
const eyeB = (x: number, y: number, rad = 4.5, dx = 0.6, dy = 0, w = 2.5): string =>
  c('f2', x, y, rad, sw(w)) +
  c('f3', x + dx, y + dy, rad * 0.52, NS) +
  c('f2', x + dx + rad * 0.2, y + dy - rad * 0.22, Math.max(0.7, rad * 0.17), NS);
/** Heavy eyelid over the top of an eye; `deg` tilts it (positive = clockwise), `cover` lowers it. */
const lid = (x: number, y: number, rad: number, deg = 0, cls = 'f1', cover = 0.05, w = 2.5): string =>
  rot(
    deg,
    p(cls, `M${n2(x - rad - 0.4)} ${n2(y + cover * rad)}A${n2(rad + 0.4)} ${n2(rad + 0.4)} 0 0 1 ${n2(x + rad + 0.4)} ${n2(y + cover * rad)}Z`, sw(w)),
    x,
    y,
  );

// Cowboy hat in local coordinates: brim centre at (0, 0), ~54 wide, ~26 tall.
const HAT_CROWN = 'M-12 1C-13 -9 -12 -18 -8 -19Q-4 -20 0 -15Q4 -20 8 -19C12 -18 13 -9 12 1Z';
const HAT_BAND = 'M-12.6 -6.5L12.6 -6.5L12.2 -1.5L-12.2 -1.5Z';
const HAT_BRIM = 'M-27 -7Q-25 6 0 6Q25 6 27 -7Q21 0 0 0Q-21 0 -27 -7Z';
/** Cowboy hat placed with its brim centre at (x, y). */
const hat = (x: number, y: number, s = 1, deg = 0, cls = 'f4', band = 'f1', w = 3): string =>
  `<g ${sw(w)}>` +
  p(cls, tp(HAT_CROWN, x, y, s, deg)) +
  p(band, tp(HAT_BAND, x, y, s, deg), `stroke-width="${n2(w * 0.7)}"`) +
  p(cls, tp(HAT_BRIM, x, y, s, deg)) +
  '</g>';
/** Gently wavy water line. */
const waves = (y: number, x0 = 6, x1 = 58, amp = 2.5, step = 8): string => {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x1; x += step) d += `Q${x + step / 4} ${y - amp} ${x + step / 2} ${y}T${x + step} ${y}`;
  return p('', d, sw(2.5));
};

/** Four-point twinkle. */
const twinkle = (x: number, y: number, s: number, cls = 'f2', w = 2): string => {
  const k = s * 0.18;
  return p(
    cls,
    `M${n2(x)} ${n2(y - s)}Q${n2(x + k)} ${n2(y - k)} ${n2(x + s)} ${n2(y)}Q${n2(x + k)} ${n2(y + k)} ${n2(x)} ${n2(y + s)}Q${n2(x - k)} ${n2(y + k)} ${n2(x - s)} ${n2(y)}Q${n2(x - k)} ${n2(y - k)} ${n2(x)} ${n2(y - s)}Z`,
    sw(w),
  );
};
/** Small spoked wagon wheel. */
const wheelS = (x: number, y: number, R: number, cls = 'f4'): string => {
  let spokes = '';
  for (let i = 0; i < 4; i++) spokes += `M${polar(x, y, R - 1.5, i * 45)}L${polar(x, y, R - 1.5, i * 45 + 180)}`;
  return c(cls, x, y, R) + p('', spokes, sw(2)) + c('f3', x, y, Math.max(1.8, R * 0.25), sw(1.5));
};
const xy = (cx: number, cy: number, rad: number, deg: number): Pt => [
  cx + rad * Math.cos((deg * Math.PI) / 180),
  cy + rad * Math.sin((deg * Math.PI) / 180),
];
const MIRROR = 'transform="translate(64 0) scale(-1 1)"';
/** One poker chip in side view, top face at y. */
const chip = (y: number, cls: string): string =>
  p(cls, `M10 ${y}V${y + 6}A22 7 0 0 0 54 ${y + 6}V${y}`) +
  e(cls, 32, y, 22, 7) +
  [14, 25, 39, 50].map((x, i) => r('f2', x - 2, y + (i === 0 || i === 3 ? 4 : 6), 4, 4.5, 0.5, NS)).join('');
const HORN = 'M21 15Q12 18 7 12Q5 9 3 4Q1 14 6 20Q12 26 22 24Z';
const MUSTACHE = 'M32 26Q26 20 18 25Q12 30 7 26Q3 22 7 17Q2 19 2 26Q4 37 17 37Q27 37 32 32Q37 37 47 37Q60 37 62 26Q62 19 57 17Q61 22 57 26Q52 30 46 25Q38 20 32 26Z';
const trap = (a: number, b: number): string =>
  `M${n2(12 + 40 * a)} 26H${n2(12 + 40 * b)}L${n2(18 + 28 * b)} 58H${n2(18 + 28 * a)}Z`;

export const ICONS: Record<string, string> = {};

export function iconSvg(name: string, cls = ''): string {
  return `<svg class="icon ${cls}" viewBox="0 0 64 64" aria-hidden="true">${ICONS[name] ?? ICONS.duck}</svg>`;
}

// ---------------------------------------------------------------- birds
Object.assign(ICONS, {
  duck: g(
    p('f3', 'M12 58Q12 48 21 44H39Q50 47 51 58Z') +
      c('f1', 29, 33, 14) +
      p('f2', 'M17 41Q29 48 41 41L42 46Q29 53 16 46Z', sw(2.5)) +
      p('f4', 'M40 29Q50 25 58 28Q62 32 58 35Q50 39 41 37Z') +
      p('', 'M44 33Q51 33 58 32', sw(2)) +
      eyeB(33, 30, 5, 1.3, 0.8) +
      lid(33, 30, 5, 16, 'f1', 0.1) +
      hat(27, 19, 0.7, -12),
  ),
  duckling: g(
    e('f4', 32, 43, 17, 13) +
      c('f4', 32, 24, 13) +
      p('', 'M30 11Q29 5 34 6M33 11Q36 6 40 9', sw(2.5)) +
      eyeB(26.5, 22, 4.3, 0.5, 0.8) +
      eyeB(37.5, 22, 4.3, -0.5, 0.8) +
      p('f1', 'M25 29Q32 26 39 29Q37 35 32 35Q27 35 25 29Z') +
      p('f2', 'M12 45L17 40L22 45L27 40L32 45L37 40L42 45L47 40L52 45Q53 58 32 58Q11 58 12 45Z'),
  ),
  goose: g(
    p('f2', 'M6 46Q8 35 20 36Q30 38 36 44Q46 44 54 38Q54 54 38 56H18Q6 54 6 46Z') +
      p('', 'M16 45Q26 51 38 48', sw(2.5)) +
      p('f3', 'M20 40Q15 27 23 19Q29 12 38 11L44 21Q35 21 33 25Q29 31 33 42Z') +
      e('f3', 41, 16, 8.5, 7.5) +
      e('f2', 36.5, 21, 4.5, 2.6, `${sw(2)} transform="rotate(-25 36.5 21)"`) +
      p('f1', 'M47 13L60 12L59 22L47 20Z', sw(2)) +
      p('f4', 'M46 10L61 9Q61 13 48 16Z') +
      p('f4', 'M47 20L59 24Q57 27 45 23Z') +
      eyeB(42, 13.5, 3.3, 0.8, 0.6) +
      p('', 'M35 8L47 11', sw(3.5)) +
      p('', 'M56 4L60 1M60 30L63 33', sw(2.5)),
  ),
  swan: g(
    waves(57, 4, 60) +
      p('f2', 'M10 44Q12 36 22 38Q34 42 44 36Q54 28 60 26Q60 42 52 50Q44 55 30 55Q14 55 10 44Z') +
      p('', 'M26 45Q38 50 50 40M34 50Q44 52 52 45', sw(2)) +
      p('f2', tubeD(bez([16, 44], [4, 30], [26, 22], [20, 12]), t => 3.6 - t * 0.8)) +
      e('f2', 21, 11, 7, 5.5) +
      p('f1', 'M15 9L4 14L16 14Z') +
      p('f3', 'M15 7.5L18 6L18 12L15 11Z', sw(2)) +
      eyeB(22.5, 10, 2.8, -0.6, 0.4, 2) +
      lid(22.5, 10, 2.8, -8, 'f2', 0.2, 2),
  ),
  turkey: g(
    [-60, -40, -20, 0, 20, 40, 60]
      .map((a, i) => rot(a, e(i % 2 ? 'f4' : 'f1', 32, 21, 6.5, 12.5) + c('f2', 32, 12, 2.2, NS), 32, 40))
      .join('') +
      e('f3', 32, 45, 14, 12) +
      p('', 'M26 56V60M38 56V60', sw(3)) +
      e('f2', 32, 29, 8, 9) +
      eyeB(28.5, 27, 3.2, 0.3, 0.4, 2) +
      eyeB(35.5, 27, 3.2, -0.3, 0.4, 2) +
      p('f4', 'M29.5 31.5H34.5L32 35.5Z', sw(2)) +
      p('f1', 'M33 34Q37 38 35 43Q31 43 32 36Z', sw(2)),
  ),
  rooster: g(
    p('f3', 'M40 34Q42 12 56 8Q60 22 52 40Z') +
      p('f3', 'M44 36Q54 26 60 30Q58 42 50 46Z') +
      p('', 'M30 50L28 58M38 50L40 58M24 58H31M37 58H44', sw(2.5)) +
      p('f2', 'M20 30Q14 22 18 15Q24 9 29 16Q32 28 44 30Q52 32 52 42Q48 52 34 52Q20 50 20 30Z') +
      p('', 'M30 38Q38 44 46 40', sw(2.5)) +
      p('f1', 'M17 14Q16 8 20 9Q22 5 25 9Q29 7 28 13Z', sw(2.5)) +
      p('f1', 'M16 22Q13 28 17 28Q19 26 18 22Z', sw(2)) +
      p('f4', 'M15 17L7 20L15 22Z', sw(2.5)) +
      eyeB(22, 17, 3, -0.6, 0.3, 2) +
      lid(22, 17, 3, -14, 'f2', 0.05, 2),
  ),
  egg: g(
    p('f2', 'M32 6Q49 6 52 34Q54 58 32 58Q10 58 12 34Q15 6 32 6Z') +
      c('f4', 26, 22, 2.4, NS) +
      c('f4', 40, 30, 3, NS) +
      c('f4', 28, 42, 2.6, NS) +
      c('f4', 42, 46, 1.8, NS) +
      p('', 'M20 30Q20 20 25 14', sw(2.5)),
  ),
  chicken: g(
    p('', 'M26 54L24 60M38 54L40 60', sw(3)) +
      p('f2', 'M14 40Q12 22 26 14Q36 10 44 18Q52 26 52 38Q54 52 40 56H24Q14 54 14 40Z') +
      p('f1', 'M25 15Q22 7 28 8Q31 3 35 8Q40 6 39 14Z') +
      eyeB(27, 25, 4.3, 0.6, 0.5) +
      eyeB(38, 25, 4.3, -0.6, 0.5) +
      p('f4', 'M28.5 31H36.5L32.5 37Z', sw(2.5)) +
      p('f1', 'M31.5 37Q30 42 32.5 42Q35 42 33.5 37Z', sw(2)) +
      p('', 'M17 38Q21 47 30 46M47 38Q44 47 36 46', sw(2.5)),
  ),
  vulture: g(
    p('', 'M4 57H60', sw(4)) +
      p('f3', 'M16 54Q8 38 16 26Q24 18 34 22Q46 28 46 42Q46 52 40 56Z') +
      p('', 'M20 44L16 54M27 47L24 56', sw(2.5)) +
      p('f2', 'M22 23Q23 17 27 19Q29 14 34 17Q38 14 40 19Q45 17 46 23Q34 29 22 23Z') +
      p('f1', 'M31 21Q29 12 37 8Q46 5 49 12Q49 18 43 18Q38 18 36 21Z') +
      p('f4', 'M47 9Q57 9 57 17Q56 22 52 21Q53 16 47 15Z') +
      eyeB(41, 12, 3.4, 0.8, 0.6, 2) +
      lid(41, 12, 3.4, 0, 'f1', 0.2, 2) +
      p('', 'M8 10Q12 6 16 10T24 10', sw(2)),
  ),
  roadrunner: g(
    p('', 'M2 28H12M4 36H14M2 44H10', sw(2.5)) +
      e('', 34, 52, 9, 5, `${sw(2.5)} stroke-dasharray="5 3"`) +
      p('', 'M27 52Q34 46 41 52', sw(2.5)) +
      p('f3', 'M26 34L4 18L10 30L4 32L24 40Z') +
      e('f2', 34, 36, 13, 8, 'transform="rotate(-15 34 36)"') +
      p('f3', 'M24 36Q32 30 44 34Q36 42 24 36Z', sw(2.5)) +
      p('f2', 'M38 30Q42 24 41 18L51 20Q48 30 46 34Z') +
      p('f3', 'M40 13L36 3L43 10L45 2L48 11Z', sw(2.5)) +
      e('f2', 46, 18, 8, 7) +
      p('f3', 'M52 15L63 19L52 22Z', sw(2.5)) +
      p('f1', 'M53 22Q57 27 60 23', sw(2)) +
      eyeB(47, 16, 3.6, 1.2, 0.2, 2),
  ),
  crow: g(
    p('', 'M30 46L28 57M36 45L38 57M25 57H31M35 57H41', sw(2.5)) +
      p('f3', 'M16 26Q18 13 30 16Q44 20 52 32L59 43L48 41Q40 48 28 46Q16 43 16 26Z') +
      p('f3', 'M24 29Q38 26 52 39Q38 41 27 38Z') +
      p('f4', 'M17 20L5 25L17 29Z') +
      eyeB(24, 20, 4, -0.8, 0.4, 2) +
      lid(24, 20, 4, -14, 'f3', 0.05, 2),
  ),
  owl: g(
    p('f4', 'M14 21L16 7L26 14Q32 12 38 14L48 7L50 21Q56 36 50 50Q42 58 32 58Q22 58 14 50Q8 36 14 21Z') +
      c('f2', 24, 27, 8) +
      c('f2', 40, 27, 8) +
      c('f3', 24, 27, 3.5) +
      c('f3', 40, 27, 3.5) +
      c('f2', 25.2, 25.8, 1, NS) +
      c('f2', 41.2, 25.8, 1, NS) +
      p('f1', 'M29 34H35L32 40Z', sw(2.5)) +
      p('', 'M24 46L27 49L30 46L33 49L36 46L39 49M28 52L31 55L34 52', sw(2.5)),
  ),
  pelican: g(
    p('f2', 'M6 58Q4 40 12 30Q16 26 22 28L28 34Q20 44 26 58Z') +
      c('f2', 20, 18, 9) +
      p('f3', 'M39 25L35 15L44 18Z', sw(2.5)) +
      p('f1', 'M25 23Q27 42 42 40Q54 37 58 24Z') +
      p('f4', 'M25 14L60 20Q62 24 58 25L26 23Z') +
      eyeB(19, 16, 3.6, 0.8, 0.4, 2) +
      lid(19, 16, 3.6, 0, 'f2', 0.1, 2) +
      p('', 'M33 30Q36 34 40 33', sw(2)),
  ),
  flamingo: g(
    p('', 'M37 38V58M37 46L45 43L39 38', sw(2.5)) +
      p('f1', tubeD(bez([28, 30], [10, 34], [8, 12], [22, 11]), t => 3.4 - t * 0.6)) +
      p('f1', 'M52 26L61 21L58 31Z') +
      e('f1', 39, 30, 16, 9.5, 'transform="rotate(-10 39 30)"') +
      p('', 'M30 28Q42 25 51 31', sw(2)) +
      c('f1', 24, 11, 6) +
      p('f2', 'M29 8Q38 7 38 14L35 17Q33 12 29 13Z') +
      p('f3', 'M36 12Q38 15 36 18L34 16Z', sw(2)) +
      eyeB(23.5, 10, 2.8, 0.6, 0.3, 2) +
      p('', 'M21 6.5L20 4.5M23.5 6L23.5 4M26 6.8L27 5', sw(1.6)),
  ),
  heron: g(
    p('', 'M36 44L34 58M42 43L45 58M30 58H38M42 58H50', sw(2.5)) +
      p('f2', 'M24 32Q30 24 44 27Q54 30 58 44Q46 41 36 44Q26 42 24 32Z') +
      p('', 'M36 31Q44 32 52 39', sw(2.5)) +
      p('f2', 'M24 33Q15 26 22 19Q28 15 22 11L26 8Q34 15 28 22Q24 27 30 30Z') +
      e('f2', 23, 10, 5, 4) +
      p('f4', 'M19 9L5 13L19 12Z', sw(2.5)) +
      p('', 'M27 8L36 5', sw(2.5)) +
      eyeB(23, 9.5, 2.4, -0.4, 0, 1.8),
  ),
  ostrich: g(
    p('', 'M38 38L36 56L32 58M48 38L51 56L55 58', sw(3)) +
      p('f2', tubeD(bez([30, 30], [16, 24], [10, 38], [16, 52]), t => 4.6 - t * 1.2)) +
      e('f3', 42, 27, 18, 12, 'transform="rotate(-8 42 27)"') +
      p('f2', 'M56 19Q65 11 62 25Q65 27 58 32Z') +
      p('', 'M32 28Q36 34 42 30Q46 36 52 30', sw(2)) +
      p('f4', 'M2 59Q5 46 17 45Q30 45 33 59Z') +
      p('', 'M10 52L11 51M22 51L23 50M27 55L28 54', sw(2)) +
      p('', 'M4 40Q2 36 5 33M8 36Q7 33 9 31', sw(2)),
  ),
  eagle: g(
    p('f3', 'M6 58Q8 46 20 42L34 44Q46 46 52 58Z') +
      p('f2', 'M16 48Q10 34 16 22Q24 10 38 12Q48 14 50 22L50 28Q42 32 36 36Q30 44 30 50Z') +
      p('', 'M17 36L12 40M18 43L14 48', sw(2.5)) +
      p('f4', 'M42 18Q58 16 60 30Q60 37 56 39Q56 32 52 30L44 32Q40 26 42 18Z') +
      p('', 'M46 28L52 29', sw(2)) +
      eyeB(35, 23, 4, 1, 0.8) +
      p('f3', 'M24 15L45 18L44 21.5L25 18.5Z', sw(2)),
  ),
  loon: g(
    waves(55, 4, 60) +
      p('f3', 'M6 41Q10 33 24 35H38Q45 35 47 41Q45 47 34 49H14Q6 47 6 41Z') +
      p('f3', 'M36 37Q38 25 42 19L50 21Q46 29 46 39Z') +
      e('f3', 46, 18, 8, 7) +
      p('f3', 'M52 16L63 20L52 23Z', sw(2.5)) +
      p('f2', 'M38.5 29L46.5 27.5L46.5 31L38 32.5Z', NS) +
      [14, 20, 26, 32].map(x => c('f2', x, 40, 1.3, NS) + c('f2', x + 3, 44, 1.3, NS)).join('') +
      c('f1', 47, 16, 3.6, sw(2)) +
      c('f3', 47.6, 16.2, 1.6, NS) +
      p('', 'M40 6Q42 2 46 4M50 4Q52 1 55 3', sw(2)),
  ),
  penguin: g(
    e('f4', 24, 56, 7, 3) +
      e('f4', 40, 56, 7, 3) +
      p('f3', 'M15 44Q6 38 12 28L19 34Z') +
      p('f3', 'M49 44Q58 38 52 28L45 34Z') +
      e('f3', 32, 34, 17, 22) +
      e('f2', 32, 40, 11, 15) +
      eyeB(26.5, 21, 4.4, 0.6, 0.6) +
      eyeB(37.5, 21, 4.4, -0.6, 0.6) +
      p('f4', 'M28 27H36L32 33Z', sw(2.5)) +
      p('f1', 'M20 34Q32 39 44 34L32 47Z') +
      p('f1', 'M42 34L48 31L47 38Z', sw(2)),
  ),
  pigeon: g(
    p('', 'M30 51L28 58M37 51L39 58', sw(3)) +
      p('f2', 'M50 36L62 42L52 46Z') +
      p('f2', 'M14 30Q12 17 22 14Q31 12 32 21Q34 28 44 30Q56 32 56 41Q54 52 38 52Q20 52 16 41Q14 37 14 30Z') +
      p('f1', 'M17 30Q24 35 33 30Q36 37 27 40Q19 39 17 30Z', NS) +
      p('', 'M33 39L46 37M35 44L48 42', sw(3)) +
      p('f3', 'M15 19L6 23L15 25Z', sw(2.5)) +
      c('f2', 15.5, 18.5, 1.6, sw(1.5)) +
      c('f1', 22, 19, 3.6, sw(2)) +
      c('f3', 21, 19.2, 1.7, NS),
  ),
  parrot: g(
    r('f3', 6, 46, 52, 5, 2.5) +
      p('f4', 'M33 42L42 60L36 61L29 45Z') +
      p('f1', 'M36 42L49 58L44 61L32 46Z') +
      p('f1', 'M20 22Q20 8 32 8Q44 8 44 22Q48 36 40 47H26Q18 36 20 22Z') +
      e('f2', 27, 18, 6, 5.5, NS) +
      p('f4', 'M31 24Q43 22 44 34Q43 44 35 47Q28 36 31 24Z') +
      p('', 'M35 32L41 30M35 38L41 37', sw(2)) +
      p('f2', 'M22 15Q12 13 11 23Q11 30 17 31Q15 25 22 25Z') +
      p('f3', 'M17 26Q19 30 24 28L22 23Z', sw(2)) +
      eyeB(28, 16.5, 3.5, -0.7, 0.3, 2) +
      p('', 'M29 47V51M35 47V51', sw(2.5)),
  ),
  toucan: g(
    p('f3', 'M10 58Q3 40 10 26Q14 14 26 14Q33 16 33 24Q35 40 31 58Z') +
      p('f2', 'M24 24Q33 26 33 34Q31 42 25 40Q21 32 24 24Z') +
      p('f4', 'M28 16Q46 8 57 17Q62 24 56 27Q44 24 30 29Z') +
      p('f1', 'M52 14Q60 17 60 22Q58 27 54 26Q56 20 52 14Z') +
      p('', 'M31 23Q44 19 58 22', sw(2)) +
      c('f1', 20, 21, 5.5, sw(2.5)) +
      eyeB(20, 21, 3.3, 0.6, 0.2, 2),
  ),
  magpie: g(
    p('', 'M30 45L28 54M35 45L36 54', sw(2.5)) +
      p('f3', 'M24 40L5 55L11 59L28 45Z') +
      e('f2', 31, 37, 13, 9.5, 'transform="rotate(-25 31 37)"') +
      p('f3', 'M17 35Q21 22 38 24L42 32Q30 41 17 35Z') +
      c('f3', 42, 20, 9) +
      c('f4', 55, 27, 6) +
      c('', 55, 27, 3, sw(1.6)) +
      p('f3', 'M49 17L59 21L49 25Z', sw(2.5)) +
      eyeB(43.5, 17.5, 3.8, -1.4, 0.2, 2) +
      lid(43.5, 17.5, 3.8, -10, 'f3', 0, 2),
  ),
  dodo: g(
    p('f4', 'M22 52L17 59H28Z', sw(2.5)) +
      p('f4', 'M34 52L31 59H42Z', sw(2.5)) +
      p('f2', 'M13 34Q2 33 5 24Q8 30 15 28Z') +
      e('f2', 27, 40, 17, 15) +
      p('f2', 'M23 37Q30 33 33 42Q28 47 23 37Z', sw(2.5)) +
      p('f2', 'M34 34Q34 18 42 13Q51 12 52 21Q51 30 44 36Z') +
      p('f4', 'M48 15Q61 13 61 25Q61 32 55 33Q56 27 52 26L47 26Z') +
      p('f1', 'M55 28Q58 29 56 33', sw(2)) +
      eyeB(43, 19, 4.2, -0.3, 0.9) +
      lid(43, 19, 4.2, 0, 'f2', 0.25),
  ),
  monkey: g(
    c('f1', 12, 30, 7) +
      c('f2', 12, 30, 3.5, NS) +
      c('f1', 52, 30, 7) +
      c('f2', 52, 30, 3.5, NS) +
      c('f1', 32, 31, 18) +
      p('f2', 'M32 22Q24 15 19 22Q16 29 21 34Q17 42 24 47Q32 52 40 47Q47 42 43 34Q48 29 45 22Q40 15 32 22Z') +
      e('f2', 32, 42, 10, 7) +
      dot(26, 29, 1.6) +
      dot(38, 29, 1.6) +
      c('f3', 29.5, 40, 1, NS) +
      c('f3', 34.5, 40, 1, NS) +
      p('', 'M26 44Q32 48 38 44', sw(2.2)) +
      p('f1', 'M30 13Q31 8 35 9Q33 11 34 14', sw(2)),
  ),
  rubberduck: g(
    waves(58, 4, 60) +
      p('f4', 'M10 38Q10 30 18 32Q24 34 30 32Q22 28 22 18Q22 8 34 8Q46 8 46 18Q46 24 42 28Q54 26 56 34Q58 48 44 54H22Q10 52 10 38Z') +
      p('f1', 'M44 15Q54 12 58 17Q57 22 45 22Z') +
      c('f3', 37, 15, 2.6, NS) +
      c('f2', 37.8, 14.2, 0.9, NS) +
      p('', 'M24 42Q34 48 44 40', sw(2.5)) +
      hl(18, 40, 2, 4, 30) +
      hl(28, 14, 1.6, 3.5, 30),
  ),
  nest: g(
    e('f2', 20, 30, 8, 11, 'transform="rotate(-14 20 30)"') +
      e('f2', 44, 30, 8, 11, 'transform="rotate(14 44 30)"') +
      e('f2', 32, 26, 8.5, 12) +
      c('f4', 29, 22, 1.6, NS) +
      c('f4', 35, 28, 1.2, NS) +
      c('f4', 46, 26, 1.2, NS) +
      p('f4', 'M3 33Q5 58 32 58Q59 58 61 33Q32 43 3 33Z') +
      p('', 'M8 40Q22 50 38 47M16 52Q34 51 54 42M26 43L46 54M5 35L1 30M59 35L63 29M50 50L58 55', sw(2)),
  ),
  feather: g(
    p('f2', 'M52 8Q30 8 20 28Q14 40 14 52Q26 50 38 38Q52 24 52 8Z') +
      p('f1', 'M52 8Q44 9 38 13Q44 16 49 18Q52 13 52 8Z', sw(2.5)) +
      p('', 'M56 5Q38 24 10 58', sw(3)) +
      p('', 'M26 26L33 30M20 36L28 40M38 18L43 22M30 18L36 22', sw(2)),
  ),
  wing: g(
    p('f2', 'M8 54Q3 30 18 17Q32 5 57 6Q61 9 58 13Q53 15 49 17Q58 18 56 24Q51 27 45 28Q53 31 49 37Q43 39 37 39Q42 45 36 49Q30 50 26 49Q27 56 19 57Q11 58 8 54Z') +
      p('f4', 'M8 54Q3 30 18 17Q32 5 57 6Q58 10 50 11Q36 12 28 19Q17 29 15 42Q14 54 8 54Z') +
      p('', 'M49 17Q36 21 27 31M45 28Q34 31 27 39M37 39Q30 42 25 48', sw(2.2)) +
      p('', 'M10 40Q10 30 16 23', sw(1.8)),
  ),
  footprint: rot(
    180,
    g(
      p('f1', 'M32 57Q25 57 27 47L8 15Q21 24 32 6Q43 24 56 15L37 47Q39 57 32 57Z') +
        p('', 'M32 48L14 19M32 48V12M32 48L50 19', sw(2)) +
        c('f3', 8, 15, 2, NS) +
        c('f3', 32, 6, 2, NS) +
        c('f3', 56, 15, 2, NS),
    ),
  ),
});

// ---------------------------------------------------------------- critters' snacks & the pond
Object.assign(ICONS, {
  bread: g(
    p('f4', 'M8 38Q6 22 20 20Q32 12 44 20Q58 22 56 38V50Q56 55 51 55H13Q8 55 8 50Z') +
      p('', 'M8 40Q32 47 56 40', sw(2.5)) +
      e('f2', 20, 28, 5, 2, `${sw(2)} transform="rotate(-35 20 28)"`) +
      e('f2', 32, 24, 5, 2, `${sw(2)} transform="rotate(-35 32 24)"`) +
      e('f2', 44, 28, 5, 2, `${sw(2)} transform="rotate(-35 44 28)"`) +
      hl(15, 47, 1.6, 4),
  ),
  crumbs: g(
    p('f4', 'M14 56V31Q7 27 9 19Q13 8 32 8H38A7 7 0 0 0 47 15A7 7 0 0 0 54 23Q56 28 50 31V56Z') +
      p('f2', 'M14 56V31Q7 27 9 19Q13 8 32 8H38A7 7 0 0 0 47 15A7 7 0 0 0 54 23Q56 28 50 31V56Z', 'transform="translate(32 35) scale(.76) translate(-32 -35)"') +
      c('f4', 57, 9, 2, sw(2)) +
      c('f4', 59, 17, 1.4, sw(1.6)) +
      c('f4', 51, 4, 1.4, sw(1.6)) +
      p('', 'M22 30L23 31M30 40L31 41M38 30L39 31M26 48L27 49', sw(2.5)),
  ),
  corn: rot(
    30,
    g(
      r('f4', 23, 4, 18, 44, 9) +
        p('', 'M24.5 14H39.5M23 20H41M23 26H41M23 32H41M23 38H41M29 4.5V46M35 4.5V46', sw(1.6)) +
        p('f2', 'M25 30Q12 38 16 59Q26 52 32 42Z') +
        p('f2', 'M39 30Q52 38 48 59Q38 52 32 42Z') +
        p('f2', 'M32 40Q26 50 29 60H35Q38 50 32 40Z'),
    ),
  ),
  worm: g(
    p('f1', tubeD(t => [6 + 40 * t, 50 - 6 * Math.sin(t * Math.PI * 2) - 6 * t], t => 3.6 + t * 2, 40)) +
      p('', 'M14 44Q16 48 15 52M24 44Q22 49 24 53M34 41Q33 46 35 50', sw(2)) +
      c('f1', 48, 36, 9) +
      eyeB(45, 34, 3.4, 0.6, 0.4, 2) +
      eyeB(52, 34, 3.4, 0.4, 0.4, 2) +
      p('', 'M45 40Q49 43 53 40', sw(2)) +
      hat(48, 27, 0.48, 8, 'f4', 'f1', 2.5),
  ),
  lilypad: g(
    p('', 'M2 44Q8 54 32 56Q56 54 62 44', `${sw(2)} stroke-dasharray="4 4"`) +
      p('f1', 'M32 40L37 25.3A27 15 0 1 1 27 25.3Z') +
      p('', 'M32 40L10 34M32 40L18 50M32 40L40 54M32 40L54 36', sw(2)) +
      p('f2', 'M44 30Q36 22 40 12Q46 20 44 30Z', sw(2.5)) +
      p('f2', 'M44 30Q52 22 50 12Q44 20 44 30Z', sw(2.5)) +
      p('f2', 'M44 30Q36 30 32 24Q40 22 44 30Z', sw(2.5)) +
      p('f2', 'M44 30Q52 30 56 24Q48 22 44 30Z', sw(2.5)) +
      c('f4', 44, 28, 2.6, sw(2)),
  ),
  pond: g(
    p('', 'M14 44L11 14M20 44L22 18M8 44Q4 34 6 26M50 44Q54 34 58 30', sw(2.5)) +
      e('f4', 11, 17, 3, 7) +
      e('f4', 22, 21, 3, 7) +
      e('f3', 33, 46, 28, 12) +
      p('f2', ellRingD(40, 46, 11, 4, 1.6), `${NS} fill-rule="evenodd"`) +
      p('f2', ellRingD(40, 46, 5, 1.8, 1.4), `${NS} fill-rule="evenodd"`) +
      p('f1', 'M20 48L23 44A7 3.5 0 1 1 18 44.4Z', sw(2)),
  ),
});

// ---------------------------------------------------------------- outlaw outfit & hardware
Object.assign(ICONS, {
  cowboyhat: g(hat(32, 42, 1.06) + hl(23, 31, 1.5, 4.5, 10) + p('', 'M14 42Q32 48 50 42', `${sw(1.6)} stroke-dasharray="2 3"`)),
  tophat: g(
    e('f3', 32, 49, 27, 6.5) +
      p('f3', 'M18 49L16 12Q32 8 48 12L46 49Q32 52 18 49Z') +
      p('f1', 'M17.3 37Q32 40 46.7 37L46.4 45Q32 48 17.6 45Z') +
      e('f3', 32, 11.5, 16, 3.5) +
      hl(22, 25, 1.4, 7, 2),
  ),
  boot: g(
    p('', 'M15 47L8 47', sw(2.5)) +
      p('f4', starD(7, 47, 5, 2, 8), sw(1.6)) +
      p('f1', 'M16 6H38L39 32Q50 33 57 41Q61 47 56 50H27Q25 46 22 46H16Z') +
      p('f3', 'M15 45H27L26 57H17Z') +
      p('f3', 'M26 49H56Q60 49 59 52Q58 55 55 55H26Z') +
      r('f4', 14, 4, 26, 7, 2) +
      p('f4', starD(27.5, 24, 6.5, 2.8, 5), sw(2)) +
      p('', 'M40 38Q46 40 50 46', sw(2)) +
      hl(20, 22, 1.2, 6),
  ),
  spur: g(
    p('f3', 'M4 13Q4 43 32 43V36Q12 36 11 13Z') +
      c('f4', 7.5, 12, 3.6) +
      r('f2', 30, 37, 10, 4, 1.5, sw(2.5)) +
      p('f4', 'M38 41Q35 48 38 51Q41 48 38 41Z', sw(2)) +
      p('f4', starD(48, 39, 14, 5, 8)) +
      c('f2', 48, 39, 3.2, sw(2.5)),
  ),
  revolver: rot(
    -12,
    g(
      p('f1', 'M12 26H26L24 30Q20 42 26 54H14Q6 42 12 26Z') +
        p('f3', 'M12 16H28V34H22L19 29H12Z') +
        p('', 'M24 33Q23 43 33 41V33', sw(2.5)) +
        p('', 'M28 33Q30 36 28 39', sw(2)) +
        r('f2', 26, 17, 33, 7, 1.5) +
        r('f3', 55, 14, 3, 4, 0.5, sw(2)) +
        r('f4', 21, 19, 17, 12, 3) +
        p('', 'M26.5 20V30M32.5 20V30', sw(2)) +
        p('f3', 'M14 18L8 11L12 9L19 16Z', sw(2.5)) +
        c('f4', 16, 40, 1.4, NS) +
        hl(40, 19.5, 10, 0.9),
    ),
  ),
  rifle: rot(
    -32,
    g(
      p('f1', 'M3 32L18 27H27V37H19L5 43Q1 40 3 32Z') +
        p('', 'M29 36Q27 46 34 45Q38 44 37 36', sw(2.5)) +
        r('f3', 37, 27, 25, 4.5, 1) +
        r('f1', 37, 31, 18, 4.5, 2) +
        r('f4', 25, 26, 13, 10, 1.5) +
        r('f3', 58, 24.5, 2, 3, 0.5, sw(1.6)) +
        hl(11, 33.5, 4, 1, -18),
    ),
  ),
  bullet: rot(
    18,
    g(
      p('f1', 'M22 28Q21 9 32 4Q43 9 42 28Z') +
        r('f4', 20, 27, 24, 24, 1) +
        r('f4', 18, 50, 28, 6, 1.5) +
        p('', 'M20 33H44', sw(2)) +
        hl(25, 41, 1.6, 6) +
        hl(27, 16, 1.4, 5, 20),
    ),
  ),
  holster: g(
    r('f4', 3, 12, 58, 9, 2) +
      [9, 15, 49, 55].map(x => r('f1', x - 2, 6, 4, 6, 1.8, sw(2)) + r('f2', x - 2.5, 12, 5, 9, 1, sw(2))).join('') +
      p('f3', 'M24 22Q19 10 27 5H35Q39 7 38 22Z') +
      p('f1', 'M19 19H45L47 28L40 55Q36 60 31 57L19 28Z') +
      p('', 'M23 27L32 52M42 27L37 50', `${sw(1.6)} stroke-dasharray="2.5 3"`) +
      c('f4', 33, 31, 4.5) +
      c('f2', 33, 31, 1.6, NS),
  ),
  lasso: g(
    p('f4', tubeD(t => [30 + 22 * Math.cos(t * Math.PI * 2), 24 + 13 * Math.sin(t * Math.PI * 2)], () => 2.6, 64, true), 'fill-rule="evenodd"') +
      e('', 30, 24, 22, 13, `${sw(1.6)} stroke-dasharray="2 3"`) +
      p('f4', tubeD(bez([44, 34], [58, 46], [18, 40], [22, 59]), () => 2.6)) +
      p('', 'M44 34C58 46 18 40 22 59', `${sw(1.6)} stroke-dasharray="2 3"`) +
      e('f4', 44, 34, 4.5, 3.5, 'transform="rotate(30 44 34)"'),
  ),
  horseshoe: g(
    p('f4', `M${polar(32, 30, 24, 125)}A24 24 0 1 1 ${polar(32, 30, 24, 55)}L${polar(32, 30, 13, 55)}A13 13 0 1 0 ${polar(32, 30, 13, 125)}Z`) +
      r('f3', 13, 47, 9, 6, 1.5, sw(2.5)) +
      r('f3', 42, 47, 9, 6, 1.5, sw(2.5)) +
      [150, 185, 220, 320, 355, 30].map(a => c('f3', ...xy(32, 30, 18.5, a), 1.5, NS)).join('') +
      hl(17, 22, 1.5, 4, 30) +
      twinkle(55, 8, 6, 'f2'),
  ),
  cactus: g(
    p('f4', 'M6 58Q32 50 58 58Z') +
      p('f1', 'M27 37H19Q13 37 13 31V20Q13 16 17 16Q21 16 21 20V29H27Z') +
      p('f1', 'M37 31H44V14Q44 10 48 10Q52 10 52 14V31Q52 39 44 39H37Z') +
      r('f1', 25, 8, 14, 49, 7) +
      p('', 'M32 15V52M17 20V29M48 14V31', sw(2)) +
      p('', 'M25 24H22M25 40H22M39 22H42M39 46H42M13 26H10M52 22H55', sw(2)) +
      p('f4', 'M32 9Q27 3 30 2Q32 4 32 6Q32 4 34 2Q37 3 32 9Z', sw(2)) +
      eyeB(28.5, 20, 2.6, 0.5, 0.5, 2) +
      eyeB(35.5, 20, 2.6, -0.5, 0.5, 2),
  ),
  tumbleweed: g(
    p('', 'M2 22H12M4 32H13M2 42H11', sw(2.5)) +
      c('f2', 14, 55, 4, sw(2)) +
      c('f2', 22, 57, 3, sw(2)) +
      c('f4', 37, 32, 20) +
      p('', 'M24 20Q38 12 50 24Q57 37 45 46Q32 53 23 42Q16 31 29 25Q41 21 46 33Q48 43 37 44Q28 43 30 35Q33 30 39 34', sw(2)) +
      p('', 'M20 30Q30 34 26 46M44 16Q40 28 54 30M31 14Q30 22 36 22M48 50Q44 42 52 40', sw(1.8)) +
      p('', 'M18 26L14 23M54 18L57 15M56 42L60 44M30 52L29 56', sw(2)),
  ),
  dynamite: g(
    p('', 'M32 21Q31 10 40 8Q46 7 48 11', sw(2.5)) +
      r('f1', 13, 24, 12, 33, 3) +
      r('f1', 39, 24, 12, 33, 3) +
      r('f1', 26, 21, 12, 36, 3) +
      r('f3', 11, 40, 42, 6, 1.5) +
      hl(16.5, 32, 1, 4) +
      hl(29.5, 30, 1, 4) +
      hl(42.5, 32, 1, 4) +
      p('f4', starD(49, 10, 8.5, 3.4, 8), sw(2.5)) +
      c('f2', 49, 10, 2, NS),
  ),
  badge: g(
    p('f4', starD(32, 33, 25, 14, 6)) +
      Array.from({ length: 6 }, (_, i) => c('f4', ...xy(32, 33, 26, -90 + i * 60), 3.8)).join('') +
      c('f1', 32, 33, 10.5) +
      p('f2', starD(32, 33.8, 7, 3, 5), sw(2)) +
      hl(22, 24, 1.4, 3.5, 30),
  ),
  star: g(p('f4', starD(32, 34, 26, 11, 5)) + hl(29, 25, 1.8, 4, 25)),
  wanted: g(
    p('f2', 'M9 5H55V50L51 53L55 56V59H9Z') +
      r('f3', 15, 10, 34, 7, 1) +
      c('f3', 30, 37, 8) +
      p('f3', 'M36 34L47 36L36 41Z', sw(2.5)) +
      hat(29, 30, 0.45, -8, 'f3', 'f3', 2.5) +
      p('', 'M17 50H45M22 55H40', sw(3)) +
      c('f4', 13, 8, 1.8, sw(1.5)) +
      c('f4', 51, 8, 1.8, sw(1.5)),
  ),
  saloon: g(
    r('f3', 8, 10, 48, 48) +
      p('f4', 'M18 58L23 50L28 58Q23 56 18 58Z', sw(2)) +
      p('f4', 'M36 58L41 50L46 58Q41 56 36 58Z', sw(2)) +
      p('f4', 'M8 18Q22 18 31 26V48H8Z') +
      p('f4', 'M56 18Q42 18 33 26V48H56Z') +
      p('', 'M11 30H28M11 36H28M11 42H28M36 30H53M36 36H53M36 42H53', sw(2)) +
      r('f1', 3, 8, 6, 51, 1.5) +
      r('f1', 55, 8, 6, 51, 1.5) +
      r('f1', 1, 4, 62, 7, 2),
  ),
});

// ---------------------------------------------------------------- saloon, trail & gold rush
Object.assign(ICONS, {
  bottle: g(
    p('f1', 'M27 9H37V18Q46 23 46 33V54Q46 58 42 58H22Q18 58 18 54V33Q18 23 27 18Z') +
      r('f4', 25.5, 4, 13, 7, 2) +
      r('f2', 18, 33, 28, 15) +
      p('f1', starD(32, 40.8, 5.5, 2.3, 5), sw(2)) +
      hl(22.5, 26, 1.2, 4.5, 20) +
      hl(22, 52, 1, 2.5),
  ),
  shotglass: g(
    p('f2', 'M13 16H51L47 54Q47 58 43 58H21Q17 58 17 54Z') +
      p('f4', 'M14.6 30H49.4L47.5 47H16.5Z', sw(2.5)) +
      p('', 'M18 49H46', sw(2.5)) +
      e('', 32, 16, 19, 3, sw(2)) +
      hl(21, 38, 1.3, 6) +
      p('f4', 'M30 13Q31 6 33 4Q36 9 34 13Q32 15 30 13Z', sw(2)) +
      c('f4', 24, 8, 1.6, sw(1.6)) +
      c('f4', 41, 9, 1.4, sw(1.6)),
  ),
  mug: g(
    p('f1', 'M44 25H50Q58 25 58 33V43Q58 51 50 51H44V45H50Q52 45 52 43V33Q52 31 50 31H44Z') +
      r('f1', 10, 20, 36, 38, 4) +
      r('f2', 15, 30, 4, 22, 2, NS) +
      r('f2', 37, 30, 4, 22, 2, NS) +
      p('f2', 'M8 24Q4 16 12 13Q14 6 22 8Q28 3 35 8Q43 5 46 12Q53 14 49 22Q48 27 44 26Q43 33 39 32Q37 27 36 27H12Q8 28 8 24Z') +
      c('f2', 54, 8, 2.2, sw(1.8)) +
      c('f2', 58, 15, 1.4, sw(1.6)),
  ),
  wagonwheel: g(
    ring(8, p('', 'M32 32V6', sw(3)) + c('f4', 32, 6, 2.6, sw(2.5)), 32, 32, 22.5) +
      p('f4', annulusD(32, 32, 21, 16), 'fill-rule="evenodd"') +
      ring(8, p('', 'M32 26V16', sw(2.5)), 32, 32, 22.5) +
      c('f1', 32, 32, 6.5) +
      c('f2', 32, 32, 2.4, sw(2)),
  ),
  wagon: g(
    p('f2', 'M7 34Q2 14 13 11Q32 6 51 11Q62 14 57 34Z') +
      p('', 'M20 10Q17 22 20 34M32 8V34M44 10Q47 22 44 34', sw(2)) +
      r('f1', 5, 32, 54, 12, 1.5) +
      p('', 'M5 38H59', sw(2)) +
      wheelS(17, 47, 10) +
      wheelS(47, 47, 10),
  ),
  train: g(
    c('f2', 19, 9, 4.5, sw(2.5)) +
      c('f2', 28, 6, 3.5, sw(2.5)) +
      c('f2', 35, 4, 2.5, sw(2)) +
      p('f3', 'M11 14H25L22 20V26H14V20Z') +
      r('f3', 6, 25, 34, 15, 3) +
      r('f4', 22, 24, 4, 17, 1, sw(2)) +
      r('f1', 38, 12, 21, 30, 2) +
      r('f3', 36, 9, 25, 5, 2) +
      r('f2', 43, 17, 11, 9, 1) +
      r('f4', 3, 25, 6, 7, 1.5, sw(2.5)) +
      p('f4', 'M10 41H3L1 53H13Z') +
      p('', 'M5 44L4 51M9 44V51', sw(1.6)) +
      r('f3', 6, 40, 53, 4, 1) +
      wheelS(21, 50, 7, 'f1') +
      wheelS(35, 50, 7, 'f1') +
      wheelS(50, 48, 9, 'f1'),
  ),
  nugget: g(
    p('f4', 'M8 40Q6 26 18 23Q22 13 33 15Q45 12 49 22Q59 27 56 40Q54 52 40 53Q31 57 22 51Q9 51 8 40Z') +
      p('', 'M18 23Q24 30 33 28Q38 34 49 22M33 28L30 42M22 51Q26 44 30 42Q40 46 40 53', sw(2)) +
      hl(19, 33, 2, 4, 30) +
      hl(40, 23, 2.5, 1.5, -10) +
      twinkle(54, 12, 6.5) +
      twinkle(11, 13, 4.5),
  ),
  pickaxe: rot(
    32,
    g(
      r('f1', 29, 16, 6, 45, 2.5) +
        p('f2', 'M3 27Q30 3 61 27Q45 18 32 18Q19 18 3 27Z') +
        r('f3', 27, 13, 10, 10, 2) +
        hl(31, 38, 0.8, 10),
    ),
  ),
  goldpan: g(
    e('f3', 32, 40, 29, 16) +
      e('f2', 32, 42, 21, 10) +
      p('', 'M16 42Q24 37 32 41T48 41', sw(2)) +
      p('f4', 'M24 46Q24 42 28 43Q31 43 30 46Q28 49 24 46Z', sw(2)) +
      p('f4', 'M35 44Q36 40 40 41Q43 43 41 46Q37 48 35 44Z', sw(2)) +
      c('f4', 31, 49, 1.8, sw(1.6)) +
      twinkle(46, 16, 7, 'f4', 2.5) +
      twinkle(19, 19, 4.5, 'f4') +
      twinkle(32, 8, 3.5, 'f4'),
  ),
  moneybag: g(
    p('f2', 'M24 20Q8 32 10 46Q12 58 32 58Q52 58 54 46Q56 32 40 20Z') +
      p('f2', 'M24 21L18 8Q26 12 32 8Q38 12 46 8L40 21Z') +
      r('f4', 21, 17, 22, 6, 3) +
      p('', 'M38.5 32Q36.5 28.5 31.5 28.5Q25.5 28.5 25.5 33Q25.5 37 32 38Q38.5 39 38.5 44Q38.5 49 32 49Q26.5 49 24.5 45.5M32 24.5V53', sw(3.5)) +
      hl(16, 44, 1.8, 5, 15),
  ),
  coin: g(
    c('f4', 32, 32, 25) +
      c('', 32, 32, 19, sw(2.5)) +
      p('f2', starD(32, 33.5, 12, 5, 5), sw(2.5)) +
      hl(17, 26, 2, 5, 25),
  ),
  coins: g(
    p('f4', 'M12 47V52A20 6 0 0 0 52 52V47') +
      e('f4', 32, 47, 20, 6) +
      p('f4', 'M14 38V43A20 6 0 0 0 54 43V38', 'transform="translate(-2 0)"') +
      e('f4', 32, 38, 20, 6) +
      p('f4', 'M12 29V34A20 6 0 0 0 52 34V29') +
      e('f4', 32, 29, 20, 6) +
      p('f4', 'M16 20V25A20 6 0 0 0 56 25V20') +
      e('f4', 36, 20, 20, 6) +
      p('f2', starD(36, 20, 5, 2.2, 5, -90), `${sw(1.6)} transform="translate(0 0) scale(1 1)"`) +
      hl(24, 18.5, 3, 1.2, -5),
  ),
  dollar: g(
    rot(10, r('f2', 5, 14, 54, 32, 2)) +
      rot(
        -8,
        r('f2', 5, 18, 54, 32, 2) +
          r('', 10, 23, 44, 22, 1, sw(2)) +
          e('f4', 32, 34, 8, 9, sw(2.5)) +
          c('f3', 31, 35, 4, NS) +
          p('f3', 'M33 33L38 34.5L33 37Z', NS) +
          c('f4', 16, 28, 3, sw(2)) +
          c('f4', 48, 40, 3, sw(2)) +
          p('', 'M42 28H50M14 40H22', sw(2)),
      ),
  ),
  chips: g(chip(44, 'f3') + chip(36, 'f1') + chip(28, 'f4') + chip(20, 'f1') + c('f2', 32, 20, 6, sw(2)) + c('f1', 32, 20, 2.5, NS)),
  cards: g(
    rot(-14, r('f1', 10, 10, 26, 38, 3) + r('f2', 14, 14, 18, 30, 2, sw(2)) + p('f1', 'M23 22L27 29L23 36L19 29Z', sw(2)), 23, 29) +
      rot(12, r('f2', 27, 14, 26, 38, 3) + p('f1', heartD(40, 33, 8)) + p('f1', heartD(32, 21, 2.6), sw(1.6)), 40, 33),
  ),
  dice: g(
    p('f2', 'M32 7L55 18L32 29L9 18Z') +
      p('f1', 'M9 18L32 29V57L9 46Z') +
      p('f3', 'M55 18L32 29V57L55 46Z') +
      e('f1', 32, 18, 4, 2.2, sw(2)) +
      e('f2', 16, 30, 2, 2.6, NS) +
      e('f2', 25, 45, 2, 2.6, NS) +
      e('f2', 49, 28, 2, 2.6, NS) +
      e('f2', 43.5, 37.5, 2, 2.6, NS) +
      e('f2', 38, 47, 2, 2.6, NS),
  ),
  harmonica: g(
    rot(
      -14,
      r('f4', 6, 30, 52, 14, 2) +
        r('f2', 4, 26, 56, 7, 3) +
        r('f2', 4, 42, 56, 7, 3) +
        Array.from({ length: 8 }, (_, i) => r('f3', 8.5 + i * 6, 34.5, 4, 5, 1, NS)).join('') +
        hl(16, 29.5, 6, 1),
      32,
      38,
    ) +
      p('', 'M12 14V4L20 2V12', sw(2.5)) +
      e('f3', 10, 14, 2.6, 2, sw(1.5)) +
      e('f3', 18, 12, 2.6, 2, sw(1.5)),
  ),
  banjo: rot(
    35,
    g(
      r('f1', 29, 4, 6, 32, 1.5) +
        r('f3', 27, 1, 10, 9, 2) +
        p('', 'M27 3.5H23.5M27 7.5H23.5M37 3.5H40.5M37 7.5H40.5', sw(2.5)) +
        c('f4', 32, 45, 15) +
        c('f2', 32, 45, 11) +
        p('', 'M30.5 9V55M33.5 9V55', sw(1.2)) +
        r('f3', 27, 47, 10, 2.5, 0.5, sw(1.5)) +
        p('f3', 'M29 55H35L34 59H30Z', sw(1.5)),
    ),
  ),
  piano: g(
    r('f1', 7, 6, 50, 30, 2) +
      r('f2', 21, 11, 22, 14, 1, sw(2.5)) +
      p('', 'M24 15H40M24 19H40M24 23H34', sw(1.4)) +
      r('f1', 7, 44, 50, 14, 1.5) +
      r('f2', 4, 36, 56, 9, 1) +
      [10, 15, 24, 29, 34, 43, 48].map(x => r('f3', x, 36, 3.2, 5.5, 0.6, NS)).join('') +
      r('f1', 3, 32, 58, 5, 1.5) +
      c('f3', 15, 14, 1.8, NS) +
      p('', 'M15 14L12 11M15 14L18 12M15 14L13 18', sw(1.4)) +
      r('f4', 26, 53, 4, 3, 0.5, sw(1.5)) +
      r('f4', 34, 53, 4, 3, 0.5, sw(1.5)),
  ),
  bell: g(
    r('f1', 13, 4, 38, 7, 2) +
      p('', 'M20 11V16M44 11V16', sw(3)) +
      c('f3', 32, 53, 4.2) +
      p('f4', 'M20 45Q18 16 32 14Q46 16 44 45Z') +
      p('f4', 'M12 45Q32 41 52 45L54 51Q32 47 10 51Z') +
      hl(26, 28, 1.6, 7) +
      p('', 'M9 26L4 23M8 35H3M55 26L60 23M56 35H61', sw(2.5)),
  ),
  lantern: g(
    p('', 'M21 15Q19 3 32 3Q45 3 43 15', sw(3)) +
      p('f3', 'M20 17H44L38 9H26Z') +
      p('f2', 'M22 17Q15 26 17 35Q19 42 23 45H41Q45 42 47 35Q49 26 42 17Z') +
      p('f4', 'M32 23Q39 31 35.5 37Q32 40 28.5 37Q25 31 32 23Z') +
      p('f1', 'M32 30Q35 34 33.5 36.5Q32 38 30.5 36.5Q29 34 32 30Z', sw(1.5)) +
      p('', 'M25 18V44M39 18V44', sw(2)) +
      r('f1', 15, 44, 34, 13, 4) +
      c('f4', 50, 50, 2.4, sw(2)) +
      hl(20.5, 29, 1, 4.5) +
      p('', 'M8 22L4 20M8 31H3M56 22L60 20M56 31H61', sw(2)),
  ),
  campfire: g(
    rot(14, r('f3', 10, 46, 44, 8, 4), 32, 50) +
      rot(-14, r('f3', 10, 46, 44, 8, 4), 32, 50) +
      p('f1', 'M32 5C36 13 46 19 46 33C46 43 40 49 32 49C24 49 18 43 18 35C18 27 24 25 26 17C28 23 30 25 31 27C34 21 34 13 32 5Z') +
      p('f4', 'M32 29C35 34 39 37 38 42C37 46 35 48 32 48C29 48 26 45 27 41C27 37 31 35 32 29Z') +
      e('f2', 7, 56, 5, 3) +
      e('f2', 57, 56, 5, 3) +
      c('f4', 50, 13, 1.6, sw(2)) +
      c('f4', 14, 19, 1.6, sw(2)),
  ),
  beans: g(
    e('f2', 51, 12, 10, 4, 'transform="rotate(-50 51 12)"') +
      p('f2', 'M14 24V52A18 5 0 0 0 50 52V24') +
      p('f1', 'M14 30V46A18 5 0 0 0 50 46V30A18 5 0 0 1 14 30Z') +
      e('f4', 27.5, 40, 3.5, 2.4, sw(2)) +
      e('f4', 36.5, 41, 3.5, 2.4, sw(2)) +
      e('f4', 32, 24, 18, 5) +
      p('f4', 'M17 23Q19 14 32 13Q45 14 47 23Q32 27 17 23Z') +
      [
        [24, 19],
        [31, 17],
        [38, 19],
        [28, 23],
        [36, 23],
        [42, 22],
        [21, 23],
      ]
        .map(([x, y]) => e('f1', x, y, 2.2, 1.5, NS))
        .join('') +
      p('', 'M24 9Q22 6 24 3M32 8Q30 5 32 2', sw(2)),
  ),
  coffee: g(
    p('', 'M10 14Q7 10 10 6M15 12Q12 8 15 4', sw(2)) +
      p('f1', 'M21 30L9 17L7 21L18 40Z') +
      p('f1', 'M44 22H50Q57 22 57 30V40Q57 47 49 49L46 44Q51 42 51 38V30Q51 28 48 28H44Z') +
      p('f1', 'M17 53L22 19H42L47 53Q47 57 43 57H21Q17 57 17 53Z') +
      p('f1', 'M21 19Q21 11 32 11Q43 11 43 19Z') +
      c('f3', 32, 9, 3) +
      [
        [27, 28],
        [37, 33],
        [29, 42],
        [40, 48],
        [24, 50],
        [35, 22],
      ]
        .map(([x, y]) => c('f2', x, y, 1.6, NS))
        .join(''),
  ),
});

// ---------------------------------------------------------------- desert critters
Object.assign(ICONS, {
  skull: g(
    p('f2', HORN) +
      p('f2', HORN, MIRROR) +
      p('f2', 'M19 13Q32 7 45 13Q47 26 41 33Q38 45 37 53Q32 59 27 53Q26 45 23 33Q17 26 19 13Z') +
      p('f3', 'M22 22Q27 18 31 26Q28 31 23 28Z', sw(2)) +
      p('f3', 'M22 22Q27 18 31 26Q28 31 23 28Z', `${sw(2)} ${MIRROR}`) +
      e('f3', 29.5, 51, 1.4, 2.3, NS) +
      e('f3', 34.5, 51, 1.4, 2.3, NS) +
      p('', 'M33 11L30 17L34 20M28 38Q32 40 36 38', sw(2)),
  ),
  bone: rot(
    -35,
    g(c('f2', 12, 26, 6.5) + c('f2', 12, 38, 6.5) + c('f2', 52, 26, 6.5) + c('f2', 52, 38, 6.5)) +
      r('f2', 12, 28.5, 40, 7, 0, NS) +
      g(p('', 'M17.4 28.5H46.6M17.4 35.5H46.6')) +
      hl(30, 31, 9, 1),
  ),
  snake: g(
    [36, 31, 26].map((y, i) => e('f2', 57, y, 3.6 - i * 0.3, 2.6, sw(2))).join('') +
      p('', 'M61 24L63 22M61 30L63 30M53 24L51 22', sw(1.8)) +
      p(
        'f4',
        tubeD(t => {
          const th = t * Math.PI * 2 * 2.1;
          const rad = 24 - 15 * t;
          return [32 + rad * Math.cos(th), 43 + 0.5 * rad * Math.sin(th)];
        }, t => 4.6 - t * 0.8, 90),
      ) +
      p('f4', tubeD(bez([35, 47.5], [44, 38], [22, 30], [32, 18]), t => 3.8 - t * 0.6)) +
      [
        [14, 43],
        [24, 53],
        [44, 53],
        [52, 41],
        [38, 33],
        [22, 37],
      ]
        .map(([x, y]) => p('f3', `M${x - 2.4} ${y}L${x} ${y - 2}L${x + 2.4} ${y}L${x} ${y + 2}Z`, NS))
        .join('') +
      e('f4', 38, 15, 9.5, 6.5) +
      p('', 'M47 17L52 18L55 15.5M52 18L55 20.5', sw(2)) +
      eyeB(40, 12.5, 3, 0.8, 0.5, 2) +
      lid(40, 12.5, 3, 18, 'f4', 0.15, 2),
  ),
  scorpion: g(
    p('', 'M27 34L15 30L12 34M27 38L14 40L12 45M28 42L18 48L17 53M37 34L49 30L52 34M37 38L50 40L52 45M36 42L46 48L47 53', sw(2.5)) +
      p('', 'M27 28L19 19M37 28L45 19', sw(4)) +
      p('f1', 'M19 20Q8 18 8 9Q12 13 16 12Q13 5 20 5Q26 12 19 20Z') +
      p('f1', 'M19 20Q8 18 8 9Q12 13 16 12Q13 5 20 5Q26 12 19 20Z', MIRROR) +
      e('f1', 32, 38, 8.5, 12.5) +
      p('', 'M24.5 40H39.5M25.5 45H38.5', sw(2)) +
      [
        [33, 52, 4.6],
        [38.5, 56, 4.4],
        [45, 55, 4.2],
        [50, 50.5, 4],
        [52.5, 44.5, 3.8],
        [52, 38.5, 3.6],
      ]
        .map(([x, y, rr]) => c('f1', x, y, rr))
        .join('') +
      p('f3', 'M51 35Q50 27 43 29Q47 31 48 36Z', sw(2.5)) +
      eyeB(28.5, 31, 2.6, 0.3, 0.4, 2) +
      eyeB(35.5, 31, 2.6, -0.3, 0.4, 2) +
      lid(28.5, 31, 2.6, 15, 'f1', 0.1, 1.8) +
      lid(35.5, 31, 2.6, -15, 'f1', 0.1, 1.8),
  ),
  coyote: g(
    p('f4', 'M14 3L17 26L29 16Z') +
      p('f4', 'M50 3L47 26L35 16Z') +
      p('f1', 'M17 9L19 21L24 17Z', NS) +
      p('f1', 'M47 9L45 21L40 17Z', NS) +
      p('f4', 'M16 26Q15 14 32 14Q49 14 48 26Q50 35 42 42L38 55Q32 59 26 55L22 42Q14 35 16 26Z') +
      p('f2', 'M24 37Q32 33 40 37L37.5 53Q32 57 26.5 53Z') +
      e('f3', 32, 52, 4.5, 3.2) +
      eyeB(25, 28, 4.2, 1, 0.6) +
      eyeB(39, 28, 4.2, 1, 0.6) +
      lid(25, 28, 4.2, 10, 'f4', 0.12) +
      lid(39, 28, 4.2, -10, 'f4', 0.12) +
      p('', 'M22 44Q27 49 32 47Q37 49 42 44', sw(2)) +
      p('f2', 'M27 46.5L28 49L29.5 47M34.5 47L36 49L37 46.5', sw(1.5)),
  ),
  horse: g(
    p('f1', 'M38 8Q46 10 50 22Q54 36 54 58H30Q32 48 30 44Q22 46 14 48Q6 48 6 41Q6 35 11 31L28 14Q32 9 38 8Z') +
      p('f3', 'M40 7Q53 11 57 26Q61 42 57 58H51Q54 42 50 28Q47 18 39 12Z') +
      p('f1', 'M35 12L36 1L43 9Z') +
      p('f2', 'M27 17Q19 26 12 35L16 38Q24 29 30 20Z', NS) +
      e('f3', 11, 40.5, 1.8, 2.3, NS) +
      p('f2', 'M8 45H18L17 48H9Z', sw(2)) +
      p('', 'M13 45V48', sw(1.5)) +
      eyeB(32, 23, 3.8, -0.9, 0.4) +
      lid(32, 23, 3.8, -6, 'f1', 0.05) +
      p('', 'M22 23L31 41M16 37L33 33', `${sw(2)} stroke-dasharray="3 2"`),
  ),
  bull: g(
    p('f2', 'M19 22Q7 22 4 7Q12 15 22 15Z') +
      p('f2', 'M45 22Q57 22 60 7Q52 15 42 15Z') +
      p('f3', 'M18 25L6 29L18 33Z') +
      p('f3', 'M46 25L58 29L46 33Z') +
      p('f3', 'M18 21Q18 14 26 14H38Q46 14 46 21L44 41H20Z') +
      e('f2', 32, 44, 13, 9) +
      e('f3', 27, 44, 1.7, 2.5, NS) +
      e('f3', 37, 44, 1.7, 2.5, NS) +
      p('f4', annulusD(32, 53, 4.5, 2.2), `${sw(2)} fill-rule="evenodd"`) +
      eyeB(25.5, 28, 3.4, 0.4, 0.6, 2) +
      eyeB(38.5, 28, 3.4, -0.4, 0.6, 2) +
      lid(25.5, 28, 3.4, 22, 'f3', 0.05, 2) +
      lid(38.5, 28, 3.4, -22, 'f3', 0.05, 2) +
      c('f2', 10, 52, 3.4, sw(2)) +
      c('f2', 5, 56, 2.2, sw(2)) +
      c('f2', 54, 52, 3.4, sw(2)) +
      c('f2', 59, 56, 2.2, sw(2)),
  ),
  pig: g(
    p('f1', 'M15 20L12 4L27 12Z') +
      p('f1', 'M49 20L52 4L37 12Z') +
      e('f1', 32, 34, 22, 20) +
      e('f2', 32, 41, 9.5, 7) +
      e('f3', 28.5, 41, 1.7, 2.6, NS) +
      e('f3', 35.5, 41, 1.7, 2.6, NS) +
      eyeB(24, 28, 4, 0.5, 0.5) +
      eyeB(40, 28, 4, -0.5, 0.5) +
      e('f2', 17, 40, 3, 1.8, NS) +
      e('f2', 47, 40, 3, 1.8, NS) +
      p('', 'M28 51Q32 54 36 51', sw(2.5)),
  ),
  frog: g(
    p('f1', 'M10 52Q8 30 32 28Q56 30 54 52Q44 56 32 56Q20 56 10 52Z') +
      c('f1', 20, 22, 9) +
      c('f1', 44, 22, 9) +
      eyeB(20, 21, 5.4, 0.6, 0.4) +
      eyeB(44, 21, 5.4, -0.6, 0.4) +
      p('', 'M18 38Q32 48 46 38', sw(3)) +
      e('f2', 32, 49, 9, 4.5) +
      p('', 'M8 56L14 50M56 56L50 50', sw(2.5)),
  ),
  fish: g(
    p('f1', 'M48 32L60 20Q56 32 60 44Z') +
      p('f1', 'M24 22L32 11L41 23Z', sw(2.5)) +
      p('f1', 'M6 32Q16 18 34 20Q48 22 50 32Q48 42 34 44Q16 46 6 32Z') +
      p('f2', 'M10 36Q22 44 36 42Q46 40 48 35Q34 40 10 36Z', NS) +
      p('f1', 'M30 40L33 50L40 41Z', sw(2.5)) +
      p('', 'M22 25Q26 32 22 39', sw(2.5)) +
      eyeB(15, 28, 3.8, -0.7, 0.2) +
      p('', 'M8 34Q2 37 3 45M8 31Q2 28 3 21', sw(2)),
  ),
});

// ---------------------------------------------------------------- sky & landscape
Object.assign(ICONS, {
  sun: g(
    p('f4', starD(32, 32, 27, 17, 12)) +
      c('f1', 32, 32, 14) +
      p('f3', 'M20 28Q20 25 26 25Q31 25 31 28Q31 33 26 33Q21 33 20 28ZM33 28Q33 25 38 25Q44 25 44 28Q43 33 38 33Q33 33 33 28Z', sw(1.5)) +
      p('', 'M31 27H33M26 39Q32 43 38 39', sw(2)) +
      hl(24, 27, 1.2, 1.2),
  ),
  moon: g(
    p('f4', 'M27.6 8.5A24 24 0 1 0 54 41A20 20 0 0 1 27.6 8.5Z') +
      c('f2', 22, 40, 2.2, sw(2)) +
      c('f2', 30, 49, 1.6, sw(2)),
  ),
  cloud: g(
    p('f2', 'M12 44Q4 44 6 36Q8 30 15 31Q14 21 24 20Q28 11 38 14Q47 12 49 22Q58 22 58 31Q59 40 50 42Q50 46 44 46H16Q12 46 12 44Z') +
      p('', 'M18 38Q14 33 19 31Q24 30 23 36M34 26Q32 20 38 20Q43 21 41 27M44 38Q48 34 52 36') +
      p('', 'M8 52H30M38 52H52', sw(2.5)),
  ),
  lightning: g(p('f4', 'M38 6L14 36H29L22 58L50 26H35L46 6Z') + hl(33, 17, 1.6, 6, 37)),
  tornado: g(
    [6, 5, 4, 3, 2, 1, 0]
      .map(i => {
        const y = 10 + i * 7.3;
        const rx = 26 - i * 3.5;
        const cx = 32 + 4 * Math.sin(i * 0.95);
        return e('f2', cx, y, rx, Math.max(2.6, 5 - i * 0.35)) + p('', `M${n2(cx - rx * 0.6)} ${n2(y + 1)}Q${n2(cx)} ${n2(y + 3)} ${n2(cx + rx * 0.5)} ${n2(y)}`, sw(1.6));
      })
      .join('') +
      rot(25, r('f1', 49, 40, 11, 4, 1, sw(2)), 54, 42) +
      c('f4', 11, 34, 4, sw(2.5)) +
      p('f1', 'M14 33L19 31L15 36Z', sw(1.5)) +
      p('', 'M4 24Q8 20 12 24M50 18Q55 14 60 18', sw(2)),
  ),
  mesa: g(
    c('f4', 47, 15, 8) +
      p('f1', 'M3 56L13 34L17 22H45L49 34L61 56Z') +
      p('f3', 'M41 22H45L49 34L61 56H46Q46 38 41 22Z', NS) +
      p('', 'M3 56L13 34L17 22H45L49 34L61 56', sw(3)) +
      p('', 'M15 29H47M11 40H38', sw(2)) +
      p('f4', 'M2 56Q32 51 62 56V59H2Z') +
      p('', 'M12 57V49Q12 47 14 47Q16 47 16 49V57M12 52H10V49', sw(2.5)),
  ),
  windmill: g(
    p('', 'M23 58L30 24M41 58L34 24', sw(3)) +
      p('', 'M25.5 50H38.5M27.5 41H36.5M29 33H35M25.5 50L36.5 41M38.5 50L27.5 41M27.5 41L35 33M36.5 41L29 33', sw(1.8)) +
      p('f1', 'M34 18L50 17L58 10V26L50 21L34 22Z') +
      ring(12, p('f2', 'M32 20L29.4 5.5Q32 3.6 34.6 5.5Z', sw(2)), 32, 20) +
      c('f3', 32, 20, 3.5),
  ),
  watertower: g(
    p('', 'M18 38L13 58M46 38L51 58M27 38L26 58M37 38L38 58', sw(3)) +
      p('', 'M15 50H49M16 44L48 52M48 44L16 52', sw(1.8)) +
      r('f1', 14, 16, 36, 22, 2) +
      p('', 'M20 18V38M26 18V38M32 18V38M38 18V38M44 18V38', sw(1.4)) +
      r('f3', 12.5, 20, 39, 3.5, 1, sw(2)) +
      r('f3', 12.5, 31, 39, 3.5, 1, sw(2)) +
      p('f3', 'M9 18L32 4L55 18Z') +
      p('', 'M50 28H57V38', sw(3)) +
      c('f2', 57, 43, 1.6, sw(1.5)),
  ),
});

// ---------------------------------------------------------------- town & tools
Object.assign(ICONS, {
  barrel: g(
    p('f1', 'M14 11Q9 32 14 53Q32 59 50 53Q55 32 50 11Z') +
      p('', 'M22 14Q19 32 22 55M32 15V57M42 14Q45 32 42 55', sw(2)) +
      p('f3', 'M11.6 19Q32 25 52.4 19L53.2 24.5Q32 30.5 10.8 24.5Z', sw(2)) +
      p('f3', 'M10.8 40Q32 46 53.2 40L52.4 45.5Q32 51.5 11.6 45.5Z', sw(2)) +
      e('f4', 32, 11, 18, 5) +
      c('f3', 38, 11, 1.6, NS) +
      hl(16, 33, 1.3, 5),
  ),
  crate: g(
    r('f4', 8, 9, 48, 47, 2) +
      p('', 'M15 26H49M15 38H49', sw(1.6)) +
      p('f1', 'M15 44L43 16H49V21L21 49H15Z', sw(2.5)) +
      r('f4', 8, 9, 48, 7, 1.5) +
      r('f4', 8, 49, 48, 7, 1.5) +
      r('f4', 8, 9, 7, 47, 1.5) +
      r('f4', 49, 9, 7, 47, 1.5) +
      [
        [11.5, 12.5],
        [52.5, 12.5],
        [11.5, 52.5],
        [52.5, 52.5],
      ]
        .map(([x, y]) => c('f3', x, y, 1.2, NS))
        .join(''),
  ),
  anvil: g(
    p('f1', 'M20 44H44L46 58H18Z') +
      p('', 'M24 50H40', sw(1.6)) +
      p('f3', 'M4 15H44Q58 15 61 21Q53 22 47 27L41 29V37H47V44H17V37H23V29Q14 27 11 21H4Z') +
      hl(26, 17.5, 15, 1) +
      twinkle(10, 7, 4.5, 'f4') +
      twinkle(53, 7, 3.5, 'f4') +
      c('f4', 21, 6, 1.4, sw(1.5)),
  ),
  hammer: rot(
    -35,
    g(
      r('f1', 28.5, 22, 7, 39, 3) +
        r('f3', 27.5, 46, 9, 14, 3) +
        p('f2', 'M38 13Q50 12 58 4Q59 16 51 22Q45 26 38 25Z') +
        r('f2', 10, 11, 29, 15, 2) +
        r('f2', 4, 12.5, 7, 12, 1.5) +
        p('', 'M46 19L57 8', sw(2)) +
        hl(22, 14.5, 8, 1),
    ),
  ),
  key: rot(
    -40,
    g(
      p('f4', 'M23 29H58V35H55V44H50V35H47V41H42V35H23Z') +
        c('f4', 15, 32, 10) +
        c('f2', 15, 32, 4) +
        hl(12, 26, 1.5, 3, 60),
    ),
  ),
  jail: g(
    r('f3', 7, 7, 50, 50, 3) +
      c('f1', 32, 33, 11) +
      eyeB(28.5, 30, 3.4, 0.4, 0.7, 2) +
      eyeB(35.5, 30, 3.4, -0.4, 0.7, 2) +
      lid(28.5, 30, 3.4, 12, 'f1', 0.1, 2) +
      lid(35.5, 30, 3.4, -12, 'f1', 0.1, 2) +
      p('f4', 'M27 38Q32 35 37 38Q37 42 32 42Q27 42 27 38Z', sw(2)) +
      [11, 20, 40, 49].map(x => r('f2', x, 7, 4.5, 50, 0, sw(2.5))).join('') +
      r('f2', 7, 14, 50, 4.5, 0, sw(2.5)) +
      r('f2', 7, 47, 50, 4.5, 0, sw(2.5)) +
      e('f1', 22.5, 39, 3.2, 4) +
      e('f1', 41.5, 39, 3.2, 4) +
      r('', 7, 7, 50, 50, 3),
  ),
  handcuffs: rot(
    -12,
    g(
      p('f4', ellRingD(28.5, 22, 4.5, 3, 1.8), `${sw(2)} fill-rule="evenodd"`) +
        p('f4', ellRingD(35.5, 22, 4.5, 3, 1.8), `${sw(2)} fill-rule="evenodd"`) +
        p('f2', annulusD(17, 39, 13, 7.5), 'fill-rule="evenodd"') +
        p('f2', annulusD(47, 39, 13, 7.5), 'fill-rule="evenodd"') +
        r('f3', 11, 21, 13, 9, 2) +
        r('f3', 40, 21, 13, 9, 2) +
        c('f2', 17.5, 25.5, 1.4, NS) +
        c('f2', 46.5, 25.5, 1.4, NS) +
        hl(9, 42, 1.2, 3.5, 20),
    ),
    32,
    34,
  ),
  pocketwatch: g(
    p('', 'M36 10Q52 4 56 18Q59 30 51 36', `${sw(3)} stroke-dasharray="3 2.5"`) +
      c('', 30, 9, 4.2, sw(3)) +
      r('f4', 26.5, 13, 7, 6, 1.5) +
      c('f4', 30, 38, 19) +
      c('f2', 30, 38, 14.5) +
      ring(12, p('', 'M30 26V28', sw(2)), 30, 38) +
      p('', 'M30 38V29M30 38L37 41', sw(2.5)) +
      c('f3', 30, 38, 1.6, NS) +
      hl(19, 31, 1.4, 4, 30),
  ),
  hourglass: g(
    p('', 'M15 12V52M49 12V52', sw(3.5)) +
      p('f2', 'M19 12H45Q45 26 34 32Q45 38 45 52H19Q19 38 30 32Q19 26 19 12Z') +
      p('f4', 'M23 21H41Q40 27 32 31Q24 27 23 21Z', sw(2.5)) +
      p('f4', 'M21 52Q24 42 32 40Q40 42 43 52Z', sw(2.5)) +
      p('', 'M32 32V41', sw(1.6)) +
      r('f3', 10, 6, 44, 7, 2) +
      r('f3', 10, 51, 44, 7, 2),
  ),
  map: g(
    p('f2', 'M7 14L22 10V50L7 54Z') +
      p('f4', 'M22 10L42 14V54L22 50Z') +
      p('f2', 'M42 14L57 10V50L42 54Z') +
      p('', 'M12 46Q18 32 28 38Q38 44 42 30Q44 24 46 22', `${sw(2.5)} stroke-dasharray="3 4"`) +
      p('', 'M45 15L53 23M53 15L45 23', sw(3.5)) +
      p('f3', 'M12 30L16 22L20 30Z', sw(2)) +
      p('', 'M30 22V28M27 25H33', sw(2)),
  ),
  compass: g(
    c('f4', 32, 33, 25) +
      c('f2', 32, 33, 19) +
      p('', 'M32 15V19M32 47V51M14 33H18M46 33H50', sw(2.5)) +
      rot(30, p('f1', 'M27 33L32 16L37 33Z', sw(2.5)) + p('f3', 'M27 33L32 50L37 33Z', sw(2.5)), 32, 33) +
      c('f2', 32, 33, 2.4, sw(2)) +
      c('f4', 32, 6, 3, sw(2.5)),
  ),
  spyglass: rot(
    -30,
    g(
      r('f3', 2, 27, 7, 10, 2) +
        r('f1', 8, 25.5, 17, 13, 2) +
        r('f4', 24, 24, 16, 16, 2) +
        r('f1', 39, 22, 17, 20, 2) +
        r('f4', 55, 20, 6, 24, 2) +
        hl(46, 26, 6, 1) +
        hl(30, 27.5, 4, 0.9),
    ) + g(twinkle(56, 12, 5)),
  ),
  book: g(
    r('f2', 17, 10, 38, 47, 2) +
      r('f1', 12, 7, 38, 47, 2) +
      r('f4', 22, 16, 22, 14, 1.5, sw(2.5)) +
      p('', 'M18 9V52', sw(2.5)) +
      p('f1', starD(33, 23.5, 5, 2.2, 5), sw(1.6)) +
      p('', 'M24 38H42M24 43H38', sw(2)),
  ),
  scroll: g(
    r('f2', 14, 15, 36, 34) +
      p('', 'M20 22H44M20 28H40M20 34H44M20 40H32', sw(2.5)) +
      c('f1', 40, 42, 3.6, sw(2.5)) +
      r('f4', 6, 11, 10, 42, 5) +
      r('f4', 48, 11, 10, 42, 5) +
      e('f3', 11, 11, 5, 2, sw(2.5)) +
      e('f3', 53, 11, 5, 2, sw(2.5)),
  ),
  telegram: g(
    r('f2', 6, 16, 52, 34, 2) +
      p('', 'M6 48L26 32M58 48L38 32', sw(2.5)) +
      p('f2', 'M6 17L32 37L58 17Z') +
      p('f4', 'M38 4L22 30H31L25 52L46 23H36L44 4Z', sw(2.5)),
  ),
  ticket: rot(
    -15,
    g(
      p('f4', 'M7 20H57V28A4 4 0 0 0 57 36V44H7V36A4 4 0 0 0 7 28Z') +
        p('', 'M42 22V42', `${sw(2.5)} stroke-dasharray="2.5 4"`) +
        p('f1', starD(24, 32, 8.5, 3.6, 5), sw(2.5)) +
        p('', 'M47 27H52M47 32H52M47 37H52', sw(2)),
    ),
  ),
  shield: g(
    p('f4', 'M32 6L54 12Q54 40 32 58Q10 40 10 12Z') +
      p('f1', 'M32 12.5L48 16.5Q47.5 37 32 51Q16.5 37 16 16.5Z', sw(2.5)) +
      p('f2', starD(32, 31, 9, 3.8, 5), sw(2.5)),
  ),
  heart: g(p('f1', heartD(32, 33, 25)) + hl(20, 22, 3, 5.5, 35)),
  crown: g(
    p('f4', 'M9 48L8 18L21 31L32 12L43 31L56 18L55 48Z') +
      r('f4', 8, 44, 48, 10, 2) +
      c('f4', 8, 16, 3) +
      c('f4', 32, 10, 3) +
      c('f4', 56, 16, 3) +
      c('f1', 20, 49, 2.6, sw(2.5)) +
      c('f1', 44, 49, 2.6, sw(2.5)) +
      p('f2', 'M32 45L35 49L32 53L29 49Z', sw(2.5)),
  ),
});

// ---------------------------------------------------------------- vanity, vittles & oddments
Object.assign(ICONS, {
  bandana: g(
    p('f1', 'M10 15L2 8L5 4L14 12Z') +
      p('f1', 'M10 15L2 8L5 4L14 12Z', MIRROR) +
      p('f1', 'M6 12Q32 18 58 12L35 55Q32 59 29 55Z') +
      p('', 'M13 18Q32 23 51 18L32 50Z', `${sw(1.6)} stroke-dasharray="2.5 3"`) +
      c('f2', 32, 30, 2.8, NS) +
      c('f2', 24, 23.5, 1.8, NS) +
      c('f2', 40, 23.5, 1.8, NS) +
      c('f2', 32, 41, 1.8, NS) +
      p('f2', 'M45 16Q49 20 45 22Q42 20 45 16Z', NS) +
      p('f2', 'M19 16Q15 20 19 22Q22 20 19 16Z', NS),
  ),
  mustache: g(
    p('f1', 'M25 30Q24 10 32 7Q40 10 39 30Q32 35 25 30Z') +
      hl(29, 15, 1.4, 4, 10) +
      p('f3', tp(MUSTACHE, 0, 10)) +
      hl(19, 39.5, 4, 1.2, 10) +
      hl(45, 39.5, 4, 1.2, -10),
  ),
  monocle: g(
    p('', 'M14 7Q26 1 38 7', sw(4)) +
      p('', 'M41 41Q48 54 58 57', `${sw(3)} stroke-dasharray="3 2.5"`) +
      c('f4', 28, 28, 18.5) +
      c('f2', 28, 28, 13.5) +
      p('', 'M19 24Q21 19 26 18M33 37Q36 35 37 32', sw(2.5)) +
      c('f4', 41.5, 41.5, 3, sw(2.5)),
  ),
  glasses: g(
    p('', 'M7 30L2 23M57 30L62 23', sw(3)) +
      p('', 'M28 31Q32 26 36 31', sw(3)) +
      c('f2', 17.5, 35, 11.5) +
      c('f2', 46.5, 35, 11.5) +
      p('', 'M11 33Q12 28 17 27M40 33Q41 28 46 27', sw(2.2)),
  ),
  bubbles: g(
    c('f2', 24, 38, 15) +
      c('f2', 45, 21, 9.5) +
      c('f2', 48, 46, 7) +
      c('f2', 16, 12, 5.5) +
      p('', 'M15 33Q16 27 22 25M40 18Q41 15 44 14', sw(2.5)) +
      hl(46, 43.5, 1.5, 1.5) +
      hl(14.5, 10.5, 1.2, 1.2),
  ),
  bathtub: g(
    p('', 'M12 31V14Q12 9 17 9H22V13', sw(3)) +
      c('f2', 19, 27, 6) +
      c('f2', 29, 23, 7) +
      c('f2', 49, 26, 6) +
      c('f4', 40, 21, 5.5) +
      p('f1', 'M44.5 19L50 20.5L45 23Z', sw(2)) +
      c('f3', 41.5, 19.5, 1.1, NS) +
      p('f4', 'M14 50L10 58H19Z', sw(2.5)) +
      p('f4', 'M50 50L54 58H45Z', sw(2.5)) +
      p('f2', 'M6 32H58Q58 50 44 52H20Q6 50 6 32Z') +
      r('f2', 3, 29, 58, 6, 3) +
      hl(13, 40, 1.4, 4, -20),
  ),
  pie: g(
    p('', 'M22 18Q18 14 22 10Q26 6 22 2M32 16Q28 12 32 8M42 18Q38 14 42 10Q46 6 42 3', sw(2.5)) +
      p('f3', 'M5 34L11 48Q32 56 53 48L59 34Z') +
      e('f4', 32, 34, 27, 11) +
      Array.from({ length: 18 }, (_, i) => {
        const a = (i * 20 * Math.PI) / 180;
        return c('f4', 32 + 24.5 * Math.cos(a), 34 + 9.4 * Math.sin(a), 2.4, sw(2));
      }).join('') +
      e('f4', 32, 34, 20, 7, NS) +
      p('', 'M23 32L27 36M32 30V36M41 32L37 36', sw(2.5)),
  ),
  apple: g(
    p('f1', 'M32 18Q22 10 14 18Q6 28 10 42Q16 58 32 54Q48 58 54 42Q58 28 50 18Q42 10 32 18Z') +
      p('', 'M32 18Q31 10 35 5', sw(3)) +
      p('f4', 'M35 12Q40 4 49 6Q45 14 35 12Z', sw(2.5)) +
      hl(19, 28, 2.5, 5.5, 20),
  ),
  pepper: g(
    p('f1', 'M18 18Q30 14 35 22Q42 36 55 50Q60 57 52 57Q30 52 20 36Q13 25 18 18Z') +
      p('f4', 'M13 21Q14 12 23 12Q31 13 32 19Q25 16 21 23Q17 19 13 21Z') +
      p('', 'M22 13Q20 6 26 3', sw(3)) +
      hl(27, 31, 1.6, 6, -40) +
      p('', 'M60 44Q63 40 60 36M48 61Q53 63 57 61', sw(2)),
  ),
  tooth: g(
    p('f4', 'M14 19Q14 6 24 8Q32 12 40 8Q50 6 50 19Q50 31 46 39L42 55Q38 59 36 53L32 39L28 53Q26 59 22 55L18 39Q14 31 14 19Z') +
      p('', 'M24 12Q28 16 32 13', sw(2)) +
      hl(21, 22, 2, 6, 10) +
      twinkle(52, 8, 6.5) +
      twinkle(10, 44, 4),
  ),
  eye: g(
    p('', 'M14 18L11 13M23 13L22 8M32 12V7M41 13L42 8M50 18L53 13', sw(2.5)) +
      p('f2', 'M6 33Q32 8 58 33Q32 58 6 33Z') +
      c('f1', 32, 33, 11) +
      c('f3', 32, 33, 5) +
      c('f2', 35.5, 29.5, 2.2, NS),
  ),
  hand: g(
    rot(-32, r('f2', 8, 26, 9, 26, 4.5), 16, 48) +
      r('f2', 41, 20, 8, 26, 4) +
      r('f2', 33, 9, 8.5, 34, 4.25) +
      r('f2', 24.5, 7, 8.5, 36, 4.25) +
      r('f2', 16, 11, 8.5, 34, 4.25) +
      p('f2', 'M16.5 33H48.5V44Q48.5 58 34 58H29Q21 58 18 51L16.5 40Z', NS) +
      p('', 'M48.5 33V44Q48.5 58 34 58H29Q22 58 19 53M16.5 33V37', 'fill="none"') +
      p('', 'M26 40V48M32.5 40V48M39 40V48', sw(2)),
  ),
  fist: g(
    p('', 'M4 12L10 17M2 28H9M58 12L52 17M62 28H55M32 2V8', sw(2.5)) +
      r('f1', 19, 46, 26, 12, 3) +
      r('f2', 14, 20, 36, 30, 8) +
      r('f2', 14, 16, 10, 16, 5) +
      r('f2', 23, 13, 10, 18, 5) +
      r('f2', 32, 13, 10, 18, 5) +
      r('f2', 41, 16, 9, 16, 4.5) +
      p('f2', 'M14 34Q22 28 34 34Q38 40 32 41H18Q14 40 14 34Z'),
  ),
  chain: rot(
    -42,
    g(
      p('f4', 'M4 32a10 7 0 1 0 20 0a10 7 0 1 0 -20 0ZM8.5 32a5.5 2.4 0 1 0 11 0a5.5 2.4 0 1 0 -11 0Z', 'fill-rule="evenodd"') +
        p('f4', 'M38 32a10 7 0 1 0 20 0a10 7 0 1 0 -20 0ZM42.5 32a5.5 2.4 0 1 0 11 0a5.5 2.4 0 1 0 -11 0Z', 'fill-rule="evenodd"') +
        r('f4', 17, 28.5, 28, 7, 3.5) +
        p('', 'M21 32H41', sw(2)) +
        p('', 'M58 32H61M3 32H1', sw(3)),
    ),
  ),
  rope: g(
    [46, 38, 30]
      .map(
        (y, i) =>
          p('f4', ellRingD(31, y, 25 - i * 2, 10 - i * 0.5, 5.5), 'fill-rule="evenodd"') +
          e('', 31, y, 22.25 - i * 2, 7.25 - i * 0.5, `${sw(1.5)} stroke-dasharray="2 3"`),
      )
      .join('') +
      p('f4', tubeD(bez([50, 32], [62, 24], [48, 12], [58, 5]), () => 2.75)) +
      p('', 'M50 32C62 24 48 12 58 5', `${sw(1.5)} stroke-dasharray="2 3"`),
  ),
  scissors: g(
    p('f2', 'M28 38L48 6L52 9L34 40Z') +
      p('f2', 'M36 38L16 6L12 9L30 40Z') +
      p('f1', annulusD(22, 48, 9, 4.5), 'fill-rule="evenodd"') +
      p('f1', annulusD(42, 48, 9, 4.5), 'fill-rule="evenodd"') +
      c('f4', 32, 33, 2.4, sw(2)),
  ),
  needle: g(
    r('f4', 8, 13, 26, 5, 2) +
      r('f1', 11, 18, 20, 28) +
      r('f4', 8, 46, 26, 5, 2) +
      p('', 'M11 24H31M11 30H31M11 36H31M11 42H31', sw(2)) +
      p('f2', 'M55 6Q58 7 57 10L32 55L29 57L30 53Z') +
      e('f3', 54, 10, 0.8, 2.4, `${NS} transform="rotate(30 54 10)"`) +
      p('', 'M31 26Q46 22 54 10Q58 22 46 30', sw(2)),
  ),
  magnet: g(
    p('f1', 'M10 50V28A22 22 0 0 1 54 28V50H42V28A10 10 0 0 0 22 28V50Z') +
      r('f2', 10, 43, 12, 8) +
      r('f2', 42, 43, 12, 8) +
      p('', 'M9 56L5 61M16 56V62M48 56V62M55 56L59 61', sw(2.5)) +
      hl(17, 25, 1.4, 5, 35),
  ),
  mirror: g(
    p('f1', 'M26 52Q22 58 18 56M38 52Q42 58 46 56', `fill="none" ${sw(2.5)}`) +
      p('f3', 'M27 40L24 52H40L37 40Z') +
      r('f3', 12, 51, 40, 6, 2) +
      c('f4', 32, 25, 19) +
      c('f2', 32, 25, 13.5) +
      p('', 'M24 22L30 16M26 28L35 19', sw(2.5)),
  ),
  crystal: g(
    p('f3', 'M18 44Q32 50 46 44L50 57H14Z') +
      c('f2', 32, 26, 19) +
      p('f4', 'M32 15Q33 25 41 26Q33 27 32 37Q31 27 23 26Q31 25 32 15Z', sw(2.5)) +
      p('', 'M19 22Q21 14 28 11', sw(2.5)) +
      p('f1', 'M22 50H42', sw(3)),
  ),
  tonic: g(
    c('f2', 46, 10, 2.4, sw(2)) +
      c('f2', 50, 4, 1.6, sw(1.6)) +
      p('f1', 'M26 9H38V20Q52 26 52 40Q52 57 32 57Q12 57 12 40Q12 26 26 20Z') +
      r('f4', 24.5, 3, 15, 8, 2.5) +
      r('f2', 17, 33, 30, 15, 2) +
      p('', 'M21 44Q24 37 28 41Q32 45 36 39Q39 35 43 38', sw(2.5)) +
      c('f3', 43.5, 37.8, 1.6, NS) +
      hl(20, 27, 1.3, 3.5, 40),
  ),
  jug: g(
    p('f2', 'M42 18Q58 14 58 28Q58 41 46 41L46 36Q53 36 53 28Q53 21 42 23Z') +
      p('f2', 'M25 12H39V16Q52 22 52 38Q52 56 32 57Q12 56 12 38Q12 22 25 16Z') +
      p('f1', 'M25 12H39V16Q49 21 51 30Q32 35 13 30Q15 21 25 16Z') +
      r('f4', 25, 5, 14, 9, 2) +
      p('', 'M18 39L24 48M24 39L18 48M29 39L35 48M35 39L29 48M40 39L46 48M46 39L40 48', sw(3)),
  ),
  cauldron: g(
    c('f1', 22, 18, 4.5) +
      c('f1', 35, 13, 5.5) +
      c('f1', 44, 19, 3.5) +
      p('', 'M18 51L15 58M46 51L49 58', sw(3.5)) +
      p('f3', 'M10 26H54Q56 50 40 54H24Q8 50 10 26Z') +
      r('f4', 6, 22, 52, 7, 3.5) +
      p('', 'M8 34Q3 34 4 40M56 34Q61 34 60 40', sw(3)) +
      p('f2', 'M16 34Q16 42 22 47', sw(2.5)),
  ),
  spiral: g(c('f1', 32, 32, 25) + p('', spiralD(32, 32, 1, 20, 3, 0), sw(3.5))),
  spark: g(
    p('f4', 'M32 6Q35 29 58 32Q35 35 32 58Q29 35 6 32Q29 29 32 6Z') +
      p('f2', 'M50 8Q51 13 56 14Q51 15 50 20Q49 15 44 14Q49 13 50 8Z', sw(2)),
  ),
  clover: g(
    p('', 'M32 34Q38 46 34 58', sw(3.5)) +
      ring(4, p('f1', 'M32 31C24 26 18 18 22 12C25 8 30 10 32 14C34 10 39 8 42 12C46 18 40 26 32 31Z') + hl(32, 20, 1.2, 4), 32, 32, 45),
  ),
  umbrella: g(
    p('', 'M32 32V54Q32 58 27 58', sw(3.5)) +
      p('f1', 'M6 32Q9 12 32 8Q55 12 58 32Q51 28 45 32Q38 28 32 32Q26 28 19 32Q13 28 6 32Z') +
      p('f2', 'M20 14Q32 8 44 14L41 17Q32 13 23 17Z', sw(2.5)) +
      p('', 'M32 8L19 32M32 8L32 32M32 8L45 32M32 8L10 28M32 8L54 28', sw(2)) +
      c('f3', 32, 7, 2.6, sw(2)),
  ),
  broom: rot(
    28,
    g(
      r('f3', 30, 3, 5, 32, 2) +
        p('f4', 'M27 38H38L48 59H17Z') +
        p('', 'M30 42L26 58M33 42L32 58M36 42L39 58M28 46L21 57M38 46L44 57', sw(2)) +
        r('f1', 26, 33, 13, 6, 2),
    ),
  ),
  shovel: rot(
    35,
    g(
      r('f1', 29.5, 8, 5, 30, 2) +
        r('f3', 24, 3, 16, 6, 3) +
        p('f2', 'M20 36H44V48Q44 56 32 60Q20 56 20 48Z') +
        r('f3', 28, 32, 8, 7, 1.5) +
        hl(25, 45, 1.2, 5),
    ),
  ),
  plunger: g(
    r('f3', 14, 5, 36, 6, 3) +
      r('f2', 29, 10, 6, 18, 1) +
      p('', 'M54 46Q63 46 61 54Q59 61 49 59', sw(2.5)) +
      r('f1', 10, 29, 44, 28, 3) +
      r('f4', 7, 25, 50, 7, 2) +
      p('f4', 'M35 36L24 47H31L28 54L40 42H33L37 36Z', sw(2)) +
      c('f4', 49, 46, 2.2, sw(2)),
  ),
  cannon: g(
    c('f2', 55, 13, 5, sw(2.5)) +
      c('f2', 60, 6, 3, sw(2)) +
      c('f2', 49, 6, 2.4, sw(2)) +
      rot(-24, p('f3', 'M12 29Q4 36 12 43L50 40V32Z') + r('f3', 48, 29, 7, 14, 2) + c('f3', 7, 36, 3.4), 22, 38) +
      p('f1', 'M8 40H36L32 50H12Z') +
      wheelS(22, 47, 10) +
      c('f3', 46, 54, 4.5) +
      c('f3', 55, 54, 4.5) +
      c('f3', 50.5, 46.5, 4.5) +
      hl(48.5, 44.5, 1, 1),
  ),
  flag: g(
    p('', 'M12 9V59', sw(4)) +
      e('f4', 12, 59, 7, 2.5, sw(2.5)) +
      c('f4', 12, 6, 3.5) +
      p('f1', 'M13 12Q24 8 34 12Q44 16 56 12V36Q44 40 34 36Q24 32 13 36Z') +
      p('', 'M26 21Q30 22 34 23Q44 26 56 22M26 28Q30 29.5 34 30Q44 33 56 29', sw(2)) +
      p('f3', 'M13 12Q19 10 26 11V31Q19 31 13 33Z', sw(2.5)) +
      p('f2', starD(19.5, 21.5, 5, 2.1, 5), NS),
  ),
  tent: g(
    p('', 'M2 58H62', sw(3)) +
      p('', 'M32 10V3', sw(2.5)) +
      p('f1', 'M32 3L43 6L32 9Z', sw(2)) +
      p('', 'M12 44L3 54M52 44L61 54', sw(2)) +
      p('f2', 'M32 10L5 57H59Z') +
      p('f3', 'M32 26L21 57H43Z') +
      p('f2', 'M32 26L21 57L15 57Q27 44 32 26Z', sw(2.5)) +
      p('', 'M32 10V26', sw(2)),
  ),
  trophy: g(
    p('', 'M17 14H8Q6 30 20 34M47 14H56Q58 30 44 34', sw(3.5)) +
      p('f4', 'M16 8H48V20Q48 38 32 40Q16 38 16 20Z') +
      p('f4', 'M28 39H36L35 46H29Z', sw(2.5)) +
      r('f3', 18, 46, 28, 6, 1.5) +
      r('f3', 14, 52, 36, 6, 1.5) +
      p('f2', starD(32, 22, 7.5, 3.2, 5), sw(2)) +
      hl(21, 18, 1.2, 5),
  ),
  medal: g(
    p('f1', 'M13 4H26L37 30H26Z') +
      p('f3', 'M51 4H38L27 30H38Z') +
      c('f4', 32, 42, 15) +
      c('', 32, 42, 11, sw(2)) +
      p('f2', starD(32, 42.8, 7.5, 3.2, 5), sw(2)) +
      hl(24, 36, 1.2, 3.5, 30),
  ),
  guitar: rot(
    40,
    g(
      r('f3', 29, 6, 6, 28, 1) +
        p('f1', 'M27 1H37L36 10H28Z') +
        p('', 'M27 3.5H24M27 7.5H24.5M37 3.5H40M37 7.5H39.5', sw(2.2)) +
        p('f4', 'M32 30Q22 26 20 34Q19 40 23 43Q15 46 16 53Q18 62 32 61Q46 62 48 53Q49 46 41 43Q45 40 44 34Q42 26 32 30Z') +
        c('f3', 32, 41, 4.5) +
        r('f3', 26.5, 51, 11, 3, 1, sw(2)) +
        p('', 'M31 9V52M33 9V52', sw(1)),
    ),
  ),
  knife: rot(
    -40,
    g(
      r('f1', 3, 28, 19, 8, 3) +
        c('f4', 8.5, 32, 1.3, NS) +
        c('f4', 15.5, 32, 1.3, NS) +
        r('f4', 21, 24, 4.5, 16, 1.5) +
        p('f2', 'M25.5 27H48L53 30Q57 31 61 31Q57 38 46 38H25.5Z') +
        p('', 'M28 31H46', sw(1.6)),
    ),
  ),
  ghost: g(
    p('f2', 'M14 36Q5 32 6 22Q11 28 14 28Z') +
      p('f2', 'M50 36Q59 32 58 22Q53 28 50 28Z') +
      p('f2', 'M13 57V30Q13 12 32 12Q51 12 51 30V57L45 52L39 58L32 52L25 58L19 52Z') +
      e('f3', 25, 31, 3.4, 4.6, NS) +
      e('f3', 39, 31, 3.4, 4.6, NS) +
      c('f2', 26, 29.5, 1, NS) +
      c('f2', 40, 29.5, 1, NS) +
      e('f3', 32, 43, 4, 5, NS) +
      hat(32, 16, 0.62, -8),
  ),
  smoke: g(
    p('f2', 'M20 58Q10 50 16 40Q22 32 16 24Q14 18 20 14Q18 22 24 28Q30 36 26 44Q24 52 30 58Z') +
      p('f2', 'M34 58Q24 48 32 38Q40 28 32 20Q26 12 34 7Q44 4 46 12Q47 19 40 19Q35 18 37 14Q40 16 42 13Q40 9 36 11Q32 15 38 22Q46 32 40 42Q36 50 42 58Z') +
      p('f2', 'M48 58Q42 52 46 46Q50 40 47 34Q53 38 52 46Q51 52 54 58Z', sw(2.5)),
  ),
  stamp: g(
    p('f2', 'M22 40Q17 29 30 28Q40 21 51 29Q62 31 60 44Q62 57 48 59Q37 63 27 57Q16 53 22 40Z') +
      p('f3', 'M53 32Q59 35 57 41Q52 41 50 36Z', NS) +
      p('f3', 'M26 50Q30 48 32 53Q29 57 25 54Z', NS) +
      p('f1', tp('M32 57Q26 56 28 46L9 14Q21 24 32 6Q43 24 55 14L36 46Q38 56 32 57Z', 29.4, 30.6, 0.4), sw(2)) +
      p('', 'M47 25Q44 22 47 19Q50 16 47 13M55 27Q52 24 55 21Q58 18 55 15', sw(2)) +
      rot(45, r('f1', 1, 5, 18, 9, 4.5), 10, 9.5) +
      p('', 'M18 18L32 32', sw(4.5)) +
      rot(45, r('f1', 26, 30, 18, 6, 2), 35, 33),
  ),
  rock: g(
    p('', 'M2 52H62', sw(3)) +
      p('f2', 'M6 51Q4 37 14 29Q20 15 34 15Q48 14 54 27Q61 39 56 51Z') +
      p('f3', 'M44 51Q52 44 53 31Q60 41 56 51Z', NS) +
      p('', 'M28 19L32 25L29 29M47 25L44 31', sw(2)) +
      eyeB(26, 37, 4, 1, 0.4) +
      eyeB(37, 37, 4, 1, 0.4) +
      hl(16, 34, 1.5, 4, 25),
  ),
  stopwatch: g(
    rot(40, r('f3', 29, 8, 6, 6, 1.5), 32, 36) +
      p('', 'M32 9V15', sw(3.5)) +
      r('f3', 27, 4, 10, 6, 2) +
      c('f4', 32, 36, 21) +
      c('f2', 32, 36, 16) +
      p('f1', `M32 36L32 20A16 16 0 0 1 ${polar(32, 36, 16, 20)}Z`, NS) +
      ring(4, p('', 'M32 21V24', sw(2.5)), 32, 36) +
      p('', 'M32 36L42 26', sw(2.5)) +
      c('f3', 32, 36, 2, NS),
  ),
  bomb: g(
    p('', 'M39 20Q43 9 52 10', sw(2.5)) +
      p('f4', starD(53, 9, 7.5, 3, 8), sw(2)) +
      c('f3', 28, 38, 19) +
      rot(45, r('f3', 36.5, 18, 10, 8, 2), 41.5, 22) +
      hl(19, 30, 3, 5.5, 40),
  ),
  boomerang: g(
    p('', 'M30 42Q38 50 52 48M38 34Q46 40 58 38', `${sw(2)} stroke-dasharray="3 3"`) +
      p('f4', 'M8 48Q8 20 22 12Q34 6 54 12Q60 15 57 20Q54 23 50 21Q36 17 28 22Q20 28 18 48Q17 54 12 54Q8 53 8 48Z') +
      p('', 'M9 40L18 41M44 11L42 19M13 22L22 25', sw(2.5)),
  ),
  kite: g(
    p('', 'M32 50Q26 54 30 58Q36 60 40 56', sw(2.5)) +
      p('f4', 'M27 53L23 50L24 56Z', sw(2)) +
      p('f1', 'M32 6L53 27L32 50L11 27Z') +
      p('f4', 'M32 6L32 27L11 27Z', NS) +
      p('f4', 'M32 27L53 27L32 50Z', NS) +
      p('', 'M32 6L53 27L32 50L11 27Z') +
      p('', 'M32 6V50M11 27H53', sw(2.5)) +
      c('f2', 32, 27, 4.5, sw(2.5)),
  ),
  balloon: g(
    p('', 'M32 48Q27 53 33 57Q38 60 33 63', sw(2)) +
      p('f1', 'M32 4Q50 4 50 22Q50 38 32 46Q14 38 14 22Q14 4 32 4Z') +
      p('f1', 'M29 50L32 45L35 50Z', sw(2)) +
      hl(23, 16, 2.4, 5.5, 25),
  ),
  ufo: g(
    p('f2', 'M22 34L8 60H56L42 34Z', `${sw(2)} stroke-dasharray="3 3"`) +
      e('f4', 32, 54, 5.5, 3, sw(2)) +
      c('f4', 31, 48, 3.6, sw(2)) +
      p('f1', 'M34 47L38.5 48.5L34 50Z', sw(1.5)) +
      p('', 'M26 52L23 47M38 52L41 47', sw(2)) +
      p('f2', 'M19 24Q19 9 32 9Q45 9 45 24Z') +
      e('f3', 29, 17, 1.6, 2.6, NS) +
      e('f3', 35, 17, 1.6, 2.6, NS) +
      e('f1', 32, 27, 29, 8) +
      [12, 22, 32, 42, 52].map((x, i) => c('f4', x, i === 0 || i === 4 ? 27.5 : 30, 2, sw(1.5))).join(''),
  ),
  toilet: g(
    p('', 'M4 58H60', sw(3)) +
      r('f4', 14, 18, 36, 40) +
      p('f1', 'M8 21L32 6L56 21L52 23H12Z') +
      r('f4', 20, 24, 24, 34, 1) +
      p('', 'M26 42V58M32 42V58M38 42V58', sw(1.5)) +
      p('f3', 'M35 26.5A6 6 0 1 0 35 37.5A4.5 4.5 0 1 1 35 26.5Z', NS) +
      c('f3', 40, 44, 1.5, NS) +
      c('f3', 56, 30, 1.6, NS) +
      p('', 'M52 33Q55 26 58 31Q61 36 57 38', sw(1.4)) +
      p('', 'M8 58L6 53M10 58L11 54', sw(2)),
  ),
  mailbox: g(
    r('f4', 27, 36, 9, 22, 1.5) +
      p('', 'M18 58H46', sw(3)) +
      rot(-18, r('f2', 1, 18, 16, 11, 1, sw(2.5)) + p('', 'M1 18L9 24L17 18', sw(2)), 9, 24) +
      p('f1', 'M10 38V22A10 10 0 0 1 20 12H48A10 10 0 0 1 58 22V38Z') +
      p('', 'M20 12A10 10 0 0 1 30 22V38', sw(2)) +
      p('', 'M50 33V8', sw(3)) +
      p('f4', 'M50 8H61V16H50Z', sw(2.5)) +
      hl(40, 17, 6, 1),
  ),
  wheelbarrow: g(
    p('', 'M38 40L60 31M45 42L49 56', sw(3.5)) +
      p('f4', 'M12 28Q16 16 28 18Q36 12 44 20Q52 22 50 28Z') +
      twinkle(30, 9, 4.5) +
      twinkle(48, 13, 3.5) +
      p('f1', 'M7 26H53L44 44H19Z') +
      p('', 'M14 32H49', sw(1.6)) +
      wheelS(17, 49, 9),
  ),
  accordion: g(
    p('', 'M18 12Q32 4 46 12', sw(2.5)) +
      p('f2', 'M17 18L22 14L28 18L34 14L40 18L46 14L47 18V46L46 50L40 46L34 50L28 46L22 50L17 46Z') +
      p('', 'M22 14V50M28 18V46M34 14V50M40 18V46', sw(2)) +
      r('f1', 3, 12, 15, 40, 2) +
      r('f1', 46, 12, 15, 40, 2) +
      [
        [8, 20],
        [13, 24],
        [8, 28],
        [13, 32],
        [8, 36],
        [13, 40],
        [8, 44],
      ]
        .map(([x, y]) => c('f2', x, y, 1.6, NS))
        .join('') +
      [18, 25, 32, 39].map(y => r('f2', 50, y, 7, 4.5, 1, sw(1.5))).join(''),
  ),
  hotdog: rot(
    -14,
    g(
      r('f4', 8, 22, 48, 22, 11) +
        r('f1', 3, 23, 58, 12, 6) +
        p('', 'M10 29Q13 25 16 29T22 29T28 29T34 29T40 29T46 29T52 29', sw(2.5)) +
        p('f4', 'M7 34Q9 46 22 46H42Q55 46 57 34Q45 40 32 40Q19 40 7 34Z') +
        hl(18, 41, 4, 1),
    ),
  ),
  popcorn: g(
    [
      [18, 22],
      [27, 15],
      [37, 13],
      [46, 18],
      [52, 25],
      [12, 27],
    ]
      .map(([x, y]) => c('f2', x, y, 6, sw(2.5)))
      .join('') +
      [
        [23, 25],
        [33, 22],
        [43, 25],
      ]
        .map(([x, y]) => c('f2', x, y, 6, sw(2.5)))
        .join('') +
      p('f2', trap(0, 1)) +
      p('f1', trap(0, 0.2), sw(2)) +
      p('f1', trap(0.4, 0.6), sw(2)) +
      p('f1', trap(0.8, 1), sw(2)) +
      p('', trap(0, 1)),
  ),
  sandwich: g(
    p('', 'M32 4V22', sw(2.5)) +
      c('f1', 32, 6, 3.5) +
      r('f2', 8, 43, 48, 11, 4) +
      p('f1', 'M5 42Q10 37 15 42Q20 47 25 42Q30 37 35 42Q40 47 45 42Q50 37 55 42L58 45H6Z') +
      p('f4', 'M7 34H57L54 41L49 37L45 44L40 37H8Z') +
      p('f2', 'M8 30Q8 14 32 14Q56 14 56 30Q56 34 52 34H12Q8 34 8 30Z') +
      p('', 'M18 22L19 23M44 22L45 23M31 20L32 21', sw(2.5)),
  ),
  fishbone: g(
    p('f2', 'M48 32L60 21Q56 32 60 43Z') +
      p('', 'M24 32H50M30 23Q33 32 30 41M37 22Q40 32 37 42M44 24Q46 32 44 40', sw(3)) +
      p('f2', 'M5 32Q9 20 20 20Q25 26 25 32Q25 38 20 44Q9 44 5 32Z') +
      p('', 'M12 26L17 31M17 26L12 31', sw(2)) +
      p('', 'M7 36Q10 38 14 37', sw(2)),
  ),
  bucket: g(
    p('', 'M10 24Q32 -2 54 24', sw(3)) +
      p('f4', 'M10 24L16 56H48L54 24Z') +
      p('', 'M22 28L24 56M32 29V56M42 28L40 56', sw(1.5)) +
      p('f3', 'M11.4 31H52.6L51.8 35.5H12.2Z', sw(2)) +
      p('f3', 'M14.3 46H49.7L48.9 50.5H15.1Z', sw(2)) +
      e('f1', 32, 24, 22, 5) +
      c('f3', 10, 24, 1.8, NS) +
      c('f3', 54, 24, 1.8, NS),
  ),
  piggybank: g(
    c('f4', 30, 15, 6.5) +
      p('', 'M30 11V19', sw(2)) +
      r('f1', 15, 44, 8, 12, 2) +
      r('f1', 36, 44, 8, 12, 2) +
      p('', 'M8 34Q2 33 3 28Q5 24 8 28', sw(2.5)) +
      e('f1', 30, 37, 22, 15) +
      p('f1', 'M39 25L44 14L49 27Z') +
      e('f1', 52, 39, 4.5, 6) +
      e('f3', 51, 37, 1, 1.6, NS) +
      e('f3', 53.5, 41, 1, 1.6, NS) +
      dot(43, 32, 0.9) +
      r('f3', 23, 21, 14, 3.5, 1.75, NS) +
      hl(17, 32, 2, 5, 30),
  ),
  rocket: rot(
    45,
    g(
      p('f4', 'M25 48Q32 66 39 48Z') +
        p('f1', 'M28.5 48Q32 58 35.5 48Z', sw(2)) +
        p('f1', 'M24 34L13 50L24 47Z') +
        p('f1', 'M40 34L51 50L40 47Z') +
        p('f2', 'M24 48V26Q24 12 32 3Q40 12 40 26V48Z') +
        p('f1', 'M26.6 15Q28.6 8.5 32 3Q35.4 8.5 37.4 15Z') +
        c('f4', 32, 28, 5.5) +
        c('f2', 32, 28, 2.5, NS) +
        p('f1', 'M32 38V48', sw(3)),
    ),
  ),
  lightbulb: g(
    p('', 'M32 1V5M12 9L15 12M52 9L49 12M5 28H9M55 28H59', sw(2.5)) +
      p('f4', 'M32 8Q48 8 48 26Q48 34 41 40V46H23V40Q16 34 16 26Q16 8 32 8Z') +
      p('', 'M27 41V33L30 28L32 33L34 28L37 33V41', sw(2)) +
      r('f3', 22, 45, 20, 4.5, 1.5, sw(2.5)) +
      r('f3', 23.5, 49.5, 17, 4.5, 1.5, sw(2.5)) +
      p('f3', 'M27 54H37L35 58H29Z', sw(2)) +
      hl(24, 20, 2, 5, 30),
  ),
});
