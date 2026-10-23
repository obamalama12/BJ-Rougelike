// The table: dealing, player actions, the dealer and the scoring show.

import type { Card, HandTypeId, Outcome, Run, ScoreEvent, Src } from '../../core/types';
import { HAND_TYPE, handTotal } from '../../core/cards';
import { HOST } from '../../content/hosts';
import {
  afterDeal, availableActions, beginHand, cardsOf, dealTo, dealerHit, dealerShouldHit, double, endFold, endRound,
  fillSplit, fold, hit, revealDealer, scoreHand, settleOutcomes, settleSplit, split, stand, cardById, dealerNeedsToPlay,
  type ScoreResult,
} from '../../game/table';
import { drainFx, getRules, currentHost, NIGHTS } from '../../game/engine';
import { cashOut, winTable } from '../../game/shop';
import { app, burstAt, button, center, jiggle, modal, popup, save, screenShake, tip, wait, hideTip } from '../app';
import { cardTooltip, hostMedallion, hostTooltip, playingCard, cardBackHtml } from '../art';
import { div, fmtNum, h, clear, fmt } from '../dom';
import { Hud } from '../hud';
import { sfx, audio } from '../../fx/audio';
import { background } from '../../fx/background';
import { particles } from '../../fx/particles';
import { profile, saveProfile } from '../profile';
import { iconSvg } from '../icons';

const CW = 112;
const CH = 156;
const SHOE_POS = { x: 1430, y: 330 };
const DISCARD_POS = { x: 470, y: 330 };
const DEALER_Y = 330;
const PLAYER_Y = 595;
const FELT_CX = 965;

const OUTCOME_LABEL: Record<Outcome, string> = {
  blackjack: 'Blackjack!',
  charlie: 'Charlie!',
  win: 'Win',
  dealerbust: 'Dealer Busts!',
  push: 'Push',
  lose: 'Lose',
  bust: 'Bust!',
  fold: 'Folded',
};

export class TableScreen {
  el: HTMLElement;
  hud: Hud;
  felt: HTMLElement;
  cardLayer: HTMLElement;
  actions: HTMLElement;
  dealerBadge: HTMLElement;
  handBadges: HTMLElement;
  shoeEl: HTMLElement;
  shoeCount: HTMLElement;
  banner: HTMLElement;
  cards = new Map<number, HTMLElement>();
  private keyHandler: (e: KeyboardEvent) => void;
  private flameTimer = 0;

  constructor(hud: Hud) {
    this.hud = hud;
    this.el = div('table-screen');
    this.felt = div('felt');
    this.felt.innerHTML = `<div class="felt-inner"><div class="felt-pattern"></div><div class="felt-rule">
      <span>Dealer stands on 17</span><span class="dot">◆</span><span>Blackjack pays in light</span></div></div>`;
    this.cardLayer = div('card-layer');
    this.dealerBadge = div('total-badge dealer-badge');
    this.handBadges = div('hand-badges');
    this.shoeCount = div('shoe-count');
    this.shoeEl = div('shoe', div('shoe-stack'), this.shoeCount);
    this.banner = div('outcome-banner');
    this.actions = div('action-bar');
    this.el.append(this.felt, this.shoeEl, div('discard-spot'), this.dealerBadge, this.handBadges, this.cardLayer, this.banner, this.actions);
    tip(this.shoeEl, () => this.shoeTip(), 'left');
    this.keyHandler = (e) => this.onKey(e);
    window.addEventListener('keydown', this.keyHandler);
  }

  destroy() {
    window.removeEventListener('keydown', this.keyHandler);
    cancelAnimationFrame(this.flameTimer);
  }

  get run(): Run {
    return app.run!;
  }

  mount() {
    const run = this.run;
    const t = run.table!;
    const host = t.kind === 'host' ? HOST[t.hostId!] : null;
    background.setPalette(host ? 'host' : 'table', 0.25);
    audio.setMood(host ? 'host' : 'table');
    this.el.classList.toggle('host-table', !!host);
    if (host) {
      const med = hostMedallion(host.id, 'lg');
      tip(med, () => hostTooltip(host.id), 'right');
      const plate = div('host-plate', med, div('host-plate-text', div('hp-name', host.name), h('div', { class: 'hp-curse', html: t.hostDisabled ? '<s>Curse lifted</s>' : fmt(host.text) })));
      this.el.appendChild(plate);
    }
    const rules = getRules(run);
    const rule = this.felt.querySelector('.felt-rule')!;
    rule.innerHTML = `<span>Dealer ${rules.dealerStand > 17 ? `hits to ${rules.dealerStand}` : rules.dealerHitSoft17 ? 'hits soft 17' : 'stands on 17'}</span><span class="dot">◆</span><span>Bust over ${rules.bustLimit}</span><span class="dot">◆</span><span>Charlie at ${rules.charlieSize}</span>`;
    // Restore any cards on the felt (e.g. after reload mid-hand).
    for (const id of [...t.dealer, ...t.hands.flatMap((x) => x.cards)]) this.spawn(id, false);
    this.layout();
    this.hud.update();
    this.hud.renderTrays();
    this.hud.clearCalc();
    this.hud.canUse = true;
    this.hud.onChange = () => {
      this.layout();
      this.renderActions();
    };
    this.renderActions();
    this.startFlameLoop();
    if (t.phase === 'dealer') void this.dealerAndResolve();
    else if (t.phase === 'won') void this.winSequence();
    else if (t.phase === 'lost') void this.loseSequence();
    else if (t.phase === 'resolved') {
      endFold(run);
      this.layout();
      this.renderActions();
    }
  }

  // -------------------------------------------------------------------------
  // Cards & layout
  // -------------------------------------------------------------------------

  private spawn(id: number, fromShoe = true): HTMLElement {
    let el = this.cards.get(id);
    if (el) return el;
    const run = this.run;
    const card = cardById(run, id);
    el = playingCard(card, run.shoeId, true);
    el.classList.add('table-card');
    if (fromShoe) {
      el.style.transition = 'none';
      el.style.transform = `translate(${SHOE_POS.x - CW / 2}px, ${SHOE_POS.y - CH / 2}px) rotate(8deg)`;
    }
    tip(el, () => (this.isHidden(id) ? '<div class="tt-title">Face down</div>' : cardTooltip(cardById(this.run, id), !!this.run.table?.debuffed.includes(id))));
    this.cardLayer.appendChild(el);
    this.cards.set(id, el);
    if (fromShoe) {
      void el.offsetWidth;
      el.style.transition = '';
    }
    return el;
  }

  private isHidden(id: number) {
    return !!this.run.table?.hidden.includes(id);
  }

  layout() {
    const run = this.run;
    const t = run.table;
    if (!t) return;
    const place = (id: number, x: number, y: number, rot: number, z: number, lift = 0) => {
      const el = this.spawn(id);
      el.style.transform = `translate(${x - CW / 2}px, ${y - CH / 2 - lift}px) rotate(${rot}deg)`;
      el.style.zIndex = String(z);
      const hidden = this.isHidden(id);
      if (el.classList.contains('down') !== hidden) {
        el.classList.toggle('down', hidden);
        if (!hidden) sfx('flip');
      }
      el.classList.toggle('debuffed', t.debuffed.includes(id));
    };
    const live = new Set<number>();
    // Dealer
    const dn = t.dealer.length;
    const dsp = dn > 5 ? 70 : 92;
    t.dealer.forEach((id, i) => {
      live.add(id);
      place(id, FELT_CX - ((dn - 1) * dsp) / 2 + i * dsp, DEALER_Y, (i - (dn - 1) / 2) * 1.5, 10 + i);
    });
    // Player hands
    const nh = t.hands.length;
    const span = nh > 1 ? Math.min(330, 1000 / nh) : 0;
    clear(this.handBadges);
    t.hands.forEach((hand, hi) => {
      const cx = FELT_CX - ((nh - 1) * span) / 2 + hi * span;
      const n = hand.cards.length;
      const sp = nh > 2 ? 34 : n > 5 ? 52 : nh > 1 ? 46 : 74;
      const active = t.phase === 'player' && hi === t.active && nh > 1;
      hand.cards.forEach((id, i) => {
        live.add(id);
        const off = i - (n - 1) / 2;
        place(id, cx + off * sp, PLAYER_Y + Math.abs(off) * 4, off * 3, 30 + hi * 10 + i, active ? 18 : 0);
      });
      this.handBadges.appendChild(this.badgeFor(hand.cards, cx, hand.outcome, active, hand.doubled));
    });
    // Dealer badge
    this.updateDealerBadge();
    // Anything else on the layer flies to the discard pile.
    for (const [id, el] of this.cards) {
      if (live.has(id)) continue;
      this.cards.delete(id);
      el.style.zIndex = '1';
      el.style.transform = `translate(${DISCARD_POS.x - CW / 2}px, ${DISCARD_POS.y - CH / 2}px) rotate(${-20 + Math.random() * 40}deg) scale(.8)`;
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 600);
    }
    this.shoeCount.textContent = String(t.shoe.length);
    this.renderShoeTop();
  }

  private renderShoeTop() {
    const run = this.run;
    const t = run.table!;
    const rules = getRules(run);
    const stack = this.shoeEl.querySelector('.shoe-stack')!;
    const depth = Math.min(8, Math.ceil(t.shoe.length / 6));
    stack.innerHTML = '';
    for (let i = 0; i < depth; i++) {
      const b = div('shoe-card');
      b.innerHTML = cardBackHtml(run.shoeId);
      b.style.transform = `translate(${-i * 1.5}px, ${-i * 2}px)`;
      stack.appendChild(b);
    }
    if (rules.seeTop && t.shoe.length) {
      const top = playingCard(cardById(run, t.shoe[0]), run.shoeId);
      top.classList.add('shoe-peek');
      stack.appendChild(top);
    }
  }

  private shoeTip(): string {
    const run = this.run;
    const t = run.table;
    if (!t) return '';
    const cards = cardsOf(run, t.shoe);
    const low = cards.filter((c) => c.ink !== 'stone' && c.rank <= 6).length;
    const high = cards.filter((c) => c.ink !== 'stone' && c.rank >= 10).length;
    return `<div class="tt-title">The Shoe</div><div class="tt-body">${cards.length} cards remain<br>
      <span class="t-chips">${low}</span> low (2-6) · <span class="t-mult">${high}</span> high (10-A)</div>`;
  }

  private badgeFor(ids: number[], cx: number, outcome?: Outcome, active = false, doubled = false): HTMLElement {
    const run = this.run;
    const rules = getRules(run);
    const cards = cardsOf(run, ids);
    const hidden = ids.some((id) => this.isHidden(id));
    const tot = handTotal(cards, rules);
    const b = div(`total-badge${active ? ' active' : ''}`);
    b.style.left = `${cx}px`;
    b.style.top = `${PLAYER_Y + CH / 2 + 22}px`;
    let txt = hidden ? '??' : `${tot.soft && tot.total < rules.bustLimit ? 'Soft ' : ''}${tot.total}`;
    if (outcome === 'bust') b.classList.add('bust');
    else if (!hidden && tot.total === 21) b.classList.add('gold');
    if (outcome && outcome !== 'fold') txt += ` · ${OUTCOME_LABEL[outcome]}`;
    b.textContent = txt;
    if (doubled) b.appendChild(div('badge-x2', `X${rules.doubleX}`));
    return b;
  }

  private updateDealerBadge() {
    const run = this.run;
    const t = run.table!;
    const b = this.dealerBadge;
    if (!t.dealer.length) {
      b.style.opacity = '0';
      return;
    }
    const rules = getRules(run);
    const visible = cardsOf(run, t.dealer.filter((id) => !this.isHidden(id)));
    const hidden = t.dealer.length - visible.length;
    const tot = handTotal(visible, rules, 21, true);
    b.style.opacity = '1';
    b.style.left = `${FELT_CX}px`;
    b.style.top = `${DEALER_Y - CH / 2 - 26}px`;
    b.className = `total-badge dealer-badge${tot.bust ? ' bust' : ''}`;
    b.textContent = `Dealer ${visible.length ? tot.total : ''}${hidden ? (visible.length ? ' + ?' : '?') : ''}`;
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  renderActions() {
    const run = this.run;
    const t = run.table!;
    clear(this.actions);
    if (t.phase === 'ready') {
      const deal = button('Deal', 'primary big deal-btn', () => void this.deal(), { sub: 'Space' });
      this.actions.append(deal);
      return;
    }
    if (t.phase !== 'player') return;
    const a = availableActions(run);
    const rules = getRules(run);
    const mk = (label: string, key: string, cls: string, ok: boolean, fn: () => void, reason?: string, sub?: string) => {
      const b = button(label, `act ${cls}`, fn, { disabled: !ok, sub: sub ?? key });
      if (!ok && reason) tip(b, () => `<div class="tt-body">${reason}</div>`);
      return b;
    };
    this.actions.append(
      mk('Hit', 'H', 'hit', a.hit, () => void this.doHit()),
      mk('Stand', 'S', 'stand', a.stand, () => void this.doStand(), a.reasons.stand),
      mk('Double', 'D', 'double', a.double, () => void this.doDouble(), a.reasons.double, `D · X${rules.doubleX}${rules.doubleCost ? ' · 1 hand' : ''}`),
      mk('Split', 'P', 'split', a.split, () => void this.doSplit(), a.reasons.split, `P${rules.splitCost ? ' · 1 hand' : ''}`),
      mk('Fold', 'F', 'fold', a.fold, () => void this.doFold(), a.reasons.fold, `F · ${t.foldsLeft} left`),
    );
  }

  private onKey(e: KeyboardEvent) {
    if (app.busy || app.modalLayer.childElementCount) return;
    const t = this.run?.table;
    if (!t || e.repeat) return;
    const k = e.key.toLowerCase();
    if (t.phase === 'ready' && (k === ' ' || k === 'enter')) {
      e.preventDefault();
      void this.deal();
      return;
    }
    if (t.phase !== 'player') return;
    const a = availableActions(this.run);
    if (k === 'h' && a.hit) void this.doHit();
    else if (k === 's' && a.stand) void this.doStand();
    else if (k === 'd' && a.double) void this.doDouble();
    else if (k === 'p' && a.split) void this.doSplit();
    else if (k === 'f' && a.fold) void this.doFold();
  }

  private lock() {
    app.busy = true;
    this.hud.canUse = false;
    this.actions.classList.add('locked');
    hideTip();
  }

  private unlock() {
    app.busy = false;
    this.hud.canUse = true;
    this.actions.classList.remove('locked');
    this.renderActions();
    this.hud.renderTrays();
    this.hud.update();
    save();
  }

  async deal() {
    if (app.busy) return;
    const run = this.run;
    const t = run.table!;
    if (t.phase !== 'ready' || t.handsLeft <= 0) return;
    this.lock();
    this.hud.clearCalc();
    clear(this.actions);
    beginHand(run);
    this.hud.update();
    for (const who of ['player', 'dealer', 'player', 'dealer'] as const) {
      dealTo(run, who);
      sfx('deal');
      this.layout();
      await wait(190);
    }
    const res = afterDeal(run);
    this.layout();
    this.flushFx();
    if (res.dealerNatural) {
      await wait(250);
      this.showBanner('Dealer Blackjack', 'bad');
      sfx('lose');
      await wait(700);
    } else if (res.playerNatural) {
      await wait(150);
      this.outcomeFx(0, 'blackjack');
      await wait(500);
    }
    await this.continueFlow();
  }

  private async continueFlow() {
    const t = this.run.table!;
    this.layout();
    this.hud.update();
    if (t.phase === 'player') {
      this.unlock();
      return;
    }
    if (t.phase === 'resolved') return; // folds handle themselves
    await this.dealerAndResolve();
  }

  private async doHit() {
    if (app.busy) return;
    const run = this.run;
    const t = run.table!;
    this.lock();
    const hi = t.active;
    const before = t.hands[hi];
    hit(run);
    sfx('deal');
    this.layout();
    this.flushFx();
    await wait(230);
    if (before.outcome) {
      this.outcomeFx(hi, before.outcome);
      await wait(before.outcome === 'bust' ? 650 : 450);
    }
    await this.continueFlow();
  }

  private async doStand() {
    if (app.busy) return;
    this.lock();
    stand(this.run);
    sfx('click');
    await this.continueFlow();
  }

  private async doDouble() {
    if (app.busy) return;
    const run = this.run;
    const t = run.table!;
    this.lock();
    const hi = t.active;
    const hand = t.hands[hi];
    popup(this.cardLayer.querySelector(`[data-id="${hand.cards[0]}"]`) ?? this.actions, 'Double!', 'pop-xmult');
    double(run);
    sfx('deal');
    this.layout();
    this.hud.update();
    this.flushFx();
    await wait(300);
    if (hand.outcome) {
      this.outcomeFx(hi, hand.outcome);
      await wait(500);
    }
    await this.continueFlow();
  }

  private async doSplit() {
    if (app.busy) return;
    const run = this.run;
    const t = run.table!;
    this.lock();
    const ni = split(run);
    sfx('flip');
    this.layout();
    this.hud.update();
    await wait(280);
    fillSplit(run, t.active);
    sfx('deal');
    this.layout();
    await wait(220);
    fillSplit(run, ni);
    sfx('deal');
    this.layout();
    await wait(220);
    settleSplit(run);
    this.flushFx();
    await this.continueFlow();
  }

  private async doFold() {
    if (app.busy) return;
    const run = this.run;
    this.lock();
    const first = this.cardLayer.querySelector('.table-card');
    fold(run);
    sfx('shuffle');
    if (first) popup(first, 'Folded', 'pop-info');
    this.flushFx();
    await wait(200);
    endFold(run);
    this.layout();
    this.hud.update();
    await wait(350);
    this.unlock();
  }

  // -------------------------------------------------------------------------
  // Dealer & resolution
  // -------------------------------------------------------------------------

  private async dealerAndResolve() {
    const run = this.run;
    this.lock();
    clear(this.actions);
    revealDealer(run);
    this.layout();
    await wait(380);
    if (dealerNeedsToPlay(run)) {
      while (dealerShouldHit(run)) {
        dealerHit(run);
        sfx('deal');
        this.layout();
        this.flushFx();
        await wait(430);
      }
    }
    const dealerBust = handTotal(cardsOf(run, run.table!.dealer), getRules(run), 21, true).bust;
    settleOutcomes(run);
    this.layout();
    if (dealerBust && dealerNeedsToPlayOrScored(run)) {
      const el = this.cardLayer.querySelector(`[data-id="${run.table!.dealer[run.table!.dealer.length - 1]}"]`);
      if (el) {
        popup(el, 'Dealer Busts!', 'pop-big pop-good');
        burstAt(el, { n: 18, color: ['#ffe27a', '#ffb03d'] });
      }
      sfx('win');
      await wait(450);
    }
    await this.resolveAll();
  }

  private async resolveAll() {
    const run = this.run;
    const t = run.table!;
    const results: ScoreResult[] = [];
    for (let i = 0; i < t.hands.length; i++) {
      const hand = t.hands[i];
      if (t.hands.length > 1) {
        // Highlight the hand being scored.
        for (const id of hand.cards) this.cards.get(id)?.classList.add('focus');
      }
      const res = scoreHand(run, i);
      results.push(res);
      await this.animateScore(res, i);
      for (const id of hand.cards) this.cards.get(id)?.classList.remove('focus');
    }
    this.flushFx();
    await wait(250);
    // Shatter / crumble effects before cards leave.
    for (const r of results) {
      for (const id of [...r.shattered, ...r.crumbled]) {
        const el = this.cards.get(id);
        if (el) {
          sfx('shatter');
          burstAt(el, { n: 22, color: r.shattered.includes(id) ? ['#bfe9ff', '#ffffff'] : ['#8a8a8a', '#ff6a2a'] });
          popup(el, r.shattered.includes(id) ? 'Shattered!' : 'Crumbled!', 'pop-info');
          el.classList.add('shatter');
        }
      }
    }
    const state = endRound(run, results);
    this.flushFx();
    await wait(200);
    this.layout();
    this.hud.update();
    this.hud.renderTrays();
    this.banner.className = 'outcome-banner';
    await wait(380);
    if (state === 'won') await this.winSequence();
    else if (state === 'lost') await this.loseSequence();
    else this.unlock();
  }

  private showBanner(text: string, tone: 'good' | 'bad' | 'gold' | 'info', sub = '') {
    const b = this.banner;
    b.innerHTML = `<div class="ob-text">${text}</div>${sub ? `<div class="ob-sub">${sub}</div>` : ''}`;
    b.className = `outcome-banner show ${tone}`;
  }

  private outcomeFx(hi: number, o: Outcome) {
    const t = this.run.table!;
    const hand = t.hands[hi];
    const el = this.cards.get(hand.cards[hand.cards.length - 1]);
    if (!el) return;
    switch (o) {
      case 'bust':
        popup(el, 'Bust!', 'pop-big pop-bad');
        sfx('bust');
        screenShake(1.2);
        el.classList.add('burn');
        break;
      case 'blackjack':
        popup(el, 'Blackjack!', 'pop-big pop-gold');
        sfx('blackjack');
        burstAt(el, { n: 40, color: ['#ffe27a', '#ffb03d', '#fff6e0'], speed: 420 });
        particles.ring(center(el).x, center(el).y, '#ffd23f', 160);
        background.bump(1.5);
        break;
      case 'charlie':
        popup(el, 'Lantern Charlie!', 'pop-big pop-gold');
        sfx('blackjack');
        burstAt(el, { n: 30, color: ['#7fe8ff', '#ffe27a'] });
        break;
      case 'push':
        popup(el, 'Spared!', 'pop-info');
        break;
    }
  }

  private srcEl(src: Src): Element | null {
    switch (src.kind) {
      case 'card':
        return this.cards.get(src.id) ?? null;
      case 'charm':
        return this.hud.charmEl(src.uid);
      case 'cons':
        return this.hud.consEl(src.uid);
      case 'host':
        return this.el.querySelector('.host-plate .host-med') ?? this.hud.refs.calc;
      default:
        return this.hud.refs.calc;
    }
  }

  private async animateScore(res: ScoreResult, hi: number) {
    const run = this.run;
    const t = run.table!;
    const hand = t.hands[hi];
    const o = res.outcome;
    const ht = res.handType;
    // Outcome banner
    if (!ht) {
      const tone = o === 'push' ? 'info' : 'bad';
      this.showBanner(res.blocked ? `Blocked: ${res.blocked}` : OUTCOME_LABEL[o], tone);
      if (o === 'lose') sfx('lose');
      if (o === 'push') sfx('push');
      if (o === 'lose' || o === 'bust') {
        for (const id of hand.cards) this.cards.get(id)?.classList.add('dim');
      }
      await wait(360);
      await this.playEvents(res.events.filter((e) => e.t === 'money' || e.t === 'msg'), true);
      await wait(400);
      return;
    }
    const info = HAND_TYPE[ht];
    this.showBanner(info.name, ht === 'push' ? 'info' : ['royal', 'sevens', 'flush', 'blackjack', 'charlie'].includes(ht) ? 'gold' : 'good', hand.doubled ? 'Doubled' : '');
    if (ht !== 'push') sfx('win');
    await wait(320);
    await this.playEvents(res.events, false, hand.cards);
    // Final tally
    await wait(200);
    const totalEl = div('score-total', `+${fmtNum(res.total)}`);
    this.el.appendChild(totalEl);
    totalEl.style.left = `${FELT_CX}px`;
    totalEl.style.top = `${PLAYER_Y - 150}px`;
    const big = res.total >= t.target * 0.5;
    sfx(big ? 'gong' : 'money');
    background.bump(big ? 2 : 1);
    if (big) {
      screenShake(1.5);
      particles.ring(center(totalEl).x, center(totalEl).y, '#ff8a3d', 260);
      burstAt(totalEl, { n: 60, color: ['#ff5b2a', '#ffb03d', '#ffe27a'], speed: 520 });
    }
    this.hud.setScore(t.score, t.target, true);
    await wait(900);
    totalEl.classList.add('out');
    setTimeout(() => totalEl.remove(), 500);
    for (const id of hand.cards) this.cards.get(id)?.classList.remove('scoring');
  }

  private async playEvents(events: ScoreEvent[], quick: boolean, handCards: number[] = []) {
    const run = this.run;
    let delay = quick ? 220 : 420;
    let chipN = 0;
    let multN = 0;
    for (const e of events) {
      if (e.t === 'base') {
        this.hud.setHand(e.handType, e.level);
        this.hud.setCalc(e.chips, e.mult);
        jiggle(this.hud.refs.calc, 'bump');
        sfx('select');
        await wait(380);
        continue;
      }
      const src = 'src' in e ? (e.src as Src) : null;
      const el = src ? this.srcEl(src) : null;
      if (src?.kind === 'card') {
        for (const id of handCards) this.cards.get(id)?.classList.toggle('scoring', id === src.id);
      }
      switch (e.t) {
        case 'chips':
          if (!e.v) {
            this.hud.setCalc(e.chips, e.mult);
            break;
          }
          if (el) {
            jiggle(el);
            popup(el, `+${fmtNum(e.v)}`, 'pop-chips');
          }
          this.hud.setCalc(e.chips, e.mult, 'chips');
          sfx('chips', chipN++);
          break;
        case 'mult':
          if (el) {
            jiggle(el);
            popup(el, `+${fmtNum(e.v)} Mult`, 'pop-mult');
          }
          this.hud.setCalc(e.chips, e.mult, 'mult');
          sfx('mult', multN++);
          break;
        case 'xmult':
          if (el) {
            jiggle(el, 'jiggle-big');
            popup(el, `X${Math.round(e.v * 100) / 100} Mult`, 'pop-xmult');
            burstAt(el, { n: 12, color: ['#ff3d2a', '#ffcf3d'] });
          }
          this.hud.setCalc(e.chips, e.mult, 'mult');
          sfx('xmult', multN++);
          background.bump(0.6);
          break;
        case 'money':
          if (el) {
            jiggle(el);
            popup(el, `${e.v < 0 ? '-' : '+'}$${Math.abs(e.v)}`, e.v < 0 ? 'pop-bad' : 'pop-money');
            if (e.v > 0) burstAt(el, { n: 6, kind: 'coin', color: '#ffd23f', speed: 200, size: 5, up: 200 });
          }
          sfx(e.v < 0 ? 'error' : 'money');
          this.hud.refs.money.textContent = `$${run.money}`;
          break;
        case 'msg':
          if (el) {
            jiggle(el);
            const p = popup(el, e.text, 'pop-info');
            if (e.color) p.style.color = e.color;
          }
          sfx('coin');
          break;
        case 'retrigger':
          if (el) popup(el, 'Again!', 'pop-again');
          sfx('retrigger');
          break;
        default:
          continue;
      }
      await wait(delay);
      delay = Math.max(quick ? 120 : 110, delay * 0.93);
    }
    this.hud.update();
  }

  /** Non-blocking popups for out-of-band effects (reshuffles, money, charm messages). */
  flushFx() {
    const evs = drainFx();
    let i = 0;
    for (const e of evs) {
      const el = 'src' in e ? this.srcEl(e.src as Src) ?? this.shoeEl : this.shoeEl;
      setTimeout(() => {
        if (e.t === 'money') {
          popup(el, `${e.v < 0 ? '-' : '+'}$${Math.abs(e.v)}`, e.v < 0 ? 'pop-bad' : 'pop-money');
          sfx(e.v < 0 ? 'error' : 'money');
        } else if (e.t === 'msg') {
          const p = popup(e.src.kind === 'deck' ? this.shoeEl : el, e.text, 'pop-info');
          if (e.color) p.style.color = e.color;
          if (e.text === 'Reshuffle!') sfx('shuffle');
        } else if (e.t === 'destroyCharm') {
          const ce = this.hud.charmEl(e.uid);
          if (ce) {
            burstAt(ce, { n: 24, color: ['#ff6a3d', '#ffd23f'] });
            ce.classList.add('shatter');
          }
          sfx('shatter');
        }
        jiggle(el);
        this.hud.update();
      }, i * 160);
      i++;
    }
    if (evs.some((e) => e.t === 'destroyCharm')) setTimeout(() => this.hud.renderTrays(), i * 160 + 400);
  }

  // -------------------------------------------------------------------------
  // Endings
  // -------------------------------------------------------------------------

  private async winSequence() {
    const run = this.run;
    const t = run.table!;
    this.lock();
    clear(this.actions);
    sfx('blackjack');
    particles.petals(60);
    background.bump(2);
    const lit = div('lantern-lit', div('ll-lantern', div('ll-glow'), h('div', { class: 'll-body', html: iconSvg('lantern') })), div('ll-text', t.kind === 'host' ? 'Host Defeated' : 'Lantern Lit'));
    this.el.appendChild(lit);
    if (run.flags.savedBy) {
      popup(this.hud.refs.score, 'Saved by Jizo!', 'pop-big pop-gold');
      run.flags.savedBy = undefined;
    }
    profile.handsPlayed += 0;
    await wait(1500);
    lit.classList.add('out');
    winTable(run);
    this.flushFx();
    save();
    await wait(300);
    lit.remove();
    this.showCashout();
  }

  showCashout() {
    const run = this.run;
    const co = run.cashout;
    if (!co) return;
    app.busy = false;
    const panel = div('cashout');
    const list = div('co-lines');
    panel.append(div('co-title', 'The Lantern Burns Bright'), list);
    const btn = button(`Cash Out: $${co.total}`, 'primary big', () => {
      sfx('money');
      burstAt(btn, { n: 20, kind: 'coin', color: '#ffd23f', up: 260 });
      cashOut(run);
      save();
      app.render();
    });
    co.lines.forEach((l, i) => {
      const row = div(`co-line tone-${l.tone ?? 'gold'}`, div('co-label', l.label), div('co-amt', `$${l.amount}`));
      row.style.animationDelay = `${0.15 + i * 0.18}s`;
      list.appendChild(row);
      setTimeout(() => sfx('coin'), (150 + i * 180) / Math.max(1, profile.settings.speed));
    });
    panel.appendChild(btn);
    this.el.appendChild(panel);
  }

  private async loseSequence() {
    const run = this.run;
    this.lock();
    sfx('gong');
    background.setPalette('over', 0);
    screenShake(2);
    await wait(900);
    run.phase = 'gameover';
    app.busy = false;
    app.render();
  }

  private startFlameLoop() {
    const tick = () => {
      this.flameTimer = requestAnimationFrame(tick);
      const calc = this.hud.refs.calc;
      const heat = Number(calc.style.getPropertyValue('--heat') || 0);
      if (heat > 0.5 && Math.random() < 0.5) particles.flames(calc.getBoundingClientRect(), heat);
      const t = this.run?.table;
      if (t && t.score >= t.target && Math.random() < 0.4) particles.flames(this.hud.refs.score.getBoundingClientRect(), 1.2, ['#ffd23f', '#ff8a3d']);
    };
    this.flameTimer = requestAnimationFrame(tick);
  }
}

function dealerNeedsToPlayOrScored(run: Run) {
  return run.table!.hands.some((h) => h.outcome === 'dealerbust');
}

export { NIGHTS, currentHost };
export type { Card, HandTypeId };
