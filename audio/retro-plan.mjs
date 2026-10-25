import { SeededRandom } from './soundscape.mjs';
import { retroStyle, mixRetroSeed } from '../retro-styles.mjs';
import { COMPANION_FAMILIES, initializeCompanion, companionEvents } from './retro-companion-plan.mjs';
import { CozyRetroPlan } from './retro-cozy-plan.mjs';

const FAMILIES = {
  1: {
    scale: [0, 2, 4, 5, 7, 9, 11],
    progressions: [[0, 3, 4, 0, 5, 1, 4, 0], [0, 5, 3, 4, 0, 1, 4, 0]],
    rhythms: [[0, 3, 6, 8, 12], [0, 4, 7, 10, 14], [2, 6, 8, 11, 14]],
    arpeggio: [0, 4, 8, 12],
  },
  2: {
    scale: [0, 2, 3, 5, 7, 9, 10],
    progressions: [[0, 5, 2, 6, 3, 0, 4, 0], [0, 3, 5, 2, 6, 3, 4, 0]],
    rhythms: [[0, 6, 12], [2, 8, 14], [0, 7, 10]],
    arpeggio: [0, 6, 10],
  },
  3: {
    scale: [0, 2, 4, 5, 7, 9, 11],
    progressions: [[0, 3, 0, 4, 5, 3, 4, 0], [0, 5, 1, 4, 3, 0, 4, 0]],
    rhythms: [[0, 3, 6, 9, 12, 14], [0, 2, 6, 8, 11, 14], [1, 4, 7, 10, 12]],
    arpeggio: [0, 3, 6, 8, 11, 14],
  },
  4: {
    scale: [0, 2, 4, 5, 7, 9, 10],
    progressions: [[0, 3, 0, 6, 3, 5, 4, 0], [0, 4, 3, 0, 5, 3, 4, 0]],
    rhythms: [[0, 3, 6, 10, 14], [0, 4, 6, 11, 14], [0, 6, 8, 12]],
    arpeggio: [0, 3, 8, 11],
  },
  5: {
    scale: [0, 2, 4, 5, 7, 9, 11],
    progressions: [[1, 4, 0, 5, 1, 4, 2, 0], [0, 5, 1, 4, 2, 5, 1, 0]],
    rhythms: [[0, 2, 6, 8, 10, 14], [0, 6, 8, 14], [2, 4, 10, 12, 14]],
    arpeggio: [0, 2, 6, 8, 10, 14],
  },
};

export class RetroPlan {
  constructor(seed, selection = 0) {
    this.style = retroStyle(selection, seed);
    if (this.style.sound === 'cozy') return new CozyRetroPlan(seed, this.style.value);
    this.character = this.style.family ?? this.style.value;
    this.companion = this.style.sound === 'clear';
    this.family = this.companion ? COMPANION_FAMILIES[this.character] : FAMILIES[this.character];
    this.random = new SeededRandom(mixRetroSeed(seed ^ 0x68e31da4));
    this.tonic = [48, 50, 53, 55, 57][Math.floor(this.random.next() * 5)];
    if (this.companion) this.random = new SeededRandom(mixRetroSeed(seed ^ 0x517cc1b7 ^ this.character));
    this.scale = this.family.scale;
    this.progression = this.family.progressions[Math.floor(this.random.next() * this.family.progressions.length)];
    this.palette = this.random.next() < 0.5 ? 'round-pulse' : 'narrow-pulse';
    this.motif = [0];
    for (let index = 1; index < 7; index++) {
      const previous = this.motif[index - 1];
      const direction = [-2, -1, 1, 1, 2][Math.floor(this.random.next() * 5)];
      this.motif.push(Math.max(0, Math.min(6, previous + direction)));
    }
    this.motif.push(0);
    if (this.character === 4) this.motif = [0, 2, 4, 5, 4, 2, 1, 0].map((degree, index) => index === 3 ? degree + Math.floor(this.random.next() * 2) : degree);
    this.answer = this.motif.map((degree, index) => index === 7 ? 0 : 4 - degree);
    if (this.companion) initializeCompanion(this);
    this.epoch = -1;
    this.turn = 0;
    this.pattern = 0;
    this.ornament = 0;
  }

  frequency(degree, octave = 0) {
    const wrapped = ((degree % 7) + 7) % 7;
    const midi = this.tonic + 12 * (octave + Math.floor(degree / 7)) + this.scale[wrapped];
    return 440 * 2 ** ((midi - 69) / 12);
  }

  events(step) {
    if (this.companion) return companionEvents(this, step);
    const bar = Math.floor(step / 16), tick = step % 16;
    const epoch = Math.floor(bar / 32);
    while (this.epoch < epoch) {
      this.epoch++;
      this.pattern = Math.floor(this.random.next() * 3);
      this.turn = Math.floor(this.random.next() * 3) - 1;
      this.ornament = this.random.next();
    }
    const section = Math.floor(bar / 8) % 4;
    const chordIndex = section === 2 && bar % 8 < 6 ? (bar + 2) % 8 : bar % 8;
    const chord = this.progression[chordIndex];
    const cadence = bar % 8 === 7;
    const events = [];
    const add = (degree, octave, beats, role, instrument, amplitude, pan) => {
      events.push({ frequency: this.frequency(degree, octave), beats, role, instrument, amplitude, pan });
    };
    if (tick === 0) {
      const voicing = this.character === 5 ? [2, 4, 6, 8] : this.character === 4 ? [0, 4, 7] : this.character === 2 ? [0, 3, 6] : [0, 2, 4];
      for (const degree of voicing) {
        add(chord + degree, 0, 4.25, 'accompaniment', 'pad', this.character === 5 ? 0.012 : 0.016, Math.max(-0.5, Math.min(0.5, (degree - 2) * 0.19)));
      }
    }
    if ((this.character >= 4 && tick % 4 === 0) || tick === 0 || (tick === 8 && this.character !== 2)) {
      const walk = this.character === 4 ? [0, 4, 0, 2] : this.character === 5 ? [0, 2, 4, 6] : [0, 0, this.character === 3 ? 4 : 0, 0];
      add(chord + walk[Math.floor(tick / 4)], -1, this.character >= 4 ? 0.9 : this.character === 2 ? 3.6 : 1.8, 'bass', 'triangle', 0.07, 0);
    }
    const arpIndex = this.family.arpeggio.indexOf(tick);
    if (arpIndex >= 0 && !(cadence && tick > 8)) {
      const order = (section === 1 || section === 3) && this.ornament > 0.4 ? [4, 2, 0, 2] : [0, 2, 4, 2];
      add(chord + order[(arpIndex + this.pattern) % order.length], 1, this.character === 2 ? 1.7 : 0.9, 'accompaniment', this.character === 5 ? 'keys' : 'pluck', 0.027, arpIndex % 2 ? 0.5 : -0.5);
    }
    const rhythm = this.family.rhythms[(this.pattern + bar % 2) % 3];
    const noteIndex = rhythm.indexOf(tick);
    if (noteIndex >= 0 && !(cadence && tick >= 8)) {
      const phrase = section === 2 ? this.answer : this.motif;
      const index = (Math.floor(bar / 2) % 4 * 2 + noteIndex) % phrase.length;
      let degree = phrase[index];
      if (section === 1 && noteIndex === rhythm.length - 1) degree += this.turn;
      if (cadence) degree = 0;
      
      if (noteIndex === 0 && !cadence) degree = [0, 2, 4][Math.abs(degree) % 3];
      const next = rhythm[noteIndex + 1] ?? 16;
      const beats = cadence ? 1.6 : Math.max(0.35, (next - tick) / 4 * (this.character === 2 ? 1.05 : this.character === 4 ? 0.98 : 0.83));
      add(chord + degree, 1, beats, 'melody', this.character === 5 ? 'keys' : section === 2 ? 'triangle' : this.palette, 0.075, -0.12);
    }
    if (section !== 0 && (tick === 5 || tick === 13) && !(cadence && tick > 8)) {
      const degree = this.answer[(bar + (tick === 13 ? 3 : 0)) % this.answer.length];
      add(chord + degree, 0, 0.8, 'melody', 'triangle', 0.034, 0.3);
    }
    if (tick === 0 || (tick === 8 && (this.character === 3 || this.character === 4))) events.push({ drum: 'kick', beats: 0.7, amplitude: 0.075 });
    if (this.character !== 2 && (tick === 4 || tick === 12)) events.push({ drum: 'snare', beats: 0.45, amplitude: 0.035 });
    const hatTicks = this.character === 2 ? [6, 14] : this.character === 1 ? [2, 6, 10, 14] : [0, 2, 6, 8, 10, 14];
    if (hatTicks.includes(tick) && !(cadence && tick > 8)) events.push({ drum: 'hat', beats: 0.18, amplitude: 0.022 });
    if (this.character === 5 && tick % 4 === 2) for (const event of events) event.delay = 1 / 6;
    return events;
  }
}
