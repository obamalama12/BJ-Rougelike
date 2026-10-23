// Suit glyphs and face-card portraits, drawn as inline SVG.
// Suit glyphs live in a 0 0 100 100 box and use currentColor.
// Internal suit ids: moon = Horseshoes, flame = Dynamite, leaf = Cacti, bell = Stars.

import type { Suit } from '../core/types';

export const SUIT_PATH: Record<Suit, string> = {
  // Horseshoe, open end up, with nail holes
  moon: `<path d="M22 14h16v34c0 8 5 14 12 14s12-6 12-14V14h16v34c0 18-12 32-28 32S22 66 22 48Z" fill="currentColor"/>
         <g fill="#fff6e0" opacity=".6"><circle cx="30" cy="24" r="3"/><circle cx="30" cy="40" r="3"/><circle cx="70" cy="24" r="3"/><circle cx="70" cy="40" r="3"/><circle cx="38" cy="66" r="3"/><circle cx="62" cy="66" r="3"/></g>`,
  // Two sticks of dynamite with a lit fuse
  flame: `<rect x="22" y="34" width="22" height="58" rx="5" fill="currentColor" transform="rotate(-10 33 63)"/>
          <rect x="54" y="34" width="22" height="58" rx="5" fill="currentColor" transform="rotate(10 65 63)"/>
          <path d="M26 62h50" stroke="#fff6e0" stroke-width="5" opacity=".55"/>
          <path d="M50 36C50 24 58 22 60 14" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M60 4l3 7 7 1-6 4 2 7-6-4-6 4 2-7-6-4 7-1Z" fill="currentColor"/>`,
  // Saguaro cactus
  leaf: `<path d="M42 96V18c0-12 16-12 16 0v78Z" fill="currentColor"/>
         <path d="M42 62H28c-8 0-12-5-12-12V34c0-8 12-8 12 0v14h14Z" fill="currentColor"/>
         <path d="M58 52h14V30c0-8 12-8 12 0v22c0 7-4 12-12 12H58Z" fill="currentColor"/>
         <path d="M50 22v68" stroke="#fff6e0" stroke-width="3" opacity=".4"/>`,
  // Sheriff star badge (round-tipped six-point star)
  bell: `<path d="M50 4l12 22 25 1-13 21 13 21-25 1-12 22-12-22-25-1 13-21-13-21 25-1Z" fill="currentColor" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>
         <circle cx="50" cy="48" r="13" fill="#fff6e0" opacity=".5"/>
         <g fill="currentColor"><circle cx="50" cy="5" r="6"/><circle cx="88" cy="27" r="6"/><circle cx="88" cy="70" r="6"/><circle cx="50" cy="92" r="6"/><circle cx="12" cy="70" r="6"/><circle cx="12" cy="27" r="6"/></g>`,
};

export function suitSvg(s: Suit, cls = ''): string {
  return `<svg class="suit ${cls}" viewBox="0 0 100 100" aria-hidden="true">${SUIT_PATH[s]}</svg>`;
}

/** Duck portraits: J = Duckling Deputy, Q = Saloon Swan, K = Sheriff Drake. */
export function faceArt(rank: 11 | 12 | 13, color: string, ink: string): string {
  const dark = '#1b1410';
  const bill = '#ffb02e';
  const eye = (x: number, y: number, r = 5) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${dark}" stroke-width="2"/><circle cx="${x + 1}" cy="${y + 1}" r="${r * 0.45}" fill="${dark}"/>`;
  const frame = `<rect x="6" y="6" width="108" height="148" rx="10" fill="${color}" opacity=".12"/><circle cx="60" cy="70" r="46" fill="${color}" opacity=".16"/>`;
  if (rank === 11) {
    // Duckling Deputy: fuzzy yellow, bandana, tiny star, oversized hat
    return `<svg class="face-art" viewBox="0 0 120 160" aria-hidden="true">${frame}
      <path d="M30 160c2-30 14-44 30-44s28 14 30 44Z" fill="${color}" stroke="${dark}" stroke-width="3"/>
      <path d="M44 116l16 16 16-16" fill="${ink}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M60 138l4 7 8 1-6 5 2 8-8-4-8 4 2-8-6-5 8-1Z" fill="#ffd23f" stroke="${dark}" stroke-width="2"/>
      <ellipse cx="60" cy="82" rx="27" ry="25" fill="#ffe066" stroke="${dark}" stroke-width="3"/>
      <path d="M47 60c4-8 10-6 13-12 3 6 9 4 13 12" fill="#ffe066" stroke="${dark}" stroke-width="2.5"/>
      ${eye(50, 80)}${eye(70, 80)}
      <path d="M48 92c6-4 18-4 24 0-2 8-22 8-24 0Z" fill="${bill}" stroke="${dark}" stroke-width="2.5"/>
      <path d="M26 54c0-8 14-12 34-12s34 4 34 12c-8-2-12 4-34 4s-26-6-34-4Z" fill="#8a5a2a" stroke="${dark}" stroke-width="3"/>
      <path d="M40 46c0-14 8-22 20-22s20 8 20 22Z" fill="#a8692a" stroke="${dark}" stroke-width="3"/>
      <path d="M41 42h38" stroke="${ink}" stroke-width="4"/>
    </svg>`;
  }
  if (rank === 12) {
    // Saloon Swan: long neck, feathered hat, pearls, lashes
    return `<svg class="face-art" viewBox="0 0 120 160" aria-hidden="true">${frame}
      <path d="M24 160c4-30 18-42 36-42s32 12 36 42Z" fill="${color}" stroke="${dark}" stroke-width="3"/>
      <path d="M34 128c8 10 44 10 52 0" fill="none" stroke="#fff6e0" stroke-width="3"/>
      <g fill="#fff6e0" stroke="${dark}" stroke-width="1.5"><circle cx="46" cy="122" r="3.5"/><circle cx="53" cy="125" r="3.5"/><circle cx="60" cy="126" r="3.5"/><circle cx="67" cy="125" r="3.5"/><circle cx="74" cy="122" r="3.5"/></g>
      <path d="M52 118c-2-20 2-34 8-40 6 6 10 20 8 40Z" fill="#fffaf2" stroke="${dark}" stroke-width="3"/>
      <ellipse cx="60" cy="68" rx="22" ry="20" fill="#fffaf2" stroke="${dark}" stroke-width="3"/>
      ${eye(51, 66, 4.5)}${eye(69, 66, 4.5)}
      <path d="M45 60l-4-4M48 58l-2-5M72 58l2-5M75 60l4-4" stroke="${dark}" stroke-width="2" stroke-linecap="round"/>
      <path d="M52 78c4-3 12-3 16 0-2 7-14 7-16 0Z" fill="#ff7a3d" stroke="${dark}" stroke-width="2.5"/>
      <path d="M32 50c4-14 18-20 30-18 10 2 22 8 26 18-18-6-40-6-56 0Z" fill="${ink}" stroke="${dark}" stroke-width="3"/>
      <path d="M80 40c10-12 22-16 28-14-6 4-10 14-22 20" fill="#ff8ab3" stroke="${dark}" stroke-width="2.5"/>
      <path d="M84 36c6-8 14-12 20-12" stroke="${dark}" stroke-width="1.5" fill="none"/>
    </svg>`;
  }
  // Sheriff Drake: green mallard head, white collar ring, big hat, star, mustache
  return `<svg class="face-art" viewBox="0 0 120 160" aria-hidden="true">${frame}
    <path d="M18 160c4-32 20-46 42-46s38 14 42 46Z" fill="${color}" stroke="${dark}" stroke-width="3"/>
    <path d="M60 116v44" stroke="${dark}" stroke-width="2.5"/>
    <path d="M78 130l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" fill="#ffd23f" stroke="${dark}" stroke-width="2"/>
    <path d="M38 112c6 6 38 6 44 0" fill="none" stroke="#fff6e0" stroke-width="6"/>
    <ellipse cx="60" cy="84" rx="28" ry="26" fill="#2f8f4e" stroke="${dark}" stroke-width="3"/>
    <ellipse cx="52" cy="76" rx="10" ry="6" fill="#56c47a" opacity=".6"/>
    ${eye(50, 82, 5)}${eye(70, 82, 5)}
    <path d="M42 74l14 4M78 74l-14 4" stroke="${dark}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M44 96c8-6 24-6 32 0-3 9-29 9-32 0Z" fill="${bill}" stroke="${dark}" stroke-width="2.5"/>
    <path d="M44 94c6 6 10 2 16 0 6 2 10 6 16 0" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>
    <path d="M14 58c0-10 20-14 46-14s46 4 46 14c-10-3-16 4-46 4S24 55 14 58Z" fill="#5a3a1a" stroke="${dark}" stroke-width="3"/>
    <path d="M34 48c0-18 10-28 26-28s26 10 26 28Z" fill="#7a4e24" stroke="${dark}" stroke-width="3"/>
    <path d="M35 43h50" stroke="${ink}" stroke-width="5"/>
    <path d="M60 22v10" stroke="${dark}" stroke-width="2.5"/>
  </svg>`;
}

/** Pip layouts for number cards (x,y in % of the art area). */
export const PIPS: Record<number, [number, number, boolean?][]> = {
  2: [[50, 18], [50, 82, true]],
  3: [[50, 16], [50, 50], [50, 84, true]],
  4: [[28, 18], [72, 18], [28, 82, true], [72, 82, true]],
  5: [[28, 18], [72, 18], [50, 50], [28, 82, true], [72, 82, true]],
  6: [[28, 18], [72, 18], [28, 50], [72, 50], [28, 82, true], [72, 82, true]],
  7: [[28, 18], [72, 18], [50, 34], [28, 50], [72, 50], [28, 82, true], [72, 82, true]],
  8: [[28, 16], [72, 16], [50, 33], [28, 50], [72, 50], [50, 67, true], [28, 84, true], [72, 84, true]],
  9: [[28, 14], [72, 14], [28, 38], [72, 38], [50, 50], [28, 62, true], [72, 62, true], [28, 86, true], [72, 86, true]],
  10: [[28, 14], [72, 14], [50, 26], [28, 38], [72, 38], [28, 62, true], [72, 62, true], [50, 74, true], [28, 86, true], [72, 86, true]],
};
