import {createElectronicPlan} from '../foundation/audio/neon-plan.mjs';
const rows=[
 ['bassmusic',10,'Longer gliding pressure','Longer bass gates and a connected falling answer, with a gentle beat-synchronised upper pulse. Written gaps and the half-time impacts remain.', 'bass',true],
 ['bassmusic',25,'A moving low conversation','A small pitched answer develops the rumble; alternating slow and quicker filter movement and bounded upper saturation replace the static horn contour.','bass',true],
 ['bassmusic',29,'An animated upper reply','The higher ceramic voice gets a darker, moving filter, restrained grit and rhythmic pressure. The bass notes and drum sources stay identical.','music',false],
 ['bassmusic',33,'A related phrase ending','The isolated bell answer becomes a warm keys reply with a settling cadence and a restrained echo, related to the preceding keys and stabs.','music',true],
 ['bassmusic',42,'Elastic upper bass','The original bass rhythm, pitches, envelopes and clean sub remain. Its harmonic band gains progressively deeper filter wobble, pressure and saturation.','bass',false],
 ['techno',4,'The Detroit motif returns','The original motif supplies a recurring, longer rising/falling line, especially on later returns. It glides over the existing syncopated chord pressure. Current app is also available as a reference.','music',true],
 ['techno',8,'Forged, pitched impacts','Iron keeps the broken seven-step metal clock, with tuned clangs, compact pitched attacks and an answering phrase. Its sharper forged identity contrasts with Raw’s rougher riff.','music-percussion',true],
 ['techno',9,'A rough warehouse riff','A dark, driven saw riff replaces the shared metallic FM voice. Sparse, dry rack-like percussion and pressure changes distinguish it from Iron’s pitched clangs.','music-percussion',true],
 ['techno',12,'A bridge inside the groove','Lower, rounder open hats and rides leave room for a repeating lower-mid synth figure, connected across the bass offbeats with a developing answer.','music-percussion',true],
 ['techno',15,'Softer syncopated colour','Quieter chord pulses vary their body and colour; an occasional soft connected answer develops the motif without covering the Detroit swing.','music',true],
 ['techno',20,'A woody tribal phrase','A woody, breathing line follows the hand-drum and bass accents, extending the two-hit gesture into a call and descending response. Hand percussion remains identical.','music',true],
 ['techno',38,'Longer rising and falling variations','Short syncopated colour remains, while a longer phrase draws on Copper’s original ascending and descending motif with restrained glide and delayed vibrato.','music',true],
 ['techno',40,'Gated steel shutters','Shorter gated rasp, a brighter but quieter metal palette, changing pressure and authored pockets make the shutters rhythm distinct from Furnace.','music-percussion',true],
 ['techno',41,'A lower furnace resonance','Lower, slower resonant calls, longer bodies and widely spaced damped metal responses create a heavier, less busy identity than Steel.','music-percussion',true],
 ['techno',43,'Less tiring high percussion','Reduced ride/open-hat level and top end, changing decay and occasional ride gaps. Kick, bass, clap, snare and upper musical sources stay identical.','music-percussion',true],
];
export const REFINEMENTS=Object.freeze(rows.map(([kind,id,direction,description,affected,scoreChange])=>{
 const c=createElectronicPlan(42,kind,id).character;
 return Object.freeze({kind,id,label:c.label,style:(c.bassProduction??c.technoProduction).genre,tempo:c.tempo,
  start:kind==='bassmusic'?16:id===4?80:48,bars:32,direction,description,affected,scoreChange,
  jumps:[['Statement',0],['Reply',4],['Developing return',8],['Later phrase',16],['Final answer',24]]});
}));
export const selectedRefinement=(kind,id)=>REFINEMENTS.find(p=>p.kind===kind&&p.id===id);
export const highPercussion=(id,type)=>[8,9,40,41].includes(id)?['hat','metal','noise'].includes(type):[12,43].includes(id)?['hat','open-hat','ride'].includes(type):false;
