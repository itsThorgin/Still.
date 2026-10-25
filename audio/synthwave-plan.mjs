import {ElectronicPlan} from './electronic-plan.mjs';
import {gardenHash} from '../garden-options.mjs';

export const SYNTHWAVE_SECTIONS=Object.freeze([
  {name:'First lights',lead:.65,bass:.75,pad:.68,arp:.45,drums:.6,filter:.7},
  {name:'Main theme',lead:1,bass:1,pad:1,arp:1,drums:1,filter:1},
  {name:'Distant answer',lead:.9,bass:.85,pad:.9,arp:.65,drums:.86,filter:.85},
  {name:'Open interval',lead:.7,bass:.42,pad:.85,arp:.16,drums:.22,filter:.6},
  {name:'Theme return',lead:1,bass:1,pad:1.08,arp:1,drums:1,filter:1.12},
  {name:'Another horizon',lead:.88,bass:.7,pad:1,arp:.5,drums:.68,filter:.82},
  {name:'Night in motion',lead:1.08,bass:1.05,pad:1.1,arp:1.05,drums:1.04,filter:1.2},
  {name:'Afterglow',lead:.75,bass:.72,pad:.8,arp:.4,drums:.65,filter:.72},
]);
const nearestChordTone=(degree,root)=>[-7,0,7,14].flatMap(o=>[0,2,4,6].map(n=>root+n+o))
  .reduce((best,n)=>Math.abs(n-degree)<Math.abs(best-degree)?n:best,root);
function voicings(roots,intervals){
  let previous=intervals.map(n=>n+7);
  return roots.map(root=>{
    const next=[];
    for(const [i,n] of intervals.entries()){
      const candidates=[-14,-7,0,7,14,21].map(o=>root+n+o).filter(n=>n>=5&&n<=26&&n>(next.at(-1)??4));
      next.push(candidates.reduce((best,n)=>Math.abs(n-previous[i])<Math.abs(best-previous[i])?n:best,candidates[0]));
    }
    previous=next;return next;
  });
}
export class SynthwavePlan extends ElectronicPlan{
  constructor(seed,selection=16){
    super(seed,'synthwave',selection);this.writing=this.character.synthwaveWriting;
    this.variant=this.writing.variant;this.phraseSteps=128;this.barSteps=16;this.formBars=64;
    this.mainVoicings=voicings(this.writing.progression,this.writing.voicing);
    this.bridgeVoicings=voicings(this.writing.bridge,this.writing.voicing);
  }
  events(step){
    const c=this.character,w=this.writing,bar=Math.floor(step/16),tick=step%16,phrase=Math.floor(bar/8),
      local=bar%8,cycle=Math.floor(bar/64),scene=w.order[phrase%8],s=SYNTHWAVE_SECTIONS[scene],
      contrasting=scene===2||scene===5,progression=scene===5?w.bridge:w.progression,chord=progression[local],events=[],
      cadence=local===7,build=local>=6&&[0,3,5].includes(scene),dropGap=cadence&&tick>=14&&scene!==7;
    this.phrase=phrase;
    this.motif=(contrasting?w.answer:w.theme).map((n,i)=>n+(cycle%2&&i===6?1:0));
    const delay=tick%4===2?w.swing:0;
    const note=(degree,octave,beats,role,instrument,amplitude,pan=0,extra={})=>{
      let frequency=this.frequency(degree,octave);
      if(role==='bass'){frequency=this.frequency(degree,-1);while(frequency>190)frequency/=2;while(frequency<36)frequency*=2;}
      events.push({frequency,beats,role,instrument,amplitude,pan:role==='bass'?0:pan,
        delay,synthwaveTone:true,filterLift:s.filter,expression:.94+(gardenHash(this.seed,bar*31+tick*7+c.value)%13)/100,...extra});
    };
    const drum=(name,amplitude,extra={})=>events.push({drum:name,amplitude:amplitude*s.drums*(.97+this.variant*.03),
      kit:c.kit,neonDrum:true,tuning:.98+(c.value%3)*.015,delay,...extra});
    
    if(tick===0&&(local===0||progression[local-1]!==chord||local===4)){
      let held=1;while(local+held<8&&progression[local+held]===chord&&held<2)held++;
      const tones=(scene===5?this.bridgeVoicings:this.mainVoicings)[local],
        voicing=scene===3?tones.filter((_,i)=>i%2===0):tones;
      voicing.forEach((degree,i)=>note(degree,0,held*4+.18,'accompaniment',c.pad,.07*s.pad,
        (i-(voicing.length-1)/2)*.3,{expression:1}));
    }
    const bassRow=scene===3?[[0,0,3.1]]:w.bassRows[(local+this.variant)%w.bassRows.length];
    for(const [t,degree,gate] of bassRow)if(tick===t&&!dropGap&&!(scene===0&&local<2&&tick!==0))
      note(chord+degree,0,gate,'bass',c.bass,.18*s.bass,0,{expression:tick===0?1:.92});
    const arpTicks=scene===3?[w.arp[0]]:w.arp;
    if(arpTicks.includes(tick)&&!(cadence&&tick>=10)&&!(scene===0&&local<2)){
      const degree=w.arpDegrees[(w.arp.indexOf(tick)+Math.floor(local/2)+(cycle%2))%w.arpDegrees.length];
      note(chord+degree,1,w.groove==='chill'?.85:.38,'accompaniment',c.pluck,.036*s.arp,tick%4?.3:-.3);
    }
    if(scene!==3&&w.comps.includes(tick)&&local%2===1&&!cadence)
      for(const [i,degree] of [2,6,8].entries())note(chord+degree,0,.6,'accompaniment',c.pluck,.023*s.pad,(i-1)*.3);
    
    const rhythm=cadence?[0]:w.calls[local%4],index=rhythm.indexOf(tick),
      entrance=scene===0?local>=4:scene===3?[2,5,7].includes(local):true;
    if(entrance&&index>=0){
      const before=Array.from({length:local},(_,i)=>w.calls[i%4].length).reduce((a,b)=>a+b,0),
        total=Array.from({length:7},(_,i)=>w.calls[i%4].length).reduce((a,b)=>a+b,0),
        theme=this.motif,position=Math.min(15,Math.floor((before+index)*16/total));
      let degree=theme[position];
      if(tick%4===0)degree=nearestChordTone(degree,chord);
      if(cycle%2&&local===4&&!cadence)degree+=index?1:2;
      if(cadence)degree=nearestChordTone(0,chord);
      const next=rhythm[index+1]??16,gap=(next-tick)/4,
        beats=cadence?2.5:Math.max(.25,Math.min(w.gate,gap*.93)),octave=['dark','noir','club'].includes(w.groove)&&!contrasting?0:1;
      note(degree,octave,beats,'melody',contrasting?c.reply:c.lead,.20*s.lead,-.035,
        {expression:cadence?.85:index===0?1:.9});
      if(scene===6&&local%2===0&&index===0&&['anthem','running','cinematic'].includes(w.groove))
        note(degree,0,beats,'accompaniment',c.reply,.024,.12);
    }
    const kicks=scene===3?(local>=6?[0,8]:local%2?[0]:[]):w.kicks[local%w.kicks.length];
    if(kicks.includes(tick)&&!dropGap&&!(scene===0&&local<2))drum('kick',.22);
    if(this.variant===2&&local%4===2&&tick===10&&!kicks.includes(tick)&&scene!==3&&scene!==0)drum('kick',.15);
    if((scene===3?[8]:w.snares).includes(tick)&&!(scene===0&&local<2)&&!dropGap){
      drum('snare',w.groove==='chill'?.15:.19);
      if(['neon-machine','neon-gated','neon-sunset'].includes(c.kit)&&scene!==3)
        drum('clap',.06,{delay:delay+.012});
    }
    if((scene===3?[14]:w.hats).includes(tick)&&!dropGap&&!(scene===0&&local<2))
      drum(tick===14&&local%4===3?'open-hat':'hat',(tick%4===2?.038:.024)*(local%2?.94:1));
    if(local%4===3&&!cadence&&tick===11&&scene!==3&&w.groove!=='minimal')drum('snare',.038,{delay:.018});
    if(cadence&&tick>=10&&tick%2===0&&scene!==7&&scene!==3){
      drum('tom',tick===12?.11:.075,{tuning:tick===10?1.35:tick===12?1.05:.8});
      if(build&&tick===12)drum('snare',.08);
    }
    if(local===0&&tick===0&&[1,4,6].includes(scene))drum('crash',scene===6?.075:.045);
    if(local===7&&tick===0&&build)drum('riser',.05,{beats:3.5});
    return events;
  }
}
