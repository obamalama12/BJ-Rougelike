// Headless balance simulation: plays many runs with a simple bot.
// Usage: npm run sim -- [runs] [shoe] [stake]

import { newRun, getRules, NIGHTS } from '../src/game/engine';
import {
  afterDeal, availableActions, beginHand, cardsOf, dealTo, dealerHit, dealerShouldHit, double, endFold,
  endRound, fillSplit, fold, hit, scoreHand, settleOutcomes, settleSplit, split, stand,
} from '../src/game/table';
import { buyItem, buyPack, cashOut, leaveShop, pickFromPack, selectTable, skipPack, winTable, maybeOpenTagPack, useCons } from '../src/game/shop';
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

function playHand(run: Run): 'ready' | 'won' | 'lost' {
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
  for (const it of s.items) {
    if (it.kind === 'charm' && !it.sold && run.money - it.price >= 0) buyItem(run, it.uid);
    if (it.kind === 'cons' && it.cons === 'star' && !it.sold && run.money - it.price >= 6) buyItem(run, it.uid);
  }
  for (const p of s.packs) {
    if (!p.sold && run.money - p.price >= 8 && p.packId.startsWith('charm')) {
      buyPack(run, p.uid);
      packBot(run);
    }
  }
  for (const k of [...run.consumables]) if (k.kind === 'star') useCons(run, k.uid);
}

function packBot(run: Run) {
  let g = 0;
  while (run.pack && g++ < 10) {
    const p = run.pack;
    const i = p.options.findIndex((o) => !o.taken && !(o.kind === 'cons' && CONS[o.id]?.targets));
    if (i < 0 || !pickFromPack(run, i).ok) skipPack(run);
  }
}

export function simulate(seed: string, shoe = 'paper', stake = 1) {
  const run = newRun(seed, shoe, stake);
  let guard = 0;
  while (guard++ < 2000) {
    if (run.phase === 'select') {
      if (maybeOpenTagPack(run)) { packBot(run); continue; }
      const idx = run.tableStatus.findIndex((s) => s === 'open');
      selectTable(run, idx);
      let r: string = 'ready';
      while (r === 'ready') r = playHand(run);
      if (r === 'lost') return { night: run.night, table: run.tableIdx, won: false, run };
      winTable(run);
    } else if (run.phase === 'cashout') {
      cashOut(run);
    } else if (run.phase === 'victory') {
      return { night: NIGHTS, table: 2, won: true, run };
    } else if (run.phase === 'shop') {
      shopBot(run);
      leaveShop(run);
    } else if (run.phase === 'pack') {
      packBot(run);
    } else break;
  }
  return { night: run.night, table: run.tableIdx, won: false, run };
}

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
    const k = `${r.night}.${r.table}`;
    where[k] = (where[k] ?? 0) + 1;
    if (r.table === 2) hosts[r.run.nightHost] = (hosts[r.run.nightHost] ?? 0) + 1;
    charms += r.run.charms.length;
  }
  console.log(where, hosts, 'avg charms at death', (charms / N).toFixed(2));
}
