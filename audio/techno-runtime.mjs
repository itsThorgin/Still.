import {gardenHash} from '../garden-options.mjs';
import {createTechnoProductionTone,sampleTechnoProductionTone,tieTechnoProductionTone,handoverTechnoBass,createTechnoProductionDrum,sampleTechnoProductionDrum} from './techno-production-instruments.mjs';
import {retireBassExpression} from './bass-articulation.mjs';
import {TechnoProductionMix} from './techno-production-mix.mjs';
import {technoProductionScene} from './techno-production-plan.mjs';
import {prepareMachineTone,sampleMachineTone} from './layer-expression.mjs';
import {preparePatternTone,prepareToneShape,sampleToneShape,samplePercussionShape,startHatChoke} from './tone-shaping.mjs';
import {sampleExpressionDrum} from './note-expression.mjs';
import {createMusicVoices} from './music-voices.mjs';

export class TechnoRuntime{
  constructor(rate,character,seed){
    this.rate=rate;this.character=character;this.p=character.technoProduction;this.performance=character.performance;this.seed=seed;this.serial=0;
    this.voices=[];this.drums=[];this.activeAcid=this.activeBass=null;this.left=this.right=0;
    this.noiseState=gardenHash(seed,0x7e17)||1;this.noiseLow=this.noiseHigh=0;this.mix=new TechnoProductionMix(rate,this.p);this.bank=createMusicVoices(rate,character,seed);
  }
  add(e,tempo,onset){
    this.onsetBeat=onset;const p=this.performance;
    if(p.voiceRules&&e.amplitude<=0){this.serial++;return;}
    if(this.bank&&!e.drum&&e.role!=='bass'){
      this.serial++;if(p.cues==='none'&&!e.roleOmit&&!e.noteOmit)this.bank.add(e,tempo);return;
    }
    if(e.roleOmit||e.noteOmit){this.serial++;return;}
    const count=this.voices.length;this.addVoice(e,tempo);
    if(e.role==='bass'&&p.voiceRules?.role==='acid'){
      const v=this.activeAcid??this.voices.at(-1);
      if(v){const phase=Math.floor((this.step??0)/this.p.bass.length)%8,lift=e.accent?1.10:phase>=4?1.03:.91;
        v.config={...v.config,cutoff:this.p.bass.cutoff*lift,env:this.p.bass.env*(e.accent?1.08:.93)};
        if(this.voices.length>count)v.envRate=Math.exp(-1/(v.fs*(e.accent?.17:.125)));
      }
    }
  }
  addVoice(e,tempo){
    const identity=gardenHash(this.seed,this.serial++)/4294967296;
    if(e.drum){if(this.drums.length<this.p.constraints.maxDrums)this.drums.push(createTechnoProductionDrum(e,this.rate,tempo,this.p,identity));return;}
    // Slides reuse the active acid voice.
    if(e.patch==='acid'&&e.slide&&this.activeAcid&&this.activeAcid.age/this.rate<this.activeAcid.duration){tieTechnoProductionTone(this.activeAcid,e,tempo);return;}
    if(this.voices.length>=this.p.constraints.maxVoices)return;
    const v=createTechnoProductionTone(e,this.rate,tempo,this.p,identity);
    if(e.patch==='acid')for(const old of this.voices)if(old.patch==='acid'&&old.releaseStart===null){old.releaseStart=old.age;retireBassExpression(old,v.bassExpression.attack);}
    if(e.patch==='acid')this.activeAcid=v;
    if(this.performance.machine){prepareMachineTone(v);preparePatternTone(v,e);}
    if(this.performance.toneShape)prepareToneShape(v);this.voices.push(v);
  }
  sample(params,frame,beats){
    if(frame%32===0||!this.scene)this.scene=technoProductionScene(this.p,beats/4);
    const scene=this.scene,p=this.p,brightness=params.brightness/100,movement=params.movement/100;
    let l=0,r=0,bass=0,sendL=0,sendR=0,drumL=0,drumR=0,kick=0;
    for(let i=this.voices.length-1;i>=0;i--){
      const v=this.voices[i];if(v.age/this.rate>=v.duration||this.performance.toneShape&&v.role!=='bass'&&v.age>=v.duration*this.rate){this.voices.splice(i,1);if(this.activeAcid===v)this.activeAcid=null;if(this.activeBass===v)this.activeBass=null;continue;}
      if(v.age<0){v.age++;continue;}
      if(v.role==='bass'&&!v.started){handoverTechnoBass(v,this.activeBass);v.started=true;this.activeBass=v;}
      if(this.performance.toneShape)sampleToneShape(v,frame,beats,brightness,movement,scene,p,this.performance.machine);
      else if(this.performance.machine)sampleMachineTone(v,frame,beats,brightness,movement,scene,p);
      else sampleTechnoProductionTone(v,frame,beats,brightness,movement,scene,p);
      const level=v.amplitude*params[v.role]/100;
      if(v.role==='bass'){bass+=v.left*level;continue;}
      const a=v.left*level*Math.sqrt(1-v.pan),b=v.right*level*Math.sqrt(1+v.pan);l+=a;r+=b;
      const send=v.patch==='chord'?(v.dubThrow??1):v.patch==='pad'?.7:.35;sendL+=a*send;sendR+=b*send;
    }
    for(let i=this.drums.length-1;i>=0;i--){
      const v=this.drums[i];if(v.age/this.rate>=v.duration){this.drums.splice(i,1);continue;}if(v.age<0){v.age++;continue;}
      if(!v.started){
        if(v.drum==='kick')this.mix.kickEnvelope=1;
        if(v.drum==='hat')for(const open of this.drums)if(open.drum==='open-hat'&&open.age>=0){
          if(this.performance.hatFade||this.performance.toneShape&&open.percussionShape)startHatChoke(open);else open.duration=Math.min(open.duration,open.age/this.rate+.009);
        }
        v.started=true;
      }
      const raw=this.performance.toneShape?samplePercussionShape(v):this.performance.hatFade?sampleExpressionDrum(v,sampleTechnoProductionDrum):sampleTechnoProductionDrum(v),x=raw*params.percussion/100;
      drumL+=x*Math.sqrt(1-(v.pan??0));drumR+=x*Math.sqrt(1+(v.pan??0));
      if(v.drum==='kick')kick+=raw;else if(['metal','conga','tom','snare'].includes(v.drum)){sendL+=x*.06;sendR+=x*.06;}
    }
    if(p.automation.noise>0){
      let n=this.noiseState;n^=n<<13;n^=n>>>17;n^=n<<5;this.noiseState=n>>>0;
      this.noiseLow+=.12*(this.noiseState/2147483648-1-this.noiseLow);this.noiseHigh+=.02*(this.noiseLow-this.noiseHigh);
      const air=(this.noiseLow-this.noiseHigh)*p.automation.noise*scene.texture*params.accompaniment/100;l+=air;r+=air;sendL+=air*.5;sendR+=air*.5;
    }
    if(this.bank){this.bank.sample(params,frame,beats,scene,this.mix.kickEnvelope);l+=this.bank.left;r+=this.bank.right;sendL+=this.bank.sendL;sendR+=this.bank.sendR;}
    this.mix.process(l,r,bass,drumL,drumR,kick,sendL,sendR,params,scene,frame,beats);this.left=this.mix.left;this.right=this.mix.right;
  }
  get voiceCount(){return this.voices.length+(this.bank?.voices.length??0);}
}
