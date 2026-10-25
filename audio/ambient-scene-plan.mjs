import {gardenHash} from '../garden-options.mjs';

export const AMBIENT_SCENES=Object.freeze([
  {name:'Emergence',drone:.72,notes:.65,air:.7}, {name:'Open space',drone:1,notes:1,air:1},
  {name:'Distant answer',drone:.86,notes:.9,air:.82}, {name:'Suspension',drone:.78,notes:.65,air:.9},
  {name:'Empty room',drone:.48,notes:.38,air:.65}, {name:'Soft return',drone:.94,notes:.9,air:.85},
  {name:'Receding',drone:.58,notes:.5,air:.62}, {name:'Afterimage',drone:.68,notes:.6,air:.7},
]);
export function ambientSceneEvents(plan,step){
  const c=plan.character,w=c.sceneWriting,bar=Math.floor(step/16),tick=step%16,cycle=Math.floor(bar/32),
    phrase=Math.floor(bar/4),scene=c.order[phrase%8],shape=AMBIENT_SCENES[scene],local=bar%4,
    chord=c.progression[Math.floor(bar/c.hold)%8],events=[],colour=gardenHash(plan.seed^c.value*0x9e37,cycle+0xa131);
  plan.phrase=phrase;
  plan.layerTargets={melody:shape.notes,accompaniment:shape.drone,bass:.7+shape.drone*.3,percussion:shape.air};
  const wear=Math.min(.88,(w.wear??0)*(.35+(bar%32)/48+Math.min(cycle,8)*.055));
  const note=(degree,octave,beats,role,instrument,amplitude,pan=0)=>{
    let frequency=plan.frequency(degree,octave);
    if(role==='bass'){while(frequency>75)frequency/=2;while(frequency<32)frequency*=2;}
    events.push({frequency,beats,role,instrument,amplitude,pan,motionRate:.015625,wear});
  };
  
  for(let i=0;i<c.voicing.length;i++)if(step%(c.hold*16)===(i*w.spread)%(c.hold*16)){
    if(scene===4&&i%2)continue;
    note(chord+c.voicing[i],c.voicing[i]>7?0:1,c.hold*4+2.5,'accompaniment',c.pad,.021,
      (i-(c.voicing.length-1)/2)*.3);
  }
  if(tick===0&&bar%w.bedBars===0)
    note(0,0,w.bedBars*4+3,'accompaniment',w.bed,w.bedLevel,(colour&1)?.28:-.28);
  if(tick===0&&bar%w.bassBars===0){
    const degree=w.bassDegrees[Math.floor(bar/w.bassBars)%8];
    note(chord+degree,0,w.bassBars*4+1.5,'bass',c.bass,.078);
  }
  const isReply=[2,3,5,7].includes(scene),rows=isReply?w.replies:w.calls,theme=isReply?w.reply:c.theme;
  for(const [b,t,index,beats] of rows)if(local===b&&tick===t){
    
    const turn=isReply&&cycle%3===1&&index%3===1?1:0;
    note(theme[(index+((colour>>>9)&1))%theme.length]+turn,w.leadOctave,beats,'melody',c.lead,
      scene===4?.025:.042,-.14);
  }
  if(w.loop&&scene!==4&&scene!==6)for(const [b,t,index,beats] of w.loop)
    if(bar%w.loopBars===b&&tick===t)
      note(c.theme[(index+cycle)%c.theme.length],1,beats,'accompaniment',c.pluck,.015,.32);
  
  if(bar%4===c.value%4&&tick===(c.value%2?13:7)&&scene!==4)
    note(c.theme[(phrase+cycle)%8]+4,1,c.detail==='temple-bowl'?7:2.5,'percussion',c.detail,.017,.48);
  return events;
}
