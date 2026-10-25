import { electronicStyles, ELECTRONIC_KINDS } from './electronic-characters.mjs';
import { RETRO_STYLES } from './retro-styles.mjs';

const RETRO_MOODS = [
  'Village-game nostalgia with gentle square-wave melodies and a simple walking bass.',
  'Dreamlike game exploration with floating melodies and open, unhurried harmony.',
  'Playful chiptune with skipping melodies and a light, sunny pulse.',
  'Pastoral adventure music with lilting themes and a steady sense of travel.',
  'A quiet game café with mellow chords and soft, night-time melodic replies.',
];
const GARDEN = [
  ['Bach','Baroque counterpoint: interlocking lines and quietly moving harmony.'],
  ['Mozart','Classical clarity: balanced phrases, light melodies and graceful answers.'],
  ['Vivaldi','Baroque string energy: repeating figures and flowing melodic sequences.'],
  ['Beethoven','Motivic development: firm gestures growing into broader, warmer phrases.'],
  ['Chopin','Romantic piano lyricism: singing melodies and gently shifting harmony.'],
  ['Smetana','Bohemian landscape music: flowing themes and folk-shaped rhythmic turns.'],
  ['Paganini','Violin virtuosity: agile string figures and expressive melodic flourishes.'],
];
function firstThought(text) {
  const clean = (text ?? '').trim();
  const first = clean.match(/^.*?[.!?](?:\s|$)/)?.[0].trim() ?? clean;
  return first.length <= 220 ? first : first.slice(0, 217).replace(/\s+\S*$/, '') + '…';
}
export function musicAbout(profile) {
  if (profile.kind === 'soundscape') return GARDEN.map(([name,inspiration]) => ({name,inspiration}));
  if (profile.kind === 'retro') return RETRO_STYLES.map(c => ({
    name:c.label,
    inspiration:c.value <= 10 ? RETRO_MOODS[(c.value - 1) % 5] + (c.value > 5 ? ' A softer, clearer sound palette.' : '')
      : `${firstThought(c.description)} Inspired by ${c.reference}.`,
  }));
  if (!ELECTRONIC_KINDS.includes(profile.kind)) return [];
  return electronicStyles(profile.kind).map(c => ({
    name:c.label,
    inspiration:`${c.genre} · ${firstThought(c.description)}`,
  }));
}
