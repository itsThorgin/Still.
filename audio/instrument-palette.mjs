import {gardenHash} from '../garden-options.mjs';
import {technoExpansionWriting} from '../techno-expansion.mjs';
import {bassDepthWriting} from '../bass-depth-characters.mjs';

// Each variation chooses once from an authored, genre-appropriate set. A role
// keeps its instrument across theme returns; note-by-note randomness is absent.
const TECHNO={
  warm:['amber-flow','rubber-call','vowel-current'],
  hollow:['nylon-pluck','wood-mallet','hollow-pulse'],
  dub:['smoke-organ','round-drawbars','dust-chord'],
  glass:['glass-drops','steel-wire','bronze-chime'],
  air:['spectral-ribbon','breath-choir','tape-cloud','reverse-halo'],
};
export function technoInstrumentPalette(seed,style){
  const writing=technoExpansionWriting(style);
  if(writing)return Object.freeze(Object.fromEntries(Object.entries(writing.patches).map(([role,pool],i)=>
    [role,pool[gardenHash(seed^style*0x9e37,0x70617463+i)%pool.length]])));
  const deep=[1,6,14].includes(style),heavy=[8,9,10,12].includes(style);
  const options={...TECHNO,
    warm:heavy?['rubber-call','copper-reed','digital-bloom']:TECHNO.warm,
    hollow:deep?['nylon-pluck','ceramic-bowl','wood-mallet']:TECHNO.hollow,
    glass:deep?['ceramic-bowl','tine-keys','glass-drops']:TECHNO.glass,
    air:heavy?['hollow-orbit','nasal-chorale','frost-grains']:TECHNO.air};
  return Object.freeze(Object.fromEntries(Object.entries(options).map(([role,pool],i)=>
    [role,pool[gardenHash(seed^style*0x9e37,0x70617463+i)%pool.length]])));
}
export function dnbInstrumentPalette(seed,style,groove){
  const writing=bassDepthWriting(style);
  if(writing)return Object.freeze(Object.fromEntries(Object.entries(writing.patches).map(([role,pool],i)=>
    [role,pool[gardenHash(seed^style*0x51ed,0x646e6200+i)%pool.length]])));
  const hard=[7,12].includes(style),jungle=groove==='jungle';
  const pools=hard?
    [['rubber-call','copper-reed'],['steel-wire','bronze-chime'],['hollow-orbit','frost-grains']]:jungle?
    [['hollow-pulse','vowel-current'],['wood-mallet','nylon-pluck'],['tape-cloud','dust-chord']]:
    [['tine-keys','nylon-pluck'],['glass-drops','smoke-organ'],['spectral-ribbon','breath-choir','reverse-halo']];
  return Object.freeze(pools.map((pool,i)=>pool[gardenHash(seed^style*0x51ed,0x646e6200+i)%pool.length]));
}
export function dnbMelodicPatch(palette,bar,section){
  if(['break','bridge'].includes(section))return palette[2];
  return palette[Math.floor(bar/4)%2];
}
