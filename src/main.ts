import '@fontsource/rye/latin-400.css';
import '@fontsource/zilla-slab/latin-500.css';
import '@fontsource/zilla-slab/latin-600.css';
import '@fontsource/zilla-slab/latin-700.css';
import { clearCoach } from './ui/coach';
import './style/main.css';
import './style/system.css';
import './style/cards.css';
import './style/hud.css';
import './style/table.css';
import './style/trail.css';
import './style/stops.css';
import './style/shop.css';
import './style/menus.css';
import './style/scenes.css';

import { app, mountShell, hideTip, closeAllModals } from './ui/app';
import { clear, div } from './ui/dom';
import { Hud } from './ui/hud';
import { TableScreen } from './ui/screens/table';
import { trailScreen } from './ui/screens/trail';
import { eventScreen, docScreen, campScreen } from './ui/screens/stops';
import { shopScreen } from './ui/screens/shop';
import { packScreen } from './ui/screens/pack';
import { titleScreen, gameOverScreen, victoryScreen } from './ui/screens/menus';
import { applySettings } from './ui/screens/options';
import { background } from './fx/background';
import { particles } from './fx/particles';
import { profile, saveProfile } from './ui/profile';

const root = document.getElementById('app')!;
const bg = document.getElementById('bg') as HTMLCanvasElement;
const back = document.getElementById('lanterns') as HTMLCanvasElement;
const front = document.getElementById('fx') as HTMLCanvasElement;

mountShell(root);
background.mount(bg, profile.settings.shader);
particles.mount(back, front);
applySettings();

let hud: Hud | null = null;
let table: TableScreen | null = null;
let lastPhase = '';

function render() {
  hideTip();
  clearCoach();
  table?.destroy();
  table = null;
  const run = app.run;
  const screen = app.screen;
  clear(screen);
  screen.className = 'screen';
  if (!run) {
    hud = null;
    closeAllModals();
    screen.appendChild(titleScreen());
    screen.classList.add('fade-in');
    lastPhase = 'title';
    return;
  }
  if (run.phase === 'gameover') {
    screen.appendChild(gameOverScreen());
    lastPhase = run.phase;
    return;
  }
  if (run.phase === 'victory') {
    screen.appendChild(victoryScreen());
    lastPhase = run.phase;
    return;
  }
  hud = new Hud();
  const main = div('main-area');
  screen.append(main, hud.el);
  screen.dataset.phase = run.phase;
  if (run.phase === 'table' || run.phase === 'cashout') {
    table = new TableScreen(hud);
    main.appendChild(table.el);
    table.mount();
    if (run.phase === 'cashout') table.showCashout();
  } else if (run.phase === 'trail') {
    main.appendChild(trailScreen(hud));
  } else if (run.phase === 'event') {
    main.appendChild(eventScreen(hud));
  } else if (run.phase === 'doc') {
    main.appendChild(docScreen(hud));
  } else if (run.phase === 'camp') {
    main.appendChild(campScreen(hud));
  } else if (run.phase === 'shop') {
    main.appendChild(shopScreen(hud));
  } else if (run.phase === 'pack') {
    main.appendChild(packScreen(hud));
  }
  if (lastPhase !== run.phase) screen.classList.add('fade-in');
  lastPhase = run.phase;
}

app.render = render;
render();

window.addEventListener('beforeunload', () => saveProfile());
document.getElementById('boot')?.remove();
document.querySelector('.rotate-skip')?.addEventListener('click', () => document.body.classList.add('rotate-ok'));
