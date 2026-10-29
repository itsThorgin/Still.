
import {createSynthwaveTone,sampleSynthwaveTone} from './synthwave-instruments.mjs';
import {synthwaveExpressionColour} from './synthwave-expression-colours.mjs';
import {createElectronicTone,sampleElectronicTone} from './electronic-instruments.mjs';
const TAU=Math.PI*2,SIZE=2048;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const sine=Float32Array.from({length:SIZE+1},(_,i)=>Math.sin(TAU*i/SIZE));
function lookup(table,p){const x=(p-Math.floor(p))*SIZE,i=Math.floor(x);return table[i]+(table[i+1]-table[i])*(x-i);}
const sin=p=>lookup(sine,p);
const struck=new Set(['mall-tines','pixel-glass','signal-fm','soft-pluck','vhs-keys']);
const legacyInstruments=Object.freeze({'saw-lead':'city-saw','hollow-lead':'velvet-lead','brass':'sunset-brass',
  'glass-lead':'pixel-glass','electric-keys':'vhs-keys','dark-keys':'vhs-keys','bell-pluck':'pixel-glass',
  'pulse-arp':'clock-pulse','dub-stab':'clock-pulse','wide-pad':'neon-strings','silk-pad':'neon-strings',
  'choir-pad':'dream-chorus','dark-pad':'oxide-pad'});

export function createExpressiveSynthwaveTone(event,rate,duration,identity,tempo,id,onsetBeats=0){
  const colour=synthwaveExpressionColour(id);
  const legacy=!!legacyInstruments[event.instrument];
  if(!colour||event.role==='bass'){
    if(legacy||id<=15){const v=createElectronicTone(event,rate,duration,identity);if(v)v.expressionBaseLegacy=true;return v;}
    return createSynthwaveTone(event,rate,duration,identity,tempo);
  }
  const instrument=legacyInstruments[event.instrument]??event.instrument,
    melody=event.role==='melody',percussive=struck.has(instrument)||['pulse-arp','dub-stab'].includes(event.instrument),
    pad=event.instrument.endsWith('pad')||event.instrument.endsWith('strings')||['dream-chorus','oxide-pad'].includes(event.instrument),

    maxFrequency=melody&&!percussive?Math.min(rate*.42,event.frequency*2):event.frequency,
    v=createSynthwaveTone({...event,instrument,frequency:maxFrequency},rate,duration,identity,tempo);
  if(!v)return null;
  const p={...v.profile};
  if(legacy){

    const original=createElectronicTone({...event,frequency:maxFrequency},rate,duration,identity);
    if(!original)return null;
    v.table=original.table;v.count=original.count;v.phase2=original.phase2;v.phase3=original.phase3;
    v.attack=Math.min(duration*.2,original.attack);v.release=original.release;
    p.fm=0;p.index=0;p.level=.95;
    if(percussive){p.sustain=0;p.ampDecay=-1/(rate*Math.log(original.decayRate));p.vibrato*=.25;}
    if(event.instrument==='dark-keys'){p.ceiling*=.72;p.env*=.85;}
  }
  v.instrument=event.instrument;
  v.frequency=event.frequency;v.frequencyNow=event.frequency;v.step=event.frequency/rate;
  v.profile=p;v.polishTone=true;v.colour=colour;v.isPad=pad;v.isStruck=percussive;v.onsetBeats=onsetBeats;
  v.gate=duration;v.startGain=0;v.gain=0;v.retireAge=null;v.maxFrequency=maxFrequency;
  v.glideCoefficient=1-Math.exp(-1/(rate*(colour.glide??(id===34?.020:.045))));
  const position=((onsetBeats%16)+16)%16/16,
    arc=.94+.075*Math.sin(Math.PI*position)+.035*Math.cos(TAU*onsetBeats/4);
  if(melody){
    v.attack=Math.min(duration*.24,(percussive?Math.max(.006,Math.min(colour.attack,.012)):colour.attack)*(.94+.12*identity));
    v.release=Math.min(colour.release,duration*.32+.02);v.duration=duration+v.release;
    v.expression=(event.expression??1)*arc;p.sustain*=percussive?1:.94;p.ampDecay*=percussive?1.04:1.18;
    p.spread*=colour.spread;p.vibrato*=colour.vibrato;
    if(p.fm)p.index*=event.instrument==='signal-fm'?.86:.94;
  }else if(pad){
    p.spread*=1.10;p.ceiling*=.94;
    v.highCoefficient=1-Math.exp(-TAU*(legacy?165:220)/rate);
  }else p.spread*=.98;
  return v;
}

export function startExpressiveSynthwaveTone(v,previous){
  v.polishStarted=true;
  if(v.role!=='melody')return previous;
  if(previous&&previous.age/previous.rate<previous.duration){
    const age=previous.age/previous.rate,ratio=previous.frequencyNow/v.frequency,
      connected=v.colour.connect&&!v.isStruck&&!previous.isStruck&&v.instrument===previous.instrument&&
        v.identity<v.colour.connectChance&&age-previous.gate<.085&&previous.gain>.025&&ratio>=.5&&ratio<=2&&previous.frequencyNow<=v.maxFrequency;
    if(connected){
      for(const key of ['phase','phase2','phase3','modPhase','g','ic1L','ic2L','ic1R','ic2R','highL','highR'])v[key]=previous[key];
      v.frequencyNow=previous.frequencyNow;v.startGain=previous.gain*previous.amplitude/v.amplitude;
      v.attack=Math.max(.028,v.attack);v.connected=true;previous.duration=age;
    }else{
      previous.retireAge=age;previous.retireGain=previous.gain;
      previous.retireSeconds=Math.min(previous.duration-age,Math.max(.018,v.attack));
      previous.duration=age+previous.retireSeconds;
    }
  }
  return v;
}

export function sampleExpressiveSynthwaveTone(v,frame,beats,brightness,movement){
  if(!v.polishTone){
    if(v.expressionBaseLegacy)sampleElectronicTone(v,frame,beats,brightness,movement);
    else sampleSynthwaveTone(v,frame,beats,brightness,movement);
    return;
  }
  const age=v.age/v.rate,p=v.profile,c=v.colour,melody=v.role==='melody';
  if(age<0||age>=v.duration){v.left=v.right=0;v.gain=0;v.age++;return;}
  if(frame%32===0||v.age===0){
    const phrase=.5+.5*sin(beats/16+c.id*.071),pressure=smooth(age/.28)*(.55+.45*sin(beats/8+c.id*.031)),
      vibrato=sin(frame/v.rate*(5.05+v.identity*.2)+c.id*.137)*smooth((age-.16)/.36),
      drift=sin(frame/v.rate*.19+c.id*.079)*p.wow;
    v.pitchRatio=1+movement*(drift+p.vibrato*vibrato);
    v.spread=p.spread*(1+movement*(v.isPad?.17:.07)*sin(beats/12+c.id*.061));
    const shape=(v.isPad?.18:.14)+p.env*Math.exp(-age/(p.filterDecay*(melody?1.15:1)))+
      movement*(.08+phrase*.18+(melody?c.pressure*pressure:0)),
      cutoff=clamp((p.base+(p.ceiling*brightness+.4*v.frequency)*shape*(v.filterLift??1))*(melody?c.filter:1),55,v.rate*.29);
    const target=Math.tan(Math.PI*cutoff/v.rate);v.gStep=(target-v.g)/32;
    v.fmIndex=p.fm?Math.min(p.index*(.18+.82*Math.exp(-age/.36)),Math.max(0,(v.rate*.35/v.frequency-1)/(p.fm+1))):0;
  }
  v.frequencyNow+=(v.frequency-v.frequencyNow)*v.glideCoefficient;v.step=v.frequencyNow/v.rate*v.pitchRatio;
  v.g+=v.gStep;
  let a,b;
  if(p.fm){a=sin(v.phase+sin(v.modPhase)*v.fmIndex/TAU)*.8;b=sin(v.phase2+sin(v.modPhase)*v.fmIndex/TAU)*.8;v.modPhase=(v.modPhase+v.step*p.fm)%1;}
  else{a=lookup(v.table,v.phase);b=lookup(v.table,v.phase2);}
  const z=lookup(v.table,v.phase3);
  let l=a*.52+b*.23+z*.25,r=a*.23+b*.52+z*.25;
  if(p.drive){l=l*p.drive/(1+Math.abs(l)*(p.drive-1));r=r*p.drive/(1+Math.abs(r)*(p.drive-1));}
  const g=v.g,a1=1/(1+g*(g+v.k)),a2=g*a1,a3=g*a2,
    v3L=l-v.ic2L,v1L=a1*v.ic1L+a2*v3L,v2L=v.ic2L+a2*v.ic1L+a3*v3L,
    v3R=r-v.ic2R,v1R=a1*v.ic1R+a2*v3R,v2R=v.ic2R+a2*v.ic1R+a3*v3R;
  v.ic1L=2*v1L-v.ic1L;v.ic2L=2*v2L-v.ic2L;v.ic1R=2*v1R-v.ic1R;v.ic2R=2*v2R-v.ic2R;
  v.highL+=v.highCoefficient*(v2L-v.highL);v.highR+=v.highCoefficient*(v2R-v.highR);
  const attack=smooth(age/v.attack),target=(p.sustain===1?1:p.sustain+(1-p.sustain)*Math.exp(-age/p.ampDecay))*p.level*(v.expression??1);
  v.gain=v.retireAge===null?(v.startGain*(1-attack)+target*attack)*smooth((v.duration-age)/v.release)
    :v.retireGain*(1-smooth((age-v.retireAge)/v.retireSeconds));
  v.left=(v2L-v.highL)*v.gain;v.right=(v2R-v.highR)*v.gain;
  v.phase=(v.phase+v.step)%1;v.phase2=(v.phase2+v.step*(1+v.spread))%1;v.phase3=(v.phase3+v.step*(1-v.spread*.83))%1;v.age++;
}
