import {prepareCollectionMachine,prepareRefinementTech,sampleRefinementTech,sampleRefinementPerc,startHatChoke} from './instrument-refinements-voices.mjs';
import {highPercussion} from './instrument-refinements-config.mjs';
// Generated audition adapter; frozen bass/drum implementation remains exact.
import {prepareDevelopmentTech,sampleDevelopmentTech} from './electronic-development-voices.mjs';
import {gardenHash} from '../foundation/garden-options.mjs';
import {createTechnoProductionTone,sampleTechnoProductionTone,tieTechnoProductionTone,handoverTechnoBass,createTechnoProductionDrum,sampleTechnoProductionDrum} from '../foundation/audio/techno-production-instruments.mjs';
import {retireBassExpression} from '../foundation/audio/bass-articulation.mjs';
import {TechnoProductionMix} from '../foundation/audio/techno-production-mix.mjs';
import {technoProductionScene} from '../foundation/audio/techno-production-plan.mjs';

export class RefinementTechnoRuntime{
  constructor(rate,character,seed){
    this.rate=rate;this.p=character.technoProduction;this.character=character;this.seed=seed;this.serial=0;
    this.voices=[];this.drums=[];this.activeAcid=null;this.activeBass=null;this.left=this.right=0;
    this.noiseState=gardenHash(seed,0x7e17)||1;this.noiseLow=this.noiseHigh=0;
    this.mix=new TechnoProductionMix(rate,this.p);
  }
  add(e,tempo){
    if(!e.drum&&e.role!=='bass'&&this.foreground){this.serial++;return;}
    const identity=gardenHash(this.seed,this.serial++)/4294967296;
    if(e.drum){if(this.drums.length<this.p.constraints.maxDrums)this.drums.push(createTechnoProductionDrum(e,this.rate,tempo,this.p,identity));return;}
    // Acid events have no microtiming offset, so tied gates may be retargeted
    // here without applying a future note early.
    if(e.patch==='acid'&&e.slide&&this.activeAcid&&this.activeAcid.age/this.rate<this.activeAcid.duration){
      tieTechnoProductionTone(this.activeAcid,e,tempo);return;
    }
    if(this.voices.length>=this.p.constraints.maxVoices)return;
    const v=createTechnoProductionTone(e,this.rate,tempo,this.p,identity);
    if(e.patch==='acid')for(const old of this.voices)if(old.patch==='acid'&&old.releaseStart===null){old.releaseStart=old.age;retireBassExpression(old,v.bassExpression.attack);}
    if(e.patch==='acid')this.activeAcid=v;
    if(this.machine){prepareDevelopmentTech(v);prepareCollectionMachine(v,e);}prepareRefinementTech(v);this.voices.push(v);
  }
  get voiceCount(){return this.voices.length+(this.foreground?.voices.length??0);}
  sample(params,frame,beats){
    if(frame%32===0||!this.scene)this.scene=technoProductionScene(this.p,beats/4);
    const scene=this.scene,p=this.p,brightness=params.brightness/100,movement=params.movement/100;
    let l=0,r=0,bass=0,sendL=0,sendR=0,drumL=0,drumR=0,kick=0;this.selectedPercL=this.selectedPercR=this.selectedSendL=this.selectedSendR=this.percSendL=this.percSendR=this.protectedPercL=this.protectedPercR=0;
    for(let i=this.voices.length-1;i>=0;i--){
      const v=this.voices[i];if(v.age/this.rate>=v.duration||v.role!=='bass'&&v.age>=v.duration*this.rate){this.voices.splice(i,1);if(this.activeAcid===v)this.activeAcid=null;if(this.activeBass===v)this.activeBass=null;continue;}
      if(v.age<0){v.age++;continue;}
      if(v.role==='bass'&&!v.started){handoverTechnoBass(v,this.activeBass);v.started=true;this.activeBass=v;}
      sampleRefinementTech(v,frame,beats,brightness,movement,scene,p,this.machine);
      const level=v.amplitude*params[v.role]/100;
      if(v.role==='bass'){bass+=v.left*level;continue;}
      const a=v.left*level*Math.sqrt(1-v.pan),b=v.right*level*Math.sqrt(1+v.pan);
      l+=a;r+=b;
      const send=v.patch==='chord'?(v.dubThrow??1):v.patch==='pad'?.7:.35;
      sendL+=a*send;sendR+=b*send;
    }
    for(let i=this.drums.length-1;i>=0;i--){
      const v=this.drums[i];if(v.age/this.rate>=v.duration){this.drums.splice(i,1);continue;}
      if(v.age<0){v.age++;continue;}
      if(!v.started){
        if(v.drum==='kick')this.mix.kickEnvelope=1;
        if(v.drum==='hat')for(const open of this.drums)if(open.drum==='open-hat'&&open.age>=0){if(open.refinementPerc)startHatChoke(open);else open.duration=Math.min(open.duration,open.age/this.rate+.009);}
        v.started=true;
      }
      const raw=sampleRefinementPerc(v),x=raw*params.percussion/100;
      if(highPercussion(this.character.value,v.drum)){this.selectedPercL+=x*Math.sqrt(1-(v.pan??0));this.selectedPercR+=x*Math.sqrt(1+(v.pan??0));if(v.drum==='metal'){this.selectedSendL+=x*.06;this.selectedSendR+=x*.06;}}else{this.protectedPercL+=x*Math.sqrt(1-(v.pan??0));this.protectedPercR+=x*Math.sqrt(1+(v.pan??0));}
      drumL+=x*Math.sqrt(1-(v.pan??0));drumR+=x*Math.sqrt(1+(v.pan??0));
      if(v.drum==='kick')kick+=raw;
      // A restrained high percussion room shares the filtered harmonic bus.
      else if(['metal','conga','tom','snare'].includes(v.drum)){sendL+=x*.06;sendR+=x*.06;this.percSendL+=x*.06;this.percSendR+=x*.06;}
    }
    if(p.automation.noise>0){
      let n=this.noiseState;n^=n<<13;n^=n>>>17;n^=n<<5;this.noiseState=n>>>0;
      this.noiseLow+=.12*(this.noiseState/2147483648-1-this.noiseLow);
      this.noiseHigh+=.02*(this.noiseLow-this.noiseHigh);
      const air=(this.noiseLow-this.noiseHigh)*p.automation.noise*scene.texture*params.accompaniment/100;
      l+=air;r+=air;sendL+=air*.5;sendR+=air*.5;
    }
    if(this.foreground){this.foreground.sample(params,frame,beats,scene,this.mix.kickEnvelope);l+=this.foreground.left;r+=this.foreground.right;sendL+=this.foreground.sendL;sendR+=this.foreground.sendR;}
    this.musicL=l;this.musicR=r;this.musicSendL=sendL;this.musicSendR=sendR;
    this.mix.process(l,r,bass,drumL,drumR,kick,sendL,sendR,params,scene,frame,beats);
    this.left=this.mix.left;this.right=this.mix.right;
  }
}
