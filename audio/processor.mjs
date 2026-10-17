import { SoundGenerator } from './synth.mjs';

class StillProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const config = options.processorOptions;
    this.generator = new SoundGenerator(sampleRate, config.kind, config.params, config.seed, config.motion, config.sweep, config.rateMotion);
    this.generator.setMonitor(config.monitor ?? { highSolo: false });
    this.nextRateReport = 0;
    this.needsRateReport = true;
    this.reportedRateMoving = false;
    this.nextReport = 0;
    this.needsReport = true;
    this.reportedMoving = false;
    this.stopTime = config.stopTime ?? Infinity;
    this.port.onmessage = ({ data }) => {
      if (data.type === 'parameters') this.generator.setParams(data.params);
      if (data.type === 'motion') this.generator.setMotion(data.settings);
      if (data.type === 'rate-motion') this.generator.setRateMotion(data.settings);
      if (data.type === 'monitor') this.generator.setMonitor(data.settings);
      if (data.type === 'parameters' || data.type === 'rate-motion') this.needsRateReport = true;
      if (data.type === 'parameters' || data.type === 'motion') this.needsReport = true;
      if (data.type === 'stop-time') this.stopTime = data.time ?? Infinity;
    };
  }

  process(inputs, outputs) {
    const [left, right] = outputs[0];
    if (currentTime >= this.stopTime) {
      this.port.postMessage({ type: 'ended' });
      return false;
    }
    this.generator.render(left, right);
    const sweep = this.generator.sweep;
    const rate = this.generator.rateMotion;
    if (rate && (rate.active || this.reportedRateMoving || this.needsRateReport) && this.generator.frames >= this.nextRateReport) {
      this.nextRateReport = this.generator.frames + sampleRate / 5;
      this.reportedRateMoving = rate.active;
      this.needsRateReport = false;
      this.port.postMessage({ type: 'rate-values', params: { ...this.generator.params }, moving: rate.active });
    }
    if (sweep && (this.generator.frames >= this.nextReport || sweep.done)) {
      this.nextReport = this.generator.frames + sampleRate / 20;
      this.port.postMessage({ type: 'sweep-values', params: { ...this.generator.params }, mode: sweep.mode, progress: sweep.progress, duration: sweep.duration });
    }
    if (this.generator.motion && (this.generator.motion.active || this.reportedMoving || this.needsReport) && this.generator.frames >= this.nextReport) {
      this.nextReport = this.generator.frames + sampleRate / 5;
      this.reportedMoving = this.generator.motion.active;
      this.needsReport = false;
      this.port.postMessage({ type: 'motion-values', params: { ...this.generator.params }, moving: this.reportedMoving });
    }
    // Silence samples after the exact end time. The gain node handles the fade.
    if (Number.isFinite(this.stopTime)) {
      const lastSample = Math.max(0, Math.ceil((this.stopTime - currentTime) * sampleRate));
      if (lastSample < left.length) {
        left.fill(0, lastSample);
        right.fill(0, lastSample);
      }
    }
    if (sweep?.done) {
      this.port.postMessage({ type: 'ended', reason: 'sweep' });
      return false;
    }
    return true;
  }
}

registerProcessor('still-generator', StillProcessor);
