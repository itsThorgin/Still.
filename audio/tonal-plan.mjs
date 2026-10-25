import {technoProductionScene} from './techno-production-plan.mjs';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const fold=(f,lo=180,hi=760)=>{while(f<lo)f*=2;while(f>hi)f/=2;return f;};
export const COHESION_IDS=Object.freeze([3,7,1]);
const curves={
  3:[[0,.24,.24],[4,.66,.58],[8,.76,.76],[11,.23,.30],[13,.14,.19],[16,.24,.24]],
  7:[[0,.20,.24],[2,.52,.48],[4,.88,.82],[6,.56,.62],[8,.20,.24]],
  1:[[0,.28,.30],[4,.72,.65],[8,.48,.53],[11,.24,.32],[14,.55,.59],[16,.28,.30]],
};
export function tonalMacro(id,bar){
  const points=curves[id],length=points.at(-1)[0],at=((bar%length)+length)%length;
  let i=0;while(i<points.length-2&&points[i+1][0]<=at)i++;
  const a=points[i],b=points[i+1],t=smooth((at-a[0])/(b[0]-a[0]));
  return {level:a[1]+(b[1]-a[1])*t,colour:a[2]+(b[2]-a[2])*t};
}
export function tonalCues(plan,step,events){
  const id=plan.character.value;if(!COHESION_IDS.includes(id))return [];
  const p=plan.p,bar=Math.floor(step/16),tick=step%16,local=bar%(id===7?8:16),scene=technoProductionScene(p,step/16),
    root=p.harmony.roots[Math.floor(bar/p.harmony.hold)%p.harmony.roots.length],bass=events.find(e=>e.role==='bass'),cues=[];
  const tone=(degree,beats,type,amplitude,pan=0,extra={})=>cues.push({frequency:fold(plan.frequency(root+degree,1)),beats,type,amplitude,pan,
    role:type==='bed'?'accompaniment':'melody',onset:step/4,delay:0,...extra});
  if(id===3){
    if(tick===0&&bar%4===0){
      tone(0,15.5,'bed',.011,-.18);tone(4,15.5,'bed',.009,.18);
    }

    if(bass&&[2,10].includes(tick)&&!(local===12||local===13)&&scene.bass>.02){
      const accent=tick===2?1:bar%2?.58:.76;
      tone(0,.46,'pulse',.09*accent,-.12,{delay:bass.delay??0,anchor:'bass'});
      tone(4,.46,'pulse',.047*accent,.16,{delay:bass.delay??0,anchor:'bass'});
    }
  }else if(id===7){
    if(tick===0&&bar%8===0){
      for(const [i,d] of [0,2,4].entries())tone(d,31,'bed',.013,(i-1)*.28,{role:'accompaniment'});
    }

    const slots=bar%2===0?[2,10]:[6,14];
    if(bass&&slots.includes(tick)&&local<6&&scene.motif>.04){
      const index=(local%4)*2+slots.indexOf(tick),notes=[0,2,4,2,1,0,2,4];
      tone(notes[index],slots.indexOf(tick)===0?1.85:1.35,'lead',.145*(index%2?.82:1),0,
        {delay:bass.delay??0,connect:slots.indexOf(tick)===1,anchor:'bass'});
    }
  }else{
    if(tick===0&&bar%4===0){tone(0,15,'bed',.009,-.22);tone(4,15,'bed',.007,.22);}

    if(bass&&bar%2===0&&tick===10&&scene.chords>.04){
      const voicing=local===14?[0,2,4,8]:[0,2,6];
      for(const [i,d] of voicing.entries())tone(d,.34,'chord',.115/Math.sqrt(voicing.length),(i-(voicing.length-1)/2)*.24,
        {role:'accompaniment',delay:bass.delay??0,anchor:'bass'});
      tone(0,.40,'pulse',.022,.08,{delay:bass.delay??0,anchor:'bass'});
    }
  }
  return cues;
}
