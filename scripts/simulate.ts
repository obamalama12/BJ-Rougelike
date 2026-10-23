// Headless balance simulation: plays many runs with a simple bot.
// Usage: npm run sim -- [runs] [shoe] [stake]

import { newRun, getRules, NIGHTS } from '../src/game/engine';
import {
  afterDeal, availableActions, beginHand, cardsOf, dealTo, dealerHit, dealerShouldHit, double, endFold,
  endRound, fillSplit, fold, hit, scoreHand, settleOutcomes, settleSplit, split, stand,
} from '../src/game/table';
import { buyItem, buyPack, buyVoucher, cashOut, failTable, leaveShop, pickFromPack, reroll, sellCharm, skipPack, winTable, maybeOpenTagPack, useCons } from '../src/game/shop';
import { reachable, travel, docPatch, campRest, chooseEvent, resolveDuel, finishNode, isTableNode } from '../src/game/trail';
import { EVENT } from '../src/content/events';
import { CHARM } from '../src/content/charms';
import { charmSlots } from '../src/game/engine';
import { handTotal } from '../src/core/cards';
import type { Run } from '../src/core/types';
import { CONS } from '../src/content/consumables';

function botTurn(run: Run) {
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

function playHand(run: Run): 'ready' | 'won' | 'lost' | 'dead' {
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
  while (dealerShouldHit(run)) dealerHit(run);
  settleOutcomes(run);
  const results = t.hands.map((_, i) => scoreHand(run, i));
  return endRound(run, results);
}

function shopBot(run: Run) {
  const s = run.shop!;
  const rar = (id: string) => CHARM[id]?.rarity ?? 1;
  for (let pass = 0; pass < 3; pass++) {
    const items = [...s.items].filter((i) => !i.sold).sort((a, b) => (b.kind === 'charm' ? rar((b as any).id) : 0) - (a.kind === 'charm' ? rar((a as any).id) : 0));
    for (const it of items) {
      if (it.sold || run.money < it.price) continue;
      if (it.kind === 'charm') {
        if (run.charms.length >= charmSlots(run)) {
          const worst = [...run.charms].sort((a, b) => rar(a.id) - rar(b.id))[0];
          if (!worst || rar(worst.id) >= rar(it.id)) continue;
          sellCharm(run, worst.uid);
        }
        buyItem(run, it.uid);
      } else if (it.kind === 'cons' && it.cons === 'star') {
        if (buyItem(run, it.uid, true).ok) useCons(run, run.consumables[run.consumables.length - 1].uid);
      }
    }
    for (const p of s.packs) {
      if (!p.sold && run.money >= p.price && (p.packId.startsWith('charm') || p.packId.startsWith('star'))) {
        buyPack(run, p.uid);
        packBot(run);
      }
    }
    if (run.money >= 12 && pass < 2) reroll(run);
  }
  if (s.voucher && run.money >= 10) buyVoucher(run);
  for (const k of [...run.consumables]) if (k.kind === 'star') useCons(run, k.uid);
}

function packBot(run: Run) {
  let g = 0;
  while (run.pack && g++ < 10) {
    const p = run.pack;
    let best = -1;
    let score = -1;
    p.options.forEach((o, i) => {
      if (o.taken) return;
      const v = o.kind === 'charm' ? CHARM[o.id].rarity * 10 : o.kind === 'cons' && !CONS[o.id]?.targets ? 5 : -1;
      if (v > score) { score = v; best = i; }
    });
    if (best < 0 || !pickFromPack(run, best).ok) skipPack(run);
  }
}

export interface TableLog { night: number; kind: string; target: number; score: number; hands: number; won: boolean; grit: number; gritAfter: number; money: number; charms: number; best: number }
export interface StopLog { night: number; kind: string; grit: number; money: number }

export function simulate(seed: string, shoe = 'paper', stake = 1) {
  const run = newRun(seed, shoe, stake);
  const tables: TableLog[] = [];
  const stops: StopLog[] = [];
  (run as any).__log = { tables, stops };
  let guard = 0;
  while (guard++ < 4000) {
    if (run.phase === 'trail') {
      if (maybeOpenTagPack(run)) { packBot(run); continue; }
      const opts = reachable(run);
      // Prefer: store when rich, doc/camp when hurt, otherwise card games.
      const pick =
        (run.grit <= 5 && opts.find((n) => n.kind === 'doc' || n.kind === 'camp')) ||
        (run.money >= 12 && opts.find((n) => n.kind === 'store')) ||
        opts.find((n) => isTableNode(n)) ||
        opts[0];
      stops.push({ night: run.night, kind: pick.kind, grit: run.grit, money: run.money });
      travel(run, pick.id);
    } else if (run.phase === 'table') {
      let r: string = 'ready';
      const grit0 = run.grit;
      let hands = 0;
      let best = 0;
      while (r === 'ready') {
        // Wager boldly while healthy.
        run.table!.wager = process.env.WAGER ? Number(process.env.WAGER) : run.grit >= 7 ? 2 : 1;
        const before = run.table!.score;
        r = playHand(run);
        hands++;
        if (run.table) best = Math.max(best, run.table.score - before);
      }
      const t = run.table!;
      const log: TableLog = { night: run.night, kind: t.kind, target: t.target, score: t.score, hands, won: r === 'won', grit: grit0, gritAfter: run.grit, money: run.money, charms: run.charms.length, best };
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
      campRest(run);
      finishNode(run);
    } else if (run.phase === 'event') {
      const def = EVENT[run.event!.id];
      let done = false;
      for (let i = 0; i < def.choices.length && !done; i++) done = chooseEvent(run, i);
      if (run.event?.duel) resolveDuel(run, Math.random() < 0.5);
      if (run.phase === 'event') finishNode(run);
    } else if (run.phase === 'victory') {
      return { night: NIGHTS, won: true, run };
    } else if (run.phase === 'shop') {
      shopBot(run);
      leaveShop(run);
    } else if (run.phase === 'pack') {
      packBot(run);
    } else if (run.phase === 'gameover') {
      return { night: run.night, won: false, run };
    } else break;
  }
  return { night: run.night, won: false, run };
}

if (!process.env.VITEST) main();

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
