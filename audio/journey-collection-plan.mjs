import {gardenHash} from '../garden-options.mjs';

const SECTIONS=[
  {name:'Opening',melody:.78,bass:.85,drums:.65,pad:.7},
  {name:'Main theme',melody:1,bass:1,drums:1,pad:1},
  {name:'Open theme',melody:1.08,bass:1,drums:1,pad:1,develop:true},
  {name:'Answer phrase',melody:.95,bass:1,drums:.9,pad:.85,answer:true},
  {name:'Quiet interlude',melody:.7,bass:.75,drums:.4,pad:.75,quiet:true},
  {name:'Theme returns',melody:1,bass:1,drums:1,pad:1},
  {name:'Contrasting bridge',melody:.85,bass:.8,drums:.65,pad:.85,answer:true,bridge:true},
  {name:'Closing theme',melody:.85,bass:.9,drums:.75,pad:.8},
];
export function journeyCollectionSection(plan,bar){return SECTIONS[plan.character.ensembleWriting.form[Math.floor((bar%32)/4)]];}
export function chooseJourneyEnsemble(seed,character){
  return Object.freeze(Object.fromEntries(Object.entries(character.ensembleWriting.patches).map(([role,pool],i)=>
    [role,pool[gardenHash(seed^character.value*733,0x656e7300+i)%pool.length]])));
}
function fold(f,low,high){while(f>high)f/=2;while(f<low)f*=2;return f;}
export function composeJourneyCollection(plan,step,params={}){
  const c=plan.character,w=c.ensembleWriting,fantasy=plan.kind==='fantasy',bar=Math.floor(step/plan.barSteps),tick=step%plan.barSteps,
    local=bar%4,chapter=Math.floor(bar/32),s=journeyCollectionSection(plan,bar),measure=plan.barSteps/4,
    energy=fantasy?(params.intensity??35)/100:.6,root=w.progression[Math.floor((bar%32)/w.hold)%8],
    ctx={c,events:[]},swing=tick%4===2?(w.swing??0):0;
  const note=(degree,octave,gate,role,voice,amplitude,extra={})=>{
    const patch=plan.ensemble[voice];plan.note(ctx,degree,octave,gate,role,patch,amplitude,voice==='main'?-.12:voice==='reply'?.2:0,
      {ensemblePatch:patch,ensembleRole:voice,delay:swing,...extra});
    const e=ctx.events.at(-1);
    if(role==='melody')e.frequency=fold(e.frequency,fantasy?(c.scene===4?130:180):140,fantasy?(c.scene===4?520:1050):740);
    if(role==='accompaniment')e.frequency=fold(e.frequency,130,fantasy?650:560);
  };
  
  if(tick===0&&bar%w.hold===0)for(const [i,d] of w.voicing.entries())
    note(root+d,0,Math.min(w.hold*measure-.15,8),'accompaniment','pad',.016*s.pad,
      {pan:(i-(w.voicing.length-1)/2)*.25});
  const row=w.bassRows[bar%w.bassRows.length];
  for(let i=0;i<row.length;i++){
    const [at,d,gate]=row[i];if(tick!==at||s.quiet&&i>0||fantasy&&energy<.25&&i>0)continue;
    note(root+d+(chapter%2&&local===3&&i===row.length-1?1:0),-1,gate,'bass','bass',.12*s.bass,{pan:0,delay:0});
  }
  const calls=w.calls[local],theme=s.answer?w.reply:w.theme,
    mainRole=s.answer?'reply':'main',replyRole=s.answer?'main':'reply';
  for(let i=0;i<calls.length;i++)if(tick===calls[i]&&(!s.quiet||local===1&&i===0)&&local!==3){
    const index=(local*4+i+(s.answer?3:0))%theme.length,
      turn=index%4===2?(gardenHash(plan.seed,c.value*91+index)%3)-1:0,
      degree=theme[index]+turn+(s.develop&&i===0&&local===2?1:0);
    note(root+degree,1,w.gate*(.94+(plan.seed%7)*.01)*(s.develop?1.12:1),'melody',mainRole,(fantasy?.09:.082)*s.melody,
      {themePhrase:s.answer?'B':'A'});
  }
  if(local===3&&w.responses.includes(tick)&&(!s.quiet||tick===w.responses[0])){
    const index=(w.responses.indexOf(tick)*3+2+chapter)%w.reply.length;
    note(root+w.reply[index],1,w.gate*1.15,'melody',replyRole,(fantasy?.07:.06)*s.melody,{delay:swing*.5,themePhrase:'reply'});
  }
  if(w.plucks.includes(tick)&&!s.quiet&&(!fantasy||bar%2===0||energy>.65)){
    const degree=w.voicing[(local+w.plucks.indexOf(tick))%w.voicing.length];
    note(root+degree,1,Math.min(.7,w.gate),'accompaniment','pluck',.028*s.pad,{pan:local%2?.25:-.25});
    if(!fantasy&&local%2===0)note(root+w.voicing[(local+1)%w.voicing.length],1,.5,'accompaniment','pluck',.014*s.pad,{pan:.2});
  }
  const drum=(d,level=d.level,extra={})=>plan.drum(ctx,d.name,level*s.drums,{tuning:d.tuning,delay:d.name==='hand'||d.name==='kick'?0:swing,...extra});
  if(!fantasy||energy>.12)for(const d of w.drums)if(d.ticks.includes(tick)){
    if(s.quiet&&(d.name!=='hand'&&d.name!=='kick'&&d.name!=='brush'||local%2===1||tick!==d.ticks[0]))continue;
    if(fantasy&&(d.name==='rim'&&energy<.25||d.name==='shaker'&&energy<.55))continue;
    drum(d,d.level*(fantasy?.45+energy*.8:1));
  }
  if(fantasy&&energy>.8&&!s.quiet&&local===3&&tick===plan.barSteps-1)
    drum({name:c.scene===5?'tom':'rim',level:.035,tuning:.9});
  return ctx.events;
}
