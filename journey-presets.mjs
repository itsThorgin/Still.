import { createMusicProfile } from './electronic-presets.mjs';
import { FANTASY_SCENES } from './journey-characters.mjs';

function make(kind,id,name,band,tempo,min,max,mix,description,subtitle) {
  const p=createMusicProfile(kind,id,name,band,tempo,min,max,mix);
  Object.assign(p,{type:'Evolving '+name.toLowerCase(),subtitle,description,
    purpose:'Original generated instrumental music for gaming, making things or listening. Adjust the layers to leave room for conversation.'});
  return p;
}
const fantasy=make('fantasy','fantasy-journeys','Fantasy journeys','FANTASY',88,48,144,
  {melody:42,accompaniment:45,bass:48,percussion:30,brightness:48,movement:30,pump:0,space:42,width:72},
  'Fifteen folk and cinematic scenes with plucked strings, flutes, reeds, bowed tones and hand percussion, from tavern rest to combat.',
  'Taverns, wilderness, mystery and adventure');
Object.assign(fantasy.defaults,{scene:1,intensity:35});
fantasy.controls.splice(1,0,
  {key:'scene',label:'Scene',unit:'',min:1,max:5,step:1,group:'Music',options:FANTASY_SCENES,
    help:'Automatic chooses only from this scene, keeping settlement, travel, mystery, dungeon and combat music separate. Changing scene selects Automatic and loads its opening pace. Choosing a named character sets its matching scene.'},
  {key:'intensity',label:'Intensity',unit:'%',min:0,max:100,step:1,group:'Music',
    help:'Controls rhythmic activity and hand-percussion entrances within the chosen scene. Low values leave more room; higher values add movement and fills. Your layer sliders stay as chosen.'});
const labels={accompaniment:['Strings and plucks','Supporting strings, harp and lute figures.'],percussion:['Hand percussion','Frame drums, wooden taps and low hand drums.'],
  brightness:['Instrument brightness','Shapes the brightness of the pitched instruments.'],movement:['Tone movement','Slow changes in the supporting synth colours.']};
fantasy.controls=fantasy.controls.map(c=>labels[c.key]?{...c,label:labels[c.key][0],help:labels[c.key][1]}:c);
const lounge=make('lounge','game-lounge','Game lounge','LOUNGE',84,60,115,
  {melody:30,accompaniment:52,bass:64,percussion:38,brightness:48,movement:30,pump:12,space:28,width:70},
  'Fifteen relaxed gaming grooves with soft keys, rounded bass, brushed and electronic drums, from cosy jazz colours to futuristic downtempo.',
  'Cosy keys, mellow beats and late-night grooves');
fantasy.description='Seventy-five folk and cinematic characters, fifteen in each scene, with recurring themes, clear cadences and coordinated acoustic ensembles.';
fantasy.how='Choose a scene and character. Automatic stays within the selected scene. Each character has a 64-bar form with themes, replies, contrast and a closing phrase. Intensity changes rhythmic activity. Layer sliders control the instruments. Manual changes fade out for one second and in for two seconds. Automatic changes wait for a phrase ending, then fade out, pause and start a new opening. Vary mix changes checked settings within the selected range and keeps zero layers off. Keep this variation reuses the seed. Volume, mute and timer stay in place. All instruments are synthesized locally.';
lounge.description='Thirty relaxed lounge characters with soft keys, plucked replies, warm chords, rounded bass and quiet drums.';
lounge.how='Choose a character or let Automatic choose with each variation. Melodies and replies leave space for the chords and bass. Layer sliders adjust the mix. Manual changes load the starting pace and fade out for one second and in for two seconds. Automatic changes wait for a phrase ending, then fade out, pause and start a new opening. Vary mix changes checked settings within the selected range and keeps zero layers off. Keep this variation reuses the seed. Volume, mute and timer stay in place. All instruments are synthesized locally.';
const techno=make('techno','techno','Techno','TECHNO',132,90,165,
  {melody:46,accompaniment:42,bass:74,percussion:78,brightness:62,movement:60,pump:62,space:28,width:72},
  'Thirty techno characters spanning deep dub, minimal pulses, polymetric percussion, broken kicks, swung grooves, acid sequences and heavier low machine patterns.',
  'Dub, minimal, acid, hypnotic and heavier techno');
techno.description='Forty-five techno characters spanning dub, minimal, acid, hypnotic, Detroit, warehouse, industrial, hard/rave, driving, melodic, atmospheric and tribal music.';
techno.how='Choose a character or let Automatic choose with each variation. Dub uses chord echoes, minimal leaves gaps, acid uses accents and slides, and hypnotic styles use repeating percussion cycles. Bass and kick stay centred. Use the layer, filter and effects controls to adjust the mix. Manual changes load the starting pace and fade out for one second and in for two seconds. Automatic changes wait for a phrase ending, fade out for 4 to 8 seconds, pause for 0.5 to 1.5 seconds and fade in for 3 to 5 seconds. Vary mix changes checked settings within the selected range and keeps zero layers off. Keep this variation reuses the seed. Volume, mute and timer stay in place. All sound is synthesized locally.';
const productionHelp={melody:'The cyclic synth motif or expressive lead. Minimal and percussive styles use short patterns and deliberate rests.',
  accompaniment:'Filtered chords, atmospheric pads and sparse texture layers. Acid and some minimal characters leave this layer silent.',
  bass:'Mono low notes or the accented sliding acid sequence. Rumble belongs to Drum blend.',
  space:'Tempo-synchronized filtered dub delay and dark reverb. At zero the sends are dry. Kick and bass stay outside the stereo effects.',
  percussion:'Kick, hats, claps, tuned percussion and character-specific mono rumble. At zero these layers are silent.'};
techno.controls=techno.controls.map(c=>productionHelp[c.key]?{...c,help:productionHelp[c.key]}:c);
export const JOURNEY_PROFILES=Object.freeze([fantasy,lounge,techno]);
