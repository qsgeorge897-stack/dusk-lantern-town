import {NEIGHBOR_ART} from './assets/neighborhood-atlas.js?v=0.13.3';
import {sceneOf} from './indoors.js?v=0.13.3';
import {PIPES} from './neighborhood.js?v=0.13.3';
import {REGIONS} from './regions.js?v=0.13.3';
import {facingFromDelta} from './characters.js?v=0.13.3';
export function drawNeighbor(c,a,w){
 if(!['lucy','taoen','mila'].includes(a.id))return false;
 const s=w.getState(),reduced=s.settings.reducedMotion;
 const working=a.working&&!a.moving&&!w.paused&&Math.floor(w.time||0)%12>=6;
 if(!a.moving&&!working)return false;
 if(a.id==='lucy'&&!working)return false;
 const key=working?'resident-work-v1':a.id+'-walk-v1',meta=NEIGHBOR_ART[key],im=w.neighborArt?.[key];if(!im?.complete)return false;
 const dir=a.moving?a.direction:facingFromDelta(s.player.x-a.x,s.player.y-a.y,a.direction);
 const row=working?['lucy','taoen','mila'].indexOf(a.id):['down','left','right','up'].indexOf(dir);
 const frames=meta.sprites[row]?.frames;if(!frames)return false;
 const frame=reduced||!a.moving&&!working?0:Math.floor((working?w.time:a.walkTime)* (working?4:7))%4;
 const f=frames[frame],box=f.recommended_crop_xywh,anchor=f.bottom_center_anchor_in_crop;
 const height=s.life.room?92:64,scale=height/Math.max(...frames.map(f=>f.recommended_crop_xywh[3]));
 c.drawImage(im,...box,a.x-anchor[0]*scale,a.y-anchor[1]*scale,box[2]*scale,box[3]*scale);return true;
}
export function drawNeighborProps(c,s,w){
 const scene=sceneOf(s),n=s.neighborhood;if(!n)return;
 const meta=NEIGHBOR_ART['resident-home-props-v1'],im=w.neighborArt?.['resident-home-props-v1'];
 if(im?.complete){
  if(scene==='hall'&&n.mila===3){const box=meta.sprites[0].frames[n.clothChoice==='blue'?1:0].recommended_crop_xywh;c.drawImage(im,...box,185,367,169,119);}
  if(scene==='home'&&n.curtain){const box=meta.sprites[1].frames[n.curtain==='blue'?1:0].recommended_crop_xywh;c.drawImage(im,...box,761,93,169,156);}
 }
 if(scene==='orchard'&&n.taoen>=2){
  for(let i=0;i<PIPES.length;i++){
   const p=REGIONS.orchard.spots.find(p=>p.id===PIPES[i]);
   c.save();c.translate(p.x,p.y);c.fillStyle='#3e4c3d';c.beginPath();c.ellipse(0,7,15,8,0,0,Math.PI*2);c.fill();c.strokeStyle='#b09159';c.lineWidth=5;c.beginPath();c.ellipse(0,0,11,7,0,0,Math.PI*2);c.stroke();c.fillStyle=n.pipe>i?'#abd0a0':'#f1d899';c.font='bold 14px sans-serif';c.textAlign='center';c.fillText(n.pipe>i?'✓':String(i+1),0,-17);c.restore();
  }
 }
}
