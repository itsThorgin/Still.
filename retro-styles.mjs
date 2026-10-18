export const RETRO_STYLES = Object.freeze([
  Object.freeze({ value: 1, label: 'Peaceful village' }),
  Object.freeze({ value: 2, label: 'Dreamy exploration' }),
  Object.freeze({ value: 3, label: 'Playful afternoon' }),
  Object.freeze({ value: 4, label: 'Meadow quest' }),
  Object.freeze({ value: 5, label: 'Moonlit café' }),
  Object.freeze({ value: 6, label: 'Lantern village', family: 1, sound: 'clear' }),
  Object.freeze({ value: 7, label: 'Starlight exploration', family: 2, sound: 'clear' }),
  Object.freeze({ value: 8, label: 'Sunny afternoon', family: 3, sound: 'clear' }),
  Object.freeze({ value: 9, label: 'Emerald quest', family: 4, sound: 'clear' }),
  Object.freeze({ value: 10, label: 'Midnight café', family: 5, sound: 'clear' }),
]);

export function mixRetroSeed(seed) {
  let value = (seed ^ 0xa511e9b3) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}

export function nextRetroStyle(seed, current) {
  const choices = RETRO_STYLES.filter((style) => style.value !== current);
  return choices[Math.floor(mixRetroSeed(seed ^ 0x9e3779b9) / 4294967296 * choices.length)].value;
}

export function retroStyle(selection, seed) {
  const chosen = RETRO_STYLES.find((style) => style.value === selection);
  if (chosen) return chosen;
  // Keep the seed's theme family; choose familiar or companion writing independently.
  const family = Math.floor(mixRetroSeed(seed) / 4294967296 * 5);
  return RETRO_STYLES[family + ((mixRetroSeed(seed ^ 0x243f6a88) & 1) ? 5 : 0)];
}
