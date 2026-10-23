// The Collection: every Charm, consumable, relic, token, host and shoe.

import { CHARMS } from '../../content/charms';
import { FORTUNES, MASKS, STARS } from '../../content/consumables';
import { VOUCHERS } from '../../content/vouchers';
import { TAGS } from '../../content/tags';
import { HOSTS } from '../../content/hosts';
import { SHOES } from '../../content/shoes';
import { INK_INFO, FINISH_INFO, SEAL_INFO } from '../../core/cards';
import type { Card, InkId, SealId, FinishId } from '../../core/types';
import { button, modal, tip } from '../app';
import {
  charmCard, charmTooltip, consCard, consTooltip, voucherCard, voucherTooltip, tagToken, tagTooltip,
  hostMedallion, hostTooltip, playingCard, cardBackHtml, cardTooltip,
} from '../art';
import { div, fmt, h, clear } from '../dom';
import { isSeen } from '../profile';
import { sfx } from '../../fx/audio';

type Tab = 'charms' | 'fortunes' | 'stars' | 'masks' | 'relics' | 'tokens' | 'hosts' | 'shoes' | 'cards';

export function openCollection() {
  const box = div('collection');
  const body = div('col-body');
  const tabs = div('tabs');
  let page = 0;
  let current: Tab = 'charms';
  const counts: Record<Tab, [number, number]> = {
    charms: [CHARMS.filter((c) => isSeen('charm', c.id)).length, CHARMS.length],
    fortunes: [FORTUNES.filter((c) => isSeen('cons', c.id)).length, FORTUNES.length],
    stars: [STARS.filter((c) => isSeen('cons', c.id)).length, STARS.length],
    masks: [MASKS.filter((c) => isSeen('cons', c.id)).length, MASKS.length],
    relics: [VOUCHERS.filter((c) => isSeen('voucher', c.id)).length, VOUCHERS.length],
    tokens: [TAGS.filter((c) => isSeen('tag', c.id)).length, TAGS.length],
    hosts: [HOSTS.filter((c) => isSeen('host', c.id)).length, HOSTS.length],
    shoes: [SHOES.length, SHOES.length],
    cards: [8 + 4 + 4, 8 + 4 + 4],
  };
  const show = (tab: Tab, p = 0) => {
    current = tab;
    page = p;
    clear(body);
    for (const b of tabs.children) b.classList.toggle('on', (b as HTMLElement).dataset.tab === tab);
    const grid = div(`col-grid col-${tab}`);
    const per = tab === 'charms' ? 30 : 40;
    const pageOf = <T,>(arr: T[]) => arr.slice(page * per, page * per + per);
    const seenCls = (seen: boolean, el: HTMLElement) => {
      if (!seen) el.classList.add('unseen');
      return el;
    };
    if (tab === 'charms') {
      for (const c of pageOf(CHARMS)) {
        const el = seenCls(isSeen('charm', c.id), charmCard(c.id));
        tip(el, () => charmTooltip(null, c.id, undefined, isSeen('charm', c.id) ? '' : '<span class="tag-sub">Undiscovered</span>'));
        grid.appendChild(el);
      }
    } else if (tab === 'fortunes' || tab === 'stars' || tab === 'masks') {
      const list = tab === 'fortunes' ? FORTUNES : tab === 'stars' ? STARS : MASKS;
      for (const c of list) {
        const el = seenCls(isSeen('cons', c.id), consCard(c.kind, c.id));
        tip(el, () => consTooltip(null, c.kind, c.id));
        grid.appendChild(el);
      }
    } else if (tab === 'relics') {
      for (const v of VOUCHERS) {
        const el = seenCls(isSeen('voucher', v.id), voucherCard(v.id));
        tip(el, () => voucherTooltip(v.id));
        grid.appendChild(el);
      }
    } else if (tab === 'tokens') {
      for (const t of TAGS) {
        const el = seenCls(isSeen('tag', t.id), tagToken(t.id));
        tip(el, () => tagTooltip(t.id));
        grid.appendChild(div('token-cell', el, div('token-name', t.name)));
      }
    } else if (tab === 'hosts') {
      for (const ho of HOSTS) {
        const el = seenCls(isSeen('host', ho.id), hostMedallion(ho.id, 'md'));
        tip(el, () => hostTooltip(ho.id));
        grid.appendChild(div('host-cell', el, div('host-name', ho.name), h('div', { class: 'host-text', html: fmt(ho.text) })));
      }
    } else if (tab === 'shoes') {
      for (const s of SHOES) {
        const el = div('shoe-cell');
        const back = div('card pcard down mini-back');
        back.innerHTML = `<div class="card-inner"><div class="face back">${cardBackHtml(s.id)}</div></div>`;
        el.append(back, div('shoe-name', s.name), h('div', { class: 'shoe-text', html: fmt(s.text) }));
        grid.appendChild(el);
      }
    } else if (tab === 'cards') {
      const mk = (c: Partial<Card>, tipHtml: string, label: string) => {
        const card = playingCard({ id: -1, rank: 14, suit: 'flame', ...c } as Card, 'paper');
        tip(card, () => tipHtml);
        grid.appendChild(div('mod-cell', card, div('mod-name', label)));
      };
      for (const ink of Object.keys(INK_INFO) as InkId[]) mk({ ink, rank: 9, suit: 'moon' }, `<div class="tt-title">${INK_INFO[ink].name}</div><div class="tt-body">${fmt(INK_INFO[ink].text)}</div>`, INK_INFO[ink].name);
      for (const f of Object.keys(FINISH_INFO) as FinishId[]) mk({ finish: f, rank: 13, suit: 'bell' }, `<div class="tt-title">${FINISH_INFO[f].name}</div><div class="tt-body">Cards: ${fmt(FINISH_INFO[f].text)}<br>Doodads: ${fmt(FINISH_INFO[f].charmText)}</div>`, FINISH_INFO[f].name);
      for (const s of Object.keys(SEAL_INFO) as SealId[]) mk({ seal: s, rank: 7, suit: 'leaf' }, `<div class="tt-title">${SEAL_INFO[s].name}</div><div class="tt-body">${fmt(SEAL_INFO[s].text)}</div>`, SEAL_INFO[s].name);
      void cardTooltip;
    }
    body.appendChild(grid);
    if (tab === 'charms') {
      const pages = Math.ceil(CHARMS.length / per);
      const pager = div('pager');
      for (let i = 0; i < pages; i++) {
        const b = h('button', { class: `page-dot${i === page ? ' on' : ''}`, type: 'button' }, String(i + 1));
        b.addEventListener('click', () => {
          sfx('deal');
          show('charms', i);
        });
        pager.appendChild(b);
      }
      body.appendChild(pager);
    }
  };
  const labels: [Tab, string][] = [
    ['charms', 'Doodads'], ['fortunes', 'Tonics'], ['stars', 'Tall Tales'], ['masks', 'Moonshine'], ['relics', 'Deeds'],
    ['tokens', 'Telegrams'], ['hosts', 'Outlaws'], ['shoes', 'Shoes'], ['cards', 'Paints & Brands'],
  ];
  for (const [id, label] of labels) {
    const b = h('button', { class: 'tab', type: 'button', dataset: { tab: id } }, label, h('small', null, ` ${counts[id][0]}/${counts[id][1]}`));
    b.addEventListener('click', () => {
      sfx('click');
      show(id);
    });
    tabs.appendChild(b);
  }
  box.append(div('col-title', 'Collection'), tabs, body);
  const close = modal(box, { cls: 'wide' });
  box.appendChild(div('ri-foot', button('Back', 'primary', () => close())));
  show(current, page);
}
