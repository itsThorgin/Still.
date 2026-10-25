import {createElectronicTone} from './electronic-instruments.mjs';

const TAU=Math.PI*2,SIZE=2048,tables=new Map();
const profile=p=>Object.freeze({texture:true,harmonics:[1,.12,.04],attack:2,release:4,ceiling:1500,speed:.025,
  detune:1.001,drift:.001,noise:0,noiseLow:80,noiseHigh:1800,morph:.3,...p});
// Air, rain and tape are deterministic local synthesis. Modes contain
// [frequency ratio, level, decay seconds]; zero decay sustains a mode.
export const AMBIENT_TEXTURES=Object.freeze({
  'forest-air':profile({harmonics:[1,.02,.19,.01,.08],other:[1,.12,.03,.08],attack:3.8,release:6,ceiling:1400,
    noise:.78,noiseLow:180,noiseHigh:2200,speed:.041,modes:[[1,.18,0],[2.99,.07,0]],drift:.002}),
  'glacial-glass':profile({harmonics:[1,.02,.04,.11,.01,.07],other:[1,.05,.01,.02,.13],attack:1.7,release:7,
    ceiling:3100,speed:.018,modes:[[1,.32,22],[1.503,.2,16],[2.013,.12,11],[3.991,.06,7]],drift:.0005}),
  'stone-tide':profile({harmonics:[1,.2,.31,.05,.11,.02,.06],other:[1,.04,.18,.02,.06],attack:3.2,release:6,
    ceiling:420,noise:.12,noiseLow:28,noiseHigh:300,speed:.011,drift:.0008,drive:1.8}),
  'void-carrier':profile({harmonics:[1,.005,.02,.005,.16,.005,.08],other:[1,.03,.01,.12,.01,.05],attack:2.5,release:6.5,
    ceiling:2200,detune:1.0002,speed:.009,drift:.0004,morph:.55}),
  'orbital-halo':profile({harmonics:[1,.01,.15,.03,.06,.02,.09],other:[1,.2,.01,.07,.14,.01,.02],attack:4,release:7,
    ceiling:2800,detune:1.0023,speed:.016,morph:.75,modes:[[2.001,.14,0],[3.998,.07,0]]}),
  'tape-choir':profile({harmonics:[1,.22,.32,.045,.16,.02,.06],other:[1,.34,.09,.11,.025],attack:1.8,release:4.5,
    ceiling:1100,noise:.045,noiseLow:700,noiseHigh:3100,speed:.032,drift:.0045,flutter:.0006,wear:.25}),
  'memory-keys':profile({harmonics:[1,.23,.04,.08,.015],other:[1,.12,.01],attack:.025,release:2.8,
    ceiling:1900,decay:3.8,drift:.0035,flutter:.0004,noise:.018,noiseLow:900,noiseHigh:2600,
    modes:[[1,.2,4.8],[2.003,.1,1.9],[3.012,.04,.8]],wear:.3}),
  'room-tone':profile({harmonics:[1,.05,.035,.08],other:[1,.03,.08,.015],attack:4.5,release:6,
    ceiling:900,noise:.66,noiseLow:60,noiseHigh:1100,speed:.013,drift:.0003}),
  'wire-hum':profile({harmonics:[1,.6,.03,.19,.015,.08],other:[1,.22,.07,.32,.03,.11],attack:2.8,release:5.5,
    ceiling:1200,noise:.08,noiseLow:1100,noiseHigh:2800,detune:1.00015,speed:.021,drift:.0016}),
  'rain-vault':profile({harmonics:[1,.01,.035],other:[1,.07,.01],attack:2.8,release:5,
    ceiling:2300,noise:.91,noiseLow:420,noiseHigh:3600,speed:.057,drift:.0004,rain:true}),
  'vowel-veil':profile({harmonics:[1,.05,.63,.04,.35,.025,.12],other:[1,.36,.08,.5,.035,.2,.02],attack:2.6,release:5.5,
    ceiling:2500,detune:1.002,speed:.026,morph:.9,drift:.0018,noise:.025,noiseLow:300,noiseHigh:1600}),
  'temple-bowl':profile({harmonics:[1,.02,.07],other:[1,.035,.02],attack:.15,release:5,
    ceiling:3200,decay:16,detune:1.0004,speed:.014,drift:.0002,
    modes:[[1,.42,28],[2.013,.2,19],[2.706,.16,13],[4.071,.09,8],[5.43,.04,5]]}),
  'breath-threshold':profile({harmonics:[1,.04,.37,.025,.18],other:[1,.24,.06,.19,.015,.08],attack:3.2,release:6,
    ceiling:1600,noise:.22,noiseLow:230,noiseHigh:1700,speed:.036,morph:.8,drift:.0024}),
  'frayed-engine':profile({harmonics:[1,.17,.38,.09,.16,.04,.12,.03],other:[1,.36,.13,.2,.05,.1,.03],attack:3.4,release:6,
    ceiling:880,noise:.27,noiseLow:80,noiseHigh:1200,speed:.019,drift:.005,drive:2.8,
    modes:[[1.007,.14,0],[1.419,.09,0],[2.373,.06,0]],wear:.2}),
  'oxide-loop':profile({harmonics:[1,.25,.035,.16,.015,.05],other:[1,.07,.16,.02,.08],attack:1.2,release:4.8,
    ceiling:1400,noise:.07,noiseLow:500,noiseHigh:3000,speed:.023,drift:.006,flutter:.0011,grain:.34,wear:.4}),
  'ember-string':profile({harmonics:[1,.3,.15,.07,.035,.012],other:[1,.06,.015],attack:.12,release:5.5,
    ceiling:2100,decay:11,drift:.0014,speed:.017,modes:[[1,.2,18],[2.001,.1,8],[3.004,.05,4]]}),
  'near-piano':profile({harmonics:[1,.28,.065,.11,.018,.025],other:[1,.08,.012],attack:.012,release:2.5,
    ceiling:1800,decay:3.2,drift:.0005,modes:[[1,.28,5],[2.002,.13,2.8],[3.008,.055,1.3],[4.019,.02,.6]]}),
  'window-warmth':profile({harmonics:[1,.32,.07,.12,.015,.025],other:[1,.17,.12,.025,.05],attack:3.5,release:6,
    ceiling:1050,detune:1.0014,speed:.022,morph:.45,drift:.0011}),
});
function tableFor(name,count,alternate=false){
  const key=name+':'+count+':'+alternate;if(tables.has(key))return tables.get(key);
  const p=AMBIENT_TEXTURES[name],weights=(alternate?p.other??p.harmonics:p.harmonics).slice(0,count),
    norm=weights.reduce((a,b)=>a+Math.abs(b),0),table=new Float32Array(SIZE+1);
  for(let i=0;i<=SIZE;i++)for(let n=0;n<weights.length;n++)table[i]+=Math.sin(TAU*(n+1)*i/SIZE)*weights[n]/norm;
  tables.set(key,table);return table;
}
function lookup(table,phase){const pos=phase*SIZE,i=Math.floor(pos);return table[i]+(table[i+1]-table[i])*(pos-i);}
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function createAmbientTexture(event,rate,duration,identity){
  const p=AMBIENT_TEXTURES[event.instrument];if(!p)return null;
  const tone=createElectronicTone({...event,instrument:'silk-pad'},rate,duration,identity);if(!tone)return null;
  const count=Math.min(tone.count,Math.max(p.harmonics.length,p.other?.length??0));
  const modes=(p.modes??[]).filter(([ratio])=>ratio*event.frequency*1.02<rate*.42).map(([ratio,level,decay],i)=>({
    ratio,level,decay:decay?Math.exp(-1/(rate*decay)):1,envelope:1,
    sin:Math.sin(TAU*(identity+i*.13)),cos:Math.cos(TAU*(identity+i*.13)),stepSin:0,stepCos:1,
  }));
  Object.assign(tone,{ambientTexture:true,ambientName:event.instrument,ambientProfile:p,ambientIdentity:identity,
    instrument:event.instrument,count,table:tableFor(event.instrument,count),otherTable:tableFor(event.instrument,count,true),
    detune:p.detune,modes,noiseState:((identity*4294967296)>>>0)||1,noiseLP:0,noiseHP:0,
    noiseLow:1-Math.exp(-TAU*p.noiseLow/rate),noiseHigh:1-Math.exp(-TAU*Math.min(rate*.35,p.noiseHigh)/rate),
    wear:Math.min(.92,(event.wear??0)+(p.wear??0)*.2),grainPhase:identity,grainStep:1/(rate*(p.grain??1)),
    attack:p.attack,release:Math.min(duration*.4,p.release),textureDecay:1,textureDecayRate:p.decay?Math.exp(-1/(rate*p.decay)):1,
    textureStep:event.frequency/rate,textureMorph:.5,textureLevel:1,coefficient:0,coefficientStep:0});
  return tone;
}
export function sampleAmbientTexture(tone,frame,beats,brightness,movement){
  const p=tone.ambientProfile,age=tone.age/tone.rate;
  if(age>=tone.duration){tone.left=tone.right=0;tone.age++;return;}
  if(frame%32===0||tone.age===0){
    const time=age+tone.ambientIdentity*37,slow=Math.sin(TAU*time*p.speed),
      wow=Math.sin(TAU*time*.19)+.24*Math.sin(TAU*time*.071),flutter=Math.sin(TAU*time*5.7),
      pitch=1+movement*(p.drift*wow+(p.flutter??0)*flutter),
      aged=Math.min(.94,tone.wear+age/(tone.duration||1)*tone.wear*.3);
    tone.textureStep=tone.frequency/tone.rate*pitch;
    tone.textureMorph=.5+slow*p.morph*.5*movement;
    tone.textureLevel=1-movement*(.06+.06*(.5+.5*slow));
    const cutoff=Math.min(tone.rate*.35,(160+brightness*p.ceiling)*(.74+.26*(.5+.5*slow)*movement)*(1-aged*.6)),
      target=1-Math.exp(-TAU*cutoff/tone.rate);
    tone.coefficientStep=(target-tone.coefficient)/32;
    for(const m of tone.modes){const delta=TAU*tone.textureStep*m.ratio;m.stepSin=Math.sin(delta);m.stepCos=Math.cos(delta);}
    tone.noiseLevel=p.noise*(1+aged*.45)*(p.rain?.7+.3*(.5+.5*Math.sin(TAU*time*.37)):1);
  }
  tone.coefficient+=tone.coefficientStep;
  const a=lookup(tone.table,tone.phase),b=lookup(tone.otherTable,tone.phase2),morph=tone.textureMorph;
  let left=a*(1-morph*.7)+b*morph*.7,right=a*(1-morph)*.7+b*(.3+morph*.7);
  if(p.grain){
    // Overlapping windows read synthetic harmonics at different phases. Wear
    // narrows the windows and exposes soft grain boundaries.
    const windowA=Math.sin(Math.PI*tone.grainPhase)**2,windowB=1-windowA,
      grain=lookup(tone.table,tone.phase3),edge=1-tone.wear*.45;
    left=(left*windowA+grain*windowB)*(edge+(1-edge)*windowA);
    right=(right*windowB+grain*windowA)*(edge+(1-edge)*windowB);
    tone.grainPhase=(tone.grainPhase+tone.grainStep)%1;
  }
  let modal=0;
  for(const m of tone.modes){
    modal+=m.sin*m.level*m.envelope;
    const s=m.sin*m.stepCos+m.cos*m.stepSin;m.cos=m.cos*m.stepCos-m.sin*m.stepSin;m.sin=s;m.envelope*=m.decay;
  }
  if(tone.modes.length){left=left*.58+modal*.42;right=right*.58+modal*.42;}
  if(p.drive){const drive=p.drive;left=left*drive/(1+Math.abs(left)*(drive-1));right=right*drive/(1+Math.abs(right)*(drive-1));}
  let state=tone.noiseState;state^=state<<13;state^=state>>>17;state^=state<<5;tone.noiseState=state>>>0;
  const noise=tone.noiseState/2147483648-1;
  tone.noiseLP+=tone.noiseHigh*(noise-tone.noiseLP);tone.noiseHP+=tone.noiseLow*(tone.noiseLP-tone.noiseHP);
  const air=(tone.noiseLP-tone.noiseHP)*tone.noiseLevel*1.8,body=1-p.noise*.8;
  left=left*body+air;right=right*body+air*.88;
  tone.filterL+=tone.coefficient*(left-tone.filterL);tone.filterR+=tone.coefficient*(right-tone.filterR);
  tone.filter2L+=tone.coefficient*(tone.filterL-tone.filter2L);tone.filter2R+=tone.coefficient*(tone.filterR-tone.filter2R);
  const envelope=smooth(age/tone.attack)*smooth((tone.duration-age)/tone.release)*tone.textureDecay*tone.textureLevel;
  tone.left=tone.filter2L*envelope;tone.right=tone.filter2R*envelope;
  if(tone.bass)tone.left=tone.right=(tone.left+tone.right)*.5;
  tone.phase=(tone.phase+tone.textureStep)%1;tone.phase2=(tone.phase2+tone.textureStep*p.detune)%1;
  tone.phase3=(tone.phase3+tone.textureStep*(1-.007*tone.wear))%1;
  tone.textureDecay*=tone.textureDecayRate;tone.age++;
}
