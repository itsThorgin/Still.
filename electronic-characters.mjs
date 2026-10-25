import {MUSIC_CHARACTERS} from './music-characters.mjs';
import { gardenHash } from './garden-options.mjs';
import { NEON_EXPANSION } from './electronic-expansion.mjs';
import { AMBIENT_CHARACTERS } from './ambient-characters.mjs';
import { JOURNEY_CHARACTERS } from './journey-characters.mjs';
import { SYNTHWAVE_ADDITIONS } from './synthwave-characters.mjs';

export const ELECTRONIC_STYLES = {
  synthwave: [
    { value: 1, label: 'Midnight drive', genre: 'Synthwave', tempo: 100, tonic: [45, 48, 50, 52], scale: [0, 2, 3, 5, 7, 8, 10],
      progression: [0, 5, 2, 6, 0, 3, 5, 4], bridge: [3, 5, 0, 2, 3, 1, 4, 4],
      theme: [0, 4, 7, 6, 4, 2, 1, 4, 2, 6, 9, 7, 4, 3, 1, 0], answer: [7, 6, 4, 2, 4, 1, 0, 2, 4, 7, 6, 4, 3, 1, -1, 0],
      rhythms: [[0, 3, 6, 10], [0, 6, 11], [2, 4, 7, 12], [0, 3, 8, 10, 14]], bassRhythms: [[0, 2, 4, 6, 8, 10, 12, 14], [0, 2, 6, 8, 10, 14], [0, 3, 6, 8, 12, 14]],
      arp: [0, 4, 7, 2, 4, 9, 7, 4], voicing: [0, 2, 4, 8], lead: 'saw-lead', reply: 'brass', pad: 'wide-pad', pluck: 'pulse-arp', bass: 'octave-bass', kit: 'machine', groove: 'drive',
      form: ['theme', 'answer', 'break', 'return', 'bridge', 'lift', 'solo', 'finale'],
      description: 'Deep octave bass and low synth riffs carry the heavier passages. Slower chords and sparse arpeggios leave room for lighter melodies before the driving return.' },
    { value: 2, label: 'Velvet signals', genre: 'Darkwave', tempo: 88, tonic: [43, 46, 48, 50], scale: [0, 1, 3, 5, 7, 8, 10],
      progression: [0, 0, 1, 5, 0, 3, 1, 0], bridge: [5, 3, 1, 1, 5, 6, 1, 0],
      theme: [4, 3, 1, 0, -1, 0, 3, 1, 0, 4, 3, 1, -1, 1, 0, 0], answer: [0, 1, 3, 4, 3, 1, 0, -3, 1, 0, -1, -3, -1, 1, 0, 0],
      rhythms: [[0, 7, 12], [2, 10], [0, 6, 14], [3, 8, 13]], bassRhythms: [[0, 3, 8, 11, 14], [0, 6, 8, 15], [0, 3, 6, 10, 14]],
      arp: [0, 1, 4, 2, 0, 4, 1, 2], voicing: [0, 4, 7], lead: 'hollow-lead', reply: 'dark-keys', pad: 'choir-pad', pluck: 'dark-keys', bass: 'pulse-bass', kit: 'dark', groove: 'dark',
      form: ['theme', 'answer', 'break', 'return', 'bridge', 'solo', 'lift', 'finale'],
      description: 'Low hollow melodies, close shadowy harmony, choir-like pads and a syncopated pulse, with room between phrases.' },
    { value: 3, label: 'Afterglow arcade', genre: 'Retrowave', tempo: 116, tonic: [45, 48, 50, 53], scale: [0, 2, 3, 5, 7, 8, 10],
      progression: [0, 4, 5, 3, 0, 2, 3, 4], bridge: [5, 2, 3, 0, 1, 3, 4, 4],
      theme: [0, 2, 4, 7, 9, 7, 4, 2, 1, 4, 6, 7, 6, 4, 2, 0], answer: [4, 6, 7, 9, 7, 6, 4, 2, 4, 2, 1, 0, 2, 4, 1, 0],
      rhythms: [[0, 2, 5, 8, 12], [2, 6, 10, 14], [0, 3, 6, 10, 13], [0, 4, 7, 11, 14]], bassRhythms: [[0, 4, 6, 8, 12, 14], [0, 2, 6, 8, 10, 14], [0, 4, 7, 10, 12, 15]],
      arp: [0, 2, 4, 7, 9, 7, 4, 2], voicing: [0, 2, 4, 6], lead: 'glass-lead', reply: 'brass', pad: 'silk-pad', pluck: 'bell-pluck', bass: 'round-bass', kit: 'electro', groove: 'arcade',
      form: ['theme', 'lift', 'break', 'return', 'answer', 'bridge', 'solo', 'finale'],
      description: 'Minor-key retrowave with round bass, low hooks and distant glassy plucks. Longer lighter melodies take the spotlight between heavier passages.' },
  ],
  bassmusic: [...MUSIC_CHARACTERS.bassmusic],
};
ELECTRONIC_STYLES.synthwave.push(...NEON_EXPANSION);
ELECTRONIC_STYLES.synthwave.push(...SYNTHWAVE_ADDITIONS);
for (const styles of Object.values(ELECTRONIC_STYLES)) {
  for (const style of styles) Object.freeze(style);
  Object.freeze(styles);
}
Object.freeze(ELECTRONIC_STYLES);
export function electronicCharacter(kind, selection = 1, seed = 1, scene = 1) {
  const styles = electronicStyles(kind);
  const pool = kind === 'fantasy' ? styles.filter(style => style.scene === scene) : styles;
  const choices = pool.length ? pool : styles;
  return styles.find((style) => style.value === selection) ?? choices[gardenHash(seed, 0x6a09e667) % choices.length];
}
export function electronicStyles(kind) { return JOURNEY_CHARACTERS[kind] ?? (kind === 'ambient' ? AMBIENT_CHARACTERS : ELECTRONIC_STYLES[kind]); }
export const ELECTRONIC_KINDS = Object.freeze(['synthwave','bassmusic','ambient','fantasy','lounge','techno']);
