import {CHARACTER_ATLASES} from './assets/characters/atlas-data.js?v=0.13.3';
import {itemArt} from './item-art.js?v=0.13.3';

export const DIRECTIONS=['down','left','right','up'];
export function facingFromDelta(dx,dy,previous='down'){
  if(Math.abs(dx)+Math.abs(dy)<.001)return previous;
  return Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
}
export function characterFrame({direction='down',moving=false,walkTime=0,working=false}={}){
  const row=Math.max(0,DIRECTIONS.indexOf(direction));
  return row*4+(working?3:moving?[1,0,2,0][Math.floor(walkTime*8)%4]:0);
}
// Visible hand positions measured in the untouched keeper atlas, one per frame.
const KEEPER_HANDS=[[224,236],[516,237],[833,235],[1033,287],[199,529],[516,520],[835,517],[1030,574],[138,834],[441,828],[731,828],[1129,868],[216,1129],[520,1127],[835,1127],[1148,1143]];
export function keeperHand(actor){
  const meta=CHARACTER_ATLASES.keeper,index=characterFrame(actor),f=meta.frames[index],scale=meta.displayHeight/meta.referenceHeight,[x,y]=KEEPER_HANDS[index];
  return {x:actor.x+(x-f.anchorX)*scale,y:actor.y+(actor.bob||0)+(y-f.anchorY)*scale};
}
export function loadCharacterArt(ImageClass=Image){
  const images={},props={};
  const load=(src,name,container,key)=>new Promise((resolve,reject)=>{
    const img=new ImageClass();container[key]=img;
    img.onload=()=>resolve(img);img.onerror=()=>reject(Error(`${name}图片未能加载，请刷新重试`));img.src=src;
  });
  const jobs=Object.entries(CHARACTER_ATLASES).map(([id,meta])=>load(meta.file,'角色',images,id));
  for(const id of ['herb','resin','driedHerb','tea','lantern','water','wheatSeed','pumpkinSeed','wheat','pumpkin','wood','stone','honey','flour','pie','apple']){
    const svg=itemArt(id).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" ');
    jobs.push(load('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),'工具',props,id));
  }
  return {images,props,ready:Promise.all(jobs)};
}

// Routine stays inside the original stall hit area, preserving quest destinations.
export function lucyPose(time,player,talking=false){
  const phase=time%26;let x=180,y=255,moving=false,working=false,direction='down';
  if(phase>=8&&phase<11){const k=(phase-8)/3;x+=27*k;y-=3*k;moving=true;direction='right';}
  else if(phase>=11&&phase<20){x=207;y=252;working=phase<18;direction='down';}
  else if(phase>=20&&phase<23){const k=1-(phase-20)/3;x+=27*k;y-=3*k;moving=true;direction='left';}
  if(talking){moving=false;working=false;direction=facingFromDelta(player.x-x,player.y-y);}
  return {id:'lucy',x,y,direction,moving,working,walkTime:time};
}

export function drawCharacter(c,art,actor){
  const meta=CHARACTER_ATLASES[actor.id],img=art.images[actor.id];if(!meta||!img)return;
  const f=meta.frames[characterFrame(actor)],scale=meta.displayHeight/meta.referenceHeight;
  const x=Math.round(actor.x),y=Math.round(actor.y+(actor.bob||0));
  c.save();c.imageSmoothingEnabled=false;c.globalAlpha*=actor.alpha??1;
  const lamp=actor.lantern&&!actor.working,behind=actor.direction==='up';
  const drawLamp=()=>{const hand=keeperHand(actor);c.drawImage(art.props.lantern,Math.round(hand.x-7),Math.round(hand.y-1),14,19);};
  if(lamp&&behind)drawLamp();
  c.drawImage(img,f.x,f.y,f.w,f.h,Math.round(x+(f.x-f.anchorX)*scale),Math.round(y+(f.y-f.anchorY)*scale),Math.round(f.w*scale),Math.round(f.h*scale));
  if(lamp&&!behind)drawLamp();
  c.restore();
}

export function drawWorkEffect(c,art,actor,action,time){
  if(!action)return;const progress=Math.min(1,(time-action.start)/action.duration);if(progress>=1)return;
  const dir=actor.direction,side=dir==='left'?-1:1;
  const key=action.kind==='water'?'water':action.kind==='plant'?(action.crop==='pumpkin'?'pumpkinSeed':'wheatSeed'):action.kind==='harvest'?(action.crop||'wheat'):action.kind==='gather'?action.resource:['flour','pie','tea','driedHerb'].includes(action.recipe)?action.recipe:'wood';
  const prop=art.props[key];c.save();c.imageSmoothingEnabled=false;
  const hand=keeperHand(actor),px=hand.x,py=hand.y;
  if(prop){c.translate(px,py);c.rotate(action.kind==='water'?side*(.3+Math.sin(progress*Math.PI)*.45):Math.sin(progress*Math.PI)*.12);if(action.kind==='water')c.scale(side,1);c.drawImage(prop,-10,-8,20,20);c.restore();c.save();}
  if(action.kind==='water'){
    c.fillStyle='#a7e8e0';for(let i=0;i<6;i++){const t=(progress+i*.13)%1;c.fillRect(Math.round(px+side*(7+t*14)),Math.round(py+2+t*24),2,3);}
  }else if(action.kind==='plant'){
    c.fillStyle='#edcd81';for(let i=0;i<3;i++){const t=(progress+i*.2)%1;c.fillRect(Math.round(px+side*(t*9)),Math.round(py+7+t*17),2,2);}
  }
  c.restore();
}

// Crop the approved sheet at display time; original portrait pixels remain unchanged.
export function portraitMarkup(id,name){
  if(id==='vera')return `<img class="portrait-picture" src="./assets/characters/vera-portrait-v1.png" alt="薇拉头像">`;
  const box={keeper:[296,185,188,274],lucy:[804,185,188,274],oren:[1320,185,184,274]}[id];
  return `<svg class="portrait-picture" viewBox="${box.join(' ')}" role="img" aria-label="${name}头像"><image href="./assets/characters/cast-v1.png" width="1536" height="1024"/></svg>`;
}
