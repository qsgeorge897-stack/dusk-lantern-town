// A complete finite battle: requisition, two squads, capture points and six cleared waves.
export const WAVES=[
 {name:'西渠试探',lanes:['west'],types:['carrier','carrier','runner','carrier','moss']},
 {name:'东堤急袭',lanes:['east'],types:['runner','carrier','runner','moss','carrier','carrier']},
 {name:'两路黑潮',lanes:['west','east'],types:['carrier','runner','moss','carrier','runner','carrier','moss']},
 {name:'孢子掩护',lanes:['east','west'],types:['moss','carrier','runner','moss','carrier','runner','carrier','moss']},
 {name:'决口冲锋',lanes:['west','east'],types:['runner','runner','carrier','moss','runner','carrier','moss','carrier','runner']},
 {name:'最后的潮声',lanes:['west','east'],types:['carrier','runner','moss','carrier','runner','moss','runner','carrier','moss','carrier']},
];
export const FRONT_SLOTS=[{id:'wGate',name:'西路前沿',x:650,y:495},{id:'eGate',name:'东路前沿',x:1020,y:495},{id:'wRear',name:'泵左高台',x:730,y:370},{id:'eRear',name:'泵右高台',x:970,y:370},{id:'wSouth',name:'西侧后援',x:650,y:640},{id:'eSouth',name:'东侧后援',x:1020,y:640}];
export const BUILDINGS={barrier:{name:'路障',cost:2,hp:180},tower:{name:'灯塔',cost:3,hp:120}};
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function move(a,p,dt,speed){const n=d(a,p);if(n>3){a.x=clamp(a.x+(p.x-a.x)/n*Math.min(n,speed*dt),280,1390);a.y=clamp(a.y+(p.y-a.y)/n*Math.min(n,speed*dt),310,715);}}
function structures(loadout){return FRONT_SLOTS.flatMap(p=>loadout[p.id]?[{...p,type:loadout[p.id],hp:BUILDINGS[loadout[p.id]].hp,max:BUILDINGS[loadout[p.id]].hp,cooldown:0}]:[]);}
export function newFront({tacticsKit=false}={}){return {phase:'planning',wave:0,spawned:0,queue:[],spawnIn:0,breakLeft:0,repairs:3,selected:'shield',budget:tacticsKit?18:12,loadout:{wGate:'barrier',eGate:'barrier',wRear:'tower',eRear:'tower'},structures:[],orders:{shield:'west',archer:'east'},flags:[{id:'west',name:'西渠旗',x:535,y:510,control:100},{id:'east',name:'东堤旗',x:1135,y:510,control:100}],units:['shield','archer'].flatMap((type,k)=>Array.from({length:3},(_,i)=>({id:`${type}-${i}`,type,x:(k?1090:490)+i*45,y:550+(i%2)*42,hp:type==='shield'?130:90,max:type==='shield'?130:90,cooldown:0}))),shots:[],impacts:[],queuedOrders:{},panelOpen:true,panelTab:'build',message:'布防就绪后，发起第一波。'};}
export const frontSpent=f=>Object.values(f.loadout).reduce((n,t)=>n+BUILDINGS[t].cost,0);
function startWave(b){const f=b.front;if(f.wave>=WAVES.length)return false;const w=WAVES[f.wave];f.wave++;b.wave=f.wave;f.queue=w.types.map((type,i)=>({type,lane:w.lanes[i%w.lanes.length],index:i}));f.spawnIn=2;f.warning=2;f.panelOpen=false;f.phase='wave';f.message=`第 ${f.wave}/6 波 · ${w.name}`;return true;}
export function frontCommand(b,command,arg){const f=b.front;if(!f||b.status!=='active')return false;if(b.paused&&!['select','order'].includes(command))return false;
 if(command==='build'){if(f.phase!=='planning'||!FRONT_SLOTS.some(p=>p.id===arg.id)||arg.type!==null&&!BUILDINGS[arg.type])return false;const old=f.loadout[arg.id],next=arg.type;const spent=frontSpent(f)-(old?BUILDINGS[old].cost:0)+(next?BUILDINGS[next].cost:0);if(spent>f.budget){f.message='补给不足，拆除其他设施可退回补给。';return false;}if(next)f.loadout[arg.id]=next;else delete f.loadout[arg.id];f.message='布置已更新 · 开战后不能移动设施';return true;}
 if(command==='launch'){if(!['planning','break'].includes(f.phase))return false;if(f.phase==='planning')f.structures=structures(f.loadout);return startWave(b);}
 if(command==='select'){if(!['shield','archer'].includes(arg))return false;f.selected=arg;return true;}
 if(command==='order'){if(!['follow','pump','west','east'].includes(arg))return false;if(b.paused){f.queuedOrders[f.selected]=arg;f.message='命令已排队 · 恢复战斗后执行';return true;}f.orders[f.selected]=arg;f.message=(f.selected==='shield'?'盾卫队':'弩手队')+'：'+({follow:'跟随守灯人',pump:'守住净水泵',west:'守住西渠旗',east:'守住东堤旗'}[arg]);return true;}
 if(command==='repair'){if(f.repairs<=0||f.phase==='planning')return false;const targets=[b.pump,...f.structures];if(targets.every(t=>t.hp>=t.max))return false;f.repairs--;for(const t of targets)t.hp=Math.min(t.max,t.hp+60);f.message=`完成战地修理 · 剩余 ${f.repairs} 次`;return true;}
 return false;
}
// Physical projectiles use a swept segment, so even a fast bolt cannot tunnel through a body.
export function shotContact(from,to,e,radius=20){const dx=to.x-from.x,dy=to.y-from.y,m=dx*dx+dy*dy,t=m?clamp(((e.x-from.x)*dx+(e.y-from.y)*dy)/m,0,1):0;return Math.hypot(e.x-from.x-dx*t,e.y-from.y-dy*t)<=radius?t:null;}
const sound=(b,kind)=>{(b.sounds??=[]).push(kind);if(b.sounds.length>32)b.sounds.shift();};
function fire(b,a,e,kind){const f=b.front,angle=Math.atan2(e.y-a.y,e.x-a.x);f.shots.push({x:a.x,y:a.y,angle,vx:Math.cos(angle)*(kind==='tower'?400:570),vy:Math.sin(angle)*(kind==='tower'?400:570),age:0,flight:d(a,e)/(kind==='tower'?400:570),life:kind==='tower'?.95:.65,kind,damage:kind==='tower'?15:11});sound(b,kind==='tower'?'light':'arrow');}
export function tickFront(b,p,dt,{spawn,hurt}){const f=b.front;if(!f)return;
 Object.assign(f.orders,f.queuedOrders);f.queuedOrders={};f.impacts=f.impacts.filter(s=>(s.life-=dt)>0);f.warning=Math.max(0,(f.warning||0)-dt);
 if(f.phase==='planning')return;
 if(f.phase==='break'){f.breakLeft=Math.max(0,f.breakLeft-dt);if(f.breakLeft===0)startWave(b);}
 if(f.phase==='wave'){f.spawnIn-=dt;while(f.queue.length&&f.spawnIn<=0){const q=f.queue.shift();spawn(q.type,q.lane,q.index);f.spawned++;f.spawnIn+=.65;}}
 for(const shot of f.shots){const from={x:shot.x,y:shot.y};const travel=Math.min(dt,shot.life);shot.x+=shot.vx*travel;shot.y+=shot.vy*travel;shot.age+=dt;shot.life-=dt;
  const hits=b.enemies.filter(e=>e.hp>0).map(e=>({e,t:shotContact(from,shot,e,e.type==='core'?42:20)})).filter(h=>h.t!==null).sort((a,c)=>a.t-c.t);
  if(hits.length){const {e}=hits[0];hurt(e,shot.damage);shot.life=0;f.impacts.push({x:e.x,y:e.y-30,kind:shot.kind,life:.22});}
  else if(shot.life<=0)f.impacts.push({x:shot.x,y:shot.y,kind:'miss',life:.4});
 }f.shots=f.shots.filter(s=>s.life>0);
 for(const a of [...f.units,...f.structures]){a.flash=Math.max(0,(a.flash||0)-dt);a.block=Math.max(0,(a.block||0)-dt);if(a.hp<=0){a.action=null;continue;}a.cooldown=Math.max(0,a.cooldown-dt);
  if(a.action){const q=a.action,old=q.age;q.age+=dt;const hitTime=a.type==='shield'?.22:a.type==='archer'?.36:.4;
   if(old<hitTime&&q.age>=hitTime){const e=b.enemies.find(e=>e.id===q.target&&e.hp>0);if(e){if(a.type==='shield'){if(d(a,e)<=78){hurt(e,8);f.impacts.push({x:e.x,y:e.y-28,kind:'shield',life:.2});sound(b,'stab');}}else fire(b,a,e,a.type);}}
   if(q.age>=(a.type==='shield'?.6:a.type==='archer'?1.3:.85))a.action=null;
  }
  if(a.type==='barrier')continue;
  let station=a,range=335,leash=335;
  if(a.type!=='tower'){const order=f.orders[a.type],base=order==='follow'?p:order==='pump'?b.pump:f.flags.find(v=>v.id===order),index=+a.id.at(-1);station={x:base.x+(index-1)*46,y:base.y+(order==='pump'?75:20)};range=a.type==='shield'?65:295;leash=a.type==='shield'?245:340;}
  const enemy=b.enemies.filter(e=>e.hp>0&&d(e,station)<leash).sort((x,y)=>d(x,a)-d(y,a))[0];
  if(enemy){const desired=Math.atan2(enemy.y-a.y,enemy.x-a.x),delta=Math.atan2(Math.sin(desired-(a.angle||0)),Math.cos(desired-(a.angle||0)));a.angle=(a.angle||0)+clamp(delta,-dt*7,dt*7);}
  if(enemy&&d(a,enemy)<=range){if(a.cooldown<=0&&!a.action){a.action={age:0,target:enemy.id};a.cooldown=a.type==='shield'?1.3:1.8;}}
  else if(a.type!=='tower'&&!a.action)move(a,enemy&&a.type==='shield'?enemy:station,dt,a.type==='shield'?95:90);
 }
 for(const flag of f.flags){const hostile=b.enemies.some(e=>e.hp>0&&d(e,flag)<95),friendly=d(p,flag)<95||f.units.some(a=>a.hp>0&&d(a,flag)<95);flag.contested=hostile&&friendly;if(hostile&&!friendly)flag.control=Math.max(0,flag.control-18*dt);if(friendly&&!hostile)flag.control=Math.min(100,flag.control+25*dt);}
}
export function finishFront(b){const f=b.front;if(f.phase!=='wave'||f.queue.length||b.enemies.some(e=>e.hp>0))return;
 if(f.wave===WAVES.length){f.phase='secure';f.message='敌群已清除 · 走近或派队伍夺回两面旗帜';return;}
 f.phase='break';f.breakLeft=6;f.message=`第 ${f.wave} 波已清场 · 整备恢复，下一波即将到来`;b.hp=Math.min(100,b.hp+15);b.pump.hp=Math.min(b.pump.max,b.pump.hp+25);for(const a of f.units)a.hp=Math.min(a.max,Math.max(a.max*.5,a.hp+30));for(const a of f.structures)a.hp=Math.min(a.max,a.hp+20);
}
export function frontWon(b){return b.front.phase==='secure'&&b.front.flags.every(f=>f.control>=100);}
export function frontTarget(b,p,e){const f=b.front;const blockers=f.structures.filter(a=>a.hp>0&&d(e,a)<240).sort((a,c)=>d(e,a)-d(e,c));const close=f.units.filter(a=>a.hp>0&&d(e,a)<150).sort((a,c)=>d(e,a)-d(e,c));if(d(e,p)<115)return p;if(close[0])return close[0];if(blockers[0])return blockers[0];const flag=f.flags.find(a=>a.id===e.lane)||f.flags[0];if(flag.control>0)return {...flag,isFlag:true};return b.pump;}
// Stop a rushing body at the first standing barricade along its swept path.
export function stopAtBarrier(b,e,from){if(!b.front)return;const dx=e.x-from.x,dy=e.y-from.y,length=Math.hypot(dx,dy);if(!length)return;let hitAt=length,wall=null;
 for(const a of b.front.structures){if(a.hp<=0||a.type!=='barrier')continue;const px=from.x-a.x,py=from.y-a.y,along=-(px*dx+py*dy)/length,perp2=px*px+py*py-along*along;if(perp2>34*34)continue;const enter=along-Math.sqrt(Math.max(0,34*34-perp2));if(enter>=-.001&&enter<hitAt){hitAt=Math.max(0,enter);wall=a;}else if(px*px+py*py<34*34&&(px*dx+py*dy)<0){hitAt=0;wall=a;}}
 if(wall){e.x=from.x+dx/length*hitAt;e.y=from.y+dy/length*hitAt;e.charge=null;}
}
export function frontDamage(b,shape,amount,hit,contains){for(const a of [...b.front.units,...b.front.structures])if(a.hp>0&&!hit[a.id]&&contains({...shape,radius:shape.radius+(a.type==='barrier'||a.type==='tower'?12:0)},a)){
 const origin=shape.source||shape.from,front=origin&&Math.cos(Math.atan2(origin.y-a.y,origin.x-a.x)-(a.angle||0))>.15,blocked=a.type==='shield'&&front;
 a.hp=Math.max(0,a.hp-amount*(b.assist?.6:1)*(blocked?.55:1));a.flash=.18;if(blocked){a.block=.25;sound(b,'block');b.front.impacts.push({x:a.x+Math.cos(a.angle)*18,y:a.y-34,kind:'block',life:.25});}hit[a.id]=true;
}}
