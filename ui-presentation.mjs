
const MUSIC_LABELS = Object.freeze({
  'chamber-soundscape': ['Harmonic garden', 'Layered ambient soundscapes'],
  'retro-daydream': ['Retro daydream', 'Retro and chiptune-inspired music'],
  'neon-dreams': ['Neon dreams', 'Synthwave, darkwave and retrowave'],
  'bass-music': ['Deep currents', 'Drum & bass, jungle, dubstep and UK garage'],
  'ambient-drone': ['Ambient/drone', 'Warm drones and slowly evolving textures'],
  'fantasy-journeys': ['Fantasy journeys', 'Tavern, wilderness and fantasy adventure music'],
  'game-lounge': ['Game lounge', 'Cozy game-inspired lounge music'],
  techno: ['Midnight circuit', 'Dub, minimal, acid and hypnotic techno'],
});
export const SETTINGS_SECTIONS = Object.freeze(['mix', 'sound', 'variation', 'upper']);
const MUSIC_CONTROL_HELP = Object.freeze({
  variationMinutes: 'Start a new music variation after a random time in the selected range. The music fades between variations. Off keeps the current variation.',
  varyAmount: 'Set how much the checked settings can change with each variation. A larger range makes bigger changes.',
  varyMix: 'Change the checked settings when a new variation starts. Variation range controls how much they change. Settings at 0 stay off.',
  tempo: 'The speed of the music in beats per minute (BPM). Higher values play faster.',
});
export function controlHelp(profile, control) {
  if (profile.family !== 'Music') return control.help;
  if (control.key === 'tempo' && control.label !== 'Musical pace') return control.help;
  if (profile.kind === 'retro' && control.key === 'variationMinutes')
    return 'Switch to a different musical character after a random time in the selected range. Changes fade smoothly. Off keeps the current character.';
  return MUSIC_CONTROL_HELP[control.key] ?? control.help;
}
export function profilePresentation(profile) {
  const music = MUSIC_LABELS[profile.id];
  const subtitle = music?.[1] ?? (['binaural','isochronic'].includes(profile.kind) ? profile.type + ' · ' + profile.subtitle : profile.subtitle);
  return {name: music?.[0] ?? profile.name, subtitle, type: profile.type};
}
export function controlSection(profile, control) {
  if (['style', 'scene', 'tempo', 'influence', 'palette'].includes(control.key)) return 'primary';
  if (['variationMinutes', 'varyMix', 'varyAmount'].includes(control.key)) return 'variation';
  if (control.group === 'Upper frequencies') return 'upper';
  if (['melody', 'accompaniment', 'bass', 'percussion', 'intensity', 'music', 'background', 'shimmer'].includes(control.key)) return 'mix';
  if (['Sound', 'Texture', 'Binaural layer'].includes(control.group)
    || ['brightness', 'warmth', 'ambience', 'drift', 'width', 'movement', 'pump', 'space', 'softness'].includes(control.key)) return 'sound';
  return 'mix';
}
export function settingsSections(profile) {
  const available = new Set(profile.controls.map(control => controlSection(profile, control)));
  available.add('mix');
  if (profile.kind === 'tone') available.add('sound');
  if (profile.variation || profile.rateMotion || profile.motionKeys.length) available.add('variation');
  if (profile.kind === 'soundscape') available.add('upper');
  return SETTINGS_SECTIONS.filter(section => available.has(section));
}
export function primarySectionLabel(profile) {
  return profile.family === 'Music' ? 'Mix' : ['binaural', 'isochronic', 'tone'].includes(profile.kind) ? 'Tone' : 'Sound';
}
