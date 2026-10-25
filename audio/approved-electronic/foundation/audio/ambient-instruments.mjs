import { createElectronicTone, sampleElectronicTone } from './electronic-instruments.mjs';
import { AMBIENT_TEXTURES, createAmbientTexture, sampleAmbientTexture } from './ambient-textures.mjs';

const TAU = Math.PI * 2, SIZE = 2048, tables = new Map();
// Different spectra and envelopes, with no recordings or unbounded oscillators.
export const AMBIENT_INSTRUMENTS = Object.freeze({
  ...AMBIENT_TEXTURES,
  'amber-cloud': { harmonics: [1, 0.28, 0.13, 0.045, 0.02], attack: 1.8, release: 4, detune: 1.0018, ceiling: 1200, speed: 0.037 },
  'abyss-cloud': { harmonics: [1, 0.035, 0.21, 0.015, 0.07, 0.01, 0.025], attack: 2.8, release: 5.5, detune: 1.0009, ceiling: 550, speed: 0.019 },
  'glass-halo': { harmonics: [1, 0.08, 0.11, 0.035, 0.19, 0.01, 0.07], attack: 1.2, release: 3.8, detune: 1.0024, ceiling: 2400, speed: 0.029 },
  'breath-cloud': { harmonics: [1, 0.055, 0.4, 0.025, 0.23, 0.02, 0.12, 0.01, 0.04], attack: 2.2, release: 4.7, detune: 1.0031, ceiling: 1800, speed: 0.043 },
  'silver-cloud': { harmonics: [1, 0.18, 0.09, 0.13, 0.045, 0.075, 0.015, 0.035], attack: 2.5, release: 4.4, detune: 1.0021, ceiling: 2900, speed: 0.023 },
  'velvet-cloud': { harmonics: [1, 0.32, 0.035, 0.1, 0.015, 0.025], attack: 1.1, release: 3.5, detune: 1.0014, ceiling: 850, speed: 0.033 },
  'organ-mist': { harmonics: [1, 0.65, 0.12, 0.28, 0.035, 0.09, 0.015, 0.07], attack: 1.6, release: 4.5, detune: 1.0003, ceiling: 1600, speed: 0.017 },
  'reed-light': { harmonics: [1, 0.04, 0.3, 0.025, 0.1, 0.01, 0.03], attack: 0.48, release: 1.5, detune: 1.0007, ceiling: 1900, speed: 0.051 },
  'felt-light': { harmonics: [1, 0.24, 0.055, 0.1, 0.02], attack: 0.035, release: 1.8, detune: 1.0004, ceiling: 1500, speed: 0.031, decay: 1.1 },
  'glass-seed': { harmonics: [1, 0.055, 0.09, 0.015, 0.21, 0.005, 0.04], attack: 0.07, release: 2.2, detune: 1.0011, ceiling: 3500, speed: 0.047, decay: 1.4 },
  'copper-bell': { harmonics: [1, 0.13, 0.035, 0.17, 0.025, 0.085, 0.015, 0.06], attack: 0.025, release: 2.4, detune: 1.002, ceiling: 3200, speed: 0.039, decay: 1.7 },
  'sine-earth': { harmonics: [1, 0.045, 0.012], attack: 0.9, release: 3.5, detune: 1.0001, ceiling: 240, speed: 0.013 },
  'velvet-floor': { harmonics: [1, 0.2, 0.075, 0.02], attack: 0.55, release: 2.8, detune: 1.0005, ceiling: 430, speed: 0.021 },
  'air-spark': { harmonics: [1, 0.025, 0.16, 0.035, 0.11, 0.015, 0.08, 0.01], attack: 0.13, release: 0.7, detune: 1.0035, ceiling: 4400, speed: 0.071, decay: 0.35 },
  'metal-dust': { harmonics: [1, 0.04, 0.075, 0.15, 0.025, 0.1, 0.02, 0.065], attack: 0.02, release: 0.65, detune: 1.0027, ceiling: 4700, speed: 0.061, decay: 0.27 },
  'pulse-haze': { harmonics: [1, 0.21, 0.14, 0.06, 0.025], attack: 0.12, release: 0.4, detune: 1.0008, ceiling: 1100, speed: 0.053, decay: 0.5 },
});
function tableFor(name, count) {
  const key = `${name}:${count}`;
  if (tables.has(key)) return tables.get(key);
  const weights = AMBIENT_INSTRUMENTS[name].harmonics.slice(0, count), table = new Float32Array(SIZE + 1);
  const total = weights.reduce((sum, value) => sum + value, 0);
  for (let n = 0; n < weights.length; n++) for (let i = 0; i <= SIZE; i++)
    table[i] += Math.sin(TAU * (n + 1) * i / SIZE) * weights[n] / total;
  tables.set(key, table); return table;
}
export function createAmbientTone(event, rate, duration, identity) {
  if (AMBIENT_TEXTURES[event.instrument]) return createAmbientTexture(event, rate, duration, identity);
  const profile = AMBIENT_INSTRUMENTS[event.instrument];
  if (!profile) return null;
  const tone = createElectronicTone({ ...event, instrument: 'silk-pad', attack: profile.attack, release: profile.release,
    cutoffCeiling: profile.ceiling, ...(event.role === 'bass' ? { subWeight: 0.78 } : {}) }, rate, duration, identity);
  if (!tone) return null;
  tone.table = tableFor(event.instrument, tone.count);
  tone.ambientName = event.instrument; tone.ambientProfile = profile; tone.ambientIdentity = identity;
  tone.detune = profile.detune; tone.pad = !profile.decay;
  tone.decayRate = profile.decay ? Math.exp(-1 / (rate * profile.decay)) : 1;
  return tone;
}
export function sampleAmbientTone(tone, frame, beats, brightness, movement) {
  if (tone.ambientTexture) return sampleAmbientTexture(tone, frame, beats, brightness, movement);
  if (frame % 32 === 0 || tone.age === 0) {
    const phase = tone.age / tone.rate * tone.ambientProfile.speed * TAU + tone.ambientIdentity * TAU;
    tone.ambientLevel = 1 - movement * 0.14 * (0.5 + 0.5 * Math.sin(phase));
  }
  sampleElectronicTone(tone, frame, beats, brightness, movement);
  tone.left *= tone.ambientLevel; tone.right *= tone.ambientLevel;
}
