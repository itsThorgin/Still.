// Independent seeded choices. Pool bits are stored as ordinary numeric controls.
export const GARDEN_FADE_OUT_SECONDS = 12;
export const GARDEN_FADE_IN_SECONDS = 8;
export const ARRANGEMENTS = [{ value: 1, label: 'Original' }, { value: 2, label: 'Resonant' }, { value: 4, label: 'Seeded ensembles' }];
export const ARRANGEMENT_OPTIONS = [
  { value: 7, label: 'All arrangements' }, ...ARRANGEMENTS,
  { value: 3, label: 'Original + Resonant' },
  { value: 5, label: 'Original + Seeded ensembles' },
  { value: 6, label: 'Resonant + Seeded ensembles' },
];
export const STRING_OPTIONS = [
  { value: 15, label: 'All four string sounds' },
  { value: 1, label: 'Original strings' }, { value: 2, label: 'Resonant strings' },
  { value: 4, label: 'Lyrical solo' }, { value: 8, label: 'Soft section' },
  { value: 3, label: 'Original + Resonant strings' },
  { value: 12, label: 'Lyrical solo + Soft section' },
  { value: 0, label: 'Follow arrangement' },
];
export const VARIATION_RANGES = { 5: [3, 7], 10: [8, 12], 15: [12, 18], 30: [25, 35], 60: [50, 70] };
export const VARIATION_OPTIONS = [{ value: 0, label: 'Off: keep playing this variation' },
  ...Object.entries(VARIATION_RANGES).map(([value, range]) => ({ value: Number(value), label: `About ${value} minutes (${range[0]}–${range[1]})` }))];

export function gardenHash(seed, salt) {
  let value = (seed ^ salt) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}
export function chooseArrangement(seed, pool = 4) {
  const choices = ARRANGEMENTS.filter((item) => (pool & item.value) !== 0);
  return choices[gardenHash(seed, 0xb7e15162) % choices.length] ?? ARRANGEMENTS[2];
}
export function chooseString(seed, pool, role, frequency) {
  const choices = ['original', 'resonant', 'lyrical', 'section'].filter((_, index) => (pool & (1 << index)) !== 0);
  if (!choices.length) return undefined;
  const roleSalt = { bass: 1, lead: 2, accompaniment: 3, answer: 4, accent: 5 }[role] ?? 0;
  // A part keeps its sound throughout the variation, with separate low/high registers.
  return choices[gardenHash(seed, 0x243f6a88 + roleSalt * 17 + (frequency < 300 ? 0 : 1)) % choices.length];
}

export class GardenRotation {
  constructor(rate, seed, minutes = 0) {
    this.rate = rate; this.seed = seed >>> 0 || 1; this.serial = 0;
    this.minutes = -1; this.configure(minutes, 0);
  }
  configure(minutes, frame) {
    const valid = VARIATION_RANGES[minutes] ? Number(minutes) : 0;
    if (valid === this.minutes) return;
    this.minutes = valid; this.schedule(frame);
  }
  schedule(frame) {
    const range = VARIATION_RANGES[this.minutes];
    this.nextFrame = range ? frame + Math.round((range[0] + (range[1] - range[0]) * gardenHash(this.seed, 0x13198a2e) / 4294967296) * 60 * this.rate) : Infinity;
  }
  advance(frame) {
    if (frame < this.nextFrame) return false;
    this.changeSeed(frame); return true;
  }
  changeSeed(frame) {
    // Full-period 32-bit sequence, skipping zero. Consecutive seeds differ.
    this.seed = this.nextSeed();
    this.serial++; this.schedule(frame);
  }
  nextSeed() { return ((Math.imul(this.seed, 1664525) + 1013904223) >>> 0) || 1013904223; }
}
