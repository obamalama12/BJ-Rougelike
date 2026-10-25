// App shell: the scaled stage, tooltips, modals, popups and timing helpers.

import type { Run } from '../core/types';
import { profile, saveRun } from './profile';
import { audio, sfx } from '../fx/audio';
import { particles } from '../fx/particles';
import { h, div, clear } from './dom';

export const W = 1600;
export const H = 900;

export const app = {
  run: null as Run | null,
  root: null as unknown as HTMLElement,
  stage: null as unknown as HTMLElement,
  screen: null as unknown as HTMLElement,
  popups: null as unknown as HTMLElement,
  modalLayer: null as unknown as HTMLElement,
  tip: null as unknown as HTMLElement,
  scale: 1,
  busy: false,
  /** Router hook set by main.ts */
  render: () => {},
};

export function mountShell(root: HTMLElement) {
  app.root = root;
  const stage = div('stage');
  stage.style.width = `${W}px`;
  stage.style.height = `${H}px`;
  app.stage = stage;
  app.screen = div('screen');
  app.popups = div('popups');
  app.modalLayer = div('modal-layer');
  stage.append(app.screen, app.popups, app.modalLayer);
  root.appendChild(stage);
  app.tip = div('tooltip');
  document.body.appendChild(app.tip);
  const fit = () => {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    app.scale = s;
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
    document.documentElement.style.setProperty('--ui-scale', String(s));
  };
  window.addEventListener('resize', fit);
  fit();
  document.addEventListener('pointerdown', () => audio.unlock(), { capture: true });
  document.addEventListener('keydown', () => audio.unlock(), { capture: true });
}

export function save() {
  saveRun(app.run);
}

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

export function speed(): number {
  return profile.settings.speed;
}

export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms / speed()));
}

export function nextFrame(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

// ---------------------------------------------------------------------------
// Coordinates & popups
// ---------------------------------------------------------------------------

export function stagePos(el: Element): { x: number; y: number; w: number; h: number } {
  const r = el.getBoundingClientRect();
  const s = app.stage.getBoundingClientRect();
  return { x: (r.left - s.left) / app.scale, y: (r.top - s.top) / app.scale, w: r.width / app.scale, h: r.height / app.scale };
}

export function center(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function popup(target: Element | { x: number; y: number }, text: string, cls = '', opts: { dy?: number; above?: boolean } = {}) {
  let x: number;
  let y: number;
  if (target instanceof Element) {
    const p = stagePos(target);
    x = p.x + p.w / 2;
    y = opts.above === false ? p.y + p.h + 10 : p.y - 6 + (opts.dy ?? 0);
  } else {
    x = target.x;
    y = target.y;
  }
  const el = div(`popup ${cls}`, text);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  app.popups.appendChild(el);
  setTimeout(() => el.remove(), 1600 / Math.min(2, speed()));
  return el;
}

export function jiggle(el: Element | null, cls = 'jiggle') {
  if (!el) return;
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 450);
}

export function screenShake(power = 1) {
  if (!profile.settings.shake || !profile.settings.motion) return;
  const el = app.stage;
  const s = app.scale;
  const start = performance.now();
  const dur = 260 + power * 80;
  const step = (now: number) => {
    const k = (now - start) / dur;
    if (k >= 1) {
      el.style.transform = `translate(-50%, -50%) scale(${s})`;
      return;
    }
    const a = (1 - k) * 7 * power;
    el.style.transform = `translate(calc(-50% + ${(Math.random() - 0.5) * a}px), calc(-50% + ${(Math.random() - 0.5) * a}px)) scale(${s}) rotate(${(Math.random() - 0.5) * a * 0.05}deg)`;
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function burstAt(el: Element, opts: Parameters<typeof particles.burst>[2] = {}) {
  const c = center(el);
  particles.burst(c.x, c.y, opts);
}

// ---------------------------------------------------------------------------
// Tooltips
// ---------------------------------------------------------------------------

let tipOwner: Element | null = null;

// Touch screens have no hover, so holding a finger on something for a moment shows its tooltip
// instead. The tooltip stays up after the finger lifts and closes on the next touch, and the tap
// that ends the hold is swallowed so holding a Doodad or a shop item never buys or selects it.
const HOLD_MS = 380;
let holdTimer = 0;
let heldOpen = false;
/** True between a hold opening a tooltip and the tap that ends it (for handlers that act on release). */
export function endingHold(): boolean {
  return heldOpen;
}
document.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') return;
  heldOpen = false;
  if (tipOwner) hideTip();
}, { capture: true });
document.addEventListener('click', (e) => {
  if (!heldOpen) return;
  heldOpen = false;
  e.preventDefault();
  e.stopImmediatePropagation();
}, { capture: true });
// No long-press menus or text callouts over the game.
document.addEventListener('contextmenu', (e) => {
  if ((e.target as Element | null)?.closest?.('.stage')) e.preventDefault();
});

export function tip(el: HTMLElement, content: () => string, side: 'top' | 'bottom' | 'right' | 'left' = 'top') {
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    tipOwner = el;
    showTip(el, content(), side);
    sfx('hover');
  });
  el.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'touch') return;
    if (tipOwner === el) hideTip();
  });
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') {
      if (tipOwner === el) hideTip();
      return;
    }
    const sx = e.clientX;
    const sy = e.clientY;
    const cancel = () => {
      clearTimeout(holdTimer);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', cancel);
      el.removeEventListener('pointercancel', cancel);
    };
    const onMove = (m: PointerEvent) => {
      if (Math.hypot(m.clientX - sx, m.clientY - sy) > 10) cancel();
    };
    clearTimeout(holdTimer);
    holdTimer = window.setTimeout(() => {
      cancel();
      if (!el.isConnected) return;
      tipOwner = el;
      heldOpen = true;
      showTip(el, content(), side);
      sfx('hover');
      navigator.vibrate?.(8);
    }, HOLD_MS);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', cancel);
    el.addEventListener('pointercancel', cancel);
  });
}

export function showTip(el: Element, htmlStr: string, side: 'top' | 'bottom' | 'right' | 'left' = 'top') {
  if (!htmlStr) return;
  const t = app.tip;
  t.innerHTML = htmlStr;
  t.className = 'tooltip show';
  const r = el.getBoundingClientRect();
  const tw = t.offsetWidth;
  const th = t.offsetHeight;
  let x = r.left + r.width / 2 - tw / 2;
  let y = side === 'bottom' ? r.bottom + 10 : r.top - th - 10;
  if (side === 'right') {
    x = r.right + 12;
    y = r.top + r.height / 2 - th / 2;
  }
  if (side === 'left') {
    x = r.left - tw - 12;
    y = r.top + r.height / 2 - th / 2;
  }
  if (y < 6) y = r.bottom + 10;
  if (y + th > window.innerHeight - 6) y = Math.max(6, r.top - th - 10);
  x = Math.max(6, Math.min(window.innerWidth - tw - 6, x));
  t.style.left = `${x}px`;
  t.style.top = `${y}px`;
}

export function hideTip() {
  tipOwner = null;
  app.tip.className = 'tooltip';
}

export function refreshTip() {
  if (tipOwner && !document.body.contains(tipOwner)) hideTip();
}

// ---------------------------------------------------------------------------
// Modals & toasts
// ---------------------------------------------------------------------------

/** Close functions of open dismissable modals, newest last (Escape closes the top one). */
const modalStack: (() => void)[] = [];
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !modalStack.length) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  modalStack[modalStack.length - 1]();
});

export function modal(content: HTMLElement, opts: { onClose?: () => void; cls?: string; dismissable?: boolean } = {}) {
  const back = div(`modal-back ${opts.cls ?? ''}`);
  back.setAttribute('role', 'dialog');
  const box = div('modal-box', content);
  back.appendChild(box);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    const i = modalStack.indexOf(close);
    if (i >= 0) modalStack.splice(i, 1);
    back.classList.add('closing');
    setTimeout(() => back.remove(), 200);
    opts.onClose?.();
  };
  if (opts.dismissable !== false) {
    modalStack.push(close);
    back.addEventListener('pointerdown', (e) => {
      if (e.target === back) close();
    });
  }
  app.modalLayer.appendChild(back);
  hideTip();
  return close;
}

/** A modal header: the title printed on a cream plate between engraved rules. */
export function modalTitle(cls: string, text: string): HTMLElement {
  return div(`${cls} m-title`, h('span', { class: 'm-plate' }, text));
}

/** A row of keycaps with labels, e.g. [['H', 'Hit'], ['Space', 'Deal']]. */
export function keyHint(cls: string, keys: [string, string][]): HTMLElement {
  return div(`${cls} key-hint`, ...keys.map(([k, label]) => h('span', { class: 'kh' }, h('kbd', null, k), label)));
}

export function closeAllModals() {
  modalStack.length = 0;
  clear(app.modalLayer);
}

export function toast(text: string, tone: 'bad' | 'good' | 'info' = 'info') {
  const el = div(`toast ${tone}`, text);
  app.popups.appendChild(el);
  setTimeout(() => el.classList.add('out'), 1400);
  setTimeout(() => el.remove(), 1800);
  if (tone === 'bad') sfx('error');
}

export function button(label: string, cls: string, onClick: () => void, opts: { disabled?: boolean; title?: string; sub?: string } = {}) {
  const b = h('button', { class: `btn ${cls}`, disabled: opts.disabled, type: 'button' }, h('span', { class: 'btn-label' }, label), opts.sub ? h('span', { class: 'btn-sub' }, opts.sub) : null);
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    if (b.disabled || app.busy) return;
    sfx('click');
    onClick();
  });
  b.addEventListener('pointerenter', () => sfx('hover'));
  if (opts.title) b.title = opts.title;
  return b;
}
