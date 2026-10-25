import {createMovingLead,triggerMovingLead,sampleMovingLead} from './techno-lead.mjs';
import {createInstrumentPart,triggerInstrumentPart,sampleInstrumentPart,releaseInstrumentPart} from './instrument-library.mjs';
const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const COLOURS={
  warm:{mode:'resonant',colour:0.52,depth:0.65,resonance:1.7,drive:0.8,ceiling:2100},
  hollow:{mode:'pulse',colour:0.42,depth:0.55,resonance:1.9,drive:0.64,ceiling:1800},
  dub:{mode:'resonant',colour:0.44,depth:0.35,resonance:2.5,drive:0.8,ceiling:1700},
  glass:{mode:'resonant',colour:0.5,depth:0.4,resonance:2,drive:0.6,ceiling:1800},
  air:{mode:'wide',colour:0.42,depth:0.65,resonance:1.5,drive:0.65,ceiling:2300},
};
export function createTechnoPart(rate,colour,identity,profile,patch) {
  const p=COLOURS[colour];if(!p)throw Error('Unknown techno colour');
  if(patch)return Object.assign(createInstrumentPart(rate,patch,identity),{
    voiceColour:colour,softL:0,softR:0,soft2L:0,soft2R:0,band:'body'});
  const motion={...profile,colour:profile.colour*p.colour,depth:profile.depth*p.depth,
    resonance:profile.resonance*p.resonance,drive:profile.drive*p.drive,
    release:profile.release*(colour==='air'?1.4:colour==='dub'?0.75:1)};
  const mode=colour==='warm'&&profile.mode==='wide'?'wide':p.mode;
  return Object.assign(createMovingLead(rate,mode,identity,motion),{
    voiceColour:colour,ceiling:p.ceiling,partStart:0,softL:0,softR:0,soft2L:0,soft2R:0,
    glassPhase:identity,glassModPhase:(identity+0.17)%1,glassLow:0});
}
export function triggerTechnoPart(v,event,frame,tempo) {
  if(v.libraryPart){v.band=event.leadBand??'body';triggerInstrumentPart(v,event,frame,tempo);return;}
  v.partStart=frame+Math.round((event.delay??0)*60/tempo*v.rate);
  v.voiceRatios=v.voiceColour==='dub'?event.chordRatios??[1,1.189207,1.498307]:undefined;
  triggerMovingLead(v,event,frame,tempo);
}
export function sampleTechnoPart(v,frame,beats,brightness,movement) {
  if(v.libraryPart){
    sampleInstrumentPart(v,frame,beats,brightness,movement);
    // Timbre auditioning is intentionally broad. In the techno arrangement,
    // put the instrument back behind a smooth genre-specific tone ceiling.
    if(frame%32===0||v.softCoefficient===undefined){
      const ceiling=v.band==='accent'?1250:750;
      v.softCoefficient=1-Math.exp(-TAU*Math.min(v.rate*0.3,ceiling*(0.65+clamp(brightness,0,1)*0.35))/v.rate);
    }
    v.softL+=v.softCoefficient*(v.left-v.softL);v.softR+=v.softCoefficient*(v.right-v.softR);
    v.soft2L+=v.softCoefficient*(v.softL-v.soft2L);v.soft2R+=v.softCoefficient*(v.softR-v.soft2R);
    v.left=v.soft2L;v.right=v.soft2R;return;
  }
  // Sleeping instruments do not keep processing after the release. Their
  // oscillator/filter state is retained for the next phrase, not recreated.
  if(frame>v.gateEnd+v.rate*2&&v.envelope<1e-7&&!v.queue.length){v.left=v.right=0;return;}
  sampleMovingLead(v,frame,beats,brightness,movement);
  const age=Math.max(0,(frame-v.partStart)/v.rate);
  if(v.voiceColour==='glass'&&v.noteCount) {
    const index=(0.55+movement*0.5)*Math.exp(-age/0.11);
    const wave=Math.sin(TAU*v.glassPhase+Math.sin(TAU*v.glassModPhase)*index);
    const gain=v.envelope*v.level*Math.exp(-age/0.22)*0.78;
    v.left=v.right=wave*gain;
    v.glassPhase=(v.glassPhase+v.frequency/v.rate)%1;
    v.glassModPhase=(v.glassModPhase+v.frequency*2.002/v.rate)%1;
  } else if(v.voiceColour==='dub') {
    const struck=Math.exp(-age/0.19);v.left*=struck;v.right*=struck;
  }
  if(frame%32===0||v.softCoefficient===undefined)
    v.softCoefficient=1-Math.exp(-TAU*Math.min(v.rate*0.3,v.ceiling*(0.5+clamp(brightness,0,1)*0.5))/v.rate);
  v.softL+=v.softCoefficient*(v.left-v.softL);v.softR+=v.softCoefficient*(v.right-v.softR);
  v.soft2L+=v.softCoefficient*(v.softL-v.soft2L);v.soft2R+=v.softCoefficient*(v.softR-v.soft2R);
  v.left=v.soft2L;v.right=v.soft2R;
}
export function releaseTechnoPart(v,frame){
  if(v.libraryPart)releaseInstrumentPart(v,frame);
  else v.gateEnd=Math.min(v.gateEnd,frame);
}
