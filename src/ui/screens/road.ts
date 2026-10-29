// The fork in the road: three unmarked signposts after you beat a gang member, the reveal of what
// waited down the one you took, and (with a full belt) choosing which ability to leave behind.

import type { Run } from '../../core/types';
import { ABILITY, INSTANT, PATHS, isGood } from '../../content/paths';
import { canRefuseNew, dropAbility, leaveRoad, takeRoad } from '../../game/roads';
import { charmSlots } from '../../game/engine';
import { app, burstAt, button, save, screenShake, tip } from '../app';
import { div, fmt, h, clear } from '../dom';
import type { Hud } from '../hud';
import { background } from '../../fx/background';
import { audio, sfx } from '../../fx/audio';
import { iconSvg } from '../icons';
import { charmCard, charmTooltip } from '../art';
import { coach } from '../coach';
import { playPathScene } from '../cutscene';

// One keyboard listener for good, pointed at whichever road screen is current. A listener per
// screen stayed attached after the screen was replaced (phones never press a key to trip the
// clean-up), keeping every old screen and its HUD alive.
let roadKeys: ((e: KeyboardEvent) => void) | null = null;
let keysHooked = false;

export function roadScreen(hud: Hud): HTMLElement {
  const run = app.run as Run;
  background.setPalette('select', 0.5);
  audio.setMood('shop');
  hud.update();
  hud.renderTrays();
  const el = div('stop-screen road-screen');
  if (!keysHooked) {
    keysHooked = true;
    window.addEventListener('keydown', (e) => roadKeys?.(e));
  }
  let onKey: ((e: KeyboardEvent) => void) | null = null;
  const unbind = () => {
    if (roadKeys === onKey) roadKeys = null;
    onKey = null;
  };

  const render = () => {
    unbind();
    clear(el);
    const road = run.road;
    if (!road) return;
    const card = div('stop-card sheet bill-road', div('divider bill-kicker', road.taken ? PATHS[road.taken.path].name : 'The Trail Forks'));
    if (!road.taken) {
      const more = road.picksLeft > 1 ? ` You've earned ${road.picksLeft} picks.` : '';
      card.append(
        div('stop-title', 'Which way, partner?'),
        div('stop-text', `None of these roads are marked. You won't know what's down one until you've taken it.${more}`),
        div('divider bill-rule', h('span', { class: 'bill-diamond' })),
      );
      const row = div('road-row');
      road.options.forEach((p, i) => {
        const def = PATHS[p];
        const b = h('button', { class: `road-sign tone-${def.tone}`, type: 'button' });
        b.style.setProperty('--i', String(i));
        b.innerHTML = `<span class="rs-key">${i + 1}</span><span class="rs-post"></span><span class="rs-board"><span class="rs-icon">${iconSvg(def.icon)}</span><span class="rs-name">${def.name}</span><span class="rs-scene">${def.scene}</span></span>`;
        b.addEventListener('click', () => choose(p, b));
        b.addEventListener('pointerenter', () => sfx('hover'));
        row.appendChild(b);
      });
      card.appendChild(row);
      onKey = (e) => {
        if (!el.isConnected) return unbind();
        if (app.modalLayer.childElementCount || app.busy) return;
        const n = Number(e.key);
        if (n >= 1 && n <= road.options.length) {
          e.preventDefault();
          choose(road.options[n - 1], row.children[n - 1] as HTMLElement);
        }
      };
      roadKeys = onKey;
      void coach('road', { x: 800, y: 300, point: 'down' });
    } else {
      const o = road.taken.outcome;
      const good = isGood(o);
      const reveal = div(`road-reveal ${good ? 'good' : 'bad'}`);
      if (o.kind === 'ability') {
        const d = ABILITY[o.id];
        const k = run.charms.find((x) => x.uid === road.mustDrop) ?? run.charms.find((x) => x.id === o.id);
        const art = charmCard(o.id);
        art.classList.add('road-art');
        if (k) tip(art, () => charmTooltip(run, o.id, k));
        reveal.append(
          div('rr-banner', good ? 'A Boon' : 'A Bane'),
          art,
          div('rr-name', d?.name ?? ''),
          h('div', { class: 'rr-text', html: fmt(k ? textOf(d, k, run) : typeof d?.text === 'string' ? d.text : '') }),
        );
      } else {
        const d = INSTANT[o.id];
        reveal.append(
          div('rr-banner', good ? 'Good Fortune' : 'Bad Luck'),
          h('div', { class: 'rr-icon', html: iconSvg(d.icon) }),
          div('rr-name', d.name),
          h('div', { class: 'rr-text', html: fmt(d.text) }),
        );
      }
      card.appendChild(reveal);
      if (road.mustDrop) {
        // Belt's full. A new Boon can be passed up; a new Bane stays and one of the others goes.
        const keep = road.mustDrop;
        const refusable = canRefuseNew(run);
        card.appendChild(
          div('road-drop-title', refusable ? `Your belt holds ${charmSlots(run)}. Pass on the new one, or leave one behind:` : `A Bane can’t be refused. Your belt holds ${charmSlots(run)}: leave one behind:`),
        );
        const belt = div('road-drop');
        // The new one comes first, under its own label, when you're allowed to turn it down.
        const order = refusable ? [...run.charms.filter((k) => k.uid === keep), ...run.charms.filter((k) => k.uid !== keep)] : run.charms.filter((k) => k.uid !== keep);
        for (const k of order) {
          const c = charmCard(k.id);
          c.classList.add('road-drop-card');
          tip(c, () => charmTooltip(run, k.id, k));
          const isNew = k.uid === keep;
          const slot = h('button', { class: `road-drop-slot${isNew ? ' is-new' : ''}`, type: 'button' }, c, h('span', { class: 'rd-label' }, isNew ? 'Pass on it' : 'Leave it'));
          slot.addEventListener('click', () => {
            if (!dropAbility(run, k.uid)) return;
            sfx('sell');
            save();
            hud.renderTrays();
            render();
          });
          belt.appendChild(slot);
        }
        card.appendChild(belt);
      } else {
        const label = road.picksLeft > 0 ? `Next fork (${road.picksLeft} to go)` : 'Ride on';
        card.appendChild(
          button(label, 'primary big', () => {
            if (!leaveRoad(run)) return;
            save();
            if (run.phase === 'road') render();
            else app.render();
          }),
        );
      }
    }
    el.appendChild(card);
  };

  const choose = async (path: number, from: HTMLElement) => {
    if (app.busy) return;
    const o = takeRoad(run, path);
    if (!o) return;
    save();
    unbind();
    // Show what happened down the road before revealing what it left you with.
    await playPathScene(run, path, o);
    if (!el.isConnected) return;
    const good = isGood(o);
    sfx('flip');
    if (good) {
      sfx('levelup');
      burstAt(from, { n: 30, color: ['#7fe07a', '#ffd23f', '#fff6e0'] });
    } else {
      sfx('honk');
      screenShake(2);
    }
    hud.update();
    hud.renderTrays();
    render();
  };

  render();
  return el;
}

function textOf(d: (typeof ABILITY)[string] | undefined, k: { uid: number; id: string; state: Record<string, any> }, run: Run): string {
  if (!d) return '';
  return typeof d.text === 'function' ? d.text(k, run) : d.text;
}
