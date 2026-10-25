// Authored ambient scores. Stable IDs continue the single character picker.
const MAJOR=[0,2,4,5,7,9,11],MINOR=[0,2,3,5,7,8,10],DORIAN=[0,2,3,5,7,9,10],LYDIAN=[0,2,4,6,7,9,11],PHRYGIAN=[0,1,3,5,7,8,10];
const n=s=>s.split(' ').map(Number);
function freeze(x){if(x&&typeof x==='object'){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;}
function character(value,label,genre,tempo,scale,w){return freeze({value,label,genre,tempo,scale,tonic:w.tonic??[36,38,41],
  progression:w.progression,voicing:w.voicing,hold:w.hold,theme:w.theme,order:w.order,pad:w.pad,lead:w.lead,
  bass:w.bass,pluck:w.pluck,detail:w.detail,description:w.description,sceneWriting:w});}
// Calls/replies are [bar within a four-bar scene, sixteenth, theme index, beats].
// Texture beds belong to Drone layers; optional tiny details have their own fader.
export const AMBIENT_ADDITIONS=freeze([
  character(16,'Fogbound pines','Forest air drone',40,DORIAN,{
    progression:n('0 0 3 3 0 0 5 0'),voicing:[0,4,7],hold:4,theme:n('0 2 4 3 2 1 0 0'),reply:n('4 3 2 0 1 2 0 0'),
    calls:[[1,7,0,5.6],[3,2,2,3.8]],replies:[[2,9,3,4.5]],order:[0,1,4,2,3,5,6,7],
    pad:'breath-cloud',lead:'reed-light',bass:'sine-earth',pluck:'ember-string',detail:'air-spark',bed:'forest-air',bedBars:4,
    bassBars:4,bassDegrees:n('0 0 0 4 0 0 0 0'),spread:7,leadOctave:1,bedLevel:.025,
    description:'Soft wind moves through a wide bed of forest air. Distant wooden calls emerge between low roots and slow, misty chords.'}),
  character(17,'Under lake ice','Glacial resonance',34,LYDIAN,{
    tonic:[38,41,43],progression:n('0 0 0 4 0 0 2 0'),voicing:[0,4,10],hold:8,theme:n('7 6 4 0 2 6 4 0'),reply:n('9 7 6 4 2 0 4 0'),
    calls:[[2,5,0,9]],replies:[[1,13,2,6]],order:[0,4,1,6,2,5,3,7],
    pad:'silver-cloud',lead:'glacial-glass',bass:'sine-earth',pluck:'glass-halo',detail:'glacial-glass',bed:'glacial-glass',bedBars:8,
    bassBars:8,bassDegrees:n('0 0 4 0 0 0 0 0'),spread:13,leadOctave:1,bedLevel:.009,
    description:'Cold glass resonances hang over an almost motionless lake. Widely spaced harmonics and a deep foundation leave long stretches of empty air.'}),
  character(18,'Mountain afterglow','Geological dusk drone',38,MAJOR,{
    progression:n('0 0 5 5 3 3 0 0'),voicing:[0,4,8],hold:4,theme:n('4 3 2 0 2 1 0 -1'),reply:n('2 0 -1 0 3 2 1 0'),
    calls:[[0,11,0,7],[3,4,2,5]],replies:[[2,7,1,6]],order:[0,2,1,3,5,4,6,7],
    pad:'window-warmth',lead:'ember-string',bass:'stone-tide',pluck:'felt-light',detail:'copper-bell',bed:'stone-tide',bedBars:8,
    bassBars:4,bassDegrees:n('0 4 0 0 2 0 4 0'),spread:11,leadOctave:0,bedLevel:.012,
    description:'A deep stone-like movement supports warm harmonics that gradually darken, like the last sunlight leaving a mountain ridge.'}),
  character(19,'Interstellar drift','Interstellar sub drone',32,MINOR,{
    progression:n('0 0 0 0 5 0 0 0'),voicing:[0,7,11],hold:8,theme:n('0 7 4 0 6 3 0 -1'),reply:n('7 4 6 0 3 0 -1 0'),
    calls:[[3,1,0,11]],replies:[[2,12,1,8]],order:[0,4,6,1,2,5,3,7],
    pad:'void-carrier',lead:'orbital-halo',bass:'sine-earth',pluck:'glass-halo',detail:'air-spark',bed:'void-carrier',bedBars:8,
    bassBars:8,bassDegrees:n('0 0 0 0 4 0 0 0'),spread:17,leadOctave:1,bedLevel:.009,
    description:'A nearly stationary sub and cold, distant harmonics suggest endless travel between stars. Upper tones arrive rarely and linger.'}),
  character(20,'Unanswered beacon','Unknown signal ambient',44,PHRYGIAN,{
    progression:n('0 0 1 0 0 5 0 0'),voicing:[0,4,8],hold:4,theme:n('0 4 1 0 7 1 4 0'),reply:n('4 1 0 -1 4 0 1 0'),
    calls:[[0,5,0,2.6],[0,13,1,2.3],[2,9,2,4.5]],replies:[[1,7,1,3],[3,3,3,5]],order:[0,1,2,4,3,6,5,7],
    pad:'abyss-cloud',lead:'void-carrier',bass:'stone-tide',pluck:'orbital-halo',detail:'metal-dust',bed:'orbital-halo',bedBars:8,
    bassBars:4,bassDegrees:n('0 0 1 0 0 0 4 0'),spread:9,leadOctave:1,bedLevel:.012,
    loop:[[1,11,4,1.8]],loopBars:5,
    description:'A short coded call repeats across cold harmonic space, then changes its answer. Slow low tones make every returning signal feel remote.'}),
  character(21,'Sleeping orbiter','Derelict spacecraft drone',36,DORIAN,{
    progression:n('0 0 0 3 0 0 0 5'),voicing:[0,4,7],hold:8,theme:n('0 2 4 0 3 1 0 -1'),reply:n('4 0 2 1 0 -1 0 0'),
    calls:[[1,13,0,8]],replies:[[3,7,2,6.5]],order:[0,6,1,4,2,3,5,7],
    pad:'orbital-halo',lead:'glass-halo',bass:'sine-earth',pluck:'void-carrier',detail:'metal-dust',bed:'room-tone',bedBars:4,
    bassBars:8,bassDegrees:n('0 0 0 4 0 0 0 0'),spread:19,leadOctave:0,bedLevel:.022,
    description:'Ventilation-like air and a hollow cabin hum surround isolated glass tones, while a faint harmonic halo turns slowly outside.'}),
  character(22,'Rooms remembered','Faded tape memory',46,MAJOR,{
    progression:n('0 5 3 0 1 3 5 0'),voicing:[0,2,6],hold:4,theme:n('4 2 1 0 2 3 1 0'),reply:n('2 1 0 -1 2 0 1 0'),
    calls:[[0,3,0,3.5],[1,9,1,3],[3,1,3,4]],replies:[[0,9,2,4],[2,11,4,3]],order:[0,1,2,3,4,5,6,7],
    pad:'tape-choir',lead:'memory-keys',bass:'velvet-floor',pluck:'oxide-loop',detail:'air-spark',bed:'tape-choir',bedBars:8,
    bassBars:4,bassDegrees:n('0 4 0 2 0 0 4 0'),spread:5,leadOctave:1,bedLevel:.009,wear:.38,
    description:'A small key phrase returns like a childhood room half remembered. Warm tape hiss, gentle wow and softened chords blur its edges.'}),
  character(23,'Voice without a face','Distant vocal memory',40,MINOR,{
    progression:n('0 0 5 3 0 1 3 0'),voicing:[0,2,7],hold:4,theme:n('4 3 1 0 2 1 -1 0'),reply:n('2 4 3 1 0 -1 1 0'),
    calls:[[1,5,0,7.5],[3,9,2,5]],replies:[[2,1,3,8]],order:[0,4,1,2,6,3,5,7],
    pad:'velvet-cloud',lead:'vowel-veil',bass:'velvet-floor',pluck:'memory-keys',detail:'glass-seed',bed:'tape-choir',bedBars:8,
    bassBars:4,bassDegrees:n('0 0 4 0 2 0 0 0'),spread:15,leadOctave:1,bedLevel:.013,wear:.28,
    description:'Wordless vowel tones almost recall a familiar voice. They recede into worn tape harmony before any clear phrase can settle.'}),
  character(24,'Photograph in rain','Weathered dream ambient',50,DORIAN,{
    progression:n('0 3 0 5 1 0 3 0'),voicing:[0,4,6],hold:4,theme:n('2 4 3 0 6 4 1 0'),reply:n('4 2 3 1 2 0 -1 0'),
    calls:[[0,7,0,4],[2,3,1,4.5]],replies:[[1,11,3,3.5],[3,5,5,4]],order:[0,2,1,4,3,5,6,7],
    pad:'oxide-loop',lead:'memory-keys',bass:'velvet-floor',pluck:'ember-string',detail:'glass-seed',bed:'rain-vault',bedBars:4,
    bassBars:4,bassDegrees:n('0 2 0 4 0 0 4 0'),spread:7,leadOctave:1,bedLevel:.018,wear:.3,
    description:'Soft rain-like noise surrounds a wavering loop and fading key fragments, like a photograph of a place that only exists in a dream.'}),
  character(25,'After-hours atrium','Empty mall resonance',42,MINOR,{
    progression:n('0 0 3 0 0 5 1 0'),voicing:[0,4,8],hold:4,theme:n('0 4 3 0 1 4 0 -1'),reply:n('4 0 1 3 0 -1 1 0'),
    calls:[[2,7,0,4.5]],replies:[[1,3,1,5]],order:[0,1,6,2,4,3,5,7],
    pad:'room-tone',lead:'glacial-glass',bass:'velvet-floor',pluck:'memory-keys',detail:'metal-dust',bed:'wire-hum',bedBars:8,
    bassBars:4,bassDegrees:n('0 0 4 0 1 0 0 0'),spread:21,leadOctave:1,bedLevel:.011,
    loop:[[0,11,3,2]],loopBars:3,
    description:'Electrical air fills an empty atrium. A few hollow notes and an uneven returning key sound suggest distant shop speakers after closing.'}),
  character(26,'Fluorescent distance','Endless corridor drone',36,PHRYGIAN,{
    progression:n('0 0 1 0 0 0 5 0'),voicing:[0,1,7],hold:8,theme:n('0 1 0 4 -1 0 1 0'),reply:n('1 0 -1 0 4 1 0 0'),
    calls:[[3,5,1,7]],replies:[[1,9,3,6]],order:[0,6,4,1,2,5,3,7],
    pad:'wire-hum',lead:'void-carrier',bass:'sine-earth',pluck:'wire-hum',detail:'metal-dust',bed:'room-tone',bedBars:8,
    bassBars:8,bassDegrees:n('0 0 0 1 0 0 0 0'),spread:23,leadOctave:0,bedLevel:.02,
    loop:[[0,3,0,3]],loopBars:3,
    description:'A narrow electrical hum and close semitone shadows stretch down an apparently endless corridor. Faint repetitions drift out of alignment.'}),
  character(27,'Platform in the rain','Abandoned station ambient',48,DORIAN,{
    tonic:[38,41,43],progression:n('0 0 5 3 0 1 4 0'),voicing:[0,4,6],hold:4,theme:n('4 2 0 1 3 2 1 0'),reply:n('2 1 0 -1 4 2 0 0'),
    calls:[[1,1,0,4.5],[3,11,2,3.5]],replies:[[0,9,1,5]],order:[0,2,4,1,3,5,6,7],
    pad:'organ-mist',lead:'ember-string',bass:'velvet-floor',pluck:'copper-bell',detail:'glacial-glass',bed:'rain-vault',bedBars:4,
    bassBars:4,bassDegrees:n('0 0 4 0 2 0 0 4'),spread:9,leadOctave:0,bedLevel:.026,
    description:'Rain-like washes resonate under a station roof, with low sustained harmony and rare metallic answers fading down an empty platform.'}),
  character(28,'Thousand-year vigil','Ritual overtone drone',40,DORIAN,{
    progression:n('0 0 0 3 0 0 4 0'),voicing:[0,4,7],hold:8,theme:n('0 4 3 0 2 4 1 0'),reply:n('4 3 0 2 1 0 -1 0'),
    calls:[[0,9,0,9],[3,1,1,7]],replies:[[2,5,2,8]],order:[0,1,4,2,5,3,6,7],
    pad:'vowel-veil',lead:'breath-threshold',bass:'organ-mist',pluck:'temple-bowl',detail:'temple-bowl',bed:'forest-air',bedBars:8,
    bassBars:8,bassDegrees:n('0 0 4 0 0 0 4 0'),spread:13,leadOctave:1,bedLevel:.008,
    loop:[[0,1,0,6]],loopBars:4,
    description:'Wordless sustained voices gather around a low ritual tone. Patient bowl strokes mark an old ceremony without establishing a beat.'}),
  character(29,'Temple of one tone','Expanding harmonic temple',32,MAJOR,{
    progression:n('0 0 0 0 0 0 0 0'),voicing:[0,4,7,11],hold:8,theme:n('0 7 4 9 7 4 2 0'),reply:n('7 4 9 7 4 2 0 0'),
    calls:[[2,3,1,12]],replies:[[1,11,2,10]],order:[0,1,2,4,3,5,6,7],
    pad:'vowel-veil',lead:'temple-bowl',bass:'sine-earth',pluck:'organ-mist',detail:'copper-bell',bed:'orbital-halo',bedBars:8,
    bassBars:8,bassDegrees:n('0 0 0 0 0 0 0 0'),spread:27,leadOctave:1,bedLevel:.012,
    description:'One low centre persists while upper voices and slowly beating bowl partials expand around it, filling an imaginary temple with changing overtones.'}),
  character(30,'Between waking','Hypnagogic breath ambient',44,LYDIAN,{
    progression:n('0 0 2 0 5 3 0 0'),voicing:[0,4,6],hold:4,theme:n('4 6 4 2 0 3 1 0'),reply:n('6 4 2 0 1 2 0 0'),
    calls:[[1,3,0,6.5],[3,13,3,4.5]],replies:[[2,9,1,7]],order:[0,4,2,1,6,3,5,7],
    pad:'breath-threshold',lead:'vowel-veil',bass:'velvet-floor',pluck:'glass-halo',detail:'air-spark',bed:'window-warmth',bedBars:8,
    bassBars:4,bassDegrees:n('0 0 4 0 0 2 0 0'),spread:17,leadOctave:1,bedLevel:.01,
    description:'Breath and vowel colours slowly trade places as soft suspended notes hover between waking and sleep. The melody never quite becomes a sentence.'}),
  character(31,'Last light on earth','Empty world drone',34,MINOR,{
    progression:n('0 0 5 0 3 0 1 0'),voicing:[0,4,8],hold:8,theme:n('0 -1 0 3 1 0 -3 0'),reply:n('3 1 0 -1 0 -3 1 0'),
    calls:[[3,9,0,9]],replies:[[2,3,2,7]],order:[0,4,6,2,1,3,5,7],
    pad:'abyss-cloud',lead:'ember-string',bass:'stone-tide',pluck:'memory-keys',detail:'metal-dust',bed:'forest-air',bedBars:8,
    bassBars:8,bassDegrees:n('0 0 4 0 0 1 0 0'),spread:29,leadOctave:0,bedLevel:.017,
    description:'Low earth-like tones and an isolated fading string sit beneath wind-like air, suggesting a lit world with nobody left to see it.'}),
  character(32,'Unseen presence','Unstable shadow drone',38,PHRYGIAN,{
    progression:n('0 1 0 0 5 1 0 0'),voicing:[0,1,4],hold:4,theme:n('0 1 -1 0 3 1 0 -1'),reply:n('1 0 3 -1 0 1 -1 0'),
    calls:[[1,11,1,7],[3,5,3,5]],replies:[[2,7,0,8]],order:[0,6,1,4,2,3,5,7],
    pad:'void-carrier',lead:'breath-threshold',bass:'stone-tide',pluck:'glacial-glass',detail:'metal-dust',bed:'frayed-engine',bedBars:8,
    bassBars:4,bassDegrees:n('0 1 0 0 4 0 1 0'),spread:15,leadOctave:0,bedLevel:.015,
    description:'Close pitches slowly pull against one another. A rough low texture and almost vocal breaths imply a presence just outside the empty space.'}),
  character(33,'Machine after us','Decaying machine drone',36,PHRYGIAN,{
    progression:n('0 0 1 0 0 5 0 1'),voicing:[0,4,7],hold:4,theme:n('0 4 1 0 -1 3 1 0'),reply:n('4 1 0 -1 3 0 1 0'),
    calls:[[0,13,0,5],[3,7,2,6]],replies:[[2,1,1,7]],order:[0,1,6,2,4,5,3,7],
    pad:'frayed-engine',lead:'wire-hum',bass:'stone-tide',pluck:'oxide-loop',detail:'metal-dust',bed:'room-tone',bedBars:4,
    bassBars:4,bassDegrees:n('0 4 0 1 0 0 4 0'),spread:11,leadOctave:0,bedLevel:.014,wear:.6,
    loop:[[0,7,0,3.5]],loopBars:5,
    description:'A worn mechanical resonance moves in long, uneven cycles. Grit and electrical air lose brightness as the enormous machine slowly decays.'}),
  character(34,'Oxide hours','Disintegrating tape loop',48,MINOR,{
    progression:n('0 0 5 0 3 0 1 0'),voicing:[0,2,6],hold:4,theme:n('4 2 1 0 3 2 0 -1'),reply:n('2 1 0 -1 3 1 0 0'),
    calls:[[1,5,0,3.5],[3,9,2,3]],replies:[[2,3,1,4]],order:[0,1,2,3,4,5,6,7],
    pad:'tape-choir',lead:'memory-keys',bass:'velvet-floor',pluck:'oxide-loop',detail:'air-spark',bed:'oxide-loop',bedBars:8,
    bassBars:4,bassDegrees:n('0 0 4 0 2 0 0 0'),spread:5,leadOctave:1,bedLevel:.014,wear:.8,
    loop:[[0,1,0,2],[1,7,1,2.3],[2,11,2,2]],loopBars:4,
    description:'A short tape-like motif returns with softened attacks, wandering pitch and increasingly frayed grain edges. Its haze thickens across later cycles.'}),
  character(35,'Clock without hands','Unmeasured time ambient',42,LYDIAN,{
    progression:n('0 0 2 0 3 0 5 0'),voicing:[0,4,6],hold:4,theme:n('0 4 2 6 1 4 0 2'),reply:n('4 2 6 1 0 2 1 0'),
    calls:[[2,13,0,5]],replies:[[1,5,2,4.5]],order:[0,2,1,4,3,6,5,7],
    pad:'silver-cloud',lead:'glacial-glass',bass:'sine-earth',pluck:'temple-bowl',detail:'glass-seed',bed:'oxide-loop',bedBars:8,
    bassBars:4,bassDegrees:n('0 4 0 2 0 0 4 0'),spread:19,leadOctave:1,bedLevel:.008,wear:.5,
    loop:[[0,3,0,3.1],[1,13,1,2.7]],loopBars:3,
    description:'Quiet bowl and glass fragments recur on unequal cycles, always slightly displaced against slow harmony, like a clock that has forgotten its purpose.'}),
  character(36,'Final resonance','Dying string and bowl',32,DORIAN,{
    progression:n('0 0 0 3 0 0 5 0'),voicing:[0,4,7],hold:8,theme:n('4 0 3 1 0 -1 0 0'),reply:n('0 4 2 0 -1 1 0 0'),
    calls:[[0,9,0,12]],replies:[[3,1,1,10]],order:[0,1,4,2,6,3,5,7],
    pad:'velvet-cloud',lead:'ember-string',bass:'velvet-floor',pluck:'temple-bowl',detail:'temple-bowl',bed:'room-tone',bedBars:8,
    bassBars:8,bassDegrees:n('0 0 4 0 0 0 2 0'),spread:23,leadOctave:0,bedLevel:.008,wear:.4,
    description:'One softly excited string and an occasional bowl ring far beyond their attacks. Their upper partials fade first, leaving a final warm vibration.'}),
  character(37,'Everyone is sleeping','Intimate night ambient',44,MAJOR,{
    progression:n('0 0 5 3 0 1 3 0'),voicing:[0,2,6],hold:4,theme:n('2 1 0 2 4 2 1 0'),reply:n('1 0 2 1 0 -1 1 0'),
    calls:[[0,9,0,3.2],[2,5,1,4]],replies:[[3,1,2,4.5]],order:[0,4,1,2,3,5,6,7],
    pad:'window-warmth',lead:'near-piano',bass:'velvet-floor',pluck:'felt-light',detail:'air-spark',bed:'breath-threshold',bedBars:8,
    bassBars:4,bassDegrees:n('0 0 4 0 2 0 0 0'),spread:7,leadOctave:1,bedLevel:.006,
    description:'A few close, damped piano notes sit inside gentle warm harmony. Long gaps leave room for the quiet of a house where everyone else is asleep.'}),
  character(38,'Quiet acceptance','Still warm harmonics',38,DORIAN,{
    progression:n('0 0 3 0 5 3 0 0'),voicing:[0,4,6],hold:4,theme:n('4 3 2 0 1 2 1 0'),reply:n('2 1 0 2 3 1 0 0'),
    calls:[[1,7,0,7.5]],replies:[[3,3,2,6]],order:[0,1,4,2,3,6,5,7],
    pad:'window-warmth',lead:'ember-string',bass:'sine-earth',pluck:'near-piano',detail:'copper-bell',bed:'vowel-veil',bedBars:8,
    bassBars:4,bassDegrees:n('0 0 4 0 0 2 0 0'),spread:13,leadOctave:0,bedLevel:.008,
    description:'Warm sustained intervals and a restrained string-like reply make room for calm and sadness together, without pressing toward a climax.'}),
  character(39,'Window at evening','Last light piano ambient',46,MAJOR,{
    progression:n('0 5 3 0 1 3 4 0'),voicing:[0,2,8],hold:4,theme:n('4 2 3 1 0 2 1 0'),reply:n('2 3 1 0 2 1 -1 0'),
    calls:[[0,5,0,3.8],[1,13,1,3.2],[3,7,4,4.5]],replies:[[1,3,2,4],[2,11,3,4.5]],order:[0,2,1,3,4,5,6,7],
    pad:'window-warmth',lead:'near-piano',bass:'velvet-floor',pluck:'memory-keys',detail:'glass-seed',bed:'tape-choir',bedBars:8,
    bassBars:4,bassDegrees:n('0 4 0 2 0 0 4 0'),spread:9,leadOctave:1,bedLevel:.006,wear:.15,
    description:'Soft piano fragments and warm high intervals linger like evening light through a window. Gentle harmonic changes settle into a quiet, bittersweet return.'}),
]);
