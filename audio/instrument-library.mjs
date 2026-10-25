import {createMovingLead,triggerMovingLead,sampleMovingLead} from './techno-lead.mjs';

const TAU=Math.PI*2,SIZE=1024,COUNTS=[1,2,4,8,16],TABLES=new Map();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const sine=Float32Array.from({length:SIZE+1},(_,i)=>Math.sin(TAU*i/SIZE));
function lookup(table,phase){const x=(phase-Math.floor(phase))*SIZE,i=Math.floor(x);return table[i]+(table[i+1]-table[i])*(x-i);}
const sin=phase=>lookup(sine,phase);

export const INSTRUMENT_FAMILIES=Object.freeze([
  {id:'analogue',name:'Analogue',description:'Moving oscillators and resonant filters.'},
  {id:'fm',name:'FM',description:'Interacting sine operators, with changing metallic overtones.'},
  {id:'wavetable',name:'Wavetable',description:'Continuous movement between different harmonic shapes.'},
  {id:'resonator',name:'Plucked & struck',description:'Independently decaying string, wood and metal modes.'},
  {id:'additive',name:'Organ & formant',description:'Drawbars and vowel-shaped harmonic mixtures.'},
  {id:'sample',name:'Sample textures',description:'Pitch-shifted and granulated original synthetic source buffers.'},
].map(Object.freeze));
const rows=[
  ['analogue','amber-flow','Amber flow','Soft saws with a flowing resonant filter.',.012,.18,8,.85,{mode:'resonant',colour:.54,depth:.7,drive:.7}],
  ['analogue','hollow-pulse','Hollow pulse','A rounded pulse with moving width.',.008,.12,5,.82,{mode:'pulse',colour:.38,depth:.5,drive:.6}],
  ['analogue','velvet-unison','Velvet unison','Slow, softly detuned oscillator layers.',.12,.32,12,.94,{mode:'wide',colour:.48,depth:.5,spread:1.3,drive:.6}],
  ['analogue','copper-reed','Copper reed','Narrow, dry and gently nasal.',.025,.13,4,.88,{mode:'pulse',colour:.63,depth:.35,drive:.8}],
  ['fm','tine-keys','Tine keys','A soft electric tine and a short metallic attack.',.004,.16,1.3,.64,{ratio:1,index:1.5,modDecay:.12,second:3,mix:.18}],
  ['fm','glass-drops','Glass drops','Small, bright, inharmonic glass droplets.',.003,.20,.65,.53,{ratio:2.71,index:1.1,modDecay:.17,second:1,mix:.12}],
  ['fm','rubber-call','Rubber call','A low, elastic FM voice with a falling edge.',.009,.13,1.2,.61,{ratio:.5,index:2.6,modDecay:.25,second:2,mix:.16}],
  ['fm','bronze-chime','Bronze chime','A darker struck-metal call with a long body.',.004,.26,1.5,.61,{ratio:1.4142,index:1.7,modDecay:.4,second:3.003,mix:.23}],
  ['wavetable','vowel-current','Vowel current','A rounded, talking harmonic movement.',.035,.19,7,.49,{shape:0,speed:8}],
  ['wavetable','spectral-ribbon','Spectral ribbon','A smooth shape opening into spaced harmonics.',.14,.32,10,.58,{shape:1,speed:16}],
  ['wavetable','digital-bloom','Digital bloom','A compact digital pluck that blooms after its attack.',.009,.16,.8,.56,{shape:2,speed:4}],
  ['wavetable','hollow-orbit','Hollow orbit','An airy, odd-harmonic oscillation.',.04,.21,6,.56,{shape:3,speed:12}],
  ['resonator','nylon-pluck','Nylon pluck','A muted, string-like pluck with a warm body.',.003,.17,.8,.68,{ratios:[1,2,3.003,4.008,5.015,6.024],weights:[1,.46,.22,.13,.08,.04],loss:.27}],
  ['resonator','wood-mallet','Wood mallet','A short wooden strike with a hollow upper knock.',.002,.13,.5,.83,{ratios:[1,2.756,5.404,8.933],weights:[1,.28,.13,.06],loss:.65}],
  ['resonator','steel-wire','Steel wire','A taut, shimmering pluck with slowly separating partials.',.002,.25,1.1,.61,{ratios:[1,2.004,3.018,4.046,5.09,6.16],weights:[1,.53,.34,.22,.15,.1],loss:.14}],
  ['resonator','ceramic-bowl','Ceramic bowl','A rounded resonating object with an uneven overtone tail.',.004,.30,1.4,.68,{ratios:[1,2.32,4.25,6.63],weights:[1,.35,.19,.11],loss:.2}],
  ['additive','smoke-organ','Smoke organ','Soft drawbars and a small percussive overtone.',.012,.13,20,.56,{weights:[1,.08,.56,.05,.23,0,.07,0],percussion:.18}],
  ['additive','round-drawbars','Round drawbars','A full, sustained organ with gentle rotary movement.',.018,.16,20,.51,{weights:[1,.65,.44,.25,.13,.08,0,.04],percussion:.08}],
  ['additive','breath-choir','Breath choir','A slow synthetic vowel, shaped by fixed formants.',.18,.40,15,.64,{formants:[650,1100,2400],percussion:0}],
  ['additive','nasal-chorale','Nasal chorale','A more focused synthetic vowel with a rounded attack.',.07,.26,10,.62,{formants:[380,1650,2500],percussion:0}],
  ['sample','tape-cloud','Tape cloud','A softened source stretched into overlapping grains.',.12,.32,10,.86,{source:0,grain:.18}],
  ['sample','dust-chord','Dust chord','A short, worn synthetic chord texture.',.006,.16,.6,.73,{source:1,grain:0}],
  ['sample','frost-grains','Frost grains','Small sparkling fragments with an uneven texture.',.045,.22,3,.8,{source:2,grain:.085}],
  ['sample','reverse-halo','Reverse halo','A reversed swell of an original resonant source.',.16,.32,7,.83,{source:3,grain:.24}],
];
export const INSTRUMENT_PATCHES=Object.freeze(rows.map(([family,id,name,description,attack,release,decay,level,settings])=>Object.freeze({family,id,name,description,attack,release,decay,level,settings:Object.freeze(settings)})));
const PATCHES=new Map(INSTRUMENT_PATCHES.map(p=>[p.id,p]));
export function instrumentPatch(id){const p=PATCHES.get(id);if(!p)throw Error(`Unknown instrument patch: ${id}`);return p;}


const SOURCE_RATE=8000,SOURCE_ROOT=220,SOURCE_SIZE=8000;
const SOURCES=Array.from({length:4},(_,source)=>{
  const data=new Float32Array(SOURCE_SIZE);let state=0x918273+source*7361,low=0;
  for(let i=0;i<SOURCE_SIZE;i++){
    const t=i/SOURCE_RATE,p=SOURCE_ROOT*t;
    state^=state<<13;state^=state>>>17;state^=state<<5;
    low+=.12*((state>>>0)/2147483648-1-low);
    const edge=smooth(t/.04)*smooth((1-t)/.09);
    let x=source===0?(Math.sin(TAU*p)*.5+Math.sin(TAU*p*2.002)*.2+Math.sin(TAU*p*3.001)*.08+low*.12)*(1+.1*Math.sin(TAU*t*7))
      :source===1?(Math.sin(TAU*p)+.28*Math.sin(TAU*p*2)+.23*Math.sin(TAU*p*3)+.2*Math.sin(TAU*p*5))*Math.exp(-t*4)*.6+low*.04
      :source===2?(Math.sin(TAU*p)+.3*Math.sin(TAU*p*2.71)+.2*Math.sin(TAU*p*4.13))*Math.exp(-t*2)*.55+low*.12
      :(Math.sin(TAU*p)+.3*Math.sin(TAU*p*2.32)+.14*Math.sin(TAU*p*4.25))*Math.exp(-(1-t)*4)*.6;
    data[i]=x*edge;
  }return data;
});


const SOURCE_LEVELS=[1,2,4,8,16,32];
const SOURCE_BANKS=SOURCES.map(source=>SOURCE_LEVELS.map(factor=>{
  if(factor===1)return source;
  const taps=49,half=(taps-1)/2,cutoff=.42/factor,weights=[];
  for(let j=-half;j<=half;j++)weights.push((j===0?2*cutoff:Math.sin(TAU*cutoff*j)/(Math.PI*j))*(.5+.5*Math.cos(Math.PI*j/(half+1))));
  const norm=weights.reduce((sum,x)=>sum+x,0),data=new Float32Array(source.length);
  for(let i=0;i<data.length;i++)for(let j=0;j<taps;j++){
    const at=i+j-half;if(at>=0&&at<source.length)data[i]+=source[at]*weights[j]/norm;
  }return data;
}));
function sampleBuffer(data,position){const i=Math.floor(position),f=position-i;return i<0||i>=data.length-1?0:data[i]+(data[i+1]-data[i])*f;}
function spectrum(shape,morph,n){
  if(shape===0)return (n%2?1:.2)/n**1.35*(.3+1.6*Math.exp(-(((n-(morph?5:2))/1.6)**2)));
  if(shape===1)return (morph?(n%3===1?1:.08):1/n)/n**.9;
  if(shape===2)return (morph?(n===1||n===4||n===7?1:.06):1/n**2)/n**.5;
  return (n%2?1:.04)/n**(morph?1:2.4);
}

for(let shape=0;shape<4;shape++)for(const count of COUNTS){
  const pair=[0,1].map(morph=>{
    const table=new Float32Array(SIZE+1),norm=Array.from({length:count},(_,i)=>Math.abs(spectrum(shape,morph,i+1))).reduce((a,b)=>a+b,0);
    for(let n=1;n<=count;n++)for(let i=0;i<=SIZE;i++)table[i]+=sin(n*i/SIZE)*spectrum(shape,morph,n)/norm;
    return table;
  });TABLES.set(`${shape}:${count}`,pair);
}

export function createInstrumentVoice(event,rate,gateSeconds,identity=.2,tempo=130){
  const patch=instrumentPatch(event.instrumentPatch),s=patch.settings;
  let f=event.frequency;
  const highestOperator=patch.family==='fm'?Math.max(s.ratio,s.second,2.003):1;
  while(f*highestOperator>rate*.4)f/=2;
  const release=patch.release,gate=Math.max(.015,gateSeconds);
  const v={...event,instrumentVoice:true,patch,rate,gate,duration:gate+release,release,age:-Math.round((event.delay??0)*60/tempo*rate),
    phase:identity,phase2:(identity+.31)%1,phase3:(identity+.67)%1,phase4:identity,lowL:0,lowR:0,low2L:0,low2R:0,left:0,right:0,pan:event.pan??0,
    frequency:f,decay:1,decayRate:Math.exp(-1/(rate*patch.decay))};
  if(patch.family==='analogue'){
    v.analogue=createMovingLead(rate,s.mode,identity,{...s,resonance:1.8,sweepBeats:8,phase:identity,release:release/.12,spread:s.spread??.7});
    triggerMovingLead(v.analogue,{...event,delay:0,frequency:v.frequency,amplitude:1,beats:gate*tempo/60},0,tempo);
  }else if(patch.family==='wavetable'){
    const count=COUNTS.filter(n=>n*v.frequency*1.01<rate*.4).at(-1)??1;v.tables=TABLES.get(`${s.shape}:${count}`);
  }else if(patch.family==='resonator'){
    v.modes=s.ratios.map((ratio,i)=>({ratio,weight:s.weights[i],phase:0,envelope:1,
      loss:Math.exp(-1/(rate*patch.decay/(1+i*s.loss)))})).filter(m=>m.ratio*v.frequency<rate*.4);
  }else if(patch.family==='additive'){
    const count=Math.min(16,Math.floor(rate*.4/v.frequency));
    v.partials=Array.from({length:count},(_,i)=>{const n=i+1,hz=n*v.frequency;
      const weight=s.weights?.[i]??(s.formants?(n===1?.5:0)+s.formants.reduce((sum,centre)=>sum+Math.exp(-(((hz-centre)/230)**2)),0)/n**.4:0);
      return {n,weight};});
    v.norm=Math.max(1,v.partials.reduce((sum,p)=>sum+Math.abs(p.weight),0));
  }else if(patch.family==='sample'){
    v.sourceStep=SOURCE_RATE/rate*v.frequency/SOURCE_ROOT;
    const index=SOURCE_LEVELS.findIndex(factor=>factor>=v.sourceStep);
    v.source=SOURCE_BANKS[s.source][index<0?SOURCE_LEVELS.length-1:index];
    v.position=0;
  }
  return v;
}

export function sampleInstrumentVoice(v,frame,beats,brightness,movement){
  const age=v.age/v.rate,p=v.patch,s=p.settings,f=v.frequency/v.rate;
  if(age<0||age>=v.duration){v.left=v.right=0;v.age++;return;}
  const motion=clamp(movement,0,1);let l=0,r=0;
  if(frame%32===0||v.coefficient===undefined){
    const ceiling=p.family==='fm'?4300:p.family==='resonator'?4400:p.family==='sample'?3200:3400;
    v.coefficient=1-Math.exp(-TAU*Math.min(v.rate*.3,ceiling*(.28+clamp(brightness,0,1)*.72))/v.rate);
    v.drift=1+Math.sin(TAU*beats/17+v.phase3)*motion*.0008;
    v.morph=clamp(.32+.28*Math.sin(TAU*beats/(s.speed??8)+v.phase3)*motion+Math.exp(-age/.18)*.22,0,1);
    v.fmIndex=(s.index??0)*(.3+Math.exp(-age/(s.modDecay??.2))*.7)*(.7+brightness*.3+motion*.15);
  }
  if(p.family==='analogue'){
    sampleMovingLead(v.analogue,v.age,beats,brightness,motion);l=v.analogue.left;r=v.analogue.right;
  }else if(p.family==='fm'){
    const limit=Math.min(1,v.rate*.35/(v.frequency*(1+(s.ratio+1)*v.fmIndex)));
    const index=v.fmIndex*limit,mod=sin(v.phase2)*index+sin(v.phase3)*index*.2;
    l=r=sin(v.phase+mod/TAU)*(.85-s.mix)+sin(v.phase4)*s.mix*Math.exp(-age/.16);
    v.phase2=(v.phase2+f*s.ratio)%1;v.phase3=(v.phase3+f*2.003)%1;v.phase4=(v.phase4+f*s.second)%1;
  }else if(p.family==='wavetable'){
    l=lookup(v.tables[0],v.phase)*(1-v.morph)+lookup(v.tables[1],v.phase)*v.morph;
    r=lookup(v.tables[0],v.phase2)*(1-v.morph)+lookup(v.tables[1],v.phase2)*v.morph;
    v.phase2=(v.phase2+f*v.drift)%1;
  }else if(p.family==='resonator'){
    for(let i=0;i<v.modes.length;i++){
      const m=v.modes[i],x=sin(m.phase)*m.weight*m.envelope;
      l+=x;r+=x*(i%2?.94:1);m.phase=(m.phase+f*m.ratio)%1;m.envelope*=m.loss;
    }l*=.57;r*=.57;
  }else if(p.family==='additive'){
    for(const h of v.partials)l+=sin(v.phase*h.n)*h.weight;
    l/=v.norm;l+=sin(v.phase*3)*(s.percussion??0)*Math.exp(-age/.09);
    const rotary=1-motion*.08+Math.sin(TAU*beats*.35)*motion*.08;r=l*rotary;
  }else{
    if(s.grain){
      const length=s.grain*v.rate,cycle=v.age/length,base=Math.floor(cycle),fraction=cycle-base;
      for(let i=0;i<2;i++){
        const phase=(fraction+i*.5)%1,index=base-(fraction+i*.5>=1?0:i),
          start=(.08+((index*173+17)%503)/1000)*SOURCE_RATE,
          pos=start+phase*length*v.sourceStep;
        const x=sampleBuffer(v.source,pos)*Math.sin(Math.PI*phase)**2;
        l+=x;r+=sampleBuffer(v.source,pos+9)*Math.sin(Math.PI*phase)**2;
      }
    }else{l=r=sampleBuffer(v.source,v.position);v.position+=v.sourceStep;}
  }

  const env=smooth(age/p.attack)*smooth((v.duration-age)/v.release);
  const decay=p.family==='resonator'||p.family==='analogue'?1:v.decay;
  const gain=env*decay*p.level;
  v.lowL+=v.coefficient*(l-v.lowL);v.lowR+=v.coefficient*(r-v.lowR);
  v.low2L+=v.coefficient*(v.lowL-v.low2L);v.low2R+=v.coefficient*(v.lowR-v.low2R);
  v.left=v.low2L*gain;v.right=v.low2R*gain;
  v.phase=(v.phase+f*(v.drift??1))%1;v.decay*=v.decayRate;v.age++;
}

export function createInstrumentPart(rate,patch,identity){
  instrumentPatch(patch);return {libraryPart:true,rate,instrumentPatch:patch,identity,voices:[],left:0,right:0,gateEnd:-1,noteCount:0};
}
export function releaseInstrumentPart(v,frame){
  for(const voice of v.voices){
    const age=voice.age/voice.rate;voice.duration=Math.min(voice.duration,Math.max(0,age)+voice.release);
    if(voice.analogue)voice.analogue.gateEnd=Math.min(voice.analogue.gateEnd,voice.age);
  }v.gateEnd=frame;
}
export function triggerInstrumentPart(v,event,frame,tempo){

  const ratios=v.voiceColour==='dub'?event.chordRatios??[1,1.189207,1.498307]:[1];
  v.noteCount++;
  const continuing=ratios.length===1?v.voices.find(voice=>voice.analogue&&voice.age>=0&&voice.age<voice.duration*voice.rate):null;
  if(continuing){
    const age=continuing.age/continuing.rate;
    continuing.duration=age+event.beats*60/tempo+continuing.release;
    continuing.amplitude=event.amplitude;
    triggerMovingLead(continuing.analogue,{...event,delay:0,amplitude:1},continuing.age,tempo);
    v.gateEnd=frame+event.beats*60/tempo*v.rate;return;
  }
  releaseInstrumentPart(v,frame);
  for(const ratio of ratios){
    const voice=createInstrumentVoice({...event,instrumentPatch:v.instrumentPatch,frequency:event.frequency*ratio,
      amplitude:event.amplitude/(ratios.length===1?1:2.1)},v.rate,event.beats*60/tempo,v.identity,tempo);
    v.voices.push(voice);
  }
  while(v.voices.length>9)v.voices.shift();
  v.gateEnd=frame+event.beats*60/tempo*v.rate;
}
export function sampleInstrumentPart(v,frame,beats,brightness,movement){
  v.left=v.right=0;
  for(let i=v.voices.length-1;i>=0;i--){const voice=v.voices[i];
    if(voice.age>=voice.duration*voice.rate){v.voices.splice(i,1);continue;}
    sampleInstrumentVoice(voice,frame,beats,brightness,movement);
    v.left+=voice.left*voice.amplitude;v.right+=voice.right*voice.amplitude;
  }
}
