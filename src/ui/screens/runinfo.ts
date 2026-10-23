// Run Info: hand levels, the full deck, relics and tokens.

import type { Card, Run, Suit } from '../../core/types';
import { HAND_TYPES, handBase, SUITS, SUIT_INFO } from '../../core/cards';
import { VOUCHER } from '../../content/vouchers';
import { STAKES, SHOE } from '../../content/shoes';
import { app, button, modal, tip } from '../app';
import { cardTooltip, playingCard, voucherCard, voucherTooltip, tagToken, tagTooltip } from '../art';
import { div, fmt, h, clear, fmtNum } from '../dom';
import { sfx } from '../../fx/audio';

export function openRunInfo(start: 'hands' | 'deck' | 'relics' = 'hands') {
  const run = app.run as Run | null;
  if (!run) return;
  const box = div('runinfo');
  const body = div('ri-body');
  const tabs = div('tabs');
  const show = (tab: string) => {
    clear(body);
    for (const b of tabs.children) b.classList.toggle('on', (b as HTMLElement).dataset.tab === tab);
    if (tab === 'hands') body.appendChild(handsTab(run));
    else if (tab === 'deck') body.appendChild(deckTab(run));
    else body.appendChild(relicsTab(run));
  };
  for (const [id, label] of [['hands', 'Hand Types'], ['deck', 'Deck'], ['relics', 'Relics & Tokens']] as const) {
    const b = h('button', { class: 'tab', type: 'button', dataset: { tab: id } }, label);
    b.addEventListener('click', () => {
      sfx('click');
      show(id);
    });
    tabs.appendChild(b);
  }
  box.append(div('ri-head', div('ri-title', 'Run Info'), div('ri-meta', `${SHOE[run.shoeId]?.name} · ${STAKES[run.stake - 1]?.name} · Seed ${run.seed}`)), tabs, body);
  const close = modal(box, { cls: 'wide' });
  box.appendChild(div('ri-foot', button('Back', 'primary', () => close())));
  show(start);
}

function handsTab(run: Run): HTMLElement {
  const list = div('hand-list');
  for (const ht of HAND_TYPES) {
    const lv = run.handLevels[ht.id];
    const b = handBase(ht.id, lv);
    const row = div(
      `hand-row${lv > 1 ? ' leveled' : ''}`,
      div('hr-level', `Lv.${lv}`),
      div('hr-name', ht.name, div('hr-desc', ht.desc)),
      div('hr-calc', h('span', { class: 'hr-chips' }, fmtNum(b.chips)), h('span', { class: 'hr-x' }, '×'), h('span', { class: 'hr-mult' }, fmtNum(b.mult))),
      div('hr-plays', `#${run.handPlays[ht.id] ?? 0}`),
    );
    list.appendChild(row);
  }
  return list;
}

function deckTab(run: Run): HTMLElement {
  const wrap = div('deck-view');
  const inShoe = new Set(run.table?.shoe ?? []);
  const showShoe = !!run.table;
  const summary = div('deck-summary');
  const total = run.deck.length;
  const inked = run.deck.filter((c) => c.ink).length;
  const sealed = run.deck.filter((c) => c.seal).length;
  summary.innerHTML = `${total} cards · ${inked} inked · ${sealed} sealed${showShoe ? ` · <span class="t-hl">${inShoe.size}</span> left in the shoe (others dimmed)` : ''}`;
  wrap.appendChild(summary);
  const bySuit = (s: Suit | 'stone') => run.deck.filter((c) => (s === 'stone' ? c.ink === 'stone' : c.suit === s && c.ink !== 'stone')).sort((a, b) => b.rank - a.rank);
  for (const s of [...SUITS, 'stone'] as (Suit | 'stone')[]) {
    const cards = bySuit(s);
    if (!cards.length) continue;
    const row = div('deck-row');
    row.appendChild(div('deck-row-label', s === 'stone' ? 'Stone' : SUIT_INFO[s].plural, h('small', null, ` ${cards.length}`)));
    const strip = div('deck-strip');
    cards.forEach((c: Card) => {
      const el = playingCard(c, run.shoeId);
      el.classList.add('mini');
      if (showShoe && !inShoe.has(c.id)) el.classList.add('dim');
      tip(el, () => cardTooltip(c));
      strip.appendChild(el);
    });
    row.appendChild(strip);
    wrap.appendChild(row);
  }
  return wrap;
}

function relicsTab(run: Run): HTMLElement {
  const wrap = div('relic-view');
  wrap.appendChild(div('rv-label', 'Relics'));
  const vr = div('rv-row');
  if (!run.vouchers.length) vr.appendChild(div('rv-empty', 'No relics yet. Look for them in the shop.'));
  for (const v of run.vouchers) {
    const el = voucherCard(v);
    tip(el, () => voucherTooltip(v));
    vr.appendChild(el);
  }
  wrap.appendChild(vr);
  wrap.appendChild(div('rv-label', 'Tokens'));
  const tr = div('rv-row');
  if (!run.tags.length) tr.appendChild(div('rv-empty', 'No tokens held. Skip a table to earn one.'));
  for (const t of run.tags) {
    const el = tagToken(t.id);
    tip(el, () => tagTooltip(t.id));
    tr.appendChild(el);
  }
  wrap.appendChild(tr);
  return wrap;
}

export { VOUCHER, fmt };
