// Two 2D canvases: ambient sky lanterns behind the stage, and bursts in front.

interface Drifter {
  kind: 'weed' | 'feather';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  phase: number;
  rot: number;
  sprite: number;
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
  kind: 'spark' | 'petal' | 'ember' | 'coin' | 'ring' | 'smoke' | 'feather';
  rot: number;
  vr: number;
}

function tumbleweedSprite(seed: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const g = c.getContext('2d')!;
  let h = seed * 9301 + 49297;
  const rnd = () => ((h = (h * 9301 + 49297) % 233280) / 233280);
  // A tangle of twigs crossing through a ball: random curves between points inside the circle.
  const pt = (r: number) => {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r;
    return [48 + Math.cos(a) * d, 48 + Math.sin(a) * d * 0.92];
  };
  const twigs = Array.from({ length: 34 }, () => [pt(40), pt(26), pt(40)]);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const [pass, color, width] of [
    [0, '#2a1408', 3.6],
    [1, '#c8945a', 1.6],
  ] as const) {
    g.strokeStyle = color;
    for (const [p0, p1, p2] of twigs) {
      g.lineWidth = width * (0.8 + rnd() * 0.4);
      g.beginPath();
      g.moveTo(p0[0], p0[1]);
      g.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]);
      g.stroke();
    }
    if (pass === 1) {
      g.strokeStyle = '#e8c890';
      g.lineWidth = 1;
      for (const [p0, p1, p2] of twigs.slice(0, 12)) {
        g.beginPath();
        g.moveTo(p0[0], p0[1]);
        g.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]);
        g.stroke();
      }
    }
  }
  return c;
}

function featherSprite(hue: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 40;
  c.height = 80;
  const g = c.getContext('2d')!;
  g.translate(20, 40);
  g.fillStyle = `hsl(${hue},70%,82%)`;
  g.strokeStyle = `hsl(${hue},40%,35%)`;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(0, -34);
  g.bezierCurveTo(14, -18, 12, 18, 0, 30);
  g.bezierCurveTo(-12, 18, -14, -18, 0, -34);
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(0, -30);
  g.lineTo(0, 38);
  g.stroke();
  return c;
}

class Particles {
  back!: HTMLCanvasElement;
  front!: HTMLCanvasElement;
  bctx!: CanvasRenderingContext2D;
  fctx!: CanvasRenderingContext2D;
  enabled = true;
  lanterns: Drifter[] = [];
  parts: P[] = [];
  sprites: HTMLCanvasElement[] = [];
  feathers: HTMLCanvasElement[] = [];
  lanternRate = 1;
  private last = performance.now();
  private dpr = 1;

  mount(back: HTMLCanvasElement, front: HTMLCanvasElement) {
    this.back = back;
    this.front = front;
    this.bctx = back.getContext('2d')!;
    this.fctx = front.getContext('2d')!;
    this.sprites = [1, 2, 3].map(tumbleweedSprite);
    this.feathers = [40, 200, 20, 330].map(featherSprite);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    for (let i = 0; i < 10; i++) this.spawnLantern(true);
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
    const z = 0.3 + Math.random() * 0.7;
    if (Math.random() < 0.35) {
      // Tumbleweed rolling along the ground
      this.lanterns.push({ kind: 'weed', x: anywhere ? Math.random() * W : -80, y: H * (0.8 + z * 0.15), z, vx: (60 + Math.random() * 80) * z, vy: 0, phase: Math.random() * 6, rot: 0, sprite: Math.floor(Math.random() * this.sprites.length) });
    } else {
      // Feather drifting down
      this.lanterns.push({ kind: 'feather', x: Math.random() * W, y: anywhere ? Math.random() * H : -40, z, vx: 10 + Math.random() * 20, vy: (14 + Math.random() * 18) * z, phase: Math.random() * 6, rot: 0, sprite: Math.floor(Math.random() * this.feathers.length) });
    }
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
        color: ['#fff6e0', '#ffe27a', '#ffb02e', '#ff7a3d'][i % 4],
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
      const target = Math.round(10 * this.lanternRate);
      if (this.lanterns.length < target && Math.random() < dt * 1.5) this.spawnLantern();
      for (const l of this.lanterns) {
        l.phase += dt;
        if (l.kind === 'weed') {
          l.x += l.vx * dt;
          const hop = Math.abs(Math.sin(l.phase * 2.2)) * 26 * l.z;
          l.rot += (l.vx / (40 * l.z)) * dt;
          const sc = 0.4 + l.z * 0.7;
          b.save();
          b.globalAlpha = 0.35 + 0.5 * l.z;
          b.translate(l.x, l.y - hop);
          b.rotate(l.rot);
          b.drawImage(this.sprites[l.sprite], -48 * sc, -48 * sc, 96 * sc, 96 * sc);
          b.restore();
        } else {
          l.y += l.vy * dt;
          l.x += (l.vx + Math.sin(l.phase * 1.3) * 30) * dt;
          const sc = 0.35 + l.z * 0.45;
          b.save();
          b.globalAlpha = 0.25 + 0.45 * l.z;
          b.translate(l.x, l.y);
          b.rotate(Math.sin(l.phase * 1.7) * 0.8);
          b.drawImage(this.feathers[l.sprite], -20 * sc, -40 * sc, 40 * sc, 80 * sc);
          b.restore();
        }
      }
      b.globalAlpha = 1;
      this.lanterns = this.lanterns.filter((l) => l.x < W + 120 && l.y < H + 80);
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
