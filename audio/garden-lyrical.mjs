

const TAU = Math.PI * 2;
const SIZE = 4096;
const PARTIALS = 24;
const BASIS = Array.from({ length: PARTIALS }, (_, index) =>
  Float32Array.from({ length: SIZE + 1 }, (_, sample) => Math.sin(TAU * (index + 1) * sample / SIZE)));
const CACHE = new Map();
const PROFILES = {
  cello: { first: [[220, 0.85, 0.8], [520, 0.6, 0.7], [1400, 0.3, 0.8]],
    second: [[250, 0.85, 0.85], [650, 0.5, 0.8], [1750, 0.4, 0.85]], attack: 0.34, vibrato: 0.0018, rate: 4.6 },
  violin: { first: [[480, 0.8, 0.7], [1000, 0.5, 0.7], [2300, 0.3, 0.8]],
    second: [[520, 0.75, 0.7], [1250, 0.55, 0.75], [2700, 0.45, 0.8]], attack: 0.28, vibrato: 0.0023, rate: 5.0 },
};
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smooth = (value) => value * value * (3 - 2 * value);

class Random {
  constructor(seed) { this.state = seed >>> 0 || 1; }
  next() {
    let value = this.state;
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    this.state = value >>> 0; return this.state / 4294967296;
  }
}
function lookup(table, phase) {
  const position = phase * SIZE, index = Math.floor(position);
  return table[index] + (table[index + 1] - table[index]) * (position - index);
}
function tables(profileName, frequency, rate) {
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const count = Math.max(1, Math.min(PARTIALS, Math.floor(rate * 0.45 / (frequency * 1.006))));
  const key = `${profileName}:${midi}:${count}`;
  if (CACHE.has(key)) return CACHE.get(key);
  const profile = PROFILES[profileName], centreFrequency = 440 * 2 ** ((midi - 69) / 12);
  const build = (peaks) => {
    const weights = Array.from({ length: count }, (_, index) => {
      const partial = index + 1, hz = centreFrequency * partial;
      let body = 0.07;
      for (const [centre, gain, width] of peaks) body += gain * Math.exp(-0.5 * (Math.log2(hz / centre) / width) ** 2);
      return body / partial ** 1.02 / Math.sqrt(1 + (hz / 5500) ** 2);
    });
    const scale = weights.reduce((sum, value) => sum + value, 0);
    const wave = new Float32Array(SIZE + 1);
    for (let partial = 0; partial < count; partial++) for (let sample = 0; sample <= SIZE; sample++) wave[sample] += BASIS[partial][sample] * weights[partial] / scale;
    return wave;
  };
  const result = { first: build(profile.first), second: build(profile.second), count };
  if (CACHE.size >= 128) CACHE.delete(CACHE.keys().next().value);
  CACHE.set(key, result); return result;
}

export function createLyricalString(frequency, duration, rate, seed, style = 'solo', profileName = frequency < 300 ? 'cello' : 'violin') {
  const profile = PROFILES[profileName], random = new Random(seed);
  const phase = random.next(), table = tables(profileName, frequency, rate);
  const players = style === 'section'
    ? [{ phase, ratio: 1, weight: 0.56 }, { phase: (phase + 0.065) % 1, ratio: 1.0009, weight: 0.24 },
      { phase: (phase + 0.94) % 1, ratio: 0.9991, weight: 0.20 }]
    : [{ phase, ratio: 1, weight: 1 }];
  return { frequency, duration, rate, style, profileName, table, players, age: 0,
    attack: Math.min(profile.attack * (0.94 + random.next() * 0.12), duration * 0.38),
    release: Math.min(0.65, duration * 0.43), vibratoDepth: profile.vibrato, vibratoRate: profile.rate,
    identity: random.next() * TAU, frames: 0, vibrato: 0, vibratoStep: 0, colour: 0, colourStep: 0,
    expression: 0.92, expressionStep: 0 };
}

export function sampleLyricalString(tone, brightness = 0.55) {
  const age = tone.age / tone.rate;
  if (age < 0 || age >= tone.duration) { tone.age++; return 0; }
  const position = age / tone.duration;
  if (tone.frames % 64 === 0) {
    const settled = 1 - Math.exp(-Math.max(0, age - 0.12) / 0.55);
    const vibrato = Math.sin(age * TAU * tone.vibratoRate + tone.identity) * tone.vibratoDepth * settled;
    tone.vibratoStep = (vibrato - tone.vibrato) / 64;
    
    const colour = 0.12 + 0.32 * Math.sin(Math.PI * position) ** 2 + 0.04 * Math.sin(age * TAU * 0.4 + tone.identity);
    tone.colourStep = (colour - tone.colour) / 64;
    const expression = 0.90 + 0.07 * Math.sin(Math.PI * position) + 0.025 * Math.sin(age * TAU * 0.7 + tone.identity);
    tone.expressionStep = (expression - tone.expression) / 64;
  }
  tone.vibrato += tone.vibratoStep; tone.colour += tone.colourStep; tone.expression += tone.expressionStep;
  let wave = 0;
  for (const player of tone.players) {
    const first = lookup(tone.table.first, player.phase), second = lookup(tone.table.second, player.phase);
    const fundamental = Math.sin(TAU * player.phase);
    const body = first + (second - first) * tone.colour;
    wave += (fundamental * (0.25 * (1 - brightness)) + body * (0.75 + brightness * 0.25)) * player.weight;
    player.phase = (player.phase + tone.frequency * player.ratio * (1 + tone.vibrato) / tone.rate) % 1;
  }
  const attack = smooth(Math.min(1, age / tone.attack));
  const release = smooth(Math.min(1, (tone.duration - age) / tone.release));
  tone.frames++; tone.age++;
  return wave * attack * release * tone.expression * 0.92;
}

