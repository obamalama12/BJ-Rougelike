// The roads you take. After you beat one of the Outlaw's gang you pick one of three unmarked paths, and only
// once you've taken it do you find out what waited there: a Boon (an ability that helps), a Bane
// (an ability that hurts), or something that happens on the spot. Which outcome sits behind which
// path is shuffled by the run's seed, so the same seed always leads the same way.
//
// Abilities ride on the same hooks the engine runs for every effect (see CharmDef). They fill the
// five ability slots; Banes take a slot too, and a full belt means the new one replaces an old one.

import type { CharmDef } from '../game/api';
import type { Card, HandTypeId, Run } from '../core/types';
import { HAND_TYPES, handTotal, isFace, isSuit } from '../core/cards';
import { Rng, hashSeed } from '../core/rng';

// ---------------------------------------------------------------------------
// The paths themselves: names and a line of scenery, never a clue to what's there.
// ---------------------------------------------------------------------------

export interface PathDef {
  name: string;
  icon: string;
  /** How the road looks from the fork. It says nothing about what's actually down there: the
   *  outcomes are shuffled by seed, so an inviting road can bite and a grim one can pay. */
  tone: 'lure' | 'omen' | 'odd';
  scene: string;
}

const P = (name: string, icon: string, tone: PathDef['tone'], scene: string): PathDef => ({ name, icon, tone, scene });

export const PATHS: PathDef[] = [
  P('The Dry Creek Bed', 'mesa', 'odd', 'Cracked mud and a trickle of shade. Something has been digging here, and recently, in a perfect circle.'),
  P('Follow the Buzzards', 'vulture', 'omen', 'Three of them, circling lazy over the next ridge. Whatever they found is too big to be a rabbit.'),
  P('The Abandoned Chapel', 'bell', 'omen', 'The door swings in the wind and the bell rings on its own. The pews are full of dust. And footprints.'),
  P('Old Mine Shaft No. 9', 'goldpan', 'lure', 'Fresh gold dust glitters on the rails at the entrance. Whoever left in such a hurry left the good stuff behind.'),
  P('The Coyote Trail', 'coyote', 'omen', 'Paw prints, fresh this morning, and a lot of them. Somewhere up ahead the yipping has gone very quiet.'),
  P('Through the Box Canyon', 'mesa', 'omen', 'The walls close in until you can touch both sides. Perfect place for an ambush, if anybody was planning one.'),
  P('The Lone Windmill', 'windmill', 'odd', 'It creaks round and round, though there isn’t a breath of wind. Painted on the vane: TURN BACK. Or TURN BLACK.'),
  P('Down by the River Ford', 'fish', 'lure', 'Cool water, shady cottonwoods, and a family of ducks splashing about. The prettiest spot on the whole trail.'),
  P('The Hangman’s Oak', 'rope', 'omen', 'A frayed rope still hangs from the big branch, swaying a little. Carved in the bark: a list of names, and room for more.'),
  P('Past the Water Tower', 'watertower', 'odd', 'Somebody painted a grinning face on the tank. Its eyes seem to follow you no matter which side you ride past.'),
  P('The Railroad Tracks', 'train', 'lure', 'Still warm from the 4:15, and a strongbox has fallen off the back and burst open in the gravel. Nobody’s around.'),
  P('Smoke on the Ridge', 'smoke', 'odd', 'A thin grey column far off. Could be a homesteader’s supper. Could be a signal. Could be what’s left of a wagon.'),
  P('The Painted Desert', 'sun', 'lure', 'Red, then orange, then red again, rolling out like a giant’s blanket. Folks say the view alone makes a duck lucky.'),
  P('The Snake Pit Shortcut', 'snake', 'omen', 'It saves half a day, they say. The hissing starts the moment your boot touches the path, and it never really stops.'),
  P('The Medicine Wagon', 'wagon', 'lure', 'A painted sign promises CURES FOR ALL ILLS, FIRST BOTTLE FREE. The salesman has a very honest-looking mustache.'),
  P('Boot Hill', 'skull', 'omen', 'Rows of crooked wooden crosses, and one freshly dug hole with no cross yet. The undertaker is waiting with a shovel.'),
  P('The Ghost Town Road', 'ghost', 'omen', 'Every window is dark, but the saloon piano is playing. A whole town of empty chairs, all turned to face the door.'),
  P('Under the Rope Bridge', 'rope', 'odd', 'It sways when nobody is on it. Something dangles from the middle plank, catching the light. Keys? Teeth?'),
  P('The Saguaro Forest', 'cactus', 'odd', 'Hundreds of them, arms raised like a holdup. One of them seems to have moved since you last looked.'),
  P('Toward the Thunderheads', 'lightning', 'omen', 'The sky to the west is purple and grumbling. Lightning walks across the flats like it’s looking for somebody.'),
  P('The Old Indian Well', 'bucket', 'lure', 'Sweet, cold water, the best in three counties. A bucket waits on the line as if it was left out just for you.'),
  P('The Gambler’s Rest', 'cards', 'lure', 'A card table set for four under a shade tree, a full pot still on it and nobody guarding it. Finders keepers?'),
  P('The Trading Post', 'crate', 'lure', 'Shutters closed but the lamp is lit and the door is unlocked. A sign says HELP YOURSELF, PAY WHAT’S FAIR.'),
  P('Across the Salt Flats', 'sun', 'omen', 'White as bone as far as you can see, and twice as dry. The heat makes three of everything on the horizon.'),
  P('The Outlaw’s Cave', 'lantern', 'omen', 'A lantern glows deep inside, and you can hear coins being counted. Somebody laughs. It isn’t a friendly laugh.'),
  P('The Stagecoach Road', 'wagonwheel', 'lure', 'Smooth, wide and well travelled, with a mile marker every mile. The safest, most sensible road a duck could take.'),
  P('The Bone Orchard', 'fishbone', 'omen', 'Bleached ribs and skulls, picked clean, arranged in neat rows like somebody’s garden. The gardener isn’t home. Yet.'),
  P('Follow the Telegraph Poles', 'telegram', 'odd', 'The wire hums a little tune, the same three notes over and over. Every pole has a horseshoe nailed to it, upside down.'),
  P('The Witch’s Hollow', 'cauldron', 'omen', 'Something bubbles in a black pot over green flames. A voice from the trees says it’s been expecting you.'),
  P('Past the Scarecrow', 'cowboyhat', 'odd', 'Its hat is better than yours and its boots are newer. It’s holding a winning hand of cards, face up.'),
  P('The Moonlit Arroyo', 'moon', 'lure', 'Silver light, soft sand and crickets singing. A night so peaceful you could fall asleep in the saddle.'),
  P('Along the Cattle Drive', 'bull', 'lure', 'A thousand hoofprints, and the trail boss pays a dollar a day to anyone who rides along. Easy money.'),
  P('The Burned Homestead', 'campfire', 'omen', 'Only the chimney still stands, and the ashes are warm. Whatever did this might still be close.'),
  P('The Sheriff’s Shortcut', 'badge', 'lure', 'A tin star nailed to a post and a sign: LAWFUL TRAVELLERS WELCOME. Nothing bad ever happens on the sheriff’s road.'),
  P('Into the Fog Bank', 'cloud', 'odd', 'You can’t see your own boots. Somewhere inside, a duck that sounds exactly like you is calling your name.'),
  P('The Tumbleweed Flats', 'tumbleweed', 'odd', 'They all roll the same way, against the wind. As if they’re running from something. Or toward it.'),
  P('The Crooked Signpost', 'flag', 'odd', 'Every arm points somewhere else and one just says YOU. Somebody has whittled a little smiling face on top.'),
  P('The Prospector’s Claim', 'nugget', 'lure', '“Keep out. Mean it.” But the claim’s been abandoned for weeks, and the sluice box is still full of glitter.'),
  P('The Hot Springs Trail', 'bathtub', 'lure', 'Steam rises from turquoise pools in the rocks. A long soak would take the ache right out of your tail feathers.'),
  P('The Swinging Saloon Doors', 'saloon', 'lure', 'Piano music, cold sarsaparilla and a barkeep pouring the first round on the house. What could go wrong?'),
  P('Over Dead Man’s Pass', 'mesa', 'omen', 'The wind up here bites and the drop is a mile straight down. Named for the last fella who tried it in a hurry.'),
  P('The Carnival Tent', 'tent', 'odd', 'Painted letters: SEE THE MARVEL, ONE NIGHT ONLY. A barker with too many teeth waves you inside.'),
  P('The Lighthouse in the Desert', 'lightbulb', 'odd', 'A lighthouse, three hundred miles from any sea, its lamp turning slowly in broad daylight. The door is open.'),
  P('The Wishing Well', 'coin', 'lure', 'The bottom glints with a fortune in pennies. Toss one in and make a wish. Or climb down and take them all.'),
  P('Down the Mule Track', 'horse', 'odd', 'Narrow, steep and stubborn, like the mule tied at the top. He looks at you like he knows something you don’t.'),
  P('The Rattlesnake Ridge', 'snake', 'omen', 'Rocks warm enough to fry an egg, and every crack rattles when you pass. The view from the top is spectacular, they say.'),
  P('The Twin Buttes', 'mesa', 'odd', 'Two stone sisters, side by side, and a path that runs right between them. Old-timers won’t say what happens in the middle.'),
  P('The Frozen Lake', 'crystal', 'odd', 'Ice in the middle of the desert, clear as glass. Something is frozen under the surface, looking up at you.'),
  P('Past the Gallows', 'jail', 'omen', 'The trapdoor creaks open and shut, open and shut, though nobody’s standing on it. The noose is your size.'),
  P('The Fortune Teller’s Wagon', 'crystal', 'lure', 'A bead curtain, a crystal ball and an old hen who says your future is very, very bright. First reading free.'),
  P('The Lost Dutchman’s Trail', 'map', 'lure', 'A treasure map with an X and half the corner torn off. The half you have points right down this trail.'),
  P('Toward the Campfire Light', 'campfire', 'lure', 'Someone out there is singing and the smell of beans and coffee drifts over. A warm fire and friendly company.'),
  P('The Hollow Log', 'tumbleweed', 'odd', 'Big enough to crawl through, and the other end opens onto a meadow you’re sure wasn’t there yesterday.'),
  P('The Cliffside Ledge', 'mesa', 'omen', 'A ledge two hooves wide with a sheer drop on one side. Halfway along, the rock is stained a worrying colour.'),
  P('The Old Fort', 'flag', 'odd', 'The flag has faded to pink and the gate stands open. Inside, the soldiers’ boots are all lined up. No soldiers.'),
  P('Follow the Fireflies', 'spark', 'lure', 'They blink in a pattern, leading you on like a string of little lanterns. It’s the most magical thing you’ve ever seen.'),
  P('The Sunken Wagon', 'wagon', 'odd', 'Half buried in the sand, its cargo still lashed down under a tarp. The tarp is moving.'),
  P('The Bandit’s Hideout', 'bandana', 'omen', 'Fresh hoof prints, a dropped bandana and a sign scrawled in red: VISITORS SHOT ON SIGHT. Survivors shot twice.'),
  P('The Rain Dance Circle', 'cloud', 'odd', 'Stones in a ring, worn smooth by dancing feet. When you step inside, the air goes cold and a single raindrop hits your beak.'),
  P('The Bee Tree', 'apple', 'lure', 'A low hum from inside the trunk, and honey running down the bark like a river of gold. Sweetest thing in the territory.'),
  P('The Stampede Gulch', 'bull', 'omen', 'The ground still trembles and the dust hasn’t settled. Whatever ran through here is still running, and might come back.'),
  P('The Scorpion Sands', 'scorpion', 'omen', 'The sand ripples and clicks under your hooves. Every footprint you leave fills in behind you, very quickly.'),
  P('The Undertaker’s Lane', 'skull', 'omen', 'He tips his hat, looks you up and down, and makes a note in a little book. He seems pleased with the measurements.'),
  P('The Silver Vein', 'nugget', 'lure', 'A glint in the rock face, then another, then a whole seam of silver as thick as your wing. All you need is a pick.'),
  P('The Whispering Pines', 'cactus', 'odd', 'They say your name, softly, and then something else in a language you almost understand.'),
  P('Past the Wrecked Train', 'train', 'odd', 'Cars on their sides like sleeping cattle. The mail car is intact, and there’s a light on inside.'),
  P('The Lantern-Lit Path', 'lantern', 'lure', 'Somebody has hung a lantern every twenty paces, all freshly lit. Such a thoughtful welcome for a weary traveller.'),
  P('The Broken Dam', 'bucket', 'omen', 'A dry lake bed full of fish bones, and a crack in the dam that’s still dripping. Dripping faster, now you look.'),
  P('The Cattle Rustler’s Trail', 'lasso', 'omen', 'A cut fence, drag marks and a lasso left behind. Rustlers don’t take kindly to witnesses.'),
  P('The Medicine Man’s Hut', 'tonic', 'lure', 'Herbs drying on a string and a kettle on the boil. The old crane inside says he can fix whatever ails you.'),
  P('The Sidewinder Switchbacks', 'snake', 'odd', 'The road doubles back on itself so many times you pass your own tracks twice. And someone else’s, following.'),
  P('The Lightning Tree', 'lightning', 'odd', 'Split down the middle and still smoking. Legend says a duck who sleeps beneath it wakes up changed.'),
  P('The Duck Pond', 'pond', 'lure', 'Lily pads, warm sunshine and the gentlest little pond you ever saw. A duck could stay here forever.'),
  P('The Bounty Board', 'wanted', 'lure', 'Faces you almost recognise, and rewards big enough to retire on. Some of them are worth a fortune dead or alive.'),
  P('The Flooded Mine', 'goldpan', 'omen', 'Water to the knees and rising, and the timbers groan overhead. The miners left their tools in a real hurry.'),
  P('The Wild Horse Valley', 'horse', 'lure', 'Mustangs graze on green grass beside a clear stream. A herd of the finest horses you’ve ever seen, free for the taking.'),
  P('The Train Robbers’ Rest', 'moneybag', 'lure', 'Empty sacks with the bank’s stamp, a dead campfire, and one sack that isn’t empty at all.'),
  P('Under the Big Sky', 'star', 'lure', 'More stars than you can count and a shooting star every minute. The kind of night that grants wishes.'),
  P('The Cursed Totem', 'eye', 'omen', 'Its carved eyes follow you, and the carvings on the base show ducks. Ducks that look a lot like you.'),
  P('The Pony Express Route', 'mailbox', 'odd', 'A mail sack, never delivered, and one letter with your name on it in handwriting you don’t recognise.'),
  P('The Rusty Bridge', 'anvil', 'omen', 'Bolts popping, one by one, as you watch. It held the last rider fine. That was in 1851.'),
  P('The Weeping Rock', 'rock', 'odd', 'Water seeps from a crack in the stone like tears. Folks say it cries for whoever drinks from it next.'),
  P('Past the Old Mill', 'windmill', 'odd', 'The millstone turns by itself, grinding nothing. Flour drifts out of the door in the shape of footprints.'),
  P('The Feather Trail', 'feather', 'odd', 'Feathers, one every few yards, the same colour as yours. The trail of them is getting thicker.'),
  P('The Dust Devil Plain', 'tornado', 'omen', 'Little twisters dance on the flats, then a big one, then a bigger one, heading your way.'),
  P('The Moonshiner’s Still', 'jug', 'lure', 'It smells strong enough to strip paint, and the moonshiner is in a generous mood. First jug free, friend.'),
  P('The Hermit’s Shack', 'tent', 'odd', 'A rocking chair rocks on the porch and a kettle whistles. A voice inside says, “Come in. I’ve been waiting forty years.”'),
  P('The Gold Rush Camp', 'goldpan', 'lure', 'Tents, shovels and nuggets left lying in the open. The whole camp seems to have struck it rich and run off.'),
  P('The Blind Canyon', 'mesa', 'omen', 'No way out but back the way you came. Or so they say. Nobody who went to check came back to tell.'),
  P('The Lucky Horseshoe Inn', 'horseshoe', 'lure', 'A horseshoe over the door, points up, a warm bed and a hot meal. Lucky by name, lucky by nature.'),
  P('The Deserted Schoolhouse', 'book', 'odd', 'Sums still chalked on the board, and one wrong answer circled in red. The answer is your name.'),
  P('The Tar Pits', 'bucket', 'omen', 'Bubbles rise and pop, slowly. A boot sticks out of the tar, still twitching now and then.'),
  P('The Echoing Cavern', 'lantern', 'odd', 'Your hello comes back wrong, in someone else’s voice, and then it says something you didn’t.'),
  P('The Last Chance Trail', 'map', 'omen', 'The sign just says LAST CHANCE. Below it someone has scratched: “don’t.”'),
  P('The Silver Spur Ranch', 'spur', 'lure', 'The gate is open, the porch is swept and there’s pie cooling on the windowsill. Folks here are mighty hospitable.'),
  P('The Hanging Valley', 'cloud', 'odd', 'Mist pours over the edge like water. Somewhere below, cattle are lowing, though no cattle could live down there.'),
  P('The Gunsmoke Alley', 'smoke', 'omen', 'Bullet holes in every wall and the smell of powder still hanging in the air. Somebody just finished something here.'),
  P('The Blood Moon Road', 'moon', 'omen', 'The moon is the wrong colour tonight and the coyotes have stopped howling. Even your horse doesn’t want to go.'),
  P('The Coffee Pot Rock', 'coffee', 'lure', 'Shaped just like one, and somebody has left a pot of real coffee boiling on top. Smells like heaven.'),
  P('The End of the Rainbow', 'clover', 'lure', 'It really does end right there, in a little hollow, and something gold is shining where it touches the ground.'),
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
boon({ id: 'quick_draw', name: 'Quick Draw', icon: 'revolver', text: 'Hands won with just two cards score {x:X1.5} Odds', hand: (c) => { if (c.cards.length === 2) c.xmult(1.5); } });
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
bane({ id: 'soft_spot', name: 'Soft Spot', icon: 'pie', text: 'Hands you win on a soft total score {x:X0.6} Odds', hand: (c) => { if (handTotal(c.cards, c.rules).soft) c.xmult(0.6); } });
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
instant({ id: 'water_damage', name: 'Water Damage', icon: 'bucket', good: false, text: 'Your three highest cards get soaked and each drop a rank', apply: (run) => {
  for (const k of [...run.deck].filter((x) => x.rank > 2).sort((a, b) => b.rank - a.rank).slice(0, 3)) k.rank = (k.rank - 1) as Card['rank'];
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

// --- The rare one ------------------------------------------------------------------------------
// Not hidden behind any path. Any good path might turn one of these up instead of what it held.

/** Chance a good path hands over the rare peek instead of what it would have. */
export const RARE_PEEK_CHANCE = 0.05;
export const PEEK_USES = 3;
export const RARE_PEEK: AbilityDef = {
  id: 'gamblers_glass', name: 'Gambler’s Glass', icon: 'eye', rarity: 3, cost: 0, hue: '#ffd23f',
  init: () => ({ uses: PEEK_USES }),
  text: (s) => `{g:Rare.} Peek at the dealer’s face-down card. {g:${st(s).uses ?? PEEK_USES}} use${(st(s).uses ?? PEEK_USES) === 1 ? '' : 's'} left, then it’s gone`,
};

/** Chance a good path hands over Lucky Rabbit's Foot instead. */
export const RARE_SAVE_CHANCE = 0.05;
export const RARE_SAVE: AbilityDef = {
  id: 'rabbits_foot', name: 'Lucky Rabbit’s Foot', icon: 'clover', rarity: 3, cost: 0, hue: '#ffd23f',
  init: () => ({ uses: 1 }),
  text: '{g:Rare.} When you bust, you may rub it to win the hand instead. One use, then it’s gone',
};

/** Super rare: a good path hands this over 2% of the time. */
export const SUPER_RARE_CHANCE = 0.02;
export const MONKEY_USES = 3;
export const SUPER_RARE: AbilityDef = {
  id: 'monkey_business', name: 'Monkey Business', icon: 'monkey', rarity: 4, cost: 0, hue: '#c86bff',
  init: () => ({ uses: MONKEY_USES }),
  text: (s) => `{g:Super rare.} Use it during your turn and the dealer plays like Woodgas: he keeps hitting until he busts, whatever his total. {g:${st(s).uses ?? MONKEY_USES}} use${(st(s).uses ?? MONKEY_USES) === 1 ? '' : 's'} left`,
};

for (const d of [RARE_PEEK, RARE_SAVE, SUPER_RARE]) {
  ABILITIES.push(d);
  ABILITY[d.id] = d;
}

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
