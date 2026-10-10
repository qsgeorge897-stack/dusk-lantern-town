export const FISH={
 silver:{name:'银尾小鱼',sell:2,min:8,max:18,difficulty:.65,tip:'全天 · 近水常见'},
 carp:{name:'河鲫',sell:4,min:15,max:30,difficulty:.85,tip:'全天 · 近水常见'},
 bass:{name:'苔背鲈',sell:7,min:22,max:45,difficulty:1.25,tip:'白天 · 远水'},
 eel:{name:'灯影鳗',sell:10,min:30,max:65,difficulty:1.55,tip:'夜晚持灯 · 远水，雨夜更多'},
};
export const FISH_ITEMS=Object.fromEntries([...Object.entries(FISH).map(([k,f])=>[k,{name:f.name,sell:f.sell,color:'#9bb9b0',icon:k}]),['fishSoup',{name:'香草鱼汤',sell:12,color:'#d9b67c',icon:'fishSoup'}]]);
export const FISH_SPOT={id:'fishing',name:'栈桥钓位',subtitle:'领取鱼竿 · 近水与远水',x:1097,y:691,stand:{x:1100,y:700},radius:65};
export function selectFish(s,depth,r=Math.random()){
 if(!s.life.catches)return 'silver';
 if(depth==='near')return r<.55?'silver':'carp';
 if(s.minute>=1080&&s.lantern){const chance=s.weather==='rain'?.48:.25;if(r<chance)return 'eel';return r<.72?'carp':'silver';}
 if(s.minute<1080&&r<.5)return 'bass';return r<.78?'carp':'silver';
}
// A single transient cast. No inventory writes happen in animation updates.
export function newCast(ticket,assist=false){return {...ticket,assist,stage:'cast',elapsed:0,total:0,tension:48,progress:0,danger:0,held:false,wait:3+(ticket.length%5),warning:false};}
export function hookCast(g){if(g.stage==='bite'){g.stage='reel';g.elapsed=0;return true;}return false;}
export function stepCast(g,dt){
 if(['caught','escaped'].includes(g.stage))return g.stage;
 g.elapsed+=dt;g.total+=dt;
 if(g.stage==='cast'&&g.elapsed>=.65){g.stage='wait';g.elapsed=0;}
 else if(g.stage==='wait'&&g.elapsed>=g.wait){g.stage='bite';g.elapsed=0;}
 else if(g.stage==='bite'&&g.elapsed>(g.assist||g.tutorial?3:1.6)){g.stage='escaped';}
 else if(g.stage==='reel'){
  const d=FISH[g.fish].difficulty,cycle=g.elapsed%(3.2/d);g.warning=cycle>1.3/d&&cycle<1.8/d;
  const surge=cycle>=1.8/d&&cycle<2.5/d;
  const held=g.assist?g.tension<55:g.held;
  g.tension=Math.max(0,Math.min(100,g.tension+((held?24:-25)+(surge?25*d:2))*dt));
  if(g.tension>=24&&g.tension<=76)g.progress=Math.min(100,g.progress+dt*(g.tutorial?15:14/d));
  g.danger=g.tension>90?g.danger+dt:Math.max(0,g.danger-dt*2);
  if(g.progress>=100)g.stage='caught';else if(g.danger>=1.5||g.elapsed>=35)g.stage='escaped';
 }
 return g.stage;
}
