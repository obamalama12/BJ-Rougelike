// Doodads: passive items that change scoring and bend the rules of the table.
// Text tokens: {c:} Pot, {m:} Odds, {x:} xOdds, {$:} Bucks, {g:} highlight,
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

C({ id: 'paper_lantern', name: 'Squeaky Toy', rarity: 1, cost: 2, icon: 'rubberduck', hue: '#ff8a3d',
  text: '{m:+4} Odds',
  hand: (c) => c.mult(4) });

C({ id: 'onigiri', name: 'Stale Bread', rarity: 1, cost: 3, icon: 'bread', hue: '#e9e2cf',
  text: '{c:+40} Pot',
  hand: (c) => c.chips(40) });

C({ id: 'sake_cup', name: 'Sarsaparilla', rarity: 1, cost: 4, icon: 'bottle', hue: '#d9d2ff',
  init: () => ({ m: 20 }),
  text: (s) => `{m:+${st(s).m}} Odds. Loses {m:1} Odds per hand played`,
  hand: (c, s) => c.mult(st(s).m),
  resolve: (c, s) => {
    if (c.copy || c.outcome === 'fold') return;
    st(s).m -= 1;
    if (st(s).m <= 0) { c.msg('Burp!'); c.destroyCharm(s.uid); }
  } });

C({ id: 'mochi', name: 'Gas Station Hot Dog', rarity: 1, cost: 4, icon: 'hotdog', hue: '#ffb3c7',
  init: () => ({ c: 120 }),
  text: (s) => `{c:+${st(s).c}} Pot. Loses {c:6} Pot per hand played`,
  hand: (c, s) => c.chips(st(s).c),
  resolve: (c, s) => {
    if (c.copy || c.outcome === 'fold') return;
    st(s).c -= 6;
    if (st(s).c <= 0) { c.msg('Gobbled!'); c.destroyCharm(s.uid); }
  } });

C({ id: 'persimmon', name: 'Cooling Pie', rarity: 1, cost: 5, icon: 'pie', hue: '#ff7a1a',
  text: '{m:+15} Odds. {g:1 in 6} chance a coyote steals it at the end of each table',
  available: (run) => !run.flags.persimmonGone,
  hand: (c) => c.mult(15),
  tableEnd: (c, s) => {
    if (c.chance(6)) { c.msg('Swiped!'); c.run.flags.persimmonGone = true; c.destroyCharm(s.uid); }
  } });

C({ id: 'golden_persimmon', name: 'Golden Pie', rarity: 1, cost: 4, icon: 'pie', hue: '#ffd23f',
  text: '{x:X3} Odds. {g:1 in 1000} chance a coyote steals it at the end of each table',
  available: (run) => !!run.flags.persimmonGone,
  hand: (c) => c.xmult(3),
  tableEnd: (c, s) => { if (c.chance(1000)) { c.msg('Swiped!'); c.destroyCharm(s.uid); } } });

C({ id: 'lantern_festival', name: 'Hoedown', rarity: 1, cost: 4, icon: 'banjo', hue: '#ff5b3a',
  text: (s, run) => `{m:+3} Odds for each Doodad you have {d:(currently {m:+${run.charms.length * 3}})}`,
  hand: (c) => c.mult(3 * c.run.charms.length) });

C({ id: 'empty_shrine', name: 'Ghost Town', rarity: 2, cost: 8, icon: 'ghost', hue: '#c7c1d9',
  text: (s, run) => `{x:X1} Odds, plus {x:X1} for each empty Doodad slot {d:(currently {x:X${Math.max(1, charmSlotsFree(run) + 1)}})}`,
  hand: (c) => c.xmult(Math.max(1, charmSlotsFree(c.run) + 1)) });

C({ id: 'oni_drum', name: 'Itchy Trigger Finger', rarity: 2, cost: 6, icon: 'fist', hue: '#ff3d3d',
  text: '{m:+20} Odds if you hit at least twice this hand',
  hand: (c) => { if ((c.hand?.hits ?? 0) >= 2) c.mult(20); } });

// ---------------------------------------------------------------------------
// Suits
// ---------------------------------------------------------------------------

const suitMult = (id: string, name: string, suit: Suit, icon: string, hue: string) =>
  C({ id, name, rarity: 1, cost: 5, icon, hue,
    text: `Scored {s:${suit}} cards give {m:+3} Odds`,
    card: (c, _s, card) => { if (isSuit(card, suit, c.rules)) c.mult(3); } });
suitMult('moon_rabbit', 'Lucky Horseshoe', 'moon', 'horseshoe', '#9fb4ff');
suitMult('salamander', 'Short Fuse', 'flame', 'dynamite', '#ff6a3d');
suitMult('tree_frog', 'Prickly Pete', 'leaf', 'cactus', '#4fdc8a');
suitMult('wind_chime', 'Tin Star', 'bell', 'badge', '#ffcf4a');

const suitChips = (id: string, name: string, suit: Suit, icon: string, hue: string) =>
  C({ id, name, rarity: 1, cost: 4, icon, hue,
    text: `Scored {s:${suit}} cards give {c:+30} Pot`,
    card: (c, _s, card) => { if (isSuit(card, suit, c.rules)) c.chips(30); } });
suitChips('silver_dew', 'Blacksmith', 'moon', 'anvil', '#b9c7ff');
suitChips('charcoal', 'Powder Keg', 'flame', 'barrel', '#ff8a5c');
suitChips('moss_stone', 'Cactus Juice', 'leaf', 'cactus', '#6ee7a8');
suitChips('brass_clapper', 'Shiny Star', 'bell', 'star', '#ffd76e');

C({ id: 'lunar_mirror', name: 'Iron Horse', rarity: 3, cost: 8, icon: 'train', hue: '#8fa6ff',
  text: 'Scored {s:moon} cards give {x:X1.3} Odds',
  card: (c, _s, card) => { if (isSuit(card, 'moon', c.rules)) c.xmult(1.3); } });
C({ id: 'ember_heart', name: 'Firecracker Fred', rarity: 2, cost: 7, icon: 'bomb', hue: '#ff4b2b',
  text: 'Scored {s:flame} cards have a {g:1 in 2} chance to give {x:X1.5} Odds',
  card: (c, _s, card) => { if (isSuit(card, 'flame', c.rules) && c.chance(2)) c.xmult(1.5); } });
C({ id: 'jade_agate', name: 'Saguaro Sam', rarity: 2, cost: 7, icon: 'cactus', hue: '#2fcf7a',
  text: 'Scored {s:leaf} cards give {m:+7} Odds',
  card: (c, _s, card) => { if (isSuit(card, 'leaf', c.rules)) c.mult(7); } });
C({ id: 'rough_gold', name: 'Sheriff\u2019s Salary', rarity: 2, cost: 7, icon: 'moneybag', hue: '#ffc83d',
  text: 'Scored {s:bell} cards earn {$:1}',
  card: (c, _s, card) => { if (isSuit(card, 'bell', c.rules)) c.money(1); } });
C({ id: 'moon_arrow', name: 'Horseshoe Toss', rarity: 2, cost: 7, icon: 'horseshoe', hue: '#a0b0ff',
  text: 'Scored {s:moon} cards give {c:+50} Pot',
  card: (c, _s, card) => { if (isSuit(card, 'moon', c.rules)) c.chips(50); } });

C({ id: 'yin_talisman', name: 'Cool Customer', rarity: 2, cost: 6, icon: 'glasses', hue: '#6f8cff',
  text: '{x:X2} Odds if every scored card is a {s:moon} or {s:leaf}',
  hand: (c) => { if (c.scored.length && c.scored.every((k) => isSuit(k, 'moon', c.rules) || isSuit(k, 'leaf', c.rules))) c.xmult(2); } });
C({ id: 'yang_talisman', name: 'Hot Shot', rarity: 2, cost: 6, icon: 'revolver', hue: '#ff9a3d',
  text: '{x:X2} Odds if every scored card is a {s:flame} or {s:bell}',
  hand: (c) => { if (c.scored.length && c.scored.every((k) => isSuit(k, 'flame', c.rules) || isSuit(k, 'bell', c.rules))) c.xmult(2); } });
C({ id: 'four_winds', name: 'Four Corners', rarity: 2, cost: 6, icon: 'compass', hue: '#7fd1ff',
  text: '{x:X3} Odds if the hand contains a {s:moon}, {s:flame}, {s:leaf} and {s:bell}',
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
C({ id: 'smudged_ink', name: 'Sun Glare', rarity: 2, cost: 7, icon: 'tornado', hue: '#9a8cff',
  text: '{s:moon} and {s:leaf} count as the same suit. {s:flame} and {s:bell} count as the same suit',
  rules: (r) => { r.smeared = true; } });
C({ id: 'koi_pond', name: 'Duck Pond', rarity: 1, cost: 5, icon: 'pond', hue: '#ff7a3d',
  text: '{m:+12} Odds if every scored card shares a suit',
  hand: (c) => {
    if (!c.scored.length) return;
    if ((['moon', 'flame', 'leaf', 'bell'] as Suit[]).some((s) => c.scored.every((k) => isSuit(k, s, c.rules)))) c.mult(12);
  } });

// ---------------------------------------------------------------------------
// Ranks
// ---------------------------------------------------------------------------

C({ id: 'ace_of_embers', name: 'Ace in the Hole', rarity: 1, cost: 4, icon: 'cards', hue: '#ffb03d',
  text: 'Scored Aces give {c:+20} Pot and {m:+4} Odds',
  card: (c, _s, card) => { if (card.rank === 14 && card.ink !== 'stone') { c.chips(20); c.mult(4); } } });
C({ id: 'court_painter', name: 'Wanted Poster Artist', rarity: 1, cost: 4, icon: 'wanted', hue: '#f3d7a6',
  text: 'Scored face cards give {c:+30} Pot',
  card: (c, _s, card) => { if (isFace(card, c.rules)) c.chips(30); } });
C({ id: 'theater_mask', name: 'Fancy Mustache', rarity: 1, cost: 4, icon: 'mustache', hue: '#f7ecd2',
  text: 'Scored face cards give {m:+5} Odds',
  card: (c, _s, card) => { if (isFace(card, c.rules)) c.mult(5); } });
C({ id: 'small_fry', name: 'Small Fry', rarity: 1, cost: 5, icon: 'fish', hue: '#ffcf8a',
  text: 'Scored cards ranked {g:2-5} give {m:+5} Odds',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank <= 5) c.mult(5); } });
C({ id: 'twin_koi', name: 'Even Steven', rarity: 1, cost: 4, icon: 'duck', hue: '#ff9a7a',
  text: 'Scored even cards {d:(10, 8, 6, 4, 2)} give {m:+4} Odds',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank <= 10 && card.rank % 2 === 0) c.mult(4); } });
C({ id: 'lone_heron', name: 'Odd Duck', rarity: 1, cost: 4, icon: 'duck', hue: '#cfe3ff',
  text: 'Scored odd cards {d:(A, 9, 7, 5, 3)} give {c:+31} Pot',
  card: (c, _s, card) => { if (card.ink !== 'stone' && (card.rank === 14 || (card.rank <= 9 && card.rank % 2 === 1))) c.chips(31); } });
C({ id: 'spiral_shell', name: 'Fibonacci Feathers', rarity: 2, cost: 8, icon: 'feather', hue: '#ffc6a8',
  text: 'Scored Aces, 2s, 3s, 5s and 8s give {m:+8} Odds',
  card: (c, _s, card) => { if (card.ink !== 'stone' && [14, 2, 3, 5, 8].includes(card.rank)) c.mult(8); } });
C({ id: 'woodpecker', name: 'Pecking Order', rarity: 2, cost: 6, icon: 'magpie', hue: '#ff6b5a',
  text: 'Each scored {g:2, 3, 4 or 5} scores twice',
  retrig: (_c, _s, card) => (card.ink !== 'stone' && card.rank <= 5 ? 1 : 0) });
C({ id: 'puppeteer', name: 'Ventriloquist', rarity: 2, cost: 6, icon: 'hand', hue: '#e6b8ff',
  text: 'Each scored face card scores twice',
  retrig: (c, _s, card) => (isFace(card, c.rules) ? 1 : 0) });
C({ id: 'seven_gods', name: 'Seven-Shooter', rarity: 2, cost: 7, icon: 'revolver', hue: '#ffd23f',
  text: 'Scored 7s give {x:X1.5} Odds',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank === 7) c.xmult(1.5); } });
C({ id: 'tenfold_fan', name: 'Ten-Gallon Hat', rarity: 1, cost: 5, icon: 'cowboyhat', hue: '#ff7aa8',
  text: 'Scored 10s give {m:+10} Odds',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank === 10) c.mult(10); } });
C({ id: 'ink_portrait', name: 'Tintype Portrait', rarity: 1, cost: 5, icon: 'mirror', hue: '#e9dcc0',
  text: 'The first scored face card gives {x:X2} Odds',
  card: (c, _s, card) => { if (isFace(card, c.rules) && c.scored.find((k) => isFace(k, c.rules))?.id === card.id) c.xmult(2); } });
C({ id: 'tanuki_lord', name: 'King of the Pond', rarity: 3, cost: 8, icon: 'crown', hue: '#c08a5a',
  text: 'Scored Kings give {x:X1.5} Odds',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank === 13) c.xmult(1.5); } });
C({ id: 'moon_princess', name: 'Saloon Queen', rarity: 1, cost: 5, icon: 'swan', hue: '#ffe2f0',
  text: 'Scored Queens give {m:+13} Odds',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank === 12) c.mult(13); } });
C({ id: 'jack_o_kite', name: 'Jack of All Trades', rarity: 1, cost: 5, icon: 'hammer', hue: '#7fe0ff',
  text: 'Scored Jacks give {c:+11} Pot and {m:+3} Odds',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank === 11) { c.chips(11); c.mult(3); } } });
C({ id: 'paper_telephone', name: 'Ten-Four Telegraph', rarity: 1, cost: 4, icon: 'telegram', hue: '#b6f0c9',
  text: 'Scored 10s and 4s give {c:+10} Pot and {m:+4} Odds',
  card: (c, _s, card) => { if (card.ink !== 'stone' && (card.rank === 10 || card.rank === 4)) { c.chips(10); c.mult(4); } } });
C({ id: 'kodama', name: 'Two-Bit Duckling', rarity: 3, cost: 8, icon: 'duckling', hue: '#d8ffe0',
  init: () => ({ c: 0 }),
  text: (s) => `Gains {c:+8} Pot each time a {g:2} is scored {d:(currently {c:+${st(s).c}})}`,
  card: (c, s, card) => {
    if (card.ink !== 'stone' && card.rank === 2 && !c.copy) { st(s).c += 8; c.msg('Grow!'); }
  },
  hand: (c, s) => { if (st(s).c) c.chips(st(s).c); } });
C({ id: 'pilgrim', name: 'Trail Boots', rarity: 2, cost: 5, icon: 'boot', hue: '#d9b38c',
  text: 'Every scored card permanently gains {c:+5} Pot',
  card: (c, _s, card) => { if (!c.copy) { card.bonus = (card.bonus ?? 0) + 5; c.msg('+5', '#4fb6ff'); } } });
C({ id: 'ace_hunter', name: 'Bounty Hunter', rarity: 2, cost: 6, icon: 'bullet', hue: '#ff8a5c',
  text: '{x:X2.5} Odds if you win against a dealer showing an Ace',
  hand: (c) => { if (isWin(c.handType) && c.dealerCards[0]?.rank === 14) c.xmult(2.5); } });
C({ id: 'nine_tails', name: 'Cloud Nine', rarity: 2, cost: 7, icon: 'cloud', hue: '#ffcf6a',
  text: (s, run) => `Earn {$:1} for each {g:9} in your deck at the end of a table {d:(currently {$:${run.deck.filter((c) => c.rank === 9 && c.ink !== 'stone').length}})}`,
  endMoney: (run) => run.deck.filter((c) => c.rank === 9 && c.ink !== 'stone').length });
C({ id: 'face_collector', name: 'Rogues\u2019 Gallery', rarity: 1, cost: 5, icon: 'wanted', hue: '#ff6b6b',
  text: '{m:+3} Odds per scored face card. {m:+6} per face card instead if the dealer’s upcard is also a face card',
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
    text: `${mult ? `{m:+${mult}} Odds` : ''}${mult && chips ? ' and ' : ''}${chips ? `{c:+${chips}} Pot` : ''} if the hand is ${ht.map((h) => `{h:${h}}`).join(' or ')}`,
    hand: (c) => { if (c.handType && ht.includes(c.handType)) { if (chips) c.chips(chips); if (mult) c.mult(mult); } } });

typeFlat('crow_due', 'Quack Attack', ['blackjack', 'royal'], 'duck', '#9a8cff', 0, 10);
typeFlat('north_star', 'Sharpshooter', ['twentyone', 'flush'], 'bullet', '#ffe27a', 0, 12);
typeFlat('fishing_net', 'Horse Whisperer', ['charlie'], 'horse', '#7fd1ff', 120, 0);
typeFlat('thunder_drum', 'Dust Biter', ['dealerbust'], 'skull', '#ffd23f', 0, 8);
typeFlat('stray_dog', 'Ugly Duckling', ['underdog'], 'duckling', '#d9a066', 0, 15);
typeFlat('archer_glove', 'Quick Hands', ['outdraw'], 'holster', '#ff9a5c', 30, 5);
typeFlat('crane_wings', 'Tailwind', ['outdraw', 'dealerbust'], 'wing', '#f7ecd2', 50, 0);
typeFlat('lucky_whale', 'Lucky Loon', ['charlie', 'underdog'], 'loon', '#4f9dff', 0, 10, 2);

const typeX = (id: string, name: string, ht: HandTypeId[], icon: string, hue: string, x: number, rarity: 2 | 3) =>
  C({ id, name, rarity, cost: rarity === 2 ? 7 : 9, icon, hue,
    text: `{x:X${x}} Odds if the hand is ${ht.map((h) => `{h:${h}}`).join(' or ')}`,
    hand: (c) => { if (c.handType && ht.includes(c.handType)) c.xmult(x); } });

typeX('raven_king', 'Duke of Quackington', ['blackjack', 'royal'], 'tophat', '#8f7bff', 3, 3);
typeX('polar_star', 'Eagle Eye', ['twentyone', 'flush'], 'eagle', '#a8e8ff', 2.5, 3);
typeX('thousand_legs', 'Pony Express', ['charlie'], 'horse', '#ff7a3d', 3, 3);
typeX('raijin', 'Thunderbird', ['dealerbust'], 'lightning', '#ffe15a', 2, 2);
typeX('scrappy_cur', 'Scrappy Coyote', ['underdog'], 'coyote', '#ffb07a', 2.5, 2);
typeX('kyudo_master', 'Fastest Bill in the West', ['outdraw'], 'revolver', '#ff6a3d', 1.75, 2);

C({ id: 'balance_stone', name: 'White Flag', rarity: 2, cost: 6, icon: 'flag', hue: '#b8c4d9',
  text: '{h:push} hands give {x:X4} Odds and earn {$:2}',
  hand: (c) => { if (c.handType === 'push') { c.xmult(4); c.money(2); } } });

C({ id: 'old_almanac', name: 'Farmer\u2019s Almanac', rarity: 2, cost: 6, icon: 'book', hue: '#e6c27a',
  text: '{m:+1} Odds for each time this hand type has been played this run',
  hand: (c) => { if (c.handType) c.mult(c.run.handPlays[c.handType] ?? 0); } });

C({ id: 'rolling_daruma', name: 'Rolling Tumbleweed', rarity: 1, cost: 5, icon: 'tumbleweed', hue: '#ff3d3d',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+2} Odds for each consecutive winning hand. Resets on a loss {d:(currently {m:+${st(s).m}})}`,
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); },
  resolve: (c, s) => {
    if (c.copy || c.outcome === 'fold') return;
    if (isWin(c.handType)) { st(s).m += 2; c.msg('Rollin!'); }
    else if (c.outcome !== 'push') { if (st(s).m) c.msg('Snagged!'); st(s).m = 0; }
  } });

C({ id: 'bamboo_shoot', name: 'Cornfield', rarity: 1, cost: 4, icon: 'corn', hue: '#6ee7a8',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+1} Odds per hand won, loses {m:1} per hand lost {d:(currently {m:+${st(s).m}})}`,
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); },
  resolve: (c, s) => {
    if (c.copy || c.outcome === 'fold') return;
    if (isWin(c.handType)) st(s).m += 1;
    else if (c.outcome !== 'push') st(s).m = Math.max(0, st(s).m - 1);
  } });

C({ id: 'centipede', name: 'Long Caravan', rarity: 1, cost: 5, icon: 'wagon', hue: '#ffb03d',
  init: () => ({ c: 0 }),
  text: (s) => `Gains {c:+20} Pot whenever you win a {h:charlie} {d:(currently {c:+${st(s).c}})}`,
  hand: (c, s) => { if (st(s).c) c.chips(st(s).c); },
  after: (c, s) => { if (c.handType === 'charlie') { st(s).c += 20; c.msg('Upgrade!'); } } });

C({ id: 'abacus', name: 'Twenty-One Gun Salute', rarity: 2, cost: 6, icon: 'cannon', hue: '#e6b87a',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+3} Odds whenever your hand totals exactly 21 {d:(currently {m:+${st(s).m}})}`,
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); },
  after: (c, s) => { if (c.total === 21) { st(s).m += 3; c.msg('Upgrade!'); } } });

C({ id: 'square_seal', name: 'Square Dance', rarity: 1, cost: 4, icon: 'accordion', hue: '#ff6b5a',
  init: () => ({ c: 0 }),
  text: (s) => `Gains {c:+6} Pot each time a hand with exactly {g:4} cards scores {d:(currently {c:+${st(s).c}})}`,
  hand: (c, s) => { if (st(s).c) c.chips(st(s).c); },
  after: (c, s) => { if (c.cards.length === 4) { st(s).c += 6; c.msg('Upgrade!'); } } });

C({ id: 'echo_gong', name: 'Déjà Vu', rarity: 2, cost: 6, icon: 'spiral', hue: '#ffd27a',
  text: '{x:X2.5} Odds if this hand type was already scored this table',
  hand: (c) => { if (c.handType && c.table && c.table.typesPlayed.slice(0, -1).includes(c.handType)) c.xmult(2.5); } });

C({ id: 'sore_loser', name: 'Sore Loser', rarity: 1, cost: 5, icon: 'goose', hue: '#ff9a5c',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+4} Odds whenever you lose or bust. Resets after a win {d:(currently {m:+${st(s).m}})}`,
  hand: (c, s) => { if (st(s).m && isWin(c.handType)) c.mult(st(s).m); },
  resolve: (c, s) => {
    if (c.copy) return;
    if (c.outcome === 'lose' || c.outcome === 'bust') { st(s).m += 4; c.msg('Honk!'); }
    else if (isWin(c.handType)) st(s).m = 0;
  } });

// ---------------------------------------------------------------------------
// Blackjack mechanics
// ---------------------------------------------------------------------------

C({ id: 'ogre_belly', name: 'Bottomless Gullet', rarity: 3, cost: 9, icon: 'pelican', hue: '#ff4d4d',
  text: 'You bust over {g:22} instead of {g:21}',
  rules: (r) => { r.bustLimit += 1; } });
C({ id: 'four_leaf', name: 'Four-Leaf Clover', rarity: 3, cost: 9, icon: 'clover', hue: '#4fdc8a',
  text: '{h:charlie} needs only {g:4} cards',
  rules: (r) => { r.charlieSize = Math.min(r.charlieSize, 4); } });
C({ id: 'hungry_ghost', name: 'Hungry Vulture', rarity: 1, cost: 5, icon: 'vulture', hue: '#c8d6ff',
  text: 'The dealer must hit until {g:18}. {m:+4} Odds if the dealer busts',
  rules: (r) => { r.dealerStand = Math.max(r.dealerStand, 18); },
  hand: (c) => { if (c.dealerBusted) c.mult(4); } });
C({ id: 'third_eye', name: 'Sneaky Monocle', rarity: 2, cost: 6, icon: 'monocle', hue: '#ff7ad9',
  text: 'See the dealer’s hole card',
  rules: (r) => { r.seeHole = true; } });
C({ id: 'scrying_bowl', name: 'Crystal Ball', rarity: 2, cost: 7, icon: 'crystal', hue: '#9fe8ff',
  text: 'See the top card of the draw pile',
  rules: (r) => { r.seeTop = Math.max(r.seeTop, 1); } });
C({ id: 'paper_umbrella', name: 'Insurance Policy', rarity: 1, cost: 5, icon: 'umbrella', hue: '#ff6b8a',
  text: 'If the dealer is dealt a natural, that hand is not used up',
  rules: (r) => { r.insurance = true; } });
C({ id: 'double_happiness', name: 'Double or Nothing', rarity: 3, cost: 8, icon: 'coins', hue: '#ff3d3d',
  text: 'Doubling Down no longer costs an extra hand',
  rules: (r) => { r.doubleCost = 0; } });
C({ id: 'mirror_twins', name: 'Twin Ducklings', rarity: 2, cost: 7, icon: 'duckling', hue: '#c9b8ff',
  text: 'Splitting costs no extra hand. You may split any two 10-value cards',
  rules: (r) => { r.splitCost = 0; r.splitAnyTen = true; } });
C({ id: 'lucky_coin', name: 'Two-Headed Coin', rarity: 2, cost: 7, icon: 'coin', hue: '#ffd23f',
  text: 'Doubled hands give {x:X3} Odds instead of {x:X2}',
  rules: (r) => { r.doubleX = Math.max(r.doubleX, 3); } });
C({ id: 'golden_carp', name: 'Golden Egg', rarity: 3, cost: 8, icon: 'egg', hue: '#ffcf3d',
  text: 'Winning with a natural gives you {g:+1} hand',
  after: (c) => { if ((c.handType === 'blackjack' || c.handType === 'royal') && c.table) { c.table.handsLeft += 1; c.msg('+1 Hand', '#4fb6ff'); } } });
C({ id: 'shrine_fox', name: 'Duck and Cover', rarity: 2, cost: 6, icon: 'shield', hue: '#ff9a3d',
  text: 'The first time you bust each table, it counts as a {h:push} instead',
  bust: (c) => {
    if (!c.table || c.table.bustSaved) return false;
    c.table.bustSaved = true;
    c.msg('Ducked!');
    return true;
  } });
C({ id: 'phoenix_feather', name: 'Fire Feather', rarity: 2, cost: 7, icon: 'feather', hue: '#ff5b2a',
  text: 'Once per table, if a card would make you bust, it is discarded instead',
  bust: () => false });
C({ id: 'folded_fan', name: 'Know When to Fold \u2019Em', rarity: 1, cost: 5, icon: 'harmonica', hue: '#ffa8d0',
  text: (s, run) => `{c:+30} Pot for each fold remaining {d:(currently {c:+${(run.table?.foldsLeft ?? 0) * 30}})}`,
  hand: (c) => { if (c.table?.foldsLeft) c.chips(30 * c.table.foldsLeft); } });
C({ id: 'empty_bowl', name: 'Empty Holster', rarity: 1, cost: 5, icon: 'holster', hue: '#e9e2cf',
  text: '{m:+15} Odds when you have {g:0} folds remaining',
  hand: (c) => { if (c.table && c.table.foldsLeft === 0) c.mult(15); } });
C({ id: 'patient_monk', name: 'Patient Prospector', rarity: 1, cost: 4, icon: 'goldpan', hue: '#c7c1d9',
  text: 'At the end of a table where you never folded, earn {$:2} per fold remaining',
  endMoney: (run) => (run.table && run.table.foldsUsed === 0 ? run.table.foldsLeft * 2 : 0) });
C({ id: 'incense_burner', name: 'Campfire Stories', rarity: 3, cost: 8, icon: 'campfire', hue: '#d6b8ff',
  text: 'The first fold of each table levels up your most played hand type',
  fold: (c) => {
    if (!c.table || c.table.firstFoldDone) return;
    const ht = mostPlayed(c.run);
    c.levelUp(ht, 1);
    c.msg('Level up!');
  } });
C({ id: 'rag_picker', name: 'Junk Peddler', rarity: 2, cost: 6, icon: 'wheelbarrow', hue: '#c9a37a',
  text: 'If the first fold of a table has exactly {g:2} cards, destroy them and earn {$:3}',
  fold: (c, _s, cards) => {
    if (!c.table || c.table.firstFoldDone || cards.length !== 2 || c.copy) return;
    for (const k of cards) c.destroyCard(k.id);
    c.money(3);
  } });
C({ id: 'faceless_one', name: 'Card Shark', rarity: 1, cost: 4, icon: 'fish', hue: '#e0d8c8',
  text: 'Earn {$:5} when you fold a hand with {g:2} or more face cards',
  fold: (c, _s, cards) => { if (cards.filter((k) => isFace(k, c.rules)).length >= 2) c.money(5); } });
C({ id: 'pawnbroker', name: 'Pawn Shop Pelican', rarity: 1, cost: 4, icon: 'pelican', hue: '#e6c27a',
  text: (s, run) => `Earn {$:4} for each folded {g:${rankName(run.rotating.rank)}}. Rank changes every table`,
  fold: (c, _s, cards) => { const n = cards.filter((k) => k.ink !== 'stone' && k.rank === c.run.rotating.rank).length; if (n) c.money(4 * n); } });
C({ id: 'moth_collector', name: 'Scrap Collector', rarity: 2, cost: 6, icon: 'bucket', hue: '#d9c7ff',
  init: () => ({ c: 0 }),
  text: (s, run) => `Gains {c:+4} Pot per folded {s:${run.rotating.suit2}} card. Suit changes every table {d:(currently {c:+${st(s).c}})}`,
  fold: (c, s, cards) => { if (c.copy) return; const n = cards.filter((k) => isSuit(k, c.run.rotating.suit2, c.rules)).length; if (n) { st(s).c += 4 * n; c.msg('Upgrade!'); } },
  hand: (c, s) => { if (st(s).c) c.chips(st(s).c); } });
C({ id: 'ramen', name: 'Bowl of Chili', rarity: 2, cost: 6, icon: 'pepper', hue: '#ffcf8a',
  init: () => ({ x: 2 }),
  text: (s) => `{x:${fmtX(st(s).x)}} Odds. Loses {x:X0.02} Odds per card folded`,
  hand: (c, s) => c.xmult(st(s).x),
  fold: (c, s, cards) => {
    if (c.copy) return;
    st(s).x = Math.round((st(s).x - 0.02 * cards.length) * 100) / 100;
    if (st(s).x <= 1) { c.msg('Scorched!'); c.destroyCharm(s.uid); }
  } });
C({ id: 'kite_runner', name: 'Riverboat Gambler', rarity: 1, cost: 4, icon: 'dice', hue: '#7fb8ff',
  text: '{m:+3} Odds for each hit taken this hand',
  hand: (c) => { const h = c.hand?.hits ?? 0; if (h) c.mult(3 * h); } });
C({ id: 'stoic_monk', name: 'Steady Hands', rarity: 1, cost: 4, icon: 'hand', hue: '#b6e3c9',
  text: '{c:+60} Pot if you won without hitting',
  hand: (c) => { if (isWin(c.handType) && (c.hand?.hits ?? 0) === 0) c.chips(60); } });
C({ id: 'stacked_stones', name: 'Stacked Deck', rarity: 1, cost: 4, icon: 'crate', hue: '#b8c4d9',
  text: '{m:+4} Odds for each card in the hand beyond the second',
  hand: (c) => { const n = c.cards.length - 2; if (n > 0) c.mult(4 * n); } });
C({ id: 'tightrope', name: 'High Noon', rarity: 2, cost: 6, icon: 'sun', hue: '#ffcf8a',
  text: '{x:X1.5} Odds if your total is {g:20} or more',
  hand: (c) => { if (c.total >= 20) c.xmult(1.5); } });
C({ id: 'low_tide', name: 'Dry Creek', rarity: 1, cost: 5, icon: 'fishbone', hue: '#4fb6ff',
  text: '{m:+3} Odds for each point your total is below 21',
  hand: (c) => { const d = 21 - c.total; if (d > 0) c.mult(3 * d); } });
C({ id: 'measuring_stick', name: 'Lasso Length', rarity: 1, cost: 4, icon: 'lasso', hue: '#e9dcc0',
  text: '{c:+15} Pot for each point you beat the dealer by',
  hand: (c) => { if (!c.dealerBusted && c.total > c.dealerTotal) c.chips(15 * (c.total - c.dealerTotal)); } });
C({ id: 'heckling_crow', name: 'Heckling Crow', rarity: 1, cost: 4, icon: 'crow', hue: '#9a8cff',
  text: 'Earn {$:2} whenever the dealer busts',
  resolve: (c, s) => { if (c.dealerBusted && c.hand && !c.hand.fromSplit && !c.copy) c.money(2); } });
C({ id: 'paper_tiger', name: 'Easy Pickings', rarity: 1, cost: 5, icon: 'pigeon', hue: '#ffb03d',
  text: '{m:+10} Odds if the dealer’s upcard is {g:4, 5 or 6}',
  hand: (c) => { const u = c.dealerCards[0]; if (u && u.ink !== 'stone' && u.rank >= 4 && u.rank <= 6) c.mult(10); } });
C({ id: 'bean_counter', name: 'Bean Counter', rarity: 2, cost: 6, icon: 'beans', hue: '#c9e67a',
  text: (s, run) => `{m:+2} Odds per point of the running count {d:(2-6s seen minus 10s, faces and Aces seen; currently {m:+${Math.max(0, runningCount(run)) * 2}})}`,
  hand: (c) => { const n = runningCount(c.run); if (n > 0) c.mult(2 * n); } });
C({ id: 'deep_well', name: 'Deep Well', rarity: 1, cost: 5, icon: 'bucket', hue: '#4f9dff',
  text: (s, run) => `{c:+3} Pot for each card left in the draw pile {d:(currently {c:+${(run.table?.shoe.length ?? run.deck.length) * 3}})}`,
  hand: (c) => { if (c.table) c.chips(3 * c.table.shoe.length); } });
C({ id: 'river_stone', name: 'Light Packer', rarity: 2, cost: 6, icon: 'tent', hue: '#9fc7ff',
  text: (s, run) => `{m:+4} Odds for each card your deck is below its starting size {d:(currently {m:+${Math.max(0, startSize(run) - run.deck.length) * 4}})}`,
  hand: (c) => { const n = startSize(c.run) - c.run.deck.length; if (n > 0) c.mult(4 * n); } });
C({ id: 'tired_dealer', name: 'Tuckered-Out Dealer', rarity: 1, cost: 4, icon: 'coffee', hue: '#d9c7a0',
  text: '{m:+4} Odds for each card in the dealer’s hand',
  hand: (c) => { if (c.dealerCards.length) c.mult(4 * c.dealerCards.length); } });
C({ id: 'giant_slayer', name: 'Goose Slayer', rarity: 2, cost: 7, icon: 'knife', hue: '#ff6a5a',
  text: '{x:X2} Odds if you beat a dealer total of {g:19} or more',
  hand: (c) => { if (isWin(c.handType) && !c.dealerBusted && c.dealerTotal >= 19) c.xmult(2); } });
C({ id: 'chopsticks', name: 'Two-Step', rarity: 1, cost: 4, icon: 'boot', hue: '#ffb07a',
  text: '{m:+12} Odds if the hand has exactly {g:2} cards',
  hand: (c) => { if (c.cards.length === 2) c.mult(12); } });
C({ id: 'three_monkeys', name: 'Clutch of Three', rarity: 2, cost: 6, icon: 'nest', hue: '#d9a066',
  text: '{x:X1.75} Odds if the hand has exactly {g:3} cards',
  hand: (c) => { if (c.cards.length === 3) c.xmult(1.75); } });
C({ id: 'kite_string', name: 'Long Rope', rarity: 1, cost: 4, icon: 'rope', hue: '#ff8ab3',
  text: '{c:+15} Pot for each card in the hand',
  hand: (c) => c.chips(15 * c.cards.length) });
C({ id: 'double_dragon', name: 'Double Barrel', rarity: 2, cost: 7, icon: 'rifle', hue: '#4fdc8a',
  text: 'Doubled hands also gain {c:+100} Pot',
  hand: (c) => { if (c.hand?.doubled) c.chips(100); } });
C({ id: 'split_bamboo', name: 'Split the Pot', rarity: 2, cost: 6, icon: 'chips', hue: '#9be37a',
  text: 'Hands created by splitting give {x:X2} Odds',
  hand: (c) => { if (c.hand?.fromSplit) c.xmult(2); } });
C({ id: 'dawn_rooster', name: 'Early Bird', rarity: 2, cost: 6, icon: 'rooster', hue: '#ff9a3d',
  text: '{x:X2} Odds on the first hand of each table',
  hand: (c) => { if (c.isFirst) c.xmult(2); } });
C({ id: 'dusk_crane', name: 'Last Call', rarity: 2, cost: 7, icon: 'mug', hue: '#ff7aa8',
  text: '{x:X3} Odds on the final hand of each table',
  hand: (c) => { if (c.isLast) c.xmult(3); } });
C({ id: 'twilight_bell', name: 'Closing Time Bell', rarity: 2, cost: 6, icon: 'bell', hue: '#c9a3ff',
  text: 'On the final hand of each table, every scored card scores twice',
  retrig: (c) => (c.isLast ? 1 : 0) });
C({ id: 'hanging_scroll', name: 'Encore! Encore!', rarity: 1, cost: 4, icon: 'piano', hue: '#f7d9a6',
  text: 'The first scored card scores {g:2} extra times',
  retrig: (c, _s, card) => (c.scored[0]?.id === card.id ? 2 : 0) });
C({ id: 'bubbling_spring', name: 'Hot Spring', rarity: 2, cost: 6, icon: 'bathtub', hue: '#7fe8ff',
  init: () => ({ n: 10 }),
  text: (s) => `For the next {g:${st(s).n}} scoring hands, every scored card scores twice`,
  retrig: () => 1,
  after: (c, s) => { st(s).n -= 1; if (st(s).n <= 0) { c.msg('Drained'); c.destroyCharm(s.uid); } } });
C({ id: 'punch_card', name: 'Punch Card', rarity: 2, cost: 5, icon: 'ticket', hue: '#ff6b5a',
  init: () => ({ n: 0 }),
  text: (s) => `Every {g:6}th hand played gets {x:X4} Odds {d:(${5 - (st(s).n % 6) <= 0 ? 'Active!' : `${5 - (st(s).n % 6)} remaining`})}`,
  hand: (c, s) => { if (st(s).n % 6 === 5) c.xmult(4); },
  resolve: (c, s) => { if (!c.copy && c.outcome !== 'fold' && !c.hand?.fromSplit) st(s).n += 1; } });

// ---------------------------------------------------------------------------
// Card modification synergies
// ---------------------------------------------------------------------------

C({ id: 'gold_leaf_fox', name: 'Gold Digger', rarity: 2, cost: 7, icon: 'pickaxe', hue: '#ffd23f',
  text: 'Scored face cards become {g:Gold Plated}',
  card: (c, _s, card) => { if (!c.copy && isFace(card, c.rules) && card.ink !== 'gilded') { card.ink = 'gilded'; c.msg('Gold Plated!', '#ffd23f'); } } });
C({ id: 'ink_drinker', name: 'Snake Oil Sipper', rarity: 2, cost: 7, icon: 'tonic', hue: '#b04dff',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.1} Odds per scored inked card, then removes its ink {d:(currently {x:${fmtX(st(s).x)}})}`,
  card: (c, s, card) => {
    if (c.copy || !card.ink || card.ink === 'stone') return;
    card.ink = undefined;
    st(s).x = Math.round((st(s).x + 0.1) * 100) / 100;
    c.msg('Gulp!', '#b04dff');
  },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'paper_golem', name: 'Hoarder Hen', rarity: 2, cost: 7, icon: 'chicken', hue: '#e9e2cf',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.25} Odds whenever a card is added to your deck {d:(currently {x:${fmtX(st(s).x)}})}`,
  cardAdded: (c, s) => { st(s).x += 0.25; },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'mirror_pond', name: 'Mirror Mirage', rarity: 3, cost: 8, icon: 'mirror', hue: '#7fd1ff',
  text: 'If the first hand of a table is a natural, add a permanent copy of both cards to your deck',
  after: (c) => {
    if (!c.isFirst || c.copy || !(c.handType === 'blackjack' || c.handType === 'royal')) return;
    for (const k of c.cards) c.addCard({ ...k, id: undefined as unknown as number });
    c.msg('Copied!');
  } });
C({ id: 'wax_stamp', name: 'Branding Iron', rarity: 2, cost: 6, icon: 'stamp', hue: '#e2382b',
  text: 'When a table starts, add a random card with a random brand to your deck',
  tableStart: (c) => {
    const seals = ['red', 'gold', 'blue', 'purple'] as const;
    c.addCard({ seal: c.rng.pick(seals) });
    c.msg('+1 Card');
  } });
C({ id: 'rock_garden', name: 'Rock Collector', rarity: 2, cost: 6, icon: 'rock', hue: '#a8b0c0',
  text: 'When a table starts, add a {g:Rock} card to your deck',
  tableStart: (c) => { c.addCard({ ink: 'stone' }); c.msg('+1 Rock'); } });
C({ id: 'shard_collector', name: 'Broken Bottle Bill', rarity: 2, cost: 6, icon: 'shotglass', hue: '#bfe9ff',
  text: (s, run) => `Gains {x:X0.75} Odds for each Glass card broken this run {d:(currently {x:${fmtX(1 + run.stats.glassShattered * 0.75)}})}`,
  hand: (c) => { if (c.run.stats.glassShattered) c.xmult(1 + 0.75 * c.run.stats.glassShattered); } });
C({ id: 'lucky_daruma', name: 'Lucky Penny', rarity: 2, cost: 6, icon: 'coin', hue: '#ffd23f',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.25} Odds each time a {g:Lucky} card pays out {d:(currently {x:${fmtX(st(s).x)}})}`,
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'treasure_map', name: 'Treasure Map', rarity: 1, cost: 5, icon: 'map', hue: '#e6c27a',
  text: 'Scored {g:Gold Plated} cards earn {$:4}',
  card: (c, _s, card) => { if (card.ink === 'gilded') c.money(4); } });
C({ id: 'stone_garden', name: 'Quarry Quacker', rarity: 2, cost: 6, icon: 'rock', hue: '#8a93a6',
  text: (s, run) => `{c:+25} Pot for each Rock card in your deck {d:(currently {c:+${run.deck.filter((k) => k.ink === 'stone').length * 25}})}`,
  hand: (c) => { const n = c.run.deck.filter((k) => k.ink === 'stone').length; if (n) c.chips(25 * n); } });
C({ id: 'calligraphy_license', name: 'Fancy Penmanship', rarity: 3, cost: 8, icon: 'scroll', hue: '#ff6a5a',
  text: (s, run) => `{x:X3} Odds if your deck has at least {g:16} inked cards {d:(currently ${run.deck.filter((k) => !!k.ink).length})}`,
  hand: (c) => { if (c.run.deck.filter((k) => !!k.ink).length >= 16) c.xmult(3); } });
C({ id: 'spirit_faces', name: 'Disguise Kit', rarity: 2, cost: 5, icon: 'mustache', hue: '#d8ffe0',
  text: 'Every card counts as a face card',
  rules: (r) => { r.allFace = true; } });
C({ id: 'jade_carver', name: 'Greenback Grabber', rarity: 1, cost: 5, icon: 'dollar', hue: '#4fdc8a',
  text: 'Scored {g:Greenback} cards give an extra {m:+6} Odds',
  card: (c, _s, card) => { if (card.ink === 'jade') c.mult(6); } });
C({ id: 'glassblower', name: 'Glassblower', rarity: 2, cost: 6, icon: 'shotglass', hue: '#c9f4ff',
  text: 'When a table starts, turn a random card in your deck to {g:Glass}',
  tableStart: (c) => {
    const pool = c.run.deck.filter((k) => !k.ink);
    if (!pool.length) return;
    c.rng.pick(pool).ink = 'glass';
    c.msg('Glass!');
  } });
C({ id: 'seal_maker', name: 'Rancher\u2019s Pride', rarity: 3, cost: 8, icon: 'bull', hue: '#ffcf3d',
  text: 'Scored cards with a brand give {x:X1.5} Odds',
  card: (c, _s, card) => { if (card.seal) c.xmult(1.5); } });
C({ id: 'ash_walker', name: 'Pop Goes the Duck', rarity: 1, cost: 5, icon: 'bubbles', hue: '#b0a8a0',
  text: (s) => `When a {g:Rubber Ducky} card pops, earn {$:3} and gain {m:+3} Odds {d:(currently {m:+${st(s).m ?? 0}})}`,
  init: () => ({ m: 0 }),
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });

// ---------------------------------------------------------------------------
// Economy
// ---------------------------------------------------------------------------

C({ id: 'beckoning_cat', name: 'Piggy Bank', rarity: 1, cost: 5, icon: 'piggybank', hue: '#ffd23f',
  text: 'Earn {$:1} whenever you win a hand',
  resolve: (c) => { if (isWin(c.handType)) c.money(1); } });
C({ id: 'golden_koi', name: 'Gold Nugget', rarity: 1, cost: 6, icon: 'nugget', hue: '#ffcf3d',
  text: 'Earn {$:4} at the end of each table',
  endMoney: () => 4 });
C({ id: 'money_tree', name: 'Compound Interest', rarity: 2, cost: 5, icon: 'moneybag', hue: '#ffd23f',
  text: 'Earn an extra {$:1} of interest for every {$:5} you hold at the end of a table',
  endMoney: (run) => Math.min(Math.floor(Math.max(0, run.money) / 5), run.interestCap) });
C({ id: 'sky_lantern', name: 'Reward Poster', rarity: 2, cost: 6, icon: 'wanted', hue: '#ffb03d',
  init: () => ({ v: 1 }),
  text: (s) => `Earn {$:${st(s).v}} at the end of each table. Grows by {$:2} each time you defeat an Outlaw`,
  endMoney: (_run, s) => st(s).v,
  hostBeaten: (_c, s) => { st(s).v += 2; } });
C({ id: 'hens_egg', name: 'Hen\u2019s Egg', rarity: 1, cost: 4, icon: 'egg', hue: '#fff1d6',
  text: (s) => `Gains {$:3} of sell value at the end of each table {d:(sells for {$:${sellValue(s)}})}`,
  tableEnd: (c, s) => { if (!c.copy) { s.extraSell = (s.extraSell ?? 0) + 3; c.msg('Value up!', '#ffd23f'); } } });
C({ id: 'gift_box', name: 'Care Package', rarity: 2, cost: 6, icon: 'crate', hue: '#ff6b8a',
  text: 'At the end of each table, all Doodads and consumables gain {$:1} of sell value',
  tableEnd: (c) => { if (c.copy) return; for (const k of c.run.charms) k.extraSell = (k.extraSell ?? 0) + 1; c.run.flags.consBonus = (c.run.flags.consBonus ?? 0) + 1; c.msg('Value up!', '#ffd23f'); } });
C({ id: 'merchant_card', name: 'Snake Oil Salesman', rarity: 1, cost: 4, icon: 'tonic', hue: '#e6c27a',
  text: 'Scored face cards have a {g:1 in 2} chance to earn {$:2}',
  card: (c, _s, card) => { if (isFace(card, c.rules) && c.chance(2)) c.money(2); } });
C({ id: 'ox_cart', name: 'Moneybags McDuck', rarity: 2, cost: 6, icon: 'moneybag', hue: '#c08a5a',
  text: (s, run) => `{c:+2} Pot for each Buck you hold {d:(currently {c:+${Math.max(0, run.money) * 2}})}`,
  hand: (c) => { if (c.run.money > 0) c.chips(2 * c.run.money); } });
C({ id: 'straw_sandals', name: 'Bootstraps', rarity: 2, cost: 7, icon: 'boot', hue: '#e6c27a',
  text: (s, run) => `{m:+2} Odds for every {$:5} you hold {d:(currently {m:+${Math.max(0, Math.floor(run.money / 5)) * 2}})}`,
  hand: (c) => { const n = Math.floor(c.run.money / 5); if (n > 0) c.mult(2 * n); } });
C({ id: 'iou_note', name: 'IOU Note', rarity: 1, cost: 1, icon: 'scroll', hue: '#f7ecd2',
  text: 'You can go into debt, down to {$:-20}',
  noCopy: true });
C({ id: 'river_pirate', name: 'Claim Jumper', rarity: 1, cost: 4, icon: 'pickaxe', hue: '#ff6b5a',
  text: (s, run) => `Adds the sell value of all other Doodads to Odds {d:(currently {m:+${run.charms.filter((k) => k.uid !== s.uid).reduce((a, k) => a + sellValue(k), 0)}})}`,
  hand: (c, s) => { const n = c.run.charms.filter((k) => k.uid !== s.uid).reduce((a, k) => a + sellValue(k), 0); if (n) c.mult(n); } });
C({ id: 'oni_tamer', name: 'Outlaw Wrangler', rarity: 2, cost: 7, icon: 'lasso', hue: '#ff3d3d',
  text: 'Earn {$:8} each time an Outlaw’s curse affects you',
  resolve: (c) => { if (c.table?.hostTriggered && !c.copy) { c.table.hostTriggered = false; c.money(8); } } });
C({ id: 'stargazer', name: 'Tall Tale Teller', rarity: 2, cost: 6, icon: 'book', hue: '#a8c8ff',
  text: (s, run) => `Earn {$:1} at the end of each table for each unique Tall Tale used this run {d:(currently {$:${run.stats.uniqueStars.length}})}`,
  endMoney: (run) => run.stats.uniqueStars.length });
C({ id: 'bounty_poster', name: 'Bounty Poster', rarity: 1, cost: 5, icon: 'wanted', hue: '#ffcf8a',
  text: 'Earn {$:3} for each natural {h:blackjack}',
  resolve: (c) => { if (c.handType === 'blackjack' || c.handType === 'royal') c.money(3); } });
C({ id: 'vagabond_monk', name: 'Saddle Tramp', rarity: 3, cost: 8, icon: 'tumbleweed', hue: '#c9b8ff',
  text: 'Create a {g:Tonic} when you win a hand while holding {$:4} or less',
  after: (c) => { if (c.run.money <= 4 && isWin(c.handType)) { if (c.createCons('fortune')) c.msg('+Tonic', '#c9b8ff'); } } });
C({ id: 'shooting_star', name: 'Shooting Star', rarity: 2, cost: 6, icon: 'star', hue: '#ffe27a',
  text: 'When a hand scores, {g:1 in 4} chance its hand type gains a level',
  after: (c) => { if (c.handType && c.chance(4)) { c.levelUp(c.handType, 1); c.msg('Level up!'); } } });
C({ id: 'fortune_octopus', name: 'Eight-Ball Eddie', rarity: 1, cost: 5, icon: 'bomb', hue: '#ff7ad9',
  text: 'Each scored {g:8} has a {g:1 in 4} chance to create a {g:Tonic}',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank === 8 && c.chance(4)) { if (c.createCons('fortune')) c.msg('+Tonic', '#c9b8ff'); } } });
C({ id: 'cartomancer', name: 'Medicine Show', rarity: 2, cost: 6, icon: 'tonic', hue: '#c9b8ff',
  text: 'Create a {g:Tonic} when a table starts',
  tableStart: (c) => { if (c.createCons('fortune')) c.msg('+Tonic', '#c9b8ff'); } });
C({ id: 'seance_table', name: 'Moonshiner', rarity: 2, cost: 6, icon: 'jug', hue: '#b04dff',
  text: 'Create a {g:Moonshine} when you win a {h:flush}',
  after: (c) => { if (c.handType === 'flush') { if (c.createCons('mask')) c.msg('+Moonshine', '#b04dff'); } } });
C({ id: 'star_counter', name: 'Old Prospector\u2019s Tales', rarity: 2, cost: 6, icon: 'goldpan', hue: '#9fc7ff',
  text: 'Create a {g:Tall Tale} when you get a natural {h:blackjack}',
  after: (c) => { if (c.handType === 'blackjack' || c.handType === 'royal') { if (c.createCons('star')) c.msg('+Tale', '#9fc7ff'); } } });
C({ id: 'dream_moth', name: 'Pack Rat', rarity: 1, cost: 4, icon: 'crate', hue: '#e6c8ff',
  text: '{g:1 in 2} chance to create a {g:Tonic} when you open a Crate',
  packOpen: (c) => { if (c.chance(2)) { if (c.createCons('fortune')) c.msg('+Tonic', '#c9b8ff'); } } });
C({ id: 'street_urchins', name: 'Duckling Gang', rarity: 1, cost: 6, icon: 'duckling', hue: '#ffb07a',
  text: 'When a table starts, create up to {g:2} common Doodads',
  tableStart: (c) => { c.createCharm({ rarity: 1 }); c.createCharm({ rarity: 1 }); } });
C({ id: 'cat_burglar', name: 'Horse Thief', rarity: 2, cost: 6, icon: 'horse', hue: '#8a8aa0',
  text: '{g:+3} hands each table. Lose all folds',
  slots: { hands: 3 },
  tableStart: (c) => { if (c.table) c.table.foldsLeft = 0; } });
C({ id: 'drunken_monk', name: 'Tipsy Turkey', rarity: 1, cost: 5, icon: 'turkey', hue: '#ffcf8a',
  text: '{g:+1} fold each table',
  slots: { folds: 1 } });
C({ id: 'spare_hand', name: 'Hired Hand', rarity: 2, cost: 7, icon: 'hand', hue: '#ffe2c8',
  text: '{g:+1} hand each table',
  slots: { hands: 1 } });
C({ id: 'street_performer', name: 'Traveling Showman', rarity: 2, cost: 5, icon: 'tophat', hue: '#ff8ab3',
  text: 'Doodads you already own may appear in the shop',
  noCopy: true });
C({ id: 'clown_spirit', name: 'Rodeo Clown', rarity: 1, cost: 4, icon: 'balloon', hue: '#ff8ad0',
  text: '{g:1} free reroll in each shop',
  shopEnter: (c) => { if (c.run.shop) c.run.shop.freeRerolls += 1; } });
C({ id: 'astronomer', name: 'Astronomer Owl', rarity: 2, cost: 8, icon: 'spyglass', hue: '#7fb8ff',
  text: 'All Tall Tales and Tall Tale Crates in the shop are free',
  noCopy: true });
C({ id: 'fortune_teller', name: 'Empty Bottles', rarity: 1, cost: 6, icon: 'crystal', hue: '#c9b8ff',
  text: (s, run) => `{m:+1} Odds for each Tonic used this run {d:(currently {m:+${run.stats.fortunesUsed}})}`,
  hand: (c) => { if (c.run.stats.fortunesUsed) c.mult(c.run.stats.fortunesUsed); } });
C({ id: 'star_map', name: 'Star Chart', rarity: 2, cost: 6, icon: 'compass', hue: '#9fc7ff',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.1} Odds each time a Tall Tale is used {d:(currently {x:${fmtX(st(s).x)}})}`,
  useCons: (c, s, kind) => { if (kind === 'star' && !c.copy) { st(s).x = Math.round((st(s).x + 0.1) * 100) / 100; c.msg('Upgrade!'); } },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'old_photograph', name: 'Hooky Hooligan', rarity: 2, cost: 6, icon: 'bandana', hue: '#d9c7a0',
  text: (s, run) => `Gains {x:X0.25} Odds for each table skipped this run {d:(currently {x:${fmtX(1 + run.stats.tablesSkipped * 0.25)}})}`,
  hand: (c) => { if (c.run.stats.tablesSkipped) c.xmult(1 + 0.25 * c.run.stats.tablesSkipped); } });
C({ id: 'red_envelope', name: 'Unopened Mail', rarity: 1, cost: 5, icon: 'mailbox', hue: '#ff3d3d',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+3} Odds whenever a Crate is skipped {d:(currently {m:+${st(s).m}})}`,
  packSkip: (c, s) => { st(s).m += 3; c.msg('Upgrade!'); },
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });
C({ id: 'shell_game', name: 'Shell Game', rarity: 2, cost: 6, icon: 'dice', hue: '#ffc6a8',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+2} Odds per reroll in the shop {d:(currently {m:+${st(s).m}})}`,
  reroll: (c, s) => { st(s).m += 2; },
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });
C({ id: 'bonfire', name: 'Bonfire', rarity: 3, cost: 9, icon: 'campfire', hue: '#ff6a2a',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.25} Odds for each card sold. Resets when you defeat an Outlaw {d:(currently {x:${fmtX(st(s).x)}})}`,
  anySold: (c, s) => { st(s).x += 0.25; c.msg('Crackle!'); },
  hostBeaten: (c, s) => { st(s).x = 1; },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'jizo_statue', name: 'Second Wind', rarity: 2, cost: 5, icon: 'windmill', hue: '#c7c1d9',
  text: 'If you run out of hands with at least {g:25%} of the target scored, you win the table anyway. Then this Doodad is destroyed',
  noCopy: true,
  save: (c, s) => {
    if (!c.table || c.table.score < c.table.target * 0.25) return false;
    c.msg('Saved!');
    c.destroyCharm(s.uid);
    return true;
  } });
C({ id: 'frenzied_oni', name: 'Mad Bull', rarity: 2, cost: 7, icon: 'bull', hue: '#ff2d2d',
  init: () => ({ x: 1 }),
  text: (s) => `When a Saloon Game, High Stakes or Bank Job table starts, gains {x:X0.5} Odds and destroys a random other Doodad {d:(currently {x:${fmtX(st(s).x)}})}`,
  tableStart: (c, s) => {
    if (c.copy || !c.table || c.table.kind === 'host') return;
    st(s).x += 0.5;
    const others = c.run.charms.filter((k) => k.uid !== s.uid);
    if (others.length) c.destroyCharm(c.rng.pick(others).uid);
    c.msg('Stampede!');
  },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'ritual_knife', name: 'Bowie Knife', rarity: 2, cost: 6, icon: 'knife', hue: '#ff6b6b',
  init: () => ({ m: 0 }),
  text: (s) => `When a table starts, destroys the Doodad to its right and gains Odds equal to twice its sell value {d:(currently {m:+${st(s).m}})}`,
  tableStart: (c, s) => {
    if (c.copy) return;
    const i = c.run.charms.findIndex((k) => k.uid === s.uid);
    const right = c.run.charms[i + 1];
    if (!right) return;
    st(s).m += 2 * sellValue(right);
    c.destroyCharm(right.uid);
    c.msg('Stabbed!');
  },
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });
C({ id: 'collector_album', name: 'Medal Collector', rarity: 3, cost: 8, icon: 'medal', hue: '#4fdc8a',
  text: 'Each uncommon Doodad gives {x:X1.5} Odds',
  hand: (c) => {
    const n = c.run.charms.filter((k) => !k.disabled && CHARM[k.id]?.rarity === 2).length;
    if (n) c.xmult(Math.pow(1.5, n));
  } });
C({ id: 'exorcist_seal', name: 'Sheriff\u2019s Warrant', rarity: 2, cost: 5, icon: 'badge', hue: '#ff3d3d',
  text: 'Sell this Doodad to disable the current Outlaw’s curse',
  noCopy: true,
  sold: (c) => { if (c.table && c.table.hostId) { c.table.hostDisabled = true; c.msg('Arrested!'); } } });
C({ id: 'paper_ticket', name: 'Two-for-One Ticket', rarity: 2, cost: 6, icon: 'ticket', hue: '#ffcf8a',
  text: 'Sell this Doodad to receive a {g:Double Telegram}',
  noCopy: true,
  sold: (c) => { c.addTag('double'); } });
C({ id: 'ghost_twin', name: 'Evil Twin', rarity: 3, cost: 8, icon: 'ghost', hue: '#e6f0ff',
  init: () => ({ n: 0 }),
  text: (s) => `After {g:2} tables, sell this to copy a random other Doodad {d:(${Math.min(2, st(s).n)}/2)}`,
  noCopy: true,
  tableEnd: (c, s) => { st(s).n += 1; if (st(s).n === 2) c.msg('Ready!'); },
  sold: (c, s) => {
    if (st(s).n < 2) return;
    const others = c.run.charms.filter((k) => k.uid !== s.uid);
    if (!others.length) return;
    const t = c.rng.pick(others);
    c.createCharm({ id: t.id, finish: t.finish === 'phantom' ? undefined : t.finish, force: true });
  } });
C({ id: 'tracing_paper', name: 'Copy Duck', rarity: 3, cost: 10, icon: 'duck', hue: '#9fd8ff',
  text: 'Copies the ability of the Doodad to the right',
  noCopy: true });
C({ id: 'echo_mirror', name: 'Echo Canyon', rarity: 3, cost: 10, icon: 'mesa', hue: '#ffd6f0',
  text: 'Copies the ability of the leftmost Doodad',
  noCopy: true });
C({ id: 'loaded_dice', name: 'Loaded Dice', rarity: 2, cost: 6, icon: 'dice', hue: '#f7ecd2',
  text: 'Doubles every chance on Doodads, cards and Tonics {d:(1 in 4 becomes 2 in 4)}',
  noCopy: true,
  rules: (r) => { r.probMult *= 2; } });
C({ id: 'bubble_tea', name: 'Lightning Bug Jar', rarity: 1, cost: 5, icon: 'lightbulb', hue: '#d8ff7a',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+1} Odds each time a card is dealt to you. Resets when you defeat an Outlaw {d:(currently {m:+${st(s).m}})}`,
  hit: (c, s) => { st(s).m += 1; },
  hostBeaten: (c, s) => { st(s).m = 0; },
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });
C({ id: 'mushroom_ring', name: 'Mystery Stew', rarity: 1, cost: 5, icon: 'cauldron', hue: '#ff6b5a',
  text: '{g:1 in 3} chance for {m:+20} Odds, otherwise {c:+40} Pot',
  hand: (c) => { if (c.chance(3)) c.mult(20); else c.chips(40); } });
C({ id: 'bee_hive', name: 'Worm Collector', rarity: 1, cost: 4, icon: 'worm', hue: '#ffd23f',
  text: 'Scored cards give {c:+8} Pot',
  card: (c) => c.chips(8) });
C({ id: 'owl_night', name: 'Barn Owl', rarity: 2, cost: 6, icon: 'owl', hue: '#a08cff',
  text: '{x:X2} Odds during Outlaw tables',
  hand: (c) => { if (c.table?.kind === 'host') c.xmult(2); } });
C({ id: 'peach_boy', name: 'Snack Pack', rarity: 1, cost: 5, icon: 'sandwich', hue: '#ffb3c7',
  text: '{m:+8} Odds if you are holding a {g:Tonic}, {g:Tall Tale} or {g:Moonshine}',
  hand: (c) => { if (c.run.consumables.length) c.mult(8); } });
C({ id: 'bear_hug', name: 'Seventeen Apples', rarity: 1, cost: 5, icon: 'apple', hue: '#c08a5a',
  text: '{c:+50} Pot if the dealer stands on exactly 17',
  hand: (c) => { if (!c.dealerBusted && c.dealerTotal === 17) c.chips(50); } });
C({ id: 'turtle_shell', name: 'Stubborn Mule', rarity: 1, cost: 5, icon: 'horse', hue: '#6ee7a8',
  text: '{m:+6} Odds if your total is {g:16} or less',
  hand: (c) => { if (c.total <= 16) c.mult(6); } });
C({ id: 'snake_eyes', name: 'Snake Eyes', rarity: 2, cost: 6, icon: 'snake', hue: '#7fe07a',
  text: 'If your first two cards are a pair, the hand gives {x:X2} Odds',
  hand: (c) => { const [a, b] = c.cards; if (a && b && a.ink !== 'stone' && b.ink !== 'stone' && a.rank === b.rank) c.xmult(2); } });
C({ id: 'butterfly_dream', name: 'Mixed Feathers', rarity: 2, cost: 6, icon: 'parrot', hue: '#ffa8f0',
  text: '{x:X1.5} Odds if every card in the hand has a different suit',
  hand: (c) => {
    if (c.cards.length < 2 || c.cards.some((k) => k.ink === 'stone' || k.ink === 'spirit')) return;
    if (new Set(c.cards.map((k) => k.suit)).size === c.cards.length) c.xmult(1.5);
  } });
C({ id: 'hammer_luck', name: 'Prospector\u2019s Luck', rarity: 2, cost: 7, icon: 'pickaxe', hue: '#ffd23f',
  text: '{g:1 in 4} chance per scored card to earn {$:1}',
  card: (c) => { if (c.chance(4)) c.money(1); } });
C({ id: 'cauldron', name: 'Chuckwagon Cook', rarity: 2, cost: 7, icon: 'cauldron', hue: '#9be37a',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+1} Odds for every consumable used {d:(currently {m:+${st(s).m}})}`,
  useCons: (c, s) => { st(s).m += 1; },
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });
C({ id: 'taiko_bridge', name: 'Fork in the Road', rarity: 1, cost: 5, icon: 'scissors', hue: '#ff6a5a',
  text: '{c:+25} Pot and {m:+5} Odds if you split this hand',
  hand: (c) => { if (c.hand?.fromSplit) { c.chips(25); c.mult(5); } } });
C({ id: 'needle_thread', name: 'Needle & Thread', rarity: 1, cost: 4, icon: 'needle', hue: '#e9dcc0',
  text: 'Winning with exactly {g:20} gives {m:+10} Odds',
  hand: (c) => { if (c.total === 20 && isWin(c.handType)) c.mult(10); } });
C({ id: 'fishing_hook', name: 'Fishing Pole', rarity: 1, cost: 4, icon: 'fish', hue: '#9fd8ff',
  text: 'Earn {$:1} for each card beyond the first two in a winning hand',
  resolve: (c) => { if (isWin(c.handType) && c.cards.length > 2) c.money(c.cards.length - 2); } });
C({ id: 'scissors', name: 'Penny Pincher', rarity: 2, cost: 6, icon: 'coin', hue: '#d0d8e8',
  text: 'Scored cards ranked {g:2-6} give {x:X1.1} Odds',
  card: (c, _s, card) => { if (card.ink !== 'stone' && card.rank <= 6) c.xmult(1.1); } });
C({ id: 'wheel_of_dharma', name: 'Wagon Wheel', rarity: 2, cost: 7, icon: 'wagonwheel', hue: '#ffcf3d',
  init: () => ({ i: 0 }),
  text: (s) => `Cycles each hand: {c:+80} Pot → {m:+15} Odds → {x:X2} Odds {d:(next: ${['Pot', 'Odds', 'X Odds'][st(s).i % 3]})}`,
  hand: (c, s) => { const i = st(s).i % 3; if (i === 0) c.chips(80); else if (i === 1) c.mult(15); else c.xmult(2); },
  after: (c, s) => { st(s).i += 1; } });
C({ id: 'lotus_bloom', name: 'Cactus Flower', rarity: 2, cost: 7, icon: 'cactus', hue: '#ff9ad8',
  init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+1} Odds for every scored {s:leaf} card {d:(currently {m:+${st(s).m}})}`,
  card: (c, s, card) => { if (!c.copy && isSuit(card, 'leaf', c.rules)) st(s).m += 1; },
  hand: (c, s) => { if (st(s).m) c.mult(st(s).m); } });
C({ id: 'chained_bell', name: 'Star Collector', rarity: 2, cost: 7, icon: 'badge', hue: '#ffd27a',
  init: () => ({ c: 0 }),
  text: (s) => `Gains {c:+10} Pot for every scored {s:bell} card {d:(currently {c:+${st(s).c}})}`,
  card: (c, s, card) => { if (!c.copy && isSuit(card, 'bell', c.rules)) st(s).c += 10; },
  hand: (c, s) => { if (st(s).c) c.chips(st(s).c); } });
C({ id: 'fire_wheel', name: 'Fireworks Show', rarity: 2, cost: 7, icon: 'rocket', hue: '#ff4b2b',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.05} Odds for every scored {s:flame} card {d:(currently {x:${fmtX(st(s).x)}})}`,
  card: (c, s, card) => { if (!c.copy && isSuit(card, 'flame', c.rules)) st(s).x = Math.round((st(s).x + 0.05) * 100) / 100; },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'moon_viewing', name: 'Horseshoe Collector', rarity: 2, cost: 7, icon: 'horseshoe', hue: '#b9c7ff',
  init: () => ({ c: 0 }),
  text: (s) => `Gains {c:+8} Pot for every scored {s:moon} card {d:(currently {c:+${st(s).c}})}`,
  card: (c, s, card) => { if (!c.copy && isSuit(card, 'moon', c.rules)) st(s).c += 8; },
  hand: (c, s) => { if (st(s).c) c.chips(st(s).c); } });
C({ id: 'spark_plug', name: 'Big Ten', rarity: 1, cost: 5, icon: 'chips', hue: '#ffe27a',
  text: '{c:+10} Pot for every 10-value card in the hand, and the same for the dealer’s',
  hand: (c) => { const n = c.cards.filter(isTenValue).length + c.dealerCards.filter(isTenValue).length; if (n) c.chips(10 * n); } });
C({ id: 'shimenawa', name: 'Jailhouse', rarity: 3, cost: 8, icon: 'jail', hue: '#f7d9a6',
  text: 'Protects every Doodad from being destroyed',
  noCopy: true });
C({ id: 'shield_of_dawn', name: 'Tin Foil Hat', rarity: 2, cost: 6, icon: 'cowboyhat', hue: '#b8c4d9',
  text: 'Outlaw curses that debuff cards have no effect',
  noCopy: true });
C({ id: 'spinning_top', name: 'Spin the Bottle', rarity: 1, cost: 4, icon: 'bottle', hue: '#ff9a7a',
  text: '{m:+0} to {m:+23} Odds, at random',
  hand: (c) => c.mult(Math.floor(c.rng.next() * 24)) });
C({ id: 'blind_swordsman', name: 'Blindfolded Gunslinger', rarity: 3, cost: 9, icon: 'bandana', hue: '#b8c4d9',
  text: '{x:X3} Odds if you stood on your first two cards against a dealer showing a 10 or an Ace',
  hand: (c) => {
    const up = c.dealerCards[0];
    if (c.cards.length === 2 && (c.hand?.hits ?? 0) === 0 && up && (isTenValue(up) || up.rank === 14)) c.xmult(3);
  } });
C({ id: 'night_market', name: 'Coupon Clipper', rarity: 1, cost: 5, icon: 'scissors', hue: '#ffcf3d',
  text: 'Shop items cost {$:1} less',
  noCopy: true });

// ---------------------------------------------------------------------------
// Grit and wagers
// ---------------------------------------------------------------------------

C({ id: 'thick_hide', name: 'Thick Hide', rarity: 2, cost: 7, icon: 'shield', hue: '#c9a37a',
  text: 'Whenever you would lose Grit, lose {g:1} less',
  noCopy: true });
C({ id: 'iron_gizzard', name: 'Iron Gizzard', rarity: 3, cost: 8, icon: 'anvil', hue: '#b8c4d9',
  text: '{g:+4} max Grit while you keep this. Heal {g:1} Grit after every table you win',
  noCopy: true,
  tableEnd: (c) => { c.run.grit = Math.min(c.run.maxGrit + 4, c.run.grit + 1); } });
C({ id: 'gamblers_grin', name: 'Gambler\u2019s Grin', rarity: 1, cost: 5, icon: 'tooth', hue: '#ffd23f',
  text: '{m:+10} Odds on Dollar and Bankroll wagers',
  hand: (c) => { if ((c.table?.wager ?? 1) > 1) c.mult(10); } });
C({ id: 'safe_bet', name: 'Safe Bet', rarity: 1, cost: 4, icon: 'piggybank', hue: '#ffb3c7',
  text: '{c:+40} Pot on Penny wagers',
  hand: (c) => { if ((c.table?.wager ?? 1) === 1) c.chips(40); } });
C({ id: 'last_stand', name: 'Last Stand', rarity: 3, cost: 8, icon: 'flag', hue: '#ff3d3d',
  text: '{x:X3} Odds while you have {g:3} Grit or less',
  hand: (c) => { if (c.run.grit <= 3) c.xmult(3); } });
C({ id: 'battle_scars', name: 'Battle Scars', rarity: 2, cost: 6, icon: 'bandana', hue: '#ff6a5a',
  text: (s, run) => `{x:X0.2} Odds for each point of missing Grit {d:(currently {x:${fmtX(1 + 0.2 * Math.max(0, run.maxGrit - run.grit))}})}`,
  hand: (c) => { const n = c.run.maxGrit - c.run.grit; if (n > 0) c.xmult(1 + 0.2 * n); } });
C({ id: 'all_in_annie', name: 'All-In Annie', rarity: 2, cost: 7, icon: 'chips', hue: '#ff8ab3',
  text: 'Bankroll wagers multiply by {x:X4} instead of {x:X3}',
  hand: (c) => { if ((c.table?.wager ?? 1) === 3) c.xmult(4 / 3); } });

// ---------------------------------------------------------------------------
// Legendary (only from The Legendary Jug)
// ---------------------------------------------------------------------------

C({ id: 'kaguya', name: 'Queen Quackington', rarity: 4, cost: 20, icon: 'crown', hue: '#ffe9a8',
  text: 'Scored Queens and Aces give {x:X1.75} Odds',
  card: (c, _s, card) => { if (card.ink !== 'stone' && (card.rank === 12 || card.rank === 14)) c.xmult(1.75); } });
C({ id: 'fujin_raijin', name: 'The Tornado Twins', rarity: 4, cost: 20, icon: 'tornado', hue: '#7fe8ff',
  text: 'When the dealer busts, every scored card scores {g:2} extra times',
  retrig: (c) => (c.dealerBusted ? 2 : 0) });
C({ id: 'lantern_keeper', name: 'The Legendary Quackjack', rarity: 4, cost: 20, icon: 'trophy', hue: '#ffcf3d',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X0.5} Odds for each natural {h:blackjack} {d:(currently {x:${fmtX(st(s).x)}})}`,
  after: (c, s) => { if (c.handType === 'blackjack' || c.handType === 'royal') { st(s).x += 0.5; c.msg('Legendary!'); } },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'shuten_doji', name: 'Bottomless Pete', rarity: 4, cost: 20, icon: 'pelican', hue: '#ff3d3d',
  text: 'You bust over {g:23} instead of 21. {x:X2} Odds',
  rules: (r) => { r.bustLimit += 2; },
  hand: (c) => c.xmult(2) });
C({ id: 'hollow_king', name: 'The Undertaker', rarity: 4, cost: 20, icon: 'skull', hue: '#e9e2cf',
  init: () => ({ x: 1 }),
  text: (s) => `Gains {x:X1} Odds when a face card is destroyed {d:(currently {x:${fmtX(st(s).x)}})}`,
  cardDestroyed: (c, s, card) => { if (isFace(card, c.rules)) { st(s).x += 1; c.msg('Feast!'); } },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'poet_skull', name: 'Old Cow Skull', rarity: 4, cost: 20, icon: 'skull', hue: '#c9b8ff',
  init: () => ({ x: 1, n: 23 }),
  text: (s) => `Gains {x:X1} Odds every {g:23} cards folded {d:(${st(s).n} remaining, currently {x:${fmtX(st(s).x)}})}`,
  fold: (c, s, cards) => {
    if (c.copy) return;
    st(s).n -= cards.length;
    while (st(s).n <= 0) { st(s).n += 23; st(s).x += 1; c.msg('Moo!'); }
  },
  hand: (c, s) => { if (st(s).x > 1) c.xmult(st(s).x); } });
C({ id: 'shrine_guardian', name: 'The Marshal', rarity: 4, cost: 20, icon: 'badge', hue: '#ff3d3d',
  text: 'Disables the curse of every Outlaw',
  noCopy: true });
C({ id: 'collector', name: 'Pack Rat Pete', rarity: 4, cost: 20, icon: 'wheelbarrow', hue: '#b04dff',
  text: 'When you leave the shop, create a {g:Ghostly} copy of a random consumable you hold',
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
