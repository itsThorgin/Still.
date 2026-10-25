import { electronicStyles, ELECTRONIC_KINDS } from './electronic-characters.mjs';
import { RETRO_STYLES } from './retro-styles.mjs';

const BASS_ADDITIONS = [
  'Playful UK garage with shuffled drums, elastic bass and bright rooftop energy.',
  'Velvet two-step garage with rounded low notes and spacious, late-night chords.',
  'After-hours speed garage with a pulling bass groove and clipped rhythmic replies.',
  'Northern bassline bounce with springy low hooks and skipping drums.',
  'Euphoric dancefloor DnB with rising harmony and a broad, luminous drop.',
  'Driving dancefloor DnB built around forward bass momentum and bright melodic replies.',
  'Colourful dancefloor DnB with a quick running motif and an uplifting return.',
  'Night-drive dancefloor DnB with a rolling low groove and electric chord flashes.',
  'Cinematic dancefloor DnB with wide horizons, patient builds and a weighty return.',
  'Propulsive dancefloor DnB with warm melodic lift and an accelerating feel.',
  'Jump-up DnB with punchy brass-like bass calls and a compact bouncing groove.',
  'Elastic jump-up DnB with rounded bass answers and playful rhythmic gaps.',
  'Industrial neurofunk with precise machine rhythms and dark, shifting bass phrases.',
  'Heavy half-time dubstep with fractured bass calls, strong impacts and dramatic gaps.',
  'Melodic dubstep with warm harmony, half-time drums and an expansive emotional release.',
];
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
  const clean = (text ?? '').split(' Reworked with ')[0].trim();
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
    inspiration:profile.kind === 'bassmusic' && c.value >= 31 ? BASS_ADDITIONS[c.value - 31]
      : `${c.genre} · ${firstThought(c.description)}`,
  }));
}
