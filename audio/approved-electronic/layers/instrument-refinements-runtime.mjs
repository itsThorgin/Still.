import {SoundGenerator} from '../foundation/audio/synth.mjs';
import {createCollectionSource,CollectionForeground} from './collection-expression-runtime.mjs';
import {RefinementBassRuntime} from './instrument-refinements-bass-runtime.mjs';
import {RefinementTechnoRuntime} from './instrument-refinements-techno-runtime.mjs';
import {RefinementForeground} from './instrument-refinements-voices.mjs';
import {refinementEvents,refinementCues} from './instrument-refinements-plan.mjs';
import {selectedRefinement,highPercussion} from './instrument-refinements-config.mjs';
export function createRefinementSource(rate,kind,params,version='revised',seed=42,context='mix'){
 const p=context==='dry'?{...params,space:0}:params,source=new SoundGenerator(rate,kind,p,seed),e=source.electronic;
 if(!e||!selectedRefinement(kind,e.plan.character.value))return createCollectionSource(rate,kind,params,'revised',seed,context);
 const selection=selectedRefinement(kind,e.plan.character.value),revised=version==='revised';
 if(version==='app')return source;
 const configure=e.configureInstruments.bind(e);
 e.configureInstruments=function(){
  configure();const plan=this.plan,c=plan.character,id=c.value;
  if(!selectedRefinement(kind,id))return;
  const rt=kind==='bassmusic'?new RefinementBassRuntime(rate,c,this.rotation.seed):new RefinementTechnoRuntime(rate,c,this.rotation.seed);
  if(kind==='bassmusic')rt.useDevelopment=id===33;
  else{
   rt.machine=![4,15,38].includes(id);
   if(!rt.machine||revised&&[12,20].includes(id)){
    rt.foreground=revised?new RefinementForeground(rate,c,this.rotation.seed):new CollectionForeground(rate,c,this.rotation.seed);
    if(revised)rt.foreground.glide=1-Math.exp(-1/(rate*(id===20?.095:id===15?.12:.105)));
   }
  }
  const original=plan.refinementOriginal??plan.events.bind(plan);plan.refinementOriginal=original;
  plan.events=(step,...args)=>{
   const events=original(step,...args);
   if(rt.foreground)for(const cue of refinementCues(plan,step,events,revised))rt.foreground.add(cue,this.settings.tempo);
   let result=refinementEvents(plan,kind,step,events,revised);
   if(context!=='mix')result=result.map(v=>{
    if(selection.affected==='bass')return v.role==='bass'?v:{...v,amplitude:0};
    if(v.role==='bass'||v.drum&&!highPercussion(id,v.drum))return {...v,amplitude:0};
    if(selection.affected==='music'&&v.drum)return {...v,amplitude:0};return v;
   });
   return result;
  };
  const add=rt.add.bind(rt);rt.add=(event,tempo)=>{rt.onsetBeat=this.nextStepBeat;if(event.developmentOmit){rt.serial++;return;}add(event,tempo);};
  if(kind==='bassmusic')this.bassProduction=rt;else this.technoProduction=rt;
 };
 e.configureInstruments();
 return source;
}
