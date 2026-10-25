import {BassScore,TechnoScore} from './music-score.mjs';
import {SequencePlan} from './sequence-plan.mjs';
import { ElectronicPlan } from './electronic-plan.mjs';
import { AmbientPlan } from './ambient-plan.mjs';
import { FantasyPlan, LoungePlan } from './journey-plan.mjs';
import { electronicCharacter } from '../electronic-characters.mjs';
import { gardenHash } from '../garden-options.mjs';
import { SynthwavePlan } from './synthwave-plan.mjs';

export const NEON_DEPTH_SECTIONS = Object.freeze([
  { label: 'Deep foundation', focus: 'Low riff and bass', bass: 1, melody: 0.2, arp: 0.4 },
  { label: 'Shadow motion', focus: 'Bass and low answering voice', bass: 0.92, melody: 0.32, arp: 0.55 },
  { label: 'Light in the distance', focus: 'Lighter melody comes forward', bass: 0.09, melody: 1, arp: 0.65 },
  { label: 'Heavy return', focus: 'Low riff takes the foreground again', bass: 1, melody: 0.3, arp: 0.48 },
  { label: 'Under the city', focus: 'Long low notes and open space', bass: 0.7, melody: 0.12, arp: 0.18 },
  { label: 'Open horizon', focus: 'Longer lighter phrases', bass: 0.08, melody: 0.95, arp: 0.55 },
  { label: 'Night pulse', focus: 'Developed bass-led return', bass: 1, melody: 0.34, arp: 0.5 },
  { label: 'Afterimage', focus: 'Deep pulse with distant replies', bass: 0.78, melody: 0.58, arp: 0.3 },
]);

const WRITING = {
  1: {
    scale: [0, 2, 3, 5, 7, 8, 10],
    progression: [0, 0, 5, 5, 3, 3, 6, 4], light: [5, 5, 3, 3, 0, 0, 6, 6],
    theme: [0, 0, 4, 3, 2, 0, -1, 0, 4, 3, 2, 1, 0, -1, 1, 0],
    answer: [4, 6, 7, 6, 4, 2, 1, 0, 2, 4, 3, 2, 1, 0, -1, 0],
    bass: [[0, 2, 6, 8, 10, 14], [0, 3, 6, 8, 12, 14], [0, 2, 4, 8, 11, 14]],
    lowRiff: [0, 0, 4, 0, -1, 0, 2, 0], lightRhythm: [[0, 6, 12], [2, 8], [0, 7, 12], [0, 10]],
  },
  3: {
    scale: [0, 2, 3, 5, 7, 8, 10],
    progression: [0, 0, 5, 5, 2, 2, 6, 6], light: [3, 3, 5, 5, 0, 0, 6, 4],
    theme: [4, 3, 2, 0, 1, 2, 1, -1, 0, 2, 3, 2, 1, 0, -1, 0],
    answer: [4, 6, 7, 6, 4, 2, 3, 4, 2, 1, 0, 2, 1, 0, -1, 0],
    bass: [[0, 3, 6, 8, 12, 14], [0, 2, 6, 8, 11, 14], [0, 4, 6, 8, 10, 15]],
    lowRiff: [0, 4, 0, 2, -1, 0, 4, 0], lightRhythm: [[0, 7, 12], [2, 10], [0, 6, 11], [3, 8]],
  },
};

export class NeonDepthPlan extends ElectronicPlan {
  constructor(seed, selection = 1) {
    super(seed, 'synthwave', selection);
    this.writing = WRITING[selection] ?? this.character.depthWriting;
    if (!this.writing) throw new RangeError('This character does not use the depth arrangement.');
    this.scale = this.writing.scale;
    this.progression = this.writing.progression;
    this.character = { ...this.character, scale: this.scale, progression: this.progression,
      theme: this.writing.theme, answer: this.writing.answer,
      form: (this.writing.order ?? [0, 1, 2, 3, 4, 5, 6, 7]).map((scene) => NEON_DEPTH_SECTIONS[scene].label) };
    this.phrase = -1;
  }

  events(step) {
    const bar = Math.floor(step / 16), tick = step % 16, phrase = Math.floor(bar / 8);
    const localBar = bar % 8, c = this.character, w = this.writing;
    const scene = w.order ? w.order[phrase % 8] : phrase % 8;
    const focus = NEON_DEPTH_SECTIONS[scene];
    const light = scene === 2 || scene === 5, valley = scene === 4;
    const cadence = localBar === 7;
    if (phrase !== this.phrase) {
      this.phrase = phrase; this.epoch = Math.floor(bar / 32);
      this.colour = gardenHash(this.seed ^ c.value * 0x9e37, phrase + 0x7431);
      this.motif = (light ? w.answer : w.theme).map((degree, i) => {
        if (i === 0 || i === 15) return degree;
        const variation = gardenHash(this.seed, phrase * 83 + i * 23);
        return degree + (variation % 7 === 0 ? (variation & 8 ? 1 : -1) : 0);
      });
      this.answer = w.answer;
    }
    const chord = (light ? w.light : w.progression)[localBar];
    const events = [];
    const note = (degree, octave, beats, role, instrument, amplitude, pan = 0, extra = {}) => events.push({
      frequency: this.frequency(degree, octave), beats, role, instrument, amplitude, pan, kit: c.kit, ...extra,
    });
    const drum = (drum, amplitude, extra = {}) => events.push({ drum, amplitude, kit: c.kit, ...extra });

    if (tick === 0 && localBar % 2 === 0) {
      const voices = light ? [0, 2, 4, 8] : valley ? [0, 4, 7] : w.voicing ?? [0, 2, 4];
      voices.forEach((degree, i) => note(chord + degree, light ? 0 : -1, 7.7,
        'accompaniment', c.pad, light ? 0.023 : valley ? 0.028 : 0.032, (i - (voices.length - 1) / 2) * 0.35));
    }
    const arpTicks = valley ? [10] : w.arpTicks ? w.arpTicks[light ? 1 : 0] : light ? [2, 6, 10, 14] : [2, 10, ...(localBar % 2 ? [14] : [])];
    if (arpTicks.includes(tick) && !(cadence && tick >= 10)) {
      const degree = [0, 4, 2, 4][(Math.floor(tick / 4) + localBar + (this.colour >>> 8)) % 4];
      note(chord + degree, light ? 1 : 0, light ? 0.65 : 0.5, 'accompaniment', c.pluck, 0.027 * focus.arp, tick % 4 ? 0.4 : -0.4);
    }
    const bassTicks = valley ? [0, 10] : light ? [0, 8, ...(localBar % 2 ? [14] : [])]
      : w.bass[(localBar + (this.colour >>> 4)) % w.bass.length];
    const bassIndex = bassTicks.indexOf(tick);
    if (bassIndex >= 0) {
      const variation = localBar >= 4 && bassIndex === bassTicks.length - 1 ? (localBar % 2 ? -1 : 4) : 0;
      const degree = chord + variation;
      const beats = valley ? 2.1 : light ? 1.55 : Math.min(0.85, ((bassTicks[bassIndex + 1] ?? 16) - tick) / 4 * 0.92);
      note(degree, degree >= 7 ? -2 : -1, beats, 'bass', c.bass, 0.155 * focus.bass, 0, { motionRate: 0.5 });
    }
    
    const heavyRhythm = w.heavyRhythm ?? [0, 6, 10];
    if (!light && !valley && heavyRhythm.includes(tick) && localBar % 2 === 0 && !(cadence && tick >= 8)) {
      const development = w.order && phrase >= 8 && heavyRhythm.indexOf(tick) === 1 ? (Math.floor(phrase / 8) % 2 ? 1 : -1) : 0;
      const degree = w.lowRiff[(localBar + heavyRhythm.indexOf(tick) + (this.colour >>> 12)) % w.lowRiff.length] + development;
      note(chord + degree, 0, tick === heavyRhythm[heavyRhythm.length - 1] ? 1.2 : 0.75, 'melody', c.lead, 0.075 * focus.melody, -0.08);
    }
    const rhythm = w.lightRhythm[(localBar + (this.colour >>> 10)) % w.lightRhythm.length];
    const index = rhythm.indexOf(tick);
    if (light && index >= 0 && !(cadence && tick >= 8) && !(localBar % 4 === 3 && tick > 6)) {
      let degree = this.motif[(localBar * 2 + index) % 16];
      if (index === 0) degree = [0, 2, 4][Math.abs(degree) % 3];
      if (cadence) degree = index === 0 ? 2 : 0;
      const gap = ((rhythm[index + 1] ?? 16) - tick) / 4;
      note(chord + degree, 1, Math.max(0.55, gap * 1.05), 'melody', c.lead, 0.073 * focus.melody, -0.13);
    }
    
    if (!light && localBar % 4 === 3 && tick === 4 && !cadence && scene !== 0) {
      note(chord + this.motif[(localBar * 2 + scene) % 16], 1, valley ? 2.1 : 1.5,
        'melody', c.reply, 0.055 * focus.melody, 0.3);
    }
    if (scene === 7 && localBar % 2 && tick === 6 && !cadence) {
      note(chord + w.answer[(localBar * 2 + 1) % 16], 1, 1.7, 'melody', c.reply, 0.034, 0.28);
    }
    const kicks = valley ? [0] : light ? [0, 8] : w.kicks ? w.kicks[localBar % w.kicks.length] : [0, 4, 8, 12];
    if (kicks.includes(tick)) drum('kick', light ? 0.145 : valley ? 0.16 : 0.20);
    if ((valley ? [12] : [4, 12]).includes(tick)) {
      drum('snare', light ? 0.078 : valley ? 0.055 : 0.13);
      if (!light && !valley) drum('clap', 0.042, { delay: 0.025 });
    }
    const hats = valley || light ? [6, 14] : w.hats ?? [2, 6, 10, 14];
    if (hats.includes(tick)) drum(!light && !valley && tick === 14 && localBar % 4 === 3 ? 'open-hat' : 'hat', light ? 0.023 : 0.034);
    if (cadence && !light && !valley && tick === 14) drum('snare', 0.045);
    return events;
  }
}

export function createElectronicPlan(seed, kind, selection = 1, options = {}) {
  if (kind === 'fantasy') return new FantasyPlan(seed,selection,options);
  if (kind === 'lounge') return new LoungePlan(seed,selection,options);
  const character = electronicCharacter(kind, selection, seed);
  if (kind === 'bassmusic' || kind === 'techno') return character.sequence
    ? new SequencePlan(kind,character.value,seed)
    : kind === 'bassmusic' ? new BassScore(seed,character.value) : new TechnoScore(seed,character.value);
  if (kind === 'synthwave' && character.synthwaveWriting) return new SynthwavePlan(seed, character.value);
  if (kind === 'ambient') return new AmbientPlan(seed, character.value);
  return kind === 'synthwave' && ([1, 3].includes(character.value) || character.depthWriting)
    ? new NeonDepthPlan(seed, character.value)
    : new ElectronicPlan(seed, kind, character.value);
}
