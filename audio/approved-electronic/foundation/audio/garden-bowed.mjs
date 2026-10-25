// Original spectral model: bowed excitation shaped by fixed body resonances.
// Body peaks stay in Hz when the played note changes.
const TAU = Math.PI * 2;
const SIZE = 4096;
const MAX_PARTIALS = 32;
const BASIS = Array.from({ length: MAX_PARTIALS }, (_, index) =>
  Float32Array.from({ length: SIZE + 1 }, (_, sample) => Math.sin(TAU * (index + 1) * sample / SIZE)));
const CACHE = new Map();
const PROFILES = {
  cello: { peaks: [[180, 1.1, 0.4], [310, 1.2, 0.3], [620, 0.8, 0.45], [1650, 0.8, 0.5]], slope: 1.03, attack: 0.115, vibrato: 0.0025, air: 0.009 },
  violin: { peaks: [[290, 0.7, 0.35], [490, 1.0, 0.25], [1050, 0.8, 0.4], [2450, 1.35, 0.45]], slope: 1.0, attack: 0.085, vibrato: 0.0032, air: 0.012 },
  brass: { peaks: [[650, 0.6, 0.8], [1250, 0.7, 0.65]], slope: 1.5, attack: 0.095, vibrato: 0.0011, air: 0.006 },
  clarinet: { peaks: [[1000, 0.6, 0.65], [2100, 0.4, 0.7]], slope: 1.2, attack: 0.065, vibrato: 0.0008, air: 0.017 },
};

function lookup(table, phase) {
  const position = phase * SIZE, index = Math.floor(position);
  return table[index] + (table[index + 1] - table[index]) * (position - index);
}

function bodyTables(instrument, frequency, count) {
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const key = `${instrument}:${midi}:${count}`;
  if (CACHE.has(key)) return CACHE.get(key);
  const profile = PROFILES[instrument];
  const centreFrequency = 440 * 2 ** ((midi - 69) / 12);
  const weights = Array.from({ length: count }, (_, index) => {
    const partial = index + 1, hz = centreFrequency * partial;
    let body = 0.42;
    for (const [centre, gain, width] of profile.peaks) body += gain * Math.exp(-0.5 * (Math.log2(hz / centre) / width) ** 2);
    let weight = body / partial ** profile.slope;
    if (instrument === 'clarinet' && partial % 2 === 0) weight *= 0.09;
    if (instrument === 'cello' || instrument === 'violin') {
      // A bow-position notch and a gradual bridge rolloff soften a plain saw tone.
      weight *= (0.65 + 0.35 * Math.cos(partial * Math.PI * 0.12) ** 2) / (1 + (hz / 6500) ** 2);
    }
    return weight;
  });
  // A stable body response changes the relative partials, not the musical tuning.
  const sum = weights.reduce((total, weight) => total + weight, 0);
  const bright = new Float32Array(SIZE + 1), dark = new Float32Array(SIZE + 1);
  for (let index = 0; index < count; index++) {
    const weight = weights[index] / sum;
    const damping = Math.exp(-index * (instrument === 'brass' ? 0.30 : 0.13));
    for (let sample = 0; sample <= SIZE; sample++) {
      bright[sample] += BASIS[index][sample] * weight;
      dark[sample] += BASIS[index][sample] * weight * damping;
    }
  }
  const result = { bright, dark };
  // Bound caches even when a development audition supplies arbitrary pitches.
  if (CACHE.size >= 192) CACHE.delete(CACHE.keys().next().value);
  CACHE.set(key, result);
  return result;
}

export function prepareBowedTone(instrument, frequency, sampleRate) {
  const count = Math.max(1, Math.min(MAX_PARTIALS, Math.floor(sampleRate * 0.45 / (frequency * 1.006))));
  bodyTables(instrument, frequency, count);
}

export function createBowedTone(instrument, frequency, duration, sampleRate, seed) {
  const profile = PROFILES[instrument];
  const count = Math.max(1, Math.min(MAX_PARTIALS, Math.floor(sampleRate * 0.45 / (frequency * 1.006))));
  const identity = (seed >>> 0) / 4294967296;
  return { instrument, frequency, duration, sampleRate, phase: 0, frames: 0, randomState: seed >>> 0 || 1,
    bodyTables: bodyTables(instrument, frequency, count), harmonics: count, modes: [],
    attack: profile.attack * (0.92 + identity * 0.16), release: instrument === 'brass' ? 0.16 : 0.20,
    vibratoDepth: profile.vibrato, vibratoRate: instrument === 'cello' ? 4.6 : instrument === 'violin' ? 5.4 : 4.9,
    identity, air: profile.air, noiseLow: 0, noiseSlow: 0,
    noiseCoefficient: 1 - Math.exp(-TAU * Math.min(4200, sampleRate * 0.18) / sampleRate),
    slowCoefficient: 1 - Math.exp(-TAU * Math.min(1100, sampleRate * 0.10) / sampleRate),
    vibrato: 0, vibratoStep: 0, colour: 0, colourStep: 0, expression: 0.94, expressionStep: 0 };
}

export function sampleBowedTone(tone, age, brightness) {
  const bowed = tone.instrument === 'cello' || tone.instrument === 'violin';
  if (tone.frames % 64 === 0) {
    const phase = tone.identity * TAU;
    const development = 1 - Math.exp(-Math.max(0, age - 0.08) / 0.35);
    const vibrato = development * (Math.sin(age * TAU * tone.vibratoRate + phase) * tone.vibratoDepth
      + Math.sin(age * TAU * 0.73 + phase) * 0.00022);
    tone.vibratoStep = (vibrato - tone.vibrato) / 64;
    const colour = bowed ? 0.35 + 0.37 * development + 0.05 * Math.sin(age * TAU * 1.3 + phase)
      : tone.instrument === 'brass' ? 0.15 + 0.65 * (1 - Math.exp(-age / 0.18)) : 0.6;
    tone.colourStep = (colour - tone.colour) / 64;
    const expression = 0.93 + 0.04 * Math.sin(age * TAU * 0.55 + phase) + (bowed ? 0.02 * Math.sin(age * TAU * 3.1 + phase) : 0);
    tone.expressionStep = (expression - tone.expression) / 64;
  }
  tone.vibrato += tone.vibratoStep; tone.colour += tone.colourStep; tone.expression += tone.expressionStep;
  const dark = lookup(tone.bodyTables.dark, tone.phase), bright = lookup(tone.bodyTables.bright, tone.phase);
  let sound = dark + (bright - dark) * tone.colour * (0.35 + brightness * 0.65);
  let value = tone.randomState;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  tone.randomState = value >>> 0;
  const noise = tone.randomState / 2147483648 - 1;
  tone.noiseLow += tone.noiseCoefficient * (noise - tone.noiseLow);
  tone.noiseSlow += tone.slowCoefficient * (tone.noiseLow - tone.noiseSlow);
  sound += (tone.noiseLow - tone.noiseSlow) * tone.air * (0.4 + brightness * 0.6);
  tone.phase = (tone.phase + tone.frequency * (1 + tone.vibrato) / tone.sampleRate) % 1;
  tone.frames++;
  return sound * tone.expression * 0.92;
}
