import {gardenHash} from '../garden-options.mjs';
import {createElectronicTone,sampleElectronicTone} from './electronic-instruments.mjs';
import {createInstrumentVoice,sampleInstrumentVoice} from './instrument-library.mjs';
import {dnbInstrumentPalette} from './instrument-palette.mjs';
import {createProductionBass,sampleProductionBass,handoverProductionBass,createProductionDrum,sampleProductionDrum,prepareProductionTables} from './bass-production-instruments.mjs';
import {BassProductionMix} from './bass-production-mix.mjs';
import {prepareBassForeground,sampleBassForeground} from './key-expression.mjs';
import {prepareLayerBass,sampleLayerLibrary} from './layer-expression.mjs';
import {prepareBassShape,sampleBassShape} from './tone-shaping.mjs';
import {createMusicVoices,BassHarmonics} from './music-voices.mjs';

export class BassRuntime{
  constructor(rate,character,seed){
    this.rate=rate;this.character=character;this.p=character.bassProduction;this.performance=character.performance;this.seed=seed;
    prepareProductionTables(rate);this.voices=[];this.drums=[];this.serial=0;this.activeBass=null;
    this.mix=new BassProductionMix(rate,this.p);this.left=this.right=0;
    this.palette=dnbInstrumentPalette(seed,character.value,character.groove);
    this.bank=createMusicVoices(rate,character,seed);
    this.harmonics=this.performance.bassHarmonics?new BassHarmonics(rate,this.performance.voiceRules,seed):null;
  }
  add(e,tempo,onset){
    const p=this.performance;this.onsetBeat=onset;
    // Silent events still consume a random identity.
    if(p.voiceRules&&e.amplitude<=0){this.serial++;return;}
    if(this.bank&&!e.drum&&e.role!=='bass'){
      this.serial++;if(!e.roleOmit&&!e.noteOmit)this.bank.add(e,tempo);return;
    }
    if(e.roleOmit||e.noteOmit){this.serial++;return;}
    this.addVoice(e,tempo);if(e.role==='bass')this.harmonics?.add(e,tempo);
  }
  addVoice(event,tempo){
    const identity=gardenHash(this.seed,this.serial++),p=this.p,rate=this.rate;
    if(event.drum){
      if(this.drums.length>=32)return;
      if(event.drum==='hat')for(const d of this.drums)if(d.drum==='open-hat')d.duration=Math.min(d.duration,d.age/rate+.012);
      const drum=createProductionDrum(event,rate,tempo,p,identity),pan=drum.pan??0;
      drum.mixPanL=Math.sqrt(1-pan);drum.mixPanR=Math.sqrt(1+pan);
      this.drums.push(drum);return;
    }
    if(this.voices.length>=48)return;
    if(event.role==='bass'){const v=createProductionBass(event,rate,tempo,p,identity/4294967296);if(this.performance.bassShape)prepareBassShape(v);this.voices.push(v);return;}
    const duration=event.beats*60/tempo,library=this.character.usesLibrary&&event.role==='melody'&&this.palette;
    const voice=library?createInstrumentVoice({...event,instrumentPatch:this.palette[this.performance.upper==='library'?(event.patchRole??'main'):'main']},rate,duration,identity/4294967296,tempo):createElectronicTone(event,rate,duration,identity/4294967296);
    if(voice){
      if(this.performance.upper==='keys')prepareBassForeground(voice,this.character.value,tempo,this.onsetBeat??0,this.seed);
      if(this.performance.upper==='library')prepareLayerBass(voice,this.character,tempo,this.onsetBeat??0);
      voice.mixPanL=Math.sqrt((1-voice.pan)/2);voice.mixPanR=Math.sqrt((1+voice.pan)/2);
      voice.age=-Math.round((event.delay??0)*60/tempo*rate);this.voices.push(voice);
    }
  }
  sample(params,frame,beats,scene){
    const rate=this.rate,brightness=params.brightness/100,movement=params.movement/100;
    let l=0,r=0,sub=0,upperL=0,upperR=0,sendL=0,sendR=0,room=0,drumsL=0,drumsR=0;
    for(let i=this.voices.length-1;i>=0;i--){
      const v=this.voices[i];
      if(v.age/rate>=v.duration){this.voices.splice(i,1);if(this.activeBass===v)this.activeBass=null;continue;}
      if(v.age<0){v.age++;continue;}
      const level=v.amplitude*params[v.role]/100;
      if(v.role==='bass'){
        if(!v.started){const previous=this.activeBass;if(previous&&previous!==v)handoverProductionBass(v,previous);v.started=true;this.activeBass=v;}
        if(this.performance.bassShape)sampleBassShape(v,frame,beats,brightness,movement);else sampleProductionBass(v,frame,beats,brightness,movement);
        sub+=v.sub*level;upperL+=v.left*level;upperR+=v.right*level;
      }else{
        if(v.noteShape?.library)sampleLayerLibrary(v,frame,beats,brightness,movement);
        else if(v.foregroundExpression)sampleBassForeground(v,frame,beats,brightness,movement);
        else if(v.instrumentVoice)sampleInstrumentVoice(v,frame,beats,brightness,movement);
        else sampleElectronicTone(v,frame,beats,brightness,movement);
        const a=v.left*level*v.mixPanL,b=v.right*level*v.mixPanR;
        l+=a;r+=b;sendL+=a*(v.foregroundExpression?.send??1);sendR+=b*(v.foregroundExpression?.send??1);
      }
    }
    for(let i=this.drums.length-1;i>=0;i--){
      const v=this.drums[i];if(v.age/rate>=v.duration){this.drums.splice(i,1);continue;}if(v.age<0){v.age++;continue;}
      if(!v.started){if(v.drum==='kick')this.mix.kickEnvelope=1;v.started=true;}
      const x=sampleProductionDrum(v)*params.percussion/100;
      drumsL+=x*v.mixPanL;drumsR+=x*v.mixPanR;if(v.drum==='snare'||v.drum==='clap'||v.drum==='tom')room+=x;
    }
    if(this.bank){this.bank.sample(params,frame,beats,scene,this.mix.kickEnvelope);l+=this.bank.left;r+=this.bank.right;sendL+=this.bank.sendL;sendR+=this.bank.sendR;}
    if(this.harmonics){this.harmonics.sample(params,frame,beats);upperL=upperL*.20+this.harmonics.left*.80;upperR=upperR*.20+this.harmonics.right*.80;}
    this.mix.process(l,r,sub,upperL,upperR,drumsL,drumsR,sendL,sendR,room,params,scene,frame);this.left=this.mix.left;this.right=this.mix.right;
  }
  get voiceCount(){return this.voices.length+(this.bank?.voices.length??0)+(this.harmonics?.voices.length??0);}
}
