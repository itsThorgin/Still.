import { ElectronicPlan } from './electronic-plan.mjs';
import { gardenHash } from '../garden-options.mjs';

const forms={
  anthem:['intro','establish','theme','build','drop','response','drop','turn','breakdown','develop','build','drop2','response','drop2','resolve','outro'],
  pressure:['intro','establish','build','drop','response','drop','turn','drop','breakdown','develop','build','drop2','response','drop2','turn','outro'],
  flow:['intro','establish','theme','develop','roll','answer','roll','turn','breakdown','theme','develop','return','answer','roll','resolve','outro'],
  drift:['intro','intro','establish','theme','roll','answer','develop','turn','breakdown','develop','theme','return','roll','answer','resolve','outro'],
  dub:['intro','establish','theme','space','drop','response','space','drop','breakdown','theme','space','drop2','response','drop2','resolve','outro'],
  garage:['intro','establish','theme','groove','response','groove','turn','theme','breakdown','develop','groove','return','response','groove','resolve','outro'],
};
const kicks={
  'two-step':[[0,6,10],[0,7,10],[0,6,11],[0,5,10,14]],
  jump:[[0,6,10],[0,7,11],[0,5,10],[0,6,13]],
  machine:[[0,6,10],[0,5,11],[0,7,10,14],[0,6,9]],
  fluid:[[0,6,10],[0,7,10],[0,6,11],[0,7,14]],
  chopped:[[0,3,10],[0,7,11,14],[2,6,10],[0,5,9,14]],
  floating:[[0,7,10],[0,6,11],[2,10],[0,7,14]],
  'half-space':[[0],[3,13],[0,11],[5]],
  'half-impact':[[0,6],[0,11],[0,5,14],[2,12]],
  'half-melodic':[[0,6,14],[0,11],[0,5,13],[0,10]],
  shuffle:[[0,6,10],[0,7,11],[2,6,14],[0,10,15]],
  'four-shuffle':[[0,4,8,12],[0,4,8,12],[0,4,8,12],[0,4,8,12,15]],
};
const choppedSnares=[[4,12],[4,11,14],[4,12,15],[4,10,13]];
export class BassProductionPlan extends ElectronicPlan{
  constructor(seed,selection){
    super(seed,'bassmusic',selection);this.writing=this.character.bassProduction;
    this.form=[...forms[this.writing.arrangement]];
    // Small structural choices preserve functional opening/build/drop relationships.
    if(this.character.value%3===0&&this.form[6]!=='build')this.form[6]='answer';
    if(this.character.value%4===1&&this.form[13]!=='build')this.form[13]='return';
    this.phraseSteps=128;this.barSteps=16;this.state={};this.lastVoicing=null;this.lastChordBar=-1;
    this.motif=this.character.theme;this.answer=this.character.answer;
    this.motifOffset=gardenHash(seed,this.character.value+811)%4;
    this.character={...this.character,form:this.form};
  }
  section(bar){return this.form[Math.floor(bar/8)%16];}
  events(step){
    const bar=Math.floor(step/16),tick=step%16,local=bar%8,p=this.writing,c=this.character,section=this.section(bar);
    const intro=section==='intro',outro=section==='outro',valley=section==='breakdown',build=section==='build',
      airy=intro||valley||section==='space',drop=['drop','drop2','return','roll','groove'].includes(section),
      secondary=section==='drop2',answer=['response','answer','turn'].includes(section)||local%4===3;
    const progress=(local+tick/16)/8;
    const pause=build&&local===7&&tick>= (p.drop==='silence'?12:14);
    this.state={section,bar,drop,secondary,build,progress,gate:pause?0:1,
      low:build?1-progress*.9:valley?.25:intro?.45:outro?.6:1,
      filter:build? .25+progress*.65:airy?.55:1,width:build?.45:drop?1: .85};
    if(pause)return [];
    const events=[],beatDelay=(t,anchor=false)=>anchor?0:(t%2?p.swing*.25:0)+
      (gardenHash(this.seed,bar*277+t*13+c.value)%7)/1000;
    const drum=(name,amp,extra={})=>events.push({drum:name,amplitude:amp,bassProduction:true,
      delay:beatDelay(tick,name==='kick'&&tick===0||name==='snare'&&[4,8,12].includes(tick)),...extra});
    const note=(degree,octave,beats,role,instrument,amplitude,pan=0,extra={})=>{
      let frequency=this.frequency(degree,octave);while(frequency<100)frequency*=2;while(frequency>3000)frequency/=2;
      events.push({frequency,beats,role,instrument,amplitude,pan,bassProduction:true,...extra});
    };
    const hold=p.hold,chordIndex=Math.floor(bar/hold)%c.progression.length;
    let chord=c.progression[chordIndex];
    if(['pedal','modal','tension'].includes(p.harmony))chord=local===7?c.progression[(Math.floor(bar/8)+1)%c.progression.length]:0;
    const quiet=intro?.4:valley?.28:build?.55+progress*.4:outro?.55:1;
    const half=p.groove.startsWith('half'),jungle=p.groove==='chopped',garage=p.family==='garage';
    const kickBank=p.kickPatterns??kicks[p.groove];
    let kickRow=kickBank[(local+c.value%2)%kickBank.length];
    // Character-specific phrase pickup. The minimal orbit keeps its deliberate gaps.
    if(!airy&&!build&&local%4===3&&c.value!==13){
      const pickup=[11,13,14,15][c.value%4];kickRow=[...new Set([...kickRow,pickup])];
    }
    if(airy)kickRow=local%2?[...(p.family==='deep'?[3]:[0])]:[0];
    if(build&&local>=6)kickRow=[0,4,8,12];
    if(kickRow.includes(tick))drum('kick',(p.family==='atmospheric'?.4:.52)*quiet,{firstBeat:tick===0&&drop});
    let snareRow=half?[8]:jungle?(p.snarePatterns??choppedSnares)[(local+c.value)%(p.snarePatterns??choppedSnares).length]:[4,12];
    if(garage)snareRow=[4,12];
    if(snareRow.includes(tick)&&(!intro||local>=4)){
      const primary=half?tick===8:tick===4||tick===12;
      drum('snare',(primary?.62:.36)*quiet,{chop:jungle? .75+(local%3)*.12:1});
      if((garage||p.family==='heavy'||p.family==='dancefloor')&&primary)drum('clap',.11*quiet,{delay:.012});
    }
    const hats=half?p.family==='deep'?[6,14]:[2,6,10,14]:jungle?[0,2,5,6,8,10,13,14]:garage?[2,3,6,7,10,11,14,15]:[0,2,4,6,8,10,12,14];
    if(hats.includes(tick)&&(!intro||local>=2)&&!(valley&&tick%8!==6)){
      const accent=tick%4===2?1:.55+(c.value%5)*.025;
      drum(tick===[6,14,10,2][c.value%4]&&local%4===c.value%4?'open-hat':'hat',.11*accent*quiet,{pan:tick%4===2?.22:-.22});
    }
    const ghosts=jungle?[3,7,9,15]:['fluid','floating'].includes(p.groove)?[3,7,11,15]:half?[]:[7,15];
    if(ghosts.includes(tick)&&!airy&&!build&&(local+tick+c.value)%3!==0)
      drum('snare',(.1+(gardenHash(this.seed,bar*17+tick)%4)*.012)*quiet,{ghost:true,chop:.5,pan:-.13});
    if(!airy&&!half&&tick%4===3&&(local+c.value)%2===0)drum('shaker',.043*quiet,{pan:.45});
    if((jungle||c.value===29)&&[5,13].includes(tick)&&local%2)drum(c.value%2?'conga':'rim',.075*quiet,{pan:-.3});
    // Short, authored break-slice substitutions; rolls never replace every bar.
    if(local===7&&!airy&&tick>=12){
      const fills=jungle?[12,13,14,15]:build?[12,14,15]:[13,15];
      if(fills.includes(tick))drum(jungle||build?'snare':'tom',.2+(tick-12)*.035,{chop:.5,pan:(tick-13.5)*.13});
    }
    if(build&&local>=4&&tick%(local>=7?1:local>=6?2:4)===0&&!snareRow.includes(tick))
      drum('snare',.1+progress*.13,{ghost:true,chop:.6});
    if(drop&&local===0&&tick===0)drum('crash',p.drop==='minimal'?.035:.08,{pan:.3});

    // A stable two-bar cell returns; responses occur at musical phrase boundaries.
    let row=answer?p.response:p.call;
    if(airy)row=[[p.family==='jungle'?2:0,0,valley?5:8]];
    if(build&&local>=6)row=[[0,0,3],[8,0,2]];
    const idx=row.findIndex(n=>n[0]===tick);
    if(idx>=0){
      const n=row[idx],last=idx===row.length-1;
      let degree=chord+n[1];
      if(last&&local===7&&Math.floor(bar/128)%2)degree+=1;
      if(secondary&&last&&local%4===3&&p.family!=='deep')degree+=4;
      let hz=this.frequency(degree,-1);while(hz<35)hz*=2;while(hz>88)hz/=2;
      const gap=(row[idx+1]?.[0]??16)-tick;
      const gate=Math.min(n[2],gap-.22,build&&local===7?12-tick:16-tick);
      if(gate>0)events.push({role:'bass',instrument:'production-bass',frequency:hz,beats:gate/4,
        amplitude:(p.family==='atmospheric'?.31:.36)*(last&&answer?.9:1),pan:0,
        bassProduction:true,
        sound:answer?this.writing.responseTimbre:p.sound,
        articulation:idx===0?'accent':last?'tail':'pulse',glide:garage||p.family==='jumpup'?.027:p.family==='liquid'?.018:.009,
        motionRate:secondary?p.motionRate*1.5:p.motionRate,
        delay:garage?beatDelay(tick):0,low:1,cutoffScale:this.state.filter,
      });
    }

    // Slowly changing, voice-led harmony belongs to the subgenres that need it.
    const rich=['extended','jazz','soul'].includes(p.harmony),chordEvery=rich?hold:4;
    if(tick===0&&bar%chordEvery===0&&(!build||local<6)){
      const intervals=rich?(p.harmony==='jazz'?[0,2,6,8]:c.voicing):[0,4];
      const target=intervals.slice(0,4).map(d=>chord+d);
      const previous=bar===this.lastChordBar+chordEvery?this.lastVoicing:null;
      const voiced=target.map((d,i)=>{
        if(!previous)return d;
        return [d-7,d,d+7].filter(n=>n>=-4&&n<=18).sort((a,b)=>Math.abs(a-previous[i])-Math.abs(b-previous[i]))[0]??d;
      });
      this.lastVoicing=voiced;this.lastChordBar=bar;
      voiced.forEach((d,i)=>note(d,rich?0:-1,chordEvery*4-.15,'accompaniment',c.pad,
        (rich?.042:.016)*(valley?1.15:intro?.8:1),(i-(voiced.length-1)/2)*.4,{cutoffCeiling:rich?4000:1800}));
    }
    if(garage&&[3,10,14].includes(tick)&&!valley&&local%4!==3){
      for(const d of [0,2,6])note(chord+d,0,.32,'accompaniment','dub-stab',.045,tick===3?-.3:.3,{delay:beatDelay(tick),cutoffCeiling:3000});
    }
    const sparse=p.melody<.4;
    let melodyRow=c.rhythms[(Math.floor(local/2)+this.motifOffset)%c.rhythms.length];
    // Empty original call rows must not erase a sparse character's entire theme for some seeds.
    if(sparse&&!melodyRow.length)melodyRow=c.rhythms.find(row=>row.length)??[11];
    const mi=melodyRow.indexOf(tick);
    if(mi>=0&&!build&&(!sparse||local%4===2&&mi===0)&&!(local===7&&tick>=8)&&(!intro||local>=4)){
      const motif=answer?c.answer:c.theme,degree=motif[(local*2+mi+this.motifOffset)%motif.length];
      note(chord+degree,p.family==='atmospheric'?1:rich?1:0,
        airy?1.8:Math.min(1.3,((melodyRow[mi+1]??16)-tick)/4*.9),
        'melody',answer?c.reply:c.lead,.1*p.melody*(drop?.9:1),mi%2?.22:-.22,
        {delay:beatDelay(tick),cutoffCeiling:rich?6200:2800});
    }
    return events;
  }
}
