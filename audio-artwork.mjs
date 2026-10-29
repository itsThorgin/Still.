import {VISUALIZATION_MODES, normalizeVisualization} from './visualization-settings.mjs';

export function scopeTracePaths(samples, sampleRate = 48000, mirror = false) {
  let power = 0;
  for (const sample of samples) power += sample * sample;
  const rms = Math.sqrt(power / Math.max(1, samples.length));
  const gain = 78 * Math.sqrt(bandVisualLevel(0, rms)), normalization = Math.max(.001, rms * 1.6);
  const window = Math.max(1, Math.min(Math.round(sampleRate * .02), samples.length - 258));
  const end = Math.max(0, samples.length - window - 1);
  let start = end, slope = 0;
  for (let i = Math.max(0, end - 256); i < end; i++) {
    const next = samples[i + 1] - samples[i];
    if (samples[i] <= 0 && samples[i + 1] > 0 && next > slope) { slope = next; start = i; }
  }
  let top = '', bottom = '';
  for (let i = 0; i <= 160; i++) {
    const p = i / 160, position = start + (mirror ? Math.abs(p - .5) * 2 : p) * window;
    const index = Math.min(Math.max(0, samples.length - 2), Math.floor(position));
    const value = (samples[index] ?? 0) + ((samples[index + 1] ?? 0) - (samples[index] ?? 0)) * (position - index);
    const displacement = mirror ? Math.abs(Math.tanh(value / normalization)) * gain * Math.sin(Math.PI * p) : Math.tanh(value / normalization) * gain;
    top += `${i ? 'L' : 'M'}${(p * 900).toFixed(1)},${(160 - displacement).toFixed(2)} `;
    if (mirror) bottom += `${i ? 'L' : 'M'}${(p * 900).toFixed(1)},${(160 + displacement).toFixed(2)} `;
  }
  return [top, bottom, ''];
}

const spectrumFrequency = (position, rate) => 40 * (Math.min(16000, rate * .45) / 40) ** position;

export function spectrumLevels(frequencies, rate = 48000, output = new Float32Array(48)) {
  const binWidth = rate / (frequencies.length * 2);
  for (let bar = 0; bar < output.length; bar++) {
    const low = Math.floor(spectrumFrequency(bar / output.length, rate) / binWidth);
    const high = Math.min(frequencies.length - 1, Math.ceil(spectrumFrequency((bar + 1) / output.length, rate) / binWidth));
    let db = -Infinity;
    for (let bin = low; bin <= high; bin++) if (Number.isFinite(frequencies[bin])) db = Math.max(db, frequencies[bin]);
    output[bar] = Math.max(0, Math.min(1, (db + 90) / 65));
  }
  return output;
}

export function spectrumTracePaths(levels, rate = 48000) {
  const paths = ['', '', ''];
  for (let i = 0; i < levels.length; i++) {
    const level = Math.max(0, Math.min(1, levels[i]));
    if (level <= .001) continue;
    const frequency = spectrumFrequency((i + .5) / levels.length, rate), band = frequency < 250 ? 0 : frequency < 4000 ? 1 : 2;
    const x = 45 + (i + .5) / levels.length * 810;
    paths[band] += `M${x.toFixed(1)},270L${x.toFixed(1)},${(270 - level * 205).toFixed(2)} `;
  }
  return paths;
}

export function createBandMeter(sampleRate = 48000) {
  function filter(frequency, highpass = false) {
    const omega = 2 * Math.PI * Math.min(frequency, sampleRate * .45) / sampleRate;
    const cosine = Math.cos(omega), alpha = Math.sin(omega) / Math.SQRT2;
    const divisor = 1 + alpha;
    const edge=highpass?1+cosine:1-cosine;
    return {b0:edge/2/divisor,b1:(highpass?-edge:edge)/divisor,b2:edge/2/divisor,a1:-2*cosine/divisor,a2:(1-alpha)/divisor};
  }
  const low = filter(250), midLow = filter(250,true), midHigh = filter(4000), high = filter(4000,true);
  return (samples, output = new Float32Array(3), bands) => {
    let x1=0,x2=0,l1=0,l2=0,ml1=0,ml2=0,m1=0,m2=0,h1=0,h2=0,lowPower=0,midPower=0,highPower=0;
    const warmup = Math.min(512, Math.floor(samples.length / 4));
    for (let i=0;i<samples.length;i++) {
      const x=samples[i];
      const l=low.b0*x+low.b1*x1+low.b2*x2-low.a1*l1-low.a2*l2;
      const ml=midLow.b0*x+midLow.b1*x1+midLow.b2*x2-midLow.a1*ml1-midLow.a2*ml2;
      const m=midHigh.b0*ml+midHigh.b1*ml1+midHigh.b2*ml2-midHigh.a1*m1-midHigh.a2*m2;
      const h=high.b0*x+high.b1*x1+high.b2*x2-high.a1*h1-high.a2*h2;
      if(bands){bands[0][i]=l;bands[1][i]=m;bands[2][i]=h;}
      x2=x1;x1=x;l2=l1;l1=l;ml2=ml1;ml1=ml;m2=m1;m1=m;h2=h1;h1=h;
      if(i>=warmup){lowPower+=l*l;midPower+=m*m;highPower+=h*h;}
    }
    const count=Math.max(1,samples.length-warmup);
    output[0]=Math.sqrt(lowPower/count);output[1]=Math.sqrt(midPower/count);output[2]=Math.sqrt(highPower/count);
    return output;
  };
}

export function bandTracePath(band, level = .2, phase = 0, shared = 0) {
  const baseline=[.64,.5,.36][band]*320, cycles=[2.1,5.7,13.4][band];
  const amplitude=320*.095*(.12+Math.max(0,Math.min(1,level))*.85+shared*.1);
  let path='';
  for(let i=0;i<=100;i++) {
    const p=i/100, edge=Math.sin(Math.PI*p)**1.5;
    const carrier=Math.sin(p*Math.PI*2*cycles-phase*(.8+band*.27))*.7
      +Math.sin(p*Math.PI*2*cycles*1.52+phase*.33+band)*.23+Math.sin(p*Math.PI*3.6+phase*.45)*.07;
    path+=`${i?'L':'M'}${(p*900).toFixed(1)},${(baseline+carrier*amplitude*edge).toFixed(2)} `;
  }
  return path;
}


export function bandVisualLevel(band, rms, strongest = rms) {
  const energy=Math.max(0,rms-1e-6);
  if(!energy)return 0;
  const reference=[.05,.01,.00015][band];
  const presence=Math.min(1,rms/Math.max(strongest,1e-6))**.18;
  return (1-Math.exp(-Math.sqrt(energy/reference)))*presence;
}


export function sampledBandTracePath(band, samples, source, sampleRate = 48000, level = 0, rms, sourceRms) {
  const baseline=[.64,.5,.36][band]*320;
  const warmup=Math.min(512,Math.floor(samples.length/4));
  if(rms===undefined){let power=0;for(let i=warmup;i<samples.length;i++)power+=samples[i]**2;rms=Math.sqrt(power/Math.max(1,samples.length-warmup));}
  if(sourceRms===undefined){let power=0;for(let i=warmup;i<source.length;i++)power+=source[i]**2;sourceRms=Math.sqrt(power/Math.max(1,source.length-warmup));}
  const window=Math.max(1,Math.min(Math.round(sampleRate*[.024,.006,.0018][band]),samples.length-warmup-257));
  const end=samples.length-window-1,begin=Math.max(warmup,end-256);
  let start=end,strongest=0;
  for(let i=begin;i<end;i++) {
    const slope=samples[i+1]-samples[i];
    if(samples[i]<=0&&samples[i+1]>0&&slope>strongest){strongest=slope;start=i-samples[i]/slope;}
  }
  const gain=18*Math.max(0,Math.min(1,level));
  const normalization=Math.max(rms*1.2,1e-6);
  const sharedNormalization=Math.max(sourceRms*1.2,1e-6);
  const sharedGain=3.4*Math.sqrt(bandVisualLevel(0,sourceRms));
  let path='';
  for(let i=0;i<=100;i++) {
    const p=i/100,index=start+p*window,left=Math.min(samples.length-2,Math.floor(index)),fraction=index-left;
    const own=samples[left]+(samples[left+1]-samples[left])*fraction;
    const shared=source[left]+(source[left+1]-source[left])*fraction;
    const displacement=Math.tanh(own/normalization)*gain+Math.tanh(shared/sharedNormalization)*sharedGain;
    path+=`${i?'L':'M'}${(p*900).toFixed(1)},${(baseline+displacement*Math.sin(Math.PI*p)**1.5).toFixed(2)} `;
  }
  return path;
}

export function drawRestingArtwork(phase = 0, mode = 'wires') {
  const traces = mode === 'wires' ? null : scopeTracePaths(new Float32Array(2), 48000, mode === 'mirror');
  for(const [band,id] of ['wave-primary','wave-secondary','wave-high'].entries()) {
    document.getElementById(id)?.setAttribute('d',traces ? traces[band] : bandTracePath(band,.23-band*.025,phase));
  }
  for (const id of ['spectrum-low','spectrum-mid','spectrum-high']) document.getElementById(id)?.setAttribute('d','');
}

export function initializeAudioArtwork(engine, {settings, onChange = () => {}, phase = () => 0} = {}) {
  const art = document.getElementById('audio-artwork');
  const display = document.getElementById('visualization-display');
  const toggle = document.getElementById('visualization-toggle'), modeButton = document.getElementById('visualization-mode');
  const name = document.getElementById('visualization-name');
  const paths = ['wave-primary','wave-secondary','wave-high'].map(id=>document.getElementById(id));
  const bars = ['spectrum-low','spectrum-mid','spectrum-high'].map(id=>document.getElementById(id));
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  let data;
  function analysisData() {
    if (!data) {
      const samples = new Float32Array(2048);
      data = { samples, levels: new Float32Array(3), measured: new Float32Array(3),
        bands: Array.from({length:3},()=>new Float32Array(samples.length)),
        frequencies: new Float32Array(1024), barLevels: new Float32Array(48), barTargets: new Float32Array(48) };
    }
    return data;
  }
  let options = normalizeVisualization(settings);
  let frame = null, last = null, lastTick = -1, active = false, meterRate = 0, meter;
  function wanted() { return options.enabled && engine.playing && !engine.paused && !engine.interrupted && !document.hidden && !reduced?.matches && !!globalThis.requestAnimationFrame; }
  function enabled() { return wanted() && !!engine.analyser; }
  function draw(now) {
    frame = null;
    if (!enabled()) { reconcile(); return; }
    const tick=Math.floor(now*60/1000);
    if (tick !== lastTick) {
      const {samples, levels, measured, bands, frequencies, barLevels, barTargets} = analysisData();
      lastTick=tick;
      const elapsed=last===null?1/60:Math.min(.15,(now-last)/1000);
      last = now;
      if(engine.analyser.fftSize!==2048)engine.analyser.fftSize=2048;
      engine.analyser.getFloatTimeDomainData(samples);
      const rate=engine.context?.sampleRate??48000;
      if(rate!==meterRate){meterRate=rate;meter=createBandMeter(rate);}
      meter(samples,measured,bands);
      const strongest=Math.max(...measured);
      let shared=0;
      for(let band=0;band<3;band++) {
        const target=bandVisualLevel(band,measured[band],strongest);
        levels[band]=target>=levels[band]?target:target+(levels[band]-target)*Math.exp(-elapsed/.07);
        shared+=levels[band]/3;
      }
      art.style.setProperty('--audio-light',(.35+shared*.2).toFixed(3));
      for(let band=0;band<3;band++) art.setAttribute(['data-low-energy','data-mid-energy','data-high-energy'][band],levels[band].toFixed(4));
      if (options.mode === 'spectrum') {
        frequencies.fill(-Infinity);
        engine.analyser.getFloatFrequencyData?.(frequencies);
        spectrumLevels(frequencies,rate,barTargets);
        for (let i=0;i<barLevels.length;i++) barLevels[i]=barTargets[i]>=barLevels[i]?barTargets[i]:barTargets[i]+(barLevels[i]-barTargets[i])*Math.exp(-elapsed/.1);
        const traces=spectrumTracePaths(barLevels,rate);
        bars.forEach((path,i)=>path?.setAttribute('d',traces[i]));
      } else {
        const traces=options.mode==='wires' ? bands.map((band,i)=>sampledBandTracePath(i,band,samples,rate,levels[i],measured[i],strongest)) : scopeTracePaths(samples,rate,options.mode==='mirror');
        paths.forEach((path,i)=>path?.setAttribute('d',traces[i]));
      }
    }
    frame = requestAnimationFrame(draw);
  }
  function reconcile() {
    const needed = wanted();
    engine.setAnalysisEnabled(needed);
    const running = needed && !!engine.analyser;
    art?.setAttribute('data-animation',running?'running':'paused');
    if (running) {
      active = true;
      if (frame === null) frame = requestAnimationFrame(draw);
    } else {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      data = null; meter = null; meterRate = 0;
      if (active) {
        active = false; last = null; lastTick = -1;
        for (const key of ['data-low-energy','data-mid-energy','data-high-energy']) art.setAttribute(key,'0');
        art.style.setProperty('--audio-light', '.35');
        if(options.enabled)drawRestingArtwork(phase(),options.mode);
      }
    }
  }
  document.addEventListener('visibilitychange', reconcile);
  reduced?.addEventListener('change', reconcile);
  function configure(settings) {
    options=normalizeVisualization(settings);
    art?.setAttribute('data-mode',options.mode);art?.setAttribute('data-enabled',String(options.enabled));
    if(display)display.hidden=!options.enabled;
    const action=options.enabled?'Hide visualization':'Show visualization';
    toggle?.setAttribute('aria-pressed',String(options.enabled));toggle?.setAttribute('aria-label',action);if(toggle)toggle.title=action;
    const index=VISUALIZATION_MODES.findIndex(mode=>mode.value===options.mode),current=VISUALIZATION_MODES[index],next=VISUALIZATION_MODES[(index+1)%VISUALIZATION_MODES.length];
    if(name)name.textContent=options.enabled?current.label:'Visualization off';
    if(modeButton){modeButton.disabled=!options.enabled;modeButton.title=options.enabled?`${current.label}. Next: ${next.label}`:'Show visualization to change its mode';}
    data?.levels.fill(0);data?.barLevels.fill(0);last=null;lastTick=-1;
    if(options.enabled)drawRestingArtwork(phase(),options.mode);
    reconcile();
  }
  toggle?.addEventListener('click',()=>{configure({...options,enabled:!options.enabled});onChange({...options});});
  modeButton?.addEventListener('click',()=>{
    if(!options.enabled)return;
    const index=VISUALIZATION_MODES.findIndex(mode=>mode.value===options.mode);
    configure({...options,mode:VISUALIZATION_MODES[(index+1)%VISUALIZATION_MODES.length].value});onChange({...options});
  });
  configure(options);
  return {configure,refresh(){if(options.enabled&&!active)drawRestingArtwork(phase(),options.mode);reconcile();}};
}
