

const ROLES = [['lead', 'Lead'], ['bass', 'Bass'], ['accompaniment', 'Accompaniment'], ['answer', 'Answering voice'], ['accent', 'Shimmer']];
const INSTRUMENTS = { string: 'Strings', cello: 'Cello register', violin: 'Violin register', flute: 'Flute', piano: 'Piano',
  pluck: 'Pluck', glass: 'Glass', harp: 'Harp', brass: 'Mellow brass', clarinet: 'Clarinet', celesta: 'Celesta', marimba: 'Marimba', organ: 'Church organ' };
const STRINGS = { original: 'Original strings', resonant: 'Resonant strings', lyrical: 'Lyrical solo', section: 'Soft section',
  cello: 'Bowed cello', violin: 'Bowed violin' };

export function gardenSoundChoice(event) {
  const instrument = event.instrument;
  const string = ['string', 'cello', 'violin'].includes(instrument);
  const style = event.stringStyle ?? (instrument === 'string' ? event.palette ?? 'resonant' : instrument);
  const register = instrument === 'string' ? (event.frequency < 300 ? 'low register' : 'high register') : '';
  const instrumentLabel = `${INSTRUMENTS[instrument] ?? instrument}${register ? ` (${register})` : ''}`;
  const sound = string ? STRINGS[style] : ['flute', 'piano', 'pluck', 'glass'].includes(instrument)
    ? event.palette === 'original' ? 'Original' : 'Resonant' : '';
  return { instrument, instrumentLabel, sound, string };
}

export class GardenDescription {
  constructor(plan, sampleRate) {
    this.plan = plan; this.sampleRate = sampleRate;
    this.parts = new Map(ROLES.map(([role]) => [role, new Map()]));
  }
  add(event) {
    if (event.frequency >= this.sampleRate * 0.45 || !this.parts.has(event.role)) return;
    const choice = gardenSoundChoice(event);
    this.parts.get(event.role).set(`${choice.instrumentLabel}:${choice.sound}`, choice);
  }
  finish() {
    const parts = ROLES.map(([role, label]) => ({ role, label, choices: [...this.parts.get(role).values()] })).filter((part) => part.choices.length);
    const stringSounds = [...new Set(parts.flatMap((part) => part.choices.filter((choice) => choice.string).map((choice) => choice.sound)))];
    return { seed: this.plan.seed, arrangement: { ...this.plan.arrangement }, influences: this.plan.influences.map((item) => ({ ...item })), stringSounds, parts };
  }
}
