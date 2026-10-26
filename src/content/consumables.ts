// Tonics (card magic), Tall Tales (hand upgrades) and Moonshine (strong, with a cost).

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
    text: `Gives up to {g:${n}} selected card${n > 1 ? 's' : ''} {g:${label}} ink`,
    use: (_c, t) => t.forEach((k) => (k.ink = ink)) });

inkFortune('jade_brush', 'Dr. Greenleaf’s Elixir', 'jade', 2, 'dollar', '#3fcf8e', 'Greenback');
inkFortune('crimson_brush', 'Red-Eye Remedy', 'crimson', 2, 'pepper', '#ff4b3a', 'Red Hot');
inkFortune('gold_leaf', 'Gold Fever Tonic', 'gilded', 1, 'nugget', '#ffd23f', 'Gold Plated');
inkFortune('glass_bell', 'Liquid Glass', 'glass', 2, 'shotglass', '#bfe9ff', 'Glass');
inkFortune('millstone', 'Rock Candy', 'stone', 1, 'rock', '#a8b0c0', 'Rock');
inkFortune('rabbit_foot', 'Rabbit’s Foot Rub', 'lucky', 2, 'clover', '#7fe07a', 'Lucky');
inkFortune('wandering_spirit', 'Wild West Wonder Water', 'spirit', 1, 'spark', '#d8ffe0', 'Wild');
inkFortune('ash_urn', 'Squeaky Bath Salts', 'ash', 2, 'rubberduck', '#b0a8a0', 'Rubber Ducky');

const suitFortune = (id: string, name: string, suit: Suit, icon: string) =>
  F({ id, name, icon, hue: SUIT_INFO[suit].color, targets: [1, 3],
    text: `Changes up to {g:3} selected cards to {s:${suit}}`,
    use: (_c, t) => t.forEach((k) => { k.suit = suit; if (k.ink === 'stone') k.ink = undefined; }) });
suitFortune('the_moon', 'Horseshoe Hair Tonic', 'moon', 'horseshoe');
suitFortune('the_flame', 'Dynamite Dew', 'flame', 'dynamite');
suitFortune('the_leaf', 'Cactus Cordial', 'leaf', 'cactus');
suitFortune('the_bell', 'Star-Spangled Syrup', 'bell', 'badge');

F({ id: 'twin_paths', name: 'Copycat Cough Syrup', icon: 'mirror', hue: '#c9b8ff', targets: [2, 2],
  text: 'Select {g:2} cards. The {g:left} card becomes a copy of the {g:right} card',
  use: (_c, [a, b]) => { const id = a.id; Object.assign(a, { ...b, id }); if (!b.ink) delete a.ink; if (!b.seal) delete a.seal; if (!b.finish) delete a.finish; } });
F({ id: 'hanged_lantern', name: 'Vanishing Cream', icon: 'ghost', hue: '#ff6b5a', targets: [1, 2],
  text: 'Destroys up to {g:2} selected cards',
  use: (c, t) => t.forEach((k) => c.destroyCard(k.id)) });
F({ id: 'rising_tide', name: 'Grow-Big Formula', icon: 'spark', hue: '#4fb6ff', targets: [1, 2],
  text: 'Raises the rank of up to {g:2} selected cards by {g:1} {d:(Kings become Aces)}',
  use: (_c, t) => t.forEach((k) => { if (k.rank < 14) k.rank = (k.rank + 1) as Rank; }) });
F({ id: 'ebbing_tide', name: 'Shrinking Salts', icon: 'bubbles', hue: '#7f9cff', targets: [1, 2],
  text: 'Lowers the rank of up to {g:2} selected cards by {g:1} {d:(Aces become Kings)}',
  use: (_c, t) => t.forEach((k) => { if (k.rank > 2) k.rank = (k.rank - 1) as Rank; }) });
F({ id: 'the_hermit', name: 'Double-Down Draught', icon: 'coins', hue: '#c7c1d9',
  text: 'Doubles your Bucks {d:(max {$:20})}',
  use: (c) => c.money(Math.max(0, Math.min(20, c.run.money))) });
F({ id: 'the_echo', name: 'Same Again, Barkeep', icon: 'mug', hue: '#ffd27a',
  text: (run) => `Creates the last Tonic or Tall Tale used this run {d:(${run.lastCons ? consName(run.lastCons.kind, run.lastCons.id) : 'none'})}`,
  canUse: (run) => !!run.lastCons && run.lastCons.id !== 'the_echo',
  use: (c) => { const l = c.run.lastCons; if (l) c.createCons(l.kind, l.id); } });
F({ id: 'star_chart', name: 'Tall Tale Tincture', icon: 'book', hue: '#9fc7ff',
  text: 'Creates up to {g:2} random Tall Tales {d:(if you have room)}',
  use: (c) => { c.createCons('star'); c.createCons('star'); } });
F({ id: 'the_merchant', name: 'Two-for-One Special', icon: 'ticket', hue: '#e6c27a',
  text: 'Creates up to {g:2} random Tonics {d:(if you have room)}',
  use: (c) => { c.createCons('fortune'); c.createCons('fortune'); } });
F({ id: 'the_summoning', name: 'Summoning Sarsaparilla', icon: 'bottle', hue: '#ff7a3d',
  text: 'Creates a random Doodad {d:(needs a free Doodad slot)}',
  canUse: (run) => charmRoom(run),
  use: (c) => { c.createCharm(); } });
F({ id: 'the_appraiser', name: 'Appraiser’s Eye Drops', icon: 'eye', hue: '#ffd23f',
  text: (run) => `Gives the total sell value of all Doodads {d:(max {$:50}, currently {$:${Math.min(50, run.charms.reduce((a, k) => a + sellValue(k), 0))}})}`,
  use: (c) => c.money(Math.min(50, c.run.charms.reduce((a, k) => a + sellValue(k), 0))) });
F({ id: 'the_wheel', name: 'Roulette Remedy', icon: 'wagonwheel', hue: '#ff9ad8',
  text: '{g:1 in 4} chance to make a random Doodad {g:Shiny}, {g:Holographic} or {g:Prismatic}',
  canUse: (run) => run.charms.some((k) => !k.finish),
  use: (c) => {
    const pool = c.run.charms.filter((k) => !k.finish);
    if (!pool.length) return;
    if (c.chance(4)) {
      const f = c.rng.weighted(['foil', 'holo', 'prism'] as FinishId[], (x) => (x === 'foil' ? 5 : x === 'holo' ? 3.5 : 1.5));
      c.rng.pick(pool).finish = f;
      c.msg('Lucky!', '#ffd23f');
    } else c.msg('Nope!', '#ff6b5a');
  } });
F({ id: 'the_matchmaker', name: 'Love Potion No. 9', icon: 'heart', hue: '#ff7aa8', targets: [1, 1],
  text: 'Adds {g:2} copies of a selected card’s rank, in random suits, to your deck',
  use: (c, [a]) => { for (let i = 0; i < 2; i++) c.addCard({ rank: a.rank, suit: c.rng.pick(SUITS) }); } });

// --- Tall Tales -------------------------------------------------------------

const STAR_INFO: Record<string, { name: string; icon: string; hue: string }> = {
  pleiades: { name: 'The Seven-Shooter Saga', icon: 'revolver', hue: '#ffe27a' },
  regulus: { name: 'The Duke’s Duel', icon: 'crown', hue: '#ffcf3d' },
  cygnus: { name: 'Flock Together Folklore', icon: 'feather', hue: '#d8e6ff' },
  corvus: { name: 'The Quackjack Kid', icon: 'duck', hue: '#9a8cff' },
  hydra: { name: 'Ballad of the Charley Horse', icon: 'horse', hue: '#7fe07a' },
  polaris: { name: 'Dead-Eye Dan’s Legend', icon: 'bullet', hue: '#bfe9ff' },
  canis: { name: 'The Ugly Duckling', icon: 'duckling', hue: '#ffb07a' },
  sagitta: { name: 'High Noon Showdown', icon: 'pocketwatch', hue: '#ff8a5c' },
  crater: { name: 'How the Dealer Bit the Dust', icon: 'skull', hue: '#7fd1ff' },
  libra: { name: 'The Great Standoff', icon: 'flag', hue: '#c7c1d9' },
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
    text: (run) => `Levels up {h:${h.id}} {d:(Lv.${run.handLevels[h.id]})}: {c:+${h.lvChips}} Pot, {m:+${h.lvMult}} Odds`,
    use: (c) => c.levelUp(h.id, 1),
  });
}

// --- Moonshine ------------------------------------------------------------------

const randInk = (c: { rng: { pick: <T>(a: readonly T[]) => T } }): InkId =>
  c.rng.pick(['jade', 'crimson', 'gilded', 'glass', 'lucky', 'spirit', 'ash'] as InkId[]);

const destroyRandom = (c: Parameters<ConsDef['use']>[0], n: number) => {
  for (let i = 0; i < n; i++) {
    if (!c.run.deck.length) return;
    c.destroyCard(c.rng.pick(c.run.deck).id);
  }
};

M({ id: 'fox_mask', name: 'Face Card Firewater', icon: 'mustache', hue: '#ffb03d',
  text: 'Destroys {g:1} random card in your deck. Adds {g:3} face cards with random inks',
  use: (c) => { destroyRandom(c, 1); for (let i = 0; i < 3; i++) c.addCard({ rank: c.rng.pick([11, 12, 13] as Rank[]), ink: randInk(c) }); } });
M({ id: 'oni_mask', name: 'Ace-High Hooch', icon: 'cards', hue: '#ff3d3d',
  text: 'Destroys {g:1} random card in your deck. Adds {g:2} Aces with random inks',
  use: (c) => { destroyRandom(c, 1); for (let i = 0; i < 2; i++) c.addCard({ rank: 14, ink: randInk(c) }); } });
M({ id: 'tengu_mask', name: 'Numbers Racket Rotgut', icon: 'dice', hue: '#ff5b3a',
  text: 'Destroys {g:1} random card in your deck. Adds {g:4} number cards with random inks',
  use: (c) => { destroyRandom(c, 1); for (let i = 0; i < 4; i++) c.addCard({ rank: c.rng.int(2, 10) as Rank, ink: randInk(c) }); } });

const sealMask = (id: string, name: string, seal: SealId, hue: string, label: string) =>
  M({ id, name, icon: 'jug', hue, targets: [1, 1],
    text: `Adds a {g:${label}} to {g:1} selected card`,
    use: (_c, [a]) => { a.seal = seal; } });
sealMask('gold_mask', 'Gold Brand Bourbon', 'gold', '#ffd23f', 'Gold Brand');
sealMask('crimson_mask', 'Red Brand Rye', 'red', '#ff3d3d', 'Red Brand');
sealMask('azure_mask', 'Blue Brand Brandy', 'blue', '#4f9dff', 'Blue Brand');
sealMask('violet_mask', 'Purple Brand Punch', 'purple', '#b04dff', 'Purple Brand');

M({ id: 'hollow_mask', name: 'Spit Shine Whiskey', icon: 'spark', hue: '#e6f0ff', targets: [1, 1],
  text: 'Makes {g:1} selected card {g:Shiny}, {g:Holographic} or {g:Prismatic} at random',
  use: (c, [a]) => { a.finish = c.rng.weighted(['foil', 'holo', 'prism'] as FinishId[], (x) => (x === 'foil' ? 5 : x === 'holo' ? 3.5 : 1.5)); } });
M({ id: 'mirror_mask', name: 'Seeing Double', icon: 'glasses', hue: '#c9b8ff', targets: [1, 1],
  text: 'Creates {g:2} copies of {g:1} selected card',
  use: (c, [a]) => { for (let i = 0; i < 2; i++) c.addCard({ ...a, id: undefined as unknown as number }); } });
M({ id: 'ghost_mask', name: 'Ghost Town Gin', icon: 'ghost', hue: '#d8ffe0',
  text: 'A random Doodad becomes {g:Ghostly} {d:(takes up no slot)}. {r:-1 fold} each table for the rest of the run',
  canUse: (run) => run.charms.some((k) => !k.finish),
  use: (c) => {
    const pool = c.run.charms.filter((k) => !k.finish);
    if (!pool.length) return;
    c.rng.pick(pool).finish = 'phantom';
    c.run.baseFolds = Math.max(0, c.run.baseFolds - 1);
  } });
M({ id: 'skull_mask', name: 'Last Stand Liquor', icon: 'skull', hue: '#e9e2cf',
  text: 'Keeps {g:1} random Doodad and adds a copy of it. {r:Destroys all your other Doodads}',
  canUse: (run) => run.charms.length > 0,
  use: (c) => {
    const keep = c.rng.pick(c.run.charms);
    for (const k of [...c.run.charms]) if (k.uid !== keep.uid) c.destroyCharm(k.uid);
    c.createCharm({ id: keep.id, finish: keep.finish === 'phantom' ? undefined : keep.finish, force: true });
  } });
M({ id: 'hex_mask', name: 'Hex Hooch', icon: 'cauldron', hue: '#b04dff',
  text: 'A random Doodad becomes {g:Prismatic}. {r:Destroys all your other Doodads}',
  canUse: (run) => run.charms.some((k) => !k.finish),
  use: (c) => {
    const pool = c.run.charms.filter((k) => !k.finish);
    const keep = c.rng.pick(pool);
    keep.finish = 'prism';
    for (const k of [...c.run.charms]) if (k.uid !== keep.uid) c.destroyCharm(k.uid);
  } });
M({ id: 'dragon_mask', name: 'Kaboom Juice', icon: 'bomb', hue: '#4fdc8a',
  text: 'Creates a random {g:Rare} Doodad. {r:Sets Bucks to 0}',
  canUse: (run) => charmRoom(run),
  use: (c) => { c.createCharm({ rarity: 3 }); c.money(-Math.max(0, c.run.money)); } });
M({ id: 'crow_mask', name: 'Dust Storm Draft', icon: 'tornado', hue: '#6f6aa0', targets: [1, 5],
  text: 'Changes up to {g:5} selected cards to one random suit',
  use: (c, t) => { const s = c.rng.pick(SUITS); t.forEach((k) => { k.suit = s; if (k.ink === 'stone') k.ink = undefined; }); } });
M({ id: 'moon_mask', name: 'Moonshine Madness', icon: 'moon', hue: '#b9c7ff', targets: [1, 5],
  text: 'Changes up to {g:5} selected cards to one random rank. {r:-1 hand} each table for the rest of the run',
  use: (c, t) => { const r = c.rng.pick(RANKS); t.forEach((k) => (k.rank = r)); c.run.baseHands = Math.max(1, c.run.baseHands - 1); } });
M({ id: 'void_mask', name: 'Abduction Ale', icon: 'ufo', hue: '#7a5cff',
  text: 'Levels up {g:every} hand type',
  use: (c) => { for (const h of HAND_TYPES) c.levelUp(h.id as HandTypeId, 1); } });
M({ id: 'pyre_mask', name: 'Burn the Barn', icon: 'campfire', hue: '#ff6a2a',
  text: 'Destroys {g:5} random cards in your deck. Gain {$:20}',
  use: (c) => { destroyRandom(c, 5); c.money(20); } });
M({ id: 'silent_mask', name: 'The Legendary Jug', icon: 'jug', hue: '#ffd23f',
  text: 'Creates a {g:Legendary} Doodad {d:(needs a free Doodad slot)}',
  canUse: (run) => charmRoom(run),
  use: (c) => { c.createCharm({ rarity: 4 }); } });

// --- Helpers ----------------------------------------------------------------

function charmRoom(run: Run) {
  return charmSlotsFree(run) > 0;
}

// Doodads are gone: drop the Tonics and Moonshine that only worked on them.
const DOODAD_ONLY = new Set(['the_summoning', 'the_appraiser', 'the_wheel', 'ghost_mask', 'skull_mask', 'hex_mask', 'dragon_mask', 'silent_mask']);
for (const list of [FORTUNES, MASKS]) {
  for (let i = list.length - 1; i >= 0; i--) if (DOODAD_ONLY.has(list[i].id)) list.splice(i, 1);
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

