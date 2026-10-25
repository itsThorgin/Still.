// One motif, several musical roles. Changes happen at phrase boundaries;
// quieter answers and whole-bar rests let the low groove hold the foreground.
export const TECHNO_COLOURS=Object.freeze(['warm','hollow','dub','glass','air']);
const PHRASES=[
  'dub','dub','warm','hollow','dub','glass','warm','glass',
  'air','air','dub','hollow','warm','glass','warm','hollow',
  'dub','glass','warm','hollow','glass','warm','hollow','air',
  'dub','dub','hollow','glass','warm','hollow','dub','glass',
];
const SHAPES={
  warm:{gain:0.78,octave:-1,low:110,high:240,maxBeats:1.25,band:'body'},
  hollow:{gain:0.62,octave:-1,low:130,high:260,maxBeats:0.7,band:'body'},
  dub:{gain:0.72,octave:-1,low:110,high:220,maxBeats:0.42,band:'body'},
  glass:{gain:0.20,octave:0,low:260,high:520,maxBeats:0.24,band:'accent'},
  air:{gain:0.16,octave:0,low:190,high:380,maxBeats:0.9,band:'accent'},
};
export function technoLeadPart(style,bar,tick,variant=0) {
  const part=bar%128,local=part%8;
  let colour=PHRASES[Math.floor(part/4)];
  // Seeded variation affects selected answers, rather than shuffling the lead
  // randomly on each note. The main eight-bar theme returns in the same colours.
  if(variant%2&&colour==='glass'&&[20,68,108,124].includes(part-part%4))colour='hollow';
  if(style===14&&colour==='hollow')colour='air';
  if([1,6].includes(style)&&colour==='hollow')colour='dub';
  // Bright instruments make one small call in a four-bar phrase. The rest is
  // carried by the low motif, including the exposed breakdown, not a high solo.
  if(colour==='glass'&&part%4!==0)colour=local%2?'hollow':'warm';
  if(colour==='air'&&part%4!==3)colour=local%2?'dub':'warm';
  if(style===14&&colour==='hollow')colour='dub';
  if([1,6].includes(style)&&colour==='hollow')colour='dub';
  const shape=SHAPES[colour];
  const resting=[18,22,23,31,54,55,66,70,71,78,95,98,99,102,103,110,111,126].includes(part);
  // The chord and glass voices make a compact call, then leave the rest of the
  // bar to bass, percussion and existing echo. Air can sing through a breakdown.
  const sparse=(colour==='dub'&&tick>=8)||(shape.band==='accent'&&tick>3);
  return {...shape,colour,rest:resting||sparse};
}
