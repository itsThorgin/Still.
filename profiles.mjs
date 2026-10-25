import { GUIDES } from './guides.mjs';
import { SOLFEGGIO_PITCHES } from './solfeggio.mjs';
import { RETRO_STYLES } from './retro-styles.mjs';
import { GARDEN_INFLUENCES } from './garden-influences.mjs';
import { ARRANGEMENT_OPTIONS, STRING_OPTIONS, VARIATION_OPTIONS } from './garden-options.mjs';
import { sequencePaletteControl } from './sequence-palettes.mjs';
import { ELECTRONIC_PROFILES, AMBIENT_PROFILE } from './electronic-presets.mjs';
import { JOURNEY_PROFILES } from './journey-presets.mjs';

const carrier = { key: 'base', label: 'Left-ear frequency', unit: 'Hz', min: 60, max: 1000, step: 0.1, scale: 'log', help: 'The tone sent to the left ear.' };
const difference = { key: 'beat', label: 'Frequency difference', unit: 'Hz', min: 0.5, max: 40, step: 0.1, help: 'The right tone is this much higher than the left tone.' };
const pulseControls = [
  { key: 'base', label: 'Tone frequency', unit: 'Hz', min: 80, max: 2000, step: 0.1, scale: 'log', help: 'The pitch of the audible tone.' },
  { key: 'beat', label: 'Pulse rate', unit: 'Hz', min: 0.5, max: 40, step: 0.1, help: 'The number of pulses each second.' },
  { key: 'depth', label: 'Pulse depth', unit: '%', min: 0, max: 100, step: 1, help: 'How quiet the sound becomes between pulses.' },
  { key: 'softness', label: 'Pulse softness', unit: '%', min: 10, max: 100, step: 1, help: 'Higher values smooth each pulse.' },
];

const noteLength = { key: 'length', label: 'Note length', unit: 's', min: 1, max: 12, step: 0.1, help: 'How long each new note lasts. Notes already playing keep their length.' };
const sequenceControls = (lowMin, lowMax, highMin, highMax, paceMin, paceMax) => [
  { key: 'low', label: 'Lowest tone', unit: 'Hz', min: lowMin, max: lowMax, step: 1, scale: 'log', help: 'The lowest main pitch for new notes.' },
  { key: 'high', label: 'Highest tone', unit: 'Hz', min: highMin, max: highMax, step: 1, scale: 'log', help: 'The highest main pitch for new notes. Some quieter tones may be higher than this limit.' },
  { key: 'density', label: 'Pace', unit: '/min', min: paceMin, max: paceMax, step: 1, help: 'The approximate number of new notes each minute. Timing varies gently.' },
];

function binaural(id, name, band, base, beat, description) {
  return { id, name, band, kind: 'binaural', family: 'Beats', type: 'Binaural beats', subtitle: `${beat} Hz difference`, defaults: { base, beat }, controls: [carrier, difference], headphones: true, variation: false,
    description, how: 'Each ear receives a different tone. Frequency difference sets the beat rate. Use stereo headphones with mono audio turned off.', evidence: 'Studies report mixed results. A selected beat rate does not guarantee a matching brain state or better performance.' };
}

function pulse(id, name, band, base, beat, description) {
  return { id, name, band, kind: 'isochronic', family: 'Pulses', type: 'Isochronic tones', subtitle: `${beat} pulses per second`, defaults: { base, beat, depth: 75, softness: 80 }, controls: pulseControls, headphones: false, variation: false,
    description, how: 'Tone frequency sets the pitch. Pulse rate sets the number of pulses per second. Depth sets how quiet the sound becomes between pulses. Softness smooths each pulse. Use speakers or headphones.', evidence: 'Repeating sounds can produce measurable auditory responses. Benefits for sleep, attention, or memory are not established for these presets.' };
}

export const PROFILES = [
  binaural('delta', 'Deep delta', 'DELTA', 160, 2, 'A low pair of tones with a slow 2 Hz difference. Delta activity is associated with deep sleep. Playing this sound does not mean that deep sleep will occur.'),
  binaural('theta', 'Slow theta', 'THETA', 180, 6, 'A low pair of tones with a 6 Hz difference. Theta activity occurs in several brain states, including drowsiness. This preset has no proven sleep or memory benefit.'),
  binaural('alpha', 'Open alpha', 'ALPHA', 200, 10, 'A steady pair of tones with a 10 Hz difference. Alpha is a name for an EEG frequency band often associated with relaxed wakefulness. This sound does not guarantee relaxation.'),
  binaural('beta', 'Clear beta', 'BETA', 220, 16, 'A steady pair of tones with a 16 Hz difference. Beta activity occurs during many thinking tasks. This preset is for personal listening, with no guaranteed attention benefit.'),
  binaural('low-gamma', 'Low gamma', 'GAMMA', 200, 40, 'A low pair of tones with a 40 Hz difference. This is an experimental option for focused listening. The low pitch is a comfort choice, not a validated treatment setting.'),
  pulse('delta-pulse', 'Deep delta pulse', 'DELTA', 160, 2, 'A soft tone pulsed twice each second. Adjust depth and softness for a slow listening texture.'),
  pulse('theta-pulse', 'Slow theta pulse', 'THETA', 180, 6, 'A soft tone pulsed 6 times each second. The slower rhythm is an alternative listening texture, not a sleep treatment.'),
  pulse('alpha-pulse', 'Soft alpha pulse', 'ALPHA', 220, 10, 'A soft tone pulsed 10 times each second. Adjust the depth and softness to make the rhythm more comfortable.'),
  pulse('beta-pulse', 'Clear beta pulse', 'BETA', 220, 16, 'A soft tone pulsed 16 times each second. An experimental rhythm for personal listening.'),
  pulse('gamma-pulse', 'Gamma pulse', 'GAMMA', 200, 40, 'A tone pulsed 40 times each second. This is physical volume modulation, which differs from a binaural beat.'),
  { ...pulse('solfeggio-pulse', 'Solfeggio pulse', 'PULSE', 528, 10, 'A chosen solfeggio pitch with an independent pulse rate.'),
    subtitle: 'Choose a pitch and pulse rate',
    controls: [{ ...pulseControls[0], label: 'Solfeggio pitch', min: 174, max: 963, step: 1, options: SOLFEGGIO_PITCHES, help: 'Choose the tone pitch. Pulse rate is set separately. The listed themes are symbolic associations.' }, ...pulseControls.slice(1)] },
  { id: 'warm-noise', name: 'Warm noise', band: 'TEXTURE', kind: 'noise', family: 'Textures', type: 'Filtered noise', subtitle: 'A soft, steady texture', defaults: { low: 80, high: 2400 }, controls: [
    { key: 'low', label: 'Lower filter edge', unit: 'Hz', min: 20, max: 3000, step: 1, scale: 'log', help: 'Reduces sound below this frequency. The filter edge is gradual.' },
    { key: 'high', label: 'Upper filter edge', unit: 'Hz', min: 100, max: 12000, step: 1, scale: 'log', help: 'Reduces sound above this frequency. The filter edge is gradual.' },
  ], headphones: false, variation: true, description: 'A continuous noise texture with less high-frequency energy. The filter controls change the sound gradually. Some energy remains outside the selected edges.', how: 'This sound contains many frequencies. The two filter edges shape its range. A new variation changes the noise sequence and keeps your filter settings.', evidence: 'Background sound can make tinnitus less noticeable for some people. This preset is not an individual tinnitus treatment.' },
  { id: 'gentle-sequence', name: 'Gentle sequence', band: 'TEXTURE', kind: 'sequence', family: 'Textures', type: 'Generated tone sequence', subtitle: 'Small tones, always unfolding', defaults: { palette: 0, low: 180, high: 720, density: 24, length: 7 }, controls: [
    sequencePaletteControl('sequence'),
    { key: 'low', label: 'Lowest tone', unit: 'Hz', min: 80, max: 1000, step: 1, scale: 'log', help: 'The lowest main pitch in the sequence.' },
    { key: 'high', label: 'Highest tone', unit: 'Hz', min: 160, max: 3000, step: 1, scale: 'log', help: 'The highest main pitch. Some quieter tones may be higher than this limit.' },
    { key: 'density', label: 'Pace', unit: '/min', min: 6, max: 60, step: 1, help: 'The average number of new tones each minute.' },
    noteLength,
  ], headphones: false, variation: true, description: 'Soft bell-like tones form a changing musical sequence. A small set of musical intervals keeps the sound gentle. Each tone has a smooth start and a long decay.', how: 'Frequency controls set the range of the main pitches. Higher bell harmonics add texture. A new variation changes the order and timing of the notes.', evidence: 'This is an original listening texture inspired by sound-enrichment ideas. This sequence has not been tested as a tinnitus treatment.' },
  { id: 'soft-plucks', name: 'Soft plucks', band: 'TEXTURE', kind: 'plucks', family: 'Textures', type: 'Generated plucked sequence', subtitle: 'Warm notes in quiet phrases', defaults: { palette: 0, low: 120, high: 480, density: 18, length: 3.5 }, controls: [
    sequencePaletteControl('plucks'),
    ...sequenceControls(60, 600, 120, 1600, 6, 40),
    { ...noteLength, max: 8 },
  ], headphones: false, variation: true },
  { id: 'slow-drift', name: 'Slow drift', band: 'TEXTURE', kind: 'drift', family: 'Textures', type: 'Generated sustained sequence', subtitle: 'Soft layers, slowly overlapping', defaults: { palette: 0, low: 110, high: 440, density: 8, length: 14, overlap: 65 }, controls: [
    sequencePaletteControl('drift'),
    ...sequenceControls(55, 440, 110, 1200, 3, 20).map((control) => control.key === 'density' ? { ...control, help: 'The target number of new notes per minute. Lower overlap may reduce the actual pace.' } : control),
    { ...noteLength, min: 4, max: 30 },
    { key: 'overlap', label: 'Overlap', unit: '%', min: 0, max: 100, step: 1, help: 'Higher values allow more notes to play at the same time. At 0%, notes stay separate.' },
  ], headphones: false, variation: true },
  { id: 'chamber-soundscape', name: 'Harmonic garden', band: 'MUSIC', kind: 'soundscape', family: 'Music', type: 'Evolving musical soundscape', subtitle: 'Interwoven voices, air and shimmer',
    defaults: { influence: 0, arrangements: 7, strings: 15, variationMinutes: 0, tempo: 56, brightness: 55, music: 80, background: 1, shimmer: 35, width: 66, highMix: 3, highConnection: 70, highLow: 12000, highHigh: 20000, binauralMix: 0, beat: 10 },
    controls: [
      { key: 'arrangements', label: 'Arrangement choices', unit: '', min: 1, max: 7, step: 1, group: 'Music', options: ARRANGEMENT_OPTIONS, help: 'Each variation picks one selected arrangement. Original and Resonant keep their familiar parts. Seeded ensembles also change the instruments, including organ.' },
      { key: 'strings', label: 'String sounds', unit: '', min: 0, max: 15, step: 1, group: 'Music', options: STRING_OPTIONS, help: 'Choose which sounds the string parts can use. Follow arrangement uses the normal strings for that arrangement.' },
      { key: 'variationMinutes', label: 'Automatic new variation', unit: '', min: 0, max: 60, step: 1, group: 'Music', options: VARIATION_OPTIONS, help: 'Change the music after a random time in the shown range. Fade out for 12 seconds, then fade in for 8 seconds. Volume and the listening timer stay the same. Works with Keep this variation on.' },
      { key: 'influence', label: 'Musical influence', unit: '', min: 0, max: 7, step: 1, group: 'Music', options: [{ value: 0, label: 'Automatic with each variation' }, ...GARDEN_INFLUENCES], help: 'Choose the main writing style. Each variation adds a second style. Automatic lets the seed choose both. Changes fade into the new music.' },
      { key: 'tempo', label: 'Musical pace', unit: '/min', min: 30, max: 90, step: 1, group: 'Music', help: 'The number of musical beats per minute.' },
      { key: 'brightness', label: 'Harmonic brightness', unit: '%', min: 0, max: 100, step: 1, group: 'Music', help: 'Higher values give the musical notes a brighter sound.' },
      { key: 'music', label: 'Music blend', unit: '%', min: 0, max: 100, step: 1, group: 'Music', help: 'The level of the main musical layers.' },
      { key: 'background', label: 'Background blend', unit: '%', min: 0, max: 100, step: 1, group: 'Texture', help: 'The level of continuous, softly filtered noise.' },
      { key: 'shimmer', label: 'Shimmer blend', unit: '%', min: 0, max: 100, step: 1, group: 'Texture', help: 'The level of glassy musical details, separate from the upper layer.' },
      { key: 'width', label: 'Stereo width', unit: '%', min: 0, max: 100, step: 1, group: 'Texture', help: 'How far sounds spread between the left and right channels. Binaural tones remain separate.' },
      { key: 'highMix', label: 'Upper layer blend', unit: '%', min: 0, max: 100, step: 1, group: 'Upper frequencies', help: 'The level of the upper layer. At 0%, this layer is silent.' },
      { key: 'highConnection', label: 'Musical connection', unit: '%', min: 0, max: 100, step: 1, group: 'Upper frequencies', help: 'Blend floating high tones with a supporting melody. 0% uses only floating tones; 100% uses only melody. A narrow range may leave little or no sound.' },
      { key: 'highLow', label: 'Upper layer lower limit', unit: 'Hz', min: 8000, max: 19999, step: 1, group: 'Upper frequencies', help: 'The lowest frequency for new upper-layer notes. Existing notes fade out when you change the range.' },
      { key: 'highHigh', label: 'Upper layer upper limit', unit: 'Hz', min: 8001, max: 20000, step: 1, group: 'Upper frequencies', help: 'The highest frequency for upper-layer notes, within your audio output\'s limit.' },
      { key: 'binauralMix', label: 'Binaural blend', unit: '%', min: 0, max: 100, step: 1, group: 'Binaural layer', help: 'The level of the binaural tones. At 0%, this layer is off. Use stereo headphones.' },
      { ...difference, group: 'Binaural layer' },
    ], headphones: false, variation: true },
  { id: 'retro-daydream', name: 'Retro daydream', band: 'RETRO', kind: 'retro', family: 'Music', type: 'Evolving retro music', subtitle: 'Little worlds, new melodies',
    defaults: { style: 0, variationMinutes: 0, tempo: 76, warmth: 65, melody: 15, accompaniment: 55, bass: 80, percussion: 18, ambience: 25, width: 65, drift: 25 },
    controls: [
      { key: 'style', label: 'Musical character', unit: '', min: 0, max: RETRO_STYLES.length, step: 1, group: 'Music', options: [{ value: 0, label: 'Automatic with each variation' }, ...RETRO_STYLES], help: 'Ten familiar characters and 36 new little worlds, from dry handheld tunes to spacious forest, village and nighttime music. Automatic chooses from all 46. Changes fade into the next character.' },
      { key: 'variationMinutes', label: 'Automatic character change', unit: '', min: 0, max: 60, step: 1, group: 'Music', options: VARIATION_OPTIONS.map((option) => option.value ? option : { value: 0, label: 'Off: keep this character' }), help: 'Choose a different character from all 46 after a random time in the shown range. Fade out for 12 seconds, then fade in for 8 seconds. The picker shows the new character. Volume, layer levels and the listening timer stay the same. Works with Keep this variation on. Off keeps the current character developing.' },
      { key: 'tempo', label: 'Musical pace', unit: '/min', min: 40, max: 110, step: 1, group: 'Music', help: 'The number of musical beats per minute.' },
      { key: 'melody', label: 'Melody blend', unit: '%', min: 0, max: 100, step: 1, group: 'Music', help: 'The level of the main melody and answering notes.' },
      { key: 'accompaniment', label: 'Accompaniment blend', unit: '%', min: 0, max: 100, step: 1, group: 'Music', help: 'The level of chords and repeating note patterns behind the melody.' },
      { key: 'bass', label: 'Bass blend', unit: '%', min: 0, max: 100, step: 1, group: 'Music', help: 'The level of the low bass notes.' },
      { key: 'percussion', label: 'Percussion blend', unit: '%', min: 0, max: 100, step: 1, group: 'Texture', help: 'The level of drum sounds. At 0%, percussion is off.' },
      { key: 'warmth', label: 'Warmth', unit: '%', min: 0, max: 100, step: 1, group: 'Texture', help: 'Higher values make the sound softer and less bright.' },
      { key: 'ambience', label: 'Room and ambience', unit: '%', min: 0, max: 100, step: 1, group: 'Texture', help: 'Adds the character’s room and echoes. Familiar characters retain their tape air; new characters use a quiet, noise-free room. Dry handheld characters stay dry. At 0%, the effects are off.' },
      { key: 'width', label: 'Stereo width', unit: '%', min: 0, max: 100, step: 1, group: 'Texture', help: 'How far musical sounds spread between the left and right channels. Echoes may still differ between channels.' },
      { key: 'drift', label: 'Pitch drift', unit: '%', min: 0, max: 100, step: 1, group: 'Texture', help: 'Adds small, slow changes in pitch. At 0%, pitches stay steady.' },
    ], headphones: false, variation: true },
  ...ELECTRONIC_PROFILES,
  AMBIENT_PROFILE,
  ...JOURNEY_PROFILES,
  { id: 'pure-tone', name: 'Pure tone', band: 'TONE', kind: 'tone', family: 'Tones', type: 'Sine tone', subtitle: 'One frequency, simply', defaults: { base: 160 }, controls: [
    { key: 'base', label: 'Tone frequency', unit: 'Hz', min: 20, max: 20000, step: 0.1, scale: 'log', help: 'The pitch sent equally to both channels. Do not increase volume when a tone becomes inaudible.' },
  ], headphones: false, variation: false, description: 'One steady sine tone. Use the slider to explore the pitch or type an exact frequency. Start at a low volume.', how: 'The same tone is sent to both channels. Frequency is measured in hertz, which means cycles each second.', evidence: 'This is a general tone generator. A high or low tone does not reset hearing or provide a proven treatment for anxiety or insomnia.' },
];

const noiseTemplate = PROFILES.find((profile) => profile.id === 'warm-noise');
PROFILES.splice(PROFILES.findIndex((profile) => profile.id === 'gentle-sequence'), 0,
  { ...noiseTemplate, id: 'warm-listening', name: 'Deep noise', band: 'WARM', subtitle: 'A dark, muffled texture', defaults: { low: 80, high: 1200 } },
  { ...noiseTemplate, id: 'bright-listening', name: 'Bright noise', band: 'BRIGHT', subtitle: 'A light, higher texture', defaults: { low: 2400, high: 8000 } },
);

for (const profile of PROFILES) {
  Object.assign(profile, GUIDES[profile.id]);
  profile.rateMotion = ['binaural', 'isochronic', 'soundscape'].includes(profile.kind);
  if (profile.rateMotion && profile.kind !== 'soundscape' && profile.id !== 'solfeggio-pulse') profile.how += ' Rate motion slowly varies the frequency difference or pulse rate within the range shown in the player. Turning it off returns to your chosen rate over five seconds. Tone pitch and volume stay unchanged.';
  if (profile.variation) profile.how += ' Keep this variation: Reuse this variation the next time you listen. Current playback continues unchanged. Restarting playback begins the variation again.';
  profile.motionKeys = profile.kind === 'noise' ? ['low', 'high']
    : ['sequence', 'plucks', 'drift'].includes(profile.kind) ? ['density', 'length', ...(profile.kind === 'drift' ? ['overlap'] : [])] : [];
}
PROFILES.find((profile) => profile.id === 'pure-tone').warning = 'Keep the volume low. Do not turn it up to find a tone you cannot hear. Inaudible sound can still be harmful at high levels. This is not a hearing test.';

export const getProfile = (id) => PROFILES.find((profile) => profile.id === id) ?? PROFILES.find((profile) => profile.id === 'low-gamma');

