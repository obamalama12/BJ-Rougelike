// The trail map: pick your route through town toward the Outlaw.

import { coach } from '../coach';
import { townCelebration, type Celebration } from '../scenes';
import type { Run, TrailNode, NodeKind } from '../../core/types';
import { HOST } from '../../content/hosts';
import { COLS, NODE_INFO, nodeTarget, reachable, travel, isTableNode } from '../../game/trail';
import { canRerollHost, payRerollHost, maybeOpenTagPack } from '../../game/shop';
import { NIGHTS } from '../../game/engine';
import { app, button, save, tip, toast } from '../app';
import { div, fmt, fmtNum, h } from '../dom';
import type { Hud } from '../hud';
import { background } from '../../fx/background';
import { audio, sfx } from '../../fx/audio';
import { iconSvg } from '../icons';
import { portraitOf, townName } from '../characters';

// Map area inside the stage (between the poster column and the satchel).
const MAP = { x: 300, y: 104, w: 1000, h: 640 };
/** The trail itself is wider than the map window and scrolls sideways inside it. */
const WORLD_W = 140 + (COLS - 1) * 150 + 150;
// Where the player stands before the first stop.
const TRAILHEAD = { x: 62, y: 342 };

function nodePos(n: TrailNode) {
  const x = 140 + n.col * 150;
  const y = 186 + n.row * 156 + (n.col % 2 ? 18 : 0);
  return { x, y };
}

/** Token shape on the map: tables are chips, services are diamond waypoints, happenings are cards. */
function shapeOf(kind: NodeKind): 'chip' | 'diamond' | 'card' {
  if (kind === 'store' || kind === 'doc' || kind === 'camp') return 'diamond';
  if (kind === 'event') return 'card';
  return 'chip';
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const curve = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const mx = (a.x + b.x) / 2;
  return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
};

/** A road: an ink bed, a cream wearing course, and (for the next leg) a marching red dash. */
function road(d: string, state: 'walked' | 'live' | 'ahead'): SVGGElement {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', `road-g ${state}`);
  g.innerHTML = `<path class="road-bed" d="${d}"/><path class="road${state === 'ahead' ? '' : ` ${state}`}" d="${d}"/>${state === 'live' ? `<path class="road-dash" d="${d}"/>` : ''}`;
  return g;
}

/** Scalloped seal behind the Outlaw's portrait. */
function sealPath(r1: number, r2: number, points: number): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI * i) / points - Math.PI / 2;
    const r = i % 2 ? r2 : r1;
    d += `${i ? 'L' : 'M'}${(70 + Math.cos(a) * r).toFixed(1)},${(70 + Math.sin(a) * r).toFixed(1)}`;
  }
  return `${d}Z`;
}
const SEAL = `<svg class="tn-seal-svg" viewBox="0 0 140 140" aria-hidden="true">
  <path d="${sealPath(68, 61, 28)}" class="seal-edge"/>
  <circle cx="70" cy="70" r="57" class="seal-ring"/>
  <circle cx="70" cy="70" r="53.5" class="seal-rule"/>
</svg>`;

/** Engraved compass rose: two-tone points, a ticked bezel and a fleur north. */
const COMPASS = (() => {
  const ticks = Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2;
    const r1 = i % 4 === 0 ? 37 : 39.5;
    return `<line x1="${(50 + Math.sin(a) * r1).toFixed(2)}" y1="${(50 - Math.cos(a) * r1).toFixed(2)}" x2="${(50 + Math.sin(a) * 42).toFixed(2)}" y2="${(50 - Math.cos(a) * 42).toFixed(2)}"/>`;
  }).join('');
  const point = (ang: number, len: number, w: number) => {
    const t = `rotate(${ang} 50 50)`;
    return `<g transform="${t}"><path d="M50 ${50 - len} L${50 + w} 50 L50 50Z" class="c-dark"/><path d="M50 ${50 - len} L${50 - w} 50 L50 50Z" class="c-light"/></g>`;
  };
  return `<svg class="map-compass" viewBox="0 0 100 112" aria-hidden="true">
    <circle cx="50" cy="50" r="43" class="c-bezel"/>
    <circle cx="50" cy="50" r="36" class="c-inner"/>
    <g class="c-ticks">${ticks}</g>
    ${[45, 135, 225, 315].map((a) => point(a, 25, 5)).join('')}
    ${[90, 180, 270].map((a) => point(a, 34, 6.5)).join('')}
    <g transform="rotate(0 50 50)"><path d="M50 12 L56.5 50 L50 50Z" class="c-north"/><path d="M50 12 L43.5 50 L50 50Z" class="c-light"/></g>
    <circle cx="50" cy="50" r="3.2" class="c-hub"/>
    <text x="50" y="9" class="c-n">N</text>
  </svg>`;
})();

/** Engraved mesas along the top margin: outlined, with hatched shadow faces. */
const RANGE = `<defs><pattern id="mapHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="4" class="hatch-line"/></pattern></defs>
<g class="map-range">
  <path class="ground" d="M448 104 H772"/>
  <path class="mesa" d="M462 104 L486 70 L494 70 L500 62 L540 62 L546 70 L556 70 L582 104Z"/>
  <path class="shade" d="M540 62 L546 70 L556 70 L582 104 L556 104 L534 70Z"/>
  <path class="mesa" d="M566 104 L598 50 L654 50 L668 66 L676 66 L700 104Z"/>
  <path class="shade" d="M654 50 L668 66 L676 66 L700 104 L670 104 L646 58Z"/>
  <path class="mesa" d="M690 104 L708 82 L736 82 L756 104Z"/>
  <path class="shade" d="M736 82 L756 104 L738 104 L728 86Z"/>
  <path class="strata" d="M488 76 H552 M478 88 H568 M592 60 H660 M584 74 H672 M576 88 H686 M702 92 H744"/>
</g>`;

export function trailScreen(hud: Hud): HTMLElement {
  const run = app.run as Run;
  background.setPalette('select', 0.8);
  audio.setMood('menu');
  if (maybeOpenTagPack(run)) {
    save();
    setTimeout(() => app.render(), 0);
  }
  const el = div('trail-screen');
  const map = div('trail-map');
  map.innerHTML = `<div class="map-paper sheet"></div><div class="map-neat"></div>
    <div class="map-title"><span class="mt-kicker">Route Map · Town ${run.night} of ${NIGHTS}</span><span class="mt-name">${townName(run.night)}</span><small>Choose your route to the Outlaw</small></div>
    ${COMPASS}
    <div class="map-imprint">Buck Ducks Survey Office · Sheet ${run.night}</div>`;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'trail-lines');
  svg.setAttribute('viewBox', `0 0 ${WORLD_W} ${MAP.h}`);
  svg.style.width = `${WORLD_W}px`;
  svg.innerHTML = RANGE;
  const can = new Set(reachable(run).map((n) => n.id));
  const at = run.trail.nodes.find((n) => n.id === run.trail.at);
  const byId = new Map(run.trail.nodes.map((n) => [n.id, n]));
  // Roads from the trailhead to the first column.
  for (const n of run.trail.nodes) {
    if (n.col !== 0) continue;
    const state = !at ? 'live' : n.done || n.id === run.trail.at ? 'walked' : 'ahead';
    svg.appendChild(road(curve(TRAILHEAD, nodePos(n)), state));
  }
  // Roads between stops. Walked legs are drawn last so they sit on top.
  const legs: SVGGElement[] = [];
  for (const n of run.trail.nodes) {
    const a = nodePos(n);
    for (const id of n.next) {
      const m = byId.get(id)!;
      const live = !!at && at.id === n.id && at.done && can.has(m.id);
      const walked = n.done && (m.done || m.id === run.trail.at);
      legs.push(road(curve(a, nodePos(m)), walked ? 'walked' : live ? 'live' : 'ahead'));
    }
  }
  legs.sort((x, y) => rank(x) - rank(y)).forEach((g) => svg.appendChild(g));
  const head = document.createElementNS(SVG_NS, 'g');
  head.setAttribute('class', 'trailhead');
  head.innerHTML = `<circle cx="${TRAILHEAD.x}" cy="${TRAILHEAD.y}" r="9" class="th-ring"/><circle cx="${TRAILHEAD.x}" cy="${TRAILHEAD.y}" r="4" class="th-dot"/>`;
  svg.appendChild(head);
  const scroller = div('map-scroll');
  const world = div('map-world');
  world.style.width = `${WORLD_W}px`;
  scroller.appendChild(world);
  map.appendChild(scroller);
  world.appendChild(svg);

  for (const n of run.trail.nodes) {
    const p = nodePos(n);
    const info = NODE_INFO[n.kind];
    const open = can.has(n.id);
    const here = run.trail.at === n.id;
    // Stops left behind on other branches are printed faint.
    const passed = !!at && n.col <= at.col && !n.done && !here;
    const state = n.done ? ' done' : open ? ' open' : here ? '' : passed ? ' locked passed' : ' locked';
    const node = h('button', { class: `trail-node k-${n.kind}${state}${here ? ' here' : ''}`, type: 'button', disabled: !open });
    node.style.left = `${p.x}px`;
    node.style.top = `${p.y}px`;
    node.style.setProperty('--d', `${n.col * 0.07 + n.row * 0.03}s`);
    if (n.kind === 'outlaw') {
      const name = HOST[n.hostId ?? '']?.name ?? info.name;
      node.innerHTML = `<div class="tn-seal">${SEAL}<div class="tn-face">${portraitOf(n.hostId ?? run.nightHost, open ? 'smug' : 'neutral')}</div></div>
        <div class="tn-label boss"><span class="tn-kicker">Showdown</span><span class="tn-name">${name}</span></div>`;
    } else if (n.kind === 'gang') {
      // A smaller seal for the Outlaw's gang, with the member's face and target.
      const name = HOST[n.hostId ?? '']?.name ?? info.name;
      node.innerHTML = `<div class="tn-seal gang">${SEAL}<div class="tn-face">${portraitOf(n.hostId ?? run.nightHost, open ? 'angry' : 'neutral')}</div>${n.done ? '<span class="tn-check"></span>' : ''}</div>
        <div class="tn-label boss gang"><span class="tn-kicker">Gang · ${fmtNum(nodeTarget(run, n))}</span><span class="tn-name">${name}</span></div>`;
    } else {
      const shape = shapeOf(n.kind);
      node.innerHTML = `<div class="tn-icon tn-${shape}"><span class="tn-ht"></span>${iconSvg(info.icon)}${n.done ? '<span class="tn-check"></span>' : ''}</div>`;
      const label = div('tn-label', h('span', { class: 'tn-name' }, info.name));
      if (isTableNode(n)) label.appendChild(h('span', { class: 'tn-target' }, fmtNum(nodeTarget(run, n))));
      node.appendChild(label);
    }
    tip(node, () => nodeTip(run, n), 'top');
    node.addEventListener('click', () => {
      if (!open || app.busy) return;
      sfx(n.kind === 'outlaw' || n.kind === 'gang' ? 'honk' : isTableNode(n) ? 'quack' : 'select');
      travel(run, n.id);
      save();
      app.render();
    });
    world.appendChild(node);
  }
  // The player's token: a pin standing on the current stop.
  const tokenPos = at ? nodePos(at) : TRAILHEAD;
  const lift = at ? (at.kind === 'outlaw' ? 84 : 62) : 44;
  const token = div('trail-token', h('div', { class: 'tt-portrait', html: portraitOf('player', 'smug') }));
  token.style.left = `${tokenPos.x}px`;
  token.style.top = `${tokenPos.y - lift}px`;
  world.appendChild(token);
  el.appendChild(map);
  setupScroll(scroller, tokenPos.x);
  if (WORLD_W > MAP.w) {
    const hint = div('map-hint', 'Drag or scroll to see the whole trail');
    map.appendChild(hint);
    scroller.addEventListener('scroll', () => hint.classList.add('gone'), { once: true });
  }
  // Fate Thread: reroll the Outlaw
  if (run.vouchers.includes('fate_thread')) {
    el.appendChild(
      div(
        'trail-extra',
        button('Reroll the Outlaw $10', 'ghost small', () => {
          if (!canRerollHost(run)) return toast('Can’t reroll right now', 'bad');
          payRerollHost(run);
          sfx('reroll');
          save();
          app.render();
        }, { disabled: !canRerollHost(run) }),
      ),
    );
  }
  hud.update();
  hud.renderTrays();
  hud.canUse = true;
  hud.onChange = () => {};
  if (run.flags.celebrate) {
    // A town was just cleaned up: celebrate before showing the new map (the Grit restore is in the scene).
    const c = run.flags.celebrate as Celebration;
    const heal = run.flags.townHeal ?? 0;
    run.flags.celebrate = null;
    run.flags.townHeal = 0;
    save();
    void townCelebration(run, c, heal);
  } else if (run.flags.townHeal) {
    const n = run.flags.townHeal;
    run.flags.townHeal = 0;
    save();
    setTimeout(() => toast(`Fresh horses in ${townName(run.night)}: +${n} Grit`, 'good'), 450);
  }
  void coach('trail', { x: 800, y: 470 });
  void coach('grit', { x: 1090, y: 200, point: 'up' });
  return el;
}

function rank(g: SVGGElement): number {
  return g.classList.contains('walked') ? 2 : g.classList.contains('live') ? 1 : 0;
}

function nodeTip(run: Run, n: TrailNode): string {
  const info = NODE_INFO[n.kind];
  let extra = '';
  if (isTableNode(n)) extra += `<br>Score at least <span class="t-hl">${fmtNum(nodeTarget(run, n))}</span>`;
  if ((n.kind === 'bank' || n.kind === 'gang' || n.kind === 'outlaw') && n.hostId) {
    const host = HOST[n.hostId];
    extra += `<br><br><b>${host?.name}</b>: ${fmt(host?.text ?? '')}`;
  }
  return `<div class="tt-title">${n.kind === 'outlaw' || n.kind === 'gang' ? HOST[n.hostId ?? '']?.name ?? info.name : info.name}</div><div class="tt-body">${info.blurb}${extra}</div>`;
}

/** Sideways scrolling: start with the player in view, let the wheel and a drag pan the trail. */
function setupScroll(sc: HTMLElement, focusX: number) {
  const place = () => {
    sc.scrollLeft = Math.max(0, focusX - 260);
    sc.classList.toggle('at-start', sc.scrollLeft < 4);
    sc.classList.toggle('at-end', sc.scrollLeft > sc.scrollWidth - sc.clientWidth - 4);
  };
  requestAnimationFrame(place);
  sc.addEventListener('scroll', () => {
    sc.classList.toggle('at-start', sc.scrollLeft < 4);
    sc.classList.toggle('at-end', sc.scrollLeft > sc.scrollWidth - sc.clientWidth - 4);
  });
  sc.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    sc.scrollLeft += e.deltaY;
  }, { passive: false });
  // Drag on empty map to pan. Clicks on stops still work: small movements don't count as drags.
  let down: { x: number; left: number } | null = null;
  let dragged = false;
  sc.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('.trail-node')) return;
    down = { x: e.clientX, left: sc.scrollLeft };
    dragged = false;
    sc.setPointerCapture(e.pointerId);
  });
  sc.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = (e.clientX - down.x) / app.scale;
    if (Math.abs(dx) > 4) dragged = true;
    if (dragged) {
      sc.scrollLeft = down.left - dx;
      sc.classList.add('dragging');
    }
  });
  const up = () => {
    down = null;
    sc.classList.remove('dragging');
  };
  sc.addEventListener('pointerup', up);
  sc.addEventListener('pointercancel', up);
}
