// Decks (starting decks), Wanted Levels (difficulty) and Crates (booster packs).

import type { PackDef, ShoeDef, StakeDef } from '../game/api';
import type { Rank } from '../core/types';
import { RANKS, SUITS } from '../core/cards';

export const SHOES: ShoeDef[] = [
  { id: 'paper', name: 'Red Bandana Deck', hue: '#e2382b', back: 'red', text: '{g:+1} fold each table', start: { baseFolds: 4 } },
  { id: 'indigo', name: 'Blue Jeans Deck', hue: '#3d5cff', back: 'blue', text: '{g:+1} hand each table', start: { baseHands: 7 } },
  { id: 'gilded', name: 'Gold Rush Deck', hue: '#f0b429', back: 'gold', text: 'Start with an extra {$:10}', start: { money: 14 } },
  { id: 'jade', name: 'Greenback Deck', hue: '#1fae6c', back: 'jade', text: 'At the end of each table: {$:2} per remaining hand, {$:1} per remaining fold. {r:No interest}' },
  { id: 'ink', name: 'Black Hat Deck', hue: '#2a2340', back: 'ink', text: '{g:+1} ability slot. {r:-1} hand each table', start: { baseCharmSlots: 6, baseHands: 5 } },
  { id: 'starlit', name: 'Tonic Peddler Deck', hue: '#7a5cff', back: 'violet', text: 'Start with the {g:Saddlebag} Deed and {g:2} copies of the {g:Same Again, Barkeep} Tonic', vouchers: ['crystal_ball'], cons: [{ kind: 'fortune', id: 'the_echo' }, { kind: 'fortune', id: 'the_echo' }] },
  { id: 'observatory', name: 'Lookout Deck', hue: '#1d2a6b', back: 'night', text: 'Start with the {g:Spyglass} Deed. {r:-1} consumable slot', vouchers: ['telescope'], start: { baseConsSlots: 1 } },
  { id: 'spirit', name: 'Moonshiner’s Deck', hue: '#9fe8ff', back: 'ghost', text: 'Start with {g:Face Card Firewater} and {g:Ace-High Hooch}', cons: [{ kind: 'mask', id: 'fox_mask' }, { kind: 'mask', id: 'oni_mask' }] },
  { id: 'court', name: 'High Society Deck', hue: '#ff7a3d', back: 'court', text: 'Every {g:2, 3, 4 and 5} is replaced with a random face card',
    build: (c) => { for (const k of c.run.deck) if (k.rank <= 5) k.rank = c.rng.pick([11, 12, 13] as Rank[]); } },
  { id: 'little', name: 'Kiddie Table Deck', hue: '#ffb3c7', back: 'pink', text: 'No face cards in the deck. {g:+1} hand each table', start: { baseHands: 7 },
    build: (c) => { c.run.deck = c.run.deck.filter((k) => k.rank < 11 || k.rank > 13); } },
  { id: 'twin_moon', name: 'Two-Suit Deck', hue: '#6f8cff', back: 'checker', text: 'Only {s:moon} and {s:flame} cards, 26 of each',
    build: (c) => { for (const k of c.run.deck) { if (k.suit === 'leaf') k.suit = 'moon'; if (k.suit === 'bell') k.suit = 'flame'; } } },
  { id: 'ember', name: 'Tornado Deck', hue: '#ff6a2a', back: 'ember', text: 'Every card gets a random rank and suit',
    build: (c) => { for (const k of c.run.deck) { k.rank = c.rng.pick(RANKS); k.suit = c.rng.pick(SUITS); } } },
  { id: 'balance', name: 'Fifty-Fifty Deck', hue: '#e9e2cf', back: 'yinyang', text: 'Before each hand scores, Pot and Odds are both set to their average. {r:Targets X2}', scale: 2 },
  { id: 'twin', name: 'Double Stack Deck', hue: '#3fcf8e', back: 'twin', text: 'Two full decks shuffled together. {g:+1} hand each table', start: { baseHands: 7 },
    build: (c) => { const extra = c.run.deck.map((k) => ({ ...k })); for (const k of extra) c.addCard({ rank: k.rank, suit: k.suit }); } },
  { id: 'lucky7', name: 'Lucky Seven Deck', hue: '#ffd23f', back: 'lucky', text: 'One card of every suit is a {g:7} instead {d:(so 8 sevens)}. {h:sevens} starts at level {g:3}',
    build: (c) => {
      // Still 52 cards: one non-7 of each suit is reprinted as a 7.
      for (const s of SUITS) { const k = c.run.deck.find((x) => x.suit === s && x.rank !== 7 && x.rank <= 6); if (k) k.rank = 7; }
      c.run.handLevels.sevens = 3;
    } },
  { id: 'mirror', name: 'Mirror Mirror Deck', hue: '#c9b8ff', back: 'mirror', text: 'After defeating each Outlaw, receive a {g:Double Telegram}' },
];

export const SHOE: Record<string, ShoeDef> = Object.fromEntries(SHOES.map((s) => [s.id, s]));

export const STAKES: StakeDef[] = [
  { id: 1, name: 'Greenhorn', color: '#8a93a6', text: 'Standard rules' },
  { id: 2, name: 'Drifter', color: '#e2382b', text: 'Saloon Game tables pay no reward Bucks' },
  { id: 3, name: 'Gunslinger', color: '#3fcf8e', text: 'Targets grow faster' },
  { id: 4, name: 'Desperado', color: '#3d8bff', text: '{r:-1} fold each table' },
  { id: 5, name: 'Bandit', color: '#a35cff', text: 'The dealer hits soft 17. Targets grow faster still' },
  { id: 6, name: 'Most Wanted', color: '#ff7a3d', text: '{r:-1} max Grit' },
  { id: 7, name: 'Dead or Alive', color: '#c2261a', text: '{r:-1} hand each table' },
  { id: 8, name: 'Legend', color: '#f0b429', text: 'Interest is capped at {$:3}. Targets X1.25' },
];

export const PACKS: PackDef[] = [
  { id: 'fortune_normal', name: 'Tonic Crate', kind: 'fortune', size: 3, picks: 1, cost: 4, weight: 4, tier: 'normal' },
  { id: 'fortune_jumbo', name: 'Jumbo Tonic Crate', kind: 'fortune', size: 5, picks: 1, cost: 6, weight: 2, tier: 'jumbo' },
  { id: 'fortune_mega', name: 'Mega Tonic Crate', kind: 'fortune', size: 5, picks: 2, cost: 8, weight: 0.5, tier: 'mega' },
  { id: 'star_normal', name: 'Tall Tale Crate', kind: 'star', size: 3, picks: 1, cost: 4, weight: 4, tier: 'normal' },
  { id: 'star_jumbo', name: 'Jumbo Tall Tale Crate', kind: 'star', size: 5, picks: 1, cost: 6, weight: 2, tier: 'jumbo' },
  { id: 'star_mega', name: 'Mega Tall Tale Crate', kind: 'star', size: 5, picks: 2, cost: 8, weight: 0.5, tier: 'mega' },
  { id: 'mask_normal', name: 'Moonshine Crate', kind: 'mask', size: 2, picks: 1, cost: 4, weight: 0.6, tier: 'normal' },
  { id: 'mask_jumbo', name: 'Jumbo Moonshine Crate', kind: 'mask', size: 4, picks: 1, cost: 6, weight: 0.3, tier: 'jumbo' },
  { id: 'mask_mega', name: 'Mega Moonshine Crate', kind: 'mask', size: 4, picks: 2, cost: 8, weight: 0.1, tier: 'mega' },
];

export const PACK: Record<string, PackDef> = Object.fromEntries(PACKS.map((p) => [p.id, p]));
