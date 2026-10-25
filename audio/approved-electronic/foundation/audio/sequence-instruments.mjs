// Recording-free additions to the three sequence presets.
const TAU = Math.PI * 2;
const SIZE = 2048;
const DRIFT_TABLES = new Map();
const smooth = (position) => position * position * (3 - 2 * position);
const DARK = [1, 0.08, 0.025, 0.008, 0.003, 0.001, 0, 0];
const BRIGHT = [1, 0.24, 0.13, 0.065, 0.03, 0.014, 0.006, 0.002];
for (let count = 1; count <= 8; count++) {
  const build = (weights) => {
    const wave = new Float32Array(SIZE + 1), scale = weights.slice(0, count).reduce((sum, weight) => sum + weight, 0);
    for (let index = 0; index <= SIZE; index++) for (let partial = 1; partial <= count; partial++) wave[index] += Math.sin(TAU * partial * index / SIZE) * weights[partial - 1] / scale;
    return wave;
  };
  DRIFT_TABLES.set(count, { dark: build(DARK), bright: build(BRIGHT) });
}
function lookup(table, phase) {
  const position = phase * SIZE, index = Math.floor(position);
  return table[index] + (table[index + 1] - table[index]) * (position - index);
}
function mode(frequency, weight, decay, rate) {
  const angle = TAU * frequency / rate, radius = Math.exp(-1 / (rate * decay));
  return { frequency, weight, current: 0, previous: -Math.sin(angle) / radius,
    coefficient: 2 * radius * Math.cos(angle), radiusSquared: radius * radius };
}
export function createSequenceTone(kind, frequency, duration, rate, seed) {
  if (frequency * (kind === 'drift' ? 1.0006 : 1) >= rate * 0.45) return null;
  const identity = (seed >>> 0) / 4294967296;
  const tone = { kind, frequency, duration, rate, identity: identity * TAU, frames: 0, partials: [], phase: 0,
    colour: 0.5, colourStep: 0, vibrato: 0, vibratoStep: 0, attack: kind === 'sequence' ? 0.03 : 0.018 };
  if (kind === 'drift') {
    tone.harmonics = Math.min(8, Math.floor(rate * 0.45 / (frequency * 1.0006)));
    tone.tables = DRIFT_TABLES.get(tone.harmonics);
    return tone;
  }
  const add = (hz, weight, decay) => {
    if (hz < rate * 0.45) tone.partials.push(mode(hz, weight, decay, rate));
  };
  if (kind === 'sequence') {
    const ratios = [1, 2, 2.756, 4.08, 5.40, 6.80];
    const weights = [1, 0.16, 0.13, 0.075, 0.04, 0.015];
    ratios.forEach((ratio, index) => add(frequency * ratio, weights[index] * (index ? 0.92 + identity * 0.16 : 1),
      duration / (7 + index * 2.8)));
  } else {
    const position = 0.20 + identity * 0.06;
    for (let partial = 1; partial <= 10; partial++) add(frequency * partial,
      Math.sin(Math.PI * partial * position) / partial ** 1.45, duration / (4.6 + (partial - 1) * 1.5));
    // A quiet short-lived body response adds some wood to the plucked spectrum.
    add(520, 0.018, 0.12); add(1120, 0.008, 0.075);
  }
  tone.scale = 0.90 / Math.sqrt(tone.partials.reduce((sum, partial) => sum + partial.weight ** 2, 0));
  return tone;
}
export function sampleSequenceTone(tone, age) {
  if (!tone || age >= tone.duration) return 0;
  if (tone.kind === 'drift') {
    if (tone.frames % 64 === 0) {
      const development = Math.sin(Math.PI * age / tone.duration) ** 2;
      const colour = 0.38 + 0.36 * development + 0.08 * Math.sin(age * TAU / 19 + tone.identity);
      tone.colourStep = (colour - tone.colour) / 64;
      const vibrato = Math.sin(age * TAU / 13 + tone.identity) * 0.00045;
      tone.vibratoStep = (vibrato - tone.vibrato) / 64;
    }
    tone.colour += tone.colourStep; tone.vibrato += tone.vibratoStep;
    const dark = lookup(tone.tables.dark, tone.phase), bright = lookup(tone.tables.bright, tone.phase);
    const body = dark + (bright - dark) * tone.colour;
    const wave = body * 0.90 + Math.sin(TAU * tone.phase) * 0.25;
    tone.phase = (tone.phase + tone.frequency * (1 + tone.vibrato) / tone.rate) % 1;
    tone.frames++;
    return wave * Math.sin(Math.PI * age / tone.duration) ** 2;
  }
  let wave = 0;
  for (const partial of tone.partials) {
    wave += partial.current * partial.weight;
    const next = partial.coefficient * partial.current - partial.radiusSquared * partial.previous;
    partial.previous = partial.current; partial.current = next;
  }
  const attack = smooth(Math.min(1, age / Math.min(tone.attack, tone.duration * 0.2)));
  const release = smooth(Math.min(1, (tone.duration - age) / Math.min(0.4, tone.duration * 0.25)));
  tone.frames++;
  return wave * tone.scale * attack * release;
}
