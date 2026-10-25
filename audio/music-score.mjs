import {BassProductionPlan} from './bass-production-plan.mjs';
import {TechnoProductionPlan} from './techno-production-plan.mjs';
import {keyEvents} from './key-phrase-plan.mjs';
import {phraseEvents,phraseCues} from './phrase-plan.mjs';
import {textureEvents,connectedCues} from './texture-plan.mjs';
import {accentEvents,accentCues} from './accent-plan.mjs';
import {tonalCues} from './tonal-plan.mjs';
import {modalCues} from './modal-plan.mjs';
import {voiceEvents,voiceCues} from './voice-arrangement.mjs';
const eventRules={keys:keyEvents,phrase:phraseEvents,texture:textureEvents,accent:accentEvents};
const cueRules={tonal:tonalCues,phrase:phraseCues,connected:connectedCues,accent:accentCues,modal:modalCues};
function shape(plan,kind,step,events){
  const p=plan.character.performance,bank=plan.runtime?.bank;
  if(bank)bank.step=step;
  if(plan.runtime)plan.runtime.step=step;
  // Schedule cues before shaping note events.
  if(bank&&cueRules[p.cues])for(const cue of cueRules[p.cues](plan,step,events))bank.add(cue,plan.settings.tempo);
  if(eventRules[p.score])events=eventRules[p.score](plan,kind,step,events);
  if(p.voiceRules){events=voiceEvents(plan,p.voiceRules,step,events);if(bank)for(const cue of voiceCues(plan,p.voiceRules,step))bank.add(cue,plan.settings.tempo);}
  return events;
}
export class BassScore extends BassProductionPlan{
  events(step,...args){return shape(this,'bassmusic',step,super.events(step,...args));}
}
export class TechnoScore extends TechnoProductionPlan{
  events(step,...args){return shape(this,'techno',step,super.events(step,...args));}
}
