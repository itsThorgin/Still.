import {prepareFantasy,composeFantasy} from './fantasy-plan.mjs';
import {prepareCozyLounge,composeCozyLounge} from './lounge-cozy-plan.mjs';
import { gardenHash } from '../garden-options.mjs';
import { electronicCharacter } from '../electronic-characters.mjs';
import {chooseJourneyEnsemble,composeJourneyCollection} from './journey-collection-plan.mjs';

class JourneyPlan {
  constructor(seed, kind, selection, options = {}) {
    this.seed=seed; this.kind=kind; this.character=electronicCharacter(kind,selection,seed,options.scene);
    this.scale=this.character.scale; this.tonic=this.character.tonic[gardenHash(seed,0x726f6f74)%this.character.tonic.length];
    this.barSteps=this.character.meter??16; this.phraseSteps=this.barSteps*8;
    if(this.character.ensembleWriting){this.ensemble=chooseJourneyEnsemble(seed,this.character);this.formBars=32;}
  }
  context(step) {
    const c=this.character, bar=Math.floor(step/this.barSteps), tick=step%this.barSteps;
    const phrase=Math.floor(bar/4), scene=c.order[phrase%8], chapter=Math.floor(bar/32);
    const colour=gardenHash(this.seed^c.value*733,phrase+0x31b5);
    return {c,bar,tick,phrase,scene,chapter,colour,quiet:scene===4||scene===6,open:scene===2||scene===5,
      chord:c.progression[Math.floor(bar/c.hold)%c.progression.length], events:[]};
  }
  note(ctx, degree, octave, beats, role, instrument, amplitude, pan=0, extra={}) {
    const index=((degree%7)+7)%7;
    let frequency=440*2**((this.tonic+this.scale[index]+12*(octave+Math.floor(degree/7))-69)/12);
    if(role==='bass') {while(frequency>90)frequency/=2;while(frequency<33)frequency*=2;}
    ctx.events.push({frequency,beats,role,instrument,amplitude,pan,...extra});
    return frequency;
  }
  drum(ctx, drum, amplitude, extra={}) { ctx.events.push({drum,kit:ctx.c.kit,amplitude,...extra}); }
  tune(ctx, index) {
    const {c,chapter,colour,open}=ctx;
    const degree=c.theme[(index+chapter)%c.theme.length];
    return degree+((colour>>>(index%16))&1 && index%4===3 ? 1:0)+(open&&chapter%2?7:0);
  }
}

export class FantasyPlan extends JourneyPlan {
  constructor(seed,selection=0,options={}) {super(seed,'fantasy',selection,options);prepareFantasy(this);}
  events(step,params={}) {return composeFantasy(this,step,params);}
}

export class LoungePlan extends JourneyPlan {
  constructor(seed,selection=0,options={}) {super(seed,'lounge',selection,options);if(this.character.cozy)prepareCozyLounge(this);}
  events(step) {
    if(this.character.cozy)return composeCozyLounge(this,step);
    if(this.character.ensembleWriting)return composeJourneyCollection(this,step);
    const x=this.context(step),{c,bar,tick,chord,quiet,open,colour}=x;
    const delay=tick%4===2?c.swing:0;
    if(tick===0&&bar%c.hold===0) for(const [i,d] of c.voicing.entries())
      this.note(x,chord+d,1,c.hold*4-0.35,'accompaniment',c.pad,quiet?0.013:0.025,(i-1.5)*0.25);
    if(c.bassTicks.includes(tick)&&(!quiet||tick===0))
      this.note(x,chord+(tick>8?[4,6,2][(bar+tick)%3]:0),-1,tick===0?1.45:0.7,'bass',c.bass,quiet?0.052:0.089,0,{delay});
    if(c.rhythm.includes(tick)&&(quiet?bar%4===1:bar%4!==3))
      this.note(x,chord+this.tune(x,(bar%8)*2+c.rhythm.indexOf(tick)),1,open?1.75:0.95,'melody',c.lead,
        quiet?0.035:open?0.065:0.047,-0.18,{delay});
    if(bar%4===3&&[5,13].includes(tick)&&!quiet)
      this.note(x,chord+this.tune(x,bar+3),1,1.3,'melody',c.reply,0.037,0.25,{delay:c.swing/2});
    if(c.pattern.includes(tick)&&!quiet) for(const [i,d] of c.voicing.filter((_,i)=>i%2===0).entries())
      this.note(x,chord+d,1,0.65,'accompaniment',c.lead,0.018,(i?0.35:-0.3),{delay});
    const broken=c.kit==='lounge-broken', wood=c.kit==='lounge-wood';
    const kicks=broken?c.bassTicks:[0,c.bassTicks[1]??(bar%2?10:7)];
    if(kicks.includes(tick)&&(!quiet||tick===0&&bar%2===0)) this.drum(x,'kick',quiet?0.06:0.11,{delay});
    if([4,12].includes(tick)&&!quiet) this.drum(x,wood?'hand':'snare',c.kit==='lounge-brush'?0.045:0.065,{delay});
    const hats=quiet?[14]:c.kit==='lounge-digital'?[2,6,10,14]:[0,2,6,8,10,14];
    if(hats.includes(tick)) this.drum(x,c.kit==='lounge-brush'?'brush':'shaker',quiet?0.012:0.024,{delay});
    if(!quiet&&bar%4===3&&tick===15&&(colour&1)) this.drum(x,'rim',0.027,{delay:0.04});
    return x.events;
  }
}

