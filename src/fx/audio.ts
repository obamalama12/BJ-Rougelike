// All sound is synthesised with WebAudio: no assets required.
// SFX are banjo-ish plucks, woodblocks, quacks and honks; music is a generative
// saloon loop in the major pentatonic, with clip-clop percussion and a lonesome
// whistle when an Outlaw is at the table.

type Mood = 'menu' | 'table' | 'shop' | 'host' | 'silent';

const MAJOR = [0, 2, 4, 7, 9];
const MINOR = [0, 3, 5, 7, 10];
let HIRAJOSHI = MAJOR;

class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  sfxBus!: GainNode;
  musicBus!: GainNode;
  reverb!: ConvolverNode;
  reverbSend!: GainNode;
  /** Echo sends that follow each volume slider, so a muted bus leaves no echo behind. */
  musicWet!: GainNode;
  sfxWet!: GainNode;
  delay!: DelayNode;
  delaySend!: GainNode;
  sfxVol = 0.7;
  musicVol = 0.5;
  mood: Mood = 'silent';
  private timer: number | null = null;
  private nextBeat = 0;
  private beat = 0;
  private melodyIdx = 2;
  private chordRoot = 0;
  private droneNodes: { osc: OscillatorNode[]; gain: GainNode } | null = null;
  private lastSfx: Record<string, number> = {};

  unlock() {
    if (this.ctx) {
      // (Stay paused while both sliders are at zero.)
      if (this.ctx.state === 'suspended' && (this.sfxVol > 0 || this.musicVol > 0)) void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.sfxVol;
    this.sfxBus.connect(this.master);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.musicVol * 0.6;
    this.musicBus.connect(this.master);
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(2.8, 2.2);
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.35;
    this.reverbSend.connect(this.reverb).connect(this.master);
    // Music and effects reach the reverb through their own volume, not around it: the drone fed
    // the reverb directly, so with every slider at zero its echo still hummed.
    this.musicWet = ctx.createGain();
    this.musicWet.gain.value = this.wetFor(this.musicVol, 0.5);
    this.musicWet.connect(this.reverbSend);
    this.sfxWet = ctx.createGain();
    this.sfxWet.gain.value = this.wetFor(this.sfxVol, 0.7);
    this.sfxWet.connect(this.reverbSend);
    this.delay = ctx.createDelay(1.5);
    this.delay.delayTime.value = 0.39;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const dl = ctx.createBiquadFilter();
    dl.type = 'lowpass';
    dl.frequency.value = 2400;
    this.delay.connect(dl).connect(fb).connect(this.delay);
    this.delaySend = ctx.createGain();
    this.delaySend.gain.value = 0.22;
    this.delaySend.connect(this.delay);
    dl.connect(this.musicBus);
    if (this.mood !== 'silent') this.startMusic();
    if (this.sfxVol <= 0 && this.musicVol <= 0) void ctx.suspend();
  }

  private impulse(seconds: number, decay: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  /** Echo level for a slider: full echo at the default setting (as before), fading to none at zero. */
  private wetFor(vol: number, dflt: number) {
    return vol / dflt;
  }

  setVolumes(sfx: number, music: number) {
    this.sfxVol = sfx;
    this.musicVol = music;
    if (!this.ctx) return;
    this.sfxBus.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.05);
    this.musicBus.gain.setTargetAtTime(music * 0.6, this.ctx.currentTime, 0.2);
    this.musicWet.gain.setTargetAtTime(this.wetFor(music, 0.5), this.ctx.currentTime, 0.2);
    this.sfxWet.gain.setTargetAtTime(this.wetFor(sfx, 0.7), this.ctx.currentTime, 0.05);
    // Both sliders at zero: pause the whole engine, so nothing at all can be heard.
    if (sfx <= 0 && music <= 0) void this.ctx.suspend();
    else if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  // -------------------------------------------------------------------------
  // Primitive voices
  // -------------------------------------------------------------------------

  private freq(semi: number) {
    return 146.83 * Math.pow(2, semi / 12); // D3
  }

  private env(g: GainNode, t: number, a: number, peak: number, d: number) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  /** Koto-ish pluck. */
  pluck(f: number, t: number, vol: number, dest: AudioNode, bright = 1, dur = 0.9) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    o.type = 'sawtooth';
    o2.type = 'triangle';
    o.frequency.value = this.hz(f);
    o2.frequency.value = this.hz(f * 2.003);
    lp.type = 'lowpass';
    lp.Q.value = 3;
    lp.frequency.setValueAtTime(Math.min(12000, f * 9 * bright), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(200, f * 1.4), t + dur * 0.6);
    const g2 = ctx.createGain();
    g2.gain.value = 0.35;
    o.connect(lp);
    o2.connect(g2).connect(lp);
    lp.connect(g);
    this.env(g, t, 0.004, vol, dur);
    g.connect(dest);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.1);
    o2.stop(t + dur + 0.1);
    return g;
  }

  /** Keep a tone below the highest pitch the audio device can play (high combo notes overshot it). */
  private hz(f: number): number {
    return Math.min(f, (this.ctx?.sampleRate ?? 44100) / 2 - 1);
  }

  private bell(f: number, t: number, vol: number, dest: AudioNode, dur = 1.6) {
    const ctx = this.ctx!;
    const ratios = [1, 2.76, 5.4, 8.93];
    const g = ctx.createGain();
    this.env(g, t, 0.003, vol, dur);
    g.connect(dest);
    ratios.forEach((r, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = this.hz(f * r);
      const og = ctx.createGain();
      og.gain.value = 1 / (i + 1.4);
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
    return g;
  }

  private noise(t: number, dur: number, vol: number, dest: AudioNode, freq = 2000, q = 1, type: BiquadFilterType = 'bandpass') {
    const ctx = this.ctx!;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    this.env(g, t, 0.002, vol, dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t);
    return { f, g };
  }

  private drum(t: number, vol: number, dest: AudioNode, f0 = 110, f1 = 45, dur = 0.5) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(this.hz(f0), t);
    o.frequency.exponentialRampToValueAtTime(this.hz(f1), t + dur * 0.5);
    this.env(g, t, 0.003, vol, dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
    this.noise(t, 0.05, vol * 0.4, dest, 900, 0.7);
  }

  private wood(t: number, f: number, vol: number, dest: AudioNode) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(this.hz(f * 1.5), t);
    o.frequency.exponentialRampToValueAtTime(this.hz(f), t + 0.02);
    this.env(g, t, 0.001, vol, 0.12);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f;
    bp.Q.value = 6;
    o.connect(bp).connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.2);
  }

  /** A synthesised duck quack: buzzy source through a nasal formant, pitch drop. */
  quack(t: number, vol: number, dest: AudioNode, pitch = 1, goose = false) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const f0 = (goose ? 330 : 520) * pitch;
    const dur = goose ? 0.32 : 0.18;
    o.frequency.setValueAtTime(this.hz(f0 * 1.15), t);
    o.frequency.exponentialRampToValueAtTime(this.hz(f0), t + 0.04);
    o.frequency.exponentialRampToValueAtTime(this.hz(f0 * (goose ? 0.82 : 0.7)), t + dur);
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = goose ? 1100 : 1500;
    f1.Q.value = 4;
    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(goose ? 2100 : 2600, t);
    f2.frequency.exponentialRampToValueAtTime(goose ? 1500 : 1800, t + dur);
    f2.Q.value = 5;
    const g = ctx.createGain();
    this.env(g, t, 0.01, vol, dur);
    o.connect(f1).connect(g);
    o.connect(f2).connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Breathy whistle with vibrato (for the Outlaw theme). */
  private whistle(f: number, t: number, vol: number, dest: AudioNode, dur = 0.9) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(this.hz(f * 0.94), t);
    o.frequency.exponentialRampToValueAtTime(this.hz(f), t + 0.08);
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 5.5;
    lg.gain.value = f * 0.015;
    lfo.connect(lg).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.08);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    lfo.start(t);
    o.stop(t + dur + 0.05);
    lfo.stop(t + dur + 0.05);
  }

  // -------------------------------------------------------------------------
  // Sound effects
  // -------------------------------------------------------------------------

  private ok(name: string, gap = 0.03): boolean {
    if (!this.ctx) return false;
    const now = this.ctx.currentTime;
    if (now - (this.lastSfx[name] ?? -1) < gap) return false;
    this.lastSfx[name] = now;
    return true;
  }

  sfx(name: string, arg = 0) {
    if (!this.ctx || this.sfxVol <= 0) return;
    if (!this.ok(name, name === 'hover' ? 0.05 : 0.018)) return;
    const t = this.ctx.currentTime + 0.005;
    const out = this.sfxBus;
    const wet = this.sfxWet;
    switch (name) {
      case 'hover':
        this.wood(t, 1800 + Math.random() * 300, 0.05, out);
        break;
      case 'click':
        this.wood(t, 1200, 0.18, out);
        this.wood(t + 0.03, 1700, 0.08, out);
        break;
      case 'deal': {
        const n = this.noise(t, 0.11, 0.22, out, 3200, 0.6, 'highpass');
        n.f.frequency.exponentialRampToValueAtTime(900, t + 0.1);
        this.wood(t + 0.07, 900 + Math.random() * 200, 0.07, out);
        break;
      }
      case 'flip':
        this.noise(t, 0.05, 0.18, out, 4200, 1.2);
        this.wood(t + 0.01, 2400, 0.06, out);
        break;
      case 'shuffle':
        for (let i = 0; i < 9; i++) this.noise(t + i * 0.045, 0.06, 0.12, out, 2500 + Math.random() * 1500, 0.8);
        break;
      case 'chips': {
        const deg = HIRAJOSHI[arg % 5] + 12 * Math.floor(arg / 5);
        this.pluck(this.freq(12 + Math.min(deg, 26)), t, 0.22, out, 1.4, 0.45);
        this.pluck(this.freq(12 + Math.min(deg, 26)), t, 0.06, wet, 1.4, 0.45);
        break;
      }
      case 'mult': {
        const deg = HIRAJOSHI[arg % 5] + 12 * Math.floor(arg / 5);
        this.wood(t, 520 + Math.min(deg, 24) * 30, 0.32, out);
        this.pluck(this.freq(Math.min(deg, 24)), t, 0.16, out, 0.8, 0.35);
        break;
      }
      case 'xmult':
        this.bell(this.freq(-5 + (arg % 3) * 7), t, 0.22, out, 2.2);
        this.bell(this.freq(-5 + (arg % 3) * 7), t, 0.12, wet, 2.2);
        this.drum(t, 0.4, out, 90, 40, 0.6);
        break;
      case 'money':
        this.bell(1318, t, 0.11, out, 0.6);
        this.bell(1760, t + 0.07, 0.09, out, 0.7);
        break;
      case 'coin':
        this.bell(1568 + Math.random() * 200, t, 0.07, out, 0.35);
        break;
      case 'retrigger':
        this.pluck(this.freq(19), t, 0.12, out, 2, 0.25);
        this.pluck(this.freq(24), t + 0.05, 0.12, out, 2, 0.25);
        break;
      case 'quack':
        this.quack(t, 0.5, out, 0.9 + Math.random() * 0.25);
        break;
      case 'honk':
        this.quack(t, 0.55, out, 1, true);
        this.quack(t + 0.2, 0.45, out, 0.95, true);
        break;
      case 'win':
        this.quack(t + 0.32, 0.32, out, 1.1);
        [0, 4, 7, 12, 16].forEach((s, i) => this.pluck(this.freq(12 + s), t + i * 0.07, 0.17, out, 1.3, 0.9));
        [0, 4, 7, 12, 16].forEach((s, i) => this.pluck(this.freq(12 + s), t + i * 0.07, 0.07, wet, 1.3, 0.9));
        break;
      case 'blackjack':
        this.quack(t + 0.1, 0.4, out, 1.2);
        this.quack(t + 0.3, 0.4, out, 1.35);
        [0, 7, 12, 16, 19, 24].forEach((s, i) => this.bell(this.freq(12 + s), t + i * 0.06, 0.11, out, 1.4));
        this.drum(t, 0.5, out, 120, 45, 0.7);
        break;
      case 'lose':
        [7, 3, 2, -5].forEach((s, i) => this.pluck(this.freq(s), t + i * 0.12, 0.14, out, 0.6, 0.8));
        break;
      case 'bust':
        this.quack(t + 0.05, 0.5, out, 0.9, true);
        this.drum(t, 0.55, out, 70, 30, 0.8);
        this.noise(t, 0.4, 0.16, out, 500, 0.6, 'lowpass');
        this.pluck(this.freq(-12), t + 0.02, 0.18, out, 0.5, 0.8);
        break;
      case 'push':
        this.wood(t, 700, 0.2, out);
        this.wood(t + 0.12, 700, 0.15, out);
        break;
      case 'buy':
        this.bell(1046, t, 0.12, out, 0.5);
        this.bell(1568, t + 0.06, 0.12, out, 0.7);
        this.bell(2093, t + 0.12, 0.08, wet, 0.9);
        break;
      case 'sell':
        for (let i = 0; i < 4; i++) this.bell(1400 + i * 180, t + i * 0.04, 0.06, out, 0.35);
        break;
      case 'error':
        this.wood(t, 260, 0.3, out);
        this.wood(t + 0.09, 220, 0.3, out);
        break;
      case 'reroll':
        for (let i = 0; i < 5; i++) this.wood(t + i * 0.04, 900 + i * 160, 0.1, out);
        break;
      case 'pack':
        this.noise(t, 0.5, 0.18, out, 1200, 0.5, 'bandpass').f.frequency.exponentialRampToValueAtTime(6000, t + 0.45);
        this.bell(this.freq(24), t + 0.35, 0.1, wet, 1.5);
        break;
      case 'levelup':
        [0, 5, 7, 12].forEach((s, i) => this.bell(this.freq(19 + s), t + i * 0.05, 0.08, out, 1));
        break;
      case 'tick':
        this.wood(t, 2200 + (arg % 7) * 90, 0.05, out);
        break;
      case 'fire':
        this.noise(t, 0.9, 0.2, out, 600, 0.4, 'lowpass').f.frequency.exponentialRampToValueAtTime(3000, t + 0.6);
        break;
      case 'gong':
        this.bell(this.freq(-12), t, 0.3, out, 3.5);
        this.bell(this.freq(-12), t, 0.2, wet, 3.5);
        this.drum(t, 0.6, out, 80, 35, 1.2);
        break;
      case 'select':
        this.pluck(this.freq(19), t, 0.14, out, 1.5, 0.3);
        break;
      case 'shatter':
        for (let i = 0; i < 6; i++) this.bell(2400 + Math.random() * 2400, t + i * 0.02, 0.05, out, 0.3);
        this.noise(t, 0.25, 0.2, out, 6000, 0.6, 'highpass');
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Generative music
  // -------------------------------------------------------------------------

  setMood(m: Mood) {
    if (this.mood === m) return;
    this.mood = m;
    if (!this.ctx) return;
    this.updateDrone();
    if (!this.timer) this.startMusic();
  }

  private startMusic() {
    if (!this.ctx || this.timer) return;
    this.nextBeat = this.ctx.currentTime + 0.2;
    this.updateDrone();
    this.timer = window.setInterval(() => this.schedule(), 60);
  }

  private updateDrone() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    if (this.droneNodes) {
      const old = this.droneNodes;
      old.gain.gain.setTargetAtTime(0.0001, t, 0.8);
      setTimeout(() => old.osc.forEach((o) => o.stop()), 4000);
      this.droneNodes = null;
    }
    if (this.mood === 'silent') return;
    const root = this.mood === 'host' ? -13 : this.mood === 'shop' ? -7 : -12;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.gain.setTargetAtTime(this.mood === 'host' ? 0.09 : 0.06, t, 1.5);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoG.gain.value = 240;
    lfo.connect(lfoG).connect(lp.frequency);
    const osc: OscillatorNode[] = [lfo];
    for (const [semi, det] of [[root, -6], [root, 7], [root + 7, 3], [root + 12, -2]] as [number, number][]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = this.hz(this.freq(semi));
      o.detune.value = det;
      o.connect(lp);
      osc.push(o);
    }
    lp.connect(g);
    g.connect(this.musicBus);
    g.connect(this.musicWet);
    osc.forEach((o) => o.start());
    this.droneNodes = { osc, gain: g };
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || this.mood === 'silent' || this.musicVol <= 0) {
      if (ctx) this.nextBeat = ctx.currentTime + 0.1;
      return;
    }
    const bpm = this.mood === 'host' ? 84 : this.mood === 'shop' ? 92 : this.mood === 'menu' ? 66 : 76;
    const step = 60 / bpm / 2;
    while (this.nextBeat < ctx.currentTime + 0.25) {
      this.playStep(this.nextBeat, this.beat);
      this.nextBeat += step * (this.beat % 2 === 0 ? 1.08 : 0.92); // gentle swing
      this.beat++;
    }
  }

  private playStep(t: number, b: number) {
    const bus = this.musicBus;
    HIRAJOSHI = this.mood === 'host' ? MINOR : MAJOR;
    const r = Math.random();
    const bar = Math.floor(b / 16);
    if (b % 64 === 0) this.chordRoot = (this.mood === 'host' ? [0, -2, 3, -4] : [0, 5, 7, 0])[bar / 4 % 4 | 0] ?? 0;
    const scaleNote = (i: number) => {
      const oct = Math.floor(i / 5);
      return HIRAJOSHI[((i % 5) + 5) % 5] + 12 * oct + this.chordRoot;
    };
    // Koto melody: sparse random walk.
    const density = this.mood === 'menu' ? 0.3 : this.mood === 'shop' ? 0.55 : this.mood === 'host' ? 0.45 : 0.42;
    if (b % 2 === 0 && r < density) {
      this.melodyIdx += Math.floor(Math.random() * 5) - 2;
      this.melodyIdx = Math.max(3, Math.min(13, this.melodyIdx));
      const f = this.freq(scaleNote(this.melodyIdx));
      const g = this.pluck(f, t, 0.11, bus, 1.6, this.mood === 'host' ? 1.1 : 0.55);
      g.connect(this.delaySend);
      g.connect(this.musicWet);
      if (Math.random() < 0.18) this.pluck(f * 1.5, t + 0.09, 0.05, bus, 1, 0.9).connect(this.musicWet);
    }
    // Bass pulse
    if (b % 8 === 0) {
      const f = this.freq(scaleNote(0) - 12);
      this.pluck(f, t, 0.13, bus, 0.4, 1.6);
    }
    // Taiko & woodblock
    // Clip-clop: alternating woodblocks like hooves on the trail
    const clip = b % 4 === 0 ? 900 : b % 4 === 1 ? 700 : 0;
    if (this.mood === 'host') {
      if (b % 8 === 0) this.drum(t, 0.3, bus, 95, 42, 0.7);
      if (clip) this.wood(t, clip, 0.05, bus);
      // Lonesome showdown whistle
      if (b % 16 === 0 && Math.random() < 0.7) {
        const n = scaleNote(8 + Math.floor(Math.random() * 4)) + 12;
        const w = this.freq(n);
        this.whistle(w, t, 0.05, bus, 1.4);
        this.whistle(w, t, 0.025, this.musicWet, 1.4);
      }
    } else if (this.mood === 'shop') {
      if (clip) this.wood(t, clip + 200, 0.05, bus);
      if (b % 8 === 4) this.pluck(this.freq(scaleNote(5)), t, 0.06, bus, 1.6, 0.25);
      if (b % 16 === 8) this.drum(t, 0.12, bus, 110, 60, 0.4);
    } else if (this.mood === 'table') {
      if (clip) this.wood(t, clip, 0.035, bus);
      if (b % 16 === 0) this.drum(t, 0.14, bus, 90, 45, 0.6);
    } else if (this.mood === 'menu') {
      if (clip && b % 8 < 4) this.wood(t, clip, 0.03, bus);
    }
    // Wind chime shimmer
    if (b % 32 === 24 && Math.random() < 0.5) {
      for (let i = 0; i < 3; i++) this.bell(this.freq(scaleNote(10 + i * 2) + 12), t + i * 0.11, 0.025, this.musicWet, 2);
    }
  }
}

export const audio = new AudioEngine();
export const sfx = (name: string, arg = 0) => audio.sfx(name, arg);
