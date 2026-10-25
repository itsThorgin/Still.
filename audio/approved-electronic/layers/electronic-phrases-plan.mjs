// Audition-only score revision. Original event slots remain in order so muted
// foreground events still consume their old identities before the next drum.
export const PHRASE_PILOTS=[['techno',3],['techno',1],['bassmusic',1],['bassmusic',31],['techno',7]];
export const isPhrasePilot=(kind,id)=>PHRASE_PILOTS.some(([k,i])=>k===kind&&i===id);
const within=(frequency,low,high)=>{while(frequency<low)frequency*=2;while(frequency>high)frequency/=2;return frequency;};
const omit=e=>({...e,phraseOmit:true});
const gesture=(e,mode,extra={})=>({...e,phraseGesture:{mode,...extra}});
function rootOf(plan,bar){const h=plan.p.harmony;return h.roots[Math.floor(bar/h.hold)%h.roots.length];}
function techPitch(plan,bar,degree){return within(plan.frequency(rootOf(plan,bar)+degree,1),145,520);}

function orbit(plan,step,e){
  const bar=Math.floor(step/16),local=bar%16,cycle=Math.floor(bar/16),m=plan.p.motif,mi=m.ticks.indexOf(step%m.length);
  if(local>=4&&local<=7||local===15)return omit(e);
  if(e.role==='accompaniment'){
    if(![2,10,14].includes(local))return omit(e);
    return gesture({...e,beats:local===10?1.5:.55},local===10?'swell':'chord',
      {level:local===10?.55:.42,colour:.55,attack:local===10?.08:.012,release:.12,send:local===14?1.22:.7});
  }
  let keep=false,mode='pulse',beats=.28,level=.75,degree=0;
  if(local<2){keep=[0,2].includes(mi);degree=[0,4,2,1,0][mi];level=mi===0?.95:.64;}
  else if(local<4){keep=local===2&&mi===0;mode='hold';beats=2.4;degree=cycle%2?2:0;level=.65;}
  else if(local<10){keep=(local===8?[0,3]:[1,4]).includes(mi);mode=mi===0||mi===1?'hold':'slide';beats=mi===0||mi===1?2.45:1.15;
    degree=([0,2,4,1,3][mi]+(cycle%2&&mi===4?1:0));level=mi===0?.90:.72;}
  else if(local<12){keep=local===10&&mi===2;mode='hold';beats=2.1;degree=cycle%2?4:2;level=.51;}
  else if(local<14){keep=[0,2,4].includes(mi);degree=[0,4,2,3,0][mi];beats=mi===4?.48:.24;level=[.91,.6,.73,.6,.56][mi];}
  else {keep=mi===1;mode='hold';beats=1.8;degree=0;level=.48;}
  if(!keep)return omit(e);
  return gesture({...e,patch:'motif',frequency:techPitch(plan,bar,degree),beats,accent:mi===0},mode,
    {level,colour:mode==='pulse'?.78:.53,wave:mode==='pulse'?'pulse':'triangle',vibrato:mode==='pulse'?0:6,
      shimmer:mode==='pulse'?0:.08,glide:.055,connect:mode==='slide',send:local===14?1.3:.8});
}
function dub(plan,step,e){
  const bar=Math.floor(step/16),local=bar%16,cycle=Math.floor(bar/16),m=plan.p.motif,mi=m.ticks.indexOf(step%m.length);
  if(local>=4&&local<=7||local===15)return omit(e);
  if(e.patch==='chord'){
    if(![0,3,8,10,14].includes(local))return omit(e);
    const i=Math.round((e.pan??0)/.22+(plan.p.harmony.voicing.length-1)/2),voiceCount=local===14?4:3;
    if(i>=voiceCount)return omit(e);
    const voicing=local===8?[0,3,4,8]:local===10?[0,1,4,7]:cycle%2?[0,2,6,8]:[0,2,4,8];
    const base=plan.frequency(rootOf(plan,bar)+voicing[i],0),candidates=[base,base*2,base*4,base*8].filter(f=>f>=160&&f<=850);
    candidates.sort((a,b)=>Math.abs(Math.log2(a/e.frequency))-Math.abs(Math.log2(b/e.frequency)));
    return gesture({...e,frequency:candidates[0]??within(base,160,850),beats:local===8?2.7:local===10?.45:local===14?1.05:.72},local===8?'swell':'chord',
      {level:local===8?.59:local===3?.54:local===10?.69:.92,colour:local===8?.58:local===10?.85:.76,
        attack:local===8?.16:.012,release:local===8?.25:.1,wave:local===8?'triangle':'saw',send:local===3||local===14?1.35:.75,shimmer:local===8?.045:0});
  }
  if(e.role!=='melody'||![2,12].includes(local))return omit(e);
  const degree=local===2?(mi===0?0:4):(mi===0?2:0);
  return gesture({...e,patch:'motif',frequency:within(techPitch(plan,bar,degree),145,390),beats:mi===0?2.2:1.55,accent:false},mi===0?'hold':'slide',
    {level:local===2?.51:.66,colour:.53,wave:'triangle',vibrato:5,shimmer:.065,glide:.07,connect:mi!==0,send:mi!==0?1.25:.8});
}
function melodic(plan,step,e){
  const bar=Math.floor(step/16),local=bar%8,m=plan.p.motif,mi=m.ticks.indexOf(step%m.length),tick=step%16;
  if(local===2||local===3||local===7)return omit(e);
  if(e.role==='accompaniment'){
    if(![1,5].includes(local)||tick!==plan.p.harmony.stabs[0])return omit(e);
    return gesture({...e,beats:2.5},'swell',{level:.55,colour:.70,attack:.12,release:.25,wave:'triangle',send:.8,shimmer:.035});
  }
  const keep=local===0?[0,1,2,4].includes(mi):local===4?[0,2,4].includes(mi):local===6?[1,4].includes(mi):false;
  if(!keep)return omit(e);
  const hold=local===4&&mi<4;
  return gesture({...e,beats:hold?1.8:Math.min(e.beats,.68),frequency:local===6?within(e.frequency/2,220,660):e.frequency},hold?(mi===0?'hold':'slide'):'singing',
    {level:local===6?.64:mi===0?.95:.82,colour:hold?.78:.95,connect:hold&&mi===2,glide:.045,vibrato:hold?5:2.5,shimmer:hold?.045:0,send:mi===4?1.15:.9});
}
function bass(plan,step,e){
  const bar=Math.floor(step/16),local=bar%8,tick=step%16,c=plan.character,garage=c.value===31;
  if(e.role==='accompaniment'){
    if(e.instrument==='dub-stab'){
      const ticks=[[3,14],[10],[3,14],[],[3,10],[14],[10],[]][local];
      if(!ticks.includes(tick))return omit(e);
      return gesture({...e,beats:local===5?.25:.32},'stab',{level:local===1||local===5?.68:.94,colour:local===1?.73:.97,send:local===6?1.3:.85});
    }
    return gesture(e,'pad',{level:[.84,.84,.95,.95,.82,.82,.9,.9][local],colour:.93});
  }
  if(local===3||local===7||garage&&local===5)return omit(e);
  const row=c.rhythms[(Math.floor(local/2)+plan.motifOffset)%c.rhythms.length],mi=row.indexOf(tick),index=Math.max(0,mi);
  if((local===2||local===5||local===6)&&index!==0)return omit(e);
  if((local===0||local===1||local===4)&&index>=2)return omit(e);
  const answer=local===2||local===6;
  return gesture({...e,instrument:answer?c.reply:c.lead,frequency:answer?within(e.frequency/2,200,880):e.frequency,
    beats:answer?(garage?.65:1.4):Math.min(e.beats,garage?.8:.9)},answer?'answer':'keys',
    {level:answer?.70:local===5?.57:index===0?.97:.73,colour:answer?.85:.96,send:answer?1.18:.85,vibrato:answer&&!garage?3:0});
}
export function revisePhraseEvents(plan,kind,step,events){
  const id=plan.character.value;if(!isPhrasePilot(kind,id))return events;
  return events.map(e=>{
    if(e.drum||e.role==='bass')return e;
    if(kind==='bassmusic')return bass(plan,step,e);
    if(id===3)return orbit(plan,step,e);
    if(id===1)return dub(plan,step,e);
    return melodic(plan,step,e);
  });
}
