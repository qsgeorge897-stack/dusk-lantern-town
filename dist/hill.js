import {ROOMS,sceneOf,nearRoomSpot} from './indoors.js?v=0.13.3';
import {REGIONS} from './regions.js?v=0.13.3';
export const HILL_ITEMS={tomatoSeed:{name:'番茄种子',color:'#bf634b'},mintSeed:{name:'薄荷种子',color:'#7c9f6c'},tomato:{name:'番茄',sell:6,color:'#c9583d'},mint:{name:'鲜薄荷',sell:4,color:'#81a777'},tomatoSoup:{name:'番茄浓汤',sell:30,color:'#c9744c'},mintTea:{name:'薄荷茶',sell:20,color:'#91b38c'}};
export const HILL_CROPS={tomato:{name:'番茄',seed:'tomatoSeed',yield:3,price:6},mint:{name:'薄荷',seed:'mintSeed',yield:4,price:5}};
export const HILL_RECIPES={tomatoSoup:{name:'番茄浓汤',need:{tomato:2,flour:1},give:{tomatoSoup:1},energy:4,minutes:15},mintTea:{name:'薄荷茶',need:{mint:2,driedHerb:1},give:{mintTea:1},energy:3,minutes:10}};
export const HILL_NOTES=[{id:'hillChime',name:'风铃树下的纸页',text:'左侧窗边日照长，番茄要留在那里。薄荷放右床，午后有山墙遮阴。'},{id:'hillLookout',name:'观景台的折页',text:'雨落进屋顶的槽，会顺着铜管走。槽接好以后，雨天不用再提水上山。'},{id:'hillPlaque',name:'旧石牌背面的记录',text:'从左向右：第一面朝东，第二面朝南，第三面朝东。灯光尽头，是留给晚归人的一张桌子。'}];
export const MIRROR_TARGET=[1,2,1],DIRECTIONS=['北','东','南','西'];
export const HILL_ORDERS={grow:{name:'厨房的一篮番茄',need:{tomato:3},coins:24},cook:{name:'晚归人的热汤',need:{tomatoSoup:1},coins:38},fish:{name:'会馆的普通鱼',need:{},coins:12}};
export const HILL_ACTIONS=['hillStart','hillNote','hillPlan','hillClear','hillWater','hillRotate','hillFocus','hillPlant','hillTend','hillHarvest','hillSeeds','hillRelief','hillCook','hillPrepare','hillInvite','hillLight','hillOrderAccept','hillOrderCancel','hillOrderDeliver','hillDecor'];
export const newHill=()=>({started:false,notes:[false,false,false],planned:false,cleared:false,water:false,mirrors:[0,0,0],light:false,beds:[{crop:null,growth:0,tended:false},{crop:null,growth:0,tended:false}],harvested:{tomato:false,mint:false},food:false,invited:false,lit:false,completedDay:0,order:{kind:null,day:0},decor:{lamp:false,painting:false}});
const need=(b,m)=>{if(!b)throw Error(m);};
function at(s,id){const p=REGIONS[sceneOf(s)]?.spots.find(q=>q.id===id);need(nearRoomSpot(s,id)||p&&Math.hypot(s.player.x-p.stand.x,s.player.y-p.stand.y)<110,'请先走到这个位置');}
export function hillCookReason(s,key){const r=HILL_RECIPES[key];if(!s.hill?.light)return '先修复温室并学会配方';if(!r)return '请选择食谱';const home=sceneOf(s)==='home';for(const[k,n]of Object.entries(r.need)){const have=s.inventory[k]+(home?(s.life.chest[k]||0):0);if(have<n)return '还缺'+(HILL_ITEMS[k]?.name||{flour:'面粉',driedHerb:'干香草'}[k])+' '+(n-have);}return s.energy<r.energy?'体力不足':'';}
export function hillOrderNeed(s,kind=s.hill.order.kind){if(kind==='fish'){const silver=Math.min(2,s.inventory.silver);return {silver,carp:2-silver};}return HILL_ORDERS[kind]?.need||{};}
export function hillAction(s,type,p,{pay,note}){
 const h=s.hill;need(s.town.flags.market,'先让公共夜市重新开张');
 if(!['hillStart'].includes(type))need(h.started,'先到广场告示板读温室来信');
 switch(type){
 case 'hillStart':at(s,'townBoard');need(!h.started,'已经收好来信了');h.started=true;note(s,'夜市后的来信提到山坡温室。那里每晚亮灯时，晚归的人就知道有人在等。旧果园北边的山路重新开放。');return '第二部 · 山坡上的灯 · 旧果园北侧山路开放';
 case 'hillNote':{const i=HILL_NOTES.findIndex(q=>q.id===p.id);need(i>=0,'这里没有笔记');at(s,p.id);need(!h.notes[i],'这一页已经收进手记');h.notes[i]=true;note(s,HILL_NOTES[i].text);return `温室笔记 ${h.notes.filter(Boolean).length}/3`;}
 case 'hillPlan':at(s,'greenBench');need(h.notes.every(Boolean),'先找齐三页固定笔记');need(!h.planned,'种植位置已经定好');need(p.left==='tomato'&&p.right==='mint','左窗日照长，留给番茄；右床午后遮阴，留给薄荷。可以重选，不消耗材料');h.planned=true;return '左床番茄，右床薄荷 · 可以开始修复';
 case 'hillClear':at(s,'greenVines');need(h.planned&&!h.cleared,'先读笔记确定布局；已经清理过的藤蔓不用再剪');pay(s,{energy:5,minutes:15});h.cleared=true;return '窗前的枯藤已经理好，日光能照进来了';
 case 'hillWater':at(s,'greenWater');need(h.planned&&!h.water,'先确定布局；供水只需修复一次');pay(s,{need:{wood:4,stone:2,resin:1},energy:6,minutes:20});h.water=true;return '屋顶集雨槽接通 · 雨天会自动照料幼苗';
 case 'hillRotate':{need(Number.isInteger(p.index)&&p.index>=0&&p.index<3,'请选择一面反光板');at(s,'greenMirror'+p.index);need(h.cleared&&h.water&&!h.light,'先整理藤蔓、接好水槽；固定后的支架不用再调整');h.mirrors[p.index]=(h.mirrors[p.index]+1)%4;return `第${p.index+1}面朝${DIRECTIONS[h.mirrors[p.index]]} · 转动不消耗`;}
 case 'hillFocus':at(s,'greenMirror1');need(h.cleared&&h.water&&!h.light,'先修复光照与供水');need(h.mirrors.every((x,i)=>x===MIRROR_TARGET[i]),'光路还没连通。笔记：东 → 南 → 东；转错可以免费重调');h.light=true;s.inventory.tomatoSeed+=2;s.inventory.mintSeed+=2;note(s,'温室接通了光与水。工作台留下两种种子各2包，以及番茄浓汤、薄荷茶配方。');return '育苗屋可用 · 两种种子各2包 · 学会两份食谱';
 case 'hillPlant':case 'hillTend':case 'hillHarvest':{
  need(Number.isInteger(p.index)&&p.index>=0&&p.index<2,'请选择一张育苗床');at(s,'greenBed'+p.index);need(h.light,'先修好温室');const b=h.beds[p.index],key=p.index?'mint':'tomato',c=HILL_CROPS[key];
  if(type==='hillPlant'){need(!b.crop,'先采收这一床作物');pay(s,{need:{[c.seed]:1},energy:2,minutes:5});b.crop=key;b.growth=0;b.tended=s.weather==='rain';return `种下${c.name} · 两个有照料的夜晚后成熟`;}
  if(type==='hillTend'){need(b.crop&&b.growth<2,'这张床还不需要浇水');need(!b.tended&&s.weather!=='rain','今天已经照料过了');pay(s,{energy:2,minutes:5});b.tended=true;return '幼苗喝饱了水 · 回家睡觉后生长';}
  need(b.crop&&b.growth===2,'再等有照料的夜晚，不会枯萎');pay(s,{give:{[key]:c.yield},energy:2,minutes:5});h.harvested[key]=true;h.beds[p.index]={crop:null,growth:0,tended:false};s.stats.harvests++;return `采收${c.name} ×${c.yield} · 可以重新播种`;
 }
 case 'hillSeeds':case 'hillRelief':{at(s,'greenBench');need(h.light&&Object.hasOwn(HILL_CROPS,p.crop),'温室修好后可补种');const c=HILL_CROPS[p.crop];if(type==='hillRelief'){need(!h.harvested[p.crop]&&!h.beds[p.crop==='mint'?1:0].crop&&s.inventory[c.seed]+(s.life.chest[c.seed]||0)===0&&s.coins<c.price,'先使用现有种子、储备或金币');s.inventory[c.seed]++;return '补给一包'+c.name+'种子 · 第一份收成仍在等你';}need(s.coins>=c.price,'金币不足，可以卖些收成');s.coins-=c.price;s.inventory[c.seed]++;return c.name+'种子 ×1';}
 case 'hillCook':{
  const room=sceneOf(s);need(['home','hall','greenhouse'].includes(room),'请到厨房或温室工作台');at(s,{home:'stove',hall:'hallKitchen',greenhouse:'greenBench'}[room]);const reason=hillCookReason(s,p.recipe);need(!reason,reason);const r=HILL_RECIPES[p.recipe];for(const[k,n]of Object.entries(r.need)){const take=Math.min(s.inventory[k],n);s.inventory[k]-=take;if(take<n)s.life.chest[k]-=n-take;}pay(s,{give:r.give,energy:r.energy,minutes:r.minutes});s.stats.crafted++;return r.name+'做好了';
 }
 case 'hillPrepare':at(s,'greenBench');need(h.harvested.tomato&&h.harvested.mint&&!h.food,'先收获两种作物；已留下的食物不会重复扣除');pay(s,{need:{tomatoSoup:1,mintTea:1}});h.food=true;return '一碗汤、一杯茶妥善放好 · 去广场留邀请';
 case 'hillInvite':at(s,'townBoard');need(h.food&&!h.invited,'先备好温室的汤和茶，邀请只需留一次');h.invited=true;note(s,'把山坡点灯的邀请留在会馆来信旁。任选一个18:00以后的晚上，到温室点灯。');return '街坊收到邀请 · 晚间到温室点灯，不限日期';
 case 'hillLight':at(s,'greenLamp');need(h.invited&&!h.lit,'先把邀请留在广场；这盏灯已经亮过了');need(s.minute>=1080,'18:00后再点灯，明天来也可以');h.lit=true;h.completedDay=s.day;s.coins+=60;note(s,'山坡上的灯重新亮起。育苗屋会继续照料小苗，也给晚归的人留一盏灯。获得60金币、家中铜灯和纪念画。');return '山坡上的灯 · 完成 · 60金币与家居纪念';
 case 'hillOrderAccept':at(s,'townBoard');need(h.lit,'点灯后开放新的街坊订单');need(Object.hasOwn(HILL_ORDERS,p.kind),'请选择一种委托');need(!h.order.kind,'先完成或取消手上的委托');need(h.order.day!==s.day,'今天已经交付一单，明天再来');h.order.kind=p.kind;return '已接委托 · 不限完成日期，随时可取消';
 case 'hillOrderCancel':at(s,'townBoard');need(!!h.order.kind,'没有待办委托');h.order.kind=null;return '已放回委托，不扣材料';
 case 'hillOrderDeliver':{at(s,'townBoard');need(h.lit&&h.order.kind&&h.order.day!==s.day,'今天没有可交付的委托');const r=HILL_ORDERS[h.order.kind];pay(s,{need:hillOrderNeed(s)});s.coins+=r.coins;h.order.day=s.day;h.order.kind=null;return r.name+'已交付 · '+r.coins+'金币';}
 case 'hillDecor':at(s,'keepsake');need(h.lit&&['lamp','painting'].includes(p.key),'先完成山坡点灯，解锁家居纪念');h.decor[p.key]=!h.decor[p.key];return h.decor[p.key]?'已放好这件纪念':'暂时收好，可以随时再挂';
 default:throw Error('未知温室操作');
 }
}
export function hillSleep(s){const h=s.hill;if(!h?.light)return;for(const b of h.beds){if(b.crop&&b.growth<2&&(b.tended||s.weather==='rain'))b.growth++;b.tended=false;}}
export function hillObjective(s){const h=s.hill||newHill(),base=(title,body,target)=>({chapter:'第二部 / 山坡上的灯',title,body,target,checks:[['找回三页笔记',h.notes.every(Boolean)],['修复供水与光路',h.light],['采收两种作物',h.harvested.tomato&&h.harvested.mint],['山坡点灯',h.lit]]});
 if(!h.started)return base('夜市后，又一封来信','去广场告示板读一读，旧果园北边还有一条路。','townBoard');
 const missingNote=h.notes.findIndex(x=>!x);if(missingNote>=0)return base('找回温室记录',`沿风铃山坡找三页笔记，已找到${h.notes.filter(Boolean).length}/3。`,HILL_NOTES[missingNote].id);
 if(!h.planned)return base('让幼苗找到位置','在温室工作台重读笔记，安排番茄与薄荷。','greenBench');
 if(!h.cleared)return base('先把日光请进来','整理温室左侧的枯藤，体力5。','greenVines');
 if(!h.water)return base('接通屋顶集雨槽','木材4、石料2、松脂1。雨水也会帮忙。',s.inventory.wood<4?'wood':s.inventory.stone<2?'stone':s.inventory.resin<1?'resinTree':'greenWater');
 if(!h.light)return base('沿着光的方向','反光板从左到右：东、南、东。转好后到中间固定支架。','greenMirror1');
 for(const [i,key]of ['tomato','mint'].entries())if(!h.harvested[key]){const b=h.beds[i];return base('第一床'+HILL_CROPS[key].name,!b.crop?'到育苗床播种；种子在工作台补给。':b.growth===2?'已经成熟，采收后准备大家的汤与茶。':`已照料过夜${b.growth}/2。${b.tended||s.weather==='rain'?'今天已经照料，回家睡觉。':'先给这一床浇水，再回家过夜。'}`,!b.crop&&s.inventory[HILL_CROPS[key].seed]===0?'greenBench':b.crop&&b.growth<2&&(b.tended||s.weather==='rain')?'bed':'greenBed'+i);}
 if(!h.food)return base('给晚归的人留一份','在家中、会馆或温室做番茄浓汤与薄荷茶，再送到温室工作台。','greenBench');
 if(!h.invited)return base('把邀请留给街坊','回广场告示板，约好任意一个晚上上山。','townBoard');
 if(!h.lit)return base('山坡上的灯','18:00后到温室点灯。没有截止日期，也不需要战斗。','greenLamp');
 return {...base('山路尽头，有人在等','温室继续生产，广场有新订单，家中可以挂上纪念。','greenBench'),complete:true};
}
export function readHill(raw,s){
 const h=newHill(),bad=()=>{throw Error('存档温室进度无效');};if(raw===undefined){if(s.expansion.visited.hillside||s.life.room==='greenhouse')bad();return h;}if(!raw||typeof raw!=='object'||Array.isArray(raw))bad();
 for(const k of ['started','planned','cleared','water','light','food','invited','lit']){if(typeof raw[k]!=='boolean')bad();h[k]=raw[k];}
 if(!Array.isArray(raw.notes)||raw.notes.length!==3||raw.notes.some(x=>typeof x!=='boolean'))bad();h.notes=[...raw.notes];
 if(!Array.isArray(raw.mirrors)||raw.mirrors.length!==3||raw.mirrors.some(x=>!Number.isInteger(x)||x<0||x>3))bad();h.mirrors=[...raw.mirrors];
 if(!Array.isArray(raw.beds)||raw.beds.length!==2)bad();h.beds=raw.beds.map((b,i)=>{if(!b||![null,i?'mint':'tomato'].includes(b.crop)||!Number.isInteger(b.growth)||b.growth<0||b.growth>2||typeof b.tended!=='boolean'||!b.crop&&(b.growth||b.tended))bad();return {crop:b.crop,growth:b.growth,tended:b.tended};});
 for(const [group,keys]of [['harvested',['tomato','mint']],['decor',['lamp','painting']]])for(const k of keys){if(typeof raw[group]?.[k]!=='boolean')bad();h[group][k]=raw[group][k];}
 if(!Number.isInteger(raw.completedDay)||raw.completedDay<0||raw.completedDay>s.day)bad();h.completedDay=raw.completedDay;
 const o=raw.order;if(!o||!(o.kind===null||Object.hasOwn(HILL_ORDERS,o.kind))||!Number.isInteger(o.day)||o.day<0||o.day>s.day)bad();h.order={kind:o.kind,day:o.day};
 if(h.started&&!s.town.flags.market||!h.started&&(h.notes.some(Boolean)||s.expansion.visited.hillside)||h.planned&&(!h.notes.every(Boolean)||!h.started)||(h.cleared||h.water)&&!h.planned||h.mirrors.some(Boolean)&&(!h.cleared||!h.water)||h.light&&(!h.cleared||!h.water||!h.mirrors.every((x,i)=>x===MIRROR_TARGET[i]))||(h.beds.some(b=>b.crop)||Object.values(h.harvested).some(Boolean))&&!h.light||h.food&&(!h.harvested.tomato||!h.harvested.mint)||h.invited&&!h.food||h.lit&&!h.invited||!!h.completedDay!==h.lit||(h.order.kind||h.order.day||h.decor.lamp||h.decor.painting)&&!h.lit)bad();return h;
}
