import { describe, expect, it } from 'vitest';
import { classifyHand, handTotal } from '../src/core/cards';
import type { Card, Rank, Suit } from '../src/core/types';
import { getRules, newRun } from '../src/game/engine';
import { simulate } from '../scripts/simulate';
import { CHARMS } from '../src/content/charms';
import { FORTUNES, MASKS, STARS } from '../src/content/consumables';
import { HOSTS } from '../src/content/hosts';

let nid = 1;
const c = (rank: Rank, suit: Suit = 'moon', extra: Partial<Card> = {}): Card => ({ id: nid++, rank, suit, ...extra });

describe('hand totals', () => {
  const rules = getRules(newRun('T', 'paper', 1));
  it('counts aces soft then hard', () => {
    expect(handTotal([c(14), c(6)], rules)).toMatchObject({ total: 17, soft: true });
    expect(handTotal([c(14), c(6), c(9)], rules)).toMatchObject({ total: 16, soft: false });
    expect(handTotal([c(14), c(14), c(9)], rules)).toMatchObject({ total: 21, soft: true });
  });
  it('busts over the limit', () => {
    expect(handTotal([c(13), c(12), c(2)], rules).bust).toBe(true);
    expect(handTotal([c(13), c(12), c(2)], { ...rules, bustLimit: 22 }).bust).toBe(false);
  });
  it('stone cards are worth zero and ash saves a bust', () => {
    expect(handTotal([c(13), c(2, 'moon', { ink: 'stone' })], rules).total).toBe(10);
    const t = handTotal([c(13), c(9), c(5, 'leaf', { ink: 'ash' })], rules);
    expect(t.bust).toBe(false);
    expect(t.ashUsed.length).toBe(1);
  });
});

describe('hand types', () => {
  const rules = getRules(newRun('T', 'paper', 1));
  it('recognises naturals and royals', () => {
    expect(classifyHand([c(14, 'moon'), c(10, 'flame')], 21, 'blackjack', rules)).toBe('blackjack');
    expect(classifyHand([c(14, 'moon'), c(13, 'moon')], 21, 'blackjack', rules)).toBe('royal');
  });
  it('recognises sevens, flushes, charlies and underdogs', () => {
    expect(classifyHand([c(7), c(7, 'flame'), c(7, 'bell')], 21, 'win', rules)).toBe('sevens');
    expect(classifyHand([c(9), c(5), c(7)], 21, 'win', rules)).toBe('flush');
    expect(classifyHand([c(2), c(3, 'flame'), c(2, 'bell'), c(4), c(3, 'leaf')], 14, 'charlie', rules)).toBe('charlie');
    expect(classifyHand([c(10), c(3, 'flame')], 13, 'dealerbust', rules)).toBe('underdog');
    expect(classifyHand([c(10), c(8, 'flame')], 18, 'dealerbust', rules)).toBe('dealerbust');
    expect(classifyHand([c(10), c(9, 'flame')], 19, 'win', rules)).toBe('outdraw');
  });
});

describe('content', () => {
  it('has a ton of it, with unique ids', () => {
    const ids = [...CHARMS, ...FORTUNES, ...STARS, ...MASKS].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(HOSTS.length).toBeGreaterThanOrEqual(30);
  });
  it('has 100 paths, each hiding a different outcome', async () => {
    const { PATHS, ABILITIES, INSTANTS, pathOutcomes } = await import('../src/content/paths');
    expect(PATHS.length).toBe(100);
    // Every ability and instant but the rare peek, which no path hides.
    expect(ABILITIES.length + INSTANTS.length).toBe(101);
    expect(pathOutcomes('SEED1').length).toBe(100);
    expect(pathOutcomes('SEED1').some((o) => o.id === 'gamblers_glass')).toBe(false);
    const map = pathOutcomes('SEED1');
    expect(new Set(map.map((o) => `${o.kind}:${o.id}`)).size).toBe(100);
    // Same seed, same roads; another seed shuffles them.
    expect(pathOutcomes('SEED1')).toEqual(map);
    expect(pathOutcomes('SEED2')).not.toEqual(map);
  });
  it('has a cutscene for every outcome', async () => {
    const { ABILITIES, INSTANTS } = await import('../src/content/paths');
    const { SCENES } = await import('../src/content/cutscenes');
    for (const o of [...ABILITIES, ...INSTANTS]) {
      expect(SCENES[o.id], o.id).toBeTruthy();
      expect(SCENES[o.id].line.length, o.id).toBeGreaterThan(20);
    }
    expect(Object.keys(SCENES).length).toBe(ABILITIES.length + INSTANTS.length);
  });
  it('gives every Outlaw and gunslinger a portrait', async () => {
    const { CHARACTERS } = await import('../src/ui/portraits');
    const { HEROES } = await import('../src/content/heroes');
    for (const h of HOSTS) expect(CHARACTERS[h.id], h.id).toBeTruthy();
    for (const h of HEROES) expect(CHARACTERS[h.portrait], h.id).toBeTruthy();
  });
});

describe('full runs', () => {
  it('plays many seeded runs headlessly without throwing', () => {
    for (let i = 0; i < 60; i++) {
      const shoes = ['paper', 'indigo', 'court', 'little', 'ember', 'twin', 'balance', 'spirit'];
      const r = simulate(`TEST${i}`, shoes[i % shoes.length], 1 + (i % 8));
      expect(r.night).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('trail', () => {
  it('lays out a connected map that ends at the Outlaw', async () => {
    const { reachable } = await import('../src/game/trail');
    for (let i = 0; i < 30; i++) {
      const run = newRun(`MAP${i}`, 'paper', 1);
      const nodes = run.trail.nodes;
      const last = Math.max(...nodes.map((n) => n.col));
      expect(nodes.filter((n) => n.col === last).map((n) => n.kind)).toEqual(['outlaw']);
      expect(nodes.some((n) => n.col === 0 && n.kind === 'saloon')).toBe(true);
      // Every node is reachable from the first column.
      const seen = new Set(reachable(run).map((n) => n.id));
      for (let c = 0; c < last; c++) for (const n of nodes.filter((x) => x.col === c && seen.has(x.id))) n.next.forEach((id) => seen.add(id));
      expect(seen.size).toBe(nodes.length);
    }
  });
});

describe('Woodgas', () => {
  it('keeps hitting until he busts, naturals and 21 included', async () => {
    const { startTable, beginHand, dealTo, afterDeal, stand, dealerShouldHit, dealerHit, cardsOf } = await import('../src/game/table');
    for (let i = 0; i < 40; i++) {
      const run = newRun(`WOOD${i}`, 'paper', 1);
      startTable(run, 'host', 100, 'woodgas');
      beginHand(run);
      dealTo(run, 'player');
      dealTo(run, 'dealer');
      dealTo(run, 'player');
      dealTo(run, 'dealer');
      const deal = afterDeal(run);
      expect(deal.dealerNatural).toBe(false);
      if (run.table!.phase === 'player') stand(run);
      if (!run.table!.hands.some((h) => !h.outcome)) continue;
      while (dealerShouldHit(run)) dealerHit(run);
      expect(handTotal(cardsOf(run, run.table!.dealer), getRules(run), 21, true).bust).toBe(true);
    }
  });
});

describe('the fork in the road', () => {
  it('a new ability on a full belt has to push one of the others out', async () => {
    const { startRoad, takeRoad, dropAbility, leaveRoad } = await import('../src/game/roads');
    const { outcomeOf, ABILITY } = await import('../src/content/paths');
    const { makeCharm, charmSlots } = await import('../src/game/engine');
    const run = newRun('ROADS', 'paper', 1);
    for (const id of ['steady_hand', 'sharp_eye', 'iron_nerve', 'quick_feet', 'patience']) run.charms.push(makeCharm(run, id));
    expect(run.charms.length).toBe(charmSlots(run));
    // Find an offered path that leads to an ability we don't have.
    let found = false;
    for (let tries = 0; tries < 40 && !found; tries++) {
      startRoad(run);
      const p = run.road!.options.find((x) => { const o = outcomeOf(run, x); return o.kind === 'ability' && !run.charms.some((k) => k.id === o.id) && ABILITY[o.id].slots?.charm === undefined; });
      if (p === undefined) continue;
      found = true;
      takeRoad(run, p);
      const keep = run.road!.mustDrop!;
      expect(keep).toBeTruthy();
      expect(leaveRoad(run)).toBe(false); // can't ride on with an over-full belt
      expect(dropAbility(run, keep)).toBe(false); // and the new one can't be the one dropped
      expect(dropAbility(run, run.charms[0].uid)).toBe(true);
      expect(run.charms.length).toBe(charmSlots(run));
      expect(run.charms.some((k) => k.uid === keep)).toBe(true);
    }
    expect(found).toBe(true);
  });
});
