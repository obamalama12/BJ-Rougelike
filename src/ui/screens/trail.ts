// The trail map: pick your route through town toward the Outlaw.

import { coach } from '../coach';
import type { Run, TrailNode } from '../../core/types';
import { HOST } from '../../content/hosts';
import { COLS, NODE_INFO, nodeTarget, reachable, travel, isTableNode } from '../../game/trail';
import { canRerollHost, payRerollHost, maybeOpenTagPack } from '../../game/shop';
import { app, button, save, tip, toast } from '../app';
import { div, fmt, fmtNum, h } from '../dom';
import type { Hud } from '../hud';
import { background } from '../../fx/background';
import { audio, sfx } from '../../fx/audio';
import { iconSvg } from '../icons';
import { portraitOf, townName } from '../characters';

// Map area inside the stage (between the poster column and the satchel).
const MAP = { x: 300, y: 104, w: 1000, h: 640 };

function nodePos(n: TrailNode) {
  const colW = (MAP.w - 110) / COLS;
  const x = 90 + colW * (n.col + 0.5);
  const y = 170 + n.row * 168 + (n.col % 2 ? 20 : 0);
  return { x, y };
}

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
  map.innerHTML = `<div class="map-paper"></div><div class="map-title"><span>${townName(run.night)}</span><small>Choose your route to the Outlaw</small></div>`;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'trail-lines');
  svg.setAttribute('viewBox', `0 0 ${MAP.w} ${MAP.h}`);
  const can = new Set(reachable(run).map((n) => n.id));
  const at = run.trail.nodes.find((n) => n.id === run.trail.at);
  const traveled = new Set<string>();
  // Draw the roads first.
  for (const n of run.trail.nodes) {
    const a = nodePos(n);
    for (const id of n.next) {
      const m = run.trail.nodes.find((x) => x.id === id)!;
      const b = nodePos(m);
      const path = document.createElementNS(svgNS, 'path');
      const mx = (a.x + b.x) / 2;
      path.setAttribute('d', `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`);
      const live = at && at.id === n.id && at.done && can.has(m.id);
      const first = !at && n.col === 0;
      path.setAttribute('class', `road${live || first ? ' live' : ''}${n.done && (m.done || m.id === run.trail.at) ? ' walked' : ''}`);
      traveled.add(`${n.id}-${m.id}`);
      svg.appendChild(path);
    }
  }
  map.appendChild(svg);
  for (const n of run.trail.nodes) {
    const p = nodePos(n);
    const info = NODE_INFO[n.kind];
    const open = can.has(n.id);
    const here = run.trail.at === n.id;
    const node = h('button', { class: `trail-node k-${n.kind}${open ? ' open' : ''}${n.done ? ' done' : ''}${here ? ' here' : ''}`, type: 'button', disabled: !open });
    node.style.left = `${p.x}px`;
    node.style.top = `${p.y}px`;
    node.style.setProperty('--d', `${n.col * 0.07 + n.row * 0.03}s`);
    if (n.kind === 'outlaw') node.innerHTML = `<div class="tn-face">${portraitOf(n.hostId ?? run.nightHost, open ? 'smug' : 'neutral')}</div>`;
    else node.innerHTML = `<div class="tn-icon">${iconSvg(info.icon)}</div>`;
    node.appendChild(div('tn-label', n.kind === 'outlaw' ? HOST[n.hostId ?? '']?.name ?? info.name : info.name));
    if (isTableNode(n) && n.kind !== 'outlaw') node.appendChild(div('tn-target', fmtNum(nodeTarget(run, n))));
    tip(node, () => nodeTip(run, n), 'top');
    node.addEventListener('click', () => {
      if (!open || app.busy) return;
      sfx(n.kind === 'outlaw' ? 'honk' : isTableNode(n) ? 'quack' : 'select');
      travel(run, n.id);
      save();
      app.render();
    });
    map.appendChild(node);
  }
  // The player's token
  const tokenPos = at ? nodePos(at) : { x: 52, y: 400 };
  const token = div('trail-token', h('div', { class: 'tt-portrait', html: portraitOf('player', 'smug') }));
  token.style.left = `${tokenPos.x}px`;
  token.style.top = `${tokenPos.y - 70}px`;
  map.appendChild(token);
  el.appendChild(map);
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
  void coach('trail', { x: 800, y: 470 });
  void coach('grit', { x: 1090, y: 200, point: 'up' });
  return el;
}

function nodeTip(run: Run, n: TrailNode): string {
  const info = NODE_INFO[n.kind];
  let extra = '';
  if (isTableNode(n)) extra += `<br>Score at least <span class="t-hl">${fmtNum(nodeTarget(run, n))}</span>`;
  if ((n.kind === 'bank' || n.kind === 'outlaw') && n.hostId) {
    const host = HOST[n.hostId];
    extra += `<br><br><b>${host?.name}</b>: ${fmt(host?.text ?? '')}`;
  }
  return `<div class="tt-title">${n.kind === 'outlaw' ? HOST[n.hostId ?? '']?.name ?? info.name : info.name}</div><div class="tt-body">${info.blurb}${extra}</div>`;
}
