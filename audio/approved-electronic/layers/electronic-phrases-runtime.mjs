import {SoundGenerator} from '../foundation/audio/synth.mjs';
import {createExpressionSource,setExpressionContext} from './electronic-expression-runtime.mjs';
import {ExpressionBassRuntime} from './electronic-phrases-bass-runtime.mjs';
import {ExpressionTechnoRuntime} from './electronic-phrases-techno-runtime.mjs';
import {isPhrasePilot,revisePhraseEvents} from './electronic-phrases-plan.mjs';
export {setExpressionContext};
export function createPhraseSource(rate,kind,params,version='revised',seed=42){
  if(version==='first')return createExpressionSource(rate,kind,params,'revised',seed);
  const source=new SoundGenerator(rate,kind,params,seed);
  if(version==='before'||!source.electronic)return source;
  const electronic=source.electronic,configure=electronic.configureInstruments.bind(electronic);
  electronic.configureInstruments=function(){
    configure();const c=this.plan.character;if(!isPhrasePilot(kind,c.value))return;
    if(!this.plan.phraseRevision){
      const plan=this.plan,events=plan.events.bind(plan);plan.events=(step,...args)=>revisePhraseEvents(plan,kind,step,events(step,...args));plan.phraseRevision=true;
    }
    const runtime=kind==='bassmusic'?new ExpressionBassRuntime(rate,c,this.rotation.seed):new ExpressionTechnoRuntime(rate,c,this.rotation.seed),add=runtime.add.bind(runtime);
    runtime.add=(event,tempo)=>{runtime.onsetBeat=this.nextStepBeat;if(event.phraseOmit){runtime.serial++;return;}add(event,tempo);};
    if(kind==='bassmusic')this.bassProduction=runtime;else this.technoProduction=runtime;
  };
  electronic.configureInstruments();return source;
}
