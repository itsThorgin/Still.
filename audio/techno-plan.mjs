import { electronicCharacter } from '../electronic-characters.mjs';
import { gardenHash } from '../garden-options.mjs';
import { TECHNO_FORM_BARS, technoSection, technoTheme } from './techno-themes.mjs';
import { technoBassSteps } from './techno-groove.mjs';
import { technoLeadPart } from './techno-ensemble.mjs';
import { composeTechnoCollection } from './techno-collection-plan.mjs';
export {TechnoProductionPlan as TechnoPlan} from './techno-production-plan.mjs';

// One- or two-bar machines. Pitch stays put while density and filter colour evolve.
// Rows: bass steps, upper steps, upper degrees, synth, rumble send, tone decay.
const MACHINES = [
  [[2,10],[3,11],[0,0],'tech-dub',0.12,0.14],
  [[2,7,10],[1,6,11],[0,0,4],'tech-click',0.03,0.045],
  [[2,6,10,14],[0,3,6,9,12,15],[0,1,0,0,1,0],'tech-reed',0.22,0.075],
  [[2,6,10,14],[2,6,10,15],[0,0,3,0],'tech-chord',0.10,0.12],
  [[0,2,3,6,8,10,11,14],[7,15],[0,0],'tech-click',0.10,0.05],
  [[2,10,14],[6,14],[0,0],'tech-dub',0.14,0.20],
  [[2,6,10,14],[0,3,6,10,12,15],[0,2,4,2,0,4],'tech-reed',0.12,0.14],
  [[2,5,10,14],[0,3,7,10,14],[0,0,1,0,0],'tech-metal',0.32,0.065],
  [[2,6,10,14],[1,4,7,10,13],[0,0,0,1,0],'tech-reed',0.28,0.06],
  [[2,6,10,14],[2,6,10,14],[0,0,1,0],'tech-metal',0.38,0.055],
  [[2,7,10,15],[3,11],[0,0],'tech-click',0.09,0.055],
  [[2,6,10,14],[2,5,8,11,14],[0,0,0,1,0],'tech-chord',0.25,0.09],
  [[2,7,11,14],[1,6,9,14],[0,0,4,0],'tech-reed',0.15,0.07],
  [[2,10],[6,14],[0,4],'tech-dub',0.04,0.25],
  [[2,5,10,13],[3,6,11,14],[0,0,0,3],'tech-chord',0.12,0.085],
];
const HARMONIES=[
  [0,0,3,5],[0,0,1,0],[0,5,3,6],[0,3,5,1],[0,0,1,0],
  [0,5,3,1],[0,5,3,6],[0,1,0,5],[0,0,5,3],[0,1,0,3],
  [0,0,3,1],[0,3,5,6],[0,1,3,5],[0,2,5,3],[0,3,1,5],
];

// Kept for historical score tools. Live Techno uses the production plan above.
export class LegacyTechnoPlan {
  constructor(seed, selection=0) {
    this.seed=seed; this.kind='techno'; this.character=electronicCharacter('techno',selection,seed);
    this.scale=this.character.scale;
    this.tonic=this.character.tonic[gardenHash(seed,0x726f6f74)%this.character.tonic.length];
    this.barSteps=16; this.phraseSteps=128;
    this.formBars=TECHNO_FORM_BARS;
    this.expansion=this.character.technoWriting;
    this.machine=MACHINES[this.character.value-1];
    this.rumble=this.expansion?.rumble??this.machine[4];
    this.offset=gardenHash(seed,0x74656368)%3;
    this.themeVariant=gardenHash(seed,0x6d656c6f)%8;
  }
  frequency(degree, octave, bass=false) {
    const index=((degree%7)+7)%7;
    let f=440*2**((this.tonic+this.scale[index]+12*(octave+Math.floor(degree/7))-69)/12);
    if(bass){while(f>90)f/=2;while(f<33)f*=2;}
    return f;
  }
  events(step) {
    if(this.expansion)return composeTechnoCollection(this,step);
    const c=this.character,id=c.value,bar=Math.floor(step/16),tick=step%16;
    const chapter=Math.floor(bar/TECHNO_FORM_BARS),part=bar%TECHNO_FORM_BARS;
    const song=technoSection(bar);
    const [,upper,degrees,instrument,,decay]=this.machine;
    const low=technoBassSteps(id,bar);
    const acid=id===5, melodic=id===7, ambient=id===14, broken=id===13;
    const dub=[1,6].includes(id), heavy=[8,9,10,12].includes(id);
    const stripped=song.drums===0, developed=part>=16&&song.drums>0.7;
    const colour=0.45+0.22*Math.sin((bar+this.offset)*Math.PI/16)+0.09*(chapter%3);
    // Each return restarts the harmonic sentence along with the recognizable hook.
    const harmonyBar=part<32?Math.max(0,part-8):part<48?part-32:part<80?Math.max(0,part-56):
      part<96?part-80:part>=112?part-112:part-96;
    const root=HARMONIES[id-1][Math.floor(harmonyBar/([1,2,5,14].includes(id)?8:4))%4];
    const events=[];
    const note=(degree,octave,beats,role,name,amplitude,extra={})=>{
      let frequency=this.frequency(degree,octave,role==='bass');
      // Repeated supporting machines must not become a second high lead.
      if(role==='accompaniment'){while(frequency>380)frequency/=2;while(frequency<150)frequency*=2;}
      events.push({frequency,beats,role,instrument:name,amplitude:amplitude*(role==='accompaniment'?0.55:1),
        pan:0,technoVoice:true,toneColour:colour,toneDecay:decay,...extra});
    };
    const drum=(name,amplitude,extra={})=>{if(song.drums>0)events.push({drum:name,kit:c.kit,
      amplitude:amplitude*song.drums,technoDrive:true,rhythmDrum:true,rhythmKit:'techno',
      kickShape:dub||ambient?'deep':heavy?'drive':'punch',...extra});};
    const kickTicks=song.name==='Rebuild'?[0,8]:broken?(bar%2?[0,6,8,11]:[0,3,8,14]):[0,4,8,12];
    if(kickTicks.includes(tick))drum('kick',ambient?0.18:id===10?0.30:heavy?0.27:dub?0.235:0.245);
    if(!stripped&&[4,12].includes(tick)&&!ambient)
      drum(id===2?'rim':broken?'snare':'clap',id===2?0.055:heavy?0.10:0.078);
    const swing=id===15&&tick%4===2?0.065:0;
    if(!stripped&&tick%4===2)drum('open-hat',ambient?0.016:dub?0.032:heavy?0.047:0.038,{delay:swing});
    if(!stripped&&!ambient&&[0,8].includes(tick))drum('hat',dub?0.013:heavy?0.021:0.017);
    if(developed&&!stripped&&bar%4===3&&[7,15].includes(tick)&&![1,6,14].includes(id))
      drum('shaker',id===2?0.011:0.016,{delay:id===15?0.035:0});
    if(id===11&&!stripped&&[1,5,7,10,13].includes(tick))
      drum('tom',0.085,{tuning:[0.8,1.12,0.93,1.3,0.8][[1,5,7,10,13].indexOf(tick)]});
    if(heavy&&developed&&!stripped&&[7,15].includes(tick))drum('metal',0.04,{tuning:0.8+id*0.03});
    if(melodic&&developed&&!stripped&&[0,8].includes(tick))drum('metal',0.024,{tuning:1.8});
    if(!stripped&&id===15&&[1,9].includes(tick))drum('rim',0.04);
    if(!stripped&&!ambient&&id!==11&&bar%2===1&&[7,14].includes(tick))
      drum(id===15||id===4?'conga':'tom',dub?0.035:0.048,{tuning:tick===7?1.18:0.83});
    if(developed&&[4,7,12].includes(id)&&bar%4===2&&[2,10].includes(tick))drum('ride',0.019);
    if(developed&&part%16===8&&tick===0&&!dub&&!ambient)drum('crash',0.027);
    if(song.build&&part%8>=4&&tick>=8&&tick%2===0)drum('snare',0.025+(part%8)*0.004);

    if(low.includes(tick)&&song.bass>0) {
      if(acid) {
        const index=low.indexOf(tick), next=low[(index+1)%low.length]+(index===low.length-1?16:0);
        // Destination slide flags tie the previous gate across the step boundary.
        const slides=[false,false,true,false,false,false,true,false];
        const pitches=[0,0,7,0,0,1,4,0];
        const accented=[true,false,false,true,false,true,false,false][index];
        const tieNext=slides[(index+1)%low.length];
        const pitch=root+pitches[(index+this.offset*2)%8];
        note(pitch,-1,(next-tick)/4*(tieNext?1.14:0.58),'bass','tech-acid',0.17*song.bass,
          {frequency:this.frequency(pitch,-1),slide:slides[index],accent:accented?1:0,toneDecay:0.11,toneColour:colour});
      } else {
        const bassName=dub||ambient?'tech-sub':heavy&&id!==12?'tech-grit':'tech-pluck';
        const index=low.indexOf(tick),next=low[(index+1)%low.length]+(index===low.length-1?16:0);
        const answer=bar%4===3&&index===low.length-1&&!ambient;
        const degree=root+(id===4&&tick===14?4:id===15&&tick===13?4:answer?([3,7,12].includes(id)?4:0):0);
        const gate=Math.min((next-tick)/4*0.88,dub?1.35:ambient?1.6:id===10?0.48:0.84);
        note(degree,-1,gate,'bass',bassName,(heavy?0.17:dub?0.17:ambient?0.13:0.18)*song.bass,
          {rhythmBass:true,bassShape:dub||ambient?'sub':heavy?'reese':'pulse',
            cutoffCeiling:heavy?1500:900,motionRate:heavy?0.5:0.25,
            amplitude:(heavy?0.17:dub?0.17:ambient?0.13:0.18)*song.bass*(index%2?0.9:1)});
      }
    }
    // The old short machine is a supporting texture. Melody now has its own phrase.
    if(!stripped&&upper.includes(tick)&&(!acid||bar%2===1)&&(song.arp>=0.8||bar%2===0)) {
      const index=upper.indexOf(tick), motifIndex=(index+(chapter%2&&index===upper.length-1?1:0))%degrees.length;
      const degree=root+degrees[motifIndex];
      if(dub||[4,12,15].includes(id)) {
        // Locked chord shape; an echoing rhythmic object rather than a tune with replies.
        for(const [i,d] of c.voicing.slice(0,dub?4:3).entries())
          note(root+d,1,dub?0.65:0.34,'accompaniment',instrument,(dub?0.032:0.028)*song.arp,{pan:(i-1)*0.18});
      } else note(degree,ambient?2:id===8||id===10?0:1,ambient?1.4:0.28,'accompaniment',instrument,
        (acid?0.018:ambient?0.025:heavy?0.043:0.035)*song.arp,{accent:tick%3===0?1:0});
    }
    const theme=technoTheme(id,bar,tick,this.themeVariant);
    if(theme) {
      const part=technoLeadPart(id,bar,tick,this.themeVariant);
      const degree=root+theme.degree+(chapter%2&&bar%8===6?2:0);
      let frequency=this.frequency(degree,part.octave);
      while(frequency>part.high)frequency/=2;
      while(frequency<part.low)frequency*=2;
      const rootFrequency=this.frequency(degree,0);
      const chordRatios=[1,this.frequency(degree+2,0)/rootFrequency,this.frequency(degree+4,0)/rootFrequency];
      // Keep one event/identity even during a rest, so all accepted drum/bass
      // random identities remain exact when this lead is muted.
      note(degree,part.octave,Math.min(theme.beats,part.maxBeats),'melody','tech-reed',part.rest?0:theme.level*part.gain,
        {frequency,leadColour:part.colour,leadRest:part.rest,chordRatios,leadBand:part.band,
          toneDecay:theme.decay,toneColour:colour,themePhrase:theme.phrase});
    }

    // Short harmonic phrases make the chord movement audible without a constant pad.
    if(tick===0&&bar%2===0&&song.harmony>0)
      for(const [i,d] of c.voicing.slice(0,dub||ambient?4:3).entries())
        note(root+d,1,1.8,'accompaniment','tech-dub',0.035*song.harmony,
          {toneDecay:0.5,pan:(i-1)*0.2});
    if((ambient||melodic)&&tick===0&&bar%8===0)
      for(const [i,d] of c.voicing.entries())note(root+d,1,ambient?30:12,'accompaniment',c.pad,
        (ambient?0.014:0.009)*song.harmony,{pan:(i-1.5)*0.25});
    else if(!stripped&&c.pattern.includes(tick)&&(!dub||bar%2===1))
      note(root+(id===3?[0,0,1][(step+this.offset)%3]:id===11?4:0),id===10||id===12?0:1,
        0.18,'accompaniment',id===8||id===10?'tech-metal':id===2||id===11?'tech-click':id===6?'tech-dub':'tech-reed',
        (ambient?0.007:acid?0.018:0.026)*song.arp,{toneDecay:0.04,pan:tick%2?0.22:-0.22,
          toneColour:colour*(developed?1:0.6)});
    return events;
  }
}
