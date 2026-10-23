// Choose the next table of the Night: Paper, Silk or the Host.

import type { Run } from '../../core/types';
import { HOST } from '../../content/hosts';
import { TAG } from '../../content/tags';
import { tableReward, tableTarget, NIGHTS } from '../../game/engine';
import { canRerollHost, payRerollHost, selectTable, skipTable, maybeOpenTagPack } from '../../game/shop';
import { app, button, save, tip, toast } from '../app';
import { hostMedallion, hostTooltip, tagToken, tagTooltip } from '../art';
import { div, fmt, fmtNum, h } from '../dom';
import type { Hud } from '../hud';
import { background } from '../../fx/background';
import { audio, sfx } from '../../fx/audio';
import { iconSvg } from '../icons';

export function selectScreen(hud: Hud): HTMLElement {
  const run = app.run as Run;
  background.setPalette('select', 0.8);
  audio.setMood('menu');
  if (maybeOpenTagPack(run)) {
    save();
    setTimeout(() => app.render(), 0);
  }
  const el = div('select-screen');
  const title = div('night-title', h('span', { class: 'nt-small' }, run.endless ? 'Endless Night' : 'Night'), h('span', { class: 'nt-num' }, String(run.night)), run.endless ? null : h('span', { class: 'nt-of' }, `of ${NIGHTS}`));
  const row = div('lantern-row');
  const names = ['Paper Lantern', 'Silk Lantern', ''];
  const next = run.tableStatus.findIndex((s) => s === 'open');
  for (let i = 0; i < 3; i++) {
    const status = run.tableStatus[i];
    const isHost = i === 2;
    const host = HOST[run.nightHost];
    const panel = div(`lantern-panel kind-${i === 0 ? 'paper' : i === 1 ? 'silk' : 'host'} st-${status}${i === next ? ' current' : ''}`);
    panel.style.setProperty('--d', `${i * 0.12}s`);
    const art = div('lp-art');
    if (isHost) {
      const med = hostMedallion(host.id, 'xl');
      tip(med, () => hostTooltip(host.id));
      art.appendChild(med);
    } else {
      art.innerHTML = `<div class="paper-lantern ${i === 1 ? 'silk' : ''}"><div class="pl-glow"></div><div class="pl-top"></div><div class="pl-body">${iconSvg(i === 1 ? 'blossom' : 'moon')}</div><div class="pl-bottom"></div><div class="pl-tassel"></div></div>`;
    }
    const name = div('lp-name', isHost ? host.name : names[i]);
    const sub = isHost ? h('div', { class: 'lp-curse', html: fmt(host.text) }) : div('lp-sub', i === 0 ? 'A gentle table' : 'The stakes rise');
    const target = div('lp-target', div('lp-label', 'Score at least'), div('lp-target-val', fmtNum(tableTarget(run, i))));
    const reward = tableReward(run, i);
    const rew = div('lp-reward', reward ? h('span', { class: 't-money' }, `${'$'.repeat(reward)}+`) : h('span', { class: 't-dim' }, 'No reward'));
    const foot = div('lp-foot');
    if (status === 'won') foot.appendChild(div('lp-stamp won', 'Lit'));
    else if (status === 'skipped') foot.appendChild(div('lp-stamp skipped', 'Skipped'));
    else if (i === next) {
      foot.appendChild(
        button('Play', 'primary', () => {
          sfx('gong');
          selectTable(run, i);
          save();
          app.render();
        }),
      );
      if (!isHost) {
        const tagId = run.nightTags[i];
        const tk = tagToken(tagId);
        tip(tk, () => tagTooltip(tagId));
        foot.appendChild(
          div(
            'lp-skip',
            button('Skip', 'ghost small', () => {
              skipTable(run, i);
              sfx('reroll');
              toast(`Received ${TAG[tagId]?.name ?? 'a token'}`, 'good');
              save();
              app.render();
            }),
            div('lp-or', 'for'),
            tk,
          ),
        );
      } else if (canRerollHost(run) || run.vouchers.includes('fate_thread')) {
        foot.appendChild(
          button('Reroll Host $10', 'ghost small', () => {
            if (!canRerollHost(run)) return toast('Cannot reroll', 'bad');
            payRerollHost(run);
            sfx('reroll');
            save();
            app.render();
          }, { disabled: !canRerollHost(run) }),
        );
      }
    } else foot.appendChild(div('lp-stamp upcoming', 'Upcoming'));
    panel.append(art, name, sub, target, rew, foot);
    row.appendChild(panel);
  }
  el.append(title, row);
  hud.update();
  hud.renderTrays();
  hud.canUse = true;
  hud.onChange = () => {};
  return el;
}
