// The extension shares the accepted mixer and sound library, but has authored
// performance data and form orders rather than aliases to the first fifteen.
const SECTIONS=[
  {name:'Low opening',drums:.8,bass:.85,lead:.7,chords:.35},
  {name:'Main groove',drums:1,bass:1,lead:1,chords:.65},
  {name:'Developing groove',drums:1,bass:1,lead:1,chords:.85,detail:true},
  {name:'Low valley',drums:.45,bass:.72,lead:.75,chords:.35,quiet:true},
  {name:'Rebuild',drums:.75,bass:.85,lead:.8,chords:.55,build:true},
  {name:'Groove returns',drums:1,bass:1,lead:1,chords:.8,detail:true},
  {name:'Second low phrase',drums:1,bass:1,lead:.95,chords:.7,second:true,detail:true},
  {name:'Closing groove',drums:.85,bass:.9,lead:.75,chords:.4},
];
export function technoCollectionSection(plan,bar){return SECTIONS[plan.expansion.form[Math.floor((bar%128)/8)]];}
function fold(f,low,high){while(f>high)f/=2;while(f<low)f*=2;return f;}
export function composeTechnoCollection(plan,step){
  const w=plan.expansion,c=plan.character,bar=Math.floor(step/16),tick=step%16,part=bar%128,
    chapter=Math.floor(bar/128),section=technoCollectionSection(plan,bar),events=[];
  const root=w.progression[Math.floor(part/w.hold)%w.progression.length],local=bar%8;
  const swing=tick%4===2||tick%4===3?(w.swing??0):0;
  const note=(degree,beats,role,instrument,amplitude,extra={})=>{
    let frequency=plan.frequency(degree,role==='bass'?-1:0,role==='bass');
    if(role==='accompaniment')frequency=fold(frequency,150,380);
    events.push({frequency,beats,role,instrument,amplitude,pan:0,technoVoice:true,
      toneColour:.4+.15*Math.sin(bar*Math.PI/16),toneDecay:.16,delay:swing,...extra});
  };
  const drum=(name,level,tuning=1,extra={})=>events.push({drum:name,kit:c.kit,amplitude:level*section.drums,
    rhythmDrum:true,rhythmKit:'techno',technoDrive:true,kickShape:w.kick,tuning,delay:name==='kick'?0:swing,...extra});
  const kicks=w.kicks[bar%w.kicks.length];
  if(kicks.includes(tick)&&(!section.quiet||tick===kicks[0]||tick===kicks[Math.floor(kicks.length/2)]))
    drum('kick',w.kick==='drive'?.27:w.kick==='deep'?.245:.25);
  if(!section.quiet)for(const d of w.drums)if(d.ticks.includes(tick))drum(d.name,d.level,d.tuning);
  if(w.polymeter&&(!section.quiet||local%2===0)&&w.polymeter.ticks.includes(step%w.polymeter.length))
    drum(w.polymeter.name,w.polymeter.level,w.polymeter.tuning*(1+(Math.floor(step/w.polymeter.length)%3)*.07));
  if(section.detail&&local===7&&[10,15].includes(tick))drum('tom',.033,tick===10?1.15:.82);
  // Phrase endings subtract detail in valleys; only the rebuild gets a quiet pickup.
  if(section.build&&local===7&&tick===15)drum('snare',.03,1.1,{duration:.09});

  const bass=w.bassRows[bar%w.bassRows.length];
  for(let i=0;i<bass.length;i++){
    const [at,degree,beats,accent,slide]=bass[i];if(tick!==at)continue;
    const answer=local===7&&i===bass.length-1&&chapter%2?2:0;
    if(w.acid){
      const next=bass[(i+1)%bass.length],gap=(next[0]+(i===bass.length-1?16:0)-at)/4;
      note(root+degree+answer,gap*(next[4]?1.12:.7),'bass','tech-acid',.16*section.bass,
        {slide:!!slide,accent:accent?1:0,toneDecay:.12,delay:0});
    }else note(root+degree+answer,beats,'bass','tech-sub',.175*section.bass,
      {rhythmBass:true,bassShape:w.bassShape,cutoffCeiling:w.bassShape==='reese'?1300:w.bassShape==='pulse'?850:550,
        motionRate:w.bassShape==='reese'?.5:w.bassShape==='pulse'?.25:.125});
  }
  const calls=w.calls[bar%w.calls.length],motif=section.second?w.reply:w.motif;
  for(let i=0;i<calls.length;i++)if(tick===calls[i]&&(!section.quiet||i===0)){
    const index=(local*2+i+plan.themeVariant%3)%motif.length;
    const degree=root+motif[index]+(chapter%2&&local===7?2:0);
    const colour=w.roles[(local+(section.second?1:0))%w.roles.length],chordRoot=plan.frequency(degree,0);
    const chordRatios=[1,plan.frequency(degree+2,0)/chordRoot,plan.frequency(degree+4,0)/chordRoot];
    note(degree,Math.min(w.gate,colour==='dub'?.42:1.25),'melody','tech-reed',
      (colour==='dub'?.12:colour==='hollow'?.14:.17)*section.lead,
      {frequency:fold(chordRoot,110,260),leadColour:colour,leadBand:'body',leadRest:false,chordRatios,
        themePhrase:section.second?'B':'A',toneDecay:w.gate,delay:swing});
  }
  // A single small touch per authored 16/32-bar cycle, placed away from the
  // main low calls. Alternate sound families without a continuous upper line.
  const accentTick=[15,14,13,12].find(at=>!calls.includes(at));
  if(part%w.accentEvery===w.accentAt&&tick===accentTick&&!section.quiet){
    const colour=Math.floor(part/w.accentEvery)%2?'glass':'air';
    const degree=root+w.reply[(Math.floor(part/w.accentEvery)+plan.themeVariant)%w.reply.length];
    note(degree,colour==='glass'?.24:.65,'melody','tech-reed',.026*section.lead,
      {frequency:fold(plan.frequency(degree,0),260,520),leadColour:colour,leadBand:'accent',leadRest:false,delay:0});
  }
  if(bar%w.chordEvery===0&&w.chordTicks.includes(tick))for(const [i,d] of w.voicing.slice(0,3).entries())
    note(root+d,.5,'accompaniment','tech-dub',.014*section.chords,{pan:(i-1)*.2,toneDecay:.2});
  return events;
}
