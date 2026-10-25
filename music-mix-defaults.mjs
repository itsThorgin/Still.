// Shared starting mix for each music family. Variations always return to this
// baseline rather than treating the last random result as the next preset.
const BASE = { melody:55, accompaniment:60, bass:70, percussion:65, brightness:55, movement:45, pump:35, space:35, width:75 };
const MIXES = {
  bassmusic:{melody:45,movement:55,pump:25,space:30},
  ambient:{melody:42,accompaniment:65,bass:65,percussion:0,brightness:45,movement:55,pump:12,space:55,width:80},
  fantasy:{melody:42,accompaniment:45,bass:48,percussion:30,brightness:48,movement:30,pump:0,space:42,width:72},
  lounge:{melody:30,accompaniment:52,bass:64,percussion:38,brightness:48,movement:30,pump:12,space:28,width:70},
  techno:{melody:46,accompaniment:42,bass:74,percussion:78,brightness:62,movement:60,pump:62,space:28,width:72},
};
export function musicMixDefaults(kind) { return {...BASE,...MIXES[kind]}; }
