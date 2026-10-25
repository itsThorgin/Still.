import {journeyCollectionSection} from './journey-collection-plan.mjs';

const mod=(n,m)=>(n%m+m)%m;
function consonant(degree,root){
  let best=degree,distance=Infinity;
  for(let octave=-2;octave<=2;octave++)for(const tone of [0,2,4]){
    const d=root+tone+octave*7,delta=Math.abs(d-degree);
    if(delta<distance){best=d;distance=delta;}
  }return best;
}
const delayAt=(tick,swing)=>tick%4===2?swing:0;
function phrase(plan,answer){
  const w=plan.character.ensembleWriting,meter=plan.barSteps,measure=meter/4,notes=[];
  for(let bar=0;bar<4;bar++){
    const root=w.progression[(answer?4:0)+bar],reply=bar===3,ticks=reply?w.responses:w.calls[bar],
      source=reply||answer?w.reply:w.theme,voice=reply?(answer?'main':'reply'):answer?'reply':'main';
    for(let i=0;i<ticks.length;i++){
      const tick=ticks[i],delay=delayAt(tick,w.swing),start=tick/4+delay,
        next=i+1<ticks.length?ticks[i+1]/4+delayAt(ticks[i+1],w.swing):measure;
      let degree=source[(bar*4+i)%source.length];
      if(i===0||tick%4===0)degree=consonant(degree,root);
      if(reply&&i===ticks.length-1)degree=0;
      notes.push({bar,tick,degree,voice,delay,beats:Math.min(w.gate,next-start-.14,measure-start-.18),phrase:reply?'reply':answer?'B':'A'});
    }
  }return notes;
}
function chordVoices(w,answer){
  let previous=[2,4];const chords=[];
  for(let bar=0;bar<4;bar++){
    const root=w.progression[(answer?4:0)+bar],candidates=[];
    for(let degree=-1;degree<=10;degree++)if([0,2,4].includes(mod(degree-root,7)))candidates.push(degree);
    let best=[2,4],distance=Infinity;
    for(const low of candidates)for(const high of candidates)if(high-low>=2&&high-low<=5){
      const d=Math.abs(low-previous[0])+Math.abs(high-previous[1]);
      if(d<distance){best=[low,high];distance=d;}
    }
    chords.push(best);previous=best;
  }return chords;
}
export function prepareCozyLounge(plan){
  plan.formBars=32;plan.cozyThemes={A:phrase(plan,false),B:phrase(plan,true)};
  plan.cozyChords={A:chordVoices(plan.character.ensembleWriting,false),B:chordVoices(plan.character.ensembleWriting,true)};
  plan.cozyAt=Object.fromEntries(['A','B'].map(key=>[key,new Map(plan.cozyThemes[key].map(n=>[n.bar*plan.barSteps+n.tick,n]))]));
}
export function composeCozyLounge(plan,step){
  const c=plan.character,w=c.ensembleWriting,bar=Math.floor(step/plan.barSteps),tick=step%plan.barSteps,local=bar%4,
    chapter=Math.floor(bar/32),s=journeyCollectionSection(plan,bar),key=s.answer?'B':'A',
    root=w.progression[(s.answer?4:0)+local],measure=plan.barSteps/4,ctx={c,events:[]};
  const note=(degree,octave,beats,role,voice,amplitude,extra={})=>{
    // Route through the original Journey instruments. No digital/FM library
    // layer or struck ensemble resonator is added to these softer voices.
    const instrument=plan.ensemble[voice];
    plan.note(ctx,degree,octave,beats,role,instrument,amplitude,voice==='main'?-.15:voice==='reply'?.18:0,
      {ensembleRole:voice,cozyLounge:true,...extra});
  };
  const chord=plan.cozyChords[key][local];
  // Carry common tones through adjacent bars. Quiet two-note inner harmony
  // sits below the melody; a fresh four-note pad never piles onto each hit.
  if(tick===0)for(const [i,degree] of chord.entries()){
    if(local>0&&plan.cozyChords[key][local-1].includes(degree))continue;
    let bars=1;while(local+bars<4&&plan.cozyChords[key][local+bars].includes(degree))bars++;
    note(degree,0,bars*measure-.24,'accompaniment','pad',.011*s.pad,{pan:i?.24:-.24});
  }
  const row=w.bassRows[bar%w.bassRows.length];
  for(const [i,[at,d,gate]] of row.entries())if(tick===at&&(!s.quiet||i===0)){
    const next=row[i+1]?.[0]??plan.barSteps;
    const later=chapter%2&&local===3,degree=root+(later&&i===row.length-1&&i>0?(d===2?4:2):d);
    note(degree,-1,Math.min(gate*(later?.9:1),(next-at)/4-.12),'bass','bass',.085*s.bass,{pan:0});
  }
  const n=plan.cozyAt[key].get(local*plan.barSteps+tick);
  if(n&&(!s.quiet||local===1&&n.tick===w.calls[1][0])){
    note(n.degree,1,n.beats,'melody',n.voice,(n.voice==='main'?.049:.034)*s.melody,
      {delay:n.delay,themePhrase:n.phrase,phraseDegree:n.degree});
  }
  // One small comping gesture per bar, leaving the answer bar clear. It is
  // below the lead and uses its own gaps instead of doubling every offbeat.
  const now=tick/4+delayAt(tick,w.swing),leadActive=plan.cozyThemes[key].some(n=>n.bar===local
    &&now>=n.tick/4+n.delay&&now<n.tick/4+n.delay+n.beats+.12);
  if(!s.quiet&&local!==3&&w.plucks.includes(tick)&&!leadActive){
    const nextLead=plan.cozyThemes[key].find(n=>n.bar===local&&n.tick>tick);
    const gate=Math.min(.62,nextLead?(nextLead.tick-tick)/4-.14:(plan.barSteps-tick)/4-.18);
    if(gate>.15)for(const [i,degree] of chord.entries())note(degree,0,gate,'accompaniment','pluck',.012*s.pad,{pan:i?.27:-.24,delay:delayAt(tick,w.swing)});
  }
  for(const d of w.drums)if(d.ticks.includes(tick)){
    if(s.quiet&&(local%2===1||tick!==d.ticks[0]||!['kick','hand','brush'].includes(d.name)))continue;
    plan.drum(ctx,d.name,d.level*s.drums,{tuning:1,delay:d.name==='kick'||d.name==='hand'?0:delayAt(tick,w.swing)});
  }
  return ctx.events;
}
