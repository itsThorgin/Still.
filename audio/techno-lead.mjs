const TAU=Math.PI*2,SIZE=2048,TABLES=new Map();
export const LEAD_TREATMENTS=Object.freeze(['resonant','pulse','wide']);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function saw(count){
  if(TABLES.has(count))return TABLES.get(count);
  const values=new Float32Array(SIZE+1),norm=Array.from({length:count},(_,i)=>1/(i+1)).reduce((a,b)=>a+b,0);
  for(let n=1;n<=count;n++)for(let i=0;i<=SIZE;i++)values[i]+=Math.sin(TAU*n*i/SIZE)/(n*norm);
  TABLES.set(count,values);return values;
}
function lookup(table,phase){const x=phase*SIZE,i=Math.floor(x);return table[i]+(table[i+1]-table[i])*(x-i);}
function filter(state,input,c){
  const v3=input-state.ic2,v1=c.a1*state.ic1+c.a2*v3,v2=state.ic2+c.a2*state.ic1+c.a3*v3;
  state.ic1=2*v1-state.ic1;state.ic2=2*v2-state.ic2;
  state.low=v2;state.band=v1;
}
export function createMovingLead(rate,mode,identity=0.2,motion={}){
  if(!LEAD_TREATMENTS.includes(mode))throw Error('Unknown lead treatment');
  const oversampledRate=rate*2;
  return {rate,mode,motion,phases:[identity,(identity+0.29)%1,(identity+0.62)%1],
    filters:[{ic1:0,ic2:0},{ic1:0,ic2:0}],decimator:[{a:0,b:0},{a:0,b:0}],
    downCoefficient:1-Math.exp(-TAU*rate*0.18/oversampledRate),
    attackCoefficient:1-Math.exp(-1/(oversampledRate*0.009)),
    releaseCoefficient:1-Math.exp(-1/(oversampledRate*(mode==='wide'?0.16:0.095)*(motion.release??1))),
    levelCoefficient:1-Math.exp(-1/(oversampledRate*0.005)),
    accentRelease:Math.exp(-1/(oversampledRate*0.18)),
    frequency:0,targetFrequency:0,gateEnd:-1,level:0,targetLevel:0,envelope:0,
    accent:0,noteCount:0,queue:[],left:0,right:0,cutoff:0,pulseWidth:0.3};
}
function trigger(v,event,frame,tempo){
  if(v.noteCount===0)v.frequency=event.frequency;
  v.targetFrequency=event.frequency;v.noteCount++;
  const accents=[1.12,0.84,1,0.94];
  const accent=accents[(v.noteCount-1+(v.motion.accentOffset??0))%4];
  v.targetLevel=event.amplitude*accent;
  v.accent=Math.max(v.accent*0.55,accent);
  v.gateEnd=frame+event.beats*60/tempo*v.rate;
  v.glideCoefficient=1-Math.exp(-1/(v.rate*2*(v.noteCount%3===0?0.075:0.018)*(v.motion.glide??1)));
  const maxFrequency=Math.max(2000,event.frequency*1.025,v.frequency*1.025)*(v.voiceRatios?Math.max(...v.voiceRatios):1);
  const count=[1,2,4,8,16,32].filter(n=>n*maxFrequency<v.rate*0.4).at(-1)??1;
  v.table=saw(count);v.harmonics=count;
}
export function triggerMovingLead(v,event,frame,tempo){
  const start=frame+Math.round((event.delay??0)*60/tempo*v.rate);
  if(start>frame)v.queue.push({event,start,tempo});else trigger(v,event,frame,tempo);
}
export function sampleMovingLead(v,frame,beats,brightness,movement){
  while(v.queue.length&&v.queue[0].start<=frame){const q=v.queue.shift();trigger(v,q.event,q.start,q.tempo);}
  if(!v.noteCount){v.left=v.right=0;return;}
  if(frame%32===0||!v.coefficients){
    const profile=v.motion;
    const slow=0.5-0.5*Math.cos(TAU*(beats/(profile.sweepBeats??8)+(profile.phase??0)));
    const pulse=0.5-0.5*Math.cos(TAU*beats*(profile.pulseRate??2));
    const drift=Math.sin(TAU*beats/13),m=clamp(movement,0,1);
    const base=v.mode==='resonant'?260:v.mode==='pulse'?370:520;
    const octaves=brightness*2.9+m*(profile.depth??1)*((slow-0.5)*(v.mode==='resonant'?2.9:2.1)+(pulse-0.5)*0.7)+v.accent*0.65;
    const cutoff=clamp(base*(profile.colour??1)*2**octaves,120,v.rate*0.23);
    v.cutoff=cutoff;v.pulseWidth=0.22+m*(0.14*slow+0.055*Math.sin(TAU*beats/3));
    v.detune=2**((v.mode==='wide'?0.065:0.018)*(profile.spread??1)*(0.7+m*slow)/12);
    v.pitchRatio=2**(drift*m*0.025/12);
    v.coefficients=[1,v.mode==='wide'?1.09:1].map(ratio=>{
      const g=Math.tan(Math.PI*Math.min(v.rate*0.23,cutoff*ratio)/(v.rate*2));
      const k=clamp((v.mode==='resonant'?0.3+m*0.14:v.mode==='pulse'?0.52:0.78)*(profile.resonance??1),0.25,1.1);
      const a1=1/(1+g*(g+k));return {a1,a2:g*a1,a3:g*g*a1};
    });
  }
  let outL=0,outR=0;
  for(let sub=0;sub<2;sub++){
    v.frequency+=(v.targetFrequency*v.pitchRatio-v.frequency)*v.glideCoefficient;
    const a=lookup(v.table,v.phases[0]),b=lookup(v.table,v.phases[1]),c=lookup(v.table,v.phases[2]);
    let left,right,drive;
    if(v.voiceRatios){
      left=right=a*0.54+b*0.26+c*0.2;drive=1.45;
    }else if(v.mode==='pulse'){
      const pw=lookup(v.table,(v.phases[0]+v.pulseWidth)%1);
      left=right=(a-pw)*0.72+b*0.2;drive=3.1;
    }else if(v.mode==='wide'){
      left=a*0.46+b*0.4+c*0.14;right=a*0.46+b*0.14+c*0.4;drive=1.6;
    }else {left=right=a*0.72+b*0.28;drive=1.7;}
    drive*=v.motion.drive??1;
    filter(v.filters[0],Math.tanh(left*drive),v.coefficients[0]);
    filter(v.filters[1],Math.tanh(right*drive),v.coefficients[1]);
    const l=v.filters[0],r=v.filters[1];
    const edge=v.mode==='pulse'?0.28:v.mode==='resonant'?0.08:0;
    left=Math.tanh((l.low+l.band*edge)*(v.mode==='pulse'?1.8:1.25));
    right=Math.tanh((r.low+r.band*edge)*(v.mode==='pulse'?1.8:1.25));
    const gate=frame+sub/2<v.gateEnd?1:0;
    v.envelope+=(gate-v.envelope)*(gate?v.attackCoefficient:v.releaseCoefficient);
    v.level+=(v.targetLevel-v.level)*v.levelCoefficient;
    const gain=v.envelope*v.level*(v.mode==='wide'?1.05:0.86);
    for(let channel=0;channel<2;channel++){
      const d=v.decimator[channel],value=(channel===0?left:right)*gain;
      d.a+=v.downCoefficient*(value-d.a);d.b+=v.downCoefficient*(d.a-d.b);
    }
    outL=v.decimator[0].b;outR=v.decimator[1].b;
    const f=v.frequency/(v.rate*2);
    v.phases[0]=(v.phases[0]+f)%1;
    v.phases[1]=(v.phases[1]+f*(v.voiceRatios?.[1]??v.detune))%1;
    v.phases[2]=(v.phases[2]+(v.voiceRatios?f*v.voiceRatios[2]:f/v.detune))%1;
    v.accent*=v.accentRelease;
  }
  v.left=outL;v.right=outR;
}
