import { GentleMotion } from './motion.mjs';
import { ToneSweep } from './tone-sweep.mjs';
import { RateMotion } from './rate-motion.mjs';
import { ChamberSoundscape } from './soundscape.mjs';
import { RetroSoundscape } from './retro.mjs';

const TAU = Math.PI * 2;
const PENTATONIC = [0, 2, 4, 7, 9];
const CHORD = [0, 4, 7];

export class SoundGenerator {
  constructor(sampleRate, kind, params, seed = 1, motion, sweep, rateMotion) {
    this.sampleRate = sampleRate;
    this.kind = kind;
    this.rateMotion = ['binaural', 'isochronic', 'soundscape'].includes(kind) ? new RateMotion(params.beat, seed, rateMotion) : null;
    this.soundscape = kind === 'soundscape' ? new ChamberSoundscape(sampleRate, params, seed) : null;
    this.retro = kind === 'retro' ? new RetroSoundscape(sampleRate, params, seed) : null;
    this.target = { ...params };
    this.renderTarget = this.target;
    this.motion = motion?.controls?.length ? new GentleMotion(params, motion.controls, seed, motion) : null;
    this.sweep = kind === 'tone' && sweep ? new ToneSweep(sweep.mode, sweep.high, sampleRate) : null;
    this.toneLevel = this.sweep?.level ?? 1;
    this.params = { ...params };
    this.randomState = seed >>> 0 || 1;
    this.phase = 0;
    this.rightPhase = 0;
    this.pulsePhase = 0;
    this.smooth = 1 - Math.exp(-1 / (sampleRate * 0.04));
    this.lowState = 0;
    this.lowState2 = 0;
    this.highState = 0;
    this.noiseRows = new Float64Array(8);
    this.noiseSum = 0;
    this.noiseCounter = 0;
    this.voices = [];
    this.nextNote = 0;
    this.noteIndex = null;
    this.phraseRemaining = 0;
    this.frames = 0;
    for (let i = 0; i < this.noiseRows.length; i++) {
      this.noiseRows[i] = this.random() * 2 - 1;
      this.noiseSum += this.noiseRows[i];
    }
  }

  random() {
    let value = this.randomState;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.randomState = value >>> 0;
    return this.randomState / 4294967296;
  }

  setParams(params) {
    this.sweep = null;
    this.target = { ...params };
    this.motion?.recenter(params, this.frames / this.sampleRate);
    this.rateMotion?.recenter(params.beat, this.frames / this.sampleRate);
    this.soundscape?.setParams(params, this.frames);
    this.retro?.setParams(params, this.frames);
    this.renderTarget = this.motion ? this.motion.sample(this.frames / this.sampleRate) : this.target;
  }

  setMotion(settings) {
    this.motion?.configure(settings, this.frames / this.sampleRate);
  }

  setRateMotion(settings) {
    this.rateMotion?.configure(settings, this.frames / this.sampleRate);
  }

  setMonitor(settings) {
    this.soundscape?.setMonitor(settings.highSolo);
  }

  addNote() {
    const { low, high, density } = this.params;
    const style = this.kind;
    const duration = this.params.length ?? 7;
    const maxSemitones = Math.max(0, 12 * Math.log2(high / low));
    const allowed = [];
    for (let octave = 0; octave * 12 <= maxSemitones; octave++) {
      for (const interval of style === 'drift' ? CHORD : PENTATONIC) if (octave * 12 + interval <= maxSemitones) allowed.push(octave * 12 + interval);
    }
    let index = Math.floor(this.random() * allowed.length);
    if (style === 'plucks' && this.noteIndex !== null) {
      const previous = Math.min(this.noteIndex, allowed.length - 1);
      index = Math.max(0, Math.min(allowed.length - 1, previous + index % 5 - 2));
    }
    this.noteIndex = index;
    const semitone = allowed[index] ?? 0;
    const frequency = low * 2 ** (semitone / 12);
    const pan = this.random() * 0.8 - 0.4;
    const amplitude = style === 'drift' ? 0.065 + this.random() * 0.01 : 0.22 + this.random() * 0.06;
    // Do not cut off a ringing note when the voice limit is reached.
    if (this.voices.length < 16) this.voices.push({ phase: 0, frequency, age: 0, duration, amplitude, left: Math.sqrt((1 - pan) / 2), right: Math.sqrt((1 + pan) / 2) });
    let gap = (60 / density) * (0.75 + this.random() * 0.5);
    if (style === 'plucks') {
      if (this.phraseRemaining === 0) this.phraseRemaining = 2 + Math.floor(this.random() * 3);
      this.phraseRemaining--;
      gap *= this.phraseRemaining > 0 ? 0.55 : 2.1;
    } else if (style === 'drift') {
      const separate = Math.max(duration, gap);
      gap = separate + (gap - separate) * this.params.overlap / 100;
    }
    this.nextNote = this.frames + this.sampleRate * gap;
  }

  render(left, right) {
    const sr = this.sampleRate;
    const keys = Object.keys(this.target);
    for (let i = 0; i < left.length; i++) {
      if (this.motion && this.frames % 128 === 0) this.renderTarget = this.motion.sample(this.frames / sr);
      for (const key of keys) this.params[key] += (this.renderTarget[key] - this.params[key]) * this.smooth;
      if (this.sweep) {
        this.params.base = this.sweep.sample(this.frames / sr).frequency;
        this.toneLevel = this.sweep.level;
      } else if (this.kind === 'tone') this.toneLevel += (1 - this.toneLevel) * this.smooth;
      const p = this.params;
      if (this.rateMotion?.active) p.beat = this.rateMotion.sample(this.frames / sr);
      let l = 0;
      let r = 0;
      if (this.kind === 'tone' || this.kind === 'binaural' || this.kind === 'isochronic') {
        l = Math.sin(this.phase) * 0.45;
        this.phase = (this.phase + TAU * p.base / sr) % TAU;
        if (this.kind === 'binaural') {
          r = Math.sin(this.rightPhase) * 0.45;
          this.rightPhase = (this.rightPhase + TAU * (p.base + p.beat) / sr) % TAU;
        } else if (this.kind === 'isochronic') {
          const position = this.pulsePhase;
          const edge = p.softness / 100 * 0.25;
          let pulse = 0;
          if (position < edge) pulse = (1 - Math.cos(Math.PI * position / edge)) / 2;
          else if (position < 0.5 - edge) pulse = 1;
          else if (position < 0.5) pulse = (1 - Math.cos(Math.PI * (0.5 - position) / edge)) / 2;
          l *= 1 - p.depth / 100 + p.depth / 100 * pulse;
          r = l;
          this.pulsePhase = (this.pulsePhase + p.beat / sr) % 1;
        } else {
          l *= this.toneLevel;
          r = l;
        }
      } else if (this.soundscape) {
        this.soundscape.sample(p, this.frames);
        l = this.soundscape.left;
        r = this.soundscape.right;
      } else if (this.retro) {
        this.retro.sample(p, this.frames);
        l = this.retro.left;
        r = this.retro.right;
      } else if (this.kind === 'noise') {
        this.noiseCounter = (this.noiseCounter + 1) & 255;
        let row = 0;
        let counter = this.noiseCounter;
        while (row < 7 && (counter & 1) === 0) { row++; counter >>>= 1; }
        this.noiseSum -= this.noiseRows[row];
        this.noiseRows[row] = this.random() * 2 - 1;
        this.noiseSum += this.noiseRows[row];
        const white = (this.noiseSum + this.random() * 2 - 1) / 9;
        const lower = 1 - Math.exp(-TAU * p.low / sr);
        const upper = 1 - Math.exp(-TAU * Math.min(p.high, sr * 0.45) / sr);
        this.highState += lower * (white - this.highState);
        const highPassed = white - this.highState;
        this.lowState += upper * (highPassed - this.lowState);
        this.lowState2 += upper * (this.lowState - this.lowState2);
        l = r = this.lowState2 * 1.4;
      } else if (this.kind === 'sequence' || this.kind === 'plucks' || this.kind === 'drift') {
        if (this.frames >= this.nextNote) this.addNote();
        for (let voiceIndex = this.voices.length - 1; voiceIndex >= 0; voiceIndex--) {
          const voice = this.voices[voiceIndex];
          const age = voice.age / sr;
          const duration = voice.duration;
          if (age >= duration) { this.voices.splice(voiceIndex, 1); continue; }
          let envelope;
          let wave;
          if (this.kind === 'drift') {
            envelope = Math.sin(Math.PI * age / duration) ** 2;
            wave = Math.sin(voice.phase) + 0.12 * Math.sin(voice.phase * 2) + 0.03 * Math.sin(voice.phase * 3);
          } else {
            const attack = Math.min(1, age / (this.kind === 'plucks' ? 0.035 : 0.04));
            const release = Math.min(1, (duration - age) / Math.min(0.5, duration / 4));
            envelope = attack * attack * (3 - 2 * attack) * Math.exp(-age / duration * (this.kind === 'plucks' ? 5.5 : 7.35)) * release;
            wave = this.kind === 'plucks'
              ? Math.sin(voice.phase) + (0.16 * Math.sin(voice.phase * 2) + 0.05 * Math.sin(voice.phase * 3)) * Math.exp(-age * 3)
              : Math.sin(voice.phase) + 0.22 * Math.sin(voice.phase * 2) * Math.exp(-age * 1.5);
          }
          const sound = wave * voice.amplitude * envelope;
          l += sound * voice.left;
          r += sound * voice.right;
          voice.phase = (voice.phase + TAU * voice.frequency / sr) % TAU;
          voice.age++;
        }
      }
      left[i] = Math.max(-0.8, Math.min(0.8, l));
      right[i] = Math.max(-0.8, Math.min(0.8, r));
      this.frames++;
    }
  }
}

