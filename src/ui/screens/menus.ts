// Title screen, new-run setup, and the end-of-run screens.

import type { Card, Rank, Suit } from '../../core/types';
import { SHOES, STAKES, SHOE } from '../../content/shoes';
import { HAND_TYPE } from '../../core/cards';
import { newRun, NIGHTS } from '../../game/engine';
import { continueEndless } from '../../game/shop';
import { randomSeedString } from '../../core/rng';
import { app, button, modal, save, tip } from '../app';
import { playingCard, cardBackHtml } from '../art';
import { div, fmt, fmtNum, h, clear } from '../dom';
import { hasSavedRun, loadRun, maxStake, profile, saveProfile, saveRun } from '../profile';
import { background } from '../../fx/background';
import { audio, sfx } from '../../fx/audio';
import { particles } from '../../fx/particles';
import { openOptions } from './options';
import { openCollection } from './collection';
import { iconSvg } from '../icons';

export function titleScreen(): HTMLElement {
  background.setPalette('menu', 1);
  audio.setMood('menu');
  const el = div('title-screen');
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
    div('logo-top', 'The Legend of'),
    div('logo-main', 'Buck Ducks'),
    div('logo-sub', 'a blackjack roguelike of the duck frontier'),
  );
  const menu = div('title-menu');
  if (hasSavedRun()) {
    menu.appendChild(
      button('Continue', 'primary big', () => {
        app.run = loadRun();
        app.render();
      }),
    );
  }
  menu.append(
    button('New Run', hasSavedRun() ? 'big' : 'primary big', () => openNewRun()),
    button('Collection', 'big ghost', () => openCollection()),
    button('Options', 'big ghost', () => openOptions()),
  );
  const stats = div(
    'title-stats',
    `Runs ${profile.runs} · Victories ${profile.wins} · Best hand ${fmtNum(profile.bestHand)} · Furthest town ${profile.bestNight}`,
  );
  el.append(fan, logo, menu, stats, div('title-hint', 'H / S / D / P / F to Hit, Stand, Double, Split, Fold · Space to deal'));
  return el;
}

export function openNewRun() {
  let shoeIdx = Math.max(0, SHOES.findIndex((s) => s.id === profile.lastShoe));
  let stake = profile.lastStake ?? 1;
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
    const shoeInfo = div('nr-shoe-info', div('nr-shoe-name', shoe.name), h('div', { class: 'nr-shoe-text', html: fmt(shoe.text) }), div('nr-shoe-idx', `${shoeIdx + 1} / ${SHOES.length}`));
    const stakes = div('nr-stakes');
    for (const s of STAKES) {
      const locked = s.id > maxStake(shoe.id);
      const chip = h('button', { class: `stake-chip${s.id === stake ? ' on' : ''}${locked ? ' locked' : ''}`, type: 'button', style: { '--c': s.color } as any });
      chip.innerHTML = `<span class="moon-phase p${s.id}" style="--c:${s.color}">${s.id}</span>`;
      chip.addEventListener('click', () => {
        if (locked) return;
        stake = s.id;
        sfx('select');
        render();
      });
      tip(chip, () => `<div class="tt-title">${s.name}</div><div class="tt-body">${fmt(s.text)}${s.id > 1 ? '<br><span class="t-dim">Includes all previous phases</span>' : ''}</div>${locked ? '<div class="tt-sub bad">Win with this shoe on the previous phase to unlock</div>' : ''}`);
      stakes.appendChild(chip);
    }
    const st = STAKES[stake - 1];
    const seedIn = h('input', { class: 'seed-input', placeholder: 'Random seed', maxlength: 12, value: seed }) as HTMLInputElement;
    seedIn.addEventListener('input', () => (seed = seedIn.value.toUpperCase().replace(/[^A-Z0-9]/g, '')));
    box.append(
      div('nr-title', 'Pick Your Deck, Partner'),
      div('nr-carousel', prev, back, shoeInfo, next),
      div('nr-sub', 'Wanted Level'),
      stakes,
      h('div', { class: 'nr-stake-text', html: `<b style="color:${st.color}">${st.name}</b> · ${fmt(st.text)}` }),
      div('nr-foot', seedIn, button('Begin', 'primary big', () => start())),
    );
  };
  const start = () => {
    const shoe = SHOES[shoeIdx];
    profile.lastShoe = shoe.id;
    profile.lastStake = stake;
    profile.runs++;
    saveProfile();
    app.run = newRun(seed || randomSeedString(), shoe.id, stake);
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
    div('end-title', 'You Bit the Dust'),
    div('end-sub', `Run out of Town ${run.night} at ${['the Saloon table', 'the High Roller table', 'the Outlaw’s table'][run.tableIdx] ?? ''}`),
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
  particles.petals(120);
  recordEnd(true);
  const el = div('end-screen victory');
  el.append(
    div('end-lanterns', ...Array.from({ length: 21 }, (_, i) => {
      const l = div('mini-lantern');
      l.style.setProperty('--i', String(i));
      l.innerHTML = iconSvg('badge');
      return l;
    })),
    div('end-title', 'Fastest Bill in the West'),
    div('end-sub', 'Twenty-one bounties collected. The whole frontier tips its hat to you.'),
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
  const rows: [string, string][] = [
    ['Best hand', `${fmtNum(s.bestHand)}${s.bestHandType ? ` (${HAND_TYPE[s.bestHandType].name})` : ''}`],
    ['Hands played', String(s.handsPlayed)],
    ['Hands won', String(s.handsWon)],
    ['Quackjacks', String(s.blackjacks)],
    ['Busts', String(s.busts)],
    ['Bucks earned', `$${s.moneyEarned}`],
    ['Tables lit', String(s.tablesWon)],
    ['Shoe', `${SHOE[run.shoeId]?.name} · ${STAKES[run.stake - 1]?.name}`],
    ['Seed', run.seed],
  ];
  return div('end-summary', ...rows.map(([a, b]) => div('es-row', div('es-label', a), div('es-val', b))));
}

export { NIGHTS };
