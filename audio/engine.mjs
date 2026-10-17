import { fadeSeconds, remainingSeconds } from '../state.mjs';
import { GainEnvelope } from './envelope.mjs';
import { normalizeMotion } from './motion.mjs';
import { ToneSweep } from './tone-sweep.mjs';
import { normalizeRateMotion } from './rate-motion.mjs';

export class AudioEngine {
  constructor(onChange, onMotion = () => {}, onSweep = () => {}, onRate = () => {}) {
    this.onChange = onChange;
    this.onMotion = onMotion;
    this.onSweep = onSweep;
    this.onRate = onRate;
    this.rateSettings = normalizeRateMotion();
    this.monitorSettings = { highSolo: false };
    this.motionSettings = normalizeMotion();
    this.context = null;
    this.active = null;
    this.voices = new Set();
    this.playing = false;
    this.deadline = null;
    this.sweepDeadline = null;
    this.session = 0;
  }

  async prepare() {
    if (!this.context) {
      const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!AudioContextClass) throw playbackError('This browser does not support the required audio features.');
      this.context = new AudioContextClass({ latencyHint: 'playback' });
      if (!this.context.audioWorklet) {
        await this.context.close();
        this.context = null;
        throw playbackError('Open this player on localhost or HTTPS in a current browser.');
      }
      this.master = this.context.createGain();
      this.sessionGain = this.context.createGain();
      this.masterEnvelope = new GainEnvelope(this.master.gain, this.context.currentTime, 0);
      this.sessionEnvelope = new GainEnvelope(this.sessionGain.gain, this.context.currentTime, 0);
      this.sessionGain.connect(this.master).connect(this.context.destination);
      this.moduleReady = this.context.audioWorklet.addModule(new URL('./processor.mjs', import.meta.url)).catch(async (error) => {
        await this.context.close();
        this.context = null;
        throw error;
      });
      this.context.onstatechange = () => {
        if (this.playing && this.context.state !== 'running') this.stop('Playback was interrupted. Select Start listening to begin again.');
      };
    }
    await this.moduleReady;
    await this.context.resume();
    if (this.context.state !== 'running') throw playbackError('Audio could not start. Check this browser\'s sound permissions.');
  }

  setVolume(volume, muted) {
    this.volume = muted ? 0 : volume / 100;
    if (!this.context) return;
    const now = this.context.currentTime;
    this.masterEnvelope.hold(now);
    this.masterEnvelope.ramp(this.volume, now + 0.04);
  }

  makeVoice(profile, params, seed, startGain = 1, sweep) {
    const motion = { ...this.motionSettings, controls: profile.controls.filter((control) => profile.motionKeys.includes(control.key)) };
    const voice = { kind: profile.kind, node: new AudioWorkletNode(this.context, 'still-generator', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { kind: profile.kind, params, seed, motion, sweep, rateMotion: this.rateSettings, monitor: this.monitorSettings, stopTime: this.stopTime } }), gain: this.context.createGain() };
    voice.envelope = new GainEnvelope(voice.gain.gain, this.context.currentTime, startGain);
    voice.params = { ...params };
    voice.node.connect(voice.gain).connect(this.sessionGain);
    this.voices.add(voice);
    voice.node.port.onmessage = ({ data }) => {
      if (data.type === 'rate-values') {
        if (voice === this.active && this.playing) this.onRate(data);
        return;
      }
      if (data.type === 'motion-values') {
        if (voice === this.active && this.playing) this.onMotion(data);
        return;
      }
      if (data.type === 'sweep-values') {
        if (voice === this.active && this.playing && this.sweepDeadline !== null) this.onSweep(data);
        return;
      }
      if (data.type !== 'ended') return;
      const wasActive = voice === this.active;
      this.releaseVoice(voice);
      if (wasActive && this.playing) this.finish(data.reason === 'sweep' ? 'Pitch sweep complete.' : 'Timer complete.');
    };
    voice.node.onprocessorerror = () => this.stop('An audio error stopped playback. Select Start listening to try again.');
    return voice;
  }

  releaseVoice(voice) {
    if (!this.voices.has(voice)) return;
    voice.node.disconnect();
    voice.gain.disconnect();
    voice.node.port.close();
    this.voices.delete(voice);
    if (this.active === voice) this.active = null;
  }

  scheduleTimer(duration, initial = false) {
    if (!this.context || !this.playing) return;
    const now = this.context.currentTime;
    this.duration = duration;
    this.stopTime = duration === null ? Infinity : now + duration;
    this.deadline = duration === null ? null : Date.now() + duration * 1000;
    const gain = this.sessionEnvelope;
    gain.hold(now);
    if (initial && this.voices.size === 0) gain.set(0, now);
    gain.ramp(1, now + 0.25);
    if (duration !== null) {
      gain.set(1, this.stopTime - fadeSeconds(duration));
      gain.ramp(0, this.stopTime);
    }
    if (this.active) this.active.node.port.postMessage({ type: 'stop-time', time: Number.isFinite(this.stopTime) ? this.stopTime : null });
  }

  play(profile, params, seed, duration, volume, muted, motion, sweep) {
    if (!this.context || this.context.state !== 'running') throw playbackError('Audio could not start. Try again or reload the page.');
    const frequencyError = this.frequencyError(profile.kind, params);
    if (frequencyError) throw playbackError(frequencyError);
    const sweepPlan = this.validateSweep(profile, sweep);
    this.playing = true;
    this.motionSettings = normalizeMotion(motion);
    this.session++;
    this.startedAt = Date.now();
    this.setVolume(volume, muted);
    this.scheduleTimer(duration, true);
    this.sweepDeadline = sweepPlan ? Date.now() + sweepPlan.duration * 1000 : null;
    this.active = this.makeVoice(profile, params, seed, 0, sweep);
    this.active.envelope.ramp(1, this.context.currentTime + 0.25);
    this.onChange({ playing: true, message: '' });
  }

  changeProfile(profile, params, seed, sweep) {
    if (!this.playing) return;
    const frequencyError = this.frequencyError(profile.kind, params);
    if (frequencyError) { this.stop(frequencyError); return; }
    const sweepPlan = this.validateSweep(profile, sweep);
    const now = this.context.currentTime;
    for (const voice of this.voices) {
      voice.envelope.hold(now);
      voice.envelope.ramp(0, now + 0.25);
      voice.node.port.postMessage({ type: 'stop-time', time: now + 0.27 });
    }
    this.sweepDeadline = sweepPlan ? Date.now() + sweepPlan.duration * 1000 : null;
    this.active = this.makeVoice(profile, params, seed, 0, sweep);
    this.active.envelope.ramp(1, now + 0.25);
  }

  setParams(params) {
    if (!this.playing || !this.active) return;
    const frequencyError = this.frequencyError(this.active.kind, params);
    if (frequencyError) { this.stop(frequencyError); return; }
    this.sweepDeadline = null;
    this.active.params = { ...params };
    this.active.node.port.postMessage({ type: 'parameters', params });
  }

  setMotion(settings) {
    this.motionSettings = normalizeMotion(settings);
    if (this.playing && this.active) this.active.node.port.postMessage({ type: 'motion', settings: this.motionSettings });
  }

  frequencyError(kind, params) {
    const highest = kind === 'binaural' ? params.base + (this.rateSettings.enabled ? 40 : params.beat) : params.base;
    if (Number.isFinite(highest) && highest >= this.context.sampleRate / 2) {
      return `Playback stopped. This audio output supports tones below ${Math.floor(this.context.sampleRate / 2).toLocaleString('en-US')} Hz. Choose a lower frequency.`;
    }
    return '';
  }

  setRateMotion(settings) {
    this.rateSettings = normalizeRateMotion(settings);
    if (this.playing && this.active) {
      const error = this.frequencyError(this.active.kind, this.active.params);
      if (error) { this.stop(error); return; }
      this.active.node.port.postMessage({ type: 'rate-motion', settings: this.rateSettings });
    }
  }

  setMonitor(settings) {
    this.monitorSettings = { highSolo: settings.highSolo === true };
    if (this.playing && this.active) this.active.node.port.postMessage({ type: 'monitor', settings: this.monitorSettings });
  }

  validateSweep(profile, sweep) {
    if (!sweep) return null;
    if (profile.kind !== 'tone') throw playbackError('Pitch sweeps are available only for Pure tone.');
    return new ToneSweep(sweep.mode, sweep.high, this.context.sampleRate);
  }

  stop(message = '') {
    if (!this.context || !this.playing) return;
    this.playing = false;
    const now = this.context.currentTime;
    try {
      this.sessionEnvelope.hold(now);
      this.sessionEnvelope.ramp(0, now + 0.15);
      for (const voice of this.voices) {
        voice.envelope.hold(now);
        voice.envelope.ramp(0, now + 0.15);
        voice.node.port.postMessage({ type: 'stop-time', time: now + 0.17 });
      }
    } catch {
      // Stop must still silence audio if a browser rejects a scheduled event.
      for (const voice of [...this.voices]) this.releaseVoice(voice);
      this.context.suspend().catch(() => {});
    } finally {
      this.active = null;
      this.finish(message);
    }
  }

  finish(message) {
    this.playing = false;
    this.deadline = null;
    this.sweepDeadline = null;
    this.onChange({ playing: false, message });
    const session = this.session;
    setTimeout(() => {
      if (!this.playing && this.session === session && this.context) {
        for (const voice of [...this.voices]) this.releaseVoice(voice);
        this.context.suspend().catch(() => {});
      }
    }, 350);
  }

  checkDeadline() {
    if (this.playing && this.deadline !== null && remainingSeconds(this.deadline) === 0) this.stop('Timer complete.');
    else if (this.playing && this.sweepDeadline !== null && remainingSeconds(this.sweepDeadline) === 0) this.stop('Pitch sweep complete.');
  }
}

function playbackError(message) {
  return Object.assign(new Error(message), { userMessage: message });
}
