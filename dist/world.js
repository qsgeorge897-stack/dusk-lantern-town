import {drawInteractionMarkers,drawShopEntryGround,markerHit} from './interaction-view.js?v=0.13.3';
import {ARCHIVE_ART,drawArchiveLayer} from './archive-art.js?v=0.13.3';
import {HILL_ART} from './assets/hill-atlas.js?v=0.13.3';
import {drawHillLayer} from './hill-art.js?v=0.13.3';
import {NEIGHBOR_ART} from './assets/neighborhood-atlas.js?v=0.13.3';
import {drawNeighbor,drawNeighborProps} from './neighborhood-art.js?v=0.13.3';
import {residents,residentSpots,lucyLocation} from './town.js?v=0.13.3';
import {TOWN_ART} from './assets/town-atlas.js?v=0.13.3';
import {drawTownLayer} from './town-art.js?v=0.13.3';
import {BATTLE_ATLASES} from './assets/characters/battle-atlas.js?v=0.13.3';
import {drawKeeperBattle,drawIncoming} from './battle-art.js?v=0.13.3';
import {drawCombat} from './combat.js?v=0.13.3';
import {ROOMS,DOORS,sceneOf,roomWalkable} from './indoors.js?v=0.13.3';
import {FISH_SPOT} from './fishing.js?v=0.13.3';
import {isNight,isRipe,CROPS} from './rules.js?v=0.13.3';
import {loadCharacterArt,keeperHand,facingFromDelta,lucyPose,drawCharacter,drawWorkEffect} from './characters.js?v=0.13.3';
import {REGIONS,FARM_EXIT,regionOf,regionWalkable,regionForTarget,nextExit} from './regions.js?v=0.13.3';
export const WIDTH=1672,HEIGHT=941;
export const PLOTS=Array.from({length:16},(_,i)=>({id:`plot${i}`,index:i%16,x:143+(i%4)*97,y:408+Math.floor(i/4)*65,w:76,h:49}));
export const SPOTS=[
  ...REGIONS.farm.spots,
  {id:'lucy',name:'露西',subtitle:'街角面包师',x:180,y:254,stand:{x:197,y:286},radius:58},
  {id:'home',name:'守灯人的家',subtitle:'休息与等候',x:754,y:389,stand:{x:755,y:441},radius:64},
  {id:'wood',name:'木料堆',subtitle:'收集木材',x:856,y:393,stand:{x:871,y:440},radius:57},
  {id:'stone',name:'旧石料',subtitle:'收集石料',x:553,y:592,stand:{x:580,y:620},radius:55},
  {id:'honey',name:'蜂箱',subtitle:'每日蜂蜜',x:430,y:297,stand:{x:432,y:338},radius:48},
  {id:'mill',name:'旧磨坊',subtitle:'研磨与旧记忆',x:1256,y:247,stand:{x:1259,y:335},radius:94},
  {id:'oven',name:'石砌烤炉',subtitle:'烘烤南瓜派',x:1100,y:293,stand:{x:1100,y:353},radius:70},
  {id:'grave',name:'奥伦的墓',subtitle:'记忆与告别',x:1137,y:505,stand:{x:1117,y:553},radius:60},
  {id:'table',name:'节庆长桌',subtitle:'让小镇重新开席',x:912,y:532,stand:{x:919,y:586},radius:67},
];
export {walkable,findPath} from './navigation.js?v=0.13.3';
import {walkable,findPath,canTraverse} from './navigation.js?v=0.13.3';
const PAL={'.':null,o:'#3a2c28',h:'#5d392c',k:'#855239',s:'#e2b48b',l:'#f0cfa6',c:'#a35b38',b:'#79402e',a:'#cf8050',t:'#483c38',d:'#2b3435',g:'#777563',e:'#ddbe7a'};
const VILLAGER=[
  '.....ooooooo......','....ohhhhhhoo.....','...ohhkkkkkhho....','...ohkkkkkkhho....','...ohkkssssso.....','....ossslslso.....','.....osssooo......','....oabbbbbao.....','...oaaaccccaao....','..oaaaccccccaao...','..oaccccccccbbo...','..obccccccccbbo...','...obccccccbbbo...','...obccccccbbbo...','...oabcccccbbao...','...oaabcccbaao....','....obbbbbbbo.....','.....ottgtoo......','.....ottgto.......','.....oddodo.......','....ooddoodo......',
];
function sprite(ctx,x,y,rows,pal,scale=2.6,alpha=1){ctx.save();ctx.globalAlpha=alpha;const ox=Math.round(x-rows[0].length*scale/2),oy=Math.round(y-rows.length*scale);for(let i=0;i<rows.length;i++)for(let j=0;j<rows[i].length;j++){const c=pal[rows[i][j]];if(c){ctx.fillStyle=c;ctx.fillRect(Math.round(ox+j*scale),Math.round(oy+i*scale),Math.ceil(scale),Math.ceil(scale));}}ctx.restore();}
function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
function label(c,text,x,y,color='#f4e8c9',size=14){c.font=`500 ${size}px "PingFang SC",sans-serif`;c.textAlign='center';c.fillStyle='rgba(20,34,29,.84)';const w=c.measureText(text).width+20;c.fillRect(x-w/2,y-size-4,w,size+12);c.fillStyle=color;c.fillText(text,x,y);}
export class World{
  constructor(canvas,getState,onInteract,onError){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.getState=getState;this.onInteract=onInteract;this.onError=onError;this.path=[];this.pending=null;this.hover=null;this.keys=new Set();this.guide=null;this.particles=[];this.time=0;this.moving=false;this.paused=false;this.tool='hand';
    this.resetAppearance();this.art=loadCharacterArt();
    this.img=new Image();const sceneReady=new Promise((resolve,reject)=>{this.img.onload=resolve;this.img.onerror=()=>reject(Error('场景图片未能加载，请刷新重试'));});this.img.src='./assets/world.png';this.regionImages={farm:this.img};const regionReady=[...Object.keys(REGIONS).filter(k=>k!=='farm'),...Object.keys(ROOMS)].map(id=>new Promise((resolve,reject)=>{const img=new Image();this.regionImages[id]=img;img.onload=resolve;img.onerror=()=>reject(Error((ROOMS[id]||REGIONS[id]).name+'图片未能加载，请刷新重试'));img.src=(ROOMS[id]||REGIONS[id]).file;}));this.enemyArt=new Image();const enemyReady=new Promise((resolve,reject)=>{this.enemyArt.onload=resolve;this.enemyArt.onerror=()=>reject(Error('水渠角色图片未能加载'));});this.enemyArt.src='./assets/characters/infected-v1.png';this.recoveredArt=new Image();const recoveredReady=new Promise((resolve,reject)=>{this.recoveredArt.onload=resolve;this.recoveredArt.onerror=()=>reject(Error('村民图片未能加载'));});this.recoveredArt.src='./assets/characters/recovered-v1.png';this.cleanWaterArt=new Image();const cleanReady=new Promise((resolve,reject)=>{this.cleanWaterArt.onload=resolve;this.cleanWaterArt.onerror=()=>reject(Error('净化后的水渠图片未能加载'));});this.cleanWaterArt.src='./assets/regions/waterworks-clean-v1.png';this.bossArt=new Image();const bossReady=new Promise((resolve,reject)=>{this.bossArt.onload=resolve;this.bossArt.onerror=()=>reject(Error('黑苔母核图片未能加载'));});this.bossArt.src='./assets/characters/moss-core-v1.png';this.tacticsArt=new Image();const tacticsReady=new Promise((resolve,reject)=>{this.tacticsArt.onload=resolve;this.tacticsArt.onerror=()=>reject(Error('防线队员与设施素材未能加载'));});this.tacticsArt.src='./assets/characters/tactics-v1.png';this.battleArt={};const battleReady=Object.entries(BATTLE_ATLASES).map(([key,meta])=>new Promise((resolve,reject)=>{const img=new Image();this.battleArt[key]=img;img.onload=resolve;img.onerror=()=>reject(Error('战斗动作素材未能加载'));img.src=meta.file;}));this.neighborArt={};const neighborReady=Object.entries(NEIGHBOR_ART).map(([key,meta])=>new Promise((resolve,reject)=>{const im=new Image();this.neighborArt[key]=im;im.onload=resolve;im.onerror=()=>reject(Error('街坊素材未能加载'));im.src=meta.file;}));this.townArt={};const townReady=Object.entries(TOWN_ART).map(([key,meta])=>new Promise((resolve,reject)=>{const im=new Image();this.townArt[key]=im;im.onload=resolve;im.onerror=()=>reject(Error('小镇生活素材未能加载'));im.src=meta.file;}));this.hillArt=new Image();const hillReady=new Promise((resolve,reject)=>{this.hillArt.onload=resolve;this.hillArt.onerror=()=>reject(Error('温室作物素材未能加载'));});this.hillArt.src=HILL_ART.file;this.archiveArt=new Image();const archiveReady=new Promise((resolve,reject)=>{this.archiveArt.onload=resolve;this.archiveArt.onerror=()=>reject(Error('封存库物件图片未能加载'));});this.archiveArt.src=ARCHIVE_ART.file;this.ready=Promise.all([archiveReady,hillReady,...neighborReady,...townReady,...battleReady,tacticsReady,sceneReady,this.art.ready,enemyReady,recoveredReady,cleanReady,bossReady,...regionReady]);
    this.resize();window.addEventListener('resize',()=>this.resize());
    canvas.addEventListener('pointermove',e=>{const p=this.screenToWorld(e.clientX,e.clientY);this.hover=this.hit(p.x,p.y);canvas.style.cursor=this.hover?'pointer':'crosshair';});
    canvas.addEventListener('pointerleave',()=>this.hover=null);
    canvas.addEventListener('pointerdown',e=>{if(this.paused||this.fishing)return;e.preventDefault();const p=this.screenToWorld(e.clientX,e.clientY),target=this.hit(p.x,p.y);if(this.combat){this.combatClick?.(p);return;}if(this.tool==='rod'&&sceneOf(this.getState())==='wharf'&&p.y>630&&p.x<1080){this.go(FISH_SPOT);return;}this.go(target||p);});
  }
  resize(){const r=this.canvas.getBoundingClientRect();this.vw=r.width;this.vh=r.height;this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(r.width*this.dpr);this.canvas.height=Math.round(r.height*this.dpr);this.camera();}
  camera(){const p=this.getState().player;this.scale=this.vw<800?Math.max(this.vw/WIDTH,this.vh/HEIGHT)*1.1:Math.min(this.vw/WIDTH,Math.max(260,this.vh-118)/HEIGHT);const w=WIDTH*this.scale,h=HEIGHT*this.scale;this.ox=w>this.vw?Math.max(this.vw-w,Math.min(0,this.vw/2-p.x*this.scale)):(this.vw-w)/2;this.oy=h>this.vh?Math.max(this.vh-h,Math.min(0,this.vh*(this.fishing?.38:.55)-p.y*this.scale)):Math.max(0,(this.vh-118-h)/2);}
  screenToWorld(x,y){const r=this.canvas.getBoundingClientRect();return {x:(x-r.left-this.ox)/this.scale,y:(y-r.top-this.oy)/this.scale};}
  spots(){const s=this.getState();if(this.combat)return [];if(s.life?.room)return [...ROOMS[s.life.room].spots.filter(p=>p.id!=='indoorLucy'),...residentSpots(s)];
    if(regionOf(s)==='farm')return [...residentSpots(s),...SPOTS.map(p=>p.id==='home'?{...p,subtitle:'进入住宅 · 床、厨房与储物'}:p.id==='lucy'&&s.flags.metLucy?{...p,name:'露西杂货屋',subtitle:'进入店内找露西'}:p)];
    if(regionOf(s)==='waterworks')return [...REGIONS.waterworks.spots.map(p=>p.id==='infected'?(s.water.rescued?{...p,name:s.water.reported?'巡查留言簿':'陶恩与米菈',subtitle:s.water.reported?'村民已回镇，读读营地留言':'聊聊他们经历的事',x:405,y:650,stand:{x:510,y:660},radius:58}:{...p,name:'陶恩 · 感染的取水工',subtitle:'他还在寻找米菈',x:710,y:490,radius:55}):p.id==='sluice'&&s.water.reported?{...p,name:s.water.bossDefeated?'封存的北闸':'北闸 · 封存残根',subtitle:s.water.bossDefeated?'母核已清除':'可选尾声：黑苔母核'}:p),...(!s.water.rescued?[{id:'infectedMila',name:'米菈 · 感染的洗衣人',subtitle:'靠近前先查看账册',x:820,y:490,stand:{x:740,y:555},radius:55}]:[])];
    return [...REGIONS[regionOf(s)].spots,...residentSpots(s),...(regionOf(s)==='wharf'?[{...DOORS.post,subtitle:'进入邮驿 · 信件与回声'},FISH_SPOT]:[])].map(p=>['discharge','waterSample'].includes(p.id)&&!s.water.started?{...p,name:p.id==='discharge'?'北渠维护标记':'村民取水桶',subtitle:'日常使用的痕迹'}:p.id==='vera'?{...p,name:s.expansion.flags.veraDeparted?'燕羽扣针':s.expansion.flags.metVera?'邮差的留言':'河雾里的声音',subtitle:s.expansion.flags.veraDeparted?'她留下的手艺仍在运转':s.expansion.flags.metVera?'薇拉在邮驿里等你':'夜晚提灯，与邮差交谈'}:p);}
  plots(){return sceneOf(this.getState())==='farm'?PLOTS:[];}
  travelReset(){this.path=[];this.pending=null;this.keys.clear();this.hover=null;this.particles=[];this.seated=null;this.visitor=false;this.resetAppearance();this.camera();}
  hit(x,y){const marked=[...this.spots(),...this.plots()].find(p=>markerHit(p,this.getState(),x,y,this.scale));if(marked)return marked;for(const p of this.plots())if(Math.abs(x-p.x)<p.w/2+4&&Math.abs(y-p.y)<p.h/2+4)return {...p,name:'耕地'};let nearest=null,dist=Infinity;for(const p of this.spots()){const d=Math.hypot(x-p.x,y-p.y);if(d<p.radius&&d<dist){nearest=p;dist=d;}}return nearest;}
  nearest(){let best=null,dist=95;const s=this.getState();for(const p of [...this.plots(),...this.spots()]){const a=p.stand||p,d=Math.hypot(a.x-s.player.x,a.y-s.player.y);if(d<dist&&canTraverse(s.player,a,sceneOf(s))){best=p;dist=d;}}return best;}
  go(target){const s=this.getState();let end=target.stand||target;if(this.combat?.operation)end={x:Math.max(280,Math.min(1390,end.x)),y:Math.max(310,Math.min(715,end.y))};this.pending=target.id?target:null;if(Math.hypot(end.x-s.player.x,end.y-s.player.y)<40&&canTraverse(s.player,end,sceneOf(s))){this.path=[];if(this.pending){this.onInteract(this.pending);this.pending=null;}return;}this.path=findPath(s.player,end,sceneOf(s));if(!this.path.length){this.pending=null;this.onError('这里走不过去，试试旁边的小路');}this.destination=this.path.at(-1);}
  resetAppearance(){this.facing='down';this.walkTime=0;this.action=null;this.talkingTo=null;this.farewell=null;this.veraFarewell=null;}
  face(target){const p=this.getState().player;this.facing=facingFromDelta(target.x-p.x,target.y-p.y,this.facing);}
  performAction(kind,payload={}){
    if(['plant','water','harvest','gather','craft'].includes(kind)){this.action={...payload,kind,start:this.time,duration:kind==='water'?.85:.65};this.moving=false;}
    if(kind==='departVera')this.veraFarewell={start:this.time,duration:2.6};
    if(kind==='forage')this.action={...payload,kind:'gather',start:this.time,duration:.65};
    if(kind==='depart')this.farewell={start:this.time,duration:2.6};
    if(kind==='sleep'||kind==='wait'){this.action=null;this.farewell=null;}
  }
  update(dt){if(this.paused){this.moving=false;return;}this.time+=dt;if(this.fishing){this.moving=false;return;}if(this.veraFarewell&&this.time-this.veraFarewell.start>=this.veraFarewell.duration)this.veraFarewell=null;if(this.action&&this.time-this.action.start>=this.action.duration)this.action=null;if(this.farewell&&this.time-this.farewell.start>=this.farewell.duration)this.farewell=null;const s=this.getState(),p=s.player;let dx=0,dy=0;for(const k of this.keys){if(['ArrowLeft','a','A'].includes(k))dx--;if(['ArrowRight','d','D'].includes(k))dx++;if(['ArrowUp','w','W'].includes(k))dy--;if(['ArrowDown','s','S'].includes(k))dy++;}
    if(dx||dy){this.path=[];this.pending=null;}else if(this.path.length){const t=this.path[0],d=Math.hypot(t.x-p.x,t.y-p.y);if(d<5&&canTraverse(p,t,sceneOf(s))){p.x=t.x;p.y=t.y;this.path.shift();}else{dx=(t.x-p.x)/d;dy=(t.y-p.y)/d;}}
    this.moving=false;if(dx||dy){this.facing=facingFromDelta(dx,dy,this.facing);const before={...p},mag=Math.hypot(dx,dy),speed=Math.min(155*dt,this.path.length?Math.hypot(this.path[0].x-p.x,this.path[0].y-p.y):Infinity);dx=dx/mag*speed;dy=dy/mag*speed;if(canTraverse(p,{x:p.x+dx,y:p.y},sceneOf(s)))p.x+=dx;if(canTraverse(p,{x:p.x,y:p.y+dy},sceneOf(s)))p.y+=dy;this.moving=Math.hypot(p.x-before.x,p.y-before.y)>.001;if(this.moving){this.walkTime=(this.walkTime||0)+dt;this.action=null;}}
    if(this.pending?.resident){const target=this.spots().find(p=>p.resident===this.pending.resident);if(!target){this.path=[];this.pending=null;this.onError('这位街坊去了下一个地方，手记已更新位置');}else{this.pending=target;const distance=Math.hypot(p.x-target.stand.x,p.y-target.stand.y);if(distance<38&&canTraverse(p,target.stand,sceneOf(s))){this.path=[];this.pending=null;this.onInteract(target);}else if(!this.path.length||Math.hypot(this.path.at(-1).x-target.stand.x,this.path.at(-1).y-target.stand.y)>60)this.path=findPath(p,target.stand,sceneOf(s));}}
    if(!this.path.length&&this.pending){const target=this.pending;this.pending=null;this.onInteract(target);}
    this.particles=this.particles.filter(p=>p.life>0);for(const q of this.particles){q.life-=dt;q.y-=dt*22;}this.camera();
  }
  burst(x,y,text,color='#f5d488'){this.particles.push({x,y:y-28,text,color,life:2.2});}
  actors(){
    const s=this.getState(),t=this.time,reduced=s.settings.reducedMotion;
    const people=[{id:'keeper',...s.player,...(this.seated?.keeper||{}),direction:this.seated?'right':this.fishing?'left':this.facing||'down',moving:this.moving,walkTime:this.walkTime||0,working:!!this.action||!!this.fishing,lantern:(s.lantern||!!this.combat)&&!this.fishing}];
    if(s.life?.room){
      if(s.life.room==='greenhouse'&&this.hillGathering){for(const [i,id]of ['lucy',...(!s.water.started||s.water.reported?['taoen','mila']:[])].entries())people.push({id,x:620+i*210,y:621,direction:'up'});}
      if(s.life.room==='home'&&this.visitor){const shop=s.life.room==='shop',{x,y}=shop?ROOMS.shop.npcs.lucy:{x:956,y:540};people.push({id:'lucy',x,y,...(this.seated?.lucy||{}),direction:this.seated?'left':facingFromDelta(s.player.x-x,s.player.y-y),working:!this.seated&&shop&&!this.talkingTo&&!reduced&&t%12>8});}
      if(s.life.room==='post'&&s.expansion.flags.metVera&&isNight(s)&&s.lantern&&(!s.expansion.flags.veraDeparted||this.veraFarewell)){const progress=this.veraFarewell?Math.min(1,(t-this.veraFarewell.start)/2.6):0;people.push({id:'vera',...ROOMS.post.npcs.vera,direction:'left',alpha:.94*(1-progress),bob:reduced?0:Math.sin(t*1.8)*3-progress*18});}
      people.push(...residents(s).filter(p=>p.scene===sceneOf(s)));
      return people.sort((a,b)=>a.y-b.y);
    }
    people.push(...residents(s).filter(p=>p.scene===sceneOf(s)));
    if(regionOf(s)==='waterworks'){if(s.water.rescued&&!s.water.reported&&!this.combat?.front)people.push({id:'taoen',x:370,y:677},{id:'mila',x:430,y:690});else if(!s.water.rescued&&!this.combat){const sway=reduced?0:Math.sin(t*.7)*12;people.push({id:'infected_taoen',x:710+sway,y:507},{id:'infected_mila',x:820-sway,y:505});}return people.sort((a,b)=>a.y-b.y);}
    if(regionOf(s)!=='farm'){const f=s.expansion.flags,p=REGIONS.wharf.spots.find(p=>p.id==='vera');if(regionOf(s)==='wharf'&&isNight(s)&&s.lantern&&f.beacon&&s.flags.festival&&!f.metVera&&(!f.veraDeparted||this.veraFarewell)){const progress=this.veraFarewell?Math.min(1,(t-this.veraFarewell.start)/this.veraFarewell.duration):0;people.push({id:'vera',x:p.x,y:p.y,direction:facingFromDelta(s.player.x-p.x,s.player.y-p.y),working:this.talkingTo==='vera'&&f.posted,bob:reduced?0:Math.sin(t*1.8)*3-progress*18,alpha:.94*(1-progress)});}return people.sort((a,b)=>a.y-b.y);}
    if(!s.flags.metLucy)people.push(lucyPose(reduced?0:t,s.player,this.talkingTo==='lucy'));
    const visible=isNight(s)&&s.lantern&&s.flags.grave;
    if(visible&&(!s.flags.departed||this.farewell)){
      const leaving=!!this.farewell,progress=leaving?Math.min(1,(t-this.farewell.start)/this.farewell.duration):0;
      const talking=this.talkingTo==='oren',near=Math.hypot(s.player.x-1173,s.player.y-557)<140;
      people.push({id:'oren',x:1173,y:557,direction:talking||near?facingFromDelta(s.player.x-1173,s.player.y-557):'left',working:!talking&&!leaving&&s.flags.awakened&&s.helper&&!reduced&&t%10>6,alpha:.9*(1-progress),bob:reduced?0:Math.sin(t*2)*3-progress*22});
    }
    if(s.flags.festival)people.push({id:'guest',x:974,y:585},{id:'guest2',x:842,y:581});
    return people.sort((a,b)=>a.y-b.y);
  }
  drawActors(c,keeperOnly=false){
    for(const actor of this.actors()){
      if(this.combat&&((actor.id==='keeper')!==keeperOnly))continue;
      ellipse(c,actor.x,actor.y+3,['oren','vera'].includes(actor.id)?16:15,4,['oren','vera'].includes(actor.id)?'#8fdbd126':'#14242158');
      if(actor.id.startsWith('infected_')){const im=this.enemyArt;if(im?.complete){const cw=im.width/3,ch=im.height/2,row=!this.getState().settings.reducedMotion&&this.time%7>5?1:0;c.drawImage(im,actor.id==='infected_mila'?cw:0,row*ch,cw,ch,actor.x-44,actor.y-85,88,88);}label(c,actor.id==='infected_mila'?'米菈 · 感染':'陶恩 · 感染',actor.x,actor.y-99,'#ecd4b1',12);continue;}
      if(drawNeighbor(c,actor,this))continue;
      if(['taoen','mila'].includes(actor.id)){const im=this.townArt?.villagers;if(im?.complete){const direction=facingFromDelta(this.getState().player.x-actor.x,this.getState().player.y-actor.y),i=(actor.id==='mila'?4:0)+['down','left','right','up'].indexOf(direction),box=TOWN_ART.villagers.boxes[Math.max(0,i)],h=this.getState().life?.room?92:64,width=h*box[2]/box[3];c.drawImage(im,...box,actor.x-width/2,actor.y-h,width,h);}continue;}
      if(actor.id.startsWith('guest')){const pal=actor.id==='guest'?{...PAL,c:'#898871',b:'#65634f',a:'#b3aa81'}:{...PAL,c:'#4d7380',b:'#344e58',a:'#78909d'};sprite(c,actor.x,actor.y,VILLAGER,pal,2.65);continue;}
      c.save();if(this.getState().life?.room){c.translate(actor.x,actor.y);c.scale(1.45,1.45);c.translate(-actor.x,-actor.y);}if(!(actor.id==='keeper'&&this.combat&&drawKeeperBattle(c,this.combat,actor,this.battleArt,this.facing)))drawCharacter(c,this.art,actor.id==='lucy'&&this.paused?{...actor,working:false,moving:false,direction:facingFromDelta(this.getState().player.x-actor.x,this.getState().player.y-actor.y)}:actor);if(actor.id==='keeper'&&this.action&&!this.combat)drawWorkEffect(c,this.art,actor,this.action,this.time);c.restore();
    }
  }
  draw(){
    const c=this.ctx,s=this.getState(),t=this.time;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.vw,this.vh);c.fillStyle='#14221e';c.fillRect(0,0,this.vw,this.vh);c.translate(this.ox,this.oy);c.scale(this.scale,this.scale);c.imageSmoothingEnabled=true;const region=sceneOf(s),plate=(region==='waterworks'&&s.water.clean?this.cleanWaterArt:null)||this.regionImages?.[region]||this.img;if(plate?.complete)c.drawImage(plate,0,0,WIDTH,HEIGHT);
    if(region==='farm'){
    this.drawMill(c,s,t);this.drawCrops(c,s,t);
    // A small stone pile and a passable eastern garden gate are actual world objects.
    ellipse(c,551,603,32,8,'#27352a55');for(let i=0;i<6;i++){const x=528+(i%3)*17,y=580+Math.floor(i/3)*11;c.fillStyle=['#65685a','#92917b','#aaa48a'][i%3];c.beginPath();c.moveTo(x,y+5);c.lineTo(x+5,y);c.lineTo(x+18,y+1);c.lineTo(x+24,y+9);c.lineTo(x+20,y+15);c.lineTo(x+2,y+14);c.closePath();c.fill();c.fillStyle='#bbb398';c.fillRect(x+6,y+2,11,3);c.fillStyle='#565d4d';c.fillRect(x+3,y+12,15,3);}c.fillStyle='#806140';c.fillRect(480,491,7,54);c.fillStyle='#b28a54';c.fillRect(478,493,10,6);c.fillRect(478,536,10,6);
    if(s.flags.grave){c.strokeStyle='#bd9761';c.lineWidth=3;c.beginPath();c.moveTo(1098,457);c.lineTo(1098,499);c.stroke();for(let i=0;i<3;i++){c.fillStyle='#e9d1a0';c.fillRect(1090+i*7,471+i*4,3,14);}ellipse(c,1135,527,25,5,'#a6b987');}
    if(s.flags.table){c.fillStyle='#e0cfa1';c.fillRect(877,514,65,22);c.fillStyle='#769579';c.fillRect(888,514,8,22);c.fillRect(925,514,5,22);}
    if(s.flags.feast){this.drawItem(c,'pie',890,519,.85);this.drawItem(c,'pie',924,521,.85);}
    if(s.flags.festival){c.strokeStyle='#504936';c.lineWidth=2;c.beginPath();c.moveTo(649,439);c.quadraticCurveTo(872,508,1014,393);c.stroke();for(let i=0;i<10;i++){let x=661+i*36,y=450+Math.sin(i/9*Math.PI)*26-i*5;c.fillStyle=['#ddb65a','#cf8262','#739a88'][i%3];c.beginPath();c.moveTo(x,y);c.lineTo(x+14,y+3);c.lineTo(x+8,y+20);c.fill();}}
    }else if(ROOMS[region])this.drawInterior(c,s,t);else this.drawRegion(c,s,t);
    drawTownLayer(c,s,this);drawNeighborProps(c,s,this);drawHillLayer(c,s,this);drawArchiveLayer(c,s,this);
    drawShopEntryGround(c,s,this);
    // All characters are rendered dynamically, with depth based on their feet.
    this.drawActors(c);if(this.combat)drawCombat(c,this.combat,s.player,this.enemyArt,{bossArt:this.bossArt,tacticsArt:this.tacticsArt,battleArt:this.battleArt,archiveArt:this.archiveArt,drawKeeper:()=>this.drawActors(c,true),reducedMotion:s.settings.reducedMotion});if(this.seated&&plate?.complete){const pieces=region==='home'?[[714,464,50,23],[935,464,47,23]]:(ROOMS[region].seatForeground||[]);for(const [x,y,w,h]of pieces)c.drawImage(plate,x,y,w,h,x,y,w,h);}if(this.fishing)this.drawFishing(c,s);
    // Dusk is simulated above the world, leaving HUD typography unaffected.
    const dusk=Math.max(0,Math.min(1,(s.minute-930)/210)),nightAlpha=dusk*(this.combat?.2:ROOMS[region]?.12:s.settings.bright?.29:.52);
    c.fillStyle=`rgba(18,36,60,${nightAlpha})`;c.fillRect(0,0,WIDTH,HEIGHT);if(s.weather==='rain'&&!ROOMS[region]){c.fillStyle='rgba(35,57,66,.13)';c.fillRect(0,0,WIDTH,HEIGHT);}
    if(dusk>0){const lights=ROOMS[region]?(ROOMS[region].lights||[[500,265,110],[1240,285,100]]):region==='farm'?[[807,326,65],[1098,293,65],[693,736,75],[797,736,75],[1214,447,65],[1202,657,80],[878,541,65]]:REGIONS[region]?.lights?REGIONS[region].lights:region==='forest'?[[850,257,65],[60,403,65],[1618,425,65]]:region==='waterworks'?[[195,393,90],[1517,345,90],[180,696,100]]:[[43,87,65],[937,550,65],[1283,539,65],...(s.expansion.flags.beacon?[[1190,112,160]]:[])];for(const [x,y,r]of lights)this.glow(c,x,y,r,dusk*.38);if(s.lantern||this.combat)this.glow(c,s.player.x,s.player.y-20,135,.3);}
    if(region==='farm'&&isNight(s)&&s.lantern&&!s.flags.departed&&s.flags.grave)this.glow(c,1174,526,65,.18,'144,223,215');
    if(region==='wharf'&&isNight(s)&&s.lantern&&s.expansion.flags.beacon&&s.flags.festival&&!s.expansion.flags.veraDeparted)this.glow(c,944,463,60,.16,'144,223,215');
    if(s.weather==='rain'&&!ROOMS[region]&&!s.settings.reducedMotion){c.strokeStyle='#c8d6ca55';c.lineWidth=1.4;for(let i=0;i<90;i++){const x=(i*193+t*29)%WIDTH,y=(i*139+t*380)%HEIGHT;c.beginPath();c.moveTo(x,y);c.lineTo(x-5,y+17);c.stroke();}}
    if(!ROOMS[region]&&!s.settings.reducedMotion){for(let i=0;i<22;i++){const x=(i*171+Math.sin(t*.24+i)*35)%WIDTH,y=420+(i*73)%340+Math.sin(t+i)*10;c.fillStyle=isNight(s)?`rgba(238,209,123,${.25+Math.sin(t+i)*.2})`:'rgba(212,167,77,.4)';c.fillRect(x,y,3,3);}}
    if(this.path.length){const d=this.path.at(-1);c.strokeStyle='#f0d29988';c.lineWidth=2;c.beginPath();c.ellipse(d.x,d.y,12,6,0,0,Math.PI*2);c.stroke();}
    drawInteractionMarkers(c,s,this);
    if(this.guide&&!this.combat){const resident=residents(s).find(p=>p.spotId===this.guide),targetRoom=resident?.scene&&ROOMS[resident.scene]?resident.scene:Object.keys(ROOMS).find(k=>ROOMS[k].spots.some(p=>p.id===this.guide)),targetRegion=resident?(ROOMS[resident.scene]?.parent||resident.scene):targetRoom?ROOMS[targetRoom].parent:regionForTarget(this.guide);const direct=this.spots().find(p=>p.id===this.guide);const p=direct|| (ROOMS[region]?this.spots().find(p=>p.id==='roomExit'):targetRegion&&targetRegion!==region?nextExit(region,targetRegion):targetRoom?this.spots().find(p=>p.id===(targetRoom==='shop'?'lucy':DOORS[targetRoom].id)):this.guide==='farm'?PLOTS[0]:null);if(p){const y=Math.max(28,p.y-75+(s.settings.reducedMotion?0:Math.sin(t*3)*4));c.fillStyle='#f4d58e';c.beginPath();c.moveTo(p.x-9,y);c.lineTo(p.x+9,y);c.lineTo(p.x,y+10);c.fill();}}

    if(this.combat?.flash>0){c.save();c.setTransform(this.dpr,0,0,this.dpr,0,0);c.strokeStyle=`rgba(185,62,47,${this.combat.flash*2})`;c.lineWidth=12;c.strokeRect(6,6,this.vw-12,this.vh-12);c.restore();}
    if(this.combat){c.save();c.setTransform(this.dpr,0,0,this.dpr,0,0);drawIncoming(c,this.combat,this);c.restore();}
    for(const p of this.particles){c.globalAlpha=Math.min(1,p.life);label(c,p.text,p.x,p.y,p.color,16);c.globalAlpha=1;}
  }
  drawInterior(c,s,t){
    for(const p of this.spots()){const q=p.stand||p;c.strokeStyle='#dec78766';c.lineWidth=1.5;c.beginPath();c.ellipse(q.x,q.y,17,7,0,0,Math.PI*2);c.stroke();}

    if(s.life.room==='home'){
      if(s.flags.festival){c.fillStyle='#d6b55d';for(let i=0;i<4;i++)c.fillRect(1337+i*4,549-i*3,3,20);}
      if(s.life.catches){c.fillStyle='#87a2a0';c.fillRect(1345,582,18,12);}
      if(s.expansion.flags.veraDeparted){c.fillStyle='#f1cd7b';c.fillRect(1350,558,12,4);}
    }
    if(s.life.room==='post'&&s.life.mailSorted){c.fillStyle='#ead9ae';for(let i=0;i<3;i++)c.fillRect(ROOMS.post.sortedLetters.x,ROOMS.post.sortedLetters.y+i*17,17,9);}
  }
  drawFishing(c,s){
    const g=this.fishing,p=s.player,near=g.depth==='near',base={x:near?916:810,y:near?785:830},cast=g.stage==='cast'?Math.min(1,g.elapsed/.65):1;
    const wave=Math.sin(g.elapsed*7),fx=p.x+(base.x-p.x)*cast,fy=p.y+(base.y-p.y)*cast-(1-cast)*60;
    const grip=keeperHand({...p,direction:'left',working:true}),tip={x:grip.x-66,y:grip.y-84+Math.sin(g.elapsed*2)*2};
    c.strokeStyle='#392c21';c.lineWidth=6;c.beginPath();c.moveTo(grip.x,grip.y);c.quadraticCurveTo(grip.x-30,grip.y-73,tip.x,tip.y);c.stroke();c.strokeStyle='#b99a63';c.lineWidth=3;c.stroke();
    c.strokeStyle='#dfdebc';c.lineWidth=1.4;c.beginPath();c.moveTo(tip.x,tip.y);c.quadraticCurveTo((tip.x+fx)/2,tip.y+30,fx,fy);c.stroke();
    c.strokeStyle=g.stage==='bite'?'#f4d075':'#9bd1cd88';c.lineWidth=2;c.beginPath();c.ellipse(fx,fy+3,13+Math.sin(g.elapsed*4)*3,5,0,0,Math.PI*2);c.stroke();
    c.fillStyle='#f0dbc0';c.fillRect(fx-3,fy-10+(g.stage==='bite'?9:wave*2),6,12);c.fillStyle='#cb7051';c.fillRect(fx-3,fy-10+(g.stage==='bite'?9:wave*2),6,5);
    if(g.stage==='bite')label(c,'咬钩！空格 / 点击提竿',fx,fy-32,'#ffdd8d',18);
    if(g.stage==='reel'&&g.warning)label(c,'水花变急了 · 准备松线',fx,fy-32,'#ffdd8d',16);
  }
  drawRegion(c,s,t){
    const f=s.expansion.flags;
    if(regionOf(s)==='waterworks'){
      if(!this.combat?.front)label(c,s.water.clean?'净水泵 · 清水恢复':s.water.sluice?'北闸已闭 · 等待净化':'旧村井支渠 · 禁止取水',840,270,'#efd9a1',14);
      if(s.water.rescued&&!this.combat)label(c,s.water.reported?'村民已回镇 · 营地留言':'陶恩与米菈 · 已获救',400,604,'#c7e2b6',13);
    }
    if(regionOf(s)==='wharf'&&s.life?.dinner){c.fillStyle='#cbd3ac';c.fillRect(326,287,56,13);for(const x of [336,367]){ellipse(c,x,292,7,3,'#efe2bf');}}
    if(regionOf(s)==='wharf'&&f.veraDeparted){c.fillStyle='#e1bf79';c.beginPath();c.moveTo(935,484);c.lineTo(944,489);c.lineTo(952,481);c.lineTo(948,490);c.lineTo(940,494);c.closePath();c.fill();}
    if(regionOf(s)==='wharf'){if(f.beacon){c.fillStyle='#ffdf8b';c.fillRect(1182,99,12,28);c.fillStyle='#fff4b5';c.fillRect(1186,104,4,18);}if(f.postbox){c.fillStyle='#b27d40';c.fillRect(750,256,30,5);c.fillStyle='#f0d294';c.fillRect(758,278,13,8);}if(f.posted){c.strokeStyle='#ecd099';c.lineWidth=3;c.beginPath();c.moveTo(779,239);c.lineTo(779,212);c.lineTo(801,212);c.lineTo(801,224);c.lineTo(779,224);c.stroke();}}
    for(const p of this.spots()){if(s.water.started&&['discharge','waterSample'].includes(p.id)){c.fillStyle='#7b6080';c.fillRect(p.x-10,p.y-13,20,18);c.fillStyle='#bbbab0';c.fillRect(p.x-11,p.y-14,22,4);}
    if(p.to||p.resource||p.id==='vera'||p.id==='bench')continue;const q=p.stand||p;c.strokeStyle='#dec78777';c.lineWidth=1.5;c.beginPath();c.ellipse(q.x,q.y,17,7,0,0,Math.PI*2);c.stroke();}
  }
  glow(c,x,y,r,a,color='255,181,84'){const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,`rgba(${color},${a})`);g.addColorStop(1,`rgba(${color},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
  drawMill(c,s,t){if(!s.flags.mill)return;c.save();c.translate(1339,103);c.rotate(s.settings.reducedMotion?Math.PI*.16:t*.3);for(let k=0;k<4;k++){c.rotate(Math.PI/2);c.fillStyle='#4b4430';c.fillRect(0,-3,88,6);c.fillStyle='#b59d72';c.fillRect(26,-16,59,15);c.strokeStyle='#5c4c32';c.lineWidth=3;for(let x=29;x<87;x+=12){c.beginPath();c.moveTo(x,-17);c.lineTo(x,0);c.stroke();}}c.restore();ellipse(c,1339,103,8,8,'#bc955e');if(s.flags.awakened&&s.helper){label(c,s.flags.departed?'传承磨轮 · 运转中':'奥伦 · 帮工中',1256,167,'#c7e5d5',12);}}
  drawCrops(c,s,t){for(const p of PLOTS){const q=s.plots[p.index];if(q.watered){c.fillStyle='#282d2580';c.fillRect(p.x-39,p.y-25,79,52);}if(!q.crop)continue;const ripe=isRipe(q);for(let j=0;j<4;j++){const x=p.x-20+(j%2)*37,y=p.y-4+Math.floor(j/2)*20;if(q.crop==='pumpkin'&&(ripe||q.growth>0)){const r=ripe?13:8;ellipse(c,x,y+4,r+3,4,'#29362070');c.fillStyle='#3c6140';c.fillRect(x-15,y-7,30,4);ellipse(c,x,y,r,r*.7,ripe?'#df934b':'#829044');c.strokeStyle=ripe?'#9b5c32':'#53613a';c.lineWidth=2;c.beginPath();c.ellipse(x,y,r*.5,r*.7,0,0,Math.PI*2);c.stroke();c.fillStyle='#596c3b';c.fillRect(x-2,y-r*.8-3,4,7);}else if(q.crop==='wheat'&&ripe){for(let k=-1;k<2;k++){const sx=x+k*7;c.strokeStyle='#c9ab63';c.lineWidth=2;c.beginPath();c.moveTo(sx,y+9);c.lineTo(sx+2,y-18);c.stroke();for(let a=0;a<4;a++){c.fillStyle=a%2?'#ddc87e':'#aa8e49';c.fillRect(sx-2+(a%2)*4,y-18+a*4,5,4);}}}else{c.fillStyle='#416b43';c.fillRect(x-2,y-7,4,15);c.fillStyle='#86a75b';c.fillRect(x-10,y-9,9,5);c.fillRect(x+1,y-13,9,5);}}if(ripe){c.fillStyle='#edce88';const yy=p.y-25+(s.settings.reducedMotion?0:Math.sin(t*2+p.index)*2);c.fillRect(p.x+31,yy,4,4);}}}
  drawItem(c,type,x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);if(type==='pie'){ellipse(c,0,0,14,8,'#704833');ellipse(c,0,-2,13,7,'#dea357');c.strokeStyle='#f1c886';c.lineWidth=2;for(let i=-8;i<=8;i+=5){c.beginPath();c.moveTo(i-3,-6);c.lineTo(i+3,2);c.stroke();}}c.restore();}
}
