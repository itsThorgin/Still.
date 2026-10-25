import { gardenHash } from '../garden-options.mjs';
import { electronicCharacter } from '../electronic-characters.mjs';
import { ambientSceneEvents } from './ambient-scene-plan.mjs';

export class AmbientPlan {
  constructor(seed, selection = 1) {
    this.seed = seed; this.kind = 'ambient';
    this.character = electronicCharacter('ambient', selection, seed);
    const c = this.character;
    this.scale = c.scale; this.tonic = c.tonic[gardenHash(seed, 1) % c.tonic.length];
    this.phrase = -1;
  }
  frequency(degree, octave = 0) {
    const index = (degree % 7 + 7) % 7;
    return 440 * 2 ** ((this.tonic + this.scale[index] + 12 * (octave + Math.floor(degree / 7)) - 69) / 12);
  }
  events(step) {
    if (this.character.sceneWriting) return ambientSceneEvents(this, step);
    const c = this.character, bar = Math.floor(step / 16), tick = step % 16;
    const phrase = Math.floor(bar / 4), chapter = Math.floor(bar / 32), scene = c.order[phrase % 8];
    const quiet = [4, 6].includes(scene), open = [2, 5].includes(scene), local = bar % 8;
    if (phrase !== this.phrase) {
      this.phrase = phrase; this.colour = gardenHash(this.seed ^ c.value * 0x9e37, phrase + 0xa131);
      this.motif = c.theme.map((degree, i) => degree + (i % 3 === 1 && ((this.colour >>> i) & 1) ? 1 : 0));
      this.layerTargets = { melody: quiet ? 0.75 : open ? 1.1 : 1, accompaniment: quiet ? 0.6 : open ? 0.82 : 1,
        bass: quiet ? 0.7 : open ? 0.75 : 1, percussion: quiet ? 0 : 1 };
    }
    const chordIndex = Math.floor(bar / c.hold) % c.progression.length;
    const chord = c.progression[chordIndex], events = [];
    const note = (degree, octave, beats, role, instrument, amplitude, pan = 0) => {
      let frequency = this.frequency(degree, octave);
      if (role === 'bass') { while (frequency > 75) frequency /= 2; while (frequency < 32) frequency *= 2; }
      events.push({ frequency, beats, role, instrument, amplitude, pan, motionRate: 0.03125 });
    };
    if (tick === 0 && bar % c.hold === 0) {
      const voicing = quiet ? c.voicing.filter((_, i) => i % 2 === 0) : c.voicing;
      for (const [i, degree] of voicing.entries()) note(chord + degree, degree > 7 ? 0 : 1,
        c.hold * 4 + 1.4, 'accompaniment', c.pad, quiet ? 0.018 : 0.026,
        (i - (voicing.length - 1) / 2) * 0.34);
    }
    if (bar % c.bassBars === 0 && c.bassTicks.includes(tick) && !(quiet && tick > 0))
      note(chord, 0, Math.max(3, c.bassBars * 4 - tick / 4 + 0.6), 'bass', c.bass,
        quiet ? 0.055 : open ? 0.065 : 0.085);
    const leadBar = quiet ? local === 3 : c.leadBars.includes(local);
    const rhythm = c.rhythms[(bar + (this.colour >>> 7)) % c.rhythms.length], index = rhythm.indexOf(tick);
    if (leadBar && index >= 0 && !(bar % 8 === 7 && tick >= 8)) {
      const degree = this.motif[(local * 2 + index + chapter) % c.theme.length];
      note(chord + degree, c.value === 9 || c.value === 13 ? 0 : 1, c.noteLength * (open ? 1.15 : 1),
        'melody', c.lead, quiet ? 0.026 : open ? 0.052 : 0.038, -0.2);
    }
    // The interlocking character's three-bar notes move against its five-bar sparkles.
    const patternBar = c.value === 8 ? bar % 3 !== 1 : bar % 2 === (this.colour & 1);
    if (!quiet && patternBar && c.pattern.includes(tick) && !(bar % 8 === 7 && tick >= 8))
      note(chord + c.theme[(bar + c.pattern.indexOf(tick)) % c.theme.length], 1,
        c.value === 14 ? 0.65 : 1.5, 'accompaniment', c.pluck, c.value === 14 ? 0.018 : 0.016, 0.35);
    const detailBar = c.value === 8 ? bar % 5 === 2 : bar % 4 === (c.value % 4);
    if (!quiet && detailBar && tick === (c.value % 2 ? 11 : 5))
      note(chord + [4, 7, 9][(this.colour >>> 5) % 3], 2, 0.8, 'percussion', c.detail, 0.016, 0.5);
    return events;
  }
}
