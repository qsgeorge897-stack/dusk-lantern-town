import {sceneOf} from './indoors.js?v=0.13.3';
import {SEAL_VALVES} from './archive-battle.js?v=0.13.3';
export const ARCHIVE_ART={file:'./assets/characters/archive-props-v1.png',boxes:{valveIdle:[47,99,294,317],valveSafe:[428,99,296,317],deviceOff:[817,43,282,414],deviceOn:[1201,44,282,413],ledger:[44,561,309,384],badge:[438,576,279,331],standing:[863,525,171,450],seated:[1175,633,319,299]}};
export function archiveProp(c,im,key,x,y,width){const box=ARCHIVE_ART.boxes[key];if(!im?.complete||!box)return;const h=width*box[3]/box[2];c.drawImage(im,...box,x-width/2,y-h,width,h);}
function tag(c,text,x,y){c.save();c.font='14px "PingFang SC",sans-serif';c.textAlign='center';const width=c.measureText(text).width+18;c.fillStyle='#24352de0';c.fillRect(x-width/2,y-18,width,26);c.fillStyle='#f3dfad';c.fillText(text,x,y);c.restore();}
function device(c,im,p,on){archiveProp(c,im,on?'deviceOn':'deviceOff',p.x,p.y,86);}
export function operationLayers(c,b,im){if(b.operation?.kind!=='sealDevice')return [];const op=b.operation;
 for(const [i,v]of op.valves.entries()){const active=i===op.closed;c.save();c.strokeStyle=v.closed?'#95bbaa':active?'#e9c470':'#8b8171';c.lineWidth=active?3:1;c.beginPath();c.ellipse(v.x,v.y,53,22,0,0,Math.PI*2);c.stroke();c.restore();tag(c,`${i+1} ${v.name} · ${v.closed?'已关闭':active?'走近按 E':'稍后'}`,v.x,v.y+35);}
 const layers=op.valves.map(v=>({y:v.y,draw:()=>archiveProp(c,im,v.closed?'valveSafe':'valveIdle',v.x,v.y,56)}));layers.push({y:b.pump.y,draw:()=>{device(c,im,b.pump,true);tag(c,`封存装置 ${Math.ceil(b.pump.hp)}/${b.pump.max}`,b.pump.x,b.pump.y-140);c.fillStyle='#202f2a';c.fillRect(b.pump.x-54,b.pump.y-124,108,6);c.fillStyle=b.pump.hp<b.pump.max*.3?'#d18e6f':'#a8be85';c.fillRect(b.pump.x-54,b.pump.y-124,108*b.pump.hp/b.pump.max,6);}});
 if(op.channel){const v=op.valves[op.channel.index];c.fillStyle='#192e26';c.fillRect(v.x-40,v.y+43,80,7);c.fillStyle='#f1cb79';c.fillRect(v.x-40,v.y+43,80*Math.min(1,op.channel.age/2),7);}return layers;
}
export function drawArchiveLayer(c,s,w){const scene=sceneOf(s),a=s.archive,im=w.archiveArt;if(!a)return;
 if(scene==='oldworks'){
  tag(c,'封存仓库 · 左门',465,250);tag(c,'封存机房 · 右门',1260,250);
  archiveProp(c,im,'ledger',1080,680,40);tag(c,'巡查记录',1080,711);
  if(!w.combat||w.combat.operation?.kind==='canalRescue'){archiveProp(c,im,a.rescued?'standing':'seated',620,365,a.rescued?30:64);tag(c,a.rescued?'岑禾 · 平安':'岑禾 · 等待救援',620,385);}
 }else if(scene==='archiveRoom'){
  archiveProp(c,im,'ledger',817,141,30);tag(c,a.ledger?'账册已收好':'封存账册',817,260);
  for(const [i,v]of [[1490,360],[1110,260],[285,330]].entries())tag(c,['① 东通风窗','② 北货架','③ 西锁扣'][i]+(a.routeStep>i?' ✓':''),...v);
  if(!a.cleared){archiveProp(c,im,'ledger',435,625,43);tag(c,'封存货签 · 可选清理',435,657);}
 }else if(scene==='sealRoom'&&!w.combat){device(c,im,{x:850,y:410},a.sealed);for(const v of SEAL_VALVES)archiveProp(c,im,a.sealed?'valveSafe':'valveIdle',v.x,v.y,56);tag(c,a.sealed?'已稳定封存':'走近装置，确认后启动',850,277);}
}
