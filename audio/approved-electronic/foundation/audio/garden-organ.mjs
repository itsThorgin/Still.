// A small flue-pipe registration: 16-foot foundation, 8-foot principal, 4-foot octave.
// Original additive synthesis, without recordings or external resources.
const TAU = Math.PI * 2;
const SIZE = 2048;
const CACHE = new Map();
const WEIGHTS = [1, 0.30, 0.22, 0.085, 0.055, 0.026, 0.014, 0.008];
function table(count, stopped) {
  const key = `${count}:${stopped}`;
  if (CACHE.has(key)) return CACHE.get(key);
  const wave = new Float32Array(SIZE + 1);
  const weights = WEIGHTS.slice(0, count).map((weight, index) => weight * (stopped && index % 2 ? 0.12 : 1));
  const scale = weights.reduce((sum, weight) => sum + weight, 0);
  for (let i = 0; i <= SIZE; i++) for (let partial = 0; partial < count; partial++) wave[i] += Math.sin(TAU * (partial + 1) * i / SIZE) * weights[partial] / scale;
  CACHE.set(key, wave); return wave;
}
function lookup(wave, phase) {
  const position = phase * SIZE, index = Math.floor(position);
  return wave[index] + (wave[index + 1] - wave[index]) * (position - index);
}
// Prepare the small set of pipe spectra before any note starts.
for (let count = 1; count <= WEIGHTS.length; count++) { table(count, false); table(count, true); }
export function createOrganTone(frequency, duration, rate, seed) {
  const ranks = [[0.5, 0.42, true], [1, 0.43, false], [2, 0.15, false]].filter(([ratio]) => frequency * ratio < rate * 0.45)
    .map(([ratio, weight, stopped]) => {
      const hz = frequency * ratio, count = Math.min(WEIGHTS.length, Math.floor(rate * 0.45 / hz));
      return { frequency: hz, weight, phase: 0, wave: table(count, stopped), count };
    });
  return { organ: true, instrument: 'organ', frequency, ranks, sampleRate: rate,
    attack: 0.10 + (seed >>> 0) / 4294967296 * 0.025, release: Math.min(0.45, duration * 0.3) };
}
export function sampleOrganTone(tone, age, brightness) {
  let wave = 0;
  for (const rank of tone.ranks) {
    const fundamental = Math.sin(TAU * rank.phase);
    wave += (fundamental * (0.24 * (1 - brightness)) + lookup(rank.wave, rank.phase) * (0.76 + brightness * 0.24)) * rank.weight;
    rank.phase = (rank.phase + rank.frequency / tone.sampleRate) % 1;
  }
  // A restrained speaking transient, followed by a steady held pipe tone.
  return wave * (0.90 + 0.025 * Math.exp(-age / 0.06));
}

// Four damped feedback paths form a shared, bounded church-like room.
// Only organ notes enter it; familiar arrangements keep their existing room.
export class OrganRoom {
  constructor(rate) {
    this.paths = [0.313, 0.421, 0.557, 0.683].map((seconds) => ({ buffer: new Float32Array(Math.ceil(rate * seconds)), index: 0, low: 0 }));
    this.left = this.right = 0;
  }
  clear() { for (const path of this.paths) { path.buffer.fill(0); path.low = 0; } }
  sample(left, right) {
    this.left = this.right = 0;
    for (let index = 0; index < this.paths.length; index++) {
      const path = this.paths[index], echo = path.buffer[path.index];
      path.low += 0.18 * (echo - path.low);
      path.buffer[path.index] = (index % 2 ? right : left) * 0.16 + path.low * 0.72;
      path.index = (path.index + 1) % path.buffer.length;
      if (index % 2) this.right += echo * 0.55;
      else this.left += echo * 0.55;
    }
  }
}
