// Non-table stops on the trail: strange happenings, the Doc, and the campfire.

import type { Run, HandTypeId } from '../../core/types';
import { HAND_TYPES, handBase } from '../../core/cards';
import { EVENT } from '../../content/events';
import { chooseEvent, resolveDuel, finishNode, docPatch, docFull, docRemove, DOC_PRICES, campRest, campYarn, campWhittle, gritCap } from '../../game/trail';
import { drainFx, rng } from '../../game/engine';
import { app, button, save, tip, toast, wait, burstAt, screenShake } from '../app';
import { div, fmt, h, clear, fmtNum } from '../dom';
import type { Hud } from '../hud';
import { background } from '../../fx/background';
import { audio, sfx } from '../../fx/audio';
import { iconSvg } from '../icons';
import { portraitOf } from '../characters';
import { CHARACTERS } from '../portraits';
import { cardTooltip, playingCard } from '../art';

function frame(hud: Hud, cls: string) {
  hud.update();
  hud.renderTrays();
  hud.canUse = true;
  return div(`stop-screen ${cls}`);
}

function art(character: string | undefined, icon: string) {
  if (character && CHARACTERS[character]) return h('div', { class: 'stop-art portrait-art', html: portraitOf(character, 'neutral') });
  return h('div', { class: 'stop-art icon-art', html: iconSvg(icon) });
}

// ---------------------------------------------------------------------------
// Strange happenings
// ---------------------------------------------------------------------------

export function eventScreen(hud: Hud): HTMLElement {
  const run = app.run as Run;
  background.setPalette('pack', 0.4);
  audio.setMood('shop');
  const el = frame(hud, 'event-screen');
  const render = () => {
    clear(el);
    const ev = run.event!;
    const def = EVENT[ev.id];
    const card = div('stop-card');
    card.append(art(def.character, def.icon), div('stop-title', def.title), div('stop-text', def.text));
    if (ev.duel) {
      card.appendChild(div('stop-result', ev.result ?? ''));
      card.appendChild(button('Step into the street', 'primary big', () => void runDuel(run, hud, render)));
    } else if (ev.result) {
      card.appendChild(div('stop-result', ev.result));
      card.appendChild(
        button('Ride on', 'primary big', () => {
          sfx('quack');
          finishNode(run);
          save();
          app.render();
        }),
      );
    } else {
      const list = div('stop-choices');
      def.choices.forEach((ch, i) => {
        const ok = (!ch.cost || run.money >= ch.cost) && (!ch.can || ch.can(run));
        const b = h('button', { class: 'choice', type: 'button', disabled: !ok });
        b.innerHTML = `<span class="choice-label">${ch.label}${ch.cost ? ` <span class="t-money">$${ch.cost}</span>` : ''}</span><span class="choice-detail">${fmt(ch.detail)}</span>`;
        b.addEventListener('click', () => {
          if (!chooseEvent(run, i)) return toast('You can’t do that right now', 'bad');
          sfx('select');
          drainFx();
          save();
          hud.update();
          hud.renderTrays();
          if (run.phase === 'gameover') return app.render();
          render();
        });
        list.appendChild(b);
      });
      card.appendChild(list);
    }
    el.appendChild(card);
  };
  render();
  hud.onChange = render;
  return el;
}

/** High noon: wait for the bell, then click as fast as you can. */
async function runDuel(run: Run, hud: Hud, rerender: () => void) {
  if (app.busy) return;
  app.busy = true;
  const overlay = div('duel');
  const sign = div('duel-sign', 'Steady');
  const left = h('div', { class: 'duel-bird left', html: portraitOf('player', 'neutral') });
  const right = h('div', { class: 'duel-bird right', html: portraitOf('jorogumo', 'smug') });
  overlay.append(div('duel-sun'), left, right, sign, div('duel-hint', 'When the sign says DRAW, click or press Space. Shoot early and you lose.'));
  app.screen.appendChild(overlay);
  audio.setMood('host');
  let state: 'wait' | 'draw' | 'done' = 'wait';
  let drawAt = 0;
  // The stranger's reaction time gets a bit faster deeper into the run.
  const theirs = Math.max(260, 470 - run.night * 22) + rng(run).next() * 120;
  const finish = async (won: boolean, msg: string) => {
    if (state === 'done') return;
    state = 'done';
    window.removeEventListener('keydown', onKey);
    overlay.removeEventListener('pointerdown', onClick);
    sign.textContent = msg;
    sign.className = `duel-sign ${won ? 'won' : 'lost'}`;
    if (won) {
      right.innerHTML = portraitOf('jorogumo', 'shocked');
      left.innerHTML = portraitOf('player', 'laughing');
      sfx('blackjack');
      burstAt(right, { n: 40, kind: 'feather' as any, color: ['#fff6e0', '#c9a37a'] });
    } else {
      left.innerHTML = portraitOf('player', 'shocked');
      right.innerHTML = portraitOf('jorogumo', 'laughing');
      sfx('honk');
      screenShake(2);
    }
    resolveDuel(run, won);
    save();
    await wait(1600);
    overlay.classList.add('out');
    await wait(300);
    overlay.remove();
    app.busy = false;
    hud.update();
    if (run.phase === 'gameover') return app.render();
    rerender();
  };
  const shoot = () => {
    if (state === 'wait') {
      void finish(false, 'Too early. You shot a hole in your own hat.');
    } else if (state === 'draw') {
      const rt = performance.now() - drawAt;
      sfx('bust');
      if (rt < theirs) void finish(true, `You win. ${Math.round(rt)} ms against ${Math.round(theirs)} ms.`);
      else void finish(false, `Too slow. ${Math.round(rt)} ms against ${Math.round(theirs)} ms.`);
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      shoot();
    }
  };
  const onClick = () => shoot();
  window.addEventListener('keydown', onKey);
  overlay.addEventListener('pointerdown', onClick);
  await wait(400);
  const delay = 1200 + Math.random() * 2600;
  setTimeout(() => {
    if (state !== 'wait') return;
    state = 'draw';
    drawAt = performance.now();
    sign.textContent = 'DRAW!';
    sign.className = 'duel-sign draw';
    sfx('gong');
    // The stranger fires on their own if you freeze.
    setTimeout(() => {
      if (state === 'draw') void finish(false, `The roadrunner fired first, at ${Math.round(theirs)} ms.`);
    }, theirs + 30);
  }, delay / Math.max(1, 1));
}

// ---------------------------------------------------------------------------
// Doc's office
// ---------------------------------------------------------------------------

export function docScreen(hud: Hud): HTMLElement {
  const run = app.run as Run;
  background.setPalette('shop', 0.3);
  audio.setMood('shop');
  const el = frame(hud, 'doc-screen');
  const render = () => {
    clear(el);
    const used = run.flags.docUsed ?? {};
    const card = div('stop-card');
    card.append(
      art('doc', 'tonic'),
      div('stop-title', 'Doc Hoot’s Office'),
      div('stop-text', `"Sit. Don’t touch the leeches." Your Grit: ${run.grit}/${gritCap(run)}`),
    );
    const list = div('stop-choices');
    const choice = (label: string, detail: string, ok: boolean, fn: () => void) => {
      const b = h('button', { class: 'choice', type: 'button', disabled: !ok });
      b.innerHTML = `<span class="choice-label">${label}</span><span class="choice-detail">${fmt(detail)}</span>`;
      b.addEventListener('click', fn);
      list.appendChild(b);
    };
    choice('Patch me up', 'Heal {g:3} Grit. Free, once', !used.patch && run.grit < gritCap(run), () => {
      docPatch(run);
      sfx('levelup');
      save();
      hud.update();
      render();
    });
    choice(`The full treatment <span class="t-money">$${DOC_PRICES.full}</span>`, 'Heal all your Grit', !used.full && run.money >= DOC_PRICES.full && run.grit < gritCap(run), () => {
      docFull(run);
      sfx('levelup');
      save();
      hud.update();
      render();
    });
    choice(`Remove a card <span class="t-money">$${DOC_PRICES.remove}</span>`, 'Pick a card from a spread of your deck to remove for good', !used.remove && run.money >= DOC_PRICES.remove && run.deck.length > 10, () => {
      pickRemoval(run, el, hud, render);
    });
    card.appendChild(list);
    card.appendChild(button('Leave', 'primary big', () => {
      finishNode(run);
      save();
      app.render();
    }));
    el.appendChild(card);
  };
  render();
  hud.onChange = render;
  return el;
}

function pickRemoval(run: Run, el: HTMLElement, hud: Hud, rerender: () => void) {
  const ids = rng(run).shuffle(run.deck.map((c) => c.id)).slice(0, 8);
  const panel = div('stop-spread');
  panel.appendChild(div('spread-label', 'Pick a card to remove'));
  const row = div('spread-row');
  for (const id of ids) {
    const c = run.deck.find((k) => k.id === id)!;
    const ce = playingCard(c, run.shoeId);
    tip(ce, () => cardTooltip(c));
    ce.addEventListener('click', () => {
      if (!docRemove(run, id)) return toast('Not enough Bucks', 'bad');
      sfx('shatter');
      burstAt(ce, { n: 20, color: ['#fff6e0', '#c9a37a'] });
      save();
      hud.update();
      setTimeout(rerender, 300);
    });
    row.appendChild(ce);
  }
  panel.appendChild(row);
  panel.appendChild(button('Never mind', 'ghost', rerender));
  clear(el);
  el.appendChild(panel);
}

// ---------------------------------------------------------------------------
// Campfire
// ---------------------------------------------------------------------------

export function campScreen(hud: Hud): HTMLElement {
  const run = app.run as Run;
  background.setPalette('victory', 0.6);
  audio.setMood('menu');
  const el = frame(hud, 'camp-screen');
  const render = (yarn = false) => {
    clear(el);
    const card = div(`stop-card${yarn ? ' yarning' : ''}`);
    card.append(h('div', { class: 'stop-art icon-art campfire', html: iconSvg('campfire') }), div('stop-title', 'Campfire'), div('stop-text', 'A can of beans on the coals. There’s time for one thing before you fall asleep.'));
    const done = () => {
      save();
      finishNode(run);
      app.render();
    };
    if (yarn) {
      const grid = div('yarn-grid');
      for (const ht of HAND_TYPES) {
        const lv = run.handLevels[ht.id];
        const b = handBase(ht.id, lv);
        const btn = h('button', { class: 'yarn', type: 'button' });
        btn.innerHTML = `<span class="yarn-name">${ht.name}</span><span class="yarn-lv">Lv.${lv} → ${lv + 1}</span><span class="yarn-calc">${fmtNum(b.chips)} × ${fmtNum(b.mult)}</span>`;
        btn.addEventListener('click', () => {
          campYarn(run, ht.id as HandTypeId);
          sfx('levelup');
          done();
        });
        grid.appendChild(btn);
      }
      card.append(div('stop-sub', 'Which tale will you tell?'), grid, button('Back', 'ghost', () => render(false)));
    } else {
      const list = div('stop-choices');
      const choice = (label: string, detail: string, ok: boolean, fn: () => void) => {
        const b = h('button', { class: 'choice', type: 'button', disabled: !ok });
        b.innerHTML = `<span class="choice-label">${label}</span><span class="choice-detail">${fmt(detail)}</span>`;
        b.addEventListener('click', fn);
        list.appendChild(b);
      };
      choice('Rest', `Heal {g:4} Grit (${run.grit}/${gritCap(run)})`, run.grit < gritCap(run), () => {
        campRest(run);
        sfx('levelup');
        done();
      });
      choice('Spin a yarn', 'Level up a hand type of your choice', true, () => render(true));
      choice('Whittle', 'A random Doodad without a finish becomes {g:Shiny} ({c:+50} Pot)', run.charms.some((k) => !k.finish), () => {
        campWhittle(run);
        sfx('buy');
        done();
      });
      card.appendChild(list);
    }
    el.appendChild(card);
  };
  render();
  hud.onChange = () => render();
  return el;
}
