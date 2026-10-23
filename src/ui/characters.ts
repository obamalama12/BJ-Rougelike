// Who sits behind the table, what they look like, and what they say.

import type { Expression } from './portraits';
import { CHARACTERS, portrait } from './portraits';
import type { TableState } from '../core/types';

export function dealerId(t: Pick<TableState, 'kind' | 'hostId'>): string {
  if (t.kind === 'host' && t.hostId) return CHARACTERS[t.hostId] ? t.hostId : 'dealer_bart';
  if (t.kind === 'bank') return 'banker';
  if (t.kind === 'silk') return 'dealer_lola';
  return 'dealer_bart';
}

export function portraitOf(id: string, expression: Expression = 'neutral'): string {
  const c = CHARACTERS[id] ?? CHARACTERS.dealer_bart;
  return portrait({ ...c, expression });
}

export function nameOf(id: string): string {
  return CHARACTERS[id]?.name ?? 'Stranger';
}

export type Mood = 'greet' | 'deal' | 'playerBust' | 'playerBlackjack' | 'playerWin' | 'playerLose' | 'dealerBust' | 'push' | 'bigScore' | 'tableWon' | 'tableLost' | 'fold' | 'wager';

const LINES: Record<Mood, string[]> = {
  greet: ['Ante up, partner.', 'Sit down. Keep your wings where I can see ’em.', 'Welcome to the table. House rules: no fowl play.', 'Another greenhorn. Lovely.', 'Cards are fresh. So’s the coffee.'],
  deal: ['Here we go.', 'Read ’em and weep.', 'Fresh cards, comin’ up.', 'Let’s see what you got.', 'Don’t blink.'],
  playerBust: ['Hah! Too greedy.', 'Bust! Better luck never.', 'The cards giveth. Mostly they taketh.', 'Ooh, that’s gotta sting.', 'Quack quack, you’re out.'],
  playerBlackjack: ['A natural?! Who taught you that?', 'Well I’ll be plucked.', 'Beginner’s luck.', 'Hmph. Fine. Nice hand.'],
  playerWin: ['Hmph. Lucky.', 'Don’t get used to it.', 'The house remembers.', 'Fine. Take it.', 'You counting cards? You look like a card counter.'],
  playerLose: ['House wins. As it should.', 'Thank you kindly.', 'That’s mine now.', 'Better luck next hand, featherbrain.'],
  dealerBust: ['Aw, shucks.', 'Who stacked this shoe?!', 'Don’t say it. Don’t you say it.', 'That’s... statistically fine.'],
  push: ['A standoff. How dull.', 'Nobody wins. My favourite.', 'Tie goes to... nobody.'],
  bigScore: ['WHAT?!', 'That can’t be legal.', 'Somebody fetch the sheriff!', 'I need a lie down.'],
  tableWon: ['Get outta my saloon.', 'Take your bucks and git.', 'You win this time, duck.', 'I’ll remember your face.'],
  tableLost: ['Come back when you’ve got real feathers.', 'The house always wins, kid.', 'Better luck next town.'],
  fold: ['Chicken.', 'Folding already?', 'Smart. Cowardly, but smart.', 'Bawk bawk.'],
  wager: ['Feeling brave, huh?', 'Big money. I like it.', 'Your funeral.', 'Now we’re talkin’.'],
};

const OUTLAW_INTROS: Record<string, string> = {
  kappa: 'No folding at MY table, coward.',
  tsuchinoko: 'Every card costs a buck. Toll road, see?',
  ubume: 'Nobody double-crosses Mother Goose.',
  enenra: 'Aces? Worth one. My table, my rules.',
  ittan: 'Ties go to the house. Court is in session.',
  rokurokubi: 'Dealer busts don’t count here, darling.',
  jorogumo: 'Gotta keep movin’! Hit, hit, HIT!',
  bake_danuki: 'Mind your first card. Or don’t. You can’t see it anyway.',
  mokumokuren: 'Folding fee is three bucks. Standard rate.',
  aosagibi: 'Ooh, shiny horseshoes. Mine now.',
  hinoenma: 'Dynamite is confiscated. Sheriff’s orders.',
  jubokko: 'Cacti don’t grow here, partner.',
  kanedama: 'Stars? I don’t believe in stars.',
  noppera: 'Faces? Never seen one.',
  bakeneko: 'Painted cards? I can’t see ’em. Head’s in the sand.',
  nue: 'Three cards or nothin’.',
  gashadokuro: 'I’m a very large bird. My target is very large.',
  baku: 'Half goes to the government. That’s me.',
  yuki_onna: 'Face cards come in cold, sugar.',
  kamaitachi: 'Pick one song and sing it.',
  akaname: 'Naturals don’t impress me.',
  kitsunebi: '...',
  hyakume: 'I see every card you hit. Every. Single. One.',
  oboroguruma: 'No more than three cards per car! All aboard!',
  umibozu: 'Two hands. I’m on my lunch break.',
  nurarihyon: 'I’ve seen every trick. Don’t repeat yourself.',
  shokera: 'Nice Doodads. Be a shame if one went missing.',
  tsukuyomi: 'Everything’s worth more around me, darling.',
  chochin_o: 'This is MY saloon. My ties. No folding.',
  tamamo: 'One in three of your cards is cursed. Probably.',
  otakemaru: 'You bust over twenty here, sweetie.',
  daitengu: 'Three hands. No folds. Let’s dance.',
  orochi: 'Lose a hand and the flock gets bigger.',
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
