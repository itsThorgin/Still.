import { GentleMotion } from './motion.mjs';
import { ToneSweep } from './tone-sweep.mjs';
import { RateMotion } from './rate-motion.mjs';
import { ChamberSoundscape } from './soundscape.mjs';
import { RetroSoundscape } from './retro.mjs';
import { ElectronicSoundscape } from './electronic.mjs';
import { ELECTRONIC_KINDS } from '../electronic-characters.mjs';
import { nextRetroStyle } from '../retro-styles.mjs';
import { GardenRotation, GARDEN_FADE_OUT_SECONDS, GARDEN_FADE_IN_SECONDS } from '../garden-options.mjs';
import { SequencePalette, sequenceToneSeed } from '../sequence-palettes.mjs';
import { createSequenceTone, sampleSequenceTone } from './sequence-instruments.mjs';

const TAU = Math.PI * 2;
const PENTATONIC = [0, 2, 4, 7, 9];
const CHORD = [0, 4, 7];

export class SoundGenerator {
  constructor(sampleRate, kind, params, seed = 1, motion, sweep, rateMotion) {
    this.sampleRate = sampleRate;
    this.kind = kind;
    this.sequencePalette = ['sequence', 'plucks', 'drift'].includes(kind) ? new SequencePalette(sampleRate, kind, seed, params.palette ?? 1) : null;
    this.sequenceSeed = seed; this.noteSerial = 0;
    this.rateMotion = ['binaural', 'isochronic', 'soundscape'].includes(kind) ? new RateMotion(params.beat, seed, rateMotion) : null;
    this.soundscape = kind === 'soundscape' ? new ChamberSoundscape(sampleRate, params, seed) : null;
    this.rotation = this.soundscape ? new GardenRotation(sampleRate, seed, params.variationMinutes) : null;
    this.gardenTransition = null;
    this.pendingSoundscape = null;
    this.variationVersion = 0;
    this.retro = kind === 'retro' ? new RetroSoundscape(sampleRate, params, seed) : null;
    this.electronic = ELECTRONIC_KINDS.includes(kind) ? new ElectronicSoundscape(sampleRate, params, seed, kind) : null;
    this.retroRotation = this.retro ? new GardenRotation(sampleRate, seed, params.variationMinutes) : null;
    this.retroTransition = null;
    this.target = { ...params };
    this.parameterKeys = Object.keys(this.target);
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
    this.smoothingKeys = [];
    this.refreshSmoothingKeys();
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
    const previousStyle = this.target.style;
    this.target = { ...params };
    this.parameterKeys = Object.keys(this.target);
    this.motion?.recenter(params, this.frames / this.sampleRate);
    this.sequencePalette?.configure(params.palette ?? 1, this.frames);
    this.rateMotion?.recenter(params.beat, this.frames / this.sampleRate);
    this.soundscape?.setParams(params, this.frames);
    this.electronic?.setParams(params, this.frames);
    const previousInterval = this.rotation?.minutes;
    this.rotation?.configure(params.variationMinutes, this.frames);
    if (previousInterval !== this.rotation?.minutes) this.pendingSoundscape = null;
    if (this.pendingSoundscape && ['influence', 'arrangements', 'strings'].some((key) => params[key] !== this.pendingParams[key])) this.pendingSoundscape = null;
    if (this.retro) {
      const changedStyle = params.style !== previousStyle;
      this.retroRotation.configure(params.variationMinutes, this.frames);
      if (changedStyle) this.retroRotation.schedule(this.frames);
      if (this.retroTransition?.phase === 'out') {
        
        if (changedStyle) this.retroTransition.selection = params.style;
      } else this.retro.setParams(params, this.frames);
    }
    this.renderTarget = this.motion ? this.motion.sample(this.frames / this.sampleRate) : this.target;
    this.refreshSmoothingKeys();
  }

  refreshSmoothingKeys() {
    // Moving controls retain their original per-sample smoothing. Fixed controls
    // can stop once another smoothing step would leave the value unchanged.
    this.dynamicParameters = !!(this.motion || this.rateMotion || this.sweep || this.retro);
    this.smoothingKeys.length = 0;
    if (this.dynamicParameters) return;
    for (const key of this.parameterKeys) {
      const value = this.params[key];
      const next = value + (this.renderTarget[key] - value) * this.smooth;
      if (!Object.is(next, value)) this.smoothingKeys.push(key);
    }
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

  advanceGarden() {

    if (this.frames % 128 === 0 && this.gardenTransition?.phase !== 'in'
      && (this.gardenTransition?.phase === 'out' || this.frames >= this.rotation.nextFrame - this.sampleRate * 30)) {
      if (!this.pendingSoundscape) {
        this.pendingParams = { ...this.target };
        this.pendingSoundscape = new ChamberSoundscape(this.sampleRate, this.target, this.rotation.nextSeed(), true);
      }
      const task = this.pendingSoundscape.preparations?.next();
      task?.value?.();
      if (task?.done) this.pendingSoundscape.preparations = null;
    }
    if (!this.gardenTransition && this.frames >= this.rotation.nextFrame) {
      this.gardenTransition = { phase: 'out', start: this.frames };
    }
    if (this.gardenTransition?.phase === 'in') {
      if (this.frames >= this.gardenTransition.start + this.sampleRate * GARDEN_FADE_IN_SECONDS) this.gardenTransition = null;
      return;
    }
    if (this.gardenTransition?.phase !== 'out'
      || this.frames < this.gardenTransition.start + this.sampleRate * GARDEN_FADE_OUT_SECONDS) return;

    this.rotation.changeSeed(this.frames);
    const previous = this.soundscape;
    this.soundscape = this.pendingSoundscape ?? new ChamberSoundscape(this.sampleRate, this.target, this.rotation.seed);
    if (this.soundscape.preparations) {
      for (const task of this.soundscape.preparations) task?.();
      this.soundscape.preparations = null;
    }
    this.soundscape.range = [this.target.highLow, this.target.highHigh];
    this.pendingSoundscape = null;
    
    this.soundscape.leftPhase = previous.leftPhase; this.soundscape.rightPhase = previous.rightPhase;
    this.soundscape.soloTarget = previous.soloTarget; this.soundscape.solo = previous.solo;
    this.gardenTransition = { phase: 'in', start: this.frames };
    this.variationVersion++;
  }

  gardenGain() {
    if (!this.gardenTransition) return 1;
    const { phase, start } = this.gardenTransition;
    const seconds = phase === 'out' ? GARDEN_FADE_OUT_SECONDS : GARDEN_FADE_IN_SECONDS;
    const position = Math.max(0, Math.min(1, (this.frames - start) / (this.sampleRate * seconds)));
    return phase === 'out' ? 1 - position : position;
  }

  advanceRetro() {
    if (!this.retroTransition && this.frames >= this.retroRotation.nextFrame) {
      this.retroTransition = { phase: 'out', start: this.frames };
    }
    const transition = this.retroTransition;
    if (!transition) return;
    if (transition.phase === 'in') {
      if (this.frames >= transition.start + this.sampleRate * GARDEN_FADE_IN_SECONDS) this.retroTransition = null;
      return;
    }
    if (this.frames < transition.start + this.sampleRate * GARDEN_FADE_OUT_SECONDS) return;
    this.retroRotation.changeSeed(this.frames);
    const seed = this.retroRotation.seed;
    const style = transition.selection === undefined ? nextRetroStyle(seed, this.retro.plan.style.value) : transition.selection;
    this.target.style = style;
    this.params.style = style;
    this.retro = new RetroSoundscape(this.sampleRate, this.target, seed);
    this.retroTransition = { phase: 'in', start: this.frames };
    this.variationVersion++;
  }

  retroGain() {
    if (!this.retroTransition) return 1;
    const { phase, start } = this.retroTransition;
    const seconds = phase === 'out' ? GARDEN_FADE_OUT_SECONDS : GARDEN_FADE_IN_SECONDS;
    const position = Math.max(0, Math.min(1, (this.frames - start) / (this.sampleRate * seconds)));
    return phase === 'out' ? 1 - position : position;
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
    
    if (this.voices.length < 16) this.voices.push({ phase: 0, frequency, age: 0, duration, amplitude, left: Math.sqrt((1 - pan) / 2), right: Math.sqrt((1 + pan) / 2),
      tone: createSequenceTone(style, frequency, duration, this.sampleRate, sequenceToneSeed(this.sequenceSeed, style, this.noteSerial++)) });
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
    const dynamic = this.dynamicParameters;
    const keys = dynamic ? this.parameterKeys : this.smoothingKeys;
    for (let i = 0; i < left.length; i++) {
      if (this.motion && this.frames % 128 === 0) this.renderTarget = this.motion.sample(this.frames / sr);
      if (dynamic) {
        for (const key of keys) this.params[key] += (this.renderTarget[key] - this.params[key]) * this.smooth;
      } else if (keys.length) {
        let active = 0;
        for (const key of keys) {
          const value = this.params[key];
          const next = value + (this.renderTarget[key] - value) * this.smooth;
          this.params[key] = next;
          if (next !== value) keys[active++] = key;
        }
        keys.length = active;
      }
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
        this.advanceGarden();
        this.soundscape.sample(p, this.frames);
        const gain = this.gardenGain();
        l = this.soundscape.left * gain;
        r = this.soundscape.right * gain;
      } else if (this.retro) {
        this.advanceRetro();
        this.retro.sample(p, this.frames);
        const gain = this.retroGain();
        l = this.retro.left * gain;
        r = this.retro.right * gain;
      } else if (this.electronic) {
        this.electronic.sample(p, this.frames);
        if (this.variationVersion !== this.electronic.variationVersion && this.electronic.variationParams) {
          Object.assign(this.target, this.electronic.variationParams);
          this.parameterKeys = Object.keys(this.target);
          this.refreshSmoothingKeys();
        }
        this.variationVersion = this.electronic.variationVersion;
        l = this.electronic.left;
        r = this.electronic.right;
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
        const paletteMix = this.sequencePalette.sample(this.frames);
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
          const originalSound = wave * voice.amplitude * envelope;
          const newSound = sampleSequenceTone(voice.tone, age) * voice.amplitude;
          const sound = paletteMix === 0 ? originalSound : paletteMix === 1 ? newSound : originalSound * (1 - paletteMix) + newSound * paletteMix;
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

