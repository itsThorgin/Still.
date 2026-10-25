import {phraseEvents,phraseCues} from './phrase-plan.mjs';
import {technoProductionScene} from './techno-production-plan.mjs';
const patternRole=(kind,c)=>({family:(c.bassProduction??c.technoProduction).family,action:c.performance.patternAccents?'machine-phrase':'none'});
const fold=(f,lo=210,hi=850)=>{while(f<lo)f*=2;while(f>hi)f/=2;return f;};

const minimal={
  2:[[0,0,0,.92],[0,2,1,.79],[1,0,2,.96],[1,2,1,.80],[2,0,4,1],[2,2,2,.82],[3,0,1,.76],[3,2,0,.65],[4,2,4,.69],[5,2,1,.56]],
  17:[[0,0,0,.88],[0,2,2,.78],[1,0,1,.94],[1,2,3,.83],[2,0,2,1],[2,2,4,.82],[3,3,0,.66],[4,3,2,.70],[5,1,1,.56]],
  32:[[0,0,0,.80],[0,1,1,.72],[1,0,4,.91],[1,1,2,.78],[3,0,0,.67],[4,1,3,.65],[5,0,1,.59],[5,2,0,.50]],
};
export function connectedCues(plan,step,events){
  const family=plan.p.family,id=plan.character.value,bar=Math.floor(step/16),local=bar%8,tick=step%16,
    scene=technoProductionScene(plan.p,step/16),root=plan.p.harmony.roots[Math.floor(bar/plan.p.harmony.hold)%plan.p.harmony.roots.length],
    bass=events.find(e=>e.role==='bass'),cues=[];
  const tone=(degree,beats,type,amplitude,pan=0,extra={})=>cues.push({frequency:fold(plan.frequency(root+degree,1),family==='ambient'?200:215,family==='ambient'?1050:820),
    beats,type,amplitude,pan,role:type==='lead'?'melody':'accompaniment',delay:0,...extra});
  if(family==='minimal'){
    if(local===0&&tick===0&&scene.texture>.04){tone(0,30,'bed',id===32?.0035:.005,-.16);tone(4,30,'bed',.0032,.16);}
    const entries=minimal[id],index=entries.findIndex(([b,slot])=>b===local&&plan.p.bass.ticks[slot]===tick);
    if(index>=0&&bass&&scene.motif>.04){
      const [b,slot,d,pressure]=entries[index],next=entries[index+1],at=b*4+plan.p.bass.ticks[slot]/4,
        gap=next?next[0]*4+plan.p.bass.ticks[next[1]]/4-at:3,
        gate=next?Math.min(3.85,gap+.04):2.75,variation=Math.floor(bar/8)%2,
        degree=variation&&index>=entries.length-2?Math.max(0,d+(id===17?-1:1)):d;
      tone(degree,gate,'lead',(id===2?.092:id===17?.084:.077)*pressure,0,
        {connect:index>0&&at-(entries[index-1][0]*4+plan.p.bass.ticks[entries[index-1][1]]/4)<=4.05,anchor:'bass',delay:bass.delay??0});
    }
    if([0,4].includes(local)&&step%plan.p.motif.length===plan.p.motif.ticks[0]&&events.some(e=>e.role==='melody'))tone(0,.32,'pulse',.0065,.12,{clock:'original motif'});
    return cues;
  }
  if(family==='ambient'){
    if(local===0&&tick===0&&scene.texture>.04)plan.p.harmony.voicing.slice(0,3).forEach((d,i)=>tone(d,31,'bed',.007,(i-1)*.32));
    if(bass&&local%2===0&&scene.motif>.04){
      const index=Math.floor(local/2),degree=plan.p.motif.notes[(index+Math.floor(bar/8))%plan.p.motif.notes.length];
      tone(degree,7.78,'lead',.067*[.78,1,.85,.62][index],.08,{connect:index>0,anchor:'bass',delay:bass.delay??0});
    }
    return cues;
  }
  const original=phraseCues(plan,step,events);
  return original.map(c=>{
    if(family==='melodic'&&c.type==='lead')return {...c,beats:c.connect?1.96:2.06,amplitude:c.amplitude*.91};
    if(family==='detroit'&&c.type==='lead')return {...c,beats:1.45,amplitude:c.amplitude*.80};
    return c;
  });
}
export function textureEvents(plan,kind,step,events){
  const policy=patternRole(kind,plan.character);
  if(policy.action!=='machine-phrase')return phraseEvents(plan,kind,step,events);
  const revised=phraseEvents(plan,kind,step,events),family=policy.family,bar=Math.floor(step/16),local=bar%8,tick=step%16,m=plan.p.motif;
  return revised.map(e=>{
    if(e.drum||e.role==='bass'||e.roleOmit)return e;
    if(e.role!=='melody')return {...e,amplitude:e.amplitude*.90,patternShape:{family,support:true}};
    const mi=Math.max(0,m.ticks.indexOf(step%m.length));
    if((family==='tribal'&&[3,7].includes(local))||(['raw','industrial'].includes(family)&&local===7)||family==='driving'&&local===3&&tick>=8)return {...e,roleOmit:true};
    const arc=[.84,.95,.73,.58,1,.82,.68,.47][local],quiet=m.level<.06,
      next=m.ticks[mi+1]??m.ticks[0]+m.length,gap=(next-step%m.length)/4,
      held=family==='driving'&&[1,5].includes(local)&&mi===m.ticks.length-1;
    return {...e,amplitude:e.amplitude*(quiet?.96:family==='hard'?arc:arc*.85),
      beats:held?Math.min(gap*.90,.90):e.beats,
      patternShape:{family,held,quiet,pressure:e.phraseShape?.pressure??.8}};
  });
}
