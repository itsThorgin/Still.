import {createBassExpression,sampleBassExpression,canConnectBass,inheritBassExpression,retireBassExpression,extendBassExpression} from './bass-articulation.mjs';

export const TAU=Math.PI*2;
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const SIZE=4096,SINE=Float32Array.from({length:SIZE+1},(_,i)=>Math.sin(TAU*i/SIZE));
export function sine(p){p-=Math.floor(p);const x=p*SIZE,i=Math.floor(x);return SINE[i]+(SINE[i+1]-SINE[i])*(x-i);}
export function soft(x){return x/Math.sqrt(1+x*x);}
function blep(t,dt){if(t<dt){const x=t/dt;return x+x-x*x-1;}if(t>1-dt){const x=(t-1)/dt;return x*x+x+x+1;}return 0;}
export function oscillator(wave,p,dt,width=.5){
  if(wave==='sine')return sine(p);
  if(wave==='triangle')return sine(p)*.9-sine(p*3)*.1;
  const saw=2*p-1-blep(p,dt);
  if(wave==='square'||wave==='pulse')return (p<width?1:-1)+blep(p,dt)-blep((p+1-width)%1,dt);
  return saw;
}
export function createTechnoProductionTone(e,rate,tempo,p,identity){
  const config=e.patch==='acid'||e.patch==='bass'?p.bass:e.patch==='chord'?p.harmony:p.motif,
    oversample=e.patch==='acid'||config.drive>2?2:1,fs=rate*oversample,
    bassExpression=e.role==='bass'?createBassExpression(e,rate,tempo,p.family,identity):null,gate=e.beats*60/tempo;
  return {...e,config,rate,fs,oversample,bassExpression,gate,age:-Math.round((e.delay??0)*60/tempo*rate),duration:gate+(bassExpression?.release??0),
    phase:identity,phase2:(identity+.17)%1,frequencyNow:e.frequency,targetFrequency:e.frequency,
    ic1:0,ic2:0,lp:0,aa:0,envelope:1,filterEnvelope:1,accentEnvelope:e.accent?1:0,
    releaseStart:null,releaseLevel:1,cutoff:config.cutoff,control:0,g:0,k:1,
    envRate:Math.exp(-1/(fs*(e.patch==='acid'?.14:e.patch==='chord'?.12:.19))),
    ampRate:Math.exp(-1/(rate*(e.patch==='pad'?12:e.patch==='chord'?p.harmony.decay:e.patch==='bass'?.8:e.patch==='acid'?.9:p.motif.gate*.8))),
    slideCoefficient:1-Math.exp(-1/(fs*.055)),left:0,right:0,started:false};
}
export function tieTechnoProductionTone(v,e,tempo){
  v.targetFrequency=e.frequency;v.frequency=e.frequency;
  if(v.bassExpression){extendBassExpression(v,e.beats*60/tempo);v.amplitudeTarget=e.amplitude;}
  else {v.duration=v.age/v.rate+e.beats*60/tempo;v.amplitude=e.amplitude;}
  v.accent=e.accent;v.accentEnvelope=Math.max(v.accentEnvelope,e.accent?1:0);
  v.held=true; 
}
export function handoverTechnoBass(v,previous){
  if(!previous||previous.age/previous.rate>=previous.duration)return;
  if(v.patch===previous.patch&&v.patch!=='acid'&&canConnectBass(v,previous)){
    for(const key of ['phase','phase2','ic1','ic2','lp','cutoff','filterEnvelope'])v[key]=previous[key];
    inheritBassExpression(v,previous);v.held=true;
    v.frequencyNow=v.fromFrequency;v.slideCoefficient=1-Math.exp(-1/(v.fs*v.glide));
  }else{
    v.phase=previous.phase;
    retireBassExpression(previous,v.bassExpression.attack);
  }
}
export function sampleTechnoProductionTone(v,frame,beats,brightness,movement,scene,p){
  const age=v.age/v.rate,c=v.config,pad=v.patch==='pad',acid=v.patch==='acid',bass=v.role==='bass';
  if(v.age>=v.duration*v.rate){v.left=v.right=0;return;}
  if(frame%32===0||v.control===0){
    const slow=.5+.5*sine(beats/(p.automation.bars*4)),free=.5+.5*sine(frame/v.rate*p.automation.freeHz);
    const depth=movement*p.automation.depth,openness=.35+brightness*.8,
      macro=1+depth*(slow*.65+free*.35+scene.tension-.75)*1.5;
    const expression=v.bassExpression,
      phrase=expression?expression.filterLift*(1+movement*.13*sine(beats*expression.motionScale/2+expression.motionPhase)):1;
    v.targetCutoff=clamp((c.cutoff+(c.env??800)*v.filterEnvelope*(acid?1+v.accentEnvelope*.9:1))*openness*macro*phrase,65,v.rate*.34);
    const resonance=clamp((c.resonance??.3)+(acid?scene.tension*p.automation.resonanceDepth:0),0,.94);
    v.k=2-1.82*resonance;v.control=1;
    v.drift=1+movement*.0008*sine(frame/v.rate*.23+v.phase2);
    v.width=.43+movement*.07*sine(beats/13+v.phase2);
  }
  let output=0;
  for(let s=0;s<v.oversample;s++){
    v.frequencyNow+=(v.targetFrequency-v.frequencyNow)*(v.held?v.slideCoefficient:1);
    const dt=Math.min(.32,v.frequencyNow*v.drift/v.fs);
    const wave=acid?c.wave:bass?c.wave:pad?'triangle':v.patch==='chord'?'saw':c.wave;
    let input=oscillator(wave,v.phase,dt,v.width);
    if(!acid&&!bass)input=input*.72+oscillator(wave,v.phase2,dt*1.003,v.width)*.28;
    if(v.patch==='metal-motif')input=sine(v.phase+.20*v.filterEnvelope*sine(v.phase2));
    if(bass&&!acid)input=input*.6+sine(v.phase)*.4;
    v.cutoff+=(v.targetCutoff-v.cutoff)*.0028;
    const g=Math.tan(Math.PI*v.cutoff/v.fs),a1=1/(1+g*(g+v.k)),a2=g*a1,a3=g*a2;
    const driven=soft(input*(c.drive??1.2));
    const v3=driven-v.ic2,v1=a1*v.ic1+a2*v3,v2=v.ic2+a2*v.ic1+a3*v3;
    v.ic1=2*v1-v.ic1;v.ic2=2*v2-v.ic2;
    
    v.lp+=(1-Math.exp(-TAU*Math.min(v.cutoff*1.8,v.fs*.35)/v.fs))*(v2-v.lp);
    const out=acid?soft((v.lp*.65+v2*.35)*(1+(c.drive-1)*.3)):v2;
    output+=out/v.oversample;
    v.phase=(v.phase+dt)%1;v.phase2=(v.phase2+dt*(v.patch==='metal-motif'?2.731:1.003))%1;
    v.filterEnvelope*=v.envRate;v.accentEnvelope*=Math.exp(-1/(v.fs*.24));
  }
  const attack=clamp(age/(pad?.22:bass?.004:.003),0,1),release=clamp((v.duration-age)/(pad?.5:.018),0,1);
  const choke=v.releaseStart===null?1:clamp(1-(v.age-v.releaseStart)/(v.rate*.008),0,1);
  v.envelope*=v.ampRate;
  const env=acid?(.55+.45*v.envelope)*(1+.35*v.accentEnvelope):v.envelope;
  if(v.bassExpression){
    if(v.amplitudeTarget!==undefined)v.amplitude+=(v.amplitudeTarget-v.amplitude)*(1-Math.exp(-1/(v.rate*.02)));
    v.left=v.right=output*sampleBassExpression(v);
  }else v.left=v.right=output*attack*release*release*env*choke;
  v.age++;
}

export function createTechnoProductionDrum(e,rate,tempo,p,identity){
  const durations={kick:Math.min(.8,p.kick.decay*2.8),hat:.09,'open-hat':.32,ride:.65,clap:.25,snare:.23,rim:.075,tom:.32,conga:.25,metal:.29,shaker:.10,click:.045,noise:.22};
  return {...e,rate,age:-Math.round((e.delay??0)*60/tempo*rate),duration:(durations[e.drum]??.2)*(e.decayScale??1),
    phase:0,phase2:identity,metalPhases:Float64Array.from([.11,.23,.37,.48,.69,.87],x=>(x+identity)%1),
    state:Math.floor(identity*4294967295)||1,noiseLow:0,noiseBody:0,metalLow:0,previous:0,lp:0,
    highC:1-Math.exp(-TAU*Math.min(12000,rate*.4)/rate),bodyC:1-Math.exp(-TAU*Math.min(e.drum==='kick'?2600:3400,rate*.25)/rate),
    metalC:1-Math.exp(-TAU*Math.min(5800,rate*.3)/rate),started:false,kick:p.kick};
}
export function sampleTechnoProductionDrum(v){
  const t=v.age/v.rate,scale=v.decayScale??1,k=v.kick;
  let n=v.state;n^=n<<13;n^=n>>>17;n^=n<<5;v.state=n>>>0;
  const noise=v.state/2147483648-1;
  v.noiseLow+=v.highC*(noise-v.noiseLow);v.noiseBody+=v.bodyC*(v.noiseLow-v.noiseBody);
  const high=v.noiseLow-v.noiseBody;let wave=0,env=0,f=0;
  if(v.drum==='kick'){
    f=k.fundamental+k.pitch*Math.exp(-t/k.pitchTime);
    const body=sine(v.phase)+.14*sine(v.phase*2)*Math.exp(-t/.06),dry=body*Math.exp(-t/k.decay*3.8);
    
    const driven=(soft(body*k.drive)+soft(sine(v.phase+f/v.rate*.5)*k.drive))*.5;
    wave=dry*.60+driven*Math.exp(-t/k.decay*4.5)*.42+
      high*k.click*Math.exp(-t/.006)+sine(v.phase*3)*.10*Math.exp(-t/.018);
    env=1;
  }else if(['hat','open-hat','ride','metal'].includes(v.drum)){
    const freqs=[307,419,587,811,1097,1459];let metal=0;
    for(let i=0;i<6;i++){
      const hz=Math.min(freqs[i]*(v.drum==='metal'?(v.tuning??1):v.drum==='ride'?3.6:5.4),v.rate*.38),dt=hz/v.rate;
      metal+=oscillator('square',v.metalPhases[i],dt,.5)/6;v.metalPhases[i]=(v.metalPhases[i]+dt)%1;
    }
    v.metalLow+=v.metalC*(metal-v.metalLow);
    wave=high*.70+(metal-v.metalLow)*(v.drum==='ride'?1.8:1.2);
    env=Math.exp(-t/((v.drum==='hat'?.018:v.drum==='open-hat'?.085:v.drum==='ride'?.19:.08)*scale));
  }else if(v.drum==='snare'||v.drum==='clap'){
    f=v.drum==='snare'?186:132;
    const burst=v.drum==='clap'?Math.exp(-t/.0035)+(t>.011?.8*Math.exp(-(t-.011)/.004):0)+(t>.024?.7*Math.exp(-(t-.024)/.006):0)+.36*Math.exp(-t/.067):Math.exp(-t/.054);
    wave=high*1.8*burst+sine(v.phase)*.34*Math.exp(-t/.028)+sine(v.phase2)*.11*Math.exp(-t/.016);env=1;
  }else if(v.drum==='tom'||v.drum==='conga'){
    f=(v.drum==='tom'?132:219)*(v.tuning??1)*(1+.42*Math.exp(-t/.025));
    wave=sine(v.phase)*.86+sine(v.phase2)*.19+high*.12*Math.exp(-t/.012);
    env=Math.exp(-t/((v.drum==='tom'?.085:.055)*scale));
  }else if(v.drum==='rim'||v.drum==='click'){
    f=(v.drum==='rim'?545:1350)*(v.tuning??1);wave=sine(v.phase)*.6+sine(v.phase2)*.35+high*.45;
    env=Math.exp(-t/(v.drum==='rim'?.012:.005));
  }else{wave=high;env=Math.exp(-t/(v.drum==='noise'?.045:.022));}
  v.phase=(v.phase+f/v.rate)%1;v.phase2=(v.phase2+f*1.481/v.rate)%1;
  const attack=clamp(t/(v.drum==='kick'?.0007:.0008),0,1),tail=clamp((v.duration-t)/.015,0,1);
  v.age++;return wave*env*attack*tail*tail*v.amplitude;
}
