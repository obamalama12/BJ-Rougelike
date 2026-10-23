// Card-target picker for Fortunes and Masks used from the tray.

import type { Run } from '../core/types';
import { CONS, consText } from '../content/consumables';
import { button, modal, modalTitle, tip } from './app';
import { cardTooltip, playingCard } from './art';
import { div, fmt, h } from './dom';
import { rng } from '../game/engine';
import { sfx } from '../fx/audio';

/** Show a spread of 8 random deck cards; resolve with chosen ids or null. */
export function pickTargets(run: Run, consId: string, [min, max]: [number, number]): Promise<number[] | null> {
  return new Promise((resolve) => {
    const d = CONS[consId];
    const inPlay = new Set([...(run.table?.dealer ?? []), ...(run.table?.hands.flatMap((x) => x.cards) ?? [])]);
    const ids = rng(run).shuffle(run.deck.filter((c) => !inPlay.has(c.id)).map((c) => c.id)).slice(0, 8);
    const chosen: number[] = [];
    let done = false;
    const confirm = button('Use', 'primary', () => finish(chosen.slice()), { disabled: true });
    const counter = div('picker-count');
    const sync = () => {
      counter.textContent = `${chosen.length} / ${max} selected`;
      confirm.disabled = chosen.length < min || chosen.length > max;
    };
    const grid = div('picker-grid');
    for (const id of ids) {
      const card = run.deck.find((c) => c.id === id)!;
      const el = playingCard(card, run.shoeId);
      tip(el, () => cardTooltip(card));
      el.addEventListener('click', () => {
        const i = chosen.indexOf(id);
        if (i >= 0) chosen.splice(i, 1);
        else {
          if (chosen.length >= max) chosen.shift();
          chosen.push(id);
        }
        for (const c of grid.querySelectorAll<HTMLElement>('.card')) c.classList.toggle('picked', chosen.includes(Number(c.dataset.id)));
        sfx('select');
        sync();
      });
      grid.appendChild(el);
    }
    const close = modal(
      div(
        'picker',
        modalTitle('picker-title', d?.name ?? ''),
        h('div', { class: 'picker-text', html: fmt(consText(consId, run)) }),
        div('picker-sub', 'Choose from a spread drawn from your deck'),
        grid,
        div('picker-foot', counter, button('Cancel', 'ghost', () => finish(null)), confirm),
      ),
      { onClose: () => finish(null), cls: 'picker-modal' },
    );
    sync();
    function finish(v: number[] | null) {
      if (done) return;
      done = true;
      close();
      resolve(v);
    }
  });
}
