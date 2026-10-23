// Woodblock-print style icon set for Twenty-One Lanterns.
// Every icon is inner SVG markup for a 0 0 64 64 viewBox. Outlines are drawn in
// `currentColor` (ink); fills use only the theme classes:
//   f1 = main accent, f2 = cream highlight, f3 = dark shadow, f4 = gold accent.

const INK = 'stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';

/** Wrap an icon body in the shared ink-outline group. */
const g = (body: string, extra = ''): string => `<g ${INK}${extra ? ' ' + extra : ''}>${body}</g>`;
/** Path: empty class = pure line stroke. */
const p = (c: string, d: string, a = ''): string =>
  `<path ${c ? `class="${c}"` : 'fill="none"'} d="${d}"${a ? ' ' + a : ''}/>`;
const c = (cl: string, cx: number, cy: number, r: number, a = ''): string =>
  `<circle ${cl ? `class="${cl}"` : 'fill="none"'} cx="${cx}" cy="${cy}" r="${r}"${a ? ' ' + a : ''}/>`;
const e = (cl: string, cx: number, cy: number, rx: number, ry: number, a = ''): string =>
  `<ellipse ${cl ? `class="${cl}"` : 'fill="none"'} cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${a ? ' ' + a : ''}/>`;
const r = (cl: string, x: number, y: number, w: number, h: number, rr = 0, a = ''): string =>
  `<rect ${cl ? `class="${cl}"` : 'fill="none"'} x="${x}" y="${y}" width="${w}" height="${h}"${rr ? ` rx="${rr}"` : ''}${a ? ' ' + a : ''}/>`;
/** Small ink dot (eyes, pips). */
const dot = (x: number, y: number, rad = 1.2): string => `<circle class="f3" cx="${x}" cy="${y}" r="${rad}"/>`;
/** Soft cream highlight (no outline). */
const hl = (x: number, y: number, rx: number, ry: number, deg = 0): string =>
  `<ellipse class="f2" stroke="none" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"${deg ? ` transform="rotate(${deg} ${x} ${y})"` : ''}/>`;
/** Rotate a fragment around a point (default: icon centre). */
const rot = (deg: number, body: string, cx = 32, cy = 32): string =>
  `<g transform="rotate(${deg} ${cx} ${cy})">${body}</g>`;
const mv = (dx: number, dy: number, body: string): string => `<g transform="translate(${dx} ${dy})">${body}</g>`;

const n2 = (v: number): string => (Math.round(v * 100) / 100).toString();
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
const heartD = (cx: number, cy: number, s: number): string => {
  const f = (x: number, y: number): string => `${n2(cx + x * s)} ${n2(cy + y * s)}`;
  return `M${f(0, 1)}C${f(-0.55, 0.62)} ${f(-1, 0.25)} ${f(-1, -0.25)}C${f(-1, -0.62)} ${f(-0.72, -0.85)} ${f(-0.45, -0.85)}C${f(-0.22, -0.85)} ${f(-0.06, -0.72)} ${f(0, -0.52)}C${f(0.06, -0.72)} ${f(0.22, -0.85)} ${f(0.45, -0.85)}C${f(0.72, -0.85)} ${f(1, -0.62)} ${f(1, -0.25)}C${f(1, 0.25)} ${f(0.55, 0.62)} ${f(0, 1)}Z`;
};

export const ICONS: Record<string, string> = {};

export function iconSvg(name: string, cls = ''): string {
  return `<svg class="icon ${cls}" viewBox="0 0 64 64" aria-hidden="true">${ICONS[name] ?? ICONS.lantern}</svg>`;
}

// ---------------------------------------------------------------- lights & sky
Object.assign(ICONS, {
  lantern: g(
    p('', 'M32 4V9') +
      r('f3', 22, 8, 20, 6, 2) +
      r('f3', 22, 50, 20, 6, 2) +
      e('f1', 32, 32, 20, 18) +
      p('', 'M14.5 23.5Q32 27 49.5 23.5M12.2 32Q32 35.5 51.8 32M14.5 40.5Q32 44 49.5 40.5', 'stroke-width="2"') +
      hl(20.5, 30, 2.2, 5, 8) +
      p('', 'M32 56V60'),
  ),
  moon: g(
    p('f4', 'M27.6 8.5A24 24 0 1 0 54 41A20 20 0 0 1 27.6 8.5Z') +
      c('f2', 22, 40, 2.2, 'stroke-width="2"') +
      c('f2', 30, 49, 1.6, 'stroke-width="2"'),
  ),
  flame: g(
    p('f1', 'M32 6C38 16 50 22 48 38C47 50 39 58 32 58C24 58 16 51 16 40C16 30 23 26 25 18C29 23 30 27 31 31C34 23 34 14 32 6Z') +
      p('f4', 'M32 33C36 39 41 43 40 49C39 54 36 56 32 56C28 56 25 53 25 49C25 44 30 41 32 33Z') +
      hl(30, 50, 1.6, 3.2, -15),
  ),
  leaf: g(
    p('f1', 'M10 54C10 30 26 10 54 10C54 36 36 54 10 54Z') +
      p('', 'M10 54L44 20M24 40H36M30 34V24M36 28H44M20 44V36') +
      hl(47, 21, 1.8, 5),
  ),
  sun: g(
    p('f4', starD(32, 32, 27, 17, 12)) +
      c('f1', 32, 32, 14) +
      hl(26, 26, 2.5, 4.5, 40),
  ),
  star: g(p('f4', starD(32, 34, 26, 11, 5)) + hl(29, 25, 1.8, 4, 25)),
  spark: g(
    p('f4', 'M32 6Q35 29 58 32Q35 35 32 58Q29 35 6 32Q29 29 32 6Z') +
      p('f2', 'M50 8Q51 13 56 14Q51 15 50 20Q49 15 44 14Q49 13 50 8Z', 'stroke-width="2"'),
  ),
  comet: g(
    p('f1', 'M38 13Q20 22 6 54Q26 38 51 26Z') +
      p('f2', 'M41 18Q28 28 18 44Q32 33 47 25Z', 'stroke-width="2.5"') +
      c('f4', 45, 19, 10) +
      hl(42, 15, 2.5, 3.5, 40),
  ),
  cloud: g(
    p('f2', 'M12 44Q4 44 6 36Q8 30 15 31Q14 21 24 20Q28 11 38 14Q47 12 49 22Q58 22 58 31Q59 40 50 42Q50 46 44 46H16Q12 46 12 44Z') +
      p('', 'M18 38Q14 33 19 31Q24 30 23 36M34 26Q32 20 38 20Q43 21 41 27M44 38Q48 34 52 36') +
      p('', 'M8 52H30M38 52H52', 'stroke-width="2.5"'),
  ),
  lightning: g(
    p('f4', 'M38 6L14 36H29L22 58L50 26H35L46 6Z') + hl(33, 17, 1.6, 6, 37),
  ),
  smoke: g(
    p('f2', 'M14 54Q6 50 10 42Q14 36 22 40Q20 30 30 30Q30 22 38 22Q36 12 46 10Q56 10 54 20Q58 26 52 30Q54 38 46 40Q48 50 38 50Q34 58 24 56Q20 58 14 54Z') +
      p('', 'M18 48Q16 44 20 44Q24 45 22 49M30 40Q28 35 33 35Q38 36 35 41M44 18Q44 14 48 15Q51 17 48 20M42 30Q46 28 47 32'),
  ),
  spiral: g(c('f1', 32, 32, 25) + p('', spiralD(32, 32, 1, 20, 3, 0), 'stroke-width="3.5"')),
  firefly: g(
    p('f3', 'M20 20H44V23Q51 27 51 36V50Q51 57 44 57H20Q13 57 13 50V36Q13 27 20 23Z') +
      r('f1', 18, 13, 28, 7, 2) +
      p('', 'M26 13Q32 5 38 13', 'stroke-width="2.5"') +
      c('f4', 24, 38, 2.6, 'stroke-width="2"') +
      c('f4', 36, 44, 3, 'stroke-width="2"') +
      c('f4', 40, 32, 2.2, 'stroke-width="2"') +
      c('f4', 28, 50, 2, 'stroke-width="2"') +
      c('f4', 55, 14, 2.2, 'stroke-width="2"') +
      hl(17.5, 41, 1.6, 6),
  ),
  candle: g(
    p('f4', 'M32 5Q39 13 35.5 19Q32 22 28.5 19Q25 13 32 5Z') +
      p('', 'M32 19V23') +
      p('f1', 'M23 23H41L39 48H25Z') +
      p('f2', 'M27 23V31Q29 33 30 30V23', 'stroke-width="2.5"') +
      p('f3', 'M12 48H52Q50 55 32 55Q14 55 12 48Z') +
      r('f3', 26, 54, 12, 4, 1),
  ),
  bonfire: g(
    rot(14, r('f3', 10, 47, 44, 8, 4), 32, 51) +
      rot(-14, r('f3', 10, 47, 44, 8, 4), 32, 51) +
      p('f1', 'M32 6C36 14 46 20 46 34C46 44 40 50 32 50C24 50 18 44 18 36C18 28 24 26 26 18C28 24 30 26 31 28C34 22 34 14 32 6Z') +
      p('f4', 'M32 30C35 35 39 38 38 43C37 47 35 49 32 49C29 49 26 46 27 42C27 38 31 36 32 30Z') +
      c('f4', 50, 14, 1.6, 'stroke-width="2"') +
      c('f4', 14, 20, 1.6, 'stroke-width="2"'),
  ),
  incense: g(
    p('', 'M28 34L26 16M35 34L37 18') +
      c('f1', 26, 15, 1.6, 'stroke-width="2"') +
      c('f1', 37, 17, 1.6, 'stroke-width="2"') +
      p('', 'M25 11Q21 8 25 5M38 13Q42 9 38 6', 'stroke-width="2.5"') +
      p('', 'M17 50L15 57M47 50L49 57') +
      p('f4', 'M10 34H54Q52 52 32 52Q12 52 10 34Z') +
      e('f3', 32, 34, 22, 3.5) +
      hl(18, 42, 2, 4, -40),
  ),
  crystal: g(
    p('f3', 'M18 44Q32 50 46 44L50 57H14Z') +
      c('f2', 32, 26, 19) +
      p('f4', 'M32 15Q33 25 41 26Q33 27 32 37Q31 27 23 26Q31 25 32 15Z', 'stroke-width="2.5"') +
      p('', 'M19 22Q21 14 28 11', 'stroke-width="2.5"') +
      p('f1', 'M22 50H42', 'stroke-width="3"'),
  ),
});
