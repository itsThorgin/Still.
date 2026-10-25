import {retroCharacter} from '../retro-characters.mjs';
import {mixRetroSeed} from '../retro-styles.mjs';

const mod=(n,m)=>(n%m+m)%m,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hz=m=>440*2**((m-69)/12);
const ARPS={broken:[0,4,8,12],rocking:[0,8,12],orbit:[0,3,8,11,14],droplets:[2,10],
  woven:[0,6,10,14],ostinato:[0,6,8,14],alberti:[0,4,8,12],offbeat:[2,6,10,14],
  chip:[0,4,8,12],comp:[0,6,10],none:[]};
export class CozyRetroPlan {
  constructor(seed,selection){
    this.seed=seed>>>0;this.style=retroCharacter(selection);if(!this.style)throw new RangeError('Unknown cozy retro character');
    this.character=this.style;this.scale=this.style.scale;
    this.tonic=[48,50,53,55][mixRetroSeed(seed^0x7865)%4];this.progression=this.style.progression;
    this.motif=this.style.melody.a;this.answer=this.style.melody.b;this.stepsPerBar=16;this.bars=64;
    
    this.scores=Array.from({length:4},(_,cycle)=>this.compose(cycle));
  }
  midi(degree,octave=0){return this.tonic+12*(octave+Math.floor(degree/7))+this.scale[mod(degree,7)];}
  frequency(degree,octave=0){return hz(this.midi(degree,octave));}
  scene(bar,cycle=0){const type=this.style.arrangement[Math.floor(mod(bar,64)/8)];return cycle>0&&type==='intro'?'variation':type;}
  root(bar,cycle){
    const scene=this.scene(bar,cycle),local=mod(bar,8);
    if(local===7&&scene!=='intro'&&scene!=='interlude')return scene==='theme'||scene==='variation'?4:0;
    return this.progression[Math.floor(mod(bar,16)/this.style.harmony.chordBars)%8];
  }
  chordDegrees(root){
    const q=this.style.harmony.quality;
    return (q==='seventh'?[0,2,4,6]:q==='sixth'?[0,2,4,5]:q==='add9'?[0,2,4,8]:q==='sus2'?[0,1,4]:q==='open'?[0,4,7]:[0,2,4]).map(n=>n+root);
  }
  voiced(degrees,previous){
    const pitches=degrees.map(d=>this.midi(d));let winner,best=Infinity;
    for(let inversion=0;inversion<pitches.length;inversion++)for(let octave=-1;octave<=1;octave++){
      const notes=pitches.map((p,i)=>p+12*(octave+(i<inversion?1:0))).sort((a,b)=>a-b);
      if(notes[0]<45||notes.at(-1)>78)continue;
      const score=previous?notes.reduce((n,p,i)=>n+Math.abs(p-previous[Math.min(i,previous.length-1)]),0):Math.abs(notes.reduce((a,b)=>a+b)/notes.length-59);
      if(score<best){best=score;winner=notes;}
    }
    return winner??pitches;
  }
  compose(cycle){
    const c=this.style,score=Array.from({length:1024},()=>[]),busy=new Uint8Array(1024),chords=[];
    const random=(bar,index)=>mixRetroSeed(this.seed^Math.imul(c.value,65537)^Math.imul(bar+1,31337)^index)/4294967296;
    const push=(step,midi,beats,role,instrument,amplitude,pan,extra={})=>{
      if(!instrument||step>=1024||step<0)return;
      const beat=step%4,bar=Math.floor(step/16),human=c.synthesis.authentic?0:random(bar,step+83)*c.timing.humanize;
      const delay=(beat===2?c.timing.swing:0)+human;
      score[step].push({frequency:hz(clamp(midi,33,91)),midi:clamp(midi,33,91),beats,role,instrument,
        amplitude,pan,delay,cozy:true,...extra});
    };
    let previous;
    for(let bar=0;bar<64;bar++){
      const root=this.root(bar,cycle),notes=this.voiced(this.chordDegrees(root),previous);
      chords.push({root,notes});previous=notes;
    }
    this.chords??=chords;

    for(let bar=0;bar<64;bar++){
      const scene=this.scene(bar,cycle),local=bar%8;
      if(scene==='interlude'||scene==='intro'&&local<4)continue;
      if(c.melody.space===2&&local%4>=2&&local!==7)continue;
      if(c.melody.space===1&&local===5)continue;
      const answering=scene==='answer'||scene==='resolve',cell=answering?this.answer:this.motif;
      const rhythm=c.melody.rhythm,cellOffset=bar%2*16;
      for(let n=0;n<rhythm.length;n++){
        const pos=rhythm[n];if(pos<cellOffset||pos>=cellOffset+16)continue;
        const tick=pos-cellOffset;if(local===7&&tick>8)continue;
        let degree=cell[n],accent=tick%4===0;
        
        if(n===2||n===5)degree+=(mixRetroSeed(this.seed^c.value^Math.imul(n,73))%3)-1;
        
        if(local>=2&&local<4&&scene!=='resolve')degree+=answering?-1:1;
        if(scene==='variation'&&n===3)degree+=1;
        if(cycle>0&&local===6&&n===2)degree+=(cycle%2?1:-1);
        degree=clamp(degree,0,10);
        if(accent){
          const candidates=this.chordDegrees(chords[bar].root).flatMap(d=>[-7,0,7].map(o=>d+o)).filter(d=>d>=0&&d<=11);
          degree=candidates.reduce((best,d)=>Math.abs(d-degree)<Math.abs(best-degree)?d:best,candidates[0]);
        }
        if(local===7)degree=answering||scene==='return'?0:4;
        const next=rhythm[n+1]??32,remaining=local===7?Math.min(2.2,(16-tick)/4):Math.min(1.85,(next-pos)/4*c.melody.gate);
        const length=Math.max(.15,remaining),start=bar*16+tick;
        const dynamics=(.82+.13*Math.sin(n/rhythm.length*Math.PI))*(accent?1:.86)*(scene==='intro'?.55:scene==='resolve'?.8:1);
        push(start,this.midi(degree,c.melody.leadOctave),length,'melody',c.instruments.lead,.38*dynamics*c.mix.lead,-.08,
          {channel:'lead',duty:c.synthesis.duty,vibrato:c.synthesis.vibrato,glide:c.synthesis.glide});
        for(let k=start;k<Math.min(1024,start+Math.ceil(length*4)+1);k++)busy[k]=1;
      }
    }
    for(let bar=0;bar<64;bar++){
      const {root,notes}=chords[bar],scene=this.scene(bar,cycle),local=bar%8,
        thin=scene==='intro'||scene==='interlude'||scene==='resolve',intensity=scene==='intro'?.5:scene==='interlude'?.64:scene==='resolve'?.72:1;
      const pad=c.instruments.pad;
      if(pad&&bar%c.harmony.chordBars===0){
        
        for(let i=0;i<notes.length;i++)push(bar*16,notes[i],c.harmony.chordBars*4-.08,'accompaniment',pad,
          .022*intensity*c.mix.chords,(i/(notes.length-1)-.5)*.9,{channel:`pad-${i}`,send:1});
      }
      const bassTicks=c.bassPattern==='long'||c.bassPattern==='pedal'?[0]:c.bassPattern==='pulse'?[0,6,8,14]:c.bassPattern==='walk'?[0,4,8,12]:c.bassPattern==='ostinato'?[0,6,10]:c.bassPattern==='bounce'?[0,6,8,14]:[0,8];
      for(let i=0;i<bassTicks.length;i++){
        if(thin&&i>0&&scene!=='resolve')continue;
        const tick=bassTicks[i],degree=c.bassPattern==='pedal'?0:root+(c.bassPattern==='walk'?[0,2,4,1][i]:i%2?4:0);
        let midi=this.midi(degree,-1);while(midi>54)midi-=12;while(midi<35)midi+=12;
        const duration=c.bassPattern==='long'||c.bassPattern==='pedal'?3.7:Math.max(.32,((bassTicks[i+1]??16)-tick)/4*.8);
        push(bar*16+tick,midi,duration,'bass',c.instruments.bass,.038*c.mix.bass*intensity,0,{channel:'bass',send:.025,vibrato:0});
      }
      let ticks=ARPS[c.accompaniment.pattern];
      if(thin)ticks=ticks.filter((_,i)=>i%2===0);
      for(let i=0;i<ticks.length;i++){
        const tick=ticks[i];if(local===7&&tick>8)continue;
        const order=c.accompaniment.pattern==='alberti'?[0,2,1,2]:c.accompaniment.pattern==='orbit'?[0,2,1,3,2]:[0,1,2,1];
        const note=notes[order[i%order.length]%notes.length]+12*c.accompaniment.arpOctave;
        const comp=c.accompaniment.pattern==='comp'||c.accompaniment.pattern==='offbeat';
        if(comp){
          
          for(let j=1;j<notes.length;j++)push(bar*16+tick,notes[j],c.accompaniment.pattern==='comp'?.85:.32,'accompaniment',c.instruments.accompaniment,
            .032*intensity*c.mix.arp*(busy[bar*16+tick]?.7:1),j%2?.28:-.28,{channel:`comp-${j}`,send:.5});
        }else push(bar*16+tick,note,c.accompaniment.pattern==='droplets'?1.6:.65,'accompaniment',c.instruments.accompaniment,
          .09*intensity*c.mix.arp*(busy[bar*16+tick]?.68:1),i%2?.42:-.42,
          {channel:c.synthesis.authentic?'arp':`arp-${i%2}`,duty:.25,vibrato:0,send:.65});
      }
      
      if(!c.synthesis.authentic&&scene!=='intro'&&scene!=='resolve')for(const tick of [4,12]){
        const start=bar*16+tick;
        if((scene==='interlude'||scene==='answer'||scene==='variation')&&!busy[start]&&!busy[Math.min(1023,start+2)]){
          const degree=this.answer[(local+(tick===12?3:0))%8];
          push(start,this.midi(degree,0),.9,'melody',c.instruments.reply,.16*c.mix.answer,.25,{channel:'reply',send:.8,vibrato:2});
        }
      }
      const p=c.percussion;
      if(p.pattern==='none'||scene==='intro'&&local<6||scene==='interlude'||scene==='resolve'&&local>=6)continue;
      const drum=(tick,type,level,length)=>{
        if(local===7&&tick>=8)return;
        score[bar*16+tick].push({drum:type,kit:p.kit,beats:length,amplitude:level*p.density*intensity,
          delay:(tick%4===2?c.timing.swing:0)+(c.synthesis.authentic?0:c.timing.humanize*.65),cozy:true});
      };
      drum(0,'kick',.083,.45);if(p.density>.4)drum(8,'kick',.057,.35);
      if(p.density>.2){drum(p.pattern==='jazz'?6:4,'tap',.054,.28);drum(12,'tap',.04,.3);}
      if(p.density>.3)for(const tick of [2,6,10,14])drum(tick,'hat',tick===2?.024:.017,.16);
    }
    return score;
  }
  events(step){return this.scores[Math.floor(step/1024)%4][mod(step,1024)];}
}
