

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const bassSmooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const flowing=new Set(['liquid','atmospheric','melodic','deep','dub','ambient','hypnotic']);
const nimble=new Set(['garage','detroit','minimal','tribal']);

export function createBassExpression(event,rate,tempo,family,identity=.5){
  const gate=event.beats*60/tempo,beat=60/tempo,
    choice=Math.floor(identity*65536)>>>0,u=(choice%997)/997,
    flow=flowing.has(family),light=nimble.has(family),tail=event.articulation==='tail',
    mode=gate<beat*.24?'pluck':flow&&choice%5!==0?'flow':choice%4===0?'pluck':'round',
    attack=Math.min(gate*.3,Math.max(flow?.014:light?.010:.007,(flow?.55:.36)/event.frequency)*(.88+u*.24)),
    release=Math.min((flow?.165:light?.115:.085)*(mode==='pluck'?.72:1)*(tail?1.16:1)*(.88+u*.24),beat*.48,gate*.6+.04),
    sustain=clamp((mode==='flow'?.66:mode==='round'?.48:.25)+(u-.5)*.16-(tail?.07:0),.16,.76),
    decay=Math.max(.045,gate*(mode==='flow'?.7:mode==='round'?.42:.24));
  return {mode,attack,release,sustain,decay,decayRate:Math.exp(-1/(rate*decay)),decayLevel:1,
    peak:(event.articulation==='accent'||event.accent?.97:.90)+(u-.5)*.05,
    connect:mode==='flow'?choice%5!==1:mode==='round'&&choice%4===1,
    glide:flow?.045+u*.045:light?.026+u*.025:.018+u*.021,
    filterDecay:clamp(gate*(mode==='flow'?.85:.42),.065,.38),filterLift:.86+u*.28,
    motionPhase:u*.24,motionScale:[.75,1,1,1.5][choice%4],
    startLevel:0,segmentStart:0,level:0,retireAge:null};
}

export function sampleBassExpression(v){
  const b=v.bassExpression,age=v.age/v.rate;
  if(age<0||age>=v.duration){b.level=0;return 0;}
  if(b.retireAge!==null){
    b.level=b.retireLevel*(1-bassSmooth((age-b.retireAge)/b.retireSeconds));
    return b.level;
  }
  const body=b.peak*(b.sustain+(1-b.sustain)*b.decayLevel),attack=bassSmooth((age-b.segmentStart)/b.attack);
  b.decayLevel*=b.decayRate;
  b.level=(b.startLevel*(1-attack)+body*attack)*bassSmooth((v.duration-age)/b.release);
  return b.level;
}

export function canConnectBass(v,previous){
  if(!previous||!v.bassExpression.connect||previous.bassExpression.retireAge!==null)return false;
  const age=previous.age/previous.rate;

  return age<previous.duration&&age-previous.gate<Math.min(.095,previous.bassExpression.release*.75)&&previous.bassExpression.level>.09;
}

export function inheritBassExpression(v,previous){
  const b=v.bassExpression;
  b.startLevel=previous.bassExpression.level*(previous.amplitude??1)/(v.amplitude??1);
  b.attack=Math.max(b.attack,.028);
  v.fromFrequency=previous.frequencyNow;v.glide=b.glide;v.connected=true;
  
  previous.duration=previous.age/previous.rate;
}

export function retireBassExpression(v,seconds){
  const b=v.bassExpression,age=v.age/v.rate;
  if(b.retireAge!==null||age>=v.duration)return;
  b.retireAge=age;b.retireLevel=b.level;
  b.retireSeconds=Math.min(seconds,v.duration-age);
  v.duration=age+b.retireSeconds;
}

export function extendBassExpression(v,gateSeconds){
  const b=v.bassExpression,age=v.age/v.rate;
  b.startLevel=b.level;b.segmentStart=age;b.attack=Math.max(.035,b.attack);
  b.decayLevel=1;b.retireAge=null;
  v.gate=age+gateSeconds;v.duration=v.gate+b.release;
}
