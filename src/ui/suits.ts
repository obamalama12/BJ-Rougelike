// Suit glyphs and face-card portraits, drawn as inline SVG.
// Suit glyphs live in a 0 0 100 100 box and use currentColor.

import type { Suit } from '../core/types';

export const SUIT_PATH: Record<Suit, string> = {
  // Crescent moon with a small star
  moon: `<path d="M62 8C40 10 22 28 22 52s18 42 40 44C46 88 36 72 36 52S46 16 62 8Z" fill="currentColor"/>
         <path d="M74 30l3.5 8.5 9 1-7 6 2.2 9-7.7-4.8-7.7 4.8 2.2-9-7-6 9-1Z" fill="currentColor"/>`,
  // Three-tongued flame
  flame: `<path d="M50 4C56 22 76 30 76 56c0 20-12 36-26 38-14-2-26-18-26-38 0-12 6-20 12-26 0 10 4 16 10 18C44 34 42 18 50 4Z" fill="currentColor"/>
          <path d="M50 52c6 8 12 14 12 24 0 8-6 14-12 14s-12-6-12-14c0-6 4-10 6-12 1 5 3 7 6 7-2-6-2-12 0-19Z" fill="#fff6e0" opacity=".55"/>`,
  // Ginkgo-like leaf
  leaf: `<path d="M50 96V58" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
         <path d="M50 60C28 60 8 44 8 22c12-8 26-10 34-6 2 4 6 10 8 10s6-6 8-10c8-4 22-2 34 6 0 22-20 38-42 38Z" fill="currentColor"/>
         <path d="M50 58L50 30M50 58L30 26M50 58L70 26" stroke="#fff6e0" stroke-width="2.5" opacity=".45" fill="none"/>`,
  // Temple bell
  bell: `<path d="M44 8h12v8H44z" fill="currentColor"/>
         <path d="M50 14c-18 0-26 14-26 34v20l-8 10h68l-8-10V48c0-20-8-34-26-34Z" fill="currentColor"/>
         <circle cx="50" cy="86" r="8" fill="currentColor"/>
         <path d="M30 60h40" stroke="#fff6e0" stroke-width="3" opacity=".45"/>`,
};

export function suitSvg(s: Suit, cls = ''): string {
  return `<svg class="suit ${cls}" viewBox="0 0 100 100" aria-hidden="true">${SUIT_PATH[s]}</svg>`;
}

/** Stylised face-card portraits (J = fox youth, Q = moon princess, K = oni lord). */
export function faceArt(rank: 11 | 12 | 13, color: string, ink: string): string {
  const skin = '#f7e6cf';
  const dark = '#1b1430';
  if (rank === 11) {
    // Kitsune youth with fox mask pushed aside
    return `<svg class="face-art" viewBox="0 0 120 160" aria-hidden="true">
      <rect x="6" y="6" width="108" height="148" rx="10" fill="${color}" opacity=".12"/>
      <circle cx="60" cy="70" r="46" fill="${color}" opacity=".18"/>
      <path d="M28 160c4-34 18-48 32-48s28 14 32 48Z" fill="${color}" stroke="${dark}" stroke-width="3"/>
      <path d="M44 118l16 18 16-18" fill="none" stroke="#fff6e0" stroke-width="3"/>
      <ellipse cx="60" cy="74" rx="22" ry="26" fill="${skin}" stroke="${dark}" stroke-width="3"/>
      <path d="M36 66c2-22 14-30 24-30s24 8 26 30c-8-10-18-12-26-12s-18 4-24 12Z" fill="${dark}"/>
      <path d="M50 78q4-3 8 0M64 78q4-3 8 0" stroke="${dark}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M56 92q4 3 8 0" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <g transform="translate(80 30) rotate(18)">
        <path d="M-16 6l-4-22 12 10h16l12-10-4 22c0 10-8 18-16 18s-16-8-16-18Z" fill="#fff6e0" stroke="${dark}" stroke-width="3"/>
        <path d="M-10 6l6 3M10 6l-6 3" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
        <path d="M-2 18h4" stroke="${dark}" stroke-width="3"/>
        <path d="M-14-8l-2-6 6 4M14-8l2-6-6 4" fill="${ink}"/>
      </g>
    </svg>`;
  }
  if (rank === 12) {
    // Moon princess with tall hair and crescent ornament
    return `<svg class="face-art" viewBox="0 0 120 160" aria-hidden="true">
      <rect x="6" y="6" width="108" height="148" rx="10" fill="${color}" opacity=".12"/>
      <circle cx="60" cy="62" r="48" fill="${color}" opacity=".18"/>
      <path d="M22 160c2-30 14-46 38-46s36 16 38 46Z" fill="${color}" stroke="${dark}" stroke-width="3"/>
      <path d="M40 124c8 10 32 10 40 0" fill="none" stroke="#fff6e0" stroke-width="3"/>
      <path d="M30 96c-6-40 8-74 30-74s36 34 30 74c-6-8-10-14-10-24H40c0 10-4 16-10 24Z" fill="${dark}"/>
      <ellipse cx="60" cy="76" rx="20" ry="24" fill="${skin}" stroke="${dark}" stroke-width="3"/>
      <path d="M40 68c6-14 34-14 40 0-8-6-32-6-40 0Z" fill="${dark}"/>
      <path d="M50 78q4 3 8 0M62 78q4 3 8 0" stroke="${dark}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <circle cx="60" cy="90" r="2.8" fill="${ink}"/>
      <path d="M68 16c-10 0-16 8-16 16s6 16 16 16c-6-3-9-9-9-16s3-13 9-16Z" fill="#ffe7a0" stroke="${dark}" stroke-width="2.5"/>
      <path d="M40 40l-10-6M80 40l10-6" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="29" cy="33" r="3" fill="${ink}"/><circle cx="91" cy="33" r="3" fill="${ink}"/>
    </svg>`;
  }
  // King: oni lord with horns and crown
  return `<svg class="face-art" viewBox="0 0 120 160" aria-hidden="true">
    <rect x="6" y="6" width="108" height="148" rx="10" fill="${color}" opacity=".12"/>
    <circle cx="60" cy="72" r="48" fill="${color}" opacity=".18"/>
    <path d="M16 160c4-36 20-50 44-50s40 14 44 50Z" fill="${color}" stroke="${dark}" stroke-width="3"/>
    <path d="M60 110v50M40 118l20 16 20-16" fill="none" stroke="#fff6e0" stroke-width="3"/>
    <path d="M34 50L24 18l20 22M86 50l10-32-20 22" fill="#fff6e0" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="60" cy="76" rx="26" ry="28" fill="${ink}" stroke="${dark}" stroke-width="3"/>
    <path d="M36 66l14 6M84 66l-14 6" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="48" cy="76" r="4" fill="#ffe27a" stroke="${dark}" stroke-width="2"/>
    <circle cx="72" cy="76" r="4" fill="#ffe27a" stroke="${dark}" stroke-width="2"/>
    <path d="M44 94q16 10 32 0" fill="#fff6e0" stroke="${dark}" stroke-width="2.6"/>
    <path d="M48 94l3 7M72 94l-3 7" stroke="${dark}" stroke-width="2"/>
    <path d="M60 104c-12 0-20 6-22 12 8-2 14 0 22 0s14-2 22 0c-2-6-10-12-22-12Z" fill="${dark}"/>
    <path d="M40 46l6-16 8 10 6-14 6 14 8-10 6 16Z" fill="#ffd23f" stroke="${dark}" stroke-width="2.6" stroke-linejoin="round"/>
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
