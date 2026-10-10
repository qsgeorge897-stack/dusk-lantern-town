import {HILL_ART} from './assets/hill-atlas.js?v=0.13.3';
import {DIRECTIONS,MIRROR_TARGET} from './hill.js?v=0.13.3';
import {sceneOf} from './indoors.js?v=0.13.3';
function prop(c,w,key,x,y,width){const box=HILL_ART.boxes[key],im=w.hillArt;if(!im?.complete||!box)return;const height=width*box[3]/box[2];c.drawImage(im,...box,x-width/2,y-height,width,height);}
function tag(c,text,x,y){c.save();c.font='500 14px "PingFang SC",sans-serif';c.textAlign='center';const width=c.measureText(text).width+18;c.fillStyle='#24352cd9';c.fillRect(x-width/2,y-18,width,26);c.fillStyle='#f4e6be';c.fillText(text,x,y);c.restore();}
export function drawHillLayer(c,s,w){const h=s.hill,scene=sceneOf(s);if(!h)return;
 if(scene==='greenhouse'){
  for(const [i,b]of h.beds.entries()){const x=i?1156:518,key=i?'mint':'tomato';if(b.crop){if(b.tended||s.weather==='rain'){c.fillStyle='#15261c35';c.fillRect(i?972:332,357,365,84);}for(const offset of [-114,0,114])prop(c,w,key+(b.growth===2?'Mature':'Seedling'),x+offset,448,b.growth===2?108:77);}
  }
  let connected=h.cleared&&h.water;const points=[469,667,1007];
  for(let i=0;i<3;i++){const good=connected&&h.mirrors[i]===MIRROR_TARGET[i];c.save();c.strokeStyle=good?'#f4d488':'#777c70';c.lineWidth=3;c.beginPath();c.moveTo(points[i],115);const a=(h.mirrors[i]-1)*Math.PI/2;c.lineTo(points[i]+Math.cos(a)*20,115+Math.sin(a)*20);c.stroke();c.restore();tag(c,`${i+1} · ${DIRECTIONS[h.mirrors[i]]}${good?' · 通':''}`,points[i],153);
   if(good){c.save();c.strokeStyle='#f8d27a77';c.lineWidth=4;c.setLineDash([6,5]);c.beginPath();c.moveTo(points[i],171);c.lineTo(i<2?points[i+1]:835,i<2?171:285);c.stroke();c.restore();}connected=good;
  }
  tag(c,h.water?'集雨槽 · 已接通':'集雨槽 · 待修复',1413,313);
  if(h.water){c.strokeStyle='#81b3b488';c.lineWidth=3;c.beginPath();c.moveTo(1433,219);c.lineTo(1433,249);c.stroke();}
  if(h.lit){w.glow(c,836,70,185,.24);w.glow(c,836,370,200,.12);}
  if(h.food){prop(c,w,'tomatoSoup',112,449,34);prop(c,w,'mintTea',155,472,32);}
 }else if(scene==='hillside'&&h.lit&&s.minute>=1080)w.glow(c,1277,220,165,.38);
 else if(scene==='home'&&h.lit){if(h.decor.lamp){prop(c,w,'hillLamp',1110,228,45);w.glow(c,1110,208,75,.17);}if(h.decor.painting)prop(c,w,'hillPainting',1020,185,88);}
}
