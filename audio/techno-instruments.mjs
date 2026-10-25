// Techno-only voices: dry envelopes, resonant sequences and harder drum transients.
// Oscillators use harmonic-limited tables; no recordings or external assets.
const TAU=Math.PI*2,SIZE=2048,TABLES=new Map();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function table(name,count) {
  const key=name+count;if(TABLES.has(key))return TABLES.get(key);
  const weights=Array.from({length:count},(_,i)=>{
    const n=i+1;
    return (name==='square'?(n%2?1:0):name==='pulse'?Math.sin(n*Math.PI*0.28):1)/n;
  });
  const norm=weights.reduce((a,b)=>a+Math.abs(b),0),values=new Float32Array(SIZE+1);
  for(let i=0;i<=SIZE;i++)for(let n=1;n<=count;n++)values[i]+=Math.sin(TAU*n*i/SIZE)*weights[n-1]/norm;
  TABLES.set(key,values);return values;
}
function lookup(values,phase){const p=phase*SIZE,i=Math.floor(p);return values[i]+(values[i+1]-values[i])*(p-i);}
export function createTechnoTone(event,rate,duration,identity,tempo) {
  const acid=event.instrument==='tech-acid',sub=event.instrument==='tech-sub';
  const count=[1,2,4,8,16,32].filter(n=>n*(acid?Math.max(220,event.frequency):event.frequency)*1.005<rate*0.43).at(-1);
  if(!count)return null;
  return {...event,technoTone:true,rate,duration,age:-Math.round((event.delay??0)*60/tempo*rate),
    phase:identity,phase2:(identity+0.03)%1,acid,sub,
    sourceFrequency:event.frequency,targetFrequency:event.frequency,
    table:table(event.instrument==='tech-pluck'?'pulse':acid&&identity>0.7?'square':'saw',count),
    ic1:0,ic2:0,low:0,envelopeAge:0,held:false,accentLevel:1,
    left:0,right:0};
}
export function slideTechnoTone(tone,event,duration) {
  // The previous tied gate is still sounding. Keep phase, filter memory and envelope.
  tone.sourceFrequency=tone.frequency;tone.targetFrequency=event.frequency;
  tone.age=0;tone.duration=duration;tone.held=true;
  tone.amplitude=event.amplitude;tone.accent=event.accent;tone.toneColour=event.toneColour;
}
export function sampleTechnoTone(tone,frame,beats,brightness,movement) {
  const age=tone.age/tone.rate,name=tone.instrument;
  const accent=!!tone.accent;
  tone.frequency=tone.targetFrequency+(tone.sourceFrequency-tone.targetFrequency)*Math.exp(-age/0.045);
  if(frame%32===0||tone.age===0) {
    const decay=tone.toneDecay??0.1;
    const sweep=0.35+movement*(tone.toneColour??0.5);
    const filterEnv=Math.exp(-tone.envelopeAge/tone.rate/(accent?decay*1.65:decay));
    let cutoff=160+brightness*(name==='tech-acid'?5800:name==='tech-grit'?2400:4800)*sweep*(0.12+filterEnv);
    if(tone.sub)cutoff=160+brightness*380;
    if(name==='tech-click')cutoff=1600+brightness*4000;
    cutoff*=tone.motionCutoff??1;
    cutoff=clamp(cutoff,80,tone.rate*0.22);
    // Trapezoidal state-variable filter: stable resonance at low test/sample rates too.
    const g=Math.tan(Math.PI*cutoff/tone.rate),k=tone.acid?(accent?0.32:0.43):0.9;
    tone.a1=1/(1+g*(g+k));tone.a2=g*tone.a1;tone.a3=g*tone.a2;
  }
  const a=lookup(tone.table,tone.phase),b=lookup(tone.table,tone.phase2);
  let input=a*0.8+b*0.2;
  if(tone.motionShape!==undefined&&['tech-reed','tech-chord','tech-dub'].includes(name)) {
    const pulse=a-lookup(tone.table,(tone.phase+0.24+tone.motionShape*0.15)%1);
    input=input*(1-tone.motionShape*0.35)+pulse*tone.motionShape*0.3;
  }
  if(name==='tech-metal')input=Math.sin(TAU*tone.phase+Math.sin(TAU*tone.phase2)*(1.3+(tone.motionShape??0)*0.8))*0.65;
  if(name==='tech-click')input=Math.sin(TAU*tone.phase)+Math.sin(TAU*tone.phase2)*0.35;
  if(tone.sub)input=Math.sin(TAU*tone.phase)*0.9+a*0.1;
  if(tone.motionDrive!==undefined) {
    // Fade the nonlinear treatment itself out with motion depth; otherwise
    // tanh(input) would jump to the dry waveform exactly at Movement zero.
    const blend=clamp((tone.motionDrive-1)/0.35,0,1);
    input+=(Math.tanh(input*tone.motionDrive)-input)*blend;
  }
  const v3=input-tone.ic2,v1=tone.a1*tone.ic1+tone.a2*v3;
  const v2=tone.ic2+tone.a2*tone.ic1+tone.a3*v3;
  tone.ic1=2*v1-tone.ic1;tone.ic2=2*v2-tone.ic2;
  let wave=v2;
  if(name==='tech-grit')wave=Math.tanh(wave*2.4)*0.72;
  if(tone.acid)wave=Math.tanh(wave*1.9)*0.8;
  const attack=tone.held?1:clamp(age/(tone.sub?0.008:0.0025),0,1);
  const release=clamp((tone.duration-age)/(tone.acid?0.012:0.022),0,1);
  const decay=tone.acid?0.65+0.35*Math.exp(-tone.envelopeAge/tone.rate/0.12)
    :Math.exp(-age/(tone.toneDecay??0.1));
  tone.accentLevel+=( (tone.acid&&accent?1.5:1)-tone.accentLevel)*(1-Math.exp(-1/(tone.rate*0.004)));
  const gain=attack*release*release*decay*tone.accentLevel;
  tone.left=tone.right=wave*gain;
  const multiplier=name==='tech-metal'?2.71:name==='tech-click'?3.13:1.003;
  tone.phase=(tone.phase+tone.frequency/tone.rate)%1;
  tone.phase2=(tone.phase2+tone.frequency*multiplier*(tone.motionDetune??1)/tone.rate)%1;
  tone.age++;tone.envelopeAge++;
}

export function createTechnoDrum(event,rate,identity,tempo) {
  const id=event.kit,hard=id==='techno-hard',industrial=['techno-industrial','techno-raw'].includes(id);
  const kick={
    'techno-dub':[48,115,15,0.29], 'techno-minimal':[52,125,22,0.23],
    'techno-hypnotic':[46,145,13,0.34], 'techno-machine':[50,150,16,0.29],
    'techno-acid':[49,155,14,0.32], 'techno-deep':[45,110,13,0.34],
    'techno-industrial':[44,165,11,0.38], 'techno-raw':[47,150,12,0.35],
    'techno-hard':[43,190,9,0.43], 'techno-tribal':[52,130,18,0.27],
    'techno-drive':[47,160,12,0.35], 'techno-broken':[51,140,17,0.28],
    'techno-air':[46,95,16,0.28], 'techno-groove':[50,135,17,0.29],
  }[id];
  const durations={kick:kick[3],hat:0.07,'open-hat':0.24,clap:0.22,snare:0.19,rim:0.075,tom:0.29,metal:0.23,shaker:0.08};
  return {...event,technoDrum:true,collectionDrum:true,rate,hard,industrial,kickProfile:kick,
    age:-Math.round((event.delay??0)*60/tempo*rate),duration:durations[event.drum],phase:0,phase2:identity,
    metalPhases:Float64Array.from([0.11,0.26,0.39,0.56,0.72,0.88],v=>(v+identity)%1),
    randomState:Math.floor(identity*4294967295)||1,low:0,body:0,metalLow:0,
    lowCoefficient:1-Math.exp(-TAU*Math.min(11000,rate*0.4)/rate),
    bodyCoefficient:1-Math.exp(-TAU*Math.min(2600,rate*0.2)/rate),
    metalCoefficient:1-Math.exp(-TAU*Math.min(5200,rate*0.27)/rate)};
}
export function sampleTechnoDrum(v) {
  const age=v.age/v.rate;
  let random=v.randomState;random^=random<<13;random^=random>>>17;random^=random<<5;v.randomState=random>>>0;
  const noise=v.randomState/2147483648-1;
  v.low+=v.lowCoefficient*(noise-v.low);v.body+=v.bodyCoefficient*(v.low-v.body);
  const high=v.low-v.body;let wave,decay,frequency=200;
  if(v.drum==='kick') {
    frequency=v.kickProfile[0]+v.kickProfile[1]*Math.exp(-age*55);
    const fundamental=Math.sin(TAU*v.phase),body=fundamental+Math.sin(TAU*v.phase*2)*0.16*Math.exp(-age*24);
    wave=Math.tanh(body*(v.hard?3.4:v.industrial?2.6:1.5))*(v.hard?0.86:0.92)
      +high*0.28*Math.exp(-age*180);
    decay=Math.exp(-age*v.kickProfile[2]);
  } else if(v.drum==='hat'||v.drum==='open-hat'||v.drum==='metal') {
    // Inharmonic oscillators add a metallic body to the filtered noise transient.
    let metal=0;
    const frequencies=[317,479,631,829,1123,1499];
    for(let i=0;i<6;i++) {
      const f=Math.min(frequencies[i]*(v.drum==='metal'?v.tuning??1:5.3),v.rate*0.42);
      const p=v.metalPhases[i];metal+=Math.sin(TAU*p)*Math.sin(TAU*((p*1.71)%1))/6;
      v.metalPhases[i]=(p+f/v.rate)%1;
    }
    v.metalLow+=v.metalCoefficient*(metal-v.metalLow);
    wave=high*0.82+(metal-v.metalLow)*0.9;
    decay=Math.exp(-age*(v.drum==='hat'?65:v.drum==='metal'?16:15));
  } else if(v.drum==='clap'||v.drum==='snare') {
    const burst=v.drum==='clap'&&age<0.032?0.2+0.8*Math.sin(TAU*age*86)**2:1;
    wave=high*1.3*burst+Math.sin(TAU*v.phase)*0.22*Math.exp(-age*18);
    decay=Math.exp(-age*(v.drum==='clap'?21:25));
  } else if(v.drum==='rim'||v.drum==='tom') {
    frequency=(v.drum==='rim'?475:115)*(v.tuning??1)*(1+0.3*Math.exp(-age*40));
    wave=Math.sin(TAU*v.phase)*0.8+Math.sin(TAU*v.phase2)*0.25+high*0.1*Math.exp(-age*55);
    decay=Math.exp(-age*(v.drum==='rim'?65:14));
  } else {wave=high;decay=Math.exp(-age*48);}
  v.phase=(v.phase+frequency/v.rate)%1;v.phase2=(v.phase2+frequency*1.47/v.rate)%1;
  const attack=Math.min(1,age/(v.drum==='kick'?0.0008:0.0012)),tail=clamp((v.duration-age)/0.018,0,1);
  v.age++;return wave*decay*attack*tail*v.amplitude;
}
