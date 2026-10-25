import { ElectronicPlan } from './electronic-plan.mjs';
import { composeBassGroove } from './bass-groove.mjs';

// Four approved performances. Other characters retain their own existing scores.
export const BASS_FOUNDATION_IDS = Object.freeze([1, 2, 3, 6]);
export class BassFoundationPlan extends ElectronicPlan {
  constructor(seed, selection) {
    super(seed, 'bassmusic', selection);
    if (!BASS_FOUNDATION_IDS.includes(this.character.value)) throw new Error('Unsupported foundation');
  }
  events(step) {
    // Retain the character's seeded harmony and motif development, replace its performance.
    const original = super.events(step), c = this.character;
    const bar = Math.floor(step / 16), tick = step % 16, phrase = Math.floor(bar / 8);
    const section = c.form[phrase % c.form.length];
    const sparse = ['break', 'bridge'].includes(section), cadence = bar % 8 === 7;
    const deep = c.groove === 'halftime', jungle = c.groove === 'jungle';
    const kit = deep ? 'foundation-deep' : jungle ? 'foundation-break' : 'foundation-liquid';
    const events = [];
    const drum = (drum, amplitude, extra = {}) => events.push({ drum, amplitude, kit, ...extra });
    if (!deep) {
      // Liquid connects bass notes. Jungle separates them and answers the break accents.
      for (const event of original.filter((event) => !event.drum)) {
        if (event.role === 'bass') events.push({ ...event,
          beats: event.beats * (jungle ? 0.78 : 1.14), motionRate: jungle ? 0.5 : 0.125,
          cutoffCeiling: jungle ? 1400 : 650, subWeight: jungle ? 0.55 : 0.68 });
        else if (!jungle || event.role !== 'melody' || bar % 4 < 2) events.push(event);
      }
      if (jungle) {
        const kicks = sparse ? [0] : [[0, 6, 10], [0, 3, 11, 14], [0, 7, 10], [0, 3, 10, 15]][bar % 4];
        if (kicks.includes(tick)) drum('kick', tick === 0 ? 0.23 : 0.17, { tuning: tick === 0 ? 1.08 : 1.2 });
        const accents = sparse ? [12] : [[4, 12], [4, 11, 14], [4, 12], [4, 10, 13, 15]][bar % 4];
        if (accents.includes(tick)) drum('snare', tick === 4 || tick === 12 ? 0.18 : 0.105,
          { tuning: tick % 4 ? 1.28 : 1.1, duration: tick % 4 ? 0.09 : 0.17 });
        if (!sparse && [[7], [9], [3, 15], [7, 12]][bar % 4].includes(tick))
          drum('snare', 0.035, { tuning: 1.3, duration: 0.07, delay: 0.018 });
        if ((sparse ? [6, 14] : [0, 2, 5, 6, 8, 10, 13, 14]).includes(tick))
          drum('hat', tick % 4 === 2 ? 0.039 : 0.021, { delay: tick % 4 === 2 ? 0.035 : 0, duration: 0.06 });
      } else {
        if ((sparse ? [0] : [[0, 6, 10], [0, 7, 10]][bar % 2]).includes(tick)) drum('kick', tick === 0 ? 0.22 : 0.18);
        if ((sparse ? [12] : [4, 12]).includes(tick)) drum('snare', 0.16);
        if ((sparse ? [6, 14] : [0, 2, 4, 6, 8, 10, 12, 14]).includes(tick))
          drum('hat', tick % 4 === 2 ? 0.037 : 0.019, { delay: tick % 4 === 2 ? 0.012 : 0 });
        // One quiet pickup per four bars, without jungle's rolls and displaced accents.
        if (!sparse && bar % 4 === 3 && tick === 15) drum('snare', 0.022, { duration: 0.08 });
      }
      return composeBassGroove(this, events, step);
    }

    const pressure = c.value === 6, cycle = bar % 4, chapter = Math.floor(bar / 32);
    // Harmony holds for two bars. Bass stays in the sub register, even over high chords.
    const chord = (section === 'bridge' ? c.bridge : c.progression)[Math.floor(bar / 2) % 8];
    const note = (degree, octave, beats, role, instrument, amplitude, pan = 0, extra = {}) => {
      let frequency = this.frequency(degree, octave);
      if (role === 'bass') {
        while (frequency > 70) frequency /= 2;
        while (frequency < 35) frequency *= 2;
      }
      events.push({ frequency, beats, role, instrument, amplitude, pan, kit, ...extra });
    };
    if (bar % 2 === 0 && tick === 0) for (const [i, degree] of c.voicing.entries())
      note(chord + degree, 0, 7.6, 'accompaniment', c.pad, sparse ? 0.015 : 0.012, (i - 1) * 0.3);

    const bassPhrase = pressure
      ? [[[0, 1.5, 0], [13, 0.48, 0]], [[3, 1.4, 1]], [[0, 2.2, 0]], [[5, 1.2, -1]]]
      : [[[0, 1.9, 0], [12, 0.65, 0]], [[2, 1.6, 0]], [[0, 2.7, 0]], [[5, 1.35, 0]]];
    if (!(sparse && cycle % 2) && !(cadence && tick >= 8)) {
      const turn = cycle === 3 && chapter > 0 ? [0, 1, -1][chapter % 3] : 0;
      for (const [at, beats, degree] of bassPhrase[cycle]) if (tick === at) note(chord + degree + turn, -1,
        sparse ? Math.min(1.5, beats) : beats, 'bass', pressure ? 'wobble-bass' : 'round-bass', sparse ? 0.12 : 0.19,
        0, { motionRate: pressure ? 0.25 : 0.125, cutoffCeiling: pressure ? 620 : 260,
          subWeight: pressure ? 0.72 : 0.86, attack: 0.014, release: 0.11 });
    }
    // Isolated calls answer the bass. Whole bars stay free of melodic onsets.
    const replyTick = pressure ? 12 : 11;
    if ((bar % 4 === 1 || sparse && bar % 4 === 2) && tick === replyTick && !cadence)
      note(chord + this.motif[(phrase * 2 + cycle) % 16], 0, sparse ? 1.4 : 0.85,
        'melody', pressure ? c.lead : c.reply, 0.047, 0.25);
    if (bar % 4 === 2 && tick === 14 && !sparse)
      for (const degree of [0, 4]) note(chord + degree, 0, 0.4, 'accompaniment', c.pluck, 0.019, -0.3);

    const kicks = sparse ? (cycle % 2 ? [] : [0])
      : pressure ? [[0, 13], [3], [0, 11], [5]][cycle] : [[0], [2, 14], [0, 11], [5]][cycle];
    if (kicks.includes(tick) && !(cadence && tick > 8)) drum('kick', tick === 0 ? 0.25 : 0.2);
    // Keep beat three in breaks too. Phrase endings subtract hits instead of rolling snares.
    if (tick === 8 && (!sparse || cycle % 2 === 0)) drum('snare', sparse ? 0.12 : 0.20);
    const hats = sparse ? [14] : [[6, 14], [6, 10, 14], [2, 14], [6, 14]][cycle];
    if (hats.includes(tick) && !(cadence && tick > 8)) drum('hat', tick === 14 ? 0.031 : 0.022,
      { delay: tick === 14 ? 0.025 : 0, duration: 0.07 });
    if (!sparse && bar % 8 === 6 && tick === 15) drum('tom', 0.046, { tuning: 0.8 });
    return events;
  }
}
