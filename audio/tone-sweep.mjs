const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = (value) => value ** 3 * (10 + value * (-15 + value * 6));

export const SWEEP_FADE_SECONDS = 0.25;
export const SWEEP_STEPS_PER_OCTAVE = 36;
export const SWEEP_BANDS = Object.freeze([
  Object.freeze({ low: 20, high: 200, seconds: 3 }),
  Object.freeze({ low: 200, high: 2000, seconds: 6 }),
  Object.freeze({ low: 2000, high: 4000, seconds: 3 }),
  Object.freeze({ low: 4000, high: 8000, seconds: 5 }),
  Object.freeze({ low: 8000, high: 12000, seconds: 5 }),
  Object.freeze({ low: 12000, high: 16000, seconds: 4 }),
  Object.freeze({ low: 16000, high: 20000, seconds: 4 }),
]);
export const GLIDE_SECONDS = Object.freeze({ fadeIn: 0.5, up: 4, hold: 3, down: 4, fadeOut: 0.5 });

function spectrumTime(frequency) {
  let start = 0;
  for (const band of SWEEP_BANDS) {
    const fadeIn = band.low === 20 ? SWEEP_FADE_SECONDS : 0;
    const fadeOut = band.high === 20000 ? SWEEP_FADE_SECONDS : 0;
    if (frequency <= band.high) {
      const fraction = Math.log2(frequency / band.low) / Math.log2(band.high / band.low);
      return start + fadeIn + fraction * (band.seconds - fadeIn - fadeOut);
    }
    start += band.seconds;
  }
}

export function toneLimit(sampleRate) {
  return Math.min(20000, Math.floor(sampleRate / 2) - 1);
}

export class ToneSweep {
  constructor(mode, upper, sampleRate) {
    if (!['spectrum', 'return'].includes(mode)) throw sweepError('Choose a supported pitch sweep.');
    this.mode = mode;
    const limit = toneLimit(sampleRate);
    if (!Number.isFinite(limit) || limit < 20) throw sweepError('This audio output cannot play the selected pitch range.');
    this.high = mode === 'spectrum' ? limit : Number(upper);
    if (!Number.isFinite(this.high) || this.high < 20 || this.high > limit) throw sweepError(`Choose a frequency from 20 to ${limit.toLocaleString('en-US')} Hz for this audio output.`);
    if (mode === 'return' && this.high <= 20) throw sweepError('Choose a frequency above 20 Hz for a glide.');
    this.low = mode === 'spectrum' ? 20 : Math.max(20, this.high * 0.8);
    this.points = [20];
    if (mode === 'spectrum') {
      for (let step = 1; ; step++) {
        const frequency = 20 * 2 ** (step / SWEEP_STEPS_PER_OCTAVE);
        if (frequency >= this.high) break;
        this.points.push(frequency);
      }
      // Exact band boundaries and the output endpoint can split a musical step.
      this.points.push(...SWEEP_BANDS.map((band) => band.high).filter((frequency) => frequency < this.high), this.high);
      this.points = [...new Set(this.points)].sort((a, b) => a - b);
      this.times = this.points.map(spectrumTime);
      this.stepIndex = 0;
    }
    this.upStart = GLIDE_SECONDS.fadeIn;
    this.upEnd = this.upStart + GLIDE_SECONDS.up;
    this.downStart = this.upEnd + GLIDE_SECONDS.hold;
    this.downEnd = this.downStart + GLIDE_SECONDS.down;
    this.duration = mode === 'spectrum' ? this.times.at(-1) + SWEEP_FADE_SECONDS : this.downEnd + GLIDE_SECONDS.fadeOut;
    this.frequency = this.low;
    this.level = 0;
    this.done = false;
    this.progress = 0;
  }

  sample(time) {
    const elapsed = Math.max(0, time);
    if (this.mode === 'spectrum') {
      if (elapsed < this.times[this.stepIndex]) this.stepIndex = 0;
      while (this.stepIndex < this.points.length - 1 && elapsed >= this.times[this.stepIndex + 1]) this.stepIndex++;
      const index = this.stepIndex;
      const next = Math.min(index + 1, this.points.length - 1);
      const interval = this.times[next] - this.times[index];
      // Leave a short hold, even when dense positions are less than 80 ms apart.
      const transition = Math.min(0.08, interval * 0.8);
      const blend = transition > 0 ? smooth(clamp((elapsed - this.times[index]) / transition, 0, 1)) : 0;
      const previous = this.points[index];
      this.frequency = blend === 0 ? previous : blend === 1 ? this.points[next] : previous * (this.points[next] / previous) ** blend;
      this.level = Math.min(
        smooth(clamp(elapsed / SWEEP_FADE_SECONDS, 0, 1)),
        smooth(clamp((this.duration - elapsed) / SWEEP_FADE_SECONDS, 0, 1)),
      );
    } else {
      const blend = elapsed < this.downStart
        ? smooth(clamp((elapsed - this.upStart) / GLIDE_SECONDS.up, 0, 1))
        : 1 - smooth(clamp((elapsed - this.downStart) / GLIDE_SECONDS.down, 0, 1));
      this.frequency = blend === 0 ? this.low : blend === 1 ? this.high : this.low * (this.high / this.low) ** blend;
      this.level = Math.min(
        smooth(clamp(elapsed / GLIDE_SECONDS.fadeIn, 0, 1)),
        smooth(clamp((this.duration - elapsed) / GLIDE_SECONDS.fadeOut, 0, 1)),
      );
    }
    this.done = elapsed >= this.duration;
    this.progress = clamp(elapsed / this.duration, 0, 1);
    return this;
  }
}

function sweepError(message) {
  return Object.assign(new Error(message), { userMessage: message });
}
