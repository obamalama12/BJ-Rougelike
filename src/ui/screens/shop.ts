// Tanuki's Stall: buy Charms, consumables, Bundles and Relics.

import type { Run, ShopItem } from '../../core/types';
import { CONS } from '../../content/consumables';
import { buyItem, buyPack, buyVoucher, leaveShop, reroll, rerollPrice, voucherPrice, canAfford } from '../../game/shop';
import { drainFx } from '../../game/engine';
import { app, burstAt, button, jiggle, popup, save, tip, toast, hideTip } from '../app';
import { cardTooltip, charmCard, charmTooltip, consCard, consTooltip, packCard, packTooltip, playingCard, voucherCard, voucherTooltip } from '../art';
import { div, h, clear } from '../dom';
import type { Hud } from '../hud';
import { background } from '../../fx/background';
import { audio, sfx } from '../../fx/audio';
import { iconSvg } from '../icons';

const QUIPS = [
  'Welcome, welcome! Everything glows, nothing refunds.',
  'Fresh charms! Only slightly haunted.',
  'A wise soul spends... but a wiser one rerolls.',
  'The Host is watching. Buy something shiny.',
  'Ah, a returning customer! Or are you a ghost?',
  'My prices are fair. My tail is fluffier.',
  'Lanterns light the way. Embers light my purse.',
  'Psst. The fortunes never lie. Mostly.',
];

export function shopScreen(hud: Hud): HTMLElement {
  const run = app.run as Run;
  background.setPalette('shop', 0.3);
  audio.setMood('shop');
  const el = div('shop-screen');
  const render = () => {
    clear(el);
    const s = run.shop;
    if (!s) return;
    const quip = QUIPS[(run.night * 3 + run.tableIdx + s.rerollsDone) % QUIPS.length];
    const head = div(
      'shop-head',
      div('merchant', div('merchant-face', iconSvg('tanuki')), div('merchant-bubble', quip)),
      div(
        'shop-buttons',
        button('Next Table', 'primary big', () => {
          sfx('gong');
          leaveShop(run);
          drainFx();
          save();
          app.render();
        }),
        button(`Reroll $${rerollPrice(run)}`, 'reroll', () => {
          if (!reroll(run)) return toast('Not enough Embers', 'bad');
          sfx('reroll');
          drainFx();
          save();
          render();
          hud.update();
          hud.renderTrays();
        }, { disabled: !canAfford(run, rerollPrice(run)) }),
      ),
    );
    const items = div('shop-items');
    for (const it of s.items) items.appendChild(itemSlot(run, it, hud, render));
    const lower = div('shop-lower');
    const vouch = div('shop-vouchers', div('shelf-label', 'Relic'));
    const vids: [string | null, boolean][] = [[s.voucher, false]];
    if (run.flags.bonusVoucher) vids.push([run.flags.bonusVoucher, true]);
    for (const [vid, bonus] of vids) {
      if (!vid) {
        vouch.appendChild(div('shop-slot empty', div('sold-out', 'Sold out')));
        continue;
      }
      const card = voucherCard(vid);
      tip(card, () => voucherTooltip(vid));
      const price = voucherPrice(run, vid);
      const slot = div('shop-slot', div('price-tag', `$${price}`), card);
      slot.appendChild(
        button('Redeem', 'buy tiny', () => {
          const r = buyVoucher(run, bonus);
          if (!r.ok) return toast(r.reason, 'bad');
          sfx('buy');
          burstAt(card, { n: 30, color: ['#ffd23f', '#ff8a3d'] });
          hideTip();
          save();
          hud.update();
          hud.renderTrays();
          render();
        }, { disabled: !canAfford(run, price) }),
      );
      vouch.appendChild(slot);
    }
    const packs = div('shop-packs', div('shelf-label', 'Bundles'));
    for (const p of s.packs) {
      if (p.sold) {
        packs.appendChild(div('shop-slot empty', div('sold-out', 'Opened')));
        continue;
      }
      const card = packCard(p.packId);
      tip(card, () => packTooltip(p.packId));
      const slot = div('shop-slot', div('price-tag', p.price ? `$${p.price}` : 'Free'), card);
      slot.appendChild(
        button('Open', 'buy tiny', () => {
          const r = buyPack(run, p.uid);
          if (!r.ok) return toast(r.reason, 'bad');
          sfx('pack');
          save();
          app.render();
        }, { disabled: !canAfford(run, p.price) }),
      );
      packs.appendChild(slot);
    }
    lower.append(vouch, packs);
    el.append(head, div('shelf shelf-items', div('shelf-label', 'Wares'), items), lower);
  };
  render();
  hud.update();
  hud.renderTrays();
  hud.canUse = true;
  hud.onChange = () => render();
  return el;
}

function itemSlot(run: Run, it: ShopItem, hud: Hud, rerender: () => void): HTMLElement {
  if (it.sold) return div('shop-slot empty', div('sold-out', 'Sold'));
  let card: HTMLElement;
  if (it.kind === 'charm') {
    card = charmCard(it.id, it.finish);
    tip(card, () => charmTooltip(run, it.id, { uid: 0, id: it.id, finish: it.finish, state: {} }));
  } else if (it.kind === 'cons') {
    card = consCard(it.cons, it.id, it.finish);
    tip(card, () => consTooltip(run, it.cons, it.id));
  } else {
    card = playingCard({ ...it.card, id: -it.uid }, run.shoeId);
    tip(card, () => cardTooltip(it.card));
  }
  card.classList.add('shop-card');
  const slot = div('shop-slot', div('price-tag', it.price ? `$${it.price}` : 'Free'), card);
  const btns = div('slot-btns');
  btns.appendChild(
    button(it.kind === 'cons' ? 'Buy' : 'Buy', 'buy tiny', () => {
      const r = buyItem(run, it.uid);
      if (!r.ok) {
        jiggle(card);
        return toast(r.reason, 'bad');
      }
      sfx('buy');
      burstAt(card, { n: 20, color: ['#ffd23f', '#ff8a3d', '#fff6e0'] });
      popup(card, `-$${it.price}`, 'pop-bad');
      hideTip();
      save();
      hud.update();
      hud.renderTrays();
      rerender();
    }, { disabled: !canAfford(run, it.price) }),
  );
  if (it.kind === 'cons' && !CONS[it.id]?.targets) {
    btns.appendChild(
      button('Buy & Use', 'use tiny', async () => {
        const r = buyItem(run, it.uid, true);
        if (!r.ok) return toast(r.reason, 'bad');
        const inst = run.consumables[run.consumables.length - 1];
        const { useCons } = await import('../../game/shop');
        if (!useCons(run, inst.uid, [])) toast('Kept for later', 'info');
        else sfx(it.cons === 'star' ? 'levelup' : 'buy');
        drainFx();
        hideTip();
        save();
        hud.update();
        hud.renderTrays();
        rerender();
      }, { disabled: !canAfford(run, it.price) }),
    );
  }
  slot.appendChild(btns);
  return slot;
}

export { h };
