// Shared data model for Buck Ducks. Everything in a Run is plain JSON
// so it can be saved to localStorage at any decision point.

export type Suit = 'moon' | 'flame' | 'leaf' | 'bell';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type InkId = 'jade' | 'crimson' | 'gilded' | 'glass' | 'stone' | 'lucky' | 'spirit' | 'ash';
export type FinishId = 'foil' | 'holo' | 'prism' | 'phantom';
export type SealId = 'red' | 'gold' | 'blue' | 'purple';
export type Rarity = 1 | 2 | 3 | 4;

export interface Card {
  id: number;
  rank: Rank;
  suit: Suit;
  ink?: InkId;
  finish?: FinishId;
  seal?: SealId;
  /** Permanent bonus chips (from Pilgrim and friends). */
  bonus?: number;
}

export type HandTypeId =
  | 'sevens'
  | 'royal'
  | 'flush'
  | 'blackjack'
  | 'charlie'
  | 'twentyone'
  | 'underdog'
  | 'outdraw'
  | 'dealerbust'
  | 'push';

export type Outcome = 'blackjack' | 'charlie' | 'win' | 'dealerbust' | 'push' | 'lose' | 'bust' | 'fold';

export interface CharmInst {
  uid: number;
  id: string;
  finish?: FinishId;
  state: Record<string, any>;
  /** Extra sell value accumulated (Gift Box, Hen's Egg...). */
  extraSell?: number;
  /** Disabled by a Host for this table. */
  disabled?: boolean;
}

export type ConsKind = 'fortune' | 'star' | 'mask';
export interface ConsInst {
  uid: number;
  kind: ConsKind;
  id: string;
  finish?: FinishId;
}

export interface TagInst {
  uid: number;
  id: string;
}

/** paper = Saloon game, silk = High Stakes, bank = Bank Job (elite), host = Outlaw showdown. */
/** Optional side bets on a hand: paid in Bucks, decided by the deal or the dealer. */
export type SideBetId = 'pair' | 'suited' | 'bust';

export type TableKind = 'paper' | 'silk' | 'bank' | 'gang' | 'host';

export interface PlayerHand {
  cards: number[];
  doubled: boolean;
  done: boolean;
  fromSplit: boolean;
  outcome?: Outcome;
  handType?: HandTypeId;
  score?: number;
  hits: number;
}

export type TablePhase = 'ready' | 'player' | 'dealer' | 'resolved' | 'won' | 'lost';

export interface TableState {
  kind: TableKind;
  hostId?: string;
  hostDisabled?: boolean;
  target: number;
  score: number;
  handsLeft: number;
  foldsLeft: number;
  shoe: number[];
  discard: number[];
  dealer: number[];
  hands: PlayerHand[];
  active: number;
  phase: TablePhase;
  /** Number of hands dealt this table (including folded ones). */
  dealt: number;
  typesPlayed: HandTypeId[];
  /** Ids of cards dealt face down that the player cannot see. */
  hidden: number[];
  /** Ids of cards debuffed by the Host. */
  debuffed: number[];
  foldsUsed: number;
  firstFoldDone?: boolean;
  bustSaved?: boolean;
  phoenixUsed?: boolean;
  hostTriggered?: boolean;
  /** Ids of Ash cards that crumbled this table. */
  crumbled: number[];
  /** Win streak inside the table. */
  streak: number;
  /** Side bet placed on the current hand, if any. */
  sideBet?: SideBetId | null;
  /** Most recent hand's final score (for display). */
  lastScore: number;
  /** Cards drawn this table. */
  drawn: number;
  /** A one-shot rule tweak for the next deal (from Fortunes, etc). */
  nextDeal?: { peek?: boolean };
  /** Wager multiplier chosen for the current hand (1, 2 or 3). */
  wager: number;
  /** Grit lost at this table from wagers. */
  gritLost: number;
}

export type NodeKind = 'saloon' | 'highstakes' | 'bank' | 'gang' | 'store' | 'doc' | 'camp' | 'event' | 'outlaw';

export interface TrailNode {
  id: number;
  col: number;
  row: number;
  kind: NodeKind;
  next: number[];
  done?: boolean;
  /** Curse for Bank Jobs, the Outlaw for the showdown. */
  hostId?: string;
  eventId?: string;
}

export interface Trail {
  nodes: TrailNode[];
  /** The node we are standing on (null before the first step of a town). */
  at: number | null;
}

export interface ActiveEvent {
  id: string;
  /** Result text once a choice has been made. */
  result?: string;
  duel?: { stake: number; reward: number };
}

export type ShopItem =
  | { kind: 'charm'; uid: number; id: string; finish?: FinishId; price: number; sold?: boolean }
  | { kind: 'cons'; uid: number; cons: ConsKind; id: string; finish?: FinishId; price: number; sold?: boolean }
  | { kind: 'card'; uid: number; card: Card; price: number; sold?: boolean };

export interface PackItem {
  uid: number;
  packId: string;
  price: number;
  sold?: boolean;
}

export interface ShopState {
  items: ShopItem[];
  packs: PackItem[];
  voucher: string | null;
  voucherSold?: boolean;
  rerollCost: number;
  rerollsDone: number;
  freeRerolls: number;
  couponFree?: boolean;
}

export interface OpenPack {
  packId: string;
  picksLeft: number;
  options: (
    | { kind: 'charm'; id: string; finish?: FinishId; taken?: boolean }
    | { kind: 'cons'; cons: ConsKind; id: string; finish?: FinishId; taken?: boolean }
    | { kind: 'card'; card: Card; taken?: boolean }
  )[];
  /** Cards drawn from the deck to target Fortunes/Masks while the pack is open. */
  spread: number[];
  returnTo: 'shop' | 'trail';
}

export interface RunStats {
  handsPlayed: number;
  handsWon: number;
  blackjacks: number;
  busts: number;
  pushes: number;
  folds: number;
  bestHand: number;
  bestHandType?: HandTypeId;
  moneyEarned: number;
  cardsDrawn: number;
  tablesSkipped: number;
  tablesWon: number;
  fortunesUsed: number;
  starsUsed: number;
  masksUsed: number;
  uniqueStars: string[];
  rerolls: number;
  charmsBought: number;
  charmsSold: number;
  cardsSold: number;
  packsSkipped: number;
  hostsBeaten: number;
  gangBeaten?: number;
  glassShattered: number;
  facesDestroyed: number;
  cardsFolded: number;
}

export interface Run {
  version: number;
  seed: string;
  rng: number;
  shoeId: string;
  stake: number;
  night: number;
  tableIdx: number;
  phase: 'trail' | 'table' | 'cashout' | 'shop' | 'pack' | 'event' | 'doc' | 'camp' | 'gameover' | 'victory';
  /** Run-long health. Lost on risky wagers and failed tables; the run ends at 0. */
  grit: number;
  maxGrit: number;
  trail: Trail;
  event: ActiveEvent | null;
  money: number;
  deck: Card[];
  nextId: number;
  charms: CharmInst[];
  consumables: ConsInst[];
  baseCharmSlots: number;
  baseConsSlots: number;
  baseHands: number;
  baseFolds: number;
  handLevels: Record<HandTypeId, number>;
  handPlays: Record<HandTypeId, number>;
  vouchers: string[];
  tags: TagInst[];
  /** Host id for each night, decided as the night begins. */
  nightHost: string;
  hostsSeen: string[];
  shop: ShopState | null;
  table: TableState | null;
  pack: OpenPack | null;
  cashout: { lines: { label: string; amount: number; tone?: string }[]; total: number; failed?: boolean; gritLost?: number } | null;
  lastCons: { kind: ConsKind; id: string } | null;
  stats: RunStats;
  endless: boolean;
  /** Assorted per-run flags (persimmon eaten, etc). */
  flags: Record<string, any>;
  /** Rotating targets for charms like Pawnbroker. */
  rotating: { rank: Rank; suit: Suit; suit2: Suit };
  /** Discount multiplier applied to shop prices. */
  interestCap: number;
  /** Ember debt allowed (IOU Note). */
  log: string[];
}

export interface Rules {
  bustLimit: number;
  dealerStand: number;
  dealerHitSoft17: boolean;
  charlieSize: number;
  canDouble: boolean;
  canSplit: boolean;
  canFold: boolean;
  doubleCost: number;
  splitCost: number;
  doubleX: number;
  seeHole: boolean;
  seeTop: number;
  aceLow: boolean;
  plusOne: boolean;
  faceValue: number;
  dealerWinsTies: boolean;
  splitAnyTen: boolean;
  smeared: boolean;
  allFace: boolean;
  firstCardDown: boolean;
  faceCardsDown: boolean;
  dealerUpDown: boolean;
  insurance: boolean;
  pushIsWin: boolean;
  minCardsToScore: number;
  oneHandType: boolean;
  noRepeatType: boolean;
  dealerBustScoresZero: boolean;
  blackjackAsOutdraw: boolean;
  mustHit: boolean;
  halveBase: boolean;
  probMult: number;
  hitCost: number;
  handCost: number;
  maxHits: number;
  splitAces21: boolean;
}

export type Src =
  | { kind: 'card'; id: number }
  | { kind: 'charm'; uid: number }
  | { kind: 'cons'; uid: number }
  | { kind: 'deck' }
  | { kind: 'host' }
  | { kind: 'hand' };

export type ScoreEvent =
  | { t: 'base'; chips: number; mult: number; handType: HandTypeId; level: number }
  | { t: 'chips'; v: number; src: Src; chips: number; mult: number }
  | { t: 'mult'; v: number; src: Src; chips: number; mult: number }
  | { t: 'xmult'; v: number; src: Src; chips: number; mult: number }
  | { t: 'money'; v: number; src: Src }
  | { t: 'msg'; text: string; src: Src; color?: string }
  | { t: 'retrigger'; src: Src }
  | { t: 'shatter'; id: number }
  | { t: 'destroyCharm'; uid: number }
  | { t: 'card'; id: number; on: boolean };
