// Persistent profile: settings, lifetime stats, discoveries and the saved run.

import type { Run } from '../core/types';
import { RUN_VERSION, discovered } from '../game/engine';

export interface Settings {
  speed: number;
  music: number;
  sfx: number;
  shader: 'high' | 'low' | 'off';
  particles: boolean;
  shake: boolean;
  grain: boolean;
  motion: boolean;
  /** Draw the whole game in black and white. */
  mono: boolean;
  /** Show the first-time coaching notes. */
  tips: boolean;
}

export interface Profile {
  settings: Settings;
  runs: number;
  wins: number;
  bestHand: number;
  bestNight: number;
  handsPlayed: number;
  blackjacks: number;
  /** Highest stake won for each shoe. */
  stakeWins: Record<string, number>;
  seen: Record<string, true>;
  charmWins: Record<string, number>;
  lastShoe: string;
  lastStake: number;
  lastHero?: string;
  /** Coaching notes already shown. */
  tips: Record<string, true>;
}

const KEY = 'tol.profile.v1';
const RUN_KEY = 'tol.run.v1';

function defaults(): Profile {
  return {
    settings: { speed: 1.5, music: 0.5, sfx: 0.7, shader: 'high', particles: true, shake: true, grain: true, motion: true, mono: false, tips: true },
    runs: 0,
    wins: 0,
    bestHand: 0,
    bestNight: 0,
    handsPlayed: 0,
    blackjacks: 0,
    stakeWins: {},
    seen: {},
    charmWins: {},
    lastShoe: 'paper',
    lastStake: 1,
    tips: {},
  };
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
}

export const profile: Profile = (() => {
  const p = read<Partial<Profile>>(KEY);
  const d = defaults();
  if (!p) return d;
  return { ...d, ...p, settings: { ...d.settings, ...(p.settings ?? {}) } };
})();

export function saveProfile() {
  // Merge discoveries made by the engine.
  for (const [k, id] of discovered.list.splice(0)) profile.seen[`${k}:${id}`] = true;
  write(KEY, profile);
}

export function isSeen(kind: string, id: string) {
  return !!profile.seen[`${kind}:${id}`];
}

export function saveRun(run: Run | null) {
  saveProfile();
  if (!run || run.phase === 'gameover') {
    try {
      localStorage.removeItem(RUN_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  write(RUN_KEY, run);
}

export function loadRun(): Run | null {
  const r = read<Run>(RUN_KEY);
  if (!r || r.version !== RUN_VERSION) return null;
  return r;
}

export function hasSavedRun(): boolean {
  return !!loadRun();
}

export function maxStake(shoe: string): number {
  return Math.min(8, (profile.stakeWins[shoe] ?? 0) + 1);
}
