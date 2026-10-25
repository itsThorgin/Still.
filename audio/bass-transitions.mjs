import { gardenHash } from '../garden-options.mjs';

export function automaticTransition(seed, frame, rate) {
  // Choose each duration once, independently, on the audio-frame grid.
  const frames = (minimum, span, salt) => Math.round(rate * (minimum + span * gardenHash(seed, salt) / 4294967296));
  return { phase: 'out', start: frame, from: 1,
    outFrames: frames(4, 4, 0x73a41d09), quietFrames: frames(0.5, 1, 0x182e95b7),
    inFrames: frames(3, 2, 0xb4c06721) };
}

export function bassFadeGain(fade, frame) {
  if (!fade) return 1;
  if (fade.phase === 'quiet') return 0;
  const frames = fade.phase === 'out' ? fade.outFrames : fade.inFrames;
  const position = Math.max(0, Math.min(1, (frame - fade.start) / frames));
  return fade.phase === 'out' ? (fade.from ?? 1) * (1 - position) : position;
}
