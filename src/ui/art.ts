// Visual builders for every kind of card in the game.

import type { Card, CharmInst, ConsKind, FinishId, Suit } from '../core/types';
import { SUIT_INFO, rankLabel, isFace, INK_INFO, FINISH_INFO, SEAL_INFO, cardName, cardChips } from '../core/cards';
import { CHARM, charmText, sellValue } from '../content/charms';
import { CONS, consText } from '../content/consumables';
import { VOUCHER } from '../content/vouchers';
import { TAG } from '../content/tags';
import { HOST } from '../content/hosts';
import { PACK, SHOE } from '../content/shoes';
import { iconSvg } from './icons';
import { suitSvg, suitInner, faceArt, PIPS, PRINT, mixHex, halftone } from './suits';
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

/** Print colours per suit: plate colour and a deeper shade for the corner index. */
const SUIT_PRINT: Record<Suit, { col: string; deep: string }> = {
  moon: { col: '#33679e', deep: '#1d3f69' }, // denim
  flame: { col: '#d6432a', deep: '#a2271a' }, // vermilion
  leaf: { col: '#5a8a4a', deep: '#33602b' }, // sage / cactus
  bell: { col: '#d99d22', deep: '#86580a' }, // mustard / brass
};
const WILD_PRINT = { col: '#7a5aa8', deep: '#4b2f78' };

/** Emblem for the card back: a duck in a cowboy hat inside a horseshoe, on a rope ring. */
let backEmblem = '';
function cardBackEmblem(): string {
  if (backEmblem) return backEmblem;
  const K = PRINT.key;
  const P = PRINT.paper;
  backEmblem = `<svg class="cb-art" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="47" fill="${P}" stroke="${K}" stroke-width="3"/>
    <circle cx="50" cy="50" r="42.5" fill="none" stroke="${K}" stroke-width="2" stroke-dasharray="2.6 2.2"/>
    <circle cx="50" cy="50" r="38" fill="currentColor" stroke="${K}" stroke-width="2.4"/>
    <g transform="translate(17 15) scale(.66)" color="${P}">${suitInner('moon')}</g>
    <g transform="translate(7.5 7) scale(.85)">
    <path d="M38 58C38 50 43 45 50 45C57 45 62 50 62 58C62 65 57 69 50 69C43 69 38 65 38 58Z" fill="${PRINT.white}" stroke="${K}" stroke-width="2.4"/>
    <path d="M60 58C67 55.5 74 56.5 76 60C73 64 66 64.5 60 62.5Z" fill="${PRINT.ochre}" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/>
    <circle cx="54" cy="55" r="2.2" fill="${K}"/>
    <path d="M41 46C41 37 44 32 50 32C56 32 59 37 59 46Z" fill="${K}"/>
    <path d="M32 47C36 44 64 44 68 47C64 50 36 50 32 47Z" fill="${K}"/>
    <path d="M41.5 43H58.5" stroke="${PRINT.ochre}" stroke-width="2"/></g>
  </svg>`;
  return backEmblem;
}

export function cardBackHtml(shoeId: string): string {
  const shoe = SHOE[shoeId];
  return `<div class="cback back-${shoe?.back ?? 'red'}" style="--bk:${shoe?.hue ?? '#e2382b'}">
    <div class="cback-frame"><div class="cback-pattern"></div>
    <div class="cback-emblem">${cardBackEmblem()}</div></div></div>`;
}

function aceArt(suit: Suit, col: string): string {
  const K = PRINT.key;
  const tint = mixHex(col, PRINT.paper, 0.72);
  let rays = '';
  for (let i = 0; i < 24; i += 2) {
    const a0 = (i * 15 * Math.PI) / 180;
    const a1 = ((i + 1) * 15 * Math.PI) / 180;
    rays += `M56 68L${(56 + 37 * Math.cos(a0)).toFixed(2)} ${(68 + 37 * Math.sin(a0)).toFixed(2)}L${(56 + 37 * Math.cos(a1)).toFixed(2)} ${(68 + 37 * Math.sin(a1)).toFixed(2)}Z`;
  }
  let dots = '';
  for (let i = 0; i < 24; i++) {
    const a = ((i * 15 + 7.5) * Math.PI) / 180;
    dots += `<circle cx="${(56 + 40.5 * Math.cos(a)).toFixed(2)}" cy="${(68 + 40.5 * Math.sin(a)).toFixed(2)}" r="${i % 2 ? 1 : 1.6}"/>`;
  }
  const name = SUIT_INFO[suit].plural.toUpperCase();
  return `<svg class="ace-art" viewBox="0 0 112 156" aria-hidden="true">
    <circle cx="56" cy="68" r="37" fill="${PRINT.paper}"/>
    <path d="${rays}" fill="${tint}"/>
    <circle cx="56" cy="68" r="37" fill="none" stroke="${K}" stroke-width="2.4"/>
    <circle cx="56" cy="68" r="33.5" fill="none" stroke="${K}" stroke-width=".9"/>
    <g fill="${K}">${dots}</g>
    <g transform="translate(29 41) scale(.54)" color="${col}">${suitInner(suit, 2.6)}</g>
    <path d="M24 114H32V128H24L27.5 121Z M88 114H80V128H88L84.5 121Z" fill="${col}" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M30 111H82V125H30Z" fill="${PRINT.paper}" stroke="${K}" stroke-width="1.8"/>
    <text x="56" y="121.6" text-anchor="middle" textLength="${Math.min(46, name.length * 5.4)}" lengthAdjust="spacingAndGlyphs"
      font-family="Rye, Georgia, serif" font-size="8.4" fill="${K}">${name}</text>
  </svg>`;
}

function stoneArt(): string {
  const K = PRINT.key;
  return `<svg class="stone-art" viewBox="0 0 112 156" aria-hidden="true">
    <path d="M22 104C16 92 20 74 32 66C38 52 54 46 68 52C82 54 94 66 92 82C98 94 92 110 78 114C64 120 40 120 30 114C26 112 23 108 22 104Z" fill="#9a958a" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="${halftone(20, 50, 96, 120, 4.2, (x, y) => (x + y > 150 ? Math.min(1.5, (x + y - 150) / 26) : 0))}" fill="${K}" opacity=".55"/>
    <path d="M38 70C44 62 54 58 62 60M30 84C33 78 36 75 40 73" fill="none" stroke="${PRINT.paper}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M56 66L60 78L54 86L58 98M60 78L70 82M74 92L80 100L78 108M40 96L46 104" fill="none" stroke="${K}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 122H92" stroke="${K}" stroke-width="2"/>
    <path d="M30 111H82V125H30Z" fill="${PRINT.paper}" stroke="${K}" stroke-width="1.8"/>
    <text x="56" y="121.6" text-anchor="middle" font-family="Rye, Georgia, serif" font-size="8.4" fill="${K}" textLength="30" lengthAdjust="spacingAndGlyphs">ROCK</text>
  </svg>`;
}

export function playingCardFront(c: Card): string {
  if (c.ink === 'stone') {
    return `<div class="pc-body stone"><div class="pc-frame"></div>${stoneArt()}${sealHtml(c)}</div>`;
  }
  const pr = c.ink === 'spirit' ? WILD_PRINT : SUIT_PRINT[c.suit];
  const lbl = rankLabel(c.rank);
  const idx = `<span class="pc-rank${lbl.length > 1 ? ' ten' : ''}">${lbl}</span>${suitSvg(c.suit)}`;
  let art: string;
  let kind: string;
  if (c.rank >= 11 && c.rank <= 13) {
    kind = 'is-face';
    art = `<div class="pc-art face">${faceArt(c.rank as 11 | 12 | 13, pr.col, pr.deep)}</div>`;
  } else if (c.rank === 14) {
    kind = 'is-ace';
    art = `<div class="pc-art ace">${aceArt(c.suit, pr.col)}</div>`;
  } else {
    kind = 'is-num';
    const pips = PIPS[c.rank] ?? [];
    art = `<div class="pc-art pips n${c.rank}">${pips
      .map(([x, y, flip]) => `<span class="pip${flip ? ' flip' : ''}" style="left:${x}%;top:${y}%">${suitSvg(c.suit)}</span>`)
      .join('')}</div>`;
  }
  return `<div class="pc-body ${kind} s-${c.suit} ink-${c.ink ?? 'none'}" style="--suit:${pr.col};--suit-deep:${pr.deep}">
    <div class="pc-frame"></div>${art}
    <div class="pc-corner">${idx}</div><div class="pc-corner br">${idx}</div>
    ${c.ink ? `<div class="ink-badge">${inkGlyph(c.ink)}</div>` : ''}${sealHtml(c)}</div>`;
}

function inkGlyph(ink: string): string {
  const map: Record<string, string> = { jade: 'dollar', crimson: 'pepper', gilded: 'nugget', glass: 'shotglass', lucky: 'clover', spirit: 'spark', ash: 'rubberduck' };
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
    ${inst?.disabled ? '<div class="tt-sub bad">Disabled by the Outlaw</div>' : ''}
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
  return `<div class="cs-body cs-${kind}" style="--hue:${d.hue}">${deco}<div class="cs-kind">${KIND_LABEL[kind]}</div>
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

const KIND_LABEL: Record<ConsKind, string> = { fortune: 'Tonic', star: 'Tall Tale', mask: 'Moonshine' };

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
    <div class="tt-tags"><span class="tag-kind k-relic">Deed</span>${v.requires ? `<span class="tag-sub">Upgrade of ${esc(VOUCHER[v.requires]?.name ?? '')}</span>` : ''}${extra}</div>`;
}

const PACK_ICON: Record<string, string> = { charm: 'rubberduck', fortune: 'tonic', star: 'book', mask: 'jug', card: 'cards' };
const PACK_HUE: Record<string, string> = { charm: '#d9792c', fortune: '#c8402a', star: '#2f5d8a', mask: '#6f4f9a', card: '#557a46' };

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
  const what: Record<string, string> = { charm: 'Doodads', fortune: 'Tonics', star: 'Tall Tales', mask: 'Moonshine', card: 'playing cards' };
  return `<div class="tt-title">${esc(p.name)}</div><div class="tt-body">Choose ${fmt(`{g:${p.picks}}`)} of up to ${fmt(`{g:${p.size}}`)} ${what[p.kind]}${p.kind === 'card' ? ' to add to your deck' : p.kind === 'charm' ? '' : ' to use immediately'}</div>
    <div class="tt-tags"><span class="tag-kind k-pack">Crate</span>${extra}</div>`;
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
  return `<div class="tt-title">${esc(t.name)}</div><div class="tt-body">${fmt(t.text)}</div><div class="tt-tags"><span class="tag-kind k-tag">Telegram</span></div>`;
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
    <div class="tt-tags"><span class="tag-kind k-host">${host.rare ? 'Rare Outlaw' : host.showdown ? 'Showdown Outlaw' : 'Outlaw'}</span><span class="tag-sub">Target X${host.scale}</span></div>`;
}

export function shoeCard(id: string): HTMLElement {
  const el = shell('pcard shoe-card', `<div class="pc-body"></div>`, cardBackHtml(id));
  el.classList.add('down');
  return el;
}
