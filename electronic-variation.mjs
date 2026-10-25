import { gardenHash } from './garden-options.mjs';
import { ELECTRONIC_KINDS } from './electronic-characters.mjs';
import { musicMixDefaults } from './music-mix-defaults.mjs';

export const ELECTRONIC_MIX_KEYS = Object.freeze(['tempo', 'melody', 'accompaniment', 'bass', 'percussion', 'brightness', 'movement', 'pump', 'space', 'width']);
export const ALL_MIX_SETTINGS = (1 << ELECTRONIC_MIX_KEYS.length) - 1;
export function normalizeMixMask(value) {
  return Number.isInteger(value) && value >= 0 && value <= ALL_MIX_SETTINGS ? value : ALL_MIX_SETTINGS;
}
export function mixSettingEnabled(params, key) {
  const index = ELECTRONIC_MIX_KEYS.indexOf(key);
  return index >= 0 && (normalizeMixMask(params.varyMask) & (1 << index)) !== 0;
}
export const MIX_VARIATION_LEVELS = Object.freeze([
  Object.freeze({value:0,label:'Gentle · 5–15%',min:5,max:15}),
  Object.freeze({value:1,label:'Balanced · 10–25%',min:10,max:25}),
  Object.freeze({value:2,label:'Adventurous · 15–30%',min:15,max:30}),
]);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const tempoRange = (kind) => ({ambient:[32,80],synthwave:[70,130],fantasy:[48,144],lounge:[60,115],techno:[90,165]})[kind] ?? [130,180];

// Independent seeded changes around the preset, never around a previous random
// result. A deliberately silent/dry/mono control stays off until the user raises it.
export function electronicVariationMix(kind, character, seed, params) {
  const level = MIX_VARIATION_LEVELS[params.varyAmount] ?? MIX_VARIATION_LEVELS[0];
  const base = musicMixDefaults(kind), result = {};
  for (let index = 0; index < ELECTRONIC_MIX_KEYS.length; index++) {
    const key = ELECTRONIC_MIX_KEYS[index], pace = key === 'tempo';
    if (pace && character.fixedTempo) { result[key] = character.fixedTempo; continue; }
    if (!mixSettingEnabled(params, key)) {
      result[key] = pace ? character.tempo : params[key];
      continue;
    }
    if (!pace && params[key] === 0) { result[key] = 0; continue; }
    const hash = gardenHash(seed, 0x76617279 + index * 7919);
    const amount = (level.min + (hash >>> 1) / 2147483648 * (level.max - level.min)) / 100;
    const centre = pace ? character.tempo : base[key];
    const [min,max] = pace ? tempoRange(kind) : [0,100];
    result[key] = Math.round(clamp(centre * (1 + (hash & 1 ? amount : -amount)), min, max));
  }
  return result;
}

export function characterPaceMix(character, params) {
  return Object.fromEntries(ELECTRONIC_MIX_KEYS.map(key => [key, key === 'tempo' ? character.tempo : params[key]]));
}

export function validElectronicMix(kind, input) {
  if (!input || !ELECTRONIC_KINDS.includes(kind)) return null;
  const result = {};
  for (const key of ELECTRONIC_MIX_KEYS) {
    const value = input[key], min = key === 'tempo' ? tempoRange(kind)[0] : 0;
    const max = key === 'tempo' ? tempoRange(kind)[1] : 100;
    if (!Number.isInteger(value) || value < min || value > max) return null;
    result[key] = value;
  }
  return result;
}
