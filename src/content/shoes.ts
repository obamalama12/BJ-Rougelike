// Shoes (starting decks) and Moon Phases (difficulty stakes) and Bundles (booster packs).

import type { PackDef, ShoeDef, StakeDef } from '../game/api';
import type { Rank } from '../core/types';
import { RANKS, SUITS } from '../core/cards';

export const SHOES: ShoeDef[] = [
  { id: 'paper', name: 'Paper Shoe', hue: '#e2382b', back: 'red', text: '{g:+1} fold each table', start: { baseFolds: 4 } },
  { id: 'indigo', name: 'Indigo Shoe', hue: '#3d5cff', back: 'blue', text: '{g:+1} hand each table', start: { baseHands: 7 } },
  { id: 'gilded', name: 'Gilded Shoe', hue: '#f0b429', back: 'gold', text: 'Start with an extra {$:10}', start: { money: 14 } },
  { id: 'jade', name: 'Jade Shoe', hue: '#1fae6c', back: 'jade', text: 'At the end of each table: {$:2} per remaining hand, {$:1} per remaining fold. {r:No interest}' },
  { id: 'ink', name: 'Ink Shoe', hue: '#2a2340', back: 'ink', text: '{g:+1} Charm slot. {r:-1} hand each table', start: { baseCharmSlots: 6, baseHands: 5 } },
  { id: 'starlit', name: 'Starlit Shoe', hue: '#7a5cff', back: 'violet', text: 'Start with the {g:Crystal Ball} relic and {g:2} copies of {g:The Echo}', vouchers: ['crystal_ball'], cons: [{ kind: 'fortune', id: 'the_echo' }, { kind: 'fortune', id: 'the_echo' }] },
  { id: 'observatory', name: 'Observatory Shoe', hue: '#1d2a6b', back: 'night', text: 'Start with the {g:Telescope} relic. {r:-1} consumable slot', vouchers: ['telescope'], start: { baseConsSlots: 1 } },
  { id: 'spirit', name: 'Spirit Shoe', hue: '#9fe8ff', back: 'ghost', text: 'Masks may appear in the shop. Start with a {g:Hex Mask}', cons: [{ kind: 'mask', id: 'hex_mask' }] },
  { id: 'court', name: 'Court Shoe', hue: '#ff7a3d', back: 'court', text: 'Every {g:2-5} is replaced with a face card. Ten-rich and dangerous',
    build: (c) => { for (const k of c.run.deck) if (k.rank <= 5) k.rank = c.rng.pick([11, 12, 13] as Rank[]); } },
  { id: 'little', name: 'Little Shoe', hue: '#ffb3c7', back: 'pink', text: 'No face cards in the deck. {g:+1} hand each table', start: { baseHands: 7 },
    build: (c) => { c.run.deck = c.run.deck.filter((k) => k.rank < 11 || k.rank > 13); } },
  { id: 'twin_moon', name: 'Twin Moon Shoe', hue: '#6f8cff', back: 'checker', text: 'Only {s:moon} and {s:flame} cards, 26 of each',
    build: (c) => { for (const k of c.run.deck) { if (k.suit === 'leaf') k.suit = 'moon'; if (k.suit === 'bell') k.suit = 'flame'; } } },
  { id: 'ember', name: 'Ember Shoe', hue: '#ff6a2a', back: 'ember', text: 'All ranks and suits are randomised',
    build: (c) => { for (const k of c.run.deck) { k.rank = c.rng.pick(RANKS); k.suit = c.rng.pick(SUITS); } } },
  { id: 'balance', name: 'Yin-Yang Shoe', hue: '#e9e2cf', back: 'yinyang', text: 'Chips and Mult are {g:balanced} before scoring. {r:Targets X2}', scale: 2 },
  { id: 'twin', name: 'Twin Shoe', hue: '#3fcf8e', back: 'twin', text: 'Two full decks shuffled together. {g:+1} hand each table', start: { baseHands: 7 },
    build: (c) => { const extra = c.run.deck.map((k) => ({ ...k })); for (const k of extra) c.addCard({ rank: k.rank, suit: k.suit }); } },
  { id: 'lucky7', name: 'Lucky Shoe', hue: '#ffd23f', back: 'lucky', text: 'An extra {g:7} of every suit. {h:sevens} starts at level {g:3}',
    build: (c) => { for (const s of SUITS) c.addCard({ rank: 7, suit: s }); c.run.handLevels.sevens = 3; } },
  { id: 'mirror', name: 'Mirror Shoe', hue: '#c9b8ff', back: 'mirror', text: 'After defeating each Host, receive a {g:Double Token}' },
];

export const SHOE: Record<string, ShoeDef> = Object.fromEntries(SHOES.map((s) => [s.id, s]));

export const STAKES: StakeDef[] = [
  { id: 1, name: 'New Moon', color: '#8a93a6', text: 'The base difficulty' },
  { id: 2, name: 'Waxing Crescent', color: '#e2382b', text: 'Paper tables give no reward Embers' },
  { id: 3, name: 'First Quarter', color: '#3fcf8e', text: 'Targets grow faster' },
  { id: 4, name: 'Waxing Gibbous', color: '#3d8bff', text: '{r:-1} fold each table' },
  { id: 5, name: 'Full Moon', color: '#a35cff', text: 'The dealer hits soft 17. Targets grow faster still' },
  { id: 6, name: 'Waning Gibbous', color: '#ff7a3d', text: 'Shop items cost {$:1} more' },
  { id: 7, name: 'Blood Moon', color: '#c2261a', text: '{r:-1} hand each table' },
  { id: 8, name: 'Eclipse', color: '#f0b429', text: 'Interest is capped at {$:3}. Targets X1.25' },
];

export const PACKS: PackDef[] = [
  { id: 'charm_normal', name: 'Charm Bundle', kind: 'charm', size: 2, picks: 1, cost: 4, weight: 4, tier: 'normal' },
  { id: 'charm_jumbo', name: 'Jumbo Charm Bundle', kind: 'charm', size: 4, picks: 1, cost: 6, weight: 2, tier: 'jumbo' },
  { id: 'charm_mega', name: 'Mega Charm Bundle', kind: 'charm', size: 4, picks: 2, cost: 8, weight: 0.5, tier: 'mega' },
  { id: 'fortune_normal', name: 'Fortune Bundle', kind: 'fortune', size: 3, picks: 1, cost: 4, weight: 4, tier: 'normal' },
  { id: 'fortune_jumbo', name: 'Jumbo Fortune Bundle', kind: 'fortune', size: 5, picks: 1, cost: 6, weight: 2, tier: 'jumbo' },
  { id: 'fortune_mega', name: 'Mega Fortune Bundle', kind: 'fortune', size: 5, picks: 2, cost: 8, weight: 0.5, tier: 'mega' },
  { id: 'star_normal', name: 'Star Bundle', kind: 'star', size: 3, picks: 1, cost: 4, weight: 4, tier: 'normal' },
  { id: 'star_jumbo', name: 'Jumbo Star Bundle', kind: 'star', size: 5, picks: 1, cost: 6, weight: 2, tier: 'jumbo' },
  { id: 'star_mega', name: 'Mega Star Bundle', kind: 'star', size: 5, picks: 2, cost: 8, weight: 0.5, tier: 'mega' },
  { id: 'mask_normal', name: 'Mask Bundle', kind: 'mask', size: 2, picks: 1, cost: 4, weight: 0.6, tier: 'normal' },
  { id: 'mask_jumbo', name: 'Jumbo Mask Bundle', kind: 'mask', size: 4, picks: 1, cost: 6, weight: 0.3, tier: 'jumbo' },
  { id: 'mask_mega', name: 'Mega Mask Bundle', kind: 'mask', size: 4, picks: 2, cost: 8, weight: 0.1, tier: 'mega' },
  { id: 'card_normal', name: 'Card Bundle', kind: 'card', size: 3, picks: 1, cost: 4, weight: 4, tier: 'normal' },
  { id: 'card_jumbo', name: 'Jumbo Card Bundle', kind: 'card', size: 5, picks: 1, cost: 6, weight: 2, tier: 'jumbo' },
  { id: 'card_mega', name: 'Mega Card Bundle', kind: 'card', size: 5, picks: 2, cost: 8, weight: 0.5, tier: 'mega' },
];

export const PACK: Record<string, PackDef> = Object.fromEntries(PACKS.map((p) => [p.id, p]));
