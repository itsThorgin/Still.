import {gardenHash} from '../garden-options.mjs';


const rhythms={
  waltz: {calls:[[0,4,8],[0,6],[0,4,8],[0,4]],bass:[0,8],pluck:[4,8],hands:[0],taps:[4,8],gate:.86},
  jig: {calls:[[0,2,6,8],[0,4,6],[0,2,6,8],[0,6]],bass:[0,6],pluck:[2,8],hands:[0,6],taps:[4,10],gate:.74},
  pastoral: {calls:[[0,6,10],[0,8],[0,4,10],[0,8]],bass:[0,8],pluck:[4,12],hands:[0],taps:[8],gate:1.45},
  hymn: {calls:[[0,8],[0],[0,8],[0]],bass:[0],pluck:[12],hands:[0],taps:[],gate:2.8},
  air: {calls:[[0,6],[0,8],[0,4,8],[0]],bass:[0],pluck:[4,8],hands:[0],taps:[8],gate:1.6},
  walk: {calls:[[0,4,8],[0,6,12],[0,4,8],[0,8]],bass:[0,8],pluck:[4,12],hands:[0,8],taps:[4,12],gate:1.05},
  reel: {calls:[[0,2,8,10],[0,4,10],[0,4,8,12],[0,8]],bass:[0,8],pluck:[2,6,10,14],hands:[0,8],taps:[4,12],gate:.63},
  sea: {calls:[[0,2,6,8],[0,6,10],[0,2,6,8],[0,6]],bass:[0,6],pluck:[4,10],hands:[0,6],taps:[4,10],gate:.8},
  caravan: {calls:[[0,3,8],[0,6,12],[0,3,8,12],[0,8]],bass:[0,8],pluck:[3,6,11,14],hands:[0,6,8],taps:[3,11],gate:.68},
  lullaby: {calls:[[0,8],[0],[0,8],[0]],bass:[0],pluck:[6,14],hands:[0],taps:[],gate:2.25},
  pavane: {calls:[[0,4,8],[0,8,12],[0,4,10],[0,8]],bass:[0,8],pluck:[4,12],hands:[0,8],taps:[12],gate:1.25},
  spell: {calls:[[0,8],[4],[0,10],[0]],bass:[0],pluck:[6,14],hands:[0],taps:[12],gate:1.55},
  fey: {calls:[[0,4,8],[0,2,6,10],[0,4,8],[0,6]],bass:[0,6],pluck:[2,6,10],hands:[0],taps:[4,10],gate:.65},
  ritual: {calls:[[0,6],[0],[0,4,8],[0,6]],bass:[0],pluck:[4,10],hands:[0,6],taps:[10],gate:1.35},
  mechanism: {calls:[[0,4,10],[0,6,12],[0,4,8,12],[0,8]],bass:[0,8],pluck:[2,6,10,14],hands:[0,8],taps:[4,12],gate:.5},
  dungeon: {calls:[[0,10],[4],[0,8],[0]],bass:[0],pluck:[12],hands:[0],taps:[8],gate:1.85},
  march: {calls:[[0,4,8,12],[0,4,8],[0,4,8,12],[0,8]],bass:[0,8],pluck:[0,4,8,12],hands:[0,8],taps:[4,12],gate:.72},
  siege: {calls:[[0,8],[0,4,8],[0,8,12],[0]],bass:[0,8],pluck:[0,8],hands:[0,8],taps:[12],gate:1.6},
  gallop: {calls:[[0,3,8,11],[0,4,8],[0,3,8,11],[0,8]],bass:[0,6,8,14],pluck:[0,3,8,11],hands:[0,8],taps:[6,14],gate:.6},
  rally: {calls:[[0,4,8],[0,4,8],[0,2,6,8],[0,6]],bass:[0,6],pluck:[0,4,8],hands:[0,6],taps:[4,10],gate:1.05},
  duel: {calls:[[0,6,10],[0,8],[0,4,10],[0,8]],bass:[0,8],pluck:[2,10],hands:[0,8],taps:[4,12],gate:.65},
  charge: {calls:[[0,2,6,8],[0,4,8,12],[0,2,6,8],[0,8]],bass:[0,6,8,14],pluck:[0,2,6,8,10,14],hands:[0,8],taps:[4,12],gate:.54},
};
const ensembles={
  flute: ['wood-recorder','gut-lyre','chamber-viola','gut-lyre','plucked-bass'],
  viola: ['chamber-viola','wood-recorder','chamber-viola','gut-lyre','bowed-bass'],
  guitar: ['nylon-guitar','chamber-viola','chamber-viola','gut-lyre','plucked-bass'],
  reeds: ['double-reed','dulcimer','chamber-viola','gut-lyre','plucked-bass'],
  dulcimer: ['dulcimer','double-reed','chamber-viola','nylon-guitar','plucked-bass'],
  chapel: ['reed-organ','gut-lyre','lib:breath-choir','gut-lyre','bowed-bass'],
  court: ['chamber-viola','chamber-horn','chamber-viola','nylon-guitar','bowed-bass'],
  highland: ['double-reed','chamber-horn','chamber-viola','gut-lyre','bowed-bass'],
  harp: ['gut-lyre','wood-recorder','lib:breath-choir','nylon-guitar','plucked-bass'],
  celestial: ['thumb-piano','lib:bronze-chime','lib:breath-choir','gut-lyre','bowed-bass'],
  mirror: ['chamber-viola','lib:ceramic-bowl','lib:breath-choir','gut-lyre','bowed-bass'],
  ritual: ['reed-organ','dulcimer','chamber-viola','gut-lyre','bowed-bass'],
  lowreed: ['double-reed','chamber-viola','chamber-viola','gut-lyre','bowed-bass'],
  mechanical: ['thumb-piano','nylon-guitar','chamber-viola','dulcimer','plucked-bass'],
  battleStrings: ['chamber-viola','chamber-horn','chamber-viola','nylon-guitar','bowed-bass'],
  battleHorn: ['chamber-horn','chamber-viola','chamber-viola','nylon-guitar','bowed-bass'],
};
const sections=[
  {name:'Opening',level:.78,drums:.65},
  {name:'Main theme',level:1,drums:1},
  {name:'Answering theme',level:.9,drums:.85,answer:true},
  {name:'Gathering strength',level:1.04,drums:1.05,lift:true},
  {name:'Quiet interlude',level:.7,drums:.3,quiet:true},
  {name:'Contrasting passage',level:.88,drums:.65,answer:true},
  {name:'Theme returns',level:1,drums:1},
  {name:'Closing cadence',level:.85,drums:.75},
];
export function fantasySection(bar){return sections[Math.floor((bar%64)/8)];}
const mod=(n,m)=>(n%m+m)%m;

function chordTone(degree,root){
  let best=degree,distance=Infinity;
  for(let octave=-2;octave<=3;octave++)for(const d of [0,2,4]){
    const candidate=root+d+octave*7,delta=Math.abs(candidate-degree);
    if(delta<distance){best=candidate;distance=delta;}
  }return best;
}
function phrase(w,rhythm,meter,answer=false){
  const notes=[];
  for(let bar=0;bar<8;bar++){
    const ticks=rhythm.calls[bar%4],root=w.chords[bar],source=answer?w.reply:w.theme;
    for(let i=0;i<ticks.length;i++){
      
      let degree=source[answer?(bar%4*2+i)%source.length:bar%4*4+i];
      if(i===0)degree=chordTone(degree,root);
      if(bar===7&&i===ticks.length-1)degree=0;
      const next=ticks[i+1]??(bar%4===3?meter-2:meter);
      notes.push({bar,tick:ticks[i],degree,beats:Math.min(rhythm.gate,(next-ticks[i])/4*.88),phrase:answer?'B':'A'});
    }
  }return notes;
}
export function prepareFantasy(plan){
  const w=plan.character.fantasyWriting,r=plan.rhythm=rhythms[w.rhythm];
  plan.formBars=64;
  plan.ensemble=Object.freeze(Object.fromEntries(['main','reply','pad','pluck','bass'].map((role,i)=>[role,ensembles[w.ensemble][i]])));
  plan.themes={A:phrase(w,r,plan.barSteps),B:phrase(w,r,plan.barSteps,true)};
  plan.themeAt={A:new Map(),B:new Map()};
  for(const key of ['A','B'])for(const note of plan.themes[key])plan.themeAt[key].set(note.bar*plan.barSteps+note.tick,note);
}
export function composeFantasy(plan,step,params={}){
  const c=plan.character,w=c.fantasyWriting,r=plan.rhythm,bar=Math.floor(step/plan.barSteps),tick=step%plan.barSteps,
    local=bar%8,section=fantasySection(bar),energy=Math.max(0,Math.min(1,(params.intensity??35)/100)),
    root=w.chords[local],measure=plan.barSteps/4,combat=c.scene===5,dungeon=c.scene===4,ctx={c,events:[]};
  const tone=(degree,octave,beats,role,voice,amplitude,extra={})=>{
    const patch=plan.ensemble[voice];
    plan.note(ctx,degree,octave,beats,role,patch,amplitude,voice==='main'?-.12:voice==='reply'?.18:0,
      {ensemblePatch:patch,ensembleRole:voice,...extra});
  };

  
  if(tick===0){
    for(const [i,d] of (combat||dungeon?[0,4]:[2,4]).entries()){
      let degree=root+d;while(degree>7)degree-=7;
      tone(degree,0,measure*.88,'accompaniment','pad',.015*section.level,{pan:i? .27:-.27});
    }
  }
  const bassTicks=section.quiet||energy<.25?[0]:r.bass;
  for(const [i,at] of bassTicks.entries())if(tick===at){
    const next=bassTicks[i+1]??plan.barSteps,degree=root+(i%2?4:0);
    tone(degree,-1,Math.min((next-at)/4*.83,measure*.9),'bass','bass',combat?.105:.09,{pan:0});
  }
  const theme=section.answer?'B':'A',n=plan.themeAt[theme].get(local*plan.barSteps+tick);
  if(n&&(!section.quiet||local%2===0)){
    const voice=section.answer?'reply':'main';
    tone(n.degree,dungeon?0:1,n.beats,'melody',voice,(combat?.1:.09)*section.level,
      {themePhrase:theme,phraseDegree:n.degree,scoreBar:local});
  }

  if(!section.quiet&&local%4===3&&tick===plan.barSteps-2){
    tone(local===7?0:chordTone(w.reply[3],root),dungeon?0:1,.4,'melody',section.answer?'main':'reply',.053*section.level,
      {themePhrase:'cadence'});
  }
  if(!section.quiet&&r.pluck.includes(tick)&&(!dungeon||local%2===0)){
    const i=r.pluck.indexOf(tick),degree=root+[0,4,2,4][(i+local%2)%4];
    tone(degree,combat?0:1,Math.min(.42,(plan.barSteps-tick)/4*.8),'accompaniment','pluck',combat?.022:.027,{pan:.22});
  }
  if(energy>.12){
    const drum=(name,amplitude,tuning=1)=>plan.drum(ctx,name,amplitude*section.drums*(.6+energy*.55),{tuning});
    if(r.hands.includes(tick)&&(!section.quiet||tick===0&&local%2===0))drum('hand',combat?.105:dungeon?.045:.06,combat?.78:.95);
    if(!section.quiet&&energy>.25&&r.taps.includes(tick))drum('rim',combat?.029:.022,combat?.85:1);
    if(combat&&!section.quiet&&energy>.45&&tick===plan.barSteps/2)drum('tom',.048,.78);
    if(!section.quiet&&energy>.65&&tick%4===2&&!dungeon)drum('shaker',.012);
    
    if(!section.quiet&&energy>.8&&local===7&&[plan.barSteps-2,plan.barSteps-1].includes(tick))drum(combat?'tom':'hand',.026,tick===plan.barSteps-2?.85:1);
  }

  if(Math.floor(bar/64)%2===1&&!section.quiet&&local===6&&tick===0)
    tone(chordTone(w.reply[0],root),0,measure*.8,'accompaniment','reply',.022);
  return ctx.events;
}
