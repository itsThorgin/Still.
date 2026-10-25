import {electronicCharacter} from '../electronic-characters.mjs';
const sequenceSettings=(kind,id)=>electronicCharacter(kind,id).sequence;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const hz=m=>440*2**((m-69)/12);


const tonalOffset=(root,n)=>root===0?n:n===3?4:root===3&&n===10?11:root===3&&n===-2?-1:n;

const HEAVY=[
 [[0,0,5.9,1,0],[7,0,1.1,.82,1],[11,3,2.7,.94,2]],
 [[1,0,2.2,.92,1],[5,0,1.2,.72,2],[10,-2,4.3,1,3]],
 [[0,0,3.4,1,2],[6,7,1.3,.82,1],[10,3,3.4,.94,0]],
 [[2,0,5.7,1,3],[11,-2,1.5,.79,2],[14,0,.8,.75,1]],
 [[0,0,6.5,1,3],[9,3,1.4,.84,1],[12,0,2.3,.9,2]],
 [[1,0,2.5,.92,0],[6,-2,2,.85,2],[10,0,3.5,1,1]],
 [[0,0,3.6,1,1],[6,3,2.2,.91,0],[11,7,2.6,.88,3]],
 [[0,3,3.2,.9,2],[5,-2,4.5,1,3],[12,0,1.8,.86,0]],
];
const DEEP=[
 [[3,0,6.2,1,0]],[[12,0,2.6,.78,1]],[[1,0,4.6,.92,0],[11,7,2.2,.62,2]],[],
 [[6,0,6.7,1,1]],[[2,-2,3.7,.78,2]],[],[[1,0,5.8,.93,0],[13,0,1.8,.58,1]],
];
const GARAGE=[
 [[2,0,1.6,.94,0],[7,0,2.4,1,1],[13,7,1.6,.81,0]],
 [[0,0,2.4,1,0],[6,3,1.5,.82,1],[11,0,2.4,.95,2]],
 [[2,-2,2.4,.9,1],[7,0,1.6,1,0],[10,7,1.4,.79,2],[14,3,1.1,.72,1]],
 [[1,3,2.2,.87,2],[6,0,2.6,1,0],[11,-2,1.5,.8,1],[14,0,1.1,.73,0]],
 [[1,0,2.5,1,0],[7,7,1.6,.81,2],[13,0,1.7,.93,1]],
 [[2,3,1.5,.86,1],[6,0,2.4,1,0],[11,7,1.8,.8,2]],
 [[0,-2,2.5,.86,2],[7,3,2.1,.94,0],[13,0,1.5,.88,1]],
 [[2,3,2.3,.88,1],[7,-2,2.6,.8,2],[12,0,2.5,1,0]],
];
const RUBBER=[
 [[0,0,1.5,1,0],[3,0,1.2,.72,1],[7,3,1.5,.92,2],[10,0,1.5,1,1],[14,7,1,.8,0]],
 [[1,0,2.1,1,2],[6,-2,1.2,.82,0],[9,0,1.5,.9,1],[12,3,2.3,.94,3]],
 [[0,0,1.5,1,1],[3,7,1,.73,2],[7,3,1.4,.9,0],[10,0,2.2,1,2]],
 [[1,-2,2.3,.86,2],[6,0,1.2,.84,0],[10,0,4.4,1,3]],
 [[0,0,2.2,1,2],[5,3,1.5,.86,1],[8,7,1.5,.9,0],[11,0,2.4,1,3]],
 [[1,3,1.5,.88,0],[6,0,3.8,1,3],[13,-2,1.5,.8,1]],
 [[0,0,1.6,1,1],[3,3,1.2,.76,2],[7,7,1.4,.9,0],[10,3,2.5,.93,2]],
 [[0,3,2.1,.9,2],[5,-2,2.1,.83,0],[10,0,4.1,1,3]],
];
const NIGHT=[
 [[0,0,.8,.94],[3,0,.9,.72],[6,7,1.5,.84],[10,0,1.6,1],[13,3,1.5,.77]],
 [[0,0,1.5,1],[5,-2,1.5,.8],[8,0,.9,.85],[11,7,.9,.72],[14,0,1.3,.92]],
 [[0,0,1,.95],[3,3,1.3,.79],[6,0,1.4,.87],[10,-2,1.7,.9],[14,0,.9,.72]],
 [[0,0,1.6,1],[5,7,1.3,.82],[9,3,1.6,.89],[13,0,1.7,.8]],
];
const TOMORROW=[
 [[2,0,1.5,1],[6,7,1.6,.82],[10,0,1.4,.94],[15,3,.7,.68]],
 [[2,0,2.5,1],[7,3,1.6,.84],[11,7,1.6,.83]],
 [[1,-2,2.2,.9],[6,0,1.6,1],[10,7,2.5,.8]],
 [[2,3,1.6,.84],[6,0,2.5,1],[11,-2,1.5,.76],[15,0,.7,.69]],
];

const HORIZON=[
 [0,1,0,.96,.85,false],[0,5,7,1.71,1,true],[0,12,10,.72,.74,true],
 [1,1,12,2.74,1,true],[1,12,10,.72,.77,true],
 [2,1,7,1.72,.9,true],[2,8,3,1.46,.77,true],
 [3,1,2,1.15,.69,false],[3,9,0,1.28,.87,false],
 [4,1,0,1.72,.84,false],[4,8,3,1.72,.9,true],
 [5,1,7,2.72,1,true],[5,12,5,.72,.72,true],
 [6,1,3,1.72,.82,true],[6,8,2,1.72,.71,true],
 [7,1,0,2.25,.85,true],
];
const points=(rows,bar)=>{
  let i=0;while(i<rows.length-2&&bar>=rows[i+1][0])i++;
  const a=rows[i],b=rows[i+1],t=clamp((bar-a[0])/(b[0]-a[0]));
  return a.slice(1).map((v,j)=>lerp(v,b[j+1],t*t*(3-2*t)));
};
export class SequencePlan{
  constructor(kind,id,seed=42){
    this.p=sequenceSettings(kind,id);if(!this.p)throw Error('Unknown sequence');
    this.kind=kind;this.seed=seed;this.character={value:this.p.id,label:this.p.label,tempo:this.p.tempo};
    this.formBars=this.p.formBars;this.barSteps=16;this.phraseSteps=128;this.state={};
  }
  scene(bar){
    const id=this.p.id,b=bar%this.formBars;
    if(this.kind==='techno'){
      
      const rows=id===15?[[0,.3,0,0,.05],[8,.7,.1,0,.35],[16,1,.38,.06,.65],[32,1,.75,.18,.85],[48,1,1,.26,1],[64,.84,.28,.32,.62],[72,1,.8,.25,.85],[96,1,1,.30,1],[112,.8,.55,.2,.75],[128,.3,0,0,.05]]:
        [[0,.32,0,0,.1],[8,.65,.12,.05,.35],[16,.85,.5,.22,.6],[32,1,.8,.5,.82],[48,1,1,.85,1],[64,.86,.44,.9,.6],[72,1,.82,.78,.85],[96,1,1,1,1],[112,.8,.55,.6,.75],[128,.32,0,0,.1]];
      const [bass,music,pad,hats]=points(rows,b);
      return {name:b<16?'Opening':b<32?'Layers gather':b<64?'Sequence pressure':b<72?'Breathing space':b<112?'Progressive return':'Closing',bass,music,pad,hats,drums:1,colour:music,build:0};
    }
    if(id===10){
      const build=b>=16&&b<24||b>=72&&b<80,local=build?(b<24?b-16:b-72)/8:0,
        gap=b>=40&&b<42,susp=b>=64&&b<72;
      return {name:build?'Build':gap?'Rupture':susp?'Suspension':b<8?'Opening':b<16?'Tension':b>=88?'Closing':'Drop / response',
        bass:gap?0:build?1-local*.92:susp?.36:b<8?.36:b<16?.56:b>=88?.68:1,
        music:gap?0:build?.3+local*.5:susp?.38:b<16?.3:1,pad:susp?.8:b<24?.6:.15,
        drums:gap?0:susp?.46:b<8?.5:b>=88?.75:1,hats:build?.3+local*.7:susp?.2:b<8?.3:1,
        colour:build?local:b>=48?1:.72,build:build?local+.001:0,gap};
    }
    const pocket=b>=32&&b<(id===29?40:36),opening=b<16,thin=b>=64&&b<72;
    return {name:opening?'Opening':pocket?'Subtracted pocket':thin?'Layers recede':b>=88?'Closing':'Statement / response',
      bass:pocket?(id===29?.24:0):thin?.55:b<8?.15:b<16?.66:b>=88?.64:1,
      music:pocket?(id===29?.24:0):thin?.2:opening?.4:b>=88?.45:1,
      pad:id===29?(pocket?.9:.45):thin?.5:.25,
      drums:opening?.7:thin?.72:1,hats:opening?.5:thin?.45:1,colour:b>=48?.95:.6,build:0,pocket};
  }
  events(step){
    const p=this.p,id=p.id,bar=Math.floor(step/16)%p.formBars,tick=step%16,local=bar%8,
      scene=this.scene(bar+tick/16),out=[],tech=p.kind==='techno',late=bar>=36,
      colourVariation=((this.seed*17+bar*13+tick*7)%11)/110;
    this.state=scene;if(scene.gap)return out;
    const drum=(type,amp,pan=0,extra={})=>out.push({part:'drums',type,amplitude:amp*scene.drums,pan,
      delay:!['kick','snare','clap'].includes(type)&&tick%2?(id===33?.070:tech?.018:.009):0,...extra});
    const note=(part,type,midi,gate,amp,extra={})=>out.push({part,type,frequency:hz(midi),midi,beats:gate,amplitude:amp,pan:0,colour:colourVariation,...extra});
    const bass=(row,type,amp,root=0)=>{
      const n=row.find(n=>n[0]===tick);if(!n||scene.bass<=0)return;
      const midi=p.key+root+([33,38].includes(id)?tonalOffset(root,n[1]):n[1]);
      note('bass',type,midi,n[2]/4,amp*n[3]*scene.bass,{tone:n[4]??local%3,
        delay:id===33&&tick%2?.065:0,colour:scene.colour+colourVariation,
        bend:id===42?(n[4]===3?-2.5:4.3):id===10?(n[4]===3?3.5:-1.3):id===33?1.1:0,
        upperOctave:id===42&&late&&local>=4?1:0});
    };
    const chord=(midi,offsets,gate,amp,type='chord',extra={})=>offsets.forEach((n,i)=>note('chords',type,midi+n,gate,amp/Math.sqrt(offsets.length),
      {pan:(i-(offsets.length-1)/2)*.25,colour:scene.colour+colourVariation,...extra}));
    if(id===10){
      const kicks=[[0,6],[0,11],[0,5,14],[2,12]][bar%4];
      if(kicks.includes(tick)&&!(scene.build&&local===7&&tick>=12))drum('kick',.48);
      if(tick===8&&bar>=4) {drum('snare',.48);drum('clap',.075,0,{delay:.014});}
      if([2,6,10,14].includes(tick)&&bar>=8)drum('hat',.065*scene.hats*(tick===6?1:.65),tick%8===2?-.25:.25);
      if(local===6&&[7,15].includes(tick)&&!scene.build)drum('rim',.07,.25);
      if(scene.build&&local>=4&&tick%(local>=7?1:local>=6?2:4)===0&&!(local===7&&tick>=12))drum('snare',.08+scene.build*.11,(tick%3-1)*.15,{decay:.07});
      if(scene.build&&local===7&&tick>=12)return out.filter(e=>false); 
      let row=HEAVY[local];
      if(bar<16||bar>=64&&bar<72)row=local%2===0?[[0,0,7,.8,3]]:[];
      if(scene.build)row=local<4?[[0,0,4,1,0]]:local<7?[[0,0,2,.8,1],[8,0,1.2,.65,2]]:[];
      bass(row,'tearout',.37);
      if([24,48,80].includes(bar)&&tick===0){drum('impact',.11,-.05);chord(p.key+24,[0,7,12],.32,.105,'brass',{send:.1});}
      if(bar%8===0&&tick===0&&(bar<24||bar>=64&&bar<80))chord(p.key+36,[0,1,7],7.5,.022,'tension');
      if(scene.build&&tick===0)note('pad','rise',p.key+36,3.7,.018+scene.build*.021,{bend:12*scene.build,send:.18});
      if(local===7&&tick===13&&!scene.build)drum('impact',.035,.3,{decay:.1});
    }else if(id===29){
      const rows=[[0],[11],[0,13],[],[3],[0],[],[10]];
      if(rows[local].includes(tick))drum('kick',.43*(scene.pocket?.65:1));
      if(tick===8&&bar>=8&&(!scene.pocket||local%2===0))drum('snare',.24);
      if([6,14].includes(tick)&&!(local===3||local===6))drum('hat',.026*scene.hats,tick===6?-.32:.3);
      if([[1,5],[3,14],[5,3],[7,15]].some(([b,t])=>local===b&&tick===t))drum('click',.065,local%2?.45:-.4,{send:.8});
      if(local===2&&tick===13||local===6&&tick===7)drum('rim',.046,-.32,{send:.58});
      let row=DEEP[local];if(bar<8)row=local===0?[[3,0,5,.7,0]]:[];
      if(scene.pocket)row=local===7?[[9,0,4,.7,1]]:[];
      if(bar>=48&&local===4)row=[[7,0,4.5,1,2],[14,-2,1,.6,0]];
      bass(row,'deep',.47);
      
      if((local===2&&tick===14||local===7&&tick===9)&&bar>=8)chord(p.key+36,[3,10],.16,.025*scene.music,'cut',{send:1});
      if(local===0&&tick===0&&bar%16===0)note('pad','air',p.key+36,22,.007*scene.pad,{pan:.18,send:.85});
    }else if(id===33){
      const root=[0,-2,3,0][Math.floor(bar/2)%4],kickRows=[[0,7,10],[0,6,14],[2,7,11],[0,6,10,15]];
      if(kickRows[bar%4].includes(tick))drum('kick',.42);
      if([4,12].includes(tick)){drum('snare',.27);drum('clap',.105,0,{delay:.011});}
      if([2,3,6,7,10,11,14,15].includes(tick))drum('hat',.061*scene.hats*(tick%2?.44:1),tick%4===2?-.22:.24);
      if([7,15].includes(tick)&&bar%2)drum('snare',.042,-.16,{delay:.067,decay:.065});
      if(tick%4===3&&local%2===0)drum('shaker',.023*scene.hats,.43);
      if(local===7&&tick===15)drum('rim',.045,-.28);
      if(!scene.pocket)bass(GARAGE[local],'garage',.37,root);
      const stabRows=[[3,10],[6,14],[3,11],[7],[2,10],[6,14],[3,10],[6]];
      if(stabRows[local].includes(tick)&&bar>=8&&!scene.pocket)chord(p.key+24+root,[0,3,7,10,14].map(n=>tonalOffset(root,n)),local===7?.43:.24,.08*scene.music,'chord',{delay:tick%2?.064:0,send:.25});
      const chops=[[0,14,7,.24,.8],[1,3,3,.19,1],[1,11,0,.32,.85],[2,14,10,.22,.76],[3,2,3,.34,.8],[3,10,0,.44,1],
        [4,14,7,.25,.8],[5,3,10,.20,.8],[5,11,7,.31,1],[6,14,3,.27,.77],[7,2,2,.28,.7],[7,8,0,.53,.86]];
      for(const [b,t,n,g,a] of chops)if(local===b&&tick===t&&bar>=16&&!scene.pocket)note('lead','vowel',p.key+36+n,g,.069*a*scene.music,
        {delay:tick%2?.065:0,tone:(b+Math.floor(bar/8))%3,pan:b%2?.12:-.12,send:.22});
      if(bar>=88&&local===7&&tick===8)chord(p.key+24,[0,3,7,14],1.65,.06,'chord',{send:.18});
    }else if(id===42){
      const kickRows=[[0,7,10],[0,6,11],[0,7,10,14],[0,6,9]];
      if(kickRows[bar%4].includes(tick))drum('kick',.43);
      if([4,12].includes(tick))drum('snare',.42);
      if(tick%2===0)drum(tick===14&&local%2?'open-hat':'hat',.062*scene.hats*(tick%4===2?1:.55),tick%4===2?.2:-.2);
      if([3,7,9,15].includes(tick)&&!(local%4===0&&tick===9))drum('snare',.035*(tick===15?1.3:1),-.13,{decay:.055});
      if(tick%4===3&&local%2)drum('shaker',.025*scene.hats,.35);
      if(local===7&&[13,15].includes(tick))drum('snare',tick===15?.13:.065,.15,{decay:.065});
      let row=RUBBER[local];if(bar<8||scene.pocket)row=[];else if(bar<16)row=local%2===0?RUBBER[0].slice(0,2):[];
      if(bar>=48&&local===2)row=[[0,3,2.2,1,2],[6,7,1.4,.83,0],[10,0,4.1,1,3]];
      bass(row,'rubber',.37);
      if([16,36,72].includes(bar)&&tick===0)drum('impact',.048,.27,{decay:.24});
      if([1,5].includes(local)&&tick===15&&bar>=16&&!scene.pocket)chord(p.key+36,[0,3,7],.14,.032*scene.music,'rave',{send:.12});
    }else{
      if(tick%4===0)drum('kick',id===15?.40:.38);
      if([4,12].includes(tick)&&bar>=8){drum('clap',.115);if(id===15)drum('snare',.078,0,{decay:.09});}
      if([0,2,6,8,10,14].includes(tick)&&bar>=4)drum('hat',.055*scene.hats*(tick%4===2?1:.45),-.17);
      if([6,14].includes(tick)&&bar>=16&&!(local===7&&tick===14))drum('open-hat',.052*scene.hats,.23);
      if(id===15&&[3,11,15].includes(tick)&&bar>=16)drum(tick===11?'tom':'rim',.056*scene.hats*(tick===15?.55:1),.28,{delay:tick%2?.019:0});
      if(id===38&&[7,15].includes(tick)&&bar>=24)drum('tom',.045*scene.hats,-.25,{tuning:tick===7?1:1.19});
      if(bar>=96&&local%4===2&&tick===13)drum('rim',.037,-.3);
      const root=id===15?[0,0,-2,0][Math.floor(bar/8)%4]:[0,3,-2,0][Math.floor(bar/8)%4];
      bass((id===15?NIGHT:TOMORROW)[bar%4],'detroit',id===15?.30:.32,root);
      const positions=id===15?[[3,11],[6,15],[3,10,14],[7],[3,11],[5,14],[2,10],[6]]:
        [[7],[3,11],[6],[3,14],[7],[2,10],[5,13],[10]];
      if(positions[local].includes(tick)&&bar>=16){
        const close=local===7,amp=(id===15?.082:.063)*scene.music*[1,.7,.86,.58,1,.8,.76,.52][local];
        chord(p.key+24+root,id===15?[0,3,7,10]:[0,3,7,14].map(n=>tonalOffset(root,n)),close?.26:id===15?.24+(local%3)*.11:.36,amp,'chord',
          {delay:tick%2?.019:0,tone:id===15?0:1,send:id===15?.16:.24});
      }
      if(id===15&&local===2&&tick===13&&bar>=32)note('lead','sequence',p.key+24+root+7,.66,.022*scene.music,{send:.12});
      if(id===38&&bar>=32){
        const themeGain=bar<48?(bar-32)/16:bar>=64&&bar<72?.34:bar>=112?.55:1;
        for(const [b,t,n,g,a,connect] of HORIZON)if(local===b&&tick===t)
          note('lead','sequence',p.key+24+root+tonalOffset(root,n),g,.060*a*themeGain,{connect,colour:scene.music,tone:1,send:.27,
            bend:bar>=96&&local===7?-.35:0});
      }
      if(tick===0&&bar%8===0&&bar>=24){
        const offsets=id===15?[7,10]:[3,7,14];
        offsets.forEach((n,i)=>note('pad','pad',p.key+36+root+(id===38?tonalOffset(root,n):n),29,.012*scene.pad/Math.sqrt(offsets.length),
          {pan:(i-(offsets.length-1)/2)*.55,colour:scene.music,send:.55}));
      }
    }
    return out;
  }
}
