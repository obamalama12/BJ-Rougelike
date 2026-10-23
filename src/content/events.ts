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
    text: 'A pelican in a stovepipe hat is yelling from the back of a wagon. "Cures gout, grief, gambling losses and feather loss! Just six bucks!"',
    choices: [
      { label: 'Buy a bottle', detail: '50/50: +3 Grit and a Tonic, or it’s pond water (-1 Grit)', cost: 6,
        apply: (c) => {
          if (c.rng.next() < 0.5) { gainGrit(c, 3); c.createCons('fortune'); return 'You feel fantastic. Possibly too fantastic. +3 Grit, and he throws in a Tonic.'; }
          loseGrit(c, 1); return 'It’s pond water. With a frog in it. You lose 1 Grit.';
        } },
      { label: 'Heckle him', detail: 'Gain $4, the crowd loves you', apply: (c) => { c.money(4); return 'The crowd laughs and throws you a few coins. +$4.'; } },
      { label: 'Keep walking', detail: 'Nothing happens', apply: () => 'You keep your bucks and your gout.' },
    ],
  },
  {
    id: 'stagecoach',
    title: 'Stagecoach in a Ditch',
    icon: 'wagon',
    text: 'A stagecoach has lost a wheel. The driver, a frazzled pigeon, is guarding a strongbox with a broom.',
    choices: [
      { label: 'Lift the wheel', detail: '-2 Grit, gain $12 and an uncommon Doodad', can: room,
        apply: (c) => { loseGrit(c, 2); c.money(12); c.createCharm({ rarity: 2 }); return 'Your back hurts, but the grateful pigeon pays $12 and hands you something shiny.'; } },
      { label: 'Rob the strongbox', detail: 'Gain $25, but the next Outlaw is 25% tougher', apply: (c) => { c.money(25); c.run.flags.wantedPoster = true; return 'You ride off $25 richer. Somewhere, a wanted poster with your face goes up.'; } },
      { label: 'Ride on by', detail: 'Nothing happens', apply: () => 'Not your wheel, not your problem.' },
    ],
  },
  {
    id: 'lost_duckling',
    title: 'A Lost Duckling',
    character: 'duckling',
    icon: 'duckling',
    text: 'A tiny duckling is sitting on a cactus, crying. "I can’t find my mama," it peeps.',
    choices: [
      { label: 'Walk it home', detail: '-1 Grit now, +2 max Grit', apply: (c) => { loseGrit(c, 1); c.run.maxGrit += 2; return 'Its mama hugs you so hard you see stars. Your heart grows: +2 max Grit.'; } },
      { label: 'Share your bread', detail: 'Heal 3 Grit', apply: (c) => { gainGrit(c, 3); return 'You split a crust. You both feel better. +3 Grit.'; } },
      { label: 'Recruit it', detail: 'Gain the Duckling Gang Doodad', can: room, apply: (c) => { c.createCharm({ id: 'street_urchins', force: false }); return 'The duckling salutes. It has friends. Lots of friends.'; } },
    ],
  },
  {
    id: 'ghost_poker',
    title: 'The Ghost at Table Nine',
    character: 'ghost',
    icon: 'ghost',
    text: 'In an abandoned saloon, a translucent goose is shuffling cards. "One hand of high card," it moans. "Double or nothing."',
    choices: [
      { label: 'Play the ghost', detail: '50/50: double your Bucks (max +$30) or lose half', can: (run) => run.money > 0,
        apply: (c) => {
          const m = Math.max(0, c.run.money);
          if (c.rng.next() < 0.5) { const win = Math.min(30, m); c.money(win); return `Your King beats its 9. The ghost wails and fades. +$${win}.`; }
          const lose = Math.ceil(m / 2); c.money(-lose); return `It flips an Ace. It always flips an Ace. You lose $${lose}.`;
        } },
      { label: 'Leave a coin', detail: '-$2, gain a Moonshine', cost: 2, apply: (c) => { c.createCons('mask'); return 'The ghost bows. A dusty jug appears in your satchel.'; } },
      { label: 'Run', detail: 'Nothing happens', apply: () => 'You run. Ducks are not built for running. Still, you get away.' },
    ],
  },
  {
    id: 'gold_rush',
    title: 'Gold in the Creek!',
    icon: 'goldpan',
    text: 'Something glitters in a shallow creek. A dozen prospectors are already elbow-deep.',
    choices: [
      { label: 'Pan for gold', detail: 'Gain $5-$20. 1 in 4 chance of sunburn (-1 Grit)',
        apply: (c) => { const n = 5 + Math.floor(c.rng.next() * 16); c.money(n); if (c.rng.next() < 0.25) { loseGrit(c, 1); return `You find $${n} in nuggets, and a nasty sunburn. -1 Grit.`; } return `You find $${n} worth of nuggets!`; } },
      { label: 'Stake a claim', detail: 'Add 2 Gold Plated cards to your deck', apply: (c) => { c.addCard({ ink: 'gilded' }); c.addCard({ ink: 'gilded' }); return 'You hammer in a sign. Two Gold Plated cards join your deck.'; } },
    ],
  },
  {
    id: 'brawl',
    title: 'Saloon Brawl',
    icon: 'fist',
    text: 'A chair flies past your head. Two geese are fighting over the last pickled egg, and now everyone is involved.',
    choices: [
      { label: 'Jump in', detail: '-3 Grit, gain a rare Doodad', can: room, apply: (c) => { loseGrit(c, 3); c.createCharm({ rarity: 3 }); return 'You win the egg. You also win a black eye and a rare Doodad off a sore loser.'; } },
      { label: 'Duck under a table', detail: 'Gain $6 from coins on the floor', apply: (c) => { c.money(6); return 'Ducking is what you do best. You find $6 on the floor.'; } },
      { label: 'Sell popcorn', detail: 'Gain $3, +1 Grit', apply: (c) => { c.money(3); gainGrit(c, 1); return 'Best show in town. +$3 and a good laugh (+1 Grit).'; } },
    ],
  },
  {
    id: 'wishing_well',
    title: 'The Wishing Well',
    icon: 'bucket',
    text: 'An old stone well with a sign: "WISHES 5¢. NO REFUNDS. NO FROGS."',
    choices: [
      { label: 'Toss in $5', detail: 'A random wish comes true', cost: 5,
        apply: (c) => {
          const r = c.rng.next();
          if (r < 0.34) { const h = c.rng.pick(HAND_TYPES.filter((x) => x.id !== 'push')).id; c.levelUp(h, 2); return 'A voice echoes: "Granted." One of your hands levels up twice.'; }
          if (r < 0.67) { gainGrit(c, 4); return 'You feel a warm breeze. +4 Grit.'; }
          c.createCons('fortune'); c.createCons('star'); return 'A Tonic and a Tall Tale float up in a bucket.';
        } },
      { label: 'Drink from it', detail: 'Heal 2 Grit', apply: (c) => { gainGrit(c, 2); return 'Cool, clean water. Mostly. +2 Grit.'; } },
    ],
  },
  {
    id: 'fortune_teller',
    title: 'Madame Coot’s Crystal Ball',
    icon: 'crystal',
    text: 'A coot draped in scarves waves you into her tent. "I see... cards in your future. Many cards."',
    choices: [
      { label: 'A reading', detail: 'Gain 2 Tonics', cost: 4, apply: (c) => { c.createCons('fortune'); c.createCons('fortune'); return 'She hands you two bottles. "Drink these when the moon is... whenever, really."'; } },
      { label: 'The deep reading', detail: 'Gain a Moonshine and +1 level to your most played hand', cost: 9, apply: (c) => { c.createCons('mask'); c.levelUp(mostPlayed(c.run), 1); return 'Her eyes roll back. Yours do too. You come out wiser and holding a jug.'; } },
      { label: 'Politely decline', detail: 'Nothing happens', apply: () => '"I knew you would say that," she says.' },
    ],
  },
  {
    id: 'duel',
    title: 'High Noon',
    icon: 'revolver',
    character: 'jorogumo',
    text: 'A lanky roadrunner blocks the road. "This trail ain’t big enough for the two of us. Draw when the bell rings."',
    choices: [
      { label: 'Accept the duel', detail: 'Win: +$20 and +1 Grit. Lose: -3 Grit', apply: () => ({ text: 'You face each other. The tumbleweeds hold their breath...', duel: { stake: 3, reward: 20 } }) },
      { label: 'Pay him off', detail: 'Lose $5', can: (run) => run.money >= 5, apply: (c) => { c.money(-5); return 'He counts the bucks, sneers, and zooms off. Meep.'; } },
      { label: 'Back away slowly', detail: '-1 Grit (pride)', apply: (c) => { loseGrit(c, 1); return 'You back away. Your pride takes a hit. -1 Grit.'; } },
    ],
  },
  {
    id: 'medicine_show',
    title: 'Traveling Medicine Show',
    icon: 'balloon',
    text: 'A wagon covered in balloons and bunting. A juggling flamingo is selling mystery boxes.',
    choices: [
      { label: 'Buy a mystery box', detail: 'Gain a random Doodad', cost: 4, can: room, apply: (c) => { c.createCharm(); return 'You open the box. A Doodad pops out and winks at you.'; } },
      { label: 'Join the act', detail: 'Gain $8, -1 Grit', apply: (c) => { c.money(8); loseGrit(c, 1); return 'You get juggled. The crowd pays $8. You are dizzy (-1 Grit).'; } },
      { label: 'Watch the show', detail: 'Heal 1 Grit', apply: (c) => { gainGrit(c, 1); return 'A good show. +1 Grit.'; } },
    ],
  },
  {
    id: 'card_sharp',
    title: 'A Card Sharp’s Offer',
    icon: 'cards',
    character: 'shokera',
    text: 'A raven in a fancy vest shuffles one-handed. "I could teach you a trick or two. For a price."',
    choices: [
      { label: 'Learn a trick', detail: 'Level up Quackjack and Dead Eye', cost: 10, apply: (c) => { c.levelUp('blackjack', 1); c.levelUp('twentyone', 1); return 'You learn to deal seconds. Quackjack and Dead Eye level up.'; } },
      { label: 'Swipe his deck', detail: 'Add 3 random painted cards. -2 Grit', apply: (c) => {
        const inks = ['jade', 'crimson', 'gilded', 'glass', 'lucky', 'spirit', 'ash'] as const;
        for (let i = 0; i < 3; i++) c.addCard({ ink: c.rng.pick(inks) });
        loseGrit(c, 2); return 'You grab the deck and run. He pecks you on the way out. -2 Grit.'; } },
      { label: 'Not interested', detail: 'Nothing happens', apply: () => '"Your loss, featherbrain."' },
    ],
  },
  {
    id: 'dust_storm',
    title: 'Dust Storm',
    icon: 'tornado',
    text: 'The sky goes brown. A wall of dust is rolling across the desert straight at you.',
    choices: [
      { label: 'Shelter in a cave', detail: '+2 Grit, but lose a random consumable', apply: (c) => {
        gainGrit(c, 2);
        if (c.run.consumables.length) { c.run.consumables.splice(Math.floor(c.rng.next() * c.run.consumables.length), 1); return 'You wait it out. +2 Grit, but something in your satchel blew away.'; }
        return 'You wait it out in a cozy cave. +2 Grit.'; } },
      { label: 'Push through', detail: '-2 Grit, find $10 in the wreckage', apply: (c) => { loseGrit(c, 2); c.money(10); return 'You stagger through, find a lost wallet with $10, and cough for an hour. -2 Grit.'; } },
    ],
  },
  {
    id: 'prospector',
    title: 'An Old Prospector’s Tale',
    icon: 'campfire',
    text: 'A grizzled old mallard waves you over to his fire. "Did I ever tell you about the time I beat the Golden Goose?"',
    choices: [
      { label: 'Listen', detail: 'Level up your most played hand', apply: (c) => { const h = mostPlayed(c.run); c.levelUp(h, 1); return 'It’s a long story. Surprisingly useful though.'; } },
      { label: 'Share your bread', detail: 'Heal 3 Grit', apply: (c) => { gainGrit(c, 3); return 'He tears up. "Nobody shares bread anymore." +3 Grit.'; } },
      { label: 'Tell a taller tale', detail: 'Gain a Tall Tale', apply: (c) => { c.createCons('star'); return 'Your story about wrestling a tornado leaves him speechless. Gain a Tall Tale.'; } },
    ],
  },
  {
    id: 'pond',
    title: 'A Perfect Little Pond',
    icon: 'pond',
    text: 'Cool water, lily pads, total silence. A duck’s paradise.',
    choices: [
      { label: 'Take a swim', detail: 'Heal 5 Grit', apply: (c) => { gainGrit(c, 5); return 'You paddle in circles for an hour. Bliss. +5 Grit.'; } },
      { label: 'Go fishing', detail: 'Gain $8', apply: (c) => { c.money(8); return 'You catch a fish wearing a tiny wallet. +$8.'; } },
    ],
  },
  {
    id: 'golden_egg',
    title: 'The Cursed Golden Egg',
    icon: 'egg',
    text: 'On a pedestal in a ruined chapel sits a golden egg. A sign says "DO NOT TAKE THE EGG." in seven languages.',
    choices: [
      { label: 'Take the egg', detail: 'Gain $30, -2 max Grit', apply: (c) => { c.money(30); c.run.maxGrit = Math.max(3, c.run.maxGrit - 2); c.run.grit = Math.min(c.run.grit, c.run.maxGrit); return 'You take it. Somewhere, an organ plays a sad chord. +$30, -2 max Grit.'; } },
      { label: 'Leave the egg', detail: '+1 Grit for being sensible', apply: (c) => { gainGrit(c, 1); return 'You leave. The egg looks disappointed. +1 Grit.'; } },
    ],
  },
  {
    id: 'train_robbery',
    title: 'The 4:15 Express',
    icon: 'train',
    minTown: 2,
    text: 'A gang of masked geese is about to rob the 4:15. They’re one goose short.',
    choices: [
      { label: 'Join the gang', detail: 'Gain a rare Doodad. -4 Grit', can: room, apply: (c) => { c.createCharm({ rarity: 3 }); loseGrit(c, 4); return 'The heist goes sideways, then forwards. You escape with loot and a few bruises. -4 Grit.'; } },
      { label: 'Warn the conductor', detail: 'Gain $12 and a Telegram', apply: (c) => { c.money(12); c.addTag(c.rng.pick(['uncommon', 'coupon', 'd6', 'economy', 'charm_tag'])); return 'The conductor rewards you with $12 and a telegram of thanks.'; } },
      { label: 'Watch from a hill', detail: 'Gain $3 selling popcorn', apply: (c) => { c.money(3); return 'You sell popcorn to the other spectators. +$3.'; } },
    ],
  },
  {
    id: 'funhouse',
    title: 'Funhouse Mirror Tent',
    icon: 'mirror',
    text: 'Inside the tent, a hundred warped ducks stare back at you. One of them winks.',
    choices: [
      { label: 'Step into the mirror', detail: 'Two random cards in your deck get copied', apply: (c) => { for (let i = 0; i < 2; i++) { const k = c.rng.pick(c.run.deck); c.addCard({ ...k, id: undefined as unknown as number }); } return 'You step out with a few extra cards that weren’t there before.'; } },
      { label: 'Smash a mirror', detail: 'Gain $7, -1 Grit (bad luck)', apply: (c) => { c.money(7); loseGrit(c, 1); return 'Seven years of bad luck, seven bucks in coins behind the glass. -1 Grit.'; } },
    ],
  },
  {
    id: 'peddler',
    title: 'Peddler’s Swap',
    icon: 'wheelbarrow',
    text: 'A pack rat with a wheelbarrow full of junk squints at your Doodads. "I’ll trade ya. Somethin’ better. Probably."',
    choices: [
      { label: 'Trade a Doodad', detail: 'Swap a random Doodad for a random one of higher rarity', can: (run) => run.charms.some((k) => (CHARM[k.id]?.rarity ?? 1) < 3),
        apply: (c) => {
          const pool = c.run.charms.filter((k) => (CHARM[k.id]?.rarity ?? 1) < 3);
          const k = c.rng.pick(pool);
          const rar = Math.min(3, (CHARM[k.id]?.rarity ?? 1) + 1) as 2 | 3;
          c.run.charms = c.run.charms.filter((x) => x.uid !== k.uid);
          c.createCharm({ rarity: rar, force: true });
          return `He takes your ${CHARM[k.id]?.name ?? 'Doodad'} and hands over something fancier.`;
        } },
      { label: 'Sell him junk', detail: 'Gain $5', apply: (c) => { c.money(5); return 'He buys your old socks for $5. No questions asked.'; } },
    ],
  },
  {
    id: 'telegram',
    title: 'Telegram for You!',
    icon: 'telegram',
    text: 'A breathless messenger pigeon lands on your hat. It has a telegram addressed to "THE DUCK."',
    choices: [
      { label: 'Read it', detail: 'Gain a random Telegram', apply: (c) => { c.addTag(c.rng.pick(['uncommon', 'rare', 'foil', 'holo', 'investment', 'coupon', 'd6', 'economy', 'orbital', 'topup', 'charm_tag', 'oil'])); return 'STOP. GOOD NEWS. STOP. Your telegram has arrived.'; } },
      { label: 'Tip the pigeon', detail: '-$2, heal 2 Grit', cost: 2, apply: (c) => { gainGrit(c, 2); return 'The pigeon coos. You feel like a good person. +2 Grit.'; } },
    ],
  },
  {
    id: 'cattle_drive',
    title: 'The Great Cattle Drive',
    icon: 'bull',
    minTown: 2,
    character: 'otakemaru',
    text: 'A herd of very confused cows is thundering through the canyon. A cowpoke turkey is yelling for help.',
    choices: [
      { label: 'Help drive the herd', detail: '-2 Grit, gain $15', apply: (c) => { loseGrit(c, 2); c.money(15); return 'Yee-haw, sort of. $15 for a hard day’s work. -2 Grit.'; } },
      { label: 'Ride a cow', detail: '1 in 2: gain a rare Doodad, otherwise -3 Grit', can: room,
        apply: (c) => { if (c.rng.next() < 0.5) { c.createCharm({ rarity: 3 }); return 'You ride that cow like a legend. The turkey gives you a prize.'; } loseGrit(c, 3); return 'The cow has other plans. -3 Grit.'; } },
      { label: 'Stay out of it', detail: 'Nothing happens', apply: () => 'You climb a rock and wait. Moo.' },
    ],
  },
];

export const EVENT: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
