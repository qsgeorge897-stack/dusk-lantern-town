import {ROOMS,DOORS,sceneOf} from './indoors.js?v=0.13.3';
import {REGIONS,nextExit} from './regions.js?v=0.13.3';
import {findPath,walkable} from './navigation.js?v=0.13.3';
export const citizenHome=s=>!s.water?.started||s.water.reported;
const at=(scene,x,y,sx=x,sy=y,working=false)=>({scene,x,y,stand:{x:sx,y:sy},working});
const SHOP=at('shop',344,405,548,430,true),HALL=at('hall',430,440,580,455,true);
const REPAIR=at('repair',1100,416,1010,480,true),LAUNDRY=at('laundry',1150,392,1070,460,true);
const cache=new Map();
function route(a,b){
 const key=JSON.stringify([a.scene,a.x,a.y,b.scene,b.x,b.y]);if(cache.has(key))return cache.get(key);
 const segments=[];let scene=a.scene,point={x:a.x,y:a.y};
 const leg=end=>{const points=[point,...findPath(point,end,scene)];if(walkable(end.x,end.y,scene))points.push(end);for(let i=1;i<points.length;i++){const from=points[i-1],to=points[i],length=Math.hypot(to.x-from.x,to.y-from.y);if(length)segments.push({scene,from,to,length});}point=end;};
 if(scene!==b.scene&&ROOMS[scene]){const room=scene;leg(ROOMS[room].entry);scene=ROOMS[room].parent;point=DOORS[room].stand;}
 const destination=ROOMS[b.scene]?.parent||b.scene;
 for(let n=0;scene!==destination&&n<8;n++){const exit=nextExit(scene,destination);if(!exit)break;leg(exit.stand);const prev=scene;scene=exit.to;point=REGIONS[scene].entryFrom?.[prev]||REGIONS[scene].entry;}
 if(b.scene!==scene&&ROOMS[b.scene]){leg(DOORS[b.scene].stand);scene=b.scene;point=ROOMS[scene].entry;}
 leg({x:b.x,y:b.y});cache.set(key,segments);return segments;
}
function travel(a,b,minutes){
 if(a.scene===b.scene&&a.x===b.x&&a.y===b.y)return {...b,moving:false};
 const path=route(a,b);let distance=Math.max(0,minutes)*60;
 for(const seg of path){if(distance<=seg.length){const f=distance/seg.length,dx=seg.to.x-seg.from.x,dy=seg.to.y-seg.from.y,x=seg.from.x+dx*f,y=seg.from.y+dy*f;return {scene:seg.scene,x,y,stand:{x,y},moving:true,working:false,direction:Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up',destination:ROOMS[b.scene]?.name||REGIONS[b.scene].name};}distance-=seg.length;}
 return {...b,moving:false};
}
function location(s,id){
 // Preserve the first three chapters' familiar appointment times.
 if(!s.town?.flags.market||s.water?.started&&!s.water.reported){
  if(id==='lucy')return SHOP;
  const morning=s.minute<720,night=s.minute>=1080;
  if(id==='taoen')return morning?at('orchard',310,566,365,602):night?at('hall',1140,455,1045,490):at('town',610,373,650,440);
  return morning?at('town',532,775,600,741):night?at('town',550,562,630,575):at('hall',1250,470,1160,490);
 }
 const rain=s.weather==='rain';let schedule;
 if(id==='lucy')schedule=[[480,SHOP],[720,HALL],[1080,s.neighborhood?.lucy>=2?at('hall',1090,552,1000,575):rain?HALL:at('town',490,400,548,440)],[1200,SHOP]];
 if(id==='taoen')schedule=[[480,REPAIR],[540,rain?REPAIR:at('orchard',310,566,365,602,true)],[720,REPAIR],[1080,at('hall',1140,455,1045,490)],[1200,REPAIR]];
 if(id==='mila')schedule=[[480,LAUNDRY],[540,rain?LAUNDRY:at('town',550,710,620,710,true)],[720,LAUNDRY],[1080,at('hall',1250,470,1160,490)],[1200,LAUNDRY]];
 let index=0;for(let i=1;i<schedule.length;i++)if(s.minute>=schedule[i][0])index=i;
 return index?travel(schedule[index-1][1],schedule[index][1],s.minute-schedule[index][0]):schedule[0][1];
}
export function residents(s){return ['lucy','taoen','mila'].filter(id=>id==='lucy'?s.flags.metLucy:citizenHome(s)).map(id=>{
 const p=location(s,id);return {id,name:{lucy:'露西',taoen:'陶恩',mila:'米菈'}[id],role:{lucy:'面包师',taoen:'取水工',mila:'洗衣人'}[id],...p,spotId:id==='lucy'&&p.scene==='shop'?'indoorLucy':{lucy:'townLucy',taoen:'townTaoen',mila:'townMila'}[id],place:ROOMS[p.scene]?.name||REGIONS[p.scene].name,walkTime:s.minute/2,direction:p.direction||'down'};
});}
export const lucyLocation=s=>location(s,'lucy');
export const nearLucy=s=>{const p=lucyLocation(s);return sceneOf(s)===p.scene&&Math.hypot(s.player.x-p.stand.x,s.player.y-p.stand.y)<115;};
export const residentSpots=s=>residents(s).filter(p=>p.scene===sceneOf(s)).map(p=>({id:p.spotId,name:p.name,x:p.x,y:p.y,stand:p.stand,radius:42,resident:p.id,subtitle:p.moving?'正在去'+p.destination:p.working?'正在工作 · 可以打个招呼':p.role+' · 聊天与故事'}));
