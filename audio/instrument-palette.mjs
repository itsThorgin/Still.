import {gardenHash} from '../garden-options.mjs';
import {MUSIC_CHARACTERS} from '../music-characters.mjs';
export function dnbInstrumentPalette(seed,style,groove){
  const writing=MUSIC_CHARACTERS.bassmusic.find(c=>c.value===style)?.libraryPatches;
  if(writing)return Object.freeze(Object.fromEntries(Object.entries(writing).map(([role,pool],i)=>
    [role,pool[gardenHash(seed^style*0x51ed,0x646e6200+i)%pool.length]])));
  const hard=[7,12].includes(style),jungle=groove==='jungle';
  const pools=hard?
    [['rubber-call','copper-reed'],['steel-wire','bronze-chime'],['hollow-orbit','frost-grains']]:jungle?
    [['hollow-pulse','vowel-current'],['wood-mallet','nylon-pluck'],['tape-cloud','dust-chord']]:
    [['tine-keys','nylon-pluck'],['glass-drops','smoke-organ'],['spectral-ribbon','breath-choir','reverse-halo']];
  return Object.freeze(pools.map((pool,i)=>pool[gardenHash(seed^style*0x51ed,0x646e6200+i)%pool.length]));
}
