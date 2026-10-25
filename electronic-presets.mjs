import { VARIATION_OPTIONS } from './garden-options.mjs';
import { electronicStyles } from './electronic-characters.mjs';
import { MIX_VARIATION_LEVELS } from './electronic-variation.mjs';
import { musicMixDefaults } from './music-mix-defaults.mjs';

export const ELECTRONIC_CHARACTERS = Object.freeze({
  synthwave: 'Midnight drive',
  bassmusic: 'Liquid skyline',
  ambient: 'Amber stillness',
  fantasy: 'Hearthside tales', lounge: 'Window seat', techno: 'Dub chambers',
});

const controls = (kind, min, max) => [
  { key: 'style', label: 'Musical character', unit: '', min: 0, max: electronicStyles(kind).length, step: 1, group: 'Music', options: [{ value: 0, label: 'Automatic with each variation' }, ...electronicStyles(kind)], help: 'Each character has its own melodies, harmony, instruments and groove. Choosing a character loads its starting pace and fades into its opening. Automatic chooses a character and its standard pace at each change. Enable pace variation to vary around that pace. Your mix, volume and timer stay in place.' },
  { key: 'variationMinutes', label: 'Automatic new variation', unit: '', min: 0, max: 60, step: 1, group: 'Music', options: VARIATION_OPTIONS, help: 'After the selected random interval, wait for a phrase ending. Each change chooses a linear fade out of 4–8 seconds, a quiet pause of 0.5–1.5 seconds and a linear fade in of 3–5 seconds. The new music starts from its opening after the pause. Works with Keep this variation on. Off keeps the current theme developing.' },
  { key: 'varyMix', label: 'Vary mix at each change', unit: '', min: 0, max: 1, step: 1, group: 'Music', toggle: true, help: 'On automatic changes and New variation, independently vary checked settings around the preset starting mix, within your selected Variation range. Zero settings stay off. Unchecked sliders keep their values; unchecked pace uses the incoming character’s standard BPM. Off keeps the mix and checkbox choices. Volume, mute, character selection and timer stay yours.' },
  { key: 'varyAmount', label: 'Variation range', unit: '', min: 0, max: 2, step: 1, group: 'Music', options: MIX_VARIATION_LEVELS, help: 'Each checked slider independently increases or decreases by a random percentage in this range, measured from the preset starting mix. Pace is measured from the incoming character’s standard BPM. Values stay inside the slider limits. Repeated variations do not drift, and zero settings stay off.' },
  { key: 'tempo', label: 'Musical pace', unit: 'BPM', min, max, step: 1, group: 'Music', help: 'Beats per minute. Changes keep the musical position. With Vary mix on, uncheck Vary to use each incoming character’s standard pace. Automatic character changes also load the standard pace when mix variation is off.' },
  { key: 'melody', label: 'Melody blend', unit: '%', min: 0, max: 100, step: 1, group: 'Music', help: 'The level of the lead melody and answering phrases.' },
  { key: 'accompaniment', label: 'Chords and arpeggios', unit: '%', min: 0, max: 100, step: 1, group: 'Music', help: 'The level of sustained chords and repeating note patterns.' },
  { key: 'bass', label: 'Bass blend', unit: '%', min: 0, max: 100, step: 1, group: 'Music', help: 'The level of the low bass, including its moving harmonics.' },
  { key: 'percussion', label: 'Drum blend', unit: '%', min: 0, max: 100, step: 1, group: 'Music', help: 'The level of kicks, snares, claps and hats. At 0%, drums are off.' },
  { key: 'brightness', label: 'Synth brightness', unit: '%', min: 0, max: 100, step: 1, group: 'Sound', help: 'Opens the synth tone. Note envelopes and slow filter movement keep developing.' },
  { key: 'movement', label: 'Filter movement', unit: '%', min: 0, max: 100, step: 1, group: 'Sound', help: 'The depth of rhythmic bass movement and slow changes in the other synths.' },
  { key: 'pump', label: 'Rhythmic breathing', unit: '%', min: 0, max: 100, step: 1, group: 'Sound', help: 'Softly lowers the synths after a kick, then lets them rise. Follows the kick pattern even with drums turned down.' },
  { key: 'space', label: 'Chorus and echo', unit: '%', min: 0, max: 100, step: 1, group: 'Sound', help: 'Adds chorus and echoes in time with the music. At 0%, both effects are off. No background noise is added.' },
  { key: 'width', label: 'Stereo width', unit: '%', min: 0, max: 100, step: 1, group: 'Sound', help: 'The spread of synths and echoes. Bass and kick stay in the centre. At 0%, both channels match.' },
];

function profile(kind, id, name, band, tempo, min, max, mix) {
  const wave = kind === 'synthwave';
  const result = { id, name, band, kind, family: 'Music', type: wave ? 'Evolving synthwave and darkwave' : 'Evolving bass music',
    subtitle: wave ? 'Synthwave, darkwave and retrowave' : 'Liquid DnB, jungle and deep dubstep', character: ELECTRONIC_CHARACTERS[kind],
    defaults: { style: 0, variationMinutes: 0, varyMix: 0, varyAmount: 0, tempo, ...musicMixDefaults(kind), ...mix },
    controls: controls(kind, min, max), headphones: false, variation: true,
    description: wave ? 'Forty-five synthwave characters: fifteen familiar originals and thirty new compositions spanning cinematic melancholy, analog night drives, dreamwave, anthems and darksynth.' : 'Fifteen bass-music characters with liquid and atmospheric drum and bass, jungle-inspired breaks, techstep and spacious half-time dubstep.',
    purpose: 'Generated instrumental music for making things, working or simply listening. Adjust each layer to your taste.',
    background: electronicStyles(kind).map((style) => `${style.label}: ${style.description}`).join(' ') + ' All instruments and drums are synthesized locally. No recorded loops are used.',
    how: 'Choose a musical character or let Automatic choose one for each variation. Manual character selection loads its starting pace; adjust pace afterwards if you prefer. Your mix, seed, volume and timer stay in place. Character edits fade out for one second and in over two seconds. Sixteen-note themes develop through eight eight-bar sections. Each character has its own arrangement and phrase development. Adjust the musical layers and sound controls. Automatic new variation waits for an eight-bar phrase ending after the selected random interval, fades out over four beats, starts a fresh seed, then fades in over four beats. It keeps your selected character, or chooses from all fifteen in Automatic. With Vary mix at each change off, it keeps your pace and mix. When enabled, related layer balances, restrained tone and effects, and a pace near the starting pace for the incoming character are applied at silence. Zero settings stay off. Turning the mix toggle off retains the latest mix. Turning it off during a fade lets that change finish. New variation uses the normal short player fade and also refreshes the mix when the toggle is On, even without an automatic interval. The sliders show the incoming settings. Volume and the listening timer stay in place.',
    evidence: 'This is original generated music. This preset has not been tested for health, sleep or concentration effects.',
    references: ['Generated by this app.'],
  };
  if (wave) result.how = result.how.replace('chooses from all fifteen in Automatic', 'chooses from all forty-five in Automatic')
    + ' The thirty new characters have original 64-bar songs, three for each of ten production directions, with returning themes, contrasting replies, voice-led harmony, drum fills and evolving layers. They use new analog-style voices, punchier synthesized drum machines, chorus, filtered delay, atmospheric reverb and kick-driven breathing. The original fifteen retain their familiar music. Vary checkboxes and the master switch apply to every character.';
  result.how = result.how
    .replace('Automatic new variation waits for an eight-bar phrase ending after the selected random interval, fades out over four beats, starts a fresh seed, then fades in over four beats.',
      'Automatic new variation waits for an eight-bar phrase ending after the selected random interval. Each change independently chooses a linear fade out of 4–8 seconds, a quiet pause of 0.5–1.5 seconds and a linear fade in of 3–5 seconds. The new score starts from its opening after the pause.');
  return result;
}

export const ELECTRONIC_PROFILES = [
  profile('synthwave', 'neon-dreams', 'Neon dreams', 'SYNTHWAVE', 100, 70, 130, {}),
  profile('bassmusic', 'bass-music', 'Bass music', 'BASS MUSIC', 170, 130, 180, { melody: 45, movement: 55, pump: 25, space: 30 }),
];
ELECTRONIC_PROFILES[1].how+=' Drum and bass characters combine a clean, centred sub with moving upper bass harmonics, defined kick/snare anchors, quiet ghost strokes, four-bar drum answers and occasional tom or cymbal transitions. Melodic attacks leave room around the main backbeats. Half-time dubstep characters keep their spacious sub phrases and beat-three snare.';
ELECTRONIC_PROFILES[1].description='Forty-five bass music characters spanning dancefloor, jump-up, neurofunk, liquid and atmospheric DnB, jungle, deep and heavy dubstep, melodic dubstep, UK garage, speed garage and bassline.';
ELECTRONIC_PROFILES[1].subtitle='Drum and bass, jungle, dubstep and UK garage';
ELECTRONIC_PROFILES[1].how='Choose one of forty-five characters or let Automatic choose with each variation. The original thirty names and saved choices remain available with reworked music. Each character has composed bass calls and responses, its own groove, sound design and 128-bar arrangement. Dancefloor and heavy styles build towards drops; liquid, atmospheric and garage styles develop through flowing changes. Bass and kick stay centred, while upper bass, harmony and filtered ambience can spread out. Rhythmic breathing controls kick-driven bass ducking, including when drums are turned down. Chorus and echo controls filtered delay and room ambience; at zero these sends are dry. Manual character choices load their starting pace, fade out for one second and into the new opening over two seconds. Automatic changes wait for a phrase ending, fade out over 4–8 seconds, pause for 0.5–1.5 seconds and fade in over 3–5 seconds. The seed is repeatable in this engine version. Vary mix changes only checked settings, preserving zero layers; volume, mute and the listening timer stay yours.';
ELECTRONIC_PROFILES[1].how=ELECTRONIC_PROFILES[1].how.replace('128-bar arrangement','96- or 128-bar arrangement')+' Dubstep often uses a half-time pulse: 140 BPM can feel like 70. Rubber alley uses a fixed 174 BPM; the other characters allow live pace changes.';

export const AMBIENT_PROFILE = profile('ambient', 'ambient-drone', 'Ambient/drone', 'AMBIENT', 48, 32, 80,
  { melody: 42, accompaniment: 65, bass: 65, percussion: 0, brightness: 45, movement: 55, pump: 12, space: 55, width: 80 });
Object.assign(AMBIENT_PROFILE, {
  type: 'Evolving ambient and drone', subtitle: 'Warm drones, distant notes and slow movement',
  description: 'Thirty-nine ambient characters with organic air, cold space, faded memories, empty rooms, vocal overtones and intimate piano fragments.',
  how: 'Choose one of thirty-nine characters or let Automatic choose with each variation. Each has its own harmony, note spacing, sound palette and evolving form. A complete form has eight four-bar scenes, with later seeded development. Character choices load their starting pace and use a quick one-second fade out and two-second fade in. New variation uses a short crossfade. Automatic new variation starts Off; when enabled it waits for a phrase ending, independently chooses a linear fade out of 4–8 seconds, a quiet pause of 0.5–1.5 seconds and a linear fade in of 3–5 seconds. A fresh opening starts after the pause. Vary mix at each change works with automatic changes and the New variation button, including while stopped. Zero settings remain off, other mix sliders move by at most ten points and incoming pace stays within three BPM of the character starting pace. With mix variation Off, pace and mix stay yours. Keep this variation, volume, mute and the listening timer work as in the other music presets. All sound is synthesized locally. The additional characters use staggered drones, air and room textures, modal bowls and strings, shifting vocal harmonics, worn tape and soft piano. These are synthesized impressions, without field recordings.',
});
const ambientLabels = { tempo: ['Evolution pace', 'How quickly the long phrases and harmonic scenes unfold.'],
  melody: ['Distant notes', 'The foreground notes and melodic replies.'],
  accompaniment: ['Drone layers', 'The sustained harmonic layers and interlocking patterns.'],
  bass: ['Low foundation', 'The sustained low tones.'], percussion: ['Soft details', 'Sparse synthesized sparkles, bowl strokes and tiny tonal accents. At 0%, these details are off. Air and room textures belong to Drone layers.'],
  brightness: ['Tonal brightness', 'Opens the harmonic colour of the sounds.'],
  movement: ['Slow movement', 'Adds slow filter changes and gentle changes in the individual layers.'],
  pump: ['Gentle breathing', 'Adds a small, slow rise and fall to the mix. At 0%, this breathing is off.'],
  space: ['Chorus and echo', 'Adds soft stereo chorus and echoes. At 0%, both are off.'] };
AMBIENT_PROFILE.controls = AMBIENT_PROFILE.controls.map(c => ambientLabels[c.key]
  ? { ...c, label: ambientLabels[c.key][0], help: ambientLabels[c.key][1] } : c);

export { profile as createMusicProfile };
