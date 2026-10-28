// Title screen, new-run setup, and the end-of-run screens.

import type { Card, Rank, Suit } from '../../core/types';
import { SHOES, STAKES, SHOE } from '../../content/shoes';
import { HAND_TYPE } from '../../core/cards';
import { newRun, NIGHTS } from '../../game/engine';
import { continueEndless } from '../../game/shop';
import { randomSeedString } from '../../core/rng';
import { app, button, keyHint, modal, modalTitle, save, tip } from '../app';
import { playingCard, cardBackHtml } from '../art';
import { div, fmt, fmtNum, h, clear } from '../dom';
import { hasSavedRun, loadRun, maxStake, profile, saveProfile, saveRun } from '../profile';
import { background } from '../../fx/background';
import { audio, sfx } from '../../fx/audio';
import { particles } from '../../fx/particles';
import { openOptions } from './options';
import { openCollection } from './collection';
import { iconSvg } from '../icons';
import { nameOf, portraitOf, townName } from '../characters';
import { HERO, HEROES, applyHero } from '../../content/heroes';
import { HOST } from '../../content/hosts';
import { openHowToPlay } from '../coach';
import { suitSvg } from '../suits';
import { version as APP_VERSION } from '../../../package.json';

/** Wanted Level plates: the deck's own print colours rather than screen colours. */
const STAKE_PLATE = ['#6e6250', '#c8402a', '#557a46', '#2f5d8a', '#6a3d6e', '#c9692a', '#8a1e14', '#d99a22'];
const STAR = 'M20 2.5l4.6 10.6 11.5 1-8.7 7.6 2.6 11.3L20 27.1l-10 5.9 2.6-11.3-8.7-7.6 11.5-1z';

// The title screen is rebuilt on every visit, so the window gets one keyboard and one pointer
// listener for good, pointed at whichever title screen is showing. (A listener per visit that only
// unhooked itself on the next key or mouse move kept old screens alive on phones, which have neither.)
let activeTitle: { el: HTMLElement; key: (e: KeyboardEvent) => void } | null = null;
let titleHooked = false;
function hookTitleInput() {
  if (titleHooked) return;
  titleHooked = true;
  window.addEventListener('keydown', (e) => {
    if (activeTitle && !activeTitle.el.isConnected) activeTitle = null;
    activeTitle?.key(e);
  });
  // Layers drift against the pointer for a little depth.
  window.addEventListener('pointermove', (e) => {
    if (activeTitle && !activeTitle.el.isConnected) activeTitle = null;
    if (!activeTitle) return;
    activeTitle.el.style.setProperty('--px', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
    activeTitle.el.style.setProperty('--py', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
  });
  // A glint runs across the logo every 7 seconds: switched on just for the sweep, so the logo
  // sits still (and isn't redrawn) the rest of the time.
  let glints = 0;
  setInterval(() => {
    if (activeTitle && !activeTitle.el.isConnected) activeTitle = null;
    const logo = activeTitle?.el.querySelector('.logo-main');
    if (!logo || document.hidden) return;
    logo.classList.remove('glint');
    void (logo as HTMLElement).offsetWidth;
    logo.classList.add('glint');
    const n = ++glints;
    setTimeout(() => n === glints && logo.classList.remove('glint'), 1600);
  }, 7000);
}

export function titleScreen(): HTMLElement {
  background.setPalette('menu', 1);
  audio.setMood('menu');
  const el = div('title-screen');
  // A standoff: you versus this week's most wanted.
  const rivals = ['chochin_o', 'tsukuyomi', 'tamamo', 'otakemaru', 'daitengu', 'orochi'];
  const rival = rivals[Math.floor(Date.now() / 86400000) % rivals.length];
  const hero = div('title-hero', h('div', { class: 'tc-body', html: portraitOf(HERO[profile.lastHero ?? '']?.portrait ?? 'hero_kid', 'smug') }));
  const villain = div('title-villain', h('div', { class: 'tc-body', html: portraitOf(rival, 'smug') }));
  const bounty = div(
    'title-bounty',
    div('tb-kicker', 'Most Wanted'),
    div('tb-name', nameOf(rival)),
    div('tb-reward', h('span', null, 'Reward'), h('b', null, '$5,000')),
  );
  tip(bounty, () => `<div class="tt-title">${nameOf(rival)}</div><div class="tt-sub2">Wanted</div><div class="tt-body">${fmt(HOST[rival]?.text ?? '')}</div>`, 'left');
  const fan = div('title-fan');
  const fanCards: [Rank, Suit][] = [[14, 'moon'], [13, 'flame'], [12, 'leaf'], [11, 'bell'], [10, 'flame']];
  fanCards.forEach(([r, s], i) => {
    const c: Card = { id: -100 - i, rank: r, suit: s, ink: i === 2 ? 'gilded' : undefined, finish: i === 0 ? 'holo' : i === 4 ? 'foil' : undefined };
    const card = playingCard(c, 'paper');
    card.style.setProperty('--i', String(i - 2));
    fan.appendChild(card);
  });
  const logo = div(
    'logo',
    fan,
    div('logo-top', h('span', null, 'The Legend of')),
    div('logo-main', h('span', { class: 'logo-word' }, 'Buck'), ' ', h('span', { class: 'logo-word' }, 'Ducks')),
    h('div', {
      class: 'logo-sub',
      html: `<span class="logo-suits">${suitSvg('moon')}${suitSvg('flame')}</span><span>Blackjack on the Duck Frontier</span><span class="logo-suits">${suitSvg('leaf')}${suitSvg('bell')}</span>`,
    }),
  );

  // The menu: one column of big entries and a revolver cylinder that slides to the one in focus.
  const items: { label: string; sub: string; act: () => void }[] = [];
  if (hasSavedRun()) {
    items.push({
      label: 'Continue',
      sub: 'Pick up the trail where you left it',
      act: () => {
        app.run = loadRun();
        app.render();
      },
    });
  }
  items.push(
    { label: 'New Run', sub: 'Saddle up with a fresh deck', act: () => openNewRun() },
    { label: 'How to Play', sub: 'Blackjack, the frontier way', act: () => openHowToPlay() },
    { label: 'Collection', sub: 'Abilities, decks and every bird you\u2019ve met', act: () => openCollection() },
    { label: 'Options', sub: 'Sound, speed and motion', act: () => openOptions() },
  );
  const cursor = h('div', { class: 'tm-cursor', html: iconSvg('badge') });
  const sub = div('tm-sub');
  const list = div('tm-list', cursor);
  let focus = 0;
  const entries = items.map((it, i) => {
    const b = h('button', { class: `tm-item${i === 0 ? ' lead' : ''}`, type: 'button' }, h('span', { class: 'tm-label' }, it.label));
    b.style.setProperty('--n', String(i));
    b.addEventListener('pointerenter', () => setFocus(i));
    b.addEventListener('focus', () => setFocus(i, true));
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (app.busy) return;
      sfx('click');
      it.act();
    });
    list.appendChild(b);
    return b;
  });
  const setFocus = (i: number, quiet = false) => {
    if (i === focus && entries[i].classList.contains('on')) return;
    entries[focus]?.classList.remove('on');
    focus = i;
    const b = entries[i];
    b.classList.add('on');
    cursor.style.transform = `translateY(${b.offsetTop + b.offsetHeight / 2 - 22}px)`;
    sub.textContent = items[i].sub;
    sub.classList.remove('swap');
    void sub.offsetWidth;
    sub.classList.add('swap');
    if (!quiet) sfx('hover');
  };
  requestAnimationFrame(() => setFocus(0, true));
  const menu = div('title-menu', list, sub);

  activeTitle = {
    el,
    key: (e) => {
      if (app.modalLayer.childElementCount || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowdown' || k === 's') setFocus((focus + 1) % items.length);
      else if (k === 'arrowup' || k === 'w') setFocus((focus + items.length - 1) % items.length);
      else if (k === 'enter' || k === ' ') entries[focus].click();
      else return;
      e.preventDefault();
    },
  };
  hookTitleInput();

  const stat = (label: string, val: string) => div('ts-cell', div('ts-val', val), div('ts-label', label));
  const stats = div(
    'title-stats',
    stat('Runs', fmtNum(profile.runs)),
    stat('Victories', fmtNum(profile.wins)),
    stat('Best hand', fmtNum(profile.bestHand)),
    stat('Furthest town', `${profile.bestNight} of ${NIGHTS}`),
  );
  const hint = keyHint('title-hint', [['\u2191 \u2193', 'Choose'], ['Enter', 'Confirm']]);
  const versionTag = div('title-version', `v${APP_VERSION}`);
  el.append(div('title-scrim'), villain, hero, div('title-floor'), div('title-dust'), bounty, logo, menu, stats, hint, versionTag);
  return el;
}

export function openNewRun() {
  let shoeIdx = Math.max(0, SHOES.findIndex((s) => s.id === profile.lastShoe));
  let stake = profile.lastStake ?? 1;
  let hero = HERO[profile.lastHero ?? ''] ? profile.lastHero! : HEROES[0].id;
  let seed = '';
  const box = div('newrun');
  const render = () => {
    clear(box);
    const shoe = SHOES[shoeIdx];
    stake = Math.min(stake, maxStake(shoe.id));
    const back = div('nr-back');
    back.innerHTML = `<div class="card pcard down big-back"><div class="card-inner"><div class="face back">${cardBackHtml(shoe.id)}</div></div></div>`;
    const prev = button('‹', 'arrow', () => {
      shoeIdx = (shoeIdx + SHOES.length - 1) % SHOES.length;
      sfx('deal');
      render();
    });
    const next = button('›', 'arrow', () => {
      shoeIdx = (shoeIdx + 1) % SHOES.length;
      sfx('deal');
      render();
    });
    const dots = div('nr-dots', ...SHOES.map((_, i) => h('span', { class: `nr-dot${i === shoeIdx ? ' on' : ''}` })));
    const shoeInfo = div(
      'nr-shoe-info',
      div('nr-shoe-idx', `Deck No. ${shoeIdx + 1} of ${SHOES.length}`),
      div('nr-shoe-name', shoe.name),
      h('div', { class: 'nr-shoe-text', html: fmt(shoe.text) }),
      dots,
    );
    const stakes = div('nr-stakes');
    for (const s of STAKES) {
      const locked = s.id > maxStake(shoe.id);
      const plate = STAKE_PLATE[s.id - 1] ?? s.color;
      const chip = h('button', { class: `stake-chip${s.id === stake ? ' on' : ''}${locked ? ' locked' : ''}`, type: 'button', 'aria-label': `${s.name}${locked ? ' (locked)' : ''}` });
      chip.style.setProperty('--c', plate);
      chip.innerHTML = `<svg class="sc-star" viewBox="0 0 40 36" aria-hidden="true"><path d="${STAR}"/></svg><span class="sc-num">${s.id}</span>`;
      chip.addEventListener('click', () => {
        if (locked) return;
        stake = s.id;
        sfx('select');
        render();
      });
      tip(chip, () => `<div class="tt-title">${s.name}</div><div class="tt-sub2">Wanted Level ${s.id}</div><div class="tt-body">${fmt(s.text)}${s.id > 1 ? '<br><span class="t-dim">Includes every lower level</span>' : ''}</div>${locked ? '<div class="tt-sub bad">Win with this deck at the level below to unlock</div>' : ''}`);
      stakes.appendChild(chip);
    }
    const st = STAKES[stake - 1];
    const stText = h('div', { class: 'nr-stake-text' }, h('span', { class: 'nr-stake-name' }, st.name), h('span', { class: 'nr-stake-desc', html: fmt(st.text) }));
    stText.style.setProperty('--c', STAKE_PLATE[stake - 1] ?? st.color);
    const seedIn = h('input', { class: 'seed-input', placeholder: 'Random', maxlength: 12, value: seed, 'aria-label': 'Seed' }) as HTMLInputElement;
    seedIn.addEventListener('input', () => (seed = seedIn.value.toUpperCase().replace(/[^A-Z0-9]/g, '')));
    // Pick your gunslinger
    const heroes = div('nr-heroes');
    for (const hd of HEROES) {
      const on = hd.id === hero;
      const b = h('button', { class: `nr-hero${on ? ' on' : ''}`, type: 'button', 'aria-pressed': on ? 'true' : 'false' });
      b.append(h('div', { class: 'nr-hero-face', html: portraitOf(hd.portrait, on ? 'smug' : 'neutral') }), div('nr-hero-name', hd.name));
      b.addEventListener('click', () => {
        hero = hd.id;
        sfx('quack');
        render();
      });
      heroes.appendChild(b);
    }
    const hd = HERO[hero];
    const heroText = h('div', { class: 'nr-hero-text' }, h('span', { class: 'nr-hero-perk' }, hd.perk), h('span', { html: fmt(hd.text) }));
    box.append(
      modalTitle('nr-title', 'Saddle Up'),
      div('nr-sub', h('span', null, 'Your Gunslinger')),
      heroes,
      heroText,
      div('nr-sub', h('span', null, 'Your Deck')),
      div('nr-carousel', prev, back, shoeInfo, next),
      div('nr-sub', h('span', null, 'Wanted Level')),
      stakes,
      stText,
      div('nr-foot', h('label', { class: 'seed-field' }, h('span', { class: 'seed-label' }, 'Seed'), seedIn), button('Begin', 'primary big', () => start())),
    );
  };
  const start = () => {
    const shoe = SHOES[shoeIdx];
    profile.lastShoe = shoe.id;
    profile.lastStake = stake;
    profile.lastHero = hero;
    profile.runs++;
    saveProfile();
    app.run = newRun(seed || randomSeedString(), shoe.id, stake);
    applyHero(app.run, hero);
    save();
    closeFn();
    sfx('gong');
    app.render();
  };
  render();
  const closeFn = modal(box, { cls: 'newrun-modal' });
}

export function gameOverScreen(): HTMLElement {
  const run = app.run!;
  background.setPalette('over', 0);
  audio.setMood('menu');
  recordEnd(false);
  const el = div('end-screen over');
  el.append(
    div('end-kicker', h('span', null, 'The End of the Trail')),
    div('end-title', 'You Bit the Dust'),
    div('end-sub', `Out of Grit in ${townName(run.night)}, town ${run.night} of ${NIGHTS}.`),
    runSummary(),
    div(
      'end-btns',
      button('New Run', 'primary big', () => {
        app.run = null;
        saveRun(null);
        openNewRun();
        app.render();
      }),
      button('Main Menu', 'big ghost', () => {
        app.run = null;
        saveRun(null);
        app.render();
      }),
    ),
  );
  return el;
}

export function victoryScreen(): HTMLElement {
  const run = app.run!;
  background.setPalette('victory', 1);
  audio.setMood('shop');
  recordEnd(true);
  const el = div('end-screen victory');
  el.append(
    div('end-badges', ...Array.from({ length: NIGHTS }, (_, i) => {
      const l = div('end-badge');
      l.style.setProperty('--i', String(i));
      l.innerHTML = iconSvg('badge');
      return l;
    })),
    div('end-kicker', h('span', null, 'Seven Towns Tamed')),
    div('end-title', 'Every Bounty Paid'),
    div('end-sub', `All ${NIGHTS} Outlaws run out of town.`),
    runSummary(),
    div(
      'end-btns',
      button('Keep Ridin’ (Endless)', 'primary big', () => {
        continueEndless(run);
        save();
        app.render();
      }),
      button('Main Menu', 'big ghost', () => {
        app.run = null;
        saveRun(null);
        app.render();
      }),
    ),
  );
  return el;
}

function recordEnd(won: boolean) {
  const run = app.run!;
  if (run.flags.recorded === (won ? 'win' : 'loss')) return;
  run.flags.recorded = won ? 'win' : 'loss';
  if (won) {
    profile.wins++;
    profile.stakeWins[run.shoeId] = Math.max(profile.stakeWins[run.shoeId] ?? 0, run.stake);
    for (const k of run.charms) profile.charmWins[k.id] = (profile.charmWins[k.id] ?? 0) + 1;
  }
  profile.bestHand = Math.max(profile.bestHand, run.stats.bestHand);
  profile.bestNight = Math.max(profile.bestNight, run.night);
  profile.handsPlayed += run.stats.handsPlayed;
  profile.blackjacks += run.stats.blackjacks;
  saveProfile();
  if (!won) saveRun(null);
  else save();
}

function runSummary(): HTMLElement {
  const run = app.run!;
  const s = run.stats;
  const rows: [string, string, string?][] = [
    ['Best hand', fmtNum(s.bestHand), s.bestHandType ? HAND_TYPE[s.bestHandType].name : undefined],
    ['Hands played', String(s.handsPlayed)],
    ['Hands won', String(s.handsWon)],
    ['Quackjacks', String(s.blackjacks)],
    ['Busts', String(s.busts)],
    ['Bucks earned', `$${s.moneyEarned}`],
    ['Tables won', String(s.tablesWon)],
    ['Deck', SHOE[run.shoeId]?.name ?? '', STAKES[run.stake - 1]?.name],
    ['Seed', run.seed],
  ];
  return div(
    'end-summary sheet',
    ...rows.map(([a, b, note]) => div(`es-row${b.length > 9 ? ' long' : ''}`, div('es-label', a), div('es-val', b), note ? div('es-note', note) : null)),
  );
}

export { NIGHTS };
