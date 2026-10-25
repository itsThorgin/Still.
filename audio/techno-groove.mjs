// Authored low phrases: repeated identities with small four-bar answers.
// A common phrase supplies both bass gates and the lead's available pockets.
const PHRASES = [
  [[2, 10], [2, 9, 14]], [[2, 7, 10], [2, 7, 11]],
  [[2, 6, 10, 14], [2, 6, 9, 14]], [[2, 6, 10, 14], [2, 5, 10, 14]],
  [[0, 2, 3, 6, 8, 10, 11, 14]], [[2, 10, 14], [2, 9, 14]],
  [[2, 6, 10, 14], [2, 6, 10, 13]], [[2, 5, 10, 14], [2, 6, 10, 13]],
  [[2, 6, 10, 14], [2, 5, 10, 14]], [[2, 6, 10, 14], [2, 6, 9, 14]],
  [[2, 7, 10, 15], [2, 6, 10, 14]], [[2, 6, 10, 14], [2, 5, 10, 14]],
  [[2, 7, 11, 14], [1, 6, 10, 14]], [[2, 10], [2, 10]],
  [[2, 5, 10, 13], [2, 6, 10, 14]],
];
export function technoBassSteps(id, bar) {
  const choices = PHRASES[id - 1];
  return choices[bar % 4 === 3 ? choices.length - 1 : 0];
}
export function technoLeadRhythm(id, bar, count) {
  if (count === 1) return [[0, 3.25]];
  const bass = technoBassSteps(id, bar);
  const choices = count === 2 ? [[[1, 1.5], [9, 1.5]], [[0, 1.5], [8, 1.75]], [[3, 1.25], [11, 1.25]]]
    : [[[1, 0.8], [7, 0.85], [12, 0.75]], [[0, 1.25], [5, 0.8], [12, 0.75]], [[3, 0.75], [8, 1], [13, 0.65]]];
  const ranked = choices.map((rhythm, i) => ({ rhythm, i, clashes: rhythm.filter(([at]) => bass.includes(at)).length }));
  ranked.sort((a, b) => a.clashes - b.clashes || (a.i + id + bar % 8) % choices.length - (b.i + id + bar % 8) % choices.length);
  return ranked[0].rhythm;
}
