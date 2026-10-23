// Animated WebGL background: domain-warped ink nebula with woodblock banding,
// a cloud-veiled moon and drifting stars. Palettes cross-fade per scene.

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = (octaves: number) => `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uA, uB, uC, uD;
uniform float uPulse;
uniform float uMoon;
uniform float uSpin;

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float hash1(float x){ return fract(sin(x*127.1)*43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float noise1(float x){ float i = floor(x), f = fract(x); return mix(hash1(i), hash1(i+1.0), f*f*(3.0-2.0*f)); }
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < ${octaves}; i++){ v += a*noise(p); p = m*p; a *= 0.5; }
  return v;
}
// Mesa skyline: flat-topped buttes with steep sides.
float mesa(float x, float seed, float base, float amp){
  float n = noise1(x*2.2 + seed);
  float plateau = smoothstep(0.42, 0.58, n);
  float bumps = noise1(x*9.0 + seed*3.0) * 0.015;
  return base + amp * plateau + bumps;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;
  float t = uTime;

  // Banded sunset sky (woodcut-style posterised gradient)
  float h = uv.y;
  float bands = 9.0;
  float hb = floor(h*bands)/bands;
  float hq = mix(hb, h, 0.25);
  vec3 sky = mix(uC, uB, smoothstep(0.25, 0.65, hq));
  sky = mix(sky, uA, smoothstep(0.6, 1.0, hq));

  // Drifting striped clouds
  vec2 cp = vec2(p.x*1.4 + t*0.012*uSpin, p.y*5.0);
  float c = fbm(cp + vec2(0.0, 3.0));
  float cloud = smoothstep(0.55, 0.62, c) * smoothstep(0.35, 0.6, uv.y);
  float cloudBand = step(0.5, fract(c*8.0));
  sky = mix(sky, mix(uC, vec3(1.0, 0.85, 0.7), 0.4 + 0.2*cloudBand), cloud*0.55);

  // Sun sitting on the horizon, with retro slice bands
  vec2 sp = p - vec2(0.42, -0.12);
  float sd = length(sp);
  float sun = smoothstep(0.24, 0.235, sd);
  float slices = step(0.0, sin((p.y + 0.3) * 70.0 - t*0.8)) + step(0.06, p.y + 0.12);
  sun *= clamp(slices, 0.0, 1.0);
  vec3 sunCol = mix(vec3(1.0, 0.86, 0.45), vec3(1.0, 0.45, 0.25), smoothstep(0.1, -0.12, sp.y));
  sky = mix(sky, sunCol, sun * uMoon);
  sky += vec3(1.0, 0.55, 0.25) * exp(-sd*4.5) * 0.35 * uMoon;

  // Stars in the upper sky
  vec2 sg = gl_FragCoord.xy / 3.0;
  float st = hash(floor(sg));
  float tw = 0.5 + 0.5*sin(t*1.5 + st*40.0);
  sky += vec3(1.0, 0.9, 0.75) * step(0.9975, st) * tw * smoothstep(0.6, 0.95, uv.y) * 0.9;

  vec3 col = sky;
  // Three layers of mesas, far to near
  float x = p.x;
  float m1 = mesa(x*0.8 + 3.0, 1.0, -0.1, 0.16);
  float m2 = mesa(x*1.1 - 7.0, 5.0, -0.22, 0.13);
  float m3 = mesa(x*1.5 + 11.0, 9.0, -0.36, 0.1);
  vec3 far = mix(uD, sky, 0.55);
  vec3 mid = mix(uD, sky, 0.3);
  vec3 near = uD * 0.7;
  col = mix(col, far, step(p.y, m1));
  col = mix(col, mid, step(p.y, m2));
  col = mix(col, near, step(p.y, m3));
  // rim light on the near mesa tops
  col += uC * 0.25 * smoothstep(0.012, 0.0, abs(p.y - m3)) * step(p.y, m3 + 0.01);
  // Desert floor stripes
  float ground = step(p.y, -0.42);
  float rows = step(0.5, fract((p.y + 0.42) * 30.0 / max(0.05, -p.y + 0.2)));
  col = mix(col, uD * (0.45 + 0.08*rows), ground);

  // Blowing dust
  float dust = fbm(vec2(p.x*3.0 - t*0.15*uSpin, p.y*6.0));
  col += uC * smoothstep(0.6, 0.85, dust) * 0.08 * smoothstep(0.1, -0.5, p.y);

  // pulse when scoring
  col *= 1.0 + uPulse*0.3;
  col += uC * uPulse * 0.08;

  float vig = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(1.25, 1.0)));
  col *= mix(0.5, 1.0, vig);
  gl_FragColor = vec4(col, 1.0);
}
`;

export type Palette = [string, string, string, string];

export const PALETTES: Record<string, Palette> = {
  menu: ['#1b1040', '#8a2a5a', '#ff8a3d', '#4a1e2a'],
  select: ['#14123a', '#6a2a6a', '#ffa64a', '#3a1a2a'],
  table: ['#101030', '#4a2058', '#ff7a3d', '#2a1222'],
  shop: ['#2a1030', '#a03a4a', '#ffc34a', '#4a2414'],
  host: ['#1a0408', '#6a0f14', '#ff4a2a', '#240608'],
  pack: ['#1a1040', '#5a2a8a', '#ffb0d0', '#2a1438'],
  over: ['#08080c', '#24202e', '#7a6a6a', '#141018'],
  victory: ['#3a1a08', '#c2501a', '#ffe27a', '#5a2a10'],
};

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

class Background {
  canvas!: HTMLCanvasElement;
  gl: WebGLRenderingContext | null = null;
  prog: WebGLProgram | null = null;
  quality: 'high' | 'low' | 'off' = 'high';
  cur: number[][] = PALETTES.menu.map(hex);
  target: number[][] = PALETTES.menu.map(hex);
  pulse = 0;
  moon = 1;
  moonTarget = 1;
  spin = 1;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private start = performance.now();
  private raf = 0;
  private last = 0;

  mount(canvas: HTMLCanvasElement, quality: 'high' | 'low' | 'off') {
    this.canvas = canvas;
    this.setQuality(quality);
    window.addEventListener('resize', () => this.resize());
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      this.frame(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  setQuality(q: 'high' | 'low' | 'off') {
    this.quality = q;
    if (q === 'off') {
      this.canvas.style.display = 'none';
      return;
    }
    this.canvas.style.display = 'block';
    const gl = this.canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
    if (!gl) {
      this.canvas.style.display = 'none';
      return;
    }
    this.gl = gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG(q === 'high' ? 5 : 3)));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    this.prog = prog;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    for (const u of ['uRes', 'uTime', 'uA', 'uB', 'uC', 'uD', 'uPulse', 'uMoon', 'uSpin']) this.loc[u] = gl.getUniformLocation(prog, u);
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const scale = this.quality === 'high' ? 0.6 : 0.35;
    const w = Math.max(1, Math.floor(window.innerWidth * scale));
    const hh = Math.max(1, Math.floor(window.innerHeight * scale));
    this.canvas.width = w;
    this.canvas.height = hh;
    this.gl?.viewport(0, 0, w, hh);
  }

  setPalette(name: keyof typeof PALETTES | Palette, moon?: number) {
    const p = typeof name === 'string' ? PALETTES[name] : name;
    this.target = p.map(hex);
    if (moon !== undefined) this.moonTarget = moon;
  }

  bump(v = 1) {
    this.pulse = Math.min(1.2, this.pulse + 0.35 * v);
  }

  private frame(now: number) {
    const gl = this.gl;
    if (!gl || this.quality === 'off' || document.hidden) return;
    // Cap at ~45fps on low quality.
    if (this.quality === 'low' && now - this.last < 22) return;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) this.cur[i][j] += (this.target[i][j] - this.cur[i][j]) * Math.min(1, dt * 1.6);
    this.pulse *= Math.pow(0.04, dt);
    this.moon += (this.moonTarget - this.moon) * Math.min(1, dt * 1.5);
    const t = (now - this.start) / 1000;
    gl.uniform2f(this.loc.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.loc.uTime, t);
    gl.uniform3fv(this.loc.uA, this.cur[0]);
    gl.uniform3fv(this.loc.uB, this.cur[1]);
    gl.uniform3fv(this.loc.uC, this.cur[2]);
    gl.uniform3fv(this.loc.uD, this.cur[3]);
    gl.uniform1f(this.loc.uPulse, this.pulse);
    gl.uniform1f(this.loc.uMoon, this.moon);
    gl.uniform1f(this.loc.uSpin, this.spin);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

export const background = new Background();
