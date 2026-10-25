const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = (value) => value ** 3 * (10 + value * (-15 + value * 6));

export const RATE_SECONDS = Object.freeze({ slow: 90, medium: 45, fast: 20 });
export const RATE_BANDS = Object.freeze([
  Object.freeze({ name: 'DELTA', low: 0.5, high: 4 }),
  Object.freeze({ name: 'THETA', low: 4, high: 8 }),
  Object.freeze({ name: 'ALPHA', low: 8, high: 13 }),
  Object.freeze({ name: 'BETA', low: 13, high: 30 }),
  Object.freeze({ name: 'GAMMA', low: 30, high: 40 }),
]);

export function rateBand(rate) {
  return RATE_BANDS.find((band) => rate < band.high) ?? RATE_BANDS.at(-1);
}

export function normalizeRateMotion(input) {
  return { enabled: input?.enabled === true, speed: Object.hasOwn(RATE_SECONDS, input?.speed) ? input.speed : 'medium' };
}

export class RateMotion {
  constructor(rate, seed, settings) {
    this.selected = clamp(rate, 0.5, 40);
    this.value = this.from = this.to = this.selected;
    this.randomState = (seed ^ 0x85ebca6b) >>> 0 || 1;
    Object.assign(this, normalizeRateMotion(settings));
    this.start = this.end = 0;
    this.active = this.enabled;
    if (this.enabled) this.next(0);
  }

  next(time) {
    let value = this.randomState;
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    this.randomState = value >>> 0;
    const band = rateBand(this.selected);
    this.from = this.to;
    this.to = band.low + (band.high - band.low) * this.randomState / 4294967296;
    this.start = time;
    this.end = time + RATE_SECONDS[this.speed];
  }

  sample(time) {
    while (this.active && time >= this.end) {
      if (this.enabled) this.next(this.end);
      else this.active = false;
    }
    if (!this.active) return this.value = this.selected;
    const blend = smooth(clamp((time - this.start) / (this.end - this.start), 0, 1));
    return this.value = this.from + (this.to - this.from) * blend;
  }

  settle(time) {
    this.from = this.sample(time);
    this.to = this.selected;
    this.start = time;
    this.end = time + 5;
    this.active = true;
  }

  recenter(rate, time) {
    if (rate === this.selected) return;
    const current = this.sample(time);
    this.selected = clamp(rate, 0.5, 40);
    if (this.active || this.enabled) {
      this.from = current;
      this.to = this.selected;
      this.start = time;
      this.end = time + 5;
      this.active = true;
    } else this.value = this.from = this.to = this.selected;
  }

  configure(settings, time) {
    const next = normalizeRateMotion(settings);
    if (next.enabled === this.enabled && next.speed === this.speed) return;
    this.settle(time);
    Object.assign(this, next);
  }
}
