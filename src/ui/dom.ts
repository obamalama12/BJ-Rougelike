// Tiny DOM helpers and rich-text formatting.

import { SUIT_INFO, HAND_TYPE } from '../core/cards';
import type { HandTypeId, Suit } from '../core/types';

type Child = Node | string | number | null | undefined | false | Child[];
type Attrs = Record<string, any>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs | null = null, ...kids: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  append(el, kids);
  return el;
}

function append(el: Element, kids: Child[]) {
  for (const k of kids) {
    if (k === null || k === undefined || k === false) continue;
    if (Array.isArray(k)) append(el, k);
    else if (k instanceof Node) el.appendChild(k);
    else el.appendChild(document.createTextNode(String(k)));
  }
}

export function div(cls: string, ...kids: Child[]) {
  return h('div', { class: cls }, ...kids);
}

export function clear(el: Element) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function html(s: string): DocumentFragment {
  const t = document.createElement('template');
  t.innerHTML = s;
  return t.content;
}

export function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/** Convert {c:..} {m:..} {x:..} {$:..} {g:..} {s:suit} {h:hand} {r:..} {d:..} markup to HTML. */
export function fmt(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '{') {
      // find matching close brace (supports nesting)
      let depth = 1;
      let j = i + 1;
      while (j < text.length && depth > 0) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        j++;
      }
      const inner = text.slice(i + 1, j - 1);
      const colon = inner.indexOf(':');
      if (colon > 0) {
        const tag = inner.slice(0, colon);
        const body = inner.slice(colon + 1);
        out += token(tag, body);
        i = j;
        continue;
      }
    }
    out += esc(ch);
    i++;
  }
  return out;
}

function token(tag: string, body: string): string {
  switch (tag) {
    case 'c':
      return `<span class="t-chips">${fmt(body)}</span>`;
    case 'm':
      return `<span class="t-mult">${fmt(body)}</span>`;
    case 'x':
      return `<span class="t-xmult">${fmt(body)}</span>`;
    case '$':
      return `<span class="t-money">${body.startsWith('-') ? '-' : ''}$${esc(body.replace(/^-/, ''))}</span>`;
    case 'g':
      return `<span class="t-hl">${fmt(body)}</span>`;
    case 'r':
      return `<span class="t-bad">${fmt(body)}</span>`;
    case 'd':
      return `<span class="t-dim">${fmt(body)}</span>`;
    case 's': {
      const s = SUIT_INFO[body as Suit];
      if (!s) return esc(body);
      return `<span class="t-suit" style="color:${s.color}">${s.plural}</span>`;
    }
    case 'h': {
      const ht = HAND_TYPE[body as HandTypeId];
      return `<span class="t-hand">${ht ? ht.name : esc(body)}</span>`;
    }
    default:
      return esc(body);
  }
}

export function fmtNum(n: number): string {
  if (!isFinite(n)) return '∞';
  const a = Math.abs(n);
  if (a >= 1e11) {
    const e = Math.floor(Math.log10(a));
    return `${(n / Math.pow(10, e)).toFixed(2)}e${e}`;
  }
  if (a >= 100 || Number.isInteger(n)) return Math.round(n).toLocaleString('en-US');
  if (a >= 10) return n.toFixed(1).replace(/\.0$/, '');
  return (Math.round(n * 100) / 100).toString();
}

export function fmtMult(n: number): string {
  if (n >= 1e6) return fmtNum(n);
  if (Number.isInteger(n)) return String(n);
  if (n >= 100) return Math.round(n).toLocaleString('en-US');
  return (Math.round(n * 10) / 10).toString();
}

export function on<K extends keyof HTMLElementEventMap>(el: EventTarget, ev: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions) {
  el.addEventListener(ev, fn as EventListener, opts);
  return () => el.removeEventListener(ev, fn as EventListener, opts);
}
