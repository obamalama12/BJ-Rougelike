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
    p('', 'M36 38L34 56L30 58M46 38L49 56L53 58', sw(3)) +
      p('f2', tubeD(bez([28, 30], [16, 26], [12, 40], [17, 54]), t => 3.4 - t * 0.6)) +
      e('f3', 40, 28, 18, 12) +
      p('f2', 'M55 22Q64 14 61 27Q64 29 57 34Z') +
      p('', 'M30 28Q34 34 40 30Q44 36 50 31', sw(2)) +
      p('f4', 'M4 58Q8 48 18 48Q28 48 32 58Z') +
      p('', 'M12 52L13 51M22 53L23 52', sw(2)),
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
    e('f2', 22, 34, 7, 9.5, 'transform="rotate(-12 22 34)"') +
      e('f2', 42, 34, 7, 9.5, 'transform="rotate(12 42 34)"') +
      e('f2', 32, 31, 7.5, 10.5) +
      c('f4', 30, 28, 1.3, NS) +
      c('f4', 34, 33, 1, NS) +
      p('f4', 'M5 36Q8 56 32 57Q56 56 59 36Q32 44 5 36Z') +
      p('', 'M10 42Q24 50 38 46M18 52Q34 50 52 44M26 42L46 52M8 38L2 34M56 38L62 33M50 50L58 54', sw(2)),
  ),
  feather: g(
    p('f2', 'M52 8Q30 8 20 28Q14 40 14 52Q26 50 38 38Q52 24 52 8Z') +
      p('f1', 'M52 8Q44 9 38 13Q44 16 49 18Q52 13 52 8Z', sw(2.5)) +
      p('', 'M56 5Q38 24 10 58', sw(3)) +
      p('', 'M26 26L33 30M20 36L28 40M38 18L43 22M30 18L36 22', sw(2)),
  ),
  wing: g(
    p('f2', 'M6 22Q20 8 48 9Q60 10 57 17L51 18Q60 22 55 28L47 28Q56 34 47 38H41Q46 46 35 47Q18 48 10 38Q4 30 6 22Z') +
      p('f4', 'M6 22Q20 8 48 9Q60 10 57 17Q40 20 26 22Q14 26 6 22Z', sw(2.5)) +
      p('', 'M24 32L51 18M22 38L47 28M22 44L41 38', sw(2)),
  ),
  footprint: g(
    p('f1', 'M32 57Q26 56 28 46L9 14Q21 24 32 6Q43 24 55 14L36 46Q38 56 32 57Z') +
      p('', 'M32 48L14 18M32 48V12M32 48L50 18', sw(2)) +
      c('f3', 9, 14, 1.5, NS) +
      c('f3', 32, 6, 1.5, NS) +
      c('f3', 55, 14, 1.5, NS),
  ),
});
