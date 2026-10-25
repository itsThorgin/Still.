import {electronicCharacter} from '../electronic-characters.mjs';
import {gardenHash} from '../garden-options.mjs';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=x=>x*x*(3-2*x);

const FORMS={
  tide:[[0,1,.3,0,.2,.3,.2,.2],[32,1,.85,.3,.7,.65,.55,.35],[80,1,1,.6,1,.7,.85,.6],[128,.8,.7,.25,.7,.4,1,.3],[176,1,1,.6,1,.8,.8,.65],[224,1,.6,.2,.55,.5,.6,.3],[256,1,.3,0,.2,.3,.2,.2]],
  micro:[[0,1,.3,.1,0,.2,0,.1],[16,1,1,.65,.3,.65,.1,.35],[48,1,1,.85,.4,.9,.2,.55],[64,1,.55,.2,.15,.4,0,.2],[96,1,1,.8,.4,.9,.2,.6],[128,1,.8,.55,.3,.6,.1,.4],[160,1,1,.75,.4,.9,.15,.5],[176,1,.5,.2,.1,.4,0,.2],[192,1,.3,.1,0,.2,0,.1]],
  orbit:[[0,1,.35,.2,.1,.35,.2,.15],[32,1,.85,.65,.3,.7,.5,.4],[80,1,1,1,.5,1,.9,.75],[112,1,.7,.5,.35,.55,.8,.4],[160,1,1,.85,.6,.9,1,.65],[208,1,.85,.65,.35,.7,.6,.5],[240,1,.5,.3,.2,.4,.3,.25],[256,1,.35,.2,.1,.35,.2,.15]],
  acid:[[0,1,.05,0,0,.35,0,.1],[16,1,.85,.1,0,.7,.1,.25],[48,1,1,.3,0,.9,.2,.6],[80,1,1,.35,0,1,.25,.95],[88,0,.7,.1,0,.25,.2,.6],[96,1,1,.3,0,1,.3,.95],[128,1,1,.4,0,1,.2,.75],[160,1,.9,.2,0,.8,.1,.5],[176,1,.5,0,0,.5,0,.2],[192,1,.05,0,0,.35,0,.1]],
  funk:[[0,1,.25,.15,0,.4,.1,.2],[16,1,.85,.8,.45,.85,.3,.45],[48,1,1,1,.8,1,.5,.65],[64,.5,.55,.35,.75,.4,.6,.3],[80,1,1,.9,.85,1,.4,.7],[112,1,.75,.5,.5,.75,.3,.4],[144,1,1,1,.8,1,.5,.75],[176,1,.5,.2,.2,.5,.1,.2],[192,1,.25,.15,0,.4,.1,.2]],
  warehouse:[[0,1,.2,0,0,.35,.1,.2],[16,1,.7,.6,.2,.8,.3,.4],[48,1,1,.9,.4,1,.7,.7],[80,1,.65,.35,.2,.45,.3,.4],[96,1,1,.85,.4,1,.6,.8],[128,1,1,1,.4,1,.8,.9],[160,1,.85,.65,.3,.8,.4,.6],[176,1,.35,.15,0,.4,.1,.2],[192,1,.2,0,0,.35,.1,.2]],
  machine:[[0,1,.15,.15,0,.4,.15,.25],[16,1,.7,.65,.1,.8,.4,.5],[48,1,1,1,.2,1,1,.85],[72,1,.5,.4,0,.55,.3,.4],[96,1,.85,.9,.2,1,.8,.8],[120,.5,.45,.4,0,.3,.6,.55],[128,1,1,1,.2,1,1,.95],[160,1,.75,.75,.1,.85,.5,.65],[176,1,.3,.2,0,.4,.2,.3],[192,1,.15,.15,0,.4,.15,.25]],
  pressure:[[0,1,.1,.1,0,.45,.1,.25],[16,1,.8,.6,.2,.85,.4,.5],[48,1,1,.9,.3,1,.6,.8],[80,1,1,.7,.2,1,.5,.85],[88,.0,.4,.25,.1,.25,.5,.6],[92,.0,.3,.3,.1,.4,.6,.85],[96,1,1,1,.3,1,.7,1],[128,1,.85,.8,.2,1,.6,.8],[160,1,.8,.6,.1,.85,.3,.6],[176,1,.3,.1,0,.5,.1,.25],[192,1,.1,.1,0,.45,.1,.25]],
  story:[[0,1,.2,.15,.15,.3,.2,.15],[16,1,.85,.7,.5,.75,.4,.4],[48,1,1,1,.8,1,.6,.75],[64,0,.25,.75,1,.2,.9,.35],[80,0,.45,.8,.8,.4,.7,.7],[88,1,.8,.8,.6,.8,.5,.8],[96,1,1,1,.8,1,.7,.95],[128,1,.8,.6,.6,.8,.5,.5],[144,1,1,1,.85,1,.7,.85],[176,1,.45,.2,.35,.5,.2,.25],[192,1,.2,.15,.15,.3,.2,.15]],
  cloud:[[0,.65,.3,.25,.35,.1,.5,.15],[48,.85,.7,.65,.8,.35,.9,.4],[96,1,.9,.85,1,.65,1,.65],[144,.5,.45,.4,.9,.15,1,.25],[192,1,.85,.75,1,.55,.9,.5],[240,.7,.35,.25,.4,.2,.6,.2],[256,.65,.3,.25,.35,.1,.5,.15]],
  ritual:[[0,1,.25,.1,0,.35,.1,.2],[16,1,.85,.5,.15,.8,.3,.45],[48,1,1,.8,.3,1,.5,.7],[80,1,.5,.3,.1,.55,.2,.35],[96,1,1,.8,.3,1,.5,.75],[128,1,.75,.5,.2,.8,.35,.5],[160,1,1,.8,.3,1,.5,.75],[176,1,.4,.1,0,.4,.1,.25],[192,1,.25,.1,0,.35,.1,.2]],
};
export function technoProductionScene(p,bar){
  const local=((bar%p.arrangement.bars)+p.arrangement.bars)%p.arrangement.bars,points=FORMS[p.arrangement.philosophy];
  let i=0;while(i<points.length-2&&points[i+1][0]<=local)i++;
  const a=points[i],b=points[i+1],t=smooth(clamp((local-a[0])/(b[0]-a[0]),0,1));
  const v=a.slice(1).map((x,j)=>x+(b[j+1]-x)*t);
  const kick=v[0]<.08?0:v[0];
  return {kick,bass:v[1],motif:v[2],chords:v[3],hats:v[4],texture:v[5],tension:v[6],
    detail:v[4]>.72,name:local<16?'Opening':local>=p.arrangement.bars-16?'Closing':kick===0?'Suspension':v[6]>.72?'Pressure':v[6]<.4?'Receding':'Developing'};
}

export class TechnoProductionPlan{
  constructor(seed,selection=0){
    this.seed=seed;this.kind='techno';this.character=electronicCharacter('techno',selection,seed);this.p=this.character.technoProduction;
    this.scale=this.character.scale;this.tonic=this.character.tonic[gardenHash(seed,0x726f6f74)%this.character.tonic.length];
    this.barSteps=16;this.phraseSteps=128;this.formBars=this.p.arrangement.bars;this.rumble=this.p.rumble.amount;
    this.variant=gardenHash(seed,this.character.value*97)%3;
    
    let previous=this.p.harmony.voicing.map((d,i)=>this.frequency(d,1+(i===0?0:1)));
    this.chordVoicings=this.p.harmony.roots.map(root=>{
      const frequencies=this.p.harmony.voicing.map((d,i)=>{
        const base=this.frequency(root+d,0),candidates=[base,base*2,base*4,base*8].filter(f=>f>=160&&f<=950);
        candidates.sort((a,b)=>Math.abs(Math.log2(a/previous[i]))-Math.abs(Math.log2(b/previous[i])));
        return candidates[0];
      });previous=frequencies;return frequencies;
    });
  }
  frequency(degree,octave=0){const n=this.scale.length,i=((degree%n)+n)%n;return 440*2**((this.tonic+this.scale[i]+12*(octave+Math.floor(degree/n))-69)/12);}
  events(step){
    const p=this.p,bar=step/16,tick=step%16,wholeBar=Math.floor(bar),scene=technoProductionScene(p,bar),events=[];
    this.state=scene;
    const root=p.harmony.roots[Math.floor(bar/p.harmony.hold)%p.harmony.roots.length];
    const drum=(name,level,extra={})=>events.push({drum:name,amplitude:level,role:'percussion',...extra});
    const kickTicks=p.groove.kickRows[wholeBar%p.groove.kickRows.length];
    if(scene.kick>0&&kickTicks.includes(tick))drum('kick',p.kick.level*scene.kick,{pan:0});
    for(let index=0;index<p.groove.lanes.length;index++){
      const l=p.groove.lanes[index],cycle=Math.floor(step/l.length),rotation=l.rotateEvery?Math.floor(wholeBar/l.rotateEvery)%l.length:0,
        at=(step+rotation)%l.length,hit=l.ticks.indexOf(at);
      if(hit<0||l.detail&&!scene.detail)continue;
      const chance=gardenHash(this.seed^((index+1)*65537),cycle*31+at)/4294967296;
      if(l.probability&&chance>l.probability)continue;
      const accent=l.velocity[(hit+cycle)%l.velocity.length],delay=(tick%2?p.groove.swing:0)+
        p.groove.humanize*(gardenHash(this.seed,step*17+index)/4294967296);
      drum(l.drum,l.level*accent*scene.hats,{pan:l.pan,tuning:l.tuning??1,delay,decayScale:.86+.24*accent});
    }
    
    if(wholeBar%32===31&&tick===15&&scene.detail&&['hard','industrial','driving'].includes(p.family))drum('snare',.075,{pan:0,decayScale:.7});
    const note=(degree,octave,beats,role,patch,amplitude,extra={})=>events.push({frequency:this.frequency(degree,octave),beats,role,patch,amplitude,pan:0,...extra});
    const b=p.bass,bpos=step%b.length,bIndex=b.ticks.indexOf(bpos%16);
    if(bIndex>=0&&scene.bass>.02){
      const phrase=Math.floor(bpos/16),idx=(bIndex+(b.acid&&b.length>16?phrase:0))%b.notes.length;
      const degree=root+b.notes[idx],nextIndex=(bIndex+1)%b.ticks.length,
        next=b.ticks[nextIndex]+(nextIndex===0?16:0),gap=(next-bpos%16)/4,
        slide=b.slides.includes(idx),tie=b.slides.includes((idx+1)%b.notes.length);
      let frequency=this.frequency(degree,-1);if(!b.acid){while(frequency>85)frequency/=2;while(frequency<35)frequency*=2;}
      note(degree,-1,b.acid?gap*(tie?1.08:b.gate):Math.min(gap*.88,b.gate),'bass',b.acid?'acid':'bass',b.level*scene.bass,
        {frequency,accent:b.accents.includes(idx),slide,gateId:idx,delay:b.acid?0:(tick%2?p.groove.swing:0)});
    }
    const m=p.motif,pos=step%m.length,mi=m.ticks.indexOf(pos);
    if(mi>=0&&scene.motif>.04){
      const cycle=Math.floor(step/m.length),answer=Math.floor(bar/32)%4===3,
        idx=(mi+Math.floor(cycle/2)+(answer?Math.max(1,m.notes.length>>1):0))%m.notes.length;
      
      const turn=p.constraints.pitchMutation&&wholeBar%8===7&&mi===m.ticks.length-1?this.variant-1:0;
      note(root+m.notes[idx]+turn,m.octave,m.gate,'melody',m.wave==='fm'?'metal-motif':'motif',m.level*scene.motif,
        {pan:p.family==='ambient'?.25:0,delay:tick%2?p.groove.swing:0,accent:mi===0});
    }
    const h=p.harmony;
    if(h.stabs.includes(step%h.length)&&scene.chords>.04){
      for(let i=0;i<h.voicing.length;i++){
        const degree=root+h.voicing[i],frequency=this.chordVoicings[Math.floor(bar/h.hold)%h.roots.length][i];
        note(degree,0,p.family==='dub'?.85:.65,'accompaniment','chord',h.level*scene.chords/Math.sqrt(h.voicing.length),
          {frequency,pan:(i-(h.voicing.length-1)/2)*.22,dubThrow:wholeBar%16===15?1.45:1});
      }
    }
    if(h.pad&&tick===0&&wholeBar%8===0&&scene.texture>.15){

      for(let i=0;i<3;i++)note(root+h.voicing[i],2,28,'accompaniment','pad',h.padLevel*scene.texture,{pan:(i-1)*.65});
    }
    return events;
  }
}
