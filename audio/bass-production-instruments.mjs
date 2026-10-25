import {createBassExpression,sampleBassExpression,canConnectBass,inheritBassExpression,retireBassExpression} from './bass-articulation.mjs';
const TAU=Math.PI*2,SIZE=2048,TABLES=new Map();
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const sine=p=>Math.sin(TAU*p);
export const BASS_PRODUCTION_SOUNDS=Object.freeze(['sub','warm','pulse','reese','organ','scan','talk','fm','rubber','wobble']);
const MODULATED=new Set(['fm','talk','scan']);

export function phaseModulatedSine(phaseCycles,modulatorCycles,indexRadians){
  return Math.sin(TAU*phaseCycles+indexRadians*Math.sin(TAU*modulatorCycles));
}
function table(shape,count){
  const key=`${shape}:${count}`;if(TABLES.has(key))return TABLES.get(key);
  const t=new Float32Array(SIZE+1);let norm=0;
  for(let n=1;n<=count;n++){
    const w=shape==='pulse'?Math.sin(n*Math.PI*.37)/n:shape==='warm'?(n%2?1/n**2:0):1/n;
    norm+=Math.abs(w);for(let i=0;i<=SIZE;i++)t[i]+=Math.sin(TAU*n*i/SIZE)*w;
  }
  for(let i=0;i<=SIZE;i++)t[i]/=Math.max(1,norm);TABLES.set(key,t);return t;
}
function lookup(t,p){const f=p*SIZE,i=Math.floor(f);return t[i]+(t[i+1]-t[i])*(f-i);}
export function prepareProductionTables(rate){
  
  const counts=new Set();for(const hz of [35,55,88])counts.add([1,2,4,8,16,32,64].filter(n=>n*hz*1.02<rate*.4).at(-1)??1);
  for(const shape of ['saw','pulse','warm'])for(const count of counts)table(shape,count);
}

export function filter(type,hz,q,rate){
  const w=TAU*clamp(hz,8,rate*.44)/rate,c=Math.cos(w),s=Math.sin(w),a=s/(2*q),d=1+a;
  return {b0:(type==='highpass'?(1+c):(1-c))/2/d,b1:(type==='highpass'?-(1+c):(1-c))/d,
    b2:(type==='highpass'?(1+c):(1-c))/2/d,a1:-2*c/d,a2:(1-a)/d,z1:0,z2:0};
}
export function tickFilter(f,x){const y=x*f.b0+f.z1;f.z1=x*f.b1-f.a1*y+f.z2;f.z2=x*f.b2-f.a2*y;return y;}
function tuneFilter(f,type,hz,q,rate){const k=filter(type,hz,q,rate);Object.assign(f,{b0:k.b0,b1:k.b1,b2:k.b2,a1:k.a1,a2:k.a2});}

export function createProductionBass(event,rate,tempo,p,identity=.5){
  const sound=event.sound??'warm';
  if(!BASS_PRODUCTION_SOUNDS.includes(sound))throw new RangeError(`Unknown Bass sound: ${sound}`);
  const gate=event.beats*60/tempo,os=rate*2,bassExpression=createBassExpression(event,rate,tempo,p.family,identity);
  const count=[1,2,4,8,16,32,64].filter(n=>n*event.frequency*1.02<rate*.4).at(-1)??1;
  const modulated=MODULATED.has(sound),operatorRatio=Math.max(1,Math.round(p.fmRatio));
  return {...event,sound,rate,gate,bassExpression,release:bassExpression.release,duration:gate+bassExpression.release,age:-Math.round((event.delay??0)*60/tempo*rate),
    modulated,operatorRatio,secondaryRatio:operatorRatio+1,
    drive:modulated||sound==='rubber'||sound==='wobble'?Math.min(p.drive,1.55):p.drive,
    phase:0,a:.07+p.colour*.2,b:.37+p.colour*.1,mod:0,mod2:.13,frequencyNow:event.frequency,started:false,
    cutoff:p.cutoff,cutoffSmoothing:1-Math.exp(-32/(rate*.014)),table:table(sound==='warm'?'warm':sound==='pulse'?'pulse':'saw',count),
    scanTable:table('pulse',count),colour:p,sub:0,left:0,right:0,
    lpL:filter('lowpass',p.cutoff,.72,os),lpR:filter('lowpass',p.cutoff,.72,os),
    
    aaL:[filter('lowpass',rate*.39,.5412,os),filter('lowpass',rate*.39,1.3066,os)],
    aaR:[filter('lowpass',rate*.39,.5412,os),filter('lowpass',rate*.39,1.3066,os)],
    hpL:filter('highpass',145,.707,rate),hpR:filter('highpass',145,.707,rate),
  };
}
export function handoverProductionBass(v,previous){
  if(!previous||previous.age/previous.rate>=previous.duration)return;
  if(v.sound===previous.sound&&canConnectBass(v,previous)){
    for(const key of ['phase','a','b','mod','mod2','lpL','lpR','aaL','aaR','hpL','hpR','cutoff'])v[key]=previous[key];
    inheritBassExpression(v,previous);
  }else{
    v.phase=previous.phase;
    retireBassExpression(previous,v.bassExpression.attack);
  }
}
export function sampleProductionBass(v,frame,beats,brightness,movement){
  const age=v.age/v.rate,p=v.colour,shape=v.sound,b=v.bassExpression;
  if(frame%32===0||v.age===0){
    const lfo=.5-.5*Math.cos(TAU*(beats*(v.motionRate??p.motionRate)*b.motionScale+p.colour+b.motionPhase));
    const contour=Math.exp(-age/b.filterDecay);
    v.modulation=(.25+lfo*.75)*movement;
    const target=clamp((220+p.cutoff*(.2+brightness*.8)*(.25+v.modulation*.6+contour*.35)*b.filterLift)*(v.cutoffScale??1),150,v.rate*.36);
    v.cutoff+=(target-v.cutoff)*v.cutoffSmoothing;
    const cutoff=v.cutoff;
    tuneFilter(v.lpL,'lowpass',cutoff,shape==='wobble'?.74:.72,v.rate*2);
    tuneFilter(v.lpR,'lowpass',cutoff*1.015,shape==='wobble'?.74:.72,v.rate*2);
    const indexLimit=shape==='fm'?2:shape==='talk'?1.25:.9;
    v.index=v.modulated?Math.min(indexLimit,p.fmIndex*(.25+v.modulation*.45+contour*.15),v.rate/(v.frequency*16)):0;
  }
  const frequency=v.fromFrequency===undefined?v.frequency:v.frequency+(v.fromFrequency-v.frequency)*Math.exp(-age/(v.glide??.02));
  v.frequencyNow=frequency;
  const envelope=sampleBassExpression(v);
  
  const sub=(sine(v.phase)+.045*sine(v.phase*3))*p.sub*.82;
  v.sub=sub*envelope*(v.low??1);
  let l=0,r=0;
  for(let os=0;os<2;os++){
    const fm=v.modulated?phaseModulatedSine(v.phase,v.mod,v.index):0;
    const fm2=v.modulated?phaseModulatedSine(v.phase,v.mod2,v.index*.65):0;
    const sawL=lookup(v.table,v.a),sawR=lookup(v.table,v.b),scan=lookup(v.scanTable,v.a);
    if(shape==='sub'){l=sine(v.phase*2)*.25+sine(v.phase*3)*.1;r=l;}
    else if(shape==='warm'){l=sawL*.6+sawR*.4;r=sawR*.6+sawL*.4;}
    else if(shape==='reese'||shape==='pulse'){l=sawL*.72+sawR*.28;r=sawR*.72+sawL*.28;}
    else if(shape==='organ'){l=sine(v.phase)+sine(v.phase*3)*.4+sine(v.phase*4)*.2;r=l;}
    else if(shape==='wobble'){
      
      l=sine(v.phase)*.7+sine(v.phase*2)*.28+sine(v.phase*3)*.2+sine(v.phase*4)*.12+sine(v.phase*5)*.07;r=l;
    }else if(shape==='rubber'){
      
      l=sine(v.phase)*.62+sine(v.phase*2)*.3+sine(v.phase*3)*.22+sine(v.phase*4)*.1;r=l;
    }
    else if(shape==='scan'){l=sawL*(1-v.modulation)+scan*v.modulation+fm*.35;r=sawR*.6+fm2*.4;}
    else if(shape==='talk'){
      
      const vowel=v.modulation;
      l=fm*.55+(sine(v.phase*3)*(1-vowel)+sine(v.phase*5)*vowel)*.35;
      r=fm2*.55+(sine(v.phase*3+.2)*(1-vowel)+sine(v.phase*5+.2)*vowel)*.35;
    }else if(shape==='fm'){
      l=fm*.72+sine(v.phase*3)*.2+sine(v.phase*5)*.08;
      r=fm2*.72+sine(v.phase*3)*.2+sine(v.phase*5)*.08;
    }
    l=tickFilter(v.lpL,l);r=tickFilter(v.lpR,r);
    
    l=Math.tanh(l*v.drive);r=Math.tanh(r*v.drive);
    for(const f of v.aaL)l=tickFilter(f,l);for(const f of v.aaR)r=tickFilter(f,r);
    v.phase=(v.phase+frequency/(v.rate*2))%1;
    v.a=(v.a+frequency*(1+p.detune)/(v.rate*2))%1;
    v.b=(v.b+frequency*(1-p.detune)/(v.rate*2))%1;
    v.mod=(v.mod+frequency*v.operatorRatio/(v.rate*2))%1;
    v.mod2=(v.mod2+frequency*v.secondaryRatio/(v.rate*2))%1;
  }
  const body=shape==='sub'?.22:shape==='warm'?.52:.86;
  v.left=tickFilter(v.hpL,l)*envelope*body;v.right=tickFilter(v.hpR,r)*envelope*body;
  v.age++;
}

export function createProductionDrum(event,rate,tempo,p,identity){
  const duration=event.drum==='kick'?Math.min(.24,60/tempo*.6):event.drum==='snare'?p.snareTail*(event.chop??1):
    ({hat:.055,'open-hat':.21,clap:.19,tom:.26,conga:.16,rim:.065,shaker:.065,crash:.7}[event.drum]??.1);
  return {...event,rate,duration,age:-Math.round((event.delay??0)*60/tempo*rate),phase:0,phase2:0,
    randomState:identity||1,low:0,band:0,p,lowC:1-Math.exp(-TAU*Math.min(8500,rate*.32)/rate),
    bandC:1-Math.exp(-TAU*Math.min(event.drum.includes('hat')?4500:event.drum==='snare'?1100:1800,rate*.2)/rate),started:false};
}
export function sampleProductionDrum(v){
  const age=v.age/v.rate,p=v.p;
  let n=v.randomState;n^=n<<13;n^=n>>>17;n^=n<<5;v.randomState=n>>>0;
  const noise=v.randomState/2147483648-1;
  v.low+=v.lowC*(noise-v.low);v.band+=v.bandC*(v.low-v.band);
  const high=v.low-v.band,tail=smooth((v.duration-age)/.012);let x=0,f=180;
  if(v.drum==='kick'){
    f=p.kickHz+135*Math.exp(-age/.008);
    x=sine(v.phase)*Math.exp(-age/(p.family==='deep'?.065:.045))*.94+
      sine(v.phase*3)*Math.exp(-age/.012)*.07+high*Math.exp(-age/.0025)*.22;
  }else if(v.drum==='snare'){
    f=p.snareHz+48*Math.exp(-age/.007);
    x=(sine(v.phase)*.62+sine(v.phase2)*.19)*Math.exp(-age/.034)+
      high*(v.ghost?.65:.95)*Math.exp(-age/(v.duration*.28))+.09*v.low*Math.exp(-age/.0018);
  }else if(v.drum==='clap'){
    const pulses=Math.exp(-age/.006)+.75*Math.exp(-Math.abs(age-.012)/.004)+.55*Math.exp(-Math.abs(age-.024)/.005);
    x=high*(pulses+Math.exp(-age/.04)*.6);
  }else if(v.drum==='tom'||v.drum==='conga'){
    f=(v.drum==='conga'?170:105)+90*Math.exp(-age/.011);x=(sine(v.phase)+sine(v.phase2)*.17)*Math.exp(-age/.04)+high*.1*Math.exp(-age/.009);
  }else if(v.drum==='rim'){
    f=730;x=(sine(v.phase)+sine(v.phase2)*.5)*Math.exp(-age/.012)*.6+high*Math.exp(-age/.005)*.2;
  }else{
    x=high*(v.drum==='crash'?.75:1.6)*Math.exp(-age/(v.drum==='crash'?.18:v.drum==='open-hat'?.055:.014));
  }
  v.phase=(v.phase+f/v.rate)%1;v.phase2=(v.phase2+(v.drum==='rim'?1137:f*1.69)/v.rate)%1;v.age++;
  return x*smooth(age/.0007)*tail*v.amplitude;
}
