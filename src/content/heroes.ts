// Playable gunslingers: who you are on the trail, and the edge you start with.

import type { Run } from '../core/types';
import { createCharm } from '../game/engine';

export interface HeroDef {
  id: string;
  /** Portrait preset in ui/portraits. */
  portrait: string;
  name: string;
  title: string;
  perk: string;
  text: string;
  apply?: (run: Run) => void;
}

export const HEROES: HeroDef[] = [
  {
    id: 'kid',
    portrait: 'hero_kid',
    name: 'The Kid',
    title: 'Greenhorn with a Lucky Bandana',
    perk: 'Lucky Bandana',
    text: 'Start the run with a random {g:uncommon} Doodad',
    apply: (run) => {
      createCharm(run, { rarity: 2 });
    },
  },
  {
    id: 'belle',
    portrait: 'hero_belle',
    name: 'Belle Starling',
    title: 'Riverboat Card Sharp',
    perk: 'Silver Tongue',
    text: 'Start with {$:12} more, and every side bet pays {g:$2} extra',
    apply: (run) => {
      run.money += 12;
    },
  },
  {
    id: 'doc',
    portrait: 'hero_doc',
    name: 'Doc Hollandaise',
    title: 'Tough Old Bird',
    perk: 'Thick Feathers',
    text: '{g:+3} max Grit, and you start with it all',
    apply: (run) => {
      run.maxGrit += 3;
      run.grit += 3;
    },
  },
  {
    id: 'hen',
    portrait: 'hero_hen',
    name: 'Calamity Hen',
    title: 'Hot-Blooded Gunslinger',
    perk: 'Short Fuse',
    text: 'Your {g:Hot Streak} builds twice as fast',
  },
];

export const HERO: Record<string, HeroDef> = Object.fromEntries(HEROES.map((h) => [h.id, h]));

export function applyHero(run: Run, id: string) {
  const h = HERO[id] ?? HEROES[0];
  run.hero = h.id;
  h.apply?.(run);
}
