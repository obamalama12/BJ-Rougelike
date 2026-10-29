// Telegrams: rewards for skipping a Saloon Game or High Stakes table.

import type { TagDef } from '../game/api';
import { HAND_TYPES } from '../core/cards';
import type { HandTypeId } from '../core/types';

export const TAGS: TagDef[] = [];
const T = (d: TagDef) => TAGS.push(d);

T({ id: 'investment', name: 'Investment Telegram', icon: 'moneybag', hue: '#ffd23f', when: 'hostBeaten',
  text: 'Earn {$:25} after defeating the next Outlaw',
  apply: (c) => { c.money(25); return true; } });
T({ id: 'boss', name: 'Run ’Em Outta Town', icon: 'boot', hue: '#ff3d3d', when: 'now',
  text: 'Rerolls the Outlaw of this Town',
  apply: (c) => { c.run.flags.rerollHost = true; return true; } });
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
  text: 'Gain two random Boons ($6 each instead if your belt is full)',
  apply: (c) => { c.createCharm(); c.createCharm(); return true; } });
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
