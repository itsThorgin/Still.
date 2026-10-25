// DnB uses kick/snare anchors and quiet break detail. Half-time scores retain
// their spacious dubstep performance and sound models.
export function composeBassGroove(plan, source, step) {
  const c = plan.character;
  if (c.groove === 'halftime') return source;
  const bar = Math.floor(step / 16), tick = step % 16, local = bar % 8;
  const section = c.form[Math.floor(bar / 8) % c.form.length];
  const quiet = ['break', 'bridge'].includes(section), lifted = ['lift', 'return', 'finale'].includes(section);
  const jungle = c.groove === 'jungle', hard = [7, 12].includes(c.value);
  const events = [];
  for (const e of source) {
    if (e.drum) {
      const mainSnare = e.drum === 'snare' && [4, 12].includes(tick);
      events.push({ ...e, rhythmKit: 'dnb', rhythmDrum: true,
        kickShape: hard ? 'drive' : 'punch',
        amplitude: e.amplitude * (e.drum.includes('hat') ? 0.72 : mainSnare ? 1.12 : e.drum === 'snare' ? 0.8 : 1),
        ...(e.drum === 'snare' && !mainSnare ? { delay: e.delay ?? 0.018 } : {}) });
    } else if (e.role === 'bass') {
      let frequency = e.frequency;
      while (frequency > 88) frequency /= 2;
      while (frequency < 35) frequency *= 2;
      events.push({ ...e, frequency, rhythmBass: true,
        bassShape: hard || c.bass === 'deep-reese' ? 'reese' : jungle ? 'pulse' : 'sub',
        amplitude: e.amplitude * (hard ? 1.12 : 1.08),
        cutoffCeiling: hard ? 1800 : jungle ? 1250 : 850,
        // Sub remains steady while upper harmonics have phrase-related motion.
        motionRate: hard ? 0.5 : jungle ? 0.25 : 0.125 });
    } else {
      // Leave a small attack pocket for each backbeat. The melody continues
      // through the intervening spaces instead of doubling the snare accents.
      events.push({ ...e, ...(e.role === 'melody' && [4, 12].includes(tick) ? { delay: Math.max(e.delay ?? 0, 0.16) } : {}),
        amplitude: e.amplitude * (e.role === 'accompaniment' ? 0.88 : 1) });
    }
  }
  const drum = (name, amplitude, extra = {}) => events.push({ drum: name, kit: c.kit,
    rhythmKit: 'dnb', rhythmDrum: true, amplitude, ...extra });
  if ((quiet ? [12] : [4, 12]).includes(tick) && !events.some(e => e.drum === 'snare' && e.amplitude > 0.08))
    drum('snare', quiet ? 0.12 : 0.185, { duration: jungle ? 0.15 : 0.19 });
  // Velocity contrast, not an indiscriminate roll: no more than two added
  // ghost strokes per bar, with a different answer at each four-bar ending.
  const ghosts = jungle ? [[3, 7], [9, 15], [7, 11], [3, 13]][bar % 4]
    : [[7], [11], [3], [7, 15]][bar % 4];
  if (!quiet && ghosts.includes(tick) && !events.some(e => e.drum === 'snare'))
    drum('snare', jungle ? 0.035 : 0.024, { duration: 0.075, tuning: 1.18, delay: 0.018 });
  if (!quiet && local === 7 && [10, 13].includes(tick))
    drum('tom', 0.045, { tuning: tick === 10 ? 1.25 : 0.88 });
  if (lifted && local % 4 === 2 && [2, 10].includes(tick)) drum('ride', 0.022);
  if (lifted && local === 0 && tick === 0) drum('crash', 0.035);
  return events;
}
