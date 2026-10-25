const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fold=(f,lo=180,hi=780)=>{while(f<lo)f*=2;while(f>hi)f/=2;return f;};
export const replacesCues=p=>p.kind==='techno'&&p.action==='substantial'&&['micro','detroit','theme','propulsion'].includes(p.focus);
export function auditEvents(plan,p,step,events){
  if(p.action==='keep')return events;
  const bar=Math.floor(step/16),local=bar%8,tick=step%16,reply=[2,3,6,7].includes(local),
    section=plan.state?.section,airy=['intro','breakdown','space','outro'].includes(section),
    phrase=local>=4?1:.86;
  return events.map(e=>{
    if(e.developmentOmit||e.phraseOmit||e.amplitude===0)return e;
    if(e.drum){
      if(p.focus==='breaks'&&(e.ghost||e.chop<.7||e.drum==='tom'))return {...e,amplitude:e.amplitude*(local%4===3?.76:tick%8===7?.88:.95),decayScale:(e.decayScale??1)*.88};
      if(['percussion','acid'].includes(p.focus)&&['hat','open-hat','ride','noise'].includes(e.drum))return {...e,
        amplitude:e.amplitude*([3,7].includes(local)?.73:.92),decayScale:(e.decayScale??1)*([3,7].includes(local)?.74:.92)};
      if(p.focus==='percussion'&&['tom','conga','metal'].includes(e.drum))return {...e,amplitude:e.amplitude*[1,.75,.9,.62][(Math.floor(step/12)+p.id)%4]};
      return e;
    }
    if(e.role==='bass'){
      if(p.kind==='techno'){
        if(p.focus==='acid')return {...e,amplitude:e.amplitude*(e.accent?1.02:.91),auditBass:{phase:local,accent:!!e.accent}};
        return e;
      }
      if(p.action!=='substantial')return e;
      const writing=plan.writing,row=reply?writing.response:writing.call,
        next=row.find(n=>n[0]>tick)?.[0]??16,gap=Math.max(.15,(next-tick)/4),last=!row.some(n=>n[0]>tick),
        pocket=local===7&&last&&tick>=12&&!airy;
      if(p.focus==='sub-space')return {...e,amplitude:e.amplitude*(pocket?0:reply?.9:1),
        beats:Math.min(3,(16-tick)/4-.06,e.beats*(reply?1.25:.93)),
        delay:(e.delay??0)+(local===5?.25:0),auditBass:{phase:local,answer:reply,tone:last?2:0}};
      if(p.focus==='bass-dialogue'||p.focus==='bassline'){
        const held=reply&&last&&!airy,beats=Math.min(gap-.04,(16-tick)/4-.05,e.beats*(held?1.85:.78));
        return {...e,beats:Math.max(.12,beats),amplitude:e.amplitude*(pocket?0:held?.95:last?.84:1),
          auditBass:{phase:local,answer:reply,held,tone:(local+(last?1:0)+p.id)%4},
          sound:writing.sound};
      }
      return e;
    }
    let n={...e,auditUpper:{phase:local,tick,reply,phrase,section}};
    if(p.kind==='bassmusic'){
      if(p.focus==='sub-space')return {...n,amplitude:e.amplitude*(e.role==='melody'?(p.action==='substantial'?0:local===6?.19:.09):.32),beats:Math.min(e.beats,.28)};
      if(p.action==='substantial'&&p.focus==='bass-dialogue')return {...n,amplitude:e.amplitude*(e.role==='melody'?.12:.35),beats:e.role==='melody'?Math.min(.26,e.beats):e.beats};
      if(p.focus==='bassline')return {...n,amplitude:e.amplitude*(e.role==='melody'?.65:.78),beats:e.role==='melody'?Math.min(.38,e.beats):Math.min(.30,e.beats),auditType:e.role==='melody'?'vowel':'chord'};
      if(e.role==='accompaniment')return {...n,amplitude:e.amplitude*(reply?.67:.84)};
      if(p.focus==='breaks')return {...n,beats:Math.min(.32,e.beats),amplitude:e.amplitude*(local%4===3?.2:.75)};
      if(p.focus==='space')return {...n,amplitude:e.amplitude*(reply?.66:.9),beats:e.beats*(reply?.85:1.08)};
      if(['phrase','theme'].includes(p.focus))return {...n,beats:Math.min(2.2,e.beats*(reply?.82:1.28)),amplitude:e.amplitude*(reply?.77:1),auditConnect:!reply&&tick>2};
      return {...n,amplitude:e.amplitude*(reply?.81:1)};
    }
    if(p.focus==='machine'){
      const strong=p.action==='substantial',length=plan.p.motif.length,pos=step%length,
        index=Math.max(0,plan.p.motif.ticks.indexOf(pos)),turn=local===7&&tick>=8;
      return {...n,beats:e.beats*(strong?(reply?1.7:.65):.85),frequency:e.frequency*(strong&&reply&&index===0?.5:1),
        amplitude:e.amplitude*(turn?.15:[1,.72,.9,.6][(index+Math.floor(step/length))%4]),auditType:strong?'metal':undefined};
    }
    if(p.focus==='percussion'&&e.role==='melody')return {...n,amplitude:e.amplitude*(reply?.62:.88),beats:Math.min(.5,e.beats)};
    return n;
  });
}
export function authoredAuditCues(plan,p,step){
  if(!replacesCues(p))return [];
  const bar=Math.floor(step/16),local=bar%8,tick=step%16,writing=plan.p,
    root=writing.harmony.roots[Math.floor(bar/writing.harmony.hold)%writing.harmony.roots.length],
    notes=writing.motif.notes,positions=writing.motif.ticks,pos=step%writing.motif.length,mi=positions.indexOf(pos),
    out=[],late=Math.floor(bar/8)%2;
  const cue=(degree,beats,type,amplitude,extra={})=>out.push({frequency:fold(plan.frequency(root+degree,1),p.focus==='micro'?170:190,p.focus==='micro'?650:850),
    beats,type,amplitude,pan:0,role:type==='lead'?'melody':'accompaniment',delay:tick%2?writing.groove.swing:0,auditAuthored:true,...extra});
  if(p.focus==='micro'){
    if(mi>=0&&[0,1,2,4,5,6].includes(local)){
      const answer=local===6,degree=notes[(mi+(local<4?0:1))%notes.length];
      cue(degree,answer&&mi===0?.90:.16+(mi%2)*.08,answer&&mi===0?'lead':'pulse',.048*[1,.7,.88,.55][(mi+local)%4],{connect:false});
    }
  }else if(p.focus==='detroit'){
    const bassSlot=writing.bass.ticks.indexOf(tick);
    if([0,1,2,4,5,6].includes(local)&&[0,2].includes(bassSlot)){
      const index=(local*2+(bassSlot===2?1:0))%notes.length;
      cue(notes[index],bassSlot===2?1.48:2.02,'lead',p.id===4?.038:.042,
        {connect:bassSlot===2||[1,2,5,6].includes(local)});
    }
    const rows=p.id===4?[[3,10],[6,14],[3,11],[7],[2,10],[6,13],[3,11],[6]]:[[7],[3,11],[6],[2,14],[7],[3,10],[5,13],[10]];
    if(rows[local].includes(tick))writing.harmony.voicing.slice(0,3).forEach((d,i)=>cue(d,.27+(local%3)*.07,'chord',.043/Math.sqrt(3),{pan:(i-1)*.22}));
  }else if(p.focus==='theme'){
    const slot=writing.bass.ticks.indexOf(tick),allowed=[0,1,2,4,5,6].includes(local);
    if(slot>=0&&allowed){
      const i=(local*2+slot)%notes.length,degree=notes[i],last=slot===writing.bass.ticks.length-1;
      cue(degree,last?1.8:2.05,'lead',.080*(last?.76:1),{connect:slot>0||[1,2,5,6].includes(local)});
    }
  }else if(p.focus==='propulsion'){
    if(mi>=0&&local!==7){
      const bridge=[2,6].includes(local)&&mi===positions.length-1,degree=notes[mi%notes.length];
      cue(degree,bridge?1.16:.27+(mi%3)*.06,bridge?'lead':'pulse',bridge?.037:.046*[1,.72,.87][mi%3],{connect:false});
    }
  }
  return out;
}
