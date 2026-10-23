// Strange Happenings: the "?" stops on the trail.

import type { Ctx } from '../game/api';
import type { Run } from '../core/types';
import { HAND_TYPES } from '../core/cards';
import { charmSlotsFree, mostPlayed, CHARM } from './charms';

export interface EventChoice {
  label: string;
  detail: string;
  cost?: number;
  can?: (run: Run) => boolean;
  apply: (c: Ctx) => string | { text: string; duel?: { stake: number; reward: number } };
}

export interface EventDef {
  id: string;
  title: string;
  /** Portrait character id (see ui/portraits) or an icon name. */
  character?: string;
  icon: string;
  text: string;
  minTown?: number;
  choices: EventChoice[];
}

const gainGrit = (c: Ctx, n: number) => {
  c.run.grit = Math.min(c.run.maxGrit, c.run.grit + n);
};
const loseGrit = (c: Ctx, n: number) => {
  c.run.grit = Math.max(0, c.run.grit - n);
};
const room = (run: Run) => charmSlotsFree(run) > 0;

export const EVENTS: EventDef[] = [
  {
    id: 'snake_oil',
    title: 'Doc Feathersworth’s Miracle Elixir',
    character: 'banker',
    icon: 'tonic',
    text: 'A pelican in a stovepipe hat is selling bottles off the back of a wagon. The label says it cures gout.',
    choices: [
      { label: 'Buy a bottle', detail: 'Half the time: heal 3 Grit and gain a Tonic. Otherwise: -1 Grit', cost: 6,
        apply: (c) => {
          if (c.rng.next() < 0.5) { gainGrit(c, 3); c.createCons('fortune'); return 'It works, somehow. +3 Grit, and he throws in a Tonic.'; }
          loseGrit(c, 1); return 'It’s pond water with a frog in it. -1 Grit.';
        } },
      { label: 'Heckle him', detail: 'Gain $4', apply: (c) => { c.money(4); return 'The crowd laughs at him instead of buying. Someone tosses you $4.'; } },
      { label: 'Keep walking', detail: 'Nothing happens', apply: () => 'You keep your money and your gout.' },
    ],
  },
  {
    id: 'stagecoach',
    title: 'Stagecoach in a Ditch',
    icon: 'wagon',
    text: 'A stagecoach has lost a wheel. The driver, a pigeon, is guarding the strongbox with a broom.',
    choices: [
      { label: 'Lift the wheel', detail: 'Gain $12 and an uncommon Doodad. -2 Grit', can: room,
        apply: (c) => { loseGrit(c, 2); c.money(12); c.createCharm({ rarity: 2 }); return 'Your back hurts. The pigeon pays you $12 and an uncommon Doodad from the strongbox. -2 Grit.'; } },
      { label: 'Rob the strongbox', detail: 'Gain $25. The next Outlaw’s target is 25% higher', apply: (c) => { c.money(25); c.run.flags.wantedPoster = true; return 'You ride off $25 richer. By the next town, your face is on a poster.'; } },
      { label: 'Ride on by', detail: 'Nothing happens', apply: () => 'Not your wheel.' },
    ],
  },
  {
    id: 'lost_duckling',
    title: 'A Lost Duckling',
    character: 'duckling',
    icon: 'duckling',
    text: 'A duckling is sitting on a cactus, crying. It can’t find its mother.',
    choices: [
      { label: 'Walk it home', detail: '-1 Grit, +2 max Grit', apply: (c) => { loseGrit(c, 1); c.run.maxGrit += 2; return 'Its mother hugs you hard enough to hurt. -1 Grit, +2 max Grit.'; } },
      { label: 'Share your bread', detail: 'Heal 3 Grit', apply: (c) => { gainGrit(c, 3); return 'You split a crust with it. +3 Grit.'; } },
      { label: 'Recruit it', detail: 'Gain the Duckling Gang Doodad', can: room, apply: (c) => { c.createCharm({ id: 'street_urchins', force: false }); return 'The duckling salutes. Two of its cousins come out from behind the cactus.'; } },
    ],
  },
  {
    id: 'ghost_poker',
    title: 'The Ghost at Table Nine',
    character: 'ghost',
    icon: 'ghost',
    text: 'In an empty saloon, a see-through goose is shuffling cards. It wants one hand of high card, double or nothing.',
    choices: [
      { label: 'Play the ghost', detail: 'Half the time: double your Bucks (up to +$30). Otherwise: lose half your Bucks', can: (run) => run.money > 0,
        apply: (c) => {
          const m = Math.max(0, c.run.money);
          if (c.rng.next() < 0.5) { const win = Math.min(30, m); c.money(win); return `Your King beats its 9. The ghost fades out. +$${win}.`; }
          const lose = Math.ceil(m / 2); c.money(-lose); return `It turns over an Ace. It always turns over an Ace. You lose $${lose}.`;
        } },
      { label: 'Leave a coin', detail: 'Gain a Moonshine', cost: 2, apply: (c) => { c.createCons('mask'); return 'The ghost nods. There’s a dusty jug in your saddlebag that wasn’t there before.'; } },
      { label: 'Run', detail: 'Nothing happens', apply: () => 'Ducks are bad at running, but the ghost doesn’t follow.' },
    ],
  },
  {
    id: 'gold_rush',
    title: 'Gold in the Creek',
    icon: 'goldpan',
    text: 'Something glitters in a shallow creek. A dozen prospectors are already elbow-deep.',
    choices: [
      { label: 'Pan for gold', detail: 'Gain $5 to $20. 1 in 4 chance of sunburn: -1 Grit',
        apply: (c) => { const n = 5 + Math.floor(c.rng.next() * 16); c.money(n); if (c.rng.next() < 0.25) { loseGrit(c, 1); return `You find $${n} in nuggets and get a sunburn. -1 Grit.`; } return `You find $${n} in nuggets.`; } },
      { label: 'Stake a claim', detail: 'Add 2 Gold Plated cards to your deck', apply: (c) => { c.addCard({ ink: 'gilded' }); c.addCard({ ink: 'gilded' }); return 'You hammer in a claim sign. 2 Gold Plated cards join your deck.'; } },
    ],
  },
  {
    id: 'brawl',
    title: 'Saloon Brawl',
    icon: 'fist',
    text: 'A chair flies past your head. Two geese are fighting over the last pickled egg, and now everyone is involved.',
    choices: [
      { label: 'Jump in', detail: 'Gain a rare Doodad. -3 Grit', can: room, apply: (c) => { loseGrit(c, 3); c.createCharm({ rarity: 3 }); return 'You win the egg, a black eye, and a rare Doodad off the loser. -3 Grit.'; } },
      { label: 'Duck under a table', detail: 'Gain $6', apply: (c) => { c.money(6); return 'You find $6 on the floor under there.'; } },
      { label: 'Take bets', detail: 'Gain $3 and heal 1 Grit', apply: (c) => { c.money(3); gainGrit(c, 1); return 'You take bets on the fight. The bigger goose wins. +$3, +1 Grit.'; } },
    ],
  },
  {
    id: 'wishing_well',
    title: 'The Wishing Well',
    icon: 'bucket',
    text: 'An old stone well with a hand-lettered sign: "WISHES $5. NO REFUNDS."',
    choices: [
      { label: 'Toss in $5', detail: 'One at random: a random hand type gains 2 levels, heal 4 Grit, or gain a Tonic and a Tall Tale', cost: 5,
        apply: (c) => {
          const r = c.rng.next();
          if (r < 0.34) { const h = c.rng.pick(HAND_TYPES.filter((x) => x.id !== 'push')); c.levelUp(h.id, 2); return `Something down the well says "Granted." ${h.name} gains 2 levels.`; }
          if (r < 0.67) { gainGrit(c, 4); return 'A warm breeze comes up out of the well. +4 Grit.'; }
          c.createCons('fortune'); c.createCons('star'); return 'The bucket comes up with a Tonic and a Tall Tale in it.';
        } },
      { label: 'Drink from it', detail: 'Heal 2 Grit', apply: (c) => { gainGrit(c, 2); return 'Cold, clean water. +2 Grit.'; } },
    ],
  },
  {
    id: 'fortune_teller',
    title: 'Madame Coot’s Crystal Ball',
    icon: 'crystal',
    text: 'A coot in a tent full of scarves offers to read your future in the cards.',
    choices: [
      { label: 'A reading', detail: 'Gain 2 Tonics', cost: 4, apply: (c) => { c.createCons('fortune'); c.createCons('fortune'); return 'She hands you two bottles and says to drink them when the time is right. She doesn’t say when.'; } },
      { label: 'The deep reading', detail: 'Gain a Moonshine. Your most played hand type gains 1 level', cost: 9, apply: (c) => { c.createCons('mask'); c.levelUp(mostPlayed(c.run), 1); return 'She stares into the ball for a full minute. You leave with a jug of Moonshine, and your most played hand gains a level.'; } },
      { label: 'Politely decline', detail: 'Nothing happens', apply: () => '"I knew you would say that," she says.' },
    ],
  },
  {
    id: 'duel',
    title: 'A Duel in the Road',
    icon: 'revolver',
    character: 'jorogumo',
    text: 'A roadrunner steps into the road and taps his holster. "Draw when the bell rings."',
    choices: [
      { label: 'Accept the duel', detail: 'Win: gain $20 and heal 1 Grit. Lose: -3 Grit', apply: () => ({ text: 'You face each other and wait for the bell.', duel: { stake: 3, reward: 20 } }) },
      { label: 'Pay him off', detail: 'Lose $5', can: (run) => run.money >= 5, apply: (c) => { c.money(-5); return 'He counts it twice and runs off.'; } },
      { label: 'Back away slowly', detail: '-1 Grit', apply: (c) => { loseGrit(c, 1); return 'You back away. He laughs the whole time. -1 Grit.'; } },
    ],
  },
  {
    id: 'medicine_show',
    title: 'Traveling Medicine Show',
    icon: 'balloon',
    text: 'A wagon hung with bunting. A flamingo is juggling and selling mystery boxes.',
    choices: [
      { label: 'Buy a mystery box', detail: 'Gain a random Doodad', cost: 4, can: room, apply: (c) => { c.createCharm(); return 'There’s a Doodad in the box, packed in straw.'; } },
      { label: 'Join the act', detail: 'Gain $8. -1 Grit', apply: (c) => { c.money(8); loseGrit(c, 1); return 'The flamingo juggles you. The crowd pays $8. You’re dizzy for an hour. -1 Grit.'; } },
      { label: 'Watch the show', detail: 'Heal 1 Grit', apply: (c) => { gainGrit(c, 1); return 'You sit at the back and eat peanuts. +1 Grit.'; } },
    ],
  },
  {
    id: 'card_sharp',
    title: 'A Card Sharp’s Offer',
    icon: 'cards',
    character: 'shokera',
    text: 'A raven in a fancy vest shuffles one-handed. He offers lessons, for a price.',
    choices: [
      { label: 'Learn a trick', detail: 'Quackjack and Dead Eye each gain 1 level', cost: 10, apply: (c) => { c.levelUp('blackjack', 1); c.levelUp('twentyone', 1); return 'He teaches you to deal seconds. Quackjack and Dead Eye gain a level.'; } },
      { label: 'Swipe his deck', detail: 'Add 3 cards with random inks to your deck. -2 Grit', apply: (c) => {
        const inks = ['jade', 'crimson', 'gilded', 'glass', 'lucky', 'spirit', 'ash'] as const;
        for (let i = 0; i < 3; i++) c.addCard({ ink: c.rng.pick(inks) });
        loseGrit(c, 2); return 'You grab the deck and run. He pecks you twice on the way out. -2 Grit.'; } },
      { label: 'Not interested', detail: 'Nothing happens', apply: () => '"Suit yourself."' },
    ],
  },
  {
    id: 'dust_storm',
    title: 'Dust Storm',
    icon: 'tornado',
    text: 'The sky turns brown. A wall of dust is rolling across the flats toward you.',
    choices: [
      { label: 'Shelter in a cave', detail: 'Heal 2 Grit. Lose a random consumable, if you have one', apply: (c) => {
        gainGrit(c, 2);
        if (c.run.consumables.length) { c.run.consumables.splice(Math.floor(c.rng.next() * c.run.consumables.length), 1); return 'You wait it out. +2 Grit, but something blew out of your saddlebag.'; }
        return 'You wait it out in a cave. +2 Grit.'; } },
      { label: 'Push through', detail: 'Gain $10. -2 Grit', apply: (c) => { loseGrit(c, 2); c.money(10); return 'You find a lost wallet with $10 in it, and cough for an hour. -2 Grit.'; } },
    ],
  },
  {
    id: 'prospector',
    title: 'An Old Prospector’s Tale',
    icon: 'campfire',
    text: 'An old mallard waves you over to his fire. He says he once beat the Golden Goose.',
    choices: [
      { label: 'Listen', detail: 'Your most played hand type gains 1 level', apply: (c) => { const h = mostPlayed(c.run); c.levelUp(h, 1); return 'It takes an hour. The part about when to stand is useful.'; } },
      { label: 'Share your bread', detail: 'Heal 3 Grit', apply: (c) => { gainGrit(c, 3); return 'He says nobody has shared bread with him in years. +3 Grit.'; } },
      { label: 'Tell a taller tale', detail: 'Gain a Tall Tale', apply: (c) => { c.createCons('star'); return 'You tell him about the time you wrestled a tornado. He doesn’t believe you, but he writes it down. Gain a Tall Tale.'; } },
    ],
  },
  {
    id: 'pond',
    title: 'A Quiet Pond',
    icon: 'pond',
    text: 'Cool water, lily pads, and nobody around.',
    choices: [
      { label: 'Take a swim', detail: 'Heal 5 Grit', apply: (c) => { gainGrit(c, 5); return 'You paddle in circles for an hour. +5 Grit.'; } },
      { label: 'Go fishing', detail: 'Gain $8', apply: (c) => { c.money(8); return 'You catch a fish with a wallet in its mouth. +$8.'; } },
    ],
  },
  {
    id: 'golden_egg',
    title: 'The Cursed Golden Egg',
    icon: 'egg',
    text: 'A golden egg sits on the altar of a ruined chapel. The sign under it says "DO NOT TAKE THE EGG."',
    choices: [
      { label: 'Take the egg', detail: 'Gain $30. -2 max Grit', apply: (c) => { c.money(30); c.run.maxGrit = Math.max(3, c.run.maxGrit - 2); c.run.grit = Math.min(c.run.grit, c.run.maxGrit); return 'You take it. Your feathers go cold. +$30, -2 max Grit.'; } },
      { label: 'Leave the egg', detail: 'Heal 1 Grit', apply: (c) => { gainGrit(c, 1); return 'You leave it where it is. +1 Grit.'; } },
    ],
  },
  {
    id: 'train_robbery',
    title: 'The 4:15 Express',
    icon: 'train',
    minTown: 2,
    text: 'A gang of geese in bandanas is about to rob the 4:15. They’re one goose short.',
    choices: [
      { label: 'Join the gang', detail: 'Gain a rare Doodad. -4 Grit', can: room, apply: (c) => { c.createCharm({ rarity: 3 }); loseGrit(c, 4); return 'The robbery goes badly, but you get away with a rare Doodad. -4 Grit.'; } },
      { label: 'Warn the conductor', detail: 'Gain $12 and a Telegram', apply: (c) => { c.money(12); c.addTag(c.rng.pick(['uncommon', 'coupon', 'd6', 'economy', 'charm_tag'])); return 'The conductor pays you $12 and wires a Telegram ahead.'; } },
      { label: 'Watch from a hill', detail: 'Gain $3', apply: (c) => { c.money(3); return 'You sell popcorn to the other folks on the hill. +$3.'; } },
    ],
  },
  {
    id: 'funhouse',
    title: 'Funhouse Mirror Tent',
    icon: 'mirror',
    text: 'Inside the tent, a hundred bent copies of you stare back. One of them is holding cards.',
    choices: [
      { label: 'Step into the mirror', detail: 'Copy 2 random cards in your deck', apply: (c) => { for (let i = 0; i < 2; i++) { const k = c.rng.pick(c.run.deck); c.addCard({ ...k, id: undefined as unknown as number }); } return 'You step out holding two cards that weren’t in your deck before.'; } },
      { label: 'Smash a mirror', detail: 'Gain $7. -1 Grit', apply: (c) => { c.money(7); loseGrit(c, 1); return 'There’s $7 in coins behind the glass. You cut your wing getting it. -1 Grit.'; } },
    ],
  },
  {
    id: 'peddler',
    title: 'Peddler’s Swap',
    icon: 'wheelbarrow',
    text: 'A pack rat with a wheelbarrow full of junk wants to trade for one of your Doodads.',
    choices: [
      { label: 'Trade a Doodad', detail: 'Swap a random common or uncommon Doodad for a random Doodad one rarity higher', can: (run) => run.charms.some((k) => (CHARM[k.id]?.rarity ?? 1) < 3),
        apply: (c) => {
          const pool = c.run.charms.filter((k) => (CHARM[k.id]?.rarity ?? 1) < 3);
          const k = c.rng.pick(pool);
          const rar = Math.min(3, (CHARM[k.id]?.rarity ?? 1) + 1) as 2 | 3;
          c.run.charms = c.run.charms.filter((x) => x.uid !== k.uid);
          c.createCharm({ rarity: rar, force: true });
          return `He takes your ${CHARM[k.id]?.name ?? 'Doodad'} and hands over something rarer.`;
        } },
      { label: 'Sell him junk', detail: 'Gain $5', apply: (c) => { c.money(5); return 'He buys your old socks for $5.'; } },
    ],
  },
  {
    id: 'telegram',
    title: 'Telegram for You',
    icon: 'telegram',
    text: 'A messenger pigeon lands on your hat with a Telegram addressed to "THE DUCK."',
    choices: [
      { label: 'Read it', detail: 'Gain a random Telegram', apply: (c) => { c.addTag(c.rng.pick(['uncommon', 'rare', 'foil', 'holo', 'investment', 'coupon', 'd6', 'economy', 'orbital', 'topup', 'charm_tag', 'oil'])); return 'GOOD NEWS STOP REWARD ENCLOSED STOP'; } },
      { label: 'Tip the pigeon', detail: 'Heal 2 Grit', cost: 2, apply: (c) => { gainGrit(c, 2); return 'The pigeon coos and flies off. +2 Grit.'; } },
    ],
  },
  {
    id: 'cattle_drive',
    title: 'The Cattle Drive',
    icon: 'bull',
    minTown: 2,
    character: 'otakemaru',
    text: 'A herd of cows is stampeding through the canyon. A turkey on horseback is yelling for help.',
    choices: [
      { label: 'Help drive the herd', detail: 'Gain $15. -2 Grit', apply: (c) => { loseGrit(c, 2); c.money(15); return '$15 for a day of eating dust. -2 Grit.'; } },
      { label: 'Ride a cow', detail: 'Half the time: gain a rare Doodad. Otherwise: -3 Grit', can: room,
        apply: (c) => { if (c.rng.next() < 0.5) { c.createCharm({ rarity: 3 }); return 'You stay on the cow. The turkey gives you a rare Doodad for it.'; } loseGrit(c, 3); return 'The cow throws you into a fence. -3 Grit.'; } },
      { label: 'Stay out of it', detail: 'Nothing happens', apply: () => 'You climb a rock and wait for the cows to pass.' },
    ],
  },
  {
    id: 'blacksmith',
    title: 'The Blacksmith’s Forge',
    icon: 'anvil',
    text: 'A heron in a leather apron is hammering horseshoes. He says he can work on cards too, if they’re not too soft.',
    choices: [
      { label: 'Gold-plate a card', detail: 'A random card in your deck becomes {g:Gold Plated}', cost: 6, apply: (c) => { const k = randomCard(c); k.ink = 'gilded'; return `He dips your ${cardName(k)} in something hot. It comes out gold.`; } },
      { label: 'Melt down two cards', detail: 'Destroy 2 random cards in your deck. Gain $6', can: (run) => run.deck.length > 20, apply: (c) => { const a = randomCard(c); c.destroyCard(a.id); const b = randomCard(c); c.destroyCard(b.id); c.money(6); return `Your ${cardName(a)} and ${cardName(b)} go into the coals. He pays $6 for the metal.`; } },
      { label: 'Shoe your horse', detail: 'Heal 2 Grit', cost: 2, apply: (c) => { gainGrit(c, 2); return 'Four new shoes. The horse seems happier than you. +2 Grit.'; } },
    ],
  },
  {
    id: 'cardmaker',
    title: 'The Card Printer',
    icon: 'stamp',
    character: 'shopkeeper',
    text: 'In the back of the newspaper office, a duck is printing playing cards on the same press as the Gazette.',
    choices: [
      { label: 'Order a fresh Ace', detail: 'Add a {g:Red Hot} Ace to your deck', cost: 5, apply: (c) => { const k = c.addCard({ rank: 14, suit: c.rng.pick(SUITS), ink: 'crimson' }); return `Still warm from the press: a ${cardName(k)}.`; } },
      { label: 'Order three tens', detail: 'Add three 10s to your deck', cost: 4, apply: (c) => { for (let i = 0; i < 3; i++) c.addCard({ rank: 10, suit: c.rng.pick(SUITS) }); return 'Three crisp tens. They smell like ink and the weather report.'; } },
      { label: 'Ask for a misprint', detail: 'Add a random {g:Wild} card to your deck', apply: (c) => { const k = c.addCard({ rank: c.rng.pick(RANKS), suit: c.rng.pick(SUITS), ink: 'spirit' }); return `He hands you a smudged ${cardName(k)}. It counts as every suit.`; } },
    ],
  },
  {
    id: 'poker_night',
    title: 'Poker Night at the Livery',
    icon: 'cards',
    character: 'kitsunebi',
    text: 'A penguin in a waistcoat is running a game behind the stables. He hasn’t changed expression in an hour.',
    choices: [
      { label: 'Bet $10', detail: 'Half the time: win $25. Otherwise: lose it', cost: 10, apply: (c) => { if (c.rng.next() < 0.5) { c.money(25); return 'Your two pair holds up. He nods once and pays $25.'; } return 'He shows four of a kind without blinking. Your $10 is his.'; } },
      { label: 'Study his tells', detail: 'Level up {h:outdraw}', apply: (c) => { c.levelUp('outdraw', 1); return 'He has no tells. You learn something anyway. Quick Draw levels up.'; } },
      { label: 'Walk on by', detail: 'Nothing happens', apply: () => 'You leave him to it.' },
    ],
  },
  {
    id: 'wanted_board',
    title: 'The Wanted Board',
    icon: 'wanted',
    character: 'hinoenma',
    text: 'The sheriff, an owl with a tin star, is pinning up posters outside the jail. One of them has your face on it, slightly wrong.',
    choices: [
      { label: 'Tear your poster down', detail: 'Heal 2 Grit. The Outlaw’s target this town goes up 10%', apply: (c) => { gainGrit(c, 2); c.run.flags.outlawTries = (c.run.flags.outlawTries ?? 0) - 0.6; /* 0.85^-0.6 is about 1.1 */ return 'You feel better. The sheriff saw you do it. +2 Grit.'; } },
      { label: 'Claim a small bounty', detail: 'Gain $10', apply: (c) => { c.money(10); return 'You turn in a pickpocket pigeon. +$10.'; } },
      { label: 'Correct the drawing', detail: 'Gain a Telegram', apply: (c) => { c.addTag(c.rng.pick(['uncommon', 'coupon', 'economy', 'charm_tag', 'fortune_pack'])); return 'The sheriff likes your edits and wires a Telegram on your behalf.'; } },
    ],
  },
  {
    id: 'rattlesnake',
    title: 'Snake in the Boot',
    icon: 'snake',
    text: 'Something is rattling in your left boot. You’re fairly sure it isn’t your foot.',
    choices: [
      { label: 'Shake it out', detail: '-1 Grit', apply: (c) => { loseGrit(c, 1); return 'It bites on the way out. -1 Grit.'; } },
      { label: 'Sell it to the Doc', detail: 'Two times in three: gain $9. Otherwise: -3 Grit', apply: (c) => { if (c.rng.next() < 0.67) { c.money(9); return 'Doc Hoot pays $9 for the venom.'; } loseGrit(c, 3); return 'It gets you twice before you reach the Doc. -3 Grit.'; } },
      { label: 'Keep the boot on', detail: 'Lose a random card. Heal 1 Grit', apply: (c) => { const k = randomCard(c); c.destroyCard(k.id); gainGrit(c, 1); return `The snake eats your ${cardName(k)} and falls asleep. Oddly calming. +1 Grit.`; } },
    ],
  },
  {
    id: 'bank_teller',
    title: 'Bank of Golden Egg City',
    icon: 'piggybank',
    character: 'banker',
    minTown: 2,
    text: 'A branch office the size of an outhouse. The pelican behind the window offers an account with "very competitive" interest.',
    choices: [
      { label: 'Deposit everything', detail: 'Lose all your Bucks now. Get back 1.5 times as much after the next table', can: (run) => run.money >= 6, apply: (c) => { const m = c.run.money; c.money(-m); c.run.flags.bankDeposit = (c.run.flags.bankDeposit ?? 0) + Math.floor(m * 1.5); return `He takes your $${m} and writes you a receipt for $${Math.floor(m * 1.5)}, payable after your next table.`; } },
      { label: 'Take out a loan', detail: 'Gain $15. -2 max Grit', apply: (c) => { c.money(15); c.run.maxGrit = Math.max(3, c.run.maxGrit - 2); c.run.grit = Math.min(c.run.grit, c.run.maxGrit); return 'Fifteen dollars and a payment schedule you don’t read. -2 max Grit.'; } },
      { label: 'Just use the shade', detail: 'Heal 1 Grit', apply: (c) => { gainGrit(c, 1); return 'You stand under the awning until he asks you to leave. +1 Grit.'; } },
    ],
  },
  {
    id: 'hermit',
    title: 'The Hermit of Buzzard Peak',
    icon: 'tent',
    character: 'enenra',
    minTown: 2,
    text: 'A vulture lives in a cave halfway up the mesa. He says he used to deal cards in Tombstone Pond.',
    choices: [
      { label: 'Ask for his secret', detail: 'Your most played hand type levels up twice. -2 Grit', apply: (c) => { const ht = mostPlayed(c.run); c.levelUp(ht, 2); loseGrit(c, 2); return `The climb nearly kills you. His secret is about ${HAND_TYPES.find((h) => h.id === ht)?.name}. It’s a good one.`; } },
      { label: 'Trade him a Doodad', detail: 'Lose a random Doodad. Gain a Doodad one rarity higher', can: (run) => run.charms.length > 0, apply: (c) => { const k = c.rng.pick(c.run.charms); const r = Math.min(4, (CHARM[k.id]?.rarity ?? 1) + 1) as 1 | 2 | 3 | 4; c.destroyCharm(k.uid); c.createCharm({ rarity: r, force: true }); return `He takes your ${CHARM[k.id]?.name} and gives you something from the back of the cave.`; } },
      { label: 'Leave him be', detail: 'Nothing happens', apply: () => 'He waves a bone at you as you go.' },
    ],
  },
  {
    id: 'rain_dance',
    title: 'First Rain in a Year',
    icon: 'cloud',
    text: 'The sky opens. Every duck in town runs outside and stands in it with their mouth open.',
    choices: [
      { label: 'Join in', detail: 'Heal 3 Grit', apply: (c) => { gainGrit(c, 3); return 'You stand in the rain for twenty minutes. +3 Grit.'; } },
      { label: 'Sell umbrellas', detail: 'Gain $1 for each card left in your deck over 40 (at least $4)', apply: (c) => { const n = Math.max(4, c.run.deck.length - 40); c.money(n); return `Nobody wants an umbrella. A goose buys all of them anyway. +$${n}.`; } },
    ],
  },
  {
    id: 'tumbleweed_derby',
    title: 'Tumbleweed Derby',
    icon: 'tumbleweed',
    text: 'The whole town has bet on which tumbleweed reaches the saloon first. A chicken is taking bets on a chalkboard.',
    choices: [
      { label: 'Bet on the big one', detail: 'One time in three: gain $15', cost: 4, apply: (c) => { if (c.rng.next() < 0.34) { c.money(15); return 'The big one wins by a twig. +$15.'; } return 'The big one gets stuck on a cactus.'; } },
      { label: 'Bet on the small one', detail: 'One time in eight: gain $40', cost: 4, apply: (c) => { if (c.rng.next() < 0.125) { c.money(40); return 'The small one rolls under the saloon doors first. The chicken faints. +$40.'; } return 'The small one blows the wrong way entirely.'; } },
      { label: 'Just watch', detail: 'Nothing happens', apply: () => 'It takes forty minutes. Nobody is sure who won.' },
    ],
  },
  {
    id: 'saloon_piano',
    title: 'The Saloon Piano',
    icon: 'piano',
    character: 'dealer_lola',
    text: 'The piano player quit this morning. The swan who runs the place looks at you.',
    choices: [
      { label: 'Play a ballad', detail: 'Level up {h:push} and {h:underdog}', apply: (c) => { c.levelUp('push', 1); c.levelUp('underdog', 1); return 'Slow and sad. Two cowboys cry into their beer. Standoff and Underduck level up.'; } },
      { label: 'Play something fast', detail: 'Gain $7', apply: (c) => { c.money(7); return 'Somebody starts a dance. Somebody else starts a fight. You get $7 in tips.'; } },
      { label: 'Say you can’t play', detail: 'Heal 1 Grit', apply: (c) => { gainGrit(c, 1); return 'She gives you a free sarsaparilla for your honesty. +1 Grit.'; } },
    ],
  },
  {
    id: 'lost_mine',
    title: 'The Lost Mine',
    icon: 'pickaxe',
    minTown: 3,
    text: 'A boarded-up mine shaft with a hand-painted sign: "GOLD (PROBABLY)". The boards are already pried loose.',
    choices: [
      { label: 'Go in deep', detail: 'Gain $25 and a Gold Plated card. -4 Grit', apply: (c) => { c.money(25); c.addCard({ rank: c.rng.pick(RANKS), suit: c.rng.pick(SUITS), ink: 'gilded' }); loseGrit(c, 4); return 'There was gold. There was also a cave-in. +$25 and a gold card. -4 Grit.'; } },
      { label: 'Poke around the entrance', detail: 'Gain $8', apply: (c) => { c.money(8); return 'You find a few nuggets the last fellow dropped. +$8.'; } },
      { label: 'Read the rest of the sign', detail: 'Nothing happens', apply: () => 'The back says "ALSO BEARS". You leave.' },
    ],
  },
  {
    id: 'traveling_judge',
    title: 'Circuit Court',
    icon: 'book',
    character: 'ittan',
    minTown: 2,
    text: 'A heron in a powdered wig is holding court in the general store. He says you’re next.',
    choices: [
      { label: 'Plead guilty', detail: 'Pay $8. Heal 3 Grit', cost: 8, apply: (c) => { gainGrit(c, 3); return 'He fines you $8 and lets you go. The relief is enormous. +3 Grit.'; } },
      { label: 'Plead not guilty', detail: 'Half the time: gain $12. Otherwise: -3 Grit', apply: (c) => { if (c.rng.next() < 0.5) { c.money(12); return 'Acquitted, with costs paid to you. +$12.'; } loseGrit(c, 3); return 'He finds you guilty of "general shiftiness". -3 Grit.'; } },
      { label: 'Bribe the bailiff', detail: 'Gain a Tall Tale', cost: 5, apply: (c) => { c.createCons('star'); return 'The bailiff hands you a story he says the judge doesn’t want told.'; } },
    ],
  },
  {
    id: 'stray_dog',
    title: 'A Stray Coyote Pup',
    icon: 'coyote',
    text: 'A coyote pup has been following you for a mile. It’s carrying something in its mouth.',
    choices: [
      { label: 'Feed it', detail: 'Pay $3. Gain a random Tonic', cost: 3, apply: (c) => { c.createCons('fortune'); return 'It drops what it was carrying at your feet. A Tonic, slightly chewed.'; } },
      { label: 'Take what it’s carrying', detail: 'Gain $5. -1 Grit', apply: (c) => { c.money(5); loseGrit(c, 1); return 'Five dollars and a bite on the wing. -1 Grit.'; } },
      { label: 'Shoo it away', detail: 'Nothing happens', apply: () => 'It follows you for another mile, then gives up.' },
    ],
  },
  {
    id: 'telegraph_office',
    title: 'The Telegraph Office',
    icon: 'telegram',
    character: 'aosagibi',
    text: 'A magpie runs the telegraph. She reads every message out loud as she taps it.',
    choices: [
      { label: 'Send for supplies', detail: 'Gain 2 Telegrams', cost: 6, apply: (c) => { for (let i = 0; i < 2; i++) c.addTag(c.rng.pick(['uncommon', 'coupon', 'economy', 'charm_tag', 'fortune_pack', 'star_pack'])); return 'She reads your order out loud to the whole room. Two Telegrams are on the way.'; } },
      { label: 'Read the wire aloud for her', detail: 'Gain $3', apply: (c) => { c.money(3); return 'Her voice is gone. She pays you $3 to read the rest.'; } },
    ],
  },
];

const SUITS = ['moon', 'flame', 'leaf', 'bell'] as const;
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;
const SUIT_NAME: Record<string, string> = { moon: 'Horseshoes', flame: 'Dynamite', leaf: 'Cacti', bell: 'Stars' };
const RANK_NAME: Record<number, string> = { 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace' };
function randomCard(c: Ctx) {
  return c.rng.pick(c.run.deck);
}
function cardName(k: { rank: number; suit: string }) {
  return `${RANK_NAME[k.rank] ?? k.rank} of ${SUIT_NAME[k.suit] ?? k.suit}`;
}

export const EVENT: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
