

import {createElectronicTone} from './electronic-instruments.mjs';
import {gardenHash} from '../garden-options.mjs';
import {tonalMacro} from './tonal-plan.mjs';
const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const sine=x=>Math.sin(TAU*x);
function lookup(t,p){const x=(p-Math.floor(p))*(t.length-1),i=Math.floor(x),f=x-i;return t[i]+(t[i+1]-t[i])*f;}
const specs={
  pulse:{attack:.026,release:.13,decay:.17,sustain:.16,ceiling:1500,spread:.0022,remove:.13,air:.008},
  chord:{attack:.035,release:.28,decay:.24,sustain:.18,ceiling:1900,spread:.0030,remove:.11,air:.008},
  lead:{attack:.095,release:.20,decay:.65,sustain:.62,ceiling:2800,spread:.0036,remove:.17,air:.010},
  bed:{attack:.85,release:1.0,decay:8,sustain:.76,ceiling:1700,spread:.0040,remove:.05,air:.012},
};
function makeVoice(cue,rate,tempo,identity){
  const spec=specs[cue.type],reserve=cue.type==='lead'?1.6:1.02,
    base=createElectronicTone({...cue,instrument:cue.type==='bed'?'silk-pad':'wide-pad',frequency:cue.frequency*reserve},rate,cue.beats*60/tempo,identity);
  if(!base)return null;
  const gateFrames=Math.max(1,Math.round(cue.beats*60/tempo*rate)),releaseFrames=Math.round(spec.release*rate);
  return {...base,...cue,spec,frequency:cue.frequency,frequencyNow:cue.frequency,rate,gateFrames,releaseFrames,
    attackFrames:Math.max(1,Math.round(spec.attack*rate)),endFrame:gateFrames+releaseFrames,
    age:-Math.round((cue.delay??0)*60/tempo*rate),gain:0,startGain:0,connected:false,
    phase:identity,phase2:(identity+.07)%1,phase3:(identity+.16)%1,
    noiseState:Math.floor(identity*4294967295)||1,airLow:0,airDc:0,hpL:0,hpR:0,
    filterL:0,filterR:0,filter2L:0,filter2R:0,coefficient:.08,coefficientStep:0,pitchRatio:1,
    decayLevel:1,decayRate:Math.exp(-1/(rate*spec.decay)),retire:null};
}
export class TonalRoom{
  constructor(rate,id){
    this.rate=rate;this.id=id;this.left=this.right=0;
    this.delayL=new Float32Array(Math.ceil(rate*2));this.delayR=new Float32Array(this.delayL.length);
    this.rooms=[.0239,.0317,.0413,.0531].map(t=>({buffer:new Float32Array(Math.round(rate*t)),low:0}));
    this.inputL=this.inputR=this.inputDcL=this.inputDcR=this.returnDcL=this.returnDcR=0;
    this.hp=1-Math.exp(-TAU*310/rate);this.lp=1-Math.exp(-TAU*(id===1?2300:3400)/rate);
    this.feedback=id===1?.84:id===7?.81:.78;
  }
  read(buffer,frame,delay){const pos=((frame-delay)%buffer.length+buffer.length)%buffer.length,i=Math.floor(pos),f=pos-i;return buffer[i]*(1-f)+buffer[(i+1)%buffer.length]*f;}
  sample(l,r,frame,params,kick){
    this.inputL+=this.lp*(l-this.inputL);this.inputR+=this.lp*(r-this.inputR);
    this.inputDcL+=this.hp*(this.inputL-this.inputDcL);this.inputDcR+=this.hp*(this.inputR-this.inputDcR);
    const inputL=this.inputL-this.inputDcL,inputR=this.inputR-this.inputDcR,index=frame%this.delayL.length;
    this.delayL[index]=inputL;this.delayR[index]=inputR;
    const beat=this.rate*60/params.tempo,motion=params.movement/100*this.rate*.00055*sine(frame/this.rate*.19);
    const earlyL=this.read(this.delayR,frame,beat*.125+motion)*.42+this.read(this.delayL,frame,beat*.375-motion)*.25+this.read(this.delayR,frame,beat*.75)*.13;
    const earlyR=this.read(this.delayL,frame,beat*.125-motion)*.42+this.read(this.delayR,frame,beat*.375+motion)*.25+this.read(this.delayL,frame,beat*.75)*.13;
    const rooms=this.rooms;
    for(const line of rooms)line.low+=this.lp*(line.buffer[frame%line.buffer.length]-line.low);
    const a=rooms[0].low,b=rooms[1].low,c=rooms[2].low,d=rooms[3].low,input=(inputL+inputR)*.19,g=.5*this.feedback;
    rooms[0].buffer[frame%rooms[0].buffer.length]=input+(a+b+c+d)*g;
    rooms[1].buffer[frame%rooms[1].buffer.length]=input+(a-b+c-d)*g;
    rooms[2].buffer[frame%rooms[2].buffer.length]=input+(a+b-c-d)*g;
    rooms[3].buffer[frame%rooms[3].buffer.length]=input+(a-b-c+d)*g;
    const wetL=earlyL+(a+c)*.55,wetR=earlyR+(b+d)*.55;
    this.returnDcL+=this.hp*(wetL-this.returnDcL);this.returnDcR+=this.hp*(wetR-this.returnDcR);
    const duck=1-kick*(this.id===1?.22:.32)*params.pump/100,gain=Math.sqrt(params.space/100)*duck;
    this.left=gain===0?0:(wetL-this.returnDcL)*gain;this.right=gain===0?0:(wetR-this.returnDcR)*gain;
  }
}
export class TonalBank{
  constructor(rate,id,seed){
    this.rate=rate;this.id=id;this.seed=seed;this.serial=0;this.voices=[];this.lead=null;
    this.space=new TonalRoom(rate,id);this.left=this.right=this.dryL=this.dryR=this.sendL=this.sendR=0;
    this.hp=1-Math.exp(-TAU*180/rate);this.airLP=1-Math.exp(-TAU*Math.min(4200,rate*.3)/rate);
    this.airHP=1-Math.exp(-TAU*650/rate);this.glide=1-Math.exp(-1/(rate*.045));
    this.macro={level:.2,colour:.2};this.scheduled=0;
  }
  add(cue,tempo){
    if(this.voices.length>=24)return;
    const v=makeVoice(cue,this.rate,tempo,gardenHash(this.seed^0xc04e51,this.serial++)/4294967296);if(!v)return;
    if(cue.type==='lead'&&cue.connect&&this.lead&&this.lead.age<this.lead.endFrame){
      const old=this.lead,ratio=old.frequencyNow/v.frequency;
      if(old.age-old.gateFrames<this.rate*.16&&old.gain>.015&&ratio>.66&&ratio<1.5){
        for(const key of ['phase','phase2','phase3','filterL','filterR','filter2L','filter2R','hpL','hpR','coefficient'])v[key]=old[key];
        v.frequencyNow=old.frequencyNow;v.startGain=old.gain*old.amplitude/v.amplitude;v.connected=true;
        v.attackFrames=Math.round(this.rate*.035);old.endFrame=old.age;
      }
    }
    if(cue.type==='lead')this.lead=v;
    this.voices.push(v);this.scheduled++;
  }
  sample(params,frame,beats,scene,kick){
    const rate=this.rate,movement=params.movement/100,brightness=params.brightness/100;
    if(frame%32===0){this.macro=tonalMacro(this.id,beats/4);}
    let l=0,r=0;
    for(let i=this.voices.length-1;i>=0;i--){
      const v=this.voices[i];if(v.age>=v.endFrame){this.voices.splice(i,1);continue;}
      if(v.age<0){v.age++;continue;}
      const age=v.age/rate,s=v.spec;
      if(frame%32===0||v.age===0){
        const colour=this.id===3?.58+.20*sine(beats/3.75):.78+.10*sine(beats/16);
        const cutoff=Math.min(rate*.28,300+s.ceiling*(.25+.75*brightness)*(.27+.73*this.macro.colour)*colour);
        const target=1-Math.exp(-TAU*cutoff/rate);v.coefficientStep=(target-v.coefficient)/32;
        const vibrato=v.type==='lead'?movement*2.5*smooth((age-.28)/.4)*sine(frame/rate*5.1):0;
        v.pitchRatio=2**(vibrato/1200);v.spread=s.spread*(1+movement*.13*sine(beats/13+this.id));
      }
      v.coefficient+=v.coefficientStep;v.frequencyNow+=(v.frequency-v.frequencyNow)*this.glide;
      const a=lookup(v.table,v.phase),b=lookup(v.table,v.phase2),c=lookup(v.table,v.phase3),fund=sine(v.phase)*s.remove;
      let state=v.noiseState;state^=state<<13;state^=state>>>17;state^=state<<5;v.noiseState=state>>>0;
      v.airLow+=this.airLP*(v.noiseState/2147483648-1-v.airLow);v.airDc+=this.airHP*(v.airLow-v.airDc);
      const air=(v.airLow-v.airDc)*s.air;
      const left=a*.50+b*.30+c*.20-fund+air,right=a*.50+b*.20+c*.30-fund-air*.7;
      v.filterL+=v.coefficient*(left-v.filterL);v.filterR+=v.coefficient*(right-v.filterR);
      v.filter2L+=v.coefficient*(v.filterL-v.filter2L);v.filter2R+=v.coefficient*(v.filterR-v.filter2R);
      v.hpL+=this.hp*(v.filter2L-v.hpL);v.hpR+=this.hp*(v.filter2R-v.hpR);
      const attack=smooth(v.age/v.attackFrames),release=smooth((v.endFrame-v.age)/v.releaseFrames),body=s.sustain+(1-s.sustain)*v.decayLevel;
      v.gain=(v.startGain*(1-attack)+body*attack)*release;v.decayLevel*=v.decayRate;
      const macro=v.type==='bed'?.50+this.macro.level*.50:this.macro.level,
        sceneGain=v.type==='bed'?.55+scene.texture*.45:this.id===1?scene.chords:scene.motif,
        lowRoom=this.id===7&&scene.kick===0?.58:1,
        gain=v.gain*v.amplitude*params[v.role]/100*macro*sceneGain*lowRoom*(1-kick*.10*params.pump/100);
      l+=(v.filter2L-v.hpL)*gain*Math.sqrt(1-v.pan);r+=(v.filter2R-v.hpR)*gain*Math.sqrt(1+v.pan);
      const step=v.frequencyNow/rate*v.pitchRatio;
      v.phase=(v.phase+step)%1;v.phase2=(v.phase2+step*(1+v.spread))%1;v.phase3=(v.phase3+step*(1-v.spread))%1;v.age++;
    }

    const trim=this.id===3?12.5:this.id===7?4.5:11.7;l*=trim;r*=trim;
    this.space.sample(l,r,frame,params,kick);
    const dry=this.id===1?.72:this.id===7?.78:.72,wet=this.id===1?.75:.55;
    this.dryL=l*dry;this.dryR=r*dry;
    this.left=this.dryL+this.space.left*wet;this.right=this.dryR+this.space.right*wet;
    this.sendL=l*(this.id===1?1.35:1.05);this.sendR=r*(this.id===1?1.35:1.05);
  }
}
