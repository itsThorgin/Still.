import { fadeSeconds, remainingSeconds } from '../state.mjs';
import { validElectronicMix } from '../electronic-variation.mjs';
import { ELECTRONIC_KINDS } from '../electronic-characters.mjs';
import { RETRO_STYLES } from '../retro-styles.mjs';
import { GainEnvelope } from './envelope.mjs';
import { normalizeMotion } from './motion.mjs';
import { ToneSweep } from './tone-sweep.mjs';
import { normalizeRateMotion } from './rate-motion.mjs';

export class AudioEngine {
  constructor(onChange, onMotion = () => {}, onSweep = () => {}, onRate = () => {}, onVariation = () => {}, onGardenChoices = () => {}) {
    this.onChange = onChange;
    this.onMotion = onMotion;
    this.onSweep = onSweep;
    this.onRate = onRate;
    this.onVariation = onVariation;
    this.onGardenChoices = onGardenChoices;
    this.rateSettings = normalizeRateMotion();
    this.monitorSettings = { highSolo: false };
    this.motionSettings = normalizeMotion();
    this.context = null;
    this.analyser = null;
    this.active = null;
    this.voices = new Set();
    this.playing = false;
    this.paused = false;
    this.interrupted = false;
    this.resumeRequest = null;
    this.pauseRequest = null;
    this.deadline = null;
    this.sweepDeadline = null;
    this.session = 0;
    this.reporting = true;
  }

  async prepare() {
    if (!this.context || this.context.state === 'closed') {
      this.setAnalysisEnabled(false);
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
      this.transportGain = this.context.createGain();
      this.masterEnvelope = new GainEnvelope(this.master.gain, this.context.currentTime, 0);
      this.sessionEnvelope = new GainEnvelope(this.sessionGain.gain, this.context.currentTime, 0);
      this.transportEnvelope = new GainEnvelope(this.transportGain.gain, this.context.currentTime, 0);
      this.sessionGain.connect(this.transportGain).connect(this.master).connect(this.context.destination);
      
      this.moduleReady = this.context.audioWorklet.addModule(new URL('./processor.mjs', import.meta.url)).catch(async (error) => {
        await this.context.close();
        this.context = null;
        throw error;
      });
      const context = this.context;
      context.onstatechange = () => { if (this.context === context) this.contextStateChanged(); };
    }
    await this.moduleReady;
    await this.context.resume();
    if (this.context.state !== 'running') throw playbackError('Audio could not start. Check this browser\'s sound permissions.');
  }

  notify(message = '') {
    if (!this.playing || this.paused || this.interrupted || this.context?.state !== 'running') this.setAnalysisEnabled(false);
    this.onChange({ playing: this.playing, paused: this.paused, interrupted: this.interrupted, message });
  }

  setAnalysisEnabled(enabled) {
    if (!enabled) {
      const analyser = this.analyser;
      if (!analyser) return;
      this.analyser = null;
      // Disconnect only the visual tap; the audible gain chain stays connected.
      try { this.sessionGain.disconnect(analyser); } catch {}
      try { analyser.disconnect(); } catch {}
      return;
    }
    if (this.analyser || !this.playing || this.paused || this.interrupted || this.context?.state !== 'running') return;
    try {
      const analyser = this.context.createAnalyser?.();
      if (!analyser) return;
      this.analyser = analyser;
      analyser.fftSize = 2048;
      this.sessionGain.connect(analyser);
    } catch { this.setAnalysisEnabled(false); }
  }

  contextStateChanged() {
    if (!this.playing) return;
    this.checkDeadline();
    if (!this.playing) return;
    if (this.context.state === 'closed') {
      this.stop('Playback was interrupted. Select Start listening to begin again.');
    } else if (this.context.state === 'running') {
      if (this.paused && !this.resumeRequest) {
        this.context.suspend().catch(() => {});
      } else if (this.paused || this.interrupted) {
        this.restorePlayback();
      } else if (this.playing) this.notify();
    } else if (!this.paused && !this.interrupted) {
      this.interrupted = true;
      this.transportEnvelope.hold(this.context.currentTime);
      this.transportEnvelope.set(0, this.context.currentTime);
      this.notify('Playback interrupted. Select Resume listening to continue.');
    }
  }

  pause() {
    this.checkDeadline();
    if (!this.playing || !this.active || this.paused) return;
    this.paused = true;
    this.interrupted = false;
    this.resumeRequest = null;
    const request = this.pauseRequest = { session: this.session };
    const now = this.context.currentTime;
    this.transportEnvelope.hold(now);
    this.transportEnvelope.ramp(0, now + 0.04);
    this.notify();
    setTimeout(() => {
      if (this.pauseRequest === request && this.session === request.session && this.playing && this.paused) {
        this.context.suspend().catch(() => {});
      }
    }, 60);
  }

  async resume() {
    this.checkDeadline();
    if (!this.playing || !this.active) return false;
    if (this.context.state === 'closed') {
      this.stop('Playback was interrupted. Select Start listening to begin again.');
      return false;
    }
    if (this.resumeRequest) return this.resumeRequest.promise;
    if (!this.paused && !this.interrupted && this.context.state === 'running') return true;
    const request = this.resumeRequest = { context: this.context, session: this.session };
    this.pauseRequest = null;
    // The gate stays silent until the current request and deadlines are checked.
    request.promise = (async () => {
      try {
        await request.context.resume();
        if (this.resumeRequest !== request || this.session !== request.session || !this.playing) return false;
        this.checkDeadline();
        if (!this.playing) return false;
        if (request.context.state !== 'running') {
          this.notify('Playback interrupted. Select Resume listening to continue.');
          return false;
        }
        if (this.paused || this.interrupted) this.restorePlayback();
        return true;
      } catch {
        if (this.resumeRequest === request && this.playing) this.notify('Audio could not resume. Select Resume listening to try again.');
        return false;
      } finally {
        if (this.resumeRequest === request) this.resumeRequest = null;
      }
    })();
    return request.promise;
  }

  restorePlayback() {
    this.checkDeadline();
    if (!this.playing || !this.active) return;
    const now = this.context.currentTime;
    // Sleep timers use elapsed wall time, including time spent suspended.
    if (this.deadline !== null) {
      const remaining = Math.max(0, (this.deadline - Date.now()) / 1000);
      this.stopTime = now + remaining;
      this.sessionEnvelope.hold(now);
      const fade = fadeSeconds(this.duration);
      this.sessionEnvelope.set(Math.min(1, remaining / fade), now);
      if (remaining > fade) this.sessionEnvelope.set(1, this.stopTime - fade);
      this.sessionEnvelope.ramp(0, this.stopTime);
    }
    this.paused = this.interrupted = false;
    this.active.recoveredSweep = this.sweepDeadline !== null;
    this.updateActiveStopTime();
    this.restoreTransport();
    this.notify();
  }

  restoreTransport(initial = false) {
    if (this.paused || this.interrupted) return;
    const now = this.context.currentTime;
    this.transportEnvelope.hold(now);
    const remaining = this.sweepDeadline === null || !this.active?.recoveredSweep ? Infinity : Math.max(0, (this.sweepDeadline - Date.now()) / 1000);
    this.transportEnvelope.ramp(1, now + (initial ? 0 : Math.min(0.04, remaining / 2)));
    if (Number.isFinite(remaining)) {
      this.transportEnvelope.set(1, now + Math.max(remaining / 2, remaining - 0.25));
      this.transportEnvelope.ramp(0, now + remaining);
    }
  }

  updateActiveStopTime() {
    if (!this.active) return;
    const sweepTime = this.sweepDeadline === null ? Infinity : this.context.currentTime + Math.max(0, (this.sweepDeadline - Date.now()) / 1000);
    const time = Math.min(this.stopTime, sweepTime);
    this.active.stopReason = sweepTime < this.stopTime ? 'sweep' : 'timer';
    this.active.node.port.postMessage({ type: 'stop-time', time: Number.isFinite(time) ? time : null });
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
    const voice = { kind: profile.kind, node: new AudioWorkletNode(this.context, 'still-generator', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { kind: profile.kind, params, seed, motion, sweep, rateMotion: this.rateSettings, monitor: this.monitorSettings, stopTime: this.stopTime, reporting: this.reporting } }), gain: this.context.createGain() };
    voice.envelope = new GainEnvelope(voice.gain.gain, this.context.currentTime, startGain);
    voice.params = { ...params };
    voice.parameterRevision = 0;
    voice.node.connect(voice.gain).connect(this.sessionGain);
    this.voices.add(voice);
    voice.node.port.onmessage = ({ data }) => {
      if (data.type === 'bass-stage') {
        if (voice === this.active && ELECTRONIC_KINDS.includes(voice.kind)) voice.bassStage = data.stage;
        return;
      }
      if (data.type === 'garden-choices') {
        if (voice === this.active && this.playing) this.onGardenChoices(data.description);
        return;
      }
      if (data.type === 'variation') {
        if (voice === this.active && this.playing) {
          if (voice.kind === 'retro' && Number.isInteger(data.style) && data.style >= 0 && data.style <= RETRO_STYLES.length) voice.params.style = data.style;
          const mix = data.revision === voice.parameterRevision ? validElectronicMix(voice.kind, data.mix) : null;
          if (mix) Object.assign(voice.params, mix);
          const report = { ...data };
          if (mix) report.mix = mix;
          else delete report.mix;
          this.onVariation(report);
        }
        return;
      }
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
      if (wasActive && this.playing) this.finish(data.reason === 'sweep' || voice.stopReason === 'sweep' ? 'Pitch sweep complete.' : 'Timer complete.');
    };
    voice.node.onprocessorerror = () => { if (this.voices.has(voice)) this.stop('An audio error stopped playback. Select Start listening to try again.'); };
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
    this.updateActiveStopTime();
  }

  play(profile, params, seed, duration, volume, muted, motion, sweep) {
    if (!this.context || this.context.state !== 'running') throw playbackError('Audio could not start. Try again or reload the page.');
    const frequencyError = this.frequencyError(profile.kind, params);
    if (frequencyError) throw playbackError(frequencyError);
    const sweepPlan = this.validateSweep(profile, sweep);
    this.playing = true;
    this.paused = this.interrupted = false;
    this.resumeRequest = this.pauseRequest = null;
    this.motionSettings = normalizeMotion(motion);
    this.session++;
    this.startedAt = Date.now();
    this.setVolume(volume, muted);
    this.scheduleTimer(duration, true);
    this.sweepDeadline = sweepPlan ? Date.now() + sweepPlan.duration * 1000 : null;
    this.active = this.makeVoice(profile, params, seed, 0, sweep);
    this.active.envelope.ramp(1, this.context.currentTime + 0.25);
    this.restoreTransport(true);
    this.notify();
  }

  changeProfile(profile, params, seed, sweep) {
    this.checkDeadline();
    if (!this.playing) return;
    const frequencyError = this.frequencyError(profile.kind, params);
    if (frequencyError) { this.stop(frequencyError); return; }
    const sweepPlan = this.validateSweep(profile, sweep);
    const now = this.context.currentTime;
    if (this.paused || this.interrupted || this.context.state !== 'running') {
      for (const voice of [...this.voices]) this.releaseVoice(voice);
    } else {
      for (const voice of this.voices) {
        voice.envelope.hold(now);
        voice.envelope.ramp(0, now + 0.25);
        voice.node.port.postMessage({ type: 'stop-time', time: now + 0.27 });
      }
    }
    this.sweepDeadline = sweepPlan ? Date.now() + sweepPlan.duration * 1000 : null;
    this.active = this.makeVoice(profile, params, seed, 0, sweep);
    this.active.envelope.ramp(1, now + 0.25);
    this.restoreTransport();
  }

  setParams(params) {
    if (!this.playing || !this.active) return;
    const frequencyError = this.frequencyError(this.active.kind, params);
    if (frequencyError) { this.stop(frequencyError); return; }
    this.sweepDeadline = null;
    if (this.active.stopReason === 'sweep') this.updateActiveStopTime();
    this.restoreTransport();
    this.active.params = { ...params };
    this.active.node.port.postMessage({ type: 'parameters', params, revision: ++this.active.parameterRevision });
  }

  bassPlaybackStage() {
    if (!this.playing || !ELECTRONIC_KINDS.includes(this.active?.kind)) return '';
    return { out: 'Fading out previous music', quiet: 'Quiet pause', in: 'Starting fresh' }[this.active.bassStage] ?? '';
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

  setReporting(enabled) {
    this.reporting = enabled !== false;
    if (this.playing && this.active) this.active.node.port.postMessage({ type: 'reporting', enabled: this.reporting });
  }

  validateSweep(profile, sweep) {
    if (!sweep) return null;
    if (profile.kind !== 'tone') throw playbackError('Pitch sweeps are available only for Pure tone.');
    return new ToneSweep(sweep.mode, sweep.high, this.context.sampleRate);
  }

  stop(message = '') {
    if (!this.context || !this.playing) return;
    const immediate = this.paused || this.interrupted || this.context.state !== 'running';
    this.playing = false;
    const now = this.context.currentTime;
    try {
      this.sessionEnvelope.hold(now);
      this.sessionEnvelope.ramp(0, now + 0.15);
      if (immediate) {
        this.transportEnvelope.hold(now);
        this.transportEnvelope.set(0, now);
        for (const voice of [...this.voices]) this.releaseVoice(voice);
      }
      for (const voice of this.voices) {
        voice.envelope.hold(now);
        voice.envelope.ramp(0, now + 0.15);
        voice.node.port.postMessage({ type: 'stop-time', time: now + 0.17 });
      }
    } catch {
      
      for (const voice of [...this.voices]) this.releaseVoice(voice);
      this.context.suspend().catch(() => {});
    } finally {
      this.active = null;
      this.finish(message);
    }
  }

  finish(message) {
    this.playing = false;
    this.paused = this.interrupted = false;
    this.resumeRequest = this.pauseRequest = null;
    this.deadline = null;
    this.sweepDeadline = null;
    this.notify(message);
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
