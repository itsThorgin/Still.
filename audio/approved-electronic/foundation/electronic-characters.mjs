import { gardenHash } from './garden-options.mjs';
import { NEON_EXPANSION, BASS_EXPANSION } from './electronic-expansion.mjs';
import { AMBIENT_CHARACTERS } from './ambient-characters.mjs';
import { JOURNEY_CHARACTERS } from './journey-characters.mjs';
import { BASS_DEPTH_CHARACTERS } from './bass-depth-characters.mjs';
import { SYNTHWAVE_ADDITIONS } from './synthwave-characters.mjs';
import { upgradeBassCharacter, BASS_PRODUCTION_ADDITIONS } from './bass-production-characters.mjs';

// Stable IDs and independent score vocabularies for the planned fifteen per family.
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
  bassmusic: [
    { value: 1, label: 'Liquid skyline', genre: 'Liquid DnB', tempo: 170, tonic: [45, 48, 50, 52], scale: [0, 2, 3, 5, 7, 9, 10],
      progression: [0, 3, 5, 2, 0, 5, 3, 6], bridge: [3, 2, 5, 0, 1, 3, 4, 0],
      theme: [4, 6, 7, 4, 2, 1, 0, 2, 6, 4, 2, 1, 3, 2, -1, 0], answer: [0, 2, 3, 6, 4, 2, 1, 0, 2, 4, 7, 6, 4, 2, 1, 0],
      rhythms: [[2, 6, 10], [0, 7, 12], [2, 8, 14], [0, 6, 11]], bassRhythms: [[0, 6, 10], [0, 3, 8, 14], [0, 6, 11, 14]],
      arp: [0, 4, 6, 2, 4, 7, 6, 2], voicing: [0, 2, 4, 6], lead: 'electric-keys', reply: 'glass-lead', pad: 'silk-pad', pluck: 'bell-pluck', bass: 'deep-reese', kit: 'liquid', groove: 'liquid',
      form: ['theme', 'answer', 'break', 'return', 'bridge', 'lift', 'solo', 'finale'],
      description: 'Rounded electric keys and warm extended chords over connected deep bass, soft rolling hats and steady two-step drums.' },
    { value: 2, label: 'Canopy breaks', genre: 'Jungle', tempo: 166, tonic: [43, 45, 48, 50], scale: [0, 2, 3, 5, 7, 8, 10],
      progression: [0, 0, 5, 6, 0, 3, 6, 0], bridge: [3, 3, 5, 6, 1, 5, 4, 0],
      theme: [0, 4, 3, 1, 0, -3, -1, 0, 4, 7, 4, 3, 1, 0, -1, 0], answer: [7, 4, 3, 1, 4, 3, 0, -1, 0, 3, 4, 1, -3, -1, 1, 0],
      rhythms: [[0, 3, 7], [2, 6, 11, 14], [0, 6, 10], [3, 7, 12, 15]], bassRhythms: [[0, 5, 10, 14], [0, 3, 7, 11], [0, 6, 9, 14]],
      arp: [0, 4, 2, 7, 0, 2, 4, 2], voicing: [0, 2, 4], lead: 'hollow-lead', reply: 'bell-pluck', pad: 'choir-pad', pluck: 'dub-stab', bass: 'jungle-bass', kit: 'break', groove: 'jungle',
      form: ['theme', 'lift', 'break', 'return', 'solo', 'bridge', 'answer', 'finale'],
      description: 'Chopped synthesized breaks with short drum tails, displaced snare accents and clipped bass replies, with dub stabs and hollow melodic calls.' },
    { value: 3, label: 'Submerged city', genre: 'Deep dubstep', tempo: 140, tonic: [43, 45, 46, 48], scale: [0, 1, 3, 5, 7, 8, 10],
      progression: [0, 0, 5, 0, 1, 0, 6, 0], bridge: [5, 5, 1, 0, 3, 1, 4, 0],
      theme: [0, -1, 0, 4, 1, 0, -3, 0, 7, 4, 1, -1, 0, 1, -1, 0], answer: [4, 1, 0, -1, 0, -3, -1, 0, 1, 4, 3, 1, 0, -1, -3, 0],
      rhythms: [[0, 10], [3, 12], [2, 8, 14], [0, 7, 13]], bassRhythms: [[0, 6, 10], [0, 7, 12], [0, 3, 10, 14]],
      arp: [0, 4, 1, 0, 7, 4, 1, 0], voicing: [0, 4, 8], lead: 'glass-lead', reply: 'hollow-lead', pad: 'dark-pad', pluck: 'dub-stab', bass: 'wobble-bass', kit: 'deep', groove: 'halftime',
      form: ['theme', 'answer', 'break', 'return', 'bridge', 'solo', 'lift', 'finale'],
      description: 'A spacious half-time beat, rounded sub-bass with slow filter movement, lingering dark chords and isolated hollow replies.' },
  ],
};
ELECTRONIC_STYLES.synthwave.push(...NEON_EXPANSION);
ELECTRONIC_STYLES.synthwave.push(...SYNTHWAVE_ADDITIONS);
ELECTRONIC_STYLES.bassmusic.push(...BASS_EXPANSION);
ELECTRONIC_STYLES.bassmusic.push(...BASS_DEPTH_CHARACTERS);
ELECTRONIC_STYLES.bassmusic = ELECTRONIC_STYLES.bassmusic.map(upgradeBassCharacter);
ELECTRONIC_STYLES.bassmusic.push(...BASS_PRODUCTION_ADDITIONS);
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
