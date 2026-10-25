import {SoundGenerator} from '../foundation/audio/synth.mjs';
import {ExpressionBassRuntime} from './electronic-expression-bass-runtime.mjs';
import {ExpressionTechnoRuntime} from './electronic-expression-techno-runtime.mjs';
import {expressionSelection} from './electronic-expression-config.mjs';

export function createExpressionSource(rate,kind,params,version='revised',seed=42){
  const source=new SoundGenerator(rate,kind,params,seed);
  if(version==='before'||!source.electronic)return source;
  const electronic=source.electronic,configure=electronic.configureInstruments.bind(electronic);
  electronic.configureInstruments=function(){
    configure();const c=this.plan.character;
    if(!expressionSelection(kind,c.value))return;
    const runtime=kind==='bassmusic'?new ExpressionBassRuntime(rate,c,this.rotation.seed):new ExpressionTechnoRuntime(rate,c,this.rotation.seed);
    const add=runtime.add.bind(runtime);runtime.add=(event,tempo)=>{runtime.onsetBeat=this.nextStepBeat;add(event,tempo);};
    if(kind==='bassmusic')this.bassProduction=runtime;else this.technoProduction=runtime;
  };
  electronic.configureInstruments();return source;
}

// Isolate the harmonic foreground at the mix input, leaving the score, all
// identities, drum-triggered pumping and the original clock running normally.
export function setExpressionContext(source,kind,context='mix'){
  if(context==='mix')return;
  const e=source.electronic,rt=e.bassProduction??e.technoProduction,process=rt.mix.process.bind(rt.mix);
  if(kind==='bassmusic')rt.mix.process=(l,r,sub,ul,ur,dl,dr,sl,sr,room,p,scene,frame)=>{
    process(l,r,0,0,0,0,0,sl,sr,0,context==='dry'?{...p,space:0}:p,scene,frame);
  };
  else rt.mix.process=(l,r,bass,dl,dr,kick,sl,sr,p,scene,frame,beats)=>{
    process(l,r,0,0,0,0,sl,sr,context==='dry'?{...p,space:0}:p,scene,frame,beats);
  };
}
