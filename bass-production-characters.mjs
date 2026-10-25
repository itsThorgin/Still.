// Production behaviours, never reference-track notes, samples or arrangements.
const minor=[0,2,3,5,7,8,10],dorian=[0,2,3,5,7,9,10];
const families={
  dancefloor:{genre:'Dancefloor DnB',bpm:[170,178],sound:'reese',response:'scan',groove:'two-step',drop:'euphoric',form:'anthem',harmony:'extended',hold:2,melody:.85,sub:.78,drive:1.7,cutoff:3400,swing:.018,duck:.78,recovery:.16,space:.38},
  jumpup:{genre:'Jump-up DnB',bpm:[170,178],sound:'rubber',response:'talk',groove:'jump',drop:'hook',form:'pressure',harmony:'pedal',hold:4,melody:.22,sub:.86,drive:2.2,cutoff:2600,swing:.024,duck:.82,recovery:.12,space:.16},
  neuro:{genre:'Neurofunk / techstep',bpm:[172,180],sound:'fm',response:'scan',groove:'machine',drop:'spectral',form:'pressure',harmony:'tension',hold:4,melody:.16,sub:.83,drive:2.4,cutoff:3900,swing:.008,duck:.85,recovery:.13,space:.16},
  liquid:{genre:'Liquid DnB',bpm:[166,174],sound:'warm',response:'reese',groove:'fluid',drop:'flow',form:'flow',harmony:'extended',hold:2,melody:.85,sub:.91,drive:1.1,cutoff:1500,swing:.032,duck:.65,recovery:.12,space:.58},
  jungle:{genre:'Jungle / breaks',bpm:[160,174],sound:'pulse',response:'warm',groove:'chopped',drop:'break-switch',form:'flow',harmony:'dub',hold:4,melody:.38,sub:.9,drive:1.5,cutoff:1700,swing:.042,duck:.68,recovery:.1,space:.38},
  atmospheric:{genre:'Atmospheric DnB',bpm:[158,168],sound:'warm',response:'pulse',groove:'floating',drop:'flow',form:'drift',harmony:'jazz',hold:4,melody:.65,sub:.95,drive:.9,cutoff:1000,swing:.025,duck:.55,recovery:.11,space:.78},
  deep:{genre:'Deep / minimal dubstep',bpm:[132,144],sound:'sub',response:'wobble',groove:'half-space',drop:'minimal',form:'dub',harmony:'modal',hold:4,melody:.18,sub:1,drive:1.4,cutoff:1400,swing:.038,duck:.8,recovery:.18,space:.5},
  heavy:{genre:'Heavy dubstep',bpm:[138,150],sound:'talk',response:'fm',groove:'half-impact',drop:'silence',form:'pressure',harmony:'tension',hold:4,melody:.26,sub:.87,drive:2.5,cutoff:4200,swing:.01,duck:.88,recovery:.21,space:.2},
  melodic:{genre:'Melodic dubstep',bpm:[136,150],sound:'reese',response:'warm',groove:'half-melodic',drop:'euphoric',form:'anthem',harmony:'extended',hold:2,melody:1,sub:.86,drive:1.7,cutoff:2900,swing:.018,duck:.78,recovery:.22,space:.7},
  garage:{genre:'UK garage / 2-step',bpm:[130,138],sound:'rubber',response:'organ',groove:'shuffle',drop:'groove',form:'garage',harmony:'soul',hold:2,melody:.6,sub:.92,drive:1.5,cutoff:2100,swing:.15,duck:.78,recovery:.14,space:.32},
};
// Each pair is a composed call and response in sixteenths: [start,scale degree,gate in sixteenths].
const rows=[
  [1,'liquid','Warm skyline',[[0,0,5],[6,2,3],[10,4,5]],[[0,0,7],[9,-1,5]],.22],
  [2,'jungle','Raw canopy',[[1,0,4],[7,4,2],[11,0,3]],[[0,0,5],[6,0,2],[14,-1,1]],.45],
  [3,'deep','Submerged and spacious',[[0,0,9],[12,0,2]],[[3,0,7]],.1],
  [4,'liquid','Rain on glass',[[0,0,6],[7,2,4],[13,4,2]],[[0,0,8],[10,-1,4]],.34],
  [5,'atmospheric','Moss and starlight',[[3,0,11]],[[0,0,6],[10,4,5]],.16],
  [6,'deep','Confined pressure',[[0,0,6],[11,1,3]],[[3,0,8]],.3],
  [7,'neuro','Mechanical freight',[[0,0,2],[3,0,2],[8,-1,2],[11,0,3]],[[0,0,3],[6,1,2],[10,0,4]],.4],
  [8,'liquid','Soulful amber',[[0,0,5],[6,2,3],[10,4,5]],[[1,0,5],[7,3,4],[13,0,2]],.51],
  [9,'jungle','Ragga relay',[[0,0,3],[5,4,2],[10,0,3]],[[3,0,2],[8,2,3],[13,-1,2]],.62],
  [10,'heavy','Swirling undertow',[[0,0,5],[7,0,2],[12,-1,3]],[[1,0,3],[6,1,2],[11,0,4]],.55],
  [11,'atmospheric','Distant and open',[[2,0,11]],[[0,0,6],[10,2,5]],.38],
  [12,'neuro','Copper circuitry',[[0,0,1],[3,1,2],[7,0,1],[10,-1,3],[14,0,1]],[[0,0,3],[5,3,2],[9,0,2],[13,1,2]],.77],
  [13,'deep','Minimal orbit',[[0,0,11]],[[6,0,7]],.02],
  [14,'jungle','Bright breakwater',[[0,0,4],[5,2,3],[10,0,3]],[[0,0,5],[8,4,4],[14,-1,1]],.72],
  [15,'melodic','Tidal memory',[[0,0,7],[10,4,4]],[[2,0,5],[9,2,6]],.28],
  [16,'liquid','Deep slate roll',[[0,0,5],[6,0,4],[11,4,4]],[[0,0,7],[9,-1,6]],.12],
  [17,'jungle','Dub roots',[[1,0,3],[7,4,2],[11,0,4]],[[0,0,5],[6,0,2],[14,-1,1]],.24],
  [18,'deep','Patient pressure',[[0,0,11]],[[3,0,7],[13,1,2]],.18],
  [19,'jumpup','Dry carbon bounce',[[0,0,2],[5,0,2],[10,2,2],[14,0,1]],[[2,0,3],[9,0,5]],.43],
  [20,'atmospheric','Peat lantern haze',[[2,0,12]],[[0,0,6],[10,4,5]],.58],
  [21,'neuro','Cobalt teeth',[[0,0,2],[3,1,1],[8,0,2],[11,-1,2]],[[0,0,3],[6,0,1],[10,3,3],[14,0,1]],.61],
  [22,'liquid','Low saffron soul',[[0,0,5],[6,2,3],[10,4,5]],[[0,0,6],[8,-1,7]],.75],
  [23,'heavy','Slow piston',[[0,0,6],[11,0,3]],[[4,-1,7],[13,0,2]],.19],
  [24,'jungle','Hollow percussion',[[0,0,3],[5,4,2],[10,0,3]],[[3,0,3],[8,2,2],[14,-1,1]],.85],
  [25,'deep','Talking reservoir',[[2,0,7],[13,-1,2]],[[0,0,9]],.64],
  [26,'jumpup','Dub gravel',[[0,0,3],[6,4,2],[10,0,4]],[[0,0,4],[7,0,3],[13,-1,2]],.13],
  [27,'jungle','Cedar lattice',[[1,0,4],[7,2,2],[12,0,3]],[[0,0,6],[10,-1,4]],.91],
  [28,'neuro','Graphite tension',[[0,0,2],[5,1,1],[9,0,2],[13,-1,2]],[[0,0,4],[6,3,2],[11,0,3]],.96],
  [29,'deep','Tribal copper',[[0,0,6],[11,4,3]],[[3,0,8]],.86],
  [30,'melodic','Noctilucent breathing',[[0,0,12]],[[4,0,10]],.08],
  [31,'garage','Playful rooftop',[[1,0,2],[6,0,2],[10,4,2],[14,-1,1]],[[0,0,3],[7,2,2],[11,0,3]],.26],
  [32,'garage','Velvet 2-step',[[0,0,3],[7,2,2],[11,4,3]],[[2,0,3],[6,4,2],[13,-1,2]],.59],
  [33,'garage','Speed garage pressure',[[2,0,2],[6,0,2],[10,4,2],[14,0,1]],[[1,0,3],[7,-1,2],[12,0,3]],.8],
  [34,'garage','Northern bassline',[[0,0,2],[5,4,2],[9,0,2],[14,1,1]],[[2,0,2],[7,0,2],[11,-1,3]],.93],
  [35,'dancefloor','Orbital euphoria',[[0,0,3],[4,0,2],[7,4,3],[12,0,3]],[[0,0,5],[6,2,3],[11,4,4]],.2],
  [36,'dancefloor','Radiant momentum',[[0,0,4],[6,4,3],[10,0,2],[14,2,1]],[[0,0,3],[5,2,2],[9,0,3],[13,-1,2]],.39],
  [37,'dancefloor','Prismatic lift',[[0,0,6],[7,4,3],[12,2,3]],[[1,0,3],[6,0,3],[11,4,4]],.56],
  [38,'dancefloor','Electric rush',[[0,0,2],[3,0,2],[6,4,3],[10,0,3],[14,-1,1]],[[0,0,4],[6,2,2],[11,0,4]],.71],
  [39,'dancefloor','Cinematic horizon',[[0,0,7],[9,4,5]],[[0,0,5],[6,2,4],[12,0,3]],.87],
  [40,'dancefloor','Golden acceleration',[[0,0,3],[5,4,3],[9,2,3],[13,0,2]],[[0,0,5],[7,-1,3],[12,0,3]],.98],
  [41,'jumpup','Brass knuckle bounce',[[0,0,2],[5,0,1],[8,4,2],[13,0,1]],[[1,0,2],[6,-1,2],[11,0,3]],.68],
  [42,'jumpup','Rubber alley',[[0,0,2],[6,1,2],[10,0,2],[15,-1,1]],[[2,0,3],[7,4,2],[12,0,2]],.89],
  [43,'neuro','Spectral foundry',[[0,0,3],[4,1,1],[7,0,2],[11,-1,3]],[[0,0,2],[5,3,2],[9,0,1],[13,1,2]],.83],
  [44,'heavy','Fractured monolith',[[0,0,4],[6,0,2],[11,-1,3]],[[0,0,2],[4,1,2],[10,0,4]],.92],
  [45,'melodic','Aurora release',[[0,0,6],[7,2,3],[12,4,3]],[[0,0,8],[10,-1,5]],.76],
];
const labels=['Rooftop shuffle','Velvet sidestep','Afterhours traction','Northern springs','Orbital flare','Radiant pursuit','Prism runner','Electric causeway','Horizon engine','Golden vector','Knuckle signal','Rubber alley','Spectral foundry','Fracture monolith','Aurora release'];
const genreNames={33:'Speed garage',34:'UK bassline',44:'Brostep',45:'Melodic dubstep'};
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const profiles=new Map(rows.map(([id,family,emotion,call,response,colour])=>[id,{
  ...families[family],family,emotion,call,response,colour,responseTimbre:families[family].response,
  motionRate:family==='deep'?[.125,.25,.5][id%3]:[.5,1,2][id%3],
  detune: .0025+colour*.006, fmRatio:[1,2,3,1.5][id%4],fmIndex:1+colour*2.8,
  kickHz:family==='deep'?49+colour*6:family==='garage'?57+colour*5:54+colour*7,
  snareHz:family==='deep'?168+colour*26:186+colour*55,
  snareTail:family==='jungle'?.105+colour*.035:family==='heavy'?.22:family==='liquid'?.15:.17,
  variant:id,trim:family==='atmospheric'?1.45:family==='deep'?1.35:1.5,
}]));

export function upgradeBassCharacter(c){
  const p=profiles.get(c.value);if(!p)throw Error(`Missing bass production profile ${c.value}`);
  // Keep saved IDs, names, starting tempos, existing themes and keys. Reinterpret writing through the new score.
  return freeze({...c,bassProduction:{...p,
    sound:c.value===25?'wobble':c.value===29?'sub':p.sound,
    groove:c.value===33||c.value===34?'four-shuffle':p.groove,
    arrangement:c.value===30?'drift':p.form,
    melodicInstrument:p.family==='garage'?'electric-keys':c.lead,
    kickPatterns:c.bassWriting?.kicks??c.kickPatterns,
    snarePatterns:c.bassWriting?.snares,
    description:`${p.emotion}. ${p.genre}; ${p.drop} transitions, composed bass calls and responses, and ${p.groove} drums.`,
  },description:`${c.description} Reworked with ${p.groove} drums, ${p.sound} bass, phrase responses and ${p.drop} transitions.`});
}
export const BASS_PRODUCTION_ADDITIONS=freeze(labels.map((label,i)=>{
  const id=i+31,p=profiles.get(id),melodic=['dancefloor','melodic','garage'].includes(p.family);
  const themes=[
    [0,2,4,6,4,2,1,0,3,4,7,6,2,1,4,0],
    [4,2,0,1,3,4,2,0,6,4,3,2,1,0,-1,0],
    [0,4,2,1,0,3,1,0,4,7,6,4,2,0,-1,0],
    [0,1,4,0,2,3,0,-1,4,2,0,1,6,4,1,0],
    [0,4,7,6,4,2,1,2,3,6,4,2,7,6,4,0],
    [2,4,6,7,4,3,2,0,4,6,9,7,6,3,2,0],
    [4,7,6,4,2,3,4,6,7,9,7,4,6,2,1,0],
    [0,2,4,2,7,6,4,3,1,4,6,7,4,2,-1,0],
    [0,3,6,4,2,0,4,7,6,4,3,2,1,4,2,0],
    [4,6,7,4,9,7,6,2,3,4,6,3,2,1,2,0],
    [0,0,4,1,0,-1,3,0,4,0,1,3,0,2,-1,0],
    [0,1,0,4,3,0,-1,0,2,4,1,0,3,1,0,0],
    [0,1,3,0,-1,1,4,0,3,1,0,4,1,-1,2,0],
    [0,4,1,0,-1,3,0,1,4,2,0,3,1,0,-1,0],
    [2,4,7,6,4,3,1,0,3,6,7,9,7,4,2,0],
  ];
  const progressions=[[0,3,5,1,0,2,3,6],[0,5,2,3,0,6,1,4],[0,0,3,6,0,5,3,4],[0,1,0,3,0,6,2,4],
    [0,5,3,6,0,3,5,4],[0,3,6,5,0,5,2,4],[0,2,5,3,0,6,3,4],[0,6,3,5,0,2,5,4],[0,5,2,6,0,3,1,4],[0,3,5,2,0,6,5,4],
    [0,0,1,0,3,0,6,0],[0,1,0,0,5,0,3,0],[0,0,1,0,0,3,0,6],[0,0,3,0,1,0,6,0],[0,5,3,2,0,6,5,4]];
  return upgradeBassCharacter({value:id,label,genre:genreNames[id]??p.genre,tempo:[134,132,136,138,174,172,176,174,170,176,174,176,176,144,142][i],
    tonic:[41,43,46],scale:p.family==='garage'?dorian:minor,
    progression:progressions[i],bridge:[3,5,0,6,3,1,4,0],
    theme:themes[i],answer:themes[(i+5)%15],rhythms:[[[0,6,11],[2,7,13],[0,5,10],[3,9,14]],[[1,7,12],[0,6,13],[2,9,14],[0,5,11]],[[0,5,12],[3,8,14],[1,6,10],[2,7,13]]][i%3],
    bassRhythms:[p.call.map(x=>x[0]),p.response.map(x=>x[0])],arp:[0,2,4,6],voicing:melodic?[[0,2,4,6],[0,2,6,8],[0,4,6,9],[0,2,5,8]][i%4]:[0,4],
    lead:p.family==='garage'?'electric-keys':p.family==='dancefloor'?'saw-lead':p.family==='melodic'?'glass-lead':'hollow-lead',
    reply:'bell-pluck',pad:melodic?'silk-pad':'dark-pad',pluck:p.family==='garage'?'dub-stab':'bell-pluck',bass:'deep-reese',
    kit:'liquid',groove:p.family==='garage'?'garage':['heavy','melodic'].includes(p.family)?'halftime':'liquid',form:['opening','theme','build','drop','response','break','return','closing'],
    description:p.emotion,
  });
}));
