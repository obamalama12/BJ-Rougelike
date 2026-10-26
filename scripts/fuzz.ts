// Bug hunt: plays many runs and checks the game's state after every step. Half the runs use the
// basic bot; the other half a "chaos" bot that makes random legal moves (splits, doubles, folds,
// side bets, wagers, Tonics, every event choice, Doc and campfire options, random paths and drops)
// to reach the rarely played corners. Every deck, Wanted Level and gunslinger, plus a few towns of
// endless mode after a win.
//
// Usage: npm run fuzz -- [runs] [startSeed]     Prints a JSON summary of every problem found.

import { newRun, getRules, NIGHTS, charmSlots, rng as runRng } from '../src/game/engine';
import {
  afterDeal, availableActions, beginHand, cardsOf, dealTo, dealerHit, dealerShouldHit, double, endFold,
  endRound, fillSplit, fold, hit, placeSideBet, scoreHand, settleOutcomes, settleSplit, split, stand,
} from '../src/game/table';
import { cashOut, continueEndless, failTable, maybeOpenTagPack, pickFromPack, skipPack, useCons, winTable, consNeeds } from '../src/game/shop';
import { campForget, campRest, campYarn, chooseEvent, docFull, docPatch, docRemove, finishNode, gritCap, reachable, resolveDuel, travel } from '../src/game/trail';
import { dropAbility, leaveRoad, takeRoad } from '../src/game/roads';
import { applyHero, HEROES } from '../src/content/heroes';
import { SHOES } from '../src/content/shoes';
import { EVENT } from '../src/content/events';
import { CHARM } from '../src/content/charms';
import { CONS } from '../src/content/consumables';
import { HAND_TYPES } from '../src/core/cards';
import { Rng, hashSeed } from '../src/core/rng';
import type { Run } from '../src/core/types';
import { botTurn } from './simulate';

type Problem = { seed: string; mode: string; kind: string; detail: string; phase: string; town: number };

/** Everything that must always hold, checked after every step. */
function invariants(run: Run): string[] {
  const out: string[] = [];
  const num = (v: unknown, name: string) => { if (typeof v !== 'number' || !Number.isFinite(v)) out.push(`${name} is ${v}`); };
  num(run.grit, 'grit'); num(run.money, 'money'); num(run.maxGrit, 'maxGrit');
  if (run.grit < 0) out.push(`grit below 0 (${run.grit})`);
  if (run.grit > gritCap(run)) out.push(`grit ${run.grit} above cap ${gritCap(run)}`);
  if (run.money < -20) out.push(`money ${run.money} below debt limit`);
  for (const h of HAND_TYPES) if (!(run.handLevels[h.id] >= 1)) out.push(`hand level ${h.id} = ${run.handLevels[h.id]}`);
  const ids = new Set<number>();
  for (const c of run.deck) {
    if (ids.has(c.id)) out.push(`duplicate card id ${c.id}`);
    ids.add(c.id);
    if (!(c.rank >= 2 && c.rank <= 14)) out.push(`card ${c.id} has rank ${c.rank}`);
  }
  for (const k of run.charms) if (!CHARM[k.id]) out.push(`unknown ability ${k.id}`);
  if (new Set(run.charms.map((k) => k.uid)).size !== run.charms.length) out.push('duplicate ability uid');
  // Abilities may overflow only while the road is waiting for you to drop one.
  if (run.charms.length > charmSlots(run) && !run.road?.mustDrop) out.push(`belt over-full: ${run.charms.length}/${charmSlots(run)}`);
  for (const k of run.consumables) if (!CONS[k.id]) out.push(`unknown consumable ${k.id}`);
  const t = run.table;
  if (t) {
    num(t.score, 'table score'); num(t.target, 'table target');
    if (t.target <= 0) out.push(`target ${t.target}`);
    if (t.score < 0) out.push(`negative table score ${t.score}`);
    if (t.handsLeft < 0) out.push(`handsLeft ${t.handsLeft}`);
    if (t.foldsLeft < 0) out.push(`foldsLeft ${t.foldsLeft}`);
    // A card is in exactly one place: shoe, discard, dealer or a hand.
    const seen = new Map<number, string>();
    const place = (list: number[], where: string) => {
      for (const id of list) {
        if (seen.has(id)) out.push(`card ${id} in ${seen.get(id)} and ${where}`);
        seen.set(id, where);
        if (!ids.has(id)) out.push(`card ${id} in ${where} isn't in the deck`);
      }
    };
    place(t.shoe, 'shoe'); place(t.discard, 'discard'); place(t.dealer, 'dealer');
    t.hands.forEach((h, i) => place(h.cards, `hand ${i}`));
  }
  if (run.road) {
    if (run.road.options.length < 1) out.push('road with no paths');
    if (run.road.picksLeft < 0) out.push(`road picksLeft ${run.road.picksLeft}`);
  }
  if (run.phase === 'trail' && !reachable(run).length) out.push('trail with nowhere to go');
  return out;
}

/** Saves must survive a round trip through JSON unchanged. */
function saveCheck(run: Run): string | null {
  const log = (run as any).__log;
  (run as any).__log = undefined;
  try {
    const a = JSON.stringify(run);
    if (a.includes('NaN') || a.includes('Infinity')) return 'save contains NaN/Infinity';
    const b = JSON.stringify(JSON.parse(a));
    return a === b ? null : 'save changes on reload';
  } finally {
    (run as any).__log = log;
  }
}

// --- The chaos bot ---------------------------------------------------------------------------

function chaosTurn(run: Run, r: Rng) {
  const t = run.table!;
  let guard = 0;
  while (t.phase === 'player' && guard++ < 60) {
    const a = availableActions(run);
    const opts: string[] = [];
    if (a.hit) opts.push('hit', 'hit');
    if (a.stand) opts.push('stand', 'stand');
    if (a.double) opts.push('double');
    if (a.split) opts.push('split');
    if (a.fold) opts.push('fold');
    if (!opts.length) break;
    const act = r.pick(opts);
    if (act === 'hit') hit(run);
    else if (act === 'stand') stand(run);
    else if (act === 'double') double(run);
    else if (act === 'fold') { fold(run); return; }
    else if (act === 'split') {
      const ni = split(run);
      fillSplit(run, t.active);
      fillSplit(run, ni);
      settleSplit(run);
    }
  }
}

function playHand(run: Run, chaos: Rng | null): 'ready' | 'won' | 'lost' | 'dead' {
  const t = run.table!;
  if (chaos) {
    t.wager = 1 + Math.floor(chaos.next() * 3);
    if (chaos.next() < 0.15) placeSideBet(run, chaos.pick(['pair', 'suited', 'bust'] as const));
  } else t.wager = run.grit >= 7 ? 2 : 1;
  beginHand(run);
  dealTo(run, 'player');
  dealTo(run, 'dealer');
  dealTo(run, 'player');
  dealTo(run, 'dealer');
  afterDeal(run);
  if (chaos) chaosTurn(run, chaos);
  else botTurn(run);
  if (t.phase === 'resolved' && t.hands[0]?.outcome === 'fold') {
    endFold(run);
    return 'ready';
  }
  let dg = 0;
  while (dealerShouldHit(run)) {
    dealerHit(run);
    if (++dg > 80) throw new Error(`dealer never stops (dealer has ${t.dealer.length} cards)`);
  }
  settleOutcomes(run);
  const results = t.hands.map((_, i) => scoreHand(run, i));
  return endRound(run, results);
}

function useTonics(run: Run, r: Rng) {
  for (const k of [...run.consumables]) {
    if (r.next() < 0.5) continue;
    const need = consNeeds(k.id);
    const targets = need ? r.shuffle(run.deck.map((c) => c.id)).slice(0, need[0] + Math.floor(r.next() * (need[1] - need[0] + 1))) : [];
    useCons(run, k.uid, targets);
  }
}

export function fuzzRun(seed: string, chaos: boolean, problems: Problem[]): { won: boolean; town: number; steps: number } {
  const sr = new Rng(hashSeed(`fuzz:${seed}`));
  const shoe = sr.pick(SHOES).id;
  const stake = 1 + Math.floor(sr.next() * 8);
  const mode = `${chaos ? 'chaos' : 'basic'} ${shoe} stake ${stake}`;
  const run = newRun(seed, shoe, stake);
  applyHero(run, sr.pick(HEROES).id);
  const r = chaos ? sr : null;
  const report = (kind: string, detail: string) => { problems.push({ seed, mode, kind, detail, phase: run.phase, town: run.night }); };
  let steps = 0;
  let endlessTowns = 0;
  let lastPhase = '';
  try {
    while (steps++ < 6000) {
      const bad = invariants(run);
      if (bad.length) { for (const b of bad) report('invariant', b); return { won: false, town: run.night, steps }; }
      if (run.phase !== lastPhase) {
        const s = saveCheck(run);
        if (s) { report('save', s); return { won: false, town: run.night, steps }; }
        lastPhase = run.phase;
      }
      const ph = run.phase;
      if (ph === 'trail') {
        if (maybeOpenTagPack(run)) continue;
        if (r) useTonics(run, r);
        const opts = reachable(run);
        const pick = r ? r.pick(opts)
          : (run.grit <= 5 && opts.find((n) => n.kind === 'doc' || n.kind === 'camp')) || opts.find((n) => ['saloon', 'highstakes', 'bank', 'gang', 'outlaw'].includes(n.kind)) || opts[0];
        travel(run, pick.id);
      } else if (ph === 'table') {
        let res: string = 'ready';
        let hands = 0;
        while (res === 'ready') {
          res = playHand(run, r);
          const bad = invariants(run);
          if (bad.length) { for (const b of bad) report('invariant', b); return { won: false, town: run.night, steps }; }
          if (++hands > 400) throw new Error('table never ends');
        }
        if (res === 'dead') return { won: false, town: run.night, steps };
        if (res === 'won') winTable(run);
        else failTable(run);
      } else if (ph === 'cashout') cashOut(run);
      else if (ph === 'road') {
        const road = run.road!;
        if (!road.taken) takeRoad(run, r ? r.pick(road.options) : road.options[0]);
        let g = 0;
        while (run.road?.mustDrop && g++ < 10) {
          const keep = run.road.mustDrop;
          const others = run.charms.filter((k) => k.uid !== keep);
          const victim = r ? r.pick(others) : others.find((k) => CHARM[k.id]?.bane) ?? others[0];
          if (!dropAbility(run, victim.uid)) throw new Error('could not drop an ability');
        }
        if (!leaveRoad(run)) throw new Error('could not leave the road');
      } else if (ph === 'doc') {
        if (r) {
          if (r.next() < 0.5) docPatch(run);
          if (r.next() < 0.4) docFull(run);
          if (r.next() < 0.4 && run.deck.length > 10) docRemove(run, r.pick(run.deck).id);
        } else docPatch(run);
        finishNode(run);
      } else if (ph === 'camp') {
        const x = r ? r.next() : 0;
        if (x < 0.4) campRest(run);
        else if (x < 0.75) campYarn(run, r!.pick(HAND_TYPES).id);
        else campForget(run);
        finishNode(run);
      } else if (ph === 'event') {
        const def = EVENT[run.event!.id];
        const order = def.choices.map((_, i) => i);
        if (r) r.shuffle(order);
        let done = false;
        for (const i of order) { if ((done = chooseEvent(run, i))) break; }
        if (!done) report('stuck', `event ${def.id}: no choice could be taken`);
        if (run.event?.duel) resolveDuel(run, r ? r.next() < 0.5 : true);
        if (run.phase === 'event') finishNode(run);
      } else if (ph === 'pack') {
        const p = run.pack!;
        let g = 0;
        while (run.pack && g++ < 10) {
          const i = p.options.findIndex((o) => !o.taken);
          if (i < 0 || (r && r.next() < 0.3)) { skipPack(run); break; }
          const o = p.options[i];
          const need = o.kind === 'cons' ? CONS[o.id]?.targets : null;
          const targets = need ? p.spread.slice(0, need[0]) : [];
          if (!pickFromPack(run, i, targets).ok) { o.taken = true; if (!p.options.some((x) => !x.taken)) skipPack(run); }
        }
      } else if (ph === 'victory') {
        if (endlessTowns === 0 && (r ? r.next() < 0.5 : true)) { continueEndless(run); endlessTowns = run.night; continue; }
        return { won: true, town: run.night, steps };
      } else if (ph === 'gameover') {
        return { won: run.night > NIGHTS, town: run.night, steps };
      } else {
        report('stuck', `unknown phase ${ph}`);
        return { won: false, town: run.night, steps };
      }
      // Endless: ride three more towns, then call it.
      if (endlessTowns && run.night >= endlessTowns + 3) return { won: true, town: run.night, steps };
    }
    report('stuck', `run never ended (${steps} steps)`);
  } catch (e) {
    report('crash', `${(e as Error).message}\n${((e as Error).stack ?? '').split('\n').slice(1, 6).join('\n')}`);
  }
  void runRng;
  void getRules;
  return { won: false, town: run.night, steps };
}

if (!process.env.VITEST && !process.env.SIM_LIB) {
  const N = Number(process.argv[2] ?? 1000);
  const start = Number(process.argv[3] ?? 0);
  const problems: Problem[] = [];
  let wins = 0;
  let basicWins = 0;
  let basicRuns = 0;
  for (let i = start; i < start + N; i++) {
    const chaos = i % 2 === 1;
    const res = fuzzRun(`FZ${i}`, chaos, problems);
    if (res.won) wins++;
    if (!chaos) { basicRuns++; if (res.won) basicWins++; }
  }
  // Group identical problems so the report stays readable.
  const groups = new Map<string, { kind: string; detail: string; count: number; examples: Problem[] }>();
  for (const p of problems) {
    const key = `${p.kind}|${p.detail.split('\n')[0].replace(/\d+/g, '#')}`;
    const g = groups.get(key) ?? { kind: p.kind, detail: p.detail, count: 0, examples: [] };
    g.count++;
    if (g.examples.length < 3) g.examples.push(p);
    groups.set(key, g);
  }
  console.log(JSON.stringify({ runs: N, start, wins, basicRuns, basicWins, problems: problems.length, groups: [...groups.values()] }));
}
