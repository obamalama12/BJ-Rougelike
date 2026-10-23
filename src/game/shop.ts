// Between tables: choosing tables, cashing out, the shop, bundles and consumables.

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
  rollCharm,
  rotate,
  startNight,
  createCharm,
} from './engine';
import { TABLE_INFO, OUTLAW_RETRY, finishNode, gritCap, heal, hurt, nextTown } from './trail';

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
  // Bank Jobs pay out in loot.
  if (t.kind === 'bank') {
    if (createCharm(run, { rarity: 3 })) fxQueue.push({ t: 'msg', text: 'Rare Doodad!', color: '#ff6a3d', src: { kind: 'deck' } });
    else lines.push({ label: 'Loot (no room for the Doodad)', amount: 10, tone: 'gold' });
  }
  // Gang members pay a Bounty: a free pick of Doodads, opened back on the trail.
  if (t.kind === 'gang') {
    run.flags.openPack = 'bounty';
    run.stats.gangBeaten = (run.stats.gangBeaten ?? 0) + 1;
    lines.push({ label: 'Bounty: pick 1 of 3 Doodads', amount: 0, tone: 'chips' });
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
  }
  finishNode(run);
}

/** Move on after a victory screen into endless mode. */
export function continueEndless(run: Run) {
  run.endless = true;
  nextTown(run);
}

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

function discount(run: Run, base: number): number {
  let p = base;
  if (hasVoucher(run, 'liquidation')) p = Math.floor(p * 0.5);
  else if (hasVoucher(run, 'clearance')) p = Math.floor(p * 0.75);
  if (has(run, 'night_market')) p -= 1;
  if (run.stake >= 6) p += 1;
  return Math.max(1, p);
}

const FINISH_PRICE: Record<FinishId, number> = { foil: 2, holo: 3, prism: 5, phantom: 5 };

export function charmPrice(run: Run, id: string, finish?: FinishId): number {
  return discount(run, (CHARM[id]?.cost ?? 4) + (finish ? FINISH_PRICE[finish] : 0));
}

export function consPrice(run: Run, kind: ConsKind): number {
  if (kind === 'star' && has(run, 'astronomer')) return 0;
  return discount(run, kind === 'mask' ? 4 : 3);
}

export function packPrice(run: Run, packId: string): number {
  const p = PACK[packId];
  if (p.kind === 'star' && has(run, 'astronomer')) return 0;
  return discount(run, p.cost);
}

export function voucherPrice(run: Run, id: string): number {
  return discount(run, VOUCHER[id]?.cost ?? 10);
}

export function rerollPrice(run: Run): number {
  const s = run.shop!;
  if (s.freeRerolls > 0) return 0;
  return Math.max(0, s.rerollCost);
}

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
    if (r.next() < 0.4) card.ink = r.pick(['jade', 'crimson', 'gilded', 'glass', 'stone', 'lucky', 'spirit', 'ash'] as InkId[]);
    if (r.next() < 0.12) card.seal = r.pick(['red', 'gold', 'blue', 'purple'] as SealId[]);
    if (r.next() < 0.08) card.finish = r.pick(['foil', 'holo', 'prism'] as FinishId[]);
  }
  return card;
}

function rollShopItem(run: Run): ShopItem {
  const r = rng(run);
  const fortuneW = hasVoucher(run, 'fortune_emporium') ? 16 : hasVoucher(run, 'fortune_stall') ? 8 : 4;
  const starW = hasVoucher(run, 'star_emporium') ? 16 : hasVoucher(run, 'star_stall') ? 8 : 4;
  const cardW = hasVoucher(run, 'card_tray') ? 4 : 0;
  const maskW = run.shoeId === 'spirit' ? 2 : 0;
  const kinds: [string, number][] = [['charm', 20], ['fortune', fortuneW], ['star', starW], ['card', cardW], ['mask', maskW]];
  const kind = r.weighted(kinds, (k) => k[1])[0];
  const uid = run.nextId++;
  if (kind === 'charm') {
    const exclude = run.shop?.items.filter((i) => i.kind === 'charm').map((i) => (i as { id: string }).id) ?? [];
    const id = rollCharm(run, { exclude });
    const finish = rollFinish(run);
    return { kind: 'charm', uid, id, finish, price: charmPrice(run, id, finish) };
  }
  if (kind === 'card') {
    const card = randomCard(run, hasVoucher(run, 'card_market'));
    return { kind: 'card', uid, card, price: discount(run, 1 + (card.ink ? 1 : 0) + (card.seal ? 1 : 0) + (card.finish ? 2 : 0)) };
  }
  const cons = kind as ConsKind;
  const pool = cons === 'fortune' ? FORTUNES : cons === 'star' ? STARS : MASKS.filter((m) => m.id !== 'silent_mask');
  const id = r.pick(pool).id;
  return { kind: 'cons', uid, cons, id, price: consPrice(run, cons) };
}

function rollPack(run: Run, notMask = false) {
  const r = rng(run);
  const pool = PACKS.filter((p) => !(notMask && p.kind === 'mask'));
  const p = r.weighted(pool, (x) => x.weight);
  return { uid: run.nextId++, packId: p.id, price: packPrice(run, p.id) };
}

export function openShop(run: Run) {
  run.phase = 'shop';
  const slots = 2 + (hasVoucher(run, 'overstock') ? 1 : 0) + (hasVoucher(run, 'overstock_plus') ? 1 : 0);
  run.shop = {
    items: [],
    packs: [],
    voucher: run.flags.nightVoucherSold ? null : run.flags.nightVoucher ?? null,
    rerollCost: 5 - (hasVoucher(run, 'reroll_surplus') ? 2 : 0) - (hasVoucher(run, 'reroll_glut') ? 2 : 0),
    rerollsDone: 0,
    freeRerolls: 0,
  };
  const s = run.shop;
  for (let i = 0; i < slots; i++) s.items.push(rollShopItem(run));
  // First shop always has a normal Charm bundle so a run can get going.
  s.packs.push(run.night === 1 && !run.flags.firstShop ? { uid: run.nextId++, packId: 'charm_normal', price: packPrice(run, 'charm_normal') } : rollPack(run));
  s.packs.push(rollPack(run));
  run.flags.firstShop = true;
  fireTags(run, 'shop');
  const tagCharm = run.flags.shopCharm as { rarity?: 1 | 2 | 3; finish?: FinishId } | undefined;
  if (tagCharm) {
    const id = rollCharm(run, { rarity: tagCharm.rarity });
    s.items.unshift({ kind: 'charm', uid: run.nextId++, id, finish: tagCharm.finish, price: 0 });
    run.flags.shopCharm = undefined;
  }
  if (run.flags.coupon) {
    for (const it of s.items) it.price = 0;
    for (const p of s.packs) p.price = 0;
    run.flags.coupon = false;
  }
  if (run.flags.d6) {
    s.rerollCost = 0;
    run.flags.d6 = false;
  }
  if (run.flags.extraVoucher) {
    run.flags.extraVoucher = 0;
    const avail = availableVouchers(run).filter((v) => v !== s.voucher);
    if (avail.length) run.flags.bonusVoucher = rng(run).pick(avail);
  }
  fire(run, 'shopEnter');
  for (const it of s.items) if (it.kind === 'charm') discover(run, 'charm', it.id);
}

export function reroll(run: Run): boolean {
  const s = run.shop;
  if (!s) return false;
  const price = rerollPrice(run);
  if (run.money - price < debtFloor(run)) return false;
  run.money -= price;
  if (s.freeRerolls > 0) s.freeRerolls--;
  else s.rerollCost += 1;
  s.rerollsDone++;
  run.stats.rerolls++;
  const slots = s.items.filter((i) => !(i.kind === 'charm' && i.price === 0 && !i.sold)).length;
  s.items = [];
  for (let i = 0; i < Math.max(slots, 2 + (hasVoucher(run, 'overstock') ? 1 : 0) + (hasVoucher(run, 'overstock_plus') ? 1 : 0)); i++) s.items.push(rollShopItem(run));
  fire(run, 'reroll');
  for (const it of s.items) if (it.kind === 'charm') discover(run, 'charm', it.id);
  return true;
}

function debtFloor(run: Run): number {
  return has(run, 'iou_note') ? -20 : 0;
}

export function canAfford(run: Run, price: number): boolean {
  return run.money - price >= debtFloor(run);
}

export type BuyResult = { ok: true } | { ok: false; reason: string };

export function buyItem(run: Run, uid: number, useNow = false): BuyResult {
  const s = run.shop;
  const it = s?.items.find((i) => i.uid === uid);
  if (!s || !it || it.sold) return { ok: false, reason: 'Gone' };
  if (!canAfford(run, it.price)) return { ok: false, reason: 'Not enough Bucks' };
  if (it.kind === 'charm') {
    const room = it.finish === 'phantom' || run.charms.length < charmSlots(run);
    if (!room) return { ok: false, reason: 'No Doodad slots' };
    run.money -= it.price;
    run.charms.push(makeCharm(run, it.id, it.finish));
    run.stats.charmsBought++;
    discover(run, 'charm', it.id);
  } else if (it.kind === 'cons') {
    if (!useNow && run.consumables.length >= consSlots(run)) return { ok: false, reason: 'No consumable slots' };
    run.money -= it.price;
    const inst = { uid: run.nextId++, kind: it.cons, id: it.id, finish: it.finish };
    run.consumables.push(inst);
    discover(run, 'cons', it.id);
  } else {
    run.money -= it.price;
    const card = { ...it.card, id: run.nextId++ };
    run.deck.push(card);
    fire(run, 'cardAdded', card);
  }
  it.sold = true;
  return { ok: true };
}

export function buyVoucher(run: Run, bonus = false): BuyResult {
  const s = run.shop;
  const id = bonus ? run.flags.bonusVoucher : s?.voucher;
  if (!s || !id) return { ok: false, reason: 'Gone' };
  const price = voucherPrice(run, id);
  if (!canAfford(run, price)) return { ok: false, reason: 'Not enough Bucks' };
  run.money -= price;
  run.vouchers.push(id);
  discover(run, 'voucher', id);
  VOUCHER[id]?.onBuy?.(ctx(run));
  if (bonus) run.flags.bonusVoucher = null;
  else {
    s.voucher = null;
    run.flags.nightVoucherSold = true;
  }
  return { ok: true };
}

export function sellCharm(run: Run, uid: number): boolean {
  const k = run.charms.find((x) => x.uid === uid);
  if (!k) return false;
  const v = sellValue(k);
  run.flags.selling = true;
  const c = ctx(run);
  (c as any)._src = { kind: 'charm', uid };
  CHARM[k.id]?.sold?.(c, k);
  run.charms = run.charms.filter((x) => x.uid !== uid);
  run.flags.selling = false;
  run.money += v;
  run.stats.charmsSold++;
  fire(run, 'anySold', 'charm');
  return true;
}

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

export function buyPack(run: Run, uid: number): BuyResult {
  const s = run.shop;
  const p = s?.packs.find((x) => x.uid === uid);
  if (!s || !p || p.sold) return { ok: false, reason: 'Gone' };
  if (!canAfford(run, p.price)) return { ok: false, reason: 'Not enough Bucks' };
  run.money -= p.price;
  p.sold = true;
  openPack(run, p.packId, 'shop');
  return { ok: true };
}

export function openPack(run: Run, packId: string, returnTo: 'shop' | 'trail') {
  const def = PACK[packId];
  const r = rng(run);
  const pack: OpenPack = { packId, picksLeft: def.picks, options: [], spread: [], returnTo };
  const used = new Set<string>();
  for (let i = 0; i < def.size; i++) {
    if (def.kind === 'charm') {
      // A Bounty always has one rare and two uncommons.
      const rarity = packId === 'bounty' ? ((i === 0 ? 3 : 2) as 2 | 3) : undefined;
      const id = rollCharm(run, { exclude: [...used], rarity });
      used.add(id);
      pack.options.push({ kind: 'charm', id, finish: rollFinish(run) });
    } else if (def.kind === 'card') {
      const card = randomCard(run, true);
      pack.options.push({ kind: 'card', card });
    } else {
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
      if (def.kind === 'mask' && r.next() < 0.004) id = 'silent_mask';
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
  if (o.kind === 'charm') {
    if (o.finish !== 'phantom' && run.charms.length >= charmSlots(run)) return { ok: false, reason: 'No Doodad slots' };
    run.charms.push(makeCharm(run, o.id, o.finish));
    discover(run, 'charm', o.id);
  } else if (o.kind === 'card') {
    const card = { ...o.card, id: run.nextId++ };
    run.deck.push(card);
    fire(run, 'cardAdded', card);
  } else {
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
  run.phase = p?.returnTo === 'trail' ? 'trail' : 'shop';
  maybeOpenTagPack(run);
}

/** Tokens that open a bundle immediately. */
export function maybeOpenTagPack(run: Run): boolean {
  const id = run.flags.openPack as string | undefined;
  if (!id || run.pack) return false;
  run.flags.openPack = undefined;
  openPack(run, id, run.phase === 'shop' ? 'shop' : 'trail');
  return true;
}

// ---------------------------------------------------------------------------
// Leaving the shop
// ---------------------------------------------------------------------------

export function leaveShop(run: Run) {
  fire(run, 'shopLeave');
  run.shop = null;
  run.flags.bonusVoucher = null;
  finishNode(run);
}

export function tagDef(id: string) {
  return TAG[id];
}

export function shoeDef(id: string) {
  return SHOE[id];
}

