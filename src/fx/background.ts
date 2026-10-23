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
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < ${octaves}; i++){ v += a*noise(p); p = m*p; a *= 0.5; }
  return v;
}

void main(){
  vec2 p = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;
  float t = uTime * 0.035;
  // slow swirl around the centre
  float ang = uSpin * 0.25 * sin(t*0.7) + length(p)*0.35*uSpin;
  mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
  vec2 sp = rot * p;

  vec2 q = vec2(fbm(sp*1.5 + vec2(0.0, t)), fbm(sp*1.5 + vec2(5.2, -t*0.8)));
  vec2 r = vec2(fbm(sp*1.9 + 3.2*q + vec2(1.7, 9.2) + t*1.2), fbm(sp*1.9 + 3.2*q + vec2(8.3, 2.8) - t));
  float f = fbm(sp*1.7 + 3.6*r);

  // woodblock banding: quantise with soft edges
  float bands = 7.0;
  float fb = floor(f*bands)/bands;
  float edge = smoothstep(0.0, 0.08, fract(f*bands)) ;
  float fq = mix(fb, f, 0.35 + 0.25*edge);

  vec3 col = mix(uA, uB, clamp(fq*fq*2.4, 0.0, 1.0));
  col = mix(col, uC, clamp(length(q) - 0.45, 0.0, 1.0) * 0.85);
  col = mix(col, uD, clamp(r.x*r.x*1.6 - 0.15, 0.0, 1.0) * 0.45);

  // ink contour ripples
  float ripple = abs(fract(f*bands) - 0.5);
  col += uC * smoothstep(0.035, 0.0, abs(ripple - 0.47)) * 0.12;

  // moon
  vec2 mp = p - vec2(0.66, 0.3);
  float md = length(mp);
  float cloud = fbm(p*3.0 + vec2(t*2.0, 0.0));
  float moon = smoothstep(0.115, 0.108, md);
  float crater = fbm(mp*18.0) * 0.25;
  vec3 moonCol = mix(vec3(1.0, 0.93, 0.78), vec3(1.0, 0.82, 0.55), crater + mp.y*1.5);
  float veil = smoothstep(0.42, 0.75, cloud);
  col = mix(col, moonCol, moon * (1.0 - veil*0.85) * uMoon);
  col += vec3(1.0, 0.75, 0.45) * exp(-md*8.0) * 0.3 * uMoon;

  // stars
  vec2 sg = gl_FragCoord.xy / 3.0;
  float st = hash(floor(sg));
  float tw = 0.5 + 0.5*sin(uTime*1.5 + st*40.0);
  col += vec3(1.0, 0.9, 0.75) * step(0.9975, st) * tw * (1.0 - smoothstep(0.2, 0.9, f)) * 0.8;

  // pulse when scoring
  col *= 1.0 + uPulse*0.35;
  col += uC * uPulse * 0.08;

  // vignette
  vec2 uv = gl_FragCoord.xy / uRes;
  float vig = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(1.25, 1.0)));
  col *= mix(0.45, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

export type Palette = [string, string, string, string];

export const PALETTES: Record<string, Palette> = {
  menu: ['#0b0820', '#2a1a5e', '#ff6a3d', '#3fd1c8'],
  select: ['#0a0a22', '#22246a', '#ffb03d', '#5a3dff'],
  table: ['#07101c', '#123a4a', '#ff8a3d', '#2a5cff'],
  shop: ['#140818', '#4a1a52', '#ffcf3d', '#ff3d7a'],
  host: ['#120406', '#4a0f1a', '#ff3d2a', '#7a2aff'],
  pack: ['#0a0620', '#3a1f7a', '#c9b8ff', '#ff7ad9'],
  over: ['#050508', '#1a1a2a', '#6a6a8a', '#3a2a4a'],
  victory: ['#120a04', '#5a3a0a', '#ffd23f', '#ff7a3d'],
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
