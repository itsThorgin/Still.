import {SequencePlan} from './sequence-plan.mjs';
import {createSequenceVoice,sampleSequenceVoice,startSequenceVoice,retireSequenceVoice,createSequenceDrum,sampleSequenceDrum,clamp} from './pattern-instruments.mjs';
import {SequenceMix} from './sequence-mix.mjs';
const MIX_KEYS=['melody','accompaniment','bass','percussion','brightness','movement','pump','space','width'];
export class SequenceRenderer{
  constructor(rate,piece,params,seed=42,context='mix'){
    piece={...piece,tempo:piece.kind==='bassmusic'&&piece.id===42?174:(params.tempo??piece.tempo)};
    this.sampleRate=rate;this.piece=piece;this.kind=piece.kind;this.seed=seed;this.context=context;
    this.frames=0;this.beats=0;this.nextStepBeat=0;this.step=0;this.serial=0;this.scheduled=0;
    this.target={...params,tempo:piece.tempo};this.params={...this.target};this.smooth=1-Math.exp(-1/(rate*.025));
    this.plan=new SequencePlan(piece.kind,piece.id,seed);this.voices=[];this.drums=[];
    this.mix=new SequenceMix(rate,piece);this.activeBass=null;this.activeLead=null;this.left=this.right=0;
    this.stats={connections:0,retirements:0,maxVoices:0,maxDrums:0,droppedEvents:0};
    this.buses={};this.views=this.mix.views;this.electronic=this;
    this.resetBuses();
  }
  resetBuses(){
    const b=this.buses;
    b.sub=b.upper=b.musicL=b.musicR=b.chordL=b.chordR=b.leadL=b.leadR=b.drumL=b.drumR=b.sendL=b.sendR=0;
  }
  add(e){
    if(!Number.isFinite(e.amplitude)||e.amplitude<0)throw Error('Bad event');
    const identity=(Math.imul(this.seed^++this.serial,2654435761)>>>0)||1;
    if(e.part==='drums'){
      if(this.drums.length>=32){this.stats.droppedEvents++;return;}
      this.drums.push(createSequenceDrum(e,this.sampleRate,this.piece,identity));
    }else{
      if(this.voices.length>=40){this.stats.droppedEvents++;return;}
      this.voices.push(createSequenceVoice(e,this.sampleRate,this.piece.tempo,identity));
    }
    this.scheduled++;
  }
  setParams(params){
    if(Number(params.style??this.piece.id)!==this.piece.id)throw Error('Isolated source is bound to one character; create a source for a different selection');
    this.target={...this.target,...params,tempo:this.piece.tempo}; 
  }
  setLiveParams(params){
    const tempo=this.kind==='bassmusic'&&this.piece.id===42?174:params.tempo;
    if(tempo!==this.piece.tempo){this.liveTempoChanged=true;this.piece.tempo=tempo;}
    this.liveKeys??=Object.keys(this.params);
    for(const key of this.liveKeys)this.params[key]=this.target[key]=key==='tempo'?tempo:params[key];
  }
  clear(){this.voices.length=0;this.drums.length=0;this.activeBass=this.activeLead=null;this.mix=new SequenceMix(this.sampleRate,this.piece);this.views=this.mix.views;this.left=this.right=0;}
  get voiceCount(){return this.voices.length;}
  render(left,right){
    for(let i=0;i<left.length;i++){
      for(const k of MIX_KEYS)this.params[k]+=(this.target[k]-this.params[k])*this.smooth;
      this.sample(this.params);
      left[i]=this.left;if(right)right[i]=this.right;
    }
  }
  sampleLive(params){
    // SoundGenerator has already smoothed these controls for this sample.
    const tempo=this.kind==='bassmusic'&&this.piece.id===42?174:params.tempo;
    if(tempo!==this.piece.tempo){this.liveTempoChanged=true;this.piece.tempo=tempo;}
    this.sample(params);
    // Preserve the Float32 rounding of the former one-frame output buffers
    // before the live controller applies its transition gain.
    this.left=Math.fround(this.left);this.right=Math.fround(this.right);
  }
  sample(params){
      const rate=this.sampleRate;
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
          startSequenceVoice(v,old,this.stats);
          if(v.part==='bass')this.activeBass=v;
          if(v.part==='lead'&&v.type==='sequence')this.activeLead=v;
        }
        sampleSequenceVoice(v,this.frames,this.beats,params.brightness/100,params.movement/100,this.piece.tempo);
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
          if(v.type==='hat')for(const open of this.drums)if(open.type==='open-hat'&&open.started&&open.age<open.end)retireSequenceVoice(open,.009);
        }
        const x=sampleSequenceDrum(v)*params.percussion/100;
        b.drumL+=x*v.panL;b.drumR+=x*v.panR;
        if(v.send){b.sendL+=x*v.panL*v.send;b.sendR+=x*v.panR*v.send;}
      }
      this.mix.process(b,params,this.frames);
      const view=this.views[this.context==='overview'?'mix':this.context]??this.views.mix;
      this.left=view.left;this.right=view.right;
      this.stats.maxVoices=Math.max(this.stats.maxVoices,this.voices.length);this.stats.maxDrums=Math.max(this.stats.maxDrums,this.drums.length);
      if(this.onSample)this.onSample(this.frames,this.views,this.buses);
      this.frames++;this.beats=this.liveTempoChanged?this.beats+this.piece.tempo/(rate*60):this.frames*this.piece.tempo/(rate*60);
  }
}
