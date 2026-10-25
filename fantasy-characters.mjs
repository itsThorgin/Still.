

const modes={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],lydian:[0,2,4,6,7,9,11],phrygian:[0,1,3,5,7,8,10],mixo:[0,2,4,5,7,9,10]};
const numbers=s=>s.split(' ').map(Number);
function freeze(x){if(x&&typeof x==='object'){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;}


const settlements=[
  [1,'Hearthside tales','Tavern waltz',88,'major','waltz','flute','0 3 4 0 0 3 4 0','0 2 4 2 3 4 5 3 4 3 2 1 2 1 0 0','4 5 4 2 3 2 1 0','A returning recorder waltz, lyre upbeats and a root–fifth bass keep a warm three-beat hearth dance.'],
  [2,'Lantern village','Pastoral folk',76,'major','pastoral','viola','0 5 3 4 0 5 4 0','4 3 2 0 2 4 5 4 3 2 1 3 2 1 0 0','2 3 4 2 1 2 1 0','A gentle viola tune and recorder answer share long breaths over settled village chords.'],
  [3,'Quiet sanctuary','Chapel hymn',62,'lydian','hymn','chapel','0 0 3 0 5 3 4 0','0 2 4 4 6 4 3 2 4 3 2 1 2 1 0 0','4 6 4 2 3 2 1 0','An unhurried organ hymn resolves onto resting tones, with sparse lyre and choir support.'],
  [16,'Cider lanterns','Tavern jig',94,'mixo','jig','reeds','0 3 0 4 0 6 4 0','0 2 4 3 2 0 1 2 4 6 4 2 3 1 2 0','4 2 3 1 2 1 0 0','A lilting double-reed jig and dulcimer replies follow a steady two-part dance step.'],
  [17,'Willow kitchens','Village chamber folk',78,'major','pastoral','guitar','0 5 1 4 3 5 4 0','2 4 3 2 0 2 3 4 5 4 2 3 1 2 1 0','4 3 1 2 0 1 2 0','Muted nylon strings carry a domestic folk melody answered by a soft viola.'],
  [18,'Pilgrim chapel','Sacred air',58,'lydian','hymn','chapel','0 3 0 4 5 3 4 0','4 6 7 6 4 3 2 4 3 2 0 1 2 1 0 0','6 4 3 2 4 2 1 0','A broad organ air and restrained choir sustain a calm chapel cadence.'],
  [31,'Oakbeam inn','Rustic dance',96,'mixo','reel','reeds','0 0 3 4 0 6 4 0','0 0 2 4 3 2 1 2 4 3 4 6 2 1 0 0','4 6 5 4 3 2 1 0','A compact reed refrain returns over dry wooden taps and buoyant plucked strings.'],
  [32,'Bakers dawn','Morning folk',82,'major','walk','flute','0 3 5 4 0 3 4 0','2 0 2 4 5 4 3 2 4 2 3 1 0 2 1 0','5 4 2 3 2 1 2 0','A light recorder melody, lyre figures and regular walking bass greet the waking village.'],
  [33,'Silver harvest','Harvest circle',100,'major','jig','dulcimer','0 3 1 4 5 3 4 0','4 2 0 2 3 5 4 3 2 4 6 4 3 2 1 0','6 4 5 3 4 2 1 0','Hammered strings lead a rounded harvest dance with a clear refrain and reed answers.'],
  [34,'Abbey garden','Quiet cloister',66,'dorian','air','viola','0 3 0 6 0 3 4 0','0 3 2 4 6 4 3 2 1 3 4 2 3 1 0 0','4 3 6 4 2 3 1 0','A slow bowed air and soft recorder reply rest on open strings and measured low notes.'],
  [35,'Copper kettle','Fireside strings',84,'major','waltz','guitar','0 5 3 4 0 1 4 0','4 4 2 3 5 4 3 1 2 0 2 4 3 1 2 0','5 3 4 2 3 1 0 0','A nylon-string waltz leaves room between phrases for viola answers and quiet bass steps.'],
  [36,'Market ribbons','Market reel',104,'mixo','reel','flute','0 6 3 0 5 3 4 0','0 2 3 4 6 4 2 3 4 5 4 2 1 3 2 0','6 4 2 4 3 2 1 0','Recorder phrases and bright lyre responses turn around a repeated market-day reel.'],
  [37,'Snowbound hearth','Winter lullaby',60,'major','lullaby','guitar','0 5 3 0 1 3 4 0','2 4 2 0 3 2 1 0 4 3 2 4 2 1 0 0','4 2 3 1 2 0 1 0','A sparse guitar lullaby and warm low strings settle gently at each phrase ending.'],
  [38,'Kings courtyard','Court pavane',80,'major','pavane','court','0 3 1 4 0 5 4 0','0 4 2 4 5 3 4 2 6 4 3 2 1 2 1 0','4 5 6 4 3 2 1 0','A stately viola pavane and low horn response follow measured courtly steps.'],
  [39,'Homeward bells','Evening benediction',64,'mixo','hymn','chapel','0 6 3 0 0 3 4 0','4 3 2 0 2 3 4 6 5 4 3 2 3 1 2 0','6 5 4 3 2 1 0 0','An evening organ melody and widely spaced lyre notes resolve into a quiet homecoming.'],
];
const wilderness=[
  [4,'Greenwood path','Woodland walk',92,'dorian','walk','flute','0 3 0 6 0 5 4 0','0 2 3 4 6 4 3 2 1 3 4 2 3 1 2 0','4 3 2 0 3 2 1 0','A recurring recorder walking tune meets lyre offbeats and steady trail footsteps.'],
  [5,'Highland crossing','Highland air',98,'minor','air','highland','0 6 3 4 0 5 4 0','0 4 7 6 4 3 2 0 2 4 6 4 3 2 1 0','7 6 4 3 4 2 1 0','A climbing reed air and broad horn replies share an open three-beat mountain pulse.'],
  [6,'Harbour voyage','Seafaring jig',104,'dorian','sea','reeds','0 3 6 0 5 3 4 0','4 4 6 4 2 0 2 3 4 6 7 6 4 2 1 0','6 4 3 2 4 1 2 0','A rolling reed refrain follows a regular compound step, with lyre and bass moving together.'],
  [19,'Bracken trail','Woodland folk',96,'dorian','reel','flute','0 3 1 4 0 5 4 0','0 2 3 6 4 2 1 0 3 4 2 0 1 2 1 0','4 2 3 1 0 2 1 0','Nimble recorder and lyre phrases ride a clear walking pulse through the bracken.'],
  [20,'Windward ridge','Mountain procession',90,'mixo','air','highland','0 6 3 0 4 3 4 0','0 4 6 7 6 4 3 1 4 6 7 4 2 3 1 0','7 4 3 1 2 4 1 0','A broad double-reed melody and low horn echo cross a steady mountain procession.'],
  [21,'Saffron caravan','Desert caravan',108,'phrygian','caravan','dulcimer','0 1 0 4 3 0 4 0','0 1 4 3 1 0 1 0 4 5 4 3 1 2 1 0','4 3 1 0 3 1 2 0','A recurring dulcimer motif and dry hand-drum cycle keep the caravan moving in one direction.'],
  [40,'Fernway scouts','Forest scouting',100,'dorian','walk','guitar','0 0 3 4 5 3 4 0','0 3 4 2 1 3 4 6 4 3 1 2 0 2 1 0','6 4 3 2 3 1 2 0','Short guitar calls and recorder answers keep a light scouting tread with clear four-bar breaths.'],
  [41,'Amber dunes','Desert crossing',94,'phrygian','caravan','reeds','0 1 3 0 5 1 4 0','4 3 1 0 1 3 4 5 4 1 0 1 3 2 1 0','5 4 3 1 4 2 1 0','A close reed melody, repeated lyre strokes and a measured caravan drum cycle cross the dunes.'],
  [42,'River ferry','River folk',86,'major','sea','guitar','0 3 5 4 0 1 4 0','2 4 5 4 3 2 0 2 4 3 2 1 3 2 1 0','5 4 3 2 0 2 1 0','A swaying guitar tune and recorder echo follow the ferry with a restrained rolling bass.'],
  [43,'Cloudpeak ascent','Mountain climbing',102,'minor','pavane','highland','0 5 3 4 0 6 4 0','0 2 4 6 7 6 4 3 2 4 5 4 3 1 2 0','7 6 4 2 4 3 1 0','A rising reed sentence and horn answer build across patient, regular climbing steps.'],
  [44,'Meadow riders','Open-road canter',112,'mixo','gallop','viola','0 3 6 4 0 5 4 0','0 4 2 3 4 6 4 2 3 5 4 3 2 1 2 0','6 4 5 3 4 2 1 0','Bowed-string figures and recorder calls share a repeating canter with the low strings.'],
  [45,'Rainwood shelter','Forest rain shelter',70,'dorian','lullaby','guitar','0 3 5 0 1 3 4 0','4 2 0 1 3 2 1 0 2 4 3 1 2 1 0 0','4 3 2 1 3 2 1 0','A quiet guitar air and viola response pause beneath sustained woodland harmony.'],
  [46,'Northstar road','Night travelling',82,'minor','walk','viola','0 6 5 4 0 3 4 0','0 2 4 3 2 1 0 2 4 6 5 4 3 1 2 0','6 5 4 2 3 2 1 0','A low viola theme and recorder answer repeat above calm night-road footsteps.'],
  [47,'Gullwing passage','Ocean voyage',110,'mixo','sea','reeds','0 6 3 4 5 3 4 0','4 6 7 4 3 2 4 6 5 4 2 3 1 2 1 0','7 6 4 3 2 4 1 0','A lifted reed refrain and lyre reply keep a consistent rolling seafaring dance.'],
  [48,'Oldstone bridge','Roadside procession',88,'major','pavane','court','0 5 1 4 3 5 4 0','0 2 4 5 4 2 3 1 2 4 3 2 1 3 2 0','5 4 2 3 1 2 1 0','A measured viola procession crosses warm chord changes with horn answers and plucked bass.'],
];
const magic=[
  [7,'Moonlit ruins','Ancient mystery',70,'minor','spell','harp','0 5 3 4 0 1 4 0','0 4 3 1 0 2 3 4 6 4 2 1 3 2 1 0','4 6 4 3 1 2 1 0','A complete lyre phrase appears between patient silences, answered by low recorder and soft choir.'],
  [8,'Arcane library','Arcane chamber',82,'lydian','spell','celestial','0 2 3 0 5 3 4 0','0 4 6 7 6 4 2 3 4 6 7 4 3 2 1 0','7 6 4 3 4 2 1 0','Measured thumb-piano constellations return as one tune over suspended chamber strings.'],
  [9,'Fey glade','Enchanted waltz',90,'lydian','fey','flute','0 3 2 4 0 5 4 0','7 6 4 2 3 4 6 7 6 4 3 1 2 4 1 0','6 7 4 6 3 2 1 0','A graceful recorder waltz and lyre responses balance bright harmony with clear phrase endings.'],
  [22,'Astral observatory','Celestial mystery',74,'lydian','spell','celestial','0 2 5 3 0 3 4 0','0 4 6 7 9 7 6 4 3 4 6 4 2 3 1 0','9 7 6 4 3 2 1 0','A returning thumb-piano star motif and a single dark chime answer float above quiet choir.'],
  [23,'Mirror well','Reflective chamber',68,'dorian','lullaby','mirror','0 5 3 0 1 3 4 0','4 2 0 1 3 4 6 4 2 0 1 3 2 1 2 0','6 4 3 1 2 0 1 0','A bowed melody and hollow bowl response reflect each other over slow, resolved harmony.'],
  [24,'Thistle court','Fey dance',102,'lydian','fey','harp','0 3 2 5 1 3 4 0','7 6 4 2 3 6 7 6 4 3 1 2 4 2 1 0','7 9 6 4 3 2 1 0','A small lyre dance and recorder answer follow a consistent triple step through the fey court.'],
  [49,'Starglass dome','Astral chamber',72,'lydian','hymn','celestial','0 3 2 0 5 3 4 0','4 6 7 9 7 6 4 3 2 4 6 4 3 1 2 0','9 6 7 4 3 2 1 0','A patient mallet melody repeats beneath the dome, with one chime at each answering cadence.'],
  [50,'Wisp lantern','Wandering enchantment',84,'dorian','spell','harp','0 3 5 4 0 6 4 0','0 3 4 6 4 3 1 2 4 2 3 1 0 2 1 0','6 4 2 3 1 2 1 0','Delicate lyre calls and soft recorder echoes make a recurring lantern-lit melody.'],
  [51,'Crystal orchard','Crystal dance',96,'lydian','fey','celestial','0 2 3 4 5 3 4 0','2 4 6 7 6 4 3 2 4 7 6 4 3 2 1 0','7 6 9 7 4 3 1 0','Wooden mallet phrases and lyre turns trace a light, regular three-beat dance.'],
  [52,'Sleeping spell','Enchanted lullaby',60,'major','lullaby','mirror','0 5 3 0 1 5 4 0','4 2 3 1 0 2 4 3 2 1 0 2 1 2 1 0','4 3 2 1 2 0 1 0','A soft viola lullaby closes each sentence before a hollow bowl answers in the silence.'],
  [53,'Moonwater rite','Lunar ritual',76,'dorian','ritual','ritual','0 3 0 6 5 3 4 0','0 4 3 2 1 3 4 6 4 2 0 1 3 2 1 0','6 4 1 3 2 0 1 0','A low organ chant and dulcimer response repeat over a measured three-beat ritual pulse.'],
  [54,'Foxglove masquerade','Fey masquerade',106,'mixo','fey','reeds','0 6 3 4 0 3 4 0','0 2 4 6 7 4 3 2 4 3 5 4 2 1 2 0','6 7 4 5 3 2 1 0','A dancing reed theme and lyre replies give the masquerade a clear recurring refrain.'],
  [55,'Runes in frost','Frozen mystery',64,'minor','spell','mirror','0 5 1 4 3 5 4 0','0 1 3 4 6 4 3 1 2 4 3 2 1 2 1 0','6 4 3 1 4 2 1 0','A restrained viola phrase, distant bowl and bowed roots leave long, intentional gaps.'],
  [56,'Aurora gate','Radiant chamber',80,'lydian','air','court','0 3 5 4 0 2 4 0','0 4 6 7 9 7 4 6 7 6 4 3 2 4 1 0','9 7 6 4 6 3 1 0','A broad string theme and quiet horn answer open onto luminous, resolved harmony.'],
  [57,'Alchemists clock','Clockwork enchantment',92,'dorian','mechanism','dulcimer','0 3 1 4 5 3 4 0','0 2 4 3 1 2 3 4 6 4 2 3 1 2 1 0','4 6 3 4 2 3 1 0','A precise dulcimer figure and muted-string reply lock to a regular wooden mechanism.'],
];
const dungeons=[
  [10,'Old catacombs','Dungeon suspense',64,'phrygian','dungeon','lowreed','0 0 1 0 3 1 4 0','0 1 0 -1 0 3 1 0 4 3 1 0 2 1 -1 0','4 1 0 3 1 -1 1 0','A low reed warning returns above open fifths and a single measured dungeon knock.'],
  [11,'Underground river','Subterranean passage',74,'dorian','ritual','harp','0 3 0 6 5 3 4 0','0 2 4 3 1 0 1 2 4 6 4 2 3 1 2 0','4 3 2 0 3 2 1 0','Low lyre droplets and recorder answers follow a steady three-beat subterranean flow.'],
  [12,'Forgotten vault','Ritual suspense',80,'minor','dungeon','ritual','0 5 1 0 3 5 4 0','0 0 4 1 0 2 3 1 4 3 1 0 2 1 -1 0','4 1 3 0 1 2 1 0','A low organ warning and dulcimer answer recur over measured roots and sparse wooden taps.'],
  [25,'Basalt stair','Low dungeon chamber',60,'phrygian','dungeon','lowreed','0 0 1 0 5 3 4 0','0 1 0 -1 3 1 4 1 0 -1 0 3 1 2 1 0','1 0 4 1 -1 0 1 0','A close low-reed motif and viola answer hold a deliberate pulse down the basalt stair.'],
  [26,'Sunken reliquary','Subterranean ritual',72,'minor','ritual','ritual','0 5 0 1 3 6 4 0','0 4 1 0 3 2 1 0 4 3 1 0 2 1 -1 0','4 1 0 3 1 2 1 0','An organ chant and dark hammered-string answer mark a slow, consistent ritual.'],
  [27,'Clockwork crypt','Mechanical suspense',84,'phrygian','mechanism','mechanical','0 1 0 3 5 0 4 0','0 0 1 4 1 0 3 1 0 4 1 0 2 1 -1 0','1 4 0 3 1 2 1 0','Clipped thumb-piano figures and muted guitar replies follow interlocking, regular wooden ticks.'],
  [58,'Obsidian door','Sealed chamber',58,'phrygian','dungeon','lowreed','0 1 0 0 3 1 4 0','0 3 1 0 -1 0 1 3 4 1 0 -1 1 2 1 0','3 1 4 0 1 -1 1 0','A low double reed returns to the same warning figure against widely spaced bass and drum.'],
  [59,'Mothlit tunnel','Tunnel passage',70,'minor','walk','viola','0 5 3 0 1 5 4 0','0 2 1 3 4 3 1 0 2 4 3 1 0 2 1 0','4 3 1 2 0 1 2 0','A hushed viola walking phrase and lyre response trace a cautious, regular tunnel tread.'],
  [60,'Ashen altar','Dark ritual',68,'phrygian','ritual','ritual','0 1 3 0 5 1 4 0','0 1 3 1 4 3 1 0 3 4 1 0 2 1 -1 0','4 3 1 4 1 0 1 0','An organ chant, hammered strings and low hand drums follow a restrained ceremonial cycle.'],
  [61,'Drowned archive','Sunken mystery',62,'minor','spell','mirror','0 5 1 4 0 3 4 0','4 1 0 2 3 4 2 1 0 3 1 2 1 0 -1 0','4 2 1 3 0 1 2 0','A slow bowed theme and bowl response resolve between long, still passages.'],
  [62,'Gears below','Dungeon mechanism',88,'phrygian','mechanism','mechanical','0 3 1 0 5 1 4 0','0 1 4 1 3 0 1 4 3 1 0 2 1 0 -1 0','4 1 3 0 2 1 -1 0','A repeating thumb-piano mechanism and dry guitar answer keep a precise low pulse.'],
  [63,'Hollow watch','Guarded corridor',78,'dorian','dungeon','viola','0 3 1 4 0 5 4 0','0 3 2 1 4 3 1 0 2 4 1 3 2 1 -1 0','4 2 3 1 0 2 1 0','A short viola watchword and low reed reply sit above sustained roots and patient knocks.'],
  [64,'Ember descent','Volcanic passage',86,'minor','pavane','lowreed','0 5 3 4 1 5 4 0','4 3 1 0 2 4 3 1 0 1 3 4 2 1 2 0','4 3 2 1 3 1 0 0','A descending reed phrase and bowed response advance with a heavy but measured tread.'],
  [65,'Spider silk hall','Quiet pursuit',82,'phrygian','mechanism','guitar','0 1 0 4 3 1 4 0','1 0 3 1 4 1 0 3 1 2 0 1 3 2 1 0','4 1 2 0 3 1 -1 0','Muted guitar figures and short viola answers leave space around a precise wooden pulse.'],
  [66,'Buried crown','Ancient tomb',66,'minor','hymn','ritual','0 5 3 0 1 3 4 0','0 4 3 1 2 0 1 3 4 2 1 0 3 2 1 0','4 3 1 2 3 1 -1 0','A restrained organ lament and dulcimer response settle over long bowed roots.'],
];
const combat=[
  [13,'Border skirmish','Skirmish march',116,'dorian','march','battleStrings','0 0 3 4 0 5 4 0','0 0 2 4 3 2 4 3 0 2 3 4 2 1 2 0','4 4 6 4 3 2 1 0','Short string ostinatos, a recurring horn call and downbeat-aligned war drums give the skirmish a clear march.'],
  [14,'Siege at dusk','Siege march',112,'minor','siege','battleHorn','0 5 3 4 0 5 4 0','0 0 4 3 1 0 2 1 0 3 4 3 2 1 0 0','4 3 1 0 3 2 1 0','Heavy low horn phrases and measured string answers follow broad bass steps and paired siege drums.'],
  [15,'Last banner','Heroic battle',126,'minor','rally','battleHorn','0 5 3 4 0 3 4 0','0 4 7 6 4 3 2 4 7 6 4 3 2 1 2 0','7 6 4 2 3 4 1 0','A rising horn banner returns over a steady triple battle pulse and coordinated string support.'],
  [28,'Falcon vanguard','Mobile skirmish',120,'dorian','gallop','battleStrings','0 3 0 4 5 3 4 0','0 2 4 3 0 2 4 6 4 3 2 4 3 1 2 0','6 4 3 2 4 2 1 0','Clipped string figures and horn replies lock to a repeated canter shared by the bass and low drums.'],
  [29,'Ironwood breach','Siege brass',118,'phrygian','siege','battleHorn','0 1 0 4 3 1 4 0','0 1 4 1 0 3 1 0 4 3 1 0 2 1 0 0','4 1 0 3 4 2 1 0','A low horn breach motif, open string fifths and a deliberate siege march replace scattered impacts.'],
  [30,'Dawn standard','Heroic rally',132,'dorian','rally','battleHorn','0 3 5 4 0 6 4 0','0 4 6 7 4 3 2 4 7 6 4 3 2 1 2 0','7 6 4 3 4 2 1 0','A clear horn rally and string answer rise above a consistent three-beat war-drum pattern.'],
  [67,'Shieldwall oath','Shieldwall march',108,'minor','march','battleHorn','0 0 5 4 3 5 4 0','0 0 4 4 3 1 0 2 4 3 2 1 0 2 1 0','4 4 3 1 2 3 1 0','A grounded horn oath and measured strings reinforce the shieldwall with regular low drum accents.'],
  [68,'Crimson riders','Cavalry charge',136,'minor','charge','battleStrings','0 5 3 4 0 6 4 0','0 2 4 7 6 4 3 2 4 6 7 4 3 2 1 0','7 4 6 3 4 2 1 0','A driving string canter and short horn signals make a repeated cavalry phrase with a clear return.'],
  [69,'Duel on stone','Measured duel',122,'dorian','duel','battleStrings','0 3 1 4 0 5 4 0','0 3 2 4 1 3 4 2 0 2 4 3 1 2 1 0','4 6 3 2 4 1 2 0','Short bowed calls and deliberate horn responses leave tactical rests over a disciplined duelling pulse.'],
  [70,'Citadel drums','Fortress defence',104,'phrygian','siege','battleHorn','0 1 3 0 5 1 4 0','0 0 1 4 3 1 0 1 4 1 3 0 2 1 0 0','4 3 1 4 1 2 1 0','Broad horn warnings, open low strings and slow paired drums mark a coherent fortress defence.'],
  [71,'Storm pennant','Battlefield advance',128,'dorian','march','battleStrings','0 3 5 4 0 3 4 0','0 4 3 2 4 6 4 3 2 0 3 4 2 1 2 0','6 4 3 4 2 3 1 0','A rising string refrain and low horn answer advance together with the marching bass and drums.'],
  [72,'Dragons last watch','Great foe',114,'minor','siege','battleHorn','0 5 1 4 3 5 4 0','0 4 1 0 3 4 6 4 1 3 2 0 2 1 0 0','6 4 3 1 4 2 1 0','A grave horn theme and restrained string response unfold over heavy, regular steps before the foe.'],
  [73,'Spearpoint run','Fast pursuit',140,'dorian','charge','battleStrings','0 0 3 4 5 3 4 0','0 2 3 4 6 4 2 3 4 3 1 2 3 2 1 0','6 4 2 4 3 1 2 0','A nimble repeated string motif, clipped horn calls and a tight canter sustain the pursuit.'],
  [74,'Ashfield retreat','Fighting withdrawal',110,'minor','duel','battleStrings','0 5 3 4 1 5 4 0','4 3 2 0 1 3 4 2 3 1 0 2 1 2 1 0','4 3 1 2 3 1 -1 0','Descending string sentences and low horn answers keep a deliberate retreat pulse with space to breathe.'],
  [75,'Crown of dawn','Victorious charge',130,'major','rally','battleHorn','0 3 5 4 0 1 4 0','0 4 7 6 5 4 2 3 4 6 7 4 3 2 1 0','7 6 5 4 3 2 1 0','A bright returning horn theme, bowed-string answers and a firm triple pulse carry the final charge.'],
];

export const FANTASY_CHARACTERS=freeze([settlements,wilderness,magic,dungeons,combat].flatMap((rows,i)=>rows.map(row=>{
  const [value,label,genre,tempo,mode,rhythm,ensemble,chords,theme,reply,description]=row;
  const writing={rhythm,ensemble,chords:numbers(chords),theme:numbers(theme),reply:numbers(reply)};
  return {value,label,genre,tempo,scene:i+1,meter:['waltz','jig','sea','air','fey','ritual','rally'].includes(rhythm)?12:16,
    scale:modes[mode],tonic:i===3?[40,43,45]:[43,45,48],kit:i===4?'journey-battle':i===3?'journey-low':'journey-frame',
    description,theme:writing.theme,progression:writing.chords,
    fantasyWriting:writing};
})).sort((a,b)=>a.value-b.value));
