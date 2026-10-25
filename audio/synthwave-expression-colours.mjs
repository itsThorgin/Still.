
const freeze=x=>Object.freeze(x);
const approved={
  16:{id:16,label:'Afterimage engine',direction:'Cinematic flow',description:'Connected saw phrases, delayed vibrato and a clearer lead above a more restrained string bed.',
    attack:.024,release:.18,filter:1.05,pressure:.22,spread:1.13,vibrato:1.12,connect:true,connectChance:.72,
    lead:1.06,pad:.88,arp:.95,padDuck:.14,early:.065,room:.84,decay:.86,delay:.90},
  19:{id:19,label:'Lowbeam signal',direction:'Close analog',description:'A more intimate pulse lead with gentle pitch connections, rounded pressure and shorter ambience.',
    attack:.034,release:.18,filter:.97,pressure:.17,spread:.92,vibrato:.83,connect:true,connectChance:.70,
    lead:1.05,pad:.92,arp:.94,padDuck:.12,early:.035,room:.85,decay:.87,delay:.88},
  22:{id:22,label:'Sunroom tape',direction:'Warm glass',description:'Shaped tines and soft pluck tails, a slowly moving chord bed and more room around the melody.',
    attack:.008,release:.23,filter:1.04,pressure:.12,spread:1.07,vibrato:.55,connect:false,connectChance:0,
    lead:1.06,pad:.89,arp:.93,padDuck:.12,early:.055,room:.93,decay:.92,delay:.90},
  28:{id:28,label:'Golden exit',direction:'Singing brass',description:'A breath-shaped brass lead with selective connections and a broad supporting string texture.',
    attack:.031,release:.16,filter:1.09,pressure:.23,spread:1.11,vibrato:1.18,connect:true,connectChance:.58,
    lead:1.05,pad:.91,arp:.96,padDuck:.13,early:.060,room:.91,decay:.88,delay:.92},
  34:{id:34,label:'Red circuit',direction:'Sculpted darksynth',description:'Firm brass accents, controlled metallic replies and drier, clearer separation above the original bass drive.',
    attack:.019,release:.085,filter:1.08,pressure:.16,spread:.96,vibrato:.72,connect:true,connectChance:.34,
    lead:1.04,pad:.88,arp:.93,padDuck:.10,early:.025,room:.72,decay:.80,delay:.83},
};
const colours={};
function extend(id,base,overrides={}){
  const {label,description,...settings}=approved[base];
  colours[id]=freeze({...settings,id,...overrides});
}
for(let id=16;id<=45;id++){
  const group=Math.floor((id-16)/3);
  if(group===0)extend(id,16);
  else if(group===1)extend(id,19);
  else if(group===2)extend(id,22);
  else if(group===3)extend(id,19,{direction:'Spare cinematic pulse',pressure:.14,release:.17,lead:1.04,pad:.90,connectChance:.60});
  else if(group===4)extend(id,28);
  else if(group===5)extend(id,28,{direction:'Driving melodic anthem',attack:.025,release:.145,spread:1.12,lead:1.06,connectChance:.56});
  else if(group===6)extend(id,34,{glide:.020});
  else if(group===7)extend(id,19,{direction:'Cinematic synth noir',pressure:.20,release:.20,spread:1.10,room:.90});
  else if(group===8)extend(id,34,{direction:'Crisp cyberpunk pulse',attack:.013,release:.075,glide:.020,connectChance:.25,room:.70,delay:.85});
  else extend(id,19,{direction:'Romantic night drive',attack:.036,release:.21,spread:1.12,vibrato:1.15,connectChance:.74,pad:.90,room:.90,decay:.92,delay:.93});
}

for(const [id,c] of Object.entries(approved))colours[id]=freeze(c);
const legacy=[
  [16,{direction:'Deep cinematic drive'}],
  [19,{direction:'Shadowed darkwave',attack:.040,filter:.91,pressure:.15,spread:.90}],
  [28,{direction:'Glassy retrowave',release:.20,connectChance:.48}],
  [28,{direction:'Motor brass outrun',attack:.023,release:.13,connectChance:.48}],
  [22,{direction:'Dreamwave droplets',release:.22,pad:.92,room:.95}],
  [34,{direction:'Low darksynth calls',attack:.025,release:.12,filter:.94,connectChance:.38}],
  [22,{direction:'Orbital glass',release:.24,spread:1.14,pad:.91,room:.96}],
  [19,{direction:'Mechanical darkwave',attack:.018,release:.12,connectChance:.35,room:.79}],
  [22,{direction:'Coastal keys',attack:.010,release:.22,room:.96,pad:.93}],
  [34,{direction:'Fast outrun pursuit',attack:.017,release:.09,connectChance:.38,filter:1.06}],
  [19,{direction:'Intimate synth noir',attack:.040,release:.21,filter:.94,pad:.93}],
  [22,{direction:'Cold glass signal',attack:.007,release:.16,room:.81,pressure:.10}],
  [28,{direction:'Warm retrowave brass',attack:.035,release:.18,filter:1.04}],
  [22,{direction:'Dreamwave piano lights',release:.23,room:.95,pad:.92}],
  [16,{direction:'Cinematic singing lead',attack:.031,release:.21,room:.92,pad:.90}],
];
legacy.forEach(([base,overrides],i)=>extend(i+1,base,overrides));
export const SYNTHWAVE_EXPRESSION_COLOURS=freeze(colours);
export const synthwaveExpressionColour=id=>SYNTHWAVE_EXPRESSION_COLOURS[id]??null;
