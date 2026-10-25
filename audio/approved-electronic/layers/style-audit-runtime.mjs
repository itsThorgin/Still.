import {createRebuildSource} from './six-character-rebuild-runtime.mjs';
import {auditSelection} from './style-audit-catalog.mjs';
import {auditEvents,authoredAuditCues} from './style-audit-plan.mjs';
import {AuditUpperBank,AuditBassColour} from './style-audit-voices.mjs';
export function createAuditSource(rate,kind,params,version='candidate',seed=42){
  const p=auditSelection(kind,params.style),source=createRebuildSource(rate,kind,params,'rebuild',seed,'mix');
  if(!p||version==='latest'||p.action==='keep')return source;
  const e=source.electronic,rt=e.bassProduction??e.technoProduction,plan=e.plan,c=plan.character,
    upper=new AuditUpperBank(rate,p,c,seed),hadForeground=!!rt.foreground;
  rt.auditUpper=upper;if(hadForeground)rt.foreground=upper;
  if(kind==='bassmusic'&&p.action==='substantial')rt.auditBass=new AuditBassColour(rate,p,seed);
  const events=plan.events.bind(plan);plan.events=(step,...args)=>{
    upper.step=step;rt.auditStep=step;
    const result=auditEvents(plan,p,step,events(step,...args));
    for(const cue of authoredAuditCues(plan,p,step))upper.add(cue,e.settings.tempo);
    return result;
  };
  const add=rt.add.bind(rt);rt.add=(event,tempo)=>{
    if(event.amplitude<=0){rt.serial++;return;}
    if(!event.drum&&event.role!=='bass'){
      rt.serial++;
      if(!hadForeground&&!event.developmentOmit&&!event.phraseOmit)upper.add(event,tempo);
      return;
    }
    const previous=rt.voices.length;add(event,tempo);
    if(event.role==='bass'&&rt.auditBass)rt.auditBass.add(event,tempo);
    if(event.role==='bass'&&p.focus==='acid'){
      const v=rt.activeAcid??rt.voices.at(-1);
      if(v){const phase=Math.floor((rt.auditStep??0)/plan.p.bass.length)%8,
        lift=event.accent?1.10:phase>=4?1.03:.91;
        v.config={...v.config,cutoff:plan.p.bass.cutoff*lift,env:plan.p.bass.env*(event.accent?1.08:.93)};
        if(rt.voices.length>previous)v.envRate=Math.exp(-1/(v.fs*(event.accent?.17:.125)));
      }
    }
  };
  const process=rt.mix.process.bind(rt.mix);
  rt.mix.process=(...a)=>{
    const params=a[kind==='bassmusic'?10:8],frame=a[kind==='bassmusic'?12:10],
      beats=kind==='bassmusic'?e.beats:a[11],scene=a[kind==='bassmusic'?11:9];
    if(!hadForeground){
      upper.sample(params,frame,beats,scene,rt.mix.kickEnvelope);a[0]+=upper.left;a[1]+=upper.right;
      a[kind==='bassmusic'?7:6]+=upper.sendL;a[kind==='bassmusic'?8:7]+=upper.sendR;
    }
    if(rt.auditBass){rt.auditBass.sample(params,frame,beats);a[3]=a[3]*.20+rt.auditBass.left*.80;a[4]=a[4]*.20+rt.auditBass.right*.80;}
    process(...a);
  };
  Object.defineProperty(rt,'voiceCount',{configurable:true,get(){return this.voices.length+upper.voices.length+(this.auditBass?.voices.length??0);}});
  source.audit={selection:p,upper,bass:rt.auditBass??null,hadForeground};return source;
}
