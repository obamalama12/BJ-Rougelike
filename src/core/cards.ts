import type { Card, HandTypeId, InkId, Rank, Rules, Suit, FinishId, SealId } from './types';

export const SUITS: Suit[] = ['moon', 'flame', 'leaf', 'bell'];
export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const SUIT_INFO: Record<Suit, { name: string; plural: string; color: string; ink: string; yin: boolean }> = {
  // Internal ids are historical; on the frontier they are Horseshoes, Dynamite, Cacti and Stars.
  moon: { name: 'Horseshoe', plural: 'Horseshoes', color: '#5b8cd6', ink: '#24497f', yin: true },
  flame: { name: 'Dynamite', plural: 'Dynamite', color: '#ff5b3a', ink: '#b8261a', yin: false },
  leaf: { name: 'Cactus', plural: 'Cacti', color: '#4cbf6a', ink: '#1f6e36', yin: true },
  bell: { name: 'Star', plural: 'Stars', color: '#f2b632', ink: '#9a5f08', yin: false },
};

export function rankLabel(r: Rank): string {
  if (r === 11) return 'J';
  if (r === 12) return 'Q';
  if (r === 13) return 'K';
  if (r === 14) return 'A';
  return String(r);
}

export function rankName(r: Rank): string {
  if (r === 11) return 'Jack';
  if (r === 12) return 'Queen';
  if (r === 13) return 'King';
  if (r === 14) return 'Ace';
  return String(r);
}

export const INK_INFO: Record<InkId, { name: string; text: string }> = {
  jade: { name: 'Greenback', text: '{c:+30} Chips when scored' },
  crimson: { name: 'Red Hot', text: '{m:+4} Mult when scored' },
  gilded: { name: 'Gold Plated', text: 'Earn {$:3} when scored' },
  glass: { name: 'Glass', text: '{x:X2} Mult when scored. {g:1 in 4} chance to shatter' },
  stone: { name: 'Rock', text: '{c:+50} Chips. Worth {g:0} toward your total. No rank or suit' },
  lucky: { name: 'Lucky', text: '{g:1 in 5} chance for {m:+20} Mult, {g:1 in 15} chance to earn {$:20}' },
  spirit: { name: 'Wild', text: 'Counts as every suit' },
  ash: { name: 'Rubber Ducky', text: 'If it would bust you, it is worth {g:0} instead, then pops' },
};

export const FINISH_INFO: Record<FinishId, { name: string; text: string; charmText: string }> = {
  foil: { name: 'Shiny', text: '{c:+50} Chips', charmText: '{c:+50} Chips' },
  holo: { name: 'Holographic', text: '{m:+10} Mult', charmText: '{m:+10} Mult' },
  prism: { name: 'Prismatic', text: '{x:X1.5} Mult', charmText: '{x:X1.5} Mult' },
  phantom: { name: 'Ghostly', text: '{g:+1} slot', charmText: '{g:+1} Doodad slot' },
};

export const SEAL_INFO: Record<SealId, { name: string; text: string; color: string }> = {
  red: { name: 'Red Brand', text: 'Retrigger this card {g:1} time', color: '#e2382b' },
  gold: { name: 'Gold Brand', text: 'Earn {$:3} when this card is scored', color: '#f0b429' },
  blue: { name: 'Blue Brand', text: 'Create the {g:Tall Tale} of the winning hand type', color: '#3d8bff' },
  purple: { name: 'Purple Brand', text: 'Create a {g:Tonic} when this card is folded', color: '#a35cff' },
};

export function isFace(c: Card, rules?: Partial<Rules>): boolean {
  if (c.ink === 'stone') return false;
  if (rules?.allFace) return true;
  return c.rank >= 11 && c.rank <= 13;
}

export function isSuit(c: Card, s: Suit, rules?: Partial<Rules>): boolean {
  if (c.ink === 'stone') return false;
  if (c.ink === 'spirit') return true;
  if (c.suit === s) return true;
  if (rules?.smeared) return SUIT_INFO[c.suit].yin === SUIT_INFO[s].yin;
  return false;
}

export function isTenValue(c: Card): boolean {
  return c.ink !== 'stone' && c.rank >= 10 && c.rank <= 13;
}

/** Chip value of a card when scored (separate from its blackjack value). */
export function cardChips(c: Card): number {
  if (c.ink === 'stone') return 50 + (c.bonus ?? 0);
  let v: number;
  if (c.rank === 14) v = 11;
  else if (c.rank >= 11) v = 10;
  else v = c.rank;
  return v + (c.bonus ?? 0);
}

/** Hard blackjack value of a card (aces as 1). */
export function hardValue(c: Card, rules: Rules): number {
  if (c.ink === 'stone') return 0;
  let v: number;
  if (c.rank === 14) v = 1;
  else if (c.rank >= 11) v = rules.faceValue;
  else v = c.rank;
  if (rules.plusOne) v += 1;
  return v;
}

export interface Total {
  total: number;
  soft: boolean;
  bust: boolean;
  /** Ash cards whose value was zeroed to avoid a bust. */
  ashUsed: number[];
}

export function handTotal(cards: Card[], rules: Rules, limit = rules.bustLimit, dealer = false): Total {
  let hard = 0;
  let aces = 0;
  for (const c of cards) {
    hard += hardValue(c, rules);
    if (c.rank === 14 && c.ink !== 'stone') aces++;
  }
  const ashUsed: number[] = [];
  if (!dealer && hard > limit) {
    for (const c of cards) {
      if (hard <= limit) break;
      if (c.ink === 'ash') {
        hard -= hardValue(c, rules);
        ashUsed.push(c.id);
      }
    }
  }
  let total = hard;
  let soft = false;
  if (aces > 0 && !rules.aceLow && hard + 10 <= limit) {
    total = hard + 10;
    soft = true;
  }
  return { total, soft, bust: total > limit, ashUsed };
}

export function newDeck(nextId: () => number, ranks: Rank[] = RANKS, suits: Suit[] = SUITS): Card[] {
  const out: Card[] = [];
  for (const s of suits) for (const r of ranks) out.push({ id: nextId(), rank: r, suit: s });
  return out;
}

export function cardName(c: Card): string {
  if (c.ink === 'stone') return 'Rock Card';
  return `${rankName(c.rank)} of ${SUIT_INFO[c.suit].plural}`;
}

// ---------------------------------------------------------------------------
// Hand types
// ---------------------------------------------------------------------------

export interface HandTypeInfo {
  id: HandTypeId;
  name: string;
  chips: number;
  mult: number;
  lvChips: number;
  lvMult: number;
  desc: string;
  star: string;
}

export const HAND_TYPES: HandTypeInfo[] = [
  { id: 'sevens', name: 'Lucky Sevens', chips: 77, mult: 7, lvChips: 35, lvMult: 4, desc: 'Win with exactly three 7s', star: 'pleiades' },
  { id: 'royal', name: 'Royal Quackjack', chips: 80, mult: 8, lvChips: 35, lvMult: 3, desc: 'A natural: Ace with a suited Jack, Queen or King', star: 'regulus' },
  { id: 'flush', name: 'Birds of a Feather', chips: 70, mult: 6, lvChips: 30, lvMult: 3, desc: 'Reach 21 with 3+ cards, all of one suit', star: 'cygnus' },
  { id: 'blackjack', name: 'Quackjack', chips: 50, mult: 5, lvChips: 25, lvMult: 2, desc: 'A natural blackjack: 21 with your first two cards', star: 'corvus' },
  { id: 'charlie', name: 'Charley Horse', chips: 50, mult: 5, lvChips: 25, lvMult: 2, desc: 'Hold 5 cards without busting (auto-win)', star: 'hydra' },
  { id: 'twentyone', name: 'Dead Eye', chips: 40, mult: 4, lvChips: 20, lvMult: 2, desc: 'Reach exactly 21 with 3+ cards and win', star: 'polaris' },
  { id: 'underdog', name: 'Underduck', chips: 40, mult: 3, lvChips: 20, lvMult: 2, desc: 'Win with a total of 14 or less', star: 'canis' },
  { id: 'outdraw', name: 'Quick Draw', chips: 20, mult: 3, lvChips: 15, lvMult: 1, desc: 'Beat the dealer’s total', star: 'sagitta' },
  { id: 'dealerbust', name: 'Dealer Bites the Dust', chips: 30, mult: 2, lvChips: 15, lvMult: 1, desc: 'The dealer busts while you stand', star: 'crater' },
  { id: 'push', name: 'Standoff', chips: 10, mult: 1, lvChips: 10, lvMult: 1, desc: 'Tie the dealer', star: 'libra' },
];

export const HAND_TYPE: Record<HandTypeId, HandTypeInfo> = Object.fromEntries(
  HAND_TYPES.map((h) => [h.id, h]),
) as Record<HandTypeId, HandTypeInfo>;

export function handBase(id: HandTypeId, level: number): { chips: number; mult: number } {
  const h = HAND_TYPE[id];
  return { chips: h.chips + h.lvChips * (level - 1), mult: h.mult + h.lvMult * (level - 1) };
}

/** Choose the hand type for a non-losing outcome. */
export function classifyHand(
  cards: Card[],
  total: number,
  outcome: 'blackjack' | 'charlie' | 'win' | 'dealerbust' | 'push',
  rules: Rules,
): HandTypeId {
  if (outcome === 'push') return 'push';
  const live = cards.filter((c) => c.ink !== 'stone');
  if (cards.length === 3 && cards.every((c) => c.ink !== 'stone' && c.rank === 7)) return 'sevens';
  if (outcome === 'blackjack') {
    if (rules.blackjackAsOutdraw) return 'outdraw';
    const ace = live.find((c) => c.rank === 14);
    const face = live.find((c) => isFace(c, rules) && c.rank !== 14);
    if (ace && face && SUITS.some((s) => isSuit(ace, s, rules) && isSuit(face, s, rules))) return 'royal';
    return 'blackjack';
  }
  const target = 21;
  if (total === target && cards.length >= 3 && live.length === cards.length) {
    if (SUITS.some((s) => cards.every((c) => isSuit(c, s, rules)))) return 'flush';
  }
  if (outcome === 'charlie') return 'charlie';
  if (total === target) return 'twentyone';
  if (total <= 14) return 'underdog';
  if (outcome === 'dealerbust') return 'dealerbust';
  return 'outdraw';
}
