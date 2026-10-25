export const EXPRESSION_SELECTIONS=Object.freeze([
  {kind:'techno',id:7,label:'Glass ascent',tempo:124,style:'Melodic techno',start:48,bars:56,
    direction:'Connected analog phrases',description:'Selected notes connect; held tones develop pressure and delayed vibrato. Phrase starts retain their attacks.',
    jumps:[['Main phrase',0],['Suspension',16],['Rebuild',32],['Return',48]]},
  {kind:'bassmusic',id:1,label:'Liquid skyline',tempo:170,style:'Liquid DnB',start:16,bars:64,
    direction:'Keys with phrase shape',description:'Keys keep their strike, inner notes ease back, glass replies taper and the pad leaves more room.',
    jumps:[['Theme',0],['Development',8],['Rolling groove',16],['Breakdown approach',40],['Breakdown',48]]},
  {kind:'techno',id:3,label:'Orbit hypnosis',tempo:130,style:'Hypnotic techno',start:48,bars:32,
    direction:'Accents around the cycle',description:'Short pulses keep the 15-step clock, with cycle accents, varied decay and breathing filter pressure.',
    jumps:[['Cycle',0],['Developing',8],['Later phrase',16],['Phrase ending',24]]},
  {kind:'bassmusic',id:31,label:'Rooftop shuffle',tempo:134,style:'UK garage',start:16,bars:32,
    direction:'Crisp strong and weak replies',description:'Short stabs and keys gain strong/weak shading and restrained ending echoes. Swing and written rests stay.',
    jumps:[['Theme',0],['Groove',8],['Response',16],['Groove return',24]]},
  {kind:'techno',id:1,label:'Dub chambers',tempo:112,style:'Dub techno',start:48,bars:32,
    direction:'Chord pressure and filtered echoes',description:'Chord attacks stay defined while decay, colour and existing phrase-ending throws develop.',
    jumps:[['Chord conversation',0],['First ending',12],['Next phrase',16],['Second ending',28]]},
].map(Object.freeze));
export const expressionSelection=(kind,id)=>EXPRESSION_SELECTIONS.find(p=>p.kind===kind&&p.id===id);
