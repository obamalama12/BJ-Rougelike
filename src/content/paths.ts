// The roads you take. After every table you win you pick one of three unmarked paths, and only
// once you've taken it do you find out what waited there: a Boon (an ability that helps), a Bane
// (an ability that hurts), or something that happens on the spot. Which outcome sits behind which
// path is shuffled by the run's seed, so the same seed always leads the same way.
//
// Abilities ride on the same hooks the engine runs for every effect (see CharmDef). They fill the
// five ability slots; Banes take a slot too, and a full belt means the new one replaces an old one.

import type { CharmDef } from '../game/api';
import type { Card, HandTypeId, Run } from '../core/types';
import { HAND_TYPES, isFace, isSuit } from '../core/cards';
import { Rng, hashSeed } from '../core/rng';

// ---------------------------------------------------------------------------
// The paths themselves: names and a line of scenery, never a clue to what's there.
// ---------------------------------------------------------------------------

export interface PathDef {
  name: string;
  icon: string;
  scene: string;
}

const P = (name: string, icon: string, scene: string): PathDef => ({ name, icon, scene });

export const PATHS: PathDef[] = [
  P('The Dry Creek Bed', 'mesa', 'Cracked mud and a trickle of shade.'),
  P('Follow the Buzzards', 'vulture', 'Three of them, circling lazy.'),
  P('The Abandoned Chapel', 'bell', 'The door swings in the wind.'),
  P('Old Mine Shaft No. 9', 'goldpan', 'Cold air breathes out of the dark.'),
  P('The Coyote Trail', 'coyote', 'Paw prints, fresh this morning.'),
  P('Through the Box Canyon', 'mesa', 'Walls close in on both sides.'),
  P('The Lone Windmill', 'windmill', 'It creaks, though there is no wind.'),
  P('Down by the River Ford', 'fish', 'Waist deep and moving fast.'),
  P('The Hangman’s Oak', 'rope', 'A frayed rope still hangs from it.'),
  P('Past the Water Tower', 'watertower', 'Somebody painted a face on it.'),
  P('The Railroad Tracks', 'train', 'Still warm from the 4:15.'),
  P('Smoke on the Ridge', 'smoke', 'A thin grey column, far off.'),
  P('The Painted Desert', 'sun', 'Red, then orange, then red again.'),
  P('The Snake Pit Shortcut', 'snake', 'It saves half a day, they say.'),
  P('The Medicine Wagon', 'wagon', 'A sign promises cures for all ills.'),
  P('Boot Hill', 'skull', 'Rows of crooked wooden crosses.'),
  P('The Ghost Town Road', 'ghost', 'Every window is dark.'),
  P('Under the Rope Bridge', 'rope', 'It sways when nobody is on it.'),
  P('The Saguaro Forest', 'cactus', 'Arms raised like a holdup.'),
  P('Toward the Thunderheads', 'lightning', 'The sky to the west is purple.'),
  P('The Old Indian Well', 'bucket', 'A bucket waits on a frayed line.'),
  P('The Gambler’s Rest', 'cards', 'A card table, set for four, empty.'),
  P('The Trading Post', 'crate', 'Shutters closed, lamp still lit.'),
  P('Across the Salt Flats', 'sun', 'White as far as you can see.'),
  P('The Outlaw’s Cave', 'lantern', 'A lantern glows deep inside.'),
  P('The Stagecoach Road', 'wagonwheel', 'Ruts worn deep by a hundred wheels.'),
  P('The Bone Orchard', 'fishbone', 'Bleached ribs, picked clean.'),
  P('Follow the Telegraph Poles', 'telegram', 'The wire hums a little tune.'),
  P('The Witch’s Hollow', 'cauldron', 'Something bubbles in a black pot.'),
  P('Past the Scarecrow', 'cowboyhat', 'Its hat is better than yours.'),
  P('The Moonlit Arroyo', 'moon', 'Silver light, long shadows.'),
  P('Along the Cattle Drive', 'bull', 'A thousand hoofprints, all one way.'),
  P('The Burned Homestead', 'campfire', 'Only the chimney still stands.'),
  P('The Sheriff’s Shortcut', 'badge', 'A tin star nailed to a post.'),
  P('Into the Fog Bank', 'cloud', 'You can’t see your own boots.'),
  P('The Tumbleweed Flats', 'tumbleweed', 'They all roll the same way.'),
  P('The Crooked Signpost', 'flag', 'Every arm points somewhere else.'),
  P('The Prospector’s Claim', 'nugget', '“Keep out. Mean it.”'),
  P('The Hot Springs Trail', 'bathtub', 'Steam rises from the rocks.'),
  P('The Swinging Saloon Doors', 'saloon', 'Piano music, slightly out of tune.'),
  P('Over Dead Man’s Pass', 'mesa', 'The wind up here bites.'),
  P('The Carnival Tent', 'tent', 'Painted letters: SEE THE MARVEL.'),
  P('The Lighthouse in the Desert', 'lightbulb', 'It makes no sense. It’s there anyway.'),
  P('The Wishing Well', 'coin', 'The bottom glints with pennies.'),
  P('Down the Mule Track', 'horse', 'Narrow, steep and stubborn.'),
  P('The Rattlesnake Ridge', 'snake', 'Rocks warm enough to fry an egg.'),
  P('The Twin Buttes', 'mesa', 'Two stone sisters, side by side.'),
  P('The Frozen Lake', 'crystal', 'Ice in the desert. Odd.'),
  P('Past the Gallows', 'jail', 'The trapdoor creaks open and shut.'),
  P('The Fortune Teller’s Wagon', 'crystal', 'A bead curtain, a crystal ball.'),
  P('The Lost Dutchman’s Trail', 'map', 'A map with half the corner torn off.'),
  P('Toward the Campfire Light', 'campfire', 'Someone is singing out there.'),
  P('The Hollow Log', 'tumbleweed', 'Big enough to crawl through.'),
  P('The Cliffside Ledge', 'mesa', 'One foot in front of the other.'),
  P('The Old Fort', 'flag', 'The flag has faded to pink.'),
  P('Follow the Fireflies', 'spark', 'They blink in a pattern.'),
  P('The Sunken Wagon', 'wagon', 'Half buried in the sand.'),
  P('The Bandit’s Hideout', 'bandana', 'Fresh hoof prints, and a dropped bandana.'),
  P('The Rain Dance Circle', 'cloud', 'Stones in a ring, worn smooth.'),
  P('The Bee Tree', 'apple', 'A low hum from inside the trunk.'),
  P('The Stampede Gulch', 'bull', 'The ground still trembles.'),
  P('The Scorpion Sands', 'scorpion', 'The sand moves on its own.'),
  P('The Undertaker’s Lane', 'skull', 'He tips his hat. Measures you.'),
  P('The Silver Vein', 'nugget', 'A glint in the rock face.'),
  P('The Whispering Pines', 'cactus', 'They say your name, softly.'),
  P('Past the Wrecked Train', 'train', 'Cars on their sides like sleeping cattle.'),
  P('The Lantern-Lit Path', 'lantern', 'Lanterns hung every twenty paces.'),
  P('The Broken Dam', 'bucket', 'A dry lake bed full of fish bones.'),
  P('The Cattle Rustler’s Trail', 'lasso', 'A cut fence and drag marks.'),
  P('The Medicine Man’s Hut', 'tonic', 'Herbs drying on a string.'),
  P('The Sidewinder Switchbacks', 'snake', 'The road doubles back on itself.'),
  P('The Lightning Tree', 'lightning', 'Split down the middle, still smoking.'),
  P('The Duck Pond', 'pond', 'A suspiciously calm pond.'),
  P('The Bounty Board', 'wanted', 'Faces you almost recognise.'),
  P('The Flooded Mine', 'goldpan', 'Water to the knees and rising.'),
  P('The Wild Horse Valley', 'horse', 'Mustangs watch you pass.'),
  P('The Train Robbers’ Rest', 'moneybag', 'Empty sacks with the bank’s stamp.'),
  P('Under the Big Sky', 'star', 'More stars than you can count.'),
  P('The Cursed Totem', 'eye', 'Its carved eyes follow you.'),
  P('The Pony Express Route', 'mailbox', 'A mail sack, never delivered.'),
  P('The Rusty Bridge', 'anvil', 'Bolts popping, one by one.'),
  P('The Weeping Rock', 'rock', 'Water seeps from a crack in the stone.'),
  P('Past the Old Mill', 'windmill', 'The millstone turns by itself.'),
  P('The Feather Trail', 'feather', 'Feathers, one every few yards.'),
  P('The Dust Devil Plain', 'tornado', 'Little twisters dance on the flats.'),
  P('The Moonshiner’s Still', 'jug', 'It smells strong enough to strip paint.'),
  P('The Hermit’s Shack', 'tent', 'A rocking chair rocks on the porch.'),
  P('The Gold Rush Camp', 'goldpan', 'Tents and shovels, nobody home.'),
  P('The Blind Canyon', 'mesa', 'No way out but back. Or is there?'),
  P('The Lucky Horseshoe Inn', 'horseshoe', 'A horseshoe over the door, points up.'),
  P('The Deserted Schoolhouse', 'book', 'Sums still chalked on the board.'),
  P('The Tar Pits', 'bucket', 'Bubbles rise and pop. Slowly.'),
  P('The Echoing Cavern', 'lantern', 'Your hello comes back wrong.'),
  P('The Last Chance Trail', 'map', 'The sign just says LAST CHANCE.'),
  P('The Silver Spur Ranch', 'spur', 'The gate is open. Welcome, maybe.'),
  P('The Hanging Valley', 'cloud', 'Mist pours over the edge like water.'),
  P('The Gunsmoke Alley', 'smoke', 'Bullet holes in every wall.'),
  P('The Blood Moon Road', 'moon', 'The moon is the wrong colour tonight.'),
  P('The Coffee Pot Rock', 'coffee', 'Shaped just like one. Smells like one too.'),
  P('The End of the Rainbow', 'clover', 'It really does end right there.'),
];

// ---------------------------------------------------------------------------
// Outcomes
// ---------------------------------------------------------------------------

/** An ability from a path. Banes (bane: true) are abilities that hurt. */
export type AbilityDef = CharmDef;

/** Something that happens on the spot and takes no slot. */
export interface InstantDef {
  id: string;
  name: string;
  icon: string;
  good: boolean;
  text: string;
  apply: (run: Run) => void;
}

export const ABILITIES: AbilityDef[] = [];
export const INSTANTS: InstantDef[] = [];

const BOON = '#4fbf6a';
const BANE = '#c8402a';
const boon = (d: Omit<AbilityDef, 'rarity' | 'cost' | 'hue'> & { hue?: string }) => ABILITIES.push({ rarity: 1, cost: 0, hue: BOON, ...d });
const bane = (d: Omit<AbilityDef, 'rarity' | 'cost' | 'hue' | 'bane'> & { hue?: string }) => ABILITIES.push({ rarity: 1, cost: 0, hue: BANE, ...d, bane: true });
const instant = (d: InstantDef) => INSTANTS.push(d);

const st = (s: { state: Record<string, any> }) => s.state;
const won = (o?: string) => o === 'win' || o === 'blackjack' || o === 'charlie' || o === 'dealerbust';
const mostPlayed = (run: Run): HandTypeId =>
  [...HAND_TYPES].sort((a, b) => (run.handPlays[b.id] ?? 0) - (run.handPlays[a.id] ?? 0))[0].id;
const gritCapOf = (run: Run) => run.maxGrit + (run.charms.some((k) => k.id === 'iron_gizzard') ? 4 : 0);
const healRun = (run: Run, n: number) => (run.grit = Math.min(gritCapOf(run), run.grit + n));
const suits = (cards: Card[]) => new Set(cards.filter((k) => k.ink !== 'stone').map((k) => k.suit)).size;

// --- Boons ----------------------------------------------------------------------------------

boon({ id: 'steady_hand', name: 'Steady Hand', icon: 'hand', text: '{m:+5} Odds on every winning hand', hand: (c) => c.mult(5) });
boon({ id: 'sharp_eye', name: 'Sharp Eye', icon: 'eye', text: '{c:+40} Pot on every winning hand', hand: (c) => c.chips(40) });
boon({ id: 'horseshoe_luck', name: 'Horseshoe Luck', icon: 'horseshoe', text: 'Scored {s:moon} cards give {m:+3} Odds', card: (c, _s, k) => { if (isSuit(k, 'moon', c.rules)) c.mult(3); } });
boon({ id: 'dynamite_touch', name: 'Dynamite Touch', icon: 'dynamite', text: 'Scored {s:flame} cards give {m:+3} Odds', card: (c, _s, k) => { if (isSuit(k, 'flame', c.rules)) c.mult(3); } });
boon({ id: 'cactus_kin', name: 'Cactus Kin', icon: 'cactus', text: 'Scored {s:leaf} cards give {m:+3} Odds', card: (c, _s, k) => { if (isSuit(k, 'leaf', c.rules)) c.mult(3); } });
boon({ id: 'lawmans_luck', name: 'Lawman’s Luck', icon: 'badge', text: 'Scored {s:bell} cards give {m:+3} Odds', card: (c, _s, k) => { if (isSuit(k, 'bell', c.rules)) c.mult(3); } });
boon({ id: 'face_reader', name: 'Face Reader', icon: 'monocle', text: 'Scored face cards give {c:+25} Pot', card: (c, _s, k) => { if (isFace(k, c.rules)) c.chips(25); } });
boon({ id: 'ace_up_sleeve', name: 'Ace Up the Sleeve', icon: 'cards', text: 'Scored Aces give {x:X1.5} Odds', card: (c, _s, k) => { if (k.rank === 14 && k.ink !== 'stone') c.xmult(1.5); } });
boon({ id: 'small_change', name: 'Small Change', icon: 'coins', text: 'Scored cards ranked {g:2 to 5} give {m:+4} Odds', card: (c, _s, k) => { if (k.rank <= 5 && k.ink !== 'stone') c.mult(4); } });
boon({ id: 'natural_talent', name: 'Natural Talent', icon: 'star', text: 'Quackjacks score {x:X2} Odds', hand: (c) => { if (c.handType === 'blackjack' || c.handType === 'royal') c.xmult(2); } });
boon({ id: 'five_card_fever', name: 'Five-Card Fever', icon: 'horse', text: 'Charley Horse hands score {x:X2.5} Odds', hand: (c) => { if (c.handType === 'charlie') c.xmult(2.5); } });
boon({ id: 'dead_eye_aim', name: 'Dead-Eye Aim', icon: 'eye', text: 'Hands that win with exactly 21 from 3 or more cards score {x:X2} Odds', hand: (c) => { if (c.total === 21 && c.cards.length >= 3) c.xmult(2); } });
boon({ id: 'underdog_spirit', name: 'Underdog Spirit', icon: 'coyote', text: 'Hands that win with 14 or less get {m:+15} Odds', hand: (c) => { if (c.total <= 14) c.mult(15); } });
boon({ id: 'iron_nerve', name: 'Iron Nerve', icon: 'shield', text: '{g:+1} hand at every table', slots: { hands: 1 } });
boon({ id: 'quick_feet', name: 'Quick Feet', icon: 'boot', text: '{g:+2} folds at every table', slots: { folds: 2 } });
boon({ id: 'gamblers_grin', name: 'Gambler’s Grin', icon: 'dice', text: 'Doubled hands score {x:X3} instead of X2', rules: (r) => { r.doubleX = Math.max(r.doubleX, 3); } });
boon({ id: 'long_reach', name: 'Long Reach', icon: 'lasso', text: 'You bust over {g:22} instead of 21', rules: (r) => { r.bustLimit += 1; } });
boon({ id: 'peeking_tom', name: 'Peeking Tom', icon: 'eye', text: 'You can see the dealer’s face-down card', rules: (r) => { r.seeHole = true; } });
boon({ id: 'sidewinder', name: 'Sidewinder', icon: 'snake', text: 'Hands won because the dealer busted score {x:X2} Odds', hand: (c) => { if (c.outcome === 'dealerbust') c.xmult(2); } });
boon({ id: 'card_counter', name: 'Card Counter', icon: 'book', text: (_s, run) => `{c:+2} Pot for each card left in the shoe {d:(currently {c:+${(run.table?.shoe.length ?? 0) * 2}})}`, hand: (c) => c.chips((c.table?.shoe.length ?? 0) * 2) });
boon({ id: 'hot_streak', name: 'Hot Streak', icon: 'campfire', init: () => ({ w: 0 }),
  text: (s) => `{x:X0.25} Odds for each hand in a row you've won {d:(currently {x:X${(1 + 0.25 * (st(s).w ?? 0)).toFixed(2)}})}`,
  hand: (c, s) => { if (st(s).w) c.xmult(1 + 0.25 * st(s).w); },
  resolve: (c, s) => { if (c.outcome === 'fold') return; st(s).w = won(c.outcome) ? (st(s).w ?? 0) + 1 : 0; } });
boon({ id: 'gold_tooth', name: 'Gold Tooth', icon: 'tooth', text: 'Earn {$:3} whenever you win a table', tableEnd: (c) => c.money(3) });
boon({ id: 'thick_hide', name: 'Thick Hide', icon: 'shield', text: 'Lose {g:1} less Grit whenever you lose Grit' });
boon({ id: 'second_wind', name: 'Second Wind', icon: 'feather', text: 'Once per table, a card that would make you bust is thrown away instead', bust: () => false });
boon({ id: 'big_spender', name: 'Big Spender', icon: 'moneybag', text: (_s, run) => `{m:+1} Odds for every {$:4} you carry {d:(currently {m:+${Math.max(0, Math.floor(run.money / 4))}})}`, hand: (c) => c.mult(Math.max(0, Math.floor(c.run.money / 4))) });
boon({ id: 'patience', name: 'Patience', icon: 'hourglass', text: '{m:+4} Odds for each fold you have left', hand: (c) => c.mult(4 * (c.table?.foldsLeft ?? 0)) });
boon({ id: 'last_stand', name: 'Last Stand', icon: 'flag', text: 'The last hand of every table scores {x:X3} Odds', hand: (c) => { if (c.isLast) c.xmult(3); } });
boon({ id: 'first_blood', name: 'First Blood', icon: 'revolver', text: 'The first hand of every table scores {x:X2} Odds', hand: (c) => { if (c.isFirst) c.xmult(2); } });
boon({ id: 'birds_of_a_feather', name: 'Birds of a Feather', icon: 'feather', text: 'Hands where every scored card shares a suit get {m:+15} Odds', hand: (c) => { if (c.scored.length >= 2 && suits(c.scored) === 1) c.mult(15); } });
boon({ id: 'rainbow_trail', name: 'Rainbow Trail', icon: 'clover', text: 'Hands with 3 or more different suits score {x:X1.5} Odds', hand: (c) => { if (suits(c.cards) >= 3) c.xmult(1.5); } });
boon({ id: 'full_saddlebags', name: 'Full Saddlebags', icon: 'crate', text: 'Hands of 4 or more cards get {c:+80} Pot', hand: (c) => { if (c.cards.length >= 4) c.chips(80); } });
boon({ id: 'two_of_a_kind', name: 'Two’s Company', icon: 'cards', text: 'Hands of exactly 2 cards get {m:+10} Odds', hand: (c) => { if (c.cards.length === 2) c.mult(10); } });
boon({ id: 'trigger_happy', name: 'Trigger Happy', icon: 'revolver', text: '{m:+4} Odds for each card you hit this hand', hand: (c) => c.mult(4 * (c.hand?.hits ?? 0)) });
boon({ id: 'stand_tall', name: 'Stand Tall', icon: 'boot', text: 'Hands you win without hitting get {m:+10} Odds', hand: (c) => { if (!c.hand?.hits) c.mult(10); } });
boon({ id: 'tall_tale_teller', name: 'Tall Tale Teller', icon: 'book', text: 'Beating an Outlaw levels up your most-played hand twice', hostBeaten: (c) => c.levelUp(mostPlayed(c.run), 2) });
boon({ id: 'campfire_stories', name: 'Campfire Stories', icon: 'campfire', text: 'Every table you win levels up your most-played hand', tableEnd: (c) => c.levelUp(mostPlayed(c.run), 1) });
boon({ id: 'docs_friend', name: 'Doc’s Old Friend', icon: 'tonic', text: 'Heal {g:1} Grit whenever you win a table', tableEnd: (c) => healRun(c.run, 1) });
boon({ id: 'iron_gizzard', name: 'Iron Gizzard', icon: 'heart', text: '{g:+4} max Grit' });
boon({ id: 'shrine_guardian', name: 'Sheriff’s Pardon', icon: 'badge', text: 'Outlaw curses have no effect on you' });
boon({ id: 'lucky_sevens', name: 'Lucky Sevens', icon: 'clover', text: 'Scored 7s give {x:X1.5} Odds', card: (c, _s, k) => { if (k.rank === 7 && k.ink !== 'stone') c.xmult(1.5); } });
boon({ id: 'even_steven', name: 'Even Steven', icon: 'coins', text: 'Scored even-ranked cards give {m:+2} Odds', card: (c, _s, k) => { if (k.rank <= 10 && k.rank % 2 === 0 && k.ink !== 'stone') c.mult(2); } });
boon({ id: 'odd_job', name: 'Odd Job', icon: 'dice', text: 'Scored odd-ranked cards (and Aces) give {m:+2} Odds', card: (c, _s, k) => { if ((k.rank === 14 || (k.rank <= 9 && k.rank % 2 === 1)) && k.ink !== 'stone') c.mult(2); } });
boon({ id: 'lazy_dealer', name: 'Lazy Dealer', icon: 'coffee', text: 'The dealer stands on {g:16}', rules: (r) => { r.dealerStand = Math.min(r.dealerStand, 16); } });
boon({ id: 'high_noon', name: 'High Noon', icon: 'sun', text: 'Hands that win with exactly 20 score {x:X2} Odds', hand: (c) => { if (c.total === 20) c.xmult(2); } });
boon({ id: 'peacemaker', name: 'Peacemaker', icon: 'heart', text: 'Ties count as wins', rules: (r) => { r.pushIsWin = true; } });
boon({ id: 'insurance_man', name: 'Insurance Man', icon: 'umbrella', text: 'When the dealer has a natural, you get the hand back', rules: (r) => { r.insurance = true; } });
boon({ id: 'split_decision', name: 'Split Decision', icon: 'scissors', text: 'Hands that came from a split get {x:X2} Odds', hand: (c) => { if (c.hand?.fromSplit) c.xmult(2); } });
boon({ id: 'low_profile', name: 'Low Profile', icon: 'bandana', text: 'Every target is {g:10%} lower', targetX: 0.9 });
boon({ id: 'shield_of_dawn', name: 'Tin Foil Hat', icon: 'cowboyhat', text: 'Curses that stop cards scoring have no effect on you' });
boon({ id: 'deep_pockets', name: 'Deep Pockets', icon: 'piggybank', text: 'Earn {$:1} for every hand you win', after: (c) => { if (won(c.outcome)) c.money(1); } });
boon({ id: 'growing_legend', name: 'Growing Legend', icon: 'trophy', init: () => ({ m: 0 }),
  text: (s) => `Gains {m:+2} Odds every time you win a table {d:(currently {m:+${st(s).m ?? 0}})}`,
  hand: (c, s) => c.mult(st(s).m ?? 0), tableEnd: (_c, s) => { st(s).m = (st(s).m ?? 0) + 2; } });

// --- Banes ----------------------------------------------------------------------------------

bane({ id: 'shaky_hands', name: 'Shaky Hands', icon: 'hand', text: 'Every winning hand scores {x:X0.8} Odds', hand: (c) => c.xmult(0.8) });
bane({ id: 'butterfingers', name: 'Butterfingers', icon: 'hand', text: '{r:-1} hand at every table', slots: { hands: -1 } });
bane({ id: 'cold_feet', name: 'Cold Feet', icon: 'boot', text: '{r:-1} fold at every table', slots: { folds: -1 } });
bane({ id: 'short_fuse', name: 'Short Fuse', icon: 'dynamite', text: 'You bust over {r:20} instead of 21', rules: (r) => { r.bustLimit -= 1; } });
bane({ id: 'squinting', name: 'Squinting', icon: 'glasses', text: 'The dealer’s upcard is dealt face down', rules: (r) => { r.dealerUpDown = true; } });
bane({ id: 'chicken_heart', name: 'Chicken Heart', icon: 'chicken', text: 'You can’t Double Down', rules: (r) => { r.canDouble = false; } });
bane({ id: 'stuck_together', name: 'Stuck Together', icon: 'needle', text: 'You can’t Split', rules: (r) => { r.canSplit = false; } });
bane({ id: 'jinxed_horseshoes', name: 'Jinxed Horseshoes', icon: 'horseshoe', text: 'Scored {s:moon} cards give {x:X0.9} Odds', card: (c, _s, k) => { if (isSuit(k, 'moon', c.rules)) c.xmult(0.9); } });
bane({ id: 'wet_powder', name: 'Wet Powder', icon: 'dynamite', text: 'Scored {s:flame} cards give {x:X0.9} Odds', card: (c, _s, k) => { if (isSuit(k, 'flame', c.rules)) c.xmult(0.9); } });
bane({ id: 'greedy_dealer', name: 'Greedy Dealer', icon: 'moneybag', text: 'The dealer keeps drawing until {r:18}', rules: (r) => { r.dealerStand = Math.max(r.dealerStand, 18); } });
bane({ id: 'soft_spot', name: 'Soft Spot', icon: 'pie', text: 'The dealer hits on soft 17', rules: (r) => { r.dealerHitSoft17 = true; } });
bane({ id: 'hanging_judge', name: 'Hanging Judge', icon: 'jail', text: 'Ties count as losses', rules: (r) => { r.dealerWinsTies = true; } });
bane({ id: 'toll_road', name: 'Toll Road', icon: 'coin', text: 'Every hit costs {$:1}', rules: (r) => { r.hitCost = Math.max(r.hitCost, 1); } });
bane({ id: 'tax_man', name: 'Tax Man', icon: 'scroll', text: 'Every hand you deal costs {$:1}', rules: (r) => { r.handCost = Math.max(r.handCost, 1); } });
bane({ id: 'stage_fright', name: 'Stage Fright', icon: 'ghost', text: 'The first hand of every table scores {x:X0.5} Odds', hand: (c) => { if (c.isFirst) c.xmult(0.5); } });
bane({ id: 'weak_knees', name: 'Weak Knees', icon: 'boot', text: 'The last hand of every table scores {x:X0.5} Odds', hand: (c) => { if (c.isLast) c.xmult(0.5); } });
bane({ id: 'stingy_luck', name: 'Stingy Luck', icon: 'piggybank', text: 'You can hit at most {r:3} times per hand', rules: (r) => { r.maxHits = Math.min(r.maxHits, 3); } });
bane({ id: 'ace_allergy', name: 'Ace Allergy', icon: 'cards', text: 'Aces always count as {r:1}, never 11', rules: (r) => { r.aceLow = true; } });
bane({ id: 'lead_boots', name: 'Lead Boots', icon: 'anvil', text: 'Charley Horse needs {r:6} cards instead of 5', rules: (r) => { r.charlieSize = Math.max(r.charlieSize, 6); } });
bane({ id: 'bad_reputation', name: 'Bad Reputation', icon: 'wanted', text: 'Naturals score as Quick Draw', rules: (r) => { r.blackjackAsOutdraw = true; } });
bane({ id: 'leaky_pockets', name: 'Leaky Pockets', icon: 'coin', text: 'Lose {$:1} every hand you play', resolve: (c) => { if (c.outcome !== 'fold' && c.run.money > 0) c.money(-1); } });
bane({ id: 'fading_memory', name: 'Fading Memory', icon: 'smoke', text: 'Beating an Outlaw costs your most-played hand a level', hostBeaten: (c) => { const h = mostPlayed(c.run); if (c.run.handLevels[h] > 1) c.levelUp(h, -1); } });
bane({ id: 'hangover', name: 'Hangover', icon: 'jug', text: 'Every winning hand scores {x:X0.85} Odds', hand: (c) => c.xmult(0.85) });
bane({ id: 'wanted_poster', name: 'Wanted Poster', icon: 'wanted', text: 'Every target is {r:15%} higher', targetX: 1.15 });
bane({ id: 'gun_jam', name: 'Gun Jam', icon: 'revolver', text: 'You can’t Fold', rules: (r) => { r.canFold = false; } });
bane({ id: 'restless', name: 'Restless', icon: 'tornado', text: 'You must hit at least once every hand', rules: (r) => { r.mustHit = true; } });
bane({ id: 'fools_gold', name: 'Fool’s Gold', icon: 'nugget', text: 'Doubled hands score {r:X1.5} instead of X2', rules: (r) => { r.doubleX = Math.min(r.doubleX, 1.5); } });
bane({ id: 'glass_jaw', name: 'Glass Jaw', icon: 'tooth', text: 'Lose {r:1} extra Grit whenever you lose Grit' });
bane({ id: 'heavy_saddle', name: 'Heavy Saddle', icon: 'anvil', text: 'Takes up {r:2} ability slots', slots: { charm: -1 } });
bane({ id: 'bad_company', name: 'Bad Company', icon: 'skull', text: 'Outlaw targets are {r:25%} higher', targetX: 1, hostTargetX: 1.25 });
bane({ id: 'lonely_road', name: 'Lonely Road', icon: 'tumbleweed', text: 'Hands of 4 or more cards score {x:X0.75} Odds', hand: (c) => { if (c.cards.length >= 4) c.xmult(0.75); } });
bane({ id: 'cursed_aces', name: 'Cursed Aces', icon: 'skull', text: 'Scored Aces give {x:X0.8} Odds', card: (c, _s, k) => { if (k.rank === 14 && k.ink !== 'stone') c.xmult(0.8); } });
bane({ id: 'tin_ear', name: 'Tin Ear', icon: 'bell', text: 'Hands won by the dealer busting score {x:X0.6} Odds', hand: (c) => { if (c.outcome === 'dealerbust') c.xmult(0.6); } });

// --- On the spot ------------------------------------------------------------------------------

const gritHurt = (run: Run, n: number) => (run.grit = Math.max(1, run.grit - n));
instant({ id: 'hidden_stash', name: 'Hidden Stash', icon: 'moneybag', good: true, text: 'You dig up a tin of coins: {$:+12}', apply: (run) => { run.money += 12; } });
instant({ id: 'hot_spring', name: 'Hot Spring', icon: 'bathtub', good: true, text: 'A long soak: heal {g:4} Grit', apply: (run) => healRun(run, 4) });
instant({ id: 'old_almanac', name: 'Old Almanac', icon: 'book', good: true, text: 'Your two most-played hands each go up a level', apply: (run) => {
  const top = [...HAND_TYPES].sort((a, b) => (run.handPlays[b.id] ?? 0) - (run.handPlays[a.id] ?? 0)).slice(0, 2);
  for (const h of top) run.handLevels[h.id]++;
} });
instant({ id: 'kind_stranger', name: 'A Kind Stranger', icon: 'cowboyhat', good: true, text: 'Shares his supper: {$:+5} and {g:+2} Grit', apply: (run) => { run.money += 5; healRun(run, 2); } });
instant({ id: 'lucky_aces', name: 'Lucky Aces', icon: 'cards', good: true, text: 'Two of your lowest cards turn into Aces', apply: (run) => {
  for (const k of [...run.deck].filter((x) => x.rank !== 14 && x.ink !== 'stone').sort((a, b) => a.rank - b.rank).slice(0, 2)) k.rank = 14;
} });
instant({ id: 'thin_the_herd', name: 'Thin the Herd', icon: 'scissors', good: true, text: 'Three of the lowest cards leave your deck', apply: (run) => {
  const low = [...run.deck].filter((k) => k.ink !== 'stone').sort((a, b) => a.rank - b.rank).slice(0, 3).map((k) => k.id);
  run.deck = run.deck.filter((k) => !low.includes(k.id));
} });
instant({ id: 'tougher_hide', name: 'Tougher Hide', icon: 'heart', good: true, text: '{g:+1} max Grit for the rest of the run', apply: (run) => { run.maxGrit += 1; run.grit += 1; } });
instant({ id: 'ambush', name: 'Ambush!', icon: 'bandana', good: false, text: 'Bandits jump you: {r:-3} Grit', apply: (run) => gritHurt(run, 3) });
instant({ id: 'pickpocket', name: 'Pickpocket', icon: 'hand', good: false, text: 'Someone lifted half your Bucks', apply: (run) => { run.money = Math.floor(Math.max(0, run.money) / 2); } });
instant({ id: 'rockslide', name: 'Rockslide', icon: 'rock', good: false, text: 'Rocks come down the hill: {r:-2} Grit', apply: (run) => gritHurt(run, 2) });
instant({ id: 'pebbles', name: 'Pebbles in the Deck', icon: 'rock', good: false, text: 'Three of your cards are swapped for worthless rocks', apply: (run) => {
  const r = new Rng(run.rng);
  for (const k of r.shuffle(run.deck.filter((x) => x.ink !== 'stone')).slice(0, 3)) k.ink = 'stone';
  run.rng = r.state;
} });
instant({ id: 'stampede', name: 'Stampede', icon: 'bull', good: false, text: 'Two of your face cards are trampled', apply: (run) => {
  const faces = run.deck.filter((k) => isFace(k)).slice(0, 2).map((k) => k.id);
  run.deck = run.deck.filter((k) => !faces.includes(k.id));
} });
instant({ id: 'bad_water', name: 'Bad Water', icon: 'bucket', good: false, text: '{r:-1} max Grit for the rest of the run', apply: (run) => { run.maxGrit = Math.max(4, run.maxGrit - 1); run.grit = Math.min(run.grit, gritCapOf(run)); } });
instant({ id: 'word_gets_around', name: 'Word Gets Around', icon: 'wanted', good: false, text: 'The next Outlaw hears you’re coming: their target is {r:25%} higher', apply: (run) => {
  // Already beat this town's Outlaw? Then it's the next town's who hears about you.
  if (run.trail.nodes.some((n) => n.kind === 'outlaw' && n.done)) run.flags.wantedNext = true;
  else run.flags.wantedPoster = true;
} });
instant({ id: 'snake_oil', name: 'Snake Oil', icon: 'tonic', good: false, text: 'You paid {$:8} for coloured water', apply: (run) => { run.money = Math.max(0, run.money - 8); } });
instant({ id: 'lost_trail', name: 'Lost the Trail', icon: 'compass', good: false, text: 'A wasted day: your least-played hand drops a level', apply: (run) => {
  const h = [...HAND_TYPES].filter((x) => run.handLevels[x.id] > 1).sort((a, b) => (run.handPlays[a.id] ?? 0) - (run.handPlays[b.id] ?? 0))[0];
  if (h) run.handLevels[h.id]--;
} });

// ---------------------------------------------------------------------------
// Which outcome waits on which path, for this run
// ---------------------------------------------------------------------------

export type Outcome = { kind: 'ability'; id: string } | { kind: 'instant'; id: string };

export const ABILITY: Record<string, AbilityDef> = Object.fromEntries(ABILITIES.map((a) => [a.id, a]));
export const INSTANT: Record<string, InstantDef> = Object.fromEntries(INSTANTS.map((a) => [a.id, a]));

const OUTCOMES: Outcome[] = [
  ...ABILITIES.map((a) => ({ kind: 'ability' as const, id: a.id })),
  ...INSTANTS.map((a) => ({ kind: 'instant' as const, id: a.id })),
];

const mapCache = new Map<string, Outcome[]>();
/** The outcome behind each path for a seed: a fixed shuffle, so the same seed always leads the same way. */
export function pathOutcomes(seed: string): Outcome[] {
  let m = mapCache.get(seed);
  if (!m) {
    m = new Rng(hashSeed(`${seed}:roads`)).shuffle([...OUTCOMES]);
    mapCache.set(seed, m);
  }
  return m;
}

export function outcomeOf(run: Run, path: number): Outcome {
  return pathOutcomes(run.seed)[path];
}

export function isGood(o: Outcome): boolean {
  return o.kind === 'ability' ? !ABILITY[o.id]?.bane : !!INSTANT[o.id]?.good;
}
