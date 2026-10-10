import {nearRoomSpot} from './indoors.js?v=0.13.3';
import {REGIONS,REGION_ORDER,regionOf} from './regions.js?v=0.13.3';
export const EXPANSION_ITEMS={herb:{name:'月露草',color:'#8ea780',sell:3,icon:'herb'},resin:{name:'松脂',color:'#d4a466',sell:4,icon:'resin'},driedHerb:{name:'干香草',color:'#a2a574',sell:8,icon:'driedHerb'},tea:{name:'林间花茶',color:'#b8c6a0',sell:25,icon:'tea'}};
export const EXPANSION_RECIPES={driedHerb:{name:'晾制干香草',need:{herb:2},give:{driedHerb:1},energy:2,minutes:10,region:'forest',spot:'kettle'},tea:{name:'煮林间花茶',need:{driedHerb:1,honey:1},give:{tea:1},energy:3,minutes:10,region:'forest',spot:'kettle'},beacon:{name:'修复引航灯',need:{wood:4,stone:2,resin:2},energy:8,minutes:20,region:'wharf',spot:'beacon'},postbox:{name:'修复邮局信箱',need:{wood:4,stone:2,resin:2},energy:6,minutes:15,region:'wharf',spot:'postbox'}};
export const EXPANSION_FLAGS=['trail','beacon','metVera','ledger','reply','postbox','posted','veraDeparted'];
export function newExpansion(){return {region:'farm',visited:{farm:true,forest:false,wharf:false,waterworks:false,town:false,orchard:false,hillside:false,oldworks:false},flags:Object.fromEntries(EXPANSION_FLAGS.map(k=>[k,false])),daily:{herb:0,resin:0},drying:false};}
export function atPlace(s,region,id){
 if(regionOf(s)!==region)throw Error(`请先前往${REGIONS[region].name}`);
 if(id){const spot=REGIONS[region].spots.find(p=>p.id===id),p=spot?.stand||spot;if(!p||Math.hypot(s.player.x-p.x,s.player.y-p.y)>110)throw Error('请走到目标旁再互动');}
}
function need(f,key,message){if(!f[key])throw Error(message);}
function once(f,key){if(f[key])throw Error('这件事已经完成了');}
export function expansionCraft(s,key,pay,note){
 const r=EXPANSION_RECIPES[key],f=s.expansion.flags;atPlace(s,r.region,r.spot);
 if(['beacon','postbox'].includes(key)){once(f,key);if(key==='beacon')need(f,'trail','先调查林间的旧邮册箱');if(key==='postbox')need(f,'metVera','先听听薇拉的心愿');}
 pay(s,r);if(['beacon','postbox'].includes(key)){f[key]=true;note(s,r.name+'完成。');}else s.stats.crafted++;
 return r.name+'完成';
}
export function expansionAction(s,type,payload,{pay,note,ghostReady}){
 const e=s.expansion,f=e.flags;
 switch(type){
  case 'travel':{
   const from=regionOf(s),to=payload.region;if(to==='oldworks'&&!s.archive?.started)throw Error('先读广场告示板上的封存清单');if(to==='hillside'&&!s.hill?.started)throw Error('夜市后，先读广场告示板上的温室来信');if(to==='waterworks'&&(!s.water?.started||!s.water?.gear))throw Error('先调查两处水源线索，再到露西柜台制作巡查装备');if(!REGION_ORDER.includes(to)||to===from)throw Error('请选择另一个可前往的区域');if(!s.flags.metLucy)throw Error('先和露西打声招呼，再沿南桥探索');
   if(payload.fast){need(f,'posted','恢复邮路后，才能使用路牌快速旅行');if(!e.visited[to])throw Error('先步行发现这个区域');}
   else{const exit=REGIONS[from].spots.find(p=>p.to===to);if(!exit)throw Error('两地之间没有直接道路');const p=exit.stand||exit;if(Math.hypot(s.player.x-p.x,s.player.y-p.y)>100)throw Error('先走到区域出口');}
   e.region=to;e.visited[to]=true;s.player={...(payload.fast?REGIONS[to].entry:REGIONS[to].entryFrom?.[from]||REGIONS[to].entry)};s.minute=Math.min(1320,s.minute+10);return `抵达${REGIONS[to].name} · 路途 10 分钟`;
  }
  case 'forage':{
   const key=payload.resource,limit=key==='herb'?3:key==='resin'?2:0;if(!limit)throw Error('这里没有这种资源');atPlace(s,'forest',key==='herb'?'herbs':'resinTree');if(e.daily[key]>=limit)throw Error('今天已经采完了，睡一觉后会补充');pay(s,{energy:3,minutes:5});s.inventory[key]+=2;e.daily[key]++;return `获得${EXPANSION_ITEMS[key].name} ×2`;
  }
  case 'trail':atPlace(s,'forest','ledger');once(f,'trail');f.trail=true;note(s,'在雾松林发现旧邮路。邮册封面画着一只铜燕子。');return '发现旧邮路 · 渡口的引航灯已经熄灭很久';
  case 'meetVera':atPlace(s,'wharf','vera');once(f,'metVera');need(f,'beacon','先修复引航灯');if(!s.flags.festival)throw Error('先恢复小镇的丰收节，让歌声沿河传开');ghostReady(s);pay(s,{need:{tea:1}});f.metVera=true;e.drying=true;note(s,'花茶唤回幽灵邮差薇拉。她告诉我旧邮册箱的暗格，夜间晾草帮工已开启。');return '薇拉想起了回程的路 · 晾草帮工已开启';
  case 'ledger':atPlace(s,'forest','ledger');need(f,'metVera','先听薇拉说起邮册暗格');once(f,'ledger');f.ledger=true;note(s,'回程邮册写着：所有信件已经送达。袋底留下的是村民写给薇拉的信。');return '找到回程邮册 · 这些信的收件人是薇拉';
  case 'reply':atPlace(s,'farm');if(s.life?.room==='shop'?!nearRoomSpot(s,'indoorLucy'):Math.hypot(s.player.x-197,s.player.y-286)>110)throw Error('先到街角找露西');need(f,'ledger','先找到回程邮册');once(f,'reply');f.reply=true;note(s,'露西收集了大家的新回信：“路上慢一些，回来一起吃饭。”');return '得到村民回信 · 请放进修复后的渡口信箱';
  case 'postReply':atPlace(s,'wharf','postbox');need(f,'postbox','先修复邮局信箱');need(f,'reply','先向露西取回村民回信');once(f,'posted');f.posted=true;s.coins+=80;note(s,'村民回信抵达渡口。邮路重新开放，获得 80 金币，已发现区域可快速旅行。');return '邮路恢复 · 获得 80 金币 · 快速旅行已开放';
  case 'departVera':if(s.life?.room==='post'){if(!nearRoomSpot(s,'indoorVera'))throw Error('先走到薇拉身边');}else atPlace(s,'wharf','vera');need(f,'posted','薇拉还在等村民的回信');once(f,'veraDeparted');ghostReady(s);f.veraDeparted=true;note(s,'薇拉安心远行，留下燕羽晾草架。第二章完成，晾草能力永久保留。');return '薇拉留下燕羽晾草架，回程终于不再空着';
  case 'drying':atPlace(s,'forest','kettle');need(f,'metVera','先唤回薇拉的记忆');e.drying=!e.drying;return `晾草${e.drying?'已开启':'已暂停'}`;
  default:throw Error('这个操作暂时无法完成');
 }
}
export function expansionObjective(s){
 const f=s.expansion?.flags||newExpansion().flags,inv=s.inventory,base=(title,body,target,checks)=>({chapter:'第二章 / 没有退回的信',title,body,target,checks});
 if(!f.trail)return base('沿南桥寻找旧邮路','雾松林的旧邮册箱旁，留着一枚铜燕子。','ledger',[['调查旧邮册箱',false]]);
 if(!f.beacon)return base('点亮旧渡口的引航灯','收集木材 4、石料 2、松脂 2，到旧渡口修复引航灯。',inv.wood<4?'wood':inv.stone<2?'stone':inv.resin<2?'resinTree':'beacon',[['发现旧邮路',true],['修复引航灯',false]]);
 if(!s.flags.festival)return base('让歌声抵达河岸','先恢复庄园的丰收节，再去寻找河边的身影。','table',[['点亮引航灯',true],['恢复丰收节',false]]);
 if(!f.metVera)return base('为河边的邮差煮一杯茶','草药晾成干香草，与蜂蜜煮茶。夜晚持灯到旧渡口。',inv.tea>0?'vera':inv.driedHerb<1&&inv.herb<2?'herbs':inv.honey<1?'honey':'kettle',[['引航灯修好',true],[`林间花茶 ${Math.min(inv.tea||0,1)}/1`,inv.tea>0],['夜晚持灯',s.minute>=1080&&s.lantern]]);
 if(!f.ledger)return base('寻找回程邮册','薇拉说暗格就在林间旧邮册箱的底层。','ledger',[['认识薇拉',true],['取出回程邮册',false]]);
 if(!f.reply)return base('请露西读一读这些信','它们不是没送出的信，而是寄给邮差的回信。','lucy',[['找到邮册',true],['收集村民回信',false]]);
 if(!f.postbox)return base('修复渡口信箱','木材 4、石料 2、松脂 2。让回信有一个可以到达的地方。',inv.wood<4?'wood':inv.stone<2?'stone':inv.resin<2?'resinTree':'postbox',[['村民回信已备好',true],['修复信箱',false]]);
 if(!f.posted)return base('把回信送到渡口','把村民的回信放进信箱，重新接通这条邮路。','postbox',[['信箱已修好',true],['寄出回信',false]]);
 if(!f.veraDeparted)return base('让薇拉自己选择回程','夜晚提灯去见她。可以道别，也可以让她再留一阵。','vera',[['邮路已恢复',true],['与薇拉告别',false]]);
 return {...base('两岸都有等你的人','邮路和晾草架都在运转。继续照料你的庄园吧。','kettle',[['邮路恢复',true],['永久晾草架',true]]),chapter:'第二章 / 已完成'};
}
export function readExpansion(raw,s,num){
 if(raw===undefined)return newExpansion();
 if(!raw||!REGION_ORDER.includes(raw.region))throw Error('存档区域无效');const e=newExpansion();e.region=raw.region;
 for(const k of REGION_ORDER){if(['waterworks','town','orchard','hillside','oldworks'].includes(k)&&raw.visited?.[k]===undefined){e.visited[k]=false;continue;}if(typeof raw.visited?.[k]!=='boolean')throw Error('存档探索记录无效');e.visited[k]=raw.visited[k];}if(!e.visited.farm||!e.visited[e.region])throw Error('存档当前位置尚未探索');
 for(const k of EXPANSION_FLAGS){if(typeof raw.flags?.[k]!=='boolean')throw Error('存档邮路任务无效');e.flags[k]=raw.flags[k];}
 for(const [k,max]of [['herb',3],['resin',2]]){if(!num(raw.daily?.[k],0,max)||!Number.isInteger(raw.daily[k]))throw Error('存档林地采集次数无效');e.daily[k]=raw.daily[k];}
 if(typeof raw.drying!=='boolean')throw Error('存档晾草状态无效');e.drying=raw.drying;const f=e.flags;
 if(f.beacon&&!f.trail||f.metVera&&(!f.beacon||!s.flags.festival)||f.ledger&&!f.metVera||f.reply&&!f.ledger||f.postbox&&!f.metVera||f.posted&&(!f.postbox||!f.reply)||f.veraDeparted&&!f.posted||e.drying&&!f.metVera)throw Error('存档邮路进度不完整');
 if(e.visited.waterworks&&!e.visited.forest||e.visited.wharf&&!e.visited.forest||f.trail&&!e.visited.forest||f.beacon&&!e.visited.wharf||(e.daily.herb>0||e.daily.resin>0)&&!e.visited.forest)throw Error('存档探索与邮路记录不一致');
 if(e.visited.oldworks&&!e.visited.waterworks)throw Error('存档外渠路线不完整');
 if(e.visited.hillside&&!e.visited.orchard)throw Error('存档山坡路线不完整');
 if(e.visited.orchard&&!e.visited.town)throw Error('存档果园路线不完整');
 if((e.region!=='farm'||e.visited.forest||e.visited.wharf||e.visited.town||e.visited.orchard)&&!s.flags.metLucy)throw Error('存档探索前置不完整');return e;
}
