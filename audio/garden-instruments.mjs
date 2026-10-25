

import { createBowedTone, sampleBowedTone, prepareBowedTone } from './garden-bowed.mjs';
import { createOriginalTone, sampleOriginalTone, ORIGINAL_INSTRUMENTS } from './garden-original.mjs';
import { createLyricalString, sampleLyricalString } from './garden-lyrical.mjs';
import { createOrganTone, sampleOrganTone } from './garden-organ.mjs';
import { GardenDescription } from './garden-description.mjs';
const TAU = Math.PI * 2;
const SIZE = 4096;
const COUNTS = [1, 2, 4, 6, 8, 12, 16];
const TABLES = new Map();
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function table(weights, count) {
  const result = new Float32Array(SIZE + 1);
  const scale = weights.slice(0, count).reduce((sum, value) => sum + Math.abs(value), 0);
  for (let index = 0; index <= SIZE; index++) {
    for (let partial = 1; partial <= count; partial++) {
      result[index] += weights[partial - 1] * Math.sin(TAU * partial * index / SIZE) / scale;
    }
  }
  return result;
}

for (const instrument of ['string', 'flute']) {
  const bright = instrument === 'string'
    ? Array.from({ length: 16 }, (_, index) => 1 / (index + 1) ** 1.22)
    : [1, 0.20, 0.25, 0.065, 0.035, 0.018, 0.012, 0.008, 0.004, 0.002, 0, 0, 0, 0, 0, 0];
  const dark = bright.map((weight, index) => weight * Math.exp(-index * (instrument === 'string' ? 0.55 : 0.8)));
  for (const count of COUNTS) TABLES.set(`${instrument}:${count}`, { bright: table(bright, count), dark: table(dark, count) });
}

function lookup(values, phase) {
  const position = phase * SIZE, index = Math.floor(position);
  return values[index] + (values[index + 1] - values[index]) * (position - index);
}

function random(tone) {
  let value = tone.randomState;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  tone.randomState = value >>> 0;
  return tone.randomState / 4294967296;
}

function mode(frequency, weight, decay, sampleRate, brightnessWeight) {
  const angle = TAU * frequency / sampleRate;
  const radius = Math.exp(-1 / (sampleRate * decay));
  return { frequency, weight, brightnessWeight, current: 0, previous: -Math.sin(angle) / radius,
    coefficient: 2 * radius * Math.cos(angle), radiusSquared: radius * radius };
}

export function prepareGardenPlan(plan, sampleRate) {
  for (const prepare of gardenPlanPreparations(plan, sampleRate)) prepare?.();
}

export function* gardenPlanPreparations(plan, sampleRate) {
  const prepared = new Set();
  const description = new GardenDescription(plan, sampleRate);

  for (let step = 0; step < plan.barSteps * 96; step++) {
    for (const event of plan.events(step)) {
      description.add(event);
      if (['lyrical', 'section'].includes(event.stringStyle) && event.frequency < sampleRate * 0.45) {
        const profile = event.instrument === 'string' ? undefined : event.instrument;
        const key = `${event.stringStyle}:${profile}:${event.frequency}`;
        if (!prepared.has(key)) yield () => createLyricalString(event.frequency, 2, sampleRate, 1, event.stringStyle === 'section' ? 'section' : 'solo', profile);
        prepared.add(key); continue;
      }
      if (event.stringStyle) continue;
      if (!['cello', 'violin', 'brass', 'clarinet'].includes(event.instrument) || event.frequency >= sampleRate * 0.45) continue;
      const key = `${event.instrument}:${event.frequency}`;
      if (prepared.has(key)) continue;
      yield () => prepareBowedTone(event.instrument, event.frequency, sampleRate);
      prepared.add(key);
    }
    
    yield null;
  }
  plan.description = description.finish();
}

export function createGardenTone(instrument, frequency, duration, sampleRate, seed, options = {}) {
  if (instrument === 'organ') return createOrganTone(frequency, duration, sampleRate, seed);
  if (['string', 'cello', 'violin'].includes(instrument) && options.stringStyle) {
    if (['lyrical', 'section'].includes(options.stringStyle)) {
      return { ...createLyricalString(frequency, duration, sampleRate, seed, options.stringStyle === 'section' ? 'section' : 'solo', instrument === 'string' ? undefined : instrument), lyrical: true, internalEnvelope: true };
    }
    instrument = 'string';
    options = { ...options, palette: options.stringStyle };
  }
  if (options.palette === 'original' && ORIGINAL_INSTRUMENTS.includes(instrument)) {
    return createOriginalTone(instrument, frequency, duration, sampleRate, options.shimmer);
  }
  if (['cello', 'violin', 'brass', 'clarinet'].includes(instrument)) {
    return createBowedTone(instrument, frequency, duration, sampleRate, seed);
  }
  const tone = { instrument, sampleRate, frequency, phase: 0, frames: 0, randomState: seed >>> 0 || 1,
    modes: [], noiseLow: 0, noiseSlow: 0, air: 0, airStep: 0, vibrato: 0, vibratoStep: 0,
    colour: 0, colourStep: 0 };
  tone.strength = 0.94 + random(tone) * 0.10;
  tone.vibratoRate = 4.6 + random(tone) * 0.9;
  tone.vibratoPhase = random(tone) * TAU;
  tone.attack = instrument === 'string' ? 0.16 + random(tone) * 0.035
    : instrument === 'flute' ? 0.085 + random(tone) * 0.025
    : instrument === 'piano' ? 0.008 : instrument === 'pluck' ? 0.006 : 0.012;
  tone.noiseCoefficient = 1 - Math.exp(-TAU * Math.min(3800, sampleRate * 0.18) / sampleRate);
  tone.slowCoefficient = 1 - Math.exp(-TAU * Math.min(650, sampleRate * 0.08) / sampleRate);
  
  const limit = sampleRate * 0.45;
  if (instrument === 'string' || instrument === 'flute') {
    const available = limit / (frequency * 1.003);
    tone.harmonics = COUNTS.filter((count) => count <= available).at(-1) ?? 1;
    tone.tables = TABLES.get(`${instrument}:${tone.harmonics}`);
    return tone;
  }

  const add = (ratio, weight, decay, brightnessWeight) => {
    const partialFrequency = frequency * ratio;
    if (partialFrequency < limit) tone.modes.push(mode(partialFrequency, weight, decay, sampleRate, brightnessWeight));
  };
  if (instrument === 'glass') {
    
    [1, 2.32, 4.25, 6.63, 9.38, 12.4].forEach((ratio, index) => {
      add(ratio, [1, 0.34, 0.19, 0.11, 0.06, 0.025][index],
        Math.min(3.8, duration * 0.85) / (1 + index * 0.65), index / 5);
    });
  } else if (instrument === 'marimba' || instrument === 'celesta') {
    const ratios = instrument === 'marimba' ? [1, 3.99, 10.1, 17.7] : [1, 2.76, 5.4, 8.9, 13.3];
    ratios.forEach((ratio, index) => add(ratio, [1, 0.28, 0.10, 0.04, 0.015][index],
      Math.min(instrument === 'marimba' ? 1.2 : 2.6, duration) / (1 + index * 0.8), index / ratios.length));
    tone.release = 0.12;
  } else if (instrument === 'pluck' || instrument === 'harp') {
    const position = 0.20 + random(tone) * 0.08;
    for (let partial = 1; partial <= 14; partial++) {
      add(partial, Math.sin(Math.PI * partial * position) / partial ** (instrument === 'harp' ? 1.65 : 1.35),
        Math.min(instrument === 'harp' ? 3.8 : 2.2, duration * (instrument === 'harp' ? 1.4 : 0.9)) / (1 + (partial - 1) * 0.37), (partial - 1) / 13);
    }
  } else if (instrument === 'piano') {
    const stiffness = 0.00012 * (frequency / 440) ** 1.2;
    for (let partial = 1; partial <= 12; partial++) {
      const ratio = partial * Math.sqrt((1 + stiffness * partial * partial) / (1 + stiffness));
      const weight = Math.exp(-(partial - 1) * 0.14) / partial ** 1.3;
      const decay = Math.min(4.5, duration * 1.1) / (1 + (partial - 1) * 0.4);
      add(ratio, weight * (partial <= 4 ? 0.72 : 1), decay, (partial - 1) / 11);
      
      if (partial <= 4) add(ratio * 1.0009, weight * 0.28, decay * 0.94, (partial - 1) / 11);
    }
  }
  tone.scale = 0.9 / Math.max(1, tone.modes.reduce((sum, item) => sum + Math.abs(item.weight), 0));
  return tone;
}

export function sampleGardenTone(tone, age, brightness) {
  if (tone.lyrical) return sampleLyricalString(tone, brightness);
  if (tone.organ) return sampleOrganTone(tone, age, brightness);
  if (tone.original) return sampleOriginalTone(tone, age, brightness);
  if (tone.bodyTables) return sampleBowedTone(tone, age, brightness);
  let sound = 0;
  if (tone.tables) {
    if (tone.frames % 64 === 0) {
      const settled = 1 - Math.exp(-age / 0.25);
      const vibratoDepth = tone.instrument === 'string' ? 0.0017 : 0.0010;
      const vibrato = Math.sin(TAU * tone.vibratoRate * age + tone.vibratoPhase) * vibratoDepth * settled;
      tone.vibratoStep = (vibrato - tone.vibrato) / 64;
      const colour = tone.instrument === 'string'
        ? 0.25 + 0.55 * settled + 0.035 * Math.sin(age * TAU * 0.7 + tone.vibratoPhase)
        : 0.42 + 0.20 * settled;
      tone.colourStep = (colour - tone.colour) / 64;
      const air = tone.instrument === 'flute' ? 0.035 + 0.05 * Math.exp(-age / 0.12) : 0.012 + 0.018 * Math.exp(-age / 0.08);
      tone.airStep = (air - tone.air) / 64;
    }
    tone.vibrato += tone.vibratoStep; tone.colour += tone.colourStep; tone.air += tone.airStep;
    const dark = lookup(tone.tables.dark, tone.phase);
    const bright = lookup(tone.tables.bright, tone.phase);
    sound = (dark + (bright - dark) * clamp(tone.colour * (0.25 + brightness * 0.75), 0, 1)) * 0.85;
    const noise = random(tone) * 2 - 1;
    tone.noiseLow += tone.noiseCoefficient * (noise - tone.noiseLow);
    tone.noiseSlow += tone.slowCoefficient * (tone.noiseLow - tone.noiseSlow);
    sound += (tone.noiseLow - tone.noiseSlow) * tone.air * (0.25 + brightness * 0.75);
    tone.phase = (tone.phase + tone.frequency * (1 + tone.vibrato) / tone.sampleRate) % 1;
  } else {
    for (const item of tone.modes) {
      sound += item.current * item.weight * (1 - item.brightnessWeight * (1 - brightness) * 0.85);
      const next = item.coefficient * item.current - item.radiusSquared * item.previous;
      item.previous = item.current; item.current = next;
    }
    sound *= tone.scale;
  }
  tone.frames++;
  return sound * tone.strength;
}
