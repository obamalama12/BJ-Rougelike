// The persistent HUD around the table: the saloon wall (town, Grit, Bucks),
// the wanted poster with the target, the revolver of hands, the bandolier of
// Doodads along the bottom and the satchel of consumables on the right.

import type { Run, HandTypeId } from '../core/types';
import { HAND_TYPE } from '../core/cards';
import { CHARM, sellValue } from '../content/charms';
import { CONS, consSellValue } from '../content/consumables';
import { HOST } from '../content/hosts';
import { app, button, jiggle, modal, popup, save, tip, toast, hideTip } from './app';
import { charmCard, charmTooltip, consCard, consTooltip, hostTooltip, tagToken, tagTooltip } from './art';
import { h, div, fmtNum, fmtMult, clear, fmt, esc } from './dom';
import { charmSlots, consSlots, getRules, NIGHTS } from '../game/engine';
import { canUseCons, consNeeds, moveCharm, sellCharm, sellCons, useCons } from '../game/shop';
import { gritCap, nodeTarget } from '../game/trail';
import { sfx } from '../fx/audio';
import { openRunInfo } from './screens/runinfo';
import { openOptions } from './screens/options';
import { pickTargets } from './picker';
import { iconSvg } from './icons';
import { portraitOf, townName } from './characters';

const KIND_NAME: Record<string, string> = { paper: 'Saloon Game', silk: 'High Stakes', bank: 'Bank Job', gang: 'Wanted', host: 'Showdown' };

export class Hud {
  el: HTMLElement;
  top: HTMLElement;
  poster: HTMLElement;
  gun: HTMLElement;
  belt: HTMLElement;
  satchel: HTMLElement;
  charmRow: HTMLElement;
  consRow: HTMLElement;
  charmCount: HTMLElement;
  consCount: HTMLElement;
  /** The pot in the middle of the felt (attached by the table screen). */
  pot: HTMLElement;
  refs: Record<string, HTMLElement> = {};
  charmEls = new Map<number, HTMLElement>();
  consEls = new Map<number, HTMLElement>();
  selected: { kind: 'charm' | 'cons'; uid: number } | null = null;
  onChange: () => void = () => {};
  canUse = true;
  private shownScore = 0;
  private scoreAnim = 0;
  private posterKey = '';

  constructor() {
    this.el = div('hud');
    this.top = div('wall');
    this.poster = div('poster');
    this.gun = div('gun');
    this.belt = div('belt');
    this.satchel = div('satchel');
    this.charmRow = div('belt-row');
    this.consRow = div('satchel-row');
    this.charmCount = div('belt-count');
    this.consCount = div('satchel-count');
    this.belt.append(div('belt-strap', div('belt-tip')), div('belt-buckle', div('belt-buckle-frame'), div('belt-prong')), this.charmRow, this.charmCount);
    this.satchel.append(div('satchel-flap', h('span', null, 'Satchel'), this.consCount), this.consRow);
    this.pot = this.buildPot();
    this.buildTop();
    this.el.append(this.top, this.poster, this.gun, this.belt, this.satchel);
    app.stage.addEventListener('pointerdown', (e) => {
      const t = e.target as HTMLElement;
      if (!t.closest('.charm-slot') && !t.closest('.cons-slot') && this.selected) {
        this.selected = null;
        this.renderTrays();
      }
    });
  }

  get run(): Run {
    return app.run!;
  }

  // -------------------------------------------------------------------------
  // Building blocks
  // -------------------------------------------------------------------------

  private buildTop() {
    const r = this.refs;
    r.town = div('wall-town');
    r.trailPips = div('wall-pips');
    r.grit = div('wall-grit');
    r.money = div('wall-money-val');
    r.tags = div('wall-tags');
    const money = div('wall-money', div('wall-money-plate', h('div', { class: 'wall-money-bag', html: iconSvg('moneybag') }), r.money));
    tip(money, () => '<div class="tt-title">Bucks</div><div class="tt-body">Spend them at the General Store. You earn interest on every $5 you hold when you win a table.</div>', 'bottom');
    tip(r.grit, () => `<div class="tt-title">Grit ${this.run.grit}/${gritCap(this.run)}</div><div class="tt-body">Your health for the whole run. Risky wagers cost Grit when you lose a hand, and falling short of a target costs more. At 0 Grit the run is over.</div>`, 'bottom');
    const plank = (label: string, icon: string, fn: () => void) => {
      const b = button(label, 'plank', fn);
      b.prepend(h('span', { class: 'plank-ico', html: iconSvg(icon) }));
      return b;
    };
    const btns = div(
      'wall-btns',
      plank('Deck', 'cards', () => openRunInfo('deck')),
      plank('Info', 'book', () => openRunInfo()),
      plank('Options', 'wagonwheel', () => openOptions()),
    );
    const track = div('wall-track', div('wall-track-label', 'The Trail'), r.trailPips);
    this.top.append(
      div('wall-bolt l'),
      div('wall-left', div('wall-plaque', r.town), track),
      r.tags,
      div('wall-right', r.grit, money, btns),
      div('wall-bolt r'),
    );
  }

  private buildPot(): HTMLElement {
    const r = this.refs;
    r.handName = div('pot-hand');
    r.handLevel = div('pot-level');
    r.chips = div('pot-chips-val', '0');
    r.mult = div('pot-odds-val', '0');
    r.stacks = div('pot-stacks');
    const pot = div(
      'pot',
      div('pot-head', r.handName, r.handLevel),
      div(
        'pot-body',
        div('pot-chips', r.stacks, div('pot-chips-text', div('pot-label', 'Pot'), r.chips)),
        div('pot-x', '×'),
        div('pot-odds', div('pot-label', 'Odds'), r.mult),
      ),
    );
    const body = pot.querySelector('.pot-body') as HTMLElement;
    tip(body, () => `<div class="tt-title">Pot × Odds</div><div class="tt-body">${fmt('A winning hand scores {c:Pot} times {m:Odds}. The kind of win sets the starting numbers. Each scored card adds its value to the Pot, and Doodads add more.')}</div>`, 'top');
    r.calc = pot;
    return pot;
  }

  // -------------------------------------------------------------------------
  // Updating
  // -------------------------------------------------------------------------

  update() {
    const run = this.run;
    const r = this.refs;
    r.town.innerHTML = `<span class="wall-town-medal">${run.night}</span><span class="wall-town-text"><span class="wall-town-name">${esc(townName(run.night))}</span><span class="wall-town-num">Town ${run.night} <small>of ${run.endless ? '∞' : NIGHTS}</small></span></span>`;
    // Trail progress pips: one per column.
    clear(r.trailPips);
    const at = run.trail.nodes.find((n) => n.id === run.trail.at);
    const cols = Math.max(1, ...run.trail.nodes.map((n) => n.col + 1));
    for (let c = 0; c < cols; c++) {
      const done = at ? c < at.col || (c === at.col && !!at.done) : false;
      const cur = at?.col === c && !at.done;
      const gang = run.trail.nodes.some((n) => n.col === c && n.kind === 'gang');
      r.trailPips.appendChild(div(`pip${done ? ' done' : ''}${cur ? ' cur' : ''}${c === cols - 1 ? ' boss' : ''}${gang ? ' gang' : ''}`));
    }
    // Grit: horseshoes
    const cap = gritCap(run);
    r.grit.innerHTML = `<div class="grit-label">Grit <b>${run.grit}</b></div><div class="grit-shoes">${Array.from({ length: cap }, (_, i) => `<span class="gshoe${i < run.grit ? ' full' : ''}">${iconSvg('horseshoe')}</span>`).join('')}</div>`;
    r.grit.classList.toggle('low', run.grit <= 3);
    this.tickMoney(run.money);
    r.money.classList.toggle('neg', run.money < 0);
    // Grit lost or gained: shake or pop the horseshoes once.
    if (this.lastGrit !== null && run.grit !== this.lastGrit) {
      r.grit.classList.remove('hurt', 'healed');
      void r.grit.offsetWidth;
      r.grit.classList.add(run.grit < this.lastGrit ? 'hurt' : 'healed');
    }
    this.lastGrit = run.grit;
    clear(r.tags);
    for (const tg of run.tags) {
      const tk = tagToken(tg.id);
      tip(tk, () => tagTooltip(tg.id), 'bottom');
      r.tags.appendChild(tk);
    }
    this.updatePoster();
    this.updateGun();
  }

  private updatePoster() {
    const run = this.run;
    const t = run.table;
    const outlawNode = run.trail.nodes.find((n) => n.kind === 'outlaw');
    const hostId = t?.hostId ?? run.nightHost;
    const host = HOST[hostId];
    const key = t ? `${t.kind}:${t.hostId}:${t.target}:${t.hostDisabled}` : `town:${run.nightHost}:${run.night}`;
    if (key !== this.posterKey) {
      this.posterKey = key;
      const p = this.poster;
      clear(p);
      const isOutlaw = t ? t.kind === 'host' : true;
      const isGang = t?.kind === 'gang';
      const cursed = isOutlaw || isGang || t?.kind === 'bank';
      const title = t ? (t.kind === 'host' ? 'Wanted' : KIND_NAME[t.kind]) : 'Wanted';
      const face = div('poster-face');
      if (cursed) face.innerHTML = portraitOf(isOutlaw || isGang ? hostId : 'banker', 'smug');
      else face.innerHTML = `<div class="poster-icon">${iconSvg(t?.kind === 'silk' ? 'tophat' : 'saloon')}</div>`;
      if (cursed && host) tip(face, () => hostTooltip(hostId), 'right');
      const name = div('poster-name', isOutlaw || isGang ? host?.name ?? 'Outlaw' : t?.kind === 'bank' ? 'The Vault' : t?.kind === 'silk' ? 'High Rollers' : 'Saloon Regulars');
      const curse = cursed && host ? h('div', { class: 'poster-curse', html: t?.hostDisabled ? '<s>Curse lifted</s>' : fmt(host.text) }) : null;
      this.refs.target = div('poster-target-val');
      this.refs.score = div('poster-score-val', '0');
      this.refs.scoreBar = div('poster-bar-fill');
      const reward = t ? { paper: 3, silk: 5, bank: 6, gang: 4, host: 6 }[t.kind] : 6;
      p.append(
        div('poster-head', title),
        face,
        name,
        curse ?? '',
        div('poster-row', div('poster-label', t ? 'Score at least' : 'Showdown target'), this.refs.target),
        t ? div('poster-row', div('poster-label', 'Winnings'), this.refs.score) : '',
        t ? div('poster-bar', this.refs.scoreBar) : '',
        div(`poster-reward${t?.kind === 'bank' || isGang ? ' long' : ''}`, `Reward $${reward}${t?.kind === 'bank' ? ' + loot' : isGang ? ' + Bounty' : ''}`),
        (this.refs.rules = div('poster-rules')),
        div('poster-nail l'),
        div('poster-nail r'),
        div('poster-wear'),
      );
      p.className = `poster${isOutlaw ? ' outlaw' : ''}`;
      this.shownScore = t?.score ?? 0;
    }
    const target = t?.target ?? (outlawNode ? nodeTarget(run, outlawNode) : 0);
    this.refs.target.textContent = fmtNum(target);
    this.refs.target.classList.toggle('long', this.refs.target.textContent.length > 5);
    this.refs.target.classList.toggle('xlong', this.refs.target.textContent.length > 7);
    if (t) {
      const rules = getRules(run);
      this.refs.rules.textContent = `Dealer draws to ${rules.dealerStand}${rules.dealerHitSoft17 ? ' (hits soft 17)' : ''} \u00b7 Over ${rules.bustLimit} busts \u00b7 ${rules.charlieSize} cards without busting wins`;
    } else this.refs.rules.textContent = 'Beat the Outlaw to ride on to the next town';
    if (t) this.setScore(t.score, t.target);
  }

  private updateGun() {
    const run = this.run;
    const t = run.table;
    if (!t) {
      this.gun.style.display = 'none';
      return;
    }
    this.gun.style.display = '';
    const hands = t.handsLeft;
    const chambers = Math.min(8, Math.max(6, hands));
    const bullets = Array.from({ length: chambers }, (_, i) => {
      const a = (i / chambers) * Math.PI * 2 - Math.PI / 2;
      const x = 50 + Math.cos(a) * 28;
      const y = 50 + Math.sin(a) * 28;
      const full = i < hands;
      const fa = a + Math.PI / chambers;
      const fx = 50 + Math.cos(fa) * 44;
      const fy = 50 + Math.sin(fa) * 44;
      const flute = `<ellipse cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" rx="5" ry="2.6" transform="rotate(${((fa * 180) / Math.PI).toFixed(1)} ${fx.toFixed(1)} ${fy.toFixed(1)})" class="flute"/>`;
      const cell = full
        ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" class="bullet"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" class="primer"/>`
        : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" class="empty"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" class="empty-lip"/>`;
      return flute + cell;
    }).join('');
    this.gun.innerHTML = `<div class="gun-cyl"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" class="cyl"/><circle cx="50" cy="50" r="40.5" class="cyl-ring"/><path d="M18 34A36 36 0 0 1 40 14" class="cyl-shine"/><circle cx="50" cy="50" r="9" class="hub"/><circle cx="50" cy="50" r="3" class="hub-pin"/>${bullets}</svg></div>
      <div class="gun-stats"><div class="gun-stat"><span class="gun-num chips">${hands}</span><span class="gun-lbl">Hands</span></div>
      <div class="gun-stat"><span class="gun-num mult">${t.foldsLeft}</span><span class="gun-lbl">Folds</span></div></div>`;
    if (!this.gun.dataset.tip) {
      this.gun.dataset.tip = '1';
      tip(this.gun, () => '<div class="tt-title">Hands & Folds</div><div class="tt-body">Each deal uses a hand (a bullet). Folding a bad hand gives the bullet back, but folds are limited.</div>', 'right');
    }
  }

  private moneyShown: number | null = null;
  private moneyAnim = 0;
  private lastGrit: number | null = null;

  /** Count the Bucks readout to the new value, flashing green for gains and red for spending. */
  private tickMoney(to: number) {
    const el = this.refs.money;
    const from = this.moneyShown;
    this.moneyShown = to;
    cancelAnimationFrame(this.moneyAnim);
    if (from === null || from === to) {
      el.textContent = `$${to}`;
      return;
    }
    el.classList.remove('gain', 'spend');
    void el.offsetWidth;
    el.classList.add(to > from ? 'gain' : 'spend');
    const t0 = performance.now();
    const dur = Math.min(700, 180 + Math.abs(to - from) * 25);
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = `$${Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))}`;
      if (k < 1) this.moneyAnim = requestAnimationFrame(step);
    };
    this.moneyAnim = requestAnimationFrame(step);
  }

  setScore(score: number, target: number, animate = false) {
    const r = this.refs;
    if (!r.score) return;
    cancelAnimationFrame(this.scoreAnim);
    const from = this.shownScore;
    const to = score;
    const bar = () => {
      const k = Math.min(1, this.shownScore / Math.max(1, target));
      if (r.scoreBar) {
        r.scoreBar.style.width = `${k * 100}%`;
        r.scoreBar.classList.toggle('full', k >= 1);
      }
      this.poster.classList.toggle('claimed', k >= 1);
    };
    if (!animate || from === to) {
      this.shownScore = to;
      r.score.textContent = fmtNum(to);
      bar();
      return;
    }
    const start = performance.now();
    const dur = 650;
    let lastTick = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      this.shownScore = from + (to - from) * e;
      r.score.textContent = fmtNum(Math.floor(this.shownScore));
      bar();
      if (now - lastTick > 45) {
        lastTick = now;
        sfx('tick', Math.floor(k * 10));
      }
      if (k < 1) this.scoreAnim = requestAnimationFrame(step);
    };
    this.scoreAnim = requestAnimationFrame(step);
  }

  setHand(ht: HandTypeId | null, level?: number, label?: string) {
    const r = this.refs;
    const text = label ?? (ht ? HAND_TYPE[ht].name : '');
    r.handName.dataset.label = text;
    // "If it wins: Quick Draw" prints the condition as a small caption before the name plate.
    const cut = text.indexOf(': ');
    r.handName.innerHTML = cut > 0 ? `<span class="pot-pre">${esc(text.slice(0, cut))}</span><span class="pot-name">${esc(text.slice(cut + 2))}</span>` : text ? `<span class="pot-name">${esc(text)}</span>` : '';
    r.handLevel.textContent = ht && level ? `Lv.${level}` : '';
    r.handName.classList.remove('pop');
    void r.handName.offsetWidth;
    r.handName.classList.add('pop');
  }

  setCalc(chips: number, mult: number, bump?: 'chips' | 'mult') {
    const r = this.refs;
    r.chips.textContent = fmtNum(Math.floor(chips));
    r.mult.textContent = fmtMult(mult);
    // An empty pot sits back on the felt until a hand is live.
    r.calc.classList.toggle('idle', !chips && !mult);
    if (bump === 'chips') jiggle(r.chips.parentElement?.parentElement ?? null, 'bump');
    if (bump === 'mult') jiggle(r.mult.parentElement, 'bump');
    this.renderStacks(chips);
    const total = chips * mult;
    const heat = Math.max(0, Math.min(3, Math.log10(Math.max(1, total)) - 2.4));
    r.calc.style.setProperty('--heat', String(heat));
    r.calc.classList.toggle('hot', heat > 0.5);
  }

  /** Poker-chip stacks that grow with the pot (log scale). */
  private renderStacks(chips: number) {
    const el = this.refs.stacks;
    const n = chips <= 0 ? 0 : Math.min(28, Math.round(Math.log2(chips + 1) * 2.4));
    const want = `${n}`;
    if (el.dataset.n === want) return;
    el.dataset.n = want;
    // One denomination per stack, printed in the plate colours.
    const colors = ['#c8402a', '#2f5d8a', '#557a46', '#2a1408'];
    const stacks = [0, 0, 0, 0];
    for (let i = 0; i < n; i++) stacks[i % 4]++;
    el.innerHTML = stacks
      .map((cnt, s) => (cnt ? `<div class="stack s${s}" style="--c:${colors[s]}">${Array.from({ length: cnt }, (_, j) => `<span class="chip" style="--j:${j}"></span>`).join('')}</div>` : ''))
      .join('');
  }

  clearCalc() {
    this.setCalc(0, 0);
    this.setHand(null);
    this.refs.calc.classList.remove('hot', 'burning');
  }

  // -------------------------------------------------------------------------
  // Bandolier & satchel
  // -------------------------------------------------------------------------

  renderTrays() {
    const run = this.run;
    hideTip();
    clear(this.charmRow);
    clear(this.consRow);
    this.charmEls.clear();
    this.consEls.clear();
    const slots = charmSlots(run);
    run.charms.forEach((k, i) => {
      const slot = div('charm-slot');
      const card = charmCard(k.id, k.finish);
      card.dataset.uid = String(k.uid);
      if (k.disabled) card.classList.add('disabled');
      card.style.setProperty('--i', String(i));
      slot.appendChild(card);
      this.charmEls.set(k.uid, card);
      tip(card, () => charmTooltip(run, k.id, k), 'top');
      if (this.selected?.kind === 'charm' && this.selected.uid === k.uid) {
        slot.classList.add('selected');
        slot.appendChild(
          button(`Sell $${sellValue(k)}`, 'sell tiny', () => {
            sellCharm(run, k.uid);
            sfx('sell');
            this.selected = null;
            this.afterChange();
          }),
        );
      }
      this.attachDrag(card, k.uid);
      this.charmRow.appendChild(slot);
    });
    for (let i = run.charms.length; i < slots; i++) {
      const empty = div('charm-slot empty', div('loop'));
      tip(empty, () => '<div class="tt-title">Empty loop</div><div class="tt-body">Room for one more Doodad. Buy them at the General Store or win one at the Bank.</div>', 'top');
      this.charmRow.appendChild(empty);
    }
    this.charmCount.innerHTML = `Doodads<b>${run.charms.length}/${slots}</b>`;
    run.consumables.forEach((k) => {
      const slot = div('cons-slot');
      const card = consCard(k.kind, k.id, k.finish);
      card.dataset.uid = String(k.uid);
      slot.appendChild(card);
      this.consEls.set(k.uid, card);
      tip(card, () => consTooltip(run, k.kind, k.id), 'left');
      card.addEventListener('click', () => {
        this.selected = this.selected?.uid === k.uid ? null : { kind: 'cons', uid: k.uid };
        sfx('select');
        this.renderTrays();
      });
      if (this.selected?.kind === 'cons' && this.selected.uid === k.uid) {
        slot.classList.add('selected');
        const needs = consNeeds(k.id);
        const usable = this.canUse && (needs ? !run.table || run.table.phase === 'ready' : canUseCons(run, k.id, []));
        slot.appendChild(
          div(
            'cons-actions',
            button('Use', 'use tiny', () => this.useCons(k.uid), { disabled: !usable }),
            button(`Sell $${consSellValue(k.id, run)}`, 'sell tiny', () => {
              sellCons(run, k.uid);
              sfx('sell');
              this.selected = null;
              this.afterChange();
            }),
          ),
        );
      }
      this.consRow.appendChild(slot);
    });
    for (let i = run.consumables.length; i < consSlots(run); i++) this.consRow.appendChild(div('cons-slot empty'));
    this.consCount.textContent = `${run.consumables.length}/${consSlots(run)}`;
  }

  private async useCons(uid: number) {
    const run = this.run;
    const k = run.consumables.find((x) => x.uid === uid);
    if (!k) return;
    const needs = consNeeds(k.id);
    if (needs) {
      if (run.table && run.table.phase !== 'ready') {
        toast('Use card magic between hands', 'bad');
        return;
      }
      const ids = await pickTargets(run, k.id, needs);
      if (!ids) return;
      if (!useCons(run, uid, ids)) return toast('That won’t work right now', 'bad');
    } else if (!useCons(run, uid, [])) {
      return toast('That won’t work right now', 'bad');
    }
    const def = CONS[k.id];
    sfx(k.kind === 'star' ? 'levelup' : k.kind === 'mask' ? 'gong' : 'buy');
    const el = this.consEls.get(uid);
    if (el) popup(el, def?.name ?? '', 'pop-info');
    this.selected = null;
    this.afterChange();
  }

  afterChange() {
    save();
    this.renderTrays();
    this.update();
    this.onChange();
  }

  private attachDrag(card: HTMLElement, uid: number) {
    let sx = 0;
    let sy = 0;
    let dragging = false;
    let down = false;
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = (e.clientX - sx) / app.scale;
      const dy = (e.clientY - sy) / app.scale;
      if (!dragging && Math.hypot(dx, dy) > 8) {
        dragging = true;
        card.classList.add('dragging');
        hideTip();
      }
      if (dragging) card.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.03}deg) scale(1.08)`;
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (!dragging) {
        this.selected = this.selected?.uid === uid ? null : { kind: 'charm', uid };
        sfx('select');
        this.renderTrays();
        return;
      }
      dragging = false;
      card.classList.remove('dragging');
      card.style.transform = '';
      const slots = [...this.charmRow.querySelectorAll<HTMLElement>('.charm-slot:not(.empty)')];
      let to = slots.length - 1;
      for (let i = 0; i < slots.length; i++) {
        const r = slots[i].getBoundingClientRect();
        if (e.clientX < r.left + r.width / 2) {
          to = i;
          break;
        }
      }
      moveCharm(this.run, uid, to);
      sfx('deal');
      save();
      this.renderTrays();
    };
    card.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      down = true;
      sx = e.clientX;
      sy = e.clientY;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  }

  charmEl(uid: number) {
    return this.charmEls.get(uid) ?? null;
  }
  consEl(uid: number) {
    return this.consEls.get(uid) ?? null;
  }
}

export function charmName(id: string) {
  return CHARM[id]?.name ?? id;
}

export { modal };
