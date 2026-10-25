import { gardenHash } from '../garden-options.mjs';
import {technoExpansionWriting} from '../techno-expansion.mjs';

// Related palettes keep each character recognizable across new variations.
// modes, filter centre, sweep depth, sweep lengths (beats), drive, stereo spread
const PALETTES = [
  [['resonant','wide'],0.68,1.05,[8,16,24],0.85,0.7],
  [['pulse','resonant'],0.8,0.75,[4,8,12],0.9,0.5],
  [['resonant','pulse'],0.95,1.2,[6,8,12],1,0.8],
  [['wide','resonant'],1.05,1,[8,12,16],0.95,1.1],
  [['resonant','pulse'],0.8,1.15,[4,6,8],1.05,0.6],
  [['wide','resonant'],0.65,0.85,[12,16,24],0.8,0.8],
  [['wide','resonant'],1.05,1.15,[8,12,16],1,1.15],
  [['pulse','resonant'],0.85,1.2,[4,6,8],1.2,0.65],
  [['pulse','resonant'],0.9,1.1,[4,8,12],1.15,0.6],
  [['pulse','resonant'],0.95,1.15,[4,6,8],1.2,0.6],
  [['resonant','pulse'],0.85,0.85,[3,6,12],0.95,0.65],
  [['pulse','resonant'],1,1.15,[4,8,12],1.1,0.8],
  [['pulse','wide'],0.95,1,[3,6,8],1.05,0.9],
  [['wide','resonant'],0.75,0.9,[16,24,32],0.8,1.25],
  [['pulse','wide'],0.9,0.95,[4,8,12],0.95,0.95],
];
export function technoMotion(seed,style) {
  const p=PALETTES[style-1]??technoExpansionWriting(style)?.motion;
  if(!p)throw Error('Unknown Techno character');
  const random=n=>gardenHash(seed,0x4d4f544e+style*31+n)/4294967296;
  return Object.freeze({mode:p[0][Math.floor(random(0)*p[0].length)],
    colour:p[1]*(0.86+random(1)*0.28),depth:p[2]*(0.85+random(2)*0.3),
    sweepBeats:p[3][Math.floor(random(3)*p[3].length)],
    pulseRate:[0.5,1,2][Math.floor(random(4)*3)],phase:random(5),
    drive:p[4]*(0.9+random(6)*0.2),spread:p[5]*(0.85+random(7)*0.3),
    glide:0.7+random(8)*0.7,release:0.8+random(9)*0.4,
    resonance:0.85+random(10)*0.3,accentOffset:Math.floor(random(11)*4),
    supportDepth:0.45+random(12)*0.5});
}

export function animateTechnoSupport(tone,beats,movement,profile) {
  // Each chord's oscillators move together; stereo voices keep their own phase.
  const slow=Math.sin(Math.PI*2*(beats/profile.sweepBeats+profile.phase));
  const ripple=Math.sin(Math.PI*2*(beats*profile.pulseRate+tone.motionPhase));
  const depth=movement*profile.supportDepth;
  tone.motionCutoff=2**(depth*(slow*0.8+ripple*0.2));
  tone.motionShape=depth*(0.5+0.5*slow);
  tone.motionDetune=1+depth*0.0015*slow;
  tone.motionDrive=1+depth*0.35*(0.5+0.5*ripple);
  if(!tone.technoTone) {
    // Long pads already have their own stereo oscillators. Move their filter,
    // without pitch wobble or restarting their established envelope.
    tone.cutoffCeiling=tone.motionBaseCeiling*2**(0.6*depth*slow);
  }
}
