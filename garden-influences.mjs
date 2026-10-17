export const GARDEN_INFLUENCES = Object.freeze([
  { value: 1, label: 'Bach' }, { value: 2, label: 'Mozart' }, { value: 3, label: 'Vivaldi' },
  { value: 4, label: 'Beethoven' }, { value: 5, label: 'Chopin' }, { value: 6, label: 'Smetana' }, { value: 7, label: 'Paganini' },
].map(Object.freeze));

export function gardenInfluences(seed, selection = 0) {
  let value = Math.imul((seed ^ 0x49b40821) >>> 0, 0x7feb352d);
  value = Math.imul(value ^ (value >>> 16), 0x846ca68b) >>> 0;
  const primary = GARDEN_INFLUENCES.find((item) => item.value === selection) ?? GARDEN_INFLUENCES[value % 7];
  const others = GARDEN_INFLUENCES.filter((item) => item !== primary);
  return [primary, others[(value >>> 8) % others.length]];
}
