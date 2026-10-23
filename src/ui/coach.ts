// First-time coaching notes from Doc Hoot, plus the How to Play sheet.

import { app, button, modal } from './app';
import { div, fmt, h } from './dom';
import { profile, saveProfile } from './profile';
import { portraitOf } from './characters';
import { iconSvg } from './icons';
import { sfx } from '../fx/audio';

/** Where a note sits on the 1600x900 stage, and which way its pointer faces. */
export interface CoachPos {
  x: number;
  y: number;
  /** Side of the note the pointer sticks out of, toward the thing being explained. */
  point?: 'left' | 'right' | 'up' | 'down';
  w?: number;
}

const NOTES: Record<string, string> = {
  trail: 'This is the trail. Click a stop that is lit up to ride there. Card tables pay {$:Bucks}. The Outlaw at the far end guards the road to the next town.',
  grit: 'Those horseshoes are your {g:Grit}. Fall short at a table and you lose some. At zero the run is over. The Doc and the campfire patch you back up.',
  table: 'Reach the score on the poster before you run out of hands. Each bullet in the revolver down there is one hand of blackjack.',
  wager: 'Pick a wager before you deal. {g:Dollar} doubles the score and {g:Bankroll} triples it, but losing the hand costs 1 or 2 {g:Grit}.',
  hand: 'Get closer to 21 than the dealer without going over. {g:Hit} takes a card, {g:Stand} ends your turn. {g:Double} takes one card and doubles the score but uses an extra hand. {g:Fold} throws a bad hand away for free, a few times per table.',
  score: 'A winning hand scores {c:Pot} × {m:Odds}. The kind of win sets the starting numbers, every card adds its value to the {c:Pot}, and Doodads pile on more.',
  store: 'Doodads ride in your bandolier along the bottom and work every hand on their own. Tonics and the like go in the satchel; click one to use it.',
  outlaw: 'Every Outlaw bends one rule. The curse is printed on the Wanted poster. Read it before you play.',
};

let open: Promise<void> = Promise.resolve();

export function tipsOn(): boolean {
  return profile.settings.tips !== false;
}

/** Show a note once per profile. Notes queue up if several fire together. */
export function coach(id: keyof typeof NOTES, pos: CoachPos): Promise<void> {
  if (!tipsOn() || profile.tips[id]) return Promise.resolve();
  profile.tips[id] = true;
  saveProfile();
  open = open.then(() => show(NOTES[id], pos));
  return open;
}

function show(text: string, pos: CoachPos): Promise<void> {
  return new Promise((resolve) => {
    const note = div(`coach point-${pos.point ?? 'none'}`);
    note.style.left = `${pos.x}px`;
    note.style.top = `${pos.y}px`;
    if (pos.w) note.style.width = `${pos.w}px`;
    const done = () => {
      note.classList.add('out');
      sfx('select');
      setTimeout(() => note.remove(), 180);
      window.removeEventListener('keydown', onKey, true);
      resolve();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        done();
      }
    };
    note.append(
      h('div', { class: 'coach-face', html: portraitOf('doc', 'neutral') }),
      div('coach-body', div('coach-who', 'Doc Hoot'), h('div', { class: 'coach-text', html: fmt(text) }), div('coach-foot', button('Got it', 'small primary', done), button('No more tips', 'tiny ghost', () => {
        profile.settings.tips = false;
        saveProfile();
        done();
      }))),
    );
    app.modalLayer.appendChild(note);
    window.addEventListener('keydown', onKey, true);
    sfx('deal');
  });
}

export function resetTips() {
  profile.tips = {};
  profile.settings.tips = true;
  saveProfile();
}

// ---------------------------------------------------------------------------
// How to Play
// ---------------------------------------------------------------------------

const RULES: [string, string, string][] = [
  ['map', 'Ride the trail', 'Each town is a map. Pick your route from left to right: card tables, the store, the Doc, a campfire, or something strange. The Outlaw waits at the end. Beat seven Outlaws to win.'],
  ['revolver', 'Play blackjack', 'Get closer to 21 than the dealer without going over. Number cards are worth their number, faces are 10, Aces are 1 or 11. The dealer draws until 17. Five cards without busting is a {h:charlie} and always wins.'],
  ['wanted', 'Beat the score', 'Every table has a target on the poster. Winning hands add to your winnings. Reach the target before your bullets (hands) run out and you collect the reward.'],
  ['coins', 'Pot × Odds', 'A winning hand scores {c:Pot} × {m:Odds}. The kind of win (a plain win, a {h:blackjack}, a hand of one suit and so on) sets the starting numbers. Each card adds its value to the Pot. Level up a kind of win with Tall Tales or at the campfire.'],
  ['horseshoe', 'Grit', 'Grit is your health. You lose it when you miss a target or lose a hand with a big wager. At zero the run ends.'],
  ['bullet', 'Doodads', 'Doodads are the trinkets in your bandolier. They trigger by themselves, left to right, so order matters. Drag them to rearrange. Buy them at the store or win them at the Bank.'],
];

export function openHowToPlay() {
  const box = div('howto');
  box.append(div('ri-title', 'How to Play'));
  const grid = div('howto-grid');
  for (const [icon, title, text] of RULES) {
    grid.appendChild(div('howto-item', h('div', { class: 'howto-icon', html: iconSvg(icon) }), div('howto-title', title), h('div', { class: 'howto-text', html: fmt(text) })));
  }
  box.append(
    grid,
    div('howto-keys', 'Keys: H hit · S stand · D double · P split · F fold · Space deal'),
  );
  let close = () => {};
  box.appendChild(div('howto-foot', button('Saddle Up', 'primary', () => close())));
  close = modal(box, { cls: 'wide' });
}
