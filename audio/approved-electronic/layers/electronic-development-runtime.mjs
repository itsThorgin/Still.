import {SoundGenerator} from '../foundation/audio/synth.mjs';
import {TechnoProductionRuntime} from '../foundation/audio/techno-production-runtime.mjs';
import {createCohesionSource} from './electronic-cohesion-runtime.mjs';
import {CohesionForeground} from './electronic-cohesion-tone.mjs';
import {DevelopmentBassRuntime} from './electronic-development-bass-runtime.mjs';
import {DevelopmentTechnoRuntime} from './electronic-development-techno-runtime.mjs';
import {approved,developmentPolicy,developEvents,developmentCues,developmentMode} from './electronic-development-plan.mjs';
class TonalRuntime extends TechnoProductionRuntime{
  constructor(rate,c,seed){
    super(rate,c,seed);this.foreground=new CohesionForeground(rate,developmentMode(this.p.family),seed^c.value*811);
    const process=this.mix.process.bind(this.mix);
    this.mix.process=(l,r,bass,dl,dr,kick,sl,sr,p,scene,frame,beats)=>{
      this.foreground.sample(p,frame,beats,scene,this.mix.kickEnvelope);
      process(l+this.foreground.left,r+this.foreground.right,bass,dl,dr,kick,sl+this.foreground.sendL,sr+this.foreground.sendR,p,scene,frame,beats);
    };
  }
  add(e,tempo){if(e.drum||e.role==='bass')super.add(e,tempo);else this.serial++;}
  schedule(plan,step,events,tempo){for(const cue of developmentCues(plan,step,events))this.foreground.add(cue,tempo);}
  get voiceCount(){return this.voices.length+this.foreground.voices.length;}
}
export function createDevelopmentSource(rate,kind,params,version='revised',seed=42,context='mix'){
  const p=context==='mix'?params:{...params,bass:0,percussion:0,...(context==='dry'?{space:0}:{})};
  // Accepted five are always delegated, including Automatic when it selects one.
  const source=new SoundGenerator(rate,kind,p,seed);
  if(!source.electronic||!['bassmusic','techno'].includes(kind))return source;
  const e=source.electronic,initial=e.plan.character;
  if(approved(kind,initial.value))return createCohesionSource(rate,kind,{...p,style:initial.value},'revised',seed,context);
  if(version==='before'||developmentPolicy(kind,initial).action==='preserve')return source;
  const configure=e.configureInstruments.bind(e);
  e.configureInstruments=function(){
    configure();const plan=this.plan,c=plan.character,policy=developmentPolicy(kind,c);
    if(['preserve','approved'].includes(policy.action))return;
    const rt=kind==='bassmusic'?new DevelopmentBassRuntime(rate,c,this.rotation.seed):policy.action==='cohesion'?new TonalRuntime(rate,c,this.rotation.seed):new DevelopmentTechnoRuntime(rate,c,this.rotation.seed);
    const original=plan.developmentOriginal??plan.events.bind(plan);plan.developmentOriginal=original;
    plan.events=(step,...args)=>{const events=original(step,...args);if(rt.schedule)rt.schedule(plan,step,events,this.settings.tempo);return developEvents(plan,kind,step,events);};
    const add=rt.add.bind(rt);rt.add=(event,tempo)=>{rt.onsetBeat=this.nextStepBeat;if(event.developmentOmit){rt.serial++;return;}add(event,tempo);};
    if(kind==='bassmusic')this.bassProduction=rt;else this.technoProduction=rt;
  };
  e.configureInstruments();return source;
}
