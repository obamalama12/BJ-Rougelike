// Tokens: rewards for skipping a Paper or Silk table.

import type { TagDef } from '../game/api';
import { HAND_TYPES } from '../core/cards';
import type { HandTypeId } from '../core/types';

export const TAGS: TagDef[] = [];
const T = (d: TagDef) => TAGS.push(d);

T({ id: 'uncommon', name: 'Jade Token', icon: 'coin', hue: '#3fcf8e', when: 'shop',
  text: 'The next shop has a free {g:Uncommon} Charm',
  apply: (c) => { c.run.flags.shopCharm = { rarity: 2 }; return true; } });
T({ id: 'rare', name: 'Ruby Token', icon: 'heart', hue: '#ff3d3d', when: 'shop',
  text: 'The next shop has a free {g:Rare} Charm',
  apply: (c) => { c.run.flags.shopCharm = { rarity: 3 }; return true; } });
T({ id: 'foil', name: 'Foil Token', icon: 'spark', hue: '#bfe9ff', when: 'shop',
  text: 'The next shop has a free {g:Foil} Charm',
  apply: (c) => { c.run.flags.shopCharm = { finish: 'foil' }; return true; } });
T({ id: 'holo', name: 'Holo Token', icon: 'spark', hue: '#ff7aa8', when: 'shop',
  text: 'The next shop has a free {g:Holographic} Charm',
  apply: (c) => { c.run.flags.shopCharm = { finish: 'holo' }; return true; } });
T({ id: 'prism', name: 'Prism Token', icon: 'crystal', hue: '#c9b8ff', when: 'shop',
  text: 'The next shop has a free {g:Prismatic} Charm',
  apply: (c) => { c.run.flags.shopCharm = { finish: 'prism' }; return true; } });
T({ id: 'phantom', name: 'Phantom Token', icon: 'ghost', hue: '#d8ffe0', when: 'shop', minNight: 2,
  text: 'The next shop has a free {g:Phantom} Charm',
  apply: (c) => { c.run.flags.shopCharm = { finish: 'phantom' }; return true; } });
T({ id: 'investment', name: 'Investment Token', icon: 'coins', hue: '#ffd23f', when: 'hostBeaten',
  text: 'Earn {$:25} after defeating the next Host',
  apply: (c) => { c.money(25); return true; } });
T({ id: 'voucher', name: 'Relic Token', icon: 'torii', hue: '#ff6a5a', when: 'shop',
  text: 'Adds a {g:Relic} to the next shop',
  apply: (c) => { c.run.flags.extraVoucher = (c.run.flags.extraVoucher ?? 0) + 1; return true; } });
T({ id: 'boss', name: 'Exile Token', icon: 'oni', hue: '#ff3d3d', when: 'now',
  text: 'Rerolls the Host of this Night',
  apply: (c) => { c.run.flags.rerollHost = true; return true; } });
T({ id: 'standard', name: 'Card Token', icon: 'cards', hue: '#f7ecd2', when: 'now',
  text: 'Opens a free {g:Mega Card Bundle}',
  apply: (c) => { c.run.flags.openPack = 'card_mega'; return true; } });
T({ id: 'charm_pack', name: 'Charm Token', icon: 'lantern', hue: '#ff8a3d', when: 'now',
  text: 'Opens a free {g:Mega Charm Bundle}',
  apply: (c) => { c.run.flags.openPack = 'charm_mega'; return true; } });
T({ id: 'fortune_pack', name: 'Fortune Token', icon: 'scroll', hue: '#c9b8ff', when: 'now',
  text: 'Opens a free {g:Mega Fortune Bundle}',
  apply: (c) => { c.run.flags.openPack = 'fortune_mega'; return true; } });
T({ id: 'star_pack', name: 'Star Token', icon: 'star', hue: '#9fc7ff', when: 'now',
  text: 'Opens a free {g:Mega Star Bundle}',
  apply: (c) => { c.run.flags.openPack = 'star_mega'; return true; } });
T({ id: 'mask_pack', name: 'Mask Token', icon: 'blank', hue: '#b04dff', when: 'now', minNight: 2,
  text: 'Opens a free {g:Mask Bundle}',
  apply: (c) => { c.run.flags.openPack = 'mask_normal'; return true; } });
T({ id: 'handy', name: 'Handy Token', icon: 'hand', hue: '#ffcf8a', when: 'now', minNight: 2,
  text: 'Earn {$:1} for each hand played this run',
  apply: (c) => { c.money(c.run.stats.handsPlayed); return true; } });
T({ id: 'garbage', name: 'Sweeper Token', icon: 'broom', hue: '#c9a37a', when: 'now', minNight: 2,
  text: 'Earn {$:1} for each fold left unused this run',
  apply: (c) => { c.money(c.run.flags.unusedFolds ?? 0); return true; } });
T({ id: 'coupon', name: 'Coupon Token', icon: 'ticket', hue: '#ff9a7a', when: 'shop',
  text: 'The first cards and Bundles in the next shop are free',
  apply: (c) => { c.run.flags.coupon = true; return true; } });
T({ id: 'd6', name: 'Dice Token', icon: 'dice', hue: '#f7ecd2', when: 'shop',
  text: 'Rerolls in the next shop start at {$:0}',
  apply: (c) => { c.run.flags.d6 = true; return true; } });
T({ id: 'double', name: 'Double Token', icon: 'cards', hue: '#ffd27a', when: 'now',
  text: 'Gives a copy of the next Token you take',
  apply: () => false });
T({ id: 'economy', name: 'Economy Token', icon: 'purse', hue: '#ffd23f', when: 'now',
  text: 'Doubles your Embers {d:(max {$:40})}',
  apply: (c) => { c.money(Math.max(0, Math.min(40, c.run.money))); return true; } });
T({ id: 'orbital', name: 'Orbit Token', icon: 'comet', hue: '#9fc7ff', when: 'now',
  text: 'Levels up a random hand type by {g:3}',
  apply: (c) => {
    const h = c.rng.pick(HAND_TYPES.filter((x) => x.id !== 'push')).id as HandTypeId;
    c.levelUp(h, 3);
    return true;
  } });
T({ id: 'topup', name: 'Top-up Token', icon: 'gift', hue: '#7fe07a', when: 'now',
  text: 'Creates up to {g:2} common Charms',
  apply: (c) => { c.createCharm({ rarity: 1 }); c.createCharm({ rarity: 1 }); return true; } });
T({ id: 'speed', name: 'Swift Token', icon: 'feather', hue: '#7fe8ff', when: 'now',
  text: 'Earn {$:5} for each table skipped this run',
  apply: (c) => { c.money(5 * c.run.stats.tablesSkipped); return true; } });
T({ id: 'oil', name: 'Lantern Oil', icon: 'candle', hue: '#ffb03d', when: 'tableStart',
  text: '{g:+2} hands at the next table',
  apply: (c) => { if (c.table) c.table.handsLeft += 2; return true; } });
T({ id: 'charm_tag', name: 'Omamori Token', icon: 'stamp', hue: '#ff6b8a', when: 'now',
  text: 'Creates a random {g:Fortune} and {g:Constellation}',
  apply: (c) => { c.createCons('fortune'); c.createCons('star'); return true; } });

export const TAG: Record<string, TagDef> = Object.fromEntries(TAGS.map((t) => [t.id, t]));
