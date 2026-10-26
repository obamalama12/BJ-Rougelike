// The little scene that plays after you pick a path: your duck rides into the scenery, something
// happens (one of a dozen reusable animated beats), the duck reacts, and the result is stamped:
// a Boon, a Bane, Good Fortune or Bad Luck. Click, tap, Space or Enter skips to the result; a
// second press (or a short wait) closes it. Timings follow the Game speed setting, and with
// Motion: Reduced only the final frame is shown.

import type { Run } from '../core/types';
import { ABILITY, INSTANT, PATHS, isGood, type Outcome } from '../content/paths';
import { SCENES, type Beat } from '../content/cutscenes';
import { app, speed } from './app';
import { div, fmt, h } from './dom';
import { portraitOf } from './characters';
import { iconSvg } from './icons';
import { sfx } from '../fx/audio';

/** Base timings in ms at speed 1: walk in, the beat starts, the climax, the result, close. */
const T = { beat: 1000, climax: 1900, result: 3100, close: 5200, reducedClose: 1600 };

/** Who turns up in each beat when the scene doesn't name someone. */
const DEFAULT_ACTOR: Partial<Record<Beat, string>> = { stranger: 'cowboyhat', ambush: 'bandana', stampede: 'bull', thief: 'hand' };

const BEAT_SFX: Record<Beat, string> = {
  treasure: 'shuffle', stranger: 'quack', campfire: 'fire', star: 'tick', cards: 'deal', storm: 'bust',
  ambush: 'honk', snake: 'error', ghost: 'push', stampede: 'shuffle', water: 'flip', thief: 'sell',
};

function outcomeInfo(o: Outcome, run: Run): { name: string; text: string; icon: string } {
  if (o.kind === 'ability') {
    const d = ABILITY[o.id];
    const k = run.charms.find((x) => x.id === o.id) ?? { uid: 0, id: o.id, state: d?.init ? d.init() : {} };
    return { name: d?.name ?? '', text: d ? (typeof d.text === 'function' ? d.text(k, run) : d.text) : '', icon: d?.icon ?? 'star' };
  }
  const d = INSTANT[o.id];
  return { name: d?.name ?? '', text: d?.text ?? '', icon: d?.icon ?? 'star' };
}

function beatLayer(beat: Beat, actor: string | undefined): HTMLElement {
  const b = div(`cs-beat b-${beat}`);
  const ic = (cls: string, icon: string) => h('div', { class: cls, html: iconSvg(icon) });
  const bits = (cls: string, n: number) => Array.from({ length: n }, (_, i) => h('span', { class: cls, style: `--n:${i}` }));
  switch (beat) {
    case 'treasure':
      b.append(div('bt-mound'), ...bits('bt-glint', 4));
      break;
    case 'stranger':
      b.append(div('bt-figure', ic('bt-actor', actor ?? 'cowboyhat'), div('bt-shadow')));
      break;
    case 'campfire':
      b.append(ic('bt-fire', 'campfire'), ...bits('bt-spark', 8));
      break;
    case 'star':
      b.append(div('bt-streak', ic('bt-star', 'star')), div('bt-impact'));
      break;
    case 'cards':
      b.append(div('bt-table'), ...bits('bt-card', 3));
      break;
    case 'storm':
      b.append(ic('bt-cloud c1', 'cloud'), ic('bt-cloud c2', 'cloud'), ic('bt-bolt', 'lightning'), ...bits('bt-rain', 14));
      break;
    case 'ambush':
      b.append(ic('bt-rock', 'rock'), div('bt-jumper', ic('bt-actor', actor ?? 'bandana')));
      break;
    case 'snake':
      b.append(...bits('bt-grass', 5), ic('bt-snake', 'snake'));
      break;
    case 'ghost':
      b.append(div('bt-fog f1'), div('bt-fog f2'), ic('bt-ghost', 'ghost'));
      break;
    case 'stampede':
      b.append(div('bt-dust'), ...[0, 1, 2].map((i) => h('div', { class: 'bt-runner', style: `--n:${i}`, html: iconSvg(actor ?? 'bull') })));
      break;
    case 'water':
      b.append(div('bt-wave'), ...bits('bt-bubble', 6), div('bt-splash'));
      break;
    case 'thief':
      b.append(ic('bt-hand', actor ?? 'hand'));
      break;
  }
  return b;
}

/** Play the scene for the path just taken. Resolves once it has closed. */
export function playPathScene(run: Run, path: number, outcome: Outcome): Promise<void> {
  return new Promise((resolve) => {
    const scene = SCENES[outcome.id];
    const good = isGood(outcome);
    const info = outcomeInfo(outcome, run);
    const beat: Beat = scene?.beat ?? 'treasure';
    const actor = scene?.actor ?? DEFAULT_ACTOR[beat];
    const reduced = document.body.classList.contains('reduce-motion');
    const k = 1 / Math.max(0.25, speed());
    const label = outcome.kind === 'ability' ? (good ? 'A Boon' : 'A Bane') : good ? 'Good Fortune' : 'Bad Luck';

    const duck = h('div', { class: 'cs-duck', html: portraitOf('player', 'neutral') });
    const prop = h('div', { class: 'cs-prop', html: iconSvg(scene?.prop ?? info.icon) });
    const windowEl = div(
      'cs-window',
      div('cs-sky'),
      div('cs-sun'),
      div('cs-mesa far'),
      div('cs-mesa near'),
      h('div', { class: 'cs-scenery', html: iconSvg(PATHS[path].icon) }),
      div('cs-ground'),
      beatLayer(beat, actor),
      duck,
      prop,
      div('cs-flash'),
    );
    const result = div(
      'cs-result',
      div('csr-banner', label),
      div('csr-name', info.name),
      h('div', { class: 'csr-text', html: fmt(info.text) }),
    );
    const el = div(
      `scene cutscene beat-${beat} ${good ? 'good' : 'bad'}`,
      div(
        'cs-frame sheet',
        div('divider bill-kicker', PATHS[path].name),
        windowEl,
        h('div', { class: 'cs-line' }, scene?.line ?? PATHS[path].scene),
        result,
        div('cs-skip'),
      ),
    );
    el.style.setProperty('--k', String(reduced ? 0.01 : k));

    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms * k));
    let stage = 0;
    let closed = false;
    const climax = () => {
      if (stage >= 2) return;
      stage = 2;
      el.classList.add('climax');
      duck.innerHTML = portraitOf('player', good ? 'laughing' : beat === 'storm' || beat === 'water' ? 'sweating' : 'shocked');
      sfx(good ? 'coin' : 'bust');
      if (!good && (beat === 'ambush' || beat === 'stampede' || beat === 'storm')) el.classList.add('shake');
    };
    const showResult = () => {
      if (stage >= 3) return;
      climax();
      stage = 3;
      el.classList.add('result');
      sfx(good ? 'win' : 'lose');
      for (const t of timers.splice(0)) clearTimeout(t);
      timers.push(window.setTimeout(close, (reduced ? T.reducedClose : T.close - T.result) * (reduced ? 1 : k)));
    };
    const close = () => {
      if (closed) return;
      closed = true;
      for (const t of timers.splice(0)) clearTimeout(t);
      window.removeEventListener('keydown', onKey, true);
      el.removeEventListener('pointerdown', onTap);
      el.classList.add('out');
      setTimeout(() => el.remove(), 380);
      app.busy = false;
      resolve();
    };
    // First press skips to the result, the next one closes it.
    const advance = () => (stage >= 3 ? close() : showResult());
    const onTap = (e: PointerEvent) => {
      e.preventDefault();
      advance();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter' && e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      advance();
    };

    app.busy = true;
    window.addEventListener('keydown', onKey, true);
    el.addEventListener('pointerdown', onTap);
    app.screen.appendChild(el);

    if (reduced) {
      // Motion reduced: straight to the last frame and the result.
      showResult();
      return;
    }
    sfx('deal');
    at(450, () => sfx('deal'));
    at(T.beat, () => {
      stage = 1;
      el.classList.add('beat');
      sfx(BEAT_SFX[beat] as Parameters<typeof sfx>[0]);
    });
    at(T.climax, climax);
    at(T.result, showResult);
  });
}
