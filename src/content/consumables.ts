// Fortunes (card magic), Constellations (hand upgrades) and Masks (risky rites).

import type { ConsDef } from '../game/api';
import type { HandTypeId, InkId, Rank, Suit, FinishId, SealId, Run } from '../core/types';
import { HAND_TYPES, SUIT_INFO, RANKS, SUITS } from '../core/cards';
import { sellValue, charmSlotsFree } from './charms';

export const FORTUNES: ConsDef[] = [];
export const STARS: ConsDef[] = [];
export const MASKS: ConsDef[] = [];

const F = (d: Omit<ConsDef, 'kind'>) => FORTUNES.push({ ...d, kind: 'fortune' });
const M = (d: Omit<ConsDef, 'kind'>) => MASKS.push({ ...d, kind: 'mask' });

const inkFortune = (id: string, name: string, ink: InkId, n: number, icon: string, hue: string, label: string) =>
  F({ id, name, icon, hue, targets: [1, n],
    text: `Inks up to {g:${n}} selected card${n > 1 ? 's' : ''} with {g:${label}}`,
    use: (_c, t) => t.forEach((k) => (k.ink = ink)) });

inkFortune('jade_brush', 'The Jade Brush', 'jade', 2, 'brush', '#3fcf8e', 'Jade Ink');
inkFortune('crimson_brush', 'The Crimson Brush', 'crimson', 2, 'brush', '#ff4b3a', 'Crimson Ink');
inkFortune('gold_leaf', 'The Gold Leaf', 'gilded', 1, 'coin', '#ffd23f', 'Gilded');
inkFortune('glass_bell', 'The Glass Bell', 'glass', 2, 'bell', '#bfe9ff', 'Glass');
inkFortune('millstone', 'The Millstone', 'stone', 1, 'mountain', '#a8b0c0', 'Stone');
inkFortune('rabbit_foot', 'The Rabbit’s Foot', 'lucky', 2, 'rabbit', '#7fe07a', 'Lucky');
inkFortune('wandering_spirit', 'The Wandering Spirit', 'spirit', 1, 'ghost', '#d8ffe0', 'Spirit Ink');
inkFortune('ash_urn', 'The Ash Urn', 'ash', 2, 'incense', '#b0a8a0', 'Ash');

const suitFortune = (id: string, name: string, suit: Suit, icon: string) =>
  F({ id, name, icon, hue: SUIT_INFO[suit].color, targets: [1, 3],
    text: `Converts up to {g:3} selected cards to {s:${suit}}`,
    use: (_c, t) => t.forEach((k) => { k.suit = suit; if (k.ink === 'stone') k.ink = undefined; }) });
suitFortune('the_moon', 'The Moon', 'moon', 'moon');
suitFortune('the_flame', 'The Flame', 'flame', 'flame');
suitFortune('the_leaf', 'The Leaf', 'leaf', 'leaf');
suitFortune('the_bell', 'The Bell', 'bell', 'bell');

F({ id: 'twin_paths', name: 'The Twin Paths', icon: 'bridge', hue: '#c9b8ff', targets: [2, 2],
  text: 'Select {g:2} cards. The {g:left} card becomes a copy of the {g:right} card',
  use: (_c, [a, b]) => { const id = a.id; Object.assign(a, { ...b, id }); if (!b.ink) delete a.ink; if (!b.seal) delete a.seal; if (!b.finish) delete a.finish; } });
F({ id: 'hanged_lantern', name: 'The Hanged Lantern', icon: 'lantern', hue: '#ff6b5a', targets: [1, 2],
  text: 'Destroys up to {g:2} selected cards',
  use: (c, t) => t.forEach((k) => c.destroyCard(k.id)) });
F({ id: 'rising_tide', name: 'The Rising Tide', icon: 'wave', hue: '#4fb6ff', targets: [1, 2],
  text: 'Raises the rank of up to {g:2} selected cards by {g:1}',
  use: (_c, t) => t.forEach((k) => { if (k.rank < 14) k.rank = (k.rank + 1) as Rank; }) });
F({ id: 'ebbing_tide', name: 'The Ebbing Tide', icon: 'wave', hue: '#7f9cff', targets: [1, 2],
  text: 'Lowers the rank of up to {g:2} selected cards by {g:1} {d:(Aces become Kings)}',
  use: (_c, t) => t.forEach((k) => { if (k.rank > 2) k.rank = (k.rank - 1) as Rank; }) });
F({ id: 'the_hermit', name: 'The Hermit', icon: 'jizo', hue: '#c7c1d9',
  text: 'Doubles your Embers {d:(max {$:20})}',
  use: (c) => c.money(Math.max(0, Math.min(20, c.run.money))) });
F({ id: 'the_echo', name: 'The Echo', icon: 'gong', hue: '#ffd27a',
  text: (run) => `Creates the last Fortune or Constellation used this run {d:(${run.lastCons ? consName(run.lastCons.kind, run.lastCons.id) : 'none'})}`,
  canUse: (run) => !!run.lastCons && run.lastCons.id !== 'the_echo',
  use: (c) => { const l = c.run.lastCons; if (l) c.createCons(l.kind, l.id); } });
F({ id: 'star_chart', name: 'The Star Chart', icon: 'map', hue: '#9fc7ff',
  text: 'Creates up to {g:2} random Constellations',
  use: (c) => { c.createCons('star'); c.createCons('star'); } });
F({ id: 'the_merchant', name: 'The Merchant', icon: 'purse', hue: '#e6c27a',
  text: 'Creates up to {g:2} random Fortunes',
  use: (c) => { c.createCons('fortune'); c.createCons('fortune'); } });
F({ id: 'the_summoning', name: 'The Summoning', icon: 'candle', hue: '#ff7a3d',
  text: 'Creates a random Charm {d:(must have room)}',
  canUse: (run) => charmRoom(run),
  use: (c) => { c.createCharm(); } });
F({ id: 'the_appraiser', name: 'The Appraiser', icon: 'scales', hue: '#ffd23f',
  text: (run) => `Gives the total sell value of all Charms {d:(max {$:50}, currently {$:${Math.min(50, run.charms.reduce((a, k) => a + sellValue(k), 0))}})}`,
  use: (c) => c.money(Math.min(50, c.run.charms.reduce((a, k) => a + sellValue(k), 0))) });
F({ id: 'the_wheel', name: 'The Wheel', icon: 'wheel', hue: '#ff9ad8',
  text: '{g:1 in 4} chance to add {g:Foil}, {g:Holographic} or {g:Prismatic} to a random Charm',
  canUse: (run) => run.charms.some((k) => !k.finish),
  use: (c) => {
    const pool = c.run.charms.filter((k) => !k.finish);
    if (!pool.length) return;
    if (c.chance(4)) {
      const f = c.rng.weighted(['foil', 'holo', 'prism'] as FinishId[], (x) => (x === 'foil' ? 5 : x === 'holo' ? 3.5 : 1.5));
      c.rng.pick(pool).finish = f;
      c.msg('Blessed!', '#ffd23f');
    } else c.msg('Nope!', '#ff6b5a');
  } });
F({ id: 'the_matchmaker', name: 'The Matchmaker', icon: 'heart', hue: '#ff7aa8', targets: [1, 1],
  text: 'Adds {g:2} copies of a selected card’s rank, in random suits, to your deck',
  use: (c, [a]) => { for (let i = 0; i < 2; i++) c.addCard({ rank: a.rank, suit: c.rng.pick(SUITS) }); } });

// --- Constellations ----------------------------------------------------------

const STAR_INFO: Record<string, { name: string; icon: string; hue: string }> = {
  pleiades: { name: 'The Pleiades', icon: 'seven', hue: '#ffe27a' },
  regulus: { name: 'Regulus', icon: 'crown', hue: '#ffcf3d' },
  cygnus: { name: 'Cygnus', icon: 'crane', hue: '#d8e6ff' },
  corvus: { name: 'Corvus', icon: 'crow', hue: '#9a8cff' },
  hydra: { name: 'Hydra', icon: 'snake', hue: '#7fe07a' },
  polaris: { name: 'Polaris', icon: 'star', hue: '#bfe9ff' },
  canis: { name: 'Canis Minor', icon: 'dog', hue: '#ffb07a' },
  sagitta: { name: 'Sagitta', icon: 'arrow', hue: '#ff8a5c' },
  crater: { name: 'Crater', icon: 'teacup', hue: '#7fd1ff' },
  libra: { name: 'Libra', icon: 'scales', hue: '#c7c1d9' },
};

for (const h of HAND_TYPES) {
  const s = STAR_INFO[h.star];
  STARS.push({
    id: h.star,
    kind: 'star',
    name: s.name,
    icon: s.icon,
    hue: s.hue,
    hand: h.id,
    text: (run) => `Levels up {h:${h.id}} {d:(Lv.${run.handLevels[h.id]})}: {c:+${h.lvChips}} Chips, {m:+${h.lvMult}} Mult`,
    use: (c) => c.levelUp(h.id, 1),
  });
}

// --- Masks ----------------------------------------------------------------------

const randInk = (c: { rng: { pick: <T>(a: readonly T[]) => T } }): InkId =>
  c.rng.pick(['jade', 'crimson', 'gilded', 'glass', 'lucky', 'spirit', 'ash'] as InkId[]);

const destroyRandom = (c: Parameters<ConsDef['use']>[0], n: number) => {
  for (let i = 0; i < n; i++) {
    if (!c.run.deck.length) return;
    c.destroyCard(c.rng.pick(c.run.deck).id);
  }
};

M({ id: 'fox_mask', name: 'Fox Mask', icon: 'fox', hue: '#ffb03d',
  text: 'Destroys {g:1} random card in your deck, adds {g:3} random inked face cards',
  use: (c) => { destroyRandom(c, 1); for (let i = 0; i < 3; i++) c.addCard({ rank: c.rng.pick([11, 12, 13] as Rank[]), ink: randInk(c) }); } });
M({ id: 'oni_mask', name: 'Oni Mask', icon: 'oni', hue: '#ff3d3d',
  text: 'Destroys {g:1} random card in your deck, adds {g:2} random inked Aces',
  use: (c) => { destroyRandom(c, 1); for (let i = 0; i < 2; i++) c.addCard({ rank: 14, ink: randInk(c) }); } });
M({ id: 'tengu_mask', name: 'Tengu Mask', icon: 'tengu', hue: '#ff5b3a',
  text: 'Destroys {g:1} random card in your deck, adds {g:4} random inked number cards',
  use: (c) => { destroyRandom(c, 1); for (let i = 0; i < 4; i++) c.addCard({ rank: c.rng.int(2, 10) as Rank, ink: randInk(c) }); } });

const sealMask = (id: string, name: string, seal: SealId, hue: string, label: string) =>
  M({ id, name, icon: 'stamp', hue, targets: [1, 1],
    text: `Adds a {g:${label}} to {g:1} selected card`,
    use: (_c, [a]) => { a.seal = seal; } });
sealMask('gold_mask', 'Gilded Mask', 'gold', '#ffd23f', 'Gold Seal');
sealMask('crimson_mask', 'Vermilion Mask', 'red', '#ff3d3d', 'Vermilion Seal');
sealMask('azure_mask', 'Azure Mask', 'blue', '#4f9dff', 'Azure Seal');
sealMask('violet_mask', 'Violet Mask', 'purple', '#b04dff', 'Violet Seal');

M({ id: 'hollow_mask', name: 'Hollow Mask', icon: 'blank', hue: '#e6f0ff', targets: [1, 1],
  text: 'Adds {g:Foil}, {g:Holographic} or {g:Prismatic} to {g:1} selected card',
  use: (c, [a]) => { a.finish = c.rng.weighted(['foil', 'holo', 'prism'] as FinishId[], (x) => (x === 'foil' ? 5 : x === 'holo' ? 3.5 : 1.5)); } });
M({ id: 'mirror_mask', name: 'Mirror Mask', icon: 'mirror', hue: '#c9b8ff', targets: [1, 1],
  text: 'Creates {g:2} copies of {g:1} selected card',
  use: (c, [a]) => { for (let i = 0; i < 2; i++) c.addCard({ ...a, id: undefined as unknown as number }); } });
M({ id: 'ghost_mask', name: 'Ghost Mask', icon: 'ghost', hue: '#d8ffe0',
  text: 'Adds {g:Phantom} to a random Charm. {r:-1 fold} each table, permanently',
  canUse: (run) => run.charms.some((k) => !k.finish),
  use: (c) => {
    const pool = c.run.charms.filter((k) => !k.finish);
    if (!pool.length) return;
    c.rng.pick(pool).finish = 'phantom';
    c.run.baseFolds = Math.max(0, c.run.baseFolds - 1);
  } });
M({ id: 'skull_mask', name: 'Skull Mask', icon: 'skull', hue: '#e9e2cf',
  text: 'Creates a copy of a random Charm, {r:destroys all others}',
  canUse: (run) => run.charms.length > 0,
  use: (c) => {
    const keep = c.rng.pick(c.run.charms);
    for (const k of [...c.run.charms]) if (k.uid !== keep.uid) c.destroyCharm(k.uid);
    c.createCharm({ id: keep.id, finish: keep.finish === 'phantom' ? undefined : keep.finish, force: true });
  } });
M({ id: 'hex_mask', name: 'Hex Mask', icon: 'oni', hue: '#b04dff',
  text: 'Adds {g:Prismatic} to a random Charm, {r:destroys all others}',
  canUse: (run) => run.charms.some((k) => !k.finish),
  use: (c) => {
    const pool = c.run.charms.filter((k) => !k.finish);
    const keep = c.rng.pick(pool);
    keep.finish = 'prism';
    for (const k of [...c.run.charms]) if (k.uid !== keep.uid) c.destroyCharm(k.uid);
  } });
M({ id: 'dragon_mask', name: 'Dragon Mask', icon: 'dragon', hue: '#4fdc8a',
  text: 'Creates a random {g:Rare} Charm. {r:Sets Embers to 0}',
  canUse: (run) => charmRoom(run),
  use: (c) => { c.createCharm({ rarity: 3 }); c.money(-Math.max(0, c.run.money)); } });
M({ id: 'crow_mask', name: 'Crow Mask', icon: 'crow', hue: '#6f6aa0', targets: [1, 5],
  text: 'Converts up to {g:5} selected cards to a single random suit',
  use: (c, t) => { const s = c.rng.pick(SUITS); t.forEach((k) => { k.suit = s; if (k.ink === 'stone') k.ink = undefined; }); } });
M({ id: 'moon_mask', name: 'Moon Mask', icon: 'moon', hue: '#b9c7ff', targets: [1, 5],
  text: 'Converts up to {g:5} selected cards to a single random rank. {r:-1 hand} each table, permanently',
  use: (c, t) => { const r = c.rng.pick(RANKS); t.forEach((k) => (k.rank = r)); c.run.baseHands = Math.max(1, c.run.baseHands - 1); } });
M({ id: 'void_mask', name: 'Void Mask', icon: 'spiral', hue: '#7a5cff',
  text: 'Levels up {g:every} hand type',
  use: (c) => { for (const h of HAND_TYPES) c.levelUp(h.id as HandTypeId, 1); } });
M({ id: 'pyre_mask', name: 'Pyre Mask', icon: 'bonfire', hue: '#ff6a2a',
  text: 'Destroys {g:5} random cards in your deck, gain {$:20}',
  use: (c) => { destroyRandom(c, 5); c.money(20); } });
M({ id: 'silent_mask', name: 'The Silent Mask', icon: 'blank', hue: '#ffd23f',
  text: 'Creates a {g:Legendary} Charm {d:(must have room)}',
  canUse: (run) => charmRoom(run),
  use: (c) => { c.createCharm({ rarity: 4 }); } });

// --- Helpers ----------------------------------------------------------------

function charmRoom(run: Run) {
  return charmSlotsFree(run) > 0;
}

export const CONS: Record<string, ConsDef> = Object.fromEntries(
  [...FORTUNES, ...STARS, ...MASKS].map((d) => [d.id, d]),
);

export function consName(kind: string, id: string): string {
  return CONS[id]?.name ?? id;
}

export function consText(id: string, run: Run): string {
  const d = CONS[id];
  if (!d) return '';
  return typeof d.text === 'function' ? d.text(run) : d.text;
}

export function consSellValue(_id: string, run: Run): number {
  return 1 + (run.flags.consBonus ?? 0);
}

