import {ElectronicPlan} from './electronic-plan.mjs';
import {gardenHash} from '../garden-options.mjs';

const SECTIONS=[
  {name:'Low opening',bass:.86,drums:.8,body:.75,chords:.4},
  {name:'Main groove',bass:1,drums:1,body:1,chords:.7},
  {name:'Developing break',bass:1,drums:1,body:1,chords:.8,detail:true,develop:true},
  {name:'Low valley',bass:.75,drums:.55,body:.75,chords:.5,quiet:true},
  {name:'Rebuild',bass:.9,drums:.85,body:.8,chords:.6,build:true},
  {name:'Groove returns',bass:1,drums:1,body:1,chords:.7,detail:true},
  {name:'Second low phrase',bass:1,drums:1,body:.95,chords:.8,second:true,detail:true},
  {name:'Closing groove',bass:.9,drums:.85,body:.75,chords:.4},
];
export function bassDepthSection(plan,bar){return SECTIONS[plan.writing.form[Math.floor((bar%128)/8)]];}
function fold(f,lo,hi){while(f>hi)f/=2;while(f<lo)f*=2;return f;}

export class BassDepthPlan extends ElectronicPlan{
  constructor(seed,style){
    super(seed,'bassmusic',style);this.writing=this.character.bassWriting;
    if(!this.writing)throw new RangeError('Unsupported deep Bass character');
    this.formBars=128;this.motif=this.writing.motif;this.themeVariant=gardenHash(seed,this.character.value*131)%3;
  }
  events(step){
    const c=this.character,w=this.writing,bar=Math.floor(step/16),tick=step%16,local=bar%8,part=bar%128,chapter=Math.floor(bar/128),
      s=bassDepthSection(this,bar),half=c.groove==='halftime',jungle=c.groove==='jungle',events=[],root=w.progression[Math.floor(part/w.hold)%8];
    const swing=tick%4>=2?(w.swing??0):0;
    const note=(degree,beats,role,level,extra={})=>events.push({frequency:fold(this.frequency(degree),role==='bass'?35:110,role==='bass'?78:280),
      beats,role,instrument:role==='bass'?'deep-reese':'hollow-lead',amplitude:level,pan:0,kit:c.kit,delay:swing,...extra});
    const drum=(name,level,extra={})=>events.push({drum:name,amplitude:level*s.drums,kit:c.kit,rhythmKit:'dnb',rhythmDrum:true,
      kickShape:w.kick,kickFrequency:w.kick==='deep'?46:51,delay:name==='kick'||name==='snare'&&[4,8,12].includes(tick)?0:swing,...extra});
    const kicks=w.kicks[bar%w.kicks.length];
    if(kicks.includes(tick)&&(!s.quiet||tick===kicks[0]))drum('kick',tick===kicks[0]?.25:.205);
    const snares=s.quiet?[half?8:12]:w.snares[bar%w.snares.length];
    if(snares.includes(tick))drum('snare',[4,8,12].includes(tick)?.175:.085,
      {duration:half?.19:jungle&&tick%4?.085:.155,tuning:half?.84:jungle&&tick%4?1.18:.96});
    if((s.quiet?[14]:w.hats).includes(tick))drum('hat',tick%4===2?.023:.014,{duration:.05});
    if(!s.quiet&&w.ghosts[bar%w.ghosts.length].includes(tick)&&!snares.includes(tick))
      drum('snare',jungle?.028:.02,{duration:.07,tuning:1.15,delay:.018});
    for(const d of w.drums)if(d.ticks.includes(tick)&&(!s.quiet||local%2===0))drum(d.name,d.level,{tuning:d.tuning});
    if(w.polymeter&&(!s.quiet||local%2===0)&&w.polymeter.ticks.includes(step%w.polymeter.length))
      drum(w.polymeter.name,w.polymeter.level,{tuning:w.polymeter.tuning});
    if(s.detail&&local===7&&[10,15].includes(tick))drum('tom',.032,{tuning:tick===10?.95:.7});
    if(s.build&&local===7&&tick===15)drum('snare',.025,{duration:.08});

    const bass=w.bassRows[bar%w.bassRows.length];
    for(let i=0;i<bass.length;i++){
      const [at,degree,gate]=bass[i];if(tick!==at||s.quiet&&i>0)continue;
      const turn=chapter>0&&local===7&&i===bass.length-1?(chapter%2?1:-1):0;
      note(root+degree+turn,gate,'bass',.19*s.bass,{rhythmBass:true,bassShape:w.shape,cutoffCeiling:w.ceiling,motionRate:w.motion,
        attack:w.shape==='reese'?.006:.012,delay:0});
    }
    const calls=w.calls[bar%w.calls.length],motif=s.second?w.reply:w.motif;
    for(let i=0;i<calls.length;i++)if(tick===calls[i]&&(!s.quiet||i===0)&&!(local===7&&tick>=8)){
      const degree=motif[(local*2+i+this.themeVariant+(s.second?3:0))%motif.length]+root
          +(s.develop&&local%4===0&&i===0?1:0)+(chapter%2&&local===7?1:0),
        libraryRole=(local%4<2)!==!!s.second?'main':'reply';
      note(degree,w.gate*(.94+(this.seed%7)*.01),'melody',.155*s.body,{deepBassVoice:true,libraryRole,deepBand:'body',softCeiling:850,
        themePhrase:s.second?'B':'A',pan:libraryRole==='main'?-.1:.14,
        delay:[4,8,12].includes(tick)?Math.max(swing,.15):swing});
    }
    // Quiet, short upper touches answer rather than repeat the low line.
    const accentTick=[15,14,13,11].find(at=>!calls.includes(at));
    if(!s.quiet&&part%w.accentEvery===w.accentAt&&tick===accentTick&&local!==7)
      note(root+w.reply[(Math.floor(part/w.accentEvery)+this.themeVariant)%w.reply.length],.5,'melody',.022*s.body,
        {frequency:fold(this.frequency(root+w.reply[this.themeVariant%w.reply.length]),280,560),deepBassVoice:true,libraryRole:'touch',
          deepBand:'accent',softCeiling:1300,pan:.25,delay:0});
    if(bar%w.chordEvery===0&&tick===w.chordAt)for(const [i,d] of w.voicing.entries())
      note(root+d,w.chordGate,'accompaniment',.012*s.chords,{deepBassVoice:true,libraryRole:'bed',softCeiling:700,
        frequency:fold(this.frequency(root+d),150,350),pan:(i-(w.voicing.length-1)/2)*.24});
    return events;
  }
}
