// Relics: permanent upgrades bought once per Night from the shop.

import type { VoucherDef } from '../game/api';

export const VOUCHERS: VoucherDef[] = [];
const V = (d: VoucherDef) => VOUCHERS.push(d);

V({ id: 'overstock', name: 'Extra Stall', icon: 'shrine', text: '{g:+1} card slot in the shop', slots: { shop: 1 } });
V({ id: 'overstock_plus', name: 'Grand Bazaar', icon: 'pagoda', requires: 'overstock', text: '{g:+1} more card slot in the shop', slots: { shop: 1 } });

V({ id: 'clearance', name: 'Haggler’s Tongue', icon: 'scales', text: 'Everything in the shop is {g:25%} off' });
V({ id: 'liquidation', name: 'Silver Tongue', icon: 'scales', requires: 'clearance', text: 'Everything in the shop is {g:50%} off' });

V({ id: 'hone', name: 'Polishing Cloth', icon: 'spark', text: 'Foil, Holographic and Prismatic Charms appear {g:2X} more often' });
V({ id: 'glow_up', name: 'Lacquer Pot', icon: 'cauldron', requires: 'hone', text: 'Foil, Holographic and Prismatic Charms appear {g:4X} more often' });

V({ id: 'reroll_surplus', name: 'Loose Change', icon: 'coins', text: 'Rerolls cost {$:2} less' });
V({ id: 'reroll_glut', name: 'Bottomless Purse', icon: 'purse', requires: 'reroll_surplus', text: 'Rerolls cost an additional {$:2} less' });

V({ id: 'crystal_ball', name: 'Crystal Ball', icon: 'crystal', text: '{g:+1} consumable slot', slots: { cons: 1 } });
V({ id: 'omen_globe', name: 'Omen Globe', icon: 'eye', requires: 'crystal_ball', text: 'Masks may appear in Fortune Bundles' });

V({ id: 'telescope', name: 'Telescope', icon: 'telescope', text: 'Star Bundles always contain the Constellation of your most played hand' });
V({ id: 'observatory', name: 'Observatory', icon: 'pagoda', requires: 'telescope', text: 'Constellations you hold give {x:X1.5} Mult to their hand type' });

V({ id: 'grabber', name: 'Third Arm', icon: 'hand', text: '{g:+1} hand each table', slots: { hands: 1 } });
V({ id: 'nacho_tong', name: 'Thousand Arms', icon: 'hand', requires: 'grabber', text: '{g:+1} more hand each table', slots: { hands: 1 } });

V({ id: 'wasteful', name: 'Loose Sleeves', icon: 'fan', text: '{g:+1} fold each table', slots: { folds: 1 } });
V({ id: 'recyclomancy', name: 'Deep Sleeves', icon: 'fan', requires: 'wasteful', text: '{g:+1} more fold each table', slots: { folds: 1 } });

V({ id: 'fortune_stall', name: 'Fortune Stall', icon: 'scroll', text: 'Fortunes appear {g:2X} more often in the shop' });
V({ id: 'fortune_emporium', name: 'Fortune Emporium', icon: 'book', requires: 'fortune_stall', text: 'Fortunes appear {g:4X} more often in the shop' });

V({ id: 'star_stall', name: 'Star Stall', icon: 'star', text: 'Constellations appear {g:2X} more often in the shop' });
V({ id: 'star_emporium', name: 'Star Emporium', icon: 'comet', requires: 'star_stall', text: 'Constellations appear {g:4X} more often in the shop' });

V({ id: 'seed_money', name: 'Savings Jar', icon: 'gourd', text: 'Interest cap raised to {$:10} per table', slots: { interest: 5 } });
V({ id: 'money_tree_v', name: 'Treasury', icon: 'coins', requires: 'seed_money', text: 'Interest cap raised to {$:20} per table', slots: { interest: 10 } });

V({ id: 'spare_altar', name: 'Spare Altar', icon: 'shrine', text: '{g:+1} Charm slot', slots: { charm: 1 } });
V({ id: 'grand_altar', name: 'Grand Altar', icon: 'torii', requires: 'spare_altar', text: '{g:+1} more Charm slot', slots: { charm: 1 } });

V({ id: 'lantern_eye', name: 'Lantern Eye', icon: 'eye', text: 'See the dealer’s hole card', rules: (r) => { r.seeHole = true; } });
V({ id: 'dragon_eye', name: 'Dragon Eye', icon: 'dragon', requires: 'lantern_eye', text: 'Also see the top card of the shoe', rules: (r) => { r.seeTop = Math.max(r.seeTop, 1); } });

V({ id: 'time_scroll', name: 'Time Scroll', icon: 'hourglass', text: '{g:-1} Night, {r:-1} hand each table', slots: { hands: -1 }, onBuy: (c) => { c.run.night = Math.max(1, c.run.night - 1); } });
V({ id: 'ancient_scroll', name: 'Ancient Scroll', icon: 'scroll', requires: 'time_scroll', text: '{g:-1} Night, {r:-1} fold each table', slots: { folds: -1 }, onBuy: (c) => { c.run.night = Math.max(1, c.run.night - 1); } });

V({ id: 'fate_thread', name: 'Fate Thread', icon: 'needle', text: 'Reroll the Host once per Night {d:($10)}' });
V({ id: 'fate_loom', name: 'Fate Loom', icon: 'wheel', requires: 'fate_thread', text: 'Reroll the Host any number of times {d:($10 each)}' });

V({ id: 'card_tray', name: 'Card Tray', icon: 'cards', text: 'Playing cards may appear in the shop' });
V({ id: 'card_market', name: 'Card Market', icon: 'cards', requires: 'card_tray', text: 'Playing cards in the shop may be inked, sealed or finished' });

V({ id: 'bold_wager', name: 'Bold Wager', icon: 'dice', text: 'Doubled hands give {x:X2.5} Mult', rules: (r) => { r.doubleX = Math.max(r.doubleX, 2.5); } });
V({ id: 'high_roller', name: 'High Roller', icon: 'crown', requires: 'bold_wager', text: 'Doubled hands give {x:X3} Mult and cost no extra hand', rules: (r) => { r.doubleX = Math.max(r.doubleX, 3); r.doubleCost = 0; } });

V({ id: 'split_decision', name: 'Split Decision', icon: 'scissors', text: 'You may split any two 10-value cards', rules: (r) => { r.splitAnyTen = true; } });
V({ id: 'hydra_gift', name: 'Hydra’s Gift', icon: 'snake', requires: 'split_decision', text: 'Splitting costs no extra hand', rules: (r) => { r.splitCost = 0; } });

V({ id: 'gentle_dealer', name: 'Gentle Dealer', icon: 'teacup', text: 'The dealer must hit on soft 17', rules: (r) => { r.dealerHitSoft17 = true; } });
V({ id: 'weary_dealer', name: 'Weary Dealer', icon: 'hourglass', requires: 'gentle_dealer', text: 'The dealer must hit until {g:18}', rules: (r) => { r.dealerStand = Math.max(r.dealerStand, 18); } });

export const VOUCHER: Record<string, VoucherDef> = Object.fromEntries(VOUCHERS.map((v) => [v.id, v]));
