import {sampleProductionBass,filter,tickFilter} from '../foundation/audio/bass-production-instruments.mjs';
import {sampleTechnoProductionTone,sampleTechnoProductionDrum} from '../foundation/audio/techno-production-instruments.mjs';
import {sampleDevelopmentTech} from './electronic-development-voices.mjs';
import {sampleRefinementTone} from './instrument-refinements-tone.mjs';
import {startHatChoke,sampleExpressionDrum} from './electronic-expression-voices.mjs';
import {CollectionForeground} from './collection-expression-runtime.mjs';
const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
export {startHatChoke};
export function prepareRefinementBass(v){
 const x=v.refinement;if(!x)return;
 const b=v.bassExpression;
 if(x.id===10){
  b.connect=x.connected;b.attack=.022;b.release=.13;b.sustain=.66;b.decay=Math.max(.18,v.gate*.8);
  b.decayRate=Math.exp(-1/(v.rate*b.decay));b.glide=x.glide;b.filterDecay=.32;
  v.duration=v.gate+b.release;v.release=b.release;v.fromFrequency=x.pitchFrom??undefined;v.glide=x.glide;
 }
 if(x.id===25){b.sustain=Math.max(.59,b.sustain);b.decayRate=Math.exp(-1/(v.rate*Math.max(.2,v.gate*.65)));}
 // Rubber's envelope, target pitch and phase increment are deliberately left
 // alone. All new processing below acts on its separate harmonic path.
 v.colour={...v.colour};v.refinementBaseDrive=v.drive;
}
export function sampleRefinementBass(v,frame,beats,brightness,movement){
 const x=v.refinement;if(!x){sampleProductionBass(v,frame,beats,brightness,movement);return;}
 const id=x.id,bar=beats/4,local=bar%8;
 if(frame%32===0||v.age===0){
  const developing=.25+.75*smooth((bar%128-20)/16),phrase=.5-.5*Math.cos(TAU*beats/32),
   phase=id===10?beats*.5+.06*Math.sin(TAU*beats/8):id===25?beats*.5+.18*Math.sin(TAU*beats/8)+.10*Math.sin(TAU*beats/32):beats*(bar%16<8?1:1.5)+.12*Math.sin(TAU*beats/8);
  // Rate changes in Rubber occur at 8-bar boundaries: both phase expressions
  // meet at integer cycles. The other curves integrate continuous phase.
  v.motionRate=1;v.bassExpression.motionScale=1;v.bassExpression.motionPhase=phase-beats-v.colour.colour;
  v.colour.cutoff=id===25?1050+1100*phrase:id===42?1400+2700*developing*(.35+.65*phrase):3100;
  v.drive=clamp(v.refinementBaseDrive*(id===42?1+developing*.6*(.4+.6*phrase):id===25?1.1+.30*phrase:1.03),1,2.3);
  v.refinementPressure=id===42?1-movement*developing*.23*(.5+.5*Math.sin(TAU*beats*(local<4?2:3))):id===25?.88+.12*Math.cos(TAU*beats):1-(x.pulse??0)*movement*(.5+.5*Math.cos(TAU*beats));
 }
 sampleProductionBass(v,frame,beats,brightness,movement);
 const target=v.refinementPressure??1;v.refinementGain=(v.refinementGain??target)+(target-(v.refinementGain??target))*(1-Math.exp(-1/(v.rate*.009)));
 v.left*=v.refinementGain;v.right*=v.refinementGain;
}
export function prepareRefinementUpper(v){
 if(v.refinement?.id===29){v.refinementFilterL=v.refinementFilterR=0;v.refinementDcL=v.refinementDcR=0;}
 if(v.refinement?.id===33&&v.foregroundExpression){
  Object.assign(v.foregroundExpression,{attack:.015,release:.16,decay:.78,filterLift:.82,send:1.03});
 }
}
export function finishRefinementUpper(v,frame,beats,movement){
 if(v.refinement?.id!==29)return;
 const phase=.5+.5*Math.sin(TAU*(beats*.75+.14*Math.sin(TAU*beats/8))),
  hz=700+1600*phase,coefficient=1-Math.exp(-TAU*Math.min(hz,v.rate*.25)/v.rate),hp=1-Math.exp(-TAU*180/v.rate);
 // Gentle bounded drive before a moving low-pass; the library's ceramic
 // strike/decay remains audible, with pressure rather than a new bass voice.
 v.refinementFilterL+=coefficient*(Math.tanh(v.left*1.55)/1.35-v.refinementFilterL);
 v.refinementFilterR+=coefficient*(Math.tanh(v.right*1.55)/1.35-v.refinementFilterR);
 v.refinementDcL+=hp*(v.refinementFilterL-v.refinementDcL);v.refinementDcR+=hp*(v.refinementFilterR-v.refinementDcR);
 const pressure=.79+.21*phase;
 v.left=(v.refinementFilterL-v.refinementDcL)*pressure;v.right=(v.refinementFilterR-v.refinementDcR)*pressure;
}
export function prepareRefinementTech(v){
 const x=v.refinement;if(!x)return;
 const id=x.id,profiles={
  8:{ratio:3.31,index:.34,decay:.105,cutoff:2600,drive:2.6,attack:.009,body:.17},
  9:{wave:'saw',ratio:1.007,index:0,decay:.15,cutoff:1650,drive:3.1,attack:.012,body:.26},
  40:{ratio:4.27,index:.40,decay:.07,cutoff:2400,drive:3.0,attack:.008,body:.11},
  41:{ratio:1.47,index:.48,decay:.38,cutoff:1350,drive:2.2,attack:.024,body:.40},
 },p=profiles[id];if(!p)return;
 v.refinementModel=p;v.config={...v.config,cutoff:p.cutoff,env:p.cutoff*.55,resonance:id===41?.43:.24,drive:p.drive};
 v.envRate=Math.exp(-1/(v.fs*p.decay));v.ampRate=Math.exp(-1/(v.rate*p.body));
 v.developmentExpression.attack=p.attack;
 if(id===41)v.refinementHighpass=[filter('highpass',160,.5412,v.rate),filter('highpass',160,1.3066,v.rate)];
}
export function sampleRefinementTech(v,frame,beats,brightness,movement,scene,p,machine){
 if(!v.refinementModel){
  if(machine)sampleDevelopmentTech(v,frame,beats,brightness,movement,scene,p);
  else sampleTechnoProductionTone(v,frame,beats,brightness,movement,scene,p);
  return;
 }
 sampleRefinementTone(v,frame,beats,brightness,movement,scene,p);
 // The lowered furnace carrier creates FM difference tones. Keep this metal
 // voice above the established kick/bass allocation, including its FX send.
 if(v.refinementHighpass){let mono=v.left;for(const f of v.refinementHighpass)mono=tickFilter(f,mono);v.left=v.right=mono;}
 const age=Math.max(0,(v.age-1)/v.rate),attack=smooth(age/v.developmentExpression.attack),
  id=v.refinement.id,pressure=id===40?.84+.16*Math.cos(TAU*beats*2):id===41?.93+.07*Math.sin(TAU*beats/3):1;
 v.left*=attack*pressure;v.right*=attack*pressure;
}
export function sampleRefinementPerc(v){
 const x=v.refinementPerc;if(!x)return sampleTechnoProductionDrum(v);
 let y=sampleExpressionDrum(v,sampleTechnoProductionDrum),age=(v.age-1)/v.rate;
 if(x.body){
  // A damped, pitched contact tone gives each metal palette its own weight.
  const attack=smooth(age/.002),tail=smooth((v.duration-age)/.015),body=x.id===41?.095:.045;
  y+=Math.sin(TAU*x.body*age+.13*Math.sin(TAU*x.body*1.43*age))*.09*v.amplitude*Math.exp(-age/body)*attack*tail;
 }
 const c=1-Math.exp(-TAU*Math.min(x.cutoff,v.rate*.32)/v.rate);
 v.refinementLow=(v.refinementLow??0)+c*(y-(v.refinementLow??0));
 return v.refinementLow;
}
export function prepareCollectionMachine(v,e){
 const g=e.collectionExpression;if(!g)return;
 const family=g.family,metal=['raw','industrial','tribal'].includes(family);
 v.config={...v.config,cutoff:v.config.cutoff*(metal?.83:.93),resonance:Math.max(.12,(v.config.resonance??.3)-(metal?.10:.035))};
 v.developmentExpression.attack=g.support?.010:family==='driving'?.018:family==='hard'?.006:family==='tribal'?.012:.008;
 if(!g.support)v.ampRate=Math.exp(-1/(v.rate*Math.max(metal?.045:.06,v.gate*(g.held?.82:metal?.58:.70))));
}
export class RefinementForeground extends CollectionForeground{
 add(cue,tempo){
  const count=this.scheduled;super.add(cue,tempo);if(count===this.scheduled||!cue.refinement)return;
  const v=this.voices.at(-1),id=cue.refinement.id;
  if(cue.type==='pulse'){
   v.spec={...v.spec,ceiling:id===15?950:1250,decay:id===15?.23:.19,sustain:id===15?.20:.16};
   v.releaseFrames=Math.round(this.rate*(id===15?.19:.15));
  }
  if(cue.type==='lead'){
   const woody=id===20;
   v.spec={...v.spec,ceiling:woody?1450:id===12?1700:id===15?1600:2250,
    decay:woody?1.15:1.7,sustain:woody?.43:.65,spread:woody?.0008:.0025,air:woody?.022:.009};
   v.attackFrames=Math.round(this.rate*(woody?.055:id===15?.17:.13));
   v.releaseFrames=Math.round(this.rate*(woody?.24:.34));
  }
  v.decayRate=Math.exp(-1/(this.rate*v.spec.decay));v.endFrame=v.gateFrames+v.releaseFrames;v.duration=v.endFrame/this.rate;
 }
}
