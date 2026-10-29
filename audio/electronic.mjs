import {ElectronicMusic} from './electronic-music.mjs';
import { createElectronicPlan } from './neon-plan.mjs';
import { electronicVariationMix, characterPaceMix } from '../electronic-variation.mjs';
import { GardenRotation, gardenHash } from '../garden-options.mjs';
import { createElectronicTone, sampleElectronicTone } from './electronic-instruments.mjs';
import { createAmbientTone, sampleAmbientTone } from './ambient-instruments.mjs';
import { createJourneyTone, sampleJourneyTone, createJourneyDrum, sampleJourneyDrum } from './journey-instruments.mjs';
import { bassFadeGain, automaticTransition } from './bass-transitions.mjs';
import { sampleInstrumentVoice } from './instrument-library.mjs';
import { createRhythmBass, sampleRhythmBass, createRhythmDrum, sampleRhythmDrum } from './rhythm-instruments.mjs';
import { createSynthwaveTone, sampleSynthwaveTone, createSynthwaveDrum, sampleSynthwaveDrum } from './synthwave-instruments.mjs';
import {createExpressiveSynthwaveTone,sampleExpressiveSynthwaveTone,startExpressiveSynthwaveTone} from './synthwave-expression.mjs';
import {ExpressiveSynthwaveMix,SynthwaveForeground} from './synthwave-expression-mix.mjs';
import {synthwaveExpressionColour} from './synthwave-expression-colours.mjs';

const TAU = Math.PI * 2, SIZE = 2048;
const SINE = Float32Array.from({ length: SIZE + 1 }, (_, i) => Math.sin(TAU * i / SIZE));
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
function lookup(table, phase) {
  const position = phase * SIZE, index = Math.floor(position);
  return table[index] + (table[index + 1] - table[index]) * (position - index);
}

export class ElectronicSoundscape {
  constructor(rate, params, seed, kind) {
    if(['bassmusic','techno'].includes(kind))return new ElectronicMusic(rate,params,seed,kind);
    this.rate = rate; this.kind = kind;
    this.settings = { ...params };
    this.variationParams = null;
    this.rotation = new GardenRotation(rate, seed, params.variationMinutes);
    this.variationVersion = 0;
    this.requestedStyle = params.style ?? 1;
    this.requestedScene = params.scene ?? 1;
    this.journey = ['fantasy','lounge'].includes(kind);
    this.plan = createElectronicPlan(seed, kind, this.requestedStyle, this.settings);
    this.configureInstruments();
    this.voices = []; this.drums = [];
    this.beats = 0; this.nextStepBeat = 0; this.step = 0; this.serial = 0;
    this.noiseState = gardenHash(seed, 0xb5297a4d) || 1;
    this.transition = null;
    this.left = this.right = 0;
    this.kickEnvelope = 0;
    this.kickRelease = Math.exp(-1 / (rate * 0.12));
    if (kind === 'ambient') {
      this.ambientLevels = { melody: 1, accompaniment: 1, bass: 1, percussion: 1 };
      this.ambientSceneCoefficient = 1 - Math.exp(-32 / (rate * 2));
    }
    this.echoLowL = this.echoLowR = 0;
    this.dcL = this.dcR = 0;
    this.dcCoefficient = 1 - Math.exp(-TAU * 18 / rate);
    this.echoCoefficient = 1 - Math.exp(-TAU * Math.min(3500, rate * 0.35) / rate);
    
  }

  setParams(params, frame) {
    this.settings = { ...params };
    this.rotation.configure(params.variationMinutes, frame);
    if ((params.style ?? 1) === this.requestedStyle && (this.kind !== 'fantasy' || (params.scene ?? 1) === this.requestedScene)) return;
    this.requestedStyle = params.style ?? 1;
    this.requestedScene = params.scene ?? 1;
    this.rotation.schedule(frame);
    if (this.manual?.phase === 'out') return;
    
    const from = this.manualGain(frame) * bassFadeGain(this.transition, frame);
    this.transition = null;
    this.manual = { phase: 'out', start: frame, from };
  }

  manualGain(frame) {
    if (!this.manual) return 1;
    const position = clamp((frame - this.manual.start) / (this.rate * (this.manual.phase === 'out' ? 1 : 2)), 0, 1);
    const smooth = position * position * (3 - 2 * position);
    return this.manual.phase === 'out' ? this.manual.from * (1 - smooth) : smooth;
  }

  noise() {
    let value = this.noiseState;
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    this.noiseState = value >>> 0;
    return this.noiseState / 2147483648 - 1;
  }

  add(event, tempo) {
    const rate = this.rate;
    if (event.drum) {
      if (this.drums.length >= 20) return;
      if (event.neonDrum) {
        const identity=gardenHash(this.rotation.seed,this.serial++)/4294967296;
        this.drums.push(createSynthwaveDrum(event,rate,identity,tempo));
        if(event.drum==='kick')this.kickEnvelope=1;
        return;
      }
      if(event.rhythmDrum) {
        const identity=gardenHash(this.rotation.seed,this.serial++)/4294967296;
        this.drums.push(createRhythmDrum(event,rate,identity,tempo));
        if(event.drum==='kick')this.kickEnvelope=1;
        return;
      }
      if (this.journey) {
        const identity = gardenHash(this.rotation.seed,this.serial++) / 4294967296;
        this.drums.push(createJourneyDrum(event,rate,identity,tempo));
        if (event.drum === 'kick' || this.kind === 'fantasy' && event.drum === 'hand') this.kickEnvelope = 1;
        return;
      }
      const duration = event.duration ?? { kick: 0.42, snare: event.kit === 'deep' ? 0.4 : 0.28, clap: 0.22, hat: 0.095, 'open-hat': 0.28, tom: 0.3 }[event.drum];
      this.drums.push({ ...event, age: -Math.round((event.delay ?? 0) * 60 / tempo * rate), duration,
        phase: 0, phase2: 0, low: 0, body: 0,
        tuning: event.tuning ?? { dark: 0.78, deep: 0.85, break: 1.14, electro: 1.12, liquid: 1.04, machine: 1 }[event.kit] ?? 1,
        highCoefficient: 1 - Math.exp(-TAU * Math.min(event.drum.includes('hat') ? 8500 : 6500, rate * 0.4) / rate),
        bodyCoefficient: 1 - Math.exp(-TAU * Math.min(event.drum.includes('hat') ? 3200 : 900, rate * 0.22) / rate) });
      if (event.drum === 'kick') this.kickEnvelope = 1;
      return;
    }
    const duration = event.beats * 60 / tempo;
    if(event.rhythmBass) {
      for(const voice of this.voices)if(voice.rhythmBass&&voice.chokeAge===undefined) {
        voice.chokeAge=voice.age;
        voice.duration=Math.min(voice.duration,Math.max(0,voice.age/rate)+0.015);
      }
      const identity=gardenHash(this.rotation.seed,this.serial++)/4294967296;
      if(this.voices.length>=40)return;
      this.voices.push(createRhythmBass(event,rate,duration,identity,tempo));
      return;
    }

    if (this.voices.length >= 40) return;
    const identity = gardenHash(this.rotation.seed, this.serial++) / 4294967296;
    const bar=Math.floor((this.step-1)/16),c=this.plan.character;
    const section=c.form?.[Math.floor(bar/8)%c.form.length];
    const tone = this.kind==='synthwave'&&event.role!=='bass'
      ?createExpressiveSynthwaveTone(event,rate,duration,identity,tempo,c.value,this.nextStepBeat)
      :event.synthwaveTone ? createSynthwaveTone(event,rate,duration,identity,tempo)
      :this.journey ? createJourneyTone(event,rate,duration,identity,tempo)
      : this.kind === 'ambient' ? createAmbientTone(event, rate, duration, identity)
      : createElectronicTone(event, rate, duration, identity);
    if (tone) {
      tone.mixPanL = Math.sqrt((1 - tone.pan) / 2);
      tone.mixPanR = Math.sqrt((1 + tone.pan) / 2);
      this.voices.push(tone);
    }
  }

  configureInstruments() {
    const c=this.plan.character,seed=this.rotation.seed;
    this.synthwaveLead=null;
    this.synthwaveLeads=new Map();
    this.synthwaveColour=this.kind==='synthwave'?synthwaveExpressionColour(c.value):null;
    this.synthwaveForeground=this.synthwaveColour&&!c.synthwaveWriting?new SynthwaveForeground(this.rate,this.synthwaveColour):null;
    this.synthwaveMix=c.synthwaveWriting?new ExpressiveSynthwaveMix(this.rate,c):null;
    if(this.synthwaveMix){
      // These effects paths never render together. Keep legacy-length views
      // over the dedicated storage so a later legacy style can reuse it.
      const mix=this.synthwaveMix,length=Math.ceil(this.rate*.04);
      this.echoLeft=mix.delayL;this.echoRight=mix.delayR;
      this.chorusLeft=mix.chorusL.subarray(0,length);this.chorusRight=mix.chorusR.subarray(0,length);
    }else if(!this.echoLeft){
      this.echoLeft=new Float32Array(Math.ceil(this.rate*2));
      this.echoRight=new Float32Array(this.echoLeft.length);
      this.chorusLeft=new Float32Array(Math.ceil(this.rate*.04));
      this.chorusRight=new Float32Array(this.chorusLeft.length);
    }
  }

  changeSeed(frame, params) {
    this.rotation.changeSeed(frame);
    this.resetScore();
    this.variationParams = this.settings.varyMix === 1
      ? electronicVariationMix(this.kind, this.plan.character, this.rotation.seed, this.settings)
      : this.requestedStyle === 0 ? characterPaceMix(this.plan.character, this.settings) : null;
    if (this.variationParams) {
      Object.assign(this.settings, this.variationParams);
      Object.assign(params, this.variationParams);
    }
    this.variationVersion++;
  }

  resetScore() {
    this.plan = createElectronicPlan(this.rotation.seed, this.kind, this.requestedStyle, this.settings);
    this.kickRelease=Math.exp(-1/(this.rate*0.12));
    this.configureInstruments();
    this.voices.length = this.drums.length = 0;
    if(!this.synthwaveMix){
      this.echoLeft.fill(0); this.echoRight.fill(0);
      this.chorusLeft.fill(0); this.chorusRight.fill(0);
    }
    this.echoLowL = this.echoLowR = this.dcL = this.dcR = this.kickEnvelope = 0;
    this.rumbleBuffer?.fill(0);this.rumbleLow=this.rumbleHigh=0;
    this.serial = this.step = 0;
    this.beats = this.nextStepBeat = 0;
    if (this.ambientLevels) for (const role of Object.keys(this.ambientLevels)) this.ambientLevels[role] = 1;
    this.noiseState = gardenHash(this.rotation.seed, 0xb5297a4d) || 1;
  }

  advance(params, frame) {
    this.frame = frame;
    if (this.manual?.phase === 'out' && frame >= this.manual.start + this.rate) {
      this.resetScore();
      this.manual = { phase: 'in', start: frame };
    } else if (this.manual?.phase === 'in' && frame >= this.manual.start + this.rate * 2) this.manual = null;
    const fade = this.transition;
    if (fade?.phase === 'out' && frame >= fade.start + fade.outFrames) {
      const quietStart = fade.start + fade.outFrames;
      
      this.resetScore();
      fade.phase = 'quiet'; fade.start = quietStart;
    }
    if (fade?.phase === 'quiet') {
      if (frame < fade.start + fade.quietFrames) return false;
      const incomingStart = fade.start + fade.quietFrames;
      this.changeSeed(frame, params);
      this.nextStepBeat = this.beats;
      fade.phase = 'in'; fade.start = incomingStart;
    }
    if (fade?.phase === 'in' && frame >= fade.start + fade.inFrames) {
      this.manual = null; this.transition = null;
    }
    while (this.beats + 1e-9 >= this.nextStepBeat) {
      const phraseSteps = this.plan.phraseSteps ?? 128, barSteps = this.plan.barSteps ?? 16;
      if (!this.manual && !this.transition && frame >= this.rotation.nextFrame && this.step % phraseSteps === phraseSteps - barSteps)
        this.transition = automaticTransition(this.rotation.seed, frame, this.rate);
      for (const event of this.plan.events(this.step++,params)) this.add(event, params.tempo);
      this.nextStepBeat += 0.25;
    }
    return true;
  }

  variationGain() {
    return bassFadeGain(this.transition, this.frame ?? 0);
  }

  delayed(buffer, frame, seconds) {
    const position = ((frame - seconds * this.rate) % buffer.length + buffer.length) % buffer.length;
    const index = Math.floor(position), fraction = position - index;
    return buffer[index] * (1 - fraction) + buffer[(index + 1) % buffer.length] * fraction;
  }

  sample(params, frame) {
    if (this.advance(params, frame) === false) { this.left = this.right = 0; return; }

    const rate = this.rate, movement = params.movement / 100;
    
    if (!this.synthwaveMix && frame % 32 === 0) {
      this.chorusTimeL = 0.018 + 0.003 * Math.sin(TAU * frame / rate * 0.23);
      this.chorusTimeR = 0.022 + 0.003 * Math.sin(TAU * frame / rate * 0.19 + 1);
      if (this.ambientLevels) for (const role of Object.keys(this.ambientLevels))
        this.ambientLevels[role] += this.ambientSceneCoefficient * ((this.plan.layerTargets?.[role] ?? 1) - this.ambientLevels[role]);
    }
    
    if (!this.synthwaveMix) { this.chorusTimeL ??= 0.018; this.chorusTimeR ??= 0.022; }
    let left = 0, right = 0, bass = 0, synthSendL=0, synthSendR=0, drumRoom=0, synthLeadL=0,synthLeadR=0,synthPadL=0,synthPadR=0;
    for (let i = this.voices.length - 1; i >= 0; i--) {
      const voice = this.voices[i], age = voice.age / rate;
      if (age >= voice.duration) { this.voices.splice(i, 1); continue; }
      if (age < 0) { voice.age++; continue; }
      if(voice.polishTone&&!voice.polishStarted){
        if(this.synthwaveForeground){

          const lane=voice.instrument+':'+Math.round(voice.pan*100);
          this.synthwaveLeads.set(lane,startExpressiveSynthwaveTone(voice,this.synthwaveLeads.get(lane)));
        }else this.synthwaveLead=startExpressiveSynthwaveTone(voice,this.synthwaveLead);
      }
      if(voice.polishTone)sampleExpressiveSynthwaveTone(voice,frame,this.beats,params.brightness/100,movement);
      else if (voice.synthwaveTone) sampleSynthwaveTone(voice,frame,this.beats,params.brightness/100,movement);
      else if (voice.instrumentVoice) sampleInstrumentVoice(voice,frame,this.beats,params.brightness/100,movement);
      else if (voice.rhythmBass) sampleRhythmBass(voice,frame,this.beats,params.brightness/100,movement);
      else if (this.journey) sampleJourneyTone(voice,frame,this.beats,params.brightness/100,movement);
      else if (this.kind === 'ambient') sampleAmbientTone(voice, frame, this.beats, params.brightness / 100, movement);
      else sampleElectronicTone(voice, frame, this.beats, params.brightness / 100, movement);
      
      const level = voice.amplitude * params[voice.role] / 100 * (this.ambientLevels?.[voice.role] ?? 1);
      if (voice.role === 'bass') bass += voice.left * level;
      else {
        const a=voice.left*level*voice.mixPanL,b=voice.right*level*voice.mixPanR;
        left+=a;right+=b;
        if(this.synthwaveColour){
          if(voice.role==='melody'){synthLeadL+=a;synthLeadR+=b;}
          else if(voice.instrument===this.plan.character.pad){synthPadL+=a;synthPadR+=b;}
        }
        if(this.synthwaveMix){const send=voice.role==='melody'?.8:.12;
          synthSendL+=a*send;
          synthSendR+=b*send;}
      }
    }
    
    let drums = 0, hatSide = 0, kickSend=0;
    for (let i = this.drums.length - 1; i >= 0; i--) {
      const voice = this.drums[i], age = voice.age / rate;
      if (age >= voice.duration) { this.drums.splice(i, 1); continue; }
      if (age < 0) { voice.age++; continue; }
      if (voice.synthwaveDrum) {
        if(voice.drum==='kick'&&voice.age===0&&this.synthwaveMix)this.synthwaveMix.kickEnvelope=params.percussion>0?1:0;
        const sound=sampleSynthwaveDrum(voice)*voice.amplitude*params.percussion/100;drums+=sound;
        if(voice.mixHat)hatSide+=sound*.15;
        if(voice.mixRoom)drumRoom+=sound;
        continue;
      }
      if (voice.collectionDrum) {
        const raw=voice.rhythmDrum?sampleRhythmDrum(voice):sampleJourneyDrum(voice),sound=raw*params.percussion/100;
        drums+=sound;
        if (['hat','open-hat','shaker','brush'].includes(voice.drum)) hatSide+=sound*0.15;
        continue;
      }
      const noise = this.noise();
      voice.low += voice.highCoefficient * (noise - voice.low);
      voice.body += voice.bodyCoefficient * (voice.low - voice.body);
      const attack = Math.min(1, age / 0.002);
      const tail = Math.min(1, (voice.duration - age) / 0.025);
      let wave, decay, frequency = 180;
      const deep = voice.kit === 'foundation-deep', liquid = voice.kit === 'foundation-liquid';
      const chopped = voice.kit === 'foundation-break';
      if (voice.drum === 'kick') {
        frequency = ((deep ? 43 : 47) + (deep ? 75 : 105) * Math.exp(-age * (deep ? 65 : 45))) * voice.tuning;
        wave = lookup(SINE, voice.phase) * 0.94 + (voice.low - voice.body) * 0.06 * Math.exp(-age * 100);
        decay = Math.exp(-age * (deep ? 16 : liquid ? 17 : 12));
      } else if (voice.drum === 'tom') {
        frequency = 90 + 80 * Math.exp(-age * 25);
        wave = lookup(SINE, voice.phase) * 0.9 + voice.body * 0.1;
        decay = Math.exp(-age * 14);
      } else if (voice.drum === 'snare') {
        frequency = (deep ? 145 : liquid ? 195 : 180) * voice.tuning;
        wave = (voice.low - voice.body) * 0.85 + lookup(SINE, voice.phase) * 0.28 + lookup(SINE, voice.phase2) * 0.12;
        if (deep) wave = (voice.low - voice.body) * (0.92 * Math.exp(-age * 9))
          + lookup(SINE, voice.phase) * 0.48 * Math.exp(-age * 18);
        else if (liquid) wave = (voice.low - voice.body) * 0.72 + lookup(SINE, voice.phase) * 0.22;
        else if (chopped) wave = (voice.low - voice.body) * 0.95 + lookup(SINE, voice.phase) * 0.17;
        decay = Math.exp(-age * (deep ? 13 : liquid ? 24 : chopped ? 32 : voice.kit === 'deep' ? 13 : voice.kit === 'break' ? 26 : 19));
      } else if (voice.drum === 'clap') {
        const flutter = age < 0.036 ? Math.sin(Math.PI * (age % 0.012) / 0.012) ** 2
          : Math.min(1, (age - 0.036) / 0.004) * Math.exp(-(age - 0.036) * 8);
        wave = (voice.low - voice.body) * flutter;
        decay = Math.exp(-age * 22);
      } else {
        wave = voice.low - voice.body;
        decay = Math.exp(-age * (voice.drum === 'hat' ? deep ? 82 : liquid ? 74 : 55 : 15));
      }
      const sound = wave * attack * tail * decay * voice.amplitude * params.percussion / 100;
      drums += sound;
      if (voice.drum.includes('hat')) hatSide += sound * 0.15;
      voice.phase = (voice.phase + frequency / rate) % 1;
      voice.phase2 = (voice.phase2 + 331 * voice.tuning / rate) % 1;
      voice.age++;
    }
    if(this.synthwaveMix){
      this.synthwaveMix.process(left,right,bass,drums,hatSide,synthSendL,synthSendR,drumRoom,params,frame,synthLeadL,synthLeadR,synthPadL,synthPadR);
      const gain=this.variationGain()*this.manualGain(frame);
      this.left=this.synthwaveMix.left*gain;this.right=this.synthwaveMix.right*gain;
      this.beats+=params.tempo/(60*rate);return;
    }
    if(this.synthwaveForeground){
      this.synthwaveForeground.process(left,right,params,frame,synthLeadL,synthLeadR,synthPadL,synthPadR);
      left=this.synthwaveForeground.left;right=this.synthwaveForeground.right;
    }
    this.kickEnvelope *= this.kickRelease;

    if (this.kind === 'ambient' && frame % 32 === 0)
      this.ambientBreathing = 1 - params.pump / 100 * 0.15 * (0.5 - 0.5 * Math.cos(TAU * this.beats / 16));
    const breathing = this.kind === 'ambient' ? this.ambientBreathing ?? 1 : 1 - this.kickEnvelope * params.pump / 100 * 0.72;
    left *= breathing; right *= breathing; bass *= breathing;
    const space = params.space / 100 * (this.synthwaveForeground?this.synthwaveColour.room:1);
    const chorusL = this.delayed(this.chorusLeft, frame, this.chorusTimeL);
    const chorusR = this.delayed(this.chorusRight, frame, this.chorusTimeR);
    const ci = frame % this.chorusLeft.length;
    this.chorusLeft[ci] = left; this.chorusRight[ci] = right;
    left += chorusL * space * 0.3; right += chorusR * space * 0.3;
    const delay = 60 / params.tempo * 0.75;
    const echoL = this.delayed(this.echoLeft, frame, delay);
    const echoR = this.delayed(this.echoRight, frame, delay * 4 / 3);
    this.echoLowL += this.echoCoefficient * (echoL - this.echoLowL);
    this.echoLowR += this.echoCoefficient * (echoR - this.echoLowR);
    const ei = frame % this.echoLeft.length;
    this.echoLeft[ei] = right * 0.35 + this.echoLowR * 0.32;
    this.echoRight[ei] = left * 0.35 + this.echoLowL * 0.32;
    left += this.echoLowL * space; right += this.echoLowR * space;
    const middle = (left + right) * 0.5 + bass + drums;
    const side = ((left - right) * 0.5 + hatSide) * params.width / 100;
    left = middle + side; right = middle - side;
    this.dcL += this.dcCoefficient * (left - this.dcL);
    this.dcR += this.dcCoefficient * (right - this.dcR);
    left -= this.dcL; right -= this.dcR;
    const gain = this.variationGain() * this.manualGain(frame);
    const saturation=0.35;
    this.left = left / (1 + Math.abs(left) * saturation) * gain;
    this.right = right / (1 + Math.abs(right) * saturation) * gain;
    this.beats += params.tempo / (60 * rate);
  }
}
