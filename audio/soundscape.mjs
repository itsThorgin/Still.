import { GardenPlan } from './garden-plan.mjs';
import { createGardenTone, sampleGardenTone, prepareGardenPlan, gardenPlanPreparations } from './garden-instruments.mjs';
import { OrganRoom } from './garden-organ.mjs';

const TAU = Math.PI * 2;
const TABLE_SIZE = 4096;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smooth = (value) => value ** 3 * (10 + value * (-15 + value * 6));
const SINE = Float32Array.from({ length: TABLE_SIZE + 1 }, (_, index) => Math.sin(TAU * index / TABLE_SIZE));
const UPPER_RHYTHMS = [
  [[1, 1.25], [4, 1], [6, 0.85]],
  [[0, 2.1], [5, 1.15]],
  [[2, 1.5], [6, 1.1]],
  [[1, 2.6]],
];

function lookup(table, phase) {
  const position = phase * TABLE_SIZE;
  const index = Math.floor(position);
  return table[index] + (table[index + 1] - table[index]) * (position - index);
}

export class SeededRandom {
  constructor(seed) { this.state = seed >>> 0 || 1; }
  next() {
    let value = this.state;
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    this.state = value >>> 0;
    return this.state / 4294967296;
  }
}

export class ChamberPlan {
  constructor(seed) {
    this.random = new SeededRandom(seed ^ 0x27d4eb2d);
    this.tonic = [48, 50, 51, 53, 55, 57][Math.floor(this.random.next() * 6)];
    this.minor = this.random.next() < 0.3;
    this.scale = this.minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    this.progression = this.random.next() < 0.5 ? [0, 5, 1, 4, 0, 3, 4, 0] : [0, 3, 1, 4, 5, 3, 4, 0];
    this.motif = [0, 1, 2, 4, 3, 2, 1, 0].map((degree, index) => index > 0 && index < 7 && this.random.next() < 0.35 ? degree + 1 : degree);
  }

  frequency(degree, octave = 0) {
    const wrapped = ((degree % 7) + 7) % 7;
    const midi = this.tonic + 12 * (octave + Math.floor(degree / 7)) + this.scale[wrapped];
    return 440 * 2 ** ((midi - 69) / 12);
  }

  events(step) {
    const bar = Math.floor(step / 8);
    const section = Math.floor(bar / 8);
    const chord = this.progression[bar % 8];
    const position = step % 8;
    const phrase = Math.floor(step / 16);
    const degree = this.motif[step % 8];
    const answer = section % 2 ? 4 - degree : degree;
    const events = [];
    if (position === 0) events.push({ frequency: this.frequency(chord), beats: 5.5, instrument: 'string', amplitude: 0.026, pan: -0.12 });
    if (position % 2 === 0) events.push({ frequency: this.frequency(chord + [0, 2, 4, 2][position / 2], 1), beats: 1.8, instrument: 'pluck', amplitude: 0.022, pan: -0.45 });
    
    if (!(bar % 4 === 3 && position > 4)) events.push({ frequency: this.frequency(chord + answer, 1), beats: position % 2 ? 0.85 : 1.3, instrument: section % 2 ? 'flute' : 'string', amplitude: 0.029, pan: 0.25 });
    if (position === 2 || position === 6) events.push({ frequency: this.frequency(chord + this.motif[(7 - position + phrase) % 8]), beats: 2.5, instrument: 'flute', amplitude: 0.024, pan: 0.4 });
    if (position === 0 || (position === 5 && phrase % 2 === 0)) events.push({ frequency: this.frequency(chord + degree, 2), beats: 3.5, instrument: 'glass', amplitude: 0.018, pan: this.random.next() * 1.2 - 0.6, shimmer: true });
    return events;
  }
}

export class UpperMelodyPlan {
  constructor(plan, seed) {
    this.plan = plan;
    this.random = new SeededRandom(seed ^ 0x9e3779b9);
    const motifs = [[4, 2, 3, 1, 2, 0, 1, 0], [2, 1, 3, 2, 4, 2, 1, 0], [0, 2, 1, 3, 2, 1, 2, 0]];
    this.motif = motifs[Math.floor(this.random.next() * motifs.length)];
    this.offset = Math.floor(this.random.next() * 3);
    this.previousMidi = null;
  }

  event(step, low, high) {
    if (low > high) return null;
    const steps = this.plan.barSteps ?? 8;
    const bar = Math.floor(step / steps), position = step % steps;
    const cadence = bar % 4 === 3;
    const rhythm = UPPER_RHYTHMS[cadence ? 3 : (bar + this.offset) % 3];
    const index = rhythm.findIndex(([start]) => Math.floor(start * steps / 8) === position);
    if (index < 0) return null;
    const chord = this.plan.chordAt ? this.plan.chordAt(bar) : this.plan.progression[bar % this.plan.progression.length];
    const degree = this.motif[(bar % 4 * 2 + index) % this.motif.length];
    const direction = Math.floor(bar / 4) % 2 ? 4 - degree : degree;
    const wanted = this.plan.frequency(chord + (cadence ? 0 : direction));
    const wantedMidi = 69 + 12 * Math.log2(wanted / 440);
    const centre = 69 + 12 * Math.log2(Math.sqrt(low * high) / 440);
    const target = wantedMidi + 12 * Math.round((centre - wantedMidi) / 12);
    const chordTone = cadence || index === 0 || index === rhythm.length - 1;
    const chordClasses = [0, 2, 4].map((offset) => {
      const degree = chord + offset;
      return this.plan.scale[degree % 7];
    });
    const first = Math.ceil(69 + 12 * Math.log2(low / 440));
    const last = Math.floor(69 + 12 * Math.log2(high / 440));
    let selected = null, best = Infinity;
    for (let midi = first; midi <= last; midi++) {
      const pitchClass = ((midi - this.plan.tonic) % 12 + 12) % 12;
      if (!(chordTone ? chordClasses : this.plan.scale).includes(pitchClass)) continue;
      const score = Math.abs(midi - target) + (this.previousMidi === null ? 0 : Math.abs(midi - this.previousMidi) * 0.35);
      if (score < best) { selected = midi; best = score; }
    }
    
    if (selected === null) return null;
    this.previousMidi = selected;
    return { frequency: 440 * 2 ** ((selected - 69) / 12), beats: rhythm[index][1] * steps / 8, pan: this.random.next() * 0.8 - 0.4 };
  }
}

export class ChamberSoundscape {
  constructor(sampleRate, params, seed, deferPreparation = false) {
    this.sampleRate = sampleRate;
    this.limit = Math.min(20000, Math.floor(sampleRate / 2) - 1);
    this.seed = seed;
    this.selection = this.requestedInfluence = params.influence ?? 0;
    this.planOptions = { arrangements: params.arrangements, strings: params.strings };
    this.plan = new GardenPlan(new ChamberPlan(seed), seed, this.selection, this.planOptions);
    if (deferPreparation) this.preparations = gardenPlanPreparations(this.plan, sampleRate);
    else prepareGardenPlan(this.plan, sampleRate);
    this.nextStepBeat = 0;
    this.transition = null;
    this.upperPlan = new UpperMelodyPlan(this.plan, seed);
    this.textureRandom = new SeededRandom(seed ^ 0x165667b1);
    this.instrumentRandom = new SeededRandom(seed ^ 0x85ebca6b);
    this.highRandom = new SeededRandom(seed ^ 0xd3a2646c);
    this.noiseRandom = new SeededRandom(seed ^ 0xfd7046c5);
    this.voices = [];
    this.highVoices = [];
    this.melodyVoices = [];
    this.step = 0;
    this.beats = 0;
    this.nextHigh = 0;
    this.nextMelody = 0;
    this.range = [params.highLow, params.highHigh];
    this.leftPhase = this.rightPhase = 0;
    this.noiseLow = this.noiseHigh = 0;
    this.lowCoefficient = 1 - Math.exp(-TAU * Math.min(5000, sampleRate * 0.3) / sampleRate);
    this.highCoefficient = 1 - Math.exp(-TAU * 100 / sampleRate);
    this.colourPhase = this.textureRandom.next() * TAU;
    this.colour = this.colourStep = this.sway = this.swayStep = 0;
    this.solo = 0;
    this.soloTarget = 0;
    this.smoothing = 1 - Math.exp(-1 / (sampleRate * 0.05));
    this.roomLeft = new Float32Array(Math.ceil(sampleRate * 0.173));
    this.roomRight = new Float32Array(Math.ceil(sampleRate * 0.239));
    this.organRoom = this.plan.arrangement.value === 4 && Object.values(this.plan.ensemble.parts).includes('organ') ? new OrganRoom(sampleRate) : null;
    this.left = this.right = 0;
  }

  setMonitor(solo) { this.soloTarget = solo ? 1 : 0; }

  setParams(params, frame) {
    const requested = params.influence ?? 0;
    if (requested !== this.requestedInfluence || params.arrangements !== this.planOptions.arrangements || params.strings !== this.planOptions.strings) {
      this.requestedInfluence = requested;
      this.planOptions = { arrangements: params.arrangements, strings: params.strings };
      
      if (this.transition?.phase !== 'out') {
        this.transition = { phase: 'out', start: frame, from: this.influenceGain(frame) };
      }
    }
    if (params.highLow === this.range[0] && params.highHigh === this.range[1]) return;
    this.range = [params.highLow, params.highHigh];
    for (const voice of this.highVoices) voice.retire = Math.min(voice.retire, frame + this.sampleRate * 0.25);
    for (const voice of this.melodyVoices) voice.retire = Math.min(voice.retire, frame + this.sampleRate * 0.25);
    this.nextHigh = frame + Math.ceil(this.sampleRate * 0.25);
    this.nextMelody = this.nextHigh;
  }

  influenceGain(frame) {
    if (!this.transition) return 1;
    const { phase, start, from } = this.transition;
    const position = clamp((frame - start) / (this.sampleRate * (phase === 'out' ? 1 : 4)), 0, 1);
    return phase === 'out' ? from * (1 - smooth(position)) : smooth(position);
  }

  advanceInfluence(frame) {
    if (this.transition?.phase === 'out' && frame >= this.transition.start + this.sampleRate) {
      this.selection = this.requestedInfluence;
      this.plan = new GardenPlan(new ChamberPlan(this.seed), this.seed, this.selection, this.planOptions);
      prepareGardenPlan(this.plan, this.sampleRate);
      this.upperPlan = new UpperMelodyPlan(this.plan, this.seed);
      
      this.voices.length = this.highVoices.length = this.melodyVoices.length = 0;
      this.roomLeft.fill(0); this.roomRight.fill(0);
      this.organRoom?.clear();
      this.step = 0;
      this.nextStepBeat = this.beats;
      this.nextHigh = this.nextMelody = frame;
      this.transition = { phase: 'in', start: frame };
    } else if (this.transition?.phase === 'in' && frame >= this.transition.start + this.sampleRate * 4) {
      this.transition = null;
    }
  }

  addNote(event, tempo) {
    if (this.voices.length >= 20 || event.frequency >= this.sampleRate * 0.45) return;
    const duration = event.beats * 60 / tempo;
    if (event.instrument === 'organ' && !this.organRoom) this.organRoom = new OrganRoom(this.sampleRate);
    const tone = createGardenTone(event.instrument, event.frequency, duration, this.sampleRate, Math.floor(this.instrumentRandom.next() * 4294967296), event);
    this.voices.push({ ...event, tone, phase: 0, age: -Math.round((event.delay ?? 0) * 60 / tempo * this.sampleRate), duration, retire: Infinity, drift: this.textureRandom.next() * 0.2 - 0.1 });
  }

  addHighCluster(params, frame) {
    const [low, requestedHigh] = this.range;
    const high = Math.min(requestedHigh, this.limit);
    if (low <= high) {
      for (let index = 0; index < 3 && this.highVoices.length < 12; index++) {
        const frequency = low * (high / low) ** this.highRandom.next();
        
        const semitones = Math.round(12 * Math.log2(frequency / this.plan.frequency(0)));
        const tuned = this.plan.frequency(0) * 2 ** (semitones / 12);
        const start = clamp(tuned, low, high);
        const end = clamp(start * 2 ** ((this.highRandom.next() - 0.5) / 24), low, high);
        this.highVoices.push({ start, end, frequency: start, phase: this.highRandom.next(), age: 0, duration: (6 + this.highRandom.next() * 6) * 60 / params.tempo, pan: this.highRandom.next() * 1.1 - 0.55, retire: Infinity });
      }
    }
    this.nextHigh = frame + Math.round((4 + this.highRandom.next() * 4) * 60 / params.tempo * this.sampleRate);
  }

  addUpperMelody(params, frame, step) {
    const note = this.upperPlan.event(step, this.range[0], Math.min(this.range[1], this.limit));
    if (!note || frame < this.nextMelody || this.melodyVoices.length >= 3) return;
    this.melodyVoices.push({ ...note, phase: 0, age: 0, duration: note.beats * 60 / params.tempo, retire: Infinity });
  }

  sample(params, frame) {
    const sr = this.sampleRate;
    const time = frame / sr;
    this.advanceInfluence(frame);
    const influenceGain = this.influenceGain(frame);
    if (frame % 128 === 0) {
      const target = params.brightness / 100 * (0.7 + 0.3 * Math.sin(time * TAU / 47 + this.colourPhase));
      this.colourStep = (target - this.colour) / 128;
      this.swayStep = (Math.sin(time * TAU / 63 + this.colourPhase) * 0.17 - this.sway) / 128;
    }
    this.colour += this.colourStep;
    this.sway += this.swayStep;
    while (this.beats >= this.nextStepBeat) {
      for (const event of this.plan.events(this.step)) this.addNote(event, params.tempo);
      this.addUpperMelody(params, frame, this.step);
      this.step++;
      this.nextStepBeat += 0.5;
    }
    this.beats += params.tempo / (60 * sr);
    if (frame >= this.nextHigh) this.addHighCluster(params, frame);
    let musicLeft = 0, musicRight = 0, organLeft = 0, organRight = 0;
    const width = params.width / 100;
    for (let index = this.voices.length - 1; index >= 0; index--) {
      const voice = this.voices[index];
      const age = voice.age / sr;
      if (age >= voice.duration || frame >= voice.retire) { this.voices.splice(index, 1); continue; }
      if (age < 0) { voice.age++; continue; }
      const attack = Math.min(1, age / Math.min(voice.tone.attack, voice.duration * 0.3));
      const release = Math.min(1, (voice.duration - age) / Math.min(voice.tone.release ?? 0.7, voice.duration * 0.4));
      let envelope = attack * attack * (3 - 2 * attack) * release * release * (3 - 2 * release);
      if (voice.tone.internalEnvelope) envelope = 1;
      envelope *= Math.min(1, (voice.retire - frame) / (sr * 0.25));
      const wave = sampleGardenTone(voice.tone, age, voice.shimmer ? 0.8 : this.colour);
      const blend = (voice.shimmer ? params.shimmer : params.music) / 100;
      const sound = wave * envelope * voice.amplitude * blend;
      const pan = clamp((voice.pan + voice.drift + this.sway) * width, -0.85, 0.85);
      musicLeft += sound * (1 - pan) * Math.SQRT1_2;
      musicRight += sound * (1 + pan) * Math.SQRT1_2;
      if (voice.instrument === 'organ') {
        organLeft += sound * (1 - pan) * Math.SQRT1_2;
        organRight += sound * (1 + pan) * Math.SQRT1_2;
      }
      voice.phase = (voice.phase + voice.frequency / sr) % 1;
      voice.age++;
    }
    if (this.organRoom) {
      this.organRoom.sample(organLeft, organRight);
      musicLeft += this.organRoom.left; musicRight += this.organRoom.right;
    }
    let upperLeft = 0, upperRight = 0;
    const connection = (params.highConnection ?? 0) / 100;
    for (let index = this.highVoices.length - 1; index >= 0; index--) {
      const voice = this.highVoices[index];
      const position = voice.age / (sr * voice.duration);
      if (position >= 1 || frame >= voice.retire) { this.highVoices.splice(index, 1); continue; }
      const blend = smooth(position);
      voice.frequency = voice.start + (voice.end - voice.start) * blend;
      const envelope = Math.sin(Math.PI * position) ** 2 * Math.min(1, (voice.retire - frame) / (sr * 0.25));
      const sound = lookup(SINE, voice.phase) * envelope * 0.009 * params.highMix / 100 * (1 - connection);
      const pan = (voice.pan + this.sway) * width;
      upperLeft += sound * (1 - pan) * Math.SQRT1_2;
      upperRight += sound * (1 + pan) * Math.SQRT1_2;
      voice.phase = (voice.phase + voice.frequency / sr) % 1;
      voice.age++;
    }
    for (let index = this.melodyVoices.length - 1; index >= 0; index--) {
      const voice = this.melodyVoices[index];
      const position = voice.age / (sr * voice.duration);
      if (position >= 1 || frame >= voice.retire) { this.melodyVoices.splice(index, 1); continue; }
      const envelope = Math.sin(Math.PI * position) ** 2 * Math.min(1, (voice.retire - frame) / (sr * 0.25));
      const sound = lookup(SINE, voice.phase) * envelope * 0.018 * params.highMix / 100 * connection;
      const pan = (voice.pan + this.sway) * width;
      upperLeft += sound * (1 - pan) * Math.SQRT1_2;
      upperRight += sound * (1 + pan) * Math.SQRT1_2;
      voice.phase = (voice.phase + voice.frequency / sr) % 1;
      voice.age++;
    }
    const noise = this.noiseRandom.next() * 2 - 1;
    this.noiseHigh += this.highCoefficient * (noise - this.noiseHigh);
    this.noiseLow += this.lowCoefficient * (noise - this.noiseHigh - this.noiseLow);
    const bed = this.noiseLow * 0.045 * params.background / 100;
    const leftIndex = frame % this.roomLeft.length, rightIndex = frame % this.roomRight.length;
    const echoLeft = this.roomLeft[leftIndex], echoRight = this.roomRight[rightIndex];
    this.roomLeft[leftIndex] = musicRight * 0.25 + echoLeft * 0.22;
    this.roomRight[rightIndex] = musicLeft * 0.25 + echoRight * 0.22;
    this.solo += (this.soloTarget - this.solo) * this.smoothing;
    const normal = 1 - this.solo;
    const binauralGain = params.binauralMix / 100 * 0.12;
    const binauralLeft = lookup(SINE, this.leftPhase) * binauralGain;
    const binauralRight = lookup(SINE, this.rightPhase) * binauralGain;
    this.leftPhase = (this.leftPhase + 180 / sr) % 1;
    this.rightPhase = (this.rightPhase + (180 + params.beat) / sr) % 1;
    this.left = influenceGain * (upperLeft + normal * (musicLeft + echoLeft + binauralLeft)) + normal * bed;
    this.right = influenceGain * (upperRight + normal * (musicRight + echoRight + binauralRight)) + normal * bed;
    return this;
  }
}
