
import {gardenHash} from '../garden-options.mjs';
const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const sine=x=>Math.sin(TAU*x);
function lookup(table,phase){const x=(phase-Math.floor(phase))*(table.length-1),i=Math.floor(x),f=x-i;return table[i]+(table[i+1]-table[i])*f;}
function phrase(seed,onset,salt){return gardenHash(seed,Math.round(onset*16)+salt)/4294967296;}
function baseExpression(v,id,tempo,onset,seed){
  const u=phrase(seed,onset,v.role==='melody'?811:463),position=((onset%16)+16)%16/16;
  return {id,onset,gate:v.beats*60/tempo,u,position,arc:.88+.14*Math.sin(Math.PI*position),lastGain:0,startGain:0,
    retireAge:null,pitchAge:0,filterScale:1,send:1};
}
export function prepareBassForeground(v,id,tempo,onset,seed){
  if(v.role==='bass'||![1,31].includes(id)||v.instrumentVoice)return;
  const x=v.foregroundExpression=baseExpression(v,id,tempo,onset,seed),pad=v.pad,stab=v.name==='dub-stab',keys=['electric-keys','dark-keys'].includes(v.name),bell=v.name==='bell-pluck';
  x.struck=stab||keys||bell;x.pad=pad;x.gate=v.duration;
  const tick=Math.round(onset*4)%16,bar=Math.floor(onset/4),first=tick<=3;
  if(pad){
    x.attack=.18;x.release=.50;x.peak=id===1?.83:.86;x.sustain=.84;x.decay=5;
  }else if(stab){
    const hit=tick===3?0:tick===10?1:2;
    x.peak=[1.04,.74,.87][hit]*(.97+.06*Math.sin(Math.PI*x.position));
    x.attack=.006+x.u*.004;x.release=Math.min(x.gate*.28,.045);x.decay=.102+x.u*.038;x.sustain=0;
    x.filterLift=[1.08,.78,.91][hit];x.send=bar%4===2&&hit===2?1.22:.88;
  }else if(keys||bell){
    x.peak=x.arc*(first?1.04:.88)+(x.u-.5)*.04;
    x.attack=keys?.008+x.u*.005:.007+x.u*.003;x.release=Math.min(x.gate*.32,keys?.16:.17);
    x.decay=keys?.52+x.u*.24:.27+x.u*.07;x.sustain=0;x.filterLift=.86+x.peak*.14;
    x.send=bar%4===3?1.08:.94;
  }else{
    x.attack=.018+x.u*.012;x.release=Math.min(.10,x.gate*.3);v.duration=x.gate+x.release;
    x.peak=x.arc*.94;x.sustain=.62;x.decay=.24;x.filterLift=.94+x.u*.09;x.vibrato=2.2;
  }
  x.attack=Math.min(x.attack,x.gate*.22);x.filterLift??=1;
}
function foregroundGain(v,x,beats,movement){
  const age=v.age/v.rate;
  if(x.retireAge!==null){x.lastGain=x.retireGain*(1-smooth((age-x.retireAge)/x.retireSeconds));return x.lastGain;}
  const attack=smooth(age/x.attack),body=x.peak*(x.sustain+(1-x.sustain)*Math.exp(-age/x.decay));
  const pressure=x.pad?1:1+(x.pressure??0)*movement*Math.sin(Math.PI*clamp(age/.7,0,1));
  x.lastGain=(x.startGain*(1-attack)+body*pressure*attack)*smooth((v.duration-age)/x.release);
  return x.lastGain;
}
export function sampleBassForeground(v,frame,beats,brightness,movement){
  const x=v.foregroundExpression,age=v.age/v.rate;
  if(age<0||age>=v.duration){v.left=v.right=0;x.lastGain=0;v.age++;return;}
  if(frame%32===0||v.age===0){
    const slow=.5+.5*sine(beats/24+v.phase3),shape=v.pad?.55+movement*slow*.35:.22+Math.exp(-age*(x.struck?7:3.5))*.78;
    const evolution=x.pad?1+movement*.07*sine(beats/16+x.id*.07):1+movement*.035*sine(beats/8+x.onset*.1);
    const cutoff=Math.min(v.rate*.36,280+brightness*(v.cutoffCeiling??7200)*shape*x.filterLift*evolution),target=1-Math.exp(-TAU*cutoff/v.rate);
    v.coefficientStep=(target-v.coefficient)/32;
    const vibrato=(x.vibrato??0)*movement*smooth((age-.16)/.22)*sine(frame/v.rate*5.1+x.onset*.13);
    x.pitchRatio=2**(vibrato/1200);
  }
  v.coefficient+=v.coefficientStep;
  const a=lookup(v.table,v.phase),b=lookup(v.table,v.phase2);let left=a*.7+b*.3,right=a*.3+b*.7;
  if(v.pad){const third=lookup(v.table,v.phase3);left=left*.8+third*.2;right=right*.88+third*.12;}
  if(['electric-keys','glass-lead','bell-pluck'].includes(v.name)){
    const body=sine(v.phase),transient=Math.exp(-age*(v.name==='electric-keys'?4:2));
    left=left*transient+body*(1-transient)*.7;right=right*transient+body*(1-transient)*.7;
  }
  v.filterL+=v.coefficient*(left-v.filterL);v.filterR+=v.coefficient*(right-v.filterR);
  v.filter2L+=v.coefficient*(v.filterL-v.filter2L);v.filter2R+=v.coefficient*(v.filterR-v.filter2R);
  const gain=foregroundGain(v,x,beats,movement),step=v.frequency/v.rate*(x.pitchRatio??1);
  v.left=v.filter2L*gain;v.right=v.filter2R*gain;
  v.phase=(v.phase+step)%1;v.phase2=(v.phase2+step*v.detune)%1;v.phase3=(v.phase3+step*.9968)%1;v.age++;
}

export function prepareTechForeground(v,id,tempo,onset,seed){
  if(v.role==='bass'||![1,3,7].includes(id))return;
  const x=v.foregroundExpression=baseExpression(v,id,tempo,onset,seed),chord=v.patch==='chord',pad=v.patch==='pad';
  x.originalFrequency=v.frequency;x.pad=pad;x.chord=chord;x.cycle=Math.round(onset*4)%15;
  if(pad){x.attack=.24;x.release=.5;x.peak=.86;x.decay=12;x.sustain=0;}
  else if(id===7&&!chord){
    x.attack=.025+x.u*.012;x.release=.075+x.u*.025;v.duration=x.gate+x.release;
    x.peak=x.arc*(v.accent?1.04:.94);x.decay=.52;x.sustain=.38;x.pressure=.08;x.vibrato=3.2;
    x.filterLift=v.accent?1.05:.94;x.connect=true;x.glide=.028+x.u*.015;
  }else if(id===3&&!chord){
    const index=Math.round(x.cycle/3)%5,accent=[1.06,.82,.94,.75,.89][index];
    x.attack=.0035+x.u*.0025;x.release=.018+x.u*.009;x.peak=accent*(v.accent?1.025:.97);x.decay=.105+accent*.05;x.sustain=.08;
    x.filterLift=.80+accent*.25+(v.accent?.05:0);x.pulse=.035;
  }else if(chord){
    const ending=Math.floor(onset/4)%16===15;
    x.attack=id===1?.007+x.u*.005:.009;x.release=id===1?.05+x.u*.025:.035;
    v.duration=x.gate+x.release;x.peak=(id===1?.91:.83)*x.arc*(ending?1.08:1);
    x.decay=id===1?.23+x.u*.09:.35+x.u*.08;x.sustain=0;
    x.filterLift=.85+x.u*.23;x.send=id===1?(ending?1.16:.88):.9;
  }else{
    x.attack=.006+x.u*.003;x.release=Math.min(.04,x.gate*.22);x.peak=x.arc*(v.accent?1.03:.88);
    x.decay=.17+x.u*.055;x.sustain=.08;x.filterLift=.87+x.u*.17;
  }
  x.attack=Math.min(x.attack,x.gate*.22);x.filterLift??=1;
}
export function startTechForeground(v,runtime){
  v.expressionStarted=true;const x=v.foregroundExpression;
  if(x.id!==7||v.role!=='melody')return;
  const previous=runtime.expressionLead,old=previous?.foregroundExpression;
  if(previous&&previous.age/previous.rate<previous.duration&&old){
    const age=previous.age/previous.rate,ratio=previous.frequencyNow/v.frequency;
    const connected=!v.accent&&age-old.gate<.06&&old.lastGain>.035&&ratio>.67&&ratio<1.5&&x.u<.87;
    if(connected){
      for(const key of ['phase','phase2','ic1','ic2','lp','cutoff','filterEnvelope','targetCutoff','drift','width'])v[key]=previous[key];
      v.frequencyNow=previous.frequencyNow;v.held=true;v.slideCoefficient=1-Math.exp(-1/(v.fs*x.glide));
      x.startGain=old.lastGain*previous.amplitude/v.amplitude;x.pitchAge=old.pitchAge;
      x.attack=Math.max(.028,x.attack);v.connectedForeground=true;previous.duration=age;
    }else if(old.retireAge===null){
      old.retireAge=age;old.retireGain=old.lastGain;old.retireSeconds=Math.min(previous.duration-age,.025);
      previous.duration=age+old.retireSeconds;
    }
  }
  runtime.expressionLead=v;
}
export function updateTechForeground(v,frame,beats,movement){
  const x=v.foregroundExpression,age=v.age/v.rate;
  if(frame%32===0||v.age===0){
    const breathing=1+movement*(x.id===3?.08:.045)*sine(beats/(x.id===3?7.5:16)+x.id*.19);
    const delayed=smooth((x.pitchAge-.17)/.22),vibrato=(x.vibrato??0)*movement*delayed*sine(frame/v.rate*5.08+x.id*.13);
    x.filterScale=x.filterLift*breathing*(1+(x.pressure??0)*movement*smooth(age/.28));
    v.targetFrequency=x.originalFrequency*2**(vibrato/1200);
  }
  x.pitchAge+=1/v.rate;
}
export function sampleTechForeground(v,beats,movement){
  const x=v.foregroundExpression,gain=foregroundGain(v,x,beats,movement);
  return gain*(1+(x.pulse??0)*movement*sine(beats*2));
}

export function startHatChoke(v,seconds=.009){
  const age=v.age/v.rate;if(v.expressionChoke||v.duration<=age+seconds)return;
  v.expressionChoke={start:age,seconds,naturalDuration:v.duration};v.duration=age+seconds;
}
export function sampleExpressionDrum(v,sample){
  const choke=v.expressionChoke;if(!choke)return sample(v);
  const duration=v.duration,age=v.age/v.rate;v.duration=choke.naturalDuration;
  const raw=sample(v);v.duration=duration;return raw*(1-smooth((age-choke.start)/choke.seconds));
}
