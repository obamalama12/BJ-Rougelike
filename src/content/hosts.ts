// The Hosts: yokai who run the third table of every Night, each with a curse.

import type { HostDef } from '../game/api';
import { isFace, isSuit } from '../core/cards';

export const HOSTS: HostDef[] = [];
const H = (d: HostDef) => HOSTS.push(d);

H({ id: 'kappa', name: 'The Kappa', title: 'River Imp', icon: 'kappa', hue: '#3fcf8e', scale: 2, minNight: 1,
  text: 'You cannot Fold',
  rules: (r) => { r.canFold = false; } });
H({ id: 'tsuchinoko', name: 'The Tsuchinoko', title: 'Fat Serpent', icon: 'snake', hue: '#c9a37a', scale: 2, minNight: 1,
  text: 'Lose {$:1} for every card you hit',
  rules: (r) => { r.hitCost = 1; } });
H({ id: 'ubume', name: 'The Ubume', title: 'Weeping Mother', icon: 'ghost', hue: '#d8e6ff', scale: 2, minNight: 1,
  text: 'You cannot Double Down or Split',
  rules: (r) => { r.canDouble = false; r.canSplit = false; } });
H({ id: 'enenra', name: 'The Enenra', title: 'Smoke Spirit', icon: 'smoke', hue: '#a8a0b8', scale: 2, minNight: 1,
  text: 'Aces only count as {g:1}',
  rules: (r) => { r.aceLow = true; } });
H({ id: 'ittan', name: 'Ittan-momen', title: 'Flying Cloth', icon: 'scroll', hue: '#f7ecd2', scale: 2, minNight: 1,
  text: 'The dealer wins all ties',
  rules: (r) => { r.dealerWinsTies = true; } });
H({ id: 'rokurokubi', name: 'Rokurokubi', title: 'Long Neck', icon: 'ghost', hue: '#ffb3c7', scale: 2, minNight: 1,
  text: '{h:dealerbust} hands score nothing',
  rules: (r) => { r.dealerBustScoresZero = true; } });
H({ id: 'jorogumo', name: 'Jorōgumo', title: 'Binding Bride', icon: 'spider', hue: '#b04dff', scale: 2, minNight: 1,
  text: 'You must hit at least once every hand',
  rules: (r) => { r.mustHit = true; } });
H({ id: 'bake_danuki', name: 'Bake-danuki', title: 'Trickster', icon: 'tanuki', hue: '#c08a5a', scale: 2, minNight: 1,
  text: 'Your first card each hand is dealt face down',
  rules: (r) => { r.firstCardDown = true; } });
H({ id: 'mokumokuren', name: 'Mokumokuren', title: 'Eyes in the Paper', icon: 'eye', hue: '#ffcf8a', scale: 2, minNight: 1,
  text: 'Each fold costs {$:3}',
  rules: () => {} });

H({ id: 'aosagibi', name: 'Aosagibi', title: 'Heron of Blue Fire', icon: 'heron', hue: '#6f8cff', scale: 2, minNight: 2,
  text: 'All {s:moon} cards are debuffed',
  debuff: (c) => isSuit(c, 'moon') });
H({ id: 'hinoenma', name: 'Hinoenma', title: 'Flame Dancer', icon: 'flame', hue: '#ff5b3a', scale: 2, minNight: 2,
  text: 'All {s:flame} cards are debuffed',
  debuff: (c) => isSuit(c, 'flame') });
H({ id: 'jubokko', name: 'Jubōkko', title: 'Vampire Tree', icon: 'bamboo', hue: '#3fcf8e', scale: 2, minNight: 2,
  text: 'All {s:leaf} cards are debuffed',
  debuff: (c) => isSuit(c, 'leaf') });
H({ id: 'kanedama', name: 'Kanedama', title: 'Gold Spirit', icon: 'coin', hue: '#f2b632', scale: 2, minNight: 2,
  text: 'All {s:bell} cards are debuffed',
  debuff: (c) => isSuit(c, 'bell') });
H({ id: 'noppera', name: 'Noppera-bō', title: 'The Faceless', icon: 'blank', hue: '#e9e2cf', scale: 2, minNight: 2,
  text: 'All face cards are debuffed',
  debuff: (c) => isFace(c) });
H({ id: 'bakeneko', name: 'Bakeneko', title: 'Ghost Cat', icon: 'cat', hue: '#9a8cff', scale: 2, minNight: 2,
  text: 'All inked cards are debuffed',
  debuff: (c) => !!c.ink });
H({ id: 'nue', name: 'The Nue', title: 'Chimera of Night', icon: 'monkey', hue: '#8a6aff', scale: 2, minNight: 2,
  text: 'Hands must contain at least {g:3} cards to score',
  rules: (r) => { r.minCardsToScore = 3; } });
H({ id: 'gashadokuro', name: 'Gashadokuro', title: 'Starving Giant', icon: 'skull', hue: '#e9e2cf', scale: 4, minNight: 2,
  text: 'An enormous target' });
H({ id: 'baku', name: 'The Baku', title: 'Dream Eater', icon: 'tapir', hue: '#c7a0ff', scale: 2, minNight: 2,
  text: 'Base Chips and Mult are halved',
  rules: (r) => { r.halveBase = true; } });
H({ id: 'yuki_onna', name: 'Yuki-onna', title: 'Snow Woman', icon: 'blossom', hue: '#d8f0ff', scale: 2, minNight: 2,
  text: 'Face cards are dealt face down',
  rules: (r) => { r.faceCardsDown = true; } });
H({ id: 'kamaitachi', name: 'Kamaitachi', title: 'Sickle Weasel', icon: 'weasel', hue: '#9fe8ff', scale: 2, minNight: 2,
  text: 'Only the first hand type you score can score this table',
  rules: (r) => { r.oneHandType = true; } });
H({ id: 'akaname', name: 'Akaname', title: 'Filth Licker', icon: 'frog', hue: '#ff6b6b', scale: 2, minNight: 2,
  text: 'Naturals score as {h:outdraw}',
  rules: (r) => { r.blackjackAsOutdraw = true; } });
H({ id: 'kitsunebi', name: 'Kitsune-bi', title: 'Foxfire', icon: 'fox', hue: '#7fe8ff', scale: 2, minNight: 2,
  text: 'The dealer’s upcard is hidden',
  rules: (r) => { r.dealerUpDown = true; } });
H({ id: 'hyakume', name: 'Hyakume', title: 'Hundred Eyes', icon: 'eye', hue: '#ff7ad9', scale: 2, minNight: 2,
  text: 'Cards you hit are debuffed',
  onHit: (c, card) => { if (c.table && !c.table.debuffed.includes(card.id)) c.table.debuffed.push(card.id); } });
H({ id: 'oboroguruma', name: 'Oboroguruma', title: 'Phantom Oxcart', icon: 'wheel', hue: '#c08a5a', scale: 2, minNight: 2,
  text: 'Hands with {g:4} or more cards score nothing',
  allowScore: (c) => c.cards.length < 4 });
H({ id: 'umibozu', name: 'Umibōzu', title: 'Sea Monk', icon: 'wave', hue: '#4f6dff', scale: 1.5, minNight: 2,
  text: 'Only {g:2} hands, but {g:+2} folds', hands: 2, folds: 2 });
H({ id: 'nurarihyon', name: 'Nurarihyon', title: 'Elder of Yokai', icon: 'gourd', hue: '#b8a0ff', scale: 2, minNight: 3,
  text: 'Each hand type can only score once this table',
  rules: (r) => { r.noRepeatType = true; } });
H({ id: 'shokera', name: 'Shōkera', title: 'Skylight Peeper', icon: 'owl', hue: '#a08cff', scale: 2, minNight: 3,
  text: 'After each hand, a random Charm is disabled for the rest of the table',
  afterHand: (c) => {
    const pool = c.run.charms.filter((k) => !k.disabled);
    if (!pool.length) return;
    c.rng.pick(pool).disabled = true;
    if (c.table) c.table.hostTriggered = true;
  } });

// --- Showdown hosts (Night 7, and every 7th night of endless) ---------------

H({ id: 'tsukuyomi', name: 'Tsukuyomi', title: 'Moon Emperor', icon: 'moon', hue: '#b9c7ff', scale: 2, minNight: 7, showdown: true,
  text: 'Every card is worth {g:1} more',
  rules: (r) => { r.plusOne = true; } });
H({ id: 'chochin_o', name: 'The Lantern King', title: 'Lord of the Market', icon: 'lantern', hue: '#ffb03d', scale: 2.5, minNight: 7, showdown: true,
  text: 'The dealer wins ties. You cannot Fold',
  rules: (r) => { r.dealerWinsTies = true; r.canFold = false; } });
H({ id: 'tamamo', name: 'Tamamo-no-Mae', title: 'Nine-Tailed Empress', icon: 'fox', hue: '#ffcf3d', scale: 2, minNight: 7, showdown: true,
  text: 'Each card has a {g:1 in 3} chance to be debuffed as it is dealt' });
H({ id: 'otakemaru', name: 'Ōtakemaru', title: 'Demon of Suzuka', icon: 'oni', hue: '#ff3d3d', scale: 2, minNight: 7, showdown: true,
  text: 'You bust over {g:20}',
  rules: (r) => { r.bustLimit -= 1; } });
H({ id: 'daitengu', name: 'Daitengu', title: 'King of the Mountain', icon: 'tengu', hue: '#ff5b3a', scale: 1.5, minNight: 7, showdown: true,
  text: 'Only {g:3} hands and no folds', hands: 3, folds: -99 });
H({ id: 'orochi', name: 'Yamata no Orochi', title: 'Eight-Headed Serpent', icon: 'dragon', hue: '#4fdc8a', scale: 2, minNight: 7, showdown: true,
  text: 'Each hand you lose raises the target by {g:20%}',
  afterHand: (c) => {
    if (!c.table) return;
    if (c.outcome === 'lose' || c.outcome === 'bust') { c.table.target = Math.floor(c.table.target * 1.2); c.table.hostTriggered = true; }
  } });

export const HOST: Record<string, HostDef> = Object.fromEntries(HOSTS.map((h) => [h.id, h]));
