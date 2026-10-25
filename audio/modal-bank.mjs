import {TonalBank} from './tonal-bank.mjs';
export class ModalBank extends TonalBank{
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