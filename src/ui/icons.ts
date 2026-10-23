// Woodblock-print style icon set for Twenty-One Lanterns.
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
  `<circle ${cl ? `class="${cl}"` : 'fill="none"'} cx="${cx}" cy="${cy}" r="${r}"${a ? ' ' + a : ''}/>`;
const e = (cl: string, cx: number, cy: number, rx: number, ry: number, a = ''): string =>
  `<ellipse ${cl ? `class="${cl}"` : 'fill="none"'} cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${a ? ' ' + a : ''}/>`;
const r = (cl: string, x: number, y: number, w: number, h: number, rr = 0, a = ''): string =>
  `<rect ${cl ? `class="${cl}"` : 'fill="none"'} x="${x}" y="${y}" width="${w}" height="${h}"${rr ? ` rx="${rr}"` : ''}${a ? ' ' + a : ''}/>`;
/** Small ink dot (eyes, pips). */
const dot = (x: number, y: number, rad = 1.2): string =>
  `<circle class="f3" stroke="none" cx="${x}" cy="${y}" r="${n2(rad + 1.3)}"/>`;
/** Soft cream highlight (no outline). */
const hl = (x: number, y: number, rx: number, ry: number, deg = 0): string =>
  `<ellipse class="f2" stroke="none" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"${deg ? ` transform="rotate(${deg} ${x} ${y})"` : ''}/>`;
/** Rotate a fragment around a point (default: icon centre). */
const rot = (deg: number, body: string, cx = 32, cy = 32): string =>
  `<g transform="rotate(${deg} ${cx} ${cy})">${body}</g>`;
const mv = (dx: number, dy: number, body: string): string => `<g transform="translate(${dx} ${dy})">${body}</g>`;

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
    p('f2', 'M20 58Q10 50 16 40Q22 32 16 24Q14 18 20 14Q18 22 24 28Q30 36 26 44Q24 52 30 58Z') +
      p('f2', 'M34 58Q24 48 32 38Q40 28 32 20Q26 12 34 7Q44 4 46 12Q47 19 40 19Q35 18 37 14Q40 16 42 13Q40 9 36 11Q32 15 38 22Q46 32 40 42Q36 50 42 58Z') +
      p('f2', 'M48 58Q42 52 46 46Q50 40 47 34Q53 38 52 46Q51 52 54 58Z', 'stroke-width="2.5"'),
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

// ---------------------------------------------------------------- creatures
Object.assign(ICONS, {
  cat: g(
    p('f2', 'M14 40Q9 57 20 57H40Q51 57 46 40Z') +
      p('f2', 'M40 40L42 24Q41 14 48 12Q56 11 56 19L51 41Z') +
      p('', 'M47 16V19M51 15.5V19', 'stroke-width="2"') +
      p('f2', 'M14 23L15 6L27 14Z') +
      p('f2', 'M33 14L45 6L46 23Z') +
      p('f1', 'M17.5 18L18 11L23 14Z', 'stroke="none"') +
      p('f1', 'M37 14L42 11L42.5 18Z', 'stroke="none"') +
      e('f2', 30, 27, 16, 14) +
      p('', 'M20.5 27Q23.5 23.5 26.5 27M33.5 27Q36.5 23.5 39.5 27M27.5 32Q30 34.5 32.5 32', 'stroke-width="2.5"') +
      p('', 'M15 29H10M15 33L11 35M45 29H50', 'stroke-width="2"') +
      e('f1', 21, 33, 2.2, 1.3, 'stroke="none"') +
      e('f1', 39, 33, 2.2, 1.3, 'stroke="none"') +
      p('f1', 'M15 40Q30 46 45 40L45 44Q30 50 15 44Z') +
      c('f4', 30, 49, 3.6),
  ),
  fox: g(
    p('f2', 'M12 7L24 19H40L52 7L51 30Q48 46 32 57Q16 46 13 30Z') +
      p('f1', 'M16 13L22 20L17 25Z', 'stroke="none"') +
      p('f1', 'M48 13L42 20L47 25Z', 'stroke="none"') +
      p('f1', 'M18 31Q24 26 29 32Q24 34 18 31Z') +
      p('f1', 'M46 31Q40 26 35 32Q40 34 46 31Z') +
      p('f1', 'M32 21Q36 26 32 30Q28 26 32 21Z') +
      p('', 'M26 44Q32 48 38 44') +
      e('f3', 32, 50, 2.6, 2),
  ),
  crow: g(
    p('', 'M30 46L28 57M36 45L38 57M25 57H31M35 57H41', 'stroke-width="2.5"') +
      p('f3', 'M16 26Q18 13 30 16Q44 20 52 32L59 43L48 41Q40 48 28 46Q16 43 16 26Z') +
      p('f3', 'M24 29Q38 26 52 39Q38 41 27 38Z') +
      p('f3', 'M17 21L6 25L17 28Z') +
      c('f4', 22, 21, 2.2, 'stroke-width="2"'),
  ),
  frog: g(
    p('f1', 'M10 52Q8 30 32 28Q56 30 54 52Q44 56 32 56Q20 56 10 52Z') +
      c('f1', 20, 22, 9) +
      c('f1', 44, 22, 9) +
      c('f2', 20, 21, 5.2, 'stroke-width="2.5"') +
      c('f2', 44, 21, 5.2, 'stroke-width="2.5"') +
      dot(21, 21, 0.9) +
      dot(43, 21, 0.9) +
      p('', 'M18 38Q32 48 46 38') +
      e('f2', 32, 49, 9, 4.5) +
      p('', 'M8 56L14 50M56 56L50 50', 'stroke-width="2.5"'),
  ),
  rabbit: g(
    e('f2', 24, 18, 5.5, 13, 'transform="rotate(-14 24 18)"') +
      e('f2', 40, 18, 5.5, 13, 'transform="rotate(14 40 18)"') +
      e('f1', 24, 18, 2, 8, 'stroke="none" transform="rotate(-14 24 18)"') +
      e('f1', 40, 18, 2, 8, 'stroke="none" transform="rotate(14 40 18)"') +
      e('f2', 32, 41, 17, 15) +
      c('f1', 25, 39, 2.2, 'stroke-width="2"') +
      c('f1', 39, 39, 2.2, 'stroke-width="2"') +
      p('', 'M30 45L32 47L34 45M32 47V50M28 51Q32 53 36 51', 'stroke-width="2.5"') +
      e('f1', 22, 46, 2.5, 1.4, 'stroke="none" opacity=".5"') +
      e('f1', 42, 46, 2.5, 1.4, 'stroke="none" opacity=".5"'),
  ),
  koi: g(
    p('f4', 'M45 32L58 20Q54 32 58 44Z') +
      p('f1', 'M27 41L22 51L34 44Z') +
      p('f1', 'M6 32Q16 17 34 21Q44 24 48 32Q44 41 34 43Q16 47 6 32Z') +
      p('f2', 'M21 21Q29 19 33 26Q26 31 21 21Z', 'stroke="none"') +
      p('f2', 'M33 35Q40 31 45 33Q41 41 33 35Z', 'stroke="none"') +
      p('f1', 'M26 22L30 14L36 22Z') +
      dot(13, 29, 1.4) +
      p('', 'M7 33Q4 38 8 41', 'stroke-width="2.5"'),
  ),
  crane: g(
    p('f2', 'M30 36Q22 18 28 6Q40 18 43 33Z') +
      p('f3', 'M28 6Q31 12 34 15L28 16Q26 11 28 6Z', 'stroke-width="2.5"') +
      p('f2', 'M40 34Q46 16 58 10Q57 26 48 38Z') +
      p('f3', 'M58 10Q57 17 55 22L50 19Q53 13 58 10Z', 'stroke-width="2.5"') +
      e('f2', 38, 38, 14, 6) +
      p('f3', 'M50 36L58 40L51 41Z') +
      p('', 'M48 42L57 48M45 43L52 51', 'stroke-width="2.5"') +
      p('f3', 'M27 35L16 28L14 32L26 41Z') +
      c('f2', 15, 29, 4.5) +
      c('f1', 15, 26.5, 2, 'stroke="none"') +
      p('f4', 'M11 31L5 36L12.5 33.5Z', 'stroke-width="2.5"'),
  ),
  heron: g(
    p('', 'M36 44L34 58M42 43L45 58M30 58H38M42 58H50', 'stroke-width="2.5"') +
      p('f2', 'M24 32Q30 24 44 27Q54 30 58 44Q46 41 36 44Q26 42 24 32Z') +
      p('', 'M36 31Q44 32 52 39', 'stroke-width="2.5"') +
      p('f2', 'M24 33Q15 26 22 19Q28 15 22 11L26 8Q34 15 28 22Q24 27 30 30Z') +
      e('f2', 23, 10, 5, 4) +
      p('f4', 'M19 9L5 13L19 12Z', 'stroke-width="2.5"') +
      p('', 'M27 8L36 5', 'stroke-width="2.5"') +
      dot(23, 9, 1),
  ),
  dog: g(
    p('f4', 'M14 23L16 7L27 16H37L48 7L50 23Q54 38 44 48Q38 54 32 54Q26 54 20 48Q10 38 14 23Z') +
      p('f1', 'M18 13L25 17L19 21Z', 'stroke="none"') +
      p('f1', 'M46 13L39 17L45 21Z', 'stroke="none"') +
      p('f2', 'M22 41Q22 31 32 31Q42 31 42 41Q42 52 32 52Q22 52 22 41Z') +
      e('f2', 24, 24, 2.5, 1.6, 'stroke="none"') +
      e('f2', 40, 24, 2.5, 1.6, 'stroke="none"') +
      dot(24, 28, 1.6) +
      dot(40, 28, 1.6) +
      e('f3', 32, 36.5, 4, 2.8) +
      p('', 'M32 39V43M27 44Q32 48 37 44', 'stroke-width="2.5"'),
  ),
  ox: g(
    p('f2', 'M19 22Q8 22 7 9Q13 16 23 16Z') +
      p('f2', 'M45 22Q56 22 57 9Q51 16 41 16Z') +
      p('f3', 'M19 26L7 29L19 33Z') +
      p('f3', 'M45 26L57 29L45 33Z') +
      p('f3', 'M18 22Q18 15 26 15H38Q46 15 46 22L44 42H20Z') +
      e('f2', 32, 45, 13, 9) +
      e('f3', 27, 45, 1.6, 2.4, 'stroke-width="2"') +
      e('f3', 37, 45, 1.6, 2.4, 'stroke-width="2"') +
      c('f2', 25, 28, 1.6, 'stroke="none"') +
      c('f2', 39, 28, 1.6, 'stroke="none"') +
      p('f4', 'M27 52Q32 60 37 52', 'fill="none" stroke-width="3"'),
  ),
  monkey: g(
    e('f1', 11, 33, 5, 6.5) +
      e('f1', 53, 33, 5, 6.5) +
      c('f4', 32, 32, 22) +
      p('f1', 'M32 20Q40 13 45 21Q49 31 43 42Q38 50 32 50Q26 50 21 42Q15 31 19 21Q24 13 32 20Z') +
      dot(26, 29, 1.6) +
      dot(38, 29, 1.6) +
      p('', 'M30 36H30.1M34 36H34.1M27 43Q32 46 37 43', 'stroke-width="2.5"') +
      e('f2', 25, 22, 2.5, 1.5, 'stroke="none"'),
  ),
  snake: g(
    p('f1', 'M5 46C9 22 25 20 31 34C34 41 37 41 40 36L52 42C46 57 30 55 23 42C19 34 14 34 11 46Z') +
      p('f1', 'M39 38Q36 22 47 17Q59 14 60 25Q59 35 51 42Z') +
      c('f2', 49, 23, 2.4, 'stroke-width="2"') +
      dot(49.5, 23, 0.2) +
      p('', 'M58 31L61 35M58 31L62 30', 'stroke-width="2"') +
      p('f4', 'M14 30L17 27L20 30L17 33Z', 'stroke="none"') +
      p('f4', 'M25 33L28 30L31 33L28 36Z', 'stroke="none"') +
      p('f4', 'M33 45L36 42L39 45L36 48Z', 'stroke="none"') +
      p('f4', 'M43 40L46 37L49 40L46 43Z', 'stroke="none"'),
  ),
  dragon: g(
    p('f4', 'M22 22L8 13L14 26L4 30L14 35L6 45L18 41L14 53L28 42Z') +
      p('f2', 'M26 21Q20 10 27 4Q28 12 32 18Z') +
      p('f2', 'M34 19Q34 9 42 6Q38 13 40 20Z') +
      p('f3', 'M28 33L56 31L53 40L30 39Z', 'stroke-width="2.5"') +
      p('f1', 'M20 41Q32 40 40 37L54 39Q53 46 45 47Q32 50 22 46Z') +
      p('f1', 'M17 32Q18 18 34 18Q43 18 48 23L58 25Q61 31 56 33L40 34Q30 37 17 32Z') +
      p('f2', 'M42 34L44.5 37.5L47 34M49 33.5L51 36.5L53 33.5M44 38.5L46 35.5L48 39', 'stroke-width="1.8"') +
      e('f4', 34, 25, 4.2, 3) +
      dot(35, 25, 0.1) +
      p('', 'M28 21Q34 18 40 21', 'stroke-width="2.5"') +
      p('', 'M56 26Q62 16 54 9M52 46Q58 52 52 59', 'stroke-width="2.5"') +
      c('f3', 55, 28, 1, 'stroke="none"'),
  ),
  tanuki: g(
    c('f3', 17, 18, 6.5) +
      c('f3', 47, 18, 6.5) +
      e('f4', 32, 35, 21, 18) +
      p('f3', 'M13 35Q20 25 29 33Q26 42 17 40Z') +
      p('f3', 'M51 35Q44 25 35 33Q38 42 47 40Z') +
      c('f2', 22, 34, 2, 'stroke="none"') +
      c('f2', 42, 34, 2, 'stroke="none"') +
      e('f2', 32, 44, 8, 6.5) +
      e('f3', 32, 40.5, 3, 2) +
      p('', 'M29 46Q32 48 35 46', 'stroke-width="2.5"') +
      p('f2', 'M28 21Q32 18 36 21', 'fill="none"'),
  ),
  octopus: g(
    p('f1', 'M18 36Q4 40 6 52Q10 56 14 52Q12 46 20 44Q16 52 20 58Q26 58 26 52Q26 48 29 46Q30 54 35 56Q39 54 37 46Q42 50 42 55Q48 58 50 52Q48 46 44 44Q52 46 52 52Q58 52 58 46Q56 38 46 36Z') +
      p('f1', 'M14 26Q14 6 32 6Q50 6 50 26Q50 40 40 42H24Q14 40 14 26Z') +
      c('f2', 25, 30, 4.6, 'stroke-width="2.5"') +
      c('f2', 39, 30, 4.6, 'stroke-width="2.5"') +
      dot(25.5, 30.5, 0.4) +
      dot(39.5, 30.5, 0.4) +
      c('f1', 32, 38, 3.4) +
      c('f2', 14, 48, 1.3, 'stroke="none"') +
      c('f2', 50, 49, 1.3, 'stroke="none"') +
      c('f2', 24, 53, 1.3, 'stroke="none"') +
      hl(24, 13, 4, 2.2, -25),
  ),
  centipede: g(
    p('', 'M10 44L6 40M14 52L10 56M16 38L13 33M22 46L20 51M23 32L21 27M30 41L30 46M31 27L31 22M38 37L40 42M39 24L41 19M46 32L50 36M45 20L49 17', 'stroke-width="2.5"') +
      c('f1', 12, 48, 5) +
      c('f1', 19, 42, 5) +
      c('f1', 26, 37, 5) +
      c('f1', 34, 33, 5) +
      c('f1', 42, 29, 5) +
      c('f1', 48, 24, 5) +
      c('f3', 52, 17, 5.5) +
      p('', 'M51 12L48 6M56 14L60 9', 'stroke-width="2.5"') +
      c('f4', 54, 16, 1.2, 'stroke="none"'),
  ),
  moth: g(
    p('', 'M31 21Q27 12 20 10M33 21Q37 12 44 10M24 13L22 16M27 16L25 18M40 13L42 16M37 16L39 18', 'stroke-width="2.5"') +
      p('f4', 'M31 23Q16 8 6 14Q6 30 30 34Z') +
      p('f4', 'M33 23Q48 8 58 14Q58 30 34 34Z') +
      p('f4', 'M30 33Q14 38 18 54Q28 54 32 38Z') +
      p('f4', 'M34 33Q50 38 46 54Q36 54 32 38Z') +
      c('f2', 17, 21, 4) +
      c('f2', 47, 21, 4) +
      dot(17, 21, 1.4) +
      dot(47, 21, 1.4) +
      e('f3', 32, 35, 4, 14),
  ),
  spider: g(
    p('', 'M32 6V16', 'stroke-width="2"') +
      p('', 'M27 30L16 22L10 26M27 34L14 32L8 38M28 38L16 44L12 52M30 42L24 52L24 58M37 30L48 22L54 26M37 34L50 32L56 38M36 38L48 44L52 52M34 42L40 52L40 58') +
      c('f3', 32, 39, 10.5) +
      c('f3', 32, 24, 7) +
      p('f1', 'M29 35L35 35L32 39L35 43H29L32 39Z', 'stroke="none"') +
      c('f1', 29.5, 23, 1.5, 'stroke="none"') +
      c('f1', 34.5, 23, 1.5, 'stroke="none"'),
  ),
  butterfly: g(
    p('', 'M31 22Q28 12 22 8M33 22Q36 12 42 8', 'stroke-width="2.5"') +
      c('f3', 22, 8, 1.5) +
      c('f3', 42, 8, 1.5) +
      p('f1', 'M31 30Q22 6 9 12Q3 26 20 32Z') +
      p('f1', 'M33 30Q42 6 55 12Q61 26 44 32Z') +
      p('f4', 'M30 33Q14 32 14 46Q20 56 31 40Z') +
      p('f4', 'M34 33Q50 32 50 46Q44 56 33 40Z') +
      c('f2', 18, 19, 3.2) +
      c('f2', 46, 19, 3.2) +
      e('f3', 32, 34, 3.5, 13),
  ),
  bat: g(
    p('f3', 'M32 25L27 17L26 26Q17 17 5 20Q11 27 9 36Q15 31 19 37Q23 31 27 37Q29 33 32 39Q35 33 37 37Q41 31 45 37Q49 31 55 36Q53 27 59 20Q47 17 38 26L37 17Z') +
      c('f4', 29.5, 28, 1.3, 'stroke="none"') +
      c('f4', 34.5, 28, 1.3, 'stroke="none"'),
  ),
  owl: g(
    p('f4', 'M14 21L16 7L26 14Q32 12 38 14L48 7L50 21Q56 36 50 50Q42 58 32 58Q22 58 14 50Q8 36 14 21Z') +
      c('f2', 24, 27, 8) +
      c('f2', 40, 27, 8) +
      c('f3', 24, 27, 3.5) +
      c('f3', 40, 27, 3.5) +
      c('f2', 25.2, 25.8, 1, 'stroke="none"') +
      c('f2', 41.2, 25.8, 1, 'stroke="none"') +
      p('f1', 'M29 34H35L32 40Z', 'stroke-width="2.5"') +
      p('', 'M24 46L27 49L30 46L33 49L36 46L39 49M28 52L31 55L34 52', 'stroke-width="2.5"'),
  ),
  bear: g(
    c('f3', 15, 18, 7.5) +
      c('f3', 49, 18, 7.5) +
      c('f4', 15, 18, 3.2, 'stroke="none"') +
      c('f4', 49, 18, 3.2, 'stroke="none"') +
      c('f3', 32, 34, 21) +
      e('f2', 32, 42, 10, 8) +
      e('f3', 32, 38.5, 4, 2.8) +
      p('', 'M32 41V44M28 46Q32 48 36 46', 'stroke-width="2.5"') +
      c('f2', 23, 29, 2, 'stroke="none"') +
      c('f2', 41, 29, 2, 'stroke="none"') +
      p('f2', 'M22 56Q32 52 42 56Q32 54 22 56Z', 'stroke-width="2"'),
  ),
  bee: g(
    e('f2', 28, 18, 6.5, 10.5, 'transform="rotate(-25 28 18)"') +
      e('f2', 40, 18, 6, 10, 'transform="rotate(25 40 18)"') +
      p('f3', 'M52 38L60 40L52 43Z') +
      e('f4', 36, 39, 17, 12) +
      p('f3', 'M32 27.5Q36 39 32 50.5L38 50.8Q42 39 38 27.2Z', 'stroke="none"') +
      p('f3', 'M44 28.8Q48 39 44 49.2L48 47Q51 39 48 31Z', 'stroke="none"') +
      e('', 36, 39, 17, 12) +
      c('f3', 17, 37, 8) +
      p('', 'M14 30L10 22M19 30L20 21', 'stroke-width="2.5"') +
      c('f2', 14.5, 35.5, 1.5, 'stroke="none"'),
  ),
  rooster: g(
    p('f3', 'M40 34Q42 12 56 8Q60 22 52 40Z') +
      p('f3', 'M44 36Q54 26 60 30Q58 42 50 46Z') +
      p('', 'M30 50L28 58M38 50L40 58M24 58H31M37 58H44', 'stroke-width="2.5"') +
      p('f2', 'M20 30Q14 22 18 15Q24 9 29 16Q32 28 44 30Q52 32 52 42Q48 52 34 52Q20 50 20 30Z') +
      p('', 'M30 38Q38 44 46 40', 'stroke-width="2.5"') +
      p('f1', 'M17 14Q16 8 20 9Q22 5 25 9Q29 7 28 13Z', 'stroke-width="2.5"') +
      p('f1', 'M17 22Q14 28 18 28Q20 26 19 22Z', 'stroke-width="2"') +
      p('f4', 'M16 18L9 21L16 22Z', 'stroke-width="2.5"') +
      dot(21, 17, 1.1),
  ),
  turtle: g(
    p('f2', 'M14 44L11 52Q16 55 21 48Z') +
      p('f2', 'M42 44L44 52Q50 55 51 46Z') +
      p('f2', 'M10 42Q4 44 5 48Q9 47 13 44Z') +
      p('f2', 'M46 38Q50 26 56 26Q61 27 60 33Q59 38 52 42Z') +
      dot(56, 30, 0.2) +
      p('f4', 'M8 42Q10 15 30 15Q50 15 52 42Z') +
      p('', 'M23 16.5L19 29L24 41M37 16.5L41 29L36 41M19 29H41M24 41H36', 'stroke-width="2.5"') +
      r('f3', 6, 40, 48, 6, 3) +
      hl(16, 27, 2, 4, 30),
  ),
  whale: g(
    p('f2', 'M24 18Q22 10 16 8M24 18Q26 10 32 8M24 18V9', 'stroke-width="2.5"') +
      p('f3', 'M44 38Q48 28 54 24Q60 22 59 28Q56 32 50 34Q58 34 60 38Q56 42 48 40Z') +
      p('f3', 'M6 38Q6 22 26 22Q42 22 48 34Q50 48 32 50H18Q6 50 6 38Z') +
      p('f2', 'M8 42Q16 50 30 48Q40 46 44 42Q34 42 22 44Q14 44 8 42Z', 'stroke-width="2.5"') +
      c('f2', 16, 35, 1.6, 'stroke="none"') +
      hl(24, 27, 4, 1.6, -10),
  ),
  weasel: g(
    p('f4', 'M26 54Q10 56 8 44Q14 49 24 47Z') +
      p('f3', 'M8 44Q8 50 12 52L13 47Z', 'stroke-width="2.5"') +
      p('f4', 'M22 57Q16 44 21 33Q24 24 31 19Q36 15 42 17L44 27Q38 30 37 40Q37 50 34 57Z') +
      p('f2', 'M43 27Q38 31 37.5 40Q37.5 50 35 56L31 56Q33 46 33 38Q34 30 43 27Z', 'stroke="none"') +
      p('', 'M43 27Q38 31 37.5 40Q37.5 50 35 56', 'stroke-width="2"') +
      e('f4', 42, 20, 9.5, 6.5, 'transform="rotate(12 42 20)"') +
      c('f4', 37, 12.5, 3.4) +
      c('f3', 51.5, 23, 1.6, 'stroke="none"') +
      dot(43.5, 18.5, 0.2) +
      p('', 'M36 36L41 38M34 46L39 47M18 57H40', 'stroke-width="3"') +
      p('', 'M48 34Q56 32 58 38Q56 44 50 42M50 48Q58 48 58 54', 'stroke-width="2.5"'),
  ),
  tapir: g(
    p('', 'M24 42V54M31 43V54M44 43V54M51 41V54', 'stroke-width="5"') +
      p('f3', 'M22 24Q30 17 44 18Q57 20 57 32Q57 43 48 44H25Q19 42 19 34Z') +
      p('f2', 'M31 18.6Q38 17.5 46 18.7Q51 31 46 44H31Q35 31 31 18.6Z', 'stroke-width="2.5"') +
      p('f3', 'M26 25Q18 20 12 26Q8 30 8 37Q7 45 11 47Q12 41 14 39Q20 41 26 38Z') +
      p('f3', 'M20 22.5L21 15L26.5 21Z') +
      c('f2', 17, 29, 1.5, 'stroke="none"') +
      p('', 'M40 6Q46 2 52 6Q56 3 58 8Q62 12 56 14H42Q36 12 40 6Z', 'stroke-width="2"') +
      p('', 'M34 14Q36 11 39 12', 'stroke-width="2"'),
  ),
});

// ---------------------------------------------------------------- food & drink
Object.assign(ICONS, {
  sake: g(
    p('f2', 'M19 7H27L26.5 13Q26 18 30 23Q37 32 36 44Q35 56 23 56Q11 56 10 44Q9 32 16 23Q20 18 19.5 13Z') +
      p('f1', 'M11.4 35H34.6Q35.6 38 35.9 41H10.1Q10.4 38 11.4 35Z', 'stroke-width="2.5"') +
      r('f3', 18, 5, 10, 4, 1.5) +
      p('f2', 'M38 41H56L53 54Q47 57 41 54Z') +
      e('f1', 47, 41, 9, 2.6) +
      hl(15, 46, 1.6, 4, 10),
  ),
  bowl: g(
    p('', 'M26 30L50 6M33 31L57 12', 'stroke-width="3.5"') +
      p('f1', 'M7 31H57Q57 52 32 55Q7 52 7 31Z') +
      e('f4', 32, 31, 25, 5) +
      p('', 'M16 30Q19 26 22 30Q25 34 28 30M36 30Q39 26 42 30', 'stroke-width="2.5"') +
      c('f2', 44, 30, 4.5, 'stroke-width="2.5"') +
      p('', 'M44 30m-1.5 0a1.5 1.5 0 1 1 1.5 1.5', 'stroke-width="1.8"') +
      p('f2', 'M14 40H50Q48 44 46 46H18Q16 44 14 40Z', 'stroke="none"') +
      p('', 'M18 43L21 41L24 43L27 41L30 43L33 41L36 43L39 41L42 43L45 41', 'stroke-width="2"') +
      r('f3', 24, 54, 16, 4, 2),
  ),
  riceball: g(
    p('f2', 'M32 7Q38 7 44 17L55 38Q59 52 46 54H18Q5 52 9 38L20 17Q26 7 32 7Z') +
      p('f3', 'M21 38H43V54H21Z') +
      c('f1', 32, 22, 3.4, 'stroke-width="2.5"') +
      p('', 'M25 30L26 31M38 30L39 31M30 32L31 33', 'stroke-width="2"') +
      hl(22, 24, 2, 5, 30),
  ),
  mochi: g(
    p('', 'M48 6L14 58', 'stroke-width="3.5"') +
      c('f1', 41, 17, 9.5) +
      c('f2', 33, 30, 9.5) +
      c('f4', 25, 43, 9.5) +
      hl(38, 13, 2.2, 3.2, 40) +
      hl(30, 26, 2.2, 3.2, 40) +
      hl(22, 39, 2.2, 3.2, 40),
  ),
  persimmon: g(
    e('f1', 32, 37, 23, 19) +
      p('f3', 'M32 19Q23 12 16 18Q25 24 32 23Q39 24 48 18Q41 12 32 19Z') +
      p('', 'M32 19Q32 12 36 8', 'stroke-width="3.5"') +
      hl(19, 36, 2.5, 5, 15) +
      p('', 'M32 23V27', 'stroke-width="2"'),
  ),
  peach: g(
    p('f1', 'M33 11Q36 17 44 18Q56 23 55 38Q52 56 32 57Q12 56 9 38Q8 23 20 18Q29 15 33 11Z') +
      p('', 'M33 13Q24 28 29 55', 'stroke-width="2.5"') +
      p('f3', 'M33 12Q22 2 13 10Q22 16 33 12Z', 'stroke-width="2.5"') +
      p('f3', 'M34 12Q44 4 52 9Q45 16 34 12Z', 'stroke-width="2.5"') +
      hl(44, 30, 3, 6, -20),
  ),
  mushroom: g(
    p('f2', 'M24 36Q22 50 19 56H45Q42 50 40 36Z') +
      p('f1', 'M6 35Q7 9 32 9Q57 9 58 35Q32 41 6 35Z') +
      c('f2', 22, 22, 3.6, 'stroke-width="2.5"') +
      c('f2', 38, 17, 2.6, 'stroke-width="2.5"') +
      c('f2', 46, 28, 3.2, 'stroke-width="2.5"') +
      c('f2', 30, 31, 2, 'stroke-width="2.5"') +
      p('', 'M28 44Q30 48 29 52', 'stroke-width="2"'),
  ),
  egg: g(
    p('f2', 'M32 6Q49 6 52 34Q54 58 32 58Q10 58 12 34Q15 6 32 6Z') +
      c('f4', 26, 22, 2.4, 'stroke="none"') +
      c('f4', 40, 30, 3, 'stroke="none"') +
      c('f4', 28, 42, 2.6, 'stroke="none"') +
      c('f4', 42, 46, 1.8, 'stroke="none"') +
      p('', 'M20 30Q20 20 25 14', 'stroke-width="2.5"'),
  ),
  teacup: g(
    p('', 'M25 16Q21 12 25 8Q28 5 25 2M35 16Q31 12 35 8Q38 5 35 3', 'stroke-width="2.5"', ) +
      p('f2', 'M12 21H52L48 53Q32 59 16 53Z') +
      e('f4', 32, 21, 20, 4.5) +
      p('f1', 'M14 32H50L49 39H15Z', 'stroke-width="2.5"') +
      c('f1', 24, 46, 2, 'stroke="none"') +
      c('f1', 40, 47, 2, 'stroke="none"'),
  ),
  gourd: g(
    p('f4', 'M27 11Q20 15 21 23Q21 28 26 31Q14 34 14 45Q14 57 32 57Q50 57 50 45Q50 34 38 31Q43 28 43 23Q44 15 37 11Z') +
      r('f3', 27, 5, 10, 7, 2) +
      p('f1', 'M25 29.5H39V33.5H25Z', 'stroke-width="2.5"') +
      p('f1', 'M38 32L44 42L40 43Z', 'stroke-width="2.5"') +
      hl(22, 44, 2.5, 5.5, 15) +
      hl(27, 20, 1.6, 3.5, 15),
  ),
  cauldron: g(
    c('f1', 22, 18, 4.5) +
      c('f1', 35, 13, 5.5) +
      c('f1', 44, 19, 3.5) +
      p('', 'M18 51L15 58M46 51L49 58', 'stroke-width="3.5"') +
      p('f3', 'M10 26H54Q56 50 40 54H24Q8 50 10 26Z') +
      r('f4', 6, 22, 52, 7, 3.5) +
      p('', 'M8 34Q3 34 4 40M56 34Q61 34 60 40', 'stroke-width="3"') +
      p('f2', 'M16 34Q16 42 22 47', 'stroke-width="2.5"'),
  ),
});

// ---------------------------------------------------------------- treasures & tools
Object.assign(ICONS, {
  coin: g(
    c('f4', 32, 32, 25) +
      c('', 32, 32, 19, 'stroke-width="2.5"') +
      r('f3', 25, 25, 14, 14, 1) +
      p('', 'M32 15V20M32 44V49M15 32H20M44 32H49', 'stroke-width="3"') +
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
      p('f3', 'M32 18H40L39 22H31Z', 'stroke-width="2"') +
      hl(24, 18.5, 3, 1.2, -5),
  ),
  purse: g(
    p('f1', 'M20 22Q7 33 11 47Q15 57 32 57Q49 57 53 47Q57 33 44 22Z') +
      p('f1', 'M20 23L15 11Q22 15 25 9Q29 15 32 9Q35 15 39 9Q42 15 49 11L44 23Z') +
      p('', 'M17 23Q32 29 47 23', 'stroke-width="3.5"') +
      p('', 'M26 25L21 36M38 25L44 36', 'stroke-width="2.5"') +
      c('f4', 21, 38, 2.6, 'stroke-width="2.5"') +
      c('f4', 44, 38, 2.6, 'stroke-width="2.5"') +
      c('f4', 32, 44, 6.5) +
      r('f3', 30, 42, 4, 4, 0.5, 'stroke="none"') +
      hl(17, 45, 2, 4.5, 20),
  ),
  gift: g(
    r('f1', 10, 28, 44, 28, 2) +
      r('f1', 7, 20, 50, 10, 2) +
      r('f4', 28, 20, 8, 36) +
      p('f4', 'M32 20Q20 6 15 12Q13 20 32 20Z') +
      p('f4', 'M32 20Q44 6 49 12Q51 20 32 20Z') +
      c('f4', 32, 20, 3.4) +
      hl(15, 38, 1.6, 5),
  ),
  crown: g(
    p('f4', 'M9 48L8 18L21 31L32 12L43 31L56 18L55 48Z') +
      r('f4', 8, 44, 48, 10, 2) +
      c('f4', 8, 16, 3) +
      c('f4', 32, 10, 3) +
      c('f4', 56, 16, 3) +
      c('f1', 20, 49, 2.6, 'stroke-width="2.5"') +
      c('f1', 44, 49, 2.6, 'stroke-width="2.5"') +
      p('f2', 'M32 45L35 49L32 53L29 49Z', 'stroke-width="2.5"'),
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
  mirror: g(
    p('f1', 'M26 52Q22 58 18 56M38 52Q42 58 46 56', 'fill="none" stroke-width="2.5"') +
      p('f3', 'M27 40L24 52H40L37 40Z') +
      r('f3', 12, 51, 40, 6, 2) +
      c('f4', 32, 25, 19) +
      c('f2', 32, 25, 13.5) +
      p('', 'M24 22L30 16M26 28L35 19', 'stroke-width="2.5"'),
  ),
  scroll: g(
    r('f2', 14, 15, 36, 34) +
      p('', 'M22 21V35M28 21V43M34 21V31M40 21V39', 'stroke-width="2.5"') +
      c('f1', 41, 42, 3.4, 'stroke-width="2.5"') +
      r('f4', 6, 11, 10, 42, 5) +
      r('f4', 48, 11, 10, 42, 5) +
      e('f3', 11, 11, 5, 2, 'stroke-width="2.5"') +
      e('f3', 53, 11, 5, 2, 'stroke-width="2.5"'),
  ),
  book: g(
    r('f2', 17, 10, 38, 47, 2) +
      r('f1', 12, 7, 38, 47, 2) +
      r('f2', 37, 12, 8, 22, 1, 'stroke-width="2.5"') +
      p('', 'M40 16V30', 'stroke-width="2"') +
      p('', 'M18 9V52', 'stroke-width="2.5"') +
      p('', 'M14 15H22M14 25H22M14 35H22M14 45H22', 'stroke-width="2.5"'),
  ),
  brush: rot(
    38,
    g(
      p('', 'M32 3Q36 3 35 7', 'stroke-width="2.5"') +
        r('f1', 28.5, 6, 7, 30, 2) +
        r('f4', 27.5, 34, 9, 6, 1) +
        p('f2', 'M28 40H36Q39 50 32 60Q25 50 28 40Z') +
        p('f3', 'M29 51Q32 54 35 51Q34 56 32 60Q30 56 29 51Z') +
        hl(30.5, 18, 0.9, 7),
    ),
  ),
  inkstone: g(
    r('f3', 10, 20, 38, 37, 5) +
      p('f2', 'M15 25H43V31Q29 36 15 31Z', 'stroke-width="2.5"') +
      r('', 15, 25, 28, 27, 3, 'stroke-width="2.5"') +
      rot(25, r('f1', 44, 8, 9, 30, 1.5) + r('f4', 45.5, 13, 6, 9, 1, 'stroke-width="2"'), 48, 23),
  ),
  stamp: g(
    rot(-8, r('f1', 7, 28, 28, 28, 3) + r('', 12, 33, 18, 18, 1, 'stroke-width="2"') + p('', 'M16 38H26M21 38V47M16 47H26', 'stroke-width="2.5"'), 21, 42) +
      r('f4', 37, 7, 18, 36, 7) +
      r('f3', 35, 40, 22, 8, 2) +
      r('f1', 36, 48, 20, 5, 1.5, 'stroke-width="2.5"') +
      hl(41.5, 18, 1.5, 6),
  ),
  abacus: g(
    r('f3', 6, 12, 52, 40, 3) +
      r('f2', 10, 16, 44, 32, 1) +
      p('', 'M16 16V48M24 16V48M32 16V48M40 16V48M48 16V48M10 26H54', 'stroke-width="2"') +
      p(
        'f1',
        [16, 24, 32, 40, 48]
          .map((x, i) => {
            const ys = [[20, 31, 36], [22, 36, 41], [20, 31, 41], [22, 31, 36], [20, 36, 41]][i];
            return ys.map(y => `M${x - 5} ${y}L${x} ${y - 2.6}L${x + 5} ${y}L${x} ${y + 2.6}Z`).join('');
          })
          .join(''),
        'stroke-width="2"',
      ),
  ),
  scales: g(
    p('f3', 'M18 57Q32 47 46 57Z') +
      r('f4', 29.5, 14, 5, 38, 1.5) +
      r('f4', 8, 13, 48, 5, 2.5) +
      c('f4', 32, 10, 3.5) +
      p('', 'M11 18L5 36M11 18L18 36M53 18L46 36M53 18L59 36', 'stroke-width="2"') +
      p('f1', 'M3 36H20Q19 45 11.5 45Q4 45 3 36Z') +
      p('f1', 'M44 36H61Q60 45 52.5 45Q45 45 44 36Z'),
  ),
  hourglass: g(
    p('', 'M15 12V52M49 12V52', 'stroke-width="3.5"') +
      p('f2', 'M19 12H45Q45 26 34 32Q45 38 45 52H19Q19 38 30 32Q19 26 19 12Z') +
      p('f4', 'M23 21H41Q40 27 32 31Q24 27 23 21Z', 'stroke-width="2.5"') +
      p('f4', 'M21 52Q24 42 32 40Q40 42 43 52Z', 'stroke-width="2.5"') +
      p('', 'M32 32V41', 'stroke-width="1.6"') +
      r('f3', 10, 6, 44, 7, 2) +
      r('f3', 10, 51, 44, 7, 2),
  ),
  telescope: g(
    p('', 'M32 34L20 58M32 34L32 58M32 34L44 58', 'stroke-width="3"') +
      rot(
        -28,
        r('f3', 5, 30, 8, 6, 1.5) +
          p('f4', 'M13 28L45 25V41L13 38Z') +
          r('f1', 22, 26, 5, 14, 1, 'stroke-width="2.5"') +
          r('f1', 45, 23, 9, 20, 2) +
          hl(30, 29, 6, 1),
        32,
        32,
      ) +
      c('f3', 32, 34, 3),
  ),
  map: g(
    p('f2', 'M7 14L22 10V50L7 54Z') +
      p('f4', 'M22 10L42 14V54L22 50Z') +
      p('f2', 'M42 14L57 10V50L42 54Z') +
      p('', 'M12 46Q18 32 28 38Q38 44 42 30Q44 24 48 22', 'stroke-width="2.5" stroke-dasharray="3 4"') +
      p('f1', 'M49 26Q42 18 46 13Q49 10 52 13Q56 18 49 26Z', 'stroke-width="2.5"') +
      p('f3', 'M12 30L16 22L20 30Z', 'stroke-width="2"'),
  ),
  envelope: g(
    r('f2', 7, 15, 50, 34, 2) +
      p('', 'M7 47L27 31M57 47L37 31', 'stroke-width="2.5"') +
      p('f2', 'M7 16L32 36L57 16Z') +
      c('f1', 32, 35, 5.5) +
      p('f2', 'M30 33L34 37M34 33L30 37', 'stroke-width="2"'),
  ),
  ticket: rot(
    -15,
    g(
      p('f4', 'M7 20H57V28A4 4 0 0 0 57 36V44H7V36A4 4 0 0 0 7 28Z') +
        p('', 'M42 22V42', 'stroke-width="2.5" stroke-dasharray="2.5 4"') +
        p('f1', starD(24, 32, 8.5, 3.6, 5), 'stroke-width="2.5"') +
        p('', 'M47 27H52M47 32H52M47 37H52', 'stroke-width="2"'),
    ),
  ),
  cards: g(
    rot(-14, r('f1', 10, 10, 26, 38, 3) + r('f2', 14, 14, 18, 30, 2, 'stroke-width="2"') + p('f1', 'M23 22L27 29L23 36L19 29Z', 'stroke-width="2"'), 23, 29) +
      rot(12, r('f2', 27, 14, 26, 38, 3) + p('f1', heartD(40, 33, 8)) + p('f1', heartD(32, 21, 2.6), 'stroke-width="1.6"'), 40, 33),
  ),
  dice: g(
    p('f2', 'M32 7L55 18L32 29L9 18Z') +
      p('f1', 'M9 18L32 29V57L9 46Z') +
      p('f3', 'M55 18L32 29V57L55 46Z') +
      e('f1', 32, 18, 4, 2.2, 'stroke-width="2"') +
      e('f2', 16, 30, 2, 2.6, 'stroke="none"') +
      e('f2', 25, 45, 2, 2.6, 'stroke="none"') +
      e('f2', 49, 28, 2, 2.6, 'stroke="none"') +
      e('f2', 43.5, 37.5, 2, 2.6, 'stroke="none"') +
      e('f2', 38, 47, 2, 2.6, 'stroke="none"'),
  ),
  fan: g(
    p('f1', 'M6.7 28.8A33 33 0 0 1 57.3 28.8L41.2 42.3A12 12 0 0 0 22.8 42.3Z') +
      c('f4', 32, 26, 6, 'stroke-width="2.5"') +
      p('', 'M22.8 42.3L32 50L41.2 42.3M26 39.6L15.5 21.4M29.9 38.2L26.3 17.5M34.1 38.2L37.7 17.5M38 39.6L48.5 21.4', 'stroke-width="2"') +
      p('', 'M26 39.6L32 50L29.9 38.2M34.1 38.2L32 50L38 39.6', 'stroke-width="2"') +
      c('f4', 32, 50, 3, 'stroke-width="2.5"') +
      p('f4', 'M32 53L28 60H36Z', 'stroke-width="2"'),
  ),
  umbrella: g(
    p('', 'M32 32V54Q32 58 27 58', 'stroke-width="3.5"') +
      p('f1', 'M6 32Q9 12 32 8Q55 12 58 32Q51 28 45 32Q38 28 32 32Q26 28 19 32Q13 28 6 32Z') +
      p('f2', 'M20 14Q32 8 44 14L41 17Q32 13 23 17Z', 'stroke-width="2.5"') +
      p('', 'M32 8L19 32M32 8L32 32M32 8L45 32M32 8L10 28M32 8L54 28', 'stroke-width="2"') +
      c('f3', 32, 7, 2.6, 'stroke-width="2"'),
  ),
  kite: g(
    p('', 'M32 50Q26 54 30 58Q36 60 40 56', 'stroke-width="2.5"') +
      p('f4', 'M27 53L23 50L24 56Z', 'stroke-width="2"') +
      p('f1', 'M32 6L53 27L32 50L11 27Z') +
      p('f4', 'M32 6L32 27L11 27Z', 'stroke="none"') +
      p('f4', 'M32 27L53 27L32 50Z', 'stroke="none"') +
      p('', 'M32 6L53 27L32 50L11 27Z') +
      p('', 'M32 6V50M11 27H53', 'stroke-width="2.5"') +
      c('f2', 32, 27, 4.5, 'stroke-width="2.5"'),
  ),
  pinwheel: g(
    p('', 'M33 30L37 58', 'stroke-width="3.5"') +
      ring(4, p('f1', 'M32 28L32 7Q44 9 47 20Z') + p('f4', 'M32 28L47 20L40 28Z', 'stroke-width="2.5"'), 32, 28) +
      c('f2', 32, 28, 3, 'stroke-width="2.5"'),
  ),
  net: g(
    p('f2', 'M8 12H56Q53 40 32 57Q11 40 8 12Z') +
      p('', 'M18 12Q20 40 32 56M26 12Q27 40 32 56M38 12Q37 40 32 56M46 12Q44 40 32 56M9.5 24Q32 30 54.5 24M12 36Q32 42 52 36M19 47Q32 51 45 47', 'stroke-width="2"') +
      r('f3', 6, 9, 52, 5, 2.5) +
      c('f4', 14, 11, 4) +
      c('f4', 32, 11, 4) +
      c('f4', 50, 11, 4),
  ),
  hook: g(
    p('f4', 'M34 13V44A8 8 0 0 1 18 44V40L23 43.5L18 32L15.5 23L13 32V44A13 13 0 0 0 39 44V13Z') +
      c('', 36.5, 9, 4, 'stroke-width="3"') +
      p('', 'M36.5 5V2', 'stroke-width="2"'),
  ),
  needle: g(
    r('f4', 8, 13, 26, 5, 2) +
      r('f1', 11, 18, 20, 28) +
      r('f4', 8, 46, 26, 5, 2) +
      p('', 'M11 24H31M11 30H31M11 36H31M11 42H31', 'stroke-width="2"') +
      p('f2', 'M55 6Q58 7 57 10L32 55L29 57L30 53Z') +
      e('f3', 54, 10, 0.8, 2.4, 'stroke="none" transform="rotate(30 54 10)"') +
      p('', 'M31 26Q46 22 54 10Q58 22 46 30', 'stroke-width="2"'),
  ),
  knife: rot(
    -40,
    g(
      r('f3', 5, 28.5, 18, 7, 2.5) +
        p('f2', 'M8 30L11 34M14 30L17 34', 'stroke-width="2"') +
        e('f4', 24, 32, 2.6, 7) +
        p('f2', 'M27 27.5H48Q55 28 60 33Q53 37 45 37H27Z') +
        p('', 'M30 34H48', 'stroke-width="2"'),
    ),
  ),
  sword: rot(
    -38,
    g(
      r('f3', 3, 29, 17, 6, 2) +
        p('f2', 'M6 29L9 35M10 29L13 35M14 29L17 35', 'stroke-width="1.8"') +
        e('f4', 21, 32, 2.6, 7.5) +
        p('f2', 'M24 29Q45 30 62 23Q48 34 24 35Z') +
        p('', 'M28 33Q44 32 56 27', 'stroke-width="1.8"'),
    ),
  ),
  arrow: rot(
    -40,
    g(
      p('', 'M8 32H50', 'stroke-width="3.5"') +
        p('f3', 'M46 24L61 32L46 40L49 32Z') +
        p('f1', 'M5 31L11 22H21L16 31Z') +
        p('f2', 'M5 33L11 42H21L16 33Z'),
    ),
  ),
  shield: g(
    p('f4', 'M32 6L54 12Q54 40 32 58Q10 40 10 12Z') +
      p('f1', 'M32 12.5L48 16.5Q47.5 37 32 51Q16.5 37 16 16.5Z', 'stroke-width="2.5"') +
      c('f2', 32, 30, 7, 'stroke-width="2.5"') +
      c('f1', 32, 30, 2.4, 'stroke="none"'),
  ),
  chain: rot(
    -42,
    g(
      p('f4', 'M4 32a10 7 0 1 0 20 0a10 7 0 1 0 -20 0ZM8.5 32a5.5 2.4 0 1 0 11 0a5.5 2.4 0 1 0 -11 0Z', 'fill-rule="evenodd"') +
        p('f4', 'M38 32a10 7 0 1 0 20 0a10 7 0 1 0 -20 0ZM42.5 32a5.5 2.4 0 1 0 11 0a5.5 2.4 0 1 0 -11 0Z', 'fill-rule="evenodd"') +
        r('f4', 17, 28.5, 28, 7, 3.5) +
        p('', 'M21 32H41', 'stroke-width="2"') +
        p('', 'M58 32H61M3 32H1', 'stroke-width="3"'),
    ),
  ),
  anchor: g(
    c('', 32, 11, 5, 'stroke-width="3.5"') +
      r('f4', 29, 16, 6, 36, 2) +
      r('f4', 19, 19, 26, 5, 2.5) +
      p('f4', 'M9 34Q11 56 32 56Q53 56 55 34L49 39Q46 49 32 49Q18 49 15 39Z') +
      p('f4', 'M9 34L6 42L14 40Z') +
      p('f4', 'M55 34L58 42L50 40Z'),
  ),
  hammer: rot(
    -30,
    g(
      r('f3', 29, 28, 7, 30, 2.5) +
        p('f4', 'M14 10H50Q54 20 50 30H14Q10 20 14 10Z') +
        p('f1', 'M14 10H20Q17 20 20 30H14Q10 20 14 10Z', 'stroke-width="2.5"') +
        p('f1', 'M44 10H50Q54 20 50 30H44Q47 20 44 10Z', 'stroke-width="2.5"') +
        c('f2', 32, 20, 4.5, 'stroke-width="2.5"') +
        hl(26, 14, 4, 1),
    ),
  ),
  broom: rot(
    28,
    g(
      r('f3', 30, 3, 5, 32, 2) +
        p('f4', 'M27 38H38L48 59H17Z') +
        p('', 'M30 42L26 58M33 42L32 58M36 42L39 58M28 46L21 57M38 46L44 57', 'stroke-width="2"') +
        r('f1', 26, 33, 13, 6, 2),
    ),
  ),
  scissors: g(
    p('f2', 'M28 38L48 6L52 9L34 40Z') +
      p('f2', 'M36 38L16 6L12 9L30 40Z') +
      p('f1', annulusD(22, 48, 9, 4.5), 'fill-rule="evenodd"') +
      p('f1', annulusD(42, 48, 9, 4.5), 'fill-rule="evenodd"') +
      c('f4', 32, 33, 2.4, 'stroke-width="2"'),
  ),
  rope: g(
    p('', 'M14 30V38M50 30V38M32 34V44', 'stroke-width="2.5"') +
      p('f2', 'M22 28H29L26 34H31L27 40H32L28 48H22L25 40H20L23 34H18Z', 'stroke-width="2"') +
      p('f2', 'M38 28H45L42 34H47L43 40H48L44 48H38L41 40H36L39 34H34Z', 'stroke-width="2"') +
      p('f4', 'M6 12Q32 32 58 12L58 22Q32 42 6 22Z') +
      p('', 'M12 16L10 23M18 20L16 27M24 23L22 30M30 25L28 32M36 25L34 32M42 23L40 30M48 20L46 27M54 16L52 23', 'stroke-width="2"') +
      p('', 'M12 38V46M52 38V46', 'stroke-width="2.5"'),
  ),
  bell: g(
    p('f3', 'M28 12V7H36V12', 'stroke-width="3"') +
      p('f4', 'M20 16Q20 11 25 11H39Q44 11 44 16L46 46H18Z') +
      r('f4', 13, 45, 38, 7, 2) +
      p('', 'M19.5 24H44.5M19 34H45M32 24V34', 'stroke-width="2.5"') +
      c('f2', 32, 40, 3, 'stroke-width="2.5"') +
      p('', 'M22 28H22.1M27 28H27.1M37 28H37.1M42 28H42.1', 'stroke-width="3"') +
      hl(24, 40, 1.4, 3),
  ),
  gong: g(
    p('', 'M10 57V10H54V57M6 10H58', 'stroke-width="4"') +
      p('', 'M24 10L28 20M40 10L36 20', 'stroke-width="2"') +
      c('f4', 32, 35, 16) +
      c('', 32, 35, 11, 'stroke-width="2"') +
      c('f2', 32, 35, 5) +
      p('f1', 'M48 50L58 58', 'stroke-width="3"'),
  ),
  drum: g(
    p('', 'M8 8L22 22M56 8L42 22', 'stroke-width="3.5"') +
      c('f1', 32, 34, 24) +
      c('f2', 32, 34, 18) +
      ring(3, p('f1', 'M32 21A6 6 0 1 1 32 33Q25 33 22.5 40Q19 27 32 21Z', 'stroke-width="2.5"'), 32, 34) +
      ring(12, c('f4', 32, 12.8, 1.4, 'stroke="none"'), 32, 34),
  ),
});

// ---------------------------------------------------------------- spirits & masks
Object.assign(ICONS, {
  eye: g(
    p('', 'M14 18L11 13M23 13L22 8M32 12V7M41 13L42 8M50 18L53 13', 'stroke-width="2.5"') +
      p('f2', 'M6 33Q32 8 58 33Q32 58 6 33Z') +
      c('f1', 32, 33, 11) +
      c('f3', 32, 33, 5) +
      c('f2', 35.5, 29.5, 2.2, 'stroke="none"'),
  ),
  oni: g(
    p('f2', 'M19 19L14 5L28 14Z') +
      p('f2', 'M45 19L50 5L36 14Z') +
      p('f1', 'M12 24Q12 12 22 13Q32 9 42 13Q52 12 52 24Q56 41 48 50Q40 58 32 58Q24 58 16 50Q8 41 12 24Z') +
      p('f3', 'M15 24L29 29L28 23L19 20Z', 'stroke-width="2.5"') +
      p('f3', 'M49 24L35 29L36 23L45 20Z', 'stroke-width="2.5"') +
      c('f4', 23, 34, 5) +
      c('f4', 41, 34, 5) +
      dot(23, 34, 0.6) +
      dot(41, 34, 0.6) +
      p('f3', 'M28 41Q32 37 36 41Q32 44 28 41Z', 'stroke-width="2.5"') +
      p('f3', 'M19 46Q32 42 45 46Q41 55 32 55Q23 55 19 46Z') +
      p('f2', 'M22 47L24 41L27 47.5Z', 'stroke-width="2"') +
      p('f2', 'M42 47L40 41L37 47.5Z', 'stroke-width="2"'),
  ),
  tengu: g(
    p('f1', 'M13 28Q13 10 32 10Q51 10 51 28Q51 46 32 56Q13 46 13 28Z') +
      p('f3', 'M26 4H38L40 11H24Z', 'stroke-width="2.5"') +
      p('f2', 'M14 21Q22 15 30 22L28 26Q22 21 15 25Z', 'stroke-width="2.5"') +
      p('f2', 'M50 21Q42 15 34 22L36 26Q42 21 49 25Z', 'stroke-width="2.5"') +
      c('f4', 23, 29, 3.4, 'stroke-width="2.5"') +
      c('f4', 41, 29, 3.4, 'stroke-width="2.5"') +
      dot(23, 29, 0.1) +
      dot(41, 29, 0.1) +
      p('', 'M18 44Q22 48 28 46', 'stroke-width="2.5"') +
      p('f1', 'M27 33Q32 27 37 31L56 46Q60 52 53 52L30 40Q26 37 27 33Z') +
      hl(34, 34, 1.4, 4, -50),
  ),
  kappa: g(
    p('f3', 'M11 24L8 18L15 18L14 12L21 14L22 8L28 12L32 7L36 12L42 8L43 14L50 12L49 18L56 18L53 24Z') +
      c('f1', 32, 36, 20) +
      e('f2', 32, 16, 13, 4.5) +
      c('f2', 24, 31, 5) +
      c('f2', 40, 31, 5) +
      dot(25, 31, 1) +
      dot(39, 31, 1) +
      p('f4', 'M23 43Q32 37 41 43Q32 51 23 43Z') +
      p('', 'M24 43H40', 'stroke-width="2"'),
  ),
  ghost: g(
    p('f4', 'M10 26Q4 20 8 14Q9 18 12 18Q10 12 15 8Q15 14 17 18Q19 24 14 27Q12 28 10 26Z', 'stroke-width="2.5"') +
      p('f2', 'M20 32Q19 10 34 10Q48 10 48 28Q48 40 52 46Q56 52 59 49Q57 57 48 56Q38 55 32 51Q20 44 20 32Z') +
      p('f2', 'M22 32Q14 36 11 43Q17 41 23 39Z') +
      p('f2', 'M45 32Q52 35 55 41Q49 40 44 38Z') +
      p('f2', 'M29 17L34 10L39 17Z', 'stroke-width="2.5"') +
      p('', 'M26 26Q28 28 30 26M38 26Q40 28 42 26M31 34Q34 36 37 34', 'stroke-width="2.5"'),
  ),
  blank: g(
    p('f1', 'M10 58Q12 47 25 45L32 52L39 45Q52 47 54 58Z') +
      p('f2', 'M25 45L32 52L39 45L36 44H28Z', 'stroke-width="2.5"') +
      c('f3', 32, 9, 5) +
      p('f3', 'M15 30Q13 13 32 13Q51 13 49 30Q49 38 46 42H18Q15 38 15 30Z') +
      e('f2', 32, 30, 13, 16) +
      hl(26, 24, 2.5, 4, 20),
  ),
  skull: g(
    p('f2', 'M12 30Q12 8 32 8Q52 8 52 30Q52 40 44 43V50H20V43Q12 40 12 30Z') +
      p('f2', 'M21 50H43V56Q32 59 21 56Z') +
      p('', 'M28 50V57M36 50V57', 'stroke-width="2.5"') +
      c('f3', 23, 30, 6) +
      c('f3', 41, 30, 6) +
      p('f3', 'M32 37L28.5 44H35.5Z', 'stroke-width="2.5"') +
      p('', 'M38 9L36 15L40 18', 'stroke-width="2"'),
  ),
  bone: rot(
    -35,
    g(c('f2', 12, 26, 6.5) + c('f2', 12, 38, 6.5) + c('f2', 52, 26, 6.5) + c('f2', 52, 38, 6.5)) +
      r('f2', 12, 28.5, 40, 7, 0, 'stroke="none"') +
      g(p('', 'M17.4 28.5H46.6M17.4 35.5H46.6')) +
      hl(30, 31, 9, 1),
  ),
  daruma: g(
    p('f1', 'M32 6Q53 6 55 31Q57 53 44 57H20Q7 53 9 31Q11 6 32 6Z') +
      p('f2', 'M19 22Q32 13 45 22Q49 34 41 42Q32 47 23 42Q15 34 19 22Z') +
      c('f2', 26, 28, 4.5, 'stroke-width="2.5"') +
      c('f2', 38, 28, 4.5, 'stroke-width="2.5"') +
      dot(26, 28, 1.4) +
      p('', 'M21 21Q25 18 29 21M35 21Q39 18 43 21', 'stroke-width="3.5"') +
      p('', 'M25 38Q28 34 32 37Q36 34 39 38', 'stroke-width="3"') +
      p('f4', 'M20 49Q32 53 44 49L43 55H21Z', 'stroke-width="2.5"') +
      hl(14, 30, 2, 6, 10),
  ),
  jizo: g(
    r('f3', 12, 52, 40, 6, 2) +
      p('f2', 'M18 53Q16 34 32 30Q48 34 46 53Z') +
      c('f2', 32, 20, 11) +
      p('f1', 'M21 14Q22 8 32 8Q42 8 43 14Q32 11 21 14Z', 'stroke-width="2.5"') +
      p('f1', 'M20 34Q32 30 44 34L40 47Q32 51 24 47Z') +
      p('', 'M27 21Q28.5 22.5 30 21M34 21Q35.5 22.5 37 21M30 26Q32 27 34 26', 'stroke-width="2"') +
      p('f2', 'M28 52Q32 46 36 52', 'stroke-width="2"'),
  ),
  shrine: g(
    p('f3', 'M10 56H54V51H10Z') +
      r('f1', 14, 28, 36, 23) +
      r('f4', 24, 33, 16, 18) +
      p('', 'M32 33V51', 'stroke-width="2.5"') +
      p('f3', 'M5 29Q20 26 32 9Q44 26 59 29L55 33H9Z') +
      p('', 'M18 34V42M46 34V42', 'stroke-width="2"') +
      p('f2', 'M17 34L20 38H17L20 43', 'stroke-width="2"') +
      p('f2', 'M45 34L48 38H45L48 43', 'stroke-width="2"') +
      c('f4', 32, 21, 2.6, 'stroke-width="2"'),
  ),
  torii: g(
    p('f1', 'M17 22H23L24 56H16Z') +
      p('f1', 'M41 22H47L48 56H40Z') +
      r('f1', 9, 30, 46, 5, 1) +
      r('f1', 10, 18, 44, 6, 1) +
      p('f3', 'M5 11Q32 18 59 11L57 18Q32 23 7 18Z') +
      r('f4', 28, 22, 8, 9, 1, 'stroke-width="2.5"') +
      r('f3', 14, 54, 12, 4, 1) +
      r('f3', 38, 54, 12, 4, 1),
  ),
  pagoda: g(
    p('', 'M32 3V12', 'stroke-width="2.5"') +
      p('', 'M29 6H35M29 9H35', 'stroke-width="2"') +
      r('f1', 22, 16, 20, 9) +
      r('f1', 19, 29, 26, 10) +
      r('f1', 16, 43, 32, 11) +
      p('f3', 'M15 17Q24 15 32 10Q40 15 49 17L46 19H18Z') +
      p('f3', 'M10 30Q22 28 32 23Q42 28 54 30L51 33H13Z') +
      p('f3', 'M6 44Q20 42 32 37Q44 42 58 44L55 47H9Z') +
      r('f4', 28, 47, 8, 7, 0, 'stroke-width="2.5"') +
      r('f3', 12, 54, 40, 4, 1),
  ),
  bridge: g(
    p('', 'M6 54Q12 51 18 54Q24 57 30 54M36 54Q42 51 48 54Q54 57 58 54', 'stroke-width="2.5"') +
      p('f1', 'M5 46Q32 20 59 46L59 52Q32 28 5 52Z') +
      p('', 'M8 36Q32 10 56 36', 'stroke-width="3"') +
      p('', 'M16 30V41M24 25V35M32 23V33M40 25V35M48 30V41', 'stroke-width="2.5"') +
      c('f4', 8, 33, 3) +
      c('f4', 56, 33, 3) +
      p('f2', 'M14 48Q32 34 50 48', 'fill="none" stroke-width="1.5"'),
  ),
  boat: g(
    p('', 'M33 6V42', 'stroke-width="3"') +
      r('f2', 19, 10, 28, 26, 1) +
      p('', 'M19 18H47M19 26H47', 'stroke-width="2"') +
      c('f1', 33, 22, 4.5, 'stroke-width="2.5"') +
      p('f3', 'M5 38H59L50 50H15Z') +
      p('f4', 'M10 41H54', 'stroke-width="2"') +
      p('', 'M6 56Q12 52 18 56Q24 60 30 56Q36 52 42 56Q48 60 54 56', 'stroke-width="2.5"'),
  ),
  mountain: g(
    c('f4', 47, 16, 7) +
      p('f1', 'M6 54L25 18Q32 13 39 18L58 54Z') +
      p('f2', 'M25 18Q32 13 39 18L43.8 27L39 24L35.5 28L32 24L28.5 28L25 24L20.3 27Z', 'stroke-width="2.5"') +
      p('', 'M26 40L22 50M38 40L42 50M32 32V46', 'stroke-width="2"') +
      p('f2', 'M4 54H60', 'stroke-width="3"'),
  ),
  wave: g(
    p('f1', 'M6 58C5 34 18 13 39 11C51 10 59 18 58 28C54 21 46 20 42 26C38 32 42 38 48 38C40 45 29 41 29 32C29 42 24 50 27 58Z') +
      p('f2', 'M39 11C46 10 54 13 57 20L53 19L54 23L49 20L48 25L45 22Q42 24 41 27Q42 18 39 11Z', 'stroke-width="2"') +
      p('', 'M16 50Q16 34 26 24M21 54Q22 42 30 34', 'stroke-width="2"') +
      p('f3', 'M36 58Q40 48 50 48Q58 48 58 54Q54 51 50 54Q53 56 52 58Z', 'stroke-width="2.5"') +
      c('f2', 50, 44, 1.6, 'stroke-width="1.5"') +
      c('f2', 56, 40, 1.2, 'stroke-width="1.5"'),
  ),
  bamboo: g(
    r('f4', 18, 6, 9, 17, 2) +
      r('f4', 18, 23, 9, 17, 2) +
      r('f4', 18, 40, 9, 18, 2) +
      r('f4', 37, 12, 8, 15, 2) +
      r('f4', 37, 27, 8, 15, 2) +
      r('f4', 37, 42, 8, 16, 2) +
      p('f1', 'M45 27Q52 18 59 16Q55 26 45 27Z') +
      p('f1', 'M45 27Q54 26 58 32Q50 34 45 27Z') +
      p('f1', 'M18 23Q10 18 6 10Q16 12 18 23Z') +
      p('f1', 'M27 40Q34 34 37 36', 'fill="none"') +
      hl(20.5, 14, 0.9, 5) +
      hl(20.5, 31, 0.9, 5) +
      hl(39.5, 34, 0.9, 5),
  ),
  blossom: g(
    ring(5, p('f1', 'M32 32C23 27 21 15 27 9L32 13L37 9C43 15 41 27 32 32Z')) +
      c('f4', 32, 32, 5.5) +
      ring(5, p('', 'M32 26.5V22', 'stroke-width="2"'), 32, 32, 36) +
      ring(5, c('f2', 32, 17.5, 1.6, 'stroke="none"')),
  ),
  clover: g(
    p('', 'M32 34Q38 46 34 58', 'stroke-width="3.5"') +
      ring(4, p('f1', 'M32 31C24 26 18 18 22 12C25 8 30 10 32 14C34 10 39 8 42 12C46 18 40 26 32 31Z') + hl(32, 20, 1.2, 4), 32, 32, 45),
  ),
  lotus: g(
    e('f3', 32, 51, 25, 6) +
      p('f1', 'M30 47Q12 48 6 35Q20 33 32 45Z') +
      p('f1', 'M34 47Q52 48 58 35Q44 33 32 45Z') +
      p('f1', 'M31 46Q13 38 14 20Q28 24 33 42Z') +
      p('f1', 'M33 46Q51 38 50 20Q36 24 31 42Z') +
      p('f1', 'M32 8Q44 24 32 47Q20 24 32 8Z') +
      hl(30, 22, 1.4, 5, 10),
  ),
  feather: g(
    p('f2', 'M52 8Q30 8 20 28Q14 40 14 52Q26 50 38 38Q52 24 52 8Z') +
      p('f1', 'M52 8Q44 9 38 13Q44 16 49 18Q52 13 52 8Z', 'stroke-width="2.5"') +
      p('', 'M56 5Q38 24 10 58', 'stroke-width="3"') +
      p('', 'M26 26L33 30M20 36L28 40M38 18L43 22M30 18L36 22', 'stroke-width="2"'),
  ),
  hand: g(
    rot(-32, r('f2', 8, 26, 9, 26, 4.5), 16, 48) +
      r('f2', 41, 20, 8, 26, 4) +
      r('f2', 33, 9, 8.5, 34, 4.25) +
      r('f2', 24.5, 7, 8.5, 36, 4.25) +
      r('f2', 16, 11, 8.5, 34, 4.25) +
      p('f2', 'M16.5 33H48.5V44Q48.5 58 34 58H29Q21 58 18 51L16.5 40Z', 'stroke="none"') +
      p('', 'M48.5 33V44Q48.5 58 34 58H29Q22 58 19 53M16.5 33V37', 'fill="none"') +
      c('f1', 33, 45, 4.5, 'stroke-width="2.5"') +
      c('f3', 33, 45, 1.4, 'stroke="none"'),
  ),
  sandal: g(
    r('f3', 13, 38, 9, 15, 1) +
      r('f3', 42, 38, 9, 15, 1) +
      r('f4', 6, 30, 52, 9, 3) +
      p('f1', 'M14 30Q28 7 50 30L45 30Q30 15 19 30Z') +
      c('f1', 33, 17, 2.6, 'stroke-width="2.5"') +
      hl(14, 33, 4, 1),
  ),
  seven: g(p('f1', 'M12 8H53V17L33 57H19L39 19H12Z') + hl(36, 26, 1.4, 5, 28)),
  shell: g(
    p('f4', 'M8 30Q8 8 30 8Q54 8 56 32Q57 50 44 56Q50 46 44 44Q32 58 18 50Q8 44 8 30Z') +
      p('f2', 'M44 44Q52 46 44 56Q38 52 44 44Z', 'stroke-width="2.5"') +
      p('', spiralD(32, 31, 1.5, 21, 2.25, 200), 'stroke-width="3"') +
      p('', 'M32 10.5V18M48 22L43 25M51 37L44 36M14 22L20 25M12 36L19 35', 'stroke-width="2"') +
      hl(20, 16, 2, 4, 45),
  ),
  heart: g(p('f1', heartD(32, 33, 25)) + hl(20, 22, 3, 5.5, 35)),
  wheel: g(
    ring(8, p('', 'M32 32V6', 'stroke-width="3"') + c('f4', 32, 6, 2.6, 'stroke-width="2.5"'), 32, 32, 22.5) +
      p('f4', annulusD(32, 32, 21, 16), 'fill-rule="evenodd"') +
      ring(8, p('', 'M32 26V16', 'stroke-width="2.5"'), 32, 32, 22.5) +
      c('f1', 32, 32, 6.5) +
      c('f2', 32, 32, 2.4, 'stroke-width="2"'),
  ),
});
