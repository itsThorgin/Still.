import {createRefinementSource} from './instrument-refinements-runtime.mjs';
import {selectedRebuild} from './six-character-rebuild-config.mjs';
import {SixRebuildPlan} from './six-character-rebuild-plan.mjs';
import {createRebuildVoice,sampleRebuildVoice,startRebuildVoice,retireRebuildVoice,createRebuildDrum,sampleRebuildDrum,clamp} from './six-character-rebuild-voices.mjs';
import {RebuildMix} from './six-character-rebuild-mix.mjs';
export class SixRebuildSource{
  constructor(rate,piece,params,seed=42,context='mix'){
    piece={...piece,tempo:piece.kind==='bassmusic'&&piece.id===42?174:(params.tempo??piece.tempo)};
    this.sampleRate=rate;this.piece=piece;this.kind=piece.kind;this.seed=seed;this.context=context;
    this.frames=0;this.beats=0;this.nextStepBeat=0;this.step=0;this.serial=0;this.scheduled=0;
    this.target={...params,tempo:piece.tempo};this.params={...this.target};this.smooth=1-Math.exp(-1/(rate*.025));
    this.plan=new SixRebuildPlan(piece.kind,piece.id,seed);this.voices=[];this.drums=[];
    this.mix=new RebuildMix(rate,piece);this.activeBass=null;this.activeLead=null;
    this.stats={connections:0,retirements:0,maxVoices:0,maxDrums:0,droppedEvents:0};
    this.buses={};this.views=this.mix.views;this.electronic=this;
    this.resetBuses();
  }
  resetBuses(){for(const k of ['sub','upper','musicL','musicR','chordL','chordR','leadL','leadR','drumL','drumR','sendL','sendR'])this.buses[k]=0;}
  add(e){
    if(!Number.isFinite(e.amplitude)||e.amplitude<0)throw Error('Bad event');
    const identity=(Math.imul(this.seed^++this.serial,2654435761)>>>0)||1;
    if(e.part==='drums'){
      if(this.drums.length>=32){this.stats.droppedEvents++;return;}
      this.drums.push(createRebuildDrum(e,this.sampleRate,this.piece,identity));
    }else{
      if(this.voices.length>=40){this.stats.droppedEvents++;return;}
      this.voices.push(createRebuildVoice(e,this.sampleRate,this.piece.tempo,identity));
    }
    this.scheduled++;
  }
  setParams(params){
    if(Number(params.style??this.piece.id)!==this.piece.id)throw Error('Isolated source is bound to one character; create a source for a different selection');
    this.target={...this.target,...params,tempo:this.piece.tempo}; // fixed authored tempo, including Rubber's exact 174
  }
  setLiveParams(params){
    const tempo=this.kind==='bassmusic'&&this.piece.id===42?174:params.tempo;
    if(tempo!==this.piece.tempo){this.liveTempoChanged=true;this.piece.tempo=tempo;}
    this.liveKeys??=Object.keys(this.params);
    for(const key of this.liveKeys)this.params[key]=this.target[key]=key==='tempo'?tempo:params[key];
  }
  clear(){this.voices.length=0;this.drums.length=0;this.activeBass=this.activeLead=null;this.mix=new RebuildMix(this.sampleRate,this.piece);this.views=this.mix.views;}
  get voiceCount(){return this.voices.length;}
  render(left,right){
    const rate=this.sampleRate,keys=['melody','accompaniment','bass','percussion','brightness','movement','pump','space','width'];
    for(let i=0;i<left.length;i++){
      for(const k of keys)this.params[k]+=(this.target[k]-this.params[k])*this.smooth;
      const params=this.params;
      while(this.beats+1e-10>=this.nextStepBeat){
        for(const e of this.plan.events(this.step))this.add(e);
        this.step++;this.nextStepBeat=this.step/4;
      }
      this.resetBuses();const b=this.buses;
      for(let j=this.voices.length-1;j>=0;j--){
        const v=this.voices[j];if(v.age>=v.end){this.voices.splice(j,1);if(this.activeBass===v)this.activeBass=null;if(this.activeLead===v)this.activeLead=null;continue;}
        if(v.age<0){v.age++;continue;}
        if(!v.started){
          const old=v.part==='bass'?this.activeBass:v.part==='lead'&&v.type==='sequence'?this.activeLead:null;
          startRebuildVoice(v,old,this.stats);
          if(v.part==='bass')this.activeBass=v;
          if(v.part==='lead'&&v.type==='sequence')this.activeLead=v;
        }
        sampleRebuildVoice(v,this.frames,this.beats,params.brightness/100,params.movement/100,this.piece.tempo);
        const level=v.amplitude*params[v.part==='bass'?'bass':v.part==='lead'?'melody':'accompaniment']/100;
        if(v.part==='bass'){b.sub+=v.sub*level;b.upper+=(v.left+v.right)*.5*level;}
        else{
          const l=v.left*level*v.panL,r=v.right*level*v.panR;
          b.musicL+=l;b.musicR+=r;b.sendL+=l*(v.send??.32);b.sendR+=r*(v.send??.32);
          if(v.part==='chords'){b.chordL+=l;b.chordR+=r;}
          if(v.part==='lead'){b.leadL+=l;b.leadR+=r;}
        }
      }
      for(let j=this.drums.length-1;j>=0;j--){
        const v=this.drums[j];if(v.age>=v.end){this.drums.splice(j,1);continue;}if(v.age<0){v.age++;continue;}
        if(!v.started){v.started=true;
          if(v.type==='kick')this.mix.kickEnvelope=1;
          if(v.type==='snare'&&v.amplitude>.1)this.mix.snareEnvelope=1;
          if(v.type==='hat')for(const open of this.drums)if(open.type==='open-hat'&&open.started&&open.age<open.end)retireRebuildVoice(open,.009);
        }
        const x=sampleRebuildDrum(v)*params.percussion/100;
        b.drumL+=x*v.panL;b.drumR+=x*v.panR;
        if(v.send){b.sendL+=x*v.panL*v.send;b.sendR+=x*v.panR*v.send;}
      }
      this.mix.process(b,params,this.frames);
      const view=this.views[this.context==='overview'?'mix':this.context]??this.views.mix;
      left[i]=view.left;if(right)right[i]=view.right;
      this.stats.maxVoices=Math.max(this.stats.maxVoices,this.voices.length);this.stats.maxDrums=Math.max(this.stats.maxDrums,this.drums.length);
      if(this.onSample)this.onSample(this.frames,this.views,this.buses);
      this.frames++;this.beats=this.liveTempoChanged?this.beats+this.piece.tempo/(rate*60):this.frames*this.piece.tempo/(rate*60);
    }
  }
}
export function createRebuildSource(rate,kind,params,version='rebuild',seed=42,context='mix'){
  const piece=selectedRebuild(kind,params.style);
  // The other 84 electronic candidates and every other collection fall through
  // to the latest revised audition, not to its superseded "before" branch.
  if(!piece)return createRefinementSource(rate,kind,params,'revised',seed,context);
  const matched={...params,tempo:kind==='bassmusic'&&piece.id===42?174:(params.tempo??piece.tempo)};
  if(version==='previous')return createRefinementSource(rate,kind,matched,'revised',seed,'mix');
  return new SixRebuildSource(rate,piece,matched,seed,context);
}
