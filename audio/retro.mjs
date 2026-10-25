import { SeededRandom } from './soundscape.mjs';
import { RetroPlan } from './retro-plan.mjs';
import { createClearRetroTone, sampleClearRetroTone, createClearRetroDrum, sampleClearRetroDrum } from './retro-clear.mjs';
import { mixRetroSeed } from '../retro-styles.mjs';
import { CozyRetroSoundscape } from './retro-cozy.mjs';

const TAU = 2 * Math.PI;
const SIZE = 2048;
const HARMONICS = [1, 2, 4, 8, 16, 32];
const SINE = Float32Array.from({ length: SIZE + 1 }, (_, index) => Math.sin(TAU * index / SIZE));
const COSINE = Float32Array.from({ length: SIZE + 1 }, (_, index) => Math.cos(TAU * index / SIZE));
const TABLES = new Map();
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smooth = (value) => value ** 3 * (10 + value * (-15 + value * 6));

function lookup(table, phase) {
  const position = phase * SIZE, index = Math.floor(position);
  return table[index] + (table[index + 1] - table[index]) * (position - index);
}

for (const instrument of ['round-pulse', 'narrow-pulse', 'triangle', 'pluck', 'pad', 'keys']) {
  for (const harmonics of HARMONICS) {
    const table = new Float32Array(SIZE + 1);
    const weights = Array.from({ length: harmonics }, (_, index) => {
      const n = index + 1;
      if (instrument === 'triangle') return n % 2 ? (-1) ** ((n - 1) / 2) / n ** 2 : 0;
      if (instrument === 'pluck' || instrument === 'keys') return n <= 5 ? Math.exp(-n * (instrument === 'keys' ? 0.35 : 0.5)) / n : 0;
      const duty = instrument === 'narrow-pulse' ? 0.25 : 0.5;
      return Math.sin(n * Math.PI * duty) / n * Math.exp(-n * (instrument === 'pad' ? 0.3 : 0.1));
    });
    const scale = weights.reduce((sum, weight) => sum + Math.abs(weight), 0);
    for (let index = 0; index <= SIZE; index++) {
      for (let harmonic = 1; harmonic <= harmonics; harmonic++) {
        const phase = TAU * harmonic * index / SIZE;
        const wave = ['triangle', 'pluck', 'keys'].includes(instrument) ? Math.sin(phase) : Math.cos(phase);
        table[index] += weights[harmonic - 1] * wave / scale;
      }
    }
    TABLES.set(`${instrument}:${harmonics}`, table);
  }
}

export class RetroSoundscape {
  constructor(sampleRate, params, seed) {
    this.sampleRate = sampleRate;
    this.seed = seed;
    this.selection = this.requestedStyle = params.style;
    this.plan = new RetroPlan(seed, params.style);
    this.cozy = this.plan.style.sound === 'cozy' ? new CozyRetroSoundscape(sampleRate, this.plan, seed) : null;
    this.noteSerial = 0;
    this.voices = [];
    this.drums = [];
    this.beats = 0;
    this.step = 0;
    this.nextStepBeat = 0;
    this.transition = null;
    this.random = new SeededRandom(seed ^ 0xb5297a4d);
    this.bedRandom = new SeededRandom(seed ^ 0x1b56c4e9);
    this.roomLeft = new Float32Array(Math.ceil(sampleRate * 0.241));
    this.roomRight = new Float32Array(Math.ceil(sampleRate * 0.367));
    this.noiseHigh = this.noiseLow = this.drumLow = 0;
    this.lowLeft = this.lowRight = this.echoLowLeft = this.echoLowRight = 0;
    this.lowBed = 0;
    this.coefficient = this.coefficientStep = 0;
    this.wowPhase = (seed >>> 0) / 4294967296;
    this.sway = this.swayStep = 0;
    this.left = this.right = 0;
    this.bedCoefficient = 1 - Math.exp(-TAU * 700 / sampleRate);
    this.highCoefficient = 1 - Math.exp(-TAU * 30 / sampleRate);
    this.drumCoefficient = 1 - Math.exp(-TAU * Math.min(6000, sampleRate * 0.35) / sampleRate);
    this.echoCoefficient = 1 - Math.exp(-TAU * Math.min(2200, sampleRate * 0.35) / sampleRate);
  }

  setParams(params, frame) {
    if (params.style === this.requestedStyle) return;
    this.requestedStyle = params.style;
    
    if (this.transition?.phase !== 'out') {
      this.transition = { phase: 'out', start: frame, from: this.characterGain(frame) };
    }
  }

  characterGain(frame) {
    if (!this.transition) return 1;
    const { phase, start, from } = this.transition;
    const position = clamp((frame - start) / (this.sampleRate * (phase === 'out' ? 1 : 4)), 0, 1);
    return phase === 'out' ? from * (1 - smooth(position)) : smooth(position);
  }

  advanceCharacter(frame) {
    if (this.transition?.phase === 'out' && frame >= this.transition.start + this.sampleRate) {
      this.selection = this.requestedStyle;
      this.plan = new RetroPlan(this.seed, this.selection);
      this.noteSerial = 0;
      
      this.voices.length = this.drums.length = 0;
      this.cozy = this.plan.style.sound === 'cozy' ? new CozyRetroSoundscape(this.sampleRate, this.plan, this.seed) : null;
      this.roomLeft.fill(0); this.roomRight.fill(0);
      this.lowLeft = this.lowRight = this.echoLowLeft = this.echoLowRight = this.drumLow = 0;
      this.step = 0;
      this.nextStepBeat = this.beats;
      this.transition = { phase: 'in', start: frame };
    } else if (this.transition?.phase === 'in' && frame >= this.transition.start + this.sampleRate * 4) {
      this.transition = null;
    }
  }

  addEvent(event, tempo) {
    const duration = event.beats * 60 / tempo;
    const age = -Math.round((event.delay ?? 0) * 60 / tempo * this.sampleRate);
    if (event.drum) {
      if (this.drums.length < 8) this.drums.push({ ...event, phase: 0, age, duration,
        clear: this.plan.style.sound === 'clear' ? createClearRetroDrum(this.sampleRate) : null });
      return;
    }
    const clear = this.plan.style.sound === 'clear';
    const headroom = clear ? 1.005 : 1.003;
    if (this.voices.length >= 28 || event.frequency * headroom >= this.sampleRate * 0.45) return;
    const safe = this.sampleRate * 0.45 / (event.frequency * headroom);
    const harmonics = HARMONICS.filter((count) => count <= safe).at(-1);
    const fundamental = ['triangle', 'pluck', 'keys'].includes(event.instrument) ? SINE : COSINE;
    this.voices.push({ ...event, duration, phase: 0, age, retire: Infinity, fundamental, harmonics, table: TABLES.get(`${event.instrument}:${harmonics}`),
      clear: clear ? createClearRetroTone(event.instrument, event.frequency, this.sampleRate, mixRetroSeed(this.seed ^ this.noteSerial++)) : null });
  }

  sample(params, frame) {
    const sr = this.sampleRate, time = frame / sr;
    this.advanceCharacter(frame);
    const characterGain = this.characterGain(frame);
    if (this.cozy) {
      this.cozy.sample(params, frame);
      this.left = this.cozy.left * characterGain; this.right = this.cozy.right * characterGain;
      this.step = this.cozy.step; this.beats = this.cozy.beats;
      this.voices = this.cozy.voices; this.drums = this.cozy.drums;
      return this;
    }
    if (frame % 128 === 0) {
      const cutoff = Math.min(sr * 0.4, 7200 - params.warmth * 51);
      this.coefficientStep = (1 - Math.exp(-TAU * cutoff / sr) - this.coefficient) / 128;
      this.swayStep = (Math.sin(time * TAU / 29) * 0.1 - this.sway) / 128;
    }
    this.coefficient += this.coefficientStep; this.sway += this.swayStep;
    while (this.beats >= this.nextStepBeat) {
      for (const event of this.plan.events(this.step)) this.addEvent(event, params.tempo);
      this.step++;
      this.nextStepBeat += 0.25;
    }
    this.beats += params.tempo / (60 * sr);
    const wow = lookup(SINE, this.wowPhase);
    this.wowPhase = (this.wowPhase + 0.19 / sr) % 1;
    const pitch = 1 + wow * 0.0029 * params.drift / 100;
    const width = params.width / 100;
    const warmth = params.warmth / 100;
    let left = 0, right = 0;
    for (let index = this.voices.length - 1; index >= 0; index--) {
      const voice = this.voices[index], age = voice.age / sr;
      if (age >= voice.duration || frame >= voice.retire) { this.voices.splice(index, 1); continue; }
      if (age < 0) { voice.age++; continue; }
      const attackTime = voice.instrument === 'pad' ? 0.16 : voice.role === 'bass' ? 0.025 : 0.018;
      const attack = Math.min(1, age / attackTime);
      const release = Math.min(1, (voice.duration - age) / Math.min(0.3, voice.duration * 0.4));
      let envelope = attack * attack * (3 - 2 * attack) * release * release * (3 - 2 * release);
      envelope *= Math.min(1, (voice.retire - frame) / (sr * 0.25));
      if (!voice.clear && voice.instrument === 'pluck') envelope *= Math.exp(-age / voice.duration * 4);
      if (!voice.clear && voice.instrument === 'keys') envelope *= Math.exp(-age / voice.duration * 2);
      const fundamental = lookup(voice.fundamental, voice.phase);
      const wave = voice.clear ? sampleClearRetroTone(voice.clear, voice.phase, age, voice.duration, pitch, warmth)
        : lookup(voice.table, voice.phase) * (1 - warmth * 0.5) + fundamental * warmth * 0.5;
      const level = params[voice.role] / 100;
      const sound = wave * envelope * voice.amplitude * level;
      const pan = clamp((voice.pan + (voice.role === 'bass' ? 0 : this.sway)) * width, -0.8, 0.8);
      left += sound * (1 - pan) * Math.SQRT1_2;
      right += sound * (1 + pan) * Math.SQRT1_2;
      voice.phase = (voice.phase + voice.frequency * pitch / sr) % 1;
      voice.age++;
    }
    let drums = 0;
    for (let index = this.drums.length - 1; index >= 0; index--) {
      const voice = this.drums[index], age = voice.age / sr;
      if (age >= voice.duration) { this.drums.splice(index, 1); continue; }
      if (age < 0) { voice.age++; continue; }
      const position = age / voice.duration;
      const attack = Math.min(1, age / 0.005);
      const envelope = attack * attack * (3 - 2 * attack) * Math.exp(-position * (voice.drum === 'hat' ? 8 : 6)) * (1 - position) ** 2;
      const noise = this.random.next() * 2 - 1;
      this.drumLow += this.drumCoefficient * (noise - this.drumLow);
      let wave = this.drumLow;
      if (voice.drum === 'kick') wave = lookup(SINE, voice.phase);
      else if (voice.drum === 'snare') wave = wave * 0.75 + lookup(SINE, voice.phase) * 0.25;
      else wave = noise - this.drumLow;
      if (voice.clear) wave = sampleClearRetroDrum(voice, noise, lookup(SINE, voice.phase));
      drums += wave * envelope * voice.amplitude * params.percussion / 100;
      const frequency = voice.drum === 'kick' ? voice.clear ? 46 + 82 * Math.exp(-age * 28) : 48 + 45 * Math.exp(-age * 25) : 175;
      voice.phase = (voice.phase + frequency / sr) % 1;
      voice.age++;
    }
    const noise = this.bedRandom.next() * 2 - 1;
    this.noiseHigh += this.highCoefficient * (noise - this.noiseHigh);
    this.noiseLow += this.bedCoefficient * (noise - this.noiseHigh - this.noiseLow);
    const ambience = params.ambience / 100;
    const bed = this.noiseLow * 0.007 * ambience;
    const li = frame % this.roomLeft.length, ri = frame % this.roomRight.length;
    this.echoLowLeft += this.echoCoefficient * (this.roomLeft[li] - this.echoLowLeft);
    this.echoLowRight += this.echoCoefficient * (this.roomRight[ri] - this.echoLowRight);
    this.roomLeft[li] = right * 0.25 + this.echoLowLeft * 0.2;
    this.roomRight[ri] = left * 0.25 + this.echoLowRight * 0.2;
    left += drums + this.echoLowLeft * ambience;
    right += drums + this.echoLowRight * ambience;
    this.lowLeft += this.coefficient * (left - this.lowLeft);
    this.lowRight += this.coefficient * (right - this.lowRight);
    this.lowBed += this.coefficient * (bed - this.lowBed);
    this.left = this.lowLeft * characterGain + this.lowBed;
    this.right = this.lowRight * characterGain + this.lowBed;
    return this;
  }
}
