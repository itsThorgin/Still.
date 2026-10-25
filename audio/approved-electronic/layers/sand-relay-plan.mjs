// Sand only: a recurring connected theme instead of a short-beep foreground.
import {technoProductionScene} from '../foundation/audio/techno-production-plan.mjs';
const fold=f=>{while(f<215)f*=2;while(f>620)f/=2;return f;};
const statements=[
  [[0,3,0,2.30,.88],[0,12,1,1.80,.82],[1,3,2,2.30,.94],[1,12,4,1.80,1],
   [2,3,3,2.30,.86],[2,12,2,1.80,.80],[3,3,1,2.30,.72],[3,12,0,3.80,.66],[4,12,4,3.80,.68],[5,12,2,3.20,.57]],
  [[0,3,0,2.30,.88],[0,12,1,1.80,.82],[1,3,2,2.30,.94],[1,12,4,1.80,1],
   [2,3,3,2.30,.86],[2,12,1,1.80,.80],[3,3,2,2.30,.72],[3,12,0,3.80,.66],[4,12,3,3.80,.64],[5,12,1,3.20,.55]],
];
export function sandRelayCues(plan,step,events){
  if(plan.character.value!==26)return [];
  const bar=Math.floor(step/16),local=bar%8,tick=step%16,scene=technoProductionScene(plan.p,step/16),
    root=plan.p.harmony.roots[Math.floor(bar/plan.p.harmony.hold)%plan.p.harmony.roots.length],cues=[],
    tone=(degree,beats,type,amplitude,pan=0,extra={})=>cues.push({frequency:fold(plan.frequency(root+degree,1)),beats,type,amplitude,pan,
      role:type==='lead'?'melody':'accompaniment',delay:0,...extra});
  if(local===0&&tick===0&&scene.texture>.04){tone(0,30,'bed',.005,-.16);tone(4,30,'bed',.0038,.16);}
  const phrase=statements[Math.floor(bar/8)%2],entry=phrase.find(([b,t])=>b===local&&t===tick),bass=events.find(e=>e.role==='bass');
  if(entry&&bass&&scene.motif>.04){
    const [, ,degree,gate,level]=entry;
    tone(degree,gate,'lead',.095*level,0,{connect:!(local===0&&tick===3),anchor:'bass',delay:bass.delay??0});
  }
  // The old 24-step clock survives as a few dark background grains. Its pulse
  // waveform and ~79 ms foreground envelope are not used for these accents.
  if([0,4].includes(local)&&step%plan.p.motif.length===plan.p.motif.ticks[0]&&events.some(e=>e.role==='melody')){
    tone(0,.34,'pulse',.009,local===0?-.15:.15,{clock:'original-24-step'});
  }
  return cues;
}
export const SAND_RELAY_SELECTION=Object.freeze({kind:'techno',id:26,label:'Sand relay',style:'Minimal techno',tempo:122,start:48,bars:32,
  direction:'A quiet line to follow inside the rhythm',
  description:'A connected theme grows over the bass anchors, answers more quietly and leaves a breathing space. The old foreground beeps give way to a few dark background accents.',
  jumps:[['Quiet entrance',0],['Theme unfolding',2],['Longer answer',4],['Varied return',8],['Receding',16],['Next statement',24]]});
