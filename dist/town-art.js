import {TOWN_ART} from './assets/town-atlas.js?v=0.13.3';
// Lightweight stage overlays; backgrounds and residents remain separate assets.
export function drawTownLayer(c,s,w){
 const scene=s.life.room||s.expansion.region,t=s.town;if(!t)return;const f=t.flags;
 const tag=(text,x,y)=>{c.save();c.font='500 14px "PingFang SC",sans-serif';c.textAlign='center';const size=c.measureText(text).width+20;c.fillStyle='#203e32e6';c.fillRect(x-size/2,y-17,size,26);c.fillStyle='#f4db9f';c.fillText(text,x,y);c.restore();};
 const plank=(x,y,width)=>{c.fillStyle='#65452f';c.fillRect(x,y,width,14);c.fillStyle='#b28a58';c.fillRect(x+3,y+3,width-6,4);c.fillStyle='#d3be89';c.fillRect(x+6,y+5,3,3);c.fillRect(x+width-9,y+5,3,3);};
 const prop=(i,x,y,width,height)=>{const im=w.townArt?.props,box=TOWN_ART.props.boxes[i];if(im?.complete)c.drawImage(im,...box,x,y,width,height);};
 const apple=(x,y)=>prop(0,x-9,y-12,19,20);


 if(scene==='town'){
  if(!f.hall){prop(3,1341,333,62,83);tag('会馆待修复',1374,335);}
  if(!f.sign){plank(450,204,59);}else tag('会馆 · 果园 ↑',476,285);
  if(!f.market){prop(2,185,544,157,61);tag('夜市筹备中',275,486);}
  if(t.layout){const west=t.layout==='west';for(let i=0;i<4;i++)apple((west?226:223)+i*15,west?583:392);tag(west?'面包迎客':'果篮迎客',475,535);}
  if(f.food){w.drawItem(c,'pie',244,394,.85);w.drawItem(c,'pie',277,394,.85);}
  if(f.market){
   c.strokeStyle='#564a34';c.lineWidth=3;c.beginPath();c.moveTo(400,312);c.quadraticCurveTo(880,438,1270,343);c.stroke();
   for(let i=0;i<13;i++){const x=405+i*66,y=313+Math.sin(i/12*Math.PI)*66+i*2;prop(1,x-7,y,14,26);if(s.minute>=1080)w.glow(c,x,y+7,48,.24);}
   if(s.minute>=1080)tag('夜市营业中',820,304);
  }
 }
 if(scene==='orchard'){
  if(!f.cleared){for(const [x,y]of [[709,487],[886,489],[762,577],[993,552]]){c.fillStyle='#827642';for(let i=0;i<5;i++){c.fillRect(x+i*4,y-10-i%3*4,2,15);}}}
  if(!f.irrigation){prop(3,115,197,35,47);tag('蓄水槽待修',184,313);}else{c.fillStyle='#8fcdcd';c.fillRect(133,194,9,29);}
  if(t.growth===2){for(const [x,y]of [[373,345],[470,295],[536,369],[441,410],[737,206],[851,176],[928,259],[809,261],[1164,316],[1237,287],[1312,368],[1230,415]])apple(x,y);}

 }
 if(scene==='hall'){
  if(!f.hall){tag('整理前，先修复会馆',835,301);} // A visual sign only; the central floor remains passable.
  if(f.letters){c.fillStyle='#eddbb3';for(let i=0;i<3;i++)c.fillRect(1250+i*24,332,18,11);}
  if(f.market){c.fillStyle='#dcb75d';c.fillRect(1238,226,22,16);}
 }
}
