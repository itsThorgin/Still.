
export function waveformPath(samples, secondary = false) {
  let path = '';
  const points = 80;
  for (let i = 0; i <= points; i++) {
    const position = i / points;
    const index = Math.min(samples.length - 1, Math.floor(position * (samples.length - 1)));
    const value = samples[index];
    const y = 80 + Math.max(-1, Math.min(1, value * 3)) * Math.sin(Math.PI * position) * (secondary ? -30 : 45);
    path += `${i ? 'L' : 'M'}${(position * 900).toFixed(1)},${y.toFixed(2)} `;
  }
  return path;
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

export function drawRestingArtwork(phase = 0) {
  for(const [band,id] of ['wave-primary','wave-secondary','wave-high'].entries()) {
    document.getElementById(id)?.setAttribute('d',bandTracePath(band,.23-band*.025,phase));
  }
}

export function initializeAudioArtwork(engine, restore) {
  if (!globalThis.requestAnimationFrame || !globalThis.matchMedia) return;
  const art = document.getElementById('audio-artwork');
  const paths = ['wave-primary','wave-secondary','wave-high'].map(id=>document.getElementById(id));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const samples = new Float32Array(2048), levels = new Float32Array(3), measured = new Float32Array(3);
  const bands=Array.from({length:3},()=>new Float32Array(samples.length));
  let frame = null, last = null, lastTick = -1, active = false, meterRate = 0, meter;
  function enabled() { return engine.playing && !document.hidden && !reduced.matches && !!engine.analyser; }
  function draw(now) {
    frame = null;
    if (!enabled()) { reconcile(); return; }
    const tick=Math.floor(now*60/1000);
    if (tick !== lastTick) {
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
      for(let band=0;band<3;band++) {
        paths[band]?.setAttribute('d',sampledBandTracePath(band,bands[band],samples,rate,levels[band],measured[band],strongest));
        art.setAttribute(['data-low-energy','data-mid-energy','data-high-energy'][band],levels[band].toFixed(4));
      }
    }
    frame = requestAnimationFrame(draw);
  }
  function reconcile() {
    if (enabled()) {
      active = true;
      if (frame === null) frame = requestAnimationFrame(draw);
    } else {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      if (active) {
        active = false; levels.fill(0); last = null; lastTick = -1;
        art.style.setProperty('--audio-light', '.35');
        restore();
      }
    }
  }
  document.addEventListener('visibilitychange', reconcile);
  reduced.addEventListener('change', reconcile);
  
  setInterval(reconcile, 250);
}
