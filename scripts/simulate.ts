// Headless balance simulation: plays many runs with a simple bot.
// Usage: npm run sim -- [runs] [shoe] [stake]

import { newRun, getRules, NIGHTS } from '../src/game/engine';
import {
  afterDeal, availableActions, beginHand, cardsOf, dealTo, dealerHit, dealerShouldHit, double, endFold,
  endRound, fillSplit, fold, hit, scoreHand, settleOutcomes, settleSplit, split, stand,
} from '../src/game/table';
import { cashOut, failTable, pickFromPack, skipPack, winTable, maybeOpenTagPack } from '../src/game/shop';
import { dropAbility, leaveRoad, takeRoad } from '../src/game/roads';
import { reachable, travel, docPatch, campRest, chooseEvent, resolveDuel, finishNode, isTableNode } from '../src/game/trail';
import { EVENT } from '../src/content/events';
import { CHARM } from '../src/content/charms';
import { handTotal } from '../src/core/cards';
import type { Run, TrailNode } from '../src/core/types';
import { CONS } from '../src/content/consumables';

export function botTurn(run: Run) {
  const t = run.table!;
  let guard = 0;
  while (t.phase === 'player' && guard++ < 50) {
    const h = t.hands[t.active];
    const rules = getRules(run);
    const tot = handTotal(cardsOf(run, h.cards), rules);
    const up = cardsOf(run, t.dealer)[0];
    const upv = up.rank === 14 ? 11 : up.rank >= 10 ? 10 : up.rank;
    const a = availableActions(run);
    const cs = cardsOf(run, h.cards);
    if (a.split && cs.length === 2 && (cs[0].rank === 14 || cs[0].rank === 8)) {
      const ni = split(run);
      fillSplit(run, t.active);
      fillSplit(run, ni);
      settleSplit(run);
      continue;
    }
    if (a.fold && h.cards.length === 2 && tot.total >= 12 && tot.total <= 16 && !tot.soft && upv >= 7) {
      fold(run);
      return;
    }
    if (a.double && (tot.total === 10 || tot.total === 11) && upv < 10 && t.handsLeft >= 2) {
      double(run);
      continue;
    }
    let wantHit: boolean;
    if (tot.soft) wantHit = tot.total <= 17;
    else if (tot.total <= 11) wantHit = true;
    else if (tot.total <= 16) wantHit = upv >= 7;
    else wantHit = false;
    if (!a.stand) wantHit = true;
    if (wantHit && a.hit) hit(run);
    else stand(run);
  }
}

export function playHand(run: Run): 'ready' | 'won' | 'lost' | 'dead' {
  beginHand(run);
  dealTo(run, 'player');
  dealTo(run, 'dealer');
  dealTo(run, 'player');
  dealTo(run, 'dealer');
  afterDeal(run);
  botTurn(run);
  const t = run.table!;
  if (t.phase === 'resolved' && t.hands[0]?.outcome === 'fold') {
    endFold(run);
    return 'ready';
  }
  let dg = 0;
  while (dealerShouldHit(run)) {
    dealerHit(run);
    if (++dg > 60) {
      const tb = run.table!;
      throw new Error(`stuck dealer: town ${run.night} ${tb.kind}/${tb.hostId} dealer ${tb.dealer.length} shoe ${tb.shoe.length} discard ${tb.discard.length} deck ${run.deck.length}`);
    }
  }
  settleOutcomes(run);
  const results = t.hands.map((_, i) => scoreHand(run, i));
  return endRound(run, results);
}

/** Forks in the road: the paths are unmarked (and offered in shuffled order), so take the first; with a full belt, drop a Bane
 *  if there is one (the oldest), otherwise the oldest ability. */
export function roadBot(run: Run, drop: (run: Run, keep: number) => number = dropBane) {
  let guard = 0;
  while (run.phase === 'road' && run.road && guard++ < 20) {
    const road = run.road;
    if (!road.taken) takeRoad(run, road.options[0]);
    while (run.road?.mustDrop && guard++ < 20) dropAbility(run, drop(run, run.road.mustDrop));
    leaveRoad(run);
  }
}

export function dropBane(run: Run, keep: number): number {
  const others = run.charms.filter((k) => k.uid !== keep);
  return (others.find((k) => CHARM[k.id]?.bane) ?? others[0]).uid;
}

export function packBot(run: Run) {
  let g = 0;
  while (run.pack && g++ < 10) {
    const p = run.pack;
    let best = -1;
    let score = -1;
    p.options.forEach((o, i) => {
      if (o.taken) return;
      const v = o.kind === 'cons' && !CONS[o.id]?.targets ? 5 : -1;
      if (v > score) { score = v; best = i; }
    });
    if (best < 0 || !pickFromPack(run, best).ok) skipPack(run);
  }
}

/** The decisions a bot makes outside the hand-by-hand blackjack play. */
export interface Strategy {
  pickNode(run: Run, opts: TrailNode[]): TrailNode;
  /** Called before every hand to set the wager. */
  wager(run: Run): number;
  road(run: Run): void;
  pack(run: Run): void;
  camp(run: Run): void;
}

/** The original bot: basic blackjack, picks paths blind, drops Banes first, rests at camp. */
export const basicStrategy: Strategy = {
  pickNode: (run, opts) =>
    // Prefer: doc/camp when hurt, otherwise card games.
    (run.grit <= 5 && opts.find((n) => n.kind === 'doc' || n.kind === 'camp')) ||
    opts.find((n) => isTableNode(n)) ||
    opts[0],
  // Wager boldly while healthy.
  wager: (run) => (process.env.WAGER ? Number(process.env.WAGER) : run.grit >= 7 ? 2 : 1),
  road: (run) => roadBot(run),
  pack: packBot,
  camp: campRest,
};

export interface TableLog { night: number; kind: string; host?: string; target: number; score: number; hands: number; won: boolean; grit: number; gritAfter: number; money: number; charms: number; best: number }
export interface StopLog { night: number; kind: string; grit: number; money: number }

export function simulate(seed: string, shoe = 'paper', stake = 1, forceHost?: string, bot: Strategy = basicStrategy) {
  const run = newRun(seed, shoe, stake);
  let forcedTown = 0;
  const tables: TableLog[] = [];
  const stops: StopLog[] = [];
  (run as any).__log = { tables, stops };
  let guard = 0;
  while (guard++ < 4000) {
    if (forceHost && run.phase === 'trail' && forcedTown !== run.night && run.night >= 2 && run.night <= 5) {
      // Balance probe: put one Outlaw (and their curse) on every cursed stop of this town.
      forcedTown = run.night;
      run.nightHost = forceHost;
      for (const n of run.trail.nodes) if (n.kind === 'outlaw' || n.kind === 'gang' || n.kind === 'bank') n.hostId = forceHost;
    }
    if (run.phase === 'trail') {
      if (maybeOpenTagPack(run)) { bot.pack(run); continue; }
      const pick = bot.pickNode(run, reachable(run));
      stops.push({ night: run.night, kind: pick.kind, grit: run.grit, money: run.money });
      travel(run, pick.id);
    } else if (run.phase === 'table') {
      let r: string = 'ready';
      const grit0 = run.grit;
      let hands = 0;
      let best = 0;
      while (r === 'ready') {
        run.table!.wager = bot.wager(run);
        const before = run.table!.score;
        r = playHand(run);
        hands++;
        if (hands > 500) {
          const tb = run.table!;
          throw new Error(`stuck table: ${seed} town ${run.night} ${tb.kind}/${tb.hostId} handsLeft ${tb.handsLeft} folds ${tb.foldsLeft} phase ${tb.phase} outcome ${tb.hands.map((h) => h.outcome)}`);
        }
        if (run.table) best = Math.max(best, run.table.score - before);
      }
      const t = run.table!;
      const log: TableLog = { night: run.night, kind: t.kind, host: t.hostId, target: t.target, score: t.score, hands, won: r === 'won', grit: grit0, gritAfter: run.grit, money: run.money, charms: run.charms.length, best };
      tables.push(log);
      if (r === 'dead') return { night: run.night, won: false, run };
      if (r === 'won') winTable(run);
      else failTable(run);
      log.gritAfter = run.grit;
    } else if (run.phase === 'cashout') {
      cashOut(run);
    } else if (run.phase === 'doc') {
      docPatch(run);
      finishNode(run);
    } else if (run.phase === 'camp') {
      bot.camp(run);
      finishNode(run);
    } else if (run.phase === 'event') {
      const def = EVENT[run.event!.id];
      let done = false;
      for (let i = 0; i < def.choices.length && !done; i++) done = chooseEvent(run, i);
      if (run.event?.duel) resolveDuel(run, Math.random() < 0.5);
      if (run.phase === 'event') finishNode(run);
    } else if (run.phase === 'victory') {
      return { night: NIGHTS, won: true, run };
    } else if (run.phase === 'road') {
      bot.road(run);
    } else if (run.phase === 'pack') {
      bot.pack(run);
    } else if (run.phase === 'gameover') {
      return { night: run.night, won: false, run };
    } else break;
  }
  return { night: run.night, won: false, run };
}

// Other scripts import simulate() and set SIM_LIB so this file's own report doesn't run.
if (!process.env.VITEST && !process.env.SIM_LIB) main();

function main() {
  const N = Number(process.argv[2] ?? 200);
  const shoe = process.argv[3] ?? 'paper';
  const stake = Number(process.argv[4] ?? 1);
  const reach: number[] = new Array(NIGHTS + 2).fill(0);
  let wins = 0;
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const r = simulate(`SIM${i}`, shoe, stake);
    reach[r.night]++;
    if (r.won) wins++;
  }
  console.log(`${N} runs (${shoe}, stake ${stake}) in ${Date.now() - t0}ms. Wins: ${wins}`);
  console.log('Died on night:', reach.map((n, i) => `${i}:${n}`).slice(1).join('  '));
  if (process.env.DETAIL) {
    const where: Record<string, number> = {};
    const hosts: Record<string, number> = {};
    let charms = 0;
    for (let i = 0; i < N; i++) {
      const r = simulate(`SIM${i}`, shoe, stake);
      const k = `${r.night}`;
      where[k] = (where[k] ?? 0) + 1;
      hosts[r.run.nightHost] = (hosts[r.run.nightHost] ?? 0) + 1;
      charms += r.run.charms.length;
    }
    console.log(where, hosts, 'avg charms at death', (charms / N).toFixed(2));
  }
}
