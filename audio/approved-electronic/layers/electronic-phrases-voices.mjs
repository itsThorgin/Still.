import {prepareBassForeground as prepareBass,prepareTechForeground as prepareTech,sampleBassForeground as sampleBass,
  updateTechForeground as updateTech,sampleTechForeground as sampleTech,smooth} from './electronic-expression-voices.mjs';
export {startHatChoke,sampleExpressionDrum} from './electronic-expression-voices.mjs';
const TAU=Math.PI*2;
function applyGesture(v){
  const g=v.phraseGesture,x=v.foregroundExpression;if(!g||!x)return;
  x.mode=g.mode;x.peak*=g.level??1;x.filterLift*=g.colour??1;x.send=g.send??x.send;
  x.vibrato=g.vibrato??x.vibrato;x.shimmer=g.shimmer??0;x.wave=g.wave;x.glide=g.glide??.045;x.connect=!!g.connect;x.basePan=v.pan??0;
  if(['hold','slide','swell','answer'].includes(g.mode)&&!x.struck){
    x.attack=g.attack??(g.mode==='swell'?.12:.045);x.release=g.release??.16;x.decay=g.mode==='swell'?1.2:.7;x.sustain=g.mode==='swell'?.52:.47;
    x.pressure=.12;v.duration=x.gate+x.release;
  }else if(g.mode==='chord'){
    x.attack=g.attack??.012;x.release=g.release??.1;x.decay=.23+(x.u??.5)*.14;x.sustain=.04;v.duration=x.gate+x.release;
  }
  if(g.mode==='pulse'){x.attack=.006;x.release=.028;x.decay=.15;x.sustain=.09;}
  if(g.mode==='singing'){x.attack=.025;x.release=.075;x.decay=.5;x.sustain=.35;v.duration=x.gate+x.release;}
}
export function prepareBassForeground(v,...args){prepareBass(v,...args);applyGesture(v);}
export function prepareTechForeground(v,...args){prepareTech(v,...args);applyGesture(v);}
export function sampleBassForeground(v,...args){sampleBass(v,...args);}
export function startTechForeground(v,runtime){
  v.expressionStarted=true;const x=v.foregroundExpression;if(v.role!=='melody')return;
  const previous=runtime.phraseLead,old=previous?.foregroundExpression;
  if(previous&&old&&previous.age/previous.rate<previous.duration){
    const age=previous.age/previous.rate,ratio=previous.frequencyNow/v.frequency;
    if(x.connect&&age-old.gate<.08&&old.lastGain>.012&&ratio>.5&&ratio<2){
      for(const key of ['phase','phase2','ic1','ic2','lp','cutoff','filterEnvelope','targetCutoff','drift','width'])v[key]=previous[key];
      v.frequencyNow=previous.frequencyNow;v.held=true;v.slideCoefficient=1-Math.exp(-1/(v.fs*x.glide));
      x.startGain=old.lastGain*previous.amplitude/v.amplitude;x.pitchAge=old.pitchAge;x.attack=Math.max(.03,x.attack);
      v.connectedForeground=true;previous.duration=age;
    }else if(old.retireAge===null){
      old.retireAge=age;old.retireGain=old.lastGain;old.retireSeconds=Math.min(previous.duration-age,.035);previous.duration=age+old.retireSeconds;
    }
  }
  runtime.phraseLead=v;
}
export function updateTechForeground(v,frame,beats,movement){
  updateTech(v,frame,beats,movement);const x=v.foregroundExpression;
  if(frame%32===0||v.age===0){
    const age=v.age/v.rate,late=smooth((x.pitchAge-.22)/.25),vibrato=(x.vibrato??0)*movement*late*Math.sin(TAU*(frame/v.rate*4.9+x.id*.11));
    v.targetFrequency=x.originalFrequency*2**(vibrato/1200);
    x.filterScale*=1+movement*.10*smooth(age/.35)*Math.sin(TAU*(beats/12+x.id*.07));
    x.detune2=1.003+(x.shimmer??0)*.014*movement*late*Math.sin(TAU*frame/v.rate*.63);
    v.pan=Math.max(-.45,Math.min(.45,x.basePan+(x.shimmer??0)*movement*Math.sin(TAU*beats/9)));
  }
}
export function sampleTechForeground(v,beats,movement){
  const x=v.foregroundExpression,raw=sampleTech(v,beats,movement),age=v.age/v.rate;
  const shimmer=1+(x.shimmer??0)*movement*smooth(age/.18)*Math.sin(TAU*(beats*1.7+x.id*.13));
  x.lastGain=raw*shimmer;return x.lastGain;
}
