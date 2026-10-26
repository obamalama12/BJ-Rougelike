// The fork in the road after every table you win: three unmarked paths, one pick (plus one more for
// each Bounty, Bank Job or other extra path you've earned). What waits down a path comes from
// content/paths, shuffled per seed. A new ability that doesn't fit pushes out one you already have.

import type { Run } from '../core/types';
import { ABILITY, INSTANT, PATHS, outcomeOf, type Outcome } from '../content/paths';
import { charmSlots, discover, makeCharm, rng } from './engine';
import { finishNode } from './trail';

/** How many unmarked paths the trail forks into. */
export const ROAD_CHOICES = 3;

/** Open the fork in the road after a won table. */
export function startRoad(run: Run) {
  const picks = 1 + (run.flags.bonusPaths ?? 0);
  run.flags.bonusPaths = 0;
  run.road = { options: [], picksLeft: picks };
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
  road.options = rng(run).shuffle(pool).slice(0, ROAD_CHOICES);
  road.taken = undefined;
  road.mustDrop = undefined;
}

/** Walk down one of the offered paths and find out what was there. */
export function takeRoad(run: Run, path: number): Outcome | null {
  const road = run.road;
  if (!road || road.taken || !road.options.includes(path)) return null;
  const outcome = outcomeOf(run, path);
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

/** Leave an ability behind to make room for the one you just found. */
export function dropAbility(run: Run, uid: number): boolean {
  const road = run.road;
  if (!road?.mustDrop || uid === road.mustDrop) return false;
  if (!run.charms.some((k) => k.uid === uid)) return false;
  run.charms = run.charms.filter((k) => k.uid !== uid);
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
