// Options: speed, audio, visual effects.

import { app, button, modal, save } from '../app';
import { div, h, clear } from '../dom';
import { profile, saveProfile, saveRun } from '../profile';
import { audio, sfx } from '../../fx/audio';
import { background } from '../../fx/background';
import { particles } from '../../fx/particles';

export function applySettings() {
  const s = profile.settings;
  audio.setVolumes(s.sfx, s.music);
  if (background.quality !== s.shader) background.setQuality(s.shader);
  particles.enabled = s.particles;
  document.body.classList.toggle('no-grain', !s.grain);
  document.body.classList.toggle('reduce-motion', !s.motion);
}

export function openOptions() {
  const box = div('options');
  let armed = false;
  const render = () => {
    clear(box);
    const s = profile.settings;
    const seg = <T extends string | number>(label: string, values: [T, string][], cur: T, set: (v: T) => void) => {
      const row = div('opt-row', div('opt-label', label));
      const g = div('seg');
      for (const [v, name] of values) {
        const b = h('button', { class: `seg-btn${v === cur ? ' on' : ''}`, type: 'button' }, name);
        b.addEventListener('click', () => {
          set(v);
          sfx('click');
          saveProfile();
          applySettings();
          render();
        });
        g.appendChild(b);
      }
      row.appendChild(g);
      return row;
    };
    const slider = (label: string, val: number, set: (v: number) => void) => {
      const inp = h('input', { type: 'range', min: 0, max: 100, value: Math.round(val * 100), class: 'slider' }) as HTMLInputElement;
      inp.addEventListener('input', () => {
        set(Number(inp.value) / 100);
        applySettings();
      });
      inp.addEventListener('change', () => {
        saveProfile();
        sfx('chips', 3);
      });
      return div('opt-row', div('opt-label', label), inp);
    };
    box.append(
      div('opt-title', 'Options'),
      seg('Game speed', [[1, '1x'], [1.5, '1.5x'], [2, '2x'], [3, '3x'], [4, '4x']], s.speed, (v) => (s.speed = v)),
      slider('Music', s.music, (v) => (s.music = v)),
      slider('Sound effects', s.sfx, (v) => (s.sfx = v)),
      seg('Background', [['high', 'High'], ['low', 'Low'], ['off', 'Off']], s.shader, (v) => (s.shader = v)),
      seg('Particles', [[1, 'On'], [0, 'Off']], s.particles ? 1 : 0, (v) => (s.particles = !!v)),
      seg('Screen shake', [[1, 'On'], [0, 'Off']], s.shake ? 1 : 0, (v) => (s.shake = !!v)),
      seg('Paper grain', [[1, 'On'], [0, 'Off']], s.grain ? 1 : 0, (v) => (s.grain = !!v)),
      seg('Motion', [[1, 'Full'], [0, 'Reduced']], s.motion ? 1 : 0, (v) => (s.motion = !!v)),
    );
    const foot = div('opt-foot');
    if (app.run) {
      foot.appendChild(
        button(armed ? 'Click again to abandon' : 'Abandon Run', 'danger', () => {
          // Two-step confirm: native confirm() dialogs are not available everywhere.
          if (!armed) {
            armed = true;
            render();
            return;
          }
          app.run = null;
          saveRun(null);
          close();
          app.render();
        }),
      );
      foot.appendChild(
        button('Main Menu', 'ghost', () => {
          save();
          app.run = null;
          close();
          app.render();
        }),
      );
    }
    foot.appendChild(button('Close', 'primary', () => close()));
    box.appendChild(foot);
  };
  render();
  const close = modal(box);
}
