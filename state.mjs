import { getProfile } from './profiles.mjs';
import { normalizeMotion, restoreMotion } from './audio/motion.mjs';
import { normalizeRateMotion } from './audio/rate-motion.mjs';
import { normalizeMixMask } from './electronic-variation.mjs';

export const STORAGE_KEY = 'still.settings.v1';
export const VOLUME_POLICY = 2;
export const DEFAULT_VOLUME = 1;
export const SHORT_TIMERS = [1, 3, 5, 10, 15, 30];
export const NIGHT_TIMERS = [6, 7, 8, 9, 10, 11, 12];

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeParams(profile, input = {}, changedKey) {
  const result = {};
  for (const control of profile.controls) {
    const parsed = Number(input[control.key] ?? profile.defaults[control.key]);
    const value = Number.isFinite(parsed) ? parsed : profile.defaults[control.key];
    const rounded = Math.round(clamp(value, control.min, control.max) / control.step) * control.step;
    result[control.key] = control.options && !control.options.some((option) => option.value === rounded)
      ? profile.defaults[control.key] : Number(rounded.toFixed(4));
  }
  if ('varyMix' in profile.defaults && Object.hasOwn(input, 'varyMask')) result.varyMask = normalizeMixMask(input.varyMask);
  if (profile.kind === 'bassmusic' && result.style === 42) result.tempo = 174;
  if ('low' in result && result.low >= result.high) {
    if (changedKey === 'low') result.low = result.high - 1;
    else result.high = result.low + 1;
  }
  if ('highLow' in result && result.highLow >= result.highHigh) {
    if (changedKey === 'highLow') result.highLow = result.highHigh - 1;
    else result.highHigh = result.highLow + 1;
  }
  return result;
}

export function normalizeVolume(value) {
  const parsed = Number(value);
  return Number(clamp(Number.isFinite(parsed) ? parsed : DEFAULT_VOLUME, 0.01, 100).toFixed(2));
}

export function allowedTimer(seconds) {
  return seconds === null || [...SHORT_TIMERS.map((n) => n * 60), ...NIGHT_TIMERS.map((n) => n * 3600)].includes(seconds);
}

export function defaultSettings() {
  const profile = getProfile('low-gamma');
  return { profileId: profile.id, params: { ...profile.defaults }, volume: DEFAULT_VOLUME, volumePolicy: VOLUME_POLICY, muted: false, timer: null, locked: false, seed: 1, motion: normalizeMotion(), rateMotion: normalizeRateMotion() };
}

export function parseSettings(text) {
  const fallback = defaultSettings();
  try {
    const input = JSON.parse(text);
    if (!input || typeof input !== 'object') return fallback;
    const profile = getProfile(input.profileId);
    const savedVolume = normalizeVolume(input.volume ?? DEFAULT_VOLUME);
    const volume = input.volumePolicy === VOLUME_POLICY ? savedVolume : Math.min(DEFAULT_VOLUME, savedVolume);
    const params = normalizeParams(profile, input.params && typeof input.params === 'object' ? input.params : {});
    const motion = restoreMotion(input.motion, profile.controls.filter((control) => profile.motionKeys.includes(control.key)), params);
    return { profileId: profile.id, params, volume, volumePolicy: VOLUME_POLICY, muted: input.muted === true, timer: allowedTimer(input.timer) ? input.timer : null, locked: input.locked === true, seed: Number.isInteger(input.seed) && input.seed > 0 && input.seed <= 0xffffffff ? input.seed : 1, motion, rateMotion: normalizeRateMotion(input.rateMotion) };
  } catch { return fallback; }
}

export function fadeSeconds(duration) {
  return duration === null ? 0 : Math.min(duration / 2, duration >= 6 * 3600 ? 60 : 10);
}

export function timerLevel(now, end, fade) {
  if (!Number.isFinite(end)) return 1;
  if (now >= end) return 0;
  return fade > 0 ? clamp((end - now) / fade, 0, 1) : 1;
}

export function remainingSeconds(deadline, now = Date.now()) {
  return deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function formatClock(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const rest = safe % 60;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function rhythmBand(frequency) {
  if (frequency < 4) return 'DELTA';
  if (frequency < 8) return 'THETA';
  if (frequency < 13) return 'ALPHA';
  if (frequency < 30) return 'BETA';
  return 'GAMMA';
}

export function sliderPosition(control, value) {
  return control.scale === 'log' ? Math.log(value / control.min) / Math.log(control.max / control.min) * 1000 : (value - control.min) / (control.max - control.min) * 1000;
}

export function sliderValue(control, position) {
  const ratio = clamp(Number(position) / 1000, 0, 1);
  return control.scale === 'log' ? control.min * (control.max / control.min) ** ratio : control.min + (control.max - control.min) * ratio;
}
