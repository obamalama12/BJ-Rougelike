// Two 2D canvases: ambient sky lanterns behind the stage, and bursts in front.

interface Lantern {
  x: number;
  y: number;
  z: number;
  vy: number;
  phase: number;
  hue: number;
}

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: 'spark' | 'petal' | 'ember' | 'coin' | 'ring' | 'smoke';
  rot: number;
  vr: number;
}

function lanternSprite(hue: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 128;
  const g = c.getContext('2d')!;
  const cx = 48;
  const cy = 66;
  const glow = g.createRadialGradient(cx, cy, 4, cx, cy, 48);
  glow.addColorStop(0, `hsla(${hue},100%,70%,0.55)`);
  glow.addColorStop(0.45, `hsla(${hue},100%,55%,0.18)`);
  glow.addColorStop(1, `hsla(${hue},100%,50%,0)`);
  g.fillStyle = glow;
  g.fillRect(0, 0, 96, 128);
  // body
  const body = g.createLinearGradient(cx - 16, 0, cx + 16, 0);
  body.addColorStop(0, `hsl(${hue},90%,38%)`);
  body.addColorStop(0.5, `hsl(${hue + 12},100%,72%)`);
  body.addColorStop(1, `hsl(${hue},90%,38%)`);
  g.fillStyle = body;
  g.beginPath();
  g.ellipse(cx, cy, 15, 21, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = `hsla(${hue - 10},80%,25%,0.6)`;
  g.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    g.beginPath();
    g.ellipse(cx, cy + i * 7, 15 * Math.cos((i * 7) / 24), 1.2, 0, 0, Math.PI * 2);
    g.stroke();
  }
  g.fillStyle = '#2a1410';
  g.fillRect(cx - 8, cy - 24, 16, 5);
  g.fillRect(cx - 8, cy + 19, 16, 5);
  return c;
}

class Particles {
  back!: HTMLCanvasElement;
  front!: HTMLCanvasElement;
  bctx!: CanvasRenderingContext2D;
  fctx!: CanvasRenderingContext2D;
  enabled = true;
  lanterns: Lantern[] = [];
  parts: P[] = [];
  sprites: HTMLCanvasElement[] = [];
  lanternRate = 1;
  private last = performance.now();
  private dpr = 1;

  mount(back: HTMLCanvasElement, front: HTMLCanvasElement) {
    this.back = back;
    this.front = front;
    this.bctx = back.getContext('2d')!;
    this.fctx = front.getContext('2d')!;
    this.sprites = [18, 30, 8, 42].map(lanternSprite);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    for (let i = 0; i < 16; i++) this.spawnLantern(true);
    const loop = (now: number) => {
      requestAnimationFrame(loop);
      this.frame(now);
    };
    requestAnimationFrame(loop);
  }

  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const c of [this.back, this.front]) {
      c.width = Math.floor(window.innerWidth * this.dpr);
      c.height = Math.floor(window.innerHeight * this.dpr);
    }
  }

  private spawnLantern(anywhere = false) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const z = 0.25 + Math.random() * 0.75;
    this.lanterns.push({
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 60,
      z,
      vy: -(8 + Math.random() * 14) * z,
      phase: Math.random() * Math.PI * 2,
      hue: Math.floor(Math.random() * this.sprites.length),
    });
  }

  burst(x: number, y: number, opts: { n?: number; color?: string | string[]; kind?: P['kind']; speed?: number; size?: number; spread?: number; up?: number } = {}) {
    if (!this.enabled) return;
    const n = opts.n ?? 14;
    const colors = Array.isArray(opts.color) ? opts.color : [opts.color ?? '#ffcf6a'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (opts.speed ?? 260) * (0.3 + Math.random() * 0.7);
      this.parts.push({
        x,
        y,
        vx: Math.cos(a) * sp * (opts.spread ?? 1),
        vy: Math.sin(a) * sp - (opts.up ?? 80),
        life: 0,
        max: 0.6 + Math.random() * 0.7,
        size: (opts.size ?? 4) * (0.6 + Math.random() * 0.8),
        color: colors[i % colors.length],
        kind: opts.kind ?? 'spark',
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 10,
      });
    }
  }

  ring(x: number, y: number, color = '#ffd27a', size = 80) {
    if (!this.enabled) return;
    this.parts.push({ x, y, vx: 0, vy: 0, life: 0, max: 0.55, size, color, kind: 'ring', rot: 0, vr: 0 });
  }

  /** Rising embers from a rectangle (score box on fire). */
  flames(rect: DOMRect, intensity: number, color: string[] = ['#ff5b2a', '#ffb03d', '#ffe27a']) {
    if (!this.enabled) return;
    const n = Math.min(6, Math.ceil(intensity * 3));
    for (let i = 0; i < n; i++) {
      this.parts.push({
        x: rect.left + Math.random() * rect.width,
        y: rect.top + rect.height * (0.2 + Math.random() * 0.6),
        vx: (Math.random() - 0.5) * 30,
        vy: -60 - Math.random() * 120 * intensity,
        life: 0,
        max: 0.5 + Math.random() * 0.5,
        size: 3 + Math.random() * 5 * Math.min(2, intensity),
        color: color[Math.floor(Math.random() * color.length)],
        kind: 'ember',
        rot: 0,
        vr: 0,
      });
    }
  }

  petals(n = 40) {
    if (!this.enabled) return;
    const W = window.innerWidth;
    for (let i = 0; i < n; i++) {
      this.parts.push({
        x: Math.random() * W,
        y: -20 - Math.random() * 200,
        vx: 30 + Math.random() * 60,
        vy: 60 + Math.random() * 80,
        life: 0,
        max: 4 + Math.random() * 3,
        size: 5 + Math.random() * 5,
        color: ['#ffb3c7', '#ffd6e2', '#ff8ab3', '#ffe27a'][i % 4],
        kind: 'petal',
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 6,
      });
    }
  }

  private frame(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (document.hidden) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const d = this.dpr;
    // --- back: lanterns
    const b = this.bctx;
    b.setTransform(d, 0, 0, d, 0, 0);
    b.clearRect(0, 0, W, H);
    if (this.enabled) {
      const target = Math.round(16 * this.lanternRate);
      if (this.lanterns.length < target && Math.random() < dt * 2) this.spawnLantern();
      b.globalCompositeOperation = 'lighter';
      for (const l of this.lanterns) {
        l.y += l.vy * dt;
        l.phase += dt * 0.8;
        const x = l.x + Math.sin(l.phase) * 14 * l.z;
        const s = this.sprites[l.hue];
        const sc = 0.35 + l.z * 0.65;
        b.globalAlpha = 0.25 + 0.6 * l.z * (0.85 + 0.15 * Math.sin(l.phase * 3.1));
        b.drawImage(s, x - 48 * sc, l.y - 64 * sc, 96 * sc, 128 * sc);
      }
      b.globalAlpha = 1;
      b.globalCompositeOperation = 'source-over';
      this.lanterns = this.lanterns.filter((l) => l.y > -100);
    }
    // --- front: particles
    const f = this.fctx;
    f.setTransform(d, 0, 0, d, 0, 0);
    f.clearRect(0, 0, W, H);
    if (!this.parts.length) return;
    f.globalCompositeOperation = 'lighter';
    for (const p of this.parts) {
      p.life += dt;
      const k = p.life / p.max;
      if (p.kind === 'petal') {
        p.vx += Math.sin(p.life * 2 + p.rot) * 20 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        f.globalCompositeOperation = 'source-over';
        f.save();
        f.translate(p.x, p.y);
        f.rotate(p.rot);
        f.globalAlpha = Math.min(1, (1 - k) * 2);
        f.fillStyle = p.color;
        f.beginPath();
        f.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        f.fill();
        f.restore();
        f.globalCompositeOperation = 'lighter';
        continue;
      }
      if (p.kind === 'ring') {
        f.globalAlpha = 1 - k;
        f.strokeStyle = p.color;
        f.lineWidth = 4 * (1 - k) + 1;
        f.beginPath();
        f.arc(p.x, p.y, p.size * (0.3 + k * 0.9), 0, Math.PI * 2);
        f.stroke();
        continue;
      }
      p.vy += (p.kind === 'ember' ? -40 : p.kind === 'coin' ? 600 : 380) * dt;
      p.vx *= Math.pow(0.2, dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const a = Math.max(0, 1 - k);
      f.globalAlpha = a;
      f.fillStyle = p.color;
      if (p.kind === 'coin') {
        f.save();
        f.translate(p.x, p.y);
        f.scale(Math.cos(p.rot), 1);
        f.beginPath();
        f.arc(0, 0, p.size, 0, Math.PI * 2);
        f.fill();
        f.restore();
      } else {
        const s = p.size * (p.kind === 'ember' ? 1 - k * 0.6 : 1 - k * 0.3);
        f.beginPath();
        if (p.kind === 'spark') {
          f.save();
          f.translate(p.x, p.y);
          f.rotate(Math.atan2(p.vy, p.vx));
          f.ellipse(0, 0, s * 2.2, s * 0.6, 0, 0, Math.PI * 2);
          f.restore();
        } else f.arc(p.x, p.y, s, 0, Math.PI * 2);
        f.fill();
      }
    }
    f.globalAlpha = 1;
    f.globalCompositeOperation = 'source-over';
    this.parts = this.parts.filter((p) => p.life < p.max && p.y < H + 50);
    if (this.parts.length > 900) this.parts.splice(0, this.parts.length - 900);
  }
}

export const particles = new Particles();
