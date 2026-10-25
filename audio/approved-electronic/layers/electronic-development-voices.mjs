import {sampleBassForeground,smooth} from './electronic-expression-voices.mjs';
import {sampleInstrumentVoice} from '../foundation/audio/instrument-library.mjs';
import {sampleTechnoProductionTone} from '../foundation/audio/techno-production-instruments.mjs';
export {sampleBassForeground};
export function prepareDevelopmentBass(v,c,tempo,onset){
  if(v.role==='bass')return;
  if(c.value===20&&!v.development)return;
  const family=c.bassProduction.family,g=v.development??{},pad=v.pad,type=g.type,
    x=v.foregroundExpression={onset,id:c.value,gate:v.duration,u:.5,lastGain:0,startGain:0,retireAge:null,pitchAge:0,
      pad:!!pad,struck:false,filterLift:.94,send:g.answer?1.12:.9,peak:1,attack:.012,release:.12,decay:.65,sustain:0};
  if(v.instrumentVoice){x.library=true;delete v.foregroundExpression;v.developmentExpression=x;return;}
  const stab=v.name==='dub-stab',keys=['electric-keys','dark-keys'].includes(v.name),bell=['bell-pluck','glass-lead'].includes(v.name);
  x.struck=stab||keys||bell;
  if(pad){x.attack=family==='atmospheric'?.24:.16;x.release=.45;x.decay=8;x.sustain=.80;x.peak=.94;}
  else if(stab){x.attack=.007;x.release=Math.min(.045,x.gate*.27);x.decay=.11;x.sustain=.01;x.filterLift=g.answer?1.04:.88;}
  else if(keys||bell){x.attack=keys?.010:.012;x.release=Math.min(x.gate*.32,.16);x.decay=keys?.63:family==='atmospheric'?.44:.30;x.filterLift=g.first?1.02:.87;}
  else{
    x.attack=family==='dancefloor'?.022:family==='atmospheric'?.055:.025;
    x.release=Math.min(.16,x.gate*.32);v.duration=x.gate+x.release;
    x.decay=family==='dancefloor'?.43:.65;x.sustain=family==='dancefloor'?.35:.42;
    x.vibrato=g.answer&&x.gate>.45?2.2:0;x.filterLift=family==='dancefloor'?.90:.84;
  }
  x.attack=Math.min(x.attack,x.gate*.2);
}
export function sampleDevelopmentLibrary(v,frame,beats,brightness,movement){
  sampleInstrumentVoice(v,frame,beats,brightness,movement);
  const x=v.developmentExpression,pressure=.95+.05*Math.sin(Math.PI*((beats%32)/32));
  // Keep the library's own envelopes and morphing. This is phrase pressure,
  // not a second attack/release envelope on an already evolving patch.
  const gain=pressure*(1+movement*.025*Math.sin(2*Math.PI*beats/16));
  v.left*=gain;v.right*=gain;x.lastGain=gain;
}
export function prepareDevelopmentTech(v){
  if(v.role==='bass')return;
  const d=v.development??{},pressure=d.pressure??.8;
  v.config={...v.config,cutoff:v.config.cutoff*(.84+.18*pressure),env:(v.config.env??800)*(.80+.20*pressure)};
  v.ampRate=Math.exp(-1/(v.rate*(v.patch==='pad'?12:v.patch==='chord'?.23+(d.ending?.08:0):v.config.gate*(.70+.18*pressure))));
  v.developmentExpression={attack:v.patch==='pad'?.22:v.patch==='chord'?.008:.0045,send:d.ending?1.15:.9};
}
export function sampleDevelopmentTech(v,...args){
  sampleTechnoProductionTone(v,...args);
  if(v.role==='bass')return;
  const x=v.developmentExpression,age=Math.max(0,(v.age-1)/v.rate),shape=smooth(age/x.attack);
  v.left*=shape;v.right*=shape;
}
