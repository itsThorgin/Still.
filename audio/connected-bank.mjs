import {TonalBank} from './tonal-bank.mjs';
import {tonalMode} from './phrase-plan.mjs';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export class ConnectedBank extends TonalBank{
  constructor(rate,c,seed){
    super(rate,c.technoProduction.family==='minimal'?7:tonalMode(c.technoProduction.family),seed^c.value*811);
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

        const attack=smooth(old.age/old.attackFrames),body=old.spec.sustain+(1-old.spec.sustain)*old.decayLevel,
          natural=old.startGain*(1-attack)+body*attack;
        if(natural>1e-12)old.amplitude*=old.gain/natural;
        old.endFrame=Math.min(old.endFrame,old.age+Math.round(this.rate*.045));old.releaseFrames=old.endFrame-old.age;this.retirements++;
      }
    }
    super.sample(...args);
  }
}
