// Generated isolated adapter; production and frozen source are unchanged.
import {prepareBassForeground,sampleBassForeground} from './electronic-expression-voices.mjs';
import {gardenHash} from '../foundation/garden-options.mjs';
import {createElectronicTone,sampleElectronicTone} from '../foundation/audio/electronic-instruments.mjs';
import {createInstrumentVoice,sampleInstrumentVoice} from '../foundation/audio/instrument-library.mjs';
import {dnbInstrumentPalette} from '../foundation/audio/instrument-palette.mjs';
import {createProductionBass,sampleProductionBass,handoverProductionBass,createProductionDrum,sampleProductionDrum,prepareProductionTables} from '../foundation/audio/bass-production-instruments.mjs';
import {BassProductionMix} from '../foundation/audio/bass-production-mix.mjs';

export class ExpressionBassRuntime{
  constructor(rate,character,seed){
    this.rate=rate;this.character=character;this.p=character.bassProduction;this.seed=seed;
    prepareProductionTables(rate);
    this.voices=[];this.drums=[];this.serial=0;this.activeBass=null;
    this.mix=new BassProductionMix(rate,this.p);this.left=this.right=0;
    this.palette=dnbInstrumentPalette(seed,character.value,character.groove);
  }
  add(event,tempo){
    const identity=gardenHash(this.seed,this.serial++),p=this.p,rate=this.rate;
    if(event.drum){
      if(this.drums.length>=32)return;
      if(event.drum==='hat')for(const d of this.drums)if(d.drum==='open-hat')d.duration=Math.min(d.duration,d.age/rate+.012);
      this.drums.push(createProductionDrum(event,rate,tempo,p,identity));return;
    }
    if(this.voices.length>=48)return;
    if(event.role==='bass'){this.voices.push(createProductionBass(event,rate,tempo,p,identity/4294967296));return;}
    const duration=event.beats*60/tempo;
    const library=this.character.bassWriting&&event.role==='melody'&&this.palette;
    const voice=library?createInstrumentVoice({...event,instrumentPatch:this.palette.main},rate,duration,identity/4294967296,tempo)
      :createElectronicTone(event,rate,duration,identity/4294967296);
    if(voice){prepareBassForeground(voice,this.character.value,tempo,this.onsetBeat??0,this.seed);voice.age=-Math.round((event.delay??0)*60/tempo*rate);this.voices.push(voice);}
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
        if(!v.started){
          const previous=this.activeBass;
          if(previous&&previous!==v)handoverProductionBass(v,previous);
          v.started=true;this.activeBass=v;
        }
        sampleProductionBass(v,frame,beats,brightness,movement);sub+=v.sub*level;upperL+=v.left*level;upperR+=v.right*level;
      }else{
        if(v.foregroundExpression)sampleBassForeground(v,frame,beats,brightness,movement);
        else if(v.instrumentVoice)sampleInstrumentVoice(v,frame,beats,brightness,movement);
        else sampleElectronicTone(v,frame,beats,brightness,movement);
        const a=v.left*level*Math.sqrt((1-v.pan)/2),b=v.right*level*Math.sqrt((1+v.pan)/2);
        l+=a;r+=b;sendL+=a*(v.foregroundExpression?.send??1);sendR+=b*(v.foregroundExpression?.send??1);
      }
    }
    for(let i=this.drums.length-1;i>=0;i--){
      const v=this.drums[i];
      if(v.age/rate>=v.duration){this.drums.splice(i,1);continue;}
      if(v.age<0){v.age++;continue;}
      if(!v.started){if(v.drum==='kick')this.mix.kickEnvelope=1;v.started=true;}
      const x=sampleProductionDrum(v)*params.percussion/100,pan=v.pan??0;
      drumsL+=x*Math.sqrt(1-pan);drumsR+=x*Math.sqrt(1+pan);
      if(v.drum==='snare'||v.drum==='clap'||v.drum==='tom')room+=x;
    }
    this.mix.process(l,r,sub,upperL,upperR,drumsL,drumsR,sendL,sendR,room,params,scene,frame);
    this.left=this.mix.left;this.right=this.mix.right;
  }
}
