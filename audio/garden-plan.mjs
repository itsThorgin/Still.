import { gardenInfluences } from '../garden-influences.mjs';
import { GardenEnsemble } from './garden-ensemble.mjs';
import { chooseArrangement, chooseString } from '../garden-options.mjs';

// Original composition rules using selected traits, not composer impersonations.
export class GardenPlan {
  constructor(base, seed, selection = 0, options = {}) {
    this.base = base;
    this.tonic = base.tonic; this.scale = base.scale;
    this.progression = base.progression; this.motif = base.motif;
    this.influences = gardenInfluences(seed, selection);
    this.primary = this.influences[0].value;
    this.secondary = this.influences[1].value;
    this.barSteps = this.primary === 6 ? 6 : 8;
    this.ensemble = new GardenEnsemble(seed, this.primary, this.secondary);
    this.seed = seed; this.stringPool = options.strings ?? 0;
    this.arrangement = chooseArrangement(seed, options.arrangements ?? 4);
  }

  frequency(degree, octave = 0) { return this.base.frequency(degree, octave); }
  chordAt(bar) { return this.progression[bar % this.progression.length]; }

  events(step) {
    const score = this.scoreEvents(step);
    const notes = this.arrangement.value === 4 ? this.ensemble.arrange(score, step, this)
      : score.map((event) => ({ ...event, palette: this.arrangement.value === 1 ? 'original' : 'resonant' }));
    return notes.map((event) => ['string', 'cello', 'violin'].includes(event.instrument)
      ? { ...event, stringStyle: chooseString(this.seed, this.stringPool, event.role, event.frequency) } : event);
  }

  scoreEvents(step) {
    const bar = Math.floor(step / this.barSteps), position = step % this.barSteps;
    const chord = this.chordAt(bar), phrase = Math.floor(bar / 4), cadence = bar % 4 === 3;
    const has = (id) => this.primary === id || this.secondary === id;
    const events = [];
    const add = (degree, octave, beats, instrument, amplitude, pan, delay = 0) => {
      const note = { frequency: this.frequency(chord + degree, octave), beats, instrument, amplitude, pan, delay,
        role: instrument === 'flute' || (instrument === 'string' && pan > 0) ? 'answer' : 'accompaniment' };
      events.push(note); return note;
    };
    const piano = has(5);
    if (position === 0) add(0, 0, this.primary === 6 ? 2.8 : 4.5, 'string', 0.025, -0.12).role = 'bass';

    // A three-beat bass/chord sway gives Smetana's character a different metre.
    if (this.primary === 6) {
      if (position === 2 || position === 4) for (const degree of [2, 4]) add(degree, 0, 0.8, 'pluck', 0.017, -0.3);
    } else if (piano || this.primary === 3) {
      const degrees = this.primary === 3 ? [0, 2, 4, 2, 1, 3, 5, 3] : [0, 4, 2, 4, 0, 4, 2, 4];
      const sequence = this.primary === 3 ? Math.floor(bar / 2) % 3 : 0;
      add(degrees[position] + sequence, 1, piano ? 1.5 : 0.85, piano ? 'piano' : 'pluck', 0.018, -0.4);
    } else if (position % 2 === 0) add([0, 2, 4, 2][position / 2], 1, 1.6, 'pluck', 0.021, -0.4);

    let degree = this.motif[position % 8], beats = 0.95;
    let lead = position < this.barSteps - (cadence ? 2 : 0);
    if (this.primary === 1) degree = phrase % 2 ? 4 - degree : degree;
    if (this.primary === 2) {
      degree = bar % 4 < 2 ? degree : 4 - degree;
      if (position === 4 && cadence) degree = 0;
      beats = position % 2 ? 0.85 : 1.35;
    }
    if (this.primary === 3) degree = [0, 1, 2, 4, 3, 2, 1, 0][position] + Math.floor(bar / 2) % 3;
    if (this.primary === 4) {
      const motif = [0, 0, this.motif[2] + 1, 2];
      lead = [0, 1, 2, 4].includes(position);
      degree = motif[Math.min(3, position)] + (phrase % 2 ? 2 : 0);
      if (phrase % 3 === 2) degree = 4 - degree;
      beats = position < 2 ? 0.38 : position === 2 ? 0.7 : 1.6;
    }
    if (this.primary === 5) {
      lead = [0, 2, 3, 5].includes(position);
      degree = this.motif[(position + phrase) % 8]; beats = position === 5 ? 1.6 : 1.25;
    }
    if (this.primary === 6) { degree = this.motif[(position + Math.floor(bar / 2)) % 8]; beats = position % 2 ? 0.8 : 1.3; }
    if (this.primary === 7) { lead = position % 2 === 0; beats = 1.2; degree = this.motif[(position + phrase) % 8]; }
    if (lead) add(degree, 1, beats, piano ? 'piano' : phrase % 2 ? 'flute' : 'string', 0.028, 0.2, piano && position === 0 ? 0.06 : 0).role = 'lead';

    if (has(1) && position >= 2 && position % 2 === 0) {
      const echo = this.motif[(position - 2) % 8] + 2;
      add(echo, 0, 1.9, 'flute', this.primary === 1 ? 0.025 : 0.016, 0.45);
    } else if (position === 2 || position === this.barSteps - 2) {
      add(4 - this.motif[(position + phrase) % 8], 0, 1.8, 'flute', 0.020, 0.4);
    }
    if (this.secondary === 4 && position === 0 && bar % 2 === 0) {
      add(2 + phrase % 3, 0, 0.4, 'string', 0.013, 0.3);
      add(2 + phrase % 3, 0, 0.65, 'string', 0.013, 0.3, 0.5);
    }
    if (this.secondary === 2 && position === this.barSteps - 2 && bar % 2) add(cadence ? 0 : 4, 1, 1.1, 'flute', 0.015, 0.25);
    if (this.secondary === 3 && position % 2 === 1 && !piano) add([0, 2, 4][Math.floor(position / 2) % 3], 1, 0.7, 'pluck', 0.012, -0.3);
    if (this.secondary === 6 && position === 2) add(2, 0, 0.55, 'pluck', 0.015, -0.2, 0.25);
    if (has(7) && position === this.barSteps - 3 && bar % 2 === 0) {
      for (let index = 0; index < 3; index++) add(degree + index, 1, 0.5, 'pluck', this.primary === 7 ? 0.018 : 0.011, 0.35, index / 6);
    }
    if (position === 0) {
      const accent = add(degree, 2, 2.6, 'glass', 0.015, 0.1);
      accent.shimmer = true; accent.role = 'accent';
    }
    return events;
  }
}
