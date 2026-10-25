import { AMBIENT_ADDITIONS } from './ambient-scenes.mjs';
const MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10], LYDIAN = [0, 2, 4, 6, 7, 9, 11], PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
function character(value, label, genre, tempo, scale, writing) {
  return Object.freeze({ value, label, genre, tempo, scale, ...writing });
}
export const AMBIENT_CHARACTERS = Object.freeze([
  character(1, 'Amber stillness', 'Warm drone', 48, MAJOR, {
    tonic: [36, 38, 41], progression: [0, 0, 3, 3, 5, 5, 1, 0], voicing: [0, 4, 8], hold: 4,
    theme: [4, 7, 6, 4, 2, 1, 0, 2], rhythms: [[2, 11], [6]], leadBars: [1, 5], pattern: [10],
    pad: 'amber-cloud', lead: 'felt-light', pluck: 'glass-seed', bass: 'sine-earth', detail: 'air-spark',
    bassTicks: [0], bassBars: 4, noteLength: 3.2, order: [0, 1, 2, 3, 4, 5, 6, 7],
    description: 'Warm overlapping chords and a rounded low foundation, with a few soft key notes appearing between long swells.' }),
  character(2, 'Deep space', 'Space drone', 36, MINOR, {
    tonic: [36, 38, 40], progression: [0, 0, 0, 5, 0, 0, 3, 0], voicing: [0, 4, 11], hold: 8,
    theme: [0, 7, 4, 6, 3, 0, -1, 0], rhythms: [[9], [13]], leadBars: [2, 6], pattern: [],
    pad: 'abyss-cloud', lead: 'glass-halo', pluck: 'air-spark', bass: 'sine-earth', detail: 'metal-dust',
    bassTicks: [0], bassBars: 8, noteLength: 6, order: [0, 4, 1, 6, 2, 3, 5, 7],
    description: 'A dark, nearly stationary low drone and distant glass signals. Long empty intervals make the upper details feel remote.' }),
  character(3, 'Glass tide', 'Crystalline ambient', 58, LYDIAN, {
    tonic: [41, 43, 45], progression: [0, 2, 5, 3, 0, 6, 1, 4], voicing: [0, 2, 6, 8], hold: 2,
    theme: [7, 4, 6, 9, 7, 3, 2, 0], rhythms: [[1, 9], [5, 13]], leadBars: [0, 2, 4, 6], pattern: [6, 14],
    pad: 'glass-halo', lead: 'glass-seed', pluck: 'copper-bell', bass: 'velvet-floor', detail: 'air-spark',
    bassTicks: [0], bassBars: 2, noteLength: 2.4, order: [0, 2, 1, 5, 4, 3, 6, 7],
    description: 'Clear glass notes and suspended bright harmony rise and fall in overlapping waves above a soft low tone.' }),
  character(4, 'Forest breath', 'Air and wood ambient', 52, DORIAN, {
    tonic: [38, 41, 43], progression: [0, 3, 1, 5, 0, 2, 3, 0], voicing: [0, 4, 6], hold: 3,
    theme: [0, 2, 3, 6, 4, 2, 1, 0], rhythms: [[3, 12], [7]], leadBars: [0, 3, 4, 7], pattern: [11],
    pad: 'breath-cloud', lead: 'reed-light', pluck: 'felt-light', bass: 'velvet-floor', detail: 'air-spark',
    bassTicks: [0, 11], bassBars: 3, noteLength: 3.8, order: [0, 1, 4, 2, 6, 5, 3, 7],
    description: 'Breathing airy layers, rounded wooden calls and a gently shifting Dorian centre. Every sound is synthesized.' }),
  character(5, 'Frozen horizon', 'Open harmonic ambient', 42, LYDIAN, {
    tonic: [38, 43, 45], progression: [0, 0, 4, 4, 2, 2, 5, 0], voicing: [0, 4, 7, 10], hold: 4,
    theme: [9, 7, 4, 6, 7, 4, 2, 0], rhythms: [[6], [2, 13]], leadBars: [1, 3, 6], pattern: [14],
    pad: 'silver-cloud', lead: 'glass-halo', pluck: 'glass-seed', bass: 'sine-earth', detail: 'metal-dust',
    bassTicks: [0], bassBars: 4, noteLength: 5.2, order: [0, 6, 2, 1, 4, 5, 3, 7],
    description: 'Open fifths and cold high harmonics hang above a still foundation. Widely spaced upper notes slowly reveal a brighter horizon.' }),
  character(6, 'Velvet dusk', 'Soft tape ambient', 46, MINOR, {
    tonic: [36, 41, 43], progression: [0, 5, 3, 1, 0, 6, 3, 4], voicing: [0, 2, 4, 8], hold: 2,
    theme: [4, 2, 1, 0, -1, 2, 3, 0], rhythms: [[0, 10], [4, 13]], leadBars: [0, 1, 4, 5], pattern: [7],
    pad: 'velvet-cloud', lead: 'felt-light', pluck: 'reed-light', bass: 'velvet-floor', detail: 'air-spark',
    bassTicks: [0], bassBars: 2, noteLength: 2.8, order: [0, 1, 2, 4, 5, 3, 6, 7],
    description: 'Soft dark chords and fading key phrases, with restrained upper harmonics and a low line that moves through the dusk.' }),
  character(7, 'Cathedral haze', 'Organ drone', 40, DORIAN, {
    tonic: [36, 38, 41], progression: [0, 0, 3, 5, 0, 1, 4, 0], voicing: [0, 4, 7, 11], hold: 4,
    theme: [0, 4, 7, 6, 4, 3, 1, 0], rhythms: [[4], [12]], leadBars: [0, 2, 5, 7], pattern: [],
    pad: 'organ-mist', lead: 'reed-light', pluck: 'glass-halo', bass: 'organ-mist', detail: 'metal-dust',
    bassTicks: [0], bassBars: 4, noteLength: 6.5, order: [0, 4, 1, 2, 5, 6, 3, 7],
    description: 'Organ-like harmonic pillars, low sustained roots and long answering tones fill a quiet, spacious arrangement.' }),
  character(8, 'Drifting islands', 'Interlocking ambient', 64, MAJOR, {
    tonic: [38, 41, 43], progression: [0, 5, 1, 3, 0, 2, 6, 4], voicing: [0, 2, 6], hold: 3,
    theme: [0, 4, 2, 7, 6, 3, 1, 0], rhythms: [[0, 7, 13], [3, 11]], leadBars: [0, 2, 3, 5, 7], pattern: [3, 9, 14],
    pad: 'amber-cloud', lead: 'felt-light', pluck: 'glass-seed', bass: 'velvet-floor', detail: 'air-spark',
    bassTicks: [0], bassBars: 3, noteLength: 1.9, order: [0, 2, 6, 1, 4, 3, 5, 7],
    description: 'Small key and glass patterns of different lengths drift across warm held chords, continually finding new points of contact.' }),
  character(9, 'Low gravity', 'Minimal sub drone', 32, MINOR, {
    tonic: [36, 38, 41], progression: [0, 0, 0, 3, 0, 0, 5, 0], voicing: [0, 7], hold: 8,
    theme: [0, 4, 0, 7, 3, 0, -1, 0], rhythms: [[12]], leadBars: [3, 7], pattern: [],
    pad: 'abyss-cloud', lead: 'silver-cloud', pluck: 'glass-halo', bass: 'sine-earth', detail: 'air-spark',
    bassTicks: [0], bassBars: 8, noteLength: 7.5, order: [0, 4, 6, 1, 2, 5, 3, 7],
    description: 'A nearly pure low foundation, distant octave veils and very few upper entrances. Weight and empty space lead the music.' }),
  character(10, 'Copper mist', 'Bell ambient', 56, DORIAN, {
    tonic: [38, 43, 45], progression: [0, 3, 5, 1, 0, 6, 2, 4], voicing: [0, 4, 8], hold: 2,
    theme: [4, 7, 3, 6, 2, 4, 1, 0], rhythms: [[2, 11], [6, 14]], leadBars: [0, 2, 4, 5, 6], pattern: [13],
    pad: 'breath-cloud', lead: 'copper-bell', pluck: 'glass-halo', bass: 'velvet-floor', detail: 'metal-dust',
    bassTicks: [0], bassBars: 2, noteLength: 2.7, order: [0, 1, 5, 2, 4, 6, 3, 7],
    description: 'Soft metallic bells ring into a warm mist, with separate low answers and long quiet spaces between the brighter details.' }),
  character(11, 'Dawn bloom', 'Luminous ambient', 54, MAJOR, {
    tonic: [36, 41, 43], progression: [0, 3, 5, 2, 0, 1, 3, 4], voicing: [0, 2, 4, 9], hold: 2,
    theme: [0, 2, 4, 7, 9, 6, 4, 2], rhythms: [[1, 9], [4, 12]], leadBars: [0, 1, 3, 4, 6], pattern: [10],
    pad: 'silver-cloud', lead: 'reed-light', pluck: 'felt-light', bass: 'velvet-floor', detail: 'air-spark',
    bassTicks: [0], bassBars: 2, noteLength: 4.2, order: [0, 1, 2, 5, 4, 6, 3, 7],
    description: 'A gradually rising major-key line opens above luminous held chords, then falls back into a soft lower register.' }),
  character(12, 'Rain lantern', 'Soft key ambient', 62, MAJOR, {
    tonic: [38, 41, 45], progression: [0, 5, 2, 3, 0, 6, 1, 4], voicing: [0, 2, 6, 8], hold: 2,
    theme: [2, 4, 7, 6, 3, 2, 1, 0], rhythms: [[0, 6, 12], [3, 10]], leadBars: [0, 1, 2, 4, 5, 6], pattern: [7, 15],
    pad: 'velvet-cloud', lead: 'felt-light', pluck: 'glass-seed', bass: 'velvet-floor', detail: 'metal-dust',
    bassTicks: [0], bassBars: 2, noteLength: 1.7, order: [0, 2, 1, 3, 4, 6, 5, 7],
    description: 'Quiet key droplets and small bell answers trace an uneven gentle sway above warm sixth and ninth colours.' }),
  character(13, 'Shadow sanctuary', 'Dark ambient', 38, PHRYGIAN, {
    tonic: [36, 38, 41], progression: [0, 0, 1, 0, 5, 0, 3, 0], voicing: [0, 4, 8], hold: 4,
    theme: [0, 1, 4, 0, -1, 3, 1, 0], rhythms: [[5], [13]], leadBars: [1, 4, 6], pattern: [14],
    pad: 'abyss-cloud', lead: 'organ-mist', pluck: 'reed-light', bass: 'velvet-floor', detail: 'metal-dust',
    bassTicks: [0], bassBars: 4, noteLength: 5.6, order: [0, 4, 1, 6, 5, 2, 3, 7],
    description: 'Low shadowed harmony and close semitone turns, with slow organ-like signals and sparse metallic glints.' }),
  character(14, 'Slow current', 'Pulsing ambient', 72, DORIAN, {
    tonic: [36, 38, 43], progression: [0, 0, 3, 1, 5, 5, 2, 0], voicing: [0, 4, 6], hold: 2,
    theme: [0, 4, 2, 6, 4, 1, 3, 0], rhythms: [[2, 10], [6, 14]], leadBars: [1, 2, 5, 6], pattern: [0, 4, 8, 12],
    pad: 'amber-cloud', lead: 'reed-light', pluck: 'pulse-haze', bass: 'velvet-floor', detail: 'air-spark',
    bassTicks: [0, 10], bassBars: 2, noteLength: 3.1, order: [0, 1, 6, 2, 4, 5, 3, 7],
    description: 'A soft repeating synth pulse carries drifting Dorian harmony. Long replies and quiet passages loosen the pattern.' }),
  character(15, 'Celestial garden', 'Melodic ambient', 60, LYDIAN, {
    tonic: [38, 41, 43], progression: [0, 2, 5, 3, 1, 6, 2, 0], voicing: [0, 2, 4, 8], hold: 3,
    theme: [7, 9, 4, 6, 7, 2, 4, 0], rhythms: [[0, 8, 13], [4, 11]], leadBars: [0, 2, 3, 4, 6, 7], pattern: [6, 14],
    pad: 'breath-cloud', lead: 'glass-seed', pluck: 'copper-bell', bass: 'sine-earth', detail: 'air-spark',
    bassTicks: [0], bassBars: 3, noteLength: 3.4, order: [0, 2, 1, 5, 4, 3, 6, 7],
    description: 'Small luminous melodies and airy chord layers interweave above a smooth foundation, alternating clear phrases with open space.' }),
  ...AMBIENT_ADDITIONS,
]);
