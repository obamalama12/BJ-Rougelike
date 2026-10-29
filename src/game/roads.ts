// The fork in the road after you beat one of the Outlaw's gang: three unmarked paths, one pick. What waits down a path comes from
// content/paths, shuffled per seed. With a full belt, a new Boon can be passed up; a new Bane pushes
// out one you already have.

import type { Run } from '../core/types';
import { ABILITY, INSTANT, PATHS, RARE_PEEK, RARE_PEEK_CHANCE, RARE_SAVE, RARE_SAVE_CHANCE, isGood, outcomeOf, type Outcome } from '../content/paths';
import { charmSlots, clampGrit, discover, makeCharm, rng } from './engine';
import { finishNode } from './trail';

/** How many unmarked paths the trail forks into. */
export const ROAD_CHOICES = 3;

/** Open the fork in the road after a won table. */
export function startRoad(run: Run) {
  // One pick per fork: forks only come from beating a gang member.
  run.flags.bonusPaths = 0;
  run.road = { options: [], picksLeft: 1 };
  dealRoads(run);
  run.phase = 'road';
}

/** Lay out a fresh set of paths this run hasn't walked yet. */
function dealRoads(run: Run) {
  const road = run.road!;
  let taken: number[] = run.flags.pathsTaken ?? [];
  let pool = PATHS.map((_, i) => i).filter((i) => !taken.includes(i));
  // Walked all hundred? The roads start over.
  if (pool.length < ROAD_CHOICES) {
    taken = [];
    run.flags.pathsTaken = taken;
    pool = PATHS.map((_, i) => i);
  }
  // One road that looks inviting, one that looks grim and one that's just strange, when the
  // untaken roads allow it. Looks prove nothing: what's down each one is shuffled by seed.
  const r = rng(run);
  const shuffled = r.shuffle(pool);
  const picks: number[] = [];
  for (const tone of r.shuffle(['lure', 'omen', 'odd'] as const)) {
    const i = shuffled.find((p) => PATHS[p].tone === tone && !picks.includes(p));
    if (i !== undefined) picks.push(i);
  }
  for (const p of shuffled) if (picks.length < ROAD_CHOICES && !picks.includes(p)) picks.push(p);
  road.options = picks.slice(0, ROAD_CHOICES);
  road.taken = undefined;
  road.mustDrop = undefined;
}

/** Walk down one of the offered paths and find out what was there. */
export function takeRoad(run: Run, path: number): Outcome | null {
  const road = run.road;
  if (!road || road.taken || !road.options.includes(path)) return null;
  let outcome = outcomeOf(run, path);
  // Now and then a good road turns up something rarer than what it was hiding: Lucky Rabbit's
  // Foot 5% of the time, Gambler's Glass 5%. Never one you already carry.
  if (isGood(outcome)) {
    const roll = rng(run).next();
    let edge = 0;
    for (const [d, chance] of [[RARE_SAVE, RARE_SAVE_CHANCE], [RARE_PEEK, RARE_PEEK_CHANCE]] as const) {
      if (roll < (edge += chance)) {
        if (!run.charms.some((k) => k.id === d.id)) outcome = { kind: 'ability', id: d.id };
        break;
      }
    }
  }
  road.taken = { path, outcome };
  road.picksLeft--;
  run.flags.pathsTaken = [...(run.flags.pathsTaken ?? []), path];
  run.stats.pathsTaken = (run.stats.pathsTaken ?? 0) + 1;
  if (outcome.kind === 'instant') {
    INSTANT[outcome.id]?.apply(run);
  } else if (ABILITY[outcome.id]) {
    const k = makeCharm(run, outcome.id);
    run.charms.push(k);
    discover(run, 'charm', outcome.id);
    // A full belt: the new ability stays, and one of the others has to go.
    if (run.charms.length > charmSlots(run)) road.mustDrop = k.uid;
  }
  return outcome;
}

/** Can the ability just found be turned down? A Boon can; a Bane is forced on you. */
export function canRefuseNew(run: Run): boolean {
  const k = run.charms.find((x) => x.uid === run.road?.mustDrop);
  return !!k && !ABILITY[k.id]?.bane;
}

/** Leave an ability behind to make room for the one you just found (or, for a Boon, pass on the
 *  new one instead). */
export function dropAbility(run: Run, uid: number): boolean {
  const road = run.road;
  if (!road?.mustDrop) return false;
  if (uid === road.mustDrop && !canRefuseNew(run)) return false;
  if (!run.charms.some((k) => k.uid === uid)) return false;
  run.charms = run.charms.filter((k) => k.uid !== uid);
  clampGrit(run);
  // Heavy Saddle can leave the belt over-full even after one drop.
  if (run.charms.length <= charmSlots(run)) road.mustDrop = undefined;
  return true;
}

/** Done looking at what the path held: on to the next fork, or back to the trail. */
export function leaveRoad(run: Run): boolean {
  const road = run.road;
  if (!road?.taken || road.mustDrop) return false;
  if (road.picksLeft > 0) {
    dealRoads(run);
    return true;
  }
  run.road = null;
  finishNode(run);
  return true;
}
