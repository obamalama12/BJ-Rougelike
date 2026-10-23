// Visual builders for every kind of card in the game.

import type { Card, CharmInst, ConsKind, FinishId } from '../core/types';
import { SUIT_INFO, rankLabel, isFace, INK_INFO, FINISH_INFO, SEAL_INFO, cardName, cardChips } from '../core/cards';
import { CHARM, charmText, sellValue } from '../content/charms';
import { CONS, consText } from '../content/consumables';
import { VOUCHER } from '../content/vouchers';
import { TAG } from '../content/tags';
import { HOST } from '../content/hosts';
import { PACK, SHOE } from '../content/shoes';
import { iconSvg } from './icons';
import { suitSvg, faceArt, PIPS } from './suits';
import { fmt, esc } from './dom';
import type { Run } from '../core/types';

const RARITY = ['', 'Common', 'Uncommon', 'Rare', 'Legendary'];

// ---------------------------------------------------------------------------
// Tilt / shine interaction shared by all cards
// ---------------------------------------------------------------------------

export function attachTilt(el: HTMLElement) {
  const inner = el.querySelector<HTMLElement>('.card-inner') ?? el;
  let raf = 0;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      inner.style.setProperty('--rx', `${(0.5 - y) * 22}deg`);
      inner.style.setProperty('--ry', `${(x - 0.5) * 26}deg`);
      inner.style.setProperty('--mx', `${x * 100}%`);
      inner.style.setProperty('--my', `${y * 100}%`);
    });
  });
  el.addEventListener('pointerleave', () => {
    cancelAnimationFrame(raf);
    inner.style.setProperty('--rx', '0deg');
    inner.style.setProperty('--ry', '0deg');
    inner.style.setProperty('--mx', '50%');
    inner.style.setProperty('--my', '30%');
  });
}

function shell(cls: string, front: string, back = '') {
  const el = document.createElement('div');
  el.className = `card ${cls}`;
  el.innerHTML = `<div class="card-inner"><div class="face front">${front}<div class="shine"></div><div class="finish-layer"></div></div>${back ? `<div class="face back">${back}</div>` : ''}</div>`;
  attachTilt(el);
  return el;
}

// ---------------------------------------------------------------------------
// Playing cards
// ---------------------------------------------------------------------------

export function cardBackHtml(shoeId: string): string {
  const shoe = SHOE[shoeId];
  return `<div class="cback back-${shoe?.back ?? 'red'}" style="--bk:${shoe?.hue ?? '#e2382b'}">
    <div class="cback-frame"><div class="cback-pattern"></div>
    <div class="cback-emblem">${iconSvg('lantern')}</div></div></div>`;
}

export function playingCardFront(c: Card): string {
  if (c.ink === 'stone') {
    return `<div class="pc-body stone"><div class="stone-art">${iconSvg('mountain')}</div>${sealHtml(c)}</div>`;
  }
  const s = SUIT_INFO[c.suit];
  const color = c.ink === 'spirit' ? '#8de8d0' : s.ink;
  const lbl = rankLabel(c.rank);
  const corner = `<div class="pc-corner"><span class="pc-rank">${lbl}</span>${suitSvg(c.suit)}</div>`;
  let art: string;
  if (c.rank >= 11 && c.rank <= 13) {
    art = `<div class="pc-art face">${faceArt(c.rank as 11 | 12 | 13, s.color, s.ink)}</div>`;
  } else if (c.rank === 14) {
    art = `<div class="pc-art ace"><div class="enso"></div>${suitSvg(c.suit, 'ace-suit')}</div>`;
  } else {
    const pips = PIPS[c.rank] ?? [];
    art = `<div class="pc-art pips">${pips
      .map(([x, y, flip]) => `<span class="pip${flip ? ' flip' : ''}" style="left:${x}%;top:${y}%">${suitSvg(c.suit)}</span>`)
      .join('')}</div>`;
  }
  return `<div class="pc-body ink-${c.ink ?? 'none'}" style="--suit:${color};--suit-light:${s.color}">
    ${corner}${art}<div class="pc-corner br">${`<span class="pc-rank">${lbl}</span>`}${suitSvg(c.suit)}</div>
    ${c.ink ? `<div class="ink-badge">${inkGlyph(c.ink)}</div>` : ''}${sealHtml(c)}</div>`;
}

function inkGlyph(ink: string): string {
  const map: Record<string, string> = { jade: 'leaf', crimson: 'flame', gilded: 'coin', glass: 'crystal', lucky: 'clover', spirit: 'ghost', ash: 'smoke' };
  return map[ink] ? iconSvg(map[ink]) : '';
}

function sealHtml(c: Card): string {
  if (!c.seal) return '';
  return `<div class="wax-seal seal-${c.seal}" style="--seal:${SEAL_INFO[c.seal].color}">${iconSvg('stamp')}</div>`;
}

export function playingCard(c: Card, shoeId: string, faceDown = false): HTMLElement {
  const el = shell(`pcard${c.finish ? ` fin-${c.finish}` : ''}${faceDown ? ' down' : ''}`, playingCardFront(c), cardBackHtml(shoeId));
  el.dataset.id = String(c.id);
  return el;
}

export function cardTooltip(c: Card, debuffed = false): string {
  const lines: string[] = [];
  lines.push(`<div class="tt-title">${esc(cardName(c))}</div>`);
  const val = c.ink === 'stone' ? 0 : c.rank === 14 ? '1 or 11' : isFace(c) ? 10 : c.rank;
  lines.push(`<div class="tt-body">Worth <span class="t-hl">${val}</span> · ${fmt(`{c:+${cardChips(c)}} Chips`)}</div>`);
  if (c.ink) lines.push(`<div class="tt-sub"><b>${INK_INFO[c.ink].name}</b><br>${fmt(INK_INFO[c.ink].text)}</div>`);
  if (c.finish) lines.push(`<div class="tt-sub"><b>${FINISH_INFO[c.finish].name}</b><br>${fmt(FINISH_INFO[c.finish].text)}</div>`);
  if (c.seal) lines.push(`<div class="tt-sub"><b>${SEAL_INFO[c.seal].name}</b><br>${fmt(SEAL_INFO[c.seal].text)}</div>`);
  if (debuffed) lines.push(`<div class="tt-sub bad">Debuffed: this card does not score</div>`);
  return lines.join('');
}

// ---------------------------------------------------------------------------
// Charms
// ---------------------------------------------------------------------------

export function charmFront(id: string): string {
  const d = CHARM[id];
  if (!d) return '';
  return `<div class="ch-body r${d.rarity}" style="--hue:${d.hue}">
    <div class="ch-rays"></div>
    <div class="ch-art">${iconSvg(d.icon)}</div>
    <div class="ch-name">${esc(d.name)}</div>
    <div class="ch-gem"></div>
  </div>`;
}

export function charmCard(id: string, finish?: FinishId): HTMLElement {
  const el = shell(`charm${finish ? ` fin-${finish}` : ''}`, charmFront(id));
  el.dataset.charm = id;
  return el;
}

export function charmTooltip(run: Run | null, id: string, inst?: CharmInst, extra = ''): string {
  const d = CHARM[id];
  if (!d) return '';
  const text = inst && run ? charmText(inst, run) : typeof d.text === 'function' ? d.text({ uid: 0, id, state: d.init ? d.init() : {} }, run ?? fakeRun()) : d.text;
  const fin = inst?.finish;
  return `<div class="tt-title">${esc(d.name)}</div>
    <div class="tt-body">${fmt(text)}</div>
    ${fin ? `<div class="tt-sub"><b>${FINISH_INFO[fin].name}</b>: ${fmt(FINISH_INFO[fin].charmText)}</div>` : ''}
    ${inst?.disabled ? '<div class="tt-sub bad">Disabled by the Host</div>' : ''}
    <div class="tt-tags"><span class="tag-rarity r${d.rarity}">${RARITY[d.rarity]}</span>${inst ? `<span class="tag-sell">Sells for $${sellValue(inst)}</span>` : ''}${extra}</div>`;
}

let _fake: Run | null = null;
function fakeRun(): Run {
  if (_fake) return _fake;
  _fake = {
    money: 0, charms: [], deck: [], handLevels: {} as Run['handLevels'], handPlays: {} as Run['handPlays'], stats: { uniqueStars: [], fortunesUsed: 0, tablesSkipped: 0, glassShattered: 0 } as unknown as Run['stats'],
    rotating: { rank: 7, suit: 'moon', suit2: 'flame' }, table: null, flags: {}, baseCharmSlots: 5, lastCons: null,
  } as unknown as Run;
  for (const k of ['sevens', 'royal', 'flush', 'blackjack', 'charlie', 'twentyone', 'underdog', 'outdraw', 'dealerbust', 'push']) (_fake.handLevels as any)[k] = 1;
  return _fake;
}

// ---------------------------------------------------------------------------
// Consumables
// ---------------------------------------------------------------------------

export function consFront(kind: ConsKind, id: string): string {
  const d = CONS[id];
  if (!d) return '';
  const deco =
    kind === 'star'
      ? `<svg class="cs-stars" viewBox="0 0 100 140">${constellationDots(id)}</svg>`
      : kind === 'fortune'
        ? `<div class="fs-stamp">${iconSvg('stamp')}</div><div class="fs-lines"></div>`
        : `<div class="ms-glow"></div>`;
  return `<div class="cs-body cs-${kind}" style="--hue:${d.hue}">${deco}
    <div class="cs-art">${iconSvg(d.icon)}</div>
    <div class="cs-name">${esc(d.name)}</div></div>`;
}

function constellationDots(seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => ((h = (h * 1103515245 + 12345) >>> 0) / 4294967296);
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) pts.push([12 + rnd() * 76, 14 + rnd() * 60]);
  let s = `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="currentColor" stroke-width=".8" opacity=".55"/>`;
  for (const [x, y] of pts) s += `<circle cx="${x}" cy="${y}" r="${1.4 + rnd() * 1.6}" fill="currentColor"/>`;
  return s;
}

export function consCard(kind: ConsKind, id: string, finish?: FinishId): HTMLElement {
  const el = shell(`cons cons-${kind}${finish ? ` fin-${finish}` : ''}`, consFront(kind, id));
  el.dataset.cons = id;
  return el;
}

const KIND_LABEL: Record<ConsKind, string> = { fortune: 'Fortune', star: 'Constellation', mask: 'Mask' };

export function consTooltip(run: Run | null, kind: ConsKind, id: string, extra = ''): string {
  const d = CONS[id];
  if (!d) return '';
  return `<div class="tt-title">${esc(d.name)}</div>
    <div class="tt-body">${fmt(consText(id, run ?? fakeRun()))}</div>
    <div class="tt-tags"><span class="tag-kind k-${kind}">${KIND_LABEL[kind]}</span>${extra}</div>`;
}

// ---------------------------------------------------------------------------
// Relics (vouchers), bundles, tokens, hosts
// ---------------------------------------------------------------------------

export function voucherCard(id: string): HTMLElement {
  const v = VOUCHER[id];
  const el = shell('relic', `<div class="rl-body${v?.requires ? ' tier2' : ''}"><div class="rl-ring"></div><div class="rl-art">${iconSvg(v?.icon ?? 'torii')}</div><div class="rl-name">${esc(v?.name ?? id)}</div></div>`);
  el.dataset.voucher = id;
  return el;
}

export function voucherTooltip(id: string, extra = ''): string {
  const v = VOUCHER[id];
  if (!v) return '';
  return `<div class="tt-title">${esc(v.name)}</div><div class="tt-body">${fmt(v.text)}</div>
    <div class="tt-tags"><span class="tag-kind k-relic">Relic</span>${v.requires ? `<span class="tag-sub">Upgrade of ${esc(VOUCHER[v.requires]?.name ?? '')}</span>` : ''}${extra}</div>`;
}

const PACK_ICON: Record<string, string> = { charm: 'lantern', fortune: 'scroll', star: 'star', mask: 'oni', card: 'cards' };
const PACK_HUE: Record<string, string> = { charm: '#ff8a3d', fortune: '#c9b8ff', star: '#7fb8ff', mask: '#b04dff', card: '#f7ecd2' };

export function packCard(packId: string): HTMLElement {
  const p = PACK[packId];
  const el = shell(`pack pack-${p.kind} tier-${p.tier}`, `<div class="pk-body" style="--hue:${PACK_HUE[p.kind]}">
    <div class="pk-flap"></div><div class="pk-knot"></div>
    <div class="pk-art">${iconSvg(PACK_ICON[p.kind])}</div>
    <div class="pk-name">${esc(p.name)}</div></div>`);
  el.dataset.pack = packId;
  return el;
}

export function packTooltip(packId: string, extra = ''): string {
  const p = PACK[packId];
  const what: Record<string, string> = { charm: 'Charms', fortune: 'Fortunes', star: 'Constellations', mask: 'Masks', card: 'playing cards' };
  return `<div class="tt-title">${esc(p.name)}</div><div class="tt-body">Choose ${fmt(`{g:${p.picks}}`)} of up to ${fmt(`{g:${p.size}}`)} ${what[p.kind]}${p.kind === 'card' ? ' to add to your deck' : p.kind === 'charm' ? '' : ' to use immediately'}</div>
    <div class="tt-tags"><span class="tag-kind k-pack">Bundle</span>${extra}</div>`;
}

export function tagToken(id: string): HTMLElement {
  const t = TAG[id];
  const el = document.createElement('div');
  el.className = 'token';
  el.style.setProperty('--hue', t?.hue ?? '#ffd27a');
  el.innerHTML = `<div class="token-inner">${iconSvg(t?.icon ?? 'coin')}</div>`;
  el.dataset.tag = id;
  return el;
}

export function tagTooltip(id: string): string {
  const t = TAG[id];
  if (!t) return '';
  return `<div class="tt-title">${esc(t.name)}</div><div class="tt-body">${fmt(t.text)}</div><div class="tt-tags"><span class="tag-kind k-tag">Token</span></div>`;
}

export function hostMedallion(id: string, size = 'md'): HTMLElement {
  const host = HOST[id];
  const el = document.createElement('div');
  el.className = `host-med host-${size}${host?.showdown ? ' showdown' : ''}`;
  el.style.setProperty('--hue', host?.hue ?? '#ff3d3d');
  el.innerHTML = `<div class="hm-ring"></div><div class="hm-art">${iconSvg(host?.icon ?? 'oni')}</div>`;
  return el;
}

export function hostTooltip(id: string): string {
  const host = HOST[id];
  if (!host) return '';
  return `<div class="tt-title">${esc(host.name)}</div><div class="tt-sub2">${esc(host.title)}</div><div class="tt-body">${fmt(host.text)}</div>
    <div class="tt-tags"><span class="tag-kind k-host">${host.showdown ? 'Showdown Host' : 'Host'}</span><span class="tag-sub">Target X${host.scale}</span></div>`;
}

export function shoeCard(id: string): HTMLElement {
  const el = shell('pcard shoe-card', `<div class="pc-body"></div>`, cardBackHtml(id));
  el.classList.add('down');
  return el;
}
