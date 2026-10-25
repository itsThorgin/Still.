const TAU = Math.PI * 2, SIZE = 2048, COUNTS = [1, 2, 4, 8, 16, 32];
const BASIS = Array.from({ length: 32 }, (_, n) => Float32Array.from({ length: SIZE + 1 }, (_, i) => Math.sin(TAU * (n + 1) * i / SIZE)));
const TABLES = new Map();
const ALIASES = { pad: 'wide-pad', lead: 'saw-lead', arp: 'pulse-arp', keys: 'electric-keys', reese: 'deep-reese' };
export const ELECTRONIC_INSTRUMENTS = ['wide-pad', 'silk-pad', 'choir-pad', 'dark-pad', 'saw-lead', 'hollow-lead', 'glass-lead', 'brass', 'pulse-arp', 'electric-keys', 'dark-keys', 'bell-pluck', 'dub-stab', 'octave-bass', 'pulse-bass', 'round-bass', 'deep-reese', 'jungle-bass', 'wobble-bass'];
function weights(name, n) {
  if (name === 'electric-keys') return [1, 0.38, 0.09, 0.19, 0.025, 0.045][n - 1] ?? 0;
  if (name === 'dark-keys') return [1, 0.16, 0.34, 0.03, 0.12][n - 1] ?? 0;
  if (name === 'glass-lead' || name === 'bell-pluck') return [1, 0.21, 0.1, 0.025, 0.16, 0.01, 0.04][n - 1] ?? 0;
  if (name === 'round-bass') return [1, 0.2, 0.07, 0.02][n - 1] ?? 0;
  if (name === 'choir-pad' || name === 'hollow-lead') return (n % 2 ? 1 : 0.08) * (1 + Math.exp(-(((n - 5) / 2) ** 2)) * 1.7) / n ** 1.8;
  if (name === 'pulse-bass' || name === 'pulse-arp') return Math.sin(n * Math.PI * (name === 'pulse-arp' ? 0.22 : 0.43)) / n * Math.exp(-n * 0.07);
  if (name === 'octave-bass') return (n === 2 ? 0.8 : 1 / n ** 1.4) * Math.exp(-n * 0.12);
  if (name === 'jungle-bass') return (n % 2 ? 1 : 0.35) / n ** 1.1 * Math.exp(-n * 0.09);
  if (name === 'wobble-bass') return (1 + Math.exp(-(((n - 4) / 2) ** 2))) / n ** 1.05 * Math.exp(-n * 0.05);
  if (name === 'silk-pad') return 1 / n ** 2 * Math.exp(-n * 0.08);
  if (name === 'dark-pad') return (n % 2 ? 1 : 0.3) / n ** 2.2;
  if (name === 'brass') return Math.exp(-n * 0.09) / n ** 0.9;
  if (name === 'dub-stab') return (n % 3 === 0 ? 0.3 : 1) / n ** 1.2 * Math.exp(-n * 0.05);
  return Math.exp(-n * (name === 'wide-pad' ? 0.1 : 0.045)) / n ** (name === 'wide-pad' ? 1.3 : 1.05);
}
for (const name of ELECTRONIC_INSTRUMENTS) for (const count of COUNTS) {
  const spectrum = Array.from({ length: count }, (_, i) => weights(name, i + 1));
  const norm = spectrum.reduce((sum, weight) => sum + Math.abs(weight), 0);
  const table = new Float32Array(SIZE + 1);
  for (let n = 0; n < count; n++) for (let i = 0; i <= SIZE; i++) table[i] += BASIS[n][i] * spectrum[n] / norm;
  TABLES.set(`${name}:${count}`, table);
}
function lookup(table, phase) {
  const position = phase * SIZE, index = Math.floor(position);
  return table[index] + (table[index + 1] - table[index]) * (position - index);
}
export function createElectronicTone(event, rate, duration, identity) {
  const name = ALIASES[event.instrument] ?? event.instrument;
  const count = COUNTS.filter((n) => event.frequency * 1.008 * n < rate * 0.45).at(-1);
  if (!count || !TABLES.has(`${name}:${count}`)) return null;
  const pad = name.endsWith('pad'), bass = event.role === 'bass';
  const struck = ['electric-keys', 'dark-keys', 'bell-pluck', 'pulse-arp', 'dub-stab'].includes(name);
  const decayTime = name === 'pulse-arp' ? 0.15 : name === 'dub-stab' ? 0.12 : name === 'bell-pluck' ? 0.3 : struck ? 0.65 : duration * 6;
  return { ...event, name, rate, count, table: TABLES.get(`${name}:${count}`), duration,
    age: 0, phase: identity, phase2: (identity + (pad ? 0.08 : 0.025)) % 1, phase3: (identity + 0.15) % 1,
    detune: name === 'deep-reese' || name === 'wobble-bass' ? 1.006 : pad ? 1.0035 : struck ? 1.0008 : 1.002,
    attack: event.attack ?? (pad ? 0.14 : name === 'brass' ? 0.045 : bass ? 0.007 : 0.012),
    release: Math.min(duration * 0.38, event.release ?? (pad ? 0.5 : bass ? 0.07 : 0.18)),
    decay: 1, decayRate: Math.exp(-1 / (rate * decayTime)), pad, bass, struck,
    filterL: 0, filterR: 0, filter2L: 0, filter2R: 0, coefficient: 0.08, coefficientStep: 0,
    left: 0, right: 0,
  };
}

export function sampleElectronicTone(tone, frame, beats, brightness, movement) {
  const age = tone.age / tone.rate;
  if (frame % 32 === 0 || tone.age === 0) {
    const wobble = 0.5 + Math.sin(TAU * beats * (tone.motionRate ?? 0.5)) * 0.5;
    const slow = 0.5 + Math.sin(TAU * beats / 24 + tone.phase3) * 0.5;
    const shape = tone.bass ? 0.18 + movement * wobble * 0.82 : tone.pad ? 0.55 + movement * slow * 0.35
      : 0.22 + Math.exp(-age * (tone.struck ? 7 : tone.name === 'brass' ? 2.5 : 3.5)) * 0.78;
    const ceiling = tone.cutoffCeiling ?? (tone.bass ? tone.name === 'wobble-bass' ? 2600 : 1600 : tone.name === 'hollow-lead' ? 3200 : 7200);
    const cutoff = Math.min(tone.rate * 0.36, (tone.bass ? 110 : 280) + brightness * ceiling * shape);
    const target = 1 - Math.exp(-TAU * cutoff / tone.rate);
    tone.coefficientStep = (target - tone.coefficient) / 32;
  }
  tone.coefficient += tone.coefficientStep;
  const a = lookup(tone.table, tone.phase), b = lookup(tone.table, tone.phase2);
  let left = a * 0.7 + b * 0.3, right = a * 0.3 + b * 0.7;
  if (tone.pad) {
    const third = lookup(tone.table, tone.phase3);
    left = left * 0.8 + third * 0.2; right = right * 0.88 + third * 0.12;
  }
  if (tone.name === 'electric-keys' || tone.name === 'glass-lead' || tone.name === 'bell-pluck') {
    // The struck upper partial fades ahead of the fundamental.
    const body = lookup(BASIS[0], tone.phase);
    const transient = Math.exp(-age * (tone.name === 'electric-keys' ? 4 : 2));
    left = left * transient + body * (1 - transient) * 0.7;
    right = right * transient + body * (1 - transient) * 0.7;
  }
  tone.filterL += tone.coefficient * (left - tone.filterL);
  tone.filterR += tone.coefficient * (right - tone.filterR);
  tone.filter2L += tone.coefficient * (tone.filterL - tone.filter2L);
  tone.filter2R += tone.coefficient * (tone.filterR - tone.filter2R);
  left = tone.filter2L; right = tone.filter2R;
  if (tone.bass) {
    const sub = lookup(BASIS[0], tone.phase);
    const subWeight = tone.subWeight ?? 0.5;
    left = right = (left + right) * 0.5 * (1 - subWeight) + sub * subWeight;
  }
  const attack = Math.min(1, age / tone.attack), release = Math.min(1, (tone.duration - age) / tone.release);
  const envelope = attack * attack * (3 - 2 * attack) * release * release * (3 - 2 * release) * tone.decay;
  tone.left = left * envelope; tone.right = right * envelope;
  tone.phase = (tone.phase + tone.frequency / tone.rate) % 1;
  tone.phase2 = (tone.phase2 + tone.frequency * tone.detune / tone.rate) % 1;
  tone.phase3 = (tone.phase3 + tone.frequency * 0.9968 / tone.rate) % 1;
  tone.decay *= tone.decayRate; tone.age++;
}
