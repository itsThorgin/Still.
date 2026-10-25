import {SoundGenerator} from '../foundation/audio/synth.mjs';
import {TechnoProductionRuntime} from '../foundation/audio/techno-production-runtime.mjs';
import {CohesionForeground} from './electronic-cohesion-tone.mjs';
import {createSandRelaySource} from './sand-relay-runtime.mjs';
import {DevelopmentTechnoRuntime} from './electronic-development-techno-runtime.mjs';
import {developmentMode} from './electronic-development-plan.mjs';
import {collectionPolicy,collectionTonalCues,collectionEvents} from './collection-expression-plan.mjs';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export class CollectionForeground extends CohesionForeground{
  constructor(rate,c,seed){
    super(rate,c.technoProduction.family==='minimal'?7:developmentMode(c.technoProduction.family),seed^c.value*811);
    this.family=c.technoProduction.family;this.connections=0;this.retirements=0;
    this.glide=1-Math.exp(-1/(rate*(this.family==='ambient'?.22:this.family==='minimal'?.12:.065)));
  }
  add(cue,tempo){
    const previous=this.lead,count=this.scheduled;super.add({...cue,connect:false},tempo);if(this.scheduled===count)return;
    const v=this.voices.at(-1);v.pendingConnect=cue.type==='lead'&&cue.connect;v.previousLead=cue.type==='lead'?previous:null;
    if(cue.type==='lead'){
      const ambient=this.family==='ambient',minimal=this.family==='minimal';
      v.spec={...v.spec,decay:ambient?4:minimal?2.6:.9,sustain:ambient?.78:minimal?.72:.64,
        ceiling:ambient?1800:minimal?2100:2600,spread:ambient?.004:.0032,remove:minimal?.11:.15};
      v.attackFrames=Math.round(this.rate*(ambient?.34:minimal?.18:.11));v.releaseFrames=Math.round(this.rate*(ambient?.80:minimal?.45:.25));
    }else if(cue.type==='pulse'&&this.family==='minimal'){
      v.spec={...v.spec,decay:.22,sustain:.08,ceiling:750,remove:.09};v.attackFrames=Math.round(this.rate*.055);v.releaseFrames=Math.round(this.rate*.18);
    }
    v.decayRate=Math.exp(-1/(this.rate*v.spec.decay));v.endFrame=v.gateFrames+v.releaseFrames;v.duration=v.endFrame/this.rate;
  }
  sample(...args){
    for(const v of this.voices){
      if(v.age!==0||v.type!=='lead')continue;
      const old=v.previousLead,connect=v.pendingConnect;v.previousLead=null;v.pendingConnect=false;
      if(!old||old.age>=old.endFrame)continue;
      const ratio=old.frequencyNow/v.frequency;
      if(connect&&old.age-old.gateFrames<this.rate*.16&&old.gain>.015&&ratio>.66&&ratio<1.5){
        for(const key of ['phase','phase2','phase3','filterL','filterR','filter2L','filter2R','hpL','hpR','coefficient','coefficientStep'])v[key]=old[key];
        v.frequencyNow=old.frequencyNow;v.startGain=old.gain*old.amplitude/v.amplitude;v.connected=true;
        v.attackFrames=Math.round(this.rate*.065);old.endFrame=old.age;this.connections++;
      }else if(old.gain>0){
        // A wide leap gets a captured-level retirement instead of stacking
        // another sustained line or resetting the outgoing release to full gain.
        const attack=smooth(old.age/old.attackFrames),body=old.spec.sustain+(1-old.spec.sustain)*old.decayLevel,
          natural=old.startGain*(1-attack)+body*attack;
        if(natural>1e-12)old.amplitude*=old.gain/natural;
        old.endFrame=Math.min(old.endFrame,old.age+Math.round(this.rate*.045));old.releaseFrames=old.endFrame-old.age;this.retirements++;
      }
    }
    super.sample(...args);
  }
}
export class CollectionTonalRuntime extends TechnoProductionRuntime{
  constructor(rate,c,seed){super(rate,c,seed);this.foreground=new CollectionForeground(rate,c,seed);
    const process=this.mix.process.bind(this.mix);this.mix.process=(l,r,bass,dl,dr,kick,sl,sr,p,scene,frame,beats)=>{
      this.foreground.sample(p,frame,beats,scene,this.mix.kickEnvelope);
      process(l+this.foreground.left,r+this.foreground.right,bass,dl,dr,kick,sl+this.foreground.sendL,sr+this.foreground.sendR,p,scene,frame,beats);
    };
  }
  add(e,t){if(e.drum||e.role==='bass')super.add(e,t);else this.serial++;}
  schedule(plan,step,events,tempo){for(const cue of collectionTonalCues(plan,step,events))this.foreground.add(cue,tempo);}
  get voiceCount(){return this.voices.length+this.foreground.voices.length;}
}
class CollectionMachineRuntime extends DevelopmentTechnoRuntime{
  add(e,tempo){
    const count=this.voices.length;super.add(e,tempo);if(e.drum||e.role==='bass'||this.voices.length===count)return;
    const v=this.voices.at(-1),g=e.collectionExpression;if(!g)return;
    const family=g.family,metal=['raw','industrial','tribal'].includes(family),pressure=g.pressure??.8;
    v.config={...v.config,cutoff:v.config.cutoff*(metal?.83:.93),resonance:Math.max(.12,(v.config.resonance??.3)-(metal?.10:.035))};
    v.developmentExpression.attack=g.support?.010:family==='driving'?.018:family==='hard'?.006:family==='tribal'?.012:.008;
    if(!g.support)v.ampRate=Math.exp(-1/(this.rate*Math.max(metal?.045:.06,v.gate*(g.held?.82:metal?.58:.70))));
  }
}
export function createCollectionSource(rate,kind,params,version='revised',seed=42,context='mix'){
  const p=context==='mix'?params:{...params,bass:0,percussion:0,...(context==='dry'?{space:0}:{})};
  if(version==='before')return new SoundGenerator(rate,kind,p,seed);
  if(!['bassmusic','techno'].includes(kind))return createSandRelaySource(rate,kind,params,'revised',seed,context);
  const source=new SoundGenerator(rate,kind,p,seed),e=source.electronic,policy=collectionPolicy(kind,e.plan.character);
  if(['reference','preserve','bass-phrase'].includes(policy.action))return createSandRelaySource(rate,kind,params,'revised',seed,context);
  const configure=e.configureInstruments.bind(e);
  e.configureInstruments=function(){
    configure();const plan=this.plan,c=plan.character,policy=collectionPolicy(kind,c);
    if(['reference','preserve','bass-phrase'].includes(policy.action))return;
    const rt=policy.action==='machine-phrase'?new CollectionMachineRuntime(rate,c,this.rotation.seed):new CollectionTonalRuntime(rate,c,this.rotation.seed),
      original=plan.collectionOriginal??plan.events.bind(plan);plan.collectionOriginal=original;
    plan.events=(step,...args)=>{const events=original(step,...args);if(rt.schedule)rt.schedule(plan,step,events,this.settings.tempo);return collectionEvents(plan,kind,step,events);};
    const add=rt.add.bind(rt);rt.add=(event,tempo)=>{rt.onsetBeat=this.nextStepBeat;if(event.developmentOmit){rt.serial++;return;}add(event,tempo);};
    this.technoProduction=rt;
  };
  e.configureInstruments();return source;
}
