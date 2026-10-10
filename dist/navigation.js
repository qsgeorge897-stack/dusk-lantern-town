import {ROOMS,roomWalkable} from './indoors.js?v=0.13.3';
import {REGIONS,regionWalkable} from './regions.js?v=0.13.3';
const WIDTH=1672,HEIGHT=941;
// Walkable ground and authored walls track the background plate. Pathfinding shares
// this exact predicate with keyboard movement, preventing click-only shortcuts.
const OBSTACLES=[
  [590,0,1000,389],[987,160,1062,348],[1174,0,1437,296],
  [70,0,170,196],[0,0,410,129],[225,130,450,191],
  [54,355,78,649],[480,357,499,491],[480,554,499,643],
  [61,649,471,670],[278,208,492,319],
  // Front wall leaves the actual iron gate (x 1255–1339) open.
  [1022,665,1255,738],[1339,665,1542,738],
  [870,498,957,575], // Feast table, including its legs; the stand is below it.
  [78,349,258,367],[311,349,490,367],
  [1107,476,1171,526],[1195,474,1255,524],[1375,474,1438,532],
  [1113,574,1177,623],[1198,575,1255,624],[1371,570,1440,626],
  [1271,357,1329,453],
];
// Authored against the 1672×941 plate, including a small foot clearance.
// Sloped corners must join both walls; the old rectangles left an entire side open.
const WALLS=[
 [[990,414],[1038,422],[1047,723],[993,736]],
 [[990,414],[1098,359],[1122,366],[1120,427],[1036,472],[990,469]],
 [[1098,359],[1482,359],[1513,423],[1472,445],[1450,426],[1098,432]],
 [[1480,368],[1526,411],[1572,505],[1576,673],[1532,731],[1503,680],[1505,519],[1478,439]],
];
function inPolygon(x,y,points){
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [ax,ay]=points[i],[bx,by]=points[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside;
}
export function walkable(x,y,region='farm'){
  if(ROOMS[region])return roomWalkable(region,x,y);
  if(region!=='farm')return regionWalkable(region,x,y);
  if(x<36||x>1635||y<145||y>903)return false;
  if(y>761&&(x<706||x>803))return false;
  if(y>875&&(x<684||x>828))return false;
  if(x>1515&&y<734)return false;
  for(const [l,t,r,b]of OBSTACLES)if(x>l-7&&x<r+7&&y>t-3&&y<b+7)return false;
  return !WALLS.some(p=>inPolygon(x,y,p));
}
// Shared by keyboard motion and every path edge; prevents tunnelling on slow frames.
export function canTraverse(from,to,region='farm'){
 const count=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/3));
 for(let i=0;i<=count;i++)if(!walkable(from.x+(to.x-from.x)*i/count,from.y+(to.y-from.y)*i/count,region))return false;
 return true;
}
export function safePosition(point,region='farm'){
 if(walkable(point.x,point.y,region))return {...point};
 // Only invalid positions move. Search a local ring before using the scene entry.
 for(let radius=3;radius<=180;radius+=3)for(let i=0;i<64;i++){
  const a=i*Math.PI/32,p={x:point.x+Math.cos(a)*radius,y:point.y+Math.sin(a)*radius};
  if(walkable(p.x,p.y,region))return p;
 }
 return {...(ROOMS[region]||REGIONS[region]).entry};
}
const STEP=18,COLS=Math.ceil(WIDTH/STEP),ROWS=Math.ceil(HEIGHT/STEP);
function cell(x,y){return [Math.round(x/STEP),Math.round(y/STEP)];}
function closestCell(x,y,region,connected=false){const [cx,cy]=cell(x,y);for(let radius=0;radius<9;radius++){let best=null,dist=Infinity;for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const a=cx+dx,b=cy+dy;if(a<0||a>=COLS||b<0||b>=ROWS||!walkable(a*STEP,b*STEP,region)||connected&&!canTraverse({x,y},{x:a*STEP,y:b*STEP},region))continue;const d=Math.hypot(a*STEP-x,b*STEP-y);if(d<dist){best=[a,b];dist=d;}}if(best)return best;}return null;}
export function findPath(from,to,region='farm'){
  const start=closestCell(from.x,from.y,region,true),end=closestCell(to.x,to.y,region);if(!start||!end)return [];
  const key=(x,y)=>y*COLS+x,a=key(...start),z=key(...end);const open=[a],came=new Map(),g=new Map([[a,0]]),f=new Map([[a,Math.hypot(start[0]-end[0],start[1]-end[1])]]),closed=new Set();
  for(let loops=0;open.length&&loops<14000;loops++){
    let bi=0;for(let i=1;i<open.length;i++)if(f.get(open[i])<f.get(open[bi]))bi=i;const current=open.splice(bi,1)[0];
    if(current===z){const p=[];let c=z;while(c!==a){p.unshift({x:(c%COLS)*STEP,y:Math.floor(c/COLS)*STEP});c=came.get(c);}const first={x:start[0]*STEP,y:start[1]*STEP};if((!p.length||!canTraverse(from,p[0],region))&&Math.hypot(first.x-from.x,first.y-from.y)>.01)p.unshift(first);return p;}
    closed.add(current);const x=current%COLS,y=Math.floor(current/COLS);
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
      const nx=x+dx,ny=y+dy,n=key(nx,ny);if(nx<0||ny<0||nx>=COLS||ny>=ROWS||closed.has(n)||!walkable(nx*STEP,ny*STEP,region))continue;
      if(dx&&dy&&(!walkable(nx*STEP,y*STEP,region)||!walkable(x*STEP,ny*STEP,region)))continue;
      if(!canTraverse({x:x*STEP,y:y*STEP},{x:nx*STEP,y:ny*STEP},region))continue;
      const score=g.get(current)+(dx&&dy?1.414:1);if(score>=(g.get(n)??Infinity))continue;came.set(n,current);g.set(n,score);f.set(n,score+Math.hypot(nx-end[0],ny-end[1]));if(!open.includes(n))open.push(n);
    }
  }return [];
}
