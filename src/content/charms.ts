// The ability registry. Doodads are gone: every effect a run carries now comes from the roads
// it took (src/content/paths.ts). The engine still calls these "charms" internally, and runs
// them through the same hooks.
// Text tokens: {c:} Pot, {m:} Odds, {x:} xOdds, {$:} Bucks, {g:} highlight,
// {s:suit} suit name, {h:handType} hand type name, {r:} warning, {d:} dim.

import type { CharmDef } from '../game/api';
import type { CharmInst, HandTypeId, Run } from '../core/types';
import { HAND_TYPE } from '../core/cards';
import { ABILITIES } from './paths';

export const CHARMS: CharmDef[] = [...ABILITIES];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const CHARM: Record<string, CharmDef> = Object.fromEntries(CHARMS.map((d) => [d.id, d]));

export function sellValue(s: CharmInst): number {
  const d = CHARM[s.id];
  const base = Math.max(1, Math.floor((d?.cost ?? 2) / 2));
  return base + (s.extraSell ?? 0);
}

export function charmSlotsFree(run: Run): number {
  let slots = run.baseCharmSlots;
  for (const k of run.charms) {
    if (k.finish === 'phantom') slots += 1;
    slots += CHARM[k.id]?.slots?.charm ?? 0;
  }
  return slots - run.charms.length;
}

export function mostPlayed(run: Run): HandTypeId {
  let best: HandTypeId = 'outdraw';
  let n = -1;
  for (const [k, v] of Object.entries(run.handPlays) as [HandTypeId, number][]) {
    if (v > n) {
      n = v;
      best = k;
    }
  }
  return best;
}

export function runningCount(run: Run): number {
  const t = run.table;
  if (!t) return 0;
  let n = 0;
  const byId = new Map(run.deck.map((c) => [c.id, c]));
  for (const id of t.discard) {
    const c = byId.get(id);
    if (!c || c.ink === 'stone') continue;
    if (c.rank <= 6) n += 1;
    else if (c.rank >= 10) n -= 1;
  }
  return n;
}

export function startSize(run: Run): number {
  return run.flags.startDeckSize ?? 52;
}

export function charmText(s: CharmInst, run: Run): string {
  const d = CHARM[s.id];
  if (!d) return '';
  return typeof d.text === 'function' ? d.text(s, run) : d.text;
}

export const HAND_NAME = (h: HandTypeId) => HAND_TYPE[h].name;
