// Interfaces shared by the content definitions (charms, fortunes, hosts...)
// and the engine that runs them.

import type { Rng } from '../core/rng';
import type {
  Card,
  CharmInst,
  ConsKind,
  HandTypeId,
  Outcome,
  PlayerHand,
  Rarity,
  Rules,
  Run,
  TableState,
  FinishId,
} from '../core/types';

export interface Ctx {
  run: Run;
  table: TableState | null;
  rules: Rules;
  rng: Rng;
  hand?: PlayerHand;
  /** All cards in the hand being processed. */
  cards: Card[];
  /** Cards that actually score (non-debuffed). */
  scored: Card[];
  handType?: HandTypeId;
  outcome?: Outcome;
  total: number;
  dealerTotal: number;
  dealerCards: Card[];
  dealerBusted: boolean;
  isFirst: boolean;
  isLast: boolean;
  /** True when invoked through a copying charm (Tracing Paper, Echo Mirror). */
  copy: boolean;
  chips(n: number): void;
  mult(n: number): void;
  xmult(n: number): void;
  money(n: number): void;
  msg(text: string, color?: string): void;
  /** Roll a "1 in n" chance, respecting probability boosters. */
  chance(n: number): boolean;
  addCard(c: Partial<Card>): Card;
  destroyCard(id: number): void;
  createCons(kind: ConsKind, id?: string, finish?: FinishId): boolean;
  createCharm(opts?: { rarity?: Rarity; id?: string; finish?: FinishId; force?: boolean }): boolean;
  destroyCharm(uid: number): void;
  levelUp(ht: HandTypeId, n?: number): void;
  addTag(id: string): void;
}

export type IconId = string;

export interface CharmDef {
  id: string;
  name: string;
  rarity: Rarity;
  cost: number;
  icon: IconId;
  /** Accent colour of the illustration. */
  hue: string;
  text: string | ((s: CharmInst, run: Run) => string);
  init?: () => Record<string, any>;
  /** Hidden from the shop pool unless this returns true. */
  available?: (run: Run) => boolean;
  /** Cannot be copied by Tracing Paper / Echo Mirror. */
  noCopy?: boolean;
  rules?: (r: Rules, s: CharmInst, run: Run) => void;
  slots?: { charm?: number; cons?: number; hands?: number; folds?: number; interest?: number };

  // --- Scoring ---------------------------------------------------------
  /** Each scored card (after the card's own chips). */
  card?: (c: Ctx, s: CharmInst, card: Card) => void;
  /** Extra triggers for a scored card. */
  retrig?: (c: Ctx, s: CharmInst, card: Card) => number;
  /** Once per winning / pushing hand, after the cards. */
  hand?: (c: Ctx, s: CharmInst) => void;
  /** After a hand has been scored (state mutation lives here). */
  after?: (c: Ctx, s: CharmInst) => void;
  /** After every hand outcome, including losses and folds. */
  resolve?: (c: Ctx, s: CharmInst) => void;

  // --- Table events -----------------------------------------------------
  deal?: (c: Ctx, s: CharmInst) => void;
  hit?: (c: Ctx, s: CharmInst, card: Card) => void;
  fold?: (c: Ctx, s: CharmInst, cards: Card[]) => void;
  double?: (c: Ctx, s: CharmInst) => void;
  split?: (c: Ctx, s: CharmInst) => void;
  /** Return true to cancel a bust (once handled, the engine re-evaluates). */
  bust?: (c: Ctx, s: CharmInst) => boolean;
  tableStart?: (c: Ctx, s: CharmInst) => void;
  tableEnd?: (c: Ctx, s: CharmInst) => void;
  /** Return true to prevent the run from ending. */
  save?: (c: Ctx, s: CharmInst) => boolean;
  endMoney?: (run: Run, s: CharmInst) => number;

  // --- Shop / meta ---------------------------------------------------------
  shopEnter?: (c: Ctx, s: CharmInst) => void;
  shopLeave?: (c: Ctx, s: CharmInst) => void;
  reroll?: (c: Ctx, s: CharmInst) => void;
  sold?: (c: Ctx, s: CharmInst) => void;
  anySold?: (c: Ctx, s: CharmInst, what: 'charm' | 'cons' | 'card') => void;
  useCons?: (c: Ctx, s: CharmInst, kind: ConsKind, id: string) => void;
  packOpen?: (c: Ctx, s: CharmInst, packId: string) => void;
  packSkip?: (c: Ctx, s: CharmInst) => void;
  tableSkip?: (c: Ctx, s: CharmInst) => void;
  cardAdded?: (c: Ctx, s: CharmInst, card: Card) => void;
  cardDestroyed?: (c: Ctx, s: CharmInst, card: Card) => void;
  charmDestroyed?: (c: Ctx, s: CharmInst) => void;
  hostBeaten?: (c: Ctx, s: CharmInst) => void;
}

export interface ConsDef {
  id: string;
  kind: ConsKind;
  name: string;
  icon: IconId;
  hue: string;
  text: string | ((run: Run) => string);
  /** Number of target cards (min, max). Zero means no targets. */
  targets?: [number, number];
  /** Whether the item can be used right now. */
  canUse?: (run: Run, targets: Card[]) => boolean;
  use: (c: Ctx, targets: Card[]) => void;
  /** Constellations only. */
  hand?: HandTypeId;
}

export interface VoucherDef {
  id: string;
  name: string;
  icon: IconId;
  text: string;
  requires?: string;
  cost?: number;
  rules?: (r: Rules, run: Run) => void;
  slots?: { charm?: number; cons?: number; hands?: number; folds?: number; interest?: number; shop?: number };
  onBuy?: (c: Ctx) => void;
}

export interface TagDef {
  id: string;
  name: string;
  icon: IconId;
  hue: string;
  text: string;
  /** When the tag fires. */
  when: 'now' | 'shop' | 'tableStart' | 'hostBeaten' | 'packs';
  /** Return true when the tag has been consumed. */
  apply: (c: Ctx) => boolean;
  minNight?: number;
}

export interface HostDef {
  id: string;
  name: string;
  title: string;
  text: string;
  icon: IconId;
  hue: string;
  /** Target multiplier relative to the night's base. */
  scale: number;
  minNight: number;
  maxNight?: number;
  showdown?: boolean;
  /** Never drawn from the tiers: a rare stand-in for any town's Outlaw (see rareOutlawChance). */
  rare?: boolean;
  rules?: (r: Rules, run: Run) => void;
  /** Called when the table starts. */
  start?: (c: Ctx) => void;
  /** Return true if this card should be debuffed. */
  debuff?: (card: Card, run: Run) => boolean;
  /** Called after each hand resolves. */
  afterHand?: (c: Ctx) => void;
  /** Modify a scoring hand (e.g. block a hand type). Return false to score nothing. */
  allowScore?: (c: Ctx) => boolean;
  onHit?: (c: Ctx, card: Card) => void;
  hands?: number;
  folds?: number;
}

export interface ShoeDef {
  id: string;
  name: string;
  text: string;
  hue: string;
  back: string;
  build?: (c: Ctx) => void;
  rules?: (r: Rules, run: Run) => void;
  start?: Partial<Pick<Run, 'money' | 'baseHands' | 'baseFolds' | 'baseCharmSlots' | 'baseConsSlots' | 'interestCap'>>;
  vouchers?: string[];
  cons?: { kind: ConsKind; id: string }[];
  charms?: string[];
  /** Target multiplier. */
  scale?: number;
}

export interface StakeDef {
  id: number;
  name: string;
  color: string;
  text: string;
}

export interface PackDef {
  id: string;
  name: string;
  kind: 'charm' | 'fortune' | 'star' | 'mask' | 'card';
  size: number;
  picks: number;
  cost: number;
  weight: number;
  tier: 'normal' | 'jumbo' | 'mega';
}
