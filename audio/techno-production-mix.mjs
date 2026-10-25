import {TAU,clamp,soft,sine} from './techno-production-instruments.mjs';


export class TechnoProductionMix{
  constructor(rate,p){
    this.rate=rate;this.p=p;this.left=this.right=0;this.kickEnvelope=0;
    this.delayL=new Float32Array(Math.ceil(rate*3));this.delayR=new Float32Array(this.delayL.length);
    this.delayLowL=this.delayLowR=this.delayDcL=this.delayDcR=0;
    this.delayTimeL=this.delayTimeR=rate*.3;this.feedback=p.effects.feedback;
    this.rooms=[.0311,.0437,.0593,.0719].map(t=>({buffer:new Float32Array(Math.max(5,Math.round(t*rate))),index:0,low:0,value:0}));
    this.rumbleLines=[.047,.073,.109].map(t=>({buffer:new Float32Array(Math.max(5,Math.round(t*rate))),index:0}));
    this.rumbleLow=this.rumbleDc=this.rumbleShape=0;
    this.sideLow1=this.sideLow2=this.sideLow3=this.sideLow4=0;this.highL=this.highR=this.dcL=this.dcR=0;
    this.lowCut=1-Math.exp(-TAU*24/rate);this.sideCut=1-Math.exp(-TAU*190/rate);
    this.rumbleLP=1-Math.exp(-TAU*p.rumble.cutoff/rate);this.rumbleHP=1-Math.exp(-TAU*37/rate);
    this.effectsHP=1-Math.exp(-TAU*260/rate);this.delayLP=1-Math.exp(-TAU*p.effects.damping/rate);
    this.roomLP=1-Math.exp(-TAU*Math.min(5500,rate*.32)/rate);
    this.masterLP=1-Math.exp(-TAU*Math.min(16000,rate*.42)/rate);
    this.returnL=this.returnR=0;this.wet=0;
  }
  read(buffer,frame,delay){const x=((frame-delay)%buffer.length+buffer.length)%buffer.length,i=Math.floor(x),f=x-i;return buffer[i]*(1-f)+buffer[(i+1)%buffer.length]*f;}
  process(l,r,bass,drumL,drumR,kick,sendL,sendR,params,scene,frame,beats){
    const p=this.p,rate=this.rate,space=params.space/100,movement=params.movement/100;
    if(frame%32===0){
      this.release=Math.exp(-1/(rate*60/params.tempo*.22));
      this.targetDelay=clamp(rate*60/params.tempo*p.effects.delayBeats,rate*.025,this.delayL.length-rate*.03);
      const motion=movement*(.5+.5*sine(beats/(p.automation.bars*4)));
      this.feedbackTarget=clamp(p.effects.feedback+motion*.055+scene.tension*.025,0,.79);
      this.roomFeedback=Math.min(.86,10**(-3*.052/p.effects.decay));
    }
    this.kickEnvelope*=this.release??.999;
    const duck=1-this.kickEnvelope*p.mix.duck*params.pump/100;
    const rumbleDuck=1-this.kickEnvelope*p.rumble.duck;
    
    let rumble=0;
    if(p.rumble.amount>0){
      let diffuse=0;for(const line of this.rumbleLines){const y=line.buffer[line.index];diffuse+=y/3;
        line.buffer[line.index]=soft(kick*1.4+y*p.rumble.decay*.76);line.index=(line.index+1)%line.buffer.length;}
      this.rumbleLow+=this.rumbleLP*(soft(diffuse*2.3)-this.rumbleLow);
      this.rumbleDc+=this.rumbleHP*(this.rumbleLow-this.rumbleDc);
      this.rumbleShape+=this.rumbleLP*((this.rumbleLow-this.rumbleDc)-this.rumbleShape);
      rumble=this.rumbleShape*p.rumble.amount*rumbleDuck*params.percussion/100*(.55+.45*scene.bass);
    }
    bass*=duck*(1-p.rumble.amount*.65);
    l*=1-(1-duck)*.42;r*=1-(1-duck)*.42;
    this.delayTimeL+=(this.targetDelay-this.delayTimeL)*.00005;
    this.delayTimeR+=(this.targetDelay*(p.family==='dub'?4/3:1.003)-this.delayTimeR)*.00005;
    const flutter=movement*rate*.00035*sine(frame/rate*.19);
    const a=this.read(this.delayL,frame,this.delayTimeL+flutter),b=this.read(this.delayR,frame,this.delayTimeR-flutter);
    this.delayLowL+=this.delayLP*(a-this.delayLowL);this.delayLowR+=this.delayLP*(b-this.delayLowR);
    this.delayDcL+=this.effectsHP*(this.delayLowL-this.delayDcL);this.delayDcR+=this.effectsHP*(this.delayLowR-this.delayDcR);
    const echoL=this.delayLowL-this.delayDcL,echoR=this.delayLowR-this.delayDcR;
    this.feedback+=(this.feedbackTarget-this.feedback)*.00015;
    const index=frame%this.delayL.length;
    const sendSpace=Math.sqrt(space);
    this.delayL[index]=soft(sendL*sendSpace+echoR*this.feedback);
    this.delayR[index]=soft(sendR*sendSpace+echoL*this.feedback);

    const rooms=this.rooms;
    for(const line of rooms){line.low+=this.roomLP*(line.buffer[line.index]-line.low);line.value=line.low;}
    const x=rooms[0].value,y=rooms[1].value,z=rooms[2].value,w=rooms[3].value;
    const injection=(sendL+sendR)*.22*sendSpace;
    for(let i=0;i<4;i++){const line=rooms[i],diffuse=i===0?x+y+z+w:i===1?x-y+z-w:i===2?x+y-z-w:x-y-z+w;
      line.buffer[line.index]=soft(injection*(i%2?-1:1)+diffuse*.5*this.roomFeedback);line.index=(line.index+1)%line.buffer.length;}
    
    const roomL=(x+z)*.5,roomR=(y+w)*.5;
    this.returnL+=this.effectsHP*(roomL-this.returnL);this.returnR+=this.effectsHP*(roomR-this.returnR);
    this.wet+=(sendSpace-this.wet)*.001;
    l+=(echoL*p.effects.send+(roomL-this.returnL)*p.effects.room)*this.wet;
    r+=(echoR*p.effects.send+(roomR-this.returnR)*p.effects.room)*this.wet;
    let mid=(l+r)*.5+bass+(drumL+drumR)*.5+rumble;
    let side=(l-r+drumL-drumR)*.5;

    this.sideLow1+=this.sideCut*(side-this.sideLow1);side-=this.sideLow1;
    this.sideLow2+=this.sideCut*(side-this.sideLow2);side-=this.sideLow2;
    this.sideLow3+=this.sideCut*(side-this.sideLow3);side-=this.sideLow3;
    this.sideLow4+=this.sideCut*(side-this.sideLow4);side-=this.sideLow4;
    const spatialEvolution=.82+.18*scene.texture+movement*.05*sine(beats/(p.automation.bars*4));
    side*=params.width/100*p.mix.width*spatialEvolution;
    l=mid+side;r=mid-side;
    this.dcL+=this.lowCut*(l-this.dcL);this.dcR+=this.lowCut*(r-this.dcR);
    l-=this.dcL;r-=this.dcR;
    this.highL+=this.masterLP*(l-this.highL);this.highR+=this.masterLP*(r-this.highR);
    const master=x=>{
      const gain=x*p.mix.gain,driven=gain*.8+soft(gain*p.mix.drive)/p.mix.drive*.2;
      const knee=p.mix.ceiling*.80,excess=Math.max(0,Math.abs(driven)-knee),range=p.mix.ceiling-knee;
      return Math.abs(driven)<=knee?driven:Math.sign(driven)*(knee+range*excess/(range+excess));
    };
    this.left=master(this.highL);this.right=master(this.highR);
  }
}
