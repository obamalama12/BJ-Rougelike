// Who sits behind the table, what they look like, and what they say.

import type { Expression } from './portraits';
import { CHARACTERS, portrait } from './portraits';
import type { TableState } from '../core/types';

export function dealerId(t: Pick<TableState, 'kind' | 'hostId'>): string {
  if (t.kind === 'host' && t.hostId) return CHARACTERS[t.hostId] ? t.hostId : 'dealer_bart';
  if (t.kind === 'gang' && t.hostId) return CHARACTERS[t.hostId] ? t.hostId : 'dealer_bart';
  if (t.kind === 'bank') return 'banker';
  if (t.kind === 'silk') return 'dealer_lola';
  return 'dealer_bart';
}

/** Portrait preset standing in for 'player' (set from the current run's gunslinger). */
let heroPortrait = 'hero_kid';
export function setHeroPortrait(id: string) {
  heroPortrait = CHARACTERS[id] ? id : 'hero_kid';
}

export function portraitOf(id: string, expression: Expression = 'neutral'): string {
  if (id === 'player') id = heroPortrait;
  const c = CHARACTERS[id] ?? CHARACTERS.dealer_bart;
  return portrait({ ...c, expression });
}

export function nameOf(id: string): string {
  if (id === 'player') id = heroPortrait;
  return CHARACTERS[id]?.name ?? 'Stranger';
}

export type Mood = 'greet' | 'deal' | 'playerBust' | 'playerBlackjack' | 'playerWin' | 'playerLose' | 'dealerBust' | 'push' | 'bigScore' | 'tableWon' | 'tableLost' | 'fold' | 'wager';

const LINES: Record<Mood, string[]> = {
  greet: ['Ante up.', 'Sit. Wings on the table where I can see them.', 'Another one off the stagecoach.', 'Deck’s fresh. Coffee’s from Tuesday.', 'Minimum bet’s a penny. Maximum’s whatever you brought.'],
  deal: ['Here we go.', 'Two each.', 'Cards coming.', 'Let’s see it.', 'Don’t blink.'],
  playerBust: ['Too greedy.', 'Bust.', 'Should’ve stopped one card back.', 'I’ll take those.', 'That one stung.'],
  playerBlackjack: ['A natural. Huh.', 'Well, I’ll be plucked.', 'Beginner’s luck.', 'Fine. Nice hand.'],
  playerWin: ['Lucky.', 'Don’t get used to it.', 'The house remembers.', 'Take it.', 'You counting cards? You look like a card counter.'],
  playerLose: ['House wins.', 'Thank you kindly.', 'That’s mine now.', 'Better luck next hand.'],
  dealerBust: ['Aw, shucks.', 'Who shuffled this deck?', 'Don’t say it.', 'Happens.'],
  push: ['Standoff.', 'Nobody wins. My favourite kind of hand.', 'Same total. Keep your money.'],
  bigScore: ['Now hold on.', 'That can’t be legal.', 'Somebody fetch the sheriff.', 'I need to sit down.'],
  tableWon: ['Get outta my saloon.', 'Take your bucks and go.', 'You win this time.', 'I’ll remember your face.'],
  tableLost: ['Come back when you’ve grown some feathers.', 'House always wins.', 'Try the next town.'],
  fold: ['Chicken.', 'Folding already?', 'Smart. Cowardly, but smart.', 'Bawk.'],
  wager: ['Feeling brave?', 'Big money. I like it.', 'Your funeral.', 'Now we’re talking.'],
};

const OUTLAW_INTROS: Record<string, string> = {
  kappa: 'No folding at my table. You sat down, you play it out.',
  tsuchinoko: 'Toll road. A buck a card.',
  ubume: 'No doubling, no splitting. One bet per hand, like decent folk.',
  enenra: 'Aces count as one here. I don’t make exceptions.',
  ittan: 'Ties go to the house. Court is in session.',
  rokurokubi: 'If the dealer busts, that’s his problem. You don’t get paid for it.',
  jorogumo: 'Nobody stands pat at my table. Hit.',
  bake_danuki: 'Your first card comes face down. I already looked at it.',
  mokumokuren: 'Folding fee is three bucks. It’s in the small print.',
  aosagibi: 'Horseshoes are mine. Finders keepers.',
  hinoenma: 'Dynamite’s confiscated. Sheriff’s orders.',
  jubokko: 'Cacti don’t count at my table.',
  kanedama: 'Stars? Never met one worth anything.',
  noppera: 'Faces don’t count here. Mine included.',
  bakeneko: 'Inked cards? Can’t see ’em from down here.',
  nue: 'Three cards or it doesn’t count.',
  gashadokuro: 'No tricks. There’s just a lot of me to beat.',
  baku: 'Half of everything goes to the government. I’m the government.',
  yuki_onna: 'Face cards come in face down. Keep up.',
  kamaitachi: 'I know one song. You get one hand type.',
  akaname: 'A natural? I’ve seen better.',
  kitsunebi: 'Cut.',
  hyakume: 'I watch every card you hit. None of them will score.',
  oboroguruma: 'Three cards per car. A fourth and it doesn’t count.',
  umibozu: 'Two hands. I’m on my lunch break.',
  nurarihyon: 'I’ve seen every trick. Don’t repeat yourself.',
  shokera: 'Every hand, one of your Doodads goes in my sack.',
  tsukuyomi: 'Every card’s worth one more around me. Mind the 21.',
  chochin_o: 'My saloon. Ties go to me, and nobody folds.',
  tamamo: 'One card in three goes bad at my table.',
  otakemaru: 'Twenty’s the limit here. Twenty-one is a bust.',
  daitengu: 'Three hands. No folds.',
  orochi: 'Lose a hand and the flock gets bigger.',
  carl: 'I stand on eighteen. Seventeen is for amateurs.',
  stu: 'Two cards. Two more if you’re lucky. That’s it.',
  tess: 'Two dollars a hand. Receipts on request.',
  flo: 'Five cards? Darling, at my table you need six.',
  pierre: 'Double down if you like. I won’t be impressed.',
  earl: 'Small cards don’t count. I don’t make change.',
  tango: 'Aces are a crutch. I took them away.',
  dot: 'You won’t see your first card, and a tie is mine.',
};

export function line(mood: Mood, seed = Math.random()): string {
  const pool = LINES[mood];
  return pool[Math.floor(seed * pool.length) % pool.length];
}

export function outlawIntro(hostId: string): string {
  return OUTLAW_INTROS[hostId] ?? line('greet');
}

export const TOWN_NAMES = ['Dusty Gulch', 'Quackwater Springs', 'Featherstone', 'Mallard Mesa', 'Goose Creek', 'Tombstone Pond', 'Golden Egg City'];

export function townName(n: number): string {
  if (n <= TOWN_NAMES.length) return TOWN_NAMES[n - 1];
  const a = ['Lonesome', 'Rattlesnake', 'Buzzard', 'Tumbleweed', 'Dead Duck', 'Hollow', 'Last Chance'];
  const b = ['Ridge', 'Bluff', 'Hollow', 'Flats', 'Canyon', 'Crossing', 'Pass'];
  return `${a[n % a.length]} ${b[(n * 3) % b.length]}`;
}
