import { createGardenTone, sampleGardenTone } from './garden-instruments.mjs';
import { createElectronicTone, sampleElectronicTone } from './electronic-instruments.mjs';
import { createTechnoTone, sampleTechnoTone, createTechnoDrum, sampleTechnoDrum } from './techno-instruments.mjs';
import {createEnsembleTone,sampleEnsembleTone} from './journey-ensemble.mjs';

const TAU=Math.PI*2, SIZE=2048, TABLES=new Map();
const ACOUSTIC={
  'folk-harp':['harp',0.012,0.32], 'folk-lute':['pluck',0.009,0.2],
  'folk-flute':['flute',0.09,0.24], 'folk-reed':['clarinet',0.065,0.22],
  'folk-strings':['string',0.19,0.42], 'folk-bell':['celesta',0.012,0.4],
  'folk-wood':['marimba',0.008,0.18], 'folk-bass':['harp',0.035,0.28],
  'lounge-felt':['piano',0.025,0.32], 'lounge-upright':['pluck',0.025,0.22],
};
const SYNTHETIC={
  'folk-choir':{base:'choir-pad',attack:0.38,release:0.65,ceiling:2200},
  'folk-lowhorn':{base:'brass',attack:0.11,release:0.25,ceiling:1800},
  'lounge-tines':{base:'electric-keys',harmonics:[1,0.12,0.035,0.2,0.012,0.065,0.01,0.03],attack:0.012,release:0.28,ceiling:2600},
  'lounge-softsquare':{base:'hollow-lead',harmonics:[1,0.015,0.18,0.008,0.045,0.004,0.012],attack:0.028,release:0.22,ceiling:2200},
  'lounge-sub':{base:'round-bass',attack:0.025,release:0.15,ceiling:480,sub:0.8},
  'tech-dub':{base:'dub-stab',harmonics:[1,0.32,0.19,0.11,0.06,0.025,0.014,0.008],attack:0.009,release:0.19,ceiling:2300},
  'tech-chord':{base:'dub-stab',attack:0.006,release:0.15,ceiling:4600},
  'tech-click':{base:'bell-pluck',harmonics:[1,0.03,0.16,0.005,0.1,0.004,0.045],attack:0.002,release:0.055,ceiling:3800},
  'tech-reed':{base:'pulse-arp',attack:0.007,release:0.1,ceiling:3800},
  'tech-sub':{base:'round-bass',attack:0.015,release:0.13,ceiling:600,sub:0.83},
  'tech-pluck':{base:'pulse-bass',attack:0.006,release:0.08,ceiling:1400,sub:0.58},
  'tech-acid':{base:'pulse-bass',harmonics:Array.from({length:32},(_,i)=>1/(i+1)),attack:0.004,release:0.065,ceiling:4400,sub:0.08},
  'tech-grit':{base:'deep-reese',harmonics:Array.from({length:32},(_,i)=>(i%2?0.4:1)/(i+1)**0.88),attack:0.006,release:0.09,ceiling:2300,sub:0.48},
  'tech-metal':{base:'bell-pluck',harmonics:[1,0.02,0.06,0.34,0.02,0.12,0.01,0.21,0.035,0.1,0.01,0.06],attack:0.003,release:0.12,ceiling:5600},
};
export const JOURNEY_INSTRUMENTS=Object.freeze([...Object.keys(ACOUSTIC),...Object.keys(SYNTHETIC)]);
function tableFor(name, count) {
  const key=name+':'+count;
  if(TABLES.has(key))return TABLES.get(key);
  const weights=SYNTHETIC[name].harmonics.slice(0,count), total=weights.reduce((a,b)=>a+Math.abs(b),0), table=new Float32Array(SIZE+1);
  for(let n=0;n<weights.length;n++)for(let i=0;i<=SIZE;i++)table[i]+=Math.sin(TAU*(n+1)*i/SIZE)*weights[n]/total;
  TABLES.set(key,table);return table;
}
export function createJourneyTone(event,rate,duration,identity,tempo) {
  if(event.ensemblePatch)return createEnsembleTone(event,rate,duration,identity,tempo);
  if(event.technoVoice&&event.instrument.startsWith('tech-'))return createTechnoTone(event,rate,duration,identity,tempo);
  const acoustic=ACOUSTIC[event.instrument], profile=SYNTHETIC[event.instrument];
  let tone;
  if(acoustic) {
    tone={...event,rate,duration,age:0,attack:acoustic[1],release:Math.min(duration*0.4,acoustic[2]),
      gardenTone:createGardenTone(acoustic[0],event.frequency,duration,rate,Math.floor(identity*4294967295)||1)};
  } else {
    tone=createElectronicTone({...event,instrument:profile?.base??event.instrument,
      ...(profile?{attack:profile.attack,release:profile.release,cutoffCeiling:profile.ceiling,subWeight:profile.sub??0.5}:{})},rate,duration,identity);
    if(!tone)return null;
    if(profile?.harmonics)tone.table=tableFor(event.instrument,tone.count);
    if(event.instrument==='tech-acid') {tone.acid=true;tone.resLow=0;tone.resBand=0;tone.detune=1.0001;}
  }
  tone.age=-Math.round((event.delay??0)*60/tempo*rate);
  tone.journeyName=event.instrument;
  return tone;
}
export function sampleJourneyTone(tone,frame,beats,brightness,movement) {
  if(tone.ensembleTone){sampleEnsembleTone(tone,frame,beats,brightness,movement);return;}
  if(tone.technoTone){sampleTechnoTone(tone,frame,beats,brightness,movement);return;}
  const age=tone.age/tone.rate;
  if(tone.gardenTone) {
    const attack=Math.min(1,age/tone.attack), release=Math.max(0,Math.min(1,(tone.duration-age)/tone.release));
    const envelope=attack*attack*(3-2*attack)*release*release*(3-2*release);
    const sample=sampleGardenTone(tone.gardenTone,age,brightness)*envelope;
    tone.left=tone.right=sample; tone.age++;return;
  }
  if(tone.glideFrom)tone.frequencyTarget??=tone.frequency;
  
  if(tone.glideFrom)tone.frequency=tone.frequencyTarget+(tone.glideFrom-tone.frequencyTarget)*Math.exp(-age/0.065);
  sampleElectronicTone(tone,frame,beats,brightness,movement);
  if(tone.acid) {
    if(frame%32===0||tone.age===1) {
      const envelope=Math.exp(-age*(tone.accent?5:9));
      const cutoff=Math.min(tone.rate*0.12,180+brightness*2400*(0.25+movement*(0.35+envelope)));
      tone.resCoefficient=2*Math.sin(Math.PI*cutoff/tone.rate);
    }
    const input=(tone.left+tone.right)*0.5;
    const high=input-tone.resLow-(tone.accent?0.48:0.72)*tone.resBand;
    tone.resBand+=tone.resCoefficient*high; tone.resLow+=tone.resCoefficient*tone.resBand;
    const tail=Math.max(0,Math.min(1,(tone.duration-age)/0.025));
    tone.left=tone.right=Math.tanh(tone.resLow*1.6)*0.8*tail*tail;
  }
}

export function createJourneyDrum(event,rate,identity,tempo) {
  if(event.technoDrive)return createTechnoDrum(event,rate,identity,tempo);
  const kit=event.kit, techno=kit.startsWith('techno'), lounge=kit.startsWith('lounge');
  const hard=kit==='techno-hard', industrial=kit==='techno-industrial'||kit==='techno-raw';
  const kickProfile={
    'techno-dub':[46,80,21,0.21], 'techno-minimal':[49,65,27,0.17], 'techno-hypnotic':[44,95,16,0.29],
    'techno-machine':[47,110,17,0.26], 'techno-acid':[49,85,19,0.24], 'techno-deep':[43,75,14,0.32],
    'techno-industrial':[42,100,11,0.34], 'techno-raw':[46,95,12,0.31], 'techno-hard':[41,110,8,0.48],
    'techno-tribal':[50,75,22,0.22], 'techno-drive':[45,105,14,0.3], 'techno-broken':[51,90,20,0.23],
    'techno-air':[43,60,19,0.24], 'techno-groove':[48,85,19,0.25],
  }[kit];
  const durations={kick:hard?0.48:industrial?0.34:lounge?0.2:0.27,snare:lounge?0.17:0.23,clap:0.2,
    hat:0.065,'open-hat':0.22,hand:kit==='journey-battle'?0.4:0.27,tom:0.35,rim:0.075,shaker:0.09,brush:0.15,metal:0.19};
  return {...event,collectionDrum:true,rate,kickProfile,age:-Math.round((event.delay??0)*60/tempo*rate),duration:event.drum==='kick'&&kickProfile?kickProfile[3]:durations[event.drum],
    phase:0,phase2:identity,randomState:Math.floor(identity*4294967295)||1,low:0,body:0,
    lowCoefficient:1-Math.exp(-TAU*Math.min(lounge?5200:techno?8500:3800,rate*0.38)/rate),
    bodyCoefficient:1-Math.exp(-TAU*Math.min(lounge?1300:techno?2100:900,rate*0.19)/rate),
    hard,industrial,lounge,techno};
}
export function sampleJourneyDrum(voice) {
  if(voice.technoDrum)return sampleTechnoDrum(voice);
  const age=voice.age/voice.rate;
  let random=voice.randomState;random^=random<<13;random^=random>>>17;random^=random<<5;voice.randomState=random>>>0;
  const noise=voice.randomState/2147483648-1;
  voice.low+=voice.lowCoefficient*(noise-voice.low);voice.body+=voice.bodyCoefficient*(voice.low-voice.body);
  const high=voice.low-voice.body, tuning=voice.tuning??1;
  let wave,frequency=180,decay;
  if(voice.drum==='kick') {
    frequency=(voice.kickProfile?.[0]??(voice.lounge?52:46))+(voice.kickProfile?.[1]??(voice.lounge?48:100))*Math.exp(-age*45);
    wave=Math.sin(TAU*voice.phase)+high*0.035*Math.exp(-age*130);
    if(voice.hard||voice.industrial)wave=Math.tanh(wave*(voice.hard?2.8:1.9))*0.9;
    decay=Math.exp(-age*(voice.kickProfile?.[2]??(voice.lounge?21:16)));
  } else if(['hand','tom','rim'].includes(voice.drum)) {
    frequency=(voice.drum==='rim'?430:voice.drum==='tom'?105:145)*tuning*(1+0.15*Math.exp(-age*35));
    wave=Math.sin(TAU*voice.phase)*0.8+Math.sin(TAU*voice.phase2)*0.22+high*0.06*Math.exp(-age*60);
    decay=Math.exp(-age*(voice.drum==='rim'?65:voice.drum==='hand'?15:11));
  } else if(voice.drum==='snare'||voice.drum==='clap') {
    frequency=voice.lounge?172:195;
    const flutter=voice.drum==='clap'&&age<0.035?0.4+0.6*Math.sin(age*TAU*83)**2:1;
    wave=high*(voice.lounge?0.65:0.9)*flutter+Math.sin(TAU*voice.phase)*0.15;
    decay=Math.exp(-age*(voice.lounge?30:23));
  } else if(voice.drum==='metal') {
    frequency=Math.min(voice.rate*0.13,730*tuning);
    wave=high*0.45+Math.sin(TAU*voice.phase)*Math.sin(TAU*voice.phase2)*0.4;
    decay=Math.exp(-age*22);
  } else {
    frequency=550;
    wave=high*(voice.drum==='brush'?0.65:1);
    decay=Math.exp(-age*(voice.drum==='open-hat'?17:voice.drum==='brush'?25:voice.drum==='shaker'?46:68));
  }
  voice.phase=(voice.phase+frequency/voice.rate)%1;
  voice.phase2=(voice.phase2+frequency*1.47/voice.rate)%1;
  const attack=Math.min(1,age/0.002), tail=Math.max(0,Math.min(1,(voice.duration-age)/0.018));
  voice.age++;
  return wave*decay*attack*tail*voice.amplitude;
}
