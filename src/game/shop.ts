// Between tables: winning and losing tables, cashing out, crates and consumables.

import type { Card, ConsKind, FinishId, OpenPack, Rank, Run, ShopItem, Suit, InkId, SealId } from '../core/types';
import { RANKS, SUITS } from '../core/cards';
import { CHARM, CHARMS, sellValue, mostPlayed } from '../content/charms';
import { CONS, FORTUNES, MASKS, STARS, consSellValue } from '../content/consumables';
import { VOUCHER } from '../content/vouchers';
import { PACK, PACKS, SHOE } from '../content/shoes';
import { TAG } from '../content/tags';
import {
  NIGHTS,
  addTag,
  availableVouchers,
  charmSlots,
  consSlots,
  ctx,
  discover,
  fire,
  fireTags,
  fxQueue,
  has,
  hasVoucher,
  interestCap,
  makeCharm,
  rerollHost,
  rng,
  rotate,
  startNight,
  createCharm,
} from './engine';
import { TABLE_INFO, OUTLAW_RETRY, finishNode, gritCap, heal, hurt, nextTown } from './trail';
import { startRoad } from './roads';

// ---------------------------------------------------------------------------
// Outlaw rerolls (Fate Thread deed)
// ---------------------------------------------------------------------------

export function canRerollHost(run: Run): boolean {
  if (!hasVoucher(run, 'fate_thread')) return false;
  const outlaw = run.trail.nodes.find((n) => n.kind === 'outlaw');
  if (!outlaw || outlaw.done || run.trail.at === outlaw.id) return false;
  if (!hasVoucher(run, 'fate_loom') && (run.flags.hostRerolls ?? 0) >= 1) return false;
  return run.money >= 10;
}

export function payRerollHost(run: Run) {
  if (!canRerollHost(run)) return;
  run.money -= 10;
  run.flags.hostRerolls = (run.flags.hostRerolls ?? 0) + 1;
  rerollHost(run);
}

// ---------------------------------------------------------------------------
// Winning or losing a table / cash out
// ---------------------------------------------------------------------------

const KIND_KEY = { paper: 'saloon', silk: 'highstakes', bank: 'bank', gang: 'gang', host: 'outlaw' } as const;

/** A deposit made at the Bank of Golden Egg City pays out after the next table, win or lose. */
function bankPayout(run: Run, lines: { label: string; amount: number; tone?: string }[]) {
  const d = run.flags.bankDeposit ?? 0;
  if (!d) return;
  run.flags.bankDeposit = 0;
  lines.push({ label: 'Bank deposit with interest', amount: d, tone: 'gold' });
}

export function winTable(run: Run) {
  const t = run.table!;
  run.stats.tablesWon++;
  const info = TABLE_INFO[KIND_KEY[t.kind]];
  const lines: { label: string; amount: number; tone?: string }[] = [];
  const reward = t.kind === 'paper' && run.stake >= 2 ? 0 : info.reward;
  if (reward) lines.push({ label: t.kind === 'host' ? 'Outlaw run outta town' : `${info.name} won`, amount: reward, tone: 'gold' });
  if (run.shoeId === 'jade') {
    if (t.handsLeft) lines.push({ label: `${t.handsLeft} hands remaining ($2 each)`, amount: t.handsLeft * 2, tone: 'chips' });
    if (t.foldsLeft) lines.push({ label: `${t.foldsLeft} folds remaining ($1 each)`, amount: t.foldsLeft, tone: 'mult' });
  } else if (t.handsLeft) {
    lines.push({ label: `${t.handsLeft} hand${t.handsLeft > 1 ? 's' : ''} remaining ($1 each)`, amount: t.handsLeft, tone: 'chips' });
  }
  const cap = interestCap(run);
  const interest = Math.min(Math.floor(Math.max(0, run.money) / 5), cap);
  if (interest > 0) lines.push({ label: `Interest ($1 per $5, max $${cap})`, amount: interest, tone: 'gold' });
  run.flags.unusedFolds = (run.flags.unusedFolds ?? 0) + t.foldsLeft;

  // Doodad end-of-table money.
  for (const k of run.charms) {
    const d = CHARM[k.id];
    if (!d?.endMoney || k.disabled) continue;
    const v = d.endMoney(run, k);
    if (v) lines.push({ label: d.name, amount: v, tone: 'gold' });
  }
  // Bank Jobs and Gang bounties pay out in roads: an extra path to choose after this win.
  if (t.kind === 'bank') {
    run.flags.bonusPaths = (run.flags.bonusPaths ?? 0) + 1;
    lines.push({ label: 'Loot: an extra path to choose', amount: 0, tone: 'chips' });
  }
  if (t.kind === 'gang') {
    run.flags.bonusPaths = (run.flags.bonusPaths ?? 0) + 1;
    run.stats.gangBeaten = (run.stats.gangBeaten ?? 0) + 1;
    lines.push({ label: 'Bounty: an extra path to choose', amount: 0, tone: 'chips' });
    if (run.grit < gritCap(run)) {
      heal(run, 1);
      lines.push({ label: 'You take his canteen: +1 Grit', amount: 0, tone: 'chips' });
    }
  }
  // Table end hooks (scaling, eggs...).
  fire(run, 'tableEnd');
  if (t.kind === 'host') {
    run.stats.hostsBeaten++;
    fire(run, 'hostBeaten');
    fireTags(run, 'hostBeaten');
    if (run.shoeId === 'mirror') addTag(run, 'double');
  }
  for (const k of run.charms) k.disabled = false;
  bankPayout(run, lines);
  const total = lines.reduce((a, l) => a + l.amount, 0);
  run.cashout = { lines, total, gritLost: t.gritLost };
  run.phase = 'cashout';
}

/** Ran out of hands short of the target: lose Grit instead of the whole run. */
export function failTable(run: Run) {
  const t = run.table!;
  const info = TABLE_INFO[KIND_KEY[t.kind]];
  const before = run.grit;
  hurt(run, info.gritOnFail);
  const lost = before - run.grit;
  for (const k of run.charms) k.disabled = false;
  const lines: { label: string; amount: number; tone?: string }[] = [
      { label: `Fell short by ${Math.max(0, t.target - t.score).toLocaleString('en-US')}`, amount: 0, tone: 'mult' },
      ...(t.kind === 'host' ? [{ label: `You’ve learned his tells: next try is ${Math.round((1 - OUTLAW_RETRY) * 100)}% easier`, amount: 0, tone: 'chips' }] : []),
  ];
  bankPayout(run, lines);
  run.cashout = {
    lines,
    total: lines.reduce((a, l) => a + l.amount, 0),
    failed: true,
    gritLost: lost + t.gritLost,
  };
  run.phase = run.grit <= 0 ? 'gameover' : 'cashout';
}

export function cashOut(run: Run) {
  if (!run.cashout) return;
  const failed = run.cashout.failed;
  run.money += run.cashout.total;
  run.stats.moneyEarned += run.cashout.total;
  run.cashout = null;
  run.table = null;
  rotate(run);
  if (failed) {
    // A failed Showdown can be retried; any other stop is simply behind you.
    const n = run.trail.nodes.find((x) => x.id === run.trail.at);
    if (n?.kind === 'outlaw') {
      // Each failed attempt teaches you his tells: the next showdown target is lower.
      run.flags.outlawTries = (run.flags.outlawTries ?? 0) + 1;
      run.phase = 'trail';
      return;
    }
    finishNode(run);
    return;
  }
  // Every table you win, the trail forks.
  startRoad(run);
}

/** Move on after a victory screen into endless mode. */
export function continueEndless(run: Run) {
  run.endless = true;
  nextTown(run);
}

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------


const FINISH_PRICE: Record<FinishId, number> = { foil: 2, holo: 3, prism: 5, phantom: 5 };






// ---------------------------------------------------------------------------
// Rolling items
// ---------------------------------------------------------------------------

function rollFinish(run: Run, charm = true): FinishId | undefined {
  const r = rng(run).next();
  const mult = hasVoucher(run, 'glow_up') ? 4 : hasVoucher(run, 'hone') ? 2 : 1;
  if (charm && r < 0.003) return 'phantom';
  if (r < 0.006 * mult) return 'prism';
  if (r < 0.02 * mult) return 'holo';
  if (r < 0.04 * mult) return 'foil';
  return undefined;
}

function randomCard(run: Run, fancy: boolean): Card {
  const r = rng(run);
  const card: Card = { id: 0, rank: r.pick(RANKS) as Rank, suit: r.pick(SUITS) as Suit };
  if (fancy) {
    if (r.next() < 0.4) card.ink = r.pick(['jade', 'crimson', 'gilded', 'glass', 'lucky', 'spirit', 'ash'] as InkId[]);
    if (r.next() < 0.12) card.seal = r.pick(['red', 'gold', 'blue', 'purple'] as SealId[]);
    if (r.next() < 0.08) card.finish = r.pick(['foil', 'holo', 'prism'] as FinishId[]);
  }
  return card;
}





function debtFloor(run: Run): number {
  return has(run, 'iou_note') ? -20 : 0;
}

export function canAfford(run: Run, price: number): boolean {
  return run.money - price >= debtFloor(run);
}

export type BuyResult = { ok: true } | { ok: false; reason: string };




export function sellCons(run: Run, uid: number): boolean {
  const k = run.consumables.find((x) => x.uid === uid);
  if (!k) return false;
  run.consumables = run.consumables.filter((x) => x.uid !== uid);
  run.money += consSellValue(k.id, run);
  fire(run, 'anySold', 'cons');
  return true;
}

export function moveCharm(run: Run, uid: number, to: number) {
  const i = run.charms.findIndex((k) => k.uid === uid);
  if (i < 0) return;
  const [k] = run.charms.splice(i, 1);
  run.charms.splice(Math.max(0, Math.min(run.charms.length, to)), 0, k);
}

// ---------------------------------------------------------------------------
// Consumables
// ---------------------------------------------------------------------------

export function consNeeds(id: string): [number, number] | null {
  return CONS[id]?.targets ?? null;
}

export function canUseCons(run: Run, id: string, targets: Card[] = []): boolean {
  const d = CONS[id];
  if (!d) return false;
  if (d.targets) {
    if (targets.length < d.targets[0] || targets.length > d.targets[1]) return false;
  }
  if (d.canUse && !d.canUse(run, targets)) return false;
  // Card-targeting magic is only allowed between hands.
  if (run.table && run.table.phase !== 'ready' && d.targets) return false;
  return true;
}

/** Use a held consumable (or a fresh one from a pack when uid is negative). */
export function useCons(run: Run, uid: number, targetIds: number[] = []): boolean {
  const k = run.consumables.find((x) => x.uid === uid);
  if (!k) return false;
  if (!applyCons(run, k.kind, k.id, targetIds)) return false;
  run.consumables = run.consumables.filter((x) => x.uid !== uid);
  return true;
}

export function applyCons(run: Run, kind: ConsKind, id: string, targetIds: number[]): boolean {
  const d = CONS[id];
  const targets = targetIds.map((tid) => run.deck.find((c) => c.id === tid)).filter((c): c is Card => !!c);
  if (!d || !canUseCons(run, id, targets)) return false;
  const c = ctx(run);
  d.use(c, targets);
  discover(run, 'cons', id);
  if (kind === 'fortune') run.stats.fortunesUsed++;
  if (kind === 'star') {
    run.stats.starsUsed++;
    if (!run.stats.uniqueStars.includes(id)) run.stats.uniqueStars.push(id);
  }
  if (kind === 'mask') run.stats.masksUsed++;
  if (kind !== 'mask' && id !== 'the_echo') run.lastCons = { kind, id };
  fire(run, 'useCons', kind, id);
  return true;
}

// ---------------------------------------------------------------------------
// Bundles
// ---------------------------------------------------------------------------


export function openPack(run: Run, packId: string, returnTo: 'shop' | 'trail') {
  const def = PACK[packId];
  const r = rng(run);
  const pack: OpenPack = { packId, picksLeft: def.picks, options: [], spread: [], returnTo };
  const used = new Set<string>();
  for (let i = 0; i < def.size; i++) {
    {
      let kind: ConsKind = def.kind;
      let pool = kind === 'fortune' ? FORTUNES : kind === 'star' ? STARS : MASKS.filter((m) => m.id !== 'silent_mask');
      if (kind === 'fortune' && hasVoucher(run, 'omen_globe') && r.next() < 0.15) {
        kind = 'mask';
        pool = MASKS.filter((m) => m.id !== 'silent_mask');
      }
      let id = r.pick(pool.filter((x) => !used.has(x.id))).id;
      if (kind === 'star' && i === 0 && hasVoucher(run, 'telescope')) {
        const mp = mostPlayed(run);
        id = STARS.find((s) => s.hand === mp)?.id ?? id;
      }
      used.add(id);
      pack.options.push({ kind: 'cons', cons: kind, id });
    }
  }
  if (def.kind === 'fortune' || def.kind === 'mask') {
    pack.spread = r.shuffle(run.deck.map((k) => k.id)).slice(0, 8);
  }
  run.pack = pack;
  run.phase = 'pack';
  fire(run, 'packOpen', packId);
}

export function pickFromPack(run: Run, idx: number, targetIds: number[] = []): BuyResult {
  const p = run.pack;
  if (!p || p.picksLeft <= 0) return { ok: false, reason: 'No picks left' };
  const o = p.options[idx];
  if (!o || o.taken) return { ok: false, reason: 'Gone' };
  {
    const d = CONS[o.id];
    if (o.cons === 'star' || !d.targets) {
      if (!applyCons(run, o.cons, o.id, [])) {
        // Can't use it right now: keep it if there's room.
        if (run.consumables.length >= consSlots(run)) return { ok: false, reason: 'Cannot use that now' };
        run.consumables.push({ uid: run.nextId++, kind: o.cons, id: o.id });
      }
    } else {
      if (!applyCons(run, o.cons, o.id, targetIds)) return { ok: false, reason: `Select ${d.targets[0] === d.targets[1] ? d.targets[0] : `${d.targets[0]}-${d.targets[1]}`} card${d.targets[1] > 1 ? 's' : ''}` };
      // Refresh destroyed cards out of the spread.
      p.spread = p.spread.filter((id) => run.deck.some((k) => k.id === id));
    }
  }
  o.taken = true;
  p.picksLeft--;
  if (p.picksLeft <= 0) closePack(run);
  return { ok: true };
}

export function skipPack(run: Run) {
  if (!run.pack) return;
  run.stats.packsSkipped++;
  fire(run, 'packSkip');
  closePack(run);
}

function closePack(run: Run) {
  const p = run.pack;
  run.pack = null;
  run.phase = 'trail';
  void p;
  maybeOpenTagPack(run);
}

/** Tokens that open a bundle immediately. */
export function maybeOpenTagPack(run: Run): boolean {
  const id = run.flags.openPack as string | undefined;
  if (!id || run.pack) return false;
  run.flags.openPack = undefined;
  openPack(run, id, 'trail');
  return true;
}


export function tagDef(id: string) {
  return TAG[id];
}

export function shoeDef(id: string) {
  return SHOE[id];
}

