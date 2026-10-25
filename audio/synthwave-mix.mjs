const TAU=Math.PI*2;
const lp=(hz,rate)=>1-Math.exp(-TAU*Math.min(hz,rate*.35)/rate);
function read(buffer,frame,delay){const pos=((frame-delay)%buffer.length+buffer.length)%buffer.length,i=Math.floor(pos),f=pos-i;return buffer[i]*(1-f)+buffer[(i+1)%buffer.length]*f;}

// A separate production bus for additions only. Legacy characters never enter it.
export class SynthwaveMix {
  constructor(rate,character){
    this.rate=rate;this.colour=character.synthwaveWriting.mix;
    this.chorusL=new Float32Array(Math.ceil(rate*.05));this.chorusR=new Float32Array(this.chorusL.length);
    this.delayL=new Float32Array(Math.ceil(rate*2));this.delayR=new Float32Array(this.delayL.length);
    this.predelay=new Float32Array(Math.ceil(rate*.06));
    this.lines=[.0311,.0379,.0437,.0533].map((seconds,i)=>({buffer:new Float32Array(Math.max(3,Math.round(rate*seconds)|1)),low:0,
      feedback:10**(-3*seconds/(this.colour.decay??2.2))}));
    this.diffusers=[.0067,.0093].map(t=>new Float32Array(Math.max(3,Math.round(rate*t)|1)));
    this.damp=lp(4700,rate);this.high=lp(220,rate);this.low=lp(125,rate);this.dc=lp(22,rate);
    this.delayFilter=lp(4300,rate);this.attack=Math.exp(-1/(rate*.012));this.release=Math.exp(-1/(rate*.18));
    this.clear();
  }
  clear(){
    for(const b of [this.chorusL,this.chorusR,this.delayL,this.delayR,this.predelay,...this.diffusers])b.fill(0);
    for(const line of this.lines){line.buffer.fill(0);line.low=0;}
    this.sendHigh=this.delayLowL=this.delayLowR=this.sideLow=this.dcL=this.dcR=this.envelope=this.kickEnvelope=0;
    this.left=this.right=0;
  }
  process(l,r,bass,drums,hatSide,sendL,sendR,drumRoom,p,frame){
    const rate=this.rate,space=p.space/100,mix=this.colour;
    if(frame%32===0||this.chorusTimeL===undefined){
      this.chorusTimeL=rate*(.016+.003*Math.sin(TAU*frame/rate*.29));
      this.chorusTimeR=rate*(.021+.004*Math.sin(TAU*frame/rate*.23+1.7));
      this.kickRelease=Math.exp(-1/(rate*Math.max(.065,60/p.tempo*.22)));
    }
    const duck=1-this.kickEnvelope*p.pump/100*.8;
    this.kickEnvelope*=this.kickRelease;
    l*=duck;r*=duck;bass*=1-(1-duck)*.78;
    const ci=frame%this.chorusL.length,cl=read(this.chorusL,frame,this.chorusTimeL),cr=read(this.chorusR,frame,this.chorusTimeR);
    this.chorusL[ci]=l;this.chorusR[ci]=r;
    l+=cl*space*.32;r+=cr*space*.32;
    const delay=rate*60/p.tempo*(mix.delayBeats??.75),dl=read(this.delayL,frame,delay),dr=read(this.delayR,frame,delay*4/3);
    this.delayLowL+=this.delayFilter*(dl-this.delayLowL);this.delayLowR+=this.delayFilter*(dr-this.delayLowR);
    const di=frame%this.delayL.length;
    this.delayL[di]=sendR*.7+this.delayLowR*.32;this.delayR[di]=sendL*.7+this.delayLowL*.32;
    l+=this.delayLowL*space*(mix.delay??.5)*duck;r+=this.delayLowR*space*(mix.delay??.5)*duck;
    let input=(l+r)*.5+drumRoom*(mix.drumRoom??.3);
    this.sendHigh+=this.high*(input-this.sendHigh);input-=this.sendHigh;
    const pred=read(this.predelay,frame,rate*.023);this.predelay[frame%this.predelay.length]=input;input=pred;
    for(const buffer of this.diffusers){const i=frame%buffer.length,y=buffer[i]-input*.65;buffer[i]=input+y*.65;input=y;}
    // Orthogonal four-line feedback network. Per-line gains set a common T60.
    const a=this.lines[0],b=this.lines[1],c=this.lines[2],d=this.lines[3];
    for(const line of this.lines)line.low+=this.damp*(line.buffer[frame%line.buffer.length]-line.low);
    const x=a.low,y=b.low,z=c.low,w=d.low;
    a.buffer[frame%a.buffer.length]=input*.35+(x+y+z+w)*.5*a.feedback;
    b.buffer[frame%b.buffer.length]=input*.35+(x-y+z-w)*.5*b.feedback;
    c.buffer[frame%c.buffer.length]=input*.35+(x+y-z-w)*.5*c.feedback;
    d.buffer[frame%d.buffer.length]=input*.35+(x-y-z+w)*.5*d.feedback;
    const wet=space*(mix.reverb??.75)*duck;
    l+=(x+z-y*.35)*wet;r+=(y+w-x*.35)*wet;
    let mid=(l+r)*.5+bass+drums,side=((l-r)*.5+hatSide)*p.width/100;
    // Keep stereo ambience out of the sub range, including delay/reverb tails.
    this.sideLow+=this.low*(side-this.sideLow);side-=this.sideLow;
    l=mid+side;r=mid-side;
    this.dcL+=this.dc*(l-this.dcL);this.dcR+=this.dc*(r-this.dcR);l-=this.dcL;r-=this.dcR;
    // Linked, fixed-threshold gentle bus compression. No gain chasing or AGC.
    const peak=Math.max(Math.abs(l),Math.abs(r)),coefficient=peak>this.envelope?this.attack:this.release;
    this.envelope=peak+(this.envelope-peak)*coefficient;
    const gain=this.envelope>.17?(.17+(this.envelope-.17)/2)/this.envelope:1,trim=mix.trim??1.45;
    this.left=.58*Math.tanh(l*gain*trim/.58);this.right=.58*Math.tanh(r*gain*trim/.58);
  }
}
