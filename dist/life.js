import {nearLucy} from './town.js?v=0.13.3';
import {ROOMS,DOORS,nearRoomSpot} from './indoors.js?v=0.13.3';
import {FISH,FISH_ITEMS,FISH_SPOT,selectFish} from './fishing.js?v=0.13.3';
export function newLife(){return {room:null,chest:{},rod:false,assist:false,catches:0,serial:0,pending:null,records:{},dinner:false,invited:false,mailSorted:false};}
const requireNear=(s,id)=>{if(!nearRoomSpot(s,id))throw Error('请走到这件家具旁再互动');};
function fishNear(s){if(s.life.room||s.expansion.region!=='wharf'||Math.hypot(s.player.x-FISH_SPOT.stand.x,s.player.y-FISH_SPOT.stand.y)>105)throw Error('请先走到旧渡口栈桥的钓位');}
export function availableAtHome(s,key){return s.inventory[key]+(s.life.room==='home'?(s.life.chest[key]||0):0);}
function takeHome(s,key,n){const fromBag=Math.min(n,s.inventory[key]);s.inventory[key]-=fromBag;if(n>fromBag)s.life.chest[key]-=n-fromBag;}
export function soupReason(s){return availableAtHome(s,'silver')+availableAtHome(s,'carp')<2?'还缺普通鱼：银尾小鱼或河鲫共 2 条':availableAtHome(s,'driedHerb')<1?'还缺干香草 1':s.energy<4?'体力不足':'';}
export const LIFE_ACTIONS=['enterRoom','exitRoom','storage','cookHome','claimRod','startCast','finishCast','cancelCast','fishAssist','inviteDinner','serveDinner','sortMail'];
export function lifeAction(s,type,p,{note,ITEMS}){
 const l=s.life;
 switch(type){
 case 'enterRoom':{
  const d=DOORS[p.room];if(!d||l.room||s.expansion.region!==d.parent||Math.hypot(s.player.x-d.stand.x,s.player.y-d.stand.y)>115)throw Error('请先走到房门旁');
  if(p.room==='archiveRoom'&&!s.archive?.rescued)throw Error('先救回门外的岑禾');if(p.room==='sealRoom'&&!s.archive?.ledger)throw Error('先在仓库找到封存账册');
  l.room=p.room;s.player={...ROOMS[p.room].entry};return '走进'+ROOMS[p.room].name;
 }
 case 'exitRoom':{if(!l.room)throw Error('现在已经在屋外');requireNear(s,'roomExit');const d=DOORS[l.room];l.room=null;s.player={...d.stand};return '回到门外';}
 case 'storage':{
  requireNear(s,'chest');const k=p.item;if(!Object.hasOwn(ITEMS,k))throw Error('不能存放这件物品');
  const from=p.take?l.chest:s.inventory,to=p.take?s.inventory:l.chest;
  const n=p.all?(from[k]||0):1;if(!Number.isInteger(n)||n<1||(from[k]||0)<n||(to[k]||0)+n>1e6)throw Error('没有可移动的物品');from[k]-=n;to[k]=(to[k]||0)+n;return `${p.take?'取出':'存入'}${ITEMS[k].name} ×${n}`;
 }
 case 'cookHome':{
  requireNear(s,'stove');const recipe=p.recipe;let need,energy,minutes;
  if(recipe==='fishSoup'){
   const reason=soupReason(s);if(reason)throw Error(reason);const silver=Math.min(2,availableAtHome(s,'silver'));need={silver,carp:2-silver,driedHerb:1};energy=4;minutes=15;
  }else if(recipe==='pie'){
   if(!s.flags.metLucy)throw Error('先向露西学习南瓜派');need={pumpkin:1,flour:1,honey:1};energy=4;minutes=20;
  }else if(recipe==='applePastry'){if(s.neighborhood?.lucy!==3)throw Error('先完成露西的休息故事');need={apple:1,flour:1,honey:1};energy=4;minutes=20;}else throw Error('这里还没有这份食谱');
  for(const [k,n]of Object.entries(need))if(availableAtHome(s,k)<n)throw Error('还缺'+ITEMS[k].name+' '+(n-availableAtHome(s,k)));
  if(s.energy<energy)throw Error('体力不足');for(const[k,n]of Object.entries(need))takeHome(s,k,n);
  s.inventory[recipe]++;s.energy-=energy;s.minute=Math.min(1320,s.minute+minutes);s.stats.crafted++;return ITEMS[recipe].name+'做好了';
 }
 case 'claimRod':fishNear(s);if(l.rod)throw Error('已经领过鱼竿了');l.rod=true;note(s,'领到渡口留下的旧鱼竿。近水的普通鱼可以做汤。');return '获得旧鱼竿 · 可在背包安排快捷格';
 case 'fishAssist':l.assist=!l.assist;return `辅助收线已${l.assist?'开启':'关闭'}，奖励相同`;
 case 'startCast':{
  fishNear(s);if(!l.rod)throw Error('先领取桥边的旧鱼竿');if(!['near','far'].includes(p.depth))throw Error('请选择近水或远水');if(l.pending)throw Error('先收起上一竿');if(s.energy<3)throw Error('体力不足，回家休息后再来');
  const fish=selectFish(s,p.depth),f=FISH[fish];l.serial++;l.pending={id:l.serial,fish,length:Math.round((f.min+Math.random()*(f.max-f.min))*10)/10,depth:p.depth,tutorial:l.catches===0,day:s.day,weather:s.weather,night:s.minute>=1080};
  s.energy-=3;s.minute=Math.min(1320,s.minute+10);return '抛竿 · 体力 −3，时间 +10 分钟';
 }
 case 'cancelCast':if(!l.pending)throw Error('没有正在进行的钓鱼');l.pending=null;return '收起鱼竿，本次抛竿消耗保留';
 case 'finishCast':{
  fishNear(s);const t=l.pending;if(!t||p.id!==t.id)throw Error('这一竿已经结束');
  if(!p.caught){l.pending=null;return '鱼游走了，下次再试试';}
  s.inventory[t.fish]++;l.catches++;const r=l.records[t.fish];l.records[t.fish]={count:(r?.count||0)+1,max:Math.max(r?.max||0,t.length),firstDay:r?.firstDay||t.day,depth:r?.depth||t.depth,weather:r?.weather||t.weather,night:r?.night??t.night};
  if(!r)note(s,`第一次钓到${FISH[t.fish].name}，${t.length} 厘米。`);l.pending=null;return `${FISH[t.fish].name} ×1 · ${t.length} 厘米`;
 }
 case 'inviteDinner':
  if(!nearLucy(s))throw Error('请先走到露西身边');if(!l.catches)throw Error('先到渡口钓一条鱼');if(l.invited)throw Error('已经约好了，不用赶时间');l.invited=true;note(s,'露西提议在河边吃顿饭。普通鱼 2 条、干香草 1，在家做汤，再送到河岸长椅。');return '新心愿：河上的第一顿晚餐';
 case 'serveDinner':
  if(l.room||s.expansion.region!=='wharf'||Math.hypot(s.player.x-356,s.player.y-368)>110)throw Error('请到河岸长椅旁');
  if(!l.invited)throw Error('先去杂货屋和露西约好晚餐');if(l.dinner)throw Error('晚餐已经摆好了');if(s.inventory.fishSoup<1)throw Error('带上一份香草鱼汤');
  s.inventory.fishSoup--;l.dinner=true;s.coins+=30;note(s,s.expansion.flags.veraDeparted?'河边摆起晚餐。铜燕子旁也留了一只碗。':'河边摆起晚餐。露西说，下次也要给送信的人留个座位。');return '晚餐摆好了 · 获得 30 金币，家中开放邀请';
 case 'sortMail':requireNear(s,'sortMail');if(!s.expansion.flags.metVera)throw Error('先听薇拉讲述回程');if(l.mailSorted)throw Error('信件已经整理好了');l.mailSorted=true;note(s,'在邮驿替回信找好位置。一张便笺写着：送信的人，也该收到邀请。');return '信件归位 · 留下一段新记录';
 default:throw Error('未知生活操作');
 }
}
export function readLife(raw,s){
 if(raw===undefined)return newLife();const l=newLife();const fail=()=>{throw Error('存档室内或钓鱼记录无效');};
 if(!raw||!(raw.room===null||Object.hasOwn(ROOMS,raw.room)))fail();l.room=raw.room;
 if(l.room&&ROOMS[l.room].parent!==s.expansion.region)fail();
 for(const k of ['rod','assist','dinner','invited','mailSorted']){if(typeof raw[k]!=='boolean')fail();l[k]=raw[k];}
 for(const k of ['catches','serial']){if(!Number.isInteger(raw[k])||raw[k]<0||raw[k]>1e8)fail();l[k]=raw[k];}
 if(!raw.chest||Array.isArray(raw.chest)||typeof raw.chest!=='object'||!raw.records||Array.isArray(raw.records)||typeof raw.records!=='object')fail();
 for(const[k,n]of Object.entries(raw.chest)){if(!Object.hasOwn(s.inventory,k)||!Number.isInteger(n)||n<0||n>1e6)fail();l.chest[k]=n;}
 let count=0;for(const[k,r]of Object.entries(raw.records)){
  if(!Object.hasOwn(FISH,k)||!r||!Number.isInteger(r.count)||r.count<1||r.count>1e8||!Number.isFinite(r.max)||r.max<FISH[k].min||r.max>FISH[k].max||!Number.isInteger(r.firstDay)||r.firstDay<1||r.firstDay>s.day||!['near','far'].includes(r.depth)||!['rain','clear'].includes(r.weather)||typeof r.night!=='boolean')fail();
  l.records[k]={count:r.count,max:r.max,firstDay:r.firstDay,depth:r.depth,weather:r.weather,night:r.night};count+=r.count;
 }
 if(count!==l.catches||l.catches>l.serial||l.catches&&!l.rod||l.invited&&!l.catches||l.dinner&&!l.invited||l.mailSorted&&!s.expansion.flags.metVera)fail();
 if(raw.pending!==null){const p=raw.pending;if(!p||!l.rod||p.id!==l.serial||!Object.hasOwn(FISH,p.fish)||!Number.isFinite(p.length)||p.length<FISH[p.fish].min||p.length>FISH[p.fish].max||!['near','far'].includes(p.depth)||typeof p.tutorial!=='boolean'||!Number.isInteger(p.day)||p.day<1||p.day>s.day||!['clear','rain'].includes(p.weather)||typeof p.night!=='boolean'||l.room||s.expansion.region!=='wharf')fail();}
 // Reload safely abandons an already paid cast; neither refund nor catch is granted.
 return l;
}
