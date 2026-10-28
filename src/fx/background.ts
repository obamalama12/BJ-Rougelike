// Animated WebGL background: a painted desert sunset. Smooth sky, a bloomed sun with soft rays,
// wispy clouds lit from below, and four mesa ridges fading into haze. Palettes cross-fade per scene.

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = (octaves: number) => `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
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

// Ridge height: flat-topped buttes with a second tier and eroded edges.
float ridge(float x, float seed, float base, float amp, float freq){
  float n = noise1(x*freq + seed);
  // Steep cliffs, flat tops, a smaller second step, and only a little erosion on the edges.
  float plateau = smoothstep(0.47, 0.53, n);
  float tier = smoothstep(0.5, 0.54, noise1(x*freq*2.4 + seed*1.7)) * 0.28;
  float rough = (noise1(x*freq*16.0 + seed*3.0) - 0.5) * 0.006 * (0.3 + plateau);
  return base + amp*(plateau + tier*plateau) + rough;
}

vec3 layer(vec3 col, vec2 p, float top, vec3 base, vec3 rim, float aa, float seed){
  float cov = smoothstep(top + aa, top - aa, p.y);
  float depth = max(0.0, top - p.y);
  // Darker toward the base, faint horizontal strata, a lit rim along the top edge.
  float strata = noise(vec2(p.x*3.0 + seed, p.y*55.0));
  vec3 c = base * (1.0 - 0.22*smoothstep(0.0, 0.3, depth));
  c *= 0.93 + 0.1*strata;
  c += rim * smoothstep(0.008, 0.0, depth);
  return mix(col, c, cov);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;
  float t = uTime;
  float aa = 1.6 / uRes.y;
  vec2 sunP = vec2(0.42, -0.02);
  vec2 sp = p - sunP;
  float sd = length(sp);

  // Sky: smooth gradient with a warm glow around the sun.
  float h = uv.y;
  vec3 sky = mix(uC, uB, smoothstep(0.28, 0.72, h));
  sky = mix(sky, uA, smoothstep(0.6, 1.08, h));
  sky += uC * exp(-sd*2.6) * 0.38 * uMoon;
  sky = mix(sky, vec3(1.0, 0.86, 0.6), exp(-sd*11.0) * 0.4 * uMoon);

  // Stars: soft points that fade out toward the horizon.
  float px = max(1.0, uRes.y / 700.0);
  vec2 sg = gl_FragCoord.xy / (3.0*px);
  vec2 f = fract(sg) - 0.5;
  float st = hash(floor(sg));
  float star = step(0.9968, st) * smoothstep(0.45, 0.0, length(f));
  sky += vec3(1.0, 0.93, 0.82) * star * (0.55 + 0.45*sin(t*1.2 + st*60.0)) * smoothstep(0.62, 1.0, h) * 0.85;

  // Wispy clouds, warmer and brighter underneath, drifting slowly.
  vec2 cp = vec2(p.x*1.05 + t*0.005*uSpin, p.y*3.4 - 0.5);
  float warp = fbm(cp*1.8 + vec2(t*0.004, 0.0));
  float c = fbm(cp*1.25 + vec2(warp*0.7, warp*0.25));
  float cmask = smoothstep(0.5, 0.78, c) * smoothstep(0.34, 0.58, h) * (1.0 - smoothstep(0.9, 1.02, h));
  float under = smoothstep(0.62, 0.38, h);
  vec3 cloudCol = mix(mix(uB, uA, 0.35), mix(uC, vec3(1.0, 0.86, 0.72), 0.45), under);
  cloudCol += uC * exp(-sd*2.6) * 0.45 * uMoon;
  sky = mix(sky, cloudCol, cmask * 0.7);

  // The sun, sitting low, with a soft limb and long rays.
  float sun = smoothstep(0.13 + aa, 0.13 - aa, sd);
  vec3 sunCol = mix(vec3(1.0, 0.93, 0.66), vec3(1.0, 0.56, 0.3), smoothstep(0.1, -0.12, sp.y));
  sky = mix(sky, sunCol, sun * uMoon);
  float ang = atan(sp.y, sp.x);
  float rays = noise1(ang*7.0 + t*0.04) * noise1(ang*19.0 - t*0.025);
  sky += mix(uC, vec3(1.0, 0.85, 0.6), 0.4) * rays * exp(-sd*2.2) * 0.22 * uMoon;

  vec3 col = sky;
  vec3 haze = mix(uC, sky, 0.55);
  vec3 rim = mix(uC, vec3(1.0, 0.82, 0.55), 0.4) * 0.55 * uMoon;

  // Four ridges, far to near: more haze far away, darker and warmer up close.
  float x = p.x;
  col = layer(col, p, ridge(x, 1.0, -0.07, 0.15, 1.3), mix(uD, haze, 0.74), rim*0.25, aa, 1.0);
  col = mix(col, haze, 0.1 * smoothstep(-0.05, -0.2, p.y));
  col = layer(col, p, ridge(x, 5.0, -0.17, 0.14, 1.7), mix(uD, haze, 0.5), rim*0.4, aa, 5.0);
  col = mix(col, haze, 0.08 * smoothstep(-0.15, -0.3, p.y));
  col = layer(col, p, ridge(x, 9.0, -0.28, 0.12, 2.2), mix(uD, haze, 0.22), rim*0.6, aa, 9.0);
  col = layer(col, p, ridge(x, 13.0, -0.4, 0.07, 3.0), uD*0.62, rim*0.8, aa, 13.0);

  // Desert floor: dark, with soft dune shading.
  float gTop = -0.43 + (noise1(x*2.0 + 4.0) - 0.5) * 0.02;
  float gCov = smoothstep(gTop + aa, gTop - aa, p.y);
  float dune = fbm(vec2(x*2.5, p.y*9.0));
  vec3 ground = uD * (0.5 + 0.12*dune) * (1.0 - 0.35*smoothstep(gTop, -0.5, p.y));
  col = mix(col, ground, gCov);

  // Drifting dust low in the air.
  float dust = fbm(vec2(p.x*2.2 - t*0.05*uSpin, p.y*5.0 + t*0.02));
  col += mix(uC, vec3(1.0, 0.85, 0.65), 0.3) * smoothstep(0.55, 0.85, dust) * 0.06 * smoothstep(0.0, -0.45, p.y);

  // Scoring pulse
  col *= 1.0 + uPulse*0.22;
  col += uC * uPulse * 0.05;

  // Soft vignette and a little dithering so gradients never band.
  float vig = smoothstep(1.35, 0.3, length((uv - 0.5) * vec2(1.2, 1.0)));
  col *= mix(0.55, 1.0, vig);
  col += (hash(gl_FragCoord.xy + fract(t)*97.0) - 0.5) / 160.0;
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
  /** Frames between redraws: the sky drifts slowly, so 30fps looks the same as 60 for half the work. */
  private every = 2;
  private tick = 0;
  /** Automatic step-down for devices that can't keep up: 0 as set, 1 low quality, 2 low and slower still. */
  private strain = 0;
  private slow = 0;
  private frames = 0;
  private prevNow = 0;

  mount(canvas: HTMLCanvasElement, quality: 'high' | 'low' | 'off') {
    this.canvas = canvas;
    this.setQuality(quality);
    window.addEventListener('resize', () => this.resize());
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      this.watch(now);
      if (++this.tick % this.every === 0) this.frame(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  /** Watch how long whole frames take; if the page keeps dropping below ~35fps, make the sky cheaper. */
  private watch(now: number) {
    const dt = now - this.prevNow;
    this.prevNow = now;
    // Ignore gaps from a hidden tab or a breakpoint.
    if (dt > 250 || document.hidden || this.quality === 'off') return;
    this.frames++;
    if (dt > 28) this.slow++;
    if (this.frames < 120) return;
    const struggling = this.slow > 60;
    this.frames = 0;
    this.slow = 0;
    if (!struggling || this.strain >= 2) return;
    this.strain++;
    if (this.strain === 1 && this.quality === 'high') this.setQuality('low', true);
    else {
      this.strain = 2;
      this.every = 4;
    }
  }

  setQuality(q: 'high' | 'low' | 'off', auto = false) {
    if (!auto) {
      this.strain = 0;
      this.every = 2;
    }
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
    // Edges are antialiased in the shader, so a smooth upscale from slightly below native looks clean.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    // The sky is all soft gradients; drawing it below native size and letting it scale up costs
    // far less and looks the same.
    const scale = this.quality === 'high' ? 0.6 * dpr : 0.45;
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
