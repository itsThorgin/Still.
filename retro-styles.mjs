export const RETRO_STYLES = Object.freeze([
  Object.freeze({ value: 1, label: 'Peaceful village' }),
  Object.freeze({ value: 2, label: 'Dreamy exploration' }),
  Object.freeze({ value: 3, label: 'Playful afternoon' }),
  Object.freeze({ value: 4, label: 'Meadow quest' }),
  Object.freeze({ value: 5, label: 'Moonlit café' }),
]);

export function mixRetroSeed(seed) {
  let value = (seed ^ 0xa511e9b3) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}

export function retroStyle(selection, seed) {
  const chosen = RETRO_STYLES.find((style) => style.value === selection);
  if (chosen) return chosen;
  return RETRO_STYLES[Math.floor(mixRetroSeed(seed) / 4294967296 * RETRO_STYLES.length)];
}
