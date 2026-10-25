import {createRebuildVoice,sampleRebuildVoice,startRebuildVoice,retireRebuildVoice,sine,clamp} from './six-character-rebuild-voices.mjs';
import {replacesCues} from './style-audit-plan.mjs';
const melodic=new Set(['liquid','atmospheric','melodic','dancefloor','theme','detroit','ambient']);
export class AuditUpperBank{
  constructor(rate,p,character,seed){
    this.rate=rate;this.p=p;this.character=character;this.seed=seed;this.serial=0;this.step=0;this.voices=[];this.lead=null;
    this.left=this.right=this.dryL=this.dryR=this.sendL=this.sendR=0;this.stats={connections:0,retirements:0,maxVoices:0,dropped:0};
  }
  add(event,tempo){
    const p=this.p,role=event.role??'melody',isCue=['bed','pulse','chord','lead'].includes(event.type),
      pad=event.type==='bed'||event.patch==='pad'||/pad/.test(event.instrument??'')||role==='accompaniment'&&(event.beats??0)>4;
    if(event.amplitude<=0)return;
    if(replacesCues(p)&&!event.auditAuthored&&!pad)return;
    if(p.action==='substantial'&&p.focus==='sub-space'&&!pad)return;
    if(!this.scoreOnly&&this.voices.length>=32){this.stats.dropped++;return;}
    const phase=Math.floor(this.step/16)%8,reply=[2,3,6,7].includes(phase),
      type=pad?'pad':event.auditType==='metal'?'chord':event.auditType??(event.type==='pulse'||event.type==='chord'?'chord':
        p.focus==='sub-space'?'cut':p.focus==='breaks'?'cut':melodic.has(p.family)&&role==='melody'?'sequence':role==='melody'?'chord':'chord'),
      input={...event,part:pad?'pad':role==='melody'?'lead':'chords',type,colour:.45+(phase/8)*.5,pan:event.pan??0,
        tone:(p.id+phase)%3,connect:!!(event.auditConnect??event.connect),amplitude:event.amplitude};
    if(this.onAccepted)this.onAccepted(input);
    if(this.scoreOnly)return;
    const v=createRebuildVoice(input,this.rate,tempo,(Math.imul(this.seed^++this.serial,2654435761)>>>0)||1);
    const warm=p.family==='liquid',space=['atmospheric','ambient'].includes(p.family),micro=p.family==='minimal',
      metal=event.auditType==='metal'||['industrial','raw','hard'].includes(p.family)&&role==='melody';
    if(warm&&!pad){v.attack=Math.round(this.rate*.009);v.release=Math.round(this.rate*.15);v.sustain=.10;v.decayRate=Math.exp(-1/(this.rate*.34));}
    if(space){v.attack=Math.round(this.rate*(pad?.55:.13));v.release=Math.round(this.rate*(pad?.85:.38));v.sustain=.72;}
    if(micro&&!pad){v.attack=Math.round(this.rate*.005);v.release=Math.round(this.rate*(type==='sequence'?.18:.065));v.sustain=.12;v.decayRate=Math.exp(-1/(this.rate*.09));}
    if(metal){v.auditMetal=true;v.metalPhase=0;v.metalMod=0;v.metalLow=0;v.metalHp=0;v.attack=Math.round(this.rate*.004);v.release=Math.round(this.rate*.085);v.sustain=.12;
      v.decayRate=Math.exp(-1/(this.rate*(p.id===21?.12:p.id===39?.20:.085)));v.metalRatio=p.id===21?2.47:p.id===39?3.14:2.21+(p.id%4)*.31;}
    if(['machine','percussion','propulsion','acid'].includes(p.focus)&&!pad&&!event.connect){v.attack=Math.round(this.rate*.005);v.sustain=.18;v.decayRate=Math.exp(-1/(this.rate*.14));}
    if(p.focus==='sub-space')v.amplitude*=.32;
    if(p.family==='minimal')v.amplitude*=.72;
    if(p.family==='detroit')v.amplitude*=.85;
    if(p.family==='acid')v.amplitude*=.62;
    if(p.focus==='breaks')v.amplitude*=.75;
    if(pad)v.amplitude*=p.family==='ambient'?.72:.70;
    v.end=v.gate+v.release;v.send=pad?.55:p.family==='deep'?.8:metal?.07:.28;
    if(v.part==='lead')v.previous=this.lead;
    this.voices.push(v);if(v.part==='lead')this.lead=v;
    this.stats.maxVoices=Math.max(this.stats.maxVoices,this.voices.length);
  }
  sample(params,frame,beats,scene={},kick=0){
    let l=0,r=0,sl=0,sr=0;const p=this.p,rate=this.rate;
    for(let i=this.voices.length-1;i>=0;i--){const v=this.voices[i];
      if(v.age>=v.end){this.voices.splice(i,1);continue;}if(v.age<0){v.age++;continue;}
      if(!v.started){startRebuildVoice(v,v.part==='lead'?v.previous:null,this.stats);v.previous=null;}
      sampleRebuildVoice(v,frame,beats,params.brightness/100,params.movement/100,params.tempo);
      if(v.auditMetal){
        v.metalPhase=(v.metalPhase+v.frequencyNow/rate)%1;
        v.metalMod=(v.metalMod+v.frequencyNow*v.metalRatio/rate)%1;
        const raw=sine(v.metalPhase+.31*sine(v.metalMod))*v.gain,
          c=1-Math.exp(-2*Math.PI*Math.min(2800,rate*.32)/rate),h=1-Math.exp(-2*Math.PI*210/rate);
        v.metalLow+=c*(raw-v.metalLow);v.metalHp+=h*(v.metalLow-v.metalHp);v.left=v.right=v.metalLow-v.metalHp;
      }
      const cycle=this.character.technoProduction?.motif.length??32,
        colour=p.focus==='cycle'?.88+.12*Math.cos(2*Math.PI*beats/(cycle/4)):.95,
        sceneGain=v.part==='pad'?(scene.texture??1):p.kind==='techno'?(scene.motif??1):1,
        level=v.amplitude*params[v.part==='lead'?'melody':'accompaniment']/100*colour*sceneGain*(1-kick*.13*params.pump/100),
        a=v.left*level*v.panL,b=v.right*level*v.panR;
      l+=a;r+=b;sl+=a*v.send;sr+=b*v.send;
    }
    this.left=this.dryL=l;this.right=this.dryR=r;this.sendL=sl;this.sendR=sr;
  }
}
export class AuditBassColour{
  constructor(rate,p,seed){this.rate=rate;this.p=p;this.seed=seed;this.serial=0;this.voices=[];this.active=null;this.left=this.right=0;this.stats={connections:0,retirements:0,maxVoices:0,dropped:0};}
  add(event,tempo){
    if(event.amplitude<=0)return;
    const p=this.p,x=event.auditBass??{},type=p.family==='deep'?'deep':p.family==='bassline'?'garage':p.family==='jumpup'?'rubber':'tearout',
      v=createRebuildVoice({...event,part:'bass',type,pan:0,colour:.5+(x.phase??0)/10,tone:x.tone??0,
        bend:p.family==='jumpup'?(x.held?-2.4:3.8):p.family==='bassline'?1.2:x.held?2.4:-.6,
        upperOctave:p.family==='neuro'&&x.answer&&p.id%2?1:0},this.rate,tempo,(this.seed+ ++this.serial*811)>>>0);
    v.upperLevel*=p.family==='deep'?.65:p.family==='neuro'?1.15:.93;
    if(this.voices.length>=5){this.stats.dropped++;return;}
    this.voices.push(v);this.stats.maxVoices=Math.max(this.stats.maxVoices,this.voices.length);
  }
  sample(params,frame,beats){
    let l=0,r=0;
    for(let i=this.voices.length-1;i>=0;i--){const v=this.voices[i];if(v.age>=v.end){this.voices.splice(i,1);continue;}if(v.age<0){v.age++;continue;}
      if(!v.started){startRebuildVoice(v,this.active,this.stats);this.active=v;}
      sampleRebuildVoice(v,frame,beats,params.brightness/100,params.movement/100,params.tempo);
      const gain=v.amplitude*params.bass/100;l+=v.left*gain;r+=v.right*gain;
    }
    this.left=l;this.right=r;
  }
}
