import {mixRetroSeed} from '../retro-styles.mjs';
import {prepareCozyInstruments,createCozyTone,sampleCozyTone,createCozyDrum,sampleCozyDrum} from './retro-cozy-instruments.mjs';
const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
class Room {
  constructor(rate){
    this.lines=[.0671,.0797,.0973,.1139,.0719,.0833,.1013,.1277].map(t=>({data:new Float32Array(Math.ceil(rate*t)),index:0,low:0,coefficient:1-Math.exp(-TAU*2300/rate)}));
    this.allpass=[.0113,.0157].map(t=>({data:new Float32Array(Math.ceil(rate*t)),index:0}));this.left=this.right=0;
  }
  sample(left,right,amount){
    let l=0,r=0;
    for(let i=0;i<8;i++){
      const line=this.lines[i],value=line.data[line.index];line.low+=line.coefficient*(value-line.low);
      
      line.data[line.index]=(i<4?left:right)*.17+line.low*(.61+.16*amount);
      line.index=(line.index+1)%line.data.length;if(i<4)l+=value;else r+=value;
    }
    for(let i=0;i<2;i++){
      const line=this.allpass[i],input=i? r:l,delayed=line.data[line.index],output=delayed-.45*input;
      line.data[line.index]=input+.45*output;line.index=(line.index+1)%line.data.length;if(i)r=output;else l=output;
    }
    this.left=l*.5;this.right=r*.5;
  }
}
export class CozyRetroSoundscape {
  constructor(rate,plan,seed){
    this.sampleRate=rate;this.plan=plan;this.seed=seed;this.character=plan.style;
    this.voices=[];this.drums=[];this.beats=0;this.step=0;this.nextStepBeat=0;this.serial=0;
    prepareCozyInstruments(Object.values(this.character.instruments));
    this.room=new Room(rate);
    this.delayL=new Float32Array(Math.ceil(rate*.8));this.delayR=new Float32Array(this.delayL.length);this.delayIndex=0;
    this.lowL=this.lowR=this.dcL=this.dcR=this.wetLowL=this.wetLowR=0;
    this.cutoff=1-Math.exp(-TAU*3500/rate);this.cutoffStep=0;
    this.wetHighpass=1-Math.exp(-TAU*220/rate);this.dcCoefficient=1-Math.exp(-TAU*18/rate);
    this.left=this.right=0;this.maxVoices=0;
  }
  add(event,tempo){
    const rate=this.sampleRate,duration=event.beats*60/tempo,delay=Math.round((event.delay??0)*60/tempo*rate);
    if(event.drum){
      
      if(this.character.synthesis.authentic)for(const old of this.drums)old.retire=Math.min(old.retire??Infinity,old.age+Math.ceil(rate*.003));
      if(this.drums.length<8){const v=createCozyDrum(event,rate,duration,mixRetroSeed(this.seed^this.serial++));v.age=-delay;this.drums.push(v);}
      return;
    }
    const tone=createCozyTone(event,rate,duration,mixRetroSeed(this.seed^this.serial++)/4294967296);if(!tone)return;
    const channel=event.channel;
    
    if(channel)for(const old of this.voices)if(old.channel===channel)old.retire=Math.min(old.retire,old.age+Math.ceil(rate*.008));
    if(this.voices.length>=32)return;
    tone.age=-delay;this.voices.push(tone);this.maxVoices=Math.max(this.maxVoices,this.voices.length);
  }
  sample(params,frame){
    const rate=this.sampleRate,c=this.character,e=c.effects,authentic=c.synthesis.authentic;
    if(frame%128===0){
      const hz=Math.min(rate*.38,((2600+4800*e.brightness)*(1-params.warmth*.006)));
      this.cutoffStep=(1-Math.exp(-TAU*hz/rate)-this.cutoff)/128;
    }
    this.cutoff+=this.cutoffStep;
    while(this.beats>=this.nextStepBeat){for(const event of this.plan.events(this.step))this.add(event,params.tempo);this.step++;this.nextStepBeat+=.25;}
    this.beats+=params.tempo/(60*rate);
    let l=0,r=0,sendL=0,sendR=0;const width=params.width/100*e.width;
    for(let i=this.voices.length-1;i>=0;i--){
      const v=this.voices[i],age=v.age/rate;
      if(age>=v.duration||v.age>=v.retire){this.voices.splice(i,1);continue;}
      if(age<0){v.age++;continue;}
      sampleCozyTone(v,age,params.warmth/100,params.drift/100,e.chorus,authentic);
      const retirement=Number.isFinite(v.retire)?ease((v.retire-v.age)/(rate*.008)):1,
        level=params[v.role]/100*v.amplitude*retirement,
        pan=v.role==='bass'?0:v.pan*width*clamp((v.frequency-150)/180,0,1),
        mid=(v.left+v.right)*.5,side=(v.left-v.right)*.5*width,
        a=(mid+side)*level*(1-pan)*Math.SQRT1_2,b=(mid-side)*level*(1+pan)*Math.SQRT1_2;
      l+=a;r+=b;const send=v.send??(v.role==='bass'?0:.55);sendL+=a*send;sendR+=b*send;v.age++;
    }
    for(let i=this.drums.length-1;i>=0;i--){
      const v=this.drums[i],age=v.age/rate;
      if(age>=v.duration||v.age>=(v.retire??Infinity)){this.drums.splice(i,1);continue;}
      if(age<0){v.age++;continue;}
      const retirement=Number.isFinite(v.retire)?ease((v.retire-v.age)/(rate*.003)):1,
        value=sampleCozyDrum(v,age)*v.amplitude*params.percussion/100*retirement;l+=value;r+=value;
      sendL+=value*.08;sendR+=value*.08;v.age++;
    }
    
    const ambience=params.ambience/100,room=e.room*ambience;
    this.room.sample(sendL,sendR,e.room);
    const delayFrames=Math.min(this.delayL.length-1,Math.round(rate*60/params.tempo*.75)),
      read=(this.delayIndex-delayFrames+this.delayL.length)%this.delayL.length,
      dl=this.delayL[read],dr=this.delayR[read];
    this.delayL[this.delayIndex]=sendR*.38+dr*.27;this.delayR[this.delayIndex]=sendL*.38+dl*.27;
    this.delayIndex=(this.delayIndex+1)%this.delayL.length;
    let wl=this.room.left*room*1.8+dl*e.delay*ambience,wr=this.room.right*room*1.8+dr*e.delay*ambience;
    
    this.wetLowL+=this.wetHighpass*(wl-this.wetLowL);this.wetLowR+=this.wetHighpass*(wr-this.wetLowR);
    wl-=this.wetLowL;wr-=this.wetLowR;
    const wetMid=(wl+wr)*.5,wetSide=(wl-wr)*.5*params.width/100;l+=wetMid+wetSide;r+=wetMid-wetSide;
    this.lowL+=this.cutoff*(l-this.lowL);this.lowR+=this.cutoff*(r-this.lowR);
    this.dcL+=this.dcCoefficient*(this.lowL-this.dcL);this.dcR+=this.dcCoefficient*(this.lowR-this.dcR);
    
    l=this.lowL-this.dcL;r=this.lowR-this.dcR;const gain=1/(1+.2*Math.max(Math.abs(l),Math.abs(r)));
    this.left=l*gain;this.right=r*gain;return this;
  }
}
