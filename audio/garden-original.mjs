// Preserve the original five musical colours as a seeded palette option.
const SIZE = 4096;
const TAU = Math.PI * 2;
const WEIGHTS = {
  string: [1, 0.38, 0.2, 0.1, 0.05, 0.025], flute: [1, 0.13, 0.23, 0.035, 0.04, 0],
  pluck: [1, 0.3, 0.15, 0.075, 0.03, 0.015], glass: [1, 0.07, 0.35, 0.02, 0.12, 0.015],
  piano: [1, 0.44, 0.2, 0.09, 0.06, 0.02],
};
const TABLES = new Map();
const SINE = Float32Array.from({ length: SIZE + 1 }, (_, index) => Math.sin(TAU * index / SIZE));
for (const [instrument, weights] of Object.entries(WEIGHTS)) for (let count = 1; count <= 6; count++) {
  const table = new Float32Array(SIZE + 1), scale = weights.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index <= SIZE; index++) for (let partial = 1; partial <= count; partial++) {
    table[index] += weights[partial - 1] * Math.sin(TAU * partial * index / SIZE) / scale;
  }
  TABLES.set(`${instrument}:${count}`, table);
}
function lookup(table, phase) {
  const position = phase * SIZE, index = Math.floor(position);
  return table[index] + (table[index + 1] - table[index]) * (position - index);
}
export function createOriginalTone(instrument, frequency, duration, sampleRate, shimmer) {
  const count = Math.min(6, Math.floor(sampleRate * 0.45 / frequency));
  return { original: true, instrument, frequency, duration, sampleRate, shimmer, phase: 0, modes: [],
    attack: instrument === 'string' ? 0.22 : instrument === 'piano' ? 0.025 : 0.07,
    table: TABLES.get(`${instrument}:${Math.max(1, count)}`) };
}
export function sampleOriginalTone(tone, age, brightness) {
  const sine = lookup(SINE, tone.phase), bright = lookup(tone.table, tone.phase);
  let envelope = 1;
  if (tone.instrument === 'piano') envelope *= Math.exp(-age / tone.duration * 2);
  if (tone.instrument === 'pluck' || tone.shimmer) envelope *= Math.exp(-age / tone.duration * (tone.shimmer ? 3 : 4));
  tone.phase = (tone.phase + tone.frequency / tone.sampleRate) % 1;
  return (sine + (bright - sine) * brightness) * envelope;
}
export const ORIGINAL_INSTRUMENTS = Object.freeze(Object.keys(WEIGHTS));
