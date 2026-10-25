// The Outlaws: the bosses at the end of every Town, each with a curse that bends the rules.
// minNight is each Outlaw's tier: Town N draws its Outlaw from tier N, so curses get nastier
// as the run goes on. Tiers come from `npm run probe` (how often the bot survives each curse).

import type { HostDef } from '../game/api';
import { isFace, isSuit } from '../core/cards';

export const HOSTS: HostDef[] = [];
const H = (d: HostDef) => HOSTS.push(d);

H({ id: 'kappa', name: 'Grumpy Gus', title: 'The Goose Who Hates Quitters', icon: 'goose', hue: '#3fcf8e', scale: 2, minNight: 5,
  text: 'You cannot Fold',
  rules: (r) => { r.canFold = false; } });
H({ id: 'tsuchinoko', name: 'Toll Booth Tom', title: 'Runs the Toll Road', icon: 'turkey', hue: '#c9a37a', scale: 2, minNight: 1,
  text: 'Each hit costs {$:1}',
  rules: (r) => { r.hitCost = 1; } });
H({ id: 'ubume', name: 'Mother Goose', title: 'Runs a Tidy Table', icon: 'goose', hue: '#d8e6ff', scale: 2, minNight: 3,
  text: 'You cannot Double Down or Split',
  rules: (r) => { r.canDouble = false; r.canSplit = false; } });
H({ id: 'enenra', name: 'Smokey Vulture', title: 'Ace Hater', icon: 'vulture', hue: '#a8a0b8', scale: 2, minNight: 1,
  text: 'Aces always count as {g:1}, never 11',
  rules: (r) => { r.aceLow = true; } });
H({ id: 'ittan', name: 'Judge Heron', title: 'Hanging Judge of Dusty Gulch', icon: 'heron', hue: '#f7ecd2', scale: 2, minNight: 4,
  text: 'Ties count as losses',
  rules: (r) => { r.dealerWinsTies = true; } });
H({ id: 'rokurokubi', name: 'Long-Neck Lou', title: 'Sore Winner', icon: 'swan', hue: '#ffb3c7', scale: 2, minNight: 6,
  text: '{h:dealerbust} hands score nothing',
  rules: (r) => { r.dealerBustScoresZero = true; } });
H({ id: 'jorogumo', name: 'Roadrunner Rick', title: 'Never Stands Still', icon: 'roadrunner', hue: '#b04dff', scale: 2, minNight: 4,
  text: 'You must hit at least once every hand',
  rules: (r) => { r.mustHit = true; } });
H({ id: 'bake_danuki', name: 'Pickpocket Pigeon', title: 'Light Fingers', icon: 'pigeon', hue: '#c08a5a', scale: 2, minNight: 2,
  text: 'Your first card each hand is dealt face down',
  rules: (r) => { r.firstCardDown = true; } });
H({ id: 'mokumokuren', name: 'Banker Pelican', title: 'Fee Collector', icon: 'pelican', hue: '#ffcf8a', scale: 2, minNight: 1,
  text: 'Each fold costs {$:3}',
  rules: () => {} });

H({ id: 'aosagibi', name: 'Magpie Maggie', title: 'Horseshoe Thief', icon: 'magpie', hue: '#6f8cff', scale: 2, minNight: 3,
  text: '{s:moon} cards are debuffed {d:(they don’t score)}',
  debuff: (c) => isSuit(c, 'moon') });
H({ id: 'hinoenma', name: 'Sheriff Owl', title: 'Confiscates Dynamite', icon: 'owl', hue: '#ff5b3a', scale: 2, minNight: 2,
  text: '{s:flame} cards are debuffed {d:(they don’t score)}',
  debuff: (c) => isSuit(c, 'flame') });
H({ id: 'jubokko', name: 'Cactus Wren Willie', title: 'Prickly Customer', icon: 'cactus', hue: '#3fcf8e', scale: 2, minNight: 4,
  text: '{s:leaf} cards are debuffed {d:(they don’t score)}',
  debuff: (c) => isSuit(c, 'leaf') });
H({ id: 'kanedama', name: 'Deputy Dodo', title: 'Doesn’t Believe in Stars', icon: 'dodo', hue: '#f2b632', scale: 2, minNight: 2,
  text: '{s:bell} cards are debuffed {d:(they don’t score)}',
  debuff: (c) => isSuit(c, 'bell') });
H({ id: 'noppera', name: 'The Masked Mallard', title: 'Never Shows His Face', icon: 'bandana', hue: '#e9e2cf', scale: 2, minNight: 3,
  text: 'Face cards are debuffed {d:(they don’t score)}',
  debuff: (c) => isFace(c) });
H({ id: 'bakeneko', name: 'Ostrich Ollie', title: 'Head in the Sand', icon: 'ostrich', hue: '#9a8cff', scale: 2, minNight: 2,
  text: 'Inked cards are debuffed {d:(they don’t score)}',
  debuff: (c) => !!c.ink });
H({ id: 'nue', name: 'Chickenhawk Charlie', title: 'Three’s a Crowd', icon: 'chicken', hue: '#8a6aff', scale: 1.6, minNight: 6,
  text: 'Hands need at least {g:3} cards to score',
  rules: (r) => { r.minCardsToScore = 3; } });
H({ id: 'gashadokuro', name: 'Big Bertha', title: 'Weighs Four Hundred Pounds', icon: 'ostrich', hue: '#e9e2cf', scale: 4, minNight: 5,
  text: 'No curse. Her target is twice as high' });
H({ id: 'baku', name: 'Taxman Toucan', title: 'Takes Half', icon: 'toucan', hue: '#c7a0ff', scale: 2, minNight: 6,
  text: 'The base Pot and Odds of every hand type are halved',
  rules: (r) => { r.halveBase = true; } });
H({ id: 'yuki_onna', name: 'Snow Goose Sue', title: 'Deals Them Cold', icon: 'goose', hue: '#d8f0ff', scale: 2, minNight: 2,
  text: 'Face cards are dealt face down',
  rules: (r) => { r.faceCardsDown = true; } });
H({ id: 'kamaitachi', name: 'One-Trick Loon', title: 'Only Knows One Song', icon: 'loon', hue: '#9fe8ff', scale: 1.6, minNight: 6,
  text: 'After your first scoring hand, only that hand type can score this table',
  rules: (r) => { r.oneHandType = true; } });
H({ id: 'akaname', name: 'Grumpy Gander', title: 'Unimpressed by Naturals', icon: 'goose', hue: '#ff6b6b', scale: 2, minNight: 3,
  text: 'Naturals score as {h:outdraw}',
  rules: (r) => { r.blackjackAsOutdraw = true; } });
H({ id: 'kitsunebi', name: 'Poker-Faced Penguin', title: 'Impossible to Read', icon: 'penguin', hue: '#7fe8ff', scale: 2, minNight: 2,
  text: 'The dealer’s upcard is dealt face down',
  rules: (r) => { r.dealerUpDown = true; } });
H({ id: 'hyakume', name: 'Peeping Pheasant', title: 'Ruins Every Surprise', icon: 'eye', hue: '#ff7ad9', scale: 2, minNight: 4,
  text: 'Cards you draw by hitting are debuffed {d:(they don’t score)}',
  onHit: (c, card) => { if (c.table && !c.table.debuffed.includes(card.id)) c.table.debuffed.push(card.id); } });
H({ id: 'oboroguruma', name: 'Conductor Crane', title: 'Runs the 4:15', icon: 'train', hue: '#c08a5a', scale: 2, minNight: 5,
  text: 'Hands with {g:4} or more cards score nothing',
  allowScore: (c) => c.cards.length < 4 });
H({ id: 'umibozu', name: 'Lazy Pelican Pete', title: 'Short Shift', icon: 'pelican', hue: '#4f6dff', scale: 1.5, minNight: 6,
  text: 'You get only {g:3} hands, but {g:+2} folds', hands: 3, folds: 2 });
H({ id: 'nurarihyon', name: 'Mayor Mallard', title: 'Seen It All Before', icon: 'tophat', hue: '#b8a0ff', scale: 2, minNight: 5,
  text: 'Each hand type can score only once this table',
  rules: (r) => { r.noRepeatType = true; } });
H({ id: 'shokera', name: 'Rustler Raven', title: 'Takes Your Doodads', icon: 'crow', hue: '#a08cff', scale: 2, minNight: 5,
  text: 'After each hand, a random Doodad is disabled for the rest of the table',
  afterHand: (c) => {
    const pool = c.run.charms.filter((k) => !k.disabled);
    if (!pool.length) return;
    c.rng.pick(pool).disabled = true;
    if (c.table) c.table.hostTriggered = true;
  } });

// --- Showdown Outlaws (Town 7, and every 7th town after that) ---------------

H({ id: 'tsukuyomi', name: 'The Golden Goose', title: 'Everything’s Worth More', icon: 'goose', hue: '#b9c7ff', scale: 2.6, minNight: 7, showdown: true,
  text: 'Every card counts {g:1} higher toward your total {d:(a 9 counts as 10)}',
  rules: (r) => { r.plusOne = true; } });
H({ id: 'chochin_o', name: 'Boss Honk', title: 'Owner of the Saloon', icon: 'cowboyhat', hue: '#ffb03d', scale: 2.5, minNight: 7, showdown: true,
  text: 'Ties count as losses. You cannot Fold',
  rules: (r) => { r.dealerWinsTies = true; r.canFold = false; } });
H({ id: 'tamamo', name: 'The Black Swan', title: 'Bad Omen', icon: 'swan', hue: '#ffcf3d', scale: 2.6, minNight: 7, showdown: true,
  text: 'Each card has a {g:1 in 3} chance to be debuffed when dealt {d:(it won’t score)}' });
H({ id: 'otakemaru', name: 'Ma Gobbler', title: 'Owns Half the County', icon: 'turkey', hue: '#ff3d3d', scale: 2, minNight: 7, showdown: true,
  text: 'You bust over {g:20} instead of 21',
  rules: (r) => { r.bustLimit -= 1; } });
H({ id: 'daitengu', name: 'The Condor', title: 'King of the Canyon', icon: 'eagle', hue: '#ff5b3a', scale: 1.9, minNight: 7, showdown: true,
  text: 'You get only {g:3} hands and no folds', hands: 3, folds: -99 });
H({ id: 'orochi', name: 'The Flock', title: 'Eight Angry Geese', icon: 'goose', hue: '#4fdc8a', scale: 2.6, minNight: 7, showdown: true,
  text: 'Each hand you lose or bust raises the target by {g:20%}',
  afterHand: (c) => {
    if (!c.table) return;
    if (c.outcome === 'lose' || c.outcome === 'bust') { c.table.target = Math.floor(c.table.target * 1.2); c.table.hostTriggered = true; }
  } });

// --- Second posse -------------------------------------------------------------
H({ id: 'carl', name: 'Card Shark Carl', title: 'Deals Off the Bottom', icon: 'crow', hue: '#4a4a6a', scale: 2, minNight: 1,
  text: 'The dealer keeps drawing until {g:18}',
  rules: (r) => { r.dealerStand = 18; } });
H({ id: 'stu', name: 'Stingy Stu', title: 'Counts Every Card', icon: 'dodo', hue: '#a08a6a', scale: 2, minNight: 1,
  text: 'You can hit at most {g:twice} per hand',
  rules: (r) => { r.maxHits = 2; } });
H({ id: 'tess', name: 'Tax Collector Tess', title: 'Gets Her Cut', icon: 'pelican', hue: '#5a8a5a', scale: 2, minNight: 1,
  text: 'Every hand you deal costs {$:2}',
  rules: (r) => { r.handCost = 2; } });
H({ id: 'flo', name: 'Fancy Flo', title: 'Queen of the Cancan', icon: 'flamingo', hue: '#ff7ab0', scale: 2, minNight: 3,
  text: '{h:charlie} needs {g:6} cards instead of 5',
  rules: (r) => { r.charlieSize = Math.max(r.charlieSize, 6); } });
H({ id: 'pierre', name: 'Pierre the Penguin', title: 'Plays It Cool', icon: 'penguin', hue: '#6a8aaa', scale: 2, minNight: 2,
  text: 'Doubled hands score {x:X1.5} instead of X2',
  rules: (r) => { r.doubleX = Math.min(r.doubleX, 1.5); } });
H({ id: 'earl', name: 'Bald Eagle Earl', title: 'Keeps His Eye on the Small Change', icon: 'eagle', hue: '#e0d8c8', scale: 2, minNight: 4,
  text: 'Cards ranked {g:2 to 5} are debuffed {d:(they don’t score)}',
  debuff: (c) => c.rank >= 2 && c.rank <= 5 });
H({ id: 'tango', name: 'Tango the Toucan', title: 'Hates a Sure Thing', icon: 'toucan', hue: '#ff9a3d', scale: 2, minNight: 3,
  text: 'Aces are debuffed {d:(they don’t score)}',
  debuff: (c) => c.rank === 14 });
H({ id: 'dot', name: 'Dot the Dodo', title: 'Last of Her Kind', icon: 'dodo', hue: '#c9a37a', scale: 2, minNight: 4,
  text: 'Your first card each hand is dealt face down, and ties count as losses',
  rules: (r) => { r.firstCardDown = true; r.dealerWinsTies = true; } });

// --- The rare one: once in a while he turns up instead of a town's Outlaw ----------
H({ id: 'woodgas', name: 'Woodgas', title: 'Doesn’t Know the Rules', icon: 'monkey', hue: '#a8c46a', scale: 1, minNight: 0, rare: true,
  text: 'Doesn’t know how to play: the dealer keeps hitting until he busts',
  rules: (r) => { r.dealerHitsToBust = true; } });

/** Chance that a town's Outlaw is swapped for Woodgas. */
export const RARE_OUTLAW_CHANCE = 0.05;

/** The Outlaw's henchmen: nameless muscle who carry their boss's curse to the gang stops. */
export const GOONS = ['goon_sid', 'goon_clem', 'goon_ted', 'goon_mabel', 'goon_dusty', 'goon_ike'];

export const HOST: Record<string, HostDef> = Object.fromEntries(HOSTS.map((h) => [h.id, h]));
