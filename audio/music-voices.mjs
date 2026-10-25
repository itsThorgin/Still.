import {PhraseBank,BassHarmonics} from './phrase-bank.mjs';
import {TonalBank} from './tonal-bank.mjs';
import {ConnectedBank} from './connected-bank.mjs';
import {ModalBank} from './modal-bank.mjs';
import {BreathBank} from './tone-shaping.mjs';
import {tonalMode} from './phrase-plan.mjs';
export function createMusicVoices(rate,c,seed){
  const p=c.performance;
  if(p.upper==='phrase')return new PhraseBank(rate,p.voiceRules,c,seed);
  if(p.upper==='connected')return new ConnectedBank(rate,c,seed);
  if(p.upper==='modal')return new ModalBank(rate,seed);
  if(p.upper==='breath'){const bank=new BreathBank(rate,c,seed);bank.glide=1-Math.exp(-1/(rate*(c.value===20?.095:.105)));return bank;}
  if(p.upper==='tonal')return p.cues==='tonal'?new TonalBank(rate,c.value,seed):new TonalBank(rate,tonalMode(c.technoProduction.family),seed^c.value*811);
  return null;
}
export {BassHarmonics};
