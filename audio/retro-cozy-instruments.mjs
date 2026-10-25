
const TAU=2*Math.PI,SIZE=2048,COUNTS=[1,2,4,8,16,32],DUTIES=[.125,.25,.375,.5];
const SINE=Float32Array.from({length:SIZE+1},(_,i)=>Math.sin(TAU*i/SIZE));
const BASIS=Array.from({length:32},(_,h)=>Float32Array.from({length:SIZE+1},(_,i)=>Math.sin(TAU*(h+1)*i/SIZE)));
const COS=Array.from({length:32},(_,h)=>Float32Array.from({length:SIZE+1},(_,i)=>Math.cos(TAU*(h+1)*i/SIZE)));
const TABLES=new Map();
export const COZY_INSTRUMENTS=Object.freeze({
  pulse:{shape:'pulse',attack:.006,decay:1.8,sustain:.8,release:.045},
  'soft-pulse':{shape:'pulse',attack:.018,decay:1.3,sustain:.72,release:.12},
  triangle:{shape:'triangle',attack:.009,decay:0,sustain:1,release:.06},
  sine:{shape:'sine',attack:.025,decay:.4,sustain:.8,release:.17},
  'round-bass':{shape:'bass',attack:.017,decay:1,sustain:.7,release:.09},
  flute:{shape:'flute',attack:.04,decay:.6,sustain:.8,release:.14},
  reed:{shape:'reed',attack:.022,decay:1,sustain:.7,release:.1},
  'plucked-string':{shape:'pluck',attack:.004,decay:3.3,sustain:0,release:.14},
  harp:{shape:'harp',attack:.006,decay:2.5,sustain:0,release:.3},
  'felt-piano':{shape:'piano',attack:.006,decay:1.5,sustain:.02,release:.22},
  'electric-piano':{shape:'keys',attack:.009,decay:1.6,sustain:.04,release:.2,tine:.055},
  marimba:{shape:'mallet',attack:.004,decay:4,sustain:0,release:.13,tine:.035},
  celesta:{shape:'celesta',attack:.005,decay:2.2,sustain:0,release:.25,tine:.07},
  'music-box':{shape:'box',attack:.005,decay:2.6,sustain:0,release:.24,tine:.08},
  bell:{shape:'bell',attack:.009,decay:1.7,sustain:0,release:.32,tine:.1},
  glass:{shape:'glass',attack:.016,decay:1.9,sustain:.03,release:.32,tine:.08},
  'air-pad':{shape:'pad',attack:.48,decay:.12,sustain:.8,release:.6,detune:.0011},
  'cloud-pad':{shape:'cloud',attack:.7,decay:.15,sustain:.75,release:.75,detune:.0016},
  'string-pad':{shape:'strings',attack:.22,decay:.3,sustain:.74,release:.4,detune:.0008},
});
function lookup(table,phase){const x=phase*SIZE,i=Math.floor(x);return table[i]+(table[i+1]-table[i])*(x-i);}
const sine=p=>lookup(SINE,p-Math.floor(p));
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
function tables(name,count,duty=.375){
  const key=`${name}:${count}:${duty}`;if(TABLES.has(key))return TABLES.get(key);
  const shape=COZY_INSTRUMENTS[name].shape,cos=shape==='pulse';
  const weight=(n,bright)=>{
    if(shape==='pulse')return Math.sin(Math.PI*n*duty)/n*Math.exp(-n*(bright?.09:.4));
    if(shape==='triangle')return n%2?(-1)**((n-1)/2)/n**2:0;
    if(shape==='sine')return n===1?1:0;
    if(shape==='bass')return n===1?1:n===3?.08:n===5?.015:0;
    if(shape==='flute')return [1,.065,.19,.025,.035,.01][n-1]??0;
    if(shape==='reed')return n%2?Math.exp(-n*.2)/n**1.3:.022/n;
    if(shape==='pluck'||shape==='harp')return Math.sin(n*Math.PI*.31)/n**(bright?1.3:2.6)*Math.exp(-n*.1);
    if(shape==='piano')return [1,bright?.4:.1,bright?.23:.045,.08,.035,.018][n-1]??0;
    if(shape==='keys')return [1,bright?.24:.04,.08,.018][n-1]??0;
    if(shape==='mallet')return [1,0,bright?.18:.02,.035][n-1]??0;
    if(['celesta','box','bell','glass'].includes(shape))return [1,bright?.16:.035,bright?.3:.025,bright?.12:.015,.02,.008][n-1]??0;
    return Math.exp(-n*(bright?.14:.35))/n**(shape==='strings'?1.8:2.7);
  };
  const make=bright=>{
    const t=new Float32Array(SIZE+1),weights=Array.from({length:count},(_,i)=>weight(i+1,bright)),sum=weights.reduce((a,b)=>a+Math.abs(b),0)||1;
    for(let h=0;h<count;h++)if(weights[h])for(let i=0;i<=SIZE;i++)t[i]+=(cos?COS:BASIS)[h][i]*weights[h]/sum;
    t[SIZE]=t[0];return t;
  };
  const value={dark:make(false),bright:make(true)};TABLES.set(key,value);return value;
}
export function prepareCozyInstruments(names){
  for(const name of new Set(names.filter(Boolean)))for(const count of COUNTS){
    if(COZY_INSTRUMENTS[name].shape==='pulse')for(const duty of DUTIES)tables(name,count,duty);
    else tables(name,count);
  }
}
export function createCozyTone(event,rate,duration,identity=0){
  const model=COZY_INSTRUMENTS[event.instrument];if(!model)throw new RangeError(`Unknown instrument ${event.instrument}`);
  const count=COUNTS.filter(n=>n*event.frequency*1.025<rate*.43).at(-1);if(!count)return null;
  const duty=event.duty??.375,dutyIndex=DUTIES.indexOf(duty),pulse=model.shape==='pulse';
  return {...event,model,count,rate,duration,phase:0,phaseB:.17+identity*.1,tinePhase:0,frames:0,
    age:0,retire:Infinity,tables:tables(event.instrument,count,pulse?duty:.375),
    morph:pulse?tables(event.instrument,count,DUTIES[Math.max(0,dutyIndex-1)]):null,
    colour:.2,colourStep:0,decay:1,decayStep:0,tineDecay:1,tineDecayStep:0,
    left:0,right:0};
}
export function sampleCozyTone(v,age,warmth,drift,chorus=0,authentic=false){
  v.left=v.right=0;if(age<0||age>=v.duration)return;
  const m=v.model;
  if(v.frames%64===0){
    const colour=(.22+.7*Math.exp(-age*4))*(1-warmth*.55);
    v.colourStep=(colour-v.colour)/64;
    const decay=m.sustain+(1-m.sustain)*Math.exp(-age*m.decay);
    v.decayStep=(decay-v.decay)/64;v.tineDecayStep=(Math.exp(-age*5)-v.tineDecay)/64;
  }
  v.colour+=v.colourStep;v.decay+=v.decayStep;v.tineDecay+=v.tineDecayStep;
  const duration=v.duration,release=Math.min(m.release,duration*.36),attack=Math.min(m.attack,duration*.25);
  const envelope=ease(age/attack)*ease((duration-age)/release)*v.decay;
  const dark=lookup(v.tables.dark,v.phase);let wave=dark+(lookup(v.tables.bright,v.phase)-dark)*v.colour;
  if(v.morph&&!authentic){
    const morph=lookup(v.morph.dark,v.phase)+(lookup(v.morph.bright,v.phase)-lookup(v.morph.dark,v.phase))*v.colour;
    
    wave+=(morph-wave)*(.13+.09*sine(age*.28));
  }
  const vibrato=(v.vibrato??0)*ease((age-.14)/.3)*sine(age*4.7);
  const cents=vibrato+drift*2.2*sine(age*.21)+((v.glide??0)*Math.exp(-age*22));
  const pitch=1+cents*.00057762265;
  if(m.tine&&v.frequency*2.756*1.025<v.rate*.43){
    wave=wave*(1-m.tine)+sine(v.tinePhase)*m.tine*v.tineDecay;
    v.tinePhase=(v.tinePhase+v.frequency*2.756*pitch/v.rate)%1;
  }
  let second=wave;
  if(m.detune&&chorus>0&&!authentic){
    const d=lookup(v.tables.dark,v.phaseB),b=d+(lookup(v.tables.bright,v.phaseB)-d)*v.colour;
    second=wave*(1-chorus*.5)+b*chorus*.5;
    wave=wave*(1-chorus*.25)+b*chorus*.25;
    v.phaseB=(v.phaseB+v.frequency*(1+m.detune)*pitch/v.rate)%1;
  }
  v.phase=(v.phase+v.frequency*pitch/v.rate)%1;v.frames++;
  v.left=wave*envelope;v.right=second*envelope;
}

export function createCozyDrum(event,rate,duration,seed){
  return {...event,rate,duration,age:0,phase:0,state:seed>>>0||1,low:0,body:0,lfsr:0x5a7f,
    noisePhase:0,held:0,coefficient:1-Math.exp(-TAU*Math.min(event.kit==='chip'?3500:event.kit==='brush'?2200:4500,rate*.35)/rate),
    bodyCoefficient:1-Math.exp(-TAU*450/rate)};
}
export function sampleCozyDrum(v,age){
  if(age<0||age>=v.duration)return 0;
  let n=v.state;n^=n<<13;n^=n>>>17;n^=n<<5;v.state=n>>>0;let noise=v.state/2147483648-1;
  if(v.kit==='chip'){
    v.noisePhase+=Math.min(7200,v.rate*.4)/v.rate;
    if(v.noisePhase>=1){v.noisePhase-=1;v.lfsr=(v.lfsr>>>1)|(((v.lfsr^(v.lfsr>>>1))&1)<<14);v.held=(v.lfsr&1)*2-1;}
    noise=v.held;
  }
  v.low+=v.coefficient*(noise-v.low);v.body+=v.bodyCoefficient*(v.low-v.body);
  const p=age/v.duration,envelope=ease(age/.003)*(1-p)**3*Math.exp(-p*5);
  let wave;
  if(v.drum==='kick'){
    wave=sine(v.phase)*.85;v.phase=(v.phase+(58+42*Math.exp(-age*45))/v.rate)%1;
  }else if(v.kit==='wood'&&v.drum==='tap'){
    wave=sine(v.phase)*.6+(v.low-v.body)*.2;v.phase=(v.phase+360/v.rate)%1;
  }else wave=(v.low-v.body)*(v.kit==='brush'?.5:.7);
  return wave*envelope;
}
