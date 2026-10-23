// Relics: permanent upgrades bought once per Night from the shop.

import type { VoucherDef } from '../game/api';

export const VOUCHERS: VoucherDef[] = [];
const V = (d: VoucherDef) => VOUCHERS.push(d);

V({ id: 'overstock', name: 'Extra Shelf', icon: 'crate', text: '{g:+1} card slot in the shop', slots: { shop: 1 } });
V({ id: 'overstock_plus', name: 'Department Store', icon: 'saloon', requires: 'overstock', text: '{g:+1} more card slot in the shop', slots: { shop: 1 } });

V({ id: 'clearance', name: 'Haggler', icon: 'moneybag', text: 'Everything in the shop is {g:25%} off' });
V({ id: 'liquidation', name: 'Fire Sale', icon: 'campfire', requires: 'clearance', text: 'Everything in the shop is {g:50%} off' });

V({ id: 'hone', name: 'Polishing Rag', icon: 'spark', text: 'Shiny, Holographic and Prismatic Doodads appear {g:2X} more often' });
V({ id: 'glow_up', name: 'Shoe Shine Parlor', icon: 'boot', requires: 'hone', text: 'Shiny, Holographic and Prismatic Doodads appear {g:4X} more often' });

V({ id: 'reroll_surplus', name: 'Loose Change', icon: 'coins', text: 'Rerolls cost {$:2} less' });
V({ id: 'reroll_glut', name: 'Bottomless Purse', icon: 'moneybag', requires: 'reroll_surplus', text: 'Rerolls cost an additional {$:2} less' });

V({ id: 'crystal_ball', name: 'Saddlebag', icon: 'holster', text: '{g:+1} consumable slot', slots: { cons: 1 } });
V({ id: 'omen_globe', name: 'Moonshine Still', icon: 'jug', requires: 'crystal_ball', text: 'Moonshine may appear in Tonic Crates' });

V({ id: 'telescope', name: 'Spyglass', icon: 'spyglass', text: 'Tall Tale Crates always contain the Tall Tale of your most played hand' });
V({ id: 'observatory', name: 'Lookout Tower', icon: 'watertower', requires: 'telescope', text: 'Tall Tales you hold give {x:X1.5} Odds to their hand type' });

V({ id: 'grabber', name: 'Third Arm', icon: 'hand', text: '{g:+1} hand each table', slots: { hands: 1 } });
V({ id: 'nacho_tong', name: 'Octo-Ranch Hand', icon: 'fist', requires: 'grabber', text: '{g:+1} more hand each table', slots: { hands: 1 } });

V({ id: 'wasteful', name: 'Loose Sleeves', icon: 'bandana', text: '{g:+1} fold each table', slots: { folds: 1 } });
V({ id: 'recyclomancy', name: 'Deep Pockets', icon: 'piggybank', requires: 'wasteful', text: '{g:+1} more fold each table', slots: { folds: 1 } });

V({ id: 'fortune_stall', name: 'Medicine Wagon', icon: 'wagon', text: 'Tonics appear {g:2X} more often in the shop' });
V({ id: 'fortune_emporium', name: 'Apothecary', icon: 'tonic', requires: 'fortune_stall', text: 'Tonics appear {g:4X} more often in the shop' });

V({ id: 'star_stall', name: 'Campfire Circle', icon: 'campfire', text: 'Tall Tales appear {g:2X} more often in the shop' });
V({ id: 'star_emporium', name: 'Storytelling Contest', icon: 'trophy', requires: 'star_stall', text: 'Tall Tales appear {g:4X} more often in the shop' });

V({ id: 'seed_money', name: 'Savings Jar', icon: 'piggybank', text: 'Interest cap raised to {$:10} per table', slots: { interest: 5 } });
V({ id: 'money_tree_v', name: 'Bank Vault', icon: 'moneybag', requires: 'seed_money', text: 'Interest cap raised to {$:20} per table', slots: { interest: 10 } });

V({ id: 'spare_altar', name: 'Bandolier', icon: 'bullet', text: '{g:+1} Doodad slot', slots: { charm: 1 } });
V({ id: 'grand_altar', name: 'Wagon Hitch', icon: 'wagon', requires: 'spare_altar', text: '{g:+1} more Doodad slot', slots: { charm: 1 } });

V({ id: 'lantern_eye', name: 'Card Peeker', icon: 'eye', text: 'See the dealer’s hole card', rules: (r) => { r.seeHole = true; } });
V({ id: 'dragon_eye', name: 'X-Ray Specs', icon: 'glasses', requires: 'lantern_eye', text: 'Also see the top card of the shoe', rules: (r) => { r.seeTop = Math.max(r.seeTop, 1); } });

V({ id: 'time_scroll', name: 'Shortcut Map', icon: 'map', text: '{g:-1} Town, {r:-1} hand each table', slots: { hands: -1 }, onBuy: (c) => { c.run.night = Math.max(1, c.run.night - 1); } });
V({ id: 'ancient_scroll', name: 'Secret Trail', icon: 'compass', requires: 'time_scroll', text: '{g:-1} Town, {r:-1} fold each table', slots: { folds: -1 }, onBuy: (c) => { c.run.night = Math.max(1, c.run.night - 1); } });

V({ id: 'fate_thread', name: 'Bribe the Sheriff', icon: 'badge', text: 'Reroll the Outlaw once per Town {d:($10)}' });
V({ id: 'fate_loom', name: 'Own the Sheriff', icon: 'crown', requires: 'fate_thread', text: 'Reroll the Outlaw any number of times {d:($10 each)}' });

V({ id: 'card_tray', name: 'Card Rack', icon: 'cards', text: 'Playing cards may appear in the shop' });
V({ id: 'card_market', name: 'Card Emporium', icon: 'chips', requires: 'card_tray', text: 'Playing cards in the shop may be painted, branded or finished' });

V({ id: 'bold_wager', name: 'Bold Bet', icon: 'dice', text: 'Doubled hands give {x:X2.5} Odds', rules: (r) => { r.doubleX = Math.max(r.doubleX, 2.5); } });
V({ id: 'high_roller', name: 'High Roller', icon: 'tophat', requires: 'bold_wager', text: 'Doubled hands give {x:X3} Odds and cost no extra hand', rules: (r) => { r.doubleX = Math.max(r.doubleX, 3); r.doubleCost = 0; } });

V({ id: 'split_decision', name: 'Split Decision', icon: 'scissors', text: 'You may split any two 10-value cards', rules: (r) => { r.splitAnyTen = true; } });
V({ id: 'hydra_gift', name: 'Two-Headed Duck', icon: 'duckling', requires: 'split_decision', text: 'Splitting costs no extra hand', rules: (r) => { r.splitCost = 0; } });

V({ id: 'gentle_dealer', name: 'Sleepy Dealer', icon: 'coffee', text: 'The dealer must hit on soft 17', rules: (r) => { r.dealerHitSoft17 = true; } });
V({ id: 'weary_dealer', name: 'Hungover Dealer', icon: 'bottle', requires: 'gentle_dealer', text: 'The dealer must hit until {g:18}', rules: (r) => { r.dealerStand = Math.max(r.dealerStand, 18); } });

export const VOUCHER: Record<string, VoucherDef> = Object.fromEntries(VOUCHERS.map((v) => [v.id, v]));
