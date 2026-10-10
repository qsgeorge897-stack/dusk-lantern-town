import {OP_WAVES,newOperation,tickOperation,operationCommand,operationTarget,finishOperation,cancelChannel} from './archive-battle.js?v=0.13.3';
import {operationLayers} from './archive-art.js?v=0.13.3';
import {frontLayers,drawBattleEffects} from './battle-art.js?v=0.13.3';
import {newFront,frontCommand,tickFront,finishFront,frontWon,frontTarget,frontDamage,stopAtBarrier} from './battlefront.js?v=0.13.3';
// Deterministic combat simulation. No DOM, inventory mutations, or reward side effects.
export const ARENA={left:280,right:1390,top:310,bottom:715};
export const ENEMY_TYPES={
 carrier:{name:'感染取水人',hp:72,speed:46,damage:15,range:64,windup:.8,col:0},
 runner:{name:'感染洗衣人',hp:60,speed:70,damage:18,range:220,windup:1,col:1},
 moss:{name:'黑苔团',hp:96,speed:36,damage:18,range:310,windup:1.2,col:2},
 core:{name:'黑苔母核',hp:288,speed:20,damage:22,range:310,windup:1.2,col:0},
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const bounded=p=>({x:clamp(p.x,ARENA.left,ARENA.right),y:clamp(p.y,ARENA.top,ARENA.bottom)});
export function segmentDistance(p,a,z){const dx=z.x-a.x,dy=z.y-a.y,m=dx*dx+dy*dy,t=m?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/m,0,1):0;return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
export function threatContains(shape,p){if(shape.kind==='line')return segmentDistance(p,shape.from,shape.to)<=shape.radius;const d=dist(shape,p);return d<=shape.radius&&(shape.kind!=='ring'||d>=shape.inner);}
export function newCombat(ticket,{assist=false,reinforced=false,tacticsKit=false,loadout='balanced'}={}){
 const b={id:ticket.id,encounter:ticket.encounter,assist,reinforced,time:0,hp:100,stamina:100,bandages:2,attackCd:0,dodgeCd:0,pulseCd:0,invincible:0,dash:0,angle:0,slash:0,pulse:0,enemies:[],kills:0,wave:0,pump:{x:850,y:350,hp:reinforced?220:150,max:reinforced?220:150},status:'active',paused:false,flash:0,notice:'',noticeUntil:0,numbers:[],projectiles:[],effects:[],phase:1,swing:null,pulseWave:null,contacts:[],sounds:[],pumpHit:0};
 if(Object.hasOwn(OP_WAVES,ticket.encounter)){b.operation=newOperation(ticket);b.loadout=loadout;b.pump={x:850,y:410,hp:reinforced?300:240,max:reinforced?300:240};return b;}
 if(['defend','drill'].includes(ticket.encounter)){b.front=newFront({tacticsKit});b.pump.hp=b.pump.max=reinforced?480:360;return b;}
 if(ticket.encounter==='lesson'){b.assist=true;spawn(b,['moss']);Object.assign(b.enemies[0],{hp:48,max:48,x:1060,y:440,cooldown:3});}
 else if(ticket.encounter==='rescue'){spawn(b,['carrier','runner']);Object.assign(b.enemies[0],{name:'陶恩 · 感染',x:710,y:507});Object.assign(b.enemies[1],{name:'米菈 · 感染',x:820,y:505});}
 else if(ticket.encounter==='sluice')spawn(b,['moss','runner','moss']);
 else if(ticket.encounter==='boss'){spawn(b,['core']);Object.assign(b.enemies[0],{x:1060,y:445,cooldown:1.6});}
 else spawn(b,['carrier','moss']);return b;
}
function spawn(b,types){const points=[[450,365],[1250,380],[1310,665],[420,660]];types.forEach((type,i)=>{const t=ENEMY_TYPES[type],p=points[(i+b.wave)%points.length];b.enemies.push({id:`${b.wave}-${i}`,type,x:p[0],y:p[1],hp:t.hp,max:t.hp,cooldown:1+i*.3,windup:0,aim:null,stun:0,flash:0,angle:0,exposed:0,cycles:0,charge:null});});b.wave++;}
function number(b,p,text,color){const stack=b.numbers.filter(n=>Math.abs(n.x-p.x)<25&&n.life>.55).length;b.numbers.push({x:p.x,y:p.y-58-stack*18,text,color,life:.9});if(b.numbers.length>24)b.numbers.shift();}
function notice(b,text){if(b.notice!==text||b.time>b.noticeUntil){b.notice=text;b.noticeUntil=b.time+1.8;}}
function hurtEnemy(b,e,n){if(e.hp<=0)return;const guarded=e.type==='core'&&e.exposed<=0,damage=guarded?Math.max(1,Math.round(n*.25)):n;e.hp=Math.max(0,e.hp-damage);e.flash=.18;number(b,e,`${guarded?'闭壳 ':''}−${damage}`,guarded?'#c2c5b8':'#ffe0a0');if(!e.hp){b.kills++;e.windup=0;e.aim=null;e.charge=null;}}
export function combatCommand(b,p,command,dir={x:0,y:1}){
 if(b.status!=='active')return false;
 if(b.front&&['build','launch','select','order','repair'].includes(command))return frontCommand(b,command,dir);
 if(b.paused)return false;
 if(b.operation&&['interact','operationRepair'].includes(command))return operationCommand(b,p,command);
 if(b.front?.phase==='planning')return false;
 const ready=(cd,cost)=>{if(b[cd]>0){if(command!=='attack')notice(b,command==='pulse'?'提灯正在恢复':'闪避正在恢复');return false;}if(b.stamina<cost){notice(b,'耐力不足，稍稍拉开距离');return false;}return true;};
 if(command==='attack'){
  if(b.pulseWave||!ready('attackCd',8))return false;const live=b.enemies.filter(e=>e.hp>0).sort((a,c)=>dist(a,p)-dist(c,p)),near=live[0];
  cancelChannel(b);b.angle=near?Math.atan2(near.y-p.y,near.x-p.x):Math.atan2(dir.y,dir.x);b.stamina-=8;b.attackCd=.42;b.slash=.42;b.swing={age:0,angle:b.angle,hit:[]};return true;
 }
 if(command==='dodge'){if(!ready('dodgeCd',22))return false;cancelChannel(b);b.stamina-=22;b.dodgeCd=1.2;b.invincible=.32;b.dash=.22;b.dashAngle=Math.atan2(dir.y,dir.x);return true;}
 if(command==='pulse'){
  const cost=b.loadout==='wick'?28:35;if(b.swing||!ready('pulseCd',cost))return false;cancelChannel(b);b.stamina-=cost;b.pulseCd=b.loadout==='lined'?6:5;b.pulse=.55;b.pulseWave={x:p.x,y:p.y,age:0,hit:[]};b.sounds.push('charge');return true;
 }
 if(command==='bandage'){
  if(b.bandages<1||b.hp>=100){notice(b,b.bandages<1?'绷带已经用完':'生命充足，先留着绷带');return false;}const healed=Math.min(35,100-b.hp);b.bandages--;b.hp+=healed;notice(b,`绷带 · 生命 +${healed}`);number(b,p,`+${healed}`,'#bde8a4');return true;
 }
 return false;
}
function damageArea(b,p,shape,amount,hit={}){
 if(b.front)frontDamage(b,shape,amount,hit,threatContains);
 if(!hit.player&&threatContains(shape,p)&&b.invincible<=0){const n=Math.max(1,amount-(b.reinforced?5:3)-(b.loadout==='lined'?2:0))*(b.assist?.45:1);b.hp=Math.max(0,b.hp-n);b.invincible=.65;b.flash=.25;hit.player=true;number(b,p,`−${Math.ceil(n)}`,'#ffb09b');}
 if((b.front||b.operation?.kind==='sealDevice')&&!hit.pump&&threatContains(shape,b.pump)){b.pump.hp=Math.max(0,b.pump.hp-amount*(b.assist?.65:1));hit.pump=true;b.pumpHit=1.5;number(b,b.pump,`−${Math.ceil(amount*(b.assist?.65:1))}`,'#ffb09b');}
}
function beginAttack(b,e,target){const t=ENEMY_TYPES[e.type];let time=t.windup;
 if(e.type==='runner'){const a=Math.atan2(target.y-e.y,target.x-e.x),length=Math.min(240,dist(e,target)+30);e.aim={kind:'line',from:{x:e.x,y:e.y},to:bounded({x:e.x+Math.cos(a)*length,y:e.y+Math.sin(a)*length}),radius:25};}
 else if(e.type==='moss')e.aim={kind:'circle',x:target.x,y:target.y,radius:58};
 else if(e.type==='core'){e.cycles++;if(e.cycles%3===0){e.aim={kind:'ring',x:e.x,y:e.y,inner:100,radius:195};time=b.phase===2?1.1:1.45;}else{e.aim={kind:'circle',x:target.x,y:target.y,radius:b.phase===2?98:86};time=b.phase===2?.95:1.2;}notice(b,e.aim.kind==='ring'?'环形震荡 · 靠近核心或退到外圈':'根刺 · 离开脚下标记');}
 else e.aim={kind:'circle',x:target.x,y:target.y,radius:t.range};
 e.windup=time*(b.assist?1.5:1);e.windupMax=e.windup;
}
function releaseAttack(b,e,p){const t=ENEMY_TYPES[e.type],a=e.aim;if(!a)return;const shape={kind:'circle',radius:t.range,...a,source:{x:e.x,y:e.y}};
 if(e.type==='runner')e.charge={...shape,elapsed:0,duration:.3,hit:{}};
 else if(e.type==='moss')b.projectiles.push({from:{x:e.x,y:e.y-30},shape,age:0,duration:.42,damage:t.damage});
 else{damageArea(b,p,shape,t.damage);b.effects.push({shape,life:.28});}
 if(e.type==='core')e.exposed=2.2;e.aim=null;e.cooldown=e.type==='core'?2.5:e.type==='carrier'?1.4:2;
}
export function updateCombat(b,p,dt){
 if(b.status!=='active'||b.paused)return;b.time+=dt;if(b.operation)Object.assign(p,bounded(p));
 for(const k of ['attackCd','dodgeCd','pulseCd','invincible','slash','pulse','flash','pumpHit'])b[k]=Math.max(0,b[k]-dt);
 b.contacts=b.contacts.filter(n=>(n.life-=dt)>0);
 b.numbers=b.numbers.filter(n=>(n.life-=dt)>0);b.effects=b.effects.filter(e=>(e.life-=dt)>0);b.stamina=Math.min(100,b.stamina+24*dt);
 if(b.dash>0){const elapsed=Math.min(dt,b.dash);b.dash-=elapsed;Object.assign(p,bounded({x:p.x+Math.cos(b.dashAngle)*520*elapsed,y:p.y+Math.sin(b.dashAngle)*520*elapsed}));}
 // Weapon contacts resolve during the active window, not on the key press.
 if(b.swing){const q=b.swing,previous=q.age;q.age+=dt;if(previous<.22&&q.age>=.10){if(previous<.10)b.sounds.push('sword');for(const e of b.enemies){const a=Math.atan2(e.y-p.y,e.x-p.x)-q.angle;if(e.hp>0&&!q.hit.includes(e.id)&&dist(e,p)<=105&&Math.cos(a)>=.35){q.hit.push(e.id);hurtEnemy(b,e,b.loadout==='wick'?20:24);b.contacts.push({x:e.x,y:e.y-30,life:.18,kind:'sword'});}}}if(q.age>=.42)b.swing=null;}
 if(b.pulseWave){const q=b.pulseWave,previous=q.age;q.age+=dt;if(q.age>=.15){if(previous<.15)b.sounds.push('pulse');const reach=b.loadout==='wick'?235:200,radius=Math.min(reach,reach*(q.age-.15)/.25);for(const e of b.enemies)if(e.hp>0&&!q.hit.includes(e.id)&&dist(e,q)<=radius){q.hit.push(e.id);e.exposed=e.type==='core'?3:0;hurtEnemy(b,e,12);e.stun=e.type==='core'?.9:2;e.windup=0;e.aim=null;e.charge=null;b.contacts.push({x:e.x,y:e.y-28,life:.3,kind:'pulse'});if(e.type!=='core'){const a=Math.atan2(e.y-q.y,e.x-q.x);e.knock={x:Math.cos(a)*200,y:Math.sin(a)*200,left:.18};}}}if(q.age>=.55)b.pulseWave=null;}
 if(b.front){tickFront(b,p,dt,{hurt:(e,n)=>hurtEnemy(b,e,n),spawn:(type,lane,index)=>{const t=ENEMY_TYPES[type];b.enemies.push({id:`front-${b.front.spawned}`,type,lane,x:lane==='west'?290:1380,y:350+index%4*105,hp:Math.round(t.hp*1.35),max:Math.round(t.hp*1.35),cooldown:1,windup:0,aim:null,stun:0,flash:0,angle:0,exposed:0,cycles:0,charge:null});}});}

 if(b.operation)tickOperation(b,dt,(q,id)=>{const t=ENEMY_TYPES[q.type];b.enemies.push({id:'op-'+id,type:q.type,name:q.type==='carrier'?'苔附躯壳':q.type==='runner'?'游荡残影':'黑苔团',pressure:id%2===0,lane:q.lane,x:q.lane==='west'?300:1370,y:340+q.index*90,hp:t.hp,max:t.hp,cooldown:1.3,windup:0,aim:null,stun:0,flash:0,angle:0,exposed:0,cycles:0,charge:null});});
 const core=b.enemies.find(e=>e.type==='core');
 if(core&&core.hp>0&&core.hp<=core.max/2&&b.phase===1){b.phase=2;spawn(b,['moss','moss']);core.exposed=3;notice(b,'母核开裂 · 两团黑苔苏醒了');}
 // The dying core dissipates attached spores; a lost player cannot receive a win.
 if(core&&core.hp<=0){b.projectiles=[];for(const e of b.enemies)e.hp=0;}
 for(const shot of b.projectiles){shot.age+=dt;if(shot.age>=shot.duration){damageArea(b,p,shot.shape,shot.damage);b.effects.push({shape:shot.shape,life:.32});}}
 b.projectiles=b.projectiles.filter(shot=>shot.age<shot.duration);
 for(const e of b.enemies){
  e.flash=Math.max(0,e.flash-dt);if(e.hp<=0)continue;if(e.knock){const from={x:e.x,y:e.y},elapsed=Math.min(dt,e.knock.left);Object.assign(e,bounded({x:e.x+e.knock.x*elapsed,y:e.y+e.knock.y*elapsed}));stopAtBarrier(b,e,from);e.knock.left-=elapsed;if(e.knock.left<=0)e.knock=null;}e.exposed=Math.max(0,e.exposed-dt);e.stun=Math.max(0,e.stun-dt);if(e.stun>0)continue;
  const t=ENEMY_TYPES[e.type];e.cooldown=Math.max(0,e.cooldown-dt);
  if(e.charge){const q=e.charge,from={x:e.x,y:e.y};q.elapsed=Math.min(q.duration,q.elapsed+dt);const u=q.elapsed/q.duration;e.x=q.from.x+(q.to.x-q.from.x)*u;e.y=q.from.y+(q.to.y-q.from.y)*u;stopAtBarrier(b,e,from);damageArea(b,p,{kind:'line',from,to:{x:e.x,y:e.y},radius:q.radius},t.damage,q.hit);if(u===1)e.charge=null;continue;}
  if(e.windup>0){e.windup=Math.max(0,e.windup-dt);if(e.windup===0)releaseAttack(b,e,p);continue;}
  const target=b.front?frontTarget(b,p,e):operationTarget(b,p,e),d=dist(target,e);e.angle=Math.atan2(target.y-e.y,target.x-e.x);
  if(target.isFlag){if(d>40){e.x=clamp(e.x+(target.x-e.x)/d*t.speed*dt,ARENA.left,ARENA.right);e.y=clamp(e.y+(target.y-e.y)/d*t.speed*dt,ARENA.top,ARENA.bottom);}continue;}
  if(d<t.range*(e.type==='carrier'?.8:1)&&e.cooldown===0){beginAttack(b,e,target);continue;}
  if(d>t.range*(e.type==='core'?.55:e.type==='moss'?.7:.55)){e.x=clamp(e.x+Math.cos(e.angle)*t.speed*dt,ARENA.left,ARENA.right);e.y=clamp(e.y+Math.sin(e.angle)*t.speed*dt,ARENA.top,ARENA.bottom);}
 }
 if(b.hp<=0||b.pump.hp<=0){b.status='lost';return;}
 if(b.front)finishFront(b);
 if(b.front?frontWon(b):b.operation?finishOperation(b,p,dt):b.enemies.every(e=>e.hp<=0))b.status='won';
}
function circle(c,x,y,r,fill,stroke){c.beginPath();c.ellipse(x,y,r,r*.48,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
function drawThreat(c,a,alpha=1){
 c.save();c.globalAlpha=alpha;c.fillStyle='#d8773c35';c.strokeStyle='#ffe0a0';c.lineWidth=2;c.beginPath();
 if(a.kind==='line'){c.lineCap='round';c.moveTo(a.from.x,a.from.y);c.lineTo(a.to.x,a.to.y);c.strokeStyle='#e6a05c66';c.lineWidth=a.radius*2;c.stroke();c.beginPath();c.moveTo(a.from.x,a.from.y);c.lineTo(a.to.x,a.to.y);c.strokeStyle='#ffe0a0';c.lineWidth=2;c.stroke();}
 else{c.arc(a.x,a.y,a.radius,0,Math.PI*2);if(a.kind==='ring'){c.moveTo(a.x+a.inner,a.y);c.arc(a.x,a.y,a.inner,0,Math.PI*2,true);}c.fill('evenodd');c.stroke();}c.restore();
}
export function drawCombat(c,b,p,art,{bossArt,tacticsArt,battleArt={},archiveArt,drawKeeper,reducedMotion=false}={}){
 const layers=[...frontLayers(c,b,p,{...battleArt,tactics:tacticsArt},reducedMotion),...operationLayers(c,b,archiveArt)];
 // Rendering and hits share the same locked geometry, including safe inner rings.
 for(const e of b.enemies)if(e.hp>0&&e.aim)drawThreat(c,{kind:'circle',radius:ENEMY_TYPES[e.type].range,...e.aim});
 for(const q of b.projectiles){drawThreat(c,q.shape);const u=q.age/q.duration,x=q.from.x+(q.shape.x-q.from.x)*u,y=q.from.y+(q.shape.y-q.from.y)*u-Math.sin(u*Math.PI)*45;circle(c,x,y,9,'#b1d3b6','#695b88');}
 for(const fx of b.effects)drawThreat(c,fx.shape,Math.min(1,fx.life*3));
 for(const e of b.enemies.filter(e=>e.hp>0))layers.push({y:e.y,draw:()=>{
  const t=ENEMY_TYPES[e.type],boss=e.type==='core';circle(c,e.x,e.y,boss?62:25,'#11292366');c.save();if(e.flash>0&&!reducedMotion)c.globalAlpha=.65;
  if(boss&&bossArt?.complete){const cw=bossArt.width/2,ch=bossArt.height/2,index=e.windup>0?2:e.exposed>0?1:0;c.drawImage(bossArt,(index%2)*cw,Math.floor(index/2)*ch,cw,ch,e.x-120,e.y-144,240,160);}
  else if(art?.complete){const cellW=art.width/3,cellH=art.height/2,row=e.windup>0||e.charge?1:0;const h=e.type==='moss'?95:88,w=h*cellW/cellH;c.drawImage(art,t.col*cellW,row*cellH,cellW,cellH,e.x-w/2,e.y-h*.97,w,h);}else{c.fillStyle='#65778c';c.fillRect(e.x-12,e.y-46,24,44);}c.restore();
  const top=e.y-(boss?165:91),width=boss?120:50;c.fillStyle='#222c29';c.fillRect(e.x-width/2,top,width,5);c.fillStyle=e.stun>0||boss&&e.exposed>0?'#f3dc8b':'#ac756c';c.fillRect(e.x-width/2,top,width*e.hp/e.max,5);
  if(e.name){c.font='12px "PingFang SC",sans-serif';c.textAlign='center';c.fillStyle='#fff0c5';c.fillText(e.name,e.x,top-7);}if(e.stun>0){c.save();c.translate(e.x,top-18);c.fillStyle='#f7de9c';c.beginPath();c.moveTo(0,-7);c.lineTo(2,-2);c.lineTo(7,0);c.lineTo(2,2);c.lineTo(0,7);c.lineTo(-2,2);c.lineTo(-7,0);c.lineTo(-2,-2);c.closePath();c.fill();c.restore();}
 }});
 if(drawKeeper)layers.push({y:p.y,draw:drawKeeper});for(const layer of layers.sort((a,z)=>a.y-z.y))layer.draw();
 drawBattleEffects(c,b,reducedMotion);
 if(b.invincible>0)circle(c,p.x,p.y,22,null,'#e7cc8c');
 c.save();c.textAlign='center';c.font='bold 15px "PingFang SC",sans-serif';for(const n of b.numbers){c.globalAlpha=Math.min(1,n.life*2);const y=n.y-(reducedMotion?0:(.9-n.life)*30);c.lineWidth=3;c.strokeStyle='#1c282a';c.strokeText(n.text,n.x,y);c.fillStyle=n.color;c.fillText(n.text,n.x,y);}c.restore();

}
