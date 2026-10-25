import {filter,tickFilter,clamp} from './bass-production-instruments.mjs';
const TAU=Math.PI*2;
function read(buffer,frame,delay){const pos=((frame-delay)%buffer.length+buffer.length)%buffer.length,i=Math.floor(pos),f=pos-i;return buffer[i]*(1-f)+buffer[(i+1)%buffer.length]*f;}
export class BassProductionMix{
  constructor(rate,p){
    this.rate=rate;this.p=p;this.left=this.right=0;this.kickEnvelope=0;
    this.delayL=new Float32Array(Math.ceil(rate*2));this.delayR=new Float32Array(this.delayL.length);
    this.rooms=[.0297,.0371,.0411,.0539].map(t=>({buffer:new Float32Array(Math.max(3,Math.round(rate*t)|1)),low:0,
      gain:10**(-3*t/(p.family==='atmospheric'?2.8:p.family==='melodic'?2:.9))}));
    this.sendHP=filter('highpass',280,.707,rate);this.delayLP1=filter('lowpass',4200,.707,rate);this.delayLP2=filter('lowpass',4200,.707,rate);
    this.delayHP1=filter('highpass',260,.707,rate);this.delayHP2=filter('highpass',260,.707,rate);
    this.tonalL=filter('highpass',150,.707,rate);this.tonalR=filter('highpass',150,.707,rate);
    this.sideHP=[filter('highpass',210,.5412,rate),filter('highpass',210,1.3066,rate)];
    this.dcL=filter('highpass',24,.707,rate);this.dcR=filter('highpass',24,.707,rate);
    this.peak=0;this.limiterGain=1;this.compressorGain=1;this.sceneLow=1;this.gate=1;this.width=1;
    this.lookL=new Float32Array(Math.max(2,Math.round(rate*.0015)));this.lookR=new Float32Array(this.lookL.length);
    this.roomDamp=1-Math.exp(-TAU*Math.min(5000,rate*.3)/rate);
    this.sceneC=1-Math.exp(-1/(rate*.004));this.release=Math.exp(-1/(rate*.12));
    this.duckRelease=Math.exp(-1/(rate*p.recovery));
  }
  process(l,r,sub,upperL,upperR,drumsL,drumsR,sendL,sendR,room,p,scene,frame){
    const c=this.sceneC,mix=this.p;
    this.gate+=c*((scene.gate??1)-this.gate);this.sceneLow+=c*((scene.low??1)-this.sceneLow);
    this.width+=c*((scene.width??1)-this.width);
    if(frame%32===0){this.duckRelease=Math.exp(-1/(this.rate*mix.recovery*clamp(140/p.tempo,.7,1.2)));}
    const amount=p.pump/100,duck=1-this.kickEnvelope*amount*mix.duck;
    this.kickEnvelope*=this.duckRelease;
    l=tickFilter(this.tonalL,l)* (1-(1-duck)*.4);r=tickFilter(this.tonalR,r)*(1-(1-duck)*.4);
    sub*=duck*this.sceneLow;upperL*=1-(1-duck)*.65;upperR*=1-(1-duck)*.65;
    const space=p.space/100*mix.space,delay=this.rate*60/p.tempo*(mix.family==='deep'?.75:.5);
    const dl=tickFilter(this.delayLP1,read(this.delayL,frame,delay)),dr=tickFilter(this.delayLP2,read(this.delayR,frame,delay*1.5));
    const di=frame%this.delayL.length;
    this.delayL[di]=tickFilter(this.delayHP1,sendR)*.28+dr*.32;this.delayR[di]=tickFilter(this.delayHP2,sendL)*.28+dl*.32;
    
    const input=tickFilter(this.sendHP,(sendL+sendR)*.5+room*.13);
    const [a,b,d,e]=this.rooms;
    for(const line of this.rooms)line.low+=this.roomDamp*(line.buffer[frame%line.buffer.length]-line.low);
    const x=a.low,y=b.low,z=d.low,w=e.low;
    a.buffer[frame%a.buffer.length]=input*.3+(x+y+z+w)*.5*a.gain;
    b.buffer[frame%b.buffer.length]=input*.3+(x-y+z-w)*.5*b.gain;
    d.buffer[frame%d.buffer.length]=input*.3+(x+y-z-w)*.5*d.gain;
    e.buffer[frame%e.buffer.length]=input*.3+(x-y-z+w)*.5*e.gain;
    l+=(dl+x+z*.6)*space;r+=(dr+y+w*.6)*space;
    l+=upperL+drumsL;r+=upperR+drumsR;
    let mid=(l+r)*.5+sub,side=(l-r)*.5*p.width/100*this.width;
    for(const f of this.sideHP)side=tickFilter(f,side);
    l=tickFilter(this.dcL,(mid+side)*this.gate);r=tickFilter(this.dcR,(mid-side)*this.gate);
    
    const peak=Math.max(Math.abs(l),Math.abs(r)),envelopeC=peak>this.peak?Math.exp(-1/(this.rate*.015)):this.release;
    this.peak=peak+(this.peak-peak)*envelopeC;
    const comp=this.peak>.44?(.44+(this.peak-.44)/1.6)/this.peak:1;
    l*=comp*mix.trim;r*=comp*mix.trim;
    
    const target=Math.min(1,.62/Math.max(Math.abs(l),Math.abs(r),1e-12));
    this.limiterGain=target<this.limiterGain?target:1+(this.limiterGain-1)*this.release;
    const li=frame%this.lookL.length,oldL=this.lookL[li],oldR=this.lookR[li];this.lookL[li]=l;this.lookR[li]=r;
    const guard=Math.min(this.limiterGain,.62/Math.max(Math.abs(oldL),Math.abs(oldR),1e-12));
    this.left=oldL*guard;this.right=oldR*guard;
  }
}
