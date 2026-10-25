import {SoundGenerator} from '../foundation/audio/synth.mjs';
import {createPhraseSource} from './electronic-phrases-runtime.mjs';
import {ExpressionTechnoRuntime} from './electronic-phrases-techno-runtime.mjs';
import {CohesionForeground} from './electronic-cohesion-tone.mjs';
import {COHESION_IDS,cohesionCues} from './electronic-cohesion-plan.mjs';
import {TechnoProductionMix} from '../foundation/audio/techno-production-mix.mjs';
export class CohesionRuntime extends ExpressionTechnoRuntime{
  constructor(rate,c,seed){
    super(rate,c,seed);this.foreground=new CohesionForeground(rate,c.value,seed);
    const process=this.mix.process.bind(this.mix);
    this.mix.process=(l,r,bass,dl,dr,kick,sl,sr,p,scene,frame,beats)=>{
      const envelope=this.mix.kickEnvelope;
      this.foreground.sample(p,frame,beats,scene,envelope);
      process(l+this.foreground.left,r+this.foreground.right,bass,dl,dr,kick,sl+this.foreground.sendL,sr+this.foreground.sendR,p,scene,frame,beats);
      if(this.monitors){
        this.monitors.space.kickEnvelope=this.monitors.dry.kickEnvelope=envelope;
        if(frame%32===0||!this.dryParams)this.dryParams={...p,space:0};
        // l/r contain only the baseline air texture: original pitched events
        // were consumed without rendering. Percussion room sends are excluded.
        this.monitors.space.process(l+this.foreground.left,r+this.foreground.right,0,0,0,0,
          this.foreground.sendL+l*.5,this.foreground.sendR+r*.5,p,scene,frame,beats);
        this.monitors.dry.process(l+this.foreground.dryL,r+this.foreground.dryR,0,0,0,0,0,0,this.dryParams,scene,frame,beats);
      }
    };
  }
  add(event,tempo){if(event.drum||event.role==='bass')super.add(event,tempo);else this.serial++;}
  schedule(plan,step,events,tempo){for(const cue of cohesionCues(plan,step,events))this.foreground.add(cue,tempo);}
  get voiceCount(){return this.voices.length+this.foreground.voices.length;}
  enableMonitors(){this.monitors??={space:new TechnoProductionMix(this.rate,this.p),dry:new TechnoProductionMix(this.rate,this.p)};}
  sample(...args){super.sample(...args);if(this.monitor&&this.monitor!=='mix'){this.enableMonitors();this.left=this.monitors[this.monitor].left;this.right=this.monitors[this.monitor].right;}}
}
export function createCohesionSource(rate,kind,params,version='revised',seed=42,context='mix'){
  const isolated=context==='mix'?params:{...params,bass:0,percussion:0,...(context==='dry'?{space:0}:{})};
  if(version==='phrases')return createPhraseSource(rate,kind,isolated,'revised',seed);
  if(version==='before')return new SoundGenerator(rate,kind,isolated,seed);
  if(kind!=='techno'||!COHESION_IDS.includes(params.style))return createPhraseSource(rate,kind,params,'revised',seed);
  const source=new SoundGenerator(rate,kind,params,seed),e=source.electronic,configure=e.configureInstruments.bind(e);
  e.configureInstruments=function(){
    configure();if(!COHESION_IDS.includes(this.plan.character.value))return;
    const rt=new CohesionRuntime(rate,this.plan.character,this.rotation.seed),plan=this.plan,events=plan.events.bind(plan);
    plan.events=(step,p)=>{const original=events(step,p);rt.schedule(plan,step,original,p?.tempo??this.settings.tempo);return original;};
    if(context!=='mix'){rt.enableMonitors();rt.monitor=context;}
    this.technoProduction=rt;
  };
  e.configureInstruments();return source;
}
