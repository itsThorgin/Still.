export const SEQUENCE_SOUNDS = Object.freeze({ sequence: 'Crystal bells', plucks: 'Harp plucks', drift: 'Airy drift' });
export const SEQUENCE_ORIGINAL_SOUNDS = Object.freeze({ sequence: 'Soft bells', plucks: 'Rounded plucks', drift: 'Smooth drift' });
const SALTS = { sequence: 0x243f6a88, plucks: 0x85a308d3, drift: 0x13198a2e };
export function sequenceToneSeed(seed, kind, index = 0) {
  let value = (seed ^ SALTS[kind] ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}
export function sequencePalette(kind, seed, selection = 0) {
  const value = selection === 1 || selection === 2 ? selection : 1 + (sequenceToneSeed(seed, kind) & 1);
  return { value, label: value === 1 ? SEQUENCE_ORIGINAL_SOUNDS[kind] : SEQUENCE_SOUNDS[kind] };
}
export function sequencePaletteControl(kind) {
  const sound = { sequence: 'Soft bells has a rounded tone. Crystal bells adds brighter overtones.', plucks: 'Rounded plucks has soft, simple tones. Harp plucks adds richer harmonics.', drift: 'Smooth drift uses soft, steady tones. Airy drift adds fuller harmonics and slow tone changes.' }[kind];
  return { key: 'palette', label: 'Sound palette', unit: '', min: 0, max: 2, step: 1,
    options: [{ value: 0, label: 'Automatic with each variation' }, { value: 1, label: SEQUENCE_ORIGINAL_SOUNDS[kind] }, { value: 2, label: SEQUENCE_SOUNDS[kind] }],
    help: `${sound} Automatic lets each variation choose. Changes blend over 0.4 seconds and keep the notes and timer.` };
}

export class SequencePalette {
  constructor(rate, kind, seed, selection) {
    this.rate = rate; this.kind = kind; this.seed = seed;
    this.choice = sequencePalette(kind, seed, selection);
    this.mix = this.choice.value - 1; this.transition = null;
  }
  configure(selection, frame) {
    const choice = sequencePalette(this.kind, this.seed, selection);
    if (choice.value === this.choice.value) { this.choice = choice; return; }
    const from = this.sample(frame);
    this.choice = choice;
    this.transition = { from, to: choice.value - 1, start: frame };
  }
  sample(frame) {
    if (!this.transition) return this.mix;
    const { from, to, start } = this.transition;
    const position = Math.max(0, Math.min(1, (frame - start) / (this.rate * 0.4)));
    this.mix = from + (to - from) * position;
    if (position === 1) { this.mix = to; this.transition = null; }
    return this.mix;
  }
}
