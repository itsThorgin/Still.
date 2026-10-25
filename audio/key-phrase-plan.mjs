const within=(frequency,low,high)=>{while(frequency<low)frequency*=2;while(frequency>high)frequency/=2;return frequency;};
const omit=e=>({...e,noteOmit:true});
const gesture=(e,mode,extra={})=>({...e,gesture:{mode,...extra}});
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

export function keyEvents(plan,kind,step,events){return events.map(e=>e.drum||e.role==='bass'?e:bass(plan,step,e));}
