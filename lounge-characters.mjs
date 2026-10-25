// The additions use the same soft keys, pads, plucks and rounded bass voices
// as the original Lounge collection. Each has a written four-bar call/answer.
const MAJOR=[0,2,4,5,7,9,11],MINOR=[0,2,3,5,7,8,10],DORIAN=[0,2,3,5,7,9,10],LYDIAN=[0,2,4,6,7,9,11],MIXO=[0,2,4,5,7,9,10];
const n=s=>s.split(' ').map(Number);
function freeze(x){if(x&&typeof x==='object'){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;}
const hit=(name,ticks,level)=>({name,ticks,level,tuning:1});
const voices=(main,reply,pad,pluck,bass)=>({main:[main],reply:[reply],pad:[pad],pluck:[pluck],bass:[bass]});
function character(value,label,genre,tempo,scale,w){return freeze({value,label,genre,tempo,scale,cozy:true,tonic:[43,45,48],meter:w.meter??16,
  description:w.description,theme:w.theme,progression:w.progression,hold:1,order:w.form,rhythm:w.calls[0],answer:w.responses,
  bassTicks:w.bassRows[0].map(row=>row[0]),pattern:w.plucks,voicing:w.voicing,kit:w.kit,ensembleWriting:w});}
export const LOUNGE_ADDITIONS=freeze([
  character(16,'Amber atrium','Mellow electric-key lounge',78,DORIAN,{
    progression:n('0 0 3 0 5 3 4 0'),theme:n('4 3 2 0 2 4 3 1 0 2 4 3 2 1 0 0'),reply:n('4 3 2 1 3 2 1 0'),
    calls:[[2,8],[0,7,12],[2,10],[4]],responses:[4,12],gate:1.4,swing:.18,voicing:[0,2,6],plucks:[4],
    bassRows:[[[0,0,1.65],[8,4,1.25]],[[0,0,1.9],[10,2,.9]]],drums:[hit('kick',[0,10],.085),hit('snare',[4,12],.031),hit('brush',[2,6,10,14],.017)],kit:'lounge-brush',form:[0,1,2,3,4,5,6,7],
    patches:voices('lounge-tines','folk-lute','silk-pad','lounge-felt','lounge-upright'),
    description:'Warm electric keys and a soft plucked answer settle over an unhurried upright bass and brushed swing.'}),
  character(17,'Cartridge picnic','Cosy afternoon keys',92,MAJOR,{
    progression:n('0 3 4 0 5 3 4 0'),theme:n('0 2 4 3 2 0 1 2 4 3 2 1 2 1 0 0'),reply:n('4 2 3 1 2 0 1 0'),
    calls:[[0,6,12],[2,8],[0,7,12],[4]],responses:[4,12],gate:1.15,swing:.12,voicing:[0,2,4],plucks:[10],
    bassRows:[[[0,0,1.8],[8,4,1.1]],[[0,0,2],[10,0,.9]]],drums:[hit('kick',[0,8],.088),hit('snare',[4,12],.035),hit('brush',[2,6,10,14],.016)],kit:'lounge-pocket',form:[0,1,3,2,4,6,5,7],
    patches:voices('lounge-felt','lounge-tines','silk-pad','folk-lute','round-bass'),
    description:'A small felt-key melody and mellow electric-key answer share a relaxed picnic groove with soft, rounded bass.'}),
  character(18,'Paper moon','Soft plucked bossa',86,MAJOR,{
    progression:n('0 0 4 0 5 1 4 0'),theme:n('4 2 3 1 0 2 4 3 2 3 1 0 2 1 0 0'),reply:n('4 3 1 2 0 2 1 0'),
    calls:[[0,6],[2,10],[0,7,12],[4]],responses:[4,12],gate:1.2,swing:.04,voicing:[0,2,6],plucks:[10],
    bassRows:[[[0,0,1.8],[8,4,1.4]],[[0,0,1.65],[7,2,1.25]]],drums:[hit('kick',[0,8],.078),hit('rim',[3,10,14],.022),hit('brush',[2,6,10,14],.013)],kit:'lounge-wood',form:[0,2,1,3,4,5,6,7],
    patches:voices('folk-lute','lounge-tines','silk-pad','lounge-felt','lounge-upright'),
    description:'Soft lute-like plucks and warm tine replies lean gently into a quiet bossa pulse and steady root–fifth bass.'}),
  character(19,'Indigo steps','Quiet broken lounge',86,MINOR,{
    progression:n('0 0 5 0 3 5 4 0'),theme:n('0 3 2 1 0 2 4 3 1 0 2 1 2 1 0 0'),reply:n('4 2 0 1 3 2 1 0'),
    calls:[[2,10],[0,8],[3,11],[6]],responses:[6,13],gate:1.5,swing:.16,voicing:[0,2,6],plucks:[6],
    bassRows:[[[0,0,1.8],[10,4,1]],[[0,0,2],[9,0,1.1]]],drums:[hit('kick',[0,7,11],.09),hit('snare',[4,12],.034),hit('brush',[2,7,10,14],.016)],kit:'lounge-broken',form:[0,3,1,2,4,5,6,7],
    patches:voices('dark-keys','lounge-tines','dark-pad','folk-lute','lounge-sub'),
    description:'Low soft keys and a gentle electric-key reply leave long spaces over rounded bass and an understated broken beat.'}),
  character(20,'Velvet rotor','Velvet key lounge',86,MIXO,{
    progression:n('0 0 3 0 1 3 4 0'),theme:n('0 2 4 3 1 2 3 4 2 3 1 0 2 1 0 0'),reply:n('4 3 2 1 3 1 2 0'),
    calls:[[2,8,12],[0,8],[2,10],[4]],responses:[4,12],gate:1.4,swing:.22,voicing:[0,2,6],plucks:[6],
    bassRows:[[[0,0,1.7],[8,4,1.3]],[[0,0,1.5],[6,2,1.5]]],drums:[hit('kick',[0,10],.08),hit('snare',[4,12],.03),hit('brush',[0,2,6,8,10,14],.014)],kit:'lounge-brush',form:[0,1,2,4,3,6,5,7],
    patches:voices('lounge-tines','folk-lute','silk-pad','lounge-felt','lounge-upright'),
    description:'Rounded electric-key sentences and soft plucked replies sit above a gentle bass walk and restrained brushed pocket.'}),
  character(21,'Porcelain pond','Quiet felt-key lounge',72,LYDIAN,{
    progression:n('0 0 3 0 2 5 4 0'),theme:n('4 2 3 4 6 4 3 2 4 3 2 1 2 1 0 0'),reply:n('6 4 2 3 1 2 1 0'),
    calls:[[0,10],[4],[0,8],[6]],responses:[6],gate:1.8,swing:0,voicing:[0,4,6],plucks:[12],
    bassRows:[[[0,0,3.2]],[[0,0,2.8]]],drums:[hit('kick',[0],.06),hit('rim',[10],.016),hit('brush',[6,14],.011)],kit:'lounge-brush',form:[0,4,1,2,3,5,6,7],
    patches:voices('lounge-felt','lounge-tines','silk-pad','folk-lute','lounge-sub'),
    description:'Widely spaced felt-key notes and a quiet tine response drift over warm sustained chords and patient low bass.'}),
  character(22,'Cassette balcony','Warm downtempo keys',80,DORIAN,{
    progression:n('0 0 3 0 5 1 4 0'),theme:n('0 2 3 4 2 1 0 2 3 4 2 1 3 2 1 0'),reply:n('4 3 1 2 0 2 1 0'),
    calls:[[3,10],[1,8],[0,6,12],[5]],responses:[5,13],gate:1.35,swing:.18,voicing:[0,2,6],plucks:[6],
    bassRows:[[[0,0,2],[10,4,.95]],[[0,0,1.8],[8,2,1.2]]],drums:[hit('kick',[0,7,10],.087),hit('snare',[4,12],.033),hit('brush',[2,6,10,14],.015)],kit:'lounge-pocket',form:[0,1,4,3,2,5,6,7],
    patches:voices('lounge-tines','lounge-felt','dark-pad','folk-lute','lounge-sub'),
    description:'Warm electric keys and felt-key answers rest in a soft downtempo pocket, with a rounded low foundation and quiet plucks.'}),
  character(23,'Starlit terminal','Airy late-night lounge',66,LYDIAN,{
    progression:n('0 0 2 0 5 3 4 0'),theme:n('0 4 6 4 3 2 4 3 6 4 3 2 3 1 2 0'),reply:n('6 4 3 2 4 2 1 0'),
    calls:[[2],[8],[0,10],[6]],responses:[6],gate:2.1,swing:0,voicing:[0,4,6],plucks:[12],
    bassRows:[[[0,0,3.3]],[[0,0,3]]],drums:[hit('kick',[0],.055),hit('brush',[6,14],.01)],kit:'lounge-brush',form:[0,4,2,1,3,6,5,7],
    patches:voices('dark-keys','lounge-tines','silk-pad','folk-lute','lounge-sub'),
    description:'Soft low keys and a distant electric-key answer unfold over airy chords, long bass notes and almost absent drums.'}),
  character(24,'Citrus checkpoint','Sunny mellow keys',96,MAJOR,{
    progression:n('0 3 4 0 5 1 4 0'),theme:n('0 2 4 3 4 6 4 2 3 4 2 1 2 1 0 0'),reply:n('4 6 3 2 4 2 1 0'),
    calls:[[0,7,12],[2,10],[0,6,12],[4]],responses:[4,12],gate:1.2,swing:.1,voicing:[0,2,6],plucks:[8],
    bassRows:[[[0,0,1.5],[8,4,1.5]],[[0,0,1.8],[10,2,1]]],drums:[hit('kick',[0,6,10],.085),hit('snare',[4,12],.033),hit('brush',[2,6,10,14],.015)],kit:'lounge-pocket',form:[0,1,3,2,6,4,5,7],
    patches:voices('lounge-tines','lounge-felt','silk-pad','folk-lute','round-bass'),
    description:'A sunny electric-key tune and felt-key answer keep their warmth above a light bass groove and soft brush strokes.'}),
  character(25,'Walnut room','Fireside key lounge',82,DORIAN,{
    progression:n('0 0 3 0 1 5 4 0'),theme:n('4 3 1 2 3 4 2 0 2 3 4 2 3 1 2 0'),reply:n('4 3 2 0 1 2 1 0'),
    calls:[[2,8],[0,6,12],[3,10],[5]],responses:[5,13],gate:1.55,swing:.14,voicing:[0,2,6],plucks:[10],
    bassRows:[[[0,0,1.8],[8,4,1.3]],[[0,0,1.7],[9,2,1.1]]],drums:[hit('kick',[0,10],.074),hit('rim',[4,12],.02),hit('brush',[6,14],.013)],kit:'lounge-wood',form:[0,2,1,4,3,5,6,7],
    patches:voices('lounge-felt','lounge-tines','dark-pad','folk-lute','lounge-upright'),
    description:'A low felt-key melody and mellow tine reply make a small, warm lounge ensemble with soft plucks and upright bass.'}),
  character(26,'Quartz arcade','Soft electric-key lounge',88,LYDIAN,{
    progression:n('0 2 3 0 5 3 4 0'),theme:n('0 4 3 2 4 6 4 3 2 3 4 2 3 1 2 0'),reply:n('6 4 3 1 2 4 1 0'),
    calls:[[1,8],[3,10],[0,6,12],[5]],responses:[5,13],gate:1.35,swing:.08,voicing:[0,2,6],plucks:[10],
    bassRows:[[[0,0,1.7],[8,4,1.2]],[[0,0,2],[10,0,1.1]]],drums:[hit('kick',[0,7,12],.08),hit('snare',[4,12],.03),hit('brush',[2,6,10,14],.014)],kit:'lounge-pocket',form:[0,3,2,1,4,5,6,7],
    patches:voices('lounge-tines','lounge-felt','silk-pad','folk-lute','lounge-upright'),
    description:'Mellow electric keys and a felt-key response replace bright arcade tones, with soft chords and a relaxed rounded bass line.'}),
  character(27,'Mossy courtyard','Mellow plucked lounge',74,MIXO,{
    progression:n('0 0 3 0 6 3 4 0'),theme:n('0 2 4 3 1 2 0 1 3 4 2 1 2 1 0 0'),reply:n('4 2 3 1 0 2 1 0'),
    calls:[[0,8],[2,10],[1,7,12],[5]],responses:[5,13],gate:1.4,swing:.08,voicing:[0,4,6],plucks:[10],
    bassRows:[[[0,0,2],[10,4,.9]],[[0,0,1.8],[8,2,1.2]]],drums:[hit('hand',[0,8],.034),hit('rim',[4,12],.017),hit('brush',[2,6,10,14],.012)],kit:'lounge-wood',form:[0,1,4,2,3,6,5,7],
    patches:voices('folk-lute','lounge-tines','silk-pad','lounge-felt','lounge-upright'),
    description:'Rounded plucked phrases and soft electric-key answers settle over warm chords and an easy hand-percussion courtyard groove.'}),
  character(28,'Lowlight diner','Deep cosy lounge',82,MINOR,{
    progression:n('0 0 5 0 3 1 4 0'),theme:n('0 1 3 2 0 2 4 3 2 0 1 2 3 1 2 0'),reply:n('4 1 0 3 2 0 1 0'),
    calls:[[3,11],[6],[1,9],[7]],responses:[7,13],gate:1.65,swing:.16,voicing:[0,2,6],plucks:[6],
    bassRows:[[[0,0,2.2],[11,0,.8]],[[0,0,2.4],[12,4,.65]]],drums:[hit('kick',[0,7,11],.09),hit('snare',[4,12],.036),hit('brush',[2,6,10,14],.016)],kit:'lounge-broken',form:[0,4,1,3,2,5,6,7],
    patches:voices('dark-keys','lounge-felt','dark-pad','folk-lute','lounge-sub'),
    description:'Low warm key calls and quiet felt-key replies leave room for deep bass and a slow, soft broken pocket.'}),
  character(29,'Silver promenade','Soft lounge waltz',92,MAJOR,{
    meter:12,progression:n('0 5 4 0 3 1 4 0'),theme:n('4 2 0 2 3 4 2 1 2 4 3 1 2 1 0 0'),reply:n('4 2 3 1 2 0 1 0'),
    calls:[[0,6],[2,8],[0,4,8],[4]],responses:[4,9],gate:1.25,swing:.045,voicing:[0,2,6],plucks:[4],
    bassRows:[[[0,0,1.35],[8,4,.6]],[[0,0,1.5],[6,2,.9]]],drums:[hit('kick',[0],.073),hit('snare',[4,8],.026),hit('brush',[2,6,10],.013)],kit:'lounge-brush',form:[0,2,1,3,6,4,5,7],
    patches:voices('lounge-felt','lounge-tines','silk-pad','folk-lute','lounge-upright'),
    description:'A soft felt-key waltz and mellow tine reply promenade over quiet sustained harmony and a light three-beat bass step.'}),
  character(30,'Sunrise continue','Soft morning keys',94,MAJOR,{
    progression:n('0 0 3 0 5 3 4 0'),theme:n('0 2 4 3 2 3 4 2 1 3 2 0 2 1 0 0'),reply:n('4 3 2 1 3 2 1 0'),
    calls:[[0,8],[2,10],[0,6,12],[4]],responses:[4,12],gate:1.5,swing:.12,voicing:[0,2,6],plucks:[6],
    bassRows:[[[0,0,1.8],[8,4,1.4]],[[0,0,2],[10,2,1]]],drums:[hit('kick',[0,8],.082),hit('snare',[4,12],.03),hit('brush',[2,6,10,14],.014)],kit:'lounge-brush',form:[0,1,2,3,6,5,4,7],
    patches:voices('lounge-felt','lounge-tines','silk-pad','folk-lute','lounge-upright'),
    description:'An unhurried felt-key melody and one mellow electric-key answer greet the morning above quiet plucks, rounded upright bass and brushes.'}),
]);
