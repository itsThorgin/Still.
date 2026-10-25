// Original drum and bass synthesis. The clean sub has its own phase; filtered
// upper harmonics can move without cancelling or wobbling the fundamental.
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const SIZE=2048,TABLES=new Map();
function bassTable(shape,count) {
  const key=shape+count;if(TABLES.has(key))return TABLES.get(key);
  const weights=Array.from({length:count},(_,i)=>{
    const n=i+1;return (shape==='pulse'?Math.sin(n*Math.PI*0.37):n%2?1:0.5)/n**1.35;
  });
  const norm=weights.reduce((sum,x)=>sum+Math.abs(x),0),table=new Float32Array(SIZE+1);
  for(let i=0;i<=SIZE;i++)for(let n=1;n<=count;n++)table[i]+=Math.sin(TAU*n*i/SIZE)*weights[n-1]/norm;
  TABLES.set(key,table);return table;
}
function lookup(table,phase){const x=phase*SIZE,i=Math.floor(x);return table[i]+(table[i+1]-table[i])*(x-i);}

export function createRhythmBass(event, rate, gate, identity, tempo) {
  const release = Math.min(0.065, 60 / tempo * 0.16);
  const count=[1,2,4,8,12].filter(n=>n*event.frequency*1.012<rate*0.4).at(-1)??1;
  return { ...event, rhythmBass: true, rate, gate, duration: gate + release, release,
    age: -Math.round((event.delay ?? 0) * 60 / tempo * rate),
    phase: 0, phase2: identity, phase3: (identity + 0.23) % 1, bassMotionPhase:identity,
    low: 0, low2: 0, midLow: 0, coefficient: 0.1, left: 0, right: 0,
    // Reserve room for detuning; do not synthesize partials above this ceiling.
    count,table:bassTable(event.bassShape,count) };
}

export function sampleRhythmBass(v, frame, beats, brightness, movement) {
  const age = v.age / v.rate, reese = v.bassShape === 'reese', pulse = v.bassShape === 'pulse';
  if (frame % 32 === 0 || v.age === 0) {
    const motion = 0.5 + 0.5 * Math.sin(TAU * (beats * (v.motionRate ?? 0.25) + v.bassMotionPhase));
    const cutoff = Math.min(v.rate * 0.32, 180 + brightness * (v.cutoffCeiling ?? 1100) * (0.45 + movement * motion * 0.55));
    v.coefficient = 1 - Math.exp(-TAU * cutoff / v.rate);
    v.midCoefficient = 1 - Math.exp(-TAU * Math.min(170, v.rate * 0.1) / v.rate);
  }
  const sub = Math.sin(TAU * v.phase);
  const mid=lookup(v.table,v.phase2)*0.6+lookup(v.table,v.phase3)*0.4;
  v.low += v.coefficient * (mid - v.low); v.low2 += v.coefficient * (v.low - v.low2);
  v.midLow += v.midCoefficient * (v.low2 - v.midLow);
  const upper = Math.tanh((v.low2 - v.midLow) * (reese ? 2.2 : pulse ? 1.8 : 1.2));
  const attack = smooth(age / (v.attack ?? 0.006));
  const release = smooth((v.gate + v.release - age) / v.release);
  const choke = v.chokeAge === undefined ? 1 : smooth(1 - (v.age - v.chokeAge) / (v.rate * 0.015));
  // Bass is a held instrument, rather than a short struck pluck. Gentle decay
  // retains definition, while the separate release prevents hard gate clicks.
  const body = v.bassShape === 'sub' ? 0.84 : 0.76;
  const envelope = attack * release * choke * (0.78 + 0.22 * Math.exp(-age / 0.13));
  v.left = v.right = (sub * body + upper * (reese ? 0.48 : pulse ? 0.36 : 0.22)) * envelope;
  v.phase = (v.phase + v.frequency / v.rate) % 1;
  const detune = reese ? 0.003 + movement * 0.002 : 0.0008;
  v.phase2 = (v.phase2 + v.frequency * (1 + detune) / v.rate) % 1;
  v.phase3 = (v.phase3 + v.frequency * (1 - detune) / v.rate) % 1;
  v.age++;
}

export function createRhythmDrum(event, rate, identity, tempo) {
  const beat = 60 / tempo, techno = event.rhythmKit === 'techno';
  const deep = event.kickShape === 'deep', hard = event.kickShape === 'drive';
  const duration = event.drum === 'kick' ? clamp(beat * (deep ? 0.88 : hard ? 0.82 : techno ? 0.72 : 0.46), 0.12, 0.43)
    : event.duration ?? ({ snare: 0.19, clap: 0.19, hat: 0.045, 'open-hat': Math.min(0.18, beat * 0.38),
      rim: 0.07, tom: 0.27, conga: 0.22, ride: 0.24, crash: 0.65, metal: 0.17, shaker: 0.055 }[event.drum] ?? 0.1);
  return { ...event, rhythmDrum: true, collectionDrum: true, rate, duration, beat, techno, deep, hard,
    age: -Math.round((event.delay ?? 0) * beat * rate), phase: 0, phase2: identity,
    randomState: Math.floor(identity * 4294967295) || 1, low: 0, band: 0,
    lowCoefficient: 1 - Math.exp(-TAU * Math.min(9500, rate * 0.38) / rate),
    bandCoefficient: 1 - Math.exp(-TAU * Math.min(1800, rate * 0.18) / rate),
    metalPhases: Float64Array.from([0.11, 0.27, 0.43, 0.62, 0.78], x => (x + identity) % 1) };
}

export function sampleRhythmDrum(v) {
  const age = v.age / v.rate;
  let random = v.randomState; random ^= random << 13; random ^= random >>> 17; random ^= random << 5;
  v.randomState = random >>> 0;
  const noise = v.randomState / 2147483648 - 1;
  v.low += v.lowCoefficient * (noise - v.low); v.band += v.bandCoefficient * (v.low - v.band);
  const high = v.low - v.band;
  let wave = 0, frequency = 180;
  if (v.drum === 'kick') {
    const fundamental = v.kickFrequency ?? (v.deep ? 46 : v.hard ? 48 : v.techno ? 51 : 55);
    frequency = fundamental + (v.deep ? 95 : v.hard ? 155 : 135) * Math.exp(-age / 0.012);
    const body = Math.sin(TAU * v.phase), overtone = Math.sin(TAU * v.phase * 2) * 0.2 * Math.exp(-age / 0.045);
    const weight = Math.exp(-age / (v.duration * (v.deep ? 0.4 : 0.34)));
    wave = Math.tanh((body + overtone) * (v.hard ? 2.3 : 1.35)) * weight
      + Math.sin(TAU * age * 105) * Math.exp(-age / 0.025) * 0.16
      + high * (v.deep ? 0.1 : 0.2) * Math.exp(-age / 0.004);
  } else if (v.drum === 'snare' || v.drum === 'clap') {
    frequency = (v.tuning ?? 1) * (v.techno ? 175 : 185);
    const burst = v.drum === 'clap' && age < 0.03 ? 0.25 + 0.75 * Math.sin(TAU * age * 95) ** 2 : 1;
    wave = high * 1.1 * burst * Math.exp(-age / (v.duration * 0.32))
      + Math.sin(TAU * v.phase) * (v.drum === 'snare' ? 0.52 : 0.2) * Math.exp(-age / 0.038)
      + Math.sin(TAU * v.phase2) * 0.17 * Math.exp(-age / 0.021);
  } else if (['tom', 'conga', 'rim'].includes(v.drum)) {
    frequency = (v.drum === 'rim' ? 390 : v.drum === 'conga' ? 175 : 102) * (v.tuning ?? 1) * (1 + 0.27 * Math.exp(-age / 0.022));
    wave = (Math.sin(TAU * v.phase) + Math.sin(TAU * v.phase2) * 0.3) * Math.exp(-age / (v.duration * 0.3))
      + high * 0.12 * Math.exp(-age / 0.005);
  } else {
    let metal = 0;
    for (let i = 0; i < v.metalPhases.length; i++) {
      const f = Math.min([2341, 3079, 4193, 5471, 6911][i] * (v.drum === 'ride' ? 0.8 : 1), v.rate * 0.4);
      metal += Math.sin(TAU * v.metalPhases[i]) * Math.sin(TAU * ((v.metalPhases[i] * 1.73) % 1)) / 5;
      v.metalPhases[i] = (v.metalPhases[i] + f / v.rate) % 1;
    }
    wave = (high * 0.72 + metal * 0.36) * Math.exp(-age / (v.duration * (v.drum === 'crash' ? 0.35 : 0.27)));
  }
  v.phase = (v.phase + frequency / v.rate) % 1;
  v.phase2 = (v.phase2 + frequency * (v.drum === 'snare' ? 1.86 : 1.47) / v.rate) % 1;
  const gain = smooth(age / 0.001) * smooth((v.duration - age) / 0.015);
  v.age++;
  return wave * gain * v.amplitude;
}
