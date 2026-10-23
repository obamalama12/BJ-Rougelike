// Opening a Bundle: choose from its contents.

import type { Run } from '../../core/types';
import { CONS } from '../../content/consumables';
import { PACK } from '../../content/shoes';
import { pickFromPack, skipPack } from '../../game/shop';
import { drainFx } from '../../game/engine';
import { app, burstAt, button, save, tip, toast, hideTip, wait } from '../app';
import { cardTooltip, charmCard, charmTooltip, consCard, consTooltip, playingCard } from '../art';
import { div, clear, fmt, h } from '../dom';
import type { Hud } from '../hud';
import { background } from '../../fx/background';
import { sfx } from '../../fx/audio';

export function packScreen(hud: Hud): HTMLElement {
  const run = app.run as Run;
  background.setPalette('pack', 0.2);
  const el = div('pack-screen');
  const chosen: number[] = [];
  const render = () => {
    clear(el);
    const p = run.pack;
    if (!p) return;
    const def = PACK[p.packId];
    el.appendChild(div('pack-title', def.name, h('span', { class: 'pack-picks' }, ` · choose ${p.picksLeft}`)));
    const opts = div(`pack-options n${p.options.length}`);
    p.options.forEach((o, i) => {
      let card: HTMLElement;
      if (o.kind === 'charm') {
        card = charmCard(o.id, o.finish);
        tip(card, () => charmTooltip(run, o.id, { uid: 0, id: o.id, finish: o.finish, state: {} }));
      } else if (o.kind === 'cons') {
        card = consCard(o.cons, o.id, o.finish);
        tip(card, () => consTooltip(run, o.cons, o.id));
      } else {
        card = playingCard({ ...o.card, id: -1 - i }, run.shoeId);
        tip(card, () => cardTooltip(o.card));
      }
      card.classList.add('pack-card');
      card.style.setProperty('--d', `${i * 0.08}s`);
      const slot = div(`pack-slot${o.taken ? ' taken' : ''}`, card);
      if (!o.taken) {
        const needs = o.kind === 'cons' ? CONS[o.id]?.targets : null;
        slot.appendChild(
          button(o.kind === 'card' ? 'Add' : o.kind === 'charm' ? 'Take' : needs ? `Use (${needs[0] === needs[1] ? needs[0] : `${needs[0]}-${needs[1]}`})` : 'Use', 'buy tiny', async () => {
            const r = pickFromPack(run, i, chosen.slice());
            if (!r.ok) return toast(r.reason, 'bad');
            sfx(o.kind === 'cons' && o.cons === 'star' ? 'levelup' : 'buy');
            burstAt(card, { n: 26, color: ['#c9b8ff', '#ffd23f', '#fff6e0'] });
            chosen.length = 0;
            drainFx();
            hideTip();
            save();
            hud.update();
            hud.renderTrays();
            await wait(250);
            if (!run.pack) app.render();
            else render();
          }),
        );
      }
      opts.appendChild(slot);
    });
    el.appendChild(opts);
    if (p.spread.length) {
      const spread = div('pack-spread');
      spread.appendChild(div('spread-label', 'Your spread: select targets, then use a card above'));
      const row = div('spread-row');
      for (const id of p.spread) {
        const c = run.deck.find((k) => k.id === id);
        if (!c) continue;
        const ce = playingCard(c, run.shoeId);
        if (chosen.includes(id)) ce.classList.add('picked');
        tip(ce, () => cardTooltip(c));
        ce.addEventListener('click', () => {
          const j = chosen.indexOf(id);
          if (j >= 0) chosen.splice(j, 1);
          else {
            if (chosen.length >= 5) chosen.shift();
            chosen.push(id);
          }
          sfx('select');
          for (const x of row.querySelectorAll<HTMLElement>('.card')) x.classList.toggle('picked', chosen.includes(Number(x.dataset.id)));
        });
        row.appendChild(ce);
      }
      spread.appendChild(row);
      el.appendChild(spread);
    }
    el.appendChild(
      div(
        'pack-foot',
        button('Skip', 'ghost', () => {
          skipPack(run);
          drainFx();
          sfx('click');
          save();
          app.render();
        }),
      ),
    );
  };
  render();
  hud.update();
  hud.renderTrays();
  hud.onChange = () => render();
  return el;
}

export { fmt };
