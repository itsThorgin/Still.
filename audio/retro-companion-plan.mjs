// Related adventure-game writing for the five companion characters.
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
export const COMPANION_FAMILIES = {
  1: {
    scale: MAJOR,
    progressions: [[0, 3, 0, 4, 1, 3, 4, 0], [0, 4, 3, 0, 1, 4, 3, 0]],
    bridge: [3, 0, 1, 4, 3, 0, 4, 0],
    rhythms: [[0, 4, 6, 10, 12], [0, 3, 8, 10, 14], [0, 4, 8, 11, 14]], arpeggio: [0, 6, 8, 14],
    motifs: [[0, 2, 1, 4, 2, 3, 1, 0], [0, 1, 2, 4, 3, 2, 4, 0]], answer: [4, 2, 1, 2, 0, 1, 2, 0],
    voicing: [0, 2, 4], bass: [0, 4], hats: [2, 6, 10, 14],
  },
  2: {
    scale: [0, 2, 4, 6, 7, 9, 11],
    progressions: [[0, 1, 0, 4, 0, 1, 4, 0], [0, 4, 1, 0, 1, 0, 4, 0]],
    bridge: [1, 0, 4, 0, 1, 0, 4, 0],
    rhythms: [[0, 6, 10], [0, 8, 12], [2, 6, 12]], arpeggio: [0, 8, 12],
    motifs: [[0, 4, 2, 5, 4, 2, 1, 0], [2, 4, 5, 4, 2, 1, 4, 0]], answer: [4, 5, 4, 2, 1, 2, 4, 0],
    voicing: [0, 4, 8], bass: [0], hats: [6, 14],
  },
  3: {
    scale: MAJOR,
    progressions: [[0, 4, 3, 0, 1, 4, 3, 0], [0, 3, 4, 0, 3, 1, 4, 0]],
    bridge: [3, 0, 3, 4, 1, 3, 4, 0],
    rhythms: [[0, 2, 6, 8, 11, 14], [0, 3, 6, 10, 12], [0, 4, 7, 8, 12, 14]], arpeggio: [0, 3, 6, 8, 11, 14],
    motifs: [[0, 2, 4, 2, 1, 4, 2, 0], [0, 1, 4, 2, 5, 4, 1, 0]], answer: [4, 2, 4, 1, 2, 0, 1, 0],
    voicing: [0, 2, 4], bass: [0, 4], hats: [0, 3, 6, 8, 11, 14],
  },
  4: {
    scale: MAJOR,
    progressions: [[0, 3, 4, 0, 1, 3, 4, 0], [0, 4, 0, 3, 1, 4, 3, 0]],
    bridge: [3, 4, 1, 4, 3, 0, 4, 0],
    rhythms: [[0, 4, 6, 8, 12], [0, 3, 8, 10, 14], [0, 4, 7, 10, 12]], arpeggio: [0, 4, 6, 10, 12, 14],
    motifs: [[0, 2, 4, 2, 5, 4, 2, 0], [0, 4, 2, 5, 4, 2, 1, 0]], answer: [4, 5, 4, 2, 4, 1, 2, 0],
    voicing: [0, 4, 9], bass: [0, 2, 4, 1], hats: [2, 4, 10, 12, 14],
  },
  5: {
    scale: MAJOR,
    progressions: [[0, 3, 1, 4, 0, 3, 4, 0], [0, 1, 4, 0, 3, 0, 4, 0]],
    bridge: [3, 0, 1, 4, 3, 0, 4, 0],
    rhythms: [[0, 2, 6, 10, 12], [0, 6, 8, 12], [2, 4, 8, 10, 14]], arpeggio: [0, 2, 6, 8, 12, 14],
    motifs: [[2, 4, 5, 4, 2, 1, 2, 0], [0, 2, 4, 5, 4, 2, 1, 0]], answer: [4, 2, 1, 2, 4, 2, 1, 0],
    voicing: [0, 2, 4, 5], bass: [0, 4, 2, 4], hats: [2, 6, 10, 14],
  },
};

export function initializeCompanion(plan) {
  plan.motif = [...plan.family.motifs[Math.floor(plan.random.next() * plan.family.motifs.length)]];
  plan.answer = [...plan.family.answer];
  plan.phraseOffset = Math.floor(plan.random.next() * 3) * 2;
}

export function companionEvents(plan, step) {
  const bar = Math.floor(step / 16), tick = step % 16, family = plan.character, rules = plan.family;
  while (plan.epoch < Math.floor(bar / 32)) {
    plan.epoch++;
    plan.pattern = Math.floor(plan.random.next() * 3);
    plan.turn = Math.floor(plan.random.next() * 3) - 1;
    plan.ornament = plan.random.next();
  }
  const section = Math.floor(bar / 8) % 4, cadence = bar % 8 === 7;
  const chord = cadence ? 0 : section === 2 ? rules.bridge[bar % 8] : plan.progression[bar % 8];
  const events = [];
  const add = (degree, octave, beats, role, instrument, amplitude, pan) => events.push({
    frequency: plan.frequency(degree, octave), beats, role, instrument, amplitude, pan });

  // The opening leaves room between chords. The reply fills in, and the bridge thins out again.
  const openChords = section === 0 || (section === 2 && family === 2);
  if (tick === 0 && (!openChords || bar % 2 === 0 || cadence)) {
    for (const [voiceIndex, degree] of rules.voicing.entries()) add(chord + degree, bar % 8 === 4 && voiceIndex === 1 ? 1 : 0, openChords ? 7.6 : 3.8, 'accompaniment',
      family === 3 ? 'keys' : 'pad', family === 5 ? 0.012 : 0.015, Math.max(-0.5, Math.min(0.5, (degree - 2) * 0.16)));
  }
  const bassTicks = family >= 4 ? [0, 4, 8, 12] : family === 2 ? [0] : [0, 8];
  const bassIndex = bassTicks.indexOf(tick);
  let bassDegree = rules.bass[bassIndex % rules.bass.length];
  if (family >= 4 && bar % 4 === 2 && bassIndex === 2) bassDegree = family === 4 ? 3 : 5;
  if (bassIndex >= 0) add(chord + bassDegree, -1,
    family >= 4 ? 0.85 : family === 2 ? 3.8 : 1.7, 'bass', 'triangle', 0.07, 0);

  const arpIndex = rules.arpeggio.indexOf(tick);
  if (arpIndex >= 0 && !(cadence && tick > 8) && !(section === 2 && bar % 2 === 1 && tick > 8)) {
    const order = section === 1 ? [2, 4, 0, 4] : section === 3 ? [0, 4, 2, 4] : [0, 2, 4, 2];
    const turn = bar % 8 === 3 && arpIndex % 2 === 1 ? 1 : 0;
    add(chord + order[(arpIndex + plan.pattern + turn) % order.length], 1, family === 2 ? 1.6 : 0.8,
      'accompaniment', family === 5 ? 'keys' : 'pluck', 0.026, arpIndex % 2 ? 0.48 : -0.48);
  }

  const baseRhythm = rules.rhythms[(plan.pattern + bar % 3) % 3];
  const detailBar = !cadence && (bar + plan.phraseOffset / 2 + family) % (family === 2 ? 3 : 2) === 0;
  const detailIndex = 1 + (Math.floor(bar / 2) + family) % Math.max(1, baseRhythm.length - 2);
  let rhythm = cadence ? [0, 4] : baseRhythm;
  // Small turns keep most of the approved phrase intact, including its first and last pitches.
  if (detailBar && Math.floor(bar / 2) % 2 === 0) {
    rhythm = [...baseRhythm];
    const shift = family === 2 ? -1 : family === 3 || family === 5 ? 1 : (bar & 2) ? 1 : -1;
    rhythm[detailIndex] = Math.max(rhythm[detailIndex - 1] + 1, Math.min(rhythm[detailIndex + 1] - 1, rhythm[detailIndex] + shift));
  }
  const index = rhythm.indexOf(tick);
  const bridgeRest = section === 2 && bar % 2 === 1 && !cadence;
  if (index >= 0 && !bridgeRest) {
    const phrase = section === 1 || (section === 0 && bar % 4 === 3) ? plan.answer : plan.motif;
    let degree = phrase[(bar % 4 * 2 + index + plan.phraseOffset) % 8];
    if (section === 3 && index === rhythm.length - 1) degree += plan.turn;
    if (index === 0) degree = [0, 2, 4][Math.abs(degree) % 3];
    if (detailBar && index === detailIndex) {
      if (family === 1) degree += degree < 5 ? 1 : -1;
      else if (family === 2) degree = [2, 4, 5, 1, 2, 4, 2][Math.max(0, Math.min(6, degree))];
      else if (family === 3) degree += degree < 4 ? 2 : -2;
      else if (family === 4) degree += degree < 4 ? 2 : -1;
      else degree += degree > 1 ? -1 : 2;
      degree = Math.max(0, Math.min(6, degree));
    }
    if (cadence) degree = index === 0 ? 2 : 0;
    const next = rhythm[index + 1] ?? 16;
    const beats = cadence ? 1.2 : Math.max(0.35, (next - tick) / 4 * (family === 2 ? 1.12 : family === 3 ? 0.7 : 0.9));
    const instrument = family === 5 ? 'keys' : family === 2 && section === 0 ? 'triangle' : plan.palette;
    add(chord + degree, 1, beats, 'melody', instrument, 0.075, -0.1);
  }
  // Short answers are separate from the lead, rather than a constant second melody.
  if (!cadence && (section === 1 || bridgeRest || section === 3) && (tick === 6 || tick === 14)) {
    add(chord + plan.answer[(bar + (tick === 14 ? 3 : 0)) % 8], 0, family === 2 ? 1.3 : 0.75,
      'melody', family === 5 ? 'keys' : 'triangle', 0.031, 0.3);
  }
  if (tick === 0 || (tick === 8 && (family === 3 || family === 4))) events.push({ drum: 'kick', beats: 0.65, amplitude: 0.07 });
  const snareTicks = family === 2 ? [] : family === 1 ? [8] : [4, 12];
  if (snareTicks.includes(tick)) events.push({ drum: 'snare', beats: 0.4, amplitude: 0.031 });
  if (rules.hats.includes(tick) && !(cadence && tick > 8)) events.push({ drum: 'hat', beats: 0.16, amplitude: 0.020 });
  if (family === 5 && tick % 4 === 2) for (const event of events) event.delay = 1 / 8;
  return events;
}
