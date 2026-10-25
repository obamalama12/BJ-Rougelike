// A bot that actually plays around its Doodads. Every buying decision is tested first: it copies
// the run, plays practice hands with and without the candidate on the same shuffled cards, and
// only keeps what really raises its score. It also orders its Doodads, saves for interest,
// spends Tall Tales and campfires on the hands it really wins with, and wagers big only when
// it's behind the target.

import type { HandTypeId, Run, TrailNode } from '../src/core/types';
import { makeCharm, charmSlots, nightBase, rng } from '../src/game/engine';
import { startTable } from '../src/game/table';
import { buyItem, buyPack, buyVoucher, moveCharm, pickFromPack, reroll, rerollPrice, sellCharm, skipPack, useCons, voucherPrice } from '../src/game/shop';
import { campRest, campYarn, isTableNode, nodeTarget } from '../src/game/trail';
import { HAND_TYPES } from '../src/core/cards';
import { CONS } from '../src/content/consumables';
import { playHand, type Strategy } from './simulate';

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
    c.shop = null;
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

/** Where in the belt a new Doodad scores best (order matters: Doodads trigger left to right). */
function bestSlot(run: Run, id: string, finish?: string): { pos: number; value: number } {
  let best = { pos: run.charms.length, value: -Infinity };
  const positions = new Set([0, run.charms.length, Math.floor(run.charms.length / 2)]);
  for (const pos of positions) {
    const v = practice(run, (c) => c.charms.splice(pos, 0, makeCharm(c, id, finish as any)));
    if (v > best.value) best = { pos, value: v };
  }
  return best;
}

/** How much each owned Doodad is worth: the score lost by selling it. */
function worstCharm(run: Run, base: number): { uid: number; loss: number } | null {
  let worst: { uid: number; loss: number } | null = null;
  for (const k of run.charms) {
    const v = base - practice(run, (c) => { c.charms = c.charms.filter((x) => x.uid !== k.uid); });
    if (!worst || v < worst.loss) worst = { uid: k.uid, loss: v };
  }
  return worst;
}

/** Keep $25 for interest once the run gets going, unless a buy is clearly worth it. */
const reserve = (run: Run) => (run.night >= 2 ? 25 : 0);

function smartShop(run: Run) {
  const s = run.shop!;
  for (let step = 0; step < 8; step++) {
    const base = practice(run);
    const full = run.charms.length >= charmSlots(run);
    const worst = full ? worstCharm(run, base) : null;
    let pick: { gain: number; act: () => void; price: number } | null = null;
    for (const it of s.items) {
      if (it.sold || it.price > run.money) continue;
      if (it.kind === 'charm') {
        const slot = full
          ? (() => {
              const w = worst!;
              const v = practice(run, (c) => { c.charms = c.charms.filter((x) => x.uid !== w.uid); c.charms.push(makeCharm(c, it.id, it.finish)); });
              return { pos: -1, value: v };
            })()
          : bestSlot(run, it.id, it.finish);
        const gain = slot.value - base;
        if (gain > 0 && (!pick || gain / it.price > pick.gain / pick.price))
          pick = {
            gain, price: it.price,
            act: () => {
              if (full) sellCharm(run, worst!.uid);
              if (!buyItem(run, it.uid).ok) return;
              const k = run.charms[run.charms.length - 1];
              if (slot.pos >= 0) moveCharm(run, k.uid, slot.pos);
            },
          };
      } else if (it.kind === 'cons' && !CONS[it.id]?.targets) {
        const gain = practice(run, (c) => { c.consumables.push({ uid: 1e9, kind: it.cons, id: it.id }); useCons(c, 1e9); }) - base;
        if (gain > 0 && (!pick || gain / it.price > pick.gain / pick.price))
          pick = { gain, price: it.price, act: () => void buyItem(run, it.uid, true) };
      }
    }
    // Is it worth dipping below the interest reserve? Only for a big jump.
    if (pick && (run.money - pick.price >= reserve(run) || pick.gain > base * 0.12) && pick.gain > base * 0.02) {
      pick.act();
      continue;
    }
    // Crates: Doodad crates while there's room, Tall Tale crates otherwise.
    const pack = s.packs.find((p) => !p.sold && p.price <= run.money - reserve(run) &&
      ((p.packId.startsWith('charm') && !full) || p.packId.startsWith('star')));
    if (pack) {
      if (buyPack(run, pack.uid).ok) smartPack(run);
      continue;
    }
    if (s.voucher && run.money - voucherPrice(run, s.voucher) >= reserve(run)) {
      buyVoucher(run);
      continue;
    }
    if (run.money - rerollPrice(run) >= reserve(run) + 8 && s.rerollsDone < 3) {
      reroll(run);
      continue;
    }
    break;
  }
  for (const k of [...run.consumables]) if (k.kind === 'star' || !CONS[k.id]?.targets) useCons(run, k.uid);
}

function smartPack(run: Run) {
  let g = 0;
  while (run.pack && g++ < 10) {
    const p = run.pack;
    const base = practice(run);
    let best = -1;
    let bestV = 0;
    p.options.forEach((o, i) => {
      if (o.taken) return;
      let v = -Infinity;
      if (o.kind === 'charm' && run.charms.length < charmSlots(run)) v = bestSlot(run, o.id, o.finish).value - base;
      else if (o.kind === 'cons' && !CONS[o.id]?.targets) v = practice(run, (c) => { c.consumables.push({ uid: 1e9, kind: o.cons, id: o.id }); useCons(c, 1e9); }) - base;
      if (v > bestV) { bestV = v; best = i; }
    });
    if (best < 0 || !pickFromPack(run, best).ok) { skipPack(run); continue; }
    const o = p.options[best];
    if (o.kind === 'charm') {
      const k = run.charms[run.charms.length - 1];
      moveCharm(run, k.uid, bestSlot(run, k.id, k.finish).pos);
    }
  }
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
  if (run.money >= 10) { const st = by('store'); if (st) return st; }
  const tables = opts.filter(isTableNode);
  if (tables.length) {
    // The richest table we can comfortably beat; otherwise the easiest one.
    const power = strength(run);
    const ok = tables.filter((n) => power >= nodeTarget(run, n) * 1.4);
    const pay = { outlaw: 9, bank: 8, gang: 7, highstakes: 5, saloon: 3 } as Record<string, number>;
    if (ok.length) return ok.sort((a, b) => (pay[b.kind] ?? 0) - (pay[a.kind] ?? 0))[0];
    return tables.sort((a, b) => nodeTarget(run, a) - nodeTarget(run, b))[0];
  }
  return by('camp') ?? by('event') ?? by('store') ?? opts[0];
}

function smartCamp(run: Run) {
  if (run.grit <= 6) return campRest(run);
  // Level up the hand type we score with most.
  const best = [...HAND_TYPES].sort((a, b) => (run.handPlays[b.id as HandTypeId] ?? 0) - (run.handPlays[a.id as HandTypeId] ?? 0))[0];
  campYarn(run, best.id);
}

export const smartParts = { pickNode: smartNode, wager: smartWager, shop: smartShop, pack: smartPack, camp: smartCamp };

export const smartStrategy: Strategy = {
  pickNode: smartNode,
  wager: smartWager,
  shop: smartShop,
  pack: smartPack,
  camp: smartCamp,
};
