import { gardenHash } from '../garden-options.mjs';
import { electronicCharacter } from '../electronic-characters.mjs';

export class ElectronicPlan {
  constructor(seed, kind, selection = 1) {
    this.seed = seed; this.kind = kind;
    this.character = electronicCharacter(kind, selection, seed);
    this.scale = this.character.scale;
    this.tonic = this.character.tonic[gardenHash(seed, 1) % this.character.tonic.length];
    this.progression = this.character.progression;
    this.epoch = -1; this.phrase = -1;
  }
  frequency(degree, octave = 0) {
    const index = (degree % 7 + 7) % 7;
    return 440 * 2 ** ((this.tonic + this.scale[index] + 12 * (octave + Math.floor(degree / 7)) - 69) / 12);
  }
  events(step) {
    const bar = Math.floor(step / 16), tick = step % 16;
    const chapter = Math.floor(bar / 32), phrase = Math.floor(bar / 8);
    const c = this.character, wave = this.kind === 'synthwave';
    const section = c.form[phrase % c.form.length], sparse = section === 'break' || section === 'bridge';
    const lifted = ['return', 'lift', 'solo', 'finale'].includes(section);
    const cadence = bar % 8 === 7;
    if (phrase !== this.phrase) {
      this.phrase = phrase; this.epoch = chapter;
      this.colour = gardenHash(this.seed ^ c.value * 0x9e37, 0x513 + phrase);
      this.rhythm = this.colour % c.rhythms.length;
      const base = ['answer', 'bridge', 'solo'].includes(section) ? c.answer : c.theme;
      this.motif = base.map((degree, i) => {
        if (i === 0 || i === 15) return degree;
        const choice = gardenHash(this.seed, phrase * 97 + i * 31 + c.value * 503);
        return degree + (choice % 5 === 0 ? (choice & 16 ? 1 : -1) : 0)
          + (chapter > 0 && i % 5 === 2 ? ((choice >>> 8) % 3 - 1) : 0);
      });
      this.answer = c.answer;
    }
    const bridge = section === 'bridge' || (section === 'solo' && chapter % 2);
    const chord = (bridge ? c.bridge : c.progression)[bar % 8];
    const events = [];
    const note = (degree, octave, beats, role, instrument, amplitude, pan = 0, extra = {}) => events.push({
      frequency: this.frequency(degree, octave), beats, role, instrument, amplitude, pan, kit: c.kit, ...extra,
    });
    const drum = (drum, amplitude, extra = {}) => events.push({ drum, amplitude, kit: c.kit, ...extra });
    if (tick === 0) {
      const inversion = (this.colour >>> 6) % 3;
      const voicing = c.voicing.map((degree, i) => degree + (i < inversion ? 7 : 0));
      voicing.forEach((degree, i) => note(chord + degree, degree > 10 ? -1 : 0, 3.9,
        'accompaniment', c.pad, sparse ? 0.019 : 0.023, (i - (voicing.length - 1) / 2) * 0.32));
    }
    let arpTicks = sparse ? [2, 10] : c.groove === 'dark' ? [3, 11, 14] : c.groove === 'halftime' ? [6, 14]
      : c.groove === 'jungle' ? [2, 7, 10, 15] : wave ? [0, 2, 4, 6, 8, 10, 12, 14] : [2, 6, 10, 14];
    if (!sparse && c.arpTicks) arpTicks = c.arpTicks;
    if (section === 'solo' && bar % 2) arpTicks = [0, 3, 6, 8, 11, 14];
    if (arpTicks.includes(tick) && !(cadence && tick > 11)) {
      const arpIndex = (Math.floor(tick / 2) + bar + (this.colour >>> 8) % 4) % c.arp.length;
      const octave = c.pluck === 'dub-stab' || c.pluck === 'dark-keys' ? 0 : 1;
      note(chord + c.arp[arpIndex], octave, c.pluck === 'dub-stab' ? 0.42 : wave ? 0.38 : 0.6,
        'accompaniment', c.pluck, 0.032, tick % 4 ? 0.48 : -0.48);
      if (c.pluck === 'dub-stab' || (c.groove === 'arcade' && tick === 6)) {
        for (const interval of [2, 4]) note(chord + interval, 0, 0.38, 'accompaniment', c.pluck, 0.014, 0.22);
      }
    }
    const bassTicks = sparse ? [0, 10] : c.bassRhythms[(bar + (this.colour >>> 3)) % c.bassRhythms.length];
    const bassIndex = bassTicks.indexOf(tick);
    if (bassIndex >= 0) {
      const approach = cadence && tick >= 12 ? (bar % 16 === 7 ? -1 : 1) : 0;
      const jump = !sparse && bassIndex % 3 === 2 ? (c.groove === 'arcade' ? 2 : 4) : 0;
      const gap = ((bassTicks[bassIndex + 1] ?? 16) - tick) / 4, degree = chord + jump + approach;
      note(degree, degree >= 7 ? -2 : -1, sparse ? 1.8 : c.groove === 'halftime' ? Math.min(1.8, gap * 0.96) : Math.min(1.2, gap * 0.84),
        'bass', c.bass, wave ? 0.12 : 0.15, 0, { motionRate: [0.5, 1, 2][(bar + bassIndex + (this.colour >>> 12)) % 3] });
    }
    const rhythm = c.rhythms[(bar + this.rhythm) % c.rhythms.length], index = rhythm.indexOf(tick);
    const leadBar = sparse ? bar % 4 === 2 : lifted || c.groove === 'dark' ? true : bar % 2 === 0;
    if (index >= 0 && leadBar && !(cadence && tick >= 8)) {
      const phraseIndex = (bar % 8 * 2 + index + (section === 'solo' ? 3 : 0)) % 16;
      let degree = this.motif[phraseIndex];
      if (index === 0) degree = [0, 2, 4, lifted ? 6 : 2][Math.abs(degree) % 4];
      if (cadence) degree = index === 0 ? 2 : 0;
      if (lifted && wave && bar % 4 === 2 && index === 1) degree += 7;
      const gap = ((rhythm[index + 1] ?? 16) - tick) / 4;
      const octave = c.leadOctave ?? (c.groove === 'dark' || c.groove === 'halftime' ? 0 : 1);
      note(chord + degree, octave, Math.max(0.22, gap * (c.groove === 'dark' ? 1.12 : 0.88)), 'melody', c.lead, sparse ? 0.058 : 0.073, -0.13);
      if (wave && lifted && bar % 4 === 2 && index === 0) note(chord + degree - 2, octave, Math.min(1.6, gap), 'melody', c.reply, 0.026, 0.28);
    }
    if (['answer', 'return', 'finale'].includes(section) && bar % 2 && [6, 13].includes(tick) && !cadence) {
      note(chord + c.answer[(bar * 2 + (tick === 13 ? 3 : 0)) % 16], wave ? 1 : 0, 0.65, 'melody', c.reply, 0.042, 0.38);
    }
    if (wave && lifted && bar % 8 === 6 && [13, 14, 15].includes(tick)) note(chord + [4, 6, 7][tick - 13], 1, 0.21, 'melody', c.lead, 0.04, 0.1);
    const groove = c.groove;
    let kicks = wave ? groove === 'dark' ? [0, 6, 10] : groove === 'arcade' ? [0, 6, 8, 14] : [0, 4, 8, 12]
      : groove === 'halftime' ? [[0, 7, 11], [0, 6, 14]][bar % 2]
      : groove === 'jungle' ? [[0, 6, 11], [0, 3, 10, 14], [0, 7, 10]][bar % 3]
      : [[0, 6, 10], [0, 7, 10], [0, 6, 11, 14]][(bar + this.rhythm) % 3];
    if (c.kickPatterns) kicks = c.kickPatterns[bar % c.kickPatterns.length];
    if (sparse) kicks = [0];
    if (kicks.includes(tick)) drum('kick', wave ? 0.20 : 0.23);
    const snares = sparse ? [12] : groove === 'halftime' ? [8] : [4, 12];
    if (snares.includes(tick)) {
      drum('snare', wave ? 0.125 : 0.19);
      if (wave && groove !== 'dark') drum('clap', 0.055, { delay: 0.025 });
    }
    const hatTicks = sparse ? [6, 14] : c.hatTicks ?? (groove === 'halftime' ? [2, 6, 10, 14] : wave ? [2, 6, 10, 14] : [0, 2, 6, 8, 10, 14]);
    if (hatTicks.includes(tick)) drum(tick === 14 && bar % 4 === 3 ? 'open-hat' : 'hat', 0.047, { delay: groove === 'jungle' && tick % 4 === 2 ? 0.04 : 0 });
    if (!sparse && ['liquid', 'jungle'].includes(groove) && [3, 9, 15].includes(tick) && ((this.colour >>> (tick % 8)) & 1)) drum('snare', groove === 'jungle' ? 0.05 : 0.03, { delay: 0.025 });
    if (!sparse && groove === 'jungle' && tick % 4 === 3) drum('hat', 0.022);
    if (cadence && !sparse && tick >= (groove === 'jungle' ? 13 : 14)) drum(wave && groove === 'arcade' ? 'tom' : 'snare', 0.045 + (tick - 13) * 0.018);
    return events;
  }
}
