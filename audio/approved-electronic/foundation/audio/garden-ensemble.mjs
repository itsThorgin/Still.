// Stable choices for musical roles. Each role has its own seed stream.
function mixed(seed, salt) {
  let value = (seed ^ salt) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}
const pick = (items, seed, salt) => items[mixed(seed, salt) % items.length];
const ORIGINAL = ['string', 'flute', 'piano', 'pluck', 'glass'];
const SUSTAINED = ['string', 'cello', 'violin', 'flute', 'brass', 'clarinet', 'organ'];
const RANGES = { cello: [65, 660], violin: [196, 1568], flute: [196, 1568], brass: [98, 784], clarinet: [147, 1175],
  string: [98, 1568], piano: [65, 1568], pluck: [98, 1175], harp: [98, 1568], glass: [196, 1568], celesta: [196, 1568], marimba: [98, 1047], organ: [65, 1047] };

export class GardenEnsemble {
  constructor(seed, primary, secondary) {
    const leads = ['cello', 'violin', 'cello', 'violin', 'string', 'flute', 'flute', 'piano', 'pluck',
      'harp', 'clarinet', 'brass', 'glass', 'celesta', 'marimba', 'organ'];
    if (primary === 5 || secondary === 5) leads.push('piano', 'piano', 'piano');
    this.lead = pick(leads, seed, 0x3c6ef372);
    this.bass = pick(['cello', 'cello', 'string', 'piano', 'organ'], seed, 0xa54ff53a);
    this.accompaniment = pick(['pluck', 'harp', 'piano', 'marimba', 'organ'].filter((item) => item !== this.lead), seed, 0x510e527f);
    this.answer = pick(['flute', 'clarinet', 'violin', 'brass'].filter((item) => item !== this.lead), seed, 0x9b05688c);
    this.parts = { lead: this.lead, bass: this.bass, accompaniment: this.accompaniment, answer: this.answer, accent: 'glass' };
    this.palettes = {};
    for (const [index, [role, instrument]] of Object.entries(this.parts).entries()) {
      this.palettes[role] = ORIGINAL.includes(instrument) && mixed(seed, 0x1f83d9ab + index) % 2 === 0 ? 'original' : 'resonant';
    }
  }

  arrange(notes, step, plan) {
    const position = step % plan.barSteps, bar = Math.floor(step / plan.barSteps);
    const events = [];
    for (const source of notes) {
      const role = source.role;
      const instrument = this.parts[role];
      if (!instrument) continue;
      const sustained = SUSTAINED.includes(instrument);
      if (role === 'lead') {
        if (sustained && position % 2 && plan.primary !== 4) continue;
        if (['flute', 'brass', 'clarinet'].includes(instrument) && position >= plan.barSteps - 2 && bar % 2) continue;
        if (['glass', 'celesta'].includes(instrument) && position % 4 !== 0) continue;
      }
      // Answers enter in alternate bars and leave room at the cadence.
      if (role === 'answer' && (bar % 2 === 0 || (bar % 4 === 3 && position >= plan.barSteps - 2))) continue;
      if (role === 'accompaniment' && position % 2 && plan.primary !== 3 && plan.primary !== 5) continue;
      if (role === 'accent' && (this.lead === 'glass' || this.lead === 'celesta')) continue;
      let frequency = source.frequency;
      if (role === 'lead' && instrument === 'cello') frequency /= 2;
      if (role === 'bass') frequency /= 2;
      if (role === 'answer' && instrument === 'violin') frequency *= 2;
      const [low, high] = RANGES[instrument];
      while (frequency < low) frequency *= 2;
      while (frequency > high) frequency /= 2;
      let beats = source.beats;
      if (role === 'lead' && sustained && plan.primary !== 4) beats = instrument === 'flute' || instrument === 'brass' || instrument === 'clarinet' ? 0.87 : 1.08;
      if (role === 'lead' && (instrument === 'glass' || instrument === 'celesta')) beats = 2.4;
      if (role === 'lead' && (instrument === 'harp' || instrument === 'pluck' || instrument === 'marimba')) beats = Math.max(0.75, beats);
      const phraseShape = role === 'lead' ? 0.94 + 0.06 * Math.sin(Math.PI * position / plan.barSteps) : 1;
      // Keep a louder legacy support voice from masking a bowed melody.
      const paletteGain = this.palettes[role] === 'original'
        ? ({ string: 0.60, flute: 0.76, piano: 0.80, pluck: 0.90, glass: 1 }[instrument] ?? 1)
        : instrument === 'string' ? 0.82 : 1;
      events.push({ ...source, instrument, frequency, beats, palette: this.palettes[role],
        amplitude: source.amplitude * phraseShape * paletteGain * (role === 'answer' ? 0.82 : 1),
        // Only decorative accents use Shimmer blend, including when glass leads.
        shimmer: role === 'accent', articulation: sustained && role === 'lead' ? 'connected' : 'separate' });
    }
    return events;
  }
}
