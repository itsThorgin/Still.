import { ElectronicPlan } from './electronic-plan.mjs';
import { composeBassGroove } from './bass-groove.mjs';

// Each remaining character has its own performance, including its opening and reply space.
export const BASS_COLLECTION_WRITING = Object.freeze({
  4: { hold: 2, bass: [[0, 1.3, 0], [6, 0.8, 2], [11, 1.1, 0]], alternate: [[0, 1.8, 0], [9, 1.4, -1]],
    kicks: [[0, 6, 10], [0, 7, 11]], hats: [0, 2, 4, 6, 8, 10, 12, 14], leadBars: [0, 1, 4, 5], arp: [6, 14], motion: 0.125, sub: 0.7, ceiling: 560 },
  5: { hold: 4, bass: [[4, 2.7, 0]], alternate: [[0, 1.6, 0], [11, 0.75, 4]],
    kicks: [[0, 7, 10], [0, 3, 9], [0, 10], [3, 7, 14]], snares: [[4, 12], [4, 11, 14], [4, 12], [4, 10, 15]],
    hats: [0, 3, 6, 8, 11, 14], leadBars: [0, 3, 4, 6], arp: [11], motion: 0.125, sub: 0.66, ceiling: 750 },
  7: { hold: 1, bass: [[0, 0.45, 0], [3, 0.34, 0], [8, 0.45, -1], [11, 0.4, 0]], alternate: [[0, 0.55, 0], [6, 0.35, 1], [10, 0.6, 0]],
    kicks: [[0, 6, 10], [0, 7, 15]], hats: [2, 6, 9, 10, 14], leadBars: [0, 2, 4, 6], arp: [7], motion: 0.5, sub: 0.58, ceiling: 1100 },
  8: { hold: 2, bass: [[0, 1.3, 0], [6, 0.7, 2], [10, 1.25, 4]], alternate: [[0, 1.4, 0], [7, 1.5, -1]],
    kicks: [[0, 6, 9], [0, 7, 10]], hats: [0, 2, 4, 6, 8, 10, 12, 14], leadBars: [0, 1, 2, 4, 5, 6], arp: [6, 14], motion: 0.125, sub: 0.75, ceiling: 470 },
  9: { hold: 2, bass: [[0, 0.65, 0], [5, 0.5, 4], [10, 0.8, 0]], alternate: [[3, 0.55, 0], [8, 0.65, 0], [13, 0.5, -1]],
    kicks: [[0, 3, 10], [0, 5, 11, 14], [0, 7, 10], [3, 8, 14]], snares: [[4, 12], [4, 10, 14], [4, 12, 15], [4, 11, 14]],
    hats: [0, 2, 5, 8, 10, 13], leadBars: [0, 2, 4, 6], arp: [2, 6, 10, 14], motion: 0.5, sub: 0.6, ceiling: 1050 },
  10: { hold: 2, bass: [[0, 1.7, 0], [12, 0.6, -1]], alternate: [[3, 1.35, 0]],
    kicks: [[0, 14], [3], [0, 11], [5]], hats: [2, 7, 14], leadBars: [1, 3, 5], arp: [14], motion: 0.25, sub: 0.71, ceiling: 950 },
  11: { hold: 4, bass: [[2, 2.6, 0]], alternate: [[0, 1.6, 0], [10, 1.15, 2]],
    kicks: [[0, 7, 10], [0, 6, 13]], hats: [2, 6, 8, 10, 14], leadBars: [0, 2, 4, 5], arp: [10], motion: 0.125, sub: 0.74, ceiling: 440 },
  12: { hold: 1, bass: [[0, 0.3, 0], [3, 0.38, 1], [7, 0.28, 0], [10, 0.5, -1], [14, 0.28, 0]],
    alternate: [[0, 0.48, 0], [5, 0.34, 3], [9, 0.36, 0], [13, 0.35, 1]],
    kicks: [[0, 5, 10, 14], [0, 7, 9]], hats: [0, 3, 6, 8, 10, 14], leadBars: [1, 2, 5, 6], arp: [6, 15], motion: 1, sub: 0.5, ceiling: 1700 },
  13: { hold: 4, bass: [[0, 2.9, 0]], alternate: [], kicks: [[0], [], [0, 11], []],
    hats: [14], leadBars: [1, 5], arp: [], motion: 0.0625, sub: 0.9, ceiling: 180 },
  14: { hold: 2, bass: [[0, 0.9, 0], [5, 0.7, 2], [10, 0.6, 0]], alternate: [[0, 1.3, 0], [8, 0.9, 4], [14, 0.3, -1]],
    kicks: [[0, 5, 10], [0, 3, 9, 14], [0, 7, 11], [0, 6, 10, 15]], snares: [[4, 12], [4, 11, 14], [4, 12], [4, 9, 13, 15]],
    hats: [0, 2, 6, 9, 12, 14], leadBars: [0, 1, 2, 4, 5, 6], arp: [10, 14], motion: 0.25, sub: 0.64, ceiling: 950 },
  15: { hold: 2, bass: [[4, 2.25, 0]], alternate: [[0, 1.4, 0], [11, 0.8, 4]],
    kicks: [[0, 13], [5], [0, 11], [3, 14]], hats: [2, 6, 14], leadBars: [0, 2, 4, 6], arp: [14], motion: 0.125, sub: 0.76, ceiling: 680 },
});

export class BassCollectionPlan extends ElectronicPlan {
  constructor(seed, selection) {
    super(seed, 'bassmusic', selection);
    this.writing = BASS_COLLECTION_WRITING[this.character.value];
    if (!this.writing) throw new Error('Unsupported bass character');
  }
  events(step) {
    super.events(step);
    const c = this.character, w = this.writing, id = c.value;
    const bar = Math.floor(step / 16), tick = step % 16, local = bar % 8, chapter = Math.floor(bar / 32);
    const section = c.form[Math.floor(bar / 8) % c.form.length];
    const quiet = ['break', 'bridge'].includes(section), lifted = ['lift', 'return', 'finale'].includes(section);
    const half = c.groove === 'halftime', jungle = c.groove === 'jungle', hard = [7, 12].includes(id);
    const cadence = local === 7, kit = half ? 'foundation-deep' : jungle || hard ? 'foundation-break' : 'foundation-liquid';
    const chord = (section === 'bridge' ? c.bridge : c.progression)[Math.floor(bar / w.hold) % 8];
    const events = [];
    const note = (degree, octave, beats, role, instrument, amplitude, pan = 0, extra = {}) => {
      let frequency = this.frequency(degree, octave);
      if (role === 'bass') {
        while (frequency > (half ? 75 : 100)) frequency /= 2;
        while (frequency < 35) frequency *= 2;
      }
      events.push({ frequency, beats, role, instrument, amplitude, pan, kit, ...extra });
    };
    const drum = (drum, amplitude, extra = {}) => events.push({ drum, amplitude, kit, ...extra });
    // Atmospheric characters hold a bed; harder characters use short low chord pulses.
    if (bar % w.hold === 0 && tick === 0) for (const [i, degree] of c.voicing.entries())
      note(chord + degree, 0, hard ? 1.25 : w.hold * 4 - 0.25, 'accompaniment', c.pad,
        quiet ? 0.016 : hard ? 0.011 : 0.017, (i - (c.voicing.length - 1) / 2) * 0.28);
    const arpTicks = quiet ? (local % 2 ? [] : w.arp.slice(0, 1)) : w.arp;
    if (arpTicks.includes(tick) && !(cadence && tick >= 8)) {
      const degree = c.arp[(local + arpTicks.indexOf(tick) + (this.colour >>> 7) % c.arp.length) % c.arp.length];
      note(chord + degree, [4, 11, 14].includes(id) ? 1 : 0, id === 9 ? 0.32 : 0.65,
        'accompaniment', c.pluck, id === 9 ? 0.025 : 0.022, tick % 4 ? 0.4 : -0.4);
      if (id === 9) note(chord + 4, 0, 0.32, 'accompaniment', c.pluck, 0.015, -0.2);
    }
    let bassPhrase = bar % 2 ? w.alternate : w.bass;
    if (quiet) bassPhrase = local % 2 ? [] : w.bass.slice(0, 1);
    if (id === 10 && [1, 5].includes(local) && !quiet) bassPhrase = [];
    if (id === 15 && lifted && local % 4 === 2) bassPhrase = w.bass;
    for (const [at, beats, offset] of bassPhrase) if (tick === at && !(cadence && tick >= 8)) {
      const turn = chapter > 0 && local === 6 ? (this.colour & 1 ? 1 : -1) : 0;
      const instrument = id === 8 ? 'round-bass' : id === 12 && local % 4 >= 2 ? 'pulse-bass' : c.bass;
      note(chord + offset + turn, -1, quiet ? Math.min(2.2, beats) : beats, 'bass', instrument,
        quiet ? 0.095 : half ? 0.18 : hard ? 0.165 : 0.15, 0,
        { motionRate: id === 12 && bar % 2 ? 0.5 : w.motion, cutoffCeiling: w.ceiling,
          subWeight: w.sub, attack: hard ? 0.005 : 0.014, release: hard ? 0.035 : 0.11 });
    }
    // Low calls, flowing keys and long atmospheric notes occupy different bars.
    let leadBar = quiet ? local === 2 || local === 5 : w.leadBars.includes(local);
    if (id === 10 && !quiet) leadBar = local === 1 || local === 5;
    if (id === 15 && lifted) leadBar = [0, 1, 2, 4, 5, 6].includes(local);
    let rhythm = c.rhythms[(bar + this.rhythm) % c.rhythms.length];
    if (id === 5) rhythm = [0, 11];
    if (id === 11) rhythm = [6, 13];
    if (id === 13) rhythm = [11];
    if (id === 10) rhythm = [2, 10];
    const index = rhythm.indexOf(tick);
    if (leadBar && index >= 0 && !(cadence && tick >= 8)) {
      const degree = this.motif[(local * 2 + index + chapter) % 16];
      const gap = ((rhythm[index + 1] ?? 16) - tick) / 4;
      const duration = id === 11 ? 2.1 : id === 5 ? 1.5 : id === 13 ? 1.4 : hard ? Math.min(0.65, gap * 0.7) : Math.max(0.3, gap * 0.9);
      note(chord + degree, c.leadOctave ?? (half || hard ? 0 : 1), duration, 'melody', c.lead,
        quiet ? 0.047 : id === 15 && lifted ? 0.073 : 0.062, -0.16);
    }
    if (!quiet && !cadence && local % 4 === 3 && tick === (id === 9 ? 6 : 13) && id !== 13)
      note(chord + c.answer[(local + chapter * 3) % 16], half || hard ? 0 : 1,
        id === 11 ? 1.6 : 0.7, 'melody', c.reply, 0.035, 0.35);

    const kicks = quiet ? (local % 2 ? [] : [0]) : w.kicks[bar % w.kicks.length];
    if (kicks.includes(tick) && !(half && cadence && tick > 8)) drum('kick', tick === 0 ? 0.23 : 0.18);
    const accents = half ? (quiet && local % 2 ? [] : [8])
      : quiet ? [12] : w.snares?.[bar % w.snares.length] ?? [4, 12];
    if (accents.includes(tick)) drum('snare', half ? 0.19 : [4, 12].includes(tick) ? 0.165 : 0.09,
      jungle ? { tuning: tick % 4 ? 1.3 : 1.08, duration: tick % 4 ? 0.075 : 0.16 } : hard ? { duration: 0.13, tuning: id === 12 ? 1.19 : 0.94 } : {});
    const hats = quiet ? [14] : w.hats;
    if (hats.includes(tick) && !(half && cadence && tick > 8))
      drum('hat', tick % 4 === 2 ? 0.035 : 0.019, { delay: jungle && tick % 4 === 2 ? 0.03 : id === 8 ? 0.02 : 0,
        duration: hard ? 0.045 : half ? 0.065 : 0.075 });
    if (jungle && !quiet && local % 4 === 3 && [7, 15].includes(tick))
      drum('snare', 0.026, { duration: 0.065, tuning: 1.35, delay: 0.02 });
    if (!half && !jungle && !hard && !quiet && local === 6 && tick === 15)
      drum('snare', 0.022, { duration: 0.075 });
    return composeBassGroove(this, events, step);
  }
}
