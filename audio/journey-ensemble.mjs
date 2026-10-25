import {createInstrumentVoice,sampleInstrumentVoice,instrumentPatch} from './instrument-library.mjs';


const TAU=Math.PI*2,SIZE=2048,COUNTS=[1,2,4,8,16],TABLES=new Map();
const sin=Float32Array.from({length:SIZE+1},(_,i)=>Math.sin(TAU*i/SIZE));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
function lookup(t,p){const x=(p-Math.floor(p))*SIZE,i=Math.floor(x);return t[i]+(t[i+1]-t[i])*(x-i);}
const sustained=(name,family,attack,release,weights,settings={})=>({name,family,attack,release,weights,...settings});
const struck=(name,family,release,ratios,weights,decay,settings={})=>({name,family,attack:.003,release,ratios,weights,decay,...settings});
const definitions={
  'chamber-viola':sustained('Chamber viola','bowed strings',.12,.25,[1,.57,.36,.23,.16,.1,.08,.05,.04,.03,.025,.02,.015,.01,.007,.004],{bow:.035,vibrato:.0015}),
  'wheel-drone':sustained('Wheel drone','bowed strings',.065,.16,[1,.38,.47,.2,.23,.1,.13,.07,.08,.04,.045,.02,.02,.01,.01,.005],{bow:.055,vibrato:.0003,wheel:true}),
  'wood-recorder':sustained('Wood recorder','woodwinds',.055,.13,[1,.11,.18,.025,.035,.01,.012,.004,0,0,0,0,0,0,0,0],{air:.055,vibrato:.0007}),
  'double-reed':sustained('Double reed','woodwinds',.04,.14,[1,.24,.8,.16,.44,.1,.25,.05,.13,.03,.05,.02,.02,.01,.006,.003],{air:.022,vibrato:.001}),
  'chamber-horn':sustained('Chamber horn','brass',.085,.2,[1,.68,.42,.25,.16,.09,.065,.04,.025,.015,.009,.005,.003,.002,.001,0],{brass:true,vibrato:.00065}),
  'reed-organ':sustained('Reed organ','organs',.025,.18,[1,.22,.45,.12,.18,.045,.08,.02,.035,.01,0,0,0,0,0,0],{rotary:true}),
  'bowed-bass':sustained('Bowed bass','bowed strings',.09,.23,[1,.46,.23,.12,.08,.045,.03,.02,.01,0,0,0,0,0,0,0],{bow:.02,vibrato:.0003}),
  'dulcimer':struck('Hammered dulcimer','struck strings',.22,Array.from({length:12},(_,i)=>{const n=i+1;return n*Math.sqrt((1+.0006*n*n)/1.0006);}),Array.from({length:12},(_,i)=>1/(i+1)**1.05),1.9,{loss:.32}),
  'gut-lyre':struck('Gut lyre','plucked strings',.18,[1,2,3.002,4.005,5.01,6.017,7.025,8.035],[1,.43,.18,.14,.07,.05,.025,.016],1.45,{loss:.42}),
  'nylon-guitar':struck('Muted nylon guitar','plucked strings',.15,[1,2.001,3.004,4.009,5.016,6.025,7.04,8.055],[1,.18,.35,.085,.13,.045,.04,.015],1.1,{loss:.5}),
  'thumb-piano':struck('Thumb piano','lamellar keys',.22,[1,2.84,5.41,8.93,13.3],[1,.28,.12,.055,.025],1.05,{loss:.75}),
  'soft-vibes':struck('Soft vibraphone','mallets',.28,[1,3.99,10.02,14.4],[1,.22,.075,.025],2.3,{loss:.6,tremolo:true}),
  'studio-piano':struck('Studio piano','hammered keys',.25,Array.from({length:10},(_,i)=>{const n=i+1;return n*Math.sqrt((1+.00016*n*n)/1.00016);}),[1,.52,.3,.2,.13,.09,.06,.04,.025,.015],2.8,{loss:.38,pairs:true}),
  'plucked-bass':struck('Plucked bass','plucked strings',.12,[1,2.001,3.003,4.008,5.014,6.02],[1,.36,.16,.07,.035,.015],1.5,{loss:.7}),
};
export const JOURNEY_ENSEMBLE_INSTRUMENTS=Object.freeze(Object.entries(definitions).map(([id,p])=>Object.freeze({id,name:p.name,family:p.family})));
export function ensembleInstrument(id){
  if(id.startsWith('lib:')){const p=instrumentPatch(id.slice(4));return {id,name:p.name,family:p.family};}
  const p=definitions[id];if(!p)throw new RangeError('Unknown journey ensemble instrument: '+id);return p;
}
for(const [id,p] of Object.entries(definitions))if(!p.ratios)for(const count of COUNTS){
  const tables=[0,1].map(bright=>{
    const weights=p.weights.slice(0,count).map((v,i)=>v*Math.exp(-i*(bright?.03:.48))),norm=weights.reduce((a,b)=>a+Math.abs(b),0),table=new Float32Array(SIZE+1);
    for(let n=1;n<=weights.length;n++)for(let i=0;i<=SIZE;i++)table[i]+=lookup(sin,n*i/SIZE)*weights[n-1]/norm;
    return table;
  });TABLES.set(id+':'+count,tables);
}

export function createEnsembleTone(event,rate,gate,identity,tempo){
  const id=event.ensemblePatch;ensembleInstrument(id);
  if(id.startsWith('lib:'))return {...createInstrumentVoice({...event,instrumentPatch:id.slice(4)},rate,gate,identity,tempo),ensembleTone:true};
  const p=definitions[id],v={...event,ensembleTone:true,profile:p,rate,gate,duration:gate+p.release,release:p.release,
    age:-Math.round((event.delay??0)*60/tempo*rate),frequency:event.frequency,phase:identity,phase2:(identity+.27)%1,
    randomState:Math.floor(identity*4294967295)||1,low:0,airLow:0,left:0,right:0};
  if(p.ratios){
    v.modes=[];for(let i=0;i<p.ratios.length;i++){
      if(p.ratios[i]*v.frequency>=rate*.4)continue;
      const mode={ratio:p.ratios[i],weight:p.weights[i],phase:0,envelope:1,loss:Math.exp(-1/(rate*p.decay/(1+i*p.loss)))};v.modes.push(mode);
      if(p.pairs&&i<4&&mode.ratio*v.frequency*1.001<rate*.4)v.modes.push({...mode,ratio:mode.ratio*1.0009,weight:mode.weight*.24});
    }v.norm=Math.max(1,v.modes.reduce((n,m)=>n+Math.abs(m.weight),0));
  }else{
    v.count=COUNTS.filter(n=>n*v.frequency*1.004<rate*.4).at(-1)??1;
    v.tables=TABLES.get(id+':'+v.count);
  }
  return v;
}

export function sampleEnsembleTone(v,frame,beats,brightness,movement){
  if(v.instrumentVoice){sampleInstrumentVoice(v,frame,beats,brightness,movement);return;}
  const age=v.age/v.rate,p=v.profile;
  if(age<0||age>=v.duration){v.left=v.right=0;v.age++;return;}
  let random=v.randomState;random^=random<<13;random^=random>>>17;random^=random<<5;v.randomState=random>>>0;
  const noise=v.randomState/2147483648-1,bright=clamp(brightness,0,1);let x=0;
  if(p.ratios){
    for(const m of v.modes){x+=lookup(sin,m.phase)*m.weight*m.envelope*(1-(1-bright)*Math.min(.7,(m.ratio-1)*.07));m.phase=(m.phase+v.frequency*m.ratio/v.rate)%1;m.envelope*=m.loss;}
    x=x/v.norm*.85;if(p.tremolo)x*=.88+.12*lookup(sin,age*5.1+v.phase2);
  }else{
    const settle=1-Math.exp(-age/(p.brass?.16:.08)),colour=clamp((.2+bright*.65)*settle,0,1),
      vibrato=1+lookup(sin,age*5.2+v.phase2)*(p.vibrato??0)*settle;
    x=lookup(v.tables[0],v.phase)*(1-colour)+lookup(v.tables[1],v.phase)*colour;
    v.airLow+=Math.min(.6,TAU*1800/v.rate)*(noise-v.airLow);
    x+=(noise-v.airLow)*(p.air??p.bow??0)*(.3+bright*.7);
    if(p.wheel)x*=.94+.06*lookup(sin,age*7.4+v.phase2);
    if(p.rotary)x*=.96+.04*lookup(sin,beats*.28+v.phase2);
    if(p.brass)x=Math.tanh(x*(1.15+.25*settle))*.7;
    v.phase=(v.phase+v.frequency/v.rate*vibrato)%1;
  }
  
  if(frame%32===0||v.coefficient===undefined)v.coefficient=1-Math.exp(-TAU*Math.min(v.rate*.3,1800+bright*3800)/v.rate);
  v.low+=v.coefficient*(x-v.low);
  const envelope=smooth(age/p.attack)*smooth((v.duration-age)/v.release);
  v.left=v.right=v.low*envelope*.78;v.age++;
}
