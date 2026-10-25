import { technoLeadRhythm } from './techno-groove.mjs';

// Original melodic phrases. Each row is an eight-bar call/answer and a contrasting
// four-bar idea; rhythms leave room for the accepted kick and bass instruments.
const WRITING=[
  {a:[[4,3],[0],[2,4],[3],[4,6],[4],[2,1],[0]],b:[[7,6],[4],[3,2],[0]],level:0.21,decay:0.65},
  {a:[[0,4,3],[0,2],[4,2],[0],[0,4,6],[4,3],[2,1],[0]],b:[[4,6],[7,4],[3,1],[0]],level:0.25,decay:0.32},
  {a:[[7,6,4],[3,4,6],[4,2],[0],[7,9,7],[6,4,3],[2,4],[0]],b:[[9,7,6],[4,6,7],[6,4],[3]],level:0.32,decay:0.6},
  {a:[[4,6,7],[4,3],[2,4,6],[4],[7,9,7],[6,4],[3,2,1],[0]],b:[[9,7],[6,4,6],[7,4],[2]],level:0.31,decay:0.55},
  {a:[[0,4],[7,4],[1,0,4],[0],[4,7],[6,4],[3,1],[0]],b:[[7,4,1],[0,1],[4,3],[0]],level:0.30,decay:0.5},
  {a:[[4,6],[7],[6,4],[2],[4,7],[6,4],[3,2],[0]],b:[[9,7],[6],[4,3],[2]],level:0.26,decay:0.75},
  {a:[[7,9,11],[9,7],[6,7,9],[4],[7,9,12],[11,9,7],[6,4],[7]],b:[[11,12,11],[9,7,6],[9,7],[4]],level:0.35,decay:0.8},
  {a:[[0,1,4],[3,1],[0,4],[1],[4,3,1],[0,1],[4,1],[0]],b:[[7,4,1],[3,4],[1,0],[0]],level:0.36,decay:0.45},
  {a:[[0,4,3],[1,0],[4,3,0],[0],[4,6,4],[3,1],[0,1,3],[0]],b:[[7,6,4],[3,4],[1,3],[0]],level:0.36,decay:0.5},
  {a:[[0,1,4],[0,1],[4,3,1],[0],[7,4,1],[3,1],[0,1,4],[0]],b:[[7,4,3],[1,4],[3,1],[0]],level:0.42,decay:0.48},
  {a:[[0,3,4],[6,4],[3,1,0],[0],[4,6,7],[4,3],[1,3,4],[0]],b:[[7,6,4],[3,6],[4,1],[0]],level:0.26,decay:0.38},
  {a:[[7,4,3],[0,2,4],[6,4],[0],[7,9,7],[6,4,3],[2,4],[0]],b:[[9,7,4],[6,7],[4,3],[2]],level:0.33,decay:0.5},
  {a:[[0,4,6],[3,1],[4,2,0],[0],[7,6,4],[3,4],[2,1,3],[0]],b:[[6,7,4],[3,6],[4,2],[0]],level:0.30,decay:0.45},
  {a:[[7,9],[11],[9,7],[6],[9,11],[12,9],[7,6],[4]],b:[[11,9],[7],[6,4],[7]],level:0.24,decay:1.1},
  {a:[[0,2,4],[6,4,3],[2,4],[0],[4,6,7],[6,4],[3,2,1],[0]],b:[[7,6,4],[3,4,6],[2,3],[0]],level:0.30,decay:0.48},
];

export const TECHNO_FORM_BARS=128;
export function technoSection(bar) {
  const part=bar%TECHNO_FORM_BARS;
  if(part<8)return {name:'Opening',drums:1,bass:1,lead:part<4?0:0.65,harmony:0.35,arp:0.35};
  if(part<24)return {name:'First theme',drums:1,bass:1,lead:1,harmony:0.75,arp:0.5};
  if(part<32)return {name:'Lift',drums:1,bass:1,lead:1.05,harmony:1,arp:1};
  if(part<40)return {name:'Melodic breakdown',drums:0,bass:0,lead:0.9,harmony:1,arp:0.2};
  if(part<48)return {name:'Rebuild',drums:0.65,bass:0.65,lead:0.9,harmony:0.7,arp:0.6};
  if(part<56)return {name:'Build',drums:0.9,bass:0.8,lead:0.75,harmony:0.8,arp:1.15,build:true};
  if(part<80)return {name:'Theme returns',drums:1,bass:1,lead:1.08,harmony:1,arp:0.8};
  if(part<96)return {name:'Second theme',drums:1,bass:1,lead:1.05,harmony:0.85,arp:0.65,second:true};
  if(part<104)return {name:'Breathing space',drums:0.75,bass:0.8,lead:0.75,harmony:0.7,arp:0.3};
  if(part<112)return {name:'Final build',drums:0.9,bass:0.8,lead:0.8,harmony:0.85,arp:1.15,build:true};
  return {name:'Final return',drums:1,bass:1,lead:1.12,harmony:1,arp:0.8};
}

export function technoTheme(id,bar,tick,seedOffset=0) {
  const writing=WRITING[id-1],section=technoSection(bar),index=bar%8;
  let notes=section.second&&index<4?writing.b[index]:writing.a[index];
  if(seedOffset===3&&index===1||seedOffset===5&&index===4)notes=writing.b[index%4];
  if(seedOffset===4&&index%2===0&&notes.length>1)notes=[notes[1],notes[0],...notes.slice(2)];
  const rhythm=technoLeadRhythm(id,bar,notes.length);
  const position=rhythm.findIndex(([at])=>at===tick);
  if(position<0||section.lead===0)return null;
  // Seed changes the answer's register without turning the theme into a random walk.
  const register=seedOffset===2&&index===6?7:0;
  const degree=notes[position]+register+(seedOffset===1&&index%4!==3?2:0);
  return {degree:seedOffset===6&&degree>7?degree-2:seedOffset===7&&index===7?7:degree,beats:rhythm[position][1],
    level:writing.level*section.lead,decay:writing.decay*(section.drums===0?1.25:1),
    phrase:section.second?'B':'A'};
}
