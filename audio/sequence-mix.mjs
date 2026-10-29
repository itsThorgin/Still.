import {sine} from './pattern-instruments.mjs';
const TAU=2*Math.PI;
export class SequenceMix{
  constructor(rate,p){
    this.rate=rate;this.p=p;this.left=this.right=0;this.kickEnvelope=0;this.snareEnvelope=0;
    this.duckRate=Math.exp(-1/(rate*(p.id===10?.10:p.id===29?.13:p.id===42?.055:.075)));
    this.delays=[.375,.75].map(beats=>({buffer:new Float32Array(Math.round(rate*60/p.tempo*beats)),index:0,low:0,hp:0}));
    const decay=p.id===29?3.8:p.id===38?2.1:p.id===15?.9:p.id===33?.65:.55;
    this.rooms=[.0431,.0617,.0793,.1013].map((t,i)=>({buffer:new Float32Array(Math.max(7,Math.round(rate*t))),index:0,low:0,value:0,gain:10**(-3*t/decay)}));
    this.hpC=1-Math.exp(-TAU*(p.id===29?360:280)/rate);this.lpC=1-Math.exp(-TAU*Math.min(p.id===29?2100:4200,rate*.35)/rate);
    this.roomHP=[0,0];this.sendHP=0;this.subDc=0;this.lowC=1-Math.exp(-TAU*22/rate);
    this.dc=Object.fromEntries(['mix','bass','drums','music','chords','lead'].map(k=>[k,[0,0]]));
    this.views=Object.fromEntries(['mix','bass','drums','music','chords','lead'].map(k=>[k,{left:0,right:0}]));
    this.sideLow=0;this.sideC=1-Math.exp(-TAU*180/rate);
    this.stats={maxPreMasterPeak:0,masterGainReductionDb:0,upperDrive:p.id===10?'2.7–3.35 tanh, harmonic band only':p.id===42?'2.2 tanh, harmonic band only':'no aggressive drive'};
  }
  output(name,l,r){
    const d=this.dc[name];d[0]+=this.lowC*(l-d[0]);d[1]+=this.lowC*(r-d[1]);
    
    this.views[name].left=(l-d[0])*.84;this.views[name].right=(r-d[1])*.84;
  }
  process(b,params,frame){
    const p=this.p,pump=params.pump/100;
    this.kickEnvelope*=this.duckRate;this.snareEnvelope*=this.duckRate;
    const lowDuck=1-this.kickEnvelope*(p.kind==='techno'?.80:.68)*pump,
      upperDuck=1-this.kickEnvelope*.30*pump,returnDuck=1-this.kickEnvelope*.7-this.snareEnvelope*.12;
    let bass=b.sub*lowDuck+b.upper*upperDuck;
    let ml=b.musicL*(1-this.kickEnvelope*.16*pump),mr=b.musicR*(1-this.kickEnvelope*.16*pump);
    const send=(b.sendL+b.sendR)*.5;this.sendHP+=this.hpC*(send-this.sendHP);
    const injection=send-this.sendHP;
    const [a,c,d,e]=this.rooms;
    for(const line of this.rooms){line.low+=this.lpC*(line.buffer[line.index]-line.low);line.value=line.low;}
    const x=a.value,y=c.value,z=d.value,w=e.value;
    for(let i=0;i<4;i++){
      const line=this.rooms[i],sum=i===0?x+y+z+w:i===1?x-y+z-w:i===2?x+y-z-w:x-y-z+w;
      line.buffer[line.index]=injection*.22*(i%2?-1:1)+sum*.5*line.gain;line.index=(line.index+1)%line.buffer.length;
    }
    let echoL=0,echoR=0;
    for(let i=0;i<2;i++){
      const line=this.delays[i],read=line.buffer[line.index];line.low+=this.lpC*(read-line.low);line.hp+=this.hpC*(line.low-line.hp);
      const out=line.low-line.hp;line.buffer[line.index]=injection*.25+out*(p.id===29?.51:.26);line.index=(line.index+1)%line.buffer.length;
      if(i===0)echoL=out;else echoR=out;
    }
    const wet=params.space/100*(p.id===29?1.55:p.id===38?.85:p.id===15?.48:p.id===33?.52:.32),
      roomL=(x+z)*.5,roomR=(y+w)*.5;
    this.roomHP[0]+=this.hpC*(roomL-this.roomHP[0]);this.roomHP[1]+=this.hpC*(roomR-this.roomHP[1]);
    ml+=((roomL-this.roomHP[0])*.9+echoL*.7)*wet*Math.max(.05,returnDuck);
    mr+=((roomR-this.roomHP[1])*.9+echoR*.7)*wet*Math.max(.05,returnDuck);
    
    const width=params.width/100;
    this.output('bass',bass,bass);
    this.output('drums',b.drumL,b.drumR);
    this.output('music',(ml+mr)*.5+(ml-mr)*.5*width,(ml+mr)*.5-(ml-mr)*.5*width);
    this.output('chords',b.chordL*upperDuck,b.chordR*upperDuck);
    this.output('lead',b.leadL*upperDuck,b.leadR*upperDuck);
    let l=bass+b.drumL+ml,r=bass+b.drumR+mr,mid=(l+r)*.5,side=(l-r)*.5;
    this.sideLow+=this.sideC*(side-this.sideLow);side=(side-this.sideLow)*width;
    this.stats.maxPreMasterPeak=Math.max(this.stats.maxPreMasterPeak,Math.abs(mid+side),Math.abs(mid-side));
    this.output('mix',mid+side,mid-side);this.left=this.views.mix.left;this.right=this.views.mix.right;
  }
}
