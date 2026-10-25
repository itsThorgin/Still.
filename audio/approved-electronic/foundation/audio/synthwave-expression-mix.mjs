import {SynthwaveMix} from './synthwave-mix.mjs';
import {synthwaveExpressionColour} from './synthwave-expression-colours.mjs';
const TAU=Math.PI*2;
function read(b,f,d){const x=((f-d)%b.length+b.length)%b.length,i=Math.floor(x),t=x-i;return b[i]*(1-t)+b[(i+1)%b.length]*t;}

// Shared foreground shaping for both the original effect path and the newer
// production bus. Dry bass/drums stay outside this stage.
export class SynthwaveForeground{
  constructor(rate,colour){
    this.rate=rate;this.colour=colour;this.left=this.right=0;this.leadPresence=0;
    this.earlyL=new Float32Array(Math.ceil(rate*.05));this.earlyR=new Float32Array(this.earlyL.length);
    this.earlyLowL=this.earlyLowR=0;this.presenceAttack=1-Math.exp(-1/(rate*.018));this.presenceRelease=1-Math.exp(-1/(rate*.22));
    this.earlyHigh=1-Math.exp(-TAU*380/rate);
  }
  clear(){this.earlyL.fill(0);this.earlyR.fill(0);this.leadPresence=this.earlyLowL=this.earlyLowR=this.left=this.right=0;}
  process(l,r,p,frame,leadL,leadR,padL,padR){
    const c=this.colour,peak=Math.max(Math.abs(leadL),Math.abs(leadR));
    this.leadPresence+=(peak-this.leadPresence)*(peak>this.leadPresence?this.presenceAttack:this.presenceRelease);
    const padGain=c.pad*(1-c.padDuck*Math.min(1,this.leadPresence/.045));
    l=leadL*c.lead+padL*padGain+(l-leadL-padL)*c.arp;
    r=leadR*c.lead+padR*padGain+(r-leadR-padR)*c.arp;
    const index=frame%this.earlyL.length,
      a=read(this.earlyL,frame,this.rate*.022),b=read(this.earlyR,frame,this.rate*.031);
    this.earlyLowL+=this.earlyHigh*(leadL-this.earlyLowL);this.earlyLowR+=this.earlyHigh*(leadR-this.earlyLowR);
    this.earlyL[index]=leadR-this.earlyLowR;this.earlyR[index]=leadL-this.earlyLowL;
    l+=a*c.early*p.space/100;r+=b*c.early*p.space/100;
    this.left=l;this.right=r;
  }
}

export class ExpressiveSynthwaveMix extends SynthwaveMix{
  constructor(rate,character){
    const c=synthwaveExpressionColour(character.value),mix=character.synthwaveWriting.mix;
    super(rate,{...character,synthwaveWriting:{...character.synthwaveWriting,mix:{...mix,
      reverb:mix.reverb*c.room,decay:mix.decay*c.decay,delay:mix.delay*c.delay}}});
    this.foreground=new SynthwaveForeground(rate,c);
  }
  clear(){super.clear();this.foreground?.clear();}
  process(l,r,bass,drums,hatSide,sendL,sendR,drumRoom,p,frame,leadL=0,leadR=0,padL=0,padR=0){
    this.foreground.process(l,r,p,frame,leadL,leadR,padL,padR);
    super.process(this.foreground.left,this.foreground.right,bass,drums,hatSide,sendL,sendR,drumRoom,p,frame);
  }
}
