import {BassScore,TechnoScore} from './music-score.mjs';
import {BassRuntime} from './bass-runtime.mjs';
import {TechnoRuntime} from './techno-runtime.mjs';
export class MusicRenderer{
  constructor(rate,kind,params,seed){
    this.rate=rate;this.kind=kind;this.electronic=this;this.settings=params;this.frames=0;this.step=0;this.beats=0;this.nextStepBeat=0;
    this.plan=kind==='bassmusic'?new BassScore(seed,params.style):new TechnoScore(seed,params.style);
    this.runtime=kind==='bassmusic'?new BassRuntime(rate,this.plan.character,seed):new TechnoRuntime(rate,this.plan.character,seed);
    if(kind==='bassmusic')this.bassProduction=this.runtime;else this.technoProduction=this.runtime;
    this.plan.runtime=this.runtime;this.plan.settings=params;this.left=this.right=0;
  }
  setSettings(params){this.settings=params;this.plan.settings=params;}
  sample(params,frame){
    while(this.beats+1e-9>=this.nextStepBeat){
      for(const event of this.plan.events(this.step++,params))this.runtime.add(event,params.tempo,this.nextStepBeat);
      this.nextStepBeat+=.25;
    }
    this.runtime.sample(params,frame,this.beats,this.plan.state);this.left=this.runtime.left;this.right=this.runtime.right;
    this.beats+=params.tempo/(60*this.rate);this.frames++;
  }
  get voices(){return this.runtime.voices;} get drums(){return this.runtime.drums;}
}
