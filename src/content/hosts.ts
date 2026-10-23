// The Outlaws: varmints who run the third table in every Town, each with a dirty trick.

import type { HostDef } from '../game/api';
import { isFace, isSuit } from '../core/cards';

export const HOSTS: HostDef[] = [];
const H = (d: HostDef) => HOSTS.push(d);

H({ id: 'kappa', name: 'Grumpy Gus', title: 'The Goose Who Hates Quitters', icon: 'goose', hue: '#3fcf8e', scale: 2, minNight: 1,
  text: 'You cannot Fold',
  rules: (r) => { r.canFold = false; } });
H({ id: 'tsuchinoko', name: 'Toll Booth Tom', title: 'Turkey of Tariffs', icon: 'turkey', hue: '#c9a37a', scale: 2, minNight: 1,
  text: 'Lose {$:1} for every card you hit',
  rules: (r) => { r.hitCost = 1; } });
H({ id: 'ubume', name: 'Mother Goose', title: 'Don’t You Double-Cross Me', icon: 'goose', hue: '#d8e6ff', scale: 2, minNight: 1,
  text: 'You cannot Double Down or Split. Nobody double-crosses Mother Goose',
  rules: (r) => { r.canDouble = false; r.canSplit = false; } });
H({ id: 'enenra', name: 'Smokey Vulture', title: 'Ace Hater', icon: 'vulture', hue: '#a8a0b8', scale: 2, minNight: 1,
  text: 'Aces only count as {g:1}',
  rules: (r) => { r.aceLow = true; } });
H({ id: 'ittan', name: 'Judge Heron', title: 'Hanging Judge of Duck Gulch', icon: 'heron', hue: '#f7ecd2', scale: 2, minNight: 1,
  text: 'The dealer wins all ties',
  rules: (r) => { r.dealerWinsTies = true; } });
H({ id: 'rokurokubi', name: 'Long-Neck Lou', title: 'Swan of Sour Grapes', icon: 'swan', hue: '#ffb3c7', scale: 2, minNight: 1,
  text: '{h:dealerbust} hands score nothing',
  rules: (r) => { r.dealerBustScoresZero = true; } });
H({ id: 'jorogumo', name: 'Roadrunner Rick', title: 'Never Stands Still', icon: 'roadrunner', hue: '#b04dff', scale: 2, minNight: 1,
  text: 'You must hit at least once every hand',
  rules: (r) => { r.mustHit = true; } });
H({ id: 'bake_danuki', name: 'Pickpocket Pigeon', title: 'Sticky-Winged Thief', icon: 'pigeon', hue: '#c08a5a', scale: 2, minNight: 1,
  text: 'Your first card each hand is dealt face down',
  rules: (r) => { r.firstCardDown = true; } });
H({ id: 'mokumokuren', name: 'Banker Pelican', title: 'Fee Collector', icon: 'pelican', hue: '#ffcf8a', scale: 2, minNight: 1,
  text: 'Each fold costs {$:3}',
  rules: () => {} });

H({ id: 'aosagibi', name: 'Magpie Maggie', title: 'Horseshoe Thief', icon: 'magpie', hue: '#6f8cff', scale: 2, minNight: 2,
  text: 'All {s:moon} cards are debuffed',
  debuff: (c) => isSuit(c, 'moon') });
H({ id: 'hinoenma', name: 'Sheriff Owl', title: 'Confiscator of Explosives', icon: 'owl', hue: '#ff5b3a', scale: 2, minNight: 2,
  text: 'All {s:flame} cards are debuffed',
  debuff: (c) => isSuit(c, 'flame') });
H({ id: 'jubokko', name: 'Cactus Wren Willie', title: 'Prickly Customer', icon: 'cactus', hue: '#3fcf8e', scale: 2, minNight: 2,
  text: 'All {s:leaf} cards are debuffed',
  debuff: (c) => isSuit(c, 'leaf') });
H({ id: 'kanedama', name: 'Deputy Dodo', title: 'Doesn’t Believe in Stars', icon: 'dodo', hue: '#f2b632', scale: 2, minNight: 2,
  text: 'All {s:bell} cards are debuffed',
  debuff: (c) => isSuit(c, 'bell') });
H({ id: 'noppera', name: 'The Masked Mallard', title: 'Bandit Without a Face', icon: 'bandana', hue: '#e9e2cf', scale: 2, minNight: 2,
  text: 'All face cards are debuffed',
  debuff: (c) => isFace(c) });
H({ id: 'bakeneko', name: 'Ostrich Ollie', title: 'Head in the Sand', icon: 'ostrich', hue: '#9a8cff', scale: 2, minNight: 2,
  text: 'All painted cards are debuffed',
  debuff: (c) => !!c.ink });
H({ id: 'nue', name: 'Chickenhawk Charlie', title: 'Three’s a Crowd', icon: 'chicken', hue: '#8a6aff', scale: 2, minNight: 2,
  text: 'Hands must contain at least {g:3} cards to score',
  rules: (r) => { r.minCardsToScore = 3; } });
H({ id: 'gashadokuro', name: 'Big Bertha', title: 'The Biggest Bird in the West', icon: 'ostrich', hue: '#e9e2cf', scale: 4, minNight: 2,
  text: 'An enormous target. She is a very large bird' });
H({ id: 'baku', name: 'Taxman Toucan', title: 'Takes Half', icon: 'toucan', hue: '#c7a0ff', scale: 2, minNight: 2,
  text: 'Base Pot and Odds are halved',
  rules: (r) => { r.halveBase = true; } });
H({ id: 'yuki_onna', name: 'Snow Goose Sue', title: 'Cold Cards', icon: 'goose', hue: '#d8f0ff', scale: 2, minNight: 2,
  text: 'Face cards are dealt face down',
  rules: (r) => { r.faceCardsDown = true; } });
H({ id: 'kamaitachi', name: 'One-Trick Loon', title: 'Only Knows One Song', icon: 'loon', hue: '#9fe8ff', scale: 2, minNight: 2,
  text: 'Only the first hand type you score can score this table',
  rules: (r) => { r.oneHandType = true; } });
H({ id: 'akaname', name: 'Grumpy Gander', title: 'Unimpressed by Naturals', icon: 'goose', hue: '#ff6b6b', scale: 2, minNight: 2,
  text: 'Naturals score as {h:outdraw}',
  rules: (r) => { r.blackjackAsOutdraw = true; } });
H({ id: 'kitsunebi', name: 'Poker-Faced Penguin', title: 'Impossible to Read', icon: 'penguin', hue: '#7fe8ff', scale: 2, minNight: 2,
  text: 'The dealer’s upcard is hidden',
  rules: (r) => { r.dealerUpDown = true; } });
H({ id: 'hyakume', name: 'Peeping Pheasant', title: 'Ruins Every Surprise', icon: 'eye', hue: '#ff7ad9', scale: 2, minNight: 2,
  text: 'Cards you hit are debuffed',
  onHit: (c, card) => { if (c.table && !c.table.debuffed.includes(card.id)) c.table.debuffed.push(card.id); } });
H({ id: 'oboroguruma', name: 'Conductor Crane', title: 'No Overloading the Train', icon: 'train', hue: '#c08a5a', scale: 2, minNight: 2,
  text: 'Hands with {g:4} or more cards score nothing',
  allowScore: (c) => c.cards.length < 4 });
H({ id: 'umibozu', name: 'Lazy Pelican Pete', title: 'Short Shift', icon: 'pelican', hue: '#4f6dff', scale: 1.5, minNight: 2,
  text: 'Only {g:2} hands, but {g:+2} folds', hands: 2, folds: 2 });
H({ id: 'nurarihyon', name: 'Mayor Mallard', title: 'Seen It All Before', icon: 'tophat', hue: '#b8a0ff', scale: 2, minNight: 3,
  text: 'Each hand type can only score once this table',
  rules: (r) => { r.noRepeatType = true; } });
H({ id: 'shokera', name: 'Rustler Raven', title: 'Doodad Bandit', icon: 'crow', hue: '#a08cff', scale: 2, minNight: 3,
  text: 'After each hand, a random Doodad is disabled for the rest of the table',
  afterHand: (c) => {
    const pool = c.run.charms.filter((k) => !k.disabled);
    if (!pool.length) return;
    c.rng.pick(pool).disabled = true;
    if (c.table) c.table.hostTriggered = true;
  } });

// --- Showdown hosts (Night 7, and every 7th night of endless) ---------------

H({ id: 'tsukuyomi', name: 'The Golden Goose', title: 'Everything’s Worth More', icon: 'goose', hue: '#b9c7ff', scale: 2, minNight: 7, showdown: true,
  text: 'Every card is worth {g:1} more',
  rules: (r) => { r.plusOne = true; } });
H({ id: 'chochin_o', name: 'Boss Honk', title: 'Owner of the Saloon', icon: 'cowboyhat', hue: '#ffb03d', scale: 2.5, minNight: 7, showdown: true,
  text: 'The dealer wins ties. You cannot Fold',
  rules: (r) => { r.dealerWinsTies = true; r.canFold = false; } });
H({ id: 'tamamo', name: 'The Black Swan', title: 'Bad Omen', icon: 'swan', hue: '#ffcf3d', scale: 2, minNight: 7, showdown: true,
  text: 'Each card has a {g:1 in 3} chance to be debuffed as it is dealt' });
H({ id: 'otakemaru', name: 'Ma Gobbler', title: 'Meanest Turkey Alive', icon: 'turkey', hue: '#ff3d3d', scale: 2, minNight: 7, showdown: true,
  text: 'You bust over {g:20}',
  rules: (r) => { r.bustLimit -= 1; } });
H({ id: 'daitengu', name: 'The Condor', title: 'King of the Canyon', icon: 'eagle', hue: '#ff5b3a', scale: 1.5, minNight: 7, showdown: true,
  text: 'Only {g:3} hands and no folds', hands: 3, folds: -99 });
H({ id: 'orochi', name: 'The Flock', title: 'Eight Angry Geese', icon: 'goose', hue: '#4fdc8a', scale: 2, minNight: 7, showdown: true,
  text: 'Each hand you lose raises the target by {g:20%}',
  afterHand: (c) => {
    if (!c.table) return;
    if (c.outcome === 'lose' || c.outcome === 'bust') { c.table.target = Math.floor(c.table.target * 1.2); c.table.hostTriggered = true; }
  } });

export const HOST: Record<string, HostDef> = Object.fromEntries(HOSTS.map((h) => [h.id, h]));
