// The blackjack table: dealing, player actions, the dealer, and scoring.

import type { Card, HandTypeId, Outcome, PlayerHand, Run, ScoreEvent, TableKind, TableState } from '../core/types';
import { cardChips, classifyHand, handBase, handTotal, isFace, isTenValue } from '../core/cards';
import { CHARM } from '../content/charms';
import { HOST } from '../content/hosts';
import { SEAL_INFO } from '../core/cards';
import {
  ctx,
  charmCalls,
  createCons,
  currentHost,
  destroyCard,
  fire,
  fireTags,
  fireWith,
  foldsPerTable,
  fxQueue,
  getRules,
  handsPerTable,
  has,
  hasVoucher,
  rng,
  type ScoreSink,
} from './engine';
import type { Ctx } from './api';
import { hurt } from './trail';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function cardById(run: Run, id: number): Card {
  const c = run.deck.find((k) => k.id === id);
  if (c) return c;
  // A card destroyed mid-hand: return a harmless placeholder.
  return { id, rank: 2, suit: 'moon', ink: 'stone' };
}

export function cardsOf(run: Run, ids: number[]): Card[] {
  const map = new Map(run.deck.map((k) => [k.id, k]));
  return ids.map((id) => map.get(id)).filter((k): k is Card => !!k);
}

export function playerTotal(run: Run, hand: PlayerHand) {
  return handTotal(cardsOf(run, hand.cards), getRules(run));
}

export function dealerTotal(run: Run) {
  const t = run.table!;
  return handTotal(cardsOf(run, t.dealer), getRules(run), 21, true);
}

export function activeHand(run: Run): PlayerHand | null {
  const t = run.table;
  if (!t || t.phase !== 'player') return null;
  return t.hands[t.active] ?? null;
}

// ---------------------------------------------------------------------------
// Table lifecycle
// ---------------------------------------------------------------------------

export function startTable(run: Run, kind: TableKind, target: number, hostId?: string) {
  const r = rng(run);
  const table: TableState = {
    kind,
    hostId,
    target,
    wager: 1,
    gritLost: 0,
    score: 0,
    handsLeft: 0,
    foldsLeft: 0,
    shoe: r.shuffle(run.deck.map((k) => k.id)),
    discard: [],
    dealer: [],
    hands: [],
    active: 0,
    phase: 'ready',
    dealt: 0,
    typesPlayed: [],
    hidden: [],
    debuffed: [],
    foldsUsed: 0,
    crumbled: [],
    streak: 0,
    lastScore: 0,
    drawn: 0,
  };
  run.table = table;
  run.tableIdx = kind === 'host' ? 2 : kind === 'paper' ? 0 : 1;
  run.phase = 'table';
  table.handsLeft = handsPerTable(run);
  table.foldsLeft = foldsPerTable(run);
  for (const k of run.charms) k.disabled = false;
  const host = currentHost(run);
  const c = ctx(run);
  host?.start?.(c);
  fireTags(run, 'tableStart');
  fireWith(ctx(run), 'tableStart');
  // The deck may have grown at table start; new cards land in the shoe.
  for (const id of table.discard.splice(0)) table.shoe.splice(r.int(0, table.shoe.length), 0, id);
}

function reshuffle(run: Run) {
  const t = run.table!;
  const inPlay = new Set([...t.dealer, ...t.hands.flatMap((h) => h.cards)]);
  const back = t.discard.filter((id) => !inPlay.has(id) && run.deck.some((k) => k.id === id));
  t.discard = [];
  t.shoe = rng(run).shuffle(back);
  fxQueue.push({ t: 'msg', text: 'Reshuffle!', color: '#ffd23f', src: { kind: 'deck' } });
}

/** Take the top card of the shoe. */
function takeTop(run: Run): Card | null {
  const t = run.table!;
  if (!t.shoe.length) reshuffle(run);
  if (!t.shoe.length) {
    // Deck exhausted completely: conjure a stone card so play can continue.
    const c = ctx(run).addCard({ ink: 'stone' });
    t.discard = t.discard.filter((x) => x !== c.id);
    return c;
  }
  const id = t.shoe.shift()!;
  return cardById(run, id);
}

function applyDrawEffects(run: Run, card: Card, toPlayer: boolean, firstOfHand: boolean) {
  const t = run.table!;
  const rules = getRules(run);
  const host = currentHost(run);
  if (host && !has(run, 'shield_of_dawn')) {
    if (host.debuff?.(card, run)) {
      if (!t.debuffed.includes(card.id)) t.debuffed.push(card.id);
      t.hostTriggered = true;
    }
    if (host.id === 'tamamo' && rng(run).next() < 1 / 3) {
      if (!t.debuffed.includes(card.id)) t.debuffed.push(card.id);
      t.hostTriggered = true;
    }
  }
  if (toPlayer) {
    if ((rules.firstCardDown && firstOfHand) || (rules.faceCardsDown && isFace(card))) {
      t.hidden.push(card.id);
      t.hostTriggered = true;
    }
    run.stats.cardsDrawn++;
    t.drawn++;
  }
}

/** Begin a new hand: consume a hand and prepare for dealing. */
export function beginHand(run: Run) {
  const t = run.table!;
  t.phase = 'player';
  t.handsLeft -= 1;
  t.dealt += 1;
  t.hands = [{ cards: [], doubled: false, done: false, fromSplit: false, hits: 0 }];
  t.active = 0;
  t.dealer = [];
  t.hidden = [];
  t.lastScore = 0;
  run.stats.handsPlayed++;
}

/** Deal one card to the player (hand index) or the dealer. */
export function dealTo(run: Run, who: 'player' | 'dealer', hi = 0): Card | null {
  const t = run.table!;
  const card = takeTop(run);
  if (!card) return null;
  if (who === 'dealer') {
    t.dealer.push(card.id);
    applyDrawEffects(run, card, false, false);
    const rules = getRules(run);
    if (t.dealer.length === 2 && !rules.seeHole) t.hidden.push(card.id);
    if (t.dealer.length === 1 && rules.dealerUpDown) t.hidden.push(card.id);
  } else {
    const h = t.hands[hi];
    applyDrawEffects(run, card, true, h.cards.length === 0);
    h.cards.push(card.id);
  }
  return card;
}

export interface DealResult {
  dealerNatural: boolean;
  playerNatural: boolean;
}

/** After the initial four cards: dealer peek and naturals. */
export function afterDeal(run: Run): DealResult {
  const t = run.table!;
  const rules = getRules(run);
  const h = t.hands[0];
  const pc = cardsOf(run, h.cards);
  const dc = cardsOf(run, t.dealer);
  const pt = handTotal(pc, rules);
  const playerNatural = pc.length === 2 && pt.total === 21;
  const up = dc[0];
  let dealerNatural = false;
  if (up && (up.rank === 14 || isTenValue(up))) {
    dealerNatural = handTotal(dc, rules, 21, true).total === 21;
  }
  const c = ctx(run, { hand: h, cards: pc });
  fireWith(c, 'deal');
  if (dealerNatural) {
    revealDealer(run);
    h.done = true;
    if (playerNatural) h.outcome = 'push';
    else {
      h.outcome = 'lose';
      if (rules.insurance) {
        t.handsLeft += 1;
        fxQueue.push({ t: 'msg', text: 'Insured!', color: '#4fb6ff', src: { kind: 'hand' } });
      }
    }
    t.phase = 'dealer';
  } else if (playerNatural) {
    h.done = true;
    h.outcome = 'blackjack';
    revealHand(run, h);
    advance(run);
  } else {
    checkAuto(run, h);
  }
  return { dealerNatural, playerNatural };
}

function revealHand(run: Run, h: PlayerHand) {
  const t = run.table!;
  t.hidden = t.hidden.filter((id) => !h.cards.includes(id));
}

export function revealDealer(run: Run) {
  const t = run.table!;
  t.hidden = t.hidden.filter((id) => !t.dealer.includes(id));
}

/** Auto-finish a hand at 21 / charlie / bust. */
function checkAuto(run: Run, h: PlayerHand): 'bust' | 'charlie' | 'stand' | null {
  const rules = getRules(run);
  const t = run.table!;
  const cards = cardsOf(run, h.cards);
  let tot = handTotal(cards, rules);
  if (tot.bust) {
    // Phoenix Feather: burn the busting card once per table.
    if (has(run, 'phoenix_feather') && !t.phoenixUsed && cards.length > 2) {
      t.phoenixUsed = true;
      const burnt = h.cards.pop()!;
      t.discard.push(burnt);
      const owner = run.charms.find((k) => k.id === 'phoenix_feather');
      fxQueue.push({ t: 'msg', text: 'Burned!', color: '#ff6a2a', src: owner ? { kind: 'charm', uid: owner.uid } : { kind: 'deck' } });
      tot = handTotal(cardsOf(run, h.cards), rules);
      if (!tot.bust) return null;
    }
    h.done = true;
    // Shrine Fox and friends.
    const c = ctx(run, { hand: h, cards });
    let saved = false;
    for (const call of charmCalls(run)) {
      if (call.copy || !call.def.bust) continue;
      (c as any)._src = { kind: 'charm', uid: call.owner.uid };
      if (call.def.bust(c, call.inst)) {
        saved = true;
        break;
      }
    }
    h.outcome = saved ? 'push' : 'bust';
    revealHand(run, h);
    advance(run);
    return 'bust';
  }
  if (cards.length >= rules.charlieSize) {
    h.done = true;
    h.outcome = 'charlie';
    revealHand(run, h);
    advance(run);
    return 'charlie';
  }
  if (tot.total === rules.bustLimit && !rules.mustHit) {
    h.done = true;
    advance(run);
    return 'stand';
  }
  if (tot.total === rules.bustLimit && rules.mustHit && h.hits > 0) {
    h.done = true;
    advance(run);
    return 'stand';
  }
  return null;
}

/** Move to the next unfinished hand or to the dealer. */
function advance(run: Run) {
  const t = run.table!;
  const next = t.hands.findIndex((h) => !h.done);
  if (next >= 0) {
    t.active = next;
    return;
  }
  t.phase = 'dealer';
}

// ---------------------------------------------------------------------------
// Player actions
// ---------------------------------------------------------------------------

export interface Actions {
  hit: boolean;
  stand: boolean;
  double: boolean;
  split: boolean;
  fold: boolean;
  reasons: Partial<Record<'hit' | 'stand' | 'double' | 'split' | 'fold', string>>;
}

export function availableActions(run: Run): Actions {
  const none: Actions = { hit: false, stand: false, double: false, split: false, fold: false, reasons: {} };
  const t = run.table;
  const h = activeHand(run);
  if (!t || !h || h.done) return none;
  const rules = getRules(run);
  const cards = cardsOf(run, h.cards);
  const a: Actions = { hit: true, stand: true, double: false, split: false, fold: false, reasons: {} };
  if (rules.mustHit && h.hits === 0) {
    a.stand = false;
    a.reasons.stand = 'Jorōgumo: you must hit first';
  }
  if (cards.length === 2 && !h.doubled) {
    if (!rules.canDouble) a.reasons.double = 'Doubling is forbidden';
    else if (t.handsLeft < rules.doubleCost) a.reasons.double = 'Needs a spare hand';
    else a.double = true;
    const [x, y] = cards;
    const pair = x.ink !== 'stone' && y.ink !== 'stone' && (x.rank === y.rank || (rules.splitAnyTen && isTenValue(x) && isTenValue(y)));
    if (!pair) a.reasons.split = 'Needs a pair';
    else if (!rules.canSplit) a.reasons.split = 'Splitting is forbidden';
    else if (t.hands.length >= 4) a.reasons.split = 'Too many hands';
    else if (t.handsLeft < rules.splitCost) a.reasons.split = 'Needs a spare hand';
    else a.split = true;
  } else {
    a.reasons.double = 'Only on your first two cards';
    a.reasons.split = 'Only on your first two cards';
  }
  if (!rules.canFold) a.reasons.fold = 'Folding is forbidden';
  else if (t.foldsLeft <= 0) a.reasons.fold = 'No folds left';
  else if (t.hands.length > 1) a.reasons.fold = 'Cannot fold a split hand';
  else a.fold = true;
  return a;
}

export function hit(run: Run): Card | null {
  const t = run.table!;
  const h = activeHand(run);
  if (!h) return null;
  const rules = getRules(run);
  const card = dealTo(run, 'player', t.active);
  if (!card) return null;
  h.hits += 1;
  if (rules.hitCost) {
    run.money -= rules.hitCost;
    t.hostTriggered = true;
    fxQueue.push({ t: 'money', v: -rules.hitCost, src: { kind: 'host' } });
  }
  const c = ctx(run, { hand: h, cards: cardsOf(run, h.cards) });
  currentHost(run)?.onHit?.(c, card);
  fireWith(c, 'hit', card);
  checkAuto(run, h);
  return card;
}

export function stand(run: Run) {
  const h = activeHand(run);
  if (!h) return;
  h.done = true;
  advance(run);
}

export function double(run: Run): Card | null {
  const t = run.table!;
  const h = activeHand(run);
  if (!h) return null;
  const rules = getRules(run);
  t.handsLeft -= rules.doubleCost;
  h.doubled = true;
  fireWith(ctx(run, { hand: h }), 'double');
  const card = dealTo(run, 'player', t.active);
  h.hits += 1;
  if (card) {
    const c = ctx(run, { hand: h, cards: cardsOf(run, h.cards) });
    currentHost(run)?.onHit?.(c, card);
    fireWith(c, 'hit', card);
  }
  if (!h.done) {
    const res = checkAuto(run, h);
    if (!res && !h.done) {
      h.done = true;
      advance(run);
    }
  }
  return card;
}

/** Split the active hand. Returns the index of the new hand. */
export function split(run: Run): number {
  const t = run.table!;
  const h = activeHand(run);
  if (!h) return -1;
  const rules = getRules(run);
  t.handsLeft -= rules.splitCost;
  const moved = h.cards.pop()!;
  const nh: PlayerHand = { cards: [moved], doubled: false, done: false, fromSplit: true, hits: 0 };
  h.fromSplit = true;
  t.hands.splice(t.active + 1, 0, nh);
  fireWith(ctx(run, { hand: h }), 'split');
  return t.active + 1;
}

/** Deal the second card to each split hand. */
export function fillSplit(run: Run, hi: number): Card | null {
  const card = dealTo(run, 'player', hi);
  return card;
}

export function settleSplit(run: Run) {
  const t = run.table!;
  for (const h of t.hands) if (!h.done) checkAutoNoAdvance(run, h);
  advance(run);
}

function checkAutoNoAdvance(run: Run, h: PlayerHand) {
  const rules = getRules(run);
  const tot = handTotal(cardsOf(run, h.cards), rules);
  if (tot.total === rules.bustLimit && h.cards.length >= 2 && !rules.mustHit) h.done = true;
}

export function fold(run: Run) {
  const t = run.table!;
  const h = activeHand(run);
  if (!h) return;
  const cards = cardsOf(run, h.cards);
  t.foldsLeft -= 1;
  t.foldsUsed += 1;
  t.handsLeft += 1;
  h.done = true;
  h.outcome = 'fold';
  run.stats.folds++;
  run.stats.cardsFolded += cards.length;
  if (t.kind === 'host' && t.hostId === 'mokumokuren' && currentHost(run)) {
    run.money -= 3;
    t.hostTriggered = true;
    fxQueue.push({ t: 'money', v: -3, src: { kind: 'host' } });
  }
  const c = ctx(run, { hand: h, cards, outcome: 'fold' });
  fireWith(c, 'fold', cards);
  t.firstFoldDone = true;
  for (const k of cards) {
    if (k.seal === 'purple' && !t.debuffed.includes(k.id)) {
      if (createCons(run, 'fortune')) fxQueue.push({ t: 'msg', text: '+Tonic', color: SEAL_INFO.purple.color, src: { kind: 'card', id: k.id } });
    }
  }
  t.phase = 'resolved';
}

// ---------------------------------------------------------------------------
// Dealer
// ---------------------------------------------------------------------------

/** Whether the dealer needs to play at all. */
export function dealerNeedsToPlay(run: Run): boolean {
  const t = run.table!;
  return t.hands.some((h) => !h.outcome);
}

export function dealerShouldHit(run: Run): boolean {
  const t = run.table!;
  if (!dealerNeedsToPlay(run)) return false;
  const rules = getRules(run);
  const dt = handTotal(cardsOf(run, t.dealer), rules, 21, true);
  if (dt.bust) return false;
  if (dt.total < rules.dealerStand) return true;
  if (dt.total === 17 && dt.soft && rules.dealerHitSoft17 && rules.dealerStand <= 17) return true;
  return false;
}

export function dealerHit(run: Run): Card | null {
  return dealTo(run, 'dealer');
}

/** Compare every unsettled hand against the dealer. */
export function settleOutcomes(run: Run) {
  const t = run.table!;
  const rules = getRules(run);
  revealDealer(run);
  const dt = handTotal(cardsOf(run, t.dealer), rules, 21, true);
  for (const h of t.hands) {
    revealHand(run, h);
    if (h.outcome) continue;
    const pt = handTotal(cardsOf(run, h.cards), rules);
    if (pt.bust) h.outcome = 'bust';
    else if (dt.bust) h.outcome = 'dealerbust';
    else if (pt.total > dt.total) h.outcome = 'win';
    else if (pt.total === dt.total) h.outcome = rules.dealerWinsTies ? 'lose' : 'push';
    else h.outcome = 'lose';
    if (h.outcome === 'lose' && pt.total === dt.total) t.hostTriggered = true;
  }
  t.phase = 'resolved';
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface ScoreResult {
  events: ScoreEvent[];
  total: number;
  chips: number;
  mult: number;
  handType?: HandTypeId;
  outcome: Outcome;
  blocked?: string;
  shattered: number[];
  crumbled: number[];
  gritLost?: number;
}

export function scoreHand(run: Run, hi: number): ScoreResult {
  const t = run.table!;
  const h = t.hands[hi];
  const rules = getRules(run);
  const cards = cardsOf(run, h.cards);
  const dcards = cardsOf(run, t.dealer);
  const pt = handTotal(cards, rules);
  const dt = handTotal(dcards, rules, 21, true);
  const outcome = h.outcome ?? 'lose';
  const sink: ScoreSink = { events: [], chips: 0, mult: 0 };
  const isLast = t.handsLeft === 0 && hi === t.hands.length - 1;
  const base: Partial<Ctx> = {
    hand: h,
    cards,
    total: pt.total,
    dealerTotal: dt.total,
    dealerCards: dcards,
    dealerBusted: dt.bust,
    outcome,
    isFirst: t.dealt === 1,
    isLast,
  };
  const result: ScoreResult = { events: sink.events, total: 0, chips: 0, mult: 0, outcome, shattered: [], crumbled: [] };
  const host = currentHost(run);
  const scoring = outcome === 'blackjack' || outcome === 'charlie' || outcome === 'win' || outcome === 'dealerbust' || outcome === 'push';

  if (outcome === 'blackjack') run.stats.blackjacks++;
  if (outcome === 'bust') run.stats.busts++;
  if (outcome === 'push') run.stats.pushes++;

  let handType: HandTypeId | undefined;
  if (scoring) {
    handType = classifyHand(cards, pt.total, outcome as 'blackjack' | 'charlie' | 'win' | 'dealerbust' | 'push', rules);
    result.handType = handType;
    h.handType = handType;
    // Host restrictions
    let blocked: string | undefined;
    if (rules.minCardsToScore && cards.length < rules.minCardsToScore) blocked = `Needs ${rules.minCardsToScore}+ cards`;
    if (rules.oneHandType && t.typesPlayed.length && t.typesPlayed[0] !== handType) blocked = 'Wrong hand type';
    if (rules.noRepeatType && t.typesPlayed.includes(handType)) blocked = 'Already played';
    if (rules.dealerBustScoresZero && handType === 'dealerbust') blocked = 'Not allowed';
    if (host?.allowScore && !host.allowScore(ctx(run, { ...base, handType }))) blocked = 'Not allowed';
    if (blocked) {
      result.blocked = blocked;
      t.hostTriggered = true;
      sink.events.push({ t: 'msg', text: blocked, color: '#ff4b3a', src: { kind: 'host' } });
      handType = undefined;
    }
  }

  if (scoring && handType) {
    t.typesPlayed.push(handType);
    run.handPlays[handType] = (run.handPlays[handType] ?? 0) + 1;
    if (handType !== 'push') {
      run.stats.handsWon++;
      t.streak++;
    }
    const lvl = run.handLevels[handType];
    let { chips, mult } = handBase(handType, lvl);
    if (rules.halveBase) {
      chips = Math.ceil(chips / 2);
      mult = Math.max(1, Math.ceil(mult / 2));
    }
    sink.chips = chips;
    sink.mult = mult;
    sink.events.push({ t: 'base', chips, mult, handType, level: lvl });

    const c = ctx(run, { ...base, handType, scored: [] }, sink);
    const scored = cards.filter((k) => !t.debuffed.includes(k.id));
    c.scored = scored;
    const calls = charmCalls(run);

    // --- Cards -----------------------------------------------------------
    for (const card of scored) {
      let triggers = 1;
      if (card.seal === 'red') triggers++;
      for (const call of calls) {
        if (!call.def.retrig) continue;
        c.copy = call.copy;
        triggers += call.def.retrig(c, call.inst, card);
      }
      c.copy = false;
      for (let i = 0; i < triggers; i++) {
        (c as any)._src = { kind: 'card', id: card.id };
        if (i > 0) sink.events.push({ t: 'retrigger', src: { kind: 'card', id: card.id } });
        c.chips(cardChips(card));
        switch (card.ink) {
          case 'jade': c.chips(30); break;
          case 'crimson': c.mult(4); break;
          case 'glass': c.xmult(2); break;
          case 'gilded': c.money(3); break;
          case 'lucky': {
            let hit = false;
            if (c.chance(5)) { c.mult(20); hit = true; }
            if (c.chance(15)) { c.money(20); hit = true; }
            if (hit) {
              for (const k of run.charms) if (k.id === 'lucky_daruma' && !k.disabled) {
                k.state.x = (k.state.x ?? 1) + 0.25;
                sink.events.push({ t: 'msg', text: 'Upgrade!', src: { kind: 'charm', uid: k.uid } });
              }
            }
            break;
          }
        }
        switch (card.finish) {
          case 'foil': c.chips(50); break;
          case 'holo': c.mult(10); break;
          case 'prism': c.xmult(1.5); break;
        }
        if (card.seal === 'gold') c.money(3);
        for (const call of calls) {
          if (!call.def.card) continue;
          (c as any)._src = { kind: 'charm', uid: call.owner.uid };
          c.copy = call.copy;
          call.def.card(c, call.inst, card);
        }
        c.copy = false;
      }
      if (card.ink === 'glass' && c.chance(4)) result.shattered.push(card.id);
      if (card.seal === 'blue' && handType !== 'push') {
        const star = Object.values(HOST).length && handType;
        if (star && createConsForHand(run, handType)) sink.events.push({ t: 'msg', text: '+Tale', color: SEAL_INFO.blue.color, src: { kind: 'card', id: card.id } });
      }
    }

    // --- Charms --------------------------------------------------------------
    for (const call of calls) {
      (c as any)._src = { kind: 'charm', uid: call.owner.uid };
      c.copy = call.copy;
      const f = call.owner.finish;
      if (f === 'foil') c.chips(50);
      if (f === 'holo') c.mult(10);
      call.def.hand?.(c, call.inst);
      if (f === 'prism') c.xmult(1.5);
    }
    c.copy = false;

    // Observatory: held constellations boost their hand.
    if (hasVoucher(run, 'observatory')) {
      for (const k of run.consumables) {
        if (k.kind === 'star' && starHand(k.id) === handType) {
          (c as any)._src = { kind: 'cons', uid: k.uid };
          c.xmult(1.5);
        }
      }
    }
    (c as any)._src = { kind: 'hand' };
    if (h.doubled) c.xmult(rules.doubleX);
    if (t.wager > 1) {
      sink.events.push({ t: 'msg', text: t.wager === 2 ? 'Dollar wager!' : 'Bankroll wager!', color: '#ffd23f', src: { kind: 'hand' } });
      c.xmult(t.wager);
    }
    if (run.shoeId === 'balance') {
      const avg = (sink.chips + sink.mult) / 2;
      sink.chips = avg;
      sink.mult = avg;
      sink.events.push({ t: 'msg', text: 'Balanced!', color: '#e9e2cf', src: { kind: 'hand' } });
      sink.events.push({ t: 'chips', v: 0, src: { kind: 'hand' }, chips: avg, mult: avg });
    }

    result.chips = sink.chips;
    result.mult = sink.mult;
    result.total = Math.floor(sink.chips * sink.mult);
    t.score += result.total;
    t.lastScore = result.total;
    h.score = result.total;
    if (result.total > run.stats.bestHand) {
      run.stats.bestHand = result.total;
      run.stats.bestHandType = handType;
    }

    // After hooks (state mutation; no copies)
    (c as any)._src = undefined;
    for (const call of calls) {
      if (call.copy || !call.def.after) continue;
      (c as any)._src = { kind: 'charm', uid: call.owner.uid };
      call.def.after(c, call.inst);
    }
  } else if (!scoring) {
    t.streak = 0;
    // Risky wagers cost Grit when the hand is lost.
    if ((outcome === 'lose' || outcome === 'bust') && t.wager > 1) {
      const n = t.wager - 1;
      const before = run.grit;
      hurt(run, n);
      const lost = before - run.grit;
      t.gritLost += lost;
      result.gritLost = lost;
      if (lost) sink.events.push({ t: 'msg', text: `-${lost} Grit`, color: '#ff4b3a', src: { kind: 'hand' } });
    }
  }

  // Resolve hooks for every outcome.
  const rc = ctx(run, { ...base, handType }, sink);
  fireWith(rc, 'resolve');
  host?.afterHand?.(ctx(run, { ...base, handType }));

  // Ash cards that saved the hand crumble.
  for (const id of pt.ashUsed) result.crumbled.push(id);

  return result;
}

function starHand(id: string): HandTypeId | undefined {
  const map: Record<string, HandTypeId> = {
    pleiades: 'sevens', regulus: 'royal', cygnus: 'flush', corvus: 'blackjack', hydra: 'charlie',
    polaris: 'twentyone', canis: 'underdog', sagitta: 'outdraw', crater: 'dealerbust', libra: 'push',
  };
  return map[id];
}

function createConsForHand(run: Run, ht: HandTypeId): boolean {
  const star = Object.entries({
    pleiades: 'sevens', regulus: 'royal', cygnus: 'flush', corvus: 'blackjack', hydra: 'charlie',
    polaris: 'twentyone', canis: 'underdog', sagitta: 'outdraw', crater: 'dealerbust', libra: 'push',
  }).find(([, v]) => v === ht)?.[0];
  if (!star) return false;
  return createCons(run, 'star', star);
}

/** Clean up after all hands were scored. Returns the next state. */
export function endRound(run: Run, results: ScoreResult[]): 'ready' | 'won' | 'lost' | 'dead' {
  const t = run.table!;
  for (const r of results) {
    for (const id of r.shattered) {
      run.stats.glassShattered++;
      destroyCard(run, id);
    }
    for (const id of r.crumbled) {
      if (!run.deck.some((k) => k.id === id)) continue;
      destroyCard(run, id);
      t.crumbled.push(id);
      for (const k of run.charms) if (k.id === 'ash_walker' && !k.disabled) {
        k.state.m = (k.state.m ?? 0) + 3;
        run.money += 3;
        fxQueue.push({ t: 'money', v: 3, src: { kind: 'charm', uid: k.uid } });
      }
    }
  }
  // Everything on the felt goes to the discard pile.
  for (const h of t.hands) t.discard.push(...h.cards);
  t.discard.push(...t.dealer);
  t.hands = [];
  t.dealer = [];
  t.hidden = [];
  if (t.score >= t.target) {
    t.phase = 'won';
    return 'won';
  }
  if (run.grit <= 0) {
    t.phase = 'lost';
    return 'dead';
  }
  if (t.handsLeft <= 0) {
    const c = ctx(run);
    for (const k of [...run.charms]) {
      const d = CHARM[k.id];
      if (!d?.save || k.disabled) continue;
      (c as any)._src = { kind: 'charm', uid: k.uid };
      if (d.save(c, k)) {
        t.phase = 'won';
        run.flags.savedBy = k.id;
        return 'won';
      }
    }
    t.phase = 'lost';
    return 'lost';
  }
  t.phase = 'ready';
  return 'ready';
}

/** Discard the folded hand and dealer cards. */
export function endFold(run: Run) {
  const t = run.table!;
  for (const h of t.hands) t.discard.push(...h.cards);
  t.discard.push(...t.dealer);
  t.hands = [];
  t.dealer = [];
  t.hidden = [];
  t.phase = 'ready';
}

/** Is a card id currently hidden from the player? */
export function isHidden(run: Run, id: number): boolean {
  return !!run.table?.hidden.includes(id);
}

export { fire };

/** Choose the wager for the next hand: 1 = Penny (safe), 2 = Dollar, 3 = Bankroll. */
export function setWager(run: Run, w: number) {
  const t = run.table;
  if (!t || t.phase !== 'ready') return;
  t.wager = Math.max(1, Math.min(3, Math.round(w)));
}
