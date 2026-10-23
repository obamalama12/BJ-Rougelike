// The trail: a branching map per Town, Grit, and the non-table stops along the way.

import type { NodeKind, Run, TableKind, TrailNode } from '../core/types';
import { HOST } from '../content/hosts';
import { EVENT, EVENTS } from '../content/events';
import { HAND_TYPES } from '../core/cards';
import { NIGHTS, ctx, discover, fire, has, nightBase, rerollHost, rng, availableVouchers } from './engine';
import { startTable } from './table';
import { openShop } from './shop';

export const COLS = 6;

/** Difficulty and payout of each kind of table. */
export const TABLE_INFO: Record<'saloon' | 'highstakes' | 'bank' | 'gang' | 'outlaw', { kind: TableKind; scale: number; reward: number; gritOnFail: number; name: string }> = {
  saloon: { kind: 'paper', scale: 1, reward: 3, gritOnFail: 2, name: 'Saloon Game' },
  highstakes: { kind: 'silk', scale: 1.5, reward: 5, gritOnFail: 3, name: 'High Stakes' },
  bank: { kind: 'bank', scale: 1.8, reward: 6, gritOnFail: 3, name: 'Bank Job' },
  gang: { kind: 'gang', scale: 1.3, reward: 4, gritOnFail: 2, name: 'Gang Member' },
  outlaw: { kind: 'host', scale: 2, reward: 6, gritOnFail: 4, name: 'Showdown' },
};

export const NODE_INFO: Record<NodeKind, { name: string; icon: string; blurb: string }> = {
  saloon: { name: 'Saloon Game', icon: 'saloon', blurb: 'A regular card table. Low target, small purse' },
  highstakes: { name: 'High Stakes', icon: 'tophat', blurb: 'Bigger target, bigger purse' },
  bank: { name: 'Bank Job', icon: 'moneybag', blurb: 'A cursed table with a rare Doodad as the prize' },
  store: { name: 'General Store', icon: 'crate', blurb: 'Doodads, Tonics, Crates and Deeds' },
  doc: { name: 'Doc Hoot', icon: 'tonic', blurb: 'Patch up your Grit, or have a card removed' },
  camp: { name: 'Campfire', icon: 'campfire', blurb: 'Rest, or spin a yarn to level up a hand' },
  event: { name: 'Strange Happenings', icon: 'wanted', blurb: 'A random encounter. Could help, could cost you' },
  gang: { name: 'Gang Member', icon: 'wanted', blurb: 'One of the Outlaw’s gang, with a curse of their own. Beat them for a Bounty: pick 1 of 3 Doodads' },
  outlaw: { name: 'Showdown', icon: 'revolver', blurb: 'The boss of this town. Win to ride on to the next one' },
};

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export function generateTrail(run: Run) {
  const r = rng(run);
  const town = run.night;
  const pools: NodeKind[][] = [
    ['saloon', 'saloon', 'event'],
    ['saloon', 'highstakes', 'event', 'camp', 'store'],
    // Halfway through every town the whole column is the Outlaw's gang: every route meets one.
    ['gang'],
    ['saloon', 'highstakes', 'event', 'doc', ...(town >= 2 ? (['bank'] as NodeKind[]) : [])],
    ['store', 'camp', 'doc'],
    ['outlaw'],
  ];
  const nodes: TrailNode[] = [];
  const cols: TrailNode[][] = [];
  let id = 0;
  for (let c = 0; c < COLS; c++) {
    const count = c === COLS - 1 ? 1 : c === COLS - 2 ? 2 : r.int(2, 3);
    const col: TrailNode[] = [];
    const bag = r.shuffle([...pools[c]]);
    for (let i = 0; i < count; i++) {
      let kind = bag[i % bag.length];
      // The first stop is always a card game so every town starts at the felt.
      if (c === 0 && i === 0) kind = 'saloon';
      if (c === COLS - 2 && i === 0) kind = 'store';
      col.push({ id: id++, col: c, row: count === 1 ? 1 : count === 2 ? i * 2 : i, kind, next: [] });
    }
    // Avoid two identical utility stops in one column.
    cols.push(col);
    nodes.push(...col);
  }
  // Connect each column to the next: nearest rows, every node reachable.
  for (let c = 0; c < COLS - 1; c++) {
    const a = cols[c];
    const b = cols[c + 1];
    for (const n of a) {
      const sorted = [...b].sort((x, y) => Math.abs(x.row - n.row) - Math.abs(y.row - n.row));
      n.next.push(sorted[0].id);
      if (sorted[1] && Math.abs(sorted[1].row - n.row) <= 1 && r.next() < 0.6) n.next.push(sorted[1].id);
    }
    for (const m of b) {
      if (!a.some((n) => n.next.includes(m.id))) {
        const nearest = [...a].sort((x, y) => Math.abs(x.row - m.row) - Math.abs(y.row - m.row))[0];
        nearest.next.push(m.id);
      }
    }
  }
  // Curses and encounters
  const regular = Object.values(HOST).filter((h) => !h.showdown && h.minNight <= Math.max(1, town));
  // Gang members are different birds from the Outlaw and from each other.
  const gang = r.shuffle(regular.filter((h) => h.id !== run.nightHost));
  for (const n of nodes) {
    if (n.kind === 'bank') n.hostId = r.pick(regular).id;
    if (n.kind === 'gang') n.hostId = (gang.shift() ?? r.pick(regular)).id;
    if (n.kind === 'event') {
      // Prefer events this run hasn't met yet, then any not already on this map.
      const seen: string[] = run.flags.eventsSeen ?? [];
      const ok = EVENTS.filter((e) => (e.minTown ?? 1) <= town && !nodes.some((o) => o.eventId === e.id));
      const fresh = ok.filter((e) => !seen.includes(e.id));
      n.eventId = r.pick(fresh.length ? fresh : ok.length ? ok : EVENTS).id;
    }
    if (n.kind === 'outlaw') n.hostId = run.nightHost;
  }
  run.trail = { nodes, at: null };
}

export function nodeById(run: Run, id: number | null) {
  return id === null ? null : run.trail.nodes.find((n) => n.id === id) ?? null;
}

/** Nodes the player may travel to right now. */
export function reachable(run: Run): TrailNode[] {
  const at = nodeById(run, run.trail.at);
  if (!at) return run.trail.nodes.filter((n) => n.col === 0);
  if (!at.done) return [at];
  return at.next.map((id) => nodeById(run, id)!).filter(Boolean);
}

/** Each failed showdown lowers the Outlaw's next target to this fraction. */
export const OUTLAW_RETRY = 0.85;
/** Grit restored on riding into a new town. */
export const TOWN_HEAL = 2;

export function nodeTarget(run: Run, n: TrailNode): number {
  const kind = n.kind as 'saloon' | 'highstakes' | 'bank' | 'gang' | 'outlaw';
  // Tables grow a little further down the trail. The Outlaw's own multiplier already makes it the
  // town's hardest table, so it skips the column bonus (stacking both made showdowns a wall).
  const base = nightBase(run) * (n.kind === 'outlaw' ? 1 : 1 + 0.12 * n.col);
  let scale = TABLE_INFO[kind].scale;
  if (n.kind === 'outlaw') scale = HOST[n.hostId ?? run.nightHost]?.scale ?? 2;
  if (n.kind === 'outlaw' && run.flags.wantedPoster) scale *= 1.25;
  if (n.kind === 'outlaw') scale *= Math.pow(OUTLAW_RETRY, run.flags.outlawTries ?? 0);
  return round(base * scale);
}

function round(n: number) {
  if (n < 1000) return Math.round(n / 10) * 10;
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / mag) * mag;
}

export function isTableNode(n: TrailNode) {
  return n.kind === 'saloon' || n.kind === 'highstakes' || n.kind === 'bank' || n.kind === 'gang' || n.kind === 'outlaw';
}

// ---------------------------------------------------------------------------
// Travel
// ---------------------------------------------------------------------------

export function travel(run: Run, id: number) {
  const n = reachable(run).find((x) => x.id === id);
  if (!n) return;
  run.trail.at = n.id;
  run.event = null;
  if (run.flags.rerollHost) {
    run.flags.rerollHost = false;
    rerollHost(run);
  }
  if (!isTableNode(n)) {
    // Stops without a card game count as "skipped tables" for Doodads that care.
    run.stats.tablesSkipped++;
    fire(run, 'tableSkip');
  }
  switch (n.kind) {
    case 'saloon':
    case 'highstakes':
    case 'bank':
    case 'gang':
    case 'outlaw': {
      const info = TABLE_INFO[n.kind];
      if (n.hostId) discover(run, 'host', n.hostId);
      startTable(run, info.kind, nodeTarget(run, n), n.hostId);
      break;
    }
    case 'store':
      openShop(run);
      break;
    case 'doc':
      run.phase = 'doc';
      run.flags.docUsed = {};
      break;
    case 'camp':
      run.phase = 'camp';
      break;
    case 'event':
      run.event = { id: n.eventId ?? EVENTS[0].id };
      run.flags.eventsSeen = [...(run.flags.eventsSeen ?? []), run.event.id];
      run.phase = 'event';
      break;
  }
}

/** Finish the current node and return to the trail (or the next town). */
export function finishNode(run: Run) {
  const n = nodeById(run, run.trail.at);
  if (n) n.done = true;
  run.event = null;
  run.phase = 'trail';
  if (n?.kind === 'outlaw') {
    if (run.night >= NIGHTS && !run.endless && !run.flags.victoryShown) {
      run.flags.victoryShown = true;
      run.phase = 'victory';
      return;
    }
    nextTown(run);
  }
}

export function nextTown(run: Run) {
  run.night += 1;
  const heal0 = run.grit;
  heal(run, TOWN_HEAL);
  run.flags.townHeal = run.grit - heal0;
  startTownState(run);
}

/** Pick the Outlaw, the shop's Deed and lay out the trail for the current town. */
export function startTownState(run: Run) {
  const r = rng(run);
  const showdown = run.night % NIGHTS === 0;
  const all = Object.values(HOST);
  let pool = all.filter((h) => !!h.showdown === showdown && h.minNight <= Math.max(run.night, showdown ? 7 : 1) && !run.hostsSeen.includes(h.id));
  if (!pool.length) pool = all.filter((h) => !!h.showdown === showdown && h.minNight <= Math.max(run.night, 7));
  if (!pool.length) pool = all.filter((h) => !h.showdown);
  run.nightHost = r.pick(pool).id;
  run.hostsSeen.push(run.nightHost);
  run.flags.hostRerolls = 0;
  run.flags.wantedPoster = false;
  run.flags.outlawTries = 0;
  const avail = availableVouchers(run);
  run.flags.nightVoucher = avail.length ? r.pick(avail) : null;
  run.flags.nightVoucherSold = false;
  generateTrail(run);
  run.phase = 'trail';
}

// ---------------------------------------------------------------------------
// Grit
// ---------------------------------------------------------------------------

export function hurt(run: Run, n: number): boolean {
  if (n <= 0) return false;
  if (has(run, 'thick_hide') && n > 0) n = Math.max(0, n - 1);
  run.grit = Math.max(0, run.grit - n);
  return run.grit <= 0;
}

/** Max Grit including Doodad bonuses. */
export function gritCap(run: Run): number {
  return run.maxGrit + (has(run, 'iron_gizzard') ? 4 : 0);
}

export function heal(run: Run, n: number) {
  run.grit = Math.min(gritCap(run), run.grit + n);
}

// ---------------------------------------------------------------------------
// Doc's office and campfire
// ---------------------------------------------------------------------------

export const DOC_PRICES = { patch: 0, full: 8, remove: 5 };

export function docPatch(run: Run): boolean {
  const used = (run.flags.docUsed ??= {});
  if (used.patch) return false;
  used.patch = true;
  heal(run, 3);
  return true;
}

export function docFull(run: Run): boolean {
  const used = (run.flags.docUsed ??= {});
  if (used.full || run.money < DOC_PRICES.full) return false;
  used.full = true;
  run.money -= DOC_PRICES.full;
  heal(run, gritCap(run));
  return true;
}

export function docRemove(run: Run, cardId: number): boolean {
  const used = (run.flags.docUsed ??= {});
  if (used.remove || run.money < DOC_PRICES.remove) return false;
  const i = run.deck.findIndex((c) => c.id === cardId);
  if (i < 0) return false;
  used.remove = true;
  run.money -= DOC_PRICES.remove;
  run.deck.splice(i, 1);
  return true;
}

export function campRest(run: Run) {
  heal(run, 4);
}

export function campYarn(run: Run, ht: (typeof HAND_TYPES)[number]['id']) {
  ctx(run).levelUp(ht, 1);
}

/** Whittle: give a random Doodad without a finish a Shiny finish. */
export function campWhittle(run: Run): boolean {
  const pool = run.charms.filter((k) => !k.finish);
  if (!pool.length) return false;
  rng(run).pick(pool).finish = 'foil';
  return true;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export function chooseEvent(run: Run, idx: number): boolean {
  const ev = run.event;
  if (!ev || ev.result) return false;
  const def = EVENT[ev.id];
  const ch = def?.choices[idx];
  if (!ch) return false;
  if (ch.cost && run.money < ch.cost) return false;
  if (ch.can && !ch.can(run)) return false;
  if (ch.cost) run.money -= ch.cost;
  const c = ctx(run);
  const res = ch.apply(c);
  if (typeof res === 'string') ev.result = res;
  else {
    ev.result = res.text;
    if (res.duel) ev.duel = res.duel;
  }
  if (run.grit <= 0) run.phase = 'gameover';
  return true;
}

export function resolveDuel(run: Run, won: boolean): string {
  const ev = run.event;
  if (!ev?.duel) return '';
  const d = ev.duel;
  ev.duel = undefined;
  if (won) {
    run.money += d.reward;
    run.stats.moneyEarned += d.reward;
    heal(run, 1);
    ev.result = `You were faster. The roadrunner pays up: $${d.reward} and +1 Grit.`;
  } else {
    hurt(run, d.stake);
    ev.result = `Too slow. You lose ${d.stake} Grit, and the roadrunner keeps your hat.`;
    if (run.grit <= 0) run.phase = 'gameover';
  }
  return ev.result;
}

export { EVENTS };
