import {MusicRenderer} from './music-renderer.mjs';
import {SequenceRenderer} from './sequence-renderer.mjs';
import {electronicCharacter} from '../electronic-characters.mjs';
import {GardenRotation} from '../garden-options.mjs';
import {electronicVariationMix,characterPaceMix} from '../electronic-variation.mjs';
import {automaticTransition,bassFadeGain} from './bass-transitions.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));

export class ElectronicMusic {
  constructor(rate,params,seed,kind){
    this.rate=rate;this.kind=kind;this.settings={...params};this.requestedStyle=params.style??0;
    this.rotation=new GardenRotation(rate,seed,params.variationMinutes);this.variationVersion=0;
    this.variationParams=null;this.manual=this.transition=null;this.left=this.right=0;
    this.oneL=new Float32Array(1);this.oneR=new Float32Array(1);this.resetScore();
  }
  resetScore(){
    this.character=electronicCharacter(this.kind,this.requestedStyle,this.rotation.seed);
    const params={...this.settings,style:this.character.value,variationMinutes:0};
    if(this.character.fixedTempo)params.tempo=this.character.fixedTempo;
    this.source=this.character.sequence?new SequenceRenderer(this.rate,this.character.sequence,params,this.rotation.seed):new MusicRenderer(this.rate,this.kind,params,this.rotation.seed);
    this.plan=this.source.electronic.plan;this.localFrame=0;this.applySettings();
  }
  applySettings(){
    if(this.source.piece)return;
    this.source.setSettings({...this.settings,style:this.character.value,variationMinutes:0});
  }
  setParams(params,frame=0){
    this.settings={...params};this.rotation.configure(params.variationMinutes,frame);
    const style=params.style??0;
    if(style===this.requestedStyle){this.applySettings();return;}
    this.requestedStyle=style;this.rotation.schedule(frame);
    if(this.manual?.phase==='out')return;
    const from=this.manualGain(frame)*bassFadeGain(this.transition,frame);
    this.transition=null;this.manual={phase:'out',start:frame,from};
  }
  manualGain(frame){
    if(!this.manual)return 1;
    const t=clamp((frame-this.manual.start)/(this.rate*(this.manual.phase==='out'?1:2))),smooth=t*t*(3-2*t);
    return this.manual.phase==='out'?this.manual.from*(1-smooth):smooth;
  }
  variationGain(){return bassFadeGain(this.transition,this.frame??0);}
  changeSeed(frame,params){
    this.rotation.changeSeed(frame);
    const c=electronicCharacter(this.kind,this.requestedStyle,this.rotation.seed);
    this.variationParams=this.settings.varyMix===1?electronicVariationMix(this.kind,c,this.rotation.seed,this.settings)
      :this.requestedStyle===0?characterPaceMix(c,this.settings):c.fixedTempo?characterPaceMix(c,this.settings):null;
    if(this.variationParams){Object.assign(this.settings,this.variationParams);Object.assign(params,this.variationParams);}
    this.resetScore();this.variationVersion++;
  }
  sample(params,frame){
    this.frame=frame;
    if(this.manual?.phase==='out'&&frame>=this.manual.start+this.rate){this.resetScore();this.manual={phase:'in',start:frame};}
    else if(this.manual?.phase==='in'&&frame>=this.manual.start+this.rate*2)this.manual=null;
    const fade=this.transition;
    if(fade?.phase==='out'&&frame>=fade.start+fade.outFrames){fade.start+=fade.outFrames;fade.phase='quiet';}
    if(fade?.phase==='quiet'){
      if(frame<fade.start+fade.quietFrames){this.left=this.right=0;return;}
      const incoming=fade.start+fade.quietFrames;this.changeSeed(frame,params);fade.phase='in';fade.start=incoming;
    }
    if(fade?.phase==='in'&&frame>=fade.start+fade.inFrames)this.transition=null;
    const e=this.source.electronic,phrase=this.plan.phraseSteps??128,bar=this.plan.barSteps??16;
    if(!this.manual&&!this.transition&&frame>=this.rotation.nextFrame&&e.beats+1e-10>=e.nextStepBeat&&e.step%phrase===phrase-bar)
      this.transition=automaticTransition(this.rotation.seed,frame,this.rate);
    const gain=this.manualGain(frame)*bassFadeGain(this.transition,frame);
    if(this.source.piece){
      this.source.setLiveParams(params);this.source.render(this.oneL,this.oneR);
      this.left=this.oneL[0]*gain;this.right=this.oneR[0]*gain;
    }else{
      e.sample(params,this.localFrame);this.left=e.left*gain;this.right=e.right*gain;
    }
    this.localFrame++;
  }
  get step(){return this.source.electronic.step;} set step(v){this.source.electronic.step=v;}
  get beats(){return this.source.electronic.beats;} set beats(v){this.source.electronic.beats=v;}
  get nextStepBeat(){return this.source.electronic.nextStepBeat;} set nextStepBeat(v){this.source.electronic.nextStepBeat=v;}
  get voices(){return this.source.electronic.voices;} get drums(){return this.source.electronic.drums;}
  get bassProduction(){return this.source.electronic.bassProduction;}
  get technoProduction(){return this.source.electronic.technoProduction;}
}
