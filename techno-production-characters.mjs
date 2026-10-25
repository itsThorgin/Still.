// Original performance scores; no reference melodies, recordings or sampled loops.
// Note pitches below are scale degrees. Tick positions are sixteenths.
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const lane=(drum,length,ticks,level,extra={})=>({drum,length,ticks,level,velocity:[1,.72,.88,.64],pan:0,...extra});
const FAMILIES={
  dub:{genre:'Dub techno',machine:'808 / filtered analog',kick:[48,102,.025,.24,1.15,.12],rumble:0, bassWave:'sine',bassCutoff:280,resonance:.3,
    lanes:[lane('open-hat',16,[6,14],.10,{pan:.15}),lane('rim',32,[12,28],.12,{pan:-.12})],
    wave:'saw',cutoff:1100,env:1200,drive:1.3,delay:.75,feedback:.65,send:.72,room:.48,decay:4.8,hold:32,form:'tide',swing:.018},
  minimal:{genre:'Minimal techno',machine:'909 / dry micro percussion',kick:[53,118,.018,.15,1.3,.18],rumble:0,bassWave:'pulse',bassCutoff:650,resonance:.35,
    lanes:[lane('hat',16,[2,7,10,14],.10,{pan:.12}),lane('rim',16,[4,12],.15,{pan:-.16}),lane('click',7,[1,5],.06,{probability:.78})],
    wave:'pulse',cutoff:1500,env:1800,drive:1.1,delay:.5,feedback:.28,send:.14,room:.08,decay:.65,hold:32,form:'micro',swing:0},
  acid:{genre:'Acid techno',machine:'909 / accented 303',kick:[50,146,.018,.23,1.8,.24],rumble:0,bassWave:'saw',bassCutoff:420,resonance:.82,
    lanes:[lane('hat',16,[0,3,8,11],.11,{pan:-.12}),lane('open-hat',16,[2,6,10,14],.16,{pan:.15}),lane('clap',16,[4,12],.17)],
    wave:'acid',cutoff:780,env:4200,drive:2,delay:.75,feedback:.40,send:.22,room:.12,decay:1.1,hold:64,form:'acid',swing:0},
  hypnotic:{genre:'Hypnotic / deep techno',machine:'909 / cyclic percussion',kick:[47,122,.021,.27,1.45,.15],rumble:.12,bassWave:'triangle',bassCutoff:460,resonance:.58,
    lanes:[lane('hat',16,[2,6,10,14],.13,{pan:.12}),lane('tom',5,[0,3],.12,{tuning:.85,pan:-.2}),lane('shaker',7,[1,4,6],.08,{pan:.3,probability:.88})],
    wave:'saw',cutoff:1200,env:1900,drive:1.4,delay:.75,feedback:.48,send:.30,room:.32,decay:2.8,hold:64,form:'orbit',swing:0},
  detroit:{genre:'Detroit / classic techno',machine:'909 / machine funk',kick:[52,142,.018,.22,1.6,.24],rumble:0,bassWave:'pulse',bassCutoff:1150,resonance:.48,
    lanes:[lane('hat',16,[0,2,6,8,10,14],.12,{pan:-.18}),lane('clap',16,[4,12],.18),lane('open-hat',16,[6,14],.14,{pan:.16}),lane('conga',16,[3,11,15],.10,{pan:.24})],
    wave:'pulse',cutoff:2800,env:2600,drive:1.4,delay:.5,feedback:.34,send:.25,room:.23,decay:1.7,hold:8,form:'funk',swing:.022},
  raw:{genre:'Raw / warehouse techno',machine:'909 / parallel drive',kick:[48,155,.016,.28,2.7,.28],rumble:.27,bassWave:'saw',bassCutoff:720,resonance:.45,
    lanes:[lane('hat',16,[2,6,10,14],.16,{pan:.12}),lane('clap',16,[4,12],.19),lane('metal',7,[0,4],.12,{pan:-.18,tuning:.72})],
    wave:'fm',cutoff:2200,env:1600,drive:2.3,delay:.375,feedback:.29,send:.15,room:.19,decay:1.6,hold:64,form:'warehouse',swing:0},
  industrial:{genre:'Industrial techno',machine:'driven 909 / FM metal',kick:[45,170,.014,.30,3.4,.25],rumble:.30,bassWave:'pulse',bassCutoff:580,resonance:.6,
    lanes:[lane('hat',16,[2,6,10,14],.14,{pan:.15}),lane('snare',16,[4,12],.18),lane('metal',7,[0,2,5],.17,{pan:-.27,tuning:.61}),lane('noise',32,[15,27],.07,{pan:.25,probability:.85})],
    wave:'fm',cutoff:2800,env:2100,drive:2.8,delay:.375,feedback:.38,send:.20,room:.22,decay:1.5,hold:64,form:'machine',swing:0},
  hard:{genre:'Hard / rave techno',machine:'909 / hard parallel clip',kick:[46,186,.014,.29,3.8,.30],rumble:.32,bassWave:'saw',bassCutoff:680,resonance:.62,
    lanes:[lane('hat',16,[0,3,8,11],.12,{pan:-.14}),lane('open-hat',16,[2,6,10,14],.19,{pan:.14}),lane('clap',16,[4,12],.21),lane('ride',16,[2,6,10,14],.10,{pan:.25,detail:true})],
    wave:'pulse',cutoff:2300,env:2400,drive:2.8,delay:.5,feedback:.30,send:.16,room:.16,decay:1.2,hold:64,form:'pressure',swing:0},
  driving:{genre:'Peak-time / driving techno',machine:'909 / rolling low tom',kick:[48,160,.017,.26,2.5,.28],rumble:.28,bassWave:'triangle',bassCutoff:750,resonance:.55,
    lanes:[lane('open-hat',16,[2,6,10,14],.17,{pan:.14}),lane('clap',16,[4,12],.19),lane('tom',16,[3,7,11,15],.12,{pan:-.12,tuning:.72}),lane('ride',32,[18,22,26,30],.08,{detail:true,pan:.2})],
    wave:'saw',cutoff:1700,env:2400,drive:1.9,delay:.75,feedback:.35,send:.22,room:.22,decay:1.7,hold:32,form:'pressure',swing:0},
  melodic:{genre:'Melodic techno',machine:'909 / rounded analog',kick:[49,134,.022,.24,1.6,.18],rumble:.08,bassWave:'triangle',bassCutoff:850,resonance:.55,
    lanes:[lane('hat',16,[0,3,8,11],.09,{pan:-.18}),lane('open-hat',16,[6,14],.14,{pan:.16}),lane('clap',16,[4,12],.16)],
    wave:'saw',cutoff:2400,env:3200,drive:1.7,delay:.75,feedback:.46,send:.34,room:.35,decay:3.6,hold:8,form:'story',swing:0},
  ambient:{genre:'Ambient / atmospheric techno',machine:'808 / distant percussion',kick:[46,82,.034,.29,1.1,.08],rumble:0,bassWave:'sine',bassCutoff:240,resonance:.28,
    lanes:[lane('hat',32,[6,22,30],.07,{pan:.24}),lane('tom',20,[3,14],.08,{tuning:.67,pan:-.2})],
    wave:'triangle',cutoff:1600,env:750,drive:1.15,delay:1.5,feedback:.66,send:.60,room:.65,decay:6,hold:32,form:'cloud',swing:0},
  tribal:{genre:'Tribal / percussive techno',machine:'909 / tuned hand drums',kick:[53,123,.020,.21,1.6,.20],rumble:.05,bassWave:'sine',bassCutoff:420,resonance:.35,
    lanes:[lane('conga',16,[1,6,10,15],.19,{pan:-.22,tuning:.9}),lane('tom',12,[3,8],.16,{pan:.23,tuning:.8}),lane('rim',16,[4,12],.12),lane('shaker',16,[2,5,10,13],.10,{pan:.32})],
    wave:'fm',cutoff:1300,env:1300,drive:1.4,delay:.375,feedback:.32,send:.20,room:.20,decay:1.3,hold:32,form:'ritual',swing:.014},
};
// family, atmosphere, original cyclic motif, motif tick positions, bass tick positions,
// kick tuning, motif length, harmony roots, chord-stab positions, character options.
const SCORES=[
  ['dub','Warm, submerged minor echoes',[0,4,2,0],[3,11],[2,10],48,32,[0,0,5,0],[5,21],{voicing:[0,2,4,8],delay: .75}],
  ['minimal','Dry, precise and spacious',[0,0,1,0],[1,10],[3,11,14],54,16,[0],[11],{gate:.22,cutoff:1800}],
  ['hypnotic','Orbital and quietly tense',[0,1,4,1,0],[0,3,6,9,12],[2,6,10,14],47,15,[0],[7],{poly:5,rotation:32}],
  ['detroit','Optimistic machine soul',[0,4,6,4,2,1],[0,6,10,14],[2,5,10,14],52,32,[0,3,5,1],[3,11],{voicing:[0,2,4,6],cutoff:3400}],
  ['acid','Coiled, resonant and psychedelic',[0,0,7,0,1,4,0,1],[7,15],[0,2,3,6,8,10,11,14],50,16,[0],[],{accent:[0,3,5],slides:[2,6],cutoff:540}],
  ['hypnotic','Velvet, deep and restrained',[0,4,0,2],[3,13],[2,10],46,24,[0,0,3,0],[9],{wave:'triangle',rumble:0,room:.43}],
  ['melodic','Luminous rising minor theme',[0,2,4,7,6,4,2,1],[0,3,6,10,14],[2,6,10,14],49,32,[0,5,3,6],[1,9],{gate:.85,voicing:[0,2,4,8]}],
  ['industrial','Blackened metal and pressure',[0,1,0,4],[1,5,11],[2,7,14],45,16,[0],[6],{poly:7,drive:3.1,noise:.012}],
  ['raw','Rough, direct warehouse pulse',[0,0,4,0,1],[3,7,13],[2,6,10,14],48,16,[0],[11],{drive:2.6,rumble:.25}],
  ['hard','Fast, physical, disciplined',[0,1,0,4],[1,7,11],[2,6,10,14],46,16,[0],[7],{drive:3.1,gate:.25}],
  ['tribal','Coiling drum conversation',[0,3,1],[3,11],[2,10],53,12,[0],[13],{poly:3,gate:.23}],
  ['driving','Dark rolling tunnel',[0,4,0,1],[1,7,13],[2,6,10,14],48,16,[0],[11],{rumble:.31,cutoff:2100}],
  ['raw','Displaced, angular machine funk',[0,4,1,0],[2,9,15],[3,9,14],51,16,[0,0,1,0],[6],{broken:[[0,3,8,14],[0,6,8,11]],rumble:.08}],
  ['ambient','Luminous suspended space',[0,4,6,2],[4,20],[2],46,48,[0,2,5,0],[10],{pad:true,voicing:[0,4,6,10],gate:2.8}],
  ['detroit','Elastic late-night swing',[0,2,4,1,3],[3,6,11,14],[2,5,10,13],51,32,[0,3,1,5],[7,15],{swing:.045,voicing:[0,2,6]}],
  ['dub','Hollow sub pockets and dusty chords',[0,0,4],[3],[2,11],47,32,[0,0,3,0],[5],{voicing:[0,2,6],cutoff:850,feedback:.7}],
  ['minimal','Wooden, clipped funk',[0,2,0,1],[1,7,13],[3,7,11,14],55,16,[0],[10],{swing:.03,wave:'pulse',poly:7}],
  ['hypnotic','Basalt and shifting accent spirals',[0,1,4,1,3],[1,6,11,16],[2,6,10,14],46,20,[0],[7],{poly:5,rotation:16,cutoff:1600}],
  ['raw','Broken electrical switches',[0,4,1,3,0],[2,7,13],[3,9,15],52,16,[0,0,3,0],[6,14],{broken:[[0,5,8,14],[0,3,10,12],[0,6,11]],rumble:.06}],
  ['tribal','Organic low hand-drum ritual',[0,3,0,4],[3,10],[2,10],52,24,[0,3,0,1],[13],{swing:.018,poly:5,cutoff:950}],
  ['industrial','Clipped hydraulic machinery',[0,0,1,4,0],[1,5,11],[2,5,10,13],44,12,[0],[6],{drive:3.2,poly:7,rumble:.32}],
  ['detroit','Warm ochre shuffle',[0,2,4,1,0,3],[3,10],[2,5,10,13],50,16,[0,3,1,0],[7,15],{swing:.06,voicing:[0,2,6],cutoff:2300}],
  ['dub','Slow oceanic drone tide',[0,4,0],[3,19],[2],45,48,[0,0,5,5],[9],{pad:true,feedback:.72,room:.58,voicing:[0,2,6,8]}],
  ['acid','Dark low acid lattice',[0,0,1,0,4,1],[5,13],[0,3,5,8,10,14],49,16,[0],[],{slides:[2,5],accent:[0,3],wave:'square',cutoff:400}],
  ['driving','Magnetic rolling low pressure',[0,4,0,2,3],[1,6,13],[2,6,9,14],47,16,[0,0,3,0],[3,11],{poly:5,rumble:.27}],
  ['minimal','Tiny dry sand-grain relays',[0,1,3,0],[1,11],[3,12],56,24,[0],[10],{swing:.018,gate:.16,poly:3,room:.04}],
  ['hard','Short obsidian semitone gates',[0,3,1,0],[1,9,15],[2,5,10,14],44,16,[0],[7],{rumble:.35,drive:3.4,cutoff:1600}],
  ['melodic','Warm floating harmonic ballast',[0,2,4,6,4,2,1,0],[3,11],[2,10],49,32,[0,2,5,3],[5,13],{wave:'triangle',voicing:[0,2,4,6],pad:true,gate:1.1}],
  ['tribal','Fractured interlocking drum rift',[0,3,4,0,2],[2,9],[2,8,14],52,12,[0],[11],{broken:[[0,6,8,12],[0,4,10,14]],poly:7}],
  ['ambient','Distant ash and slow air',[0,4,2,0,1],[3,23],[2],45,64,[0,5,3,0],[10],{pad:true,wave:'saw',cutoff:850,gate:3.4}],
  ['dub','Suspended chords behind warm tape',[0,4,2,0],[7,23],[2,12],49,64,[0,0,3,0],[3,19],{voicing:[0,3,4,6],delay:1.5,feedback:.69,cutoff:1300}],
  ['minimal','Austere rim and pulse dialogue',[0,0,4],[3,14],[3,10,15],57,16,[0],[9],{gate:.12,poly:5,cutoff:2300,room:.03}],
  ['acid','Liquid sawtooth ascent',[0,4,0,7,0,1,0,4],[15],[0,1,4,6,8,9,12,14],51,16,[0],[],{slides:[1,3,6],accent:[0,4,7],cutoff:630}],
  ['acid','Square-wave night pressure',[0,0,1,0,4,7,1],[7],[0,2,5,7,8,11,14],48,16,[0],[],{wave:'square',slides:[2,5],accent:[0,3,6],drive:2.6}],
  ['acid','Psychedelic three-bar acid braid',[0,1,4,0,7,0,1,0,4],[11],[0,3,5,8,10,12,14],50,48,[0],[],{slides:[1,4,6],accent:[0,2,5],cutoff:780,poly:7}],
  ['hypnotic','Aquatic seven-step shimmer',[0,4,1,0,3,1,0],[0,3,6],[2,10],47,7,[0],[13],{poly:7,wave:'triangle',room:.47,rotation:64}],
  ['hypnotic','Five against four mineral pulse',[0,1,0,4,3],[0,2,4],[2,6,10,14],48,5,[0],[9],{poly:3,rotation:32,cutoff:1900}],
  ['detroit','Futuristic copper machine soul',[0,4,6,7,4,2],[0,5,10,14],[2,5,10,15],53,32,[0,3,5,1],[3,11],{voicing:[0,2,4,8],cutoff:3300,gate:.55}],
  ['raw','Metal bells above dry concrete',[0,0,4,1,0],[0,3,6,9,12],[2,6,10,14],49,15,[0],[11],{poly:5,wave:'fm',rumble:.22,gate:.16}],
  ['industrial','Gated steel, controlled abrasion',[0,1,4,1],[1,6,13],[2,7,14],45,16,[0],[7],{drive:3.4,noise:.018,poly:5,room:.12}],
  ['industrial','Slow piston and dissonant forge',[0,1,0,3,4],[0,5,9],[2,10],43,20,[0],[6],{drive:2.9,poly:7,cutoff:1900,rumble:.35}],
  ['hard','Raw acidic rave propulsion',[0,0,7,1,0,4,1,0],[3,11],[0,2,3,6,8,10,11,14],47,16,[0],[],{acid:true,slides:[2,6],accent:[0,3,5],drive:3,cutoff:780}],
  ['hard','Relentless drums and short noise gates',[0,1,0],[1,7,13],[2,6,10,14],46,12,[0],[11],{snareRoll:true,drive:3.1,rumble:.28}],
  ['driving','Dark hovering signal, rolling floor',[0,1,0,4,0],[3,9,15],[2,6,10,14],48,16,[0],[7],{wave:'saw',pad:true,cutoff:1500,rumble:.30}],
  ['melodic','Expressive analog gravity',[0,4,7,6,4,3,1,0],[0,3,7,10,14],[2,6,10,14],50,32,[0,5,3,1],[1,9],{wave:'saw',gate:1.15,cutoff:3000,pad:true,voicing:[0,2,4,8]}],
];
const ADDITIONS=[
  ['Tape sanctuary',114],['Needle point',126],['Silver electrolyte',136],['Square tension',140],['Helix reactor',138],
  ['Aquifer seven',128],['Mineral pendulum',133],['Copper tomorrow',129],['Concrete bells',139],['Steel shutters',143],
  ['Furnace memory',137],['Rave filament',153],['Snare turbine',156],['Haunted carrier',140],['Gravity bloom',123],
];

export function technoProduction(id){
  const [family,mood,notes,ticks,bassTicks,fundamental,length,roots,stabs,o]=SCORES[id-1],f=FAMILIES[family];
  const acid=family==='acid'||o.acid,heavy=['hard','industrial','raw','driving'].includes(family);
  const [_,pitch,pitchTime,decay,kickDrive,click]=f.kick;
  // Pilot renders exposed a hollow upper spectrum in the raw/machine families.
  // Lift their transient layers, leaving dub/ambient deliberately dark.
  const transientLift=['raw','detroit'].includes(family)?1.65:['hypnotic','minimal','industrial'].includes(family)?1.25:1;
  const lanes=f.lanes.map(l=>({...l,level:l.level*(['hat','open-hat','ride','metal','snare','clap'].includes(l.drum)?transientLift:1)}));
  if(o.poly)lanes.push(lane(family==='industrial'?'metal':family==='tribal'?'conga':'rim',o.poly,[0,Math.floor(o.poly*.6)],family==='minimal'?.06:.085,{pan:-.3,rotateEvery:o.rotation??32,tuning:1.14}));
  if(o.snareRoll)lanes.push(lane('snare',16,[1,3,6,7,9,11,14,15],.085,{velocity:[.9,.4,.72,.5],detail:true,pan:-.12}));
  return freeze({version:1,family,genre:f.genre,mood,drumMachine:f.machine,
    kick:{type:family,fundamental,pitch,pitchTime,decay,drive:kickDrive,click,level:heavy?.43:family==='ambient'?.29:.37},
    rumble:{amount:o.rumble??f.rumble,cutoff:heavy?175:145,decay:heavy?.68:.48,duck:.96},
    groove:{kickRows:o.broken??[[0,4,8,12]],lanes,swing:o.swing??f.swing,humanize:['dub','tribal','detroit'].includes(family)?.002:0,accentLength:notes.length},
    bass:{wave:acid?(o.wave==='square'?'square':'saw'):f.bassWave,acid,length:acid?length:16,ticks:bassTicks,
      notes:acid?notes:family==='detroit'?[0,0,4,0,2,0]:[0,0,0,4],accents:o.accent??[0,3],slides:o.slides??[],gate:acid?.58:family==='dub'?1.3:family==='ambient'?2.4:heavy?.38:.65,
      cutoff:acid?(o.cutoff??f.cutoff):f.bassCutoff,resonance:acid?.83:f.resonance,env:acid?f.env:650,drive:acid?(o.drive??f.drive):1.25,level:acid?.20:heavy?.15:.22},
    motif:{wave:acid?'fm':o.wave??f.wave,length,ticks,notes,gate:o.gate??(family==='dub'?.34:family==='ambient'?2.8:.32),
      cutoff:o.cutoff??f.cutoff,env:f.env,resonance:family==='melodic'?.62:f.resonance,drive:o.drive??f.drive,
      level:acid?.026:family==='minimal'?.14:heavy?.16:family==='melodic'?.29:family==='ambient'?.13:.19,octave:family==='hard'?0:1},
    harmony:{roots,hold:f.hold,voicing:o.voicing??[0,2,4],stabs,length:family==='dub'?32:16,cutoff:family==='dub'?1500:family==='melodic'?2300:1700,
      decay:family==='dub'?.26:.48,level:family==='dub'?.30:family==='melodic'?.10:.055,pad:!!o.pad,
      padLevel:family==='ambient'?.055:family==='dub'?.04:.028},
    automation:{bars:[32,48,64][(id-1)%3],freeHz:.037+(id%5)*.006,depth:acid?.85:family==='minimal'?.23:.48,
      resonanceDepth:acid?.12:.06,noise:o.noise??(family==='dub'?.002:0),rotateEvery:o.rotation??64},
    effects:{delayBeats:o.delay??f.delay,feedback:o.feedback??f.feedback,send:f.send,room:o.room??f.room,decay:f.decay,damping:family==='dub'?2300:family==='industrial'?3200:4200},
    arrangement:{philosophy:f.form,bars:['tide','cloud','orbit'].includes(f.form)?256:192,intro:family==='ambient'?16:16,outro:16},
    mix:{gain:heavy?1.23:family==='ambient'?1.16:1.18,drive:heavy?1.35:1.08,duck:heavy?.86:family==='dub'?.48:.65,ceiling:.78,width:family==='minimal'?.55:1},
    constraints:{pitchMutation:family==='melodic'||family==='detroit'?1:0,probabilityFloor:.72,maxVoices:48,maxDrums:32},
    distinctive:`${mood}; ${length}-step motif, ${o.poly??16}-step percussion, ${f.form} development`});
}
export function upgradeTechnoCharacter(c){const p=technoProduction(c.value);return freeze({...c,genre:p.genre,
  description:`${p.mood}. ${p.distinctive}.`,technoProduction:p,tempoRange:[Math.max(90,c.tempo-5),Math.min(165,c.tempo+5)]});}
export const TECHNO_PRODUCTION_ADDITIONS=freeze(ADDITIONS.map(([label,tempo],i)=>upgradeTechnoCharacter({value:i+31,label,tempo,
  tonic:[40,43,45],scale:i===7?[0,2,3,5,7,9,10]:[0,2,3,5,7,8,10],kit:'techno-machine',
  progression:[0],theme:SCORES[i+30][2],rhythm:SCORES[i+30][3],bassTicks:SCORES[i+30][4],pattern:SCORES[i+30][8],
  hold:16,voicing:[0,2,4],order:[0,1,2,3,4,5,6,7],lead:'tech-reed',reply:'tech-dub',pad:'dark-pad',bass:'tech-sub'})));
