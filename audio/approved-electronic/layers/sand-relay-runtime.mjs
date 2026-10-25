import {SoundGenerator} from '../foundation/audio/synth.mjs';
import {TechnoProductionRuntime} from '../foundation/audio/techno-production-runtime.mjs';
import {createDevelopmentSource} from './electronic-development-runtime.mjs';
import {CohesionForeground} from './electronic-cohesion-tone.mjs';
import {sandRelayCues} from './sand-relay-plan.mjs';
export class SandForeground extends CohesionForeground{
  constructor(rate,seed){super(rate,7,seed^0x5a4d26);this.glide=1-Math.exp(-1/(rate*.12));this.connections=0;}
  add(cue,tempo){
    const count=this.scheduled,previous=this.lead;
    super.add({...cue,connect:false},tempo);if(this.scheduled===count)return;
    const v=this.voices.at(-1);
    v.pendingConnect=cue.type==='lead'&&cue.connect;v.previousLead=v.pendingConnect?previous:null;
    if(cue.type==='lead'){
      v.spec={...v.spec,decay:2.6,sustain:.72,ceiling:2100,spread:.0032,remove:.11};
      v.attackFrames=Math.round(this.rate*(v.connected?.065:.18));v.releaseFrames=Math.round(this.rate*.50);
    }else if(cue.type==='pulse'){
      v.spec={...v.spec,decay:.24,sustain:.08,ceiling:750,remove:.09};
      v.attackFrames=Math.round(this.rate*.055);v.releaseFrames=Math.round(this.rate*.18);
    }else{
      v.spec={...v.spec,decay:12,sustain:.80,ceiling:1200};v.attackFrames=Math.round(this.rate*.95);
    }
    v.decayRate=Math.exp(-1/(this.rate*v.spec.decay));v.endFrame=v.gateFrames+v.releaseFrames;v.duration=v.endFrame/this.rate;
  }
  sample(...args){
    // The swung bass anchor can delay the incoming note. Keep the old voice
    // sounding until that actual onset, then transfer its state at that sample.
    for(const v of this.voices){
      if(v.age!==0||!v.pendingConnect)continue;v.pendingConnect=false;
      const old=v.previousLead;v.previousLead=null;if(!old||old.age>=old.endFrame)continue;
      const ratio=old.frequencyNow/v.frequency;
      if(old.age-old.gateFrames<this.rate*.16&&old.gain>.015&&ratio>.66&&ratio<1.5){
        for(const key of ['phase','phase2','phase3','filterL','filterR','filter2L','filter2R','hpL','hpR','coefficient','coefficientStep'])v[key]=old[key];
        v.frequencyNow=old.frequencyNow;v.startGain=old.gain*old.amplitude/v.amplitude;v.connected=true;v.attackFrames=Math.round(this.rate*.065);
        old.endFrame=old.age;this.connections++;
      }
    }
    super.sample(...args);
  }
}
export class SandRelayRuntime extends TechnoProductionRuntime{
  constructor(rate,c,seed){
    super(rate,c,seed);this.foreground=new SandForeground(rate,seed);
    const process=this.mix.process.bind(this.mix);
    this.mix.process=(l,r,bass,dl,dr,kick,sl,sr,p,scene,frame,beats)=>{
      this.foreground.sample(p,frame,beats,scene,this.mix.kickEnvelope);
      process(l+this.foreground.left,r+this.foreground.right,bass,dl,dr,kick,sl+this.foreground.sendL,sr+this.foreground.sendR,p,scene,frame,beats);
    };
  }
  add(e,tempo){if(e.drum||e.role==='bass')super.add(e,tempo);else this.serial++;}
  schedule(plan,step,events,tempo){for(const c of sandRelayCues(plan,step,events))this.foreground.add(c,tempo);}
  get voiceCount(){return this.voices.length+this.foreground.voices.length;}
}
export function createSandRelaySource(rate,kind,params,version='revised',seed=42,context='mix'){
  if(version==='before'||version==='previous')return createDevelopmentSource(rate,kind,params,version==='before'?'before':'revised',seed,context);
  if(kind!=='techno')return createDevelopmentSource(rate,kind,params,'revised',seed,context);
  const p=context==='mix'?params:{...params,bass:0,percussion:0,...(context==='dry'?{space:0}:{})},source=new SoundGenerator(rate,kind,p,seed),e=source.electronic;
  if(e.plan.character.value!==26)return createDevelopmentSource(rate,kind,params,'revised',seed,context);
  const configure=e.configureInstruments.bind(e);
  e.configureInstruments=function(){
    configure();if(this.plan.character.value!==26)return;
    const rt=new SandRelayRuntime(rate,this.plan.character,this.rotation.seed),plan=this.plan,original=plan.sandOriginal??plan.events.bind(plan);plan.sandOriginal=original;
    plan.events=(step,...args)=>{const events=original(step,...args);rt.schedule(plan,step,events,this.settings.tempo);return events;};
    this.technoProduction=rt;
  };
  e.configureInstruments();return source;
}
