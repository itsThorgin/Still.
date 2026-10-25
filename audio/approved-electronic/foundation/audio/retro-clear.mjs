// Additional game-inspired voices. Existing Retro characters do not use these.
const TAU = Math.PI * 2, SIZE = 2048;
const COUNTS = [1, 2, 4, 8, 16, 32];
const BASIS = Array.from({ length: 32 }, (_, n) => Float32Array.from({ length: SIZE + 1 },
  (_, index) => Math.sin(TAU * (n + 1) * index / SIZE)));
const TABLES = new Map();
function lookup(table, phase) {
  const position = phase * SIZE, index = Math.floor(position);
  return table[index] + (table[index + 1] - table[index]) * (position - index);
}
for (const instrument of ['round-pulse', 'narrow-pulse', 'triangle', 'pluck', 'pad', 'keys']) {
  for (const count of COUNTS) {
    const build = (bright) => {
      const weights = Array.from({ length: count }, (_, index) => {
        const n = index + 1;
        if (instrument === 'triangle') return n % 2 ? (-1) ** ((n - 1) / 2) / n ** 2 : 0;
        if (instrument === 'keys') return [1, bright ? 0.44 : 0.08, bright ? 0.19 : 0.025, 0.045, 0.015, 0.005][index] ?? 0;
        if (instrument === 'pluck') return Math.sin(Math.PI * n * 0.23) / n ** (bright ? 1.25 : 2.2) * Math.exp(-n * 0.07);
        if (instrument === 'pad') return Math.exp(-n * 0.09) / n ** (bright ? 1.6 : 2.8);
        const duty = instrument === 'narrow-pulse' ? 0.23 : 0.43;
        return Math.sin(n * Math.PI * duty) / n * Math.exp(-n * (bright ? 0.075 : 0.4));
      });
      const scale = weights.reduce((sum, value) => sum + Math.abs(value), 0), wave = new Float32Array(SIZE + 1);
      for (let n = 0; n < count; n++) for (let index = 0; index <= SIZE; index++) wave[index] += BASIS[n][index] * weights[n] / scale;
      return wave;
    };
    TABLES.set(`${instrument}:${count}`, { dark: build(false), bright: build(true) });
  }
}
export function createClearRetroTone(instrument, frequency, rate, seed) {
  const safe = rate * 0.45 / (frequency * 1.005), count = COUNTS.filter((value) => value <= safe).at(-1);
  if (!count) return null;
  const identity = (seed >>> 0) / 4294967296;
  return { instrument, frequency, rate, count, tables: TABLES.get(`${instrument}:${count}`),
    phase: 0.04 + identity * 0.03, ratio: 0.9993 + identity * 0.001, frames: 0,
    colour: 0.5, colourStep: 0, decay: 1, decayStep: 0 };
}
export function sampleClearRetroTone(tone, phase, age, duration, pitch, warmth) {
  if (!tone) return 0;
  const instrument = tone.instrument;
  if (tone.frames % 64 === 0) {
    const struck = instrument === 'keys' || instrument === 'pluck';
    const colour = (struck ? 0.18 + 0.78 * Math.exp(-age * (instrument === 'keys' ? 3.5 : 5))
      : instrument === 'pad' ? 0.35 + 0.3 * Math.sin(Math.PI * age / duration) ** 2 : 0.72) * (1 - warmth * 0.65);
    tone.colourStep = (colour - tone.colour) / 64;
    const decay = struck ? Math.exp(-age / duration * (instrument === 'keys' ? 2.2 : 4.2)) : 1;
    tone.decayStep = (decay - tone.decay) / 64;
  }
  tone.colour += tone.colourStep; tone.decay += tone.decayStep;
  const dark = lookup(tone.tables.dark, phase), bright = lookup(tone.tables.bright, phase);
  let wave = dark + (bright - dark) * tone.colour;
  if (instrument === 'pad') {
    const second = lookup(tone.tables.dark, tone.phase) +
      (lookup(tone.tables.bright, tone.phase) - lookup(tone.tables.dark, tone.phase)) * tone.colour;
    wave = wave * 0.72 + second * 0.28;
    tone.phase = (tone.phase + tone.frequency * tone.ratio * pitch / tone.rate) % 1;
  } else if (instrument === 'triangle') wave = wave * 0.72 + Math.sin(TAU * phase) * 0.28;
  else if (instrument === 'keys') wave = wave * 0.88 + Math.sin(TAU * phase) * 0.12;
  tone.frames++;
  return wave * tone.decay;
}
export function createClearRetroDrum(rate) {
  return { low: 0, high: 0, body: 0,
    lowCoefficient: 1 - Math.exp(-TAU * Math.min(5000, rate * 0.35) / rate),
    highCoefficient: 1 - Math.exp(-TAU * 900 / rate),
    bodyCoefficient: 1 - Math.exp(-TAU * 700 / rate) };
}
export function sampleClearRetroDrum(voice, noise, sine) {
  const tone = voice.clear;
  tone.low += tone.lowCoefficient * (noise - tone.low);
  tone.high += tone.highCoefficient * (tone.low - tone.high);
  tone.body += tone.bodyCoefficient * (noise - tone.body);
  if (voice.drum === 'kick') return sine * 0.94;
  if (voice.drum === 'snare') return (tone.low - tone.body) * 0.72 + sine * 0.28;
  return (tone.low - tone.high) * 0.8;
}
