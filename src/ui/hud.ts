// The persistent HUD: left sidebar and the Charm / consumable trays.

import type { Run, HandTypeId } from '../core/types';
import { HAND_TYPE } from '../core/cards';
import { CHARM, sellValue } from '../content/charms';
import { CONS, consSellValue } from '../content/consumables';
import { HOST } from '../content/hosts';
import { app, button, jiggle, modal, popup, save, tip, toast, hideTip } from './app';
import { charmCard, charmTooltip, consCard, consTooltip, hostMedallion, hostTooltip, tagToken, tagTooltip } from './art';
import { h, div, fmtNum, fmtMult, clear } from './dom';
import { charmSlots, consSlots, nightBase, NIGHTS, tableTarget } from '../game/engine';
import { canUseCons, consNeeds, moveCharm, sellCharm, sellCons, useCons } from '../game/shop';
import { sfx } from '../fx/audio';
import { openRunInfo } from './screens/runinfo';
import { openOptions } from './screens/options';
import { pickTargets } from './picker';

export class Hud {
  el: HTMLElement;
  side: HTMLElement;
  tray: HTMLElement;
  charmRow: HTMLElement;
  consRow: HTMLElement;
  charmCount: HTMLElement;
  consCount: HTMLElement;
  refs: Record<string, HTMLElement> = {};
  charmEls = new Map<number, HTMLElement>();
  consEls = new Map<number, HTMLElement>();
  selected: { kind: 'charm' | 'cons'; uid: number } | null = null;
  onChange: () => void = () => {};
  /** Can consumables be used right now? */
  canUse = true;
  private shownChips = 0;
  private shownMult = 0;
  private shownScore = 0;
  private scoreAnim = 0;

  constructor() {
    this.el = div('hud');
    this.side = div('sidebar');
    this.tray = div('trays');
    this.charmRow = div('charm-row');
    this.consRow = div('cons-row');
    this.charmCount = div('tray-count');
    this.consCount = div('tray-count');
    this.tray.append(
      div('tray charms-tray', this.charmRow, this.charmCount),
      div('tray cons-tray', this.consRow, this.consCount),
    );
    this.buildSide();
    this.el.append(this.side, this.tray);
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

  private buildSide() {
    const r = this.refs;
    r.banner = div('sb-banner');
    r.bannerName = div('sb-banner-name');
    r.bannerSub = div('sb-banner-sub');
    r.bannerIcon = div('sb-banner-icon');
    r.banner.append(r.bannerIcon, div('sb-banner-text', r.bannerName, r.bannerSub));
    r.target = div('sb-target-val');
    r.reward = div('sb-reward');
    const targetBox = div('sb-box sb-target', div('sb-label', 'Score at least'), r.target, r.reward);
    r.score = div('sb-score-val', '0');
    r.scoreBar = div('sb-score-bar-fill');
    const scoreBox = div('sb-box sb-score', div('sb-label', 'Lantern light'), r.score, div('sb-score-bar', r.scoreBar));
    r.handName = div('sb-hand-name', ' ');
    r.handLevel = div('sb-hand-level');
    r.chips = div('sb-chips', '0');
    r.mult = div('sb-mult', '0');
    r.calc = div('sb-calc', div('sb-chips-box', r.chips), div('sb-x', '×'), div('sb-mult-box', r.mult));
    const handBox = div('sb-box sb-hand', div('sb-hand-head', r.handName, r.handLevel), r.calc);
    r.hands = div('sb-stat-val chips');
    r.folds = div('sb-stat-val mult');
    r.money = div('sb-money-val');
    r.night = div('sb-stat-val');
    r.table = div('sb-stat-val');
    const stats = div(
      'sb-stats',
      div('sb-stat', div('sb-label', 'Hands'), r.hands),
      div('sb-stat', div('sb-label', 'Folds'), r.folds),
      div('sb-stat wide money', div('sb-label', 'Embers'), r.money),
      div('sb-stat', div('sb-label', 'Night'), r.night),
      div('sb-stat', div('sb-label', 'Table'), r.table),
    );
    r.tags = div('sb-tags');
    const btns = div(
      'sb-buttons',
      button('Run Info', 'small ghost', () => openRunInfo()),
      button('Options', 'small ghost', () => openOptions()),
    );
    this.side.append(r.banner, targetBox, scoreBox, handBox, stats, r.tags, btns);
  }

  /** Refresh every number on the sidebar. */
  update() {
    const run = this.run;
    const r = this.refs;
    const t = run.table;
    const idx = run.phase === 'select' ? run.tableStatus.findIndex((s) => s === 'open') : run.tableIdx;
    const kind = t?.kind ?? (idx === 2 ? 'host' : idx === 1 ? 'silk' : 'paper');
    r.banner.className = `sb-banner kind-${kind}`;
    clear(r.bannerIcon);
    if (kind === 'host') {
      const med = hostMedallion(t?.hostId ?? run.nightHost, 'sm');
      tip(med, () => hostTooltip(t?.hostId ?? run.nightHost), 'right');
      r.bannerIcon.appendChild(med);
      const host = HOST[t?.hostId ?? run.nightHost];
      r.bannerName.textContent = host?.name ?? 'Host';
      r.bannerSub.innerHTML = t?.hostDisabled ? '<s>Curse lifted</s>' : host?.title ?? '';
    } else {
      r.bannerIcon.innerHTML = `<div class="lantern-ico ${kind}"></div>`;
      r.bannerName.textContent = kind === 'silk' ? 'Silk Lantern' : 'Paper Lantern';
      r.bannerSub.textContent = run.phase === 'shop' ? 'The Night Market' : t ? 'In play' : 'Choose your table';
    }
    if (run.phase === 'shop') {
      r.banner.className = 'sb-banner kind-shop';
      r.bannerIcon.innerHTML = `<div class="lantern-ico shop"></div>`;
      r.bannerName.textContent = 'Tanuki’s Stall';
    }
    const target = t?.target ?? (idx >= 0 ? tableTarget(run, idx) : nightBase(run));
    r.target.textContent = fmtNum(target);
    r.reward.innerHTML = t ? `Reward: <span class="t-money">${'$'.repeat(Math.max(0, kind === 'host' ? 5 : kind === 'silk' ? 4 : run.stake >= 2 ? 0 : 3))}</span>` : '';
    this.setScore(t?.score ?? 0, target);
    r.hands.textContent = String(t?.handsLeft ?? '-');
    r.folds.textContent = String(t?.foldsLeft ?? '-');
    r.money.textContent = `$${run.money}`;
    r.money.classList.toggle('neg', run.money < 0);
    r.night.innerHTML = `${run.night}<small>/${NIGHTS}</small>`;
    r.table.innerHTML = `${Math.max(1, idx + 1)}<small>/3</small>`;
    clear(r.tags);
    for (const tg of run.tags) {
      const tk = tagToken(tg.id);
      tip(tk, () => tagTooltip(tg.id), 'right');
      r.tags.appendChild(tk);
    }
  }

  setScore(score: number, target: number, animate = false) {
    const r = this.refs;
    cancelAnimationFrame(this.scoreAnim);
    const from = this.shownScore;
    const to = score;
    const bar = () => {
      const k = Math.min(1, this.shownScore / Math.max(1, target));
      r.scoreBar.style.width = `${k * 100}%`;
      r.scoreBar.classList.toggle('full', k >= 1);
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
    r.handName.textContent = label ?? (ht ? HAND_TYPE[ht].name : ' ');
    r.handLevel.textContent = ht && level ? `Lv.${level}` : '';
    r.handName.classList.remove('pop');
    void r.handName.offsetWidth;
    r.handName.classList.add('pop');
  }

  setCalc(chips: number, mult: number, bump?: 'chips' | 'mult') {
    const r = this.refs;
    this.shownChips = chips;
    this.shownMult = mult;
    r.chips.textContent = fmtNum(Math.floor(chips));
    r.mult.textContent = fmtMult(mult);
    if (bump === 'chips') jiggle(r.chips.parentElement, 'bump');
    if (bump === 'mult') jiggle(r.mult.parentElement, 'bump');
    const total = chips * mult;
    const heat = Math.max(0, Math.min(3, Math.log10(Math.max(1, total)) - 2.4));
    r.calc.style.setProperty('--heat', String(heat));
    r.calc.classList.toggle('hot', heat > 0.5);
  }

  clearCalc() {
    this.setCalc(0, 0);
    this.setHand(null);
    this.refs.calc.classList.remove('hot', 'burning');
  }

  // -------------------------------------------------------------------------
  // Trays
  // -------------------------------------------------------------------------

  renderTrays() {
    const run = this.run;
    hideTip();
    clear(this.charmRow);
    clear(this.consRow);
    this.charmEls.clear();
    this.consEls.clear();
    run.charms.forEach((k, i) => {
      const slot = div('charm-slot');
      const card = charmCard(k.id, k.finish);
      card.dataset.uid = String(k.uid);
      if (k.disabled) card.classList.add('disabled');
      card.style.setProperty('--i', String(i));
      slot.appendChild(card);
      this.charmEls.set(k.uid, card);
      tip(card, () => charmTooltip(run, k.id, k), 'bottom');
      const sel = this.selected?.kind === 'charm' && this.selected.uid === k.uid;
      if (sel) {
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
    this.charmCount.textContent = `${run.charms.length}/${charmSlots(run)}`;
    run.consumables.forEach((k) => {
      const slot = div('cons-slot');
      const card = consCard(k.kind, k.id, k.finish);
      card.dataset.uid = String(k.uid);
      slot.appendChild(card);
      this.consEls.set(k.uid, card);
      tip(card, () => consTooltip(run, k.kind, k.id), 'bottom');
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
      if (!useCons(run, uid, ids)) return toast('Cannot use that now', 'bad');
    } else if (!useCons(run, uid, [])) {
      return toast('Cannot use that now', 'bad');
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
      // Find the new index from the drop x position.
      const slots = [...this.charmRow.children] as HTMLElement[];
      let to = slots.length - 1;
      for (let i = 0; i < slots.length; i++) {
        const r = slots[i].getBoundingClientRect();
        if (e.clientX < r.left + r.width / 2) {
          to = i;
          break;
        }
      }
      const from = this.run.charms.findIndex((k) => k.uid === uid);
      if (to > from) to = Math.max(from, to - (e.clientX < slots[to].getBoundingClientRect().right ? 0 : 0));
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
