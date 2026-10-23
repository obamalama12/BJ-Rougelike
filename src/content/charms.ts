// The Charms: the spirits and trinkets that bend the rules of the table.
// Text tokens: {c:} chips, {m:} mult, {x:} xmult, {$:} embers, {g:} highlight,
// {s:suit} suit name, {h:handType} hand type name, {r:} warning, {d:} dim.

import type { CharmDef } from '../game/api';
import type { Card, CharmInst, HandTypeId, Run, Suit } from '../core/types';
import { isFace, isSuit, isTenValue, SUIT_INFO, rankName, HAND_TYPE } from '../core/cards';

export const CHARMS: CharmDef[] = [];
const C = (d: CharmDef) => {
  CHARMS.push(d);
  return d;
};

const st = (s: CharmInst) => s.state;
const isWin = (h?: HandTypeId) => !!h && h !== 'push';
const fmtX = (n: number) => `X${Math.round(n * 100) / 100}`;

// ---------------------------------------------------------------------------
// Plain power
// ---------------------------------------------------------------------------

C({ id: 'paper_lantern', name: 'Paper Lantern', rarity: 1, cost: 2, icon: 'lantern', hue: '#ff8a3d',
  text: '{m:+4} Mult',
  hand: (c) => c.mult(4) });

C({ id: 'onigiri', name: 'Onigiri', rarity: 1, cost: 3, icon: 'riceball', hue: '#e9e2cf',
  text: '{c:+40} Chips',
  hand: (c) => c.chips(40) });

C({ id: 'sake_cup', name: 'Sake Cup', rarity: 1, cost: 4, icon: 'sake', hue: '#d9d2ff',
  init: () => ({ m: 20 }),
  text: (s) => `{m:+${st(s).m}} Mult. Loses {m:1} Mult per hand played`,
  hand: (c, s) => c.mult(st(s).m),
  resolve: (c, s) => {
    if (c.copy || c.outcome === 'fold') return;
    st(s).m -= 1;
    if (st(s).m <= 0) { c.msg('Empty!'); c.destroyCharm(s.uid); }
  } });

C({ id: 'mochi', name: 'Dango Skewer', rarity: 1, cost: 4, icon: 'mochi', hue: '#ffb3c7',
  init: () => ({ c: 120 }),
  text: (s) => `{c:+${st(s).c}} Chips. Loses {c:6} Chips per hand played`,
  hand: (c, s) => c.chips(st(s).c),
  resolve: (c, s) => {
    if (c.copy || c.outcome === 'fold') return;
    st(s).c -= 6;
    if (st(s).c <= 0) { c.msg('Eaten!'); c.destroyCharm(s.uid); }
  } });

C({ id: 'persimmon', name: 'Persimmon', rarity: 1, cost: 5, icon: 'persimmon', hue: '#ff7a1a',
  text: '{m:+15} Mult. {g:1 in 6} chance to fall from the tree after each table',
  available: (run) => !run.flags.persimmonGone,
  hand: (c) => c.mult(15),
  tableEnd: (c, s) => {
    if (c.chance(6)) { c.msg('Fallen!'); c.run.flags.persimmonGone = true; c.destroyCharm(s.uid); }
  } });

C({ id: 'golden_persimmon', name: 'Golden Persimmon', rarity: 1, cost: 4, icon: 'persimmon', hue: '#ffd23f',
  text: '{x:X3} Mult. {g:1 in 1000} chance to fall after each table',
  available: (run) => !!run.flags.persimmonGone,
  hand: (c) => c.xmult(3),
  tableEnd: (c, s) => { if (c.chance(1000)) { c.msg('Fallen!'); c.destroyCharm(s.uid); } } });

C({ id: 'lantern_festival', name: 'Lantern Festival', rarity: 1, cost: 4, icon: 'pagoda', hue: '#ff5b3a',
  text: (s, run) => `{m:+3} Mult for each Charm you have {d:(currently {m:+${run.charms.length * 3}})}`,
  hand: (c) => c.mult(3 * c.run.charms.length) });

C({ id: 'empty_shrine', name: 'Empty Shrine', rarity: 2, cost: 8, icon: 'shrine', hue: '#c7c1d9',
  text: (s, run) => `{x:X1} Mult for each empty Charm slot. Counts itself {d:(currently {x:X${Math.max(1, charmSlotsFree(run) + 1)}})}`,
  hand: (c) => c.xmult(Math.max(1, charmSlotsFree(c.run) + 1)) });

C({ id: 'oni_drum', name: 'Oni Drum', rarity: 2, cost: 6, icon: 'drum', hue: '#ff3d3d',
  text: '{m:+20} Mult if you hit at least twice this hand',
  hand: (c) => { if ((c.hand?.hits ?? 0) >= 2) c.mult(20); } });

// ---------------------------------------------------------------------------
// Suits
// ---------------------------------------------------------------------------

const suitMult = (id: string, name: string, suit: Suit, icon: string, hue: string) =>
  C({ id, name, rarity: 1, cost: 5, icon, hue,
    text: `Scored {s:${suit}} cards give {m:+3} Mult`,
    card: (c, _s, card) => { if (isSuit(card, suit, c.rules)) c.mult(3); } });
suitMult('moon_rabbit', 'Moon Rabbit', 'moon', 'rabbit', '#9fb4ff');
suitMult('salamander', 'Salamander', 'flame', 'flame', '#ff6a3d');
suitMult('tree_frog', 'Tree Frog', 'leaf', 'frog', '#4fdc8a');
suitMult('wind_chime', 'Wind Chime', 'bell', 'bell', '#ffcf4a');

const suitChips = (id: string, name: string, suit: Suit, icon: string, hue: string) =>
  C({ id, name, rarity: 1, cost: 4, icon, hue,
    text: `Scored {s:${suit}} cards give {c:+30} Chips`,
    card: (c, _s, card) => { if (isSuit(card, suit, c.rules)) c.chips(30); } });
suitChips('silver_dew', 'Silver Dew', 'moon', 'moon', '#b9c7ff');
suitChips('charcoal', 'Charcoal Brazier', 'flame', 'bonfire', '#ff8a5c');
suitChips('moss_stone', 'Moss Stone', 'leaf', 'leaf', '#6ee7a8');
suitChips('brass_clapper', 'Brass Clapper', 'bell', 'gong', '#ffd76e');

C({ id: 'lunar_mirror', name: 'Lunar Mirror', rarity: 3, cost: 8, icon: 'mirror', hue: '#8fa6ff',
  text: 'Scored {s:moon} cards give {x:X1.3} Mult',
  card: (c, _s, card) => { if (isSuit(card, 'moon', c.rules)) c.xmult(1.3); } });
C({ id: 'ember_heart', name: 'Ember Heart', rarity: 2, cost: 7, icon: 'heart', hue: '#ff4b2b',
  text: 'Scored {s:flame} cards have a {g:1 in 2} chance to give {x:X1.5} Mult',
  card: (c, _s, card) => { if (isSuit(card, 'flame', c.rules) && c.chance(2)) c.xmult(1.5); } });
C({ id: 'jade_agate', name: 'Jade Agate', rarity: 2, cost: 7, icon: 'clover', hue: '#2fcf7a',
  text: 'Scored {s:leaf} cards give {m:+7} Mult',
  card: (c, _s, card) => { if (isSuit(card, 'leaf', c.rules)) c.mult(7); } });
C({ id: 'rough_gold', name: 'Rough Gold', rarity: 2, cost: 7, icon: 'coin', hue: '#ffc83d',
  text: 'Scored {s:bell} cards earn {$:1}',
  card: (c, _s, card) => { if (isSuit(card, 'bell', c.rules)) c.money(1); } });
C({ id: 'moon_arrow', name: 'Moon Arrow', rarity: 2, cost: 7, icon: 'arrow', hue: '#a0b0ff',
  text: 'Scored {s:moon} cards give {c:+50} Chips',
  card: (c, _s, card) => { if (isSuit(card, 'moon', c.rules)) c.chips(50); } });

C({ id: 'yin_talisman', name: 'Yin Talisman', rarity: 2, cost: 6, icon: 'stamp', hue: '#6f8cff',
  text: '{x:X2} Mult if every scored card is a {s:moon} or {s:leaf}',
  hand: (c) => { if (c.scored.length && c.scored.every((k) => isSuit(k, 'moon', c.rules) || isSuit(k, 'leaf', c.rules))) c.xmult(2); } });
C({ id: 'yang_talisman', name: 'Yang Talisman', rarity: 2, cost: 6, icon: 'sun', hue: '#ff9a3d',
  text: '{x:X2} Mult if every scored card is a {s:flame} or {s:bell}',
  hand: (c) => { if (c.scored.length && c.scored.every((k) => isSuit(k, 'flame', c.rules) || isSuit(k, 'bell', c.rules))) c.xmult(2); } });
C({ id: 'four_winds', name: 'Four Winds', rarity: 2, cost: 6, icon: 'pinwheel', hue: '#7fd1ff',
  text: '{x:X3} Mult if the hand contains a {s:moon}, {s:flame}, {s:leaf} and {s:bell}',
  hand: (c) => {
    const pool = [...c.scored];
    const need: Suit[] = ['moon', 'flame', 'leaf', 'bell'];
    // Greedy assignment, wild cards last.
    pool.sort((a, b) => (a.ink === 'spirit' ? 1 : 0) - (b.ink === 'spirit' ? 1 : 0));
    const used = new Set<number>();
    const ok = need.every((s) => {
      const k = pool.find((x) => !used.has(x.id) && isSuit(x, s, c.rules));
      if (k) used.add(k.id);
      return !!k;
    });
    if (ok) c.xmult(3);
  } });
C({ id: 'smudged_ink', name: 'Smudged Ink', rarity: 2, cost: 7, icon: 'inkstone', hue: '#9a8cff',
  text: '{s:moon} and {s:leaf} count as the same suit. {s:flame} and {s:bell} count as the same suit',
  rules: (r) => { r.smeared = true; } });
C({ id: 'koi_pond', name: 'Koi Pond', rarity: 1, cost: 5, icon: 'koi', hue: '#ff7a3d',
  text: '{m:+12} Mult if every scored card shares a suit',
  hand: (c) => {
    if (!c.scored.length) return;
    if ((['moon', 'flame', 'leaf', 'bell'] as Suit[]).some((s) => c.scored.every((k) => isSuit(k, s, c.rules)))) c.mult(12);
  } });

// ---------------------------------------------------------------------------
// Ranks
// ---------------------------------------------------------------------------

C({ id: 'ace_of_embers', name: 'Ace of Embers', rarity: 1, cost: 4, icon: 'spark', hue: '#ffb03d',
  text: 'Scored Aces give {c:+20} Chips and {m:+4} Mult',
  card: (c, _s, card) => { if (card.rank === 14 && card.ink !== 'stone') { c.chips(20); c.mult(4); } } });
C({ id: 'court_painter', name: 'Court Painter', rarity: 1, cost: 4, icon: 'brush', hue: '#f3d7a6',
  text: 'Scored face cards give {c:+30} Chips',
  card: (c, _s, card) => { if (isFace(card, c.rules)) c.chips(30); } });
C({ id: 'theater_mask', name: 'Noh Mask', rarity: 1, cost: 4, icon: 'blank', hue: '#f7ecd2',
  text: 'Scored face cards give {m:+5} Mult',
  card: (c, _s, card) => { if (isFace(card, c.rules)) c.mult(5); } });
C({ id: 'small_fry', name: 'Small Fry', rarity: 1, cost: 5, icon: 'koi', hue: '#ffcf8a',
  text: 'Scored cards ranked {g:2-5} give {m:+5} Mult',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank <= 5) c.mult(5); } });
C({ id: 'twin_koi', name: 'Twin Koi', rarity: 1, cost: 4, icon: 'koi', hue: '#ff9a7a',
  text: 'Scored even cards {d:(10, 8, 6, 4, 2)} give {m:+4} Mult',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank <= 10 && card.rank % 2 === 0) c.mult(4); } });
C({ id: 'lone_heron', name: 'Lone Heron', rarity: 1, cost: 4, icon: 'heron', hue: '#cfe3ff',
  text: 'Scored odd cards {d:(A, 9, 7, 5, 3)} give {c:+31} Chips',
  card: (c, _s, card) => { if (card.ink !== 'stone' && (card.rank === 14 || (card.rank <= 9 && card.rank % 2 === 1))) c.chips(31); } });
C({ id: 'spiral_shell', name: 'Spiral Shell', rarity: 2, cost: 8, icon: 'shell', hue: '#ffc6a8',
  text: 'Scored {g:A, 2, 3, 5, 8} give {m:+8} Mult',
  card: (c, _s, card) => { if (card.ink !== 'stone' && [14, 2, 3, 5, 8].includes(card.rank)) c.mult(8); } });
C({ id: 'woodpecker', name: 'Woodpecker', rarity: 2, cost: 6, icon: 'feather', hue: '#ff6b5a',
  text: 'Retrigger each scored {g:2, 3, 4 or 5}',
  retrig: (_c, _s, card) => (card.ink !== 'stone' && card.rank <= 5 ? 1 : 0) });
C({ id: 'puppeteer', name: 'Puppeteer', rarity: 2, cost: 6, icon: 'hand', hue: '#e6b8ff',
  text: 'Retrigger each scored face card',
  retrig: (c, _s, card) => (isFace(card, c.rules) ? 1 : 0) });
C({ id: 'seven_gods', name: 'Seven Lucky Gods', rarity: 2, cost: 7, icon: 'seven', hue: '#ffd23f',
  text: 'Scored 7s give {x:X1.5} Mult',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank === 7) c.xmult(1.5); } });
C({ id: 'tenfold_fan', name: 'Tenfold Fan', rarity: 1, cost: 5, icon: 'fan', hue: '#ff7aa8',
  text: 'Scored 10s give {m:+10} Mult',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank === 10) c.mult(10); } });
C({ id: 'ink_portrait', name: 'Ink Portrait', rarity: 1, cost: 5, icon: 'scroll', hue: '#e9dcc0',
  text: 'The first scored face card gives {x:X2} Mult',
  card: (c, _s, card) => { if (isFace(card, c.rules) && c.scored.find((k) => isFace(k, c.rules))?.id === card.id) c.xmult(2); } });
C({ id: 'tanuki_lord', name: 'Tanuki Lord', rarity: 3, cost: 8, icon: 'tanuki', hue: '#c08a5a',
  text: 'Scored Kings give {x:X1.5} Mult',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank === 13) c.xmult(1.5); } });
C({ id: 'moon_princess', name: 'Moon Princess', rarity: 1, cost: 5, icon: 'moon', hue: '#ffe2f0',
  text: 'Scored Queens give {m:+13} Mult',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank === 12) c.mult(13); } });
C({ id: 'jack_o_kite', name: 'Kite Jack', rarity: 1, cost: 5, icon: 'kite', hue: '#7fe0ff',
  text: 'Scored Jacks give {c:+11} Chips and {m:+3} Mult',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank === 11) { c.chips(11); c.mult(3); } } });
C({ id: 'paper_telephone', name: 'Paper Telephone', rarity: 1, cost: 4, icon: 'teacup', hue: '#b6f0c9',
  text: 'Scored 10s and 4s give {c:+10} Chips and {m:+4} Mult',
  card: (c, _s, card) => { if (card.ink !== 'stone' && (card.rank === 10 || card.rank === 4)) { c.chips(10); c.mult(4); } } });
C({ id: 'kodama', name: 'Tiny Kodama', rarity: 3, cost: 8, icon: 'ghost', hue: '#d8ffe0',
  init: () => ({ c: 0 }),
  text: (s) => `Gains {c:+8} Chips each time a {g:2} is scored {d:(currently {c:+${st(s).c}})}`,
  card: (c, s, card) => {
    if (card.ink !== 'stone' && card.rank === 2 && !c.copy) { st(s).c += 8; c.msg('Grow!'); }
  },
  hand: (c, s) => { if (st(s).c) c.chips(st(s).c); } });
C({ id: 'pilgrim', name: 'Pilgrim', rarity: 2, cost: 5, icon: 'sandal', hue: '#d9b38c',
  text: 'Every scored card permanently gains {c:+5} Chips',
  card: (c, _s, card) => { if (!c.copy) { card.bonus = (card.bonus ?? 0) + 5; c.msg('+5', '#4fb6ff'); } } });
C({ id: 'ace_hunter', name: 'Ace Hunter', rarity: 2, cost: 6, icon: 'arrow', hue: '#ff8a5c',
  text: '{x:X2.5} Mult if you win against a dealer showing an Ace',
  hand: (c) => { if (isWin(c.handType) && c.dealerCards[0]?.rank === 14) c.xmult(2.5); } });
C({ id: 'nine_tails', name: 'Nine-Tailed Fox', rarity: 2, cost: 7, icon: 'fox', hue: '#ffcf6a',
  text: (s, run) => `Earn {$:1} for each {g:9} in your deck at the end of a table {d:(currently {$:${run.deck.filter((c) => c.rank === 9 && c.ink !== 'stone').length}})}`,
  endMoney: (run) => run.deck.filter((c) => c.rank === 9 && c.ink !== 'stone').length });
C({ id: 'face_collector', name: 'Mask Collector', rarity: 1, cost: 5, icon: 'oni', hue: '#ff6b6b',
  text: '{m:+3} Mult for each face card in the hand, {m:+6} if the dealer’s upcard is a face card too',
  hand: (c) => {
    const n = c.scored.filter((k) => isFace(k, c.rules)).length;
    if (!n) return;
    const up = c.dealerCards[0];
    c.mult(n * (up && isFace(up, c.rules) ? 6 : 3));
  } });

// ---------------------------------------------------------------------------
// Hand types
// ---------------------------------------------------------------------------

const typeFlat = (id: string, name: string, ht: HandTypeId[], icon: string, hue: string, chips: number, mult: number, rarity: 1 | 2 = 1) =>
  C({ id, name, rarity, cost: rarity === 1 ? 4 : 6, icon, hue,
    text: `${mult ? `{m:+${mult}} Mult` : ''}${mult && chips ? ' and ' : ''}${chips ? `{c:+${chips}} Chips` : ''} if the hand is ${ht.map((h) => `{h:${h}}`).join(' or ')}`,
    hand: (c) => { if (c.handType && ht.includes(c.handType)) { if (chips) c.chips(chips); if (mult) c.mult(mult); } } });

typeFlat('crow_due', 'Crow’s Due', ['blackjack', 'royal'], 'crow', '#9a8cff', 0, 10);
typeFlat('north_star', 'North Star', ['twentyone', 'flush'], 'star', '#ffe27a', 0, 12);
typeFlat('fishing_net', 'Fishing Net', ['charlie'], 'net', '#7fd1ff', 120, 0);
typeFlat('thunder_drum', 'Thunder Drum', ['dealerbust'], 'drum', '#ffd23f', 0, 8);
typeFlat('stray_dog', 'Stray Dog', ['underdog'], 'dog', '#d9a066', 0, 15);
typeFlat('archer_glove', 'Archer’s Glove', ['outdraw'], 'arrow', '#ff9a5c', 30, 5);
typeFlat('crane_wings', 'Paper Crane', ['outdraw', 'dealerbust'], 'crane', '#f7ecd2', 50, 0);
typeFlat('lucky_whale', 'Lucky Whale', ['charlie', 'underdog'], 'whale', '#4f9dff', 0, 10, 2);

const typeX = (id: string, name: string, ht: HandTypeId[], icon: string, hue: string, x: number, rarity: 2 | 3) =>
  C({ id, name, rarity, cost: rarity === 2 ? 7 : 9, icon, hue,
    text: `{x:X${x}} Mult if the hand is ${ht.map((h) => `{h:${h}}`).join(' or ')}`,
    hand: (c) => { if (c.handType && ht.includes(c.handType)) c.xmult(x); } });

typeX('raven_king', 'Raven King', ['blackjack', 'royal'], 'crown', '#8f7bff', 3, 3);
typeX('polar_star', 'Polar Star', ['twentyone', 'flush'], 'comet', '#a8e8ff', 2.5, 3);
typeX('thousand_legs', 'Thousand Legs', ['charlie'], 'centipede', '#ff7a3d', 3, 3);
typeX('raijin', 'Raijin’s Drum', ['dealerbust'], 'lightning', '#ffe15a', 2, 2);
typeX('scrappy_cur', 'Scrappy Cur', ['underdog'], 'dog', '#ffb07a', 2.5, 2);
typeX('kyudo_master', 'Kyudo Master', ['outdraw'], 'bow', '#ff6a3d', 1.75, 2);

C({ id: 'balance_stone', name: 'Balance Stone', rarity: 2, cost: 6, icon: 'scales', hue: '#b8c4d9',
  text: '{h:push} hands give {x:X4} Mult and earn {$:2}',
  hand: (c) => { if (c.handType === 'push') { c.xmult(4); c.money(2); } } });

C({ id: 'old_almanac', name: 'Old Almanac', rarity: 2, cost: 6, icon: 'book', hue: '#e6c27a',
  text: 'Adds the number of times the hand type has been played this run to Mult',
  hand: (c) => { if (c.handType) c.mult(c.run.handPlays[c.handType] ?? 0); } });

C({ id: 'rolling_daruma', name: 'Rolling Daruma', rarity: 1, cost: 5, icon: 'daruma', hue: '#ff3d3d',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+2} Mult for each consecutive winning hand. Resets on a loss {d:(currently {m:+${st(s).m}})}`,
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); },
  resolve: (c, s) => {
    if (c.copy || c.outcome === 'fold') return;
    if (isWin(c.handType)) { st(s).m += 2; c.msg('Roll!'); }
    else if (c.outcome !== 'push') { if (st(s).m) c.msg('Fell!'); st(s).m = 0; }
  } });

C({ id: 'bamboo_shoot', name: 'Bamboo Shoot', rarity: 1, cost: 4, icon: 'bamboo', hue: '#6ee7a8',
  init: () => ({ m: 0 }),
  text: (s) => `{m:+1} Mult per hand won, {m:-1} per hand lost {d:(currently {m:+${st(s).m}})}`,
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); },
  resolve: (c, s) => {
    if (c.copy || c.outcome === 'fold') return;
    if (isWin(c.handType)) st(s).m += 1;
    else if (c.outcome !== 'push') st(s).m = Math.max(0, st(s).m - 1);
  } });

C({ id: 'centipede', name: 'Lantern Runner', rarity: 1, cost: 5, icon: 'centipede', hue: '#ffb03d',
  init: () => ({ c: 0 }),
  text: (s) => `Gains {c:+20} Chips whenever you win a {h:charlie} {d:(currently {c:+${st(s).c}})}`,
  hand: (c, s) => { if (st(s).c) c.chips(st(s).c); },
  after: (c, s) => { if (c.handType === 'charlie') { st(s).c += 20; c.msg('Upgrade!'); } } });

C({ id: 'abacus', name: 'Abacus', rarity: 2, cost: 6, icon: 'abacus', hue: '#e6b87a',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+3} Mult whenever your hand totals exactly 21 {d:(currently {m:+${st(s).m}})}`,
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); },
  after: (c, s) => { if (c.total === 21) { st(s).m += 3; c.msg('Upgrade!'); } } });

C({ id: 'square_seal', name: 'Square Seal', rarity: 1, cost: 4, icon: 'stamp', hue: '#ff6b5a',
  init: () => ({ c: 0 }),
  text: (s) => `Gains {c:+6} Chips if the winning hand has exactly {g:4} cards {d:(currently {c:+${st(s).c}})}`,
  hand: (c, s) => { if (st(s).c) c.chips(st(s).c); },
  after: (c, s) => { if (c.cards.length === 4) { st(s).c += 6; c.msg('Upgrade!'); } } });

C({ id: 'echo_gong', name: 'Echo Gong', rarity: 2, cost: 6, icon: 'gong', hue: '#ffd27a',
  text: '{x:X2.5} Mult if this hand type was already scored this table',
  hand: (c) => { if (c.handType && c.table && c.table.typesPlayed.slice(0, -1).includes(c.handType)) c.xmult(2.5); } });

C({ id: 'sore_loser', name: 'Sore Loser', rarity: 1, cost: 5, icon: 'monkey', hue: '#ff9a5c',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+4} Mult whenever you lose or bust. Resets after a win {d:(currently {m:+${st(s).m}})}`,
  hand: (c, s) => { if (st(s).m && isWin(c.handType)) c.mult(st(s).m); },
  resolve: (c, s) => {
    if (c.copy) return;
    if (c.outcome === 'lose' || c.outcome === 'bust') { st(s).m += 4; c.msg('Grr!'); }
    else if (isWin(c.handType)) st(s).m = 0;
  } });

// ---------------------------------------------------------------------------
// Blackjack mechanics
// ---------------------------------------------------------------------------

C({ id: 'ogre_belly', name: 'Ogre’s Belly', rarity: 3, cost: 9, icon: 'oni', hue: '#ff4d4d',
  text: 'You bust over {g:22} instead of {g:21}',
  rules: (r) => { r.bustLimit += 1; } });
C({ id: 'four_leaf', name: 'Four-Leaf Clover', rarity: 3, cost: 9, icon: 'clover', hue: '#4fdc8a',
  text: '{h:charlie} needs only {g:4} cards',
  rules: (r) => { r.charlieSize = Math.min(r.charlieSize, 4); } });
C({ id: 'hungry_ghost', name: 'Hungry Ghost', rarity: 1, cost: 5, icon: 'ghost', hue: '#c8d6ff',
  text: 'The dealer must hit until {g:18}. {m:+4} Mult if the dealer busts',
  rules: (r) => { r.dealerStand = Math.max(r.dealerStand, 18); },
  hand: (c) => { if (c.dealerBusted) c.mult(4); } });
C({ id: 'third_eye', name: 'Third Eye', rarity: 2, cost: 6, icon: 'eye', hue: '#ff7ad9',
  text: 'See the dealer’s hole card',
  rules: (r) => { r.seeHole = true; } });
C({ id: 'scrying_bowl', name: 'Scrying Bowl', rarity: 2, cost: 7, icon: 'crystal', hue: '#9fe8ff',
  text: 'See the top card of the shoe',
  rules: (r) => { r.seeTop = Math.max(r.seeTop, 1); } });
C({ id: 'paper_umbrella', name: 'Paper Umbrella', rarity: 1, cost: 5, icon: 'umbrella', hue: '#ff6b8a',
  text: 'If the dealer has a natural Blackjack, the hand is not used up',
  rules: (r) => { r.insurance = true; } });
C({ id: 'double_happiness', name: 'Double Happiness', rarity: 3, cost: 8, icon: 'lantern', hue: '#ff3d3d',
  text: 'Doubling Down no longer costs an extra hand',
  rules: (r) => { r.doubleCost = 0; } });
C({ id: 'mirror_twins', name: 'Mirror Twins', rarity: 2, cost: 7, icon: 'mirror', hue: '#c9b8ff',
  text: 'Splitting costs no extra hand. You may split any two 10-value cards',
  rules: (r) => { r.splitCost = 0; r.splitAnyTen = true; } });
C({ id: 'lucky_coin', name: 'Lucky Coin', rarity: 2, cost: 7, icon: 'coin', hue: '#ffd23f',
  text: 'Doubled hands give {x:X3} Mult instead of {x:X2}',
  rules: (r) => { r.doubleX = Math.max(r.doubleX, 3); } });
C({ id: 'golden_carp', name: 'Golden Carp', rarity: 3, cost: 8, icon: 'koi', hue: '#ffcf3d',
  text: 'Winning with a natural {h:blackjack} gives back {g:+1} hand',
  after: (c) => { if ((c.handType === 'blackjack' || c.handType === 'royal') && c.table) { c.table.handsLeft += 1; c.msg('+1 Hand', '#4fb6ff'); } } });
C({ id: 'shrine_fox', name: 'Shrine Fox', rarity: 2, cost: 6, icon: 'fox', hue: '#ff9a3d',
  text: 'The first time you bust each table, it counts as a {h:push} instead',
  bust: (c) => {
    if (!c.table || c.table.bustSaved) return false;
    c.table.bustSaved = true;
    c.msg('Spared!');
    return true;
  } });
C({ id: 'phoenix_feather', name: 'Phoenix Feather', rarity: 2, cost: 7, icon: 'feather', hue: '#ff5b2a',
  text: 'Once per table, the card that would bust you burns away instead',
  bust: () => false });
C({ id: 'folded_fan', name: 'Folded Fan', rarity: 1, cost: 5, icon: 'fan', hue: '#ffa8d0',
  text: (s, run) => `{c:+30} Chips for each fold remaining {d:(currently {c:+${(run.table?.foldsLeft ?? 0) * 30}})}`,
  hand: (c) => { if (c.table?.foldsLeft) c.chips(30 * c.table.foldsLeft); } });
C({ id: 'empty_bowl', name: 'Empty Bowl', rarity: 1, cost: 5, icon: 'bowl', hue: '#e9e2cf',
  text: '{m:+15} Mult when you have {g:0} folds remaining',
  hand: (c) => { if (c.table && c.table.foldsLeft === 0) c.mult(15); } });
C({ id: 'patient_monk', name: 'Patient Monk', rarity: 1, cost: 4, icon: 'jizo', hue: '#c7c1d9',
  text: 'Earn {$:2} per fold remaining at the end of a table if you didn’t fold',
  endMoney: (run) => (run.table && run.table.foldsUsed === 0 ? run.table.foldsLeft * 2 : 0) });
C({ id: 'incense_burner', name: 'Incense Burner', rarity: 3, cost: 8, icon: 'incense', hue: '#d6b8ff',
  text: 'The first fold of each table levels up your most played hand type',
  fold: (c) => {
    if (!c.table || c.table.firstFoldDone) return;
    const ht = mostPlayed(c.run);
    c.levelUp(ht, 1);
    c.msg('Level up!');
  } });
C({ id: 'rag_picker', name: 'Rag Picker', rarity: 2, cost: 6, icon: 'broom', hue: '#c9a37a',
  text: 'If the first fold of a table has exactly {g:2} cards, destroy them and earn {$:3}',
  fold: (c, _s, cards) => {
    if (!c.table || c.table.firstFoldDone || cards.length !== 2 || c.copy) return;
    for (const k of cards) c.destroyCard(k.id);
    c.money(3);
  } });
C({ id: 'faceless_one', name: 'Faceless One', rarity: 1, cost: 4, icon: 'blank', hue: '#e0d8c8',
  text: 'Earn {$:5} when you fold a hand with {g:2} or more face cards',
  fold: (c, _s, cards) => { if (cards.filter((k) => isFace(k, c.rules)).length >= 2) c.money(5); } });
C({ id: 'pawnbroker', name: 'Pawnbroker', rarity: 1, cost: 4, icon: 'purse', hue: '#e6c27a',
  text: (s, run) => `Earn {$:4} for each folded {g:${rankName(run.rotating.rank)}}. Rank changes every table`,
  fold: (c, _s, cards) => { const n = cards.filter((k) => k.ink !== 'stone' && k.rank === c.run.rotating.rank).length; if (n) c.money(4 * n); } });
C({ id: 'moth_collector', name: 'Moth Collector', rarity: 2, cost: 6, icon: 'moth', hue: '#d9c7ff',
  init: () => ({ c: 0 }),
  text: (s, run) => `Gains {c:+4} Chips per folded {s:${run.rotating.suit2}} card. Suit changes every table {d:(currently {c:+${st(s).c}})}`,
  fold: (c, s, cards) => { if (c.copy) return; const n = cards.filter((k) => isSuit(k, c.run.rotating.suit2, c.rules)).length; if (n) { st(s).c += 4 * n; c.msg('Upgrade!'); } },
  hand: (c, s) => { if (st(s).c) c.chips(st(s).c); } });
C({ id: 'ramen', name: 'Midnight Ramen', rarity: 2, cost: 6, icon: 'bowl', hue: '#ffcf8a',
  init: () => ({ x: 2 }),
  text: (s) => `{x:${fmtX(st(s).x)}} Mult. Loses {x:X0.02} Mult per card folded`,
  hand: (c, s) => c.xmult(st(s).x),
  fold: (c, s, cards) => {
    if (c.copy) return;
    st(s).x = Math.round((st(s).x - 0.02 * cards.length) * 100) / 100;
    if (st(s).x <= 1) { c.msg('Slurped!'); c.destroyCharm(s.uid); }
  } });
C({ id: 'kite_runner', name: 'Riverboat Gambler', rarity: 1, cost: 4, icon: 'boat', hue: '#7fb8ff',
  text: '{m:+3} Mult for each hit taken this hand',
  hand: (c) => { const h = c.hand?.hits ?? 0; if (h) c.mult(3 * h); } });
C({ id: 'stoic_monk', name: 'Stoic Monk', rarity: 1, cost: 4, icon: 'teacup', hue: '#b6e3c9',
  text: '{c:+60} Chips if you won without hitting',
  hand: (c) => { if (isWin(c.handType) && (c.hand?.hits ?? 0) === 0) c.chips(60); } });
C({ id: 'stacked_stones', name: 'Stacked Stones', rarity: 1, cost: 4, icon: 'mountain', hue: '#b8c4d9',
  text: '{m:+4} Mult for each card in the hand beyond the second',
  hand: (c) => { const n = c.cards.length - 2; if (n > 0) c.mult(4 * n); } });
C({ id: 'tightrope', name: 'Tightrope Walker', rarity: 2, cost: 6, icon: 'rope', hue: '#ffcf8a',
  text: '{x:X1.5} Mult if your total is {g:20} or more',
  hand: (c) => { if (c.total >= 20) c.xmult(1.5); } });
C({ id: 'low_tide', name: 'Low Tide', rarity: 1, cost: 5, icon: 'wave', hue: '#4fb6ff',
  text: '{m:+3} Mult for each point your total is below 21',
  hand: (c) => { const d = 21 - c.total; if (d > 0) c.mult(3 * d); } });
C({ id: 'measuring_stick', name: 'Measuring Stick', rarity: 1, cost: 4, icon: 'scroll', hue: '#e9dcc0',
  text: '{c:+15} Chips for each point you beat the dealer by',
  hand: (c) => { if (!c.dealerBusted && c.total > c.dealerTotal) c.chips(15 * (c.total - c.dealerTotal)); } });
C({ id: 'heckling_crow', name: 'Heckling Crow', rarity: 1, cost: 4, icon: 'crow', hue: '#9a8cff',
  text: 'Earn {$:2} whenever the dealer busts',
  resolve: (c, s) => { if (c.dealerBusted && c.hand && !c.hand.fromSplit && !c.copy) c.money(2); } });
C({ id: 'paper_tiger', name: 'Paper Tiger', rarity: 1, cost: 5, icon: 'kite', hue: '#ffb03d',
  text: '{m:+10} Mult if the dealer’s upcard is {g:4, 5 or 6}',
  hand: (c) => { const u = c.dealerCards[0]; if (u && u.ink !== 'stone' && u.rank >= 4 && u.rank <= 6) c.mult(10); } });
C({ id: 'bean_counter', name: 'Bean Counter', rarity: 2, cost: 6, icon: 'abacus', hue: '#c9e67a',
  text: (s, run) => `{m:+2} Mult for each point of the shoe’s running count {d:(low cards seen minus high cards seen; currently {m:+${Math.max(0, runningCount(run)) * 2}})}`,
  hand: (c) => { const n = runningCount(c.run); if (n > 0) c.mult(2 * n); } });
C({ id: 'deep_well', name: 'Deep Well', rarity: 1, cost: 5, icon: 'bowl', hue: '#4f9dff',
  text: (s, run) => `{c:+3} Chips for each card left in the shoe {d:(currently {c:+${(run.table?.shoe.length ?? run.deck.length) * 3}})}`,
  hand: (c) => { if (c.table) c.chips(3 * c.table.shoe.length); } });
C({ id: 'river_stone', name: 'River Stone', rarity: 2, cost: 6, icon: 'wave', hue: '#9fc7ff',
  text: (s, run) => `{m:+4} Mult for each card your deck is below its starting size {d:(currently {m:+${Math.max(0, startSize(run) - run.deck.length) * 4}})}`,
  hand: (c) => { const n = startSize(c.run) - c.run.deck.length; if (n > 0) c.mult(4 * n); } });
C({ id: 'tired_dealer', name: 'Tired Dealer', rarity: 1, cost: 4, icon: 'hourglass', hue: '#d9c7a0',
  text: '{m:+4} Mult for each card in the dealer’s hand',
  hand: (c) => { if (c.dealerCards.length) c.mult(4 * c.dealerCards.length); } });
C({ id: 'giant_slayer', name: 'Giant Slayer', rarity: 2, cost: 7, icon: 'sword', hue: '#ff6a5a',
  text: '{x:X2} Mult if you beat a dealer total of {g:19} or more',
  hand: (c) => { if (isWin(c.handType) && !c.dealerBusted && c.dealerTotal >= 19) c.xmult(2); } });
C({ id: 'chopsticks', name: 'Chopsticks', rarity: 1, cost: 4, icon: 'bowl', hue: '#ffb07a',
  text: '{m:+12} Mult if the hand has exactly {g:2} cards',
  hand: (c) => { if (c.cards.length === 2) c.mult(12); } });
C({ id: 'three_monkeys', name: 'Three Monkeys', rarity: 2, cost: 6, icon: 'monkey', hue: '#d9a066',
  text: '{x:X1.75} Mult if the hand has exactly {g:3} cards',
  hand: (c) => { if (c.cards.length === 3) c.xmult(1.75); } });
C({ id: 'kite_string', name: 'Kite String', rarity: 1, cost: 4, icon: 'kite', hue: '#ff8ab3',
  text: '{c:+15} Chips for each card in the hand',
  hand: (c) => c.chips(15 * c.cards.length) });
C({ id: 'double_dragon', name: 'Double Dragon', rarity: 2, cost: 7, icon: 'dragon', hue: '#4fdc8a',
  text: 'Doubled hands also gain {c:+100} Chips',
  hand: (c) => { if (c.hand?.doubled) c.chips(100); } });
C({ id: 'split_bamboo', name: 'Split Bamboo', rarity: 2, cost: 6, icon: 'bamboo', hue: '#9be37a',
  text: 'Hands created by splitting give {x:X2} Mult',
  hand: (c) => { if (c.hand?.fromSplit) c.xmult(2); } });
C({ id: 'dawn_rooster', name: 'Dawn Rooster', rarity: 2, cost: 6, icon: 'rooster', hue: '#ff9a3d',
  text: '{x:X2} Mult on the first hand of each table',
  hand: (c) => { if (c.isFirst) c.xmult(2); } });
C({ id: 'dusk_crane', name: 'Dusk Crane', rarity: 2, cost: 7, icon: 'crane', hue: '#ff7aa8',
  text: '{x:X3} Mult on the final hand of each table',
  hand: (c) => { if (c.isLast) c.xmult(3); } });
C({ id: 'twilight_bell', name: 'Twilight Bell', rarity: 2, cost: 6, icon: 'bell', hue: '#c9a3ff',
  text: 'Retrigger every scored card on the final hand of each table',
  retrig: (c) => (c.isLast ? 1 : 0) });
C({ id: 'hanging_scroll', name: 'Hanging Scroll', rarity: 1, cost: 4, icon: 'scroll', hue: '#f7d9a6',
  text: 'Retrigger the first scored card {g:2} additional times',
  retrig: (c, _s, card) => (c.scored[0]?.id === card.id ? 2 : 0) });
C({ id: 'bubbling_spring', name: 'Bubbling Spring', rarity: 2, cost: 6, icon: 'wave', hue: '#7fe8ff',
  init: () => ({ n: 10 }),
  text: (s) => `Retrigger all scored cards for the next {g:${st(s).n}} winning hands`,
  retrig: () => 1,
  after: (c, s) => { st(s).n -= 1; if (st(s).n <= 0) { c.msg('Dried up'); c.destroyCharm(s.uid); } } });
C({ id: 'punch_card', name: 'Temple Stamp Book', rarity: 2, cost: 5, icon: 'book', hue: '#ff6b5a',
  init: () => ({ n: 0 }),
  text: (s) => `{x:X4} Mult every {g:6} hands played {d:(${5 - (st(s).n % 6) <= 0 ? 'Active!' : `${5 - (st(s).n % 6)} remaining`})}`,
  hand: (c, s) => { if (st(s).n % 6 === 5) c.xmult(4); },
  resolve: (c, s) => { if (!c.copy && c.outcome !== 'fold' && !c.hand?.fromSplit) st(s).n += 1; } });

// ---------------------------------------------------------------------------
// Card modification synergies
// ---------------------------------------------------------------------------

C({ id: 'gold_leaf_fox', name: 'Gold Leaf Fox', rarity: 2, cost: 7, icon: 'fox', hue: '#ffd23f',
  text: 'Scored face cards become {g:Gilded}',
  card: (c, _s, card) => { if (!c.copy && isFace(card, c.rules) && card.ink !== 'gilded') { card.ink = 'gilded'; c.msg('Gilded!', '#ffd23f'); } } });
C({ id: 'ink_drinker', name: 'Ink Drinker', rarity: 2, cost: 7, icon: 'bat', hue: '#b04dff',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.1} Mult per scored inked card, and drinks the ink {d:(currently {x:${fmtX(st(s).x)}})}`,
  card: (c, s, card) => {
    if (c.copy || !card.ink || card.ink === 'stone') return;
    card.ink = undefined;
    st(s).x = Math.round((st(s).x + 0.1) * 100) / 100;
    c.msg('Slurp!', '#b04dff');
  },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'paper_golem', name: 'Paper Golem', rarity: 2, cost: 7, icon: 'scroll', hue: '#e9e2cf',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.25} Mult whenever a card is added to your deck {d:(currently {x:${fmtX(st(s).x)}})}`,
  cardAdded: (c, s) => { st(s).x += 0.25; },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'mirror_pond', name: 'Mirror Pond', rarity: 3, cost: 8, icon: 'mirror', hue: '#7fd1ff',
  text: 'If the first hand of a table is a natural, add a permanent copy of both cards to your deck',
  after: (c) => {
    if (!c.isFirst || c.copy || !(c.handType === 'blackjack' || c.handType === 'royal')) return;
    for (const k of c.cards) c.addCard({ ...k, id: undefined as unknown as number });
    c.msg('Copied!');
  } });
C({ id: 'wax_stamp', name: 'Wax Stamp', rarity: 2, cost: 6, icon: 'stamp', hue: '#e2382b',
  text: 'When a table starts, add a random card with a random seal to your deck',
  tableStart: (c) => {
    const seals = ['red', 'gold', 'blue', 'purple'] as const;
    c.addCard({ seal: c.rng.pick(seals) });
    c.msg('+1 Card');
  } });
C({ id: 'rock_garden', name: 'Rock Garden', rarity: 2, cost: 6, icon: 'mountain', hue: '#a8b0c0',
  text: 'When a table starts, add a {g:Stone} card to your deck',
  tableStart: (c) => { c.addCard({ ink: 'stone' }); c.msg('+1 Stone'); } });
C({ id: 'shard_collector', name: 'Shard Collector', rarity: 2, cost: 6, icon: 'crystal', hue: '#bfe9ff',
  text: (s, run) => `{x:X0.75} Mult for each Glass card shattered this run {d:(currently {x:${fmtX(1 + run.stats.glassShattered * 0.75)}})}`,
  hand: (c) => { if (c.run.stats.glassShattered) c.xmult(1 + 0.75 * c.run.stats.glassShattered); } });
C({ id: 'lucky_daruma', name: 'Lucky Daruma', rarity: 2, cost: 6, icon: 'daruma', hue: '#ffd23f',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.25} Mult each time a Lucky card triggers {d:(currently {x:${fmtX(st(s).x)}})}`,
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'treasure_map', name: 'Treasure Map', rarity: 1, cost: 5, icon: 'map', hue: '#e6c27a',
  text: 'Scored {g:Gilded} cards earn {$:4}',
  card: (c, _s, card) => { if (card.ink === 'gilded') c.money(4); } });
C({ id: 'stone_garden', name: 'Stone Garden', rarity: 2, cost: 6, icon: 'mountain', hue: '#8a93a6',
  text: (s, run) => `{c:+25} Chips for each Stone card in your deck {d:(currently {c:+${run.deck.filter((k) => k.ink === 'stone').length * 25}})}`,
  hand: (c) => { const n = c.run.deck.filter((k) => k.ink === 'stone').length; if (n) c.chips(25 * n); } });
C({ id: 'calligraphy_license', name: 'Calligrapher’s License', rarity: 3, cost: 8, icon: 'brush', hue: '#ff6a5a',
  text: (s, run) => `{x:X3} Mult if you have at least {g:16} inked cards {d:(currently ${run.deck.filter((k) => !!k.ink).length})}`,
  hand: (c) => { if (c.run.deck.filter((k) => !!k.ink).length >= 16) c.xmult(3); } });
C({ id: 'spirit_faces', name: 'Spirit Faces', rarity: 2, cost: 5, icon: 'blank', hue: '#d8ffe0',
  text: 'All cards count as face cards (for scoring)',
  rules: (r) => { r.allFace = true; } });
C({ id: 'jade_carver', name: 'Jade Carver', rarity: 1, cost: 5, icon: 'knife', hue: '#4fdc8a',
  text: 'Scored {g:Jade} cards give an extra {m:+6} Mult',
  card: (c, _s, card) => { if (card.ink === 'jade') c.mult(6); } });
C({ id: 'glassblower', name: 'Glassblower', rarity: 2, cost: 6, icon: 'crystal', hue: '#c9f4ff',
  text: 'When a table starts, turn a random card in your deck to {g:Glass}',
  tableStart: (c) => {
    const pool = c.run.deck.filter((k) => !k.ink);
    if (!pool.length) return;
    c.rng.pick(pool).ink = 'glass';
    c.msg('Glass!');
  } });
C({ id: 'seal_maker', name: 'Seal Maker', rarity: 3, cost: 8, icon: 'stamp', hue: '#ffcf3d',
  text: 'Scored cards with a seal give {x:X1.5} Mult',
  card: (c, _s, card) => { if (card.seal) c.xmult(1.5); } });
C({ id: 'ash_walker', name: 'Ash Walker', rarity: 1, cost: 5, icon: 'smoke', hue: '#b0a8a0',
  text: 'When an {g:Ash} card crumbles, earn {$:3} and gain {m:+3} Mult permanently',
  init: () => ({ m: 0 }),
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });

// ---------------------------------------------------------------------------
// Economy
// ---------------------------------------------------------------------------

C({ id: 'beckoning_cat', name: 'Beckoning Cat', rarity: 1, cost: 5, icon: 'cat', hue: '#ffd23f',
  text: 'Earn {$:1} whenever you win a hand',
  resolve: (c) => { if (isWin(c.handType)) c.money(1); } });
C({ id: 'golden_koi', name: 'Golden Koi', rarity: 1, cost: 6, icon: 'koi', hue: '#ffcf3d',
  text: 'Earn {$:4} at the end of each table',
  endMoney: () => 4 });
C({ id: 'money_tree', name: 'Money Tree', rarity: 2, cost: 5, icon: 'bamboo', hue: '#ffd23f',
  text: 'Earn an extra {$:1} of interest for every {$:5} you hold at the end of a table',
  endMoney: (run) => Math.min(Math.floor(Math.max(0, run.money) / 5), run.interestCap) });
C({ id: 'sky_lantern', name: 'Sky Lantern', rarity: 2, cost: 6, icon: 'lantern', hue: '#ffb03d',
  init: () => ({ v: 1 }),
  text: (s) => `Earn {$:${st(s).v}} at the end of each table. Grows by {$:2} when a Host is defeated`,
  endMoney: (_run, s) => st(s).v,
  hostBeaten: (_c, s) => { st(s).v += 2; } });
C({ id: 'hens_egg', name: 'Hen’s Egg', rarity: 1, cost: 4, icon: 'egg', hue: '#fff1d6',
  text: (s) => `Gains {$:3} of sell value at the end of each table {d:(sells for {$:${sellValue(s)}})}`,
  tableEnd: (c, s) => { if (!c.copy) { s.extraSell = (s.extraSell ?? 0) + 3; c.msg('Value up!', '#ffd23f'); } } });
C({ id: 'gift_box', name: 'Gift Box', rarity: 2, cost: 6, icon: 'gift', hue: '#ff6b8a',
  text: 'At the end of each table, all Charms and consumables gain {$:1} of sell value',
  tableEnd: (c) => { if (c.copy) return; for (const k of c.run.charms) k.extraSell = (k.extraSell ?? 0) + 1; c.run.flags.consBonus = (c.run.flags.consBonus ?? 0) + 1; c.msg('Value up!', '#ffd23f'); } });
C({ id: 'merchant_card', name: 'Merchant’s Card', rarity: 1, cost: 4, icon: 'cards', hue: '#e6c27a',
  text: 'Scored face cards have a {g:1 in 2} chance to earn {$:2}',
  card: (c, _s, card) => { if (isFace(card, c.rules) && c.chance(2)) c.money(2); } });
C({ id: 'ox_cart', name: 'Ox Cart', rarity: 2, cost: 6, icon: 'ox', hue: '#c08a5a',
  text: (s, run) => `{c:+2} Chips for each Ember you hold {d:(currently {c:+${Math.max(0, run.money) * 2}})}`,
  hand: (c) => { if (c.run.money > 0) c.chips(2 * c.run.money); } });
C({ id: 'straw_sandals', name: 'Straw Sandals', rarity: 2, cost: 7, icon: 'sandal', hue: '#e6c27a',
  text: (s, run) => `{m:+2} Mult for every {$:5} you hold {d:(currently {m:+${Math.max(0, Math.floor(run.money / 5)) * 2}})}`,
  hand: (c) => { const n = Math.floor(c.run.money / 5); if (n > 0) c.mult(2 * n); } });
C({ id: 'iou_note', name: 'IOU Note', rarity: 1, cost: 1, icon: 'ticket', hue: '#f7ecd2',
  text: 'You may go up to {$:-20} into debt',
  noCopy: true });
C({ id: 'river_pirate', name: 'River Pirate', rarity: 1, cost: 4, icon: 'anchor', hue: '#ff6b5a',
  text: (s, run) => `Adds the sell value of all other Charms to Mult {d:(currently {m:+${run.charms.filter((k) => k.uid !== s.uid).reduce((a, k) => a + sellValue(k), 0)}})}`,
  hand: (c, s) => { const n = c.run.charms.filter((k) => k.uid !== s.uid).reduce((a, k) => a + sellValue(k), 0); if (n) c.mult(n); } });
C({ id: 'oni_tamer', name: 'Oni Tamer', rarity: 2, cost: 7, icon: 'oni', hue: '#ff3d3d',
  text: 'Earn {$:8} whenever a Host’s curse affects you',
  resolve: (c) => { if (c.table?.hostTriggered && !c.copy) { c.table.hostTriggered = false; c.money(8); } } });
C({ id: 'stargazer', name: 'Stargazer', rarity: 2, cost: 6, icon: 'telescope', hue: '#a8c8ff',
  text: (s, run) => `Earn {$:1} at the end of each table for each unique Constellation used this run {d:(currently {$:${run.stats.uniqueStars.length}})}`,
  endMoney: (run) => run.stats.uniqueStars.length });
C({ id: 'bounty_poster', name: 'Bounty Poster', rarity: 1, cost: 5, icon: 'scroll', hue: '#ffcf8a',
  text: 'Earn {$:3} for each natural {h:blackjack}',
  resolve: (c) => { if (c.handType === 'blackjack' || c.handType === 'royal') c.money(3); } });
C({ id: 'vagabond_monk', name: 'Vagabond Monk', rarity: 3, cost: 8, icon: 'jizo', hue: '#c9b8ff',
  text: 'Create a {g:Fortune} when you win a hand while holding {$:4} or less',
  after: (c) => { if (c.run.money <= 4 && isWin(c.handType)) { if (c.createCons('fortune')) c.msg('+Fortune', '#c9b8ff'); } } });
C({ id: 'shooting_star', name: 'Shooting Star', rarity: 2, cost: 6, icon: 'comet', hue: '#ffe27a',
  text: '{g:1 in 4} chance to level up the hand type when it scores',
  after: (c) => { if (c.handType && c.chance(4)) { c.levelUp(c.handType, 1); c.msg('Level up!'); } } });
C({ id: 'fortune_octopus', name: 'Fortune Octopus', rarity: 1, cost: 5, icon: 'octopus', hue: '#ff7ad9',
  text: 'Each scored {g:8} has a {g:1 in 4} chance to create a {g:Fortune}',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank === 8 && c.chance(4)) { if (c.createCons('fortune')) c.msg('+Fortune', '#c9b8ff'); } } });
C({ id: 'cartomancer', name: 'Cartomancer', rarity: 2, cost: 6, icon: 'cards', hue: '#c9b8ff',
  text: 'Create a {g:Fortune} when a table starts',
  tableStart: (c) => { if (c.createCons('fortune')) c.msg('+Fortune', '#c9b8ff'); } });
C({ id: 'seance_table', name: 'Séance Table', rarity: 2, cost: 6, icon: 'candle', hue: '#b04dff',
  text: 'Create a {g:Mask} when you win a {h:flush}',
  after: (c) => { if (c.handType === 'flush') { if (c.createCons('mask')) c.msg('+Mask', '#b04dff'); } } });
C({ id: 'star_counter', name: 'Star Counter', rarity: 2, cost: 6, icon: 'star', hue: '#9fc7ff',
  text: 'Create a {g:Constellation} when you hit a natural {h:blackjack}',
  after: (c) => { if (c.handType === 'blackjack' || c.handType === 'royal') { if (c.createCons('star')) c.msg('+Star', '#9fc7ff'); } } });
C({ id: 'dream_moth', name: 'Dream Moth', rarity: 1, cost: 4, icon: 'moth', hue: '#e6c8ff',
  text: '{g:1 in 2} chance to create a {g:Fortune} when you open a Bundle',
  packOpen: (c) => { if (c.chance(2)) { if (c.createCons('fortune')) c.msg('+Fortune', '#c9b8ff'); } } });
C({ id: 'street_urchins', name: 'Street Urchins', rarity: 1, cost: 6, icon: 'monkey', hue: '#ffb07a',
  text: 'When a table starts, create up to {g:2} common Charms',
  tableStart: (c) => { c.createCharm({ rarity: 1 }); c.createCharm({ rarity: 1 }); } });
C({ id: 'cat_burglar', name: 'Cat Burglar', rarity: 2, cost: 6, icon: 'cat', hue: '#8a8aa0',
  text: '{g:+3} hands each table. Lose all folds',
  slots: { hands: 3 },
  tableStart: (c) => { if (c.table) c.table.foldsLeft = 0; } });
C({ id: 'drunken_monk', name: 'Drunken Monk', rarity: 1, cost: 5, icon: 'gourd', hue: '#ffcf8a',
  text: '{g:+1} fold each table',
  slots: { folds: 1 } });
C({ id: 'spare_hand', name: 'Spare Hand', rarity: 2, cost: 7, icon: 'hand', hue: '#ffe2c8',
  text: '{g:+1} hand each table',
  slots: { hands: 1 } });
C({ id: 'street_performer', name: 'Street Performer', rarity: 2, cost: 5, icon: 'fan', hue: '#ff8ab3',
  text: 'Charms you already own may appear in the shop',
  noCopy: true });
C({ id: 'clown_spirit', name: 'Clown Spirit', rarity: 1, cost: 4, icon: 'pinwheel', hue: '#ff8ad0',
  text: '{g:1} free reroll in each shop',
  shopEnter: (c) => { if (c.run.shop) c.run.shop.freeRerolls += 1; } });
C({ id: 'astronomer', name: 'Astronomer', rarity: 2, cost: 8, icon: 'telescope', hue: '#7fb8ff',
  text: 'All Constellations and Star Bundles in the shop are free',
  noCopy: true });
C({ id: 'fortune_teller', name: 'Fortune Teller', rarity: 1, cost: 6, icon: 'crystal', hue: '#c9b8ff',
  text: (s, run) => `{m:+1} Mult for each Fortune used this run {d:(currently {m:+${run.stats.fortunesUsed}})}`,
  hand: (c) => { if (c.run.stats.fortunesUsed) c.mult(c.run.stats.fortunesUsed); } });
C({ id: 'star_map', name: 'Star Map', rarity: 2, cost: 6, icon: 'map', hue: '#9fc7ff',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.1} Mult each time a Constellation is used {d:(currently {x:${fmtX(st(s).x)}})}`,
  useCons: (c, s, kind) => { if (kind === 'star' && !c.copy) { st(s).x = Math.round((st(s).x + 0.1) * 100) / 100; c.msg('Upgrade!'); } },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'old_photograph', name: 'Old Photograph', rarity: 2, cost: 6, icon: 'scroll', hue: '#d9c7a0',
  text: (s, run) => `{x:X0.25} Mult for each table skipped this run {d:(currently {x:${fmtX(1 + run.stats.tablesSkipped * 0.25)}})}`,
  hand: (c) => { if (c.run.stats.tablesSkipped) c.xmult(1 + 0.25 * c.run.stats.tablesSkipped); } });
C({ id: 'red_envelope', name: 'Red Envelope', rarity: 1, cost: 5, icon: 'envelope', hue: '#ff3d3d',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+3} Mult whenever a Bundle is skipped {d:(currently {m:+${st(s).m}})}`,
  packSkip: (c, s) => { st(s).m += 3; c.msg('Upgrade!'); },
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });
C({ id: 'shell_game', name: 'Shell Game', rarity: 2, cost: 6, icon: 'shell', hue: '#ffc6a8',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+2} Mult per reroll in the shop {d:(currently {m:+${st(s).m}})}`,
  reroll: (c, s) => { st(s).m += 2; },
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });
C({ id: 'bonfire', name: 'Bonfire', rarity: 3, cost: 9, icon: 'bonfire', hue: '#ff6a2a',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.25} Mult for each card sold. Resets when a Host is defeated {d:(currently {x:${fmtX(st(s).x)}})}`,
  anySold: (c, s) => { st(s).x += 0.25; c.msg('Stoked!'); },
  hostBeaten: (c, s) => { st(s).x = 1; },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'jizo_statue', name: 'Jizo Statue', rarity: 2, cost: 5, icon: 'jizo', hue: '#c7c1d9',
  text: 'Prevents a run from ending if you reached at least {g:25%} of the target. Crumbles afterwards',
  noCopy: true,
  save: (c, s) => {
    if (!c.table || c.table.score < c.table.target * 0.25) return false;
    c.msg('Saved!');
    c.destroyCharm(s.uid);
    return true;
  } });
C({ id: 'frenzied_oni', name: 'Frenzied Oni', rarity: 2, cost: 7, icon: 'oni', hue: '#ff2d2d',
  init: () => ({ x: 1 }),
  text: (s) => `When a Paper or Silk table starts, gains {x:X0.5} Mult and destroys a random other Charm {d:(currently {x:${fmtX(st(s).x)}})}`,
  tableStart: (c, s) => {
    if (c.copy || !c.table || c.table.kind === 'host') return;
    st(s).x += 0.5;
    const others = c.run.charms.filter((k) => k.uid !== s.uid);
    if (others.length) c.destroyCharm(c.rng.pick(others).uid);
    c.msg('Frenzy!');
  },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'ritual_knife', name: 'Ritual Knife', rarity: 2, cost: 6, icon: 'knife', hue: '#ff6b6b',
  init: () => ({ m: 0 }),
  text: (s) => `When a table starts, destroys the Charm to its right and gains twice its sell value as Mult {d:(currently {m:+${st(s).m}})}`,
  tableStart: (c, s) => {
    if (c.copy) return;
    const i = c.run.charms.findIndex((k) => k.uid === s.uid);
    const right = c.run.charms[i + 1];
    if (!right) return;
    st(s).m += 2 * sellValue(right);
    c.destroyCharm(right.uid);
    c.msg('Sliced!');
  },
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });
C({ id: 'collector_album', name: 'Collector’s Album', rarity: 3, cost: 8, icon: 'book', hue: '#4fdc8a',
  text: 'Each uncommon Charm gives {x:X1.5} Mult',
  hand: (c) => {
    const n = c.run.charms.filter((k) => !k.disabled && CHARM[k.id]?.rarity === 2).length;
    if (n) c.xmult(Math.pow(1.5, n));
  } });
C({ id: 'exorcist_seal', name: 'Exorcist’s Seal', rarity: 2, cost: 5, icon: 'stamp', hue: '#ff3d3d',
  text: 'Sell this Charm to disable the current Host’s curse',
  noCopy: true,
  sold: (c) => { if (c.table && c.table.hostId) { c.table.hostDisabled = true; c.msg('Exorcised!'); } } });
C({ id: 'paper_ticket', name: 'Paper Ticket', rarity: 2, cost: 6, icon: 'ticket', hue: '#ffcf8a',
  text: 'Sell this Charm to receive a {g:Double Token}',
  noCopy: true,
  sold: (c) => { c.addTag('double'); } });
C({ id: 'ghost_twin', name: 'Ghost Twin', rarity: 3, cost: 8, icon: 'ghost', hue: '#e6f0ff',
  init: () => ({ n: 0 }),
  text: (s) => `After {g:2} tables, sell this to duplicate a random Charm {d:(${Math.min(2, st(s).n)}/2)}`,
  noCopy: true,
  tableEnd: (c, s) => { st(s).n += 1; if (st(s).n === 2) c.msg('Ready!'); },
  sold: (c, s) => {
    if (st(s).n < 2) return;
    const others = c.run.charms.filter((k) => k.uid !== s.uid);
    if (!others.length) return;
    const t = c.rng.pick(others);
    c.createCharm({ id: t.id, finish: t.finish === 'phantom' ? undefined : t.finish, force: true });
  } });
C({ id: 'tracing_paper', name: 'Tracing Paper', rarity: 3, cost: 10, icon: 'scroll', hue: '#9fd8ff',
  text: 'Copies the ability of the Charm to the right',
  noCopy: true });
C({ id: 'echo_mirror', name: 'Echoing Mirror', rarity: 3, cost: 10, icon: 'mirror', hue: '#ffd6f0',
  text: 'Copies the ability of the leftmost Charm',
  noCopy: true });
C({ id: 'loaded_dice', name: 'Loaded Dice', rarity: 2, cost: 6, icon: 'dice', hue: '#f7ecd2',
  text: 'Doubles all listed {g:probabilities}',
  noCopy: true,
  rules: (r) => { r.probMult *= 2; } });
C({ id: 'bubble_tea', name: 'Firefly Jar', rarity: 1, cost: 5, icon: 'firefly', hue: '#d8ff7a',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+1} Mult each time a card is dealt to you {d:(currently {m:+${st(s).m}})}. Resets when a Host is defeated`,
  hit: (c, s) => { st(s).m += 1; },
  hostBeaten: (c, s) => { st(s).m = 0; },
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });
C({ id: 'mushroom_ring', name: 'Mushroom Ring', rarity: 1, cost: 5, icon: 'mushroom', hue: '#ff6b5a',
  text: '{g:1 in 3} chance for {m:+20} Mult, otherwise {c:+40} Chips',
  hand: (c) => { if (c.chance(3)) c.mult(20); else c.chips(40); } });
C({ id: 'bee_hive', name: 'Bee Hive', rarity: 1, cost: 4, icon: 'bee', hue: '#ffd23f',
  text: 'Scored cards give {c:+8} Chips',
  card: (c) => c.chips(8) });
C({ id: 'owl_night', name: 'Night Owl', rarity: 2, cost: 6, icon: 'owl', hue: '#a08cff',
  text: '{x:X2} Mult during Host tables',
  hand: (c) => { if (c.table?.kind === 'host') c.xmult(2); } });
C({ id: 'peach_boy', name: 'Peach Boy', rarity: 1, cost: 5, icon: 'peach', hue: '#ffb3c7',
  text: '{m:+8} Mult if you are holding a {g:Fortune}, {g:Constellation} or {g:Mask}',
  hand: (c) => { if (c.run.consumables.length) c.mult(8); } });
C({ id: 'bear_hug', name: 'Bear Hug', rarity: 1, cost: 5, icon: 'bear', hue: '#c08a5a',
  text: '{c:+50} Chips if the dealer had 17 exactly',
  hand: (c) => { if (!c.dealerBusted && c.dealerTotal === 17) c.chips(50); } });
C({ id: 'turtle_shell', name: 'Turtle Shell', rarity: 1, cost: 5, icon: 'turtle', hue: '#6ee7a8',
  text: '{m:+6} Mult if you stood on {g:16} or less and still scored',
  hand: (c) => { if (c.total <= 16) c.mult(6); } });
C({ id: 'snake_eyes', name: 'Snake Eyes', rarity: 2, cost: 6, icon: 'snake', hue: '#7fe07a',
  text: 'If your first two cards are a pair, the hand gives {x:X2} Mult',
  hand: (c) => { const [a, b] = c.cards; if (a && b && a.ink !== 'stone' && b.ink !== 'stone' && a.rank === b.rank) c.xmult(2); } });
C({ id: 'butterfly_dream', name: 'Butterfly Dream', rarity: 2, cost: 6, icon: 'butterfly', hue: '#ffa8f0',
  text: '{x:X1.5} Mult if every card in the hand has a different suit',
  hand: (c) => {
    if (c.cards.length < 2 || c.cards.some((k) => k.ink === 'stone' || k.ink === 'spirit')) return;
    if (new Set(c.cards.map((k) => k.suit)).size === c.cards.length) c.xmult(1.5);
  } });
C({ id: 'hammer_luck', name: 'Lucky Mallet', rarity: 2, cost: 7, icon: 'hammer', hue: '#ffd23f',
  text: '{g:1 in 4} chance per scored card to earn {$:1}',
  card: (c) => { if (c.chance(4)) c.money(1); } });
C({ id: 'cauldron', name: 'Witch’s Cauldron', rarity: 2, cost: 7, icon: 'cauldron', hue: '#9be37a',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+1} Mult for every consumable used {d:(currently {m:+${st(s).m}})}`,
  useCons: (c, s) => { st(s).m += 1; },
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });
C({ id: 'taiko_bridge', name: 'Taiko Bridge', rarity: 1, cost: 5, icon: 'bridge', hue: '#ff6a5a',
  text: '{c:+25} Chips and {m:+5} Mult if you split this hand',
  hand: (c) => { if (c.hand?.fromSplit) { c.chips(25); c.mult(5); } } });
C({ id: 'needle_thread', name: 'Needle & Thread', rarity: 1, cost: 4, icon: 'needle', hue: '#e9dcc0',
  text: 'Winning with exactly {g:20} gives {m:+10} Mult',
  hand: (c) => { if (c.total === 20 && isWin(c.handType)) c.mult(10); } });
C({ id: 'fishing_hook', name: 'Fishing Hook', rarity: 1, cost: 4, icon: 'hook', hue: '#9fd8ff',
  text: 'Earn {$:1} for each card you draw beyond your first two in a winning hand',
  resolve: (c) => { if (isWin(c.handType) && c.cards.length > 2) c.money(c.cards.length - 2); } });
C({ id: 'scissors', name: 'Paper Scissors', rarity: 2, cost: 6, icon: 'scissors', hue: '#d0d8e8',
  text: 'Scored cards ranked {g:2-6} give {x:X1.1} Mult',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank <= 6) c.xmult(1.1); } });
C({ id: 'wheel_of_dharma', name: 'Dharma Wheel', rarity: 2, cost: 7, icon: 'wheel', hue: '#ffcf3d',
  init: () => ({ i: 0 }),
  text: (s) => `Cycles each hand: {c:+80} Chips → {m:+15} Mult → {x:X2} Mult {d:(next: ${['Chips', 'Mult', 'XMult'][st(s).i % 3]})}`,
  hand: (c, s) => { const i = st(s).i % 3; if (i === 0) c.chips(80); else if (i === 1) c.mult(15); else c.xmult(2); },
  after: (c, s) => { st(s).i += 1; } });
C({ id: 'lotus_bloom', name: 'Lotus Bloom', rarity: 2, cost: 7, icon: 'lotus', hue: '#ff9ad8',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+1} Mult for every scored {s:leaf} card {d:(currently {m:+${st(s).m}})}`,
  card: (c, s, card) => { if (!c.copy && isSuit(card, 'leaf', c.rules)) st(s).m += 1; },
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });
C({ id: 'chained_bell', name: 'Chained Bell', rarity: 2, cost: 7, icon: 'chain', hue: '#ffd27a',
  init: () => ({ c: 0 }),
  text: (s) => `Gains {c:+10} Chips for every scored {s:bell} card {d:(currently {c:+${st(s).c}})}`,
  card: (c, s, card) => { if (!c.copy && isSuit(card, 'bell', c.rules)) st(s).c += 10; },
  hand: (c, s) => { if (st(s).c) c.chips(st(s).c); } });
C({ id: 'fire_wheel', name: 'Wanyudo', rarity: 2, cost: 7, icon: 'wheel', hue: '#ff4b2b',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.05} Mult for every scored {s:flame} card {d:(currently {x:${fmtX(st(s).x)}})}`,
  card: (c, s, card) => { if (!c.copy && isSuit(card, 'flame', c.rules)) st(s).x = Math.round((st(s).x + 0.05) * 100) / 100; },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'moon_viewing', name: 'Moon Viewing', rarity: 2, cost: 7, icon: 'moon', hue: '#b9c7ff',
  init: () => ({ c: 0 }),
  text: (s) => `Gains {c:+8} Chips for every scored {s:moon} card {d:(currently {c:+${st(s).c}})}`,
  card: (c, s, card) => { if (!c.copy && isSuit(card, 'moon', c.rules)) st(s).c += 8; },
  hand: (c, s) => { if (st(s).c) c.chips(st(s).c); } });
C({ id: 'spark_plug', name: 'Spark of Ten', rarity: 1, cost: 5, icon: 'spark', hue: '#ffe27a',
  text: '{c:+10} Chips for every 10-value card in the hand, and the same for the dealer’s',
  hand: (c) => { const n = c.cards.filter(isTenValue).length + c.dealerCards.filter(isTenValue).length; if (n) c.chips(10 * n); } });
C({ id: 'shimenawa', name: 'Shimenawa Rope', rarity: 3, cost: 8, icon: 'rope', hue: '#f7d9a6',
  text: 'Protects every Charm from being destroyed',
  noCopy: true });
C({ id: 'shield_of_dawn', name: 'Iron Kasa', rarity: 2, cost: 6, icon: 'shield', hue: '#b8c4d9',
  text: 'Host curses that debuff cards have no effect',
  noCopy: true });
C({ id: 'spinning_top', name: 'Spinning Top', rarity: 1, cost: 4, icon: 'spiral', hue: '#ff9a7a',
  text: '{m:+0} to {m:+23} Mult, at random',
  hand: (c) => c.mult(Math.floor(c.rng.next() * 24)) });
C({ id: 'blind_swordsman', name: 'Blind Swordsman', rarity: 3, cost: 9, icon: 'sword', hue: '#b8c4d9',
  text: '{x:X3} Mult if you stood on your first two cards against a dealer showing a 10 or an Ace',
  hand: (c) => {
    const up = c.dealerCards[0];
    if (c.cards.length === 2 && (c.hand?.hits ?? 0) === 0 && up && (isTenValue(up) || up.rank === 14)) c.xmult(3);
  } });
C({ id: 'night_market', name: 'Night Market', rarity: 1, cost: 5, icon: 'lantern', hue: '#ffcf3d',
  text: 'Shop items cost {$:1} less',
  noCopy: true });

// ---------------------------------------------------------------------------
// Legendary (only from the Silent Mask)
// ---------------------------------------------------------------------------

C({ id: 'kaguya', name: 'Kaguya, the Moon Princess', rarity: 4, cost: 20, icon: 'moon', hue: '#ffe9a8',
  text: 'Scored Queens and Aces give {x:X1.75} Mult',
  card: (c, _s, card) => { if (card.ink !== 'stone' && (card.rank === 12 || card.rank === 14)) c.xmult(1.75); } });
C({ id: 'fujin_raijin', name: 'Fūjin & Raijin', rarity: 4, cost: 20, icon: 'lightning', hue: '#7fe8ff',
  text: 'When the dealer busts, retrigger every scored card twice',
  retrig: (c) => (c.dealerBusted ? 2 : 0) });
C({ id: 'lantern_keeper', name: 'The Lantern Keeper', rarity: 4, cost: 20, icon: 'lantern', hue: '#ffcf3d',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.5} Mult for each natural {h:blackjack} {d:(currently {x:${fmtX(st(s).x)}})}`,
  after: (c, s) => { if (c.handType === 'blackjack' || c.handType === 'royal') { st(s).x += 0.5; c.msg('Brighter!'); } },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'shuten_doji', name: 'Shuten-dōji', rarity: 4, cost: 20, icon: 'gourd', hue: '#ff3d3d',
  text: 'You bust over {g:23}. {x:X2} Mult',
  rules: (r) => { r.bustLimit += 2; },
  hand: (c) => c.xmult(2) });
C({ id: 'hollow_king', name: 'The Hollow King', rarity: 4, cost: 20, icon: 'skull', hue: '#e9e2cf',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X1} Mult when a face card is destroyed {d:(currently {x:${fmtX(st(s).x)}})}`,
  cardDestroyed: (c, s, card) => { if (isFace(card, c.rules)) { st(s).x += 1; c.msg('Feast!'); } },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'poet_skull', name: 'The Poet’s Skull', rarity: 4, cost: 20, icon: 'skull', hue: '#c9b8ff',
  init: () => ({ x: 1, n: 23 }),
  text: (s) => `Gains {x:X1} Mult every {g:23} cards folded {d:(${st(s).n} remaining, currently {x:${fmtX(st(s).x)}})}`,
  fold: (c, s, cards) => {
    if (c.copy) return;
    st(s).n -= cards.length;
    while (st(s).n <= 0) { st(s).n += 23; st(s).x += 1; c.msg('Verse!'); }
  },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'shrine_guardian', name: 'Shrine Guardian', rarity: 4, cost: 20, icon: 'torii', hue: '#ff3d3d',
  text: 'Disables the curse of every Host',
  noCopy: true });
C({ id: 'collector', name: 'The Collector', rarity: 4, cost: 20, icon: 'purse', hue: '#b04dff',
  text: 'When you leave the shop, create a {g:Phantom} copy of a random consumable you hold',
  shopLeave: (c) => {
    if (!c.run.consumables.length) return;
    const t = c.rng.pick(c.run.consumables);
    c.createCons(t.kind, t.id, 'phantom');
    c.msg('Copied!');
  } });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const CHARM: Record<string, CharmDef> = Object.fromEntries(CHARMS.map((d) => [d.id, d]));

export function sellValue(s: CharmInst): number {
  const d = CHARM[s.id];
  const base = Math.max(1, Math.floor((d?.cost ?? 2) / 2));
  return base + (s.extraSell ?? 0);
}

export function charmSlotsFree(run: Run): number {
  let slots = run.baseCharmSlots;
  for (const k of run.charms) {
    if (k.finish === 'phantom') slots += 1;
    slots += CHARM[k.id]?.slots?.charm ?? 0;
  }
  return slots - run.charms.length;
}

export function mostPlayed(run: Run): HandTypeId {
  let best: HandTypeId = 'outdraw';
  let n = -1;
  for (const [k, v] of Object.entries(run.handPlays) as [HandTypeId, number][]) {
    if (v > n) {
      n = v;
      best = k;
    }
  }
  return best;
}

export function runningCount(run: Run): number {
  const t = run.table;
  if (!t) return 0;
  let n = 0;
  const byId = new Map(run.deck.map((c) => [c.id, c]));
  for (const id of t.discard) {
    const c = byId.get(id);
    if (!c || c.ink === 'stone') continue;
    if (c.rank <= 6) n += 1;
    else if (c.rank >= 10) n -= 1;
  }
  return n;
}

export function startSize(run: Run): number {
  return run.flags.startDeckSize ?? 52;
}

export function charmText(s: CharmInst, run: Run): string {
  const d = CHARM[s.id];
  if (!d) return '';
  return typeof d.text === 'function' ? d.text(s, run) : d.text;
}

export const HAND_NAME = (h: HandTypeId) => HAND_TYPE[h].name;
