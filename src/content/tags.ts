// Telegrams: rewards for skipping a Saloon Game or High Stakes table.

import type { TagDef } from '../game/api';
import { HAND_TYPES } from '../core/cards';
import type { HandTypeId } from '../core/types';

export const TAGS: TagDef[] = [];
const T = (d: TagDef) => TAGS.push(d);

T({ id: 'uncommon', name: 'Green Telegram', icon: 'telegram', hue: '#3fcf8e', when: 'shop',
  text: 'The next shop has a free {g:Uncommon} Doodad',
  apply: (c) => { c.run.flags.shopCharm = { rarity: 2 }; return true; } });
T({ id: 'rare', name: 'Red Telegram', icon: 'telegram', hue: '#ff3d3d', when: 'shop',
  text: 'The next shop has a free {g:Rare} Doodad',
  apply: (c) => { c.run.flags.shopCharm = { rarity: 3 }; return true; } });
T({ id: 'foil', name: 'Shiny Telegram', icon: 'spark', hue: '#bfe9ff', when: 'shop',
  text: 'The next shop has a free {g:Shiny} Doodad',
  apply: (c) => { c.run.flags.shopCharm = { finish: 'foil' }; return true; } });
T({ id: 'holo', name: 'Holo Telegram', icon: 'spark', hue: '#ff7aa8', when: 'shop',
  text: 'The next shop has a free {g:Holographic} Doodad',
  apply: (c) => { c.run.flags.shopCharm = { finish: 'holo' }; return true; } });
T({ id: 'prism', name: 'Prism Telegram', icon: 'crystal', hue: '#c9b8ff', when: 'shop',
  text: 'The next shop has a free {g:Prismatic} Doodad',
  apply: (c) => { c.run.flags.shopCharm = { finish: 'prism' }; return true; } });
T({ id: 'phantom', name: 'Ghostly Telegram', icon: 'ghost', hue: '#d8ffe0', when: 'shop', minNight: 2,
  text: 'The next shop has a free {g:Ghostly} Doodad',
  apply: (c) => { c.run.flags.shopCharm = { finish: 'phantom' }; return true; } });
T({ id: 'investment', name: 'Investment Telegram', icon: 'moneybag', hue: '#ffd23f', when: 'hostBeaten',
  text: 'Earn {$:25} after defeating the next Outlaw',
  apply: (c) => { c.money(25); return true; } });
T({ id: 'voucher', name: 'Deed Telegram', icon: 'scroll', hue: '#ff6a5a', when: 'shop',
  text: 'Adds a {g:Deed} to the next shop',
  apply: (c) => { c.run.flags.extraVoucher = (c.run.flags.extraVoucher ?? 0) + 1; return true; } });
T({ id: 'boss', name: 'Run ’Em Outta Town', icon: 'boot', hue: '#ff3d3d', when: 'now',
  text: 'Rerolls the Outlaw of this Town',
  apply: (c) => { c.run.flags.rerollHost = true; return true; } });
T({ id: 'standard', name: 'Card Telegram', icon: 'cards', hue: '#f7ecd2', when: 'now',
  text: 'Opens a free {g:Mega Card Crate}',
  apply: (c) => { c.run.flags.openPack = 'card_mega'; return true; } });
T({ id: 'charm_pack', name: 'Doodad Telegram', icon: 'crate', hue: '#ff8a3d', when: 'now',
  text: 'Opens a free {g:Mega Doodad Crate}',
  apply: (c) => { c.run.flags.openPack = 'charm_mega'; return true; } });
T({ id: 'fortune_pack', name: 'Tonic Telegram', icon: 'tonic', hue: '#c9b8ff', when: 'now',
  text: 'Opens a free {g:Mega Tonic Crate}',
  apply: (c) => { c.run.flags.openPack = 'fortune_mega'; return true; } });
T({ id: 'star_pack', name: 'Tall Tale Telegram', icon: 'book', hue: '#9fc7ff', when: 'now',
  text: 'Opens a free {g:Mega Tall Tale Crate}',
  apply: (c) => { c.run.flags.openPack = 'star_mega'; return true; } });
T({ id: 'mask_pack', name: 'Moonshine Telegram', icon: 'jug', hue: '#b04dff', when: 'now', minNight: 2,
  text: 'Opens a free {g:Moonshine Crate}',
  apply: (c) => { c.run.flags.openPack = 'mask_normal'; return true; } });
T({ id: 'handy', name: 'Handy Telegram', icon: 'hand', hue: '#ffcf8a', when: 'now', minNight: 2,
  text: 'Earn {$:1} for each hand played this run',
  apply: (c) => { c.money(c.run.stats.handsPlayed); return true; } });
T({ id: 'garbage', name: 'Sweeper Telegram', icon: 'broom', hue: '#c9a37a', when: 'now', minNight: 2,
  text: 'Earn {$:1} for each fold left unused this run',
  apply: (c) => { c.money(c.run.flags.unusedFolds ?? 0); return true; } });
T({ id: 'coupon', name: 'Coupon', icon: 'ticket', hue: '#ff9a7a', when: 'shop',
  text: 'Everything in the next shop is free {d:(items from rerolls are not)}',
  apply: (c) => { c.run.flags.coupon = true; return true; } });
T({ id: 'd6', name: 'Dice Telegram', icon: 'dice', hue: '#f7ecd2', when: 'shop',
  text: 'Rerolls in the next shop start at {$:0}',
  apply: (c) => { c.run.flags.d6 = true; return true; } });
T({ id: 'double', name: 'Double Telegram', icon: 'telegram', hue: '#ffd27a', when: 'now',
  text: 'Gives a copy of the next Telegram you take',
  apply: () => false });
T({ id: 'economy', name: 'Payday', icon: 'dollar', hue: '#ffd23f', when: 'now',
  text: 'Doubles your Bucks {d:(max {$:40})}',
  apply: (c) => { c.money(Math.max(0, Math.min(40, c.run.money))); return true; } });
T({ id: 'orbital', name: 'The Legend Grows', icon: 'book', hue: '#9fc7ff', when: 'now',
  text: 'A random hand type gains {g:3} levels',
  apply: (c) => {
    const h = c.rng.pick(HAND_TYPES.filter((x) => x.id !== 'push')).id as HandTypeId;
    c.levelUp(h, 3);
    return true;
  } });
T({ id: 'topup', name: 'Posse Up', icon: 'duckling', hue: '#7fe07a', when: 'now',
  text: 'Creates up to {g:2} common Doodads',
  apply: (c) => { c.createCharm({ rarity: 1 }); c.createCharm({ rarity: 1 }); return true; } });
T({ id: 'speed', name: 'Pony Express Telegram', icon: 'horse', hue: '#7fe8ff', when: 'now',
  text: 'Earn {$:5} for each table skipped this run',
  apply: (c) => { c.money(5 * c.run.stats.tablesSkipped); return true; } });
T({ id: 'oil', name: 'Extra Ammo', icon: 'bullet', hue: '#ffb03d', when: 'tableStart',
  text: '{g:+2} hands at the next table',
  apply: (c) => { if (c.table) c.table.handsLeft += 2; return true; } });
T({ id: 'charm_tag', name: 'Supply Telegram', icon: 'crate', hue: '#ff6b8a', when: 'now',
  text: 'Creates a random {g:Tonic} and {g:Tall Tale}',
  apply: (c) => { c.createCons('fortune'); c.createCons('star'); return true; } });

export const TAG: Record<string, TagDef> = Object.fromEntries(TAGS.map((t) => [t.id, t]));
