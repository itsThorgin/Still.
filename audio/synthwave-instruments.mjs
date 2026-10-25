// Locally synthesized, band-limited analogue-style voices. No reference samples.
const TAU=Math.PI*2,SIZE=2048,tables=new Map(),COUNTS=[1,2,4,8,16,32,64,96];
const sine=Float32Array.from({length:SIZE+1},(_,i)=>Math.sin(TAU*i/SIZE));
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
function lookup(t,p){const x=(p-Math.floor(p))*SIZE,i=Math.floor(x);return t[i]+(t[i+1]-t[i])*(x-i);}
const sin=p=>lookup(sine,p);
const patch=p=>Object.freeze({wave:'saw',attack:.018,release:.2,ceiling:6200,base:320,env:.55,filterDecay:.32,
  sustain:.82,ampDecay:.25,spread:.0028,vibrato:.001,wow:0,resonance:.18,speed:16,level:.85,...p});
export const SYNTHWAVE_INSTRUMENTS=Object.freeze({
  'city-saw':patch({spread:.0042,ceiling:7600,release:.32,vibrato:.0018}),
  'velvet-lead':patch({wave:'pulse',pulse:.42,attack:.05,release:.38,ceiling:4400,spread:.0018,vibrato:.0034,env:.28}),
  'sunset-brass':patch({attack:.045,filterDecay:.23,sustain:.72,spread:.0035,ceiling:6700,resonance:.24}),
  'pixel-glass':patch({wave:'sine',fm:2.001,index:1.2,attack:.004,release:.35,ampDecay:.6,sustain:.12,ceiling:8500}),
  'signal-fm':patch({wave:'sine',fm:1.5,index:1.8,attack:.008,release:.25,ampDecay:.35,sustain:.16,ceiling:7000}),
  'vhs-keys':patch({attack:.008,release:.35,ampDecay:.8,sustain:.2,ceiling:4200,filterDecay:.19,env:.85,wow:.0007,spread:.002,resonance:.4}),
  'mall-tines':patch({wave:'triangle',fm:1,index:.85,attack:.004,ampDecay:.8,sustain:.1,release:.35,ceiling:6200}),
  'soft-pluck':patch({attack:.003,release:.12,sustain:.05,ampDecay:.24,env:1,filterDecay:.13,ceiling:6900,resonance:.42}),
  'clock-pulse':patch({wave:'pulse',pulse:.27,attack:.003,release:.09,sustain:.35,ampDecay:.18,filterDecay:.15,ceiling:5800,spread:.0009}),
  'neon-strings':patch({attack:.32,release:.65,spread:.006,env:.2,base:600,ceiling:6500,sustain:1,speed:32}),
  'dream-chorus':patch({wave:'pulse',pulse:.46,attack:.22,release:.75,spread:.0045,env:.25,base:500,ceiling:5100,sustain:1}),
  'oxide-pad':patch({attack:.35,release:.8,spread:.003,wow:.0012,ceiling:3300,env:.18,sustain:1}),
  'motor-bass':patch({bass:true,attack:.004,release:.055,base:90,ceiling:3000,env:1,filterDecay:.13,spread:.0006,sub:.34,resonance:.3,sustain:.68}),
  'razor-bass':patch({bass:true,wave:'pulse',pulse:.36,attack:.003,release:.06,base:140,ceiling:4400,env:.8,filterDecay:.18,spread:.0012,sub:.32,drive:2.1,sustain:.85}),
  'round-funk':patch({bass:true,attack:.006,release:.07,base:80,ceiling:1800,env:1,filterDecay:.095,spread:.0002,sub:.5,sustain:.48,ampDecay:.25}),
  'radio-air':patch({wave:'triangle',attack:.4,release:.7,ceiling:4000,noise:.65,spread:.001,level:.5,sustain:1}),
});
function tableFor(p,count){
  const key=[p.wave,p.pulse??.5,count].join(':');if(tables.has(key))return tables.get(key);
  const table=new Float32Array(SIZE+1);
  for(let h=1;h<=count;h++){
    const weight=p.wave==='sine'?(h===1?1:0):p.wave==='triangle'?(h%2?(-1)**((h-1)/2)/h**2:0)
      :p.wave==='pulse'?Math.sin(h*Math.PI*(p.pulse??.5))/h:1/h;
    for(let i=0;i<=SIZE;i++)table[i]+=sin(h*i/SIZE)*weight*.62;
  }
  tables.set(key,table);return table;
}
export function createSynthwaveTone(event,rate,duration,identity,tempo=100){
  const p=SYNTHWAVE_INSTRUMENTS[event.instrument];if(!p)return null;
  const count=COUNTS.filter(n=>event.frequency*1.02*n<rate*.44).at(-1);if(!count)return null;
  return {...event,pan:event.pan??0,synthwaveTone:true,profile:p,rate,duration,count,table:tableFor(p,count),identity,
    age:-Math.round((event.delay??0)*60/tempo*rate),attack:Math.min(duration*.2,p.attack),release:Math.min(duration*.4,p.release),
    phase:identity,phase2:(identity+.27)%1,phase3:(identity+.61)%1,modPhase:identity,
    step:event.frequency/rate,morph:0,g:0,gStep:0,k:2-p.resonance*1.6,
    ic1L:0,ic2L:0,ic1R:0,ic2R:0,highL:0,highR:0,
    highCoefficient:1-Math.exp(-TAU*(event.role==='bass'?20:145)/rate),
    noiseState:((identity*4294967296)>>>0)||1,noiseLow:0,left:0,right:0};
}
export function sampleSynthwaveTone(v,frame,beats,brightness,movement){
  const age=v.age/v.rate,p=v.profile;
  if(age<0||age>=v.duration){v.left=v.right=0;v.age++;return;}
  if(frame%32===0||v.age===0){
    const slow=.5+.5*Math.sin(TAU*(beats/p.speed+v.identity)),
      vibrato=sin(age*5.1+v.identity)*smooth((age-.16)/.35),
      drift=sin(age*.19+v.identity)*p.wow;
    v.step=v.frequency/v.rate*(1+movement*(drift+p.vibrato*vibrato));
    // Filter envelope keeps harmonics alive after the attack; no waveform-to-sine crossfade.
    const shape=.14+p.env*Math.exp(-age/p.filterDecay)+movement*(.08+slow*.22),
      cutoff=Math.min(v.rate*.3,p.base+(p.ceiling*brightness+.4*v.frequency)*shape*(v.filterLift??1));
    const target=Math.tan(Math.PI*cutoff/v.rate);v.gStep=(target-v.g)/32;
    v.fmIndex=p.fm?Math.min(p.index*(.18+.82*Math.exp(-age/.3)),Math.max(0,(v.rate*.35/v.frequency-1)/(p.fm+1))):0;
  }
  v.g+=v.gStep;
  let a=lookup(v.table,v.phase),b=lookup(v.table,v.phase2),c=lookup(v.table,v.phase3);
  if(p.fm){a=sin(v.phase+sin(v.modPhase)*v.fmIndex/TAU)*.8;b=sin(v.phase2+sin(v.modPhase)*v.fmIndex/TAU)*.8;v.modPhase=(v.modPhase+v.step*p.fm)%1;}
  let l=a*.52+b*.23+c*.25,r=a*.23+b*.52+c*.25;
  if(p.noise){let n=v.noiseState;n^=n<<13;n^=n>>>17;n^=n<<5;v.noiseState=n>>>0;
    const noise=v.noiseState/2147483648-1;v.noiseLow+=.15*(noise-v.noiseLow);
    l=l*(1-p.noise)+v.noiseLow*p.noise;r=r*(1-p.noise)+v.noiseLow*p.noise;}
  if(p.drive){l=l*p.drive/(1+Math.abs(l)*(p.drive-1));r=r*p.drive/(1+Math.abs(r)*(p.drive-1));}
  // Topology-preserving state-variable lowpass, stable at every supported device rate.
  const g=v.g,a1=1/(1+g*(g+v.k)),a2=g*a1,a3=g*a2;
  const v3L=l-v.ic2L,v1L=a1*v.ic1L+a2*v3L,v2L=v.ic2L+a2*v.ic1L+a3*v3L;
  const v3R=r-v.ic2R,v1R=a1*v.ic1R+a2*v3R,v2R=v.ic2R+a2*v.ic1R+a3*v3R;
  v.ic1L=2*v1L-v.ic1L;v.ic2L=2*v2L-v.ic2L;v.ic1R=2*v1R-v.ic1R;v.ic2R=2*v2R-v.ic2R;
  l=v2L;r=v2R;
  if(p.bass)l=r=(l+r)*.5*(1-p.sub)+sin(v.phase)*p.sub;
  v.highL+=v.highCoefficient*(l-v.highL);v.highR+=v.highCoefficient*(r-v.highR);
  const envelope=smooth(age/v.attack)*smooth((v.duration-age)/v.release)*
    (p.sustain+(1-p.sustain)*Math.exp(-age/p.ampDecay))*p.level*(v.expression??1);
  v.left=envelope===0?0:(l-v.highL)*envelope;v.right=envelope===0?0:(r-v.highR)*envelope;
  v.phase=(v.phase+v.step)%1;v.phase2=(v.phase2+v.step*(1+p.spread))%1;v.phase3=(v.phase3+v.step*(1-p.spread*.83))%1;v.age++;
}

export const SYNTHWAVE_KITS=Object.freeze({
  'neon-machine':{kick:49,sweep:130,kickDecay:13,snare:188,snareDecay:13,gate:.23,cutoff:9700,metal:6100},
  'neon-dream':{kick:46,sweep:90,kickDecay:13,snare:175,snareDecay:16,gate:.22,cutoff:7800,metal:5600},
  'neon-electro':{kick:51,sweep:150,kickDecay:16,snare:208,snareDecay:17,gate:.18,cutoff:10800,metal:6700},
  'neon-gated':{kick:45,sweep:125,kickDecay:12,snare:166,snareDecay:9,gate:.27,cutoff:9300,metal:5900},
  'neon-vapor':{kick:47,sweep:75,kickDecay:15,snare:180,snareDecay:20,gate:.18,cutoff:6800,metal:5200},
  'neon-sunset':{kick:48,sweep:110,kickDecay:14,snare:195,snareDecay:13,gate:.23,cutoff:9000,metal:6300},
});
export function createSynthwaveDrum(event,rate,identity,tempo=100){
  const p=SYNTHWAVE_KITS[event.kit],name=event.drum,
    duration=name==='kick'?.45:name==='snare'?p.gate+.05:name==='clap'?.3:name==='open-hat'?.32:name==='tom'?.36:name==='crash'?1.45:name==='riser'?(event.beats??4)*60/tempo:.09;
  return {...event,tuning:event.tuning??1,synthwaveDrum:true,profile:p,rate,duration,age:-Math.round((event.delay??0)*60/tempo*rate),phase:0,phase2:identity,
    noiseState:((identity*4294967296)>>>0)||1,low:0,body:0,
    high:1-Math.exp(-TAU*Math.min(rate*.4,p.cutoff)/rate),bodyCoefficient:1-Math.exp(-TAU*(name.includes('hat')?4200:name==='crash'?2500:1100)/rate)};
}
export function sampleSynthwaveDrum(v){
  const age=v.age/v.rate,p=v.profile,name=v.drum;
  if(age<0||age>=v.duration){v.age++;return 0;}
  let state=v.noiseState;state^=state<<13;state^=state>>>17;state^=state<<5;v.noiseState=state>>>0;
  v.low+=v.high*(v.noiseState/2147483648-1-v.low);v.body+=v.bodyCoefficient*(v.low-v.body);
  const noise=v.low-v.body;let frequency,wave,envelope;
  if(name==='kick'){
    frequency=(p.kick+p.sweep*Math.exp(-age*58))*v.tuning;
    wave=sin(v.phase)*.93+sin(v.phase*2)*.13*Math.exp(-age*35)+noise*.32*Math.exp(-age*200);
    envelope=Math.exp(-age*p.kickDecay);
  }else if(name==='snare'){
    frequency=(p.snare+65*Math.exp(-age*55))*v.tuning;
    wave=noise*.95+sin(v.phase)*.48*Math.exp(-age*20)+sin(v.phase2)*.19*Math.exp(-age*29);
    envelope=Math.exp(-age*p.snareDecay)*smooth((p.gate-age)/.028);
    if(v.kit==='neon-gated')envelope=(.3+.7*Math.exp(-age*18))*smooth((p.gate-age)/.035);
  }else if(name==='clap'){
    frequency=180;const bursts=age<.036?Math.sin(Math.PI*(age%.012)/.012)**2:Math.exp(-(age-.036)*(14+p.snareDecay*.3+p.kick*.09));
    wave=noise*.85;envelope=bursts*Math.exp(-age*8);
  }else if(name==='tom'){
    frequency=(p.kick*2.3+95*Math.exp(-age*30))*v.tuning;wave=sin(v.phase)*.85+noise*.05;envelope=Math.exp(-age*13);
  }else if(name==='riser'){
    frequency=200+age/v.duration*1800;wave=noise*.65+sin(v.phase)*.08;envelope=(age/v.duration)**1.6;
  }else{
    frequency=Math.min(v.rate*.26,p.metal*v.tuning*Math.min(1,v.rate/30000));
    wave=noise*.95+sin(v.phase)*sin(v.phase2)*.1;
    envelope=Math.exp(-age*(name==='hat'?62:name==='crash'?3.3:12));
  }
  const out=wave*envelope*smooth(age/.001)*smooth((v.duration-age)/.014);
  v.phase=(v.phase+frequency/v.rate)%1;v.phase2=(v.phase2+Math.min(v.rate*.36,frequency*1.483)/v.rate)%1;v.age++;
  return out;
}
