const TAU=2*Math.PI,SIZE=4096;
const SIN=Float32Array.from({length:SIZE+1},(_,i)=>Math.sin(TAU*i/SIZE));
const waves=new Map();
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
export function sine(phase){phase-=Math.floor(phase);const x=phase*SIZE,i=Math.floor(x);return SIN[i]+(SIN[i+1]-SIN[i])*(x-i);}
function waveTable(harmonics,pulse=false){
  const key=harmonics+'/'+pulse;if(waves.has(key))return waves.get(key);
  const table=new Float32Array(SIZE+1);let sum=0;
  for(let h=1;h<=harmonics;h++)if(!pulse||h%2){const a=(pulse?1:((h%2?1:-1)))/h;sum+=Math.abs(a);
    for(let i=0;i<=SIZE;i++)table[i]+=Math.sin(TAU*i/SIZE*h)*a;}
  for(let i=0;i<=SIZE;i++)table[i]/=Math.max(1,sum*.65);
  waves.set(key,table);return table;
}
function lookup(table,phase){phase-=Math.floor(phase);const x=phase*SIZE,i=Math.floor(x);return table[i]+(table[i+1]-table[i])*(x-i);}
const expRate=(rate,seconds)=>Math.exp(-1/(rate*seconds));
const bassSpecs={
  tearout:[.005,.045,.14,.74,.95,.54],deep:[.018,.15,.5,.90,1,.065],
  garage:[.006,.05,.15,.43,.95,.24],rubber:[.004,.038,.11,.63,.93,.52],detroit:[.006,.045,.11,.4,.91,.18],
};
const toneSpecs={
  chord:[.007,.13,.12,.13],vowel:[.006,.045,.08,.56],sequence:[.025,.17,.50,.63],
  pad:[.65,1.1,2.2,.8],tension:[.28,.45,1.1,.63],rise:[.04,.07,.30,.8],
  brass:[.009,.085,.10,.18],cut:[.003,.09,.04,.04],air:[.4,.8,1.8,.8],rave:[.003,.06,.06,.08],
};
export function createRebuildVoice(event,rate,tempo,seed){
  const isBass=event.part==='bass',spec=isBass?bassSpecs[event.type]:toneSpecs[event.type];
  if(!spec)throw Error('Unknown voice '+event.type);
  const [attack,release,decay,sustain]=spec,frequency=event.frequency;
  const v={...event,rate,age:-Math.round((event.delay??0)*rate*60/tempo),
    gate:Math.max(1,Math.round(event.beats*rate*60/tempo)),release:Math.round(rate*release),attack:Math.max(2,Math.round(rate*attack)),
    decayRate:expRate(rate,decay),body:1,sustain,gain:0,phase:0,phase2:0,phase3:seed%997/997,
    subPhase:0,frequencyNow:frequency,upperNow:frequency,bendValue:event.bend??0,
    bendRate:expRate(rate,isBass?(event.type==='rubber'?.037:.08):.18),
    glide:1-expRate(rate,event.type==='sequence'?.065:.028),startGain:0,started:false,
    low:0,low2:0,hp:0,hp2:0,coefficient:.2,modPhase:(seed%29)/29,modPhase2:(seed%37)/37,
    table:waveTable(clamp(Math.floor(rate*.40/(frequency*2.2)),1,16),event.type==='detroit'||event.type==='chord'),
    softTable:waveTable(clamp(Math.floor(rate*.40/(frequency*2.2)),1,10)),
    left:0,right:0,sub:0,retireAge:-1,retireGain:0};
  v.end=v.gate+v.release;
  v.hpC=1-Math.exp(-TAU*(isBass?125:event.type==='pad'?260:190)/rate);
  if(isBass){v.subLevel=spec[4];v.upperLevel=spec[5];}
  v.panL=Math.sqrt(1-clamp(v.pan??0,-1,1));v.panR=Math.sqrt(1+clamp(v.pan??0,-1,1));
  return v;
}
export function retireRebuildVoice(v,seconds=.008){
  if(!v||v.age<0||v.age>=v.end)return;
  // A retirement starts at the last rendered gain, including any existing tail.
  v.retireAge=v.age;v.retireGain=v.gain;v.retireLength=Math.max(2,Math.round(v.rate*seconds));
  v.end=Math.min(v.end,v.age+v.retireLength);
}
export function startRebuildVoice(v,old,stats){
  v.started=true;
  if(!old||old.age<0||old.age>=old.end)return;
  const close=Math.abs(Math.log2(old.frequencyNow/v.frequency))<.7,
    near=old.age-old.gate<v.rate*.07;
  if(v.connect&&near&&close&&old.gain>.01){
    for(const name of ['phase','phase2','phase3','low','low2','hp','hp2','coefficient','modPhase','modPhase2'])v[name]=old[name];
    v.frequencyNow=old.frequencyNow;v.startGain=old.gain*old.amplitude/Math.max(v.amplitude,1e-8);
    v.attack=Math.round(v.rate*.045);v.connected=true;old.end=old.age;stats.connections++;
  }else{
    // Bass replacements keep the low phase but retain separate envelope attacks.
    if(v.part==='bass')v.subPhase=old.subPhase;
    retireRebuildVoice(old,v.part==='bass'?.007:.022);stats.retirements++;
  }
}
export function sampleRebuildVoice(v,frame,beats,brightness,movement,tempo){
  const rate=v.rate,age=v.age,seconds=age/rate;
  let gain;
  if(v.retireAge>=0)gain=v.retireGain*(1-smooth((age-v.retireAge)/v.retireLength));
  else{
    v.body*=v.decayRate;const body=v.sustain+(1-v.sustain)*v.body,attack=smooth(age/v.attack);
    gain=(v.startGain*(1-attack)+body*attack)*(age>=v.gate?1-smooth((age-v.gate)/v.release):1);
  }
  v.gain=gain;
  v.frequencyNow+=(v.frequency-v.frequencyNow)*v.glide;
  const type=v.type,isBass=v.part==='bass';
  if(age%16===0){
    const pressure=clamp(v.colour??.7,0,1.2),env=v.body,
      pulse=.5+.5*sine(beats*(type==='tearout'?(v.tone===3?1:2):type==='rubber'?2:1)+(v.tone??0)*.17),
      colour=clamp(brightness*.65+.25,0,1);
    let cutoff=isBass?type==='deep'?180+90*pressure:type==='garage'?450+750*env:type==='detroit'?450+600*env:
      type==='tearout'?450+2600*(.18+.82*pulse)*colour:650+2300*(.25+.75*pulse)*colour:
      type==='pad'||type==='air'?650+1000*pressure:type==='sequence'?950+1600*pressure+600*env:
      type==='cut'?800:type==='tension'?550+300*pressure:1000+2300*env*(.5+.5*pressure);
    v.coefficientTarget=1-Math.exp(-TAU*Math.min(cutoff,rate*.33)/rate);
    v.modDepth=type==='tearout'?.60+1.45*pulse*movement:type==='rubber'?.38+1.1*pulse*movement:0;
    v.drive=type==='tearout'?2.7+pressure*.65:type==='rubber'?2.2:1.1;
    v.cutMotion=pulse;
  }
  v.bendValue*=v.bendRate;
  const pitch=v.frequencyNow/rate,upperPitch=pitch*2**(v.bendValue/12)*(v.upperOctave?2:1);
  v.phase=(v.phase+upperPitch)%1;v.phase2=(v.phase2+upperPitch*(type==='pad'?1.003:1.0014))%1;
  v.coefficient+=.02*((v.coefficientTarget??.2)-v.coefficient);
  let raw=0;
  if(isBass){
    v.subPhase=(v.subPhase+pitch)%1;v.sub=sine(v.subPhase)*v.subLevel*gain;
    if(type==='tearout'||type==='rubber'){
      const mod=sine(v.phase*(type==='tearout'?2:3)+.18*sine(v.phase*1));
      raw=sine(v.phase*2+(v.modDepth??.5)*mod/TAU)*.66+lookup(v.softTable,v.phase*2)*.30;
      // Only the harmonic band is driven. The sub has its own oscillator.
      raw=Math.tanh(raw*v.drive)*.83;
    }else if(type==='deep')raw=sine(v.phase*2)*.75+sine(v.phase*3)*.2;
    else raw=lookup(v.table,v.phase)*.70+sine(v.phase*2)*.25;
    v.low+=v.coefficient*(raw-v.low);v.low2+=v.coefficient*(v.low-v.low2);
    v.hp+=v.hpC*(v.low2-v.hp);let upper=v.low2-v.hp;
    v.hp2+=v.hpC*(upper-v.hp2);upper-=v.hp2;
    v.left=v.right=upper*v.upperLevel*gain;
  }else{
    if(type==='vowel'){
      // Locally synthesised periodic formants, not recorded vocal material.
      const formants=[[650,1100],[420,1900],[300,2400]][v.tone%3],f=v.frequencyNow,
        h1=clamp(Math.round(formants[0]/f),1,Math.floor(rate*.35/f)),h2=clamp(Math.round(formants[1]/f),1,Math.floor(rate*.4/f));
      raw=sine(v.phase)*.24+sine(v.phase*h1+.20*sine(v.phase))* .58+sine(v.phase*h2)*.22;
    }else if(type==='sequence'){
      const vibrato=seconds>.34?sine(seconds*4.7)*Math.min(1,(seconds-.34)*2)*.0012:0;
      v.phase3=(v.phase3+pitch*(1+vibrato))%1;
      raw=lookup(v.softTable,v.phase3)*.68+sine(v.phase3)*.32;
    }else if(type==='air')raw=sine(v.phase)*.55+sine(v.phase*2)*.2;
    else if(type==='tension')raw=sine(v.phase)*.6+lookup(v.softTable,v.phase2)*.28;
    else raw=lookup(type==='pad'?v.softTable:v.table,v.phase)*.65+lookup(v.softTable,v.phase2)*.35;
    v.low+=v.coefficient*(raw-v.low);v.low2+=v.coefficient*(v.low-v.low2);
    v.hp+=v.hpC*(v.low2-v.hp);let upper=v.low2-v.hp;
    v.hp2+=v.hpC*(upper-v.hp2);upper-=v.hp2;
    const width=type==='pad'?sine(seconds*.31+v.phase3)*.08:0;
    v.left=upper*gain*(1+width);v.right=upper*gain*(1-width);v.sub=0;
  }
  v.age++;
}
const drumDurations={kick:.30,snare:.24,clap:.19,hat:.065,'open-hat':.22,shaker:.085,rim:.072,tom:.20,click:.023,impact:.44};
export function createRebuildDrum(event,rate,p,seed){
  const type=event.type,deep=p.id===29,tech=p.kind==='techno',garage=p.id===33,rubber=p.id===42,
    duration=event.decay??(type==='snare'?(deep?.19:rubber?.145:garage?.13:.24):drumDurations[type]);
  const v={...event,rate,age:-Math.round((event.delay??0)*60/p.tempo*rate),end:Math.round(rate*duration),duration,
    phase:0,phase2:0,low:0,high:0,body:1,noiseState:seed>>>0||1,started:false,
    pitch:type==='kick'?(deep?47:tech?52:garage?58:55):(deep?162:rubber?218:tech?192:202),
    pitchDrop:1,dropRate:expRate(rate,type==='kick'?.016:.022),
    bodyRate:expRate(rate,type==='kick'?(tech?.102:deep?.14:.086):type==='snare'?.038:.065),
    noiseRate:expRate(rate,type==='snare'?(rubber?.042:garage?.034:deep?.055:.078):type==='open-hat'?.066:type==='hat'?.018:type==='clap'?.045:type==='impact'?.10:.022),
    noiseEnv:1,lpC:1-Math.exp(-TAU*Math.min(type==='snare'?6500:9500,rate*.38)/rate),
    hpC:1-Math.exp(-TAU*Math.min(type==='snare'?950:type==='impact'?500:type==='rim'||type==='tom'?110:5200,rate*.30)/rate),
    tech,rubber,deep,panL:Math.sqrt(1-(event.pan??0)),panR:Math.sqrt(1+(event.pan??0)),retireAge:-1,gain:1};
  return v;
}
export function sampleRebuildDrum(v){
  let n=v.noiseState;n^=n<<13;n^=n>>>17;n^=n<<5;v.noiseState=n>>>0;const noise=v.noiseState/2147483648-1;
  v.low+=v.lpC*(noise-v.low);v.high+=v.hpC*(v.low-v.high);
  const bright=v.low-v.high,t=v.age/v.rate,attack=smooth(t/(v.type==='kick'?.0008:.0012)),tail=1-smooth((v.age-(v.end-v.rate*.012))/(v.rate*.012));
  v.pitchDrop*=v.dropRate;v.body*=v.bodyRate;v.noiseEnv*=v.noiseRate;
  let x=0;
  if(v.type==='kick'){
    v.phase=(v.phase+(v.pitch+110*v.pitchDrop)/v.rate)%1;
    x=(sine(v.phase)*v.body+bright*.13*v.pitchDrop)*.97;
  }else if(v.type==='snare'){
    v.phase=(v.phase+(v.pitch+65*v.pitchDrop)/v.rate)%1;
    x=(sine(v.phase)*.60+sine(v.phase*1.48)*.16)*v.body+bright*v.noiseEnv*1.12;
  }else if(v.type==='clap'){
    const bursts=(t<.012?1:t<.022?.28:t<.034?.86:.58);
    x=bright*v.noiseEnv*bursts*.96;
  }else if(v.type==='rim'||v.type==='tom'||v.type==='click'){
    const f=(v.type==='tom'?132:v.type==='rim'?560:1720)*(v.tuning??1);
    v.phase=(v.phase+f/v.rate)%1;x=(sine(v.phase)+.33*sine(v.phase*1.61))*v.body*(v.type==='tom'?.7:.55)+bright*v.noiseEnv*.22;
  }else if(v.type==='impact'){
    v.phase=(v.phase+(145+450*v.pitchDrop)/v.rate)%1;x=(bright*.75+sine(v.phase)*.3)*v.noiseEnv;
  }else{
    // Quiet inharmonic metal mixed with filtered noise; no persistent hiss.
    v.phase=(v.phase+Math.min(6750,v.rate*.27)/v.rate)%1;
    x=(bright*.75+sine(v.phase)*sine(v.phase*1.341)*.22)*v.noiseEnv;
  }
  v.gain=attack*tail;
  if(v.retireAge>=0)v.gain*=1-smooth((v.age-v.retireAge)/v.retireLength);
  v.age++;return x*v.amplitude*v.gain;
}
