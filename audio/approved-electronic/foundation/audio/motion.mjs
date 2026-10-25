const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const MOTION_SECONDS = Object.freeze({ slow: 90, medium: 45, fast: 20 });
// Full strength allows one octave, 20 notes/minute, 6 seconds, or 50 points either side.
const RANGES = Object.freeze({ low: 1, high: 1, density: 20, length: 6, overlap: 50 });

export function motionBounds(control, centre, strength) {
  const span = (RANGES[control.key] ?? 0) * strength / 100;
  return control.scale === 'log'
    ? [Math.max(control.min, centre / 2 ** span), Math.min(control.max, centre * 2 ** span)]
    : [Math.max(control.min, centre - span), Math.min(control.max, centre + span)];
}

export function normalizeMotion(input = {}) {
  const value = Number(input?.strength ?? 50);
  return {
    enabled: input?.enabled === true,
    strength: Number.isFinite(value) ? Math.round(clamp(value, 0, 100) * 10) / 10 : 50,
    speed: Object.hasOwn(MOTION_SECONDS, input?.speed) ? input.speed : 'medium',
  };
}

export function restoreMotion(input, controls, centre) {
  if (!input || input.strength !== undefined || input.amount === undefined) return normalizeMotion(input);
  const parsed = Number(input.amount);
  const amount = Number.isFinite(parsed) ? clamp(parsed, 1, 10) : 3;
  // Choose a conservative strength that fits inside every old parameter range.
  const limits = controls.map((control) => control.scale === 'log'
    ? Math.log2(1 + amount / 100) * 100
    : centre[control.key] * amount / RANGES[control.key]);
  const strength = Math.floor(Math.min(Math.log2(1 + amount / 100) * 100, ...limits) * 10) / 10;
  return normalizeMotion({ enabled: input.enabled, strength, speed: 'medium' });
}

export class GentleMotion {
  constructor(centre, controls, seed, settings = {}) {
    this.centre = { ...centre };
    this.controls = controls;
    this.values = { ...centre };
    this.from = { ...centre };
    this.to = { ...centre };
    this.randomState = (seed ^ 0x9e3779b9) >>> 0 || 1;
    Object.assign(this, normalizeMotion(settings));
    this.start = 0;
    this.end = 0;
    this.active = this.enabled && this.strength > 0 && controls.length > 0;
    if (this.active) this.nextSegment(0);
  }

  random() {
    let value = this.randomState;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.randomState = value >>> 0;
    return this.randomState / 4294967296;
  }

  nextSegment(time) {
    this.from = { ...this.to };
    this.to = { ...this.centre };
    this.start = time;
    this.end = time + MOTION_SECONDS[this.speed];
    for (const control of this.controls) {
      const centre = this.centre[control.key];
      const offset = this.random() * 2 - 1;
      const span = (RANGES[control.key] ?? 0) * this.strength / 100;
      const value = control.scale === 'log' ? centre * 2 ** (span * offset) : centre + span * offset;
      this.to[control.key] = clamp(value, control.min, control.max);
    }
    // Keep nearby filter edges ordered without widening their motion limits.
    if (this.to.low >= this.to.high) {
      this.to.low = Math.min(this.to.low, this.centre.low);
      this.to.high = Math.max(this.to.high, this.centre.high);
    }
  }

  sample(time) {
    while (this.active && time >= this.end) {
      if (this.enabled && this.strength > 0) this.nextSegment(this.end);
      else this.active = false;
    }
    Object.assign(this.values, this.centre);
    if (!this.active) return this.values;
    const position = clamp((time - this.start) / (this.end - this.start), 0, 1);
    const blend = position ** 3 * (10 + position * (-15 + position * 6));
    for (const control of this.controls) {
      const key = control.key;
      this.values[key] = blend === 0 ? this.from[key] : blend === 1 ? this.to[key] : control.scale === 'log'
        ? Math.exp(Math.log(this.from[key]) + Math.log(this.to[key] / this.from[key]) * blend)
        : this.from[key] + (this.to[key] - this.from[key]) * blend;
    }
    return this.values;
  }

  returnToCentre(current, time) {
    this.from = { ...current };
    this.to = { ...this.centre };
    this.start = time;
    this.end = time + 5;
    this.active = this.controls.length > 0;
  }

  recenter(centre, time) {
    const current = { ...this.sample(time) };
    const changing = this.active;
    this.centre = { ...centre };
    if (changing) this.returnToCentre(current, time);
  }

  configure(settings, time) {
    const next = normalizeMotion(settings);
    if (next.enabled === this.enabled && next.strength === this.strength && next.speed === this.speed) return;
    const current = { ...this.sample(time) };
    Object.assign(this, next);
    this.returnToCentre(current, time);
  }
}
