import {collectionEvents,collectionTonalCues} from './collection-expression-plan.mjs';
import {technoProductionScene} from '../foundation/audio/techno-production-plan.mjs';
import {highPercussion} from './instrument-refinements-config.mjs';
const fold=(f,lo,hi)=>{while(f<lo)f*=2;while(f>hi)f/=2;return f;};
export function refinementEvents(plan,kind,step,original,revised){
 const current=collectionEvents(plan,kind,step,original);if(!revised)return current;
 const id=plan.character.value,bar=Math.floor(step/16),local=bar%8,tick=step%16;
 return current.map(e=>{
  if(kind==='bassmusic'){
   if(e.role==='bass'&&id===10){
    const p=plan.writing,answer=['response','answer','turn'].includes(plan.state.section)||local%4===3,
      airy=['intro','breakdown','space'].includes(plan.state.section),build=plan.state.build,
      row=airy?[[0,0,8]]:build&&local>=6?[[0,0,3],[8,0,2]]:answer?p.response:p.call,
      idx=row.findIndex(n=>n[0]===tick),next=row[idx+1]?.[0]??16,gap=(next-tick)/4;
    // Keep build silences and the end-of-bar breathing gap. A few within-call
    // gates meet their next attack; those alone can inherit the live oscillator.
    const connected=idx>0&&!airy&&!build,gate=build?e.beats:Math.max(e.beats,Math.min(gap-(idx<row.length-1?.025:.25),2.1));
    return {...e,beats:gate,sound:'talk',refinement:{id,connected,glide:.115,
      pitchFrom:connected?null:e.frequency*(answer?1.045:.97),pulse:answer?.15:.10}};
   }
   if(e.role==='bass'&&id===25){
    const shift=local===2&&tick>=10?2:local===5?1:local===6&&tick>=10?-1:0;
    return {...e,frequency:fold(e.frequency*2**(shift/12),35,88),refinement:{id}};
   }
   if(e.role==='bass'&&id===42)return {...e,refinement:{id}};
   if(id===29&&e.role==='melody')return {...e,amplitude:e.amplitude*.88,refinement:{id}};
   if(id===33&&e.role==='melody'&&e.development?.answer&&!e.developmentOmit){
    return {...e,instrument:'electric-keys',frequency:local===6?fold(plan.frequency(0,0),190,650):e.frequency,
      beats:Math.min(1.05,e.beats*1.35),amplitude:e.amplitude*.88,cutoffCeiling:1900,refinement:{id}};
   }
   return e;
  }
  if(e.drum&&highPercussion(id,e.drum)){
   const metal=e.drum==='metal',ride=e.drum==='ride',open=e.drum==='open-hat',cycle=Math.floor(step/(metal?7:16)),
    pressures=[.88,.60,1,.72,.81,.52,.94,.67],pressure=pressures[(cycle+id)%8];
   let gain=1,decay=1,tuning=e.tuning??1,cutoff=7600,body=0;
   if(id===12){gain=ride?.55:open?.72:.92;decay=ride?.74:open?.84:1;cutoff=ride?5700:7300;}
   if(id===43){gain=ride?.48:open?.68:.86;decay=ride?.65:open?.78:.94;cutoff=ride?5100:6800;}
   if(id===8){gain=metal?.86:.94;decay=metal?.82:1;tuning*=metal?[.92,1.08,.98][cycle%3]:1;cutoff=7000;body=metal?730:0;}
   if(id===9){gain=metal?.58:e.drum==='noise'?.65:.87;decay=metal?.56:.88;tuning*=metal?1.35:1;cutoff=6400;body=metal?1450:0;}
   if(id===40){gain=metal?.66:e.drum==='noise'?.46:.85;decay=metal?.56:.83;tuning*=metal?[1.31,1.08,1.47][cycle%3]:1;cutoff=6500;body=metal?1920:0;}
   if(id===41){gain=metal?.73:e.drum==='noise'?.42:.82;decay=metal?1.1:.94;tuning*=metal?[.67,.77,.70][cycle%3]:1;cutoff=5100;body=metal?510:0;}
   const pocket=ride&&[3,7].includes(local)||metal&&(id===9&&(local===3||cycle%3===1)||id===40&&local===7||id===41&&(cycle%3!==0||local===7));
   return {...e,amplitude:e.amplitude*gain*(.76+.24*pressure)*(pocket?0:1),decayScale:(e.decayScale??1)*decay*(.82+.24*pressure),tuning,
     refinementPerc:{cutoff,body,id,pressure}};
  }
  if(e.role==='melody'&&[8,9,40,41].includes(id)){
   if(e.developmentOmit)return e;
   const answer=local===2||local===6;
   return {...e,beats:e.beats*(id===41?2.1:id===8?1.2:id===40?.88:1.25),
    frequency:e.frequency*(id===41?.5:1),amplitude:e.amplitude*(id===41?.89:id===9?.88:.95),
    refinement:{id,answer},developmentOmit:id===41&&local%2===1&&tick>6?true:e.developmentOmit};
  }
  return e;
 });
}
export function refinementCues(plan,step,events,revised){
 const id=plan.character.value;if(!revised)return collectionTonalCues(plan,step,events);
 const bar=Math.floor(step/16),local=bar%8,tick=step%16,p=plan.p,bass=events.find(e=>e.role==='bass'),
  scene=technoProductionScene(p,bar),root=p.harmony.roots[Math.floor(bar/p.harmony.hold)%p.harmony.roots.length],
  cues=[4,15,38].includes(id)?collectionTonalCues(plan,step,events).filter(c=>c.type!=='lead').map(c=>({...c,
    amplitude:c.amplitude*(id===15?.68:id===38?.82:.82),refinement:{id}})):[];
 const tone=(degree,gate,amp,connect=false,extra={})=>cues.push({frequency:fold(plan.frequency(root+degree,1),id===20?180:210,id===12?650:850),
  beats:gate,type:'lead',amplitude:amp,pan:id===20?-.05:0,role:'melody',delay:bass?.delay??0,connect,refinement:{id},...extra});
 if(!bass||scene.bass<=.02||scene.motif<=.04)return cues;
 const slot=p.bass.ticks.indexOf(tick),late=bar%p.arrangement.bars>=80;
 if(id===4){
  // Use Motor's own [0,4,6,4,2,1] material, with an established call before
  // the wider later return. No new bass or drum events are inserted.
  const theme=p.motif.notes,active=[0,1,2,4,5].includes(local),slots=late?[0,2]:[0];
  if(active&&slots.includes(slot)){
   const i=local*2+(slot===2?1:0),degree=theme[(i+Math.floor(bar/8))%theme.length];
   tone(degree,late?(slot===2?1.48:2.02):3.02,late?.043:.033,slot===2||local===1||local===2);
  }
 }
 if(id===15&&[1,2,5].includes(local)&&slot===0)tone(p.motif.notes[(local+Math.floor(bar/8))%p.motif.notes.length],3.05,.022,local===2);
 if(id===38&&[0,1,2,4,5,6].includes(local)&&[0,2].includes(slot)){
  const i=local*2+(slot===2?1:0),d=p.motif.notes[(i+Math.floor(bar/8))%p.motif.notes.length];
  tone(d,slot===2?1.54:2.04,.037*(slot===2?.78:1),slot===2||local===1||local===2||local===5||local===6);
 }
 if(id===12&&[0,1,2,4,5,6].includes(local)&&[0,2].includes(slot)){
  const degrees=[0,0,4,2,0,1,4,2,0,4,1,0],index=local*2+(slot===2?1:0);
  tone(degrees[index%degrees.length],slot===2?1.49:2.03,.026*(slot===2?.75:1),slot===2||local===1||local===5);
 }
 if(id===20&&[0,1,2,4,5,6].includes(local)){
  const degrees=[0,3,4,3,0,1,3,0,4,3,1,0],index=local*2+slot;
  tone(degrees[index%degrees.length],slot===1?1.68:2.04,.037*(slot===1?.73:1),slot===1||local===1||local===5);
 }
 return cues;
}
