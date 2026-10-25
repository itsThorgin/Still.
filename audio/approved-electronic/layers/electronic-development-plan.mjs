// Collection-wide audition policy. Accepted examples and sparse low-led styles
// are explicit preservation cases; every retained/omitted event keeps its slot.
import {technoProductionScene} from '../foundation/audio/techno-production-plan.mjs';
export const APPROVED=[['techno',1],['techno',3],['techno',7],['bassmusic',1],['bassmusic',31]];
export const approved=(kind,id)=>APPROVED.some(([k,i])=>kind===k&&id===i);
const bassRewrite=new Set(['liquid','atmospheric','garage','dancefloor','melodic']);
export const tonalTech=new Set(['dub','hypnotic','melodic','ambient','detroit']);
export function developmentPolicy(kind,c){
  const family=(kind==='bassmusic'?c.bassProduction:c.technoProduction)?.family;
  if(approved(kind,c.value))return {family,action:'approved',reason:'Retain the accepted audition exactly'};
  if(kind==='bassmusic'&&c.value===20)return {family,action:'colour',reason:'Keep the evolving writing; restore the authored answer colour'};
  if(kind==='bassmusic')return {family,action:bassRewrite.has(family)?'phrase':'preserve',reason:bassRewrite.has(family)?'Develop calls, replies and support without extending every note':'Keep sparse replies, breaks and low-led space'};
  if(kind==='techno')return {family,action:family==='acid'?'preserve':tonalTech.has(family)?'cohesion':'articulate',reason:family==='acid'?'Keep the existing accented slides and restrained upper motif':tonalTech.has(family)?'Tie recurring upper figures to the groove and harmonic cycle':'Keep the machine attack; vary pressure and create brief response pockets'};
  return {action:'preserve',reason:'Unrelated collection'};
}
const fold=(f,lo=200,hi=920)=>{while(f<lo)f*=2;while(f>hi)f/=2;return f;};
const omit=e=>({...e,developmentOmit:true});
export function developEvents(plan,kind,step,events){
  const policy=developmentPolicy(kind,plan.character);if(!['phrase','articulate','colour'].includes(policy.action))return events;
  const bar=Math.floor(step/16),local=bar%8,tick=step%16,family=policy.family;
  return events.map(e=>{
    if(e.drum||e.role==='bass')return e;
    if(policy.action==='colour'){
      if(e.role!=='melody')return e;
      const answer=e.instrument===plan.character.reply;
      return {...e,development:{family,type:answer?'reply':'statement',answer},developmentPatchRole:answer?'reply':'main'};
    }
    if(kind==='techno'){
      const motif=e.role==='melody',m=plan.p.motif,index=Math.max(0,m.ticks.indexOf(step%m.length)),cycle=Math.floor(step/m.length);
      // Do not impose legato or pad tails on rhythmic machine parts.
      if(motif&&local===7&&tick>=8||!motif&&e.patch==='chord'&&bar%4===3)return omit(e);
      const accent=[1,.66,.86,.58][(index+Math.floor(cycle/4))%4],ending=local===6;
      return {...e,amplitude:e.amplitude*(motif?accent*(local===3?.70:1):[.86,.64,.76,.0][bar%4]),
        development:{family,index,pressure:accent,ending},dubThrow:ending?1.22:(e.dubThrow??1)*.86};
    }
    const c=plan.character,p=c.bassProduction,section=plan.state.section,
      row=c.rhythms[(Math.floor(local/2)+plan.motifOffset)%c.rhythms.length],index=Math.max(0,row.indexOf(tick)),
      answer=['response','answer','turn'].includes(section)||local===2||local===6;
    if(e.role==='accompaniment'){
      if(e.instrument==='dub-stab'){
        const patterns=[[[3,14],[10],[3],[],[3,10],[14],[10],[]],[[3],[10,14],[3],[],[10],[3,14],[10],[]],[[3,10],[14],[10],[],[3],[10,14],[3],[]]],
          lane=patterns[c.value%patterns.length][local];
        if(!lane.includes(tick))return omit(e);
        return {...e,amplitude:e.amplitude*(tick===3?.98:tick===10?.70:.82),development:{family,type:'stab',answer:local===6}};
      }
      return {...e,amplitude:e.amplitude*(family==='dancefloor'?.72:family==='garage'?.82:.90),development:{family,type:'pad'}};
    }
    // Keep coherent short statements, rather than thinning every bar at random.
    const rests=family==='atmospheric'?[2,3,6,7]:family==='dancefloor'?[3,7]:[3,7];
    if(rests.includes(local))return omit(e);
    if(family==='garage'&&local===5&&index>0)return omit(e);
    if(['liquid','melodic'].includes(family)&&[2,6].includes(local)&&index>0)return omit(e);
    if(family==='atmospheric'&&index>1)return omit(e);
    const airy=['intro','breakdown','space'].includes(section),next=row[index+1]??16,
      gap=Math.max(.18,(next-tick)/4),gate=family==='atmospheric'?Math.min(e.beats,1.65,gap*.9):Math.min(e.beats,airy?gap*.82:family==='garage'?.82:1.15),
      amplitude=e.amplitude*(answer?.72:index===0?1:.79)*(local===5?.84:1),
      instrument=answer?c.reply:c.lead;
    return {...e,instrument,beats:Math.max(.12,gate),frequency:answer&&family!=='dancefloor'?fold(e.frequency/2):e.frequency,
      amplitude,development:{family,type:answer?'reply':'statement',answer,first:index===0,local},developmentPatchRole:answer?'reply':'main'};
  });
}
export function developmentMode(family){return family==='dub'?1:['melodic','ambient'].includes(family)?7:3;}
export function developmentCues(plan,step,events){
  const p=plan.p,id=plan.character.value,family=p.family,mode=developmentMode(family),bar=Math.floor(step/16),tick=step%16,local=bar%16,
    scene=technoProductionScene(p,step/16),root=p.harmony.roots[Math.floor(bar/p.harmony.hold)%p.harmony.roots.length],bass=events.find(e=>e.role==='bass'),cues=[];
  const tone=(degree,beats,type,amplitude,pan=0,extra={})=>cues.push({frequency:fold(plan.frequency(root+degree,1),180,family==='ambient'?1100:820),beats,type,amplitude,pan,
    role:type==='bed'?'accompaniment':'melody',delay:0,...extra});
  // A quiet shared harmonic context establishes what the returning figure belongs to.
  if(tick===0&&bar%8===0){
    const degrees=family==='dub'?[0,4]:p.harmony.voicing.slice(0,family==='ambient'?3:2);
    degrees.forEach((d,i)=>tone(d,31,'bed',(mode===7?.012:.008)*(family==='detroit'?.75:1),(i-(degrees.length-1)/2)*.34));
  }
  if(!bass||scene.bass<=.02)return cues;
  const anchor={delay:bass.delay??0,anchor:'bass',anchorTick:tick};
  if(family==='dub'){
    const target=p.bass.ticks.at(-1),period=id===23?4:2;
    if(bar%period===0&&tick===target&&scene.chords>.04){
      const v=local===14?p.harmony.voicing:p.harmony.voicing.slice(0,3);
      v.forEach((d,i)=>tone(d,id===31?.48:.34,'chord',.115/Math.sqrt(v.length),(i-(v.length-1)/2)*.22,{...anchor,role:'accompaniment'}));
    }
  }else if(family==='hypnotic'){
    if([12,13].includes(local))return cues;
    const slot=p.bass.ticks.indexOf(tick),cycle=Math.floor(step/p.motif.length),index=(cycle+slot)%p.motif.notes.length,
      degree=p.motif.notes[index];
    if(slot%2===0||id===37&&slot===1){
      // The original 5/7/other step cycle now shades a bass-anchored object.
      tone(degree,.38+(index%3)*.04,'pulse',.071*(slot===0?1:.64),-.12,anchor);
      if(slot===0)tone(p.harmony.voicing.at(-1),.34,'pulse',.025,.16,anchor);
    }
  }else if(family==='melodic'||family==='ambient'){
    const span=family==='ambient'?16:8,at=bar%span;
    if(at>=span-2||scene.motif<=.04)return cues;
    const slots=family==='ambient'?[p.bass.ticks[0]]:bar%2?[p.bass.ticks[1]??p.bass.ticks[0],p.bass.ticks.at(-1)]:[p.bass.ticks[0],p.bass.ticks[2]??p.bass.ticks.at(-1)];
    if(slots.includes(tick)){
      const i=(bar%4)*2+slots.indexOf(tick),degree=p.motif.notes[(i+plan.variant)%p.motif.notes.length],second=slots.indexOf(tick)===1;
      tone(degree,family==='ambient'?3.1:second?1.45:1.85,'lead',family==='ambient'?.085:.145*(second?.78:1),family==='ambient'?.12:0,
        {...anchor,connect:second});
    }
  }else{
    // Detroit keeps syncopated chord pressure rather than becoming a long solo.
    if([3,7,11,15].includes(local))return cues;
    if(p.bass.ticks.indexOf(tick)%2===0&&scene.chords>.04){
      p.harmony.voicing.slice(0,3).forEach((d,i)=>tone(d,.36,'pulse',.059*(tick===p.bass.ticks[0]?1:.66)/Math.sqrt(3),(i-1)*.22,{...anchor,role:'accompaniment'}));
      if(local===2||local===10)tone(p.motif.notes[(Math.floor(bar/2)+id)%p.motif.notes.length],.76,'lead',.025,0,anchor);
    }
  }
  return cues;
}
