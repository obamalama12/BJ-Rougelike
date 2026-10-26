// A bot that plays around its abilities. Paths are unmarked, so it can't do better than a blind
// pick there; where it can think is what to leave behind when the belt is full. For that it copies
// the run, plays practice hands without each candidate on the same shuffled cards, and drops the
// one it misses least. It also wagers big only when it's behind the target, picks tables it can
// beat, and spends campfires shedding Banes or levelling up the hands it wins with.

import type { HandTypeId, Run, TrailNode } from '../src/core/types';
import { nightBase, rng } from '../src/game/engine';
import { startTable } from '../src/game/table';
import { campForget, campRest, campYarn, isTableNode, nodeTarget } from '../src/game/trail';
import { HAND_TYPES } from '../src/core/cards';
import { CHARM } from '../src/content/charms';
import { packBot, playHand, roadBot, type Strategy } from './simulate';

/** Copy a run without the simulator's log. */
function copy(run: Run): Run {
  const log = (run as any).__log;
  (run as any).__log = undefined;
  const c = structuredClone(run);
  (run as any).__log = log;
  return c;
}

/** Score from a few practice tables after `mutate`, plus the Bucks it made (money buys Doodads). */
function practice(run: Run, mutate?: (c: Run) => void, reps = 3): number {
  let total = 0;
  for (let rep = 0; rep < reps; rep++) {
    const c = copy(run);
    // Same shuffles for every candidate (common random numbers), different ones per rep.
    c.rng = (Math.imul(run.night * 7 + rep + 1, 0x9e3779b1) ^ run.nextId) >>> 0;
    c.road = null;
    c.pack = null;
    c.grit = 99;
    mutate?.(c);
    const m0 = c.money;
    startTable(c, 'paper', 1e18);
    let guard = 0;
    while (c.table && c.table.phase === 'ready' && guard++ < 20) {
      c.table.wager = 1;
      playHand(c);
    }
    total += (c.table?.score ?? 0) + (c.money - m0) * nightBase(run) * 0.05;
  }
  return total / reps;
}

/** With a full belt: leave behind whichever ability the practice hands miss least. */
function smartDrop(run: Run, keep: number): number {
  let best = { uid: -1, value: -Infinity };
  for (const k of run.charms) {
    if (k.uid === keep) continue;
    const v = practice(run, (c) => { c.charms = c.charms.filter((x) => x.uid !== k.uid); });
    if (v > best.value) best = { uid: k.uid, value: v };
  }
  return best.uid;
}

/** Score per hand at the current table, from practice play of the real table (curse and all). */
function tableEstimate(run: Run): number {
  let total = 0;
  let hands = 0;
  for (let rep = 0; rep < 3; rep++) {
    const c = copy(run);
    c.rng = (c.rng + 0x9e3779b1 * (rep + 1)) >>> 0;
    c.grit = 99;
    const t = c.table!;
    // The bot doesn't know the order of the cards still in the shoe: reshuffle them in the copy,
    // or its practice hands would peek at the real upcoming cards.
    t.shoe = rng(c).shuffle(t.shoe);
    t.target = 1e18;
    const s0 = t.score;
    let guard = 0;
    while (c.table && c.table.phase === 'ready' && guard++ < 20) { c.table.wager = 1; playHand(c); hands++; }
    total += (c.table?.score ?? 0) - s0;
  }
  return hands ? total / hands : 0;
}

const estimates = new WeakMap<object, number>();

function smartWager(run: Run): number {
  const t = run.table!;
  if (!estimates.has(t)) estimates.set(t, tableEstimate(run));
  const per = Math.max(1, estimates.get(t)!);
  const need = t.target - t.score;
  const left = Math.max(1, t.handsLeft);
  const fail = TABLE_FAIL[t.kind] ?? 2;
  // The smallest wager that makes the target reachable, if we can afford to lose a few hands at it.
  // A hopeless table is cheaper to just lose than to bleed Grit on big bets.
  for (const w of [1, 2, 3]) {
    if (per * w * left < need * 1.1) continue;
    const risk = (w - 1) * Math.ceil(left * 0.5);
    return w === 1 || run.grit - risk > fail + 2 ? w : 1;
  }
  return 1;
}

/** Grit lost for failing each kind of table. */
const TABLE_FAIL: Record<string, number> = { paper: 2, silk: 3, bank: 3, gang: 2, host: 4 };

function strength(run: Run): number {
  return practice(run, undefined, 2);
}

function smartNode(run: Run, opts: TrailNode[]): TrailNode {
  const by = (k: string) => opts.find((n) => n.kind === k);
  if (run.grit <= 5) { const heal = by('doc') ?? by('camp'); if (heal) return heal; }
  const tables = opts.filter(isTableNode);
  if (tables.length) {
    // The richest table we can comfortably beat; otherwise the easiest one.
    const power = strength(run);
    const ok = tables.filter((n) => power >= nodeTarget(run, n) * 1.4);
    const pay = { outlaw: 9, bank: 8, gang: 7, highstakes: 5, saloon: 3 } as Record<string, number>;
    if (ok.length) return ok.sort((a, b) => (pay[b.kind] ?? 0) - (pay[a.kind] ?? 0))[0];
    return tables.sort((a, b) => nodeTarget(run, a) - nodeTarget(run, b))[0];
  }
  return by('camp') ?? by('event') ?? opts[0];
}

function smartCamp(run: Run) {
  if (run.grit <= 6) return campRest(run);
  if (run.charms.some((k) => CHARM[k.id]?.bane)) return void campForget(run);
  // Level up the hand type we score with most.
  const best = [...HAND_TYPES].sort((a, b) => (run.handPlays[b.id as HandTypeId] ?? 0) - (run.handPlays[a.id as HandTypeId] ?? 0))[0];
  campYarn(run, best.id);
}

export const smartParts = { pickNode: smartNode, wager: smartWager, road: (run: Run) => roadBot(run, smartDrop), pack: packBot, camp: smartCamp };

export const smartStrategy: Strategy = smartParts;
