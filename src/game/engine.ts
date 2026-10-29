// Core run state: creation, rules, hook dispatch and the effect context.

import { Rng, hashSeed } from '../core/rng';
import type {
  Card,
  CharmInst,
  ConsKind,
  FinishId,
  HandTypeId,
  Rarity,
  Rules,
  Run,
  RunStats,
  ScoreEvent,
  Src,
  Rank,
  Suit,
} from '../core/types';
import { HAND_TYPES, RANKS, SUITS, newDeck } from '../core/cards';
import type { CharmDef, Ctx, HostDef } from './api';
import { CHARM, CHARMS, charmSlotsFree } from '../content/charms';
import { CONS, FORTUNES, MASKS, STARS } from '../content/consumables';
import { VOUCHER } from '../content/vouchers';
import { GOON_PERKS, HOST } from '../content/hosts';
import { SHOE } from '../content/shoes';
import { TAG } from '../content/tags';
import { startTownState } from './trail';

export const RUN_VERSION = 5;
export const NIGHTS = 7;

// ---------------------------------------------------------------------------
// Out-of-band effect queue (money popups, messages) for the UI to animate.
// ---------------------------------------------------------------------------

export const fxQueue: ScoreEvent[] = [];

export function drainFx(): ScoreEvent[] {
  return fxQueue.splice(0, fxQueue.length);
}

// ---------------------------------------------------------------------------
// Run creation
// ---------------------------------------------------------------------------

function emptyStats(): RunStats {
  return {
    handsPlayed: 0, handsWon: 0, blackjacks: 0, busts: 0, pushes: 0, folds: 0, bestHand: 0,
    moneyEarned: 0, cardsDrawn: 0, tablesSkipped: 0, tablesWon: 0, fortunesUsed: 0, starsUsed: 0,
    masksUsed: 0, uniqueStars: [], rerolls: 0, charmsBought: 0, charmsSold: 0, cardsSold: 0,
    packsSkipped: 0, hostsBeaten: 0, glassShattered: 0, facesDestroyed: 0, cardsFolded: 0,
  };
}

export function newRun(seed: string, shoeId: string, stake: number): Run {
  const shoe = SHOE[shoeId] ?? SHOE.paper;
  const run: Run = {
    version: RUN_VERSION,
    seed,
    rng: hashSeed(seed),
    shoeId: shoe.id,
    stake,
    night: 1,
    tableIdx: 0,
    phase: 'trail',
    grit: 10,
    maxGrit: 10,
    trail: { nodes: [], at: null },
    event: null,
    money: 4,
    deck: [],
    nextId: 1,
    charms: [],
    consumables: [],
    baseCharmSlots: 5,
    baseConsSlots: 2,
    baseHands: 6,
    baseFolds: 3,
    handLevels: Object.fromEntries(HAND_TYPES.map((h) => [h.id, 1])) as Record<HandTypeId, number>,
    handPlays: Object.fromEntries(HAND_TYPES.map((h) => [h.id, 0])) as Record<HandTypeId, number>,
    vouchers: [],
    tags: [],
    nightHost: 'kappa',
    hostsSeen: [],
    road: null,
    table: null,
    pack: null,
    cashout: null,
    lastCons: null,
    stats: emptyStats(),
    endless: false,
    flags: {},
    rotating: { rank: 7, suit: 'moon', suit2: 'flame' },
    interestCap: 5,
    log: [],
  };
  Object.assign(run, shoe.start ?? {});
  run.deck = newDeck(() => run.nextId++);
  const c = ctx(run);
  shoe.build?.(c);
  for (const v of shoe.vouchers ?? []) run.vouchers.push(v);
  for (const k of shoe.cons ?? []) run.consumables.push({ uid: run.nextId++, kind: k.kind, id: k.id });
  for (const id of shoe.charms ?? []) run.charms.push(makeCharm(run, id));
  if (stake >= 4) run.baseFolds = Math.max(0, run.baseFolds - 2);
  if (stake >= 6) { run.maxGrit -= 2; run.grit -= 2; }
  if (stake >= 7) run.baseHands = Math.max(1, run.baseHands - 1);
  run.flags.startDeckSize = run.deck.length;
  rotate(run);
  startNight(run);
  drainFx();
  return run;
}

export function rng(run: Run): Rng {
  // A thin wrapper that writes the state back to the run after each draw.
  const r = new Rng(run.rng);
  const next = r.next.bind(r);
  r.next = () => {
    r.state = run.rng;
    const v = next();
    run.rng = r.state;
    return v;
  };
  return r;
}

export function makeCharm(run: Run, id: string, finish?: FinishId): CharmInst {
  const d = CHARM[id];
  return { uid: run.nextId++, id, finish, state: d?.init ? d.init() : {} };
}

export function rotate(run: Run) {
  const r = rng(run);
  run.rotating = { rank: r.pick(RANKS) as Rank, suit: r.pick(SUITS) as Suit, suit2: r.pick(SUITS) as Suit };
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

export function has(run: Run, charmId: string): boolean {
  return run.charms.some((k) => k.id === charmId && !k.disabled);
}

export function hasVoucher(run: Run, id: string): boolean {
  return run.vouchers.includes(id);
}

export function activeCharms(run: Run): CharmInst[] {
  return run.charms.filter((k) => !k.disabled);
}

function sumSlots(run: Run, key: 'charm' | 'cons' | 'hands' | 'folds' | 'interest' | 'shop'): number {
  let n = 0;
  for (const v of run.vouchers) n += (VOUCHER[v]?.slots as Record<string, number> | undefined)?.[key] ?? 0;
  if (key !== 'shop') for (const k of activeCharms(run)) n += (CHARM[k.id]?.slots as Record<string, number> | undefined)?.[key] ?? 0;
  return n;
}

/** Max Grit. Iron Gizzard counts even while an Outlaw has it switched off for a table. */
export function gritCapOf(run: Run): number {
  return run.maxGrit + (run.charms.some((k) => k.id === 'iron_gizzard') ? 4 : 0);
}

/** Losing a max-Grit ability (or max Grit itself) takes the extra Grit with it. */
export function clampGrit(run: Run) {
  run.grit = Math.min(run.grit, gritCapOf(run));
}

export function charmSlots(run: Run): number {
  return run.baseCharmSlots + sumSlots(run, 'charm') + run.charms.filter((k) => k.finish === 'phantom').length;
}

export function consSlots(run: Run): number {
  return run.baseConsSlots + sumSlots(run, 'cons') + run.consumables.filter((k) => k.finish === 'phantom').length;
}

export function shopSlots(run: Run): number {
  return 2 + sumSlots(run, 'shop');
}

export function interestCap(run: Run): number {
  if (run.shoeId === 'jade') return 0;
  let cap = run.interestCap + sumSlots(run, 'interest');
  if (run.stake >= 8) cap = Math.min(cap, 3);
  return cap;
}

export function handsPerTable(run: Run): number {
  const host = currentHost(run);
  if (host?.hands) return host.hands;
  return Math.max(1, run.baseHands + sumSlots(run, 'hands'));
}

export function foldsPerTable(run: Run): number {
  const host = currentHost(run);
  let n = run.baseFolds + sumSlots(run, 'folds');
  if (host?.folds) n += host.folds;
  return Math.max(0, n);
}

export function debtLimit(run: Run): number {
  return has(run, 'iou_note') ? -20 : 0;
}

export function currentHost(run: Run) {
  const t = run.table;
  if (!t || !t.hostId) return null;
  if (t.hostDisabled || has(run, 'shrine_guardian')) return null;
  return HOST[t.hostId] ?? null;
}

const NIGHT_BASE = [160, 270, 400, 710, 1200, 1700, 3700];

export function nightBase(run: Run, night = run.night): number {
  let base: number;
  if (night <= NIGHT_BASE.length) base = NIGHT_BASE[night - 1];
  else {
    const k = night - NIGHT_BASE.length;
    base = NIGHT_BASE[NIGHT_BASE.length - 1] * Math.pow(2.6, k) * Math.pow(1.08, k * k);
  }
  if (run.stake >= 3) base *= 1 + 0.06 * (night - 1);
  if (run.stake >= 5) base *= 1 + 0.05 * (night - 1);
  if (run.stake >= 8) base *= 1.25;
  base *= SHOE[run.shoeId]?.scale ?? 1;
  return roundTarget(base);
}

function roundTarget(n: number): number {
  if (n < 1000) return Math.round(n / 10) * 10;
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / mag) * mag;
}

export function getRules(run: Run): Rules {
  const r: Rules = {
    bustLimit: 21,
    dealerStand: 17,
    // House rule: the dealer stands on a hard 17 and hits a soft one.
    dealerHitSoft17: true,
    dealerHitsToBust: false,
    charlieSize: 5,
    canDouble: true,
    canSplit: true,
    canFold: true,
    doubleCost: 1,
    splitCost: 1,
    doubleX: 2,
    seeHole: false,
    seeTop: 0,
    aceLow: false,
    plusOne: false,
    faceValue: 10,
    dealerWinsTies: false,
    // Any two 10-value cards (10, J, Q, K) count as a pair you can split.
    splitAnyTen: true,
    smeared: false,
    allFace: false,
    firstCardDown: false,
    faceCardsDown: false,
    dealerUpDown: false,
    insurance: false,
    pushIsWin: false,
    minCardsToScore: 0,
    oneHandType: false,
    noRepeatType: false,
    dealerBustScoresZero: false,
    blackjackAsOutdraw: false,
    mustHit: false,
    halveBase: false,
    probMult: 1,
    hitCost: 0,
    handCost: 0,
    maxHits: 99,
    splitAces21: false,
  };
  // Wanted levels, before anything you carry gets a say.
  if (run.stake >= 2) r.dealerWinsTies = true;
  if (run.stake >= 4) r.charlieSize += 1;
  for (const v of run.vouchers) VOUCHER[v]?.rules?.(r, run);
  SHOE[run.shoeId]?.rules?.(r, run);
  for (const k of activeCharms(run)) CHARM[k.id]?.rules?.(r, k, run);
  currentHost(run)?.rules?.(r, run);
  // A henchman's side ability, if he has one.
  const t = run.table;
  if (t?.kind === 'gang' && t.goonId) GOON_PERKS[t.goonId]?.rules(r);
  return r;
}

// ---------------------------------------------------------------------------
// Effect context
// ---------------------------------------------------------------------------

export interface ScoreSink {
  events: ScoreEvent[];
  chips: number;
  mult: number;
}

export function ctx(run: Run, opts: Partial<Ctx> = {}, sink?: ScoreSink, src: Src = { kind: 'deck' }): Ctx {
  const r = rng(run);
  const rules = getRules(run);
  const push = (e: ScoreEvent) => (sink ? sink.events.push(e) : fxQueue.push(e));
  const c: Ctx = {
    run,
    table: run.table,
    rules,
    rng: r,
    cards: [],
    scored: [],
    total: 0,
    dealerTotal: 0,
    dealerCards: [],
    dealerBusted: false,
    isFirst: false,
    isLast: false,
    copy: false,
    ...opts,
    chips(n) {
      if (!sink || !n) return;
      sink.chips += n;
      push({ t: 'chips', v: n, src: (c as any)._src ?? src, chips: sink.chips, mult: sink.mult });
    },
    mult(n) {
      if (!sink || !n) return;
      sink.mult += n;
      push({ t: 'mult', v: n, src: (c as any)._src ?? src, chips: sink.chips, mult: sink.mult });
    },
    xmult(n) {
      if (!sink || n === 1) return;
      sink.mult *= n;
      push({ t: 'xmult', v: n, src: (c as any)._src ?? src, chips: sink.chips, mult: sink.mult });
    },
    money(n) {
      if (!n) return;
      run.money += n;
      if (n > 0) run.stats.moneyEarned += n;
      push({ t: 'money', v: n, src: (c as any)._src ?? src });
    },
    msg(text, color) {
      push({ t: 'msg', text, color, src: (c as any)._src ?? src });
    },
    chance(n) {
      return r.next() < Math.min(1, rules.probMult / n);
    },
    addCard(p) {
      const card: Card = {
        rank: p.rank ?? r.pick(RANKS),
        suit: p.suit ?? r.pick(SUITS),
        id: run.nextId++,
      };
      if (p.ink) card.ink = p.ink;
      if (p.seal) card.seal = p.seal;
      if (p.finish) card.finish = p.finish;
      if (p.bonus) card.bonus = p.bonus;
      run.deck.push(card);
      if (run.table) run.table.discard.push(card.id);
      fire(run, 'cardAdded', card);
      return card;
    },
    destroyCard(id) {
      destroyCard(run, id);
    },
    createCons(kind, id, finish) {
      return createCons(run, kind, id, finish);
    },
    createCharm(o = {}) {
      return createCharm(run, o);
    },
    destroyCharm(uid) {
      destroyCharm(run, uid);
    },
    levelUp(ht, n = 1) {
      run.handLevels[ht] = Math.max(1, run.handLevels[ht] + n);
      push({ t: 'msg', text: `${HAND_TYPES.find((h) => h.id === ht)?.name} Lv.${run.handLevels[ht]}`, color: '#9fc7ff', src: { kind: 'hand' } });
    },
    addTag(id) {
      addTag(run, id);
    },
  };
  return c;
}

/** Charms in trigger order, resolving Tracing Paper / Echoing Mirror. */
export function charmCalls(run: Run): { inst: CharmInst; def: CharmDef; owner: CharmInst; copy: boolean }[] {
  const out: { inst: CharmInst; def: CharmDef; owner: CharmInst; copy: boolean }[] = [];
  const list = run.charms;
  const resolve = (i: number, depth: number): number => {
    if (depth > list.length) return -1;
    const k = list[i];
    if (!k || k.disabled) return -1;
    if (k.id === 'tracing_paper') return resolve(i + 1, depth + 1);
    if (k.id === 'echo_mirror') return i === 0 ? -1 : resolve(0, depth + 1);
    return i;
  };
  list.forEach((k, i) => {
    if (k.disabled) return;
    const def = CHARM[k.id];
    if (!def) return;
    if (k.id === 'tracing_paper' || k.id === 'echo_mirror') {
      const t = resolve(i, 0);
      if (t < 0 || t === i) return;
      const target = list[t];
      const tdef = CHARM[target.id];
      if (!tdef || tdef.noCopy) return;
      out.push({ inst: target, def: tdef, owner: k, copy: true });
      return;
    }
    out.push({ inst: k, def, owner: k, copy: false });
  });
  return out;
}

type HookName =
  | 'after' | 'resolve' | 'deal' | 'hit' | 'fold' | 'double' | 'split' | 'tableStart' | 'tableEnd'
  | 'shopEnter' | 'shopLeave' | 'reroll' | 'sold' | 'anySold' | 'useCons' | 'packOpen' | 'packSkip'
  | 'tableSkip' | 'cardAdded' | 'cardDestroyed' | 'charmDestroyed' | 'hostBeaten';

/** Fire a simple hook on every charm (no copying for non-scoring hooks besides money/msgs). */
export function fire(run: Run, hook: HookName, ...args: any[]) {
  const c = ctx(run);
  for (const k of [...run.charms]) {
    if (k.disabled || !run.charms.includes(k)) continue;
    const fn = CHARM[k.id]?.[hook] as ((...a: any[]) => void) | undefined;
    if (!fn) continue;
    (c as any)._src = { kind: 'charm', uid: k.uid };
    fn(c, k, ...args);
  }
}

/** Fire a hook with a pre-built context (used by the table flow). */
export function fireWith(c: Ctx, hook: HookName, ...args: any[]) {
  for (const call of charmCalls(c.run)) {
    if (!c.run.charms.includes(call.owner)) continue;
    const fn = call.def[hook] as ((...a: any[]) => void) | undefined;
    if (!fn) continue;
    // Only scoring-ish hooks propagate through copies.
    if (call.copy && !['resolve', 'deal', 'tableStart', 'fold'].includes(hook)) continue;
    (c as any)._src = { kind: 'charm', uid: call.owner.uid };
    c.copy = call.copy;
    fn(c, call.inst, ...args);
  }
  c.copy = false;
  (c as any)._src = undefined;
}

// ---------------------------------------------------------------------------
// Creation / destruction
// ---------------------------------------------------------------------------

export function destroyCard(run: Run, id: number) {
  const i = run.deck.findIndex((k) => k.id === id);
  if (i < 0) return;
  const [card] = run.deck.splice(i, 1);
  const t = run.table;
  if (t) {
    t.shoe = t.shoe.filter((x) => x !== id);
    t.discard = t.discard.filter((x) => x !== id);
    t.dealer = t.dealer.filter((x) => x !== id);
    for (const h of t.hands) h.cards = h.cards.filter((x) => x !== id);
  }
  if (card.ink !== 'stone' && card.rank >= 11 && card.rank <= 13) run.stats.facesDestroyed++;
  fire(run, 'cardDestroyed', card);
}

export function createCons(run: Run, kind: ConsKind, id?: string, finish?: FinishId): boolean {
  if (finish !== 'phantom' && run.consumables.length >= consSlots(run)) return false;
  const r = rng(run);
  let pickId = id;
  if (!pickId) {
    if (kind === 'fortune') pickId = r.pick(FORTUNES).id;
    else if (kind === 'star') pickId = r.pick(STARS).id;
    else pickId = r.pick(MASKS.filter((m) => m.id !== 'silent_mask')).id;
  }
  if (!CONS[pickId]) return false;
  run.consumables.push({ uid: run.nextId++, kind, id: pickId, finish });
  return true;
}

/** Anything that used to hand out a Doodad now hands over a random Boon on the spot (or $6 when
 *  the belt is full), so events never add another fork in the road. */
export function createCharm(run: Run, _o: { rarity?: Rarity; id?: string; finish?: FinishId; force?: boolean } = {}): boolean {
  const pool = CHARMS.filter((d) => !d.bane && d.rarity === 1 && !run.charms.some((k) => k.id === d.id));
  if (run.charms.length >= charmSlots(run) || !pool.length) {
    run.money += 6;
    fxQueue.push({ t: 'money', v: 6, src: { kind: 'deck' } });
    return true;
  }
  const d = rng(run).pick(pool);
  run.charms.push(makeCharm(run, d.id));
  discover(run, 'charm', d.id);
  fxQueue.push({ t: 'msg', text: `${d.name}!`, color: '#7fe07a', src: { kind: 'deck' } });
  return true;
}

export function destroyCharm(run: Run, uid: number) {
  const k = run.charms.find((x) => x.uid === uid);
  if (!k) return;
  if (has(run, 'shimenawa') && k.id !== 'shimenawa' && !run.flags.selling) {
    fxQueue.push({ t: 'msg', text: 'Protected!', src: { kind: 'charm', uid } });
    return;
  }
  run.charms = run.charms.filter((x) => x.uid !== uid);
  clampGrit(run);
  fxQueue.push({ t: 'destroyCharm', uid });
  fire(run, 'charmDestroyed');
}

export function addTag(run: Run, id: string) {
  if (!TAG[id]) return;
  // Double tokens copy the next token taken.
  const doubles = run.tags.filter((t) => t.id === 'double');
  if (id !== 'double' && doubles.length) {
    run.tags = run.tags.filter((t) => t.id !== 'double');
    for (let i = 0; i < doubles.length; i++) pushTag(run, id);
  }
  pushTag(run, id);
}

function pushTag(run: Run, id: string) {
  const def = TAG[id];
  const inst = { uid: run.nextId++, id };
  discover(run, 'tag', id);
  if (def.when === 'now') {
    if (def.apply(ctx(run))) return;
  }
  run.tags.push(inst);
}

export function fireTags(run: Run, when: 'shop' | 'tableStart' | 'hostBeaten') {
  const keep = [];
  for (const t of run.tags) {
    const def = TAG[t.id];
    if (def?.when === when) {
      fxQueue.push({ t: 'msg', text: def.name, color: def.hue, src: { kind: 'deck' } });
      if (def.apply(ctx(run))) continue;
    }
    keep.push(t);
  }
  run.tags = keep;
}

// ---------------------------------------------------------------------------
// Nights
// ---------------------------------------------------------------------------

export function startNight(run: Run) {
  startTownState(run);
}

export function availableVouchers(run: Run): string[] {
  return Object.values(VOUCHER)
    .filter((v) => !run.vouchers.includes(v.id) && (!v.requires || run.vouchers.includes(v.requires)))
    .map((v) => v.id);
}

/** Outlaws who may run the current town: showdown bosses every 7th town, otherwise the tier
 *  matching the town (tiers 4-6 once the run goes endless). Prefers ones not met this run. */
export function outlawPool(run: Run, exclude: string[] = []): HostDef[] {
  const showdown = run.night % NIGHTS === 0;
  const fits = (h: HostDef) =>
    !!h.showdown === showdown && (showdown || (run.night < NIGHTS ? h.minNight === Math.min(run.night, 6) : h.minNight >= 4));
  const all = Object.values(HOST).filter((h) => !h.rare && fits(h) && !exclude.includes(h.id));
  const fresh = all.filter((h) => !run.hostsSeen.includes(h.id));
  return fresh.length ? fresh : all;
}

export function rerollHost(run: Run) {
  const r = rng(run);
  const pool = outlawPool(run, [run.nightHost]);
  if (!pool.length) return;
  run.nightHost = r.pick(pool).id;
  if (!run.hostsSeen.includes(run.nightHost)) run.hostsSeen.push(run.nightHost);
  for (const n of run.trail.nodes) if (!n.done && (n.kind === 'outlaw' || n.kind === 'gang' || n.kind === 'bank')) n.hostId = run.nightHost;
}

// ---------------------------------------------------------------------------
// Discovery (collection), stored in the profile by the UI layer.
// ---------------------------------------------------------------------------

export type DiscoverKind = 'charm' | 'cons' | 'voucher' | 'tag' | 'host';
export const discovered: { list: [DiscoverKind, string][] } = { list: [] };
export function discover(_run: Run, kind: DiscoverKind, id: string) {
  discovered.list.push([kind, id]);
}

export function log(run: Run, msg: string) {
  run.log.push(msg);
  if (run.log.length > 60) run.log.shift();
}

export { CONS };

/** How the dealer plays under these rules, in a few words: "stands on hard 17, hits soft 17". */
export function dealerRuleText(r: Rules): string {
  if (r.dealerHitsToBust) return 'hits until he busts';
  if (r.dealerStand > 17) return `draws to ${r.dealerStand}`;
  if (r.dealerStand < 17) return `stands on ${r.dealerStand}`;
  return r.dealerHitSoft17 ? 'stands on hard 17, hits soft 17' : 'stands on all 17s';
}
