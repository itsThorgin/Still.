import { SoundGenerator } from './synth.mjs';
import { prepareSynthwaveTables } from './synthwave-instruments.mjs';

// Build shared tables while the module loads, before any voice starts.
prepareSynthwaveTables();

class StillProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const config = options.processorOptions;
    this.generator = new SoundGenerator(sampleRate, config.kind, config.params, config.seed, config.motion, config.sweep, config.rateMotion);
    this.generator.setMonitor(config.monitor ?? { highSolo: false });
    this.nextRateReport = 0;
    this.needsRateReport = true;
    this.reportedRateMoving = false;
    this.reportedVariation = 0;
    this.parameterRevision = 0;
    this.reportedGardenPlan = null;
    this.nextReport = 0;
    this.needsReport = true;
    this.reportedMoving = false;
    this.stopTime = config.stopTime ?? Infinity;
    this.reporting = config.reporting !== false;
    this.port.onmessage = ({ data }) => {
      if (data.type === 'parameters') {
        this.generator.setParams(data.params);
        this.parameterRevision = data.revision ?? this.parameterRevision + 1;
      }
      if (data.type === 'motion') this.generator.setMotion(data.settings);
      if (data.type === 'rate-motion') this.generator.setRateMotion(data.settings);
      if (data.type === 'monitor') this.generator.setMonitor(data.settings);
      if (data.type === 'parameters' || data.type === 'rate-motion') this.needsRateReport = true;
      if (data.type === 'parameters' || data.type === 'motion') this.needsReport = true;
      if (data.type === 'stop-time') this.stopTime = data.time ?? Infinity;
      if (data.type === 'reporting') {
        this.reporting = data.enabled !== false;
        this.needsRateReport = this.needsReport = true;
        this.nextRateReport = this.nextReport = 0;
      }
    };
  }

  process(inputs, outputs) {
    const [left, right] = outputs[0];
    if (currentTime >= this.stopTime) {
      this.port.postMessage({ type: 'ended' });
      return false;
    }
    this.generator.render(left, right);
    if (this.generator.electronic) {
      const electronic = this.generator.electronic;
      const stage = (electronic.manual ?? electronic.transition)?.phase ?? 'playing';
      if (stage !== this.reportedBassStage) {
        this.reportedBassStage = stage;
        this.port.postMessage({ type: 'bass-stage', stage });
      }
    }
    const gardenPlan = this.generator.soundscape?.plan;
    if (gardenPlan?.description && gardenPlan !== this.reportedGardenPlan) {
      this.reportedGardenPlan = gardenPlan;
      this.port.postMessage({ type: 'garden-choices', description: gardenPlan.description });
    }
    if (this.generator.variationVersion !== this.reportedVariation) {
      this.reportedVariation = this.generator.variationVersion;
      this.port.postMessage(this.generator.electronic
        ? { type: 'variation', seed: this.generator.electronic.rotation.seed,
          ...(this.generator.electronic.variationParams ? { mix: this.generator.electronic.variationParams, revision: this.parameterRevision } : {}) }
        : this.generator.retro
        ? { type: 'variation', seed: this.generator.retroRotation.seed, style: this.generator.retro.selection }
        : { type: 'variation', seed: this.generator.rotation.seed });
    }
    const sweep = this.generator.sweep;
    const rate = this.generator.rateMotion;
    if (this.reporting && rate && (rate.active || this.reportedRateMoving || this.needsRateReport) && this.generator.frames >= this.nextRateReport) {
      this.nextRateReport = this.generator.frames + sampleRate / 5;
      this.reportedRateMoving = rate.active;
      this.needsRateReport = false;
      this.port.postMessage({ type: 'rate-values', params: { ...this.generator.params }, moving: rate.active });
    }
    if (sweep && ((this.reporting && this.generator.frames >= this.nextReport) || sweep.done)) {
      this.nextReport = this.generator.frames + sampleRate / 20;
      this.port.postMessage({ type: 'sweep-values', params: { ...this.generator.params }, mode: sweep.mode, progress: sweep.progress, duration: sweep.duration });
    }
    if (this.reporting && this.generator.motion && (this.generator.motion.active || this.reportedMoving || this.needsReport) && this.generator.frames >= this.nextReport) {
      this.nextReport = this.generator.frames + sampleRate / 5;
      this.reportedMoving = this.generator.motion.active;
      this.needsReport = false;
      this.port.postMessage({ type: 'motion-values', params: { ...this.generator.params }, moving: this.reportedMoving });
    }
    
    // Clear samples after the timer boundary.
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
