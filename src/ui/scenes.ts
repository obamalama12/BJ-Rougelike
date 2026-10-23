// Set-piece scenes: the Outlaw showdown intro and the town celebration.

import type { Run } from '../core/types';
import { HOST } from '../content/hosts';
import { NIGHTS } from '../game/engine';
import { app, button } from './app';
import { div, fmt, fmtNum, h } from './dom';
import { nameOf, outlawIntro, portraitOf, townName } from './characters';
import { iconSvg } from './icons';
import { particles } from '../fx/particles';
import { audio, sfx } from '../fx/audio';

/** Full-screen overlay that closes on click, Space, Enter or Escape, or after `auto` ms. */
function overlay(cls: string, auto: number | null, onClose: () => void) {
  const el = div(`scene ${cls}`);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    window.removeEventListener('keydown', onKey, true);
    el.classList.add('out');
    setTimeout(() => el.remove(), 380);
    onClose();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      close();
    }
  };
  window.addEventListener('keydown', onKey, true);
  if (auto) setTimeout(close, auto);
  app.screen.appendChild(el);
  return { el, close };
}

// ---------------------------------------------------------------------------
// Showdown intro
// ---------------------------------------------------------------------------

/** The Outlaw steps into the street. Resolves when the scene closes. */
export function showdownIntro(run: Run, hostId: string, target: number): Promise<void> {
  return new Promise((resolve) => {
    const host = HOST[hostId];
    const { el, close } = overlay('showdown', 6500, () => resolve());
    el.addEventListener('pointerdown', () => close());
    sfx('honk');
    audio.setMood('host');
    el.append(
      div('sc-rays'),
      div('sc-street'),
      h('div', { class: 'sc-bird left', html: portraitOf('player', 'smug') }),
      h('div', { class: 'sc-bird right', html: portraitOf(hostId, 'smug') }),
      div(
        'sc-top',
        div('sc-kicker', `Town ${run.night} of ${NIGHTS} · ${townName(run.night)}`),
        div('sc-title', 'Showdown'),
      ),
      div(
        'sc-poster',
        div('scp-head', 'Wanted'),
        div('scp-name', host?.name ?? nameOf(hostId)),
        div('scp-sub', host?.title ?? ''),
        div('scp-rule'),
        h('div', { class: 'scp-curse', html: fmt(host?.text ?? '') }),
        div('scp-target', h('span', null, 'Score at least'), h('b', null, fmtNum(target))),
      ),
      div('sc-quote', `“${outlawIntro(hostId)}”`),
      div('sc-hint', 'Click to draw'),
    );
  });
}

// ---------------------------------------------------------------------------
// Town celebration
// ---------------------------------------------------------------------------

export interface Celebration {
  town: number;
  hostId: string;
  tables: number;
  gang: number;
  tries: number;
}

/** The town is cleaned up: badge, ledger, fireworks, and a look at who's next. */
export function townCelebration(run: Run, c: Celebration, heal: number): Promise<void> {
  return new Promise((resolve) => {
    const { el, close } = overlay('cleanup', null, () => resolve());
    sfx('blackjack');
    audio.setMood('shop');
    const badges = div('cl-badges');
    for (let i = 1; i <= NIGHTS; i++) {
      const b = h('div', { class: `cl-badge${i < c.town ? ' won' : i === c.town ? ' new' : ''}`, html: iconSvg('badge') });
      b.style.setProperty('--i', String(i));
      badges.appendChild(b);
    }
    const rows: [string, string][] = [
      ['Tables played', String(c.tables)],
      ['Gang members brought in', String(c.gang)],
      ['Showdown', c.tries > 0 ? `won on try ${c.tries + 1}` : 'won first try'],
    ];
    if (heal > 0) rows.push(['Fresh horses', `+${heal} Grit`]);
    const next = HOST[run.nightHost];
    const ride = button(`Ride to ${townName(run.night)}`, 'primary big', () => close());
    el.append(
      div('sc-rays gold'),
      div(
        'cl-card',
        div('cl-kicker', `${townName(c.town)} · Town ${c.town} of ${NIGHTS}`),
        div('cl-title', 'Town Cleaned Up'),
        div(
          'cl-mid',
          div('cl-jail', h('div', { class: 'cl-face', html: portraitOf(c.hostId, 'sad') }), div('cl-bars'), div('cl-stamp', 'Jailed')),
          div('cl-ledger', ...rows.map(([a, b]) => div('cl-row', h('span', null, a), h('b', null, b)))),
        ),
        badges,
        next
          ? div(
              'cl-next',
              h('div', { class: 'cl-next-face', html: portraitOf(run.nightHost, 'smug') }),
              div('cl-next-text', h('small', null, `Wanted in ${townName(run.night)}`), h('b', null, next.name), h('span', { html: fmt(next.text) })),
            )
          : '',
        div('cl-foot', ride),
      ),
    );
    // Fireworks over the card for a few seconds.
    let n = 0;
    const colors = [['#f2c14e', '#fff3c0'], ['#c8402a', '#f6ead0'], ['#2f5d8a', '#bcd8f2'], ['#557a46', '#dcebc8']];
    const fire = () => {
      if (!el.isConnected || n++ > 9) return;
      // Burst around the edges of the card, not over its text.
      const side = n % 2 ? 1 : -1;
      const x = window.innerWidth * (0.5 + side * (0.36 + Math.random() * 0.1));
      const y = window.innerHeight * (0.12 + Math.random() * 0.6);
      const col = colors[n % colors.length];
      particles.burst(x, y, { n: 38, color: col, speed: 360, up: 0, spread: 1 });
      particles.ring(x, y, col[0], 70);
      sfx(n % 2 ? 'chips' : 'money');
      setTimeout(fire, 380 + Math.random() * 320);
    };
    setTimeout(fire, 500);
  });
}
