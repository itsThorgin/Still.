
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
export function sampleMetalTone(v,frame,beats,brightness,movement,scene,p){
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
    if(v.patch==='metal-motif'){const m=v.toneShapeModel;input=m?.wave?oscillator(m.wave,v.phase,dt,v.width)*.72+oscillator(m.wave,v.phase2,dt*m.ratio,v.width)*.28:sine(v.phase+(m?.index??.20)*v.filterEnvelope*sine(v.phase2));}
    if(bass&&!acid)input=input*.6+sine(v.phase)*.4;
    v.cutoff+=(v.targetCutoff-v.cutoff)*.0028;
    const g=Math.tan(Math.PI*v.cutoff/v.fs),a1=1/(1+g*(g+v.k)),a2=g*a1,a3=g*a2;
    const driven=soft(input*(c.drive??1.2));
    const v3=driven-v.ic2,v1=a1*v.ic1+a2*v3,v2=v.ic2+a2*v.ic1+a3*v3;
    v.ic1=2*v1-v.ic1;v.ic2=2*v2-v.ic2;
    
    v.lp+=(1-Math.exp(-TAU*Math.min(v.cutoff*1.8,v.fs*.35)/v.fs))*(v2-v.lp);
    const out=acid?soft((v.lp*.65+v2*.35)*(1+(c.drive-1)*.3)):v2;
    output+=out/v.oversample;
    v.phase=(v.phase+dt)%1;v.phase2=(v.phase2+dt*(v.patch==='metal-motif'?(v.toneShapeModel?.ratio??2.731):1.003))%1;
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

